import type { Metadata } from "next";
import NflPoolWeekPage from "../components/NflPoolWeekPage";
import { confidenceHubPath, currentPredictionWeek } from "../lib/nfl-predictions";

const PATH = confidenceHubPath();

export const metadata: Metadata = {
  title: `NFL Confidence Pool Picks This Week: Week ${currentPredictionWeek} (2026)`,
  description: `NFL Week ${currentPredictionWeek} confidence pool picks ranked by win probability, with descending point assignments, predicted scores and matchup evidence.`,
  alternates: { canonical: PATH },
};

export default function NflConfidencePoolPicksPage() {
  return <NflPoolWeekPage week={currentPredictionWeek} mode="confidence" pathOverride={PATH} />;
}
