import type { NflversePlayerContext } from "../types/NflversePlayer";
export type AvailabilityCorrection = {
  slug: string;
  season: number;
  fromWeek: number;
  throughWeek: number;
  status: string;
  injury: string;
  projectionFactor: number;
  effectiveDate: string;
  verifiedAt: string;
  sourceName: string;
  sourceUrl: string;
  detail: string;
};
export function findAvailabilityCorrection(corrections: AvailabilityCorrection[], slug: string, season: number, week: number): AvailabilityCorrection | null;
export function rosterAvailabilityLabel(status?: string | null): string;
export function playerAvailabilityLabel(player: NflversePlayerContext | null, correction?: AvailabilityCorrection | null): string;
