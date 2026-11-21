import { describe, expect, it } from "vitest";
import { groupAuthorsByLetter, letterOf } from "../src/authors/authors-index.js";

describe("letterOf", () => {
  it.each([
    ["Émile Zola", "E"],
    ["ørsted", "O"],
    ["  albert camus", "A"],
    ["2034", "#"],
    ["", "#"],
  ])("%s -> %s", (name, letter) => {
    expect(letterOf(name)).toBe(letter);
  });
});

describe("groupAuthorsByLetter", () => {
  it("groups in letter order, keeps the server order inside a group, and puts non-letters last", () => {
    const groups = groupAuthorsByLetter([
      { name: "Zola, Émile", bookCount: 2 },
      { name: "123 Collectif", bookCount: 1 },
      { name: "Ernaux, Annie", bookCount: 5 },
      { name: "Échenoz, Jean", bookCount: 1 },
    ]);

    expect(groups.map((group) => [group.letter, group.authors.map((author) => author.name)])).toEqual([
      ["E", ["Ernaux, Annie", "Échenoz, Jean"]],
      ["Z", ["Zola, Émile"]],
      ["#", ["123 Collectif"]],
    ]);
  });
});
