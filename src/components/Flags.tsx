// Self-hosted flags as inline SVG (flag emojis don't render on Windows).

export function FlagDE({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 5 3" className={className} aria-hidden="true">
      <rect width="5" height="1" y="0" fill="#000000" />
      <rect width="5" height="1" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  );
}

export function FlagAT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
      <rect width="3" height="2" fill="#C8102E" />
      <rect width="3" height="0.6667" y="0.6667" fill="#FFFFFF" />
    </svg>
  );
}

export function Flag({ country, className }: { country: "de" | "at"; className?: string }) {
  return country === "de" ? <FlagDE className={className} /> : <FlagAT className={className} />;
}
