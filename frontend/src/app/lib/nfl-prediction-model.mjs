const HOME_FIELD_POINTS = 1.5;
const MODEL_VERSION = "ftt-nfl-prediction-2026.10.1";

export { HOME_FIELD_POINTS, MODEL_VERSION };

export function buildWeekPredictions({ teams, week, capturedAt }) {
  const games = uniqueGames(teams, week);
  const ratings = buildTeamRatings(teams, week);
  return games.map((game) => buildGamePrediction({ game, teams, ratings, week, capturedAt }));
}

export function buildTeamRatings(teams, cutoffWeek) {
  const teamList = Object.values(teams);
  const observations = new Map(teamList.map((team) => [team.abbr, []]));
  const unique = uniqueGames(teams).filter((game) => game.week < cutoffWeek && game.homeScore !== null && game.awayScore !== null);

  for (const game of unique) {
    const homeMargin = game.homeScore - game.awayScore;
    const field = game.neutral ? 0 : HOME_FIELD_POINTS;
    const recencyWeight = 0.82 ** Math.max(0, cutoffWeek - game.week - 1);
    observations.get(game.homeAbbr)?.push({ opponent: game.awayAbbr, margin: clamp(homeMargin - field, -28, 28), weight: recencyWeight });
    observations.get(game.awayAbbr)?.push({ opponent: game.homeAbbr, margin: clamp(-homeMargin + field, -28, 28), weight: recencyWeight });
  }

  let current = new Map(teamList.map((team) => [team.abbr, team.baseline.pointDifferentialPerGame]));
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const next = new Map();
    for (const team of teamList) {
      const samples = observations.get(team.abbr) ?? [];
      if (!samples.length) {
        next.set(team.abbr, team.baseline.pointDifferentialPerGame);
        continue;
      }
      const weight = samples.reduce((sum, sample) => sum + sample.weight, 0);
      next.set(team.abbr, samples.reduce((sum, sample) => sum + (sample.margin + (current.get(sample.opponent) ?? 0)) * sample.weight, 0) / weight);
    }
    const mean = [...next.values()].reduce((sum, value) => sum + value, 0) / next.size;
    current = new Map([...next].map(([abbr, value]) => [abbr, value - mean]));
  }

  return new Map(teamList.map((team) => {
    const games = observations.get(team.abbr)?.length ?? 0;
    const currentWeight = Math.min(0.75, games * 0.11);
    const prior = team.baseline.pointDifferentialPerGame;
    return [team.abbr, round(prior * (1 - currentWeight) + (current.get(team.abbr) ?? prior) * currentWeight, 2)];
  }));
}

export function uniqueGames(teams, week = null) {
  const games = [];
  const seen = new Set();
  for (const team of Object.values(teams)) {
    for (const game of team.schedule) {
      if ((week !== null && game.week !== week) || seen.has(game.gameId)) continue;
      const opponent = teams[game.opponentAbbr];
      if (!opponent) continue;
      const home = game.site === "home" ? team : opponent;
      const away = game.site === "home" ? opponent : team;
      const homeGame = home.schedule.find((candidate) => candidate.gameId === game.gameId) ?? game;
      const awayGame = away.schedule.find((candidate) => candidate.gameId === game.gameId) ?? game;
      seen.add(game.gameId);
      games.push({
        gameId: game.gameId,
        week: game.week,
        date: game.date,
        time: game.time,
        weekday: game.weekday,
        stadium: game.stadium,
        neutral: game.site === "neutral",
        homeAbbr: home.abbr,
        awayAbbr: away.abbr,
        homeScore: homeGame.teamScore,
        awayScore: awayGame.teamScore,
        homeRest: homeGame.teamRest,
        awayRest: awayGame.teamRest,
        homeQuarterback: homeGame.teamQuarterback,
        awayQuarterback: awayGame.teamQuarterback,
        betting: homeGame.betting,
      });
    }
  }
  return games.sort((left, right) => `${left.date} ${left.time ?? ""}`.localeCompare(`${right.date} ${right.time ?? ""}`));
}

