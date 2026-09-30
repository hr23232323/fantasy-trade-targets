"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { captureAnalytics } from "../lib/analytics";

type ScoringKey = "standard" | "halfPpr" | "ppr";
type Projection = { floor: number; median: number; ceiling: number };

export type WeeklyRankingRow = {
  slug: string;
  urlSlug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string | null;
  opponent: string | null;
  imageSrc: string;
  availability: string;
  projections: Record<ScoringKey, Projection>;
};

const formats: { key: ScoringKey; label: string; urlValue: string }[] = [
  { key: "ppr", label: "PPR", urlValue: "PPR" },
  { key: "halfPpr", label: "Half PPR", urlValue: "HALF" },
  { key: "standard", label: "Standard", urlValue: "STD" },
];

export default function WeeklyRankingsTable({ rows, week, positionLabel }: { rows: WeeklyRankingRow[]; week: number; positionLabel: string }) {
  const [scoring, setScoring] = useState<ScoringKey>("ppr");
  const ranked = useMemo(() => [...rows].sort((left, right) =>
    right.projections[scoring].median - left.projections[scoring].median ||
    right.projections[scoring].ceiling - left.projections[scoring].ceiling ||
    left.name.localeCompare(right.name),
  ), [rows, scoring]);
  const selectedFormat = formats.find((format) => format.key === scoring)!;

  function chooseFormat(key: ScoringKey) {
    setScoring(key);
    captureAnalytics("weekly_rankings_scoring_changed", { week, position: positionLabel, scoring: key });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Scoring format">
          {formats.map((format) => <button key={format.key} type="button" onClick={() => chooseFormat(format.key)} aria-pressed={scoring === format.key} className={`border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] ${scoring === format.key ? "bg-[#171c19] text-white" : "bg-white hover:bg-[#dfff4f]"}`}>{format.label}</button>)}
        </div>
        <span className="font-mono text-[10px] font-black uppercase text-[#69706c]">Week {week} · 4-point passing TD</span>
      </div>

      <div className="overflow-x-auto border border-[#171c19] bg-white/65 shadow-[5px_5px_0_#171c19]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Player</th><th className="p-4">Matchup</th><th className="p-4">Floor</th><th className="bg-[#dfff4f] p-4 text-[#171c19]">Projection</th><th className="p-4">Ceiling</th><th className="p-4">Compare</th></tr></thead>
          <tbody className="divide-y divide-[#bcb9ae]">
            {ranked.map((row, index) => {
              const projection = row.projections[scoring];
              return <tr key={row.slug} className="group hover:bg-[#eefbc1]">
                <td className="p-4 font-mono text-lg font-black">#{index + 1}</td>
                <td className="p-4"><div className="flex min-w-56 items-center gap-3"><span className="relative h-12 w-12 shrink-0 overflow-hidden border border-[#171c19] bg-[#f3f0e7]"><Image src={row.imageSrc} alt="" fill sizes="48px" className="object-cover object-top" /></span><span><Link href={`/players/${row.slug}`} className="font-black underline decoration-[#ff6433] decoration-2 underline-offset-4">{row.name}</Link><span className="mt-1 block font-mono text-[9px] font-bold uppercase text-[#69706c]">{row.position} · {row.team ?? "FA"}</span></span></div></td>
                <td className="p-4"><strong>{row.team ?? "—"} vs. {row.opponent ?? "TBD"}</strong><span className="mt-1 block text-xs text-[#69706c]">{row.availability}</span></td>
                <td className="p-4 font-mono">{projection.floor.toFixed(1)}</td>
                <td className="bg-[#f7ffd9] p-4 font-mono text-xl font-black text-[#174f35]">{projection.median.toFixed(1)}</td>
                <td className="p-4 font-mono">{projection.ceiling.toFixed(1)}</td>
                <td className="p-4"><Link href={`/who-should-i-start?player1=${row.urlSlug}&scoring=${selectedFormat.urlValue}`} className="inline-block border border-[#171c19] bg-white px-3 py-2 font-mono text-[9px] font-black uppercase shadow-[2px_2px_0_#171c19] group-hover:bg-[#ffb29a]">Choose opponent →</Link></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
