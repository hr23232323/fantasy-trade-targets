import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import PlayerPortrait from "../../components/PlayerPortrait";
import TeamLogo from "../../components/TeamLogo";
import { getPlayerPage } from "../../lib/player-pages";
import { restOfSeasonUpdatedAt, restOfSeasonWeek, type RestOfSeasonRankingRow, type RestOfSeasonScoringKey } from "../../lib/rest-of-season";
import { getRelatedRestOfSeasonComparisons, getRestOfSeasonComparison, getRestOfSeasonComparisonRows, restOfSeasonComparisonPath, restOfSeasonComparisonSlugs, restOfSeasonLeader, type RestOfSeasonComparisonConfig } from "../../lib/rest-of-season-comparisons";
import { startSitPathForPlayers } from "../../lib/start-sit";

const SITE_URL = "https://fantasytradetarget.com";
const formats: Array<{ key: RestOfSeasonScoringKey; label: string }> = [{ key: "ppr", label: "PPR" }, { key: "halfPpr", label: "Half PPR" }, { key: "standard", label: "Standard" }];
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return restOfSeasonComparisonSlugs.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const comparison = getRestOfSeasonComparison((await params).slug);
  if (!comparison) return {};
  const pair = await getRestOfSeasonComparisonRows(comparison);
  const leftPage = getPlayerPage(comparison.leftSlug);
  const rightPage = getPlayerPage(comparison.rightSlug);
  if (!pair || !leftPage || !rightPage) return {};
  const { leader, trailer } = restOfSeasonLeader(pair.left, pair.right);
  const title = `${leftPage.name} or ${rightPage.name} Rest of Season? (2026)`;
  const description = `${leader.name} ranks ahead of ${trailer.name} rest of season in PPR: ${positionLabel(comparison.position)}${leader.formats.ppr.rank} vs. ${positionLabel(comparison.position)}${trailer.formats.ppr.rank}. Compare workload, form and schedule.`;
  const path = restOfSeasonComparisonPath(comparison.slug);
  return { title, description, alternates: { canonical: path }, openGraph: { type: "article", url: path, title, description, images: [{ url: leftPage.image.src, width: leftPage.image.width, height: leftPage.image.height, alt: leftPage.image.alt }] }, twitter: { card: "summary_large_image", title, description, images: [leftPage.image.src] } };
}

