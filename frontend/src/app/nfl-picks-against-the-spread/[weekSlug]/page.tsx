import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPredictionWeekPage from "../../components/NflPredictionWeekPage";
import { atsWeekPath, parsePredictionWeek, publishedPredictionWeeks } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Picks Against the Spread (2026)`, description: `NFL Week ${week} picks against the spread ranked by the difference between the FTT projected margin and the timestamped market line.`, alternates: { canonical: atsWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPredictionWeekPage week={week} mode="ats" />; }
