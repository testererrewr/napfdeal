import assert from "node:assert/strict";
import { test } from "node:test";
import { constantTimeEqual, decodePhc, encodePhc } from "./phc.ts";

test("PHC round trip", () => {
  const salt = new Uint8Array(16).map((_, i) => i);
  const hash = new Uint8Array(32).map((_, i) => 255 - i);
  const phc = encodePhc({ m: 19456, t: 2, p: 1 }, salt, hash);
  assert.match(phc, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
  const d = decodePhc(phc);
  if (!d) throw new Error("decode failed");
  assert.deepEqual(d.params, { m: 19456, t: 2, p: 1 });
  assert.ok(constantTimeEqual(d.salt, salt));
  assert.ok(constantTimeEqual(d.hash, hash));
});

test("rejects other formats and absurd parameters", () => {
  assert.equal(decodePhc("$2b$10$abcdefghijklmnopqrstuv"), null);
  assert.equal(decodePhc("$argon2i$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAA"), null);
  assert.equal(decodePhc("$argon2id$v=19$m=99999999,t=2,p=1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAA"), null);
});

test("constantTimeEqual", () => {
  assert.equal(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])), true);
  assert.equal(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3])), false);
  assert.equal(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 2])), false);
});
