import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../../components/AnalyticsPageView";
import JsonLd from "../../../components/JsonLd";
import PlayerPortrait from "../../../components/PlayerPortrait";
import TeamLogo from "../../../components/TeamLogo";
import { nflversePlayerRelease } from "../../../lib/nflverse";
import { getPlayoffPlayerOutlook, playoffPlayerPath, playoffPlayerSlugs, type PlayoffPlayerOutlook } from "../../../lib/playoff-player-pages";
import { playoffSchedulePath, type PlayoffScoringField } from "../../../lib/playoff-schedule";
import { restOfSeasonUpdatedAt } from "../../../lib/rest-of-season";
import { tradeFinderPath } from "../../../lib/trade-decisions";

const SITE_URL = "https://fantasytradetarget.com";
const formats: Array<{ key: PlayoffScoringField; label: string }> = [
  { key: "ppr", label: "PPR" },
  { key: "halfPpr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return playoffPlayerSlugs.map((slug) => ({ slug: slug.replace(/-(qb|rb|wr|te)$/, "") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const outlook = await findOutlook((await params).slug);
  if (!outlook) return {};
  const opponents = outlook.primary.games.map(({ opponent }) => opponent?.abbr ?? "BYE").join(", ");
  const title = `${outlook.player.name} Fantasy Playoff Schedule 2026: Weeks 15–17`;
  const description = `${outlook.player.name}'s ${outlook.primary.team.name} rank No. ${outlook.ranks.ppr} for ${positionName(outlook.player.position)} fantasy playoff schedule. See Weeks 15–17 opponents: ${opponents}.`;
  const path = playoffPlayerPath(outlook.player.slug);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title, description, images: [{ url: outlook.page.image.src, width: outlook.page.image.width, height: outlook.page.image.height, alt: outlook.page.image.alt }] },
    twitter: { card: "summary_large_image", title, description, images: [outlook.page.image.src] },
  };
}

