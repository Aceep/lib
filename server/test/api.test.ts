import { mkdir, mkdtemp, rm, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
import { createSyncService } from "../src/sync/sync-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let database: LibraryDatabase;
let app: FastifyInstance;

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type BookFixture = { file: string; title: string; authors: string[]; language?: string; description?: string; subjects?: string[]; withCover?: boolean };

const LIBRARY: BookFixture[] = [
  { file: "dune.epub", title: "Dune", authors: ["Frank Herbert"], language: "en", description: "Desert planet Arrakis.", subjects: ["FICTION / Science Fiction / General", "Classics"] },
  { file: "Herbert/Dune Messiah.epub", title: "Dune Messiah", authors: ["Frank Herbert"], language: "en", subjects: ["SF"] },
  { file: "evenement.epub", title: "L'Événement", authors: ["Annie Ernaux"], language: "fr", withCover: true },
  { file: "omens.epub", title: "Good Omens", authors: ["Terry Pratchett", "Neil Gaiman"], language: "en-GB" },
  { file: "Été indien.epub", title: "Les Années", authors: ["Annie Ernaux"], language: "fr", description: "Une autobiographie impersonnelle de Dune à nos jours." },
];

async function writeBook(book: BookFixture, modifiedAt: Date) {
  const filePath = path.join(booksDirectory, book.file);
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [
    `<dc:title>${book.title}</dc:title>`,
    ...book.authors.map((author) => `<dc:creator>${author}</dc:creator>`),
    book.language ? `<dc:language>${book.language}</dc:language>` : "",
    book.description ? `<dc:description>${book.description}</dc:description>` : "",
    ...(book.subjects ?? []).map((subject) => `<dc:subject>${subject}</dc:subject>`),
  ].join("");
  const manifest = book.withCover ? `<item id="c" href="cover.png" media-type="image/png" properties="cover-image"/>` : "";
  await writeEpub(filePath, [
    { path: "OEBPS/content.opf", content: opfDocument(metadata, manifest) },
    ...(book.withCover ? [{ path: "OEBPS/cover.png", content: PNG_BYTES }] : []),
  ]);
  await utimes(filePath, modifiedAt, modifiedAt);
}

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-api-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  await mkdir(booksDirectory);
  for (const [index, book] of LIBRARY.entries()) {
    await writeBook(book, new Date(Date.UTC(2026, 0, index + 1)));
  }
  database = openLibraryDatabase(":memory:");
  await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
  const sync = createSyncService({
    database,
    store: createLibraryStore(database),
    booksDirectory,
    coversDirectory,
    rcloneRemote: null,
    runCommand: async () => ({ exitCode: 0, stderrTail: "" }),
    logError: () => {},
  });
  app = buildApp({ catalog: createCatalogQueries(database), sync, nextScheduledSyncAt: () => null, booksDirectory, coversDirectory });
});

