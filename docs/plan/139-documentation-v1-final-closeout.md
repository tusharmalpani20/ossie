# Child Plan 139: Documentation V1 Final Closeout

**Parent:** `docs/plan/master/006-documentation-platform-v1-master-plan.md`

**Predecessor:** `docs/plan/138-documentation-v1-operational-hardening.md`

**Next:** `docs/plan/140-post-v1-documentation-decision-gate.md`

**Reserved:** 2026-07-30

**Expanded:** 2026-07-31

**Status:** Complete, independently close-rechecked, and verified on
2026-07-31. Product Documentation V1 is closed with no unresolved S1/S2
defect. Child `140` remains the next, decision-only step.

## 1. Sequence Gate And Starting State

Child `139` is a closeout/audit child, not a new Product Documentation feature
phase.

The expansion baseline is:

- repository: `/home/ubuntu/ossie`;
- branch: `main`;
- starting commit:
  `f9ac6666977aea935c172ed4a8ae8cb0138a549c`;
- starting worktree: clean;
- schema migration head:
  `031_documentation_v1_operational_hardening.sql`;
- children `132` through `138`: implemented, independently close-rechecked,
  documented, and committed;
- child `140`: reserved and decision-only;
- no Product Documentation runtime work is authorized by this expansion.

Before executing this child:

1. rerun `git rev-parse HEAD` and `git status --porcelain=v1`;
2. reread this child, Master `006`, child `138`, child `131`, the accepted grill
   record, `CONTEXT.md`, Documentation decisions, and ADRs `0027`–`0033`;
3. inspect commits after `f9ac666` and reconcile any code or plan drift;
4. record all pre-existing uncommitted files and their owner;
5. do not overwrite, stage, format, or commit another agent's work;
6. update this baseline if implementation has moved before starting the audit.

Child `139` may close only after the audit is repeated until clean. Child `140`
must not begin from an unresolved S1/S2 defect, a false completion claim, a
dirty ownership boundary, or an incomplete evidence record.

## 2. Purpose

Audit the complete Product Documentation V1 against accepted decisions, the
combined result of children `132`–`138`, the current codebase, and the existing
product.

The child must:

- prove that shipped behavior matches the accepted model;
- find and repair scoped closure defects;
- prove schema, contracts, APIs, UI, permissions, migration, compatibility,
  security, accessibility, performance, and operations as one system;
- synchronize active current-truth documentation;
- classify every remaining limitation honestly;
- close Master `006` only through the child `139` V1 implementation criteria;
- leave child `140` a stable, evidence-backed decision baseline.

This child is not complete because the existing tests pass. It is complete only
when decision-to-runtime traceability, current-state documentation, real
browser behavior, clean migration proof, and cross-product regression proof all
agree.

## 3. Authority And Decision Precedence

Use this precedence when sources disagree:

1. current accepted ADRs `0021`–`0033`;
2. accepted grill answers and `docs/documentation-domain-decisions.md`;
3. `CONTEXT.md` domain language and relationships;
4. Master `006` fixed decisions and completion criteria;
5. completed child plans `132`–`138`, including their independent close-recheck
   corrections;
6. current executable schema/contracts/runtime/tests;
7. current-truth/operator documentation;
8. historical planning prose.

Do not silently choose between contradictory authorities.

- If runtime violates an accepted durable decision, fix runtime and tests.
- If a child plan contains stale pre-implementation wording but runtime matches
  the accepted decision, correct the plan's final record without rewriting its
  historical log.
- If an ADR is wrong rather than merely stale, stop and document the conflict.
  Do not rewrite an accepted ADR casually during closeout.
- If a product change would be needed to settle an unaccepted question, record
  it for child `140`; do not invent the answer here.

## 4. Completed Child And Commit Baseline

### 4.1 Child closure anchors

| Child | Shipped boundary                                                 | Migration | Final plan-record anchors       |
| ----- | ---------------------------------------------------------------- | --------- | ------------------------------- |
| `132` | First Site/Edition/Page/Revision/Publication/public-reader slice | `025`     | `ab3ee6a`, `d1c4210`            |
| `133` | Constrained content, Snippets, Assets, protected references      | `026`     | `97c9c5a`, `2fec4e7`            |
| `134` | Inspected import/export and package portability                  | `027`     | `d71f278`, `bc27d43`            |
| `135` | Multi-Site, Carry-Forward, lifecycle                             | `028`     | `001dc67`, `569d33b`            |
| `136` | Exact-Revision review and approval                               | `029`     | `27b22ae`, `6c4b0a9`            |
| `137` | Browser-direct API Try It and examples                           | `030`     | `b3fb26b`, `519a21c`            |
| `138` | Operational hardening and final material V1 behavior             | `031`     | `d123d82`, `72f3207`, `f9ac666` |

The child `138` close-recheck runtime chain also includes `d1db672`,
`5b0b884`, `845e1a6`, and the final workspace-lint repair `a40b938`. Do not
audit only the plan-record commits: the authoritative implementation range
below includes these repairs and every earlier child commit.

### 4.2 Authoritative implementation range

The audit range begins with Master `006` at `6be45d7` and ends at the execution
start commit. At expansion time the exact range is:

```text
6be45d7^..f9ac666
```

During execution, produce an owned commit ledger with:

```bash
git log --oneline --reverse 6be45d7^..HEAD
git log --oneline --reverse 6be45d7^..HEAD \
  --grep='documentation\|Documentation' --regexp-ignore-case
git diff --name-status 6be45d7^..HEAD
```

The ledger must classify every commit as:

- plan/decision;
- shared contract/domain;
- migration/server/API;
- portal/public reader;
- fixture/test/evidence;
- close-recheck repair;
- dependency/lockfile;
- current-truth documentation;
- unrelated and therefore excluded from child `139` ownership.

Do not claim that the grep-filtered list is complete: commits with generic
messages may still affect Documentation. The name-status range and actual
callers are authoritative.

## 5. Actual V1 Baseline After Child 138

### 5.1 Shipped domain

The current implementation provides:

- Organization-owned Projects and stable Documentation Sites;
- at most one Site Edition for a Site/Project Version pair;
- mutable Site Working Drafts with Pages, constrained blocks, Navigation,
  aliases, redirects, `gone` routes, Snippets, Assets, OpenAPI, and private
  comments;
- active/archived lifecycle with inherited read-only behavior;
- immutable whole-Site Revisions;
- immutable Site Publications selected by stable multi-version Publish Links;
- public/restricted access, rollback, revocation, version routes, exact assets,
  search, OpenAPI operation routes, sitemap, robots, canonical/social metadata,
  and crawler-visible initial HTML;
- inspected Markdown and Site-package import, deterministic export, and
  protected File reuse;
- exact-Revision Carry-Forward across Project Versions without overwrite;
- optional exact-Revision review/approval with immutable Publication evidence;
- browser-direct, operator/Admin-governed Try It with memory-only credentials;
- Organization Documentation limits/usage, hard ceilings, publication
  admission, deterministic search rebuild, discovery policy, health/readiness,
  environment diagnostics, and maintenance tooling.

### 5.2 Source-of-truth boundaries

- PostgreSQL is authoritative for identity, mutable draft state, immutable
  Revision/Publication state, review evidence, policy, and search selectors.
- File storage owns bytes; PostgreSQL owns File metadata and protected
  references.
- Persisted draft and Publication search documents are derived, rebuildable
  projections.
- Stable Publish Link policy governs outside access.
- The public React reader and Fastify initial-document renderer are adapters
  over exact immutable Publication state.
- `apps/docs` remains contributor/operator documentation and is not the
  customer-authored Product Documentation runtime.
- Tiptap and Fumadocs remain unadopted, optional future adapters.
- The browser extension has no Product Documentation authoring authority.

### 5.3 Known accepted limitations

These are not child `139` defects unless runtime/docs falsely claim otherwise:

- Chromium is the required locally proven browser; Firefox/WebKit proof is
  capability-dependent;
- production p75 telemetry is operator-owned; local lab measurements are not
  production percentiles;
- admission and rate limits remain per process;
- no durable Publication worker/queue exists;
- no automatic customer-content retention purge exists;
- no product analytics exists;
- no Redis/CDN/application content cache or external search service exists;
- no Git/GitHub sync, translations, custom domains, public feedback, realtime
  collaboration, offline merge, permanent deletion, cross-artifact search,
  stored Try-It credentials, server proxy, SDK generation, or Video exists;
- no automatic whole-Organization projection rebuild scheduler exists.

## 6. Closeout Severity And Classification

Every finding must be logged with:

- stable finding ID (`DOC139-S1-001`, for example);
- source criterion;
- evidence;
- affected tenant/access/lifecycle state;
- severity;
- owner;
- fix or leftover disposition;
- regression test/browser proof;
- commit.

### 6.1 Severity

