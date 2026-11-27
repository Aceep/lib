import { creditsAuthor, type DescribedBook, field, list, sameTitle, surnames, text } from "../descriptions/description-sources.js";
import { type FetchJson, fetchJsonOverHttp, REQUEST_TIMEOUT_MS, SourceError, USER_AGENT } from "../missing/bibliography-sources.js";

export type CoverProvider = "openlibrary" | "google-books";

/** Image formats a browser shows everywhere, with the extension the file is saved under. */
export const COVER_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type FetchedImage = { data: Buffer; mediaType: string };

/** Null when there is no image at that address; throws SourceError when the host is down or rate-limiting. */
export type FetchImage = (url: string) => Promise<FetchedImage | null>;

export type FoundCover = FetchedImage & {
  provider: CoverProvider;
  /** The page describing the book the image belongs to. */
  source: string;
};

export type CoverLookupResult = {
  found: FoundCover | null;
  /** False when a source was down: "not found" is then not the last word. */
  complete: boolean;
  /** Why sources failed during this lookup, for the logs. */
  errors: string[];
};

const GOOGLE_BOOKS = "https://www.googleapis.com/books/v1/volumes";
const OPEN_LIBRARY = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org";
// Below this an image is an icon or a "no cover" placeholder; above it, not a cover worth storing.
const MIN_IMAGE_BYTES = 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SOURCE_REST_MS = 15 * 60 * 1000;
const HOST_INTERVAL_MS = 1000;
// Google Books names its sizes; the search results usually carry only the two smallest.
const GOOGLE_IMAGE_SIZES = ["extraLarge", "large", "medium", "small", "thumbnail", "smallThumbnail"];

export async function fetchImageOverHttp(url: string): Promise<FetchedImage | null> {
  const host = new URL(url).hostname;
  let response: Response;
  try {
    response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "image/*" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new SourceError(`${host} est injoignable (${(error as Error).message})`);
  }
  if (response.status === 404) {
    return null;
  }
  if (response.status === 429) {
    throw new SourceError(`${host} limite le débit pour l'instant, réessayez dans quelques minutes`);
  }
  if (!response.ok) {
    throw new SourceError(`${host} a répondu ${response.status}`);
  }
  if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) {
    return null;
  }
  const mediaType = (response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  return { data: Buffer.from(await response.arrayBuffer()), mediaType };
}

function acceptable(image: FetchedImage | null): image is FetchedImage {
  return image !== null && image.mediaType in COVER_EXTENSIONS && image.data.length >= MIN_IMAGE_BYTES && image.data.length <= MAX_IMAGE_BYTES;
}

/** Google Books hands out http links and a curled-page effect; the plain image over https is the same picture. */
function cleanGoogleImageUrl(url: string): string {
  return url.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
}

export type CoverSources = ReturnType<typeof createCoverSources>;

/**
 * Looks a book's cover up, source after source, until one has an image of this very book: same title, an author
 * in common, the rules the summaries follow. Open Library first for its large scans, then Google Books.
 */
export function createCoverSources({
  fetchJson: rawFetchJson = fetchJsonOverHttp,
  fetchImage: rawFetchImage = fetchImageOverHttp,
  googleBooksApiKey = null,
}: { fetchJson?: FetchJson; fetchImage?: FetchImage; googleBooksApiKey?: string | null } = {}) {
  // The same courtesy as the summaries: one request per second per host.
  const nextSlotByHost = new Map<string, number>();
  async function waitForSlot(url: string): Promise<void> {
    const host = new URL(url).hostname;
    const slot = Math.max(Date.now(), nextSlotByHost.get(host) ?? 0);
    nextSlotByHost.set(host, slot + HOST_INTERVAL_MS);
    await new Promise((resolve) => setTimeout(resolve, slot - Date.now()));
  }
  const fetchJson: FetchJson = async (url) => {
    await waitForSlot(url);
    return rawFetchJson(url);
  };
  const fetchImage: FetchImage = async (url) => {
    await waitForSlot(url);
    return rawFetchImage(url);
  };

  async function fromOpenLibrary(book: DescribedBook): Promise<FoundCover | null> {
    const parameters: Record<string, string> = { title: book.title, fields: "key,title,author_name,cover_i", limit: "5" };
    const surname = surnames(book.authors)[0];
    if (surname) {
      parameters.author = surname;
    }
    const response = await fetchJson(`${OPEN_LIBRARY}/search.json?${new URLSearchParams(parameters)}`);
    for (const document of list(field(response, "docs"))) {
      const key = text(field(document, "key"));
      const title = text(field(document, "title"));
      const coverId = field(document, "cover_i");
      const authors = list(field(document, "author_name")).flatMap((author) => text(author) ?? []);
      if (!key || !title || typeof coverId !== "number" || !sameTitle(title, book) || !creditsAuthor(authors, book)) {
        continue;
      }
      // default=false makes a missing scan a 404 instead of a blank placeholder.
      const image = await fetchImage(`${OPEN_LIBRARY_COVERS}/b/id/${coverId}-L.jpg?default=false`);
      if (acceptable(image)) {
        return { ...image, provider: "openlibrary", source: `${OPEN_LIBRARY}${key}` };
      }
    }
    return null;
  }

  async function fromGoogleBooks(book: DescribedBook): Promise<FoundCover | null> {
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
      const imageUrl = GOOGLE_IMAGE_SIZES.map((size) => text(field(volume, "imageLinks", size))).find((url) => url !== null);
      if (!title || !imageUrl || !sameTitle(title, book) || !creditsAuthor(authors, book)) {
        continue;
      }
      const image = await fetchImage(cleanGoogleImageUrl(imageUrl));
      if (acceptable(image)) {
        return { ...image, provider: "google-books", source: text(field(volume, "infoLink")) ?? `https://books.google.com/books?id=${text(field(item, "id")) ?? ""}` };
      }
    }
    return null;
  }

  type Lookup = [CoverProvider, (book: DescribedBook) => Promise<FoundCover | null>];
  // Anonymous Google Books requests share one quota with the whole internet and are refused most of the day.
  const lookups: Lookup[] = [["openlibrary", fromOpenLibrary], ...(googleBooksApiKey ? ([["google-books", fromGoogleBooks]] satisfies Lookup[]) : [])];
  // A source that is down or rate-limiting is left alone for a while; the others go on answering.
  const unavailableUntil = new Map<CoverProvider, number>();

  return {
    /**
     * The first acceptable cover a source has for this book. A failing source is skipped and rested for a while,
     * and the lookup is then `complete: false`. Throws once no source is left to ask.
     */
    async find(book: DescribedBook): Promise<CoverLookupResult> {
      const errors: string[] = [];
      let complete = true;
      let asked = 0;
      for (const [provider, lookup] of lookups) {
        if ((unavailableUntil.get(provider) ?? 0) > Date.now()) {
          complete = false;
          continue;
        }
        asked++;
        try {
          const found = await lookup(book);
          if (found) {
            return { found, complete: true, errors };
          }
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
        throw new SourceError("aucune source de couvertures n'est joignable pour l'instant, réessayez dans un quart d'heure");
      }
      return { found: null, complete, errors };
    },
  };
}
