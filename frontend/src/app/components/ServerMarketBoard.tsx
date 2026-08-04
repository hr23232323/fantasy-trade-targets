import { getMarket } from "../lib/market";
import MarketBoardClient, { type MarketBoardProps } from "./MarketBoard";

export default async function ServerMarketBoard(props: MarketBoardProps) {
  const market = await getMarket({
    format: props.format,
    numQbs: props.numQbs,
    tep: false,
    numTeams: 12,
  });
  const initialLimit = props.initialLimit ?? 40;
  const initialIsPartial = market.assets.length > initialLimit;
  const initialMarket = {
    ...market,
    assets: market.assets.slice(0, initialLimit),
  };

  return (
    <MarketBoardClient
      {...props}
      initialMarket={initialMarket}
      initialIsPartial={initialIsPartial}
    />
  );
}
