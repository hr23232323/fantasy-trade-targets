"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { captureAnalytics } from "../lib/analytics";
import type { PlayoffScoringField } from "../lib/playoff-schedule";
import TeamLogo from "./TeamLogo";

export type PlayoffScheduleTableRow = {
  team: { abbr: string; name: string; slug: string };
  games: Array<{
    week: number;
    site: "home" | "away" | "neutral" | null;
    opponent: { abbr: string; name: string; slug: string } | null;
    bye: boolean;
    pointsAllowed: Record<PlayoffScoringField, number>;
  }>;
  averages: Record<PlayoffScoringField, number>;
  players: Array<{ slug: string; name: string }>;
};

const formats = [
  { field: "ppr", label: "PPR" },
  { field: "halfPpr", label: "Half PPR" },
  { field: "standard", label: "Standard" },
] as const;

export default function PlayoffScheduleTable({
  windows,
  position,
}: {
  windows: Array<{ key: string; label: string; weeks: number[]; rows: PlayoffScheduleTableRow[] }>;
  position: string;
}) {
  const [windowKey, setWindowKey] = useState(windows[0]?.key ?? "weeks-15-17");
  const [format, setFormat] = useState<PlayoffScoringField>("ppr");
  const selectedWindow = windows.find(({ key }) => key === windowKey) ?? windows[0];
  const rows = useMemo(() => [...(selectedWindow?.rows ?? [])].sort((left, right) =>
    right.averages[format] - left.averages[format] || left.team.name.localeCompare(right.team.name),
  ), [format, selectedWindow]);

  function trackFilter(nextWindow: string, nextFormat: PlayoffScoringField) {
    captureAnalytics("playoff_schedule_filter_changed", {
      position,
      playoff_window: nextWindow,
      scoring_format: nextFormat,
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 border border-[#171c19] bg-white/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="mono-label text-[#69706c]">League playoff weeks</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {windows.map((window) => <button key={window.key} type="button" aria-pressed={window.key === windowKey} onClick={() => { setWindowKey(window.key); trackFilter(window.key, format); }} className={`border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase ${window.key === windowKey ? "bg-[#171c19] text-white" : "bg-white hover:bg-[#dfff4f]"}`}>{window.label}</button>)}
          </div>
        </div>
        <div>
          <span className="mono-label text-[#69706c]">Scoring</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {formats.map((item) => <button key={item.field} type="button" aria-pressed={item.field === format} onClick={() => { setFormat(item.field); trackFilter(windowKey, item.field); }} className={`border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase ${item.field === format ? "bg-[#ff6b3d] text-white" : "bg-white hover:bg-[#ffb29a]"}`}>{item.label}</button>)}
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm font-bold" aria-live="polite">
        Ranked for {selectedWindow?.label} in {formats.find((item) => item.field === format)?.label}. Higher opponent points allowed means a friendlier schedule.
      </p>
      <div className="overflow-x-auto border border-[#171c19] bg-white/55">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white">
            <tr><th className="p-4">Rank</th><th className="p-4">Team</th>{selectedWindow?.weeks.map((week) => <th key={week} className="p-4">Week {week}</th>)}<th className="p-4">Playoff avg.</th><th className="p-4">Players to inspect</th></tr>
          </thead>
          <tbody className="divide-y divide-[#bcb9ae]">
            {rows.map((row, index) => (
              <tr key={row.team.abbr} className={index < 5 ? "bg-[#edffc2]" : index >= rows.length - 5 ? "bg-[#ffe0d6]" : ""}>
                <td className="p-4 font-mono text-lg font-black">#{index + 1}</td>
                <td className="p-4"><Link href={`/teams/${row.team.slug}`} className="flex items-center gap-3 font-black hover:underline"><TeamLogo team={row.team.abbr} size={36} decorative />{row.team.name}</Link></td>
                {row.games.map((game) => <td key={game.week} className="p-4">{game.bye || !game.opponent ? <><span className="font-mono text-xs font-black text-[#a23616]">BYE</span><span className="mt-1 block font-mono text-[10px] text-[#69706c]">No player points</span></> : <><Link href={`/teams/${game.opponent.slug}`} className="font-mono text-xs font-black hover:underline">{game.site === "away" ? "@" : "vs"} {game.opponent.abbr}</Link><span className="mt-1 block font-mono text-[10px] text-[#69706c]">{game.pointsAllowed[format].toFixed(1)} allowed</span></>}</td>)}
                <td className="p-4 font-mono text-xl font-black">{row.averages[format].toFixed(1)}</td>
                <td className="p-4"><div className="flex flex-wrap gap-2">{row.players.length ? row.players.map((player) => <Link key={player.slug} href={`/players/${player.slug}`} className="border border-[#171c19] bg-white px-2 py-1 text-xs font-bold hover:bg-[#8bcfff]">{player.name}</Link>) : <span className="text-xs text-[#69706c]">Team depth chart</span>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
