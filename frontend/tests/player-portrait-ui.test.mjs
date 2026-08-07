import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [portrait, playerPage, playerIndex, styles] = await Promise.all([
  readFile(new URL("../src/app/components/PlayerPortrait.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/players/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/players/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
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

test("player pages and both directory densities use the shared portrait", () => {
  assert.match(playerPage, /variant="hero"/);
  assert.match(playerPage, /priority/);
  assert.match(playerIndex, /variant="card"/);
  assert.match(playerIndex, /variant="thumbnail"/);
  assert.match(playerIndex, /decorative/);
});
