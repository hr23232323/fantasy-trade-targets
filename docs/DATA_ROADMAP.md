# Fantasy Trade Target data roadmap

Last reviewed: 2026-08-10

This is the living inventory for every dataset we use or may add. A feed does not ship merely because it is technically accessible. Each feed needs a clear product job, stable identifier mapping, update cadence, attribution plan, and commercial-use decision.

## Shipping in V1

### Tradyr public API — market values and rankings

- **Product job:** common market scale for dynasty players, redraft players, rookies, and exact rookie picks.
- **Endpoints:** `/v1/players`, `/v1/picks`, `/v1/players/:slug`, and the documented `/stats`, `/advanced`, `/bestball`, and `/projection` player subresources.
- **Formats:** dynasty/redraft, 1QB/Superflex, TE premium, and league-size-adjusted picks.
- **Identifier spine:** Tradyr slug plus Sleeper player ID when supplied.
- **Refresh:** the publisher runs three times daily, validates every supported market variant, and packages the current release with the application.
- **Rights:** the [official Tradyr API documentation](https://api.tradyr.app/docs) explicitly permits commercial use with attribution.
- **Public fields:** name, slug, position, team, age, composite, rank, position rank, confidence, Sleeper ID, pick metadata, upstream composite history when supplied, compact three-season scoring profiles, derived season/usage metrics, consistency, and similar-market players.
- **History boundary:** the documented player endpoints may return an empty `history` array and `deltas: null` for an otherwise valid canonical profile. Publication must preserve that distinction instead of treating absent upstream observations as zeroes or inferred history.
- **Do not expose:** upstream source-specific KTC or FantasyCalc payload fields. V1 republishes only the licensed Tradyr composite.
- **Attribution:** the dedicated data-sources page names and links the provider;
  consumer surfaces link to sources and methodology without presenting the
  upstream provider as the product brand.

### Wikimedia Commons — player images

- **Product job:** recognizable lead photography for reviewed player pages.
- **Selection:** candidates are discovered through the Wikimedia APIs, then reviewed individually before inclusion.
- **Rights:** every selected file must expose an applicable Creative Commons license and creator attribution. The player manifest records the creator, file page, license name, and license URL.
- **Delivery:** Next.js serves responsive optimized derivatives from reviewed Wikimedia thumbnail URLs. A future bulk pipeline may self-host licensed derivatives while preserving the same attribution record.
- **Boundary:** do not substitute undocumented Sleeper, ESPN, team, or NFL CDN headshots. Expand only after every additional image passes the same rights check or a commercial image provider is licensed.

### Local deterministic trade engine

- **Product job:** replacement-relative 4/6-point passing-TD and standard/half/full-PPR values, custom dedicated RB/WR/TE starters, zero to three RB/WR/TE FLEX spots, raw totals, roster-cost-adjusted totals, verdict bands, balancing suggestions, and share URLs.
- **Refresh:** versioned with application deploys.
- **Cost:** no inference or third-party calculation request.
- **Method:** scoring changes are measured as the player's change in points over positional replacement. Dedicated starters establish each positional replacement rank; FLEX demand is allocated to the highest-valued eligible RBs, WRs, and TEs beyond those starters. The result is confidence-weighted and capped so the published market remains the anchor. Best package asset receives 100% weight; later pieces receive 90%, 84%, 79%, 75%, 72%, 70%, and 68%. Exact formulas and verdict bands are documented at `/methodology` and explorable at `/scoring-impact`.

## Current data foundation

### Scheduled public snapshot pipeline

- **Product job:** preserve the daily market record and compile the public data
  releases used by calculators, server-rendered player pages, histories, and
  recurring research.
- **Execution model:** a scheduled batch job in this repository. It is not an
  always-running application backend and does not accept user traffic. It is
  operationally separate from push-triggered application deploys: validated
  data changes invoke the shared deploy workflow only after publication. Full
  scoring coverage is restored incrementally in deterministic cohorts: missing
  and reviewed players are prioritized, valid current-model profiles carry
  forward, and complete cohorts rotate for freshness.
- **Current store:** validated current release in `frontend/data`, a compact
  first-party player observation index at `data/player-snapshot-history.json`,
  plus compressed, append-only market snapshots in `data/snapshots`. The
  scheduled workflow currently commits those three layers to Git. Because the
  production Docker context is `frontend/`, complete raw archives remain in the
  repository rather than the running application image. Move the raw archive
  to immutable object storage before multi-year volume makes Git operationally
  expensive; preserve the same release IDs and public compact-history contract.
- **Snapshot dimensions:** format, quarterback setting, TE premium, supported
  league size, player/pick identity, value, overall and positional rank,
  confidence, compact raw-stat scoring profile, upstream freshness, settings
  hash, and methodology version.
- **Public releases:** a manifest, current market snapshots, player histories,
  mover reports, and downloadable sanitized CSV/JSON artifacts.
- **Validation:** reject stale, partial, duplicate, or schema-incompatible input
  before advancing the `latest` release pointer. Every configured player must
  receive a timestamped FTT observation in the new release; upstream history is
  validated when present but is not fabricated when absent.
- **Boundary:** generic public data only. Sleeper usernames, leagues, rosters,
  transactions, and private snapshots belong to the separate connected-league
  service.

The Next.js market route, calculators, rankings, player pages, sitemap, and
downloads all consume the same validated release through a shared server-side
data library. A failed refresh leaves the previous release intact.

## V1.1 — league-connected context

### Sleeper public API

- **Product job:** sync league scoring, roster positions, bench/IR/taxi counts, standings, rosters, traded picks, draft state, transactions, and manager identities needed to evaluate a trade inside the actual league.
- **Core endpoints:** user lookup; user leagues; league; rosters; users; matchups; transactions; traded picks; drafts; draft picks; NFL player directory.
- **Identifier spine:** `league_id`, `roster_id`, `user_id`, `player_id`, and season.
- **Refresh:** league settings daily; live drafts/transactions every 15–60 seconds while the relevant screen is open; rosters on page load with a short cache.
- **Rights gate:** Sleeper publishes a documented read-only API at [docs.sleeper.com](https://docs.sleeper.com/), but the technical documentation does not clearly grant a broad commercial redistribution license. Before monetized league sync ships, confirm acceptable commercial usage and store only the minimum public league data needed for analysis.
- **Privacy:** username lookup must be user-initiated. Do not index league pages by default. Never ship locally captured private league snapshots in the public application image.

### Derived league features

- Complete league-specific scoring normalized from `scoring_settings`, extending the public passing-TD/PPR subset with bonuses, first downs, turnover variants, and other custom rules.
- Starting lineup value vs bench value, with replacement-level baselines per league.
- Contender / retool / rebuild classification using age, starter strength, depth, draft capital, and standings.
- Positional need/surplus by comparing usable starters with every other roster.
- Trade partner discovery: manager needs + surplus + realistic asset availability.
- Trade outcome delta: starting lineup, bench, draft capital, age curve, and roster cuts before vs after.

## V1.2 — production and usage

### nflverse

- **Product job:** play-by-play, weekly/player stats, snap participation, rosters, schedules, depth context, and IDs for production-vs-market signals.
- **Shipping now:** all 32 current team identities, the complete current regular-season schedule, venue/surface/roof fields, rest context, and prior-season scoring baselines. The packaged team release records source URLs, SHA-256 hashes, row counts, capture time, and the FTT model version.
- **Rights:** the [nflverse automated data repository](https://github.com/nflverse/nflverse-data) is published under CC BY 4.0; the nflverse software projects also publish license text. Preserve dataset-specific notices and attribution.
- **Refresh:** weekly/player stats after games; schedules daily; play-by-play after games and corrections.
- **Identifiers:** `gsis_id` / `nflverse_id` mapped to Sleeper IDs using nflverse player ID files and a manually reviewed exception table.
- **Derived features:** value vs expected points, routes/targets per snap, weighted opportunities, age-adjusted production, consistency, playoff schedule, and “market has not caught up” trade-target scores.
- **Validation:** every season ingest records source URL, release tag/hash, downloaded timestamp, schema hash, and row count.

## V1.3 — availability and news

### Injury / practice / transaction feed

- **Product job:** availability status, practice participation, IR/PUP/NFI, suspensions, transactions, and depth-chart movement.
- **Preferred path:** license a feed that explicitly allows commercial display and derived alerts. Candidates to evaluate include SportsDataIO, Sportradar, or another contracted provider.
- **Fallback:** link to official reports rather than scraping and republishing protected editorial text.
- **Refresh:** 5–15 minutes in-season; slower overnight/off-season.
- **Rules:** store structured facts and source URLs, not full copyrighted articles. Every status needs `reported_at`, `effective_at`, `source`, and confidence.

### News summaries

- **Product job:** explain why value or role changed and attach verified source links to player pages.
- **Rights:** do not ingest article bodies without a license. Prefer licensed structured feeds, official team/NFL releases, or headline/link metadata within the provider’s terms.
- **AI policy:** any eventual summary layer is optional and downstream from deterministic facts. Cache by source document hash; show sources; never let generated text alter a player value directly.

## V1.4 — game environment

### Weather

- **Product job:** wind, precipitation, temperature, and severe-weather flags for outdoor games; useful for weekly projections and start/sit, not dynasty value.
- **Preferred free commercial path:** [National Weather Service API](https://www.weather.gov/documentation/services-web-api) for U.S. locations; NWS describes its API information as open data free for any purpose. Provide a descriptive User-Agent and cache responsibly.
- **Alternative:** Open-Meteo has strong technical coverage, but its free hosted endpoint is non-commercial. A commercial subscription or self-hosted/licensing review is required before use on a monetized site; see [Open-Meteo pricing](https://open-meteo.com/en/pricing).
- **Refresh:** stadium forecast at 48h, 24h, 6h, 90m, and 30m before kickoff.
- **Join:** game ID → venue → coordinates → forecast grid point; dome/retractable-roof status suppresses or qualifies weather impact.

### Schedule and venue metadata

- **Product job:** kickoff, opponent, home/away, surface, roof, timezone, rest/travel, and playoff-week opponents.
- **Current path:** nflverse schedules plus a small reviewed team-market coordinate table. Venue names remain feed-driven; the reviewed coordinates are used only for the approximate team directory map.
- **Derived model:** team matchup temperature uses prior-season scoring-defense rank with small, published home/away and rest adjustments. It is explicitly not a player projection or positional matchup grade.

## Later commercial layers

- Projection providers with explicit redistribution/derived-work rights.
- Contract/cap data for multi-year opportunity analysis; verify licensing before use.
- Real public Sleeper trade corpus for accepted-price distributions, with aggregation and privacy safeguards.
- ADP from permitted public or partner feeds.
- Best-ball exposure and portfolio risk for connected users.
- Betting context only after legal, affiliate, state-targeting, and provider-term review.

## Canonical warehouse shape

The application can begin with JSON caches, but future feeds should land in versioned tables:

```text
players              canonical_player_id, names, position, birth_date
player_identifiers   canonical_player_id, provider, provider_id, valid_from, valid_to
market_values        player_id/asset_id, format, settings_hash, value, rank, observed_at, source
league_snapshots     league_id, season, settings_json, roster_schema_json, observed_at
roster_assets        snapshot_id, roster_id, asset_id, reserve_type
weekly_stats         player_id, season, week, stat columns, source_version
availability_events  player_id, status, detail, reported_at, source_url, confidence
news_items           player_id, headline, source_url, published_at, content_hash
game_weather         game_id, forecast_at, kickoff_delta, weather fields, source
```

Every derived output should include `model_version`, `settings_hash`, source timestamps, and enough lineage to reproduce it.

## Feed acceptance checklist

1. Commercial use and redistribution/derived-work rights are written down.
2. Attribution is defined and visible where required.
3. IDs map to the canonical player table with an exception queue.
4. Rate limits and cache behavior fit expected September traffic.
5. Raw payloads are isolated from public response schemas.
6. Ingests are idempotent, timestamped, schema-checked, and observable.
7. Missing/stale data fails visibly rather than silently becoming advice.
8. A feed can be disabled without taking the calculator offline.

## Deliberate non-sources

- No live KeepTradeCut scraping.
- No FantasyCalc value reuse without direct permission.
- No copied article bodies or unlicensed injury/news aggregation.
- No private or personal league snapshots in public builds.
- No model-generated “facts” in the deterministic data layer.
