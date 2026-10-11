import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import BettingDisclosure from "../components/BettingDisclosure";
import JsonLd from "../components/JsonLd";

const SITE_URL = "https://fantasytradetarget.com";
const calculators = [
  { href: "/parlay-calculator", label: "Parlay calculator", answer: "Combine 2–8 legs and calculate odds, probability, profit and payout.", color: "#dfff4f" },
  { href: "/odds-calculator", label: "Odds calculator", answer: "Convert American odds into implied probability, decimal odds and payout.", color: "#8bcfff" },
  { href: "/no-vig-calculator", label: "No vig calculator", answer: "Remove the margin from both sides and see fair market probabilities.", color: "#ffb29a" },
  { href: "/hedge-bet-calculator", label: "Hedge bet calculator", answer: "Find the opposite-side stake that equalizes the return across two outcomes.", color: "#e7d7ff" },
  { href: "/kelly-criterion-calculator", label: "Kelly criterion calculator", answer: "Turn your probability estimate into a full, half or quarter Kelly stake.", color: "#f3f0e7" },
  { href: "/round-robin-calculator", label: "Round robin calculator", answer: "Split 3–8 picks into every smaller parlay and calculate total cost and maximum payout.", color: "#dfff4f" },
  { href: "/arbitrage-betting-calculator", label: "Arbitrage calculator", answer: "Check the implied-probability total and balance stakes for the same return on every outcome.", color: "#8bcfff" },
  { href: "/teaser-calculator", label: "Teaser calculator", answer: "Move football spreads and totals, then price the adjusted card with the odds entered.", color: "#e7d7ff" },
];
export const metadata: Metadata = { title: "Free Betting Calculators — Odds, Parlays, Vig & More", description: "Free calculators for odds, parlays, round robins, arbitrage, teasers, no-vig probabilities, hedge stakes and Kelly bet sizing. No signup required.", alternates: { canonical: "/betting-calculators" } };

export default function BettingCalculatorsPage() {
  return <>
    <AnalyticsPageView eventName="betting_calculators_viewed" properties={{ calculator_count: calculators.length }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Free betting calculators", url: `${SITE_URL}/betting-calculators`, mainEntity: { "@type": "ItemList", numberOfItems: calculators.length, itemListElement: calculators.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, url: `${SITE_URL}${item.href}` })) } }} />
    <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Eight free tools · no signup</span><h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7.2rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">Betting calculators <span className="text-[#ff4f27]">without the mystery.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">Calculate odds, parlays, round robins, arbitrage stakes, teasers, hedges and bankroll sizing. Every result updates instantly and explains what the number means.</p></div></section>
    <main className="page-wrap py-12"><section className="grid gap-5 md:grid-cols-2">{calculators.map((item, index) => <Link key={item.href} href={item.href} className={`group border border-[#171c19] p-7 shadow-[5px_5px_0_#171c19] transition-transform hover:-translate-y-1 ${index === 0 ? "md:col-span-2" : ""}`} style={{ backgroundColor: item.color }}><span className="eyebrow bg-white">Calculator {index + 1}</span><h2 className={`mt-6 font-black tracking-[-0.05em] ${index === 0 ? "text-4xl sm:text-6xl" : "text-3xl"}`}>{item.label}</h2><p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-[#414844]">{item.answer}</p><span className="mt-6 block font-mono text-[10px] font-black uppercase underline">Open calculator →</span></Link>)}</section>
      <section className="mt-14 grid gap-8 border-t border-[#171c19] pt-10 lg:grid-cols-[.8fr_1.2fr]"><div><span className="eyebrow">One consistent rule</span><h2 className="section-title mt-5">The math is exact. The inputs may not be.</h2></div><div className="space-y-4 text-sm leading-7 text-[#4b524e]"><p>These tools calculate directly from the numbers entered. They do not supply live prices, estimate injuries or claim that a wager has positive expected value.</p><p>Check the sportsbook&apos;s settlement rules, confirm that the prices are current and decide on a firm limit before risking money. For independent weekly football analysis, visit the <Link href="/nfl-picks-predictions" className="font-black underline">NFL model room</Link>.</p></div></section>
    </main><BettingDisclosure />
  </>;
}
