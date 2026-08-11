import { buildPageMetadata } from "../../lib/metadata";
import ScoringResearchPage, { type ScoringResearchConfig } from "../../components/ScoringResearchPage";

export const metadata = buildPageMetadata({
  title: "Standard vs. PPR Fantasy Football Player Values",
  description: "Compare dynasty player and trade values between Standard scoring and Full PPR using replacement-relative production.",
  path: "/scoring/standard-vs-ppr-player-values",
});

const config: ScoringResearchConfig = {
  slug: "standard-vs-ppr-player-values",
  eyebrow: "Scoring research // receptions",
  title: "Standard vs. PPR",
  accent: "player values with context.",
  description: "Standard leagues award zero points per reception; Full PPR awards one. The value difference depends on reception volume relative to the replacement player at each position—not catches alone.",
  intro: "Removing reception points reduces raw scoring for pass catchers, but the market effect is positional. A receiver with fewer catches can gain relative value if the replacement WR loses even more, while a high-volume receiving back may lose an advantage that Full PPR rewards.",
  settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "ALL" },
  eligiblePositions: ["RB", "WR", "TE"],
  definitions: [["Standard", "Zero fantasy points are awarded for each reception."], ["Full PPR baseline", "One point per reception anchors the published market adjustment."], ["Unchanged scoring", "Receiving yards still score 0.1 per yard and receiving touchdowns still score six."], ["Relative value", "The model compares each player’s loss with replacement at the same position."]],
  faqs: [["What does PPR mean?", "PPR means points per reception. Full PPR awards one point for every catch, Half PPR awards 0.5, and Standard awards zero."], ["Do wide receivers always lose value in Standard scoring?", "Not equally. Reception-heavy players generally lose more raw points, but relative trade value depends on how their change compares with the replacement WR."], ["Which running backs are helped by Standard scoring?", "Backs whose value comes more from rushing yards and touchdowns than catch volume can improve relative to receiving-dependent alternatives."], ["Does Standard scoring change receiving yards or touchdowns?", "No. Only reception points change in this comparison; yardage and touchdown rules stay fixed."]],
};

export default function Page() {
  return <ScoringResearchPage config={config} />;
}
