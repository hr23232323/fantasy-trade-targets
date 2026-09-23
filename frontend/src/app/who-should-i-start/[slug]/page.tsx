import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import PlayerPortrait from "../../components/PlayerPortrait";
import TeamLogo from "../../components/TeamLogo";
import { nflversePlayerRelease } from "../../lib/nflverse";
import { getPlayerPage } from "../../lib/player-pages";
import { activeStartSitWeek, getStartSitComparison, getStartSitDecisions, startSitPath, startSitSlugs, type StartSitDecision } from "../../lib/start-sit";

const SITE_URL = "https://fantasytradetarget.com";
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return startSitSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getStartSitComparison(slug);
  if (!comparison) return {};
  const left = getPlayerPage(comparison.leftSlug);
  const right = getPlayerPage(comparison.rightSlug);
  const decision = getStartSitDecisions(comparison).find(({ scoring }) => scoring.key === "half-ppr");
  if (!left || !right || !decision) return {};
  const leader = decision.winner.side === "left" ? decision.left : decision.right;
  const title = `${left.name} or ${right.name}: Who Should I Start Week ${activeStartSitWeek}?`;
  const description = `Start ${leader.name} in Week ${activeStartSitWeek}. Compare Half PPR, PPR and Standard projections using recent usage, matchup strength and current-week availability.`;
  return {
    title,
    description,
    alternates: { canonical: startSitPath(slug) },
    openGraph: { type: "article", url: startSitPath(slug), title, description, images: [{ url: left.image.src, width: left.image.width, height: left.image.height, alt: left.image.alt }] },
    twitter: { card: "summary_large_image", title, description, images: [left.image.src] },
  };
}

