import assert from "node:assert/strict";
import test from "node:test";
import {
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

test("a missing profile without a validated fallback blocks publication", () => {
  assert.throws(
    () => resolvePlayerProfileRefresh({ slug: "new-player", error: new Error("404") }),
    /no validated prior profile/,
  );
});

test("isolated carries are bounded so a broad profile outage cannot look healthy", () => {
  assert.equal(playerProfileCarryLimit(220), 10);
  const healthy = Array.from({ length: 220 }, (_, index) => ({
    slug: `player-${index}`,
    payload: prior,
    status: index < 3 ? "carried" : "refreshed",
  }));
  assert.deepEqual(validatePlayerProfileRefreshBatch(healthy, 220), {
    requestedCount: 220,
    refreshedCount: 217,
    carriedCount: 3,
    carriedSlugs: ["player-0", "player-1", "player-2"],
    allowedCarryCount: 10,
  });

  const outage = healthy.map((response, index) => ({
    ...response,
    status: index < 11 ? "carried" : "refreshed",
  }));
  assert.throws(
    () => validatePlayerProfileRefreshBatch(outage, 220),
    /carry 11 profiles; limit is 10/,
  );
});
