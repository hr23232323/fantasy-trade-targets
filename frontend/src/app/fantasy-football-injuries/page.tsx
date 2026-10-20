import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import InjuryReportTable from "../components/InjuryReportTable";
import JsonLd from "../components/JsonLd";
import PlayerThumbnail from "../components/PlayerThumbnail";
import TeamLogo from "../components/TeamLogo";
import { getCurrentRosterAvailabilityRows, getFantasyInjuryRows, injuryReportAnswer, injuryReportWeeks, injuryWeekPath, latestInjuryReportWeek, rosterAvailabilityAnswer, summarizeInjuryRows } from "../lib/injuries";
import { getCurrentInjuryNews, injuryNewsRelease } from "../lib/injury-news";
import { nflversePlayerRelease } from "../lib/nflverse";
import { activeStartSitWeek } from "../lib/start-sit";

const SITE_URL = "https://fantasytradetarget.com";
const PATH = "/fantasy-football-injuries";

export function generateMetadata(): Metadata {
  const week = latestInjuryReportWeek;
  const rows = week ? getFantasyInjuryRows(week) : [];
  const rosterRows = getCurrentRosterAvailabilityRows(activeStartSitWeek);
  const news = getCurrentInjuryNews(activeStartSitWeek);
  return {
    title: `Week ${activeStartSitWeek} Fantasy Football Injury Report & Availability`,
    description: `${news.length} major Week ${activeStartSitWeek} injury updates and ${rosterRows.length} fantasy-relevant players outside active roster status. Updated ${formatDate(injuryNewsRelease.updatedAt)}.`,
    alternates: { canonical: PATH },
  };
}