afterEach(async () => {
  await app.close();
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

function bookIdByTitle(title: string): number {
  const row = database.prepare<[string], { id: number }>("SELECT id FROM books WHERE title = ?").get(title);
  if (!row) {
    throw new Error(`No book titled ${title}`);
  }
  return row.id;
}

async function listTitles(querystring: string): Promise<string[]> {
  const response = await app.inject({ method: "GET", url: `/api/books?${querystring}` });
  expect(response.statusCode).toBe(200);
  return response.json<{ items: { title: string }[] }>().items.map((item) => item.title);
}

describe("GET /api/books", () => {
  it("lists every book sorted by title by default", async () => {
    expect(await listTitles("")).toEqual(["Dune", "Dune Messiah", "Good Omens", "L'Événement", "Les Années"]);
  });

  it("sorts accented titles alongside unaccented ones", async () => {
    await writeBook({ file: "ete.epub", title: "Été", authors: ["Émile Zola"] }, new Date(Date.UTC(2026, 5, 1)));
    await writeBook({ file: "zazie.epub", title: "Zazie", authors: [] }, new Date(Date.UTC(2026, 5, 2)));
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    const titles = await listTitles("pageSize=100");

    expect(titles.indexOf("Été")).toBe(titles.indexOf("Dune Messiah") + 1);
    expect(titles.at(-1)).toBe("Zazie");
  });

  it("sorts authors by family name, accented ones alongside unaccented ones", async () => {
    await writeBook({ file: "ete.epub", title: "Été", authors: ["Jean Échenoz"] }, new Date(Date.UTC(2026, 5, 1)));
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    const response = await app.inject({ method: "GET", url: "/api/facets" });

    expect(response.json<{ authors: { name: string }[] }>().authors.map((author) => author.name)).toEqual([
      "Jean Échenoz",
      "Annie Ernaux",
      "Neil Gaiman",
      "Frank Herbert",
      "Terry Pratchett",
    ]);
  });

  it("returns authors in order and tells whether a cover exists", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books?q=omens" });

    expect(response.json().items).toEqual([
      {
        id: bookIdByTitle("Good Omens"),
        title: "Good Omens",
        authors: ["Terry Pratchett", "Neil Gaiman"],
        language: "en",
        series: null,
        seriesIndex: null,
        hasCover: false,
        addedAt: expect.any(String),
      },
    ]);
  });

  it("filters on a genre derived from the subjects", async () => {
    expect(await listTitles("genre=Science-fiction&sort=title")).toEqual(["Dune", "Dune Messiah"]);
    expect(await listTitles("genre=Classiques")).toEqual(["Dune"]);
    expect(await listTitles("genre=Romance")).toEqual([]);
  });

  it("lists the genres of a book and counts them in the facets", async () => {
    const book = await app.inject({ method: "GET", url: `/api/books/${bookIdByTitle("Dune")}` });
    expect(book.json<{ genres: string[] }>().genres).toEqual(["Classiques", "Science-fiction"]);

    const facets = await app.inject({ method: "GET", url: "/api/facets" });
    expect(facets.json<{ genres: unknown }>().genres).toEqual([
      { name: "Science-fiction", bookCount: 2 },
      { name: "Classiques", bookCount: 1 },
    ]);
  });

  it("matches word prefixes while ignoring accents and case", async () => {
    expect(await listTitles("q=EVEN")).toEqual(["L'Événement"]);
  });

  it("requires every word of the query to match", async () => {
    expect(await listTitles("q=dune messiah")).toEqual(["Dune Messiah"]);
  });

  it("ranks title matches above description matches", async () => {
    const titles = await listTitles("q=dune");

    expect(titles.at(-1)).toBe("Les Années");
    expect(titles).toHaveLength(3);
  });

  it("treats FTS operators in the query as plain text", async () => {
    expect(await listTitles(`q=${encodeURIComponent('dune" OR * NEAR(')}`)).toEqual([]);
  });

  it("ignores a query without any searchable word", async () => {
    expect(await listTitles("q=%22%2A%28")).toHaveLength(LIBRARY.length);
  });

  it("filters by author, case-insensitively", async () => {
    expect(await listTitles("author=annie%20ernaux")).toEqual(["L'Événement", "Les Années"]);
  });

  it("filters by language", async () => {
    expect(await listTitles("language=fr")).toEqual(["L'Événement", "Les Années"]);
  });

  it("combines search and filters", async () => {
    expect(await listTitles("q=dune&language=fr")).toEqual(["Les Années"]);
  });

  it("sorts by most recently added", async () => {
    const setAddedAt = database.prepare("UPDATE books SET added_at = ? WHERE title = ?");
    setAddedAt.run("2099-05-01T00:00:00.000Z", "Good Omens");
    setAddedAt.run("2099-04-01T00:00:00.000Z", "Dune");

    const titles = await listTitles("sort=recent");

    expect(titles.slice(0, 2)).toEqual(["Good Omens", "Dune"]);
  });

  it("paginates and reports the total", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books?pageSize=2&page=2" });

    expect(response.json()).toMatchObject({ total: 5, page: 2, pageSize: 2 });
    expect(response.json<{ items: { title: string }[] }>().items.map((item) => item.title)).toEqual(["Good Omens", "L'Événement"]);
  });

  it("rejects an out-of-range page size", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books?pageSize=500" });

    expect(response.statusCode).toBe(400);
  });

  it("rejects an unknown sort order", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books?sort=random" });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /api/facets", () => {
  it("counts books per author and per language, authors by family name", async () => {
    const response = await app.inject({ method: "GET", url: "/api/facets" });

    expect(response.json()).toEqual({
      authors: [
        { name: "Annie Ernaux", bookCount: 2, sortName: "ernaux annie", listName: "Ernaux, Annie" },
        { name: "Neil Gaiman", bookCount: 1, sortName: "gaiman neil", listName: "Gaiman, Neil" },
        { name: "Frank Herbert", bookCount: 2, sortName: "herbert frank", listName: "Herbert, Frank" },
        { name: "Terry Pratchett", bookCount: 1, sortName: "pratchett terry", listName: "Pratchett, Terry" },
      ],
      languages: [
        { code: "en", bookCount: 3 },
        { code: "fr", bookCount: 2 },
      ],
      genres: [
        { name: "Science-fiction", bookCount: 2 },
        { name: "Classiques", bookCount: 1 },
      ],
    });
  });
});

describe("GET /api/books/:id", () => {
  it("returns the book details", async () => {
    const response = await app.inject({ method: "GET", url: `/api/books/${bookIdByTitle("Dune")}` });

    expect(response.json()).toMatchObject({
      title: "Dune",
      authors: ["Frank Herbert"],
      description: "Desert planet Arrakis.",
      fileSize: expect.any(Number),
      addedAt: expect.any(String),
    });
  });

  it("answers 404 for an unknown book", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books/9999" });

    expect(response.statusCode).toBe(404);
  });

  it("answers 400 for a non-numeric id", async () => {
    const response = await app.inject({ method: "GET", url: "/api/books/abc" });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /api/books/:id/cover", () => {
  it("serves the cover image", async () => {
    const response = await app.inject({ method: "GET", url: `/api/books/${bookIdByTitle("L'Événement")}/cover` });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.rawPayload.equals(PNG_BYTES)).toBe(true);
  });

  it("answers 404 when the book has no cover", async () => {
    const response = await app.inject({ method: "GET", url: `/api/books/${bookIdByTitle("Dune")}/cover` });

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /api/books/:id/file", () => {
  it("serves the EPUB as an attachment with a UTF-8 file name", async () => {
    const response = await app.inject({ method: "GET", url: `/api/books/${bookIdByTitle("Les Années")}/file` });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/epub+zip");
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="_t_ indien.epub"; filename*=UTF-8''%C3%89t%C3%A9%20indien.epub`,
    );
    expect(response.rawPayload.subarray(0, 2).toString()).toBe("PK");
  });

  it("answers 404 when the file was deleted since the last index", async () => {
    await rm(path.join(booksDirectory, "dune.epub"));

    const response = await app.inject({ method: "GET", url: `/api/books/${bookIdByTitle("Dune")}/file` });

    expect(response.statusCode).toBe(404);
  });

  it("refuses a stored path that escapes the books directory", async () => {
    const bookId = bookIdByTitle("Dune");
    database.prepare("UPDATE books SET file_path = ? WHERE id = ?").run("../../etc/passwd", bookId);

    const response = await app.inject({ method: "GET", url: `/api/books/${bookId}/file` });

    expect(response.statusCode).toBe(404);
  });
});
