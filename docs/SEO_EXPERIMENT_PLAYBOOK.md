# SEO experiment and scale playbook

Last updated: 2026-10-10
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
| E7: weekly position matchups | “Best Week N matchups for QB/RB/WR/TE” | 4 positions × Weeks 3–7 = 20 | `position_week_schedule_viewed` | Ranking strongly but low CTR; direct-answer metadata and advance publication now give upcoming weeks time to index |
| E8: start/sit decisions | “Who should I start this week?” | 350 reviewed decisions plus 25 evidence-selected additions as each new week begins, and an any-player comparison builder | `start_sit_comparison_viewed` | Proven in GSC and PostHog; the additive weekly cohort preserves indexed URLs while refreshing the inventory around current projections and matchups |
| E9: injury availability | “Who is listed on the fantasy injury report?” | Current hub + complete weekly archives | `fantasy_injury_report_viewed` | Initial cohort shipped; stale report weeks are explicit and never adjust a newer projection |
| E10: weekly player rankings | “Week N fantasy football rankings” | Current-week FLEX hub plus QB, RB, WR and TE pages | `weekly_rankings_viewed` | Initial five-page cohort shipped with PPR, Half PPR and Standard controls |
| E11: rest-of-season rankings | “Rest-of-season fantasy football rankings” | Overall hub plus QB, RB, WR and TE pages | `rest_of_season_rankings_viewed` | Initial five-page cohort shipped; stable URLs refresh from validated market, production, workload and remaining-schedule data |
| E12: buy low / sell high | “Who should I buy low or sell high?” | One stable weekly PPR board | `buy_low_sell_high_viewed` | Initial page shipped; candidates require a measurable gap between redraft market rank and the bounded ROS model |
| E13: weekly sleepers | “Fantasy football sleepers Week N” | Current-week hub plus QB, RB, WR and TE pages | `weekly_sleepers_viewed` | Initial five-page cohort shipped; candidates must rise above market position with two recorded games and viable recent snaps |
| E14: player trade answers | “What is Player X worth?” / “Should I trade Player X?” | Shared answer-first upgrade across 220 existing player files | `player_research_viewed` plus `research_cta_clicked` | Depth experiment shipped on URLs already averaging page-one visibility; no duplicate player-outlook URLs added |
| E15: fantasy playoff schedules | “Who has the best fantasy playoff schedule?” | Overall planner plus QB, RB, WR and TE boards | `playoff_schedule_viewed` plus `playoff_schedule_filter_changed` | Initial five-page cohort shipped with Weeks 15–17 and 14–16 controls across all reception settings |
| E16: ROS player comparisons | “Player A or Player B rest of season?” | One hub plus 30 curated same-position decisions | `rest_of_season_comparisons_viewed` plus `rest_of_season_comparison_viewed` | Initial cohort selected from exact GSC demand and close current ROS ranks; each page answers PPR, Half PPR and Standard |
| E17: NFL picks and predictions | “NFL Week N picks / predictions / ATS / over-under” | One hub, three weekly boards and one file per game | `nfl_prediction_hub_viewed`, `nfl_prediction_week_viewed`, `nfl_ats_picks_viewed`, `nfl_totals_picks_viewed`, `nfl_game_prediction_viewed` | First 19-page cohort uses licensed nflverse lines plus a frozen-at-kickoff FTT model; new weeks append automatically |
| E18: NFL pool and score decisions | “NFL score predictions / straight-up / survivor / confidence pool picks” | Four distinct weekly boards plus an early next-week preview | `nfl_score_predictions_viewed`, `nfl_straight_up_picks_viewed`, `nfl_survivor_picks_viewed`, `nfl_confidence_pool_picks_viewed` | Adds 25 URLs by publishing Week 6 early and separating four decision intents; do not scale into props or parlays without a proven data layer |
| E19: NFL betting utilities and team trends | “odds calculator / NFL score predictor / NFL ATS records” | Two evergreen tools, one ATS hub and 32 team trend files | `odds_calculator_viewed`, `nfl_score_predictor_viewed`, `nfl_ats_records_viewed`, `nfl_team_betting_trends_viewed` | 35-page cohort uses deterministic odds math and completed-game nflverse records; team pages refresh after results publish |
| E20: betting calculator suite | “parlay / no-vig / hedge / Kelly calculator” | One collection hub plus four distinct interactive tools | `betting_calculators_viewed`, `parlay_calculator_viewed`, `no_vig_calculator_viewed`, `hedge_calculator_viewed`, `kelly_calculator_viewed` | Five-page utility cohort uses only deterministic user-entered math; no live odds, accounts, wagers or affiliate flow |
| E21: combination and line calculators | “round robin / arbitrage / teaser calculator” | Three distinct interactive tools plus implied-probability depth on the existing odds URL | `round_robin_calculator_viewed`, `arbitrage_calculator_viewed`, `teaser_calculator_viewed` | Three-page expansion uses user-entered prices only; implied-probability demand strengthens the canonical odds calculator instead of creating a duplicate URL |

