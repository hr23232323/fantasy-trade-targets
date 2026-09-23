import type { NflversePlayerContext } from "../types/NflversePlayer";

export type StartSitProjection = {
  floor: number;
  median: number;
  ceiling: number;
  actual: number | null;
  recentPointsPerGame: number | null;
  recentVolume: number | null;
  usageChangePct: number | null;
  snapShare: number | null;
  matchupFactor: number;
  usageFactor: number;
  availability: string;
  availabilityApplied: boolean;
  sampleGames: number;
  confidence: "High" | "Medium" | "Low";
};

export const startSitScoringFormats: ReadonlyArray<{
  key: "standard" | "half-ppr" | "ppr";
  label: string;
  receptionPoints: 0 | 0.5 | 1;
}>;

export function projectPlayerWeek(args: {
  player: NflversePlayerContext;
  week: number;
  season: number;
  opponentAllowed: number | null;
  leagueMedianAllowed: number | null;
  receptionPoints?: 0 | 0.5 | 1;
  passingTdPoints?: 4 | 6;
}): StartSitProjection | null;

export function fantasyPoints(game: NflversePlayerContext["games"][number], receptionPoints?: number, passingTdPoints?: number): number | null;
export function projectionWinner(left: StartSitProjection | null, right: StartSitProjection | null): { side: "left" | "right"; gap: number; close: boolean } | null;
