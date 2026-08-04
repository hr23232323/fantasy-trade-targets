import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  page,
  marketLibrary,
  jsonRoute,
  csvRoute,
  sitemap,
  robots,
  nextConfig,
  layout,
  deployWorkflow,
  indexNow,
  dataWorkflow,
  refreshScript,
] = await Promise.all([
  read("../src/app/market/page.tsx"),
  read("../src/app/lib/market.ts"),
  read("../src/app/market/data.json/route.ts"),
  read("../src/app/market/rankings.csv/route.ts"),
  read("../src/app/sitemap.ts"),
  read("../src/app/robots.ts"),
  read("../next.config.mjs"),
  read("../src/app/layout.tsx"),
  read("../../.github/workflows/_deploy.yml"),
  read("../scripts/submit-indexnow.mjs"),
  read("../../.github/workflows/data-refresh.yml"),
  read("../scripts/refresh-public-data.mjs"),
]);

test("apex domain is the sole canonical public host", () => {
  assert.match(nextConfig, /value: "www\.fantasytradetarget\.com"/);
  assert.match(nextConfig, /destination: "https:\/\/fantasytradetarget\.com\/:path\*"/);
  assert.doesNotMatch(layout, /https:\/\/www\.fantasytradetarget\.com/);
  assert.match(layout, /metadataBase: new URL\("https:\/\/fantasytradetarget\.com"\)/);
  assert.match(sitemap, /const BASE_URL = "https:\/\/fantasytradetarget\.com"/);
  assert.match(robots, /sitemap: "https:\/\/fantasytradetarget\.com\/sitemap\.xml"/);
  assert.match(deployWorkflow, /https:\/\/fantasytradetarget\.com\//);
  assert.match(indexNow, /const host = "fantasytradetarget\.com"/);
});

test("market hub is crawlable, substantial, and downloadable", () => {
  assert.match(sitemap, /"\/market"/);
  assert.match(indexNow, /"\/market"/);
  assert.match(page, /The fantasy market\./);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /<ServerMarketBoard/);
  assert.match(page, /getSevenDayMovements/);
  assert.match(page, /latestAt - 6 \* DAY_MS/);
  assert.match(page, /href="\/market\/data\.json"/);
  assert.match(page, /href="\/market\/rankings\.csv"/);
  assert.match(marketLibrary, /getMarketReleaseInfo/);
  assert.match(marketLibrary, /getPlayerSnapshotHistory/);
  assert.match(jsonRoute, /playerSnapshotHistory: getPlayerSnapshotHistory\(\)/);
  assert.match(csvRoute, /text\/csv/);
});

test("successful scheduled pulls retain current, compact, and full history", () => {
  assert.match(refreshScript, /data\/public-release\.json/);
  assert.match(refreshScript, /player-snapshot-history\.json/);
  assert.match(refreshScript, /"snapshots"/);
  assert.match(refreshScript, /\.json\.gz/);
  assert.match(dataWorkflow, /git add frontend\/data\/public-release\.json/);
  assert.match(dataWorkflow, /data\/player-snapshot-history\.json data\/snapshots/);
});
