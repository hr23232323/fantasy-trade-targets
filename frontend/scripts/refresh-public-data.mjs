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
let nextRequestAt = 0;
const releaseId = `ftt-${capturedAt
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}/, "")}`;

const playerPageManifest = JSON.parse(
  await readFile(path.resolve("data/player-pages.json"), "utf8"),
);
const playerSlugs = playerPageManifest.map((player) => player.slug);

const headers = {
  Accept: "application/json",
  "User-Agent": "FantasyTradeTargetData/1.0 (+https://www.fantasytradetarget.com)",
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
  url: `${API_BASE}/players/${encodeURIComponent(slug)}/full`,
  kind: "profile",
}));

const responses = await mapConcurrent(
  [...playerRequests, ...pickRequests, ...profileRequests],
  hasApiKey ? 8 : 4,
  async (request) => ({ ...request, payload: await fetchJson(request.url) }),
);

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
const playerProfiles = Object.fromEntries(
  responses
    .filter((response) => response.kind === "profile")
    .map((response) => [response.key, response.payload]),
);

validateRelease({ playerMarkets, pickMarkets, playerProfiles });

const release = {
  schemaVersion: 1,
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
};

const currentPath = path.resolve("data/public-release.json");
const temporaryPath = `${currentPath}.tmp`;
await mkdir(path.dirname(currentPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(release)}\n`);
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

async function fetchJson(url) {
  const attempts = 4;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await waitForRequestSlot();
    const response = await fetch(url, { headers });
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

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForRequestSlot() {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextRequestAt);
  nextRequestAt = scheduledAt + requestIntervalMs;
  if (scheduledAt > now) await delay(scheduledAt - now);
}

function validateRelease({ playerMarkets, pickMarkets, playerProfiles }) {
  if (Object.keys(playerMarkets).length !== 8) {
    throw new Error("Release is missing player market variants");
  }
  if (Object.keys(pickMarkets).length !== 10) {
    throw new Error("Release is missing pick market variants");
  }
  for (const [key, payload] of Object.entries(playerMarkets)) {
    const minimumPlayers = key.startsWith("redraft:") ? 150 : 300;
    if (!Array.isArray(payload.data) || payload.data.length < minimumPlayers) {
      throw new Error(`Player market ${key} is unexpectedly small`);
    }
  }
  for (const [slug, payload] of Object.entries(playerProfiles)) {
    if (!payload.data || payload.data.slug !== slug) {
      throw new Error(`Player profile ${slug} failed validation`);
    }
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
