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
  /** When the book entered the catalog; recent arrivals get a "nouveau" badge. */
  addedAt: string;
};

export type BookPage = {
  items: BookSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type BookDetails = BookSummary & {
  /** Shelves derived from the file's subjects; empty when they said nothing usable. */
  genres: string[];
  description: string | null;
  fileSize: number;
  addedAt: string;
  updatedAt: string;
};

export type CatalogFacets = {
  /** Ordered by family name; `sortName` is that key ("herbert frank"), `listName` the index form ("Herbert, Frank"). */
  authors: { name: string; bookCount: number; sortName: string; listName: string }[];
  languages: { code: string; bookCount: number }[];
  /** Most populated first. */
  genres: { name: string; bookCount: number }[];
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
  | "authors_merged"
  | "series_merged"
  | "request_created"
  | "request_fulfilled"
  | "request_dropped"
  | "request_reopened";

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

export type AuthorCandidate = { wikidataId: string; label: string; description: string | null };

export type WorkDecision = "ignored" | "owned";

export type AuthorWork = {
  id: number;
  title: string;
  alternateTitles: string[];
  series: string | null;
  seriesIndex: number | null;
  year: number | null;
  source: "wikidata" | "openlibrary";
  state: "missing" | "owned" | "ignored";
  /** The admin's own call; null while the state only comes from title matching. */
  decision: WorkDecision | null;
  ownedBookId: number | null;
};

export type FollowedAuthor = {
  id: number;
  name: string;
  wikidataId: string;
  wikidataLabel: string;
  fetchedAt: string | null;
  fetchError: string | null;
  works: AuthorWork[];
};

export type SeriesGap = { series: string; authors: string[]; owned: number[]; missing: number[] };

export type MissingBooksReport = { authors: FollowedAuthor[]; seriesGaps: SeriesGap[] };

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
  bookId: number | null;
  /** The entry of the "missing books" report it was made from, if any. */
  workId: number | null;
};

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
    total: number;
    last30Days: number;
    neverDownloaded: number;
    /** bookId is null once the book has left the library. */
    topBooks: { bookId: number | null; title: string; count: number }[];
    byUser: RankedCount[];
  };
  /** The last twelve months ("2026-11"), oldest first. */
  addedByMonth: { month: string; count: number }[];
  languages: RankedCount[];
};

export type MissingField = "cover" | "language" | "description";

export type AuthorlessBook = {
  id: number;
  title: string;
  filePath: string;
  authors: string[];
  series: string | null;
  seriesIndex: number | null;
  /** Read from the folder the file sits in; null when it names no author. */
  suggestedAuthor: string | null;
};

/** A series a book seems to belong to, read in its title or in the bibliography of a followed author. */
export type SeriesSuggestion = {
  bookId: number;
  title: string;
  authors: string[];
  series: string;
  seriesIndex: number | null;
  /** The title without the series and volume number; null when it stays as it is. */
  shorterTitle: string | null;
  source: "title" | "wikidata";
};

/** An author field to rewrite: family name first, capitals, or several people in one field. */
export type AuthorFix = {
  name: string;
  bookCount: number;
  people: string[];
  /** False when the order of the words is only guessed. */
  certain: boolean;
};

/** A book whose title and author were swapped. */
export type SwappedBook = {
  id: number;
  title: string;
  authors: string[];
  series: string | null;
  seriesIndex: number | null;
  suggestedTitle: string;
  suggestedAuthors: string[];
};

export type LibraryHealth = {
  bookCount: number;
  invalidFiles: { filePath: string; fileSize: number; error: string; detectedAt: string }[];
  incompleteBooks: { id: number; title: string; authors: string[]; missing: MissingField[] }[];
  similarAuthors: { names: { name: string; bookCount: number }[] }[];
  authorlessBooks: AuthorlessBook[];
  probableDuplicates: { books: { id: number; title: string; authors: string[]; filePath: string; fileSize: number }[] }[];
  authorFixes: AuthorFix[];
  swappedBooks: SwappedBook[];
  syncRuns: SyncRun[];
};

export type SeriesSummary = { name: string; bookCount: number; authors: string[] };

/** What is wrong with the series of the library: several spellings, false series, numbers used twice. */
export type SeriesReport = {
  similarSeries: { names: SeriesSummary[] }[];
  doubtfulSeries: (SeriesSummary & { reason: string })[];
  duplicateVolumes: { series: string; seriesIndex: number; books: { id: number; title: string }[] }[];
};
