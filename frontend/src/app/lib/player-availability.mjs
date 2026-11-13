export function findAvailabilityCorrection(corrections, slug, season, week) {
  return corrections.find((row) => row.slug === slug && row.season === season &&
    row.fromWeek <= week && week <= row.throughWeek) ?? null;
}

export function rosterAvailabilityLabel(status) {
  return ({ ACT: "Active", DEV: "Practice squad", RES: "Reserve", IR: "Injured reserve", INA: "Inactive", EXE: "Exempt", RET: "Retired", CUT: "Free agent" })[status ?? ""] ?? status ?? "Not listed";
}

export function playerAvailabilityLabel(player, correction = null) {
  if (correction) return correction.status;
  if (!player) return "Not listed";
  // A reserve/inactive roster designation takes precedence over practice rows.
  if (player.roster?.status && player.roster.status !== "ACT") return rosterAvailabilityLabel(player.roster.status);
  if (player.injury?.reportStatus) return player.injury.reportStatus;
  if (player.injury?.practiceStatus) return player.injury.practiceStatus.replace(" Participation in Practice", "");
  return rosterAvailabilityLabel(player.roster?.status);
}
