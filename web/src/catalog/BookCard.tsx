import { Link } from "react-router";
import { coverUrl } from "../api/client.js";
import type { BookSummary } from "../api/types.js";
import { authorsLabel } from "../shared/format.js";

// A book wears the "nouveau" badge for a week after it enters the catalog.
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

export function isRecentArrival(book: Pick<BookSummary, "addedAt">, now = Date.now()): boolean {
  return now - new Date(book.addedAt).getTime() < NEW_FOR_MS;
}

/** Stable hue per title so books without a cover are told apart at a glance. */
function hueOf(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.codePointAt(0)!) % 360;
  }
  return hash;
}

export function BookCover({ book, className }: { book: Pick<BookSummary, "id" | "title" | "authors" | "hasCover">; className: string }) {
  if (!book.hasCover) {
    return (
      <div className={`${className} cover-placeholder`} style={{ "--cover-hue": hueOf(book.title) } as React.CSSProperties} aria-hidden="true">
        <span className="cover-placeholder-title">{book.title}</span>
        <span className="cover-placeholder-author">{authorsLabel(book.authors)}</span>
      </div>
    );
  }
  return <img className={className} src={coverUrl(book.id)} alt="" loading="lazy" decoding="async" />;
}

export function BookCard({ book, showNewBadge = false }: { book: BookSummary; showNewBadge?: boolean }) {
  return (
    <li className="book-card">
      <Link to={`/books/${book.id}`} title={`${book.title} — ${authorsLabel(book.authors)}`}>
        <span className="book-card-cover-frame">
          <BookCover book={book} className="book-card-cover" />
          {showNewBadge && isRecentArrival(book) ? <span className="new-badge">Nouveau</span> : null}
        </span>
        <span className="book-card-title">{book.title}</span>
        <span className="book-card-authors">{authorsLabel(book.authors)}</span>
      </Link>
    </li>
  );
}

export function BookCardSkeleton() {
  return (
    <li className="book-card is-skeleton" aria-hidden="true">
      <span className="book-card-cover skeleton" />
      <span className="book-card-title skeleton skeleton-text" />
      <span className="book-card-authors skeleton skeleton-text short" />
    </li>
  );
}
