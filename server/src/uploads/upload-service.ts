import { randomUUID } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { UserRole } from "../auth/auth-service.js";
import type { LibraryDatabase } from "../db/database.js";
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
  /** draft: only its uploader has seen it; submitted: waiting for an admin to approve or reject it. */
  status: "draft" | "submitted";
  uploadedBy: string;
  submittedAt: string | null;
};

/** Whoever is acting on an upload. Members only see and touch their own; admins everything. */
export type UploadActor = { id: number; username: string; role: UserRole };

/** What a member sees of an upload they sent for review. */
export type UploadSubmission = {
  id: string;
  originalName: string;
  title: string;
  authors: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  decidedAt: string | null;
  /** Why it was rejected, when the admin gave a reason. */
  reason: string | null;
  /** The catalog entry it became, once approved. */
  bookId: number | null;
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
  | "forbidden"
  | "too_many_pending"
  | "already_submitted"
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
  database: LibraryDatabase;
  store: LibraryStore;
  booksDirectory: string;
  coversDirectory: string;
  /** Staging area. Only files submitted for review survive a restart; unconfirmed drafts are deleted. */
  uploadsDirectory: string;
  /** rclone destination such as "mega:Library". Null keeps the book local only. */
  rcloneRemote: string | null;
  runCommand: CommandRunner;
  now?: () => Date;
};

type PendingUpload = {
  preview: UploadPreview;
  stagedPath: string;
  metadata: EpubMetadata;
  contentHash: string;
  stagedAt: number;
  owner: Pick<UploadActor, "id" | "username">;
  /** True once title or authors differ from the file's: the correction must then outlive a re-index. */
  corrected: boolean;
};

// A preview nobody confirmed is forgotten after an hour; the browser tab was probably closed.
const PENDING_TTL_MS = 60 * 60 * 1000;
/** Staged files a member may hold at once, drafts and submissions together, so one account cannot fill the disk. */
export const MAX_STAGED_PER_MEMBER = 10;
const MAX_LISTED_SUBMISSIONS = 50;

