import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CoverlessBook, LibraryStore } from "../db/library-store.js";
import { SourceError } from "../missing/bibliography-sources.js";
import { COVER_EXTENSIONS, type CoverProvider, type CoverSources } from "./cover-sources.js";

export type CoverFillReport = {
  /** Books looked up during this run. */
  checked: number;
  found: { bookId: number; title: string; provider: CoverProvider }[];
  /** Every source answered and none has a cover of the book; not asked again for a month. */
  notFound: { bookId: number; title: string }[];
  /** Nothing found while a source was down: asked again next time. */
  postponed: { bookId: number; title: string }[];
  /** Books still without a cover once the run is over, looked up or not. */
  remaining: number;
  /** Each distinct way a source failed during the run. */
  sourceErrors: string[];
  /** Set when no source could be asked any more and the run stopped early. */
  stoppedBecause: string | null;
};

export type CoverFillerOptions = {
  store: LibraryStore;
  sources: CoverSources;
  coversDirectory: string;
  now?: () => Date;
};

// Catalogues add scans over time; a month between two lookups of the same book is enough.
const RETRY_AFTER_DAYS = 30;
export const DEFAULT_COVER_FILL_LIMIT = 40;
// Apart from the covers extracted from the files, which the indexer deletes and rewrites at will.
const FETCHED_FOLDER = "fetched";

export type CoverFiller = ReturnType<typeof createCoverFiller>;

/** Finds, online, a cover for the books whose file has none, and keeps it against the file's hash. */
export function createCoverFiller({ store, sources, coversDirectory, now = () => new Date() }: CoverFillerOptions) {
  async function fillOne(book: CoverlessBook, report: CoverFillReport): Promise<void> {
    const entry = { bookId: book.bookId, title: book.title };
    const { found, complete, errors } = await sources.find({ title: book.title, authors: book.authors, language: book.language });
    for (const error of errors) {
      if (!report.sourceErrors.includes(error)) {
        report.sourceErrors.push(error);
      }
    }
    if (found) {
      // Named after the content hash: the same file found again under another path reuses its cover.
      const coverFile = `${FETCHED_FOLDER}/${book.contentHash}.${COVER_EXTENSIONS[found.mediaType]}`;
      await mkdir(path.join(coversDirectory, FETCHED_FOLDER), { recursive: true });
      await writeFile(path.join(coversDirectory, coverFile), found.data);
      store.setFetchedCover(book.contentHash, coverFile, found.source, now());
      report.found.push({ ...entry, provider: found.provider });
    } else if (complete) {
      store.markCoverChecked(book.contentHash, now());
      report.notFound.push(entry);
    } else {
      report.postponed.push(entry);
    }
  }

  return {
    /** Looks up at most `limit` books, newest first. Once every source is down the run ends; the rest waits for the next one. */
    async fillMissing({ limit = DEFAULT_COVER_FILL_LIMIT }: { limit?: number } = {}): Promise<CoverFillReport> {
      const report: CoverFillReport = { checked: 0, found: [], notFound: [], postponed: [], remaining: 0, sourceErrors: [], stoppedBecause: null };
      const notCheckedSince = new Date(now().getTime() - RETRY_AFTER_DAYS * 24 * 60 * 60 * 1000);
      for (const book of store.listCoverlessBooks(notCheckedSince, limit)) {
        try {
          await fillOne(book, report);
          report.checked++;
        } catch (error) {
          if (!(error instanceof SourceError)) {
            throw error;
          }
          report.stoppedBecause = error.message;
          break;
        }
      }
      report.remaining = store.countCoverlessBooks();
      return report;
    },
  };
}
