import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [library, component, hub, detail, sitemap, indexNow, footer, home, playbook] = await Promise.all([
  read("../src/app/lib/weekly-sleepers.ts"),
  read("../src/app/components/WeeklySleepersPage.tsx"),
  read("../src/app/fantasy-football-sleepers/page.tsx"),
  read("../src/app/fantasy-football-sleepers/[position]/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/page.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("weekly sleepers publishes one complete, data-backed position cohort", () => {
  for (const slug of ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]) {
    assert.match(library, new RegExp(`slug: "${slug}"`));
  }
  assert.match(library, /marketPositionRank - weeklyRank/);
  assert.match(library, /offenseSnapPct/);
  assert.match(library, /recentGames\.length < 2/);
  assert.match(library, /out\|doubtful/i);
  assert.match(detail, /generateStaticParams/);
  assert.match(detail, /dynamicParams = false/);
});

test("sleepers answer the query and connect to the weekly decision flow", () => {
  assert.match(hub, /Fantasy Football Sleepers/);
  assert.match(component, /lead this week’s deeper-start board/);
  assert.match(component, /FAQPage/);
  assert.match(component, /who-should-i-start/);
  assert.match(component, /weekly_sleepers_viewed/);
  assert.match(home, /fantasy-football-sleepers/);
  assert.match(footer, /Weekly sleepers/);
});

test("every sleeper route is submitted and uses consumer-facing copy", () => {
  assert.match(sitemap, /weeklySleeperPositions\.map/);
  assert.match(indexNow, /fantasy-football-sleepers\/quarterbacks/);
  const visible = `${component}\n${hub}\n${detail}`;
  for (const phrase of ["SEO experiment", "cohort", "pipeline", "MCP", "as you requested", "our conversation"]) {
    assert.doesNotMatch(visible, new RegExp(phrase, "i"));
  }
  assert.match(playbook, /E13: weekly sleepers/);
});
