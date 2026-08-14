import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { TrackedLink } from "../components/TrackedLink";
import { getMarket } from "../lib/market";
import {
  playerComparisons,
  type ComparisonPosition,
} from "../lib/player-comparisons";
import { buildPageMetadata } from "../lib/metadata";

const SITE_URL = "https://fantasytradetarget.com";
const positions: ComparisonPosition[] = ["QB", "RB", "WR", "TE"];

export const metadata = buildPageMetadata({
  title: "Fantasy Football Player Comparisons: Dynasty Value",
  description:
    "Compare 48 fantasy football players head to head across dynasty Superflex, 1QB, redraft, PPR, six-point passing TD, and tight end premium settings.",
  path: "/player-comparisons",
});

const faqs = [
  {
    question: "How should I compare two dynasty players?",
    answer:
      "Start with the dynasty market that matches your quarterback format, compare the value gap as a percentage rather than rank alone, and then check the scoring-specific table. A small gap means the players are trade peers; it does not create a precise required add.",
  },
  {
    question: "Can PPR scoring change which player is worth more?",
    answer:
      "Yes. Fantasy Trade Target recalculates each player from an observed per-game scoring profile and compares the change with same-position replacement. That can widen, narrow, or occasionally reverse a baseline value gap.",
  },
  {
    question: "Do six-point passing touchdowns change every quarterback equally?",
    answer:
      "No. The model uses each quarterback’s observed passing touchdown rate and subtracts the change for a replacement-level quarterback. It does not apply the same blanket multiplier to every QB.",
  },
  {
    question: "Does the higher-ranked player always win the comparison?",
    answer:
      "No. The higher current market value is the baseline answer, but 1QB scarcity, redraft horizon, reception scoring, and tight end premium can change the gap. Roster construction and risk preference still sit outside the model.",
  },
];

