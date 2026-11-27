import { titleKeys } from "./title-key.js";

export type FetchJson = (url: string) => Promise<unknown>;

export type AuthorCandidate = {
  wikidataId: string;
  label: string;
  description: string | null;
};

export type ExternalWork = {
  source: "wikidata" | "openlibrary";
  externalId: string;
  title: string;
  /** Other names the same work goes by: original title, English title, French volumes of a split edition. */
  alternateTitles: string[];
  series: string | null;
  seriesIndex: number | null;
  year: number | null;
};

export type AuthorBibliography = {
  openLibraryKey: string | null;
  works: ExternalWork[];
};

export class SourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceError";
  }
}

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";
// Says what the client is and where to find its authors, as Wikimedia asks, without naming whoever runs this instance.
export const USER_AGENT = "kyle-lib/1.0 (self-hosted EPUB catalog; +https://github.com/Aceep/lib)";
export const REQUEST_TIMEOUT_MS = 20_000;

const AUTHOR = "P50";
const INSTANCE_OF = "P31";
const PART_OF_SERIES = "P179";
const SERIES_ORDINAL = "P1545";
const PUBLICATION_DATE = "P577";
const TITLE = "P1476";
const OPEN_LIBRARY_ID = "P648";
const EDITION = "Q3331189";
// Items that describe a whole series rather than a book one can own.
const SERIES_TYPES = new Set(["Q1667921", "Q277759", "Q13593966", "Q47068459", "Q17489659", "Q21198342"]);

// Short stories, poems, articles, songs and Wikimedia list pages: authored, but not books to look for.
const NOT_A_BOOK_TYPES = new Set(["Q49084", "Q5185279", "Q191067", "Q7366", "Q13406463", "Q13442814"]);

const WIKIDATA_PAGE_SIZE = 50;
const MAX_WIKIDATA_WORKS = 600;
// Open Library lists every anthology and stray translation as a work; few editions means noise more often than a book.
const MIN_OPEN_LIBRARY_EDITIONS = 5;

// Both services are free and shared: one request at a time per host, with a pause in between.
const MIN_INTERVAL_MS = 300;
const nextSlotByHost = new Map<string, number>();

async function waitForSlot(host: string): Promise<void> {
  const slot = Math.max(Date.now(), nextSlotByHost.get(host) ?? 0);
  nextSlotByHost.set(host, slot + MIN_INTERVAL_MS);
  await new Promise((resolve) => setTimeout(resolve, slot - Date.now()));
}

