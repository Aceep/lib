import type { LibraryDatabase } from "../db/database.js";
import { toSortKey } from "../db/sort-key.js";
import { parseAuthor } from "../library/file-naming.js";

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

/** Author names that probably designate one person, e.g. "J.K. Rowling" and "Rowling, J. K.". */
export type SimilarAuthors = {
  names: { name: string; bookCount: number }[];
};

export type LibraryHealth = {
  bookCount: number;
  invalidFiles: InvalidFile[];
  incompleteBooks: IncompleteBook[];
  similarAuthors: SimilarAuthors[];
};

type InvalidFileRow = { file_path: string; file_size: number; error: string; detected_at: string };
type IncompleteBookRow = { id: number; title: string; authors_json: string; has_cover: number; has_language: number; has_description: number };
type AuthorRow = { name: string; book_count: number };

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
  };

  function findSimilarAuthors(): SimilarAuthors[] {
    const groups = new Map<string, SimilarAuthors["names"]>();
    for (const author of statements.listAuthors.all()) {
      const key = authorIdentityKey(author.name);
      if (key === "") {
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
      };
    },
  };
}
