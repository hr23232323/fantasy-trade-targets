import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPredictionWeekPage from "../../components/NflPredictionWeekPage";
import { parsePredictionWeek, publishedPredictionWeeks, totalsWeekPath } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Over/Under Picks and Predictions (2026)`, description: `NFL Week ${week} over/under picks ranked by the difference between the FTT projected score total and the timestamped market total.`, alternates: { canonical: totalsWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPredictionWeekPage week={week} mode="totals" />; }
