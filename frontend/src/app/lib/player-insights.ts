import type {
  HistoryPoint,
  PlayerProfile,
  PlayerSnapshotObservation,
} from "../types/PlayerProfile";
import {
  calculateHistoryMovement,
  carryHistoryForward as carryHistoryForwardCore,
  findNearestHistoryIndex as findNearestHistoryIndexCore,
  getHistoryChartScale as getHistoryChartScaleCore,
  getTimeRatio as getTimeRatioCore,
  normalizeHistory as normalizeHistoryCore,
} from "./player-history.mjs";

export type Movement = {
  label: string;
  valueChange: number;
  percentChange: number;
  observedDays: number;
};

export function normalizeHistory(points: HistoryPoint[]) {
  return normalizeHistoryCore(points) as Array<HistoryPoint & { parsedDate: Date }>;
}

export type DisplayHistoryPoint = HistoryPoint & {
  parsedDate: Date;
  carried: boolean;
};

export function carryHistoryForward(points: HistoryPoint[]) {
  return carryHistoryForwardCore(points) as DisplayHistoryPoint[];
}

export function getHistoryChartScale(points: HistoryPoint[]) {
  return getHistoryChartScaleCore(points) as {
    min: number;
    max: number;
    observedMin: number;
    observedMax: number;
  };
}

export function getTimeRatio(date: Date, firstDate: Date, lastDate: Date) {
  return getTimeRatioCore(date, firstDate, lastDate) as number;
}

export function findNearestHistoryIndex(
  points: DisplayHistoryPoint[],
  targetTime: number,
) {
  return findNearestHistoryIndexCore(points, targetTime) as number;
}

export type PublishedHistorySeries = {
  points: HistoryPoint[];
  source: "tradyr" | "ftt";
  sourceLabel: string;
  chartable: boolean;
};

export function selectPublishedHistory(
  upstreamHistory: HistoryPoint[],
  snapshotHistory: PlayerSnapshotObservation[],
): PublishedHistorySeries {
  const upstreamPoints = normalizeHistory(upstreamHistory).map(
    ({ date, value }) => ({ date, value }),
  );
  const source = upstreamPoints.length >= 2 ? "tradyr" : "ftt";
  const points =
    source === "tradyr"
      ? upstreamPoints
      : normalizeHistory(
          snapshotHistory.map((observation) => ({
            date: observation.observedAt,
            value: observation.value,
          })),
        ).map(({ date, value }) => ({ date, value }));
  const normalizedPoints = normalizeHistory(points);
  const firstObserved = normalizedPoints[0]?.parsedDate.getTime();
  const lastObserved = normalizedPoints.at(-1)?.parsedDate.getTime();
  const observationSpan =
    firstObserved !== undefined && lastObserved !== undefined
      ? lastObserved - firstObserved
      : 0;

  return {
    points,
    source,
    sourceLabel:
      source === "tradyr" ? "Tradyr public API" : "Fantasy Trade Target snapshots",
    chartable:
      points.length >= 2 &&
      (source === "tradyr" || observationSpan >= 24 * 60 * 60 * 1_000),
  };
}

export function calculateMovement(
  points: HistoryPoint[],
  targetDays: number,
): Movement | null {
  return calculateHistoryMovement(points, targetDays) as Movement | null;
}

export function getProductionCards(player: PlayerProfile) {
  const stats = player.stats?.derivedStats ?? {};
  const consistency =
    player.stats?.consistency ?? player.bestball?.consistency ?? {};
  const common = [
    { label: "Fantasy points/game", value: stats.pts_per_game },
    { label: "Consistency grade", value: consistency.grade },
  ];

  if (player.position === "QB") {
    return [
      ...common,
      { label: "Pass yards/game", value: stats.pass_yds_per_game },
      { label: "Pass TD/game", value: stats.pass_tds_per_game },
      { label: "Rush yards/game", value: stats.rush_yds_per_game },
      { label: "Completion rate", value: percent(stats.comp_pct) },
    ];
  }

  if (player.position === "RB") {
    return [
      ...common,
      { label: "Rush yards/game", value: stats.rush_yds_per_game },
      { label: "Carries/game", value: stats.rush_att_per_game },
      { label: "Receptions/game", value: stats.rec_per_game },
      { label: "Total TD/game", value: stats.total_tds_per_game },
    ];
  }

  return [
    ...common,
    { label: "Targets/game", value: stats.tgt_per_game },
    { label: "Receptions/game", value: stats.rec_per_game },
    { label: "Receiving yards/game", value: stats.rec_yds_per_game },
    { label: "Catch rate", value: percent(stats.catch_pct) },
  ];
}

export function getUsageCards(player: PlayerProfile) {
  const advanced = player.advanced ?? {};

  if (player.position === "QB") {
    return [
      { label: "Attempts/game", value: advanced.avgAttempts },
      { label: "EPA/game", value: advanced.totalEpaPerGame },
      { label: "Pass CPOE", value: percent(advanced.passingCpoe) },
      { label: "Rush yards/game", value: advanced.avgRushYards },
    ];
  }

  if (player.position === "RB") {
    return [
      { label: "Carries/game", value: advanced.avgCarries },
      { label: "Rush yards/game", value: advanced.avgRushYards },
      { label: "Target share", value: share(advanced.targetShare) },
      { label: "Rec. yards/game", value: advanced.avgRecYards },
    ];
  }

  return [
    { label: "Target share", value: share(advanced.targetShare) },
    { label: "Air-yards share", value: share(advanced.airYardsShare) },
    { label: "WOPR", value: advanced.wopr },
    { label: "Average target depth", value: advanced.adot },
  ];
}

function percent(value: unknown) {
  return typeof value === "number" ? `${value.toFixed(1)}%` : null;
}

function share(value: unknown) {
  if (typeof value !== "number") return null;
  return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
}

export function formatMetric(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
