import manifest from "../../../data/rest-of-season-comparisons.json";
import { getPlayerPage } from "./player-pages";
import { getRestOfSeasonRankingRows, type RestOfSeasonRankingRow } from "./rest-of-season";

export type RestOfSeasonComparisonConfig = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  position: "QB" | "RB" | "WR" | "TE";
  selectionReason: string;
};

export const restOfSeasonComparisons = (manifest as RestOfSeasonComparisonConfig[]).filter((comparison) =>
  Boolean(getPlayerPage(comparison.leftSlug) && getPlayerPage(comparison.rightSlug)),
);
export const restOfSeasonComparisonSlugs = restOfSeasonComparisons.map(({ slug }) => slug);

export function getRestOfSeasonComparison(slug: string) {
  return restOfSeasonComparisons.find((comparison) => comparison.slug === slug) ?? null;
}

export function restOfSeasonComparisonPath(slug?: string) {
  return slug
    ? `/fantasy-football-rest-of-season-comparisons/${slug}`
    : "/fantasy-football-rest-of-season-comparisons";
}

export async function getRestOfSeasonComparisonRows(comparison: RestOfSeasonComparisonConfig) {
  const rows = await getRestOfSeasonRankingRows(comparison.position);
  const left = rows.find(({ slug }) => slug === comparison.leftSlug);
  const right = rows.find(({ slug }) => slug === comparison.rightSlug);
  return left && right ? { left, right } : null;
}

export async function getRestOfSeasonComparisonCards() {
  const positions = ["QB", "RB", "WR", "TE"] as const;
  const rankingGroups = await Promise.all(positions.map(async (position) => [position, await getRestOfSeasonRankingRows(position)] as const));
  const rowsByPosition = Object.fromEntries(rankingGroups.map(([position, rows]) => [position, new Map(rows.map((row) => [row.slug, row]))])) as Record<(typeof positions)[number], Map<string, RestOfSeasonRankingRow>>;
  return restOfSeasonComparisons.flatMap((comparison) => {
    const left = rowsByPosition[comparison.position].get(comparison.leftSlug);
    const right = rowsByPosition[comparison.position].get(comparison.rightSlug);
    return left && right ? [{ comparison, left, right }] : [];
  });
}

export function restOfSeasonLeader(left: RestOfSeasonRankingRow, right: RestOfSeasonRankingRow, format: "standard" | "halfPpr" | "ppr" = "ppr") {
  const leftView = left.formats[format];
  const rightView = right.formats[format];
  return leftView.rank < rightView.rank || (leftView.rank === rightView.rank && leftView.rating >= rightView.rating)
    ? { leader: left, trailer: right }
    : { leader: right, trailer: left };
}

export function getRelatedRestOfSeasonComparisons(comparison: RestOfSeasonComparisonConfig, limit = 4) {
  return restOfSeasonComparisons.filter((candidate) =>
    candidate.slug !== comparison.slug &&
    (candidate.leftSlug === comparison.leftSlug || candidate.rightSlug === comparison.leftSlug || candidate.leftSlug === comparison.rightSlug || candidate.rightSlug === comparison.rightSlug),
  ).slice(0, limit);
}
