import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [teamLogo, home, scoring, comparisonHub, comparisonDetail, teamDetail, styles] = await Promise.all([
  readFile(new URL("../src/app/components/TeamLogo.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/ScoringResearchPage.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/player-comparisons/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/player-comparisons/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/teams/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
]);

test("team marks use one data-backed, accessible visual treatment", () => {
  assert.match(teamLogo, /getTeamByAbbr/);
  assert.match(teamLogo, /profile\.logo\.src/);
  assert.match(teamLogo, /profile\.logo\.alt/);
  assert.match(styles, /\.team-logo/);
  assert.match(styles, /--team-primary/);
});

test("the homepage hero pairs market proof with players and team identity", () => {
  assert.match(home, /HeroPlayerCard/);
  assert.match(home, /<PlayerPortrait/);
  assert.match(home, /<TeamLogo/);
  assert.match(home, /Current dynasty Superflex market/);
});

test("search landing pages visibly connect scoring values to player identity", () => {
  assert.match(scoring, /ResearchPlayerSpotlight/);
  assert.match(scoring, /ScoringPlayerIdentity/);
  assert.match(scoring, /Live value board/);
  assert.match(scoring, /<PlayerPortrait/);
  assert.match(scoring, /<TeamLogo/);
});

test("comparison and team research pages carry portraits and club marks", () => {
  assert.match(comparisonHub, /HubPortrait/);
  assert.match(comparisonHub, /ComparisonCardPlayer/);
  assert.match(comparisonDetail, /ComparisonHeroDuel/);
  assert.match(comparisonDetail, /ComparisonHeroPlayer/);
  assert.match(teamDetail, /TeamPlayerIdentity/);
  assert.match(teamDetail, /team=\{opponent\.abbr\}/);
});
