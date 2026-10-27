import manifest from "../../../data/trade-decision-comparisons.json";
import { getPlayerPage } from "./player-pages";
import { getRestOfSeasonRankingRows, type RestOfSeasonRankingRow, type RestOfSeasonScoringKey } from "./rest-of-season";

export type TradeDecisionConfig = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
};

export const tradeDecisionComparisons = (manifest as TradeDecisionConfig[]).filter(({ leftSlug, rightSlug }) =>
  Boolean(getPlayerPage(leftSlug) && getPlayerPage(rightSlug)),
);
export const tradeDecisionSlugs = tradeDecisionComparisons.map(({ slug }) => slug);

export function tradeFinderPath(slug?: string) {
  return slug ? `/should-i-trade/${slug}` : "/fantasy-football-trade-finder";
}

export function getTradeDecision(slug: string) {
  return tradeDecisionComparisons.find((comparison) => comparison.slug === slug) ?? null;
}

export async function getTradeDecisionRows(comparison: TradeDecisionConfig) {
  const rows = await getRestOfSeasonRankingRows("ALL");
  const left = rows.find(({ slug }) => slug === comparison.leftSlug);
  const right = rows.find(({ slug }) => slug === comparison.rightSlug);
  return left && right ? { left, right } : null;
}

export async function getTradeDecisionCards() {
  const rows = await getRestOfSeasonRankingRows("ALL");
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return tradeDecisionComparisons.flatMap((comparison) => {
    const left = bySlug.get(comparison.leftSlug);
    const right = bySlug.get(comparison.rightSlug);
    return left && right ? [{ comparison, left, right }] : [];
  });
}

export function tradeDecisionLeader(left: RestOfSeasonRankingRow, right: RestOfSeasonRankingRow, format: RestOfSeasonScoringKey = "ppr") {
  return left.formats[format].rating >= right.formats[format].rating
    ? { leader: left, trailer: right }
    : { leader: right, trailer: left };
}

export function tradeDecisionPairKey(leftSlug: string, rightSlug: string) {
  return [leftSlug, rightSlug].sort().join("|");
}

export function getRelatedTradeDecisions(comparison: TradeDecisionConfig, limit = 5) {
  const players = new Set([comparison.leftSlug, comparison.rightSlug]);
  return tradeDecisionComparisons
    .filter((candidate) => candidate.slug !== comparison.slug && (players.has(candidate.leftSlug) || players.has(candidate.rightSlug)))
    .slice(0, limit);
}
