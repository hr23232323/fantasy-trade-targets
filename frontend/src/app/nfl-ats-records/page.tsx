import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import BettingDisclosure from "../components/BettingDisclosure";
import JsonLd from "../components/JsonLd";
import TeamLogo from "../components/TeamLogo";
import { atsRankings, bettingTrendsHubPath, percent, record, teamBettingTrendsPath, totalsRecord } from "../lib/nfl-betting-trends";
import { teamRelease } from "../lib/team-data";

const SITE_URL = "https://fantasytradetarget.com";
export const metadata: Metadata = { title: "NFL ATS Records 2026 — Against the Spread Standings", description: "Every NFL team's against-the-spread record, cover percentage, over-under record and straight-up record for 2026, the last 10 games and 2025.", alternates: { canonical: bettingTrendsHubPath() } };

export default function NflAtsRecordsPage() {
  const current = atsRankings("currentSeason");
  const leader = current[0];
  const faqs = [
    { q: "Which NFL team has the best ATS record in 2026?", a: `${leader.name} currently leads this table at ${record(leader.bettingTrends.currentSeason.againstSpread)} ATS, a ${percent(leader.bettingTrends.currentSeason.againstSpread.coverRate)} cover rate.` },
    { q: "What does ATS mean?", a: "ATS means against the spread. A team covers when its final margin plus its listed point spread is above zero; an exact zero is a push." },
    { q: "How often do NFL ATS records update?", a: "The standings refresh from nflverse after completed games are published. Listed lines are historical market fields, not live sportsbook quotes." },
  ];
  return <>
    <AnalyticsPageView eventName="nfl_ats_records_viewed" properties={{ season: teamRelease.season, team_count: current.length, release_id: teamRelease.releaseId }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `NFL ATS records ${teamRelease.season}`, url: `${SITE_URL}${bettingTrendsHubPath()}`, dateModified: teamRelease.capturedAt, mainEntity: { "@type": "ItemList", numberOfItems: current.length, itemListElement: current.map((team, index) => ({ "@type": "ListItem", position: index + 1, name: `${team.name} ATS record`, url: `${SITE_URL}${teamBettingTrendsPath(team.slug)}` })) } }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />
    <section className="border-y border-[#171c19] bg-[#ffb29a]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">All 32 teams · updated after completed games</span><h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7.2rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">NFL ATS records <span className="text-[#b23a1b]">{teamRelease.season}.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{leader.name} leads the current board at {record(leader.bettingTrends.currentSeason.againstSpread)} against the spread. Compare cover rates, over-under records and straight-up results for every team.</p></div></section>
    <main className="page-wrap py-12"><TrendTable title={`${teamRelease.season} NFL ATS standings`} period="currentSeason" teams={current} /><div className="mt-14"><TrendTable title="NFL ATS records — last 10 games" period="last10" teams={atsRankings("last10")} /></div><div className="mt-14"><TrendTable title={`${teamRelease.baselineSeason} NFL ATS records`} period="previousSeason" teams={atsRankings("previousSeason")} /></div>
      <section className="mt-14 grid gap-4 lg:grid-cols-3">{faqs.map((faq) => <article key={faq.q} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><h2 className="text-xl font-black">{faq.q}</h2><p className="mt-4 text-sm leading-7 text-[#59605c]">{faq.a}</p></article>)}</section>
      <aside className="mt-12 border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Results and listed spread/total fields: nflverse under CC BY 4.0 · release <span className="font-mono">{teamRelease.releaseId}</span>. Records describe completed games and do not establish a future betting edge.</aside>
    </main><BettingDisclosure />
  </>;
}

function TrendTable({ title, period, teams }: { title: string; period: "currentSeason" | "previousSeason" | "last10"; teams: ReturnType<typeof atsRankings> }) {
  return <section><div className="mb-6"><span className="eyebrow">Records and cover rates</span><h2 className="section-title mt-5">{title}</h2></div><div className="overflow-x-auto border border-[#171c19] bg-white shadow-[5px_5px_0_#171c19]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Team</th><th className="p-4">ATS</th><th className="p-4">Cover</th><th className="p-4">O/U</th><th className="p-4">Straight up</th></tr></thead><tbody className="divide-y divide-[#c7c3b8]">{teams.map((team, index) => { const summary = team.bettingTrends[period]; return <tr key={team.abbr} className="hover:bg-[#f1f8d4]"><td className="p-4 font-mono text-xs font-black">{index + 1}</td><td className="p-4"><Link href={teamBettingTrendsPath(team.slug)} className="flex items-center gap-3 font-black hover:underline"><TeamLogo team={team.abbr} size={34} decorative />{team.name}</Link></td><td className="p-4 font-black">{record(summary.againstSpread)}</td><td className="p-4">{percent(summary.againstSpread.coverRate)}</td><td className="p-4">{totalsRecord(summary.totals)}</td><td className="p-4">{record(summary.straightUp)}</td></tr>; })}</tbody></table></div></section>;
}
