import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { backupDatabase } from "../src/backup/backup-database.js";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import type { CommandRunner } from "../src/sync/run-command.js";

let workDirectory: string;
let backupsDirectory: string;
let database: LibraryDatabase;
let calls: string[][];

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-backup-"));
  backupsDirectory = path.join(workDirectory, "backups");
  database = openLibraryDatabase(path.join(workDirectory, "library.sqlite"));
  database.prepare("INSERT INTO sync_runs (trigger, status, started_at) VALUES ('manual', 'succeeded', '2026-11-21T00:00:00Z')").run();
  calls = [];
});

afterEach(async () => {
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

const okRunner: CommandRunner = async (command, args) => {
  calls.push([command, ...args]);
  return { exitCode: 0, stderrTail: "" };
};

const at = (day: string) => () => new Date(`${day}T04:30:00Z`);

describe("backupDatabase", () => {
  it("writes a dated, openable copy of the database", async () => {
    const result = await backupDatabase({ database, backupsDirectory, keep: 7, rcloneRemote: null, runCommand: okRunner, now: at("2026-11-21") });

    expect(result).toEqual({ filePath: path.join(backupsDirectory, "library-2026-11-21.sqlite"), pruned: [], remoteError: null });
    const copy = new Database(result.filePath, { readonly: true });
    expect(copy.prepare("SELECT COUNT(*) AS n FROM sync_runs").get()).toEqual({ n: 1 });
    copy.close();
    expect(calls).toEqual([]);
  });

  it("keeps only the newest copies and leaves other files alone", async () => {
    await mkdir(backupsDirectory, { recursive: true });
    for (const day of ["2026-11-10", "2026-11-11", "2026-11-12"]) {
      await writeFile(path.join(backupsDirectory, `library-${day}.sqlite`), "old");
    }
    await writeFile(path.join(backupsDirectory, "notes.txt"), "keep me");

    const result = await backupDatabase({ database, backupsDirectory, keep: 2, rcloneRemote: null, runCommand: okRunner, now: at("2026-11-21") });

    expect(result.pruned).toEqual(["library-2026-11-11.sqlite", "library-2026-11-10.sqlite"]);
    expect((await readdir(backupsDirectory)).sort()).toEqual(["library-2026-11-12.sqlite", "library-2026-11-21.sqlite", "notes.txt"]);
  });

  it("mirrors the folder to the remote and reports an rclone failure without throwing", async () => {
    const ok = await backupDatabase({ database, backupsDirectory, keep: 7, rcloneRemote: "mega:_sauvegardes", runCommand: okRunner, now: at("2026-11-21") });
    expect(ok.remoteError).toBeNull();
    expect(calls).toEqual([["rclone", "sync", backupsDirectory, "mega:_sauvegardes", "--include", "library-*.sqlite"]]);

    const failing: CommandRunner = async () => ({ exitCode: 3, stderrTail: "quota exceeded" });
    const failed = await backupDatabase({ database, backupsDirectory, keep: 7, rcloneRemote: "mega:_sauvegardes", runCommand: failing, now: at("2026-11-21") });
    expect(failed.remoteError).toBe("rclone exited with code 3: quota exceeded");
  });
});
