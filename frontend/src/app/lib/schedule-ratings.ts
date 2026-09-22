import { getTeamByAbbr, teams } from "./team-data";
import { nflversePlayerRelease } from "./nflverse";
import { regularSeasonWeeks, weekFromSlug } from "./weekly-matchups";
import type { TeamGame, TeamProfile } from "../types/Team";

export type WeeklyScheduleRating = {
  rank: number;
  team: TeamProfile;
  opponent: TeamProfile;
  game: TeamGame;
};

export const scheduleRatingSlugs = regularSeasonWeeks.map((week) => `week-${week}`);

export const positionScheduleConfigs = [
  { slug: "quarterbacks", position: "QB", singular: "quarterback", label: "Quarterback" },
  { slug: "running-backs", position: "RB", singular: "running back", label: "Running Back" },
  { slug: "wide-receivers", position: "WR", singular: "wide receiver", label: "Wide Receiver" },
  { slug: "tight-ends", position: "TE", singular: "tight end", label: "Tight End" },
] as const;

export const positionScheduleSlugs = positionScheduleConfigs.map(({ slug }) => slug);

const positionWeekScheduleWeeks = [3, 4] as const;

export const positionWeekScheduleConfigs = positionWeekScheduleWeeks.flatMap((week) =>
  positionScheduleConfigs.map((config) => ({
    ...config,
    week,
    slug: `week-${week}-${config.slug}`,
  })),
);

export const positionWeekScheduleSlugs = positionWeekScheduleConfigs.map(({ slug }) => slug);

export type PositionScheduleConfig = (typeof positionScheduleConfigs)[number];
export type PositionWeekScheduleConfig = (typeof positionWeekScheduleConfigs)[number];

export type PositionScheduleRating = {
  rank: number;
  team: TeamProfile;
  nextFour: Array<{ opponent: TeamProfile; game: TeamGame; pprAllowed: number }>;
  nextFourAverage: number;
  remainingAverage: { standard: number; halfPpr: number; ppr: number };
};

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

export function getPositionScheduleConfig(slug: string) {
  return positionScheduleConfigs.find((config) => config.slug === slug) ?? null;
}

export function getPositionWeekScheduleConfig(slug: string) {
  return positionWeekScheduleConfigs.find((config) => config.slug === slug) ?? null;
}

export function getPositionWeekScheduleRatings(config: PositionWeekScheduleConfig) {
  const positionDefense = nflversePlayerRelease.positionDefense?.teams;
  if (!positionDefense) return [];
  return teams
    .flatMap((team) => {
      const game = team.schedule.find((candidate) => candidate.week === config.week);
      const opponent = game ? getTeamByAbbr(game.opponentAbbr) : undefined;
      const pointsAllowed = opponent
        ? positionDefense[opponent.abbr]?.[config.position]?.pointsPerGame
        : undefined;
      return game && opponent && pointsAllowed
        ? [{ team, opponent, game, pointsAllowed }]
        : [];
    })
    .sort((left, right) =>
      right.pointsAllowed.ppr - left.pointsAllowed.ppr ||
      left.team.name.localeCompare(right.team.name),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getPositionScheduleRatings(config: PositionScheduleConfig): PositionScheduleRating[] {
  const positionDefense = nflversePlayerRelease.positionDefense?.teams;
  if (!positionDefense) return [];

  return teams
    .flatMap((team) => {
      const remaining = team.schedule
        .filter((game) => game.result === null)
        .flatMap((game) => {
          const opponent = getTeamByAbbr(game.opponentAbbr);
          const allowed = positionDefense[opponent?.abbr ?? ""]?.[config.position]?.pointsPerGame;
          return opponent && allowed ? [{ game, opponent, allowed }] : [];
        });
      if (!remaining.length) return [];

      const average = (field: "standard" | "halfPpr" | "ppr", games = remaining) =>
        games.reduce((sum, row) => sum + row.allowed[field], 0) / games.length;
      const nextFourRows = remaining.slice(0, 4);
      return [{
        team,
        nextFour: nextFourRows.map(({ opponent, game, allowed }) => ({
          opponent,
          game,
          pprAllowed: allowed.ppr,
        })),
        nextFourAverage: average("ppr", nextFourRows),
        remainingAverage: {
          standard: average("standard"),
          halfPpr: average("halfPpr"),
          ppr: average("ppr"),
        },
      }];
    })
    .sort((left, right) =>
      right.nextFourAverage - left.nextFourAverage ||
      right.remainingAverage.ppr - left.remainingAverage.ppr ||
      left.team.name.localeCompare(right.team.name),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
