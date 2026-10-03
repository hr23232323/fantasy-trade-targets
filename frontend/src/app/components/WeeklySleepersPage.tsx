import Link from "next/link";
import AnalyticsPageView from "./AnalyticsPageView";
import JsonLd from "./JsonLd";
import PlayerThumbnail from "./PlayerThumbnail";
import { nflversePlayerRelease } from "../lib/nflverse";
import { getWeeklySleepers, weeklySleeperPositions, weeklySleepersWeek, type WeeklySleeperPosition, type WeeklySleeperRow } from "../lib/weekly-sleepers";

const SITE_URL = "https://fantasytradetarget.com";

export default async function WeeklySleepersPage({ config, path }: { config?: WeeklySleeperPosition; path: string }) {
  const rows = await getWeeklySleepers(config);
  const label = config?.plural ?? "QB, RB, WR & TE";
  const leaders = weeklySleeperPositions.flatMap(({ position }) => rows.find((row) => row.position === position) ?? []).slice(0, 3);
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(nflversePlayerRelease.capturedAt));

  return <>
    <AnalyticsPageView eventName="weekly_sleepers_viewed" properties={{ week: weeklySleepersWeek, position: config?.position ?? "ALL", player_count: rows.length }} />
    <JsonLd data={buildSchema(path, label, rows)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span>{config ? <><Link href="/fantasy-football-sleepers">Sleepers</Link><span>/</span><span className="text-[#171c19]">{config.plural}</span></> : <span className="text-[#171c19]">Fantasy football sleepers</span>}</nav>
    <section className="border-y border-[#171c19] bg-[#ff6b3d]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">2026 · Week {weeklySleepersWeek} · PPR · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em] text-white">Week {weeklySleepersWeek} fantasy football <span className="text-[#171c19]">{config ? `${config.label.toLowerCase()} sleepers.` : "sleepers."}</span></h1><p className="mt-8 max-w-4xl border-l-4 border-white pl-5 text-lg font-black leading-8 text-white">{leaders.length ? `${leaders.map((row) => row.name).join(", ")} lead this week’s deeper-start board.` : `Find deeper ${label.toLowerCase()} options for Week ${weeklySleepersWeek}.`} Each player projects above their current positional market slot.</p></div></section>
    <section className="page-wrap py-12"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><span className="eyebrow">Answer first</span><h2 className="section-title mt-5">Role, matchup and a path past market rank.</h2></div><Link href="/who-should-i-start" className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Compare two starters →</Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row, index) => <SleeperCard key={row.slug} row={row} index={index} />)}</div></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">How to use the board</span><h2 className="section-title mt-6">A short list for deeper lineup calls.</h2></div><div className="space-y-4 text-sm leading-7"><p>These are players outside the usual starter tier who move up in this week&apos;s PPR projections. Recent playing time, production, matchup and current listed availability all matter.</p><p>League availability varies. Check your roster rules and official inactive lists before kickoff.</p></div></div></section>
    <section className="page-wrap py-12"><span className="eyebrow">More Week {weeklySleepersWeek} sleepers</span><div className="mt-6 flex flex-wrap gap-3">{weeklySleeperPositions.filter((item) => item.slug !== config?.slug).map((item) => <Link key={item.slug} href={`/fantasy-football-sleepers/${item.slug}`} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#171c19] hover:bg-[#dfff4f]">{item.plural} →</Link>)}{config ? <Link href="/fantasy-football-sleepers" className="border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0_#ff6b3d]">All sleepers →</Link> : null}</div></section>
    <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Player results, snaps and availability: nflverse under CC BY 4.0 · updated {updated}. Projections are estimates, not guarantees.</aside>
  </>;
}

function SleeperCard({ row, index }: { row: WeeklySleeperRow; index: number }) {
  return <article className={`group relative overflow-hidden border border-[#171c19] p-5 shadow-[4px_4px_0_#171c19] transition-transform duration-200 hover:-translate-y-1 ${index % 3 === 0 ? "bg-[#dfff4f]" : index % 3 === 1 ? "bg-white" : "bg-[#ffb29a]"}`}>
    <div className="flex items-start gap-4"><PlayerThumbnail slug={row.slug} name={row.name} position={row.position} team={row.team} size={72} className="transition-transform duration-300 group-hover:scale-105" /><div className="min-w-0"><span className="mono-label">{row.position} · {row.team ?? "FA"} vs. {row.opponent ?? "TBD"}</span><h3 className="mt-2 text-2xl font-black leading-none tracking-[-0.045em]"><Link href={`/players/${row.slug}`} className="after:absolute after:inset-0">{row.name}</Link></h3><p className="mt-3 font-mono text-[10px] font-black uppercase">Weekly #{row.weeklyRank} · market #{row.marketPositionRank}</p></div></div>
    <div className="mt-6 grid grid-cols-3 border border-[#171c19] bg-white/65 text-center"><Metric label="Floor" value={row.projection.floor} /><Metric label="PPR" value={row.projection.median} strong /><Metric label="Ceiling" value={row.projection.ceiling} /></div>
    <div className="relative z-10 mt-5 flex items-center justify-between gap-3"><span className="font-mono text-[9px] font-bold uppercase text-[#4d544f]">{row.recentSnapShare === null ? row.availability : `${Math.round(row.recentSnapShare * 100)}% recent snaps`}</span><Link href={`/who-should-i-start?player1=${row.urlSlug}&scoring=PPR`} className="border border-[#171c19] bg-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase text-white">Compare →</Link></div>
  </article>;
}

function Metric({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) { return <span className={`p-3 ${strong ? "border-x border-[#171c19] bg-[#f7ffd9]" : ""}`}><small className="block font-mono text-[8px] font-black uppercase text-[#69706c]">{label}</small><strong className="mt-1 block font-mono text-xl">{value.toFixed(1)}</strong></span>; }

function buildSchema(path: string, label: string, rows: WeeklySleeperRow[]) {
  const url = `${SITE_URL}${path}`;
  return [
    { "@context": "https://schema.org", "@type": "ItemList", name: `Week ${weeklySleepersWeek} fantasy football sleepers: ${label}`, url, numberOfItems: rows.length, itemListElement: rows.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.name}: Week ${weeklySleepersWeek} PPR sleeper`, url: `${SITE_URL}/players/${row.slug}` })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "What makes a player a fantasy football sleeper?", acceptedAnswer: { "@type": "Answer", text: "This board highlights players outside the usual starter tier whose current-week PPR projection is stronger than their positional market rank." } }, { "@type": "Question", name: "Are these fantasy football sleepers available on waivers?", acceptedAnswer: { "@type": "Answer", text: "Not necessarily. Roster availability varies by league, so use the list for deeper start decisions and check your own waiver pool." } }, { "@type": "Question", name: `When are Week ${weeklySleepersWeek} sleepers updated?`, acceptedAnswer: { "@type": "Answer", text: "The board updates with the site's weekly player data, including recorded production, playing time, matchups and listed availability." } }] },
  ];
}
