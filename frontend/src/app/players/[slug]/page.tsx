import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "../../components/JsonLd";
import PlayerHistoryChart from "../../components/PlayerHistoryChart";
import {
  getPlayerMarketContexts,
  getPlayerProfile,
} from "../../lib/market";
import {
  getPlayerPage,
  playerPageSlugs,
} from "../../lib/player-pages";
import {
  calculateMovement,
  formatMetric,
  getProductionCards,
  getUsageCards,
  selectPublishedHistory,
} from "../../lib/player-insights";
import type { MarketAsset } from "../../types/MarketAsset";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return playerPageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPlayerPage(slug);
  if (!page) return {};

  const { data: player } = await getPlayerProfile(slug);
  const description = `${player.name} dynasty value, Superflex and 1QB rank, recorded market observations, production profile, comparable players, and rookie-pick equivalents.`;

  return {
    title: `${player.name} Dynasty Value, Rank & History`,
    description,
    alternates: { canonical: `/players/${slug}` },
    openGraph: {
      type: "profile",
      url: `/players/${slug}`,
      title: `${player.name} dynasty trade value`,
      description,
      images: [
        {
          url: page.image.src,
          width: page.image.width,
          height: page.image.height,
          alt: page.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${player.name} dynasty trade value`,
      description,
      images: [page.image.src],
    },
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPlayerPage(slug);
  if (!page) notFound();

  const [profilePayload, contexts] = await Promise.all([
    getPlayerProfile(slug),
    getPlayerMarketContexts(slug),
  ]);
  const { data: profile, meta, snapshotHistory } = profilePayload;
  const player = contexts.superflex ?? profile;
  const historySeries = selectPublishedHistory(profile.history, snapshotHistory);
  const movement30 = historySeries.chartable
    ? calculateMovement(historySeries.points, 30)
    : null;
  const movement90 = historySeries.chartable
    ? calculateMovement(historySeries.points, 90)
    : null;
  const pickEquivalents = [...contexts.picks]
    .sort(
      (a, b) =>
        Math.abs(a.value - player.value) - Math.abs(b.value - player.value),
    )
    .slice(0, 3);
  const production = getProductionCards(profile);
  const usage = getUsageCards(profile);
  const updated = new Date(meta.generatedAt);
  const schema = buildSchema(profile, page.image, meta.generatedAt);

  return (
    <>
      <JsonLd data={schema} />

      <nav className="page-wrap pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#171c19]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/players" className="hover:text-[#171c19]">Players</Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{profile.name}</span>
      </nav>

      <section className="page-wrap grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="border border-[#171c19] bg-[#dfff4f] p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow bg-white">Player market file // research</span>
            <span className="mono-label border border-[#171c19] px-3 py-2">
              {profile.team || "NFL"} · {profile.position}
            </span>
          </div>
          <h1 className="mt-8 text-[clamp(3rem,7vw,6.6rem)] font-black leading-[0.88] tracking-[-0.075em]">
            What is {profile.name} worth in dynasty?
          </h1>
          <p className="mt-8 max-w-3xl border-l-4 border-[#171c19] pl-5 text-lg font-bold leading-8 sm:text-xl">
            {profile.name} is worth <strong>{Math.round(player.value)}</strong> on the current dynasty Superflex market scale, ranking <strong>No. {player.rank ?? "—"} overall</strong> and <strong>{profile.position}{player.posRank ?? "—"}</strong> at the position.
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#3e453f]">
            {page.editorialLens} This is a transparent market reference—not a projection or an instruction to accept a trade without considering your roster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${profile.slug}`}
              className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#ff6b3d]"
            >
              Build an offer for {firstName(profile.name)} →
            </Link>
            <Link
              href="#history"
              className="border border-[#171c19] bg-white/70 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em]"
            >
              See market record ↓
            </Link>
          </div>
        </div>

        <figure className="relative min-h-[500px] overflow-hidden border border-[#171c19] bg-[#171c19]">
          <Image
            src={page.image.src}
            width={page.image.width}
            height={page.image.height}
            alt={page.image.alt}
            className="h-full min-h-[500px] w-full object-cover object-top grayscale-[15%]"
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 1023px) 100vw, 40vw"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-[#171c19]/92 px-4 py-3 font-mono text-[9px] uppercase leading-4 tracking-[0.05em] text-white/70">
            Photo: {page.image.author} ·{" "}
            <a href={page.image.licenseUrl} target="_blank" rel="license noopener" className="text-[#dfff4f] underline">
              {page.image.license}
            </a>{" "}
            ·{" "}
            <a href={page.image.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#dfff4f] underline">
              Wikimedia Commons
            </a>
          </figcaption>
        </figure>
      </section>

      <section className="page-wrap py-8" aria-labelledby="market-context-title">
        <div className="mb-7 grid gap-4 border-t border-[#171c19] pt-6 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <span className="eyebrow">Current price // four formats</span>
            <h2 id="market-context-title" className="section-title mt-5">One player. Different markets.</h2>
          </div>
          <p className="text-sm leading-7 text-[#69706c]">
            League format changes scarcity. These values come from the same daily composite feed so the comparisons stay on one scale.
          </p>
        </div>
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard label="Dynasty Superflex" asset={contexts.superflex} accent="bg-[#dfff4f]" />
          <ValueCard label="Dynasty 1QB" asset={contexts.oneQb} accent="bg-[#8bcfff]" />
          <ValueCard label="Superflex TEP" asset={contexts.tePremium} accent="bg-[#d7b6ff]" />
          <ValueCard label="Redraft 1QB" asset={contexts.redraft} accent="bg-[#ffb29a]" />
        </div>
      </section>

      <section id="history" className="page-wrap scroll-mt-8 py-16">
        <div className="paper-card p-5 sm:p-8">
          <div className="grid gap-5 border-b border-[#171c19] pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="mono-label text-[#69706c]">Recorded market observations</span>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                {profile.name} market value record
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <MovementCard movement={movement30} />
              <MovementCard movement={movement90} />
            </div>
          </div>
          <div className="pt-8">
            <PlayerHistoryChart series={historySeries} name={profile.name} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-[#c9c5ba] pt-5">
            <a href={`/players/${profile.slug}/history.csv`} download className="border border-[#171c19] bg-[#dfff4f] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">
              Download history CSV ↓
            </a>
            <a href={`/players/${profile.slug}/data.json`} download className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">
              Download player JSON ↓
            </a>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-8 lg:grid-cols-2">
        <MetricPanel
          eyebrow={`Production // ${profile.stats?.season ?? "latest season"}`}
          title="What happened on the field."
          cards={production}
          footer="Season and consistency figures are descriptive historical results. They are not forward projections."
        />
        <MetricPanel
          eyebrow={`Usage // ${profile.advanced?.season ?? "latest season"}`}
          title="How the role created it."
          cards={usage}
          footer="Advanced usage is sourced from nflverse through the attributed Tradyr profile feed. Missing metrics remain visibly unavailable."
        />
      </section>

      <section className="page-wrap grid gap-8 py-16 lg:grid-cols-2">
        <div className="border border-[#171c19] bg-[#171c19] p-6 text-white sm:p-8">
          <span className="mono-label text-[#dfff4f]">Comparable market tier</span>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Players priced nearby.</h2>
          <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
            {profile.similar.slice(0, 6).map((similar) => {
              const linked = getPlayerPage(similar.slug);
              const content = (
                <>
                  <span><strong>{similar.name}</strong><span className="ml-2 font-mono text-[10px] text-white/45">{similar.position} · #{similar.rank ?? "—"}</span></span>
                  <span className="font-mono font-black text-[#dfff4f]">{Math.round(similar.value)}</span>
                </>
              );
              return linked ? (
                <Link key={similar.slug} href={`/players/${similar.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-[#dfff4f]">{content}</Link>
              ) : (
                <div key={similar.slug} className="flex items-center justify-between gap-4 py-4">{content}</div>
              );
            })}
          </div>
        </div>

        <div className="border border-[#171c19] bg-[#8bcfff] p-6 sm:p-8">
          <span className="mono-label">Closest rookie-pick equivalents</span>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Draft capital on the same scale.</h2>
          <div className="mt-7 divide-y divide-[#171c19]/25 border-y border-[#171c19]/25">
            {pickEquivalents.map((pick) => (
              <div key={pick.id} className="flex items-center justify-between gap-4 py-4">
                <span><strong>{pick.name}</strong><span className="ml-2 font-mono text-[10px] text-[#4c5650]">{pick.tier ?? "exact pick"}</span></span>
                <span className="font-mono font-black">{Math.round(pick.value)}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-[#4b5450]">
            These are the nearest individual picks by value, not a claim that another manager will accept a one-for-one offer.
          </p>
        </div>
      </section>

      <section className="page-wrap py-16 text-center">
        <span className="mono-label text-[#69706c]">Next decision</span>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-6xl">Price the complete package.</h2>
        <Link
          href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${profile.slug}`}
          className="mt-7 inline-block border border-[#171c19] bg-[#dfff4f] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.08em] shadow-[5px_5px_0_#171c19]"
        >
          Trade for {profile.name} →
        </Link>
      </section>

      <aside className="page-wrap border-t border-[#9d9a91] pt-5 text-[11px] leading-6 text-[#69706c]">
        <p className="max-w-5xl">
          <strong className="text-[#171c19]">Data note:</strong>{" "}
          Market and profile data updated {Number.isNaN(updated.getTime()) ? "daily" : updated.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })} ET and powered by{" "}
          <a href={profile.profileUrl || "https://tradyr.app"} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Tradyr {meta.version}</a>. Fantasy Trade Target applies its own published{" "}
          <Link href="/methodology" className="underline underline-offset-2">calculator methodology</Link> in release <span className="font-mono">{meta.releaseId}</span>. Accepted-trade distributions and league-specific lineup evidence are not yet included.
        </p>
      </aside>
    </>
  );
}

function ValueCard({
  label,
  asset,
  accent,
}: {
  label: string;
  asset?: MarketAsset;
  accent: string;
}) {
  return (
    <article className={`${accent} p-5 sm:p-6`}>
      <span className="mono-label">{label}</span>
      <p className="mt-8 font-mono text-5xl font-black tabular-nums">
        {asset ? Math.round(asset.value) : "—"}
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.04em] text-[#4c544f]">
        {asset ? `#${asset.rank ?? "—"} overall · ${asset.position}${asset.posRank ?? "—"}` : "Not currently ranked"}
      </p>
    </article>
  );
}

function MovementCard({ movement }: { movement: ReturnType<typeof calculateMovement> }) {
  if (!movement) return null;
  const positive = movement.valueChange >= 0;
  return (
    <div className="min-w-32 border border-[#171c19] bg-white/55 px-4 py-3">
      <span className="mono-label text-[#69706c]">{movement.label} move</span>
      <p className={`mt-1 font-mono text-xl font-black ${positive ? "text-[#2f6f3e]" : "text-[#a23616]"}`}>
        {positive ? "+" : ""}{movement.percentChange.toFixed(1)}%
      </p>
      <p className="mt-1 text-[10px] text-[#69706c]">nearest {movement.observedDays}-day observation</p>
    </div>
  );
}

function MetricPanel({
  eyebrow,
  title,
  cards,
  footer,
}: {
  eyebrow: string;
  title: string;
  cards: Array<{ label: string; value: unknown }>;
  footer: string;
}) {
  return (
    <article className="paper-card p-5 sm:p-8">
      <span className="mono-label text-[#69706c]">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">{title}</h2>
      <dl className="mt-7 grid grid-cols-2 gap-px border border-[#171c19] bg-[#171c19]">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#f3f0e7] p-4">
            <dt className="mono-label text-[#69706c]">{card.label}</dt>
            <dd className="mt-2 text-2xl font-black">{formatMetric(card.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-xs leading-5 text-[#69706c]">{footer}</p>
    </article>
  );
}

function firstName(name: string) {
  return name.split(" ")[0];
}

function buildSchema(
  player: Awaited<ReturnType<typeof getPlayerProfile>>["data"],
  image: { src: string; width: number; height: number; alt: string },
  dateModified: string,
) {
  const url = `https://www.fantasytradetarget.com/players/${player.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: `${player.name} dynasty trade value`,
        dateModified,
        about: {
          "@type": "Person",
          "@id": `${url}#player`,
          name: player.name,
          image: image.src,
          jobTitle: `${player.position} football player`,
          affiliation: player.team
            ? { "@type": "SportsTeam", name: player.team }
            : undefined,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: image.src,
          width: image.width,
          height: image.height,
          caption: image.alt,
        },
        publisher: {
          "@id": "https://www.fantasytradetarget.com/#organization",
        },
        mainEntity: {
          "@id": `${url}#dataset`,
        },
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://www.fantasytradetarget.com/#website",
          name: "Fantasy Trade Target",
        },
      },
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: `${player.name} fantasy football market history`,
        description: `Current dynasty and redraft market context plus recorded value observations for ${player.name}.`,
        url,
        dateModified,
        creator: {
          "@id": "https://www.fantasytradetarget.com/#organization",
        },
        about: {
          "@id": `${url}#player`,
        },
        variableMeasured: [
          "market value",
          "overall rank",
          "position rank",
          "observation date",
        ],
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: `${url}/history.csv`,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${url}/data.json`,
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.fantasytradetarget.com/" },
          { "@type": "ListItem", position: 2, name: "Players", item: "https://www.fantasytradetarget.com/players" },
          { "@type": "ListItem", position: 3, name: player.name, item: url },
        ],
      },
    ],
  };
}
