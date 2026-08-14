import comparisonManifest from "../../../data/player-comparisons.json";

export type ComparisonPosition = "QB" | "RB" | "WR" | "TE";

export type PlayerComparisonConfig = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  position: ComparisonPosition;
  editorialLens: string;
  decisionFrame: string;
};

export const playerComparisons = comparisonManifest.map((comparison) => ({
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
