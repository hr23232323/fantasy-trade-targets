export const MARKET_PLAYER_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
export const MARKET_NFL_TEAMS = new Set(["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"]);

const TEAM_ALIASES = new Map([
  ["JAC", "JAX"],
  ["LA", "LAR"],
  ["OAK", "LV"],
  ["SD", "LAC"],
  ["STL", "LAR"],
]);

export function normalizePlayerMarketPayload(payload) {
  if (!Array.isArray(payload?.data)) throw new Error("Player market response is missing its data array");

  const sourceTotal = payload.data.length;
  const seenSlugs = new Set();
  let normalizedTeamCount = 0;
  const cleaned = payload.data.flatMap((player, sourceIndex) => {
    if (!isPublishableIdentity(player) || seenSlugs.has(player.slug)) return [];
    seenSlugs.add(player.slug);
    const team = normalizeMarketTeam(player.team);
    if (team !== player.team) normalizedTeamCount += 1;
    return [{
      ...player,
      team,
      sourceIndex,
      composite: player.composite > 1000 && player.composite <= 1001 ? 1000 : player.composite,
    }];
  });

  const excludedRecords = sourceTotal - cleaned.length;
  const maximumExcluded = Math.max(5, Math.floor(sourceTotal * 0.02));
  if (excludedRecords > maximumExcluded) {
    throw new Error(`Player market rejected ${excludedRecords} malformed or duplicate records`);
  }

  cleaned.sort((left, right) => right.composite - left.composite || left.sourceIndex - right.sourceIndex);
  const positionCounts = new Map();
  const data = cleaned.map(({ sourceIndex: _, ...player }, index) => {
    const posRank = (positionCounts.get(player.position) ?? 0) + 1;
    positionCounts.set(player.position, posRank);
    return { ...player, rank: index + 1, posRank };
  });

  return {
    ...payload,
    data,
    meta: {
      ...payload.meta,
      access: payload.meta?.access
        ? { ...payload.meta.access, sourceTotal: payload.meta.access.total ?? sourceTotal, total: data.length }
        : payload.meta?.access,
      publication: {
        ...payload.meta?.publication,
        sourceTotal,
        publishedTotal: data.length,
        excludedRecords,
        normalizedTeamCount,
      },
    },
  };
}

function isPublishableIdentity(player) {
  return Boolean(
    player &&
    typeof player.name === "string" && player.name.trim() &&
    typeof player.slug === "string" && player.slug.trim() &&
    MARKET_PLAYER_POSITIONS.has(player.position) &&
    Number.isFinite(player.composite) &&
    player.composite >= 0 &&
    player.composite <= 1001
  );
}

function normalizeMarketTeam(team) {
  if (team == null || team === "") return null;
  const upper = String(team).toUpperCase();
  if (["FA", "FREE AGENT", "NONE", "N/A"].includes(upper)) return null;
  const canonical = TEAM_ALIASES.get(upper) ?? upper;
  return MARKET_NFL_TEAMS.has(canonical) ? canonical : null;
}
