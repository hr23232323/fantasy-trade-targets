import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import PlayerThumbnail from "../components/PlayerThumbnail";
import { nflversePlayerRelease } from "../lib/nflverse";
import { getRestOfSeasonRankingRows, restOfSeasonUpdatedAt, restOfSeasonWeek, type RestOfSeasonRankingRow } from "../lib/rest-of-season";

const SITE_URL = "https://fantasytradetarget.com";
const PATH = "/fantasy-football-buy-low-sell-high";

export const metadata: Metadata = {
  title: `Fantasy Football Buy Low, Sell High Players (Week ${restOfSeasonWeek})`,
  description: "Current fantasy football buy-low and sell-high candidates using rest-of-season value, recent workload, scoring and remaining schedule.",
  alternates: { canonical: PATH },
};

const faqs = [
  { question: "Who should I buy low in fantasy football?", answer: "The buy-low board highlights players whose FTT rest-of-season rank is stronger than their current redraft market rank. Recent workload and the remaining schedule support the difference." },
  { question: "Who should I sell high in fantasy football?", answer: "The sell-high board highlights players whose current redraft market rank is stronger than their FTT rest-of-season rank. It is a prompt to check the market, not a requirement to trade." },
  { question: "How often does this list update?", answer: "The list updates with validated market, player-performance and schedule releases. The same stable page carries the latest week." },
  { question: "Are these trade values or predictions?", answer: "They are current PPR trade screens. Use the player file and trade calculator to price the complete offer for your roster and league." },
];