## October 11 NFL decision-board expansion

- GSC still had no meaningful betting-query footprint because E17 had just launched, so this remains a bounded acquisition test rather than a claimed winner.
- One focused DataForSEO check found “NFL score predictions” at 4,400 average monthly searches, “NFL picks straight up” at 1,300, “NFL survivor picks” at 1,600 and “NFL confidence pool picks” at 720. October seasonality reached 9,900, 3,600, 5,400 and 1,900 respectively in the prior season.
- Survivor and confidence pool were the best near-term wedges: keyword difficulty was 23 and 4, and both can use the model’s validated straight-up probability rather than the unproven ATS and totals outputs.
- The release adds Week 6 before Week 5 ends, then refreshes those early projections as completed games enter the model. Each Week 6 game still freezes only at its own kickoff.
- The new boards have distinct jobs: score projection, straight-up probability order, survivor elimination-pool shortlist and descending confidence-pool points. They link to the same permanent game evidence instead of creating duplicate matchup files.
- Measure each family separately after 7 and 14 days. Expand the winning intent across future weeks automatically; revise or stop a family that fails to earn impressions.

## October 10 NFL prediction launch

- Existing GSC data showed no meaningful betting-query footprint, so E17 is a true acquisition experiment rather than an expansion of an existing winner.
- One bounded DataForSEO demand check found 49,500 average monthly searches for “nfl predictions,” 74,000 for “nfl picks,” and sharply seasonal Week 6 variants at 5,400–8,100 searches with keyword difficulty of 5–13.
- The first cohort contains one evergreen hub, separate weekly prediction, ATS and totals boards, and 15 Week 5 game files. It deliberately avoids player props, parlays, “locks,” affiliate offers and scraped sportsbook branding.
- Odds, spreads and totals come from FTT’s existing nflverse schedule release under CC BY 4.0. The source feed updates every five minutes in season; FTT captures it during the validated scheduled publication and shows the exact snapshot time.
- Pregame predictions freeze at kickoff. Finished games then grade the archived snapshot; games completed before the experiment began remain result-only rather than receiving retroactive picks.
- The 2025 Weeks 5–18 walk-forward covered 208 games: 125–83 straight up, 81–82 ATS, 81–80 on totals and 7.63 points of per-team score error. The product discloses that ATS and totals were effectively coin flips and makes no edge claim.
- Measure impressions, page-one visibility and detail-page engagement after 7 and 14 days. Only expand into player props or prediction-market contracts after a separately licensed, durable source and a useful model are in place.

## October 10 betting utility and ATS-record launch

- One bounded DataForSEO request found 49,500 average monthly searches for “odds calculator” (difficulty 25), 4,400 for “NFL score predictor” (difficulty 16), 1,000 for “NFL ATS records” (difficulty 4), and 1,000 for “NFL betting trends.” Prior-season October demand rose to 74,000, 9,900, 2,900 and 2,400 respectively.
- E19 adds an interactive American-odds calculator with payout, implied probability, no-vig probability and market hold; an evergreen score-predictor interface over the existing frozen-at-kickoff model; and a 33-page ATS-record family covering all teams.
- Team ATS pages use only completed games with a recorded nflverse spread and total. The publication gate requires at least 17 graded prior-season games for every team and exactly 10 games in the rolling sample; record summaries are tested against their underlying game rows.
- Historical ATS and totals records are explicitly descriptive. The cohort does not claim that a prior cover rate predicts the next game, and it does not add props, parlays, affiliate offers or scraped sportsbook content.
- Measure the calculator, predictor, ATS hub and 32 team files as separate slices at Days 7 and 14. Scale into additional deterministic utility pages or team splits only when the cohort earns relevant impressions and engagement.

