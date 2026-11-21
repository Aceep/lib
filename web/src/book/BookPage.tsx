import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ApiError, fetchBook, fetchBooks, fileUrl } from "../api/client.js";
import type { BookDetails } from "../api/types.js";
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

export function BookPage() {
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
          <AlsoByAuthor book={book.data} />
        </>
      ) : null}
    </main>
  );
}
