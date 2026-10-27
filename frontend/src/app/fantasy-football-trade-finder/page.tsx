import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import PlayerThumbnail from "../components/PlayerThumbnail";
import TradeFinderBuilder from "../components/TradeFinderBuilder";
import { restOfSeasonUpdatedAt, restOfSeasonWeek } from "../lib/rest-of-season";
import { getTradeDecisionCards, tradeDecisionComparisons, tradeDecisionLeader, tradeFinderPath } from "../lib/trade-decisions";

const SITE_URL = "https://fantasytradetarget.com";
const PATH = "/fantasy-football-trade-finder";

export const metadata: Metadata = {
  title: "Fantasy Football Trade Finder: Should I Make This Trade?",
  description: "Compare two fantasy football players for the rest of 2026. See the PPR, Half PPR and Standard lean, recent production, workload and remaining schedule.",
  alternates: { canonical: PATH },
};

export default async function FantasyFootballTradeFinderPage() {
  const cards = await getTradeDecisionCards();
  const players = [...new Map(cards.flatMap(({ left, right }) => [left, right]).map((player) => [player.slug, player])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(restOfSeasonUpdatedAt));
  return <>
    <AnalyticsPageView eventName="trade_finder_viewed" properties={{ comparison_count: cards.length, current_week: restOfSeasonWeek }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Fantasy football trade finder", description: "Current rest-of-season player trade comparisons for redraft leagues.", url: `${SITE_URL}${PATH}`, dateModified: restOfSeasonUpdatedAt, mainEntity: { "@type": "ItemList", numberOfItems: cards.length, itemListElement: cards.map(({ comparison, left, right }, index) => ({ "@type": "ListItem", position: index + 1, name: `Should I trade ${left.name} for ${right.name}?`, url: `${SITE_URL}${tradeFinderPath(comparison.slug)}` })) } }} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span className="text-[#171c19]">Trade finder</span></nav>
    <section className="border-y border-[#171c19] bg-[#ffb29a]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Rest of 2026 · after Week {Math.max(0, restOfSeasonWeek - 1)} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Fantasy football <span className="text-[#9d2d16]">trade finder.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">Should you make the trade? Compare the rest-of-season value of two players across PPR, Half PPR and Standard scoring.</p><div className="mt-9"><TradeFinderBuilder players={players.map(({ slug, name, position, team }) => ({ slug, name, position, team }))} pairs={tradeDecisionComparisons} /></div></div></section>
    <section className="page-wrap py-12"><div className="max-w-4xl"><span className="eyebrow">Reviewed one-for-one trades</span><h2 className="section-title mt-5">Current decisions worth a closer look.</h2><p className="mt-5 text-sm leading-7 text-[#69706c]">Each comparison uses current redraft value, recent production, opportunity, snap share and remaining positional schedule. Team needs and extra pieces can still change the answer.</p></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(({ comparison, left, right }) => { const { leader } = tradeDecisionLeader(left, right); return <Link key={comparison.slug} href={tradeFinderPath(comparison.slug)} className="group border border-[#171c19] bg-white p-5 shadow-[4px_4px_0_#171c19] transition-transform hover:-translate-y-1"><div className="flex items-center justify-between gap-3"><PlayerThumbnail slug={left.slug} name={left.name} position={left.position} team={left.team} size={48} /><span className="font-mono text-[9px] font-black uppercase text-[#69706c]">Trade check</span><PlayerThumbnail slug={right.slug} name={right.name} position={right.position} team={right.team} size={48} /></div><h3 className="mt-5 text-xl font-black tracking-[-0.035em]">{left.name} for {right.name}?</h3><p className="mt-3 text-sm leading-6 text-[#59605c]"><strong className="text-[#174f35]">{leader.name}</strong> holds the current PPR rest-of-season edge.</p><span className="mt-5 block font-mono text-[10px] font-black uppercase group-hover:underline">See the verdict →</span></Link>; })}</div></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-7 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">What the answer means</span><h2 className="section-title mt-5">A clean starting point—not your whole roster.</h2></div><div className="space-y-4 text-sm leading-7"><p>The higher-rated side is the stronger one-for-one rest-of-season asset in the selected scoring format. A close rating means roster construction can reasonably decide it.</p><p>For multi-player offers, draft picks or bench-cost adjustments, open the full <Link href="/fantasy-trade-calculator" className="font-black underline">fantasy trade calculator</Link>.</p></div></div></section>
  </>;
}
