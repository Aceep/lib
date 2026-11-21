import { randomUUID } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ExistingBook, LibraryStore } from "../db/library-store.js";
import { type EpubMetadata, InvalidEpubError, readEpubMetadata } from "../epub/read-epub-metadata.js";
import { toSortKey } from "../db/sort-key.js";
import { parseAuthor, proposeName, splitAuthors } from "../library/file-naming.js";
import { hashFile } from "../library/hash-file.js";
import { fingerprintFile, indexFile } from "../library/index-library.js";
import type { CommandRunner } from "../sync/run-command.js";

export type DuplicateReason = "identical" | "same-book" | "same-path";

export type UploadDuplicate = ExistingBook & { reason: DuplicateReason };

/** What the user sees before confirming: where the file would go and what it may duplicate. */
export type UploadPreview = {
  id: string;
  originalName: string;
  fileSize: number;
  title: string;
  authors: string[];
  language: string | null;
  targetPath: string;
  duplicates: UploadDuplicate[];
};

export type UploadResult = {
  bookId: number;
  filePath: string;
};

export type UploadErrorCode =
  | "invalid_epub"
  | "invalid_metadata"
  | "file_too_large"
  | "unknown_upload"
  | "target_exists"
  | "remote_upload_failed";

export class UploadError extends Error {
  constructor(
    readonly status: number,
    readonly code: UploadErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export type UploadServiceOptions = {
  store: LibraryStore;
  booksDirectory: string;
  coversDirectory: string;
  /** Staging area; emptied when the service starts, since pending uploads do not survive a restart. */
  uploadsDirectory: string;
  /** rclone destination such as "mega:Library". Null keeps the book local only. */
  rcloneRemote: string | null;
  runCommand: CommandRunner;
};

type PendingUpload = {
  preview: UploadPreview;
  stagedPath: string;
  metadata: EpubMetadata;
  contentHash: string;
  stagedAt: number;
};

// A preview nobody confirmed is forgotten after an hour; the browser tab was probably closed.
const PENDING_TTL_MS = 60 * 60 * 1000;

/** "Herbert, Frank" and "Frank HERBERT" are the same person; order and duplicates do not matter either. */
function authorKey(authors: string[]): string {
  return [...new Set(splitAuthors(authors).map((author) => toSortKey(parseAuthor(author).display)))].sort().join("|");
}

async function moveFile(from: string, to: string): Promise<void> {
  try {
    await rename(from, to);
  } catch (error) {
    // The staging area and the library can sit on different file systems.
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") {
      throw error;
    }
    await copyFile(from, to);
    await rm(from, { force: true });
  }
}

export type UploadService = Awaited<ReturnType<typeof createUploadService>>;

export async function createUploadService(options: UploadServiceOptions) {
  const { store, booksDirectory, coversDirectory, uploadsDirectory, rcloneRemote, runCommand } = options;
  const pending = new Map<string, PendingUpload>();

  await mkdir(uploadsDirectory, { recursive: true });
  for (const entry of await readdir(uploadsDirectory)) {
    await rm(path.join(uploadsDirectory, entry), { force: true });
  }

  async function forget(upload: PendingUpload): Promise<void> {
    pending.delete(upload.preview.id);
    await rm(upload.stagedPath, { force: true });
  }

  async function expireStale(): Promise<void> {
    const limit = Date.now() - PENDING_TTL_MS;
    for (const upload of pending.values()) {
      if (upload.stagedAt < limit) {
        await forget(upload);
      }
    }
  }

  function findDuplicates(contentHash: string, metadata: EpubMetadata, targetPath: string): UploadDuplicate[] {
    const duplicates: UploadDuplicate[] = [];
    const seen = new Set<number>();
    const add = (books: ExistingBook[], reason: DuplicateReason) => {
      for (const book of books) {
        if (!seen.has(book.bookId)) {
          seen.add(book.bookId);
          duplicates.push({ ...book, reason });
        }
      }
    };
    add(store.findIdentical(contentHash), "identical");
    const wantedAuthors = authorKey(metadata.authors);
    add(
      store.findByTitle(metadata.title).filter((book) => authorKey(book.authors) === wantedAuthors),
      "same-book",
    );
    const atTarget = store.findByFilePath(targetPath);
    add(atTarget ? [atTarget] : [], "same-path");
    return duplicates;
  }

  function getPending(id: string): PendingUpload {
    const upload = pending.get(id);
    if (!upload) {
      throw new UploadError(404, "unknown_upload", "This upload has expired or was cancelled; send the file again");
    }
    return upload;
  }

  function describe(upload: Pick<PendingUpload, "metadata" | "contentHash">, base: Pick<UploadPreview, "id" | "originalName" | "fileSize">): UploadPreview {
    const { metadata, contentHash } = upload;
    const targetPath = proposeName(metadata).path;
    return {
      ...base,
      title: metadata.title,
      authors: metadata.authors,
      language: metadata.language,
      targetPath,
      duplicates: findDuplicates(contentHash, metadata, targetPath),
    };
  }

  return {
    /** Stores the file in the staging area and describes what confirming it would do. */
    async stage(originalName: string, source: Readable & { truncated?: boolean }): Promise<UploadPreview> {
      await expireStale();
      const id = randomUUID();
      const stagedPath = path.join(uploadsDirectory, `${id}.epub`);
      try {
        await pipeline(source, createWriteStream(stagedPath));
        if (source.truncated) {
          throw new UploadError(413, "file_too_large", "The file exceeds the upload size limit");
        }
        let metadata: EpubMetadata;
        try {
          metadata = await readEpubMetadata(stagedPath);
        } catch (error) {
          if (error instanceof InvalidEpubError) {
            throw new UploadError(422, "invalid_epub", `"${originalName}" is not a readable EPUB`);
          }
          throw error;
        }
        const contentHash = await hashFile(stagedPath);
        const { fileSize } = await fingerprintFile(uploadsDirectory, stagedPath);
        const preview = describe({ metadata, contentHash }, { id, originalName, fileSize });
        pending.set(id, { preview, stagedPath, metadata, contentHash, stagedAt: Date.now() });
        return preview;
      } catch (error) {
        await rm(stagedPath, { force: true });
        throw error;
      }
    },

    get(id: string): UploadPreview | null {
      return pending.get(id)?.preview ?? null;
    },

    /**
     * Overrides the title and authors read from the file (they are wrong in a fair share of EPUBs) and recomputes
     * the destination and the duplicates. The override only reaches the catalog, not the file itself.
     */
    update(id: string, changes: { title: string; authors: string[] }): UploadPreview {
      const upload = getPending(id);
      const title = changes.title.trim();
      const authors = changes.authors.map((author) => author.trim()).filter((author) => author !== "");
      if (title === "") {
        throw new UploadError(400, "invalid_metadata", "The title cannot be empty");
      }
      upload.metadata = { ...upload.metadata, title, authors };
      upload.preview = describe(upload, upload.preview);
      return upload.preview;
    },

    /** Files the book under its target path, pushes it to the remote and indexes it. */
    async confirm(id: string): Promise<UploadResult> {
      const upload = getPending(id);
      const { targetPath } = upload.preview;
      const absoluteTarget = path.join(booksDirectory, ...targetPath.split("/"));
      if (existsSync(absoluteTarget) || store.findByFilePath(targetPath)) {
        throw new UploadError(409, "target_exists", `A file already exists at ${targetPath}`);
      }

      await mkdir(path.dirname(absoluteTarget), { recursive: true });
      await moveFile(upload.stagedPath, absoluteTarget);

      if (rcloneRemote) {
        // Without the copy, the next sync (remote -> local) would delete the book from the library.
        const result = await runCommand("rclone", ["copyto", absoluteTarget, `${rcloneRemote}/${targetPath}`]);
        if (result.exitCode !== 0) {
          await moveFile(absoluteTarget, upload.stagedPath);
          throw new UploadError(
            502,
            "remote_upload_failed",
            `Could not copy the book to ${rcloneRemote} (rclone exited with ${result.exitCode ?? "unknown"}): ${result.stderrTail.trim()}`,
          );
        }
      }

      const file = await fingerprintFile(booksDirectory, absoluteTarget);
      const bookId = await indexFile({
        store,
        booksDirectory,
        coversDirectory,
        file,
        metadata: upload.metadata,
        contentHash: upload.contentHash,
      });
      pending.delete(id);
      return { bookId, filePath: targetPath };
    },

    async cancel(id: string): Promise<void> {
      await forget(getPending(id));
    },
  };
}
