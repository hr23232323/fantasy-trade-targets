import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "../src/app/components/PosthogProvider.tsx",
  "../src/app/components/TradeCalculator.tsx",
  "../src/app/components/TradeReceiptActions.tsx",
  "../src/app/components/MarketBoard.tsx",
  "../src/app/components/SiteHeader.tsx",
  "../src/app/components/Footer.tsx",
  "../src/app/components/TeamMap.tsx",
  "../src/app/components/AnalyticsPageView.tsx",
  "../src/app/components/TrackedLink.tsx",
  "../src/app/create-meme/page.tsx",
  "../src/app/market/page.tsx",
  "../src/app/players/[slug]/page.tsx",
  "../src/app/teams/[slug]/page.tsx",
  "../src/app/trades/[slug]/page.tsx",
];

const source = (
  await Promise.all(
    files.map((file) => readFile(new URL(file, import.meta.url), "utf8")),
  )
).join("\n");

const provider = await readFile(
  new URL("../src/app/components/PosthogProvider.tsx", import.meta.url),
  "utf8",
);
const marketBoard = await readFile(
  new URL("../src/app/components/MarketBoard.tsx", import.meta.url),
  "utf8",
);
const memePage = await readFile(
  new URL("../src/app/create-meme/page.tsx", import.meta.url),
  "utf8",
);

test("PostHog follows SPA navigation with privacy-safe replay", () => {
  assert.match(provider, /defaults: "2026-05-30"/);
  assert.match(provider, /capture_pageview: "history_change"/);
  assert.match(provider, /capture_pageleave: true/);
  assert.match(provider, /respect_dnt: true/);
  assert.match(provider, /disable_session_recording: false/);
  assert.match(provider, /session_recording: \{/);
  assert.match(provider, /maskAllInputs: true/);
  assert.match(provider, /persistence: "localStorage"/);
  assert.match(provider, /element_allowlist: \["a", "button", "form", "select"\]/);
  assert.doesNotMatch(provider, /element_allowlist:[^\n]*"input"/);
  assert.doesNotMatch(provider, /element_allowlist:[^\n]*"textarea"/);
});

test("high-value product events remain instrumented", () => {
  const events = [
    "calculator_market_loaded",
    "calculator_market_load_failed",
    "calculator_market_retry",
    "trade_asset_added",
    "trade_asset_removed",
    "trade_setting_changed",
    "trade_evaluated",
    "trade_sides_swapped",
    "trade_reset",
    "trade_shared",
    "trade_report_viewed",
    "trade_report_shared",
    "trade_report_edit_opened",
    "market_board_viewed",
    "market_hub_viewed",
    "market_board_load_failed",
    "market_search_used",
    "market_filter_changed",
    "market_results_expanded",
    "market_asset_opened",
    "player_research_viewed",
    "team_research_viewed",
    "team_player_opened",
    "team_map_selected",
    "research_cta_clicked",
    "research_downloaded",
    "memes_generated",
    "meme_generation_failed",
    "meme_download_opened",
    "site_navigation_clicked",
    "mobile_navigation_toggled",
  ];

  for (const event of events) {
    assert.match(source, new RegExp(`["]${event}["]`), `${event} is tracked`);
  }
});

test("custom search and meme events exclude free-form text", () => {
  const searchCapture = marketBoard.slice(
    marketBoard.indexOf('captureAnalytics("market_search_used"'),
    marketBoard.indexOf('captureAnalytics("market_search_used"') + 500,
  );
  assert.match(searchCapture, /query_length/);
  assert.doesNotMatch(searchCapture, /query_text|search_query|normalized:/);

  const memeCapture = memePage.slice(
    memePage.indexOf('captureAnalytics("memes_generated"'),
    memePage.indexOf('captureAnalytics("memes_generated"') + 300,
  );
  assert.match(memeCapture, /target_length/);
  assert.match(memeCapture, /offer_length/);
  assert.doesNotMatch(memeCapture, /\bgive\s*[:,]|\bsend\s*[:,]/);
});
