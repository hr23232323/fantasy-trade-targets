import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [release, page, archive, table, playerPerformance, injuries, sitemap, indexNow, refresh] = await Promise.all([
  read("../data/nflverse-player-release.json").then(JSON.parse),
  read("../src/app/fantasy-football-injuries/page.tsx"),
  read("../src/app/fantasy-football-injuries/[weekSlug]/page.tsx"),
  read("../src/app/components/InjuryReportTable.tsx"),
  read("../src/app/components/PlayerPerformance.tsx"),
  read("../src/app/lib/injuries.ts"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../scripts/refresh-nflverse-data.mjs"),
]);

test("injury histories are bounded, newest-first weekly source records", () => {
  assert.equal(release.schemaVersion, 3);
  let covered = 0;
  for (const player of Object.values(release.players)) {
    assert.ok(Array.isArray(player.injuryHistory));
    assert.ok(player.injuryHistory.length <= 18);
    if (player.injuryHistory.length) covered += 1;
    assert.deepEqual(player.injury, player.injuryHistory[0] ?? null);
    for (let index = 1; index < player.injuryHistory.length; index += 1) {
      assert.ok((player.injuryHistory[index - 1].week ?? 0) >= (player.injuryHistory[index].week ?? 0));
    }
  }
  assert.ok(covered >= 50);
  assert.match(refresh, /injuryHistory/);
});

test("the injury hub exposes freshness and preserves weekly archives", () => {
  assert.match(page, /Latest structured report/);
  assert.match(page, /have not reached the structured feed yet/);
  assert.match(page, /does not reduce Week/);
  assert.match(page, /official inactive lists/i);
  assert.match(archive, /weekly availability archive/i);
  assert.match(table, /Practice/);
  assert.match(table, /Game status/);
  assert.match(playerPerformance, /Availability week/);
  assert.match(injuries, /meaningful/);
  assert.match(sitemap, /injuryReportWeeks/);
  assert.match(indexNow, /injuryWeeks/);
});
