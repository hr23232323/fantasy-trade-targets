import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizePlayerMarketSlugs,
  normalizePlayerMarketPayload,
} from "../src/app/lib/market-publication.mjs";

test("market publication canonicalizes teams, quarantines isolated bad rows, and rebuilds ranks", () => {
  const payload = normalizePlayerMarketPayload({
    data: [
      player("third-wr", "WR", "FA", 300),
      player("first-qb", "QB", "JAC", 700),
      player("bad-score", "RB", "DAL", Number.NaN),
      player("second-qb", "QB", "LA", 500),
      player("first-qb", "QB", "JAX", 450),
    ],
    meta: { generatedAt: "2026-10-03T00:00:00Z", access: { total: 5 } },
  });

  assert.deepEqual(payload.data.map(({ slug }) => slug), ["first-qb", "second-qb", "third-wr"]);
  assert.deepEqual(payload.data.map(({ rank }) => rank), [1, 2, 3]);
  assert.deepEqual(payload.data.map(({ posRank }) => posRank), [1, 2, 1]);
  assert.deepEqual(payload.data.map(({ team }) => team), ["JAX", "LAR", null]);
  assert.equal(payload.meta.access.sourceTotal, 5);
  assert.equal(payload.meta.access.total, 3);
  assert.equal(payload.meta.publication.excludedRecords, 2);
  assert.equal(payload.meta.publication.normalizedTeamCount, 3);
});

test("market publication clamps the documented rounding edge but rejects broad corruption", () => {
  const valid = Array.from({ length: 300 }, (_, index) => player(`player-${index}`, index % 2 ? "WR" : "RB", "DAL", 900 - index));
  const clamped = normalizePlayerMarketPayload({ data: [player("top", "QB", "BUF", 1001), ...valid], meta: {} });
  assert.equal(clamped.data[0].composite, 1000);

  assert.throws(
    () => normalizePlayerMarketPayload({ data: [...valid, ...Array.from({ length: 7 }, (_, index) => ({ broken: index }))], meta: {} }),
    /rejected 7 malformed or duplicate records/,
  );
});

test("market publication keeps stable FTT URLs when an upstream slug changes", () => {
  const payload = canonicalizePlayerMarketSlugs(
    normalizePlayerMarketPayload({
      data: [
        { ...player("james-cook-iii-rb", "RB", "BUF", 700), sleeperId: "8138" },
        { ...player("other-rb", "RB", "DAL", 500), sleeperId: "9999" },
      ],
      meta: {},
    }),
    new Map([["8138", "james-cook-rb"]]),
  );

  assert.deepEqual(payload.data.map(({ slug }) => slug), ["james-cook-rb", "other-rb"]);
  assert.equal(payload.meta.publication.canonicalizedSlugCount, 1);
  assert.throws(
    () => canonicalizePlayerMarketSlugs(
      { data: [{ slug: "same", sleeperId: "1" }, { slug: "other", sleeperId: "1" }] },
      new Map([["1", "stable"]]),
    ),
    /duplicate slug stable/,
  );
});

function player(slug, position, team, composite) {
  return { slug, name: slug, position, team, composite, rank: 999, posRank: 999 };
}
