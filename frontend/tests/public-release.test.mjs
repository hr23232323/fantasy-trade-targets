import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const release = JSON.parse(
  await readFile(new URL("../data/public-release.json", import.meta.url), "utf8"),
);
const playerPages = JSON.parse(
  await readFile(new URL("../data/player-pages.json", import.meta.url), "utf8"),
);
const compactSnapshotHistory = JSON.parse(
  await readFile(
    new URL("../../data/player-snapshot-history.json", import.meta.url),
    "utf8",
  ),
);

test("public release contains every supported market variant", () => {
  assert.equal(release.schemaVersion, 2);
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
  const currentMarket = release.playerMarkets["dynasty:2:0"].data;

  assert.equal(playerPages.length, 50);
  assert.equal(new Set(playerPages.map((page) => page.slug)).size, 50);
  assert.equal(new Set(playerPages.map((page) => page.image.src)).size, 50);
  assert.equal(Object.keys(release.playerProfiles).length, 50);

  for (const page of playerPages) {
    const profile = release.playerProfiles[page.slug];
    const currentPlayer = currentMarket.find((player) => player.slug === page.slug);
    assert.ok(profile, `${page.slug} profile exists`);
    assert.ok(currentPlayer, `${page.slug} exists in the current market`);
    assert.equal(profile.data.slug, page.slug);
    assert.equal(profile.data.name, page.name);
    assert.equal(profile.data.name, currentPlayer.name);
    assert.equal(profile.data.position, currentPlayer.position);
    assert.equal(profile.data.team, currentPlayer.team);
    assert.equal(profile.data.composite, currentPlayer.composite);
    assert.ok(Array.isArray(profile.data.history));
    assert.ok(Array.isArray(profile.data.similar));
    assert.ok(profile.data.stats?.derivedStats);
    assert.ok(Number.isFinite(Date.parse(profile.meta.generatedAt)));
    const snapshots = release.playerSnapshotHistory[page.slug];
    assert.ok(Array.isArray(snapshots), `${page.slug} snapshot history exists`);
    assert.ok(snapshots.length >= 1, `${page.slug} has an FTT observation`);
    assert.equal(snapshots.at(-1).releaseId, release.releaseId);
    assert.equal(typeof snapshots.at(-1).value, "number");
    assert.equal(snapshots.at(-1).value, currentPlayer.composite);
    assert.equal(snapshots.at(-1).rank, currentPlayer.rank);
    assert.equal(snapshots.at(-1).posRank, currentPlayer.posRank);
    assert.equal(
      new Set(snapshots.map((observation) => observation.releaseId)).size,
      snapshots.length,
      `${page.slug} has no duplicate release observations`,
    );
    assert.deepEqual(
      snapshots,
      [...snapshots].sort(
        (left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt),
      ),
      `${page.slug} observations are chronological`,
    );
    assert.ok(
      Number.isFinite(Date.parse(snapshots.at(-1).observedAt)),
      `${page.slug} observation has a valid timestamp`,
    );
    assert.ok(page.image.src.startsWith("https://upload.wikimedia.org/"));
    assert.ok(page.image.licenseUrl.startsWith("https://creativecommons.org/"));
    assert.ok(page.image.sourceUrl.startsWith("https://commons.wikimedia.org/"));
    assert.ok(page.image.author);
    assert.ok(page.image.alt.includes(page.name));
    assert.ok(page.image.width > 0);
    assert.ok(page.image.height > 0);
  }
});

test("compact snapshot history matches the packaged release", () => {
  assert.equal(compactSnapshotHistory.schemaVersion, 1);
  assert.equal(compactSnapshotHistory.updatedAt, release.capturedAt);
  assert.deepEqual(compactSnapshotHistory.players, release.playerSnapshotHistory);
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
