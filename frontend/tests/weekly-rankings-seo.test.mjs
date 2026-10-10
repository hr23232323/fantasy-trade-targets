import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [hub, detail, page, table, model, startSit, sitemap, indexNow, header, generator] = await Promise.all([
  read("../src/app/fantasy-football-rankings/page.tsx"),
  read("../src/app/fantasy-football-rankings/[position]/page.tsx"),
  read("../src/app/components/WeeklyRankingsPage.tsx"),
  read("../src/app/components/WeeklyRankingsTable.tsx"),
  read("../src/app/lib/weekly-rankings.ts"),
  read("../src/app/who-should-i-start/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/SiteHeader.tsx"),
  read("../scripts/generate-start-sit-comparisons.mjs"),
]);

test("weekly rankings publish one stable hub and four position pages", () => {
  assert.match(hub, /Week \$\{weeklyRankingsWeek\} Fantasy Football Rankings/);
  assert.match(detail, /generateStaticParams/);
  for (const slug of ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]) {
    assert.match(model, new RegExp(slug));
    assert.match(indexNow, new RegExp(`/fantasy-football-rankings/${slug}`));
  }
  assert.match(sitemap, /weeklyRankingPositions/);
  assert.match(sitemap, /fantasy-football-rankings/);
  assert.match(header, /Rankings/);
});

test("the rankings board is useful, interactive, and connected to start/sit", () => {
  assert.match(page, /getWeeklyRankingRows/);
  assert.match(page, /leaders\.map/);
  assert.match(page, /ItemList/);
  assert.match(page, /current-week listed availability/i);
  assert.match(table, /Floor/);
  assert.match(table, /PPR/);
  assert.match(table, /Half PPR/);
  assert.match(table, /Standard/);
  assert.match(table, /weekly_rankings_scoring_changed/);
  assert.match(table, /who-should-i-start\?player1=/);
  assert.match(table, /<Image/);
  assert.match(startSit, /<Suspense/);
  assert.match(startSit, /getStartSitSide/);
});

test("comparison expansion stays bounded, evidence-selected, and additive", () => {
  assert.match(generator, /BASE_TARGET_COUNT = 350/);
  assert.match(generator, /WEEKLY_ADDITION_COUNT = 25/);
  assert.match(generator, /activeWeek - BASELINE_WEEK/);
  assert.match(generator, /redraft:1:0/);
  assert.match(generator, /projectPlayerWeek/);
  assert.match(generator, /normalizedExisting/);
  assert.match(generator, /pairKeys/);
  assert.doesNotMatch(generator, /Math\.random/);
});
