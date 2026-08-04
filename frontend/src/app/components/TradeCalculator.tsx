"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiArrowUp,
  FiCheck,
  FiCopy,
  FiPlus,
  FiRefreshCcw,
  FiSearch,
  FiShare2,
  FiX,
} from "react-icons/fi";
import {
  evaluateTrade,
  findBalancingAssets,
} from "../lib/trade-engine.mjs";
import { fetchClientMarket } from "../lib/client-market";
import type {
  MarketAsset,
  MarketFormat,
  MarketPayload,
} from "../types/MarketAsset";

type TradeCalculatorProps = {
  defaultFormat?: MarketFormat;
  defaultNumQbs?: 1 | 2;
  compactIntro?: boolean;
};

type TradeEvaluationResult = ReturnType<typeof evaluateTrade>;

export default function TradeCalculator({
  defaultFormat = "dynasty",
  defaultNumQbs = 2,
  compactIntro = false,
}: TradeCalculatorProps) {
  const [format, setFormat] = useState<MarketFormat>(defaultFormat);
  const [numQbs, setNumQbs] = useState<1 | 2>(defaultNumQbs);
  const [tep, setTep] = useState(false);
  const [numTeams, setNumTeams] = useState(12);
  const [rosterPremium, setRosterPremium] = useState(true);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [market, setMarket] = useState<MarketPayload | null>(null);
  const [sideA, setSideA] = useState<MarketAsset[]>([]);
  const [sideB, setSideB] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const hydratedFromUrl = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("format") === "redraft") setFormat("redraft");
    if (params.get("format") === "dynasty") setFormat("dynasty");
    if (params.get("qbs") === "1") setNumQbs(1);
    if (params.get("qbs") === "2") setNumQbs(2);
    if (params.get("tep") === "1") setTep(true);
    if (params.get("roster") === "0") setRosterPremium(false);
    const requestedTeams = Number(params.get("teams"));
    if ([8, 10, 12, 14, 16].includes(requestedTeams)) setNumTeams(requestedTeams);
    setSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    let active = true;
    const loadMarket = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          format,
          numQbs: String(numQbs),
          tep: String(tep),
          numTeams: String(numTeams),
        });
        const payload = await fetchClientMarket(
          `/api/market?${params}`,
          reloadKey > 0,
        );
        if (!active) return;
        setMarket(payload);
        setSideA((current) =>
          current
            .map((asset) => payload.assets.find((item) => item.id === asset.id))
            .filter((asset): asset is MarketAsset => Boolean(asset)),
        );
        setSideB((current) =>
          current
            .map((asset) => payload.assets.find((item) => item.id === asset.id))
            .filter((asset): asset is MarketAsset => Boolean(asset)),
        );
      } catch (loadError) {
        if (active) {
          setError("The market feed took a timeout. Give it one quick retry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMarket();
    return () => {
      active = false;
    };
  }, [format, numQbs, tep, numTeams, reloadKey, settingsHydrated]);

  useEffect(() => {
    if (!market || hydratedFromUrl.current) return;
    const params = new URLSearchParams(window.location.search);
    const getIds = (params.get("get") || "").split(",").filter(Boolean);
    const sendIds = (params.get("send") || "").split(",").filter(Boolean);

    if (getIds.length) {
      setSideA(
        getIds
          .map((id) => market.assets.find((asset) => asset.id === id))
          .filter((asset): asset is MarketAsset => Boolean(asset)),
      );
    }
    if (sendIds.length) {
      setSideB(
        sendIds
          .map((id) => market.assets.find((asset) => asset.id === id))
          .filter((asset): asset is MarketAsset => Boolean(asset)),
      );
    }
    hydratedFromUrl.current = true;
  }, [market]);

  const evaluation = useMemo(
    () => evaluateTrade(sideA, sideB, rosterPremium),
    [sideA, sideB, rosterPremium],
  );

  const selectedIds = useMemo(
    () => new Set([...sideA, ...sideB].map((asset) => asset.id)),
    [sideA, sideB],
  );

  const balanceSuggestions = useMemo(() => {
    if (!market || evaluation.status === "incomplete" || evaluation.status === "fair") {
      return [];
    }
    return findBalancingAssets(
      market.assets,
      selectedIds,
      evaluation.valueGap,
      3,
    );
  }, [evaluation, market, selectedIds]);

  const addAsset = (side: "A" | "B", asset: MarketAsset) => {
    if (selectedIds.has(asset.id)) return;
    if (side === "A") setSideA((current) => [...current, asset]);
    else setSideB((current) => [...current, asset]);
  };

  const removeAsset = (side: "A" | "B", assetId: string) => {
    if (side === "A") setSideA((current) => current.filter((asset) => asset.id !== assetId));
    else setSideB((current) => current.filter((asset) => asset.id !== assetId));
  };

  const reset = () => {
    setSideA([]);
    setSideB([]);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("format", format);
    url.searchParams.set("qbs", String(numQbs));
    if (tep) url.searchParams.set("tep", "1");
    url.searchParams.set("teams", String(numTeams));
    if (!rosterPremium) url.searchParams.set("roster", "0");
    if (sideA.length) url.searchParams.set("get", sideA.map((asset) => asset.id).join(","));
    if (sideB.length) url.searchParams.set("send", sideB.map((asset) => asset.id).join(","));
    window.history.replaceState({}, "", url);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="trade-calculator" className="dark-panel shadow-[8px_8px_0_#8bcfff]">
      {!compactIntro && (
        <div className="grid gap-6 border-b border-white/20 px-5 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="mono-label text-[#dfff4f]">Trade room // live market</span>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] sm:text-5xl">
              Price the whole offer.
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/60">
            Daily market values, draft picks, and an optional roster-cost adjustment.
            No accounts. No black-box AI verdicts.
          </p>
        </div>
      )}

      <LeagueControls
        format={format}
        setFormat={setFormat}
        numQbs={numQbs}
        setNumQbs={setNumQbs}
        tep={tep}
        setTep={setTep}
        numTeams={numTeams}
        setNumTeams={setNumTeams}
        rosterPremium={rosterPremium}
        setRosterPremium={setRosterPremium}
      />

      {error ? (
        <div className="m-5 border border-[#ff6b3d] bg-[#2d1e18] p-6 sm:m-8">
          <p className="font-bold text-[#ffb49d]">{error}</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-[#171c19]"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <FiRefreshCcw /> Retry
          </button>
        </div>
      ) : (
        <>
          <div className="relative grid gap-px bg-white/20 lg:grid-cols-2">
            <TradeSide
              side="A"
              label="You get"
              assets={sideA}
              marketAssets={market?.assets || []}
              selectedIds={selectedIds}
              loading={loading}
              calculation={evaluation.sideA}
              onAdd={(asset) => addAsset("A", asset)}
              onRemove={(id) => removeAsset("A", id)}
              accent="acid"
            />
            <button
              type="button"
              className="absolute left-1/2 top-1/2 z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center border border-[#171c19] bg-white text-[#171c19] shadow-[3px_3px_0_#ff6b3d] transition-transform hover:scale-105"
              onClick={() => {
                setSideA(sideB);
                setSideB(sideA);
              }}
              aria-label="Swap both sides"
            >
              <span className="hidden lg:block"><FiArrowLeft size={18} /></span>
              <span className="lg:hidden"><FiArrowUp size={18} /></span>
            </button>
            <TradeSide
              side="B"
              label="You send"
              assets={sideB}
              marketAssets={market?.assets || []}
              selectedIds={selectedIds}
              loading={loading}
              calculation={evaluation.sideB}
              onAdd={(asset) => addAsset("B", asset)}
              onRemove={(id) => removeAsset("B", id)}
              accent="orange"
            />
          </div>

          <TradeVerdict
            evaluation={evaluation}
            suggestions={balanceSuggestions}
            weakerSide={evaluation.winner === "A" ? "B" : "A"}
            onAddSuggestion={addAsset}
          />
        </>
      )}

      <div className="flex flex-col gap-4 border-t border-white/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-xs text-white/50">
          {market ? (
            <>
              {market.meta.assetCount} assets · Updated {formatDate(market.meta.generatedAt)} ·{" "}
              <a
                href="/data-sources"
                className="text-[#dfff4f] underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                Data & methodology
              </a>
            </>
          ) : (
            "Loading today’s market…"
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 border border-white/25 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.07em] hover:bg-white/10"
          >
            <FiRefreshCcw /> Reset
          </button>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 bg-[#dfff4f] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] hover:bg-white"
          >
            {copied ? <FiCheck /> : <FiShare2 />}
            {copied ? "Link copied" : "Share trade"}
          </button>
        </div>
      </div>
    </section>
  );
}

function LeagueControls({
  format,
  setFormat,
  numQbs,
  setNumQbs,
  tep,
  setTep,
  numTeams,
  setNumTeams,
  rosterPremium,
  setRosterPremium,
}: {
  format: MarketFormat;
  setFormat: (value: MarketFormat) => void;
  numQbs: 1 | 2;
  setNumQbs: (value: 1 | 2) => void;
  tep: boolean;
  setTep: (value: boolean) => void;
  numTeams: number;
  setNumTeams: (value: number) => void;
  rosterPremium: boolean;
  setRosterPremium: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-5 border-b border-white/20 bg-white/[0.035] px-5 py-5 sm:px-8 xl:grid-cols-[1fr_1fr_auto_auto] xl:items-end">
      <Segmented
        label="League type"
        options={[
          ["dynasty", "Dynasty"],
          ["redraft", "Redraft"],
        ]}
        value={format}
        onChange={(value) => setFormat(value as MarketFormat)}
      />
      <Segmented
        label="Quarterbacks"
        options={[
          ["1", "1QB"],
          ["2", "Superflex"],
        ]}
        value={String(numQbs)}
        onChange={(value) => setNumQbs(value === "1" ? 1 : 2)}
      />
      <label className="grid gap-2">
        <span className="mono-label text-white/50">League size</span>
        <select
          value={numTeams}
          onChange={(event) => setNumTeams(Number(event.target.value))}
          className="h-[42px] border border-white/25 bg-[#171c19] px-3 text-sm text-white"
        >
          {[8, 10, 12, 14, 16].map((count) => (
            <option key={count} value={count}>{count} teams</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        <Toggle active={tep} onClick={() => setTep(!tep)} label="TE premium" />
        <Toggle
          active={rosterPremium}
          onClick={() => setRosterPremium(!rosterPremium)}
          label="Roster cost"
        />
      </div>
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[][];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="mono-label text-white/50">{label}</span>
      <div className="grid grid-cols-2 border border-white/25 p-1">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`px-3 py-2 text-xs font-bold transition-colors ${
              value === optionValue ? "bg-white text-[#171c19]" : "text-white/60 hover:text-white"
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[42px] items-center gap-2 border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em] ${
        active
          ? "border-[#dfff4f] bg-[#dfff4f] text-[#171c19]"
          : "border-white/25 text-white/60"
      }`}
      aria-pressed={active}
    >
      <span className={`h-2 w-2 ${active ? "bg-[#171c19]" : "bg-white/30"}`} />
      {label}
    </button>
  );
}

function TradeSide({
  side,
  label,
  assets,
  marketAssets,
  selectedIds,
  loading,
  calculation,
  onAdd,
  onRemove,
  accent,
}: {
  side: "A" | "B";
  label: string;
  assets: MarketAsset[];
  marketAssets: MarketAsset[];
  selectedIds: Set<string>;
  loading: boolean;
  calculation: TradeEvaluationResult["sideA"];
  onAdd: (asset: MarketAsset) => void;
  onRemove: (id: string) => void;
  accent: "acid" | "orange";
}) {
  const accentClasses = accent === "acid" ? "bg-[#dfff4f]" : "bg-[#ff6b3d]";

  return (
    <div className="min-h-[420px] bg-[#171c19] p-5 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-8 w-8 place-items-center font-mono text-xs font-black text-[#171c19] ${accentClasses}`}>
            {side}
          </span>
          <h3 className="text-xl font-black tracking-[-0.03em]">{label}</h3>
        </div>
        <span className="font-mono text-xs text-white/40">{assets.length} pieces</span>
      </div>

      <AssetPicker
        assets={marketAssets}
        selectedIds={selectedIds}
        onSelect={onAdd}
        loading={loading}
        accent={accent}
      />

      <div className="mt-4 space-y-2">
        {assets.length ? (
          assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} onRemove={() => onRemove(asset.id)} />
          ))
        ) : (
          <div className="grid min-h-40 place-items-center border border-dashed border-white/20 px-6 text-center">
            <div>
              <FiPlus className="mx-auto mb-2 text-white/25" size={24} />
              <p className="text-sm font-semibold text-white/45">Add players or picks</p>
              <p className="mt-1 text-xs text-white/30">Search above to build this side.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-white/20 pt-4">
        <div>
          <span className="mono-label text-white/40">Adjusted value</span>
          {calculation.rosterCost > 0 && (
            <p className="mt-1 text-[11px] text-white/35">−{calculation.rosterCost} roster cost</p>
          )}
        </div>
        <span className="font-mono text-3xl font-black tabular-nums">{Math.round(calculation.adjusted)}</span>
      </div>
    </div>
  );
}

function AssetPicker({
  assets,
  selectedIds,
  onSelect,
  loading,
  accent,
}: {
  assets: MarketAsset[];
  selectedIds: Set<string>;
  onSelect: (asset: MarketAsset) => void;
  loading: boolean;
  accent: "acid" | "orange";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const normalized = query.trim().toLowerCase();
  const results = assets
    .filter((asset) => !selectedIds.has(asset.id))
    .filter((asset) =>
      normalized
        ? `${asset.name} ${asset.team || ""} ${asset.position} ${asset.id}`.toLowerCase().includes(normalized)
        : asset.kind === "player",
    )
    .slice(0, 8);

  return (
    <div className="relative">
      <FiSearch className="pointer-events-none absolute left-3 top-3.5 z-10 text-[#171c19]/45" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={loading ? "Loading market…" : "Search player or pick…"}
        disabled={loading}
        className="h-12 w-full border-0 bg-white pl-10 pr-4 text-sm font-semibold text-[#171c19] placeholder:text-[#69706c]"
        aria-label="Search players and draft picks"
      />
      {open && !loading && (
        <div className="absolute left-0 right-0 top-[50px] z-30 max-h-[340px] overflow-y-auto border border-[#171c19] bg-white text-[#171c19] shadow-[5px_5px_0_rgba(139,207,255,0.9)]">
          {results.length ? (
            results.map((asset) => (
              <button
                type="button"
                key={asset.id}
                className="flex w-full items-center justify-between gap-3 border-b border-[#dedbd1] px-3 py-3 text-left last:border-0 hover:bg-[#f0f8d5]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(asset);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{asset.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase text-[#69706c]">
                    {asset.position}{asset.team ? ` · ${asset.team}` : ""}{asset.age ? ` · ${asset.age.toFixed(1)} y.o.` : ""}
                  </span>
                </span>
                <span className={`px-2 py-1 font-mono text-xs font-black ${accent === "acid" ? "bg-[#dfff4f]" : "bg-[#ffb29a]"}`}>
                  {asset.value}
                </span>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-[#69706c]">No matching assets.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset, onRemove }: { asset: MarketAsset; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 border border-white/20 bg-white/[0.045] p-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center font-mono text-[10px] font-black text-[#171c19] ${positionColor(asset.position)}`}>
        {asset.position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{asset.name}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase text-white/40">
          {asset.team || asset.tier || "Draft capital"}{asset.age ? ` · ${asset.age.toFixed(1)} y.o.` : ""}
        </p>
      </div>
      <span className="font-mono text-sm font-black tabular-nums">{asset.value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-8 w-8 place-items-center text-white/35 hover:bg-white/10 hover:text-white"
        aria-label={`Remove ${asset.name}`}
      >
        <FiX />
      </button>
    </div>
  );
}

function TradeVerdict({
  evaluation,
  suggestions,
  weakerSide,
  onAddSuggestion,
}: {
  evaluation: TradeEvaluationResult;
  suggestions: MarketAsset[];
  weakerSide: "A" | "B";
  onAddSuggestion: (side: "A" | "B", asset: MarketAsset) => void;
}) {
  const total = evaluation.sideA.adjusted + evaluation.sideB.adjusted;
  const aShare = total ? Math.max(4, Math.min(96, (evaluation.sideA.adjusted / total) * 100)) : 50;
  const verdictLabel =
    evaluation.status === "incomplete"
      ? "Waiting on both sides"
      : evaluation.status === "fair"
        ? "Fair trade"
        : evaluation.winner === "A"
          ? "Value favors what you get"
          : "Value favors what you send";

  return (
    <div className="border-t border-white/20 bg-[#202621] px-5 py-7 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="mono-label text-white/40">Deterministic verdict</span>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{verdictLabel}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{evaluation.summary}</p>
        </div>
        {evaluation.status !== "incomplete" && (
          <div className="text-left lg:text-right">
            <span className="font-mono text-4xl font-black text-[#dfff4f]">{evaluation.percentDifference}%</span>
            <p className="mono-label mt-1 text-white/35">Adjusted gap</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">
          <span>You get · {Math.round(evaluation.sideA.adjusted)}</span>
          <span>You send · {Math.round(evaluation.sideB.adjusted)}</span>
        </div>
        <div className="flex h-3 border border-white/25 bg-[#ff6b3d]">
          <div className="bg-[#dfff4f] transition-[width] duration-300" style={{ width: `${aShare}%` }} />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-6 border-t border-white/15 pt-5">
          <p className="mono-label text-white/40">
            Closest one-piece balancers · add to {weakerSide === "A" ? "what you get" : "what you send"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((asset) => (
              <button
                type="button"
                key={asset.id}
                onClick={() => onAddSuggestion(weakerSide, asset)}
                className="inline-flex items-center gap-2 border border-white/20 bg-white/[0.05] px-3 py-2 text-xs font-bold hover:border-[#dfff4f] hover:text-[#dfff4f]"
              >
                <FiPlus /> {asset.name} <span className="font-mono text-white/40">{asset.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function positionColor(position: MarketAsset["position"]) {
  if (position === "QB") return "bg-[#8bcfff]";
  if (position === "RB") return "bg-[#ffb29a]";
  if (position === "WR") return "bg-[#dfff4f]";
  if (position === "TE") return "bg-[#d7b6ff]";
  return "bg-white";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "daily";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
