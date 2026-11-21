// Passe 1 (lecture seule) : doublons probables sur MEGA d'après le listing rclone (noms + tailles, pas d'empreintes).
import { readFileSync, writeFileSync } from "node:fs";

const [listing, output] = process.argv.slice(2);
const files = JSON.parse(readFileSync(listing, "utf8")).filter((f) => /\.epub$/i.test(f.Name));

const NOISE = /\(\d+\)|\(z-library\)|_bookys|french edition|\bcopie\b|\bcopy\b/g;
const normalize = (name) =>
  name
    .replace(/\.epub$/i, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(NOISE, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/ \d$/, ""); // "..._2" suffix
// Même sac de mots : "A_RETARDEMENT__FRANCK_THILLIEZ" ≈ "FRANCK_THILLIEZ__A_RETARDEMENT", "LANCON_PHILIPPE" ≈ "PHILIPPE_LANCON".
const wordKey = (name) => [...new Set(normalize(name).split(" "))].sort().join(" ");

const groupBy = (items, keyOf) => {
  const map = new Map();
  for (const item of items) {
    const key = keyOf(item);
    (map.get(key) ?? map.set(key, []).get(key)).push(item);
  }
  return [...map.values()].filter((g) => g.length > 1);
};

const fmt = (f) => `${f.Path} (${(f.Size / 1024).toFixed(0)} Ko)`;

// A. Même chemin exact : MEGA autorise deux fichiers de même nom dans un dossier.
// Le même nom peut exister en deux encodages Unicode (è précomposé ou non) : visuellement identiques.
const samePath = groupBy(files, (f) => f.Path.normalize("NFC"));
// B. Même taille exacte : quasi certainement le même fichier.
const sameSize = groupBy(files, (f) => f.Size);
const inSizeGroup = new Set(sameSize.flat().map((f) => f.Path));
// C. Même nom normalisé mais tailles différentes : même livre, fichier différent (à confirmer en local par titre/auteur).
const sameName = groupBy(files, (f) => wordKey(f.Name)).filter((g) => new Set(g.map((f) => f.Size)).size > 1);
// D. Fichier à la racine de Library/ dont le nom ne ressemble à rien dans Books/ : probablement un livre pas encore rangé, pas un doublon.
const rootOnly = files.filter((f) => f.Path.split("/").length === 2 && !sameName.flat().includes(f) && !inSizeGroup.has(f.Path));

const lines = [];
lines.push("# Doublons probables sur MEGA — passe 1 (listing seul, rien modifié)", "");
lines.push(`${files.length} EPUB listés. MEGA n'expose pas d'empreintes via rclone : seuls les noms et tailles sont comparés.`, "");
lines.push("Règle de lecture : le premier fichier de chaque groupe est celui proposé à garder (dans `Books/`, sans « (2) », le plus gros).", "");

const keepFirst = (g) =>
  [...g].sort(
    (a, b) =>
      (a.Path.startsWith("Library/Books/") ? 0 : 1) - (b.Path.startsWith("Library/Books/") ? 0 : 1) ||
      (/\(\d+\)|_\d\.epub$/i.test(a.Name) ? 1 : 0) - (/\(\d+\)|_\d\.epub$/i.test(b.Name) ? 1 : 0) ||
      b.Size - a.Size ||
      a.Path.length - b.Path.length,
  );

const section = (title, groups, note) => {
  lines.push(`## ${title} — ${groups.length} groupes, ${groups.reduce((s, g) => s + g.length - 1, 0)} fichiers en trop`, "");
  if (note) lines.push(note, "");
  for (const g of groups.sort((a, b) => a[0].Path.localeCompare(b[0].Path, "fr"))) {
    const [keep, ...others] = keepFirst(g);
    lines.push(`- garder  \`${fmt(keep)}\``);
    for (const o of others) lines.push(`  - doublon \`${fmt(o)}\``);
  }
  lines.push("");
};

section("A. Même chemin en double (particularité MEGA)", samePath, "`rclone dedupe` sait traiter ce cas ; sinon il faut passer par l'interface MEGA.");
section("B. Même taille exacte — quasi certainement identiques", sameSize);
section(
  "C. Même nom, tailles différentes — même livre sous deux fichiers",
  sameName,
  "Souvent quelques centaines d'octets d'écart : même EPUB re-sauvegardé avec d'autres métadonnées. À confirmer en local (titre + auteur) avant de trancher.",
);
lines.push(`## D. À la racine de \`Library/\` sans équivalent dans \`Books/\` — ${rootOnly.length} fichiers`, "");
lines.push("Probablement des livres pas encore rangés plutôt que des doublons ; la passe 2 (métadonnées) le confirmera.", "");
for (const f of rootOnly.sort((a, b) => a.Path.localeCompare(b.Path, "fr"))) lines.push(`- \`${fmt(f)}\``);
lines.push("");

const sizeOf = (groups) => groups.reduce((s, g) => s + keepFirst(g).slice(1).reduce((t, f) => t + f.Size, 0), 0);
lines.push("## Bilan", "");
lines.push(`- A + B : ${samePath.length + sameSize.length} groupes, ${((sizeOf(samePath) + sizeOf(sameSize)) / 1e6).toFixed(0)} Mo récupérables sans risque.`);
lines.push(`- C : ${sameName.length} groupes, ${(sizeOf(sameName) / 1e6).toFixed(0)} Mo si on ne garde qu'un fichier par livre.`);

writeFileSync(output, lines.join("\n"));
console.log(`A=${samePath.length} B=${sameSize.length} C=${sameName.length} D=${rootOnly.length}`);
