import type { BookListParams } from "../api/client.js";
import type { BookSort } from "../api/types.js";

export const PAGE_SIZE = 24;

const SORTS: readonly BookSort[] = ["relevance", "title", "recent"];

export type CatalogParams = Omit<BookListParams, "pageSize" | "series"> & { series: string };

export function toBookSort(value: string | null): BookSort {
  return SORTS.find((sort) => sort === value) ?? "relevance";
}

/** The URL is the source of truth for the catalog state, so a search can be bookmarked or shared. */
export function readCatalogParams(search: URLSearchParams): CatalogParams {
  const rawPage = Number(search.get("page"));
  return {
    query: search.get("q")?.trim() ?? "",
    author: search.get("author")?.trim() ?? "",
    language: search.get("language")?.trim() ?? "",
    series: search.get("series")?.trim() ?? "",
    sort: toBookSort(search.get("sort")),
    page: Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

/** Writes only non-default values, which keeps URLs short. */
export function writeCatalogParams(params: CatalogParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.query) {
    search.set("q", params.query);
  }
  if (params.author) {
    search.set("author", params.author);
  }
  if (params.language) {
    search.set("language", params.language);
  }
  if (params.series) {
    search.set("series", params.series);
  }
  if (params.sort !== "relevance") {
    search.set("sort", params.sort);
  }
  if (params.page > 1) {
    search.set("page", String(params.page));
  }
  return search;
}

/** Any change to what is searched sends the reader back to the first page. */
export function updateCatalogParams(current: CatalogParams, change: Partial<CatalogParams>): CatalogParams {
  const resetsPage = Object.keys(change).some((key) => key !== "page");
  return { ...current, ...change, page: resetsPage ? 1 : (change.page ?? current.page) };
}
