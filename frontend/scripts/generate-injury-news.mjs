import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  findActiveWeek,
  selectWeeklyInjuryUpdates,
  validateInjuryNewsRelease,
} from "../src/app/lib/injury-publication.mjs";

const [nflverse, teams, playerPages, publicRelease] = await Promise.all([
  readJson("../data/nflverse-player-release.json"),
  readJson("../data/team-release.json"),
  readJson("../data/player-pages.json"),
  readJson("../data/public-release.json"),
]);
const week = findActiveWeek(teams.teams);
const updates = selectWeeklyInjuryUpdates({
  players: nflverse.players,
  playerPages,
  marketPlayers: publicRelease.playerMarkets["redraft:1:0"].data,
  week,
});
const release = {
  schemaVersion: 2,
  updatedAt: nflverse.capturedAt,
  week,
  source: {
    name: "nflverse weekly injury reports",
    url: nflverse.sources.injuries.url,
    publishedAt: nflverse.capturedAt,
  },
  updates,
};

validateInjuryNewsRelease(release, nflverse.players);
const outputPath = path.resolve("data/injury-news.json");
const temporaryPath = `${outputPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(release, null, 2)}\n`);
await rename(temporaryPath, outputPath);
console.log(`Published ${updates.length} priority Week ${week} injury updates from ${nflverse.releaseId}.`);

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));
}
