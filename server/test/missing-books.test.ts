import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { createAuthService } from "../src/auth/auth-service.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
import { createBibliographySources, SourceError } from "../src/missing/bibliography-sources.js";
import { createMissingBooks, type MissingBooksReport } from "../src/missing/missing-books.js";
import { libraryTitleKeys, titleKey } from "../src/missing/title-key.js";
import { createSyncService } from "../src/sync/sync-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

const ADMIN_PASSWORD = "correct horse battery";
const HOBB = "Q234403";

let workDirectory: string;
let booksDirectory: string;
let database: LibraryDatabase;
let app: FastifyInstance;
let admin: { cookie: string };
let requestedUrls: string[];
/** What the fake Wikidata and Open Library answer; tests change it to simulate an outage or new data. */
let sourcesDown: boolean;
let wikidataEntities: Record<string, unknown>;
let openLibraryDocs: unknown[];

type EntityOptions = { fr?: string; en?: string; original?: string; types?: string[]; series?: [string, string?]; year?: number; openLibrary?: string };

function entity({ fr, en, original, types = ["Q7725634"], series, year, openLibrary }: EntityOptions) {
  const item = (id: string) => ({ mainsnak: { datavalue: { value: { id } } } });
  return {
    labels: { ...(fr ? { fr: { value: fr } } : {}), ...(en ? { en: { value: en } } : {}) },
    claims: {
      P31: types.map(item),
      ...(original ? { P1476: [{ mainsnak: { datavalue: { value: { text: original, language: "en" } } } }] } : {}),
      ...(series ? { P179: [{ ...item(series[0]), qualifiers: series[1] ? { P1545: [{ datavalue: { value: series[1] } }] } : {} }] } : {}),
      ...(year ? { P577: [{ mainsnak: { datavalue: { value: { time: `+${year}-03-21T00:00:00Z` } } } }] } : {}),
      ...(openLibrary ? { P648: [{ mainsnak: { datavalue: { value: openLibrary } } }] } : {}),
    },
  };
}

async function fakeFetchJson(rawUrl: string): Promise<unknown> {
  requestedUrls.push(rawUrl);
  if (sourcesDown) {
    throw new SourceError("www.wikidata.org limite le débit pour l'instant");
  }
  const url = new URL(rawUrl);
  if (url.hostname === "openlibrary.org") {
    return { docs: openLibraryDocs };
  }
  switch (url.searchParams.get("action")) {
    case "wbsearchentities":
      return {
        search: [
          { id: HOBB, label: "Robin Hobb", description: "autrice américaine de fantasy" },
          { id: "Q6829085", label: "Robin Hobbs", description: "joueur de cricket britannique" },
        ],
      };
    case "query": {
      // Everything except the author herself and the series fetched on demand is "a work by the author".
      const works = Object.keys(wikidataEntities).filter((id) => id !== HOBB && id !== "Q900");
      const offset = Number(url.searchParams.get("sroffset"));
      return { query: { search: works.slice(offset, offset + 50).map((title) => ({ title })) } };
    }
    case "wbgetentities": {
      const ids = (url.searchParams.get("ids") ?? "").split("|");
      return { entities: Object.fromEntries(ids.filter((id) => id in wikidataEntities).map((id) => [id, wikidataEntities[id]])) };
    }
    default:
      throw new Error(`Unexpected request ${rawUrl}`);
  }
}

async function writeBook(file: string, title: string, authors: string[], extra = ""): Promise<void> {
  const filePath = path.join(booksDirectory, file);
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [`<dc:title>${title}</dc:title>`, ...authors.map((author) => `<dc:creator>${author}</dc:creator>`), extra].join("");
  await writeEpub(filePath, [{ path: "OEBPS/content.opf", content: opfDocument(metadata, "") }]);
}

const calibreSeries = (name: string, index: number) => `<meta name="calibre:series" content="${name}"/><meta name="calibre:series_index" content="${index}"/>`;

async function reindex(): Promise<void> {
  await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory: path.join(workDirectory, "covers") });
}

