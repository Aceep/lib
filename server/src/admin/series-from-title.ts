export type TitleSeries = {
  series: string;
  seriesIndex: number;
  /** The book's own title once the series and the volume number are taken out; null when nothing else is left. */
  title: string | null;
};

const ROMAN_NUMERALS: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

const STORE_SUFFIX = /\s*\((?:french|english) edition\)\s*$/i;
const MARKER = String.raw`(?:tome|vol(?:ume)?\.?|livre|book|épisode|episode|(?:l['’])?intégrale|T\.?(?=\s?\d))`;
const NUMBER = String.raw`(\d{1,3}|[IVX]{1,4})`;
const SEPARATOR = String.raw`\s*[-–—:,.]?\s*`;

// "Too Like the Lightning (Terra Ignota Book 1)"
const SERIES_IN_PARENTHESIS = new RegExp(String.raw`^(.+?)\s*\((.*\p{L}.*?)${SEPARATOR}${MARKER}\s*${NUMBER}\)$`, "iu");
// "Mémoires de guerre (Tome 1)", "Histoire intime de la Ve République (Tome 1) - Le sursaut"
const VOLUME_IN_PARENTHESIS = new RegExp(String.raw`^(.+?)\s*\((?:[^()]*?${SEPARATOR})?${MARKER}\s*${NUMBER}\)(?:${SEPARATOR}(\p{L}.*))?$`, "iu");
// "Le Livre des Martyrs T10 Le dieu estropié", "L'échiquier du mal - Tome 1", "Dune : Chroniques de Caladan T2 : La Dame"
const MARKED_VOLUME = new RegExp(String.raw`^(.*\p{L}.*?)${SEPARATOR}(?<![\p{L}\p{N}'’])${MARKER}\s*${NUMBER}(?![\p{L}\p{N}])(?:${SEPARATOR}(\p{L}.*))?$`, "iu");
// "Dune, 03. Les enfants de Dune", "L'Assassin Royal-10-Serments et Deuils", "L'assassin royal [001] – L'apprenti assassin"
const NUMBER_BEFORE_TITLE = /^(.*\p{L}.*?)\s*[-–—,]?\s*\[?(\d{1,3})\]?\s*[-–—.:]\s*(\p{L}.*)$/u;
// "Endymion 2", "La Chute d'Hyperion 1": a book cut in volumes
const TRAILING_NUMBER = /^(.*\p{L}{3}.*?)\s+(\d{1,2})$/u;

// "(L'Intégrale - Tome 4)" names an edition, not a series.
const BARE_MARKER = /^(?:l['’])?intégrale$/i;

function toIndex(raw: string): number | null {
  const value = /^\d+$/.test(raw) ? Number(raw) : (ROMAN_NUMERALS[raw.toLowerCase()] ?? null);
  return value !== null && value >= 1 ? value : null;
}

function clean(text: string | undefined): string | null {
  return text?.replace(/^[\s\-–—:,.]+|[\s\-–—:,]+$/g, "").trim() || null;
}

/**
 * Reads the series out of titles that carry it, as file names turned titles often do. Only explicit volume
 * numbering counts: "1984" or "Article 353 du code pénal" name no series.
 */
export function seriesFromTitle(rawTitle: string): TitleSeries | null {
  const title = rawTitle.replace(STORE_SUFFIX, "").trim();

  const build = (series: string | undefined, index: string | undefined, ownTitle: string | undefined): TitleSeries | null => {
    const seriesName = clean(series);
    const seriesIndex = index === undefined ? null : toIndex(index);
    // A series is named with words: "1 - Binding 13" is a volume number followed by a title, not a series.
    if (!seriesName || seriesIndex === null || !/^[\p{L}'’"«]/u.test(seriesName) || BARE_MARKER.test(seriesName)) {
      return null;
    }
    return { series: seriesName, seriesIndex, title: clean(ownTitle) };
  };

  const inParenthesis = SERIES_IN_PARENTHESIS.exec(title);
  const marked = VOLUME_IN_PARENTHESIS.exec(title) ?? MARKED_VOLUME.exec(title);
  const numbered = NUMBER_BEFORE_TITLE.exec(title);
  const trailing = TRAILING_NUMBER.exec(title);
  return (
    (inParenthesis && build(inParenthesis[2], inParenthesis[3], inParenthesis[1])) ||
    (marked && build(marked[1], marked[2], marked[3])) ||
    (numbered && build(numbered[1], numbered[2], numbered[3])) ||
    (trailing && Number(trailing[2]) <= 30 && build(trailing[1], trailing[2], undefined)) ||
    null
  );
}
