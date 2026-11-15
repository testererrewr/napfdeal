/**
 * In-memory sliding-window rate limiter. Keys (e.g. an IP address) live only in RAM for the
 * duration of the window and are never written anywhere. Pure module (state in the instance).
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private lastSweep = 0;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** Records a hit; returns false if the key is over its limit. */
  hit(key: string, now = Date.now()): boolean {
    this.sweep(now);
    const from = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > from);
    if (list.length >= this.limit) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    return true;
  }

  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    const from = now - this.windowMs;
    for (const [k, list] of this.hits) {
      const kept = list.filter((t) => t > from);
      if (kept.length === 0) this.hits.delete(k);
      else this.hits.set(k, kept);
    }
  }

  get size(): number {
    return this.hits.size;
  }
}

/** Client IP from the reverse proxy headers – used only as an in-memory rate-limit key. */
export function clientIp(h: { get(name: string): string | null }): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") ?? "unknown";
}