export default function FantasyFootballInjuriesPage() {
  const week = latestInjuryReportWeek;
  const rows = week ? getFantasyInjuryRows(week) : [];
  const rosterRows = getCurrentRosterAvailabilityRows(activeStartSitWeek);
  const news = getCurrentInjuryNews(activeStartSitWeek);
  const summary = summarizeInjuryRows(rows);
  const answer = news.length
    ? `${news.slice(0, 4).map((update) => `${update.name}: ${update.status.toLowerCase()}`).join("; ")}.`
    : rosterAvailabilityAnswer(rosterRows);
  const updated = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(nflversePlayerRelease.capturedAt));
  const awaitingCurrentWeek = week !== null && week < activeStartSitWeek;
  return <>
    <AnalyticsPageView eventName="fantasy_injury_report_viewed" properties={{ report_week: week, active_week: activeStartSitWeek, player_count: rows.length, breaking_update_count: news.length }} />
    <JsonLd data={buildSchema(rows, news, week)} />
    <section className="border-b border-[#171c19] bg-[#ffb29a]"><div className="page-wrap py-16 sm:py-24"><span className="eyebrow bg-white">Week {activeStartSitWeek} · updated {updated}</span><h1 className="mt-8 max-w-6xl text-[clamp(3.2rem,7vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Week {activeStartSitWeek} fantasy football <span className="text-[#a23616]">injury report.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-xl font-black leading-9">{answer}</p>{awaitingCurrentWeek ? <p className="mt-6 max-w-3xl border border-[#171c19] bg-white p-4 text-sm font-bold leading-7">Week {activeStartSitWeek} practice designations are not available yet. Current roster moves appear below; Week {week} remains the latest complete team-issued report. Check official inactive lists near kickoff.</p> : null}</div></section>
    {news.length ? <section className="border-b border-[#171c19] bg-[#fff7ef]"><div className="page-wrap py-14"><div className="mb-7"><span className="eyebrow bg-[#ff6b3d]">Major updates · {formatDate(injuryNewsRelease.updatedAt)}</span><h2 className="section-title mt-5">What changed for Week {activeStartSitWeek}.</h2></div><div className="grid gap-4 lg:grid-cols-2">{news.map((update) => <article key={update.slug} className="border border-[#171c19] bg-white p-5 shadow-[4px_4px_0_#171c19]"><div className="flex items-center gap-4"><PlayerThumbnail slug={update.slug} name={update.name} position={fantasyPosition(update.position)} team={update.team} size={64} /><div className="min-w-0"><Link href={`/players/${update.slug}`} className="text-xl font-black hover:underline">{update.name}</Link><div className="mt-1 flex items-center gap-2 font-mono text-[10px] font-black uppercase text-[#69706c]"><TeamLogo team={update.team} size={22} /><span>{update.team} · {update.position}</span></div></div></div><div className="mt-5 flex flex-wrap items-center gap-2"><span className="border border-[#171c19] bg-[#ffb29a] px-3 py-2 font-mono text-[10px] font-black uppercase">{update.status}</span><span className="font-mono text-[10px] font-black uppercase text-[#69706c]">{update.injury}</span></div><p className="mt-4 text-sm leading-6">{update.detail}</p></article>)}</div><p className="mt-5 text-xs leading-6 text-[#69706c]">Source: <a href={injuryNewsRelease.source.url} target="_blank" rel="noreferrer" className="font-bold underline">{injuryNewsRelease.source.name}</a>. Breaking updates remain separate from the team-issued practice table below and expire after Week {injuryNewsRelease.week}.</p></div></section> : null}
    {rosterRows.length ? <section className="page-wrap py-14"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow bg-[#ff6b3d]">Current roster availability · Week {activeStartSitWeek}</span><h2 className="section-title mt-5">Players not currently listed active.</h2></div><Link href="/who-should-i-start" className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Open start/sit →</Link></div><InjuryReportTable rows={rosterRows} /><p className="mt-4 text-xs leading-6 text-[#69706c]">Roster status can update before the weekly practice report. Reserve, inactive and exempt listings are treated as unavailable in Week {activeStartSitWeek} projections when the roster record is current for the week.</p></section> : null}
    <section className="page-wrap grid gap-px border-x border-b border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-5"><StatusCard label="Out" value={summary.out} tone="bg-[#ff6b3d]" /><StatusCard label="Doubtful" value={summary.doubtful} tone="bg-[#ffb29a]" /><StatusCard label="Questionable" value={summary.questionable} tone="bg-[#d7b6ff]" /><StatusCard label="Did not practice" value={summary.didNotPractice} tone="bg-[#8bcfff]" /><StatusCard label="Limited" value={summary.limited} tone="bg-[#dfff4f]" /></section>
    <section className="page-wrap py-14"><div className="mb-7"><span className="eyebrow">Latest complete team report · Week {week ?? "—"}</span><h2 className="section-title mt-5">Practice and game designations.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-[#69706c]">{injuryReportAnswer(rows)}</p></div>{rows.length ? <InjuryReportTable rows={rows} /> : <p className="border border-[#171c19] bg-white p-6">No qualifying fantasy-player reports are available in the latest release.</p>}<p className="mt-4 text-xs leading-6 text-[#69706c]">This page reports team-issued participation and game-status fields. It does not diagnose an injury or predict medical clearance. Official inactive lists near kickoff remain decisive.</p></section>
    <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">Weekly archive</span><h2 className="section-title mt-6">See how availability changed.</h2></div><div className="flex flex-wrap content-start gap-3">{injuryReportWeeks.map((reportWeek) => <Link key={reportWeek} href={injuryWeekPath(reportWeek)} className="border border-[#171c19] bg-white px-5 py-4 font-mono text-[10px] font-black uppercase hover:bg-[#dfff4f]">Week {reportWeek} report →</Link>)}</div></div></section>
    <aside className="page-wrap py-7 text-xs leading-6 text-[#69706c]">Source: nflverse weekly injury reports under CC BY 4.0 · release <span className="font-mono">{nflversePlayerRelease.releaseId}</span>. The page updates only after a complete validated release is available.</aside>
  </>;
}

function buildSchema(rows: ReturnType<typeof getFantasyInjuryRows>, news: ReturnType<typeof getCurrentInjuryNews>, week: number | null) {
  return [{ "@context": "https://schema.org", "@type": "Dataset", name: `Week ${activeStartSitWeek} fantasy football injury and availability report`, description: `Current roster availability plus the latest complete Week ${week ?? "latest"} team-issued practice and game-status records.`, url: `${SITE_URL}${PATH}`, dateModified: new Date(Math.max(Date.parse(nflversePlayerRelease.capturedAt), Date.parse(injuryNewsRelease.updatedAt))).toISOString(), license: "https://creativecommons.org/licenses/by/4.0/", creator: { "@type": "Organization", name: "Fantasy Trade Target", url: SITE_URL }, variableMeasured: ["roster status", "practice participation", "game status", "listed injury"], distribution: { "@type": "DataDownload", contentUrl: nflversePlayerRelease.sources.injuries.url, encodingFormat: "text/csv" } }, { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: news.length + rows.length, itemListElement: [...news.map((update, index) => ({ "@type": "ListItem", position: index + 1, name: `${update.name}: ${update.status}, ${update.injury}` })), ...rows.map((row, index) => ({ "@type": "ListItem", position: news.length + index + 1, name: `${row.name}: ${row.status}, ${row.injury}` }))] }];
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(value)); }

function fantasyPosition(position: string | null) { return position === "QB" || position === "RB" || position === "WR" || position === "TE" ? position : undefined; }

function StatusCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`${tone} p-5`}><span className="font-mono text-[10px] font-black uppercase tracking-[0.08em]">{label}</span><strong className="mt-2 block text-4xl font-black tracking-[-0.06em]">{value}</strong></div>;
}
