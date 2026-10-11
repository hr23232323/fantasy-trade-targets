export function isValidAmericanOdds(value) {
  return Number.isFinite(value) && Math.abs(value) >= 100;
}

export function impliedProbability(odds) {
  if (!isValidAmericanOdds(odds)) return null;
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}

export function decimalOdds(odds) {
  if (!isValidAmericanOdds(odds)) return null;
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / -odds;
}

export function profitForStake(odds, stake) {
  const decimal = decimalOdds(odds);
  if (decimal === null || !Number.isFinite(stake) || stake < 0) return null;
  return stake * (decimal - 1);
}

export function twoWayMarket(oddsA, oddsB) {
  const probabilityA = impliedProbability(oddsA);
  const probabilityB = impliedProbability(oddsB);
  if (probabilityA === null || probabilityB === null) return null;
  const total = probabilityA + probabilityB;
  return {
    probabilityA,
    probabilityB,
    noVigA: probabilityA / total,
    noVigB: probabilityB / total,
    hold: total - 1,
  };
}

export function americanFromDecimal(value) {
  if (!Number.isFinite(value) || value <= 1) return null;
  return value >= 2 ? Math.round((value - 1) * 100) : Math.round(-100 / (value - 1));
}

export function parlayCalculation(odds, stake) {
  if (!Array.isArray(odds) || odds.length < 2 || !Number.isFinite(stake) || stake < 0) return null;
  const decimals = odds.map(decimalOdds);
  if (decimals.some((value) => value === null)) return null;
  const combinedDecimal = decimals.reduce((total, value) => total * value, 1);
  return {
    combinedDecimal,
    combinedAmerican: americanFromDecimal(combinedDecimal),
    impliedProbability: 1 / combinedDecimal,
    profit: stake * (combinedDecimal - 1),
    payout: stake * combinedDecimal,
  };
}

export function noVigMarket(odds) {
  if (!Array.isArray(odds) || odds.length < 2) return null;
  const probabilities = odds.map(impliedProbability);
  if (probabilities.some((value) => value === null)) return null;
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  return {
    impliedProbabilities: probabilities,
    fairProbabilities: probabilities.map((value) => value / total),
    hold: total - 1,
  };
}

export function kellyCalculation(odds, winProbability, bankroll, fraction = 1) {
  const decimal = decimalOdds(odds);
  if (decimal === null || !Number.isFinite(winProbability) || winProbability < 0 || winProbability > 1 || !Number.isFinite(bankroll) || bankroll < 0 || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) return null;
  const netOdds = decimal - 1;
  const rawKelly = (netOdds * winProbability - (1 - winProbability)) / netOdds;
  const fullKelly = Math.max(0, Math.min(1, rawKelly));
  return {
    fullKelly,
    selectedKelly: fullKelly * fraction,
    stake: bankroll * fullKelly * fraction,
    expectedReturn: winProbability * decimal - 1,
  };
}

export function hedgeCalculation(initialOdds, initialStake, hedgeOdds) {
  const initialDecimal = decimalOdds(initialOdds);
  const hedgeDecimal = decimalOdds(hedgeOdds);
  if (initialDecimal === null || hedgeDecimal === null || !Number.isFinite(initialStake) || initialStake < 0) return null;
  const hedgeStake = initialStake * initialDecimal / hedgeDecimal;
  const equalizedProfit = initialStake * initialDecimal - initialStake - hedgeStake;
  return {
    hedgeStake,
    equalizedProfit,
    totalStaked: initialStake + hedgeStake,
    lockedReturn: initialStake * initialDecimal,
  };
}
