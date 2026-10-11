"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { captureAnalytics } from "../lib/analytics";
import TeamLogo from "./TeamLogo";

export type ScorePredictorGame = {
  id: string;
  label: string;
  week: number;
  path: string;
  away: { name: string; abbr: string; score: number };
  home: { name: string; abbr: string; score: number };
  winProbability: number;
  winnerAbbr: string;
  date: string;
};

export default function NflScorePredictor({ games }: { games: ScorePredictorGame[] }) {
  const [selectedId, setSelectedId] = useState(games[0]?.id ?? "");
  const game = useMemo(() => games.find(({ id }) => id === selectedId) ?? games[0], [games, selectedId]);
  if (!game) return null;
  const awayWins = game.winnerAbbr === game.away.abbr;
  return <section className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
    <div className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[5px_5px_0_#171c19]">
      <label className="font-mono text-[10px] font-black uppercase">Choose a matchup
        <select aria-label="Choose an NFL matchup" value={game.id} onChange={(event) => { setSelectedId(event.target.value); captureAnalytics("nfl_score_predictor_matchup_changed", { week: games.find(({ id }) => id === event.target.value)?.week ?? null }); }} className="mt-3 w-full border border-[#171c19] bg-white px-4 py-4 text-base font-black outline-none focus:ring-4 focus:ring-[#ff6b3d]">
          {games.map((option) => <option key={option.id} value={option.id}>Week {option.week}: {option.label}</option>)}
        </select>
      </label>
      <p className="mt-5 text-xs leading-6 text-[#4f5752]">Choose any published game. Projections update before kickoff as results and market context change.</p>
    </div>
    <div className="border border-[#171c19] bg-white p-6 shadow-[5px_5px_0_#171c19] sm:p-8">
      <div className="flex items-center justify-between gap-4 border-b border-[#171c19] pb-5"><span className="eyebrow">Week {game.week}</span><span className="font-mono text-[10px] font-black uppercase text-[#59605c]">{game.date}</span></div>
      <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <TeamScore team={game.away} picked={awayWins} />
        <span className="font-mono text-xs font-black uppercase text-[#747b77]">at</span>
        <TeamScore team={game.home} picked={!awayWins} />
      </div>
      <p className="mt-7 border-l-4 border-[#ff6b3d] pl-4 text-base font-black leading-7">{game.winnerAbbr} has a {Math.round(game.winProbability * 100)}% model win probability in this projection.</p>
      <Link href={game.path} className="mt-6 inline-block border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase text-white hover:bg-[#ff6b3d]">See the full matchup model →</Link>
    </div>
  </section>;
}

function TeamScore({ team, picked }: { team: ScorePredictorGame["away"]; picked: boolean }) {
  return <div className={picked ? "bg-[#dfff4f] p-4" : "p-4"}><TeamLogo team={team.abbr} size={62} decorative /><strong className="mt-3 block text-lg leading-5">{team.name}</strong><span className="mt-3 block text-5xl font-black tracking-[-0.07em]">{team.score}</span></div>;
}
