import type { Metadata } from "next";
import BettingCalculatorPageFrame from "../components/BettingCalculatorPageFrame";
import { TeaserCalculator } from "../components/BettingCalculators";

export const metadata: Metadata = {
  title: "Teaser Calculator — Adjusted Spreads, Totals & Payout",
  description: "Move football spreads and totals by the selected teaser points, then calculate profit and payout from the entered American odds and stake.",
  alternates: { canonical: "/teaser-calculator" },
};

export default function TeaserCalculatorPage() {
  const faqs = [
    { q: "How does a teaser change a point spread?", a: "The selected team receives the teaser points. A −7.5 spread teased by six points becomes −1.5, while +2.5 becomes +8.5." },
    { q: "How does a teaser change a total?", a: "An over moves down by the teaser points and an under moves up. Over 45.5 becomes over 39.5 with six points; under 45.5 becomes under 51.5." },
    { q: "Does this calculator set the teaser price?", a: "No. Enter the American odds actually offered for the complete teaser. Prices, eligible markets, pushes and ties vary by sportsbook and sport." },
  ];
  return <BettingCalculatorPageFrame path="/teaser-calculator" eventName="teaser_calculator_viewed" eyebrow="Spreads, totals and entered price" heading="Teaser calculator" accent="for every adjusted line." answer="Choose each leg, enter the original lines and move them by the teaser points. Then calculate the profit and payout using the price actually offered." explainerTitle="Team spreads move up. Overs move down." explainer={<><p>A teaser gives the selected team additional points, so its spread increases. For totals, an over moves lower and an under moves higher. Every leg must satisfy the sportsbook's teaser rules.</p><p>The payout uses the American odds you enter for the complete teaser. The tool does not assume a standard price because prices and push rules differ across books and leg counts.</p></>} faqs={faqs}><TeaserCalculator /></BettingCalculatorPageFrame>;
}
