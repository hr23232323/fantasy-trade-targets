import { getMarket } from "../../../lib/market";
import { getTeamAssets, getTeamBySlug, teamRelease, teamSlugs } from "../../../lib/team-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return teamSlugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) return Response.json({ error: "Team not found" }, { status: 404 });

  const market = await getMarket({ format: "dynasty", numQbs: 2 });
  const players = getTeamAssets(team, market.assets).map((player) => ({
    slug: player.slug,
    name: player.name,
    position: player.position,
    age: player.age ?? null,
    value: player.value,
    overallRank: player.rank ?? null,
    positionRank: player.posRank ?? null,
  }));

  return Response.json(
    {
      schemaVersion: 1,
      releaseId: teamRelease.releaseId,
      modelVersion: teamRelease.modelVersion,
      capturedAt: teamRelease.capturedAt,
      marketReleaseId: market.meta.releaseId,
      marketCapturedAt: market.meta.generatedAt,
      season: teamRelease.season,
      baselineSeason: teamRelease.baselineSeason,
      team,
      players,
      sources: teamRelease.sources,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="${team.slug}-fantasy-data.json"`,
      },
    },
  );
}
