import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  impactPage,
  researchComponent,
  sixPointPage,
  standardPage,
  halfPprPage,
  sitemap,
  header,
  footer,
  indexNow,
] = await Promise.all([
  read("../src/app/scoring-impact/page.tsx"),
  read("../src/app/components/ScoringResearchPage.tsx"),
  read("../src/app/scoring/6-point-passing-td-rankings/page.tsx"),
  read("../src/app/scoring/standard-vs-ppr-player-values/page.tsx"),
  read("../src/app/scoring/half-ppr-trade-values/page.tsx"),
  read("../src/app/sitemap.ts"),
  read("../src/app/components/SiteHeader.tsx"),
  read("../src/app/components/Footer.tsx"),
  read("../scripts/submit-indexnow.mjs"),
]);

const routes = [
  "/scoring-impact",
  "/scoring/6-point-passing-td-rankings",
  "/scoring/standard-vs-ppr-player-values",
  "/scoring/half-ppr-trade-values",
];

test("the scoring impact lab is shareable, explainable, and conversion tracked", () => {
  assert.match(impactPage, /alternates: \{ canonical: "\/scoring-impact" \}/);
  assert.match(impactPage, /Passing TD/);
  assert.match(impactPage, /Receptions/);
  assert.match(impactPage, /FLEX spots/);
  assert.match(impactPage, /Starting RB/);
  assert.match(impactPage, /Starting WR/);
  assert.match(impactPage, /Starting TE/);
  assert.match(impactPage, /scoring_impact_viewed/);
  assert.match(impactPage, /scoring_impact_setting_changed/);
  assert.match(impactPage, /scoring_impact_calculator_opened/);
  assert.match(impactPage, /impactSettingsHref/);
  assert.match(impactPage, /fantasy-football-trade-analyzer/);
});

test("focused scoring pages have unique search intent and evidence", () => {
  assert.match(sixPointPage, /6-Point Passing TD Fantasy Football Rankings/);
  assert.match(sixPointPage, /two additional points per passing TD/i);
  assert.match(standardPage, /Standard vs\. PPR Fantasy Football Player Values/);
  assert.match(standardPage, /Zero fantasy points are awarded for each reception/);
  assert.match(halfPprPage, /Half PPR Fantasy Football Trade Values/);
  assert.match(halfPprPage, /Every reception adds 0\.5 fantasy points/);
  assert.match(researchComponent, /"@type": "FAQPage"/);
  assert.match(researchComponent, /"@type": "Dataset"/);
  assert.match(researchComponent, /scoring_research_viewed/);
  assert.match(researchComponent, /scoring_research_lab_opened/);
  assert.match(researchComponent, /impact\.market\.meta\.releaseId/);
  assert.match(researchComponent, /Tradyr public API/);
});

test("every scoring surface is crawlable and internally linked", () => {
  for (const route of routes) {
    assert.ok(sitemap.includes(`"${route}"`), `${route} is in the sitemap`);
    assert.ok(indexNow.includes(`"${route}"`), `${route} is sent to IndexNow`);
    assert.ok(
      header.includes(route) || footer.includes(route),
      `${route} has a global internal link`,
    );
  }
  assert.match(header, /label: "Scoring"/);
});
