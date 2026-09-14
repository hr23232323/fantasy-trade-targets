import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import { buildPageMetadata } from "../lib/metadata";
import { nflversePlayerRelease } from "../lib/nflverse";
import { publishedUsageWeeks, usagePositionConfigs, usageWeekPath } from "../lib/usage-reports";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "Fantasy Football Usage Report: Snaps, Targets & Carries",
  description: "Weekly fantasy football usage reports for quarterbacks, running backs, wide receivers, and tight ends using snaps, targets, carries, and passing attempts.",
  path: "/fantasy-football-usage",
});

export default function FantasyFootballUsageHub() {
  const latestWeek = publishedUsageWeeks.at(-1) ?? null;
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(nflversePlayerRelease.capturedAt));

  return (
    <>
      <AnalyticsPageView eventName="weekly_usage_hub_viewed" properties={{ published_week_count: publishedUsageWeeks.length, latest_week: latestWeek }} />
      <JsonLd data={buildSchema()} />
      <section className="border-b border-[#171c19] bg-[#ffb29a]">
        <div className="page-wrap py-14 sm:py-20">
          <span className="eyebrow bg-white">Weekly role report · updated {updated}</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Fantasy football <span className="text-[#174f35]">usage report.</span></h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8">See who earned the snaps and opportunities that drive fantasy production. Every report covers the full NFL week across quarterbacks, running backs, wide receivers, and tight ends.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        {latestWeek ? (
          <>
            <span className="eyebrow bg-[#dfff4f]">Latest · Week {latestWeek}</span>
            <h2 className="section-title mt-6">Follow the role before the box score catches up.</h2>
            <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
              {usagePositionConfigs.map((config, index) => <Link key={config.slug} href={usageWeekPath(latestWeek, config.slug)} className={`group p-6 hover:bg-white ${index % 2 ? "bg-[#8bcfff]" : "bg-[#dfff4f]"}`}><span className="mono-label">Week {latestWeek}</span><h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">{config.label}</h3><p className="mt-3 text-sm text-[#414742]">Snaps · {config.volumeLabel.toLowerCase()} · fantasy points</p><span className="mt-6 block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">Open report →</span></Link>)}
            </div>
          </>
        ) : (
          <div className="border border-[#171c19] bg-[#dfff4f] p-8 sm:p-10">
            <span className="eyebrow bg-white">Week 1</span>
            <h2 className="section-title mt-6 max-w-3xl">The first full report lands after Monday night.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#414742]">We publish after every game is final and official snap counts are available, so the rankings compare a complete week.</p>
          </div>
        )}
      </section>
      {publishedUsageWeeks.length > 1 && <section className="page-wrap pb-14"><h2 className="text-2xl font-black">Earlier reports</h2><div className="mt-5 flex flex-wrap gap-3">{publishedUsageWeeks.slice(0, -1).reverse().map((week) => <Link key={week} href={usageWeekPath(week, "running-backs")} className="border border-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.08em] hover:bg-[#dfff4f]">Week {week} →</Link>)}</div></section>}
      <section className="border-y border-[#171c19] bg-[#8bcfff]"><div className="page-wrap grid gap-8 py-12 lg:grid-cols-2"><div><span className="eyebrow bg-white">What it measures</span><h2 className="section-title mt-6">Opportunity you can verify.</h2></div><div className="text-sm leading-7"><p>Quarterbacks are compared by attempts and carries. Running backs use carries plus targets. Wide receivers and tight ends use targets. Every position includes offensive snap share.</p><p className="mt-4">Usage describes a player&apos;s role; it is not a projection or a start/sit recommendation.</p></div></div></section>
    </>
  );
}

function buildSchema() {
  const url = `${SITE_URL}/fantasy-football-usage`;
  return { "@context": "https://schema.org", "@type": "CollectionPage", url, name: "Fantasy football weekly usage reports", dateModified: nflversePlayerRelease.capturedAt, mainEntity: { "@type": "ItemList", numberOfItems: publishedUsageWeeks.length * usagePositionConfigs.length, itemListElement: publishedUsageWeeks.flatMap((week) => usagePositionConfigs.map((config) => ({ "@type": "ListItem", position: (week - 1) * 4 + usagePositionConfigs.indexOf(config) + 1, name: `Week ${week} ${config.label} usage report`, url: `${SITE_URL}${usageWeekPath(week, config.slug)}` }))) } };
}
