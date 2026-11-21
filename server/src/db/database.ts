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
  `
  -- SHA-256 of the file, so an upload can be recognised as a copy of a book already in the library.
  -- NULL until the indexer gets to a book that predates this column.
  ALTER TABLE books ADD COLUMN content_hash TEXT;
  CREATE INDEX books_content_hash ON books (content_hash);
  `,
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    created_at TEXT NOT NULL
  );

  -- Only the SHA-256 of the cookie value is stored: a leaked database does not hand out live sessions.
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions (user_id);
  `,
  `
  CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY,
    occurred_at TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    -- Kept next to user_id so the entry still names its author after the account is deleted.
    username TEXT,
    ip TEXT,
    user_agent TEXT,
    -- Not a foreign key: books come and go with syncs, the log must outlive them.
    book_id INTEGER,
    details_json TEXT
  );
  CREATE INDEX activity_log_occurred_at ON activity_log (occurred_at);
  CREATE INDEX activity_log_action ON activity_log (action);
  `,
  `
  -- Uploads from members wait here for an admin; the file itself sits in the staging directory as <id>.epub
  -- while the row is pending. Decided rows stay so the member can see what became of their upload.
  CREATE TABLE upload_submissions (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    title TEXT NOT NULL,
    authors_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TEXT NOT NULL,
    decided_at TEXT,
    decided_by TEXT,
    reason TEXT,
    book_id INTEGER
  );
  CREATE INDEX upload_submissions_user ON upload_submissions (user_id);
  CREATE INDEX upload_submissions_status ON upload_submissions (status);
  `,
  `
  ALTER TABLE books ADD COLUMN series TEXT;
  ALTER TABLE books ADD COLUMN series_index REAL;
  -- 0 for books indexed before series were read: the indexer fills them in without re-reading anything else,
  -- so titles and authors corrected at upload time are left alone.
  ALTER TABLE books ADD COLUMN series_checked INTEGER NOT NULL DEFAULT 0;
  CREATE INDEX books_series ON books (series);

  -- Corrections made in the app. Keyed by the file's hash, not the book id: a rebuilt index or a moved
  -- file still finds its correction. A NULL column means "as read from the file".
  CREATE TABLE book_overrides (
    content_hash TEXT PRIMARY KEY,
    title TEXT,
    authors_json TEXT,
    -- has_series tells "no series" (1, series NULL) apart from "not corrected" (0).
    has_series INTEGER NOT NULL DEFAULT 0,
    series TEXT,
    series_index REAL,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  );
  `,
  `
  -- Authors whose bibliography is fetched from Wikidata and Open Library to list what the library lacks.
  CREATE TABLE followed_authors (
    id INTEGER PRIMARY KEY,
    -- The author as named in the library.
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    wikidata_id TEXT NOT NULL,
    wikidata_label TEXT NOT NULL,
    openlibrary_key TEXT,
    fetched_at TEXT,
    fetch_error TEXT
  );

  CREATE TABLE author_works (
    id INTEGER PRIMARY KEY,
    followed_author_id INTEGER NOT NULL REFERENCES followed_authors (id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('wikidata', 'openlibrary')),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    alternate_titles_json TEXT NOT NULL,
    series TEXT,
    series_index REAL,
    year INTEGER,
    -- The admin's call; NULL leaves it to title matching against the library.
    decision TEXT CHECK (decision IN ('ignored', 'owned')),
    UNIQUE (followed_author_id, source, external_id)
  );
  `,
  `
  -- Books someone would like to see in the library.
  CREATE TABLE book_requests (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    note TEXT,
    status TEXT NOT NULL CHECK (status IN ('open', 'fulfilled', 'dropped')),
    created_at TEXT NOT NULL,
    closed_at TEXT,
    -- Not foreign keys: the request must outlive the book being re-indexed and the author being unfollowed.
    book_id INTEGER,
    work_id INTEGER
  );
  CREATE INDEX book_requests_status ON book_requests (status);
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
