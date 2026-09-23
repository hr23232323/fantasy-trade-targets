# SEO experiment and scale playbook

Last updated: 2026-09-22
Owner: Fantasy Trade Target

## The operating rule

Publish a complete, bounded cohort for one search question. Measure that cohort separately. Scale only when Search Console and product analytics show evidence that the page type earns discovery or useful downstream actions.

The default batch is 10–20 detail pages. “Complete” is more important than hitting an arbitrary count: a Week 1 matchup test includes every Week 1 game; a weekly schedule test includes every regular-season week. Do not create every possible keyword permutation.

Player comparisons are the control. They already earned page-one impressions and clicks, so additional comparison batches can continue as curated sets. Every other template begins as an experiment.

## Current experiment registry

| Cohort | Search question | Initial set | Primary event | Status |
|---|---|---:|---|---|
| Control: player comparisons | “Player A or Player B dynasty?” | 132 curated comparisons | `player_comparison_viewed` | Proven; latest batch selected from Week 2 usage, availability, market proximity, and Search Console demand |
| E1: individual game matchups | “Team A vs. Team B fantasy matchup” | All 16 Week 1 games | `game_matchup_experiment_viewed` | Initial cohort shipped |
| E2: weekly schedule ratings | “Week N fantasy strength of schedule” | All 18 regular-season weeks | `schedule_rating_experiment_viewed` | Initial cohort shipped |
| E3: player vs. exact rookie pick | “Player or 2027 pick X?” | 20 close market decisions | `player_pick_comparison_experiment_viewed` | Initial cohort shipped |
| E4: league-size rankings | “N-team Superflex/1QB dynasty rankings” | 5 league sizes × 2 QB formats = 10 | `scoring_research_viewed` with `scoring_page` | Initial cohort shipped |
| E5: position schedule | “Best fantasy schedule for RB/WR/TE/QB” | 4 complete 32-team rankings | `position_schedule_viewed` | Initial cohort shipped |
| E6: weekly usage | “Week N snaps, targets, and carries” | 4 position reports per complete week | `weekly_usage_report_viewed` | Armed; publishes only after full-week verification |
| E7: weekly position matchups | “Best Week N matchups for QB/RB/WR/TE” | 4 positions × Weeks 3–4 = 8 | `position_week_schedule_viewed` | Initial cohort shipped after E2 and E5 cleared discovery and CTR thresholds |
| E8: start/sit decisions | “Who should I start this week?” | 50 reviewed decisions plus an any-player comparison builder | `start_sit_comparison_viewed` | Stable pair URLs roll forward each week with a guarded first-party range model and automatic result grading |
| E9: injury availability | “Who is listed on the fantasy injury report?” | Current hub + complete weekly archives | `fantasy_injury_report_viewed` | Initial cohort shipped; stale report weeks are explicit and never adjust a newer projection |

## nflverse experiment queue

The direct nflverse release integration adds three seasons of weekly player results, snap participation, current rosters, injury/practice rows, and schedule conditions where recorded. These are the next bounded experiments, in priority order:

| Priority | Experiment | First cohort | Distinct answer | Launch gate |
|---|---|---:|---|---|
| 1 | Weekly usage risers and fallers | 4 pages: QB, RB, WR, TE for the latest complete week | Who gained or lost snaps, targets, carries, and target share versus their recent baseline? | Every scheduled game final, with matching player stats and snap coverage |
| 2 | Volume versus market value | 12–20 player pages | Which players have opportunity that is materially ahead of or behind their dynasty price? | Minimum two recent games plus a reproducible gap formula |
| 3 | Player game-log search pages | 12–20 high-demand players | What did the player score each week in Standard, Half PPR, and PPR, with role context? | Search Console demand beyond the existing player URL; avoid splitting identical intent |
| 4 | Injury and practice status hubs | Current report + one archive per available week | Which fantasy-relevant players have a listed designation, and what changed since the previous report? | Shipped with status history and automatic stale-state suppression |
| 5 | Evidence-backed start/sit comparisons | 50 reviewed calls plus on-demand pair URLs | Which player has the stronger range after recorded scoring, recent usage, same-week availability, opponent position defense, and league scoring? | Shipped after the V1 lineup-lean gates below passed |

