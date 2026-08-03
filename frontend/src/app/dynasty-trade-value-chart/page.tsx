import type { Metadata } from "next";
import FaqBlock from "../components/FaqBlock";
import MarketBoard from "../components/MarketBoard";
import PageHero from "../components/PageHero";

export const metadata: Metadata = {
  title: "Dynasty Trade Value Chart — Daily Player & Pick Values",
  description:
    "Browse a free dynasty trade value chart with daily player market scores, exact rookie picks, age, position, and direct trade calculator links.",
  alternates: { canonical: "/dynasty-trade-value-chart" },
};

const faqs = [
  {
    question: "How should I read a dynasty trade value chart?",
    answer:
      "Treat each score as a relative market reference, not projected fantasy points. Higher values indicate assets that cost more in the current dynasty market. Use the calculator for multi-asset offers because package value is not perfectly additive.",
  },
  {
    question: "Are rookie picks included in the chart?",
    answer:
      "Yes. The table includes exact pick slots for current and future classes alongside players, making it possible to compare rookie capital directly with veterans.",
  },
  {
    question: "Why do dynasty values differ from redraft values?",
    answer:
      "Dynasty prices long-term career value, age, and future liquidity. Redraft values focus on the current season, so older productive players are usually worth more in redraft and less in dynasty.",
  },
];

export default function DynastyTradeValueChartPage() {
  return (
    <>
      <PageHero
        eyebrow="Dynasty trade value chart"
        title="The market,"
        accent="ranked daily."
        description="Searchable dynasty player and rookie-pick values for 1QB and Superflex trade research. Every row can become a preloaded offer."
        primaryHref="#value-chart"
        primaryLabel="Open value chart"
      />
      <div id="value-chart" className="page-wrap scroll-mt-8">
        <MarketBoard heading="Dynasty trade values" description="Daily composite market scores for players and exact rookie picks. Filter the board, find the tier, then build the offer." />
      </div>
      <FaqBlock items={faqs} title="Using the value chart." />
    </>
  );
}
