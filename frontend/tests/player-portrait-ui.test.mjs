import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const [portrait, playerPage, playerIndex, styles, pageRecords, tradeRecords, cachedImages] = await Promise.all([
  readFile(new URL("../src/app/components/PlayerPortrait.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/players/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/players/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../data/player-pages.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/trade-player-images.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/cached-player-images.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("player portraits have one responsive, position-aware treatment", () => {
  assert.match(portrait, /import Image from "next\/image"/);
  assert.match(portrait, /"josh-allen-qb"/);
  assert.match(portrait, /"bijan-robinson-rb"/);
  assert.match(portrait, /"jamarr-chase-wr"/);
  assert.match(portrait, /"brock-bowers-te"/);
  assert.match(portrait, /"justin-jefferson-wr"/);
  assert.match(portrait, /QB: \{ accent:/);
  assert.match(portrait, /RB: \{ accent:/);
  assert.match(portrait, /WR: \{ accent:/);
  assert.match(portrait, /TE: \{ accent:/);
  assert.match(styles, /\.player-portrait__splash/);
  assert.match(styles, /\.player-portrait__halftone/);
});

test("every reviewed player portrait is served from a valid local image", async () => {
  const reviewedSlugs = new Set([...pageRecords, ...tradeRecords].map((record) => record.slug));

  assert.equal(cachedImages.length, reviewedSlugs.size);
  assert.equal(new Set(cachedImages.map((image) => image.slug)).size, reviewedSlugs.size);

  for (const image of cachedImages) {
    assert.ok(reviewedSlugs.has(image.slug), `${image.slug} is reviewed`);
    assert.equal(image.src, `/images/players/${image.slug}.jpg`);
    assert.ok(image.width > 0 && image.height > 0, `${image.slug} has dimensions`);
    const file = await stat(new URL(`../public${image.src}`, import.meta.url));
    assert.ok(file.size > 5_000, `${image.slug} has a complete local image`);
  }
});

test("portrait motifs vary their geometry and only break boundaries on large surfaces", () => {
  assert.match(portrait, /function portraitMotif/);
  assert.match(portrait, /data-motif=\{portraitMotif\(slug\)\}/);
  assert.match(portrait, /player-portrait__clip/);
  assert.match(portrait, /player-portrait__secondary/);
  assert.match(portrait, /player-portrait__breaker/);

  for (let motif = 0; motif < 6; motif += 1) {
    assert.match(styles, new RegExp(`data-motif="${motif}"`));
  }

  assert.match(
    styles,
    /player-portrait\[data-variant="thumbnail"\][\s\S]*?\.player-portrait__breaker[\s\S]*?display: none/,
  );
  assert.match(playerPage, /overflow-visible/);
  assert.match(playerIndex, /z-10 min-h-80 overflow-visible/);
});

test("player pages and both directory densities use the shared portrait", () => {
  assert.match(playerPage, /variant="hero"/);
  assert.match(playerPage, /priority/);
  assert.match(playerIndex, /variant="card"/);
  assert.match(playerIndex, /variant="thumbnail"/);
  assert.match(playerIndex, /decorative/);
});
