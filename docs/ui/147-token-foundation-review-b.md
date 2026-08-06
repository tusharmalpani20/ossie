# Plan 147 Reviewer B — semantic token foundation

Candidate: `105fc5b`
Surface: `token-foundation`
Routes: web `/__design-system`; local extension popup root
Review mode: independent read-only product, accessibility, and adversarial QA

## Verdict

`accept`

The candidate resolves all confirmed live P1-002 consumers through one shared
token source and adds a repository check that rejects newly undefined
consumer properties. It does not alter domain, permission, tenant, public-link,
Capture, Revision, Publication, schema, or server behavior.

## Gates

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Product / domain truth | pass | Values are existing Quiet Versioned Workbench semantics; no product terminology or lifecycle behavior changed. |
| Permissions / security | pass | CSS-only runtime surfaces and local synthetic gallery/popup; no auth or public-link code changed. |
| State coverage | pass | Gallery covers loading, published, read-only, and warning examples; extension covers unconfigured Connect state. |
| Accessibility | pass | Desktop and narrow axe runs report 0 violations; web gallery heading hierarchy and extension labels are semantic. Narrow run has one incomplete contrast probe due partially obscured text near intentional table scrolling. |
| Browser behavior | pass | Real Chromium rendered web gallery and local popup; computed tokens resolved; document width stayed at viewport width. |
| Engineering verification | pass | CSS token check passes (107 definitions / 101 consumers); web affected tests 8/8; extension 140/140; UI 7/7; affected typechecks/lints/builds pass. |
| Evidence safety | pass | Synthetic design gallery and unconfigured extension state only; no secrets, cookies, tokens, customer data, or raw Capture input recorded. |
| Regression scope | pass | Candidate is limited to token CSS/export/aliases, bounded gallery semantics/reflow, and the repository check; no dependency or schema changes. |

## Findings

No P0/P1 findings.

`B-P2-002` — The narrow axe audit remains incomplete for one contrast node
because the table scroll region partially obscures a nearby description. It
reports no violation and does not indicate a token contrast failure.

Disposition: accepted with evidence limitation; retain the table scroll pattern
as an intentional difference and revisit its affordance in the gallery family.

`B-BLOCKED-001` — Installed extension-toolbar verification was unavailable in
this runner. The local Vite popup route is verified, but toolbar/permission
behavior remains blocked for the extension-specific surface.

Disposition: mark only the extension-toolbar capability as
`blocked_local_for_run`; do not manufacture toolbar evidence or block the
web/shared token candidate on it.

## Unverified items and residual risks

- Actual browser 200% zoom and screen-reader output were not captured.
- Shared aliases intentionally remain for legacy CSS consumers; future raw
  generic-token cleanup should use the same repository check and a separate
  bounded candidate.

