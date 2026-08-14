import {
  getRookiePickPage,
  getRookiePickResearch,
  rookiePickSlugs,
} from "../../../lib/rookie-picks";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return rookiePickSlugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = getRookiePickPage(slug);
  if (!page) return Response.json({ error: "Not found" }, { status: 404 });
  const research = await getRookiePickResearch(page);

  return Response.json(
    {
      schemaVersion: 1,
      methodology: "https://fantasytradetarget.com/methodology#rookie-pick-values",
      pick: {
        id: page.id,
        name: research.name,
        year: research.superflexPick.year,
        round: research.superflexPick.round,
        slot: research.superflexPick.slot,
        tier: research.superflexPick.tier,
      },
      current12TeamValues: {
        oneQb: research.oneQbPick.value,
        superflex: research.superflexPick.value,
        oneQbAllAssetRank: research.oneQbMarketRank,
        superflexAllAssetRank: research.superflexMarketRank,
      },
      leagueSizeValues: research.leagueSizes.map((row) => ({
        numTeams: row.numTeams,
        oneQb: row.oneQb?.value ?? null,
        superflex: row.superflex?.value ?? null,
      })),
      reviewedPlayerEquivalents: {
        oneQb: research.oneQbPlayerEquivalents,
        superflex: research.superflexPlayerEquivalents,
      },
      adjacentPickValues: research.adjacent,
      nearestCrossYearPicks: research.crossYear,
      history12Team: research.history,
      source: {
        releaseId: research.releaseId,
        generatedAt: research.generatedAt,
        attribution: "Powered by Tradyr",
      },
      boundary:
        "Market price for the unresolved draft slot; not a prospect ranking, player projection, or guaranteed accepted trade.",
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${slug}-dynasty-rookie-pick-data.json"`,
        "Cache-Control": "public, max-age=21600, stale-while-revalidate=86400",
      },
    },
  );
}
