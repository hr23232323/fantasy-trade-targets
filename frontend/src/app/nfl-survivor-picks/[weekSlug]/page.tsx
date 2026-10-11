import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NflPoolWeekPage from "../../components/NflPoolWeekPage";
import { parsePredictionWeek, publishedPredictionWeeks, survivorWeekPath } from "../../lib/nfl-predictions";
type Props = { params: Promise<{ weekSlug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return publishedPredictionWeeks.map((week) => ({ weekSlug: `week-${week}` })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const week = parsePredictionWeek((await params).weekSlug); if (!week) return {}; return { title: `NFL Week ${week} Survivor Picks & Win Probabilities (2026)`, description: `NFL Week ${week} survivor picks ranked by model win probability, with opponent, projected score, moneyline and pool-strategy context.`, alternates: { canonical: survivorWeekPath(week) } }; }
export default async function Page({ params }: Props) { const week = parsePredictionWeek((await params).weekSlug); if (!week) notFound(); return <NflPoolWeekPage week={week} mode="survivor" />; }
