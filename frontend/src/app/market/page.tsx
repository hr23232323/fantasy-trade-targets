import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import JsonLd from "../components/JsonLd";
import ServerMarketBoard from "../components/ServerMarketBoard";
import { TrackedLink } from "../components/TrackedLink";
import {
  getMarket,
  getMarketReleaseInfo,
  getPlayerSnapshotHistory,
} from "../lib/market";
import { buildPageMetadata } from "../lib/metadata";
import { hasPlayerPage, playerPages } from "../lib/player-pages";
import type { MarketAsset } from "../types/MarketAsset";
import type { PlayerSnapshotObservation } from "../types/PlayerProfile";

const SITE_URL = "https://fantasytradetarget.com";
const DAY_MS = 86_400_000;

export const metadata = buildPageMetadata({
  title: "Fantasy Football Market Data, Rankings & Downloads",
  description:
    "Browse the current fantasy football market release, dynasty and redraft rankings, rookie-pick values, verified movement, methodology, and downloadable CSV and JSON data.",
  path: "/market",
});

export default async function MarketPage() {
  const [dynastySuperflex, dynasty1Qb, dynastySuperflexTep, redraft1Qb] =
    await Promise.all([
      getMarket({ format: "dynasty", numQbs: 2, numTeams: 12 }),
      getMarket({ format: "dynasty", numQbs: 1, numTeams: 12 }),
      getMarket({ format: "dynasty", numQbs: 2, tep: true, numTeams: 12 }),
      getMarket({ format: "redraft", numQbs: 1, numTeams: 12 }),
    ]);
  const release = getMarketReleaseInfo();
  const topPlayer = dynastySuperflex.assets.find(
    (asset) => asset.kind === "player",
  )!;
  const leadingPicks = dynastySuperflex.assets
    .filter((asset) => asset.kind === "pick")
    .slice(0, 6);
  const movements = getSevenDayMovements(
    dynastySuperflex.assets,
    getPlayerSnapshotHistory(),
  );
  const formats = [
    ["Dynasty Superflex", dynastySuperflex],
    ["Dynasty 1QB", dynasty1Qb],
    ["Dynasty SF + TEP", dynastySuperflexTep],
    ["Redraft 1QB", redraft1Qb],
  ] as const;

  return (
    <>
      <AnalyticsPageView
        eventName="market_hub_viewed"
        properties={{
          release_id: release.releaseId,
          methodology_version: release.methodologyVersion,
          dynasty_asset_count: dynastySuperflex.meta.assetCount,
          reviewed_player_count: playerPages.length,
          seven_day_movement_available: movements.length > 0,
        }}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "Fantasy Trade Target Market Release",
            description:
              "Current fantasy football market rankings across dynasty Superflex, dynasty 1QB, dynasty tight-end premium, redraft, and rookie-pick settings.",
            url: `${SITE_URL}/market`,
            version: release.releaseId,
            dateModified: release.capturedAt,
            creator: { "@id": `${SITE_URL}/#organization` },
            isBasedOn: release.source.docs,
            variableMeasured: [
              "Market value",
              "Overall rank",
              "Position rank",
              "Player age",
              "League format",
              "Quarterback setting",
              "Tight-end premium",
              "Rookie-pick slot",
            ],
            distribution: [
              {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: `${SITE_URL}/market/data.json`,
              },
              {
                "@type": "DataDownload",
                encodingFormat: "text/csv",
                contentUrl: `${SITE_URL}/market/rankings.csv`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Market",
                item: `${SITE_URL}/market`,
              },
            ],
          },
        ]}
      />

      <section className="page-wrap py-14 sm:py-20">
        <span className="eyebrow">Current market release // versioned data</span>
        <h1 className="display-type mt-8 max-w-6xl uppercase">
          The fantasy market. <span className="text-[#ff6b3d]">One source of record.</span>
        </h1>
        <p className="mt-8 max-w-4xl text-lg font-medium leading-8 text-[#515854]">
          {topPlayer.name} currently leads the published dynasty Superflex market at {formatValue(topPlayer.value)}. This release ranks {dynastySuperflex.meta.assetCount} players and rookie picks on one comparable scale, with the timestamp, settings, methodology version, and downloadable records attached.
        </p>
      </section>

      <section className="page-wrap pb-8">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-[1.35fr_0.65fr]">
          <article className="bg-[#171c19] p-7 text-white sm:p-10">
            <span className="mono-label text-[#dfff4f]">Release // {release.releaseId}</span>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <ReleaseFact label="Captured" value={formatTimestamp(release.capturedAt)} />
              <ReleaseFact label="Method" value={release.methodologyVersion} />
              <ReleaseFact label="Refresh" value="Three times daily" />
            </div>
            <p className="mt-10 max-w-3xl text-sm leading-7 text-white/60">
              Every successful refresh advances the validated current release, appends compact player observations, and preserves a compressed full-market archive. Failed or partial pulls never replace the last good release.
            </p>
          </article>
          <article className="bg-[#dfff4f] p-7 sm:p-10">
            <span className="mono-label">Portable evidence</span>
            <h2 className="mt-7 text-4xl font-black tracking-[-0.055em]">Take the release with you.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                href="/market/data.json"
                className="border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-white"
                analyticsEvent="research_downloaded"
                analyticsProperties={{ resource: "market_json", release_id: release.releaseId }}
              >
                Download JSON ↓
              </TrackedLink>
              <TrackedLink
                href="/market/rankings.csv"
                className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-[#171c19]"
                analyticsEvent="research_downloaded"
                analyticsProperties={{ resource: "market_csv", release_id: release.releaseId }}
              >
                Download CSV ↓
              </TrackedLink>
            </div>
            <Link href="/methodology" className="mt-7 inline-block font-mono text-[10px] font-black uppercase underline underline-offset-4">
              Read methodology →
            </Link>
          </article>
        </div>
      </section>

      <section className="page-wrap py-10">
        <div className="mb-7 grid gap-4 border-t border-[#171c19] pt-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="eyebrow">Format checkpoints</span>
            <h2 className="section-title mt-5">Context changes the board.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#69706c]">
            One substantial market page owns the major scoring contexts. No doorway page is generated for every settings combination.
          </p>
        </div>
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 xl:grid-cols-4">
          {formats.map(([label, market], index) => {
            const leader = market.assets.find((asset) => asset.kind === "player")!;
            return (
              <article key={label} className={["bg-[#f3f0e7]", "bg-[#8bcfff]", "bg-[#d7b6ff]", "bg-[#ffb29a]"][index] + " p-6"}>
                <span className="mono-label">{label}</span>
                <p className="mt-10 font-mono text-4xl font-black">{formatValue(leader.value)}</p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">{leader.name}</h3>
                <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-[#59605c]">
                  Market leader · {market.meta.assetCount} assets
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {movements.length > 0 && (
        <MovementSection movements={movements} />
      )}

      <section className="page-wrap py-10">
        <ServerMarketBoard
          heading="Current dynasty Superflex market"
          description="Search the complete release, filter by position or age, open reviewed player research, or preload an asset into the calculator."
          initialLimit={80}
        />
      </section>

      <section className="page-wrap py-12">
        <div className="grid gap-8 border-y border-[#171c19] py-9 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <span className="eyebrow">Rookie-pick reference</span>
            <h2 className="section-title mt-5">Draft capital on the same scale.</h2>
            <Link href="/rookie-pick-values" className="mt-5 inline-block border-b-2 border-[#171c19] font-mono text-[10px] font-black uppercase tracking-[0.07em]">Research every 2027 exact pick →</Link>
          </div>
          <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-3">
            {leadingPicks.map((pick) => (
              <Link
                key={pick.id}
                href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${pick.id}`}
                className="flex items-center justify-between gap-4 bg-[#f3f0e7] p-4 hover:bg-[#dfff4f]"
              >
                <span className="text-sm font-black">{pick.name}</span>
                <span className="font-mono text-sm font-black">{formatValue(pick.value)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <aside className="page-wrap pb-10 text-[11px] leading-6 text-[#69706c]">
        Current values are attributed composite market reference points, not accepted-trade prices or guarantees. The public JSON includes the compact recorded history for reviewed player profiles; complete compressed release archives are retained separately from the production application. See <Link href="/data-sources" className="underline underline-offset-2">sources, licensing, storage, and freshness</Link>.
      </aside>
    </>
  );
}

function ReleaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mono-label text-white/40">{label}</span>
      <p className="mt-3 text-lg font-black">{value}</p>
    </div>
  );
}

type Movement = {
  asset: MarketAsset;
  baseline: PlayerSnapshotObservation;
  latest: PlayerSnapshotObservation;
  change: number;
  percent: number;
};

function MovementSection({ movements }: { movements: Movement[] }) {
  const risers = movements.filter((movement) => movement.change > 0).slice(0, 5);
  const fallers = [...movements]
    .filter((movement) => movement.change < 0)
    .sort((left, right) => left.change - right.change)
    .slice(0, 5);
  if (!risers.length && !fallers.length) return null;

  return (
    <section className="page-wrap py-10">
      <span className="eyebrow">Verified seven-day movement</span>
      <h2 className="section-title mt-5 max-w-4xl">Real observations. No estimated backfill.</h2>
      <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
        <MovementList label="Risers" movements={risers} accent="bg-[#dfff4f]" />
        <MovementList label="Fallers" movements={fallers} accent="bg-[#ffb29a]" />
      </div>
    </section>
  );
}

function MovementList({
  label,
  movements,
  accent,
}: {
  label: string;
  movements: Movement[];
  accent: string;
}) {
  return (
    <article className="bg-[#f3f0e7] p-6">
      <span className={`mono-label inline-block border border-[#171c19] px-3 py-2 ${accent}`}>{label}</span>
      <ol className="mt-5 divide-y divide-[#bcb9ae] border-y border-[#bcb9ae]">
        {movements.map((movement) => (
          <li key={movement.asset.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-4">
            <div>
              {hasPlayerPage(movement.asset.slug) ? (
                <Link href={`/players/${movement.asset.slug}`} className="font-black underline decoration-[#ff6b3d] underline-offset-4">
                  {movement.asset.name}
                </Link>
              ) : (
                <strong>{movement.asset.name}</strong>
              )}
              <p className="mt-1 font-mono text-[9px] uppercase text-[#69706c]">
                {movement.asset.position} · {formatValue(movement.baseline.value)} → {formatValue(movement.latest.value)}
              </p>
            </div>
            <span className="font-mono text-lg font-black">
              {movement.change > 0 ? "+" : ""}{movement.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function getSevenDayMovements(
  assets: MarketAsset[],
  histories: Record<string, PlayerSnapshotObservation[]>,
) {
  return assets
    .filter((asset) => asset.kind === "player")
    .map((asset): Movement | null => {
      const observations = histories[asset.slug] ?? [];
      const latest = observations.at(-1);
      if (!latest) return null;
      const latestAt = Date.parse(latest.observedAt);
      const targetAt = latestAt - 7 * DAY_MS;
      const eligible = observations.filter(
        (observation) => Date.parse(observation.observedAt) <= latestAt - 6 * DAY_MS,
      );
      if (!eligible.length) return null;
      const baseline = eligible.reduce((closest, observation) =>
        Math.abs(Date.parse(observation.observedAt) - targetAt) <
        Math.abs(Date.parse(closest.observedAt) - targetAt)
          ? observation
          : closest,
      );
      if (!baseline.value) return null;
      const change = latest.value - baseline.value;
      return {
        asset,
        baseline,
        latest,
        change,
        percent: (change / baseline.value) * 100,
      };
    })
    .filter((movement): movement is Movement => Boolean(movement))
    .sort((left, right) => right.change - left.change);
}

function formatValue(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Current release";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
}
