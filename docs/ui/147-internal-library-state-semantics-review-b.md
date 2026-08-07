# Internal library transient-state semantics — Review B

Candidate: `ce1d373` with route-test synchronization follow-up `b159eed`  
Surface: Capture Sessions, Guides, Interactive Demos, and Documentation Sites
list transient states  
Reviewer: B — product, accessibility, engineering, and adversarial QA  
Date: 2026-08-07

## Verdict

`accept` for the bounded candidate, pending human review of Plan 147.

## Boundary and truth checks

- Capture, Guide, and Interactive Demo retain their existing authentication,
  not-found, generic-error, Retry, and loader boundaries. Documentation Sites
  remains behind the existing Project Version route access boundary.
- Existing sign-in URLs, not-found copy, Retry labels, and loader/error text are
  unchanged. The only semantic additions are page-level headings and explicit
  `role=status`/`role=alert` on the existing transient messages.
- The diff contains only the four list components, their local CSS/tests, and
  route-test synchronization. There are no API, schema, persistence,
  membership, tenant, public-link, Publication/Revision, Capture immutability,
  or route-parser changes.
- Browser failure injection aborted only the selected list request. It did not
  submit a mutation, alter the fixture, or weaken the authenticated shell.
- Four browser snapshots show one named h1 and one alert with the existing retry
  action; axe reported 0 violations and no incomplete checks.

## Verification

- TDD red run: 4 files, 11 expected state-contract failures before the
  implementation.
- Green focused list run: 4 files, 34/34 tests.
- App route tests: 20/20.
- Full web suite: 95 files, 507/507 tests.
- Web typecheck, lint, build, CSS-token check (130 definitions / 123
  consumers), and diff check pass.
- Narrow reduced-motion browser pass: 390px viewport, no horizontal overflow,
  Skip link receives focus after Tab, axe 0/0, and no page errors.

## Residuals and disposition

No P0/P1 issue was found and no new product decision is required. Browser
loading-delay, unauthenticated/not-found, actual 200% zoom, installed extension,
the unresolved `/projects/:projectId` route ownership, P2-001 scope, and the
broader cross-product matrix remain explicitly outside this candidate. The
candidate is reversible by reverting `ce1d373` and its bounded evidence/review
records; prior candidates and `needs_human_surface` dispositions remain intact.

