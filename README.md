# Fantasy Trade Target

Deterministic fantasy football trade tools for [fantasytradetarget.com](https://fantasytradetarget.com):

- dynasty and redraft trade calculators;
- 1QB, Superflex, TE premium, and 8–16 team settings;
- replacement-relative values for 4/6-point passing touchdowns and standard/half/full PPR;
- exact rookie-pick values;
- transparent roster-cost adjustment;
- searchable dynasty rankings and trade value charts;
- server-rendered player research pages with downloadable market records;
- shareable trade URLs;
- deterministic trade meme generator.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- versioned public data releases with scheduled snapshot publishing
- Tradyr public API for commercially permitted composite market values
- Wikimedia Commons API-selected images with per-page license attribution
- Google Cloud Run deployment using the existing `fantasy-trade-targets` GCP project

The legacy Python/FastAPI data path has been removed. Production contains a
single Next.js service and does not deploy a separate application backend.

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The application reads the checked-in validated public release and does not need
upstream access at request time. Refresh the release and archive a snapshot with:

```bash
TRADYR_API_KEY=try_live_xxxx npm run data:refresh
```

The publisher respects the anonymous request limit automatically. Configure the
free `TRADYR_API_KEY` GitHub Actions secret before expanding to hundreds of full
player profiles so scheduled releases complete quickly.

## Verification

```bash
cd frontend
npm run test
npm run typecheck
npm run build
```

## Production

Pushes to `main` take the fast path: tests, one cached production image build,
and deployment to the existing Google Cloud Run service. Upstream market and
NFL data refreshes run separately on the three-times-daily schedule, commit a
validated release, and invoke the same reusable deploy only when data changed.
Manual deployment uses:

```bash
make deploy
```

See [docs/DATA_ROADMAP.md](docs/DATA_ROADMAP.md) for the current feed, planned league-aware data layers, refresh cadences, and commercial-use gates.

Player routes are generated from the reviewed manifest in
`frontend/data/player-pages.json`. See
[docs/PLAYER_PAGE_ROLLOUT.md](docs/PLAYER_PAGE_ROLLOUT.md) for the expansion
contract that must be satisfied before deployment.

## Public data architecture

The scheduled publisher collects every supported market variant, validates the
release, writes `frontend/data/public-release.json`, and stores a compressed,
append-only market snapshot under `data/snapshots/`. Server components and API
routes read the same packaged release, so builds and requests do not depend on a
live upstream response.

The scheduled data publisher refreshes and deploys the release three times
daily without blocking ordinary code pushes. The checked-in snapshot archive
starts the proprietary history immediately, while
`data/player-snapshot-history.json` keeps the compact per-player observation
series packaged into each public release. Today, Git is the durable store for
the compressed raw archive: the scheduled workflow commits each new `.json.gz`
snapshot to `data/snapshots/YYYY/MM/DD/`. The Docker build context is
`frontend/`, so raw archives are not copied into the production container. At
three captures per day and roughly 112 KB per current snapshot, the archive is
about 120 MB per year before Git overhead. Move the raw files to immutable
object storage before multi-year volume makes repository storage material;
keep the release and compact-history contracts unchanged.

## Related intelligence engine

The public website and the local `sleeper-trader` intelligence engine intentionally remain separate projects. The website owns free generic tools, acquisition, presentation, and the published 4/6-point passing-TD plus standard/half/full-PPR model; the sibling engine owns Sleeper league sync, complete custom-scoring analysis, trade discovery, and optional AI synthesis.

See [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) for the repository boundary, integration contract, and a staged connected-league / advisor / MCP paid-tier plan.