export default async function FantasyFootballBuyLowSellHighPage() {
  const rows = await getRestOfSeasonRankingRows("ALL");
  const eligible = rows.filter((row) => row.currentSeasonGames >= 2 && row.formats.ppr.marketRank <= 150 && row.formats.ppr.rank <= 120 && (row.formats.ppr.recentSnapPct ?? 0) >= 0.45 && !/out|doubtful/i.test(row.availability));
  const buyLow = takeBalanced(eligible
    .sort((left, right) => edge(right) - edge(left)), 8);
  const sellHigh = takeBalanced(eligible
    .filter((row) => !buyLow.some((candidate) => candidate.slug === row.slug))
    .sort((left, right) => edge(left) - edge(right)), 8);
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(restOfSeasonUpdatedAt));

  return <>
    <AnalyticsPageView eventName="buy_low_sell_high_viewed" properties={{ week: restOfSeasonWeek, buy_count: buyLow.length, sell_count: sellHigh.length, release_id: nflversePlayerRelease.releaseId }} />
    <JsonLd data={buildSchema([...buyLow, ...sellHigh])} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span className="text-[#171c19]">Buy low, sell high</span></nav>
    <section className="border-y border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap py-14 sm:py-20"><span className="mono-label text-[#dfff4f]">2026 fantasy football · Week {restOfSeasonWeek} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7.4rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">Buy low. <span className="text-[#ff6433]">Sell high.</span></h1><p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">Find the market gaps worth investigating. Current redraft prices are compared with rest-of-season rank, recent workload and remaining schedule before each player reaches the board.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#buy-low" className="border border-white bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase text-[#171c19] shadow-[4px_4px_0_#8bcfff]">See buy-low players ↓</a><Link href="/fantasy-trade-calculator" className="border border-white/40 px-5 py-3 font-mono text-[11px] font-black uppercase hover:bg-white hover:text-[#171c19]">Price a redraft trade →</Link></div></div></section>
    <section className="page-wrap py-12"><div id="buy-low" className="scroll-mt-8"><span className="eyebrow bg-[#dfff4f]">Buy-low board</span><h2 className="section-title mt-6">Rest-of-season rank leads the market.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-[#69706c]">These players rank higher on the current PPR rest-of-season board than in the redraft market. Check whether the manager in your league is still pricing the older rank.</p><CandidateGrid rows={buyLow} direction="buy" /></div>
      <div className="mt-16 border-t border-[#171c19] pt-12"><span className="eyebrow bg-[#ffb29a]">Sell-high board</span><h2 className="section-title mt-6">The market is ahead of the ROS board.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-[#69706c]">These players carry a stronger redraft market rank than their current PPR rest-of-season rank. Explore the return before accepting the gap.</p><CandidateGrid rows={sellHigh} direction="sell" /></div></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Use the complete price</span><h2 className="section-title mt-6">A shortlist starts the trade. It does not finish it.</h2></div><div className="space-y-4 text-sm leading-7"><p>League depth, starting requirements and scoring can change the correct return. Open the calculator before sending an offer.</p><p>For the full player order, use the <Link href="/fantasy-football-rest-of-season-rankings" className="font-black underline">rest-of-season rankings</Link>.</p></div></div></section>
    <section className="page-wrap py-12"><span className="eyebrow">Questions, answered</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
    <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Current PPR redraft value anchors every comparison. Player results, snaps and remaining-schedule context come from nflverse under CC BY 4.0 · updated {updated}.</aside>
  </>;
}

function CandidateGrid({ rows, direction }: { rows: RestOfSeasonRankingRow[]; direction: "buy" | "sell" }) {
  return <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">{rows.map((row) => {
    const view = row.formats.ppr;
    const gap = Math.abs(edge(row));
    return <article key={row.slug} className="bg-[#f3f0e7] p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><PlayerThumbnail slug={row.slug} name={row.name} position={row.position} team={row.team} size={56} /><div><h3 className="text-xl font-black tracking-[-0.03em]"><Link href={`/players/${row.slug}`} className="underline decoration-[#ff6433] decoration-2 underline-offset-4">{row.name}</Link></h3><p className="mt-1 font-mono text-[10px] font-bold uppercase text-[#69706c]">{row.position} · {row.team ?? "FA"} · {row.availability}</p></div></div><span className={`border border-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase ${direction === "buy" ? "bg-[#dfff4f]" : "bg-[#ffb29a]"}`}>{gap} spots</span></div><div className="mt-5 grid grid-cols-3 gap-px border border-[#171c19] bg-[#171c19] text-center"><Stat label="ROS rank" value={`#${view.rank}`} /><Stat label="Market" value={`#${view.marketRank}`} /><Stat label="Recent PPG" value={view.recentPointsPerGame?.toFixed(1) ?? "—"} /></div><p className="mt-4 text-sm leading-6 text-[#69706c]">{direction === "buy" ? "The ROS board prices this player ahead of the current market." : "The current market prices this player ahead of the ROS board."} Remaining schedule: <strong className="text-[#171c19]">{scheduleLabel(view.schedulePercentile)}</strong>.</p><div className="mt-4 flex flex-wrap gap-2"><Link href={`/players/${row.slug}`} className="border border-[#171c19] bg-white px-3 py-2 font-mono text-[9px] font-black uppercase shadow-[2px_2px_0_#171c19]">Player file →</Link><Link href="/fantasy-trade-calculator" className="border border-[#171c19] bg-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase text-white">Open calculator →</Link></div></article>;
  })}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <span className="bg-white p-3"><strong className="block font-mono text-lg">{value}</strong><span className="font-mono text-[8px] font-black uppercase text-[#69706c]">{label}</span></span>;
}

function edge(row: RestOfSeasonRankingRow) {
  return row.formats.ppr.marketRank - row.formats.ppr.rank;
}

function takeBalanced(rows: RestOfSeasonRankingRow[], count: number) {
  const selected: RestOfSeasonRankingRow[] = [];
  const positionCounts = new Map<string, number>();
  for (const position of ["QB", "RB", "WR", "TE"]) {
    const row = rows.find((candidate) => candidate.position === position && edge(candidate) !== 0);
    if (!row) continue;
    selected.push(row);
    positionCounts.set(position, 1);
  }
  for (const row of rows) {
    if (selected.length >= count) break;
    if (edge(row) === 0 || selected.some((candidate) => candidate.slug === row.slug)) continue;
    const used = positionCounts.get(row.position) ?? 0;
    if (used >= 3) continue;
    selected.push(row);
    positionCounts.set(row.position, used + 1);
  }
  return selected.sort((left, right) => Math.abs(edge(right)) - Math.abs(edge(left)));
}

function scheduleLabel(percentile: number) {
  if (percentile >= 0.67) return "favorable";
  if (percentile <= 0.33) return "demanding";
  return "balanced";
}

function buildSchema(rows: RestOfSeasonRankingRow[]) {
  return [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Fantasy football buy-low and sell-high players", url: `${SITE_URL}${PATH}`, dateModified: restOfSeasonUpdatedAt, mainEntity: { "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: row.name, url: `${SITE_URL}/players/${row.slug}` })) } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }];
}
