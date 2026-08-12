import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = new URL("..", import.meta.url);
const pageRecords = JSON.parse(await readFile(new URL("../data/player-pages.json", import.meta.url), "utf8"));
const tradeRecords = JSON.parse(await readFile(new URL("../data/trade-player-images.json", import.meta.url), "utf8"));
const records = [...new Map([...pageRecords, ...tradeRecords].map((record) => [record.slug, record])).values()]
  .filter((record) => record.image.src.startsWith("https://upload.wikimedia.org/"));
const outputDirectory = new URL("../public/images/players/", import.meta.url);
const manifestUrl = new URL("../data/cached-player-images.json", import.meta.url);
const temporaryDirectory = await mkdtemp(join(tmpdir(), "ftt-player-images-"));
const force = process.argv.includes("--force");
const manifest = [];

await mkdir(outputDirectory, { recursive: true });

for (const [index, record] of records.entries()) {
  const destination = new URL(`${record.slug}.jpg`, outputDirectory);
  const existing = await fileSize(destination);

  if (force || existing < 5_000) {
    const sourceFile = join(temporaryDirectory, `${String(index).padStart(2, "0")}-${basename(record.slug)}`);
    const imageBytes = await downloadPortrait(record);
    await writeFile(sourceFile, imageBytes);
    await run("/usr/bin/sips", [
      "--resampleHeightWidthMax",
      "960",
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "82",
      sourceFile,
      "--out",
      destination.pathname,
    ]);
  }

  const { stdout } = await run("/usr/bin/sips", [
    "-g",
    "pixelWidth",
    "-g",
    "pixelHeight",
    destination.pathname,
  ]);
  const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`Could not inspect ${record.slug}`);

  manifest.push({
    slug: record.slug,
    src: `/images/players/${record.slug}.jpg`,
    width,
    height,
  });
  console.log(`[${index + 1}/${records.length}] ${record.slug} · ${width}×${height}`);
  await wait(300);
}

await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Cached ${manifest.length} reviewed portraits.`);

async function downloadPortrait(record) {
  const candidates = [...new Set([
    record.image.src,
    originalCommonsUrl(record.image.src),
    optimizedProductionUrl(record.image.src),
  ])];

  for (const candidate of candidates) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(candidate, {
          headers: {
            Accept: "image/jpeg,image/png,image/*;q=0.8",
            "User-Agent": "FantasyTradeTarget/2026.08 (https://fantasytradetarget.com/data-sources)",
          },
        });
        const type = response.headers.get("content-type") || "";
        if (response.ok && type.startsWith("image/")) {
          return Buffer.from(await response.arrayBuffer());
        }
      } catch {
        // Try the next attempt or source candidate.
      }
      await wait(attempt * 750);
    }
  }

  throw new Error(`Unable to cache ${record.slug}`);
}

function originalCommonsUrl(value) {
  const url = new URL(value);
  const marker = "/wikipedia/commons/thumb/";
  if (!url.pathname.includes(marker)) return value;
  const [prefix, thumbPath] = url.pathname.split(marker);
  const segments = thumbPath.split("/");
  segments.pop();
  url.pathname = `${prefix}/wikipedia/commons/${segments.join("/")}`;
  return url.toString();
}

function optimizedProductionUrl(value) {
  const url = new URL("https://fantasytradetarget.com/_next/image");
  url.searchParams.set("url", value);
  url.searchParams.set("w", "640");
  url.searchParams.set("q", "82");
  return url.toString();
}

async function fileSize(url) {
  try {
    return (await stat(url)).size;
  } catch {
    return 0;
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
