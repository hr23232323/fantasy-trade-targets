import { buildPageMetadata } from "../../lib/metadata";
import ScoringResearchPage, { type ScoringResearchConfig } from "../../components/ScoringResearchPage";

export const metadata = buildPageMetadata({
  title: "6-Point Passing TD Fantasy Football Rankings",
  description: "See which dynasty quarterbacks gain or lose trade value in leagues that award six points per passing touchdown instead of four.",
  path: "/scoring/6-point-passing-td-rankings",
});

const config: ScoringResearchConfig = {
  slug: "6-point-passing-td-rankings",
  eyebrow: "Scoring research // quarterbacks",
  title: "6-point passing TD",
  accent: "rankings that account for replacement.",
  description: "Six-point passing touchdowns do not simply add the same value to every quarterback. The useful question is how much more passing-TD production a QB creates than the replacement option in your league.",
  intro: "The raw rule adds two fantasy points to every passing touchdown. FTT then compares each quarterback’s selected-scoring points per game with the replacement QB for the chosen league format. Quarterbacks whose value comes disproportionately from rushing can gain less than efficient, high-volume touchdown passers.",
  settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 6, receptionPoints: 1, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "QB" },
  eligiblePositions: ["QB"],
  definitions: [["4-point baseline", "The published market remains the neutral starting point."], ["6-point adjustment", "Two additional points per passing TD are measured relative to QB replacement."], ["Superflex replacement", "Roughly two quarterbacks per team are treated as starter demand."], ["Market guardrail", "Dynasty adjustments are confidence-weighted and capped at ±12%."]],
  faqs: [["Do all quarterbacks gain value in six-point passing TD leagues?", "No. Every passing touchdown scores more raw points, but trade value depends on how the quarterback’s passing-TD rate compares with replacement. Some rushing-heavy quarterbacks can gain less or move slightly down relative to the market."], ["Why does Superflex matter?", "Superflex pushes quarterback replacement much deeper because roughly twice as many QBs are startable. The page uses the Superflex market and replacement line together."], ["Are these projections?", "No. The adjustment is a confidence-weighted historical scoring fit built on the published market, not a forecast of future touchdowns."], ["Do interceptions and rushing touchdowns still count?", "Yes. Interceptions remain minus two, rushing touchdowns remain six, and passing yardage remains 0.04 points per yard in the published formula."]],
};

export default function Page() {
  return <ScoringResearchPage config={config} />;
}
