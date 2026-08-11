"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiArrowUp,
  FiCheck,
  FiCopy,
  FiInfo,
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
import {
  buildTradeShareParams,
  buildTradeShareSlug,
} from "../lib/trade-share.mjs";
import { fetchClientMarket } from "../lib/client-market";
import { captureAnalytics } from "../lib/analytics";
import { getTradePlayerImage } from "../lib/player-pages";
import PlayerPortrait from "./PlayerPortrait";
import type {
  MarketAsset,
  MarketFormat,
  MarketPayload,
  PassingTdPoints,
  ReceptionPoints,
  RosterSettings,
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
  const [passingTdPoints, setPassingTdPoints] = useState<PassingTdPoints>(4);
  const [receptionPoints, setReceptionPoints] = useState<ReceptionPoints>(1);
  const [rbStarters, setRbStarters] = useState<RosterSettings["rbStarters"]>(2);
  const [wrStarters, setWrStarters] = useState<RosterSettings["wrStarters"]>(3);
  const [teStarters, setTeStarters] = useState<RosterSettings["teStarters"]>(1);
  const [flexSpots, setFlexSpots] = useState<RosterSettings["flexSpots"]>(1);
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
  const lastEvaluationSignature = useRef("");
  const lastMarketSignature = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("format") === "redraft") setFormat("redraft");
    if (params.get("format") === "dynasty") setFormat("dynasty");
    if (params.get("qbs") === "1") setNumQbs(1);
    if (params.get("qbs") === "2") setNumQbs(2);
    if (params.get("tep") === "1") setTep(true);
    if (params.get("roster") === "0") setRosterPremium(false);
    if (params.get("passTd") === "6") setPassingTdPoints(6);
    const requestedPpr = Number(params.get("ppr"));
    if ([0, 0.5, 1].includes(requestedPpr)) {
      setReceptionPoints(requestedPpr as ReceptionPoints);
    }
    const requestedRb = Number(params.get("rb"));
    if ([1, 2, 3].includes(requestedRb)) setRbStarters(requestedRb as RosterSettings["rbStarters"]);
    const requestedWr = Number(params.get("wr"));
    if ([2, 3, 4].includes(requestedWr)) setWrStarters(requestedWr as RosterSettings["wrStarters"]);
    const requestedTe = Number(params.get("te"));
    if ([1, 2].includes(requestedTe)) setTeStarters(requestedTe as RosterSettings["teStarters"]);
    const requestedFlex = Number(params.get("flex"));
    if ([0, 1, 2, 3].includes(requestedFlex)) setFlexSpots(requestedFlex as RosterSettings["flexSpots"]);
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
          passingTdPoints: String(passingTdPoints),
          receptionPoints: String(receptionPoints),
          rbStarters: String(rbStarters),
          wrStarters: String(wrStarters),
          teStarters: String(teStarters),
          flexSpots: String(flexSpots),
        });
        const payload = await fetchClientMarket(
          `/api/market?${params}`,
          reloadKey > 0,
        );
        if (!active) return;
        setMarket(payload);
        const marketSignature = `${payload.meta.releaseId}:${format}:${numQbs}:${tep}:${numTeams}:${passingTdPoints}:${receptionPoints}:${rbStarters}:${wrStarters}:${teStarters}:${flexSpots}`;
        if (lastMarketSignature.current !== marketSignature) {
          captureAnalytics("calculator_market_loaded", {
            calculator_format: format,
            num_qbs: numQbs,
            te_premium: tep,
            league_size: numTeams,
            passing_td_points: passingTdPoints,
            reception_points: receptionPoints,
            rb_starters: rbStarters,
            wr_starters: wrStarters,
            te_starters: teStarters,
            flex_spots: flexSpots,
            asset_count: payload.meta.assetCount,
            scoring_profile_count: payload.meta.scoring.coveredCount,
            release_id: payload.meta.releaseId,
          });
          lastMarketSignature.current = marketSignature;
        }
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
          captureAnalytics("calculator_market_load_failed", {
            calculator_format: format,
            num_qbs: numQbs,
            te_premium: tep,
            league_size: numTeams,
            passing_td_points: passingTdPoints,
            reception_points: receptionPoints,
            rb_starters: rbStarters,
            wr_starters: wrStarters,
            te_starters: teStarters,
            flex_spots: flexSpots,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMarket();
    return () => {
      active = false;
    };
  }, [
    format,
    numQbs,
    tep,
    numTeams,
    passingTdPoints,
    receptionPoints,
    rbStarters,
    wrStarters,
    teStarters,
    flexSpots,
    reloadKey,
    settingsHydrated,
  ]);

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

  useEffect(() => {
    if (
      !settingsHydrated ||
      !hydratedFromUrl.current ||
      loading ||
      evaluation.status === "incomplete" ||
      !market ||
      market.meta.format !== format ||
      market.meta.numQbs !== numQbs ||
      market.meta.tep !== tep ||
      market.meta.numTeams !== numTeams ||
      market.meta.scoring.settings.passingTdPoints !== passingTdPoints ||
      market.meta.scoring.settings.receptionPoints !== receptionPoints ||
      market.meta.scoring.rosterSettings.rbStarters !== rbStarters ||
      market.meta.scoring.rosterSettings.wrStarters !== wrStarters ||
      market.meta.scoring.rosterSettings.teStarters !== teStarters ||
      market.meta.scoring.rosterSettings.flexSpots !== flexSpots
    ) {
      return;
    }

    const signature = JSON.stringify({
      a: sideA.map((asset) => asset.id),
      b: sideB.map((asset) => asset.id),
      format,
      numQbs,
      tep,
      numTeams,
      passingTdPoints,
      receptionPoints,
      rbStarters,
      wrStarters,
      teStarters,
      flexSpots,
      rosterPremium,
    });
    if (signature === lastEvaluationSignature.current) return;

    captureAnalytics("trade_evaluated", {
      calculator_format: format,
      num_qbs: numQbs,
      te_premium: tep,
      league_size: numTeams,
      passing_td_points: passingTdPoints,
      reception_points: receptionPoints,
      rb_starters: rbStarters,
      wr_starters: wrStarters,
      te_starters: teStarters,
      flex_spots: flexSpots,
      roster_cost_enabled: rosterPremium,
      get_asset_count: sideA.length,
      send_asset_count: sideB.length,
      get_adjusted_value: evaluation.sideA.adjusted,
      send_adjusted_value: evaluation.sideB.adjusted,
      value_gap: evaluation.valueGap,
      percent_difference: evaluation.percentDifference,
      verdict: evaluation.status,
      favored_side:
        evaluation.winner === "A"
          ? "get"
          : evaluation.winner === "B"
            ? "send"
            : "even",
      includes_pick: [...sideA, ...sideB].some((asset) => asset.kind === "pick"),
    });
    lastEvaluationSignature.current = signature;
  }, [
    evaluation,
    format,
    loading,
    market,
    numQbs,
    numTeams,
    passingTdPoints,
    receptionPoints,
    rbStarters,
    wrStarters,
    teStarters,
    flexSpots,
    rosterPremium,
    settingsHydrated,
    sideA,
    sideB,
    tep,
  ]);

  const addAsset = (
    side: "A" | "B",
    asset: MarketAsset,
    selectionSource: "search" | "balance_suggestion" = "search",
  ) => {
    if (selectedIds.has(asset.id)) return;
    if (side === "A") setSideA((current) => [...current, asset]);
    else setSideB((current) => [...current, asset]);
    captureAnalytics("trade_asset_added", {
      calculator_format: format,
      num_qbs: numQbs,
      te_premium: tep,
      league_size: numTeams,
      passing_td_points: passingTdPoints,
      reception_points: receptionPoints,
      rb_starters: rbStarters,
      wr_starters: wrStarters,
      te_starters: teStarters,
      flex_spots: flexSpots,
      side: side === "A" ? "get" : "send",
      selection_source: selectionSource,
      asset_slug: asset.slug,
      asset_kind: asset.kind,
      asset_position: asset.position,
      asset_value: asset.value,
    });
  };

  const removeAsset = (side: "A" | "B", assetId: string) => {
    const asset = (side === "A" ? sideA : sideB).find((item) => item.id === assetId);
    if (side === "A") setSideA((current) => current.filter((asset) => asset.id !== assetId));
    else setSideB((current) => current.filter((asset) => asset.id !== assetId));
    if (asset) {
      captureAnalytics("trade_asset_removed", {
        calculator_format: format,
        passing_td_points: passingTdPoints,
        reception_points: receptionPoints,
        rb_starters: rbStarters,
        wr_starters: wrStarters,
        te_starters: teStarters,
        flex_spots: flexSpots,
        side: side === "A" ? "get" : "send",
        asset_slug: asset.slug,
        asset_kind: asset.kind,
        asset_position: asset.position,
      });
    }
  };

  const reset = () => {
    captureAnalytics("trade_reset", {
      calculator_format: format,
      passing_td_points: passingTdPoints,
      reception_points: receptionPoints,
      rb_starters: rbStarters,
      wr_starters: wrStarters,
      te_starters: teStarters,
      flex_spots: flexSpots,
      get_asset_count: sideA.length,
      send_asset_count: sideB.length,
      had_complete_trade: sideA.length > 0 && sideB.length > 0,
    });
    setSideA([]);
    setSideB([]);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const share = async () => {
    if (evaluation.status === "incomplete") return;

    const params = buildTradeShareParams({
      format,
      numQbs,
      tep,
      numTeams,
      passingTdPoints,
      receptionPoints,
      rbStarters,
      wrStarters,
      teStarters,
      flexSpots,
      rosterPremium,
      sideA,
      sideB,
    });
    const editorUrl = new URL(window.location.href);
    editorUrl.search = params.toString();
    window.history.replaceState({}, "", editorUrl);

    const shareSlug = buildTradeShareSlug(sideA, sideB);
    const reportUrl = new URL(`/trades/${shareSlug}`, window.location.origin);
    reportUrl.search = params.toString();
    await navigator.clipboard.writeText(reportUrl.toString());
    captureAnalytics("trade_shared", {
      calculator_format: format,
      num_qbs: numQbs,
      te_premium: tep,
      league_size: numTeams,
      passing_td_points: passingTdPoints,
      reception_points: receptionPoints,
      rb_starters: rbStarters,
      wr_starters: wrStarters,
      te_starters: teStarters,
      flex_spots: flexSpots,
      roster_cost_enabled: rosterPremium,
      get_asset_count: sideA.length,
      send_asset_count: sideB.length,
      verdict: evaluation.status,
      percent_difference: evaluation.percentDifference,
      share_destination: "trade_report",
      share_slug: shareSlug,
    });
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
        setFormat={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "format",
            previous_value: format,
            selected_value: value,
          });
          setFormat(value);
        }}
        numQbs={numQbs}
        setNumQbs={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "num_qbs",
            previous_value: numQbs,
            selected_value: value,
          });
          setNumQbs(value);
        }}
        tep={tep}
        setTep={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "te_premium",
            previous_value: tep,
            selected_value: value,
          });
          setTep(value);
        }}
        numTeams={numTeams}
        setNumTeams={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "league_size",
            previous_value: numTeams,
            selected_value: value,
          });
          setNumTeams(value);
        }}
        passingTdPoints={passingTdPoints}
        setPassingTdPoints={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "passing_td_points",
            previous_value: passingTdPoints,
            selected_value: value,
          });
          setPassingTdPoints(value);
        }}
        receptionPoints={receptionPoints}
        setReceptionPoints={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "reception_points",
            previous_value: receptionPoints,
            selected_value: value,
          });
          setReceptionPoints(value);
        }}
        rbStarters={rbStarters}
        setRbStarters={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "rb_starters",
            previous_value: rbStarters,
            selected_value: value,
          });
          setRbStarters(value);
        }}
        wrStarters={wrStarters}
        setWrStarters={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "wr_starters",
            previous_value: wrStarters,
            selected_value: value,
          });
          setWrStarters(value);
        }}
        teStarters={teStarters}
        setTeStarters={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "te_starters",
            previous_value: teStarters,
            selected_value: value,
          });
          setTeStarters(value);
        }}
        flexSpots={flexSpots}
        setFlexSpots={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "flex_spots",
            previous_value: flexSpots,
            selected_value: value,
          });
          setFlexSpots(value);
        }}
        rosterPremium={rosterPremium}
        setRosterPremium={(value) => {
          captureAnalytics("trade_setting_changed", {
            setting: "roster_cost",
            previous_value: rosterPremium,
            selected_value: value,
          });
          setRosterPremium(value);
        }}
      />

      {error ? (
        <div className="m-5 border border-[#ff6b3d] bg-[#2d1e18] p-6 sm:m-8">
          <p className="font-bold text-[#ffb49d]">{error}</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-[#171c19]"
            onClick={() => {
              captureAnalytics("calculator_market_retry", {
                calculator_format: format,
                num_qbs: numQbs,
                passing_td_points: passingTdPoints,
                reception_points: receptionPoints,
                rb_starters: rbStarters,
                wr_starters: wrStarters,
                te_starters: teStarters,
                flex_spots: flexSpots,
              });
              setReloadKey((value) => value + 1);
            }}
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
                captureAnalytics("trade_sides_swapped", {
                  calculator_format: format,
                  get_asset_count: sideA.length,
                  send_asset_count: sideB.length,
                });
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
            onAddSuggestion={(side, asset) =>
              addAsset(side, asset, "balance_suggestion")
            }
          />
        </>
      )}

      <div className="flex flex-col gap-4 border-t border-white/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-xs text-white/50">
          {market ? (
            <>
              {market.meta.assetCount} assets · {passingTdPoints}PT pass TD · {pprLabel(receptionPoints)} · {flexSpots} FLEX ·{" "}
              {market.meta.scoring.coveredCount}/{market.meta.scoring.playerCount} players modeled · Updated {formatDate(market.meta.generatedAt)} ·{" "}
              <a
                href="/scoring-impact"
                className="text-[#dfff4f] underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                Explore scoring impact
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
            disabled={evaluation.status === "incomplete"}
            title={evaluation.status === "incomplete" ? "Add at least one asset to each side" : "Copy a dedicated trade report link"}
            className="inline-flex items-center gap-2 bg-[#dfff4f] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-[#dfff4f]"
          >
            {copied ? <FiCheck /> : <FiShare2 />}
            {copied ? "Report copied" : "Share trade report"}
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
  passingTdPoints,
  setPassingTdPoints,
  receptionPoints,
  setReceptionPoints,
  rbStarters,
  setRbStarters,
  wrStarters,
  setWrStarters,
  teStarters,
  setTeStarters,
  flexSpots,
  setFlexSpots,
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
  passingTdPoints: PassingTdPoints;
  setPassingTdPoints: (value: PassingTdPoints) => void;
  receptionPoints: ReceptionPoints;
  setReceptionPoints: (value: ReceptionPoints) => void;
  rbStarters: RosterSettings["rbStarters"];
  setRbStarters: (value: RosterSettings["rbStarters"]) => void;
  wrStarters: RosterSettings["wrStarters"];
  setWrStarters: (value: RosterSettings["wrStarters"]) => void;
  teStarters: RosterSettings["teStarters"];
  setTeStarters: (value: RosterSettings["teStarters"]) => void;
  flexSpots: RosterSettings["flexSpots"];
  setFlexSpots: (value: RosterSettings["flexSpots"]) => void;
  rosterPremium: boolean;
  setRosterPremium: (value: boolean) => void;
}) {
  return (
    <div className="border-b border-white/20 bg-white/[0.035]">
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-8 xl:grid-cols-3 xl:items-end">
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
          help="Superflex treats roughly two quarterbacks per team as starters, so replacement level is deeper and scarce quarterbacks carry more market value."
          options={[
            ["1", "1QB"],
            ["2", "Superflex"],
          ]}
          value={String(numQbs)}
          onChange={(value) => setNumQbs(value === "1" ? 1 : 2)}
        />
        <Segmented
          label="Passing TD"
          help="Four points is the baseline. Six-point scoring adds two raw points per passing touchdown, then compares each quarterback’s change with the replacement quarterback for this league. Passing-TD-heavy QBs usually gain more than rushing-first QBs."
          options={[
            ["4", "4 points"],
            ["6", "6 points"],
          ]}
          value={String(passingTdPoints)}
          onChange={(value) => setPassingTdPoints(value === "6" ? 6 : 4)}
        />
        <Segmented
          label="Receptions"
          help="PPR means points per reception. Standard awards 0 points per catch, Half PPR awards 0.5, and Full PPR awards 1. Receiving yards and touchdowns score the same in all three. Values move by production relative to replacement at the same position."
          options={[
            ["0", "Standard"],
            ["0.5", "Half PPR"],
            ["1", "Full PPR"],
          ]}
          value={String(receptionPoints)}
          onChange={(value) => setReceptionPoints(Number(value) as ReceptionPoints)}
        />
        <div className="grid gap-2">
          <span className="inline-flex items-center gap-1.5">
            <label htmlFor="trade-league-size" className="mono-label text-white/50">League size</label>
            <InfoTooltip label="league size">
              League size changes the positional replacement line. More teams push replacement deeper, making scarce starters harder to replace.
            </InfoTooltip>
          </span>
          <select
            id="trade-league-size"
            value={numTeams}
            onChange={(event) => setNumTeams(Number(event.target.value))}
            className="h-[42px] border border-white/25 bg-[#171c19] px-3 text-sm text-white"
          >
            {[8, 10, 12, 14, 16].map((count) => (
              <option key={count} value={count}>{count} teams</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 sm:self-end xl:justify-end">
          <Toggle active={tep} onClick={() => setTep(!tep)} label="TE premium" />
          <Toggle
            active={rosterPremium}
            onClick={() => setRosterPremium(!rosterPremium)}
            label="Roster cost"
          />
        </div>
      </div>
      <details className="border-t border-white/10 px-5 py-3 sm:px-8">
        <summary className="cursor-pointer list-none font-mono text-[10px] font-black uppercase tracking-[0.08em] text-white/65 marker:hidden hover:text-white">
          <span className="inline-flex items-center gap-2">
            Roster shape
            <span className="text-[#8bcfff]">{rbStarters} RB · {wrStarters} WR · {teStarters} TE · {flexSpots} FLEX</span>
          </span>
        </summary>
        <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <Segmented
            label="Starting RB"
            help="Dedicated RB starters set the first layer of running-back demand before FLEX spots are assigned."
            options={[["1", "1 RB"], ["2", "2 RB"], ["3", "3 RB"]]}
            value={String(rbStarters)}
            onChange={(value) => setRbStarters(Number(value) as RosterSettings["rbStarters"])}
          />
          <Segmented
            label="Starting WR"
            help="Dedicated WR starters set the first layer of wide-receiver demand before FLEX spots are assigned."
            options={[["2", "2 WR"], ["3", "3 WR"], ["4", "4 WR"]]}
            value={String(wrStarters)}
            onChange={(value) => setWrStarters(Number(value) as RosterSettings["wrStarters"])}
          />
          <Segmented
            label="Starting TE"
            help="A second required tight end pushes TE replacement much deeper. TE premium still controls the underlying market format."
            options={[["1", "1 TE"], ["2", "2 TE"]]}
            value={String(teStarters)}
            onChange={(value) => setTeStarters(Number(value) as RosterSettings["teStarters"])}
          />
          <Segmented
            label="FLEX spots"
            help="FLEX does not change fantasy points. Each extra spot increases starter demand and pushes replacement deeper across the highest-valued eligible RBs, WRs, and TEs."
            options={[["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]}
            value={String(flexSpots)}
            onChange={(value) => setFlexSpots(Number(value) as RosterSettings["flexSpots"])}
          />
        </div>
      </details>
      <div className="flex items-start gap-2 border-t border-white/10 px-5 py-3 text-[11px] leading-5 text-white/50 sm:px-8">
        <FiInfo className="mt-0.5 shrink-0 text-[#8bcfff]" aria-hidden="true" />
        <p>
          <strong className="text-white/75">Selected: {passingTdPoints}-point passing TD + {pprLabel(receptionPoints)} · {rbStarters} RB / {wrStarters} WR / {teStarters} TE / {flexSpots} FLEX.</strong>{" "}
          Players move only when their scoring change differs from a replacement player at the same position; picks do not move.{" "}
          <a href="/methodology#league-scoring" className="text-[#dfff4f] underline decoration-white/25 underline-offset-2 hover:text-white">See the exact math.</a>
        </p>
      </div>
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
  help,
}: {
  label: string;
  options: string[][];
  value: string;
  onChange: (value: string) => void;
  help?: string;
}) {
  return (
    <div className="grid gap-2">
      <span className="inline-flex items-center gap-1.5">
        <span className="mono-label text-white/50">{label}</span>
        {help ? <InfoTooltip label={label}>{help}</InfoTooltip> : null}
      </span>
      <div
        className="grid border border-white/25 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={value === optionValue}
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
                <AssetThumbnail asset={asset} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{asset.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase text-[#69706c]">
                    {asset.position}{asset.team ? ` · ${asset.team}` : ""}{asset.age ? ` · ${asset.age.toFixed(1)} y.o.` : ""}
                  </span>
                </span>
                <span className={`px-2 py-1 text-right font-mono ${accent === "acid" ? "bg-[#dfff4f]" : "bg-[#ffb29a]"}`}>
                  <span className="block text-xs font-black">{asset.value}</span>
                  <ScoringDelta asset={asset} className="text-[8px] text-[#171c19]/65" />
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
      <AssetThumbnail asset={asset} onDark />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{asset.name}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase text-white/40">
          {asset.team || asset.tier || "Draft capital"}{asset.age ? ` · ${asset.age.toFixed(1)} y.o.` : ""}
        </p>
      </div>
      <span className="text-right font-mono tabular-nums">
        <span className="block text-sm font-black">{asset.value}</span>
        <ScoringDelta asset={asset} className="text-[9px] text-white/45" />
      </span>
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
                <FiPlus />
                <AssetThumbnail asset={asset} compact onDark />
                {asset.name}{" "}
                <span className="text-right font-mono text-white/40">
                  {asset.value}
                  <ScoringDelta asset={asset} className="block text-[8px]" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetThumbnail({
  asset,
  compact = false,
  onDark = false,
}: {
  asset: MarketAsset;
  compact?: boolean;
  onDark?: boolean;
}) {
  const playerImage = asset.kind === "player" ? getTradePlayerImage(asset.slug) : undefined;
  const initials = asset.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  const dimensions = compact ? "h-8 w-7" : "h-11 w-10";
  const border = onDark ? "border-white/30" : "border-[#171c19]";

  return (
    <span
      className={`relative grid ${dimensions} shrink-0 place-items-center overflow-hidden border ${border} ${playerImage ? "bg-[#dedbd1]" : positionColor(asset.position)}`}
      aria-hidden="true"
    >
      {playerImage ? (
        <PlayerPortrait
          slug={asset.slug}
          name={asset.name}
          image={playerImage}
          position={asset.position}
          team={asset.team}
          variant="thumbnail"
          sizes={compact ? "28px" : "40px"}
          decorative
        />
      ) : (
        <span className="font-mono text-[10px] font-black tracking-[-0.05em] text-[#171c19]">
          {asset.kind === "pick" ? asset.year?.slice(-2) || "PK" : initials || asset.position}
        </span>
      )}
      <span className={`absolute bottom-0 right-0 border-l border-t border-[#171c19] px-1 font-mono text-[7px] font-black leading-3 text-[#171c19] ${positionColor(asset.position)}`}>
        {asset.position}
      </span>
    </span>
  );
}

function positionColor(position: MarketAsset["position"]) {
  if (position === "QB") return "bg-[#8bcfff]";
  if (position === "RB") return "bg-[#ffb29a]";
  if (position === "WR") return "bg-[#dfff4f]";
  if (position === "TE") return "bg-[#d7b6ff]";
  return "bg-white";
}

function ScoringDelta({ asset, className }: { asset: MarketAsset; className: string }) {
  const delta = asset.scoringContext?.valueDelta || 0;
  if (!delta) return null;
  const direction = delta > 0 ? "above" : "below";
  const explanation = `Base market value ${asset.baseValue ?? asset.value}. This league value is ${Math.abs(delta)} points ${direction} the base after comparing the player’s selected-scoring production with replacement at ${asset.position}.`;
  return (
    <span
      className={`${className} cursor-help underline decoration-dotted underline-offset-2`}
      title={explanation}
      aria-label={explanation}
    >
      {delta > 0 ? "+" : ""}{delta} league
    </span>
  );
}

function InfoTooltip({ label, children }: { label: string; children: string }) {
  const id = useId();
  return (
    <span className="group relative inline-flex normal-case">
      <button
        type="button"
        aria-label={`Explain ${label}`}
        aria-describedby={id}
        onClick={() => captureAnalytics("trade_help_opened", { help_topic: label })}
        className="grid h-5 w-5 place-items-center rounded-full border border-white/25 text-white/50 hover:border-[#8bcfff] hover:text-[#8bcfff] focus-visible:border-[#8bcfff] focus-visible:text-[#8bcfff] focus-visible:outline-none"
      >
        <FiInfo size={12} aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-7 z-50 w-[min(18rem,calc(100vw-2.5rem))] border border-white/20 bg-[#090c0a] p-3 font-sans text-[11px] font-medium leading-5 text-white opacity-0 shadow-[4px_4px_0_#8bcfff] transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

function pprLabel(points: ReceptionPoints) {
  if (points === 0) return "Standard";
  if (points === 0.5) return "Half PPR";
  return "Full PPR";
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
