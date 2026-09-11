import Link from "next/link";
import { getMarket, getPlayerSnapshotHistory } from "../lib/market";
import { hasPlayerPage } from "../lib/player-pages";
import type { MarketAsset, Position } from "../types/MarketAsset";
import JsonLd from "./JsonLd";

const sections: Array<{ position: Position; label: string; accent: string }> = [
  { position: "QB", label: "Quarterbacks", accent: "bg-[#8bcfff]" },
  { position: "RB", label: "Running backs", accent: "bg-[#ffb29a]" },
  { position: "WR", label: "Wide receivers", accent: "bg-[#dfff4f]" },
  { position: "TE", label: "Tight ends", accent: "bg-[#d7b6ff]" },
  { position: "PICK", label: "2027 rookie picks", accent: "bg-white" },
];

export default async function ServerRankings() {
  const [superflex, oneQb] = await Promise.all([
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 }),
    getMarket({ format: "dynasty", numQbs: 1, numTeams: 12 }),
  ]);
  const oneQbById = new Map(oneQb.assets.map((asset) => [asset.id, asset]));
  const history = getPlayerSnapshotHistory();
  const cutoff = Date.parse(superflex.meta.generatedAt) - 7 * 24 * 60 * 60 * 1_000;
  const sevenDayChange = (asset: MarketAsset) => {
    if (asset.kind !== "player") return null;
    const comparison = [...(history[asset.slug] ?? [])]
      .filter((item) => Date.parse(item.observedAt) <= cutoff)
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];
    return comparison ? Math.round(asset.value - comparison.value) : null;
  };
  const groups = sections.map((section) => ({
    ...section,
    assets: superflex.assets.filter((asset) => asset.position === section.position),
  }));
  const movers = superflex.assets
    .filter((asset) => asset.kind === "player")
    .map((asset) => ({ asset, change: sevenDayChange(asset) }))
    .filter((entry): entry is { asset: MarketAsset; change: number } => entry.change !== null)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 10);

  return (
    <section className="space-y-10">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Complete dynasty Superflex and 1QB rankings",
        url: "https://fantasytradetarget.com/dynasty-rankings",
        dateModified: superflex.meta.generatedAt,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: superflex.assets.length,
          itemListElement: superflex.assets.slice(0, 100).map((asset, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: asset.name,
            ...(asset.kind === "player" && hasPlayerPage(asset.slug)
              ? { url: `https://fantasytradetarget.com/players/${asset.slug}` }
              : {}),
          })),
        },
      }} />
      <nav className="flex flex-wrap gap-2" aria-label="Ranking sections">
        {groups.map((group) => <a key={group.position} href={`#${group.position.toLowerCase()}-rankings`} className="border border-[#171c19] bg-white/60 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.07em] hover:bg-[#dfff4f]">{group.label} ({group.assets.length})</a>)}
      </nav>
      {movers.length > 0 && (
        <section aria-labelledby="seven-day-movers" className="border border-[#171c19] bg-[#171c19] p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><span className="mono-label text-[#dfff4f]">Market movement</span><h2 id="seven-day-movers" className="mt-3 text-3xl font-black tracking-[-0.05em]">Biggest movers over seven days</h2></div><span className="mono-label text-white/55">Absolute Superflex value change</span></div>
          <div className="mt-6 grid gap-px bg-white/25 sm:grid-cols-2 lg:grid-cols-5">
            {movers.map(({ asset, change }) => <div key={asset.id} className="bg-[#171c19] p-4"><AssetName asset={asset} /><strong className={`mt-3 block font-mono text-xl ${change >= 0 ? "text-[#dfff4f]" : "text-[#ffb29a]"}`}>{change > 0 ? "+" : ""}{change}</strong></div>)}
          </div>
        </section>
      )}
      {groups.map((group) => (
        <article id={`${group.position.toLowerCase()}-rankings`} key={group.position} className="scroll-mt-24 overflow-hidden border border-[#171c19] bg-[#f3f0e7] shadow-[4px_4px_0_#171c19]">
          <div className={`${group.accent} flex flex-wrap items-end justify-between gap-3 border-b border-[#171c19] p-5`}><div><span className="mono-label">Complete current market</span><h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{group.label}</h2></div><span className="mono-label">{group.assets.length} ranked assets</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-3">SF rank</th><th className="p-3">Asset</th><th className="p-3 text-right">Superflex</th><th className="p-3 text-right">1QB</th><th className="p-3 text-right">7-day</th></tr></thead>
            <tbody className="divide-y divide-[#c9c5ba]">{group.assets.map((asset, index) => {
              const alternate = oneQbById.get(asset.id);
              const change = sevenDayChange(asset);
              return <tr key={asset.id} className="hover:bg-white/70"><td className="p-3 font-mono text-xs font-black text-[#69706c]">{index + 1}</td><td className="p-3"><AssetName asset={asset} /></td><td className="p-3 text-right font-mono font-black tabular-nums">{Math.round(asset.value)}</td><td className="p-3 text-right font-mono tabular-nums">{alternate ? Math.round(alternate.value) : "—"}</td><td className={`p-3 text-right font-mono font-black tabular-nums ${change === null ? "text-[#8a8f8b]" : change > 0 ? "text-[#466400]" : change < 0 ? "text-[#a23616]" : "text-[#69706c]"}`}>{change === null ? "—" : `${change > 0 ? "+" : ""}${change}`}</td></tr>;
            })}</tbody>
          </table></div>
        </article>
      ))}
      <div className="flex flex-col gap-3 border border-[#171c19] bg-[#171c19] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.07em] text-white/60">All values come from release {superflex.meta.releaseId}. Standard scoring is the neutral reference.</p><Link href="/dynasty-trade-value-chart" className="font-mono text-[10px] font-black uppercase tracking-[0.07em] text-[#dfff4f] hover:text-white">Search the interactive value chart →</Link></div>
    </section>
  );
}

function AssetName({ asset }: { asset: MarketAsset }) {
  const label = <><span className="font-bold">{asset.name}</span><span className="ml-2 font-mono text-[9px] uppercase text-[#69706c]">{asset.kind === "player" ? `${asset.team || "FA"} · ${asset.position}${asset.posRank ?? "—"}` : asset.tier || "pick"}</span></>;
  return asset.kind === "player" && hasPlayerPage(asset.slug) ? <Link href={`/players/${asset.slug}`} className="hover:text-[#a23616] hover:underline hover:underline-offset-4">{label}</Link> : <span>{label}</span>;
}
