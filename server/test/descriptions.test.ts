import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { createAuthService } from "../src/auth/auth-service.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore, type LibraryStore } from "../src/db/library-store.js";
import { createDescriptionSources, surnames, toPlainText } from "../src/descriptions/description-sources.js";
import { createDescriptionFiller, type DescriptionFiller } from "../src/descriptions/fill-descriptions.js";
import { indexLibrary } from "../src/library/index-library.js";
import { SourceError } from "../src/missing/bibliography-sources.js";
import { createSyncService } from "../src/sync/sync-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

const ADMIN_PASSWORD = "correct horse battery";
const BLURB = "Sur la planète désertique Arrakis, le jeune Paul Atréides hérite d'un fief et d'une guerre pour l'épice, la substance la plus précieuse de l'univers.";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let database: LibraryDatabase;
let store: LibraryStore;
let requestedUrls: string[];
let currentTime: Date;
/** What each fake service answers; tests change them to simulate outages, wrong matches or missing texts. */
let googleItems: unknown[];
let openLibraryDocs: unknown[];
let openLibraryWorks: Record<string, unknown>;
let wikipediaHits: string[];
let wikipediaSummaries: Record<string, unknown>;
let sourcesDown: boolean;

async function fakeFetchJson(rawUrl: string): Promise<unknown> {
  requestedUrls.push(rawUrl);
  if (sourcesDown) {
    throw new SourceError("www.googleapis.com limite le débit pour l'instant");
  }
  const url = new URL(rawUrl);
  if (url.hostname === "www.googleapis.com") {
    return { items: googleItems };
  }
  if (url.hostname === "openlibrary.org") {
    return url.pathname === "/search.json" ? { docs: openLibraryDocs } : openLibraryWorks[url.pathname.replace(/\.json$/, "")];
  }
  if (url.pathname.startsWith("/api/rest_v1/page/summary/")) {
    return wikipediaSummaries[decodeURIComponent(url.pathname.split("/").pop() ?? "").replace(/_/g, " ")];
  }
  return { query: { search: wikipediaHits.map((title) => ({ title })) } };
}

function volume(title: string, authors: string[], description: string | null) {
  return { id: "abc", volumeInfo: { title, authors, description, infoLink: "https://books.google.com/books?id=abc" } };
}

async function writeBook(file: string, title: string, authors: string[], extra = ""): Promise<void> {
  const filePath = path.join(booksDirectory, file);
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [`<dc:title>${title}</dc:title>`, ...authors.map((author) => `<dc:creator>${author}</dc:creator>`), extra].join("");
  await writeEpub(filePath, [{ path: "OEBPS/content.opf", content: opfDocument(metadata, "") }]);
}

function filler(): DescriptionFiller {
  return createDescriptionFiller({ store, sources: createDescriptionSources({ fetchJson: fakeFetchJson, googleBooksApiKey: "test-key" }), now: () => currentTime });
}

const reindex = () => indexLibrary({ store, booksDirectory, coversDirectory });
const bookIdOf = (title: string) => (database.prepare("SELECT id FROM books WHERE title = ?").get(title) as { id: number }).id;
const descriptionOf = (title: string) => (database.prepare("SELECT description FROM books WHERE title = ?").get(title) as { description: string | null }).description;

beforeEach(async () => {
  currentTime = new Date("2026-11-22T10:00:00Z");
  requestedUrls = [];
  sourcesDown = false;
  googleItems = [];
  openLibraryDocs = [];
  openLibraryWorks = {};
  wikipediaHits = [];
  wikipediaSummaries = {};
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-descriptions-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  database = openLibraryDatabase(":memory:");
  store = createLibraryStore(database);
  await writeBook("dune.epub", "Dune", ["Frank Herbert"], "<dc:language>fr</dc:language>");
  await writeBook("fondation.epub", "Fondation", ["Isaac Asimov"], "<dc:description>Un empire galactique s'effondre.</dc:description>");
  await reindex();
});

