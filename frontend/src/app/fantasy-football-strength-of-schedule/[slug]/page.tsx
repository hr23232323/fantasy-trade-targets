import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import TeamLogo from "../../components/TeamLogo";
import { buildPageMetadata } from "../../lib/metadata";
import { getMarket } from "../../lib/market";
import { hasPlayerPage } from "../../lib/player-pages";
import { getPositionScheduleConfig, getScheduleRatingWeek, getWeeklyScheduleRatings, positionScheduleSlugs, scheduleRatingSlugs } from "../../lib/schedule-ratings";
import { environmentClass, formatGameDate, formatGameTime, getTeamAssets, teamRelease } from "../../lib/team-data";
import PositionSchedulePage from "./PositionSchedulePage";

const SITE_URL = "https://fantasytradetarget.com";
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return [...scheduleRatingSlugs, ...positionScheduleSlugs].map((slug) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const position = getPositionScheduleConfig(slug);
  if (position) return buildPageMetadata({
    title: `${position.label} Fantasy Football Strength of Schedule (2026)`,
    description: `Rank every NFL team's remaining ${position.singular} schedule using Standard, Half PPR, and PPR fantasy points allowed by upcoming opponents.`,
    path: `/fantasy-football-strength-of-schedule/${slug}`,
  });
  const week = getScheduleRatingWeek(slug);
  if (!week) return {};
  return buildPageMetadata({
    title: `Week ${week} Fantasy Football Strength of Schedule & Matchup Ratings`,
    description: `Week ${week} fantasy football strength-of-schedule rankings for all 32 NFL teams, using opponent scoring defense, game site, and rest.`,
    path: `/fantasy-football-strength-of-schedule/${slug}`,
  });
}

export default async function WeeklyScheduleRatingPage({ params }: PageProps) {
  const { slug } = await params;
  const position = getPositionScheduleConfig(slug);
  if (position) return <PositionSchedulePage config={position} />;
  const week = getScheduleRatingWeek(slug);
  if (!week) notFound();
  const [ratings, market] = await Promise.all([
    Promise.resolve(getWeeklyScheduleRatings(week)),
    getMarket({ format: "redraft", numQbs: 1, receptionPoints: 0 }),
  ]);
  if (ratings.length !== 32) notFound();
  const warmest = ratings[0];
  const coldest = ratings[ratings.length - 1];
  const pageUrl = `${SITE_URL}/fantasy-football-strength-of-schedule/${slug}`;

  return (
    <>
      <AnalyticsPageView eventName="schedule_rating_experiment_viewed" properties={{ experiment: "weekly_schedule_ratings", experiment_cohort: "2026_regular_season", week, team_count: ratings.length, release_id: teamRelease.releaseId }} />
      <JsonLd data={buildSchema(pageUrl, week, ratings)} />
      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-strength-of-schedule">Strength of schedule</Link><span>/</span><span className="text-[#171c19]">Week {week}</span></nav>
      <section className="border-y border-[#171c19] bg-[#8bcfff]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">Week {week} // all 32 teams</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Week {week} fantasy football <span className="text-[#a23616]">schedule ratings.</span></h1>
          <p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-bold leading-8">{warmest.team.name} draws the warmest team environment at {warmest.game.environmentScore}/100 against {warmest.opponent.name}. {coldest.team.name} sits at the other end at {coldest.game.environmentScore}/100.</p>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#414742]">This ranking answers which teams face the warmer overall scoring setup. It does not rank individual starters or predict their fantasy points.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Team</th><th className="p-4">Opponent</th><th className="p-4">When</th><th className="p-4">Rating</th><th className="p-4">Top market assets</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">
              {ratings.map((row) => {
                const assets = getTeamAssets(row.team, market.assets).slice(0, 2);
                return (
                  <tr key={row.team.abbr}>
                    <td className="p-4 font-mono font-black">#{row.rank}</td>
                    <td className="p-4"><Link href={`/teams/${row.team.slug}`} className="flex items-center gap-3 font-black hover:underline"><TeamLogo team={row.team.abbr} size={34} decorative />{row.team.name}</Link></td>
                    <td className="p-4"><Link href={`/teams/${row.opponent.slug}`} className="font-bold hover:underline">{row.game.site === "away" ? "@ " : "vs. "}{row.opponent.name}</Link><span className="mt-1 block text-xs text-[#69706c]">No. {row.game.opponentBaseline.scoringDefenseRank ?? "—"} scoring defense · {row.game.opponentBaseline.pointsAllowedPerGame?.toFixed(1) ?? "—"} allowed/game</span></td>
                    <td className="p-4">{formatGameDate(row.game.date)}<span className="mt-1 block text-xs text-[#69706c]">{formatGameTime(row.game.time)}</span></td>
                    <td className="p-4"><span className={`${environmentClass(row.game.environmentLabel)} inline-flex min-w-24 items-center justify-between gap-3 border border-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase`}><span>{row.game.environmentLabel}</span><span>{row.game.environmentScore}</span></span></td>
                    <td className="p-4 text-xs">{assets.map((asset, index) => <span key={asset.slug}>{index ? " · " : ""}{hasPlayerPage(asset.slug) ? <Link href={`/players/${asset.slug}`} className="font-bold hover:underline">{asset.name}</Link> : asset.name}</span>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Model boundary</span><h2 className="section-title mt-6">A schedule grade, not a projection.</h2></div><div className="text-sm leading-7"><p>The opponent&apos;s {teamRelease.baselineSeason} points allowed drives most of the rating. Site and rest add smaller adjustments.</p><p className="mt-4">Position-specific fantasy defense, current injuries, expected usage, weather, and betting markets are not inputs. Check those before making a lineup decision.</p></div></div></section>
      <section className="page-wrap flex flex-wrap items-center justify-between gap-5 py-12"><Link href={`/fantasy-football-matchups/week-${week}`} className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-white">Open every Week {week} matchup →</Link><Link href="/fantasy-football-strength-of-schedule" className="border border-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em]">All schedule ratings →</Link></section>
      <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Schedule and scoring-defense context: nflverse release <span className="font-mono">{teamRelease.releaseId}</span>. Model <span className="font-mono">{teamRelease.modelVersion}</span>. Player market <span className="font-mono">{market.meta.releaseId}</span>.</aside>
    </>
  );
}

function buildSchema(pageUrl: string, week: number, ratings: ReturnType<typeof getWeeklyScheduleRatings>) {
  return [
    { "@context": "https://schema.org", "@type": "Dataset", name: `Week ${week} fantasy football schedule ratings`, url: pageUrl, dateModified: teamRelease.capturedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["matchup environment score", "opponent points allowed per game", "scoring defense rank", "site", "rest differential"], measurementTechnique: teamRelease.modelVersion },
    { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: ratings.length, itemListElement: ratings.map((row) => ({ "@type": "ListItem", position: row.rank, name: `${row.team.name} vs. ${row.opponent.name}: ${row.game.environmentScore}` })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Strength of schedule", item: `${SITE_URL}/fantasy-football-strength-of-schedule` }, { "@type": "ListItem", position: 3, name: `Week ${week}`, item: pageUrl }] },
  ];
}
