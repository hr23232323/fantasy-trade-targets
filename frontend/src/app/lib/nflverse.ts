import releaseJson from "../../../data/nflverse-player-release.json";
import type { NflversePlayerRelease } from "../types/NflversePlayer";

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
