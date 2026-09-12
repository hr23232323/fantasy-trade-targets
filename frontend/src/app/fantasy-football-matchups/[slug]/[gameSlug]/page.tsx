import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../../components/AnalyticsPageView";
import JsonLd from "../../../components/JsonLd";
import TeamLogo from "../../../components/TeamLogo";
import { buildPageMetadata } from "../../../lib/metadata";
import { getMarket } from "../../../lib/market";
import { availabilityLabel } from "../../../lib/nflverse";
import { hasPlayerPage } from "../../../lib/player-pages";
import {
  environmentClass,
  formatGameDate,
  formatGameTime,
  getTeamAssets,
  readableSurface,
} from "../../../lib/team-data";
import {
  getMatchupExperimentGame,
  matchupExperimentGames,
  matchupIsComplete,
  weeklyMatchupRelease,
  type WeeklyMatchup,
} from "../../../lib/weekly-matchups";
import type { MarketAsset } from "../../../types/MarketAsset";

const SITE_URL = "https://fantasytradetarget.com";

type PageProps = { params: Promise<{ slug: string; gameSlug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return matchupExperimentGames.map(({ weekSlug, gameSlug }) => ({
    slug: weekSlug,
    gameSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, gameSlug } = await params;
  const matchup = getMatchupExperimentGame(slug, gameSlug);
  if (!matchup) return {};
  return buildPageMetadata({
    title: `${matchup.away.nickname} vs. ${matchup.home.nickname} Fantasy Football Matchup — Week ${matchup.week}`,
    description: `${matchup.away.name} vs. ${matchup.home.name} Week ${matchup.week} fantasy matchup with current player values, team scoring-environment ratings, venue, surface, and rest context.`,
    path: `/fantasy-football-matchups/${slug}/${gameSlug}`,
  });
}

export default async function MatchupExperimentPage({ params }: PageProps) {
  const { slug, gameSlug } = await params;
  const matchup = getMatchupExperimentGame(slug, gameSlug);
  if (!matchup) notFound();

  const market = await getMarket({
    format: "redraft",
    numQbs: 1,
    receptionPoints: 0,
  });
  const awayAssets = getTeamAssets(matchup.away, market.assets).slice(0, 6);
  const homeAssets = getTeamAssets(matchup.home, market.assets).slice(0, 6);
  const pageUrl = `${SITE_URL}/fantasy-football-matchups/${slug}/${gameSlug}`;
  const higherSide = matchup.awayView.environmentScore === matchup.homeView.environmentScore
    ? null
    : matchup.awayView.environmentScore > matchup.homeView.environmentScore
      ? matchup.away
      : matchup.home;
  const shortAnswer = higherSide
    ? `${higherSide.name} has the warmer team scoring environment in this matchup. ${matchup.away.name} grades ${matchup.awayView.environmentScore}/100 and ${matchup.home.name} grades ${matchup.homeView.environmentScore}/100.`
    : `Both teams grade ${matchup.awayView.environmentScore}/100 on the current team scoring-environment scale.`;

  return (
    <>
      <AnalyticsPageView
        eventName="game_matchup_experiment_viewed"
        properties={{
          experiment: "week_1_game_matchups",
          experiment_cohort: "2026_week_1",
          week: matchup.week,
          game_id: matchup.gameId,
          away_team: matchup.away.abbr,
          home_team: matchup.home.abbr,
          release_id: market.meta.releaseId,
        }}
      />
      <JsonLd data={buildSchema(pageUrl, matchup)} />

      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/fantasy-football-matchups">Weekly matchups</Link><span aria-hidden="true">/</span>
        <Link href={`/fantasy-football-matchups/${slug}`}>Week {matchup.week}</Link><span aria-hidden="true">/</span>
        <span className="text-[#171c19]">{matchup.away.nickname} vs. {matchup.home.nickname}</span>
      </nav>

      <section className="border-y border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">Week {matchup.week} matchup file // game context</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">
            {matchup.away.nickname} vs. <span className="text-[#8bcfff]">{matchup.home.nickname}.</span>
          </h1>
          <p className="mt-8 max-w-4xl border-l-4 border-[#dfff4f] pl-5 text-lg font-bold leading-8">{shortAnswer}</p>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65">
            The score combines the opponent&apos;s prior-season NFL scoring defense with site and rest. Use it as game context beside current redraft values—not as a player projection.
          </p>
        </div>
      </section>

      <section className="page-wrap py-12">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">
          <TeamPanel team="away" matchup={matchup} assets={awayAssets} />
          <TeamPanel team="home" matchup={matchup} assets={homeAssets} />
        </div>
      </section>

      <section className="page-wrap py-10">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Kickoff" value={`${matchup.weekday}, ${formatGameDate(matchup.date)}`} detail={formatGameTime(matchup.time)} />
          <Fact label="Venue" value={matchup.stadium ?? "TBD"} detail={matchup.awayView.site === "neutral" ? "Neutral site" : `${matchup.home.name} home game`} />
          <Fact label="Field" value={readableSurface(matchup.surface) ?? "TBD"} detail={gameConditions(matchup.awayView)} />
          <Fact label="Status" value={matchupIsComplete(matchup) ? "Final" : "Scheduled"} detail={matchupIsComplete(matchup) ? `${matchup.awayView.teamScore}–${matchup.homeView.teamScore}` : `Week ${matchup.week}`} />
        </div>
      </section>

      <section className="border-y border-[#171c19] bg-[#8bcfff]">
        <div className="page-wrap grid gap-8 py-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div><span className="eyebrow bg-white">How to use it</span><h2 className="section-title mt-6">Context first. Lineup call second.</h2></div>
          <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2">
            <p className="bg-[#f3f0e7] p-5 text-sm leading-7"><strong className="block">What it answers</strong>Which side enters the warmer team-level scoring environment, where the game is played, and which players hold current redraft value.</p>
            <p className="bg-[#f3f0e7] p-5 text-sm leading-7"><strong className="block">What it does not</strong>No projected points, injury assumptions, depth-chart guesses, betting lines, or automatic start/sit verdicts.</p>
          </div>
        </div>
      </section>

      <section className="page-wrap flex flex-wrap items-center justify-between gap-5 py-12">
        <div><span className="eyebrow">Next read</span><h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Rank the full Week {matchup.week} slate.</h2></div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/fantasy-football-strength-of-schedule/week-${matchup.week}`} className="border border-[#171c19] bg-[#dfff4f] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] shadow-[4px_4px_0_#171c19]">Schedule ratings →</Link>
          <Link href="/fantasy-football-trade-analyzer" className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-white">Open analyzer →</Link>
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">
        Schedule context: nflverse release <span className="font-mono">{weeklyMatchupRelease.releaseId}</span>. Player market: <span className="font-mono">{market.meta.releaseId}</span>. This page is not an injury report, projection, start/sit recommendation, or betting pick.
      </aside>
    </>
  );
}

function TeamPanel({ team, matchup, assets }: { team: "away" | "home"; matchup: WeeklyMatchup; assets: MarketAsset[] }) {
  const profile = matchup[team];
  const game = team === "away" ? matchup.awayView : matchup.homeView;
  return (
    <article className="bg-[#f3f0e7] p-6 sm:p-8">
      <div className="flex items-center gap-4 border-b border-[#bcb9ae] pb-5">
        <TeamLogo team={profile.abbr} size={64} decorative />
        <div><span className="mono-label text-[#69706c]">{team}</span><h2 className="mt-2 text-3xl font-black tracking-[-0.05em]"><Link href={`/teams/${profile.slug}`} className="hover:underline">{profile.name}</Link></h2></div>
        <span className={`${environmentClass(game.environmentLabel)} ml-auto border border-[#171c19] px-3 py-2 text-center font-mono text-[9px] font-black uppercase`}>{game.environmentLabel}<strong className="block text-2xl">{game.environmentScore}</strong></span>
      </div>
      <p className="mt-5 text-sm leading-7 text-[#59605c]">The opponent allowed {game.opponentBaseline.pointsAllowedPerGame?.toFixed(1) ?? "—"} NFL points per game in {game.opponentBaseline.season}, ranked No. {game.opponentBaseline.scoringDefenseRank ?? "—"} in scoring defense.</p>
      <h3 className="mt-7 mono-label">Current redraft market</h3>
      <div className="mt-3 divide-y divide-[#c8c4b9] border-y border-[#c8c4b9]">
        {assets.map((asset) => (
          <div key={asset.slug} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span>{hasPlayerPage(asset.slug) ? <Link href={`/players/${asset.slug}`} className="font-bold hover:underline">{asset.name} <span className="font-normal text-[#69706c]">{asset.position}</span></Link> : <strong>{asset.name} <span className="font-normal text-[#69706c]">{asset.position}</span></strong>}<small className="mt-1 block font-mono text-[9px] font-bold uppercase text-[#69706c]">{availabilityLabel(asset.slug)}</small></span>
            <span className="font-mono font-black">{Math.round(asset.value)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function Fact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <dl className="bg-[#f3f0e7] p-5"><dt className="mono-label text-[#69706c]">{label}</dt><dd className="mt-4 text-xl font-black tracking-[-0.035em]">{value}</dd><dd className="mt-2 text-xs text-[#69706c]">{detail}</dd></dl>;
}

function gameConditions(game: WeeklyMatchup["awayView"]) {
  const conditions = [
    readableSurface(game.roof),
    game.temperatureF === null ? null : `${Math.round(game.temperatureF)}°F`,
    game.windMph === null ? null : `${Math.round(game.windMph)} mph wind`,
  ].filter(Boolean);
  return conditions.length > 0 ? conditions.join(" · ") : "Conditions TBD";
}

function buildSchema(pageUrl: string, matchup: WeeklyMatchup) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "@id": `${pageUrl}#event`,
      name: `${matchup.away.name} at ${matchup.home.name}`,
      url: pageUrl,
      startDate: `${matchup.date}T${matchup.time ?? "00:00"}:00-04:00`,
      location: matchup.stadium ? { "@type": "Place", name: matchup.stadium } : undefined,
      competitor: [{ "@type": "SportsTeam", name: matchup.away.name }, { "@type": "SportsTeam", name: matchup.home.name }],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Weekly matchups", item: `${SITE_URL}/fantasy-football-matchups` },
        { "@type": "ListItem", position: 3, name: `Week ${matchup.week}`, item: `${SITE_URL}/fantasy-football-matchups/week-${matchup.week}` },
        { "@type": "ListItem", position: 4, name: `${matchup.away.nickname} vs. ${matchup.home.nickname}`, item: pageUrl },
      ],
    },
  ];
}
