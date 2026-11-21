import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { LibraryDatabase } from "../db/database.js";
import type { CommandRunner } from "../sync/run-command.js";

export type BackupOptions = {
  database: LibraryDatabase;
  /** Local folder for the copies, e.g. DATA_DIR/backups. */
  backupsDirectory: string;
  /** How many daily copies to keep locally; older ones are deleted after each backup. */
  keep: number;
  /** rclone destination the copy is also pushed to, e.g. "mega:_sauvegardes". Null keeps it local. */
  rcloneRemote: string | null;
  runCommand: CommandRunner;
  now?: () => Date;
};

export type BackupResult = {
  filePath: string;
  /** Copies deleted locally to honour `keep`. */
  pruned: string[];
  /** Null when no remote is configured; otherwise the rclone error, if any. */
  remoteError: string | null;
};

const FILE_PATTERN = /^library-(\d{4}-\d{2}-\d{2})\.sqlite$/;

function fileNameFor(date: Date): string {
  return `library-${date.toISOString().slice(0, 10)}.sqlite`;
}

/**
 * Copies the library database with SQLite's online backup (safe while the app writes), keeps the last `keep`
 * daily files locally and mirrors the folder to the rclone remote when one is configured. The books themselves
 * already live on the remote; the database holds everything the app added on top (accounts, corrections, log).
 */
export async function backupDatabase(options: BackupOptions): Promise<BackupResult> {
  const { database, backupsDirectory, keep, rcloneRemote, runCommand, now = () => new Date() } = options;
  await mkdir(backupsDirectory, { recursive: true });
  const filePath = path.join(backupsDirectory, fileNameFor(now()));
  // A second run the same day simply refreshes that day's copy.
  await database.backup(filePath);

  const dated = (await readdir(backupsDirectory))
    .filter((name) => FILE_PATTERN.test(name))
    .sort()
    .reverse();
  const pruned = dated.slice(Math.max(keep, 1));
  for (const name of pruned) {
    await rm(path.join(backupsDirectory, name), { force: true });
  }

  let remoteError: string | null = null;
  if (rcloneRemote) {
    // sync, not copy: the remote folder follows the local retention instead of growing forever.
    const result = await runCommand("rclone", ["sync", backupsDirectory, rcloneRemote, "--include", "library-*.sqlite"]);
    if (result.exitCode !== 0) {
      remoteError = `rclone exited with code ${result.exitCode ?? "unknown"}: ${result.stderrTail.trim()}`;
    }
  }
  return { filePath, pruned, remoteError };
}