export default async function StartSitComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = getStartSitComparison(slug);
  if (!comparison) notFound();
  const leftPage = getPlayerPage(comparison.leftSlug);
  const rightPage = getPlayerPage(comparison.rightSlug);
  const decisions = getStartSitDecisions(comparison);
  const primary = decisions.find(({ scoring }) => scoring.key === "half-ppr");
  if (!leftPage || !rightPage || !primary || decisions.length !== 3) notFound();
  const leader = primary.winner.side === "left" ? primary.left : primary.right;
  const trailer = primary.winner.side === "left" ? primary.right : primary.left;
  const verdict = primary.winner.close
    ? `${leader.name} has the narrow Week ${activeStartSitWeek} lean over ${trailer.name}.`
    : `Start ${leader.name} over ${trailer.name} in Week ${activeStartSitWeek}.`;
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(nflversePlayerRelease.capturedAt));
  const usagePosition = ({ QB: "quarterbacks", RB: "running-backs", WR: "wide-receivers", TE: "tight-ends" } as const)[comparison.position];
  const previousDecision = activeStartSitWeek > 3
    ? getStartSitDecisions(comparison, activeStartSitWeek - 1).find(({ scoring }) => scoring.key === "half-ppr") ?? null
    : null;
  const completedCurrent = primary.left.projection.actual !== null && primary.right.projection.actual !== null;
  const gradedDecision = completedCurrent
    ? primary
    : previousDecision && previousDecision.left.projection.actual !== null && previousDecision.right.projection.actual !== null
      ? previousDecision
      : null;
  const gradedWeek = completedCurrent ? activeStartSitWeek : activeStartSitWeek - 1;

  return (
    <>
      <AnalyticsPageView eventName="start_sit_comparison_viewed" properties={{ week: activeStartSitWeek, comparison: slug, position: comparison.position, leader: leader.slug, projected_gap: primary.winner.gap }} />
      <JsonLd data={buildSchema(slug, comparison, decisions, verdict)} />
      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/who-should-i-start">Start / Sit</Link><span>/</span><span className="text-[#171c19]">{leftPage.name} vs. {rightPage.name}</span></nav>

      <section className="border-y border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">Week {activeStartSitWeek} lineup decision · updated {updated}</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">{leftPage.name} or {rightPage.name}: <span className="text-[#174f35]">who should I start?</span></h1>
          <p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">{verdict} The Half PPR projection is {leader.projection.median.toFixed(1)} to {trailer.projection.median.toFixed(1)}.</p>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#414742]">The lean blends recorded scoring, recent workload, opponent positional defense and only same-week listed availability. Recheck the official inactive list before kickoff.</p>
        </div>
      </section>

      <section className="page-wrap grid gap-6 py-12 lg:grid-cols-2">
        <PlayerCard page={leftPage} side={primary.left} recommended={primary.winner.side === "left"} />
        <PlayerCard page={rightPage} side={primary.right} recommended={primary.winner.side === "right"} />
      </section>

      <section className="page-wrap pb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Scoring changes the call</span><h2 className="section-title mt-5">Week {activeStartSitWeek} projection by format.</h2></div><span className="font-mono text-xs font-bold uppercase">4 points per passing TD</span></div>
        <div className="overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Format</th><th className="p-4">Recommended start</th><th className="p-4">{leftPage.name}</th><th className="p-4">{rightPage.name}</th><th className="p-4">Gap</th><th className="p-4">Confidence</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">{decisions.map((decision) => {
              const winner = decision.winner.side === "left" ? decision.left : decision.right;
              const confidence = lowerConfidence(decision.left.projection.confidence, decision.right.projection.confidence);
              return <tr key={decision.scoring.key}><td className="p-4 font-black">{decision.scoring.label}</td><td className="p-4 font-black text-[#174f35]">{decision.winner.close ? `${winner.name} · close` : winner.name}</td><td className="p-4 font-mono">{range(decision.left.projection)}</td><td className="p-4 font-mono">{range(decision.right.projection)}</td><td className="p-4 font-mono font-black">{decision.winner.gap.toFixed(1)}</td><td className="p-4 font-mono">{confidence}</td></tr>;
            })}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-6 text-[#69706c]">Each range is floor–median–ceiling, built from the player&apos;s recorded game distribution and adjusted within guarded limits for current role and matchup. It is an estimate, not a guarantee.</p>
      </section>

      <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Why the model leans this way</span><h2 className="section-title mt-6">Role first. Matchup second. Availability always visible.</h2></div><div className="space-y-4 text-sm leading-7"><p>{comparison.selectionReason}</p><p>{factorSentence(primary.left)} {factorSentence(primary.right)}</p><p>Availability adjustments apply only when the source contains a Week {activeStartSitWeek} report. Older designations remain visible in the injury archive but do not reduce this projection.</p></div></div></section>

      {gradedDecision ? <ResultSection decision={gradedDecision} week={gradedWeek} /> : null}

      <section className="page-wrap grid gap-6 py-12 md:grid-cols-3">
        <Link href={`/fantasy-football-usage/week-${Math.max(1, activeStartSitWeek - 1)}/${usagePosition}`} className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19] hover:-translate-y-1"><span className="eyebrow">Recent usage</span><strong className="mt-5 block text-xl">Check snaps and opportunities →</strong></Link>
        <Link href="/fantasy-football-injuries" className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19] hover:-translate-y-1"><span className="eyebrow">Availability</span><strong className="mt-5 block text-xl">Open the injury report →</strong></Link>
        <Link href="/fantasy-trade-calculator" className="border border-[#171c19] bg-white p-6 shadow-[4px_4px_0_#171c19] hover:-translate-y-1"><span className="eyebrow">Rest of season</span><strong className="mt-5 block text-xl">Compare redraft value →</strong></Link>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] py-7 text-xs leading-6 text-[#69706c]">Player results, snaps and listed availability: nflverse release <span className="font-mono">{nflversePlayerRelease.releaseId}</span>. Opponent adjustments use {nflversePlayerRelease.positionDefense.season} position-defense results. This page does not include live inactive announcements, weather or betting markets.</aside>
    </>
  );
}

