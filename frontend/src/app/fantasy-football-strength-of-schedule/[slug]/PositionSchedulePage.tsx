import Link from "next/link";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import TeamLogo from "../../components/TeamLogo";
import { getPositionScheduleRatings, type PositionScheduleConfig } from "../../lib/schedule-ratings";
import { formatGameDate, teamRelease } from "../../lib/team-data";
import { nflversePlayerRelease } from "../../lib/nflverse";

const SITE_URL = "https://fantasytradetarget.com";

export default function PositionSchedulePage({ config }: { config: PositionScheduleConfig }) {
  const ratings = getPositionScheduleRatings(config);
  const leader = ratings[0];
  const path = `/fantasy-football-strength-of-schedule/${config.slug}`;
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(nflversePlayerRelease.capturedAt));

  return (
    <>
      <AnalyticsPageView eventName="position_schedule_viewed" properties={{ position: config.position, team_count: ratings.length, season: teamRelease.season }} />
      <JsonLd data={buildSchema(path, config, ratings)} />
      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-strength-of-schedule">Strength of schedule</Link><span>/</span><span className="text-[#171c19]">{config.label}s</span></nav>
      <section className="border-y border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">{teamRelease.season} remaining schedule · updated {updated}</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{config.label} fantasy football <span className="text-[#a23616]">strength of schedule.</span></h1>
          {leader && <p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-bold leading-8">{leader.team.name} has the most favorable next four games for {config.singular}s, based on fantasy points allowed by each opponent.</p>}
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#414742]">Use the next-four ranking for near-term lineup planning and the remaining-season averages for the longer view. Higher points allowed means a more favorable schedule.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Team</th><th className="p-4">Next four</th><th className="p-4">Next 4 PPR</th><th className="p-4">ROS standard</th><th className="p-4">ROS half PPR</th><th className="p-4">ROS PPR</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">
              {ratings.map((row) => (
                <tr key={row.team.abbr}>
                  <td className="p-4 font-mono font-black">#{row.rank}</td>
                  <td className="p-4"><Link href={`/teams/${row.team.slug}`} className="flex items-center gap-3 font-black hover:underline"><TeamLogo team={row.team.abbr} size={34} decorative />{row.team.name}</Link></td>
                  <td className="p-4"><div className="flex flex-wrap gap-2">{row.nextFour.map(({ opponent, game }) => <span key={game.gameId} title={formatGameDate(game.date)} className="border border-[#171c19] bg-[#f3f0e7] px-2 py-1 font-mono text-[10px] font-bold">{game.site === "away" ? "@" : "vs"} {opponent.abbr}</span>)}</div></td>
                  <td className="p-4 font-mono text-lg font-black">{row.nextFourAverage.toFixed(1)}</td>
                  <td className="p-4 font-mono">{row.remainingAverage.standard.toFixed(1)}</td>
                  <td className="p-4 font-mono">{row.remainingAverage.halfPpr.toFixed(1)}</td>
                  <td className="p-4 font-mono">{row.remainingAverage.ppr.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-6 text-[#69706c]">Fantasy points allowed are per-game averages from the {nflversePlayerRelease.positionDefense.season} regular season. Remaining-schedule averages use each team&apos;s unplayed {teamRelease.season} opponents.</p>
      </section>
      <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">How to use it</span><h2 className="section-title mt-6">Schedule context, then player context.</h2></div><div className="text-sm leading-7"><p>A favorable defense can raise a player&apos;s opportunity, but role, health, and team performance still matter more than a schedule rank alone.</p><p className="mt-4">Pair this table with current usage and availability before making a lineup or trade decision.</p></div></div></section>
      <section className="page-wrap flex flex-wrap gap-3 py-12">{["quarterbacks", "running-backs", "wide-receivers", "tight-ends"].filter((slug) => slug !== config.slug).map((slug) => <Link key={slug} href={`/fantasy-football-strength-of-schedule/${slug}`} className="border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] hover:bg-[#dfff4f]">{slug.replace("-", " ")} →</Link>)}</section>
    </>
  );
}

function buildSchema(path: string, config: PositionScheduleConfig, ratings: ReturnType<typeof getPositionScheduleRatings>) {
  const url = `${SITE_URL}${path}`;
  return [
    { "@context": "https://schema.org", "@type": "Dataset", name: `${config.label} fantasy football strength of schedule`, url, dateModified: nflversePlayerRelease.capturedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["Standard fantasy points allowed", "Half PPR fantasy points allowed", "PPR fantasy points allowed"] },
    { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: ratings.length, itemListElement: ratings.map((row) => ({ "@type": "ListItem", position: row.rank, name: `${row.team.name}: ${row.nextFourAverage.toFixed(1)} PPR points allowed by next four opponents` })) },
  ];
}
