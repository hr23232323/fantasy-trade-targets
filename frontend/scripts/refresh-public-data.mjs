import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import {
  buildScoringProfile,
  SCORING_MODEL_VERSION,
  SCORING_PROFILE_VERSION,
} from "../src/app/lib/scoring-engine.mjs";
import {
  DEFAULT_SCORING_PROFILE_BATCH_SIZE,
  nextScoringRefreshCursor,
  selectScoringProfileCohort,
  usableScoringProfiles,
} from "../src/app/lib/scoring-publication.mjs";
import {
  buildRookiePickHistory,
  validateRookiePickHistory,
} from "../src/app/lib/rookie-pick-history.mjs";

const API_BASE = "https://api.tradyr.app/v1";
const formats = ["dynasty", "redraft"];
const quarterbackSettings = [1, 2];
const tepSettings = [false, true];
const teamCounts = [8, 10, 12, 14, 16];
const playerPositions = new Set(["QB", "RB", "WR", "TE"]);
const nflTeams = new Set(["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"]);
const MAX_MARKET_AGE_MS = 48 * 60 * 60 * 1_000;
let capturedAt = new Date();
const hasApiKey = Boolean(process.env.TRADYR_API_KEY);
const requestIntervalMs = hasApiKey ? 75 : 1_100;
const requestTimeoutMs = Math.max(
  15_000,
  Math.min(60_000, Number(process.env.TRADYR_REQUEST_TIMEOUT_MS) || 45_000),
);
const scoringProfileConcurrency = Math.max(
  1,
  Math.min(
    16,
    Number(process.env.SCORING_PROFILE_CONCURRENCY) || 8,
  ),
);
const scoringProfileBatchSize = Math.max(
  50,
  Math.min(
    500,
    Number(process.env.SCORING_PROFILE_BATCH_SIZE) ||
      DEFAULT_SCORING_PROFILE_BATCH_SIZE,
  ),
);
let nextRequestAt = 0;
let releaseId = `ftt-${capturedAt
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}/, "")}`;
const currentPath = path.resolve("data/public-release.json");
const snapshotHistoryPath = path.resolve(
  "..",
  "data",
  "player-snapshot-history.json",
);
const rookiePickHistoryPath = path.resolve("data", "rookie-pick-history.json");

const playerPageManifest = JSON.parse(
  await readFile(path.resolve("data/player-pages.json"), "utf8"),
);
const playerSlugs = playerPageManifest.map((player) => player.slug);
const [priorRelease, priorSnapshotHistory, priorRookiePickHistory] = await Promise.all([
  readJsonIfPresent(currentPath),
  readJsonIfPresent(snapshotHistoryPath),
  readJsonIfPresent(rookiePickHistoryPath),
]);
const reuseValidatedMarkets =
  process.env.REUSE_VALIDATED_MARKETS === "true" &&
  priorRelease?.playerMarkets &&
  priorRelease?.pickMarkets;
if (reuseValidatedMarkets) {
  capturedAt = new Date(priorRelease.capturedAt);
  releaseId = priorRelease.releaseId;
}
const refreshReviewedPlayerProfiles =
  process.env.REFRESH_REVIEWED_PLAYER_PROFILES !== "false" ||
  Object.keys(priorRelease?.playerProfiles ?? {}).length !== playerSlugs.length;

const headers = {
  Accept: "application/json",
  "User-Agent": "FantasyTradeTargetData/1.0 (+https://fantasytradetarget.com)",
  ...(process.env.TRADYR_API_KEY
    ? { Authorization: `Bearer ${process.env.TRADYR_API_KEY}` }
    : {}),
};

