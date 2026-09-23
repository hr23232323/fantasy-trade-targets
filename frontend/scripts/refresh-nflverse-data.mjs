import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_BASE = "https://github.com/nflverse/nflverse-data/releases/download";
const outputPath = path.resolve("data/nflverse-player-release.json");
const marketRelease = JSON.parse(await readFile(path.resolve("data/public-release.json"), "utf8"));
const teamRelease = JSON.parse(await readFile(path.resolve("data/team-release.json"), "utf8"));
const playerManifest = JSON.parse(await readFile(path.resolve("data/player-pages.json"), "utf8"));
const season = teamRelease.season;
const seasons = [season - 2, season - 1, season];
const capturedAt = new Date();

const urls = {
  roster: `${DATA_BASE}/rosters/roster_${season}.csv.gz`,
  injuries: `${DATA_BASE}/injuries/injuries_${season}.csv.gz`,
  ...Object.fromEntries(seasons.flatMap((year) => [
    [`stats_${year}`, `${DATA_BASE}/stats_player/stats_player_week_${year}.csv.gz`],
    [`snaps_${year}`, `${DATA_BASE}/snap_counts/snap_counts_${year}.csv.gz`],
  ])),
};

const downloads = Object.fromEntries(
  await Promise.all(Object.entries(urls).map(async ([key, url]) => {
    const compressed = await fetchBuffer(url);
    const text = gunzipSync(compressed).toString("utf8");
    const rows = parseCsv(text);
    return [key, { url, compressed, rows }];
  })),
);

const baselinePlayers = new Map(
  marketRelease.playerMarkets["dynasty:2:0"].data.map((player) => [player.slug, player]),
);
const publishedPlayers = playerManifest.map((page) => {
  const player = baselinePlayers.get(page.slug);
  if (!player) throw new Error(`Published player ${page.slug} is missing from the market`);
  return player;
});

const rosterBySleeper = new Map();
for (const row of downloads.roster.rows) {
  if (!row.sleeper_id) continue;
  const current = rosterBySleeper.get(row.sleeper_id);
  if (!current || Number(row.week || 0) >= Number(current.week || 0)) {
    rosterBySleeper.set(row.sleeper_id, row);
  }
}

const playerByGsis = new Map();
const playerByPfr = new Map();
for (const player of publishedPlayers) {
  const roster = rosterBySleeper.get(String(player.sleeperId));
  if (roster?.gsis_id) playerByGsis.set(roster.gsis_id, player.slug);
  if (roster?.pfr_id) playerByPfr.set(roster.pfr_id, player.slug);
}

const snapsByGamePlayer = new Map();
for (const year of seasons) {
  for (const row of downloads[`snaps_${year}`].rows) {
    const slug = playerByPfr.get(row.pfr_player_id);
    if (!slug || !row.game_id) continue;
    snapsByGamePlayer.set(`${row.game_id}:${slug}`, {
      offenseSnaps: integerOrNull(row.offense_snaps),
      offenseSnapPct: decimalOrNull(row.offense_pct),
    });
  }
}

const gamesBySlug = new Map(publishedPlayers.map((player) => [player.slug, []]));
for (const year of seasons) {
  for (const row of downloads[`stats_${year}`].rows) {
    if (row.season_type !== "REG") continue;
    const slug = playerByGsis.get(row.player_id);
    if (!slug) continue;
    const snap = snapsByGamePlayer.get(`${row.game_id}:${slug}`);
    gamesBySlug.get(slug).push({
      season: Number(row.season),
      week: Number(row.week),
      gameId: row.game_id,
      team: canonicalAbbr(row.team),
      opponent: canonicalAbbr(row.opponent_team),
      fantasyPoints: roundedOrNull(row.fantasy_points),
      fantasyPointsHalfPpr: sumNullable(row.fantasy_points, numberOrZero(row.receptions) * 0.5),
      fantasyPointsPpr: roundedOrNull(row.fantasy_points_ppr),
      passing: compactStats(row, ["completions", "attempts", "passing_yards", "passing_tds", "passing_interceptions"]),
      rushing: compactStats(row, ["carries", "rushing_yards", "rushing_tds"]),
      receiving: compactStats(row, ["targets", "receptions", "receiving_yards", "receiving_tds", "receiving_air_yards", "receiving_yards_after_catch"]),
      targetShare: decimalOrNull(row.target_share),
      airYardsShare: decimalOrNull(row.air_yards_share),
      offenseSnaps: snap?.offenseSnaps ?? null,
      offenseSnapPct: snap?.offenseSnapPct ?? null,
    });
  }
}

const injuriesByGsis = new Map();
for (const row of downloads.injuries.rows) {
  if (!row.gsis_id) continue;
  const history = injuriesByGsis.get(row.gsis_id) ?? [];
  history.push(row);
  injuriesByGsis.set(row.gsis_id, history);
}

const positionDefense = buildPositionDefense(
  downloads[`stats_${season - 1}`].rows,
  season - 1,
);

