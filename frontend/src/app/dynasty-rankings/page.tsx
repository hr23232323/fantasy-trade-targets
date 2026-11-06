import FaqBlock from "../components/FaqBlock";
import PageHero from "../components/PageHero";
import ServerRankings from "../components/ServerRankings";
import { buildPageMetadata } from "../lib/metadata";
import { getMarket } from "../lib/market";

export const metadata = buildPageMetadata({
  title: "2026 Dynasty Fantasy Football Rankings — Superflex & 1QB",
  description:
    "Current 2026 dynasty rankings for Superflex and 1QB leagues. Compare every quarterback, running back, wide receiver, tight end and exact 2027 rookie pick.",
  path: "/dynasty-rankings",
});

const faqs = [
  {
    question: "Are these dynasty rankings for startups or trades?",
    answer:
      "They are market-value rankings, so they are useful for both startup orientation and trade research. Startup strategy can differ because roster construction and positional runs affect the draft room.",
  },
  {
    question: "Do the rankings include rookies and picks?",
    answer:
      "Yes. Established players and exact rookie-pick slots appear on the same market scale, which helps compare veterans with draft capital.",
  },
  {
    question: "How often are the rankings updated?",
    answer:
      "The latest successful release timestamp appears above the rankings. A failed, stale, or invalid refresh does not replace the last validated market.",
  },
];

export default async function DynastyRankingsPage() {
  const market = await getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 });
  const playerCount = market.assets.filter((asset) => asset.kind === "player").length;
  const pickCount = market.assets.filter((asset) => asset.kind === "pick").length;
  return (
    <>
      <PageHero
        eyebrow="Dynasty rankings"
        title={`2026 dynasty rankings: ${playerCount} players`}
        accent={`and ${pickCount} rookie picks.`}
        description="Complete Superflex and 1QB dynasty market rankings, positional tables, exact 2027 picks, and seven-day movers—with direct links into the trade calculator."
        primaryHref="#rankings"
        primaryLabel="Open rankings"
        showRelease
      />
      <div id="rankings" className="page-wrap scroll-mt-8">
        <ServerRankings />
      </div>
      <FaqBlock items={faqs} title="About the rankings." />
    </>
  );
}
