export type MarketFormat = "dynasty" | "redraft";
export type AssetKind = "player" | "pick";
export type Position = "QB" | "RB" | "WR" | "TE" | "PICK";

export interface MarketAsset {
  id: string;
  slug: string;
  name: string;
  position: Position;
  kind: AssetKind;
  value: number;
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
}

export interface MarketPayload {
  assets: MarketAsset[];
  meta: MarketMeta;
}
