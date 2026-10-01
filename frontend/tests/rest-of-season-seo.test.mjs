import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildRestOfSeasonRankings } from "../src/app/lib/rest-of-season-model.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [release, teams, publicRelease, hub, detail, page, table, library, buySell, sitemap, indexNow, playbook] = await Promise.all([
  read("../data/nflverse-player-release.json").then(JSON.parse),
  read("../data/team-release.json").then(JSON.parse),
  read("../data/public-release.json").then(JSON.parse),
  read("../src/app/fantasy-football-rest-of-season-rankings/page.tsx"),
  read("../src/app/fantasy-football-rest-of-season-rankings/[position]/page.tsx"),
  read("../src/app/components/RestOfSeasonRankingsPage.tsx"),
  read("../src/app/components/RestOfSeasonRankingsTable.tsx"),
  read("../src/app/lib/rest-of-season.ts"),
  read("../src/app/fantasy-football-buy-low-sell-high/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

function realRankings(receptionPoints = 1) {
  const assets = publicRelease.playerMarkets["redraft:1:0"].data.map((player) => ({
    id: player.slug,
    slug: player.slug,
    name: player.name,
    position: player.position,
    kind: "player",
    value: player.composite,
    team: player.team,
  }));
  return buildRestOfSeasonRankings({ assets, players: release.players, teams: teams.teams, positionDefense: release.positionDefense.teams, season: release.season, currentWeek: 4, receptionPoints });
}

test("rest-of-season model produces complete finite rankings without future leakage", () => {
  const rankings = realRankings();
  assert.ok(rankings.length >= 150);
  assert.equal(new Set(rankings.map(({ slug }) => slug)).size, rankings.length);
  assert.deepEqual(rankings.map(({ overallRank }) => overallRank), rankings.map((_, index) => index + 1));
  assert.ok(rankings.every((row) => Number.isFinite(row.rating) && row.rating >= 0 && row.rating <= 1000));
  assert.ok(rankings.every((row) => row.currentSeasonGames <= 3));
  for (const position of ["QB", "RB", "WR", "TE"]) {
    const rows = rankings.filter((row) => row.position === position).sort((a, b) => a.positionRank - b.positionRank);
    assert.deepEqual(rows.map(({ positionRank }) => positionRank), rows.map((_, index) => index + 1));
  }
});

test("market remains the anchor and schedule adjustments stay bounded", () => {
  const rankings = realRankings();
  for (const row of rankings) {
    const maximumAdjustment = 300.1;
    assert.ok(Math.abs(row.rating - row.marketValue * 0.7) <= maximumAdjustment);
  }
});

test("PPR scoring changes receiving-heavy player inputs", () => {
  const standard = new Map(realRankings(0).map((row) => [row.slug, row]));
  const ppr = realRankings(1);
  const changed = ppr.filter((row) => {
    const baseline = standard.get(row.slug);
    return baseline && row.recentPointsPerGame !== baseline.recentPointsPerGame;
  });
  assert.ok(changed.length >= 50);
});

test("five ROS pages and one buy/sell page are indexable, interactive, and connected", () => {
  assert.match(hub, /Rest-of-Season Fantasy Football Rankings/);
  assert.match(detail, /generateStaticParams/);
  for (const slug of ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]) {
    assert.match(library, new RegExp(slug));
    assert.match(indexNow, new RegExp(`/fantasy-football-rest-of-season-rankings/${slug}`));
  }
  assert.match(page, /rest_of_season_rankings_viewed/);
  assert.match(page, /ItemList/);
  assert.match(table, /PPR/);
  assert.match(table, /Half PPR/);
  assert.match(table, /Standard/);
  assert.match(table, /rest_of_season_rankings_scoring_changed/);
  assert.match(buySell, /buy_low_sell_high_viewed/);
  assert.match(buySell, /Buy low/);
  assert.match(buySell, /Sell high/);
  assert.match(sitemap, /restOfSeasonPositionConfigs/);
  assert.match(sitemap, /fantasy-football-buy-low-sell-high/);
  assert.match(playbook, /E11: rest-of-season rankings/);
  assert.match(playbook, /E12: buy low \/ sell high/);
});
