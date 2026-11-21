const LIGATURES: Record<string, string> = { œ: "oe", æ: "ae", ß: "ss" };

/**
 * SQLite's NOCASE only folds ASCII, so "Été" would sort after "Zola". Ordering on this key instead
 * puts accented and plain letters together, the way a French reader expects.
 */
export function toSortKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[œæß]/g, (ligature) => LIGATURES[ligature] ?? ligature)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}
