import { describe, expect, it } from "vitest";
import { genreOfSubject, normalizeGenres } from "../src/library/genres.js";

describe("genreOfSubject", () => {
  it.each([
    ["SF", ["Science-fiction"]],
    ["Science-Fiction", ["Science-fiction"]],
    ["FICTION / Science Fiction / Général", ["Littérature", "Science-fiction"]],
    ["Policier/Thriller", ["Policier & thriller"]],
    ["Policier & Thriller", ["Policier & thriller"]],
    ["Thril­ler", ["Policier & thriller"]],
    ["Littérature Française", ["Littérature"]],
    ["littérature américaine", ["Littérature"]],
    ["Roman", ["Littérature"]],
    ["Document et Témoignage", ["Biographie & témoignage"]],
    ["France -- History -- Revolution, 1789-1799 -- Fiction", ["Histoire", "Littérature"]],
    ["Policier ; enquête ; versailles ; migrants", ["Policier & thriller"]],
    ["lu", []],
    ["Lang:fr", []],
    ["Boys of Tommen#1", []],
    ["L'échiquier du mal", []],
  ])("%s -> %j", (subject, genres) => {
    expect(genreOfSubject(subject)).toEqual(genres);
  });
});

describe("normalizeGenres", () => {
  it("merges the subjects of a book and drops the catch-all when something more specific exists", () => {
    expect(normalizeGenres(["Roman", "Science Fiction", "sf", "lu"])).toEqual(["Science-fiction"]);
    expect(normalizeGenres(["Fiction", "General"])).toEqual(["Littérature"]);
    expect(normalizeGenres(["Fantasy", "Jeunesse"])).toEqual(["Fantasy", "Jeunesse"]);
    expect(normalizeGenres([])).toEqual([]);
    expect(normalizeGenres(["Rugby", "Irlande"])).toEqual([]);
  });
});
