import Link from "next/link";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import { getMarket } from "../../lib/market";
import { buildPageMetadata } from "../../lib/metadata";
import { hasPlayerPage } from "../../lib/player-pages";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "TE Premium Dynasty Rankings & Trade Values",
  description: "Current TE-premium dynasty rankings showing which tight ends gain or lose value versus the standard Superflex market. Updated from the latest validated release.",
  path: "/scoring/te-premium-rankings",
});

export default async function TePremiumRankingsPage() {
  const [premium, standard] = await Promise.all([
    getMarket({ format: "dynasty", numQbs: 2, tep: true, numTeams: 12 }),
    getMarket({ format: "dynasty", numQbs: 2, tep: false, numTeams: 12 }),
  ]);
  const standardById = new Map(standard.assets.map((asset) => [asset.id, asset]));
  const rows = premium.assets
    .filter((asset) => asset.kind === "player" && asset.position === "TE")
    .map((asset) => ({ asset, base: standardById.get(asset.id), delta: Math.round(asset.value - (standardById.get(asset.id)?.value ?? asset.value)) }))
    .sort((a, b) => b.asset.value - a.asset.value);
  const risers = [...rows].sort((a, b) => b.delta - a.delta).slice(0, 8);
  const updated = new Date(premium.meta.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
  const faqs = [
    ["What is TE-premium scoring?", "TE premium gives tight ends more reception value than other positions. This page uses the dedicated TE-premium market supplied in the current release rather than inventing one universal multiplier."],
    ["Who gains the most in TE-premium dynasty leagues?", "The biggest risers table shows the live answer. A tight end gains when the TE-premium market values him more highly than the otherwise matching Superflex market."],
    ["Does every tight end gain the same amount?", "No. Role, reception volume, age, scarcity, and market demand are reflected differently for each player, so a blanket percentage would hide the decision that matters."],
    ["Are these redraft rankings?", "No. These are dynasty Superflex values for a 12-team league. They price long-term market value, not only the current season."],
  ];
  return <>
    <AnalyticsPageView eventName="scoring_research_viewed" properties={{ scoring_page: "te-premium-rankings", release_id: premium.meta.releaseId, modeled_player_count: rows.length }} />
    <JsonLd data={[{
      "@context": "https://schema.org", "@type": "Dataset", name: "TE Premium Dynasty Rankings", url: `${SITE_URL}/scoring/te-premium-rankings`, dateModified: premium.meta.generatedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target" }, mainEntity: { "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.map(({ asset }, index) => ({ "@type": "ListItem", position: index + 1, name: asset.name })) },
    }, {
      "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    }]} />
    <nav className="page-wrap flex gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/scoring">Scoring rankings</Link><span>/</span><span>TE premium</span></nav>
    <section className="border-b border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap py-14 sm:py-20"><div className="flex flex-wrap items-center justify-between gap-3"><span className="mono-label text-[#dfff4f]">Scoring research // tight ends</span><span className="mono-label text-white/55">Last successful update: {updated} ET · {premium.meta.releaseId}</span></div><h1 className="mt-7 max-w-6xl text-[clamp(3.1rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.078em]">TE premium dynasty <span className="text-[#8bcfff]">rankings & trade values.</span></h1><p className="mt-8 max-w-4xl text-lg leading-8 text-white/70">See the complete tight-end board and the exact market change versus otherwise matching 12-team dynasty Superflex values. No generic premium is applied: every difference comes from the published TE-premium market.</p></div></section>
    <section className="page-wrap py-14"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{risers.map(({ asset, delta }, index) => <article key={asset.id} className="border border-[#171c19] bg-[#dfff4f] p-5"><span className="mono-label">TEP riser {index + 1}</span><h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">{asset.name}</h2><strong className="mt-4 block font-mono text-xl">{delta > 0 ? "+" : ""}{delta} value</strong></article>)}</div></section>
    <section className="page-wrap py-10"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#171c19] pb-5"><div><span className="eyebrow">Complete rankings</span><h2 className="section-title mt-5">All {rows.length} dynasty tight ends</h2></div><p className="max-w-md text-sm leading-6 text-[#69706c]">TEP value and rank are compared with the same release’s non-premium Superflex market.</p></div><div className="overflow-x-auto border-x border-b border-[#171c19]"><table className="w-full min-w-[680px] text-left"><thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">TEP rank</th><th className="p-4">Tight end</th><th className="p-4 text-right">Standard market</th><th className="p-4 text-right">TE premium</th><th className="p-4 text-right">Difference</th></tr></thead><tbody>{rows.map(({ asset, base, delta }, index) => <tr key={asset.id} className="border-b border-[#c8c4b9] last:border-0"><td className="p-4 font-mono font-black">{index + 1}</td><td className="p-4 font-bold">{hasPlayerPage(asset.slug) ? <Link href={`/players/${asset.slug}`} className="underline-offset-4 hover:underline">{asset.name}</Link> : asset.name}<span className="ml-2 font-mono text-[9px] text-[#69706c]">{asset.team || "FA"}</span></td><td className="p-4 text-right font-mono">{base ? Math.round(base.value) : "—"}</td><td className="p-4 text-right font-mono font-black">{Math.round(asset.value)}</td><td className={`p-4 text-right font-mono font-black ${delta > 0 ? "text-[#466400]" : delta < 0 ? "text-[#a23616]" : "text-[#69706c]"}`}>{delta > 0 ? "+" : ""}{delta}</td></tr>)}</tbody></table></div></section>
    <section className="page-wrap py-14"><span className="eyebrow">TE premium questions</span><h2 className="section-title mt-6">How to use this board.</h2><div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">{faqs.map(([question, answer]) => <article key={question} className="bg-[#f3f0e7] p-6"><h3 className="text-xl font-black">{question}</h3><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>)}</div></section>
  </>;
}