| Severity | Meaning                                                                                                                                                                   | Required disposition                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `S1`     | Cross-tenant/public/private leak, credential exposure, destructive corruption, migration/rollback loss, auth bypass, remote-code path                                     | Fix immediately; stop broad verification; child cannot close    |
| `S2`     | Accepted V1 behavior missing/broken, immutable Publication drift, unsafe partial mutation, inaccessible critical journey, upgrade failure, major cross-product regression | Fix before close; repeat affected and broad verification        |
| `S3`     | Bounded non-security defect with safe workaround, misleading non-critical UI/docs, unsupported edge that does not violate an accepted invariant                           | Fix when clearly scoped; otherwise document owner and rationale |
| `S4`     | Cosmetic, evidence-quality, or future improvement with no contract/security/access impact                                                                                 | May be explicit leftover                                        |

### 6.2 Fix versus leftover

Fix in child `139` only when all are true:

- the behavior is already accepted V1 scope;
- the defect is reproducible or statically proven;
- the owner and safe correction are known;
- the correction does not require a new durable product decision;
- migration/API compatibility can be preserved;
- focused regression proof can be written first.

Hand to child `140` or a later plan when any are true:

- new feature/capability;
- new external authority;
- new access model;
- destructive retention/deletion policy;
- new background infrastructure;
- custom domain/Git/translation/analytics/realtime decision;
- materially new migration strategy;
- product-wide router/editor/framework replacement.

### 6.3 Repeat-until-clean loop

For every S1/S2 or chosen S3 repair:

1. reproduce with a failing test, DB proof, or agent-browser evidence;
2. identify the authoritative accepted behavior;
3. implement the smallest scoped repair;
4. pass focused verification;
5. rerun the affected child journey;
6. rerun security/tenant/public boundaries touched by the repair;
7. rerun the broad closeout matrix;
8. update finding, child plan, master, and current-truth docs;
9. repeat the audit scan until no unresolved S1/S2 remains.

## 7. Decision-To-Implementation Traceability

Execution must complete this matrix with exact files, tests, evidence, result,
and finding IDs. The owner/evidence columns below are the minimum starting map.

| Decision/criterion                        | Runtime owner                                                             | Required proof                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Site/Edition/Page identity and mutability | migrations `025`–`028`, `@repo/types`, Documentation repository           | FK/unique/Row Version/lifecycle DB tests                                      |
| Constrained non-executable content        | `@repo/documentation-domain`, `DocumentationBlockEditor`, public renderer | exhaustive kind tests, stored-XSS negative proof                              |
| Whole-Site Revision/Publication           | revision/publication policies and repository                              | digest, immutability, completeness, unchanged old Publication                 |
| Stable multi-version Publish Link         | `@repo/publish-domain`, Documentation routes/repository                   | default/version selection, access, rollback, revoke                           |
| Database authority                        | migrations/repositories                                                   | no client/framework object authority, transaction proof                       |
| Private comments                          | comment policy/routes/UI                                                  | permission, anchor, transition, public-exclusion proof                        |
| Snippets and Assets                       | content/asset policies, File protections                                  | lifecycle, reference, byte/digest, public exact-reference proof               |
| OpenAPI self-contained source             | OpenAPI policy, inspection/apply/export                                   | size/ref/cycle/protocol bounds and immutable freeze                           |
| Import/export portability                 | package/Markdown policies and portability adapters                        | inspect/apply atomicity, traversal/bomb limits, replay/export determinism     |
| Carry-Forward                             | carry-forward policy/repository/UI                                        | exact source Revision, no overwrite, idempotency, protected File reuse        |
| Review/approval                           | review contracts/domain/repository/UI                                     | exact Revision, current membership, self-review rules, gate/override evidence |
| Browser-direct Try It                     | Try-It contracts/policy/client/CSP                                        | no proxy/storage, exact origin, DNS/CSP digest, one-attempt evidence          |
| Search                                    | search policy, draft/public projections                                   | tenant isolation, ranking, literal `%/_`, path/Page-ID, deterministic rebuild |
| Publication failure/rollback              | admission/repository/link switch                                          | busy/capacity/timeout/failure leaves live pointer unchanged                   |
| Public reader and SEO                     | public loaders, initial document, React reader                            | exact status/content/canonical/noindex/sitemap/robots/ETag                    |
| Organization limits/operations            | migration `031`, operations module/UI                                     | Owner mutation, member read, quota races, recovery                            |
| Audit/Access Evidence                     | coverage registries and transaction context                               | all required actions, no sensitive body/query/credential fields               |
| Accessibility/responsive/motion           | shared UI + Documentation surfaces                                        | keyboard/focus/zoom/320px/reduced-motion/axe                                  |
| Existing product compatibility            | Capture/Guide/Demo/extension/publish/file tests                           | full suites and representative browser/smoke paths                            |
| Tooling boundaries                        | decisions, adapters, package graph                                        | no Fumadocs/Tiptap/customer-content coupling                                  |

## 8. Exact File Ownership

### 8.1 Mandatory write set

The normal clean closeout is expected to update only:

- `docs/plan/139-documentation-v1-final-closeout.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md`
- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`
- `docs/ui/139-documentation-v1-final-closeout-browser-evidence.md`

Update these current-truth files only where the audit proves stale Product
Documentation claims:

- `README.md`
- `docs/roadmap.md`
- `docs/oss-alpha-summary.md`
- `docs/project-zoomout-status.md`
- `docs/backend-route-inventory.md`
- `docs/v1-dogfood-smoke-suite.md`
- `docs/self-hosting.md`
- `docs/operations.md`
- `docs/development-setup.md`
- `docs/production-readiness-checklist.md`
- `docs/documentation-portability-format.md`
- `apps/docs/app/docs-content.ts`
- `apps/docs/app/docs-content.test.ts`
- `apps/docs/app/page.tsx`
- `apps/docs/README.md`
- `THIRD_PARTY_NOTICES.md` only if the final dependency/license audit proves a
  notice change is required.

Known stale truth that execution must resolve:

- Master `006` currently says child `137` is the latest independently
  close-rechecked predecessor even though child `138` is closed;
- `CONTEXT.md` has a heading claiming Documentation is shipped only through
  child `137`;
- sequence/status wording must distinguish "V1 implementation complete after
  child `139`" from "Master `006` complete after decision-only child `140`".

### 8.2 Child plans and evidence

Read and verify:

- `docs/plan/131-documentation-domain-grill.md`
- `docs/plan/132-documentation-site-first-vertical-slice.md`
- `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`
- `docs/plan/134-documentation-import-export-and-package-portability.md`
- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`
- `docs/plan/136-documentation-review-and-approval-workflow.md`
- `docs/plan/137-documentation-api-try-it-and-example-experience.md`
- `docs/plan/138-documentation-v1-operational-hardening.md`
- every matching file under `docs/ui/132-*` through `docs/ui/138-*`.

Modify a completed child only for a demonstrably stale final status,
verification, leftover, or handoff statement. Preserve dated planning history.
Do not normalize style or rewrite completed plans wholesale.

### 8.3 Read-only decision sources

Read:

- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/adr/0021-project-versions-are-release-contexts.md`
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`
- `docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md`
- `docs/adr/0024-project-membership-governs-project-access.md`
- `docs/adr/0025-core-domain-persistence-is-explicitly-relational.md`
- `docs/adr/0026-publish-links-are-multi-version-artifact-manifests.md`
- `docs/adr/0027-documentation-sites-use-edition-wide-revisions-and-publications.md`
- `docs/adr/0028-documentation-is-database-authoritative-constrained-content.md`
- `docs/adr/0029-documentation-reader-is-an-authorized-publication-adapter.md`
- `docs/adr/0030-documentation-comments-are-private-authoring-workspace.md`
- `docs/adr/0031-documentation-import-export-is-inspected-portability-not-authority.md`
- `docs/adr/0032-documentation-review-targets-exact-revisions-and-gates-are-optional.md`
- `docs/adr/0033-documentation-try-it-is-browser-direct-and-origin-governed.md`.

ADRs are read-only unless the audit proves a factual typo that does not alter
the decision. A new/reversed decision belongs to child `140` or a separate
accepted ADR task.

### 8.4 Conditional runtime repair allowlist

Touch only the smallest owner set required by a reproduced closure defect:

Shared contracts/policies:

