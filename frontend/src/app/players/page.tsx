import Image from "next/image";
import Link from "next/link";
import JsonLd from "../components/JsonLd";
import { getMarket } from "../lib/market";
import { buildPageMetadata } from "../lib/metadata";
import { playerPages } from "../lib/player-pages";

export const metadata = buildPageMetadata({
  title: "Dynasty Player Values, History & Trade Research",
  description:
    "Research dynasty values, ranks, historical charts, production, usage, comparable players, and rookie-pick equivalents.",
  path: "/players",
});

export default async function PlayersPage() {
  const market = await getMarket({ format: "dynasty", numQbs: 2 });
  const players = playerPages
    .map((page) => ({
      page,
      market: market.assets.find((asset) => asset.slug === page.slug),
    }))
    .filter((entry) => entry.market);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Fantasy Trade Target player research",
          url: "https://www.fantasytradetarget.com/players",
          description:
            "Dynasty player values, market history, production, usage, comparable players, and rookie-pick equivalents.",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: players.map(({ page }, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: page.name,
              url: `https://www.fantasytradetarget.com/players/${page.slug}`,
            })),
          },
        }}
      />
      <section className="page-wrap py-14 sm:py-20">
        <span className="eyebrow">Player research // market files</span>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <h1 className="display-type max-w-5xl uppercase">
            The player. <span className="text-[#ff6b3d]">The price. The evidence.</span>
          </h1>
          <div className="border-l border-[#171c19] pl-5">
            <p className="text-base font-medium leading-7 text-[#515854]">
              Substantial dynasty player files built for trade research, historical context, and direct answers grounded in visible market evidence.
            </p>
            <p className="mt-4 font-mono text-[10px] font-bold uppercase leading-5 tracking-[0.07em] text-[#69706c]">
              Daily composite market · Updated {formatDate(market.meta.generatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="page-wrap grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {players.map(({ page, market: player }, index) => (
          <Link
            key={page.slug}
            href={`/players/${page.slug}`}
            className={`group overflow-hidden border border-[#171c19] shadow-[5px_5px_0_#171c19] ${index === 0 ? "md:col-span-2" : ""}`}
          >
            <div className={`grid h-full ${index === 0 ? "sm:grid-cols-2" : ""}`}>
              <div className="relative min-h-80 overflow-hidden bg-[#171c19]">
                <Image
                  src={page.image.src}
                  width={page.image.width}
                  height={page.image.height}
                  alt={page.image.alt}
                  loading={index < 2 ? "eager" : "lazy"}
                  fetchPriority={index < 2 ? "high" : "auto"}
                  sizes={index === 0 ? "(max-width: 767px) 100vw, 50vw" : "(max-width: 767px) 100vw, 33vw"}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 bg-[#dfff4f] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.07em]">
                  {player!.position}{player!.posRank ?? "—"} · #{player!.rank ?? "—"}
                </span>
              </div>
              <div className="flex min-h-72 flex-col bg-[#f3f0e7] p-6">
                <span className="mono-label text-[#69706c]">Dynasty Superflex value</span>
                <p className="mt-2 font-mono text-5xl font-black text-[#ff6b3d]">{Math.round(player!.value)}</p>
                <h2 className="mt-8 text-3xl font-black tracking-[-0.05em]">{player!.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#69706c]">{page.editorialLens}</p>
                <span className="mt-auto pt-7 font-mono text-[11px] font-black uppercase tracking-[0.07em] group-hover:text-[#a23616]">
                  Open player file →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="page-wrap py-20">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
          <article className="bg-[#dfff4f] p-7">
            <span className="mono-label">Visible answer</span>
            <h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">Worth, rank, and format context appear immediately.</h2>
          </article>
          <article className="bg-[#8bcfff] p-7">
            <span className="mono-label">Historical evidence</span>
            <h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">Recorded values show how the market reached today’s price.</h2>
          </article>
          <article className="bg-[#ffb29a] p-7">
            <span className="mono-label">Honest boundary</span>
            <h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">Missing accepted-trade and league evidence stays labeled missing.</h2>
          </article>
        </div>
        <p className="mt-6 text-[11px] leading-5 text-[#69706c]">
          Market values updated daily and powered by <a href="https://tradyr.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Tradyr</a>. Player-page analysis and presentation are by Fantasy Trade Target Research.
        </p>
      </section>
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "daily";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
