import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import TeamLogo from "../../components/TeamLogo";
import { buildPageMetadata } from "../../lib/metadata";
import { getMarket } from "../../lib/market";
import { hasPlayerPage } from "../../lib/player-pages";
import { getWeeklyScheduleRatings } from "../../lib/schedule-ratings";
import {
  environmentClass,
  formatGameDate,
  formatGameTime,
  getTeamAssets,
  readableSurface,
} from "../../lib/team-data";
import {
  getWeeklyMatchups,
  matchupExperimentWeek,
  matchupGameSlug,
  matchupIsComplete,
  weekFromSlug,
  weeklyMatchupRelease,
  weeklyMatchupSlugs,
} from "../../lib/weekly-matchups";
import type { MarketAsset } from "../../types/MarketAsset";

const SITE_URL = "https://fantasytradetarget.com";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return weeklyMatchupSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const week = weekFromSlug(slug);
  if (!week) return {};
  const ratings = getWeeklyScheduleRatings(week);
  const best = ratings[0];
  const toughest = ratings.at(-1);
  return buildPageMetadata({
    title: `Week ${week} Fantasy Football Matchups: Best & Worst Spots (2026)`,
    description: `${best?.team.name ?? "See which team"} has the best Week ${week} fantasy matchup and ${toughest?.team.name ?? "which team"} has the toughest. Rank every game with current player values.`,
    path: `/fantasy-football-matchups/${slug}`,
  });
}

