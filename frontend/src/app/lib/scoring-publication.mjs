import { SCORING_MODEL_VERSION } from "./scoring-engine.mjs";

export const DEFAULT_SCORING_PROFILE_BATCH_SIZE = 200;

export function usableScoringProfiles(
  profiles = {},
  currentSlugs = [],
  modelVersion = SCORING_MODEL_VERSION,
) {
  const current = new Set(currentSlugs);
  return Object.fromEntries(
    Object.entries(profiles).filter(
      ([slug, profile]) =>
        current.has(slug) &&
        profile?.modelVersion === modelVersion &&
        Number.isFinite(profile.confidence) &&
        profile.perGame &&
        Object.values(profile.perGame).every(Number.isFinite),
    ),
  );
}

export function selectScoringProfileCohort({
  players,
  existingProfiles = {},
  prioritySlugs = [],
  batchSize = DEFAULT_SCORING_PROFILE_BATCH_SIZE,
  refreshCursor = 0,
}) {
  const boundedBatchSize = Math.max(
    1,
    Math.min(players.length, Math.floor(Number(batchSize) || DEFAULT_SCORING_PROFILE_BATCH_SIZE)),
  );
  const playersBySlug = new Map(players.map((player) => [player.slug, player]));
  const selected = [];
  const seen = new Set();
  const add = (player) => {
    if (!player || seen.has(player.slug) || selected.length >= boundedBatchSize) return;
    seen.add(player.slug);
    selected.push(player);
  };

  for (const slug of prioritySlugs) {
    if (!existingProfiles[slug]) add(playersBySlug.get(slug));
  }
  for (const player of players) {
    if (!existingProfiles[player.slug]) add(player);
  }

  if (selected.length < boundedBatchSize && players.length) {
    const normalizedCursor =
      ((Math.floor(Number(refreshCursor) || 0) % players.length) + players.length) %
      players.length;
    for (let offset = 0; offset < players.length; offset += 1) {
      add(players[(normalizedCursor + offset) % players.length]);
    }
  }

  return selected;
}

export function nextScoringRefreshCursor({ players, cohort, refreshCursor = 0 }) {
  if (!players.length || !cohort.length) return 0;
  return (
    (Math.floor(Number(refreshCursor) || 0) + cohort.length) % players.length
  );
}
