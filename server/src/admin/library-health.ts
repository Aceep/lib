import path from "node:path";
import type { LibraryDatabase } from "../db/database.js";
import { toSortKey } from "../db/sort-key.js";
import { parseAuthor } from "../library/file-naming.js";
import { titleKey } from "../missing/title-key.js";

export type InvalidFile = {
  filePath: string;
  fileSize: number;
  error: string;
  detectedAt: string;
};

export type MissingField = "cover" | "language" | "description";

export type IncompleteBook = {
  id: number;
  title: string;
  authors: string[];
  missing: MissingField[];
};

/** A book credited to nobody, or to a placeholder such as "Unknown". */
export type AuthorlessBook = {
  id: number;
  title: string;
  filePath: string;
  /** The placeholder names it carries now; empty when it has no author at all. */
  authors: string[];
  series: string | null;
  seriesIndex: number | null;
  /** Read from the folder the file sits in (`Books/H/Frank Herbert/…`), null when that folder names no author. */
  suggestedAuthor: string | null;
};

/** Books that look like the same work in different files: same title, an author in common. */
export type ProbableDuplicates = {
  books: { id: number; title: string; authors: string[]; filePath: string; fileSize: number }[];
};

/** Author names that probably designate one person, e.g. "J.K. Rowling" and "Rowling, J. K.". */
export type SimilarAuthors = {
  names: { name: string; bookCount: number }[];
};

export type LibraryHealth = {
  bookCount: number;
  invalidFiles: InvalidFile[];
  incompleteBooks: IncompleteBook[];
  similarAuthors: SimilarAuthors[];
  authorlessBooks: AuthorlessBook[];
  probableDuplicates: ProbableDuplicates[];
};

type InvalidFileRow = { file_path: string; file_size: number; error: string; detected_at: string };
type IncompleteBookRow = { id: number; title: string; authors_json: string; has_cover: number; has_language: number; has_description: number };
type AuthorRow = { name: string; book_count: number };
type BookRow = {
  id: number;
  title: string;
  file_path: string;
  file_size: number;
  series: string | null;
  series_index: number | null;
  authors_json: string;
};

const PLACEHOLDER_AUTHORS = new Set(["unknown", "inconnu", "auteur inconnu", "anonyme", "anonymous", "n a", "none", "various"]);

/** True for what tools write when they have no author to give: "Unknown", "Auteur inconnu"… */
export function isPlaceholderAuthor(name: string): boolean {
  return PLACEHOLDER_AUTHORS.has(toSortKey(name).replace(/[^\p{L}\p{N}]+/gu, " ").trim());
}

/**
 * The library is laid out as `Books/<Letter>/<Author>/<Author> - <Title>.epub`, so the folder names the author
 * even when the EPUB itself does not. Folders starting with "_" ("_Sans auteur", "_À identifier") name nobody.
 */
export function authorFromFilePath(filePath: string): string | null {
  const folder = filePath.split("/").at(-2)?.trim();
  if (!folder || folder.startsWith("_") || folder.length < 2 || !path.posix.basename(filePath).startsWith(`${folder} - `)) {
    return null;
  }
  return isPlaceholderAuthor(folder) ? null : folder;
}

/**
 * Same key for the same person however the name was typed: word order, case, accents, dots and spacing of
 * initials all fold away ("Rowling, J.K." and "j. k. rowling" both give "j k rowling").
 */
export function authorIdentityKey(name: string): string {
  return toSortKey(parseAuthor(name).display)
    .split(/[^\p{L}\p{N}]+/u)
    .flatMap((word) => (/^\p{L}{2,3}$/u.test(word) && word === word.replace(/[aeiouy]/g, "") ? [...word] : [word]))
    .filter((word) => word !== "")
    .sort()
    .join(" ");
}

export type LibraryHealthQueries = ReturnType<typeof createLibraryHealthQueries>;

