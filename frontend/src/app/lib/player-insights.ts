import type { HistoryPoint, PlayerProfile } from "../types/PlayerProfile";

export type Movement = {
  label: string;
  valueChange: number;
  percentChange: number;
  observedDays: number;
};

function parseHistoryDate(value: string) {
  if (!/^\d{6}$/.test(value)) return null;
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4)) - 1;
  const day = Number(value.slice(4, 6));
  const date = new Date(Date.UTC(year, month, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeHistory(points: HistoryPoint[]) {
  return points
    .map((point) => ({ ...point, parsedDate: parseHistoryDate(point.date) }))
    .filter(
      (point): point is HistoryPoint & { parsedDate: Date } =>
        Boolean(point.parsedDate) && Number.isFinite(point.value),
    )
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
}

export function calculateMovement(
  points: HistoryPoint[],
  targetDays: number,
): Movement | null {
  const history = normalizeHistory(points);
  const current = history.at(-1);
  if (!current || history.length < 2) return null;

  const targetTime =
    current.parsedDate.getTime() - targetDays * 24 * 60 * 60 * 1000;
  const candidates = history.filter(
    (point) => point.parsedDate.getTime() <= targetTime,
  );
  const baseline = candidates.at(-1) ?? history[0];
  if (!baseline || baseline.value === 0 || baseline === current) return null;

  const valueChange = current.value - baseline.value;
  const percentChange = (valueChange / baseline.value) * 100;
  const observedDays = Math.round(
    (current.parsedDate.getTime() - baseline.parsedDate.getTime()) /
      (24 * 60 * 60 * 1000),
  );

  return {
    label: `${targetDays}-day`,
    valueChange,
    percentChange,
    observedDays,
  };
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