afterEach(async () => {
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

describe("matching", () => {
  it("takes the blurb of the volume with the same title and author", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], `<p>${BLURB}</p>`)];
    const report = await filler().fillMissing();

    expect(report.found).toEqual([{ bookId: bookIdOf("Dune"), title: "Dune", provider: "google-books" }]);
    expect(descriptionOf("Dune")).toBe(BLURB);
    expect(descriptionOf("Fondation")).toBe("Un empire galactique s'effondre.");
    expect(report.remaining).toBe(0);
  });

  it("ignores volumes by someone else, with another title, or too short to be a summary", async () => {
    googleItems = [
      volume("Dune", ["Brian Herbert", "Kevin J. Anderson"], null),
      volume("Dune", ["Hal Clement"], BLURB),
      volume("Les Enfants de Dune", ["Frank Herbert"], BLURB),
      volume("Dune", ["Frank Herbert"], "Le chef-d'œuvre de la SF."),
    ];
    const report = await filler().fillMissing();

    expect(report.found).toEqual([]);
    expect(report.notFound).toEqual([{ bookId: bookIdOf("Dune"), title: "Dune" }]);
    expect(descriptionOf("Dune")).toBeNull();
  });

  it("accepts a subtitle after the title and the author's name in another form", async () => {
    googleItems = [volume("Dune : Le Cycle de Dune, tome 1", ["HERBERT, Frank"], BLURB)];
    const report = await filler().fillMissing();
    expect(report.found).toHaveLength(1);
  });

  it("falls back on Open Library, without the editors' notes, then on Wikipedia", async () => {
    openLibraryDocs = [{ key: "/works/OL893415W", title: "Dune", author_name: ["Frank Herbert"] }];
    openLibraryWorks["/works/OL893415W"] = { description: { value: `${BLURB}\n----------\nAlso contained in: Dune omnibus ([source][1])\n[1]: https://example.org` } };
    const first = await filler().fillMissing();
    expect(first.found[0]?.provider).toBe("openlibrary");
    expect(descriptionOf("Dune")).toBe(BLURB);
    expect((store.listUndescribedBooks(new Date(0), 10)).length).toBe(0);

    await writeBook("dune.epub", "Dune", ["Frank Herbert"], "<dc:language>fr</dc:language><dc:identifier>v2</dc:identifier>");
    await reindex();
    openLibraryDocs = [];
    wikipediaHits = ["Dune (roman)", "Dune (film, 2021)"];
    wikipediaSummaries["Dune (roman)"] = { type: "standard", extract: `<b>Dune</b> est un roman de science-fiction de Frank Herbert publié en 1965. ${BLURB}`, content_urls: { desktop: { page: "https://fr.wikipedia.org/wiki/Dune_(roman)" } } };
    const second = await filler().fillMissing();
    expect(second.found[0]?.provider).toBe("wikipedia");
    expect(descriptionOf("Dune")).toContain("est un roman de science-fiction de Frank Herbert");
    expect(requestedUrls.filter((url) => url.includes("fr.wikipedia.org"))).toHaveLength(2);
  });

  it("rejects a Wikipedia article about the film, and an Open Library note that only links to the text", async () => {
    wikipediaHits = ["Dune (film, 2021)"];
    wikipediaSummaries["Dune (film, 2021)"] = { type: "standard", description: "film de Denis Villeneuve", extract: `Dune est un film de science-fiction américain réalisé par Denis Villeneuve, adapté du roman de Frank Herbert. ${BLURB}` };
    openLibraryDocs = [{ key: "/works/OL1W", title: "Dune", author_name: ["Frank Herbert"] }];
    openLibraryWorks["/works/OL1W"] = { description: "Full text available online at [Dune](https://example.org/dune), the first novel of the cycle." };
    expect((await filler().fillMissing()).found).toEqual([]);
  });

  it("prefers a French summary for a French book, and takes the English one only when nothing else turns up", async () => {
    const english = "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir of a noble family tasked with ruling an inhospitable world where the only thing of value is the spice.";
    openLibraryDocs = [{ key: "/works/OL1W", title: "Dune", author_name: ["Frank Herbert"] }];
    openLibraryWorks["/works/OL1W"] = { description: english };
    wikipediaHits = ["Dune (roman)"];
    wikipediaSummaries["Dune (roman)"] = { type: "standard", description: "roman de Frank Herbert", extract: `Dune est un roman de Frank Herbert. ${BLURB}` };
    await filler().fillMissing();
    expect(descriptionOf("Dune")).toContain("est un roman de Frank Herbert");

    await writeBook("dune.epub", "Dune", ["Frank Herbert"], "<dc:language>fr</dc:language><dc:identifier>v2</dc:identifier>");
    await reindex();
    wikipediaHits = [];
    await filler().fillMissing();
    expect(descriptionOf("Dune")).toBe(english);
  });

  it("rejects a Wikipedia article that is a disambiguation page or never names the author", async () => {
    wikipediaHits = ["Dune"];
    wikipediaSummaries.Dune = { type: "disambiguation", extract: "Dune peut désigner : une dune de sable, un roman de Frank Herbert, un film de David Lynch..." };
    expect((await filler().fillMissing()).found).toEqual([]);

    currentTime = new Date("2027-01-01T10:00:00Z");
    wikipediaSummaries.Dune = { type: "standard", extract: "Une dune est un relief composé de sable, façonné par le vent, que l'on rencontre dans les déserts et sur les littoraux du monde entier." };
    expect((await filler().fillMissing()).found).toEqual([]);
  });

  it("looks the English Wikipedia up for a book in English", async () => {
    await writeBook("en/foundation.epub", "Foundation", ["Isaac Asimov"], "<dc:language>en</dc:language>");
    await reindex();
    await filler().fillMissing();
    expect(requestedUrls.some((url) => url.startsWith("https://en.wikipedia.org/") && url.includes("Foundation"))).toBe(true);
    expect(requestedUrls.some((url) => url.startsWith("https://fr.wikipedia.org/") && url.includes("Dune"))).toBe(true);
  });
});

