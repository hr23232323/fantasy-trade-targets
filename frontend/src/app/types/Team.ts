export type TeamSite = "home" | "away" | "neutral";
export type MatchupEnvironment = "Hot" | "Warm" | "Balanced" | "Cool" | "Cold";

export type TeamGame = {
  gameId: string;
  week: number;
  date: string;
  weekday: string;
  time: string | null;
  site: TeamSite;
  opponentAbbr: string;
  stadium: string | null;
  roof: string | null;
  surface: string | null;
  teamRest: number | null;
  opponentRest: number | null;
  restAdvantage: number | null;
  divisionGame: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  result: "W" | "L" | "T" | null;
  environmentScore: number;
  environmentLabel: MatchupEnvironment;
  opponentBaseline: {
    season: number;
    pointsAllowedPerGame: number | null;
    scoringDefenseRank: number | null;
    pointDifferentialPerGame: number | null;
  };
};

export type TeamProfile = {
  slug: string;
  abbr: string;
  name: string;
  nickname: string;
  conference: "AFC" | "NFC";
  division: string;
  colors: string[];
  logo: {
    src: string;
    alt: string;
    source: string;
  };
  marketLocation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  homeVenue: string | null;
  baseline: {
    abbr: string;
    games: number;
    wins: number;
    losses: number;
    ties: number;
    pointsForPerGame: number;
    pointsAllowedPerGame: number;
    pointDifferentialPerGame: number;
    scoringDefenseRank: number;
  };
  schedule: TeamGame[];
};

export type TeamRelease = {
  schemaVersion: number;
  modelVersion: string;
  releaseId: string;
  capturedAt: string;
  season: number;
  baselineSeason: number;
  sources: Record<
    string,
    {
      name: string;
      url: string;
      license: string;
      sha256: string;
      rowCount: number;
    }
  >;
  teams: Record<string, TeamProfile>;
};
