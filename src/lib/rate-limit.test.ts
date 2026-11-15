import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIp, RateLimiter } from "./rate-limit.ts";

test("allows up to the limit within the window", () => {
  const rl = new RateLimiter(3, 1000);
  assert.equal(rl.hit("a", 0), true);
  assert.equal(rl.hit("a", 100), true);
  assert.equal(rl.hit("a", 200), true);
  assert.equal(rl.hit("a", 300), false);
  assert.equal(rl.hit("b", 300), true, "other keys unaffected");
  assert.equal(rl.hit("a", 1101), true, "first hit left the window");
});

test("old keys are swept from memory", () => {
  const rl = new RateLimiter(1, 1000);
  rl.hit("x", 0);
  rl.hit("y", 0);
  rl.hit("z", 5000);
  assert.equal(rl.size, 1);
});

test("client ip from x-forwarded-for", () => {
  const h = new Map([["x-forwarded-for", "203.0.113.5, 10.0.0.1"]]);
  assert.equal(clientIp({ get: (n) => h.get(n) ?? null }), "203.0.113.5");
  assert.equal(clientIp({ get: () => null }), "unknown");
});
