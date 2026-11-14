import { DrawnArrow } from "@/components/illustrations";

/** Newspaper-style rubric: heavy rule, uppercase kicker, optional dek. */
export function SectionHead({
  id,
  kicker,
  dek,
  as: Tag = "h2",
}: {
  id?: string;
  kicker: string;
  dek?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className="border-t-2 border-ink pt-2">
      <Tag id={id} className="kicker">
        {kicker}
      </Tag>
      {dek ? <p className="mt-1 text-sm text-ink-soft">{dek}</p> : null}
    </div>
  );
}

/** Handwritten margin note with a drawn arrow. Max 1–2 per view. */
export function HandNote({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`hand relative inline-block -rotate-2 text-xl text-terracotta ${className}`}>
      {children}
      <DrawnArrow className="absolute -bottom-7 -left-8 h-8 w-12 text-terracotta" />
    </p>
  );
}

/**
 * Price tag look: punched hole on the left, offset shadow.
 * Only ever render with real prices from the database, always next to a timestamp.
 */
export function PriceTag({ amount, currency = "EUR", className = "" }: { amount: number; currency?: string; className?: string }) {
  const formatted = new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount);
  // clip-path would also clip a box-shadow, so the shadow sits on a wrapper as drop-shadow.
  return (
    <span className={`inline-flex [filter:drop-shadow(2px_2px_0_rgba(31,26,23,0.15))] ${className}`}>
      <span className="tabular relative inline-flex items-center bg-paper-deep py-1 pl-5 pr-3 font-serif text-xl font-semibold [clip-path:polygon(10px_0,100%_0,100%_100%,10px_100%,0_50%)]">
        <span aria-hidden="true" className="absolute left-[9px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-paper" />
        {formatted}
      </span>
    </span>
  );
}

/** Honest empty state: says exactly what's missing and why. */
export function EmptyState({
  illustration,
  title,
  children,
}: {
  illustration?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 border border-dashed border-line px-4 py-5">
      {illustration ? <div className="shrink-0 text-ink-soft">{illustration}</div> : null}
      <div>
        <p className="font-serif text-lg">{title}</p>
        {children ? <div className="mt-1 text-[0.95rem] text-ink-soft">{children}</div> : null}
      </div>
    </div>
  );
}
