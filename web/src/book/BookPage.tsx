import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ApiError, fetchBook, fileUrl } from "../api/client.js";
import type { BookDetails } from "../api/types.js";
import { BookCover } from "../catalog/BookCard.js";
import { dateTimeLabel, fileSizeLabel, languageLabel } from "../shared/format.js";
import { useAsync } from "../shared/use-async.js";

function authorLink(author: string): string {
  return `/?${new URLSearchParams({ author })}`;
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
        {book.description ? <p className="book-details-description">{book.description}</p> : null}
      </div>
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

  return (
    <main className="book-page">
      <BackToCatalogLink />
      {book.status === "error" ? (
        <p className="error" role="alert">
          {book.error instanceof ApiError && book.error.status === 404 ? "Ce livre n'existe pas ou plus." : book.error.message}
        </p>
      ) : null}
      {book.data ? <BookDetailsView book={book.data} /> : null}
    </main>
  );
}
