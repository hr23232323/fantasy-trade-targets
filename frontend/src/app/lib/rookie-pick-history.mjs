export const ROOKIE_PICK_IDS = Array.from({ length: 24 }, (_, index) => {
  const round = index < 12 ? 1 : 2;
  const slot = (index % 12) + 1;
  return `pick_2027_${round}_${String(slot).padStart(2, "0")}`;
});

export function buildRookiePickHistory({ existing, releases, pickIds = ROOKIE_PICK_IDS }) {
  const histories = Object.fromEntries(
    pickIds.map((id) => [id, Array.isArray(existing?.[id]) ? [...existing[id]] : []]),
  );

  for (const release of releases) {
    if (!release?.releaseId || !release?.capturedAt) continue;
    const oneQb = release.pickMarkets?.["1:12"]?.data;
    const superflex = release.pickMarkets?.["2:12"]?.data;
    if (!Array.isArray(oneQb) || !Array.isArray(superflex)) continue;

    for (const id of pickIds) {
      const oneQbPick = oneQb.find((pick) => pick.id === id);
      const superflexPick = superflex.find((pick) => pick.id === id);
      if (
        !Number.isFinite(oneQbPick?.composite) ||
        !Number.isFinite(superflexPick?.composite)
      ) continue;

      histories[id].push({
        observedAt: release.capturedAt,
        releaseId: release.releaseId,
        oneQbValue: oneQbPick.composite,
        superflexValue: superflexPick.composite,
      });
    }
  }

  for (const id of pickIds) {
    histories[id] = Array.from(
      new Map(
        histories[id].map((observation) => [observation.releaseId, observation]),
      ).values(),
    ).sort(
      (left, right) =>
        new Date(left.observedAt).getTime() - new Date(right.observedAt).getTime(),
    );
  }

  return histories;
}

export function validateRookiePickHistory({ histories, release, pickIds = ROOKIE_PICK_IDS }) {
  for (const id of pickIds) {
    const observations = histories[id];
    if (!Array.isArray(observations) || observations.length < 1) {
      throw new Error(`Rookie pick ${id} is missing snapshot history`);
    }
    if (
      observations.some(
        (observation) =>
          !observation.releaseId ||
          !Number.isFinite(observation.oneQbValue) ||
          !Number.isFinite(observation.superflexValue) ||
          !Number.isFinite(Date.parse(observation.observedAt)),
      ) ||
      new Set(observations.map((observation) => observation.releaseId)).size !==
        observations.length
    ) {
      throw new Error(`Rookie pick ${id} has invalid snapshot history`);
    }

    const latest = observations.at(-1);
    const currentOneQb = release.pickMarkets["1:12"].data.find(
      (pick) => pick.id === id,
    );
    const currentSuperflex = release.pickMarkets["2:12"].data.find(
      (pick) => pick.id === id,
    );
    if (
      latest.releaseId !== release.releaseId ||
      latest.oneQbValue !== currentOneQb?.composite ||
      latest.superflexValue !== currentSuperflex?.composite
    ) {
      throw new Error(`Rookie pick ${id} has stale snapshot history`);
    }
  }
}
