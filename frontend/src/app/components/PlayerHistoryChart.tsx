import {
  normalizeHistory,
  type PublishedHistorySeries,
} from "../lib/player-insights";

export default function PlayerHistoryChart({
  series,
  name,
}: {
  series: PublishedHistorySeries;
  name: string;
}) {
  const points = normalizeHistory(series.points);

  if (!series.chartable) {
    const first = points[0];
    return (
      <div className="grid min-h-64 gap-6 border border-[#171c19] bg-white/45 p-6 sm:grid-cols-[0.65fr_1.35fr] sm:items-center sm:p-8">
        <div>
          <span className="mono-label text-[#69706c]">First verified FTT observation</span>
          <strong className="mt-3 block text-6xl font-black tracking-[-0.06em] text-[#171c19]">
            {first?.value ?? "—"}
          </strong>
          {first && (
            <time className="mt-2 block font-mono text-[10px] font-bold uppercase tracking-[0.07em] text-[#69706c]" dateTime={first.parsedDate.toISOString()}>
              Captured {formatFullDate(first.parsedDate, series.source)}
            </time>
          )}
        </div>
        <div className="border-t border-[#9d9a91] pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
          <h3 className="text-2xl font-black tracking-[-0.04em]">The record starts here.</h3>
          <p className="mt-3 text-sm leading-7 text-[#69706c]">
            Fantasy Trade Target has begun its own timestamped market record for {name}. New daily observations will populate the trend chart automatically; earlier values are never estimated or backfilled.
          </p>
        </div>
      </div>
    );
  }

  const width = 760;
  const height = 280;
  const paddingX = 24;
  const paddingY = 28;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const coordinates = points.map((point, index) => {
    const x =
      paddingX +
      (index / Math.max(points.length - 1, 1)) * (width - paddingX * 2);
    const y =
      paddingY +
      ((max - point.value) / range) * (height - paddingY * 2);
    return { ...point, x, y };
  });
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${paddingX},${height - paddingY} ${line} ${width - paddingX},${height - paddingY}`;
  const first = coordinates[0];
  const last = coordinates.at(-1)!;
  const tablePoints = [...points].slice(-120).reverse();

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-labelledby="history-chart-title history-chart-description"
      >
        <title id="history-chart-title">{name} dynasty value history</title>
        <desc id="history-chart-description">
          Market observations from {formatDate(first.parsedDate, series.source)} through {formatDate(last.parsedDate, series.source)}, ranging from {min} to {max}.
        </desc>
        {[0, 0.5, 1].map((ratio) => {
          const y = paddingY + ratio * (height - paddingY * 2);
          return (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="rgba(23,28,25,0.18)"
              strokeDasharray="5 7"
            />
          );
        })}
        <polygon points={area} fill="rgba(223,255,79,0.48)" />
        <polyline
          points={line}
          fill="none"
          stroke="#171c19"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={last.x} cy={last.y} r="8" fill="#ff6b3d" stroke="#171c19" strokeWidth="3" />
        <text x={paddingX} y={height - 5} className="fill-[#69706c] text-[12px] font-bold">
          {formatDate(first.parsedDate, series.source)}
        </text>
        <text
          x={width - paddingX}
          y={height - 5}
          textAnchor="end"
          className="fill-[#69706c] text-[12px] font-bold"
        >
          {formatDate(last.parsedDate, series.source)}
        </text>
        <text
          x={last.x - 12}
          y={Math.max(last.y - 14, 18)}
          textAnchor="end"
          className="fill-[#171c19] text-[15px] font-black"
        >
          {last.value}
        </text>
      </svg>
      <figcaption className="mt-3 text-xs leading-5 text-[#69706c]">
        {series.source === "tradyr"
          ? "Historical composite observations supplied by Tradyr."
          : "Timestamped composite observations recorded by Fantasy Trade Target."}{" "}
        The chart is a market record, not a projection of future performance.
      </figcaption>
      <details className="mt-5 border border-[#9d9a91] bg-white/35">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">
          Read recent historical observations
        </summary>
        <div className="max-h-96 overflow-auto border-t border-[#9d9a91]">
          <table className="w-full min-w-80 text-left text-sm">
            <thead className="sticky top-0 bg-[#e7e2d5] font-mono text-[10px] uppercase tracking-[0.07em]">
              <tr><th className="px-4 py-3">Observation date</th><th className="px-4 py-3 text-right">Market value</th></tr>
            </thead>
            <tbody className="divide-y divide-[#c9c5ba]">
              {tablePoints.map((point) => (
                <tr key={`${point.date}-${point.value}`}>
                  <td className="px-4 py-3">{formatFullDate(point.parsedDate, series.source)}</td>
                  <td className="px-4 py-3 text-right font-mono font-black">{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {points.length > tablePoints.length && (
          <p className="border-t border-[#c9c5ba] px-4 py-3 text-xs text-[#69706c]">
            Showing the latest {tablePoints.length} of {points.length} observations. The CSV download contains the complete record.
          </p>
        )}
      </details>
    </figure>
  );
}

function formatFullDate(
  value: Date,
  source: PublishedHistorySeries["source"],
) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(source === "ftt"
      ? {
          hour: "numeric" as const,
          minute: "2-digit" as const,
          timeZoneName: "short" as const,
          timeZone: "America/New_York",
        }
      : { timeZone: "UTC" }),
  }).format(value);
}

function formatDate(
  value: Date,
  source: PublishedHistorySeries["source"],
) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: source === "ftt" ? "America/New_York" : "UTC",
  }).format(value);
}
