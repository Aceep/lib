import { toSortKey } from "../db/sort-key.js";

const LEADING_ARTICLE = /^(?:le|la|les|l|un|une|des|the)\s+/;
// Words that introduce a series without naming it: "Commissaire Adamsberg", "Saga Drenaï", "Cycle de Dune".
const INTRODUCERS = /^(?:(?:commissaire|capitaine|commandant|inspecteur|lieutenant|detective)\s+|(?:saga|cycle|serie|trilogie|chroniques|aventures)\s+(?:(?:de|du|des|d)\s+)?(?:la\s+|le\s+|les\s+|l\s+)?)/;
const SMALL_WORDS = new Set(["de", "du", "la", "le", "et", "en", "un", "au", "of", "a", "d", "l"]);

/**
 * The same key for one series however it was typed: "J.B. Adamsberg", "JB Adamsberg" and "Commissaire Adamsberg"
 * all give "adamsberg"; "Sharko & Henebelle" and "Sharko et Henebelle" give the same. Different series of one
 * universe stay apart: "Dune", "Avant Dune" and "Dune : Chroniques de Caladan" have three keys.
 */
export function seriesKey(series: string): string {
  let key = toSortKey(series)
    .replace(/&/g, " et ")
    .replace(/\(.*?\)/g, " ")
    // "j.b." is one set of initials, not two words.
    .replace(/\b(\p{L})\.\s*(?=\p{L}\b)/gu, "$1")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  key = key.replace(LEADING_ARTICLE, "").replace(INTRODUCERS, "").replace(LEADING_ARTICLE, "");
  const words = key.split(" ");
  // Initials before a name ("jb adamsberg") do not tell two series apart.
  const withoutInitials = words.filter((word, index) => index === words.length - 1 || word.length > 2 || SMALL_WORDS.has(word) || /\d/.test(word));
  return (withoutInitials.length > 0 ? withoutInitials : words).join(" ");
}

/** True when the two keys differ by one letter added, dropped or changed: "assasin royal" / "assassin royal". */
export function isOneTypoAway(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) > 1 || Math.min(left.length, right.length) < 8) {
    return false;
  }
  const [short, long] = left.length <= right.length ? [left, right] : [right, left];
  let index = 0;
  while (index < short.length && short[index] === long[index]) {
    index++;
  }
  return short.length === long.length ? short.slice(index + 1) === long.slice(index + 1) : short.slice(index) === long.slice(index + 1);
}

const MARKER_WORDS = new Set(["tome", "volume", "vol", "livre", "book", "integrale", "epub", "epub commercial", "serie", "collection", "roman"]);

/**
 * Why a series read in a file is probably not one, or null. Tools write the publisher's collection, a
 * placeholder or the word "Tome" where a series is expected.
 */
export function doubtfulSeriesReason(series: string, indexes: (number | null)[]): string | null {
  const key = toSortKey(series).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (key.replace(/[^\p{L}]/gu, "").length < 2) {
    return "le nom ne contient pas de mot";
  }
  if (MARKER_WORDS.has(key)) {
    return "ce n'est pas un nom de série";
  }
  const numbers = indexes.filter((index): index is number => index !== null);
  if (numbers.length > 0 && numbers.every((index) => index > 60)) {
    return "les numéros ressemblent à une année ou à un numéro de collection";
  }
  return null;
}
