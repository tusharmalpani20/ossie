# Child Plan 145: Documentation Experience Accessibility, Browser, And Performance Hardening

Date reserved: 2026-07-31

Last implementation-readiness audit: 2026-08-05

Status: Complete — integrated hardening reverified on 2026-08-06 after the
scoped repairs in `4536268`, `e13d7ca`, `599e031`, `bf84791`, and `1e3bc40`.

Reopen finding: prior evidence remains historical and is not being treated as
proof of the repaired paths. This child owns the rerun of Chromium, a11y,
security/privacy, performance, dependency, and broad regression checks.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/144-documentation-generated-api-request-examples.md`

Evidence baseline:

- final adoption scorecard from Child `141`;
- authoring evidence from Child `142`;
- reader evidence from Child `143`;
- request-example evidence from Child `144`;
- shipped V1 baseline and browser fixture from children `138`–`139`.

## 1. Objective

Audit, dogfood, and harden the integrated post-V1 Documentation authoring,
reader, and request-example experience. Establish reproducible failures first,
fix only defects inside Master `007`, and close with truthful accessibility,
browser, motion, security, dependency, performance, bundle, and compatibility
evidence.

This child adds no product feature and does not reopen adapter decisions.

## 2. Entry Gate And Leftover Intake

Before changing code:

1. confirm children `141`–`144` are complete and independently
   close-rechecked;
2. read every final status, checklist, implementation log, verification,
   limitation, leftover, handoff, and recorded commit;
3. create an intake table in this plan with columns:
   `source child | item | severity | current owner | verification route |
