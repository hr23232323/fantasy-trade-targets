"use client";

import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  carryHistoryForward,
  findNearestHistoryIndex,
  getHistoryChartScale,
  getTimeRatio,
  normalizeHistory,
  type PublishedHistorySeries,
} from "../lib/player-insights";

export default function PlayerHistoryChart({
  series,
  name,
  id = "history",
}: {
  series: PublishedHistorySeries;
  name: string;
  id?: string;
}) {
  const observedPoints = useMemo(() => normalizeHistory(series.points), [series.points]);
  const points = useMemo(() => carryHistoryForward(series.points), [series.points]);
  const [activeIndex, setActiveIndex] = useState(points.length - 1);
  const [pinned, setPinned] = useState(false);

  if (!series.chartable || points.length < 2) return null;

  const width = 760;
  const height = 300;
  const paddingX = 42;
  const paddingTop = 24;
  const paddingBottom = 34;
  const plotHeight = height - paddingTop - paddingBottom;
  const scale = getHistoryChartScale(series.points);
  const range = Math.max(scale.max - scale.min, 1);
  const first = points[0];
  const last = points.at(-1)!;
  const firstTime = first.parsedDate.getTime();
  const lastTime = last.parsedDate.getTime();
  const timeSpan = Math.max(lastTime - firstTime, 1);
  const coordinates = points.map((point) => {
    const x = paddingX + getTimeRatio(point.parsedDate, first.parsedDate, last.parsedDate) * (width - paddingX * 2);
    const y = paddingTop + ((scale.max - point.value) / range) * plotHeight;
    return { ...point, x, y };
  });
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const baselineY = paddingTop + plotHeight;
  const area = `${paddingX},${baselineY} ${line} ${width - paddingX},${baselineY}`;
  const selectedIndex = Math.max(0, Math.min(activeIndex, coordinates.length - 1));
  const active = coordinates[selectedIndex];
  const tablePoints = [...observedPoints].slice(-120).reverse();

  function indexFromPointer(event: PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)));
    return findNearestHistoryIndex(points, firstTime + ratio * timeSpan);
  }

  function handlePointerMove(event: PointerEvent<SVGRectElement>) {
    if (!pinned) setActiveIndex(indexFromPointer(event));
  }

  function handleClick(event: PointerEvent<SVGRectElement>) {
    setActiveIndex(indexFromPointer(event));
    setPinned(true);
  }

  function handleKeyDown(event: KeyboardEvent<SVGRectElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      setActiveIndex((current) => Math.max(0, Math.min(points.length - 1, current + direction)));
      setPinned(true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : points.length - 1);
      setPinned(true);
    } else if (event.key === "Escape") {
      setPinned(false);
      setActiveIndex(points.length - 1);
    }
  }

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-labelledby={`${id}-chart-title ${id}-chart-description`}
      >
        <title id={`${id}-chart-title`}>{name} dynasty value history</title>
        <desc id={`${id}-chart-description`}>
          {name} market value from {formatDate(first.parsedDate, series.source)} through {formatDate(last.parsedDate, series.source)}.
        </desc>
        {[1, 0.5, 0].map((ratio) => {
          const y = paddingTop + (1 - ratio) * plotHeight;
          const value = Math.round(scale.min + ratio * range);
          return (
            <g key={ratio}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="rgba(23,28,25,0.18)" strokeDasharray="5 7" />
              <text x={paddingX - 8} y={y + 4} textAnchor="end" className="fill-[#69706c] text-[10px] font-bold">{value}</text>
            </g>
          );
        })}
        <polygon points={area} fill="rgba(223,255,79,0.48)" />
        <polyline points={line} fill="none" stroke="#171c19" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={active.x} x2={active.x} y1={paddingTop} y2={baselineY} stroke="rgba(23,28,25,0.4)" strokeDasharray="3 4" pointerEvents="none" />
        <circle cx={active.x} cy={active.y} r="7" fill="#ff6b3d" stroke="#171c19" strokeWidth="3" pointerEvents="none" />
        <rect
          x={paddingX}
          y={paddingTop}
          width={width - paddingX * 2}
          height={plotHeight}
          fill="transparent"
          className="cursor-crosshair outline-none focus:stroke-[#ff6b3d] focus:stroke-2"
          role="button"
          tabIndex={0}
          aria-label={`Explore ${name} market history. Current selection: ${formatFullDate(active.parsedDate, series.source)}, value ${active.value}.`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => {
            if (!pinned) setActiveIndex(points.length - 1);
          }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        />
        <text x={paddingX} y={height - 7} className="fill-[#69706c] text-[11px] font-bold">{formatDate(first.parsedDate, series.source)}</text>
        <text x={width - paddingX} y={height - 7} textAnchor="end" className="fill-[#69706c] text-[11px] font-bold">{formatDate(last.parsedDate, series.source)}</text>
      </svg>

      <div className="mt-3 flex flex-col gap-2 border border-[#171c19] bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
        <p className="font-mono text-xs font-black tabular-nums">
          {formatFullDate(active.parsedDate, series.source)} · {active.value}
        </p>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-[#69706c]">
          Select any point to inspect
        </p>
      </div>

      <figcaption className="mt-3 text-xs leading-5 text-[#69706c]">
        Historical market value on a 0–{scale.max.toLocaleString()} scale. Past movement does not predict future performance.
      </figcaption>
      <details className="mt-5 border border-[#9d9a91] bg-white/35">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">View value history</summary>
        <div className="max-h-96 overflow-auto border-t border-[#9d9a91]">
          <table className="w-full min-w-80 text-left text-sm">
            <thead className="sticky top-0 bg-[#e7e2d5] font-mono text-[10px] uppercase tracking-[0.07em]">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Value</th></tr>
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
        {observedPoints.length > tablePoints.length && (
          <p className="border-t border-[#c9c5ba] px-4 py-3 text-xs text-[#69706c]">
            Showing the latest {tablePoints.length} of {observedPoints.length} values.
          </p>
        )}
      </details>
    </figure>
  );
}

function formatFullDate(value: Date, source: PublishedHistorySeries["source"]) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(source === "ftt"
      ? { hour: "numeric" as const, minute: "2-digit" as const, timeZoneName: "short" as const, timeZone: "America/New_York" }
      : { timeZone: "UTC" }),
  }).format(value);
}

function formatDate(value: Date, source: PublishedHistorySeries["source"]) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: source === "ftt" ? "America/New_York" : "UTC",
  }).format(value);
}
