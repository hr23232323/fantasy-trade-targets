import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [hub, detail, gameDetail, data, sitemap, indexNow, home, footer, release] = await Promise.all([
  readFile(new URL("../src/app/fantasy-football-matchups/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/fantasy-football-matchups/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/fantasy-football-matchups/[slug]/[gameSlug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/lib/weekly-matchups.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
  readFile(new URL("../scripts/submit-indexnow.mjs", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/Footer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../data/team-release.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("weekly matchup collection publishes one complete regular-season slate per week", () => {
  assert.match(data, /length: 18/);
  assert.match(data, /seen\.has\(game\.gameId\)/);
  assert.match(data, /opponent\.schedule\.find/);
  assert.match(detail, /generateStaticParams/);
  assert.match(detail, /weeklyMatchupSlugs/);
  assert.match(detail, /getWeeklyMatchups/);
  assert.match(hub, /regularSeasonWeeks\.map/);

  for (let week = 1; week <= 18; week += 1) {
    const uniqueGames = new Set(
      Object.values(release.teams)
        .flatMap((team) => team.schedule)
        .filter((game) => game.week === week)
        .map((game) => game.gameId),
    );
    assert.ok(uniqueGames.size >= 13 && uniqueGames.size <= 16, `week ${week} has a credible NFL slate`);
    assert.ok(indexNow.includes("weeklyMatchupPaths"), "weekly routes are submitted through the generated path list");
  }
});

test("weekly matchup pages provide data-backed context without claiming projections or injuries", () => {
  assert.match(detail, /current top redraft assets/i);
  assert.match(detail, /opponent scoring context/i);
  assert.match(detail, /environmentScore/);
  assert.match(detail, /not projections, injury reports, news, or betting advice/i);
  assert.match(detail, /"@type": "SportsEvent"/);
  assert.match(detail, /weekly_matchups_viewed/);
  assert.match(hub, /weekly_matchups_hub_viewed/);
});

test("weekly matchup pages are crawlable and connected to the site", () => {
  assert.match(sitemap, /"\/fantasy-football-matchups"/);
  assert.match(sitemap, /weeklyMatchupSlugs\.map/);
  assert.match(indexNow, /"\/fantasy-football-matchups"/);
  assert.match(home, /href="\/fantasy-football-matchups"/);
  assert.match(footer, /\["Weekly matchups", "\/fantasy-football-matchups"\]/);
});

test("the Week 1 experiment publishes every individual game and links from the slate", () => {
  const uniqueGames = new Set(
    Object.values(release.teams)
      .flatMap((team) => team.schedule)
      .filter((game) => game.week === 1)
      .map((game) => game.gameId),
  );
  assert.equal(uniqueGames.size, 16);
  assert.match(data, /matchupExperimentWeek = 1/);
  assert.match(data, /matchupExperimentGames/);
  assert.match(data, /matchupGameSlug/);
  assert.match(detail, /Open this matchup/);
  assert.match(gameDetail, /generateStaticParams/);
  assert.match(gameDetail, /game_matchup_experiment_viewed/);
  assert.match(gameDetail, /not an injury report, projection, start\/sit recommendation, or betting pick/i);
  assert.match(sitemap, /matchupExperimentGames\.map/);
  assert.match(indexNow, /matchupExperimentPaths/);
});
