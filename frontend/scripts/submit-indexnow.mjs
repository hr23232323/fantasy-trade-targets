import { readFile } from "node:fs/promises";

const host = "www.fantasytradetarget.com";
const baseUrl = `https://${host}`;
const key = "c9d1b221d61a01ac5aa5f88cebdd31ca";
const playerPages = JSON.parse(
  await readFile(new URL("../data/player-pages.json", import.meta.url), "utf8"),
);
const teamRelease = JSON.parse(
  await readFile(new URL("../data/team-release.json", import.meta.url), "utf8"),
);

const changedPaths = [
  "",
  "/players",
  "/teams",
  "/dynasty-rankings",
  "/dynasty-trade-value-chart",
  "/dynasty-trade-calculator",
  "/dynasty-superflex-trade-calculator",
  "/fantasy-trade-calculator",
  "/fantasy-football-trade-analyzer",
  "/fantasy-football-trade-value-chart",
  "/data-sources",
  ...playerPages.map((player) => `/players/${player.slug}`),
  ...Object.values(teamRelease.teams).map((team) => `/teams/${team.slug}`),
];

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `${baseUrl}/${key}.txt`,
    urlList: changedPaths.map((path) => `${baseUrl}${path}`),
  }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow returned ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${changedPaths.length} updated URLs (${response.status}).`);
