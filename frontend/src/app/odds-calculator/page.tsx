import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import BettingDisclosure from "../components/BettingDisclosure";
import JsonLd from "../components/JsonLd";
import OddsCalculator from "../components/OddsCalculator";

const SITE_URL = "https://fantasytradetarget.com";
export const metadata: Metadata = {
  title: "Odds Calculator — American Odds, Probability & Payout",
  description: "Convert American odds to implied probability and decimal odds, calculate profit and payout, and remove the vig from a two-way betting market.",
  alternates: { canonical: "/odds-calculator" },
};

export default function OddsCalculatorPage() {
  const faqs = [
    { q: "How do you convert American odds to implied probability?", a: "For positive odds, divide 100 by the odds plus 100. For negative odds, divide the absolute odds by the absolute odds plus 100." },
    { q: "What does −110 pay on a $100 bet?", a: "At −110, a $100 stake produces $90.91 in profit and a total return of $190.91 if the bet wins." },
    { q: "What is no-vig probability?", a: "No-vig probability rescales both sides of a market to remove the percentage included in the sportsbook's prices. The two adjusted probabilities add to 100%." },
  ];
  return <>
    <AnalyticsPageView eventName="odds_calculator_viewed" properties={{ calculator: "american_odds" }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "American Odds Calculator", url: `${SITE_URL}/odds-calculator`, applicationCategory: "FinanceApplication", operatingSystem: "Any", isAccessibleForFree: true, description: metadata.description }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />
    <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Free betting math tool</span><h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7.2rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">Odds, probability <span className="text-[#ff4f27]">and payout.</span></h1><p className="mt-8 max-w-3xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">Convert American odds instantly. See the implied probability, potential profit, total return and the fair probability after removing the market margin.</p></div></section>
    <main className="page-wrap py-12"><OddsCalculator />
      <section className="mt-14 grid gap-8 border-t border-[#171c19] pt-10 lg:grid-cols-[.8fr_1.2fr]"><div><span className="eyebrow">The quick read</span><h2 className="section-title mt-5">What the number means.</h2></div><div className="space-y-5 text-sm leading-7 text-[#444b47]"><p><strong className="text-[#171c19]">Negative odds</strong> show how much must be risked to win $100. <strong className="text-[#171c19]">Positive odds</strong> show the profit from a $100 stake.</p><p>Implied probability translates that price into a percentage. Because both sides normally add to more than 100%, use the two-way calculation to see the market after its margin is removed.</p><p>Ready to apply the math? Compare this week&apos;s model with the listed lines on the <Link href="/nfl-picks-predictions" className="font-black underline">NFL picks and predictions board</Link>.</p></div></section>
      <section className="mt-14"><span className="eyebrow">Odds calculator FAQ</span><div className="mt-6 grid gap-4 lg:grid-cols-3">{faqs.map((faq) => <article key={faq.q} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><h2 className="text-xl font-black">{faq.q}</h2><p className="mt-4 text-sm leading-7 text-[#59605c]">{faq.a}</p></article>)}</div></section>
    </main><BettingDisclosure />
  </>;
}
