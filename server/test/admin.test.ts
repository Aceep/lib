import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type ActivityEntry, createActivityLog } from "../src/activity/activity-log.js";
import { createBookAdmin } from "../src/admin/book-admin.js";
import { createLibraryStatsQueries, type LibraryStats } from "../src/admin/library-stats.js";
import { authorFromFilePath, authorIdentityKey, createLibraryHealthQueries, type LibraryHealth } from "../src/admin/library-health.js";
import { seriesFromTitle } from "../src/admin/series-from-title.js";
import { buildApp } from "../src/api/build-app.js";
import { createAuthService } from "../src/auth/auth-service.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
import { type BookRequest, createBookRequests, MAX_OPEN_REQUESTS_PER_MEMBER } from "../src/requests/book-requests.js";
import { createSyncService } from "../src/sync/sync-service.js";
import { createUploadService, MAX_STAGED_PER_MEMBER, type UploadPreview, type UploadSubmission } from "../src/uploads/upload-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

const ADMIN_PASSWORD = "correct horse battery";
const MEMBER_PASSWORD = "member password 123";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let uploadsDirectory: string;
let database: LibraryDatabase;
let app: FastifyInstance;
let currentTime: Date;
let rcloneRemote: string | null;
let rcloneCalls: string[][];
let rcloneExitCode: number;

type Session = { cookie: string };

async function writeBook(filePath: string, title: string, authors: string[], extra = ""): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [`<dc:title>${title}</dc:title>`, ...authors.map((author) => `<dc:creator>${author}</dc:creator>`), extra].join("");
  await writeEpub(filePath, [{ path: "OEBPS/content.opf", content: opfDocument(metadata, "") }]);
}

/** Builds the whole app on the current directories; called again in a test to simulate a restart. */
async function startApp(): Promise<void> {
  const store = createLibraryStore(database);
  const runCommand = async (command: string, args: string[]) => {
    rcloneCalls.push([command, ...args]);
    return { exitCode: rcloneExitCode, stderrTail: rcloneExitCode === 0 ? "" : "quota exceeded" };
  };
  const sync = createSyncService({ database, store, booksDirectory, coversDirectory, rcloneRemote: null, runCommand, logError: () => {} });
  const now = () => currentTime;
  app = buildApp({
    catalog: createCatalogQueries(database),
    auth: await createAuthService({ database, now }),
    activity: createActivityLog({ database, now }),
    health: createLibraryHealthQueries(database),
    requests: createBookRequests({ database, now }),
    stats: createLibraryStatsQueries({ database, now }),
    books: createBookAdmin({
      store,
      booksDirectory,
      coversDirectory,
      localTrashDirectory: path.join(workDirectory, "trash"),
      rcloneRemote,
      rcloneTrash: rcloneRemote ? "mega:_corbeille" : null,
      runCommand,
    }),
    uploads: await createUploadService({ database, store, booksDirectory, coversDirectory, uploadsDirectory, rcloneRemote: null, runCommand, now }),
    sync,
    nextScheduledSyncAt: () => null,
    booksDirectory,
    coversDirectory,
  });
}

beforeEach(async () => {
  currentTime = new Date("2026-11-21T10:00:00Z");
  rcloneRemote = null;
  rcloneCalls = [];
  rcloneExitCode = 0;
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-admin-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  uploadsDirectory = path.join(workDirectory, "uploads");
  await writeBook(path.join(booksDirectory, "dune.epub"), "Dune", ["Frank Herbert"], "<dc:language>en</dc:language>");
  database = openLibraryDatabase(":memory:");
  await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
  const auth = await createAuthService({ database });
  await auth.createUser("alice", ADMIN_PASSWORD, "admin");
  await auth.createUser("bob", MEMBER_PASSWORD, "member");
  await auth.createUser("carol", MEMBER_PASSWORD, "member");
  await startApp();
});

afterEach(async () => {
  await app.close();
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

async function sessionOf(username: string, password = MEMBER_PASSWORD): Promise<Session> {
  const response = await app.inject({ method: "POST", url: "/api/auth/login", payload: { username, password } });
  expect(response.statusCode).toBe(200);
  return { cookie: String(response.headers["set-cookie"]).split(";", 1)[0] ?? "" };
}

const adminSession = () => sessionOf("alice", ADMIN_PASSWORD);

let stagedCount = 0;

async function postEpub(session: Session, title: string, authors: string[]) {
  const filePath = path.join(workDirectory, "incoming", `${stagedCount++}.epub`);
  // The counter makes every file's bytes unique, so two uploads of one title are not "identical".
  await writeBook(filePath, title, authors, `<dc:identifier>${stagedCount}</dc:identifier>`);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(await (await import("node:fs/promises")).readFile(filePath))]), `${title}.epub`);
  const encoded = new Response(form);
  return app.inject({
    method: "POST",
    url: "/api/uploads",
    headers: { ...session, "content-type": encoded.headers.get("content-type") ?? "" },
    payload: Buffer.from(await encoded.arrayBuffer()),
  });
}

async function stage(session: Session, title: string, authors: string[]): Promise<UploadPreview> {
  const response = await postEpub(session, title, authors);
  expect(response.statusCode).toBe(201);
  return response.json<UploadPreview>();
}

