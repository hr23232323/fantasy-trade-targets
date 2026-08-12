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
  assert.match(publisher, /currentPlayersBySlug\.get\("josh-allen-qb"\)/);
  assert.match(publisher, /attempts: 1/);
  assert.match(publisher, /Tradyr scoring stats are unavailable/);
  assert.match(publisher, /preserving the prior release/);
});

test("publication rejects a player market that regresses from its prior release", () => {
  assert.match(publisher, /priorPlayerMarkets/);
  assert.match(publisher, /payload\.data\.length < priorCount/);
  assert.match(publisher, /regressed from.*players/);
});

test("anonymous publication overlaps slow requests without increasing its start rate", () => {
  assert.match(publisher, /requestIntervalMs = hasApiKey \? 75 : 1_100/);
  assert.match(publisher, /SCORING_PROFILE_CONCURRENCY\) \|\| 8/);
  assert.match(publisher, /TRADYR_REQUEST_TIMEOUT_MS\) \|\| 45_000/);
  assert.match(publisher, /scoringProfileConcurrency/);
});

test("scoring-only backfills can reuse already validated reviewed profiles", () => {
  assert.match(publisher, /REFRESH_REVIEWED_PLAYER_PROFILES !== "false"/);
  assert.match(publisher, /priorRelease\.playerProfiles/);
  assert.match(publisher, /Reusing.*reviewed player profiles/);
});

test("profile expansion preserves prior evidence through transient optional gaps", () => {
  assert.match(publisher, /REFRESH_MISSING_PLAYER_PROFILES_ONLY/);
  assert.match(publisher, /priorRelease\?\.playerProfiles\?\.\[slug\]/);
  assert.match(publisher, /preserveValidatedProfileEvidence/);
  assert.match(publisher, /stats: payload\.data\.stats \?\? priorPayload\.data\.stats/);
  assert.match(publisher, /advanced: payload\.data\.advanced \?\? priorPayload\.data\.advanced/);
  assert.match(publisher, /fetchRequiredPlayerStats/);
  assert.match(publisher, /data\?\.stats\?\.derivedStats/);
  assert.match(publisher, /PRESERVE_VALIDATED_SCORING_PROFILES/);
  assert.match(publisher, /preserving the validated cohort/);
});

test("scoring-only backfills preserve validated market identity and classify outcomes", () => {
  assert.match(publisher, /REUSE_VALIDATED_MARKETS === "true"/);
  assert.match(publisher, /releaseId = priorRelease\.releaseId/);
  assert.match(publisher, /Reusing validated market release/);
  assert.match(publisher, /successfulResponseCount/);
  assert.match(publisher, /unavailableCount/);
  assert.match(publisher, /failedRequestCount/);
});
