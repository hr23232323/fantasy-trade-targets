import FaqBlock from "../components/FaqBlock";
import MarketBoard from "../components/ServerMarketBoard";
import PageHero from "../components/PageHero";
import TradeCalculator from "../components/TradeCalculator";
import WebAppSchema from "../components/WebAppSchema";
import { buildPageMetadata } from "../lib/metadata";

const description = "Use a free fantasy trade calculator to compare current player values, package trades, quarterback settings, TE premium, and roster-spot costs.";

export const metadata = buildPageMetadata({
  title: "Free Fantasy Trade Calculator",
  description:
    description,
  path: "/fantasy-trade-calculator",
});

const faqs = [
  {
    question: "Is this fantasy trade calculator free?",
    answer:
      "Yes. The calculator is free, requires no account, and uses a cached daily market feed so each trade can be evaluated without a paid AI call.",
  },
  {
    question: "How often do fantasy trade values change?",
    answer:
      "Values can move quickly after injuries, role changes, and breakout games. The underlying market feed refreshes daily, and the update date is shown inside the calculator.",
  },
  {
    question: "Can I compare more than two players?",
    answer:
      "Yes. Add as many assets as needed on either side. The optional roster-cost adjustment prevents large packages from being treated as a naive arithmetic sum.",
  },
];

export default function FantasyTradeCalculatorPage() {
  return (
    <>
      <WebAppSchema name="Fantasy Trade Target Calculator" description={description} path="/fantasy-trade-calculator" />
      <PageHero
        eyebrow="Free fantasy trade calculator"
        title="Make the offer."
        accent="Know the price."
        description="Compare current-season player values across complete trade packages, then browse the market for the missing piece that balances the deal."
        secondaryHref="/fantasy-football-trade-value-chart"
        secondaryLabel="Browse the redraft chart"
      />
      <div className="page-wrap"><TradeCalculator defaultFormat="redraft" defaultNumQbs={1} /></div>
      <div className="page-wrap pt-20">
        <MarketBoard
          format="redraft"
          numQbs={1}
          includePicks={false}
          heading="Current fantasy football trade values"
          description="Search the redraft board by player, team, age, or position, then send any target directly into the calculator."
          initialLimit={24}
        />
      </div>
      <FaqBlock items={faqs} title="Calculator basics." />
    </>
  );
}
