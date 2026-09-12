import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import { TrackedLink } from "../../components/TrackedLink";
import { buildPageMetadata } from "../../lib/metadata";
import { getPlayerPickComparison, getPlayerPickComparisonResearch, getRelatedPlayerPickComparisons, pickLabel, playerPickComparisonSlugs } from "../../lib/player-pick-comparisons";

const SITE_URL = "https://fantasytradetarget.com";
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return playerPickComparisonSlugs.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPlayerPickComparison(slug);
  if (!page) return {};
  const research = await getPlayerPickComparisonResearch(page);
  const player = research.superflex.player.name;
  const pick = pickLabel(page.pickId);
  return buildPageMetadata({
    title: `${player} vs. ${pick}: Dynasty Trade Value`,
    description: `${player} or the ${pick}? Compare current Superflex and 1QB values, exact gaps, risk differences, and a preloaded dynasty trade.`,
    path: `/player-vs-rookie-pick/${slug}`,
  });
}

export default async function PlayerVsPickPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPlayerPickComparison(slug);
  if (!page) notFound();
  const research = await getPlayerPickComparisonResearch(page);
  const player = research.superflex.player.name;
  const pick = pickLabel(page.pickId);
  const shortAnswer = verdict(player, pick, research.superflex);
  const pageUrl = `${SITE_URL}/player-vs-rookie-pick/${slug}`;
  const related = getRelatedPlayerPickComparisons(page);
  const faq = [
    { question: `Is ${player} worth more than the ${pick}?`, answer: `${shortAnswer} This is a current 12-team market comparison, so the answer can change with a new validated release.` },
    { question: `Does the answer change in 1QB?`, answer: verdict(player, pick, research.oneQb) },
    { question: `Why compare a player with an unassigned rookie pick?`, answer: "The choice separates known NFL production and role from rookie optionality. Equal market prices do not mean equal risk or identical value to every roster." },
    { question: "Is this a rookie projection?", answer: "No. The pick value is the market price of the draft slot before a player is selected. This page does not predict a prospect, landing spot, injury, or class outcome." },
  ];

  return (
    <>
      <AnalyticsPageView eventName="player_pick_comparison_experiment_viewed" properties={{ experiment: "player_vs_exact_pick", experiment_cohort: "2027_first_20", comparison_slug: slug, player_slug: page.playerSlug, pick_id: page.pickId, superflex_gap: research.superflex.gap, one_qb_gap: research.oneQb.gap, release_id: research.releaseId }} />
      <JsonLd data={buildSchema(pageUrl, player, pick, research, faq)} />
      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/player-vs-rookie-pick">Player vs. pick</Link><span>/</span><span className="text-[#171c19]">{player} vs. {pick}</span></nav>
      <section className="border-y border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">Dynasty decision // known player or exact pick</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{player} vs. <span className="text-[#a23616]">{pick}.</span></h1>
          <div className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5"><span className="mono-label">The short answer</span><p className="mt-3 text-lg font-bold leading-8">{shortAnswer}</p></div>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${page.playerSlug}&send=${page.pickId}`} analyticsEvent="player_pick_calculator_opened" analyticsProperties={{ comparison_slug: slug, player_slug: page.playerSlug, pick_id: page.pickId, format: "superflex" }} className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#ff6b3d]">Open this trade →</TrackedLink>
            <Link href={`/players/${page.playerSlug}`} className="border border-[#171c19] bg-white/70 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em]">Open player file →</Link>
          </div>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">
          <FormatComparison title="12-team Superflex" player={player} pick={pick} row={research.superflex} accent="bg-[#8bcfff]" />
          <FormatComparison title="12-team 1QB" player={player} pick={pick} row={research.oneQb} accent="bg-[#f3f0e7]" />
        </div>
      </section>
      <section className="border-y border-[#171c19] bg-[#171c19] text-white"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="mono-label text-[#dfff4f]">The decision underneath</span><h2 className="section-title mt-6">Price is only the opening question.</h2></div><div className="grid gap-px border border-white/25 bg-white/25 sm:grid-cols-2"><p className="bg-[#171c19] p-5 text-sm leading-7"><strong className="block text-[#dfff4f]">Choose the player</strong>When the known role, lineup points, and contender window matter more than future optionality.</p><p className="bg-[#171c19] p-5 text-sm leading-7"><strong className="block text-[#8bcfff]">Choose the pick</strong>When liquidity, roster flexibility, and the ability to select or trade later fit the build better.</p></div></div></section>
      <section className="page-wrap py-14"><span className="eyebrow">Questions, answered</span><h2 className="section-title mt-6">How to read the comparison.</h2><div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">{faq.map((item) => <article key={item.question} className="bg-[#f3f0e7] p-6"><h3 className="text-xl font-black tracking-[-0.03em]">{item.question}</h3><p className="mt-3 text-sm leading-7 text-[#69706c]">{item.answer}</p></article>)}</div></section>
      <section className="page-wrap border-t border-[#171c19] py-12"><span className="eyebrow">More measured decisions</span><div className="mt-6 flex flex-wrap gap-3">{related.map((item) => <Link key={item.slug} href={`/player-vs-rookie-pick/${item.slug}`} className="border border-[#171c19] bg-white/60 px-4 py-3 text-sm font-bold hover:bg-[#dfff4f]">{pickLabel(item.pickId)} comparison →</Link>)}</div></section>
      <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Market release <span className="font-mono">{research.releaseId}</span>, updated {new Date(research.generatedAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/New_York" })}. This comparison measures market price, not expected rookie outcomes.</aside>
    </>
  );
}

type ResearchRow = Awaited<ReturnType<typeof getPlayerPickComparisonResearch>>["superflex"];
function verdict(player: string, pick: string, row: ResearchRow) {
  if (row.leader === "even") return `${player} and the ${pick} carry the same current value at ${Math.round(row.player.value)}.`;
  const leader = row.leader === "player" ? player : `the ${pick}`;
  return `${leader} leads by ${Math.abs(row.gap)} market points: ${player} is ${Math.round(row.player.value)} and the pick is ${Math.round(row.pick.value)}.`;
}
function FormatComparison({ title, player, pick, row, accent }: { title: string; player: string; pick: string; row: ResearchRow; accent: string }) {
  return <article className={`${accent} p-6 sm:p-8`}><span className="mono-label">{title}</span><h2 className="mt-5 text-3xl font-black tracking-[-0.05em]">{row.gapPercent <= 5 ? "Same market tier." : row.leader === "player" ? `${player} leads.` : `${pick} leads.`}</h2><div className="mt-7 grid grid-cols-2 gap-px border border-[#171c19] bg-[#171c19]"><dl className="bg-white/75 p-4"><dt className="text-xs text-[#69706c]">{player}</dt><dd className="mt-2 font-mono text-3xl font-black">{Math.round(row.player.value)}</dd></dl><dl className="bg-white/75 p-4"><dt className="text-xs text-[#69706c]">{pick}</dt><dd className="mt-2 font-mono text-3xl font-black">{Math.round(row.pick.value)}</dd></dl></div><p className="mt-5 text-sm leading-7">{verdict(player, pick, row)} The gap is {row.gapPercent}% of the higher-valued side.</p></article>;
}
function buildSchema(pageUrl: string, player: string, pick: string, research: Awaited<ReturnType<typeof getPlayerPickComparisonResearch>>, faq: Array<{ question: string; answer: string }>) {
  return [
    { "@context": "https://schema.org", "@type": "WebPage", "@id": `${pageUrl}#page`, url: pageUrl, name: `${player} vs. ${pick} dynasty trade value`, description: verdict(player, pick, research.superflex), dateModified: research.generatedAt, publisher: { "@id": `${SITE_URL}/#organization` } },
    { "@context": "https://schema.org", "@type": "Dataset", name: `${player} and ${pick} dynasty market comparison`, url: pageUrl, dateModified: research.generatedAt, variableMeasured: ["Superflex market value", "1QB market value", "absolute value gap", "percentage value gap"] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Player vs. rookie pick", item: `${SITE_URL}/player-vs-rookie-pick` }, { "@type": "ListItem", position: 3, name: `${player} vs. ${pick}`, item: pageUrl }] },
  ];
}
