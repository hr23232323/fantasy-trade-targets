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
  nflverseLib,
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
  readFile(new URL("../src/app/lib/nflverse.ts", import.meta.url), "utf8"),
]);

const baselinePlayers = new Map(
  release.playerMarkets["dynasty:2:0"].data.map((player) => [player.slug, player]),
);
const comparisonMarkets = ["dynasty:2:0", "dynasty:1:0", "dynasty:2:1", "redraft:1:0"].map(
  (key) => [key, new Set(release.playerMarkets[key].data.map((player) => player.slug))],
);
const publishedPlayers = new Set(playerManifest.map((player) => player.slug));

// The redraft board is a ~200-slot list that churns daily, so fringe players rotate out of it
// without warning. src/app/lib/player-comparisons.ts already drops any comparison whose players
// are not covered by every required market, so the manifest is curated editorial input and the
// supported subset is what actually publishes. Assertions are split along that same line.
const marketCoveredPlayers = comparisonMarkets
  .map(([, playerSlugs]) => playerSlugs)
  .reduce((covered, market) => new Set([...covered].filter((slug) => market.has(slug))));
const publishedComparisons = manifest.filter(
  ({ leftSlug, rightSlug }) =>
    marketCoveredPlayers.has(leftSlug) && marketCoveredPlayers.has(rightSlug),
);

test("the comparison collection expands in reviewed batches", () => {
  assert.equal(manifest.length, 132, "132 detail pages plus one hub should ship");
  assert.match(hub, /\{comparisons\.length\} decisions worth measuring/);
  assert.match(hub, /Compare \{distinctPlayerCount\} players/);
  assert.match(detail, /The short answer/);
  assert.match(detail, /The evidence underneath the market answer/);
  assert.match(detail, /Comparison FAQ/);
  assert.match(detail, /Same-position decisions/);
});

test("132 comparisons cover reviewed, scoring-covered players", () => {
  const usedPlayers = manifest.flatMap(({ leftSlug, rightSlug }) => [leftSlug, rightSlug]);
  assert.ok(new Set(usedPlayers).size >= 130);
  assert.deepEqual(
    Object.fromEntries(
      ["QB", "RB", "WR", "TE"].map((position) => [
        position,
        manifest.filter((comparison) => comparison.position === position).length,
      ]),
    ),
    { QB: 24, RB: 41, WR: 45, TE: 22 },
  );

  for (const comparison of manifest) {
    assert.ok(publishedPlayers.has(comparison.leftSlug), `${comparison.leftSlug} needs a complete player page`);
    assert.ok(publishedPlayers.has(comparison.rightSlug), `${comparison.rightSlug} needs a complete player page`);
    assert.match(comparison.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(comparison.editorialLens.length >= 175, `${comparison.slug} needs a substantive editorial lens`);
    assert.ok(comparison.decisionFrame.length >= 100, `${comparison.slug} needs a substantive decision frame`);
  }
});

test("the comparisons that publish stay backed by the current market release", () => {
  // A floor rather than an exact count: routine churn drops a handful of comparisons, but a
  // collapsed or renamed market would drop most of them and must still fail the build.
  assert.ok(
    publishedComparisons.length >= 90,
    `only ${publishedComparisons.length} of ${manifest.length} comparisons are still market-backed`,
  );
  const publishedComparisonPlayers = new Set(
    publishedComparisons.flatMap(({ leftSlug, rightSlug }) => [leftSlug, rightSlug]),
  );
  assert.ok(
    publishedComparisonPlayers.size >= 115,
    `only ${publishedComparisonPlayers.size} distinct players remain market-backed`,
  );

  for (const comparison of publishedComparisons) {
    const left = baselinePlayers.get(comparison.leftSlug);
    const right = baselinePlayers.get(comparison.rightSlug);
    assert.ok(left, `${comparison.leftSlug} must exist in the baseline market`);
    assert.ok(right, `${comparison.rightSlug} must exist in the baseline market`);
    assert.ok(release.playerScoringProfiles[comparison.leftSlug], `${comparison.leftSlug} needs a scoring profile`);
    assert.ok(release.playerScoringProfiles[comparison.rightSlug], `${comparison.rightSlug} needs a scoring profile`);
    assert.equal(left.position, comparison.position);
    assert.equal(right.position, comparison.position);
    assert.ok(Number.isInteger(left.rank) && Number.isInteger(right.rank), "comparisons retain current published ranks");
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
  assert.match(detail, /This comparison does not include player projections, live inactive decisions/);
  assert.match(detail, /What changed on the field/);
  assert.match(detail, /Latest usage/);
  assert.match(detail, /Listed availability/);
  assert.match(detail, /nflversePlayerRelease\.releaseId/);
  assert.match(nflverseLib, /getRecentPlayerContext/);
  assert.match(nflverseLib, /opportunityChange/);
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
  assert.match(comparisonLib, /supportedPlayerSlugs/);
  assert.match(playerDetail, /getComparisonForPlayer/);
  assert.match(playerDetail, /Compare with \{comparisonOpponent\.name\}/);
});

test("comparison math and provenance are published in methodology and data sources", () => {
  assert.match(methodology, /VALUE GAP % = \|PLAYER A − PLAYER B\|/);
  assert.match(methodology, /SAME COMPARISON TIER = VALUE GAP ≤ 5%/);
  assert.match(methodology, /expands in reviewed batches/);
  assert.match(dataSources, /Comparison evidence \/\/ reviewed matchups/);
  assert.match(dataSources, /new view over the same current release/);
  assert.match(dataSources, /never overwrites market or scoring values/);
});