const playerRequests = formats.flatMap((format) =>
  quarterbackSettings.flatMap((numQbs) =>
    tepSettings.map((tep) => ({
      key: `${format}:${numQbs}:${tep ? 1 : 0}`,
      url: `${API_BASE}/players?format=${format}&numQbs=${numQbs}&tep=${tep}&limit=1000`,
      kind: "players",
    })),
  ),
);
const pickRequests = quarterbackSettings.flatMap((numQbs) =>
  teamCounts.map((numTeams) => ({
    key: `${numQbs}:${numTeams}`,
    url: `${API_BASE}/picks?numQbs=${numQbs}&numTeams=${numTeams}`,
    kind: "picks",
  })),
);
const refreshMissingPlayerProfilesOnly =
  process.env.REFRESH_MISSING_PLAYER_PROFILES_ONLY === "true";
const profileRequests = playerSlugs
  .filter(
    (slug) =>
      !refreshMissingPlayerProfilesOnly ||
      !priorRelease?.playerProfiles?.[slug],
  )
  .map((slug) => ({
  key: slug,
  url: `${API_BASE}/players/${encodeURIComponent(slug)}`,
  kind: "profile",
  }));

const marketAndPickResponses = reuseValidatedMarkets
  ? []
  : await mapConcurrent(
      [...playerRequests, ...pickRequests],
      hasApiKey ? 8 : 4,
      async (request) => ({ ...request, payload: await fetchJson(request.url) }),
    );
const playerMarkets = reuseValidatedMarkets
  ? Object.fromEntries(
      Object.entries(priorRelease.playerMarkets).map(([key, payload]) => [
        key,
        normalizePlayerMarketPayload(payload),
      ]),
    )
  : Object.fromEntries(
      marketAndPickResponses
        .filter((response) => response.kind === "players")
        .map((response) => [response.key, normalizePlayerMarketPayload(response.payload)]),
    );
const pickMarkets = reuseValidatedMarkets
  ? priorRelease.pickMarkets
  : Object.fromEntries(
      marketAndPickResponses
        .filter((response) => response.kind === "picks")
        .map((response) => [response.key, response.payload]),
    );
if (reuseValidatedMarkets) {
  console.log(
    `Reusing validated market release ${releaseId} for scoring-only publication.`,
  );
}
const currentPlayersBySlug = new Map(
  playerMarkets["dynasty:2:0"].data.map((player) => [player.slug, player]),
);
const currentPlayers = [...currentPlayersBySlug.values()];
const currentPlayerSlugs = currentPlayers.map((player) => player.slug);
const carriedScoringProfiles = usableScoringProfiles(
  priorRelease?.playerScoringProfiles,
  currentPlayerSlugs,
);
const preserveValidatedScoringProfiles =
  process.env.PRESERVE_VALIDATED_SCORING_PROFILES === "true" &&
  reuseValidatedMarkets &&
  Object.keys(carriedScoringProfiles).length >= 150;
const priorRefreshCursor =
  priorRelease?.scoringProfilePublication?.nextRefreshCursor ?? 0;
const scoringCohort = preserveValidatedScoringProfiles
  ? []
  : selectScoringProfileCohort({
      players: currentPlayers,
      existingProfiles: carriedScoringProfiles,
      prioritySlugs: playerSlugs,
      batchSize: scoringProfileBatchSize,
      refreshCursor: priorRefreshCursor,
    });
console.log(
  `Scoring profiles: ${hasApiKey ? "authenticated" : "anonymous"} publication, carrying ${Object.keys(carriedScoringProfiles).length}, ${preserveValidatedScoringProfiles ? "preserving the validated cohort" : `refreshing ${scoringCohort.length}/${currentPlayers.length} with concurrency ${scoringProfileConcurrency}`}.`,
);
const scoringHealthPlayer =
  currentPlayersBySlug.get("josh-allen-qb") ?? scoringCohort[0];
const scoringHealthPayload = scoringHealthPlayer
  ? await fetchOptionalJson(
      `${API_BASE}/players/${encodeURIComponent(scoringHealthPlayer.slug)}/stats`,
      { attempts: 1 },
    )
  : null;
