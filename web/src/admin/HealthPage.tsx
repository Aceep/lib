import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import { correctBook, fetchLibraryHealth, mergeAuthors } from "../api/client.js";
import type { AuthorlessBook, MissingField, SyncRun } from "../api/types.js";
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

/** Books credited to nobody: the folder of the file usually names the author, one click accepts it. */
function AuthorlessBooks({ books, onChanged }: { books: AuthorlessBook[]; onChanged: (message: string) => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const withSuggestion = books.filter((book) => book.suggestedAuthor !== null);

  async function apply(targets: AuthorlessBook[]) {
    setIsBusy(true);
    setErrorMessage(null);
    let done = 0;
    try {
      for (const book of targets) {
        if (book.suggestedAuthor !== null) {
          await correctBook(book.id, { title: book.title, authors: [book.suggestedAuthor], series: book.series, seriesIndex: book.seriesIndex });
          done++;
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
    setIsBusy(false);
    if (done > 0) {
      onChanged(`${countLabel(done, "livre a", "livres ont")} retrouvé un auteur.`);
    }
  }

  return (
    <>
      {withSuggestion.length > 1 ? (
        <p className="merge-actions">
          <button type="button" disabled={isBusy} onClick={() => void apply(withSuggestion)}>
            Attribuer les {withSuggestion.length} auteurs proposés
          </button>
        </p>
      ) : null}
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <ul className="record-list">
        {books.map((book) => (
          <li key={book.id}>
            <span className="record-main">
              <Link to={`/books/${book.id}`}>{book.title}</Link>
              <span className="record-secondary"> — {book.authors.length > 0 ? `noté « ${book.authors.join(", ")} »` : "aucun auteur"}</span>
            </span>
            <code className="record-secondary">{book.filePath}</code>
            {book.suggestedAuthor !== null ? (
              <span className="merge-actions">
                <span className="record-secondary">D'après le dossier :</span>
                <button type="button" disabled={isBusy} onClick={() => void apply([book])}>
                  Attribuer à {book.suggestedAuthor}
                </button>
              </span>
            ) : (
              <span className="record-secondary">Le dossier ne dit pas qui l'a écrit : ouvrez la fiche pour saisir l'auteur.</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export function HealthPage({ onLibraryChanged }: { onLibraryChanged: () => void }) {
  useDocumentTitle("Santé de la bibliothèque");
  const health = useAsync((signal) => fetchLibraryHealth(signal), []);
  const [mergeMessage, setMergeMessage] = useState<string | null>(null);
  const [authorMessage, setAuthorMessage] = useState<string | null>(null);

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
  const { bookCount, invalidFiles, incompleteBooks, similarAuthors, authorlessBooks, probableDuplicates, syncRuns } = health.data;

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

      {authorMessage ? (
        <p className="form-success" role="status">
          {authorMessage}
        </p>
      ) : null}
      <Section title="Livres sans auteur" count={authorlessBooks.length} emptyText="Chaque livre a un auteur.">
        <AuthorlessBooks
          books={authorlessBooks}
          onChanged={(message) => {
            setAuthorMessage(message);
            health.reload();
            onLibraryChanged();
          }}
        />
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

      <Section title="Livres en double probable" count={probableDuplicates.length} emptyText="Aucun livre n'apparaît deux fois.">
        <p className="record-secondary">Même titre et un auteur en commun, dans des fichiers différents. Ouvrez une fiche pour la supprimer : le fichier part dans la corbeille.</p>
        <ul className="record-list">
          {probableDuplicates.map((group) => (
            <li key={group.books.map((book) => book.id).join("-")}>
              {group.books.map((book) => (
                <span key={book.id} className="record-main">
                  <Link to={`/books/${book.id}`}>{book.title}</Link>
                  <span className="record-secondary">
                    {" "}
                    — {authorsLabel(book.authors)} · {fileSizeLabel(book.fileSize)} · <code>{book.filePath}</code>
                  </span>
                </span>
              ))}
            </li>
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
