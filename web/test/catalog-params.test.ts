import { describe, expect, it } from "vitest";
import { readCatalogParams, updateCatalogParams, writeCatalogParams } from "../src/catalog/catalog-params.js";

const DEFAULTS = { query: "", author: "", language: "", sort: "relevance", page: 1 } as const;

describe("readCatalogParams", () => {
  it("falls back to defaults on an empty URL", () => {
    expect(readCatalogParams(new URLSearchParams())).toEqual(DEFAULTS);
  });

  it("reads every parameter", () => {
    const params = readCatalogParams(new URLSearchParams("q=dune&author=Frank%20Herbert&language=en&sort=recent&page=3"));

    expect(params).toEqual({ query: "dune", author: "Frank Herbert", language: "en", sort: "recent", page: 3 });
  });

  it("ignores an unknown sort and an invalid page", () => {
    expect(readCatalogParams(new URLSearchParams("sort=random&page=-2"))).toEqual(DEFAULTS);
  });
});

describe("writeCatalogParams", () => {
  it("omits default values", () => {
    expect(writeCatalogParams(DEFAULTS).toString()).toBe("");
  });

  it("round-trips through readCatalogParams", () => {
    const params = { query: "été", author: "Annie Ernaux", language: "fr", sort: "title", page: 2 } as const;

    expect(readCatalogParams(writeCatalogParams(params))).toEqual(params);
  });
});

describe("updateCatalogParams", () => {
  it("goes back to the first page when the search changes", () => {
    expect(updateCatalogParams({ ...DEFAULTS, page: 4 }, { query: "dune" }).page).toBe(1);
  });

  it("keeps the filters when only the page changes", () => {
    const current = { ...DEFAULTS, author: "Frank Herbert", page: 1 };

    expect(updateCatalogParams(current, { page: 2 })).toEqual({ ...current, page: 2 });
  });
});
