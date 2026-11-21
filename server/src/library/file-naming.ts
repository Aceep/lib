import { toSortKey } from "../db/sort-key.js";

/**
 * Target layout on MEGA: `Books/<Letter>/<First Last>/<First Last> - <Title>.epub`. Words are separated by spaces
 * (underscores glue words together for MEGA's and Windows' search), accents are kept, and the characters Windows
 * forbids in file names are replaced.
 */

export type ParsedAuthor = {
  /** "Prénom Nom" */
  display: string;
  /** Upper-case, accent-stripped initial of the family name; "#" when it is not a letter. */
  letter: string;
};

export type NamingDoubt =
  | "no-author"
  | "single-word-author"
  | "author-looks-odd"
  | "author-trimmed"
  | "title-all-caps"
  | "title-had-forbidden-chars"
  | "title-truncated"
  | "name-collision";

export type ProposedName = {
  path: string;
  doubts: NamingDoubt[];
};

// "de Montaigu" stays together, and the letter is M; "Le Clézio" stays together, and the letter is L.
const LOWERCASE_PARTICLES = new Set(["de", "d'", "da", "di", "del", "della", "der", "van", "von", "du", "des", "la", "le"]);
const CAPITALIZED_PARTICLES = new Set(["Le", "La", "Du", "Des", "Van", "Von", "De", "Mac", "Mc", "Saint", "Sainte"]);
const FORBIDDEN_CHARS = /[\\/:*?"<>|]/g;
const MAX_FILE_NAME_LENGTH = 150;

export function decodeEntities(text: string): string {
  // Some OPF files carry HTML entities the XML parser leaves as is ("Tr&#xE9;vidic").
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isAllCaps(text: string): boolean {
  return /\p{Lu}/u.test(text) && !/\p{Ll}/u.test(text);
}

function capitalizeWord(word: string): string {
  // Keeps hyphenated and apostrophe-joined names right: "SAINT-EXUPÉRY" -> "Saint-Exupéry", "D'ORMESSON" -> "D'Ormesson".
  return word.toLowerCase().replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  const first = lower.search(/\p{L}/u);
  return first === -1 ? lower : lower.slice(0, first) + lower[first]!.toUpperCase() + lower.slice(first + 1);
}

function letterOf(name: string): string {
  const key = toSortKey(name);
  return /^[a-z]/.test(key) ? key[0]!.toUpperCase() : "#";
}

/** Family name initial: skips lowercase particles ("de Montaigu" -> M) but not capitalized ones ("Le Clézio" -> L). */
function familyNameLetter(allWords: string[]): string {
  // "(USA)" or "Jr." after an organization or a name do not carry the letter.
  const words = allWords.filter((word) => /^\p{L}/u.test(word));
  if (words.length === 0) {
    return "#";
  }
  let start = words.length - 1;
  while (start > 0 && (LOWERCASE_PARTICLES.has(words[start - 1]!.toLowerCase()) || CAPITALIZED_PARTICLES.has(words[start - 1]!))) {
    start--;
  }
  const firstMeaningful = words.slice(start).find((word) => !LOWERCASE_PARTICLES.has(word)) ?? words[words.length - 1]!;
  return letterOf(firstMeaningful);
}

/** "Aurélien Barrau et Louis Schweitzer" is two authors typed in one field. */
export function splitAuthors(authors: string[]): string[] {
  return authors.flatMap((author) => author.split(/\s+(?:et|&|and)\s+/i)).filter((author) => author.trim() !== "");
}

export function parseAuthor(raw: string): ParsedAuthor & { doubts: NamingDoubt[] } {
  const doubts: NamingDoubt[] = [];
  let name = collapseSpaces(decodeEntities(raw));

  // "David Gemmell - Waylander - 1": series information crept into the author field; keep the name only.
  const dash = name.indexOf(" - ");
  if (dash > 0) {
    name = name.slice(0, dash).trim();
    doubts.push("author-trimmed");
  }

  // "Nom, Prénom" -> "Prénom Nom"
  const comma = name.indexOf(",");
  if (comma !== -1) {
    const family = name.slice(0, comma).trim();
    const given = name.slice(comma + 1).trim();
    name = given ? `${given} ${family}` : family;
  }

  let words = name.split(" ");
  if (isAllCaps(name)) {
    // "STEFAN ZWEIG": nothing tells the family name apart, keep the order and re-case.
    words = words.map(capitalizeWord);
  } else {
    // "Philippe BESSON" or "MAJDALANI Charif": the all-caps word is the family name, moved last and re-cased.
    // Initials ("J.M.G.") and things like "(USA)" are not family names.
    const capsIndex = words.findIndex((word) => /^\p{Lu}[\p{Lu}'’-]+$/u.test(word));
    if (capsIndex !== -1 && words.length > 1) {
      const family = capitalizeWord(words[capsIndex]!);
      words = [...words.slice(0, capsIndex), ...words.slice(capsIndex + 1), family];
    }
  }
  // "Jean-baptiste" -> "Jean-Baptiste": hyphen-joined parts of a name are capitalized, only in words already capitalized
  // so "de", "van" are left alone.
  words = words.map((word) => (/^\p{Lu}/u.test(word) ? word.replace(/-(\p{Ll})/gu, (_, letter: string) => `-${letter.toUpperCase()}`) : word));
  // Initials are upper case: "N.k." -> "N.K.", "f." -> "F.".
  words = words.map((word) => (/^(\p{L}\.)+$/u.test(word) ? word.toUpperCase() : word));
  const display = words.join(" ");

  if (words.length === 1) {
    doubts.push("single-word-author");
  }
  if (/\d|unknown|inconnu|auteur/i.test(display) || !/\p{L}/u.test(display)) {
    doubts.push("author-looks-odd");
  }
  return { display, letter: familyNameLetter(words), doubts };
}

export function cleanTitle(raw: string): { title: string; doubts: NamingDoubt[] } {
  const doubts: NamingDoubt[] = [];
  let title = collapseSpaces(decodeEntities(raw))
    .replace(/\s*\((?:[^()]*\b(?:edition|édition)\b[^()]*)\)\s*$/i, "")
    .replace(/\s*:\s*Roman\b.*$/i, "")
    .trim();
  if (isAllCaps(title)) {
    doubts.push("title-all-caps");
    title = sentenceCase(title);
  }
  if (FORBIDDEN_CHARS.test(title)) {
    doubts.push("title-had-forbidden-chars");
    title = collapseSpaces(
      title
        .replace(/\s*:\s*/g, " - ")
        .replace(/\s*[/\\]\s*/g, " - ")
        .replace(/"/g, "'")
        .replace(/\s*\?/g, "")
        .replace(/[*<>|]/g, ""),
    );
  }
  FORBIDDEN_CHARS.lastIndex = 0;
  // A trailing dot or space is not allowed on Windows either.
  title = title.replace(/[. ]+$/, "");
  return { title, doubts };
}

export function proposeName(metadata: { title: string; authors: string[] }): ProposedName {
  const doubts: NamingDoubt[] = [];
  // The same author is sometimes listed twice with a different casing ("Philippe BESSON", "Philippe Besson").
  const seen = new Set<string>();
  const parsed = splitAuthors(metadata.authors)
    .map(parseAuthor)
    .filter((author) => {
      const key = toSortKey(author.display);
      return seen.has(key) ? false : seen.add(key);
    });
  for (const author of parsed) {
    doubts.push(...author.doubts);
  }
  const { title, doubts: titleDoubts } = cleanTitle(metadata.title);
  doubts.push(...titleDoubts);

  let folder: string;
  let fileName: string;
  if (parsed.length === 0) {
    doubts.push("no-author");
    folder = "Books/_Sans auteur";
    fileName = title;
  } else {
    const first = parsed[0]!;
    const byline = parsed.length > 2 ? `${first.display} et al.` : parsed.map((author) => author.display).join(", ");
    folder = `Books/${first.letter}/${first.display}`;
    fileName = `${byline} - ${title}`;
  }

  if (fileName.length + ".epub".length > MAX_FILE_NAME_LENGTH) {
    doubts.push("title-truncated");
    fileName = fileName.slice(0, MAX_FILE_NAME_LENGTH - ".epub".length - 1).trimEnd() + "…";
  }
  // Metadata come in either Unicode form; one form on disk keeps rclone from seeing "André" and "André" as two names.
  return { path: `${folder}/${fileName}.epub`.normalize("NFC"), doubts: [...new Set(doubts)] };
}
