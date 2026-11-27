import { toSortKey } from "../db/sort-key.js";
import { type FetchJson, fetchJsonOverHttp, SourceError } from "../missing/bibliography-sources.js";
import { titleKey } from "../missing/title-key.js";

export type DescriptionProvider = "google-books" | "openlibrary" | "wikipedia";

export type FoundDescription = {
  text: string;
  provider: DescriptionProvider;
  /** The page the text was taken from, shown to readers as the source. */
  source: string;
};

export type DescribedBook = {
  title: string;
  authors: string[];
  language: string | null;
};

export type LookupResult = {
  found: FoundDescription | null;
  /** False when a source was down: "not found" is then not the last word. */
  complete: boolean;
  /** Why sources failed during this lookup, for the logs. */
  errors: string[];
};

const GOOGLE_BOOKS = "https://www.googleapis.com/books/v1/volumes";
const OPEN_LIBRARY = "https://openlibrary.org";
// Shorter than this, a text is a tagline or a catalogue note, not a summary.
const MIN_LENGTH = 80;
const MAX_LENGTH = 4000;
const SOURCE_REST_MS = 15 * 60 * 1000;
const HOST_INTERVAL_MS = 1000;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function field(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (!isObject(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

export function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

const HTML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Google Books and Wikipedia both return HTML fragments where a summary should be plain text. */
export function toPlainText(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/div|\/li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      }
      if (code.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
      }
      return HTML_ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Open Library descriptions end with the editors' own notes: a rule, "([source][1])" and reference links. Some
 * are nothing but a note ("Full text available online at ...").
 */
function trimOpenLibraryNotes(description: string): string {
  const body = description
    .split(/\n-{3,}\n|\s*\(\[source\]|\n\[1\]:/)[0]!
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s*\(\[[^\]]*\]\[\d+\]\)/g, "")
    .trim();
  return /^(full text|see also|also (contained|published)|contains?:|source:|this (edition|book|work) (is|was))/i.test(body) ? "" : body;
}

// Words the short description of a Wikipedia article about a book contains; a film or a song adapted from it does not.
const BOOK_PAGE = /\b(roman|livre|essai|nouvelle|recueil|pièce|poème|poésie|récit|biographie|autobiographie|ouvrage|manga|bande dessinée|conte|théâtre|mémoires|novel|book|memoir|play|short stor|poem|essay|non-?fiction)/i;

const FRENCH_WORDS = /\b(le|la|les|des|une|est|dans|pour|qui|avec|sur)\b/gi;
const ENGLISH_WORDS = /\b(the|and|of|with|his|her|is|from|that)\b/gi;

/** A French book deserves a French summary; an English one found first only serves when nothing else turns up. */
function fitsLanguage(description: string, book: DescribedBook): boolean {
  if (book.language !== "fr") {
    return true;
  }
  return (description.match(FRENCH_WORDS)?.length ?? 0) >= (description.match(ENGLISH_WORDS)?.length ?? 0);
}

function usable(description: string | null): string | null {
  if (!description || description.length < MIN_LENGTH) {
    return null;
  }
  return description.length > MAX_LENGTH ? `${description.slice(0, MAX_LENGTH).replace(/\s+\S*$/, "")}…` : description;
}

/** Lower-case, unaccented words, punctuation gone: "HERBERT, Frank" → ["herbert", "frank"]. */
function words(value: string): string[] {
  return toSortKey(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== "");
}

/**
 * The family name, which is what every source agrees on: the last word of "Frank Herbert", the part before
 * the comma of "Herbert, Frank". Particles and initials are too short to count.
 */
export function surnames(authors: string[]): string[] {
  return [
    ...new Set(
      authors.flatMap((author) => {
        const family = words(author.includes(",") ? author.split(",")[0]! : author).filter((word) => word.length >= 3);
        return family.length > 0 ? [family[family.length - 1]!] : [];
      }),
    ),
  ];
}

/** True when the candidate credits one of the book's authors: the same family name somewhere in the names. */
export function creditsAuthor(candidateAuthors: string[], book: DescribedBook): boolean {
  const wanted = surnames(book.authors);
  if (wanted.length === 0) {
    // Nothing to check against: only an exact title match (verified by the caller) can be trusted.
    return true;
  }
  const credited = words(candidateAuthors.join(" "));
  return wanted.some((surname) => credited.includes(surname));
}

/** True when the candidate is called like the book, a subtitle aside ("La Locataire : thriller"). */
export function sameTitle(candidateTitle: string, book: DescribedBook): boolean {
  const wanted = titleKey(book.title);
  const candidate = titleKey(candidateTitle);
  return wanted !== "" && (candidate === wanted || candidate.startsWith(`${wanted} `));
}

function wikipediaHost(language: string | null): string {
  // Readers here read French; an English book still gets its French article when there is one.
  return language === "en" ? "en.wikipedia.org" : "fr.wikipedia.org";
}

export type DescriptionSources = ReturnType<typeof createDescriptionSources>;

/**
 * Looks a book's summary up, source after source, until one returns a text that is about this very book:
 * same title, an author in common. Google Books has the publishers' blurbs but wants an API key beyond a
 * few anonymous requests a day; Open Library covers English books; Wikipedia has the classics.
 */
export function createDescriptionSources({ fetchJson: rawFetchJson = fetchJsonOverHttp, googleBooksApiKey = null }: { fetchJson?: FetchJson; googleBooksApiKey?: string | null } = {}) {
  // Open Library answers 503 and Wikipedia 429 when asked several times a second: one request per second per host.
  const nextSlotByHost = new Map<string, number>();
  const fetchJson: FetchJson = async (url) => {
    const host = new URL(url).hostname;
    const slot = Math.max(Date.now(), nextSlotByHost.get(host) ?? 0);
    nextSlotByHost.set(host, slot + HOST_INTERVAL_MS);
    await new Promise((resolve) => setTimeout(resolve, slot - Date.now()));
    return rawFetchJson(url);
  };

  async function fromGoogleBooks(book: DescribedBook): Promise<FoundDescription | null> {
    const surname = surnames(book.authors)[0];
    const parameters: Record<string, string> = {
      q: surname ? `intitle:"${book.title}" inauthor:"${surname}"` : `intitle:"${book.title}"`,
      maxResults: "10",
      printType: "books",
      ...(book.language ? { langRestrict: book.language } : {}),
      ...(googleBooksApiKey ? { key: googleBooksApiKey } : {}),
    };
    const response = await fetchJson(`${GOOGLE_BOOKS}?${new URLSearchParams(parameters)}`);
    for (const item of list(field(response, "items"))) {
      const volume = field(item, "volumeInfo");
      const title = text(field(volume, "title"));
      const authors = list(field(volume, "authors")).flatMap((author) => text(author) ?? []);
      const description = usable(toPlainText(text(field(volume, "description")) ?? ""));
      if (title && description && sameTitle(title, book) && creditsAuthor(authors, book)) {
        return { text: description, provider: "google-books", source: text(field(volume, "infoLink")) ?? `https://books.google.com/books?id=${text(field(item, "id")) ?? ""}` };
      }
    }
    return null;
  }

  async function fromOpenLibrary(book: DescribedBook): Promise<FoundDescription | null> {
    const parameters: Record<string, string> = { title: book.title, fields: "key,title,author_name", limit: "5" };
    const surname = surnames(book.authors)[0];
    if (surname) {
      parameters.author = surname;
    }
    const response = await fetchJson(`${OPEN_LIBRARY}/search.json?${new URLSearchParams(parameters)}`);
    for (const document of list(field(response, "docs"))) {
      const key = text(field(document, "key"));
      const title = text(field(document, "title"));
      const authors = list(field(document, "author_name")).flatMap((author) => text(author) ?? []);
      if (!key || !title || !sameTitle(title, book) || !creditsAuthor(authors, book)) {
        continue;
      }
      const work = await fetchJson(`${OPEN_LIBRARY}${key}.json`);
      const raw = text(field(work, "description")) ?? text(field(work, "description", "value"));
      const description = usable(raw ? trimOpenLibraryNotes(toPlainText(raw)) : null);
      if (description) {
        return { text: description, provider: "openlibrary", source: `${OPEN_LIBRARY}${key}` };
      }
    }
    return null;
  }

  async function fromWikipedia(book: DescribedBook): Promise<FoundDescription | null> {
    const host = wikipediaHost(book.language);
    const surname = surnames(book.authors)[0];
    const search = await fetchJson(
      `https://${host}/w/api.php?${new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: `intitle:"${book.title}" ${surname ?? ""}`.trim(),
        srlimit: "5",
        format: "json",
      })}`,
    );
    for (const result of list(field(search, "query", "search"))) {
      const pageTitle = text(field(result, "title"));
      if (!pageTitle || !sameTitle(pageTitle, book)) {
        continue;
      }
      const summary = await fetchJson(`https://${host}/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`);
      // A disambiguation page is a list of homonyms; the article of the book names its author in its first lines.
      if (text(field(summary, "type")) !== "standard") {
        continue;
      }
      const extract = usable(toPlainText(text(field(summary, "extract")) ?? ""));
      // "roman de Fred Vargas" is the book; "téléfilm français adapté du roman de Fred Vargas" is not.
      const about = text(field(summary, "description")) ?? (extract ?? "").slice(0, 200);
      const introduces = surname ? words(extract ?? "").includes(surname) : true;
      if (extract && introduces && BOOK_PAGE.test(about)) {
        return { text: extract, provider: "wikipedia", source: text(field(summary, "content_urls", "desktop", "page")) ?? `https://${host}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}` };
      }
    }
    return null;
  }

  // Anonymous Google Books requests share one quota with the whole internet and are refused most of the day.
  type Lookup = [DescriptionProvider, (book: DescribedBook) => Promise<FoundDescription | null>];
  const lookups: Lookup[] = [
    ...(googleBooksApiKey ? ([["google-books", fromGoogleBooks]] satisfies Lookup[]) : []),
    ["openlibrary", fromOpenLibrary],
    ["wikipedia", fromWikipedia],
  ];
  // A source that is down or rate-limiting is left alone for a while; the others go on answering.
  const unavailableUntil = new Map<DescriptionProvider, number>();

  return {
    /**
     * The first summary a source gives for this book. A failing source is skipped and rested for a while, and
     * the lookup is then `complete: false`: nothing was found, but not every source could be asked. Throws once
     * no source is left to ask.
     */
    async find(book: DescribedBook): Promise<LookupResult> {
      const errors: string[] = [];
      let complete = true;
      let asked = 0;
      // A summary in the wrong language: kept aside in case the remaining sources have nothing better.
      let fallback: FoundDescription | null = null;
      for (const [provider, lookup] of lookups) {
        if ((unavailableUntil.get(provider) ?? 0) > Date.now()) {
          complete = false;
          continue;
        }
        asked++;
        try {
          const found = await lookup(book);
          if (found && fitsLanguage(found.text, book)) {
            return { found, complete: true, errors };
          }
          fallback ??= found;
        } catch (error) {
          if (!(error instanceof SourceError)) {
            throw error;
          }
          unavailableUntil.set(provider, Date.now() + SOURCE_REST_MS);
          errors.push(error.message);
          complete = false;
        }
      }
      if (asked === 0) {
        throw new SourceError("aucune source de résumés n'est joignable pour l'instant, réessayez dans un quart d'heure");
      }
      // The fallback only settles the matter once every source has had its say.
      return { found: complete ? fallback : null, complete, errors };
    },
  };
}
