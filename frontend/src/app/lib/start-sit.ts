import manifest from "../../../data/start-sit-comparisons.json";
import { getTeamByAbbr } from "./team-data";
import { nflversePlayerRelease } from "./nflverse";
import { getPlayerPage } from "./player-pages";
import { projectPlayerWeek, projectionWinner, startSitScoringFormats, type StartSitProjection } from "./start-sit-model.mjs";
import { getWeeklyMatchups, matchupIsComplete, regularSeasonWeeks } from "./weekly-matchups";

export type StartSitConfig = {
  slug: string;
  leftSlug: string;
  rightSlug: string;
  position: "QB" | "RB" | "WR" | "TE";
  selectionReason: string;
};

export const activeStartSitWeek = regularSeasonWeeks.find((week) =>
  getWeeklyMatchups(week).some((matchup) => !matchupIsComplete(matchup)),
) ?? 18;

export const startSitComparisons = (manifest as StartSitConfig[]).filter((comparison) =>
  Boolean(getPlayerPage(comparison.leftSlug) && getPlayerPage(comparison.rightSlug) &&
    nflversePlayerRelease.players[comparison.leftSlug] && nflversePlayerRelease.players[comparison.rightSlug]),
);

export const startSitSlugs = startSitComparisons.map(({ slug }) => slug);

export function getStartSitComparison(slug: string) {
  return startSitComparisons.find((comparison) => comparison.slug === slug) ?? null;
}

export type StartSitSide = {
  slug: string;
  name: string;
  team: string | null;
  opponent: string | null;
  projection: StartSitProjection;
};

export type StartSitDecision = {
  scoring: (typeof startSitScoringFormats)[number];
  left: StartSitSide;
  right: StartSitSide;
  winner: { side: "left" | "right"; gap: number; close: boolean };
};

export function getStartSitDecisions(comparison: StartSitConfig, week = activeStartSitWeek): StartSitDecision[] {
  return startSitScoringFormats.flatMap((scoring) => {
    const left = buildSide(comparison.leftSlug, comparison.position, week, scoring.receptionPoints);
    const right = buildSide(comparison.rightSlug, comparison.position, week, scoring.receptionPoints);
    const winner = projectionWinner(left?.projection ?? null, right?.projection ?? null);
    return left && right && winner ? [{ scoring, left, right, winner }] : [];
  });
}

export function startSitPath(slug: string) {
  return `/who-should-i-start/${slug}`;
}

function buildSide(slug: string, position: StartSitConfig["position"], week: number, receptionPoints: 0 | 0.5 | 1): StartSitSide | null {
  const player = nflversePlayerRelease.players[slug];
  const page = getPlayerPage(slug);
  const team = getTeamByAbbr(player?.roster?.team);
  const game = team?.schedule.find((candidate) => candidate.week === week);
  const opponent = getTeamByAbbr(game?.opponentAbbr);
  const field = receptionPoints === 0 ? "standard" : receptionPoints === 0.5 ? "halfPpr" : "ppr";
  const allowed = opponent ? nflversePlayerRelease.positionDefense.teams[opponent.abbr]?.[position]?.pointsPerGame[field] : null;
  const leagueValues = Object.values(nflversePlayerRelease.positionDefense.teams)
    .map((positions) => positions[position]?.pointsPerGame[field])
    .filter((value): value is number => Number.isFinite(value))
    .sort((left, right) => left - right);
  const leagueMedian = leagueValues.length
    ? leagueValues.length % 2
      ? leagueValues[Math.floor(leagueValues.length / 2)]
      : (leagueValues[leagueValues.length / 2 - 1] + leagueValues[leagueValues.length / 2]) / 2
    : null;
  if (!player || !page) return null;
  const projection = projectPlayerWeek({ player, week, season: nflversePlayerRelease.season, opponentAllowed: allowed, leagueMedianAllowed: leagueMedian, receptionPoints, passingTdPoints: 4 });
  if (!projection) return null;
  return { slug, name: page.name, team: team?.abbr ?? null, opponent: opponent?.abbr ?? null, projection };
}
