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
};

export type BookRecord = FileFingerprint & {
  contentHash: string;
  title: string;
  authors: string[];
  language: string | null;
  description: string | null;
};

type IndexedFileRow = {
  id: number;
  file_path: string;
  file_size: number;
  file_mtime_ms: number;
  cover_file: string | null;
  content_hash: string | null;
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
      "SELECT id, file_path, file_size, file_mtime_ms, cover_file, content_hash FROM books",
    ),
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
        now: string;
      },
      { id: number }
    >(
      `INSERT INTO books (file_path, file_size, file_mtime_ms, content_hash, title, sort_title, language, description, added_at, updated_at)
       VALUES (@filePath, @fileSize, @fileMtimeMs, @contentHash, @title, @sortTitle, @language, @description, @now, @now)
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
      now: string;
    }>(
      `UPDATE books SET file_size = @fileSize, file_mtime_ms = @fileMtimeMs, content_hash = @contentHash, title = @title,
         sort_title = @sortTitle, language = @language, description = @description, updated_at = @now
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
  };

  function toExistingBook(row: DuplicateRow): ExistingBook {
    return {
      bookId: row.id,
      title: row.title,
      authors: statements.listAuthorNames.all(row.id).map((author) => author.name),
      filePath: row.file_path,
    };
  }

  function replaceAuthorsAndSearchEntry(bookId: number, record: BookRecord): void {
    statements.deleteBookAuthors.run(bookId);
    record.authors.forEach((name, position) => {
      const author = statements.upsertAuthor.get(name, toSortKey(name));
      if (author) {
        statements.insertBookAuthor.run(bookId, author.id, position);
      }
    });
    statements.deleteSearchEntry.run(bookId);
    statements.insertSearchEntry.run(bookId, record.title, record.authors.join(" "), record.description ?? "");
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
      }));
    },

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
    saveBook: database.transaction((record: BookRecord, existingBookId: number | null): number => {
      const now = new Date().toISOString();
      const fields = {
        fileSize: record.fileSize,
        fileMtimeMs: record.fileMtimeMs,
        contentHash: record.contentHash,
        title: record.title,
        sortTitle: toSortKey(record.title),
        language: record.language,
        description: record.description,
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
      statements.deleteInvalidFile.run(record.filePath);
      return bookId;
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
  };
}
