import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findDuplicates, formatReport } from "../src/duplicates/find-duplicates.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

let booksDirectory: string;

beforeEach(async () => {
  booksDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-duplicates-"));
});

afterEach(async () => {
  await rm(booksDirectory, { recursive: true, force: true });
});

type BookFixture = { title: string; authors: string[]; padding?: number };

async function writeBook(relativePath: string, book: BookFixture): Promise<string> {
  const filePath = path.join(booksDirectory, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [`<dc:title>${book.title}</dc:title>`, ...book.authors.map((a) => `<dc:creator>${a}</dc:creator>`)].join("");
  await writeEpub(filePath, [
    { path: "OEBPS/content.opf", content: opfDocument(metadata, "") },
    // Different bytes per edition, and optionally a larger file.
    { path: "OEBPS/notes.txt", content: `${relativePath}${"x".repeat(book.padding ?? 0)}` },
  ]);
  return filePath;
}

async function copyBook(sourceRelativePath: string, targetRelativePath: string): Promise<void> {
  const target = path.join(booksDirectory, targetRelativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(booksDirectory, sourceRelativePath), target);
}

function groupPaths(group: { keep: { filePath: string }; others: { filePath: string }[] }) {
  return { keep: group.keep.filePath, others: group.others.map((file) => file.filePath) };
}

describe("findDuplicates", () => {
  it("reports nothing when every book is distinct", async () => {
    await writeBook("Dune.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await writeBook("Verne/Vingt mille lieues.epub", { title: "Vingt mille lieues", authors: ["Jules Verne"] });

    const report = await findDuplicates(booksDirectory);

    expect(report).toEqual({ scanned: 2, groups: [], failures: [] });
  });

  it("groups byte-identical files and keeps the one without a copy marker", async () => {
    await writeBook("Dune.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await copyBook("Dune.epub", "Téléchargements/Dune (1).epub");
    await copyBook("Dune.epub", "Téléchargements/Dune - copie.epub");

    const report = await findDuplicates(booksDirectory);

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]!.kind).toBe("identical");
    expect(groupPaths(report.groups[0]!)).toEqual({
      keep: "Dune.epub",
      others: ["Téléchargements/Dune (1).epub", "Téléchargements/Dune - copie.epub"],
    });
  });

  it("matches the same book across editions on accent-insensitive title and authors, keeping the larger file", async () => {
    await writeBook("petit.epub", { title: "Le Petit Prince", authors: ["Antoine de Saint-Exupéry"] });
    await writeBook("Saint-Exupery/Le petit prince.epub", { title: "LE PETIT PRINCE", authors: ["antoine de saint-exupery"], padding: 500 });

    const report = await findDuplicates(booksDirectory);

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]!.kind).toBe("same-book");
    expect(groupPaths(report.groups[0]!)).toEqual({ keep: "Saint-Exupery/Le petit prince.epub", others: ["petit.epub"] });
  });

  it("does not match books that share a title but not the authors", async () => {
    await writeBook("a.epub", { title: "Histoires", authors: ["Auteur Un"] });
    await writeBook("b.epub", { title: "Histoires", authors: ["Auteur Deux"] });
    await writeBook("c.epub", { title: "Histoires", authors: ["Auteur Deux", "Auteur Un"], padding: 100 });
    await writeBook("d.epub", { title: "Histoires", authors: ["Auteur Un", "Auteur Deux"] });

    const report = await findDuplicates(booksDirectory);

    expect(report.groups.map(groupPaths)).toEqual([{ keep: "c.epub", others: ["d.epub"] }]);
  });

  it("lists identical copies and other editions as separate groups", async () => {
    await writeBook("Dune.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await copyBook("Dune.epub", "Dune (1).epub");
    await writeBook("Dune - autre édition.epub", { title: "Dune", authors: ["Frank Herbert"], padding: 200 });

    const report = await findDuplicates(booksDirectory);

    expect(report.groups.map((group) => [group.kind, groupPaths(group)])).toEqual([
      ["identical", { keep: "Dune.epub", others: ["Dune (1).epub"] }],
      ["same-book", { keep: "Dune - autre édition.epub", others: ["Dune.epub"] }],
    ]);
  });

  it("still matches an unreadable file against its identical copy and reports the failure", async () => {
    await writeFile(path.join(booksDirectory, "broken.epub"), "not a zip");
    await writeFile(path.join(booksDirectory, "broken (1).epub"), "not a zip");

    const report = await findDuplicates(booksDirectory);

    expect(report.failures.map((failure) => failure.filePath)).toEqual(["broken (1).epub", "broken.epub"]);
    expect(report.groups.map(groupPaths)).toEqual([{ keep: "broken.epub", others: ["broken (1).epub"] }]);
  });

  it("formats a readable report", async () => {
    await writeBook("Dune.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await copyBook("Dune.epub", "Dune (1).epub");

    const text = formatReport(await findDuplicates(booksDirectory));

    expect(text).toContain("2 EPUB analysés, 1 groupes, 1 doublons proposés");
    expect(text).toContain("## Dune — Frank Herbert (fichiers identiques)");
    expect(text).toContain("garder   Dune.epub");
    expect(text).toContain("doublon  Dune (1).epub");
  });
});
