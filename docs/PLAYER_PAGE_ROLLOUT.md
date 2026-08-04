# Player-page rollout contract

Last reviewed: 2026-08-03

Player research routes are generated from the reviewed manifest at
`frontend/data/player-pages.json`. The manifest currently contains the pages
used for template and data validation; it is designed to expand before public
deployment without changing the route or component architecture.

## Current configured routes

- `/players/josh-allen-qb`
- `/players/bijan-robinson-rb`
- `/players/jamarr-chase-wr`
- `/players/brock-bowers-te`
- `/players/ashton-jeanty-rb`

`generateStaticParams` returns the configured slugs and `dynamicParams` is
disabled. Market-board links are enabled for the same manifest. An unconfigured
player URL returns 404 instead of publishing a partial page.

## Required page contract

Every player page must include in initial HTML:

- a direct answer below the heading;
- current Superflex, 1QB, TE-premium, and redraft context;
- overall and positional rank;
- recorded value history and computed movement;
- an accessible observation table plus CSV and JSON downloads;
- position-aware production and usage facts;
- comparable market-tier players and rookie-pick equivalents;
- source timestamps, release ID, methodology links, and explicit evidence boundaries;
- a reviewed player image with visible creator, source, and license attribution;
- canonical and social metadata plus valid `WebPage` and breadcrumb data.

Shared market boards must include valuable leading rows in initial HTML. The
complete searchable inventory may hydrate after load from the same packaged
release.

## Expansion gate

Before adding a player to the deployment manifest, verify:

1. Desktop and mobile page composition.
2. Image cropping, responsive performance, and attribution visibility.
3. Direct-answer clarity and factual accuracy.
4. A complete validated profile in the packaged release.
5. Structured-data validity and exact 404 behavior for missing routes.
6. Genuine player-specific utility beyond the upstream profile.
7. Image rights and manifest metadata.
8. CSV/JSON download integrity.

Expand only with reviewed records. Do not generate scoring-variant doorway pages;
one substantial canonical page owns each player entity.
