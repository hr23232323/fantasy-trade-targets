import Link from "next/link";
import { getMarket } from "../lib/market";
import { hasPlayerPage } from "../lib/player-pages";
import type { MarketAsset, Position } from "../types/MarketAsset";
import JsonLd from "./JsonLd";

const sections: Array<{ position: Position; label: string; accent: string }> = [
  { position: "QB", label: "Quarterbacks", accent: "bg-[#8bcfff]" },
  { position: "RB", label: "Running backs", accent: "bg-[#ffb29a]" },
  { position: "WR", label: "Wide receivers", accent: "bg-[#dfff4f]" },
  { position: "TE", label: "Tight ends", accent: "bg-[#d7b6ff]" },
  { position: "PICK", label: "Rookie picks", accent: "bg-white" },
];

export default async function ServerRankings() {
  const market = await getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 });
  const groups = sections.map((section) => ({
    ...section,
    assets: market.assets
      .filter((asset) => asset.position === section.position)
      .slice(0, 12),
  }));
  const rankedAssets = groups.flatMap((group) => group.assets);

  return (
    <section className="space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Fantasy Trade Target dynasty rankings",
          url: "https://www.fantasytradetarget.com/dynasty-rankings",
          description:
            "Position-by-position dynasty Superflex market rankings for players and rookie picks.",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rankedAssets.length,
            itemListElement: rankedAssets.map((asset, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: asset.name,
              ...(asset.kind === "player" && hasPlayerPage(asset.slug)
                ? {
                    url: `https://www.fantasytradetarget.com/players/${asset.slug}`,
                  }
                : {}),
            })),
          },
        }}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <article key={group.position} className="overflow-hidden border border-[#171c19] bg-[#f3f0e7] shadow-[4px_4px_0_#171c19]">
            <div className={`${group.accent} border-b border-[#171c19] p-5`}>
              <span className="mono-label">Top 12 // Superflex</span>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{group.label}</h2>
            </div>
            <ol className="divide-y divide-[#c9c5ba]">
              {group.assets.map((asset, index) => (
                <li key={asset.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3">
                  <span className="font-mono text-xs font-black text-[#69706c]">{index + 1}</span>
                  <AssetName asset={asset} />
                  <span className="font-mono text-base font-black tabular-nums">{Math.round(asset.value)}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-3 border border-[#171c19] bg-[#171c19] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-white/60">
          Position lists use the current dynasty Superflex market release.
        </p>
        <Link href="/dynasty-trade-value-chart" className="font-mono text-[10px] font-black uppercase tracking-[0.07em] text-[#dfff4f] hover:text-white">
          Search the complete value chart →
        </Link>
      </div>
    </section>
  );
}

function AssetName({ asset }: { asset: MarketAsset }) {
  const label = (
    <>
      <span className="font-bold">{asset.name}</span>
      <span className="ml-2 font-mono text-[9px] uppercase text-[#69706c]">
        {asset.kind === "player" ? `${asset.team || "FA"} · ${asset.position}${asset.posRank ?? "—"}` : asset.tier || "pick"}
      </span>
    </>
  );

  return asset.kind === "player" && hasPlayerPage(asset.slug) ? (
    <Link href={`/players/${asset.slug}`} className="hover:text-[#a23616] hover:underline hover:underline-offset-4">
      {label}
    </Link>
  ) : (
    <span>{label}</span>
  );
}
