import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "../../components/JsonLd";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import { TrackedAnchor, TrackedLink } from "../../components/TrackedLink";
import { getMarket } from "../../lib/market";
import { getPlayerPage } from "../../lib/player-pages";
import {
  averageEnvironment,
  environmentClass,
  environmentLabel,
  formatGameDate,
  formatGameTime,
  formatRecord,
  getRecentGames,
  getTeamAssets,
  getTeamByAbbr,
  getTeamBySlug,
  getUpcomingGames,
  readableSurface,
  teamRelease,
  teamSlugs,
  teams,
} from "../../lib/team-data";
import type { MarketAsset, Position } from "../../types/MarketAsset";
import type { TeamGame, TeamProfile } from "../../types/Team";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return teamSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) return {};
  const description = `${team.name} fantasy football outlook with current dynasty players, ${teamRelease.season} schedule, matchup difficulty, opponent context, venue, and rest signals.`;
  return {
    title: `${team.name} Fantasy Outlook, Schedule & Dynasty Players`,
    description,
    alternates: { canonical: `/teams/${team.slug}` },
    openGraph: {
      type: "website",
      url: `/teams/${team.slug}`,
      title: `${team.name} fantasy football outlook`,
      description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Fantasy Trade Target" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${team.name} fantasy football outlook`,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) notFound();

  const market = await getMarket({ format: "dynasty", numQbs: 2 });
  const assets = getTeamAssets(team, market.assets);
  const topAssets = assets.slice(0, 14);
  const topAsset = topAssets[0];
  const upcoming = getUpcomingGames(team);
  const recent = getRecentGames(team);
  const openingWindow = upcoming.slice(0, 4);
  const openingScore = averageEnvironment(openingWindow);
  const openingLabel = environmentLabel(openingScore);
  const linkedProfiles = assets.filter((asset) => getPlayerPage(asset.slug));
  const topHundred = assets.filter((asset) => (asset.rank ?? Infinity) <= 100).length;
  const positions = buildPositionGroups(assets);
  const primary = team.colors[0] ?? "#171c19";
  const secondary = team.colors[1] ?? "#dfff4f";
  const heroText = contrastText(primary);
  const divisionPeers = teams.filter(
    (candidate) => candidate.division === team.division && candidate.abbr !== team.abbr,
  );

  return (
    <>
      <JsonLd data={buildSchema(team, assets)} />
      <AnalyticsPageView
        eventName="team_research_viewed"
        properties={{
          team_slug: team.slug,
          team_abbr: team.abbr,
          division: team.division,
          top_asset_slug: topAsset?.slug ?? null,
          top_100_asset_count: topHundred,
          opening_environment: openingLabel,
          opening_environment_score: openingScore,
          upcoming_game_count: upcoming.length,
        }}
      />

      <nav className="page-wrap pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#171c19]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/teams" className="hover:text-[#171c19]">Teams</Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{team.name}</span>
      </nav>

      <section className="page-wrap grid gap-px py-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="border border-[#171c19] p-6 sm:p-10" style={{ backgroundColor: primary, color: heroText }}>
          <div className="flex flex-wrap gap-2">
            <span className="mono-label border border-current bg-black/10 px-3 py-2">Team market file // {teamRelease.season}</span>
            <span className="mono-label border border-current bg-white/10 px-3 py-2">{team.division}</span>
          </div>
          <h1 className="mt-8 text-[clamp(3.2rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">
            {team.name} fantasy outlook
          </h1>
          <p className="mt-8 max-w-3xl border-l-4 border-current pl-5 text-lg font-bold leading-8 sm:text-xl">
            {topAsset ? (
              <>
                {team.name}&apos; dynasty market is led by <strong>{topAsset.name}</strong> at <strong>{Math.round(topAsset.value)}</strong>, ranked <strong>No. {topAsset.rank ?? "—"} overall</strong>. The first four {teamRelease.season} matchups grade <strong>{openingLabel.toLowerCase()}</strong> at <strong>{openingScore ?? "—"}/100</strong> on the team environment scale.
              </>
            ) : (
              <>Current team market context is updating.</>
            )}
          </p>
          <p className="mt-6 max-w-2xl text-sm font-medium leading-7 opacity-80">
            {topHundred} current {topHundred === 1 ? "asset sits" : "assets sit"} inside the dynasty top 100. Matchup temperature connects last season&apos;s scoring defense with site and rest; it does not replace player-level usage or injury context.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#schedule" className="border border-current bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#f3f0e7]">See the schedule ↓</Link>
            <Link href="#players" className="border border-current bg-white/85 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#171c19]">Price the roster ↓</Link>
          </div>
        </div>

        <div className="grid min-h-[430px] place-items-center border border-[#171c19] p-10" style={{ backgroundColor: secondary }}>
          <div className="text-center">
            <Image src={team.logo.src} alt={team.logo.alt} width={300} height={300} className="mx-auto h-56 w-56 object-contain drop-shadow-[8px_8px_0_rgba(23,28,25,0.22)] sm:h-64 sm:w-64" priority />
            <p className="mt-8 font-mono text-[11px] font-black uppercase tracking-[0.1em] text-[#171c19]">
              {team.marketLocation.name} · {team.homeVenue ?? "Home venue"}
            </p>
          </div>
        </div>
      </section>

      <section className="page-wrap py-8" aria-label={`${teamRelease.baselineSeason} team context`}>
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label={`${teamRelease.baselineSeason} record`} value={formatRecord(team)} />
          <StatCard label="Points scored / game" value={team.baseline.pointsForPerGame.toFixed(1)} />
          <StatCard label="Points allowed / game" value={team.baseline.pointsAllowedPerGame.toFixed(1)} />
          <StatCard label="Scoring defense" value={`No. ${team.baseline.scoringDefenseRank}`} />
          <StatCard label="Opening window" value={`${openingLabel} · ${openingScore ?? "—"}`} accent={environmentClass(openingLabel)} />
        </div>
      </section>

      <section id="players" className="page-wrap scroll-mt-8 py-16">
        <div className="grid gap-6 border-t border-[#171c19] pt-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <span className="eyebrow">Dynasty roster market</span>
            <h2 className="section-title mt-6">What the roster is worth.</h2>
          </div>
          <p className="text-sm leading-7 text-[#69706c]">
            Current Superflex market prices for fantasy-relevant {team.nickname}. The four position blocks show where the roster&apos;s market weight is concentrated; player links open deeper research where available.
          </p>
        </div>

        <div className="mt-10 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
          {positions.map((group, index) => (
            <article key={group.position} className={["bg-[#dfff4f]", "bg-[#8bcfff]", "bg-[#ffb29a]", "bg-[#d7b6ff]"][index] + " p-5 sm:p-6"}>
              <span className="mono-label">{group.position} market</span>
              <p className="mt-8 text-3xl font-black tracking-[-0.045em]">{group.leader?.name ?? "Unranked"}</p>
              <p className="mt-2 font-mono text-sm font-black">{group.leader ? Math.round(group.leader.value) : "—"}</p>
              <p className="mt-5 text-[11px] leading-5 text-[#505853]">Top-three position value: <strong>{Math.round(group.topThreeValue)}</strong></p>
            </article>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white">
              <tr><th className="px-5 py-4">Overall</th><th className="px-5 py-4">Player</th><th className="px-5 py-4">Position</th><th className="px-5 py-4">Age</th><th className="px-5 py-4 text-right">Market score</th></tr>
            </thead>
            <tbody className="divide-y divide-[#bcb9ae]">
              {topAssets.map((asset) => (
                <tr key={asset.slug}>
                  <td className="px-5 py-4 font-mono text-xs text-[#69706c]">#{asset.rank ?? "—"}</td>
                  <td className="px-5 py-4 font-bold">
                    {getPlayerPage(asset.slug) ? (
                      <TrackedLink
                        href={`/players/${asset.slug}`}
                        className="underline decoration-[#ff6b3d] decoration-2 underline-offset-4 hover:bg-[#dfff4f]"
                        analyticsEvent="team_player_opened"
                        analyticsProperties={{
                          team_slug: team.slug,
                          player_slug: asset.slug,
                          source: "roster_table",
                          market_rank: asset.rank ?? null,
                        }}
                      >
                        {asset.name} →
                      </TrackedLink>
                    ) : asset.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{asset.position}{asset.posRank ?? "—"}</td>
                  <td className="px-5 py-4 text-[#69706c]">{asset.age ?? "—"}</td>
                  <td className="px-5 py-4 text-right font-mono text-lg font-black">{Math.round(asset.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {linkedProfiles.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mono-label mr-2 text-[#69706c]">Full player research</span>
            {linkedProfiles.map((asset) => (
              <TrackedLink
                key={asset.slug}
                href={`/players/${asset.slug}`}
                className="border border-[#171c19] bg-white/60 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.06em] hover:bg-[#dfff4f]"
                analyticsEvent="team_player_opened"
                analyticsProperties={{
                  team_slug: team.slug,
                  player_slug: asset.slug,
                  source: "profile_links",
                  market_rank: asset.rank ?? null,
                }}
              >
                {asset.name} →
              </TrackedLink>
            ))}
          </div>
        )}
      </section>

      <section id="schedule" className="page-wrap scroll-mt-8 py-16">
        <div className="grid gap-6 border-t border-[#171c19] pt-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <span className="eyebrow">{teamRelease.season} calendar // matchup temperature</span>
            <h2 className="section-title mt-6">Every game, with context.</h2>
          </div>
          <p className="text-sm leading-7 text-[#69706c]">
            A high score means the opponent allowed more NFL points last season, with small adjustments for home field and rest. It is a fast team-level read, not a positional matchup grade or weekly projection.
          </p>
        </div>

        {recent.length > 0 && (
          <div className="mt-10 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-3">
            {recent.map((game) => <RecentGame key={game.gameId} team={team} game={game} />)}
          </div>
        )}

        <div className="mt-10 overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white">
              <tr><th className="px-4 py-4">Week / date</th><th className="px-4 py-4">Opponent</th><th className="px-4 py-4">Site / venue</th><th className="px-4 py-4">Temperature</th><th className="px-4 py-4">Why it grades there</th></tr>
            </thead>
            <tbody className="divide-y divide-[#bcb9ae]">
              {upcoming.map((game) => {
                const opponent = getTeamByAbbr(game.opponentAbbr)!;
                return (
                  <tr key={game.gameId}>
                    <td className="px-4 py-4"><strong>Week {game.week}</strong><span className="mt-1 block text-xs text-[#69706c]">{game.weekday}, {formatGameDate(game.date)} · {formatGameTime(game.time)}</span></td>
                    <td className="px-4 py-4"><Link href={`/teams/${opponent.slug}`} className="font-bold underline decoration-[#ff6b3d] decoration-2 underline-offset-4">{game.site === "away" ? "@ " : "vs. "}{opponent.name}</Link>{game.divisionGame && <span className="ml-2 font-mono text-[8px] font-black uppercase text-[#69706c]">Division</span>}</td>
                    <td className="px-4 py-4"><span className="font-bold capitalize">{game.site}</span><span className="mt-1 block max-w-48 text-xs leading-5 text-[#69706c]">{game.stadium ?? "Venue TBD"}{game.roof ? ` · ${readableSurface(game.roof)}` : ""}</span></td>
                    <td className="px-4 py-4"><span className={`${environmentClass(game.environmentLabel)} inline-flex min-w-24 items-center justify-between gap-3 border border-[#171c19] px-3 py-2 font-mono text-[9px] font-black uppercase`}><span>{game.environmentLabel}</span><span>{game.environmentScore}</span></span></td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#59605c]">{matchupReason(game)}{game.restAdvantage !== null && Math.abs(game.restAdvantage) >= 2 ? ` ${restReason(game.restAdvantage)}` : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-12 lg:grid-cols-[1fr_1fr]">
        <div className="border border-[#171c19] bg-[#171c19] p-7 text-white sm:p-9">
          <span className="mono-label text-[#dfff4f]">Inside {team.division}</span>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Follow the division.</h2>
          <div className="mt-8 divide-y divide-white/15 border-y border-white/15">
            {divisionPeers.map((peer) => (
              <Link key={peer.abbr} href={`/teams/${peer.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-[#dfff4f]"><span className="font-bold">{peer.name}</span><span className="font-mono text-[10px] font-black">{formatRecord(peer)} →</span></Link>
            ))}
          </div>
        </div>
        <div className="border border-[#171c19] bg-[#8bcfff] p-7 sm:p-9">
          <span className="mono-label">Take the data with you</span>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">The full team file is downloadable.</h2>
          <p className="mt-4 text-sm leading-7 text-[#414742]">The JSON release includes all 17 games, model inputs, opponent baselines, current dynasty assets, data timestamps, and version identifiers.</p>
          <TrackedAnchor
            href={`/teams/${team.slug}/data.json`}
            download
            className="mt-8 inline-block border border-[#171c19] bg-white px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] shadow-[4px_4px_0_#171c19]"
            analyticsEvent="research_downloaded"
            analyticsProperties={{
              research_type: "team",
              team_slug: team.slug,
              file_format: "json",
              dataset: "team_file",
            }}
          >
            Download team JSON ↓
          </TrackedAnchor>
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        <strong className="text-[#171c19]">Data note:</strong> Market values update daily. The {teamRelease.season} schedule, team metadata, and {teamRelease.baselineSeason} scoring results come from nflverse under CC BY 4.0; matchup temperatures are calculated by Fantasy Trade Target model <span className="font-mono">{teamRelease.modelVersion}</span>. Team names and marks identify their respective clubs. See <Link href="/data-sources" className="underline underline-offset-2">sources, freshness, and limits</Link>.
      </aside>
    </>
  );
}

function StatCard({ label, value, accent = "bg-[#f3f0e7]" }: { label: string; value: string; accent?: string }) {
  return <div className={`${accent} p-5`}><dt className="mono-label text-[#59605c]">{label}</dt><dd className="mt-4 font-mono text-3xl font-black">{value}</dd></div>;
}

function RecentGame({ team, game }: { team: TeamProfile; game: TeamGame }) {
  const opponent = getTeamByAbbr(game.opponentAbbr)!;
  return <article className="bg-[#f3f0e7] p-5"><span className="mono-label text-[#69706c]">Week {game.week} · {formatGameDate(game.date)}</span><p className="mt-3 text-xl font-black">{game.result} {game.teamScore}-{game.opponentScore}</p><p className="mt-1 text-sm">{team.name} {game.site === "away" ? "at" : "vs."} {opponent.name}</p></article>;
}

function buildPositionGroups(assets: MarketAsset[]) {
  return (["QB", "RB", "WR", "TE"] as Position[]).map((position) => {
    const players = assets.filter((asset) => asset.position === position);
    return {
      position,
      leader: players[0],
      topThreeValue: players.slice(0, 3).reduce((total, asset) => total + asset.value, 0),
    };
  });
}

function matchupReason(game: TeamGame) {
  const baseline = game.opponentBaseline;
  if (baseline.pointsAllowedPerGame === null || baseline.scoringDefenseRank === null) return "Opponent baseline is not available.";
  return `Opponent allowed ${baseline.pointsAllowedPerGame.toFixed(1)} points per game in ${baseline.season} (No. ${baseline.scoringDefenseRank} scoring defense).`;
}

function restReason(advantage: number) {
  return advantage > 0 ? `${advantage}-day rest edge.` : `${Math.abs(advantage)}-day rest disadvantage.`;
}

function contrastText(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "white";
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 150 ? "#171c19" : "white";
}

function buildSchema(team: TeamProfile, assets: MarketAsset[]) {
  const url = `https://fantasytradetarget.com/teams/${team.slug}`;
  const topAsset = assets[0];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: `${team.name} fantasy football outlook`,
        description: `${team.name} dynasty market, ${teamRelease.season} schedule, players, and matchup environment context.`,
        dateModified: teamRelease.capturedAt,
        about: { "@id": `${url}#team` },
        mainEntity: { "@id": `${url}#dataset` },
        publisher: { "@id": "https://fantasytradetarget.com/#organization" },
      },
      {
        "@type": "SportsTeam",
        "@id": `${url}#team`,
        name: team.name,
        sport: "American football",
        logo: team.logo.src,
        location: { "@type": "Place", name: team.marketLocation.name },
        memberOf: { "@type": "SportsOrganization", name: team.division },
        athlete: topAsset ? { "@type": "Person", name: topAsset.name } : undefined,
      },
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: `${team.name} fantasy market and schedule context`,
        description: `Current dynasty assets and ${teamRelease.season} schedule environment observations for ${team.name}.`,
        url,
        dateModified: teamRelease.capturedAt,
        creator: { "@id": "https://fantasytradetarget.com/#organization" },
        about: { "@id": `${url}#team` },
        variableMeasured: ["dynasty market value", "overall rank", "opponent points allowed per game", "rest differential", "matchup environment score"],
        distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${url}/data.json` }],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fantasytradetarget.com/" },
          { "@type": "ListItem", position: 2, name: "Teams", item: "https://fantasytradetarget.com/teams" },
          { "@type": "ListItem", position: 3, name: team.name, item: url },
        ],
      },
    ],
  };
}
