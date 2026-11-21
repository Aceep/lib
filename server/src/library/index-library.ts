import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileFingerprint, IndexedFile, LibraryStore } from "../db/library-store.js";
import { type EpubCover, InvalidEpubError, readEpubMetadata } from "../epub/read-epub-metadata.js";

export type IndexFailure = {
  filePath: string;
  error: string;
};

export type IndexReport = {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  /** Files that could not be indexed during this run, including known-invalid files that did not change. */
  failures: IndexFailure[];
};

export type IndexLibraryOptions = {
  store: LibraryStore;
  booksDirectory: string;
  coversDirectory: string;
};

const COVER_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function listEpubFiles(booksDirectory: string): Promise<FileFingerprint[]> {
  const entries = await readdir(booksDirectory, { recursive: true, withFileTypes: true });
  const epubFiles: FileFingerprint[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".epub") {
      continue;
    }
    const absolutePath = path.join(entry.parentPath, entry.name);
    const fileStats = await stat(absolutePath);
    epubFiles.push({
      // Stored relative and with "/" so the database survives moving the library or changing OS.
      filePath: path.relative(booksDirectory, absolutePath).split(path.sep).join("/"),
      fileSize: fileStats.size,
      fileMtimeMs: Math.trunc(fileStats.mtimeMs),
    });
  }
  return epubFiles;
}

function sameFingerprint(left: FileFingerprint, right: FileFingerprint): boolean {
  return left.fileSize === right.fileSize && left.fileMtimeMs === right.fileMtimeMs;
}

async function removeCover(coversDirectory: string, coverFile: string | null): Promise<void> {
  if (coverFile) {
    await rm(path.join(coversDirectory, coverFile), { force: true });
  }
}

async function saveCover(coversDirectory: string, bookId: number, cover: EpubCover | null): Promise<string | null> {
  const extension = cover ? COVER_EXTENSIONS[cover.mediaType] : undefined;
  if (!cover || !extension) {
    return null;
  }
  const coverFile = `${bookId}.${extension}`;
  await writeFile(path.join(coversDirectory, coverFile), cover.data);
  return coverFile;
}

export async function indexLibrary({ store, booksDirectory, coversDirectory }: IndexLibraryOptions): Promise<IndexReport> {
  await mkdir(coversDirectory, { recursive: true });

  const report: IndexReport = { added: 0, updated: 0, removed: 0, unchanged: 0, failures: [] };
  const indexedByPath = new Map<string, IndexedFile>(store.listIndexedFiles().map((file) => [file.filePath, file]));
  const invalidByPath = new Map<string, FileFingerprint>(store.listInvalidFiles().map((file) => [file.filePath, file]));
  const filesOnDisk = await listEpubFiles(booksDirectory);

  for (const file of filesOnDisk) {
    const indexed = indexedByPath.get(file.filePath);
    indexedByPath.delete(file.filePath);
    const knownInvalid = invalidByPath.get(file.filePath);
    invalidByPath.delete(file.filePath);

    if (indexed && sameFingerprint(indexed, file)) {
      report.unchanged++;
      continue;
    }
    if (knownInvalid && sameFingerprint(knownInvalid, file)) {
      report.failures.push({ filePath: file.filePath, error: "previously failed to parse, unchanged since" });
      continue;
    }

    let metadata;
    try {
      metadata = await readEpubMetadata(path.join(booksDirectory, file.filePath));
    } catch (error) {
      const message = (error as Error).message;
      report.failures.push({ filePath: file.filePath, error: message });
      // Only a malformed EPUB is remembered; an I/O error (file mid-sync, permissions) is retried next run.
      if (error instanceof InvalidEpubError) {
        store.markInvalid(file, message);
        if (indexed) {
          store.deleteBook(indexed.bookId);
          await removeCover(coversDirectory, indexed.coverFile);
        }
      }
      continue;
    }

    const bookId = store.saveBook({ ...file, ...metadata }, indexed?.bookId ?? null);
    await removeCover(coversDirectory, indexed?.coverFile ?? null);
    store.setCoverFile(bookId, await saveCover(coversDirectory, bookId, metadata.cover));
    if (indexed) {
      report.updated++;
    } else {
      report.added++;
    }
  }

  for (const vanished of indexedByPath.values()) {
    store.deleteBook(vanished.bookId);
    await removeCover(coversDirectory, vanished.coverFile);
    report.removed++;
  }
  for (const vanished of invalidByPath.values()) {
    store.forgetInvalid(vanished.filePath);
  }
  store.deleteOrphanAuthors();

  return report;
}
