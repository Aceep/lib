// Passe 2 : à partir du JSON de `npm run duplicates -w server -- --json <books>`, produit le rapport Markdown
// et la liste des fichiers à déplacer vers `_doublons` (pour `rclone move --files-from`). Ne touche pas à MEGA.
import { readFileSync, writeFileSync } from "node:fs";

const [jsonPath, textPath, reportPath, moveListPath] = process.argv.slice(2);
const report = JSON.parse(readFileSync(jsonPath, "utf8"));
const textReport = readFileSync(textPath, "utf8");

const toMove = report.groups.flatMap((g) => g.others.map((f) => f.filePath)).sort((a, b) => a.localeCompare(b, "fr"));
writeFileSync(moveListPath, `${toMove.join("\n")}\n`);

const sizeSpread = (g) => {
  const sizes = [g.keep, ...g.others].map((f) => f.fileSize);
  return (Math.max(...sizes) - Math.min(...sizes)) / Math.max(...sizes);
};
const sameBook = report.groups.filter((g) => g.kind === "same-book");
const toReview = sameBook.filter((g) => sizeSpread(g) >= 0.1);
const ko = (f) => `\`${f.filePath}\` (${Math.round(f.fileSize / 1024)} Ko)`;

const lines = [
  "# Doublons sur MEGA — passe 2 (contenu + métadonnées, en local)",
  "",
  "Produit par `npm run duplicates -w server -- <dossier books>` sur la copie locale de `mega:Library` (2026-11-21). Rien n'a été modifié sur MEGA.",
  "",
  "- **fichiers identiques** : même SHA-256, donc strictement le même fichier.",
  `- **même titre et auteurs** : métadonnées EPUB identiques (insensible casse/accents), fichiers différents. Dans ${sameBook.length - toReview.length} groupes sur ${sameBook.length}, l'écart de taille est < 10 % : même EPUB re-sauvegardé.`,
  "- Fichier proposé à garder : sans marqueur de copie (`(2)`, `copie`), puis le plus gros, puis le chemin le plus court.",
  `- Liste des ${toMove.length} fichiers à déplacer : \`data/doublons-a-deplacer.txt\` (ignoré par git).`,
  "",
  `## À regarder à la main — ${toReview.length} groupes où les fichiers diffèrent de plus de 10 % (édition différente, images incluses ou non)`,
  "",
  ...toReview.map((g) => `- ${g.label} : ${[g.keep, ...g.others].map(ko).join(", ")}`),
  "",
  "## Liste complète",
  "",
  "```",
  textReport.trimEnd(),
  "```",
  "",
];
writeFileSync(reportPath, lines.join("\n"));
console.log(`à déplacer : ${toMove.length} | groupes > 10 % : ${toReview.length}`);
