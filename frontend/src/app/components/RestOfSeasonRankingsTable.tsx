"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { captureAnalytics } from "../lib/analytics";
import type { RestOfSeasonRankingRow, RestOfSeasonScoringKey } from "../lib/rest-of-season";

const formats: { key: RestOfSeasonScoringKey; label: string }[] = [
  { key: "ppr", label: "PPR" },
  { key: "halfPpr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];

export default function RestOfSeasonRankingsTable({ rows, position }: { rows: RestOfSeasonRankingRow[]; position: string }) {
  const [scoring, setScoring] = useState<RestOfSeasonScoringKey>("ppr");
  const ranked = useMemo(() => [...rows].sort((left, right) =>
    left.formats[scoring].rank - right.formats[scoring].rank || left.name.localeCompare(right.name),
  ), [rows, scoring]);

  function chooseScoring(key: RestOfSeasonScoringKey) {
    setScoring(key);
    captureAnalytics("rest_of_season_rankings_scoring_changed", { scoring: key, position });
  }

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2" aria-label="Scoring format">
        {formats.map((format) => <button key={format.key} type="button" onClick={() => chooseScoring(format.key)} aria-pressed={scoring === format.key} className={`border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] ${scoring === format.key ? "bg-[#171c19] text-white" : "bg-white hover:bg-[#dfff4f]"}`}>{format.label}</button>)}
      </div>
      <span className="font-mono text-[10px] font-black uppercase text-[#69706c]">Rest of 2026 · 4-point passing TD</span>
    </div>
    <div className="overflow-x-auto border border-[#171c19] bg-white/65 shadow-[5px_5px_0_#171c19]">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">ROS rank</th><th className="p-4">Player</th><th className="p-4">Market read</th><th className="p-4">Recent PPG</th><th className="p-4">Workload</th><th className="p-4">Remaining schedule</th><th className="bg-[#dfff4f] p-4 text-[#171c19]">FTT rating</th></tr></thead>
        <tbody className="divide-y divide-[#bcb9ae]">
          {ranked.map((row) => {
            const view = row.formats[scoring];
            const delta = view.marketRank - view.rank;
            return <tr key={row.slug} className="group hover:bg-[#eefbc1]">
              <td className="p-4 font-mono text-lg font-black">#{view.rank}</td>
              <td className="p-4"><div className="flex min-w-56 items-center gap-3"><span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden border border-[#171c19] bg-[#f3f0e7] font-mono text-xs font-black">{row.imageSrc ? <Image src={row.imageSrc} alt="" fill sizes="48px" className="object-cover object-top" /> : initials(row.name)}</span><span><Link href={`/players/${row.slug}`} className="font-black underline decoration-[#ff6433] decoration-2 underline-offset-4">{row.name}</Link><span className="mt-1 block font-mono text-[9px] font-bold uppercase text-[#69706c]">{row.position} · {row.team ?? "FA"}</span></span></div></td>
              <td className="p-4"><strong className={delta > 0 ? "text-[#174f35]" : delta < 0 ? "text-[#a93415]" : ""}>{marketRead(delta)}</strong><span className="mt-1 block text-xs text-[#69706c]">Market rank #{view.marketRank}</span></td>
              <td className="p-4"><span className="font-mono font-black">{number(view.recentPointsPerGame)}</span><span className="mt-1 block text-xs text-[#69706c]">{row.currentSeasonGames} games</span></td>
              <td className="p-4"><span className="font-mono font-black">{number(view.recentOpportunity)}</span><span className="mt-1 block text-xs text-[#69706c]">{snapLabel(view.recentSnapPct)}</span></td>
              <td className="p-4"><strong>{scheduleLabel(view.schedulePercentile)}</strong><span className="mt-1 block text-xs text-[#69706c]">{view.remainingGames} rated matchups</span></td>
              <td className="bg-[#f7ffd9] p-4 font-mono text-xl font-black text-[#174f35]">{(view.rating / 10).toFixed(1)}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}

function marketRead(delta: number) {
  if (delta >= 3) return `↑ ${delta} vs. market`;
  if (delta <= -3) return `↓ ${Math.abs(delta)} vs. market`;
  return "Near market";
}

function scheduleLabel(percentile: number) {
  if (percentile >= 0.67) return "Favorable";
  if (percentile <= 0.33) return "Demanding";
  return "Balanced";
}

function snapLabel(value: number | null) {
  return value === null ? "Snap share unavailable" : `${Math.round(value * 100)}% recent snaps`;
}

function number(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("");
}
