import { buildPageMetadata } from "../../lib/metadata";
import ScoringResearchPage, { type ScoringResearchConfig } from "../../components/ScoringResearchPage";

export const metadata = buildPageMetadata({
  title: "Half PPR Fantasy Football Trade Values",
  description: "Explore current Half PPR dynasty trade values, risers, and fallers with replacement-relative scoring adjustments.",
  path: "/scoring/half-ppr-trade-values",
});

const config: ScoringResearchConfig = {
  slug: "half-ppr-trade-values",
  eyebrow: "Scoring research // half PPR",
  title: "Half PPR trade values",
  accent: "between volume and efficiency.",
  description: "Half PPR awards 0.5 points per reception. These values show how that middle ground changes dynasty prices relative to the Full PPR market anchor.",
  intro: "Half PPR preserves some value for reception volume without rewarding every catch as heavily as Full PPR. FTT calculates the exact per-game change and then asks whether that change is better or worse than replacement at the same position.",
  settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0.5, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "ALL" },
  eligiblePositions: ["RB", "WR", "TE"],
  definitions: [["Half PPR", "Every reception adds 0.5 fantasy points."], ["Full PPR baseline", "The published market anchor awards one point per reception."], ["Replacement line", "Each player is compared with a same-position replacement for the selected lineup."], ["Confidence", "Short historical samples reduce the size of the market adjustment."]],
  faqs: [["What is Half PPR scoring?", "Half PPR means 0.5 points per reception. A six-catch game adds three reception points before receiving yards and touchdowns."], ["Is Half PPR closer to Standard or Full PPR?", "Mathematically it is exactly between them for reception points, but player value changes are not always halfway because replacement production and market caps also matter."], ["Why can a low-volume receiver rise?", "If the player loses fewer reception points than the replacement WR, the player’s value over replacement improves even though raw points decline."], ["Are rookie picks adjusted for Half PPR?", "No. Picks remain at the published market value because they do not have a current NFL production profile."]],
};

export default function Page() {
  return <ScoringResearchPage config={config} />;
}
