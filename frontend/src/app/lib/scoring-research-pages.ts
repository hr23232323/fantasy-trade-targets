import type { ScoringResearchConfig } from "../components/ScoringResearchPage";

export type ScoringResearchPageDefinition = ScoringResearchConfig & {
  metadataTitle: string;
  metadataDescription: string;
  cardTitle: string;
  cardDescription: string;
};

export const scoringResearchPages: ScoringResearchPageDefinition[] = [
  {
    slug: "redraft-6-point-passing-td-rankings",
    metadataTitle: "Redraft 6-Point Passing TD Quarterback Rankings",
    metadataDescription:
      "Current redraft quarterback values for six-point passing touchdown leagues, with replacement-relative risers, fallers, and rankings.",
    cardTitle: "Redraft 6-point passing TD rankings",
    cardDescription:
      "Current-season quarterback values when every passing touchdown scores six.",
    eyebrow: "Scoring research // redraft quarterbacks",
    title: "Redraft 6-point passing TD",
    accent: "quarterback rankings.",
    description:
      "Rank current-season quarterbacks for a six-point passing touchdown league. The board measures each passer against a redraft replacement quarterback instead of adding the same premium to every name.",
    intro:
      "Six-point passing touchdowns reward passing production more heavily, but redraft value still depends on the available replacement tier. Efficient touchdown passers can gain ground on quarterbacks whose fantasy edge comes primarily from rushing, while the market remains the starting point for every adjustment.",
    settings: { format: "redraft", numQbs: 1, tep: false, numTeams: 12, passingTdPoints: 6, receptionPoints: 1, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "QB" },
    eligiblePositions: ["QB"],
    definitions: [
      ["Redraft value", "The ranking measures current-season trade value rather than a multi-year dynasty window."],
      ["Six-point passing TD", "Each passing touchdown scores six points instead of the four-point baseline."],
      ["1QB replacement", "One starting quarterback per team sets a shallower replacement line than Superflex."],
      ["Market guardrail", "Redraft adjustments are confidence-weighted and capped at ±20%."],
    ],
    faqs: [
      ["Who gains value in six-point passing TD redraft leagues?", "Quarterbacks whose passing-touchdown production creates more value over replacement can gain relative to rushing-dependent alternatives. The table calculates that difference player by player."],
      ["Are these rest-of-season projections?", "No. They are current redraft market values adjusted with recorded production and replacement context, not a forecast of future touchdowns."],
      ["Does six-point passing TD scoring make every quarterback more valuable?", "Every passing touchdown scores more raw points, but relative trade value changes only when a quarterback gains more or less than the replacement option."],
      ["Should Superflex managers use this ranking?", "No. This page uses one-quarterback demand. Superflex managers should use the dynasty Superflex six-point page or open the scoring-impact lab with two quarterbacks selected."],
    ],
  },
  {
    slug: "1qb-6-point-passing-td-rankings",
    metadataTitle: "Dynasty 1QB 6-Point Passing TD Rankings",
    metadataDescription:
      "Dynasty quarterback trade values for 1QB leagues with six-point passing touchdowns, including value changes over replacement.",
    cardTitle: "Dynasty 1QB six-point rankings",
    cardDescription:
      "Long-term quarterback prices with one starter and six points per passing score.",
    eyebrow: "Scoring research // dynasty 1QB",
    title: "Dynasty 1QB six-point",
    accent: "passing TD values.",
    description:
      "See how six-point passing touchdowns affect dynasty quarterbacks when only one QB starts. This isolates passing efficiency from the much larger scarcity premium created by Superflex.",
    intro:
      "A 1QB league keeps the replacement quarterback close to the starting tier. That makes it especially important to measure the additional passing-touchdown production over replacement rather than assuming the six-point rule creates a universal quarterback premium.",
    settings: { format: "dynasty", numQbs: 1, tep: false, numTeams: 12, passingTdPoints: 6, receptionPoints: 1, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "QB" },
    eligiblePositions: ["QB"],
    definitions: [
      ["Dynasty window", "The market anchor prices long-term player value rather than this season alone."],
      ["1QB demand", "One quarterback starter per team keeps replacement closer to the top tier."],
      ["Passing adjustment", "Two extra points per passing touchdown are measured relative to that replacement line."],
      ["No blanket multiplier", "Quarterbacks move only when their production change differs from replacement."],
    ],
    faqs: [
      ["How valuable are quarterbacks in a dynasty 1QB league?", "Quarterbacks usually carry less scarcity value than they do in Superflex because every team needs only one starter. The current market and replacement line determine the exact gap."],
      ["Do six-point passing touchdowns fix the 1QB scarcity gap?", "No. The scoring rule changes weekly production, but it does not create the same starter demand as a second quarterback-eligible lineup spot."],
      ["Are rushing quarterbacks hurt by six-point passing touchdowns?", "They still score all rushing points. They can move down only in relative terms when pocket passers gain more passing-touchdown value over replacement."],
      ["Can I change the league size?", "Yes. Open the scoring-impact lab from this page and select 8, 10, 12, 14, or 16 teams along with your exact lineup settings."],
    ],
  },
  {
    slug: "standard-running-back-rankings",
    metadataTitle: "Standard Scoring Dynasty Running Back Rankings",
    metadataDescription:
      "Current dynasty running back values for Standard non-PPR leagues, with replacement-relative rankings, risers, and fallers.",
    cardTitle: "Standard running back rankings",
    cardDescription:
      "Dynasty RB values when receptions score zero and rushing production carries more weight.",
    eyebrow: "Scoring research // running backs",
    title: "Standard scoring",
    accent: "running back rankings.",
    description:
      "Rank dynasty running backs for leagues that award zero points per reception. The adjustment compares each back’s lost reception value with the production lost by a replacement RB.",
    intro:
      "Removing reception points does not simply penalize every pass-catching back by the same percentage. A player rises or falls according to how his rushing and receiving mix compares with the running back available at the replacement line.",
    settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "RB" },
    eligiblePositions: ["RB"],
    definitions: [
      ["Standard scoring", "Receptions score zero points; receiving yards and touchdowns still count."],
      ["Rushing profile", "Carries, rushing yards, and rushing touchdowns retain their normal scoring."],
      ["RB replacement", "Each player is compared with the running back at the selected lineup’s replacement rank."],
      ["Relative movement", "A back can rise even while losing raw points if replacement loses more."],
    ],
    faqs: [
      ["Which running backs gain value in Standard scoring?", "Backs whose advantage comes more from rushing yards and touchdowns than reception volume can gain relative value. The current table shows the measured result."],
      ["Do receiving yards still count in Standard leagues?", "Yes. Standard removes points for the catch itself; receiving yards and receiving touchdowns continue to score normally."],
      ["Why can a running back lose points but rise in value?", "Trade value is replacement-relative. If the replacement RB loses even more reception production, the player’s advantage at the position increases."],
      ["Does this ranking include rookie picks?", "No. The table ranks running backs with usable production profiles. Rookie picks remain unchanged because they do not have NFL production to score."],
    ],
  },
  {
    slug: "half-ppr-running-back-rankings",
    metadataTitle: "Half PPR Dynasty Running Back Rankings",
    metadataDescription:
      "Current Half PPR dynasty running back rankings with trade values, risers, fallers, and replacement-relative scoring context.",
    cardTitle: "Half PPR running back rankings",
    cardDescription:
      "Current dynasty RB prices when every reception adds half a point.",
    eyebrow: "Scoring research // Half PPR running backs",
    title: "Half PPR",
    accent: "running back rankings.",
    description:
      "Current dynasty running back values for Half PPR leagues. The model measures how each back’s reception adjustment compares with the same-position replacement option.",
    intro:
      "Half PPR keeps receiving work meaningful without granting the full point used by the market baseline. Running backs with different rushing and receiving profiles therefore move by different amounts, even when their overall market prices begin close together.",
    settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0.5, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "RB" },
    eligiblePositions: ["RB"],
    definitions: [
      ["Half PPR", "Each reception adds 0.5 fantasy points."],
      ["Full PPR anchor", "The published market begins from one point per reception."],
      ["Backfield comparison", "The selected RB is measured against replacement at the same position."],
      ["Confidence weighting", "Smaller or older production samples produce smaller adjustments."],
    ],
    faqs: [
      ["Who are the best running backs in Half PPR dynasty?", "The live ranking above combines the current dynasty market with Half PPR production over replacement. It updates when a validated market release is published."],
      ["Is Half PPR better for rushing running backs?", "It reduces the advantage created by reception volume, but the relative result still depends on how each back compares with replacement."],
      ["How different is Half PPR from Full PPR?", "Every catch is worth half a point less. The market effect varies with reception volume, replacement production, confidence, and the adjustment cap."],
      ["Does FLEX depth change these values?", "Yes. Additional FLEX demand can deepen replacement across RB, WR, and TE. Use the lab to match your exact lineup."],
    ],
  },
  {
    slug: "standard-wide-receiver-rankings",
    metadataTitle: "Standard Scoring Dynasty Wide Receiver Rankings",
    metadataDescription:
      "Current dynasty wide receiver rankings for Standard non-PPR leagues, using reception-free scoring and positional replacement.",
    cardTitle: "Standard wide receiver rankings",
    cardDescription:
      "Dynasty WR values without reception points, measured against replacement production.",
    eyebrow: "Scoring research // wide receivers",
    title: "Standard scoring",
    accent: "wide receiver rankings.",
    description:
      "Rank dynasty wide receivers for Standard scoring. Reception points disappear, while receiving yards and touchdowns remain and each WR is compared with positional replacement.",
    intro:
      "Target volume matters differently when a catch itself scores nothing. High-volume receivers may lose more raw points, but the trade-value result depends on whether they lose more or less than the replacement wide receiver in the same lineup.",
    settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "WR" },
    eligiblePositions: ["WR"],
    definitions: [
      ["Zero per catch", "A reception adds no points before yardage and touchdowns."],
      ["Yardage retained", "Every receiving yard continues to score 0.1 points."],
      ["WR replacement", "Three dedicated WR starters plus FLEX demand establish the comparison line."],
      ["Market first", "The scoring model adjusts the current market rather than replacing it."],
    ],
    faqs: [
      ["Which wide receivers are best in Standard scoring?", "Receivers who preserve more value through yards and touchdowns can gain relative to catch-dependent alternatives. Use the table’s league value rather than reception totals alone."],
      ["Are slot receivers always worse in Standard leagues?", "No. Role labels are not part of the formula. Recorded receptions, yards, touchdowns, replacement production, and confidence determine the adjustment."],
      ["Do receiving touchdowns score differently?", "No. Receiving touchdowns remain six points. This page changes only points per reception from the Full PPR baseline."],
      ["Why does roster depth matter for receiver value?", "More WR and FLEX starters push replacement deeper. A deeper replacement line can increase the advantage created by an elite receiver."],
    ],
  },
  {
    slug: "half-ppr-wide-receiver-rankings",
    metadataTitle: "Half PPR Dynasty Wide Receiver Rankings",
    metadataDescription:
      "Current Half PPR dynasty wide receiver rankings with trade values and reception-adjusted value over replacement.",
    cardTitle: "Half PPR wide receiver rankings",
    cardDescription:
      "Current dynasty WR prices with half a point per reception.",
    eyebrow: "Scoring research // Half PPR receivers",
    title: "Half PPR",
    accent: "wide receiver rankings.",
    description:
      "Current dynasty wide receiver values for Half PPR leagues, calculated from the market anchor and each receiver’s scoring change over positional replacement.",
    intro:
      "Half PPR narrows the reward for reception volume without removing it. The useful trade-value question is how much a receiver changes relative to the WR replacement option, not simply how many catches appear in his stat line.",
    settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0.5, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "WR" },
    eligiblePositions: ["WR"],
    definitions: [
      ["Half per catch", "Each reception contributes 0.5 fantasy points."],
      ["Full PPR anchor", "The neutral published market uses one point per reception."],
      ["Receiver demand", "Dedicated WR starters and FLEX demand determine replacement."],
      ["Auditable adjustment", "The table exposes base value, league value, change, and the VORP reason."],
    ],
    faqs: [
      ["How should I rank wide receivers in Half PPR?", "Start with the current market, then use the league-value column to account for reception scoring relative to the replacement receiver."],
      ["Do high-volume wide receivers lose value from Full PPR?", "They lose raw reception points, but their relative trade value falls only when that loss is worse than the loss at replacement."],
      ["Is Half PPR exactly halfway between Standard and PPR?", "The reception rule is halfway, but the final market adjustment also depends on replacement, confidence, roster shape, and caps."],
      ["Can this ranking model four starting wide receivers?", "Yes. Open the linked scoring-impact lab and change dedicated WR starters from three to four."],
    ],
  },
  {
    slug: "standard-tight-end-rankings",
    metadataTitle: "Standard Scoring Dynasty Tight End Rankings",
    metadataDescription:
      "Current dynasty tight end rankings for Standard non-PPR leagues, with trade values measured against tight end replacement.",
    cardTitle: "Standard tight end rankings",
    cardDescription:
      "Dynasty TE values when catches score zero and positional scarcity stays visible.",
    eyebrow: "Scoring research // tight ends",
    title: "Standard scoring",
    accent: "tight end rankings.",
    description:
      "Rank dynasty tight ends without points per reception. Receiving yards and touchdowns remain, and the adjustment compares every player with tight end replacement.",
    intro:
      "Tight end value combines a thin starting tier with uneven reception volume. Standard scoring removes the catch premium, but it does not erase positional scarcity; this board keeps those two effects separate.",
    settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "TE" },
    eligiblePositions: ["TE"],
    definitions: [
      ["Standard scoring", "Receptions score zero while yards and receiving touchdowns remain."],
      ["TE replacement", "The comparison uses the tight end available after dedicated starter demand."],
      ["Positional scarcity", "A shallow usable tier can preserve value even without reception points."],
      ["No TEP", "This page uses ordinary Standard scoring, not an extra tight end reception premium."],
    ],
    faqs: [
      ["Do tight ends matter less in Standard scoring?", "Reception volume receives less raw reward, but a scarce elite tight end can still create a meaningful advantage over positional replacement."],
      ["Is this a tight end premium ranking?", "No. It removes ordinary reception points and applies no separate TEP bonus. Use the lab for a premium market."],
      ["Do tight end touchdowns still count?", "Yes. Receiving touchdowns remain worth six points and receiving yards retain their normal value."],
      ["Why can a low-volume tight end rise?", "If the player loses fewer reception points than the replacement tight end, his relative advantage can improve."],
    ],
  },
  {
    slug: "half-ppr-tight-end-rankings",
    metadataTitle: "Half PPR Dynasty Tight End Rankings",
    metadataDescription:
      "Current Half PPR dynasty tight end rankings, trade values, risers, and fallers measured against positional replacement.",
    cardTitle: "Half PPR tight end rankings",
    cardDescription:
      "Current dynasty TE values when receptions add half a point.",
    eyebrow: "Scoring research // Half PPR tight ends",
    title: "Half PPR",
    accent: "tight end rankings.",
    description:
      "Current dynasty tight end values for Half PPR leagues. Each adjustment measures the player’s reception change against the tight end replacement line.",
    intro:
      "Half PPR reduces the catch premium while leaving tight end scarcity intact. The result can separate players with similar market values when their reception production differs meaningfully from the replacement option.",
    settings: { format: "dynasty", numQbs: 2, tep: false, numTeams: 12, passingTdPoints: 4, receptionPoints: 0.5, rbStarters: 2, wrStarters: 3, teStarters: 1, flexSpots: 1, position: "TE" },
    eligiblePositions: ["TE"],
    definitions: [
      ["Half PPR", "Each tight end reception scores 0.5 points."],
      ["Ordinary TE scoring", "No extra tight end premium is applied on this page."],
      ["Replacement line", "One dedicated tight end starter per team establishes the positional comparison."],
      ["Current market", "Every adjustment begins with the validated dynasty market release."],
    ],
    faqs: [
      ["Who are the best tight ends in Half PPR dynasty?", "The current ranking above combines market price with Half PPR production over replacement and updates with each validated release."],
      ["How is Half PPR different from tight end premium?", "Half PPR awards 0.5 points to every reception for every position. TEP adds a separate bonus specifically for tight ends."],
      ["Does reception volume still matter at tight end?", "Yes, but each catch is worth half as much as in Full PPR. Relative value depends on how the player’s volume compares with replacement."],
      ["Can two-TE leagues use this page?", "Use it as a starting point, then open the scoring-impact lab and select two dedicated tight end starters to deepen replacement."],
    ],
  },
];

export const scoringResearchPageSlugs = scoringResearchPages.map(
  (page) => page.slug,
);

export function getScoringResearchPage(slug: string) {
  return scoringResearchPages.find((page) => page.slug === slug);
}
