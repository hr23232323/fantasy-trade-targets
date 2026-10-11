import { readFile, writeFile } from "node:fs/promises";
import { buildWeekPredictions, MODEL_VERSION, uniqueGames } from "../src/app/lib/nfl-prediction-model.mjs";

const outputUrl = new URL("../data/nfl-prediction-snapshots.json", import.meta.url);
const teamRelease = JSON.parse(await readFile(new URL("../data/team-release.json", import.meta.url), "utf8"));
const previous = await readExisting();
const activeWeek = findActiveWeek(teamRelease.teams, teamRelease.capturedAt);
const publishedWeeks = [...new Set([...(previous?.publishedWeeks ?? []), activeWeek])].sort((left, right) => left - right);
const games = { ...(previous?.games ?? {}) };

for (const week of publishedWeeks) {
  const predictions = new Map(buildWeekPredictions({ teams: teamRelease.teams, week, capturedAt: teamRelease.capturedAt }).map((prediction) => [prediction.gameId, prediction]));
  for (const game of uniqueGames(teamRelease.teams, week)) {
    const existing = games[game.gameId];
    if (existing && gameStarted(game, teamRelease.capturedAt)) continue;
    if (gameStarted(game, teamRelease.capturedAt)) {
      games[game.gameId] = {
        gameId: game.gameId,
        week,
        capturedAt: teamRelease.capturedAt,
        status: "result_only",
        homeAbbr: game.homeAbbr,
        awayAbbr: game.awayAbbr,
        market: { ...game.betting },
      };
      continue;
    }
    const prediction = predictions.get(game.gameId);
    if (!prediction) throw new Error(`Missing prediction for ${game.gameId}`);
    games[game.gameId] = prediction;
  }
}

const release = {
  schemaVersion: 1,
  modelVersion: MODEL_VERSION,
  releaseId: `ftt-nfl-predictions-${teamRelease.capturedAt.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
  capturedAt: teamRelease.capturedAt,
  sourceReleaseId: teamRelease.releaseId,
  publishedWeeks,
  games,
};

validate(release, teamRelease.teams);
await writeFile(outputUrl, `${JSON.stringify(release, null, 2)}\n`);
console.log(`Published ${release.releaseId}: ${publishedWeeks.length} week(s), ${Object.keys(games).length} game pages, active Week ${activeWeek}.`);

function findActiveWeek(teams, capturedAt) {
  const capturedDate = easternParts(capturedAt).date;
  const upcoming = uniqueGames(teams).filter((game) => game.homeScore === null && game.date >= capturedDate);
  if (!upcoming.length) return Math.max(...uniqueGames(teams).map((game) => game.week));
  return Math.min(...upcoming.map((game) => game.week));
}

function gameStarted(game, capturedAt) {
  if (game.homeScore !== null || game.awayScore !== null) return true;
  const now = easternParts(capturedAt);
  if (now.date !== game.date) return now.date > game.date;
  return now.time >= (game.time ?? "23:59");
}

function easternParts(iso) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
}

async function readExisting() {
  try { return JSON.parse(await readFile(outputUrl, "utf8")); } catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

function validate(release, teams) {
  if (!release.publishedWeeks.length) throw new Error("No prediction week was published");
  for (const snapshot of Object.values(release.games)) {
    if (!teams[snapshot.homeAbbr] || !teams[snapshot.awayAbbr]) throw new Error(`${snapshot.gameId} has an unknown team`);
    if (!release.publishedWeeks.includes(snapshot.week)) throw new Error(`${snapshot.gameId} has an unpublished week`);
    if (snapshot.status === "pregame") {
      for (const key of ["modelHomeMargin", "modelTotal", "projectedHomeScore", "projectedAwayScore", "homeWinProbability"]) {
        if (!Number.isFinite(snapshot[key])) throw new Error(`${snapshot.gameId} has invalid ${key}`);
      }
      if (snapshot.homeWinProbability <= 0 || snapshot.homeWinProbability >= 1) throw new Error(`${snapshot.gameId} has an invalid win probability`);
    }
  }
}
