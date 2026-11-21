// Read-only report of duplicate EPUBs in the local library. Usage: npm run duplicates -w server [-- --json] [directory]
import { loadConfig } from "./config.js";
import { findDuplicates, formatReport } from "./duplicates/find-duplicates.js";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const directory = args.find((arg) => !arg.startsWith("--")) ?? loadConfig().booksDirectory;

const report = await findDuplicates(directory);
console.log(asJson ? JSON.stringify(report, null, 2) : formatReport(report));
