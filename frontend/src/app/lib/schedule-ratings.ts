import { getTeamByAbbr, teams } from "./team-data";
import { regularSeasonWeeks, weekFromSlug } from "./weekly-matchups";
import type { TeamGame, TeamProfile } from "../types/Team";

export type WeeklyScheduleRating = {
  rank: number;
  team: TeamProfile;
  opponent: TeamProfile;
  game: TeamGame;
};

export const scheduleRatingSlugs = regularSeasonWeeks.map((week) => `week-${week}`);

export function getWeeklyScheduleRatings(week: number): WeeklyScheduleRating[] {
  return teams
    .flatMap((team) => {
      const game = team.schedule.find((candidate) => candidate.week === week);
      const opponent = game ? getTeamByAbbr(game.opponentAbbr) : undefined;
      return game && opponent ? [{ team, opponent, game }] : [];
    })
    .sort((left, right) =>
      right.game.environmentScore - left.game.environmentScore ||
      left.team.name.localeCompare(right.team.name),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getScheduleRatingWeek(slug: string) {
  return weekFromSlug(slug);
}
