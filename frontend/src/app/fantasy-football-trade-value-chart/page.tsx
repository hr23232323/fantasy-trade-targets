import FaqBlock from "../components/FaqBlock";
import MarketBoard from "../components/ServerMarketBoard";
import PageHero from "../components/PageHero";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Fantasy Football Trade Value Chart",
  description:
    "Free fantasy football trade value chart with daily current-season player values, position filters, search, and direct trade analyzer links.",
  path: "/fantasy-football-trade-value-chart",
});

const faqs = [
  {
    question: "What is a fantasy football trade value chart?",
    answer:
      "It is a relative ranking of how the market prices players for trades. The score is not a weekly projection; it is a common reference point for comparing assets and building offers.",
  },
  {
    question: "Should I accept a trade only because the values match?",
    answer:
      "No. Matching values indicate a reasonable market price. You should still consider schedule, injuries, team needs, playoff odds, and whether each player actually enters your starting lineup.",
  },
  {
    question: "Does the chart support Superflex?",
    answer:
      "The linked analyzer can switch between 1QB and Superflex values. This page defaults to the more common 1QB redraft format.",
  },
];

export default function FantasyFootballTradeValueChartPage() {
  return (
    <>
      <PageHero
        eyebrow="Fantasy football trade value chart"
        title="Today’s players."
        accent="Today’s price."
        description="A searchable current-season market board for comparing trade targets before you send the offer."
        primaryHref="#value-chart"
        primaryLabel="Browse player values"
      />
      <div id="value-chart" className="page-wrap scroll-mt-8">
        <MarketBoard
          format="redraft"
          numQbs={1}
          includePicks={false}
          heading="Fantasy football trade values"
          description="Filter current-season player values by position and age, then preload a target into the free trade analyzer."
        />
      </div>
      <FaqBlock items={faqs} title="Reading the board." />
    </>
  );
}