async function submit(session: Session, title: string, authors: string[]): Promise<UploadPreview> {
  const preview = await stage(session, title, authors);
  const response = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/submit`, headers: session });
  expect(response.statusCode).toBe(200);
  return response.json<UploadPreview>();
}

function bookTitles(): string[] {
  return database.prepare<[], { title: string }>("SELECT title FROM books ORDER BY title").all().map((row) => row.title);
}

async function activityEntries(session: Session, querystring = ""): Promise<ActivityEntry[]> {
  const response = await app.inject({ method: "GET", url: `/api/admin/activity?${querystring}`, headers: session });
  expect(response.statusCode).toBe(200);
  return response.json<{ items: ActivityEntry[] }>().items;
}

async function mySubmissions(session: Session): Promise<UploadSubmission[]> {
  return (await app.inject({ method: "GET", url: "/api/uploads/mine", headers: session })).json<UploadSubmission[]>();
}

describe("uploads from a member", () => {
  it("cannot be confirmed by the member", async () => {
    const bob = await sessionOf("bob");
    const preview = await stage(bob, "Hyperion", ["Dan Simmons"]);

    const response = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm`, headers: bob });

    expect(response.statusCode).toBe(403);
    expect(bookTitles()).toEqual(["Dune"]);
  });

  it("wait for an admin once submitted, then enter the library when approved", async () => {
    const bob = await sessionOf("bob");
    const admin = await adminSession();
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);
    expect(submitted).toMatchObject({ status: "submitted", uploadedBy: "bob" });
    expect(bookTitles()).toEqual(["Dune"]);

    const queue = (await app.inject({ method: "GET", url: "/api/admin/uploads", headers: admin })).json<UploadPreview[]>();
    expect(queue.map((upload) => [upload.title, upload.uploadedBy])).toEqual([["Hyperion", "bob"]]);
    expect((await app.inject({ method: "GET", url: "/api/admin/uploads/count", headers: admin })).json()).toEqual({ count: 1 });

    const approval = await app.inject({ method: "POST", url: `/api/uploads/${submitted.id}/confirm`, headers: admin });

    expect(approval.statusCode).toBe(200);
    expect(bookTitles()).toEqual(["Dune", "Hyperion"]);
    expect(await mySubmissions(bob)).toMatchObject([{ title: "Hyperion", status: "approved", bookId: approval.json<{ bookId: number }>().bookId }]);
    expect((await app.inject({ method: "GET", url: "/api/admin/uploads", headers: admin })).json()).toEqual([]);
  });

  it("can be corrected by the admin before approval", async () => {
    const bob = await sessionOf("bob");
    const admin = await adminSession();
    const submitted = await submit(bob, "Dan Simmons", ["Hyperion"]);

    const correction = await app.inject({
      method: "PATCH",
      url: `/api/uploads/${submitted.id}`,
      headers: admin,
      payload: { title: "Hyperion", authors: ["Dan Simmons"] },
    });
    expect(correction.json<UploadPreview>()).toMatchObject({ status: "submitted", targetPath: "Books/S/Dan Simmons/Dan Simmons - Hyperion.epub" });
    await app.inject({ method: "POST", url: `/api/uploads/${submitted.id}/confirm`, headers: admin });

    expect(existsSync(path.join(booksDirectory, "Books/S/Dan Simmons/Dan Simmons - Hyperion.epub"))).toBe(true);
    expect(await mySubmissions(bob)).toMatchObject([{ title: "Hyperion", authors: ["Dan Simmons"], status: "approved" }]);
  });

  it("are discarded with a reason when rejected", async () => {
    const bob = await sessionOf("bob");
    const admin = await adminSession();
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);

    const rejection = await app.inject({
      method: "POST",
      url: `/api/admin/uploads/${submitted.id}/reject`,
      headers: admin,
      payload: { reason: "Déjà dans l'intégrale" },
    });

    expect(rejection.statusCode).toBe(204);
    expect(await readdir(uploadsDirectory)).toEqual([]);
    expect(bookTitles()).toEqual(["Dune"]);
    expect(await mySubmissions(bob)).toMatchObject([{ title: "Hyperion", status: "rejected", reason: "Déjà dans l'intégrale" }]);
  });

  it("are invisible to other members", async () => {
    const bob = await sessionOf("bob");
    const carol = await sessionOf("carol");
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);

    expect((await app.inject({ method: "DELETE", url: `/api/uploads/${submitted.id}`, headers: carol })).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: "/api/admin/uploads", headers: carol })).statusCode).toBe(403);
    expect((await app.inject({ method: "POST", url: `/api/admin/uploads/${submitted.id}/reject`, headers: carol, payload: {} })).statusCode).toBe(403);
    expect(await mySubmissions(carol)).toEqual([]);
  });

  it("can be withdrawn by their uploader", async () => {
    const bob = await sessionOf("bob");
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);

    expect((await app.inject({ method: "DELETE", url: `/api/uploads/${submitted.id}`, headers: bob })).statusCode).toBe(204);

    expect(await readdir(uploadsDirectory)).toEqual([]);
    expect(await mySubmissions(bob)).toEqual([]);
  });

  it("are capped per member, but not for admins", async () => {
    const bob = await sessionOf("bob");
    for (let index = 0; index < MAX_STAGED_PER_MEMBER; index++) {
      await submit(bob, `Tome ${index}`, ["Dan Simmons"]);
    }

    const oneTooMany = await postEpub(bob, "Tome de trop", ["Dan Simmons"]);

    expect(oneTooMany.statusCode).toBe(409);
    expect(oneTooMany.json()).toMatchObject({ error: "too_many_pending" });
    expect((await postEpub(await sessionOf("carol"), "Autre", ["Dan Simmons"])).statusCode).toBe(201);
  });

  it("survive a restart once submitted, unlike drafts", async () => {
    const bob = await sessionOf("bob");
    const draft = await stage(bob, "Brouillon", ["Dan Simmons"]);
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);
    await app.inject({ method: "PATCH", url: `/api/uploads/${submitted.id}`, headers: bob, payload: { title: "Hypérion", authors: ["Dan Simmons"] } });

    await app.close();
    await startApp();

    const admin = await adminSession();
    const queue = (await app.inject({ method: "GET", url: "/api/admin/uploads", headers: admin })).json<UploadPreview[]>();
    expect(queue).toMatchObject([{ id: submitted.id, title: "Hypérion", uploadedBy: "bob", status: "submitted" }]);
    expect(await readdir(uploadsDirectory)).toEqual([`${submitted.id}.epub`]);
    expect((await app.inject({ method: "POST", url: `/api/uploads/${draft.id}/submit`, headers: await sessionOf("bob") })).statusCode).toBe(404);
    expect((await app.inject({ method: "POST", url: `/api/uploads/${submitted.id}/confirm`, headers: admin })).statusCode).toBe(200);
    expect(bookTitles()).toEqual(["Dune", "Hypérion"]);
  });

  it("are marked lost when their staged file vanished during a restart", async () => {
    const bob = await sessionOf("bob");
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);

    await app.close();
    await rm(path.join(uploadsDirectory, `${submitted.id}.epub`));
    await startApp();

    expect(await mySubmissions(await sessionOf("bob"))).toMatchObject([{ status: "rejected", reason: expect.stringContaining("perdu") }]);
  });
});

