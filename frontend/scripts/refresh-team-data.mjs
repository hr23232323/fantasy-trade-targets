import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const SCHEDULE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv";
const TEAM_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/teams/teams_colors_logos.csv";
const outputPath = path.resolve("data/team-release.json");
const capturedAt = new Date();

const ACTIVE_TEAMS = [
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
  "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
  "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG",
  "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS",
];

// Reviewed market-city coordinates power the intentionally approximate map.
// Venues and stadium names continue to come from the schedule feed.
const MARKET_LOCATIONS = {
  ARI: ["Arizona", 33.45, -112.07],
  ATL: ["Atlanta", 33.75, -84.39],
  BAL: ["Baltimore", 39.29, -76.61],
  BUF: ["Buffalo", 42.89, -78.87],
  CAR: ["Charlotte", 35.23, -80.84],
  CHI: ["Chicago", 41.88, -87.63],
  CIN: ["Cincinnati", 39.10, -84.51],
  CLE: ["Cleveland", 41.50, -81.69],
  DAL: ["Dallas–Fort Worth", 32.78, -96.80],
  DEN: ["Denver", 39.74, -104.99],
  DET: ["Detroit", 42.33, -83.05],
  GB: ["Green Bay", 44.51, -88.02],
  HOU: ["Houston", 29.76, -95.37],
  IND: ["Indianapolis", 39.77, -86.16],
  JAX: ["Jacksonville", 30.33, -81.66],
  KC: ["Kansas City", 39.10, -94.58],
  LAC: ["Los Angeles", 34.05, -118.24],
  LAR: ["Los Angeles", 34.05, -118.24],
  LV: ["Las Vegas", 36.17, -115.14],
  MIA: ["Miami", 25.76, -80.19],
  MIN: ["Minneapolis", 44.98, -93.27],
  NE: ["New England", 42.09, -71.26],
  NO: ["New Orleans", 29.95, -90.07],
  NYG: ["New York", 40.71, -74.01],
  NYJ: ["New York", 40.71, -74.01],
  PHI: ["Philadelphia", 39.95, -75.17],
  PIT: ["Pittsburgh", 40.44, -80.00],
  SEA: ["Seattle", 47.61, -122.33],
  SF: ["San Francisco Bay Area", 37.77, -122.42],
  TB: ["Tampa Bay", 27.95, -82.46],
  TEN: ["Nashville", 36.16, -86.78],
  WAS: ["Washington", 38.91, -77.04],
};

const [scheduleText, teamText] = await Promise.all([
  fetchText(SCHEDULE_URL),
  fetchText(TEAM_URL),
]);
const scheduleRows = parseCsv(scheduleText);
const teamRows = parseCsv(teamText);

const regularSeasons = new Map();
for (const row of scheduleRows.filter((row) => row.game_type === "REG")) {
  const season = Number(row.season);
  regularSeasons.set(season, (regularSeasons.get(season) ?? 0) + 1);
}
const season = Math.max(
  ...[...regularSeasons.entries()]
    .filter(([, count]) => count === 272)
    .map(([year]) => year),
);
const baselineSeason = season - 1;
const currentSchedule = scheduleRows.filter(
  (row) => Number(row.season) === season && row.game_type === "REG",
);
const baselineSchedule = scheduleRows.filter(
  (row) => Number(row.season) === baselineSeason && row.game_type === "REG",
);

const teamMetadata = new Map(
  teamRows
    .filter((row) => ACTIVE_TEAMS.includes(row.team_abbr))
    .map((row) => [row.team_abbr, row]),
);
const baseline = buildBaseline(baselineSchedule);
const ranks = [...baseline.values()]
  .sort((left, right) => left.pointsAllowedPerGame - right.pointsAllowedPerGame)
  .map((team, index) => [team.abbr, index + 1]);
const scoringDefenseRanks = new Map(ranks);

