# Child Plan 146: Documentation Post-V1 Experience Final Closeout

Date reserved: 2026-07-31

Last implementation-readiness audit: 2026-08-05

Status: In progress — entry gate and closure ledger underway. This is not a
new feature child.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/145-documentation-experience-accessibility-browser-and-performance-hardening.md`

Review authority:

- final Q1–Q17 Plan `140`/grill decisions;
- ADRs `0027`–`0034`;
- `CONTEXT.md`;
- `docs/documentation-domain-decisions.md`;
- Master `007`;
- completed children `141`–`145`;
- current code, schemas, migrations, tests, build, dependencies, browser
  evidence, docs, commits, and worktree.

## 1. Objective

Independently reconcile the complete Master `007` sequence with its accepted
decisions and actual implementation. Fix only discovered in-scope closure
defects, rerun proportionate verification, synchronize current-truth records,
classify every limitation/leftover, verify commit scope, and close Master
`007` only when the evidence is clean.

This child does not assume Tiptap or Fumadocs was adopted. It reports the actual
Child `141` dispositions and resulting native/partial/adopted runtime.

## 2. Entry Gate

Do not begin closure until:

- children `141`–`145` each say complete and independently close-rechecked;
- every child includes checklist, implementation log, verification, browser
  evidence where relevant, limitations, leftovers, handoff, and commit IDs;
- no child carries an unresolved in-scope S1/S2;
- Child `145` provides a final evidence/dependency/fallback inventory;
- worktree ownership can be distinguished without discarding other changes.

If a child record is incomplete, repair that child record first and record the
repair here. Do not hide missing evidence in this closeout.

## 3. Closure Ledger

Create a table in this plan before fixes:

`master requirement | owning child | implementation files | tests/evidence |
result | gap/fix commit`.

It must cover:

- adapter proof and both dispositions;
- authoring modernization;
- reader modernization;
- generated request examples;
- accessibility/browser/motion/performance/security/dependency hardening;
- schemas/types/APIs/routes;
- permissions/tenant/public access;
- migration/backward compatibility;
- current-truth docs;
- commits/worktree;
- leftovers/future ownership.

Every Master `007` checklist item maps to one ledger row. No “covered by
tests” entry without exact test/evidence reference.

### 3.1 Entry ledger

| master requirement | owning child | implementation files | tests/evidence | result | gap/fix commit |
|---|---|---|---|---|---|
| Adapter proof and Tiptap disposition | 141, 142 | `apps/web/src/features/documentation/adapters/documentationEditorAdapter.ts`, `documentationTiptapProseAdapter.ts`, `DocumentationTiptapProseField.tsx` | Child 141/142 evidence; `documentationEditorAdapter.test.ts`, `documentationTiptapProseAdapter.test.ts`, full web 91/469 | Partial-adopted prose fields with native structural/fallback authority; whole graph is proof-only | None at intake |
| Adapter proof and Fumadocs disposition | 141, 143 | `documentationReaderAdapter.ts`, `DocumentationPublicationReaderChrome.tsx`, lazy wrapper | Child 141/143 evidence; `documentationReaderAdapter.test.ts`, `DocumentationPublicationReaderChrome.test.tsx`; public axe/tree | Partial-adopted page-tree/breadcrumb/TOC chrome over authorized Publication projection; native route/access/search authority retained | None at intake |
| Authoring modernization | 142 | `DocumentationPageEditor.tsx`, `DocumentationBlockEditor.tsx`, `DocumentationSnippetPanel.tsx`, prose adapter/fallback | Child 142 evidence; Page/Block/Snippet/editor adapter suites; draft browser route | Selected prose fields use Tiptap; identity, structure, save, conflict, comments, assets, Viewer, preview, import/export remain native | None at intake |
| Reader modernization | 143 | `PublicDocumentationReaderPage.tsx`, `DocumentationPublicationReaderChrome.tsx`, reader adapter | Child 143 evidence; public reader/API/initial-document suites; public Page browser route | Public Publication chrome only; draft and Revision remain explicit/native and access/search/SEO/CSP remain Ossie-owned | `37e4bc8` is a later operation-route fallback hardening fix |
| Generated request examples | 144 | `packages/documentation-domain/src/policies/documentation-request-example-policy.ts`, `documentation-try-it-policy.ts`, `DocumentationRequestExamples.tsx` | Child 144 evidence; domain 20/55; examples 4 tests; public/draft/Revision supported and unsupported routes | V1 permanent five-language inert registry; unsupported and sensitive values fail closed; Try-It remains separate | `72b8943` is a later overflow accessibility fix |
| Accessibility/browser/motion hardening | 145 | `PublicDocumentationReaderPage.tsx`, `DocumentationRequestExamples.tsx`, examples CSS/tests | Child 145 evidence and screenshots; Chromium axe/tree/keyboard/reflow/reduced-motion matrix | Required Documentation Chromium evidence passes; optional engines/AT are truthful limitations | `37e4bc8`, `72b8943` |
| Performance/bundle/dependency/security hardening | 145 | web manifest/build output; retained package manifests/lockfile; Documentation UI/domain code | Child 145 evidence; final build/chunk table; frozen install/license/audit; long-task/target-network scan | Route chunks and inert/security boundaries pass; known audit findings are unchanged and owned separately | None at intake |
| Schemas/types/APIs/routes | 141–145 | existing Documentation types/API clients/routes plus touched web/domain files | focused server 5/39; domain 20/55; web 91/469; route/API tests; `git diff`/manifest scan | No new schema, wire field, endpoint, cookie, route, or persistence state | None at intake |
| Permissions/tenant/public access | 141–145 | existing server access policy, public reader/API clients, Documentation permissions and Try-It policy | Child 143/144/145 evidence; permission tests; public/password/unavailable route tests; no-target-network check | Existing Organization/Project/public/Try-It authority remains server/client-contract aligned; generated examples add no authority | None at intake |
| Migration/backward compatibility | 141–145 | `apps/server/src/db/migrations/031_documentation_v1_operational_hardening.sql`; existing import/export/revision/publication clients | migration inventory; portability/carry-forward/revision/publication/route suites; migration head scan | Head remains 031; no adapter/example persistence; native fallback and V0/V1 behavior retained | None at intake |
| Current-truth docs | 141–145 | `CONTEXT.md`, domain decisions, ADRs, children, Master 007, `docs/ui/` | child closeout records; Child 145 evidence; current-truth scan | Actual partial-adopt/shipped/deferred/rejected wording is recorded; final Master status remains pending this child | None at intake |
| Commits and worktree | 141–145 | commits `e4f8f81` through `886a396`; current worktree | `git log`, `git status`, `git diff --check`, scoped commit review | Child commits are attributable and worktree is clean before this ledger edit | None at intake |
| Leftovers and future ownership | 145 | Child 145 section 22 and hardening evidence | explicit S3/maintenance owners/triggers; optional engine/AT record | Every remaining item is classified as Master limitation or maintenance/operations; no unowned follow-up | None at intake |

## 4. Full Implementation Reconciliation

### 4.1 Child 141 adapter gate

Verify:

- final Tiptap and Fumadocs dispositions are explicit;
- scorecard mandatory gates drove the result;
- runtime matches the exact adopted/partial/native result;
- rejected proof UI/query selectors/dependencies are gone;
- retained packages use recorded exact versions/licenses;
- no proof-only source, router, Loader, MDX, UI framework, hosted service, or
  private registry leaked into production;
- native fallback still works without data conversion.

### 4.2 Child 142 authoring

Verify:

- Page and snippet use the selected branch;
- all block/nested identities and positions persist;
- read-only, permissions, autosave/save/conflict/local recovery are correct;
- comments, assets, references, preview, import/export, checkpoint, review,
  Publication, search, and Carry-Forward remain compatible;
- adapter state never became persistence;
- unknown/executable content fails closed.

### 4.3 Child 143 reader

Verify:

- public Publication, draft preview, and Revision preview remain explicit;
- public/password/internal/revoked/expired/unknown boundaries;
- canonical/default/explicit-version URLs, redirect/gone/anchors;
- search, assets, snippets, frozen artifact references, API operations;
- initial HTML/bootstrap/hydration, metadata, sitemap, robots, ETag/cache, CSP;
- Fumadocs/native presentation never owns source, routing, access, or search;
- unrelated/public routes do not load authoring dependencies.

### 4.4 Child 144 examples

Verify:

- exact five-language registry;
- descriptor V1 permanently maps to
  `documentation-request-example-v1`;
- descriptor V0/future unknown versions fail safely;
- required missing/unsupported inputs do not invent runnable output;
- draft/Revision/Publication same-descriptor output is reproducible;
- mutable Try-It/private values cannot influence generated text;
- no network/execution/proxy/package/archive/SDK behavior;
- copy/download is bounded and accessible.

### 4.5 Child 145 hardening

Verify:

- no unresolved S1/S2;
- required Chromium evidence;
- WCAG/keyboard/focus/zoom/320px/reduced-motion/manual/axe evidence;
- optional engine/AT limitations are truthful;
- bundle/performance and route isolation;
- security/privacy/credential/tenant tests;
- dependency license/audit/frozen install;
- existing-product regression smoke.

## 5. Current Runtime Contract Audit

### 5.1 Source of truth

PostgreSQL relational content, protected Files, exact Revisions/Publications,
access policy, and accepted descriptors remain authoritative. Tiptap,
Fumadocs, generated text, component state, caches, and build output remain
replaceable/derived.

### 5.2 Permissions

Reconcile server and UI for:

- Organization tenant isolation;
- Project Membership Owner/Maintainer/Contributor/Viewer behavior;
- archived/read-only lifecycle;
- comments/review/publication roles;
- public/password/internal Publish Links;
- Try-It configuration/send authority;
- generated examples using only existing read authority.

Search for client-only checks that accidentally replaced server enforcement.

### 5.3 Routes and APIs

Inventory method plus template for every touched endpoint and public route.
Confirm no unplanned route, endpoint, response field, cookie, cache, or status
change. Verify client callers and Zod schemas match server output.

### 5.4 Schemas and migrations

- migration history remains additive and current head is recorded;
- expected head is `031` because Master `007` is adapter/derived UI work;
- no Tiptap/Fumadocs/rendered-example state is persisted;
- shared block and descriptor schemas are compatible;
- if an authorized in-scope repair added a migration, audit forward/rollback,
  constraints/indexes/backfill, DB integration, and update every plan truth
  statement. An unexplained new migration prevents closure.

### 5.5 Backwards compatibility

Open representative pre-Master V1 data and prove:

- draft authoring and snippets;
- import/export/package and Carry-Forward;
- checkpoint/review/Publication/rollback;
- public links/URLs/search/assets/SEO;
- descriptor V0 and V1;
- removal/native fallback.

No operator content rewrite may be required.

## 6. Dependency And Build Audit

For each new retained package:

- direct/transitive owner and exact version;
- lockfile/manifest consistency;
- license and notices;
- official compatibility and peer/engine constraints;
- reachable advisory disposition;
- route chunk inclusion;
- fallback/removal path.

Assert absent:

- rejected Tiptap/Fumadocs packages;
- Tiptap UI/Pro/Cloud/Collaboration/AI;
- Fumadocs UI/MDX/Loader/router/search replacement;
- unexpected editor packages on reader/unrelated routes;
- duplicate React/runtime;
- proof-only flags/selectors.

Run frozen install, audit, lint, type-check, tests, production build, and inspect
manifest. Do not upgrade unrelated packages during closeout.

## 7. Security And Threat Recheck

Re-run or inspect evidence for:

- cross-tenant/project access attempts;
- public/private bootstrap and error enumeration;
- password/revoked/expired;
- XSS/CSP/serialization/paste/drop;
- credential/private-origin sentinel absence;
- no target request from generated examples;
- no framework/third-party network;
- bounded code generation/copy/download;
- no raw content/secrets in logs/evidence;
- immutable Publication behavior;
- no destructive lifecycle expansion.

Any S1 is fixed immediately and all related matrices rerun.

## 8. Browser And Accessibility Recheck

Use the existing seeded fixture and real routes. At minimum independently rerun
representative:

- Project Editor Page and snippet edit/save;
- Viewer read-only;
- conflict/error recovery;
- public default and explicit-version reader;
- password and internal denial;
- redirect/gone/search;
- Revision/draft preview;
- supported/unsupported five-language examples and copy/download;
- selected adapter/native fallback;
- desktop, 320px, 200%, reduced motion, keyboard;
- axe/tree, console, failed requests, initial HTML/header checks.

Chromium is required. Use Child `145` optional-engine/AT record unless a late
fix affects those paths; then rerun what is available and record limits.

## 9. Documentation And Current-Truth Audit

Review/update only where actual results require:

- `CONTEXT.md`;
- `PRODUCT.md`;
- `README.md`;
- `docs/documentation-domain-decisions.md`;
- `docs/roadmap.md`;
- relevant accepted ADR consequences/status wording;
- Master `007`;
- children `141`–`146`;
- `docs/ui/` evidence index;
- `apps/docs` repository documentation content/tests only when it mirrors
  current truth.

Required wording:

- name actual Tiptap/Fumadocs dispositions;
- distinguish shipped behavior, accepted later, deferred, rejected, and
  separately owned operations;
- state generated example contract/languages and non-SDK/non-proxy boundary;
- state known browser/AT/lab limitations;
- never claim future accepted-later features are shipped;
- remove stale claims that Documentation V1 is merely future.

No new ADR is needed merely to record an evidence-derived adapter choice inside
the already accepted replaceable boundary. Create one only if an actual durable
semantic decision beyond current authority was explicitly accepted.

## 10. Exact Write Set

Expected:

- this plan;
- Master `007`;
- current-truth docs listed above where stale;
- focused runtime/tests only for reproduced closure defects;
- evidence index/screenshots only when refreshed;
- manifest/lockfile only to remove an unowned/rejected dependency.

Forbidden:

- new feature implementation;
- accepted-later/deferred/separate work;
- speculative migration/API;
- unrelated dependency upgrades, formatting churn, lint debt, infrastructure,
  or product redesign.

## 11. Final Verification Matrix

Record exact commands/results for:

- every affected workspace package test;
- Documentation domain/types;
- web/server focused and broad proportional tests;
- DB Documentation integration if server/schema changed anywhere in sequence;
- V1 smoke workflow;
- lint and type-check;
- production builds and manifest/chunk inspection;
- frozen install, audit, license scan;
- route/API/schema/migration scans;
- agent-browser closure matrix;
- Prettier on changed docs/code as configured;
- `git diff --check`;
- secret/prohibited-dependency/proof-flag/current-truth searches;
- commit/path ownership audit.

After any late fix, rerun focused evidence and every downstream check it can
invalidate.

## 12. Commit And Worktree Audit

For every Master `007` commit:

- map commit to one child/log entry;
- inspect changed paths;
- verify only scoped changes;
- verify no unrelated user/agent work was included;
- ensure plan-only, implementation, and closeout commits are logically clear;
- record any pre-existing unrelated dirty paths as preserved.

Suggested closure commits:

- one or more scoped fix commits named by defect;
- `docs(documentation): close post-v1 experience master`.

Commit each scoped fix as a small, single-purpose, independently reviewable,
focused-test-green slice. Split fixes by defect/root cause and keep the final
records-only closeout separate. Never accumulate all closure repairs into one
large commit or mix unrelated child defects merely because they were found in
the same audit. Stage exact paths and preserve unrelated work.

If no runtime/docs gap is found, explicitly record “no changes needed” rather
than manufacture a commit. The final plan/master record update is itself a
scoped docs change when status closes.

## 13. Leftover Classification

Every remaining item must be in exactly one band:

1. **Master `007` complete limitation** — non-blocking S3 with owner/trigger;
2. **accepted later Documentation** — one-way GitHub proposal, translation,
   custom domains, feedback, aggregate analytics, external review, presence,
   offline read-only, disclosure block, static export;
3. **separate Knowledge Platform** — Organization metadata discovery or
   governed deletion;
4. **maintenance/operations/QA** — PostgreSQL/lint, production telemetry,
   distributed admission/jobs/storage, optional browser/AT coverage;
5. **rejected/deferred** — executable content, two-way Git, simultaneous/offline
   mutation, SDK packages, direct cloud deployment, proxy/credentials.

No unowned “follow up later” phrase is allowed.

## 14. Stop Conditions

Routine closure fixes do not require user input. Stop only if evidence shows a
necessary change to accepted source of truth, permissions, public URL,
immutability, retention/deletion, major license/security posture, or Master
scope/ordering. Provide recommendation, alternatives, evidence, reversibility,
and affected scope.

An adapter failure is not such a stop: select the native fallback, remove the
package, rerun evidence, and continue.

## 15. Acceptance Criteria

- ledger maps every master requirement to actual proof;
- children `141`–`145` records are complete and truthful;
- implementation matches dispositions and ADRs;
- no missing schema/type/API/UI/doc/security/migration/compatibility item;
- no unresolved in-scope S1/S2;
- required browser/accessibility/performance/dependency evidence passes;
- current-truth docs agree;
- master checks only truly completed boxes;
- leftovers are classified/owned;
- commits/worktree are scoped;
- final independent recheck is clean.

Only then set this child and Master `007` to Complete.

## 16. Explicit Non-Scope

- new feature or redesign;
- reopening evidence-derived adapter choice without new failure;
- implementing accepted-later items;
- solving separate operations/Knowledge Platform work;
- speculative next master/child sequence;
- claiming optional evidence not obtained.

## 17. Execution Stages

1. entry gate and closure ledger;
2. child-by-child implementation reconciliation;
3. contract/schema/route/permission/migration audit;
4. dependency/build/security audit;
5. browser/accessibility representative rerun;
6. current-truth and commit/worktree audit;
7. fix/reverify loop until clean;
8. leftover classification;
9. child/master final records and scoped commit.

## 18. Checklist

### Entry and ledger

- [ ] Children `141`–`145` complete/close-rechecked.
- [ ] Every child record/commit/leftover read.
- [ ] Closure ledger completed.
- [ ] Current worktree/code/dependency/migration state recorded.
- [ ] Closure plan refreshed and independently rechecked.

### Reconciliation

- [ ] Child `141` dispositions match runtime/dependencies.
- [ ] Child `142` authoring contracts verified.
- [ ] Child `143` reader contracts verified.
- [ ] Child `144` generator/history/isolation verified.
- [ ] Child `145` hardening evidence verified.
- [ ] Source-of-truth/permissions/routes/APIs/schemas/migrations audited.
- [ ] Backwards compatibility/native fallback audited.

### Verification

- [ ] Focused/broad/DB/smoke checks pass as applicable.
- [ ] Lint/type/build/frozen/audit/license checks pass.
- [ ] Required Chromium representative matrix passes.
- [ ] Accessibility/performance/security evidence passes.
- [ ] Prohibited dependency/flag/secret scans pass.
- [ ] Commit/path/worktree audit passes.
- [ ] Late fixes rerun impacted evidence.

### Documentation and closure

- [ ] Current-truth docs synchronized.
- [ ] Every child has status/checklist/log/verification/leftovers/handoff.
- [ ] Master lifecycle/checklist reflects actual completion only.
- [ ] Every leftover classified with owner/trigger.
- [ ] No unresolved S1/S2 or false pass.
- [ ] Final independent recheck clean.
- [ ] Scoped closure commit(s) recorded.
- [ ] Closure commits are small, single-purpose, focused-test green, and
      independently reviewable; no large combined repair commit was used.
- [ ] Child `146` and Master `007` marked Complete.

## 19. Implementation And Closure Log

Not started. Append dated audit/fix/closure facts.

## 20. Verification Record

Not started. Record exact commands, counts, versions, routes, fixture identity,
bundle values, browser/accessibility results, capability limits, and commits.

## 21. Leftovers And Final Handoff

At planning time no user-input blocker remains. Final handoff must state:

- Master outcome and actual adapters;
- shipped request-example languages/version contract;
- migration head and compatibility result;
- evidence index and limitations;
- accepted-later/separate/deferred/rejected matrix;
- whether a new decision/master is needed next.

Do not create the next master automatically. After closure, the next activity is
an explicit prioritization/decision, not accidental continuation.
