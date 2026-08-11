import type {
  MarketAsset,
  MarketFormat,
  PassingTdPoints,
  ReceptionPoints,
  RosterSettings,
} from "../types/MarketAsset";

export type TradeShareSettings = {
  format: MarketFormat;
  numQbs: 1 | 2;
  tep: boolean;
  numTeams: number;
  passingTdPoints: PassingTdPoints;
  receptionPoints: ReceptionPoints;
  rosterPremium: boolean;
  sideA: MarketAsset[];
  sideB: MarketAsset[];
} & RosterSettings;

export function buildTradeShareSlug(
  sideA: MarketAsset[],
  sideB: MarketAsset[],
): string;

export function buildTradeShareParams(
  settings: TradeShareSettings,
): URLSearchParams;

export function resolveTradeShare(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>,
  marketAssets: MarketAsset[],
): TradeShareSettings;

export function summarizeTradeSide(assets: MarketAsset[]): string;
export function buildTradeTitle(
  sideA: MarketAsset[],
  sideB: MarketAsset[],
): string;
export function calculatorPathForFormat(format: MarketFormat): string;
