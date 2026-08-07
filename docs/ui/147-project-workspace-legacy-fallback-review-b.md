# Plan 147 — legacy Project redirect fallback review B

Candidate: `879a1bd`
Surface: `projects-workspace` — route-neutral legacy redirect fallback
Cycle: bounded continuation after `e94d6a9`; does not reopen the workspace
route-ownership cycle
Reviewer: product, accessibility, and engineering review
Verdict: `accept` — bounded fallback only, pending human review

## Contract review

The candidate changes only the `LegacyProjectRedirect` transient markup and
its focused App tests. It preserves the existing `getProject` request, the
successful `projectVersionWorkspaceUrl` redirect, the current URL suffix and
hash handling, and the existing loading/not-found copy. No API, auth,
Project, Project Version, Project Membership, Organization tenant, public-link,
Publication, immutable-content, persistence, or mutation contract changed.

The focused route tests pass 31/31, including the two new assertions for the
loading `role=status` and failed-request `role=alert` branches. The anonymous
browser request remained a truthful unauthenticated 401 boundary. No
credentials, cookies, customer data, or private URLs were used, and no
successful or failed mutation path was submitted.

## Accessibility and adversarial checks

- The fallback owns one named `main` landmark through `aria-labelledby` and a
  level-one heading in both branches.
- Loading is announced with `role=status`; the failure is announced with
  `role=alert`.
- Desktop 1440×900, narrow 390×844, and native Page zoom 200% (`dpr=2`,
  525px CSS width) retained equal client and scroll widths.
- Chromium axe audits returned 0 violations for all three sampled layouts.
- Console/page-error checks found no application errors beyond expected
  development notices; network inspection showed only expected local reads,
  including the Project 401.
- The terminal not-found branch has no invented recovery action, preserving
  the existing product behavior and avoiding disclosure or navigation changes.

## Disposition

Accept the route-neutral fallback correction as a bounded engineering
candidate pending human review. Keep the `projects-workspace` family and
P2-006 at `needs_human_surface`: the normal `/projects/:projectId` route still
does not mount `ProjectWorkspacePage`, and deciding whether to change that
ownership is outside this correction. Do not treat this review as approval of
the broader workspace candidate or as closure of Plan 147’s cross-product
hardening matrix.
