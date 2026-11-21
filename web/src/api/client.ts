import type {
  ActivityAction,
  AuthorCandidate,
  LibraryStats,
  BookRequest,
  RequestStatus,
  MissingBooksReport,
  WorkDecision,
  BookCorrection,
  ActivityPage,
  LibraryHealth,
  SeriesSuggestion,
  UploadSubmission,
  BookDetails, BookPage, BookSort, CatalogFacets, SyncRun, SyncStatus, UploadPreview, UploadResult, User, UserRole } from "./types.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Fired when the server no longer recognises the session, so the app can fall back to the login page. */
export const SESSION_ENDED_EVENT = "kyle-lib:session-ended";

async function request(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : `HTTP ${response.status}`;
    // A failed login also answers 401, but there is no session to end then.
    if (response.status === 401 && !url.startsWith("/api/auth/login")) {
      document.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT));
    }
    throw new ApiError(response.status, message);
  }
  return response;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  return (await (await request(url, init)).json()) as T;
}

function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

/** The signed-in user, or null when there is no valid session. */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<User | null> {
  const response = await fetch("/api/auth/me", { signal: signal ?? null });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}`);
  }
  return (await response.json()) as User;
}

export function login(username: string, password: string): Promise<User> {
  return requestJson("/api/auth/login", jsonBody("POST", { username, password }));
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request("/api/auth/password", jsonBody("POST", { currentPassword, newPassword }));
}

export function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  return requestJson("/api/admin/users", { signal: signal ?? null });
}

export function createUser(username: string, password: string, role: UserRole): Promise<User> {
  return requestJson("/api/admin/users", jsonBody("POST", { username, password, role }));
}

export async function resetUserPassword(userId: number, password: string): Promise<void> {
  await request(`/api/admin/users/${userId}/password`, jsonBody("POST", { password }));
}

export async function deleteUser(userId: number): Promise<void> {
  await request(`/api/admin/users/${userId}`, { method: "DELETE" });
}

export type BookListParams = {
  query: string;
  author: string;
  language: string;
  /** Exact series name; the volumes then come in reading order. */
  series?: string;
  /** Exact genre name, as listed in the facets. */
  genre?: string;
  sort: BookSort;
  page: number;
  pageSize: number;
};

export function fetchBooks(params: BookListParams, signal?: AbortSignal): Promise<BookPage> {
  const search = new URLSearchParams({ sort: params.sort, page: String(params.page), pageSize: String(params.pageSize) });
  if (params.query) search.set("q", params.query);
  if (params.author) search.set("author", params.author);
  if (params.language) search.set("language", params.language);
  if (params.series) search.set("series", params.series);
  if (params.genre) search.set("genre", params.genre);
  return requestJson(`/api/books?${search}`, { signal: signal ?? null });
}

export function fetchBook(bookId: number, signal?: AbortSignal): Promise<BookDetails> {
  return requestJson(`/api/books/${bookId}`, { signal: signal ?? null });
}

export function fetchFacets(signal?: AbortSignal): Promise<CatalogFacets> {
  return requestJson("/api/facets", { signal: signal ?? null });
}

export function fetchSyncStatus(signal?: AbortSignal): Promise<SyncStatus> {
  return requestJson("/api/sync", { signal: signal ?? null });
}

export function startSync(): Promise<SyncRun> {
  return requestJson("/api/sync", { method: "POST" });
}

/** Sends the file to the staging area; nothing enters the library until `confirmUpload`. */
export function stageUpload(file: File, signal?: AbortSignal): Promise<UploadPreview> {
  const body = new FormData();
  body.append("file", file, file.name);
  return requestJson("/api/uploads", { method: "POST", body, signal: signal ?? null });
}

/** Corrects the title/authors read from the file; the server answers with the updated destination and duplicates. */
export function updateUpload(uploadId: string, changes: { title: string; authors: string[] }, signal?: AbortSignal): Promise<UploadPreview> {
  return requestJson(`/api/uploads/${uploadId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(changes),
    signal: signal ?? null,
  });
}

export function confirmUpload(uploadId: string): Promise<UploadResult> {
  return requestJson(`/api/uploads/${uploadId}/confirm`, { method: "POST" });
}

/** A member's upload does not enter the library: it waits for an admin to confirm or reject it. */
export function submitUpload(uploadId: string): Promise<UploadPreview> {
  return requestJson(`/api/uploads/${uploadId}/submit`, { method: "POST" });
}

export function fetchMySubmissions(signal?: AbortSignal): Promise<UploadSubmission[]> {
  return requestJson("/api/uploads/mine", { signal: signal ?? null });
}

export function fetchSubmittedUploads(signal?: AbortSignal): Promise<UploadPreview[]> {
  return requestJson("/api/admin/uploads", { signal: signal ?? null });
}

