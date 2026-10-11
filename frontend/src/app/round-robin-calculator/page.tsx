import type { Metadata } from "next";
import BettingCalculatorPageFrame from "../components/BettingCalculatorPageFrame";
import { RoundRobinCalculator } from "../components/BettingCalculators";

export const metadata: Metadata = {
  title: "Round Robin Calculator — Bets, Cost & Max Payout",
  description: "Build a 3–8 leg round robin, choose the parlay size and calculate the number of bets, total stake, maximum profit and maximum payout.",
  alternates: { canonical: "/round-robin-calculator" },
};

export default function RoundRobinCalculatorPage() {
  const faqs = [
    { q: "How many bets are in a round robin?", a: "The number depends on the legs and parlay size. Four legs grouped into two-leg parlays create six separate bets; four legs grouped into three-leg parlays create four." },
    { q: "What does stake per bet mean?", a: "The entered amount applies to every generated combination. Multiply it by the number of separate bets to get the total amount staked." },
    { q: "Can a round robin pay when one leg loses?", a: "Yes, when at least one complete combination still wins. The actual return depends on which legs win and the odds inside those surviving combinations." },
  ];
  return <BettingCalculatorPageFrame path="/round-robin-calculator" eventName="round_robin_calculator_viewed" eyebrow="3–8 legs · every combination" heading="Round robin calculator" accent="for cost and payout." answer="Enter each leg, choose the combination size and see how many separate bets are created, how much the card costs and the maximum return if every leg wins." explainerTitle="One card becomes several smaller parlays." explainer={<><p>A round robin creates every possible parlay of the selected size. Four picks by twos create six two-leg parlays, while five picks by threes create ten three-leg parlays.</p><p>The maximum payout adds the return from every generated bet and assumes all entered legs win. A partial-win payout cannot be known until the winning legs are identified.</p></>} faqs={faqs}><RoundRobinCalculator /></BettingCalculatorPageFrame>;
}
