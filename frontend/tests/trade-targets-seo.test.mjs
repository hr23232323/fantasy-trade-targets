import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, sitemap, indexNow, header, footer, home, playerIndex, playerManifest, methodology, dataSources] =
  await Promise.all([
    readFile(new URL("../src/app/fantasy-football-trade-targets/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/submit-indexnow.mjs", import.meta.url), "utf8"),
    readFile(new URL("../src/app/components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/players/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/player-pages.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../src/app/methodology/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/data-sources/page.tsx", import.meta.url), "utf8"),
  ]);

const route = "/fantasy-football-trade-targets";

test("the GSC trade-target opportunity has a substantial canonical hub", () => {
  assert.match(page, /Fantasy Football Trade Targets: Dynasty & Redraft/);
  assert.match(page, /Who should I trade for in fantasy football\?/);
  assert.match(page, /Dynasty-builder targets/);
  assert.match(page, /Contender trade targets/);
  assert.match(page, /same 1QB format/);
  assert.match(page, /Browse by NFL team/);
  assert.match(page, /"@type": "CollectionPage"/);
  assert.match(page, /"@type": "FAQPage"/);
  assert.match(page, /trade_targets_hub_viewed/);
  assert.match(page, /trade_target_opened/);
});

test("the trade-target hub is crawlable and globally linked", () => {
  for (const source of [sitemap, indexNow, header, footer, home]) {
    assert.ok(source.includes(route));
  }
});

test("the player footprint expands by 50 complete market files", () => {
  assert.equal(playerManifest.length, 100);
  assert.match(home, /\{playerPages\.length\} market files/);
  assert.match(playerIndex, /Complete index \/\/ \{playerPages\.length\} profiles/);
  assert.doesNotMatch(home, /50 market files|Browse all 50/);
  assert.doesNotMatch(playerIndex, /50 profiles/);
});

test("the new target and image rules are documented", () => {
  assert.match(methodology, /BUILDER EDGE = REDRAFT RANK − DYNASTY RANK/);
  assert.match(methodology, /CONTENDER EDGE = DYNASTY RANK − REDRAFT RANK/);
  assert.match(methodology, /not buy-low predictions/);
  assert.match(dataSources, /Commons \+ original art/);
  assert.match(dataSources, /original FTT player-file artwork/);
});
