import rookiePickHistoryJson from "../../../data/rookie-pick-history.json";
import rookiePickManifest from "../../../data/rookie-pick-pages.json";
import type { MarketAsset } from "../types/MarketAsset";
import { getMarket, getPickMarket } from "./market";
import { hasPlayerPage } from "./player-pages";

export type RookiePickPageConfig = {
  slug: string;
  id: string;
};

export type RookiePickObservation = {
  observedAt: string;
  releaseId: string;
  oneQbValue: number;
  superflexValue: number;
};

type RookiePickHistory = {
  schemaVersion: number;
  updatedAt: string;
  picks: Record<string, RookiePickObservation[]>;
};

const rookiePickHistory = rookiePickHistoryJson as RookiePickHistory;

export const rookiePickPages = rookiePickManifest satisfies RookiePickPageConfig[];
export const rookiePickSlugs = rookiePickPages.map((page) => page.slug);

export function getRookiePickPage(slug: string) {
  return rookiePickPages.find((page) => page.slug === slug);
}

export function getRookiePickPageById(id: string) {
  return rookiePickPages.find((page) => page.id === id);
}

export function getRelatedRookiePicks(page: RookiePickPageConfig) {
  const index = rookiePickPages.findIndex((candidate) => candidate.id === page.id);
  return [
    rookiePickPages[index - 2],
    rookiePickPages[index - 1],
    rookiePickPages[index + 1],
    rookiePickPages[index + 2],
  ].filter((candidate): candidate is RookiePickPageConfig => Boolean(candidate));
}

export async function getRookiePickResearch(page: RookiePickPageConfig) {
  const leagueSizes = [8, 10, 12, 14, 16] as const;
  const [superflexMarket, oneQbMarket] = await Promise.all([
    getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 }),
    getMarket({ format: "dynasty", numQbs: 1, numTeams: 12 }),
  ]);
  const rawMarkets = Object.fromEntries(
    ([1, 2] as const).flatMap((numQbs) =>
      leagueSizes.map((numTeams) => [
        `${numQbs}:${numTeams}`,
        getPickMarket({ numQbs, numTeams }).assets,
      ]),
    ),
  ) as Record<string, MarketAsset[]>;
  const oneQbPick = findRequired(rawMarkets["1:12"], page.id);
  const superflexPick = findRequired(rawMarkets["2:12"], page.id);
  const reviewedOneQbPlayers = oneQbMarket.assets.filter(
    (asset) => asset.kind === "player" && hasPlayerPage(asset.slug),
  );
  const reviewedSuperflexPlayers = superflexMarket.assets.filter(
    (asset) => asset.kind === "player" && hasPlayerPage(asset.slug),
  );

  return {
    page,
    name: superflexPick.name,
    oneQbPick,
    superflexPick,
    leagueSizes: leagueSizes.map((numTeams) => ({
      numTeams,
      oneQb: rawMarkets[`1:${numTeams}`].find((pick) => pick.id === page.id) ?? null,
      superflex: rawMarkets[`2:${numTeams}`].find((pick) => pick.id === page.id) ?? null,
    })),
    oneQbPlayerEquivalents: nearestAssets(reviewedOneQbPlayers, oneQbPick.value, 4),
    superflexPlayerEquivalents: nearestAssets(
      reviewedSuperflexPlayers,
      superflexPick.value,
      4,
    ),
    crossYear: [2026, 2028].map((year) => ({
      year,
      oneQb: nearestAssets(
        rawMarkets["1:12"].filter((pick) => pick.year === String(year)),
        oneQbPick.value,
        1,
      )[0] ?? null,
      superflex: nearestAssets(
        rawMarkets["2:12"].filter((pick) => pick.year === String(year)),
        superflexPick.value,
        1,
      )[0] ?? null,
    })),
    adjacent: getAdjacentValues(page, rawMarkets),
    oneQbMarketRank:
      oneQbMarket.assets.filter((asset) => asset.value > oneQbPick.value).length + 1,
    superflexMarketRank:
      superflexMarket.assets.filter((asset) => asset.value > superflexPick.value).length + 1,
    history: rookiePickHistory.picks[page.id] ?? [],
    historyUpdatedAt: rookiePickHistory.updatedAt,
    releaseId: superflexMarket.meta.releaseId,
    generatedAt: superflexMarket.meta.generatedAt,
  };
}

function getAdjacentValues(
  page: RookiePickPageConfig,
  markets: Record<string, MarketAsset[]>,
) {
  const index = rookiePickPages.findIndex((candidate) => candidate.id === page.id);
  return [rookiePickPages[index - 1], rookiePickPages[index + 1]]
    .filter((candidate): candidate is RookiePickPageConfig => Boolean(candidate))
    .map((candidate) => ({
      ...candidate,
      oneQb: findRequired(markets["1:12"], candidate.id),
      superflex: findRequired(markets["2:12"], candidate.id),
    }));
}

function nearestAssets(assets: MarketAsset[], value: number, count: number) {
  return [...assets]
    .sort((left, right) => {
      const difference = Math.abs(left.value - value) - Math.abs(right.value - value);
      return difference || right.value - left.value;
    })
    .slice(0, count);
}

function findRequired(assets: MarketAsset[], id: string) {
  const asset = assets.find((candidate) => candidate.id === id);
  if (!asset) throw new Error(`Rookie pick market is missing ${id}`);
  return asset;
}