export default async function WeeklyMatchupPage({ params }: PageProps) {
  const { slug } = await params;
  const week = weekFromSlug(slug);
  if (!week) notFound();

  const [market, matchups] = await Promise.all([
    getMarket({ format: "redraft", numQbs: 1, receptionPoints: 0 }),
    Promise.resolve(getWeeklyMatchups(week)),
  ]);
  if (!matchups.length) notFound();

  const firstDate = matchups[0].date;
  const lastDate = matchups[matchups.length - 1].date;
  const complete = matchups.filter(matchupIsComplete).length;
  const ratings = getWeeklyScheduleRatings(week);
  const bestSpots = ratings.slice(0, 3);
  const toughest = ratings.at(-1);
  const pageUrl = `${SITE_URL}/fantasy-football-matchups/${slug}`;

  return (
    <>
      <AnalyticsPageView
        eventName="weekly_matchups_viewed"
        properties={{ season: weeklyMatchupRelease.season, week, game_count: matchups.length, completed_games: complete, release_id: market.meta.releaseId }}
      />
      <JsonLd data={buildSchema(pageUrl, week, matchups)} />

      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#171c19] hover:underline">Home</Link><span aria-hidden="true">/</span>
        <Link href="/fantasy-football-matchups" className="hover:text-[#171c19] hover:underline">Weekly matchups</Link><span aria-hidden="true">/</span>
        <span className="text-[#171c19]">Week {week}</span>
      </nav>

      <section className="border-y border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap grid gap-8 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <span className="eyebrow bg-white">2026 fantasy football // weekly slate</span>
            <h1 className="mt-7 max-w-5xl text-[clamp(3.2rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">
              Week {week} fantasy football <span className="text-[#a23616]">matchups &amp; best spots.</span>
            </h1>
          </div>
          <div className="border-l border-[#171c19] pl-5">
            <p className="text-base font-medium leading-7 text-[#414742]">{bestSpots[0]?.team.name ?? "The top team"} draws the strongest overall scoring environment this week. {toughest ? `${toughest.team.name} has the lowest-rated spot.` : ""} Every game below includes current top redraft assets and opponent scoring context.</p>
            <p className="mt-5 font-mono text-[10px] font-black uppercase tracking-[0.08em]">{formatRange(firstDate, lastDate)} · {matchups.length} games</p>
          </div>
        </div>
      </section>

      <section className="page-wrap py-12">
        <span className="eyebrow bg-[#ffb29a]">Best overall environments</span>
        <h2 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.055em]">The three warmest Week {week} team matchups.</h2>
        <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
          {bestSpots.map((row) => (
            <article key={row.team.abbr} className="bg-white/70 p-6">
              <div className="flex items-center justify-between gap-4"><TeamLogo team={row.team.abbr} size={46} decorative /><span className={`${environmentClass(row.game.environmentLabel)} border border-[#171c19] px-3 py-2 font-mono text-xl font-black`}>{row.game.environmentScore}</span></div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">{row.team.name}</h2>
              <p className="mt-2 text-sm text-[#69706c]">{row.game.site === "away" ? "at" : "vs."} {row.opponent.name} · opponent scoring defense No. {row.game.opponentBaseline.scoringDefenseRank ?? "—"}</p>
              <Link href={`/teams/${row.team.slug}`} className="mt-5 inline-block font-mono text-[10px] font-black uppercase tracking-[0.08em] underline">Open team outlook →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="page-wrap py-14">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
          {matchups.map((matchup) => {
            const awayAssets = getTeamAssets(matchup.away, market.assets).slice(0, 3);
            const homeAssets = getTeamAssets(matchup.home, market.assets).slice(0, 3);
            return (
              <article key={matchup.gameId} className="bg-[#f3f0e7] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-[#bcb9ae] pb-4">
                  <span className="mono-label text-[#69706c]">{matchup.weekday} · {formatGameDate(matchup.date)} · {formatGameTime(matchup.time)}</span>
                  {matchupIsComplete(matchup) ? <span className="mono-label bg-[#e4dfd2] px-2 py-1">Final</span> : null}
                </div>
                <div className="mt-5 grid gap-4">
                  <TeamRow team={matchup.away} game={matchup.awayView} assets={awayAssets} score={matchup.awayView.teamScore} />
                  <TeamRow team={matchup.home} game={matchup.homeView} assets={homeAssets} score={matchup.homeView.teamScore} />
                </div>
                <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-[#bcb9ae] pt-4 text-xs leading-5">
                  <dt className="text-[#69706c]">Venue</dt><dd className="font-medium">{matchup.stadium ?? "TBD"}</dd>
                  <dt className="text-[#69706c]">Surface</dt><dd className="font-medium">{readableSurface(matchup.surface) ?? "TBD"}{matchup.roof ? ` · ${readableSurface(matchup.roof)}` : ""}</dd>
                </dl>
                {week === matchupExperimentWeek ? (
                  <Link
                    href={`/fantasy-football-matchups/${slug}/${matchupGameSlug(matchup)}`}
                    className="mt-5 block border border-[#171c19] bg-white px-4 py-3 text-center font-mono text-[10px] font-black uppercase tracking-[0.08em] hover:bg-[#dfff4f]"
                  >
                    Open this matchup →
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#171c19] bg-[#8bcfff]">
        <div className="page-wrap grid gap-8 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div><span className="eyebrow bg-white">What this can answer</span><h2 className="section-title mt-6">Read the slate before pricing the move.</h2></div>
          <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2">
            <p className="bg-[#f3f0e7] p-5 text-sm leading-7"><strong className="block text-[#171c19]">Opponent context</strong>Each team gets its own environment score because home field, rest, and the opposing scoring defense differ.</p>
            <p className="bg-[#f3f0e7] p-5 text-sm leading-7"><strong className="block text-[#171c19]">Current market</strong>The linked players use the current redraft release, so the slate connects schedule context to the players managers actually value.</p>
            <p className="bg-[#f3f0e7] p-5 text-sm leading-7"><strong className="block text-[#171c19]">No fake precision</strong>The page does not turn last season’s team scoring into a player projection or claim to know workload.</p>
            <p className="bg-[#f3f0e7] p-5 text-sm leading-7"><strong className="block text-[#171c19]">Next decision</strong>Open a player file for market context or use the trade analyzer when the matchup creates a real roster question.</p>
          </div>
        </div>
      </section>

      <section className="page-wrap flex flex-wrap items-center justify-between gap-5 py-12">
        <div><span className="eyebrow">Keep moving</span><h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Check another week or price a trade.</h2></div>
        <div className="flex flex-wrap gap-3"><Link href="/fantasy-football-matchups" className="border border-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] hover:bg-white">All weeks →</Link><Link href="/fantasy-football-trade-analyzer" className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#ff6b3d]">Open trade analyzer →</Link></div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Schedule and team context: nflverse, release <span className="font-mono">{weeklyMatchupRelease.releaseId}</span>. Player market: release <span className="font-mono">{market.meta.releaseId}</span>. Environment scores use {weeklyMatchupRelease.baselineSeason} team scoring defense, site, and rest. They are not projections, injury reports, news, or betting advice.</aside>
    </>
  );
}

function TeamRow({ team, game, assets, score }: { team: ReturnType<typeof getWeeklyMatchups>[number]["away"]; game: ReturnType<typeof getWeeklyMatchups>[number]["awayView"]; assets: MarketAsset[]; score: number | null }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      <TeamLogo team={team.abbr} size={46} decorative />
      <div className="min-w-0">
        <span className="mono-label block text-[#69706c]">{game.site === "away" ? "Away" : "Home"}</span>
        <Link href={`/teams/${team.slug}`} className="mt-1 block text-xl font-black tracking-[-0.04em] underline decoration-[#ff6b3d] decoration-2 underline-offset-4">{team.name}</Link>
        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#69706c]">
          {assets.length ? assets.map((asset) => hasPlayerPage(asset.slug) ? (
            <Link key={asset.slug} href={`/players/${asset.slug}`} className="font-medium hover:text-[#171c19] hover:underline">{asset.name} <span className="font-mono">{Math.round(asset.value)}</span></Link>
          ) : <span key={asset.slug}>{asset.name} <span className="font-mono">{Math.round(asset.value)}</span></span>) : "Market updating"}
        </p>
      </div>
      {score === null ? <span className={`${environmentClass(game.environmentLabel)} border border-[#171c19] px-2 py-2 text-center font-mono text-[9px] font-black uppercase`}>{game.environmentLabel}<span className="block text-sm">{game.environmentScore}</span></span> : <strong className="font-mono text-2xl">{score}</strong>}
    </div>
  );
}

function formatRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${start}T12:00:00Z`))}–${formatter.format(new Date(`${end}T12:00:00Z`))}`;
}

function buildSchema(pageUrl: string, week: number, matchups: ReturnType<typeof getWeeklyMatchups>) {
  return [
    { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${pageUrl}#page`, url: pageUrl, name: `Week ${week} fantasy football matchups`, dateModified: weeklyMatchupRelease.capturedAt, mainEntity: { "@type": "ItemList", numberOfItems: matchups.length, itemListElement: matchups.map((matchup, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "SportsEvent", name: `${matchup.away.name} at ${matchup.home.name}`, startDate: `${matchup.date}T${matchup.time ?? "00:00"}:00-04:00`, location: matchup.stadium ? { "@type": "Place", name: matchup.stadium } : undefined, competitor: [{ "@type": "SportsTeam", name: matchup.away.name }, { "@type": "SportsTeam", name: matchup.home.name }] } })) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "Weekly matchups", item: `${SITE_URL}/fantasy-football-matchups` }, { "@type": "ListItem", position: 3, name: `Week ${week}`, item: pageUrl }] },
  ];
}
