import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildPlayerSnapshotHistory,
  calculateHistoryMovement,
  carryHistoryForward,
  findNearestHistoryIndex,
  getHistoryChartScale,
  getTimeRatio,
  normalizeHistory,
} from "../src/app/lib/player-history.mjs";

const chartSource = await readFile(
  new URL("../src/app/components/PlayerHistoryChart.tsx", import.meta.url),
  "utf8",
);
const playerPageSource = await readFile(
  new URL("../src/app/players/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const release = JSON.parse(
  await readFile(new URL("../data/public-release.json", import.meta.url), "utf8"),
);

test("history normalization drops invalid records and orders real observations", () => {
  const points = normalizeHistory([
    { date: "2026-09-03T00:00:00Z", value: 990 },
    { date: "not-a-date", value: 500 },
    { date: "2026-09-01T00:00:00Z", value: 1000 },
    { date: "2026-09-02T00:00:00Z", value: Number.NaN },
  ]);

  assert.deepEqual(points.map(({ date, value }) => ({ date, value })), [
    { date: "2026-09-01T00:00:00Z", value: 1000 },
    { date: "2026-09-03T00:00:00Z", value: 990 },
  ]);
});

test("missing release days carry the last value forward without inventing zeroes", () => {
  const points = carryHistoryForward([
    { date: "2026-09-01T08:00:00Z", value: 1000 },
    { date: "2026-09-04T08:00:00Z", value: 990 },
  ]);

  assert.deepEqual(points.map((point) => point.value), [1000, 1000, 1000, 990]);
  assert.deepEqual(points.map((point) => point.carried), [false, true, true, false]);
  assert.ok(points.every((point) => point.value > 0));
  assert.equal(points[1].parsedDate.toISOString(), "2026-09-02T23:59:59.999Z");
  assert.equal(points[2].parsedDate.toISOString(), "2026-09-03T23:59:59.999Z");
});

test("the chart uses the documented market scale instead of magnifying tiny moves", () => {
  const scale = getHistoryChartScale([
    { date: "2026-09-01", value: 1000 },
    { date: "2026-09-02", value: 990 },
  ]);

  assert.deepEqual(scale, { min: 0, max: 1000, observedMin: 990, observedMax: 1000 });
  const topRatio = (1000 - scale.min) / (scale.max - scale.min);
  const lowerRatio = (990 - scale.min) / (scale.max - scale.min);
  assert.ok(
    Math.abs(topRatio - lowerRatio - 0.01) < Number.EPSILON,
    "a ten-point move occupies one percent of the plot",
  );
});

test("horizontal positions and nearest-point selection use elapsed time", () => {
  const first = new Date("2026-08-01T00:00:00Z");
  const middle = new Date("2026-08-11T00:00:00Z");
  const last = new Date("2026-08-21T00:00:00Z");
  assert.equal(getTimeRatio(middle, first, last), 0.5);

  const points = carryHistoryForward([
    { date: first.toISOString(), value: 900 },
    { date: last.toISOString(), value: 910 },
  ]);
  const target = new Date("2026-08-10T20:00:00Z").getTime();
  const nearest = points[findNearestHistoryIndex(points, target)];
  assert.match(nearest.date, /^2026-08-10/);
});

test("snapshot publication skips absent players instead of recording a zero", () => {
  const histories = buildPlayerSnapshotHistory({
    existing: {
      "test-player": [
        { observedAt: "2026-09-01T00:00:00Z", value: 800, rank: 10, posRank: 2, releaseId: "one" },
      ],
    },
    playerSlugs: ["test-player"],
    releases: [
      { releaseId: "missing", capturedAt: "2026-09-02T00:00:00Z", playerMarkets: { "dynasty:2:0": { data: [] } } },
      { releaseId: "three", capturedAt: "2026-09-03T00:00:00Z", playerMarkets: { "dynasty:2:0": { data: [{ slug: "test-player", composite: 805, rank: 9, posRank: 2 }] } } },
    ],
  });

  assert.deepEqual(histories["test-player"].map(({ releaseId, value }) => ({ releaseId, value })), [
    { releaseId: "one", value: 800 },
    { releaseId: "three", value: 805 },
  ]);
});

test("movement uses a real prior observation and never a carried or missing zero", () => {
  const movement = calculateHistoryMovement([
    { date: "2026-08-01T00:00:00Z", value: 1000 },
    { date: "2026-09-01T00:00:00Z", value: 990 },
  ], 30);

  assert.equal(movement.valueChange, -10);
  assert.equal(movement.percentChange, -1);
  assert.equal(movement.observedDays, 31);
});

test("production histories stay bounded and contain no fabricated missing-day zeroes", () => {
  for (const slug of ["josh-allen-qb", "bijan-robinson-rb"]) {
    const points = release.playerSnapshotHistory[slug];
    assert.ok(points.length > 2);
    assert.ok(points.every((point) => point.value > 0 && point.value <= 1000));
  }
});

test("the complete chart surface supports pointer, touch, click, and keyboard inspection", () => {
  assert.match(chartSource, /"use client"/);
  assert.match(chartSource, /onPointerMove=\{handlePointerMove\}/);
  assert.match(chartSource, /onClick=\{handleClick\}/);
  assert.match(chartSource, /onKeyDown=\{handleKeyDown\}/);
  assert.match(chartSource, /tabIndex=\{0\}/);
  assert.match(chartSource, /ArrowLeft/);
  assert.match(chartSource, /ArrowRight/);
  assert.match(chartSource, /aria-live="polite"/);
  assert.match(chartSource, /Last known value carried forward/);
  assert.match(chartSource, /fixed 0–\{scale\.max\.toLocaleString\(\)\}/);
  assert.match(playerPageSource, /earliest available · \$\{movement\.observedDays\} days of history/);
});
