import type { MarketAsset } from "./MarketAsset";

export type HistoryPoint = {
  date: string;
  value: number;
};

export type PlayerSnapshotObservation = {
  observedAt: string;
  value: number;
  rank: number | null;
  posRank: number | null;
  releaseId: string;
};

export type DerivedStats = Record<string, number | null | undefined>;

export type ConsistencyProfile = {
  gamesPlayed?: number;
  avg?: number;
  ceiling?: number;
  floor?: number;
  floorPts?: number;
  boomRate?: number;
  floorRate?: number;
  bustRate?: number;
  grade?: string;
};

export type PlayerProfile = MarketAsset & {
  composite?: number;
  yearsExp?: number;
  history: HistoryPoint[];
  stats?: {
    season?: string;
    gamesPlayed?: number;
    derivedStats?: DerivedStats;
    consistency?: ConsistencyProfile;
  };
  advanced?: {
    [key: string]: number | string | DerivedStats | null | undefined;
    season?: number;
    last4?: DerivedStats;
  };
  bestball?: {
    season?: number;
    gamesPlayed?: number;
    ptsPerGame?: number;
    consistency?: ConsistencyProfile;
  };
  similar: Array<
    Pick<MarketAsset, "slug" | "name" | "position" | "value" | "rank"> & {
      composite?: number;
    }
  >;
  profileUrl?: string;
};

export type PlayerProfilePayload = {
  data: PlayerProfile;
  snapshotHistory: PlayerSnapshotObservation[];
  meta: {
    version: string;
    generatedAt: string;
    sources?: string[];
    attribution: string;
    docs?: string;
    releaseId: string;
  };
};
