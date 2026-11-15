import assert from "node:assert/strict";
import { test } from "node:test";

// Needs @noble/hashes (installed in CI). Skipped where dependencies aren't installed.
let mod: typeof import("./password.ts") | null = null;
try {
  mod = await import("./password.ts");
} catch {
  mod = null;
}

test("argon2id hash + verify", { skip: mod === null ? "dependencies not installed" : false }, async () => {
  const { hashPassword, verifyPassword } = mod!;
  const t0 = Date.now();
  const hash = await hashPassword("korrekt Pferd Batterie Heftklammer");
  console.log(`argon2id hash took ${Date.now() - t0} ms`);
  assert.match(hash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.equal(await verifyPassword({ hash, password: "korrekt Pferd Batterie Heftklammer" }), true);
  assert.equal(await verifyPassword({ hash, password: "falsch" }), false);
  assert.notEqual(await hashPassword("x"), await hashPassword("x"), "salted");
});