type SubmissionRow = {
  id: string;
  user_id: number | null;
  username: string;
  original_name: string;
  file_size: number;
  content_hash: string;
  title: string;
  authors_json: string;
  status: UploadSubmission["status"];
  submitted_at: string;
  decided_at: string | null;
  reason: string | null;
  book_id: number | null;
};

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
  const { database, store, booksDirectory, coversDirectory, uploadsDirectory, rcloneRemote, runCommand, now = () => new Date() } = options;
  const pending = new Map<string, PendingUpload>();

  const statements = {
    listPendingRows: database.prepare<[], SubmissionRow>("SELECT * FROM upload_submissions WHERE status = 'pending' ORDER BY submitted_at"),
    listByUser: database.prepare<[number, number], SubmissionRow>(
      "SELECT * FROM upload_submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT ?",
    ),
    insertSubmission: database.prepare<{
      id: string;
      userId: number;
      username: string;
      originalName: string;
      fileSize: number;
      contentHash: string;
      title: string;
      authorsJson: string;
      submittedAt: string;
    }>(
      `INSERT INTO upload_submissions (id, user_id, username, original_name, file_size, content_hash, title, authors_json, status, submitted_at)
       VALUES (@id, @userId, @username, @originalName, @fileSize, @contentHash, @title, @authorsJson, 'pending', @submittedAt)`,
    ),
    updateSubmissionMetadata: database.prepare<[string, string, string]>(
      "UPDATE upload_submissions SET title = ?, authors_json = ? WHERE id = ? AND status = 'pending'",
    ),
    decideSubmission: database.prepare<{
      id: string;
      status: "approved" | "rejected";
      decidedAt: string;
      decidedBy: string;
      reason: string | null;
      bookId: number | null;
    }>(
      `UPDATE upload_submissions SET status = @status, decided_at = @decidedAt, decided_by = @decidedBy, reason = @reason, book_id = @bookId
       WHERE id = @id AND status = 'pending'`,
    ),
    deleteSubmission: database.prepare<[string]>("DELETE FROM upload_submissions WHERE id = ? AND status = 'pending'"),
  };

  const stagedPathOf = (id: string) => path.join(uploadsDirectory, `${id}.epub`);

  // Submitted uploads survive a restart: their file is still staged and their row says what the member asked for.
  await mkdir(uploadsDirectory, { recursive: true });
  for (const row of statements.listPendingRows.all()) {
    const stagedPath = stagedPathOf(row.id);
    try {
      const fromFile = await readEpubMetadata(stagedPath);
      const metadata = { ...fromFile, title: row.title, authors: JSON.parse(row.authors_json) as string[] };
      const upload: PendingUpload = {
        // Filled in just below, once the upload exists to be described.
        preview: null as unknown as UploadPreview,
        stagedPath,
        metadata,
        contentHash: row.content_hash,
        stagedAt: Date.parse(row.submitted_at),
        owner: { id: row.user_id ?? 0, username: row.username },
        corrected: fromFile.title !== metadata.title || fromFile.authors.join("\n") !== metadata.authors.join("\n"),
      };
      upload.preview = describe(upload, { id: row.id, originalName: row.original_name, fileSize: row.file_size, submittedAt: row.submitted_at });
      pending.set(row.id, upload);
    } catch {
      statements.decideSubmission.run({
        id: row.id,
        status: "rejected",
        decidedAt: now().toISOString(),
        decidedBy: "system",
        reason: "Le fichier en attente a été perdu, il faut le renvoyer",
        bookId: null,
      });
    }
  }
  for (const entry of await readdir(uploadsDirectory)) {
    if (!pending.has(path.basename(entry, ".epub"))) {
      await rm(path.join(uploadsDirectory, entry), { force: true });
    }
  }

  async function forget(upload: PendingUpload): Promise<void> {
    pending.delete(upload.preview.id);
    statements.deleteSubmission.run(upload.preview.id);
    await rm(upload.stagedPath, { force: true });
  }

  async function expireStale(): Promise<void> {
    const limit = Date.now() - PENDING_TTL_MS;
    for (const upload of pending.values()) {
      // Submitted uploads wait for the admin as long as it takes.
      if (upload.preview.status === "draft" && upload.stagedAt < limit) {
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

  function getPending(id: string, actor: UploadActor): PendingUpload {
    const upload = pending.get(id);
    // Someone else's upload answers like a missing one: its existence is not the member's business.
    if (!upload || (actor.role !== "admin" && upload.owner.id !== actor.id)) {
      throw new UploadError(404, "unknown_upload", "This upload has expired or was cancelled; send the file again");
    }
    return upload;
  }

  function describe(
    upload: Pick<PendingUpload, "metadata" | "contentHash" | "owner">,
    base: Pick<UploadPreview, "id" | "originalName" | "fileSize" | "submittedAt">,
  ): UploadPreview {
    const { metadata, contentHash } = upload;
    const targetPath = proposeName(metadata).path;
    return {
      id: base.id,
      originalName: base.originalName,
      fileSize: base.fileSize,
      submittedAt: base.submittedAt,
      status: base.submittedAt ? "submitted" : "draft",
      uploadedBy: upload.owner.username,
      title: metadata.title,
      authors: metadata.authors,
      language: metadata.language,
      targetPath,
      duplicates: findDuplicates(contentHash, metadata, targetPath),
    };
  }

  return {
    /** Stores the file in the staging area and describes what confirming it would do. */
    async stage(originalName: string, source: Readable & { truncated?: boolean }, actor: UploadActor): Promise<UploadPreview> {
      await expireStale();
      if (actor.role !== "admin" && [...pending.values()].filter((upload) => upload.owner.id === actor.id).length >= MAX_STAGED_PER_MEMBER) {
        // The body has to be drained or the connection hangs on the unread upload.
        source.resume();
        throw new UploadError(409, "too_many_pending", `Vous avez déjà ${MAX_STAGED_PER_MEMBER} envois en attente ; attendez leur validation ou annulez-en`);
      }
      const id = randomUUID();
      const stagedPath = stagedPathOf(id);
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
        const owner = { id: actor.id, username: actor.username };
        const preview = describe({ metadata, contentHash, owner }, { id, originalName, fileSize, submittedAt: null });
        pending.set(id, { preview, stagedPath, metadata, contentHash, stagedAt: Date.now(), owner, corrected: false });
        return preview;
      } catch (error) {
        await rm(stagedPath, { force: true });
        throw error;
      }
    },

    /**
     * Overrides the title and authors read from the file (they are wrong in a fair share of EPUBs) and recomputes
     * the destination and the duplicates. The override only reaches the catalog, not the file itself.
     */
    update(id: string, changes: { title: string; authors: string[] }, actor: UploadActor): UploadPreview {
      const upload = getPending(id, actor);
      const title = changes.title.trim();
      const authors = changes.authors.map((author) => author.trim()).filter((author) => author !== "");
      if (title === "") {
        throw new UploadError(400, "invalid_metadata", "The title cannot be empty");
      }
      upload.metadata = { ...upload.metadata, title, authors };
      upload.corrected = true;
      upload.preview = describe(upload, upload.preview);
      statements.updateSubmissionMetadata.run(title, JSON.stringify(authors), id);
      return upload.preview;
    },

    /** A member's way in: the upload waits, untouched, until an admin confirms or rejects it. */
    submit(id: string, actor: UploadActor): UploadPreview {
      const upload = getPending(id, actor);
      if (upload.preview.status === "submitted") {
        throw new UploadError(409, "already_submitted", "Cet envoi attend déjà une validation");
      }
      const submittedAt = now().toISOString();
      statements.insertSubmission.run({
        id,
        userId: upload.owner.id,
        username: upload.owner.username,
        originalName: upload.preview.originalName,
        fileSize: upload.preview.fileSize,
        contentHash: upload.contentHash,
        title: upload.metadata.title,
        authorsJson: JSON.stringify(upload.metadata.authors),
        submittedAt,
      });
      upload.preview = describe(upload, { ...upload.preview, submittedAt });
      return upload.preview;
    },

    /** Uploads waiting for an admin, oldest first, with duplicates checked against the library as it is now. */
    listSubmitted(): UploadPreview[] {
      return [...pending.values()]
        .filter((upload) => upload.preview.status === "submitted")
        .sort((left, right) => (left.preview.submittedAt ?? "").localeCompare(right.preview.submittedAt ?? ""))
        .map((upload) => {
          upload.preview = describe(upload, upload.preview);
          return upload.preview;
        });
    },

    countSubmitted: (): number => [...pending.values()].filter((upload) => upload.preview.status === "submitted").length,

    /** The latest uploads a member sent for review, whatever became of them. */
    listSubmissionsOf(userId: number): UploadSubmission[] {
      return statements.listByUser.all(userId, MAX_LISTED_SUBMISSIONS).map((row) => ({
        id: row.id,
        originalName: row.original_name,
        title: row.title,
        authors: JSON.parse(row.authors_json) as string[],
        status: row.status,
        submittedAt: row.submitted_at,
        decidedAt: row.decided_at,
        reason: row.reason,
        bookId: row.book_id,
      }));
    },

    /** Admin only: discards a submitted upload, keeping the reason for its uploader to read. */
    async reject(id: string, reason: string | null, actor: UploadActor): Promise<UploadPreview> {
      if (actor.role !== "admin") {
        throw new UploadError(403, "forbidden", "Seul un administrateur peut refuser un envoi");
      }
      const upload = getPending(id, actor);
      statements.decideSubmission.run({
        id,
        status: "rejected",
        decidedAt: now().toISOString(),
        decidedBy: actor.username,
        reason: reason?.trim() || null,
        bookId: null,
      });
      await forget(upload);
      return upload.preview;
    },

    /** Admin only: files the book under its target path, pushes it to the remote and indexes it. */
    async confirm(id: string, actor: UploadActor): Promise<UploadResult & { preview: UploadPreview }> {
      if (actor.role !== "admin") {
        throw new UploadError(403, "forbidden", "Seul un administrateur peut ajouter un livre directement ; soumettez l'envoi pour validation");
      }
      const upload = getPending(id, actor);
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

      if (upload.corrected) {
        const { title, authors, series, seriesIndex } = upload.metadata;
        store.saveOverride(upload.contentHash, { title, authors, series, seriesIndex }, actor.username);
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
      statements.decideSubmission.run({ id, status: "approved", decidedAt: now().toISOString(), decidedBy: actor.username, reason: null, bookId });
      return { bookId, filePath: targetPath, preview: upload.preview };
    },

    /** Returns what was cancelled, for the activity log. */
    async cancel(id: string, actor: UploadActor): Promise<UploadPreview> {
      const upload = getPending(id, actor);
      await forget(upload);
      return upload.preview;
    },
  };
}
