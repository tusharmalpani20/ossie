# Plan 147 human review bundle

Status: `whole_app_candidate_pending_final_human_review`
Execution worktree: `/home/ubuntu/ossie-plan147`  
Branch: `agent/plan-147-ui-quality`  
Date: 2026-08-07

## Continuation checkpoint — 2026-08-07

The user has authorized an ambitious whole-app UI and interaction-quality pass
before performing one final end-to-end human review. This bundle remains the
durable evidence record, and the companion HTML dashboard is the review
surface for recording the final decisions and notes.

The continuation will apply the user's priorities across all shipped surfaces:
better padding, margins, spacing, button/card composition, typography selection,
loading/empty/error/denied states, Ossie/octopus mascot illustrations, and more
polished public reader screens. The final bundle will be refreshed after the
whole-app pass, and the user will then use the app and review the complete result
in one pass. Two independent agent inputs remain required for each meaningful
bounded candidate; browser and engineering evidence must remain truthful.

## Whole-app candidate checkpoint — 2026-08-07

The current candidate is the broad continuation requested by the user. It
carries the visual pass through the shipped portal, auth/setup, Projects,
Project Version, Capture, artifact, Guide, Interactive Demo, Documentation,
public reader/embed, organization/admin, activity/publishing, extension, and
contributor-doc surfaces. It includes the selected local system-sans stack in
[`147-typography-selection.md`](./147-typography-selection.md), tokenized
spacing/radius usage, improved buttons and cards, responsive composition, and
the shared mascot-led StatusPanel for transient states.

Final recovery additions include explicit retryable states for Documentation
Page, auxiliary editor references, publishing, draft and immutable Revision
previews, and Carry Forward source loading. Publishing refresh failures retain
loaded content while announcing stale data. Review Inbox and embedded Review
Request pagination prevent duplicate loads and announce retryable failures.
Public Guide/Demo password fields have visible labels and
`autocomplete="current-password"`; expired public links share the same
terminal not-found treatment; and Project Version card geometry uses shared
tokens.

The latest independent whole-app audits found no P0 or P1 issue. Reviewer A
recorded five P2 follow-ups and Reviewer B recorded one P2 accessibility
follow-up; the reports and current reconciliation are linked below. The current
web suite passes 95 files / 551 tests, UI is 5 files / 15 tests, repository
typecheck/lint and web build pass, and `git diff --check` passes. Server lint has
89 existing warnings and zero errors. Fresh 390px local unavailable-state
evidence for Guide, Documentation, and Demo reports axe 0 violations / 0
incomplete checks and no overflow. The local API returned HTTP 500 for the
lightweight populated-flow runner, so no authenticated success state is
claimed from that run.

Historical surface rows below retain their original route ownership and
candidate wording. The current whole-app checkpoint supersedes those older
statements: the normal `/projects/:projectId` route now mounts
`ProjectWorkspacePage` while preserving access and Project Version semantics.

This is the final agent candidate for the user's one end-to-end review. Human
review remains deferred until the user uses the whole app and records notes in
the companion HTML dashboard; it is not complete or human-approved yet.

## Exhaustive coverage continuation — 2026-08-08

The user clarified that “whole application” means every individual shipped page,
route variant, nested section, and applicable state, not representative surface
families. The new [exhaustive route and section coverage](./147-exhaustive-route-coverage.md)
document enumerates all 39 web route types plus the separately shipped docs and
extension surfaces. The HTML dashboard now includes a persistent 39-row route
review with per-route verdicts and comments; exports include those values in
the same embedded review JSON.

Two fresh independent audits are recorded in
[`147-exhaustive-route-audit-a.md`](./147-exhaustive-route-audit-a.md) and
[`147-exhaustive-route-audit-b.md`](./147-exhaustive-route-audit-b.md). The
coordinator fixed the Compliance pagination race test-first, added
Documentation password autocomplete/invalid-password retry coverage, and added
a public Guide skip-to-content target. Human review remains deferred until the
route/section evidence gaps are reconciled.

## Executive outcome

The autonomous UI-quality run has produced immutable candidates and review
records for the planned surface families. The approved continuation now mounts
`ProjectWorkspacePage` on the normal `/projects/:projectId` route while
preserving Project Version and access semantics. P2-001 remains held at
`needs_human_surface` because its only scope definition is “cross-product
libraries/readers,” with no exact route/state pair. Plan 147 is not
human-approved and is intentionally not marked complete.

## Start here

