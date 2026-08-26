import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildRookiePickHistory,
  validateRookiePickHistory,
} from "../src/app/lib/rookie-pick-history.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [
  manifest,
  history,
  release,
  hub,
  detail,
  jsonRoute,
  csvRoute,
  library,
  marketLibrary,
  sitemap,
  indexNow,
  header,
  footer,
  home,
  market,
  methodology,
  dataSources,
  refreshScript,
  dataWorkflow,
] = await Promise.all([
  read("../data/rookie-pick-pages.json").then(JSON.parse),
  read("../data/rookie-pick-history.json").then(JSON.parse),
  read("../data/public-release.json").then(JSON.parse),
  read("../src/app/rookie-pick-values/page.tsx"),
  read("../src/app/rookie-pick-values/[slug]/page.tsx"),
  read("../src/app/rookie-pick-values/[slug]/data.json/route.ts"),
  read("../src/app/rookie-pick-values/[slug]/history.csv/route.ts"),
  read("../src/app/lib/rookie-picks.ts"),
  read("../src/app/lib/market.ts"),
  read("../src/app/sitemap.ts"),
  read("../scripts/submit-indexnow.mjs"),
  read("../src/app/components/SiteHeader.tsx"),
  read("../src/app/components/Footer.tsx"),
  read("../src/app/page.tsx"),
  read("../src/app/market/page.tsx"),
  read("../src/app/methodology/page.tsx"),
  read("../src/app/data-sources/page.tsx"),
  read("../scripts/refresh-public-data.mjs"),
  read("../../.github/workflows/data-refresh.yml"),
]);

test("the expansion is exactly 25 substantial, bounded assets", () => {
  assert.equal(manifest.length, 24, "24 exact-pick files plus one hub should ship");
  assert.equal(new Set(manifest.map(({ slug }) => slug)).size, 24);
  assert.equal(new Set(manifest.map(({ id }) => id)).size, 24);
  assert.deepEqual(
    Object.fromEntries(
      [1, 2].map((round) => [
        round,
        manifest.filter(({ id }) => id.startsWith(`pick_2027_${round}_`)).length,
      ]),
    ),
    { 1: 12, 2: 12 },
  );
  assert.match(hub, /Two rounds\. Twenty-four evidence files/);
  assert.match(detail, /The short answer/);
  assert.match(detail, /League-size matrix/);
  assert.match(detail, /Known-player equivalents/);
  assert.match(detail, /Trade-up \/ trade-down math/);
  assert.match(detail, /Cross-year equivalents/);
  assert.match(detail, /Observed market history/);
  assert.match(detail, /Rookie pick value FAQ/);
});

test("every configured pick exists in both current 12-team markets", () => {
  const oneQb = new Map(release.pickMarkets["1:12"].data.map((pick) => [pick.id, pick]));
  const superflex = new Map(release.pickMarkets["2:12"].data.map((pick) => [pick.id, pick]));
  for (const { id, slug } of manifest) {
    assert.match(slug, /^2027-[12]-\d{2}$/);
    assert.match(id, /^pick_2027_[12]_\d{2}$/);
    assert.ok(oneQb.has(id), `${id} must exist in the 1QB market`);
    assert.ok(superflex.has(id), `${id} must exist in the Superflex market`);
    assert.ok(Number.isFinite(oneQb.get(id).composite));
    assert.ok(Number.isFinite(superflex.get(id).composite));
  }
});

test("the public history is chronological, deduplicated, and current", () => {
  assert.equal(history.schemaVersion, 1);
  assert.equal(Object.keys(history.picks).length, 24);
  assert.equal(history.updatedAt, release.capturedAt);
  validateRookiePickHistory({ histories: history.picks, release });
  for (const { id } of manifest) {
    const observations = history.picks[id];
    assert.ok(observations.length >= 28, `${id} keeps the initial backfill`);
    assert.equal(
      new Set(observations.map(({ releaseId }) => releaseId)).size,
      observations.length,
      `${id} keeps one observation per release`,
    );
    assert.ok(
      observations.every(
        (observation, index) =>
          index === 0 ||
          Date.parse(observation.observedAt) >= Date.parse(observations[index - 1].observedAt),
      ),
    );
  }
});

test("history publication deduplicates releases and preserves format values", () => {
  const sample = manifest[0].id;
  const releases = [release, release];
  const built = buildRookiePickHistory({ existing: {}, releases, pickIds: [sample] });
  assert.equal(built[sample].length, 1);
  assert.equal(
    built[sample][0].oneQbValue,
    release.pickMarkets["1:12"].data.find((pick) => pick.id === sample).composite,
  );
  assert.equal(
    built[sample][0].superflexValue,
    release.pickMarkets["2:12"].data.find((pick) => pick.id === sample).composite,
  );
});

test("exact-pick pages provide AEO structure, visible limits, analytics, and real distributions", () => {
  assert.match(hub, /"@type": "CollectionPage"/);
  assert.match(hub, /"@type": "FAQPage"/);
  assert.match(detail, /"@type": "WebPage"/);
  assert.match(detail, /"@type": "Dataset"/);
  assert.match(detail, /"@type": "FAQPage"/);
  assert.match(detail, /"@type": "BreadcrumbList"/);
  assert.match(detail, /rookie_pick_research_viewed/);
  assert.match(detail, /rookie_pick_calculator_opened/);
  assert.match(detail, /rookie_pick_data_downloaded/);
  assert.match(detail, /not a projection/);
  assert.match(detail, /does not attach a future prospect/);
  assert.match(jsonRoute, /history12Team/);
  assert.match(jsonRoute, /leagueSizeValues/);
  assert.match(csvRoute, /text\/csv/);
  assert.match(csvRoute, /one_qb_value/);
  assert.match(csvRoute, /superflex_value/);
});

test("pick research is crawlable and connected across the existing site hierarchy", () => {
  for (const source of [sitemap, indexNow, header, footer, home, market]) {
    assert.ok(source.includes("/rookie-pick-values"));
  }
  assert.match(sitemap, /rookiePickPages\.map/);
  assert.match(indexNow, /rookiePickPages\.map/);
  assert.match(library, /getRelatedRookiePicks/);
  assert.match(library, /hasPlayerPage/);
  assert.match(marketLibrary, /getPickMarket/);
});

test("methodology, provenance, and the scheduled pipeline disclose and preserve the evidence", () => {
  assert.match(methodology, /ADJACENT-PICK GAP = NEIGHBOR VALUE − CURRENT PICK VALUE/);
  assert.match(methodology, /PLAYER EQUIVALENT = REVIEWED PLAYER WITH MINIMUM/);
  assert.match(methodology, /bounded draft-board reference/);
  assert.match(dataSources, /Rookie-pick evidence \/\/ 24 exact slots/);
  assert.match(dataSources, /initial 28-release backfill begins August 4, 2026/);
  assert.match(dataSources, /never overwrite the source value/);
  assert.match(refreshScript, /buildRookiePickHistory/);
  assert.match(refreshScript, /validateRookiePickHistory/);
  assert.match(refreshScript, /rookie-pick-history\.json/);
  assert.match(dataWorkflow, /frontend\/data\/rookie-pick-history\.json/);
});