const players = Object.fromEntries(publishedPlayers.map((player) => {
  const roster = rosterBySleeper.get(String(player.sleeperId));
  const injuryHistory = (roster?.gsis_id ? injuriesByGsis.get(roster.gsis_id) : null)
    ?.sort((left, right) => Number(right.week || 0) - Number(left.week || 0))
    .map(compactInjury)
    .slice(0, 18) ?? [];
  const injury = injuryHistory[0] ?? null;
  const allGames = (gamesBySlug.get(player.slug) ?? [])
    .sort((left, right) => right.season - left.season || right.week - left.week);
  const games = allGames.slice(0, 20);
  return [player.slug, {
    slug: player.slug,
    sleeperId: String(player.sleeperId),
    gsisId: roster?.gsis_id || null,
    pfrId: roster?.pfr_id || null,
    roster: roster ? {
      team: canonicalAbbr(roster.team),
      position: roster.position || null,
      depthChartPosition: roster.depth_chart_position || null,
      jerseyNumber: integerOrNull(roster.jersey_number),
      status: roster.status || null,
      statusDescription: roster.status_description_abbr || null,
      yearsExperience: integerOrNull(roster.years_exp),
      week: integerOrNull(roster.week),
    } : null,
    injury,
    injuryHistory,
    games,
    seasons: summarizeSeasons(allGames),
  }];
}));

validate({ players, publishedPlayers, season, seasons, downloads });

const release = {
  schemaVersion: 3,
  modelVersion: "nflverse-player-context-2026.09.3",
  releaseId: `ftt-nflverse-${capturedAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
  capturedAt: capturedAt.toISOString(),
  season,
  seasons,
  license: {
    name: "Creative Commons Attribution 4.0 International",
    shortName: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "Data from nflverse",
    projectUrl: "https://github.com/nflverse/nflverse-data",
  },
  sources: Object.fromEntries(Object.entries(downloads).map(([key, source]) => [key, {
    url: source.url,
    sha256: createHash("sha256").update(source.compressed).digest("hex"),
    rowCount: source.rows.length,
  }])),
  coverage: {
    publishedPlayers: publishedPlayers.length,
    rosterMapped: Object.values(players).filter((player) => player.roster).length,
    playersWithGames: Object.values(players).filter((player) => player.games.length).length,
    playersWithCurrentSeasonGames: Object.values(players).filter((player) => player.games.some((game) => game.season === season)).length,
    playersWithInjuryRows: Object.values(players).filter((player) => player.injury).length,
  },
  positionDefense,
  players,
};

await mkdir(path.dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(release)}\n`);
await rename(temporaryPath, outputPath);

console.log(`Published ${release.releaseId}: ${release.coverage.rosterMapped}/${release.coverage.publishedPlayers} rosters, ${release.coverage.playersWithGames} players with game logs, ${release.coverage.playersWithInjuryRows} current injury rows.`);

function summarizeSeasons(games) {
  const bySeason = new Map();
  for (const game of games) {
    const summary = bySeason.get(game.season) ?? { season: game.season, games: 0, fantasyPoints: 0, fantasyPointsHalfPpr: 0, fantasyPointsPpr: 0, offenseSnaps: 0, snapGames: 0 };
    summary.games += 1;
    summary.fantasyPoints += game.fantasyPoints ?? 0;
    summary.fantasyPointsHalfPpr += game.fantasyPointsHalfPpr ?? 0;
    summary.fantasyPointsPpr += game.fantasyPointsPpr ?? 0;
    if (game.offenseSnaps !== null) { summary.offenseSnaps += game.offenseSnaps; summary.snapGames += 1; }
    bySeason.set(game.season, summary);
  }
  return [...bySeason.values()].sort((left, right) => right.season - left.season).map((summary) => ({
    season: summary.season,
    games: summary.games,
    fantasyPointsPerGame: round(summary.fantasyPoints / summary.games, 1),
    halfPprPointsPerGame: round(summary.fantasyPointsHalfPpr / summary.games, 1),
    pprPointsPerGame: round(summary.fantasyPointsPpr / summary.games, 1),
    offenseSnapsPerGame: summary.snapGames ? round(summary.offenseSnaps / summary.snapGames, 1) : null,
  }));
}

function compactInjury(injury) {
  return {
    week: integerOrNull(injury.week),
    reportPrimaryInjury: injury.report_primary_injury || null,
    reportSecondaryInjury: injury.report_secondary_injury || null,
    reportStatus: injury.report_status || null,
    practicePrimaryInjury: injury.practice_primary_injury || null,
    practiceSecondaryInjury: injury.practice_secondary_injury || null,
    practiceStatus: injury.practice_status || null,
  };
}

