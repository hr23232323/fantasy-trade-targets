import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "../../components/JsonLd";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import PlayerPortrait from "../../components/PlayerPortrait";
import PlayerHistoryChart from "../../components/PlayerHistoryChart";
import PlayerPerformance from "../../components/PlayerPerformance";
import { TrackedAnchor, TrackedLink } from "../../components/TrackedLink";
import {
  getPlayerMarketContexts,
  getPlayerProfile,
} from "../../lib/market";
import {
  getPlayerPage,
  playerPageSlugs,
} from "../../lib/player-pages";
import { getComparisonForPlayer } from "../../lib/player-comparisons";
import { getTeamByAbbr } from "../../lib/team-data";
import { getRecentPlayerContext } from "../../lib/nflverse";
import { activeStartSitWeek, startSitUrlPlayerSlug } from "../../lib/start-sit";
import {
  calculateMovement,
  formatMetric,
  getProductionCards,
  getUsageCards,
  selectPublishedHistory,
} from "../../lib/player-insights";
import type { MarketAsset } from "../../types/MarketAsset";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return playerPageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPlayerPage(slug);
  if (!page) return {};

  const { data: player, meta } = await getPlayerProfile(slug);
  const year = new Date(meta.generatedAt).getFullYear();
  const description = `${player.name} is worth ${Math.round(player.value)} in the current dynasty market and ranks No. ${player.rank ?? "—"} overall. See whether to trade or hold, recent usage, format values, history, and pick equivalents.`;

  return {
    title: `${player.name} Dynasty Value (${year}): Trade or Hold?`,
    description,
    alternates: { canonical: `/players/${slug}` },
    openGraph: {
      type: "profile",
      url: `/players/${slug}`,
      title: `${player.name} dynasty trade value`,
      description,
      images: [
        {
          url: page.image.src,
          width: page.image.width,
          height: page.image.height,
          alt: page.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${player.name} dynasty trade value`,
      description,
      images: [page.image.src],
    },
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPlayerPage(slug);
  if (!page) notFound();

  const [profilePayload, contexts] = await Promise.all([
    getPlayerProfile(slug),
    getPlayerMarketContexts(slug),
  ]);
  const { data: profile, meta, snapshotHistory } = profilePayload;
  const player = contexts.superflex ?? profile;
  const historySeries = selectPublishedHistory(profile.history, snapshotHistory);
  const movement30 = historySeries.chartable
    ? calculateMovement(historySeries.points, 30)
    : null;
  const movement90 = historySeries.chartable
    ? calculateMovement(historySeries.points, 90)
    : null;
  const pickEquivalents = [...contexts.picks]
    .sort(
      (a, b) =>
        Math.abs(a.value - player.value) - Math.abs(b.value - player.value),
    )
    .slice(0, 3);
  const production = getProductionCards(profile);
  const usage = getUsageCards(profile);
  const recent = getRecentPlayerContext(profile.slug);
  const updated = new Date(meta.generatedAt);
  const playerTeam = getTeamByAbbr(profile.team);
  const playerComparison = getComparisonForPlayer(profile.slug);
  const comparisonOpponent = playerComparison
    ? getPlayerPage(
        playerComparison.leftSlug === profile.slug
          ? playerComparison.rightSlug
          : playerComparison.leftSlug,
      )
    : undefined;
  const tradeDecision = getTradeDecision(profile.name, player, movement30);
  const worthAnswer = getWorthAnswer(profile.name, player, pickEquivalents[0], profile.similar[0]);
  const recentUsageAnswer = getRecentUsageAnswer(profile.name, recent);
  const schema = buildSchema(profile, page.image, meta.generatedAt, [
    {
      question: `What is ${profile.name} worth in dynasty fantasy football?`,
      answer: worthAnswer,
    },
    {
      question: `Should I trade ${profile.name} in fantasy football?`,
      answer: tradeDecision.answer,
    },
    ...(recentUsageAnswer
      ? [{ question: `What was ${profile.name}'s latest fantasy football usage?`, answer: recentUsageAnswer }]
      : []),
  ]);

  return (
    <>
      <JsonLd data={schema} />
      <AnalyticsPageView
        eventName="player_research_viewed"
        properties={{
          player_slug: profile.slug,
          player_team: profile.team ?? null,
          player_position: profile.position,
          market_rank: player.rank ?? null,
          market_value: Math.round(player.value),
          has_history: historySeries.chartable,
          has_team_page: Boolean(playerTeam),
          has_head_to_head_comparison: Boolean(playerComparison),
        }}
      />

      <nav className="page-wrap pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#171c19]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/players" className="hover:text-[#171c19]">Players</Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{profile.name}</span>
      </nav>

      <section className="page-wrap grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="border border-[#171c19] bg-[#dfff4f] p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow bg-white">Player market file // research</span>
            {playerTeam ? (
              <Link href={`/teams/${playerTeam.slug}`} className="mono-label border border-[#171c19] px-3 py-2 hover:bg-white">
                {playerTeam.name} · {profile.position} →
              </Link>
            ) : (
              <span className="mono-label border border-[#171c19] px-3 py-2">
                {profile.team || "NFL"} · {profile.position}
              </span>
            )}
          </div>
          <h1 className="mt-8 text-[clamp(3rem,7vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em]">
            What is {profile.name} worth in dynasty?
          </h1>
          <p className="mt-8 max-w-3xl border-l-4 border-[#171c19] pl-5 text-lg font-bold leading-8 sm:text-xl">
            {profile.name} is worth <strong>{Math.round(player.value)}</strong> on the current dynasty Superflex market scale, ranking <strong>No. {player.rank ?? "—"} overall</strong> and <strong>{profile.position}{player.posRank ?? "—"}</strong> at the position.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#3e453f]">
            {page.editorialLens} This is a transparent market reference—not a projection or an instruction to accept a trade without considering your roster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${profile.slug}`}
              className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#ff6b3d]"
              analyticsEvent="research_cta_clicked"
              analyticsProperties={{
                source: "player_hero",
                destination: "calculator",
                player_slug: profile.slug,
              }}
            >
              Build an offer for {firstName(profile.name)} →
            </TrackedLink>
            <Link
              href={historySeries.chartable ? "#history" : "#market-context"}
              className="border border-[#171c19] bg-white/70 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em]"
            >
              {historySeries.chartable ? "See market history ↓" : "Compare league formats ↓"}
            </Link>
          </div>
        </div>

        <figure className="relative min-h-[500px] overflow-visible border border-[#171c19] bg-[#171c19] shadow-[8px_8px_0_#ff6b3d]">
          <PlayerPortrait
            slug={profile.slug}
            name={profile.name}
            image={page.image}
            position={profile.position}
            team={profile.team}
            variant="hero"
            priority
            sizes="(max-width: 1023px) 100vw, 40vw"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-[#171c19]/92 px-4 py-3 font-mono text-[9px] uppercase leading-4 tracking-[0.05em] text-white/70">
            Image: {page.image.author} ·{" "}
            <a href={page.image.licenseUrl} target="_blank" rel="license noopener" className="text-[#dfff4f] underline">
              {page.image.license}
            </a>{" "}
            ·{" "}
            <a href={page.image.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#dfff4f] underline">
              {page.image.sourceUrl.startsWith("https://commons.wikimedia.org/")
                ? "Wikimedia Commons"
                : "FTT data sources"}
            </a>
          </figcaption>
        </figure>
      </section>

      <section className="page-wrap py-8" aria-labelledby="trade-decision-title">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
          <article className="bg-[#ffb29a] p-6 sm:p-8">
            <span className="mono-label">Trade or hold // answer first</span>
            <h2 id="trade-decision-title" className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              Should you trade {profile.name}?
            </h2>
            <p className="mt-5 text-lg font-bold leading-8">{tradeDecision.verdict}.</p>
            <p className="mt-3 text-sm leading-7 text-[#4f3d35]">{tradeDecision.answer}</p>
            <TrackedLink
              href={`/dynasty-trade-calculator?format=dynasty&qbs=2&send=${profile.slug}`}
              className="mt-6 inline-block border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-white"
              analyticsEvent="research_cta_clicked"
              analyticsProperties={{ source: "player_trade_answer", destination: "calculator", player_slug: profile.slug }}
            >
              Price a return →
            </TrackedLink>
          </article>

          <article className="bg-[#dfff4f] p-6 sm:p-8">
            <span className="mono-label">Latest recorded role</span>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">
              {recent ? `Week ${recent.week} workload` : "Weekly usage"}
            </h2>
            {recent ? (
              <dl className="mt-6 space-y-4 text-sm">
                <AnswerMetric label={recent.opportunityLabel} value={recent.opportunity === null ? "—" : String(recent.opportunity)} />
                <AnswerMetric label="Offensive snap share" value={recent.snapPct === null ? "—" : `${Math.round(recent.snapPct * 100)}%`} />
                <AnswerMetric label="PPR points" value={recent.fantasyPointsPpr === null ? "—" : recent.fantasyPointsPpr.toFixed(1)} />
                <AnswerMetric label="Availability" value={recent.availability} />
              </dl>
            ) : (
              <p className="mt-5 text-sm leading-7 text-[#4d544f]">No current-season game log is available yet. The market values and historical profile remain published below.</p>
            )}
            <TrackedLink
              href={`/who-should-i-start?player1=${startSitUrlPlayerSlug(profile.slug)}&scoring=PPR`}
              className="mt-6 inline-block border border-[#171c19] bg-white/70 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]"
              analyticsEvent="research_cta_clicked"
              analyticsProperties={{ source: "player_usage_answer", destination: "start_sit", player_slug: profile.slug }}
            >
              Set Week {activeStartSitWeek} lineup →
            </TrackedLink>
          </article>

          <article className="bg-[#8bcfff] p-6 sm:p-8">
            <span className="mono-label">What is {firstName(profile.name)} worth?</span>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">Price anchors</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <AnswerMetric label="Dynasty Superflex" value={`${Math.round(player.value)} · No. ${player.rank ?? "—"}`} />
              <AnswerMetric label="Dynasty 1QB" value={contexts.oneQb ? `${Math.round(contexts.oneQb.value)} · No. ${contexts.oneQb.rank ?? "—"}` : "Not ranked"} />
              <AnswerMetric label="Closest rookie pick" value={pickEquivalents[0]?.name ?? "No close pick listed"} />
              <AnswerMetric label="Nearby player" value={profile.similar[0]?.name ?? "No close player listed"} />
            </dl>
            <p className="mt-6 text-xs leading-5 text-[#3d515e]">One-for-one references on the same published scale. Complete offers still depend on format and roster depth.</p>
          </article>
        </div>
      </section>

      <section id="market-context" className="page-wrap scroll-mt-8 py-8" aria-labelledby="market-context-title">
        <div className="mb-7 grid gap-4 border-t border-[#171c19] pt-6 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <span className="eyebrow">Current price // four formats</span>
            <h2 id="market-context-title" className="section-title mt-5">One player. Different markets.</h2>
          </div>
          <p className="text-sm leading-7 text-[#69706c]">
            League format changes scarcity. These values come from the same daily composite feed so the comparisons stay on one scale.
          </p>
        </div>
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard label="Dynasty Superflex" asset={contexts.superflex} accent="bg-[#dfff4f]" />
          <ValueCard label="Dynasty 1QB" asset={contexts.oneQb} accent="bg-[#8bcfff]" />
          <ValueCard label="Superflex TEP" asset={contexts.tePremium} accent="bg-[#d7b6ff]" />
          <ValueCard label="Redraft 1QB" asset={contexts.redraft} accent="bg-[#ffb29a]" />
        </div>
      </section>

      {historySeries.chartable && (
        <section id="history" className="page-wrap scroll-mt-8 py-16">
          <div className="paper-card p-5 sm:p-8">
            <div className="grid gap-5 border-b border-[#171c19] pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <span className="mono-label text-[#69706c]">Market history</span>
                <h2 className="mt-2 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                  {profile.name} value over time
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <MovementCard movement={movement30} />
                <MovementCard movement={movement90} />
              </div>
            </div>
            <div className="pt-8">
              <PlayerHistoryChart series={historySeries} name={profile.name} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-[#c9c5ba] pt-5">
              <TrackedAnchor
                href={`/players/${profile.slug}/history.csv`}
                download
                className="border border-[#171c19] bg-[#dfff4f] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]"
                analyticsEvent="research_downloaded"
                analyticsProperties={{
                  research_type: "player",
                  player_slug: profile.slug,
                  file_format: "csv",
                  dataset: "history",
                }}
              >
                Download history CSV ↓
              </TrackedAnchor>
              <TrackedAnchor
                href={`/players/${profile.slug}/data.json`}
                download
                className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]"
                analyticsEvent="research_downloaded"
                analyticsProperties={{
                  research_type: "player",
                  player_slug: profile.slug,
                  file_format: "json",
                  dataset: "profile",
                }}
              >
                Download player JSON ↓
              </TrackedAnchor>
            </div>
          </div>
        </section>
      )}

      <section className="page-wrap grid gap-8 py-8 lg:grid-cols-2">
        <MetricPanel
          eyebrow={`Production // ${profile.stats?.season ?? "latest season"}`}
          title="What happened on the field."
          cards={production}
          footer="Season and consistency figures are descriptive historical results. They are not forward projections."
        />
        <MetricPanel
          eyebrow={`Usage // ${profile.advanced?.season ?? "latest season"}`}
          title="How the role created it."
          cards={usage}
          footer="Advanced usage describes opportunity and role. Missing metrics remain visibly unavailable."
        />
      </section>

      <PlayerPerformance slug={profile.slug} name={profile.name} position={profile.position} />

      <section className="page-wrap grid gap-8 py-16 lg:grid-cols-2">
        <div className="border border-[#171c19] bg-[#171c19] p-6 text-white sm:p-8">
          <span className="mono-label text-[#dfff4f]">Comparable market tier</span>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Players priced nearby.</h2>
          <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
            {profile.similar.slice(0, 6).map((similar) => {
              const linked = getPlayerPage(similar.slug);
              const content = (
                <>
                  <span><strong>{similar.name}</strong><span className="ml-2 font-mono text-[10px] text-white/45">{similar.position} · #{similar.rank ?? "—"}</span></span>
                  <span className="font-mono font-black text-[#dfff4f]">{Math.round(similar.value)}</span>
                </>
              );
              return linked ? (
                <Link key={similar.slug} href={`/players/${similar.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-[#dfff4f]">{content}</Link>
              ) : (
                <div key={similar.slug} className="flex items-center justify-between gap-4 py-4">{content}</div>
              );
            })}
          </div>
        </div>

        <div className="border border-[#171c19] bg-[#8bcfff] p-6 sm:p-8">
          <span className="mono-label">Closest rookie-pick equivalents</span>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Draft capital on the same scale.</h2>
          <div className="mt-7 divide-y divide-[#171c19]/25 border-y border-[#171c19]/25">
            {pickEquivalents.map((pick) => (
              <div key={pick.id} className="flex items-center justify-between gap-4 py-4">
                <span><strong>{pick.name}</strong><span className="ml-2 font-mono text-[10px] text-[#4c5650]">{pick.tier ?? "exact pick"}</span></span>
                <span className="font-mono font-black">{Math.round(pick.value)}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-[#4b5450]">
            These are the nearest individual picks by value, not a claim that another manager will accept a one-for-one offer.
          </p>
        </div>
      </section>

      <section className="page-wrap py-16 text-center">
        <span className="mono-label text-[#69706c]">Next decision</span>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">Price the complete package.</h2>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <TrackedLink
            href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${profile.slug}`}
            className="inline-block border border-[#171c19] bg-[#dfff4f] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em] shadow-[5px_5px_0_#171c19]"
            analyticsEvent="research_cta_clicked"
            analyticsProperties={{
              source: "player_footer",
              destination: "calculator",
              player_slug: profile.slug,
            }}
          >
            Trade for {profile.name} →
          </TrackedLink>
          <TrackedLink
            href="/fantasy-football-trade-targets"
            className="inline-block border border-[#171c19] bg-white/60 px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em]"
            analyticsEvent="research_cta_clicked"
            analyticsProperties={{
              source: "player_footer",
              destination: "trade_targets",
              player_slug: profile.slug,
            }}
          >
            Compare current targets →
          </TrackedLink>
          {playerComparison && comparisonOpponent && (
            <TrackedLink
              href={`/player-comparisons/${playerComparison.slug}`}
              className="inline-block border border-[#171c19] bg-[#8bcfff] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em]"
              analyticsEvent="player_comparison_opened"
              analyticsProperties={{
                source: "player_footer",
                comparison_slug: playerComparison.slug,
                player_slug: profile.slug,
              }}
            >
              Compare with {comparisonOpponent.name} →
            </TrackedLink>
          )}
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        <p className="max-w-5xl">
          <strong className="text-[#171c19]">Data note:</strong>{" "}
          Market and profile data updated {Number.isNaN(updated.getTime()) ? "daily" : updated.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET. See{" "}
          <Link href="/data-sources" className="underline underline-offset-2">sources, licensing, and freshness</Link>. Fantasy Trade Target applies its published{" "}
          <Link href="/methodology" className="underline underline-offset-2">calculator methodology</Link> in release <span className="font-mono">{meta.releaseId}</span>. Accepted-trade distributions and league-specific lineup evidence are not yet included.
        </p>
      </aside>
    </>
  );
}

function ValueCard({
  label,
  asset,
  accent,
}: {
  label: string;
  asset?: MarketAsset;
  accent: string;
}) {
  return (
    <article className={`${accent} p-5 sm:p-6`}>
      <span className="mono-label">{label}</span>
      <p className="mt-8 font-mono text-5xl font-black tabular-nums">
        {asset ? Math.round(asset.value) : "—"}
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.04em] text-[#4c544f]">
        {asset ? `#${asset.rank ?? "—"} overall · ${asset.position}${asset.posRank ?? "—"}` : "Not currently ranked"}
      </p>
    </article>
  );
}

function MovementCard({ movement }: { movement: ReturnType<typeof calculateMovement> }) {
  if (!movement) return null;
  const positive = movement.valueChange >= 0;
  return (
    <div className="min-w-32 border border-[#171c19] bg-white/55 px-4 py-3">
      <span className="mono-label text-[#69706c]">{movement.label} move</span>
      <p className={`mt-1 font-mono text-xl font-black ${positive ? "text-[#2f6f3e]" : "text-[#a23616]"}`}>
        {positive ? "+" : ""}{movement.percentChange.toFixed(1)}%
      </p>
    </div>
  );
}

function MetricPanel({
  eyebrow,
  title,
  cards,
  footer,
}: {
  eyebrow: string;
  title: string;
  cards: Array<{ label: string; value: unknown }>;
  footer: string;
}) {
  return (
    <article className="paper-card p-5 sm:p-8">
      <span className="mono-label text-[#69706c]">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">{title}</h2>
      <dl className="mt-7 grid grid-cols-2 gap-px border border-[#171c19] bg-[#171c19]">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#f3f0e7] p-4">
            <dt className="mono-label text-[#69706c]">{card.label}</dt>
            <dd className="mt-2 text-2xl font-black">{formatMetric(card.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-xs leading-5 text-[#69706c]">{footer}</p>
    </article>
  );
}

function firstName(name: string) {
  return name.split(" ")[0];
}

function AnswerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#171c19]/20 pb-3 last:border-0 last:pb-0">
      <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-[#4d544f]">{label}</dt>
      <dd className="max-w-[58%] text-right font-bold">{value}</dd>
    </div>
  );
}

function getTradeDecision(
  name: string,
  player: MarketAsset,
  movement: ReturnType<typeof calculateMovement>,
) {
  const marketLine = `${name} is currently No. ${player.rank ?? "—"} overall and ${player.position}${player.posRank ?? "—"}, with a dynasty Superflex value of ${Math.round(player.value)}.`;
  if (!movement || Math.abs(movement.percentChange) < 2) {
    return {
      verdict: "Hold at the current market price",
      answer: `${marketLine} There is no strong 30-day price move, so compare offers against the current tier instead of forcing a deal.`,
    };
  }
  if (movement.percentChange > 0) {
    return {
      verdict: "Hold unless the return beats the current tier",
      answer: `${marketLine} The published market is up ${movement.percentChange.toFixed(1)}% over the last month, so a trade should capture that stronger price.`,
    };
  }
  return {
    verdict: "Avoid selling only because the price dipped",
    answer: `${marketLine} The published market is down ${Math.abs(movement.percentChange).toFixed(1)}% over the last month; require a return that still matches the current tier.`,
  };
}

function getWorthAnswer(
  name: string,
  player: MarketAsset,
  pick?: MarketAsset,
  peer?: { name: string; value: number },
) {
  const references = [
    pick ? `${pick.name} is the closest rookie-pick value` : null,
    peer ? `${peer.name} is a nearby player at ${Math.round(peer.value)}` : null,
  ].filter(Boolean).join(", and ");
  return `${name} is worth ${Math.round(player.value)} on the current dynasty Superflex scale, No. ${player.rank ?? "—"} overall and ${player.position}${player.posRank ?? "—"}. ${references ? `${references}.` : ""}`.trim();
}

function getRecentUsageAnswer(
  name: string,
  recent: ReturnType<typeof getRecentPlayerContext>,
) {
  if (!recent) return null;
  const details = [
    recent.opportunity === null ? null : `${recent.opportunity} ${recent.opportunityLabel.toLowerCase()}`,
    recent.snapPct === null ? null : `${Math.round(recent.snapPct * 100)}% offensive snap share`,
    recent.fantasyPointsPpr === null ? null : `${recent.fantasyPointsPpr.toFixed(1)} PPR points`,
  ].filter(Boolean).join(", ");
  return `${name}'s latest recorded result is Week ${recent.week}${recent.opponent ? ` against ${recent.opponent}` : ""}: ${details || "a completed game log"}. Availability: ${recent.availability}.`;
}

function buildSchema(
  player: Awaited<ReturnType<typeof getPlayerProfile>>["data"],
  image: { src: string; width: number; height: number; alt: string },
  dateModified: string,
  faq: Array<{ question: string; answer: string }>,
) {
  const url = `https://fantasytradetarget.com/players/${player.slug}`;
  const imageUrl = new URL(image.src, "https://fantasytradetarget.com").toString();
  const team = getTeamByAbbr(player.team);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: `${player.name} dynasty trade value`,
        dateModified,
        about: {
          "@type": "Person",
          "@id": `${url}#player`,
          name: player.name,
          image: imageUrl,
          jobTitle: `${player.position} football player`,
          affiliation: team
            ? {
                "@type": "SportsTeam",
                name: team.name,
                url: `https://fantasytradetarget.com/teams/${team.slug}`,
              }
            : undefined,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: imageUrl,
          width: image.width,
          height: image.height,
          caption: image.alt,
        },
        publisher: {
          "@id": "https://fantasytradetarget.com/#organization",
        },
        mainEntity: {
          "@id": `${url}#dataset`,
        },
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://fantasytradetarget.com/#website",
          name: "Fantasy Trade Target",
        },
      },
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: `${player.name} fantasy football market history`,
        description: `Current dynasty and redraft market context plus recorded value observations for ${player.name}.`,
        url,
        dateModified,
        creator: {
          "@id": "https://fantasytradetarget.com/#organization",
        },
        about: {
          "@id": `${url}#player`,
        },
        variableMeasured: [
          "market value",
          "overall rank",
          "position rank",
          "observation date",
        ],
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: `${url}/history.csv`,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${url}/data.json`,
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://fantasytradetarget.com/" },
          { "@type": "ListItem", position: 2, name: "Players", item: "https://fantasytradetarget.com/players" },
          { "@type": "ListItem", position: 3, name: player.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}