const scoringHealthProfile = buildScoringProfile(scoringHealthPayload?.data);
if (scoringHealthPlayer && !scoringHealthProfile) {
  if (Object.keys(carriedScoringProfiles).length < 150) {
    throw new Error(
      `Tradyr scoring stats are unavailable or unusable for ${scoringHealthPlayer.slug}, and only ${Object.keys(carriedScoringProfiles).length} validated scoring profiles can be carried; preserving the prior release`,
    );
  }
  console.warn(
    `Tradyr scoring stats are unavailable or unusable for ${scoringHealthPlayer.slug}; publishing fresh markets while carrying ${Object.keys(carriedScoringProfiles).length} validated scoring profiles.`,
  );
}
if (scoringHealthPlayer && scoringHealthProfile) {
  console.log(`Verified scoring stats availability with ${scoringHealthPlayer.slug}.`);
}
const scoringRefreshCohort = scoringHealthPlayer && !scoringHealthProfile
  ? []
  : scoringCohort;
const scoringHealthWasRequested = scoringRefreshCohort.some(
  (player) => player.slug === scoringHealthPlayer?.slug,
);
const remainingScoringCohort = scoringRefreshCohort.filter(
  (player) => player.slug !== scoringHealthPlayer?.slug,
);
const remainingScoringStatsResponses = await mapConcurrent(
  remainingScoringCohort,
  scoringProfileConcurrency,
  async (player, index) => {
    const payload = await fetchOptionalJson(
      `${API_BASE}/players/${encodeURIComponent(player.slug)}/stats`,
      { attempts: 2 },
    );
    const completed = index + 1 + (scoringHealthWasRequested ? 1 : 0);
    if (completed % 25 === 0 || completed === scoringRefreshCohort.length) {
      console.log(
        `Fetched scoring stats ${completed}/${scoringRefreshCohort.length}`,
      );
    }
    return { slug: player.slug, payload };
  },
);
const scoringStatsResponses = scoringHealthPlayer && scoringHealthWasRequested
  ? [
      { slug: scoringHealthPlayer.slug, payload: scoringHealthPayload },
      ...remainingScoringStatsResponses,
    ]
  : remainingScoringStatsResponses;
const scoringStatsBySlug = new Map(
  scoringStatsResponses.map((response) => [response.slug, response.payload]),
);
const profileResponses = refreshReviewedPlayerProfiles
  ? await mapConcurrent(
      profileRequests,
      2,
      async (request, index) => {
        const payload = await fetchPlayerProfile(
          request.url,
          scoringStatsBySlug.get(request.key),
        );
        console.log(
          `Fetched player profile ${index + 1}/${profileRequests.length}: ${request.key}`,
        );
        return { ...request, payload };
      },
    )
  : [];
const rawPlayerProfiles = refreshReviewedPlayerProfiles
  ? {
      ...(refreshMissingPlayerProfilesOnly
        ? priorRelease?.playerProfiles ?? {}
        : {}),
      ...Object.fromEntries(
        profileResponses.map((response) => [response.key, response.payload]),
      ),
    }
  : priorRelease.playerProfiles;
if (!refreshReviewedPlayerProfiles) {
  console.log(`Reusing ${playerSlugs.length} reviewed player profiles for scoring-only publication.`);
}
const playerProfiles = Object.fromEntries(
  Object.entries(rawPlayerProfiles).map(([slug, payload]) => [
    slug,
    normalizeProfileToMarket(
      preserveValidatedProfileEvidence(
        payload,
        priorRelease?.playerProfiles?.[slug],
      ),
      currentPlayersBySlug,
    ),
  ]),
);
const refreshedScoringProfiles = Object.fromEntries(
  scoringStatsResponses.flatMap(({ slug, payload }) => {
    const profile = buildScoringProfile(payload?.data);
    return profile ? [[slug, profile]] : [];
  }),
);
const successfulScoringResponseCount = scoringStatsResponses.filter(
  ({ payload }) => Boolean(payload),
).length;
const unavailableScoringProfileCount = scoringStatsResponses.filter(
  ({ payload, slug }) => Boolean(payload) && !refreshedScoringProfiles[slug],
).length;
const failedScoringRequestCount =
  scoringStatsResponses.length - successfulScoringResponseCount;
