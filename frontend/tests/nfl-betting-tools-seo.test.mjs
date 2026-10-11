import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertOddsInput, decimalOdds, impliedProbability, profitForStake, twoWayMarket } from "../src/app/lib/odds-math.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [release, refresh, trendsHub, teamPage, oddsPage, oddsUi, scorePage, scoreUi, sitemap, indexNow, footer, hub, playbook] = await Promise.all([
  read("../data/team-release.json").then(JSON.parse),
  read("../scripts/refresh-team-data.mjs"),
  read("../src/app/nfl-ats-records/page.tsx"),
  read("../src/app/nfl-ats-records/[teamSlug]/page.tsx"),
  read("../src/app/odds-calculator/page.tsx"),
  read("../src/app/components/OddsCalculator.tsx"),
  read("../src/app/nfl-score-predictor/page.tsx"),
  read("../src/app/components/NflScorePredictor.tsx"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/nfl-picks-predictions/page.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

function summarize(games) {
  const atsWins = games.filter(({ atsResult }) => atsResult === "W").length;
  const atsLosses = games.filter(({ atsResult }) => atsResult === "L").length;
  const overs = games.filter(({ totalResult }) => totalResult === "O").length;
  const unders = games.filter(({ totalResult }) => totalResult === "U").length;
  return {
    games: games.length,
    straightUp: { wins: games.filter(({ result }) => result === "W").length, losses: games.filter(({ result }) => result === "L").length, ties: games.filter(({ result }) => result === "T").length },
    againstSpread: { wins: atsWins, losses: atsLosses, pushes: games.filter(({ atsResult }) => atsResult === "P").length, coverRate: atsWins + atsLosses ? Math.round(atsWins / (atsWins + atsLosses) * 1000) / 1000 : null },
    totals: { overs, unders, pushes: games.filter(({ totalResult }) => totalResult === "P").length, overRate: overs + unders ? Math.round(overs / (overs + unders) * 1000) / 1000 : null },
  };
}

test("American odds conversion, payout and no-vig math remain exact", () => {
  assert.equal(impliedProbability(-110)?.toFixed(6), "0.523810");
  assert.equal(impliedProbability(150)?.toFixed(6), "0.400000");
  assert.equal(decimalOdds(-110)?.toFixed(6), "1.909091");
  assert.equal(decimalOdds(150), 2.5);
  assert.equal(profitForStake(-110, 100)?.toFixed(2), "90.91");
  assert.equal(profitForStake(150, 100), 150);
  assert.equal(convertOddsInput("2.5", "decimal")?.american, 150);
  assert.equal(convertOddsInput("3/2", "fractional")?.american, 150);
  assert.equal(impliedProbability(99), null);
  assert.equal(profitForStake(-110, -1), null);
  const even = twoWayMarket(-110, -110);
  assert.equal(even?.noVigA, 0.5);
  assert.equal(even?.noVigB, 0.5);
  assert.equal(even?.hold.toFixed(6), "0.047619");
});

test("all 32 teams have complete, correctly graded betting-trend history", () => {
  const teams = Object.values(release.teams);
  assert.equal(teams.length, 32);
  for (const team of teams) {
    const trend = team.bettingTrends;
    assert.ok(trend.previousSeason.games >= 17, `${team.abbr} has prior-season history`);
    assert.equal(trend.last10.games, 10, `${team.abbr} has 10 recent games`);
    assert.equal(new Set(trend.games.map(({ gameId }) => gameId)).size, trend.games.length, `${team.abbr} games are unique`);
    assert.deepEqual([...trend.games].sort((a, b) => a.date.localeCompare(b.date)), trend.games, `${team.abbr} games are chronological`);
    for (const game of trend.games) {
      const cover = Math.round((game.teamScore - game.opponentScore + game.teamSpread) * 10) / 10;
      const total = Math.round((game.teamScore + game.opponentScore - game.totalLine) * 10) / 10;
      assert.equal(game.atsResult, cover > 0 ? "W" : cover < 0 ? "L" : "P", `${team.abbr} ${game.gameId} ATS grade`);
      assert.equal(game.totalResult, total > 0 ? "O" : total < 0 ? "U" : "P", `${team.abbr} ${game.gameId} total grade`);
    }
    assert.deepEqual(trend.currentSeason, summarize(trend.games.filter(({ season }) => season === release.season)));
    assert.deepEqual(trend.previousSeason, summarize(trend.games.filter(({ season }) => season === release.baselineSeason)));
    assert.deepEqual(trend.last10, summarize(trend.games.slice(-10)));
  }
  assert.match(refresh, /teamScore - opponentScore \+ teamSpread/);
  assert.match(refresh, /teamScore \+ opponentScore - totalLine/);
});

test("the 35-page E19 cohort is answer-first, interactive and machine-readable", () => {
  assert.equal(1 + Object.keys(release.teams).length + 2, 35);
  assert.match(trendsHub, /NFL ATS records/);
  assert.match(trendsHub, /nfl_ats_records_viewed/);
  assert.match(trendsHub, /"@type": "CollectionPage"/);
  assert.match(teamPage, /nfl_team_betting_trends_viewed/);
  assert.match(teamPage, /"@type": "SportsTeam"/);
  assert.match(teamPage, /"@type": "FAQPage"/);
  assert.match(oddsPage, /Odds Calculator/);
  assert.match(oddsPage, /odds_calculator_viewed/);
  assert.match(oddsPage, /"@type": "WebApplication"/);
  assert.match(oddsUi, /odds_calculator_changed/);
  assert.match(oddsUi, /American.*decimal.*fractional/s);
  assert.match(oddsUi, /Negative hold/);
  assert.match(oddsUi, /Math\.abs\(market\.hold\)/);
  assert.match(scorePage, /NFL Score Predictor/);
  assert.match(scorePage, /nfl_score_predictor_viewed/);
  assert.match(scoreUi, /nfl_score_predictor_matchup_changed/);
  assert.match(scoreUi, /<select/);
  assert.match(playbook, /E19: NFL betting utilities and team trends/);
  assert.match(playbook, /35-page cohort/);
});

test("the betting utility cohort is crawlable and linked without internal planning copy", () => {
  for (const path of ["/nfl-ats-records", "/nfl-score-predictor", "/odds-calculator"]) {
    assert.ok(sitemap.includes(path), `${path} is in sitemap source`);
    assert.ok(indexNow.includes(path), `${path} is in IndexNow source`);
    assert.ok(footer.includes(path), `${path} is linked from footer`);
    assert.ok(hub.includes(path), `${path} is linked from NFL hub`);
  }
  assert.match(sitemap, /teamBettingTrendsPath/);
  assert.match(indexNow, /nfl-ats-records\/\$\{team\.slug\}/);
  for (const page of [trendsHub, teamPage, oddsPage, oddsUi, scorePage, scoreUi]) {
    assert.doesNotMatch(page, /DataForSEO|keyword difficulty|SEO experiment|Search Console|first cohort/i);
  }
});
