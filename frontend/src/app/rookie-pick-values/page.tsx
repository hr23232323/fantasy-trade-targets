import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { TrackedLink } from "../components/TrackedLink";
import { getMarketReleaseInfo, getPickMarket } from "../lib/market";
import { buildPageMetadata } from "../lib/metadata";
import { rookiePickPages } from "../lib/rookie-picks";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "2027 Dynasty Rookie Pick Values: 1QB & Superflex",
  description:
    "Research every 2027 first- and second-round rookie pick with current 1QB and Superflex values, league-size context, player equivalents, history, and downloadable data.",
  path: "/rookie-pick-values",
});

const faqs = [
  {
    question: "How much is a 2027 rookie pick worth in dynasty?",
    answer:
      "It depends on the exact slot, quarterback format, and league size. This index publishes separate current 1QB and Superflex values for picks 1.01 through 2.12, then each pick file shows the five supported league sizes and closest player equivalents.",
  },
  {
    question: "Why are exact rookie picks better than early, mid, and late labels?",
    answer:
      "Exact slots expose value cliffs that a broad early-or-mid tier can hide. They also prevent pick 1.03 and pick 1.10 from being treated as interchangeable simply because both are first-round selections.",
  },
  {
    question: "Are 1QB and Superflex rookie pick values the same?",
    answer:
      "No. FTT loads separate observed pick markets for each format because quarterback scarcity changes rookie demand. The pages show both values side by side instead of applying one generic adjustment.",
  },
  {
    question: "Do these pages rank the 2027 rookie class?",
    answer:
      "No. They price future draft slots in the current dynasty market. They do not assign prospects to selections or predict class strength, landing spots, injuries, or NFL outcomes.",
  },
];