describe("uploads from an admin", () => {
  it("go straight into the library", async () => {
    const admin = await adminSession();
    const preview = await stage(admin, "Hyperion", ["Dan Simmons"]);

    expect((await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm`, headers: admin })).statusCode).toBe(200);
    expect(bookTitles()).toEqual(["Dune", "Hyperion"]);
  });
});

describe("GET /api/admin/activity", () => {
  it("is closed to members", async () => {
    expect((await app.inject({ method: "GET", url: "/api/admin/activity", headers: await sessionOf("bob") })).statusCode).toBe(403);
  });

  it("records who downloaded which book, from where and with what", async () => {
    const bob = await sessionOf("bob");
    const bookId = database.prepare<[], { id: number }>("SELECT id FROM books").get()?.id;

    const download = await app.inject({
      method: "GET",
      url: `/api/books/${bookId}/file`,
      headers: { ...bob, "user-agent": "Kobo/4.38" },
      remoteAddress: "192.168.1.20",
    });
    expect(download.statusCode).toBe(200);

    const [entry] = await activityEntries(await adminSession(), "action=download");
    expect(entry).toMatchObject({
      action: "download",
      username: "bob",
      ip: "192.168.1.20",
      userAgent: "Kobo/4.38",
      bookId,
      details: { title: "Dune", filePath: "dune.epub" },
      occurredAt: "2026-11-21T10:00:00.000Z",
    });
  });

  it("does not record a download that failed", async () => {
    const bob = await sessionOf("bob");

    await app.inject({ method: "GET", url: "/api/books/999/file", headers: bob });

    expect(await activityEntries(await adminSession(), "action=download")).toEqual([]);
  });

  it("records logins, failed ones with the attempted name but never the password", async () => {
    await app.inject({ method: "POST", url: "/api/auth/login", payload: { username: "bob", password: "not the right one" } });
    await sessionOf("bob");

    const entries = await activityEntries(await adminSession());

    expect(entries.map((entry) => [entry.action, entry.username])).toEqual([
      ["login", "alice"],
      ["login", "bob"],
      ["login_failed", null],
    ]);
    expect(entries[2]?.details).toEqual({ attemptedUsername: "bob", reason: "invalid_credentials" });
    expect(JSON.stringify(entries)).not.toContain("not the right one");
  });

  it("follows an upload from submission to approval", async () => {
    const bob = await sessionOf("bob");
    const admin = await adminSession();
    const submitted = await submit(bob, "Hyperion", ["Dan Simmons"]);
    await app.inject({ method: "POST", url: `/api/uploads/${submitted.id}/confirm`, headers: admin });

    const entries = (await activityEntries(admin)).filter((entry) => entry.action.startsWith("upload"));

    expect(entries.map((entry) => [entry.action, entry.username, entry.details.title, entry.details.uploadedBy])).toEqual([
      ["upload_approved", "alice", "Hyperion", "bob"],
      ["upload_submitted", "bob", "Hyperion", "bob"],
    ]);
    expect(entries[0]?.bookId).toEqual(expect.any(Number));
  });

  it("filters by user and paginates, newest first", async () => {
    const bob = await sessionOf("bob");
    const bookId = database.prepare<[], { id: number }>("SELECT id FROM books").get()?.id;
    for (let index = 0; index < 3; index++) {
      await app.inject({ method: "GET", url: `/api/books/${bookId}/file`, headers: bob });
    }
    const admin = await adminSession();

    const response = await app.inject({ method: "GET", url: "/api/admin/activity?username=bob&pageSize=2&page=2", headers: admin });

    const page = response.json<{ items: ActivityEntry[]; total: number; usernames: string[] }>();
    expect(page.total).toBe(4);
    expect(page.items.map((entry) => entry.action)).toEqual(["download", "login"]);
    expect(page.usernames).toEqual(["alice", "bob"]);
  });

  it("keeps naming a user whose account was deleted", async () => {
    await sessionOf("bob");
    const admin = await adminSession();
    const bobId = database.prepare<[], { id: number }>("SELECT id FROM users WHERE username = 'bob'").get()?.id;

    await app.inject({ method: "DELETE", url: `/api/admin/users/${bobId}`, headers: admin });

    const entries = await activityEntries(admin);
    expect(entries.map((entry) => [entry.action, entry.username, entry.details.targetUsername ?? null])).toEqual([
      ["user_deleted", "alice", "bob"],
      ["login", "alice", null],
      ["login", "bob", null],
    ]);
  });

  it("forgets entries older than the retention period", async () => {
    await sessionOf("bob");
    currentTime = new Date("2026-12-25T10:00:00Z");
    await sessionOf("carol");

    const purged = createActivityLog({ database, now: () => currentTime }).purgeOlderThan(30);

    expect(purged).toBe(1);
    expect((await activityEntries(await adminSession())).map((entry) => entry.username)).toEqual(["alice", "carol"]);
  });
});

describe("GET /api/admin/health", () => {
  it("is closed to members", async () => {
    expect((await app.inject({ method: "GET", url: "/api/admin/health", headers: await sessionOf("bob") })).statusCode).toBe(403);
  });

  it("reports unreadable files, incomplete records, look-alike authors and past syncs", async () => {
    await writeBook(path.join(booksDirectory, "complet.epub"), "Complet", ["J.K. Rowling"], "<dc:language>fr</dc:language><dc:description>Résumé</dc:description>");
    await writeBook(path.join(booksDirectory, "autre.epub"), "Autre", ["Rowling, J. K."]);
    await writeFile(path.join(booksDirectory, "casse.epub"), "not a zip");
    const admin = await adminSession();
    await app.inject({ method: "POST", url: "/api/sync", headers: admin });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const response = await app.inject({ method: "GET", url: "/api/admin/health", headers: admin });

    expect(response.statusCode).toBe(200);
    const health = response.json<LibraryHealth & { syncRuns: { status: string; trigger: string }[] }>();
    expect(health.bookCount).toBe(3);
    expect(health.invalidFiles).toMatchObject([{ filePath: "casse.epub", error: expect.any(String) }]);
    expect(health.incompleteBooks.map((book) => [book.title, book.missing])).toEqual([
      ["Autre", ["cover", "language", "description"]],
      ["Complet", ["cover"]],
      ["Dune", ["cover", "description"]],
    ]);
    expect(health.similarAuthors.map((group) => group.names.map((author) => author.name).sort())).toEqual([["J.K. Rowling", "Rowling, J. K."]]);
    expect(health.syncRuns).toMatchObject([{ status: "succeeded", trigger: "manual" }]);
  });

  it("lists books credited to nobody, with the author their folder names", async () => {
    await writeBook(path.join(booksDirectory, "Books/E/Mathias Enard/Mathias Enard - Boussole.epub"), "Boussole", []);
    await writeBook(path.join(booksDirectory, "Books/K/Stephen King/Stephen King - Ça.epub"), "Ça", ["Unknown"]);
    await writeBook(path.join(booksDirectory, "Books/_Sans auteur/Libres d'obéir.epub"), "Libres d'obéir", []);
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    const { authorlessBooks, similarAuthors } = createLibraryHealthQueries(database).getHealth();

    expect(authorlessBooks.map((book) => [book.title, book.authors, book.suggestedAuthor])).toEqual([
      ["Boussole", [], "Mathias Enard"],
      ["Ça", ["Unknown"], "Stephen King"],
      ["Libres d'obéir", [], null],
    ]);
    expect(similarAuthors).toEqual([]);
  });

  it("groups files that look like the same work, but not namesakes by other authors", async () => {
    await writeBook(path.join(booksDirectory, "a.epub"), "Le Messie de Dune", ["Frank Herbert"]);
    await writeBook(path.join(booksDirectory, "b.epub"), "Messie de Dune (poche)", ["Herbert, Frank"]);
    await writeBook(path.join(booksDirectory, "c.epub"), "Dune", ["Quelqu'un d'autre"]);
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    const { probableDuplicates } = createLibraryHealthQueries(database).getHealth();

    expect(probableDuplicates.map((group) => group.books.map((book) => book.filePath).sort())).toEqual([["a.epub", "b.epub"]]);
  });
});

describe("seriesFromTitle", () => {
  it("reads the series, the volume and the book's own title", () => {
    expect(seriesFromTitle("L'Assassin Royal-10-Serments et Deuils")).toEqual({ series: "L'Assassin Royal", seriesIndex: 10, title: "Serments et Deuils" });
    expect(seriesFromTitle("L'assassin royal [001] – L'apprenti assassin")).toEqual({ series: "L'assassin royal", seriesIndex: 1, title: "L'apprenti assassin" });
    expect(seriesFromTitle("Dune, 03. Les enfants de Dune")).toEqual({ series: "Dune", seriesIndex: 3, title: "Les enfants de Dune" });
    expect(seriesFromTitle("Le Livre des Martyrs T10 Le dieu estropié")).toEqual({ series: "Le Livre des Martyrs", seriesIndex: 10, title: "Le dieu estropié" });
    expect(seriesFromTitle("Too Like the Lightning (Terra Ignota Book 1)")).toEqual({ series: "Terra Ignota", seriesIndex: 1, title: "Too Like the Lightning" });
    expect(seriesFromTitle("Histoire intime de la Ve République (Tome 1) - Le sursaut (French Edition)")).toEqual({
      series: "Histoire intime de la Ve République",
      seriesIndex: 1,
      title: "Le sursaut",
    });
  });

  it("keeps the title when the volume number is all that follows", () => {
    expect(seriesFromTitle("La Guerre et la Paix - Tome I")).toEqual({ series: "La Guerre et la Paix", seriesIndex: 1, title: null });
    expect(seriesFromTitle("Endymion 2")).toEqual({ series: "Endymion", seriesIndex: 2, title: null });
    expect(seriesFromTitle("Les annales de la Compagnie noire (L'Intégrale - Tome 4)")).toMatchObject({ series: "Les annales de la Compagnie noire", seriesIndex: 4 });
  });

  it("does not take a number in a title for a volume", () => {
    for (const title of ["1984", "Métro 2033", "Article 353 du code pénal", "2023 - Tsunami", "10 Sharko", "1 - Binding 13: Boys of Tommen", "Dune"]) {
      expect(seriesFromTitle(title), title).toBeNull();
    }
  });
});

describe("GET /api/admin/series-suggestions", () => {
  it("proposes a series for books that have none, under one spelling per series", async () => {
    await writeBook(path.join(booksDirectory, "a.epub"), "L'Assassin Royal-10-Serments et Deuils", ["Robin Hobb"]);
    await writeBook(path.join(booksDirectory, "b.epub"), "L'Assassin Royal-11-Le Dragon des glaces", ["Robin Hobb"]);
    await writeBook(path.join(booksDirectory, "c.epub"), "L'assassin royal [001] – L'apprenti assassin", ["Robin Hobb"]);
    await writeBook(path.join(booksDirectory, "d.epub"), "Fondation 2 - Seconde Fondation", ["Isaac Asimov"], CALIBRE_SERIES("Fondation", 2));
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    const response = await app.inject({ method: "GET", url: "/api/admin/series-suggestions", headers: await adminSession() });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ series: string; seriesIndex: number; shorterTitle: string }[]>().map((s) => [s.series, s.seriesIndex, s.shorterTitle])).toEqual([
      ["L'Assassin Royal", 1, "L'apprenti assassin"],
      ["L'Assassin Royal", 10, "Serments et Deuils"],
      ["L'Assassin Royal", 11, "Le Dragon des glaces"],
    ]);
  });

  it("falls back on what the bibliography of a followed author says", async () => {
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
    const dune = bookId("Dune");

    const suggestions = createLibraryHealthQueries(database).getSeriesSuggestions([{ bookId: dune, series: "Cycle de Dune", seriesIndex: 1 }]);

    expect(suggestions).toMatchObject([{ bookId: dune, series: "Cycle de Dune", seriesIndex: 1, shorterTitle: null, source: "wikidata" }]);
  });
});

describe("POST /api/admin/books/language", () => {
  it("files several books under a language, and keeps it when they are indexed again", async () => {
    await writeBook(path.join(booksDirectory, "a.epub"), "Sans langue", ["A"]);
    await writeBook(path.join(booksDirectory, "b.epub"), "Indéterminée", ["B"], "<dc:language>und</dc:language>");
    await writeBook(path.join(booksDirectory, "c.epub"), "Trois lettres", ["C"], "<dc:language>fre</dc:language>");
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
    const languages = () => database.prepare("SELECT title, language FROM books WHERE title != 'Dune' ORDER BY title").all();
    expect(languages()).toEqual([
      { title: "Indéterminée", language: null },
      { title: "Sans langue", language: null },
      { title: "Trois lettres", language: "fr" },
    ]);
    const admin = await adminSession();
    const setLanguage = (headers: Session, bookIds: number[], language: string) =>
      app.inject({ method: "POST", url: "/api/admin/books/language", headers, payload: { bookIds, language } });

    expect((await setLanguage(await sessionOf("bob"), [bookId("Sans langue")], "fr")).statusCode).toBe(403);
    expect((await setLanguage(admin, [bookId("Sans langue")], "f1")).statusCode).toBe(400);
    const response = await setLanguage(admin, [bookId("Sans langue"), bookId("Indéterminée")], "FR");

    expect(response.json()).toEqual({ changedBooks: 2 });
    await reindexEverything();
    expect(languages()).toEqual([
      { title: "Indéterminée", language: "fr" },
      { title: "Sans langue", language: "fr" },
      { title: "Trois lettres", language: "fr" },
    ]);
  });
});

describe("authorFromFilePath", () => {
  it("reads the author from the library layout only", () => {
    expect(authorFromFilePath("Books/H/Frank Herbert/Frank Herbert - Dune.epub")).toBe("Frank Herbert");
    expect(authorFromFilePath("Books/_À identifier/0750a8.epub")).toBeNull();
    expect(authorFromFilePath("Books/Divers/Dune.epub")).toBeNull();
    expect(authorFromFilePath("Dune.epub")).toBeNull();
  });
});

describe("authorIdentityKey", () => {
  it("is the same for one person typed differently", () => {
    const variants = ["J.K. Rowling", "J. K. Rowling", "Rowling, J.K.", "JK Rowling", "j k rowling"];

    expect(new Set(variants.map(authorIdentityKey)).size).toBe(1);
  });

  it("ignores accents and case", () => {
    expect(authorIdentityKey("Émile ZOLA")).toBe(authorIdentityKey("Emile Zola"));
  });

  it("tells different people apart", () => {
    expect(authorIdentityKey("Frank Herbert")).not.toBe(authorIdentityKey("Brian Herbert"));
  });
});

const CALIBRE_SERIES = (name: string, index: number) =>
  `<meta name="calibre:series" content="${name}"/><meta name="calibre:series_index" content="${index}"/>`;

function bookId(title: string): number {
  const row = database.prepare<[string], { id: number }>("SELECT id FROM books WHERE title = ?").get(title);
  if (!row) {
    throw new Error(`No book titled ${title}`);
  }
  return row.id;
}

/** Makes the indexer see every file as changed, the way a rebuilt index or a re-synced library would. */
async function reindexEverything(): Promise<void> {
  database.prepare("UPDATE books SET file_mtime_ms = -1").run();
  await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
}

async function listTitles(session: Session, querystring: string): Promise<string[]> {
  const response = await app.inject({ method: "GET", url: `/api/books?${querystring}`, headers: session });
  expect(response.statusCode).toBe(200);
  return response.json<{ items: { title: string }[] }>().items.map((item) => item.title);
}

describe("series", () => {
  beforeEach(async () => {
    await writeBook(path.join(booksDirectory, "f2.epub"), "Fondation et Empire", ["Isaac Asimov"], CALIBRE_SERIES("Fondation", 2));
    await writeBook(path.join(booksDirectory, "f1.epub"), "Fondation", ["Isaac Asimov"], CALIBRE_SERIES("Fondation", 1));
    await writeBook(path.join(booksDirectory, "f3.epub"), "Seconde Fondation", ["Isaac Asimov"], CALIBRE_SERIES("Fondation", 3));
    await writeBook(path.join(booksDirectory, "robots.epub"), "Les Robots", ["Isaac Asimov"]);
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
  });

  it("are listed in reading order and shown on each book", async () => {
    const bob = await sessionOf("bob");

    expect(await listTitles(bob, "series=Fondation")).toEqual(["Fondation", "Fondation et Empire", "Seconde Fondation"]);
    const book = await app.inject({ method: "GET", url: `/api/books/${bookId("Seconde Fondation")}`, headers: bob });
    expect(book.json()).toMatchObject({ series: "Fondation", seriesIndex: 3 });
  });

  it("make every volume findable by the series name", async () => {
    await writeBook(path.join(booksDirectory, "d1.epub"), "Les Cavernes d'acier", ["Isaac Asimov"], CALIBRE_SERIES("Cycle des robots", 1));
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    expect(await listTitles(await sessionOf("bob"), "q=cycle robots")).toEqual(["Les Cavernes d'acier"]);
  });

  it("are filled in for books indexed before series were read, without undoing corrections", async () => {
    const id = bookId("Fondation");
    database.prepare("UPDATE books SET series = NULL, series_index = NULL, series_checked = 0, title = 'Fondation (corrigé)' WHERE id = ?").run(id);

    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    const book = await app.inject({ method: "GET", url: `/api/books/${id}`, headers: await sessionOf("bob") });
    expect(book.json()).toMatchObject({ title: "Fondation (corrigé)", series: "Fondation", seriesIndex: 1 });
  });

  it("keep the series an admin chose before the file's own was ever read", async () => {
    const admin = await adminSession();
    const id = bookId("Fondation");
    database.prepare("UPDATE books SET series = NULL, series_index = NULL, series_checked = 0").run();
    const correction = { title: "Fondation", authors: ["Isaac Asimov"], series: "Cycle de Fondation", seriesIndex: 3 };
    await app.inject({ method: "PATCH", url: `/api/admin/books/${id}`, headers: admin, payload: correction });

    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    expect((await app.inject({ method: "GET", url: `/api/books/${id}`, headers: admin })).json()).toMatchObject({ series: "Cycle de Fondation", seriesIndex: 3 });
  });

  it("take the file's series after a correction that only renamed the book, and keep it when indexed again", async () => {
    const admin = await adminSession();
    const id = bookId("Fondation");
    database.prepare("UPDATE books SET series = NULL, series_index = NULL, series_checked = 0").run();
    const correction = { title: "Fondation (renommé)", authors: ["Isaac Asimov"], series: null, seriesIndex: null };
    await app.inject({ method: "PATCH", url: `/api/admin/books/${id}`, headers: admin, payload: correction });

    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
    await reindexEverything();

    expect((await app.inject({ method: "GET", url: `/api/books/${id}`, headers: admin })).json()).toMatchObject({
      title: "Fondation (renommé)",
      series: "Fondation",
      seriesIndex: 1,
    });
  });
});

describe("PATCH /api/admin/books/:id", () => {
  const correction = { title: "Dune (édition révisée)", authors: ["Herbert, Frank", " "], series: " Cycle de Dune ", seriesIndex: 1 };

  it("is closed to members", async () => {
    const response = await app.inject({ method: "PATCH", url: `/api/admin/books/${bookId("Dune")}`, headers: await sessionOf("bob"), payload: correction });

    expect(response.statusCode).toBe(403);
  });

  it("corrects what the catalog shows and what the search finds", async () => {
    const admin = await adminSession();
    const id = bookId("Dune");

    const response = await app.inject({ method: "PATCH", url: `/api/admin/books/${id}`, headers: admin, payload: correction });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ title: "Dune (édition révisée)", authors: ["Herbert, Frank"], series: "Cycle de Dune", seriesIndex: 1 });
    expect(await listTitles(admin, "q=révisée")).toEqual(["Dune (édition révisée)"]);
    expect(await listTitles(admin, `author=${encodeURIComponent("Herbert, Frank")}`)).toEqual(["Dune (édition révisée)"]);
    expect(await listTitles(admin, `author=${encodeURIComponent("Frank Herbert")}`)).toEqual([]);
    expect((await activityEntries(admin, "action=book_edited"))[0]).toMatchObject({
      username: "alice",
      bookId: id,
      details: { title: "Dune (édition révisée)", previousTitle: "Dune", previousAuthors: "Frank Herbert" },
    });
  });

  it("keeps the correction when the file is indexed again, even after it moved", async () => {
    const admin = await adminSession();
    await app.inject({ method: "PATCH", url: `/api/admin/books/${bookId("Dune")}`, headers: admin, payload: correction });

    await reindexEverything();
    expect(await listTitles(admin, "")).toEqual(["Dune (édition révisée)"]);

    await mkdir(path.join(booksDirectory, "Rangé"));
    await (await import("node:fs/promises")).rename(path.join(booksDirectory, "dune.epub"), path.join(booksDirectory, "Rangé/dune.epub"));
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
    const moved = await app.inject({ method: "GET", url: `/api/books/${bookId("Dune (édition révisée)")}`, headers: admin });
    expect(moved.json()).toMatchObject({ authors: ["Herbert, Frank"], series: "Cycle de Dune" });
  });

  it("can remove a book from its series", async () => {
    const admin = await adminSession();
    const id = bookId("Dune");
    await app.inject({ method: "PATCH", url: `/api/admin/books/${id}`, headers: admin, payload: correction });

    const response = await app.inject({
      method: "PATCH",
      url: `/api/admin/books/${id}`,
      headers: admin,
      payload: { ...correction, series: null, seriesIndex: 4 },
    });

    expect(response.json()).toMatchObject({ series: null, seriesIndex: null });
  });

  it("refuses an empty title and an unknown book", async () => {
    const admin = await adminSession();

    const emptyTitle = await app.inject({ method: "PATCH", url: `/api/admin/books/${bookId("Dune")}`, headers: admin, payload: { ...correction, title: " " } });
    const unknown = await app.inject({ method: "PATCH", url: "/api/admin/books/999", headers: admin, payload: correction });

    expect(emptyTitle.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(404);
  });
});

describe("a title corrected at upload time", () => {
  it("survives a re-index", async () => {
    const admin = await adminSession();
    const preview = await stage(admin, "Dan Simmons", ["Hyperion"]);
    await app.inject({ method: "PATCH", url: `/api/uploads/${preview.id}`, headers: admin, payload: { title: "Hyperion", authors: ["Dan Simmons"] } });
    await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm`, headers: admin });

    await reindexEverything();

    expect(bookTitles()).toEqual(["Dune", "Hyperion"]);
  });
});