export default async function PlayerComparisonsPage() {
  const market = await getMarket({
    format: "dynasty",
    numQbs: 2,
    numTeams: 12,
    passingTdPoints: 4,
    receptionPoints: 1,
  });
  const players = new Map(
    market.assets
      .filter((asset) => asset.kind === "player")
      .map((asset) => [asset.slug, asset]),
  );
  const comparisons = playerComparisons.map((comparison) => ({
    ...comparison,
    left: players.get(comparison.leftSlug),
    right: players.get(comparison.rightSlug),
  }));
  const updated = new Date(market.meta.generatedAt).toLocaleDateString("en-US", {
    dateStyle: "long",
    timeZone: "America/New_York",
  });

  return (
    <>
      <AnalyticsPageView
        eventName="player_comparison_hub_viewed"
        properties={{
          release_id: market.meta.releaseId,
          comparison_count: comparisons.length,
          player_count: new Set(
            comparisons.flatMap(({ leftSlug, rightSlug }) => [leftSlug, rightSlug]),
          ).size,
        }}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/player-comparisons#collection`,
            name: "Fantasy football player comparisons",
            url: `${SITE_URL}/player-comparisons`,
            description:
              "Head-to-head fantasy football player value comparisons across league formats and scoring systems.",
            dateModified: market.meta.generatedAt,
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: comparisons.length,
              itemListElement: comparisons.map((comparison, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: `${comparison.left?.name} vs. ${comparison.right?.name}`,
                url: `${SITE_URL}/player-comparisons/${comparison.slug}`,
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
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Player comparisons",
                item: `${SITE_URL}/player-comparisons`,
              },
            ],
          },
        ]}
      />

      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">
            24 live decisions // updated {updated}
          </span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3.1rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">
            Player vs. player,
            <span className="block text-[#8bcfff]">with the settings on.</span>
          </h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">
            Compare 48 distinct players across dynasty Superflex, dynasty 1QB,
            tight end premium, and redraft—then measure the exact effect of
            standard, half-PPR, full-PPR, or six-point passing touchdowns. Every
            answer updates from the same validated market release.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href="#comparisons"
              analyticsEvent="comparison_navigation_clicked"
              analyticsProperties={{ source: "comparison_hub", destination: "comparison_index" }}
              className="border border-white bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] shadow-[4px_4px_0_#ff6b3d]"
            >
              Pick a matchup ↓
            </TrackedLink>
            <TrackedLink
              href="/scoring-impact"
              analyticsEvent="comparison_navigation_clicked"
              analyticsProperties={{ source: "comparison_hub", destination: "scoring_lab" }}
              className="border border-white/40 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] hover:bg-white hover:text-[#171c19]"
            >
              Test custom settings →
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-px py-12 md:grid-cols-3">
        <MethodCard
          label="01 // Same market"
          title="Start with comparable evidence."
          copy="Both players use the same release, format, league size, and composite scale. Rank is context, while the percentage gap measures the trade difference."
          accent="bg-[#dfff4f]"
        />
        <MethodCard
          label="02 // Player-level math"
          title="Change the scoring, not the story."
          copy="The scoring model uses observed per-game profiles and subtracts same-position replacement. Players do not receive generic PPR or passing-TD bumps."
          accent="bg-[#8bcfff]"
        />
        <MethodCard
          label="03 // Honest boundary"
          title="A market answer is not a forecast."
          copy="Injuries, lineup need, manager preference, and future outcomes remain outside the score. Close values should be treated as a tier, not false precision."
          accent="bg-[#ffb29a]"
        />
      </section>

      <section id="comparisons" className="page-wrap scroll-mt-8 py-10">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">Curated head-to-head index</span>
          <h2 className="section-title mt-5">Twenty-four decisions worth measuring.</h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#69706c]">
            Matchups were selected from meaningful current value neighborhoods,
            not generated as every possible name combination. No player appears
            twice, giving the collection 48 unique evidence profiles.
          </p>
        </div>

        <div className="mt-10 space-y-14">
          {positions.map((position) => {
            const positionComparisons = comparisons.filter(
              (comparison) => comparison.position === position,
            );
            return (
              <section key={position} aria-labelledby={`${position.toLowerCase()}-comparisons`}>
                <div className="mb-5 flex items-end justify-between gap-5 border-b border-[#171c19] pb-3">
                  <h3
                    id={`${position.toLowerCase()}-comparisons`}
                    className="text-3xl font-black tracking-[-0.045em]"
                  >
                    {position} comparisons
                  </h3>
                  <span className="mono-label text-[#69706c]">
                    {positionComparisons.length} matchups
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {positionComparisons.map((comparison, index) => {
                    if (!comparison.left || !comparison.right) return null;
                    const gap = Math.abs(
                      comparison.left.value - comparison.right.value,
                    );
                    return (
                      <TrackedLink
                        key={comparison.slug}
                        href={`/player-comparisons/${comparison.slug}`}
                        analyticsEvent="player_comparison_opened"
                        analyticsProperties={{
                          source: "comparison_hub",
                          comparison_slug: comparison.slug,
                          position,
                        }}
                        className={`group border border-[#171c19] p-5 transition-transform hover:-translate-y-1 ${
                          index % 3 === 0
                            ? "bg-[#dfff4f]"
                            : index % 3 === 1
                              ? "bg-[#8bcfff]"
                              : "bg-white/65"
                        }`}
                      >
                        <span className="mono-label text-[#535b56]">
                          Current Superflex gap // {Math.round(gap)}
                        </span>
                        <h4 className="mt-5 text-2xl font-black leading-tight tracking-[-0.04em]">
                          {comparison.left.name}
                          <span className="mx-2 font-mono text-sm font-black text-[#69706c]">vs.</span>
                          {comparison.right.name}
                        </h4>
                        <div className="mt-5 grid grid-cols-2 gap-px border border-[#171c19] bg-[#171c19] font-mono text-xs font-black">
                          <span className="bg-white/80 p-3">
                            {Math.round(comparison.left.value)} · #{comparison.left.rank}
                          </span>
                          <span className="bg-white/80 p-3 text-right">
                            #{comparison.right.rank} · {Math.round(comparison.right.value)}
                          </span>
                        </div>
                        <span className="mt-5 inline-block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">
                          Open the evidence →
                        </span>
                      </TrackedLink>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border border-[#171c19] bg-[#d7b6ff] p-6 sm:p-8">
          <span className="mono-label">How to read a close result</span>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.055em]">
            A tier is an answer.
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#414842]">
            If the value gap is less than roughly five percent and stays small
            across formats, the evidence does not support demanding a large add.
            Choose for roster need, timeline, and your own risk tolerance. The
            calculator remains useful for balancing a full package.
          </p>
          <Link
            href="/methodology"
            className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase"
          >
            Audit the model →
          </Link>
        </div>
        <div>
          <span className="eyebrow">Plain-language answers</span>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
            Comparison FAQ
          </h2>
          <div className="mt-7 divide-y divide-[#aaa69c] border-y border-[#aaa69c]">
            {faqs.map(({ question, answer }) => (
              <article key={question} className="py-6">
                <h3 className="text-xl font-black tracking-[-0.025em]">{question}</h3>
                <p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        <p className="max-w-5xl">
          <strong className="text-[#171c19]">Data note:</strong> Values are
          descriptive market evidence from release <span className="font-mono">{market.meta.releaseId}</span>.
          Read the <Link href="/data-sources" className="underline">source and freshness record</Link> and
          the <Link href="/methodology" className="underline">published methodology</Link> before using a
          small gap as a precise trade requirement.
        </p>
      </aside>
    </>
  );
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
    <article className={`border border-[#171c19] ${accent} p-6 sm:p-8`}>
      <span className="mono-label">{label}</span>
      <h2 className="mt-8 text-3xl font-black leading-tight tracking-[-0.045em]">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#414842]">{copy}</p>
    </article>
  );
}