Position schedule and weekly usage are the first two nflverse cohorts. Measure them separately against the comparison control, then release the next page type only after the Day 7 read. Existing player, team, and matchup pages should continue absorbing useful evidence without creating duplicate index inventory.

## September 22 scale decision

- Player comparisons produced 377 clicks from 22,102 impressions in the latest 28-day export, so the control expanded by 20 reviewed decisions.
- The new pairs were selected from current Week 2 opportunity or snap changes, current listed availability, close validated market values, and observed comparison-query demand. They were not generated from every possible pair.
- Weekly schedule ratings produced 11 clicks from 119 impressions at 9.2% CTR. Position schedule pages produced 3 clicks from 52 impressions at 5.8% CTR. E7 combines those two winning intents in one bounded eight-page cohort.
- The general Week 2 matchup page ranked at position 7.6 but earned 2 clicks from 2,681 impressions. Its title, first answer, and ranked summary were revised once before any additional game-level expansion.
- Weekly usage reports remain on hold for additional page expansion. Existing reports receive internal links and another measurement window first.

Collection hubs are navigation, not detail-page experiments. They should be reported separately from their cohorts.

## September 22 start/sit launch decision

- E8 launches 20 stable player-pair URLs and one evergreen current-week hub. The pair URL accumulates authority; its title, evidence, matchup, availability and grade move with the active week.
- The model publishes Standard, Half PPR and PPR floor–median–ceiling ranges. It blends up to 18 prior-season games with current-season results, then applies tightly capped usage and opponent-position adjustments.
- The Week 2 holdout covered 160 player observations. Half PPR mean absolute error was 5.60 points versus 7.29 for the previous-game baseline and 5.64 for the prior-season PPG baseline. This is a small edge over the stronger baseline, so the cohort stays bounded at 20 until live grading provides more evidence.
- Same-week Out, Doubtful, Questionable and practice participation can adjust a projection. An older injury row cannot. Every completed pair publishes the actual result and whether the pregame lean was correct.
- E9 preserves the source's weekly availability history, publishes only meaningful fantasy-player listings, displays the latest available report week, and explicitly says when the active week's structured report has not arrived.

## Why these four tests

### E1: individual game matchups

The first weekly release used one page per week. That page is useful as a slate, but it cannot target a specific game decision. The initial detail cohort covers every Week 1 game and adds a unique team-versus-team answer, current redraft assets, venue, field, rest, and separate environment grades for both teams.

Scale path if it works: publish every game for the next active week, not all remaining games at once.

### E2: weekly schedule ratings

Search demand exists for fantasy football strength of schedule. Existing team and matchup pages expose the raw context; this cohort changes the answer into a ranked list of all 32 teams for each week. Each page uses a distinct weekly schedule and produces one auditable table.

Scale path if it works: the four position-specific rankings are now the bounded follow-on cohort. Add schedule-adjusted or week-specific position pages only after this cohort earns discovery and useful downstream actions.

### E3: player vs. exact rookie pick

Exact rookie-pick pages already earn clicks, and player comparisons already earn impressions. This cohort tests the intersection: a known player against one exact pick in both Superflex and 1QB. The first 20 pairs were chosen because their current Superflex values are close, not because every player/pick combination deserves a page.

Scale path: the hub accepts any supported QB-vs-QB or FLEX-eligible pairing and assigns it a stable, shareable URL. The sitemap starts with 50 reviewed decisions chosen from search demand, current redraft relevance, recorded opportunity, and close early-season production. Add future sitemap cohorts without silently swapping an existing URL’s subjects.

### E4: league-size rankings

League size changes replacement demand and exact pick availability. The first cohort covers 8-, 10-, 12-, 14-, and 16-team leagues in both Superflex and 1QB. Those ten pages change an actual model input and link to the same setting in the scoring lab.

Scale path if it works: test position-specific league-size pages in one bounded position cohort. Do not fan out every position, scoring rule, lineup shape, and league size simultaneously.

## Measurement schedule