const reviewedScoringProfiles = Object.fromEntries(
  Object.entries(rawPlayerProfiles).flatMap(([slug, payload]) => {
    const profile = buildScoringProfile({
      stats: payload?.data?.stats,
      career: payload?.data?.career,
    });
    return profile ? [[slug, profile]] : [];
  }),
);
const playerScoringProfiles = usableScoringProfiles(
  {
    ...carriedScoringProfiles,
    ...reviewedScoringProfiles,
    ...refreshedScoringProfiles,
  },
  currentPlayerSlugs,
);
const scoringProfilePublication = preserveValidatedScoringProfiles
  ? {
      ...priorRelease.scoringProfilePublication,
      modelVersion: SCORING_PROFILE_VERSION,
      profileCount: Object.keys(playerScoringProfiles).length,
      playerCount: currentPlayers.length,
    }
  : {
      modelVersion: SCORING_PROFILE_VERSION,
      profileCount: Object.keys(playerScoringProfiles).length,
      playerCount: currentPlayers.length,
      refreshedCount: Object.keys(refreshedScoringProfiles).length,
      requestedCount: scoringRefreshCohort.length,
      successfulResponseCount: successfulScoringResponseCount,
      unavailableCount: unavailableScoringProfileCount,
      failedRequestCount: failedScoringRequestCount,
      sourceStatus: scoringHealthPlayer && !scoringHealthProfile
        ? "temporarily_unavailable"
        : "available",
      lastAttemptedAt: new Date().toISOString(),
      nextRefreshCursor: nextScoringRefreshCursor({
        players: currentPlayers,
        cohort: scoringRefreshCohort,
        refreshCursor: priorRefreshCursor,
      }),
    };
const playerSnapshotHistory = buildPlayerSnapshotHistory({
  existing: priorSnapshotHistory?.players,
  releases: [
    priorRelease,
    {
      releaseId,
      capturedAt: capturedAt.toISOString(),
      playerMarkets,
    },
  ],
  playerSlugs,
});
const rookiePickHistory = buildRookiePickHistory({
  existing: priorRookiePickHistory?.picks,
  releases: [
    priorRelease,
    {
      releaseId,
      capturedAt: capturedAt.toISOString(),
      pickMarkets,
    },
  ],
});
validateRookiePickHistory({
  histories: rookiePickHistory,
  release: { releaseId, pickMarkets },
});

validateRelease({
  playerMarkets,
  pickMarkets,
  playerProfiles,
  playerScoringProfiles,
  priorScoringProfileCount: Object.keys(carriedScoringProfiles).length,
  priorPlayerMarkets: priorRelease?.playerMarkets,
  playerSnapshotHistory,
});

const release = {
  schemaVersion: 3,
  methodologyVersion: SCORING_MODEL_VERSION,
  releaseId,
  capturedAt: capturedAt.toISOString(),
  source: {
    name: "Tradyr public API",
    docs: "https://api.tradyr.app/docs",
    attribution: "Powered by Tradyr",
  },
  playerMarkets,
  pickMarkets,
  playerProfiles,
  playerScoringProfiles,
  scoringProfilePublication,
  playerSnapshotHistory,
};

