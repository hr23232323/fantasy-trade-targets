const DAY_MS = 24 * 60 * 60 * 1_000;

function parseHistoryDate(value) {
  if (/^\d{6}$/.test(value)) {
    const year = 2000 + Number(value.slice(0, 2));
    const month = Number(value.slice(2, 4)) - 1;
    const day = Number(value.slice(4, 6));
    const date = new Date(Date.UTC(year, month, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeHistory(points) {
  return points
    .map((point) => ({ ...point, parsedDate: parseHistoryDate(point.date) }))
    .filter((point) => Boolean(point.parsedDate) && Number.isFinite(point.value))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
}

export function carryHistoryForward(points) {
  const observations = normalizeHistory(points);
  if (observations.length < 2) return observations;

  const filled = [];
  for (const observation of observations) {
    const previous = filled.at(-1);
    if (previous) {
      const previousDay = Date.UTC(
        previous.parsedDate.getUTCFullYear(),
        previous.parsedDate.getUTCMonth(),
        previous.parsedDate.getUTCDate(),
      );
      const observationDay = Date.UTC(
        observation.parsedDate.getUTCFullYear(),
        observation.parsedDate.getUTCMonth(),
        observation.parsedDate.getUTCDate(),
      );

      for (let day = previousDay + DAY_MS; day < observationDay; day += DAY_MS) {
        const parsedDate = new Date(day + DAY_MS - 1);
        filled.push({
          date: parsedDate.toISOString(),
          value: previous.value,
          parsedDate,
          carried: true,
        });
      }
    }
    filled.push({ ...observation, carried: false });
  }

  return filled;
}

export function getHistoryChartScale(points) {
  const values = normalizeHistory(points).map((point) => point.value);
  const observedMin = values.length ? Math.min(...values) : 0;
  const observedMax = values.length ? Math.max(...values) : 0;
  return {
    min: 0,
    max: Math.max(1000, Math.ceil(observedMax / 100) * 100),
    observedMin,
    observedMax,
  };
}

export function getTimeRatio(date, firstDate, lastDate) {
  const first = firstDate.getTime();
  const span = Math.max(lastDate.getTime() - first, 1);
  return Math.max(0, Math.min(1, (date.getTime() - first) / span));
}

export function findNearestHistoryIndex(points, targetTime) {
  if (!points.length) return -1;
  let closestIndex = 0;
  let closestDistance = Math.abs(points[0].parsedDate.getTime() - targetTime);
  for (let index = 1; index < points.length; index += 1) {
    const distance = Math.abs(points[index].parsedDate.getTime() - targetTime);
    if (distance < closestDistance) {
      closestIndex = index;
      closestDistance = distance;
    }
  }
  return closestIndex;
}

export function calculateHistoryMovement(points, targetDays) {
  const history = normalizeHistory(points);
  const current = history.at(-1);
  if (!current || history.length < 2) return null;

  const targetTime = current.parsedDate.getTime() - targetDays * DAY_MS;
  const candidates = history.filter(
    (point) => point.parsedDate.getTime() <= targetTime,
  );
  const baseline = candidates.at(-1) ?? history[0];
  if (!baseline || baseline.value === 0 || baseline === current) return null;

  return {
    label: `${targetDays}-day`,
    valueChange: current.value - baseline.value,
    percentChange: ((current.value - baseline.value) / baseline.value) * 100,
    observedDays: Math.round(
      (current.parsedDate.getTime() - baseline.parsedDate.getTime()) / DAY_MS,
    ),
  };
}

export function buildPlayerSnapshotHistory({ existing, releases, playerSlugs }) {
  const histories = Object.fromEntries(
    playerSlugs.map((slug) => [
      slug,
      Array.isArray(existing?.[slug]) ? [...existing[slug]] : [],
    ]),
  );

  for (const release of releases) {
    if (!release?.releaseId || !release?.capturedAt) continue;
    const market = release.playerMarkets?.["dynasty:2:0"]?.data;
    if (!Array.isArray(market)) continue;

    for (const slug of playerSlugs) {
      const player = market.find((candidate) => candidate.slug === slug);
      if (!player || !Number.isFinite(player.composite)) continue;
      histories[slug].push({
        observedAt: release.capturedAt,
        value: player.composite,
        rank: player.rank ?? null,
        posRank: player.posRank ?? null,
        releaseId: release.releaseId,
      });
    }
  }

  for (const slug of playerSlugs) {
    histories[slug] = Array.from(
      new Map(
        histories[slug].map((observation) => [observation.releaseId, observation]),
      ).values(),
    ).sort(
      (left, right) =>
        new Date(left.observedAt).getTime() - new Date(right.observedAt).getTime(),
    );
  }

  return histories;
}
