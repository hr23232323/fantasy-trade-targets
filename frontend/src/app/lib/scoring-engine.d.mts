import type {
  MarketAsset,
  MarketFormat,
  PlayerScoringProfile,
  ScoringSettings,
  RosterSettings,
} from "../types/MarketAsset";

export const SCORING_MODEL_VERSION: string;
export const DEFAULT_SCORING_SETTINGS: Readonly<ScoringSettings>;
export const DEFAULT_ROSTER_SETTINGS: Readonly<RosterSettings>;

export function normalizeScoringSettings(
  settings?: Partial<ScoringSettings>,
): ScoringSettings;

export function normalizeRosterSettings(
  settings?: Partial<RosterSettings>,
): RosterSettings;

export function buildScoringProfile(statsPayload: unknown): PlayerScoringProfile | null;

export function calculateFantasyPoints(
  profile: PlayerScoringProfile,
  settings?: Partial<ScoringSettings>,
): number | null;

export function applyScoringContext(
  assets: MarketAsset[],
  profiles: Record<string, PlayerScoringProfile>,
  settings: Partial<ScoringSettings> & {
    numTeams?: number;
    numQbs?: 1 | 2;
    format?: MarketFormat;
  } & Partial<RosterSettings>,
): {
  assets: MarketAsset[];
  meta: {
    modelVersion: string;
    baseline: ScoringSettings;
    settings: ScoringSettings;
    baselineRoster: RosterSettings;
    rosterSettings: RosterSettings;
    replacementRanks: Record<"QB" | "RB" | "WR" | "TE", number>;
    flexAllocation: Record<"RB" | "WR" | "TE", number>;
    adjustedCount: number;
    coveredCount: number;
    playerCount: number;
  };
};