- [Interactive whole-app review dashboard](./147-plan-147-review-dashboard.html)
- [Exhaustive route and section coverage](./147-exhaustive-route-coverage.md)
- [Canonical surface, issue, review, and evidence ledger](./147-ossie-ui-quality-program-ledger.md)
- [Plan 147](../plan/147-ossie-ui-quality-program.md)
- [Current truth and accepted visual direction](../../CONTEXT.md)
- [Latest independent whole-app audit A](./147-whole-app-review-a.md)
- [Latest independent whole-app audit B](./147-whole-app-review-b.md)
- [Latest exhaustive route audit A](./147-exhaustive-route-audit-a.md)
- [Latest exhaustive route audit B](./147-exhaustive-route-audit-b.md)
- [Previous human review input](./147-previous-human-review-input.md)

The ledger is the authoritative index for every earlier surface candidate and
its review artifacts. The exhaustive route and section coverage document is
the authoritative check that grouped evidence has not skipped an individual
page, route variant, nested section, or state. The latest closeout bundle is
grouped below for quick review.

## Important scope correction

The earlier surface cards summarize families; they do not by themselves prove
that every individual route, nested section, and state is finished. The route
coverage document now enumerates all 39 `PortalRoute` types and the section
owners inside them. Until that inventory is reconciled with exact browser
evidence, the candidate remains an engineering pass in progress and not a
claim that every screen has already been reviewed or approved.

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

### Legacy Project redirect fallback — `879a1bd` — bounded continuation

