import { getMarket } from "../../lib/market";

export const dynamic = "force-static";

export async function GET() {
  const market = await getMarket({
    format: "dynasty",
    numQbs: 2,
    numTeams: 12,
  });
  const header = [
    "market_rank",
    "asset_id",
    "name",
    "kind",
    "position",
    "team",
    "age",
    "position_rank",
    "market_value",
    "release_id",
    "captured_at",
  ];
  const rows = market.assets.map((asset, index) => [
    index + 1,
    asset.id,
    asset.name,
    asset.kind,
    asset.position,
    asset.team ?? "",
    asset.age ?? "",
    asset.posRank ?? "",
    asset.value,
    market.meta.releaseId,
    market.meta.generatedAt,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  return new Response(`${csv}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="dynasty-superflex-market-rankings.csv"',
      "Cache-Control":
        "public, max-age=21600, stale-while-revalidate=86400",
    },
  });
}

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
