import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { americanOddsProbability, buildWeekPredictions, fairMarketProbability, MODEL_VERSION } from "../src/app/lib/nfl-prediction-model.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [teams, release, generator, hub, weekPage, gamePage, sharedPage, library, disclosure, sitemap, indexNow, header, footer, methodology, sources, workflow, playbook] = await Promise.all([
  read("../data/team-release.json").then(JSON.parse),
  read("../data/nfl-prediction-snapshots.json").then(JSON.parse),
  read("../scripts/generate-nfl-predictions.mjs"),
  read("../src/app/nfl-picks-predictions/page.tsx"),
  read("../src/app/nfl-picks-predictions/[weekSlug]/page.tsx"),
  read("../src/app/nfl-picks-predictions/[weekSlug]/[gameSlug]/page.tsx"),
  read("../src/app/components/NflPredictionWeekPage.tsx"),
  read("../src/app/lib/nfl-predictions.ts"),
  read("../src/app/components/BettingDisclosure.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/SiteHeader.tsx"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/methodology/page.tsx"),
  read("../src/app/data-sources/page.tsx"),
  read("../../.github/workflows/data-refresh.yml"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("the first betting cohort is a bounded 19-page experiment", () => {
  assert.deepEqual(release.publishedWeeks, [5]);
  assert.equal(Object.keys(release.games).length, 15);
  assert.equal(Object.values(release.games).filter(({ status }) => status === "pregame").length, 14);
  assert.equal(Object.values(release.games).filter(({ status }) => status === "result_only").length, 1);
  assert.equal(release.modelVersion, MODEL_VERSION);
  assert.equal(teams.predictionModel.modelVersion, MODEL_VERSION);
  assert.deepEqual(teams.predictionModel.validation, { season: 2025, weeks: "5-18", games: 208, straightUp: { correct: 125, graded: 208, accuracy: 0.601 }, againstSpread: { wins: 81, losses: 82, pushes: 1, passes: 44, winRate: 0.497 }, totals: { wins: 81, losses: 80, pushes: 0, passes: 47, winRate: 0.503 }, scoreMae: 7.63 });
  assert.match(playbook, /E17: NFL picks and predictions/);
  assert.match(playbook, /First 19-page cohort/);
});

test("every prediction uses validated market fields and bounded model outputs", () => {
  for (const snapshot of Object.values(release.games)) {
    assert.ok(teams.teams[snapshot.homeAbbr]);
    assert.ok(teams.teams[snapshot.awayAbbr]);
    assert.ok(Number.isFinite(snapshot.market.spreadLine));
    assert.ok(Number.isFinite(snapshot.market.totalLine));
    assert.ok(Number.isFinite(snapshot.market.homeMoneyline));
    assert.ok(Number.isFinite(snapshot.market.awayMoneyline));
    if (snapshot.status !== "pregame") continue;
    assert.ok(snapshot.modelHomeMargin >= -21 && snapshot.modelHomeMargin <= 21);
    assert.ok(snapshot.modelTotal >= 30 && snapshot.modelTotal <= 65);
    assert.ok(snapshot.projectedHomeScore >= 0 && snapshot.projectedAwayScore >= 0);
    assert.ok(snapshot.homeWinProbability > 0 && snapshot.homeWinProbability < 1);
    assert.ok(Math.abs(snapshot.projectedHomeScore + snapshot.projectedAwayScore - snapshot.modelTotal) <= 0.11);
  }
});

test("Week 5 projections cannot leak Week 5 results", () => {
  const before = buildWeekPredictions({ teams: teams.teams, week: 5, capturedAt: teams.capturedAt });
  const modified = structuredClone(teams.teams);
  for (const team of Object.values(modified)) {
    for (const game of team.schedule.filter(({ week }) => week === 5)) {
      game.teamScore = game.site === "home" ? 70 : 0;
      game.opponentScore = game.site === "home" ? 0 : 70;
      game.result = game.site === "home" ? "W" : "L";
    }
  }
  const after = buildWeekPredictions({ teams: modified, week: 5, capturedAt: teams.capturedAt });
  assert.deepEqual(after, before);
});

test("American odds and no-vig market probability math stay coherent", () => {
  assert.equal(americanOddsProbability(-110)?.toFixed(4), "0.5238");
  assert.equal(americanOddsProbability(150)?.toFixed(4), "0.4000");
  assert.equal(americanOddsProbability(99), null);
  assert.equal(fairMarketProbability(-110, -110)?.toFixed(4), "0.5000");
  const fair = fairMarketProbability(-148, 124);
  assert.ok(fair > 0.56 && fair < 0.58);
});

test("pregame snapshots lock at kickoff and never manufacture old picks", () => {
  assert.match(generator, /if \(existing && gameStarted\(game, teamRelease\.capturedAt\)\) continue/);
  assert.match(generator, /status: "result_only"/);
  assert.match(generator, /America\/New_York/);
  assert.match(generator, /publishedWeeks.*activeWeek/);
  assert.doesNotMatch(generator, /Math\.random/);
});

test("prediction pages answer every intent with AEO structure and consumer copy", () => {
  assert.match(hub, /NFL picks and predictions/);
  assert.match(hub, /nfl_prediction_hub_viewed/);
  assert.match(weekPage, /NFL Week \$\{week\} Picks and Predictions/);
  assert.match(sharedPage, /nfl_prediction_week_viewed/);
  assert.match(sharedPage, /nfl_ats_picks_viewed/);
  assert.match(sharedPage, /nfl_totals_picks_viewed/);
  assert.match(sharedPage, /"@type": "CollectionPage"/);
  assert.match(sharedPage, /"@type": "FAQPage"/);
  assert.match(gamePage, /nfl_game_prediction_viewed/);
  assert.match(gamePage, /"@type": "SportsEvent"/);
  assert.match(gamePage, /"@type": "FAQPage"/);
  assert.match(gamePage, /No retroactive pick/);
  assert.match(sharedPage, /effectively coin flips/);
  assert.match(gamePage, /model-to-market|Model vs\. market/i);
  for (const page of [hub, sharedPage, gamePage]) assert.doesNotMatch(page, /DataForSEO|Search Console|keyword difficulty|SEO experiment/i);
});

test("responsible gambling and provenance are visible wherever picks publish", () => {
  assert.match(disclosure, /not guaranteed outcomes/);
  assert.match(disclosure, /legal age requirement/);
  assert.match(disclosure, /1-800-MY-RESET/);
  assert.match(gamePage, /BettingDisclosure/);
  assert.match(sharedPage, /BettingDisclosure/);
  assert.match(hub, /BettingDisclosure/);
  assert.match(sources, /No sportsbook scraping/);
  assert.match(sources, /CC BY 4\.0/);
  assert.match(methodology, /Pregame numbers and the attached market snapshot freeze at kickoff|freezes the complete record at kickoff/);
});

test("the new family is crawlable, linked, tracked and refreshed", () => {
  for (const source of [sitemap, indexNow, header, footer]) assert.ok(source.includes("/nfl-picks-predictions"));
  assert.match(sitemap, /allPredictionGameParams/);
  assert.match(indexNow, /predictionRelease\.games/);
  assert.match(library, /allPredictionGameParams/);
  assert.match(workflow, /npm run data:predictions/);
  assert.match(workflow, /nfl-prediction-snapshots\.json/);
});
