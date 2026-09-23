import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import PlayerThumbnail from "../components/PlayerThumbnail";
import { buildPageMetadata } from "../lib/metadata";
import { getPlayerPickComparisonResearch, pickLabel, playerPickComparisons } from "../lib/player-pick-comparisons";

const SITE_URL = "https://fantasytradetarget.com";

export const metadata = buildPageMetadata({
  title: "Dynasty Player vs. Rookie Pick Trade Values",
  description: "Compare current dynasty players with exact 2027 rookie picks in Superflex and 1QB leagues using the same validated market release.",
  path: "/player-vs-rookie-pick",
});

export default async function PlayerVsPickHub() {
  const research = await Promise.all(playerPickComparisons.map(getPlayerPickComparisonResearch));
  return (
    <>
      <AnalyticsPageView eventName="player_pick_comparison_hub_viewed" properties={{ experiment: "player_vs_exact_pick", comparison_count: research.length, release_id: research[0]?.releaseId }} />
      <JsonLd data={buildSchema(research)} />
      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap py-14 sm:py-20">
          <span className="mono-label text-[#dfff4f]">Dynasty decisions // player or pick</span>
          <h1 className="mt-7 max-w-6xl text-[clamp(3rem,7vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">Player vs. <span className="text-[#8bcfff]">rookie pick values.</span></h1>
          <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-white/70">Twenty close market decisions between a known NFL player and one exact 2027 draft slot. Every page compares Superflex and 1QB separately and opens the actual trade in the calculator.</p>
        </div>
      </section>
      <section className="page-wrap py-14">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">
          {research.map((item, index) => {
            const row = item.superflex;
            const pick = pickLabel(item.page.pickId);
            const answer = row.leader === "even" ? "Even market value" : row.leader === "player" ? `${row.player.name} +${row.gap}` : `${pick} +${Math.abs(row.gap)}`;
            return (
              <Link key={item.page.slug} href={`/player-vs-rookie-pick/${item.page.slug}`} className={`group p-6 hover:bg-white ${index % 4 < 2 ? "bg-[#f3f0e7]" : "bg-[#dfff4f]"}`}>
                <span className="mono-label text-[#69706c]">12-team Superflex</span>
                <PlayerThumbnail slug={row.player.slug} name={row.player.name} position={row.player.position} team={row.player.team} size={72} className="mt-5" />
                <h2 className="mt-5 text-2xl font-black tracking-[-0.045em]">{row.player.name} vs. {pick}</h2>
                <p className="mt-4 font-mono text-sm font-black text-[#a23616]">{answer}</p>
                <p className="mt-3 text-xs leading-6 text-[#59605c]">Player {Math.round(row.player.value)} · Pick {Math.round(row.pick.value)} · {row.gapPercent}% gap</p>
                <span className="mt-7 block font-mono text-[10px] font-black uppercase tracking-[0.08em] group-hover:underline">Compare both formats →</span>
              </Link>
            );
          })}
        </div>
      </section>
      <aside className="page-wrap border-t border-[#9d9a91] py-8 text-xs leading-6 text-[#69706c]">These are current market-price comparisons, not rookie outcome forecasts. A known player and an unassigned pick can carry similar market values while holding very different risk, liquidity, and roster utility.</aside>
    </>
  );
}

function buildSchema(research: Awaited<ReturnType<typeof getPlayerPickComparisonResearch>>[]) {
  const url = `${SITE_URL}/player-vs-rookie-pick`;
  return { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${url}#collection`, url, name: "Dynasty player vs. rookie pick trade values", dateModified: research[0]?.generatedAt, mainEntity: { "@type": "ItemList", numberOfItems: research.length, itemListElement: research.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: `${item.superflex.player.name} vs. ${pickLabel(item.page.pickId)}`, url: `${url}/${item.page.slug}` })) } };
}
