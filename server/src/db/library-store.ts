import type { LibraryDatabase } from "./database.js";
import { toSortKey } from "./sort-key.js";

export type FileFingerprint = {
  filePath: string;
  fileSize: number;
  fileMtimeMs: number;
};

export type IndexedFile = FileFingerprint & {
  bookId: number;
  coverFile: string | null;
  contentHash: string | null;
  /** False for a book indexed before series were read from the files. */
  seriesChecked: boolean;
  /** False for a book indexed before genres were derived from the files' subjects. */
  genresChecked: boolean;
};

export type BookRecord = FileFingerprint & {
  contentHash: string;
  title: string;
  authors: string[];
  language: string | null;
  description: string | null;
  series: string | null;
  seriesIndex: number | null;
  genres: string[];
};

/** What an admin may correct on a book. */
export type BookCorrection = {
  title: string;
  authors: string[];
  series: string | null;
  seriesIndex: number | null;
};

/** A book as stored, with what is needed to act on its file. */
export type StoredBook = BookCorrection & {
  bookId: number;
  filePath: string;
  contentHash: string | null;
  coverFile: string | null;
};

type OverrideRow = {
  title: string | null;
  authors_json: string | null;
  has_series: number;
  series: string | null;
  series_index: number | null;
  language: string | null;
};

type StoredBookRow = {
  id: number;
  file_path: string;
  content_hash: string | null;
  cover_file: string | null;
  title: string;
  series: string | null;
  series_index: number | null;
};

type IndexedFileRow = {
  id: number;
  file_path: string;
  file_size: number;
  file_mtime_ms: number;
  cover_file: string | null;
  content_hash: string | null;
  series_checked: number;
  genres_checked: number;
};

type InvalidFileRow = {
  file_path: string;
  file_size: number;
  file_mtime_ms: number;
};

type DuplicateRow = {
  id: number;
  title: string;
  file_path: string;
};

export type ExistingBook = {
  bookId: number;
  title: string;
  authors: string[];
  filePath: string;
};

export type LibraryStore = ReturnType<typeof createLibraryStore>;

