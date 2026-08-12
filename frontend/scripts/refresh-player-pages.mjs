import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const PLAYER_COUNT = 100;
const USER_AGENT =
  "FantasyTradeTargetData/1.0 (+https://fantasytradetarget.com)";
const manifestPath = path.resolve("data/player-pages.json");

const wikipediaTitleOverrides = {
  "josh-allen-qb": "Josh Allen (quarterback)",
  "james-cook-rb": "James Cook (running back)",
  "kenneth-walker-rb": "Kenneth Walker III",
  "luther-burden-wr": "Luther Burden III",
  "fernando-mendoza-qb": "Fernando Mendoza (American football)",
  "cam-ward-qb": "Cam Ward (American football)",
  "brian-thomas-wr": "Brian Thomas Jr.",
  "daniel-jones-qb": "Daniel Jones (American football)",
  "harold-fannin-te": "Harold Fannin Jr.",
  "michael-wilson-wr": "Michael Wilson (wide receiver)",
};

const commonsFileOverrides = {
  "fernando-mendoza-qb": "Fernando Mendoza.jpg",
};

const release = JSON.parse(
  await readFile(path.resolve("data/public-release.json"), "utf8"),
);
const existingPages = JSON.parse(await readFile(manifestPath, "utf8"));
const existingBySlug = new Map(
  existingPages.map((player) => [player.slug, player]),
);
const topPlayers = release.playerMarkets?.["dynasty:2:0"]?.data?.slice(
  0,
  PLAYER_COUNT,
);

if (!Array.isArray(topPlayers) || topPlayers.length !== PLAYER_COUNT) {
  throw new Error(`Expected ${PLAYER_COUNT} dynasty Superflex players`);
}

const pages = [];
for (const player of topPlayers) {
  const existing = existingBySlug.get(player.slug);
  pages.push({
    slug: player.slug,
    name: player.name,
    editorialLens: existing?.editorialLens ?? editorialLens(player),
    image:
      existing?.image?.src &&
      existing.image.src !== "/images/player-file-placeholder.svg"
        ? existing.image
        : await getCommonsImage(player),
  });
  console.log(`Curated ${pages.length}/${PLAYER_COUNT}: ${player.name}`);
}

validateManifest(pages, topPlayers);
const temporaryPath = `${manifestPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(pages, null, 2)}\n`);
await rename(temporaryPath, manifestPath);
console.log(`Published ${pages.length} player-page records to ${manifestPath}`);

async function getCommonsImage(player) {
  const fileName =
    commonsFileOverrides[player.slug] ??
    (await getWikipediaPageImage(
      wikipediaTitleOverrides[player.slug] ?? player.name,
    ));
  if (!fileName) return getOriginalPlayerFileImage(player);

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "960",
    titles: `File:${fileName}`,
  });
  const payload = await fetchJson(url);
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url || !info?.descriptionurl) {
    throw new Error(`No Commons image metadata for ${player.name}`);
  }

  const metadata = info.extmetadata ?? {};
  const license = cleanText(metadata.LicenseShortName?.value);
  const author = cleanText(metadata.Artist?.value);
  if (!license || !author) {
    throw new Error(`Incomplete Commons attribution for ${player.name}`);
  }

  return {
    src: stripQuery(info.thumburl ?? info.url),
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
    alt: `Photograph of ${player.name}`,
    author,
    license,
    licenseUrl:
      normalizeHttps(metadata.LicenseUrl?.value) ??
      "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: info.descriptionurl,
  };
}

async function getWikipediaPageImage(title) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "pageimages",
    piprop: "name",
    titles: title,
  });
  const payload = await fetchJson(url);
  const page = Object.values(payload.query?.pages ?? {})[0];
  return page?.pageimage ?? null;
}

function getOriginalPlayerFileImage(player) {
  console.warn(
    `No reusable Commons portrait for ${player.name}; using the original FTT player-file art.`,
  );
  return {
    src: "/images/player-file-placeholder.svg",
    width: 960,
    height: 960,
    alt: `Fantasy Trade Target player file graphic for ${player.name}`,
    author: "Fantasy Trade Target Research",
    license: "Original site artwork",
    licenseUrl: "https://fantasytradetarget.com/terms-of-service",
    sourceUrl: "https://fantasytradetarget.com/data-sources",
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`${url.hostname} returned ${response.status}`);
  }
  return response.json();
}

function editorialLens(player) {
  const copy = {
    QB: `${player.name}'s profile is shaped by the premium placed on starting quarterbacks in Superflex; the 1QB comparison shows how much of the price comes from positional scarcity.`,
    RB: `${player.name}'s dynasty price sits at the intersection of age, workload, and position volatility; the usage and market sections show the evidence behind the current tier.`,
    WR: `${player.name}'s dynasty case combines receiving opportunity with a longer positional value window; compare the usage profile with similarly priced players before making an offer.`,
    TE: `${player.name}'s price is especially sensitive to tight end premium scoring; the four-format comparison shows where positional scarcity changes the market.`,
  };
  return copy[player.position];
}

function cleanText(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripQuery(value) {
  const url = new URL(value);
  url.search = "";
  return url.toString();
}

function normalizeHttps(value) {
  return value?.replace(/^http:\/\//, "https://");
}

function validateManifest(pages, players) {
  if (pages.length !== PLAYER_COUNT) {
    throw new Error(`Player manifest must contain ${PLAYER_COUNT} records`);
  }
  if (new Set(pages.map((page) => page.slug)).size !== pages.length) {
    throw new Error("Player manifest contains duplicate slugs");
  }
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const player = players[index];
    if (page.slug !== player.slug || page.name !== player.name) {
      throw new Error(`Player identity mismatch at rank ${index + 1}`);
    }
    if (
      !page.editorialLens ||
      !(
        page.image.src.startsWith("https://upload.wikimedia.org/") ||
        page.image.src === "/images/player-file-placeholder.svg"
      ) ||
      !(
        page.image.sourceUrl.startsWith("https://commons.wikimedia.org/") ||
        page.image.sourceUrl === "https://fantasytradetarget.com/data-sources"
      ) ||
      !(
        page.image.licenseUrl.startsWith("https://creativecommons.org/") ||
        page.image.licenseUrl === "https://fantasytradetarget.com/terms-of-service"
      ) ||
      !Number.isFinite(page.image.width) ||
      !Number.isFinite(page.image.height)
    ) {
      throw new Error(`Incomplete page record for ${page.slug}`);
    }
  }
}
