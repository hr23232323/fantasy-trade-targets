import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { americanFromDecimal, hedgeCalculation, kellyCalculation, noVigMarket, parlayCalculation } from "../src/app/lib/odds-math.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [ui, frame, hub, parlayPage, noVigPage, hedgePage, kellyPage, oddsPage, sitemap, indexNow, footer, predictionHub, methodology, playbook] = await Promise.all([
  read("../src/app/components/BettingCalculators.tsx"),
  read("../src/app/components/BettingCalculatorPageFrame.tsx"),
  read("../src/app/betting-calculators/page.tsx"),
  read("../src/app/parlay-calculator/page.tsx"),
  read("../src/app/no-vig-calculator/page.tsx"),
  read("../src/app/hedge-bet-calculator/page.tsx"),
  read("../src/app/kelly-criterion-calculator/page.tsx"),
  read("../src/app/odds-calculator/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/nfl-picks-predictions/page.tsx"),
  read("../src/app/methodology/page.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("parlay math multiplies decimal prices and returns coherent payout", () => {
  assert.equal(americanFromDecimal(2), 100);
  assert.equal(americanFromDecimal(1.5), -200);
  assert.equal(americanFromDecimal(1), null);
  const result = parlayCalculation([-110, 150, -125], 25);
  assert.equal(result?.combinedDecimal.toFixed(6), "8.590909");
  assert.equal(result?.combinedAmerican, 759);
  assert.equal(result?.impliedProbability.toFixed(6), "0.116402");
  assert.equal(result?.profit.toFixed(2), "189.77");
  assert.equal(result?.payout.toFixed(2), "214.77");
  assert.equal(parlayCalculation([-110], 25), null);
  assert.equal(parlayCalculation([-110, 99], 25), null);
});

test("no-vig, Kelly and hedge calculations remain bounded and reproducible", () => {
  const market = noVigMarket([-110, -110]);
  assert.deepEqual(market?.fairProbabilities, [0.5, 0.5]);
  assert.equal(market?.hold.toFixed(6), "0.047619");
  const kelly = kellyCalculation(150, 0.45, 1000, 0.5);
  assert.equal(kelly?.fullKelly.toFixed(6), "0.083333");
  assert.equal(kelly?.selectedKelly.toFixed(6), "0.041667");
  assert.equal(kelly?.stake.toFixed(2), "41.67");
  assert.equal(kellyCalculation(-110, 0.4, 1000, 1)?.stake, 0, "negative edge never recommends a negative stake");
  assert.equal(kellyCalculation(150, 1.2, 1000, 1), null);
  const hedge = hedgeCalculation(200, 100, -110);
  assert.equal(hedge?.hedgeStake.toFixed(2), "157.14");
  assert.equal(hedge?.equalizedProfit.toFixed(2), "42.86");
  assert.equal(hedge?.totalStaked.toFixed(2), "257.14");
});

test("E20 publishes five distinct, interactive and answer-first calculator pages", () => {
  const pages = [hub, parlayPage, noVigPage, hedgePage, kellyPage];
  assert.equal(pages.length, 5);
  assert.match(hub, /betting_calculators_viewed/);
  assert.match(hub, /"@type": "CollectionPage"/);
  for (const [page, event] of [[parlayPage, "parlay_calculator_viewed"], [noVigPage, "no_vig_calculator_viewed"], [hedgePage, "hedge_calculator_viewed"], [kellyPage, "kelly_calculator_viewed"]]) assert.ok(page.includes(event));
  assert.match(frame, /"@type": "WebApplication"/);
  assert.match(frame, /"@type": "FAQPage"/);
  assert.match(ui, /parlay_calculator_leg_added/);
  assert.match(ui, /no_vig_calculator_changed/);
  assert.match(ui, /kelly_calculator_changed/);
  assert.match(ui, /hedge_calculator_changed/);
  assert.match(methodology, /PARLAY DECIMAL ODDS = PRODUCT/);
  assert.match(playbook, /E20: betting calculator suite/);
});

test("the calculator suite is crawlable, internally linked and privacy-safe", () => {
  const routes = ["/betting-calculators", "/parlay-calculator", "/no-vig-calculator", "/hedge-bet-calculator", "/kelly-criterion-calculator"];
  for (const route of routes) {
    assert.ok(sitemap.includes(route), `${route} appears in sitemap source`);
    assert.ok(indexNow.includes(route), `${route} appears in IndexNow source`);
  }
  assert.match(footer, /\/betting-calculators/);
  assert.match(footer, /\/parlay-calculator/);
  assert.match(predictionHub, /\/betting-calculators/);
  assert.match(oddsPage, /\/betting-calculators/);
  assert.doesNotMatch(ui, /captureAnalytics\([^\n]+(?:odds|stake|bankroll|probability):/);
  for (const page of [hub, parlayPage, noVigPage, hedgePage, kellyPage, frame, ui]) assert.doesNotMatch(page, /DataForSEO|keyword difficulty|SEO experiment|Search Console|first cohort/i);
});