export async function fetchJsonOverHttp(url: string): Promise<unknown> {
  await waitForSlot(new URL(url).hostname);
  let response: Response;
  try {
    response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new SourceError(`${new URL(url).hostname} est injoignable (${(error as Error).message})`);
  }
  if (response.status === 429) {
    throw new SourceError(`${new URL(url).hostname} limite le débit pour l'instant, réessayez dans quelques minutes`);
  }
  if (!response.ok) {
    throw new SourceError(`${new URL(url).hostname} a répondu ${response.status}`);
  }
  return response.json();
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function field(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (!isObject(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function wikidataUrl(parameters: Record<string, string>): string {
  return `${WIKIDATA_API}?${new URLSearchParams({ ...parameters, format: "json" })}`;
}

function statements(entity: unknown, property: string): unknown[] {
  return list(field(entity, "claims", property));
}

function statementValue(statement: unknown): unknown {
  return field(statement, "mainsnak", "datavalue", "value");
}

function entityIds(entity: unknown, property: string): string[] {
  return statements(entity, property).flatMap((statement) => text(field(statementValue(statement), "id")) ?? []);
}

function label(entity: unknown, language: string): string | null {
  return text(field(entity, "labels", language, "value"));
}

function firstYear(entity: unknown): number | null {
  const years = statements(entity, PUBLICATION_DATE).flatMap((statement) => {
    const match = /^([+-]\d+)-/.exec(text(field(statementValue(statement), "time")) ?? "");
    return match ? [Number(match[1])] : [];
  });
  return years.length > 0 ? Math.min(...years) : null;
}

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
}

export type BibliographySources = ReturnType<typeof createBibliographySources>;

export function createBibliographySources({ fetchJson = fetchJsonOverHttp }: { fetchJson?: FetchJson } = {}) {
  async function fetchEntities(ids: string[]): Promise<Map<string, unknown>> {
    const entities = new Map<string, unknown>();
    for (const batch of chunks(ids, WIKIDATA_PAGE_SIZE)) {
      const response = await fetchJson(wikidataUrl({ action: "wbgetentities", ids: batch.join("|"), props: "labels|claims", languages: "fr|en" }));
      for (const [id, entity] of Object.entries(isObject(field(response, "entities")) ? (field(response, "entities") as Json) : {})) {
        entities.set(id, entity);
      }
    }
    return entities;
  }

  async function listWorkIds(authorId: string): Promise<string[]> {
    const ids: string[] = [];
    for (let offset = 0; offset < MAX_WIKIDATA_WORKS; offset += WIKIDATA_PAGE_SIZE) {
      const response = await fetchJson(
        wikidataUrl({
          action: "query",
          list: "search",
          srsearch: `haswbstatement:${AUTHOR}=${authorId}`,
          srnamespace: "0",
          srlimit: String(WIKIDATA_PAGE_SIZE),
          sroffset: String(offset),
          srprop: "",
        }),
      );
      const page = list(field(response, "query", "search")).flatMap((result) => text(field(result, "title")) ?? []);
      ids.push(...page);
      if (page.length < WIKIDATA_PAGE_SIZE) {
        break;
      }
    }
    return ids;
  }

  async function fetchWikidataWorks(authorId: string): Promise<ExternalWork[]> {
    const entities = await fetchEntities(await listWorkIds(authorId));
    const seriesIds = new Set([...entities.values()].flatMap((entity) => entityIds(entity, PART_OF_SERIES)));
    const unknownSeries = [...seriesIds].filter((id) => !entities.has(id));
    const seriesEntities = new Map([...entities, ...(await fetchEntities(unknownSeries))]);

    const works: ExternalWork[] = [];
    for (const [id, entity] of entities) {
      const types = entityIds(entity, INSTANCE_OF);
      // Editions repeat their work, and a series is not a book: neither can be "missing".
      if (types.includes(EDITION) || types.some((type) => SERIES_TYPES.has(type) || NOT_A_BOOK_TYPES.has(type)) || seriesIds.has(id)) {
        continue;
      }
      const french = label(entity, "fr");
      const english = label(entity, "en");
      const originals = statements(entity, TITLE).flatMap((statement) => text(field(statementValue(statement), "text")) ?? []);
      const title = french ?? english ?? originals[0];
      if (!title) {
        continue;
      }
      const membership = statements(entity, PART_OF_SERIES)[0];
      const seriesEntity = seriesEntities.get(text(field(statementValue(membership), "id")) ?? "");
      const ordinal = Number(text(field(list(field(membership, "qualifiers", SERIES_ORDINAL))[0], "datavalue", "value")) ?? Number.NaN);
      works.push({
        source: "wikidata",
        externalId: id,
        title,
        // French publishers often split one volume in several: "Le Renégat / Danse de terreur / Racines".
        alternateTitles: [...new Set([...(french?.split(/\s*\/\s*/) ?? []), ...(english ? [english] : []), ...originals])].filter((other) => other !== title),
        series: seriesEntity ? (label(seriesEntity, "fr") ?? label(seriesEntity, "en")) : null,
        seriesIndex: Number.isFinite(ordinal) ? ordinal : null,
        year: firstYear(entity),
      });
    }
    return works;
  }

  async function fetchOpenLibraryWorks(authorKey: string, known: ExternalWork[]): Promise<ExternalWork[]> {
    const response = await fetchJson(
      `${OPEN_LIBRARY_SEARCH}?${new URLSearchParams({ author_key: authorKey, fields: "key,title,first_publish_year,edition_count", limit: "100", sort: "editions" })}`,
    );
    const seen = new Set(known.flatMap((work) => titleKeys([work.title, ...work.alternateTitles])));
    const works: ExternalWork[] = [];
    for (const document of list(field(response, "docs"))) {
      const key = text(field(document, "key"));
      // "Golden Fool (The Tawny Man, Book 2)": the parenthesis is cataloguing, not title.
      const title = text(field(document, "title"))?.replace(/\s*\([^)]*\)\s*$/, "");
      const editions = Number(field(document, "edition_count") ?? 0);
      if (!key || !title || editions < MIN_OPEN_LIBRARY_EDITIONS) {
        continue;
      }
      const keys = titleKeys([title]);
      if (keys.some((titleKey) => seen.has(titleKey))) {
        continue;
      }
      keys.forEach((titleKey) => seen.add(titleKey));
      const year = Number(field(document, "first_publish_year"));
      works.push({
        source: "openlibrary",
        externalId: key.replace(/^\/works\//, ""),
        title,
        alternateTitles: [],
        series: null,
        seriesIndex: null,
        year: Number.isInteger(year) ? year : null,
      });
    }
    return works;
  }

  return {
    /** People Wikidata knows under that name; the admin picks the right one, homonyms being common. */
    async searchAuthors(name: string): Promise<AuthorCandidate[]> {
      const response = await fetchJson(
        wikidataUrl({ action: "wbsearchentities", search: name, language: "fr", uselang: "fr", type: "item", limit: "8" }),
      );
      return list(field(response, "search")).flatMap((result) => {
        const wikidataId = text(field(result, "id"));
        const candidateLabel = text(field(result, "label"));
        return wikidataId && candidateLabel ? [{ wikidataId, label: candidateLabel, description: text(field(result, "description")) }] : [];
      });
    },

    /**
     * Everything the author wrote according to Wikidata (which has French titles and series), completed by the
     * Open Library works it does not know. An Open Library failure is not fatal: Wikidata alone is still useful.
     */
    async fetchBibliography(wikidataId: string): Promise<AuthorBibliography> {
      const author = (await fetchEntities([wikidataId])).get(wikidataId);
      const openLibraryKey = statements(author, OPEN_LIBRARY_ID).flatMap((statement) => text(statementValue(statement)) ?? [])[0] ?? null;
      const works = await fetchWikidataWorks(wikidataId);
      if (openLibraryKey) {
        works.push(...(await fetchOpenLibraryWorks(openLibraryKey, works).catch(() => [])));
      }
      return { openLibraryKey, works };
    },
  };
}
