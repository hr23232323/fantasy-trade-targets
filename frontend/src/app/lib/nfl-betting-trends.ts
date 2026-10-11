import type { TeamBettingTrendGame, TeamBettingTrendSummary, TeamProfile } from "../types/Team";
import { getTeamByAbbr, teams } from "./team-data";

export const bettingTrendsHubPath = () => "/nfl-ats-records";
export const teamBettingTrendsPath = (slug: string) => `${bettingTrendsHubPath()}/${slug}`;

export function record(value: { wins: number; losses: number; ties?: number; pushes?: number }) {
  const third = value.ties ?? value.pushes ?? 0;
  return `${value.wins}-${value.losses}${third ? `-${third}` : ""}`;
}

export function totalsRecord(value: TeamBettingTrendSummary["totals"]) {
  return `${value.overs}-${value.unders}${value.pushes ? `-${value.pushes}` : ""}`;
}

export function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function opponentName(game: TeamBettingTrendGame) {
  return getTeamByAbbr(game.opponentAbbr)?.name ?? game.opponentAbbr;
}

export function atsRankings(period: "currentSeason" | "previousSeason" | "last10") {
  return [...teams].sort((left, right) => {
    const leftRate = left.bettingTrends[period].againstSpread.coverRate ?? -1;
    const rightRate = right.bettingTrends[period].againstSpread.coverRate ?? -1;
    return rightRate - leftRate || right.bettingTrends[period].againstSpread.wins - left.bettingTrends[period].againstSpread.wins || left.name.localeCompare(right.name);
  });
}

export function teamTrendAnswer(team: TeamProfile, period: "currentSeason" | "previousSeason" | "last10" = "currentSeason") {
  const summary = team.bettingTrends[period];
  const label = period === "last10" ? "over its last 10 graded games" : period === "currentSeason" ? "this season" : "last season";
  return `${team.name} is ${record(summary.againstSpread)} against the spread ${label}, covering ${percent(summary.againstSpread.coverRate)} of graded games. Its totals record is ${totalsRecord(summary.totals)} (over-under${summary.totals.pushes ? "-push" : ""}).`;
}
