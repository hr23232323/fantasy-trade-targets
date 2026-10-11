import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { arbitrageCalculation, roundRobinCalculation, teaserCalculation } from "../src/app/lib/odds-math.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [ui, frame, hub, roundRobinPage, arbitragePage, teaserPage, oddsPage, sitemap, indexNow, footer, methodology, playbook] = await Promise.all([
  read("../src/app/components/BettingCalculators.tsx"),
  read("../src/app/components/BettingCalculatorPageFrame.tsx"),
  read("../src/app/betting-calculators/page.tsx"),
  read("../src/app/round-robin-calculator/page.tsx"),
  read("../src/app/arbitrage-betting-calculator/page.tsx"),
  read("../src/app/teaser-calculator/page.tsx"),
  read("../src/app/odds-calculator/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/methodology/page.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("round-robin math creates every combination without treating the entry as one parlay", () => {
  const result = roundRobinCalculation([-110, 120, -105, 150], 2, 5);
  assert.equal(result?.betCount, 6);
  assert.equal(result?.totalStake, 30);
  assert.equal(result?.maxPayout.toFixed(2), "136.88");
  assert.equal(result?.maxProfit.toFixed(2), "106.88");
  assert.equal(result?.minimumWinningLegs, 2);
  assert.equal(roundRobinCalculation([-110, 120], 2, 5), null, "a round robin needs at least three legs");
  assert.equal(roundRobinCalculation([-110, 120, -105], 3, 5), null, "the combination must be smaller than the card");
  assert.equal(roundRobinCalculation([-110, 99, -105], 2, 5), null, "invalid American odds fail closed");
});

test("arbitrage allocation equalizes return and labels positive and negative books correctly", () => {
  const positive = arbitrageCalculation([110, 110], 100);
  assert.equal(positive?.impliedTotal.toFixed(6), "0.952381");
  assert.deepEqual(positive?.stakes, [50, 50]);
  assert.equal(positive?.lockedReturn.toFixed(2), "105.00");
  assert.equal(positive?.lockedProfit.toFixed(2), "5.00");
  assert.equal(positive?.roi.toFixed(4), "0.0500");
  assert.equal(positive?.isArbitrage, true);

  const negative = arbitrageCalculation([-110, -110], 100);
  assert.equal(negative?.lockedProfit.toFixed(2), "-4.55");
  assert.equal(negative?.isArbitrage, false);
  assert.equal(arbitrageCalculation([110], 100), null);
  assert.equal(arbitrageCalculation([110, 90], 100), null);
});

test("teaser math moves spread, over and under lines in the correct directions", () => {
  const result = teaserCalculation([{ type: "spread", line: -7.5 }, { type: "over", line: 45.5 }, { type: "under", line: 42 }], 6, -120, 25);
  assert.deepEqual(result?.adjustedLines, [-1.5, 39.5, 48]);
  assert.equal(result?.profit.toFixed(2), "20.83");
  assert.equal(result?.payout.toFixed(2), "45.83");
  assert.equal(teaserCalculation([{ type: "spread", line: -7.5 }], 6, -120, 25), null);
  assert.equal(teaserCalculation([{ type: "spread", line: -7.5 }, { type: "moneyline", line: 100 }], 6, -120, 25), null);
});

test("E21 publishes three distinct answer-first tools and deepens the canonical odds page", () => {
  for (const [page, path, event] of [
    [roundRobinPage, "/round-robin-calculator", "round_robin_calculator_viewed"],
    [arbitragePage, "/arbitrage-betting-calculator", "arbitrage_calculator_viewed"],
    [teaserPage, "/teaser-calculator", "teaser_calculator_viewed"],
  ]) {
    assert.ok(page.includes(`canonical: "${path}"`));
    assert.ok(page.includes(event));
    assert.ok(page.includes("BettingCalculatorPageFrame"));
  }
  assert.match(frame, /WebApplication/);
  assert.match(hub, /Eight free tools/);
  assert.match(hub, /round-robin-calculator/);
  assert.match(hub, /arbitrage-betting-calculator/);
  assert.match(hub, /teaser-calculator/);
  assert.match(oddsPage, /American odds and implied probability chart/);
  assert.doesNotMatch(oddsPage, /implied-probability-calculator/);
});

test("E21 is crawlable, internally linked, documented and privacy-safe", () => {
  const routes = ["/round-robin-calculator", "/arbitrage-betting-calculator", "/teaser-calculator"];
  for (const route of routes) {
    assert.ok(sitemap.includes(route), `${route} appears in sitemap source`);
    assert.ok(indexNow.includes(route), `${route} appears in IndexNow source`);
    assert.ok(hub.includes(route), `${route} appears on the calculator hub`);
  }
  assert.match(footer, /round-robin-calculator/);
  assert.match(footer, /arbitrage-betting-calculator/);
  assert.match(methodology, /ROUND ROBIN BETS/);
  assert.match(methodology, /ARBITRAGE TOTAL/);
  assert.match(methodology, /TEASER LINE/);
  assert.match(playbook, /E21: combination and line calculators/);
  assert.doesNotMatch(ui, /captureAnalytics\([^\n]+(?:odds|stake|line|points):/);
  for (const source of [ui, hub, roundRobinPage, arbitragePage, teaserPage, oddsPage, frame]) assert.doesNotMatch(source, /DataForSEO|keyword difficulty|SEO experiment|Search Console|first cohort/i);
});
