import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
import type { CommandRunner } from "../src/sync/run-command.js";
import { createSyncService } from "../src/sync/sync-service.js";
import { createUploadService, type UploadPreview, type UploadResult } from "../src/uploads/upload-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let uploadsDirectory: string;
let database: LibraryDatabase;
let app: FastifyInstance;
let rcloneCalls: string[][];
let rcloneExitCode: number;

type BookFixture = { title: string; authors: string[]; language?: string; extra?: string };

async function buildBook(filePath: string, book: BookFixture): Promise<Buffer> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [
    `<dc:title>${book.title}</dc:title>`,
    ...book.authors.map((author) => `<dc:creator>${author}</dc:creator>`),
    book.language ? `<dc:language>${book.language}</dc:language>` : "",
  ].join("");
  await writeEpub(filePath, [
    { path: "OEBPS/content.opf", content: opfDocument(metadata, "") },
    ...(book.extra ? [{ path: "OEBPS/extra.txt", content: book.extra }] : []),
  ]);
  return readFile(filePath);
}

async function setup(remote: string | null, library: Record<string, BookFixture>) {
  for (const [file, book] of Object.entries(library)) {
    await buildBook(path.join(booksDirectory, file), book);
  }
  database = openLibraryDatabase(":memory:");
  const store = createLibraryStore(database);
  await indexLibrary({ store, booksDirectory, coversDirectory });
  const runCommand: CommandRunner = async (command, args) => {
    rcloneCalls.push([command, ...args]);
    return { exitCode: rcloneExitCode, stderrTail: rcloneExitCode === 0 ? "" : "quota exceeded" };
  };
  const sync = createSyncService({ database, store, booksDirectory, coversDirectory, rcloneRemote: remote, runCommand, logError: () => {} });
  const uploads = await createUploadService({ database, store, booksDirectory, coversDirectory, uploadsDirectory, rcloneRemote: remote, runCommand });
  app = buildApp({ catalog: createCatalogQueries(database), sync, uploads, nextScheduledSyncAt: () => null, booksDirectory, coversDirectory });
}

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-uploads-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  uploadsDirectory = path.join(workDirectory, "uploads");
  await mkdir(booksDirectory);
  rcloneCalls = [];
  rcloneExitCode = 0;
});

afterEach(async () => {
  await app.close();
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

async function postFile(fileName: string, content: Buffer) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(content)], { type: "application/epub+zip" }), fileName);
  const encoded = new Response(form);
  return app.inject({
    method: "POST",
    url: "/api/uploads",
    headers: { "content-type": encoded.headers.get("content-type") ?? "" },
    payload: Buffer.from(await encoded.arrayBuffer()),
  });
}

async function stage(fileName: string, book: BookFixture): Promise<UploadPreview> {
  const content = await buildBook(path.join(workDirectory, "incoming", fileName), book);
  const response = await postFile(fileName, content);
  expect(response.statusCode).toBe(201);
  return response.json<UploadPreview>();
}

function bookTitles(): string[] {
  return database.prepare<[], { title: string }>("SELECT title FROM books ORDER BY title").all().map((row) => row.title);
}

describe("POST /api/uploads", () => {
  it("proposes the normalized destination and flags nothing for a new book", async () => {
    await setup(null, { "dune.epub": { title: "Dune", authors: ["Frank Herbert"] } });

    const preview = await stage("palmer sept.epub", { title: "Sept redditions", authors: ["Palmer, Ada"], language: "fr" });

    expect(preview).toMatchObject({
      originalName: "palmer sept.epub",
      title: "Sept redditions",
      authors: ["Palmer, Ada"],
      language: "fr",
      targetPath: "Books/P/Ada Palmer/Ada Palmer - Sept redditions.epub",
      duplicates: [],
    });
    expect(preview.fileSize).toBeGreaterThan(0);
    // Staged, not in the library yet.
    expect(await readdir(uploadsDirectory)).toEqual([`${preview.id}.epub`]);
    expect(bookTitles()).toEqual(["Dune"]);
  });

  it("flags an identical file, the same book under another file, and a taken target path", async () => {
    await setup(null, {
      "dune.epub": { title: "Dune", authors: ["Frank Herbert"] },
      "Books/H/Frank Herbert/Frank Herbert - Dune.epub": { title: "DUNE", authors: ["Herbert, Frank"], extra: "edition 2" },
    });
    const identical = await readFile(path.join(booksDirectory, "dune.epub"));

    const sameBytes = await postFile("copie.epub", identical);
    expect(sameBytes.statusCode).toBe(201);
    expect(sameBytes.json<UploadPreview>().duplicates.map((d) => [d.reason, d.filePath])).toEqual([
      ["identical", "dune.epub"],
      ["same-book", "Books/H/Frank Herbert/Frank Herbert - Dune.epub"],
    ]);

    const otherEdition = await stage("dune3.epub", { title: "Dune", authors: ["Frank Herbert"], extra: "edition 3" });
    expect(otherEdition.targetPath).toBe("Books/H/Frank Herbert/Frank Herbert - Dune.epub");
    expect(otherEdition.duplicates.map((d) => [d.reason, d.filePath])).toEqual([
      ["same-book", "dune.epub"],
      ["same-book", "Books/H/Frank Herbert/Frank Herbert - Dune.epub"],
    ]);
  });

  it("rejects a file that is not an EPUB and keeps nothing on disk", async () => {
    await setup(null, {});

    const response = await postFile("notes.epub", Buffer.from("not a zip"));

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ error: "invalid_epub" });
    expect(await readdir(uploadsDirectory)).toEqual([]);
  });
});