export default async function PlayoffPlayerPage({ params }: PageProps) {
  const outlook = await findOutlook((await params).slug);
  if (!outlook) notFound();
  const { player, page, primary, alternate, ranks, alternateRank } = outlook;
  const verdict = scheduleVerdict(player.name, player.position, ranks.ppr);
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(restOfSeasonUpdatedAt));
  const positionSlug = ({ QB: "quarterbacks", RB: "running-backs", WR: "wide-receivers", TE: "tight-ends" } as const)[player.position];
  const faqs = buildFaqs(outlook, verdict);
  const path = playoffPlayerPath(player.slug);

  return <>
    <AnalyticsPageView eventName="playoff_player_outlook_viewed" properties={{ player_slug: player.slug, position: player.position, team: player.team, ppr_schedule_rank: ranks.ppr, alternate_rank: alternateRank }} />
    <JsonLd data={buildSchema(path, outlook, verdict, faqs)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={playoffSchedulePath()}>Playoff schedule</Link><span>/</span><Link href={playoffSchedulePath(positionSlug)}>{positionName(player.position)}s</Link><span>/</span><span className="text-[#171c19]">{player.name}</span></nav>

    <section className="border-y border-[#171c19] bg-[#d7b6ff]"><div className="page-wrap grid gap-8 py-14 lg:grid-cols-[1.15fr_0.55fr] lg:items-end lg:py-20"><div><span className="eyebrow bg-white">2026 fantasy playoffs · updated {updated}</span><h1 className="mt-7 max-w-5xl text-[clamp(3rem,7vw,6.6rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{player.name} fantasy playoff <span className="text-[#5c2b7d]">schedule.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{verdict}</p><p className="mt-6 max-w-3xl text-sm leading-7 text-[#514759]">This grades the schedule facing {primary.team.name} {positionName(player.position).toLowerCase()}s. It is a position-level tiebreaker—not an individual projection or guarantee.</p></div><div className="relative mx-auto h-[310px] w-full max-w-[270px] overflow-visible border border-[#171c19] bg-[#171c19] shadow-[7px_7px_0_#dfff4f]"><PlayerPortrait slug={player.slug} name={player.name} image={page.image} position={player.position} team={player.team} variant="hero" priority sizes="270px" /></div></div></section>

    <section className="page-wrap py-12"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Weeks 15–17</span><h2 className="section-title mt-5">The playoff path, game by game.</h2></div><div className="flex items-center gap-3 border border-[#171c19] bg-white px-4 py-3"><TeamLogo team={primary.team.abbr} size={38} decorative /><span className="font-mono text-xs font-black">{primary.team.name} · {player.position}</span></div></div><div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">{primary.games.map((game) => <article key={game.week} className="bg-white p-6"><span className="mono-label">Week {game.week}</span><h3 className="mt-4 text-3xl font-black tracking-[-0.05em]">{game.opponent ? `${game.game?.site === "away" ? "@" : "vs."} ${game.opponent.abbr}` : "BYE"}</h3>{game.opponent ? <><p className="mt-3 text-sm font-bold">{game.opponent.name}</p><dl className="mt-5 grid grid-cols-3 border border-[#171c19] text-center">{formats.map(({ key, label }) => <Metric key={key} label={label} value={game.pointsAllowed[key].toFixed(1)} />)}</dl></> : <p className="mt-3 text-sm leading-6 text-[#69706c]">No player scoring opportunity this week.</p>}</article>)}</div></section>

    <section className="border-y border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white text-[#171c19]">Scoring-format check</span><h2 className="section-title mt-6">How friendly is the full playoff schedule?</h2></div><div className="grid grid-cols-3 border border-white/40">{formats.map(({ key, label }) => <div key={key} className="border-r border-white/40 p-5 text-center last:border-r-0"><span className="font-mono text-[9px] font-black uppercase text-white/60">{label}</span><strong className="mt-2 block text-3xl text-[#dfff4f]">#{ranks[key]}</strong><span className="mt-1 block text-xs text-white/70">{primary.averages[key].toFixed(1)} allowed</span></div>)}</div></div></section>

    <section className="page-wrap grid gap-5 py-12 lg:grid-cols-2"><article className="border border-[#171c19] bg-[#8bcfff] p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white">If your league ends Week 16</span><h2 className="mt-5 text-3xl font-black tracking-[-0.05em]">Weeks 14–16 rank: #{alternateRank}</h2><p className="mt-4 text-sm leading-7">The opponents are {alternate.games.map(({ opponent }) => opponent?.abbr ?? "BYE").join(" · ")}, averaging {alternate.averages.ppr.toFixed(1)} PPR points allowed to {positionName(player.position).toLowerCase()}s.</p></article><article className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white">Rest-of-season context</span><h2 className="mt-5 text-3xl font-black tracking-[-0.05em]">{player.name} is {player.position}#{player.formats.ppr.rank} in PPR.</h2><p className="mt-4 text-sm leading-7">The current model shows {number(player.formats.ppr.recentPointsPerGame)} recent PPR points per game, {number(player.formats.ppr.recentOpportunity)} recent opportunities and {player.formats.ppr.remainingGames} games in the remaining-schedule sample.</p></article></section>

    <section className="page-wrap grid gap-4 py-12 md:grid-cols-3"><Link href={`/players/${player.slug}`} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow">Player file</span><strong className="mt-5 block text-xl">Check value and workload →</strong></Link><Link href={tradeFinderPath()} className="border border-[#171c19] bg-[#ffb29a] p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white">Trade decision</span><strong className="mt-5 block text-xl">Compare another player →</strong></Link><Link href={playoffSchedulePath(positionSlug)} className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[4px_4px_0_#171c19]"><span className="eyebrow bg-white">Full position board</span><strong className="mt-5 block text-xl">Rank all 32 teams →</strong></Link></section>

    <section className="page-wrap py-12"><span className="eyebrow">Questions, answered</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
  </>;
}

async function findOutlook(pathSlug: string) {
  const fullSlug = playoffPlayerSlugs.find((slug) => slug.replace(/-(qb|rb|wr|te)$/, "") === pathSlug);
  return fullSlug ? getPlayoffPlayerOutlook(fullSlug) : null;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="border-r border-[#171c19] p-3 last:border-r-0"><dt className="font-mono text-[8px] font-black uppercase text-[#69706c]">{label}</dt><dd className="mt-1 font-mono font-black">{value}</dd></div>; }
function scheduleVerdict(name: string, position: string, rank: number) { return rank <= 8 ? `${name} has a top-eight ${positionName(position).toLowerCase()} fantasy playoff schedule for Weeks 15–17.` : rank >= 25 ? `${name} faces one of the eight toughest ${positionName(position).toLowerCase()} fantasy playoff schedules for Weeks 15–17.` : `${name} has the No. ${rank} ${positionName(position).toLowerCase()} fantasy playoff schedule for Weeks 15–17.`; }
function positionName(position: string) { return ({ QB: "Quarterback", RB: "Running back", WR: "Wide receiver", TE: "Tight end" } as Record<string, string>)[position] ?? position; }
function number(value: number | null) { return value === null ? "—" : value.toFixed(1); }
function buildFaqs(outlook: PlayoffPlayerOutlook, verdict: string) { const { player, primary, alternate, ranks } = outlook; return [{ question: `Does ${player.name} have a good fantasy playoff schedule?`, answer: `${verdict} ${primary.team.name} faces ${primary.games.map(({ opponent }) => opponent?.abbr ?? "a bye").join(", ")} in Weeks 15–17.` }, { question: `What is ${player.name}'s fantasy playoff schedule?`, answer: `Weeks 15–17 are ${primary.games.map(({ week, opponent }) => `Week ${week}: ${opponent?.abbr ?? "BYE"}`).join("; ")}.` }, { question: "Does PPR scoring change the schedule rank?", answer: `The current team-level schedule ranks are No. ${ranks.ppr} in PPR, No. ${ranks.halfPpr} in Half PPR and No. ${ranks.standard} in Standard.` }, { question: "What if my fantasy playoffs are Weeks 14–16?", answer: `${primary.team.name} faces ${alternate.games.map(({ opponent }) => opponent?.abbr ?? "BYE").join(", ")} in that window. Use the alternate rank above instead of the Weeks 15–17 result.` }]; }
function buildSchema(path: string, outlook: PlayoffPlayerOutlook, verdict: string, faqs: ReturnType<typeof buildFaqs>) { const { player, primary } = outlook; return [{ "@context": "https://schema.org", "@type": "WebPage", name: `${player.name} fantasy football playoff schedule`, description: verdict, url: `${SITE_URL}${path}`, dateModified: restOfSeasonUpdatedAt, about: { "@type": "Person", name: player.name }, mainEntity: { "@type": "ItemList", numberOfItems: primary.games.length, itemListElement: primary.games.map((game, index) => ({ "@type": "ListItem", position: index + 1, name: `Week ${game.week}: ${game.opponent?.name ?? "Bye"}` })) } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Fantasy playoff schedules", item: `${SITE_URL}${playoffSchedulePath()}` }, { "@type": "ListItem", position: 3, name: player.name, item: `${SITE_URL}${path}` }] }]; }
