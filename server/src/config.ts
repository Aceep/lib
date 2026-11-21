import path from "node:path";

export type ServerConfig = {
  port: number;
  host: string;
  booksDirectory: string;
  dataDirectory: string;
  databasePath: string;
  coversDirectory: string;
  /** Where uploaded EPUBs wait for confirmation. */
  uploadsDirectory: string;
  webDirectory: string;
  /** rclone source to mirror into the books directory, e.g. "mega:Livres". Null skips the pull. */
  rcloneRemote: string | null;
  /** rclone folder deleted books are moved to. Null when there is no remote. */
  rcloneTrash: string | null;
  /** Where deleted books go when the library has no remote. */
  trashDirectory: string;
  /** Cron pattern for automatic syncs, null when disabled. */
  syncCron: string | null;
  /** True when a reverse proxy sits in front: client address and protocol are then read from its headers. */
  trustProxy: boolean;
  /** Activity log entries older than this are deleted. */
  activityRetentionDays: number;
  /** Where daily copies of the database go. */
  backupsDirectory: string;
  /** Cron pattern for the daily database copy, null when disabled. */
  backupCron: string | null;
  /** Daily copies kept locally. */
  backupKeep: number;
  /** rclone folder the copies are mirrored to; null keeps them local. */
  rcloneBackupRemote: string | null;
  /** Account created on first start, when no user exists yet. Null once the variables are removed. */
  initialAdmin: { username: string; password: string } | null;
};

const DEFAULT_SYNC_CRON = "0 4 * * *";
// Half an hour after the sync, so the copy includes what it indexed.
const DEFAULT_BACKUP_CRON = "30 4 * * *";

function directoryFromEnvironment(environment: NodeJS.ProcessEnv, name: string, fallback: string): string {
  return path.resolve(environment[name]?.trim() || fallback);
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return 3000;
  }
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${rawPort}"`);
  }
  return port;
}

function parseCron(rawPattern: string | undefined, fallback: string): string | null {
  const pattern = rawPattern?.trim();
  if (pattern === undefined || pattern === "") {
    return fallback;
  }
  return pattern.toLowerCase() === "off" ? null : pattern;
}

function parseBackupKeep(rawKeep: string | undefined): number {
  if (!rawKeep?.trim()) {
    return 14;
  }
  const keep = Number(rawKeep);
  if (!Number.isInteger(keep) || keep < 1) {
    throw new Error(`BACKUP_KEEP must be a positive integer, got "${rawKeep}"`);
  }
  return keep;
}

/** "mega:Library" -> "mega:_sauvegardes": next to the library, outside what the sync mirrors. */
function defaultBackupRemote(remote: string): string {
  return siblingRemote(remote, "_sauvegardes");
}

function parseRetentionDays(rawDays: string | undefined): number {
  if (!rawDays?.trim()) {
    return 365;
  }
  const days = Number(rawDays);
  if (!Number.isInteger(days) || days < 1) {
    throw new Error(`ACTIVITY_RETENTION_DAYS must be a positive integer, got "${rawDays}"`);
  }
  return days;
}

function parseInitialAdmin(environment: NodeJS.ProcessEnv): ServerConfig["initialAdmin"] {
  const username = environment.ADMIN_USER?.trim();
  const password = environment.ADMIN_PASSWORD;
  return username && password ? { username, password } : null;
}

/** "mega:Library" + "_corbeille" -> "mega:_corbeille": a folder next to the library, where a sync of the library never looks. */
function siblingRemote(remote: string, name: string): string {
  const separator = remote.indexOf(":");
  if (separator === -1) {
    return path.posix.join(path.posix.dirname(remote), name);
  }
  const parent = path.posix.dirname(remote.slice(separator + 1));
  return `${remote.slice(0, separator + 1)}${parent === "." || parent === "/" ? "" : `${parent}/`}${name}`;
}

function defaultTrashRemote(remote: string): string {
  return siblingRemote(remote, "_corbeille");
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dataDirectory = directoryFromEnvironment(environment, "DATA_DIR", "data");
  const rcloneRemote = environment.RCLONE_REMOTE?.trim() || null;
  return {
    port: parsePort(environment.PORT),
    // Local-only by default: exposing the catalog is an explicit decision.
    host: environment.HOST?.trim() || "127.0.0.1",
    booksDirectory: directoryFromEnvironment(environment, "BOOKS_DIR", "books"),
    dataDirectory,
    databasePath: path.join(dataDirectory, "library.sqlite"),
    coversDirectory: path.join(dataDirectory, "covers"),
    uploadsDirectory: path.join(dataDirectory, "uploads"),
    webDirectory: directoryFromEnvironment(environment, "WEB_DIR", path.join(import.meta.dirname, "../../web/dist")),
    rcloneRemote,
    rcloneTrash: rcloneRemote ? environment.RCLONE_TRASH?.trim() || defaultTrashRemote(rcloneRemote) : null,
    trashDirectory: path.join(dataDirectory, "trash"),
    syncCron: parseCron(environment.SYNC_CRON, DEFAULT_SYNC_CRON),
    trustProxy: ["1", "true"].includes(environment.TRUST_PROXY?.trim().toLowerCase() ?? ""),
    activityRetentionDays: parseRetentionDays(environment.ACTIVITY_RETENTION_DAYS),
    backupsDirectory: path.join(dataDirectory, "backups"),
    backupCron: parseCron(environment.BACKUP_CRON, DEFAULT_BACKUP_CRON),
    backupKeep: parseBackupKeep(environment.BACKUP_KEEP),
    rcloneBackupRemote: rcloneRemote ? environment.RCLONE_BACKUP_REMOTE?.trim() || defaultBackupRemote(rcloneRemote) : null,
    initialAdmin: parseInitialAdmin(environment),
  };
}
