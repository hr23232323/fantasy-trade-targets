import publicReleaseJson from "../../../data/public-release.json";
import {
  applyScoringContext,
  buildScoringProfile,
} from "./scoring-engine.mjs";
import type {
  MarketAsset,
  MarketFormat,
  MarketPayload,
  PassingTdPoints,
  PlayerScoringProfile,
  Position,
  ReceptionPoints,
} from "../types/MarketAsset";
import type {
  PlayerProfile,
  PlayerProfilePayload,
  PlayerSnapshotObservation,
} from "../types/PlayerProfile";

type MarketSettings = {
  format?: MarketFormat;
  numQbs?: 1 | 2;
  tep?: boolean;
  numTeams?: number;
  passingTdPoints?: PassingTdPoints;
  receptionPoints?: ReceptionPoints;
};

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
  data: T;
  meta: {
    version?: string;
    generatedAt: string;
    sources?: string[];
    attribution?: string;
    docs?: string;
  };
};

type PublicRelease = {
  schemaVersion: number;
  methodologyVersion: string;
  releaseId: string;
  capturedAt: string;
  source: {
    name: string;
    docs: string;
    attribution: string;
  };
  playerMarkets: Record<string, TradyrResponse<TradyrPlayer[]>>;
  pickMarkets: Record<string, TradyrResponse<TradyrPick[]>>;
  playerProfiles: Record<string, TradyrResponse<PlayerProfile>>;
  playerScoringProfiles?: Record<string, PlayerScoringProfile>;
  playerSnapshotHistory: Record<string, PlayerSnapshotObservation[]>;
};

const publicRelease = publicReleaseJson as unknown as PublicRelease;
const fallbackScoringProfiles = Object.fromEntries(
  Object.entries(publicRelease.playerProfiles).flatMap(([slug, payload]) => {
    const profile = buildScoringProfile({
      stats: payload.data.stats,
      career: payload.data.career,
    });
    return profile ? [[slug, profile]] : [];
  }),
) as Record<string, PlayerScoringProfile>;
const playerScoringProfiles =
  publicRelease.playerScoringProfiles ?? fallbackScoringProfiles;

export function getMarketReleaseInfo() {
  return {
    schemaVersion: publicRelease.schemaVersion,
    methodologyVersion: publicRelease.methodologyVersion,
    releaseId: publicRelease.releaseId,
    capturedAt: publicRelease.capturedAt,
    source: { ...publicRelease.source },
  };
}

export function getPlayerSnapshotHistory() {
  return publicRelease.playerSnapshotHistory;
}

function normalizeTeamCount(value: number) {
  return [8, 10, 12, 14, 16].includes(value) ? value : 12;
}

export async function getMarket(
  settings: MarketSettings = {},
): Promise<MarketPayload> {
  const format = settings.format ?? "dynasty";
  const numQbs = settings.numQbs ?? 2;
  const tep = settings.tep ?? false;
  const numTeams = normalizeTeamCount(settings.numTeams ?? 12);
  const passingTdPoints = settings.passingTdPoints === 6 ? 6 : 4;
  const receptionPoints = [0, 0.5, 1].includes(
    Number(settings.receptionPoints),
  )
    ? (Number(settings.receptionPoints) as ReceptionPoints)
    : 1;
  const playerKey = `${format}:${numQbs}:${tep ? 1 : 0}`;
  const playersResponse = publicRelease.playerMarkets[playerKey];
  const picksResponse =
    format === "dynasty"
      ? publicRelease.pickMarkets[`${numQbs}:${numTeams}`]
      : undefined;

  if (!playersResponse) {
    throw new Error(`Public release is missing player market ${playerKey}`);
  }
  if (format === "dynasty" && !picksResponse) {
    throw new Error(`Public release is missing pick market ${numQbs}:${numTeams}`);
  }

  const basePlayers: MarketAsset[] = playersResponse.data.map((player) => ({
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
  const scoringMarket = applyScoringContext(
    basePlayers,
    playerScoringProfiles,
    {
      format,
      numQbs,
      numTeams,
      passingTdPoints,
      receptionPoints,
    },
  );

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

  const assets = [...scoringMarket.assets, ...picks].sort(
    (a, b) => b.value - a.value,
  );

  return {
    assets,
    meta: {
      generatedAt: playersResponse.meta.generatedAt,
      format,
      numQbs,
      tep,
      numTeams,
      attribution: publicRelease.source.attribution,
      sourceUrl: "https://tradyr.app",
      assetCount: assets.length,
      releaseId: publicRelease.releaseId,
      methodologyVersion: publicRelease.methodologyVersion,
      scoring: scoringMarket.meta,
    },
  };
}

export async function getPlayerProfile(
  slug: string,
): Promise<PlayerProfilePayload> {
  const response = publicRelease.playerProfiles[slug];
  if (!response) throw new Error(`Public release is missing player profile ${slug}`);

  return {
    data: {
      ...response.data,
      id: response.data.slug,
      kind: "player",
      value: response.data.composite ?? response.data.value,
      history: response.data.history ?? [],
      similar: (response.data.similar ?? []).map((player) => ({
        ...player,
        id: player.slug,
        kind: "player" as const,
        value: player.composite ?? player.value,
      })),
    },
    snapshotHistory: publicRelease.playerSnapshotHistory[slug] ?? [],
    meta: {
      version: response.meta.version ?? publicRelease.methodologyVersion,
      generatedAt: response.meta.generatedAt,
      sources: response.meta.sources,
      attribution:
        response.meta.attribution ?? "Powered by Tradyr, https://tradyr.app",
      docs: response.meta.docs ?? publicRelease.source.docs,
      releaseId: publicRelease.releaseId,
    },
  };
}

export async function getPlayerMarketContexts(slug: string) {
  const [superflex, oneQb, tePremium, redraft] = await Promise.all([
    getMarket({ format: "dynasty", numQbs: 2, tep: false }),
    getMarket({ format: "dynasty", numQbs: 1, tep: false }),
    getMarket({ format: "dynasty", numQbs: 2, tep: true }),
    getMarket({ format: "redraft", numQbs: 1, tep: false }),
  ]);

  const find = (market: MarketPayload) =>
    market.assets.find((asset) => asset.slug === slug);

  return {
    superflex: find(superflex),
    oneQb: find(oneQb),
    tePremium: find(tePremium),
    redraft: find(redraft),
    picks: superflex.assets.filter((asset) => asset.kind === "pick"),
    generatedAt: superflex.meta.generatedAt,
  };
}
