import {
  getMarket,
  getMarketReleaseInfo,
  getPlayerSnapshotHistory,
} from "../../lib/market";

export const dynamic = "force-static";

export async function GET() {
  const [dynastySuperflex, dynasty1Qb, dynastySuperflexTep, redraft1Qb] =
    await Promise.all([
      getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 }),
      getMarket({ format: "dynasty", numQbs: 1, numTeams: 12 }),
      getMarket({ format: "dynasty", numQbs: 2, tep: true, numTeams: 12 }),
      getMarket({ format: "redraft", numQbs: 1, numTeams: 12 }),
    ]);
  const release = getMarketReleaseInfo();

  return Response.json(
    {
      schemaVersion: 1,
      release,
      methodology: "https://fantasytradetarget.com/methodology",
      markets: {
        dynastySuperflex,
        dynasty1Qb,
        dynastySuperflexTep,
        redraft1Qb,
      },
      playerSnapshotHistory: getPlayerSnapshotHistory(),
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=21600, stale-while-revalidate=86400",
        "Content-Disposition":
          'attachment; filename="fantasy-trade-target-market-data.json"',
      },
    },
  );
}
