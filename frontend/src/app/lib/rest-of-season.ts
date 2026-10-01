import { availabilityLabel, nflversePlayerRelease } from "./nflverse";
import { getMarket } from "./market";
import { getTradePlayerImage } from "./player-pages";
import { buildRestOfSeasonRankings, type RestOfSeasonModelRow } from "./rest-of-season-model.mjs";
import { activeStartSitWeek } from "./start-sit";
import { teamRelease } from "./team-data";

export const restOfSeasonPositionConfigs = [
  { slug: "quarterbacks", position: "QB", label: "Quarterback", plural: "Quarterbacks" },
  { slug: "running-backs", position: "RB", label: "Running back", plural: "Running Backs" },
  { slug: "wide-receivers", position: "WR", label: "Wide receiver", plural: "Wide Receivers" },
  { slug: "tight-ends", position: "TE", label: "Tight end", plural: "Tight Ends" },
] as const;

export type RestOfSeasonPosition = "ALL" | (typeof restOfSeasonPositionConfigs)[number]["position"];
export type RestOfSeasonPositionConfig = (typeof restOfSeasonPositionConfigs)[number];
export type RestOfSeasonScoringKey = "standard" | "halfPpr" | "ppr";

export type RestOfSeasonFormatRow = {
  rank: number;
  marketRank: number;
  rating: number;
  recentPointsPerGame: number | null;
  recentOpportunity: number | null;
  recentSnapPct: number | null;
  remainingGames: number;
  remainingPointsAllowed: number | null;
  schedulePercentile: number;
};

export type RestOfSeasonRankingRow = {
  slug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string | null;
  imageSrc: string | null;
  availability: string;
  currentSeasonGames: number;
  formats: Record<RestOfSeasonScoringKey, RestOfSeasonFormatRow>;
};

const scoringFormats = [
  { key: "standard", receptionPoints: 0 },
  { key: "halfPpr", receptionPoints: 0.5 },
  { key: "ppr", receptionPoints: 1 },
] as const;

export function getRestOfSeasonPosition(slug: string) {
  return restOfSeasonPositionConfigs.find((config) => config.slug === slug) ?? null;
}

export async function getRestOfSeasonRankingRows(position: RestOfSeasonPosition = "ALL"): Promise<RestOfSeasonRankingRow[]> {
  const formats = await Promise.all(scoringFormats.map(async ({ key, receptionPoints }) => {
    const market = await getMarket({
      format: "redraft",
      numQbs: 1,
      numTeams: 12,
      passingTdPoints: 4,
      receptionPoints,
    });
    const rows = buildRestOfSeasonRankings({
      assets: market.assets,
      players: nflversePlayerRelease.players,
      teams: teamRelease.teams,
      positionDefense: nflversePlayerRelease.positionDefense.teams,
      season: nflversePlayerRelease.season,
      currentWeek: activeStartSitWeek,
      receptionPoints,
    });
    return { key, market, rows };
  }));
  const byFormat = Object.fromEntries(formats.map(({ key, rows }) => [key, new Map(rows.map((row) => [row.slug, row]))])) as Record<RestOfSeasonScoringKey, Map<string, RestOfSeasonModelRow>>;
  const pprRows = formats.find(({ key }) => key === "ppr")!.rows;

  return pprRows
    .filter((row) => position === "ALL" || row.position === position)
    .flatMap((row) => {
      const standard = byFormat.standard.get(row.slug);
      const halfPpr = byFormat.halfPpr.get(row.slug);
      const ppr = byFormat.ppr.get(row.slug);
      if (!standard || !halfPpr || !ppr) return [];
      return [{
        slug: row.slug,
        name: row.name,
        position: row.position,
        team: row.team,
        imageSrc: getTradePlayerImage(row.slug)?.src ?? null,
        availability: availabilityLabel(row.slug),
        currentSeasonGames: row.currentSeasonGames,
        formats: {
          standard: pickFormat(standard, position),
          halfPpr: pickFormat(halfPpr, position),
          ppr: pickFormat(ppr, position),
        },
      }];
    })
    .sort((left, right) => left.formats.ppr.rank - right.formats.ppr.rank);
}

export const restOfSeasonWeek = activeStartSitWeek;
export const restOfSeasonUpdatedAt = new Date(Math.max(
  Date.parse(nflversePlayerRelease.capturedAt),
  Date.parse(teamRelease.capturedAt),
)).toISOString();

function pickFormat(row: RestOfSeasonModelRow, position: RestOfSeasonPosition): RestOfSeasonFormatRow {
  return {
    rank: position === "ALL" ? row.overallRank : row.positionRank,
    marketRank: position === "ALL" ? row.overallMarketRank : row.positionMarketRank,
    rating: row.rating,
    recentPointsPerGame: row.recentPointsPerGame,
    recentOpportunity: row.recentOpportunity,
    recentSnapPct: row.recentSnapPct,
    remainingGames: row.remainingGames,
    remainingPointsAllowed: row.remainingPointsAllowed,
    schedulePercentile: row.schedulePercentile,
  };
}
