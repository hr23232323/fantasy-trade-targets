# Fantasy Trade Target search expansion

Date: 2026-09-12  
Market: United States, Google Search  
Primary audience: redraft and dynasty fantasy football managers

## Decision

The best immediate expansion is not a generic fantasy news section or a sports-betting pivot. Fantasy Trade Target already earns search visibility where a page gives one current, measurable answer: scoring-format rankings, exact player comparisons, rookie-pick values, and player market files. The next release should deepen those clusters and introduce weekly schedule pages that the current data can support without pretending to offer projections.

Start/sit is the largest adjacent opportunity. It should become the next product layer only after the site can publish current weekly projections, opponent-by-position evidence, and injury status with a reliable refresh cadence. The query volume is attractive enough to justify that data work, but market value and last-season team scoring are not substitutes for a weekly projection.

Sports betting has strong commercial demand, but it is a weaker near-term fit. Player-prop pages require current odds, licensed or contractually permitted feeds, state-aware legal review, and rapid line movement handling. Publishing picks without those systems would weaken the site’s core trust proposition.

## What the site’s own search data says

The Search Console export covers June 9 through September 8, 2026. It records 104 clicks and 6,635 impressions. Eighty-three clicks arrived in the final seven days, compared with 16 in the preceding seven days. September 8 reached 26 clicks, 630 impressions, a 4.13% click-through rate, and an average position of 9.6.[^1]

The page-family pattern is decisive:

| Page family | Clicks | Impressions | CTR |
|---|---:|---:|---:|
| Scoring pages | 48 | 652 | 7.36% |
| Rookie-pick pages | 9 | 220 | 4.09% |
| Player comparisons | 22 | 1,605 | 1.37% |
| Calculator and analyzer pages | 4 | 730 | 0.55% |

The 6-point passing-touchdown page produced 45 clicks from 526 impressions at an average position of 8.54. The strongest comparison pages also reached page one quickly: Sam LaPorta versus Kyle Pitts had 411 impressions at position 8.51, Christian McCaffrey versus Chase Brown had 225 impressions at position 7.88, and Breece Hall versus Saquon Barkley had 132 impressions at position 6.8.[^1]

This supports three conclusions:

1. Specific decisions rank before broad category terms.
2. Tables with current values create the site’s strongest search answer.
3. Comparison pages have proven demand but still have substantial click-through upside.

## External demand

One batched Google Ads search-volume request was used for discovery and one batched request was used for the final short list. Clickstream enrichment was disabled. Google Ads volume is an approximate monthly average and can group close variants, so the monthly history is more useful here than any single headline number.[^2]

### Highest-value adjacent query families

| Query | Monthly average | Aug. 2026 | Sep. 2025 | Implication |
|---|---:|---:|---:|---|
| who should I start fantasy football | 22,200 | 4,400 | 90,500 | Largest adjacent in-season product opportunity |
| fantasy football start sit tool | 9,900 | 140 | 49,500 | Tool intent, strong paid-commercial signal |
| fantasy football waiver wire | 9,900 | 1,900 | 49,500 | Requires current usage, roster and availability inputs |
| fantasy football start sit | 8,100 | 390 | 33,100 | Broad weekly intent with steep seasonality |
| dynasty wide receiver rankings | 8,100 | 12,100 | 9,900 | Direct fit for current market and scoring model |
| fantasy football rankings week 1 | 5,400 | 9,900 | 49,500 | Valuable, but only with defensible weekly projections |
| half PPR rankings | 4,400 | 22,200 | 12,100 | Direct fit for the existing scoring engine |
| dynasty running back rankings | 4,400 | 8,100 | 6,600 | Direct fit for the current market |
| superflex rankings | 3,600 | 27,100 | 6,600 | Direct fit; avoid competing duplicate URLs |
| dynasty quarterback rankings | 3,600 | 6,600 | 4,400 | Direct fit for 1QB and Superflex boards |
| fantasy football player comparison | 2,400 | 1,600 | 9,900 | Validates the existing comparison template |
| dynasty PPR rankings | 1,900 | 5,400 | 2,900 | Direct scoring-page opportunity |
| fantasy football strength of schedule | 1,000 | 3,600 | 2,400 | Schedule pages can establish this cluster now |
| TE premium rankings | 260 | 1,600 | 480 | Small but highly aligned and already proven by scoring pages |
| superflex trade value chart | 260 | 210 | 1,000 | Strong commercial fit, but should consolidate around existing charts |

The seasonal curve matters. Start/sit and waiver demand is concentrated from September through December, while dynasty positional rankings retain more offseason value. This makes current rankings the safe compounding layer and weekly decision support the higher-upside product investment.

## Competitive shape

DataForSEO identifies 215 keywords currently associated with fantasytradetarget.com. Its closest organic intersections are FantasyPros (209 keywords), DraftSharks (200), FantasyCalc (191), FantasySP (168), and KeepTradeCut (161). Reddit intersects on 199 keywords and remains a major result type for player-choice questions.[^3]

The competitors reveal the minimum credible weekly product:

- DraftSharks combines weekly median, floor, and ceiling projections with opponent position rank, adjusted points allowed, injury status, news, scoring settings, and up to three compared players.[^4]
- FantasyPros uses expert-consensus rankings and league sync for roster-specific lineup optimization.[^5]
- KeepTradeCut pairs a frequently refreshed market with configurable dynasty rankings, trends, trades, and comparison utilities.[^6]
- FantasyPros’ strength-of-schedule product evaluates opponent fantasy points allowed by position rather than total NFL points allowed.[^7]

