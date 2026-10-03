import { buildPlayoffScheduleRatings } from "./playoff-schedule-model.mjs";
import { nflversePlayerRelease } from "./nflverse";
import { positionScheduleConfigs } from "./schedule-ratings";
import { teams } from "./team-data";
import type { TeamGame, TeamProfile } from "../types/Team";

export const playoffPositionConfigs = positionScheduleConfigs;
export const playoffPositionSlugs = playoffPositionConfigs.map(({ slug }) => slug);
export const primaryPlayoffWeeks = [15, 16, 17] as const;
export const alternatePlayoffWeeks = [14, 15, 16] as const;

export type PlayoffPositionConfig = (typeof playoffPositionConfigs)[number];
export type PlayoffScoringField = "standard" | "halfPpr" | "ppr";
export type PlayoffScheduleRating = {
  rank: number;
  team: TeamProfile;
  weeks: number[];
  games: Array<{
    week: number;
    game: TeamGame | null;
    opponent: TeamProfile | null;
    bye: boolean;
    pointsAllowed: Record<PlayoffScoringField, number>;
  }>;
  averages: Record<PlayoffScoringField, number>;
};

export function getPlayoffPositionConfig(slug: string) {
  return playoffPositionConfigs.find((config) => config.slug === slug) ?? null;
}

export function getPlayoffScheduleRatings(
  config: PlayoffPositionConfig,
  weeks: readonly number[] = primaryPlayoffWeeks,
) {
  return buildPlayoffScheduleRatings({
    teams,
    positionDefense: nflversePlayerRelease.positionDefense.teams,
    position: config.position,
    weeks: [...weeks],
  }) as PlayoffScheduleRating[];
}

export function playoffSchedulePath(position?: string) {
  return position
    ? `/fantasy-football-playoff-strength-of-schedule/${position}`
    : "/fantasy-football-playoff-strength-of-schedule";
}
