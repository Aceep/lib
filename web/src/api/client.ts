import type { BookDetails, BookPage, BookSort, CatalogFacets, SyncRun, SyncStatus } from "./types.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export type BookListParams = {
  query: string;
  author: string;
  language: string;
  sort: BookSort;
  page: number;
  pageSize: number;
};

export function fetchBooks(params: BookListParams, signal?: AbortSignal): Promise<BookPage> {
  const search = new URLSearchParams({ sort: params.sort, page: String(params.page), pageSize: String(params.pageSize) });
  if (params.query) search.set("q", params.query);
  if (params.author) search.set("author", params.author);
  if (params.language) search.set("language", params.language);
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

export const coverUrl = (bookId: number) => `/api/books/${bookId}/cover`;
export const fileUrl = (bookId: number) => `/api/books/${bookId}/file`;
