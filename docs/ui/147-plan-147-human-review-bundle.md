# Plan 147 human review bundle

Status: `agent_accepted_pending_human`  
Execution worktree: `/home/ubuntu/ossie-plan147`  
Branch: `agent/plan-147-ui-quality`  
Date: 2026-08-07

## Executive outcome

The autonomous UI-quality run has produced immutable candidates and review
records for the planned surface families. The final Projects workspace state
cycle is intentionally incomplete: `ProjectWorkspacePage` is not mounted by
the normal `/projects/:projectId` route, so its browser behavior cannot be
claimed without a route-ownership decision. P2-001 is also held at
`needs_human_surface` because its only scope definition is “cross-product
libraries/readers,” with no exact route owner. Plan 147 is not human-approved
and is intentionally not marked complete.

## Start here

- [Canonical surface, issue, review, and evidence ledger](./147-ossie-ui-quality-program-ledger.md)
- [Plan 147](../plan/147-ossie-ui-quality-program.md)
- [Current truth and accepted visual direction](../../CONTEXT.md)

The ledger is the authoritative index for every earlier surface candidate and
its review artifacts. The latest closeout bundle is grouped below for quick
review.

## Latest closeout surfaces

### Design-system gallery — `7cf7057`

- [Review A](./147-design-system-gallery-review-a.md)
- [Review B](./147-design-system-gallery-review-b.md)
- [Before desktop](./147-design-system-gallery-before-desktop.png), [after desktop](./147-design-system-gallery-after-desktop.png)
- [Before narrow](./147-design-system-gallery-before-narrow.png), [after narrow](./147-design-system-gallery-after-narrow.png)

The gallery now exposes shared loading/empty/error/read-only/validation
patterns and keeps its long-label table within the narrow viewport.

### Global fallback — `de37b5e`

- [Review A](./147-global-fallback-review-a.md)
- [Review B](./147-global-fallback-review-b.md)
- [Before desktop](./147-global-fallback-before-desktop.png), [after desktop](./147-global-fallback-after-desktop.png)
- [Before narrow](./147-global-fallback-before-narrow.png), [after narrow](./147-global-fallback-after-narrow.png)

Unsupported routes now have a truthful Page-not-found heading and safe
Projects/sign-in recovery links.

### Contributor docs — `ae37ba6`

- [Review A](./147-contributor-docs-review-a.md)
- [Review B](./147-contributor-docs-review-b.md)
- [Before desktop](./147-contributor-docs-before-desktop.png), [after desktop](./147-contributor-docs-after-desktop.png)
- [Before narrow](./147-contributor-docs-before-narrow.png), [after narrow](./147-contributor-docs-after-narrow.png)

The public contributor/operator docs landing page now uses a semantic hero
figure and caption while preserving its source-of-truth boundary.

### Token-foundation follow-up — `59fd07f`

- [Review A](./147-token-foundation-followup-review-a.md)
- [Review B](./147-token-foundation-followup-review-b.md)
- [Desktop evidence](./147-token-foundation-followup-desktop.png), [narrow evidence](./147-token-foundation-followup-narrow.png)

The four live undefined token consumers now resolve through the canonical
semantic token source without changing their rendered fallback values.

### Shared foundation — `9e53e20`

- [Review A](./147-shared-foundation-review-a.md)
- [Review B](./147-shared-foundation-review-b.md)
- [Parent desktop](./147-shared-primitives-baseline-desktop.png), [candidate desktop](./147-shared-primitives-candidate-desktop.png)
- [Parent narrow](./147-shared-primitives-baseline-narrow.png), [candidate narrow](./147-shared-primitives-candidate-narrow.png)

Shared `@repo/ui` primitives now resolve equivalent defaults through semantic
Ossie tokens. The local gallery documents command hierarchy and synthetic
state/list/workbench/drawer/reader/access/compact-extension patterns. The
follow-up also removes only five `.page`/`.main` CSS declaration pairs proven
orphaned by a source-consumer audit. Both blind reviews accept pending human
review; the gallery is synthetic/local-only and the installed toolbar remains
blocked in this environment.

