import "server-only";

import { getMarket } from "./market";
import type {
  MarketFormat,
  PassingTdPoints,
  Position,
  ReceptionPoints,
  RosterSettings,
} from "../types/MarketAsset";

export type ImpactPosition = "ALL" | Exclude<Position, "PICK">;

export type ImpactSettings = {
  format: MarketFormat;
  numQbs: 1 | 2;
  tep: boolean;
  numTeams: number;
  passingTdPoints: PassingTdPoints;
  receptionPoints: ReceptionPoints;
  position: ImpactPosition;
} & RosterSettings;

export type ScoringImpactRow = {
  id: string;
  slug: string;
  name: string;
  position: Exclude<Position, "PICK">;
  team?: string;
  age?: number;
  baseValue: number;
  adjustedValue: number;
  valueDelta: number;
  adjustmentPercent: number;
  baselinePointsPerGame: number;
  selectedPointsPerGame: number;
  deltaVorpPerGame: number;
  confidence: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(params: RawParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function allowedNumber<T extends number>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
) {
  const requested = Number(value);
  return allowed.includes(requested as T) ? (requested as T) : fallback;
}

export function normalizeImpactSettings(params: RawParams = {}): ImpactSettings {
  const requestedPosition = String(first(params, "position") || "ALL").toUpperCase();
  const position: ImpactPosition = ["QB", "RB", "WR", "TE"].includes(requestedPosition)
    ? (requestedPosition as ImpactPosition)
    : "ALL";
  return {
    format: first(params, "format") === "redraft" ? "redraft" : "dynasty",
    numQbs: first(params, "qbs") === "1" ? 1 : 2,
    tep: first(params, "tep") === "1",
    numTeams: allowedNumber(first(params, "teams"), [8, 10, 12, 14, 16], 12),
    passingTdPoints: first(params, "passTd") === "4" ? 4 : 6,
    receptionPoints: allowedNumber(first(params, "ppr"), [0, 0.5, 1], 0.5),
    rbStarters: allowedNumber(first(params, "rb"), [1, 2, 3], 2),
    wrStarters: allowedNumber(first(params, "wr"), [2, 3, 4], 3),
    teStarters: allowedNumber(first(params, "te"), [1, 2], 1),
    flexSpots: allowedNumber(first(params, "flex"), [0, 1, 2, 3], 1),
    position,
  };
}

export function impactSettingsParams(settings: ImpactSettings) {
  const params = new URLSearchParams({
    format: settings.format,
    qbs: String(settings.numQbs),
    teams: String(settings.numTeams),
    passTd: String(settings.passingTdPoints),
    ppr: String(settings.receptionPoints),
    rb: String(settings.rbStarters),
    wr: String(settings.wrStarters),
    te: String(settings.teStarters),
    flex: String(settings.flexSpots),
  });
  if (settings.tep) params.set("tep", "1");
  if (settings.position !== "ALL") params.set("position", settings.position);
  return params;
}

export function impactSettingsHref(
  settings: ImpactSettings,
  changes: Partial<ImpactSettings>,
) {
  const next = { ...settings, ...changes };
  return `/scoring-impact?${impactSettingsParams(next)}`;
}

export async function getScoringImpact(settings: ImpactSettings) {
  const market = await getMarket({
    format: settings.format,
    numQbs: settings.numQbs,
    tep: settings.tep,
    numTeams: settings.numTeams,
    passingTdPoints: settings.passingTdPoints,
    receptionPoints: settings.receptionPoints,
    rbStarters: settings.rbStarters,
    wrStarters: settings.wrStarters,
    teStarters: settings.teStarters,
    flexSpots: settings.flexSpots,
  });
  const rows = market.assets
    .filter(
      (asset) =>
        asset.kind === "player" &&
        asset.position !== "PICK" &&
        asset.scoringContext?.available &&
        (settings.position === "ALL" || asset.position === settings.position),
    )
    .map((asset): ScoringImpactRow => ({
      id: asset.id,
      slug: asset.slug,
      name: asset.name,
      position: asset.position as ScoringImpactRow["position"],
      team: asset.team,
      age: asset.age,
      baseValue: asset.baseValue ?? asset.value,
      adjustedValue: asset.value,
      valueDelta: asset.scoringContext?.valueDelta ?? 0,
      adjustmentPercent: asset.scoringContext?.adjustmentPercent ?? 0,
      baselinePointsPerGame:
        asset.scoringContext?.referencePointsPerGame ?? 0,
      selectedPointsPerGame:
        asset.scoringContext?.selectedPointsPerGame ?? 0,
      deltaVorpPerGame: asset.scoringContext?.deltaVorpPerGame ?? 0,
      confidence: asset.scoringContext?.confidence ?? 0,
    }));

  return {
    settings,
    market,
    rows,
    risers: [...rows].sort(
      (left, right) =>
        right.valueDelta - left.valueDelta ||
        right.adjustedValue - left.adjustedValue,
    ),
    fallers: [...rows].sort(
      (left, right) =>
        left.valueDelta - right.valueDelta ||
        right.adjustedValue - left.adjustedValue,
    ),
    rankings: [...rows].sort(
      (left, right) => right.adjustedValue - left.adjustedValue,
    ),
  };
}

export function receptionLabel(points: ReceptionPoints) {
  if (points === 0) return "Standard";
  if (points === 0.5) return "Half PPR";
  return "Full PPR";
}

export function impactWhy(row: ScoringImpactRow) {
  const direction = row.deltaVorpPerGame > 0 ? "more" : row.deltaVorpPerGame < 0 ? "less" : "the same";
  return `${Math.abs(row.deltaVorpPerGame).toFixed(2)} points/game ${direction} over replacement`;
}
