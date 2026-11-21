import { Link } from "react-router";
import { coverUrl } from "../api/client.js";
import type { BookSummary } from "../api/types.js";
import { authorsLabel } from "../shared/format.js";

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

export function BookCard({ book }: { book: BookSummary }) {
  return (
    <li className="book-card">
      <Link to={`/books/${book.id}`} title={`${book.title} — ${authorsLabel(book.authors)}`}>
        <BookCover book={book} className="book-card-cover" />
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
