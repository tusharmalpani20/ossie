# Plan 147 global-fallback review B

Candidate: `de37b5e`  
Surface: unsupported route `/unknown`  
Reviewer: B — product, accessibility, and adversarial QA  
Verdict: `accept`

## Gates

- Pass: the route parser remains unchanged; only the existing final App
  fallback presentation and its test/CSS are changed.
- Pass: recovery links point to the existing `/projects` and `/login` routes.
  No authorization, tenant, public-link, or API behavior was added.
- Pass: the TDD route assertion failed before the new named main was added and
  passes in the candidate.
- Pass: the baseline level-one-heading axe violation is fixed. The fallback
  page reports 0 violations / 0 incomplete at desktop and narrow widths.
- Pass: the fallback uses a solid page background; the previous gradient-based
  brand contrast probe is gone.
- Pass: reduced-motion, keyboard, no-overflow, and local console/request checks
  pass. No recovery link was followed during evidence.
- Pass: web focused route test, typecheck, lint, build, and diff check pass.

## Residual scope

The shell-failure Retry Documentation state is an existing, separate boundary;
this candidate does not claim to validate a forced lazy-load failure. Browser
zoom controls remain environment-limited, and P2-010 remains queued.

## Disposition

Accept pending human review. No P0/P1 product, security, or accessibility
finding remains in the unsupported-route state.
