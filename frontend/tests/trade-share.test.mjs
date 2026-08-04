import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTradeShareParams,
  buildTradeShareSlug,
  buildTradeTitle,
  calculatorPathForFormat,
  resolveTradeShare,
} from "../src/app/lib/trade-share.mjs";

const bijan = {
  id: "bijan-robinson-rb",
  slug: "bijan-robinson-rb",
  name: "Bijan Robinson",
  position: "RB",
  kind: "player",
  value: 782,
};
const gibbs = {
  id: "jahmyr-gibbs-rb",
  slug: "jahmyr-gibbs-rb",
  name: "Jahmyr Gibbs",
  position: "RB",
  kind: "player",
  value: 761,
};
const pick = {
  id: "2027-round-1-mid",
  slug: "2027-round-1-mid",
  name: "2027 Mid 1st",
  position: "PICK",
  kind: "pick",
  value: 420,
};

test("shared trades receive readable, bounded paths", () => {
  assert.equal(
    buildTradeShareSlug([bijan], [gibbs]),
    "bijan-robinson-rb-for-jahmyr-gibbs-rb",
  );
  assert.equal(
    buildTradeShareSlug([bijan, pick], [gibbs]),
    "bijan-robinson-rb-plus-1-for-jahmyr-gibbs-rb",
  );
});

test("share parameters round-trip every calculator setting and package", () => {
  const params = buildTradeShareParams({
    format: "dynasty",
    numQbs: 2,
    tep: true,
    numTeams: 14,
    rosterPremium: false,
    sideA: [bijan, pick],
    sideB: [gibbs],
  });
  const resolved = resolveTradeShare(params, [bijan, gibbs, pick]);

  assert.deepEqual(resolved, {
    format: "dynasty",
    numQbs: 2,
    tep: true,
    numTeams: 14,
    rosterPremium: false,
    sideA: [bijan, pick],
    sideB: [gibbs],
  });
});

test("unknown and duplicate assets are discarded across both sides", () => {
  const resolved = resolveTradeShare(
    new URLSearchParams({
      get: `${bijan.id},missing,${bijan.id}`,
      send: `${bijan.id},${gibbs.id}`,
      teams: "99",
    }),
    [bijan, gibbs],
  );

  assert.deepEqual(resolved.sideA, [bijan]);
  assert.deepEqual(resolved.sideB, [gibbs]);
  assert.equal(resolved.numTeams, 12);
  assert.equal(resolved.rosterPremium, true);
});

test("trade labels and editor destinations stay deterministic", () => {
  assert.equal(
    buildTradeTitle([bijan, pick], [gibbs]),
    "Bijan Robinson + 1 more for Jahmyr Gibbs",
  );
  assert.equal(calculatorPathForFormat("dynasty"), "/dynasty-trade-calculator");
  assert.equal(calculatorPathForFormat("redraft"), "/fantasy-football-trade-analyzer");
});
