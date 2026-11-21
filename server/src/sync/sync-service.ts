import { mkdir } from "node:fs/promises";
import type { LibraryDatabase } from "../db/database.js";
import type { LibraryStore } from "../db/library-store.js";
import { type IndexFailure, type IndexReport, indexLibrary } from "../library/index-library.js";
import type { CommandRunner } from "./run-command.js";

export type SyncTrigger = "manual" | "scheduled";

export type SyncRun = {
  id: number;
  trigger: SyncTrigger;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt: string | null;
  report: IndexReport | null;
  error: string | null;
};

export type SyncStatus = {
  current: SyncRun | null;
  lastFinished: SyncRun | null;
};

export type SyncServiceOptions = {
  database: LibraryDatabase;
  store: LibraryStore;
  booksDirectory: string;
  coversDirectory: string;
  /** rclone source such as "mega:Livres"; null indexes the books directory without pulling anything. */
  rcloneRemote: string | null;
  runCommand: CommandRunner;
  logError: (message: string, error: unknown) => void;
};

type SyncRunRow = {
  id: number;
  trigger: SyncTrigger;
  status: SyncRun["status"];
  started_at: string;
  finished_at: string | null;
  added: number | null;
  updated: number | null;
  removed: number | null;
  unchanged: number | null;
  failures_json: string | null;
  error: string | null;
};

function toSyncRun(row: SyncRunRow): SyncRun {
  const hasReport = row.added !== null && row.updated !== null && row.removed !== null && row.unchanged !== null;
  return {
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    report: hasReport
      ? {
          added: row.added ?? 0,
          updated: row.updated ?? 0,
          removed: row.removed ?? 0,
          unchanged: row.unchanged ?? 0,
          failures: JSON.parse(row.failures_json ?? "[]") as IndexFailure[],
        }
      : null,
    error: row.error,
  };
}

async function pullFromRemote(runCommand: CommandRunner, remote: string, booksDirectory: string): Promise<string | null> {
  const result = await runCommand("rclone", ["sync", remote, booksDirectory]);
  if (result.exitCode === 0) {
    return null;
  }
  return `rclone exited with code ${result.exitCode ?? "unknown"}: ${result.stderrTail.trim()}`;
}

export type SyncService = ReturnType<typeof createSyncService>;

export function createSyncService(options: SyncServiceOptions) {
  const { database, store, booksDirectory, coversDirectory, rcloneRemote, runCommand, logError } = options;

  const statements = {
    markInterrupted: database.prepare<[string]>(
      "UPDATE sync_runs SET status = 'failed', finished_at = ?, error = 'interrupted by a server restart' WHERE status = 'running'",
    ),
    insertRun: database.prepare<[SyncTrigger, string], SyncRunRow>(
      "INSERT INTO sync_runs (trigger, status, started_at) VALUES (?, 'running', ?) RETURNING *",
    ),
    finishRun: database.prepare<{
      id: number;
      status: "succeeded" | "failed";
      finishedAt: string;
      added: number | null;
      updated: number | null;
      removed: number | null;
      unchanged: number | null;
      failuresJson: string | null;
      error: string | null;
    }>(
      `UPDATE sync_runs SET status = @status, finished_at = @finishedAt, added = @added, updated = @updated,
         removed = @removed, unchanged = @unchanged, failures_json = @failuresJson, error = @error
       WHERE id = @id`,
    ),
    getRun: database.prepare<[number], SyncRunRow>("SELECT * FROM sync_runs WHERE id = ?"),
    lastFinished: database.prepare<[], SyncRunRow>(
      "SELECT * FROM sync_runs WHERE status != 'running' ORDER BY id DESC LIMIT 1",
    ),
  };

  // A run left "running" belongs to a process that died; nothing will ever finish it.
  statements.markInterrupted.run(new Date().toISOString());

  let currentRunId: number | null = null;
  let currentRunPromise: Promise<void> = Promise.resolve();

  async function execute(runId: number): Promise<void> {
    let pullError: string | null = null;
    let report: IndexReport | null = null;
    let indexError: string | null = null;

    try {
      await mkdir(booksDirectory, { recursive: true });
      if (rcloneRemote) {
        pullError = await pullFromRemote(runCommand, rcloneRemote, booksDirectory);
      }
    } catch (error) {
      pullError = (error as Error).message;
    }

    // Index even after a failed pull: rclone stops mid-way on quota errors, and what did arrive is usable.
    try {
      report = await indexLibrary({ store, booksDirectory, coversDirectory });
    } catch (error) {
      indexError = `indexing failed: ${(error as Error).message}`;
    }

    const error = [pullError, indexError].filter(Boolean).join("\n") || null;
    statements.finishRun.run({
      id: runId,
      status: error ? "failed" : "succeeded",
      finishedAt: new Date().toISOString(),
      added: report?.added ?? null,
      updated: report?.updated ?? null,
      removed: report?.removed ?? null,
      unchanged: report?.unchanged ?? null,
      failuresJson: report ? JSON.stringify(report.failures) : null,
      error,
    });
  }

  return {
    /** Starts a sync in the background. Returns null when one is already running. */
    start(trigger: SyncTrigger): SyncRun | null {
      if (currentRunId !== null) {
        return null;
      }
      const row = statements.insertRun.get(trigger, new Date().toISOString());
      if (!row) {
        throw new Error("Could not record the sync run");
      }
      currentRunId = row.id;
      currentRunPromise = execute(row.id)
        .catch((error: unknown) => logError(`Sync run ${row.id} crashed`, error))
        .finally(() => {
          currentRunId = null;
        });
      return toSyncRun(row);
    },

    getStatus(): SyncStatus {
      const currentRow = currentRunId === null ? undefined : statements.getRun.get(currentRunId);
      const lastFinishedRow = statements.lastFinished.get();
      return {
        current: currentRow ? toSyncRun(currentRow) : null,
        lastFinished: lastFinishedRow ? toSyncRun(lastFinishedRow) : null,
      };
    },

    /** Resolves once the running sync, if any, has finished. */
    whenIdle(): Promise<void> {
      return currentRunPromise;
    },
  };
}
