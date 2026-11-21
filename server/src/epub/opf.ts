import path from "node:path";
import { XMLParser } from "fast-xml-parser";

export type OpfMetadata = {
  title: string | null;
  authors: string[];
  language: string | null;
  description: string | null;
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

// Descriptions frequently embed escaped HTML; the catalog only displays plain text.
function toPlainText(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/div|\/li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
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

// Filters group books by primary language ("fr-FR" and "fr" are the same shelf).
function normalizeLanguage(language: string | null): string | null {
  if (!language) {
    return null;
  }
  const primarySubtag = language.trim().toLowerCase().split(/[-_]/)[0];
  return primarySubtag || null;
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
    if (name && !authors.includes(name)) {
      authors.push(name);
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

  return {
    title: firstText(childNodes(metadata, "title")),
    authors: uniqueAuthors(childNodes(metadata, "creator")),
    language: normalizeLanguage(firstText(childNodes(metadata, "language"))),
    description: description ? toPlainText(description) || null : null,
    coverPath: coverHref ? resolveHref(opfPath, coverHref) : null,
    coverMediaType: attribute(coverItem, "media-type"),
  };
}
