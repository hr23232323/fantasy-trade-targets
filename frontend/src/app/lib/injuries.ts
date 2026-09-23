import { nflversePlayerRelease } from "./nflverse";
import { getPlayerPage } from "./player-pages";
import type { NflverseInjuryReport } from "../types/NflversePlayer";

export type FantasyInjuryRow = {
  slug: string;
  name: string;
  team: string | null;
  position: string | null;
  report: NflverseInjuryReport;
  status: string;
  injury: string;
  practice: string;
  severity: number;
};

export const injuryReportWeeks = [...new Set(Object.values(nflversePlayerRelease.players)
  .flatMap((player) => player.injuryHistory.map(({ week }) => week))
  .filter((week): week is number => Number.isInteger(week)))]
  .sort((left, right) => left - right);

export const latestInjuryReportWeek = injuryReportWeeks.at(-1) ?? null;

export function getFantasyInjuryRows(week: number): FantasyInjuryRow[] {
  return Object.values(nflversePlayerRelease.players).flatMap((player) => {
    const page = getPlayerPage(player.slug);
    const report = player.injuryHistory.find((candidate) => candidate.week === week);
    if (!page || !report || !meaningful(report)) return [];
    const status = report.reportStatus ?? practiceLabel(report.practiceStatus) ?? "Listed";
    const injury = report.reportPrimaryInjury ?? report.practicePrimaryInjury ?? report.reportSecondaryInjury ?? report.practiceSecondaryInjury ?? "Not specified";
    return [{ slug: player.slug, name: page.name, team: player.roster?.team ?? null, position: player.roster?.position ?? null, report, status, injury, practice: practiceLabel(report.practiceStatus) ?? "Not listed", severity: severity(report) }];
  }).sort((left, right) => right.severity - left.severity || (left.team ?? "").localeCompare(right.team ?? "") || left.name.localeCompare(right.name));
}

export function injuryWeekPath(week: number) {
  return `/fantasy-football-injuries/week-${week}`;
}

function meaningful(report: NflverseInjuryReport) {
  if (report.reportStatus) return true;
  const practice = report.practiceStatus?.toLowerCase() ?? "";
  if (practice.includes("did not participate") || practice.includes("limited")) return true;
  const injury = `${report.practicePrimaryInjury ?? ""} ${report.practiceSecondaryInjury ?? ""}`.toLowerCase();
  return Boolean(injury.trim()) && !injury.includes("not injury related") && !injury.includes("resting player");
}

function severity(report: NflverseInjuryReport) {
  const value = `${report.reportStatus ?? ""} ${report.practiceStatus ?? ""}`.toLowerCase();
  if (value.includes("out")) return 6;
  if (value.includes("doubtful")) return 5;
  if (value.includes("questionable")) return 4;
  if (value.includes("did not participate")) return 3;
  if (value.includes("limited")) return 2;
  return 1;
}

function practiceLabel(value: string | null) {
  return value?.replace(" Participation in Practice", " practice") ?? null;
}
