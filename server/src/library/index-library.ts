import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileFingerprint, IndexedFile, LibraryStore } from "../db/library-store.js";
import { type EpubCover, type EpubMetadata, InvalidEpubError, readEpubMetadata } from "../epub/read-epub-metadata.js";
import { hashFile } from "./hash-file.js";

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

/** Relative, "/" separated, the way paths are stored in the database. */
export function toLibraryPath(booksDirectory: string, absolutePath: string): string {
  return path.relative(booksDirectory, absolutePath).split(path.sep).join("/");
}

export async function fingerprintFile(booksDirectory: string, absolutePath: string): Promise<FileFingerprint> {
  const fileStats = await stat(absolutePath);
  return {
    // Stored relative and with "/" so the database survives moving the library or changing OS.
    filePath: toLibraryPath(booksDirectory, absolutePath),
    fileSize: fileStats.size,
    fileMtimeMs: Math.trunc(fileStats.mtimeMs),
  };
}

export async function listEpubFiles(booksDirectory: string): Promise<FileFingerprint[]> {
  const entries = await readdir(booksDirectory, { recursive: true, withFileTypes: true });
  const epubFiles: FileFingerprint[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".epub") {
      continue;
    }
    epubFiles.push(await fingerprintFile(booksDirectory, path.join(entry.parentPath, entry.name)));
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

export type IndexFileOptions = IndexLibraryOptions & {
  file: FileFingerprint;
  /** The book currently stored for this path, when the file replaces one. */
  existing?: IndexedFile | null;
  /** Metadata already read from the file, to avoid parsing it twice. */
  metadata?: EpubMetadata;
  contentHash?: string;
};

/** Parses one file and writes it to the store (insert or update). Throws when the EPUB cannot be read. */
export async function indexFile(options: IndexFileOptions): Promise<number> {
  const { store, booksDirectory, coversDirectory, file, existing = null } = options;
  const absolutePath = path.join(booksDirectory, file.filePath);
  const metadata = options.metadata ?? (await readEpubMetadata(absolutePath));
  const contentHash = options.contentHash ?? (await hashFile(absolutePath));

  await mkdir(coversDirectory, { recursive: true });
  const bookId = store.saveBook({ ...file, ...metadata, contentHash }, existing?.bookId ?? null);
  await removeCover(coversDirectory, existing?.coverFile ?? null);
  store.setCoverFile(bookId, await saveCover(coversDirectory, bookId, metadata.cover));
  return bookId;
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
      if (indexed.contentHash === null) {
        // Book indexed before hashes existed: fill it in without re-parsing.
        store.setContentHash(indexed.bookId, await hashFile(path.join(booksDirectory, file.filePath)));
      }
      report.unchanged++;
      continue;
    }
    if (knownInvalid && sameFingerprint(knownInvalid, file)) {
      report.failures.push({ filePath: file.filePath, error: "previously failed to parse, unchanged since" });
      continue;
    }

    try {
      await indexFile({ store, booksDirectory, coversDirectory, file, existing: indexed ?? null });
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
