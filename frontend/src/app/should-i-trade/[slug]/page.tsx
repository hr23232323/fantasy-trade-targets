import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import PlayerPortrait from "../../components/PlayerPortrait";
import TeamLogo from "../../components/TeamLogo";
import { getPlayerPage } from "../../lib/player-pages";
import { restOfSeasonUpdatedAt, restOfSeasonWeek, type RestOfSeasonRankingRow, type RestOfSeasonScoringKey } from "../../lib/rest-of-season";
import { startSitPathForPlayers } from "../../lib/start-sit";
import { getRelatedTradeDecisions, getTradeDecision, getTradeDecisionRows, tradeDecisionLeader, tradeDecisionSlugs, tradeFinderPath, type TradeDecisionConfig } from "../../lib/trade-decisions";

const SITE_URL = "https://fantasytradetarget.com";
const formats: Array<{ key: RestOfSeasonScoringKey; label: string }> = [{ key: "ppr", label: "PPR" }, { key: "halfPpr", label: "Half PPR" }, { key: "standard", label: "Standard" }];
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return tradeDecisionSlugs.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const comparison = getTradeDecision((await params).slug);
  if (!comparison) return {};
  const pair = await getTradeDecisionRows(comparison);
  const leftPage = getPlayerPage(comparison.leftSlug);
  const rightPage = getPlayerPage(comparison.rightSlug);
  if (!pair || !leftPage || !rightPage) return {};
  const { leader, trailer } = tradeDecisionLeader(pair.left, pair.right);
  const title = `Should I Trade ${leftPage.name} for ${rightPage.name}? (2026)`;
  const description = `${leader.name} ranks ahead of ${trailer.name} for the rest of 2026 in PPR. Compare current value, recent workload, scoring formats and remaining schedule.`;
  const path = tradeFinderPath(comparison.slug);
  return { title, description, alternates: { canonical: path }, openGraph: { type: "article", url: path, title, description, images: [{ url: leftPage.image.src, width: leftPage.image.width, height: leftPage.image.height, alt: leftPage.image.alt }] }, twitter: { card: "summary_large_image", title, description, images: [leftPage.image.src] } };
}

