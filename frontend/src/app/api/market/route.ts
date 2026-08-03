import { NextRequest, NextResponse } from "next/server";
import type {
  MarketAsset,
  MarketFormat,
  MarketPayload,
  Position,
} from "../../types/MarketAsset";

export const runtime = "nodejs";
export const revalidate = 21600;

const TRADYR_API = "https://api.tradyr.app/v1";
const ALLOWED_TEAM_COUNTS = new Set([8, 10, 12, 14, 16]);

type TradyrPlayer = {
  slug: string;
  name: string;
  position: Position;
  team?: string;
  age?: number;
  composite: number;
  confidence?: number;
  rank?: number;
  posRank?: number;
  sleeperId?: string;
};

type TradyrPick = {
  id: string;
  name: string;
  position: "PICK";
  composite: number;
  round: number;
  slot: number;
  year: string;
  tier: "early" | "mid" | "late";
};

type TradyrResponse<T> = {
  data: T[];
  meta: {
    generatedAt: string;
    attribution?: string;
  };
};

function upstreamHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent": "FantasyTradeTarget/1.0 (+https://www.fantasytradetarget.com)",
  };

  if (process.env.TRADYR_API_KEY) {
    headers.Authorization = `Bearer ${process.env.TRADYR_API_KEY}`;
  }

  return headers;
}

async function fetchTradyr<T>(url: string): Promise<TradyrResponse<T>> {
  const response = await fetch(url, {
    headers: upstreamHeaders(),
    next: { revalidate: 21600 },
  });

  if (!response.ok) {
    throw new Error(`Tradyr returned ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format: MarketFormat =
    searchParams.get("format") === "redraft" ? "redraft" : "dynasty";
  const numQbs: 1 | 2 = searchParams.get("numQbs") === "1" ? 1 : 2;
  const tep = searchParams.get("tep") === "true";
  const requestedTeams = Number(searchParams.get("numTeams") || 12);
  const numTeams = ALLOWED_TEAM_COUNTS.has(requestedTeams) ? requestedTeams : 12;

  const playerUrl = new URL(`${TRADYR_API}/players`);
  playerUrl.searchParams.set("format", format);
  playerUrl.searchParams.set("numQbs", String(numQbs));
  playerUrl.searchParams.set("tep", String(tep));
  playerUrl.searchParams.set("limit", "1000");

  try {
    const [playersResponse, picksResponse] = await Promise.all([
      fetchTradyr<TradyrPlayer>(playerUrl.toString()),
      format === "dynasty"
        ? fetchTradyr<TradyrPick>(
            `${TRADYR_API}/picks?numQbs=${numQbs}&numTeams=${numTeams}`,
          )
        : Promise.resolve(null),
    ]);

    const players: MarketAsset[] = playersResponse.data.map((player) => ({
      id: player.slug,
      slug: player.slug,
      name: player.name,
      position: player.position,
      kind: "player",
      value: player.composite,
      team: player.team,
      age: player.age,
      rank: player.rank,
      posRank: player.posRank,
      confidence: player.confidence,
      sleeperId: player.sleeperId,
    }));

    const picks: MarketAsset[] = (picksResponse?.data || []).map((pick) => ({
      id: pick.id,
      slug: pick.id,
      name: pick.name,
      position: "PICK",
      kind: "pick",
      value: pick.composite,
      year: pick.year,
      round: pick.round,
      slot: pick.slot,
      tier: pick.tier,
    }));

    const assets = [...players, ...picks].sort((a, b) => b.value - a.value);
    const payload: MarketPayload = {
      assets,
      meta: {
        generatedAt: playersResponse.meta.generatedAt,
        format,
        numQbs,
        tep,
        numTeams,
        attribution: "Powered by Tradyr",
        sourceUrl: "https://tradyr.app",
        assetCount: assets.length,
      },
    };

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
