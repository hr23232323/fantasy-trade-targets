import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const release = JSON.parse(await read("../data/nflverse-player-release.json"));
const [manifest, playerPage, playerData, performance, teamPage, matchupPage, sitemap, workflow, refreshScript] = await Promise.all([
  read("../data/player-pages.json").then(JSON.parse),
  read("../src/app/players/[slug]/page.tsx"),
  read("../src/app/players/[slug]/data.json/route.ts"),
  read("../src/app/components/PlayerPerformance.tsx"),
  read("../src/app/teams/[slug]/page.tsx"),
  read("../src/app/fantasy-football-matchups/[slug]/[gameSlug]/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../../.github/workflows/data-refresh.yml"),
  read("../scripts/refresh-nflverse-data.mjs"),
]);

test("nflverse player release is versioned, attributed, and covers every player file", () => {
  assert.equal(release.schemaVersion, 2);
  assert.match(release.releaseId, /^ftt-nflverse-\d{8}T\d{6}Z$/);
  assert.match(release.modelVersion, /^nflverse-player-context-/);
  assert.ok(Number.isFinite(Date.parse(release.capturedAt)));
  assert.deepEqual(release.seasons, [release.season - 2, release.season - 1, release.season]);
  assert.equal(release.license.shortName, "CC BY 4.0");
  assert.equal(release.license.projectUrl, "https://github.com/nflverse/nflverse-data");
  assert.equal(release.coverage.publishedPlayers, manifest.length);
  assert.equal(Object.keys(release.players).length, manifest.length);
  assert.ok(release.coverage.rosterMapped >= 210);
  assert.ok(release.coverage.playersWithGames >= 180);
});

test("position-defense aggregates cover every team and supported scoring format", () => {
  assert.equal(release.positionDefense.season, release.season - 1);
  assert.equal(Object.keys(release.positionDefense.teams).length, 32);
  for (const positions of Object.values(release.positionDefense.teams)) {
    assert.deepEqual(Object.keys(positions).sort(), ["QB", "RB", "TE", "WR"]);
    for (const summary of Object.values(positions)) {
      assert.ok(summary.games >= 16);
      const { standard, halfPpr, ppr } = summary.pointsPerGame;
      assert.ok([standard, halfPpr, ppr].every(Number.isFinite));
      assert.ok(halfPpr >= standard);
      assert.ok(ppr >= halfPpr);
    }
  }
});

test("every source is an official versioned release asset with integrity metadata", () => {
  assert.deepEqual(Object.keys(release.sources).sort(), [
    "injuries", "roster",
    ...release.seasons.flatMap((season) => [`snaps_${season}`, `stats_${season}`]),
  ].sort());
  for (const source of Object.values(release.sources)) {
    assert.match(source.url, /^https:\/\/github\.com\/nflverse\/nflverse-data\/releases\/download\//);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(source.rowCount > 0);
  }
  assert.doesNotMatch(refreshScript, /ftn_charting|headshot_url|depth_charts/);
});

test("player rows are bounded, ordered, and scoring math stays coherent", () => {
  for (const [slug, player] of Object.entries(release.players)) {
    assert.equal(player.slug, slug);
    assert.match(player.sleeperId, /^\d+$/);
    assert.ok(player.games.length <= 20);
    assert.ok(player.seasons.length <= 3);
    for (let index = 1; index < player.games.length; index += 1) {
      const previous = player.games[index - 1];
      const current = player.games[index];
      assert.ok(previous.season > current.season || (previous.season === current.season && previous.week >= current.week));
    }
    for (const game of player.games) {
      assert.ok(release.seasons.includes(game.season));
      assert.ok(Number.isInteger(game.week) && game.week >= 1 && game.week <= 18);
      if (game.fantasyPoints !== null) {
        const receptions = game.receiving.receptions ?? 0;
        assert.equal(game.fantasyPointsHalfPpr, Math.round((game.fantasyPoints + receptions * 0.5) * 10) / 10);
      }
      if (game.fantasyPoints !== null && game.fantasyPointsPpr !== null) {
        assert.equal(game.fantasyPointsPpr, Math.round((game.fantasyPoints + (game.receiving.receptions ?? 0)) * 10) / 10);
      }
      if (game.offenseSnapPct !== null) assert.ok(game.offenseSnapPct >= 0 && game.offenseSnapPct <= 1);
    }
    for (const season of player.seasons) {
      assert.ok(release.seasons.includes(season.season));
      assert.ok(season.games >= 1 && season.games <= 18);
      for (const value of [season.fantasyPointsPerGame, season.halfPprPointsPerGame, season.pprPointsPerGame]) {
        assert.ok(Number.isFinite(value));
      }
    }
  }
});

test("nflverse evidence appears on existing player, team, and matchup pages", () => {
  assert.match(playerPage, /<PlayerPerformance slug=\{profile\.slug\}/);
  assert.match(playerData, /nflPerformance: getNflversePlayer\(slug\)/);
  assert.match(performance, /Standard PPG/);
  assert.match(performance, /Half PPR PPG/);
  assert.match(performance, /PPR PPG/);
  assert.match(performance, /Snap share/);
  assert.match(performance, /CC BY 4\.0|license\.shortName/);
  assert.match(teamPage, /availabilityLabel\(asset\.slug\)/);
  assert.match(matchupPage, /availabilityLabel\(asset\.slug\)/);
  assert.match(sitemap, /nflversePlayerRelease\.capturedAt/);
});

test("scheduled publisher refreshes and commits nflverse player context", () => {
  assert.match(workflow, /npm run data:nflverse/);
  assert.match(workflow, /frontend\/data\/nflverse-player-release\.json/);
  assert.match(workflow, /nflverse_outcome/);
});