export async function fetchSubmittedUploadCount(signal?: AbortSignal): Promise<number> {
  return (await requestJson<{ count: number }>("/api/admin/uploads/count", { signal: signal ?? null })).count;
}

export async function rejectUpload(uploadId: string, reason: string): Promise<void> {
  await request(`/api/admin/uploads/${uploadId}/reject`, jsonBody("POST", reason ? { reason } : {}));
}

export type ActivityParams = { action: ActivityAction | ""; username: string; page: number };

export function fetchActivity(params: ActivityParams, signal?: AbortSignal): Promise<ActivityPage> {
  const search = new URLSearchParams({ page: String(params.page) });
  if (params.action) search.set("action", params.action);
  if (params.username) search.set("username", params.username);
  return requestJson(`/api/admin/activity?${search}`, { signal: signal ?? null });
}

/** Changes what the catalog shows for a book; the EPUB file itself is left alone. */
export function correctBook(bookId: number, correction: BookCorrection): Promise<BookDetails> {
  return requestJson(`/api/admin/books/${bookId}`, jsonBody("PATCH", correction));
}

/** Moves the book's file to the trash folder and takes it out of the catalog. */
export async function deleteBook(bookId: number): Promise<void> {
  await request(`/api/admin/books/${bookId}`, { method: "DELETE" });
}

export function mergeAuthors(from: string[], into: string): Promise<{ into: string; changedBooks: number }> {
  return requestJson("/api/admin/authors/merge", jsonBody("POST", { from, into }));
}

/** Rewrites one author field on all its books: a name put the right way round, or several people separated. */
export function rewriteAuthor(from: string, into: string[]): Promise<{ into: string[]; changedBooks: number }> {
  return requestJson("/api/admin/authors/rewrite", jsonBody("POST", { from, into }));
}

export function fetchLibraryStats(signal?: AbortSignal): Promise<LibraryStats> {
  return requestJson("/api/admin/stats", { signal: signal ?? null });
}

export function fetchRequests(signal?: AbortSignal): Promise<BookRequest[]> {
  return requestJson("/api/requests", { signal: signal ?? null });
}

export function createRequest(request: { title: string; author?: string; note?: string; workId?: number }): Promise<BookRequest> {
  return requestJson("/api/requests", jsonBody("POST", request));
}

export function setRequestStatus(requestId: number, status: RequestStatus): Promise<BookRequest> {
  return requestJson(`/api/requests/${requestId}`, jsonBody("PATCH", { status }));
}

export function fetchMissingBooks(signal?: AbortSignal): Promise<MissingBooksReport> {
  return requestJson("/api/admin/missing", { signal: signal ?? null });
}

/** The people Wikidata knows under that name, for the admin to pick the right one. */
export function searchAuthorCandidates(name: string): Promise<AuthorCandidate[]> {
  return requestJson(`/api/admin/missing/candidates?${new URLSearchParams({ name })}`);
}

export function followAuthor(name: string, candidate: AuthorCandidate): Promise<MissingBooksReport> {
  return requestJson("/api/admin/missing/authors", jsonBody("POST", { name, wikidataId: candidate.wikidataId, wikidataLabel: candidate.label }));
}

export function refreshFollowedAuthor(authorId: number): Promise<MissingBooksReport> {
  return requestJson(`/api/admin/missing/authors/${authorId}/refresh`, { method: "POST" });
}

export async function unfollowAuthor(authorId: number): Promise<void> {
  await request(`/api/admin/missing/authors/${authorId}`, { method: "DELETE" });
}

/** `null` hands the work back to automatic title matching. */
export async function decideWork(workId: number, decision: WorkDecision | null): Promise<void> {
  await request(`/api/admin/missing/works/${workId}`, jsonBody("PUT", { decision }));
}

export function fetchSeriesSuggestions(signal?: AbortSignal): Promise<SeriesSuggestion[]> {
  return requestJson("/api/admin/series-suggestions", { signal: signal ?? null });
}

/** Files the given books under one language ("fr"). */
export function setBooksLanguage(bookIds: number[], language: string): Promise<{ changedBooks: number }> {
  return requestJson("/api/admin/books/language", jsonBody("POST", { bookIds, language }));
}

export function fetchLibraryHealth(signal?: AbortSignal): Promise<LibraryHealth> {
  return requestJson("/api/admin/health", { signal: signal ?? null });
}

export async function cancelUpload(uploadId: string): Promise<void> {
  const response = await fetch(`/api/uploads/${uploadId}`, { method: "DELETE" });
  // 404 means it already expired server-side: the outcome the caller wanted.
  if (!response.ok && response.status !== 404) {
    throw new ApiError(response.status, `HTTP ${response.status}`);
  }
}

export const coverUrl = (bookId: number) => `/api/books/${bookId}/cover`;
export const fileUrl = (bookId: number) => `/api/books/${bookId}/file`;
