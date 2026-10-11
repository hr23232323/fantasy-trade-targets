export function isValidAmericanOdds(value: number): boolean;
export function impliedProbability(odds: number): number | null;
export function decimalOdds(odds: number): number | null;
export function profitForStake(odds: number, stake: number): number | null;
export function twoWayMarket(oddsA: number, oddsB: number): {
  probabilityA: number;
  probabilityB: number;
  noVigA: number;
  noVigB: number;
  hold: number;
} | null;
