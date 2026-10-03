import { readFile, writeFile } from "node:fs/promises";
import { projectPlayerWeek } from "../src/app/lib/start-sit-model.mjs";

const TARGET_COUNT = 200;
const fantasyPositions = new Set(["QB", "RB", "WR", "TE"]);
const [existing, nflverse, teams, playerPages, publicRelease] = await Promise.all([
  readJson("../data/start-sit-comparisons.json"),
  readJson("../data/nflverse-player-release.json"),
  readJson("../data/team-release.json"),
  readJson("../data/player-pages.json"),
  readJson("../data/public-release.json"),
]);

const activeWeek = Array.from({ length: 18 }, (_, index) => index + 1).find((week) =>
  Object.values(teams.teams).some((team) => team.schedule.some((game) => game.week === week && game.result === null)),
) ?? 18;
const pageBySlug = new Map(playerPages.map((player) => [player.slug, player]));
const redraft = publicRelease.playerMarkets["redraft:1:0"].data;
const marketBySlug = new Map(redraft.map((player) => [player.slug, player]));
const normalizedExisting = existing.map((comparison) => ({
  ...comparison,
  selectionReason: /Week \d+/i.test(comparison.selectionReason)
    ? reasonFor(comparison.position)
    : comparison.selectionReason,
}));
const pairKeys = new Set(normalizedExisting.map((comparison) => pairKey(comparison.leftSlug, comparison.rightSlug)));

const players = Object.values(nflverse.players).flatMap((player) => {
  const position = player.roster?.position;
  const team = teams.teams[player.roster?.team];
  const opponentAbbr = team?.schedule.find((game) => game.week === activeWeek)?.opponentAbbr;
  const opponent = teams.teams[opponentAbbr];
  const market = marketBySlug.get(player.slug);
  if (!fantasyPositions.has(position) || !pageBySlug.has(player.slug) || !team || !opponent || !market) return [];
  const field = "halfPpr";
  const allowed = nflverse.positionDefense.teams[opponent.abbr]?.[position]?.pointsPerGame[field];
  const leagueValues = Object.values(nflverse.positionDefense.teams)
    .map((positions) => positions[position]?.pointsPerGame[field])
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  const leagueMedian = median(leagueValues);
  const projection = projectPlayerWeek({ player, week: activeWeek, season: nflverse.season, opponentAllowed: allowed, leagueMedianAllowed: leagueMedian, receptionPoints: 0.5, passingTdPoints: 4 });
  if (!projection || projection.median <= 0) return [];
  return [{ slug: player.slug, name: pageBySlug.get(player.slug).name, position, marketRank: market.rank, projection: projection.median }];
});

const caps = { QB: 28, RB: 55, WR: 65, TE: 36 };
const pools = Object.fromEntries([...fantasyPositions].map((position) => [position, players
  .filter((player) => player.position === position)
  .sort((left, right) => left.marketRank - right.marketRank)
  .slice(0, caps[position])]));
const candidates = [];

for (const position of fantasyPositions) {
  const pool = pools[position];
  for (let leftIndex = 0; leftIndex < pool.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < Math.min(pool.length, leftIndex + 10); rightIndex += 1) {
      addCandidate(pool[leftIndex], pool[rightIndex], position);
    }
  }
}

const flexPool = [...pools.RB.slice(0, 36), ...pools.WR.slice(0, 42), ...pools.TE.slice(0, 20)];
for (let leftIndex = 0; leftIndex < flexPool.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < flexPool.length; rightIndex += 1) {
    const left = flexPool[leftIndex];
    const right = flexPool[rightIndex];
    if (left.position === right.position || Math.abs(left.projection - right.projection) > 3) continue;
    addCandidate(left, right, "FLEX");
  }
}

candidates.sort((left, right) => left.priority - right.priority || left.slug.localeCompare(right.slug));
const additions = candidates.slice(0, Math.max(0, TARGET_COUNT - normalizedExisting.length)).map(({ priority: _, ...comparison }) => comparison);
if (additions.length < TARGET_COUNT - normalizedExisting.length) throw new Error(`Only ${additions.length} valid additions were available.`);
const output = [...normalizedExisting, ...additions];
await writeFile(new URL("../data/start-sit-comparisons.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Added ${additions.length} evidence-selected Week ${activeWeek} comparisons (${output.length} total).`);

function addCandidate(left, right, position) {
  const key = pairKey(left.slug, right.slug);
  if (pairKeys.has(key)) return;
  pairKeys.add(key);
  const ordered = [left, right].sort((a, b) => a.name.localeCompare(b.name));
  const projectionGap = Math.abs(left.projection - right.projection);
  const marketDistance = Math.abs(left.marketRank - right.marketRank);
  candidates.push({
    slug: `${urlSlug(ordered[0].slug)}-vs-${urlSlug(ordered[1].slug)}`,
    leftSlug: ordered[0].slug,
    rightSlug: ordered[1].slug,
    position,
    selectionReason: reasonFor(position),
    priority: Math.max(left.marketRank, right.marketRank) + projectionGap * 5 + marketDistance * 0.15,
  });
}

function reasonFor(position) {
  if (position === "QB") return "Two widely rostered quarterbacks in a similar weekly range, compared through recent production, rushing work, matchup and current availability.";
  if (position === "RB") return "Two relevant running-back options in a similar weekly range, compared through touches, receiving work, matchup and current availability.";
  if (position === "WR") return "Two relevant wide-receiver options in a similar weekly range, compared through targets, snap share, matchup and current availability.";
  if (position === "TE") return "Two relevant tight-end options in a similar weekly range, compared through targets, snap share, matchup and current availability.";
  return "Two viable FLEX options with similar weekly projections, compared through recent opportunity, scoring format, matchup and current availability.";
}

function pairKey(left, right) { return [left, right].sort().join("|"); }
function urlSlug(slug) { return slug.replace(/-(qb|rb|wr|te)$/, ""); }
function median(values) {
  if (!values.length) return null;
  return values.length % 2 ? values[Math.floor(values.length / 2)] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
}
async function readJson(path) { return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")); }
