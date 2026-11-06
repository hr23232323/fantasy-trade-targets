import manifest from "../../../data/playoff-player-pages.json";
import { getPlayerPage } from "./player-pages";
import { getPlayoffPositionConfig, getPlayoffScheduleRatings, alternatePlayoffWeeks, primaryPlayoffWeeks, type PlayoffScheduleRating, type PlayoffScoringField } from "./playoff-schedule";
import { getRestOfSeasonRankingRows, type RestOfSeasonRankingRow } from "./rest-of-season";
import { canonicalTeamAbbr } from "./team-data";

export type PlayoffPlayerPageConfig = { slug: string };
export type PlayoffPlayerOutlook = {
  config: PlayoffPlayerPageConfig;
  player: RestOfSeasonRankingRow;
  page: NonNullable<ReturnType<typeof getPlayerPage>>;
  primary: PlayoffScheduleRating;
  alternate: PlayoffScheduleRating;
  ranks: Record<PlayoffScoringField, number>;
  alternateRank: number;
};

export const playoffPlayerPages = manifest as PlayoffPlayerPageConfig[];
export const playoffPlayerSlugs = playoffPlayerPages.map(({ slug }) => slug);

export function playoffPlayerPath(slug: string) {
  return `/fantasy-football-playoff-strength-of-schedule/players/${slug.replace(/-(qb|rb|wr|te)$/, "")}`;
}

export async function getPlayoffPlayerOutlooks(): Promise<PlayoffPlayerOutlook[]> {
  const players = await getRestOfSeasonRankingRows("ALL");
  const bySlug = new Map(players.map((player) => [player.slug, player]));
  const positionBoards = new Map<string, { primary: PlayoffScheduleRating[]; alternate: PlayoffScheduleRating[] }>();

  return playoffPlayerPages.flatMap((config) => {
    const player = bySlug.get(config.slug);
    const page = getPlayerPage(config.slug);
    if (!player || !page || !player.team) return [];
    const position = getPlayoffPositionConfig(({ QB: "quarterbacks", RB: "running-backs", WR: "wide-receivers", TE: "tight-ends" } as const)[player.position]);
    if (!position) return [];
    let boards = positionBoards.get(player.position);
    if (!boards) {
      boards = {
        primary: getPlayoffScheduleRatings(position, primaryPlayoffWeeks),
        alternate: getPlayoffScheduleRatings(position, alternatePlayoffWeeks),
      };
      positionBoards.set(player.position, boards);
    }
    const team = canonicalTeamAbbr(player.team);
    if (!team) return [];
    const primary = boards.primary.find((row) => row.team.abbr === team);
    const alternate = boards.alternate.find((row) => row.team.abbr === team);
    if (!primary || !alternate) return [];
    return [{
      config,
      player,
      page,
      primary,
      alternate,
      ranks: {
        ppr: rankFor(boards.primary, team, "ppr"),
        halfPpr: rankFor(boards.primary, team, "halfPpr"),
        standard: rankFor(boards.primary, team, "standard"),
      },
      alternateRank: rankFor(boards.alternate, team, "ppr"),
    }];
  });
}

export async function getPlayoffPlayerOutlook(slug: string) {
  return (await getPlayoffPlayerOutlooks()).find(({ config }) => config.slug === slug) ?? null;
}

function rankFor(rows: PlayoffScheduleRating[], team: string, field: PlayoffScoringField) {
  return [...rows]
    .sort((left, right) => right.averages[field] - left.averages[field] || left.team.name.localeCompare(right.team.name))
    .findIndex((row) => row.team.abbr === team) + 1;
}
