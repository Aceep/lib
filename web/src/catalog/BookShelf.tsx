import type { ReactNode } from "react";
import type { BookSummary } from "../api/types.js";
import { BookCard, BookCardSkeleton } from "./BookCard.js";

/** A horizontally scrolling row of books, used for "recently added" and "also by this author". */
export function BookShelf({
  title,
  action,
  books,
  skeletonCount = 8,
  showNewBadges = false,
}: {
  title: string;
  action?: ReactNode;
  books: BookSummary[] | null;
  skeletonCount?: number;
  /** Marks the books added in the last week; meant for the "recently added" shelf. */
  showNewBadges?: boolean;
}) {
  if (books && books.length === 0) {
    return null;
  }
  return (
    <section className="shelf" aria-label={title}>
      <header className="shelf-header">
        <h2>{title}</h2>
        {action}
      </header>
      <ul className="shelf-row">
        {books ? books.map((book) => <BookCard key={book.id} book={book} showNewBadge={showNewBadges} />) : Array.from({ length: skeletonCount }, (_, index) => <BookCardSkeleton key={index} />)}
      </ul>
    </section>
  );
}
