import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { BookCorrection, LibraryStore, StoredBook } from "../db/library-store.js";
import { hashFile } from "../library/hash-file.js";
import type { CommandRunner } from "../sync/run-command.js";

export type BookAdminErrorCode = "not_found" | "invalid_metadata" | "remote_move_failed";

export class BookAdminError extends Error {
  constructor(
    readonly status: number,
    readonly code: BookAdminErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BookAdminError";
  }
}

export type BookAdminOptions = {
  store: LibraryStore;
  booksDirectory: string;
  coversDirectory: string;
  /** Where deleted books go when there is no remote to hold them. */
  localTrashDirectory: string;
  /** rclone location of the library, e.g. "mega:Library". Null: the library is local only. */
  rcloneRemote: string | null;
  /** rclone location deleted books are moved to, e.g. "mega:_corbeille". */
  rcloneTrash: string | null;
  runCommand: CommandRunner;
};

export type MergeResult = { into: string; changedBooks: number };

function cleanCorrection(correction: BookCorrection): BookCorrection {
  const title = correction.title.trim();
  if (title === "") {
    throw new BookAdminError(400, "invalid_metadata", "Le titre ne peut pas être vide");
  }
  const authors = [...new Set(correction.authors.map((author) => author.trim()).filter((author) => author !== ""))];
  const series = correction.series?.trim() || null;
  return { title, authors, series, seriesIndex: series ? correction.seriesIndex : null };
}

export type BookAdmin = ReturnType<typeof createBookAdmin>;

export function createBookAdmin(options: BookAdminOptions) {
  const { store, booksDirectory, coversDirectory, localTrashDirectory, rcloneRemote, rcloneTrash, runCommand } = options;

  function getBook(bookId: number): StoredBook {
    const book = store.getStoredBook(bookId);
    if (!book) {
      throw new BookAdminError(404, "not_found", "Livre introuvable");
    }
    return book;
  }

  /** Corrections are keyed by content hash; a book indexed before hashes existed gets its hash now. */
  async function contentHashOf(book: StoredBook): Promise<string> {
    if (book.contentHash) {
      return book.contentHash;
    }
    const contentHash = await hashFile(path.join(booksDirectory, book.filePath));
    store.setContentHash(book.bookId, contentHash);
    return contentHash;
  }

  async function correct(bookId: number, correction: BookCorrection, editor: string): Promise<{ before: StoredBook; after: BookCorrection }> {
    const before = getBook(bookId);
    const after = cleanCorrection(correction);
    store.correctBook(bookId, await contentHashOf(before), after, editor);
    return { before, after };
  }

  return {
    /** Changes what the catalog shows. The EPUB file and its name are left as they are. */
    correct,

    /**
     * Files the given books under one series name, keeping each one's number; `null` takes them out of their
     * series. Used to give one spelling to a series typed several ways, and to drop a series that is not one.
     */
    async setSeries(bookIds: number[], series: string | null, editor: string): Promise<{ series: string | null; changedBooks: number }> {
      const name = series?.trim() || null;
      const targets = [...new Set(bookIds)].map(getBook);
      for (const book of targets) {
        await correct(book.bookId, { ...book, series: name, seriesIndex: name ? book.seriesIndex : null }, editor);
      }
      return { series: name, changedBooks: targets.length };
    },

    /** Files the given books under one language; for the EPUBs that declare none, or a wrong one. */
    async setLanguage(bookIds: number[], language: string, editor: string): Promise<StoredBook[]> {
      const code = language.trim().toLowerCase();
      if (!/^[a-z]{2,3}$/.test(code)) {
        throw new BookAdminError(400, "invalid_metadata", "La langue est un code de deux ou trois lettres, par exemple « fr »");
      }
      const changed = [...new Set(bookIds)].map(getBook);
      for (const book of changed) {
        store.setLanguage(book.bookId, await contentHashOf(book), code, editor);
      }
      return changed;
    },

    /**
     * Gives every book credited to one of `from` the single name `into`: "Rowling, J.K." and "J. K. Rowling"
     * become one author. `into` may be a name that does not exist yet, which makes this a rename.
     */
    async mergeAuthors(from: string[], into: string, editor: string): Promise<MergeResult> {
      const target = into.trim();
      if (target === "") {
        throw new BookAdminError(400, "invalid_metadata", "Le nom d'auteur ne peut pas être vide");
      }
      const replaced = new Set(from.filter((name) => name !== target));
      const bookIds = new Set([...replaced].flatMap((name) => store.listBookIdsByAuthor(name)));
      for (const bookId of bookIds) {
        const book = getBook(bookId);
        const authors = book.authors.map((author) => (replaced.has(author) ? target : author));
        await correct(bookId, { ...book, authors }, editor);
      }
      store.deleteOrphanAuthors();
      return { into: target, changedBooks: bookIds.size };
    },

    /**
     * Rewrites one author field on every book that carries it: "Atwood, Margaret" becomes "Margaret Atwood",
     * "A et B" becomes the two authors A and B.
     */
    async rewriteAuthor(from: string, into: string[], editor: string): Promise<{ into: string[]; changedBooks: number }> {
      const people = [...new Set(into.map((name) => name.trim()).filter((name) => name !== ""))];
      if (people.length === 0) {
        throw new BookAdminError(400, "invalid_metadata", "Il faut au moins un nom d'auteur");
      }
      const bookIds = store.listBookIdsByAuthor(from);
      for (const bookId of bookIds) {
        const book = getBook(bookId);
        const authors = [...new Set(book.authors.flatMap((author) => (author === from ? people : [author])))];
        await correct(bookId, { ...book, authors }, editor);
      }
      store.deleteOrphanAuthors();
      return { into: people, changedBooks: bookIds.length };
    },

    /**
     * Takes a book out of the library without destroying it: the file is moved to the trash folder of the
     * remote (or to a local trash when there is no remote), where it can be moved back by hand.
     */
    async remove(bookId: number): Promise<StoredBook & { trashedTo: string }> {
      const book = getBook(bookId);
      const localPath = path.join(booksDirectory, ...book.filePath.split("/"));
      let trashedTo: string;

      if (rcloneRemote && rcloneTrash) {
        trashedTo = `${rcloneTrash}/${book.filePath}`;
        // Remote first: if it fails nothing has changed, and the next sync would bring the file back anyway.
        const result = await runCommand("rclone", ["moveto", `${rcloneRemote}/${book.filePath}`, trashedTo]);
        if (result.exitCode !== 0) {
          throw new BookAdminError(
            502,
            "remote_move_failed",
            `Impossible de déplacer le livre vers ${rcloneTrash} (rclone a renvoyé ${result.exitCode ?? "?"}) : ${result.stderrTail.trim()}`,
          );
        }
        await rm(localPath, { force: true });
      } else {
        const trashPath = path.join(localTrashDirectory, ...book.filePath.split("/"));
        trashedTo = trashPath;
        await mkdir(path.dirname(trashPath), { recursive: true });
        await rename(localPath, trashPath).catch((error: NodeJS.ErrnoException) => {
          // Already gone from disk: the catalog entry is all that is left to remove.
          if (error.code !== "ENOENT") {
            throw error;
          }
        });
      }

      store.deleteBook(bookId);
      store.deleteOrphanAuthors();
      if (book.coverFile) {
        await rm(path.join(coversDirectory, book.coverFile), { force: true });
      }
      return { ...book, trashedTo };
    },
  };
}
