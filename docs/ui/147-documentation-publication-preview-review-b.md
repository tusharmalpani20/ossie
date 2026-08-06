# Plan 147 Reviewer B — Documentation Publication preview

Candidate: `001df10`
Surface: `documentation-previews`
Route: authenticated internal Documentation Publication sequence `1`, plus
anonymous access attempt
Review mode: independent read-only product, accessibility, and adversarial QA

## Verdict

`accept`

The candidate uses the existing authenticated Publication list and immutable
Revision snapshot contract, adds no server route or permission bypass, and
preserves the internal/public distinction. The implementation and evidence
are safe synthetic local fixtures only.

## Gates

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Product / domain truth | pass | Publication sequence `1` is displayed with the exact Revision `1` returned by its Publication record; content is labeled read-only. |
| Permissions / security | pass | Authenticated route renders through `ProjectVersionRouteBoundary`; anonymous browser session receives the existing sign-in gate without Publication metadata. |
| State coverage | pass | Unit tests cover loading, unavailable, and populated states; browser covers populated and denied states; frozen state is explicit. |
| Accessibility | pass | agent-browser axe 4.12.1: 0 violations, 49 passes at both desktop and 390px; semantic tree has a main region, heading hierarchy, labels, tabs, and links. |
| Browser behavior | pass | Real local Chromium route rendered Publication content; browser error list empty; narrow document width equals viewport width. |
| Engineering verification | pass | App/component tests 22/22, docs content tests 5/5, web typecheck and lint pass, `git diff --check` pass. |
| Evidence safety | pass | Fixtures are synthetic local Plan 125 records; no password, cookie, token, private URL, customer data, or raw Capture material recorded. |
| Regression scope | pass | Candidate changes only the web route/API typing/component/tests and evidence; no server, schema, dependency, or public-link behavior changed. |

## Findings

No P0/P1 findings.

`B-P2-001` — Publication lookup and Revision loading are two sequential
authenticated requests. If the exact record cannot be resolved, the UI gives a
truthful unavailable state; no stale or latest Publication is substituted.

Disposition: accepted within the existing immutable API contract. No retry or
new endpoint is warranted for this bounded route repair.

## Unverified items and residual risks

- Direct 200% zoom evidence and screen-reader output were not captured in this
  environment; semantic-tree and axe evidence are the available checks.
- Archived Project Version behavior remains owned by the existing route
  boundary and was not changed by this candidate.

