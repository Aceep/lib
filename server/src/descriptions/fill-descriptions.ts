import type { LibraryStore, UndescribedBook } from "../db/library-store.js";
import { SourceError } from "../missing/bibliography-sources.js";
import type { DescriptionProvider, DescriptionSources } from "./description-sources.js";

export type FillReport = {
  /** Books looked up during this run. */
  checked: number;
  found: { bookId: number; title: string; provider: DescriptionProvider }[];
  /** Every source answered and none describes the book; not asked again for a month. */
  notFound: { bookId: number; title: string }[];
  /** Nothing found while a source was down: asked again next time. */
  postponed: { bookId: number; title: string }[];
  /** Books still without a summary once the run is over, looked up or not. */
  remaining: number;
  /** Each distinct way a source failed during the run ("openlibrary.org a répondu 503"). */
  sourceErrors: string[];
  /** Set when no source could be asked any more and the run stopped early. */
  stoppedBecause: string | null;
};

export type DescriptionFillerOptions = {
  store: LibraryStore;
  sources: DescriptionSources;
  now?: () => Date;
};

// A book nobody describes today may get its article later; a month between two lookups is often enough.
const RETRY_AFTER_DAYS = 30;
export const DEFAULT_FILL_LIMIT = 40;

export type DescriptionFiller = ReturnType<typeof createDescriptionFiller>;

/** Finds, online, a summary for the books whose file has none, and keeps it as a correction of the file. */
export function createDescriptionFiller({ store, sources, now = () => new Date() }: DescriptionFillerOptions) {
  async function fillOne(book: UndescribedBook, report: FillReport): Promise<void> {
    const entry = { bookId: book.bookId, title: book.title };
    const { found, complete, errors } = await sources.find({ title: book.title, authors: book.authors, language: book.language });
    for (const error of errors) {
      if (!report.sourceErrors.includes(error)) {
        report.sourceErrors.push(error);
      }
    }
    if (found) {
      store.setFetchedDescription(book.bookId, book.contentHash, found.text, found.source, now());
      report.found.push({ ...entry, provider: found.provider });
    } else if (complete) {
      store.markDescriptionChecked(book.contentHash, now());
      report.notFound.push(entry);
    } else {
      report.postponed.push(entry);
    }
  }

  return {
    /** Looks up at most `limit` books, newest first. Once every source is down the run ends; the rest waits for the next one. */
    async fillMissing({ limit = DEFAULT_FILL_LIMIT }: { limit?: number } = {}): Promise<FillReport> {
      const report: FillReport = { checked: 0, found: [], notFound: [], postponed: [], remaining: 0, sourceErrors: [], stoppedBecause: null };
      const notCheckedSince = new Date(now().getTime() - RETRY_AFTER_DAYS * 24 * 60 * 60 * 1000);
      for (const book of store.listUndescribedBooks(notCheckedSince, limit)) {
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
      report.remaining = store.countUndescribedBooks();
      return report;
    },

    countMissing: (): number => store.countUndescribedBooks(),
  };
}
