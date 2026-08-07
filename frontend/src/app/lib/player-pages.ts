import pageManifest from "../../../data/player-pages.json";
import cachedImageManifest from "../../../data/cached-player-images.json";
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

type CachedPlayerImageConfig = {
  slug: string;
  src: string;
  width: number;
  height: number;
};

const cachedPlayerImages = cachedImageManifest satisfies CachedPlayerImageConfig[];
const cachedBySlug = new Map(cachedPlayerImages.map((image) => [image.slug, image]));

function withCachedImage(slug: string, image: PlayerImage): PlayerImage {
  const cached = cachedBySlug.get(slug);
  return cached
    ? { ...image, src: cached.src, width: cached.width, height: cached.height }
    : image;
}

export const playerPages = (pageManifest satisfies PlayerPageConfig[]).map((player) => ({
  ...player,
  image: withCachedImage(player.slug, player.image),
}));
export const playerPageSlugs = playerPages.map((player) => player.slug);
const tradePlayerImages = (tradeImageManifest satisfies TradePlayerImageConfig[]).map((player) => ({
  ...player,
  image: withCachedImage(player.slug, player.image),
}));

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
