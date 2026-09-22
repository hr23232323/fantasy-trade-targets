import Link from "next/link";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import TeamLogo from "../../components/TeamLogo";
import { getMarket } from "../../lib/market";
import { hasPlayerPage } from "../../lib/player-pages";
import {
  getPositionWeekScheduleRatings,
  type PositionWeekScheduleConfig,
} from "../../lib/schedule-ratings";
import { formatGameDate, formatGameTime, getTeamAssets, teamRelease } from "../../lib/team-data";
import { nflversePlayerRelease } from "../../lib/nflverse";

const SITE_URL = "https://fantasytradetarget.com";

export default async function PositionWeekSchedulePage({ config }: { config: PositionWeekScheduleConfig }) {
  const [ratings, market] = await Promise.all([
    Promise.resolve(getPositionWeekScheduleRatings(config)),
    getMarket({ format: "redraft", numQbs: 1, receptionPoints: 1 }),
  ]);
  const leader = ratings[0];
  const path = `/fantasy-football-strength-of-schedule/${config.slug}`;

  return (
    <>
      <AnalyticsPageView eventName="position_week_schedule_viewed" properties={{ position: config.position, week: config.week, team_count: ratings.length, season: teamRelease.season }} />
      <JsonLd data={buildSchema(path, config, ratings)} />
      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-strength-of-schedule">Strength of schedule</Link><span>/</span><span className="text-[#171c19]">Week {config.week} {config.label}s</span></nav>
      <section className="border-y border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">{teamRelease.season} · Week {config.week} · all 32 teams</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Week {config.week} fantasy football <span className="text-[#a23616]">{config.label.toLowerCase()} matchups.</span></h1>
          {leader ? <p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-bold leading-8">{leader.team.name} has the most favorable Week {config.week} matchup for {config.singular}s, facing a defense that allowed {leader.pointsAllowed.ppr.toFixed(1)} PPR points per game to the position last season.</p> : null}
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#414742]">The table ranks every team by the upcoming opponent&apos;s fantasy points allowed to {config.singular}s. Use it with current workload and availability, not as a standalone projection.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Team</th><th className="p-4">Week {config.week} opponent</th><th className="p-4">Standard allowed</th><th className="p-4">Half PPR allowed</th><th className="p-4">PPR allowed</th><th className="p-4">Current assets</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">
              {ratings.map((row) => {
                const assets = getTeamAssets(row.team, market.assets)
                  .filter((asset) => asset.position === config.position)
                  .slice(0, 3);
                return (
                  <tr key={row.team.abbr}>
                    <td className="p-4 font-mono font-black">#{row.rank}</td>
                    <td className="p-4"><Link href={`/teams/${row.team.slug}`} className="flex items-center gap-3 font-black hover:underline"><TeamLogo team={row.team.abbr} size={34} decorative />{row.team.name}</Link></td>
                    <td className="p-4"><Link href={`/teams/${row.opponent.slug}`} className="font-bold hover:underline">{row.game.site === "away" ? "@ " : "vs. "}{row.opponent.name}</Link><span className="mt-1 block text-xs text-[#69706c]">{formatGameDate(row.game.date)} · {formatGameTime(row.game.time)}</span></td>
                    <td className="p-4 font-mono">{row.pointsAllowed.standard.toFixed(1)}</td>
                    <td className="p-4 font-mono">{row.pointsAllowed.halfPpr.toFixed(1)}</td>
                    <td className="p-4 font-mono text-lg font-black">{row.pointsAllowed.ppr.toFixed(1)}</td>
                    <td className="p-4 text-xs">{assets.length ? assets.map((asset, index) => <span key={asset.slug}>{index ? " · " : ""}{hasPlayerPage(asset.slug) ? <Link href={`/players/${asset.slug}`} className="font-bold hover:underline">{asset.name}</Link> : asset.name}</span>) : "Market updating"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-6 text-[#69706c]">Position scoring uses {nflversePlayerRelease.positionDefense.season} per-game defense results. Schedule and venue use the current {teamRelease.season} release.</p>
      </section>
      <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">What the rank means</span><h2 className="section-title mt-6">A better matchup can help. Role still comes first.</h2></div><div className="text-sm leading-7"><p>The opponent rank describes what the defense allowed to the position. It does not assign touches or targets to an individual player.</p><p className="mt-4">Check the linked player files for recent usage and listed availability before making a lineup or trade decision.</p></div></div></section>
      <section className="page-wrap flex flex-wrap gap-3 py-12">{[3, 4].flatMap((week) => ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"].map((slug) => ({ week, slug }))).filter((item) => item.week !== config.week || item.slug !== config.slug.replace(`week-${config.week}-`, "")).map((item) => <Link key={`${item.week}-${item.slug}`} href={`/fantasy-football-strength-of-schedule/week-${item.week}-${item.slug}`} className="border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] hover:bg-[#dfff4f]">Week {item.week} {item.slug.replaceAll("-", " ")} →</Link>)}</section>
    </>
  );
}

function buildSchema(path: string, config: PositionWeekScheduleConfig, ratings: ReturnType<typeof getPositionWeekScheduleRatings>) {
  const url = `${SITE_URL}${path}`;
  return [
    { "@context": "https://schema.org", "@type": "Dataset", name: `Week ${config.week} fantasy football ${config.label.toLowerCase()} matchups`, url, dateModified: nflversePlayerRelease.capturedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["Standard fantasy points allowed", "Half PPR fantasy points allowed", "PPR fantasy points allowed"] },
    { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: ratings.length, itemListElement: ratings.map((row) => ({ "@type": "ListItem", position: row.rank, name: `${row.team.name} ${config.label}: ${row.pointsAllowed.ppr.toFixed(1)} PPR points allowed by ${row.opponent.name}` })) },
  ];
}
