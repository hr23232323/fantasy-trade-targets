import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const release = JSON.parse(
  await readFile(new URL("../data/public-release.json", import.meta.url), "utf8"),
);
const playerPages = JSON.parse(
  await readFile(new URL("../data/player-pages.json", import.meta.url), "utf8"),
);

test("public release contains every supported market variant", () => {
  assert.equal(release.schemaVersion, 1);
  assert.match(release.releaseId, /^ftt-\d{8}T\d{6}Z$/);
  assert.equal(Object.keys(release.playerMarkets).length, 8);
  assert.equal(Object.keys(release.pickMarkets).length, 10);

  for (const [key, payload] of Object.entries(release.playerMarkets)) {
    const minimum = key.startsWith("redraft:") ? 150 : 300;
    assert.ok(payload.data.length >= minimum, `${key} has a complete player market`);
    assert.ok(payload.meta.generatedAt, `${key} records source freshness`);
  }
});

test("every configured player page has a validated profile", () => {
  for (const page of playerPages) {
    const profile = release.playerProfiles[page.slug];
    assert.ok(profile, `${page.slug} profile exists`);
    assert.equal(profile.data.slug, page.slug);
    assert.ok(Array.isArray(profile.data.history));
    assert.ok(page.image.src.startsWith("https://upload.wikimedia.org/"));
    assert.ok(page.image.licenseUrl.startsWith("https://creativecommons.org/"));
  }
});

test("market assets retain reproducible rank and value fields", () => {
  const market = release.playerMarkets["dynasty:2:0"].data;
  const configured = new Set(playerPages.map((page) => page.slug));
  const matched = market.filter((player) => configured.has(player.slug));

  assert.equal(matched.length, playerPages.length);
  for (const player of matched) {
    assert.equal(typeof player.composite, "number");
    assert.equal(typeof player.rank, "number");
    assert.equal(typeof player.posRank, "number");
  }
});
