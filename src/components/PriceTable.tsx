import { formatCheckedAt, formatEuro, formatUnitPrice } from "@/lib/format";
import type { OfferRow } from "@/lib/queries";
import { goPath } from "@/lib/urls";

/** All shops for one product in one country, sorted by total incl. shipping. */
export function PriceTable({ offers, baseUnit }: { offers: OfferRow[]; baseUnit: string | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.95rem]">
        <caption className="sr-only">Preise aller Shops, sortiert nach Gesamtpreis inklusive Versand</caption>
        <thead>
          <tr className="border-y-2 border-ink text-xs uppercase tracking-wide">
            <th scope="col" className="py-2 pr-3 font-semibold">Shop</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Preis</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Versand</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Gesamt</th>
            <th scope="col" className="hidden px-3 py-2 text-right font-semibold sm:table-cell">Grundpreis</th>
            <th scope="col" className="py-2 pl-3 font-semibold">
              <span className="sr-only">Zum Shop</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o, i) => {
            const unit = formatUnitPrice(o.unitPriceCents, baseUnit);
            const cheapest = i === 0 && o.available;
            return (
              <tr key={o.id} className={`border-b border-dashed border-line align-top ${o.available ? "" : "text-ink-soft"}`}>
                <td className="py-3 pr-3">
                  <span className="font-semibold">{o.shopName}</span>
                  {cheapest ? <span className="ml-2 bg-moss-soft px-1.5 py-0.5 text-xs font-semibold text-moss">günstigster</span> : null}
                  <span className="block text-xs text-ink-soft">
                    {o.available ? "lieferbar" : "derzeit nicht lieferbar"} · geprüft {formatCheckedAt(o.checkedAt)}
                  </span>
                  {o.suspect ? (
                    <span className="mt-1 block text-xs">
                      Ungewöhnlich starker Preissturz. Wir prüfen ihn beim nächsten Abgleich.
                    </span>
                  ) : null}
                </td>
                <td className="tabular px-3 py-3 text-right">{formatEuro(o.priceCents)}</td>
                <td className="tabular px-3 py-3 text-right">
                  {o.shippingCents === null ? <span className="text-xs">siehe Shop</span> : o.shippingCents === 0 ? "frei" : formatEuro(o.shippingCents)}
                </td>
                <td className="tabular px-3 py-3 text-right font-serif text-lg font-semibold">
                  {formatEuro(o.totalCents)}
                  {o.shippingCents === null ? <span className="block font-sans text-xs font-normal">zzgl. Versand</span> : null}
                </td>
                <td className="tabular hidden px-3 py-3 text-right text-sm sm:table-cell">{unit ?? "–"}</td>
                <td className="py-3 pl-3 text-right">
                  <a
                    href={goPath(o.id)}
                    rel="sponsored nofollow noopener"
                    target="_blank"
                    className="inline-block whitespace-nowrap rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-paper hover:bg-terracotta"
                  >
                    Zum Shop
                  </a>
                  <span className="mt-1 block text-[0.7rem] text-ink-soft">Werbelink</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
