import { nflversePlayerRelease } from "./nflverse";
import { getPlayerPage } from "./player-pages";
import publicReleaseJson from "../../../data/public-release.json";
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

export type InjuryReportSummary = {
  out: number;
  doubtful: number;
  questionable: number;
  didNotPractice: number;
  limited: number;
};

export const injuryReportWeeks = [...new Set(Object.values(nflversePlayerRelease.players)
  .flatMap((player) => player.injuryHistory.map(({ week }) => week))
  .filter((week): week is number => Number.isInteger(week)))]
  .sort((left, right) => left - right);

export const latestInjuryReportWeek = injuryReportWeeks.at(-1) ?? null;

const marketRankBySlug = new Map<string, number>();
for (const market of Object.values(publicReleaseJson.playerMarkets)) {
  for (const player of market.data) {
    marketRankBySlug.set(player.slug, Math.min(marketRankBySlug.get(player.slug) ?? Number.MAX_SAFE_INTEGER, player.rank ?? Number.MAX_SAFE_INTEGER));
  }
}

export function getCurrentRosterAvailabilityRows(week: number): FantasyInjuryRow[] {
  return Object.values(nflversePlayerRelease.players).flatMap((player) => {
    const page = getPlayerPage(player.slug);
    const roster = player.roster;
    if (!page || !roster?.status || roster.status === "ACT" || roster.week !== week) return [];
    const status = ({ RES: "Reserve", INA: "Inactive", EXE: "Exempt", DEV: "Practice squad", CUT: "Free agent", RET: "Retired" } as Record<string, string>)[roster.status] ?? roster.status;
    const report = player.injury ?? emptyReport(week);
    const sameWeekReport = report.week === week;
    return [{
      slug: player.slug,
      name: page.name,
      team: roster.team,
      position: roster.position,
      report,
      status,
      injury: sameWeekReport
        ? report.reportPrimaryInjury ?? report.practicePrimaryInjury ?? "Roster status update"
        : "Roster status update",
      practice: sameWeekReport ? practiceLabel(report.practiceStatus) ?? "Not listed" : "Not listed",
      severity: 7,
    }];
  }).sort((left, right) =>
    (marketRankBySlug.get(left.slug) ?? Number.MAX_SAFE_INTEGER) - (marketRankBySlug.get(right.slug) ?? Number.MAX_SAFE_INTEGER) ||
    left.name.localeCompare(right.name),
  );
}

export function rosterAvailabilityAnswer(rows: FantasyInjuryRow[], limit = 4) {
  if (!rows.length) return "No fantasy-relevant players are listed outside active roster status in the current release.";
  const names = rows.slice(0, limit).map((row) => `${row.name} (${row.status.toLowerCase()})`);
  return `${names.join(", ")}${rows.length > limit ? ` and ${rows.length - limit} more` : ""} are on the current availability watch.`;
}

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

export function summarizeInjuryRows(rows: FantasyInjuryRow[]): InjuryReportSummary {
  return rows.reduce<InjuryReportSummary>((summary, row) => {
    const status = row.status.toLowerCase();
    const practice = row.practice.toLowerCase();
    if (status.includes("out")) summary.out += 1;
    if (status.includes("doubtful")) summary.doubtful += 1;
    if (status.includes("questionable")) summary.questionable += 1;
    if (practice.includes("did not participate")) summary.didNotPractice += 1;
    if (practice.includes("limited")) summary.limited += 1;
    return summary;
  }, { out: 0, doubtful: 0, questionable: 0, didNotPractice: 0, limited: 0 });
}

export function injuryReportAnswer(rows: FantasyInjuryRow[], limit = 3) {
  const updates = rows.slice(0, limit).map((row) => `${row.name} is ${row.status.toLowerCase()} with ${row.injury.toLowerCase()}`);
  return updates.length ? `${updates.join("; ")}.` : "No fantasy-relevant injury designations are listed.";
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

function emptyReport(week: number): NflverseInjuryReport {
  return { week, reportPrimaryInjury: null, reportSecondaryInjury: null, reportStatus: null, practicePrimaryInjury: null, practiceSecondaryInjury: null, practiceStatus: null };
}
