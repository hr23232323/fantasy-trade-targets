import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("weekly ROS publication restores a demand pair when an upstream player returns", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ftt-ros-"));
  try {
    for (const directory of ["data", "scripts", "src/app/lib"]) await mkdir(path.join(root, directory), { recursive: true });
    for (const file of [
      "scripts/generate-rest-of-season-comparisons.mjs",
      "src/app/lib/rest-of-season-model.mjs",
      "src/app/lib/start-sit-model.mjs",
      "data/public-release.json",
      "data/nflverse-player-release.json",
      "data/team-release.json",
      "data/player-pages.json",
      "data/rest-of-season-comparisons.json",
    ]) await cp(new URL(`../${file}`, import.meta.url), path.join(root, file));

    const releasePath = path.join(root, "data/public-release.json");
    const release = JSON.parse(await readFile(releasePath, "utf8"));
    const market = release.playerMarkets["redraft:1:0"].data;
    // Simulate the sequence that blocked the November 12 refresh: Kyler drops
    // out, his spot is filled, then he returns to a cohort with a full QB quota.
    const returningPlayer = Object.values(release.playerMarkets)
      .flatMap(({ data }) => data).find(({ slug }) => slug === "kyler-murray-qb");
    assert.ok(returningPlayer);
    release.playerMarkets["redraft:1:0"].data = market.filter(({ slug }) => slug !== returningPlayer.slug);
    await writeFile(releasePath, JSON.stringify(release));
    const generate = () => execFileSync(process.execPath, [path.join(root, "scripts/generate-rest-of-season-comparisons.mjs")]);
    generate();
    release.playerMarkets["redraft:1:0"].data.push(returningPlayer);
    await writeFile(releasePath, JSON.stringify(release));
    generate();
    const outputPath = path.join(root, "data/rest-of-season-comparisons.json");
    const output = await readFile(outputPath, "utf8");
    const comparisons = JSON.parse(output);
    assert.equal(comparisons.length, 75);
    assert.equal(comparisons.filter(({ leftSlug, rightSlug }) =>
      [leftSlug, rightSlug].sort().join("|") === "kyler-murray-qb|sam-darnold-qb").length, 1);
    assert.deepEqual(Object.fromEntries(["QB", "RB", "WR", "TE"].map((position) =>
      [position, comparisons.filter((row) => row.position === position).length])),
    { QB: 18, RB: 21, WR: 22, TE: 14 });
    generate();
    assert.equal(await readFile(outputPath, "utf8"), output);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
