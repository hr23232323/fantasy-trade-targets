import Link from "next/link";
import { getNflversePlayer, nflversePlayerRelease, rosterStatusLabel } from "../lib/nflverse";
import type { Position } from "../types/MarketAsset";
import type { NflverseGameLog } from "../types/NflversePlayer";

export default function PlayerPerformance({ slug, name, position }: { slug: string; name: string; position: Position }) {
  const context = getNflversePlayer(slug);
  if (!context) return null;
  const injury = context.injury;
  const injuryName = injury?.reportPrimaryInjury ?? injury?.practicePrimaryInjury ?? injury?.practiceSecondaryInjury;

  return (
    <section className="page-wrap py-10" aria-labelledby="nflverse-performance-title">
      <div className="grid gap-7 border-t border-[#171c19] pt-7 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
        <div><span className="eyebrow">NFL game log // verified results</span><h2 id="nflverse-performance-title" className="section-title mt-6">{name}, week by week.</h2></div>
        <p className="text-sm leading-7 text-[#69706c]">Official-box-score-style weekly results, fantasy points in all three reception settings, and offensive snap participation. These are historical outcomes, not next-game projections.</p>
      </div>

      <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
        <ContextCard label="Roster status" value={rosterStatusLabel(context.roster?.status)} detail={context.roster?.team ? `${context.roster.team} · Week ${context.roster.week ?? "—"}` : "No current roster match"} accent="bg-[#dfff4f]" />
        <ContextCard label="Listed role" value={context.roster?.depthChartPosition ?? context.roster?.position ?? position} detail={context.roster?.jerseyNumber ? `No. ${context.roster.jerseyNumber} · ${context.roster.yearsExperience ?? "—"} years experience` : `${context.roster?.yearsExperience ?? "—"} years experience`} accent="bg-[#8bcfff]" />
        <ContextCard label="Game designation" value={injury?.reportStatus ?? "No designation listed"} detail={injuryName ? `${injuryName} · Week ${injury?.week ?? "—"}` : `Week ${injury?.week ?? context.roster?.week ?? "—"} report`} accent="bg-[#ffb29a]" />
        <ContextCard label="Practice report" value={injury?.practiceStatus ?? "No limitation listed"} detail={injury?.practicePrimaryInjury ?? injury?.practiceSecondaryInjury ?? "No practice injury listed"} accent="bg-[#d7b6ff]" />
      </div>

      {context.seasons.length > 0 ? (
        <div className="mt-8 overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Season</th><th className="p-4 text-right">Games</th><th className="p-4 text-right">Standard PPG</th><th className="p-4 text-right">Half PPR PPG</th><th className="p-4 text-right">PPR PPG</th><th className="p-4 text-right">Off. snaps/game</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">{context.seasons.map((season) => <tr key={season.season}><td className="p-4 font-black">{season.season}</td><td className="p-4 text-right font-mono">{season.games}</td><td className="p-4 text-right font-mono">{season.fantasyPointsPerGame.toFixed(1)}</td><td className="p-4 text-right font-mono font-black">{season.halfPprPointsPerGame.toFixed(1)}</td><td className="p-4 text-right font-mono">{season.pprPointsPerGame.toFixed(1)}</td><td className="p-4 text-right font-mono">{season.offenseSnapsPerGame?.toFixed(1) ?? "—"}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}

      {context.games.length > 0 ? (
        <div className="mt-8 overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Game</th><th className="p-4">Volume</th><th className="p-4 text-right">Standard</th><th className="p-4 text-right">Half PPR</th><th className="p-4 text-right">PPR</th><th className="p-4 text-right">Snap share</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">{context.games.slice(0, 10).map((game) => <tr key={game.gameId}><td className="p-4"><strong>{game.season} · Week {game.week}</strong><span className="mt-1 block text-xs text-[#69706c]">{game.team} vs. {game.opponent}</span></td><td className="p-4 text-xs text-[#59605c]">{volumeLine(game, position)}</td><td className="p-4 text-right font-mono">{formatPoints(game.fantasyPoints)}</td><td className="p-4 text-right font-mono font-black">{formatPoints(game.fantasyPointsHalfPpr)}</td><td className="p-4 text-right font-mono">{formatPoints(game.fantasyPointsPpr)}</td><td className="p-4 text-right font-mono">{game.offenseSnapPct === null ? "—" : `${Math.round(game.offenseSnapPct * 100)}%`}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="mt-8 border border-[#171c19] bg-white/55 p-6 text-sm leading-7 text-[#69706c]">No regular-season NFL game log is available for this player in the current three-season window.</p>}

      <p className="mt-5 text-xs leading-6 text-[#69706c]">Data from <a href={nflversePlayerRelease.license.projectUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">nflverse</a>, licensed <a href={nflversePlayerRelease.license.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">{nflversePlayerRelease.license.shortName}</a>. Updated {new Date(nflversePlayerRelease.capturedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET. <Link href="/data-sources#nflverse-player-data" className="font-bold underline">Sources and field limits</Link>.</p>
    </section>
  );
}

function ContextCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return <dl className={`${accent} p-5`}><dt className="mono-label text-[#59605c]">{label}</dt><dd className="mt-4 text-xl font-black tracking-[-0.035em]">{value}</dd><dd className="mt-2 text-xs leading-5 text-[#59605c]">{detail}</dd></dl>;
}

function formatPoints(value: number | null) { return value === null ? "—" : value.toFixed(1); }
function volumeLine(game: NflverseGameLog, position: Position) {
  if (position === "QB") return `${game.passing.completions ?? 0}/${game.passing.attempts ?? 0} passing · ${game.passing.passingYards ?? 0} yards · ${game.passing.passingTds ?? 0} TD · ${game.rushing.rushingYards ?? 0} rush yards`;
  const touches = (game.rushing.carries ?? 0) + (game.receiving.receptions ?? 0);
  const yards = (game.rushing.rushingYards ?? 0) + (game.receiving.receivingYards ?? 0);
  const touchdowns = (game.rushing.rushingTds ?? 0) + (game.receiving.receivingTds ?? 0);
  return `${touches} touches · ${game.receiving.targets ?? 0} targets · ${yards} scrimmage yards · ${touchdowns} TD`;
}
