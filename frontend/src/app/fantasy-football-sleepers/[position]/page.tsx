import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WeeklySleepersPage from "../../components/WeeklySleepersPage";
import { getWeeklySleeperPosition, weeklySleeperPositions, weeklySleepersWeek } from "../../lib/weekly-sleepers";

type PageProps = { params: Promise<{ position: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return weeklySleeperPositions.map(({ slug }) => ({ position: slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = getWeeklySleeperPosition((await params).position);
  if (!config) return {};
  const path = `/fantasy-football-sleepers/${config.slug}`;
  return { title: `Week ${weeklySleepersWeek} Fantasy Football ${config.label} Sleepers`, description: `Week ${weeklySleepersWeek} fantasy football ${config.label.toLowerCase()} sleepers for PPR leagues, with projections, playing time, matchup and availability context.`, alternates: { canonical: path } };
}

export default async function FantasyFootballPositionSleepersPage({ params }: PageProps) {
  const config = getWeeklySleeperPosition((await params).position);
  if (!config) notFound();
  return <WeeklySleepersPage config={config} path={`/fantasy-football-sleepers/${config.slug}`} />;
}
