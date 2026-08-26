import Link from "next/link";
import AnalyticsPageView from "./AnalyticsPageView";
import PlayerPortrait from "./PlayerPortrait";
import TeamLogo from "./TeamLogo";
import { TrackedLink } from "./TrackedLink";
import {
  getScoringImpact,
  impactSettingsParams,
  impactWhy,
  receptionLabel,
  type ImpactSettings,
  type ScoringImpactRow,
} from "../lib/scoring-impact";
import { getPlayerPage } from "../lib/player-pages";

export type ScoringResearchConfig = {
  slug: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  intro: string;
  settings: ImpactSettings;
  eligiblePositions: ScoringImpactRow["position"][];
  definitions: Array<[string, string]>;
  faqs: Array<[string, string]>;
};

export default async function ScoringResearchPage({
  config,
}: {
  config: ScoringResearchConfig;
}) {
  const impact = await getScoringImpact(config.settings);
  const eligible = (row: ScoringImpactRow) =>
    config.eligiblePositions.includes(row.position);
  const rankings = impact.rankings.filter(eligible).slice(0, 24);
  const risers = impact.risers
    .filter((row) => eligible(row) && row.valueDelta > 0)
    .slice(0, 10);
  const fallers = impact.fallers
    .filter((row) => eligible(row) && row.valueDelta < 0)
    .slice(0, 10);
  const query = impactSettingsParams(config.settings);
  const analyticsProperties = {
    scoring_page: config.slug,
    calculator_format: config.settings.format,
    num_qbs: config.settings.numQbs,
    passing_td_points: config.settings.passingTdPoints,
    reception_points: config.settings.receptionPoints,
    flex_spots: config.settings.flexSpots,
    modeled_player_count: rankings.length,
    release_id: impact.market.meta.releaseId,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: config.title,
    description: config.description,
    url: `https://fantasytradetarget.com/scoring/${config.slug}`,
    dateModified: impact.market.meta.generatedAt,
    creator: {
      "@type": "Organization",
      name: "Fantasy Trade Target",
      url: "https://fantasytradetarget.com",
    },
    isBasedOn: "https://api.tradyr.app/docs",
    measurementTechnique: "Replacement-relative scoring model 2026.08.3",
  };

  return (
    <>
      <AnalyticsPageView
        eventName="scoring_research_viewed"
        properties={analyticsProperties}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <span className="mono-label text-[#dfff4f]">{config.eyebrow}</span>
            <h1 className="mt-6 max-w-6xl text-[clamp(3.1rem,7vw,6.8rem)] font-black leading-[0.86] tracking-[-0.08em]">
              {config.title} <span className="text-[#8bcfff]">{config.accent}</span>
            </h1>
            <p className="mt-8 max-w-4xl text-base leading-8 text-white/65">
              {config.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                href={`/scoring-impact?${query}`}
                analyticsEvent="scoring_research_lab_opened"
                analyticsProperties={analyticsProperties}
                className="border border-white bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] shadow-[4px_4px_0_#8bcfff] hover:bg-white"
              >
                Open this comparison →
              </TrackedLink>
              <Link href="/methodology#league-scoring" className="border border-white/35 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] hover:bg-white hover:text-[#171c19]">Audit the methodology</Link>
            </div>
          </div>
          <aside className="border border-white/30 bg-white/5 p-3 shadow-[8px_8px_0_#8bcfff]" aria-label="Current scoring leaders">
            <div className="flex items-center justify-between border-b border-white/25 px-2 pb-3">
              <span className="mono-label text-white/65">Live value board</span>
              <span className="mono-label text-[#dfff4f]">Top 3</span>
            </div>
            <div className="mt-3 grid gap-3">
              {rankings.slice(0, 3).map((row, index) => (
                <ResearchPlayerSpotlight key={row.slug} row={row} rank={index + 1} priority={index === 0} />
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#171c19] bg-[#dfff4f]">
        <div className="page-wrap flex flex-wrap items-center justify-between gap-3 py-3 font-mono text-[10px] font-black uppercase tracking-[0.07em]">
          <span>{receptionLabel(config.settings.receptionPoints)} scoring</span>
          <span>{config.settings.passingTdPoints}-point passing TDs</span>
          <span>{config.settings.numTeams} teams · {config.settings.flexSpots} FLEX</span>
          <span>Release {impact.market.meta.releaseId}</span>
        </div>
      </section>

      <section className="page-wrap grid gap-10 py-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div><span className="eyebrow">What changes</span><h2 className="section-title mt-6">The scoring context behind the list.</h2></div>
        <div>
          <p className="text-base leading-8 text-[#59605c]">{config.intro}</p>
          <div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2">
            {config.definitions.map(([term, definition]) => (
              <div key={term} className="bg-[#f3f0e7] p-5"><strong>{term}</strong><p className="mt-2 text-sm leading-6 text-[#69706c]">{definition}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap py-12">
        <div className="flex flex-col gap-4 border-b border-[#171c19] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="eyebrow">Current values</span><h2 className="section-title mt-5">Top {config.eligiblePositions.join("/")} assets</h2></div>
          <p className="max-w-md text-sm leading-6 text-[#69706c]">{config.settings.passingTdPoints}-point passing TD · {receptionLabel(config.settings.receptionPoints)} · {config.settings.numTeams} teams · {config.settings.flexSpots} FLEX</p>
        </div>
        <div className="overflow-x-auto border-x border-b border-[#171c19]">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-[#171c19] font-mono text-[10px] uppercase tracking-[0.08em] text-white"><tr><th className="p-4">Rank</th><th className="p-4">Player</th><th className="p-4">Base</th><th className="p-4">League value</th><th className="p-4">Change</th><th className="p-4">Why</th></tr></thead>
            <tbody>
              {rankings.map((row, index) => (
                <tr key={row.id} className="border-b border-[#c8c4b9] last:border-0">
                  <td className="p-4 font-mono font-black">{index + 1}</td>
                  <td className="p-4"><ScoringPlayerIdentity row={row} /></td>
                  <td className="p-4 font-mono">{row.baseValue}</td>
                  <td className="p-4 font-mono font-black">{row.adjustedValue}</td>
                  <td className={`p-4 font-mono font-black ${row.valueDelta > 0 ? "text-[#466400]" : row.valueDelta < 0 ? "text-[#a23616]" : "text-[#69706c]"}`}>{row.valueDelta > 0 ? "+" : ""}{row.valueDelta}</td>
                  <td className="p-4 text-xs text-[#69706c]">{impactWhy(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-14 lg:grid-cols-2">
        <MoverList title="Biggest risers" rows={risers} accent="bg-[#dfff4f]" />
        <MoverList title="Biggest fallers" rows={fallers} accent="bg-[#ffb29a]" />
      </section>

      <section className="page-wrap py-14">
        <span className="eyebrow">Questions, answered</span>
        <h2 className="section-title mt-6">How to read these values.</h2>
        <div className="mt-8 grid gap-px border border-[#171c19] bg-[#171c19] lg:grid-cols-2">
          {config.faqs.map(([question, answer]) => (
            <article key={question} className="bg-[#f3f0e7] p-6"><h3 className="text-xl font-black tracking-[-0.03em]">{question}</h3><p className="mt-3 text-sm leading-7 text-[#69706c]">{answer}</p></article>
          ))}
        </div>
      </section>

      <section className="page-wrap border-t border-[#171c19] py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><span className="eyebrow">Use your exact lineup</span><h2 className="section-title mt-6">Change FLEX spots, starters, format, or scoring in the lab.</h2></div>
          <TrackedLink href={`/scoring-impact?${query}`} analyticsEvent="scoring_research_lab_opened" analyticsProperties={analyticsProperties} className="border border-[#171c19] bg-[#dfff4f] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.07em] shadow-[5px_5px_0_#171c19] hover:bg-white">Open impact lab →</TrackedLink>
        </div>
        <p className="mt-10 border-t border-[#bcb9ae] pt-5 text-xs leading-6 text-[#69706c]">
          Values use market release <span className="font-mono font-bold">{impact.market.meta.releaseId}</span>, updated {new Date(impact.market.meta.generatedAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/New_York" })}. Market source: <a href="https://api.tradyr.app/docs" target="_blank" rel="noopener noreferrer" className="font-bold underline">Tradyr public API</a>. Scoring adjustments are deterministic and documented in the <Link href="/methodology#league-scoring" className="font-bold underline">published methodology</Link>.
        </p>
      </section>
    </>
  );
}

function MoverList({ title, rows, accent }: { title: string; rows: ScoringImpactRow[]; accent: string }) {
  return (
    <article className="border border-[#171c19] bg-[#f3f0e7]">
      <h2 className={`${accent} border-b border-[#171c19] p-5 text-3xl font-black tracking-[-0.05em]`}>{title}</h2>
      <div className="divide-y divide-[#c8c4b9]">
        {rows.length ? rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 p-4"><ScoringPlayerIdentity row={row} compact /><strong className="font-mono">{row.valueDelta > 0 ? "+" : ""}{row.valueDelta}</strong></div>) : <p className="p-5 text-sm text-[#69706c]">No players move in this direction.</p>}
      </div>
    </article>
  );
}

function ResearchPlayerSpotlight({ row, rank, priority = false }: { row: ScoringImpactRow; rank: number; priority?: boolean }) {
  const page = getPlayerPage(row.slug);
  return (
    <Link href={`/players/${row.slug}`} className="group grid min-h-28 grid-cols-[92px_minmax(0,1fr)_auto] overflow-hidden border border-white/30 bg-[#f3f0e7] text-[#171c19] hover:bg-[#dfff4f]">
      <span className="relative border-r border-[#171c19]">
        <PlayerPortrait slug={row.slug} name={row.name} image={page?.image} position={row.position} team={row.team} variant="thumbnail" priority={priority} sizes="92px" decorative />
      </span>
      <span className="flex min-w-0 flex-col justify-between p-4">
        <span className="mono-label text-[#69706c]">#{rank} · {row.position}</span>
        <strong className="mt-2 text-xl leading-none tracking-[-0.04em]">{row.name}</strong>
        <span className="mt-2 text-[11px] text-[#69706c]">{impactWhy(row)}</span>
      </span>
      <span className="flex flex-col items-end justify-between p-3">
        <TeamLogo team={row.team} size={34} decorative />
        <strong className="font-mono text-2xl text-[#a23616]">{row.adjustedValue}</strong>
      </span>
    </Link>
  );
}

function ScoringPlayerIdentity({ row, compact = false }: { row: ScoringImpactRow; compact?: boolean }) {
  const page = getPlayerPage(row.slug);
  return (
    <Link href={`/players/${row.slug}`} className="group flex min-w-[210px] items-center gap-3">
      <span className={`relative shrink-0 overflow-hidden border border-[#171c19] ${compact ? "h-11 w-10" : "h-14 w-12"}`}>
        <PlayerPortrait slug={row.slug} name={row.name} image={page?.image} position={row.position} team={row.team} variant="thumbnail" sizes={compact ? "40px" : "48px"} decorative />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <strong className="block truncate group-hover:underline">{row.name}</strong>
          <TeamLogo team={row.team} size={compact ? 22 : 26} decorative />
        </span>
        <small className="mt-1 block text-[#69706c]">{compact ? impactWhy(row) : `${row.position}${row.team ? ` · ${row.team}` : ""}`}</small>
      </span>
    </Link>
  );
}
