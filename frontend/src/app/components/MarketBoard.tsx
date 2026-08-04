"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiArrowUpRight, FiSearch } from "react-icons/fi";
import { fetchClientMarket } from "../lib/client-market";
import { hasPlayerPage } from "../lib/player-pages";
import type {
  MarketAsset,
  MarketFormat,
  MarketPayload,
  Position,
} from "../types/MarketAsset";

export type MarketBoardProps = {
  format?: MarketFormat;
  numQbs?: 1 | 2;
  heading?: string;
  description?: string;
  initialLimit?: number;
  includePicks?: boolean;
  initialMarket?: MarketPayload | null;
  initialIsPartial?: boolean;
};

const positions: Array<"ALL" | Position> = ["ALL", "QB", "RB", "WR", "TE", "PICK"];

export default function MarketBoard({
  format = "dynasty",
  numQbs = 2,
  heading = "Dynasty trade target finder",
  description = "Search the full market, narrow by roster shape, and turn a player into a trade offer.",
  initialLimit = 40,
  includePicks = true,
  initialMarket = null,
  initialIsPartial = false,
}: MarketBoardProps) {
  const [market, setMarket] = useState<MarketPayload | null>(initialMarket);
  const [isPartial, setIsPartial] = useState(initialIsPartial);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<"ALL" | Position>("ALL");
  const [ageBand, setAgeBand] = useState("all");
  const [limit, setLimit] = useState(initialLimit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialMarket && !initialIsPartial) return;
    let active = true;
    const url = `/api/market?format=${format}&numQbs=${numQbs}&tep=false&numTeams=12`;
    fetchClientMarket(url)
      .then((payload) => {
        if (!active) return;
        setMarket(payload);
        setIsPartial(false);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          initialMarket
            ? "Showing the latest server-rendered leaders while the full market reloads."
            : "Rankings are temporarily unavailable. Please refresh shortly.",
        );
      });
    return () => {
      active = false;
    };
  }, [format, initialIsPartial, initialMarket, numQbs]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (market?.assets || [])
      .filter((asset) => includePicks || asset.kind !== "pick")
      .filter((asset) => position === "ALL" || asset.position === position)
      .filter((asset) => {
        if (asset.kind === "pick" || ageBand === "all") return true;
        if (ageBand === "u25") return (asset.age || 100) < 25;
        if (ageBand === "25-29") return (asset.age || 0) >= 25 && (asset.age || 100) < 30;
        return (asset.age || 0) >= 30;
      })
      .filter((asset) =>
        normalized
          ? `${asset.name} ${asset.team || ""} ${asset.position}`.toLowerCase().includes(normalized)
          : true,
      );
  }, [ageBand, includePicks, market, position, query]);

  return (
    <section className="paper-card">
      <div className="border-b border-[#171c19] p-5 sm:p-8">
        <span className="mono-label text-[#69706c]">Market board // daily</span>
        <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <h2 className="section-title max-w-2xl">{heading}</h2>
          <p className="max-w-xl text-sm leading-6 text-[#69706c]">{description}</p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-[#171c19] bg-[#e7e2d5] p-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="relative block">
          <span className="mono-label mb-2 block text-[#69706c]">Player search</span>
          <FiSearch className="absolute bottom-3.5 left-3 text-[#69706c]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by player or team…"
            className="h-12 w-full border border-[#171c19] bg-white pl-10 pr-4 text-sm font-semibold"
          />
        </label>
        <div>
          <span className="mono-label mb-2 block text-[#69706c]">Position</span>
          <div className="flex flex-wrap border border-[#171c19] bg-white p-1">
            {positions
              .filter((item) => includePicks || item !== "PICK")
              .map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setPosition(item)}
                  className={`px-3 py-2 font-mono text-[10px] font-bold ${
                    position === item ? "bg-[#171c19] text-white" : "hover:bg-[#e7e2d5]"
                  }`}
                >
                  {item}
                </button>
              ))}
          </div>
        </div>
        <label>
          <span className="mono-label mb-2 block text-[#69706c]">Age band</span>
          <select
            value={ageBand}
            onChange={(event) => setAgeBand(event.target.value)}
            className="h-12 border border-[#171c19] bg-white px-3 text-sm font-bold"
          >
            <option value="all">Any age</option>
            <option value="u25">Under 25</option>
            <option value="25-29">25–29</option>
            <option value="30+">30+</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#171c19] bg-white/50 font-mono text-[10px] uppercase tracking-[0.08em] text-[#69706c]">
              <th className="w-16 px-4 py-3">Rank</th>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Pos.</th>
              <th className="px-4 py-3">Age / class</th>
              <th className="px-4 py-3 text-right">Market score</th>
              <th className="w-44 px-4 py-3 text-right">Build offer</th>
            </tr>
          </thead>
          <tbody>
            {!market && !error
              ? Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#c9c5ba]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-10 animate-pulse bg-[#dedbd1]" />
                    </td>
                  </tr>
                ))
              : filtered.slice(0, limit).map((asset, index) => (
                  <MarketRow
                    key={asset.id}
                    asset={asset}
                    displayRank={asset.rank || index + 1}
                    format={format}
                    numQbs={numQbs}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {error && <p className="p-6 text-sm font-bold text-[#a23616]">{error}</p>}

      {market && !filtered.length && (
        <p className="p-10 text-center text-sm text-[#69706c]">No players match those filters.</p>
      )}

      {filtered.length > limit && (
        <div className="border-t border-[#171c19] p-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((value) => value + 40)}
            className="border border-[#171c19] bg-[#dfff4f] px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.07em] shadow-[3px_3px_0_#171c19] hover:bg-white"
          >
            Show 40 more
          </button>
        </div>
      )}

      {market && (
        <div className="flex flex-col gap-2 border-t border-[#171c19] bg-[#171c19] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.06em] text-white/50 sm:flex-row sm:justify-between">
          <span>
            {isPartial
              ? `Showing ${filtered.length} of ${market.meta.assetCount} assets`
              : `${filtered.length} matching assets`}
          </span>
          <Link
            href="/data-sources"
            className="text-[#dfff4f] hover:text-white"
          >
            Data & methodology →
          </Link>
        </div>
      )}
    </section>
  );
}

