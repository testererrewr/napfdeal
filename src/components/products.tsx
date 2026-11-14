import Link from "next/link";
import { HandNote, PriceTag } from "@/components/editorial";
import { FoodSack } from "@/components/illustrations";
import type { Country } from "@/lib/countries";
import { formatCheckedAt, formatEuro, formatUnitPrice, relativeDay, todayKey } from "@/lib/format";
import { lowestSince, type Saving } from "@/lib/pricing/deals";
import type { ListItem } from "@/lib/queries";
import { productImagePath, productPath } from "@/lib/urls";

export function ProductThumb({ productId, hasImage, alt, size = 72 }: { productId: number; hasImage: boolean; alt: string; size?: number }) {
  if (!hasImage) {
    return (
      <span className="flex shrink-0 items-center justify-center bg-paper-deep text-ink-soft" style={{ width: size, height: size }}>
        <FoodSack className="h-2/3 w-2/3" />
      </span>
    );
  }
  return (
    // Plain <img>: images come from our own proxy, already sized by the shop.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={productImagePath(productId)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="shrink-0 bg-white object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export type SavingKind = "deal" | "drop";

/** One product line for lists. `saving` explains why it's listed (deal vs. median, drop vs. earlier day). */
export function ProductRow({
  item,
  country,
  saving,
  savingKind,
  showLowNote = false,
}: {
  item: ListItem;
  country: Country;
  saving?: Saving;
  savingKind?: SavingKind;
  showLowNote?: boolean;
}) {
  const href = productPath(country, item.categoryPath, item.slug);
  const unit = formatUnitPrice(item.bestUnitPriceCents, item.sizeBaseUnit);
  const low = showLowNote ? lowestSince(item) : null;

  return (
    <li className="flex gap-4 border-b border-dashed border-line py-4 last:border-b-0">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <ProductThumb productId={item.productId} hasImage={item.hasImage} alt="" />
      </Link>
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-base font-semibold leading-snug">
          <Link href={href} className="hover:text-terracotta hover:underline">
            {item.name}
          </Link>
        </h3>
        {saving && savingKind === "deal" ? (
          <p className="mt-1 text-sm">
            <span className="font-semibold text-moss">{formatEuro(saving.savingCents)} günstiger</span> als im Mittel der
            letzten 30 Tage ({formatEuro(saving.referenceCents)}), also −{Math.round(saving.savingPercent)} %.
          </p>
        ) : null}
        {saving && savingKind === "drop" ? (
          <p className="mt-1 text-sm">
            <span className="font-semibold text-moss">{formatEuro(saving.savingCents)} weniger</span> als{" "}
            {item.prevBestDay ? relativeDay(item.prevBestDay, todayKey()) : "zuletzt"} (−{Math.round(saving.savingPercent)} %).
          </p>
        ) : null}
        <p className="mt-1 text-xs text-ink-soft">
          {item.offerCount === 1 ? "1 Shop" : `${item.offerCount} Shops`} · Preis geprüft: {formatCheckedAt(item.checkedAt)}
        </p>
        {low ? (
          <p className="mt-1 text-xs font-semibold text-moss">
            {low.sinceStart ? `Tiefster Preis, seit wir zählen (${low.days} Tage)` : `Tiefster Preis seit ${low.days} Tagen`}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <PriceTag amount={item.bestCents / 100} />
        <p className="mt-1 text-xs text-ink-soft">inkl. Versand</p>
        {unit ? <p className="tabular text-xs text-ink-soft">{unit}</p> : null}
      </div>
    </li>
  );
}

export function ProductList({ children }: { children: React.ReactNode }) {
  return <ul className="mt-2">{children}</ul>;
}

/** Kept tiny on purpose: only used once per page, see design system §4. */
export function LowestSinceNote({ days, sinceStart }: { days: number; sinceStart: boolean }) {
  return <HandNote>{sinceStart ? `Tiefster Preis, seit wir zählen (${days} Tage)` : `Tiefster Preis seit ${days} Tagen`}</HandNote>;
}
