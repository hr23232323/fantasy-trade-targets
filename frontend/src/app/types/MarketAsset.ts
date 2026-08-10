export type MarketFormat = "dynasty" | "redraft";
export type AssetKind = "player" | "pick";
export type Position = "QB" | "RB" | "WR" | "TE" | "PICK";
export type PassingTdPoints = 4 | 6;
export type ReceptionPoints = 0 | 0.5 | 1;

export interface ScoringSettings {
  passingTdPoints: PassingTdPoints;
  receptionPoints: ReceptionPoints;
}

export interface PlayerScoringProfile {
  modelVersion: string;
  observedThroughSeason: string;
  seasons: string[];
  weightedGames: number;
  confidence: number;
  perGame: {
    passingYards: number;
    passingTouchdowns: number;
    interceptions: number;
    rushingYards: number;
    rushingTouchdowns: number;
    receptions: number;
    receivingYards: number;
    receivingTouchdowns: number;
    fumblesLost: number;
    passingTwoPointConversions: number;
    rushingTwoPointConversions: number;
    receivingTwoPointConversions: number;
  };
}

export interface ScoringContext {
  available: boolean;
  modelVersion: string;
  observedThroughSeason?: string;
  confidence?: number;
  referencePointsPerGame?: number;
  selectedPointsPerGame?: number;
  replacementReferencePointsPerGame?: number;
  replacementSelectedPointsPerGame?: number;
  deltaVorpPerGame?: number;
  adjustmentPercent?: number;
  valueDelta?: number;
}

export interface MarketAsset {
  id: string;
  slug: string;
  name: string;
  position: Position;
  kind: AssetKind;
  value: number;
  baseValue?: number;
  scoringContext?: ScoringContext;
  team?: string;
  age?: number;
  rank?: number;
  posRank?: number;
  confidence?: number;
  sleeperId?: string;
  year?: string;
  round?: number;
  slot?: number;
  tier?: "early" | "mid" | "late";
}

export interface MarketMeta {
  generatedAt: string;
  format: MarketFormat;
  numQbs: 1 | 2;
  tep: boolean;
  numTeams: number;
  attribution: string;
  sourceUrl: string;
  assetCount: number;
  releaseId: string;
  methodologyVersion: string;
  scoring: {
    modelVersion: string;
    baseline: ScoringSettings;
    settings: ScoringSettings;
    adjustedCount: number;
    coveredCount: number;
    playerCount: number;
  };
}

export interface MarketPayload {
  assets: MarketAsset[];
  meta: MarketMeta;
}
