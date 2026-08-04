# Product analytics

Fantasy Trade Target uses PostHog for privacy-conscious, anonymous product analytics. The browser key and host are supplied by the production environment through `/api/posthog-config`; analytics stays disabled when that configuration is absent.

## Collection policy

- PostHog page views follow Next.js history changes, including client-side navigation.
- Page leaves, Web Vitals/performance, JavaScript exceptions, heatmaps, and restricted autocapture are enabled.
- Session replay is enabled, with all input and textarea values masked in the browser before replay data is sent.
- PostHog persistence uses browser local storage, not cookies.
- Browser Do Not Track is honored.
- Autocapture is restricted to links, buttons, forms, and selects. Text inputs and textareas are excluded.
- Custom events never include market-search phrases, meme-generator text, names, emails, or other free-form user input.
- Every custom event includes `app_name=fantasy_trade_target` and `analytics_schema_version=1`.

## Custom event dictionary

| Area | Event | Meaning |
| --- | --- | --- |
| Calculator | `calculator_market_loaded` | A usable market release reached the calculator. |
| Calculator | `calculator_market_load_failed` | The calculator market request failed. |
| Calculator | `calculator_market_retry` | A visitor retried a failed market request. |
| Calculator | `trade_asset_added` | A player or pick was added, including side and selection source. |
| Calculator | `trade_asset_removed` | An asset was removed. |
| Calculator | `trade_setting_changed` | A league or model setting was changed by the visitor. |
| Calculator | `trade_evaluated` | Both sides produced a distinct, complete trade evaluation. |
| Calculator | `trade_sides_swapped` | The get/send sides were swapped. |
| Calculator | `trade_reset` | The trade was cleared. |
| Calculator | `trade_shared` | A share URL was successfully copied. |
| Shared trade | `trade_report_viewed` | A dedicated shared trade receipt rendered. |
| Shared trade | `trade_report_shared` | A receipt was shared with the native share sheet or copied. |
| Shared trade | `trade_report_edit_opened` | A receipt led back to its prefilled calculator. |
| Market | `market_board_viewed` | A market board release became usable. |
| Market | `market_hub_viewed` | The canonical market release and download hub was viewed. |
| Market | `market_board_load_failed` | Full rankings failed to load. |
| Market | `market_search_used` | A debounced search was used; only length and result count are captured. |
| Market | `market_filter_changed` | Position or age filtering changed. |
| Market | `market_results_expanded` | More rows were requested. |
| Market | `market_asset_opened` | A market row led to a player profile or prefilled calculator. |
| Research | `player_research_viewed` | A player research page rendered. |
| Research | `team_research_viewed` | A team research page rendered. |
| Research | `team_player_opened` | A team page led to deeper player research. |
| Research | `team_map_selected` | A team was chosen from the map. |
| Research | `research_cta_clicked` | A research page or board led into a key next step. |
| Research | `research_downloaded` | A player or team CSV/JSON download was selected. |
| Meme tool | `memes_generated` | A meme set was generated; only input lengths are captured. |
| Meme tool | `meme_generation_failed` | Meme generation failed. |
| Meme tool | `meme_download_opened` | A generated template was opened for download. |
| Navigation | `site_navigation_clicked` | A header or footer destination was chosen. |
| Navigation | `mobile_navigation_toggled` | The mobile menu was opened or closed. |

PostHog's standard `$pageview`, `$pageleave`, `$autocapture`, exception, and performance events complement these product events.

## Recommended dashboards

1. **Acquisition:** unique visitors and landing pages by referrer/UTM.
2. **Calculator funnel:** calculator page view → asset added → trade evaluated → trade report created → receipt viewed/shared.
3. **Research funnel:** player/team research viewed → calculator CTA or data download.
4. **Content demand:** player and team views, market searches, and downloads by asset/team.
5. **Reliability:** market load failures, exceptions, slow pages, and retry recovery.

Use `trade_evaluated` as the primary activation event, `trade_shared` as report creation, and `trade_report_viewed` as evidence that a recipient opened it.
