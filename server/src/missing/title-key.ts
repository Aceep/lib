import { toSortKey } from "../db/sort-key.js";

const LEADING_ARTICLE = /^(?:le|la|les|l|un|une|des|the|a|an)\s+/;
const TRAILING_PARENTHESIS = /\s*[(\[][^)\]]*[)\]]\s*$/;
// File names turned titles put the series and a volume number first: "L'Assassin royal, tome 1 : L'Apprenti assassin",
// "L'Assassin Royal-10-Serments et Deuils", "L'assassin royal [001] – L'apprenti assassin", "Dune, 03. Les enfants de Dune".
// What follows the number and its separator is the book's own title.
const VOLUME_PREFIX = /^.*?(?:\[\d+\]|\d+)\s*[.:–—-]\s*(\p{L}.*)$/u;

/**
 * The same key for the same title however it was typed: case, accents, punctuation, a leading article and a
 * trailing parenthesis fold away ("L'Assassin du roi", "Assassin du Roi (poche)" both give "assassin du roi").
 */
export function titleKey(title: string): string {
  return toSortKey(title.replace(TRAILING_PARENTHESIS, ""))
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(LEADING_ARTICLE, "");
}

export function titleKeys(titles: string[]): string[] {
  return [...new Set(titles.map(titleKey).filter((key) => key !== ""))];
}

/**
 * Keys a book of the library answers to. Deliberately narrow: wrongly deciding a book is owned would hide a
 * missing one, while a wrong "missing" is one click to dismiss.
 */
export function libraryTitleKeys(title: string): string[] {
  const ownTitle = VOLUME_PREFIX.exec(title.replace(TRAILING_PARENTHESIS, ""))?.[1];
  return titleKeys(ownTitle ? [title, ownTitle] : [title]);
}
