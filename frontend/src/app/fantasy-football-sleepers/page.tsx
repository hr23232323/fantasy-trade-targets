import type { Metadata } from "next";
import WeeklySleepersPage from "../components/WeeklySleepersPage";
import { weeklySleepersWeek } from "../lib/weekly-sleepers";

const PATH = "/fantasy-football-sleepers";

export const metadata: Metadata = {
  title: `Week ${weeklySleepersWeek} Fantasy Football Sleepers: QB, RB, WR & TE`,
  description: `The best Week ${weeklySleepersWeek} fantasy football sleepers for PPR leagues, with projections, recent playing time, matchups and current availability.`,
  alternates: { canonical: PATH },
};

export default function FantasyFootballSleepersPage() { return <WeeklySleepersPage path={PATH} />; }
