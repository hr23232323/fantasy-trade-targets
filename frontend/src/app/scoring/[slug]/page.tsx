import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScoringResearchPage from "../../components/ScoringResearchPage";
import { buildPageMetadata } from "../../lib/metadata";
import {
  getScoringResearchPage,
  scoringResearchPageSlugs,
} from "../../lib/scoring-research-pages";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return scoringResearchPageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getScoringResearchPage(slug);
  if (!page) return {};

  return buildPageMetadata({
    title: page.metadataTitle,
    description: page.metadataDescription,
    path: `/scoring/${page.slug}`,
  });
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const page = getScoringResearchPage(slug);
  if (!page) notFound();

  return <ScoringResearchPage config={page} />;
}
