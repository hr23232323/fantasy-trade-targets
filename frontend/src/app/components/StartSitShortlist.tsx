"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { captureAnalytics } from "../lib/analytics";
import type { StartSitBuilderPlayer } from "./StartSitBuilder";

type ScoringKey = "standard" | "halfPpr" | "ppr";
type PositionFilter = "FLEX" | "QB" | "RB" | "WR" | "TE";

const scoringFormats: { key: ScoringKey; label: string }[] = [
  { key: "ppr", label: "PPR" },
  { key: "halfPpr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];
const positionFilters: PositionFilter[] = ["FLEX", "QB", "RB", "WR", "TE"];

export default function StartSitShortlist({
  players,
  reviewedPaths,
}: {
  players: StartSitBuilderPlayer[];
  reviewedPaths: Record<string, string>;
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [scoring, setScoring] = useState<ScoringKey>("ppr");
  const [position, setPosition] = useState<PositionFilter>("FLEX");
  const [error, setError] = useState<string | null>(null);
  const bySlug = useMemo(() => new Map(players.map((player) => [player.slug, player])), [players]);
  const byName = useMemo(() => new Map(players.map((player) => [player.name.toLowerCase(), player])), [players]);
  const eligiblePlayers = useMemo(() => players
    .filter((player) => position === "FLEX" ? player.position !== "QB" : player.position === position)
    .toSorted((left, right) => right.projections[scoring] - left.projections[scoring] || left.name.localeCompare(right.name)), [players, position, scoring]);
  const selected = selectedSlugs
    .flatMap((slug) => bySlug.get(slug) ?? [])
    .toSorted((left, right) => right.projections[scoring] - left.projections[scoring] || left.name.localeCompare(right.name));

  function addFromSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const player = byName.get(playerName.trim().toLowerCase());
    if (!player) {
      setError("Choose a player from the suggestions.");
      return;
    }
    addPlayer(player);
    setPlayerName("");
  }

  function addPlayer(player: StartSitBuilderPlayer) {
    if (selectedSlugs.includes(player.slug)) {
      setSelectedSlugs((slugs) => slugs.filter((slug) => slug !== player.slug));
      setError(null);
      return;
    }
    if (selectedSlugs.length >= 4) {
      setError("Remove one player before adding another.");
      return;
    }
    const first = selectedSlugs.length ? bySlug.get(selectedSlugs[0]) : null;
    if (first && (first.position === "QB") !== (player.position === "QB")) {
      setError("Compare quarterbacks with quarterbacks. RB, WR and TE can share a FLEX shortlist.");
      return;
    }
    setSelectedSlugs((slugs) => [...slugs, player.slug]);
    setPosition(player.position === "QB" ? "QB" : position === "QB" ? "FLEX" : position);
    setError(null);
    captureAnalytics("start_sit_shortlist_player_selected", {
      player: player.slug,
      scoring,
      position_filter: position,
      selection_count: selectedSlugs.length + 1,
    });
  }

  const headToHeadPath = selected.length === 2 ? pathForPlayers(selected[0], selected[1], reviewedPaths) : null;

  return (
    <div className="border border-[#171c19] bg-[#171c19] shadow-[6px_6px_0_#8bcfff]">
      <div className="grid gap-5 bg-[#171c19] p-5 text-white sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><span className="font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#dfff4f]">Two to four options</span><h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">Build your lineup shortlist.</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Add the players you are actually choosing between. We&apos;ll order their current Week projections in your scoring format.</p></div>
        <div className="flex flex-wrap gap-2">{scoringFormats.map((format) => <button key={format.key} type="button" onClick={() => setScoring(format.key)} aria-pressed={scoring === format.key} className={`border border-white px-3 py-2 font-mono text-[9px] font-black uppercase ${scoring === format.key ? "bg-[#dfff4f] text-[#171c19]" : "bg-transparent text-white hover:bg-white hover:text-[#171c19]"}`}>{format.label}</button>)}</div>
      </div>

      <div className="bg-white p-5 sm:p-7">
        <form onSubmit={addFromSearch} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label><span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.08em]">Add a player</span><input list="start-sit-shortlist-players" value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Type a player name" className="min-h-12 w-full border border-[#171c19] bg-[#f8f6ef] px-4 text-base font-bold outline-none focus:bg-[#dfff4f]" /><datalist id="start-sit-shortlist-players">{eligiblePlayers.map((player) => <option key={player.slug} value={player.name}>{player.position} · {player.team ?? "FA"}</option>)}</datalist></label>
          <button type="submit" className="min-h-12 self-end border border-[#171c19] bg-[#ff6433] px-6 py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0_#171c19] hover:bg-[#171c19]">Add player</button>
        </form>
        {error ? <p className="mt-3 text-sm font-bold text-[#a52d12]" role="alert">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">{positionFilters.map((filter) => <button key={filter} type="button" onClick={() => { setPosition(filter); setSelectedSlugs([]); setError(null); }} aria-pressed={position === filter} className={`border border-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase ${position === filter ? "bg-[#8bcfff]" : "bg-white hover:bg-[#dfff4f]"}`}>{filter}</button>)}</div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="font-mono text-[9px] font-black uppercase text-[#69706c]">Top Week options</span>
            <div className="mt-3 grid max-h-[430px] gap-px overflow-y-auto border border-[#171c19] bg-[#171c19] sm:grid-cols-2">{eligiblePlayers.slice(0, 40).map((player, index) => {
              const active = selectedSlugs.includes(player.slug);
              return <button key={player.slug} type="button" onClick={() => addPlayer(player)} aria-pressed={active} className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 p-3 text-left ${active ? "bg-[#dfff4f]" : "bg-white hover:bg-[#eefbc1]"}`}><span className="font-mono text-xs font-black text-[#69706c]">{index + 1}</span><span className="relative h-10 w-10 overflow-hidden border border-[#171c19] bg-[#f3f0e7]"><Image src={player.imageSrc} alt="" fill sizes="40px" className="object-cover object-top" /></span><span className="min-w-0"><strong className="block truncate">{player.name}</strong><span className="font-mono text-[8px] font-bold uppercase text-[#69706c]">{player.position} · {player.team ?? "FA"}</span></span><span className="font-mono text-base font-black text-[#174f35]">{player.projections[scoring].toFixed(1)}</span></button>;
            })}</div>
          </div>

          <div>
            <span className="font-mono text-[9px] font-black uppercase text-[#69706c]">Your shortlist</span>
            <div className="mt-3 min-h-56 border border-[#171c19] bg-[#f3f0e7] p-4">{selected.length ? <ol className="space-y-3">{selected.map((player, index) => <li key={player.slug} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border border-[#171c19] bg-white p-3"><span className={`grid h-8 w-8 place-items-center font-mono text-xs font-black ${index === 0 ? "bg-[#dfff4f]" : "bg-[#e6e2d7]"}`}>{index + 1}</span><span className="relative h-12 w-12 overflow-hidden border border-[#171c19] bg-[#f3f0e7]"><Image src={player.imageSrc} alt="" fill sizes="48px" className="object-cover object-top" /></span><span className="min-w-0"><strong className="block truncate">{player.name}</strong><span className="text-xs text-[#69706c]">{index === 0 ? "Best current projection" : `${player.projections[scoring].toFixed(1)} projected points`}</span></span><button type="button" onClick={() => addPlayer(player)} className="font-mono text-[9px] font-black uppercase underline">Remove</button></li>)}</ol> : <div className="grid min-h-48 place-items-center border border-dashed border-[#9d9a91] p-6 text-center"><p className="max-w-xs text-sm font-bold leading-6 text-[#69706c]">Choose two to four players to rank the decision in one place.</p></div>}</div>
            {headToHeadPath ? <Link href={headToHeadPath} onClick={() => captureAnalytics("start_sit_shortlist_comparison_opened", { scoring, reviewed_pair: Boolean(reviewedPaths[[selected[0].slug, selected[1].slug].sort().join("|")]) })} className="mt-4 block border border-[#171c19] bg-[#dfff4f] px-5 py-4 text-center font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19] hover:bg-[#8bcfff]">Open the full head-to-head →</Link> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function pathForPlayers(left: StartSitBuilderPlayer, right: StartSitBuilderPlayer, reviewedPaths: Record<string, string>) {
  const pairKey = [left.slug, right.slug].sort().join("|");
  return reviewedPaths[pairKey] ?? `/who-should-i-start/${[left.urlSlug, right.urlSlug].sort().join("-vs-")}`;
}