function MarketRow({
  asset,
  displayRank,
  format,
  numQbs,
}: {
  asset: MarketAsset;
  displayRank: number;
  format: MarketFormat;
  numQbs: 1 | 2;
}) {
  const calculatorPath = format === "dynasty" ? "/dynasty-trade-calculator" : "/fantasy-football-trade-analyzer";
  const params = new URLSearchParams({ get: asset.id, qbs: String(numQbs), format });

  return (
    <tr className="group border-b border-[#c9c5ba] bg-white/25 transition-colors hover:bg-white">
      <td className="px-4 py-3 font-mono text-xs font-black text-[#69706c]">#{displayRank}</td>
      <td className="px-4 py-3">
        {asset.kind === "player" && hasPlayerPage(asset.slug) ? (
          <Link
            href={`/players/${asset.slug}`}
            className="block font-bold underline decoration-[#ff6b3d] decoration-2 underline-offset-4 hover:text-[#a23616]"
          >
            {asset.name}
          </Link>
        ) : (
          <span className="block font-bold">{asset.name}</span>
        )}
        <span className="mt-0.5 block font-mono text-[10px] uppercase text-[#69706c]">
          {asset.team || asset.tier || "Draft pick"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex min-w-11 justify-center px-2 py-1 font-mono text-[10px] font-black ${positionClass(asset.position)}`}>
          {asset.position}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-[#69706c]">
        {asset.age ? `${asset.age.toFixed(1)} y.o.` : asset.year || "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono text-lg font-black tabular-nums">{asset.value}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`${calculatorPath}?${params}`}
          className="inline-flex items-center gap-2 border border-[#171c19] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.05em] group-hover:bg-[#dfff4f]"
        >
          Trade for {asset.kind === "pick" ? "pick" : asset.name.split(" ").at(-1)} <FiArrowUpRight />
        </Link>
      </td>
    </tr>
  );
}

function positionClass(position: Position) {
  if (position === "QB") return "bg-[#8bcfff]";
  if (position === "RB") return "bg-[#ffb29a]";
  if (position === "WR") return "bg-[#dfff4f]";
  if (position === "TE") return "bg-[#d7b6ff]";
  return "bg-[#171c19] text-white";
}
