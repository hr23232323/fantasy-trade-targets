"use client";

import Link from "next/link";
import { useState } from "react";
import { FiCheck, FiEdit3, FiShare2 } from "react-icons/fi";
import { captureAnalytics } from "../lib/analytics";
import type { PassingTdPoints, ReceptionPoints } from "../types/MarketAsset";
import type { RosterSettings } from "../types/MarketAsset";

export default function TradeReceiptActions({
  title,
  editHref,
  format,
  sideACount,
  sideBCount,
  verdict,
  passingTdPoints,
  receptionPoints,
  rbStarters,
  wrStarters,
  teStarters,
  flexSpots,
}: {
  title: string;
  editHref: string;
  format: string;
  sideACount: number;
  sideBCount: number;
  verdict: string;
  passingTdPoints: PassingTdPoints;
  receptionPoints: ReceptionPoints;
} & RosterSettings) {
  const [shared, setShared] = useState(false);

  const share = async () => {
    const properties = {
      calculator_format: format,
      passing_td_points: passingTdPoints,
      reception_points: receptionPoints,
      rb_starters: rbStarters,
      wr_starters: wrStarters,
      te_starters: teStarters,
      flex_spots: flexSpots,
      side_a_asset_count: sideACount,
      side_b_asset_count: sideBCount,
      verdict,
    };

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} fantasy trade`,
          text: "See the market-value breakdown for this fantasy trade.",
          url: window.location.href,
        });
        captureAnalytics("trade_report_shared", {
          ...properties,
          share_method: "native",
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        captureAnalytics("trade_report_shared", {
          ...properties,
          share_method: "clipboard",
        });
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await navigator.clipboard.writeText(window.location.href);
      captureAnalytics("trade_report_shared", {
        ...properties,
        share_method: "clipboard_fallback",
      });
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 border border-[#171c19] bg-[#dfff4f] px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] shadow-[4px_4px_0_#171c19] hover:bg-white"
      >
        {shared ? <FiCheck /> : <FiShare2 />}
        {shared ? "Shared" : "Share this trade"}
      </button>
      <Link
        href={editHref}
        onClick={() =>
          captureAnalytics("trade_report_edit_opened", {
            calculator_format: format,
            passing_td_points: passingTdPoints,
            reception_points: receptionPoints,
            rb_starters: rbStarters,
            wr_starters: wrStarters,
            te_starters: teStarters,
            flex_spots: flexSpots,
            side_a_asset_count: sideACount,
            side_b_asset_count: sideBCount,
            verdict,
          })
        }
        className="inline-flex items-center gap-2 border border-[#171c19] bg-white px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.07em] text-[#171c19] hover:bg-[#8bcfff]"
      >
        <FiEdit3 /> Edit in calculator
      </Link>
    </div>
  );
}
