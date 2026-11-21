import { authorIdentityKey } from "../admin/library-health.js";
import type { LibraryDatabase } from "../db/database.js";
import { type AuthorCandidate, type BibliographySources, SourceError } from "./bibliography-sources.js";
import { libraryTitleKeys, titleKeys } from "./title-key.js";

export type WorkDecision = "ignored" | "owned";

export type AuthorWork = {
  id: number;
  title: string;
  alternateTitles: string[];
  series: string | null;
  seriesIndex: number | null;
  year: number | null;
  source: "wikidata" | "openlibrary";
  /** owned: found in the library, or declared so by the admin; ignored: the admin does not want it listed. */
  state: "missing" | "owned" | "ignored";
  /** The admin's own call, null while the state is only what title matching found. */
  decision: WorkDecision | null;
  /** The library book the title matched, when that is how it was found. */
  ownedBookId: number | null;
};

export type FollowedAuthor = {
  id: number;
  /** The author as named in the library. */
  name: string;
  wikidataId: string;
  wikidataLabel: string;
  fetchedAt: string | null;
  fetchError: string | null;
  works: AuthorWork[];
};

/** A numbered series of the library with holes in its numbering: volumes 1, 2 and 4 are there, 3 is not. */
export type SeriesGap = {
  series: string;
  authors: string[];
  owned: number[];
  missing: number[];
};

export type MissingBooksReport = {
  authors: FollowedAuthor[];
  seriesGaps: SeriesGap[];
};

export class MissingBooksError extends Error {
  constructor(
    readonly status: number,
    readonly code: "not_found" | "already_followed" | "source_unavailable",
    message: string,
  ) {
    super(message);
    this.name = "MissingBooksError";
  }
}

type FollowedAuthorRow = {
  id: number;
  name: string;
  wikidata_id: string;
  wikidata_label: string;
  fetched_at: string | null;
  fetch_error: string | null;
};

type WorkRow = {
  id: number;
  followed_author_id: number;
  source: "wikidata" | "openlibrary";
  external_id: string;
  title: string;
  alternate_titles_json: string;
  series: string | null;
  series_index: number | null;
  year: number | null;
  decision: WorkDecision | null;
};

type LibraryBookRow = { id: number; title: string; series: string | null; series_index: number | null; authors_json: string };

// A series numbered beyond this is a publisher's collection ("Folio n° 7767"), not something to complete.
const MAX_SERIES_LENGTH = 60;

function sourceFailure(error: unknown): MissingBooksError {
  if (error instanceof SourceError) {
    return new MissingBooksError(502, "source_unavailable", error.message);
  }
  throw error;
}

export type MissingBooks = ReturnType<typeof createMissingBooks>;

