import { mkdir } from "node:fs/promises";
import { buildApp } from "./api/build-app.js";
import { createCatalogQueries } from "./catalog/catalog-queries.js";
import { loadConfig } from "./config.js";
import { openLibraryDatabase } from "./db/database.js";

const config = loadConfig();
await mkdir(config.dataDirectory, { recursive: true });

const database = openLibraryDatabase(config.databasePath);
const app = buildApp({
  catalog: createCatalogQueries(database),
  booksDirectory: config.booksDirectory,
  coversDirectory: config.coversDirectory,
  logger: true,
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await app.close();
    database.close();
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
