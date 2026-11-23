import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizePlayerProfilePayload,
  playerProfileCarryLimit,
  resolvePlayerProfileRefresh,
  validatePlayerProfileRefreshBatch,
} from "../src/app/lib/player-profile-publication.mjs";

const prior = { data: { slug: "player-1", name: "Player One" } };
const fresh = { data: { slug: "player-1", name: "Player One Updated" } };

test("an isolated missing optional profile carries validated prior evidence", () => {
  const response = resolvePlayerProfileRefresh({
    slug: "player-1",
    priorPayload: prior,
    error: new Error("Tradyr returned 404"),
  });

  assert.equal(response.status, "carried");
  assert.equal(response.payload, prior);
  assert.match(response.reason, /404/);
});

test("a successful profile refresh always replaces prior evidence", () => {
  const response = resolvePlayerProfileRefresh({
    slug: "player-1",
    payload: fresh,
    priorPayload: prior,
  });

  assert.equal(response.status, "refreshed");
  assert.equal(response.payload, fresh);
  assert.equal(response.reason, null);
});

test("profile payloads use stable public slugs while preserving fresh upstream evidence", () => {
  const payload = canonicalizePlayerProfilePayload(
    {
      data: {
        slug: "james-cook-iii-rb",
        sleeperId: "8138",
        similar: [{ slug: "michael-penix-jr-qb" }],
      },
      meta: { generatedAt: "2026-11-23T00:00:00Z" },
    },
    {
      stableSlug: "james-cook-rb",
      stableSlugBySourceSlug: new Map([["michael-penix-jr-qb", "michael-penix-qb"]]),
    },
  );

  assert.equal(payload.data.slug, "james-cook-rb");
  assert.equal(payload.data.sleeperId, "8138");
  assert.equal(payload.data.similar[0].slug, "michael-penix-qb");
  assert.equal(payload.meta.generatedAt, "2026-11-23T00:00:00Z");
});

test("a missing profile without a validated fallback blocks publication", () => {
  assert.throws(
    () => resolvePlayerProfileRefresh({ slug: "new-player", error: new Error("404") }),
    /no validated prior profile/,
  );
});

test("isolated carries are bounded so a broad profile outage cannot look healthy", () => {
  assert.equal(playerProfileCarryLimit(220), 22);
  const healthy = Array.from({ length: 220 }, (_, index) => ({
    slug: `player-${index}`,
    payload: prior,
    status: index < 20 ? "carried" : "refreshed",
  }));
  assert.deepEqual(validatePlayerProfileRefreshBatch(healthy, 220), {
    requestedCount: 220,
    refreshedCount: 200,
    carriedCount: 20,
    carriedSlugs: Array.from({ length: 20 }, (_, index) => `player-${index}`).sort(),
    allowedCarryCount: 22,
  });

  const outage = healthy.map((response, index) => ({
    ...response,
    status: index < 23 ? "carried" : "refreshed",
  }));
  assert.throws(
    () => validatePlayerProfileRefreshBatch(outage, 220),
    /carry 23 profiles; limit is 22/,
  );
});
