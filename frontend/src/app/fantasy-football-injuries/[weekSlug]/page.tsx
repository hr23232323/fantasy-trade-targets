import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import InjuryReportTable from "../../components/InjuryReportTable";
import JsonLd from "../../components/JsonLd";
import { getFantasyInjuryRows, injuryReportWeeks, injuryWeekPath } from "../../lib/injuries";
import { nflversePlayerRelease } from "../../lib/nflverse";

const SITE_URL = "https://fantasytradetarget.com";
type PageProps = { params: Promise<{ weekSlug: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return injuryReportWeeks.map((week) => ({ weekSlug: `week-${week}` })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const week = parseWeek((await params).weekSlug);
  if (!week || !injuryReportWeeks.includes(week)) return {};
  return { title: `Week ${week} Fantasy Football Injury Report (2026)`, description: `Week ${week} fantasy football injury report: listed game designations, practice participation and injuries for fantasy-relevant players.`, alternates: { canonical: injuryWeekPath(week) } };
}

export default async function InjuryWeekPage({ params }: PageProps) {
  const week = parseWeek((await params).weekSlug);
  if (!week || !injuryReportWeeks.includes(week)) notFound();
  const rows = getFantasyInjuryRows(week);
  return <>
    <AnalyticsPageView eventName="fantasy_injury_archive_viewed" properties={{ week, player_count: rows.length }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", name: `Week ${week} fantasy football injury report`, url: `${SITE_URL}${injuryWeekPath(week)}`, dateModified: nflversePlayerRelease.capturedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["practice participation", "game status", "listed injury"] }} />
    <nav className="page-wrap flex gap-2 py-4 font-mono text-[10px] font-bold uppercase text-[#69706c]"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-injuries">Injuries</Link><span>/</span><span>Week {week}</span></nav>
    <section className="border-y border-[#171c19] bg-[#d7b6ff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">2026 weekly availability archive</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Week {week} fantasy football <span className="text-[#5d3b86]">injury report.</span></h1><p className="mt-7 max-w-3xl text-lg font-bold leading-8">The final structured Week {week} practice and game-status snapshot for {rows.length} fantasy-relevant players.</p></div></section>
    <section className="page-wrap py-14"><InjuryReportTable rows={rows} /><p className="mt-4 text-xs leading-6 text-[#69706c]">This archived report preserves listed availability; it does not provide a medical diagnosis or current-week status.</p></section>
    <section className="border-y border-[#171c19] bg-[#dfff4f]"><div className="page-wrap flex flex-wrap items-center justify-between gap-5 py-10"><strong className="text-2xl">Need the latest report?</strong><Link href="/fantasy-football-injuries" className="border border-[#171c19] bg-white px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Current injury report →</Link></div></section>
  </>;
}

function parseWeek(slug: string) { const match = /^week-(\d{1,2})$/.exec(slug); return match ? Number(match[1]) : null; }
