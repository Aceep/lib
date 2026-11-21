import { describe, expect, it } from "vitest";
import { cleanTitle, parseAuthor, proposeName, splitAuthors } from "../src/library/file-naming.js";

describe("parseAuthor", () => {
  it.each([
    ["Franck Thilliez", "Franck Thilliez", "T"],
    ["Thilliez, Franck", "Franck Thilliez", "T"],
    ["Philippe BESSON", "Philippe Besson", "B"],
    ["MAJDALANI Charif", "Charif Majdalani", "M"],
    ["Antoine de SAINT-EXUPÉRY", "Antoine de Saint-Exupéry", "S"],
    ["Thibault de Montaigu", "Thibault de Montaigu", "M"],
    ["J.M.G. Le Clézio", "J.M.G. Le Clézio", "L"],
    ["R. F. Kuang", "R. F. Kuang", "K"],
    ["Tr&#xE9;vidic, Marc", "Marc Trévidic", "T"],
    ["  Évelyne   Brisou-Pellen ", "Évelyne Brisou-Pellen", "B"],
    ["STEFAN ZWEIG", "Stefan Zweig", "Z"],
    ["Jean-baptiste Andrea", "Jean-Baptiste Andrea", "A"],
    ["National Intelligence Council (USA)", "National Intelligence Council (USA)", "C"],
  ])("%s -> %s (%s)", (raw, display, letter) => {
    expect(parseAuthor(raw)).toMatchObject({ display, letter, doubts: [] });
  });

  it("flags names that need a human look", () => {
    expect(parseAuthor("Vercors").doubts).toEqual(["single-word-author"]);
    expect(parseAuthor("Unknown").doubts).toEqual(["single-word-author", "author-looks-odd"]);
    expect(parseAuthor("2034")).toMatchObject({ letter: "#" });
  });

  it("drops series information typed after the name", () => {
    expect(parseAuthor("David Gemmell - Waylander - 1")).toEqual({ display: "David Gemmell", letter: "G", doubts: ["author-trimmed"] });
  });
});

describe("splitAuthors", () => {
  it("separates several authors typed in one field", () => {
    expect(splitAuthors(["Aurélien Barrau et Louis Schweitzer", "Jane Doe & John Roe", "Solo"])).toEqual([
      "Aurélien Barrau",
      "Louis Schweitzer",
      "Jane Doe",
      "John Roe",
      "Solo",
    ]);
  });
});

describe("cleanTitle", () => {
  it("strips edition noise and re-cases shouting titles", () => {
    expect(cleanTitle("Le quatrième mur:Roman (Littérature Française) (French Edition)")).toMatchObject({ title: "Le quatrième mur" });
    expect(cleanTitle("NOS ÉTOILES CONTRAIRES")).toEqual({ title: "Nos étoiles contraires", doubts: ["title-all-caps"] });
    // Proper nouns inside a shouting title cannot be recovered; the "title-all-caps" doubt sends it to review.
    expect(cleanTitle("L'ÎLE DU DOCTEUR MOREAU").title).toBe("L'île du docteur moreau");
  });

  it("replaces the characters Windows forbids", () => {
    expect(cleanTitle("Le Livre des Terres Bannies T1 : Malice")).toEqual({
      title: "Le Livre des Terres Bannies T1 - Malice",
      doubts: ["title-had-forbidden-chars"],
    });
    expect(cleanTitle("Trop intelligent pour être heureux ? L'adulte surdoué").title).toBe("Trop intelligent pour être heureux L'adulte surdoué");
    expect(cleanTitle('Il a dit "non"/oui.').title).toBe("Il a dit 'non' - oui");
  });
});

describe("proposeName", () => {
  it("files a book under the family-name letter and the author's folder", () => {
    expect(proposeName({ title: "Sept redditions", authors: ["Ada Palmer"] })).toEqual({
      path: "Books/P/Ada Palmer/Ada Palmer - Sept redditions.epub",
      doubts: [],
    });
  });

  it("keeps one entry for an author listed twice with a different casing", () => {
    expect(proposeName({ title: "Veiller sur elle", authors: ["Jean-baptiste Andrea", "Jean-Baptiste Andrea"] }).path).toBe(
      "Books/A/Jean-Baptiste Andrea/Jean-Baptiste Andrea - Veiller sur elle.epub",
    );
  });

  it("lists two authors and abbreviates more", () => {
    expect(proposeName({ title: "La criminologie pour les nuls", authors: ["Alain Bauer", "Christophe Soullez"] }).path).toBe(
      "Books/B/Alain Bauer/Alain Bauer, Christophe Soullez - La criminologie pour les nuls.epub",
    );
    expect(proposeName({ title: "Recueil", authors: ["A Un", "B Deux", "C Trois"] }).path).toBe("Books/U/A Un/A Un et al. - Recueil.epub");
  });

  it("parks books without author and truncates very long names", () => {
    expect(proposeName({ title: "Orbital", authors: [] })).toEqual({ path: "Books/_Sans auteur/Orbital.epub", doubts: ["no-author"] });
    const long = proposeName({ title: "x".repeat(300), authors: ["Jane Doe"] });
    expect(long.doubts).toEqual(["title-truncated"]);
    expect(long.path.split("/").at(-1)!.length).toBeLessThanOrEqual(150);
    expect(long.path.endsWith("….epub")).toBe(true);
  });
});
