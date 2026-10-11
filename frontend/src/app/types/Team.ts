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
  temperatureF: number | null;
  windMph: number | null;
  teamRest: number | null;
  opponentRest: number | null;
  restAdvantage: number | null;
  divisionGame: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  teamQuarterback: string | null;
  opponentQuarterback: string | null;
  result: "W" | "L" | "T" | null;
  betting: {
    awayMoneyline: number | null;
    homeMoneyline: number | null;
    spreadLine: number | null;
    awaySpreadOdds: number | null;
    homeSpreadOdds: number | null;
    totalLine: number | null;
    underOdds: number | null;
    overOdds: number | null;
  };
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
  bettingTrends: {
    games: TeamBettingTrendGame[];
    currentSeason: TeamBettingTrendSummary;
    previousSeason: TeamBettingTrendSummary;
    last10: TeamBettingTrendSummary;
  };
  schedule: TeamGame[];
};

export type TeamBettingTrendGame = {
  gameId: string;
  season: number;
  week: number;
  date: string;
  site: TeamSite;
  opponentAbbr: string;
  teamScore: number;
  opponentScore: number;
  result: "W" | "L" | "T";
  teamSpread: number;
  totalLine: number;
  atsResult: "W" | "L" | "P";
  totalResult: "O" | "U" | "P";
};

export type TeamBettingTrendSummary = {
  games: number;
  straightUp: { wins: number; losses: number; ties: number };
  againstSpread: { wins: number; losses: number; pushes: number; coverRate: number | null };
  totals: { overs: number; unders: number; pushes: number; overRate: number | null };
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
  predictionModel: {
    modelVersion: string;
    validation: {
      season: number;
      weeks: string;
      games: number;
      straightUp: { correct: number; graded: number; accuracy: number };
      againstSpread: { wins: number; losses: number; pushes: number; passes: number; winRate: number };
      totals: { wins: number; losses: number; pushes: number; passes: number; winRate: number };
      scoreMae: number;
    };
  };
  teams: Record<string, TeamProfile>;
};
