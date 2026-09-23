import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../../components/AnalyticsPageView";
import JsonLd from "../../../components/JsonLd";
import PlayerThumbnail from "../../../components/PlayerThumbnail";
import { buildPageMetadata } from "../../../lib/metadata";
import { getMarket } from "../../../lib/market";
import { nflversePlayerRelease } from "../../../lib/nflverse";
import { hasPlayerPage } from "../../../lib/player-pages";
import { getUsagePositionConfig, getUsageReadiness, getUsageRows, publishedUsageWeeks, usagePositionConfigs, usageWeekPath } from "../../../lib/usage-reports";
import { weekFromSlug } from "../../../lib/weekly-matchups";

const SITE_URL = "https://fantasytradetarget.com";
type PageProps = { params: Promise<{ weekSlug: string; positionSlug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return publishedUsageWeeks.flatMap((week) => usagePositionConfigs.map(({ slug }) => ({ weekSlug: `week-${week}`, positionSlug: slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { weekSlug, positionSlug } = await params;
  const week = weekFromSlug(weekSlug);
  const config = getUsagePositionConfig(positionSlug);
  if (!week || !config || !getUsageReadiness(week).ready) return {};
  return buildPageMetadata({
    title: `Week ${week} Fantasy Football ${config.label} Usage Report`,
    description: `Week ${week} ${config.label.toLowerCase()} usage: offensive snaps, ${config.volumeLabel.toLowerCase()}, role changes, and Half PPR results.`,
    path: usageWeekPath(week, positionSlug),
  });
}

export default async function UsagePositionPage({ params }: PageProps) {
  const { weekSlug, positionSlug } = await params;
  const week = weekFromSlug(weekSlug);
  const config = getUsagePositionConfig(positionSlug);
  if (!week || !config || !getUsageReadiness(week).ready) notFound();
  const market = await getMarket({ format: "redraft", numQbs: 1, receptionPoints: 0.5 });
  const rows = getUsageRows(week, config, market.assets);
  if (!rows.length) notFound();
  const leader = rows[0];
  const path = usageWeekPath(week, positionSlug);
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(nflversePlayerRelease.capturedAt));

  return (
    <>
      <AnalyticsPageView eventName="weekly_usage_report_viewed" properties={{ week, position: config.position, player_count: rows.length }} />
      <JsonLd data={buildSchema(path, week, config.label, rows)} />
      <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-usage">Usage</Link><span>/</span><span className="text-[#171c19]">Week {week} {config.label}</span></nav>
      <section className="border-y border-[#171c19] bg-[#ffb29a]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">Week {week} · updated {updated}</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Week {week} {config.label.toLowerCase()} <span className="text-[#174f35]">usage report.</span></h1>
          <p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-bold leading-8">{leader.name} leads this week&apos;s role-trend ranking after playing {formatPct(leader.snapPct)} of offensive snaps and recording {leader.volume} {config.volumeLabel.toLowerCase()}.</p>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#414742]">Players are ordered by the combination of snap-share change, opportunity change, and total involvement. The comparison uses each player&apos;s previous four recorded games when available.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="overflow-x-auto border border-[#171c19] bg-white/55">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Player</th><th className="p-4">Matchup</th><th className="p-4">Snap share</th><th className="p-4">Snap change</th><th className="p-4">{config.volumeLabel}</th><th className="p-4">Opportunity change</th><th className="p-4">Half PPR</th></tr></thead>
            <tbody className="divide-y divide-[#bcb9ae]">{rows.slice(0, 50).map((row) => <tr key={row.slug}><td className="p-4 font-mono font-black">#{row.rank}</td><td className="p-4"><div className="flex items-center gap-3"><PlayerThumbnail slug={row.slug} name={row.name} position={config.position} team={row.team} size={48} /><div><div className="font-black">{hasPlayerPage(row.slug) ? <Link href={`/players/${row.slug}`} className="hover:underline">{row.name}</Link> : row.name}</div><span className="mt-1 block text-xs text-[#69706c]">{row.team ?? "—"} · Redraft rank {row.marketRank ?? "—"}</span></div></div></td><td className="p-4 font-mono">{row.opponent ? `vs. ${row.opponent}` : "—"}</td><td className="p-4 font-mono font-black">{formatPct(row.snapPct)}</td><td className={`p-4 font-mono font-black ${deltaClass(row.snapDelta)}`}>{formatPctDelta(row.snapDelta)}</td><td className="p-4 font-mono font-black">{row.volume}</td><td className={`p-4 font-mono font-black ${deltaClass(row.volumeDelta)}`}>{formatNumberDelta(row.volumeDelta)}</td><td className="p-4 font-mono">{row.halfPprPoints?.toFixed(1) ?? "—"}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-6 text-[#69706c]">A dash means the player did not have enough prior games for a comparison. Opportunity is attempts plus carries for quarterbacks, carries plus targets for running backs, and targets for receivers and tight ends.</p>
      </section>
      <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Read the role</span><h2 className="section-title mt-6">Volume can move before fantasy points do.</h2></div><div className="text-sm leading-7"><p>More snaps and opportunities can reveal an expanding role, while a one-week touchdown total can hide a shrinking one.</p><p className="mt-4">Use this report with matchup and availability context. It is not a projection or a start/sit ranking.</p></div></div></section>
      <section className="page-wrap flex flex-wrap gap-3 py-12">{usagePositionConfigs.filter(({ slug }) => slug !== positionSlug).map(({ slug, label }) => <Link key={slug} href={usageWeekPath(week, slug)} className="border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] hover:bg-[#8bcfff]">{label} →</Link>)}</section>
    </>
  );
}

function formatPct(value: number) { return `${Math.round(value * 100)}%`; }
function formatPctDelta(value: number | null) { return value === null ? "—" : `${value >= 0 ? "+" : ""}${Math.round(value * 100)} pts`; }
function formatNumberDelta(value: number | null) { return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}`; }
function deltaClass(value: number | null) { return value === null ? "text-[#69706c]" : value > 0 ? "text-[#267443]" : value < 0 ? "text-[#a23616]" : ""; }

function buildSchema(path: string, week: number, label: string, rows: Awaited<ReturnType<typeof getUsageRows>>) {
  return [{ "@context": "https://schema.org", "@type": "Dataset", name: `Week ${week} ${label} fantasy football usage`, url: `${SITE_URL}${path}`, dateModified: nflversePlayerRelease.capturedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["offensive snap share", "opportunities", "Half PPR fantasy points"] }, { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.map((row) => ({ "@type": "ListItem", position: row.rank, name: `${row.name}: ${formatPct(row.snapPct)} snap share, ${row.volume} opportunities` })) }];
}
