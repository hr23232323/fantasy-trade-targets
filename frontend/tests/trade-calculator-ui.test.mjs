import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const calculator = await readFile(
  new URL("../src/app/components/TradeCalculator.tsx", import.meta.url),
  "utf8",
);

test("calculator asset surfaces use reviewed player thumbnails", () => {
  assert.match(calculator, /import PlayerPortrait from "\.\/PlayerPortrait"/);
  assert.match(calculator, /getTradePlayerImage/);
  assert.match(calculator, /function AssetThumbnail/);
  assert.match(calculator, /image=\{playerImage\}/);
  assert.match(calculator, /variant="thumbnail"/);

  const thumbnailUses = calculator.match(/<AssetThumbnail asset=\{asset\}/g) ?? [];
  assert.equal(
    thumbnailUses.length,
    3,
    "search results, selected assets, and balance suggestions show artwork",
  );
});

test("calculator thumbnails preserve useful fallbacks", () => {
  assert.match(calculator, /asset\.kind === "pick"/);
  assert.match(calculator, /asset\.year\?\.slice\(-2\)/);
  assert.match(calculator, /initials \|\| asset\.position/);
  assert.match(calculator, /aria-hidden="true"/);
});