function buildPositionDefense(rows, baselineSeason) {
  const positions = new Set(["QB", "RB", "WR", "TE"]);
  const gamesByTeamPosition = new Map();

  for (const row of rows) {
    if (row.season_type !== "REG" || Number(row.season) !== baselineSeason || !positions.has(row.position)) continue;
    const opponent = canonicalAbbr(row.opponent_team);
    if (!opponent || !row.game_id) continue;
    const key = `${opponent}:${row.position}`;
    const games = gamesByTeamPosition.get(key) ?? new Map();
    const game = games.get(row.game_id) ?? { standard: 0, halfPpr: 0, ppr: 0 };
    game.standard += numberOrZero(row.fantasy_points);
    game.halfPpr += numberOrZero(row.fantasy_points) + numberOrZero(row.receptions) * 0.5;
    game.ppr += numberOrZero(row.fantasy_points_ppr);
    games.set(row.game_id, game);
    gamesByTeamPosition.set(key, games);
  }

  const teams = Object.fromEntries(Object.keys(teamRelease.teams).map((team) => [
    team,
    Object.fromEntries([...positions].map((position) => {
      const games = [...(gamesByTeamPosition.get(`${team}:${position}`)?.values() ?? [])];
      const total = (field) => games.reduce((sum, game) => sum + game[field], 0);
      return [position, {
        games: games.length,
        pointsPerGame: {
          standard: round(total("standard") / games.length, 1),
          halfPpr: round(total("halfPpr") / games.length, 1),
          ppr: round(total("ppr") / games.length, 1),
        },
      }];
    })),
  ]));

  return { season: baselineSeason, teams };
}

function compactStats(row, fields) {
  return Object.fromEntries(fields.map((field) => [field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), roundedOrNull(row[field])]));
}

function sumNullable(raw, addition) {
  const base = numberOrNull(raw);
  return base === null ? null : round(base + addition, 1);
}

function numberOrZero(value) { return numberOrNull(value) ?? 0; }
function integerOrNull(value) { const number = numberOrNull(value); return number === null ? null : Math.round(number); }
function decimalOrNull(value) { const number = numberOrNull(value); return number === null ? null : round(number, 3); }
function roundedOrNull(value) { const number = numberOrNull(value); return number === null ? null : round(number, 1); }
function numberOrNull(value) { if (value === "" || value === null || value === undefined) return null; const number = Number(value); return Number.isFinite(number) ? number : null; }
function round(value, decimals) { const factor = 10 ** decimals; return Math.round(value * factor) / factor; }
function canonicalAbbr(abbr) { return ({ LA: "LAR", OAK: "LV", SD: "LAC", STL: "LAR" })[abbr] ?? abbr ?? null; }

async function fetchBuffer(url, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/gzip", "User-Agent": "FantasyTradeTargetData/1.0 (+https://fantasytradetarget.com)" }, signal: AbortSignal.timeout(45_000) });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
      if (response.status < 500 && response.status !== 429) throw new Error(`nflverse returned ${response.status} for ${url}`);
    } catch (error) {
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
  }
  throw new Error(`Unable to download ${url}`);
}

function parseCsv(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift();
  if (!headers?.length) throw new Error("CSV is missing headers");
  return rows.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function validate({ players, publishedPlayers, season, seasons, downloads }) {
  if (seasons.length !== 3 || seasons.at(-1) !== season) throw new Error("NFLverse history window is invalid");
  if (Object.keys(players).length !== publishedPlayers.length || publishedPlayers.length !== 220) throw new Error("NFLverse release must cover all 220 player files");
  const rosterCount = Object.values(players).filter((player) => player.roster).length;
  if (rosterCount < 210) throw new Error(`NFLverse roster join coverage fell to ${rosterCount}/220`);
  if (downloads.roster.rows.length < 2500) throw new Error("NFLverse roster release is unexpectedly sparse");
  if (downloads[`stats_${season - 1}`].rows.length < 15000) throw new Error("Prior-season player stats are unexpectedly sparse");
  if (downloads[`snaps_${season - 1}`].rows.length < 20000) throw new Error("Prior-season snap counts are unexpectedly sparse");
  const positionDefense = buildPositionDefense(downloads[`stats_${season - 1}`].rows, season - 1);
  if (Object.keys(positionDefense.teams).length !== 32) throw new Error("Position defense must cover all 32 teams");
  for (const [team, positions] of Object.entries(positionDefense.teams)) {
    for (const position of ["QB", "RB", "WR", "TE"]) {
      const summary = positions[position];
      if (!summary || summary.games < 16 || Object.values(summary.pointsPerGame).some((value) => !Number.isFinite(value))) {
        throw new Error(`${team} ${position} position defense is incomplete`);
      }
    }
  }
  for (const [slug, player] of Object.entries(players)) {
    if (player.games.length > 20) throw new Error(`${slug} exceeds the 20-game public history bound`);
    if (player.injuryHistory.length > 18) throw new Error(`${slug} exceeds the 18-week injury history bound`);
    for (let index = 1; index < player.injuryHistory.length; index += 1) {
      if ((player.injuryHistory[index - 1].week ?? 0) < (player.injuryHistory[index].week ?? 0)) {
        throw new Error(`${slug} injury history is not newest-first`);
      }
    }
    for (const game of player.games) {
      if (!Number.isInteger(game.season) || !Number.isInteger(game.week) || !game.gameId) throw new Error(`${slug} has an invalid game log`);
      for (const value of [game.fantasyPoints, game.fantasyPointsHalfPpr, game.fantasyPointsPpr, game.offenseSnapPct]) {
        if (value !== null && !Number.isFinite(value)) throw new Error(`${slug} has a non-finite game metric`);
      }
    }
  }
}
