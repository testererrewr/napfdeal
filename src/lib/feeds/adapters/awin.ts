/**
 * Awin product feed adapter.
 *
 * - Feed list: https://productdata.awin.com/datafeed/list/apikey/<KEY>  (CSV, one row per joined feed,
 *   includes "Last Imported" → we only download feeds whose marker changed, except on full refresh)
 * - Feed download: Create-a-Feed URL with our column list, gzip-compressed CSV, streamed.
 * - Limits (Awin): max. 5 concurrent downloads, max. 5 downloads of the same feed per hour.
 *   Concurrency is enforced here; the per-feed hourly limit in the importer (feed_import_run).
 *
 * Test mode (FEEDS_TEST_MODE=1): reads the same CSV format from fixtures/awin/ instead of the network.
 * Test data lives in its own network "awin-test" and is never shown publicly.
 *
 * TODO(after Awin approval): verify list column names and feed column names against a real feed;
 * columns are configurable via the setting "awin.columns".
 */
import { createReadStream } from "node:fs";
import path from "node:path";
import { pipeline, Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { createGunzip } from "node:zlib";
import { isCountry } from "@/lib/countries";
import { csvRecords } from "@/lib/feeds/csv";
import type { FeedAdapter, NormalizedOffer, RemoteFeed } from "@/lib/feeds/types";
import { parseMoneyToCents } from "@/lib/pricing/money";
import { getSetting } from "@/lib/settings";

const LIST_URL = "https://productdata.awin.com/datafeed/list/apikey/";
const DOWNLOAD_BASE = "https://productdata.awin.com/datafeed/download/apikey/";
export const AWIN_MAX_CONCURRENT_DOWNLOADS = 5;

/** Tiny counting semaphore (process-wide) for concurrent downloads. */
class Semaphore {
  private queue: Array<() => void> = [];
  private active = 0;
  constructor(private readonly max: number) {}
  async acquire(): Promise<() => void> {
    if (this.active >= this.max) await new Promise<void>((resolve) => this.queue.push(resolve));
    this.active++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      this.queue.shift()?.();
    };
  }
}
const downloads = new Semaphore(AWIN_MAX_CONCURRENT_DOWNLOADS);

async function* decodeChunks(source: AsyncIterable<Buffer | Uint8Array | string>): AsyncGenerator<string> {
  const decoder = new TextDecoder("utf-8");
  for await (const chunk of source) {
    yield typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
  }
  const tail = decoder.decode();
  if (tail) yield tail;
}

function gunzipped(input: Readable): Readable {
  const gunzip = createGunzip();
  pipeline(input, gunzip, (err) => {
    if (err) gunzip.destroy(err);
  });
  return gunzip;
}

async function fetchStream(url: string): Promise<Readable> {
  const res = await fetch(url, { headers: { "Accept-Encoding": "identity" } });
  if (!res.ok || !res.body) {
    // Never log the URL – it contains the API key.
    throw new Error(`Awin download failed: HTTP ${res.status}`);
  }
  return Readable.fromWeb(res.body as unknown as WebReadableStream<Uint8Array>);
}

function regionToCountry(region: string): RemoteFeed["country"] | null {
  const c = region.trim().toLowerCase();
  return isCountry(c) ? c : null;
}

function languageCode(lang: string): string {
  const l = lang.trim().toLowerCase();
  if (l === "german" || l === "deutsch") return "de";
  return l.slice(0, 2) || "de";
}

function isAvailable(rec: Record<string, string>): boolean {
  const inStock = (rec.in_stock ?? "").trim();
  if (inStock === "1") return true;
  if (inStock === "0") return false;
  const status = (rec.stock_status ?? "").toLowerCase();
  if (/out of stock|nicht (auf lager|lieferbar|verfügbar)|ausverkauft/.test(status)) return false;
  return true;
}

