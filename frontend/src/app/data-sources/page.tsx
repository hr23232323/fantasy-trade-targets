import type { Metadata } from "next";
import PageHero from "../components/PageHero";

export const metadata: Metadata = {
  title: "Fantasy Football Data Sources & Update Schedule",
  description: "See the licensed data source, refresh cadence, caching policy, attribution, and planned fantasy football feeds behind Fantasy Trade Target.",
  alternates: { canonical: "/data-sources" },
};

export default function DataSourcesPage() {
  return (
    <>
      <PageHero eyebrow="Data sources" title="Useful data."
        accent="Clean provenance." description="The V1 source stack is deliberately small, attributable, and cheap to serve. New feeds will only land when their rights and update paths are clear." primaryHref="#current" primaryLabel="See current sources" />
      <section id="current" className="page-wrap py-8">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">
          <article className="bg-[#dfff4f] p-7 sm:p-10"><span className="mono-label">Live // V1</span><h2 className="mt-10 text-4xl font-black tracking-[-0.055em]">Tradyr public API</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Daily composite market values for dynasty, redraft, rookie players, and draft picks. Used under Tradyr’s public commercial-use terms with visible attribution. Cached for six hours at the application layer.</p><a href="https://api.tradyr.app/docs" target="_blank" rel="noopener noreferrer" className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase">Read official API docs ↗</a></article>
          <article className="bg-[#8bcfff] p-7 sm:p-10"><span className="mono-label">Local // V1</span><h2 className="mt-10 text-4xl font-black tracking-[-0.055em]">Trade engine</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Raw totals, roster-cost weights, verdict thresholds, share URLs, and balancing suggestions execute locally and deterministically. They do not require a model call or third-party trade-evaluation request.</p><a href="/methodology" className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase">Inspect the formula →</a></article>
        </div>
      </section>
      <section className="page-wrap py-20"><span className="eyebrow">Not in V1 // intentionally</span><h2 className="section-title mt-6 max-w-4xl">The roadmap is broad. The launch surface is not.</h2><div className="mt-10 grid border-l border-t border-[#171c19] sm:grid-cols-2 lg:grid-cols-4">{[['Sleeper league context','Scoring, roster slots, taxi, IR, picks, standings, and manager-specific needs.'],['Usage and production','nflverse stats, snaps, routes, targets, and scoring-normalized production.'],['Availability signals','Injuries, practice reports, transactions, depth charts, and verified news.'],['Game environment','Weather, betting context where permitted, travel, rest, and matchup inputs.']].map(([title,body]) => <article key={title} className="border-b border-r border-[#171c19] bg-white/30 p-6"><h3 className="text-lg font-black tracking-[-0.03em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#69706c]">{body}</p></article>)}</div></section>
    </>
  );
}
