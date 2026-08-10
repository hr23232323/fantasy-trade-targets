export const SCORING_MODEL_VERSION = "2026.08.2";

export const DEFAULT_SCORING_SETTINGS = Object.freeze({
  passingTdPoints: 4,
  receptionPoints: 1,
});

const SEASON_WEIGHTS = [1, 0.55, 0.3];
const STAT_FIELDS = [
  "passingYards",
  "passingTouchdowns",
  "interceptions",
  "rushingYards",
  "rushingTouchdowns",
  "receptions",
  "receivingYards",
  "receivingTouchdowns",
  "fumblesLost",
  "passingTwoPointConversions",
  "rushingTwoPointConversions",
  "receivingTwoPointConversions",
];

const SOURCE_FIELDS = {
  passingYards: "pass_yd",
  passingTouchdowns: "pass_td",
  interceptions: "pass_int",
  rushingYards: "rush_yd",
  rushingTouchdowns: "rush_td",
  receptions: "rec",
  receivingYards: "rec_yd",
  receivingTouchdowns: "rec_td",
  fumblesLost: "fum_lost",
  passingTwoPointConversions: "pass_2pt",
  rushingTwoPointConversions: "rush_2pt",
  receivingTwoPointConversions: "rec_2pt",
};

const STARTERS_PER_TEAM = {
  RB: 2,
  WR: 3,
  TE: 1,
};

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function median(values) {
  if (!values.length) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[middle]
    : (ordered[middle - 1] + ordered[middle]) / 2;
}

function quantile(values, percentile) {
  if (!values.length) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const index = (ordered.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return ordered[lower];
  return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower);
}

export function normalizeScoringSettings(settings = {}) {
  return {
    passingTdPoints: Number(settings.passingTdPoints) === 6 ? 6 : 4,
    receptionPoints: [0, 0.5, 1].includes(Number(settings.receptionPoints))
      ? Number(settings.receptionPoints)
      : 1,
  };
}

export function buildScoringProfile(statsPayload) {
  const career = Array.isArray(statsPayload?.career)
    ? statsPayload.career
    : statsPayload?.stats
      ? [
          {
            season: statsPayload.stats.season,
            gamesPlayed: statsPayload.stats.gamesPlayed,
            seasonTotals: statsPayload.stats.seasonTotals,
          },
        ]
      : [];

  const seasons = career
    .filter((season) => season?.seasonTotals)
    .sort((left, right) => finite(right.season) - finite(left.season))
    .slice(0, SEASON_WEIGHTS.length);

  const totals = Object.fromEntries(STAT_FIELDS.map((field) => [field, 0]));
  let totalWeight = 0;
  let weightedGames = 0;
  const includedSeasons = [];

  seasons.forEach((season, index) => {
    const seasonTotals = season.seasonTotals;
    const games = Math.max(
      0,
      finite(seasonTotals.gp, finite(season.gamesPlayed)),
    );
    if (!games) return;

    const sampleReliability = Math.min(1, games / 8);
    const weight = SEASON_WEIGHTS[index] * sampleReliability;
    if (!weight) return;

    totalWeight += weight;
    weightedGames += games * SEASON_WEIGHTS[index];
    includedSeasons.push(String(season.season));
    for (const field of STAT_FIELDS) {
      totals[field] +=
        (finite(seasonTotals[SOURCE_FIELDS[field]]) / games) * weight;
    }
  });

  if (!totalWeight) return null;

  return {
    modelVersion: SCORING_MODEL_VERSION,
    observedThroughSeason: includedSeasons[0],
    seasons: includedSeasons,
    weightedGames: round(weightedGames, 1),
    confidence: round(Math.min(1, weightedGames / 17), 3),
    perGame: Object.fromEntries(
      STAT_FIELDS.map((field) => [field, round(totals[field] / totalWeight, 4)]),
    ),
  };
}

export function calculateFantasyPoints(profile, rawSettings = {}) {
  if (!profile?.perGame) return null;
  const settings = normalizeScoringSettings(rawSettings);
  const stats = profile.perGame;

  return round(
    finite(stats.passingYards) * 0.04 +
      finite(stats.passingTouchdowns) * settings.passingTdPoints -
      finite(stats.interceptions) * 2 +
      finite(stats.rushingYards) * 0.1 +
      finite(stats.rushingTouchdowns) * 6 +
      finite(stats.receptions) * settings.receptionPoints +
      finite(stats.receivingYards) * 0.1 +
      finite(stats.receivingTouchdowns) * 6 -
      finite(stats.fumblesLost) * 2 +
      (finite(stats.passingTwoPointConversions) +
        finite(stats.rushingTwoPointConversions) +
        finite(stats.receivingTwoPointConversions)) *
        2,
    3,
  );
}

function replacementRank(position, numTeams, numQbs) {
  if (position === "QB") return numTeams * (numQbs === 2 ? 2 : 1);
  return numTeams * (STARTERS_PER_TEAM[position] ?? 1);
}

