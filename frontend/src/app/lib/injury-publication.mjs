const FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);

export function findActiveWeek(teams) {
  return Array.from({ length: 18 }, (_, index) => index + 1).find((week) =>
    Object.values(teams).some((team) =>
      team.schedule.some((game) => game.week === week && game.result === null),
    ),
  ) ?? 18;
}

export function selectWeeklyInjuryUpdates({
  players,
  playerPages,
  marketPlayers,
  week,
  limit = 12,
}) {
  const pageBySlug = new Map(playerPages.map((page) => [page.slug, page]));
  const rankBySlug = new Map(marketPlayers.map((player) => [player.slug, player.rank]));

  return Object.values(players)
    .flatMap((player) => {
      const page = pageBySlug.get(player.slug);
      const position = player.roster?.position;
      const report = player.injuryHistory?.find((candidate) => candidate.week === week);
      if (!page || !FANTASY_POSITIONS.has(position) || !report) return [];

      const status = reportStatus(report);
      const injury = primaryInjury(report);
      const priority = reportPriority(report);
      if (!status || !injury || priority === 0) return [];

      return [{
        slug: player.slug,
        status,
        injury,
        detail: `${page.name} is listed ${status.toLowerCase()} on the Week ${week} team report because of ${injuryPhrase(injury)}. Check the official inactive list before kickoff.`,
        projectionFactor: projectionFactor(report),
        priority,
        marketRank: rankBySlug.get(player.slug) ?? Number.MAX_SAFE_INTEGER,
      }];
    })
    .sort((left, right) =>
      right.priority - left.priority ||
      left.marketRank - right.marketRank ||
      left.slug.localeCompare(right.slug),
    )
    .slice(0, limit)
    .map(({ priority: _priority, marketRank: _marketRank, ...update }) => update);
}

export function validateInjuryNewsRelease(release, players) {
  if (release.schemaVersion !== 2) throw new Error("Injury news schema must be version 2");
  if (!Number.isInteger(release.week) || release.week < 1 || release.week > 18) {
    throw new Error("Injury news week must be between 1 and 18");
  }
  if (!Number.isFinite(Date.parse(release.updatedAt))) throw new Error("Injury news updatedAt is invalid");
  if (!release.source?.url?.startsWith("https://")) throw new Error("Injury news source URL is invalid");
  if (!Array.isArray(release.updates) || release.updates.length > 20) {
    throw new Error("Injury news updates must be a bounded array");
  }
  if (new Set(release.updates.map(({ slug }) => slug)).size !== release.updates.length) {
    throw new Error("Injury news updates contain duplicate players");
  }
  for (const update of release.updates) {
    if (!players[update.slug]) throw new Error(`Unknown injury player ${update.slug}`);
    if (update.detail.length < 30) throw new Error(`Injury detail is too short for ${update.slug}`);
    if (update.projectionFactor < 0 || update.projectionFactor > 1) {
      throw new Error(`Injury projection factor is invalid for ${update.slug}`);
    }
  }
}

function reportPriority(report) {
  const status = `${report.reportStatus ?? ""} ${report.practiceStatus ?? ""}`.toLowerCase();
  const injury = `${report.reportPrimaryInjury ?? ""} ${report.practicePrimaryInjury ?? ""}`.toLowerCase();
  if (status.includes("out")) return 100;
  if (status.includes("doubtful")) return 90;
  if (status.includes("questionable")) return 80;
  if (status.includes("did not participate") && !nonInjuryReason(injury)) return 70;
  if (status.includes("limited") && !nonInjuryReason(injury)) return 50;
  return 0;
}

function reportStatus(report) {
  return report.reportStatus ?? report.practiceStatus?.replace(" Participation in Practice", " practice") ?? null;
}

function primaryInjury(report) {
  return report.reportPrimaryInjury ?? report.practicePrimaryInjury ?? report.reportSecondaryInjury ?? report.practiceSecondaryInjury ?? null;
}

function projectionFactor(report) {
  const status = (report.reportStatus ?? "").toLowerCase();
  if (status.includes("out")) return 0;
  if (status.includes("doubtful")) return 0.35;
  if (status.includes("questionable")) return 0.88;
  return 1;
}

function nonInjuryReason(value) {
  return value.includes("not injury related") || value.includes("resting player") || value.includes("personal matter");
}

function injuryPhrase(value) {
  const injury = value.toLowerCase();
  if (injury.includes("concussion") || injury.includes("illness")) return injury;
  const article = /^[aeiou]/.test(injury) ? "an" : "a";
  return `${article} ${injury} injury`;
}
