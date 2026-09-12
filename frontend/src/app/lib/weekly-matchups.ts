import { canonicalTeamAbbr, getTeamByAbbr, teamRelease, teams } from "./team-data";
import type { TeamGame, TeamProfile } from "../types/Team";

export const regularSeasonWeeks = Array.from({ length: 18 }, (_, index) => index + 1);
export const weeklyMatchupSlugs = regularSeasonWeeks.map((week) => `week-${week}`);
export const matchupExperimentWeek = 1;

export type WeeklyMatchup = {
  gameId: string;
  week: number;
  date: string;
  weekday: string;
  time: string | null;
  stadium: string | null;
  roof: string | null;
  surface: string | null;
  away: TeamProfile;
  home: TeamProfile;
  awayView: TeamGame;
  homeView: TeamGame;
};

export function weekFromSlug(slug: string) {
  const match = /^week-(\d{1,2})$/.exec(slug);
  const week = match ? Number(match[1]) : NaN;
  return regularSeasonWeeks.includes(week) ? week : null;
}

export function getWeeklyMatchups(week: number): WeeklyMatchup[] {
  const seen = new Set<string>();
  const matchups: WeeklyMatchup[] = [];

  for (const team of teams) {
    for (const game of team.schedule.filter((candidate) => candidate.week === week)) {
      if (seen.has(game.gameId)) continue;
      seen.add(game.gameId);

      const opponent = getTeamByAbbr(game.opponentAbbr);
      if (!opponent) continue;
      const opponentGame = opponent.schedule.find((candidate) => candidate.gameId === game.gameId);
      if (!opponentGame) continue;

      const away = game.site === "away" ? team : opponent;
      const home = game.site === "away" ? opponent : team;
      const awayView = game.site === "away" ? game : opponentGame;
      const homeView = game.site === "away" ? opponentGame : game;

      matchups.push({
        gameId: game.gameId,
        week,
        date: game.date,
        weekday: game.weekday,
        time: game.time,
        stadium: game.stadium,
        roof: game.roof,
        surface: game.surface,
        away,
        home,
        awayView,
        homeView,
      });
    }
  }

  return matchups.sort((left, right) =>
    `${left.date}T${left.time ?? "23:59"}`.localeCompare(`${right.date}T${right.time ?? "23:59"}`),
  );
}

export function matchupGameSlug(matchup: WeeklyMatchup) {
  return `${matchup.away.slug}-vs-${matchup.home.slug}`;
}

export const matchupExperimentGames = getWeeklyMatchups(matchupExperimentWeek).map(
  (matchup) => ({
    weekSlug: `week-${matchup.week}`,
    gameSlug: matchupGameSlug(matchup),
    gameId: matchup.gameId,
  }),
);

export function getMatchupExperimentGame(weekSlug: string, gameSlug: string) {
  const week = weekFromSlug(weekSlug);
  if (week !== matchupExperimentWeek) return null;
  return getWeeklyMatchups(week).find(
    (matchup) => matchupGameSlug(matchup) === gameSlug,
  ) ?? null;
}

export function getWeekDateRange(week: number) {
  const matchups = getWeeklyMatchups(week);
  if (!matchups.length) return null;
  return { start: matchups[0].date, end: matchups[matchups.length - 1].date };
}

export function matchupIsComplete(matchup: WeeklyMatchup) {
  return matchup.awayView.result !== null && matchup.homeView.result !== null;
}

export function canonicalMatchupTeams(matchup: WeeklyMatchup) {
  return {
    away: canonicalTeamAbbr(matchup.away.abbr),
    home: canonicalTeamAbbr(matchup.home.abbr),
  };
}

export const weeklyMatchupRelease = {
  season: teamRelease.season,
  baselineSeason: teamRelease.baselineSeason,
  capturedAt: teamRelease.capturedAt,
  releaseId: teamRelease.releaseId,
  modelVersion: teamRelease.modelVersion,
};
