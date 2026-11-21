import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InvalidEpubError, readEpubMetadata } from "../src/epub/read-epub-metadata.js";
import { opfDocument, writeEpub } from "./helpers/build-epub.js";

let workDirectory: string;

beforeEach(async () => {
  workDirectory = await mkdtemp(path.join(os.tmpdir(), "kyle-lib-epub-"));
});

afterEach(async () => {
  await rm(workDirectory, { recursive: true, force: true });
});

async function epubWithOpf(fileName: string, metadata: string, manifest = "", extraFiles: { path: string; content: string | Buffer }[] = []) {
  const filePath = path.join(workDirectory, fileName);
  await writeEpub(filePath, [{ path: "OEBPS/content.opf", content: opfDocument(metadata, manifest) }, ...extraFiles]);
  return filePath;
}

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("readEpubMetadata", () => {
  it("reads title, author and language from the package document", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>Le Petit Prince</dc:title><dc:creator>Antoine de Saint-Exupéry</dc:creator><dc:language>fr</dc:language>`,
    );

    const metadata = await readEpubMetadata(filePath);

    expect(metadata).toMatchObject({ title: "Le Petit Prince", authors: ["Antoine de Saint-Exupéry"], language: "fr" });
  });

  it("keeps every author in order and drops duplicates", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>T</dc:title><dc:creator>Terry Pratchett</dc:creator><dc:creator>Neil Gaiman</dc:creator><dc:creator>Terry Pratchett</dc:creator>`,
    );

    expect((await readEpubMetadata(filePath)).authors).toEqual(["Terry Pratchett", "Neil Gaiman"]);
  });

  it("ignores creators whose EPUB2 role is not author", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>T</dc:title><dc:creator opf:role="aut">Jules Verne</dc:creator><dc:creator opf:role="ill">Léon Benett</dc:creator>`,
    );

    expect((await readEpubMetadata(filePath)).authors).toEqual(["Jules Verne"]);
  });

  it("reduces the language to its primary subtag", async () => {
    const filePath = await epubWithOpf("book.epub", `<dc:title>T</dc:title><dc:language>en-GB</dc:language>`);

    expect((await readEpubMetadata(filePath)).language).toBe("en");
  });

  it("turns an HTML description into plain text", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>T</dc:title><dc:description>&lt;p&gt;Un &lt;b&gt;grand&lt;/b&gt; roman&amp;nbsp;!&lt;/p&gt;&lt;p&gt;Suite&lt;/p&gt;</dc:description>`,
    );

    expect((await readEpubMetadata(filePath)).description).toBe("Un grand roman !\nSuite");
  });

  it("falls back to the file name when the title is missing", async () => {
    const filePath = await epubWithOpf("Dune - Frank Herbert.epub", `<dc:creator>Frank Herbert</dc:creator>`);

    expect((await readEpubMetadata(filePath)).title).toBe("Dune - Frank Herbert");
  });

  it("extracts the EPUB3 cover-image item", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>T</dc:title>`,
      `<item id="img" href="images/front%20cover.png" media-type="image/png" properties="cover-image"/>`,
      [{ path: "OEBPS/images/front cover.png", content: PNG_BYTES }],
    );

    const { cover } = await readEpubMetadata(filePath);

    expect(cover?.mediaType).toBe("image/png");
    expect(cover?.data.equals(PNG_BYTES)).toBe(true);
  });

  it("extracts the EPUB2 cover referenced by meta name=cover", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>T</dc:title><meta name="cover" content="the-cover"/>`,
      `<item id="the-cover" href="../cover.jpg" media-type="image/jpeg"/>`,
      [{ path: "cover.jpg", content: PNG_BYTES }],
    );

    expect((await readEpubMetadata(filePath)).cover?.mediaType).toBe("image/jpeg");
  });

  it("returns no cover when the manifest points to a missing file", async () => {
    const filePath = await epubWithOpf(
      "book.epub",
      `<dc:title>T</dc:title>`,
      `<item id="c" href="missing.png" media-type="image/png" properties="cover-image"/>`,
    );

    expect((await readEpubMetadata(filePath)).cover).toBeNull();
  });

  it("rejects a file that is not a zip", async () => {
    const filePath = path.join(workDirectory, "broken.epub");
    await writeFile(filePath, "not a zip");

    await expect(readEpubMetadata(filePath)).rejects.toBeInstanceOf(InvalidEpubError);
  });

  it("rejects an archive without container.xml", async () => {
    const filePath = path.join(workDirectory, "no-container.epub");
    await writeEpub(filePath, [], { container: null });

    await expect(readEpubMetadata(filePath)).rejects.toThrow(/missing META-INF\/container.xml/);
  });
});