describe("PATCH /api/uploads/:id", () => {
  it("recomputes the destination and the duplicates from corrected metadata", async () => {
    await setup(null, { "dune.epub": { title: "Dune", authors: ["Frank Herbert"] } });
    // Title and author swapped in the file, as happens.
    const preview = await stage("x.epub", { title: "Frank Herbert", authors: ["Dune"] });
    expect(preview.duplicates).toEqual([]);

    const response = await app.inject({
      method: "PATCH",
      url: `/api/uploads/${preview.id}`,
      payload: { title: " Dune ", authors: ["Herbert, Frank", ""] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<UploadPreview>()).toMatchObject({
      id: preview.id,
      title: "Dune",
      authors: ["Herbert, Frank"],
      targetPath: "Books/H/Frank Herbert/Frank Herbert - Dune.epub",
      duplicates: [{ reason: "same-book", filePath: "dune.epub" }],
    });

    // The correction is what ends up in the catalog.
    const confirm = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` });
    expect(confirm.json<UploadResult>().filePath).toBe("Books/H/Frank Herbert/Frank Herbert - Dune.epub");
    const book = await app.inject({ method: "GET", url: `/api/books/${confirm.json<UploadResult>().bookId}` });
    expect(book.json()).toMatchObject({ title: "Dune", authors: ["Herbert, Frank"] });
  });

  it("refuses an empty title", async () => {
    await setup(null, {});
    const preview = await stage("x.epub", { title: "Dune", authors: ["Frank Herbert"] });

    const response = await app.inject({ method: "PATCH", url: `/api/uploads/${preview.id}`, payload: { title: "  ", authors: [] } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "invalid_metadata" });
  });
});

describe("POST /api/uploads/:id/confirm", () => {
  it("files the book, pushes it to the remote and indexes it", async () => {
    await setup("mega:Library", {});
    const preview = await stage("x.epub", { title: "Sept redditions", authors: ["Ada Palmer"] });

    const response = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` });

    expect(response.statusCode).toBe(200);
    const result = response.json<UploadResult>();
    expect(result.filePath).toBe("Books/P/Ada Palmer/Ada Palmer - Sept redditions.epub");
    expect(existsSync(path.join(booksDirectory, "Books/P/Ada Palmer/Ada Palmer - Sept redditions.epub"))).toBe(true);
    expect(await readdir(uploadsDirectory)).toEqual([]);
    expect(rcloneCalls).toEqual([
      ["rclone", "copyto", path.join(booksDirectory, "Books/P/Ada Palmer/Ada Palmer - Sept redditions.epub"), "mega:Library/Books/P/Ada Palmer/Ada Palmer - Sept redditions.epub"],
    ]);
    expect(bookTitles()).toEqual(["Sept redditions"]);
    const book = await app.inject({ method: "GET", url: `/api/books/${result.bookId}` });
    expect(book.json()).toMatchObject({ title: "Sept redditions", authors: ["Ada Palmer"] });
    // A later upload of the same bytes is recognised.
    const again = await postFile("again.epub", await readFile(path.join(workDirectory, "incoming/x.epub")));
    expect(again.json<UploadPreview>().duplicates.map((d) => d.reason)).toEqual(["identical"]);
  });

  it("does not touch the remote when none is configured", async () => {
    await setup(null, {});
    const preview = await stage("x.epub", { title: "Dune", authors: ["Frank Herbert"] });

    expect((await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` })).statusCode).toBe(200);
    expect(rcloneCalls).toEqual([]);
  });

  it("keeps the file staged and reports the error when the remote copy fails", async () => {
    await setup("mega:Library", {});
    const preview = await stage("x.epub", { title: "Dune", authors: ["Frank Herbert"] });
    rcloneExitCode = 1;

    const response = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({ error: "remote_upload_failed", message: expect.stringContaining("quota exceeded") });
    expect(existsSync(path.join(booksDirectory, "Books/H/Frank Herbert/Frank Herbert - Dune.epub"))).toBe(false);
    expect(await readdir(uploadsDirectory)).toEqual([`${preview.id}.epub`]);
    expect(bookTitles()).toEqual([]);
    // Retrying once the remote is back works.
    rcloneExitCode = 0;
    expect((await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` })).statusCode).toBe(200);
    expect(bookTitles()).toEqual(["Dune"]);
  });

  it("refuses to overwrite a file already at the target path", async () => {
    await setup(null, { "Books/H/Frank Herbert/Frank Herbert - Dune.epub": { title: "Dune", authors: ["Frank Herbert"] } });
    const preview = await stage("x.epub", { title: "Dune", authors: ["Frank Herbert"], extra: "other bytes" });
    expect(preview.duplicates.map((d) => d.reason)).toEqual(["same-book"]);

    const response = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: "target_exists" });
  });

  it("answers 404 for an unknown or already confirmed upload", async () => {
    await setup(null, {});
    const preview = await stage("x.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` });

    const response = await app.inject({ method: "POST", url: `/api/uploads/${preview.id}/confirm` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: "unknown_upload" });
  });
});

describe("DELETE /api/uploads/:id", () => {
  it("drops the staged file", async () => {
    await setup(null, {});
    const preview = await stage("x.epub", { title: "Dune", authors: ["Frank Herbert"] });

    const response = await app.inject({ method: "DELETE", url: `/api/uploads/${preview.id}` });

    expect(response.statusCode).toBe(204);
    expect(await readdir(uploadsDirectory)).toEqual([]);
    expect((await app.inject({ method: "DELETE", url: `/api/uploads/${preview.id}` })).statusCode).toBe(404);
  });
});