function buildGamePrediction({ game, teams, ratings, week, capturedAt }) {
  const home = teams[game.homeAbbr];
  const away = teams[game.awayAbbr];
  const field = game.neutral ? 0 : HOME_FIELD_POINTS;
  const restEdge = clamp((game.homeRest ?? 7) - (game.awayRest ?? 7), -4, 4) * 0.15;
  const modelHomeMargin = clamp((ratings.get(home.abbr) ?? 0) - (ratings.get(away.abbr) ?? 0) + field + restEdge, -21, 21);
  const modelTotal = projectedTotal(home, away, week);
  const projectedHomeScore = (modelTotal + modelHomeMargin) / 2;
  const projectedAwayScore = modelTotal - projectedHomeScore;
  const homeWinProbability = normalCdf(modelHomeMargin / 13.45);
  const marketHomeProbability = fairMarketProbability(game.betting.homeMoneyline, game.betting.awayMoneyline);
  const spreadEdge = game.betting.spreadLine === null ? null : modelHomeMargin - game.betting.spreadLine;
  const totalEdge = game.betting.totalLine === null ? null : modelTotal - game.betting.totalLine;

  return {
    gameId: game.gameId,
    week,
    capturedAt,
    status: "pregame",
    homeAbbr: home.abbr,
    awayAbbr: away.abbr,
    modelHomeMargin: round(modelHomeMargin, 1),
    modelTotal: round(modelTotal, 1),
    projectedHomeScore: round(projectedHomeScore, 1),
    projectedAwayScore: round(projectedAwayScore, 1),
    homeWinProbability: round(homeWinProbability, 4),
    marketHomeProbability: marketHomeProbability === null ? null : round(marketHomeProbability, 4),
    spreadEdge: spreadEdge === null ? null : round(spreadEdge, 1),
    totalEdge: totalEdge === null ? null : round(totalEdge, 1),
    homeRating: round(ratings.get(home.abbr) ?? 0, 1),
    awayRating: round(ratings.get(away.abbr) ?? 0, 1),
    market: { ...game.betting },
  };
}

function projectedTotal(home, away, cutoffWeek) {
  const homeForm = scoringForm(home, cutoffWeek);
  const awayForm = scoringForm(away, cutoffWeek);
  const homePoints = (homeForm.for + awayForm.allowed) / 2 + HOME_FIELD_POINTS / 2;
  const awayPoints = (awayForm.for + homeForm.allowed) / 2 - HOME_FIELD_POINTS / 2;
  return clamp(homePoints + awayPoints, 30, 65);
}

function scoringForm(team, cutoffWeek) {
  const games = team.schedule.filter((game) => game.week < cutoffWeek && game.teamScore !== null && game.opponentScore !== null);
  if (!games.length) return { for: team.baseline.pointsForPerGame, allowed: team.baseline.pointsAllowedPerGame };
  const weight = Math.min(0.72, games.length * 0.12);
  const pointsFor = games.reduce((sum, game) => sum + game.teamScore, 0) / games.length;
  const pointsAllowed = games.reduce((sum, game) => sum + game.opponentScore, 0) / games.length;
  return {
    for: team.baseline.pointsForPerGame * (1 - weight) + pointsFor * weight,
    allowed: team.baseline.pointsAllowedPerGame * (1 - weight) + pointsAllowed * weight,
  };
}

export function americanOddsProbability(odds) {
  if (odds === null || !Number.isFinite(odds) || Math.abs(odds) < 100) return null;
  return odds < 0 ? -odds / (-odds + 100) : 100 / (odds + 100);
}

export function fairMarketProbability(homeOdds, awayOdds) {
  const home = americanOddsProbability(homeOdds);
  const away = americanOddsProbability(awayOdds);
  if (home === null || away === null) return null;
  return home / (home + away);
}

function normalCdf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function round(value, decimals) { const factor = 10 ** decimals; return Math.round(value * factor) / factor; }