const teams = Object.fromEntries(
  ACTIVE_TEAMS.map((abbr) => {
    const metadata = teamMetadata.get(abbr);
    const location = MARKET_LOCATIONS[abbr];
    if (!metadata || !location) {
      throw new Error(`Missing reviewed metadata for ${abbr}`);
    }

    const schedule = currentSchedule
      .filter(
        (game) =>
          canonicalAbbr(game.home_team) === abbr ||
          canonicalAbbr(game.away_team) === abbr,
      )
      .map((game) => buildTeamGame(game, abbr, baseline, scoringDefenseRanks))
      .sort((left, right) => left.week - right.week);
    const homeVenue = mostCommon(
      schedule
        .filter((game) => game.site === "home")
        .map((game) => game.stadium)
        .filter(Boolean),
    );
    const teamBaseline = baseline.get(abbr);

    return [
      abbr,
      {
        slug: slugify(metadata.team_name),
        abbr,
        name: metadata.team_name,
        nickname: metadata.team_nick,
        conference: metadata.team_conf,
        division: metadata.team_division,
        colors: [
          metadata.team_color,
          metadata.team_color2,
          metadata.team_color3,
        ].filter(Boolean),
        logo: {
          src: metadata.team_logo_espn,
          alt: `${metadata.team_name} logo`,
          source: "nflverse team metadata",
        },
        marketLocation: {
          name: location[0],
          latitude: location[1],
          longitude: location[2],
        },
        homeVenue: homeVenue || null,
        baseline: {
          ...teamBaseline,
          scoringDefenseRank: scoringDefenseRanks.get(abbr),
        },
        schedule,
      },
    ];
  }),
);

validate({ teams, season, baselineSeason, currentSchedule, baselineSchedule });

const release = {
  schemaVersion: 1,
  modelVersion: "team-environment-2026.08.1",
  releaseId: `ftt-teams-${capturedAt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")}`,
  capturedAt: capturedAt.toISOString(),
  season,
  baselineSeason,
  sources: {
    schedules: {
      name: "nflverse schedules",
      url: SCHEDULE_URL,
      license: "CC BY 4.0",
      sha256: sha256(scheduleText),
      rowCount: scheduleRows.length,
    },
    teams: {
      name: "nflverse team metadata",
      url: TEAM_URL,
      license: "CC BY 4.0",
      sha256: sha256(teamText),
      rowCount: teamRows.length,
    },
  },
  teams,
};

