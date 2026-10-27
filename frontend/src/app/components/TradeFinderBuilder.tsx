"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { captureAnalytics } from "../lib/analytics";

type PlayerOption = { slug: string; name: string; position: string; team: string | null };
type PublishedPair = { slug: string; leftSlug: string; rightSlug: string };

export default function TradeFinderBuilder({ players, pairs }: { players: PlayerOption[]; pairs: PublishedPair[] }) {
  const router = useRouter();
  const [send, setSend] = useState(players[0]?.slug ?? "");
  const [receive, setReceive] = useState(players[1]?.slug ?? "");
  const pairByPlayers = useMemo(() => new Map(pairs.map((pair) => [[pair.leftSlug, pair.rightSlug].sort().join("|"), pair.slug])), [pairs]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!send || !receive || send === receive) return;
    const slug = pairByPlayers.get([send, receive].sort().join("|"));
    captureAnalytics("trade_finder_submitted", { send, receive, researched_matchup: Boolean(slug) });
    router.push(slug ? `/should-i-trade/${slug}` : `/fantasy-trade-calculator?send=${send}&get=${receive}`);
  }

  return <form onSubmit={submit} className="border border-[#171c19] bg-white p-5 shadow-[5px_5px_0_#171c19] sm:p-7">
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
      <label className="block"><span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.08em]">I would trade away</span><select value={send} onChange={(event) => setSend(event.target.value)} className="w-full border border-[#171c19] bg-[#f3f0e7] px-4 py-4 text-sm font-bold"><option value="">Choose a player</option>{players.map((player) => <option key={player.slug} value={player.slug}>{player.name} · {player.position}{player.team ? ` · ${player.team}` : ""}</option>)}</select></label>
      <span className="hidden pb-4 font-black md:block">FOR</span>
      <label className="block"><span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.08em]">I would receive</span><select value={receive} onChange={(event) => setReceive(event.target.value)} className="w-full border border-[#171c19] bg-[#f3f0e7] px-4 py-4 text-sm font-bold"><option value="">Choose a player</option>{players.map((player) => <option key={player.slug} value={player.slug}>{player.name} · {player.position}{player.team ? ` · ${player.team}` : ""}</option>)}</select></label>
      <button type="submit" disabled={!send || !receive || send === receive} className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19] disabled:cursor-not-allowed disabled:opacity-40">Compare the trade →</button>
    </div>
    <p className="mt-4 text-xs leading-6 text-[#69706c]">Reviewed matchups open a full rest-of-season breakdown. Every other pairing opens preloaded in the trade calculator.</p>
  </form>;
}