## October 10 betting calculator expansion

- One bounded DataForSEO request found 74,000 average monthly searches for “parlay calculator” at difficulty 19, 6,600 for “no vig calculator,” 2,900 for “hedge bet calculator,” and 1,600 for “Kelly criterion calculator” at difficulty 8. Prior-season September–October demand rose to 90,500 for the parlay term.
- E20 adds one calculator collection and four intent-specific tools. The existing odds calculator remains the single-odds destination; each new page performs materially different arithmetic and has its own inputs, answer, explanations and structured application data.
- Calculator events record only the control changed and leg count where relevant. Entered odds, stake, bankroll and probability values are not sent as custom analytics properties.
- The tools never submit wagers, fetch account data, identify a sportsbook, advertise a bonus or turn the weekly FTT model into a user probability. Measure each tool independently at Days 7 and 14 before adding more calculator variants.

## October 11 combination and line calculator expansion

- One bounded DataForSEO request found 2,400 average monthly searches for “round robin calculator,” 1,900 for “implied probability calculator,” 1,600 for “arbitrage betting calculator” at difficulty 11, and 210 for “teaser calculator.” Round-robin demand reached 4,400 searches in September 2025.
- E21 adds round-robin, arbitrage/dutching and teaser tools. Each performs different arithmetic: combination count and aggregate payout, equal-return allocation across exclusive outcomes, or football line movement plus entered-price payout.
- The existing odds calculator now includes a crawlable American-odds probability chart and links into the new tools. A separate implied-probability page would duplicate the same interface and divide authority, so that intent remains on the canonical odds URL.
- Round-robin maximum return is explicitly conditional on every leg winning. Arbitrage status uses only the prices entered and warns about movement, limits, commissions and settlement differences. The teaser tool never invents a standard price; the complete-card odds must be entered.
- Measure the three new URLs and the updated odds calculator separately after 7 and 14 days. Expand only if they earn relevant impressions or qualified calculator interaction.
- The first depth pass adds three competitor-parity features without new URLs: American/decimal/fractional conversion on the canonical odds page, full round-robin settlement for wins/losses/pushes, and arbitrage allocation from either total stake or desired return. These changes increase task completion while preserving one URL per intent.
- E22 deepens the proven start/sit family without expanding its URL cohort: test answer-first titles on 15 high-impression, low-CTR pages, add a two-to-four-player lineup shortlist on the hub, and connect every decision to related current-week calls. Compare the title cohort with unchanged start/sit pages after enough complete-week impressions accrue.

## October 3 weekly decision release

- In the final September 24–30 window, the start/sit cohort earned 315 clicks from 9,634 impressions at 3.27% CTR and average position 7.24. Several pages cleared 6% CTR, while PostHog showed sustained reading time and low bounce on the leading decisions.
- Start/sit therefore expands from 150 to 200 reviewed pairs. Stable URLs retain authority; stale week-specific selection notes are replaced with durable, consumer-facing explanations.
- Weekly position strength-of-schedule pages ranked at average position 4.86 across 6,045 impressions but earned only 0.93% CTR. Their titles, H1s, answer blocks and structured answers now lead with “strength of schedule,” best matchups and toughest matchups. Week 5 adds one complete four-position cohort.
- DataForSEO reports 260 average monthly searches for “fantasy football sleepers week 5,” with 2,400 searches in October 2025, keyword difficulty 3, an AI Overview and People Also Ask. E13 launches five stable URLs using current projections, positional market rank, two-game history, snap participation, matchup and same-week availability.
- The homepage now promotes the weekly decision layer before the trade calculator. Motion is CSS-only, pauses on hover, respects reduced-motion preferences, and does not delay page content or interaction.
- Start/sit begins with 350 reviewed pairs and adds 25 current-week pairs whenever the active NFL week advances. Pairs continue to require compatible positions, usable current-week projections and close enough ranges to form a real lineup decision; existing URLs remain available instead of being rotated out.
- GSC shows 180 player files with 18,162 impressions, 139 clicks, 0.77% CTR and average position 8.21. E14 improves the existing URLs instead of splitting authority: each page now answers trade-or-hold intent, publishes current value anchors, shows the latest verified workload, links into a preselected weekly decision, and exposes matching structured answers.
- DataForSEO reports 590 average monthly searches for “should I trade fantasy football,” rising to 2,400 in October 2025. The broad term has an estimated 12.6 referring-domain average across ranking pages, making player-specific answer depth a lower-cost test than a new calculator head term.
- E15 adds one complete playoff-planning cohort before seasonal demand peaks. DataForSEO shows 480 October and 880–1,300 November searches across “fantasy football playoff schedule” and “best fantasy playoff schedule,” with fewer than three average referring domains on the easier SERPs. The pages reuse the validated schedule and position-defense releases, support the two common three-week windows, and link every team to relevant player research.

