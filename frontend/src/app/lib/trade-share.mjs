const VALID_TEAM_COUNTS = new Set([8, 10, 12, 14, 16]);
const MAX_ASSETS_PER_SIDE = 12;

function firstParam(searchParams, key) {
  if (searchParams instanceof URLSearchParams) return searchParams.get(key);
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function assetIds(value) {
  return String(value || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id && id.length <= 100)
    .slice(0, MAX_ASSETS_PER_SIDE);
}

function sideSlug(assets) {
  if (!assets.length) return "open-side";
  const first = String(assets[0].slug || assets[0].id || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return assets.length === 1 ? first : `${first}-plus-${assets.length - 1}`;
}

export function buildTradeShareSlug(sideA, sideB) {
  return `${sideSlug(sideA)}-for-${sideSlug(sideB)}`.slice(0, 120);
}

export function buildTradeShareParams({
  format,
  numQbs,
  tep,
  numTeams,
  passingTdPoints,
  receptionPoints,
  rbStarters,
  wrStarters,
  teStarters,
  flexSpots,
  rosterPremium,
  sideA,
  sideB,
}) {
  const params = new URLSearchParams({
    format: format === "redraft" ? "redraft" : "dynasty",
    qbs: numQbs === 1 ? "1" : "2",
    teams: String(VALID_TEAM_COUNTS.has(numTeams) ? numTeams : 12),
  });
  if (tep) params.set("tep", "1");
  if (passingTdPoints === 6) params.set("passTd", "6");
  if ([0, 0.5].includes(Number(receptionPoints))) {
    params.set("ppr", String(Number(receptionPoints)));
  }
  if ([1, 3].includes(Number(rbStarters))) params.set("rb", String(rbStarters));
  if ([2, 4].includes(Number(wrStarters))) params.set("wr", String(wrStarters));
  if (Number(teStarters) === 2) params.set("te", "2");
  if ([0, 2, 3].includes(Number(flexSpots))) params.set("flex", String(flexSpots));
  if (!rosterPremium) params.set("roster", "0");
  if (sideA.length) params.set("get", sideA.map((asset) => asset.id).join(","));
  if (sideB.length) params.set("send", sideB.map((asset) => asset.id).join(","));
  return params;
}

export function resolveTradeShare(searchParams, marketAssets) {
  const format = firstParam(searchParams, "format") === "redraft" ? "redraft" : "dynasty";
  const numQbs = firstParam(searchParams, "qbs") === "1" ? 1 : 2;
  const tep = firstParam(searchParams, "tep") === "1";
  const requestedTeams = Number(firstParam(searchParams, "teams"));
  const numTeams = VALID_TEAM_COUNTS.has(requestedTeams) ? requestedTeams : 12;
  const passingTdPoints = firstParam(searchParams, "passTd") === "6" ? 6 : 4;
  const requestedReceptionPoints = Number(firstParam(searchParams, "ppr") ?? 1);
  const receptionPoints = [0, 0.5, 1].includes(requestedReceptionPoints)
    ? requestedReceptionPoints
    : 1;
  const requestedRbStarters = Number(firstParam(searchParams, "rb") ?? 2);
  const rbStarters = [1, 2, 3].includes(requestedRbStarters)
    ? requestedRbStarters
    : 2;
  const requestedWrStarters = Number(firstParam(searchParams, "wr") ?? 3);
  const wrStarters = [2, 3, 4].includes(requestedWrStarters)
    ? requestedWrStarters
    : 3;
  const requestedTeStarters = Number(firstParam(searchParams, "te") ?? 1);
  const teStarters = [1, 2].includes(requestedTeStarters)
    ? requestedTeStarters
    : 1;
  const requestedFlexSpots = Number(firstParam(searchParams, "flex") ?? 1);
  const flexSpots = [0, 1, 2, 3].includes(requestedFlexSpots)
    ? requestedFlexSpots
    : 1;
  const rosterPremium = firstParam(searchParams, "roster") !== "0";
  const byId = new Map(marketAssets.map((asset) => [asset.id, asset]));
  const seen = new Set();

  const resolveSide = (ids) =>
    ids
      .map((id) => byId.get(id))
      .filter((asset) => {
        if (!asset || seen.has(asset.id)) return false;
        seen.add(asset.id);
        return true;
      });

  const sideA = resolveSide(assetIds(firstParam(searchParams, "get")));
  const sideB = resolveSide(assetIds(firstParam(searchParams, "send")));

  return {
    format,
    numQbs,
    tep,
    numTeams,
    passingTdPoints,
    receptionPoints,
    rbStarters,
    wrStarters,
    teStarters,
    flexSpots,
    rosterPremium,
    sideA,
    sideB,
  };
}

export function summarizeTradeSide(assets) {
  if (!assets.length) return "Open side";
  if (assets.length === 1) return assets[0].name;
  return `${assets[0].name} + ${assets.length - 1} more`;
}

export function buildTradeTitle(sideA, sideB) {
  return `${summarizeTradeSide(sideA)} for ${summarizeTradeSide(sideB)}`;
}

export function calculatorPathForFormat(format) {
  return format === "redraft"
    ? "/fantasy-football-trade-analyzer"
    : "/dynasty-trade-calculator";
}
