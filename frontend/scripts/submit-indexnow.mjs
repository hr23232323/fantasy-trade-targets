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
const nflversePlayerRelease = JSON.parse(
  await readFile(new URL("../data/nflverse-player-release.json", import.meta.url), "utf8"),
);
const configuredPlayerComparisons = JSON.parse(
  await readFile(new URL("../data/player-comparisons.json", import.meta.url), "utf8"),
);
const startSitComparisons = JSON.parse(
  await readFile(new URL("../data/start-sit-comparisons.json", import.meta.url), "utf8"),
);
const publicRelease = JSON.parse(
  await readFile(new URL("../data/public-release.json", import.meta.url), "utf8"),
);
const playerPickComparisons = JSON.parse(
  await readFile(new URL("../data/player-pick-comparisons.json", import.meta.url), "utf8"),
);
const rookiePickPages = JSON.parse(
  await readFile(new URL("../data/rookie-pick-pages.json", import.meta.url), "utf8"),
);
const supportedComparisonPlayers = ["dynasty:2:0", "dynasty:1:0", "dynasty:2:1", "redraft:1:0"]
  .map((market) => new Set(publicRelease.playerMarkets[market].data.map((player) => player.slug)))
  .reduce((supported, market) => new Set([...supported].filter((slug) => market.has(slug))));
const playerComparisons = configuredPlayerComparisons.filter(({ leftSlug, rightSlug }) => supportedComparisonPlayers.has(leftSlug) && supportedComparisonPlayers.has(rightSlug));

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
  "/scoring/8-team-superflex-dynasty-rankings",
  "/scoring/10-team-superflex-dynasty-rankings",
  "/scoring/12-team-superflex-dynasty-rankings",
  "/scoring/14-team-superflex-dynasty-rankings",
  "/scoring/16-team-superflex-dynasty-rankings",
  "/scoring/8-team-1qb-dynasty-rankings",
  "/scoring/10-team-1qb-dynasty-rankings",
  "/scoring/12-team-1qb-dynasty-rankings",
  "/scoring/14-team-1qb-dynasty-rankings",
  "/scoring/16-team-1qb-dynasty-rankings",
];

const weeklyMatchupPaths = Array.from(
  { length: 18 },
  (_, index) => `/fantasy-football-matchups/week-${index + 1}`,
);
const scheduleRatingPaths = Array.from(
  { length: 18 },
  (_, index) => `/fantasy-football-strength-of-schedule/week-${index + 1}`,
);
const positionSchedulePaths = ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]
  .map((position) => `/fantasy-football-strength-of-schedule/${position}`);
const positionWeekSchedulePaths = [3, 4].flatMap((week) =>
  ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]
    .map((position) => `/fantasy-football-strength-of-schedule/week-${week}-${position}`),
);
const usagePositionPaths = [];
for (let week = 1; week <= 18; week += 1) {
  const games = [];
  const seenGames = new Set();
  for (const team of Object.values(teamRelease.teams)) {
    for (const game of team.schedule.filter((candidate) => candidate.week === week)) {
      if (!seenGames.has(game.gameId)) {
        seenGames.add(game.gameId);
        games.push(game);
      }
    }
  }
  const statGames = new Set();
  const snapGames = new Set();
  for (const player of Object.values(nflversePlayerRelease.players)) {
    for (const game of player.games.filter((candidate) => candidate.season === nflversePlayerRelease.season && candidate.week === week)) {
      statGames.add(game.gameId);
      if (game.offenseSnapPct !== null) snapGames.add(game.gameId);
    }
  }
  const ready = games.length > 0 && games.every((game) => game.result !== null && statGames.has(game.gameId) && snapGames.has(game.gameId));
  if (ready) for (const position of ["quarterbacks", "running-backs", "wide-receivers", "tight-ends"]) usagePositionPaths.push(`/fantasy-football-usage/week-${week}/${position}`);
}
const teamAliases = { LA: "LAR", SFO: "SF", TBB: "TB", OAK: "LV", SD: "LAC", STL: "LAR" };
const canonicalTeam = (abbr) => teamAliases[abbr] ?? abbr;
const matchupExperimentPaths = [];
const seenWeekOneGames = new Set();
for (const team of Object.values(teamRelease.teams)) {
  for (const game of team.schedule.filter((candidate) => candidate.week === 1)) {
    if (seenWeekOneGames.has(game.gameId)) continue;
    seenWeekOneGames.add(game.gameId);
    const opponent = teamRelease.teams[canonicalTeam(game.opponentAbbr)];
    if (!opponent) continue;
    const away = game.site === "away" ? team : opponent;
    const home = game.site === "away" ? opponent : team;
    matchupExperimentPaths.push(`/fantasy-football-matchups/week-1/${away.slug}-vs-${home.slug}`);
  }
}
const injuryWeeks = [...new Set(Object.values(nflversePlayerRelease.players)
  .flatMap((player) => (player.injuryHistory ?? []).map((report) => report.week))
  .filter(Number.isInteger))].sort((left, right) => left - right);

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
  "/fantasy-football-injuries",
  "/fantasy-football-strength-of-schedule",
  "/fantasy-football-usage",
  "/fantasy-football-trade-targets",
  "/fantasy-football-trade-value-chart",
  "/who-should-i-start",
  "/player-vs-rookie-pick",
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
  ...matchupExperimentPaths,
  ...scheduleRatingPaths,
  ...positionSchedulePaths,
  ...positionWeekSchedulePaths,
  ...usagePositionPaths,
  ...injuryWeeks.map((week) => `/fantasy-football-injuries/week-${week}`),
  ...startSitComparisons.map((comparison) => `/who-should-i-start/${comparison.slug}`),
  ...playerPages.map((player) => `/players/${player.slug}`),
  ...playerComparisons.map((comparison) => `/player-comparisons/${comparison.slug}`),
  ...playerPickComparisons.map((comparison) => `/player-vs-rookie-pick/${comparison.slug}`),
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
