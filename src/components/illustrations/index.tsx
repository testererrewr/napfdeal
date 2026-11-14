/*
 * Hand-drawn style line illustrations. Deliberately slightly irregular paths.
 * All strokes use currentColor so colour comes from the parent (text-ink, text-terracotta …).
 * Decorative by default (aria-hidden). Use sparingly – see docs/design-system.md §5.
 */

type IllustrationProps = {
  className?: string;
  title?: string;
};

function Svg({
  className,
  title,
  children,
  viewBox = "0 0 64 64",
}: IllustrationProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Food bowl with a little heap of kibble. */
export function Bowl(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 33.2c8.6-1.1 18.1-1.6 25.8-1.4 9 .2 17.4.8 25.4 1.7" />
      <path d="M8.1 33.6c1.4 8.9 5.2 15.3 11.9 17.6 7.3 2.4 17.6 2.2 24.6-.3 6.3-2.3 10.4-8.4 11.6-16.9" />
      <path d="M17.4 52.1c-.6 1.9-.4 3 .9 3.4 8.6 1.6 19.7 1.5 28 .1 1.2-.4 1.2-1.7.6-3.6" />
      <path d="M14.2 32.4c1.6-4.7 5.4-7.3 9.6-7.8M27 31.7c.4-3.9 3-6.4 6.8-6.6 3.6-.1 6.2 2.2 7 6.1M43.1 31.9c1.2-3.1 3.9-4.6 6.9-4.3" />
      <circle cx="21.5" cy="28.6" r="1.6" />
      <circle cx="33.3" cy="27.9" r="1.5" />
      <circle cx="46.8" cy="29.7" r="1.4" />
      <path d="M22 41.5c3.2.9 6.9 1.2 10.4 1" strokeWidth={1.1} />
    </Svg>
  );
}

/** Single paw print. */
export function Paw(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M32.6 33.1c-6.8-.4-12.6 5.6-13.3 11.4-.6 4.7 2.6 7.8 6.6 7.5 2.6-.2 4.2-1.6 6.6-1.6 2.6.1 4.5 1.8 7.3 1.6 3.9-.3 6.4-3.6 5.6-8-1-5.6-6-10.5-12.8-10.9z" />
      <path d="M17.6 30.6c-2.4.4-3.6 3.2-2.7 6 .8 2.6 3 4.1 5 3.5 2.1-.6 2.9-3.3 2-5.9-.9-2.5-2.5-3.9-4.3-3.6z" />
      <path d="M25.2 18.7c-2.6.3-4 3.6-3.4 7 .5 3.1 2.6 5.2 4.9 4.8 2.4-.4 3.6-3.4 3-6.6-.6-3.3-2.4-5.4-4.5-5.2z" />
      <path d="M39.3 18.4c-2.3-.1-4.3 2.4-4.6 5.6-.3 3.4 1.2 6.2 3.6 6.4 2.3.2 4.3-2.4 4.6-5.7.3-3.4-1.3-6.2-3.6-6.3z" />
      <path d="M47.6 29.8c-2-.4-4.1 1.5-4.7 4.2-.6 2.8.5 5.3 2.6 5.8 2.1.4 4.1-1.4 4.7-4.1.6-2.9-.6-5.5-2.6-5.9z" />
    </Svg>
  );
}