export function createLibraryHealthQueries(database: LibraryDatabase) {
  const statements = {
    countBooks: database.prepare<[], { count: number }>("SELECT count(*) AS count FROM books"),
    listInvalidFiles: database.prepare<[], InvalidFileRow>(
      "SELECT file_path, file_size, error, detected_at FROM invalid_files ORDER BY file_path",
    ),
    listIncompleteBooks: database.prepare<[], IncompleteBookRow>(
      `SELECT books.id, books.title,
         (SELECT json_group_array(name) FROM (
            SELECT authors.name FROM book_authors JOIN authors ON authors.id = book_authors.author_id
            WHERE book_authors.book_id = books.id ORDER BY book_authors.position
         )) AS authors_json,
         books.cover_file IS NOT NULL AS has_cover,
         coalesce(books.language, '') != '' AS has_language,
         coalesce(books.description, '') != '' AS has_description
       FROM books
       WHERE books.cover_file IS NULL OR coalesce(books.language, '') = '' OR coalesce(books.description, '') = ''
       ORDER BY books.sort_title`,
    ),
    listAuthors: database.prepare<[], AuthorRow>(
      `SELECT authors.name, count(book_authors.book_id) AS book_count
       FROM authors JOIN book_authors ON book_authors.author_id = authors.id
       GROUP BY authors.id ORDER BY authors.sort_name`,
    ),
    listBooks: database.prepare<[], BookRow>(
      `SELECT books.id, books.title, books.file_path, books.file_size, books.series, books.series_index,
         (SELECT json_group_array(name) FROM (
            SELECT authors.name FROM book_authors JOIN authors ON authors.id = book_authors.author_id
            WHERE book_authors.book_id = books.id ORDER BY book_authors.position
         )) AS authors_json
       FROM books ORDER BY books.sort_title, books.id`,
    ),
  };

  function findAuthorlessBooks(books: (BookRow & { authors: string[] })[]): AuthorlessBook[] {
    return books
      .filter((book) => book.authors.every(isPlaceholderAuthor))
      .map((book) => ({
        id: book.id,
        title: book.title,
        filePath: book.file_path,
        authors: book.authors,
        series: book.series,
        seriesIndex: book.series_index,
        suggestedAuthor: authorFromFilePath(book.file_path),
      }));
  }

  function findProbableDuplicates(books: (BookRow & { authors: string[] })[]): ProbableDuplicates[] {
    const byTitle = new Map<string, (BookRow & { authors: string[] })[]>();
    for (const book of books) {
      const key = titleKey(book.title);
      if (key !== "") {
        byTitle.set(key, [...(byTitle.get(key) ?? []), book]);
      }
    }
    const groups: ProbableDuplicates[] = [];
    for (const sameTitle of byTitle.values()) {
      // Two different books can share a title; an author in common is what makes them one work.
      const remaining = sameTitle.map((book) => ({ book, identities: new Set(book.authors.map(authorIdentityKey)) }));
      while (remaining.length > 1) {
        const first = remaining.shift()!;
        const matches = remaining.filter((other) => [...other.identities].some((identity) => first.identities.has(identity)));
        if (matches.length > 0) {
          matches.forEach((match) => remaining.splice(remaining.indexOf(match), 1));
          groups.push({
            books: [first, ...matches].map(({ book }) => ({
              id: book.id,
              title: book.title,
              authors: book.authors,
              filePath: book.file_path,
              fileSize: book.file_size,
            })),
          });
        }
      }
    }
    return groups;
  }

  function findSimilarAuthors(): SimilarAuthors[] {
    const groups = new Map<string, SimilarAuthors["names"]>();
    for (const author of statements.listAuthors.all()) {
      const key = authorIdentityKey(author.name);
      if (key === "" || isPlaceholderAuthor(author.name)) {
        continue;
      }
      const names = groups.get(key) ?? [];
      names.push({ name: author.name, bookCount: author.book_count });
      groups.set(key, names);
    }
    return [...groups.values()].filter((names) => names.length > 1).map((names) => ({ names }));
  }

  return {
    getHealth(): LibraryHealth {
      const books = statements.listBooks.all().map((row) => ({ ...row, authors: JSON.parse(row.authors_json) as string[] }));
      return {
        bookCount: statements.countBooks.get()?.count ?? 0,
        invalidFiles: statements.listInvalidFiles.all().map((row) => ({
          filePath: row.file_path,
          fileSize: row.file_size,
          error: row.error,
          detectedAt: row.detected_at,
        })),
        incompleteBooks: statements.listIncompleteBooks.all().map((row) => ({
          id: row.id,
          title: row.title,
          authors: JSON.parse(row.authors_json) as string[],
          missing: [
            ...(row.has_cover ? [] : (["cover"] as const)),
            ...(row.has_language ? [] : (["language"] as const)),
            ...(row.has_description ? [] : (["description"] as const)),
          ],
        })),
        similarAuthors: findSimilarAuthors(),
        authorlessBooks: findAuthorlessBooks(books),
        probableDuplicates: findProbableDuplicates(books),
      };
    },
  };
}
