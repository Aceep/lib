import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

/** SHA-256 of a file, streamed. */
export async function hashFile(absolutePath: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(absolutePath), hash);
  return hash.digest("hex");
}
