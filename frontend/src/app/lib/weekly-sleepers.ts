import { getMarket } from "./market";
import { nflversePlayerRelease } from "./nflverse";
import { getWeeklyRankingRows, weeklyRankingsWeek } from "./weekly-rankings";

export const weeklySleeperPositions = [
  { slug: "quarterbacks", position: "QB", label: "Quarterback", plural: "Quarterbacks", starterLine: 12, weeklyCap: 20 },
  { slug: "running-backs", position: "RB", label: "Running back", plural: "Running Backs", starterLine: 24, weeklyCap: 40 },
  { slug: "wide-receivers", position: "WR", label: "Wide receiver", plural: "Wide Receivers", starterLine: 36, weeklyCap: 56 },
  { slug: "tight-ends", position: "TE", label: "Tight end", plural: "Tight Ends", starterLine: 12, weeklyCap: 22 },
] as const;

export type WeeklySleeperPosition = (typeof weeklySleeperPositions)[number];

export type WeeklySleeperRow = {
  slug: string;
  urlSlug: string;
  name: string;
  position: WeeklySleeperPosition["position"];
  team: string | null;
  opponent: string | null;
  imageSrc: string;
  availability: string;
  weeklyRank: number;
  marketPositionRank: number;
  rankGain: number;
  projection: { floor: number; median: number; ceiling: number };
  recentSnapShare: number | null;
};

export function getWeeklySleeperPosition(slug: string) {
  return weeklySleeperPositions.find((config) => config.slug === slug) ?? null;
}

export async function getWeeklySleepers(config?: WeeklySleeperPosition): Promise<WeeklySleeperRow[]> {
  const market = await getMarket({ format: "redraft", numQbs: 1, receptionPoints: 1 });
  const marketRanks = new Map(
    market.assets
      .filter((asset) => asset.kind === "player" && asset.position !== "PICK")
      .map((asset) => [asset.slug, asset.posRank ?? Number.POSITIVE_INFINITY]),
  );
  const positions = config ? [config] : [...weeklySleeperPositions];

  return positions.flatMap((positionConfig) => {
    const ranked = getWeeklyRankingRows(positionConfig.position)
      .toSorted((left, right) => right.projections.ppr.median - left.projections.ppr.median);

    return ranked.flatMap((row, index) => {
      const weeklyRank = index + 1;
      const marketPositionRank = marketRanks.get(row.slug) ?? Number.POSITIVE_INFINITY;
      if (
        !Number.isFinite(marketPositionRank) ||
        marketPositionRank <= positionConfig.starterLine ||
        weeklyRank > positionConfig.weeklyCap ||
        /out|doubtful/i.test(row.availability)
      ) return [];

      const player = nflversePlayerRelease.players[row.slug];
      const recentGames = (player?.games ?? [])
        .filter((game) => game.season === nflversePlayerRelease.season && game.week < weeklyRankingsWeek)
        .toSorted((left, right) => right.week - left.week)
        .slice(0, 3);
      const snaps = recentGames.map((game) => game.offenseSnapPct).filter((value): value is number => Number.isFinite(value));
      const recentSnapShare = snaps.length ? snaps.reduce((sum, value) => sum + value, 0) / snaps.length : null;
      if (recentGames.length < 2 || (recentSnapShare !== null && recentSnapShare < 0.35)) return [];

      return [{
        ...row,
        position: positionConfig.position,
        weeklyRank,
        marketPositionRank,
        rankGain: marketPositionRank - weeklyRank,
        projection: row.projections.ppr,
        recentSnapShare,
      }];
    })
      .toSorted((left, right) => right.rankGain - left.rankGain || right.projection.median - left.projection.median)
      .slice(0, config ? 12 : 3);
  });
}

export const weeklySleepersWeek = weeklyRankingsWeek;
