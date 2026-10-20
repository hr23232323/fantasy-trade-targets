import releaseJson from "../../../data/injury-news.json";
import { getPlayerPage } from "./player-pages";
import { nflversePlayerRelease } from "./nflverse";

export type InjuryNewsUpdate = {
  slug: string;
  status: string;
  injury: string;
  detail: string;
  projectionFactor: number;
};

export const injuryNewsRelease = releaseJson as {
  schemaVersion: number;
  updatedAt: string;
  week: number;
  source: { name: string; url: string; publishedAt: string };
  updates: InjuryNewsUpdate[];
};

export function getInjuryNewsUpdate(slug: string, week: number) {
  if (injuryNewsRelease.week !== week) return null;
  return injuryNewsRelease.updates.find((update) => update.slug === slug) ?? null;
}

export function getCurrentInjuryNews(week: number) {
  if (injuryNewsRelease.week !== week) return [];
  return injuryNewsRelease.updates.flatMap((update) => {
    const player = getPlayerPage(update.slug);
    const context = nflversePlayerRelease.players[update.slug];
    return player ? [{ ...update, name: player.name, team: context?.roster?.team ?? null, position: context?.roster?.position ?? null }] : [];
  });
}
