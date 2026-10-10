import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import PlayerThumbnail from "../components/PlayerThumbnail";
import { restOfSeasonUpdatedAt, restOfSeasonWeek } from "../lib/rest-of-season";
import { getRestOfSeasonComparisonCards, restOfSeasonComparisonPath, restOfSeasonLeader } from "../lib/rest-of-season-comparisons";

const SITE_URL = "https://fantasytradetarget.com";
const PATH = "/fantasy-football-rest-of-season-comparisons";

export const metadata: Metadata = {
  title: "Rest-of-Season Fantasy Football Player Comparisons (2026)",
  description: "Compare 30 close rest-of-season fantasy football decisions in PPR, Half PPR and Standard using current production, workload and remaining schedule.",
  alternates: { canonical: PATH },
};

export default async function RestOfSeasonComparisonsHub() {
  const cards = await getRestOfSeasonComparisonCards();
  const updated = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(restOfSeasonUpdatedAt));
  const positions = ["QB", "RB", "WR", "TE"] as const;
  return <>
    <AnalyticsPageView eventName="rest_of_season_comparisons_viewed" properties={{ page_type: "hub", comparison_count: cards.length, current_week: restOfSeasonWeek }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "2026 rest-of-season fantasy football player comparisons", description: "Head-to-head rest-of-season rankings for close fantasy football decisions.", url: `${SITE_URL}${PATH}`, dateModified: restOfSeasonUpdatedAt, mainEntity: { "@type": "ItemList", numberOfItems: cards.length, itemListElement: cards.map(({ comparison, left, right }, index) => ({ "@type": "ListItem", position: index + 1, name: `${left.name} vs. ${right.name} rest of season`, url: `${SITE_URL}${restOfSeasonComparisonPath(comparison.slug)}` })) } }} />
    <nav className="page-wrap flex flex-wrap gap-2 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/fantasy-football-rest-of-season-rankings">ROS rankings</Link><span>/</span><span className="text-[#171c19]">Player comparisons</span></nav>
    <section className="border-y border-[#171c19] bg-[#d7b6ff]"><div className="page-wrap py-14 sm:py-20"><span className="eyebrow bg-white">Rest of 2026 · after Week {Math.max(0, restOfSeasonWeek - 1)} · updated {updated}</span><h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Rest-of-season fantasy football <span className="text-[#5c2b7d]">player comparisons.</span></h1><p className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5 text-lg font-black leading-8">Thirty close roster decisions, answered with current redraft value, recent production, workload and the remaining schedule.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/fantasy-football-rest-of-season-rankings" className="border border-[#171c19] bg-white px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Open all ROS rankings →</Link><Link href="/who-should-i-start" className="border border-[#171c19] bg-[#dfff4f] px-5 py-4 font-mono text-[10px] font-black uppercase shadow-[3px_3px_0_#171c19]">Make a weekly decision →</Link></div></div></section>
    {positions.map((position) => {
      const group = cards.filter(({ comparison }) => comparison.position === position);
      return <section key={position} className="page-wrap py-12"><div className="mb-7 flex items-end justify-between gap-4 border-t border-[#171c19] pt-6"><div><span className="eyebrow">{position} decisions</span><h2 className="section-title mt-5">Who ranks higher the rest of the way?</h2></div><Link href={`/fantasy-football-rest-of-season-rankings/${positionPath(position)}`} className="hidden font-mono text-[10px] font-black uppercase underline sm:block">All {position} rankings →</Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{group.map(({ comparison, left, right }) => {
        const { leader, trailer } = restOfSeasonLeader(left, right);
        return <Link key={comparison.slug} href={restOfSeasonComparisonPath(comparison.slug)} className="group border border-[#171c19] bg-white p-5 shadow-[4px_4px_0_#171c19] transition-transform hover:-translate-y-1"><div className="flex items-center justify-between gap-3"><PlayerThumbnail slug={left.slug} name={left.name} position={left.position} team={left.team} size={48} /><span className="font-mono text-[9px] font-black uppercase text-[#69706c]">Rest of season</span><PlayerThumbnail slug={right.slug} name={right.name} position={right.position} team={right.team} size={48} /></div><h3 className="mt-5 text-xl font-black tracking-[-0.035em]">{left.name} or {right.name}?</h3><p className="mt-3 text-sm leading-6 text-[#59605c]"><strong className="text-[#174f35]">{leader.name}</strong> leads PPR {position} #{leader.formats.ppr.rank} to #{trailer.formats.ppr.rank}.</p><span className="mt-5 block font-mono text-[10px] font-black uppercase group-hover:underline">See the full comparison →</span></Link>;
      })}</div></section>;
    })}
  </>;
}

function positionPath(position: "QB" | "RB" | "WR" | "TE") { return ({ QB: "quarterbacks", RB: "running-backs", WR: "wide-receivers", TE: "tight-ends" } as const)[position]; }