Fantasy Trade Target does not need to copy those products. Its opening is a free, transparent weekly comparator that shows the inputs and the reason for the recommendation. It does need the same minimum evidence: weekly player expectation, opponent-by-position context, availability, scoring rules, and freshness.

## Pages released from this research

The first expansion adds 83 indexable pages:

- 40 reviewed player comparisons. The pair set emphasizes closely priced players, elite tier decisions, young-player decisions, veteran contender choices, and scoring-sensitive tight ends and quarterbacks. Every page uses the same validated markets and scoring profiles as the calculator.
- 24 scoring and positional ranking boards. The set covers PPR dynasty positions, Standard/Half/PPR redraft positions, 1QB and Superflex quarterback demand, full-board redraft and dynasty reception settings, and two-tight-end formats.
- 18 weekly matchup slates plus one collection page. Each weekly page deduplicates the NFL schedule into one card per game and connects both teams to current redraft assets, opponent scoring context, venue, surface, roof, and rest.

These are not 83 rewritten keyword variants. Ranking pages change the actual league configuration and resulting table. Comparison pages change the two assets and the measured gap across format and scoring. Weekly pages contain a different NFL slate and team context.

## What should not ship yet

### Start/sit recommendations

The current production release has market values, historical scoring profiles, teams, and schedules. It does not have a weekly projection model, opponent fantasy points allowed by position, current depth-chart role, or a sufficiently rapid availability feed. A start/sit verdict built from dynasty or redraft market price would be misleading.

nflverse provides updateable rosters, depth charts, practice reports, injuries, play-by-play, and weekly player statistics, and documents frequent in-season refreshes.[^8] That creates a viable foundation for a first-party model. Before public recommendations, the pipeline still needs identifier coverage, data-license confirmation for every displayed field, freshness checks, and backtests.

### Injury and news pages

Injury pages need structured facts with report time, effective time, source, and confidence. They should not reproduce article bodies. Until a commercially acceptable feed and rapid publisher exist, the site should link to official reports or keep injury status out of its advice.

### Sports-betting picks

“NFL player props” averages 8,100 monthly searches and carries a high observed CPC, but the product requirements are materially different from fantasy rankings. The first betting-adjacent release should be an educational implied-probability or line-movement tool only after odds-feed terms, state targeting, affiliate disclosures, and responsible-gambling requirements are reviewed. Picks and stale lines should not be published.

## Start/sit build specification

The next product should use stable player-pair URLs updated every week, supported by a weekly hub. A credible first version needs:

1. Weekly player projections produced from current-season snaps, routes, attempts, targets, carries, red-zone work, team pace, and market expectation.
2. Floor and ceiling ranges produced from historical opportunity and scoring variance.
3. Opponent fantasy points allowed by position, adjusted for the opponents already faced.
4. Current practice participation, game status, inactive status, depth chart, and transaction state.
5. Scoring controls for Standard, Half PPR, PPR, four- or six-point passing touchdowns, 1QB, and Superflex.
6. A visible timestamp and a recommendation invalidation rule when required inputs are stale.
7. Backtests by position and week against simple baselines such as market rank and recent fantasy points.

The recommendation should state the projected gap and the strongest two or three inputs. It should not summarize rumors or claim certainty.

## Publication safeguards

Google explicitly advises against creating separate pages for every possible query variation and against scaled pages that add little value. It recommends original, substantial, people-first content and descriptive titles and headings.[^9] The release therefore keeps a bounded manifest, static generation, unique canonical URLs, complete tables, visible data dates, structured data, and clear limits.

Expansion should pause if any of these checks fail:

- A comparison player is missing from a required market or scoring profile.
- A ranking configuration produces no eligible players.
- A weekly slate does not contain 13–16 unique games.
- Schedule or market data is stale beyond the publisher’s allowed age.
- Two pages resolve to the same slug, title, canonical, or primary configuration.

## Measurement

Evaluate the release after 14 and 28 days, using page-family cohorts rather than total site traffic:

- indexed pages and pages with impressions;
- non-brand clicks;
- top-10 impressions and click-through rate;
- comparison pages earning at least five clicks per week;
- scoring-page clicks into the impact lab;
- weekly-matchup clicks into player files and the redraft analyzer;
- return visits during the same NFL week.

Do not rewrite titles before enough impressions accumulate. Keep the winning 6-point page structurally stable and use it as the control for the new scoring boards.

## Sources

[^1]: Google Search Console export, `fantasytradetarget.com-Performance-on-Search-2026-09-10.zip`, Web search, 2026-06-09 through 2026-09-08.
[^2]: DataForSEO, [Google Ads Search Volume API documentation](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/), accessed 2026-09-12.
[^3]: DataForSEO, [Competitors Domain API documentation](https://docs.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live/), U.S./English organic intersection captured 2026-09-12.
[^4]: DraftSharks, [Who to Start](https://www.draftsharks.com/who-should-i-start), accessed 2026-09-12.
[^5]: FantasyPros, [Start/Sit Assistant](https://www.fantasypros.com/nfl/myplaybook/start-sit-assistant.php), accessed 2026-09-12.
[^6]: KeepTradeCut, [Dynasty rankings](https://keeptradecut.com/dynasty-rankings), accessed 2026-09-12.
[^7]: FantasyPros, [Fantasy Football Strength of Schedule](https://www.fantasypros.com/nfl/strength-of-schedule/), accessed 2026-09-12.
[^8]: nflverse, [automated data releases and update cadence](https://github.com/nflverse/nflverse-data) and [roster/injury pipeline](https://github.com/nflverse/nflverse-rosters), accessed 2026-09-12.
[^9]: Google Search Central, [AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), and [generative AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content), accessed 2026-09-12.
