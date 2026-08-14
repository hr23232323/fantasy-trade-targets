import { readFile, readdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import {
  buildRookiePickHistory,
  validateRookiePickHistory,
} from "../src/app/lib/rookie-pick-history.mjs";

const archiveRoot = path.resolve("..", "data", "snapshots");
const outputPath = path.resolve("data", "rookie-pick-history.json");
const currentPath = path.resolve("data", "public-release.json");
const archiveNames = (await readdir(archiveRoot, { recursive: true }))
  .filter((name) => name.endsWith(".json.gz"))
  .sort();
const archiveReleases = await Promise.all(
  archiveNames.map(async (name) =>
    JSON.parse(gunzipSync(await readFile(path.join(archiveRoot, name)))),
  ),
);
const currentRelease = JSON.parse(await readFile(currentPath, "utf8"));
const releases = Array.from(
  new Map(
    [...archiveReleases, currentRelease].map((release) => [release.releaseId, release]),
  ).values(),
).sort(
  (left, right) =>
    new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime(),
);
const picks = buildRookiePickHistory({ existing: {}, releases });
validateRookiePickHistory({ histories: picks, release: currentRelease });
await writeFile(
  outputPath,
  `${JSON.stringify({ schemaVersion: 1, updatedAt: currentRelease.capturedAt, picks })}\n`,
);
console.log(
  `Published ${Object.keys(picks).length} rookie-pick histories from ${releases.length} releases.`,
);
