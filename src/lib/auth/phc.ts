/** PHC string format for Argon2id hashes. Pure module. */

export type Argon2Params = { m: number; t: number; p: number };

/** OWASP minimum recommendation for Argon2id (19 MiB, 2 iterations, 1 lane). */
export const ARGON2_PARAMS: Argon2Params = { m: 19456, t: 2, p: 1 };

const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64").replace(/=+$/, "");
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, "base64"));

export function encodePhc(params: Argon2Params, salt: Uint8Array, hash: Uint8Array): string {
  return `$argon2id$v=19$m=${params.m},t=${params.t},p=${params.p}$${b64(salt)}$${b64(hash)}`;
}

export function decodePhc(phc: string): { params: Argon2Params; salt: Uint8Array; hash: Uint8Array } | null {
  const m = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(phc);
  if (!m) return null;
  const params = { m: Number(m[1]), t: Number(m[2]), p: Number(m[3]) };
  if (params.m < 8 || params.t < 1 || params.p < 1 || params.m > 262144 || params.t > 10 || params.p > 8) return null;
  const salt = unb64(m[4] as string);
  const hash = unb64(m[5] as string);
  if (salt.length < 8 || hash.length < 16) return null;
  return { params, salt, hash };
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] as number) ^ (b[i] as number);
  return diff === 0;
}
