import { getTradePlayerImage } from "./player-pages";
import { activeStartSitWeek, getStartSitRankings, startSitUrlPlayerSlug } from "./start-sit";
import type { WeeklyRankingRow } from "../components/WeeklyRankingsTable";

export const weeklyRankingPositions = [
  { slug: "quarterbacks", position: "QB", label: "Quarterback", plural: "Quarterbacks" },
  { slug: "running-backs", position: "RB", label: "Running back", plural: "Running Backs" },
  { slug: "wide-receivers", position: "WR", label: "Wide receiver", plural: "Wide Receivers" },
  { slug: "tight-ends", position: "TE", label: "Tight end", plural: "Tight Ends" },
  { slug: "flex", position: "FLEX", label: "FLEX", plural: "FLEX" },
] as const;

export type WeeklyRankingPosition = (typeof weeklyRankingPositions)[number];

export function getWeeklyRankingPosition(slug: string) {
  return weeklyRankingPositions.find((config) => config.slug === slug) ?? null;
}

export function getWeeklyRankingRows(position: WeeklyRankingPosition["position"]): WeeklyRankingRow[] {
  const standard = new Map(getStartSitRankings({ position, receptionPoints: 0 }).map((row) => [row.slug, row]));
  const halfPpr = new Map(getStartSitRankings({ position, receptionPoints: 0.5 }).map((row) => [row.slug, row]));
  const ppr = new Map(getStartSitRankings({ position, receptionPoints: 1 }).map((row) => [row.slug, row]));
  return [...ppr.values()].flatMap((row) => {
    const standardRow = standard.get(row.slug);
    const halfPprRow = halfPpr.get(row.slug);
    const image = getTradePlayerImage(row.slug);
    if (!standardRow || !halfPprRow || !image) return [];
    return [{
      slug: row.slug,
      urlSlug: startSitUrlPlayerSlug(row.slug),
      name: row.name,
      position: row.position,
      team: row.team,
      opponent: row.opponent,
      imageSrc: image.src,
      availability: row.projection.availability,
      projections: {
        standard: pickProjection(standardRow.projection),
        halfPpr: pickProjection(halfPprRow.projection),
        ppr: pickProjection(row.projection),
      },
    }];
  });
}

export const weeklyRankingsWeek = activeStartSitWeek;

function pickProjection(projection: { floor: number; median: number; ceiling: number }) {
  return { floor: projection.floor, median: projection.median, ceiling: projection.ceiling };
}
