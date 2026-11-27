import type { Metadata } from "next";
import WeeklyRankingsPage from "../components/WeeklyRankingsPage";
import { getWeeklyRankingRows, weeklyRankingPositions, weeklyRankingsWeek } from "../lib/weekly-rankings";

const PATH = "/fantasy-football-rankings";
const config = weeklyRankingPositions.find((item) => item.position === "FLEX")!;
const leaders = getWeeklyRankingRows("FLEX")
  .toSorted((left, right) => right.projections.ppr.median - left.projections.ppr.median)
  .slice(0, 3)
  .map(({ name }) => name);

export const metadata: Metadata = {
  title: `Week ${weeklyRankingsWeek} Fantasy Football Rankings (PPR): Top Players`,
  description: `${leaders.join(", ")} lead our Week ${weeklyRankingsWeek} PPR fantasy football rankings. Compare every QB, RB, WR, TE and FLEX in PPR, Half PPR and Standard.`,
  alternates: { canonical: PATH },
};

export default function FantasyFootballRankingsPage() {
  return <WeeklyRankingsPage config={config} path={PATH} />;
}
