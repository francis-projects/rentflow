import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("landing page uses the database-backed pricing component", () => {
  assert.match(page, /PricingSection/);
  assert.match(page, /monthly_price_minor/);
  assert.match(page, /annual_price_minor/);
});

test("landing pricing offers accessible monthly and annual controls", () => {
  const component = readFileSync(new URL("../components/pricing-section.tsx", import.meta.url), "utf8");
  assert.match(component, /Monthly/);
  assert.match(component, /Annual/);
  assert.match(component, /aria-pressed/);
  assert.match(component, /annual_price_minor/);
});

test("marketing layout includes responsive breakpoints and reduced-motion support", () => {
  assert.match(css, /max-width:\s*375px|max-width:\s*390px/);
  assert.match(css, /max-width:\s*768px/);
  assert.match(css, /min-width:\s*1440px|max-width:\s*1440px/);
  assert.match(css, /prefers-reduced-motion/);
});

test("landing page includes entrance, scroll-stagger and dashboard motion", () => {
  assert.match(page, /ScrollReveal><PricingSection/);
  assert.match(css, /@keyframes hero-enter/);
  assert.match(css, /@keyframes dashboard-float/);
  assert.match(css, /\.scroll-reveal\.is-visible \.showcase-card/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
