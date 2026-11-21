import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ApiError, correctBook, deleteBook, fetchBook, fetchBooks, fileUrl } from "../api/client.js";
import type { BookDetails, User } from "../api/types.js";
import { BookCover } from "../catalog/BookCard.js";
import { BookShelf } from "../catalog/BookShelf.js";
import { countLabel, dateTimeLabel, fileSizeLabel, languageLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";
import { useDocumentTitle } from "../shared/use-document-title.js";

const SHELF_SIZE = 12;
// Beyond this many characters the description is folded behind "Lire la suite".
const DESCRIPTION_FOLD_LENGTH = 600;

function authorLink(author: string): string {
  return `/?${new URLSearchParams({ author })}`;
}

function seriesLink(series: string): string {
  return `/?${new URLSearchParams({ series })}`;
}

const seriesIndexFormat = new Intl.NumberFormat("fr", { maximumFractionDigits: 2 });

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESCRIPTION_FOLD_LENGTH;
  return (
    <div className="book-description">
      <p className={`book-description-text${isLong && !expanded ? " is-folded" : ""}`}>{text}</p>
      {isLong ? (
        <button type="button" className="link-button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Réduire" : "Lire la suite"}
        </button>
      ) : null}
    </div>
  );
}

function AlsoByAuthor({ book }: { book: BookDetails }) {
  const author = book.authors[0] ?? null;
  const others = useAsync(
    (signal) => (author ? fetchBooks({ query: "", author, language: "", sort: "title", page: 1, pageSize: SHELF_SIZE + 1 }, signal) : Promise.resolve(null)),
    [author, book.id],
  );
  if (!author) {
    return null;
  }
  const items = others.data ? others.data.items.filter((other) => other.id !== book.id).slice(0, SHELF_SIZE) : null;
  const total = others.data ? others.data.total - 1 : 0;
  return (
    <BookShelf
      title={`Aussi de ${author}`}
      books={items}
      skeletonCount={4}
      action={
        total > SHELF_SIZE ? (
          <Link to={authorLink(author)} className="shelf-link">
            {countLabel(total, "livre")} →
          </Link>
        ) : null
      }
    />
  );
}

function InSeries({ book }: { book: BookDetails }) {
  const { series } = book;
  const volumes = useAsync(
    (signal) => (series ? fetchBooks({ query: "", author: "", language: "", series, sort: "title", page: 1, pageSize: 100 }, signal) : Promise.resolve(null)),
    [series, book.id],
  );
  const others = volumes.data?.items.filter((other) => other.id !== book.id) ?? null;
  if (!series || others?.length === 0) {
    return null;
  }
  return (
    <BookShelf
      title={`Série : ${series}`}
      books={others}
      skeletonCount={4}
      action={
        <Link to={seriesLink(series)} className="shelf-link">
          Toute la série →
        </Link>
      }
    />
  );
}

/** Admin only: corrects what the catalog shows (the EPUB file is not rewritten) or sends the book to the trash. */
function BookAdminPanel({ book, onCorrected, onDeleted }: { book: BookDetails; onCorrected: () => void; onDeleted: () => void }) {
  const [title, setTitle] = useState(book.title);
  // One author per line: names such as "Herbert, Frank" rule out a comma-separated field.
  const [authors, setAuthors] = useState(book.authors.join("\n"));
  const [series, setSeries] = useState(book.series ?? "");
  const [seriesIndex, setSeriesIndex] = useState(book.seriesIndex === null ? "" : String(book.seriesIndex));
  const [isBusy, setIsBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setOutcome(null);
    try {
      await action();
    } catch (error) {
      setOutcome({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await correctBook(book.id, {
        title,
        authors: authors.split("\n"),
        series: series.trim() || null,
        seriesIndex: seriesIndex.trim() === "" ? null : Number(seriesIndex.replace(",", ".")),
      });
      setOutcome({ kind: "success", text: "Fiche corrigée." });
      onCorrected();
    });
  }

  function handleDelete() {
    if (window.confirm(`Retirer « ${book.title} » de la bibliothèque ? Le fichier est déplacé dans la corbeille, pas effacé.`)) {
      void run(async () => {
        await deleteBook(book.id);
        onDeleted();
      });
    }
  }

  return (
    <details className="book-admin">
      <summary>Administration</summary>
      <form className="form" onSubmit={handleSubmit}>
        <label className="filter">
          Titre
          <input type="text" required value={title} disabled={isBusy} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="filter">
          Auteurs (un par ligne)
          <textarea rows={Math.max(2, authors.split("\n").length)} value={authors} disabled={isBusy} onChange={(event) => setAuthors(event.target.value)} />
        </label>
        <label className="filter">
          Série
          <input type="text" value={series} disabled={isBusy} onChange={(event) => setSeries(event.target.value)} />
        </label>
        <label className="filter">
          Tome
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]+([.,][0-9]+)?"
            value={seriesIndex}
            disabled={isBusy || series.trim() === ""}
            onChange={(event) => setSeriesIndex(event.target.value)}
          />
        </label>
        {outcome ? (
          <p className={outcome.kind === "error" ? "error" : "form-success"} role={outcome.kind === "error" ? "alert" : "status"}>
            {outcome.text}
          </p>
        ) : null}
        <div className="upload-actions">
          <button type="submit" className="button primary" disabled={isBusy}>
            Enregistrer
          </button>
          <button type="button" className="button danger" disabled={isBusy} onClick={handleDelete}>
            Supprimer le livre
          </button>
        </div>
      </form>
    </details>
  );
}

