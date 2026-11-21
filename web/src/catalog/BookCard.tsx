import { Link } from "react-router";
import { coverUrl } from "../api/client.js";
import type { BookSummary } from "../api/types.js";
import { authorsLabel } from "../shared/format.js";

export function BookCover({ book, className }: { book: Pick<BookSummary, "id" | "title" | "hasCover">; className: string }) {
  if (!book.hasCover) {
    return (
      <div className={`${className} cover-placeholder`} aria-hidden="true">
        <span>{book.title}</span>
      </div>
    );
  }
  return <img className={className} src={coverUrl(book.id)} alt="" loading="lazy" decoding="async" />;
}

export function BookCard({ book }: { book: BookSummary }) {
  return (
    <li className="book-card">
      <Link to={`/books/${book.id}`}>
        <BookCover book={book} className="book-card-cover" />
        <span className="book-card-title">{book.title}</span>
        <span className="book-card-authors">{authorsLabel(book.authors)}</span>
      </Link>
    </li>
  );
}