const temporaryPath = `${outputPath}.tmp`;
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(release)}\n`);
await rename(temporaryPath, outputPath);

console.log(
  `Published ${release.releaseId}: ${Object.keys(teams).length} teams, ${currentSchedule.length} ${season} games, ${baselineSchedule.length} ${baselineSeason} baselines.`,
);

function buildBaseline(games) {
  const values = new Map(
    ACTIVE_TEAMS.map((abbr) => [
      abbr,
      {
        abbr,
        games: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAllowed: 0,
      },
    ]),
  );

  for (const game of games) {
    const homeAbbr = canonicalAbbr(game.home_team);
    const awayAbbr = canonicalAbbr(game.away_team);
    const homeScore = numberOrNull(game.home_score);
    const awayScore = numberOrNull(game.away_score);
    if (
      homeScore === null ||
      awayScore === null ||
      !values.has(homeAbbr) ||
      !values.has(awayAbbr)
    ) {
      continue;
    }

    record(values.get(homeAbbr), homeScore, awayScore);
    record(values.get(awayAbbr), awayScore, homeScore);
  }

  return new Map(
    [...values].map(([abbr, team]) => [
      abbr,
      {
        abbr,
        games: team.games,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        pointsForPerGame: round(team.pointsFor / team.games, 1),
        pointsAllowedPerGame: round(team.pointsAllowed / team.games, 1),
        pointDifferentialPerGame: round(
          (team.pointsFor - team.pointsAllowed) / team.games,
          1,
        ),
      },
    ]),
  );
}

function record(team, pointsFor, pointsAllowed) {
  team.games += 1;
  team.pointsFor += pointsFor;
  team.pointsAllowed += pointsAllowed;
  if (pointsFor > pointsAllowed) team.wins += 1;
  else if (pointsFor < pointsAllowed) team.losses += 1;
  else team.ties += 1;
}

function buildTeamGame(game, teamAbbr, baseline, defenseRanks) {
  const homeAbbr = canonicalAbbr(game.home_team);
  const awayAbbr = canonicalAbbr(game.away_team);
  const isHome = homeAbbr === teamAbbr;
  const opponentAbbr = isHome ? awayAbbr : homeAbbr;
  const neutral = game.location === "Neutral";
  const site = neutral ? "neutral" : isHome ? "home" : "away";
  const teamRest = numberOrNull(isHome ? game.home_rest : game.away_rest);
  const opponentRest = numberOrNull(isHome ? game.away_rest : game.home_rest);
  const opponentBaseline = baseline.get(opponentAbbr);
  const opponentDefenseRank = defenseRanks.get(opponentAbbr);
  const environmentScore = calculateEnvironmentScore({
    opponentDefenseRank,
    site,
    teamRest,
    opponentRest,
  });
  const teamScore = numberOrNull(isHome ? game.home_score : game.away_score);
  const opponentScore = numberOrNull(isHome ? game.away_score : game.home_score);

  return {
    gameId: game.game_id,
    week: Number(game.week),
    date: game.gameday,
    weekday: game.weekday,
    time: game.gametime || null,
    site,
    opponentAbbr,
    stadium: game.stadium || null,
    roof: game.roof || null,
    surface: game.surface || null,
    teamRest,
    opponentRest,
    restAdvantage:
      teamRest === null || opponentRest === null ? null : teamRest - opponentRest,
    divisionGame: game.div_game === "1",
    teamScore,
    opponentScore,
    result:
      teamScore === null || opponentScore === null
        ? null
        : teamScore > opponentScore
          ? "W"
          : teamScore < opponentScore
            ? "L"
            : "T",
    environmentScore,
    environmentLabel: environmentLabel(environmentScore),
    opponentBaseline: {
      season: Number(game.season) - 1,
      pointsAllowedPerGame: opponentBaseline?.pointsAllowedPerGame ?? null,
      scoringDefenseRank: opponentDefenseRank ?? null,
      pointDifferentialPerGame:
        opponentBaseline?.pointDifferentialPerGame ?? null,
    },
  };
}

function calculateEnvironmentScore({
  opponentDefenseRank,
  site,
  teamRest,
  opponentRest,
}) {
  const defenseComponent =
    50 + ((opponentDefenseRank ?? 16.5) - 16.5) * 2.35;
  const siteAdjustment = site === "home" ? 4 : site === "away" ? -2 : 0;
  const restDifference =
    teamRest === null || opponentRest === null
      ? 0
      : Math.max(-4, Math.min(4, teamRest - opponentRest));
  return Math.round(
    Math.max(0, Math.min(100, defenseComponent + siteAdjustment + restDifference * 1.25)),
  );
}

function environmentLabel(score) {
  if (score >= 68) return "Hot";
  if (score >= 57) return "Warm";
  if (score >= 44) return "Balanced";
  if (score >= 32) return "Cool";
  return "Cold";
}

function canonicalAbbr(abbr) {
  return ({ LA: "LAR", OAK: "LV", SD: "LAC", STL: "LAR" })[abbr] ?? abbr;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((left, right) => right[1] - left[1])[0]?.[0];
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fetchText(url, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/csv",
          "User-Agent":
            "FantasyTradeTargetData/1.0 (+https://www.fantasytradetarget.com)",
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return await response.text();
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`nflverse returned ${response.status} for ${url}`);
      }
    } catch (error) {
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
  }
  throw new Error(`Unable to download ${url}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift();
  if (!headers?.length) throw new Error("CSV is missing headers");
  return rows
    .filter((values) => values.some(Boolean))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

function validate({
  teams,
  season,
  baselineSeason,
  currentSchedule,
  baselineSchedule,
}) {
  if (!Number.isFinite(season) || baselineSeason !== season - 1) {
    throw new Error("Unable to identify the current complete NFL schedule");
  }
  if (currentSchedule.length !== 272 || baselineSchedule.length !== 272) {
    throw new Error("Schedule release is missing regular-season games");
  }
  if (Object.keys(teams).length !== 32) {
    throw new Error("Team release does not contain 32 active teams");
  }
  for (const [abbr, team] of Object.entries(teams)) {
    if (team.schedule.length !== 17) {
      throw new Error(`${abbr} has ${team.schedule.length} scheduled games`);
    }
    if (team.baseline.games !== 17 || !team.baseline.scoringDefenseRank) {
      throw new Error(`${abbr} has an incomplete baseline`);
    }
    if (new Set(team.schedule.map((game) => game.gameId)).size !== 17) {
      throw new Error(`${abbr} has duplicate scheduled games`);
    }
    if (!team.logo.src || !team.colors[0] || !team.homeVenue) {
      throw new Error(`${abbr} has incomplete identity metadata`);
    }
  }
}