function replacementContext(positionAssets, profiles, targetRank, settings) {
  const ranked = [...positionAssets].sort(
    (left, right) =>
      finite(left.posRank, Number.MAX_SAFE_INTEGER) -
        finite(right.posRank, Number.MAX_SAFE_INTEGER) ||
      finite(right.baseValue, right.value) - finite(left.baseValue, left.value),
  );
  const targetIndex = clamp(targetRank - 1, 0, Math.max(ranked.length - 1, 0));
  const nearby = [];

  for (let radius = 0; radius < ranked.length && nearby.length < 5; radius += 1) {
    const indexes = radius === 0
      ? [targetIndex]
      : [targetIndex - radius, targetIndex + radius];
    for (const index of indexes) {
      const asset = ranked[index];
      const profile = asset ? profiles[asset.slug] : null;
      if (profile) nearby.push(profile);
      if (nearby.length >= 5) break;
    }
  }

  if (!nearby.length) return null;

  const referencePoints = nearby
    .map((profile) => calculateFantasyPoints(profile, DEFAULT_SCORING_SETTINGS))
    .filter(Number.isFinite);
  const selectedPoints = nearby
    .map((profile) => calculateFantasyPoints(profile, settings))
    .filter(Number.isFinite);

  return {
    referencePoints: median(referencePoints),
    selectedPoints: median(selectedPoints),
  };
}

export function applyScoringContext(
  rawAssets,
  profiles = {},
  rawSettings = {},
) {
  const settings = normalizeScoringSettings(rawSettings);
  const numTeams = [8, 10, 12, 14, 16].includes(Number(rawSettings.numTeams))
    ? Number(rawSettings.numTeams)
    : 12;
  const numQbs = Number(rawSettings.numQbs) === 1 ? 1 : 2;
  const format = rawSettings.format === "redraft" ? "redraft" : "dynasty";
  const maximumShift = format === "redraft" ? 0.2 : 0.12;

  const assets = rawAssets.map((asset) => ({
    ...asset,
    baseValue: finite(asset.baseValue, asset.value),
  }));
  const playerAssets = assets.filter(
    (asset) => asset.kind === "player" && asset.position !== "PICK",
  );
  const replacements = {};
  const spreads = {};

  for (const position of ["QB", "RB", "WR", "TE"]) {
    const atPosition = playerAssets.filter((asset) => asset.position === position);
    const targetRank = replacementRank(position, numTeams, numQbs);
    replacements[position] = replacementContext(
      atPosition,
      profiles,
      targetRank,
      settings,
    );

    const replacement = replacements[position];
    const starterVorp = atPosition
      .slice()
      .sort((left, right) => right.baseValue - left.baseValue)
      .slice(0, targetRank)
      .map((asset) => calculateFantasyPoints(profiles[asset.slug], DEFAULT_SCORING_SETTINGS))
      .filter(Number.isFinite)
      .map((points) => Math.max(0, points - (replacement?.referencePoints ?? 0)));
    spreads[position] = Math.max(2, quantile(starterVorp, 0.75));
  }

  let adjustedCount = 0;
  let coveredCount = 0;
  const adjustedAssets = assets.map((asset) => {
    if (asset.kind !== "player" || asset.position === "PICK") return asset;
    const profile = profiles[asset.slug];
    const replacement = replacements[asset.position];
    if (!profile || !replacement) {
      return {
        ...asset,
        scoringContext: {
          available: false,
          modelVersion: SCORING_MODEL_VERSION,
        },
      };
    }

    coveredCount += 1;
    const referencePoints = calculateFantasyPoints(
      profile,
      DEFAULT_SCORING_SETTINGS,
    );
    const selectedPoints = calculateFantasyPoints(profile, settings);
    const deltaVorpPerGame =
      (selectedPoints - replacement.selectedPoints) -
      (referencePoints - replacement.referencePoints);
    const contextRatio = deltaVorpPerGame / spreads[asset.position];
    const adjustmentRate =
      clamp(contextRatio * maximumShift, -maximumShift, maximumShift) *
      clamp(finite(profile.confidence), 0, 1);
    const value = clamp(
      Math.round(asset.baseValue * (1 + adjustmentRate)),
      0,
      1000,
    );
    const valueDelta = value - asset.baseValue;
    if (valueDelta) adjustedCount += 1;

    return {
      ...asset,
      value,
      scoringContext: {
        available: true,
        modelVersion: SCORING_MODEL_VERSION,
        observedThroughSeason: profile.observedThroughSeason,
        confidence: profile.confidence,
        referencePointsPerGame: referencePoints,
        selectedPointsPerGame: selectedPoints,
        replacementReferencePointsPerGame: round(replacement.referencePoints, 3),
        replacementSelectedPointsPerGame: round(replacement.selectedPoints, 3),
        deltaVorpPerGame: round(deltaVorpPerGame, 3),
        adjustmentPercent: round(adjustmentRate * 100, 1),
        valueDelta,
      },
    };
  });

  return {
    assets: adjustedAssets,
    meta: {
      modelVersion: SCORING_MODEL_VERSION,
      baseline: DEFAULT_SCORING_SETTINGS,
      settings,
      adjustedCount,
      coveredCount,
      playerCount: playerAssets.length,
    },
  };
}
