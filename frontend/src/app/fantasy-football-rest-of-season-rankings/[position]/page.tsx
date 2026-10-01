import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RestOfSeasonRankingsPage from "../../components/RestOfSeasonRankingsPage";
import { getRestOfSeasonPosition, restOfSeasonPositionConfigs } from "../../lib/rest-of-season";

type PageProps = { params: Promise<{ position: string }> };

export const dynamicParams = false;
export function generateStaticParams() { return restOfSeasonPositionConfigs.map(({ slug }) => ({ position: slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = getRestOfSeasonPosition((await params).position);
  if (!config) return {};
  const path = `/fantasy-football-rest-of-season-rankings/${config.slug}`;
  return {
    title: `Rest-of-Season Fantasy Football ${config.plural} Rankings (2026)`,
    description: `2026 rest-of-season fantasy football ${config.plural.toLowerCase()} rankings for PPR, Half PPR and Standard with current production, workload and remaining schedule.`,
    alternates: { canonical: path },
  };
}

export default async function FantasyFootballRestOfSeasonPositionPage({ params }: PageProps) {
  const config = getRestOfSeasonPosition((await params).position);
  if (!config) notFound();
  return <RestOfSeasonRankingsPage config={config} path={`/fantasy-football-rest-of-season-rankings/${config.slug}`} />;
}
