import type { User } from "../auth/auth-service.js";
import type { LibraryDatabase } from "../db/database.js";

export const ACTIVITY_ACTIONS = [
  "login",
  "login_failed",
  "logout",
  "password_changed",
  "user_created",
  "user_deleted",
  "password_reset",
  "download",
  "upload",
  "upload_submitted",
  "upload_approved",
  "upload_rejected",
  "upload_cancelled",
  "sync_started",
  "book_edited",
  "book_deleted",
  "authors_merged",
  "series_merged",
  "request_created",
  "request_fulfilled",
  "request_dropped",
  "request_reopened",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

/** Who did it, as far as the request tells. */
export type Actor = {
  user: Pick<User, "id" | "username"> | null;
  ip: string | null;
  userAgent: string | null;
};

export type ActivityDetails = Record<string, string | number | boolean | null>;

export type ActivityEntry = {
  id: number;
  occurredAt: string;
  action: ActivityAction;
  userId: number | null;
  username: string | null;
  ip: string | null;
  userAgent: string | null;
  bookId: number | null;
  details: ActivityDetails;
};

export type ActivityFilter = {
  action: ActivityAction | null;
  username: string | null;
  page: number;
  pageSize: number;
};

export type ActivityPage = {
  items: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
};

type ActivityRow = {
  id: number;
  occurred_at: string;
  action: ActivityAction;
  user_id: number | null;
  username: string | null;
  ip: string | null;
  user_agent: string | null;
  book_id: number | null;
  details_json: string | null;
};

const MAX_USER_AGENT_LENGTH = 300;

export type ActivityLog = ReturnType<typeof createActivityLog>;

export function createActivityLog({ database, now = () => new Date() }: { database: LibraryDatabase; now?: () => Date }) {
  const statements = {
    insert: database.prepare<{
      occurredAt: string;
      action: ActivityAction;
      userId: number | null;
      username: string | null;
      ip: string | null;
      userAgent: string | null;
      bookId: number | null;
      detailsJson: string | null;
    }>(
      `INSERT INTO activity_log (occurred_at, action, user_id, username, ip, user_agent, book_id, details_json)
       VALUES (@occurredAt, @action, @userId, @username, @ip, @userAgent, @bookId, @detailsJson)`,
    ),
    list: database.prepare<{ action: string | null; username: string | null; limit: number; offset: number }, ActivityRow>(
      `SELECT id, occurred_at, action, user_id, username, ip, user_agent, book_id, details_json
       FROM activity_log
       WHERE (@action IS NULL OR action = @action) AND (@username IS NULL OR username = @username COLLATE NOCASE)
       ORDER BY id DESC LIMIT @limit OFFSET @offset`,
    ),
    count: database.prepare<{ action: string | null; username: string | null }, { count: number }>(
      `SELECT count(*) AS count FROM activity_log
       WHERE (@action IS NULL OR action = @action) AND (@username IS NULL OR username = @username COLLATE NOCASE)`,
    ),
    listUsernames: database.prepare<[], { username: string }>(
      "SELECT DISTINCT username FROM activity_log WHERE username IS NOT NULL ORDER BY username COLLATE NOCASE",
    ),
    purge: database.prepare<[string]>("DELETE FROM activity_log WHERE occurred_at < ?"),
  };

  return {
    record(action: ActivityAction, actor: Actor, extra: { bookId?: number; details?: ActivityDetails } = {}): void {
      statements.insert.run({
        occurredAt: now().toISOString(),
        action,
        userId: actor.user?.id ?? null,
        // Copied rather than joined: the entry must still read "bob" once bob's account is deleted.
        username: actor.user?.username ?? null,
        ip: actor.ip,
        userAgent: actor.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
        bookId: extra.bookId ?? null,
        detailsJson: extra.details ? JSON.stringify(extra.details) : null,
      });
    },

    /** Most recent first. */
    list(filter: ActivityFilter): ActivityPage {
      const where = { action: filter.action, username: filter.username };
      const rows = statements.list.all({ ...where, limit: filter.pageSize, offset: (filter.page - 1) * filter.pageSize });
      return {
        items: rows.map((row) => ({
          id: row.id,
          occurredAt: row.occurred_at,
          action: row.action,
          userId: row.user_id,
          username: row.username,
          ip: row.ip,
          userAgent: row.user_agent,
          bookId: row.book_id,
          details: row.details_json ? (JSON.parse(row.details_json) as ActivityDetails) : {},
        })),
        total: statements.count.get(where)?.count ?? 0,
        page: filter.page,
        pageSize: filter.pageSize,
      };
    },

    /** Every name that appears in the log, deleted accounts included, for the filter of the admin page. */
    listUsernames: (): string[] => statements.listUsernames.all().map((row) => row.username),

    /** Drops entries older than `retentionDays`; returns how many went. */
    purgeOlderThan(retentionDays: number): number {
      const limit = new Date(now().getTime() - retentionDays * 24 * 60 * 60 * 1000);
      return statements.purge.run(limit.toISOString()).changes;
    },
  };
}
