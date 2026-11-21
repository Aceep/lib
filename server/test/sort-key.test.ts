import { describe, expect, it } from "vitest";
import { toSortKey } from "../src/db/sort-key.js";

describe("toSortKey", () => {
  it("drops accents and case", () => {
    expect(toSortKey("Été Indien")).toBe("ete indien");
  });

  it("expands ligatures", () => {
    expect(toSortKey("Œuvres complètes")).toBe("oeuvres completes");
  });

  it("orders accented titles among their plain neighbours", () => {
    const titles = ["Zola", "Été", "Eugénie", "Amour"];

    expect([...titles].sort((left, right) => (toSortKey(left) < toSortKey(right) ? -1 : 1))).toEqual([
      "Amour",
      "Été",
      "Eugénie",
      "Zola",
    ]);
  });
});
