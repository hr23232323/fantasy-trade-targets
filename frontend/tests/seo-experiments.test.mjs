import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  manifest,
  playerPages,
  release,
  playerPickLib,
  playerPickHub,
  playerPickDetail,
  scheduleLib,
  scheduleHub,
  scheduleDetail,
  sitemap,
  indexNow,
  footer,
  playbook,
] = await Promise.all([
  read("../data/player-pick-comparisons.json").then(JSON.parse),
  read("../data/player-pages.json").then(JSON.parse),
  read("../data/public-release.json").then(JSON.parse),
  read("../src/app/lib/player-pick-comparisons.ts"),
  read("../src/app/player-vs-rookie-pick/page.tsx"),
  read("../src/app/player-vs-rookie-pick/[slug]/page.tsx"),
  read("../src/app/lib/schedule-ratings.ts"),
  read("../src/app/fantasy-football-strength-of-schedule/page.tsx"),
  read("../src/app/fantasy-football-strength-of-schedule/[slug]/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("player-vs-pick launches a bounded set of 20 real decisions", () => {
  assert.equal(manifest.length, 20);
  assert.equal(new Set(manifest.map((page) => page.slug)).size, 20);
  assert.equal(new Set(manifest.map((page) => page.playerSlug)).size, 20);
  assert.equal(new Set(manifest.map((page) => page.pickId)).size, 20);

  const publishedPlayers = new Set(playerPages.map((player) => player.slug));
  const players = new Map(release.playerMarkets["dynasty:2:0"].data.map((player) => [player.slug, player]));
  const picks = new Map(release.pickMarkets["2:12"].data.map((pick) => [pick.id, pick]));
  for (const page of manifest) {
    assert.match(page.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-2027-pick-[12]-\d{2}$/);
    assert.ok(publishedPlayers.has(page.playerSlug), `${page.playerSlug} needs a published player file`);
    const player = players.get(page.playerSlug);
    const pick = picks.get(page.pickId);
    assert.ok(player, `${page.playerSlug} exists in Superflex`);
    assert.ok(pick, `${page.pickId} exists in the 12-team pick market`);
    assert.ok(Number.isFinite(player.composite), `${page.playerSlug} retains a finite current value`);
    assert.ok(Number.isFinite(pick.composite), `${page.pickId} retains a finite current value`);
  }
});

test("player-vs-pick pages answer both formats and connect to conversion", () => {
  assert.match(playerPickLib, /getMarket\(\{ format: "dynasty", numQbs: 2/);
  assert.match(playerPickLib, /getMarket\(\{ format: "dynasty", numQbs: 1/);
  assert.match(playerPickDetail, /The short answer/);
  assert.match(playerPickDetail, /12-team Superflex/);
  assert.match(playerPickDetail, /12-team 1QB/);
  assert.match(playerPickDetail, /player_pick_comparison_experiment_viewed/);
  assert.match(playerPickDetail, /player_pick_calculator_opened/);
  assert.match(playerPickDetail, /"@type": "FAQPage"/);
  assert.match(playerPickHub, /player_pick_comparison_hub_viewed/);
  assert.match(sitemap, /playerPickComparisons\.map/);
  assert.match(indexNow, /playerPickComparisons\.map/);
  assert.match(footer, /Player vs\. rookie pick/);
});

test("schedule ratings form one complete 18-week cohort with 32 teams per week", () => {
  assert.match(scheduleLib, /scheduleRatingSlugs = regularSeasonWeeks\.map/);
  assert.match(scheduleLib, /environmentScore/);
  assert.match(scheduleHub, /scheduleRatingSlugs\.map/);
  assert.match(scheduleDetail, /ratings\.length !== 32/);
  assert.match(scheduleDetail, /schedule_rating_experiment_viewed/);
  assert.match(scheduleDetail, /A schedule grade, not a projection/);
  assert.match(scheduleDetail, /"@type": "Dataset"/);
  assert.match(sitemap, /scheduleRatingSlugs\.map/);
  assert.match(indexNow, /scheduleRatingPaths/);
  assert.match(footer, /Strength of schedule/);
});

test("the experiment playbook preserves test-before-scale discipline", () => {
  for (const phrase of [
    "The default batch is 10–20 detail pages",
    "Day 3: discovery and correctness",
    "Day 7: directional read",
    "Day 14: first scale decision",
    "Day 28: keep, revise, or consolidate",
    "Do not generate every pair",
    "Start/sit launch gate",
  ]) assert.ok(playbook.includes(phrase), `playbook includes ${phrase}`);
  assert.match(playbook, /E1: individual game matchups/);
  assert.match(playbook, /E2: weekly schedule ratings/);
  assert.match(playbook, /E3: player vs\. exact rookie pick/);
  assert.match(playbook, /E4: league-size rankings/);
});
