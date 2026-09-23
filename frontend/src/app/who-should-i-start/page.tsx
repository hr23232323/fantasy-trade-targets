import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import StartSitBuilder from "../components/StartSitBuilder";
import PlayerThumbnail from "../components/PlayerThumbnail";
import TeamLogo from "../components/TeamLogo";
import { nflversePlayerRelease } from "../lib/nflverse";
import { activeStartSitWeek, getStartSitDecisions, startSitComparisons, startSitPath, startSitPlayerOptions } from "../lib/start-sit";

const SITE_URL = "https://fantasytradetarget.com";
const PATH = "/who-should-i-start";

export const metadata: Metadata = {
  title: `Who Should I Start in Week ${activeStartSitWeek}? Fantasy Football Start/Sit`,
  description: `Week ${activeStartSitWeek} fantasy football start/sit answers for ${startSitComparisons.length} close lineup decisions, plus a tool to compare any eligible players.`,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: PATH, title: `Who Should I Start in Week ${activeStartSitWeek}?`, description: `${startSitComparisons.length} evidence-backed Week ${activeStartSitWeek} fantasy football lineup decisions.` },
};

export default function WhoShouldIStartPage() {
  const cards = startSitComparisons.flatMap((comparison) => {
    const decision = getStartSitDecisions(comparison).find(({ scoring }) => scoring.key === "half-ppr");
    return decision ? [{ comparison, decision }] : [];
  }).sort((left, right) => right.decision.winner.gap - left.decision.winner.gap);
  const reviewedPaths = Object.fromEntries(startSitComparisons.map((comparison) => [
    [comparison.leftSlug, comparison.rightSlug].sort().join("|"),
    startSitPath(comparison.slug),
  ]));
  const updated = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(nflversePlayerRelease.capturedAt));

  return (
    <>
      <AnalyticsPageView eventName="start_sit_hub_viewed" properties={{ week: activeStartSitWeek, comparison_count: cards.length }} />
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "CollectionPage", name: `Who should I start in Week ${activeStartSitWeek}?`, url: `${SITE_URL}${PATH}`, dateModified: nflversePlayerRelease.capturedAt, mainEntity: { "@type": "ItemList", numberOfItems: cards.length, itemListElement: cards.map(({ comparison, decision }, index) => { const winner = decision.winner.side === "left" ? decision.left : decision.right; return { "@type": "ListItem", position: index + 1, url: `${SITE_URL}${startSitPath(comparison.slug)}`, name: `${winner.name} is the Week ${activeStartSitWeek} Half PPR lean` }; }) } }]} />
      <section className="border-b border-[#171c19] bg-[#8bcfff]"><div className="page-wrap py-16 sm:py-24"><span className="eyebrow bg-white">2026 fantasy football · Week {activeStartSitWeek}</span><h1 className="mt-8 max-w-6xl text-[clamp(3.4rem,8vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.08em]">Who should I <span className="text-[#174f35]">start?</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-xl font-black leading-9">Compare any eligible players, or open one of {startSitComparisons.length} close Week {activeStartSitWeek} lineup calls backed by production, workload, matchup and availability.</p><div className="mt-8 flex flex-wrap gap-3 font-mono text-[10px] font-black uppercase"><span className="border border-[#171c19] bg-white px-4 py-3">Updated {updated}</span><span className="border border-[#171c19] bg-[#dfff4f] px-4 py-3">Standard · Half PPR · PPR</span><Link href="/fantasy-football-injuries" className="border border-[#171c19] bg-[#ffb29a] px-4 py-3 hover:bg-white">Injury report →</Link></div></div></section>

      <section className="page-wrap py-12"><div className="mb-6 max-w-3xl"><span className="eyebrow">Build your matchup</span><h2 className="section-title mt-5">Put any two lineup options head to head.</h2></div><StartSitBuilder players={startSitPlayerOptions} reviewedPaths={reviewedPaths} /></section>

      <section className="page-wrap pb-14"><div className="mb-8 max-w-3xl"><span className="eyebrow">Week {activeStartSitWeek} decision board</span><h2 className="section-title mt-6">Start the stronger profile. Inspect every input.</h2><p className="mt-5 text-sm leading-7 text-[#59605c]">The number shown is the Half PPR median estimate. Open a decision for floor and ceiling ranges, all three reception formats, usage, snap share and availability.</p></div><div className="grid gap-5 lg:grid-cols-2">{cards.map(({ comparison, decision }) => {
        const winner = decision.winner.side === "left" ? decision.left : decision.right;
        const other = decision.winner.side === "left" ? decision.right : decision.left;
        return <Link key={comparison.slug} href={startSitPath(comparison.slug)} className="group border border-[#171c19] bg-white p-6 shadow-[5px_5px_0_#171c19] transition-transform hover:-translate-y-1"><div className="flex items-center justify-between gap-4"><span className="eyebrow bg-[#dfff4f]">{comparison.position} · {decision.winner.close ? "Close call" : `${decision.winner.gap.toFixed(1)}-point lean`}</span><span className="font-mono text-xs font-black">{winner.projection.median.toFixed(1)}–{other.projection.median.toFixed(1)}</span></div><div className="mt-6 flex items-center gap-3"><PlayerThumbnail slug={winner.slug} name={winner.name} position={winner.position} team={winner.team} size={64} /><span className="font-mono text-[10px] font-black uppercase text-[#69706c]">over</span><PlayerThumbnail slug={other.slug} name={other.name} position={other.position} team={other.team} size={56} /></div><h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.04em]">Start {winner.name} <span className="text-[#69706c]">over {other.name}</span></h3><div className="mt-5 flex flex-wrap items-center gap-4 text-xs"><span className="flex items-center gap-2"><TeamLogo team={winner.team} size={28} />{winner.team} vs. {winner.opponent}</span><span>{winner.projection.availability}</span><span className="font-mono font-bold uppercase group-hover:underline">Open decision →</span></div></Link>;
      })}</div></section>

      <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">How the lean works</span><h2 className="section-title mt-6">A projection with guardrails, not a hot take.</h2></div><div className="space-y-4 text-sm leading-7"><p>Recorded fantasy scoring establishes the baseline. The latest snaps and opportunities move it within a limited range. The opponent&apos;s positional defense applies a second bounded adjustment.</p><p>An injury or practice designation changes the estimate only when it belongs to Week {activeStartSitWeek}. Older reports never silently lower a current-week projection.</p><p>After both players finish, each page publishes the actual score and grades the original lean.</p></div></div></section>

      <section className="page-wrap grid gap-5 py-12 md:grid-cols-3"><Link href={`/fantasy-football-strength-of-schedule/week-${activeStartSitWeek}-wide-receivers`} className="border border-[#171c19] p-6 hover:bg-[#8bcfff]"><strong>Week {activeStartSitWeek} matchup rankings</strong><span className="mt-3 block text-sm">All 32 teams by position →</span></Link><Link href={`/fantasy-football-usage/week-${Math.max(1, activeStartSitWeek - 1)}/running-backs`} className="border border-[#171c19] p-6 hover:bg-[#ffb29a]"><strong>Latest usage reports</strong><span className="mt-3 block text-sm">Snaps, carries and targets →</span></Link><Link href="/fantasy-trade-calculator" className="border border-[#171c19] p-6 hover:bg-[#dfff4f]"><strong>Rest-of-season value</strong><span className="mt-3 block text-sm">Open the redraft calculator →</span></Link></section>
    </>
  );
}
