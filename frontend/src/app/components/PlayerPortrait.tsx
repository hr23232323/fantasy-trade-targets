import Image from "next/image";
import type { CSSProperties } from "react";
import type { PlayerImage } from "../lib/player-pages";
import type { MarketAsset } from "../types/MarketAsset";

type PortraitVariant = "hero" | "card" | "thumbnail";

type PlayerPortraitProps = {
  slug: string;
  name: string;
  image?: PlayerImage;
  position?: MarketAsset["position"];
  team?: string | null;
  variant?: PortraitVariant;
  priority?: boolean;
  sizes: string;
  className?: string;
  decorative?: boolean;
};

const portraitFocus: Record<string, string> = {
  "josh-allen-qb": "50% 15%",
  "bijan-robinson-rb": "50% 12%",
  "jamarr-chase-wr": "50% 10%",
  "brock-bowers-te": "50% 12%",
  "justin-jefferson-wr": "50% 10%",
};

const themes: Record<string, { accent: string; splash: string; wash: string }> = {
  QB: { accent: "#8bcfff", splash: "#dfff4f", wash: "#397db0" },
  RB: { accent: "#ff6b3d", splash: "#ffb29a", wash: "#b43d1c" },
  WR: { accent: "#dfff4f", splash: "#8bcfff", wash: "#76991a" },
  TE: { accent: "#d7b6ff", splash: "#ff6b3d", wash: "#7652a2" },
  NFL: { accent: "#dfff4f", splash: "#8bcfff", wash: "#69706c" },
};

export default function PlayerPortrait({
  slug,
  name,
  image,
  position,
  team,
  variant = "card",
  priority = false,
  sizes,
  className = "",
  decorative = false,
}: PlayerPortraitProps) {
  const theme = themes[position || "NFL"] ?? themes.NFL;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const style = {
    "--portrait-accent": theme.accent,
    "--portrait-splash": theme.splash,
    "--portrait-wash": theme.wash,
    "--portrait-focus": portraitFocus[slug] ?? "50% 10%",
  } as CSSProperties;

  return (
    <span
      className={`player-portrait ${className}`}
      data-variant={variant}
      data-position={position || "NFL"}
      style={style}
      aria-hidden={decorative || undefined}
    >
      <span className="player-portrait__base" aria-hidden="true" />
      {image ? (
        <Image
          src={image.src}
          alt={decorative ? "" : image.alt}
          fill
          className="player-portrait__image"
          sizes={sizes}
          {...(priority
            ? { priority: true, fetchPriority: "high" as const }
            : { loading: "lazy" as const })}
        />
      ) : (
        <span className="player-portrait__fallback" aria-hidden="true">
          {initials || position || "FTT"}
        </span>
      )}
      <span className="player-portrait__color-wash" aria-hidden="true" />
      <span className="player-portrait__splash" aria-hidden="true" />
      <span className="player-portrait__halftone" aria-hidden="true" />
      <span className="player-portrait__frame" aria-hidden="true" />

      {variant !== "thumbnail" && (
        <>
          <span className="player-portrait__kicker" aria-hidden="true">
            FTT // PLAYER FILE
          </span>
          <span className="player-portrait__identity" aria-hidden="true">
            <strong>{position || "NFL"}</strong>
            <span>{team || "MARKET"}</span>
          </span>
        </>
      )}
    </span>
  );
}
