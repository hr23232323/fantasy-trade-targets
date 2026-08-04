import FaqBlock from "../components/FaqBlock";
import PageHero from "../components/PageHero";
import ServerRankings from "../components/ServerRankings";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Dynasty Rankings: Players & Rookie Picks",
  description:
    "Free, updated dynasty rankings for quarterbacks, running backs, wide receivers, tight ends, and rookie picks with trade market scores.",
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
      "The underlying composite market feed refreshes daily. The source and latest update are shown on the site.",
  },
];

export default function DynastyRankingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Dynasty rankings"
        title="Rank the asset."
        accent="Then price the deal."
        description="Updated dynasty market rankings across every offensive position and exact rookie picks, with direct links into the trade calculator."
        primaryHref="#rankings"
        primaryLabel="Open rankings"
      />
      <div id="rankings" className="page-wrap scroll-mt-8">
        <ServerRankings />
      </div>
      <FaqBlock items={faqs} title="About the rankings." />
    </>
  );
}
