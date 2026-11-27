import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLibraryHealthQueries } from "../src/admin/library-health.js";
import { buildApp } from "../src/api/build-app.js";
import { createAuthService } from "../src/auth/auth-service.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { createCoverSources, type FetchedImage } from "../src/covers/cover-sources.js";
import { type CoverFiller, createCoverFiller } from "../src/covers/fill-covers.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore, type LibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
import { SourceError } from "../src/missing/bibliography-sources.js";
import { createSyncService } from "../src/sync/sync-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

const ADMIN_PASSWORD = "correct horse battery";
const SCAN = Buffer.alloc(4000, 7);
const GOOGLE_THUMBNAIL = Buffer.alloc(3000, 9);
const OPEN_LIBRARY_SCAN_URL = "https://covers.openlibrary.org/b/id/42-L.jpg?default=false";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let database: LibraryDatabase;
let store: LibraryStore;
let currentTime: Date;
let requestedUrls: string[];
/** What each fake service answers; tests change them to simulate outages, wrong matches or missing images. */
let openLibraryDocs: unknown[];
let googleItems: unknown[];
let images: Record<string, FetchedImage>;
let sourcesDown: boolean;

async function fakeFetchJson(rawUrl: string): Promise<unknown> {
  requestedUrls.push(rawUrl);
  if (sourcesDown) {
    throw new SourceError("openlibrary.org a répondu 503");
  }
  return new URL(rawUrl).hostname === "openlibrary.org" ? { docs: openLibraryDocs } : { items: googleItems };
}

async function fakeFetchImage(url: string): Promise<FetchedImage | null> {
  requestedUrls.push(url);
  return images[url] ?? null;
}

function volume(title: string, authors: string[], thumbnail: string | null) {
  return { id: "abc", volumeInfo: { title, authors, infoLink: "https://books.google.com/books?id=abc", ...(thumbnail ? { imageLinks: { thumbnail } } : {}) } };
}

async function writeBook(file: string, title: string, authors: string[], options: { withCover?: boolean } = {}): Promise<void> {
  const filePath = path.join(booksDirectory, file);
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [`<dc:title>${title}</dc:title>`, ...authors.map((author) => `<dc:creator>${author}</dc:creator>`)].join("");
  const manifest = options.withCover ? `<item id="c" href="cover.png" media-type="image/png" properties="cover-image"/>` : "";
  await writeEpub(filePath, [
    { path: "OEBPS/content.opf", content: opfDocument(metadata, manifest) },
    ...(options.withCover ? [{ path: "OEBPS/cover.png", content: Buffer.from("own cover") }] : []),
  ]);
}

function filler(googleBooksApiKey: string | null = "test-key"): CoverFiller {
  const sources = createCoverSources({ fetchJson: fakeFetchJson, fetchImage: fakeFetchImage, googleBooksApiKey });
  return createCoverFiller({ store, sources, coversDirectory, now: () => currentTime });
}

const reindex = () => indexLibrary({ store, booksDirectory, coversDirectory });
const bookIdOf = (title: string) => (database.prepare("SELECT id FROM books WHERE title = ?").get(title) as { id: number }).id;
const coverOf = (title: string) => createCatalogQueries(database).getCoverFile(bookIdOf(title));
const missingCovers = () =>
  createLibraryHealthQueries(database)
    .getHealth()
    .incompleteBooks.filter((book) => book.missing.includes("cover"))
    .map((book) => book.title);

beforeEach(async () => {
  currentTime = new Date("2026-11-27T10:00:00Z");
  requestedUrls = [];
  sourcesDown = false;
  openLibraryDocs = [];
  googleItems = [];
  images = {};
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-covers-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  database = openLibraryDatabase(":memory:");
  store = createLibraryStore(database);
  await writeBook("dune.epub", "Dune", ["Frank Herbert"]);
  await writeBook("fondation.epub", "Fondation", ["Isaac Asimov"], { withCover: true });
  await reindex();
});

afterEach(async () => {
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

describe("matching", () => {
  it("takes the Open Library scan of the same book, and the library stops listing it as coverless", async () => {
    openLibraryDocs = [{ key: "/works/OL893415W", title: "Dune", author_name: ["Frank Herbert"], cover_i: 42 }];
    images[OPEN_LIBRARY_SCAN_URL] = { data: SCAN, mediaType: "image/jpeg" };

    const report = await filler().fillMissing();

    expect(report.found).toEqual([{ bookId: bookIdOf("Dune"), title: "Dune", provider: "openlibrary" }]);
    expect(report.remaining).toBe(0);
    const coverFile = coverOf("Dune");
    expect(coverFile).toMatch(/^fetched\/[0-9a-f]{64}\.jpg$/);
    expect(await readFile(path.join(coversDirectory, coverFile ?? ""))).toEqual(SCAN);
    expect(missingCovers()).toEqual([]);
  });

  it("only looks up the books whose file has no cover", async () => {
    await filler().fillMissing();

    expect(requestedUrls.filter((url) => url.includes("Fondation"))).toEqual([]);
  });

  it("ignores another book, another author, a placeholder and a file that is not an image", async () => {
    openLibraryDocs = [
      { key: "/works/1", title: "Les Enfants de Dune", author_name: ["Frank Herbert"], cover_i: 1 },
      { key: "/works/2", title: "Dune", author_name: ["Hal Clement"], cover_i: 2 },
      { key: "/works/3", title: "Dune", author_name: ["Frank Herbert"], cover_i: 3 },
      { key: "/works/4", title: "Dune", author_name: ["Frank Herbert"], cover_i: 4 },
    ];
    images["https://covers.openlibrary.org/b/id/1-L.jpg?default=false"] = { data: SCAN, mediaType: "image/jpeg" };
    images["https://covers.openlibrary.org/b/id/2-L.jpg?default=false"] = { data: SCAN, mediaType: "image/jpeg" };
    images["https://covers.openlibrary.org/b/id/3-L.jpg?default=false"] = { data: Buffer.alloc(200), mediaType: "image/jpeg" };
    images["https://covers.openlibrary.org/b/id/4-L.jpg?default=false"] = { data: SCAN, mediaType: "text/html" };

    const report = await filler().fillMissing();

    expect(report.notFound).toEqual([{ bookId: bookIdOf("Dune"), title: "Dune" }]);
    expect(coverOf("Dune")).toBeNull();
  });

  it("falls back on Google Books, over https and without the curled-page effect", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], "http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&edge=curl")];
    images["https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1"] = { data: GOOGLE_THUMBNAIL, mediaType: "image/png" };

    const report = await filler().fillMissing();

    expect(report.found).toEqual([{ bookId: bookIdOf("Dune"), title: "Dune", provider: "google-books" }]);
    expect(coverOf("Dune")).toMatch(/\.png$/);
  });

  it("does not ask Google Books without an API key", async () => {
    await filler(null).fillMissing();

    expect(requestedUrls.some((url) => url.includes("googleapis.com"))).toBe(false);
  });
});

