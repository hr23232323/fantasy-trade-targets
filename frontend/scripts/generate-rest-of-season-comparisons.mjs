import { readFile, writeFile } from "node:fs/promises";
import { buildRestOfSeasonRankings } from "../src/app/lib/rest-of-season-model.mjs";

const TARGET_COUNT = 30;
const quotas = { QB: 7, RB: 8, WR: 9, TE: 6 };
const seeds = [
  ["sam-darnold-qb", "kyler-murray-qb"],
  ["kyren-williams-rb", "ashton-jeanty-rb"],
  ["zay-flowers-wr", "nico-collins-wr"],
];

const [publicRelease, nflverse, teamRelease, playerPages] = await Promise.all([
  readJson("../data/public-release.json"),
  readJson("../data/nflverse-player-release.json"),
  readJson("../data/team-release.json"),
  readJson("../data/player-pages.json"),
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
const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };

for (const [leftSlug, rightSlug] of seeds) addPair(leftSlug, rightSlug, "Search Console shows direct rest-of-season demand for this decision.");

for (const position of Object.keys(quotas)) {
  const pool = rankings
    .filter((row) => row.position === position)
    .sort((left, right) => left.positionRank - right.positionRank)
    .slice(0, position === "QB" || position === "TE" ? 28 : 42);
  const candidates = [];
  for (let leftIndex = 0; leftIndex < pool.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < Math.min(pool.length, leftIndex + 6); rightIndex += 1) {
      const left = pool[leftIndex];
      const right = pool[rightIndex];
      const key = pairKey(left.slug, right.slug);
      if (selectedKeys.has(key)) continue;
      candidates.push({
        left,
        right,
        priority: Math.max(left.positionRank, right.positionRank) + Math.abs(left.rating - right.rating) * 0.12 + Math.abs(left.positionRank - right.positionRank) * 2,
      });
    }
  }
  candidates.sort((left, right) => left.priority - right.priority || pairKey(left.left.slug, left.right.slug).localeCompare(pairKey(right.left.slug, right.right.slug)));
  for (const candidate of candidates) {
    if (positionCounts[position] >= quotas[position]) break;
    addPair(candidate.left.slug, candidate.right.slug, reasonFor(position));
  }
}

if (selected.length !== TARGET_COUNT) throw new Error(`Expected ${TARGET_COUNT} comparisons, generated ${selected.length}.`);
await writeFile(new URL("../data/rest-of-season-comparisons.json", import.meta.url), `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Generated ${selected.length} evidence-selected rest-of-season comparisons for Week ${activeWeek}.`);

function addPair(leftSlug, rightSlug, selectionReason) {
  const left = bySlug.get(leftSlug);
  const right = bySlug.get(rightSlug);
  if (!left || !right || left.position !== right.position) throw new Error(`Invalid comparison seed: ${leftSlug} vs ${rightSlug}`);
  const key = pairKey(leftSlug, rightSlug);
  if (selectedKeys.has(key) || positionCounts[left.position] >= quotas[left.position]) return;
  selectedKeys.add(key);
  positionCounts[left.position] += 1;
  const ordered = [left, right].sort((a, b) => a.name.localeCompare(b.name));
  selected.push({
    slug: `${urlSlug(ordered[0].slug)}-vs-${urlSlug(ordered[1].slug)}`,
    leftSlug: ordered[0].slug,
    rightSlug: ordered[1].slug,
    position: left.position,
    selectionReason,
  });
}

function reasonFor(position) {
  const label = { QB: "quarterbacks", RB: "running backs", WR: "wide receivers", TE: "tight ends" }[position];
  return `Two high-interest ${label} close enough in the current rest-of-season model to create a real roster or trade decision.`;
}
function pairKey(left, right) { return [left, right].sort().join("|"); }
function urlSlug(slug) { return slug.replace(/-(qb|rb|wr|te)$/, ""); }
async function readJson(path) { return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")); }
