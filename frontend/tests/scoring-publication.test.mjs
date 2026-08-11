import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  nextScoringRefreshCursor,
  selectScoringProfileCohort,
  usableScoringProfiles,
} from "../src/app/lib/scoring-publication.mjs";

const players = Array.from({ length: 8 }, (_, index) => ({
  slug: `player-${index + 1}`,
  rank: index + 1,
}));
const profile = {
  modelVersion: "2026.08.3",
  confidence: 1,
  perGame: { passingTouchdowns: 1, receptions: 1 },
};
const publisher = await readFile(
  new URL("../scripts/refresh-public-data.mjs", import.meta.url),
  "utf8",
);

test("publication cohorts fill missing and priority profiles before refreshes", () => {
  const cohort = selectScoringProfileCohort({
    players,
    existingProfiles: { "player-1": profile, "player-2": profile },
    prioritySlugs: ["player-4", "player-1"],
    batchSize: 4,
  });

  assert.deepEqual(
    cohort.map((player) => player.slug),
    ["player-4", "player-3", "player-5", "player-6"],
  );
});

test("complete coverage rotates refresh work deterministically", () => {
  const existingProfiles = Object.fromEntries(
    players.map((player) => [player.slug, profile]),
  );
  const cohort = selectScoringProfileCohort({
    players,
    existingProfiles,
    batchSize: 3,
    refreshCursor: 6,
  });

  assert.deepEqual(
    cohort.map((player) => player.slug),
    ["player-7", "player-8", "player-1"],
  );
  assert.equal(
    nextScoringRefreshCursor({ players, cohort, refreshCursor: 6 }),
    1,
  );
});

test("carried profiles are model-versioned, finite, and current-market only", () => {
  const profiles = usableScoringProfiles(
    {
      "player-1": profile,
      "player-2": { ...profile, modelVersion: "old" },
      "player-3": { ...profile, confidence: Number.NaN },
      missing: profile,
    },
    players.map((player) => player.slug),
  );

  assert.deepEqual(Object.keys(profiles), ["player-1"]);
});

test("publication fails fast when the upstream scoring layer is unavailable", () => {
  assert.match(publisher, /scoringHealthPlayer/);
  assert.match(publisher, /attempts: 1/);
  assert.match(publisher, /Tradyr scoring stats are unavailable/);
  assert.match(publisher, /preserving the prior release/);
});