### Shared shell mobile — `8b45a4b`

- [Review A](./147-shared-shell-mobile-review-a.md)
- [Review B](./147-shared-shell-mobile-review-b.md)
- [Before desktop](./147-shared-shell-before-desktop.png), [after desktop](./147-shared-shell-after-desktop.png)
- [Before narrow](./147-shared-shell-before-narrow.png), [after narrow](./147-shared-shell-after-narrow.png), [after 320px](./147-shared-shell-after-320.png)

The shared portal navigation now wraps inside the viewport at narrow widths:
two columns at 390px and one column at 320px. Desktop remains unchanged. Both
blind reviews accept pending human review. The browser evidence uses the
truthful unauthenticated `/projects` state; its unrelated missing-h1 axe finding
and the unavailable real browser-zoom control remain recorded rather than
overstated.

### Projects denied state — `3a8fad4`

- [Review A](./147-projects-denied-review-a.md)
- [Review B](./147-projects-denied-review-b.md)
- [Before desktop](./147-projects-denied-before-desktop.png), [after desktop](./147-projects-denied-after-desktop.png)
- [Before narrow](./147-projects-denied-before-narrow.png), [after narrow](./147-projects-denied-after-narrow.png)

The unauthenticated Project list recovery card now has a semantic level-one
`Projects` heading while preserving the existing sign-in copy and safe `next`
URL. The state is axe-clean at desktop and narrow widths, and both blind
reviews accept pending human review.

### Projects loading and recoverable error — `aa6f892`

- [Review A](./147-projects-state-semantics-review-a.md)
- [Review B](./147-projects-state-semantics-review-b.md)
- [Error desktop](./147-projects-state-error-after-desktop.png)
- [Error narrow](./147-projects-state-error-after-narrow.png)

The Project list loading and recoverable-error states now retain a semantic
`Projects` h1. Loading is announced through `role=status`; the error message is
announced through `role=alert`, and the existing Retry action is unchanged.
ProjectListPage, App, and shell focused checks pass 17/17, 20/20, and 4/4;
the clean web suite passes 95 files / 498 tests. Desktop and narrow error
browser evidence is axe-clean with no overflow. This runner cannot safely
delay the local API response, so loading has deterministic component-test
evidence and no fabricated browser screenshot. Both blind reviews accept
pending human review.

### Project workspace transient states — `e94d6a9` — needs human surface

