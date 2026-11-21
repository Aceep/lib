import { describe, expect, it } from "vitest";
import { deviceLabel } from "../src/shared/format.js";

describe("deviceLabel", () => {
  it.each([
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0", "Firefox · Windows"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15", "Safari · Mac"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0", "Edge · Windows"],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36", "Chrome · Android"],
    ["Mozilla/5.0 (Linux; U; Android 2.0; en-us;) AppleWebKit/538.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/538.1 (Kobo Touch 0384/4.38.23171)", "Safari · Liseuse Kobo"],
    ["curl/8.5.0", "curl"],
  ])("%s -> %s", (userAgent, label) => {
    expect(deviceLabel(userAgent)).toBe(label);
  });

  it("falls back to the raw string, or says so when there is none", () => {
    expect(deviceLabel("KOReader")).toBe("KOReader");
    expect(deviceLabel(null)).toBe("Inconnu");
  });
});
