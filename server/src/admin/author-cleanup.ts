import { toSortKey } from "../db/sort-key.js";
import { parseAuthor } from "../library/file-naming.js";

const LOWERCASE_PARTICLES = new Set(["de", "d'", "da", "di", "del", "della", "der", "van", "von", "du", "des", "la", "le"]);
const CAPITALIZED_PARTICLES = new Set(["Le", "La", "Du", "Des", "Van", "Von", "De", "Mac", "Mc", "Saint", "Sainte"]);
const TITLE_ARTICLES = new Set(["le", "la", "les", "un", "une", "des", "the", "a", "an"]);

function splitFamilyName(name: string): { family: string; given: string } {
  const words = parseAuthor(name).display.split(" ").filter((word) => word !== "");
  let start = words.length - 1;
  while (start > 0 && (LOWERCASE_PARTICLES.has(words[start - 1]!.toLowerCase()) || CAPITALIZED_PARTICLES.has(words[start - 1]!))) {
    start--;
  }
  // "de Gaulle" files under G, "Le Carré" under L.
  while (start < words.length - 1 && LOWERCASE_PARTICLES.has(words[start]!)) {
    start++;
  }
  return { family: words.slice(start).join(" "), given: words.slice(0, start).join(" ") };
}

/**
 * Key that orders authors by family name: "Frank Herbert" -> "herbert frank", "Charles de Gaulle" -> "gaulle charles de",
 * "John Le Carré" -> "le carre john". A name typed "Herbert, Frank" gets the same key.
 */
export function authorSortKey(name: string): string {
  const { family, given } = splitFamilyName(name);
  return toSortKey(`${family} ${given}`);
}

/** The name as an index lists it: "Herbert, Frank", "Gaulle, Charles de", "Colette". */
export function authorListName(name: string): string {
  const { family, given } = splitFamilyName(name);
  return given ? `${family}, ${given}` : family;
}

const wordCount = (text: string) => text.trim().split(/\s+/).length;

/**
 * The people an author field names, each as "Prénom Nom": "Atwood, Margaret" is one person typed family name
 * first, "Aurélien Barrau et Louis Schweitzer" and "Florence BRAUNSTEIN, Jean-François PEPIN" are two.
 */
export function peopleInAuthorField(field: string): string[] {
  const people: string[] = [];
  // "Herbert,Frank-Ransom,Bill": two "Nom,Prénom" joined by a hyphen.
  const joined = /^([^,-]+,[^,-]+)-([^,-]+,[^,-]+)$/.exec(field);
  const chunks = joined ? [joined[1]!, joined[2]!] : field.split(/\s+(?:et|and)\s+|\s*[&;/]\s*/i);
  for (const chunk of chunks) {
    const parts = chunk.split(",").map((part) => part.trim()).filter((part) => part !== "");
    const familyFirstPairs = parts.length % 2 === 0 && parts.every((part, index) => index % 2 === 1 || wordCount(part) === 1);
    if (familyFirstPairs) {
      // "Herbert, Brian , Anderson, Kevin J."
      for (let index = 0; index < parts.length; index += 2) {
        people.push(`${parts[index]}, ${parts[index + 1]}`);
      }
    } else if (parts.length === 2 && wordCount(parts[1]!) === 1) {
      // "Le Carré, John"
      people.push(`${parts[0]}, ${parts[1]}`);
    } else {
      people.push(...parts);
    }
  }
  const seen = new Set<string>();
  return people
    .map((person) => parseAuthor(person).display)
    .filter((person) => person !== "" && !seen.has(toSortKey(person)) && Boolean(seen.add(toSortKey(person))));
}

/**
 * "Auster Paul": no comma says the family name comes first, but "Paul" opens other authors' names and "Auster"
 * opens none. `firstWords` and `lastWords` count how many authors of the library start and end with each word. Only a guess: "Patrice
 * Jean" is a real name in that order.
 */
export function givenNameLast(name: string, firstWords: Map<string, number>, lastWords: Map<string, number>): string | null {
  const words = name.trim().split(/\s+/);
  if (words.length !== 2 || /[,.\d]/.test(name)) {
    return null;
  }
  const [first, last] = words as [string, string];
  const count = (counts: Map<string, number>, word: string) => counts.get(toSortKey(word)) ?? 0;
  // The name itself accounts for one use of its first word and one of its last. A last word shared with another
  // author is a family name ("Frank Herbert", "Brian Herbert"); a hyphenated first word is a given name.
  const looksReversed = count(firstWords, last) >= 1 && count(firstWords, first) <= 1 && count(lastWords, last) <= 1 && !first.includes("-");
  return looksReversed ? `${last} ${first}` : null;
}

function looksLikePersonName(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4 || /\d|[:!?()[\]–—,]| - /.test(text) || /^[ldjnsc]['’]/i.test(text) || TITLE_ARTICLES.has(toSortKey(words[0]!))) {
    return false;
  }
  return words.every((word) => /^\p{Lu}/u.test(word) || LOWERCASE_PARTICLES.has(word.toLowerCase()));
}

function looksLikeTitle(text: string): boolean {
  const words = text.trim().split(/\s+/);
  return /\d/.test(text) || words.length > 4 || words.length === 1 || TITLE_ARTICLES.has(toSortKey(words[0]!)) || /^[ldjnsc]['’]/i.test(text);
}

/**
 * A book whose title and author were swapped by whatever tagged the file: the title is "Laurent Gaudé", the
 * author "Chien 51". Returns the people named by the title, or null when nothing looks swapped.
 */
export function swappedTitlePeople(title: string, authors: string[], isKnownAuthor: (name: string) => boolean): string[] | null {
  if (authors.length !== 1 || toSortKey(authors[0]!) === toSortKey(title)) {
    return null;
  }
  const people = title.split(/\s+(?:et|and|&)\s+/i).map((person) => person.trim());
  if (!people.every(looksLikePersonName)) {
    return null;
  }
  return people.some(isKnownAuthor) || looksLikeTitle(authors[0]!) ? people : null;
}
