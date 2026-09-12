import manifest from "../../../data/player-pick-comparisons.json";
import type { MarketAsset } from "../types/MarketAsset";
import { getMarket, getPickMarket } from "./market";

export type PlayerPickComparisonConfig = {
  slug: string;
  playerSlug: string;
  pickId: string;
};

export const playerPickComparisons = manifest satisfies PlayerPickComparisonConfig[];
export const playerPickComparisonSlugs = playerPickComparisons.map((page) => page.slug);

export function getPlayerPickComparison(slug: string) {
  return playerPickComparisons.find((page) => page.slug === slug);
}

export function getRelatedPlayerPickComparisons(page: PlayerPickComparisonConfig) {
  const index = playerPickComparisons.findIndex((candidate) => candidate.slug === page.slug);
  return [playerPickComparisons[index - 2], playerPickComparisons[index - 1], playerPickComparisons[index + 1], playerPickComparisons[index + 2]]
    .filter((candidate): candidate is PlayerPickComparisonConfig => Boolean(candidate));
}

export async function getPlayerPickComparisonResearch(page: PlayerPickComparisonConfig) {
  const [superflexMarket, oneQbMarket] = await Promise.all([
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 }),
    getMarket({ format: "dynasty", numQbs: 1, numTeams: 12 }),
  ]);
  const superflexPicks = getPickMarket({ numQbs: 2, numTeams: 12 }).assets;
  const oneQbPicks = getPickMarket({ numQbs: 1, numTeams: 12 }).assets;
  const superflexPlayer = findRequired(superflexMarket.assets, page.playerSlug);
  const oneQbPlayer = findRequired(oneQbMarket.assets, page.playerSlug);
  const superflexPick = findRequired(superflexPicks, page.pickId);
  const oneQbPick = findRequired(oneQbPicks, page.pickId);

  return {
    page,
    superflex: comparisonRow(superflexPlayer, superflexPick),
    oneQb: comparisonRow(oneQbPlayer, oneQbPick),
    generatedAt: superflexMarket.meta.generatedAt,
    releaseId: superflexMarket.meta.releaseId,
  };
}

function comparisonRow(player: MarketAsset, pick: MarketAsset) {
  const gap = Math.round(player.value - pick.value);
  const gapPercent = Math.round((Math.abs(gap) / Math.max(player.value, pick.value, 1)) * 100);
  return {
    player,
    pick,
    gap,
    gapPercent,
    leader: gap === 0 ? "even" as const : gap > 0 ? "player" as const : "pick" as const,
  };
}

function findRequired(assets: MarketAsset[], id: string) {
  const asset = assets.find((candidate) => candidate.id === id || candidate.slug === id);
  if (!asset) throw new Error(`Player-vs-pick experiment is missing ${id}`);
  return asset;
}

export function pickLabel(id: string) {
  const match = /^pick_(\d{4})_(\d)_(\d{2})$/.exec(id);
  return match ? `${match[1]} Pick ${Number(match[2])}.${match[3]}` : id;
}
