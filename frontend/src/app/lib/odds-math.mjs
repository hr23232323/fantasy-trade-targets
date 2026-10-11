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

function combinations(values, size, start = 0, chosen = [], output = []) {
  if (chosen.length === size) {
    output.push([...chosen]);
    return output;
  }
  for (let index = start; index <= values.length - (size - chosen.length); index += 1) {
    chosen.push(values[index]);
    combinations(values, size, index + 1, chosen, output);
    chosen.pop();
  }
  return output;
}

export function roundRobinCalculation(odds, combinationSize, stakePerBet) {
  if (!Array.isArray(odds) || odds.length < 3 || odds.length > 8 || !Number.isInteger(combinationSize) || combinationSize < 2 || combinationSize >= odds.length || !Number.isFinite(stakePerBet) || stakePerBet < 0) return null;
  const decimalPrices = odds.map(decimalOdds);
  if (decimalPrices.some((value) => value === null)) return null;
  const bets = combinations(decimalPrices, combinationSize);
  const payouts = bets.map((bet) => stakePerBet * bet.reduce((product, price) => product * price, 1));
  const totalStake = bets.length * stakePerBet;
  const maxPayout = payouts.reduce((sum, payout) => sum + payout, 0);
  return {
    betCount: bets.length,
    totalStake,
    maxPayout,
    maxProfit: maxPayout - totalStake,
    minimumWinningLegs: combinationSize,
  };
}

export function arbitrageCalculation(odds, totalStake) {
  if (!Array.isArray(odds) || odds.length < 2 || odds.length > 6 || !Number.isFinite(totalStake) || totalStake < 0) return null;
  const probabilities = odds.map(impliedProbability);
  if (probabilities.some((value) => value === null)) return null;
  const validProbabilities = probabilities.map(Number);
  const impliedTotal = validProbabilities.reduce((sum, value) => sum + value, 0);
  const lockedReturn = totalStake / impliedTotal;
  return {
    impliedTotal,
    stakes: validProbabilities.map((probability) => totalStake * probability / impliedTotal),
    lockedReturn,
    lockedProfit: lockedReturn - totalStake,
    roi: 1 / impliedTotal - 1,
    isArbitrage: impliedTotal < 1,
  };
}

export function teaserCalculation(legs, teaserPoints, odds, stake) {
  if (!Array.isArray(legs) || legs.length < 2 || legs.length > 6 || !Number.isFinite(teaserPoints) || teaserPoints <= 0 || !Number.isFinite(stake) || stake < 0) return null;
  const profit = profitForStake(odds, stake);
  if (profit === null || legs.some(({ line, type }) => !Number.isFinite(line) || !["spread", "over", "under"].includes(type))) return null;
  return {
    adjustedLines: legs.map(({ line, type }) => line + (type === "over" ? -teaserPoints : teaserPoints)),
    profit,
    payout: stake + profit,
  };
}
