import type { Country } from "@/lib/countries";

/** A feed as listed by a network (one per shop programme and country). */
export type RemoteFeed = {
  externalId: string;
  name: string;
  shopExternalId: string;
  shopName: string;
  country: Country;
  language: string | null;
  /** Opaque marker that changes when the network has new data (e.g. a "last imported" timestamp). */
  remoteVersion: string | null;
  productCount: number | null;
};

/** One offer row, already mapped from the network's format. Money in cents. */
export type NormalizedOffer = {
  externalId: string;
  title: string;
  brand: string | null;
  /** Raw GTIN/EAN strings; normalised by the importer */
  gtinFields: string[];
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  available: boolean;
  deeplink: string;
  imageUrl: string | null;
  feedCategory: string | null;
  /** Pack-size measure from a dedicated feed field, if the network provides one */
  sizeMeasure: string | null;
};

/** Common interface for all affiliate networks (Awin, Tradedoubler, Daisycon, Amazon …). */
export interface FeedAdapter {
  /** network.slug */
  readonly network: string;
  readonly networkName: string;
  readonly isTest: boolean;
  /** Credentials present / module enabled */
  isConfigured(): boolean;
  listFeeds(): Promise<RemoteFeed[]>;
  /** Streams offers of one feed. Must respect the network's download limits. */
  fetchOffers(feed: RemoteFeed): AsyncIterable<NormalizedOffer>;
}
