import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/api/build-app.js";
import { createCatalogQueries } from "../src/catalog/catalog-queries.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { type CommandResult, type CommandRunner, CommandNotFoundError, runCommand } from "../src/sync/run-command.js";
import { type SyncService, createSyncService } from "../src/sync/sync-service.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let database: LibraryDatabase;

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-sync-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  database = openLibraryDatabase(path.join(workDirectory, "library.sqlite"));
});

afterEach(async () => {
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

async function writeBook(fileName: string, title: string) {
  await mkdir(booksDirectory, { recursive: true });
  await writeEpub(path.join(booksDirectory, fileName), [
    { path: "OEBPS/content.opf", content: opfDocument(`<dc:title>${title}</dc:title>`, "") },
  ]);
}

type RecordedCall = { command: string; args: string[] };

/** Stands in for rclone: records the call, optionally "downloads" a book, then answers with the given result. */
function fakeRclone(result: CommandResult, onRun: () => Promise<void> = async () => {}) {
  const calls: RecordedCall[] = [];
  const runner: CommandRunner = async (command, args) => {
    calls.push({ command, args });
    await onRun();
    return result;
  };
  return { runner, calls };
}

function createSync(runner: CommandRunner, rcloneRemote: string | null = "mega:Livres", logged: unknown[] = []): SyncService {
  return createSyncService({
    database,
    store: createLibraryStore(database),
    booksDirectory,
    coversDirectory,
    rcloneRemote,
    runCommand: runner,
    logError: (_message, error) => logged.push(error),
  });
}

async function runToCompletion(sync: SyncService) {
  const started = sync.start("manual");
  await sync.whenIdle();
  return { started, finished: sync.getStatus().lastFinished };
}

describe("sync service", () => {
  it("mirrors the remote into the books directory with rclone sync", async () => {
    const { runner, calls } = fakeRclone({ exitCode: 0, stderrTail: "" });

    await runToCompletion(createSync(runner));

    expect(calls).toEqual([{ command: "rclone", args: ["sync", "mega:Livres", booksDirectory] }]);
  });

  it("indexes the books pulled by rclone and reports a success", async () => {
    const { runner } = fakeRclone({ exitCode: 0, stderrTail: "" }, () => writeBook("dune.epub", "Dune"));

    const { finished } = await runToCompletion(createSync(runner));

    expect(finished).toMatchObject({ status: "succeeded", trigger: "manual", error: null, report: { added: 1, failures: [] } });
    expect(finished?.finishedAt).toEqual(expect.any(String));
  });

  it("skips rclone and only indexes when no remote is configured", async () => {
    await writeBook("dune.epub", "Dune");
    const { runner, calls } = fakeRclone({ exitCode: 0, stderrTail: "" });

    const { finished } = await runToCompletion(createSync(runner, null));

    expect(calls).toEqual([]);
    expect(finished).toMatchObject({ status: "succeeded", report: { added: 1 } });
  });

  it("still indexes what arrived when rclone fails, and reports the rclone error", async () => {
    const { runner } = fakeRclone({ exitCode: 7, stderrTail: "Transfer quota exceeded\n" }, () => writeBook("dune.epub", "Dune"));

    const { finished } = await runToCompletion(createSync(runner));

    expect(finished).toMatchObject({
      status: "failed",
      error: "rclone exited with code 7: Transfer quota exceeded",
      report: { added: 1 },
    });
  });

  it("reports a missing rclone binary clearly", async () => {
    const runner: CommandRunner = async (command) => {
      throw new CommandNotFoundError(command);
    };

    const { finished } = await runToCompletion(createSync(runner));

    expect(finished).toMatchObject({ status: "failed", error: '"rclone" is not installed or not on PATH' });
  });

  it("refuses to start a second sync while one is running", async () => {
    let releaseRclone: () => void = () => {};
    const rcloneHeld = new Promise<void>((resolve) => {
      releaseRclone = resolve;
    });
    const { runner } = fakeRclone({ exitCode: 0, stderrTail: "" }, () => rcloneHeld);
    const sync = createSync(runner);

    const first = sync.start("manual");
    const second = sync.start("scheduled");
    const statusWhileRunning = sync.getStatus();
    releaseRclone();
    await sync.whenIdle();

    expect(first).toMatchObject({ status: "running" });
    expect(second).toBeNull();
    expect(statusWhileRunning.current?.id).toBe(first?.id);
    expect(sync.getStatus().current).toBeNull();
  });

  it("accepts a new sync once the previous one has finished", async () => {
    const { runner } = fakeRclone({ exitCode: 0, stderrTail: "" });
    const sync = createSync(runner);
    await runToCompletion(sync);

    const { started } = await runToCompletion(sync);

    expect(started).not.toBeNull();
  });

  it("marks a run left running by a crashed process as interrupted", async () => {
    database.prepare("INSERT INTO sync_runs (trigger, status, started_at) VALUES ('scheduled', 'running', '2026-01-01T00:00:00Z')").run();

    const sync = createSync(fakeRclone({ exitCode: 0, stderrTail: "" }).runner);

    expect(sync.getStatus().lastFinished).toMatchObject({ status: "failed", error: "interrupted by a server restart" });
  });
});

describe("runCommand", () => {
  it("returns the exit code and the stderr output", async () => {
    const result = await runCommand(process.execPath, ["-e", "process.stderr.write('boom'); process.exit(3)"]);

    expect(result).toEqual({ exitCode: 3, stderrTail: "boom" });
  });

  it("rejects with CommandNotFoundError for an unknown binary", async () => {
    await expect(runCommand("kyle-lib-no-such-binary", [])).rejects.toBeInstanceOf(CommandNotFoundError);
  });
});

describe("sync routes", () => {
  let app: FastifyInstance;
  let sync: SyncService;
  const nextScheduledAt = new Date("2026-12-01T04:00:00.000Z");

  beforeEach(() => {
    sync = createSync(fakeRclone({ exitCode: 0, stderrTail: "" }).runner);
    app = buildApp({
      catalog: createCatalogQueries(database),
      sync,
      nextScheduledSyncAt: () => nextScheduledAt,
      booksDirectory,
      coversDirectory,
    });
  });

  afterEach(async () => {
    await sync.whenIdle();
    await app.close();
  });

  it("starts a manual sync and answers 202 with the run", async () => {
    const response = await app.inject({ method: "POST", url: "/api/sync" });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({ trigger: "manual", status: "running" });
  });

  it("answers 409 when a sync is already running", async () => {
    await app.inject({ method: "POST", url: "/api/sync" });

    const response = await app.inject({ method: "POST", url: "/api/sync" });

    expect(response.statusCode).toBe(409);
  });

  it("reports the last finished run and the next scheduled one", async () => {
    await app.inject({ method: "POST", url: "/api/sync" });
    await sync.whenIdle();

    const response = await app.inject({ method: "GET", url: "/api/sync" });

    expect(response.json()).toMatchObject({
      current: null,
      lastFinished: { status: "succeeded", trigger: "manual" },
      nextScheduledAt: "2026-12-01T04:00:00.000Z",
    });
  });
});
