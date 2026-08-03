const EXTRA_ASSET_WEIGHTS = [0.9, 0.84, 0.79, 0.75, 0.72, 0.7, 0.68];

function round(value) {
  return Math.round(value * 10) / 10;
}

export function calculateSide(assets, rosterPremium = true) {
  const ordered = [...assets].sort((a, b) => b.value - a.value);
  const raw = ordered.reduce((total, asset) => total + asset.value, 0);

  if (!ordered.length) {
    return { raw: 0, adjusted: 0, rosterCost: 0, contributions: [] };
  }

  const contributions = ordered.map((asset, index) => {
    const weight = rosterPremium
      ? index === 0
        ? 1
        : EXTRA_ASSET_WEIGHTS[Math.min(index - 1, EXTRA_ASSET_WEIGHTS.length - 1)]
      : 1;

    return {
      id: asset.id,
      value: asset.value,
      weight,
      adjustedValue: round(asset.value * weight),
    };
  });

  const adjusted = round(
    contributions.reduce((total, asset) => total + asset.adjustedValue, 0),
  );

  return {
    raw: round(raw),
    adjusted,
    rosterCost: round(raw - adjusted),
    contributions,
  };
}

export function evaluateTrade(sideA, sideB, rosterPremium = true) {
  const a = calculateSide(sideA, rosterPremium);
  const b = calculateSide(sideB, rosterPremium);

  if (!sideA.length || !sideB.length) {
    return {
      status: "incomplete",
      winner: null,
      label: "Build both sides",
      summary: "Add at least one asset to each side to get a verdict.",
      percentDifference: 0,
      valueGap: 0,
      sideA: a,
      sideB: b,
    };
  }

  const gap = round(a.adjusted - b.adjusted);
  const baseline = Math.max(Math.min(a.adjusted, b.adjusted), 1);
  const percentDifference = round((Math.abs(gap) / baseline) * 100);
  const winner = Math.abs(gap) < 0.1 ? null : gap > 0 ? "A" : "B";

  let status = "fair";
  let label = "Fair trade";
  if (percentDifference > 18) {
    status = "strong";
    label = `Strong edge: Side ${winner}`;
  } else if (percentDifference > 10) {
    status = "clear";
    label = `Clear edge: Side ${winner}`;
  } else if (percentDifference > 4) {
    status = "lean";
    label = `Leans Side ${winner}`;
  }

  const summary =
    status === "fair"
      ? "The adjusted market values land within the fair-trade band. Team fit can break the tie."
      : `Side ${winner} carries about a ${percentDifference}% adjusted market edge after roster-cost effects.`;

  return {
    status,
    winner,
    label,
    summary,
    percentDifference,
    valueGap: Math.abs(gap),
    sideA: a,
    sideB: b,
  };
}

export function findBalancingAssets(assets, selectedIds, targetGap, limit = 3) {
  if (targetGap <= 0) return [];

  return assets
    .filter((asset) => !selectedIds.has(asset.id))
    .map((asset) => ({ asset, distance: Math.abs(asset.value - targetGap) }))
    .sort((a, b) => a.distance - b.distance || b.asset.value - a.asset.value)
    .slice(0, limit)
    .map(({ asset }) => asset);
}
