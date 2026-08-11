import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [calculator, dataSources, methodology] = await Promise.all([
  readFile(new URL("../src/app/components/TradeCalculator.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/data-sources/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/methodology/page.tsx", import.meta.url), "utf8"),
]);

test("calculator explains every supported scoring choice at the decision point", () => {
  assert.match(calculator, /Standard awards 0 points per catch/);
  assert.match(calculator, /PPR means points per reception/);
  assert.match(calculator, /Half PPR awards 0\.5/);
  assert.match(calculator, /Full PPR awards 1/);
  assert.match(calculator, /Six-point scoring adds two raw points per passing touchdown/);
  assert.match(calculator, /role="tooltip"/);
  assert.match(calculator, /group-focus-within:visible/);
  assert.match(calculator, /aria-describedby=\{id\}/);
  assert.match(calculator, /aria-pressed=\{value === optionValue\}/);
  assert.match(calculator, /captureAnalytics\("trade_help_opened"/);
  assert.match(calculator, /players move only when their scoring change differs from a replacement player/i);
  assert.match(calculator, /Roster shape/);
  assert.match(calculator, /FLEX does not change fantasy points/);
});

test("data sources documents inputs, scoring definitions, and adjustment guardrails", () => {
  assert.match(dataSources, /id="scoring-data"/);
  assert.match(dataSources, /Tradyr’s composite market is always the anchor/);
  assert.match(dataSources, /Standard:<\/strong> 0 per catch/);
  assert.match(dataSources, /PPR means points per reception/);
  assert.match(dataSources, /Half PPR:<\/strong> 0\.5 per catch/);
  assert.match(dataSources, /Full PPR:<\/strong> 1 per catch/);
  assert.match(dataSources, /caps movement at ±12% in dynasty or ±20% in redraft/);
  assert.match(dataSources, /4-point passing touchdowns and Full PPR/);
  assert.match(dataSources, /dedicated starters and FLEX demand are allocated/);
  assert.match(dataSources, /href="\/scoring-impact"/);
});

test("methodology exposes a stable scoring anchor and plain-language PPR definitions", () => {
  assert.match(methodology, /id="league-scoring"/);
  assert.match(methodology, /PPR means points per reception/);
  assert.match(methodology, /0 points per reception/);
  assert.match(methodology, /0\.5 points per reception/);
  assert.match(methodology, /1 point per reception/);
  assert.match(methodology, /neutral roster baseline/);
  assert.match(methodology, /FLEX demand is then assigned/);
  assert.match(methodology, /does not alter anyone&apos;s raw fantasy points/);
  assert.match(methodology, /Methodology \/\/ 2026\.08\.3/);
});
