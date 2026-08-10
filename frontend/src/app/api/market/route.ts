import { NextRequest, NextResponse } from "next/server";
import { getMarket } from "../../lib/market";
import type {
  MarketFormat,
  PassingTdPoints,
  ReceptionPoints,
} from "../../types/MarketAsset";

export const runtime = "nodejs";
export const revalidate = 21600;

const ALLOWED_TEAM_COUNTS = new Set([8, 10, 12, 14, 16]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format: MarketFormat =
    searchParams.get("format") === "redraft" ? "redraft" : "dynasty";
  const numQbs: 1 | 2 = searchParams.get("numQbs") === "1" ? 1 : 2;
  const tep = searchParams.get("tep") === "true";
  const requestedTeams = Number(searchParams.get("numTeams") || 12);
  const numTeams = ALLOWED_TEAM_COUNTS.has(requestedTeams) ? requestedTeams : 12;
  const passingTdPoints: PassingTdPoints =
    searchParams.get("passingTdPoints") === "6" ? 6 : 4;
  const requestedReceptionPoints = Number(
    searchParams.get("receptionPoints") ?? 1,
  );
  const receptionPoints: ReceptionPoints = [0, 0.5, 1].includes(
    requestedReceptionPoints,
  )
    ? (requestedReceptionPoints as ReceptionPoints)
    : 1;

  try {
    const payload = await getMarket({
      format,
      numQbs,
      tep,
      numTeams,
      passingTdPoints,
      receptionPoints,
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Market data fetch failed", error);
    return NextResponse.json(
      {
        error: "Market data is temporarily unavailable.",
        retryable: true,
      },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
}
