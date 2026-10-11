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
export function americanFromDecimal(value: number): number | null;
export function parlayCalculation(odds: number[], stake: number): {
  combinedDecimal: number;
  combinedAmerican: number | null;
  impliedProbability: number;
  profit: number;
  payout: number;
} | null;
export function noVigMarket(odds: number[]): {
  impliedProbabilities: number[];
  fairProbabilities: number[];
  hold: number;
} | null;
export function kellyCalculation(odds: number, winProbability: number, bankroll: number, fraction?: number): {
  fullKelly: number;
  selectedKelly: number;
  stake: number;
  expectedReturn: number;
} | null;
export function hedgeCalculation(initialOdds: number, initialStake: number, hedgeOdds: number): {
  hedgeStake: number;
  equalizedProfit: number;
  totalStaked: number;
  lockedReturn: number;
} | null;
export function roundRobinCalculation(odds: number[], combinationSize: number, stakePerBet: number): {
  betCount: number;
  totalStake: number;
  maxPayout: number;
  maxProfit: number;
  minimumWinningLegs: number;
} | null;
export function arbitrageCalculation(odds: number[], totalStake: number): {
  impliedTotal: number;
  stakes: number[];
  lockedReturn: number;
  lockedProfit: number;
  roi: number;
  isArbitrage: boolean;
} | null;
export function teaserCalculation(legs: Array<{ type: "spread" | "over" | "under"; line: number }>, teaserPoints: number, odds: number, stake: number): {
  adjustedLines: number[];
  profit: number;
  payout: number;
} | null;
