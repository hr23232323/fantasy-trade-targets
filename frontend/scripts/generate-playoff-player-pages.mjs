import { readFile, writeFile } from "node:fs/promises";

const POSITION_TARGETS = { QB: 10, RB: 12, WR: 12, TE: 6 };
const [publicRelease, nflverse, teamRelease, playerPages, existingPages] = await Promise.all([
  readJson("../data/public-release.json"),
  readJson("../data/nflverse-player-release.json"),
  readJson("../data/team-release.json"),
  readJson("../data/player-pages.json"),
  readJson("../data/playoff-player-pages.json").catch(() => []),
]);

const supported = new Set(playerPages.map(({ slug }) => slug));
const validTeams = new Set(Object.keys(teamRelease.teams));
const market = publicRelease.playerMarkets["redraft:1:0"].data;
const validPlayers = market.filter((player) => {
  const context = nflverse.players[player.slug];
  return Boolean(
    POSITION_TARGETS[player.position] &&
    player.rank <= 120 &&
    player.team &&
    validTeams.has(player.team) &&
    supported.has(player.slug) &&
    context?.games?.some((game) => game.season === nflverse.season),
  );
});
const bySlug = new Map(validPlayers.map((player) => [player.slug, player]));
const selected = [];
const selectedSlugs = new Set();
const positionCounts = Object.fromEntries(Object.keys(POSITION_TARGETS).map((position) => [position, 0]));

// Preserve valid URLs so a small market move does not churn the public cohort.
for (const page of existingPages) add(page.slug);
for (const player of validPlayers.sort((left, right) => left.rank - right.rank || left.name.localeCompare(right.name))) add(player.slug);

const expected = Object.values(POSITION_TARGETS).reduce((sum, count) => sum + count, 0);
if (selected.length !== expected) throw new Error(`Expected ${expected} playoff player pages, generated ${selected.length}.`);
await writeFile(new URL("../data/playoff-player-pages.json", import.meta.url), `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Generated ${selected.length} player playoff outlooks for Weeks 15–17.`);

function add(slug) {
  const player = bySlug.get(slug);
  if (!player || selectedSlugs.has(slug) || positionCounts[player.position] >= POSITION_TARGETS[player.position]) return false;
  selected.push({ slug });
  selectedSlugs.add(slug);
  positionCounts[player.position] += 1;
  return true;
}

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}
