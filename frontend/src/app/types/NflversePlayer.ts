export type NflverseStatLine = Record<string, number | null>;

export type NflverseGameLog = {
  season: number;
  week: number;
  gameId: string;
  team: string | null;
  opponent: string | null;
  fantasyPoints: number | null;
  fantasyPointsHalfPpr: number | null;
  fantasyPointsPpr: number | null;
  passing: NflverseStatLine;
  rushing: NflverseStatLine;
  receiving: NflverseStatLine;
  targetShare: number | null;
  airYardsShare: number | null;
  offenseSnaps: number | null;
  offenseSnapPct: number | null;
};

export type NflverseSeasonSummary = {
  season: number;
  games: number;
  fantasyPointsPerGame: number;
  halfPprPointsPerGame: number;
  pprPointsPerGame: number;
  offenseSnapsPerGame: number | null;
};

export type NflversePlayerContext = {
  slug: string;
  sleeperId: string;
  gsisId: string | null;
  pfrId: string | null;
  roster: {
    team: string | null;
    position: string | null;
    depthChartPosition: string | null;
    jerseyNumber: number | null;
    status: string | null;
    statusDescription: string | null;
    yearsExperience: number | null;
    week: number | null;
  } | null;
  injury: {
    week: number | null;
    reportPrimaryInjury: string | null;
    reportStatus: string | null;
    practicePrimaryInjury: string | null;
    practiceSecondaryInjury: string | null;
    practiceStatus: string | null;
  } | null;
  games: NflverseGameLog[];
  seasons: NflverseSeasonSummary[];
};

export type NflversePlayerRelease = {
  schemaVersion: number;
  modelVersion: string;
  releaseId: string;
  capturedAt: string;
  season: number;
  seasons: number[];
  license: {
    name: string;
    shortName: string;
    url: string;
    attribution: string;
    projectUrl: string;
  };
  sources: Record<string, { url: string; sha256: string; rowCount: number }>;
  coverage: {
    publishedPlayers: number;
    rosterMapped: number;
    playersWithGames: number;
    playersWithCurrentSeasonGames: number;
    playersWithInjuryRows: number;
  };
  players: Record<string, NflversePlayerContext>;
};
