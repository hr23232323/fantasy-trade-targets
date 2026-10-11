"use client";

import { useMemo, useState } from "react";
import { captureAnalytics } from "../lib/analytics";
import { convertOddsInput, twoWayMarket } from "../lib/odds-math.mjs";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function OddsCalculator() {
  const [format, setFormat] = useState<"american" | "decimal" | "fractional">("american");
  const [oddsInput, setOddsInput] = useState("-110");
  const [stake, setStake] = useState(100);
  const [otherOdds, setOtherOdds] = useState(-110);
  const conversion = useMemo(() => convertOddsInput(oddsInput, format), [oddsInput, format]);
  const profit = conversion && Number.isFinite(stake) && stake >= 0 ? stake * (conversion.decimal - 1) : null;
  const market = useMemo(() => conversion?.american === null || conversion?.american === undefined ? null : twoWayMarket(conversion.american, otherOdds), [conversion, otherOdds]);

  function track(mode: "odds" | "format" | "stake" | "other_odds") {
    captureAnalytics("odds_calculator_changed", { input: mode });
  }

  function changeFormat(next: "american" | "decimal" | "fractional") {
    if (conversion) {
      if (next === "american") setOddsInput(String(conversion.american));
      if (next === "decimal") setOddsInput(String(Number(conversion.decimal.toFixed(4))));
      if (next === "fractional") setOddsInput(conversion.fractional?.label ?? "");
    }
    setFormat(next);
    track("format");
  }

  const inputLabel = format === "american" ? "American odds" : format === "decimal" ? "Decimal odds" : "Fractional odds";
  const placeholder = format === "american" ? "-110" : format === "decimal" ? "1.91" : "10/11";
  const american = conversion?.american === null || conversion?.american === undefined ? "—" : `${conversion.american > 0 ? "+" : ""}${conversion.american}`;

  return <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
    <section className="border border-[#171c19] bg-white p-6 shadow-[6px_6px_0_#171c19] sm:p-8">
      <span className="eyebrow">Single bet</span>
      <div className="mt-6 grid grid-cols-3 gap-px border border-[#171c19] bg-[#171c19]" aria-label="Odds format">{(["american", "decimal", "fractional"] as const).map((option) => <button key={option} type="button" aria-pressed={format === option} onClick={() => changeFormat(option)} className={`px-3 py-3 font-mono text-[10px] font-black uppercase ${format === option ? "bg-[#dfff4f]" : "bg-white hover:bg-[#f1f8d4]"}`}>{option}</button>)}</div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="font-mono text-[10px] font-black uppercase">{inputLabel}
          <input aria-label={inputLabel} type="text" inputMode={format === "fractional" ? "text" : "decimal"} value={oddsInput} placeholder={placeholder} onChange={(event) => { setOddsInput(event.target.value); track("odds"); }} className="mt-2 w-full border border-[#171c19] bg-[#f4f1e8] px-4 py-4 text-2xl font-black outline-none focus:ring-4 focus:ring-[#dfff4f]" />
        </label>
        <label className="font-mono text-[10px] font-black uppercase">Stake
          <div className="mt-2 flex border border-[#171c19] bg-[#f4f1e8] focus-within:ring-4 focus-within:ring-[#dfff4f]"><span className="px-4 py-4 text-2xl font-black">$</span><input aria-label="Stake" type="number" min="0" step="1" value={stake} onChange={(event) => { setStake(Number(event.target.value)); track("stake"); }} className="min-w-0 flex-1 bg-transparent py-4 pr-4 text-2xl font-black outline-none" /></div>
        </label>
      </div>
      {!conversion || profit === null ? <p className="mt-6 border border-[#b23a1b] bg-[#ffb29a] p-4 text-sm font-black">Enter valid {format} odds{format === "fractional" ? " such as 10/11" : ""}.</p> : <div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-2 lg:grid-cols-3">
        <Result label="American odds" value={american} />
        <Result label="Decimal odds" value={conversion.decimal.toFixed(3)} />
        <Result label="Fractional odds" value={conversion.fractional?.label ?? "—"} />
        <Result label="Implied probability" value={`${(conversion.impliedProbability * 100).toFixed(2)}%`} />
        <Result label="Profit" value={money.format(profit)} />
        <Result label="Total payout" value={money.format(stake + profit)} />
      </div>}
      <p className="mt-5 text-xs leading-6 text-[#59605c]">Switch formats without changing the underlying price. The implied percentage includes the sportsbook price; it is not a forecast.</p>
    </section>
    <section className="border border-[#171c19] bg-[#8bcfff] p-6 shadow-[6px_6px_0_#171c19] sm:p-8">
      <span className="eyebrow bg-white">Two-way market</span>
      <h2 className="mt-6 text-3xl font-black tracking-[-0.045em]">Remove the built-in margin.</h2>
      <p className="mt-3 text-sm leading-6 text-[#3d4541]">Add the other side to estimate the market&apos;s no-vig probability for each outcome.</p>
      <label className="mt-6 block font-mono text-[10px] font-black uppercase">Other side&apos;s American odds
        <input aria-label="Other side's American odds" type="number" value={otherOdds} onChange={(event) => { setOtherOdds(Number(event.target.value)); track("other_odds"); }} className="mt-2 w-full border border-[#171c19] bg-white px-4 py-4 text-2xl font-black outline-none focus:ring-4 focus:ring-[#dfff4f]" />
      </label>
      {market ? <div className="mt-6 grid grid-cols-2 gap-px border border-[#171c19] bg-[#171c19]">
        <Result label="First side, no vig" value={`${(market.noVigA * 100).toFixed(2)}%`} />
        <Result label="Other side, no vig" value={`${(market.noVigB * 100).toFixed(2)}%`} />
        <div className="col-span-2 bg-[#dfff4f] p-4"><span className="font-mono text-[9px] font-black uppercase">{market.hold >= 0 ? "Market hold" : "Negative hold"}</span><strong className="mt-1 block text-2xl">{(Math.abs(market.hold) * 100).toFixed(2)}%</strong></div>
      </div> : null}
    </section>
  </div>;
}

function Result({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-4"><span className="font-mono text-[9px] font-black uppercase text-[#59605c]">{label}</span><strong className="mt-2 block text-2xl tracking-[-0.04em]">{value}</strong></div>;
}
