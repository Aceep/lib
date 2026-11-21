// Mirrors the server's response shapes (server/src/catalog/catalog-queries.ts, server/src/sync/sync-service.ts).

export type BookSort = "relevance" | "title" | "recent";

export type BookSummary = {
  id: number;
  title: string;
  authors: string[];
  language: string | null;
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
