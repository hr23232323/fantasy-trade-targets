import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import TradeReceiptActions from "../../components/TradeReceiptActions";
import PlayerPortrait from "../../components/PlayerPortrait";
import { getPlayerPage, getTradePlayerImage } from "../../lib/player-pages";
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
          passing_td_points: trade.passingTdPoints,
          reception_points: trade.receptionPoints,
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
                Both packages priced against today&apos;s {trade.format} market for {trade.passingTdPoints}-point passing touchdowns and {pprLabel(trade.receptionPoints)} scoring.
              </p>
            </div>
            <TradeReceiptActions
              title={trade.title}
              editHref={trade.calculatorHref}
              format={trade.format}
              sideACount={trade.sideA.length}
              sideBCount={trade.sideB.length}
              verdict={trade.evaluation.status}
              passingTdPoints={trade.passingTdPoints}
              receptionPoints={trade.receptionPoints}
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
            accent="acid"
          />
          <TradeSideCard
            label="Side B receives"
            assets={trade.sideB}
            adjusted={trade.evaluation.sideB.adjusted}
            rosterCost={trade.evaluation.sideB.rosterCost}
            accent="orange"
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

          <dl className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-7">
            <Setting label="Format" value={trade.format} />
            <Setting label="Quarterbacks" value={trade.numQbs === 2 ? "Superflex" : "1QB"} />
            <Setting label="Pass TD" value={`${trade.passingTdPoints} points`} />
            <Setting label="Receptions" value={pprLabel(trade.receptionPoints)} />
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
          passingTdPoints={trade.passingTdPoints}
          receptionPoints={trade.receptionPoints}
        />
      </section>

      <aside className="page-wrap mt-10 border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        Values updated {Number.isNaN(updated.getTime()) ? "daily" : updated.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET · Scoring model <span className="font-mono">{trade.market.meta.scoring.modelVersion}</span> · Release <span className="font-mono">{trade.market.meta.releaseId}</span> · Shared trade receipts are private-by-link and excluded from search indexing. <Link href="/methodology" className="underline underline-offset-2">Read the methodology</Link>.
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
  accent: "acid" | "orange";
}) {
  const accentClass = accent === "acid" ? "bg-[#dfff4f]" : "bg-[#ff6b3d]";

  return (
    <article className="bg-[#f3f0e7] p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className={`mono-label border border-[#171c19] px-3 py-2 ${accentClass}`}>{label}</span>
        <span className="font-mono text-3xl font-black">{Math.round(adjusted)}</span>
      </div>
      <div className="mt-6 grid gap-4">
        {assets.map((asset) => (
          <TradeAssetCard key={asset.id} asset={asset} accent={accent} />
        ))}
      </div>
      {rosterCost > 0 && <p className="mt-4 text-xs text-[#69706c]">Package depth adjustment: −{Math.round(rosterCost)}</p>}
    </article>
  );
}

function TradeAssetCard({
  asset,
  accent,
}: {
  asset: MarketAsset;
  accent: "acid" | "orange";
}) {
  const playerPage = asset.kind === "player" ? getPlayerPage(asset.slug) : undefined;
  const playerImage = asset.kind === "player" ? getTradePlayerImage(asset.slug) : undefined;
  const shadow = accent === "acid" ? "shadow-[4px_4px_0_#dfff4f]" : "shadow-[4px_4px_0_#ff6b3d]";
  const valueBackground = accent === "acid" ? "bg-[#dfff4f]" : "bg-[#ffb29a]";

  return (
    <article className={`grid min-h-[132px] grid-cols-[96px_minmax(0,1fr)] overflow-hidden border border-[#171c19] bg-[#fffdf7] ${shadow} sm:grid-cols-[112px_minmax(0,1fr)]`}>
      <div className="relative min-h-[132px] overflow-hidden border-r border-[#171c19] bg-[#dedbd1]">
        {playerImage ? (
          <PlayerPortrait
            slug={asset.slug}
            name={asset.name}
            image={playerImage}
            position={asset.position}
            team={asset.team}
            variant="thumbnail"
            sizes="(max-width: 640px) 96px, 112px"
          />
        ) : (
          <AssetArtwork asset={asset} />
        )}
        <span className={`absolute left-2 top-2 border border-[#171c19] px-2 py-1 font-mono text-[9px] font-black ${positionColor(asset.position)}`}>
          {asset.position}
        </span>
      </div>

      <div className="flex min-w-0 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.08em] text-[#69706c]">
            {asset.team || asset.tier || "Draft capital"}
          </span>
          <span className={`shrink-0 border border-[#171c19] px-2.5 py-1 text-right font-mono ${valueBackground}`}>
            <span className="block text-sm font-black">{Math.round(asset.value)}</span>
            {asset.scoringContext?.valueDelta ? (
              <span className="block text-[8px] font-bold text-[#171c19]/65" title={`Base market value ${asset.baseValue ?? asset.value}`}>
                {asset.scoringContext.valueDelta > 0 ? "+" : ""}{asset.scoringContext.valueDelta} league
              </span>
            ) : null}
          </span>
        </div>

        {playerPage ? (
          <Link
            href={`/players/${asset.slug}`}
            className="mt-2 text-xl font-black leading-[1.02] tracking-[-0.035em] underline decoration-transparent underline-offset-4 hover:decoration-[#171c19] sm:text-2xl"
          >
            {asset.name}
          </Link>
        ) : (
          <strong className="mt-2 text-xl font-black leading-[1.02] tracking-[-0.035em] sm:text-2xl">
            {asset.name}
          </strong>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-[#69706c]">
            {asset.kind === "pick"
              ? pickLabel(asset)
              : asset.rank
                ? `Market rank #${asset.rank}`
                : "Player asset"}
          </span>
          {playerImage && (
            <span className="max-w-[55%] truncate text-right font-mono text-[8px] uppercase text-[#69706c]">
              Photo: {" "}
              <a
                href={playerImage.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#bcb9ae] underline-offset-2 hover:text-[#171c19]"
              >
                {playerImage.author}
              </a>{" "}
              · {" "}
              <a
                href={playerImage.licenseUrl}
                target="_blank"
                rel="license noopener noreferrer"
                className="underline decoration-[#bcb9ae] underline-offset-2 hover:text-[#171c19]"
              >
                {playerImage.license}
              </a>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function AssetArtwork({ asset }: { asset: MarketAsset }) {
  const initials = asset.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  const background = asset.kind === "pick" ? "bg-[#171c19] text-white" : positionColor(asset.position);

  return (
    <div className={`absolute inset-0 grid place-items-center ${background}`} aria-hidden="true">
      <div className="absolute inset-3 border border-current opacity-25" />
      <div className="absolute left-3 right-3 top-1/2 border-t border-current opacity-20" />
      <span className="font-mono text-3xl font-black tracking-[-0.08em] sm:text-4xl">
        {asset.kind === "pick" ? asset.year?.slice(-2) || "PK" : initials || asset.position}
      </span>
      <span className="absolute bottom-2 font-mono text-[8px] font-black uppercase tracking-[0.12em] opacity-65">
        {asset.kind === "pick" ? "Draft pick" : asset.team || "NFL"}
      </span>
    </div>
  );
}

function pickLabel(asset: MarketAsset) {
  const round = asset.round ? `Round ${asset.round}` : "Future pick";
  return asset.year ? `${asset.year} · ${round}` : round;
}

function pprLabel(points: number) {
  if (points === 0) return "Standard";
  if (points === 0.5) return "Half PPR";
  return "Full PPR";
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
