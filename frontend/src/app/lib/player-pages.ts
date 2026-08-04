import pageManifest from "../../../data/player-pages.json";

export type PlayerPageConfig = {
  slug: string;
  name: string;
  editorialLens: string;
  image: {
    src: string;
    width: number;
    height: number;
    alt: string;
    author: string;
    license: string;
    licenseUrl: string;
    sourceUrl: string;
  };
};

export const playerPages = pageManifest satisfies PlayerPageConfig[];
export const playerPageSlugs = playerPages.map((player) => player.slug);

export function getPlayerPage(slug: string) {
  return playerPages.find((player) => player.slug === slug);
}

export function hasPlayerPage(slug: string) {
  return playerPageSlugs.includes(slug);
}
