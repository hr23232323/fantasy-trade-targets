import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WeeklyRankingsPage from "../../components/WeeklyRankingsPage";
import { getWeeklyRankingPosition, weeklyRankingPositions, weeklyRankingsWeek } from "../../lib/weekly-rankings";

type PageProps = { params: Promise<{ position: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return weeklyRankingPositions.filter((item) => item.position !== "FLEX").map((item) => ({ position: item.slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = getWeeklyRankingPosition((await params).position);
  if (!config || config.position === "FLEX") return {};
  const path = `/fantasy-football-rankings/${config.slug}`;
  return { title: `Week ${weeklyRankingsWeek} Fantasy Football ${config.plural} Rankings (PPR)`, description: `Week ${weeklyRankingsWeek} ${config.plural.toLowerCase()} rankings for PPR, Half PPR and Standard with projections, ranges, matchups and availability.`, alternates: { canonical: path } };
}

export default async function FantasyFootballPositionRankingsPage({ params }: PageProps) {
  const config = getWeeklyRankingPosition((await params).position);
  if (!config || config.position === "FLEX") notFound();
  return <WeeklyRankingsPage config={config} path={`/fantasy-football-rankings/${config.slug}`} />;
}
