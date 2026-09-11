import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [home, calculators, rankingsPage, rankings, comparison, tePremium, refresh] = await Promise.all([
  read("../src/app/page.tsx"),
  Promise.all(["fantasy-trade-calculator", "dynasty-trade-calculator", "dynasty-superflex-trade-calculator", "fantasy-football-trade-analyzer"].map((slug) => read(`../src/app/${slug}/page.tsx`))).then((pages) => pages.join("\n")),
  read("../src/app/dynasty-rankings/page.tsx"),
  read("../src/app/components/ServerRankings.tsx"),
  read("../src/app/player-comparisons/[slug]/page.tsx"),
  read("../src/app/scoring/te-premium-rankings/page.tsx"),
  read("../scripts/refresh-public-data.mjs"),
]);

test("money pages use descriptive keyword-first headings and visible release freshness", () => {
  assert.match(home, /Fantasy football trade/);
  for (const phrase of ["Fantasy trade calculator", "Dynasty trade calculator", "Dynasty Superflex trade calculator", "Fantasy football trade analyzer"]) assert.match(calculators, new RegExp(phrase));
  assert.match(calculators, /showRelease/g);
  assert.match(rankingsPage, /Dynasty rankings:/);
  assert.match(rankingsPage, /showRelease/);
});

test("dynasty rankings publish the complete market with decision-useful columns", () => {
  assert.doesNotMatch(rankings, /slice\(0, 12\)/);
  assert.match(rankings, /Superflex/);
  assert.match(rankings, /1QB/);
  assert.match(rankings, /Biggest movers over seven days/);
  assert.match(rankings, /groups\.map/);
});

test("comparison snippets lead with the current answer and preload both trade sides", () => {
  assert.match(comparison, /Who Has More Dynasty Value/);
  assert.match(comparison, /leads.*current Superflex dynasty value/);
  assert.match(comparison, /get=\$\{basePlayers\.right\.id\}&send=\$\{basePlayers\.left\.id\}/);
});

test("TE-premium research is complete, current, crawlable content", () => {
  assert.match(tePremium, /TE Premium Dynasty Rankings & Trade Values/);
  assert.match(tePremium, /standardById/);
  assert.match(tePremium, /FAQPage/);
  assert.match(tePremium, /Last successful update/);
});

test("the publisher enforces scale, identity, rank order, and maximum age", () => {
  assert.match(refresh, /MAX_MARKET_AGE_MS/);
  assert.match(refresh, /player\.composite > 1000/);
  assert.match(refresh, /payload\.data\[index - 1\]\.rank > player\.rank/);
  assert.match(refresh, /previousAtPosition\.composite > player\.composite && previousAtPosition\.rank >= player\.posRank/);
  assert.match(refresh, /!playerPositions\.has/);
  assert.match(refresh, /!nflTeams\.has/);
});
