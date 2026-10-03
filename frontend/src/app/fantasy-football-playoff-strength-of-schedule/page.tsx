import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import TeamLogo from "../components/TeamLogo";
import { buildPageMetadata } from "../lib/metadata";
import { nflversePlayerRelease } from "../lib/nflverse";
import { getPlayoffScheduleRatings, playoffPositionConfigs, playoffSchedulePath, primaryPlayoffWeeks } from "../lib/playoff-schedule";
import { teamRelease } from "../lib/team-data";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "2026 Fantasy Football Playoff Schedule & Strength of Schedule",
  description: "Rank every NFL team for the 2026 fantasy playoffs by QB, RB, WR and TE schedule. Compare Weeks 15–17 or 14–16 in PPR, Half PPR and Standard.",
  path: playoffSchedulePath(),
});

export default function FantasyFootballPlayoffSchedulePage() {
  const positionBoards = playoffPositionConfigs.map((config) => ({ config, ratings: getPlayoffScheduleRatings(config) }));
  const faqs = buildFaqs();
  return <>
    <AnalyticsPageView eventName="playoff_schedule_viewed" properties={{ page_type: "hub", season: teamRelease.season, weeks: primaryPlayoffWeeks.join("-") }} />
    <JsonLd data={buildSchema(positionBoards, faqs)} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-strength-of-schedule">Strength of schedule</Link><span>/</span><span className="text-[#171c19]">Fantasy playoffs</span></nav>
    <section className="border-y border-[#171c19] bg-[#d7b6ff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">2026 playoff planner · Weeks 15–17</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Fantasy football playoff <span className="text-[#5c2b7d]">strength of schedule.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">Find the teams with the friendliest quarterback, running back, wide receiver and tight end paths before Weeks 15–17 arrive.</p><p className="mt-6 max-w-3xl text-sm leading-7 text-[#514759]">Your league may use Weeks 14–16 instead. Each position board supports both windows and all three reception settings.</p></div></section>
    <section className="page-wrap py-14"><div className="mb-8"><span className="eyebrow">Answer first</span><h2 className="section-title mt-6">The best playoff paths by position.</h2></div><div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">{positionBoards.map(({ config, ratings }, index) => { const leader = ratings[0]; return <Link key={config.slug} href={playoffSchedulePath(config.slug)} className={`group p-6 sm:p-8 ${index % 2 ? "bg-[#8bcfff]" : "bg-[#dfff4f]"} hover:bg-white`}><span className="mono-label">{config.position} · PPR · Weeks 15–17</span><div className="mt-6 flex items-center gap-4"><TeamLogo team={leader?.team.abbr} size={56} decorative /><div><h2 className="text-3xl font-black tracking-[-0.05em]">{leader?.team.name ?? "Ranking updating"}</h2><p className="mt-1 text-sm font-bold">{leader ? `${leader.games.map(({ opponent }) => opponent?.abbr ?? "BYE").join(" · ")} · ${leader.averages.ppr.toFixed(1)} PPR allowed` : ""}</p></div></div><p className="mt-6 text-sm leading-7 text-[#46504a]">Rank all 32 {config.label.toLowerCase()} schedules, compare playoff windows, and inspect the players attached to each team.</p><span className="mt-6 block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">Open {config.label.toLowerCase()} board →</span></Link>; })}</div></section>
    <section className="border-y border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow border-white/30 bg-white text-[#171c19]">How to use it</span><h2 className="section-title mt-6">Trade for the player. Check the runway.</h2></div><div className="space-y-4 text-sm leading-7 text-white/70"><p>A playoff schedule is a tiebreaker, not the whole case. Start with talent, role and availability; use the opponent run to separate otherwise close roster decisions.</p><p>The tables use the current {teamRelease.season} schedule and {nflversePlayerRelease.positionDefense.season} fantasy points allowed by position. They do not assume last year&apos;s defense will stay unchanged.</p><div className="flex flex-wrap gap-3 pt-2"><Link href="/fantasy-football-rest-of-season-rankings" className="border border-white bg-[#dfff4f] px-4 py-3 font-mono text-[10px] font-black uppercase text-[#171c19]">Rest-of-season rankings →</Link><Link href="/fantasy-football-trade-targets" className="border border-white px-4 py-3 font-mono text-[10px] font-black uppercase text-white">Current trade targets →</Link></div></div></div></section>
    <section className="page-wrap py-14"><span className="eyebrow">Fantasy playoff questions</span><div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">{faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h2 className="text-xl font-black tracking-[-0.03em]">{question}</h2><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
  </>;
}

function buildFaqs() { return [
  { question: "What weeks are the fantasy football playoffs?", answer: "Weeks 15–17 are the most common three-week window, while some leagues use Weeks 14–16. Check your league settings before planning around a schedule." },
  { question: "What does playoff strength of schedule measure?", answer: "It averages how many fantasy points each scheduled opponent allowed to the selected position. Higher points allowed produces a friendlier schedule rank." },
  { question: "Should playoff schedule decide a fantasy trade?", answer: "Use it as a tiebreaker between players with comparable talent, workload and health. A favorable schedule cannot replace a dependable role." },
  { question: "Does scoring format change the playoff rankings?", answer: "Yes. PPR, Half PPR and Standard use different opponent points-allowed totals, so receiving-heavy positions and teams can change order." },
]; }

function buildSchema(boards: Array<{ config: (typeof playoffPositionConfigs)[number]; ratings: ReturnType<typeof getPlayoffScheduleRatings> }>, faqs: ReturnType<typeof buildFaqs>) { const url = `${SITE_URL}${playoffSchedulePath()}`; return [{ "@context": "https://schema.org", "@type": "CollectionPage", url, name: `${teamRelease.season} fantasy football playoff strength of schedule`, dateModified: nflversePlayerRelease.capturedAt, mainEntity: { "@type": "ItemList", numberOfItems: boards.length, itemListElement: boards.map(({ config, ratings }, index) => ({ "@type": "ListItem", position: index + 1, name: `${config.label} playoff strength of schedule: ${ratings[0]?.team.name ?? "updating"} ranks first`, url: `${SITE_URL}${playoffSchedulePath(config.slug)}` })) } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }]; }
