import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import BettingDisclosure from "../components/BettingDisclosure";
import JsonLd from "../components/JsonLd";
import NflScorePredictor, { type ScorePredictorGame } from "../components/NflScorePredictor";
import { currentPredictionWeek, getPredictionGamesForWeek, predictionGamePath, predictionRelease, projectedScore, publishedPredictionWeeks, winner } from "../lib/nfl-predictions";
import { formatGameDate } from "../lib/team-data";

const SITE_URL = "https://fantasytradetarget.com";
export const metadata: Metadata = { title: "NFL Score Predictor 2026 — Predict Every Game", description: "Choose an NFL matchup and see the FTT model's projected score, winner and win probability. Updated through the current week with transparent methodology.", alternates: { canonical: "/nfl-score-predictor" } };

export default function NflScorePredictorPage() {
  const games = publishedPredictionWeeks.flatMap((week) => getPredictionGamesForWeek(week)).flatMap((game): ScorePredictorGame[] => {
    const score = projectedScore(game); const picked = winner(game); if (!score || !picked || game.snapshot.homeWinProbability === undefined) return [];
    const pickedProbability = picked.abbr === game.home.abbr ? game.snapshot.homeWinProbability : 1 - game.snapshot.homeWinProbability;
    return [{ id: game.snapshot.gameId, label: `${game.away.name} at ${game.home.name}`, week: game.snapshot.week, path: predictionGamePath(game.snapshot.week, game.slug), away: { name: game.away.name, abbr: game.away.abbr, score: score.away }, home: { name: game.home.name, abbr: game.home.abbr, score: score.home }, winProbability: pickedProbability, winnerAbbr: picked.abbr, date: formatGameDate(game.homeGame.date) }];
  });
  const faqs = [
    { q: "How does the NFL score predictor work?", a: "FTT blends opponent-adjusted scoring, recent performance and prior-season team strength, then turns the projected margin and total into an expected score." },
    { q: "When do NFL score predictions update?", a: "The current and next-week boards refresh when the nflverse schedule and results feed updates. Each pregame prediction freezes at kickoff." },
    { q: "Are projected scores guaranteed?", a: "No. A projected score is the center of a wide range of possible outcomes, not a promise or betting recommendation." },
  ];
  return <>
    <AnalyticsPageView eventName="nfl_score_predictor_viewed" properties={{ active_week: currentPredictionWeek, game_count: games.length, release_id: predictionRelease.releaseId }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "NFL Score Predictor", url: `${SITE_URL}/nfl-score-predictor`, applicationCategory: "SportsApplication", operatingSystem: "Any", isAccessibleForFree: true, dateModified: predictionRelease.capturedAt, description: metadata.description }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Interactive matchup model</span><h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">NFL score <span className="text-[#ff4f27]">predictor.</span></h1><p className="mt-8 max-w-3xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">Pick any current or upcoming matchup to see the projected final score, winner and model win probability.</p></div></section>
    <main className="page-wrap py-12"><NflScorePredictor games={games} />
      <section className="mt-14 grid gap-8 border-t border-[#171c19] pt-10 lg:grid-cols-[.8fr_1.2fr]"><div><span className="eyebrow">Read the range</span><h2 className="section-title mt-5">A forecast, not a final.</h2></div><div className="space-y-5 text-sm leading-7 text-[#4b524e]"><p>The score is a model midpoint. Turnovers, injuries, weather and game script can move the final well away from it.</p><p>Use the individual matchup page for the projected margin, total, listed market line and team context. Or scan every game on the <Link href={`/nfl-score-predictions/week-${currentPredictionWeek}`} className="font-black underline">Week {currentPredictionWeek} score predictions</Link> board.</p></div></section>
      <section className="mt-14"><span className="eyebrow">Score predictor FAQ</span><div className="mt-6 grid gap-4 lg:grid-cols-3">{faqs.map((faq) => <article key={faq.q} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><h2 className="text-xl font-black">{faq.q}</h2><p className="mt-4 text-sm leading-7 text-[#59605c]">{faq.a}</p></article>)}</div></section>
    </main><BettingDisclosure />
  </>;
}
