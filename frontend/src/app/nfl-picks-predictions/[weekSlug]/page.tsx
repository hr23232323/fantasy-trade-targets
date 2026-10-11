import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPredictionWeekPage from "../../components/NflPredictionWeekPage";
import { parsePredictionWeek, predictionWeekPath, publishedPredictionWeeks } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Picks and Predictions (2026)`, description: `NFL Week ${week} picks, score predictions, win probabilities, spread leans and over/under analysis with timestamped market lines.`, alternates: { canonical: predictionWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPredictionWeekPage week={week} mode="all" />; }
