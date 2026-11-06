# RentFlow landing page refresh

## Design direction
A modern, editorial property-management SaaS landing page: warm off-white surfaces, deep forest-green accents, large confident typography, real property photography, restrained motion, clear hierarchy and a pricing comparison that is easy to scan. Motion respects `prefers-reduced-motion`.

## Skill availability
The exact Emilkowalski, Impeccable and Taste skills are not installed in this workspace. The implementation applies comparable practical design principles: strong visual hierarchy, intentional whitespace, responsive composition, subtle transitions, accessible controls and restrained color.

## Iteration log

### Iteration 1 — 2026-11-06
- **Changed:** Added a database-driven monthly/annual pricing toggle, clear annual savings, a refreshed pricing card grid, property imagery, hover states, scroll-reveal sections and responsive styles for 375px, 768px, 1024px and 1440px layouts. Changed the marketing dashboard preview currency label to USD.
- **Tests added first:** Node's built-in test runner checks database-driven pricing, accessible billing toggle controls, responsive breakpoints and reduced-motion support.
- **CI:** Added `npm test` before lint, typecheck and build.
- **First CI result:** The initial page commit exposed a TypeScript prop mismatch (the component required fields the page did not select) and lint reported an obsolete pricing formatter plus a pre-existing unused inspection-evidence action import.
- **Fixes made:** Narrowed the pricing component type to the selected fields; removed the obsolete formatter; restored the inspection evidence upload form so its server action is actually used.
- **Latest CI:** Passed on commit `1dbb9ab17db2953ab70430bce931fb6c7da97da7`: `npm test`, ESLint, TypeScript typecheck, Next.js production build and Supabase Preview check all green.
- **Warnings:** ESLint completed successfully with no warnings on the latest commit. (The npm install step reports dependency audit/deprecation notices; these are not build warnings and were not auto-fixed because that could change dependencies outside this design iteration.)
- **Not yet verified:** Actual browser rendering, image delivery, toggle interaction in a live browser, every navigation target, and 375px / 768px / 1440px screenshots. No Lighthouse run available from CI.
- **Completion estimate:** 72% (code and CI quality are green; browser-based definition-of-done items remain open).
- **Next:** User refreshes the local site and provides screenshots at 375px, 768px and desktop; verify visual behavior and adjust based on actual rendering.

### Iteration 2 — 2026-11-06
- **User feedback:** Supplied screenshots at 1440px, 768px and 375px. Desktop composition reads well; tablet and mobile collapse into a single column as intended, with the dashboard moving below the hero copy.
- **Changed:** Added staggered scroll-triggered reveals for showcase cards, feature cards, workflow steps and pricing cards; added hero copy entrance timing, a gently floating dashboard preview, slow orbit drift, a subtle status-dot pulse and animated CTA arrows/hover lift. Wrapped pricing in the scroll-reveal observer.
- **Tests added first:** Added assertions for the pricing reveal wrapper, hero keyframes, dashboard float and staggered scroll reveal selector.
- **Accessibility:** All new motion is disabled under `prefers-reduced-motion: reduce`.
- **Next:** Confirm the latest CI run and ask for a quick scroll check of the pricing toggle and image sections on the local browser.

### Iteration 3 — 2026-11-06
- **Read first:** Resumed from the existing Iteration 1 and 2 log; no landing page rebuild.
- **Tests added first:** Added checks for mobile section navigation and data-derived annual discount messaging.
- **Changed:** Replaced the fixed 'Save 2 months' claim with a neutral annual-discount label. Each plan now calculates its actual annual savings percentage from the Supabase monthly and annual prices, and announces price changes with an accessible polite live region.
- **Changed:** Restored the Features, How it works and Plans links on mobile in a compact second navigation row. Added visible keyboard focus outlines to marketing navigation, CTAs and billing controls.
- **Test correction:** The first mobile-nav assertion was too restrictive about CSS formatting and failed. Replaced it with a selector-based assertion; the final test suite passes.
- **CI:** Latest head commit b3d0ec46f398a76e26e33df2d6a0d5c4aca0755d passed npm test, ESLint, TypeScript typecheck and the Next.js production build.
- **Still unverified:** Live browser click-through for signup/sign-in and the monthly/annual toggle; image loading in the user's environment; Lighthouse; and fresh screenshots after the mobile-nav adjustment. The previous screenshots showed the existing 375px, 768px and 1440px layout before this latest small navigation refinement.
- **Completion estimate:** 80% (latest automated quality checks green; visual and end-to-end browser checks remain).
- **Next:** Verify the current localhost page at 375px, 768px and 1440px, click both billing intervals and each CTA, and run Lighthouse/accessibility checks if browser tooling is available.
