import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildPlayoffScheduleRatings, DEFAULT_PLAYOFF_WEEKS } from "../src/app/lib/playoff-schedule-model.mjs";

const [teams, nflverse, hub, detail, table, lib, sitemap, indexNow, footer, strengthHub, rosPage, playbook] = await Promise.all([
  readFile(new URL("../data/team-release.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/nflverse-player-release.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../src/app/fantasy-football-playoff-strength-of-schedule/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/fantasy-football-playoff-strength-of-schedule/[position]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/PlayoffScheduleTable.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/lib/playoff-schedule.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
  readFile(new URL("../scripts/submit-indexnow.mjs", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/Footer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/fantasy-football-strength-of-schedule/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/RestOfSeasonRankingsPage.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../docs/SEO_EXPERIMENT_PLAYBOOK.md", import.meta.url), "utf8"),
]);

const positions = ["QB", "RB", "WR", "TE"];

test("playoff schedule math produces complete, ranked three-week boards", () => {
  assert.deepEqual(DEFAULT_PLAYOFF_WEEKS, [15, 16, 17]);
  for (const position of positions) {
    const rows = buildPlayoffScheduleRatings({
      teams: Object.values(teams.teams),
      positionDefense: nflverse.positionDefense.teams,
      position,
      weeks: DEFAULT_PLAYOFF_WEEKS,
    });
    assert.equal(rows.length, 32, `${position} should rank every NFL team`);
    assert.deepEqual(rows.map(({ rank }) => rank), Array.from({ length: 32 }, (_, index) => index + 1));
    assert.ok(rows.every(({ games }) => games.length === 3 && games.map(({ week }) => week).join(",") === "15,16,17"));
    assert.ok(rows.every(({ averages }) => Object.values(averages).every(Number.isFinite)));
    assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].averages.ppr >= row.averages.ppr));
    for (const row of rows) {
      const expected = row.games.reduce((sum, game) => sum + game.pointsAllowed.ppr, 0) / 3;
      assert.ok(Math.abs(row.averages.ppr - expected) < Number.EPSILON);
    }
  }
});

test("alternate playoff weeks recalculate the opponent set instead of relabeling it", () => {
  const input = { teams: Object.values(teams.teams), positionDefense: nflverse.positionDefense.teams, position: "WR" };
  const primary = buildPlayoffScheduleRatings({ ...input, weeks: [15, 16, 17] });
  const alternate = buildPlayoffScheduleRatings({ ...input, weeks: [14, 15, 16] });
  assert.equal(primary.length, 32);
  assert.equal(alternate.length, 32);
  assert.notDeepEqual(primary.map(({ team }) => team.abbr), alternate.map(({ team }) => team.abbr));
  assert.deepEqual(alternate[0].weeks, [14, 15, 16]);
  assert.ok(alternate.some(({ games }) => games.some(({ bye }) => bye)), "Week 14 byes stay visible as zero-opportunity weeks");
});

test("the five-page playoff planner is useful, interactive, and answer-first", () => {
  assert.match(lib, /playoffPositionConfigs = positionScheduleConfigs/);
  assert.match(hub, /Fantasy football playoff/);
  assert.match(hub, /The best playoff paths by position/);
  assert.match(detail, /Who has the best fantasy playoff schedule/);
  assert.match(detail, /Who has the toughest fantasy playoff schedule/);
  assert.match(detail, /playersByTeam/);
  assert.match(detail, /"@type": "Dataset"/);
  assert.match(detail, /"@type": "FAQPage"/);
  assert.match(detail, /Weeks 15–17/);
  assert.match(detail, /Weeks 14–16/);
  assert.match(table, /No player points/);
  assert.match(table, /PPR/);
  assert.match(table, /Half PPR/);
  assert.match(table, /Standard/);
  assert.match(table, /playoff_schedule_filter_changed/);
  assert.doesNotMatch(`${hub}${detail}${table}`, /experiment|hypothesis|keyword volume|DataForSEO/i);
});

test("playoff planners are crawlable and connected to existing decision pages", () => {
  for (const source of [sitemap, indexNow, footer, strengthHub, rosPage]) {
    assert.match(source, /fantasy-football-playoff-strength-of-schedule/);
  }
  assert.match(sitemap, /playoffPositionConfigs\.map/);
  assert.match(playbook, /E15: fantasy playoff schedules/);
});
