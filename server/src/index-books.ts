// Manual one-shot indexing until the sync job (rclone + index + cron) exists.
import { mkdir } from "node:fs/promises";
import { loadConfig } from "./config.js";
import { openLibraryDatabase } from "./db/database.js";
import { createLibraryStore } from "./db/library-store.js";
import { indexLibrary } from "./library/index-library.js";

const config = loadConfig();
await mkdir(config.dataDirectory, { recursive: true });

const database = openLibraryDatabase(config.databasePath);
try {
  const report = await indexLibrary({
    store: createLibraryStore(database),
    booksDirectory: config.booksDirectory,
    coversDirectory: config.coversDirectory,
  });
  console.log(
    `added ${report.added}, updated ${report.updated}, removed ${report.removed}, unchanged ${report.unchanged}, failed ${report.failures.length}`,
  );
  for (const failure of report.failures) {
    console.warn(`  ${failure.filePath}: ${failure.error}`);
  }
} finally {
  database.close();
}
