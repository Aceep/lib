import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { buildApp } from "./api/build-app.js";
import { createActivityLog } from "./activity/activity-log.js";
import { createBookAdmin } from "./admin/book-admin.js";
import { createLibraryStatsQueries } from "./admin/library-stats.js";
import { createLibraryHealthQueries } from "./admin/library-health.js";
import { createAuthService } from "./auth/auth-service.js";
import { scheduleBackup } from "./backup/schedule-backup.js";
import { createBookRequests } from "./requests/book-requests.js";
import { createBibliographySources } from "./missing/bibliography-sources.js";
import { createMissingBooks } from "./missing/missing-books.js";
import { createCatalogQueries } from "./catalog/catalog-queries.js";
import { loadConfig } from "./config.js";
import { openLibraryDatabase } from "./db/database.js";
import { createLibraryStore } from "./db/library-store.js";
import { runCommand } from "./sync/run-command.js";
import { scheduleSync } from "./sync/schedule-sync.js";
import { createSyncService } from "./sync/sync-service.js";
import { createUploadService } from "./uploads/upload-service.js";

const config = loadConfig();
await mkdir(config.dataDirectory, { recursive: true });

const database = openLibraryDatabase(config.databasePath);
const store = createLibraryStore(database);
let logError: (message: string, error: unknown) => void = (message, error) => console.error(message, error);

const sync = createSyncService({
  database,
  store,
  booksDirectory: config.booksDirectory,
  coversDirectory: config.coversDirectory,
  rcloneRemote: config.rcloneRemote,
  runCommand,
  logError: (message, error) => logError(message, error),
});
const schedule = config.syncCron ? scheduleSync(config.syncCron, sync) : null;
const uploads = await createUploadService({
  database,
  store,
  booksDirectory: config.booksDirectory,
  coversDirectory: config.coversDirectory,
  uploadsDirectory: config.uploadsDirectory,
  rcloneRemote: config.rcloneRemote,
  runCommand,
});

const auth = await createAuthService({ database });
let createdInitialAdmin = false;
if (!auth.hasUsers() && config.initialAdmin) {
  await auth.createUser(config.initialAdmin.username, config.initialAdmin.password, "admin");
  createdInitialAdmin = true;
}

const activity = createActivityLog({ database });
activity.purgeOlderThan(config.activityRetentionDays);
// The server stays up for months: purge daily, not only at start.
const activityPurge = setInterval(() => activity.purgeOlderThan(config.activityRetentionDays), 24 * 60 * 60 * 1000);
activityPurge.unref();

const app = buildApp({
  catalog: createCatalogQueries(database),
  auth,
  activity,
  health: createLibraryHealthQueries(database),
  stats: createLibraryStatsQueries({ database }),
  requests: createBookRequests({ database }),
  missing: createMissingBooks({ database, sources: createBibliographySources() }),
  books: createBookAdmin({
    store,
    booksDirectory: config.booksDirectory,
    coversDirectory: config.coversDirectory,
    localTrashDirectory: config.trashDirectory,
    rcloneRemote: config.rcloneRemote,
    rcloneTrash: config.rcloneTrash,
    runCommand,
  }),
  trustProxy: config.trustProxy,
  sync,
  uploads,
  nextScheduledSyncAt: () => schedule?.nextRunAt() ?? null,
  booksDirectory: config.booksDirectory,
  coversDirectory: config.coversDirectory,
  // In dev the front end is served by Vite, and web/dist may not exist yet.
  webDirectory: existsSync(config.webDirectory) ? config.webDirectory : null,
  logger: true,
});
logError = (message, error) => app.log.error({ err: error }, message);

const backupSchedule = config.backupCron
  ? scheduleBackup(
      config.backupCron,
      { database, backupsDirectory: config.backupsDirectory, keep: config.backupKeep, rcloneRemote: config.rcloneBackupRemote, runCommand },
      {
        info: (result) => {
          if (result.remoteError) {
            app.log.warn({ filePath: result.filePath, remoteError: result.remoteError }, "database backed up locally but the remote copy failed");
          } else {
            app.log.info({ filePath: result.filePath, pruned: result.pruned }, "database backed up");
          }
        },
        error: (error) => logError("database backup failed", error),
      },
    )
  : null;

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    schedule?.stop();
    backupSchedule?.stop();
    await app.close();
    // Not waiting for a running sync: a first MEGA pull can take hours. It is marked interrupted on next start.
    database.close();
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
app.log.info(
  { rcloneRemote: config.rcloneRemote, rcloneTrash: config.rcloneTrash, syncCron: config.syncCron, nextSyncAt: schedule?.nextRunAt() ?? null },
  "sync configuration",
);
app.log.info(
  { backupCron: config.backupCron, backupsDirectory: config.backupsDirectory, keep: config.backupKeep, remote: config.rcloneBackupRemote, nextBackupAt: backupSchedule?.nextRunAt() ?? null },
  "backup configuration",
);
if (createdInitialAdmin) {
  app.log.info({ username: config.initialAdmin?.username }, "created the initial admin account; ADMIN_PASSWORD can now be removed from the environment");
} else if (!auth.hasUsers()) {
  app.log.warn("no user account exists: set ADMIN_USER and ADMIN_PASSWORD (12 characters or more) and restart to create the first admin");
}
