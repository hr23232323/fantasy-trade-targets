import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findAvailabilityCorrection, playerAvailabilityLabel } from "../src/app/lib/player-availability.mjs";
import { projectPlayerWeek } from "../src/app/lib/start-sit-model.mjs";

const read = async (file) => JSON.parse(await readFile(new URL(file, import.meta.url), "utf8"));
const corrections = await read("../data/availability-corrections.json");
const release = await read("../data/nflverse-player-release.json");
const teams = await read("../data/team-release.json");

test("reviewed IR correction overrides a lagging active roster and practice report", () => {
  const player = structuredClone(release.players["puka-nacua-wr"]);
  player.roster.status = "ACT";
  player.injury = { ...player.injury, reportStatus: null, practiceStatus: "Did Not Participate In Practice" };
  const original = structuredClone(player);
  const correction = findAvailabilityCorrection(corrections, player.slug, 2026, 10);
  assert.equal(playerAvailabilityLabel(player, correction), "Injured reserve");
  const projection = projectPlayerWeek({ player, week: 10, season: 2026,
    availabilityOverride: { week: 10, factor: correction.projectionFactor, label: correction.status } });
  assert.equal(projection.availability, "Injured reserve");
  assert.equal(projection.median, 0);
  assert.equal(projection.ceiling, 0);
  assert.deepEqual(player, original, "raw source records must remain intact");
});

test("IR correction spans four missed games including the bye and expires by season/week", () => {
  const correction = corrections.find(({ slug }) => slug === "puka-nacua-wr");
  const games = teams.teams.LAR.schedule.filter(({ week }) => week >= correction.fromWeek && week <= correction.throughWeek);
  assert.deepEqual(games.map(({ week }) => week), [10, 12, 13, 14]);
  for (const week of [10, 11, 12, 13, 14]) assert.ok(findAvailabilityCorrection(corrections, correction.slug, 2026, week));
  for (const week of [9, 15]) assert.equal(findAvailabilityCorrection(corrections, correction.slug, 2026, week), null);
  assert.equal(findAvailabilityCorrection(corrections, correction.slug, 2027, 10), null);
  assert.equal(findAvailabilityCorrection(corrections, "other-player", 2026, 10), null);
});

test("unavailable roster statuses outrank practice designations for every player", () => {
  const player = structuredClone(release.players["puka-nacua-wr"]);
  player.injury = { ...player.injury, reportStatus: "Questionable" };
  for (const [status, label] of [["RES", "Reserve"], ["IR", "Injured reserve"], ["INA", "Inactive"]]) {
    player.roster.status = status;
    assert.equal(playerAvailabilityLabel(player), label);
  }
  player.roster.status = "ACT";
  assert.equal(playerAvailabilityLabel(player), "Questionable");
});

test("every reviewed correction is sourced, bounded and tied to a published player", () => {
  for (const row of corrections) {
    assert.ok(release.players[row.slug]);
    assert.ok(Number.isInteger(row.season));
    assert.ok(row.fromWeek >= 1 && row.throughWeek <= 18 && row.fromWeek <= row.throughWeek);
    assert.ok(Number.isFinite(Date.parse(row.verifiedAt)));
    assert.ok(Number.isFinite(Date.parse(row.effectiveDate)));
    assert.match(row.sourceUrl, /^https:\/\//);
    assert.ok(row.projectionFactor >= 0 && row.projectionFactor <= 1);
  }
});