export function createLibraryStore(database: LibraryDatabase) {
  const statements = {
    listIndexedFiles: database.prepare<[], IndexedFileRow>(
      "SELECT id, file_path, file_size, file_mtime_ms, cover_file, content_hash, series_checked, genres_checked FROM books",
    ),
    upsertGenre: database.prepare<[string], { id: number }>(
      "INSERT INTO genres (name) VALUES (?) ON CONFLICT (name) DO UPDATE SET name = name RETURNING id",
    ),
    deleteBookGenres: database.prepare<[number]>("DELETE FROM book_genres WHERE book_id = ?"),
    insertBookGenre: database.prepare<[number, number]>("INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)"),
    setGenresChecked: database.prepare<[number]>("UPDATE books SET genres_checked = 1 WHERE id = ?"),
    deleteOrphanGenres: database.prepare<[]>("DELETE FROM genres WHERE id NOT IN (SELECT genre_id FROM book_genres)"),
    setContentHash: database.prepare<[string, number]>("UPDATE books SET content_hash = ? WHERE id = ?"),
    findByContentHash: database.prepare<[string], DuplicateRow>(
      "SELECT id, title, file_path FROM books WHERE content_hash = ? ORDER BY id",
    ),
    findBySortTitle: database.prepare<[string], DuplicateRow>(
      "SELECT id, title, file_path FROM books WHERE sort_title = ? ORDER BY id",
    ),
    findByFilePath: database.prepare<[string], DuplicateRow>("SELECT id, title, file_path FROM books WHERE file_path = ?"),
    listAuthorNames: database.prepare<[number], { name: string }>(
      "SELECT authors.name FROM book_authors JOIN authors ON authors.id = book_authors.author_id WHERE book_id = ? ORDER BY position",
    ),
    listInvalidFiles: database.prepare<[], InvalidFileRow>(
      "SELECT file_path, file_size, file_mtime_ms FROM invalid_files",
    ),
    insertBook: database.prepare<
      {
        filePath: string;
        fileSize: number;
        fileMtimeMs: number;
        contentHash: string;
        title: string;
        sortTitle: string;
        language: string | null;
        description: string | null;
        series: string | null;
        seriesIndex: number | null;
        now: string;
      },
      { id: number }
    >(
      `INSERT INTO books (file_path, file_size, file_mtime_ms, content_hash, title, sort_title, language, description, series, series_index, series_checked, genres_checked, added_at, updated_at)
       VALUES (@filePath, @fileSize, @fileMtimeMs, @contentHash, @title, @sortTitle, @language, @description, @series, @seriesIndex, 1, 1, @now, @now)
       RETURNING id`,
    ),
    updateBook: database.prepare<{
      bookId: number;
      fileSize: number;
      fileMtimeMs: number;
      contentHash: string;
      title: string;
      sortTitle: string;
      language: string | null;
      description: string | null;
      series: string | null;
      seriesIndex: number | null;
      now: string;
    }>(
      `UPDATE books SET file_size = @fileSize, file_mtime_ms = @fileMtimeMs, content_hash = @contentHash, title = @title,
         sort_title = @sortTitle, language = @language, description = @description, series = @series,
         series_index = @seriesIndex, series_checked = 1, genres_checked = 1, updated_at = @now
       WHERE id = @bookId`,
    ),
    setCoverFile: database.prepare<[string | null, number]>("UPDATE books SET cover_file = ? WHERE id = ?"),
    deleteBook: database.prepare<[number]>("DELETE FROM books WHERE id = ?"),
    upsertAuthor: database.prepare<[string, string], { id: number }>(
      // The no-op update makes RETURNING yield the existing row on conflict.
      "INSERT INTO authors (name, sort_name) VALUES (?, ?) ON CONFLICT (name) DO UPDATE SET name = name RETURNING id",
    ),
    deleteBookAuthors: database.prepare<[number]>("DELETE FROM book_authors WHERE book_id = ?"),
    insertBookAuthor: database.prepare<[number, number, number]>(
      "INSERT OR IGNORE INTO book_authors (book_id, author_id, position) VALUES (?, ?, ?)",
    ),
    deleteOrphanAuthors: database.prepare<[]>(
      "DELETE FROM authors WHERE id NOT IN (SELECT author_id FROM book_authors)",
    ),
    deleteSearchEntry: database.prepare<[number]>("DELETE FROM books_fts WHERE rowid = ?"),
    insertSearchEntry: database.prepare<[number, string, string, string]>(
      "INSERT INTO books_fts (rowid, title, authors, description) VALUES (?, ?, ?, ?)",
    ),
    upsertInvalidFile: database.prepare<{ filePath: string; fileSize: number; fileMtimeMs: number; error: string; now: string }>(
      `INSERT INTO invalid_files (file_path, file_size, file_mtime_ms, error, detected_at)
       VALUES (@filePath, @fileSize, @fileMtimeMs, @error, @now)
       ON CONFLICT (file_path) DO UPDATE SET file_size = excluded.file_size, file_mtime_ms = excluded.file_mtime_ms,
         error = excluded.error, detected_at = excluded.detected_at`,
    ),
    deleteInvalidFile: database.prepare<[string]>("DELETE FROM invalid_files WHERE file_path = ?"),
    getOverride: database.prepare<[string], OverrideRow>(
      "SELECT title, authors_json, has_series, series, series_index, language FROM book_overrides WHERE content_hash = ?",
    ),
    upsertOverride: database.prepare<{
      contentHash: string;
      title: string;
      authorsJson: string;
      series: string | null;
      seriesIndex: number | null;
      now: string;
      updatedBy: string | null;
    }>(
      `INSERT INTO book_overrides (content_hash, title, authors_json, has_series, series, series_index, updated_at, updated_by)
       VALUES (@contentHash, @title, @authorsJson, 1, @series, @seriesIndex, @now, @updatedBy)
       ON CONFLICT (content_hash) DO UPDATE SET title = excluded.title, authors_json = excluded.authors_json, has_series = 1,
         series = excluded.series, series_index = excluded.series_index, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ),
    upsertLanguageOverride: database.prepare<[string, string, string, string | null]>(
      `INSERT INTO book_overrides (content_hash, language, updated_at, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT (content_hash) DO UPDATE SET language = excluded.language, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ),
    setLanguage: database.prepare<[string, string, number]>("UPDATE books SET language = ?, updated_at = ? WHERE id = ?"),
    setOverrideSeries: database.prepare<[string | null, number | null, string]>(
      "UPDATE book_overrides SET series = ?, series_index = ? WHERE content_hash = ? AND has_series = 1",
    ),
    setSeries: database.prepare<[string | null, number | null, number]>(
      "UPDATE books SET series = ?, series_index = ?, series_checked = 1 WHERE id = ?",
    ),
    getStoredBook: database.prepare<[number], StoredBookRow>(
      "SELECT id, file_path, content_hash, cover_file, title, series, series_index FROM books WHERE id = ?",
    ),
    getSearchDescription: database.prepare<[number], { description: string | null }>("SELECT description FROM books WHERE id = ?"),
    correctBook: database.prepare<{ bookId: number; title: string; sortTitle: string; series: string | null; seriesIndex: number | null; now: string }>(
      "UPDATE books SET title = @title, sort_title = @sortTitle, series = @series, series_index = @seriesIndex, updated_at = @now WHERE id = @bookId",
    ),
    listBookIdsByAuthor: database.prepare<[string], { book_id: number }>(
      "SELECT book_authors.book_id FROM book_authors JOIN authors ON authors.id = book_authors.author_id WHERE authors.name = ?",
    ),
  };

  /** The record as the catalog should show it: what the file says, unless an admin corrected it. */
  function withOverride(record: BookRecord): BookRecord {
    const override = statements.getOverride.get(record.contentHash);
    if (!override) {
      return record;
    }
    return {
      ...record,
      title: override.title ?? record.title,
      authors: override.authors_json ? (JSON.parse(override.authors_json) as string[]) : record.authors,
      series: override.has_series ? override.series : record.series,
      seriesIndex: override.has_series ? override.series_index : record.seriesIndex,
      language: override.language ?? record.language,
    };
  }

  function toExistingBook(row: DuplicateRow): ExistingBook {
    return {
      bookId: row.id,
      title: row.title,
      authors: statements.listAuthorNames.all(row.id).map((author) => author.name),
      filePath: row.file_path,
    };
  }

  function replaceGenres(bookId: number, genres: string[]): void {
    statements.deleteBookGenres.run(bookId);
    for (const name of genres) {
      const genre = statements.upsertGenre.get(name);
      if (genre) {
        statements.insertBookGenre.run(bookId, genre.id);
      }
    }
  }

  function replaceAuthorsAndSearchEntry(bookId: number, record: Pick<BookRecord, "title" | "authors" | "description" | "series">): void {
    statements.deleteBookAuthors.run(bookId);
    record.authors.forEach((name, position) => {
      const author = statements.upsertAuthor.get(name, toSortKey(name));
      if (author) {
        statements.insertBookAuthor.run(bookId, author.id, position);
      }
    });
    statements.deleteSearchEntry.run(bookId);
    // The series goes with the title so that searching "Fondation" finds every volume, whatever each is called.
    const searchableTitle = record.series ? `${record.title} ${record.series}` : record.title;
    statements.insertSearchEntry.run(bookId, searchableTitle, record.authors.join(" "), record.description ?? "");
  }

  return {
    listIndexedFiles(): IndexedFile[] {
      return statements.listIndexedFiles.all().map((row) => ({
        bookId: row.id,
        filePath: row.file_path,
        fileSize: row.file_size,
        fileMtimeMs: row.file_mtime_ms,
        coverFile: row.cover_file,
        contentHash: row.content_hash,
        seriesChecked: row.series_checked === 1,
        genresChecked: row.genres_checked === 1,
      }));
    },

    /** Fills in the genres of a book indexed before subjects were read, leaving everything else as it is. */
    backfillGenres: database.transaction((bookId: number, genres: string[]): void => {
      replaceGenres(bookId, genres);
      statements.setGenresChecked.run(bookId);
    }),

    /** Fills in the series of a book indexed before series were read, leaving everything else as it is. */
    backfillSeries: database.transaction((bookId: number, fileSeries: string | null, fileSeriesIndex: number | null): void => {
      const row = statements.getStoredBook.get(bookId);
      if (!row) {
        return;
      }
      // A series an admin gave the book since wins over the file. A correction that only touched the title or
      // the authors recorded "no series" because nothing was known then: it takes the file's series instead.
      const override = row.content_hash ? statements.getOverride.get(row.content_hash) : undefined;
      const corrected = override?.has_series === 1 && override.series !== null;
      const series = corrected ? override.series : fileSeries;
      const seriesIndex = corrected ? override.series_index : fileSeriesIndex;
      if (override && !corrected && row.content_hash) {
        statements.setOverrideSeries.run(series, seriesIndex, row.content_hash);
      }
      statements.setSeries.run(series, seriesIndex, bookId);
      replaceAuthorsAndSearchEntry(bookId, {
        title: row.title,
        authors: statements.listAuthorNames.all(bookId).map((author) => author.name),
        description: statements.getSearchDescription.get(bookId)?.description ?? null,
        series,
      });
    }),

    setContentHash(bookId: number, contentHash: string): void {
      statements.setContentHash.run(contentHash, bookId);
    },

    /** Books whose file is byte-for-byte the given one. */
    findIdentical(contentHash: string): ExistingBook[] {
      return statements.findByContentHash.all(contentHash).map(toExistingBook);
    },

    /** Books with the same title (case and accents aside), whatever the authors or the file. */
    findByTitle(title: string): ExistingBook[] {
      return statements.findBySortTitle.all(toSortKey(title)).map(toExistingBook);
    },

    findByFilePath(filePath: string): ExistingBook | null {
      const row = statements.findByFilePath.get(filePath);
      return row ? toExistingBook(row) : null;
    },

    listInvalidFiles(): FileFingerprint[] {
      return statements.listInvalidFiles.all().map((row) => ({
        filePath: row.file_path,
        fileSize: row.file_size,
        fileMtimeMs: row.file_mtime_ms,
      }));
    },

    /** Inserts the book, or updates it when `existingBookId` is given. Returns the book id. */
    saveBook: database.transaction((fileRecord: BookRecord, existingBookId: number | null): number => {
      const record = withOverride(fileRecord);
      const now = new Date().toISOString();
      const fields = {
        fileSize: record.fileSize,
        fileMtimeMs: record.fileMtimeMs,
        contentHash: record.contentHash,
        title: record.title,
        sortTitle: toSortKey(record.title),
        language: record.language,
        description: record.description,
        series: record.series,
        seriesIndex: record.seriesIndex,
        now,
      };
      let bookId = existingBookId;
      if (bookId === null) {
        const inserted = statements.insertBook.get({ ...fields, filePath: record.filePath });
        if (!inserted) {
          throw new Error(`Insert of "${record.filePath}" returned no id`);
        }
        bookId = inserted.id;
      } else {
        statements.updateBook.run({ ...fields, bookId });
      }
      replaceAuthorsAndSearchEntry(bookId, record);
      replaceGenres(bookId, record.genres);
      statements.deleteInvalidFile.run(record.filePath);
      return bookId;
    }),

    getStoredBook(bookId: number): StoredBook | null {
      const row = statements.getStoredBook.get(bookId);
      if (!row) {
        return null;
      }
      return {
        bookId: row.id,
        filePath: row.file_path,
        contentHash: row.content_hash,
        coverFile: row.cover_file,
        title: row.title,
        authors: statements.listAuthorNames.all(row.id).map((author) => author.name),
        series: row.series,
        seriesIndex: row.series_index,
      };
    },

    listBookIdsByAuthor: (authorName: string): number[] => statements.listBookIdsByAuthor.all(authorName).map((row) => row.book_id),

    /**
     * Remembers a correction for the file with this hash, so it is applied again whenever that file is indexed.
     * Does not touch a book already in the catalog: `correctBook` does both.
     */
    saveOverride(contentHash: string, correction: BookCorrection, updatedBy: string | null): void {
      statements.upsertOverride.run({
        contentHash,
        title: correction.title,
        authorsJson: JSON.stringify(correction.authors),
        series: correction.series,
        seriesIndex: correction.seriesIndex,
        now: new Date().toISOString(),
        updatedBy,
      });
    },

    /** Applies a correction to a catalogued book and records it against the file's hash. */
    correctBook: database.transaction((bookId: number, contentHash: string, correction: BookCorrection, updatedBy: string | null): void => {
      const now = new Date().toISOString();
      statements.upsertOverride.run({
        contentHash,
        title: correction.title,
        authorsJson: JSON.stringify(correction.authors),
        series: correction.series,
        seriesIndex: correction.seriesIndex,
        now,
        updatedBy,
      });
      statements.correctBook.run({
        bookId,
        title: correction.title,
        sortTitle: toSortKey(correction.title),
        series: correction.series,
        seriesIndex: correction.seriesIndex,
        now,
      });
      replaceAuthorsAndSearchEntry(bookId, { ...correction, description: statements.getSearchDescription.get(bookId)?.description ?? null });
    }),

    /** Files the book under a language, and remembers it against the file's hash like any other correction. */
    setLanguage: database.transaction((bookId: number, contentHash: string, language: string, updatedBy: string | null): void => {
      const now = new Date().toISOString();
      statements.upsertLanguageOverride.run(contentHash, language, now, updatedBy);
      statements.setLanguage.run(language, now, bookId);
    }),

    setCoverFile(bookId: number, coverFile: string | null): void {
      statements.setCoverFile.run(coverFile, bookId);
    },

    deleteBook: database.transaction((bookId: number): void => {
      statements.deleteSearchEntry.run(bookId);
      statements.deleteBook.run(bookId);
    }),

    markInvalid(fingerprint: FileFingerprint, error: string): void {
      statements.upsertInvalidFile.run({ ...fingerprint, error, now: new Date().toISOString() });
    },

    forgetInvalid(filePath: string): void {
      statements.deleteInvalidFile.run(filePath);
    },

    deleteOrphanAuthors(): void {
      statements.deleteOrphanAuthors.run();
    },

    deleteOrphanGenres(): void {
      statements.deleteOrphanGenres.run();
    },
  };
}
