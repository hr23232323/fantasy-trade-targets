import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPageView from "../../components/AnalyticsPageView";
import JsonLd from "../../components/JsonLd";
import PlayerHistoryChart from "../../components/PlayerHistoryChart";
import { TrackedLink } from "../../components/TrackedLink";
import {
  getRelatedRookiePicks,
  getRookiePickPage,
  getRookiePickResearch,
  rookiePickSlugs,
  type RookiePickObservation,
} from "../../lib/rookie-picks";
import type { MarketAsset } from "../../types/MarketAsset";

const SITE_URL = "https://fantasytradetarget.com";

export const dynamicParams = false;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return rookiePickSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getRookiePickPage(slug);
  if (!page) return {};
  const label = pickLabel(page.id);
  const title = `${label} Dynasty Value: 1QB & Superflex`;
  const description = `What is the ${label} worth? Compare current 1QB and Superflex values, league-size prices, player equivalents, adjacent picks, market history, and downloadable data.`;
  return {
    title,
    description,
    alternates: { canonical: `/rookie-pick-values/${slug}` },
    openGraph: {
      type: "article",
      url: `/rookie-pick-values/${slug}`,
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function RookiePickValuePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getRookiePickPage(slug);
  if (!page) notFound();
  const research = await getRookiePickResearch(page);
  const label = pickLabel(page.id);
  const valueGap = research.oneQbPick.value - research.superflexPick.value;
  const formatLeader = valueGap === 0 ? "the same" : valueGap > 0 ? "higher in 1QB" : "higher in Superflex";
  const superflexMovement = movement(research.history, "superflexValue");
  const oneQbMovement = movement(research.history, "oneQbValue");
  const related = getRelatedRookiePicks(page);
  const updated = new Date(research.generatedAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
  const shortAnswer = `In a 12-team dynasty league, the ${label} is worth ${research.superflexPick.value} in Superflex and ${research.oneQbPick.value} in 1QB on the current Fantasy Trade Target market scale. It ranks No. ${research.superflexMarketRank} among all Superflex players and picks, and No. ${research.oneQbMarketRank} in 1QB.`;
  const faq = [
    {
      question: `What is the ${label} worth in dynasty?`,
      answer: shortAnswer,
    },
    {
      question: `Which players are worth about the ${label}?`,
      answer: `Among FTT's reviewed player files, the closest current Superflex equivalents are ${listNames(research.superflexPlayerEquivalents)}. In 1QB, the closest are ${listNames(research.oneQbPlayerEquivalents)}. These are value neighbors, not forecasts of who will be selected.`,
    },
    {
      question: `Does league size change the ${label} value?`,
      answer: `Yes. Exact pick slots and their scarcity are loaded separately for 8-, 10-, 12-, 14-, and 16-team leagues. A slot is marked unavailable when that numbered pick cannot exist in the selected league's round.`,
    },
    {
      question: `Why can the ${label} have different 1QB and Superflex values?`,
      answer: `Superflex makes quarterbacks scarcer and changes how managers price rookie optionality. FTT loads a separate observed pick market for each quarterback format; it does not apply a generic multiplier. The current 12-team difference is ${Math.abs(valueGap)} points, ${formatLeader}.`,
    },
    {
      question: `Is the ${label} value a rookie projection?`,
      answer: `No. It is a dated market price for the draft slot before the future player is known. It does not predict a prospect, landing spot, injury, or future class strength beyond what the current market already prices.`,
    },
  ];
  const pageUrl = `${SITE_URL}/rookie-pick-values/${page.slug}`;

  return (
    <>
      <AnalyticsPageView
        eventName="rookie_pick_research_viewed"
        properties={{
          pick_id: page.id,
          pick_slug: page.slug,
          one_qb_value: research.oneQbPick.value,
          superflex_value: research.superflexPick.value,
          one_qb_rank: research.oneQbMarketRank,
          superflex_rank: research.superflexMarketRank,
          history_observations: research.history.length,
          release_id: research.releaseId,
        }}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${pageUrl}#page`,
            url: pageUrl,
            name: `${label} dynasty rookie pick value`,
            description: shortAnswer,
            dateModified: research.generatedAt,
            publisher: { "@id": `${SITE_URL}/#organization` },
            isPartOf: {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/rookie-pick-values#collection`,
              name: "Dynasty rookie pick values",
            },
            mainEntity: { "@id": `${pageUrl}#dataset` },
          },
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            "@id": `${pageUrl}#dataset`,
            name: `${label} dynasty market values and history`,
            description: `Current values for the ${label} by quarterback format and league size, adjacent-pick prices, player equivalents, and timestamped 12-team history.`,
            url: pageUrl,
            dateModified: research.generatedAt,
            creator: { "@id": `${SITE_URL}/#organization` },
            license: `${SITE_URL}/terms-of-service`,
            temporalCoverage: `${research.history[0]?.observedAt ?? research.generatedAt}/${research.generatedAt}`,
            variableMeasured: [
              "1QB composite market value",
              "Superflex composite market value",
              "league size",
              "release timestamp",
            ],
            distribution: [
              {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: `${pageUrl}/data.json`,
              },
              {
                "@type": "DataDownload",
                encodingFormat: "text/csv",
                contentUrl: `${pageUrl}/history.csv`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Rookie pick values", item: `${SITE_URL}/rookie-pick-values` },
              { "@type": "ListItem", position: 3, name: label, item: pageUrl },
            ],
          },
        ]}
      />

      <nav className="page-wrap pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#69706c]" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="mx-2">/</span>
        <Link href="/rookie-pick-values">Rookie pick values</Link><span className="mx-2">/</span>
        <span aria-current="page">{label}</span>
      </nav>

      <section className="page-wrap py-10">
        <div className="border border-[#171c19] bg-[#dfff4f] p-6 shadow-[8px_8px_0_#171c19] sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow bg-white">Exact pick file // 2027 rookie draft</span>
            <span className="mono-label border border-[#171c19] px-3 py-2">Release {research.releaseId}</span>
          </div>
          <h1 className="mt-8 max-w-6xl text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.86] tracking-[-0.075em]">
            What is the {label} worth in dynasty?
          </h1>
          <div className="mt-8 max-w-4xl border-l-4 border-[#171c19] pl-5">
            <span className="mono-label">The short answer</span>
            <p className="mt-3 text-lg font-bold leading-8 sm:text-xl">{shortAnswer}</p>
          </div>
          <p className="mt-7 max-w-3xl text-sm leading-7 text-[#414842]">
            This page prices one exact draft slot. It separates quarterback format and league size, compares the pick with known player assets and nearby picks, and preserves every validated observation. It does not attach a future prospect to the slot.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href={`/dynasty-trade-calculator?format=dynasty&qbs=2&get=${page.id}`}
              analyticsEvent="rookie_pick_calculator_opened"
              analyticsProperties={{ pick_id: page.id, source: "rookie_pick_hero", format: "superflex" }}
              className="border border-[#171c19] bg-[#171c19] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#ff6b3d]"
            >
              Build a Superflex offer →
            </TrackedLink>
            <Link href="#league-size" className="border border-[#171c19] bg-white/70 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.08em]">
              Match my league ↓
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap py-10" aria-labelledby="format-values-title">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">12-team baseline // two markets</span>
          <h2 id="format-values-title" className="section-title mt-5">The format changes the price.</h2>
          <p className="mt-5 text-sm leading-7 text-[#69706c]">
            <abbr title="One starting quarterback slot per team" className="cursor-help underline decoration-dotted">1QB</abbr> and <abbr title="A second flex slot that can start a quarterback, creating much greater QB scarcity" className="cursor-help underline decoration-dotted">Superflex</abbr> use separate observed markets. Picks do not receive a blanket format multiplier.
          </p>
        </div>
        <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-2">
          <FormatCard label="Dynasty Superflex" value={research.superflexPick.value} rank={research.superflexMarketRank} movement={superflexMovement} accent="bg-[#dfff4f]" />
          <FormatCard label="Dynasty 1QB" value={research.oneQbPick.value} rank={research.oneQbMarketRank} movement={oneQbMovement} accent="bg-[#8bcfff]" />
        </div>
      </section>

      <section id="league-size" className="page-wrap scroll-mt-8 py-10" aria-labelledby="league-size-title">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">League-size matrix // exact slot availability</span>
          <h2 id="league-size-title" className="section-title mt-5">Eight teams is not sixteen teams.</h2>
          <p className="mt-5 text-sm leading-7 text-[#69706c]">A larger league puts more managers between repeat selections and changes pick scarcity. “Does not exist” means the numbered slot falls beyond that league&apos;s round boundary—for example, pick 1.09 cannot exist in an eight-team first round.</p>
        </div>
        <div className="mt-8 overflow-x-auto border border-[#171c19] bg-white/45">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-[#171c19] bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.07em] text-white">
              <tr><th className="p-4">League</th><th className="p-4 text-right">1QB value</th><th className="p-4 text-right">Superflex value</th><th className="p-4">Availability</th></tr>
            </thead>
            <tbody className="divide-y divide-[#c8c4b9]">
              {research.leagueSizes.map((row) => (
                <tr key={row.numTeams} className={row.numTeams === 12 ? "bg-[#dfff4f]/50" : ""}>
                  <td className="p-4 font-black">{row.numTeams} teams {row.numTeams === 12 && <span className="font-mono text-[9px] uppercase">// baseline</span>}</td>
                  <td className="p-4 text-right font-mono font-black">{row.oneQb?.value ?? "—"}</td>
                  <td className="p-4 text-right font-mono font-black">{row.superflex?.value ?? "—"}</td>
                  <td className="p-4 text-[#69706c]">{row.oneQb && row.superflex ? "Exact slot available" : "Does not exist in this round"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="page-wrap py-10" aria-labelledby="player-equivalents-title">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">Known-player equivalents // same release</span>
          <h2 id="player-equivalents-title" className="section-title mt-5">What current players live near this pick?</h2>
          <p className="mt-5 text-sm leading-7 text-[#69706c]">These are the closest reviewed player values on the same market scale. A pick holds optionality but no known NFL player; the comparison is a pricing anchor, not a claim that the outcomes are equally risky.</p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <EquivalentList title="Superflex neighbors" pickValue={research.superflexPick.value} players={research.superflexPlayerEquivalents} accent="bg-[#dfff4f]" />
          <EquivalentList title="1QB neighbors" pickValue={research.oneQbPick.value} players={research.oneQbPlayerEquivalents} accent="bg-[#8bcfff]" />
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-10 lg:grid-cols-2">
        <div className="border border-[#171c19] bg-white/45 p-6 sm:p-8">
          <span className="eyebrow">Trade-up / trade-down math</span>
          <h2 className="mt-6 text-3xl font-black tracking-[-0.05em]">The adjacent-pick gap.</h2>
          <p className="mt-4 text-sm leading-7 text-[#69706c]">Subtracting the neighboring slot exposes the current marginal price of moving one exact selection. It is a reference point—not a required add.</p>
          <div className="mt-6 space-y-3">
            {research.adjacent.map((adjacent) => (
              <Link key={adjacent.id} href={`/rookie-pick-values/${adjacent.slug}`} className="grid grid-cols-[1fr_auto_auto] gap-4 border border-[#171c19] bg-[#f3f0e7] p-4 hover:bg-white">
                <strong>{pickLabel(adjacent.id)}</strong>
                <span className="font-mono text-xs font-black">SF {signed(adjacent.superflex.value - research.superflexPick.value)}</span>
                <span className="font-mono text-xs font-black">1QB {signed(adjacent.oneQb.value - research.oneQbPick.value)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="border border-[#171c19] bg-[#ffb29a] p-6 sm:p-8">
          <span className="eyebrow bg-white">Cross-year equivalents</span>
          <h2 className="mt-6 text-3xl font-black tracking-[-0.05em]">Which other class pick is priced closest?</h2>
          <p className="mt-4 text-sm leading-7 text-[#414842]">For each adjacent draft class, this finds the exact 12-team slot with the smallest current value difference. It compares prices, not class talent.</p>
          <div className="mt-6 space-y-3">
            {research.crossYear.map((row) => (
              <div key={row.year} className="border border-[#171c19] bg-white/75 p-4">
                <strong className="block text-lg">{row.year} class</strong>
                <p className="mt-2 text-sm"><span className="font-mono font-black">SF</span> {row.superflex?.name ?? "Unavailable"} ({row.superflex?.value ?? "—"})</p>
                <p className="mt-1 text-sm"><span className="font-mono font-black">1QB</span> {row.oneQb?.name ?? "Unavailable"} ({row.oneQb?.value ?? "—"})</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap py-10" aria-labelledby="history-title">
        <div className="max-w-4xl border-t border-[#171c19] pt-6">
          <span className="eyebrow">Observed market history // {research.history.length} releases</span>
          <h2 id="history-title" className="section-title mt-5">A record, not a projection.</h2>
          <p className="mt-5 text-sm leading-7 text-[#69706c]">Every point is a successful, timestamped FTT market capture. The two series remain separate because format demand is separate.</p>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <HistoryPanel title="Superflex history" chartId={`${page.slug}-superflex`} observations={research.history} valueKey="superflexValue" />
          <HistoryPanel title="1QB history" chartId={`${page.slug}-one-qb`} observations={research.history} valueKey="oneQbValue" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackedLink href={`/rookie-pick-values/${page.slug}/data.json`} analyticsEvent="rookie_pick_data_downloaded" analyticsProperties={{ pick_id: page.id, format: "json" }} className="border border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em] text-white">Download full JSON ↓</TrackedLink>
          <TrackedLink href={`/rookie-pick-values/${page.slug}/history.csv`} analyticsEvent="rookie_pick_data_downloaded" analyticsProperties={{ pick_id: page.id, format: "csv" }} className="border border-[#171c19] bg-white px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">Download history CSV ↓</TrackedLink>
          <Link href="/methodology#rookie-pick-values" className="border border-[#171c19] bg-[#dfff4f] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">Inspect pick methodology →</Link>
        </div>
      </section>

      <section className="page-wrap py-10" aria-labelledby="faq-title">
        <span className="eyebrow">Rookie pick value FAQ // direct answers</span>
        <h2 id="faq-title" className="section-title mt-5">{label} FAQ</h2>
        <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
          {faq.map(({ question, answer }) => <article key={question} className="bg-[#f3f0e7] p-6"><h3 className="text-lg font-black">{question}</h3><p className="mt-3 text-sm leading-7 text-[#59605c]">{answer}</p></article>)}
        </div>
      </section>

      <section className="page-wrap py-10">
        <div className="border-t border-[#171c19] pt-6">
          <span className="eyebrow">Keep comparing</span>
          <h2 className="section-title mt-5">Nearby exact pick files.</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((candidate) => <Link key={candidate.id} href={`/rookie-pick-values/${candidate.slug}`} className="border border-[#171c19] bg-white/50 p-5 font-black hover:bg-[#dfff4f]">{pickLabel(candidate.id)} →</Link>)}
          </div>
          <p className="mt-7 text-xs leading-6 text-[#69706c]">Updated {updated}. Powered by Tradyr market data. Values describe the current composite market and do not guarantee an accepted trade or future outcome.</p>
        </div>
      </section>
    </>
  );
}

function FormatCard({ label, value, rank, movement: delta, accent }: { label: string; value: number; rank: number; movement: number; accent: string }) {
  return <article className={`${accent} p-6 sm:p-8`}><span className="mono-label">{label}</span><strong className="mt-7 block text-6xl font-black tracking-[-0.07em]">{value}</strong><p className="mt-3 text-sm font-bold">No. {rank} among all current players and picks</p><p className="mt-3 font-mono text-[10px] font-black uppercase">Since first FTT capture: {signed(delta)}</p></article>;
}

function EquivalentList({ title, pickValue, players, accent }: { title: string; pickValue: number; players: MarketAsset[]; accent: string }) {
  return <div className="border border-[#171c19]"><h3 className={`${accent} border-b border-[#171c19] p-5 text-2xl font-black`}>{title}</h3><div className="divide-y divide-[#c8c4b9]">{players.map((player) => <Link key={player.id} href={`/players/${player.slug}`} className="grid grid-cols-[1fr_auto] gap-4 bg-white/40 p-4 hover:bg-white"><span><strong>{player.name}</strong><span className="ml-2 font-mono text-[10px] font-black text-[#69706c]">{player.position}{player.posRank ?? ""}</span></span><span className="font-mono text-sm font-black">{player.value} <small className="text-[#69706c]">({signed(player.value - pickValue)})</small></span></Link>)}</div></div>;
}

function HistoryPanel({ title, chartId, observations, valueKey }: { title: string; chartId: string; observations: RookiePickObservation[]; valueKey: "oneQbValue" | "superflexValue" }) {
  const points = observations.map((observation) => ({ date: observation.observedAt, value: observation[valueKey] }));
  const first = Date.parse(points[0]?.date ?? "");
  const last = Date.parse(points.at(-1)?.date ?? "");
  return <div className="border border-[#171c19] bg-white/45 p-5 sm:p-7"><h3 className="mb-6 text-2xl font-black">{title}</h3><PlayerHistoryChart id={chartId} name={title} series={{ points, source: "ftt", sourceLabel: "Fantasy Trade Target snapshots", chartable: points.length >= 2 && last - first >= 86_400_000 }} /></div>;
}

function movement(observations: RookiePickObservation[], key: "oneQbValue" | "superflexValue") {
  return observations.length > 1 ? observations.at(-1)![key] - observations[0][key] : 0;
}

function pickLabel(id: string) {
  const match = id.match(/^pick_(\d{4})_(\d)_(\d{2})$/);
  return match ? `${match[1]} Pick ${match[2]}.${match[3]}` : id;
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function listNames(players: MarketAsset[]) {
  return players.map((player) => player.name).join(", ");
}
