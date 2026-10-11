import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPoolWeekPage from "../../components/NflPoolWeekPage";
import { confidenceWeekPath, parsePredictionWeek, publishedPredictionWeeks } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Confidence Pool Picks & Rankings (2026)`, description: `NFL Week ${week} confidence pool picks ranked by win probability with descending point assignments, predicted scores and matchup evidence.`, alternates: { canonical: confidenceWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPoolWeekPage week={week} mode="confidence" />; }
