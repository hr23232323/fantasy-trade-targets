import type { MetadataRoute } from "next";
import { getMarketReleaseInfo } from "./lib/market";
import { playerPages } from "./lib/player-pages";
import { playerComparisons } from "./lib/player-comparisons";
import { playerPickComparisons } from "./lib/player-pick-comparisons";
import { rookiePickPages } from "./lib/rookie-picks";
import { scoringResearchPageSlugs } from "./lib/scoring-research-pages";
import { positionScheduleSlugs, positionWeekScheduleSlugs, scheduleRatingSlugs } from "./lib/schedule-ratings";
import { teamRelease, teams } from "./lib/team-data";
import { publishedUsageWeeks, usagePositionConfigs, usageWeekPath } from "./lib/usage-reports";
import { matchupExperimentGames, weeklyMatchupSlugs } from "./lib/weekly-matchups";
import { nflversePlayerRelease } from "./lib/nflverse";
import { injuryReportWeeks, injuryWeekPath } from "./lib/injuries";
import { startSitComparisons, startSitPath } from "./lib/start-sit";

const BASE_URL = "https://fantasytradetarget.com";

const staticRoutes = [
  "",
  "/about",
  "/create-meme",
  "/data-sources",
  "/dynasty-rankings",
  "/dynasty-superflex-trade-calculator",
  "/dynasty-trade-calculator",
  "/dynasty-trade-value-chart",
  "/editorial-policy",
  "/fantasy-football-trade-analyzer",
  "/fantasy-football-matchups",
  "/fantasy-football-injuries",
  "/fantasy-football-strength-of-schedule",
  "/fantasy-football-usage",
  "/fantasy-football-trade-targets",
  "/fantasy-football-trade-value-chart",
  "/fantasy-trade-calculator",
  "/who-should-i-start",
  "/faq",
  "/methodology",
  "/market",
  "/players",
  "/player-comparisons",
  "/player-vs-rookie-pick",
  "/privacy-policy",
  "/rookie-pick-values",
  "/scoring",
  "/scoring-impact",
    "/scoring/6-point-passing-td-rankings",
    "/scoring/te-premium-rankings",
  "/scoring/half-ppr-trade-values",
  "/scoring/standard-vs-ppr-player-values",
  "/terms-of-service",
  "/teams",
];

const marketDrivenRoutes = new Set([
  "",
  "/dynasty-rankings",
  "/fantasy-football-trade-targets",
  "/fantasy-football-matchups",
  "/market",
  "/player-comparisons",
  "/player-vs-rookie-pick",
  "/players",
  "/rookie-pick-values",
  "/scoring",
  "/scoring/6-point-passing-td-rankings",
  "/scoring/half-ppr-trade-values",
  "/scoring/standard-vs-ppr-player-values",
]);

const nflverseDrivenRoutes = new Set([
  "/fantasy-football-injuries",
  "/fantasy-football-usage",
  "/who-should-i-start",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const marketUpdated = getMarketReleaseInfo().capturedAt;
  const playerUpdated = new Date(Math.max(Date.parse(marketUpdated), Date.parse(nflversePlayerRelease.capturedAt))).toISOString();
  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE_URL}${route}`,
      ...(marketDrivenRoutes.has(route)
        ? { lastModified: marketUpdated }
        : nflverseDrivenRoutes.has(route)
          ? { lastModified: nflversePlayerRelease.capturedAt }
          : {}),
    })),
    ...playerPages.map((player) => ({
      url: `${BASE_URL}/players/${player.slug}`,
      lastModified: playerUpdated,
    })),
    ...playerComparisons.map((comparison) => ({
      url: `${BASE_URL}/player-comparisons/${comparison.slug}`,
      lastModified: playerUpdated,
    })),
    ...startSitComparisons.map((comparison) => ({
      url: `${BASE_URL}${startSitPath(comparison.slug)}`,
      lastModified: nflversePlayerRelease.capturedAt,
    })),
    ...injuryReportWeeks.map((week) => ({
      url: `${BASE_URL}${injuryWeekPath(week)}`,
      lastModified: nflversePlayerRelease.capturedAt,
    })),
    ...playerPickComparisons.map((comparison) => ({
      url: `${BASE_URL}/player-vs-rookie-pick/${comparison.slug}`,
      lastModified: marketUpdated,
    })),
    ...rookiePickPages.map((pick) => ({
      url: `${BASE_URL}/rookie-pick-values/${pick.slug}`,
      lastModified: marketUpdated,
    })),
    ...scoringResearchPageSlugs.map((slug) => ({
      url: `${BASE_URL}/scoring/${slug}`,
      lastModified: marketUpdated,
    })),
    ...weeklyMatchupSlugs.map((slug) => ({
      url: `${BASE_URL}/fantasy-football-matchups/${slug}`,
      lastModified: teamRelease.capturedAt,
    })),
    ...matchupExperimentGames.map(({ weekSlug, gameSlug }) => ({
      url: `${BASE_URL}/fantasy-football-matchups/${weekSlug}/${gameSlug}`,
      lastModified: teamRelease.capturedAt,
    })),
    ...scheduleRatingSlugs.map((slug) => ({
      url: `${BASE_URL}/fantasy-football-strength-of-schedule/${slug}`,
      lastModified: teamRelease.capturedAt,
    })),
    ...positionScheduleSlugs.map((slug) => ({
      url: `${BASE_URL}/fantasy-football-strength-of-schedule/${slug}`,
      lastModified: nflversePlayerRelease.capturedAt,
    })),
    ...positionWeekScheduleSlugs.map((slug) => ({
      url: `${BASE_URL}/fantasy-football-strength-of-schedule/${slug}`,
      lastModified: playerUpdated,
    })),
    ...publishedUsageWeeks.flatMap((week) => usagePositionConfigs.map(({ slug }) => ({
      url: `${BASE_URL}${usageWeekPath(week, slug)}`,
      lastModified: nflversePlayerRelease.capturedAt,
    }))),
    ...teams.map((team) => ({
      url: `${BASE_URL}/teams/${team.slug}`,
      lastModified: teamRelease.capturedAt,
    })),
  ];
}
