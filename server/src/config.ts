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
  /** Cron pattern for automatic syncs, null when disabled. */
  syncCron: string | null;
};

const DEFAULT_SYNC_CRON = "0 4 * * *";

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

function parseSyncCron(rawPattern: string | undefined): string | null {
  const pattern = rawPattern?.trim();
  if (pattern === undefined || pattern === "") {
    return DEFAULT_SYNC_CRON;
  }
  return pattern.toLowerCase() === "off" ? null : pattern;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dataDirectory = directoryFromEnvironment(environment, "DATA_DIR", "data");
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
    rcloneRemote: environment.RCLONE_REMOTE?.trim() || null,
    syncCron: parseSyncCron(environment.SYNC_CRON),
  };
}
