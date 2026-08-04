import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const API_BASE = "https://api.tradyr.app/v1";
const formats = ["dynasty", "redraft"];
const quarterbackSettings = [1, 2];
const tepSettings = [false, true];
const teamCounts = [8, 10, 12, 14, 16];
const capturedAt = new Date();
const hasApiKey = Boolean(process.env.TRADYR_API_KEY);
const requestIntervalMs = hasApiKey ? 75 : 1_100;
const requestTimeoutMs = 15_000;
let nextRequestAt = 0;
const releaseId = `ftt-${capturedAt
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}/, "")}`;
const currentPath = path.resolve("data/public-release.json");
const snapshotHistoryPath = path.resolve(
  "..",
  "data",
  "player-snapshot-history.json",
);

const playerPageManifest = JSON.parse(
  await readFile(path.resolve("data/player-pages.json"), "utf8"),
);
const playerSlugs = playerPageManifest.map((player) => player.slug);

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
const profileRequests = playerSlugs.map((slug) => ({
  key: slug,
  url: `${API_BASE}/players/${encodeURIComponent(slug)}`,
  kind: "profile",
}));

const marketAndPickResponses = await mapConcurrent(
  [...playerRequests, ...pickRequests],
  hasApiKey ? 8 : 4,
  async (request) => ({ ...request, payload: await fetchJson(request.url) }),
);
const profileResponses = await mapConcurrent(
  profileRequests,
  2,
  async (request, index) => {
    const payload = await fetchPlayerProfile(request.url);
    console.log(
      `Fetched player profile ${index + 1}/${profileRequests.length}: ${request.key}`,
    );
    return { ...request, payload };
  },
);
const responses = [...marketAndPickResponses, ...profileResponses];

const playerMarkets = Object.fromEntries(
  responses
    .filter((response) => response.kind === "players")
    .map((response) => [response.key, response.payload]),
);
const pickMarkets = Object.fromEntries(
  responses
    .filter((response) => response.kind === "picks")
    .map((response) => [response.key, response.payload]),
);
const rawPlayerProfiles = Object.fromEntries(
  responses
    .filter((response) => response.kind === "profile")
    .map((response) => [response.key, response.payload]),
);
const currentPlayersBySlug = new Map(
  playerMarkets["dynasty:2:0"].data.map((player) => [player.slug, player]),
);
const playerProfiles = Object.fromEntries(
  Object.entries(rawPlayerProfiles).map(([slug, payload]) => [
    slug,
    normalizeProfileToMarket(payload, currentPlayersBySlug),
  ]),
);

const [priorRelease, priorSnapshotHistory] = await Promise.all([
  readJsonIfPresent(currentPath),
  readJsonIfPresent(snapshotHistoryPath),
]);
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

validateRelease({
  playerMarkets,
  pickMarkets,
  playerProfiles,
  playerSnapshotHistory,
});

const release = {
  schemaVersion: 2,
  methodologyVersion: "2026.08.1",
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
  playerSnapshotHistory,
};

const temporaryPath = `${currentPath}.tmp`;
const snapshotHistoryTemporaryPath = `${snapshotHistoryPath}.tmp`;
await mkdir(path.dirname(currentPath), { recursive: true });
await mkdir(path.dirname(snapshotHistoryPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(release)}\n`);
await writeFile(
  snapshotHistoryTemporaryPath,
  `${JSON.stringify({
    schemaVersion: 1,
    updatedAt: capturedAt.toISOString(),
    players: playerSnapshotHistory,
  })}\n`,
);
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
};
await writeFile(
  path.join(archiveDirectory, `${releaseId}.json.gz`),
  gzipSync(JSON.stringify(archive), { level: 9 }),
);

console.log(
  `Published ${releaseId}: ${Object.keys(playerMarkets).length} player markets, ${Object.keys(pickMarkets).length} pick markets, ${Object.keys(playerProfiles).length} player profiles.`,
);

async function fetchPlayerProfile(playerUrl) {
  const detail = await fetchJson(playerUrl);
  const stats = await fetchJson(`${playerUrl}/stats`);
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
  for (const [key, payload] of Object.entries(playerMarkets)) {
    const minimumPlayers = key.startsWith("redraft:") ? 150 : 300;
    if (!Array.isArray(payload.data) || payload.data.length < minimumPlayers) {
      throw new Error(`Player market ${key} is unexpectedly small`);
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
    if (!payload.data.stats?.derivedStats) {
      throw new Error(`Player profile ${slug} is missing production stats`);
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
