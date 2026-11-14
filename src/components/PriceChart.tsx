import Link from "next/link";
import { addDays, formatEuro, formatShortDay } from "@/lib/format";
import { chartGeometry, seriesSummary, type DailyPoint } from "@/lib/pricing/deals";

export const CHART_RANGES = { "30": 30, "90": 90, "365": 365 } as const;
export type ChartRange = keyof typeof CHART_RANGES;

const BOX = { width: 680, height: 220, left: 64, right: 12, top: 12, bottom: 28 };

/**
 * Server-rendered SVG step chart of the daily best total price (no chart library, no JS).
 * Range switch via ?zeitraum=30|90|365.
 */
export function PriceChart({
  points,
  today,
  range,
  basePath,
}: {
  points: DailyPoint[];
  today: string;
  range: ChartRange;
  basePath: string;
}) {
  const days = CHART_RANGES[range];
  const from = addDays(today, -days);
  const geo = chartGeometry(points, BOX, { from, to: today });
  const summary = seriesSummary(points);

  return (
    <figure>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <figcaption className="text-sm text-ink-soft">
          Günstigster Gesamtpreis pro Tag (inkl. Versand), letzte {days === 365 ? "12 Monate" : `${days} Tage`}
        </figcaption>
        <nav aria-label="Zeitraum" className="flex gap-1 text-sm">
          {(Object.keys(CHART_RANGES) as ChartRange[]).map((r) => (
            <Link
              key={r}
              href={`${basePath}?zeitraum=${r}#preisverlauf`}
              scroll={false}
              aria-current={r === range ? "true" : undefined}
              className={`rounded-sm px-2 py-0.5 ${r === range ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {r === "365" ? "1 Jahr" : `${r} Tage`}
            </Link>
          ))}
        </nav>
      </div>

      {points.length < 2 ? (
        <p className="mt-4 border border-dashed border-line px-4 py-6 text-sm text-ink-soft">
          {points.length === 0
            ? "Für diesen Zeitraum haben wir noch keinen Preisverlauf."
            : "Bisher gibt es erst einen Tag mit Preisdaten. Ab dem zweiten Tag zeichnen wir hier den Verlauf."}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${BOX.width} ${BOX.height}`}
          className="mt-3 h-auto w-full"
          role="img"
          aria-label={
            summary
              ? `Preisverlauf: niedrigster Preis ${formatEuro(summary.min)}, höchster ${formatEuro(summary.max)}, Median ${formatEuro(summary.median)}`
              : "Preisverlauf"
          }
        >
          {geo.yTicks.map((t) => (
            <g key={t.cents}>
              <line x1={BOX.left} x2={BOX.width - BOX.right} y1={t.y} y2={t.y} stroke="#cdbea4" strokeDasharray="3 4" strokeWidth={1} />
              <text x={BOX.left - 8} y={t.y + 4} textAnchor="end" fontSize={11} fill="#5a4f47" className="tabular">
                {formatEuro(t.cents)}
              </text>
            </g>
          ))}
          {geo.xTicks.map((t) => (
            <text key={t.day} x={t.x} y={BOX.height - 8} textAnchor="middle" fontSize={11} fill="#5a4f47">
              {formatShortDay(t.day)}
            </text>
          ))}
          {geo.paths.map((d) => (
            <path key={d} d={d} fill="none" stroke="#1f1a17" strokeWidth={2} strokeLinejoin="round" />
          ))}
          {geo.dots.length <= 60
            ? geo.dots.map((p) => (
                <circle key={p.day} cx={p.x} cy={p.y} r={2.5} fill="#a9492a">
                  <title>{`${formatShortDay(p.day)}: ${formatEuro(p.cents)}`}</title>
                </circle>
              ))
            : null}
        </svg>
      )}

      {summary ? (
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-ink-soft">Niedrigster</dt>
            <dd className="tabular font-semibold text-moss">{formatEuro(summary.min)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Median</dt>
            <dd className="tabular font-semibold">{formatEuro(summary.median)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Höchster</dt>
            <dd className="tabular font-semibold">{formatEuro(summary.max)}</dd>
          </div>
        </dl>
      ) : null}
    </figure>
  );
}