export default function RookiePickValuesPage() {
  const oneQb = getPickMarket({ numQbs: 1, numTeams: 12 });
  const superflex = getPickMarket({ numQbs: 2, numTeams: 12 });
  const release = getMarketReleaseInfo();
  const oneQbById = new Map(oneQb.assets.map((pick) => [pick.id, pick]));
  const superflexById = new Map(superflex.assets.map((pick) => [pick.id, pick]));
  const picks = rookiePickPages.map((page) => ({
    ...page,
    oneQb: oneQbById.get(page.id)!,
    superflex: superflexById.get(page.id)!,
  }));
  const updated = new Date(release.capturedAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/New_York",
  });

  return (
    <>
      <AnalyticsPageView
        eventName="rookie_pick_hub_viewed"
        properties={{
          pick_count: picks.length,
          release_id: release.releaseId,
          year: 2027,
          rounds: "1,2",
        }}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/rookie-pick-values#collection`,
            name: "2027 dynasty rookie pick values",
            url: `${SITE_URL}/rookie-pick-values`,
            description:
              "Current exact-slot dynasty rookie pick values for 1QB and Superflex leagues, with league-size context and historical observations.",
            dateModified: release.capturedAt,
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: picks.length,
              itemListElement: picks.map((pick, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: pick.superflex.name,
                url: `${SITE_URL}/rookie-pick-values/${pick.slug}`,
                description: `${pick.superflex.value} Superflex value and ${pick.oneQb.value} 1QB value in a 12-team league.`,
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
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Rookie pick values", item: `${SITE_URL}/rookie-pick-values` },
            ],
          },
        ]}
      />

      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">24 exact pick files // updated {updated}</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3.1rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">
            2027 rookie picks,
            <span className="block text-[#8bcfff]">priced slot by slot.</span>
          </h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">
            Research every first- and second-round selection as its own asset. Each file compares 1QB with Superflex, checks 8- through 16-team leagues, finds current player and cross-year equivalents, measures adjacent-pick cliffs, and publishes its dated market history.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink href="#pick-index" analyticsEvent="rookie_pick_navigation_clicked" analyticsProperties={{ source: "rookie_pick_hub", destination: "pick_index" }} className="border border-white bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] shadow-[4px_4px_0_#ff6b3d]">Choose an exact pick ↓</TrackedLink>
            <TrackedLink href="/dynasty-trade-calculator" analyticsEvent="rookie_pick_navigation_clicked" analyticsProperties={{ source: "rookie_pick_hub", destination: "calculator" }} className="border border-white/40 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] hover:bg-white hover:text-[#171c19]">Price a complete offer →</TrackedLink>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-px py-12 md:grid-cols-3">
        <MethodCard label="01 // Exact slot" title="Find the value cliff." copy="The table preserves 1.01, 1.02, and every later slot as distinct assets. Broad early/mid/late labels can hide the marginal price of moving one selection." accent="bg-[#dfff4f]" />
        <MethodCard label="02 // Real settings" title="Match the league." copy="Every pick file separates 1QB and Superflex, then checks 8-, 10-, 12-, 14-, and 16-team markets. Invalid round slots are labeled instead of invented." accent="bg-[#8bcfff]" />
        <MethodCard label="03 // Known boundary" title="Price is not destiny." copy="The value belongs to the draft slot before the player is known. No page pretends to predict a prospect, landing spot, or future NFL outcome." accent="bg-[#ffb29a]" />
      </section>

      <section id="pick-index" className="page-wrap scroll-mt-8 py-10">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">12-team index // 1QB and Superflex</span>
          <h2 className="section-title mt-5">Two rounds. Twenty-four evidence files.</h2>
          <p className="mt-5 text-sm leading-7 text-[#69706c]">The displayed values are the current 12-team baseline. Open any selection for league-size pricing, value neighbors, trade-up/down math, historical captures, FAQs, and downloadable records.</p>
        </div>
        {[1, 2].map((round) => (
          <section key={round} className="mt-12" aria-labelledby={`round-${round}-title`}>
            <div className="mb-5 flex items-end justify-between border-b border-[#171c19] pb-3">
              <h3 id={`round-${round}-title`} className="text-3xl font-black tracking-[-0.045em]">Round {round}</h3>
              <span className="mono-label text-[#69706c]">12 exact selections</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {picks.filter((pick) => pick.superflex.round === round).map((pick, index) => (
                <TrackedLink
                  key={pick.id}
                  href={`/rookie-pick-values/${pick.slug}`}
                  analyticsEvent="rookie_pick_opened"
                  analyticsProperties={{ source: "rookie_pick_hub", pick_id: pick.id, round }}
                  className={`group border border-[#171c19] p-5 transition-transform hover:-translate-y-1 ${index % 3 === 0 ? "bg-[#dfff4f]" : index % 3 === 1 ? "bg-[#8bcfff]" : "bg-white/55"}`}
                >
                  <div className="flex items-start justify-between gap-5"><strong className="text-3xl tracking-[-0.055em]">{pick.superflex.name.replace("2027 Pick ", "")}</strong><span className="font-mono text-[9px] font-black uppercase">Open file ↗</span></div>
                  <div className="mt-7 grid grid-cols-2 gap-3 border-t border-[#171c19]/30 pt-4 text-sm"><span><small className="block font-mono text-[9px] font-black uppercase text-[#69706c]">Superflex</small><strong className="text-xl">{pick.superflex.value}</strong></span><span><small className="block font-mono text-[9px] font-black uppercase text-[#69706c]">1QB</small><strong className="text-xl">{pick.oneQb.value}</strong></span></div>
                </TrackedLink>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div><span className="eyebrow">How to use the files</span><h2 className="section-title mt-6">Answer one decision at a time.</h2></div>
        <div className="space-y-5 text-sm leading-7 text-[#59605c]">
          <p><strong className="text-[#171c19]">Trading the pick for a player:</strong> start with the player-equivalent list in your quarterback format, then account for your timeline and the pick&apos;s unresolved outcome.</p>
          <p><strong className="text-[#171c19]">Moving within the draft:</strong> use the adjacent-pick gap to see the current marginal value of one slot. Do not treat it as a mandatory add; league-mate demand remains outside the model.</p>
          <p><strong className="text-[#171c19]">Comparing future classes:</strong> use the cross-year match to identify the closest current price, while keeping the uncertainty and time-to-use of each asset visible.</p>
          <Link href="/methodology#rookie-pick-values" className="inline-block border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-white shadow-[4px_4px_0_#dfff4f]">Read the exact methodology →</Link>
        </div>
      </section>

      <section className="page-wrap py-10" aria-labelledby="rookie-pick-faq-title">
        <span className="eyebrow">Direct answers</span>
        <h2 id="rookie-pick-faq-title" className="section-title mt-5">Rookie pick value FAQ.</h2>
        <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
          {faqs.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h3 className="text-lg font-black">{question}</h3><p className="mt-3 text-sm leading-7 text-[#59605c]">{answer}</p></article>)}
        </div>
      </section>
    </>
  );
}

function MethodCard({ label, title, copy, accent }: { label: string; title: string; copy: string; accent: string }) {
  return <article className={`${accent} border border-[#171c19] p-6`}><span className="mono-label">{label}</span><h2 className="mt-7 text-2xl font-black tracking-[-0.045em]">{title}</h2><p className="mt-3 text-sm leading-6 text-[#414842]">{copy}</p></article>;
}
