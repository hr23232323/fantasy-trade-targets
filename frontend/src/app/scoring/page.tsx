import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata } from "../lib/metadata";
import { scoringResearchPages } from "../lib/scoring-research-pages";

const SITE_URL = "https://fantasytradetarget.com";

const establishedPages = [
  {
    slug: "6-point-passing-td-rankings",
    title: "6-point passing TD rankings",
    description:
      "Dynasty Superflex quarterback rankings for leagues that award six points per passing touchdown.",
  },
  {
    slug: "half-ppr-trade-values",
    title: "Half PPR trade values",
    description:
      "Cross-position dynasty trade values with half a point for every reception.",
  },
  {
    slug: "standard-vs-ppr-player-values",
    title: "Standard vs. PPR player values",
    description:
      "See how removing reception points changes RB, WR, and TE values over replacement.",
  },
];

const pages = [
  ...establishedPages,
  ...scoringResearchPages.map((page) => ({
    slug: page.slug,
    title: page.cardTitle,
    description: page.cardDescription,
  })),
];

export const metadata = buildPageMetadata({
  title: "Fantasy Football Scoring Rankings & Trade Values",
  description:
    "Fantasy football rankings and dynasty trade values for 6-point passing TD, Standard, Half PPR, 1QB, Superflex, RB, WR, and TE formats.",
  path: "/scoring",
});

export default function ScoringHubPage() {
  return (
    <>
      <AnalyticsPageView
        eventName="scoring_research_hub_viewed"
        properties={{ scoring_page_count: pages.length }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/scoring#collection`,
          name: "Fantasy football scoring rankings and trade values",
          url: `${SITE_URL}/scoring`,
          description:
            "Replacement-relative fantasy football rankings for common passing touchdown and reception scoring formats.",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: pages.length,
            itemListElement: pages.map((page, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: page.title,
              url: `${SITE_URL}/scoring/${page.slug}`,
            })),
          },
        }}
      />

      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">
            Scoring research // {pages.length} live boards
          </span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3.1rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">
            Your scoring changes
            <span className="block text-[#8bcfff]">what replacement means.</span>
          </h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">
            Find the ranking that matches your league, then open the scoring
            impact lab to change starters, FLEX depth, league size, and format.
            Every board starts with the current market and adjusts only for a
            player&apos;s scoring change relative to positional replacement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#rankings" className="border border-white bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] shadow-[4px_4px_0_#ff6b3d]">
              Choose a ranking ↓
            </Link>
            <Link href="/scoring-impact" className="border border-white/40 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] hover:bg-white hover:text-[#171c19]">
              Set exact league rules →
            </Link>
          </div>
        </div>
      </section>

      <section id="rankings" className="page-wrap scroll-mt-8 py-14">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">Current ranking library</span>
          <h2 className="section-title mt-5">One question per board.</h2>
          <p className="mt-5 text-sm leading-7 text-[#69706c]">
            The broad pages compare scoring systems. Position pages narrow the
            replacement pool so you can answer an RB, WR, TE, or QB decision
            without mixing unrelated scarcity.
          </p>
        </div>
        <div className="mt-10 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page, index) => (
            <Link
              key={page.slug}
              href={`/scoring/${page.slug}`}
              className={`group min-h-60 p-6 transition-colors hover:bg-white ${
                index % 3 === 0
                  ? "bg-[#dfff4f]"
                  : index % 3 === 1
                    ? "bg-[#8bcfff]"
                    : "bg-[#f3f0e7]"
              }`}
            >
              <span className="mono-label text-[#59605c]">
                Board {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 text-3xl font-black tracking-[-0.05em]">
                {page.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#59605c]">
                {page.description}
              </p>
              <span className="mt-8 block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">
                Open live rankings →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-wrap grid gap-8 border-t border-[#171c19] py-14 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <span className="eyebrow">What the values mean</span>
          <h2 className="section-title mt-6">Scoring is relative.</h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-[#59605c]">
          <p><strong className="text-[#171c19]">Market first:</strong> the current market remains the anchor. A scoring rule changes a player only when his production changes differently from replacement.</p>
          <p><strong className="text-[#171c19]">Position by position:</strong> quarterbacks, running backs, wide receivers, and tight ends each use their own replacement line.</p>
          <p><strong className="text-[#171c19]">Roster-aware:</strong> dedicated starters and FLEX demand determine how deep replacement sits. The linked lab exposes every supported control.</p>
          <p><strong className="text-[#171c19]">Bounded:</strong> confidence weighting and adjustment caps keep historical scoring evidence from replacing the underlying market.</p>
        </div>
      </section>
    </>
  );
}
