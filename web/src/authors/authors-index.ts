/** `sortName` is the family name first ("herbert frank"), as the server orders authors; `listName` is "Herbert, Frank". */
export type AuthorEntry = { name: string; bookCount: number; sortName?: string; listName?: string };
export type AuthorGroup = { letter: string; authors: AuthorEntry[] };

const OTHER_LETTER = "#";
// Letters that NFD does not split into a base letter and an accent.
const SPECIAL_LETTERS: Record<string, string> = { ø: "o", æ: "a", œ: "o", ß: "s", ł: "l", đ: "d" };

/** "É" -> "E", "ø" -> "O"; anything that is not a letter lands under "#". */
export function letterOf(name: string): string {
  const first = name
    .trim()
    .toLowerCase()
    .replace(/^[øæœßłđ]/, (letter) => SPECIAL_LETTERS[letter] ?? letter)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .charAt(0)
    .toUpperCase();
  return /\p{L}/u.test(first) ? first : OTHER_LETTER;
}

/**
 * Groups by the initial of the family name ("Frank Herbert" under H). Keeps the given order inside each group
 * (the server already sorts by family name) and puts "#" last.
 */
export function groupAuthorsByLetter(authors: AuthorEntry[]): AuthorGroup[] {
  const groups = new Map<string, AuthorEntry[]>();
  for (const author of authors) {
    const letter = letterOf(author.sortName ?? author.name);
    const group = groups.get(letter);
    if (group) {
      group.push(author);
    } else {
      groups.set(letter, [author]);
    }
  }
  return [...groups.entries()]
    .map(([letter, entries]) => ({ letter, authors: entries }))
    .sort((left, right) => (left.letter === OTHER_LETTER ? 1 : right.letter === OTHER_LETTER ? -1 : left.letter.localeCompare(right.letter)));
}
