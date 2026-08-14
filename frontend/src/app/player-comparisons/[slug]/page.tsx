import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import { TrackedLink } from "../../components/TrackedLink";
import { getMarket, getPlayerProfile } from "../../lib/market";
import {
  getPlayerComparison,
  getRelatedComparisons,
  playerComparisonSlugs,
} from "../../lib/player-comparisons";
import { formatMetric, getProductionCards } from "../../lib/player-insights";
import { getPlayerPage } from "../../lib/player-pages";
import type { MarketAsset, MarketPayload } from "../../types/MarketAsset";

const SITE_URL = "https://fantasytradetarget.com";
const SAME_TIER_PERCENT = 5;

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ComparisonRow = {
  label: string;
  detail: string;
  left: MarketAsset;
  right: MarketAsset;
};

export function generateStaticParams() {
  return playerComparisonSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getPlayerComparison(slug);
  if (!comparison) return {};
  const left = getPlayerPage(comparison.leftSlug);
  const right = getPlayerPage(comparison.rightSlug);
  if (!left || !right) return {};

  const title = `${left.name} vs. ${right.name}: Dynasty Trade Value`;
  const description = `Compare ${left.name} and ${right.name} across dynasty Superflex, 1QB, redraft, and scoring settings with current values and player-level math.`;

  return {
    title,
    description,
    alternates: { canonical: `/player-comparisons/${slug}` },
    openGraph: {
      type: "article",
      url: `/player-comparisons/${slug}`,
      title,
      description,
      images: [
        {
          url: left.image.src,
          width: left.image.width,
          height: left.image.height,
          alt: left.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [left.image.src],
    },
  };
}

export default async function PlayerComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getPlayerComparison(slug);
  if (!comparison) notFound();

  const [
    base,
    oneQb,
    tePremium,
    redraft,
    standard,
    halfPpr,
    sixPoint,
    leftProfilePayload,
    rightProfilePayload,
  ] = await Promise.all([
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12, passingTdPoints: 4, receptionPoints: 1 }),
    getMarket({ format: "dynasty", numQbs: 1, numTeams: 12, passingTdPoints: 4, receptionPoints: 1 }),
    getMarket({ format: "dynasty", numQbs: 2, tep: true, numTeams: 12, passingTdPoints: 4, receptionPoints: 1 }),
    getMarket({ format: "redraft", numQbs: 1, numTeams: 12, passingTdPoints: 4, receptionPoints: 1 }),
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12, passingTdPoints: 4, receptionPoints: 0 }),
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12, passingTdPoints: 4, receptionPoints: 0.5 }),
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12, passingTdPoints: 6, receptionPoints: 1 }),
    getPlayerProfile(comparison.leftSlug),
    getPlayerProfile(comparison.rightSlug),
  ]);

  const basePlayers = pairFromMarket(base, comparison.leftSlug, comparison.rightSlug);
  const formatRows: ComparisonRow[] = [
    rowFromMarket("Dynasty Superflex", "Two QB-eligible starting slots; 4-point passing TDs and full PPR.", base, comparison.leftSlug, comparison.rightSlug),
    rowFromMarket("Dynasty 1QB", "One starting quarterback; 4-point passing TDs and full PPR.", oneQb, comparison.leftSlug, comparison.rightSlug),
    rowFromMarket("Superflex TEP", "Superflex with an additional tight end reception premium.", tePremium, comparison.leftSlug, comparison.rightSlug),
    rowFromMarket("Redraft 1QB", "Current-season value only; one quarterback and full PPR.", redraft, comparison.leftSlug, comparison.rightSlug),
  ];
  const scoringRows: ComparisonRow[] = comparison.position === "QB"
    ? [
        rowFromMarket("4-point passing TD", "Each passing touchdown scores four points; full PPR remains on.", base, comparison.leftSlug, comparison.rightSlug),
        rowFromMarket("6-point passing TD", "Each passing touchdown scores six points; full PPR remains on.", sixPoint, comparison.leftSlug, comparison.rightSlug),
      ]
    : [
        rowFromMarket("Standard", "Receptions score zero points; yards and touchdowns still score normally.", standard, comparison.leftSlug, comparison.rightSlug),
        rowFromMarket("Half PPR", "Each reception scores 0.5 points.", halfPpr, comparison.leftSlug, comparison.rightSlug),
        rowFromMarket("Full PPR", "Each reception scores one point.", base, comparison.leftSlug, comparison.rightSlug),
      ];

  const gapPercent = percentGap(basePlayers.left, basePlayers.right);
  const sameTier = gapPercent <= SAME_TIER_PERCENT;
  const leader = getLeader(basePlayers.left, basePlayers.right);
  const trailer = leader.slug === basePlayers.left.slug ? basePlayers.right : basePlayers.left;
  const formatSummary = summarizeRows(formatRows);
  const scoringSummary = summarizeRows(scoringRows);
  const leftProduction = getProductionCards(leftProfilePayload.data).slice(0, 6);
  const rightProduction = getProductionCards(rightProfilePayload.data).slice(0, 6);
  const related = getRelatedComparisons(comparison).map((item) => {
    const pair = pairFromMarket(base, item.leftSlug, item.rightSlug);
    return { ...item, left: pair.left, right: pair.right };
  });
  const updated = new Date(base.meta.generatedAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
  const shortAnswer = sameTier
    ? `${basePlayers.left.name} and ${basePlayers.right.name} are in the same current dynasty Superflex tier: ${Math.round(basePlayers.left.value)} versus ${Math.round(basePlayers.right.value)}, a ${gapPercent.toFixed(1)}% gap.`
    : `${leader.name} is currently worth more than ${trailer.name} in dynasty Superflex: ${Math.round(leader.value)} versus ${Math.round(trailer.value)}, a ${gapPercent.toFixed(1)}% gap.`;
  const straightUpAnswer = sameTier
    ? `Yes, the current baseline supports treating ${basePlayers.left.name} and ${basePlayers.right.name} as straight-up trade peers. A manager can still prefer either side, but the model does not support a large automatic add.`
    : `Not at the baseline price. ${leader.name} holds the larger current value, so a straight swap gives up a ${gapPercent.toFixed(1)}% market edge before roster fit is considered.`;
  const scoringAnswer = scoringSummary.flips
    ? `Yes. The higher-valued side changes across the displayed scoring settings, so this league setting can change the answer.`
    : `No leader flip appears in the displayed scoring settings. The gap ranges from ${Math.round(scoringSummary.minGap)} to ${Math.round(scoringSummary.maxGap)} value points, so scoring can still change the price.`;
  const faq = [
    {
      question: `Who is worth more in dynasty: ${basePlayers.left.name} or ${basePlayers.right.name}?`,
      answer: shortAnswer,
    },
    {
      question: `Should I trade ${basePlayers.left.name} for ${basePlayers.right.name} straight up?`,
      answer: straightUpAnswer,
    },
    {
      question: `Does scoring change the ${basePlayers.left.name} vs. ${basePlayers.right.name} comparison?`,
      answer: scoringAnswer,
    },
    {
      question: "Why do Superflex and 1QB values differ?",
      answer: formatSummary.flips
        ? "Quarterback scarcity changes enough across the displayed formats to change which side leads. Use the row matching your league rather than the universal baseline."
        : `Superflex makes starting quarterbacks scarcer, while 1QB pushes replacement closer to the starters. The displayed format gap ranges from ${Math.round(formatSummary.minGap)} to ${Math.round(formatSummary.maxGap)} value points.`,
    },
  ];
  const pageUrl = `${SITE_URL}/player-comparisons/${comparison.slug}`;

  return (
    <>
      <AnalyticsPageView
        eventName="player_comparison_viewed"
        properties={{
          comparison_slug: comparison.slug,
          left_player: basePlayers.left.slug,
          right_player: basePlayers.right.slug,
          position: comparison.position,
          baseline_gap_percent: Number(gapPercent.toFixed(2)),
          baseline_same_tier: sameTier,
          scoring_leader_flip: scoringSummary.flips,
          format_leader_flip: formatSummary.flips,
          release_id: base.meta.releaseId,
        }}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${pageUrl}#page`,
            url: pageUrl,
            name: `${basePlayers.left.name} vs. ${basePlayers.right.name} dynasty trade value`,
            description: shortAnswer,
            dateModified: base.meta.generatedAt,
            publisher: { "@id": `${SITE_URL}/#organization` },
            isPartOf: {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/player-comparisons#collection`,
              name: "Fantasy football player comparisons",
            },
            about: [
              playerSchema(basePlayers.left),
              playerSchema(basePlayers.right),
            ],
            mainEntity: {
              "@type": "ItemList",
              name: "Current dynasty Superflex comparison",
              numberOfItems: 2,
              itemListElement: [basePlayers.left, basePlayers.right]
                .sort((a, b) => b.value - a.value)
                .map((player, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: player.name,
                  url: `${SITE_URL}/players/${player.slug}`,
                  description: `${Math.round(player.value)} market value; overall rank ${player.rank ?? "unavailable"}.`,
                })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map(({ question, answer }) => ({
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
              { "@type": "ListItem", position: 2, name: "Player comparisons", item: `${SITE_URL}/player-comparisons` },
              { "@type": "ListItem", position: 3, name: `${basePlayers.left.name} vs. ${basePlayers.right.name}`, item: pageUrl },
            ],
          },
        ]}
      />

      <nav className="page-wrap pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#171c19]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/player-comparisons" className="hover:text-[#171c19]">Player comparisons</Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{basePlayers.left.name} vs. {basePlayers.right.name}</span>
      </nav>

      <section className="page-wrap py-10">
        <div className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[8px_8px_0_#171c19] sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow bg-white">Head-to-head // {comparison.position}</span>
            <span className="mono-label border border-[#171c19] px-3 py-2">
              Release {base.meta.releaseId}
            </span>
          </div>
          <h1 className="mt-8 max-w-6xl text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.86] tracking-[-0.075em]">
            {basePlayers.left.name} <span className="text-[#9b391d]">vs.</span> {basePlayers.right.name}
          </h1>
          <div className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5">
            <span className="mono-label">The short answer</span>
            <p className="mt-3 text-lg font-bold leading-8 sm:text-xl">{shortAnswer}</p>
          </div>
          <p className="mt-7 max-w-3xl text-sm leading-7 text-[#414842]">
            {comparison.editorialLens}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${basePlayers.right.slug}&give=${basePlayers.left.slug}`}
              analyticsEvent="comparison_calculator_opened"
              analyticsProperties={{ comparison_slug: comparison.slug, source: "comparison_hero" }}
              className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#ff6b3d]"
            >
              Price the complete trade →
            </TrackedLink>
            <Link
              href="#league-formats"
              className="border border-[#171c19] bg-white/70 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em]"
            >
              See where the answer changes ↓
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-px py-8 md:grid-cols-2">
        <PlayerValuePanel player={basePlayers.left} accent="bg-[#8bcfff]" />
        <PlayerValuePanel player={basePlayers.right} accent="bg-[#ffb29a]" />
      </section>

      <section id="league-formats" className="page-wrap scroll-mt-8 py-14">
        <SectionIntro
          eyebrow="Same players // four markets"
          title="What changes in Superflex, 1QB, TEP, and redraft?"
          copy="These rows change one major market context at a time. Hover or focus the dotted labels for a plain-language definition. Values share one 0–1,000 composite scale."
        />
        <ComparisonTable rows={formatRows} leftName={basePlayers.left.name} rightName={basePlayers.right.name} />
        <ResultNote>
          {formatSummary.flips
            ? "The leader changes across formats. There is no defensible format-free winner; use the row that matches your league."
            : `The same player leads all four markets, but the gap ranges from ${Math.round(formatSummary.minGap)} to ${Math.round(formatSummary.maxGap)} points. Format still changes the price.`}
        </ResultNote>
      </section>

      <section className="border-y border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14">
          <SectionIntro
            dark
            eyebrow={comparison.position === "QB" ? "Passing TD scoring // player-level" : "Reception scoring // player-level"}
            title={comparison.position === "QB" ? "Does 4-point vs. 6-point passing TD scoring change it?" : "Does standard, half PPR, or full PPR change it?"}
            copy={comparison.position === "QB"
              ? "The added passing-TD points are calculated from each player’s observed rate, then measured against a replacement quarterback. It is not a generic multiplier."
              : "PPR means points per reception: zero in standard, 0.5 in half PPR, and one in full PPR. Each adjustment is measured relative to a same-position replacement player."}
          />
          <ComparisonTable rows={scoringRows} leftName={basePlayers.left.name} rightName={basePlayers.right.name} dark />
          <div className="mt-5 border border-white/25 bg-white/10 p-5 text-sm leading-7 text-white/75">
            <strong className="text-[#dfff4f]">Scoring verdict:</strong> {scoringAnswer}
          </div>
        </div>
      </section>

      <section className="page-wrap py-16">
        <SectionIntro
          eyebrow={`Observed production // ${leftProfilePayload.data.stats?.season ?? rightProfilePayload.data.stats?.season ?? "latest season"}`}
          title="The evidence underneath the market answer."
          copy="These are descriptive season results, not projections. Missing upstream fields remain visibly unavailable instead of being guessed."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <ProductionPanel player={basePlayers.left} cards={leftProduction} />
          <ProductionPanel player={basePlayers.right} cards={rightProduction} />
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[#171c19] bg-[#d7b6ff] p-6 sm:p-8">
          <span className="mono-label">Decision rule</span>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.055em]">
            {sameTier ? "Treat the gap like a tiebreaker." : `Start with ${leader.name}'s edge.`}
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#414842]">{comparison.decisionFrame}</p>
          <p className="mt-4 text-sm leading-7 text-[#414842]">
            {straightUpAnswer} Injury status, starting-lineup need, and manager-specific preference are outside this model.
          </p>
        </div>
        <div>
          <span className="eyebrow">Direct answers</span>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.055em]">Comparison FAQ</h2>
          <div className="mt-7 divide-y divide-[#aaa69c] border-y border-[#aaa69c]">
            {faq.map(({ question, answer }) => (
              <article key={question} className="py-6">
                <h3 className="text-xl font-black tracking-[-0.025em]">{question}</h3>
                <p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap py-16">
        <div className="border-t border-[#171c19] pt-6">
          <span className="mono-label text-[#69706c]">Same-position decisions</span>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.055em]">Compare the rest of the tier.</h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <TrackedLink
              key={item.slug}
              href={`/player-comparisons/${item.slug}`}
              analyticsEvent="related_comparison_opened"
              analyticsProperties={{ source_comparison: comparison.slug, destination_comparison: item.slug }}
              className="border border-[#171c19] bg-white/60 p-5 hover:bg-[#8bcfff]"
            >
              <span className="mono-label">{item.position} // head-to-head</span>
              <h3 className="mt-5 text-xl font-black tracking-[-0.035em]">
                {item.left.name} vs. {item.right.name}
              </h3>
              <span className="mt-5 inline-block font-mono text-[10px] font-black uppercase">Open comparison →</span>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className="page-wrap py-14 text-center">
        <span className="mono-label text-[#69706c]">Next decision</span>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">
          Put both players in the full package.
        </h2>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <TrackedLink
            href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${basePlayers.right.slug}&give=${basePlayers.left.slug}`}
            analyticsEvent="comparison_calculator_opened"
            analyticsProperties={{ comparison_slug: comparison.slug, source: "comparison_footer" }}
            className="border border-[#171c19] bg-[#dfff4f] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em] shadow-[5px_5px_0_#171c19]"
          >
            Compare the complete trade →
          </TrackedLink>
          <Link
            href="/player-comparisons"
            className="border border-[#171c19] bg-white/60 px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em]"
          >
            All 24 comparisons →
          </Link>
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        <p className="max-w-6xl">
          <strong className="text-[#171c19]">Data note:</strong> Updated {updated} ET from validated release <span className="font-mono">{base.meta.releaseId}</span>. Values are composite market reference points attributed in <Link href="/data-sources" className="underline">data sources</Link>. Scoring and roster adjustments follow the deterministic <Link href="/methodology#league-scoring" className="underline">published methodology</Link>. This comparison does not include injury news, projections, accepted-trade distributions, or your league mates’ preferences.
        </p>
      </aside>
    </>
  );
}

function pairFromMarket(market: MarketPayload, leftSlug: string, rightSlug: string) {
  const left = market.assets.find((asset) => asset.kind === "player" && asset.slug === leftSlug);
  const right = market.assets.find((asset) => asset.kind === "player" && asset.slug === rightSlug);
  if (!left || !right) {
    throw new Error(`Comparison player missing from ${market.meta.releaseId}: ${leftSlug} vs ${rightSlug}`);
  }
  return { left, right };
}

function rowFromMarket(
  label: string,
  detail: string,
  market: MarketPayload,
  leftSlug: string,
  rightSlug: string,
): ComparisonRow {
  return { label, detail, ...pairFromMarket(market, leftSlug, rightSlug) };
}

function percentGap(left: MarketAsset, right: MarketAsset) {
  const maximum = Math.max(left.value, right.value);
  return maximum > 0 ? (Math.abs(left.value - right.value) / maximum) * 100 : 0;
}

function getLeader(left: MarketAsset, right: MarketAsset) {
  return left.value >= right.value ? left : right;
}

function summarizeRows(rows: ComparisonRow[]) {
  const gaps = rows.map((row) => Math.abs(row.left.value - row.right.value));
  const leaders = new Set(
    rows.map((row) => getLeader(row.left, row.right).slug),
  );
  return {
    flips: leaders.size > 1,
    minGap: Math.min(...gaps),
    maxGap: Math.max(...gaps),
  };
}

function playerSchema(player: MarketAsset) {
  return {
    "@type": "Person",
    name: player.name,
    jobTitle: `${player.position} football player`,
    url: `${SITE_URL}/players/${player.slug}`,
  };
}

function PlayerValuePanel({ player, accent }: { player: MarketAsset; accent: string }) {
  return (
    <article className={`border border-[#171c19] ${accent} p-6 sm:p-8`}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <span className="mono-label">Dynasty Superflex baseline</span>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em]">{player.name}</h2>
          <p className="mt-2 text-sm font-bold text-[#4b534e]">
            {player.team ?? "NFL"} · {player.position}{player.posRank ?? "—"} · age {player.age ?? "—"}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-5xl font-black tabular-nums">{Math.round(player.value)}</span>
          <span className="mt-1 block font-mono text-[10px] font-bold uppercase">#{player.rank ?? "—"} overall</span>
        </div>
      </div>
      <Link
        href={`/players/${player.slug}`}
        className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-[10px] font-black uppercase tracking-[0.08em]"
      >
        Open complete {player.name} file →
      </Link>
    </article>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.7fr] lg:items-end">
      <div>
        <span className={`eyebrow ${dark ? "bg-[#dfff4f] text-[#171c19]" : ""}`}>{eyebrow}</span>
        <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.055em] sm:text-5xl">{title}</h2>
      </div>
      <p className={`text-sm leading-7 ${dark ? "text-white/65" : "text-[#69706c]"}`}>{copy}</p>
    </div>
  );
}

function ComparisonTable({
  rows,
  leftName,
  rightName,
  dark = false,
}: {
  rows: ComparisonRow[];
  leftName: string;
  rightName: string;
  dark?: boolean;
}) {
  return (
    <div className={`overflow-x-auto border ${dark ? "border-white/30" : "border-[#171c19]"}`}>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className={dark ? "bg-white/10" : "bg-[#171c19] text-white"}>
          <tr className="font-mono text-[10px] font-black uppercase tracking-[0.07em]">
            <th scope="col" className="p-4">League setting</th>
            <th scope="col" className="p-4">{leftName}</th>
            <th scope="col" className="p-4">{rightName}</th>
            <th scope="col" className="p-4">Current answer</th>
          </tr>
        </thead>
        <tbody className={dark ? "divide-y divide-white/20" : "divide-y divide-[#aaa69c]"}>
          {rows.map((row) => {
            const leader = getLeader(row.left, row.right);
            const gap = Math.abs(row.left.value - row.right.value);
            const tied = percentGap(row.left, row.right) <= SAME_TIER_PERCENT;
            return (
              <tr key={row.label} className={dark ? "bg-[#171c19]" : "bg-white/55"}>
                <th scope="row" className="p-4">
                  <abbr title={row.detail} className="cursor-help text-sm font-black no-underline decoration-dotted hover:underline focus:underline">
                    {row.label} ⓘ
                  </abbr>
                  <span className={`mt-1 block max-w-xs text-[11px] font-normal leading-5 ${dark ? "text-white/55" : "text-[#69706c]"}`}>{row.detail}</span>
                </th>
                <td className="p-4 font-mono text-2xl font-black tabular-nums">{Math.round(row.left.value)}</td>
                <td className="p-4 font-mono text-2xl font-black tabular-nums">{Math.round(row.right.value)}</td>
                <td className="p-4 text-sm font-bold">
                  {tied ? "Same tier" : `${leader.name} +${Math.round(gap)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResultNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border border-[#171c19] bg-[#8bcfff] p-5 text-sm font-bold leading-7">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em]">Format verdict // </span>
      {children}
    </p>
  );
}

function ProductionPanel({
  player,
  cards,
}: {
  player: MarketAsset;
  cards: Array<{ label: string; value: unknown }>;
}) {
  return (
    <article className="paper-card p-5 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-3xl font-black tracking-[-0.045em]">{player.name}</h3>
        <span className="mono-label text-[#69706c]">{player.position}{player.posRank ?? "—"}</span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-px border border-[#171c19] bg-[#171c19]">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#f3f0e7] p-4">
            <dt className="mono-label text-[#69706c]">{card.label}</dt>
            <dd className="mt-2 text-2xl font-black">{formatMetric(card.value)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
