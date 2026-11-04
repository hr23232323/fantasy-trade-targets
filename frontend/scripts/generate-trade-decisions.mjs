import { readFile, writeFile } from "node:fs/promises";
import { buildRestOfSeasonRankings } from "../src/app/lib/rest-of-season-model.mjs";

const TARGET_COUNT = 24;
const [publicRelease, nflverse, teamRelease, playerPages, existingComparisons] = await Promise.all([
  readJson("../data/public-release.json"),
  readJson("../data/nflverse-player-release.json"),
  readJson("../data/team-release.json"),
  readJson("../data/player-pages.json"),
  readJson("../data/trade-decision-comparisons.json"),
]);

const activeWeek = Array.from({ length: 18 }, (_, index) => index + 1).find((week) =>
  Object.values(teamRelease.teams).some((team) => team.schedule.some((game) => game.week === week && game.result === null)),
) ?? 18;
const supported = new Set(playerPages.map(({ slug }) => slug));
const assets = publicRelease.playerMarkets["redraft:1:0"].data.map((player) => ({
  ...player,
  id: player.slug,
  kind: "player",
  value: player.composite,
}));
const rankings = buildRestOfSeasonRankings({
  assets,
  players: nflverse.players,
  teams: teamRelease.teams,
  positionDefense: nflverse.positionDefense.teams,
  season: nflverse.season,
  currentWeek: activeWeek,
  receptionPoints: 1,
}).filter((row) => supported.has(row.slug) && row.currentSeasonGames > 0);
const bySlug = new Map(rankings.map((row) => [row.slug, row]));
const selected = [];
const selectedKeys = new Set();

// Keep every still-valid researched URL. Only replace a pair when a player no
// longer has enough current data to publish a defensible answer.
for (const comparison of existingComparisons) {
  addPair(comparison.leftSlug, comparison.rightSlug, comparison.slug);
}

const pool = rankings
  .filter((row) => row.overallRank <= 96)
  .sort((left, right) => left.overallRank - right.overallRank || left.name.localeCompare(right.name));
const candidates = [];
for (let leftIndex = 0; leftIndex < pool.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < Math.min(pool.length, leftIndex + 13); rightIndex += 1) {
    const left = pool[leftIndex];
    const right = pool[rightIndex];
    const key = pairKey(left.slug, right.slug);
    if (selectedKeys.has(key)) continue;
    candidates.push({
      left,
      right,
      priority:
        Math.max(left.overallRank, right.overallRank) +
        Math.abs(left.rating - right.rating) * 0.18 +
        Math.abs(left.overallRank - right.overallRank) * 1.5 +
        (left.position === right.position ? 6 : 0),
    });
  }
}
candidates.sort((left, right) =>
  left.priority - right.priority || pairKey(left.left.slug, left.right.slug).localeCompare(pairKey(right.left.slug, right.right.slug)),
);
for (const candidate of candidates) {
  if (selected.length >= TARGET_COUNT) break;
  addPair(candidate.left.slug, candidate.right.slug);
}

if (selected.length !== TARGET_COUNT) throw new Error(`Expected ${TARGET_COUNT} trade decisions, generated ${selected.length}.`);
await writeFile(new URL("../data/trade-decision-comparisons.json", import.meta.url), `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Generated ${selected.length} current rest-of-season trade decisions for Week ${activeWeek}.`);

function addPair(leftSlug, rightSlug, existingSlug) {
  const left = bySlug.get(leftSlug);
  const right = bySlug.get(rightSlug);
  if (!left || !right || left.slug === right.slug) return false;
  const key = pairKey(leftSlug, rightSlug);
  if (selectedKeys.has(key) || selected.length >= TARGET_COUNT) return false;
  selectedKeys.add(key);
  if (existingSlug) {
    selected.push({ slug: existingSlug, leftSlug, rightSlug });
    return true;
  }
  const [send, receive] = [left, right].sort((a, b) => a.name.localeCompare(b.name));
  selected.push({
    slug: `${urlSlug(send.slug)}-for-${urlSlug(receive.slug)}`,
    leftSlug: send.slug,
    rightSlug: receive.slug,
  });
  return true;
}

function pairKey(left, right) { return [left, right].sort().join("|"); }
function urlSlug(slug) { return slug.replace(/-(qb|rb|wr|te)$/, ""); }
async function readJson(path) { return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")); }