## September 30 rest-of-season launch decision

- DataForSEO reports 18,100 average monthly searches for the core rest-of-season rankings cluster, with 60,500–90,500 searches during the 2025 in-season peak and keyword difficulty of 2–9 across the principal variants.
- Search Console exposed only four “rest of season” query/page rows in the latest final 28-day window, confirming that the site had no meaningful footprint for this intent before launch.
- E11 starts with five stable URLs. The model keeps current redraft market value as 70% of the rating and limits the combined influence of current scoring, opportunity, snap share and remaining positional schedule to 30%.
- E12 uses the same auditable PPR board to identify rank gaps. It publishes one continuously updated page rather than disposable weekly archives and links every candidate to an existing player file and calculator.
- The five-page cohort cleared the first expansion gate. On October 10, E16 added 30 curated, close-rank decisions with explicit “rest of season” intent.

## October 10 rest-of-season comparison expansion

- The five-page rest-of-season cohort earned 505 impressions at average position 7.15 in the latest final 28-day Search Console window, creating a page-one base for a deeper intent layer.
- Search Console surfaced exact pair demand including Sam Darnold or Kyler Murray, Kyren Williams or Ashton Jeanty, and Zay Flowers or Nico Collins for the rest of the season.
- DataForSEO confirms the parent cluster is both seasonal and attainable: “fantasy football rest of season rankings” averaged 12,100 monthly searches, while running-back and tight-end variants showed keyword difficulty as low as 3.
- E16 launches one hub and 30 same-position comparisons. Pages are selected from exact observed demand and close current model ranks, answer the question immediately, compare PPR, Half PPR and Standard, and connect to weekly start/sit, player research and the trade calculator.
- Measure the hub and detail pages separately after 7 and 14 days. Expand only the positions and pair patterns that earn impressions, top-20 visibility or qualified clicks; refresh the manifest as player roles change.
- Waiver-wire pages remain gated on a commercially permitted availability or add/drop data source. Search volume alone is not sufficient to publish advice that cannot establish whether a player is plausibly available.

## September 30 scale decision

- Start/sit earned 307 clicks from 8,266 impressions across 53 pages from September 14–28: 3.71% CTR at an average position of 7.11. Individual decisions reached double-digit CTR, including 22.2% for “Metcalf or Diggs Week 3” and 28% for “Hurts or Mahomes Week 3.”
- The reviewed start/sit cohort therefore scales from 50 to 150 stable pair URLs. New pairs are drawn from current redraft relevance and close current-week projections; the any-player builder remains available for the long tail without putting every possible pair in the sitemap.
- Weekly rankings launches as a five-page experiment because the same data and interface answer the adjacent “Week N rankings” intent. Keyword research shows strong in-season demand, while a compact position cohort keeps the test easy to measure.
- The rankings board defaults to PPR, supports Half PPR and Standard, shows player images and ranges, and sends each row into a preselected start/sit decision. Evaluate E10 separately from E8 after seven and fourteen days.

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
- Do not publish sports-betting pages without permitted data, explicit timestamps or historical labels, freshness enforcement, consumer disclosures, and a review of the intended jurisdiction and use case.
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
