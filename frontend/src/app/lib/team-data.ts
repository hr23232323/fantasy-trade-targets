import teamReleaseJson from "../../../data/team-release.json";
import type { MarketAsset } from "../types/MarketAsset";
import type { MatchupEnvironment, TeamGame, TeamProfile, TeamRelease } from "../types/Team";

export const teamRelease = teamReleaseJson as TeamRelease;
export const teams = Object.values(teamRelease.teams).sort((left, right) =>
  left.name.localeCompare(right.name),
);
export const teamSlugs = teams.map((team) => team.slug);

const marketAliases: Record<string, string> = {
  LA: "LAR",
  SFO: "SF",
  TBB: "TB",
  OAK: "LV",
  SD: "LAC",
  STL: "LAR",
};

export function canonicalTeamAbbr(abbr?: string | null) {
  if (!abbr) return null;
  return marketAliases[abbr] ?? abbr;
}

export function getTeamBySlug(slug: string) {
  return teams.find((team) => team.slug === slug);
}

export function getTeamByAbbr(abbr?: string | null) {
  const canonical = canonicalTeamAbbr(abbr);
  return canonical ? teamRelease.teams[canonical] : undefined;
}

export function getTeamAssets(team: TeamProfile, assets: MarketAsset[]) {
  return assets
    .filter(
      (asset) =>
        asset.kind === "player" && canonicalTeamAbbr(asset.team) === team.abbr,
    )
    .sort((left, right) => left.rank! - right.rank!);
}

export function getUpcomingGames(team: TeamProfile, limit = team.schedule.length) {
  const capturedDate = teamRelease.capturedAt.slice(0, 10);
  return team.schedule
    .filter((game) => game.result === null && game.date >= capturedDate)
    .slice(0, limit);
}

export function getRecentGames(team: TeamProfile, limit = 3) {
  return team.schedule
    .filter((game) => game.result !== null)
    .sort((left, right) => right.week - left.week)
    .slice(0, limit);
}

export function averageEnvironment(games: TeamGame[]) {
  if (!games.length) return null;
  return Math.round(
    games.reduce((total, game) => total + game.environmentScore, 0) /
      games.length,
  );
}

export function environmentLabel(score: number | null): MatchupEnvironment | "Complete" {
  if (score === null) return "Complete";
  if (score >= 68) return "Hot";
  if (score >= 57) return "Warm";
  if (score >= 44) return "Balanced";
  if (score >= 32) return "Cool";
  return "Cold";
}

export function environmentClass(label: MatchupEnvironment | "Complete") {
  return {
    Hot: "bg-[#ff6b3d]",
    Warm: "bg-[#ffb29a]",
    Balanced: "bg-[#dfff4f]",
    Cool: "bg-[#8bcfff]",
    Cold: "bg-[#d7b6ff]",
    Complete: "bg-[#e4dfd2]",
  }[label];
}

export function formatRecord(team: TeamProfile) {
  return `${team.baseline.wins}-${team.baseline.losses}${
    team.baseline.ties ? `-${team.baseline.ties}` : ""
  }`;
}

export function formatGameDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatGameTime(time: string | null) {
  if (!time) return "TBD";
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix} ET`;
}

export function getMapPoint(team: TeamProfile) {
  const x = ((team.marketLocation.longitude + 125) / 58) * 100;
  const y = 6 + ((50 - team.marketLocation.latitude) / 25) * 50;
  const offsets: Record<string, [number, number]> = {
    LAC: [1.4, 1.4],
    LAR: [-1.4, -1.4],
    NYJ: [1.4, 1.4],
    NYG: [-1.4, -1.4],
  };
  const [offsetX, offsetY] = offsets[team.abbr] ?? [0, 0];
  return {
    x: Math.max(3, Math.min(97, x + offsetX)),
    y: Math.max(5, Math.min(57, y + offsetY)),
  };
}

export function readableSurface(value: string | null) {
  if (!value) return null;
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
