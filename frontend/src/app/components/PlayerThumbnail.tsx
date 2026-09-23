import type { CSSProperties } from "react";
import { getTradePlayerImage } from "../lib/player-pages";
import type { MarketAsset } from "../types/MarketAsset";
import PlayerPortrait from "./PlayerPortrait";

export default function PlayerThumbnail({
  slug,
  name,
  position,
  team,
  size = 48,
  priority = false,
  className = "",
}: {
  slug: string;
  name: string;
  position?: MarketAsset["position"];
  team?: string | null;
  size?: 40 | 48 | 56 | 64 | 72;
  priority?: boolean;
  className?: string;
}) {
  const image = getTradePlayerImage(slug);
  const style = { width: size, height: size } satisfies CSSProperties;

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden border border-[#171c19] bg-white shadow-[2px_2px_0_#171c19] ${className}`}
      style={style}
      aria-hidden="true"
    >
      <PlayerPortrait
        slug={slug}
        name={name}
        image={image}
        position={position}
        team={team}
        variant="thumbnail"
        priority={priority}
        sizes={`${size}px`}
        decorative
      />
    </span>
  );
}
