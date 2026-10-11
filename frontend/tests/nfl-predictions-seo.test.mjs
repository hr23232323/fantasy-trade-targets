import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { americanOddsProbability, buildWeekPredictions, fairMarketProbability, MODEL_VERSION } from "../src/app/lib/nfl-prediction-model.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [teams, release, generator, hub, weekPage, gamePage, sharedPage, poolPage, straightRoute, scoreRoute, survivorRoute, confidenceRoute, library, disclosure, sitemap, indexNow, header, footer, methodology, sources, workflow, playbook] = await Promise.all([
  read("../data/team-release.json").then(JSON.parse),
  read("../data/nfl-prediction-snapshots.json").then(JSON.parse),
  read("../scripts/generate-nfl-predictions.mjs"),
  read("../src/app/nfl-picks-predictions/page.tsx"),
  read("../src/app/nfl-picks-predictions/[weekSlug]/page.tsx"),
  read("../src/app/nfl-picks-predictions/[weekSlug]/[gameSlug]/page.tsx"),
  read("../src/app/components/NflPredictionWeekPage.tsx"),
  read("../src/app/components/NflPoolWeekPage.tsx"),
  read("../src/app/nfl-straight-up-picks/[weekSlug]/page.tsx"),
  read("../src/app/nfl-score-predictions/[weekSlug]/page.tsx"),
  read("../src/app/nfl-survivor-picks/[weekSlug]/page.tsx"),
  read("../src/app/nfl-confidence-pool-picks/[weekSlug]/page.tsx"),
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

test("the second betting wave is a bounded 44-page decision family", () => {
  assert.equal(release.activeWeek, 5);
  assert.deepEqual(release.publishedWeeks, [5, 6]);
  assert.equal(Object.keys(release.games).length, 29);
  assert.equal(Object.values(release.games).filter(({ status }) => status === "pregame").length, 28);
  assert.equal(Object.values(release.games).filter(({ status }) => status === "result_only").length, 1);
  assert.equal(1 + release.publishedWeeks.length * 7 + Object.keys(release.games).length, 44);
  assert.equal(release.modelVersion, MODEL_VERSION);
  assert.equal(teams.predictionModel.modelVersion, MODEL_VERSION);
  assert.deepEqual(teams.predictionModel.validation, { season: 2025, weeks: "5-18", games: 208, straightUp: { correct: 125, graded: 208, accuracy: 0.601 }, againstSpread: { wins: 81, losses: 82, pushes: 1, passes: 44, winRate: 0.497 }, totals: { wins: 81, losses: 80, pushes: 0, passes: 47, winRate: 0.503 }, scoreMae: 7.63 });
  assert.match(playbook, /E17: NFL picks and predictions/);
  assert.match(playbook, /E18: NFL pool and score decisions/);
  assert.match(playbook, /Adds 25 URLs/);
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

test("current and preview projections cannot leak their target-week results", () => {
  for (const week of [5, 6]) {
    const before = buildWeekPredictions({ teams: teams.teams, week, capturedAt: teams.capturedAt });
    const modified = structuredClone(teams.teams);
    for (const team of Object.values(modified)) {
      for (const game of team.schedule.filter((candidate) => candidate.week === week)) {
        game.teamScore = game.site === "home" ? 70 : 0;
        game.opponentScore = game.site === "home" ? 0 : 70;
        game.result = game.site === "home" ? "W" : "L";
      }
    }
    const after = buildWeekPredictions({ teams: modified, week, capturedAt: teams.capturedAt });
    assert.deepEqual(after, before);
  }
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
  assert.match(generator, /previewWeek/);
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
  assert.match(poolPage, /nfl_straight_up_picks_viewed/);
  assert.match(poolPage, /nfl_score_predictions_viewed/);
  assert.match(poolPage, /nfl_survivor_picks_viewed/);
  assert.match(poolPage, /nfl_confidence_pool_picks_viewed/);
  assert.match(poolPage, /"@type": "CollectionPage"/);
  assert.match(poolPage, /"@type": "FAQPage"/);
  assert.match(library, /if \(home === away\)/);
  assert.match(straightRoute, /Straight-Up Picks/);
  assert.match(scoreRoute, /Score Predictions for Every Game/);
  assert.match(survivorRoute, /Survivor Picks & Win Probabilities/);
  assert.match(confidenceRoute, /Confidence Pool Picks & Rankings/);
  assert.match(sharedPage, /effectively coin flips/);
  assert.match(gamePage, /model-to-market|Model vs\. market/i);
  for (const page of [hub, sharedPage, poolPage, gamePage]) assert.doesNotMatch(page, /DataForSEO|Search Console|keyword difficulty|SEO experiment/i);
});

test("responsible gambling and provenance are visible wherever picks publish", () => {
  assert.match(disclosure, /not guaranteed outcomes/);
  assert.match(disclosure, /legal age requirement/);
  assert.match(disclosure, /1-800-MY-RESET/);
  assert.match(gamePage, /BettingDisclosure/);
  assert.match(sharedPage, /BettingDisclosure/);
  assert.match(poolPage, /BettingDisclosure/);
  assert.match(hub, /BettingDisclosure/);
  assert.match(sources, /No sportsbook scraping/);
  assert.match(sources, /CC BY 4\.0/);
  assert.match(methodology, /Pregame numbers and the attached market snapshot freeze at kickoff|freezes the complete record at kickoff/);
});

test("the new family is crawlable, linked, tracked and refreshed", () => {
  for (const source of [sitemap, indexNow, header, footer]) assert.ok(source.includes("/nfl-picks-predictions"));
  assert.match(sitemap, /allPredictionGameParams/);
  for (const family of ["straightUpWeekPath", "scorePredictionsWeekPath", "survivorWeekPath", "confidenceWeekPath"]) {
    assert.ok(sitemap.includes(family));
    assert.ok(library.includes(family));
  }
  assert.match(indexNow, /predictionRelease\.games/);
  for (const family of ["nfl-straight-up-picks", "nfl-score-predictions", "nfl-survivor-picks", "nfl-confidence-pool-picks"]) assert.ok(indexNow.includes(family));
  assert.match(library, /allPredictionGameParams/);
  assert.match(workflow, /npm run data:predictions/);
  assert.match(workflow, /nfl-prediction-snapshots\.json/);
});
