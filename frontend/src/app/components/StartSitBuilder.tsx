"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { captureAnalytics } from "../lib/analytics";

type PlayerOption = {
  slug: string;
  urlSlug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string | null;
};

export default function StartSitBuilder({
  players,
  reviewedPaths,
}: {
  players: PlayerOption[];
  reviewedPaths: Record<string, string>;
}) {
  const router = useRouter();
  const [leftName, setLeftName] = useState("");
  const [rightName, setRightName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const byName = useMemo(() => new Map(players.map((player) => [player.name.toLowerCase(), player])), [players]);

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

  return (
    <form onSubmit={submit} className="border border-[#171c19] bg-white p-5 shadow-[6px_6px_0_#171c19] sm:p-7">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
        <PlayerInput label="Player one" value={leftName} onChange={setLeftName} players={players} listId="start-sit-left" />
        <span className="hidden pb-4 font-mono text-xs font-black uppercase md:block">or</span>
        <PlayerInput label="Player two" value={rightName} onChange={setRightName} players={players} listId="start-sit-right" />
        <button type="submit" className="min-h-12 border border-[#171c19] bg-[#ff6433] px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.06em] text-white shadow-[3px_3px_0_#171c19] hover:bg-[#171c19]">Compare →</button>
      </div>
      {error ? <p className="mt-4 text-sm font-bold text-[#a52d12]" role="alert">{error}</p> : null}
      <p className="mt-4 text-xs leading-6 text-[#69706c]">Choose any two quarterbacks, or compare any RB, WR or TE FLEX options. Your comparison gets a shareable weekly URL.</p>
    </form>
  );
}

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
  players: PlayerOption[];
  listId: string;
}) {
  return <label className="block"><span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.08em]">{label}</span><input required list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type a player name" className="min-h-12 w-full border border-[#171c19] bg-[#f8f6ef] px-4 text-base font-bold outline-none focus:bg-[#dfff4f]" /><datalist id={listId}>{players.map((player) => <option key={player.slug} value={player.name}>{player.position} · {player.team ?? "FA"}</option>)}</datalist></label>;
}
