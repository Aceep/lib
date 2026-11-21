import { authorIdentityKey } from "../admin/library-health.js";
import type { UserRole } from "../auth/auth-service.js";
import type { LibraryDatabase } from "../db/database.js";
import { libraryTitleKeys, titleKey } from "../missing/title-key.js";

export type RequestStatus = "open" | "fulfilled" | "dropped";

export type BookRequest = {
  id: number;
  title: string;
  author: string | null;
  note: string | null;
  status: RequestStatus;
  requestedBy: string;
  createdAt: string;
  closedAt: string | null;
  /** The book that answered the request, once fulfilled. */
  bookId: number | null;
  /** The entry of the "missing books" report the request was made from, if any. */
  workId: number | null;
};

export type RequestActor = { id: number; username: string; role: UserRole };

export type NewRequest = { title: string; author?: string | null; note?: string | null; workId?: number | null };

export class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: "not_found" | "forbidden" | "invalid_request" | "too_many_requests" | "already_requested",
    message: string,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

type RequestRow = {
  id: number;
  user_id: number | null;
  username: string;
  title: string;
  author: string | null;
  note: string | null;
  status: RequestStatus;
  created_at: string;
  closed_at: string | null;
  book_id: number | null;
  work_id: number | null;
};

type LibraryBookRow = { id: number; title: string; authors_json: string };

/** Open requests one member may hold: a wish list, not a way to flood the other person. */
export const MAX_OPEN_REQUESTS_PER_MEMBER = 30;

const toRequest = (row: RequestRow): BookRequest => ({
  id: row.id,
  title: row.title,
  author: row.author,
  note: row.note,
  status: row.status,
  requestedBy: row.username,
  createdAt: row.created_at,
  closedAt: row.closed_at,
  bookId: row.book_id,
  workId: row.work_id,
});

export type BookRequests = ReturnType<typeof createBookRequests>;

export function createBookRequests({ database, now = () => new Date() }: { database: LibraryDatabase; now?: () => Date }) {
  const statements = {
    list: database.prepare<[], RequestRow>("SELECT * FROM book_requests ORDER BY status != 'open', coalesce(closed_at, created_at) DESC, id DESC"),
    listOpen: database.prepare<[], RequestRow>("SELECT * FROM book_requests WHERE status = 'open'"),
    get: database.prepare<[number], RequestRow>("SELECT * FROM book_requests WHERE id = ?"),
    countOpenByUser: database.prepare<[number], { count: number }>(
      "SELECT count(*) AS count FROM book_requests WHERE user_id = ? AND status = 'open'",
    ),
    insert: database.prepare<
      { userId: number; username: string; title: string; author: string | null; note: string | null; workId: number | null; createdAt: string },
      RequestRow
    >(
      `INSERT INTO book_requests (user_id, username, title, author, note, work_id, status, created_at)
       VALUES (@userId, @username, @title, @author, @note, @workId, 'open', @createdAt) RETURNING *`,
    ),
    setStatus: database.prepare<{ id: number; status: RequestStatus; closedAt: string | null; bookId: number | null }>(
      "UPDATE book_requests SET status = @status, closed_at = @closedAt, book_id = @bookId WHERE id = @id",
    ),
    listLibraryBooks: database.prepare<[], LibraryBookRow>(
      `SELECT books.id, books.title,
         (SELECT json_group_array(authors.name) FROM book_authors JOIN authors ON authors.id = book_authors.author_id
          WHERE book_authors.book_id = books.id) AS authors_json
       FROM books`,
    ),
  };

  /**
   * Closes the open requests the library now answers, however the book arrived (upload or sync from the remote).
   * Same title, and same author when the request names one. Returns what was closed.
   */
  function closeFulfilled(): BookRequest[] {
    const open = statements.listOpen.all();
    if (open.length === 0) {
      return [];
    }
    const books = statements.listLibraryBooks.all().map((book) => ({
      id: book.id,
      titleKeys: new Set(libraryTitleKeys(book.title)),
      authorKeys: new Set((JSON.parse(book.authors_json) as string[]).map(authorIdentityKey)),
    }));
    const closed: BookRequest[] = [];
    for (const request of open) {
      const wantedTitle = titleKey(request.title);
      const wantedAuthor = request.author ? authorIdentityKey(request.author) : null;
      const match = books.find((book) => book.titleKeys.has(wantedTitle) && (wantedAuthor === null || book.authorKeys.has(wantedAuthor)));
      if (match) {
        statements.setStatus.run({ id: request.id, status: "fulfilled", closedAt: now().toISOString(), bookId: match.id });
        closed.push(toRequest(statements.get.get(request.id) as RequestRow));
      }
    }
    return closed;
  }

  return {
    closeFulfilled,

    /** Open requests first, then the most recently closed. Everyone sees every request: nobody asks twice. */
    list(): BookRequest[] {
      return statements.list.all().map(toRequest);
    },

    countOpen: (): number => statements.listOpen.all().length,

    create(request: NewRequest, actor: RequestActor): BookRequest {
      const title = request.title.trim();
      if (title === "") {
        throw new RequestError(400, "invalid_request", "Le titre ne peut pas être vide");
      }
      const author = request.author?.trim() || null;
      const duplicate = statements.listOpen
        .all()
        .find((open) => titleKey(open.title) === titleKey(title) && authorIdentityKey(open.author ?? "") === authorIdentityKey(author ?? ""));
      if (duplicate) {
        throw new RequestError(409, "already_requested", `Ce livre est déjà demandé par ${duplicate.username}`);
      }
      if (actor.role !== "admin" && (statements.countOpenByUser.get(actor.id)?.count ?? 0) >= MAX_OPEN_REQUESTS_PER_MEMBER) {
        throw new RequestError(409, "too_many_requests", `Vous avez déjà ${MAX_OPEN_REQUESTS_PER_MEMBER} demandes ouvertes`);
      }
      const row = statements.insert.get({
        userId: actor.id,
        username: actor.username,
        title,
        author,
        note: request.note?.trim() || null,
        workId: request.workId ?? null,
        createdAt: now().toISOString(),
      });
      return toRequest(row as RequestRow);
    },

    /** Admins decide on any request; a member may only withdraw (or reopen) their own. */
    setStatus(requestId: number, status: RequestStatus, actor: RequestActor): BookRequest {
      const row = statements.get.get(requestId);
      if (!row) {
        throw new RequestError(404, "not_found", "Demande introuvable");
      }
      const isOwner = row.user_id === actor.id;
      if (actor.role !== "admin" && (!isOwner || status === "fulfilled")) {
        throw new RequestError(403, "forbidden", "Vous ne pouvez modifier que vos propres demandes");
      }
      statements.setStatus.run({
        id: requestId,
        status,
        closedAt: status === "open" ? null : now().toISOString(),
        // Marked fulfilled by hand: no particular book is known. Automatic closing fills it in.
        bookId: null,
      });
      return toRequest(statements.get.get(requestId) as RequestRow);
    },
  };
}
