import path from "node:path";
import { XMLParser } from "fast-xml-parser";

export type OpfMetadata = {
  title: string | null;
  authors: string[];
  language: string | null;
  description: string | null;
  series: string | null;
  /** Position in the series; fractional for the odd "tome 1.5" novella. */
  seriesIndex: number | null;
  coverPath: string | null;
  coverMediaType: string | null;
};

type XmlNode = Record<string, unknown>;

const ALWAYS_ARRAY_TAGS = new Set(["rootfile", "title", "creator", "language", "description", "meta", "item"]);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (tagName) => ALWAYS_ARRAY_TAGS.has(tagName),
});

function isXmlNode(value: unknown): value is XmlNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function childNode(node: unknown, key: string): XmlNode | null {
  if (!isXmlNode(node)) {
    return null;
  }
  const child = node[key];
  return isXmlNode(child) ? child : null;
}

function childNodes(node: unknown, key: string): unknown[] {
  if (!isXmlNode(node)) {
    return [];
  }
  const children = node[key];
  return Array.isArray(children) ? children : [];
}

function attribute(node: unknown, name: string): string | null {
  if (!isXmlNode(node)) {
    return null;
  }
  const value = node[`@_${name}`];
  return typeof value === "string" ? value : null;
}

function textContent(node: unknown): string | null {
  if (typeof node === "string") {
    return node.trim() || null;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (isXmlNode(node)) {
    return textContent(node["#text"]);
  }
  return null;
}

function firstText(nodes: unknown[]): string | null {
  for (const node of nodes) {
    const text = textContent(node);
    if (text) {
      return text;
    }
  }
  return null;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// Some tools double-escape metadata ("Tr&amp;#xE9;vidic"), which the XML parser rightly leaves as "Tr&#xE9;vidic".
function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return HTML_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

// Descriptions frequently embed escaped HTML; the catalog only displays plain text.
function toPlainText(html: string): string {
  return decodeEntities(html.replace(/<\s*(br|\/p|\/div|\/li)\b[^>]*>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ISO 639-2 codes some tools write where EPUB expects the two-letter one.
const THREE_LETTER_LANGUAGES: Record<string, string> = {
  fre: "fr",
  fra: "fr",
  eng: "en",
  ita: "it",
  spa: "es",
  deu: "de",
  ger: "de",
  por: "pt",
  nld: "nl",
  dut: "nl",
};
// "Undetermined", "no linguistic content", "multiple": none of them is a language to file a book under.
const NOT_A_LANGUAGE = new Set(["und", "zxx", "mul", "unknown"]);

// Filters group books by primary language ("fr-FR", "fre" and "fr" are the same shelf).
export function normalizeLanguage(language: string | null): string | null {
  if (!language) {
    return null;
  }
  const primarySubtag = language.trim().toLowerCase().split(/[-_]/)[0] ?? "";
  if (primarySubtag === "" || NOT_A_LANGUAGE.has(primarySubtag)) {
    return null;
  }
  return THREE_LETTER_LANGUAGES[primarySubtag] ?? primarySubtag;
}

function uniqueAuthors(creators: unknown[]): string[] {
  const authors: string[] = [];
  for (const creator of creators) {
    const role = attribute(creator, "role");
    // EPUB2 marks illustrators, translators... with opf:role; only "aut" (or no role) is an author.
    if (role && role !== "aut") {
      continue;
    }
    const name = textContent(creator);
    const decoded = name ? decodeEntities(name) : null;
    if (decoded && !authors.includes(decoded)) {
      authors.push(decoded);
    }
  }
  return authors;
}

function resolveHref(opfPath: string, href: string): string {
  const opfDirectory = path.posix.dirname(opfPath);
  const hrefWithoutFragment = href.split("#")[0] ?? href;
  let decodedHref = hrefWithoutFragment;
  try {
    decodedHref = decodeURIComponent(hrefWithoutFragment);
  } catch {
    // A stray "%" in a hand-written OPF is not an encoding: keep the href as written.
  }
  return path.posix.normalize(path.posix.join(opfDirectory, decodedHref));
}

function findCoverItem(metadata: XmlNode | null, manifestItems: unknown[]): unknown {
  const epub3Cover = manifestItems.find((item) => attribute(item, "properties")?.split(/\s+/).includes("cover-image"));
  if (epub3Cover) {
    return epub3Cover;
  }

  const coverMeta = childNodes(metadata, "meta").find((meta) => attribute(meta, "name") === "cover");
  const coverId = attribute(coverMeta, "content");
  const epub2Cover = coverId ? manifestItems.find((item) => attribute(item, "id") === coverId) : undefined;
  if (epub2Cover) {
    return epub2Cover;
  }

  return manifestItems.find(
    (item) => attribute(item, "media-type")?.startsWith("image/") && /cover/i.test(attribute(item, "id") ?? ""),
  );
}

/**
 * Calibre writes <meta name="calibre:series" content="…"/> with calibre:series_index next to it; EPUB3 has
 * <meta property="belongs-to-collection" id="c">…</meta> refined by <meta refines="#c" property="group-position">.
 */
function findSeries(metadata: XmlNode | null): { series: string | null; seriesIndex: number | null } {
  const metas = childNodes(metadata, "meta");
  const toIndex = (raw: string | null): number | null => {
    const value = raw === null ? Number.NaN : Number(raw.replace(",", "."));
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const named = (name: string) => attribute(metas.find((meta) => attribute(meta, "name") === name), "content");

  const calibreSeries = named("calibre:series")?.trim();
  if (calibreSeries) {
    return { series: decodeEntities(calibreSeries), seriesIndex: toIndex(named("calibre:series_index")) };
  }

  const collection = metas.find((meta) => attribute(meta, "property") === "belongs-to-collection" && textContent(meta));
  const collectionName = textContent(collection);
  if (!collectionName) {
    return { series: null, seriesIndex: null };
  }
  const collectionId = attribute(collection, "id");
  const position = collectionId
    ? metas.find((meta) => attribute(meta, "property") === "group-position" && attribute(meta, "refines") === `#${collectionId}`)
    : undefined;
  return { series: decodeEntities(collectionName), seriesIndex: toIndex(textContent(position)) };
}

export function parseContainer(containerXml: string): string | null {
  const document: unknown = xmlParser.parse(containerXml);
  const rootfiles = childNodes(childNode(childNode(document, "container"), "rootfiles"), "rootfile");
  const opfRootfile =
    rootfiles.find((rootfile) => attribute(rootfile, "media-type") === "application/oebps-package+xml") ?? rootfiles[0];
  return attribute(opfRootfile, "full-path");
}

export function parseOpf(opfXml: string, opfPath: string): OpfMetadata {
  const document: unknown = xmlParser.parse(opfXml);
  const packageNode = childNode(document, "package");
  const metadata = childNode(packageNode, "metadata");
  const manifestItems = childNodes(childNode(packageNode, "manifest"), "item");

  const description = firstText(childNodes(metadata, "description"));
  const coverItem = findCoverItem(metadata, manifestItems);
  const coverHref = attribute(coverItem, "href");

  const title = firstText(childNodes(metadata, "title"));
  return {
    title: title ? decodeEntities(title) : null,
    authors: uniqueAuthors(childNodes(metadata, "creator")),
    language: normalizeLanguage(firstText(childNodes(metadata, "language"))),
    description: description ? toPlainText(description) || null : null,
    ...findSeries(metadata),
    coverPath: coverHref ? resolveHref(opfPath, coverHref) : null,
    coverMediaType: attribute(coverItem, "media-type"),
  };
}
