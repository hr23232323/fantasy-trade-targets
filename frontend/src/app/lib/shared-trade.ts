import "server-only";

import { getMarket } from "./market";
import { evaluateTrade } from "./trade-engine.mjs";
import {
  buildTradeShareParams,
  buildTradeTitle,
  calculatorPathForFormat,
  resolveTradeShare,
  type TradeShareSettings,
} from "./trade-share.mjs";

export type RawTradeSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export async function getSharedTrade(searchParams: RawTradeSearchParams) {
  const requested = resolveTradeShare(searchParams, []) as TradeShareSettings;
  const market = await getMarket({
    format: requested.format,
    numQbs: requested.numQbs,
    tep: requested.tep,
    numTeams: requested.numTeams,
    passingTdPoints: requested.passingTdPoints,
    receptionPoints: requested.receptionPoints,
    rbStarters: requested.rbStarters,
    wrStarters: requested.wrStarters,
    teStarters: requested.teStarters,
    flexSpots: requested.flexSpots,
  });
  const trade = resolveTradeShare(
    searchParams,
    market.assets,
  ) as TradeShareSettings;
  const evaluation = evaluateTrade(
    trade.sideA,
    trade.sideB,
    trade.rosterPremium,
  );
  const params = buildTradeShareParams(trade);
  const title = buildTradeTitle(trade.sideA, trade.sideB);
  const calculatorHref = `${calculatorPathForFormat(trade.format)}?${params}`;

  return {
    ...trade,
    market,
    evaluation,
    params,
    title,
    calculatorHref,
    complete: trade.sideA.length > 0 && trade.sideB.length > 0,
  };
}

export function tradeVerdictLabel(
  evaluation: Awaited<ReturnType<typeof getSharedTrade>>["evaluation"],
) {
  if (evaluation.status === "incomplete") return "Incomplete trade";
  if (evaluation.status === "fair") return "Fair market value";
  return evaluation.winner === "A"
    ? "Market value favors Side A"
    : "Market value favors Side B";
}
