import Link from "next/link";
import type { ReactNode } from "react";
import AnalyticsPageView from "./AnalyticsPageView";
import BettingDisclosure from "./BettingDisclosure";
import JsonLd from "./JsonLd";

const SITE_URL = "https://fantasytradetarget.com";

export default function BettingCalculatorPageFrame({ path, eventName, eyebrow, heading, accent, answer, children, explainerTitle, explainer, faqs }: { path: string; eventName: string; eyebrow: string; heading: string; accent: string; answer: string; children: ReactNode; explainerTitle: string; explainer: ReactNode; faqs: Array<{ q: string; a: string }> }) {
  return <>
    <AnalyticsPageView eventName={eventName} properties={{ calculator: path.slice(1) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: heading, url: `${SITE_URL}${path}`, applicationCategory: "FinanceApplication", operatingSystem: "Any", isAccessibleForFree: true, description: answer }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) }} />
    <nav className="page-wrap flex gap-2 py-4 font-mono text-[10px] font-bold uppercase text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/betting-calculators">Betting calculators</Link><span>/</span><span className="text-[#171c19]">{heading}</span></nav>
    <section className="border-y border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap py-14 sm:py-20"><span className="mono-label text-[#dfff4f]">{eyebrow}</span><h1 className="mt-7 max-w-6xl text-[clamp(3.2rem,8vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">{heading} <span className="text-[#ff6b3d]">{accent}</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#dfff4f] pl-5 text-lg font-black leading-8">{answer}</p></div></section>
    <main className="page-wrap py-12">{children}<section className="mt-14 grid gap-8 border-t border-[#171c19] pt-10 lg:grid-cols-[.8fr_1.2fr]"><div><span className="eyebrow">How it works</span><h2 className="section-title mt-5">{explainerTitle}</h2></div><div className="space-y-4 text-sm leading-7 text-[#4b524e]">{explainer}</div></section><section className="mt-14"><span className="eyebrow">Questions, answered</span><div className="mt-6 grid gap-4 lg:grid-cols-3">{faqs.map((faq) => <article key={faq.q} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19]"><h2 className="text-xl font-black">{faq.q}</h2><p className="mt-4 text-sm leading-7 text-[#59605c]">{faq.a}</p></article>)}</div></section><div className="mt-12 flex flex-wrap gap-3"><Link href="/betting-calculators" className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">All betting calculators →</Link><Link href="/nfl-picks-predictions" className="border border-[#171c19] bg-white px-5 py-4 font-mono text-[10px] font-black uppercase">NFL model room →</Link></div></main>
    <BettingDisclosure />
  </>;
}
