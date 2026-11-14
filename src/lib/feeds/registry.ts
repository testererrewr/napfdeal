import { AwinAdapter } from "@/lib/feeds/adapters/awin";
import type { FeedAdapter } from "@/lib/feeds/types";

export function isTestMode(): boolean {
  return process.env.FEEDS_TEST_MODE === "1";
}

/** All adapters that are configured right now. Tradedoubler, Daisycon, Amazon follow in Phase 8. */
export function activeAdapters(): FeedAdapter[] {
  const all: FeedAdapter[] = [new AwinAdapter("live")];
  if (isTestMode()) all.push(new AwinAdapter("fixture"));
  return all.filter((a) => a.isConfigured());
}

export function adapterByNetwork(slug: string): FeedAdapter | undefined {
  return activeAdapters().find((a) => a.network === slug);
}
