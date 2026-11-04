import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [manifest, playerPages, publicRelease, generator, hub, detail, builder, library, sitemap, indexNow, footer, rosHub, playbook] = await Promise.all([
  read("../data/trade-decision-comparisons.json").then(JSON.parse),
  read("../data/player-pages.json").then(JSON.parse),
  read("../data/public-release.json").then(JSON.parse),
  read("../scripts/generate-trade-decisions.mjs"),
  read("../src/app/fantasy-football-trade-finder/page.tsx"),
  read("../src/app/should-i-trade/[slug]/page.tsx"),
  read("../src/app/components/TradeFinderBuilder.tsx"),
  read("../src/app/lib/trade-decisions.ts"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/fantasy-football-rest-of-season-comparisons/page.tsx"),
  read("../../docs/SEO_EXPERIMENT_PLAYBOOK.md"),
]);

const publishedPlayers = new Set(playerPages.map(({ slug }) => slug));
const redraftPlayers = new Set(publicRelease.playerMarkets["redraft:1:0"].data.map(({ slug }) => slug));

test("trade finder launches a bounded, current-data-backed cohort", () => {
  assert.equal(manifest.length, 24);
  assert.equal(new Set(manifest.map(({ slug }) => slug)).size, manifest.length);
  assert.equal(new Set(manifest.map(({ leftSlug, rightSlug }) => [leftSlug, rightSlug].sort().join("|"))).size, manifest.length);
  for (const comparison of manifest) {
    assert.match(comparison.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-for-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.notEqual(comparison.leftSlug, comparison.rightSlug);
    assert.ok(publishedPlayers.has(comparison.leftSlug), `${comparison.leftSlug} needs a player file`);
    assert.ok(publishedPlayers.has(comparison.rightSlug), `${comparison.rightSlug} needs a player file`);
    assert.ok(redraftPlayers.has(comparison.leftSlug), `${comparison.leftSlug} needs a current redraft value`);
    assert.ok(redraftPlayers.has(comparison.rightSlug), `${comparison.rightSlug} needs a current redraft value`);
  }
});

test("observed trade-query pairs have exact, non-weekly destinations", () => {
  const pairs = new Set(manifest.map(({ leftSlug, rightSlug }) => [leftSlug, rightSlug].sort().join("|")));
  for (const pair of [
    ["chase-brown-rb", "javonte-williams-rb"],
    ["javonte-williams-rb", "nico-collins-wr"],
    ["devonta-smith-wr", "breece-hall-rb"],
    ["parker-washington-wr", "chase-brown-rb"],
    ["aj-brown-wr", "malik-nabers-wr"],
  ]) {
    const bothCurrent = pair.every((slug) => redraftPlayers.has(slug));
    if (bothCurrent) assert.ok(pairs.has(pair.sort().join("|")), `${pair.join(" for ")} should be published`);
  }
});

test("weekly regeneration preserves valid URLs and replaces unsupported players", () => {
  assert.match(generator, /TARGET_COUNT = 24/);
  assert.match(generator, /for \(const comparison of existingComparisons\)/);
  assert.match(generator, /if \(!left \|\| !right \|\| left\.slug === right\.slug\) return false/);
  assert.match(generator, /currentSeasonGames > 0/);
  assert.match(generator, /overallRank <= 96/);
  assert.doesNotMatch(generator, /Math\.random/);
});

test("finder and detail pages answer trade intent with useful next actions", () => {
  assert.match(hub, /Fantasy Football Trade Finder/);
  assert.match(hub, /trade_finder_viewed/);
  assert.match(hub, /TradeFinderBuilder/);
  assert.match(hub, /getRestOfSeasonRankingRows\("ALL"\)/);
  assert.doesNotMatch(hub, /cards\.flatMap/);
  assert.match(hub, /"@type": "CollectionPage"/);
  assert.match(builder, /trade_finder_submitted/);
  assert.match(builder, /fantasy-trade-calculator\?send=/);
  assert.match(builder, /useState\(""\)/);
  assert.match(detail, /dynamicParams = false/);
  assert.match(detail, /Should I Trade/);
  assert.match(detail, /trade_decision_viewed/);
  assert.match(detail, /"@type": "FAQPage"/);
  assert.match(detail, /PlayerPortrait/);
  assert.match(detail, /PPR/);
  assert.match(detail, /Half PPR/);
  assert.match(detail, /Standard/);
  assert.match(detail, /recent workload/i);
  assert.match(detail, /remaining positional schedule/i);
  assert.match(detail, /fantasy-trade-calculator\?send=/);
  assert.doesNotMatch(hub + detail, /Search Console|DataForSEO|experiment|hypothesis|cohort/i);
});

test("trade pages are crawlable and connected to the ROS product hierarchy", () => {
  for (const source of [sitemap, indexNow, footer, rosHub]) assert.ok(source.includes("/fantasy-football-trade-finder"));
  assert.match(sitemap, /tradeDecisionComparisons\.map/);
  assert.match(sitemap, /tradeFinderPath\(slug\)/);
  assert.match(indexNow, /tradeDecisionComparisons\.map/);
  assert.match(library, /tradeDecisionSlugs/);
  assert.match(library, /getRelatedTradeDecisions/);
  assert.match(playbook, /E22: redraft trade finder/);
});
