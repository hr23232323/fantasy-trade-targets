import Link from "next/link";
import PageHero from "../components/PageHero";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "About Fantasy Trade Target Research",
  description:
    "Learn why Fantasy Trade Target publishes transparent fantasy football market research, deterministic tools, and versioned data methods.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Fantasy Trade Target Research"
        title="Market evidence."
        accent="No mystery box."
        description="Fantasy Trade Target is an independent fantasy-football research product building transparent market references, historical player records, and deterministic trade tools."
        primaryHref="/players"
        primaryLabel="Open player research"
      />
      <section className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div><span className="eyebrow">Why this exists</span><h2 className="section-title mt-6">A source worth checking.</h2></div>
        <div className="space-y-5 text-base leading-8 text-[#59605c]">
          <p>Fantasy managers have no shortage of opinions. The harder problem is finding a current reference point that shows its source, its update time, and the exact rule used to reach a conclusion.</p>
          <p>We publish the market evidence first. Calculator verdicts remain deterministic. Missing league context, accepted-trade evidence, or injury information stays labeled missing instead of being filled with generated certainty.</p>
        </div>
      </section>
      <section className="page-wrap grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
        {[
          ["2024", "The original player-search and trade-target prototype began."],
          ["2026", "The product was rebuilt around licensed market data and a published deterministic calculator."],
          ["Now", "Player and team market files connect current values, historical records, on-field evidence, the NFL calendar, and transparent sourcing in one citable research system."],
        ].map(([year, body]) => <article key={year} className="bg-[#f3f0e7] p-7"><span className="font-mono text-3xl font-black text-[#ff6b3d]">{year}</span><p className="mt-6 text-sm leading-7 text-[#59605c]">{body}</p></article>)}
      </section>
      <section className="page-wrap py-16"><p className="max-w-3xl text-sm leading-7 text-[#59605c]">Fantasy Trade Target is independent and is not affiliated with the NFL, NFLPA, Sleeper, Tradyr, or another fantasy platform. Read the <Link href="/editorial-policy" className="font-bold underline decoration-[#ff6b3d] underline-offset-4">editorial policy</Link> and <Link href="/data-sources" className="font-bold underline decoration-[#ff6b3d] underline-offset-4">data sources</Link>.</p></section>
    </>
  );
}
