import type { MetadataRoute } from "next";
import { playerPages } from "./lib/player-pages";
import { teams } from "./lib/team-data";

const BASE_URL = "https://www.fantasytradetarget.com";

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
  "/fantasy-football-trade-value-chart",
  "/fantasy-trade-calculator",
  "/faq",
  "/methodology",
  "/players",
  "/privacy-policy",
  "/terms-of-service",
  "/teams",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE_URL}${route}`,
    })),
    ...playerPages.map((player) => ({
      url: `${BASE_URL}/players/${player.slug}`,
    })),
    ...teams.map((team) => ({
      url: `${BASE_URL}/teams/${team.slug}`,
    })),
  ];
}
