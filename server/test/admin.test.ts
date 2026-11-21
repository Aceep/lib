import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type ActivityEntry, createActivityLog } from "../src/activity/activity-log.js";
import { authorIdentityKey, createLibraryHealthQueries, type LibraryHealth } from "../src/admin/library-health.js";
import { buildApp } from "../src/api/build-app.js";
import { createAuthService } from "../src/auth/auth-service.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
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

type Session = { cookie: string };

async function writeBook(filePath: string, title: string, authors: string[], extra = ""): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [`<dc:title>${title}</dc:title>`, ...authors.map((author) => `<dc:creator>${author}</dc:creator>`), extra].join("");
  await writeEpub(filePath, [{ path: "OEBPS/content.opf", content: opfDocument(metadata, "") }]);
}

/** Builds the whole app on the current directories; called again in a test to simulate a restart. */
async function startApp(): Promise<void> {
  const store = createLibraryStore(database);
  const runCommand = async () => ({ exitCode: 0, stderrTail: "" });
  const sync = createSyncService({ database, store, booksDirectory, coversDirectory, rcloneRemote: null, runCommand, logError: () => {} });
  const now = () => currentTime;
  app = buildApp({
    catalog: createCatalogQueries(database),
    auth: await createAuthService({ database, now }),
    activity: createActivityLog({ database, now }),
    health: createLibraryHealthQueries(database),
    uploads: await createUploadService({ database, store, booksDirectory, coversDirectory, uploadsDirectory, rcloneRemote: null, runCommand, now }),
    sync,
    nextScheduledSyncAt: () => null,
    booksDirectory,
    coversDirectory,
  });
}

beforeEach(async () => {
  currentTime = new Date("2026-11-21T10:00:00Z");
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
