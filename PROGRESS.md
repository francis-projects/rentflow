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
- **Results:** Pending GitHub Actions run.
- **Completion estimate:** 55% (implementation committed; real browser/responsive and accessibility checks still required).
- **Next:** Fix any test/lint/type/build failures; then inspect the actual local landing page at mobile, tablet and desktop widths and verify image loading, pricing toggle behavior and navigation.
