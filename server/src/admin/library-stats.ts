import type { LibraryDatabase } from "../db/database.js";

export type RankedCount = { label: string; count: number };

export type LibraryStats = {
  totals: {
    books: number;
    authors: number;
    series: number;
    totalBytes: number;
    users: number;
    openRequests: number;
    pendingUploads: number;
    invalidFiles: number;
  };
  downloads: {
    /** Over the whole activity log, which only goes back as far as its retention period. */
    total: number;
    last30Days: number;
    /** Books of the library nobody has downloaded in that period. */
    neverDownloaded: number;
    topBooks: { bookId: number | null; title: string; count: number }[];
    byUser: RankedCount[];
  };
  /** The last twelve months, oldest first, months without any addition included. */
  addedByMonth: { month: string; count: number }[];
  languages: RankedCount[];
};

const TOP_BOOKS = 10;
const MONTHS_SHOWN = 12;

/** "2026-11" and the eleven months before it, oldest first. */
function lastMonths(now: Date): string[] {
  return Array.from({ length: MONTHS_SHOWN }, (_, index) => {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_SHOWN - 1 - index), 1));
    return month.toISOString().slice(0, 7);
  });
}

export type LibraryStatsQueries = ReturnType<typeof createLibraryStatsQueries>;

export function createLibraryStatsQueries({ database, now = () => new Date() }: { database: LibraryDatabase; now?: () => Date }) {
  const count = (sql: string) => database.prepare<[], { count: number }>(sql);
  const statements = {
    books: database.prepare<[], { count: number; bytes: number | null; series: number }>(
      "SELECT count(*) AS count, sum(file_size) AS bytes, count(DISTINCT lower(series)) AS series FROM books",
    ),
    authors: count("SELECT count(DISTINCT author_id) AS count FROM book_authors"),
    users: count("SELECT count(*) AS count FROM users"),
    openRequests: count("SELECT count(*) AS count FROM book_requests WHERE status = 'open'"),
    pendingUploads: count("SELECT count(*) AS count FROM upload_submissions WHERE status = 'pending'"),
    invalidFiles: count("SELECT count(*) AS count FROM invalid_files"),
    downloads: database.prepare<[string], { total: number; recent: number | null }>(
      "SELECT count(*) AS total, sum(occurred_at >= ?) AS recent FROM activity_log WHERE action = 'download'",
    ),
    neverDownloaded: count(
      "SELECT count(*) AS count FROM books WHERE id NOT IN (SELECT book_id FROM activity_log WHERE action = 'download' AND book_id IS NOT NULL)",
    ),
    topBooks: database.prepare<[number], { book_id: number; current_title: string | null; logged_title: string | null; count: number }>(
      // The title of a book that left the library since is still in the log entry.
      `SELECT activity_log.book_id, books.title AS current_title, max(json_extract(activity_log.details_json, '$.title')) AS logged_title, count(*) AS count
       FROM activity_log LEFT JOIN books ON books.id = activity_log.book_id
       WHERE activity_log.action = 'download' AND activity_log.book_id IS NOT NULL
       GROUP BY activity_log.book_id ORDER BY count DESC, activity_log.book_id LIMIT ?`,
    ),
    downloadsByUser: database.prepare<[], { username: string | null; count: number }>(
      "SELECT username, count(*) AS count FROM activity_log WHERE action = 'download' GROUP BY username ORDER BY count DESC",
    ),
    addedByMonth: database.prepare<[string], { month: string; count: number }>(
      "SELECT substr(added_at, 1, 7) AS month, count(*) AS count FROM books WHERE added_at >= ? GROUP BY month",
    ),
    languages: database.prepare<[], { language: string | null; count: number }>(
      "SELECT language, count(*) AS count FROM books GROUP BY language ORDER BY count DESC, language",
    ),
  };

  return {
    getStats(): LibraryStats {
      const books = statements.books.get();
      const months = lastMonths(now());
      const addedCounts = new Map(statements.addedByMonth.all(`${months[0]}-01`).map((row) => [row.month, row.count]));
      const downloads = statements.downloads.get(new Date(now().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
      return {
        totals: {
          books: books?.count ?? 0,
          authors: statements.authors.get()?.count ?? 0,
          series: books?.series ?? 0,
          totalBytes: books?.bytes ?? 0,
          users: statements.users.get()?.count ?? 0,
          openRequests: statements.openRequests.get()?.count ?? 0,
          pendingUploads: statements.pendingUploads.get()?.count ?? 0,
          invalidFiles: statements.invalidFiles.get()?.count ?? 0,
        },
        downloads: {
          total: downloads?.total ?? 0,
          last30Days: downloads?.recent ?? 0,
          neverDownloaded: statements.neverDownloaded.get()?.count ?? 0,
          topBooks: statements.topBooks.all(TOP_BOOKS).map((row) => ({
            // Null once the book is gone, so the page does not link to a dead entry.
            bookId: row.current_title === null ? null : row.book_id,
            title: row.current_title ?? row.logged_title ?? "Livre supprimé",
            count: row.count,
          })),
          byUser: statements.downloadsByUser.all().map((row) => ({ label: row.username ?? "Compte supprimé", count: row.count })),
        },
        addedByMonth: months.map((month) => ({ month, count: addedCounts.get(month) ?? 0 })),
        languages: statements.languages.all().map((row) => ({ label: row.language ?? "", count: row.count })),
      };
    },
  };
}
