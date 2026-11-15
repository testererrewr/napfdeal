import { randomBytes } from "node:crypto";
import { argon2idAsync } from "@noble/hashes/argon2";
import { ARGON2_PARAMS, constantTimeEqual, decodePhc, encodePhc } from "./phc.ts";

/**
 * Argon2id password hashing (pure JS, async so the server keeps answering while hashing).
 * Stored as PHC string; parameters are read back from the hash, so they can be raised later.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(randomBytes(16));
  const hash = await argon2idAsync(password, salt, { ...ARGON2_PARAMS, dkLen: 32 });
  return encodePhc(ARGON2_PARAMS, salt, hash);
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const decoded = decodePhc(hash);
  if (!decoded) return false;
  const candidate = await argon2idAsync(password, decoded.salt, { ...decoded.params, dkLen: decoded.hash.length });
  return constantTimeEqual(candidate, decoded.hash);
}
