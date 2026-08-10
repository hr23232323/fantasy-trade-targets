import assert from "node:assert/strict";
import test from "node:test";
import {
  applyScoringContext,
  buildScoringProfile,
  calculateFantasyPoints,
} from "../src/app/lib/scoring-engine.mjs";

function profile(perGame, confidence = 1) {
  return {
    modelVersion: "test",
    observedThroughSeason: "2025",
    seasons: ["2025"],
    weightedGames: 17,
    confidence,
    perGame: {
      passingYards: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTouchdowns: 0,
      fumblesLost: 0,
      passingTwoPointConversions: 0,
      rushingTwoPointConversions: 0,
      receivingTwoPointConversions: 0,
      ...perGame,
    },
  };
}

test("four- and six-point passing touchdowns use the published raw formula", () => {
  const quarterback = profile({
    passingYards: 250,
    passingTouchdowns: 2,
    interceptions: 1,
    rushingYards: 20,
    rushingTouchdowns: 0.2,
  });

  assert.equal(calculateFantasyPoints(quarterback, { passingTdPoints: 4 }), 19.2);
  assert.equal(calculateFantasyPoints(quarterback, { passingTdPoints: 6 }), 23.2);
});

test("standard, half, and full PPR differ by exactly the reception value", () => {
  const receiver = profile({
    receptions: 6,
    receivingYards: 80,
    receivingTouchdowns: 0.5,
  });

  assert.equal(calculateFantasyPoints(receiver, { receptionPoints: 0 }), 11);
  assert.equal(calculateFantasyPoints(receiver, { receptionPoints: 0.5 }), 14);
  assert.equal(calculateFantasyPoints(receiver, { receptionPoints: 1 }), 17);
});

test("all six supported passing-TD and reception combinations compose exactly", () => {
  const dualThreat = profile({ passingTouchdowns: 2, receptions: 4 });
  const expected = new Map([
    ["4:0", 8],
    ["4:0.5", 10],
    ["4:1", 12],
    ["6:0", 12],
    ["6:0.5", 14],
    ["6:1", 16],
  ]);

  for (const passingTdPoints of [4, 6]) {
    for (const receptionPoints of [0, 0.5, 1]) {
      assert.equal(
        calculateFantasyPoints(dualThreat, {
          passingTdPoints,
          receptionPoints,
        }),
        expected.get(`${passingTdPoints}:${receptionPoints}`),
      );
    }
  }
});

test("profiles weight recent per-game seasons and reduce confidence for small samples", () => {
  const built = buildScoringProfile({
    career: [
      {
        season: "2025",
        gamesPlayed: 4,
        seasonTotals: { gp: 4, pass_td: 8 },
      },
      {
        season: "2024",
        gamesPlayed: 16,
        seasonTotals: { gp: 16, pass_td: 16 },
      },
    ],
  });

  assert.ok(built);
  assert.deepEqual(built.seasons, ["2025", "2024"]);
  assert.ok(built.perGame.passingTouchdowns > 1);
  assert.ok(built.perGame.passingTouchdowns < 2);
  assert.ok(built.confidence > 0);
  assert.ok(built.confidence < 1);
});

test("market adjustments compare scoring change with positional replacement", () => {
  const touchdownRates = [3.2, 2.9, 2.6, 2.3, 2, 1.8, 1.6, 1.4, 1.2, 0.6];
  const assets = touchdownRates.map((passingTouchdowns, index) => ({
    id: `qb-${index + 1}`,
    slug: `qb-${index + 1}`,
    name: `Quarterback ${index + 1}`,
    position: "QB",
    kind: "player",
    value: 900 - index * 60,
    rank: index + 1,
    posRank: index + 1,
  }));
  const profiles = Object.fromEntries(
    assets.map((asset, index) => [
      asset.slug,
      profile({
        passingYards: 240,
        passingTouchdowns: touchdownRates[index],
        rushingYards: index === 9 ? 70 : 10,
      }),
    ]),
  );

  const baseline = applyScoringContext(assets, profiles, {
    format: "dynasty",
    numTeams: 8,
    numQbs: 1,
    passingTdPoints: 4,
    receptionPoints: 1,
  });
  assert.equal(baseline.meta.adjustedCount, 0);
  assert.ok(baseline.assets.every((asset) => asset.value === asset.baseValue));

  const sixPoint = applyScoringContext(assets, profiles, {
    format: "dynasty",
    numTeams: 8,
    numQbs: 1,
    passingTdPoints: 6,
    receptionPoints: 1,
  });
  assert.ok(sixPoint.assets[0].scoringContext.valueDelta > 0);
  assert.ok(sixPoint.assets.at(-1).scoringContext.valueDelta < 0);
  assert.ok(
    sixPoint.assets.every(
      (asset) => Math.abs(asset.scoringContext.adjustmentPercent) <= 12,
    ),
  );
});

test("picks and players without usable production remain at market value", () => {
  const result = applyScoringContext(
    [
      { id: "pick", slug: "pick", name: "2027 1st", position: "PICK", kind: "pick", value: 400 },
      { id: "qb", slug: "qb", name: "Unknown QB", position: "QB", kind: "player", value: 300, posRank: 1 },
    ],
    {},
    { passingTdPoints: 6, receptionPoints: 0 },
  );

  assert.equal(result.assets[0].value, 400);
  assert.equal(result.assets[1].value, 300);
  assert.equal(result.assets[1].scoringContext.available, false);
});
