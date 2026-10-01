import type { MarketAsset } from "../types/MarketAsset";
import type { NflversePlayerContext } from "../types/NflversePlayer";
import type { TeamProfile } from "../types/Team";

export type RestOfSeasonModelRow = {
  slug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string | null;
  marketValue: number;
  overallMarketRank: number;
  positionMarketRank: number;
  recentPointsPerGame: number | null;
  recentOpportunity: number | null;
  recentSnapPct: number | null;
  currentSeasonGames: number;
  remainingGames: number;
  remainingPointsAllowed: number | null;
  formPercentile: number;
  usagePercentile: number;
  schedulePercentile: number;
  rating: number;
  overallRank: number;
  positionRank: number;
};

export function buildRestOfSeasonRankings(args: {
  assets: MarketAsset[];
  players: Record<string, NflversePlayerContext>;
  teams: Record<string, TeamProfile>;
  positionDefense: NflversePlayerContext extends never ? never : Record<string, Record<"QB" | "RB" | "WR" | "TE", { pointsPerGame: { standard: number; halfPpr: number; ppr: number } }>>;
  season: number;
  currentWeek: number;
  receptionPoints: 0 | 0.5 | 1;
}): RestOfSeasonModelRow[];
