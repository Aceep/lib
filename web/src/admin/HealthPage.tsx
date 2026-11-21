import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import { correctBook, fetchLibraryHealth, fetchSeriesSuggestions, mergeAuthors, rewriteAuthor, setBooksLanguage } from "../api/client.js";
import type { AuthorFix, AuthorlessBook, LibraryHealth, MissingField, SeriesSuggestion, SwappedBook, SyncRun } from "../api/types.js";
import { authorsLabel, countLabel, dateTimeLabel, fileSizeLabel, languageLabel } from "../shared/format.js";
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

/** Runs `action` on each item in turn and reports how many went through before any failure. */
function useBatch<T>(action: (item: T) => Promise<unknown>, onDone: (count: number) => void) {
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function run(items: T[]) {
    setIsBusy(true);
    setErrorMessage(null);
    let done = 0;
    try {
      for (const item of items) {
        await action(item);
        done++;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
    setIsBusy(false);
    if (done > 0) {
      onDone(done);
    }
  }

  const error = errorMessage ? (
    <p className="error" role="alert">
      {errorMessage}
    </p>
  ) : null;
  return { isBusy, run, error };
}

/** Books tagged the wrong way round: the title holds the author and the author field holds the title. */
function SwappedBooks({ books, onChanged }: { books: SwappedBook[]; onChanged: (message: string) => void }) {
  const batch = useBatch<SwappedBook>(
    (book) => correctBook(book.id, { title: book.suggestedTitle, authors: book.suggestedAuthors, series: book.series, seriesIndex: book.seriesIndex }),
    (count) => onChanged(`${countLabel(count, "fiche remise", "fiches remises")} à l'endroit.`),
  );

  return (
    <>
      {books.length > 1 ? (
        <p className="merge-actions">
          <button type="button" disabled={batch.isBusy} onClick={() => void batch.run(books)}>
            Tout inverser ({books.length})
          </button>
        </p>
      ) : null}
      {batch.error}
      <ul className="record-list">
        {books.map((book) => (
          <li key={book.id}>
            <span className="record-main">
              <Link to={`/books/${book.id}`}>{book.title}</Link>
              <span className="record-secondary"> — noté comme écrit par « {book.authors.join(", ")} »</span>
            </span>
            <span className="merge-actions">
              <span className="record-secondary">
                Deviendrait : « {book.suggestedTitle} », de {book.suggestedAuthors.join(" et ")}
              </span>
              <button type="button" disabled={batch.isBusy} onClick={() => void batch.run([book])}>
                Inverser
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Author fields to rewrite: "Atwood, Margaret", "Philippe BESSON", "Aurélien Barrau et Louis Schweitzer". */
function AuthorFixes({ fixes, onChanged }: { fixes: AuthorFix[]; onChanged: (message: string) => void }) {
  const batch = useBatch<AuthorFix>(
    (fix) => rewriteAuthor(fix.name, fix.people),
    (count) => onChanged(`${countLabel(count, "nom d'auteur corrigé", "noms d'auteurs corrigés")}.`),
  );
  const certain = fixes.filter((fix) => fix.certain);

  return (
    <>
      <p className="merge-actions">
        <button type="button" disabled={batch.isBusy || certain.length === 0} onClick={() => void batch.run(certain)}>
          Tout corriger ({certain.length})
        </button>
        <span className="record-secondary">Les noms « à vérifier » ne sont pas inclus : l'ordre des mots y est seulement deviné.</span>
      </p>
      {batch.error}
      <ul className="record-list">
        {fixes.map((fix) => (
          <li key={fix.name}>
            <span className="record-main">
              <Link to={`/?${new URLSearchParams({ author: fix.name })}`}>{fix.name}</Link> ({fix.bookCount})
              <span className="record-secondary"> → </span>
              {fix.people.join(" + ")}
              {fix.certain ? null : <span className="status-tag is-running"> à vérifier</span>}
            </span>
            <span className="merge-actions">
              <button type="button" disabled={batch.isBusy} onClick={() => void batch.run([fix])}>
                Corriger
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Series read in the titles themselves ("L'Assassin Royal-10-Serments et Deuils"). Accepted one series at a
 * time, or all at once; the title can lose the series and volume number it no longer needs to carry.
 */
function SeriesSuggestions({ suggestions, onChanged }: { suggestions: SeriesSuggestion[]; onChanged: (message: string) => void }) {
  const [isBusy, setIsBusy] = useState(false);
  const [shortenTitles, setShortenTitles] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const groups = new Map<string, SeriesSuggestion[]>();
  for (const suggestion of suggestions) {
    groups.set(suggestion.series, [...(groups.get(suggestion.series) ?? []), suggestion]);
  }

  async function apply(targets: SeriesSuggestion[]) {
    setIsBusy(true);
    setErrorMessage(null);
    let done = 0;
    try {
      for (const suggestion of targets) {
        await correctBook(suggestion.bookId, {
          title: shortenTitles && suggestion.shorterTitle !== null ? suggestion.shorterTitle : suggestion.title,
          authors: suggestion.authors,
          series: suggestion.series,
          seriesIndex: suggestion.seriesIndex,
        });
        done++;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
    setIsBusy(false);
    if (done > 0) {
      onChanged(`${countLabel(done, "livre rangé", "livres rangés")} dans sa série.`);
    }
  }

  return (
    <>
      <p className="merge-actions">
        <label>
          <input type="checkbox" checked={shortenTitles} onChange={(event) => setShortenTitles(event.target.checked)} /> Retirer aussi la série et
          le numéro du titre
        </label>
        <button type="button" disabled={isBusy} onClick={() => void apply(suggestions)}>
          Tout accepter ({suggestions.length})
        </button>
      </p>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <ul className="record-list">
        {[...groups].map(([series, volumes]) => (
          <li key={series}>
            <span className="record-main">
              <strong>{series}</strong>
              <span className="record-secondary"> — {authorsLabel(volumes[0]?.authors ?? [])}</span>
            </span>
            <ul className="suggestion-volumes">
              {volumes.map((volume) => (
                <li key={volume.bookId}>
                  {volume.seriesIndex !== null ? `Tome ${volume.seriesIndex} : ` : null}
                  <Link to={`/books/${volume.bookId}`}>{volume.title}</Link>
                  {shortenTitles && volume.shorterTitle !== null ? <span className="record-secondary"> → « {volume.shorterTitle} »</span> : null}
                  {volume.source === "wikidata" ? <span className="record-secondary"> (d'après Wikidata)</span> : null}
                </li>
              ))}
            </ul>
            <span className="merge-actions">
              <button type="button" disabled={isBusy} onClick={() => void apply(volumes)}>
                Accepter {volumes.length > 1 ? `ces ${volumes.length} tomes` : "ce tome"}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

const COMMON_LANGUAGES = ["fr", "en", "es", "it", "de"];

/** EPUBs that declare no language: tick the ones written in the chosen language and file them at once. */
function BooksWithoutLanguage({ books, onChanged }: { books: LibraryHealth["incompleteBooks"]; onChanged: (message: string) => void }) {
  const [language, setLanguage] = useState("fr");
  const [unchecked, setUnchecked] = useState<Set<number>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selected = books.filter((book) => !unchecked.has(book.id));

  function toggle(bookId: number) {
    const next = new Set(unchecked);
    if (!next.delete(bookId)) {
      next.add(bookId);
    }
    setUnchecked(next);
  }

  async function handleApply() {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const result = await setBooksLanguage(
        selected.map((book) => book.id),
        language,
      );
      onChanged(`${countLabel(result.changedBooks, "livre classé", "livres classés")} en ${languageLabel(language).toLowerCase()}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
    setIsBusy(false);
  }

  return (
    <>
      <p className="merge-actions">
        <label>
          Langue des livres cochés{" "}
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {COMMON_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {languageLabel(code)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={isBusy || selected.length === 0} onClick={() => void handleApply()}>
          Classer {countLabel(selected.length, "livre")}
        </button>
      </p>
      {errorMessage ? (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <ul className="record-list">
        {books.map((book) => (
          <li key={book.id}>
            <label className="record-main">
              <input type="checkbox" checked={!unchecked.has(book.id)} onChange={() => toggle(book.id)} /> {book.title}
              <span className="record-secondary"> — {authorsLabel(book.authors)}</span>
            </label>
            <Link className="record-secondary" to={`/books/${book.id}`}>
              Voir la fiche
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function HealthPage({ onLibraryChanged }: { onLibraryChanged: () => void }) {
  useDocumentTitle("Santé de la bibliothèque");
  const health = useAsync((signal) => fetchLibraryHealth(signal), []);
  const series = useAsync((signal) => fetchSeriesSuggestions(signal), []);
  const [seriesMessage, setSeriesMessage] = useState<string | null>(null);
  const [languageMessage, setLanguageMessage] = useState<string | null>(null);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
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
  const { bookCount, invalidFiles, incompleteBooks, similarAuthors, authorlessBooks, probableDuplicates, authorFixes, swappedBooks, syncRuns } = health.data;
  const refresh = () => {
    health.reload();
    series.reload();
    onLibraryChanged();
  };
  const booksWithoutLanguage = incompleteBooks.filter((book) => book.missing.includes("language"));
  const seriesSuggestions = series.data ?? [];

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

      {swapMessage ? (
        <p className="form-success" role="status">
          {swapMessage}
        </p>
      ) : null}
      <Section title="Titre et auteur inversés" count={swappedBooks.length} emptyText="Aucun titre ne ressemble à un nom d'auteur.">
        <SwappedBooks
          books={swappedBooks}
          onChanged={(message) => {
            setSwapMessage(message);
            refresh();
          }}
        />
      </Section>

      {fixMessage ? (
        <p className="form-success" role="status">
          {fixMessage}
        </p>
      ) : null}
      <Section title="Noms d'auteurs à remettre en forme" count={authorFixes.length} emptyText="Tous les auteurs sont écrits « Prénom Nom ».">
        <AuthorFixes
          fixes={authorFixes}
          onChanged={(message) => {
            setFixMessage(message);
            refresh();
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

      {seriesMessage ? (
        <p className="form-success" role="status">
          {seriesMessage}
        </p>
      ) : null}
      <Section title="Séries à renseigner" count={seriesSuggestions.length} emptyText="Aucun titre ne laisse deviner une série qui ne soit déjà renseignée.">
        <SeriesSuggestions
          suggestions={seriesSuggestions}
          onChanged={(message) => {
            setSeriesMessage(message);
            series.reload();
            health.reload();
            onLibraryChanged();
          }}
        />
      </Section>

      {languageMessage ? (
        <p className="form-success" role="status">
          {languageMessage}
        </p>
      ) : null}
      <Section title="Livres sans langue" count={booksWithoutLanguage.length} emptyText="Chaque livre a une langue.">
        <BooksWithoutLanguage
          key={booksWithoutLanguage.map((book) => book.id).join("-")}
          books={booksWithoutLanguage}
          onChanged={(message) => {
            setLanguageMessage(message);
            health.reload();
            onLibraryChanged();
          }}
        />
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