describe("bookkeeping", () => {
  it("survives a reindex and gives way to a summary the file gains later", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], BLURB)];
    await filler().fillMissing();

    await writeBook("dune.epub", "Dune", ["Frank Herbert"], "<dc:language>fr</dc:language><dc:identifier>touched</dc:identifier>");
    await reindex();
    // Another file: the summary was keyed by the old hash, the new one is looked up again.
    expect(descriptionOf("Dune")).toBeNull();
    await filler().fillMissing();
    expect(descriptionOf("Dune")).toBe(BLURB);
    expect(createCatalogQueries(database).getBook(bookIdOf("Dune"))?.descriptionSource).toBe("https://books.google.com/books?id=abc");

    database.exec("DELETE FROM books");
    await reindex();
    expect(descriptionOf("Dune")).toBe(BLURB);

    await writeBook("dune.epub", "Dune", ["Frank Herbert"], "<dc:language>fr</dc:language><dc:description>Le texte de l'éditeur.</dc:description>");
    await reindex();
    expect(descriptionOf("Dune")).toBe("Le texte de l'éditeur.");
    expect(createCatalogQueries(database).getBook(bookIdOf("Dune"))?.descriptionSource).toBeNull();
  });

  it("finds a summary through the search index", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], BLURB)];
    await filler().fillMissing();
    const catalog = createCatalogQueries(database);
    expect(catalog.listBooks({ query: "Arrakis", author: "", language: "", series: "", genre: "", sort: "relevance", page: 1, pageSize: 10 }).items.map((book) => book.title)).toEqual(["Dune"]);
  });

  it("does not look a book up again for a month when nothing was found", async () => {
    await filler().fillMissing();
    const firstRun = requestedUrls.length;
    expect(firstRun).toBeGreaterThan(0);

    currentTime = new Date("2026-12-01T10:00:00Z");
    expect((await filler().fillMissing()).checked).toBe(0);
    expect(requestedUrls).toHaveLength(firstRun);

    currentTime = new Date("2027-01-01T10:00:00Z");
    expect((await filler().fillMissing()).checked).toBe(1);
  });

  it("rests a failing source and goes on with the others", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], BLURB)];
    const sources = createDescriptionSources({
      fetchJson: async (url) => {
        if (new URL(url).hostname === "openlibrary.org") {
          throw new SourceError("openlibrary.org a répondu 503");
        }
        return fakeFetchJson(url);
      },
      googleBooksApiKey: "test-key",
    });
    const report = await createDescriptionFiller({ store, sources, now: () => currentTime }).fillMissing();
    expect(report.found.map((book) => book.title)).toEqual(["Dune"]);
  });

  it("asks a book again next time when a source was down, and stops once none answers", async () => {
    await writeBook("hobb.epub", "L'Apprenti assassin", ["Robin Hobb"]);
    await reindex();
    sourcesDown = true;
    const report = await filler().fillMissing();

    // First book: every source fails and is rested; second book: nothing left to ask.
    expect(report.checked).toBe(1);
    expect(report.postponed.map((book) => book.title)).toEqual(["L'Apprenti assassin"]);
    expect(report.stoppedBecause).toContain("aucune source");
    expect(report.remaining).toBe(2);
    expect(requestedUrls).toHaveLength(3);
    expect(store.listUndescribedBooks(new Date(0), 10)).toHaveLength(2);

    sourcesDown = false;
    currentTime = new Date("2026-11-22T10:20:00Z");
    expect((await filler().fillMissing()).notFound).toHaveLength(2);
  });

  it("leaves Google Books alone without an API key", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], BLURB)];
    const report = await createDescriptionFiller({ store, sources: createDescriptionSources({ fetchJson: fakeFetchJson }), now: () => currentTime }).fillMissing();
    expect(report.found).toEqual([]);
    expect(requestedUrls.some((url) => url.includes("googleapis"))).toBe(false);
  });

  it("honours the batch limit, newest books first", async () => {
    currentTime = new Date("2026-11-23T10:00:00Z");
    await writeBook("hobb.epub", "L'Apprenti assassin", ["Robin Hobb"]);
    await reindex();
    const report = await filler().fillMissing({ limit: 1 });
    expect(report.notFound.map((book) => book.title)).toEqual(["L'Apprenti assassin"]);
    expect(report.remaining).toBe(2);
  });
});

