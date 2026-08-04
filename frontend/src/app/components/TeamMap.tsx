import { getMapPoint, teams } from "../lib/team-data";

export default function TeamMap() {
  return (
    <div className="overflow-hidden border border-[#171c19] bg-[#8bcfff] p-3 sm:p-6">
      <svg
        viewBox="0 0 100 62"
        role="img"
        aria-labelledby="team-map-title team-map-description"
        className="h-auto w-full"
      >
        <title id="team-map-title">Map of NFL team markets</title>
        <desc id="team-map-description">
          Approximate locations of all 32 NFL teams. Select a team abbreviation to open its fantasy outlook.
        </desc>
        <path
          d="M4 11 L14 8 L25 10 L33 7 L45 11 L57 10 L66 14 L75 12 L83 17 L93 18 L97 26 L92 33 L88 33 L84 42 L78 44 L73 52 L64 54 L55 50 L46 54 L37 50 L29 45 L21 43 L17 36 L11 34 L8 27 Z"
          fill="#f3f0e7"
          stroke="#171c19"
          strokeWidth="0.6"
        />
        {teams.map((team) => {
          const point = getMapPoint(team);
          return (
            <a key={team.abbr} href={`/teams/${team.slug}`} aria-label={team.name}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2.15"
                fill={team.colors[0]}
                stroke="#171c19"
                strokeWidth="0.55"
              />
              <text
                x={point.x}
                y={point.y + 0.75}
                textAnchor="middle"
                fill="white"
                stroke="#171c19"
                strokeWidth="0.18"
                paintOrder="stroke"
                fontSize="1.65"
                fontWeight="900"
                fontFamily="monospace"
              >
                {team.abbr}
              </text>
            </a>
          );
        })}
      </svg>
      <p className="mt-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#3c4640]">
        Approximate team markets · select any pin
      </p>
    </div>
  );
}
