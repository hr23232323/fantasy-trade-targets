import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPoolWeekPage from "../../components/NflPoolWeekPage";
import { parsePredictionWeek, publishedPredictionWeeks, straightUpWeekPath } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Straight-Up Picks (2026)`, description: `Every NFL Week ${week} straight-up pick ranked by FTT win probability, with predicted scores, timestamped moneylines and matchup evidence.`, alternates: { canonical: straightUpWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPoolWeekPage week={week} mode="straight" />; }