/** Food sack, folded top. */
export function FoodSack(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M17.1 15.6c4.9-1.2 10.6-1.6 15.4-1.5 5 .1 10.1.6 14.6 1.6" />
      <path d="M17.6 15.8c-.6 2.2.4 4 1.6 5.3-2.4 7.8-3.4 17.2-2.6 25.7.3 3.6 1 6.7 2 9.3 8.4 1.9 18.2 2 26.4.3 1.1-2.8 1.8-6.1 2.1-9.9.6-8.7-.7-17.8-3.1-25.6 1.2-1.4 2-3.1 1.4-5.2" />
      <path d="M19.4 21.3c8.2 1.4 17.4 1.4 25.6-.1" />
      <path d="M23.5 31.5c5.5-1 11.9-1 17.2 0M24.2 42.4c5.2.8 10.7.8 15.8-.1" strokeWidth={1.2} />
      <path d="M29.4 35.6c.9-1.4 2.7-1.6 3.6-.4.9-1.2 2.8-.9 3.3.6.6 1.9-1.6 3.5-3.4 4.4-1.9-1-4.1-2.6-3.5-4.6z" strokeWidth={1.2} />
      <path d="M22.3 18.1l1.2-1.4M30.1 18.4l.9-1.6M38.4 18l1-1.4" strokeWidth={1.1} />
    </Svg>
  );
}

/** Litter scoop. */
export function LitterScoop(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M13.4 20.2c7.6-2.4 15.2-2.9 21.8-1.4 1.6 5.6 1.4 11.6-.6 17.2-6.1 2.2-13.8 2.6-20.6.7-1.9-5.4-2.2-11.2-.6-16.5z" />
      <path d="M18.3 22.6l-.5 11.3M23.2 21.8l-.2 12.3M28.2 21.6l.1 12.2M31.9 22.1l-.4 11.4" strokeWidth={1.1} />
      <path d="M35.1 26.4c5.7 2.6 11.4 7.3 16.3 13.7 1.4 1.9 1.1 3.6-.6 4.6-1.6.9-3.1.4-4.4-1.4-4-5.6-8.6-9.8-12.4-11.9" />
    </Svg>
  );
}

/** Round fish bowl with one fish. */
export function FishBowl(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M22.4 14.8c6.3-.9 13.2-.8 19.4.2" />
      <path d="M23.4 15.4c.8 2.2.6 4.1-.8 5.6-6.8 4.1-10.5 11.2-9.4 18.6 1.3 9.1 9.5 15.4 19.2 15.2 9.3-.2 16.8-6.8 17.6-15.6.7-7.4-3-14-9.6-18.1-1.4-1.6-1.6-3.5-.6-5.7" />
      <path d="M15.3 31.6c5.6 1.2 11.4 1.3 17.2.6 5.6-.6 11-1 16.2-.4" strokeWidth={1.2} />
      <path d="M26.6 41.2c2.6-3.1 7.1-3.9 10.2-1.5l3.9-2.6-.6 4.8.9 4.6-4-2.1c-3.3 2.7-7.9 1.8-10.4-1.2" />
      <circle cx="29.3" cy="40.8" r=".7" />
      <circle cx="44.3" cy="24.8" r="1.2" strokeWidth={1.1} />
      <circle cx="41.2" cy="19.6" r=".8" strokeWidth={1.1} />
    </Svg>
  );
}

/** Bird house on a post. */
export function BirdHouse(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M14.2 27.1c5.8-6.1 11.6-11.3 17.9-15.4 6.3 4.2 12.3 9.4 17.6 15.6" />
      <path d="M18.4 25.1c-.4 7.4-.2 14.8.5 21.7 8.6 1 17.4 1 26.1-.1.6-7.1.6-14.4.1-21.7" />
      <circle cx="31.9" cy="31.4" r="4.1" />
      <path d="M27.6 39.6l8.6-.1" />
      <path d="M30.4 46.9c.2 4.1.1 8.3-.2 12.4M33.6 46.8c.3 4.2.4 8.4.2 12.6" />
    </Svg>
  );
}

/** Small hand-drawn arrow for margin notes (points down-left by default). */
export function DrawnArrow(props: IllustrationProps) {
  return (
    <Svg {...props} viewBox="0 0 60 40">
      <path d="M55.2 5.4c-9.8 1.6-20.1 6.2-28.4 13.3-6.1 5.2-10.8 10.6-16.4 15.6" />
      <path d="M9.4 22.2c.4 4.1.6 8.2.4 12.5 4.2-.3 8.2-.9 12.4-1.7" />
    </Svg>
  );
}