- [Review A](./147-project-workspace-state-semantics-review-a.md)
- [Review B](./147-project-workspace-state-semantics-review-b.md)
- [Canonical preflight and route finding](./147-ossie-ui-quality-program-ledger.md#projects-workspace-state-semantics-exact-surface-preflight)

`ProjectWorkspacePage` now has focused semantic contracts for loading,
unauthenticated, not-found, and recoverable-error branches: 9/9 tests pass, the
loading message is `role=status`, and the recoverable error is `role=alert`.
The real `/projects/project_1` route is still owned by `LegacyProjectRedirect`
and rendered the existing 401 fallback, so no candidate screenshot or runtime
axe result is claimed. Review A records the cycle as incomplete; Review B
requires human direction on whether the legacy route should be replaced,
wrapped, or left canonical.

### P2-001 cross-product consistency — needs human surface

- [Canonical scope preflight](./147-ossie-ui-quality-program-ledger.md#p2-001-cross-product-consistency-scope-preflight)
- [Publication preview Review A finding](./147-documentation-publication-preview-review-a.md)

P2-001 is not an implementation candidate. Its ledger definition names only
“cross-product libraries/readers.” The concrete retained finding asks whether
the bounded Documentation Publication preview should share navigation/TOC
treatment with the public Documentation reader. Keeping the bounded preview,
adding reader chrome, or selecting another exact route pair are materially
different choices. The issue is recorded as `needs_human_surface`; no broad
cross-product rewrite or baseline change was made.

### Additional public-route hardening pass — `3397152`

- [Guide tablet evidence](./147-hardening-guide-tablet-1024.png), [Guide mobile evidence](./147-hardening-guide-mobile-390.png)
- [Documentation unavailable tablet evidence](./147-hardening-documentation-unavailable-tablet-1024.png), [Demo unavailable tablet evidence](./147-hardening-demo-unavailable-tablet-1024.png)

The second clean pass exercised the synthetic public Guide at 1024px and 390px,
plus truthful unavailable Documentation and Demo routes. Body/document widths
matched the viewport; reduced-motion, CSS zoom reflow probes, axe, and console
checks were recorded in the ledger. The current disposable fixture does not
provide valid Documentation or Demo publications, so those routes are not
claimed as populated-reader evidence.

### Internal library transient states — `ce1d373` / `b159eed`

- [Review A](./147-internal-library-state-semantics-review-a.md)
- [Review B](./147-internal-library-state-semantics-review-b.md)
- [Capture Sessions error state](./147-internal-library-state-error-capture-sessions-desktop.png)
- [Guides error state](./147-internal-library-state-error-guides-desktop.png)
- [Interactive Demos error state](./147-internal-library-state-error-interactive-demos-desktop.png)
- [Documentation Sites error state](./147-internal-library-state-error-documentation-sites-desktop.png)
- [Documentation Sites narrow reduced-motion state](./147-internal-library-state-error-documentation-sites-mobile-390.png)

The bounded candidate gives each internal library owner a page-level heading in
its loading and recoverable transient branches, retains existing message copy,
and exposes loading/error announcements through `role=status`/`role=alert`.
Capture, Guide, and Demo sign-in/not-found branches retain their existing
recovery behavior. Documentation Sites retains its existing loading/error
behavior and gains the same heading treatment. The TDD red run recorded 11
expected failures; the focused four-owner suite passed 34/34, App route tests
20/20, and the clean web suite 95 files / 507 tests. Web typecheck, lint, build,
CSS-token check, and diff check pass. Authenticated synthetic error states for
all four routes are axe-clean at 1440px; Documentation also passed at 390px
with reduced motion, no overflow, and keyboard focus on the skip link.

Loading and unauthenticated/not-found browser screenshots are intentionally not
claimed: the runner cannot safely delay local responses, and the browser pass
used the authenticated synthetic fixture. No API, route parser, permission,
tenant, public-link, Publication/Revision, Capture immutability, or mutation
behavior changed. P2-001 and the unresolved Project workspace route ownership
remain human-surface decisions.

## Final second clean browser pass — 2026-08-07

Fresh Chromium sessions added a final representative pass without changing
fixtures or submitting mutations.

- Authenticated desktop 1440×900: `/projects`, Capture Sessions, Guides,
  Interactive Demos, and Documentation Sites. Each rendered one expected h1
  and one main; axe reported 0 violations / 0 incomplete; no page errors were
  reported. Screenshots: [Projects](./147-second-pass-projects-desktop.png),
  [Capture](./147-second-pass-capture-desktop.png),
  [Guides](./147-second-pass-guides-desktop.png),
  [Interactive demos](./147-second-pass-demos-desktop.png), and
  [Documentation](./147-second-pass-documentation-desktop.png).
- Authenticated responsive representatives: Documentation Sites at 1024×768
  and Guides at 390×844. Both had axe 0/0, one main, the expected h1, and
  document width equal to the viewport. The mobile Tab path focused Skip to
  main content. Evidence: [tablet](./147-second-pass-documentation-tablet-1024.png),
  [mobile](./147-second-pass-guides-mobile-390.png).
- Anonymous public boundary: the seeded valid Guide and its embed route passed
  axe 0/0 with one main and no page errors at 1440px. Evidence:
  [Guide](./147-second-pass-public-guide-desktop.png) and
  [embed](./147-second-pass-public-guide-embed.png).
- Anonymous unavailable boundary: the current fixture truthfully rendered
  unavailable Documentation and missing Demo states, both axe-clean with no
  page errors. These are not populated-reader evidence. Evidence:
  [Documentation unavailable](./147-second-pass-public-documentation-unavailable.png)
  and [Demo unavailable](./147-second-pass-public-demo-unavailable.png).
- A mobile CSS `zoom=2` probe retained a 390px document width and is linked as
  [proxy evidence](./147-second-pass-guides-mobile-css-zoom-2.png). This is not
  a claim of actual browser zoom support. The installed extension toolbar,
  direct-manipulation matrix, and unclaimed loading/denied/populated states
  remain open or separately limited in the ledger.

## Verification summary

- Final web suite: 95 files, 507 tests passed.
- Exact recursive workspace test run: all active workspace suites passed.
- Final docs suite: 4 files, 13 tests passed.
- Shared UI tests: 4 files, 11 tests passed; focused shared-foundation web
  tests: 45/45.
- Latest ProjectListPage state tests: 17/17; App route tests: 20/20; adjacent
  shared-shell tests: 4/4.
- Latest ProjectWorkspacePage state tests: 9/9; adjacent Project list and
  shared-shell tests: 21/21. Normal-route browser verification is incomplete
  because App maps `/projects/:projectId` to `LegacyProjectRedirect`.
- Post-candidate clean engineering gates pass: web 95 files / 507 tests,
  check-types, lint, production build, CSS-token check 130/123, and diff check.
- Latest Project list + shared-shell focused tests: 20/20 (prior denied-state
  checkpoint).
- Extension suite: 19 files, 140 tests passed; web and extension typechecks,
  lint, builds, and diff checks passed.
- Browser evidence used Chromium, local runner URLs, synthetic fixtures, and
  reduced-motion media at 1440×900 and 390×900.
- Final clean browser pass also covered a 1024×768 authenticated route and
  anonymous valid/embed/unavailable public boundaries; all sampled routes had
  axe 0/0 and no page errors. The CSS zoom probe is supplemental only; actual
  200% browser zoom remains unavailable.
- Repository-wide `pnpm check-types` passed 14/14 packages, `pnpm lint` passed
  13/13 packages with 89 existing server warnings and zero errors, `pnpm build`
  passed 13/13 packages, and `git diff --check` passed.
- Final closeout browser audits for the shared-foundation parent/candidate
  comparison report axe 0 violations / 0 incomplete checks, no page overflow,
  reduced-motion and keyboard paths as recorded in the reviews. Earlier latest
  surfaces retain their own evidence in the ledger.
- `pnpm check-css-tokens` passes with 130 definitions and 123 consumers in the
  current candidate. The four P2-010 aliases passed at 127/122 in `59fd07f`;
  the shared-foundation candidate adds semantic token coverage and now records
  the current 130/123 result.

## Human review decisions still required

- Review the final bundle and visual differences; agent acceptance is not human
  approval.
- Decide dispositions for remaining queued P2 issues and the broader
  shared-shell/200%-zoom follow-up; P2-010 itself is resolved pending human
  review of the candidate.
- Review the shared-foundation parent/candidate comparison, especially the
  command hierarchy, synthetic drawer/access/reader patterns, compact
  extension states, and the five proven dead-CSS removals.
- Review the shared-shell desktop/narrow/320px comparison and the intentional
  narrow navigation reflow; confirm the recorded `/projects` heading and zoom
  limitations are acceptable residuals.
- Review the Projects denied-state before/after pair and confirm the heading and
  sign-in recovery hierarchy without treating the unauthenticated route as
  authenticated fixture evidence.
- Decide the route ownership for `/projects/:projectId` before accepting or
  wiring `ProjectWorkspacePage` transient-state semantics; the final-cycle
  candidate has no truthful runtime browser evidence and is marked
  `needs_human_surface`.
- Decide P2-001’s exact route/state scope: preserve the bounded Publication
  preview, authorize a paired preview/public-reader chrome study, or name a
  different narrow cross-product route pair. Do not accept a broad consistency
  rewrite without that scope decision.
- Rerun the installed extension toolbar/permission path in a capable browser
  environment before changing `extension-capture` from
  `blocked_local_for_run`.
- Review whether any accepted-pending-human candidate needs another bounded
  cycle; do not silently update screenshot baselines.

No customer data, credentials, cookies, private URLs, raw Capture material, or
private screenshots are included in this bundle.
