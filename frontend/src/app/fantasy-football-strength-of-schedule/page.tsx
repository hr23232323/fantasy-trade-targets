import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata } from "../lib/metadata";
import { getWeeklyScheduleRatings, scheduleRatingSlugs } from "../lib/schedule-ratings";
import { environmentClass, teamRelease } from "../lib/team-data";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "2026 Fantasy Football Strength of Schedule by Week",
  description: "Rank all 32 teams by weekly fantasy scoring environment using opponent scoring defense, game site, and rest for every week of the 2026 season.",
  path: "/fantasy-football-strength-of-schedule",
});

export default function StrengthOfScheduleHub() {
  return (
    <>
      <AnalyticsPageView eventName="schedule_rating_hub_viewed" properties={{ experiment: "weekly_schedule_ratings", week_count: scheduleRatingSlugs.length, season: teamRelease.season }} />
      <JsonLd data={buildSchema()} />
      <section className="border-b border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">Schedule ratings // all 18 weeks</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Fantasy football <span className="text-[#a23616]">strength of schedule.</span></h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8">Choose a week to rank all 32 teams by opponent scoring defense, site, and rest. The result describes the team scoring environment; it does not turn last season into a player projection.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-3">
          {scheduleRatingSlugs.map((slug, index) => {
            const week = index + 1;
            const leaders = getWeeklyScheduleRatings(week).slice(0, 3);
            return (
              <Link key={slug} href={`/fantasy-football-strength-of-schedule/${slug}`} className={`group p-6 hover:bg-white ${week % 3 === 1 ? "bg-[#8bcfff]" : week % 3 === 2 ? "bg-[#f3f0e7]" : "bg-[#ffb29a]"}`}>
                <span className="mono-label">2026 · Week {week}</span>
                <h2 className="mt-6 text-3xl font-black tracking-[-0.05em]">Schedule ratings</h2>
                <div className="mt-6 space-y-2 text-sm">
                  {leaders.map((row) => <p key={row.team.abbr} className="flex justify-between gap-3"><span>{row.team.nickname} vs. {row.opponent.nickname}</span><strong className={`${environmentClass(row.game.environmentLabel)} border border-[#171c19] px-2 font-mono`}>{row.game.environmentScore}</strong></p>)}
                </div>
                <span className="mt-7 block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">Rank all 32 teams →</span>
              </Link>
            );
          })}
        </div>
      </section>
      <aside className="page-wrap border-t border-[#9d9a91] py-8 text-xs leading-6 text-[#69706c]">Model <span className="font-mono">{teamRelease.modelVersion}</span> uses {teamRelease.baselineSeason} scoring defense, site, and rest. It does not include player usage, position-specific fantasy points, injuries, projections, weather, or betting lines.</aside>
    </>
  );
}

function buildSchema() {
  const url = `${SITE_URL}/fantasy-football-strength-of-schedule`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: `${teamRelease.season} fantasy football strength of schedule by week`,
    dateModified: teamRelease.capturedAt,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: scheduleRatingSlugs.length,
      itemListElement: scheduleRatingSlugs.map((slug, index) => ({ "@type": "ListItem", position: index + 1, name: `Week ${index + 1} fantasy football schedule ratings`, url: `${url}/${slug}` })),
    },
  };
}
