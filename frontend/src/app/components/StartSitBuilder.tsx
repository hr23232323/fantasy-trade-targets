"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { captureAnalytics } from "../lib/analytics";

export type StartSitBuilderPlayer = {
  slug: string;
  urlSlug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string | null;
  imageSrc: string;
  projections: Record<"standard" | "halfPpr" | "ppr", number>;
};

type ScoringKey = "standard" | "halfPpr" | "ppr";
type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE";

const scoringFormats: { key: ScoringKey; label: string }[] = [
  { key: "ppr", label: "PPR" },
  { key: "halfPpr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];
const positionFilters: PositionFilter[] = ["ALL", "QB", "RB", "WR", "TE"];

export default function StartSitBuilder({
  players,
  reviewedPaths,
}: {
  players: StartSitBuilderPlayer[];
  reviewedPaths: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLeftSlug = searchParams.get("player1");
  const initialScoring: ScoringKey = searchParams.get("scoring") === "STD" ? "standard" : searchParams.get("scoring") === "HALF" ? "halfPpr" : "ppr";
  const initialLeft = players.find((player) => player.urlSlug === initialLeftSlug);
  const [leftName, setLeftName] = useState(initialLeft?.name ?? "");
  const [rightName, setRightName] = useState("");
  const [scoring, setScoring] = useState<ScoringKey>(initialScoring);
  const [position, setPosition] = useState<PositionFilter>(initialLeft?.position ?? "ALL");
  const [error, setError] = useState<string | null>(null);
  const byName = useMemo(() => new Map(players.map((player) => [player.name.toLowerCase(), player])), [players]);
  const left = byName.get(leftName.trim().toLowerCase()) ?? null;
  const right = byName.get(rightName.trim().toLowerCase()) ?? null;
  const rankedPlayers = useMemo(() => players
    .filter((player) => position === "ALL" || player.position === position)
    .toSorted((a, b) => b.projections[scoring] - a.projections[scoring] || a.name.localeCompare(b.name))
    .slice(0, 30), [players, position, scoring]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const left = byName.get(leftName.trim().toLowerCase());
    const right = byName.get(rightName.trim().toLowerCase());
    if (!left || !right) {
      setError("Choose both players from the suggestions.");
      return;
    }
    if (left.slug === right.slug) {
      setError("Choose two different players.");
      return;
    }
    if ((left.position === "QB") !== (right.position === "QB")) {
      setError("Compare quarterbacks with quarterbacks. RB, WR and TE can be compared as FLEX options.");
      return;
    }
    const pairKey = [left.slug, right.slug].sort().join("|");
    const urlSlugs = [left.urlSlug, right.urlSlug].sort();
    const path = reviewedPaths[pairKey] ?? `/who-should-i-start/${urlSlugs[0]}-vs-${urlSlugs[1]}`;
    captureAnalytics("start_sit_custom_comparison_submitted", {
      left_player: left.slug,
      right_player: right.slug,
      reviewed_pair: Boolean(reviewedPaths[pairKey]),
    });
    router.push(path);
  }

  function choosePlayer(player: StartSitBuilderPlayer) {
    const other = left?.slug === player.slug ? right : left;
    if (other && (other.position === "QB") !== (player.position === "QB")) {
      setError("Compare quarterbacks with quarterbacks. RB, WR and TE can be compared as FLEX options.");
      return;
    }
    setError(null);
    if (!left || (left && right)) {
      setLeftName(player.name);
      if (left && right) setRightName("");
    } else {
      setRightName(player.name);
    }
    captureAnalytics("start_sit_ranked_player_selected", { player: player.slug, scoring, position_filter: position });
  }

  return (
    <form onSubmit={submit} className="border border-[#171c19] bg-white p-5 shadow-[6px_6px_0_#171c19] sm:p-7">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
        <PlayerInput label="Player one" value={leftName} onChange={setLeftName} players={players} listId="start-sit-left" />
        <span className="hidden pb-4 font-mono text-xs font-black uppercase md:block">or</span>
        <PlayerInput label="Player two" value={rightName} onChange={setRightName} players={players} listId="start-sit-right" />
        <button type="submit" className="min-h-12 border border-[#171c19] bg-[#ff6433] px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.06em] text-white shadow-[3px_3px_0_#171c19] hover:bg-[#171c19]">Compare →</button>
      </div>
      {error ? <p className="mt-4 text-sm font-bold text-[#a52d12]" role="alert">{error}</p> : null}
      {(left || right) ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{left ? <SelectedPlayer player={left} label="Player one" scoring={scoring} /> : <EmptySelection label="Player one" />}{right ? <SelectedPlayer player={right} label="Player two" scoring={scoring} /> : <EmptySelection label="Choose player two" />}</div> : null}
      <p className="mt-4 text-xs leading-6 text-[#69706c]">Choose any two quarterbacks, or compare any RB, WR or TE FLEX options. Every valid pairing gets a shareable weekly URL.</p>

      <div className="mt-8 border-t border-[#bcb9ae] pt-7">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#69706c]">Week rankings</span><h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">Tap two players to compare.</h3></div><div className="flex flex-wrap gap-2">{scoringFormats.map((format) => <button key={format.key} type="button" onClick={() => setScoring(format.key)} aria-pressed={scoring === format.key} className={`border border-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase ${scoring === format.key ? "bg-[#171c19] text-white" : "bg-[#f3f0e7] hover:bg-[#dfff4f]"}`}>{format.label}</button>)}</div></div>
        <div className="mt-4 flex flex-wrap gap-2">{positionFilters.map((filter) => <button key={filter} type="button" onClick={() => setPosition(filter)} aria-pressed={position === filter} className={`border border-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase ${position === filter ? "bg-[#8bcfff]" : "bg-white hover:bg-[#dfff4f]"}`}>{filter}</button>)}</div>
        <div className="mt-5 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-3">{rankedPlayers.map((player, index) => <button key={player.slug} type="button" onClick={() => choosePlayer(player)} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 bg-white p-3 text-left hover:bg-[#eefbc1]"><span className="font-mono text-xs font-black text-[#69706c]">{index + 1}</span><span className="relative h-11 w-11 overflow-hidden border border-[#171c19] bg-[#f3f0e7]"><Image src={player.imageSrc} alt="" fill sizes="44px" className="object-cover object-top" /></span><span className="min-w-0"><strong className="block truncate">{player.name}</strong><span className="font-mono text-[9px] font-bold uppercase text-[#69706c]">{player.position} · {player.team ?? "FA"}</span></span><span className="font-mono text-lg font-black text-[#174f35]">{player.projections[scoring].toFixed(1)}</span></button>)}</div>
      </div>
    </form>
  );
}

function SelectedPlayer({ player, label, scoring }: { player: StartSitBuilderPlayer; label: string; scoring: ScoringKey }) {
  return <div className="flex items-center gap-3 border border-[#171c19] bg-[#f3f0e7] p-3"><span className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#171c19] bg-white"><Image src={player.imageSrc} alt="" fill sizes="56px" className="object-cover object-top" /></span><span className="min-w-0 flex-1"><span className="font-mono text-[8px] font-black uppercase text-[#69706c]">{label}</span><strong className="block truncate">{player.name}</strong><span className="text-xs text-[#69706c]">{player.position} · {player.team ?? "FA"}</span></span><strong className="font-mono text-xl text-[#174f35]">{player.projections[scoring].toFixed(1)}</strong></div>;
}

function EmptySelection({ label }: { label: string }) { return <div className="flex min-h-20 items-center border border-dashed border-[#69706c] px-4 font-mono text-[10px] font-black uppercase text-[#69706c]">{label}</div>; }

function PlayerInput({
  label,
  value,
  onChange,
  players,
  listId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  players: StartSitBuilderPlayer[];
  listId: string;
}) {
  return <label className="block"><span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.08em]">{label}</span><input required list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type a player name" className="min-h-12 w-full border border-[#171c19] bg-[#f8f6ef] px-4 text-base font-bold outline-none focus:bg-[#dfff4f]" /><datalist id={listId}>{players.map((player) => <option key={player.slug} value={player.name}>{player.position} · {player.team ?? "FA"}</option>)}</datalist></label>;
}
