import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { TrackedLink } from "../components/TrackedLink";
import { getMarket } from "../lib/market";
import { buildPageMetadata } from "../lib/metadata";
import { hasPlayerPage } from "../lib/player-pages";
import { teams } from "../lib/team-data";
import type { MarketAsset } from "../types/MarketAsset";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "Fantasy Football Trade Targets: Dynasty & Redraft",
  description:
    "Find fantasy football trade targets for contenders and rebuilders using current dynasty and redraft market ranks, values, league context, and complete player research.",
  path: "/fantasy-football-trade-targets",
});

type PlayerAsset = MarketAsset & { kind: "player" };

type TargetComparison = {
  dynasty: PlayerAsset;
  redraft: PlayerAsset;
  rankEdge: number;
};

const faqs = [
  {
    question: "Who should I trade for in fantasy football?",
    answer:
      "Start with the board that matches your team direction. Contenders can screen for players priced better in redraft than dynasty, while rebuilders can screen for players whose long-term dynasty rank is stronger. Use the market score to price the complete offer rather than treating a shortlist as a prediction.",
  },
  {
    question: "Are these buy-low predictions?",
    answer:
      "No. These are reproducible market screens built from current dynasty and redraft ranks. They show price and format differences; they do not claim that news, injuries, usage, or future performance are already known.",
  },
  {
    question: "How often do fantasy football trade targets update?",
    answer:
      "The underlying market release refreshes three times daily when validation succeeds. Every page shows its release timestamp, and a failed or partial refresh never replaces the last good dataset.",
  },
  {
    question: "Do Superflex, PPR, and roster settings change the targets?",
    answer:
      "Yes. Superflex increases quarterback scarcity, reception scoring changes replacement-relative value by position and player, and deeper starting lineups push replacement lower. Open the scoring impact lab before finalizing an offer in a non-default league.",
  },
];

