import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import PlayoffScheduleTable, { type PlayoffScheduleTableRow } from "../../components/PlayoffScheduleTable";
import TeamLogo from "../../components/TeamLogo";
import { getMarket } from "../../lib/market";
import { nflversePlayerRelease } from "../../lib/nflverse";
import { alternatePlayoffWeeks, getPlayoffPositionConfig, getPlayoffScheduleRatings, playoffPositionConfigs, playoffSchedulePath, primaryPlayoffWeeks } from "../../lib/playoff-schedule";
import { canonicalTeamAbbr, teamRelease } from "../../lib/team-data";

const SITE_URL = "https://fantasytradetarget.com";
type PageProps = { params: Promise<{ position: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return playoffPositionConfigs.map(({ slug }) => ({ position: slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = getPlayoffPositionConfig((await params).position);
  if (!config) return {};
  const path = playoffSchedulePath(config.slug);
  return {
    title: `2026 ${config.label} Fantasy Football Playoff Strength of Schedule`,
    description: `Rank all 32 NFL teams by ${config.singular} fantasy playoff schedule. Compare Weeks 15–17 or 14–16 in PPR, Half PPR and Standard scoring.`,
    alternates: { canonical: path },
  };
}

export default async function PlayoffPositionPage({ params }: PageProps) {
  const config = getPlayoffPositionConfig((await params).position);
  if (!config) notFound();
  const [primaryRows, alternateRows, market] = await Promise.all([
    Promise.resolve(getPlayoffScheduleRatings(config, primaryPlayoffWeeks)),
    Promise.resolve(getPlayoffScheduleRatings(config, alternatePlayoffWeeks)),
    getMarket({ format: "redraft", numQbs: 1, tep: false }),
  ]);
  const playersByTeam = new Map<string, Array<{ slug: string; name: string }>>();
  for (const player of market.assets) {
    if (player.kind !== "player" || player.position !== config.position) continue;
    const team = canonicalTeamAbbr(player.team);
    if (!team) continue;
    const players = playersByTeam.get(team) ?? [];
    if (players.length < 2) players.push({ slug: player.slug, name: player.name });
    playersByTeam.set(team, players);
  }
  const tableWindows = [
    { key: "weeks-15-17", label: "Weeks 15–17", weeks: [...primaryPlayoffWeeks], rows: toTableRows(primaryRows, playersByTeam) },
    { key: "weeks-14-16", label: "Weeks 14–16", weeks: [...alternatePlayoffWeeks], rows: toTableRows(alternateRows, playersByTeam) },
  ];
  const leader = primaryRows[0];
  const toughest = primaryRows.at(-1);
  const faqs = buildFaqs(config.label.toLowerCase(), config.singular, leader, toughest);
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(nflversePlayerRelease.capturedAt));
  return <>
    <AnalyticsPageView eventName="playoff_schedule_viewed" properties={{ page_type: "position", position: config.position, season: teamRelease.season, team_count: primaryRows.length }} />
    <JsonLd data={buildSchema(config.label, config.slug, primaryRows, faqs)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={playoffSchedulePath()}>Playoff strength of schedule</Link><span>/</span><span className="text-[#171c19]">{config.label}s</span></nav>
    <section className="border-y border-[#171c19] bg-[#d7b6ff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">2026 fantasy playoffs · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{config.label} fantasy football playoff <span className="text-[#5c2b7d]">strength of schedule.</span></h1>{leader && <p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{leader.team.name} ranks first for {config.singular}s in Weeks 15–17, facing {leader.games.map(({ opponent }) => opponent?.abbr ?? "BYE").join(", ")}.</p>}<p className="mt-6 max-w-3xl text-sm leading-7 text-[#514759]">Switch the playoff window and reception scoring below. Higher opponent points allowed means a friendlier path for the position—not a guaranteed player result. A bye counts as a zero-opportunity week.</p></div></section>
    <section className="page-wrap py-12"><div className="mb-8 grid gap-4 lg:grid-cols-2">{leader && <SummaryCard label="Best playoff path" row={leader} color="bg-[#dfff4f]" />}{toughest && <SummaryCard label="Toughest playoff path" row={toughest} color="bg-[#ffb29a]" />}</div><PlayoffScheduleTable windows={tableWindows} position={config.position} /><p className="mt-5 text-xs leading-6 text-[#69706c]">Opponent values use {nflversePlayerRelease.positionDefense.season} regular-season fantasy points allowed per game. The schedule is the current {teamRelease.season} release. Team personnel and defensive performance can change before the fantasy playoffs.</p></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Make it actionable</span><h2 className="section-title mt-6">Use schedule as the final filter.</h2></div><div className="space-y-4 text-sm leading-7"><p>Compare playoff paths after checking current role, usage and health. The linked player files show market value, recent workload and weekly results for the leading options on each team.</p><div className="flex flex-wrap gap-3"><Link href="/fantasy-football-rest-of-season-rankings" className="border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase text-white">Rest-of-season rankings →</Link><Link href="/dynasty-trade-calculator" className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase">Price a trade →</Link></div></div></div></section>
    <section className="page-wrap py-12"><span className="eyebrow">Other playoff positions</span><div className="mt-6 flex flex-wrap gap-3">{playoffPositionConfigs.filter(({ slug }) => slug !== config.slug).map((item) => <Link key={item.slug} href={playoffSchedulePath(item.slug)} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#171c19] hover:bg-[#dfff4f]">{item.label}s →</Link>)}</div></section>
    <section className="page-wrap py-12"><span className="eyebrow">Questions, answered</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
  </>;
}

function toTableRows(rows: ReturnType<typeof getPlayoffScheduleRatings>, playersByTeam: Map<string, Array<{ slug: string; name: string }>>): PlayoffScheduleTableRow[] { return rows.map((row) => ({ team: { abbr: row.team.abbr, name: row.team.name, slug: row.team.slug }, games: row.games.map(({ week, game, opponent, bye, pointsAllowed }) => ({ week, site: game?.site ?? null, opponent: opponent ? { abbr: opponent.abbr, name: opponent.name, slug: opponent.slug } : null, bye, pointsAllowed })), averages: row.averages, players: playersByTeam.get(row.team.abbr) ?? [] })); }
function SummaryCard({ label, row, color }: { label: string; row: ReturnType<typeof getPlayoffScheduleRatings>[number]; color: string }) { return <article className={`${color} border border-[#171c19] p-6`}><span className="mono-label">{label} · PPR</span><div className="mt-5 flex items-center gap-4"><TeamLogo team={row.team.abbr} size={52} decorative /><div><h2 className="text-2xl font-black tracking-[-0.04em]">{row.team.name}</h2><p className="mt-1 font-mono text-xs font-bold">{row.games.map(({ opponent }) => opponent?.abbr ?? "BYE").join(" · ")} · {row.averages.ppr.toFixed(1)} allowed</p></div></div></article>; }
function buildFaqs(label: string, singular: string, leader?: ReturnType<typeof getPlayoffScheduleRatings>[number], toughest?: ReturnType<typeof getPlayoffScheduleRatings>[number]) { return [{ question: `Who has the best fantasy playoff schedule for ${label}?`, answer: leader ? `${leader.team.name} ranks first for Weeks 15–17 because its opponents allowed an average of ${leader.averages.ppr.toFixed(1)} PPR points per game to ${singular}s.` : "The ranking is updating." }, { question: `Who has the toughest fantasy playoff schedule for ${label}?`, answer: toughest ? `${toughest.team.name} ranks last for Weeks 15–17 based on opponent fantasy points allowed to ${singular}s.` : "The ranking is updating." }, { question: "Can I use Weeks 14–16 instead?", answer: "Yes. Use the playoff-window control above if your league finishes in Week 16. The ranking recalculates from those three scheduled opponents." }, { question: "Should I bench a strong player because of this ranking?", answer: "No. Schedule is most useful as a trade and tiebreaker input. Talent, workload, health and lineup alternatives remain more important." }]; }
function buildSchema(label: string, slug: string, rows: ReturnType<typeof getPlayoffScheduleRatings>, faqs: ReturnType<typeof buildFaqs>) { const url = `${SITE_URL}${playoffSchedulePath(slug)}`; return [{ "@context": "https://schema.org", "@type": "Dataset", name: `${teamRelease.season} ${label} fantasy football playoff strength of schedule`, description: `All 32 NFL teams ranked by ${label.toLowerCase()} fantasy playoff schedule for Weeks 15–17, with alternate Weeks 14–16 rankings and Standard, Half PPR and PPR scoring.`, url, dateModified: nflversePlayerRelease.capturedAt, license: "https://creativecommons.org/licenses/by/4.0/", creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["Standard fantasy points allowed", "Half PPR fantasy points allowed", "PPR fantasy points allowed"], temporalCoverage: `${teamRelease.season}-W15/${teamRelease.season}-W17` }, { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.map((row) => ({ "@type": "ListItem", position: row.rank, name: `${row.team.name}: ${row.averages.ppr.toFixed(1)} PPR points allowed by playoff opponents` })) }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }]; }
