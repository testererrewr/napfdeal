import Link from "next/link";

/** Required short affiliate notice at the top of pages with shop links. */
export function AdNotice() {
  return (
    <p className="border-l-[3px] border-mustard bg-mustard-soft px-3 py-2 text-sm">
      Wenn du über unsere Links kaufst, bekommen wir eine kleine Provision. Für dich ändert sich am Preis nichts.{" "}
      <Link href="/so-verdienen-wir-geld/" className="underline">
        Mehr dazu
      </Link>
    </p>
  );
}

export function PriceDisclaimer() {
  return (
    <p className="text-xs text-ink-soft">
      Preise können sich seit der letzten Prüfung geändert haben. Es gilt der Preis im Shop.
    </p>
  );
}
