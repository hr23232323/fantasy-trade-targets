# Fantasy Trade Target

Deterministic fantasy football trade tools for [fantasytradetarget.com](https://www.fantasytradetarget.com):

- dynasty and redraft trade calculators;
- 1QB, Superflex, TE premium, and 8–16 team settings;
- exact rookie-pick values;
- transparent roster-cost adjustment;
- searchable dynasty rankings and trade value charts;
- shareable trade URLs;
- deterministic trade meme generator.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- Next.js route handlers with six-hour edge-friendly caching
- Tradyr public API for commercially permitted composite market values
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

An optional free Tradyr API key raises the upstream rate limit:

```bash
TRADYR_API_KEY=try_live_xxxx npm run dev
```

## Verification

```bash
cd frontend
npm run test
npm run typecheck
npm run build
```

## Production

Pushes to `main` test and deploy the frontend image to the existing Google Cloud Run service through GitHub Actions. Manual deployment uses:

```bash
make deploy
```

See [docs/DATA_ROADMAP.md](docs/DATA_ROADMAP.md) for the current feed, planned league-aware data layers, refresh cadences, and commercial-use gates.

## Public data architecture

The current release reads licensed market values through a cached Next.js
adapter. The next data layer will be a scheduled batch pipeline in this
repository, not a request-time API server. It will save append-only snapshots,
derive histories and market reports, and publish sanitized, versioned release
artifacts for the Next.js application.

The durable historical archive will live outside the application image. The web
deployment will consume only the latest public release and the precomputed
history needed for server-rendered pages, charts, calculators, and downloads.

## Related intelligence engine

The public website and the local `sleeper-trader` intelligence engine intentionally remain separate projects. The website owns free generic tools, acquisition, and presentation; the sibling engine owns Sleeper league sync, scoring-aware analysis, trade discovery, and optional AI synthesis.

See [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) for the repository boundary, integration contract, and a staged connected-league / advisor / MCP paid-tier plan.
