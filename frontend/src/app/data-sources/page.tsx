import PageHero from "../components/PageHero";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Fantasy Football Data Sources & Update Schedule",
  description: "See the licensed data source, refresh cadence, caching policy, attribution, and planned fantasy football feeds behind Fantasy Trade Target.",
  path: "/data-sources",
});

export default function DataSourcesPage() {
  return (
    <>
      <PageHero eyebrow="Data sources" title="Useful data."
        accent="Clean provenance." description="The source stack is deliberately small, attributable, and cheap to serve. New feeds only land when their rights, identifiers, and update paths are clear." primaryHref="#current" primaryLabel="See current sources" />
      <section id="current" className="page-wrap py-8">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2 xl:grid-cols-4">
          <article className="bg-[#dfff4f] p-7 sm:p-10"><span className="mono-label">Market // published daily</span><h2 className="mt-10 text-4xl font-black tracking-[-0.055em]">Tradyr public API</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Composite market values, ranks, attributed history when supplied, and raw season totals used by the transparent scoring adjustment. A scheduled publisher validates the licensed feed and packages the current release with the app.</p><a href="https://api.tradyr.app/docs" target="_blank" rel="noopener noreferrer" className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase">Read official API docs ↗</a></article>
          <article className="bg-[#d7b6ff] p-7 sm:p-10"><span className="mono-label">Teams // schedule + context</span><h2 className="mt-10 text-4xl font-black tracking-[-0.055em]">nflverse</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">All 32 teams, the complete current schedule, venues, rest, surfaces, and prior-season scoring results. FTT records source hashes and derives the visible matchup-temperature model under CC BY 4.0 attribution.</p><a href="https://github.com/nflverse/nflverse-data" target="_blank" rel="noopener noreferrer" className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase">Inspect the data project ↗</a></article>
          <article className="bg-[#8bcfff] p-7 sm:p-10"><span className="mono-label">Local // deterministic</span><h2 className="mt-10 text-4xl font-black tracking-[-0.055em]">Trade engine</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Scoring-relative player values, raw totals, roster-cost weights, verdict thresholds, share URLs, and balancing suggestions execute locally and deterministically. They do not require a model call or third-party trade-evaluation request.</p><a href="/methodology" className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase">Inspect the formula →</a></article>
          <article className="bg-[#ffb29a] p-7 sm:p-10"><span className="mono-label">Images // licensed</span><h2 className="mt-10 text-4xl font-black tracking-[-0.055em]">Wikimedia Commons</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Player pages and trade tools use Wikimedia API-selected images with reviewed Creative Commons terms. Every image record retains its creator, source file, and license; full credits appear on player profiles and trade receipts. Sleeper and ESPN image hotlinks are not used.</p><a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="mt-7 inline-block border-b-2 border-[#171c19] font-mono text-xs font-black uppercase">Visit Commons ↗</a></article>
        </div>
      </section>
      <section id="scoring-data" className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="eyebrow">Scoring adjustment // reproducible</span>
          <h2 className="section-title mt-6">Where the league-value change comes from.</h2>
        </div>
        <div>
          <p className="max-w-3xl text-sm leading-7 text-[#59605c]">
            Tradyr’s composite market is always the anchor. FTT combines that market with licensed raw season totals, calculates fantasy points under the selected rules, and adjusts only for the player’s change relative to replacement at the same position. No generated opinion or hidden projection changes the score.
          </p>
          <div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
            <article className="bg-[#dfff4f] p-6">
              <span className="mono-label">01 // Raw inputs</span>
              <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">Recent production</h3>
              <p className="mt-3 text-sm leading-6 text-[#3f453f]">Passing, rushing, receiving, turnover, and two-point-conversion totals from up to three recent seasons become confidence-weighted per-game profiles.</p>
            </article>
            <article className="bg-[#8bcfff] p-6">
              <span className="mono-label">02 // Your scoring</span>
              <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">Six clear choices</h3>
              <p className="mt-3 text-sm leading-6 text-[#3f453f]"><strong>PPR means points per reception.</strong> <strong>Passing TD:</strong> 4 or 6 points. <strong>Standard:</strong> 0 per catch. <strong>Half PPR:</strong> 0.5 per catch. <strong>Full PPR:</strong> 1 per catch. Yardage and touchdown scoring otherwise stays fixed.</p>
            </article>
            <article className="bg-[#ffb29a] p-6">
              <span className="mono-label">03 // Guardrails</span>
              <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">Market first</h3>
              <p className="mt-3 text-sm leading-6 text-[#3f453f]">The model compares each player with league-size replacement, scales for sample confidence, and caps movement at ±12% in dynasty or ±20% in redraft. Picks and players without usable profiles remain unchanged.</p>
            </article>
          </div>
          <div className="mt-5 border border-[#171c19] bg-white/45 p-5 text-sm leading-7 text-[#59605c]">
            <strong className="text-[#171c19]">Neutral baseline:</strong> 4-point passing touchdowns and Full PPR use the published market unchanged. A visible “+ / − league” label shows the difference between that base market and the selected scoring context.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/methodology#league-scoring" className="border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-white">Inspect the exact math →</a>
            <a href="/dynasty-trade-calculator" className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">Try the scoring controls →</a>
          </div>
        </div>
      </section>
      <section className="page-wrap py-8">
        <div className="border border-[#171c19] bg-[#171c19] p-7 text-white sm:p-10">
          <span className="mono-label text-[#dfff4f]">Historical market data // three captures daily</span>
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <h2 className="text-4xl font-black tracking-[-0.055em]">FTT market snapshots.</h2>
            <p className="text-sm leading-7 text-white/70">Player values and ranks are captured throughout the day, versioned, and retained for market movement, downloadable records, and long-term research.</p>
          </div>
        </div>
      </section>
      <section className="page-wrap py-8">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
          <article className="bg-[#dfff4f] p-7"><span className="mono-label">Current release</span><h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">Packaged with the application.</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">The latest validated market variants, compact scoring profiles, reviewed player profiles, and profile histories live in the versioned public release used by every server-rendered page and calculator.</p></article>
          <article className="bg-[#8bcfff] p-7"><span className="mono-label">Compact history</span><h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">One series per reviewed player.</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Timestamped value, overall rank, position rank, and release ID observations are retained chronologically and exposed through player and market downloads.</p></article>
          <article className="bg-[#ffb29a] p-7"><span className="mono-label">Full archive</span><h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">Every successful pull is preserved.</h2><p className="mt-4 text-sm leading-7 text-[#3f453f]">Complete market and pick variants are stored as compressed, append-only snapshots in the private build repository. Raw archives are not shipped in the production container and can move to immutable object storage without changing public URLs.</p></article>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/market" className="border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-white">Open current market →</a>
          <a href="/market/data.json" className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">Download public release ↓</a>
        </div>
      </section>
      <section className="page-wrap py-20"><span className="eyebrow">Next data layers</span><h2 className="section-title mt-6 max-w-4xl">Current evidence first. New evidence only when it is ready.</h2><div className="mt-10 grid border-l border-t border-[#171c19] sm:grid-cols-2 lg:grid-cols-4">{[['Sleeper league context','Scoring, roster slots, taxi, IR, picks, standings, and manager-specific needs.'],['Market-gap models','FTT-owned comparisons between market movement, opportunity, usage, and production.'],['Availability signals','Injuries, practice reports, transactions, depth charts, and verified news.'],['Accepted trades','An anonymized, rights-reviewed corpus of completed prices by format and league size.']].map(([title,body]) => <article key={title} className="border-b border-r border-[#171c19] bg-white/30 p-6"><h3 className="text-lg font-black tracking-[-0.03em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#69706c]">{body}</p></article>)}</div></section>
    </>
  );
}
