import Database from "better-sqlite3";

export type LibraryDatabase = Database.Database;

// Each entry upgrades the schema by one version; PRAGMA user_version records how far a database has gone.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    file_mtime_ms INTEGER NOT NULL,
    title TEXT NOT NULL,
    sort_title TEXT NOT NULL,
    language TEXT,
    description TEXT,
    cover_file TEXT,
    added_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX books_language ON books (language);
  CREATE INDEX books_sort_title ON books (sort_title);

  CREATE TABLE authors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    sort_name TEXT NOT NULL
  );

  CREATE TABLE book_authors (
    book_id INTEGER NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (book_id, author_id)
  );
  CREATE INDEX book_authors_author ON book_authors (author_id);

  -- remove_diacritics lets "evenement" match "événement".
  CREATE VIRTUAL TABLE books_fts USING fts5 (
    title, authors, description,
    tokenize = 'unicode61 remove_diacritics 2'
  );

  -- Files that failed to parse, keyed by size and mtime so they are only retried once they change.
  CREATE TABLE invalid_files (
    file_path TEXT PRIMARY KEY,
    file_size INTEGER NOT NULL,
    file_mtime_ms INTEGER NOT NULL,
    error TEXT NOT NULL,
    detected_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE sync_runs (
    id INTEGER PRIMARY KEY,
    trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled')),
    status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
    started_at TEXT NOT NULL,
    finished_at TEXT,
    added INTEGER,
    updated INTEGER,
    removed INTEGER,
    unchanged INTEGER,
    failures_json TEXT,
    error TEXT
  );
  `,
];

function migrate(database: LibraryDatabase): void {
  const currentVersion = Number(database.pragma("user_version", { simple: true }));
  for (let version = currentVersion; version < MIGRATIONS.length; version++) {
    database.transaction(() => {
      database.exec(MIGRATIONS[version] ?? "");
      database.pragma(`user_version = ${version + 1}`);
    })();
  }
}

export function openLibraryDatabase(filePath: string): LibraryDatabase {
  const database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  migrate(database);
  return database;
}
