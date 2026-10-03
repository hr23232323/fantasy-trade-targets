export const DEFAULT_PLAYOFF_WEEKS = [15, 16, 17];

export function buildPlayoffScheduleRatings({
  teams,
  positionDefense,
  position,
  weeks = DEFAULT_PLAYOFF_WEEKS,
}) {
  if (!Array.isArray(teams) || !positionDefense || !position || !Array.isArray(weeks) || weeks.length === 0) return [];
  const teamByAbbr = new Map(teams.map((team) => [team.abbr, team]));
  return teams.flatMap((team) => {
    const games = weeks.flatMap((week) => {
      const game = team.schedule?.find((candidate) => candidate.week === week);
      if (!game) return [{
        week,
        game: null,
        opponent: null,
        bye: true,
        pointsAllowed: { standard: 0, halfPpr: 0, ppr: 0 },
      }];
      const opponent = game ? teamByAbbr.get(game.opponentAbbr) : null;
      const pointsAllowed = opponent ? positionDefense[opponent.abbr]?.[position]?.pointsPerGame : null;
      return game && opponent && validPointsAllowed(pointsAllowed)
        ? [{ week, game, opponent, bye: false, pointsAllowed }]
        : [];
    });
    if (games.length !== weeks.length) return [];
    return [{
      team,
      weeks: [...weeks],
      games,
      averages: {
        standard: average(games.map(({ pointsAllowed }) => pointsAllowed.standard)),
        halfPpr: average(games.map(({ pointsAllowed }) => pointsAllowed.halfPpr)),
        ppr: average(games.map(({ pointsAllowed }) => pointsAllowed.ppr)),
      },
    }];
  }).sort((left, right) =>
    right.averages.ppr - left.averages.ppr ||
    right.averages.halfPpr - left.averages.halfPpr ||
    left.team.name.localeCompare(right.team.name),
  ).map((row, index) => ({ ...row, rank: index + 1 }));
}

function validPointsAllowed(value) {
  return value && [value.standard, value.halfPpr, value.ppr].every(Number.isFinite);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