- `packages/constants/src/documentation.ts`
- `packages/constants/src/audit.ts`
- `packages/constants/src/access.ts`
- `packages/types/src/documentation.ts`
- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/policies/documentation-*.ts`
- matching `*.test.ts`
- `packages/publish-domain/**`, `packages/file-domain/**`, or
  `packages/audit-domain/**` only for a proven shared-boundary regression.

Server:

- `apps/server/src/db/migrations/025_*.sql` through `031_*.sql` are read-only;
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation-*.ts`
- `apps/server/src/modules/documentation-review/**`
- `apps/server/src/modules/documentation-operations/**`
- `apps/server/src/modules/publish/**` only for shared Publish Link behavior;
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/config/documentation-*.ts`
- `apps/server/src/config/production-env-report.ts`
- `apps/server/src/ops/production-env-report.ts`
- `apps/server/src/operations/documentation-projection-rebuild.cli.ts`
- `apps/server/src/app.ts`
- matching unit/DB/integration tests;
- `apps/server/src/dev-fixtures/documentation-browser-fixture.cli.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`.

Web:

- `apps/web/src/App.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/documentation*.ts`
- `apps/web/src/features/documentation/**`
- `apps/web/vite.config.ts`
- matching tests and CSS Modules.

Compatibility:

- existing Capture/Guide/Demo/extension code only when a regression is proven
  to be caused by Documentation V1 and the fix belongs to the shared boundary.

If a finding requires a file outside this allowlist, pause, add the exact file
and rationale to this plan, and recheck scope before editing.

### 8.5 Forbidden output

Never commit:

- `node_modules`;
- `.next`, `dist`, `.turbo`, coverage, trace, HAR, downloaded browser profiles;
- disposable database dumps;
- temporary imports/exports;
- authentication state, cookies, passwords, tokens, private origins, or raw
  Try-It requests/responses;
- screenshots containing secrets or private customer data.

## 9. Schema And Migration Audit

### 9.1 Migration chain

Audit immutable committed migrations:

- `025_documentation_site_first_vertical_slice.sql`
- `026_documentation_content_snippets_and_asset_workflows.sql`
- `027_documentation_import_export_portability.sql`
- `028_documentation_carry_forward_multi_site_lifecycle.sql`
- `029_documentation_review_and_approval_workflow.sql`
- `030_documentation_api_try_it.sql`
- `031_documentation_v1_operational_hardening.sql`

Do not edit an applied migration.

If a schema defect requires change:

- write a failing DB/foundation test first;
- create additive migration `032` with a precise name;
- update migration/reset/foundation/grant/audit tests;
- define clean install, populated upgrade, down behavior, and rollback refusal;
- update this plan and Master `006` before implementing;
- treat `032` as a closure repair, not an opportunity for new scope.

### 9.2 Catalog and constraint proof

Verify:

- every Documentation child row has correct Organization/Project/Site/Edition
  scope;
- cross-scope composite foreign keys prevent tenant/parent substitution;
- one Site Edition exists per Site/Project Version;
- Page/Snippet/Asset/OpenAPI/comment/review children cannot cross Edition/Site;
- positive server-owned Revision and Publication sequences are unique in their
  intended scope and never reused;
- immutable Revision/Publication/frozen policy/evidence tables reject update
  and delete as designed;
- Publish Link entries reference exact compatible Site Publications;
- protected File references block unsafe purge/deletion;
- lifecycle/status/check constraints match shared enums;
- search generation/selector constraints preserve atomic replacement;
- discovery allows only one eligible primary canonical link per stable Site;
- Organization limits have virtual version `0`, safe first-write behavior, and
  same-Organization actor constraints;
- runtime and maintenance grants are least-privilege and complete;
- audit context/constraint triggers cover every direct write table;
- down guards refuse populated incompatible rollback.

### 9.3 Installation and upgrade paths

Prove:

1. clean database creation and migrations `001`–`031`;
2. upgrade from a disposable `024` baseline through `025`–`031`;
3. upgrade from `030` through `031`;
4. runtime-role provisioning and schema access;
5. migration status clean;
6. reset/reseed of the disposable testing database;
7. guarded `031` down/up in an empty compatible database;
8. populated `031` down refusal;
9. backup/restore into an isolated disposable database;
10. protected File references and public Publication resolution after restore.

Never run destructive reset/down/drop commands against development, shared,
staging, production, or an unverified database name.

## 10. Shared Schemas, Types, And Domain Policies

### 10.1 Shared Zod contracts

Audit `packages/types/src/documentation.ts` and its tests for:

- asset source and constrained block discriminated unions;
- Site, Edition, Page, Navigation, routing, Snippet, Asset, comment, Revision,
  Publication, rollback, and conflict contracts;
- review policy/request/assignment/decision/gate/evidence contracts;
- public search, public operation, and public Site snapshot contracts;
- package manifest/portable Page/Snippet/Site and import inspection/apply;
- lifecycle and Carry-Forward request/response/options;
- Organization limits, usage, limit state, operations summary, rebuild,
  discovery policy;
- Try-It descriptors, Site/link policy, configuration, attempt report, and
  public operation contracts.

At the execution commit, enumerate every exported `Documentation*Schema`,
`PublicDocumentation*Schema`, `UpdateDocumentation*Schema`, and inferred
Documentation type from this file. Map each request/response export to its
route/service/UI consumers and each persisted enum/discriminant to its
migration check. This generated inventory is evidence; the category list above
must not be treated as permission to skip an export added after this plan was
written.

For every request contract verify:

- `.strict()` or deliberate unknown-field behavior;
- bounded strings/arrays/bytes/depth/counts;
- ID/slug/path/digest/date formats;
- optional versus nullable semantics;
- Row Version and idempotency requirements;
- discriminated-union exhaustiveness;
- no server-only record or secret in public/shared response types.

### 10.2 Domain policy owners

Audit all `packages/documentation-domain/src/policies/documentation-*.ts`:

- Site/language;
- constrained content and Snippets;
- Navigation and routing;
- comments;
- OpenAPI;
- Revision and Publication;
- Asset and artifact references;
- package/Markdown portability;
- Carry-Forward and lifecycle;
- review;
- search;
- operational limits/ETag/metadata;
- public-origin/CSP and Try It.

Verify policies contain no PostgreSQL/Fastify/React/framework authority and
that adapters do not duplicate a policy with divergent behavior.

### 10.3 Error contracts

Audit Documentation domain errors and route mapping:

- validation: `400` or deliberate `422`;
- unauthenticated/restricted challenge: existing `401` behavior;
- authenticated forbidden: `403`;
- non-enumerating missing/revoked/expired: `404`;
- intentional retired public path: `410`;
- stale/Row Version/review gate/busy/conflict: `409`;
- capacity/rate/admission: typed safe error and `Retry-After` where applicable;
- timeout/unavailable/operator misconfiguration: typed, actionable to an
  authorized operator, non-sensitive to public consumers;
- idempotent create replay: recorded `200` versus first `201` behavior.

Do not standardize status codes by changing public compatibility without a
verified defect and focused route tests.

## 11. Route And API Contract Audit

Build the authoritative method-plus-template inventory from the Fastify
OpenAPI document at the execution commit. Compare that exact set with
`ACCESS_ROUTE_COVERAGE_REGISTRY`, mutation Audit registrations, route tests,
and `docs/backend-route-inventory.md`. The path-family lists below define
required coverage; only blocks that spell out a method define a method
contract. Record every mismatch before editing.

### 11.1 Authenticated Site route family

Audit methods, schemas, status, permission, idempotency, Row Version, Audit,
Access, and tenant resolution for:

```text
/api/v1/projects/:project_id/versions/:version_slug/documentation-sites
<site>/edition
<site>/edition/lifecycle
<site>/pages
<site>/pages/:page_id
<site>/pages/:page_id/content
<site>/pages/:page_id/lifecycle
<site>/navigation
<site>/routing
<site>/snippets
<site>/snippets/:snippet_id
<site>/snippets/:snippet_id/content
<site>/snippets/:snippet_id/lifecycle
<site>/assets
<site>/assets/:asset_id
<site>/assets/:asset_id/file
<site>/assets/:asset_id/lifecycle
<site>/assets/capture/:asset_id/file
<site>/comments/:thread_id
<site>/comments/:thread_id/replies
<site>/pages/:page_id/comments
<site>/openapi/inspections
<site>/openapi/sources
<site>/openapi/source
<site>/openapi/source/export
<site>/openapi/source/lifecycle
<site>/openapi/try-it-policy
<site>/openapi/operations/:operation_key/try-it-configuration
<site>/openapi/operations/:operation_key/try-it-attempts
<site>/preview
<site>/revisions
<site>/revisions/:revision_number
<site>/publications
<site>/publish-links
<site>/publish-links/:link_id/revoke
<site>/publish-links/:link_id/entries/:entry_id/rollback
<site>/publish-links/:link_id/discovery-policy
<site>/publish-links/:link_id/try-it-policy
<site>/search
<site>/export/package.zip
<site>/pages/:page_id/export/markdown
<site>/artifact-publications
```

Here `<site>` means
`/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id`.
It is a prefix placeholder, not an independently registered Site-detail
endpoint. Compare the implementation with
`docs/backend-route-inventory.md`; do not infer a method from a path name.

### 11.2 Cross-Site and import routes

Audit:

```text
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/carry-forward
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/carry-forward-options
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id/apply
DELETE /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id
GET  /api/v1/projects/:project_id/versions/:version_slug/documentation-artifact-publications
```

### 11.3 Review routes

Audit:

```text
GET/PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-policy
GET       /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-candidates
GET       /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-gate
GET/POST  /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews
GET       /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id
POST      /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/decisions
POST      /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/cancel
GET       /api/v1/projects/:project_id/versions/:version_slug/documentation-review-inbox
PATCH     /api/v1/projects/:project_id/versions/:version_slug/documentation-review-inbox/:notification_id/read
GET       /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-publication-evidence
GET       /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-publication-evidence/:evidence_id
```

### 11.4 Organization operations

Audit:

```text
GET /api/v1/organization/documentation/operations
PUT /api/v1/organization/documentation/limits
POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/projections/rebuild
```

### 11.5 Public JSON and initial-document routes

Audit default and explicit-version forms:

```text
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/pages/*
GET      /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/search
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/operations/:operation_key
GET      /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/operations/:operation_key/try-it-configuration
POST     /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/operations/:operation_key/try-it-attempts
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/sitemap.xml
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/robots.txt
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/assets/:asset_id/file
GET/HEAD /api/v1/public/publish-links/:slug[/versions/:version_slug]/documentation/assets/capture/:asset_id/file
GET/HEAD /docs/:slug
GET/HEAD /docs/:slug/*
GET/HEAD /docs/:slug/operations/:operation_key
GET/HEAD /docs/:slug/versions/:version_slug
GET/HEAD /docs/:slug/versions/:version_slug/*
GET/HEAD /docs/:slug/versions/:version_slug/operations/:operation_key
```

Verify aliases `308`, intentional `410`, unavailable `404`, restricted
challenge/session, `Vary`, cache-control, ETag/`304` after access resolution,
canonical/noindex, CSP, initial bootstrap, and no private state.

### 11.6 Portal and public-reader routes

Audit the route parser, link builders, `App.tsx` ownership, deep-link refresh,
back/forward behavior, lazy loading, and unknown-route handling for:

```text
/organization/documentation
/projects/:project_id/versions/:version_slug/documentation
/projects/:project_id/versions/:version_slug/documentation/carry-forward
/projects/:project_id/versions/:version_slug/documentation/reviews
/projects/:project_id/versions/:version_slug/documentation/:site_id
/projects/:project_id/versions/:version_slug/documentation/:site_id/pages/:page_id
/projects/:project_id/versions/:version_slug/documentation/:site_id/preview
/projects/:project_id/versions/:version_slug/documentation/:site_id/revisions/:revision_number
/projects/:project_id/versions/:version_slug/documentation/:site_id/publications/:publication_sequence
/docs/:slug
/docs/:slug/*
/docs/:slug/versions/:version_slug
/docs/:slug/versions/:version_slug/*
```

The `/docs/*` browser route and the Fastify initial-document route intentionally
share the same external URL. Verify server-rendered initial content remains
usable before JavaScript and the client enhances it without changing canonical
identity, losing focus, or issuing an unnecessary duplicate logical read.

The Access coverage registry intentionally represents the OpenAPI-normalized
initial-document templates as `/api/v1/docs/*`, while Fastify serves the
external initial document at `/docs/*`. Audit both sides:

- OpenAPI route normalization and registry uniqueness must continue to pass;
- the actual `/docs/*` request must use the explicit initial-document Access
  Evidence writer and must not depend on a failed direct lookup of the
  normalized `/api/v1/docs/*` template;
- do not “fix” this dual representation by moving the public URL, adding a
  duplicate route, or recording the same logical read twice.

## 12. Behavior And Ownership Rules

### 12.1 Mutability and revisions

- Site identity remains stable.
- Edition/draft children are mutable only while effective lifecycle is active.
- mutable commands use expected Row Version where defined;
- manual checkpoint, Publication, and Carry-Forward are the only Revision
  triggers;
- preview, export, comment, search rebuild, and ordinary save create no
  Revision;
- Revision and Publication counters are server-owned, positive, scoped, and
  never reused;
- unchanged content may reuse a Revision while a new Publication sequence is
  created;
- immutable output never follows later draft mutation.

### 12.2 Publication and links

- prepare exact Revision, review gate, frozen policies, Assets/OpenAPI, and
  search projection before switching a live entry;
- failure, timeout, busy admission, or capacity must leave live pointer and old
  projection unchanged;
- rollback selects an existing exact immutable Publication;
- link-wide access applies across all selected versions;
- revoked/expired/restricted links fail closed and non-enumerating;
- one eligible explicit primary discovery link is canonical per stable Site;
- every other/ineligible link is noindex.

### 12.3 Content, assets, and portability

- executable HTML/JS/MDX/iframe content remains rejected;
- block kinds are exhaustive and bounded;
- internal links and operation references resolve to accepted typed targets;
- only referenced Snippets/Assets/OpenAPI/artifact Publications enter immutable
  output;
- protected Files cannot be purged while mutable/Revision/Publication
  references exist;
- import always inspects before apply and never overwrites a non-empty target;
- archives reject traversal, duplicates, bombs, unsafe names, links, and
  unbounded expansion;
- exports are deterministic, self-contained within the accepted format, and do
  not mutate state.

### 12.4 Carry-Forward and lifecycle

- source is one authorized exact Revision in the same Project;
- targets are selected complete Sites in one target Project Version;
- missing target Editions only; no overwrite;
- one atomic transaction and stable idempotent replay;
- new mutable graph identities; authorized protected File reuse;
- immediate provenance only; no live synchronization;
- archived parent state makes inherited children read-only while immutable
  public output remains available.

### 12.5 Review

- optional by default;
- policy belongs to Edition;
- requests target exact Revision;
- current membership/role/assignment/self-review rules are evaluated on
  decision;
- approvals invalidate according to accepted relevant changes;
- Publication and rollback evaluate the current gate;
- Admin override requires accepted confirmation/reason and freezes immutable
  evidence;
- reasons and private workflow are absent from public output.

### 12.6 Try It

- independently enabled at Site and Publish Link;
- exact immutable Revision descriptors and source digest;
- exact public HTTPS origin under operator/Admin authority;
- all-address uncached public DNS validation at policy/configuration time;
- restrictive shared CSP with matching server/web origin digest;
- browser performs request directly; server never proxies target traffic;
- credentials remain in component memory only;
- response/request evidence is bounded, redacted, content-free, and per attempt;
- descriptor-v0 references remain read-only.

### 12.7 Search and operations

- authorize before draft/public search load;
- draft projection contains authorized safe saved-draft fields;
- Publication projection is exact and immutable-generation selected;
- exact/prefix title, weighted heading/title/description/body, then path/Page ID
  with stable ties;
- literal `%` and `_`, 50-result limit, no comments/review/secrets;
- rebuild targets exact draft or Publication, preserves old selection on
  failure, and is Owner-only;
- Organization limits are nullable; hard ceilings always apply;
- lowering below usage blocks growth but not archive/export/rebuild/correction.

### 12.8 Temporary data and retention

- one-hour import-inspection expiry, actor binding, terminal parsed-payload
  clearing, and exact temporary source-File cleanup remain intact;
- cancellation, expiry, failed Apply, duplicate Inspect replay/conflict, and
  disconnected export paths clean only generated temporary/staged keys;
- bounded cleanup cross-checks database/File ownership before exact purge and
  never recursively deletes an unresolved prefix;
- imported authoritative Asset/OpenAPI Files follow protected-reference
  retention and are not treated as temporary;
- immutable Revision/Publication content and customer-owned Files have no
  automatic V1 retention purge;
- retained-byte/health reporting must not imply a deletion capability that V1
  does not provide.

## 13. Security And Permission Audit

### 13.1 Role matrix

| Capability                                   | Organization Owner     | Organization non-owner member          | Project Admin                   | Editor                              | Viewer                            | Public                       |
| -------------------------------------------- | ---------------------- | -------------------------------------- | ------------------------------- | ----------------------------------- | --------------------------------- | ---------------------------- |
| Read Organization Documentation operations   | yes                    | yes                                    | through Organization membership | through Organization membership     | through Organization membership   | no                           |
| Change Organization limits                   | yes                    | no                                     | only if also Owner              | no                                  | no                                | no                           |
| Rebuild search projection                    | yes                    | no                                     | only if also Owner              | no                                  | no                                | no                           |
| Manage Site/Edition administrative lifecycle | implicit Project Admin | only through a qualifying Project role | yes                             | only accepted non-admin actions     | no                                | no                           |
| Author Pages/content/navigation/comments     | implicit Project Admin | only through a qualifying Project role | yes                             | yes per accepted child policy       | no                                | no                           |
| Checkpoint/publish                           | implicit Project Admin | only through a qualifying Project role | yes                             | editor where current policy permits | no                                | no                           |
| Manage discovery primary link                | yes                    | no                                     | yes                             | no                                  | no                                | no                           |
| Manage review policy/override                | yes                    | only through a qualifying Project role | yes                             | request/assigned actions only       | assigned/read actions as accepted | no                           |
| Manage Site/Publish-Link Try-It policy       | yes                    | only through a qualifying Project role | yes                             | no                                  | no                                | no                           |
| Use internal enabled Try It                  | implicit Project Admin | only through a qualifying Project role | yes                             | yes                                 | read/use as shipped               | no                           |
| Use public Try It                            | link policy            | link policy                            | link policy                     | link policy                         | link policy                       | only enabled authorized link |
| Read public output                           | link policy            | link policy                            | link policy                     | link policy                         | link policy                       | link policy                  |

The server derives Organization role and Project access. UI visibility is not
authorization. A non-owner Organization membership alone does not confer a
Project capability. An active Organization Owner receives the accepted
implicit Project Admin authority; all other Project capabilities require
current Project membership and are recomputed where review/publication policy
requires it.

### 13.2 Threat matrix

Audit negative proof for:

- cross-tenant/parent ID substitution;
- stored/reflected XSS and bootstrap/script breakout;
- unsafe URL/protocol/host/canonical injection;
- SSRF/server proxy/private DNS/redirects;
- ZIP traversal/bomb/symlink/duplicate/confusable paths;
- malicious or remote-reference OpenAPI;
- draft/comment/review/search leakage;
- credential/header/body/query leakage in Audit/Access/logs/evidence;
- public route enumeration;
- cache/ETag access confusion;
- stale approval or policy;
- partial Publication/link switch;
- protected File breakage;
- quota/admission/parser/search DoS;
- dependency/supply-chain/license drift;
- backup/restore inconsistency.

For public negative tests, prove equivalent non-enumerating behavior rather than
asserting internal error text.

## 14. Audit And Access Evidence

Reconcile route registration with:

- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `packages/constants/src/audit.ts`
- `packages/constants/src/access.ts`
- `packages/audit-domain/**`.

Verify:

- every committed mutation emits the accepted Audit Event in the same
  transaction;
- failed mutations do not emit successful mutation Audit Events;
- meaningful allowed/denied logical reads have Access Evidence;
- aliases, initial HTML, bootstrap enhancement, and `304` do not produce
  duplicate/noisy logical evidence;
- public attempts record outcome without reader identity expansion;
- entity/root IDs resolve to authorized Organization/Project/Site/Revision;
- Page/Snippet/comment/OpenAPI/import/Try-It bodies, raw search queries,
  credentials, headers, passwords, viewer tokens, and File content are absent.

## 15. Concurrency, Idempotency, And Failure

Audit:

- Row Version stale conflicts preserve safe latest state and local UI copy;
- Navigation/routing/content/comment conflicts do not silently merge;
- Site/Edition path namespace mutations serialize;
- same-Edition Revision/Publication sequences serialize;
- publication admission is total/per-class bounded and unrelated Sites may
  progress;
- import apply and Carry-Forward are atomic and idempotent;
- review request/decision/cancel/notification operations replay safely;
- Publication/rollback review gate evaluation is transactionally current;
- search generation rebuild swaps atomically and old rows remain on failure;
- Organization limit first-write `expected_version: 0` has one winner;
- quota checks and growth mutation share lock/transaction;
- maintenance `--all-legacy` uses stable bounded keyset batches and stops on
  first failure;
- retries never duplicate immutable Publication/evidence/provenance.

## 16. Migration And Backwards Compatibility Rules

The closeout must preserve:

- all pre-`025` migrations unchanged;
- migrations `025`–`031` unchanged unless a historical file corruption is
  proven, in which case stop rather than editing it;
- additive upgrade path for any closure migration;
- existing public Guide/Demo Publish Links and link-wide password sessions;
- existing Capture Asset ownership/purge protection;
- existing Guide/Demo Revision/Publication and Carry-Forward behavior;
- extension capture/login/finalize/open-portal behavior;
- accepted default/version public URL shapes;
- descriptor-v0 Try-It references as read-only;
- package format/version discriminants and deterministic prior exports;
- existing Publications forever resolvable while their link policy permits;
- aliases/redirects/`gone` outcomes;
- strict request contracts unless a deliberate compatibility note and test
  proves an additive change.

No compatibility column may be removed. No retained immutable customer content
may be purged.

### 16.1 Deployment and environment compatibility

Audit parsing, bounds, diagnostics, documentation, and production-build parity
for the shipped configuration surface:

```text
OSSIE_DOCUMENTATION_HEAVY_WORK_CONCURRENCY
OSSIE_DOCUMENTATION_PUBLICATION_CONCURRENCY
OSSIE_DOCUMENTATION_PUBLICATION_TIMEOUT_MS
OSSIE_DOCUMENTATION_REBUILD_BATCH_SIZE
OSSIE_DOCUMENTATION_REBUILD_CONCURRENCY
OSSIE_DOCUMENTATION_INITIAL_HTML_MAX_BYTES
OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH
OSSIE_DOCUMENTATION_WEB_ASSET_BASE
OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS
OSSIE_DOCUMENTATION_TRY_IT_CONNECT_ORIGINS
OSSIE_DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MS
OSSIE_DOCUMENTATION_TRY_IT_WEB_ORIGIN_SET_DIGEST
```

Verify missing/invalid/unsafe production values fail or degrade exactly as
documented; origin values and filesystem secrets never enter public/operator
diagnostics. The server-computed Try-It origin-set digest and web-build digest
must report `match`, `mismatch`, or `unavailable` truthfully and explain reload
requirements without silently widening CSP. Preserve the reconciled child
`138` manifest and asset-base names; do not revive earlier draft names.

## 17. Current-Truth Documentation Audit

Synchronize facts, not aspirations:

- `CONTEXT.md`: shipped-through-child status, terms, relationships, ambiguity;
- Documentation decisions: feature matrix, implementation sequence, shipped
  review/Try-It/portability/operations boundaries;
- Master `006`: child `139` status, final closure checklist, child `140`
  remaining decision gate, verification counts, limitations;
- child plans: final status/checklists/evidence/leftovers only where stale;
- README/roadmap/summary/status: Product Documentation V1 availability and
  honest limitations;
- route inventory: exact authenticated/public/review/operations routes;
- self-hosting/operations/readiness: migrations, variables, CSP, assets,
  maintenance, limits, backup/restore;
- production checklist: deployment and smoke gates;
- docs app: links to current authoritative Markdown without becoming product
  runtime;
- portability format: only actual accepted v1 format;
- third-party notice: only actual package/license graph.

Do not mark Master `006` fully complete: child `140` remains required. Mark
Documentation V1 implementation complete through child `139` while leaving the
post-V1 decision gate open.

## 18. Test And Verification Strategy

### 18.1 Static and focused audits

Before broad tests:

- map every accepted decision to schema/contract/API/UI/test/evidence;
- compare actual Fastify route inventory with Access coverage and route docs;
- compare shared enums/schemas with migration checks and repository values;
- scan public projections for private fields;
- scan Audit/Access/logging for sensitive fields;
- compare the actual `/docs/*` initial-document routes, their normalized
  `/api/v1/docs/*` coverage entries, and explicit Access Evidence writes;
- compare every shipped Documentation environment variable with config parsing,
  production diagnostics, self-hosting/operations docs, and Vite/server CSP;
- inspect import expiry/cancellation/crash-orphan cleanup separately from the
  deliberately absent customer-content retention purge;
- scan package imports for Tiptap/Fumadocs/runtime authority drift;
- scan current docs for stale `reserved`, `provisional`, `through child 137`,
  `one Site only`, and first-slice-only claims;
- scan completed child checklists/status/log/verification/leftovers/handoff;
- scan commits and worktree ownership.

Suggested read-only commands:

```bash
git status --porcelain=v1
git diff --check
rg -n "Reserved|provisional|through child 137|one Site" \
  CONTEXT.md docs README.md apps/docs
rg -n "documentation" \
  apps/server/src/modules/access/access-coverage-registry.ts \
  apps/server/src/modules/audit/audit-coverage-registry.ts
rg -n "tiptap|fumadocs" package.json pnpm-lock.yaml apps packages
```

### 18.2 Focused package tests

Run at minimum:

```bash
pnpm --filter @repo/constants test
pnpm --filter @repo/types test
pnpm --filter @repo/documentation-domain test
pnpm --filter @repo/publish-domain test
pnpm --filter @repo/file-domain test
pnpm --filter @repo/audit-domain test
```

Add focused tests first for every repair.

### 18.3 Server and database

Run:

```bash
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server test:smoke
```

The DB matrix must include Documentation, Documentation operations, review,
Audit, Access, Publish, File/protection, Project Version, Guide/Demo
Carry-Forward, fixture, and foundation migration suites.

Use only the configured disposable test database for setup/reset/down/restore:

```bash
pnpm --filter server test:db:drop
pnpm --filter server test:setup
pnpm --filter server test:db
pnpm --filter server test:smoke
```

Resolve and record the database name before destructive commands. Do not copy
these commands into another environment blindly.

### 18.4 Web, docs, and extension

Run:

```bash
pnpm --filter web test
pnpm --filter docs test
pnpm --filter extension test
```

Focused web proof must cover routes, permissions, lifecycle/read-only,
conflicts, review, publishing/rollback, operations/recovery, public reader,
search, initial bootstrap, lazy chunks, and Try It.

### 18.5 Workspace

Run:

```bash
pnpm -r --if-present test
pnpm check-types
pnpm lint
pnpm build
git diff --check
```

Record exact package/file/test/task counts. Warnings must be classified
truthfully; do not label a warning-producing command warning-free.

### 18.6 Migration and recovery

Record:

- clean `001`–`031`;
- `024 -> 031` upgrade;
- `030 -> 031` upgrade;
- empty guarded `031` down/up;
- populated down refusal;
- reset/reseed;
- maintenance dry-run and disposable exact rebuild;
- custom-format PostgreSQL backup/isolated restore;
- protected Files and at least one exact public Publication after restore.

### 18.7 Dependency, lockfile, and license

Run:

```bash
pnpm audit --prod --audit-level high
pnpm licenses list --prod --json
pnpm install --frozen-lockfile
```

Verify:

- no unreviewed lockfile drift;
- no critical/high production advisory remains without an explicit disposition;
- Fumadocs/Tiptap are still absent unless a separate accepted decision exists;
- YAML/ZIP/OpenAPI/image/parser dependencies match actual adapters;
- Next/Vite/Fastify/security-sensitive package versions are compatible;
- notices match the actual production license graph;
- no generated install output is staged.

### 18.8 Performance

Record local lab evidence honestly:

- production web bundle/manifest sizes and lazy Documentation chunks;
- public initial HTML bytes and bounded fallback;
- public Page/search/operation response size/query ceiling;
- representative upper-bound editor/OpenAPI/import fixture behavior;
- local Chromium vitals for public Page and authenticated workbench;
- no claim of production p75 without production telemetry.

Regressions above accepted Plan `138` baselines require investigation or an
explicit, justified limitation.

## 19. Agent-Browser Validation Requirements

Use the installed `agent-browser` skill and repository fixture. Do not create a
custom browser harness. Puppeteer may support metrics/failure injection only
where already installed; agent-browser owns user-journey evidence.

Before browser work:

1. verify the disposable database name and migration head;
2. run the existing idempotent fixture entry point:

   ```bash
   pnpm --filter server seed:documentation-browser-fixture
   ```

3. start the existing Fastify and Vite applications using repository scripts
   and the same disposable fixture environment;
4. record the exact commands, environment profile names, bound URLs, and
   process IDs without copying environment values or credentials;
5. confirm the fixture contains the Owner/Admin, Editor/Viewer, public,
   restricted, lifecycle, review, Try-It, search, and failure states required
   below.

Do not seed the fixture into development/shared/staging/production. If the
existing fixture lacks one required accepted-V1 state, extend the fixture and
its unit/DB tests as a scoped test-evidence repair; do not create a parallel
harness.

Create:

- `docs/ui/139-documentation-v1-final-closeout-browser-evidence.md`;
- a minimal set of sanitized screenshots only when they materially prove a
  state not captured by text;
- no auth-state, trace, HAR, video, or temporary browser profile commit.

Record:

- commit and clean/dirty state;
- browser and agent-browser versions;
- server/web mode;
- synthetic fixture IDs and routes;
- viewport, zoom method, reduced-motion mode;
- actions, expected/actual state;
- network status only, never secret bodies;
- console/page errors;
- axe results/incomplete checks;
- screenshots;
- limitations.

### 19.1 Owner/Admin journey

Using the disposable Documentation fixture:

1. authenticate as Organization Owner/Project Admin;
2. open `/organization/documentation`;
3. read usage/nullable limits;
4. update a finite limit, trigger a stale version safely, restore expected
   state;
5. open Site library and create/use multiple Sites as fixture permits;
6. inspect Site versus Edition/Project Version context;
7. create/edit Page content, Navigation, routing, Snippet, Asset, OpenAPI;
8. inspect private comments and prove they are absent publicly;
9. create/reuse exact Revision;
10. run review policy/request/decision/gate/override state as applicable;
11. publish exact Revision, inspect Publication/link/discovery;
12. run Owner-only draft and exact-Publication search rebuild;
13. use enabled internal Try It without persisting credentials;
14. export draft/Revision/Publication/package/OpenAPI/Markdown;
15. archive/restore and verify inherited read-only explanation;
16. Carry-Forward exact Revision without overwrite;
17. publish a second Publication and rollback;
18. inspect success/conflict/error announcements and focus.

### 19.2 Editor/Viewer/non-owner journey

Verify:

- Editor sees only accepted authoring/publish/review actions;
- Viewer can read authorized draft/Revision/preview and shipped internal API
  reference behavior but cannot mutate;
- Organization non-owner may read operations but cannot change limits/rebuild;
- direct denied API attempts are `403`/non-enumerating as designed;
- Owner recovery control does not depend on project-access provenance;
- no hidden control is treated as server authorization;
- denied target IDs do not leak existence or content.

### 19.3 Public journey

Verify:

- default and explicit-version Site/Page;
- public and restricted-password access;
- wrong/missing password, revoked, expired, unknown;
- alias `308`, redirect, `gone` `410`;
- Page blocks, referenced Snippets/Assets/artifact Publications;
- operation deep link;
- Try It disabled/enabled/confirmation/safe report;
- canonical/social/language/robots;
- primary/non-primary/restricted sitemap and noindex;
- search title/body/path/Page ID and literal `%/_`;
- initial HTML before JavaScript and client enhancement without duplicate
  fetch/focus loss;
- ETag `200 -> 304`, then Publication switch/rollback invalidation;
- malicious metadata/content escaped;
- no comments/review/draft/policy/credentials/private search fields.

### 19.4 Accessibility and responsive matrix

Run Owner, Viewer, and public representative pages through:

- keyboard-only navigation and activation;
- skip link;
- visible focus and focus return;
- dialogs/drawers/tabs/menus;
- 200% zoom;
- 320 CSS-pixel reflow;
- desktop and narrow viewport;
- reduced motion;
- loading, empty, error, permission, stale conflict, and success status;
- semantic headings/landmarks/labels/status;
- accessibility-tree inspection for screen-reader names, descriptions,
  relationships, live regions, and status announcements;
- axe WCAG A/AA.

Use an installed screen reader when this headless environment exposes a
supported one. Otherwise record that capability boundary and retain concrete
accessibility-tree plus keyboard/name/status evidence; do not report an actual
screen-reader pass. Document incomplete manual color/contrast checks separately
from violations.

### 19.5 Failure injection

Use deterministic disposable seams:

- Page/Navigation stale conflict;
- import blocking issue and replay;
- Carry-Forward target already exists;
- review invalidation/gate block;
- Publication admission busy/capacity/timeout/preparation failure;
- projection rebuild failure;
- restricted/revoked link;
- Try-It disallowed/private/mismatch/CORS/network/timeout/response bound;
- missing/invalid Vite manifest startup;
- lazy chunk abort/retry;
- database readiness unavailable;
- missing protected File in isolated restore.

Prove safe recovery and unchanged authoritative state. Do not use timing guesses
or a shared environment.

### 19.6 Browser capability honesty

- Chromium is required.
- Firefox/WebKit run only when installed and supported.
- If unavailable, record the boundary; do not claim them.
- A clean console excludes expected Vite/React development informational logs
  only when explicitly classified.
- Browser evidence is not a substitute for server/DB permission and isolation
  tests.

## 20. TDD Repair Discipline

Any runtime defect fixed by this closeout follows:

1. failing smallest unit/contract test;
2. smallest policy/adapter repair;
3. focused green;
4. route/repository/DB integration proof where applicable;
5. web component proof where applicable;
6. agent-browser proof where user-visible;
7. broad security/tenant regression;
8. full matrix;
9. docs/finding/commit update.

Migration repairs require migration tests before SQL. Permission/public changes
require positive and negative tests. Do not implement a fix based only on a
manual browser observation.

## 21. Ordered Execution Plan

### Stage 1: Freeze and inventory

- record HEAD/worktree/owners/environment;
- inventory commits and changed files;
- confirm migration head and package graph;
- make no changes.

### Stage 2: Decision and child traceability

- complete the section 7 matrix;
- inspect all 32 grill answers;
- inspect ADRs/Context/decisions/master/children;
- list contradictions/findings;
- do not fix until classified.

### Stage 3: Static schema/contract/route/security audit

- run sections 9–16 read-only checks;
- reconcile route/Audit/Access inventories;
- inspect public projections and sensitive fields;
- classify findings.

### Stage 4: Focused verification

- run package/server/web/DB focused suites;
- reproduce each finding test-first;
- repair only accepted V1 defects;
- commit cohesive repairs.

### Stage 5: Clean migration and recovery

- reset the disposable test DB;
- run clean/upgrade/down-refusal/backup-restore proof;
- run maintenance/rebuild proof;
- record exact evidence.

### Stage 6: Broad regression

- run server DB/smoke, full package tests, web, docs, extension;
- run workspace type/lint/build;
- run dependency/license/frozen-lockfile review;
- repeat until clean.

### Stage 7: Browser dogfood

- seed synthetic fixture;
- run Owner/Admin, Editor/Viewer, public, accessibility, responsive, motion,
  failure, and performance matrices;
- repair scoped defects test-first;
- rerun focused and broad verification after each repair set.

### Stage 8: Current-truth synchronization

- update mandatory plan/master/Context/decision/evidence files;
- update only proven stale active docs;
- preserve completed plan history and accepted limitations;
- do not mark Master `006` complete before child `140`.

### Stage 9: Final repeat-until-clean audit

- re-run traceability, status/checklist, security, migration, verification,
  browser, current-doc, and commit-ownership scans;
- prove no unresolved S1/S2;
- confirm only owned scoped changes;
- complete child `139` status/checklist/log/verification/leftovers/handoff;
- commit docs separately from runtime fixes where cohesive.

## 22. Commit Strategy

Do not manufacture commits. Expected groups only when changes exist:

1. `fix(documentation): close <specific contract/server gap>`
2. `fix(web): close <specific portal/public gap>`
3. `test(documentation): strengthen final v1 regression proof`
4. `docs(documentation): synchronize v1 current truth`
5. `docs(documentation): close child 139`

Rules:

- commit only files owned in this child;
- stage explicit paths;
- inspect `git diff --cached --check` and `git diff --cached`;
- do not amend/rebase another agent's commits;
- do not commit generated output;
- lockfile changes accompany one reviewed dependency change;
- migration `032`, if unavoidable, has its own cohesive schema/runtime/test
  commit and updated rollback evidence;
- record every commit hash in the implementation log.

## 23. Explicit Non-Scope

Do not implement:

- child `140` candidates;
- Git/GitHub sync or repository authority;
- translations/localization workflow;
- custom domains/TLS;
- public feedback, comments, ratings, analytics, or reader identity;
- realtime collaboration/presence;
- offline merge;
- permanent deletion or automated customer-content retention;
- cross-artifact/Organization/semantic/vector search;
- scheduled publishing;
- durable Publication workers/queues;
- Redis/CDN/application cache;
- billing/metering/plans;
- page-level ACLs or external reviewer identity;
- server-side Try-It proxy;
- stored API environments/credentials;
- private-network/redirect/streaming/file Try-It;
- SDK generation;
- Video;
- arbitrary HTML/JS/MDX/React/iframe content;
- live remote OpenAPI authority;
- Tiptap/Fumadocs adoption;
- Next.js/router/editor platform replacement;
- PostgreSQL/File-storage replacement;
- extension Documentation authoring;
- compatibility-column removal;
- immutable content purge;
- production telemetry service.

Do not use final closeout to refactor large files, rename modules, normalize the
repository, upgrade unrelated dependencies, or improve visual design without a
reproduced V1 defect.

## 24. Exit Gate

Child `139` is complete only when:

- all accepted V1 decisions map to current schema/contracts/API/UI/tests/docs;
- children `132`–`138` have complete truthful status/checklist/implementation
  log/verification/leftovers/handoff;
- every 32-question grill answer remains accepted or a contradiction is
  resolved through authority precedence;
- clean install and required upgrade/down/refusal/reset/reseed/backup/restore
  proof passes;
- full server/DB/smoke/web/docs/extension/package/type/lint/build matrix passes;
- tenant isolation and permission matrices pass;
- Audit/Access evidence is complete and sensitive-field safe;
- exact immutable Revision/Publication, protected File, search, cache/ETag,
  review, Try-It, quota, and failure invariants pass;
- authenticated/public browser journeys pass;
- keyboard/focus/zoom/320px/reduced-motion/axe and accessibility-tree/
  screen-reader-capability proof is recorded;
- import temporary-data cleanup and the deliberately absent customer-content
  retention purge are both represented truthfully;
- every shipped Documentation environment variable is bounded, documented, and
  consistent across server/Vite/production diagnostics;
- local performance/bundle evidence is honest;
- dependency/license/lockfile review is complete;
- no unresolved S1/S2 remains;
- S3/S4 leftovers have owner/rationale/future location;
- active current-truth docs describe shipped V1 and limitations;
- Master `006` marks child `139` and V1 implementation complete but leaves
  child `140`/master final completion open;
- no rejected/deferred item is falsely claimed;
- worktree and commits contain only scoped owned changes;
- child `140` receives a stable decision baseline, not unfinished V1 work.

## 25. Implementation Checklist

### Expansion

- [x] Child `138` actual implementation and independent close-recheck read.
- [x] Master `006` child `139`, verification, completion, and handoff read.
- [x] Clean starting commit/worktree and migration head recorded.
- [x] Completed child closure anchors mapped.
- [x] Domain/schema/contracts/routes/UI/evidence/current-doc owners mapped.
- [x] Security, permission, migration, compatibility, verification, browser,
      non-scope, commit, and handoff requirements defined.
- [x] Independently recheck this expanded plan against current code and Master
      `006`.
- [x] Commit the docs-only plan checkpoint.

### Execution

- [x] Freeze HEAD/worktree/ownership/environment.
- [x] Complete decision-to-runtime traceability matrix.
- [x] Recheck all 32 grill answers.
- [x] Audit every child status/checklist/log/verification/leftover/handoff.
- [x] Audit migrations `025`–`031`, constraints, grants, immutability, Audit,
      Access, and rollback.
- [x] Audit shared contracts/domain/errors.
- [x] Audit authenticated/review/operations/public routes.
- [x] Audit web routes, permissions, authoring, review, publishing, reader,
      operations, and Try It.
- [x] Audit `/docs/*` runtime versus `/api/v1/docs/*` normalized coverage
      without duplicate Access Evidence.
- [x] Audit configuration names/bounds/diagnostics and temporary import/export
      cleanup/retention.
- [x] Audit security, tenant isolation, sensitive fields, protected Files,
      public projections, cache/ETag, and failure behavior.
- [x] Classify findings and repair accepted V1 gaps test-first.
- [x] Pass focused package/server/web/DB tests.
- [x] Pass clean/upgrade/down/refusal/reset/reseed/backup/restore proof.
- [x] Pass full server/DB/smoke/web/docs/extension/workspace matrix.
- [x] Pass dependency/license/frozen-lockfile review.
- [x] Complete representative agent-browser Owner/Viewer/public/
      accessibility evidence and retain deterministic failure proof in tests.
- [x] Record performance/bundle evidence honestly.
- [x] Repeat audit and verification until no unresolved S1/S2 remains.
- [x] Synchronize active current-truth docs.
- [x] Update this child and Master `006` only for proven completion.
- [x] Confirm child `140` remains decision-only.
- [x] Independently close-recheck the implemented child and repeat repair and
      verification until clean.
- [x] Commit only scoped owned work in logical commits.

## 26. Implementation Log

Implementation began from clean commit
`efffacb7a0113cb76c034f06639fd199a0a04c71` on branch `main`. The test
database was explicitly verified as disposable `ossie_test`; no other agent or
pre-existing worktree change was present.

Findings and dispositions:

- `DOC139-S2-001` — `migrate status` and historical upgrade baselines required
  current-head Audit guards before their owning migrations existed. A failing
  focused test first reproduced both the missing-table and already-existing
  table/future-command cases. Commits `6c3390a` and `a8a82d9` made historical
  baselines runnable; the independent close-recheck finding
  `DOC139-S2-004` below then tightened that compatibility behavior. Real
  status/upgrade proof passed at migrations `023`, `024`, `030`, and `031`.
- `DOC139-S2-002` — production audit reported nine high advisories through
  `fast-uri`, `ws`, `sharp`, and `postcss`. Commit `4756982` pinned patched
  compatible transitive versions. The `sharp` 0.35 export map then produced a
  compiler/runtime compatibility red: the first type bridge redirected `tsx`
  to a declaration file. Commit `6c63a19` replaced that bridge with a narrow
  server declaration matching the three used methods. Type-check, image
  integrity, fixture seed, runtime build, recursive tests, and production audit
  all pass.
- `DOC139-S2-003` — exact projection maintenance selected a `system` actor but
  dropped that actor type from rebuild Audit Event calls, so mutation mode
  failed closed. A new database test first reproduced the error. Commits
  `96d1878` and `7ff1e21` propagate `actor_type` through every unchanged/rebuilt
  draft/Publication path and verify content-free `System` evidence. Dry-run and
  exact-Publication mutation modes now pass.
- `DOC139-S2-004` — the pending-migration compatibility path introduced while
  resolving `DOC139-S2-001` omitted the whole current Audit guard registry.
  That allowed a historical baseline to report ready even when a guard on an
  already-installed table was missing. A failing unit regression reproduced
  the false-ready result. Commit `2ae1b3a` keeps guard name, table, operation,
  function, timing, constraint, entity, and tenant-mode checks for tables that
  exist at the historical baseline; only not-yet-installed tables and future
  command-list additions receive compatibility treatment. A real disposable
  migration-`024` proof rejected a removed
  `project_schema.project` update-context guard, while intact `024` and strict
  migration-`031` status both reported Audit ready.
- `DOC139-S3-001` — `CONTEXT.md`, Documentation decisions, and Master `006`
  still described child `137`/pre-runtime or unresolved adapter mechanics.
  Current-truth wording, the actual Ossie-native adapter decision, migration
  head, V1 verification state, and child `140` boundary were synchronized;
  current-truth and browser evidence commit: `2178fae`.
- `DOC139-S3-002` — database/smoke workflows emit the existing `pg` warning
  that overlapping `client.query()` calls will be removed in pg 9. It does not
  fail or weaken current pg 8 behavior. It remains an explicit dependency-
  upgrade compatibility owner rather than a false warning-free claim.

Recovery proof used only explicit disposable targets:

- clean migration `001`–`031`;
- upgrade `024 -> 031` and `030 -> 031`;
- empty guarded `031` down/up;
- populated `031` rollback refusal with head/audit state preserved;
- reset and idempotent Documentation fixture reseed;
- custom-format dump restored into `ossie_test_restore_139`, where 31
  migrations, two Site Publications, one selected Documentation public entry,
  and one protected Documentation File reference were verified before the
  restore database and dump were removed.

Browser proof used the existing fixture, Fastify/Vite entry points, agent-
browser `0.33.1`, and Headless Chrome `151.0.0.0`. Detailed sanitized results
are in
`docs/ui/139-documentation-v1-final-closeout-browser-evidence.md`. No custom
harness, auth state, credential, HAR, trace, video, browser profile, generated
build output, or unrelated file was committed.

## 27. Verification Record

Expansion verification on 2026-07-31:

- confirmed clean baseline
  `f9ac6666977aea935c172ed4a8ae8cb0138a549c`;
- confirmed migration head `031`;
- confirmed children `132`–`138` report completed/close-rechecked status;
- inspected Master `006` domain, architecture, authorization, evidence,
  security, concurrency, verification, child `139`, completion, and handoff;
- inspected child `138` final implementation/close-recheck evidence and
  leftovers;
- mapped migrations `025`–`031`, shared Documentation schemas/policies,
  Documentation/review/operations/public route families, web surfaces, Audit/
  Access registries, current-truth docs, and browser evidence;
- identified stale current-truth wording in Master `006` and `CONTEXT.md` for
  child `138`/`139` execution ownership;
- changed only this child-plan file;
- did not run runtime tests, migrations, browser journeys, dependency changes,
  or runtime implementation during expansion.

Independent implementation-readiness recheck on 2026-07-31:

- reconciled Master `006` child `139`, verification matrix, final checklist,
  completion criteria, and child `140` boundary against the completed child
  `138` implementation/close-recheck record;
- expanded ADR authority from `0027`–`0033` to all relevant accepted
  foundational and Documentation ADRs `0021`–`0033`;
- recorded the child `138` runtime close-recheck chain, including the final
  workspace-lint repair, instead of treating plan-record commits as the whole
  implementation;
- added the missing import-inspection `DELETE` contract, exact portal/public
  route ownership, and the intentionally dual `/docs/*` runtime versus
  `/api/v1/docs/*` OpenAPI/Access-registry representation;
- separated bounded temporary import/export cleanup from the intentionally
  absent customer-content retention purge;
- enumerated all shipped Documentation environment/configuration contracts and
  their server/Vite/diagnostic compatibility obligations;
- clarified Organization Owner, Organization member, and Project-role
  authority without treating UI visibility as authorization;
- made browser setup reuse the existing idempotent Documentation fixture and
  prohibited a parallel harness or non-disposable seed target;
- closed the Master accessibility gap with accessibility-tree and
  screen-reader-capability evidence, while prohibiting a false assistive-
  technology pass when this headless environment lacks one;
- verified every explicitly named plan, ADR, current-truth document, contract
  owner, and commit anchor exists;
- passed Prettier and `git diff --check`;
- changed no runtime, schema, migration, dependency, or generated file.

Implementation verification rerun on 2026-07-31:

- migration status at `023`: 23 executed / 8 pending / Audit ready; at `024`:
  24 / 7 / ready; at `031`: 31 / 0 / ready;
- populated `031` rollback exited nonzero with the intended refusal and left
  31 executed / 0 pending / Audit ready;
- isolated restore verification returned `[31, 2, 1, 1]` for migration count,
  Site Publications, selected Documentation link entries, and protected
  Documentation Files;
- focused migration verification: 2 files / 13 tests;
- shared packages: constants 1/10, strict types 18/95, Documentation domain
  19/50, Publish domain 4/14, File domain 2/10, Audit domain 6/49;
- recursive workspace tests passed all 16 packages, including server 126
  files / 547 tests, web 83/442, docs 4/12, extension 19/140, and the remaining
  domain/UI packages;
- complete database suite: 24 files / 88 tests; V1 smoke: 1 file / 2 tests;
- all 13 workspace type-check tasks and all 13 build tasks passed;
- workspace lint passed its configured gate with 89 existing server warnings
  (including explicit-any/control-regex/unused-variable debt), not
  warning-free;
- `pnpm audit --prod --audit-level high` reports no known vulnerabilities;
  production license graph was reviewed; frozen-lockfile install passed;
- production build measured the Site editor at 51.26 kB raw / 13.66 kB gzip
  and lazy API request experience at 130.58 kB / 32.73 kB;
- Chromium Owner operations/editor, Viewer editor, and public reader axe runs
  reported zero WCAG A/AA violations; the Owner editor retained one honest
  color-contrast incomplete check for two obscured textareas;
- public `320px` reflow, reduced motion, search, initial HTML, ETag `304`,
  alias/redirect `308`, gone `410`, operation `200`, and no private-term
  projection passed;
- local public vitals were TTFB 3.5 ms, FCP 292 ms, LCP 828 ms, and CLS 0.01;
  these are lab measurements, not production p75;
- static scans found no Tiptap/Fumadocs dependency, reconciled all
  Documentation configuration names with config/diagnostic/operator owners,
  and confirmed the complete Documentation implementation ledger from
  `6be45d7^` through the runtime closeout;
- projection maintenance dry-run reported two draft candidates without
  identifiers/content, and exact-Publication mode processed one Publication
  with system Audit Evidence;
- `git diff --check` passed and only explicitly staged child-owned files were
  committed.

Independent implemented-work close-recheck on 2026-07-31:

- reread child `139`, Master `006`, the shipped child `138` handoff, current
  migration verifier, Audit coverage registry, current-truth records, and the
  existing sanitized browser evidence;
- confirmed that all 32 accepted grill answers remain represented by the
  shipped traceability matrix and that every completed child `132`–`139`
  retains status, checklist, implementation, verification, leftovers, and
  handoff records;
- reproduced `DOC139-S2-004` red before implementation: the historical
  verifier returned ready after its expected guard registry had been emptied;
- passed the focused Audit verifier suite: 1 file / 11 tests;
- built a fresh disposable migration-`024` database and confirmed 24 executed /
  7 pending / Audit ready, then removed the existing
  `project_u_audit_ctx` trigger and confirmed `migrate status` failed with
  `guard:project_schema.project:UPDATE`;
- rebuilt the disposable test database from migration `001` through `031` and
  confirmed 31 executed / 0 pending / Audit ready;
- passed the full server unit suite: 126 files / 547 tests;
- passed the full PostgreSQL suite: 24 files / 88 tests; the already-recorded
  pg-9 overlapping-query deprecation warning remains unchanged;
- passed V1 PostgreSQL smoke: 1 file / 2 tests, and repository docs tests:
  4 files / 12 tests;
- passed all 13 workspace type-check tasks and `git diff --check`;
- no browser-visible behavior changed, so the existing child-`139` Headless
  Chrome evidence remains authoritative and no duplicate browser run or custom
  harness was created;
- the audit repeated clean after the repair: no unresolved S1/S2, migration,
  schema, API, UI, security, permission, compatibility, or documentation
  contradiction remains in child `139` scope.

## 28. Leftovers And Handoff To Child 140

The accepted limitations in section 5.3 remain truthful. No unresolved S1/S2
was found.

Additional accepted closure limitations:

- `pg` 8 emits a future pg 9 overlapping-query deprecation warning in database
  fixture/smoke paths; owner: server dependency-upgrade work;
- workspace lint is green under its existing configuration but reports 89
  server warnings; owner: scoped server type/lint debt, not child `140`;
- Chromium is the only locally proven browser and no supported installed screen
  reader was available; Firefox/WebKit and real assistive-technology validation
  remain capability-owned;
- one axe color-contrast rule was incomplete on two editor textareas because
  their background was partially obscured; no violation was reported and
  focused contrast tests pass;
- in-process admission/rate limiting, synchronous publication, local File
  storage, manual customer-content retention, and absence of production p75
  telemetry remain the previously accepted operational boundaries.

Child `140` may begin only with:

- final accepted decision/runtime traceability;
- zero unresolved S1/S2;
- exact migration/schema/API/UI state;
- complete current-truth docs;
- final test/migration/browser/performance/security/dependency evidence;
- owned commit ledger;
- explicit supported-browser and production-telemetry limits;
- confirmed deferred/rejected feature matrix;
- candidate questions supported by shipped-V1 evidence.

Child `140` is a decision gate. It may accept, defer, or reject future scope; it
must not be used to finish a missing child `139` repair or silently implement a
candidate.
