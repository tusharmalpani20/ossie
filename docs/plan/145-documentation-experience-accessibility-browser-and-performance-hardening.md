# Child Plan 145: Documentation Experience Accessibility, Browser, And Performance Hardening

Date reserved: 2026-07-31

Status: Reserved. Not implementation-ready and not authorized for execution.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/144-documentation-generated-api-request-examples.md`

## Objective

Harden and dogfood the integrated authoring, reader, and request-example
experience without adding new product features.

## Required expansion scope

- desktop, 320px, keyboard, focus, 200% zoom/reflow, touch target, screen-reader
  semantics, live status, and reduced-motion matrix;
- Chromium through agent-browser, plus Firefox/WebKit through existing
  repository browser tooling; install compatible headless binaries when
  feasible and record a genuine tooling/platform limit instead of a false pass;
- automated axe, accessibility-tree, and available real assistive-technology
  evidence with honest capability limits;
- loading/empty/error/unsupported/denied/conflict/offline/recovery flows;
- CSP/XSS, private-content exclusion, credential exclusion, console/network
  failure, and tenant/access checks;
- bundle and representative authoring/reader/example performance comparison;
- comparison against the pre-adoption native baseline and the retained fallback,
  with route-level lazy-loading and initial crawler HTML checked separately;
- existing Documentation plus Capture/Guide/Demo/extension/public/embed
  compatibility and workspace verification;
- dependency/license/advisory/frozen-install review;
- sanitized evidence under `docs/ui/` using existing fixtures and agent-browser.

## Hard boundaries

- No feature expansion, redesign unrelated to proven defects, parallel custom
  browser/product harness, production p75 claim from lab data, or false
  browser/AT pass.
- PostgreSQL warning, broad lint debt, shared rate limiting/jobs/storage, and
  production telemetry remain separately owned unless a scoped regression must
  be fixed.

## Exit gate

No unresolved S1/S2 defect remains, required evidence passes or limitations are
truthful and owned, the scoped fixes are close-rechecked, and child `146` can
perform final closure.
