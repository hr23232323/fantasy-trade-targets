import type { Metadata } from "next";
import CalculatorGuide from "../components/CalculatorGuide";
import FaqBlock from "../components/FaqBlock";
import PageHero from "../components/PageHero";
import TradeCalculator from "../components/TradeCalculator";

export const metadata: Metadata = {
  title: "Free Dynasty Trade Calculator — Players, Picks & Superflex",
  description:
    "Use a free dynasty trade calculator with daily player values, exact rookie picks, Superflex, TE premium, league size, and roster-cost adjustments.",
  alternates: { canonical: "/dynasty-trade-calculator" },
};

const faqs = [
  {
    question: "What is the best way to use a dynasty trade calculator?",
    answer:
      "Match the calculator to your league settings, enter every player and pick, and compare the adjusted package value. Then consider team direction, starting-lineup impact, and whether the trade creates or removes usable roster spots.",
  },
  {
    question: "Why is a three-for-one worth less than the raw total?",
    answer:
      "Only one player can occupy each starting spot. Extra pieces consume roster space and may replace players you already own, so their practical value is lower than a simple sum. The roster-cost toggle makes that discount visible.",
  },
  {
    question: "Can I include future rookie picks?",
    answer:
      "Yes. Search by year or slot to add exact rookie picks. Pick values respond to quarterback format and league size.",
  },
  {
    question: "Does a fair calculator result guarantee a good trade?",
    answer:
      "No. The verdict measures current market value, not your specific win window or risk tolerance. A fair deal can still be wrong for a rebuilding team or a contender with one weak starting position.",
  },
];

export default function DynastyTradeCalculatorPage() {
  return (
    <>
      <PageHero
        eyebrow="Free dynasty trade calculator"
        title="Every player. Every pick."
        accent="One honest number."
        description="Compare unlimited dynasty trade packages with daily market values and a transparent roster-cost adjustment. Built for 1QB, Superflex, TE premium, and leagues from 8 to 16 teams."
      />
      <div className="page-wrap"><TradeCalculator defaultFormat="dynasty" defaultNumQbs={2} /></div>
      <CalculatorGuide mode="dynasty" />
      <FaqBlock items={faqs} title="Dynasty calculator FAQ." />
    </>
  );
}
