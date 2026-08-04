import PageHero from "../components/PageHero";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Trade Calculator Methodology",
  description: "See exactly how Fantasy Trade Target calculates raw value, roster cost, package-adjusted value, and trade verdict bands.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return (
    <>
      <PageHero eyebrow="Methodology // 2026.08.1" title="The calculator" accent="shows its work." description="No generated explanation and no mystery multiplier. These are the exact deterministic rules behind every current result." primaryHref="#formula" primaryLabel="See the formula" />
      <section id="formula" className="page-wrap grid gap-10 py-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="eyebrow">01 // Base values</span>
          <h2 className="section-title mt-6">One shared market scale.</h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-[#59605c]">
          <p>Every player and rookie pick enters the calculator on Tradyr’s 0–1000 composite market scale. The selected format—dynasty or redraft, 1QB or Superflex, and TE premium—determines which market set is loaded.</p>
          <p>The raw total is the simple sum of every asset on a side. It is shown for reference, but it is not the default verdict when roster cost is enabled.</p>
          <div className="border border-[#171c19] bg-[#171c19] p-6 font-mono text-sm font-bold text-[#dfff4f]">RAW SIDE VALUE = Σ ASSET MARKET SCORE</div>
        </div>
      </section>
      <section className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="eyebrow">02 // Roster cost</span>
          <h2 className="section-title mt-6">A dollar beats loose change.</h2>
        </div>
        <div>
          <p className="text-sm leading-7 text-[#59605c]">Assets are sorted from highest to lowest value. The best asset keeps 100% of its score. Additional pieces receive the weights below. Turn roster cost off to use a pure additive total.</p>
          <div className="mt-6 overflow-x-auto border border-[#171c19] bg-white/45">
            <table className="w-full min-w-[520px] text-left">
              <thead><tr className="border-b border-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em]"><th className="p-4">Piece</th><th className="p-4">Weight</th><th className="p-4">Reason</th></tr></thead>
              <tbody className="text-sm">
                {[['Best asset','100%','Sets the package anchor'],['2nd','90%','Small roster cost'],['3rd','84%','Replacement friction'],['4th','79%','Bench / cut pressure'],['5th','75%','Deep-package discount'],['6th+','72% → 68%','Diminishing practical utility']].map((row) => <tr key={row[0]} className="border-b border-[#c8c4b9] last:border-0"><td className="p-4 font-bold">{row[0]}</td><td className="p-4 font-mono font-black">{row[1]}</td><td className="p-4 text-[#69706c]">{row[2]}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div><span className="eyebrow">03 // Verdict bands</span><h2 className="section-title mt-6">A range, not fake precision.</h2></div>
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2">
          {[['0–4%','Fair trade'],['4–10%','Leans one side'],['10–18%','Clear edge'],['18%+','Strong edge']].map(([range,label]) => <div key={range} className="bg-[#f3f0e7] p-6"><span className="font-mono text-2xl font-black text-[#ff6b3d]">{range}</span><h3 className="mt-3 text-lg font-black">{label}</h3></div>)}
        </div>
      </section>
      <section className="page-wrap border-t border-[#171c19] py-14">
        <div className="max-w-3xl"><span className="eyebrow">Known limits</span><h2 className="section-title mt-6">What the model does not pretend to know.</h2><p className="mt-6 text-base leading-8 text-[#59605c]">The verdict does not yet model your exact scoring, starting lineup, standings, player exposure, injury tolerance, or another manager’s incentives. It is a transparent market baseline. League-aware Sleeper analysis is the next major product layer, and it will be labeled separately from the generic market calculation.</p></div>
      </section>
    </>
  );
}
