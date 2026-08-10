import PageHero from "../components/PageHero";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Fantasy Trade Value & Matchup Methodology",
  description: "See exactly how Fantasy Trade Target adjusts market value for 4- or 6-point passing touchdowns, standard through full PPR, roster cost, and verdict bands.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return (
    <>
      <PageHero eyebrow="Methodology // 2026.08.2" title="The calculator" accent="shows its work." description="No generated explanation and no mystery multiplier. These are the exact deterministic rules behind every current result." primaryHref="#formula" primaryLabel="See the formula" />
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
      <section id="league-scoring" className="page-wrap grid scroll-mt-24 gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="eyebrow">02 // League scoring</span>
          <h2 className="section-title mt-6">Change value, not just points.</h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-[#59605c]">
          <p>The published market is the anchor. Full PPR with four points per passing touchdown is the neutral baseline. Selecting six-point passing touchdowns, half PPR, or standard scoring re-prices players by how their fantasy production changes relative to a replacement-level player at the same position. Picks remain unchanged.</p>
          <p><strong>PPR means points per reception.</strong> The three supported reception settings are:</p>
          <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-3">
            {[["Standard", "0 points per reception"], ["Half PPR", "0.5 points per reception"], ["Full PPR", "1 point per reception"]].map(([name, definition]) => <div key={name} className="bg-[#f3f0e7] p-4"><strong className="block text-[#171c19]">{name}</strong><span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#69706c]">{definition}</span></div>)}
          </div>
          <p>Player scoring profiles use per-game NFL totals from up to three recent seasons. The newest season receives weight 1.00, then 0.55 and 0.30. Short samples receive less weight, and the final market adjustment is reduced when fewer than 17 weighted games are available.</p>
          <div className="border border-[#171c19] bg-[#171c19] p-6 font-mono text-xs font-bold leading-6 text-[#dfff4f] sm:text-sm">
            FANTASY POINTS = PASS YDS × 0.04 + PASS TD × (4 OR 6) − INT × 2<br />
            + RUSH YDS × 0.10 + RUSH TD × 6<br />
            + RECEPTIONS × (0, 0.5, OR 1) + REC YDS × 0.10 + REC TD × 6<br />
            − FUMBLES LOST × 2 + TWO-POINT CONVERSIONS × 2
          </div>
          <p>Replacement ranks are based on the selected league size and quarterback format: one or two quarterbacks, two running backs, three wide receivers, and one tight end per team. Each replacement baseline is the median of up to five modeled players nearest that positional rank.</p>
          <div className="border border-[#171c19] bg-white/45 p-6 font-mono text-xs font-bold leading-6 text-[#171c19] sm:text-sm">
            ΔVORP = (SELECTED PLAYER PPG − SELECTED REPLACEMENT PPG)<br />
            − (BASELINE PLAYER PPG − BASELINE REPLACEMENT PPG)<br /><br />
            VALUE SHIFT = ΔVORP ÷ POSITION SPREAD × FORMAT CAP × SAMPLE CONFIDENCE
          </div>
          <p>The position spread is the 75th percentile of positive starter value over replacement, with a two-point floor. To keep market evidence dominant, shifts are capped at ±12% in dynasty and ±20% in redraft. Players without a usable profile keep their original market value.</p>
        </div>
      </section>
      <section className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="eyebrow">03 // Roster cost</span>
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
        <div><span className="eyebrow">04 // Verdict bands</span><h2 className="section-title mt-6">A range, not fake precision.</h2></div>
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2">
          {[['0–4%','Fair trade'],['4–10%','Leans one side'],['10–18%','Clear edge'],['18%+','Strong edge']].map(([range,label]) => <div key={range} className="bg-[#f3f0e7] p-6"><span className="font-mono text-2xl font-black text-[#ff6b3d]">{range}</span><h3 className="mt-3 text-lg font-black">{label}</h3></div>)}
        </div>
      </section>
      <section className="page-wrap grid gap-10 border-t border-[#171c19] py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div><span className="eyebrow">05 // Matchup temperature</span><h2 className="section-title mt-6">The calendar, with a visible baseline.</h2></div>
        <div className="space-y-5 text-sm leading-7 text-[#59605c]">
          <p>Team pages grade each scheduled game from 0 to 100. The largest input is the opponent&apos;s prior-season NFL scoring-defense rank: No. 1 allowed the fewest points and creates the cold end of the scale; No. 32 allowed the most and creates the hot end.</p>
          <div className="border border-[#171c19] bg-[#171c19] p-6 font-mono text-xs font-bold leading-6 text-[#dfff4f] sm:text-sm">
            SCORE = 50 + (DEFENSE RANK − 16.5) × 2.35<br />
            + SITE (HOME +4 · AWAY −2 · NEUTRAL 0)<br />
            + REST DIFFERENCE (CAPPED AT ±4 DAYS) × 1.25<br />
            FINAL SCORE = CLAMPED TO 0–100
          </div>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px] font-black uppercase text-[#171c19]">
            <span className="bg-[#d7b6ff] px-1 py-3">Cold<br />0–31</span>
            <span className="bg-[#8bcfff] px-1 py-3">Cool<br />32–43</span>
            <span className="bg-[#dfff4f] px-1 py-3">Balanced<br />44–56</span>
            <span className="bg-[#ffb29a] px-1 py-3">Warm<br />57–67</span>
            <span className="bg-[#ff6b3d] px-1 py-3">Hot<br />68–100</span>
          </div>
          <p>The score describes an overall scoring environment. It does not include positional fantasy points allowed, current injuries, depth-chart changes, weather, or player usage, so it is never presented as a start/sit projection.</p>
        </div>
      </section>
      <section className="page-wrap border-t border-[#171c19] py-14">
        <div className="max-w-3xl"><span className="eyebrow">Known limits</span><h2 className="section-title mt-6">What the model does not pretend to know.</h2><p className="mt-6 text-base leading-8 text-[#59605c]">Scoring adjustments are a historical scoring fit, not a projection of future games. This release models only four- versus six-point passing touchdowns and standard, half, or full PPR; it does not yet model yardage bonuses, first downs, custom turnovers, starting flex slots, standings, player exposure, injury tolerance, or another manager’s incentives. The result remains a transparent market baseline, with league-aware Sleeper analysis labeled separately when it arrives.</p></div>
      </section>
    </>
  );
}
