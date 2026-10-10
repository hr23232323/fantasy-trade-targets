import Link from "next/link";
import AnalyticsPageView from "./AnalyticsPageView";
import JsonLd from "./JsonLd";
import RestOfSeasonRankingsTable from "./RestOfSeasonRankingsTable";
import { nflversePlayerRelease } from "../lib/nflverse";
import { getRestOfSeasonRankingRows, restOfSeasonPositionConfigs, restOfSeasonUpdatedAt, restOfSeasonWeek, type RestOfSeasonPosition, type RestOfSeasonPositionConfig } from "../lib/rest-of-season";

const SITE_URL = "https://fantasytradetarget.com";

export default async function RestOfSeasonRankingsPage({ config, path }: { config: RestOfSeasonPositionConfig | null; path: string }) {
  const position: RestOfSeasonPosition = config?.position ?? "ALL";
  const allRows = await getRestOfSeasonRankingRows(position);
  const rows = allRows.slice(0, position === "ALL" ? 150 : 100);
  const leaders = rows.slice(0, 3);
  const label = config?.plural ?? "Overall";
  const heading = config ? `${label.toLowerCase()} rankings` : "rankings";
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(restOfSeasonUpdatedAt));
  const faqs = buildFaqs(label.toLowerCase());

  return <>
    <AnalyticsPageView eventName="rest_of_season_rankings_viewed" properties={{ position, player_count: rows.length, current_week: restOfSeasonWeek, release_id: nflversePlayerRelease.releaseId }} />
    <JsonLd data={buildSchema(path, label, rows, faqs)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{config ? <><Link href="/fantasy-football-rest-of-season-rankings">Rest-of-season rankings</Link><span>/</span><span className="text-[#171c19]">{label}</span></> : <span className="text-[#171c19]">Rest-of-season rankings</span>}</nav>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">2026 fantasy football · after Week {Math.max(0, restOfSeasonWeek - 1)} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Rest-of-season fantasy football <span className="text-[#174f35]">{heading}.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{leaders.length ? `${leaders.map((row) => row.name).join(", ")} lead the current PPR board.` : "Rank the remaining season."} Switch between PPR, Half PPR and Standard to see how the order changes.</p></div></section>
    <section className="page-wrap py-12"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Current ROS board</span><h2 className="section-title mt-5">Market value, current form, workload and remaining schedule.</h2></div><div className="flex flex-wrap gap-3"><Link href="/fantasy-football-rest-of-season-comparisons" className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Compare two players →</Link><Link href="/fantasy-football-playoff-strength-of-schedule" className="border border-[#171c19] bg-[#d7b6ff] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Plan playoff schedules →</Link><Link href="/fantasy-football-buy-low-sell-high" className="border border-[#171c19] bg-[#ff6433] px-5 py-4 font-mono text-[10px] font-black uppercase text-white shadow-[3px_3px_0_#171c19]">See buy-low and sell-high players →</Link></div></div><RestOfSeasonRankingsTable rows={rows} position={position} /></section>
    <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">How the board moves</span><h2 className="section-title mt-6">The market anchors every rank.</h2></div><div className="space-y-4 text-sm leading-7"><p>Current redraft value carries most of the weight. Recent fantasy scoring, opportunities, snap share and the remaining positional schedule can move a player within measured limits.</p><p>The board updates with validated market and nflverse releases. It is a decision aid, not a guarantee of future production.</p></div></div></section>
    <section className="page-wrap py-12"><span className="eyebrow">More rest-of-season rankings</span><div className="mt-6 flex flex-wrap gap-3">{[null, ...restOfSeasonPositionConfigs].filter((item) => item?.position !== position && !(item === null && position === "ALL")).map((item) => <Link key={item?.slug ?? "overall"} href={item ? `/fantasy-football-rest-of-season-rankings/${item.slug}` : "/fantasy-football-rest-of-season-rankings"} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#171c19] hover:bg-[#dfff4f]">{item?.plural ?? "Overall"} →</Link>)}</div></section>
    <section className="page-wrap py-12"><span className="eyebrow">Questions, answered</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
    <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Market values update from the latest validated public release. Player results, snaps and schedule context come from nflverse under CC BY 4.0 · updated {updated}.</aside>
  </>;
}

function buildFaqs(label: string) {
  const subject = label === "overall" ? "fantasy football" : label;
  return [{ question: `What are rest-of-season ${subject} rankings?`, answer: `They rank players for the remaining 2026 fantasy season rather than for one matchup or long-term dynasty value. The current redraft market remains the anchor.` }, { question: "Do PPR settings change the rankings?", answer: "Yes. Receptions change current scoring and replacement value, so PPR, Half PPR and Standard can produce different orders." }, { question: "How often do the rankings update?", answer: "The board updates when validated market, player-performance and schedule releases publish. The timestamp at the top shows the data currently in use." }, { question: "Are these the same as weekly start/sit rankings?", answer: "No. Weekly rankings answer the next lineup decision. Rest-of-season rankings weigh the full remaining schedule and current-season role for trade and roster decisions." }];
}

function buildSchema(path: string, label: string, rows: Awaited<ReturnType<typeof getRestOfSeasonRankingRows>>, faqs: ReturnType<typeof buildFaqs>) {
  return [{ "@context": "https://schema.org", "@type": "ItemList", name: `2026 rest-of-season fantasy football ${label.toLowerCase()} rankings`, url: `${SITE_URL}${path}`, numberOfItems: rows.length, itemListElement: rows.map((row) => ({ "@type": "ListItem", position: row.formats.ppr.rank, name: `${row.name}: ROS ${label} rank ${row.formats.ppr.rank}`, url: `${SITE_URL}/players/${row.slug}` })) }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }];
}
