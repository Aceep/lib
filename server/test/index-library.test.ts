import { mkdir, mkdtemp, readdir, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type LibraryDatabase, openLibraryDatabase } from "../src/db/database.js";
import { createLibraryStore } from "../src/db/library-store.js";
import { indexLibrary } from "../src/library/index-library.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

let workDirectory: string;
let booksDirectory: string;
let coversDirectory: string;
let database: LibraryDatabase;

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-index-"));
  booksDirectory = path.join(workDirectory, "books");
  coversDirectory = path.join(workDirectory, "covers");
  await mkdir(booksDirectory);
  database = openLibraryDatabase(":memory:");
});

afterEach(async () => {
  database.close();
  await rm(workDirectory, { recursive: true, force: true });
});

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type BookFixture = { title: string; authors: string[]; language?: string; withCover?: boolean };

async function writeBook(relativePath: string, book: BookFixture, modifiedAt = new Date("2026-01-01T00:00:00Z")) {
  const filePath = path.join(booksDirectory, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  const metadata = [
    `<dc:title>${book.title}</dc:title>`,
    ...book.authors.map((author) => `<dc:creator>${author}</dc:creator>`),
    book.language ? `<dc:language>${book.language}</dc:language>` : "",
  ].join("");
  const manifest = book.withCover ? `<item id="c" href="cover.png" media-type="image/png" properties="cover-image"/>` : "";
  await writeEpub(filePath, [
    { path: "OEBPS/content.opf", content: opfDocument(metadata, manifest) },
    ...(book.withCover ? [{ path: "OEBPS/cover.png", content: PNG_BYTES }] : []),
  ]);
  await utimes(filePath, modifiedAt, modifiedAt);
}

function runIndex() {
  return indexLibrary({ store: createLibraryStore(database), booksDirectory, coversDirectory });
}

function bookTitles(): string[] {
  return database.prepare<[], { title: string }>("SELECT title FROM books ORDER BY title").all().map((row) => row.title);
}

function authorNames(): string[] {
  return database.prepare<[], { name: string }>("SELECT name FROM authors ORDER BY name").all().map((row) => row.name);
}

function searchTitles(query: string): string[] {
  return database
    .prepare<[string], { title: string }>(
      "SELECT books.title FROM books_fts JOIN books ON books.id = books_fts.rowid WHERE books_fts MATCH ? ORDER BY books.title",
    )
    .all(query)
    .map((row) => row.title);
}

describe("indexLibrary", () => {
  it("adds every EPUB found in nested folders, whatever the extension case", async () => {
    await writeBook("Verne/Vingt mille lieues.epub", { title: "Vingt mille lieues", authors: ["Jules Verne"] });
    await writeBook("Dune.EPUB", { title: "Dune", authors: ["Frank Herbert"] });
    await writeFile(path.join(booksDirectory, "notes.txt"), "ignored");

    const report = await runIndex();

    expect(report).toMatchObject({ added: 2, updated: 0, removed: 0, unchanged: 0, failures: [] });
    expect(bookTitles()).toEqual(["Dune", "Vingt mille lieues"]);
  });

  it("stores paths relative to the books directory with forward slashes", async () => {
    await writeBook("Verne/Voyages/Le Tour du monde.epub", { title: "Le Tour du monde", authors: [] });

    await runIndex();

    const row = database.prepare<[], { file_path: string }>("SELECT file_path FROM books").get();
    expect(row?.file_path).toBe("Verne/Voyages/Le Tour du monde.epub");
  });

  it("links authors in their original order", async () => {
    await writeBook("good-omens.epub", { title: "Good Omens", authors: ["Terry Pratchett", "Neil Gaiman"] });

    await runIndex();

    const authors = database
      .prepare<[], { name: string }>(
        "SELECT authors.name FROM book_authors JOIN authors ON authors.id = book_authors.author_id ORDER BY position",
      )
      .all()
      .map((row) => row.name);
    expect(authors).toEqual(["Terry Pratchett", "Neil Gaiman"]);
  });

  it("writes the cover to the covers directory and records its file name", async () => {
    await writeBook("book.epub", { title: "T", authors: [], withCover: true });

    await runIndex();

    const row = database.prepare<[], { id: number; cover_file: string | null }>("SELECT id, cover_file FROM books").get();
    expect(row?.cover_file).toBe(`${row?.id}.png`);
    expect(await readdir(coversDirectory)).toEqual([`${row?.id}.png`]);
  });

  it("skips files whose size and modification time did not change", async () => {
    await writeBook("dune.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await runIndex();

    const report = await runIndex();

    expect(report).toMatchObject({ added: 0, updated: 0, unchanged: 1 });
  });

  it("re-reads a modified file and replaces its metadata", async () => {
    await writeBook("dune.epub", { title: "Dune", authors: ["F. Herbert"] });
    await runIndex();
    await writeBook("dune.epub", { title: "Dune (édition révisée)", authors: ["Frank Herbert"] }, new Date("2026-02-01T00:00:00Z"));

    const report = await runIndex();

    expect(report.updated).toBe(1);
    expect(bookTitles()).toEqual(["Dune (édition révisée)"]);
    expect(authorNames()).toEqual(["Frank Herbert"]);
  });

  it("removes books, covers and orphan authors when files disappear", async () => {
    await writeBook("dune.epub", { title: "Dune", authors: ["Frank Herbert"], withCover: true });
    await runIndex();
    await rm(path.join(booksDirectory, "dune.epub"));

    const report = await runIndex();

    expect(report.removed).toBe(1);
    expect(bookTitles()).toEqual([]);
    expect(authorNames()).toEqual([]);
    expect(await readdir(coversDirectory)).toEqual([]);
  });

  it("reports an invalid file without parsing it again until it changes", async () => {
    const brokenPath = path.join(booksDirectory, "broken.epub");
    await writeFile(brokenPath, "not a zip");
    await utimes(brokenPath, new Date("2026-01-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z"));

    const firstReport = await runIndex();
    const secondReport = await runIndex();

    expect(firstReport.failures).toEqual([{ filePath: "broken.epub", error: expect.stringMatching(/not a readable zip/) }]);
    expect(secondReport.failures).toEqual([{ filePath: "broken.epub", error: "previously failed to parse, unchanged since" }]);
  });

  it("indexes a previously invalid file once it has been replaced by a valid one", async () => {
    const brokenPath = path.join(booksDirectory, "dune.epub");
    await writeFile(brokenPath, "not a zip");
    await runIndex();
    await writeBook("dune.epub", { title: "Dune", authors: [] }, new Date("2026-03-01T00:00:00Z"));

    const report = await runIndex();

    expect(report).toMatchObject({ added: 1, failures: [] });
    expect(database.prepare("SELECT COUNT(*) AS count FROM invalid_files").get()).toEqual({ count: 0 });
  });

  it("makes books searchable by title and author, ignoring accents", async () => {
    await writeBook("a.epub", { title: "L'Événement", authors: ["Annie Ernaux"] });
    await writeBook("b.epub", { title: "Dune", authors: ["Frank Herbert"] });
    await runIndex();

    expect(searchTitles("evenement")).toEqual(["L'Événement"]);
    expect(searchTitles("herbert")).toEqual(["Dune"]);
  });

  it("keeps the search index in sync when a book is removed", async () => {
    await writeBook("dune.epub", { title: "Dune", authors: [] });
    await runIndex();
    await rm(path.join(booksDirectory, "dune.epub"));

    await runIndex();

    expect(searchTitles("dune")).toEqual([]);
  });
});
