// Mirrors the server's response shapes (server/src/catalog/catalog-queries.ts, server/src/sync/sync-service.ts).

export type BookSort = "relevance" | "title" | "recent";

export type BookSummary = {
  id: number;
  title: string;
  authors: string[];
  language: string | null;
  series: string | null;
  /** Position in the series; null when the book has no series or no number. */
  seriesIndex: number | null;
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

export type SyncRun = {
  id: number;
  trigger: "manual" | "scheduled";
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt: string | null;
  report: {
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
    failures: { filePath: string; error: string }[];
  } | null;
  error: string | null;
};

export type SyncStatus = {
  current: SyncRun | null;
  lastFinished: SyncRun | null;
  nextScheduledAt: string | null;
};

export type UploadDuplicate = {
  bookId: number;
  title: string;
  authors: string[];
  filePath: string;
  /** identical: same bytes; same-book: same title and authors; same-path: a file already has the target name. */
  reason: "identical" | "same-book" | "same-path";
};

export type UploadPreview = {
  id: string;
  originalName: string;
  fileSize: number;
  title: string;
  authors: string[];
  language: string | null;
  targetPath: string;
  duplicates: UploadDuplicate[];
  /** draft: only its uploader has seen it; submitted: waiting for an admin. */
  status: "draft" | "submitted";
  uploadedBy: string;
  submittedAt: string | null;
};

/** What became of an upload a member sent for review. */
export type UploadSubmission = {
  id: string;
  originalName: string;
  title: string;
  authors: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  decidedAt: string | null;
  reason: string | null;
  bookId: number | null;
};

export type UploadResult = {
  bookId: number;
  filePath: string;
};

/** What an admin may correct on a book. */
export type BookCorrection = {
  title: string;
  authors: string[];
  series: string | null;
  seriesIndex: number | null;
};

export type UserRole = "admin" | "member";

export type User = {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
};

export type ActivityAction =
  | "login"
  | "login_failed"
  | "logout"
  | "password_changed"
  | "user_created"
  | "user_deleted"
  | "password_reset"
  | "download"
  | "upload"
  | "upload_submitted"
  | "upload_approved"
  | "upload_rejected"
  | "upload_cancelled"
  | "sync_started"
  | "book_edited"
  | "book_deleted"
  | "authors_merged";

export type ActivityEntry = {
  id: number;
  occurredAt: string;
  action: ActivityAction;
  username: string | null;
  ip: string | null;
  userAgent: string | null;
  bookId: number | null;
  details: Record<string, string | number | boolean | null>;
};

export type ActivityPage = {
  items: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
  /** Every name present in the log, for the user filter. */
  usernames: string[];
};

export type MissingField = "cover" | "language" | "description";

export type LibraryHealth = {
  bookCount: number;
  invalidFiles: { filePath: string; fileSize: number; error: string; detectedAt: string }[];
  incompleteBooks: { id: number; title: string; authors: string[]; missing: MissingField[] }[];
  similarAuthors: { names: { name: string; bookCount: number }[] }[];
  syncRuns: SyncRun[];
};
