import corrections from "../../../data/availability-corrections.json";
import { findAvailabilityCorrection } from "./player-availability.mjs";
import { teamRelease } from "./team-data";

const currentWeek = Array.from({ length: 18 }, (_, index) => index + 1).find((week) =>
  Object.values(teamRelease.teams).some((team) => team.schedule.some((game) => game.week === week && game.result === null)),
) ?? 18;

export function getReviewedAvailability(slug: string, week = currentWeek) {
  return findAvailabilityCorrection(corrections, slug, teamRelease.season, week);
}
