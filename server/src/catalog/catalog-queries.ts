import type { LibraryDatabase } from "../db/database.js";

export type BookSort = "relevance" | "title" | "recent";

export type BookListFilters = {
  query: string | null;
  author: string | null;
  language: string | null;
  sort: BookSort;
  page: number;
  pageSize: number;
};

export type BookSummary = {
  id: number;
  title: string;
  authors: string[];
  language: string | null;
  hasCover: boolean;
};

export type BookPage = {
  items: BookSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type BookDetails = BookSummary & {
  description: string | null;
  fileSize: number;
  addedAt: string;
  updatedAt: string;
};

export type CatalogFacets = {
  authors: { name: string; bookCount: number }[];
  languages: { code: string; bookCount: number }[];
};

type BookRow = {
  id: number;
  title: string;
  authors_json: string;
  language: string | null;
  cover_file: string | null;
};

type BookDetailsRow = BookRow & {
  description: string | null;
  file_size: number;
  added_at: string;
  updated_at: string;
};

const AUTHORS_JSON_COLUMN = `(
  SELECT json_group_array(authors.name ORDER BY book_authors.position)
  FROM book_authors JOIN authors ON authors.id = book_authors.author_id
  WHERE book_authors.book_id = books.id
) AS authors_json`;

/**
 * Turns free user input into a safe FTS5 expression: every word must match, as a prefix so results
 * show up while typing. Returns null when the input holds no searchable word.
 */
export function toFullTextQuery(input: string): string | null {
  const words = input.match(/[\p{L}\p{N}]+/gu);
  if (!words) {
    return null;
  }
  return words.map((word) => `"${word}"*`).join(" ");
}

function toSummary(row: BookRow): BookSummary {
  return {
    id: row.id,
    title: row.title,
    authors: JSON.parse(row.authors_json) as string[],
    language: row.language,
    hasCover: row.cover_file !== null,
  };
}

function orderByClause(sort: BookSort, hasFullTextQuery: boolean): string {
  if (sort === "relevance" && hasFullTextQuery) {
    // bm25 weights: a hit in the title counts more than one in the authors, which beats the description.
    return "ORDER BY bm25(books_fts, 10.0, 5.0, 1.0), books.sort_title";
  }
  if (sort === "recent") {
    return "ORDER BY books.added_at DESC, books.id DESC";
  }
  return "ORDER BY books.sort_title, books.id";
}

export type CatalogQueries = ReturnType<typeof createCatalogQueries>;

export function createCatalogQueries(database: LibraryDatabase) {
  const bookDetailsStatement = database.prepare<[number], BookDetailsRow>(
    `SELECT books.id, books.title, books.language, books.cover_file, books.description, books.file_size,
            books.added_at, books.updated_at, ${AUTHORS_JSON_COLUMN}
     FROM books WHERE books.id = ?`,
  );
  const bookFilePathStatement = database.prepare<[number], { file_path: string }>(
    "SELECT file_path FROM books WHERE id = ?",
  );
  const coverFileStatement = database.prepare<[number], { cover_file: string | null }>(
    "SELECT cover_file FROM books WHERE id = ?",
  );
  const authorFacetStatement = database.prepare<[], { name: string; book_count: number }>(
    `SELECT authors.name, COUNT(*) AS book_count
     FROM authors JOIN book_authors ON book_authors.author_id = authors.id
     GROUP BY authors.id ORDER BY authors.sort_name`,
  );
  const languageFacetStatement = database.prepare<[], { language: string; book_count: number }>(
    `SELECT language, COUNT(*) AS book_count FROM books
     WHERE language IS NOT NULL GROUP BY language ORDER BY book_count DESC, language`,
  );

  return {
    listBooks(filters: BookListFilters): BookPage {
      const fullTextQuery = filters.query ? toFullTextQuery(filters.query) : null;
      const conditions: string[] = [];
      const parameters: Record<string, string | number> = {};

      if (fullTextQuery) {
        conditions.push("books_fts MATCH @fullTextQuery");
        parameters.fullTextQuery = fullTextQuery;
      }
      if (filters.author) {
        conditions.push(`EXISTS (
          SELECT 1 FROM book_authors JOIN authors ON authors.id = book_authors.author_id
          WHERE book_authors.book_id = books.id AND authors.name = @author)`);
        parameters.author = filters.author;
      }
      if (filters.language) {
        conditions.push("books.language = @language");
        parameters.language = filters.language;
      }

      const fromClause = fullTextQuery ? "FROM books JOIN books_fts ON books_fts.rowid = books.id" : "FROM books";
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countRow = database
        .prepare<Record<string, string | number>, { total: number }>(`SELECT COUNT(*) AS total ${fromClause} ${whereClause}`)
        .get(parameters);
      const rows = database
        .prepare<Record<string, string | number>, BookRow>(
          `SELECT books.id, books.title, books.language, books.cover_file, ${AUTHORS_JSON_COLUMN}
           ${fromClause} ${whereClause}
           ${orderByClause(filters.sort, fullTextQuery !== null)}
           LIMIT @limit OFFSET @offset`,
        )
        .all({ ...parameters, limit: filters.pageSize, offset: (filters.page - 1) * filters.pageSize });

      return { items: rows.map(toSummary), total: countRow?.total ?? 0, page: filters.page, pageSize: filters.pageSize };
    },

    getBook(bookId: number): BookDetails | null {
      const row = bookDetailsStatement.get(bookId);
      if (!row) {
        return null;
      }
      return {
        ...toSummary(row),
        description: row.description,
        fileSize: row.file_size,
        addedAt: row.added_at,
        updatedAt: row.updated_at,
      };
    },

    getBookFilePath(bookId: number): string | null {
      return bookFilePathStatement.get(bookId)?.file_path ?? null;
    },

    getCoverFile(bookId: number): string | null {
      return coverFileStatement.get(bookId)?.cover_file ?? null;
    },

    getFacets(): CatalogFacets {
      return {
        authors: authorFacetStatement.all().map((row) => ({ name: row.name, bookCount: row.book_count })),
        languages: languageFacetStatement.all().map((row) => ({ code: row.language, bookCount: row.book_count })),
      };
    },
  };
}
