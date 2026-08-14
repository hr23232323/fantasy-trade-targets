import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [
  manifest,
  playerManifest,
  release,
  hub,
  detail,
  comparisonLib,
  sitemap,
  indexNow,
  header,
  footer,
  players,
  home,
  playerDetail,
  methodology,
  dataSources,
] = await Promise.all([
  readFile(new URL("../data/player-comparisons.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/player-pages.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-release.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../src/app/player-comparisons/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/player-comparisons/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/lib/player-comparisons.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
  readFile(new URL("../scripts/submit-indexnow.mjs", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/SiteHeader.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/components/Footer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/players/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/players/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/methodology/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/data-sources/page.tsx", import.meta.url), "utf8"),
]);

const baselinePlayers = new Map(
  release.playerMarkets["dynasty:2:0"].data.map((player) => [player.slug, player]),
);
const publishedPlayers = new Set(playerManifest.map((player) => player.slug));

test("the expansion is exactly 25 substantial assets", () => {
  assert.equal(manifest.length, 24, "24 detail pages plus one hub should ship");
  assert.match(hub, /Twenty-four decisions worth measuring/);
  assert.match(hub, /48 distinct players/);
  assert.match(detail, /The short answer/);
  assert.match(detail, /The evidence underneath the market answer/);
  assert.match(detail, /Comparison FAQ/);
  assert.match(detail, /Same-position decisions/);
});

test("24 comparisons cover 48 unique, reviewed, scoring-covered players", () => {
  const usedPlayers = manifest.flatMap(({ leftSlug, rightSlug }) => [leftSlug, rightSlug]);
  assert.equal(new Set(usedPlayers).size, 48, "a player must not be repeated in the initial set");
  assert.deepEqual(
    Object.fromEntries(
      ["QB", "RB", "WR", "TE"].map((position) => [
        position,
        manifest.filter((comparison) => comparison.position === position).length,
      ]),
    ),
    { QB: 6, RB: 6, WR: 8, TE: 4 },
  );

  for (const comparison of manifest) {
    const left = baselinePlayers.get(comparison.leftSlug);
    const right = baselinePlayers.get(comparison.rightSlug);
    assert.ok(left, `${comparison.leftSlug} must exist in the baseline market`);
    assert.ok(right, `${comparison.rightSlug} must exist in the baseline market`);
    assert.ok(publishedPlayers.has(comparison.leftSlug), `${comparison.leftSlug} needs a complete player page`);
    assert.ok(publishedPlayers.has(comparison.rightSlug), `${comparison.rightSlug} needs a complete player page`);
    assert.ok(release.playerScoringProfiles[comparison.leftSlug], `${comparison.leftSlug} needs a scoring profile`);
    assert.ok(release.playerScoringProfiles[comparison.rightSlug], `${comparison.rightSlug} needs a scoring profile`);
    assert.equal(left.position, comparison.position);
    assert.equal(right.position, comparison.position);
    assert.ok(left.rank <= 100 && right.rank <= 100, "initial comparisons stay within the reviewed top 100");
    assert.match(comparison.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(comparison.editorialLens.length >= 175, `${comparison.slug} needs a substantive editorial lens`);
    assert.ok(comparison.decisionFrame.length >= 100, `${comparison.slug} needs a substantive decision frame`);
  }
});

test("comparison routes answer format and scoring questions with visible definitions", () => {
  assert.match(detail, /Dynasty Superflex/);
  assert.match(detail, /Dynasty 1QB/);
  assert.match(detail, /Superflex TEP/);
  assert.match(detail, /Redraft 1QB/);
  assert.match(detail, /4-point passing TD/);
  assert.match(detail, /6-point passing TD/);
  assert.match(detail, /Standard/);
  assert.match(detail, /Half PPR/);
  assert.match(detail, /Full PPR/);
  assert.match(detail, /same-position replacement/);
  assert.match(detail, /<abbr title=\{row\.detail\}/);
  assert.match(detail, /SAME_TIER_PERCENT = 5/);
});

test("comparison pages have AEO structure, transparent boundaries, and analytics", () => {
  assert.match(detail, /"@type": "WebPage"/);
  assert.match(detail, /"@type": "FAQPage"/);
  assert.match(detail, /"@type": "BreadcrumbList"/);
  assert.match(detail, /player_comparison_viewed/);
  assert.match(detail, /comparison_calculator_opened/);
  assert.match(detail, /scoring_leader_flip/);
  assert.match(detail, /This comparison does not include injury news, projections/);
  assert.match(hub, /"@type": "CollectionPage"/);
  assert.match(hub, /player_comparison_hub_viewed/);
  assert.match(hub, /not generated as every possible name combination/);
});

test("the comparison collection is crawlable and connected to the existing hierarchy", () => {
  for (const source of [sitemap, indexNow, header, footer, players, home]) {
    assert.ok(source.includes("/player-comparisons"));
  }
  assert.match(sitemap, /playerComparisons\.map/);
  assert.match(sitemap, /lastModified: marketUpdated/);
  assert.match(indexNow, /playerComparisons\.map/);
  assert.match(comparisonLib, /playerComparisonSlugs/);
  assert.match(comparisonLib, /getRelatedComparisons/);
  assert.match(playerDetail, /getComparisonForPlayer/);
  assert.match(playerDetail, /Compare with \{comparisonOpponent\.name\}/);
});

test("comparison math and provenance are published in methodology and data sources", () => {
  assert.match(methodology, /VALUE GAP % = \|PLAYER A − PLAYER B\|/);
  assert.match(methodology, /SAME COMPARISON TIER = VALUE GAP ≤ 5%/);
  assert.match(methodology, /initial 24 matchups contain 48 distinct/);
  assert.match(dataSources, /Comparison evidence \/\/ 48 players/);
  assert.match(dataSources, /new view over the same current release/);
  assert.match(dataSources, /never overwrites market or scoring values/);
});
