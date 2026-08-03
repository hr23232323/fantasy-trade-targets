import type { Metadata } from "next";
import CalculatorGuide from "../components/CalculatorGuide";
import FaqBlock from "../components/FaqBlock";
import PageHero from "../components/PageHero";
import TradeCalculator from "../components/TradeCalculator";

export const metadata: Metadata = {
  title: "Dynasty Superflex Trade Calculator — Free 2QB Values",
  description:
    "Free dynasty Superflex trade calculator with daily 2QB player values, rookie picks, TE premium, league size, and package adjustments.",
  alternates: { canonical: "/dynasty-superflex-trade-calculator" },
};

const faqs = [
  {
    question: "Why are quarterbacks worth more in Superflex?",
    answer:
      "A Superflex lineup can start a second quarterback, creating much more weekly demand at the position. Reliable starters become scarce, and elite quarterbacks gain a large advantage over replacement options.",
  },
  {
    question: "Is Superflex the same as a 2QB league?",
    answer:
      "They are valued similarly, but not identical. A Superflex spot can also start a running back, wide receiver, or tight end, while a strict 2QB slot cannot. Most dynasty markets still use the same two-quarterback value baseline for both.",
  },
  {
    question: "Do rookie pick values change in Superflex?",
    answer:
      "Yes. Quarterback prospects can become premium early picks in Superflex drafts, so exact rookie selections are valued using the selected two-quarterback format.",
  },
];

export default function SuperflexCalculatorPage() {
  return (
    <>
      <PageHero
        eyebrow="Dynasty Superflex trade calculator"
        title="Two QB slots."
        accent="A different market."
        description="Stop pricing Superflex trades with 1QB values. Compare quarterbacks, skill players, and exact rookie picks on a daily two-quarterback market."
      />
      <div className="page-wrap"><TradeCalculator defaultFormat="dynasty" defaultNumQbs={2} /></div>
      <CalculatorGuide mode="superflex" />
      <FaqBlock items={faqs} title="Superflex, decoded." />
    </>
  );
}
