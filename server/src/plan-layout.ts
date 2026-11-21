// Read-only: proposes a "Books/<Letter>/<First Last>/<First Last> - <Title>.epub" path for every EPUB of a directory.
// Usage: npm run plan-layout -w server -- <books directory> <plan.json> <report.md> [overrides.json]
// The overrides file maps current paths to hand-picked targets, for EPUBs whose metadata are wrong (title and
// author swapped, "Unknown" author...).
import { readFileSync, writeFileSync } from "node:fs";
import { scanEpubFiles } from "./duplicates/find-duplicates.js";
import { type NamingDoubt, proposeName } from "./library/file-naming.js";

const [directory, planPath, reportPath, overridesPath] = process.argv.slice(2);
if (!directory || !planPath || !reportPath) {
  console.error("usage: plan-layout <books directory> <plan.json> <report.md> [overrides.json]");
  process.exit(2);
}

type PlanEntry = { from: string; to: string; doubts: NamingDoubt[]; overridden: boolean };

const overrides = new Map<string, string>(overridesPath ? Object.entries(JSON.parse(readFileSync(overridesPath, "utf8"))) : []);
const { files, failures } = await scanEpubFiles(directory);

const byTarget = new Map<string, PlanEntry[]>();
const entries: PlanEntry[] = [];
for (const file of files.filter((f) => f.title !== null).sort((a, b) => a.filePath.localeCompare(b.filePath, "fr"))) {
  const override = overrides.get(file.filePath);
  overrides.delete(file.filePath);
  const proposed = override ? { path: override, doubts: [] } : proposeName({ title: file.title!, authors: file.authors });
  const entry: PlanEntry = { from: file.filePath, to: proposed.path, doubts: [...proposed.doubts], overridden: override !== undefined };
  entries.push(entry);
  const key = proposed.path.toLowerCase();
  (byTarget.get(key) ?? byTarget.set(key, []).get(key)!).push(entry);
}

// Two files landing on the same name are almost always the same book with slightly different metadata.
const collisions = [...byTarget.values()].filter((group) => group.length > 1);
for (const group of collisions) {
  // A file already sitting at the target keeps its name; the newcomers get the suffix.
  group.sort((left, right) => Number(right.from === right.to) - Number(left.from === left.to));
  group.forEach((entry, index) => {
    entry.doubts.push("name-collision");
    if (index > 0) {
      entry.to = entry.to.replace(/\.epub$/, ` (${index + 1}).epub`);
    }
  });
}

const renames = entries.filter((entry) => entry.from !== entry.to);
const doubtful = renames.filter((entry) => entry.doubts.length > 0);
writeFileSync(planPath, JSON.stringify({ renames, unreadable: failures.map((f) => f.filePath) }, null, 2));

const arrow = (entry: PlanEntry) => `- \`${entry.from}\`\n  → \`${entry.to}\``;
const lines = [
  "# Plan de rangement de `mega:Library` (rien n'a été modifié)",
  "",
  `${files.length} EPUB analysés : ${renames.length} à renommer/déplacer, ${entries.length - renames.length} déjà au bon endroit, ${failures.length} illisibles laissés tels quels.`,
  "",
  "Format : `Books/<Lettre du nom>/<Prénom Nom>/<Prénom Nom - Titre>.epub`, d'après les métadonnées EPUB.",
  "",
  `## Collisions — ${collisions.length} groupes de fichiers qui tombent sur le même nom (doublons probables)`,
  "",
  ...collisions.map((group) => `- ${group.map((entry) => `\`${entry.from}\``).join(" et ")}\n  → \`${group[0]!.to.replace(/ \(\d+\)\.epub$/, ".epub")}\``),
  "",
  `## Exceptions manuelles — ${entries.filter((entry) => entry.overridden).length} fichiers aux métadonnées fausses, cibles fixées à la main`,
  "",
  ...entries.filter((entry) => entry.overridden).map(arrow),
  "",
  `## À relire — ${doubtful.filter((entry) => !entry.overridden).length} fichiers où la normalisation a dû deviner`,
  "",
  ...doubtful.filter((entry) => !entry.overridden).map((entry) => `- [${entry.doubts.join(", ")}] \`${entry.from}\`\n  → \`${entry.to}\``),
  "",
  `## Les ${renames.length - doubtful.length - entries.filter((entry) => entry.overridden && entry.doubts.length === 0).length} autres`,
  "",
  ...renames.filter((entry) => entry.doubts.length === 0 && !entry.overridden).map(arrow),
  "",
];
if (failures.length > 0) {
  lines.push("## Illisibles (non déplacés)", "", ...failures.map((f) => `- \`${f.filePath}\` : ${f.error}`), "");
}
if (overrides.size > 0) {
  lines.push("## Exceptions sans fichier correspondant (à corriger dans le fichier d'exceptions)", "", ...[...overrides.keys()].map((from) => `- \`${from}\``), "");
}
writeFileSync(reportPath, lines.join("\n"));
console.log(
  `${renames.length} renommages (${doubtful.length} à relire, ${collisions.length} collisions, ${entries.filter((e) => e.overridden).length} exceptions), ${entries.length - renames.length} inchangés, ${failures.length} illisibles, ${overrides.size} exceptions orphelines`,
);
