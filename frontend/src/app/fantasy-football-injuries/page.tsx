import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import InjuryReportTable from "../components/InjuryReportTable";
import JsonLd from "../components/JsonLd";
import { getFantasyInjuryRows, injuryReportWeeks, injuryWeekPath, latestInjuryReportWeek } from "../lib/injuries";
import { nflversePlayerRelease } from "../lib/nflverse";
import { activeStartSitWeek } from "../lib/start-sit";

const SITE_URL = "https://fantasytradetarget.com";
const PATH = "/fantasy-football-injuries";

export const metadata: Metadata = {
  title: "Fantasy Football Injury Report: Latest Practice & Game Status",
  description: "Current fantasy football injury report with official listed game status, practice participation, team, position and weekly availability history.",
  alternates: { canonical: PATH },
};

export default function FantasyFootballInjuriesPage() {
  const week = latestInjuryReportWeek;
  const rows = week ? getFantasyInjuryRows(week) : [];
  const updated = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(nflversePlayerRelease.capturedAt));
  const awaitingCurrentWeek = week !== null && week < activeStartSitWeek;
  return <>
    <AnalyticsPageView eventName="fantasy_injury_report_viewed" properties={{ report_week: week, active_week: activeStartSitWeek, player_count: rows.length }} />
    <JsonLd data={buildSchema(rows, week)} />
    <section className="border-b border-[#171c19] bg-[#ffb29a]"><div className="page-wrap py-16 sm:py-24"><span className="eyebrow bg-white">2026 availability tracker · updated {updated}</span><h1 className="mt-8 max-w-6xl text-[clamp(3.2rem,7vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Fantasy football <span className="text-[#a23616]">injury report.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-xl font-black leading-9">Officially listed practice participation and game designations for fantasy-relevant players. Latest structured report: Week {week ?? "—"}.</p>{awaitingCurrentWeek ? <p className="mt-6 max-w-3xl border border-[#171c19] bg-white p-4 text-sm font-bold leading-7">Week {activeStartSitWeek} practice reports have not reached the structured feed yet. Week {week} remains visible as history and does not reduce Week {activeStartSitWeek} start/sit projections.</p> : null}</div></section>
    <section className="page-wrap py-14"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Latest report · Week {week ?? "—"}</span><h2 className="section-title mt-5">Players with a meaningful listing.</h2></div><Link href="/who-should-i-start" className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Open start/sit →</Link></div>{rows.length ? <InjuryReportTable rows={rows} /> : <p className="border border-[#171c19] bg-white p-6">No qualifying fantasy-player reports are available in the latest release.</p>}<p className="mt-4 text-xs leading-6 text-[#69706c]">This page reports team-issued participation and game-status fields. It does not diagnose an injury or predict medical clearance. Official inactive lists near kickoff remain decisive.</p></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Weekly archive</span><h2 className="section-title mt-6">See how availability changed.</h2></div><div className="flex flex-wrap content-start gap-3">{injuryReportWeeks.map((reportWeek) => <Link key={reportWeek} href={injuryWeekPath(reportWeek)} className="border border-[#171c19] bg-white px-5 py-4 font-mono text-[10px] font-black uppercase hover:bg-[#dfff4f]">Week {reportWeek} report →</Link>)}</div></div></section>
    <aside className="page-wrap py-7 text-xs leading-6 text-[#69706c]">Source: nflverse weekly injury reports under CC BY 4.0 · release <span className="font-mono">{nflversePlayerRelease.releaseId}</span>. The page updates only after a complete validated release is available.</aside>
  </>;
}

function buildSchema(rows: ReturnType<typeof getFantasyInjuryRows>, week: number | null) {
  return [{ "@context": "https://schema.org", "@type": "Dataset", name: `Week ${week ?? "latest"} fantasy football injury report`, description: "Team-issued practice participation and game-status records for fantasy-relevant NFL players.", url: `${SITE_URL}${PATH}`, dateModified: nflversePlayerRelease.capturedAt, creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["practice participation", "game status", "listed injury"], distribution: { "@type": "DataDownload", contentUrl: nflversePlayerRelease.sources.injuries.url, encodingFormat: "text/csv" } }, { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.map((row, index) => ({ "@type": "ListItem", position: index + 1, name: `${row.name}: ${row.status}, ${row.injury}` })) }];
}
