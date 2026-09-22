import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [release, teams, scheduleLib, usageLib, schedulePage, positionWeekPage, scheduleRoute, scheduleHub, usageHub, usagePage, sitemap, indexNow, footer, playbook] = await Promise.all([
  read("../data/nflverse-player-release.json").then(JSON.parse),
  read("../data/team-release.json").then(JSON.parse),
  read("../src/app/lib/schedule-ratings.ts"),
  read("../src/app/lib/usage-reports.ts"),
  read("../src/app/fantasy-football-strength-of-schedule/[slug]/PositionSchedulePage.tsx"),
  read("../src/app/fantasy-football-strength-of-schedule/[slug]/PositionWeekSchedulePage.tsx"),
  read("../src/app/fantasy-football-strength-of-schedule/[slug]/page.tsx"),
  read("../src/app/fantasy-football-strength-of-schedule/page.tsx"),
  read("../src/app/fantasy-football-usage/page.tsx"),
  read("../src/app/fantasy-football-usage/[weekSlug]/[positionSlug]/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("position schedule publishes four distinct, complete rankings", () => {
  for (const slug of ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]) assert.match(scheduleLib, new RegExp(`slug: "${slug}"`));
  assert.match(scheduleLib, /remaining\.slice\(0, 4\)/);
  assert.match(scheduleLib, /remainingAverage/);
  assert.match(schedulePage, /Standard fantasy points allowed/);
  assert.match(schedulePage, /Half PPR fantasy points allowed/);
  assert.match(schedulePage, /PPR fantasy points allowed/);
  assert.match(schedulePage, /Schedule context, then player context/);
  assert.match(sitemap, /positionScheduleSlugs\.map/);
  assert.match(indexNow, /positionSchedulePaths/);
});

test("the schedule winner expands into complete Week 3 and Week 4 position cohorts", () => {
  assert.match(scheduleLib, /positionWeekScheduleWeeks = \[3, 4\]/);
  assert.match(scheduleLib, /getPositionWeekScheduleRatings/);
  assert.match(scheduleLib, /pointsAllowed\.ppr/);
  assert.match(scheduleRoute, /PositionWeekSchedulePage/);
  assert.match(scheduleRoute, /positionWeekScheduleSlugs/);
  assert.match(scheduleHub, /Weeks 3–4 · by position/);
  assert.match(positionWeekPage, /position_week_schedule_viewed/);
  assert.match(positionWeekPage, /all 32 teams/i);
  assert.match(positionWeekPage, /A better matchup can help\. Role still comes first/);
  assert.match(sitemap, /positionWeekScheduleSlugs\.map/);
  assert.match(indexNow, /positionWeekSchedulePaths/);
});

test("usage pages require final games plus matching stats and snaps", () => {
  assert.match(usageLib, /completedGames === matchups\.length/);
  assert.match(usageLib, /gamesWithStats === matchups\.length/);
  assert.match(usageLib, /gamesWithSnaps === matchups\.length/);
  assert.match(usageLib, /publishedUsageWeeks = regularSeasonWeeks\.filter/);
  assert.match(usagePage, /getUsageReadiness\(week\)\.ready/);
  assert.match(usagePage, /dynamicParams = false/);
  assert.match(sitemap, /publishedUsageWeeks\.flatMap/);

  for (let week = 1; week <= 18; week += 1) {
    const games = uniqueGames(week);
    const statGames = new Set();
    const snapGames = new Set();
    for (const player of Object.values(release.players)) for (const game of player.games) {
      if (game.season !== release.season || game.week !== week) continue;
      statGames.add(game.gameId);
      if (game.offenseSnapPct !== null) snapGames.add(game.gameId);
    }
    const ready = games.length > 0 && games.every((game) => game.result !== null && statGames.has(game.gameId) && snapGames.has(game.gameId));
    if (ready) {
      assert.equal(games.length, statGames.size);
      assert.equal(games.length, snapGames.size);
    }
  }
});

test("consumer pages explain the product without internal planning language", () => {
  const visiblePages = `${schedulePage}\n${positionWeekPage}\n${usageHub}\n${usagePage}`;
  for (const phrase of ["implementation note", "publication gate", "SEO experiment", "cohort", "pipeline", "as you requested", "our conversation"]) {
    assert.doesNotMatch(visiblePages, new RegExp(phrase, "i"));
  }
  assert.match(usageHub, /Fantasy Football Usage Report/i);
  assert.match(usagePage, /Usage describes a player|It is not a projection/);
  assert.match(footer, /Weekly usage/);
  assert.match(playbook, /E5: position schedule/);
  assert.match(playbook, /E6: weekly usage/);
});

function uniqueGames(week) {
  const games = new Map();
  for (const team of Object.values(teams.teams)) for (const game of team.schedule) if (game.week === week) games.set(game.gameId, game);
  return [...games.values()];
}
