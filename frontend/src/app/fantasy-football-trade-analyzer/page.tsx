import type { Metadata } from "next";
import CalculatorGuide from "../components/CalculatorGuide";
import FaqBlock from "../components/FaqBlock";
import PageHero from "../components/PageHero";
import TradeCalculator from "../components/TradeCalculator";

export const metadata: Metadata = {
  title: "Free Fantasy Football Trade Analyzer — Who Wins?",
  description:
    "Analyze a fantasy football trade with free, current-season market values. Compare multi-player packages, Superflex, TE premium, and roster costs.",
  alternates: { canonical: "/fantasy-football-trade-analyzer" },
};

const faqs = [
  {
    question: "Who wins my fantasy football trade?",
    answer:
      "Enter the complete offer to compare adjusted current-season market value. A result within four percent is labeled fair; wider gaps are shown as lean, clear, or strong edges. Your standings and lineup needs should make the final call.",
  },
  {
    question: "How are two-for-one trades evaluated?",
    answer:
      "The analyzer shows the raw sum and an adjusted total. When roster cost is on, the second and later pieces receive a transparent discount because they consume roster spots and may force cuts.",
  },
  {
    question: "Should I trade depth for a star?",
    answer:
      "Contenders often benefit from consolidating replaceable depth into an elite weekly starter, while injury-thin teams may need the opposite. The market verdict tells you the price; your lineup tells you whether the move helps.",
  },
];

export default function FantasyFootballTradeAnalyzerPage() {
  return (
    <>
      <PageHero
        eyebrow="Fantasy football trade analyzer"
        title="Who wins the trade?"
        accent="Show the math."
        description="Build both sides of a current-season trade and get a fast, deterministic verdict. No login, no AI guess, and no pretending four bench pieces equal one weekly hammer."
      />
      <div className="page-wrap"><TradeCalculator defaultFormat="redraft" defaultNumQbs={1} /></div>
      <CalculatorGuide mode="redraft" />
      <FaqBlock items={faqs} title="Trade analyzer FAQ." />
    </>
  );
}
