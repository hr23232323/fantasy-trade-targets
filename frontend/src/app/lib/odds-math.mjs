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