- [Review A](./147-project-workspace-legacy-fallback-review-a.md)
- [Review B](./147-project-workspace-legacy-fallback-review-b.md)
- [Desktop evidence](./147-project-workspace-legacy-fallback-after-desktop-1440.png)
- [Narrow evidence](./147-project-workspace-legacy-fallback-after-mobile-390.png)
- [Native 200% evidence](./147-project-workspace-legacy-fallback-after-native-200-525px.png)
- [Canonical ledger evidence](./147-ossie-ui-quality-program-ledger.md#evidence-ledger)

This route-neutral continuation repairs only the fallback presentation that is
actually mounted by the existing `/projects/:projectId` route. TDD added
loading and failed-request assertions; the focused App/workspace run passed
31/31. Anonymous Chromium kept the existing URL and received the expected
Project `401`; the fallback now exposes `Opening Project` plus `role=status`
while waiting, or `Project not found` plus `role=alert` after failure. Desktop,
390px narrow, and native Chrome Page zoom 200% (`dpr=2`, 525px CSS width) had
equal client/scroll widths and axe 0 violations, with no page errors beyond
expected development notices. No redirect target, API, permission, tenant,
Project Version, Publication, public-link, immutable-content, or mutation
behavior changed.

Both bounded continuation reviews accept this presentation correction pending
human review. The `projects-workspace` family and P2-006 remain
`needs_human_surface`: this evidence does not mount or accept
`ProjectWorkspacePage`, and route ownership still requires human direction.

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
checks were recorded in the ledger. The disposable fixture active during that
pass did not provide valid Documentation or Demo publications, so those routes
were not claimed as populated-reader evidence; the later supplemental seeded
pass provides the separate valid-reader evidence below.

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
- Anonymous unavailable boundary: the fixture active during that pass
  truthfully rendered unavailable Documentation and missing Demo states, both
  axe-clean with no page errors. Those screenshots are not populated-reader
  evidence. Evidence:
  [Documentation unavailable](./147-second-pass-public-documentation-unavailable.png)
  and [Demo unavailable](./147-second-pass-public-demo-unavailable.png).
- A mobile CSS `zoom=2` probe retained a 390px document width and is linked as
  [proxy evidence](./147-second-pass-guides-mobile-css-zoom-2.png). This was
  not a native zoom claim for that earlier pass. The later native 200% evidence
  and its remaining scope are recorded below; the installed extension toolbar,
  direct-manipulation matrix, and unclaimed loading/denied/populated states
  remain open or separately limited in the ledger.

## Supplemental public-boundary verification — 2026-08-07

After the prior pass, the guarded disposable fixture seeders were used
separately so valid Documentation and Interactive Demo publications could be
verified without inventing a combined fixture or changing product data.

- Documentation fixture: the valid public reader passed at 1440×900 and
  390×844 with axe 0/0, reduced motion, no overflow, and keyboard focus on
  Skip to content. The public `GET /widgets` operation passed at 390px with
  axe 0/0 and inert request examples. `/install` and `/setup` canonicalized to
  `/install-guide`; `/obsolete` stayed an unavailable state. Evidence:
  [reader desktop](./147-continuation-public-documentation-desktop.png),
  [reader mobile](./147-continuation-public-documentation-mobile-390.png),
  and [operation](./147-continuation-public-documentation-operation-mobile-390.png).
- Interactive Demo fixture: the valid reader and `/embed` passed at 1440px;
  the reader passed at 390px with axe 0/0, no overflow, and keyboard Enter
  advancing from Published start to Published finish. Evidence:
  [reader desktop](./147-continuation-public-demo-desktop.png),
  [embed](./147-continuation-public-demo-embed.png),
  [mobile](./147-continuation-public-demo-mobile-390.png), and
  [finish state](./147-continuation-public-demo-finish.png).
- The Demo password gate and safe invalid-password retry were axe-clean with
  no recorded secret; restricted, expired, and revoked links were also
  rechecked axe-clean with truthful one-main states. Evidence:
  [password](./147-continuation-public-demo-password.png),
  [invalid password](./147-continuation-public-demo-password-invalid.png).
- The final disposable database was reseeded with the Documentation fixture.
  The initial DB run exposed a stale fixture assertion (`operations: 1` versus
  the fixture’s two declared OpenAPI operations). The test-only repair is
  isolated in commit `7982142`; the focused fixture
  test passed 1/1, the rerun server DB suite passed 24/24 files and 88/88 tests,
  and the smoke suite passed 1/1 file and 2/2 tests. No runtime server, API,
  domain, permission, or UI behavior changed.

## Public reader viewport continuation — 2026-08-07

Separate disposable fixture runs added public tablet and 320px evidence without
claiming a combined Documentation/Demo database state. The Documentation
fixture was seeded, exercised anonymously at 1024×768 and 320×844, then the
Interactive Demo fixture was seeded and exercised anonymously at the same
viewports plus its 1024px embed route. All sampled states had axe 0/0, equal
client/scroll/body widths, reduced motion enabled, and no page errors beyond
expected Vite/React development notices. Documentation’s first Tab focused
`Skip to content`; Demo’s narrow first Tab reached the public Version selector.
Public requests returned 200, no mutation or target request was submitted, and
the Documentation fixture was reseeded after the Demo pass. Evidence:
[Documentation tablet](./147-public-documentation-tablet-1024.png),
[Documentation 320px](./147-public-documentation-narrow-320.png),
[Demo tablet](./147-public-demo-tablet-1024.png),
[Demo 320px](./147-public-demo-narrow-320.png), and
[Demo embed tablet](./147-public-demo-embed-tablet-1024.png).

This is evidence-only hardening; it adds no immutable candidate and therefore
does not create a new blind-review cycle. It supplements, but does not close,
the broader 26.6 matrix or the required human review.

## Guide public viewport continuation — 2026-08-07

The separate disposable Guide fixture added a valid anonymous Guide reader at
1024×768 and 320×844, plus its embed at 1024×768. All sampled states retained
one main and the expected `Plan 127 active Guide` heading, stayed within their
client/scroll/body widths,
reported axe 0/0, and had no page errors beyond expected development notices.
The static Guide has no focusable controls, so the first Tab left focus on the
body; this is recorded rather than overstated as an interaction path. No
mutation or target request was submitted, and the Documentation fixture was
reseeded after this pass. Evidence: [Guide tablet](./147-public-guide-tablet-1024.png),
[Guide 320px](./147-public-guide-narrow-320.png), and
[Guide embed tablet](./147-public-guide-embed-tablet-1024.png).

This is evidence-only hardening and does not create a new blind-review cycle or
close the broader 26.6 matrix.

## Supplemental extension verification — 2026-08-07

Chromium was launched with the built unpacked MV3 extension from
`apps/extension/dist`. The real extension details page showed Ossie enabled and
exposed the `Pin to toolbar` control. Evidence: [pinned extension details](./147-continuation-extension-pinned.png).

The direct extension-origin popup then passed the synthetic Connect instance,
sign-in, Project/Project Version selection, Ready to capture, Start capture,
and Finish/open-portal flow. Evidence: [Connect](./147-continuation-extension-connect.png),
[Ready to capture](./147-continuation-extension-ready.png), and the resulting
[portal Capture detail](./147-continuation-extension-capture-portal.png).
The extension and portal states each reported axe 0/0. The final successful
request path returned login 200, Project/Project Version reads 200, Capture
Session create 201, and completion 200. Two earlier safe 401 login probes were
from setup before switching the server to the disposable testing profile; they
were corrected before the evidence path and are not candidate failures.

This is truthful installed-build and direct extension-origin evidence, not a
claim that the browser toolbar icon itself was activated: the CLI can load and
pin the extension but cannot click browser chrome. The surface therefore stays
`blocked_local_for_run` for that remaining toolbar-icon check. Extension
storage was cleared, dedicated services were stopped, and the disposable
database was reseeded with the Documentation fixture.

## Verification summary

- Earlier clean baseline: 95 web files / 507 tests. Current candidate suite:
  95 web files / 511 tests passed.
- Exact recursive workspace test run: all active workspace suites passed.
- Server smoke: 1 file / 2 tests passed. Server DB integration: 24/24 files,
  88/88 tests passed after the isolated fixture-test contract repair in
  `7982142`.
- Final docs suite: 4 files, 13 tests passed.
- Shared UI tests: 4 files, 11 tests passed; focused shared-foundation web
  tests: 45/45.
- Latest ProjectListPage state tests: 17/17; App route tests: 20/20; adjacent
  shared-shell tests: 4/4.
- Latest ProjectWorkspacePage state tests: 9/9; adjacent Project list and
  shared-shell tests: 21/21. Normal-route browser verification is incomplete
  because App maps `/projects/:projectId` to `LegacyProjectRedirect`.
- Post-candidate clean engineering gates pass: web 95 files / 511 tests,
  check-types, lint, production build, CSS-token check 130/123, and diff check.
- Latest Project list + shared-shell focused tests: 20/20 (prior denied-state
  checkpoint).
- Extension suite: 19 files, 140 tests passed; web and extension typechecks,
  lint, builds, and diff checks passed.
- Browser evidence used Chromium, local runner URLs, synthetic fixtures, and
  reduced-motion media at 1440×900 and 390×900.
- Final clean browser pass also covered a 1024×768 authenticated route and
  anonymous valid/embed/unavailable public boundaries; all sampled routes had
  axe 0/0 and no page errors. Its CSS zoom probe was supplemental only; native
  200% evidence is now recorded separately below.
- Supplemental seeded public-boundary verification also covered valid
  Documentation reader/operation and Interactive Demo reader/embed/password/
  access states at desktop and narrow widths; all sampled states were axe 0/0
  with no page errors. Documentation and Demo fixtures were seeded separately
  and are not claimed as one combined database state.
- Supplemental extension verification loaded and enabled the unpacked build,
  exercised direct extension-origin Connect/sign-in/selection/Capture completion,
  and verified the resulting portal Capture detail at axe 0/0. Toolbar-icon
  activation remains explicitly unclaimed because browser chrome is not
  controllable through this CLI.
- Latest repository gates: `pnpm check-types` passed 13/13 tasks, `pnpm lint`
  passed 14/14 tasks with 89 existing server warnings and zero errors, `pnpm
build` passed 13/13 tasks, CSS-token check passed 130/123, and `git diff
--check` passed.
- Final closeout browser audits for the shared-foundation parent/candidate
  comparison report axe 0 violations / 0 incomplete checks, no page overflow,
  reduced-motion and keyboard paths as recorded in the reviews. Earlier latest
  surfaces retain their own evidence in the ledger.
- `pnpm check-css-tokens` passes with 130 definitions and 123 consumers in the
  current candidate. The four P2-010 aliases passed at 127/122 in `59fd07f`;
  the shared-foundation candidate adds semantic token coverage and now records
  the current 130/123 result.

## Fresh broad engineering gate rerun — 2026-08-07

From the clean source worktree at `4edbcba`, the mandatory repository gates were
rerun sequentially with direct commands because `rtk` remains unavailable:

- `pnpm -r --if-present test` passed all active workspace suites, including web
  95 files/509 tests, server 127 files/553 tests, extension 19 files/140 tests,
  and docs 4 files/13 tests.
- `pnpm check-types` passed 13/13 tasks.
- `pnpm lint` passed 14/14 tasks with the existing 89 server warnings and zero
  errors.
- `pnpm build` passed 13/13 tasks; the existing web chunk-size warning remains.
- `pnpm check-css-tokens` passed 130 definitions/123 consumers.
- `git diff --check` passed.

This is verification-only evidence. It introduces no new candidate, screenshot,
product behavior, permission, domain, or mutation claim. The Project workspace
route decision, P2-001 scope decision, installed-toolbar activation block,
broader cross-product matrix, and required human closeout remain open.

## Final broad gate rerun for the bounded fallback — 2026-08-07

After candidate `879a1bd`, the repository gates passed again: recursive tests
passed all active suites (web 95 files/511 tests, server 127 files/553 tests,
extension 19 files/140 tests, docs 4 files/13 tests); `pnpm check-types` passed
13/13 tasks; `pnpm lint` passed 14/14 with the existing 89 server warnings and
zero errors; `pnpm build` passed 13/13 with the existing web chunk-size warning;
`pnpm check-css-tokens` passed 130 definitions/123 consumers; and
`git diff --check` passed. Direct commands were used because `rtk` remains
unavailable. This closes engineering verification for the bounded fallback,
not the broader Plan 147 matrix or human review.

## Native 200% browser-zoom verification — 2026-08-07

Chromium’s actual Page zoom control was set through `chrome://settings/appearance`
to 200% ([settings proof](./147-continuation-native-zoom-settings-200.png)). The
runtime reported `devicePixelRatio=2` and a 525px CSS viewport, which
distinguishes this evidence from the earlier CSS-zoom proxy.

- Documentation reader: `Install` rendered with one main and one h1; document
  client/scroll width was 517px with no visible horizontal overflow; Skip to
  content received focus; axe reported 0 violations and one existing incomplete
  overlapped-background contrast probe. Evidence:
  [reader](./147-continuation-public-documentation-zoom-200.png).
- Documentation operation: `GET /widgets`, Request examples, and Request
  rendered at the same native zoom with client/scroll width 517px; axe reported
  0 violations / 0 incomplete and no final-path request failures. Evidence:
  [operation](./147-continuation-public-documentation-operation-zoom-200.png).
- Interactive Demo reader: the valid synthetic Publication rendered at
  `devicePixelRatio=2` with client/scroll width 517px, axe 0/0, and no visible
  overflow. Tab reached Continue and Enter advanced from Published start to
  Published finish. Evidence: [start](./147-continuation-public-demo-zoom-200-start.png)
  and [finish](./147-continuation-public-demo-zoom-200-finish.png).
- Interactive Demo embed: the immutable playback frame rendered at the same
  native zoom with client/scroll width 517px, axe 0/0, and no final-path
  request failures. Evidence: [embed](./147-continuation-public-demo-embed-zoom-200.png).
- Interactive Demo access boundaries: the password gate and safe invalid retry,
  plus restricted, expired, and revoked links, retained truthful states at
  native 200% with widths no greater than 525px and axe 0/0. No successful
  password submission or mutation was attempted. Evidence:
  [invalid retry](./147-continuation-public-demo-password-zoom-200-invalid.png).
- Authenticated owner boundary: a real same-origin synthetic admin login landed
  on `/projects` and rendered the Project library at `devicePixelRatio=2` with
  client/scroll width 517px and axe 0/0. Evidence:
  [Projects](./147-continuation-auth-projects-zoom-200.png).
- Authenticated Documentation Operations: the owner state rendered usage and
  Owner-only Product limits at the same native zoom with width 517px and no
  overflow. Axe reported 0 violations and the known one incomplete
  metric-number/overlapped-background contrast probe. Evidence:
  [owner](./147-continuation-auth-documentation-operations-zoom-200.png).
- Viewer Documentation Operations: a separate synthetic viewer session rendered
  the read-only usage state at native 200%; the Owner-only Save limits control
  was absent, with the same known axe incomplete metric probe and no overflow.
  Evidence: [viewer](./147-continuation-viewer-documentation-operations-zoom-200.png).
- Anonymous public boundary: a fresh unauthenticated browser context rendered
  the Documentation reader at native 200% with no portal chrome, axe 0/0, no
  overflow, and Tab focus on Skip to content. Evidence:
  [anonymous reader](./147-continuation-anonymous-documentation-zoom-200.png).
- Extension popup: direct extension-origin Connect and authenticated Ready to
  capture states rendered at `devicePixelRatio=2`, client/scroll width 517px,
  axe 0/0, and no overflow. Evidence:
  [Connect](./147-continuation-extension-connect-zoom-200.png) and
  [Ready](./147-continuation-extension-ready-zoom-200.png).
- Guide family: the valid public reader and embed rendered at native 200% with
  `devicePixelRatio=2`, client/scroll width 517px, axe 0/0, and no overflow.
  Restricted, expired, revoked, and password-invalid states remained truthful,
  axe-clean, and within 525px; no successful password submission was attempted.
  Evidence: [reader](./147-continuation-public-guide-zoom-200.png),
  [embed](./147-continuation-public-guide-embed-zoom-200.png), and
  [invalid password](./147-continuation-public-guide-password-invalid-zoom-200.png).
- Guide editor/viewer boundary: the real synthetic editor rendered the active
  Guide at native 200% with width 517px and the known two-textarea incomplete
  contrast probe; the separate viewer rendered `Read only`, width 517px, axe
  0/0, and no Save/Archive/Publish/Delete controls. Evidence:
  [editor](./147-continuation-auth-guide-editor-zoom-200.png) and
  [viewer](./147-continuation-auth-guide-viewer-zoom-200.png).
- Shared foundation gallery: the local synthetic Design System review rendered
  at native 200% with document width 517px and an artifact table whose client
  and scroll widths were both 484px. Keyboard reached Retry and the table
  region; axe reported 0 violations and one known synthetic
  contrast-background incomplete probe. Evidence:
  [gallery](./147-continuation-design-system-zoom-200.png).
- Entry and fallback: `/login` rendered at native 200% with axe 0/0 and the
  keyboard path reached the Email field; `/unknown-plan147` rendered a truthful
  Page not found h1, safe Projects/Sign in recovery links, width 525px, and axe
  0/0. Evidence: [login](./147-continuation-login-zoom-200.png) and
  [fallback](./147-continuation-unknown-fallback-zoom-200.png).
- Interactive Demo internal family: the authenticated editor rendered the
  active workbench at native 200% with 517px document width; keyboard Enter
  changed Scene 1 to Scene 2 without a mutation, while the editor retained the
  known three-textarea incomplete contrast probe. Working Draft preview and
  Revision history were axe 0/0. A separate viewer session had no write
  controls, and empty/archived states remained read-only and axe 0/0. Evidence:
  [editor](./147-continuation-auth-demo-editor-zoom-200.png),
  [preview](./147-continuation-auth-demo-preview-zoom-200.png),
  [Revisions](./147-continuation-auth-demo-revisions-zoom-200.png),
  [viewer](./147-continuation-auth-demo-viewer-zoom-200.png), and
  [archived](./147-continuation-auth-demo-archived-zoom-200.png).
  A supplemental native-200% direct-manipulation pass used the real Hotspot 1
  resize handle and pointer drag, changing only local geometry; reload restored
  the persisted `100%` geometry because no Save action was used. The sample
  remained within 525px with axe 0 violations plus the known three-textarea
  incomplete probe, and final paths were GET-only. Evidence: [resize](./147-continuation-auth-demo-direct-manip-zoom-200-resize.png)
  and [move](./147-continuation-auth-demo-direct-manip-zoom-200-move.png).
- Documentation authoring/review continuation: separate synthetic owner and
  viewer sessions covered the Site workbench task states, Install Page editor,
  saved-draft preview, and Review Inbox at native 200% (`dpr=2`, 525px CSS
  viewport, no horizontal overflow). Author/Review, preview, viewer states,
  and the repaired Review Inbox were axe 0/0; Content and Page editor retain
  known overlapped-background textarea probes. The initial Review Inbox
  nested-main finding was fixed test-first in `ab10940` and rechecked in both
  roles. No mutation was submitted. Evidence: [author](./147-continuation-auth-documentation-author-zoom-200.png),
  [Page editor](./147-continuation-auth-documentation-page-editor-zoom-200.png),
  [preview](./147-continuation-auth-documentation-preview-zoom-200.png), and
  [viewer Review Inbox](./147-continuation-viewer-documentation-review-inbox-zoom-200.png).
- Capture portal continuation: separate synthetic owner and viewer sessions
  covered active/named/archived Capture lists, completed/empty/capturing/
  canceled/archived details, owner controls, viewer read-only boundaries, and
  an aborted list request with truthful error/Retry recovery at native 200%
  (`dpr=2`, 525px CSS viewport). Sampled states were axe 0/0 with no document
  overflow; the owner keyboard path reached the first Capture link after New
  Capture Session, completed-detail final-path requests returned 200, and no
  mutation was submitted. Evidence: [owner list](./147-continuation-auth-capture-list-zoom-200.png),
  [completed detail](./147-continuation-auth-capture-completed-detail-zoom-200.png),
  [empty detail](./147-continuation-auth-capture-empty-detail-zoom-200.png),
  [viewer detail](./147-continuation-viewer-capture-detail-zoom-200.png), and
  [error/retry](./147-continuation-auth-capture-error-zoom-200.png). The shared
  Project Version context header visibly splits its label at this zoom despite
  no document overflow in this earlier capture pass; the bounded follow-up
  `2eb2ce8` resolves that split and is recorded in the Project Version evidence
  immediately below.
- Project Version continuation: separate synthetic owner and viewer sessions
  covered Main/Summer release/Archived release workspaces, owner settings and
  Project Version management, empty Carry Forward, controlled versions-load
  error/Retry recovery, viewer read-only workspace, and denied settings at
  native 200% (`dpr=2`, 525px CSS viewport). Sampled documents had no
  horizontal overflow; workspace, Carry Forward, and denied settings were axe
  0/0, while settings retained only the known overlapped-background textarea
  probe. The final read paths returned 200, no mutation was submitted, and the
  screenshots were visually inspected. Evidence: [context](./147-continuation-auth-project-version-context-zoom-200.png),
  [settings](./147-continuation-auth-project-version-settings-zoom-200.png),
  [Carry Forward](./147-continuation-auth-project-version-carry-forward-zoom-200.png),
  [settings error](./147-continuation-auth-project-version-settings-error-zoom-200.png),
  [viewer workspace](./147-continuation-viewer-project-version-workspace-zoom-200.png),
  and [viewer settings denied](./147-continuation-viewer-project-settings-denied-zoom-200.png).
  The follow-up `2eb2ce8` then moved the narrow identity into a stacked layout:
  owner Main and Summer release, separate viewer Main, and owner 390px reflow
  all kept the project name, selected Project Version, and status badge readable
  beside Manage Versions with axe 0/0 and no overflow. Evidence:
  [fixed Main](./147-continuation-project-version-context-fixed-main-zoom-200.png),
  [fixed Summer release](./147-continuation-project-version-context-fixed-summer-zoom-200.png),
  [fixed viewer](./147-continuation-project-version-context-fixed-viewer-zoom-200.png),
  and [fixed narrow](./147-continuation-project-version-context-fixed-owner-narrow.png).
  This is a bounded CSS follow-up with no new blind-review cycle; human review
  still covers the broader shell and Plan 147 bundle.

- Organization administration continuation: separate synthetic owner and
  viewer sessions covered members/invites, compliance timeline, Documentation
  Operations usage/limits, owner members error/Retry recovery, and viewer
  denied/read-only states at native 200% (`dpr=2`, 525px CSS viewport). Samples
  stayed within 525px with no page errors; members and denied states were axe
  0/0, while compliance and Documentation Operations retained the known metric
  contrast/background or short-text incomplete probes. No mutation was
  submitted. Evidence: [owner members](./147-continuation-auth-organization-members-zoom-200.png),
  [members error](./147-continuation-auth-organization-members-error-zoom-200.png),
  [owner compliance](./147-continuation-auth-organization-compliance-zoom-200.png),
  [owner Documentation Operations](./147-continuation-auth-organization-documentation-operations-zoom-200.png),
  [viewer members denied](./147-continuation-viewer-organization-members-denied-zoom-200.png),
  [viewer compliance denied](./147-continuation-viewer-organization-compliance-denied-zoom-200.png),
  and [viewer Documentation Operations](./147-continuation-viewer-organization-documentation-operations-zoom-200.png).
- Projects library continuation: separate synthetic owner and viewer sessions
  covered active Projects, the empty archived filter, owner create-form
  visibility, controlled Project-list error/Retry recovery, viewer active/
  archived states, and a valid seeded `/projects/:projectId` entry at native
  200% (`dpr=2`, 525px CSS viewport). The valid entry followed the existing
  `LegacyProjectRedirect` into the Project Version workspace and was axe 0/0;
  this is current-route evidence, not acceptance or mounting of the separate
  `ProjectWorkspacePage` candidate. No mutation was submitted. Evidence:
  [owner active](./147-continuation-auth-projects-active-zoom-200.png),
  [owner archived](./147-continuation-auth-projects-archived-zoom-200.png),
  [owner error](./147-continuation-auth-projects-error-zoom-200.png), and
  [viewer workspace redirect](./147-continuation-viewer-project-workspace-redirect-zoom-200.png).
- Extension-installation continuation: the authenticated synthetic owner
  rendered `/extension` ready and download-error states at native 200%
  (`dpr=2`, 525px CSS viewport), downloaded the ZIP with a 200 response, and
  rechecked a forced auth-check failure. That failure initially exposed a
  missing level-one heading; bounded TDD follow-up `fc8071c` added the visible
  `Browser extension` heading, and the recheck reported axe 0/0, no overflow,
  reduced motion, and a Skip-link keyboard path. This does not claim toolbar
  icon activation or change `extension-capture` from `blocked_local_for_run`.
  Evidence: [ready](./147-continuation-extension-installation-ready-zoom-200.png),
  [content](./147-continuation-extension-installation-content-zoom-200.png),
  and [auth-check error](./147-continuation-extension-installation-error-zoom-200.png).
- Contributor/operator docs continuation: public `apps/docs` rendered at
  native 200% (`dpr=2`, 525px CSS viewport, 4,798px document height) with axe
  0/0, four loaded image elements, no horizontal overflow, reduced motion, and
  a keyboard path through README and self-hosting links. External source links
  were not followed, and this remains separate from customer-authored Product
  Documentation. Evidence: [top](./147-continuation-contributor-docs-top-zoom-200.png),
  [alpha](./147-continuation-contributor-docs-alpha-zoom-200.png),
  [source docs](./147-continuation-contributor-docs-source-zoom-200.png), and
  [limitations](./147-continuation-contributor-docs-limitations-zoom-200.png).

The browser zoom was restored to 100%, extension storage was cleared, the
dedicated services were stopped, and the disposable database was reseeded with
the Documentation fixture. These are bounded samples; they do not close the
complete 26.6 responsive/state/direct-manipulation matrix.

## Objective coverage audit — 2026-08-07

This table maps the explicit execution objective to the current authoritative
evidence. `Complete` means the requirement is proven for the scope named;
`limited` means the bounded evidence and limitation are recorded; `pending`
means human direction or review is still required.

| Objective requirement                                                                        | Current evidence                                                                                                                                                                                            | Status                                                                                                                      |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Use approved baseline and a dedicated implementation worktree                                | Starting commit `d638112` and branch/worktree `/home/ubuntu/ossie-plan147` are recorded in the ledger; original `/home/ubuntu/ossie` remains clean                                                          | complete                                                                                                                    |
| Reconcile product truth, ADRs, design direction, and domain invariants                       | `CONTEXT.md`, accepted ADRs, Plan 147 preflight, and surface preflights are recorded; no candidate changed Project, Project Version, Membership, Capture, Revision, Publication, or public-link semantics   | complete for executed candidates                                                                                            |
| Use a disposable local database and deterministic synthetic fixture graph                    | Guarded local `ossie_test`; Documentation, Guide, Interactive Demo, Capture, and role-specific fixture runs are recorded; final state was reseeded with Documentation fixture                               | complete for executed browser runs                                                                                          |
| Start and health-check local services                                                        | API `/healthz`/`/readyz`, Vite root, isolated ports, cleanup, and base-service preservation are recorded in the ledger                                                                                      | complete for executed runs                                                                                                  |
| Verify real setup, login, authenticated, public, password, embed, and extension entry points | Authenticated synthetic sessions, public/password/embed routes, direct unpacked extension-origin flow, and installation portal are evidenced                                                                | limited: browser-toolbar icon activation remains `blocked_local_for_run`                                                    |
| Work through shipped surfaces with bounded candidates and truthful status                    | Surface ledger, issue ledger, rollback boundaries, immutable candidates, evidence-only continuations, and `agent_accepted_pending_human`/`needs_human_surface`/`blocked_local_for_run` statuses are current | complete for autonomous scope; broader matrix remains open                                                                  |
| Send immutable candidates to two blind read-only reviewers and cap cycles at three           | Review ledger contains A/B reports for each immutable candidate; `projects-workspace` stopped at final cycle 3 and remains human-directed                                                                   | complete for executed candidates                                                                                            |
| Maintain screenshots, findings, verification, commits, checkpoints, and rollback information | Canonical ledger, implementation log, evidence rows, linked screenshots, review artifacts, exact commits, and rollback notes are assembled here and in the Plan                                             | complete for recorded scope                                                                                                 |
| Run focused and broad engineering verification                                               | Current candidate rerun: recursive tests web 95/511, server 127/553, extension 19/140, docs 4/13; typecheck 13/13; lint 14/14; build 13/13; CSS tokens 130/123; diff check passed                           | complete                                                                                                                    |
| Complete the full 26.6 desktop/tablet/mobile/200%/extension and state matrix                 | Bounded desktop, tablet, mobile, native-200%, keyboard, reduced-motion, public/auth/embed, and direct-manipulation samples are recorded                                                                     | limited: complete matrix, loading/denied/populated breadth, toolbar icon, and some known axe probes remain open             |
| Complete human feedback and final closeout                                                   | Bundle is assembled and statuses are truthful                                                                                                                                                               | pending: human findings, P2/P3 dispositions, accepted-baseline decisions, broader matrix limitations, and Plan 147 closeout |

## Human review decisions still required

- Review the final bundle and visual differences; agent acceptance is not human
  approval.
- Decide dispositions for remaining P2 issues and residual risks, and review the native
  200% samples plus broader zoom coverage; P2-010 itself is resolved pending
  human review of the candidate.
- Review the shared-foundation parent/candidate comparison, especially the
  command hierarchy, synthetic drawer/access/reader patterns, compact
  extension states, and the five proven dead-CSS removals.
- Review the shared-shell desktop/narrow/320px comparison and the intentional
  narrow navigation reflow; confirm the recorded `/projects` heading and zoom
  limitations are acceptable residuals.
- Review the Projects denied-state before/after pair and confirm the heading and
  sign-in recovery hierarchy without treating the unauthenticated route as
  authenticated fixture evidence.
- Review the now-mounted `/projects/:projectId` Project Workspace as part of the
  whole-app experience. Historical route-ownership rows describe the earlier
  pre-continuation candidate and are not current route truth.
- Decide P2-001’s exact route/state scope: preserve the bounded Publication
  preview, authorize a paired preview/public-reader chrome study, or name a
  different narrow cross-product route pair. Do not accept a broad consistency
  rewrite without that scope decision.
- Rerun the browser toolbar-icon popup path in a capable browser environment
  before changing `extension-capture` from `blocked_local_for_run`; the
  unpacked load, enabled state, pin configuration, and direct extension-origin
  lifecycle are now separately evidenced.
- Review whether any accepted-pending-human candidate needs another bounded
  cycle; do not silently update screenshot baselines.

No customer data, credentials, cookies, private URLs, raw Capture material, or
private screenshots are included in this bundle.