const temporaryPath = `${currentPath}.tmp`;
const snapshotHistoryTemporaryPath = `${snapshotHistoryPath}.tmp`;
const rookiePickHistoryTemporaryPath = `${rookiePickHistoryPath}.tmp`;
await mkdir(path.dirname(currentPath), { recursive: true });
await mkdir(path.dirname(snapshotHistoryPath), { recursive: true });
await mkdir(path.dirname(rookiePickHistoryPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(release)}\n`);
await writeFile(
  snapshotHistoryTemporaryPath,
  `${JSON.stringify({
    schemaVersion: 1,
    updatedAt: capturedAt.toISOString(),
    players: playerSnapshotHistory,
  })}\n`,
);
await writeFile(
  rookiePickHistoryTemporaryPath,
  `${JSON.stringify({
    schemaVersion: 1,
    updatedAt: capturedAt.toISOString(),
    picks: rookiePickHistory,
  })}\n`,
);
await rename(rookiePickHistoryTemporaryPath, rookiePickHistoryPath);
await rename(snapshotHistoryTemporaryPath, snapshotHistoryPath);
await rename(temporaryPath, currentPath);

const archiveDate = capturedAt.toISOString().slice(0, 10).split("-");
const archiveDirectory = path.resolve(
  "..",
  "data",
  "snapshots",
  archiveDate[0],
  archiveDate[1],
  archiveDate[2],
);
await mkdir(archiveDirectory, { recursive: true });
const archive = {
  schemaVersion: release.schemaVersion,
  methodologyVersion: release.methodologyVersion,
  releaseId,
  capturedAt: release.capturedAt,
  source: release.source,
  playerMarkets,
  pickMarkets,
  playerScoringProfiles,
  scoringProfilePublication,
};
await writeFile(
  path.join(archiveDirectory, `${releaseId}.json.gz`),
  gzipSync(JSON.stringify(archive), { level: 9 }),
);

console.log(
  `Published ${releaseId}: ${Object.keys(playerMarkets).length} player markets, ${Object.keys(pickMarkets).length} pick markets, ${Object.keys(playerProfiles).length} player profiles, ${Object.keys(playerScoringProfiles).length} scoring profiles.`,
);

async function fetchPlayerProfile(playerUrl, suppliedStats) {
  const detail = await fetchJson(playerUrl);
  const stats = await fetchRequiredPlayerStats(playerUrl, suppliedStats);
  const advanced = await fetchOptionalJson(`${playerUrl}/advanced`);
  const bestball = await fetchOptionalJson(`${playerUrl}/bestball`);
  const projection = await fetchOptionalJson(`${playerUrl}/projection`);
  const advancedData = advanced?.data;

  return {
    data: {
      ...detail.data,
      stats: stats?.data?.stats ?? null,
      career: stats?.data?.career ?? null,
      advanced: advancedData?.found
        ? {
            season: advancedData.season,
            ...advancedData.metrics,
            last4: advancedData.last4,
            totals: advancedData.totals,
          }
        : null,
      bestball: bestball?.data
        ? omitKeys(bestball.data, ["slug"])
        : null,
      projection: projection?.data?.projection ?? null,
    },
    meta: detail.meta,
  };
}

async function fetchRequiredPlayerStats(playerUrl, suppliedStats) {
  if (suppliedStats?.data?.stats?.derivedStats) return suppliedStats;

  let latest = suppliedStats;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    latest = await fetchJson(`${playerUrl}/stats`, { attempts: 2 });
    if (latest?.data?.stats?.derivedStats) return latest;
    if (attempt < 2) await delay(750 * attempt);
  }
  return latest;
}

function normalizeProfileToMarket(payload, currentPlayersBySlug) {
  const current = currentPlayersBySlug.get(payload.data.slug);
  if (!current) return payload;

  return {
    ...payload,
    data: {
      ...payload.data,
      name: current.name,
      position: current.position,
      team: current.team,
      age: current.age,
      composite: current.composite,
      confidence: current.confidence,
      rank: current.rank,
      posRank: current.posRank,
      sources: current.sources,
      sleeperId: current.sleeperId,
      similar: (payload.data.similar ?? []).map((similar) => {
        const matchingPlayer = currentPlayersBySlug.get(similar.slug);
        return matchingPlayer
          ? {
              ...similar,
              name: matchingPlayer.name,
              position: matchingPlayer.position,
              composite: matchingPlayer.composite,
              rank: matchingPlayer.rank,
            }
          : similar;
      }),
    },
  };
}

function preserveValidatedProfileEvidence(payload, priorPayload) {
  if (!priorPayload?.data) return payload;
  return {
    ...payload,
    data: {
      ...payload.data,
      stats: payload.data.stats ?? priorPayload.data.stats ?? null,
      career: payload.data.career ?? priorPayload.data.career ?? null,
      advanced: payload.data.advanced ?? priorPayload.data.advanced ?? null,
      bestball: payload.data.bestball ?? priorPayload.data.bestball ?? null,
      projection: payload.data.projection ?? priorPayload.data.projection ?? null,
    },
  };
}

async function fetchOptionalJson(url, { attempts = 1 } = {}) {
  try {
    return await fetchJson(url, { attempts });
  } catch {
    return null;
  }
}

async function fetchJson(url, { attempts = 4 } = {}) {

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await waitForRequestSlot();
    let response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
    } catch (error) {
      if (attempt === attempts) {
        throw new Error(
          `Tradyr request timed out for ${url}`,
          { cause: error },
        );
      }
      await delay(750 * 2 ** (attempt - 1));
      continue;
    }
    if (response.ok) {
      const payload = await response.json();
      if (!payload || typeof payload !== "object" || !("data" in payload) || !("meta" in payload)) {
        throw new Error(`Unexpected Tradyr payload for ${url}`);
      }
      return payload;
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === attempts) {
      throw new Error(`Tradyr returned ${response.status} for ${url}`);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    await delay(
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1_000
        : 750 * 2 ** (attempt - 1),
    );
  }

  throw new Error(`Tradyr request failed for ${url}`);
}

function omitKeys(value, keys) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizePlayerMarketPayload(payload) {
  const positionCounts = new Map();
  return {
    ...payload,
    data: payload.data.map((player, index) => {
      const posRank = (positionCounts.get(player.position) ?? 0) + 1;
      positionCounts.set(player.position, posRank);
      return {
        ...player,
        // Public ranks are derived from the exact displayed order and values so
        // source-side tie breaking can never contradict the published table.
        rank: index + 1,
        posRank,
        // Tradyr can round the top normalized score to 1001. Keep the public contract at 0–1000.
        composite: player.composite > 1000 && player.composite <= 1001
          ? 1000
          : player.composite,
      };
    }),
  };
}

async function waitForRequestSlot() {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextRequestAt);
  nextRequestAt = scheduledAt + requestIntervalMs;
  if (scheduledAt > now) await delay(scheduledAt - now);
}

function validateRelease({
  playerMarkets,
  pickMarkets,
  playerProfiles,
  playerScoringProfiles,
  priorScoringProfileCount,
  priorPlayerMarkets,
  playerSnapshotHistory,
}) {
  if (Object.keys(playerMarkets).length !== 8) {
    throw new Error("Release is missing player market variants");
  }
  if (Object.keys(pickMarkets).length !== 10) {
    throw new Error("Release is missing pick market variants");
  }
  if (Object.keys(playerProfiles).length !== playerSlugs.length) {
    throw new Error(
      `Release has ${Object.keys(playerProfiles).length} of ${playerSlugs.length} configured player profiles`,
    );
  }
  if (Object.keys(playerScoringProfiles).length < 150) {
    throw new Error(
      `Release has only ${Object.keys(playerScoringProfiles).length} usable scoring profiles`,
    );
  }
  if (Object.keys(playerScoringProfiles).length < priorScoringProfileCount) {
    throw new Error(
      `Scoring profile coverage regressed from ${priorScoringProfileCount} to ${Object.keys(playerScoringProfiles).length}`,
    );
  }
  for (const [slug, profile] of Object.entries(playerScoringProfiles)) {
    if (
      !currentPlayersBySlug.has(slug) ||
      profile.modelVersion !== SCORING_PROFILE_VERSION ||
      !Number.isFinite(profile.confidence) ||
      !profile.perGame ||
      Object.values(profile.perGame).some((value) => !Number.isFinite(value))
    ) {
      throw new Error(`Player scoring profile ${slug} failed validation`);
    }
  }
  for (const [key, payload] of Object.entries(playerMarkets)) {
    const minimumPlayers = key.startsWith("redraft:") ? 150 : 300;
    if (!Array.isArray(payload.data) || payload.data.length < minimumPlayers) {
      throw new Error(`Player market ${key} is unexpectedly small`);
    }
    if (payload.meta?.access?.limited === true) {
      throw new Error(`Player market ${key} is an access-limited response`);
    }
    if (
      Number.isFinite(payload.meta?.access?.total) &&
      payload.meta.access.total !== payload.data.length
    ) {
      throw new Error(
        `Player market ${key} returned ${payload.data.length} of ${payload.meta.access.total} players`,
      );
    }
    const uniqueSlugs = new Set(payload.data.map((player) => player.slug));
    if (uniqueSlugs.size !== payload.data.length || uniqueSlugs.has(undefined)) {
      throw new Error(`Player market ${key} contains missing or duplicate slugs`);
    }
    const generatedAt = Date.parse(payload.meta?.generatedAt);
    if (
      !Number.isFinite(generatedAt) ||
      generatedAt > capturedAt.getTime() + 5 * 60 * 1_000 ||
      capturedAt.getTime() - generatedAt > MAX_MARKET_AGE_MS
    ) {
      throw new Error(`Player market ${key} is older than the 48-hour publication limit`);
    }
    const positionRanks = new Map();
    for (let index = 0; index < payload.data.length; index += 1) {
      const player = payload.data[index];
      const previousAtPosition = positionRanks.get(player.position);
      if (
        typeof player.name !== "string" || !player.name.trim() ||
        typeof player.slug !== "string" || !player.slug.trim() ||
        !playerPositions.has(player.position) ||
        (player.team != null && !nflTeams.has(player.team)) ||
        !Number.isFinite(player.composite) || player.composite < 0 || player.composite > 1000 ||
        !Number.isInteger(player.rank) || player.rank < 1 ||
        !Number.isInteger(player.posRank) || player.posRank < 1 ||
        (index > 0 && payload.data[index - 1].rank > player.rank) ||
        (index > 0 && payload.data[index - 1].composite < player.composite) ||
        (previousAtPosition && previousAtPosition.composite > player.composite && previousAtPosition.rank >= player.posRank)
      ) {
        throw new Error(`Player market ${key} has an invalid record at rank ${index + 1}`);
      }
      positionRanks.set(player.position, { rank: player.posRank, composite: player.composite });
    }
    const priorCount = priorPlayerMarkets?.[key]?.data?.length ?? 0;
    if (payload.data.length < priorCount) {
      console.warn(
        `Player market ${key} contracted from ${priorCount} to ${payload.data.length} players after full-response validation.`,
      );
    }
  }
  for (const [key, payload] of Object.entries(pickMarkets)) {
    const supportedTeamCount = Number(key.split(":")[1]);
    const generatedAt = Date.parse(payload.meta?.generatedAt);
    const uniqueIds = new Set(Array.isArray(payload.data) ? payload.data.map((pick) => pick.id) : []);
    if (
      !Array.isArray(payload.data) ||
      payload.data.length < 12 ||
      uniqueIds.size !== payload.data.length ||
      !Number.isFinite(generatedAt) ||
      generatedAt > capturedAt.getTime() + 5 * 60 * 1_000 ||
      capturedAt.getTime() - generatedAt > MAX_MARKET_AGE_MS ||
      payload.data.some((pick) =>
        typeof pick.id !== "string" || !pick.id ||
        typeof pick.name !== "string" || !pick.name ||
        pick.position !== "PICK" ||
        !Number.isFinite(pick.composite) || pick.composite < 0 || pick.composite > 1000 ||
        !/^(2026|2027|2028)$/.test(pick.year) ||
        ![1, 2, 3, 4].includes(pick.round) ||
        !Number.isInteger(pick.slot) || pick.slot < 1 || pick.slot > supportedTeamCount
      )
    ) {
      throw new Error(`Pick market ${key} failed identity, scale, or freshness validation`);
    }
  }
  for (const slug of playerSlugs) {
    const payload = playerProfiles[slug];
    if (!payload.data || payload.data.slug !== slug) {
      throw new Error(`Player profile ${slug} failed validation`);
    }
    if (!Array.isArray(payload.data.history)) {
      throw new Error(`Player profile ${slug} has an invalid history field`);
    }
    if (payload.data.stats != null && !payload.data.stats.derivedStats) {
      throw new Error(`Player profile ${slug} has malformed production stats`);
    }
    const observations = playerSnapshotHistory[slug];
    if (!Array.isArray(observations) || observations.length < 1) {
      throw new Error(`Player profile ${slug} is missing FTT snapshot history`);
    }
    if (
      observations.some(
        (observation) =>
          !observation.releaseId ||
          !Number.isFinite(observation.value) ||
          !Number.isFinite(Date.parse(observation.observedAt)),
      ) ||
      new Set(observations.map((observation) => observation.releaseId)).size !==
        observations.length
    ) {
      throw new Error(`Player profile ${slug} has invalid FTT observations`);
    }
    const latest = observations.at(-1);
    const currentPlayer = playerMarkets["dynasty:2:0"].data.find(
      (player) => player.slug === slug,
    );
    if (
      !currentPlayer ||
      payload.data.name !== currentPlayer.name ||
      payload.data.position !== currentPlayer.position ||
      payload.data.team !== currentPlayer.team ||
      payload.data.composite !== currentPlayer.composite
    ) {
      throw new Error(`Player profile ${slug} does not match the current market`);
    }
    if (
      latest.releaseId !== releaseId ||
      latest.value !== currentPlayer?.composite ||
      latest.rank !== (currentPlayer?.rank ?? null) ||
      latest.posRank !== (currentPlayer?.posRank ?? null)
    ) {
      throw new Error(`Player profile ${slug} has a stale FTT snapshot history`);
    }
  }
}

function buildPlayerSnapshotHistory({ existing, releases, playerSlugs }) {
  const histories = Object.fromEntries(
    playerSlugs.map((slug) => [
      slug,
      Array.isArray(existing?.[slug]) ? [...existing[slug]] : [],
    ]),
  );

  for (const release of releases) {
    if (!release?.releaseId || !release?.capturedAt) continue;
    const market = release.playerMarkets?.["dynasty:2:0"]?.data;
    if (!Array.isArray(market)) continue;

    for (const slug of playerSlugs) {
      const player = market.find((candidate) => candidate.slug === slug);
      if (!player || !Number.isFinite(player.composite)) continue;
      histories[slug].push({
        observedAt: release.capturedAt,
        value: player.composite,
        rank: player.rank ?? null,
        posRank: player.posRank ?? null,
        releaseId: release.releaseId,
      });
    }
  }

  for (const slug of playerSlugs) {
    histories[slug] = Array.from(
      new Map(
        histories[slug].map((observation) => [
          observation.releaseId,
          observation,
        ]),
      ).values(),
    ).sort(
      (left, right) =>
        new Date(left.observedAt).getTime() - new Date(right.observedAt).getTime(),
    );
  }

  return histories;
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function mapConcurrent(items, concurrency, mapper) {
  const output = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return output;
}