beforeEach(async () => {
  requestedUrls = [];
  sourcesDown = false;
  wikidataEntities = {
    [HOBB]: entity({ fr: "Robin Hobb", types: ["Q5"], openLibrary: "OL395837A" }),
    Q1: entity({ fr: "L'Apprenti assassin", en: "Assassin's Apprentice", original: "Assassin's Apprentice", series: ["Q100", "1"], year: 1995 }),
    Q2: entity({ fr: "L'Assassin du roi / La Nef du crépuscule", en: "Royal Assassin", series: ["Q100", "2"], year: 1996 }),
    Q3: entity({ en: "Wizard of the Pigeons", series: ["Q900"], year: 1986 }),
    Q4: entity({ fr: "Retour au pays", year: 2003 }),
    Q100: entity({ fr: "Cycle de l'Assassin royal", en: "The Farseer Trilogy", types: ["Q1667921"] }),
    Q5: entity({ fr: "L'Apprenti assassin", types: ["Q3331189"], year: 1998 }),
    Q900: entity({ en: "Standalone novels" }),
    Q7: entity({ fr: "Une nouvelle parue en revue", types: ["Q49084"], year: 1990 }),
  };
  openLibraryDocs = [
    { key: "/works/OL1W", title: "Assassin's Apprentice", first_publish_year: 1995, edition_count: 34 },
    { key: "/works/OL2W", title: "Ship of Magic (Liveship Traders, Book 1)", first_publish_year: 1998, edition_count: 15 },
    { key: "/works/OL3W", title: "Some obscure anthology", first_publish_year: 2010, edition_count: 2 },
  ];

  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-missing-"));
  booksDirectory = path.join(workDirectory, "books");
  await writeBook("apprenti.epub", "L'apprenti assassin", ["Robin Hobb"]);
  await writeBook("nef.epub", "L'Assassin royal, tome 3 : La Nef du crépuscule", ["HOBB Robin"]);
  await writeBook("autre.epub", "Retour au pays", ["Quelqu'un d'autre"]);
  database = openLibraryDatabase(":memory:");
  await reindex();

  const auth = await createAuthService({ database });
  await auth.createUser("alice", ADMIN_PASSWORD, "admin");
  await auth.createUser("bob", "member password 123", "member");
  const store = createLibraryStore(database);
  app = buildApp({
    catalog: createCatalogQueries(database),
    auth,
    missing: createMissingBooks({ database, sources: createBibliographySources({ fetchJson: fakeFetchJson }), now: () => new Date("2026-11-21T10:00:00Z") }),
    sync: createSyncService({
      database,
      store,
      booksDirectory,
      coversDirectory: path.join(workDirectory, "covers"),
      rcloneRemote: null,
      runCommand: async () => ({ exitCode: 0, stderrTail: "" }),
      logError: () => {},
    }),
    nextScheduledSyncAt: () => null,
    booksDirectory,
    coversDirectory: path.join(workDirectory, "covers"),
  });
  admin = await sessionOf("alice", ADMIN_PASSWORD);
});

