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
  position: "QB" | "RB" | "WR" | "TE" | "FLEX";
  selectionReason: string;
};

export type StartSitPlayerOption = {
  slug: string;
  urlSlug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string | null;
};

export const activeStartSitWeek = regularSeasonWeeks.find((week) =>
  getWeeklyMatchups(week).some((matchup) => !matchupIsComplete(matchup)),
) ?? 18;

export const startSitComparisons = (manifest as StartSitConfig[]).filter((comparison) =>
  Boolean(getPlayerPage(comparison.leftSlug) && getPlayerPage(comparison.rightSlug) &&
    nflversePlayerRelease.players[comparison.leftSlug] && nflversePlayerRelease.players[comparison.rightSlug]),
);

export const startSitSlugs = startSitComparisons.map(({ slug }) => slug);

export const startSitAnswerTitleSlugs = new Set([
  "ceedee-lamb-vs-jamarr-chase",
  "bijan-robinson-vs-kenneth-walker",
  "ashton-jeanty-vs-chris-olave",
  "jamarr-chase-vs-kenneth-walker",
  "ashton-jeanty-vs-javonte-williams",
  "chase-brown-vs-drake-london",
  "chris-olave-vs-puka-nacua",
  "amon-ra-st-brown-vs-derrick-henry",
  "ceedee-lamb-vs-kenneth-walker",
  "amon-ra-st-brown-vs-chris-olave",
  "kenneth-walker-vs-puka-nacua",
  "ceedee-lamb-vs-chris-olave",
  "amon-ra-st-brown-vs-puka-nacua",
  "ashton-jeanty-vs-kyren-williams",
  "justin-jefferson-vs-saquon-barkley",
]);

export const startSitPlayerOptions = Object.values(nflversePlayerRelease.players)
  .flatMap((player): StartSitPlayerOption[] => {
    const page = getPlayerPage(player.slug);
    const position = player.roster?.position;
    if (!page || !isFantasyPosition(position) || !player.games.some((game) => game.season < nflversePlayerRelease.season || game.week < activeStartSitWeek)) return [];
    return [{ slug: player.slug, urlSlug: startSitUrlPlayerSlug(player.slug), name: page.name, position, team: player.roster?.team ?? null }];
  })
  .sort((left, right) => left.name.localeCompare(right.name));

const startSitPlayerByUrlSlug = new Map(startSitPlayerOptions.map((player) => [player.urlSlug, player]));

export function getStartSitComparison(slug: string) {
  const reviewed = startSitComparisons.find((comparison) => comparison.slug === slug);
  if (reviewed) return reviewed;
  const divider = slug.indexOf("-vs-");
  if (divider < 1) return null;
  const left = startSitPlayerByUrlSlug.get(slug.slice(0, divider));
  const right = startSitPlayerByUrlSlug.get(slug.slice(divider + 4));
  if (!left || !right || left.slug === right.slug) return null;
  const position = comparisonPosition(left.position, right.position);
  if (!position) return null;
  return {
    slug,
    leftSlug: left.slug,
    rightSlug: right.slug,
    position,
    selectionReason: position === "FLEX"
      ? "A custom FLEX decision using each player's recorded scoring, recent opportunity, opponent, and current-week availability."
      : `A custom ${position} decision using recorded scoring, recent opportunity, opponent, and current-week availability.`,
  } satisfies StartSitConfig;
}

export type StartSitSide = {
  slug: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
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

export type StartSitRanking = StartSitSide & { rank: number };

export function getStartSitDecisions(comparison: StartSitConfig, week = activeStartSitWeek): StartSitDecision[] {
  return startSitScoringFormats.flatMap((scoring) => {
    const left = getStartSitSide(comparison.leftSlug, week, scoring.receptionPoints);
    const right = getStartSitSide(comparison.rightSlug, week, scoring.receptionPoints);
    const winner = projectionWinner(left?.projection ?? null, right?.projection ?? null);
    return left && right && winner ? [{ scoring, left, right, winner }] : [];
  });
}

export function startSitPath(slug: string) {
  return `/who-should-i-start/${slug}`;
}

export function startSitPathForPlayers(leftSlug: string, rightSlug: string) {
  const reviewed = startSitComparisons.find((comparison) =>
    (comparison.leftSlug === leftSlug && comparison.rightSlug === rightSlug) ||
    (comparison.leftSlug === rightSlug && comparison.rightSlug === leftSlug),
  );
  if (reviewed) return startSitPath(reviewed.slug);
  const [left, right] = [leftSlug, rightSlug].sort();
  return startSitPath(`${startSitUrlPlayerSlug(left)}-vs-${startSitUrlPlayerSlug(right)}`);
}

export function getRelatedStartSitComparisons(comparison: StartSitConfig, limit = 6) {
  const playerSlugs = new Set([comparison.leftSlug, comparison.rightSlug]);
  return startSitComparisons
    .filter((candidate) => candidate.slug !== comparison.slug &&
      (playerSlugs.has(candidate.leftSlug) || playerSlugs.has(candidate.rightSlug)))
    .toSorted((left, right) => {
      const leftSamePosition = left.position === comparison.position ? 0 : 1;
      const rightSamePosition = right.position === comparison.position ? 0 : 1;
      return leftSamePosition - rightSamePosition || left.slug.localeCompare(right.slug);
    })
    .slice(0, limit);
}

export function getStartSitRankings({
  week = activeStartSitWeek,
  receptionPoints = 0.5,
  position,
}: {
  week?: number;
  receptionPoints?: 0 | 0.5 | 1;
  position?: StartSitConfig["position"];
} = {}): StartSitRanking[] {
  const eligiblePositions = position === "FLEX" ? new Set(["RB", "WR", "TE"]) : null;
  const sides = startSitPlayerOptions.flatMap((player) => {
    if (position && position !== "FLEX" && player.position !== position) return [];
    if (eligiblePositions && !eligiblePositions.has(player.position)) return [];
    const side = getStartSitSide(player.slug, week, receptionPoints);
    return side?.team && side.opponent ? [side] : [];
  }).sort((left, right) =>
    right.projection.median - left.projection.median ||
    right.projection.ceiling - left.projection.ceiling ||
    left.name.localeCompare(right.name),
  );
  return sides.map((side, index) => ({ ...side, rank: index + 1 }));
}

export function getStartSitSide(slug: string, week: number, receptionPoints: 0 | 0.5 | 1): StartSitSide | null {
  const player = nflversePlayerRelease.players[slug];
  const page = getPlayerPage(slug);
  const position = player?.roster?.position;
  if (!isFantasyPosition(position)) return null;
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
  return { slug, name: page.name, position, team: team?.abbr ?? null, opponent: opponent?.abbr ?? null, projection };
}

function isFantasyPosition(position: unknown): position is "QB" | "RB" | "WR" | "TE" {
  return position === "QB" || position === "RB" || position === "WR" || position === "TE";
}

function comparisonPosition(left: StartSitPlayerOption["position"], right: StartSitPlayerOption["position"]): StartSitConfig["position"] | null {
  if (left === right) return left;
  if (left !== "QB" && right !== "QB") return "FLEX";
  return null;
}

export function startSitUrlPlayerSlug(slug: string) {
  return slug.replace(/-(qb|rb|wr|te)$/, "");
}
