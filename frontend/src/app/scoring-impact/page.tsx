import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPageView from "../components/AnalyticsPageView";
import { TrackedLink } from "../components/TrackedLink";
import {
  getScoringImpact,
  impactSettingsHref,
  impactSettingsParams,
  impactWhy,
  normalizeImpactSettings,
  receptionLabel,
  type ImpactSettings,
  type ScoringImpactRow,
} from "../lib/scoring-impact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fantasy Football Scoring Impact Lab",
  description:
    "Compare fantasy player values across 4- and 6-point passing touchdowns, Standard, Half PPR, Full PPR, and custom FLEX roster demand.",
  alternates: { canonical: "/scoring-impact" },
  openGraph: {
    title: "Fantasy Football Scoring Impact Lab",
    description:
      "See which fantasy players gain or lose value when scoring and lineup settings change.",
    url: "/scoring-impact",
    type: "website",
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ScoringImpactPage({ searchParams }: PageProps) {
  const settings = normalizeImpactSettings(await searchParams);
  const impact = await getScoringImpact(settings);
  const calculatorParams = impactSettingsParams(settings);
  calculatorParams.set("roster", "1");
  const calculatorPath = settings.format === "redraft"
    ? "/fantasy-football-trade-analyzer"
    : "/dynasty-trade-calculator";
  const properties = {
    calculator_format: settings.format,
    num_qbs: settings.numQbs,
    passing_td_points: settings.passingTdPoints,
    reception_points: settings.receptionPoints,
    rb_starters: settings.rbStarters,
    wr_starters: settings.wrStarters,
    te_starters: settings.teStarters,
    flex_spots: settings.flexSpots,
    position_filter: settings.position,
    modeled_player_count: impact.rows.length,
    release_id: impact.market.meta.releaseId,
  };

  return (
    <>
      <AnalyticsPageView eventName="scoring_impact_viewed" properties={properties} />
      <section className="border-b border-[#171c19] bg-[#171c19] text-white">
        <div className="page-wrap grid gap-8 py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <span className="mono-label text-[#dfff4f]">Scoring impact lab // model 2026.08.3</span>
            <h1 className="mt-6 max-w-5xl text-[clamp(3.2rem,8vw,7.8rem)] font-black leading-[0.84] tracking-[-0.08em]">
              See who your rules make valuable.
            </h1>
          </div>
          <p className="text-base leading-7 text-white/60">
            Raw fantasy points are only step one. This lab compares every modeled player with replacement at the same position, then shows the bounded change from the published market.
          </p>
        </div>
      </section>

      <section className="page-wrap py-8">
        <div className="border border-[#171c19] bg-[#f3f0e7] shadow-[6px_6px_0_#8bcfff]">
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
            <ImpactControl label="Passing TD" settings={settings} field="passingTdPoints" options={[[4, "4 points"], [6, "6 points"]]} />
            <ImpactControl label="Receptions" settings={settings} field="receptionPoints" options={[[0, "Standard"], [0.5, "Half PPR"], [1, "Full PPR"]]} />
            <ImpactControl label="FLEX spots" settings={settings} field="flexSpots" options={[[0, "0"], [1, "1"], [2, "2"], [3, "3"]]} />
            <ImpactControl label="Position" settings={settings} field="position" options={[["ALL", "All"], ["QB", "QB"], ["RB", "RB"], ["WR", "WR"], ["TE", "TE"]]} />
          </div>
          <details className="border-t border-[#171c19] p-5 sm:p-7">
            <summary className="cursor-pointer font-mono text-[10px] font-black uppercase tracking-[0.08em]">Format, league size & dedicated starters</summary>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ImpactControl label="Format" settings={settings} field="format" options={[["dynasty", "Dynasty"], ["redraft", "Redraft"]]} />
              <ImpactControl label="Quarterbacks" settings={settings} field="numQbs" options={[[1, "1QB"], [2, "Superflex"]]} />
              <ImpactControl label="Teams" settings={settings} field="numTeams" options={[[8, "8"], [10, "10"], [12, "12"], [14, "14"], [16, "16"]]} />
              <ImpactControl label="Starting RB" settings={settings} field="rbStarters" options={[[1, "1"], [2, "2"], [3, "3"]]} />
              <ImpactControl label="Starting WR" settings={settings} field="wrStarters" options={[[2, "2"], [3, "3"], [4, "4"]]} />
              <ImpactControl label="Starting TE" settings={settings} field="teStarters" options={[[1, "1"], [2, "2"]]} />
            </div>
          </details>
        </div>
      </section>

      <section className="page-wrap py-8">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Selected scoring" value={`${settings.passingTdPoints}PT TD · ${receptionLabel(settings.receptionPoints)}`} />
          <Metric label="Roster demand" value={`${settings.rbStarters} RB · ${settings.wrStarters} WR · ${settings.teStarters} TE · ${settings.flexSpots} FLEX`} />
          <Metric label="Modeled here" value={`${impact.rows.length} players`} />
          <Metric label="FLEX allocation" value={`${impact.market.meta.scoring.flexAllocation.RB} RB · ${impact.market.meta.scoring.flexAllocation.WR} WR · ${impact.market.meta.scoring.flexAllocation.TE} TE`} />
        </div>
      </section>

      <section className="page-wrap grid gap-8 py-10 lg:grid-cols-2">
        <ImpactTable title="Biggest risers" eyebrow="Value gained" rows={impact.risers.filter((row) => row.valueDelta > 0).slice(0, 15)} tone="acid" />
        <ImpactTable title="Biggest fallers" eyebrow="Value lost" rows={impact.fallers.filter((row) => row.valueDelta < 0).slice(0, 15)} tone="orange" />
      </section>

      <section className="page-wrap grid gap-8 border-t border-[#171c19] py-16 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <span className="eyebrow">Take it to the trade room</span>
          <h2 className="section-title mt-6 max-w-4xl">Build an offer with these exact scoring and roster settings.</h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#59605c]">The calculator, shared report, and social card will preserve every setting in the URL.</p>
        </div>
        <TrackedLink
          href={`${calculatorPath}?${calculatorParams}`}
          analyticsEvent="scoring_impact_calculator_opened"
          analyticsProperties={properties}
          className="border border-[#171c19] bg-[#dfff4f] px-6 py-4 font-mono text-xs font-black uppercase tracking-[0.07em] shadow-[5px_5px_0_#171c19] hover:bg-white"
        >
          Open calculator →
        </TrackedLink>
      </section>

      <section className="page-wrap py-12">
        <div className="grid gap-px border border-[#171c19] bg-[#171c19] md:grid-cols-3">
          <ResearchLink href="/scoring/6-point-passing-td-rankings" title="6-point passing TD rankings" />
          <ResearchLink href="/scoring/standard-vs-ppr-player-values" title="Standard vs. PPR values" />
          <ResearchLink href="/scoring/half-ppr-trade-values" title="Half PPR trade values" />
        </div>
      </section>
    </>
  );
}

function ImpactControl<Key extends keyof ImpactSettings>({
  label,
  settings,
  field,
  options,
}: {
  label: string;
  settings: ImpactSettings;
  field: Key;
  options: Array<[ImpactSettings[Key], string]>;
}) {
  return (
    <div>
      <span className="mono-label text-[#69706c]">{label}</span>
      <div className="mt-2 flex flex-wrap gap-1">
        {options.map(([value, optionLabel]) => {
          const active = settings[field] === value;
          const nextSettings = { ...settings, [field]: value };
          return (
            <TrackedLink
              key={String(value)}
              href={impactSettingsHref(settings, { [field]: value } as Partial<ImpactSettings>)}
              scroll={false}
              analyticsEvent="scoring_impact_setting_changed"
              analyticsProperties={{
                setting: String(field),
                selected_value: String(value),
                calculator_format: nextSettings.format,
                num_qbs: nextSettings.numQbs,
                passing_td_points: nextSettings.passingTdPoints,
                reception_points: nextSettings.receptionPoints,
                rb_starters: nextSettings.rbStarters,
                wr_starters: nextSettings.wrStarters,
                te_starters: nextSettings.teStarters,
                flex_spots: nextSettings.flexSpots,
              }}
              className={`border border-[#171c19] px-3 py-2 text-xs font-black ${active ? "bg-[#171c19] text-white" : "bg-white hover:bg-[#8bcfff]"}`}
            >
              {optionLabel}
            </TrackedLink>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#f3f0e7] p-5"><span className="mono-label text-[#69706c]">{label}</span><strong className="mt-3 block text-lg font-black">{value}</strong></div>;
}

function ImpactTable({
  title,
  eyebrow,
  rows,
  tone,
}: {
  title: string;
  eyebrow: string;
  rows: ScoringImpactRow[];
  tone: "acid" | "orange";
}) {
  const accent = tone === "acid" ? "bg-[#dfff4f]" : "bg-[#ffb29a]";
  return (
    <article className="border border-[#171c19] bg-[#f3f0e7]">
      <header className={`${accent} border-b border-[#171c19] p-5`}><span className="mono-label">{eyebrow}</span><h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">{title}</h2></header>
      <div className="divide-y divide-[#bcb9ae]">
        {rows.length ? rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-3 p-4">
            <span className="font-mono text-xs font-black text-[#69706c]">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <strong className="block truncate">{row.name}</strong>
              <span className="mt-1 block text-[11px] text-[#69706c]">{row.position}{row.team ? ` · ${row.team}` : ""} · {impactWhy(row)}</span>
            </div>
            <div className="text-right font-mono">
              <strong className={row.valueDelta > 0 ? "text-[#466400]" : "text-[#a23616]"}>{row.valueDelta > 0 ? "+" : ""}{row.valueDelta}</strong>
              <span className="block text-[9px] text-[#69706c]">{row.baseValue} → {row.adjustedValue}</span>
            </div>
          </div>
        )) : <p className="p-6 text-sm text-[#69706c]">No players move in this direction under the selected settings.</p>}
      </div>
      <footer className="border-t border-[#171c19] p-4 text-xs text-[#69706c]">
        Values are confidence-weighted and capped. <Link href="/methodology#league-scoring" className="font-bold underline">Exact methodology</Link>.
      </footer>
    </article>
  );
}

function ResearchLink({ href, title }: { href: string; title: string }) {
  return <Link href={href} className="bg-[#f3f0e7] p-6 hover:bg-[#dfff4f]"><span className="mono-label text-[#69706c]">Scoring research</span><strong className="mt-4 block text-xl tracking-[-0.03em]">{title} →</strong></Link>;
}