afterEach(async () => {
  await app.close();
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

async function sessionOf(username: string, password: string): Promise<{ cookie: string }> {
  const response = await app.inject({ method: "POST", url: "/api/auth/login", payload: { username, password } });
  return { cookie: String(response.headers["set-cookie"]).split(";", 1)[0] ?? "" };
}

function followHobb() {
  return app.inject({
    method: "POST",
    url: "/api/admin/missing/authors",
    headers: admin,
    payload: { name: "Robin Hobb", wikidataId: HOBB, wikidataLabel: "Robin Hobb" },
  });
}

async function report(): Promise<MissingBooksReport> {
  return (await app.inject({ method: "GET", url: "/api/admin/missing", headers: admin })).json<MissingBooksReport>();
}

async function worksByTitle(): Promise<Record<string, MissingBooksReport["authors"][number]["works"][number]>> {
  return Object.fromEntries(((await report()).authors[0]?.works ?? []).map((work) => [work.title, work]));
}

describe("missing books of a followed author", () => {
  it("is closed to members", async () => {
    const bob = await sessionOf("bob", "member password 123");

    expect((await app.inject({ method: "GET", url: "/api/admin/missing", headers: bob })).statusCode).toBe(403);
  });

  it("offers the people Wikidata knows under a name", async () => {
    const response = await app.inject({ method: "GET", url: "/api/admin/missing/candidates?name=Robin%20Hobb", headers: admin });

    expect(response.json()).toEqual([
      { wikidataId: HOBB, label: "Robin Hobb", description: "autrice américaine de fantasy" },
      { wikidataId: "Q6829085", label: "Robin Hobbs", description: "joueur de cricket britannique" },
    ]);
  });

  it("lists the author's works with French titles and series, leaving out editions and series items", async () => {
    expect((await followHobb()).statusCode).toBe(201);

    const [author] = (await report()).authors;

    expect(author).toMatchObject({ name: "Robin Hobb", wikidataId: HOBB, fetchedAt: "2026-11-21T10:00:00.000Z", fetchError: null });
    expect(author?.works.map((work) => [work.title, work.series, work.seriesIndex, work.year, work.source])).toEqual([
      ["L'Apprenti assassin", "Cycle de l'Assassin royal", 1, 1995, "wikidata"],
      ["L'Assassin du roi / La Nef du crépuscule", "Cycle de l'Assassin royal", 2, 1996, "wikidata"],
      ["Wizard of the Pigeons", "Standalone novels", null, 1986, "wikidata"],
      ["Ship of Magic", null, null, 1998, "openlibrary"],
      ["Retour au pays", null, null, 2003, "wikidata"],
    ]);
  });

  it("recognises the books already in the library, whatever the spelling of title and author", async () => {
    await followHobb();

    const works = await worksByTitle();

    // Same title in another case.
    expect(works["L'Apprenti assassin"]).toMatchObject({ state: "owned", ownedBookId: expect.any(Number) });
    // One French volume of a split edition, filed as "série, tome N : titre" under "HOBB Robin".
    expect(works["L'Assassin du roi / La Nef du crépuscule"]?.state).toBe("owned");
    // "Retour au pays" is in the library, but by someone else.
    expect(works["Retour au pays"]?.state).toBe("missing");
    expect(works["Wizard of the Pigeons"]?.state).toBe("missing");
  });

  it("adds only the Open Library works Wikidata does not have, and none of the rarely published ones", async () => {
    await followHobb();

    const fromOpenLibrary = Object.values(await worksByTitle()).filter((work) => work.source === "openlibrary");

    expect(fromOpenLibrary.map((work) => work.title)).toEqual(["Ship of Magic"]);
    expect(requestedUrls.some((url) => url.includes("author_key=OL395837A"))).toBe(true);
  });

  it("lets the admin declare a work owned or not wanted, and take that back", async () => {
    await followHobb();
    const decide = async (title: string, decision: string | null) => {
      const work = (await worksByTitle())[title];
      return app.inject({ method: "PUT", url: `/api/admin/missing/works/${work?.id}`, headers: admin, payload: { decision } });
    };

    expect((await decide("Wizard of the Pigeons", "ignored")).statusCode).toBe(204);
    await decide("Retour au pays", "owned");
    expect((await worksByTitle())["Wizard of the Pigeons"]).toMatchObject({ state: "ignored", decision: "ignored" });
    expect((await worksByTitle())["Retour au pays"]).toMatchObject({ state: "owned", decision: "owned", ownedBookId: null });

    await decide("Wizard of the Pigeons", null);
    expect((await worksByTitle())["Wizard of the Pigeons"]).toMatchObject({ state: "missing", decision: null });
  });

  it("marks a work owned as soon as the book enters the library", async () => {
    await followHobb();
    expect((await worksByTitle())["Retour au pays"]?.state).toBe("missing");

    await writeBook("retour.epub", "Retour au pays", ["Hobb, Robin"]);
    await reindex();

    expect((await worksByTitle())["Retour au pays"]?.state).toBe("owned");
  });

  it("keeps decisions through a refresh, picks up new works and drops vanished ones", async () => {
    await followHobb();
    const before = await worksByTitle();
    await app.inject({ method: "PUT", url: `/api/admin/missing/works/${before["Wizard of the Pigeons"]?.id}`, headers: admin, payload: { decision: "ignored" } });
    delete wikidataEntities.Q4;
    wikidataEntities.Q6 = entity({ fr: "Le Fou et l'Assassin", year: 2014 });
    const authorId = (await report()).authors[0]?.id;

    const refreshed = await app.inject({ method: "POST", url: `/api/admin/missing/authors/${authorId}/refresh`, headers: admin });

    expect(refreshed.statusCode).toBe(200);
    const after = await worksByTitle();
    expect(after["Wizard of the Pigeons"]?.state).toBe("ignored");
    expect(after["Le Fou et l'Assassin"]?.state).toBe("missing");
    expect(after["Retour au pays"]).toBeUndefined();
  });

  it("keeps the last known works and reports the error when the sources are down", async () => {
    await followHobb();
    const authorId = (await report()).authors[0]?.id;
    sourcesDown = true;

    const refreshed = await app.inject({ method: "POST", url: `/api/admin/missing/authors/${authorId}/refresh`, headers: admin });

    expect(refreshed.statusCode).toBe(502);
    expect(refreshed.json()).toMatchObject({ error: "source_unavailable" });
    const [author] = (await report()).authors;
    expect(author?.fetchError).toContain("limite le débit");
    expect(author?.works).toHaveLength(5);
  });

  it("still follows the author when the first fetch fails, so it can be retried", async () => {
    sourcesDown = true;

    expect((await followHobb()).statusCode).toBe(201);

    expect((await report()).authors).toMatchObject([{ name: "Robin Hobb", fetchedAt: null, works: [] }]);
  });

  it("refuses to follow the same author twice and forgets an unfollowed one", async () => {
    await followHobb();
    expect((await followHobb()).statusCode).toBe(409);
    const authorId = (await report()).authors[0]?.id;

    expect((await app.inject({ method: "DELETE", url: `/api/admin/missing/authors/${authorId}`, headers: admin })).statusCode).toBe(204);

    expect((await report()).authors).toEqual([]);
    expect(database.prepare<[], { count: number }>("SELECT count(*) AS count FROM author_works").get()?.count).toBe(0);
  });
});

describe("gaps in the numbering of a series", () => {
  it("lists the volumes missing between the first and the last owned", async () => {
    await writeBook("f1.epub", "Fondation", ["Isaac Asimov"], calibreSeries("Fondation", 1));
    await writeBook("f2.epub", "Fondation et Empire", ["Isaac Asimov"], calibreSeries("fondation", 2));
    await writeBook("f5.epub", "Terre et Fondation", ["Isaac Asimov"], calibreSeries("Fondation", 5));
    await writeBook("d1.epub", "Dune", ["Frank Herbert"], calibreSeries("Dune", 1));
    await writeBook("d2.epub", "Le Messie de Dune", ["Frank Herbert"], calibreSeries("Dune", 2));
    await writeBook("folio.epub", "Un poche", ["Quelqu'un"], calibreSeries("Folio", 7767));
    await reindex();

    expect((await report()).seriesGaps).toEqual([{ series: "Fondation", authors: ["Isaac Asimov"], owned: [1, 2, 5], missing: [3, 4] }]);
  });
});

describe("titleKey", () => {
  it.each([
    ["L'Assassin du roi", "assassin du roi"],
    ["  LES Misérables !", "miserables"],
    ["Fondation (édition intégrale)", "fondation"],
    ["The Mad Ship", "mad ship"],
    ["Œuvres", "oeuvres"],
  ])("%s -> %s", (title, key) => {
    expect(titleKey(title)).toBe(key);
  });

  it("does not take the first words of a longer title for the book itself", () => {
    // Owning "Dune : Le Messie de Dune" must not make "Dune" look owned.
    expect(libraryTitleKeys("Dune : Le Messie de Dune")).toEqual(["dune le messie de dune"]);
  });

  it.each([
    ["L'Assassin royal, tome 3 : La Nef du crépuscule", "nef du crepuscule"],
    ["L'Assassin Royal-10-Serments et Deuils", "serments et deuils"],
    ["L'Assassin Royal 5-La voie magique", "voie magique"],
    ["L'assassin royal [001] – L'apprenti assassin", "apprenti assassin"],
    ["Dune, 03. Les enfants de Dune", "enfants de dune"],
    ["Après Dune - 01 - Les chasseurs de Dune", "chasseurs de dune"],
  ])("recognises the own title of the numbered volume %s", (title, ownTitle) => {
    expect(libraryTitleKeys(title)).toContain(ownTitle);
  });
});