describe("helpers", () => {
  it("keeps the family name whatever the form of the author", () => {
    expect(surnames(["Frank Herbert", "HERBERT, Frank", "J. K. Rowling", "Guy de Maupassant"])).toEqual(["herbert", "rowling", "maupassant"]);
  });

  it("flattens HTML to text", () => {
    expect(toPlainText("<p>Un &amp; deux<br/>trois</p><p>quatre&nbsp;!</p>")).toBe("Un & deux\ntrois\nquatre !");
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
      descriptions: filler(),
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

  it("lets an admin run a batch and reports what it did", async () => {
    googleItems = [volume("Dune", ["Frank Herbert"], BLURB)];
    const cookie = await login("alice", ADMIN_PASSWORD);
    const response = await app.inject({ method: "POST", url: "/api/admin/descriptions/fill", headers: { cookie } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ checked: 1, found: [{ title: "Dune", provider: "google-books" }], notFound: [], remaining: 0, stoppedBecause: null });
    const book = await app.inject({ method: "GET", url: `/api/books/${bookIdOf("Dune")}`, headers: { cookie } });
    expect(book.json()).toMatchObject({ description: BLURB, descriptionSource: "https://books.google.com/books?id=abc" });
  });

  it("is for admins only", async () => {
    const cookie = await login("bob", "member password 123");
    expect((await app.inject({ method: "POST", url: "/api/admin/descriptions/fill", headers: { cookie } })).statusCode).toBe(403);
    expect((await app.inject({ method: "POST", url: "/api/admin/descriptions/fill" })).statusCode).toBe(401);
  });
});

describe("after a sync", () => {
  it("looks up the summaries of what was just indexed", async () => {
    await writeBook("hobb.epub", "L'Apprenti assassin", ["Robin Hobb"]);
    googleItems = [volume("L'Apprenti assassin", ["Robin Hobb"], BLURB), volume("Dune", ["Frank Herbert"], BLURB)];
    const descriptions = filler();
    const sync = createSyncService({
      database,
      store,
      booksDirectory,
      coversDirectory,
      rcloneRemote: null,
      runCommand: async () => ({ exitCode: 0, stderrTail: "" }),
      logError: () => {},
      afterIndex: async () => {
        await descriptions.fillMissing();
      },
    });
    sync.start("manual");
    await sync.whenIdle();

    expect(descriptionOf("L'Apprenti assassin")).toBe(BLURB);
    expect(descriptionOf("Dune")).toBe(BLURB);
    expect(sync.getStatus().lastFinished?.status).toBe("succeeded");
  });
});
