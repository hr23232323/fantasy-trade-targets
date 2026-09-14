import { nflversePlayerRelease } from "./nflverse";
import { getWeeklyMatchups, matchupIsComplete, regularSeasonWeeks } from "./weekly-matchups";
import type { MarketAsset } from "../types/MarketAsset";
import type { NflverseGameLog } from "../types/NflversePlayer";

export const usagePositionConfigs = [
  { slug: "quarterbacks", position: "QB", label: "Quarterbacks", volumeLabel: "Attempts + carries" },
  { slug: "running-backs", position: "RB", label: "Running backs", volumeLabel: "Carries + targets" },
  { slug: "wide-receivers", position: "WR", label: "Wide receivers", volumeLabel: "Targets" },
  { slug: "tight-ends", position: "TE", label: "Tight ends", volumeLabel: "Targets" },
] as const;

export type UsagePositionConfig = (typeof usagePositionConfigs)[number];

export type UsageReadiness = {
  ready: boolean;
  gameCount: number;
  completedGames: number;
  gamesWithStats: number;
  gamesWithSnaps: number;
};

export type UsageRow = {
  rank: number;
  slug: string;
  name: string;
  team: string | null;
  opponent: string | null;
  marketRank: number | null;
  marketValue: number;
  snapPct: number;
  baselineSnapPct: number | null;
  snapDelta: number | null;
  volume: number;
  baselineVolume: number | null;
  volumeDelta: number | null;
  targetShare: number | null;
  halfPprPoints: number | null;
};

export function getUsagePositionConfig(slug: string) {
  return usagePositionConfigs.find((config) => config.slug === slug) ?? null;
}

export function getUsageReadiness(week: number): UsageReadiness {
  const matchups = getWeeklyMatchups(week);
  const scheduledIds = new Set(matchups.map(({ gameId }) => gameId));
  const statsIds = new Set<string>();
  const snapIds = new Set<string>();

  for (const player of Object.values(nflversePlayerRelease.players)) {
    for (const game of player.games) {
      if (game.season !== nflversePlayerRelease.season || game.week !== week) continue;
      statsIds.add(game.gameId);
      if (game.offenseSnapPct !== null) snapIds.add(game.gameId);
    }
  }

  const completedGames = matchups.filter(matchupIsComplete).length;
  const gamesWithStats = [...scheduledIds].filter((id) => statsIds.has(id)).length;
  const gamesWithSnaps = [...scheduledIds].filter((id) => snapIds.has(id)).length;
  return {
    ready: matchups.length > 0 && completedGames === matchups.length && gamesWithStats === matchups.length && gamesWithSnaps === matchups.length,
    gameCount: matchups.length,
    completedGames,
    gamesWithStats,
    gamesWithSnaps,
  };
}

export const publishedUsageWeeks = regularSeasonWeeks.filter((week) => getUsageReadiness(week).ready);

export function getUsageRows(week: number, config: UsagePositionConfig, assets: MarketAsset[]): UsageRow[] {
  const assetBySlug = new Map(assets.map((asset) => [asset.slug, asset]));
  const rows = Object.values(nflversePlayerRelease.players).flatMap((player) => {
    if (player.roster?.position !== config.position) return [];
    const current = player.games.find((game) => game.season === nflversePlayerRelease.season && game.week === week);
    const asset = assetBySlug.get(player.slug);
    if (!current || current.offenseSnapPct === null || !asset) return [];
    const baseline = player.games
      .filter((game) => precedes(game, nflversePlayerRelease.season, week) && game.offenseSnapPct !== null)
      .slice(0, 4);
    const volume = usageVolume(current, config.position);
    const baselineSnapPct = average(baseline.map((game) => game.offenseSnapPct).filter((value): value is number => value !== null));
    const baselineVolume = average(baseline.map((game) => usageVolume(game, config.position)));
    const snapDelta = baselineSnapPct === null ? null : current.offenseSnapPct - baselineSnapPct;
    const volumeDelta = baselineVolume === null ? null : volume - baselineVolume;
    return [{
      rank: 0,
      slug: player.slug,
      name: asset.name,
      team: current.team,
      opponent: current.opponent,
      marketRank: asset.rank ?? null,
      marketValue: asset.value,
      snapPct: current.offenseSnapPct,
      baselineSnapPct,
      snapDelta,
      volume,
      baselineVolume,
      volumeDelta,
      targetShare: current.targetShare,
      halfPprPoints: current.fantasyPointsHalfPpr,
    }];
  });

  return rows
    .sort((left, right) => usageScore(right) - usageScore(left) || right.marketValue - left.marketValue)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function precedes(game: NflverseGameLog, season: number, week: number) {
  return game.season < season || (game.season === season && game.week < week);
}

function usageVolume(game: NflverseGameLog, position: UsagePositionConfig["position"]) {
  if (position === "QB") return (game.passing.attempts ?? 0) + (game.rushing.carries ?? 0);
  if (position === "RB") return (game.rushing.carries ?? 0) + (game.receiving.targets ?? 0);
  return game.receiving.targets ?? 0;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function usageScore(row: Omit<UsageRow, "rank">) {
  return (row.snapDelta ?? 0) * 100 + (row.volumeDelta ?? 0) * 2 + row.snapPct * 10;
}

export function usageWeekPath(week: number, positionSlug: string) {
  return `/fantasy-football-usage/week-${week}/${positionSlug}`;
}
