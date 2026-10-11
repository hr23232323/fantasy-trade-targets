import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPoolWeekPage from "../../components/NflPoolWeekPage";
import { parsePredictionWeek, publishedPredictionWeeks, scorePredictionsWeekPath } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Score Predictions for Every Game (2026)`, description: `Projected final scores for every NFL Week ${week} game, with expected margin, total, win pick and timestamped market context.`, alternates: { canonical: scorePredictionsWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPoolWeekPage week={week} mode="scores" />; }