function PlayerCard({ page, side, recommended }: { page: NonNullable<ReturnType<typeof getPlayerPage>>; side: StartSitDecision["left"]; recommended: boolean }) {
  return <article className={`relative overflow-hidden border border-[#171c19] p-6 shadow-[5px_5px_0_#171c19] ${recommended ? "bg-[#dfff4f]" : "bg-white"}`}>
    {recommended ? <span className="absolute right-4 top-4 bg-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase text-white">Start lean</span> : null}
    <div className="grid grid-cols-[112px_1fr] items-end gap-5"><div className="relative h-[148px] w-[112px]"><PlayerPortrait slug={page.slug} name={page.name} image={page.image} position={page.slug.endsWith("-qb") ? "QB" : page.slug.endsWith("-rb") ? "RB" : page.slug.endsWith("-te") ? "TE" : "WR"} team={side.team} variant="card" sizes="112px" /></div><div><h2 className="text-3xl font-black leading-none tracking-[-0.05em]">{page.name}</h2><div className="mt-3 flex items-center gap-2"><TeamLogo team={side.team} size={32} /><span className="font-mono text-xs font-bold">{side.team ?? "—"} vs. {side.opponent ?? "TBD"}</span></div></div></div>
    <div className="mt-7 grid grid-cols-3 border border-[#171c19] bg-white/60 text-center"><Metric label="Floor" value={side.projection.floor.toFixed(1)} /><Metric label="Median" value={side.projection.median.toFixed(1)} /><Metric label="Ceiling" value={side.projection.ceiling.toFixed(1)} /></div>
    <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Recent PPG:</strong> {side.projection.recentPointsPerGame?.toFixed(1) ?? "—"}</p><p><strong>Recent volume:</strong> {side.projection.recentVolume?.toFixed(1) ?? "—"}</p><p><strong>Snap share:</strong> {side.projection.snapShare === null ? "—" : `${Math.round(side.projection.snapShare * 100)}%`}</p><p><strong>Availability:</strong> {side.projection.availability}</p></div>
    <Link href={`/players/${side.slug}`} className="mt-6 inline-block font-mono text-[10px] font-black uppercase underline">Open player file →</Link>
  </article>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border-r border-[#171c19] p-3 last:border-r-0"><span className="block font-mono text-[9px] font-bold uppercase text-[#69706c]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
function range(projection: StartSitDecision["left"]["projection"]) { return `${projection.floor.toFixed(1)}–${projection.median.toFixed(1)}–${projection.ceiling.toFixed(1)}`; }
function lowerConfidence(left: string, right: string) { const rank = { Low: 0, Medium: 1, High: 2 } as const; return rank[left as keyof typeof rank] <= rank[right as keyof typeof rank] ? left : right; }
function factorSentence(side: StartSitDecision["left"]) { const usage = side.projection.usageFactor > 1.02 ? "recent role raises the estimate" : side.projection.usageFactor < 0.98 ? "recent role lowers the estimate" : "recent role is near baseline"; const matchup = side.projection.matchupFactor > 1.02 ? "the matchup helps" : side.projection.matchupFactor < 0.98 ? "the matchup is tougher" : "the matchup is neutral"; return `${side.name}: ${usage}, and ${matchup}.`; }

function ResultSection({ decision, week }: { decision: StartSitDecision; week: number }) {
  const leftActual = decision.left.projection.actual!;
  const rightActual = decision.right.projection.actual!;
  const actualWinner = leftActual >= rightActual ? decision.left : decision.right;
  const projectedWinner = decision.winner.side === "left" ? decision.left : decision.right;
  const correct = actualWinner.slug === projectedWinner.slug;
  return <section className={`border-b border-[#171c19] ${correct ? "bg-[#dfff4f]" : "bg-[#ffb29a]"}`}><div className="page-wrap py-12"><span className="eyebrow bg-white">Week {week} final result</span><h2 className="section-title mt-6">{actualWinner.name} scored more. The pregame lean was {correct ? "right" : "wrong"}.</h2><p className="mt-5 text-sm">{decision.left.name}: {leftActual.toFixed(1)} Half PPR · {decision.right.name}: {rightActual.toFixed(1)} Half PPR.</p></div></section>;
}

function buildSchema(slug: string, comparison: NonNullable<ReturnType<typeof getStartSitComparison>>, decisions: StartSitDecision[], verdict: string) {
  const left = getPlayerPage(comparison.leftSlug)!;
  const right = getPlayerPage(comparison.rightSlug)!;
  return [{ "@context": "https://schema.org", "@type": "Article", headline: `${left.name} or ${right.name}: who should I start in Week ${activeStartSitWeek}?`, description: verdict, dateModified: nflversePlayerRelease.capturedAt, mainEntityOfPage: `${SITE_URL}${startSitPath(slug)}`, author: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: `Should I start ${left.name} or ${right.name} in Week ${activeStartSitWeek}?`, acceptedAnswer: { "@type": "Answer", text: verdict } }, { "@type": "Question", name: "Does PPR scoring change the answer?", acceptedAnswer: { "@type": "Answer", text: decisions.map((decision) => `${decision.scoring.label}: ${decision.winner.side === "left" ? left.name : right.name}`).join("; ") } }] }];
}
