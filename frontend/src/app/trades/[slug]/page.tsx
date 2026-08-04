import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import TradeReceiptActions from "../../components/TradeReceiptActions";
import { getPlayerPage } from "../../lib/player-pages";
import {
  getSharedTrade,
  tradeVerdictLabel,
  type RawTradeSearchParams,
} from "../../lib/shared-trade";
import type { MarketAsset } from "../../types/MarketAsset";

export const dynamic = "force-dynamic";

type TradePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: TradePageProps): Promise<Metadata> {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const trade = await getSharedTrade(rawSearchParams);
  if (!trade.complete) {
    return {
      title: "Fantasy Trade Report",
      robots: { index: false, follow: false },
    };
  }

  const verdict = tradeVerdictLabel(trade.evaluation);
  const description = `${verdict}. Side A receives ${trade.sideA.map((asset) => asset.name).join(", ")}; Side B receives ${trade.sideB.map((asset) => asset.name).join(", ")}.`;
  const query = trade.params.toString();
  const reportUrl = `/trades/${slug}?${query}`;
  const imageUrl = `/trade-card?${query}`;

  return {
    title: `${trade.title} Trade Value`,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: reportUrl,
      title: `${trade.title} fantasy trade`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${trade.title} fantasy trade value card`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${trade.title} fantasy trade`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function TradePage({ searchParams }: TradePageProps) {
  const rawSearchParams = (await searchParams) as RawTradeSearchParams;
  const trade = await getSharedTrade(rawSearchParams);
  if (!trade.complete) notFound();

  const verdict = tradeVerdictLabel(trade.evaluation);
  const total = trade.evaluation.sideA.adjusted + trade.evaluation.sideB.adjusted;
  const sideAShare = total
    ? Math.max(
        4,
        Math.min(96, (trade.evaluation.sideA.adjusted / total) * 100),
      )
    : 50;
  const updated = new Date(trade.market.meta.generatedAt);

  return (
    <>
      <AnalyticsPageView
        eventName="trade_report_viewed"
        properties={{
          calculator_format: trade.format,
          num_qbs: trade.numQbs,
          te_premium: trade.tep,
          league_size: trade.numTeams,
          roster_cost_enabled: trade.rosterPremium,
          side_a_asset_count: trade.sideA.length,
          side_b_asset_count: trade.sideB.length,
          verdict: trade.evaluation.status,
          percent_difference: trade.evaluation.percentDifference,
        }}
      />

      <nav
        className="page-wrap pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-[#171c19]">Home</Link>
        <span className="mx-2">/</span>
        <Link href={trade.calculatorHref} className="hover:text-[#171c19]">Calculator</Link>
        <span className="mx-2">/</span>
        <span aria-current="page">Shared trade</span>
      </nav>

      <section className="page-wrap py-10 sm:py-14">
        <div className="border border-[#171c19] bg-[#171c19] p-6 text-white shadow-[8px_8px_0_#8bcfff] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="mono-label text-[#dfff4f]">Shared trade // market receipt</span>
              <h1 className="mt-5 max-w-5xl text-[clamp(2.8rem,7vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em]">
                {trade.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/60">
                Both packages priced against today&apos;s {trade.format} market with Fantasy Trade Target&apos;s published roster-cost rules.
              </p>
            </div>
            <TradeReceiptActions
              title={trade.title}
              editHref={trade.calculatorHref}
              format={trade.format}
              sideACount={trade.sideA.length}
              sideBCount={trade.sideB.length}
              verdict={trade.evaluation.status}
            />
          </div>
        </div>
      </section>

      <section className="page-wrap py-6">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
          <TradeSideCard
            label="Side A receives"
            assets={trade.sideA}
            adjusted={trade.evaluation.sideA.adjusted}
            rosterCost={trade.evaluation.sideA.rosterCost}
            accent="bg-[#dfff4f]"
          />
          <TradeSideCard
            label="Side B receives"
            assets={trade.sideB}
            adjusted={trade.evaluation.sideB.adjusted}
            rosterCost={trade.evaluation.sideB.rosterCost}
            accent="bg-[#ff6b3d]"
          />
        </div>
      </section>

      <section className="page-wrap py-10 sm:py-16">
        <div className="paper-card p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="mono-label text-[#69706c]">Market verdict</span>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-6xl">{verdict}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#69706c]">{trade.evaluation.summary}</p>
            </div>
            <div className="lg:text-right">
              <span className="font-mono text-5xl font-black text-[#a23616]">{trade.evaluation.percentDifference}%</span>
              <p className="mono-label mt-2 text-[#69706c]">Adjusted gap</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex justify-between font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#69706c]">
              <span>Side A · {Math.round(trade.evaluation.sideA.adjusted)}</span>
              <span>Side B · {Math.round(trade.evaluation.sideB.adjusted)}</span>
            </div>
            <div className="flex h-5 border border-[#171c19] bg-[#ff6b3d]">
              <div className="bg-[#dfff4f]" style={{ width: `${sideAShare}%` }} />
            </div>
          </div>

          <dl className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-5">
            <Setting label="Format" value={trade.format} />
            <Setting label="Quarterbacks" value={trade.numQbs === 2 ? "Superflex" : "1QB"} />
            <Setting label="League" value={`${trade.numTeams} teams`} />
            <Setting label="TE premium" value={trade.tep ? "On" : "Off"} />
            <Setting label="Roster cost" value={trade.rosterPremium ? "On" : "Off"} />
          </dl>
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <span className="eyebrow">Want to counter?</span>
          <h2 className="section-title mt-6 max-w-3xl">Move a piece, swap the sides, or build your own version.</h2>
        </div>
        <TradeReceiptActions
          title={trade.title}
          editHref={trade.calculatorHref}
          format={trade.format}
          sideACount={trade.sideA.length}
          sideBCount={trade.sideB.length}
          verdict={trade.evaluation.status}
        />
      </section>

      <aside className="page-wrap mt-10 border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        Values updated {Number.isNaN(updated.getTime()) ? "daily" : updated.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET · Release <span className="font-mono">{trade.market.meta.releaseId}</span> · Shared trade receipts are private-by-link and excluded from search indexing. <Link href="/methodology" className="underline underline-offset-2">Read the methodology</Link>.
      </aside>
    </>
  );
}

function TradeSideCard({
  label,
  assets,
  adjusted,
  rosterCost,
  accent,
}: {
  label: string;
  assets: MarketAsset[];
  adjusted: number;
  rosterCost: number;
  accent: string;
}) {
  return (
    <article className="bg-[#f3f0e7] p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className={`mono-label border border-[#171c19] px-3 py-2 ${accent}`}>{label}</span>
        <span className="font-mono text-3xl font-black">{Math.round(adjusted)}</span>
      </div>
      <div className="mt-6 divide-y divide-[#bcb9ae] border-y border-[#bcb9ae]">
        {assets.map((asset) => {
          const content = (
            <>
              <span className={`grid h-10 w-10 shrink-0 place-items-center font-mono text-[9px] font-black ${positionColor(asset.position)}`}>{asset.position}</span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate">{asset.name}</strong>
                <span className="mt-1 block font-mono text-[9px] uppercase text-[#69706c]">{asset.team || asset.tier || "Draft capital"}</span>
              </span>
              <span className="font-mono text-lg font-black">{Math.round(asset.value)}</span>
            </>
          );
          return asset.kind === "player" && getPlayerPage(asset.slug) ? (
            <Link key={asset.id} href={`/players/${asset.slug}`} className="flex items-center gap-3 py-4 hover:bg-white">{content}</Link>
          ) : (
            <div key={asset.id} className="flex items-center gap-3 py-4">{content}</div>
          );
        })}
      </div>
      {rosterCost > 0 && <p className="mt-4 text-xs text-[#69706c]">Package depth adjustment: −{Math.round(rosterCost)}</p>}
    </article>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#f3f0e7] p-4"><dt className="mono-label text-[#69706c]">{label}</dt><dd className="mt-2 text-sm font-black capitalize">{value}</dd></div>;
}

function positionColor(position: MarketAsset["position"]) {
  if (position === "QB") return "bg-[#8bcfff]";
  if (position === "RB") return "bg-[#ffb29a]";
  if (position === "WR") return "bg-[#dfff4f]";
  if (position === "TE") return "bg-[#d7b6ff]";
  return "bg-[#171c19] text-white";
}