describe("POST /api/admin/authors/merge", () => {
  beforeEach(async () => {
    await writeBook(path.join(booksDirectory, "messie.epub"), "Le Messie de Dune", ["Herbert, Frank"]);
    await writeBook(path.join(booksDirectory, "duo.epub"), "La Maison des mères", ["HERBERT Frank", "Brian Herbert"]);
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
  });

  async function authorFacets(session: Session): Promise<[string, number][]> {
    const facets = (await app.inject({ method: "GET", url: "/api/facets", headers: session })).json<{ authors: { name: string; bookCount: number }[] }>();
    return facets.authors.map((author) => [author.name, author.bookCount]);
  }

  it("is closed to members", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/admin/authors/merge",
      headers: await sessionOf("bob"),
      payload: { from: ["Herbert, Frank"], into: "Frank Herbert" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("gives one name to every spelling, keeping co-authors, and holds after a re-index", async () => {
    const admin = await adminSession();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/authors/merge",
      headers: admin,
      payload: { from: ["Frank Herbert", "Herbert, Frank", "HERBERT Frank"], into: "Frank Herbert" },
    });

    expect(response.json()).toEqual({ into: "Frank Herbert", changedBooks: 2 });
    expect(await authorFacets(admin)).toEqual([
      ["Brian Herbert", 1],
      ["Frank Herbert", 3],
    ]);
    await reindexEverything();
    expect(await authorFacets(admin)).toEqual([
      ["Brian Herbert", 1],
      ["Frank Herbert", 3],
    ]);
    expect((await activityEntries(admin, "action=authors_merged"))[0]?.details).toMatchObject({ into: "Frank Herbert", changedBooks: 2 });
  });

  it("renames an author when the target name is new", async () => {
    const admin = await adminSession();

    await app.inject({ method: "POST", url: "/api/admin/authors/merge", headers: admin, payload: { from: ["Brian Herbert"], into: "Brian P. Herbert" } });

    expect((await authorFacets(admin)).map(([name]) => name)).toContain("Brian P. Herbert");
    expect((await authorFacets(admin)).map(([name]) => name)).not.toContain("Brian Herbert");
  });
});