describe("over time", () => {
  it("keeps a found cover when the file is re-read, and lets the file's own cover win once it has one", async () => {
    openLibraryDocs = [{ key: "/works/OL893415W", title: "Dune", author_name: ["Frank Herbert"], cover_i: 42 }];
    images[OPEN_LIBRARY_SCAN_URL] = { data: SCAN, mediaType: "image/jpeg" };
    await filler().fillMissing();
    const fetched = coverOf("Dune");

    // A new modification time makes the indexer re-read the file, which deletes and re-extracts its own cover.
    const later = new Date("2026-12-01T10:00:00Z");
    await utimes(path.join(booksDirectory, "dune.epub"), later, later);
    await reindex();
    expect(coverOf("Dune")).toBe(fetched);
    expect(existsSync(path.join(coversDirectory, fetched ?? ""))).toBe(true);

    await writeBook("dune.epub", "Dune", ["Frank Herbert"], { withCover: true });
    await reindex();
    expect(coverOf("Dune")).not.toBe(fetched);
    expect(coverOf("Dune")).toMatch(/^\d+\.png$/);
  });

  it("asks again for a book nobody had a cover for only after a month", async () => {
    await filler().fillMissing();
    requestedUrls = [];

    currentTime = new Date("2026-12-10T10:00:00Z");
    expect((await filler().fillMissing()).checked).toBe(0);

    currentTime = new Date("2026-12-28T10:00:00Z");
    expect((await filler().fillMissing()).checked).toBe(1);
  });

  it("postpones the book and stops when every source is down", async () => {
    sourcesDown = true;
    const covers = filler(null);

    const report = await covers.fillMissing();

    expect(report.checked).toBe(1);
    expect(report.postponed).toEqual([{ bookId: bookIdOf("Dune"), title: "Dune" }]);
    expect(report.sourceErrors).toEqual(["openlibrary.org a répondu 503"]);
    // Open Library is now resting, and without a key there is no other source: the next run stops at once.
    const next = await covers.fillMissing();
    expect(next.stoppedBecause).toMatch(/aucune source/);
  });
});

describe("over HTTP", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const auth = await createAuthService({ database });
    await auth.createUser("alice", ADMIN_PASSWORD, "admin");
    await auth.createUser("bob", "member password 123", "member");
    app = buildApp({
      catalog: createCatalogQueries(database),
      auth,
      covers: filler(),
      sync: createSyncService({ database, store, booksDirectory, coversDirectory, rcloneRemote: null, runCommand: async () => ({ exitCode: 0, stderrTail: "" }), logError: () => {} }),
      nextScheduledSyncAt: () => null,
      booksDirectory,
      coversDirectory,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(username: string, password: string): Promise<string> {
    const response = await app.inject({ method: "POST", url: "/api/auth/login", payload: { username, password } });
    return String(response.headers["set-cookie"]).split(";", 1)[0] ?? "";
  }

  it("lets an admin run a batch, then serves the cover found", async () => {
    openLibraryDocs = [{ key: "/works/OL893415W", title: "Dune", author_name: ["Frank Herbert"], cover_i: 42 }];
    images[OPEN_LIBRARY_SCAN_URL] = { data: SCAN, mediaType: "image/jpeg" };
    const cookie = await login("alice", ADMIN_PASSWORD);

    const response = await app.inject({ method: "POST", url: "/api/admin/covers/fill", headers: { cookie } });

    expect(response.json()).toMatchObject({ checked: 1, found: [{ title: "Dune", provider: "openlibrary" }], remaining: 0 });
    const book = await app.inject({ method: "GET", url: `/api/books/${bookIdOf("Dune")}`, headers: { cookie } });
    expect(book.json()).toMatchObject({ hasCover: true });
    const cover = await app.inject({ method: "GET", url: `/api/books/${bookIdOf("Dune")}/cover`, headers: { cookie } });
    expect(cover.statusCode).toBe(200);
    expect(cover.headers["content-type"]).toBe("image/jpeg");
    expect(cover.rawPayload).toEqual(SCAN);
  });

  it("is for admins only", async () => {
    const cookie = await login("bob", "member password 123");
    expect((await app.inject({ method: "POST", url: "/api/admin/covers/fill", headers: { cookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: "POST", url: "/api/admin/covers/fill" })).statusCode).toBe(401);
  });
});
