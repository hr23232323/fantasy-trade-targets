import pageManifest from "../../../data/player-pages.json";
import tradeImageManifest from "../../../data/trade-player-images.json";

export type PlayerImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export type PlayerPageConfig = {
  slug: string;
  name: string;
  editorialLens: string;
  image: PlayerImage;
};

type TradePlayerImageConfig = {
  slug: string;
  image: PlayerImage;
};

export const playerPages = pageManifest satisfies PlayerPageConfig[];
export const playerPageSlugs = playerPages.map((player) => player.slug);
const tradePlayerImages = tradeImageManifest satisfies TradePlayerImageConfig[];

export function getPlayerPage(slug: string) {
  return playerPages.find((player) => player.slug === slug);
}

export function hasPlayerPage(slug: string) {
  return playerPageSlugs.includes(slug);
}

export function getTradePlayerImage(slug: string) {
  return (
    getPlayerPage(slug)?.image ??
    tradePlayerImages.find((player) => player.slug === slug)?.image
  );
}