export default async function RestOfSeasonComparisonPage({ params }: PageProps) {
  const comparison = getRestOfSeasonComparison((await params).slug);
  if (!comparison) notFound();
  const pair = await getRestOfSeasonComparisonRows(comparison);
  const leftPage = getPlayerPage(comparison.leftSlug);
  const rightPage = getPlayerPage(comparison.rightSlug);
  if (!pair || !leftPage || !rightPage) notFound();
  const { leader, trailer } = restOfSeasonLeader(pair.left, pair.right);
  const close = Math.abs(leader.formats.ppr.rank - trailer.formats.ppr.rank) <= 2;
  const verdict = close
    ? `${leader.name} holds the narrow rest-of-season edge over ${trailer.name} in PPR.`
    : `${leader.name} ranks ahead of ${trailer.name} for the rest of the 2026 fantasy season.`;
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(restOfSeasonUpdatedAt));
  const related = getRelatedRestOfSeasonComparisons(comparison);
  const faqs = buildFaqs(comparison, pair.left, pair.right, verdict);
  const path = restOfSeasonComparisonPath(comparison.slug);
  return <>
    <AnalyticsPageView eventName="rest_of_season_comparison_viewed" properties={{ comparison: comparison.slug, position: comparison.position, leader: leader.slug, current_week: restOfSeasonWeek, ppr_rank_gap: Math.abs(pair.left.formats.ppr.rank - pair.right.formats.ppr.rank) }} />
    <JsonLd data={buildSchema(path, comparison, pair.left, pair.right, verdict, faqs)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={restOfSeasonComparisonPath()}>ROS comparisons</Link><span>/</span><span className="text-[#171c19]">{leftPage.name} vs. {rightPage.name}</span></nav>
    <section className="border-y border-[#171c19] bg-[#d7b6ff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Rest of 2026 · after Week {Math.max(0, restOfSeasonWeek - 1)} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{leftPage.name} or {rightPage.name}: <span className="text-[#5c2b7d]">rest of season?</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{verdict} The current PPR ranks are {positionLabel(comparison.position)}{leader.formats.ppr.rank} and {positionLabel(comparison.position)}{trailer.formats.ppr.rank}.</p><p className="mt-6 max-w-3xl text-sm leading-7 text-[#514759]">This is a rest-of-season roster and trade decision. For this week&apos;s lineup only, use the linked start/sit comparison.</p></div></section>
    <section className="page-wrap grid gap-6 py-12 lg:grid-cols-2"><PlayerCard row={pair.left} page={leftPage} leader={leader.slug === pair.left.slug} /><PlayerCard row={pair.right} page={rightPage} leader={leader.slug === pair.right.slug} /></section>
    <section className="page-wrap pb-14"><div className="mb-6"><span className="eyebrow">Scoring-format verdict</span><h2 className="section-title mt-5">Who ranks higher in PPR, Half PPR and Standard?</h2></div><div className="overflow-x-auto border border-[#171c19] bg-white shadow-[5px_5px_0_#171c19]"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Format</th><th className="p-4">Higher ROS rank</th><th className="p-4">{pair.left.name}</th><th className="p-4">{pair.right.name}</th><th className="p-4">Rating gap</th></tr></thead><tbody className="divide-y divide-[#bcb9ae]">{formats.map((format) => {
      const result = restOfSeasonLeader(pair.left, pair.right, format.key);
      const leftView = pair.left.formats[format.key];
      const rightView = pair.right.formats[format.key];
      return <tr key={format.key}><td className="p-4 font-black">{format.label}</td><td className="p-4"><strong className="text-[#174f35]">{result.leader.name}</strong></td><td className="p-4 font-mono">{positionLabel(comparison.position)}{leftView.rank} · {(leftView.rating / 10).toFixed(1)}</td><td className="p-4 font-mono">{positionLabel(comparison.position)}{rightView.rank} · {(rightView.rating / 10).toFixed(1)}</td><td className="p-4 font-mono font-black">{(Math.abs(leftView.rating - rightView.rating) / 10).toFixed(1)}</td></tr>;
    })}</tbody></table></div></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Why the order looks this way</span><h2 className="section-title mt-6">Value, production, workload and runway.</h2></div><div className="space-y-4 text-sm leading-7"><p>{comparison.selectionReason}</p><p>{factorSentence(pair.left)} {factorSentence(pair.right)}</p><p>Current redraft value remains the anchor. Recent results, opportunity, snap share and remaining positional schedule can move the order within guarded limits.</p></div></div></section>
    <section className="page-wrap grid gap-4 py-12 md:grid-cols-3"><Link href={startSitPathForPlayers(comparison.leftSlug, comparison.rightSlug)} className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white">This week</span><strong className="mt-5 block text-xl">Open the start/sit call →</strong></Link><Link href={`/fantasy-trade-calculator?send=${comparison.leftSlug}&get=${comparison.rightSlug}`} className="border border-[#171c19] bg-[#ff6b3d] p-6 text-white shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white text-[#171c19]">Trade value</span><strong className="mt-5 block text-xl">Price the swap →</strong></Link><Link href={`/fantasy-football-rest-of-season-rankings/${positionPath(comparison.position)}`} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow">Full board</span><strong className="mt-5 block text-xl">See every {comparison.position} →</strong></Link></section>
    {related.length ? <section className="page-wrap py-12"><span className="eyebrow">Related rest-of-season decisions</span><div className="mt-6 flex flex-wrap gap-3">{related.map((item) => <Link key={item.slug} href={restOfSeasonComparisonPath(item.slug)} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#171c19] hover:bg-[#dfff4f]">{shortName(item.leftSlug)} vs. {shortName(item.rightSlug)} →</Link>)}</div></section> : null}
    <section className="page-wrap py-12"><span className="eyebrow">Questions, answered</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
  </>;
}

function PlayerCard({ row, page, leader }: { row: RestOfSeasonRankingRow; page: NonNullable<ReturnType<typeof getPlayerPage>>; leader: boolean }) {
  const view = row.formats.ppr;
  return <article className={`relative overflow-hidden border border-[#171c19] p-6 shadow-[5px_5px_0_#171c19] ${leader ? "bg-[#dfff4f]" : "bg-white"}`}>{leader ? <span className="absolute right-4 top-4 bg-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase text-white">ROS lean</span> : null}<div className="grid grid-cols-[112px_1fr] items-end gap-5"><div className="relative h-[148px] w-[112px]"><PlayerPortrait slug={row.slug} name={row.name} image={page.image} position={row.position} team={row.team} variant="card" sizes="112px" /></div><div><h2 className="text-3xl font-black leading-none tracking-[-0.05em]">{row.name}</h2><div className="mt-3 flex items-center gap-2"><TeamLogo team={row.team} size={32} /><span className="font-mono text-xs font-bold">{row.team ?? "FA"} · {row.availability}</span></div></div></div><div className="mt-7 grid grid-cols-3 border border-[#171c19] bg-white/60 text-center"><Metric label="PPR rank" value={`${positionLabel(row.position)}${view.rank}`} /><Metric label="FTT rating" value={(view.rating / 10).toFixed(1)} /><Metric label="Recent PPG" value={number(view.recentPointsPerGame)} /></div><div className="mt-6 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Recent workload:</strong> {number(view.recentOpportunity)}</p><p><strong>Snap share:</strong> {view.recentSnapPct === null ? "—" : `${Math.round(view.recentSnapPct * 100)}%`}</p><p><strong>Schedule:</strong> {scheduleLabel(view.schedulePercentile)}</p><p><strong>Rated games:</strong> {view.remainingGames}</p></div><Link href={`/players/${row.slug}`} className="mt-6 inline-block font-mono text-[10px] font-black uppercase underline">Open player file →</Link></article>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="border-r border-[#171c19] p-3 last:border-r-0"><span className="block font-mono text-[9px] font-bold uppercase text-[#69706c]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
function factorSentence(row: RestOfSeasonRankingRow) { const view = row.formats.ppr; return `${row.name}: ${number(view.recentPointsPerGame)} recent PPR points per game, ${number(view.recentOpportunity)} opportunities and a ${scheduleLabel(view.schedulePercentile).toLowerCase()} remaining schedule.`; }
function buildFaqs(comparison: RestOfSeasonComparisonConfig, left: RestOfSeasonRankingRow, right: RestOfSeasonRankingRow, verdict: string) { const ppr = restOfSeasonLeader(left, right, "ppr"); const half = restOfSeasonLeader(left, right, "halfPpr"); const standard = restOfSeasonLeader(left, right, "standard"); return [{ question: `Who should I roster rest of season: ${left.name} or ${right.name}?`, answer: `${verdict} ${ppr.leader.name} is ${positionLabel(comparison.position)}${ppr.leader.formats.ppr.rank} in the current PPR rankings.` }, { question: `Should I trade ${left.name} for ${right.name}?`, answer: `The current rest-of-season order favors ${ppr.leader.name}. Price the deal in the redraft calculator before accounting for roster needs and the other pieces in the offer.` }, { question: "Does the scoring format change the answer?", answer: `PPR favors ${ppr.leader.name}, Half PPR favors ${half.leader.name}, and Standard favors ${standard.leader.name}.` }, { question: "Is this the same as a weekly start/sit decision?", answer: "No. This comparison weighs the remaining season. The start/sit page focuses only on the current week's projection, matchup and availability." }]; }
function buildSchema(path: string, comparison: RestOfSeasonComparisonConfig, left: RestOfSeasonRankingRow, right: RestOfSeasonRankingRow, verdict: string, faqs: ReturnType<typeof buildFaqs>) { return [{ "@context": "https://schema.org", "@type": "WebPage", name: `${left.name} vs. ${right.name} rest-of-season fantasy football comparison`, description: verdict, url: `${SITE_URL}${path}`, dateModified: restOfSeasonUpdatedAt, mainEntity: { "@type": "ItemList", numberOfItems: 2, itemListElement: [left, right].sort((a, b) => a.formats.ppr.rank - b.formats.ppr.rank).map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.name}: ${positionLabel(comparison.position)}${row.formats.ppr.rank} rest-of-season PPR rank`, url: `${SITE_URL}/players/${row.slug}` })) } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Rest-of-season comparisons", item: `${SITE_URL}${restOfSeasonComparisonPath()}` }, { "@type": "ListItem", position: 3, name: `${left.name} vs. ${right.name}`, item: `${SITE_URL}${path}` }] }]; }
function scheduleLabel(value: number) { return value >= 0.67 ? "Favorable" : value <= 0.33 ? "Demanding" : "Balanced"; }
function number(value: number | null) { return value === null ? "—" : value.toFixed(1); }
function positionLabel(position: string) { return `${position}#`; }
function positionPath(position: "QB" | "RB" | "WR" | "TE") { return ({ QB: "quarterbacks", RB: "running-backs", WR: "wide-receivers", TE: "tight-ends" } as const)[position]; }
function shortName(slug: string) { return getPlayerPage(slug)?.name ?? slug; }
