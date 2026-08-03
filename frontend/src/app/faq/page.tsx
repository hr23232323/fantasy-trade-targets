import type { Metadata } from "next";
import FaqBlock from "../components/FaqBlock";
import PageHero from "../components/PageHero";

export const metadata: Metadata = {
  title: "Fantasy Trade Target FAQ",
  description: "Answers about fantasy trade values, calculator settings, data updates, rookie picks, privacy, and methodology.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  { question: "Is Fantasy Trade Target free?", answer: "Yes. The V1 calculator, rankings, value charts, target finder, and meme tool are free and require no account." },
  { question: "Where do player values come from?", answer: "The site uses the commercially permitted Tradyr public API with visible attribution. Tradyr provides a daily composite market score. Fantasy Trade Target does not scrape or republish private source feeds." },
  { question: "Does the calculator use artificial intelligence?", answer: "No. Every V1 verdict is deterministic. The same inputs and settings produce the same result, and the roster-cost formula is published in the methodology." },
  { question: "What settings are supported?", answer: "Dynasty and redraft, 1QB and Superflex, optional tight-end premium, league sizes from 8 to 16 teams, exact rookie picks, and an optional roster-cost adjustment." },
  { question: "Why does my league value a player differently?", answer: "Market values are a reference point. Scoring, lineup size, manager preferences, team direction, injuries, and available replacements all move the price inside a specific league." },
  { question: "Can I share a trade?", answer: "Yes. The Share Trade button copies a URL containing both sides and the format settings so another manager can open the same offer." },
  { question: "Is this affiliated with the NFL or Sleeper?", answer: "No. Fantasy Trade Target is independent and is not affiliated with the NFL, Sleeper, Tradyr, or another fantasy platform." },
];

export default function FAQPage() {
  return (
    <>
      <PageHero eyebrow="Frequently asked questions" title="No coachspeak." accent="Just answers." description="How the tools work, where the values come from, what the verdict means, and what we deliberately do not collect." primaryHref="#faq" primaryLabel="Read the answers" />
      <div id="faq"><FaqBlock items={faqs} title="The full FAQ." /></div>
    </>
  );
}
