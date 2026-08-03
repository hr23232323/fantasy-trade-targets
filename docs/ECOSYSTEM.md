# Product ecosystem and repository boundary

Last reviewed: 2026-08-03

Fantasy Trade Target is becoming two related products with different operating and risk profiles. They should remain separate repositories for now.

## The two projects

### `fantasy-trade-targets` — public web product

This repository owns:

- `fantasytradetarget.com` and its SEO landing pages;
- the free dynasty and redraft calculators;
- public rankings, value charts, and target discovery;
- the browser-side deterministic trade engine;
- generic market-data caching and attribution;
- public analytics, advertising, affiliate, and conversion surfaces;
- Google Cloud Run deployment for the website.

Its launch promise is simple: useful without login, fast, deterministic, inexpensive to serve, and safe to index.

### `sleeper-trader` — league intelligence engine and CLI

The related engine lives in the sibling local checkout at `../sleeper-trader`. Its current checkout has no Git remote configured, so this document deliberately does not invent a public repository URL. Add the real URL here if and when that project is published.

The engine owns:

- complete Sleeper league and history sync;
- league scoring, lineup, bench, IR, and taxi interpretation;
- roster, draft-pick, transaction, and manager context;
- nflverse production data and player identity mapping;
- team-window, need, surplus, and trade-partner analysis;
- explainable trade candidate generation;
- local SQLite evidence storage and exports;
- optional evidence-grounded AI synthesis.

Useful local references:

- `../sleeper-trader/README.md`
- `../sleeper-trader/docs/ARCHITECTURE.md`
- `../sleeper-trader/docs/RESEARCH.md`
- `../sleeper-trader/docs/WEB_LAUNCH_PLAN.md`

## Why they stay separate

The website is a public acquisition product with a small dependency surface and predictable request costs. The engine is a data-intensive analysis product that syncs external league state, retains evidence, and may eventually process user-connected data.

Keeping them separate provides:

- independent open-source and commercial licensing decisions;
- independent deploys and scaling characteristics;
- a smaller public website attack surface;
- no risk of bundling local league databases into a frontend image;
- freedom to keep the intelligence engine private while the calculator is public;
- a clean boundary between deterministic market facts and personalized advice.

Do not copy the CLI source tree into the Next.js application. Share capability through a documented service contract.

## Product ladder

### Tier 0 — free public tools

Repository: `fantasy-trade-targets`

- generic calculator and trade verdict;
- rankings and trade value charts;
- rookie-pick values and package adjustment;
- shareable offers;
- editorial and programmatic SEO pages;
- no login and no paid inference.

This is the acquisition and trust layer.

### Tier 1 — connected league

Primary engine: `sleeper-trader`

Potential paid features:

- connect a public Sleeper username or league ID;
- import the exact scoring and roster configuration;
- show how a trade changes the starting lineup, bench, and required cuts;
- classify contenders, retoolers, and rebuilders;
- identify natural counterparties from need and surplus;
- rank realistic trade targets for the selected roster;
- monitor draft capital and competitive-window changes.

This tier can remain entirely deterministic. The value is league context, not an LLM.

### Tier 2 — advisor

Primary engine: `sleeper-trader`; presentation: web product.

Potential paid features:

- explain why a deal helps or hurts the connected roster;
- generate several realistic opening offers and fallbacks;
- draft a manager-specific trade message;
- answer free-form questions against a compact evidence snapshot;
- summarize news or role changes with linked sources;
- remember user preferences without changing deterministic facts.

Inference must be opt-in, metered, cached where safe, and downstream from the deterministic evidence bundle. Every generated answer should retain source timestamps and model version.

### Tier 3 — API and MCP

MCP should be a thin interface over the same league-intelligence service, not a second implementation of trade logic.

Candidate MCP tools:

```text
list_leagues(username)
get_league_settings(league_id)
get_roster(league_id, team)
diagnose_team(league_id, team)
find_trade_targets(league_id, team, constraints)
evaluate_trade(league_id, side_a, side_b)
suggest_trades(league_id, team, target_player)
explain_trade(league_id, team, trade)
```

Good MCP customers could include power users, fantasy content creators, Discord bots, league commissioners, and third-party agent workflows. The paid unit may be a connected league, monthly request allowance, or developer API key.

## Recommended service architecture

```text
Public browser
    |
    +--> Next.js public routes --> cached market feed
    |
    +--> authenticated connected routes
              |
              +--> league-intelligence API (Python / sleeper-trader core)
                        |
                        +--> Sleeper public API
                        +--> nflverse and approved market feeds
                        +--> durable database + job queue
                        +--> optional advisor provider

MCP server -----------> same league-intelligence API
```

The first production extraction should turn the reusable `sleeper-trader` domain logic into an installable Python package plus a small authenticated API service. Deploy that service separately on Cloud Run. The web app calls it over a versioned internal API; the MCP adapter calls the same API.

## Initial contract

The web app should never depend directly on SQLite table layout. Start with versioned response models such as:

```text
POST /v1/league-syncs
GET  /v1/league-syncs/{job_id}
GET  /v1/leagues/{league_id}/settings
GET  /v1/leagues/{league_id}/teams/{team_id}/diagnosis
POST /v1/leagues/{league_id}/trades/evaluate
POST /v1/leagues/{league_id}/trades/suggest
POST /v1/leagues/{league_id}/advisor
```

Every response should include:

- schema version;
- source timestamps and freshness;
- league settings hash;
- market/model version;
- deterministic evidence separate from generated prose;
- warnings for missing or unsupported scoring rules.

## Identity, billing, and privacy

Do not add authentication merely to save calculator trades. Add it when connected league context or paid entitlements exist.

Before Tier 1:

1. Confirm Sleeper commercial-use expectations.
2. Choose authentication and entitlement storage.
3. Define deletion and resync controls.
4. Encrypt provider credentials and private snapshots at rest.
5. Keep connected league pages out of search indexes by default.
6. Store the minimum user data required for the feature.
7. Separate billing identity from public fantasy display names.

## When a monorepo would become justified

Reconsider a monorepo only when at least two of these are true:

- the web and engine share generated schemas on most changes;
- releases require atomic cross-project commits;
- one team owns both deploys and wants a single CI graph;
- local setup is materially harmed by sibling repositories;
- common packages outnumber service-specific packages.

Until then, separate repositories plus a versioned interface are simpler and preserve strategic flexibility.

## Near-term sequence

1. Launch and measure the free web product.
2. Keep improving `sleeper-trader` locally against real league questions.
3. Define a sanitized `LeagueSnapshot` and `TradeEvaluation` JSON contract.
4. Extract the engine package without changing CLI behavior.
5. Deploy one read-only connected-league endpoint behind an allowlist.
6. Test willingness to pay before adding AI or MCP infrastructure.
7. Add the advisor, API, or MCP surface only when user demand selects it.
