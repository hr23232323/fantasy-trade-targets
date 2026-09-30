import Link from "next/link";
import AnalyticsPageView from "./AnalyticsPageView";
import JsonLd from "./JsonLd";
import WeeklyRankingsTable from "./WeeklyRankingsTable";
import { nflversePlayerRelease } from "../lib/nflverse";
import { getWeeklyRankingRows, weeklyRankingPositions, weeklyRankingsWeek, type WeeklyRankingPosition } from "../lib/weekly-rankings";

const SITE_URL = "https://fantasytradetarget.com";

export default function WeeklyRankingsPage({ config, path }: { config: WeeklyRankingPosition; path: string }) {
  const rows = getWeeklyRankingRows(config.position);
  const leaders = rows.toSorted((left, right) => right.projections.ppr.median - left.projections.ppr.median).slice(0, 3);
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(nflversePlayerRelease.capturedAt));
  return <>
    <AnalyticsPageView eventName="weekly_rankings_viewed" properties={{ week: weeklyRankingsWeek, position: config.position, player_count: rows.length }} />
    <JsonLd data={buildSchema(path, config, rows)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{path === "/fantasy-football-rankings" ? <span className="text-[#171c19]">Weekly rankings</span> : <><Link href="/fantasy-football-rankings">Weekly rankings</Link><span>/</span><span className="text-[#171c19]">{config.plural}</span></>}</nav>
    <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">2026 fantasy football · Week {weeklyRankingsWeek} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Week {weeklyRankingsWeek} fantasy football <span className="text-[#174f35]">{config.plural.toLowerCase()} rankings.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{leaders.length ? `${leaders.map((row) => row.name).join(", ")} lead the Week ${weeklyRankingsWeek} PPR board.` : `Compare every eligible ${config.label.toLowerCase()}.`} Switch between PPR, Half PPR and Standard, then open any player in the start/sit tool.</p></div></section>
    <section className="page-wrap py-12"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Live weekly board</span><h2 className="section-title mt-5">Rank the options. Then compare the close calls.</h2></div><Link href="/who-should-i-start" className="border border-[#171c19] bg-[#ff6433] px-5 py-4 font-mono text-[10px] font-black uppercase text-white shadow-[3px_3px_0_#171c19]">Open start/sit tool →</Link></div><WeeklyRankingsTable rows={rows} week={weeklyRankingsWeek} positionLabel={config.position} /></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">What moves the order</span><h2 className="section-title mt-6">Production first. Workload and matchup within guardrails.</h2></div><div className="space-y-4 text-sm leading-7"><p>Recent scoring establishes each player&apos;s baseline. Carries, targets and snap share adjust it within a limited range, followed by the opponent&apos;s positional defense.</p><p>Only current-week listed availability changes the estimate. Recheck official inactive lists before kickoff.</p></div></div></section>
    <section className="page-wrap py-12"><span className="eyebrow">More Week {weeklyRankingsWeek} rankings</span><div className="mt-6 flex flex-wrap gap-3">{weeklyRankingPositions.filter((item) => item.slug !== config.slug).map((item) => <Link key={item.slug} href={item.position === "FLEX" ? "/fantasy-football-rankings" : `/fantasy-football-rankings/${item.slug}`} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#171c19] hover:bg-[#dfff4f]">{item.plural} →</Link>)}</div></section>
    <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Player results, snaps and availability: nflverse under CC BY 4.0 · updated {updated}. Rankings are estimates, not guarantees.</aside>
  </>;
}

function buildSchema(path: string, config: WeeklyRankingPosition, rows: ReturnType<typeof getWeeklyRankingRows>) {
  const ranked = rows.toSorted((left, right) => right.projections.ppr.median - left.projections.ppr.median);
  return [{ "@context": "https://schema.org", "@type": "ItemList", name: `Week ${weeklyRankingsWeek} ${config.plural} fantasy football rankings`, url: `${SITE_URL}${path}`, numberOfItems: ranked.length, itemListElement: ranked.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.name}: ${row.projections.ppr.median.toFixed(1)} PPR points`, url: `${SITE_URL}/players/${row.slug}` })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Weekly rankings", item: `${SITE_URL}/fantasy-football-rankings` }, ...(path === "/fantasy-football-rankings" ? [] : [{ "@type": "ListItem", position: 3, name: config.plural, item: `${SITE_URL}${path}` }])] }];
}
