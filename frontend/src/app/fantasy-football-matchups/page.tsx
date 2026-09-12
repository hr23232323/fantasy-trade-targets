import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata } from "../lib/metadata";
import {
  getWeekDateRange,
  regularSeasonWeeks,
  weeklyMatchupRelease,
} from "../lib/weekly-matchups";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "2026 Fantasy Football Weekly Matchups & NFL Schedule",
  description:
    "Browse every 2026 fantasy football week with the NFL schedule, live player trade values, team scoring environments, venues, surfaces, and rest context.",
  path: "/fantasy-football-matchups",
});

export default function WeeklyMatchupsHub() {
  return (
    <>
      <AnalyticsPageView
        eventName="weekly_matchups_hub_viewed"
        properties={{ season: weeklyMatchupRelease.season, week_count: regularSeasonWeeks.length }}
      />
      <JsonLd data={buildSchema()} />

      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">Weekly matchups // all 18 weeks</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3.1rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">
            2026 fantasy football
            <span className="block text-[#8bcfff]">matchups and schedule.</span>
          </h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">
            Open any week for every NFL game, current redraft values, opponent scoring context, venue, surface, and rest. It is a slate-level research layer—not an injury report or a projection pretending to know Sunday.
          </p>
        </div>
      </section>

      <section className="page-wrap py-14">
        <div className="border-t border-[#171c19] pt-6">
          <span className="eyebrow">Regular season</span>
          <h2 className="section-title mt-5">Choose a week.</h2>
        </div>
        <div className="mt-10 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-3">
          {regularSeasonWeeks.map((week) => {
            const range = getWeekDateRange(week);
            return (
              <Link
                key={week}
                href={`/fantasy-football-matchups/week-${week}`}
                className={`group min-h-48 p-6 hover:bg-white ${week % 3 === 1 ? "bg-[#dfff4f]" : week % 3 === 2 ? "bg-[#8bcfff]" : "bg-[#f3f0e7]"}`}
              >
                <span className="mono-label text-[#59605c]">2026 NFL schedule</span>
                <h3 className="mt-7 text-4xl font-black tracking-[-0.055em]">Week {week}</h3>
                <p className="mt-3 text-sm text-[#59605c]">{range ? formatDateRange(range.start, range.end) : "Schedule unavailable"}</p>
                <span className="mt-8 block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">Open the slate →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] py-8 text-xs leading-6 text-[#69706c]">
        Schedule and prior-season team scoring context come from nflverse under CC BY 4.0. Player values come from the current validated Fantasy Trade Target market release. Weekly pages do not include injury designations, projections, betting lines, or news reports.
      </aside>
    </>
  );
}

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${start}T12:00:00Z`))}–${formatter.format(new Date(`${end}T12:00:00Z`))}`;
}

function buildSchema() {
  const url = `${SITE_URL}/fantasy-football-matchups`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: `${weeklyMatchupRelease.season} fantasy football weekly matchups`,
    dateModified: weeklyMatchupRelease.capturedAt,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: regularSeasonWeeks.length,
      itemListElement: regularSeasonWeeks.map((week, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `Week ${week} fantasy football matchups`,
        url: `${url}/week-${week}`,
      })),
    },
  };
}
