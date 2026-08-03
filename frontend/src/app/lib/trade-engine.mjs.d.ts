import type { MarketAsset } from "../types/MarketAsset";

export interface SideCalculation {
  raw: number;
  adjusted: number;
  rosterCost: number;
  contributions: Array<{
    id: string;
    value: number;
    weight: number;
    adjustedValue: number;
  }>;
}

export interface TradeEvaluation {
  status: "incomplete" | "fair" | "lean" | "clear" | "strong";
  winner: "A" | "B" | null;
  label: string;
  summary: string;
  percentDifference: number;
  valueGap: number;
  sideA: SideCalculation;
  sideB: SideCalculation;
}

export function calculateSide(assets: MarketAsset[], rosterPremium?: boolean): SideCalculation;
export function evaluateTrade(sideA: MarketAsset[], sideB: MarketAsset[], rosterPremium?: boolean): TradeEvaluation;
export function findBalancingAssets(assets: MarketAsset[], selectedIds: Set<string>, targetGap: number, limit?: number): MarketAsset[];