disposition`;
4. inspect the actual selected adapters, retained exact dependencies, fallback,
   route chunks, public/server behavior, generator contract, tests, and worktree;
5. reproduce the current synthetic fixture and baseline build;
6. update the matrix for code drift and independently recheck the plan.

Do not absorb unrelated defects. Route them to maintenance/operations with
evidence. An issue caused by Master `007` is in scope even if discovered on an
existing shared component.

### 2.1 Predecessor intake

| source child | item                                                                                                                                                | severity                              | current owner                                                                         | verification route                                                                                           | disposition                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 141          | Tiptap/Fumadocs are partial-adopt branches with native fallbacks; optional Firefox/WebKit and installed screen-reader coverage were unavailable.    | S3 capability limit                   | Child 145 for integrated accounting; maintenance/QA for future engine and AT coverage | Child 141 evidence, current dependency/build scan, required Chromium matrix                                  | Retain the accepted partial branches and verify that proof-only seams remain absent; record unavailable capabilities without claiming passes.                    |
| 142          | Tiptap remains prose-field-only; existing axe contrast checks were incomplete in the local draft/editor evidence.                                   | S3 evidence limitation                | Child 145                                                                             | authoring route, axe/manual contrast review, native fallback/recovery                                        | Recheck the representative state. Keep the native field and server policy authoritative; route any confirmed shared WCAG failure as an in-scope fix.             |
| 143          | Fumadocs remains public Publication chrome only; optional engines/AT unavailable and the known workspace audit findings remain.                     | S3 capability/supply-chain limitation | Child 145 for route isolation; maintenance/operations for existing advisories         | public reader route, manifest/chunk scan, frozen install/license/audit                                       | Reconfirm lazy route isolation and exact package/license facts. Do not upgrade unrelated dependencies or claim a clean audit.                                    |
| 144          | Generated examples are bounded, inert, five-language V1 output; Go/gofmt was unavailable, and draft axe had one incomplete existing contrast check. | S3 tooling/evidence limitation        | Child 145                                                                             | domain policy tests, generated-snippet syntax checks where tools exist, supported/unsupported browser routes | Recheck determinism, sensitive-value redaction, no-target-network behavior, keyboard/copy/download, and unsupported states. Record Go and axe limits truthfully. |

### 2.2 Entry recheck

Children `141`–`144` status, checklists, implementation logs, verification
records, limitations, leftovers, handoffs, and recorded commits were read on
2026-08-05. The selected runtime is Tiptap `3.29.2` for bounded prose fields,
Fumadocs Core `16.14.0` for public Publication chrome, and the inert
`documentation-request-example-v1` registry for five request-example
languages. Native authoring/reader fallbacks remain available. The worktree
was clean before this plan update; no migration, schema, route, API, or
persistence change is expected for this child.

The baseline fixture is the synthetic Documentation browser fixture used by
the predecessor children. A production build and the required Chromium
matrix remain the next execution records; their exact fixture identity,
manifest measurements, and browser evidence will be appended below after the
baseline run.

## 3. Severity And Closure Policy

- **S1:** tenant/access bypass, secret/private-content leak, executable content,
  data loss/corruption, published immutability break, target request without
  explicit Try-It authority, or unusable core workflow for all users.
- **S2:** common core workflow blocked for a role/browser/input method, serious
  WCAG failure, broken public URL/SEO/cache/redirect, repeatable conflict/local
  recovery loss, major bundle/performance regression, or dependency
  high/critical risk in shipped reachable code.
- **S3:** non-blocking polish, minor announcement/copy issue, optional-engine
  inconsistency with workaround, or local lab optimization opportunity.

No unresolved in-scope S1/S2 may remain. S3 may remain only with evidence,
owner, trigger, and user impact. Missing required Chromium evidence is not an
S3; it prevents closure.

## 4. Integrated Workflow Matrix

### 4.1 Authoring

- Project Editor Page load/edit/insert/reorder/delete/save/autosave;
- snippet list/create/edit/save/archive;
- comments and stable block anchors;
- metadata, assets, Page/snippet/Guide/Demo/API references;
- read-only Viewer;
- loading, empty, validation, unsupported paste/drop, adapter failure, server
  failure, offline/network failure, Row-Version conflict, local recovery,
  unsaved navigation;
- checkpoint/review/publication compatibility.

### 4.2 Reader

- public default/explicit Project Version;
- public/password/internal/revoked/expired/unavailable/unknown;
- home/nested Page, canonical redirect, gone, search/result/no result;
- exact Revision preview and saved draft preview;
- navigation/breadcrumb/TOC/anchors;
- assets/snippets/Guide/Demo references;
- API operation and Try-It disabled/enabled without sending real credentials;
- initial crawler HTML, canonical/meta, sitemap/robots, CSP, ETag/304.

### 4.3 Generated examples

- supported and unsupported descriptor;
- curl/browser Fetch/Node/Python/Go;
- keyboard selection, copy success/failure, one-file download;
- Try-It mutable-state isolation;
- V1 historical reproduction;
- lazy failure and native/reader fallback;
- no target network request.

### 4.4 Existing-product regression

At minimum smoke:

- login/setup and portal navigation;
- Project/Project Version shell;
- Capture portal/session;
- Guide authoring/public/embed;
- Interactive Demo authoring/public/embed;
- extension portal/bundle route;
- Organization membership/permissions;
- public routes not loading Documentation adapter/editor chunks.

This is regression evidence, not permission to redesign those products.

## 5. Accessibility Standard

Target WCAG 2.2 AA. Verify:

- keyboard access and logical focus order;
- no keyboard trap; Escape/close semantics;
- visible focus with sufficient contrast;
- focus moves/restores after dialogs, mobile navigation, deletion, fallback,
  conflict recovery, and route changes;
- semantic buttons/links/forms, labels, descriptions, errors;
- one clear `h1`, logical headings, landmarks, skip link;
- live regions are polite and do not announce every keystroke;
- selected/current/expanded/disabled/error states are programmatic;
- 24 by 24 CSS-pixel minimum pointer target or accepted spacing exception;
- 320 CSS-pixel reflow and 200% zoom without page-level two-dimensional scroll;
- local labeled overflow for code/tables only;
- text/interactive/non-text contrast;
- no color-only meaning;
- reduced-motion removal of nonessential animation;
- accessible names for block moves, language tabs, copy/download, search,
  navigation, and Try-It controls;
- password/validation/conflict/unsupported errors associated to fields/summary;
- screen-reader reading order does not duplicate editor and preview content
  ambiguously.

Run axe A/AA on representative states and inspect incomplete contrast/manual
checks. Automated zero violations is necessary but not sufficient. Record real
assistive-technology coverage only if genuinely available.

## 6. Browser Matrix

### Required Chromium

Use agent-browser with the installed headless Chromium and existing seeded
fixture. Record:

- tool/browser versions;
- route and synthetic fixture identity;
- desktop viewport;
- 320px viewport;
- 200% zoom method;
- reduced-motion setting;
- keyboard steps;
- screenshots;
- accessibility tree/axe results;
- console exceptions/warnings;
- failed/unexpected requests;
- local measurements.

### Firefox and WebKit

Use existing supported tooling and install compatible headless engines when
feasible. Do not build a new product harness. If an engine cannot run after
documented bounded attempts, record:

- exact command/tool/version;
- installation/runtime error;
- coverage not obtained;
- separate QA owner/reopen trigger.

Per the accepted Plan `140` matrix, optional Firefox/WebKit/real-AT coverage is
separately owned and does not become a false failure or false pass. Chromium
remains the required local browser proof.

## 7. Motion And Interaction

Audit all motion introduced/retained by children `142`–`144`:

- use motion only for spatial continuity/status;
- no decorative perpetual animation;
- transform/opacity preferred over layout animation;
- interruptible open/close transitions;
- no delayed focus or interaction behind animation;
- reduced motion produces immediate or minimal state changes;
- loading indicators preserve layout and accessible status;
- scroll-to-heading respects user action and reduced motion;
- adapter/native fallback does not flash or shift content excessively.

Fix confirmed issues; do not add animation to make the UI appear modern.

## 8. Performance And Bundle Contract

Build production output with manifest and compare against recorded pre-Master
and per-child baselines.

Measure/report:

- initial app raw/gzip;
- unrelated portal route chunks;
- Documentation Page editor and snippet chunks;
- public reader, draft preview, Revision preview chunks;
- Tiptap and Fumadocs retained modules;
- request-example component/domain code;
- Try-It lazy chunk;
- route load and 20 representative interactions;
- DOM size on large in-policy Page/navigation;
- repeated mount/unmount listener/memory symptoms;
- initial public HTML size and duplicate bootstrap/fetch behavior.

Gates:

- no editor/Tiptap bytes in public reader or unrelated initial routes;
- no Fumadocs/reader bytes in authoring or unrelated routes unless a measured
  shared primitive justifies it;
- request-example UI stays lazy with API operation surfaces;
- no candidate dependency from a rejected Child `141` disposition remains;
- no new representative >100 ms task without fix/explanation;
- median interactions no more than 20% slower than Child `141` native baseline;
- selected package chunk guardrails from Child `141` remain satisfied;
- no duplicate initial public fetch after valid bootstrap;
- no production p75 claim from local data.

If a retained adapter violates a mandatory gate, optimize/tree-shake first. If
still failing, use the already authorized native fallback and remove the
package; do not request permission to keep a worse implementation.

## 9. Security And Privacy Matrix

Verify:

- Organization/Project membership and role negative tests;
- public/password/internal/revoked/expired boundaries;
- no draft/Revision/comments/reviewer/private navigation in public bootstrap,
  Fumadocs page tree, logs, screenshots, or errors;
- CSP/XSS/injection for constrained content and adapter output;
- no unsafe eval/HTML/MDX/custom nodes;
- no editor/Fumadocs hosted calls;
- no credentials/private origins/policies in generated examples;
- Try-It remains browser-direct and explicit;
- generated examples trigger no target network;
- Clipboard/download filenames/content are bounded and safe;
- adapter/proof query selectors absent from production;
- no debug logging of content/tokens;
- Audit/Access Evidence remains existing and no new ungoverned sensitive event
  is introduced.

Use synthetic sentinel secrets in tests and assert they are absent from DOM,
logs, generated code, screenshots, and unintended requests.

## 10. Dependency And Supply-Chain Gate

For every retained new direct/transitive package:

- exact version and purpose;
- license;
- official source/release;
- peer/engine compatibility;
- production reachability;
- frozen install;
- high/critical audit triage;
- bundle inclusion;
- rollback/removal path.

Scan manifest/lockfile/build for rejected packages. Do not upgrade unrelated
dependencies in this child. A reachable unresolved high/critical advisory,
license incompatibility, or required hosted service is S2/S1 and triggers the
native fallback or Master stop policy.

## 11. Compatibility Matrix

Re-run relevant compatibility proof for:

- stored V1 blocks/snippets/assets;
- imports/exports/packages and Carry-Forward;
- Revisions/Publications/rollback;
- review/approval/comments;
- public URLs/redirects/gone/search/SEO;
- Try-It policy/configuration/attempt evidence;
- descriptor V0 unsupported and descriptor V1 exact examples;
- native adapter fallback;
- migration head remains `031` unless an explicitly authorized repair says
  otherwise;
- public/app clients see no contract drift.

## 12. Exact File Ownership

Primary writes are defects discovered in:

- Documentation web components/styles/adapters from children `141`–`144`;
- their focused tests;
- request-example domain policy/tests;
- route/lazy-loading/App files touched by those children;
- Documentation fixture/tests;
- `docs/ui/<execution-date>-documentation-post-v1-hardening.md`;
- this plan and Master `007`.

Conditional writes:

- shared UI components only for a confirmed shared regression, with all callers
  tested;
- server public routes/config only for a confirmed Master `007` regression;
- package manifest/lockfile only to remove/adjust selected adapter dependencies;
- current-truth docs only for actual shipped results.

No expected migration/schema/repository/service change. No accepted-later,
operations infrastructure, unrelated lint/PostgreSQL maintenance, or product
redesign.

## 13. Test-First Fix Protocol

For each defect:

1. record route/role/state/severity and reproduce;
2. add focused failing unit/integration/browser evidence;
3. identify owning child/contract;
4. make the smallest in-scope repair;
5. rerun focused checks;
6. rerun affected browser matrix cell;
7. update evidence/leftover table;
8. close only when the regression test remains.

Do not combine unrelated fixes into one commit.

## 14. Verification Order

1. focused tests while fixing;
2. Documentation domain/types/web/server suites;
3. affected DB integration only if server/shared data code changed;
4. web/server/package type-check and lint;
5. production build/manifest and frozen install/audit;
6. agent-browser required matrix;
7. optional engine attempts;
8. existing-product smoke;
9. workspace proportional checks;
10. diff/path/secret/evidence scans;
11. independent close-recheck.

The executing child records exact commands/counts and reruns impacted checks
after every late fix.

## 15. Evidence Handling

Use only synthetic fixtures and local safe URLs. Store sanitized textual
evidence and approved screenshots under `docs/ui/`. Do not commit:

- cookies/session headers;
- passwords/tokens/credentials;
- private URL origins;
- customer/raw OpenAPI content;
- unsanitized network dumps;
- home-directory paths that expose secrets;
- screenshots containing private data.

Label local lab measurements and browser capability limits accurately.

## 16. Acceptance Criteria

- every matrix cell applicable to selected branches has evidence;
- no unresolved in-scope S1/S2;
- WCAG 2.2 AA required checks pass or an item preventing closure is fixed;
- Chromium real-route proof passes;
- optional-engine/AT limits are truthful and owned;
- bundle/performance gates pass or native fallback is selected;
- no rejected/proof package/UI remains;
- no secret/private/authority regression;
- existing-product smoke passes;
- dependency/license/audit/frozen install pass;
- migration/API/schema compatibility holds;
- close-recheck is clean.

## 17. Explicit Non-Scope

- new product features;
- redesign unrelated to a proven defect;
- accepted-later candidates;
- production telemetry/p75;
- durable jobs/distributed rate limit/non-local storage;
- PostgreSQL warning or broad lint debt;
- new browser/product harness;
- false Firefox/WebKit/AT completion claims.

## 18. Commit Strategy

Suggested commits by defect class:

- `fix(documentation): harden post-v1 accessibility`
- `fix(documentation): preserve reader and authoring browser behavior`
- `perf(documentation): contain adapter and example bundles`
- `test(documentation): record integrated compatibility proof`
- `docs(documentation): close post-v1 hardening`

Each defect class may require multiple commits. Commit the smallest
single-purpose, independently reviewable, focused-test-green repair as soon as
it is coherent. Keep unrelated accessibility, browser, security, compatibility,
and performance defects in separate commits, and split broad fixes by surface or
root cause. Never accumulate the whole child into one end-of-child commit. Stage
exact paths and preserve unrelated work.

## 19. Checklist

### Intake

- [x] Children `141`–`144` complete/close-rechecked.
- [x] Leftover intake table completed.
- [x] Selected dependencies/adapters/fallback confirmed.
- [x] Baseline fixture/build reproduced.
- [x] Plan refreshed and independently rechecked.

### Accessibility/browser/motion

- [x] Full applicable workflow accessibility matrix run.
- [x] Keyboard/focus/zoom/320px/targets/reduced motion verified.
- [x] Axe/tree/manual checks recorded.
- [x] Required Chromium matrix passes for in-scope Documentation surfaces.
- [x] Firefox/WebKit/AT attempts and limits recorded.
- [x] Loading/error/denied/conflict/recovery states pass or retain the existing native fallback.

### Performance/security/compatibility

- [x] Build/chunk/interactions/DOM/bootstrap measured.
- [x] Package guardrails and route isolation pass.
- [x] Security/privacy/tenant/credential checks pass.
- [x] Dependency/license/frozen install passed; known audit findings are triaged and unchanged.
- [x] Historical examples and native fallback pass.
- [x] Existing-product regression smoke passes, with the unrelated Extension contrast finding routed to maintenance/QA.
- [x] Migration/API/schema compatibility passes.

### Closure

- [x] Every in-scope fix has failing-then-passing evidence.
- [x] No unresolved in-scope S1/S2.
- [x] Sanitized evidence committed.
- [x] Independent close-recheck clean.
- [x] Status/log/verification/limitations/leftovers/handoff/commits updated.
- [x] Commits are small, single-purpose, focused-test green, and independently
      reviewable; no large end-of-child commit was used.
- [x] Master Child `145` lifecycle updated.

## 20. Implementation Log

### 2026-08-05 — intake and baseline

- Read and close-rechecked Children `141`–`144`, including every final status,
  checklist, log, verification record, limitation, leftover, handoff, and
  recorded commit. Recorded the four-row intake table above.
- Reproduced the synthetic Documentation fixture and the current production
  build. Confirmed Tiptap `3.29.2`, Fumadocs Core `16.14.0`, native fallbacks,
  the five-language inert example contract, migration head `031`, and a clean
  starting worktree.

### 2026-08-05 — S2 console regression, fixed

- Reproduced the public operation route’s caught React error when the exact
  operation snapshot was not present in authorized Page navigation.
- Added the failing Public reader test, implemented pre-mount selection of the
  existing native fallback, reran the focused suite (4/4), and verified the
  real route had no page errors. Commit: `37e4bc8`.

### 2026-08-05 — S2 narrow overflow accessibility regression, fixed

- Reproduced axe `scrollable-region-focusable` at the required 320px viewport
  on generated request-example code. The page itself remained width-bounded,
  but the local overflow region was not keyboard-focusable.
- Added the failing component assertion, made the `<pre>` focusable, added an
  explicit code surface for deterministic contrast inspection, reran the
  focused suite (4/4), and reran 320px/200% axe and keyboard checks. Commit:
  `72b8943`.

### 2026-08-05 — integrated verification and handoff

- Ran the Documentation browser matrix, existing-product smoke, performance
  measurements, dependency/prohibited-package scans, and optional-engine/AT
  capability attempts. Recorded sanitized results in
  `docs/ui/2026-08-05-documentation-post-v1-hardening.md` and committed the
  two sanitized screenshots listed there.
- Preserved the unrelated Extension contrast finding and known dependency
  advisories as explicitly owned maintenance/QA limitations; no unrelated fix
  or dependency upgrade was folded into Child `145`.

### 2026-08-06 — reopened integrated verification

- Re-ran the repaired reader/editor/example paths against the disposable
  fixture. Chromium recorded grouped navigation, adjacent links, keyboard
  search, failure/retry, reduced motion, 320px/160px reflow, and zero axe
  violations/incompletes after the public search input contrast fix.
- Full web verification passed 92 files/479 tests; focused server parser and
  Documentation integration tests passed; root type-check, lint, build, frozen
  install, and license checks passed. `pnpm audit --prod` still reports the
  existing fast-uri high, PostCSS moderate, and Babel low findings; no new
  direct dependency was added.
- The authenticated editor route still has the previously known draft input
  contrast manual-review incompletes. Firefox/WebKit, screen reader, and
  Go/gofmt remain truthful capability limits.

## 21. Verification Record

### Automated

- `pnpm --filter @repo/documentation-domain test`: 20 files / 55 tests passed.
- Documentation server focused tests: 5 files / 39 tests passed.
- `pnpm --filter web test -- --reporter=verbose`: 91 files / 469 tests passed.
- Web and Documentation-domain check-types/lint passed; Documentation-domain
  build passed.
- `pnpm --filter web build` passed. Final route/chunk measurements are in the
  evidence file; the public reader was 6.88 kB raw / 2.69 kB gzip, the
  selected Fumadocs chrome 10.02 kB / 4.17 kB, the Tiptap field 5.64 kB /
  2.20 kB, and the examples UI 10.16 kB / 4.13 kB.
- Root `pnpm check-types`: 13 successful tasks. Root `pnpm lint`: 14
  successful tasks, 0 errors, and 89 pre-existing server warnings.
- `pnpm install --frozen-lockfile --ignore-scripts`: passed.
- `pnpm licenses list --filter web`: passed. `pnpm audit --prod` remains
  non-zero for the known `fast-uri` high, PostCSS moderate, and Babel low
  workspace paths; no new package or advisory was introduced.
- `git diff --check`: passed.

### Browser and capability

- agent-browser `0.33.1`, Chrome for Testing `151.0.7922.47`, synthetic
  Organization `01K12500000000000000000001`, Project
  `01K12500000000000000000002`, Site `01KZ9WFP8TDXBHNEJ9A93ZGGKC`.
- Required Chromium routes and measurements, including desktop, 320px, 200%,
  reduced motion, keyboard tabs, focusable code overflow, copy/download,
  unsupported output, native operation fallback, draft, Revision, and Page
  reader states, are recorded in the evidence file.
- Existing-product smoke covered Capture Sessions, Organization Members,
  Extension, empty Guide/Demo lists, and missing public/embed Guide/Demo
  states. The Extension axe contrast violation is explicitly not claimed as a
  Documentation pass and is maintenance/QA-owned.
- Firefox/WebKit bounded attempts failed because agent-browser `0.33.1` only
  supports Chrome/Lightpanda here and no Firefox/WebKit binary is installed.
  No screen-reader stack was installed; no AT pass is claimed.

## 22. Leftovers And Handoff

No user-input blocker exists. No in-scope S1/S2 remains. Every leftover is
classified below:

- **Master `007` complete limitation — maintenance/QA owner:** Firefox,
  WebKit, and real screen-reader coverage; reopen on an environment with the
  relevant engine or AT installed.
- **Master `007` complete limitation — maintenance/QA owner:** Go/gofmt parser
  coverage; reopen when Go tooling is available.
- **Master `007` complete limitation — evidence owner:** the draft editor’s
  existing partially obscured textarea contrast check; reopen on a concrete
  contrast violation or when the shared editor styling changes.
- **Maintenance/QA — Extension owner:** unrelated Extension eyebrow contrast
  violation measured during smoke; reopen on Extension a11y work or the next
  workspace WCAG sweep.
- **Maintenance/operations — dependency owner:** existing `fast-uri`,
  PostCSS, and Babel audit findings; reopen on dependency maintenance or a
  changed reachable advisory. No package upgrade is part of this child.

Child `146` receives only:

- the final evidence index;
- selected adapter/dependency/fallback inventory;
- S3 limitations with owners/triggers;
- optional Firefox/WebKit/AT capability gaps;
- separately owned operations/maintenance items;
- current migration head, bundle baseline, and exact commits.

Exact Child `145` commits are `5b64a9d` (intake), `37e4bc8` (operation-route
fallback), and `72b8943` (keyboard-accessible code overflow); the final plan,
Master lifecycle, and evidence closeout commit is recorded after this
independent close-recheck. Any S1/S2 must be fixed before handoff.
