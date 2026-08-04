import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const teamRelease = JSON.parse(
  await readFile(new URL("../data/team-release.json", import.meta.url), "utf8"),
);
const marketRelease = JSON.parse(
  await readFile(new URL("../data/public-release.json", import.meta.url), "utf8"),
);

const aliases = { LA: "LAR", SFO: "SF", TBB: "TB" };
const canonical = (abbr) => aliases[abbr] ?? abbr;

test("team release contains a complete, versioned 32-team layer", () => {
  assert.equal(teamRelease.schemaVersion, 1);
  assert.match(teamRelease.releaseId, /^ftt-teams-\d{8}T\d{6}Z$/);
  assert.match(teamRelease.modelVersion, /^team-environment-/);
  assert.ok(Number.isFinite(Date.parse(teamRelease.capturedAt)));
  assert.equal(teamRelease.baselineSeason, teamRelease.season - 1);
  assert.equal(Object.keys(teamRelease.teams).length, 32);

  for (const source of Object.values(teamRelease.sources)) {
    assert.equal(source.license, "CC BY 4.0");
    assert.match(source.url, /^https:\/\/github\.com\/nflverse\//);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(source.rowCount > 32);
  }
});

test("every team has identity, a complete schedule, and a scored baseline", () => {
  const ranks = new Set();
  const scheduledGames = new Map();

  for (const [abbr, team] of Object.entries(teamRelease.teams)) {
    assert.equal(team.abbr, abbr);
    assert.match(team.slug, /^[a-z0-9-]+$/);
    assert.ok(team.name);
    assert.ok(team.nickname);
    assert.ok(["AFC", "NFC"].includes(team.conference));
    assert.ok(team.division.startsWith(team.conference));
    assert.match(team.colors[0], /^#[a-fA-F0-9]{6}$/);
    assert.match(team.logo.src, /^https:\/\/a\.espncdn\.com\//);
    assert.ok(team.homeVenue);
    assert.equal(team.baseline.games, 17);
    assert.ok(Number.isFinite(team.baseline.pointsAllowedPerGame));
    assert.ok(team.baseline.scoringDefenseRank >= 1);
    assert.ok(team.baseline.scoringDefenseRank <= 32);
    ranks.add(team.baseline.scoringDefenseRank);

    assert.equal(team.schedule.length, 17, `${abbr} has 17 games`);
    assert.equal(new Set(team.schedule.map((game) => game.gameId)).size, 17);
    for (const game of team.schedule) {
      assert.ok(teamRelease.teams[game.opponentAbbr], `${abbr} opponent exists`);
      assert.ok(game.week >= 1 && game.week <= 18);
      assert.match(game.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(game.environmentScore >= 0 && game.environmentScore <= 100);
      assert.ok(["Hot", "Warm", "Balanced", "Cool", "Cold"].includes(game.environmentLabel));
      assert.equal(game.opponentBaseline.season, teamRelease.baselineSeason);
      assert.ok(game.opponentBaseline.scoringDefenseRank >= 1);
      scheduledGames.set(game.gameId, (scheduledGames.get(game.gameId) ?? 0) + 1);
    }
  }

  assert.equal(ranks.size, 32, "scoring defense ranks are unique");
  assert.equal(scheduledGames.size, 272, "release contains 272 unique games");
  assert.ok([...scheduledGames.values()].every((count) => count === 2), "each game appears on both team schedules");
});

test("every active team resolves current fantasy market assets", () => {
  const market = marketRelease.playerMarkets["dynasty:2:0"].data;
  const counts = new Map(Object.keys(teamRelease.teams).map((abbr) => [abbr, 0]));

  for (const player of market) {
    const abbr = canonical(player.team);
    if (counts.has(abbr)) counts.set(abbr, counts.get(abbr) + 1);
  }

  for (const [abbr, count] of counts) {
    assert.ok(count >= 10, `${abbr} has at least 10 current market players`);
  }
});