export default async function FantasyFootballTradeTargetsPage() {
  const [dynastySuperflexMarket, dynastyOneQbMarket, redraftMarket] = await Promise.all([
    getMarket({
      format: "dynasty",
      numQbs: 2,
      numTeams: 12,
      passingTdPoints: 4,
      receptionPoints: 1,
    }),
    getMarket({
      format: "dynasty",
      numQbs: 1,
      numTeams: 12,
      passingTdPoints: 4,
      receptionPoints: 1,
    }),
    getMarket({
      format: "redraft",
      numQbs: 1,
      numTeams: 12,
      passingTdPoints: 4,
      receptionPoints: 1,
    }),
  ]);
  const dynastySuperflexPlayers = dynastySuperflexMarket.assets.filter(isPlayer);
  const dynastyPlayers = dynastyOneQbMarket.assets.filter(isPlayer);
  const redraftBySlug = new Map(
    redraftMarket.assets.filter(isPlayer).map((player) => [player.slug, player]),
  );
  const comparisons = dynastyPlayers.flatMap((dynasty) => {
    const redraft = redraftBySlug.get(dynasty.slug);
    if (!redraft || !dynasty.rank || !redraft.rank) return [];
    return [{ dynasty, redraft, rankEdge: redraft.rank - dynasty.rank }];
  });
  const cornerstones = dynastySuperflexPlayers.slice(0, 8);
  const leaders = new Set(cornerstones.map((player) => player.slug));
  const builderTargets = comparisons
    .filter(({ dynasty, rankEdge }) => !leaders.has(dynasty.slug) && dynasty.rank! <= 120 && rankEdge > 0)
    .sort((left, right) => right.rankEdge - left.rankEdge || left.dynasty.rank! - right.dynasty.rank!)
    .slice(0, 8);
  const contenderTargets = comparisons
    .filter(({ dynasty, redraft, rankEdge }) =>
      !leaders.has(dynasty.slug) &&
      redraft.rank! <= 120 &&
      rankEdge < 0,
    )
    .sort((left, right) => left.rankEdge - right.rankEdge || left.redraft.rank! - right.redraft.rank!)
    .slice(0, 8);
  const listedPlayers = [
    ...cornerstones,
    ...builderTargets.map(({ dynasty }) => dynasty),
    ...contenderTargets.map(({ dynasty }) => dynasty),
  ];
  const updated = new Date(dynastySuperflexMarket.meta.generatedAt).toLocaleDateString(
    "en-US",
    { dateStyle: "long", timeZone: "America/New_York" },
  );

  return (
    <>
      <AnalyticsPageView
        eventName="trade_targets_hub_viewed"
        properties={{
          release_id: dynastySuperflexMarket.meta.releaseId,
          cornerstone_count: cornerstones.length,
          builder_target_count: builderTargets.length,
          contender_target_count: contenderTargets.length,
          reviewed_target_count: listedPlayers.filter((player) => hasPlayerPage(player.slug)).length,
        }}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Fantasy football trade targets",
            url: `${SITE_URL}/fantasy-football-trade-targets`,
            description:
              "Current dynasty and redraft trade-target screens for contenders and rebuilders.",
            dateModified: dynastySuperflexMarket.meta.generatedAt,
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: listedPlayers.length,
              itemListElement: listedPlayers.map((player, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: player.name,
                ...(hasPlayerPage(player.slug)
                  ? { url: `${SITE_URL}/players/${player.slug}` }
                  : {}),
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              {
                "@type": "ListItem",
                position: 2,
                name: "Fantasy football trade targets",
                item: `${SITE_URL}/fantasy-football-trade-targets`,
              },
            ],
          },
        ]}
      />

      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">Current market screens // updated {updated}</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7.4rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">
            Fantasy football <span className="text-[#ff6b3d]">trade targets.</span>
          </h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">
            Find targets without pretending every roster has the same goal. This board separates Superflex market cornerstones from dynasty-builder and current-season contender fits. The direction screens compare dynasty and redraft in the same 1QB format, so quarterback scarcity does not contaminate the horizon signal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href="#target-boards"
              analyticsEvent="research_cta_clicked"
              analyticsProperties={{ research_type: "trade_targets", destination: "target_boards" }}
              className="border border-white bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] shadow-[4px_4px_0_#8bcfff]"
            >
              Open the boards ↓
            </TrackedLink>
            <TrackedLink
              href="/dynasty-trade-calculator"
              analyticsEvent="research_cta_clicked"
              analyticsProperties={{ research_type: "trade_targets", destination: "dynasty_calculator" }}
              className="border border-white/40 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] hover:bg-white hover:text-[#171c19]"
            >
              Price an offer →
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-px py-12 md:grid-cols-3">
        <MethodCard
          label="Market leaders"
          title="Start with the price ceiling."
          copy="The cornerstone board shows the most valuable current dynasty Superflex players. It is a price reference, not a claim that elite assets are easy to acquire."
          accent="bg-[#dfff4f]"
        />
        <MethodCard
          label="Builder screen"
          title="Long-term rank beats redraft rank."
          copy="A positive dynasty edge surfaces players the long-horizon market ranks higher than the current-season market. Age alone does not determine the list."
          accent="bg-[#8bcfff]"
        />
        <MethodCard
          label="Contender screen"
          title="Redraft rank beats dynasty rank."
          copy="A positive contender edge surfaces current-season value that costs less on the dynasty board. Your lineup, health, and schedule still decide the fit."
          accent="bg-[#ffb29a]"
        />
      </section>

      <section id="target-boards" className="page-wrap scroll-mt-8 py-12">
        <TargetBoard
          eyebrow="Reference board // dynasty Superflex"
          title="Market cornerstones"
          description="The top current player assets establish the price ceiling. Open a player file for format ranks, production, usage, comparable players, and rookie-pick equivalents."
          accent="bg-[#dfff4f]"
          rows={cornerstones.map((player) => ({
            player,
            dynastyRank: player.rank ?? null,
            redraftRank: redraftBySlug.get(player.slug)?.rank ?? null,
            read: "Top-eight dynasty market value",
          }))}
        />
        <TargetBoard
          eyebrow="Team direction // longer horizon"
          title="Dynasty-builder targets"
          description="Sorted by the largest advantage in dynasty rank over redraft rank, after excluding the market-leading tier. The gap is a format signal—not a performance forecast."
          accent="bg-[#8bcfff]"
          rows={builderTargets.map(({ dynasty, redraft, rankEdge }) => ({
            player: dynasty,
            dynastyRank: dynasty.rank ?? null,
            redraftRank: redraft.rank ?? null,
            read: `${rankEdge} spots stronger in dynasty`,
          }))}
        />
        <TargetBoard
          eyebrow="Team direction // current season"
          title="Contender trade targets"
          description="Sorted by the largest advantage in redraft rank over dynasty rank, with both markets capped inside the useful top 120. These are win-now price screens, not automatic buys."
          accent="bg-[#ffb29a]"
          rows={contenderTargets.map(({ dynasty, redraft, rankEdge }) => ({
            player: dynasty,
            dynastyRank: dynasty.rank ?? null,
            redraftRank: redraft.rank ?? null,
            read: `${Math.abs(rankEdge)} spots stronger in redraft`,
          }))}
        />
      </section>

      <section className="page-wrap py-14">
        <div className="grid gap-8 border-t border-[#171c19] pt-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <span className="eyebrow">League context matters</span>
            <h2 className="section-title mt-6">Change the assumptions before the offer.</h2>
          </div>
          <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2">
            <ContextLink href="/scoring-impact" title="Scoring impact lab" copy="Model 4- or 6-point passing TDs, standard through full PPR, starters, FLEX spots, and league size." />
            <ContextLink href="/dynasty-superflex-trade-calculator" title="Superflex calculator" copy="Price complete packages when a second quarterback can start and replacement changes." />
            <ContextLink href="/scoring/standard-vs-ppr-player-values" title="Standard vs. PPR values" copy="See how reception scoring changes replacement-relative RB, WR, and TE value." />
            <ContextLink href="/scoring/6-point-passing-td-rankings" title="6-point passing TD rankings" copy="Compare quarterback value when passing touchdowns move from four points to six." />
          </div>
        </div>
      </section>

      <section className="page-wrap py-14">
        <div className="flex flex-col gap-5 border-t border-[#171c19] pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">Browse by NFL team</span>
            <h2 className="section-title mt-6">Price every roster.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#69706c]">
            Each team file connects current dynasty assets with its complete schedule, opponent scoring context, venue, and rest signals.
          </p>
        </div>
        <div className="mt-9 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 md:grid-cols-4">
          {teams.map((team) => (
            <Link
              key={team.abbr}
              href={`/teams/${team.slug}`}
              className="flex min-h-24 items-center justify-between gap-4 bg-[#f3f0e7] p-4 font-bold hover:bg-[#dfff4f]"
            >
              <span>{team.name}</span>
              <span className="font-mono text-[10px]">{team.abbr} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-wrap py-14">
        <span className="eyebrow">Questions, answered</span>
        <h2 className="section-title mt-6">How to use a target list.</h2>
        <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
          {faqs.map(({ question, answer }) => (
            <article key={question} className="bg-[#f3f0e7] p-6">
              <h3 className="text-xl font-black tracking-[-0.03em]">{question}</h3>
              <p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        Values use market release <span className="font-mono font-bold">{dynastySuperflexMarket.meta.releaseId}</span>, updated {updated}. Rankings are attributed composite market reference points from <a href="https://api.tradyr.app/docs" target="_blank" rel="noopener noreferrer" className="font-bold underline">Tradyr&apos;s public API</a>. The builder and contender screens are deterministic same-format rank comparisons created by Fantasy Trade Target Research. See the <Link href="/methodology" className="font-bold underline">methodology</Link> and <Link href="/data-sources" className="font-bold underline">data sources</Link>.
      </aside>
    </>
  );
}

function isPlayer(asset: MarketAsset): asset is PlayerAsset {
  return asset.kind === "player" && asset.position !== "PICK";
}

function MethodCard({
  label,
  title,
  copy,
  accent,
}: {
  label: string;
  title: string;
  copy: string;
  accent: string;
}) {
  return (
    <article className={`${accent} border border-[#171c19] p-6`}>
      <span className="mono-label">{label}</span>
      <h2 className="mt-9 text-3xl font-black tracking-[-0.05em]">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#414742]">{copy}</p>
    </article>
  );
}

function TargetBoard({
  eyebrow,
  title,
  description,
  accent,
  rows,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  rows: Array<{
    player: PlayerAsset;
    dynastyRank: number | null;
    redraftRank: number | null;
    read: string;
  }>;
}) {
  return (
    <article className="mb-16 last:mb-0">
      <div className="grid gap-5 border-t border-[#171c19] pt-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <div>
          <span className={`${accent} mono-label inline-block border border-[#171c19] px-3 py-2`}>{eyebrow}</span>
          <h2 className="section-title mt-5">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-[#69706c]">{description}</p>
      </div>
      <div className="mt-8 overflow-x-auto border border-[#171c19] bg-white/55">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white">
            <tr>
              <th className="px-5 py-4">Player</th>
              <th className="px-5 py-4">Team / pos.</th>
              <th className="px-5 py-4">Dynasty rank</th>
              <th className="px-5 py-4">Redraft rank</th>
              <th className="px-5 py-4">Dynasty value</th>
              <th className="px-5 py-4">Market read</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#bcb9ae]">
            {rows.map(({ player, dynastyRank, redraftRank, read }) => (
              <tr key={player.slug}>
                <td className="px-5 py-4 font-black">
                  {hasPlayerPage(player.slug) ? (
                    <TrackedLink
                      href={`/players/${player.slug}`}
                      analyticsEvent="trade_target_opened"
                      analyticsProperties={{
                        player_slug: player.slug,
                        board: title,
                        dynasty_rank: dynastyRank,
                        redraft_rank: redraftRank,
                      }}
                      className="underline decoration-[#ff6b3d] decoration-2 underline-offset-4 hover:bg-[#dfff4f]"
                    >
                      {player.name} →
                    </TrackedLink>
                  ) : (
                    <TrackedLink
                      href={`/dynasty-trade-calculator?format=dynasty&qbs=1&get=${player.slug}`}
                      analyticsEvent="trade_target_opened"
                      analyticsProperties={{
                        player_slug: player.slug,
                        board: title,
                        dynasty_rank: dynastyRank,
                        redraft_rank: redraftRank,
                        destination: "calculator",
                      }}
                      className="underline decoration-[#8bcfff] decoration-2 underline-offset-4 hover:bg-[#dfff4f]"
                    >
                      {player.name} →
                    </TrackedLink>
                  )}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-[#69706c]">{player.team || "FA"} · {player.position}{player.posRank ?? "—"}</td>
                <td className="px-5 py-4 font-mono font-black">#{dynastyRank ?? "—"}</td>
                <td className="px-5 py-4 font-mono font-black">#{redraftRank ?? "—"}</td>
                <td className="px-5 py-4 font-mono text-lg font-black">{Math.round(player.value)}</td>
                <td className="px-5 py-4 text-xs leading-5 text-[#59605c]">{read}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ContextLink({ href, title, copy }: { href: string; title: string; copy: string }) {
  return (
    <Link href={href} className="group bg-[#f3f0e7] p-6 hover:bg-[#dfff4f]">
      <h3 className="text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#59605c]">{copy}</p>
      <span className="mt-7 inline-block font-mono text-[10px] font-black uppercase tracking-[0.07em] group-hover:translate-x-1">Open research →</span>
    </Link>
  );
}
