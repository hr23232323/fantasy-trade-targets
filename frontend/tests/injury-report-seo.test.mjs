import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [release, news, page, archive, table, playerPerformance, injuries, newsLibrary, sitemap, indexNow, refresh] = await Promise.all([
  read("../data/nflverse-player-release.json").then(JSON.parse),
  read("../data/injury-news.json").then(JSON.parse),
  read("../src/app/fantasy-football-injuries/page.tsx"),
  read("../src/app/fantasy-football-injuries/[weekSlug]/page.tsx"),
  read("../src/app/components/InjuryReportTable.tsx"),
  read("../src/app/components/PlayerPerformance.tsx"),
  read("../src/app/lib/injuries.ts"),
  read("../src/app/lib/injury-news.ts"),
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

test("breaking injury updates are sourced, bounded, and expire with the target week", () => {
  assert.equal(news.schemaVersion, 1);
  assert.ok(news.week >= 1 && news.week <= 18);
  assert.ok(Date.parse(news.updatedAt));
  assert.match(news.source.url, /^https:\/\//);
  assert.ok(news.updates.length >= 5 && news.updates.length <= 20);
  assert.equal(new Set(news.updates.map(({ slug }) => slug)).size, news.updates.length);
  for (const update of news.updates) {
    assert.ok(release.players[update.slug]);
    assert.ok(update.detail.length >= 30);
    assert.ok(update.projectionFactor >= 0 && update.projectionFactor <= 1);
  }
  assert.match(newsLibrary, /injuryNewsRelease\.week !== week/);
});

test("the injury hub exposes freshness and preserves weekly archives", () => {
  assert.match(page, /Week \$\{activeStartSitWeek\} Fantasy Football Injury Report/);
  assert.match(page, /rows\.length/);
  assert.match(archive, /Out & Questionable/);
  assert.match(page, /injuryReportAnswer/);
  assert.match(page, /practice designations are not available yet/);
  assert.match(page, /latest complete team-issued report/);
  assert.match(page, /Current roster availability/);
  assert.match(page, /Major updates/);
  assert.match(page, /Breaking updates remain separate/);
  assert.match(page, /Players not currently listed active/);
  assert.match(page, /getCurrentRosterAvailabilityRows/);
  assert.match(page, /official inactive lists/i);
  assert.match(archive, /weekly availability archive/i);
  assert.match(table, /Practice/);
  assert.match(table, /Game status/);
  assert.match(playerPerformance, /Availability week/);
  assert.match(injuries, /meaningful/);
  assert.match(injuries, /summarizeInjuryRows/);
  assert.match(injuries, /rosterAvailabilityAnswer/);
  assert.match(injuries, /roster\.week !== week/);
  assert.match(page, /creativecommons\.org\/licenses\/by\/4\.0/);
  assert.match(archive, /description:/);
  assert.match(archive, /license:/);
  assert.match(sitemap, /injuryReportWeeks/);
  assert.match(indexNow, /injuryWeeks/);
});
