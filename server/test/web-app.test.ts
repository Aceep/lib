import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { createSyncService } from "../src/sync/sync-service.js";

let workDirectory: string;
let database: LibraryDatabase;
let app: FastifyInstance;

const INDEX_HTML = "<!doctype html><div id=root></div>";

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-web-"));
  const webDirectory = path.join(workDirectory, "dist");
  await mkdir(path.join(webDirectory, "assets"), { recursive: true });
  await writeFile(path.join(webDirectory, "index.html"), INDEX_HTML);
  await writeFile(path.join(webDirectory, "assets", "app.js"), "console.log('app')");
  database = openLibraryDatabase(":memory:");
  const booksDirectory = path.join(workDirectory, "books");
  const coversDirectory = path.join(workDirectory, "covers");
  app = buildApp({
    catalog: createCatalogQueries(database),
    sync: createSyncService({
      database,
      store: createLibraryStore(database),
      booksDirectory,
      coversDirectory,
      rcloneRemote: null,
      runCommand: async () => ({ exitCode: 0, stderrTail: "" }),
      logError: () => {},
    }),
    nextScheduledSyncAt: () => null,
    booksDirectory,
    coversDirectory,
    webDirectory,
  });
});

afterEach(async () => {
  await app.close();
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

describe("serving the web app", () => {
  it("serves built assets", async () => {
    const response = await app.inject({ method: "GET", url: "/assets/app.js" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("console.log('app')");
  });

  it("serves index.html at the root", async () => {
    const response = await app.inject({ method: "GET", url: "/" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(INDEX_HTML);
  });

  it("serves index.html for client-side routes", async () => {
    const response = await app.inject({ method: "GET", url: "/books/42" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(INDEX_HTML);
  });

  it("keeps answering JSON 404 for unknown API routes", async () => {
    const response = await app.inject({ method: "GET", url: "/api/nope" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: "not_found" });
  });
});
