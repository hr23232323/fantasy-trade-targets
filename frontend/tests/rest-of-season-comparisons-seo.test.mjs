import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [manifest, playerPages, publicRelease, generator, hub, detail, library, sitemap, indexNow, footer, rankingsPage, playbook] = await Promise.all([
  read("../data/rest-of-season-comparisons.json").then(JSON.parse),
  read("../data/player-pages.json").then(JSON.parse),
  read("../data/public-release.json").then(JSON.parse),
  read("../scripts/generate-rest-of-season-comparisons.mjs"),
  read("../src/app/fantasy-football-rest-of-season-comparisons/page.tsx"),
  read("../src/app/fantasy-football-rest-of-season-comparisons/[slug]/page.tsx"),
  read("../src/app/lib/rest-of-season-comparisons.ts"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/components/RestOfSeasonRankingsPage.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

const publishedPlayers = new Set(playerPages.map(({ slug }) => slug));
const redraftPlayers = new Map(publicRelease.playerMarkets["redraft:1:0"].data.map((player) => [player.slug, player]));

test("the first ROS comparison cohort is bounded, balanced, and current-release backed", () => {
  assert.equal(manifest.length, 30);
  assert.equal(new Set(manifest.map(({ slug }) => slug)).size, 30);
  assert.deepEqual(
    Object.fromEntries(["QB", "RB", "WR", "TE"].map((position) => [position, manifest.filter((comparison) => comparison.position === position).length])),
    { QB: 7, RB: 8, WR: 9, TE: 6 },
  );

  const pairKeys = new Set();
  for (const comparison of manifest) {
    const left = redraftPlayers.get(comparison.leftSlug);
    const right = redraftPlayers.get(comparison.rightSlug);
    assert.ok(left, `${comparison.leftSlug} must exist in the current redraft release`);
    assert.ok(right, `${comparison.rightSlug} must exist in the current redraft release`);
    assert.ok(publishedPlayers.has(comparison.leftSlug), `${comparison.leftSlug} needs a player file`);
    assert.ok(publishedPlayers.has(comparison.rightSlug), `${comparison.rightSlug} needs a player file`);
    assert.equal(left.position, comparison.position);
    assert.equal(right.position, comparison.position);
    assert.match(comparison.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-vs-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(comparison.selectionReason.length >= 60);
    pairKeys.add([comparison.leftSlug, comparison.rightSlug].sort().join("|"));
  }
  assert.equal(pairKeys.size, manifest.length);
});

test("observed GSC pair demand is represented exactly once", () => {
  const pairs = new Set(manifest.map(({ leftSlug, rightSlug }) => [leftSlug, rightSlug].sort().join("|")));
  for (const pair of [
    ["sam-darnold-qb", "kyler-murray-qb"],
    ["kyren-williams-rb", "ashton-jeanty-rb"],
    ["zay-flowers-wr", "nico-collins-wr"],
  ]) assert.ok(pairs.has(pair.sort().join("|")), `${pair.join(" vs ")} should be published`);
});

test("the generator is deterministic and selects close, evidence-led decisions", () => {
  assert.match(generator, /TARGET_COUNT = 30/);
  assert.match(generator, /quotas = \{ QB: 7, RB: 8, WR: 9, TE: 6 \}/);
  assert.match(generator, /buildRestOfSeasonRankings/);
  assert.match(generator, /currentSeasonGames > 0/);
  assert.match(generator, /Search Console shows direct rest-of-season demand/);
  assert.doesNotMatch(generator, /Math\.random/);
});

test("ROS comparison pages answer the question directly and support the next decision", () => {
  assert.match(hub, /Rest-of-Season Fantasy Football Player Comparisons/);
  assert.match(hub, /rest_of_season_comparisons_viewed/);
  assert.match(hub, /"@type": "CollectionPage"/);
  assert.match(hub, /PPR, Half PPR and Standard/);

  assert.match(detail, /dynamicParams = false/);
  assert.match(detail, /Rest of Season\? \(2026\)/);
  assert.match(detail, /rest_of_season_comparison_viewed/);
  assert.match(detail, /"@type": "WebPage"/);
  assert.match(detail, /"@type": "FAQPage"/);
  assert.match(detail, /"@type": "BreadcrumbList"/);
  assert.match(detail, /PlayerPortrait/);
  assert.match(detail, /startSitPathForPlayers/);
  assert.match(detail, /send=\$\{comparison\.leftSlug\}&get=\$\{comparison\.rightSlug\}/);
  assert.match(detail, /Recent workload/);
  assert.match(detail, /remaining positional schedule/);
  assert.doesNotMatch(detail, /Search Console|DataForSEO|experiment|hypothesis|cohort/i);
});

test("the cohort is crawlable and connected to the ROS product hierarchy", () => {
  for (const source of [sitemap, indexNow, footer, rankingsPage]) assert.ok(source.includes("/fantasy-football-rest-of-season-comparisons"));
  assert.match(sitemap, /restOfSeasonComparisons\.map/);
  assert.match(indexNow, /restOfSeasonComparisons\.map/);
  assert.match(library, /restOfSeasonComparisonSlugs/);
  assert.match(library, /getRelatedRestOfSeasonComparisons/);
  assert.match(playbook, /E16: ROS player comparisons/);
  assert.match(playbook, /Measure the hub and detail pages separately after 7 and 14 days/);
});
