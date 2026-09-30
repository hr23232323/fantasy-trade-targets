import type { Metadata } from "next";
import WeeklyRankingsPage from "../components/WeeklyRankingsPage";
import { weeklyRankingPositions, weeklyRankingsWeek } from "../lib/weekly-rankings";

const PATH = "/fantasy-football-rankings";
const config = weeklyRankingPositions.find((item) => item.position === "FLEX")!;

export const metadata: Metadata = {
  title: `Week ${weeklyRankingsWeek} Fantasy Football Rankings: PPR, Half PPR & Standard`,
  description: `Week ${weeklyRankingsWeek} fantasy football FLEX rankings with PPR, Half PPR and Standard projections, floors, ceilings, matchups and current availability.`,
  alternates: { canonical: PATH },
};

export default function FantasyFootballRankingsPage() {
  return <WeeklyRankingsPage config={config} path={PATH} />;
}
