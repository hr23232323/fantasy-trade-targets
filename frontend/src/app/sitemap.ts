import type { MetadataRoute } from "next";
import { getMarketReleaseInfo } from "./lib/market";
import { playerPages } from "./lib/player-pages";
import { playerComparisons } from "./lib/player-comparisons";
import { rookiePickPages } from "./lib/rookie-picks";
import { teamRelease, teams } from "./lib/team-data";

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
  "/fantasy-football-trade-targets",
  "/fantasy-football-trade-value-chart",
  "/fantasy-trade-calculator",
  "/faq",
  "/methodology",
  "/market",
  "/players",
  "/player-comparisons",
  "/privacy-policy",
  "/rookie-pick-values",
  "/scoring-impact",
  "/scoring/6-point-passing-td-rankings",
  "/scoring/half-ppr-trade-values",
  "/scoring/standard-vs-ppr-player-values",
  "/terms-of-service",
  "/teams",
];

const marketDrivenRoutes = new Set([
  "",
  "/dynasty-rankings",
  "/fantasy-football-trade-targets",
  "/market",
  "/player-comparisons",
  "/players",
  "/rookie-pick-values",
  "/scoring/6-point-passing-td-rankings",
  "/scoring/half-ppr-trade-values",
  "/scoring/standard-vs-ppr-player-values",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const marketUpdated = getMarketReleaseInfo().capturedAt;
  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE_URL}${route}`,
      ...(marketDrivenRoutes.has(route) ? { lastModified: marketUpdated } : {}),
    })),
    ...playerPages.map((player) => ({
      url: `${BASE_URL}/players/${player.slug}`,
      lastModified: marketUpdated,
    })),
    ...playerComparisons.map((comparison) => ({
      url: `${BASE_URL}/player-comparisons/${comparison.slug}`,
      lastModified: marketUpdated,
    })),
    ...rookiePickPages.map((pick) => ({
      url: `${BASE_URL}/rookie-pick-values/${pick.slug}`,
      lastModified: marketUpdated,
    })),
    ...teams.map((team) => ({
      url: `${BASE_URL}/teams/${team.slug}`,
      lastModified: teamRelease.capturedAt,
    })),
  ];
}
