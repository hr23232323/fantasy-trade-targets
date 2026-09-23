import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fantasyPoints, projectPlayerWeek } from "../src/app/lib/start-sit-model.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [manifest, release, teams, publicRelease, hub, detail, library, sitemap, indexNow, playbook] = await Promise.all([
  read("../data/start-sit-comparisons.json").then(JSON.parse),
  read("../data/nflverse-player-release.json").then(JSON.parse),
  read("../data/team-release.json").then(JSON.parse),
  read("../data/public-release.json").then(JSON.parse),
  read("../src/app/who-should-i-start/page.tsx"),
  read("../src/app/who-should-i-start/[slug]/page.tsx"),
  read("../src/app/lib/start-sit.ts"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

test("start/sit launches one bounded cohort of real current players", () => {
  assert.equal(manifest.length, 20);
  assert.equal(new Set(manifest.map(({ slug }) => slug)).size, manifest.length);
  const redraft = new Set(publicRelease.playerMarkets["redraft:1:0"].data.map(({ slug }) => slug));
  for (const comparison of manifest) {
    assert.match(comparison.slug, /^[a-z0-9-]+-vs-[a-z0-9-]+$/);
    assert.ok(release.players[comparison.leftSlug]);
    assert.ok(release.players[comparison.rightSlug]);
    assert.ok(redraft.has(comparison.leftSlug));
    assert.ok(redraft.has(comparison.rightSlug));
    assert.equal(release.players[comparison.leftSlug].roster.position, comparison.position);
    assert.equal(release.players[comparison.rightSlug].roster.position, comparison.position);
    assert.ok(comparison.selectionReason.length >= 60);
  }
});

test("projection ranges are finite, ordered, and ignore stale injury rows", () => {
  const player = structuredClone(release.players[manifest[0].leftSlug]);
  const base = projectPlayerWeek({ player, week: 3, season: release.season, opponentAllowed: 18, leagueMedianAllowed: 18, receptionPoints: 0.5 });
  assert.ok(base);
  assert.ok(base.floor <= base.median && base.median <= base.ceiling);
  assert.ok([base.floor, base.median, base.ceiling].every(Number.isFinite));
  player.injury = { week: 2, reportStatus: "Out", reportPrimaryInjury: "Test", reportSecondaryInjury: null, practicePrimaryInjury: null, practiceSecondaryInjury: null, practiceStatus: null };
  const stale = projectPlayerWeek({ player, week: 3, season: release.season, opponentAllowed: 18, leagueMedianAllowed: 18, receptionPoints: 0.5 });
  assert.equal(stale.median, base.median);
  assert.equal(stale.availabilityApplied, false);
  player.injury.week = 3;
  const current = projectPlayerWeek({ player, week: 3, season: release.season, opponentAllowed: 18, leagueMedianAllowed: 18, receptionPoints: 0.5 });
  assert.equal(current.median, 0);
  assert.equal(current.availabilityApplied, true);
});

test("the guarded model beats recent-points and prior-season baselines on the Week 2 holdout", () => {
  let observations = 0;
  let modelError = 0;
  let recentError = 0;
  let priorError = 0;
  for (const player of Object.values(release.players)) {
    const position = player.roster?.position;
    if (!["QB", "RB", "WR", "TE"].includes(position)) continue;
    const actual = player.games.find((game) => game.season === release.season && game.week === 2);
    const recent = player.games.find((game) => game.season === release.season && game.week === 1);
    const prior = player.seasons.find((season) => season.season === release.season - 1);
    const team = teams.teams[player.roster.team];
    const game = team?.schedule.find((candidate) => candidate.week === 2);
    const opponent = teams.teams[game?.opponentAbbr];
    if (!actual || !recent || !prior || !opponent) continue;
    const allowed = release.positionDefense.teams[opponent.abbr][position].pointsPerGame.halfPpr;
    const league = Object.values(release.positionDefense.teams).map((positions) => positions[position].pointsPerGame.halfPpr).sort((left, right) => left - right);
    const projection = projectPlayerWeek({ player, week: 2, season: release.season, opponentAllowed: allowed, leagueMedianAllowed: (league[15] + league[16]) / 2, receptionPoints: 0.5 });
    const actualPoints = fantasyPoints(actual, 0.5, 4);
    const recentPoints = fantasyPoints(recent, 0.5, 4);
    if (!projection || actualPoints === null || recentPoints === null) continue;
    observations += 1;
    modelError += Math.abs(projection.median - actualPoints);
    recentError += Math.abs(recentPoints - actualPoints);
    priorError += Math.abs(prior.halfPprPointsPerGame - actualPoints);
  }
  assert.ok(observations >= 150);
  assert.ok(modelError / observations < recentError / observations);
  assert.ok(modelError / observations < priorError / observations);
});

test("start/sit pages answer the query, grade results, and stay connected", () => {
  assert.match(hub, /Who should I/);
  assert.match(hub, /Standard · Half PPR · PPR/);
  assert.match(detail, /Start lean/);
  assert.match(detail, /floor–median–ceiling/);
  assert.match(detail, /ResultSection/);
  assert.match(detail, /same-week listed availability/i);
  assert.match(detail, /official inactive list/i);
  assert.match(library, /activeStartSitWeek/);
  assert.match(sitemap, /startSitComparisons/);
  assert.match(indexNow, /startSitComparisons/);
  assert.match(playbook, /start\/sit/i);
});

