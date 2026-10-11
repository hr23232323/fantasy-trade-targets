import type { Metadata } from "next";
import BettingCalculatorPageFrame from "../components/BettingCalculatorPageFrame";
import { ArbitrageCalculator } from "../components/BettingCalculators";

export const metadata: Metadata = {
  title: "Arbitrage Betting Calculator — Stakes, Profit & ROI",
  description: "Check two-way or multi-outcome American odds for a mathematical arbitrage. Split a total stake or target an equal return and calculate every outcome stake, profit and ROI.",
  alternates: { canonical: "/arbitrage-betting-calculator" },
};

export default function ArbitrageBettingCalculatorPage() {
  const faqs = [
    { q: "How do you calculate a betting arbitrage?", a: "Convert every outcome to implied probability and add them together. A total below 100% creates a mathematical arbitrage before commissions, limits or settlement differences." },
    { q: "How are arbitrage stakes divided?", a: "Each stake is proportional to that outcome's implied probability. This dutching allocation produces the same gross return whichever entered outcome wins." },
    { q: "Why might a calculated arbitrage fail?", a: "Prices can move, bets can be limited or rejected, and sportsbooks can apply different void and settlement rules. Confirm every price and rule before relying on the result." },
  ];
  return <BettingCalculatorPageFrame path="/arbitrage-betting-calculator" eventName="arbitrage_calculator_viewed" eyebrow="2–6 outcomes · equal return" heading="Arbitrage betting calculator" accent="and dutching stakes." answer="Enter every mutually exclusive outcome, then split a total stake or target an exact equal return. The calculator checks whether the prices add to less than 100% and sizes every outcome." explainerTitle="Below 100% is the mathematical opening." explainer={<><p>American odds first become implied probabilities. Their sum is the key number: below 100% produces a positive equal-return result; above 100% produces a loss even after the stakes are balanced.</p><p>The allocation is often called dutching. Choose whether to divide a fixed bankroll or work backward from a desired gross return. Neither mode can account for price movement, limits, commissions or inconsistent settlement rules.</p></>} faqs={faqs}><ArbitrageCalculator /></BettingCalculatorPageFrame>;
}
