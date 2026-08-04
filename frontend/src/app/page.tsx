import Link from "next/link";
import CalculatorGuide from "./components/CalculatorGuide";
import FaqBlock from "./components/FaqBlock";
import MarketBoard from "./components/ServerMarketBoard";
import TradeCalculator from "./components/TradeCalculator";
import { buildPageMetadata } from "./lib/metadata";
import { playerPages } from "./lib/player-pages";
import { teams } from "./lib/team-data";

export const metadata = buildPageMetadata({
  title: "Fantasy Football Trade Targets, Calculator & Rankings",
  description:
    "Find fantasy football trade targets, compare complete offers, and browse daily dynasty values. Free, no login, with Superflex, TE premium, and rookie picks.",
  path: "",
});

const homeFaqs = [
  {
    question: "How do I find good fantasy football trade targets?",
    answer:
      "Start with players whose age, position, and market tier fit your roster window. Use the trade target finder to narrow the board, then build an offer in the calculator and compare the adjusted package value.",
  },
  {
    question: "Are the fantasy trade values updated?",
    answer:
      "Yes. The market feed is refreshed daily and cached for fast, free use. Every calculator result displays the source attribution and update date.",
  },
  {
    question: "Does the calculator support rookie draft picks?",
    answer:
      "Yes. Dynasty mode includes exact rookie pick slots for multiple future classes and adjusts those pick values for 1QB or Superflex and league size.",
  },
  {
    question: "Is Fantasy Trade Target affiliated with Sleeper or the NFL?",
    answer:
      "No. Fantasy Trade Target is an independent tool and is not affiliated with the NFL, Sleeper, or another fantasy platform.",
  },
];

export default function Home() {
  return (
    <>
      <section className="page-wrap py-14 sm:py-20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="eyebrow">Daily market intelligence // $0</span>
          <span className="mono-label text-[#69706c]">Dynasty · redraft · rookie picks</span>
        </div>
        <h1 className="display-type mt-8 max-w-[1120px] uppercase">
          Find the target. <span className="text-[#ff6b3d]">Price the move.</span>
        </h1>
        <div className="mt-9 grid gap-6 border-t border-[#171c19] pt-6 md:grid-cols-[1fr_auto] md:items-start">
          <p className="max-w-2xl text-lg font-medium leading-8 text-[#525955]">
            Free fantasy football trade tools that show their work. Search the market,
            build the complete offer, and account for the hidden cost of extra roster spots.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#trade-calculator"
              className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#dfff4f]"
            >
              Open calculator ↘
            </Link>
            <Link
              href="#trade-targets"
              className="border border-[#171c19] bg-white/50 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em]"
            >
              Find targets
            </Link>
          </div>
        </div>
      </section>

      <div className="page-wrap">
        <TradeCalculator />
      </div>

      <CalculatorGuide mode="dynasty" />

      <div id="trade-targets" className="page-wrap scroll-mt-10">
        <MarketBoard />
      </div>

      <section className="page-wrap py-20">
        <div className="grid gap-8 border-y border-[#171c19] py-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <span className="eyebrow">Player research // market files</span>
            <h2 className="section-title mt-6">50 market files. Fully sourced.</h2>
          </div>
          <div>
            <p className="max-w-2xl text-sm leading-7 text-[#59605c]">
              Direct dynasty answers, four-format pricing, historical charts, production, usage, comparable players, pick equivalents, and visible source records.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {playerPages.slice(0, 10).map((player) => (
                <Link
                  key={player.slug}
                  href={`/players/${player.slug}`}
                  className="border border-[#171c19] bg-white/55 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.06em] hover:bg-[#dfff4f]"
                >
                  {player.name} →
                </Link>
              ))}
              <Link
                href="/players"
                className="border border-[#171c19] bg-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.06em] text-white hover:bg-[#a23616]"
              >
                Browse all 50 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap pb-20">
        <div className="grid gap-8 border-y border-[#171c19] py-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <span className="eyebrow">Team intelligence // full calendar</span>
            <h2 className="section-title mt-6">32 teams. Every matchup connected.</h2>
          </div>
          <div>
            <p className="max-w-2xl text-sm leading-7 text-[#59605c]">
              Follow dynasty assets from player to team, then read the complete schedule through opponent scoring defense, site, rest, venue, and division context.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {teams.slice(0, 8).map((team) => (
                <Link key={team.abbr} href={`/teams/${team.slug}`} className="border border-[#171c19] bg-white/55 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.06em] hover:bg-[#8bcfff]">
                  {team.abbr} →
                </Link>
              ))}
              <Link href="/teams" className="border border-[#171c19] bg-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.06em] text-white hover:bg-[#a23616]">
                Browse all 32 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap pb-20">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
          <Link href="/dynasty-trade-calculator" className="group bg-[#dfff4f] p-7 text-[#171c19] sm:p-9">
            <span className="mono-label">Tool 01</span>
            <h2 className="mt-14 text-3xl font-black tracking-[-0.05em]">Dynasty trade calculator</h2>
            <p className="mt-3 text-sm leading-6 text-[#414742]">Players, exact picks, Superflex, TEP, and package-aware values.</p>
            <span className="mt-8 inline-block font-mono text-xs font-black uppercase group-hover:translate-x-1">Build a trade →</span>
          </Link>
          <Link href="/fantasy-football-trade-analyzer" className="group bg-[#8bcfff] p-7 text-[#171c19] sm:p-9">
            <span className="mono-label">Tool 02</span>
            <h2 className="mt-14 text-3xl font-black tracking-[-0.05em]">Redraft trade analyzer</h2>
            <p className="mt-3 text-sm leading-6 text-[#414742]">Current-season market checkpoints for complete multi-player offers.</p>
            <span className="mt-8 inline-block font-mono text-xs font-black uppercase group-hover:translate-x-1">Analyze a trade →</span>
          </Link>
          <Link href="/market" className="group bg-[#ff6b3d] p-7 text-[#171c19] sm:p-9">
            <span className="mono-label">Tool 03</span>
            <h2 className="mt-14 text-3xl font-black tracking-[-0.05em]">Market data hub</h2>
            <p className="mt-3 text-sm leading-6 text-[#414742]">Versioned rankings, format checkpoints, recorded movement, and downloadable data.</p>
            <span className="mt-8 inline-block font-mono text-xs font-black uppercase group-hover:translate-x-1">Open the market →</span>
          </Link>
        </div>
      </section>

      <FaqBlock items={homeFaqs} />
    </>
  );
}
