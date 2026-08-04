import type { MarketPayload } from "../types/MarketAsset";

const marketRequests = new Map<string, Promise<MarketPayload>>();

export function fetchClientMarket(url: string, refresh = false) {
  if (refresh) marketRequests.delete(url);

  const existing = marketRequests.get(url);
  if (existing) return existing;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("Market data is unavailable");
      return response.json() as Promise<MarketPayload>;
    })
    .catch((error) => {
      marketRequests.delete(url);
      throw error;
    });

  marketRequests.set(url, request);
  return request;
}
