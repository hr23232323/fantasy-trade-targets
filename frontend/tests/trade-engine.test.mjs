import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSide,
  evaluateTrade,
  findBalancingAssets,
} from "../src/app/lib/trade-engine.mjs";

const asset = (id, value) => ({ id, value, name: id, position: "WR" });

test("raw totals remain additive while extra pieces pay a roster cost", () => {
  const result = calculateSide([asset("a", 700), asset("b", 300), asset("c", 200)]);
  assert.equal(result.raw, 1200);
  assert.equal(result.adjusted, 1138);
  assert.equal(result.rosterCost, 62);
});

test("roster premium can be disabled", () => {
  const result = calculateSide([asset("a", 700), asset("b", 300)], false);
  assert.equal(result.raw, 1000);
  assert.equal(result.adjusted, 1000);
});

test("small gaps remain in the fair band", () => {
  const result = evaluateTrade([asset("a", 500)], [asset("b", 485)]);
  assert.equal(result.status, "fair");
  assert.equal(result.winner, "A");
});

test("large gaps create a strong edge", () => {
  const result = evaluateTrade([asset("a", 900)], [asset("b", 600)]);
  assert.equal(result.status, "strong");
  assert.equal(result.winner, "A");
});

test("balancing suggestions exclude already selected assets", () => {
  const candidates = [asset("a", 300), asset("b", 205), asset("c", 190)];
  const result = findBalancingAssets(candidates, new Set(["b"]), 200, 2);
  assert.deepEqual(result.map((item) => item.id), ["c", "a"]);
});
