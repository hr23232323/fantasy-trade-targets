import { readFile } from "node:fs/promises";

const host = "fantasytradetarget.com";
const baseUrl = `https://${host}`;
const key = "c9d1b221d61a01ac5aa5f88cebdd31ca";
const playerPages = JSON.parse(
  await readFile(new URL("../data/player-pages.json", import.meta.url), "utf8"),
);
const teamRelease = JSON.parse(
  await readFile(new URL("../data/team-release.json", import.meta.url), "utf8"),
);
const playerComparisons = JSON.parse(
  await readFile(new URL("../data/player-comparisons.json", import.meta.url), "utf8"),
);
const rookiePickPages = JSON.parse(
  await readFile(new URL("../data/rookie-pick-pages.json", import.meta.url), "utf8"),
);

const scoringResearchPaths = [
  "/scoring/redraft-6-point-passing-td-rankings",
  "/scoring/1qb-6-point-passing-td-rankings",
  "/scoring/standard-running-back-rankings",
  "/scoring/half-ppr-running-back-rankings",
  "/scoring/standard-wide-receiver-rankings",
  "/scoring/half-ppr-wide-receiver-rankings",
  "/scoring/standard-tight-end-rankings",
  "/scoring/half-ppr-tight-end-rankings",
  "/scoring/ppr-running-back-rankings",
  "/scoring/ppr-wide-receiver-rankings",
  "/scoring/ppr-tight-end-rankings",
  "/scoring/redraft-standard-running-back-rankings",
  "/scoring/redraft-half-ppr-running-back-rankings",
  "/scoring/redraft-ppr-running-back-rankings",
  "/scoring/redraft-standard-wide-receiver-rankings",
  "/scoring/redraft-half-ppr-wide-receiver-rankings",
  "/scoring/redraft-ppr-wide-receiver-rankings",
  "/scoring/redraft-standard-tight-end-rankings",
  "/scoring/redraft-half-ppr-tight-end-rankings",
  "/scoring/redraft-ppr-tight-end-rankings",
  "/scoring/dynasty-superflex-quarterback-rankings",
  "/scoring/dynasty-1qb-quarterback-rankings",
  "/scoring/redraft-quarterback-rankings",
  "/scoring/redraft-superflex-quarterback-rankings",
  "/scoring/redraft-superflex-6-point-passing-td-rankings",
  "/scoring/dynasty-ppr-rankings",
  "/scoring/dynasty-half-ppr-rankings",
  "/scoring/redraft-ppr-rankings",
  "/scoring/redraft-half-ppr-rankings",
  "/scoring/redraft-standard-rankings",
  "/scoring/two-tight-end-dynasty-rankings",
  "/scoring/two-tight-end-te-premium-rankings",
];

const weeklyMatchupPaths = Array.from(
  { length: 18 },
  (_, index) => `/fantasy-football-matchups/week-${index + 1}`,
);

const changedPaths = [
  "",
  "/players",
  "/player-comparisons",
  "/rookie-pick-values",
  "/market",
  "/teams",
  "/dynasty-rankings",
  "/dynasty-trade-value-chart",
  "/dynasty-trade-calculator",
  "/dynasty-superflex-trade-calculator",
  "/fantasy-trade-calculator",
  "/fantasy-football-trade-analyzer",
  "/fantasy-football-matchups",
  "/fantasy-football-trade-targets",
  "/fantasy-football-trade-value-chart",
  "/data-sources",
  "/methodology",
  "/scoring",
  "/scoring-impact",
  "/scoring/6-point-passing-td-rankings",
  "/scoring/te-premium-rankings",
  "/scoring/half-ppr-trade-values",
  "/scoring/standard-vs-ppr-player-values",
  ...scoringResearchPaths,
  ...weeklyMatchupPaths,
  ...playerPages.map((player) => `/players/${player.slug}`),
  ...playerComparisons.map((comparison) => `/player-comparisons/${comparison.slug}`),
  ...rookiePickPages.map((pick) => `/rookie-pick-values/${pick.slug}`),
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
