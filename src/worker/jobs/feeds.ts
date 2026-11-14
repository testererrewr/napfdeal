import type PgBoss from "pg-boss";
import { importFeed, type ImportTrigger, ensureNetwork, upsertFeed } from "@/lib/feeds/import";
import { activeAdapters, adapterByNetwork } from "@/lib/feeds/registry";
import type { RemoteFeed } from "@/lib/feeds/types";

export const FEED_QUEUES = {
  check: "feeds.check",
  refresh: "feeds.refresh",
  import: "feeds.import",
} as const;

export type ImportJobData = { network: string; feed: RemoteFeed; trigger: ImportTrigger };

const IMPORT_JOB_OPTIONS = { retryLimit: 1, retryDelay: 300, expireInSeconds: 3 * 60 * 60 } as const;

/** Enqueue imports for all feeds of all configured networks (full refresh, 05:30 / 17:30). */
export async function enqueueAllFeeds(boss: PgBoss, trigger: ImportTrigger): Promise<number> {
  let n = 0;
  for (const adapter of activeAdapters()) {
    try {
      const feeds = await adapter.listFeeds();
      for (const feed of feeds) {
        await boss.send(FEED_QUEUES.import, { network: adapter.network, feed, trigger } satisfies ImportJobData, IMPORT_JOB_OPTIONS);
        n++;
      }
    } catch (err) {
      // One network failing must not stop the others.
      console.error(`[feeds] ${adapter.network}: listing feeds failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  return n;
}

/** Hourly: enqueue only feeds whose remote "last updated" marker changed since our last import. */
export async function enqueueChangedFeeds(boss: PgBoss): Promise<number> {
  let n = 0;
  for (const adapter of activeAdapters()) {
    try {
      const networkId = await ensureNetwork(adapter);
      for (const feed of await adapter.listFeeds()) {
        const { importedVersion, enabled } = await upsertFeed(networkId, feed);
        if (!enabled) continue;
        if (feed.remoteVersion && feed.remoteVersion === importedVersion) continue;
        await boss.send(
          FEED_QUEUES.import,
          { network: adapter.network, feed, trigger: "check" } satisfies ImportJobData,
          IMPORT_JOB_OPTIONS,
        );
        n++;
      }
    } catch (err) {
      console.error(`[feeds] ${adapter.network}: check failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  return n;
}

export async function runImportJob(data: ImportJobData): Promise<void> {
  const adapter = adapterByNetwork(data.network);
  if (!adapter) {
    console.warn(`[feeds] network ${data.network} not configured – job dropped`);
    return;
  }
  const s = await importFeed(adapter, data.feed, data.trigger);
  console.log(
    `[feeds] ${data.network}/${data.feed.externalId} (${data.feed.country}) ${s.status}: ` +
      `${s.rowsTotal} rows, +${s.offersCreated} offers, ${s.priceChanges} price changes, ` +
      `${s.productsCreated} new products, ${s.reviewItems} to review, ${s.suspects} suspect, ` +
      `${s.offersDeactivated} gone, ${s.errors} errors${s.errorMessage ? ` (${s.errorMessage})` : ""}`,
  );
}