Record the deployment timestamp and commit for every cohort.

### Day 3: discovery and correctness

- Confirm every URL returns 200, has a self-canonical, appears in the sitemap, and has no duplicate title.
- Check Search Console discovery/indexing samples. No copy changes unless there is a factual or technical defect.
- Confirm the cohort’s PostHog page-view event and outbound action properties arrive.

### Day 7: directional read

- Export Search Console with both Page and Query dimensions.
- Report submitted pages, indexed pages, pages with impressions, impressions, clicks, CTR, average position, and top queries for each cohort.
- Report visits and downstream actions from PostHog. Compare detail pages with their collection hub and with the player-comparison control.
- Treat results as directional. Do not scale solely because one page received one click.

### Day 14: first scale decision

Scale the next bounded batch when the cohort is technically healthy and meets at least one discovery test plus one quality test.

Discovery tests:

- at least 30% of detail pages have impressions; or
- at least three detail pages rank in the top 20 for a relevant non-brand query; or
- the cohort earns at least 100 non-brand impressions.

Quality tests:

- CTR is at least 2% on pages averaging position 20 or better; or
- at least 5% of organic detail-page visits continue to a player file, calculator, analyzer, scoring lab, team page, or related research page; or
- the cohort earns repeat visits within the same NFL week.

Hold when pages are being discovered but have not accumulated enough impressions. Improve internal linking before rewriting titles.

### Day 28: keep, revise, or consolidate

- Keep and scale cohorts that continue gaining indexed pages, relevant impressions, top-20 rankings, or downstream actions.
- Revise the answer structure or snippet once when rankings are present but CTR is weak.
- Consolidate or remove pages from the sitemap when they are indexed but produce no meaningful impressions, answer a duplicate intent, or cannot remain fresh.
- Record the decision and evidence in the experiment registry before the next batch ships.

## Reporting template

For each cohort, retain one row per checkpoint:

| Date | Age | Submitted | Indexed | Pages with impressions | Impressions | Clicks | CTR | Avg. position | Downstream actions | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|

Also retain:

- the five highest-impression page/query pairs;
- the five pages with the strongest downstream-action rate;
- any excluded brand queries;
- release IDs used by the pages;
- title or template changes made after launch.

## Publication guardrails

- A new detail page must answer a distinct user question with different underlying entities, settings, schedule, or measured values.
- Every cohort needs static validation for slug uniqueness, data coverage, canonical inclusion, sitemap inclusion, and an analytics event.
- Market-derived claims must use the latest validated public release.
- Schedule-derived claims must display the schedule/model release and its limits.
- Do not expose internal implementation notes, testing language, or planning conversation on consumer pages.
- Do not call team environment a player matchup, player projection, start/sit recommendation, injury report, news report, or betting advice.
- Do not publish sports-betting pages without live permitted odds, freshness enforcement, disclosures, and legal review.
- Do not publish start/sit pages until all required inputs below pass freshness and backtest gates.

## Start/sit launch gate — V1 lineup lean

Start/sit is the largest adjacent search opportunity, but it remains a product/data experiment before it becomes a large template. The initial public cohort requires:

1. player floor, median, and ceiling ranges calculated only from recorded games available before the target week;
2. opponent fantasy points allowed by position with a tightly capped adjustment;
3. current snaps plus position-relevant attempts, targets, and carries;
4. practice participation and game designation applied only when the report week equals the target week;
5. Standard, Half PPR and PPR outputs with four-point passing touchdowns clearly labeled;
6. visible source timestamps and automatic stale-status suppression;
7. a holdout backtest against previous-game and prior-season PPG baselines;
8. automatic postgame grading with the original pregame lean preserved by the deterministic model version.

The next projection upgrade remains gated on routes, red-zone work, official inactive status, schedule-adjusted opponent defense, weather and broader historical backtests. Do not generate every pair. The public answer states the estimated gap and strongest inputs without certainty or rumor summaries.

## Research source

The demand, competitor, Search Console, and data-capability evidence behind this playbook is preserved in [SEO_RESEARCH_2026-09-12.md](./SEO_RESEARCH_2026-09-12.md).
