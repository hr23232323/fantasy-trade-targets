import Image from "next/image";
import type { CSSProperties } from "react";
import { getTeamByAbbr } from "../lib/team-data";

type TeamLogoProps = {
  team?: string | null;
  size?: number;
  className?: string;
  decorative?: boolean;
  label?: boolean;
};

export default function TeamLogo({
  team,
  size = 40,
  className = "",
  decorative = false,
  label = false,
}: TeamLogoProps) {
  const profile = getTeamByAbbr(team);

  if (!profile) {
    return (
      <span
        className={`inline-grid shrink-0 place-items-center border border-[#171c19] bg-[#e7e2d5] font-mono text-[9px] font-black uppercase ${className}`}
        style={{ width: size, height: size }}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : team ? `${team} team` : "NFL team"}
      >
        {team || "NFL"}
      </span>
    );
  }

  const style = {
    width: size,
    height: size,
    "--team-primary": profile.colors[0] ?? "#171c19",
    "--team-secondary": profile.colors[1] ?? "#f3f0e7",
  } as CSSProperties;

  return (
    <span
      className={`team-logo inline-flex shrink-0 items-center justify-center overflow-hidden border border-[#171c19] ${className}`}
      style={style}
      title={decorative ? undefined : profile.name}
    >
      <span className="team-logo__mark">
        <Image
          src={profile.logo.src}
          alt={decorative ? "" : profile.logo.alt}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="h-full w-full object-contain"
        />
      </span>
      {label && (
        <span className="team-logo__label" aria-hidden="true">
          {profile.abbr}
        </span>
      )}
    </span>
  );
}
