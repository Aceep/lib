import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import { fetchLibraryHealth, mergeAuthors } from "../api/client.js";
import type { MissingField, SyncRun } from "../api/types.js";
import { authorsLabel, countLabel, dateTimeLabel, fileSizeLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const MISSING_LABELS: Record<MissingField, string> = { cover: "couverture", language: "langue", description: "résumé" };
const SYNC_STATUS_LABELS: Record<SyncRun["status"], string> = { running: "En cours", succeeded: "Réussie", failed: "Échouée" };

function Section({ title, count, emptyText, children }: { title: string; count: number; emptyText: string; children: ReactNode }) {
  return (
    <section className="admin-section">
      <h2>
        {title} <span className="count-badge is-muted">{count}</span>
      </h2>
      {count === 0 ? <p className="record-secondary">{emptyText}</p> : children}
    </section>
  );
}

function syncSummary(run: SyncRun): string {
  if (run.error) {
    return run.error;
  }
  if (!run.report) {
    return "";
  }
  const { added, updated, removed, failures } = run.report;
  const parts = [`${added} ajoutés`, `${updated} mis à jour`, `${removed} retirés`];
  if (failures.length > 0) {
    parts.push(countLabel(failures.length, "fichier illisible", "fichiers illisibles"));
  }
  return parts.join(", ");
}

type AuthorGroup = { name: string; bookCount: number }[];

/** One click per group: every spelling becomes the chosen one, on all the books concerned. */
function SimilarAuthorsGroup({ names, onMerged }: { names: AuthorGroup; onMerged: (message: string) => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleMerge(into: string) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const result = await mergeAuthors(
        names.map((author) => author.name),
        into,
      );
      onMerged(`${countLabel(result.changedBooks, "livre")} désormais sous « ${result.into} ».`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsBusy(false);
    }
  }

  return (
    <li>
      <span className="record-main">
        {names.map((author, index) => (
          <span key={author.name}>
            {index > 0 ? " · " : null}
            <Link to={`/?${new URLSearchParams({ author: author.name })}`}>{author.name}</Link> ({author.bookCount})
          </span>
        ))}
      </span>
      <span className="merge-actions">
        <span className="record-secondary">Tout regrouper sous :</span>
        {names.map((author) => (
          <button key={author.name} type="button" disabled={isBusy} onClick={() => void handleMerge(author.name)}>
            {author.name}
          </button>
        ))}
      </span>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </li>
  );
}

export function HealthPage({ onLibraryChanged }: { onLibraryChanged: () => void }) {
  useDocumentTitle("Santé de la bibliothèque");
  const health = useAsync((signal) => fetchLibraryHealth(signal), []);
  const [mergeMessage, setMergeMessage] = useState<string | null>(null);

  if (health.status === "error") {
    return (
      <p className="error" role="alert">
        Impossible de charger le rapport : {health.error.message}
      </p>
    );
  }
  if (!health.data) {
    return null;
  }
  const { bookCount, invalidFiles, incompleteBooks, similarAuthors, syncRuns } = health.data;

  return (
    <>
      <header className="page-header">
        <h1>Santé de la bibliothèque</h1>
        <p className="page-subtitle">{countLabel(bookCount, "livre indexé", "livres indexés")}</p>
      </header>

      <Section title="Fichiers illisibles" count={invalidFiles.length} emptyText="Tous les EPUB ont pu être lus.">
        <ul className="record-list">
          {invalidFiles.map((file) => (
            <li key={file.filePath}>
              <code className="record-main">{file.filePath}</code>
              <span className="record-secondary">
                {file.error} · {fileSizeLabel(file.fileSize)} · vu le {dateTimeLabel(file.detectedAt)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Auteurs en double probable" count={similarAuthors.length} emptyText="Aucun nom d'auteur ne ressemble à un autre.">
        {mergeMessage ? (
          <p className="form-success" role="status">
            {mergeMessage}
          </p>
        ) : null}
        <ul className="record-list">
          {similarAuthors.map((group) => (
            <SimilarAuthorsGroup
              key={group.names.map((author) => author.name).join("|")}
              names={group.names}
              onMerged={(message) => {
                setMergeMessage(message);
                health.reload();
                onLibraryChanged();
              }}
            />
          ))}
        </ul>
      </Section>

      <Section title="Fiches incomplètes" count={incompleteBooks.length} emptyText="Chaque livre a une couverture, une langue et un résumé.">
        <ul className="record-list">
          {incompleteBooks.map((book) => (
            <li key={book.id}>
              <span className="record-main">
                <Link to={`/books/${book.id}`}>{book.title}</Link>
                <span className="record-secondary"> — {authorsLabel(book.authors)}</span>
              </span>
              <span className="record-secondary">sans {book.missing.map((field) => MISSING_LABELS[field]).join(", ")}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Dernières synchros" count={syncRuns.length} emptyText="Aucune synchro n'a encore tourné.">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Début</th>
                <th scope="col">Origine</th>
                <th scope="col">État</th>
                <th scope="col">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {syncRuns.map((run) => (
                <tr key={run.id}>
                  <td>{dateTimeLabel(run.startedAt)}</td>
                  <td>{run.trigger === "manual" ? "Manuelle" : "Planifiée"}</td>
                  <td>
                    <span className={`status-tag is-${run.status}`}>{SYNC_STATUS_LABELS[run.status]}</span>
                  </td>
                  <td className="data-table-wide">{syncSummary(run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
