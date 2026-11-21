import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { buildApp } from "./api/build-app.js";
import { createCatalogQueries } from "./catalog/catalog-queries.js";
import { loadConfig } from "./config.js";
import { openLibraryDatabase } from "./db/database.js";
import { createLibraryStore } from "./db/library-store.js";
import { runCommand } from "./sync/run-command.js";
import { scheduleSync } from "./sync/schedule-sync.js";
import { createSyncService } from "./sync/sync-service.js";

const config = loadConfig();
await mkdir(config.dataDirectory, { recursive: true });

const database = openLibraryDatabase(config.databasePath);
let logError: (message: string, error: unknown) => void = (message, error) => console.error(message, error);

const sync = createSyncService({
  database,
  store: createLibraryStore(database),
  booksDirectory: config.booksDirectory,
  coversDirectory: config.coversDirectory,
  rcloneRemote: config.rcloneRemote,
  runCommand,
  logError: (message, error) => logError(message, error),
});
const schedule = config.syncCron ? scheduleSync(config.syncCron, sync) : null;

const app = buildApp({
  catalog: createCatalogQueries(database),
  sync,
  nextScheduledSyncAt: () => schedule?.nextRunAt() ?? null,
  booksDirectory: config.booksDirectory,
  coversDirectory: config.coversDirectory,
  // In dev the front end is served by Vite, and web/dist may not exist yet.
  webDirectory: existsSync(config.webDirectory) ? config.webDirectory : null,
  logger: true,
});
logError = (message, error) => app.log.error({ err: error }, message);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    schedule?.stop();
    await app.close();
    // Not waiting for a running sync: a first MEGA pull can take hours. It is marked interrupted on next start.
    database.close();
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
app.log.info(
  { rcloneRemote: config.rcloneRemote, syncCron: config.syncCron, nextSyncAt: schedule?.nextRunAt() ?? null },
  "sync configuration",
);
