import PageHero from "../components/PageHero";
import { buildPageMetadata } from "../lib/metadata";

export const metadata = buildPageMetadata({
  title: "Editorial Policy",
  description:
    "How Fantasy Trade Target separates sourced facts, deterministic calculations, research interpretation, and optional generated content.",
  path: "/editorial-policy",
});

const principles = [
  ["Facts carry provenance", "Displayed market values, ranks, production, and usage must identify their source and freshness. Missing fields remain missing."],
  ["Math stays reproducible", "Calculator rules and report formulas are versioned and deterministic. The same evidence and methodology must produce the same result."],
  ["Interpretation is labeled", "Research commentary can explain a market signal, but it must not be presented as a sourced fact or guaranteed prediction."],
  ["Automation does not invent evidence", "Automation may format, summarize, or quality-check records. It may not manufacture observations, accepted trades, injuries, quotes, or historical values."],
  ["Commercial relationships stay visible", "Future advertising, affiliate links, licensed feeds, or sponsorships will be disclosed where they could affect a reader’s interpretation."],
  ["Material updates stay visible", "Factual or methodological changes receive an accurate updated date and a clear note on the affected research when reader interpretation could change."],
];

export default function EditorialPolicyPage() {
  return (
    <>
      <PageHero eyebrow="Editorial policy" title="Evidence first." accent="Labels always." description="The operating rules for Fantasy Trade Target Research, from source handling to deterministic analysis and corrections." primaryHref="#principles" primaryLabel="Read the principles" />
      <section id="principles" className="page-wrap grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">
        {principles.map(([title, body], index) => <article key={title} className={`p-7 sm:p-9 ${index % 3 === 0 ? "bg-[#dfff4f]" : index % 3 === 1 ? "bg-[#8bcfff]" : "bg-[#f3f0e7]"}`}><span className="mono-label">Rule {String(index + 1).padStart(2, "0")}</span><h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">{title}</h2><p className="mt-4 text-sm leading-7 text-[#4f5752]">{body}</p></article>)}
      </section>
      <section className="page-wrap py-14 text-sm leading-7 text-[#69706c]"><p><strong className="text-[#171c19]">Brand byline:</strong> public research is published by Fantasy Trade Target Research. We do not invent analyst identities or imply credentials that have not been established.</p><p className="mt-3"><strong className="text-[#171c19]">Last reviewed:</strong> August 3, 2026.</p></section>
    </>
  );
}
