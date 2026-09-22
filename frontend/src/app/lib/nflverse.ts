import releaseJson from "../../../data/nflverse-player-release.json";
import type {
  NflverseGameLog,
  NflversePlayerContext,
  NflversePlayerRelease,
} from "../types/NflversePlayer";

export const nflversePlayerRelease = releaseJson as NflversePlayerRelease;

export function getNflversePlayer(slug: string) {
  return nflversePlayerRelease.players[slug] ?? null;
}

export function rosterStatusLabel(status?: string | null) {
  return ({ ACT: "Active", DEV: "Practice squad", RES: "Reserve", RET: "Retired", CUT: "Free agent" } as Record<string, string>)[status ?? ""] ?? status ?? "Not listed";
}

export function availabilityLabel(slug: string) {
  const player = getNflversePlayer(slug);
  if (!player) return "Not listed";
  if (player.injury?.reportStatus) return player.injury.reportStatus;
  if (player.injury?.practiceStatus) return player.injury.practiceStatus.replace(" Participation in Practice", "");
  return rosterStatusLabel(player.roster?.status);
}

export type RecentPlayerContext = {
  week: number;
  opponent: string | null;
  fantasyPointsPpr: number | null;
  snapPct: number | null;
  opportunityLabel: string;
  opportunity: number | null;
  opportunityChange: number | null;
  availability: string;
  availabilityDetail: string | null;
};

export function getRecentPlayerContext(slug: string): RecentPlayerContext | null {
  const player = getNflversePlayer(slug);
  if (!player) return null;
  const games = player.games
    .filter((game) => game.season === nflversePlayerRelease.season)
    .sort((left, right) => right.week - left.week);
  const latest = games[0];
  if (!latest) return null;
  const previous = games.find((game) => game.week < latest.week) ?? null;
  const latestOpportunity = opportunity(player, latest);
  const previousOpportunity = previous ? opportunity(player, previous) : null;
  const injury = player.injury;
  const injuryName = injury?.reportPrimaryInjury ?? injury?.practicePrimaryInjury ?? null;
  const availability = injury?.reportStatus
    ? `Week ${injury.week ?? latest.week}: ${injury.reportStatus}`
    : injury?.practiceStatus
      ? `Week ${injury.week ?? latest.week}: ${injury.practiceStatus.replace(" Participation in Practice", "")}`
      : rosterStatusLabel(player.roster?.status);

  return {
    week: latest.week,
    opponent: latest.opponent,
    fantasyPointsPpr: latest.fantasyPointsPpr,
    snapPct: latest.offenseSnapPct,
    opportunityLabel: opportunityLabel(player),
    opportunity: latestOpportunity,
    opportunityChange:
      latestOpportunity !== null && previousOpportunity !== null
        ? latestOpportunity - previousOpportunity
        : null,
    availability,
    availabilityDetail: injuryName,
  };
}

function opportunityLabel(player: NflversePlayerContext) {
  if (player.roster?.position === "QB") return "Attempts + carries";
  if (player.roster?.position === "RB") return "Carries + targets";
  return "Targets";
}

function opportunity(player: NflversePlayerContext, game: NflverseGameLog) {
  const value = player.roster?.position === "QB"
    ? sum(game.passing.attempts, game.rushing.carries)
    : player.roster?.position === "RB"
      ? sum(game.rushing.carries, game.receiving.targets)
      : finite(game.receiving.targets);
  return value;
}

function sum(left: number | null, right: number | null) {
  if (!Number.isFinite(left) && !Number.isFinite(right)) return null;
  return (finite(left) ?? 0) + (finite(right) ?? 0);
}

function finite(value: number | null) {
  return Number.isFinite(value) ? value : null;
}
