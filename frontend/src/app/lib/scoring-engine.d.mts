import type {
  MarketAsset,
  MarketFormat,
  PlayerScoringProfile,
  ScoringSettings,
} from "../types/MarketAsset";

export const SCORING_MODEL_VERSION: string;
export const DEFAULT_SCORING_SETTINGS: Readonly<ScoringSettings>;

export function normalizeScoringSettings(
  settings?: Partial<ScoringSettings>,
): ScoringSettings;

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
  },
): {
  assets: MarketAsset[];
  meta: {
    modelVersion: string;
    baseline: ScoringSettings;
    settings: ScoringSettings;
    adjustedCount: number;
    coveredCount: number;
    playerCount: number;
  };
};