function BookDetailsView({ book }: { book: BookDetails }) {
  return (
    <article className="book-details">
      <BookCover book={book} className="book-details-cover" />
      <div className="book-details-body">
        <h1>{book.title}</h1>
        <p className="book-details-authors">
          {book.authors.length === 0
            ? "Auteur inconnu"
            : book.authors.map((author, index) => (
                <span key={author}>
                  {index > 0 ? ", " : null}
                  <Link to={authorLink(author)}>{author}</Link>
                </span>
              ))}
        </p>
        <dl className="book-details-facts">
          {book.series ? (
            <>
              <dt>Série</dt>
              <dd>
                <Link to={seriesLink(book.series)}>{book.series}</Link>
                {book.seriesIndex !== null ? `, tome ${seriesIndexFormat.format(book.seriesIndex)}` : null}
              </dd>
            </>
          ) : null}
          {book.language ? (
            <>
              <dt>Langue</dt>
              <dd>{languageLabel(book.language)}</dd>
            </>
          ) : null}
          <dt>Taille</dt>
          <dd>{fileSizeLabel(book.fileSize)}</dd>
          <dt>Ajouté le</dt>
          <dd>{dateTimeLabel(book.addedAt)}</dd>
        </dl>
        <div className="book-details-actions">
          <a className="button primary" href={fileUrl(book.id)} download>
            Télécharger l'EPUB
          </a>
        </div>
      </div>
      {book.description ? <Description text={book.description} /> : null}
    </article>
  );
}

function BackToCatalogLink() {
  const navigate = useNavigate();
  const location = useLocation();
  // Going back in history restores the search and page the reader came from; "/" is the fallback
  // when the book page was opened directly from a bookmark or a shared link.
  const cameFromCatalog = location.key !== "default";

  return (
    <Link
      to="/"
      className="back-link"
      onClick={(event) => {
        if (cameFromCatalog) {
          event.preventDefault();
          void navigate(-1);
        }
      }}
    >
      ← Retour au catalogue
    </Link>
  );
}

export function BookPage({ user, onLibraryChanged }: { user: User; onLibraryChanged: () => void }) {
  const navigate = useNavigate();
  const bookId = Number(useParams<{ bookId: string }>().bookId);
  const book = useAsync(
    (signal) => (Number.isInteger(bookId) ? fetchBook(bookId, signal) : Promise.reject(new ApiError(404, "Unknown book"))),
    [bookId],
  );
  useDocumentTitle(book.data?.title ?? null);

  return (
    <main className="page book-page">
      <BackToCatalogLink />
      {book.status === "error" ? (
        <p className="error" role="alert">
          {book.error instanceof ApiError && book.error.status === 404 ? "Ce livre n'existe pas ou plus." : book.error.message}
        </p>
      ) : null}
      {book.data ? (
        <>
          <BookDetailsView book={book.data} />
          {user.role === "admin" ? (
            <BookAdminPanel
              // Remounted after a save so the fields show what the server kept (trimmed names, cleared tome).
              key={`${book.data.id}:${book.data.updatedAt}`}
              book={book.data}
              onCorrected={() => {
                book.reload();
                onLibraryChanged();
              }}
              onDeleted={() => {
                onLibraryChanged();
                void navigate("/", { replace: true });
              }}
            />
          ) : null}
          <InSeries book={book.data} />
          <AlsoByAuthor book={book.data} />
        </>
      ) : null}
    </main>
  );
}
