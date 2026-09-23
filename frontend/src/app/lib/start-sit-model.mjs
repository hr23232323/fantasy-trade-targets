const SUPPORTED_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);

export const startSitScoringFormats = [
  { key: "standard", label: "Standard", receptionPoints: 0 },
  { key: "half-ppr", label: "Half PPR", receptionPoints: 0.5 },
  { key: "ppr", label: "PPR", receptionPoints: 1 },
];

export function projectPlayerWeek({
  player,
  week,
  season,
  opponentAllowed,
  leagueMedianAllowed,
  receptionPoints = 0.5,
  passingTdPoints = 4,
}) {
  const position = player?.roster?.position;
  if (!player || !SUPPORTED_POSITIONS.has(position) || !Number.isInteger(week)) return null;
  const eligible = player.games
    .filter((game) => game.season < season || (game.season === season && game.week < week))
    .sort((left, right) => right.season - left.season || right.week - left.week);
  if (!eligible.length) return null;

  const current = eligible.filter((game) => game.season === season).slice(0, 4);
  const prior = eligible.filter((game) => game.season < season).slice(0, 18);
  const currentAverage = average(current.map((game) => fantasyPoints(game, receptionPoints, passingTdPoints)));
  const priorAverage = average(prior.map((game) => fantasyPoints(game, receptionPoints, passingTdPoints)));
  const baseline = blendedAverage(currentAverage, priorAverage, current.length);
  if (baseline === null) return null;

  const recentRoleGames = eligible.slice(0, Math.min(2, eligible.length));
  const roleBaselineGames = eligible.slice(recentRoleGames.length, recentRoleGames.length + 6);
  const recentVolume = average(recentRoleGames.map((game) => opportunity(game, position)));
  const baselineVolume = average(roleBaselineGames.map((game) => opportunity(game, position)));
  const recentSnaps = average(recentRoleGames.map((game) => game.offenseSnapPct));
  const baselineSnaps = average(roleBaselineGames.map((game) => game.offenseSnapPct));
  const volumeFactor = dampedRatio(recentVolume, baselineVolume, 0.05);
  const snapFactor = dampedRatio(recentSnaps, baselineSnaps, 0.03);
  const usageFactor = clamp((volumeFactor + snapFactor) / 2, 0.96, 1.04);

  const matchupFactor = Number.isFinite(opponentAllowed) && Number.isFinite(leagueMedianAllowed) && leagueMedianAllowed > 0
    ? clamp(1 + ((opponentAllowed / leagueMedianAllowed) - 1) * 0.18, 0.94, 1.06)
    : 1;
  const availability = availabilityAdjustment(player.injury, week);
  const adjustment = usageFactor * matchupFactor * availability.factor;
  const samples = eligible.slice(0, 16).map((game) => fantasyPoints(game, receptionPoints, passingTdPoints)).filter(Number.isFinite);
  const median = round(Math.max(0, baseline * adjustment));
  const rawFloor = samples.length >= 4 ? quantile(samples, 0.25) : baseline * 0.65;
  const rawCeiling = samples.length >= 4 ? quantile(samples, 0.75) : baseline * 1.35;
  const floor = round(Math.max(0, Math.min(median, rawFloor * adjustment)));
  const ceiling = round(Math.max(median, rawCeiling * adjustment));
  const actualGame = player.games.find((game) => game.season === season && game.week === week);

  return {
    floor,
    median,
    ceiling,
    actual: actualGame ? fantasyPoints(actualGame, receptionPoints, passingTdPoints) : null,
    recentPointsPerGame: currentAverage === null ? priorAverage : round(currentAverage),
    recentVolume: recentVolume === null ? null : round(recentVolume),
    usageChangePct: ratioChange(recentVolume, baselineVolume),
    snapShare: recentSnaps === null ? null : round(recentSnaps, 3),
    matchupFactor: round(matchupFactor, 3),
    usageFactor: round(usageFactor, 3),
    availability: availability.label,
    availabilityApplied: availability.applied,
    sampleGames: eligible.length,
    confidence: confidenceLabel(eligible.length, current.length, availability),
  };
}

export function fantasyPoints(game, receptionPoints = 0.5, passingTdPoints = 4) {
  if (!game || !Number.isFinite(game.fantasyPoints)) return null;
  const receptions = finite(game.receiving?.receptions) ?? 0;
  const passingTds = finite(game.passing?.passingTds) ?? 0;
  return round(game.fantasyPoints + receptions * receptionPoints + passingTds * (passingTdPoints - 4));
}

export function projectionWinner(left, right) {
  if (!left || !right) return null;
  const gap = round(Math.abs(left.median - right.median));
  return { side: left.median >= right.median ? "left" : "right", gap, close: gap < 1 };
}

function availabilityAdjustment(injury, week) {
  if (!injury || injury.week !== week) return { factor: 1, label: "No current-week designation", applied: false };
  const status = (injury.reportStatus ?? injury.practiceStatus ?? "Listed").toLowerCase();
  if (status.includes("out")) return { factor: 0, label: injury.reportStatus ?? "Out", applied: true };
  if (status.includes("doubtful")) return { factor: 0.35, label: injury.reportStatus ?? "Doubtful", applied: true };
  if (status.includes("questionable")) return { factor: 0.88, label: injury.reportStatus ?? "Questionable", applied: true };
  if (status.includes("did not participate")) return { factor: 0.84, label: "Did not practice", applied: true };
  if (status.includes("limited")) return { factor: 0.94, label: "Limited practice", applied: true };
  return { factor: 1, label: injury.reportStatus ?? injury.practiceStatus ?? "Listed", applied: true };
}

function blendedAverage(current, prior, currentGames) {
  if (current === null) return prior;
  if (prior === null) return current;
  const currentWeight = Math.min(0.6, currentGames * 0.15);
  return current * currentWeight + prior * (1 - currentWeight);
}

function opportunity(game, position) {
  if (position === "QB") return sum(game.passing?.attempts, game.rushing?.carries);
  if (position === "RB") return sum(game.rushing?.carries, game.receiving?.targets);
  return finite(game.receiving?.targets);
}

function dampedRatio(recent, baseline, maxMove) {
  if (!Number.isFinite(recent) || !Number.isFinite(baseline) || baseline <= 0) return 1;
  return clamp(1 + ((recent / baseline) - 1) * 0.2, 1 - maxMove, 1 + maxMove);
}

function ratioChange(current, baseline) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline <= 0) return null;
  return round((current / baseline) - 1, 3);
}

function confidenceLabel(totalGames, currentGames, availability) {
  if (availability.applied && availability.factor < 0.9) return "Low";
  if (totalGames >= 10 && currentGames >= 2) return "High";
  if (totalGames >= 5 || currentGames >= 2) return "Medium";
  return "Low";
}

function quantile(values, percentile) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function average(values) {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length ? finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length : null;
}

function sum(left, right) {
  if (!Number.isFinite(left) && !Number.isFinite(right)) return null;
  return (finite(left) ?? 0) + (finite(right) ?? 0);
}

function finite(value) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
