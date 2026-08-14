import {
  getRookiePickPage,
  getRookiePickResearch,
  rookiePickSlugs,
} from "../../../lib/rookie-picks";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return rookiePickSlugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = getRookiePickPage(slug);
  if (!page) return new Response("Not found", { status: 404 });
  const research = await getRookiePickResearch(page);
  const rows = [
    ["observed_at", "release_id", "one_qb_value", "superflex_value"],
    ...research.history.map((observation) => [
      observation.observedAt,
      observation.releaseId,
      observation.oneQbValue,
      observation.superflexValue,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(`${csv}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-dynasty-rookie-pick-history.csv"`,
      "Cache-Control": "public, max-age=21600, stale-while-revalidate=86400",
    },
  });
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