describe("DELETE /api/admin/books/:id", () => {
  it("is closed to members", async () => {
    const response = await app.inject({ method: "DELETE", url: `/api/admin/books/${bookId("Dune")}`, headers: await sessionOf("bob") });

    expect(response.statusCode).toBe(403);
    expect(bookTitles()).toEqual(["Dune"]);
  });

  it("moves the file to the local trash when the library has no remote", async () => {
    const admin = await adminSession();
    const id = bookId("Dune");

    const response = await app.inject({ method: "DELETE", url: `/api/admin/books/${id}`, headers: admin });

    expect(response.statusCode).toBe(204);
    expect(bookTitles()).toEqual([]);
    expect(existsSync(path.join(booksDirectory, "dune.epub"))).toBe(false);
    expect(existsSync(path.join(workDirectory, "trash/dune.epub"))).toBe(true);
    expect((await app.inject({ method: "GET", url: "/api/facets", headers: admin })).json()).toMatchObject({ authors: [] });
    expect((await activityEntries(admin, "action=book_deleted"))[0]).toMatchObject({ bookId: id, details: { title: "Dune", filePath: "dune.epub" } });
  });

  it("moves the file to the trash folder of the remote, where a sync will not bring it back", async () => {
    await app.close();
    rcloneRemote = "mega:Library";
    await startApp();
    const admin = await adminSession();

    const response = await app.inject({ method: "DELETE", url: `/api/admin/books/${bookId("Dune")}`, headers: admin });

    expect(response.statusCode).toBe(204);
    expect(rcloneCalls).toEqual([["rclone", "moveto", "mega:Library/dune.epub", "mega:_corbeille/dune.epub"]]);
    expect(existsSync(path.join(booksDirectory, "dune.epub"))).toBe(false);
    expect(bookTitles()).toEqual([]);
  });

  it("changes nothing when the remote refuses the move", async () => {
    await app.close();
    rcloneRemote = "mega:Library";
    rcloneExitCode = 1;
    await startApp();
    const admin = await adminSession();

    const response = await app.inject({ method: "DELETE", url: `/api/admin/books/${bookId("Dune")}`, headers: admin });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({ error: "remote_move_failed", message: expect.stringContaining("quota exceeded") });
    expect(existsSync(path.join(booksDirectory, "dune.epub"))).toBe(true);
    expect(bookTitles()).toEqual(["Dune"]);
  });
});

