import { fantasyPoints } from "./start-sit-model.mjs";

const SUPPORTED_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
const TEAM_ALIASES = { LA: "LAR", SFO: "SF", TBB: "TB", OAK: "LV", SD: "LAC", STL: "LAR" };

export function buildRestOfSeasonRankings({
  assets,
  players,
  teams,
  positionDefense,
  season,
  currentWeek,
  receptionPoints,
}) {
  const marketPlayers = assets
    .filter((asset) => asset.kind === "player" && SUPPORTED_POSITIONS.has(asset.position))
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
  const overallMarketRanks = new Map(marketPlayers.map((asset, index) => [asset.slug, index + 1]));
  const positionMarketRanks = rankWithinPosition(marketPlayers, (asset) => asset.value);

  const rawRows = marketPlayers.flatMap((asset) => {
    const player = players[asset.slug];
    if (!player) return [];
    const position = asset.position;
    const currentGames = player.games
      .filter((game) => game.season === season && game.week < currentWeek)
      .sort((left, right) => right.week - left.week);
    const recentGames = currentGames.slice(0, 4);
    const recentPointsPerGame = average(recentGames.map((game) => fantasyPoints(game, receptionPoints, 4)));
    const recentOpportunity = average(recentGames.map((game) => opportunity(game, position)));
    const recentSnapPct = average(recentGames.map((game) => game.offenseSnapPct));
    const team = canonicalTeam(player.roster?.team ?? asset.team ?? null);
    const schedule = remainingSchedule({ team, position, teams, positionDefense, currentWeek, receptionPoints });
    return [{
      slug: asset.slug,
      name: asset.name,
      position,
      team,
      marketValue: asset.value,
      overallMarketRank: overallMarketRanks.get(asset.slug),
      positionMarketRank: positionMarketRanks.get(asset.slug),
      recentPointsPerGame,
      recentOpportunity,
      recentSnapPct,
      currentSeasonGames: currentGames.length,
      remainingGames: schedule.games,
      remainingPointsAllowed: schedule.average,
    }];
  });

  const rowsWithSignals = rawRows.map((row) => {
    const peers = rawRows.filter((candidate) => candidate.position === row.position);
    const formPercentile = percentile(row.recentPointsPerGame, peers.map((peer) => peer.recentPointsPerGame));
    const opportunityPercentile = percentile(row.recentOpportunity, peers.map((peer) => peer.recentOpportunity));
    const snapPercentile = percentile(row.recentSnapPct, peers.map((peer) => peer.recentSnapPct));
    const schedulePercentile = percentile(row.remainingPointsAllowed, peers.map((peer) => peer.remainingPointsAllowed));
    const usagePercentile = average([opportunityPercentile, snapPercentile]) ?? 0.5;
    const rating = round(clamp(
      row.marketValue * 0.7 +
      formPercentile * 1000 * 0.12 +
      usagePercentile * 1000 * 0.12 +
      schedulePercentile * 1000 * 0.06,
      0,
      1000,
    ));
    return { ...row, formPercentile, usagePercentile, schedulePercentile, rating };
  });

  const overall = [...rowsWithSignals].sort(compareRating);
  const overallRanks = new Map(overall.map((row, index) => [row.slug, index + 1]));
  const positionRanks = rankWithinPosition(rowsWithSignals, (row) => row.rating);
  return overall.map((row) => ({
    ...row,
    overallRank: overallRanks.get(row.slug),
    positionRank: positionRanks.get(row.slug),
  }));
}

function remainingSchedule({ team, position, teams, positionDefense, currentWeek, receptionPoints }) {
  const field = receptionPoints === 0 ? "standard" : receptionPoints === 0.5 ? "halfPpr" : "ppr";
  const games = team ? (teams[team]?.schedule ?? []).filter((game) => game.result === null && game.week >= currentWeek) : [];
  const values = games.flatMap((game) => {
    const opponent = canonicalTeam(game.opponentAbbr);
    const allowed = opponent ? positionDefense?.[opponent]?.[position]?.pointsPerGame?.[field] : null;
    return Number.isFinite(allowed) ? [allowed] : [];
  });
  return { games: values.length, average: average(values) };
}

function rankWithinPosition(rows, value) {
  const ranks = new Map();
  for (const position of SUPPORTED_POSITIONS) {
    rows
      .filter((row) => row.position === position)
      .sort((left, right) => value(right) - value(left) || left.name.localeCompare(right.name))
      .forEach((row, index) => ranks.set(row.slug, index + 1));
  }
  return ranks;
}

function compareRating(left, right) {
  return right.rating - left.rating || right.marketValue - left.marketValue || left.name.localeCompare(right.name);
}

function opportunity(game, position) {
  if (position === "QB") return sum(game.passing?.attempts, game.rushing?.carries);
  if (position === "RB") return sum(game.rushing?.carries, game.receiving?.targets);
  return finite(game.receiving?.targets);
}

function percentile(value, values) {
  if (!Number.isFinite(value)) return 0.5;
  const finiteValues = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (finiteValues.length < 2) return 0.5;
  const below = finiteValues.filter((candidate) => candidate < value).length;
  const equal = finiteValues.filter((candidate) => candidate === value).length;
  return (below + Math.max(0, equal - 1) / 2) / (finiteValues.length - 1);
}

function average(values) {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length ? finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length : null;
}

function canonicalTeam(value) {
  if (!value) return null;
  return TEAM_ALIASES[value] ?? value;
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
