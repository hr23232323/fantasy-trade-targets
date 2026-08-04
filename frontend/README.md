# Fantasy Trade Target frontend

Next.js 16 application for the public calculators, rankings, value charts, and
player research pages.

## Commands

```bash
npm ci
npm run dev
npm run test
npm run typecheck
npm run build
```

The app reads `data/public-release.json`; it does not call the upstream market
feed during builds or user requests. To publish a new validated release and
append a compressed market snapshot:

```bash
TRADYR_API_KEY=try_live_xxxx npm run data:refresh
```

Anonymous refreshes are rate-limited automatically; the free key is strongly
recommended once the player manifest expands beyond the initial reviewed set.

Player routes and licensed image records are configured in
`data/player-pages.json`.