describe("book requests", () => {
  function ask(session: Session, payload: Record<string, unknown>) {
    return app.inject({ method: "POST", url: "/api/requests", headers: session, payload });
  }

  async function listRequests(session: Session): Promise<BookRequest[]> {
    return (await app.inject({ method: "GET", url: "/api/requests", headers: session })).json<BookRequest[]>();
  }

  function setStatus(session: Session, id: number, status: string) {
    return app.inject({ method: "PATCH", url: `/api/requests/${id}`, headers: session, payload: { status } });
  }

  it("can be made by a member and are seen by everyone", async () => {
    const bob = await sessionOf("bob");

    const created = await ask(bob, { title: " Hyperion ", author: "Dan Simmons", note: "pour les vacances" });

    expect(created.statusCode).toBe(201);
    expect(await listRequests(await sessionOf("carol"))).toMatchObject([
      { title: "Hyperion", author: "Dan Simmons", note: "pour les vacances", status: "open", requestedBy: "bob", bookId: null },
    ]);
  });

  it("refuse a book that is already asked for, however it is typed", async () => {
    await ask(await sessionOf("bob"), { title: "Hyperion", author: "Dan Simmons" });

    const again = await ask(await sessionOf("carol"), { title: "hypérion", author: "Simmons, Dan" });

    expect(again.statusCode).toBe(409);
    expect(again.json()).toMatchObject({ error: "already_requested", message: expect.stringContaining("bob") });
  });

  it("close by themselves when the book is uploaded", async () => {
    const bob = await sessionOf("bob");
    const admin = await adminSession();
    await ask(bob, { title: "Hyperion", author: "Dan Simmons" });
    await ask(bob, { title: "Hyperion", author: "Quelqu'un d'autre" });

    const preview = await stage(admin, "Hypérion", ["Simmons, Dan"]);
    const upload = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm`, headers: admin });

    const requests = await listRequests(bob);
    expect(requests.map((request) => [request.author, request.status, request.bookId])).toEqual([
      ["Quelqu'un d'autre", "open", null],
      ["Dan Simmons", "fulfilled", upload.json<{ bookId: number }>().bookId],
    ]);
    expect((await activityEntries(admin, "action=request_fulfilled"))[0]).toMatchObject({ username: null, details: { title: "Hyperion", automatic: true } });
  });

  it("close by themselves when the book arrives through a sync, author left blank included", async () => {
    const bob = await sessionOf("bob");
    await ask(bob, { title: "Les Robots" });

    await writeBook(path.join(booksDirectory, "robots.epub"), "Les robots", ["Isaac Asimov"]);
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });

    expect(await listRequests(bob)).toMatchObject([{ title: "Les Robots", status: "fulfilled", bookId: bookId("Les robots") }]);
  });

  it("can be withdrawn and reopened by their author, but not by another member", async () => {
    const bob = await sessionOf("bob");
    const { id } = (await ask(bob, { title: "Hyperion" })).json<BookRequest>();

    expect((await setStatus(await sessionOf("carol"), id, "dropped")).statusCode).toBe(403);
    expect((await setStatus(bob, id, "fulfilled")).statusCode).toBe(403);
    expect((await setStatus(bob, id, "dropped")).json()).toMatchObject({ status: "dropped", closedAt: "2026-11-21T10:00:00.000Z" });
    expect((await setStatus(bob, id, "open")).json()).toMatchObject({ status: "open", closedAt: null });
  });

  it("can be closed by an admin, whoever made them", async () => {
    const { id } = (await ask(await sessionOf("bob"), { title: "Hyperion" })).json<BookRequest>();
    const admin = await adminSession();

    expect((await setStatus(admin, id, "fulfilled")).json()).toMatchObject({ status: "fulfilled" });
    expect((await setStatus(admin, 999, "dropped")).statusCode).toBe(404);
  });

  it("are capped per member", async () => {
    const bob = await sessionOf("bob");
    for (let index = 0; index < MAX_OPEN_REQUESTS_PER_MEMBER; index++) {
      await ask(bob, { title: `Livre ${index}` });
    }

    expect((await ask(bob, { title: "Un de trop" })).json()).toMatchObject({ error: "too_many_requests" });
    expect((await ask(await adminSession(), { title: "Un de trop" })).statusCode).toBe(201);
  });

  it("refuse an empty title", async () => {
    expect((await ask(await sessionOf("bob"), { title: "  " })).statusCode).toBe(400);
  });
});

describe("GET /api/admin/stats", () => {
  it("is closed to members", async () => {
    expect((await app.inject({ method: "GET", url: "/api/admin/stats", headers: await sessionOf("bob") })).statusCode).toBe(403);
  });

  it("sums up the library, its downloads and what waits for the admin", async () => {
    await writeBook(path.join(booksDirectory, "f1.epub"), "Fondation", ["Isaac Asimov"], `<dc:language>fr</dc:language>${CALIBRE_SERIES("Fondation", 1)}`);
    await writeBook(path.join(booksDirectory, "robots.epub"), "Les Robots", ["Isaac Asimov"], "<dc:language>fr</dc:language>");
    await indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
    database.prepare("UPDATE books SET added_at = '2026-09-03T08:00:00.000Z' WHERE title = 'Dune'").run();
    database.prepare("UPDATE books SET added_at = '2025-01-01T08:00:00.000Z' WHERE title = 'Les Robots'").run();
    const bob = await sessionOf("bob");
    const carol = await sessionOf("carol");
    const download = (session: Session, title: string) => app.inject({ method: "GET", url: `/api/books/${bookId(title)}/file`, headers: session });
    await download(bob, "Dune");
    await download(carol, "Dune");
    currentTime = new Date("2026-12-30T10:00:00Z");
    await download(await sessionOf("bob"), "Fondation");
    await submit(await sessionOf("bob"), "Hyperion", ["Dan Simmons"]);
    await app.inject({ method: "POST", url: "/api/requests", headers: await sessionOf("carol"), payload: { title: "Ubik" } });

    const response = await app.inject({ method: "GET", url: "/api/admin/stats", headers: await adminSession() });

    expect(response.statusCode).toBe(200);
    const stats = response.json<LibraryStats>();
    expect(stats.totals).toMatchObject({ books: 3, authors: 2, series: 1, users: 3, openRequests: 1, pendingUploads: 1, invalidFiles: 0 });
    expect(stats.totals.totalBytes).toBeGreaterThan(0);
    expect(stats.downloads).toEqual({
      total: 3,
      last30Days: 1,
      neverDownloaded: 1,
      topBooks: [
        { bookId: bookId("Dune"), title: "Dune", count: 2 },
        { bookId: bookId("Fondation"), title: "Fondation", count: 1 },
      ],
      byUser: [
        { label: "bob", count: 2 },
        { label: "carol", count: 1 },
      ],
    });
    expect(stats.addedByMonth).toHaveLength(12);
    expect(stats.addedByMonth[0]).toEqual({ month: "2026-01", count: 0 });
    expect(stats.addedByMonth.filter((month) => month.count > 0)).toEqual([
      { month: "2026-09", count: 1 },
      { month: expect.stringMatching(/^2026-1[12]$/), count: 1 },
    ]);
    expect(stats.languages).toEqual([
      { label: "fr", count: 2 },
      { label: "en", count: 1 },
    ]);
  });

  it("still names a downloaded book that has left the library, without linking to it", async () => {
    const admin = await adminSession();
    const id = bookId("Dune");
    await app.inject({ method: "GET", url: `/api/books/${id}/file`, headers: admin });
    await app.inject({ method: "DELETE", url: `/api/admin/books/${id}`, headers: admin });

    const stats = (await app.inject({ method: "GET", url: "/api/admin/stats", headers: admin })).json<LibraryStats>();

    expect(stats.downloads.topBooks).toEqual([{ bookId: null, title: "Dune", count: 1 }]);
  });
});
