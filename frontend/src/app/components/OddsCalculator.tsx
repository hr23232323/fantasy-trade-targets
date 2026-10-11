"use client";

import { useMemo, useState } from "react";
import { captureAnalytics } from "../lib/analytics";
import { decimalOdds, impliedProbability, profitForStake, twoWayMarket } from "../lib/odds-math.mjs";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function OddsCalculator() {
  const [odds, setOdds] = useState(-110);
  const [stake, setStake] = useState(100);
  const [otherOdds, setOtherOdds] = useState(-110);
  const probability = impliedProbability(odds);
  const decimal = decimalOdds(odds);
  const profit = profitForStake(odds, stake);
  const market = useMemo(() => twoWayMarket(odds, otherOdds), [odds, otherOdds]);

  function track(mode: "odds" | "stake" | "other_odds") {
    captureAnalytics("odds_calculator_changed", { input: mode });
  }

  return <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
    <section className="border border-[#171c19] bg-white p-6 shadow-[6px_6px_0_#171c19] sm:p-8">
      <span className="eyebrow">Single bet</span>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="font-mono text-[10px] font-black uppercase">American odds
          <input aria-label="American odds" type="number" value={odds} onChange={(event) => { setOdds(Number(event.target.value)); track("odds"); }} className="mt-2 w-full border border-[#171c19] bg-[#f4f1e8] px-4 py-4 text-2xl font-black outline-none focus:ring-4 focus:ring-[#dfff4f]" />
        </label>
        <label className="font-mono text-[10px] font-black uppercase">Stake
          <div className="mt-2 flex border border-[#171c19] bg-[#f4f1e8] focus-within:ring-4 focus-within:ring-[#dfff4f]"><span className="px-4 py-4 text-2xl font-black">$</span><input aria-label="Stake" type="number" min="0" step="1" value={stake} onChange={(event) => { setStake(Number(event.target.value)); track("stake"); }} className="min-w-0 flex-1 bg-transparent py-4 pr-4 text-2xl font-black outline-none" /></div>
        </label>
      </div>
      {probability === null || decimal === null || profit === null ? <p className="mt-6 border border-[#b23a1b] bg-[#ffb29a] p-4 text-sm font-black">Enter American odds of +100 or higher, or −100 or lower.</p> : <div className="mt-7 grid gap-px border border-[#171c19] bg-[#171c19] sm:grid-cols-3">
        <Result label="Implied probability" value={`${(probability * 100).toFixed(2)}%`} />
        <Result label="Profit" value={money.format(profit)} />
        <Result label="Total payout" value={money.format(stake + profit)} />
      </div>}
      <p className="mt-5 text-xs leading-6 text-[#59605c]">Decimal odds: <strong>{decimal?.toFixed(3) ?? "—"}</strong>. The implied percentage includes the sportsbook price; it is not a forecast.</p>
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
        <div className="col-span-2 bg-[#dfff4f] p-4"><span className="font-mono text-[9px] font-black uppercase">Market hold</span><strong className="mt-1 block text-2xl">{(market.hold * 100).toFixed(2)}%</strong></div>
      </div> : null}
    </section>
  </div>;
}

function Result({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-4"><span className="font-mono text-[9px] font-black uppercase text-[#59605c]">{label}</span><strong className="mt-2 block text-2xl tracking-[-0.04em]">{value}</strong></div>;
}
