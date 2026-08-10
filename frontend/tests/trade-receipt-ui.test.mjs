import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [actions, receipt, tradeCard, playerPageHelpers, tradePlayerImages] = await Promise.all([
  readFile(
    new URL("../src/app/components/TradeReceiptActions.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/app/trades/[slug]/page.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/app/trade-card/route.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/app/lib/player-pages.ts", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../data/trade-player-images.json", import.meta.url),
    "utf8",
  ),
]);

test("shared trade actions keep dark text in light CTA treatments", () => {
  const explicitInkCount = actions.match(/text-\[#171c19\]/g)?.length ?? 0;
  assert.ok(explicitInkCount >= 2, "both shared-trade actions explicitly set ink text");
});

test("trade packages use reviewed imagery with visible licensing and fallbacks", () => {
  assert.match(receipt, /import PlayerPortrait/);
  assert.match(receipt, /getTradePlayerImage/);
  assert.match(receipt, /image=\{playerImage\}/);
  assert.match(receipt, /variant="thumbnail"/);
  assert.match(receipt, /playerImage\.sourceUrl/);
  assert.match(receipt, /playerImage\.author/);
  assert.match(receipt, /playerImage\.license/);
  assert.match(receipt, /playerImage\.licenseUrl/);
  assert.match(receipt, /<AssetArtwork asset=\{asset\}/);
  assert.match(receipt, /asset\.kind === "pick"/);
  assert.match(playerPageHelpers, /trade-player-images\.json/);
  assert.match(playerPageHelpers, /getPlayerPage\(slug\)\?\.image \?\?/);

  const supplementalImages = JSON.parse(tradePlayerImages);
  const saquon = supplementalImages.find(
    (player) => player.slug === "saquon-barkley-rb",
  );
  assert.ok(saquon, "Saquon has supplemental trade-card artwork");
  assert.equal(saquon.image.author, "PistonsFan2223");
  assert.equal(saquon.image.license, "CC BY-SA 4.0");
});

test("generated share cards carry dependency-free branded player artwork", () => {
  assert.match(tradeCard, /function TradeCardPortrait/);
  assert.match(tradeCard, /const initials = asset\.name/);
  assert.match(tradeCard, /initials \|\| asset\.position/);
  assert.match(tradeCard, /positionColor\(asset\.position\)/);
  assert.doesNotMatch(tradeCard, /upload\.wikimedia\.org/);
});

test("shared reports preserve and display scoring context", () => {
  assert.match(receipt, /passing_td_points: trade\.passingTdPoints/);
  assert.match(receipt, /label="Pass TD"/);
  assert.match(receipt, /label="Receptions"/);
  assert.match(receipt, /asset\.scoringContext\?\.valueDelta/);
  assert.match(tradeCard, /trade\.passingTdPoints/);
  assert.match(tradeCard, /pprLabel\(trade\.receptionPoints\)/);
});
