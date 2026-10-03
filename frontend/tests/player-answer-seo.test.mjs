import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, manifest, release] = await Promise.all([
  readFile(new URL("../src/app/players/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../data/player-pages.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-release.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("every player file gets the answer-first trade and usage treatment", () => {
  assert.match(page, /Dynasty Value \(\$\{year\}\): Trade or Hold\?/);
  assert.match(page, /Should you trade \{profile\.name\}\?/);
  assert.match(page, /What is \{firstName\(profile\.name\)\} worth\?/);
  assert.match(page, /getRecentPlayerContext\(profile\.slug\)/);
  assert.match(page, /player1=\$\{startSitUrlPlayerSlug\(profile\.slug\)\}/);
  assert.match(page, /qbs=2&send=\$\{profile\.slug\}/);
  assert.match(page, /Set Week \{activeStartSitWeek\} lineup/);
  assert.match(page, /"@type": "FAQPage"/);
});

test("the improved family covers every published player page and high-impression query target", () => {
  assert.equal(manifest.length, 220);
  const slugs = new Set(manifest.map(({ slug }) => slug));
  for (const slug of [
    "caleb-douglas-wr",
    "jalen-coker-wr",
    "devon-achane-rb",
    "jahmyr-gibbs-rb",
    "george-pickens-wr",
    "tony-pollard-rb",
  ]) {
    assert.ok(slugs.has(slug), `${slug} must receive the shared answer-first template`);
    assert.ok(release.playerProfiles[slug], `${slug} must remain backed by the current market release`);
  }
});

test("trade answers remain bounded by published market evidence", () => {
  assert.match(page, /Math\.abs\(movement\.percentChange\) < 2/);
  assert.match(page, /over the last month/);
  assert.match(page, /current tier/);
  assert.doesNotMatch(page, /guaranteed|lock of the week|must trade/i);
});
