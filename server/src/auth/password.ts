import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

const KEY_LENGTH = 64;
// N=2^15 costs about 32 MB and well under 100 ms per check: fine for a handful of users, slow for a guesser.
const SCRYPT_COST = 32768;
const SCRYPT_PARAMETERS = { N: SCRYPT_COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function deriveKey(password: string, salt: Buffer, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { ...SCRYPT_PARAMETERS, N: cost }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Stored as `scrypt$<cost>$<salt>$<key>` so the cost can be raised later without invalidating old hashes. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, SCRYPT_COST);
  return `scrypt$${SCRYPT_COST}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, cost, salt, key] = storedHash.split("$");
  if (scheme !== "scrypt" || !cost || !salt || !key) {
    return false;
  }
  const expected = Buffer.from(key, "base64url");
  const actual = await deriveKey(password, Buffer.from(salt, "base64url"), Number(cost));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
