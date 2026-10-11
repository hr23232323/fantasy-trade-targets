import predictionReleaseJson from "../../../data/nfl-prediction-snapshots.json";
import { teamRelease, getTeamByAbbr } from "./team-data";
import type { TeamGame, TeamProfile } from "../types/Team";

export type PredictionSnapshot = {
  gameId: string;
  week: number;
  capturedAt: string;
  status: "pregame" | "result_only";
  homeAbbr: string;
  awayAbbr: string;
  modelHomeMargin?: number;
  modelTotal?: number;
  projectedHomeScore?: number;
  projectedAwayScore?: number;
  homeWinProbability?: number;
  marketHomeProbability?: number | null;
  spreadEdge?: number | null;
  totalEdge?: number | null;
  homeRating?: number;
  awayRating?: number;
  market: TeamGame["betting"];
};

export type PredictionRelease = {
  schemaVersion: number;
  modelVersion: string;
  releaseId: string;
  capturedAt: string;
  sourceReleaseId: string;
  publishedWeeks: number[];
  games: Record<string, PredictionSnapshot>;
};

export type PredictionGame = {
  snapshot: PredictionSnapshot;
  home: TeamProfile;
  away: TeamProfile;
  homeGame: TeamGame;
  awayGame: TeamGame;
  slug: string;
};

export const predictionRelease = predictionReleaseJson as PredictionRelease;
export const predictionValidation = teamRelease.predictionModel.validation;
export const publishedPredictionWeeks = predictionRelease.publishedWeeks;
export const currentPredictionWeek = Math.max(...publishedPredictionWeeks);

export function predictionHubPath() { return "/nfl-picks-predictions"; }
export function predictionWeekPath(week: number) { return `${predictionHubPath()}/week-${week}`; }
export function atsWeekPath(week: number) { return `/nfl-picks-against-the-spread/week-${week}`; }
export function totalsWeekPath(week: number) { return `/nfl-over-under-picks/week-${week}`; }
export function predictionGamePath(week: number, slug: string) { return `${predictionWeekPath(week)}/${slug}`; }

export function getPredictionGamesForWeek(week: number): PredictionGame[] {
  return Object.values(predictionRelease.games)
    .filter((snapshot) => snapshot.week === week)
    .flatMap((snapshot) => {
      const home = getTeamByAbbr(snapshot.homeAbbr);
      const away = getTeamByAbbr(snapshot.awayAbbr);
      const homeGame = home?.schedule.find(({ gameId }) => gameId === snapshot.gameId);
      const awayGame = away?.schedule.find(({ gameId }) => gameId === snapshot.gameId);
      if (!home || !away || !homeGame || !awayGame) return [];
      return [{ snapshot, home, away, homeGame, awayGame, slug: `${away.slug}-vs-${home.slug}` }];
    })
    .sort((left, right) => `${left.homeGame.date} ${left.homeGame.time ?? ""}`.localeCompare(`${right.homeGame.date} ${right.homeGame.time ?? ""}`));
}

export function getPredictionGame(week: number, slug: string) {
  return getPredictionGamesForWeek(week).find((game) => game.slug === slug) ?? null;
}

export function allPredictionGameParams() {
  return publishedPredictionWeeks.flatMap((week) => getPredictionGamesForWeek(week).map(({ slug }) => ({ weekSlug: `week-${week}`, gameSlug: slug })));
}

export function parsePredictionWeek(value: string) {
  const match = /^week-(\d{1,2})$/.exec(value);
  const week = match ? Number(match[1]) : NaN;
  return publishedPredictionWeeks.includes(week) ? week : null;
}

export function winner(game: PredictionGame) {
  if (game.snapshot.status !== "pregame" || game.snapshot.modelHomeMargin === undefined) return null;
  return game.snapshot.modelHomeMargin >= 0 ? game.home : game.away;
}

export function projectedScore(game: PredictionGame) {
  if (game.snapshot.status !== "pregame" || game.snapshot.projectedHomeScore === undefined || game.snapshot.projectedAwayScore === undefined) return null;
  return {
    home: Math.round(game.snapshot.projectedHomeScore),
    away: Math.round(game.snapshot.projectedAwayScore),
  };
}

export function atsLean(game: PredictionGame) {
  const { snapshot } = game;
  if (snapshot.status !== "pregame" || snapshot.spreadEdge === null || snapshot.spreadEdge === undefined || snapshot.market.spreadLine === null) return null;
  const team = snapshot.spreadEdge >= 0 ? game.home : game.away;
  const line = team.abbr === game.home.abbr ? -snapshot.market.spreadLine : snapshot.market.spreadLine;
  return { team, line, edge: Math.abs(snapshot.spreadEdge), pass: Math.abs(snapshot.spreadEdge) < 1 };
}

export function totalLean(game: PredictionGame) {
  const { snapshot } = game;
  if (snapshot.status !== "pregame" || snapshot.totalEdge === null || snapshot.totalEdge === undefined || snapshot.market.totalLine === null) return null;
  return { side: snapshot.totalEdge >= 0 ? "Over" : "Under", line: snapshot.market.totalLine, edge: Math.abs(snapshot.totalEdge), pass: Math.abs(snapshot.totalEdge) < 1 } as const;
}

export function moneylinePick(game: PredictionGame) {
  const picked = winner(game);
  if (!picked) return null;
  const odds = picked.abbr === game.home.abbr ? game.snapshot.market.homeMoneyline : game.snapshot.market.awayMoneyline;
  const probability = picked.abbr === game.home.abbr ? game.snapshot.homeWinProbability : 1 - (game.snapshot.homeWinProbability ?? 0.5);
  return { team: picked, odds, probability };
}

export function gameResult(game: PredictionGame) {
  if (game.homeGame.teamScore === null || game.awayGame.teamScore === null) return null;
  return { home: game.homeGame.teamScore, away: game.awayGame.teamScore };
}

export function teamRecord(team: TeamProfile, beforeWeek: number) {
  const games = team.schedule.filter((game) => game.week < beforeWeek && game.result !== null);
  const wins = games.filter((game) => game.result === "W").length;
  const losses = games.filter((game) => game.result === "L").length;
  const ties = games.filter((game) => game.result === "T").length;
  const pointsFor = games.reduce((sum, game) => sum + (game.teamScore ?? 0), 0);
  const pointsAgainst = games.reduce((sum, game) => sum + (game.opponentScore ?? 0), 0);
  return { games: games.length, wins, losses, ties, pointDifferential: games.length ? (pointsFor - pointsAgainst) / games.length : team.baseline.pointDifferentialPerGame };
}

export function formatAmericanOdds(value: number | null) { return value === null ? "—" : value > 0 ? `+${value}` : String(value); }
export function formatSpread(value: number | null) { return value === null ? "—" : value > 0 ? `+${value}` : value === 0 ? "PK" : String(value); }
export function formatProbability(value: number | null | undefined) { return value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`; }
export function predictionUpdatedAt() { return new Date(Math.max(Date.parse(predictionRelease.capturedAt), Date.parse(teamRelease.capturedAt))).toISOString(); }
