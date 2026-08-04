import { getPlayerProfile } from "../../../lib/market";
import { getPlayerPage, playerPageSlugs } from "../../../lib/player-pages";
import { normalizeHistory } from "../../../lib/player-insights";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return playerPageSlugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = getPlayerPage(slug);
  if (!page) return new Response("Not found", { status: 404 });

  const profile = await getPlayerProfile(slug);
  const rows = normalizeHistory(profile.data.history).map((point) => [
    point.parsedDate.toISOString().slice(0, 10),
    String(point.value),
  ]);
  const csv = [
    ["observation_date", "market_value"],
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  return new Response(`${csv}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-dynasty-history.csv"`,
      "Cache-Control": "public, max-age=21600, stale-while-revalidate=86400",
    },
  });
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
