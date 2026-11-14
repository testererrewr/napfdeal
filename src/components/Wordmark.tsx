import { Bowl } from "@/components/illustrations";

/** napfdeal wordmark: "napf" upright in ink, "deal" italic in terracotta, a small drawn bowl. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-1.5 font-serif leading-none ${className}`}>
      <Bowl className="mb-[0.08em] h-[1.05em] w-[1.05em] text-terracotta" />
      <span style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }} className="font-semibold tracking-tight">
        napf
        <span className="italic text-terracotta">deal</span>
      </span>
    </span>
  );
}
