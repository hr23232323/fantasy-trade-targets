import type { Metadata } from "next";
import RestOfSeasonRankingsPage from "../components/RestOfSeasonRankingsPage";

const PATH = "/fantasy-football-rest-of-season-rankings";

export const metadata: Metadata = {
  title: "Rest-of-Season Fantasy Football Rankings (2026)",
  description: "2026 rest-of-season fantasy football rankings for PPR, Half PPR and Standard using current value, production, workload and remaining schedule.",
  alternates: { canonical: PATH },
};

export default function FantasyFootballRestOfSeasonRankingsPage() {
  return <RestOfSeasonRankingsPage config={null} path={PATH} />;
}
