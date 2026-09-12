import { getPlayerMarketContexts, getPlayerProfile } from "../../../lib/market";
import { getPlayerPage, playerPageSlugs } from "../../../lib/player-pages";
import { selectPublishedHistory } from "../../../lib/player-insights";
import { getNflversePlayer, nflversePlayerRelease } from "../../../lib/nflverse";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return playerPageSlugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = getPlayerPage(slug);
  if (!page) return Response.json({ error: "Not found" }, { status: 404 });

  const [profile, contexts] = await Promise.all([
    getPlayerProfile(slug),
    getPlayerMarketContexts(slug),
  ]);
  const publishedHistory = selectPublishedHistory(
    profile.data.history,
    profile.snapshotHistory,
  );

  return Response.json(
    {
      schemaVersion: 1,
      methodology: "https://fantasytradetarget.com/methodology",
      player: profile.data,
      publishedHistory,
      fttSnapshotHistory: profile.snapshotHistory,
      nflPerformance: getNflversePlayer(slug),
      marketContexts: {
        dynastySuperflex: contexts.superflex ?? null,
        dynasty1Qb: contexts.oneQb ?? null,
        dynastySuperflexTep: contexts.tePremium ?? null,
        redraft1Qb: contexts.redraft ?? null,
      },
      source: profile.meta,
      nflverseSource: {
        releaseId: nflversePlayerRelease.releaseId,
        capturedAt: nflversePlayerRelease.capturedAt,
        license: nflversePlayerRelease.license,
      },
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${slug}-fantasy-trade-data.json"`,
        "Cache-Control": "public, max-age=21600, stale-while-revalidate=86400",
      },
    },
  );
}