export function createMissingBooks({ database, sources, now = () => new Date() }: { database: LibraryDatabase; sources: BibliographySources; now?: () => Date }) {
  const statements = {
    listAuthors: database.prepare<[], FollowedAuthorRow>("SELECT * FROM followed_authors ORDER BY name COLLATE NOCASE"),
    getAuthor: database.prepare<[number], FollowedAuthorRow>("SELECT * FROM followed_authors WHERE id = ?"),
    getAuthorByName: database.prepare<[string], FollowedAuthorRow>("SELECT * FROM followed_authors WHERE name = ?"),
    insertAuthor: database.prepare<[string, string, string], { id: number }>(
      "INSERT INTO followed_authors (name, wikidata_id, wikidata_label) VALUES (?, ?, ?) RETURNING id",
    ),
    deleteAuthor: database.prepare<[number]>("DELETE FROM followed_authors WHERE id = ?"),
    markFetched: database.prepare<[string | null, string, string | null, number]>(
      "UPDATE followed_authors SET openlibrary_key = coalesce(?, openlibrary_key), fetched_at = ?, fetch_error = ? WHERE id = ?",
    ),
    markFailed: database.prepare<[string, number]>("UPDATE followed_authors SET fetch_error = ? WHERE id = ?"),
    listWorks: database.prepare<[], WorkRow>("SELECT * FROM author_works ORDER BY series IS NULL, series, series_index, year, title"),
    listWorkKeys: database.prepare<[number], { id: number; source: string; external_id: string; decision: string | null }>(
      "SELECT id, source, external_id, decision FROM author_works WHERE followed_author_id = ?",
    ),
    upsertWork: database.prepare<{
      authorId: number;
      source: string;
      externalId: string;
      title: string;
      alternateTitlesJson: string;
      series: string | null;
      seriesIndex: number | null;
      year: number | null;
    }>(
      `INSERT INTO author_works (followed_author_id, source, external_id, title, alternate_titles_json, series, series_index, year)
       VALUES (@authorId, @source, @externalId, @title, @alternateTitlesJson, @series, @seriesIndex, @year)
       ON CONFLICT (followed_author_id, source, external_id) DO UPDATE SET title = excluded.title,
         alternate_titles_json = excluded.alternate_titles_json, series = excluded.series, series_index = excluded.series_index, year = excluded.year`,
    ),
    deleteWork: database.prepare<[number]>("DELETE FROM author_works WHERE id = ?"),
    setDecision: database.prepare<[WorkDecision | null, number]>("UPDATE author_works SET decision = ? WHERE id = ?"),
    listLibraryBooks: database.prepare<[], LibraryBookRow>(
      `SELECT books.id, books.title, books.series, books.series_index,
         (SELECT json_group_array(authors.name) FROM book_authors JOIN authors ON authors.id = book_authors.author_id
          WHERE book_authors.book_id = books.id) AS authors_json
       FROM books`,
    ),
  };

  function requireAuthor(authorId: number): FollowedAuthorRow {
    const author = statements.getAuthor.get(authorId);
    if (!author) {
      throw new MissingBooksError(404, "not_found", "Auteur suivi introuvable");
    }
    return author;
  }

  async function refresh(authorId: number): Promise<void> {
    const author = requireAuthor(authorId);
    let bibliography;
    try {
      bibliography = await sources.fetchBibliography(author.wikidata_id);
    } catch (error) {
      const failure = sourceFailure(error);
      // The works fetched last time stay: a source being down should not empty the list.
      statements.markFailed.run(failure.message, authorId);
      throw failure;
    }
    database.transaction(() => {
      const fresh = new Set(bibliography.works.map((work) => `${work.source}:${work.externalId}`));
      for (const stored of statements.listWorkKeys.all(authorId)) {
        // A work the source dropped goes too, unless the admin took a decision on it worth keeping.
        if (!fresh.has(`${stored.source}:${stored.external_id}`) && stored.decision === null) {
          statements.deleteWork.run(stored.id);
        }
      }
      for (const work of bibliography.works) {
        statements.upsertWork.run({
          authorId,
          source: work.source,
          externalId: work.externalId,
          title: work.title,
          alternateTitlesJson: JSON.stringify(work.alternateTitles),
          series: work.series,
          seriesIndex: work.seriesIndex,
          year: work.year,
        });
      }
      statements.markFetched.run(bibliography.openLibraryKey, now().toISOString(), null, authorId);
    })();
  }

  function findSeriesGaps(books: LibraryBookRow[]): SeriesGap[] {
    const bySeries = new Map<string, { series: string; authors: Set<string>; owned: Set<number> }>();
    for (const book of books) {
      if (!book.series || book.series_index === null || !Number.isInteger(book.series_index) || book.series_index < 1) {
        continue;
      }
      const key = book.series.toLowerCase();
      const entry = bySeries.get(key) ?? { series: book.series, authors: new Set<string>(), owned: new Set<number>() };
      entry.owned.add(book.series_index);
      (JSON.parse(book.authors_json) as string[]).slice(0, 1).forEach((author) => entry.authors.add(author));
      bySeries.set(key, entry);
    }
    const gaps: SeriesGap[] = [];
    for (const entry of bySeries.values()) {
      const last = Math.max(...entry.owned);
      if (last > MAX_SERIES_LENGTH) {
        continue;
      }
      const missing = Array.from({ length: last }, (_, index) => index + 1).filter((volume) => !entry.owned.has(volume));
      if (missing.length > 0) {
        gaps.push({ series: entry.series, authors: [...entry.authors], owned: [...entry.owned].sort((a, b) => a - b), missing });
      }
    }
    return gaps.sort((left, right) => left.series.localeCompare(right.series, "fr"));
  }

  return {
    searchAuthors(name: string): Promise<AuthorCandidate[]> {
      return sources.searchAuthors(name).catch((error: unknown) => {
        throw sourceFailure(error);
      });
    },

    /** Starts listing what is missing from `name` (an author of the library), identified as `wikidataId`. */
    async follow(name: string, wikidataId: string, wikidataLabel: string): Promise<number> {
      if (statements.getAuthorByName.get(name)) {
        throw new MissingBooksError(409, "already_followed", "Cet auteur est déjà suivi");
      }
      const inserted = statements.insertAuthor.get(name, wikidataId, wikidataLabel);
      if (!inserted) {
        throw new Error(`Insert of followed author "${name}" returned no id`);
      }
      // A failed first fetch still leaves the author followed: "Actualiser" retries without picking the person again.
      await refresh(inserted.id).catch((error: unknown) => {
        if (!(error instanceof MissingBooksError)) {
          throw error;
        }
      });
      return inserted.id;
    },

    refresh,

    unfollow(authorId: number): void {
      requireAuthor(authorId);
      statements.deleteAuthor.run(authorId);
    },

    /** `null` hands the work back to automatic title matching. */
    decide(workId: number, decision: WorkDecision | null): void {
      if (statements.setDecision.run(decision, workId).changes === 0) {
        throw new MissingBooksError(404, "not_found", "Œuvre introuvable");
      }
    },

    getReport(): MissingBooksReport {
      const books = statements.listLibraryBooks.all();
      const worksByAuthor = new Map<number, WorkRow[]>();
      for (const work of statements.listWorks.all()) {
        worksByAuthor.set(work.followed_author_id, [...(worksByAuthor.get(work.followed_author_id) ?? []), work]);
      }

      const authors = statements.listAuthors.all().map((author): FollowedAuthor => {
        // The library may still spell the author several ways; all of them count as this author's books.
        const identities = new Set([authorIdentityKey(author.name), authorIdentityKey(author.wikidata_label)]);
        const ownedByKey = new Map<string, number>();
        for (const book of books) {
          if ((JSON.parse(book.authors_json) as string[]).some((name) => identities.has(authorIdentityKey(name)))) {
            libraryTitleKeys(book.title).forEach((key) => ownedByKey.set(key, book.id));
          }
        }
        const works = (worksByAuthor.get(author.id) ?? []).map((work): AuthorWork => {
          const alternateTitles = JSON.parse(work.alternate_titles_json) as string[];
          const ownedBookId = titleKeys([work.title, ...alternateTitles]).map((key) => ownedByKey.get(key)).find((id) => id !== undefined) ?? null;
          return {
            id: work.id,
            title: work.title,
            alternateTitles,
            series: work.series,
            seriesIndex: work.series_index,
            year: work.year,
            source: work.source,
            state: work.decision ?? (ownedBookId !== null ? "owned" : "missing"),
            decision: work.decision,
            ownedBookId,
          };
        });
        return {
          id: author.id,
          name: author.name,
          wikidataId: author.wikidata_id,
          wikidataLabel: author.wikidata_label,
          fetchedAt: author.fetched_at,
          fetchError: author.fetch_error,
          works,
        };
      });

      return { authors, seriesGaps: findSeriesGaps(books) };
    },
  };
}