export function mapAwinRecord(rec: Record<string, string>): NormalizedOffer {
  const delivery = (rec.delivery_cost ?? "").trim();
  return {
    externalId: (rec.aw_product_id || rec.merchant_product_id || "").trim(),
    title: (rec.product_name ?? "").trim(),
    brand: (rec.brand_name ?? "").trim() || null,
    gtinFields: [rec.ean ?? "", rec.product_GTIN ?? "", rec.upc ?? ""],
    priceCents: parseMoneyToCents(rec.search_price) ?? 0,
    shippingCents: delivery === "" ? null : parseMoneyToCents(delivery),
    currency: (rec.currency ?? "EUR").trim().toUpperCase() || "EUR",
    available: isAvailable(rec),
    deeplink: (rec.aw_deep_link ?? "").trim(),
    imageUrl: (rec.merchant_image_url || rec.aw_image_url || "").trim() || null,
    feedCategory: (rec.merchant_category || rec.category_name || "").trim() || null,
    // Awin has no reliable pack-size field; the importer parses the title.
    sizeMeasure: null,
  };
}

export class AwinAdapter implements FeedAdapter {
  readonly network: string;
  readonly networkName: string;
  readonly isTest: boolean;

  constructor(private readonly mode: "live" | "fixture") {
    this.isTest = mode === "fixture";
    this.network = this.isTest ? "awin-test" : "awin";
    this.networkName = this.isTest ? "Awin (Testdaten)" : "Awin";
  }

  private get key(): string {
    return process.env.AWIN_FEED_KEY ?? "";
  }

  private fixturePath(file: string): string {
    return path.resolve(process.cwd(), "fixtures", "awin", file);
  }

  isConfigured(): boolean {
    return this.isTest || this.key.length > 0;
  }

  async listFeeds(): Promise<RemoteFeed[]> {
    const source: AsyncIterable<string> = this.isTest
      ? decodeChunks(createReadStream(this.fixturePath("feed-list.csv")))
      : decodeChunks(await fetchStream(`${LIST_URL}${encodeURIComponent(this.key)}`));

    const feeds: RemoteFeed[] = [];
    for await (const r of csvRecords(source)) {
      const membership = (r["Membership Status"] ?? "").toLowerCase();
      if (membership && !/active|joined/.test(membership)) continue;
      const country = regionToCountry(r["Primary Region"] ?? "");
      if (!country) continue;
      const feedId = (r["Feed ID"] ?? "").trim();
      if (!feedId) continue;
      const count = Number(r["No of products"]);
      feeds.push({
        externalId: feedId,
        name: (r["Feed Name"] ?? "").trim() || `Feed ${feedId}`,
        shopExternalId: (r["Advertiser ID"] ?? "").trim(),
        shopName: (r["Advertiser Name"] ?? "").trim(),
        country,
        language: languageCode(r["Language"] ?? "de"),
        remoteVersion: (r["Last Imported"] ?? "").trim() || null,
        productCount: Number.isFinite(count) ? count : null,
      });
    }
    return feeds;
  }

  async *fetchOffers(feed: RemoteFeed): AsyncIterable<NormalizedOffer> {
    const release = await downloads.acquire();
    try {
      let stream: Readable;
      if (this.isTest) {
        stream = createReadStream(this.fixturePath(`feed-${feed.externalId}.csv`));
      } else {
        const columns = (await getSetting("awin.columns")).join(",");
        const url =
          `${DOWNLOAD_BASE}${encodeURIComponent(this.key)}/language/${feed.language ?? "de"}` +
          `/fid/${encodeURIComponent(feed.externalId)}/columns/${columns}` +
          `/format/csv/delimiter/%2C/compression/gzip/adultcontent/1/`;
        stream = gunzipped(await fetchStream(url));
      }
      for await (const rec of csvRecords(decodeChunks(stream))) {
        yield mapAwinRecord(rec);
      }
    } finally {
      release();
    }
  }
}
