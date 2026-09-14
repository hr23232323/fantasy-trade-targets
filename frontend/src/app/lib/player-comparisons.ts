import comparisonManifest from "../../../data/player-comparisons.json";
import publicRelease from "../../../data/public-release.json";

export type ComparisonPosition = "QB" | "RB" | "WR" | "TE";

export type PlayerComparisonConfig = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  position: ComparisonPosition;
  editorialLens: string;
  decisionFrame: string;
};

const requiredMarketKeys = ["dynasty:2:0", "dynasty:1:0", "dynasty:2:1", "redraft:1:0"] as const;
const supportedPlayerSlugs = requiredMarketKeys
  .map((key) => new Set(publicRelease.playerMarkets[key].data.map(({ slug }) => slug)))
  .reduce((supported, market) => new Set([...supported].filter((slug) => market.has(slug))));

export const playerComparisons = comparisonManifest
  .filter(({ leftSlug, rightSlug }) => supportedPlayerSlugs.has(leftSlug) && supportedPlayerSlugs.has(rightSlug))
  .map((comparison) => ({
    ...comparison,
    position: comparison.position as ComparisonPosition,
  })) satisfies PlayerComparisonConfig[];

export const playerComparisonSlugs = playerComparisons.map(
  (comparison) => comparison.slug,
);

export function getPlayerComparison(slug: string) {
  return playerComparisons.find((comparison) => comparison.slug === slug);
}

export function getComparisonForPlayer(playerSlug: string) {
  return playerComparisons.find(
    (comparison) =>
      comparison.leftSlug === playerSlug || comparison.rightSlug === playerSlug,
  );
}

export function getRelatedComparisons(comparison: PlayerComparisonConfig) {
  return playerComparisons
    .filter(
      (candidate) =>
        candidate.slug !== comparison.slug &&
        candidate.position === comparison.position,
    )
    .slice(0, 3);
}