export default async function TradeDecisionPage({ params }: PageProps) {
  const comparison = getTradeDecision((await params).slug);
  if (!comparison) notFound();
  const pair = await getTradeDecisionRows(comparison);
  const leftPage = getPlayerPage(comparison.leftSlug);
  const rightPage = getPlayerPage(comparison.rightSlug);
  if (!pair || !leftPage || !rightPage) notFound();
  const { leader, trailer } = tradeDecisionLeader(pair.left, pair.right);
  const gap = Math.abs(leader.formats.ppr.rating - trailer.formats.ppr.rating);
  const close = gap <= 35;
  const receivingLeader = leader.slug === comparison.rightSlug;
  const verdict = close
    ? `${leader.name} has the narrow rest-of-season edge, but this is a close one-for-one trade.`
    : receivingLeader
      ? `Trade ${pair.left.name} for ${pair.right.name} in a one-for-one redraft deal.`
      : `Keep ${pair.left.name} over ${pair.right.name} in a one-for-one redraft deal.`;
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(restOfSeasonUpdatedAt));
  const related = getRelatedTradeDecisions(comparison);
  const faqs = buildFaqs(comparison, pair.left, pair.right, verdict);
  const path = tradeFinderPath(comparison.slug);
  return <>
    <AnalyticsPageView eventName="trade_decision_viewed" properties={{ comparison: comparison.slug, leader: leader.slug, current_week: restOfSeasonWeek, ppr_rating_gap: gap, cross_position: pair.left.position !== pair.right.position }} />
    <JsonLd data={buildSchema(path, pair.left, pair.right, verdict, faqs)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={tradeFinderPath()}>Trade finder</Link><span>/</span><span className="text-[#171c19]">{leftPage.name} for {rightPage.name}</span></nav>
    <section className="border-y border-[#171c19] bg-[#ffb29a]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Rest of 2026 · after Week {Math.max(0, restOfSeasonWeek - 1)} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Should I trade {leftPage.name} <span className="text-[#9d2d16]">for {rightPage.name}?</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{verdict}</p><p className="mt-6 max-w-3xl text-sm leading-7 text-[#5e443d]">This answer compares a straight one-for-one redraft trade for the rest of the season. League depth, lineup needs and other pieces in the offer can change the call.</p></div></section>
    <section className="page-wrap grid gap-6 py-12 lg:grid-cols-2"><PlayerCard row={pair.left} page={leftPage} leader={leader.slug === pair.left.slug} /><PlayerCard row={pair.right} page={rightPage} leader={leader.slug === pair.right.slug} /></section>
    <section className="page-wrap pb-14"><span className="eyebrow">Scoring-format check</span><h2 className="section-title mt-5">Does PPR, Half PPR or Standard change the trade?</h2><div className="mt-7 overflow-x-auto border border-[#171c19] bg-white shadow-[5px_5px_0_#171c19]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Format</th><th className="p-4">Preferred side</th><th className="p-4">{pair.left.name}</th><th className="p-4">{pair.right.name}</th><th className="p-4">Gap</th></tr></thead><tbody className="divide-y divide-[#bcb9ae]">{formats.map(({ key, label }) => { const result = tradeDecisionLeader(pair.left, pair.right, key); const left = pair.left.formats[key]; const right = pair.right.formats[key]; return <tr key={key}><td className="p-4 font-black">{label}</td><td className="p-4 font-black text-[#174f35]">{result.leader.name}</td><td className="p-4 font-mono">#{left.rank} · {(left.rating / 10).toFixed(1)}</td><td className="p-4 font-mono">#{right.rank} · {(right.rating / 10).toFixed(1)}</td><td className="p-4 font-mono font-black">{(Math.abs(left.rating - right.rating) / 10).toFixed(1)}</td></tr>; })}</tbody></table></div></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Why the model leans this way</span><h2 className="section-title mt-5">Current value, role and remaining runway.</h2></div><div className="space-y-4 text-sm leading-7"><p>{factorSentence(pair.left)}</p><p>{factorSentence(pair.right)}</p><p>Current redraft value is the anchor. Recent scoring and opportunity, snap share and remaining positional schedule refine the rest-of-season order.</p></div></div></section>
    <section className="page-wrap grid gap-4 py-12 md:grid-cols-3"><Link href={`/fantasy-trade-calculator?send=${comparison.leftSlug}&get=${comparison.rightSlug}`} className="border border-[#171c19] bg-[#ff6b3d] p-6 text-white shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white text-[#171c19]">Full offer</span><strong className="mt-5 block text-xl">Price this trade →</strong></Link><Link href={startSitPathForPlayers(comparison.leftSlug, comparison.rightSlug)} className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white">This week</span><strong className="mt-5 block text-xl">Compare the lineup call →</strong></Link><Link href="/fantasy-football-rest-of-season-rankings" className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow">Full board</span><strong className="mt-5 block text-xl">See ROS rankings →</strong></Link></section>
    {related.length ? <section className="page-wrap py-12"><span className="eyebrow">More trade decisions</span><div className="mt-6 flex flex-wrap gap-3">{related.map((item) => <Link key={item.slug} href={tradeFinderPath(item.slug)} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#171c19] hover:bg-[#dfff4f]">{getPlayerPage(item.leftSlug)?.name} for {getPlayerPage(item.rightSlug)?.name} →</Link>)}</div></section> : null}
    <section className="page-wrap py-12"><span className="eyebrow">Questions, answered</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
  </>;
}

function PlayerCard({ row, page, leader }: { row: RestOfSeasonRankingRow; page: NonNullable<ReturnType<typeof getPlayerPage>>; leader: boolean }) { const view = row.formats.ppr; return <article className={`relative overflow-hidden border border-[#171c19] p-6 shadow-[5px_5px_0_#171c19] ${leader ? "bg-[#dfff4f]" : "bg-white"}`}>{leader ? <span className="absolute right-4 top-4 z-10 bg-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase text-white">Trade lean</span> : null}<div className="grid grid-cols-[112px_1fr] items-end gap-5"><div className="relative h-[148px] w-[112px]"><PlayerPortrait slug={row.slug} name={row.name} image={page.image} position={row.position} team={row.team} variant="card" sizes="112px" /></div><div><h2 className="text-3xl font-black leading-none tracking-[-0.05em]">{row.name}</h2><div className="mt-3 flex items-center gap-2"><TeamLogo team={row.team} size={32} /><span className="font-mono text-xs font-bold">{row.team ?? "FA"} · {row.position} · {row.availability}</span></div></div></div><div className="mt-7 grid grid-cols-3 border border-[#171c19] bg-white/60 text-center"><Metric label="Overall rank" value={`#${view.rank}`} /><Metric label="FTT rating" value={(view.rating / 10).toFixed(1)} /><Metric label="Recent PPG" value={number(view.recentPointsPerGame)} /></div><div className="mt-6 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Recent workload:</strong> {number(view.recentOpportunity)}</p><p><strong>Snap share:</strong> {view.recentSnapPct === null ? "—" : `${Math.round(view.recentSnapPct * 100)}%`}</p><p><strong>Schedule:</strong> {scheduleLabel(view.schedulePercentile)}</p><p><strong>Games rated:</strong> {view.remainingGames}</p></div><Link href={`/players/${row.slug}`} className="mt-6 inline-block font-mono text-[10px] font-black uppercase underline">Open player file →</Link></article>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="border-r border-[#171c19] p-3 last:border-r-0"><span className="block font-mono text-[9px] font-bold uppercase text-[#69706c]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
function factorSentence(row: RestOfSeasonRankingRow) { const view = row.formats.ppr; return `${row.name} is overall PPR rank #${view.rank} with ${number(view.recentPointsPerGame)} recent points per game, ${number(view.recentOpportunity)} opportunities and a ${scheduleLabel(view.schedulePercentile).toLowerCase()} remaining schedule.`; }
function buildFaqs(comparison: TradeDecisionConfig, left: RestOfSeasonRankingRow, right: RestOfSeasonRankingRow, verdict: string) { const ppr = tradeDecisionLeader(left, right, "ppr"); const half = tradeDecisionLeader(left, right, "halfPpr"); const standard = tradeDecisionLeader(left, right, "standard"); return [{ question: `Should I trade ${left.name} for ${right.name}?`, answer: `${verdict} The current PPR rest-of-season ratings favor ${ppr.leader.name}, ${number(ppr.leader.formats.ppr.rating / 10)} to ${number(ppr.trailer.formats.ppr.rating / 10)}.` }, { question: "Does scoring format change the answer?", answer: `PPR favors ${ppr.leader.name}, Half PPR favors ${half.leader.name}, and Standard favors ${standard.leader.name}.` }, { question: "What if other players or picks are included?", answer: "Use the preloaded trade calculator to price every piece together. This page evaluates only the straight one-for-one swap." }, { question: "Is this a dynasty or weekly start/sit answer?", answer: "Neither. This is a redraft rest-of-season trade comparison. Dynasty value and a single-week lineup decision use different time horizons." }]; }
function buildSchema(path: string, left: RestOfSeasonRankingRow, right: RestOfSeasonRankingRow, verdict: string, faqs: ReturnType<typeof buildFaqs>) { return [{ "@context": "https://schema.org", "@type": "WebPage", name: `Should I trade ${left.name} for ${right.name}?`, description: verdict, url: `${SITE_URL}${path}`, dateModified: restOfSeasonUpdatedAt, mainEntity: { "@type": "ItemList", numberOfItems: 2, itemListElement: [left, right].sort((a, b) => b.formats.ppr.rating - a.formats.ppr.rating).map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.name}: ${(row.formats.ppr.rating / 10).toFixed(1)} rest-of-season PPR rating`, url: `${SITE_URL}/players/${row.slug}` })) } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Fantasy football trade finder", item: `${SITE_URL}${tradeFinderPath()}` }, { "@type": "ListItem", position: 3, name: `${left.name} for ${right.name}`, item: `${SITE_URL}${path}` }] }]; }
function scheduleLabel(value: number) { return value >= 0.67 ? "Favorable" : value <= 0.33 ? "Demanding" : "Balanced"; }
function number(value: number | null) { return value === null ? "—" : value.toFixed(1); }
