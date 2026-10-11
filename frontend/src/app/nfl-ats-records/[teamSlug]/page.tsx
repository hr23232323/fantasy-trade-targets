import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import BettingDisclosure from "../../components/BettingDisclosure";
import JsonLd from "../../components/JsonLd";
import TeamLogo from "../../components/TeamLogo";
import { bettingTrendsHubPath, opponentName, percent, record, teamBettingTrendsPath, teamTrendAnswer, totalsRecord } from "../../lib/nfl-betting-trends";
import { formatGameDate, getTeamBySlug, teamRelease, teams } from "../../lib/team-data";
import type { TeamBettingTrendSummary } from "../../types/Team";

const SITE_URL = "https://fantasytradetarget.com";
type Props = { params: Promise<{ teamSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return teams.map(({ slug }) => ({ teamSlug: slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = getTeamBySlug((await params).teamSlug); if (!team) return {};
  const title = `${team.name} ATS Record & Betting Trends (${teamRelease.season})`;
  const description = `${teamTrendAnswer(team)} See game-by-game spread results, totals and last-10 trends.`;
  return { title, description, alternates: { canonical: teamBettingTrendsPath(team.slug) }, openGraph: { type: "article", title, description } };
}

export default async function TeamBettingTrendsPage({ params }: Props) {
  const team = getTeamBySlug((await params).teamSlug); if (!team) notFound();
  const answer = teamTrendAnswer(team);
  const recentGames = [...team.bettingTrends.games].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 18);
  const faqs = [
    { q: `What is the ${team.name} ATS record in ${teamRelease.season}?`, a: answer },
    { q: `What is the ${team.name} over-under record?`, a: `${team.name} has gone ${totalsRecord(team.bettingTrends.currentSeason.totals)} on listed game totals this season.` },
    { q: `How have the ${team.nickname} performed ATS recently?`, a: `Over the last 10 graded games across seasons, ${team.name} is ${record(team.bettingTrends.last10.againstSpread)} ATS with a ${percent(team.bettingTrends.last10.againstSpread.coverRate)} cover rate.` },
  ];
  return <>
    <AnalyticsPageView eventName="nfl_team_betting_trends_viewed" properties={{ team: team.abbr, season: teamRelease.season, release_id: teamRelease.releaseId }} />
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "SportsTeam", name: team.name, url: `${SITE_URL}${teamBettingTrendsPath(team.slug)}`, sport: "American football", memberOf: { "@type": "SportsOrganization", name: "National Football League" } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "NFL ATS records", item: `${SITE_URL}${bettingTrendsHubPath()}` }, { "@type": "ListItem", position: 3, name: team.name, item: `${SITE_URL}${teamBettingTrendsPath(team.slug)}` }] }]} />
    <nav className="page-wrap flex gap-2 py-4 font-mono text-[10px] font-bold uppercase text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={bettingTrendsHubPath()}>NFL ATS records</Link><span>/</span><span className="text-[#171c19]">{team.nickname}</span></nav>
    <section className="border-y border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_auto]"><div><span className="mono-label text-[#dfff4f]">{teamRelease.season} team betting trends</span><h1 className="mt-7 max-w-5xl text-[clamp(3rem,7vw,6.5rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{team.name} <span className="text-[#ff6b3d]">ATS record.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#dfff4f] pl-5 text-lg font-black leading-8">{answer}</p></div><div className="mx-auto rounded-full bg-white p-5"><TeamLogo team={team.abbr} size={120} decorative /></div></div></section>
    <main className="page-wrap py-12"><section className="grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-3"><Summary label={`${teamRelease.season} season`} summary={team.bettingTrends.currentSeason} color="#dfff4f" /><Summary label="Last 10 games" summary={team.bettingTrends.last10} color="#8bcfff" /><Summary label={`${teamRelease.baselineSeason} season`} summary={team.bettingTrends.previousSeason} color="#ffb29a" /></section>
      <section className="mt-14"><span className="eyebrow">Game-by-game results</span><h2 className="section-title mt-5">{team.nickname} spread and total history.</h2><div className="mt-6 overflow-x-auto border border-[#171c19] bg-white shadow-[5px_5px_0_#171c19]"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-[#171c19] font-mono text-[10px] uppercase text-white"><tr><th className="p-4">Date</th><th className="p-4">Matchup</th><th className="p-4">Final</th><th className="p-4">Team line</th><th className="p-4">ATS</th><th className="p-4">Total</th><th className="p-4">O/U result</th></tr></thead><tbody className="divide-y divide-[#c7c3b8]">{recentGames.map((game) => <tr key={game.gameId} className="hover:bg-[#f1f8d4]"><td className="p-4">{formatGameDate(game.date)}</td><td className="p-4 font-black">{game.site === "away" ? "at" : game.site === "neutral" ? "vs." : "vs."} {opponentName(game)}</td><td className="p-4">{team.abbr} {game.teamScore}–{game.opponentScore} <strong>{game.result}</strong></td><td className="p-4">{game.teamSpread > 0 ? "+" : ""}{game.teamSpread}</td><td className="p-4"><ResultChip result={game.atsResult} /></td><td className="p-4">{game.totalLine}</td><td className="p-4"><ResultChip result={game.totalResult} /></td></tr>)}</tbody></table></div></section>
      <section className="mt-14 grid gap-4 lg:grid-cols-3">{faqs.map((faq) => <article key={faq.q} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><h2 className="text-xl font-black">{faq.q}</h2><p className="mt-4 text-sm leading-7 text-[#59605c]">{faq.a}</p></article>)}</section>
      <div className="mt-12 flex flex-wrap gap-3"><Link href={bettingTrendsHubPath()} className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">All NFL ATS records →</Link><Link href="/nfl-picks-predictions" className="border border-[#171c19] bg-white px-5 py-4 font-mono text-[10px] font-black uppercase">This week&apos;s predictions →</Link></div>
      <aside className="mt-12 border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Results and listed spread/total fields: nflverse under CC BY 4.0 · release <span className="font-mono">{teamRelease.releaseId}</span>. Historical records are descriptive, not a forecast.</aside>
    </main><BettingDisclosure />
  </>;
}

function Summary({ label, summary, color }: { label: string; summary: TeamBettingTrendSummary; color: string }) { return <article className="p-6" style={{ backgroundColor: color }}><span className="eyebrow bg-white">{label}</span><strong className="mt-6 block text-5xl tracking-[-0.07em]">{record(summary.againstSpread)} ATS</strong><p className="mt-3 text-sm font-black">{percent(summary.againstSpread.coverRate)} cover rate · {totalsRecord(summary.totals)} O/U · {record(summary.straightUp)} straight up</p></article>; }
function ResultChip({ result }: { result: "W" | "L" | "P" | "O" | "U" }) { const label = result === "W" ? "Cover" : result === "L" ? "No cover" : result === "P" ? "Push" : result === "O" ? "Over" : "Under"; const color = result === "W" || result === "O" ? "bg-[#dfff4f]" : result === "L" || result === "U" ? "bg-[#ffb29a]" : "bg-[#e4dfd2]"; return <span className={`${color} inline-block border border-[#171c19] px-2 py-1 font-mono text-[9px] font-black uppercase`}>{label}</span>; }
