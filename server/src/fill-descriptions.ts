// Looks up, online, a summary for the books whose EPUB carries none, and records it in the database.
// Usage: npm run descriptions -w server [-- --limit 200]
// Reads the same environment as the server (DATA_DIR, GOOGLE_BOOKS_API_KEY).
import { loadConfig } from "./config.js";
import { openLibraryDatabase } from "./db/database.js";
import { createLibraryStore } from "./db/library-store.js";
import { createDescriptionSources } from "./descriptions/description-sources.js";
import { createDescriptionFiller } from "./descriptions/fill-descriptions.js";

const args = process.argv.slice(2);
const limitIndex = args.indexOf("--limit");
const limit = limitIndex === -1 ? 50 : Number(args[limitIndex + 1]);
if (!Number.isInteger(limit) || limit < 1) {
  console.error("usage: fill-descriptions [--limit <count>]");
  process.exit(2);
}

const config = loadConfig();
const database = openLibraryDatabase(config.databasePath);
const store = createLibraryStore(database);
const filler = createDescriptionFiller({ store, sources: createDescriptionSources({ googleBooksApiKey: config.googleBooksApiKey }) });

console.log(`${filler.countMissing()} livres sans résumé, ${limit} au plus seront cherchés`);
const report = await filler.fillMissing({ limit });
for (const book of report.found) {
  console.log(`trouvé (${book.provider}) : ${book.title}`);
}
for (const book of report.notFound) {
  console.log(`rien : ${book.title}`);
}
console.log(
  `${report.found.length} résumés trouvés, ${report.notFound.length} introuvables, ${report.postponed.length} reportés (source en panne), ${report.remaining} livres toujours sans résumé`,
);
for (const error of report.sourceErrors) {
  console.error(`source en panne : ${error}`);
}
if (report.stoppedBecause) {
  console.error(`arrêt anticipé : ${report.stoppedBecause}`);
}
database.close();
process.exit(report.stoppedBecause ? 1 : 0);
