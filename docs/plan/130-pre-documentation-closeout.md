# Child Plan 130: Pre-Documentation Closeout

Date reserved: 2026-07-12

Date expanded: 2026-07-29

Date rechecked: 2026-07-29

Date implemented: 2026-07-29

Status: Complete. The closeout audit, active-documentation synchronization,
clean-database rehearsal, full automated verification, Chromium browser
dogfood, and real installed-toolbar Capture passed. No S1/S2 finding remains,
and child `131` is ready to begin as a documentation-only domain grill.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Predecessor:

- `docs/plan/129-accessibility-motion-performance-and-browser-dogfood.md`

Next child:

- `docs/plan/131-documentation-domain-grill.md`

## Sequence Gate And Starting Checkpoint

Children `109` through `129` are recorded complete. The last completed
cross-product audit is child `129`, whose close-previous documentation
checkpoint is commit `b46c885`. At expansion time:

- child `129` reports no open critical or high-impact runtime repair;
- its final web production build is `468.99 kB` raw / `130.54 kB` gzip
  JavaScript and `73.94 kB` raw / `14.29 kB` gzip CSS;
- its extension build remains at the accepted child `126` close-previous
  baseline: popup JavaScript `256.13 kB` raw / `78.20 kB` gzip, popup CSS
  `16.20 kB` raw / `4.24 kB` gzip, background entry `10.10 kB` raw /
  `2.92 kB` gzip, shared Capture-command chunk `9.81 kB` raw / `2.44 kB`
  gzip, and content script `3.12 kB` raw / `1.33 kB` gzip;
- its web, extension, server, selected PostgreSQL integration, V1 smoke,
  type-check, lint, build, Chromium accessibility, responsive, motion,
  performance, and installed-toolbar checks passed;
- Firefox, WebKit, and Safari remain honestly unverified because no supported
  executable is installed;
- layered Guide/Demo Textarea contrast remains an axe indeterminate result with
  a recorded manual pass;
- comparable forced-GC heap and listener/timer metrics remain unavailable in
  the current browser tool surface;
- native modal background isolation, exact opener focus restoration, stable
  post-mutation focus fallback, and truthful mutation-versus-refresh status are
  accepted behavior that this closeout must preserve.

Before implementation, record:

```bash
git status --short --branch
git rev-parse HEAD
git log --oneline --decorate -12
```

Do not assume the expansion checkpoint is still HEAD. Reconcile later commits
and pre-existing worktree changes before writing. User or agent changes already
present in the worktree are outside this child's ownership unless they are
explicitly adopted and recorded.

The expansion worktree is based on local `main` at `b46c885`; local and
`origin/main` are diverged after common commit `ba2099d`. Local commit
`fa15378` and remote commit `3e821a9` have the same publication-modal subject
but materially different diffs, and only the local result is followed by the
Phase `129` closeout record at `b46c885`. Do not describe those commits as
equivalent or silently pull, merge, rebase, cherry-pick, or rewrite history.
This Phase `130` plan uses the verified local result as its baseline. If remote
synchronization is requested later, preserve the local modal/focus/status
behavior through an explicit conflict review and rerun the focused publishing
tests plus affected child `129` browser checks before resuming closeout.

## Goal

Prove that the implemented Project Version, Capture, Guide, Interactive Demo,
Revision, Publication, permission, audit/access, and modernized UI foundation
is internally consistent and stable enough to begin the Documentation-domain
grill without carrying hidden foundation defects or stale documentation into
the design discussion.

This is a closure and truth-synchronization phase. It is not a feature phase.
The expected implementation consists of audit evidence and documentation
corrections. Runtime defects found here are classified and routed to their
owning completed child or a separately accepted repair plan.

## Completion Criteria

Child `130` is complete only when all of the following are true:

1. Every child from `109` through `129` has been checked against its recorded
   acceptance criteria, verification record, leftovers, and actual repository
   state; a checked status is not accepted as evidence by itself.
2. Current-state documentation accurately describes the shipped foundation and
   clearly separates it from the unimplemented Documentation and Video
   directions.
3. Project creation still transactionally creates one active Default Project
   Version named `Main`; Capture Sessions are Project Version-scoped; Guide and
   Interactive Demo Artifacts use one Edition per Project Version, mutable
   Working Drafts, immutable Revisions, and revision-backed Publications.
4. Row Version, Artifact Revision Number, Project Version, and Publication
   Sequence remain distinct in schema, contracts, UI copy, and documentation.
5. authorization, tenant isolation, archive/read-only behavior, Audit/Access
   Evidence, protected Asset rules, and public-link access behavior pass their
   existing automated and browser checks.
6. a disposable empty database has been created, runtime-role privileges
   provisioned, migrations `001` through `024` applied, deterministic fixtures
   seeded, and the full V1 smoke flow completed.
7. migration status is clean and the documented down/up rehearsal is performed
   only against a disposable database, with limitations recorded.
8. non-DB tests, selected DB integration tests, smoke, type-check, lint,
   formatting/whitespace, and production builds pass from the final tree.
9. Chromium browser validation covers the connected authenticated, public,
   responsive, reduced-motion, accessibility, and installed-extension journeys
   defined below, with safe synthetic evidence.
10. no customer-authored Product Documentation or Video route, navigation item,
    database table, migration, package, permission, shared contract, or
    placeholder runtime component has been introduced. The existing development
    Scalar API reference at `/documentation` and the repository Docs App are
    not Product Documentation surfaces.
11. every limitation has a severity, owner, disposition, and explicit decision
    on whether it blocks child `131`.
12. no unresolved severity-one or severity-two finding remains; the final
    report, this child, and the parent master agree on the outcome.

## Canonical Constraints

The implementation must preserve:

- `CONTEXT.md` product language and relationships;
- ADRs `0001` through `0026`, especially `0002`-`0006`, `0011`-`0012`,
  `0014`-`0020`, and `0021`-`0026`;
- stable Artifact identity with type-specific Guide and Interactive Demo
  models;
- Project Versions as release contexts, never audiences, environments,
  semantic-version components, or moving `latest` aliases;
- Edition-owned title, description, lifecycle, and Working Draft;
- `version` as an internal optimistic-concurrency Row Version where currently
  accepted, never a user-facing Artifact Revision or Project Version label;
- relational persisted product state and revision-backed Publications rather
  than generic JSON snapshots;
- append-only Audit Events/Audit Change Items and separate Access Events;
- Project Membership inheritance across all Project Versions;
- Capture source immutability and protected shared Asset resolution;
- immutable Published Artifacts and independently configured multi-version
  Publish Links;
- the Quiet Versioned Workbench and WCAG 2.2 AA target in `PRODUCT.md` and
  `DESIGN.md`;
- the distinction between the repository documentation app under `apps/docs`
  and the future customer-authored Product Documentation domain;
- Video as unmodeled, deferred product direction;
- the stable technical names, migration filenames/history, public URLs, cookie,
  environment, storage, and package compatibility boundaries recorded in
  `docs/rename-compatibility-checklist.md`.

If current code contradicts an accepted durable decision, stop and classify the
contradiction. Do not rewrite an ADR or normalize the contradiction as
documentation truth merely to make the closeout pass.

## Current Implemented System Map

```text
self-hosted setup / authentication
  -> Organization + Project Membership
    -> Project
      -> active Default Project Version ("Main")
      -> ordered active/archived Project Versions + permanent slug aliases
        -> version-owned Capture Sessions / Events / Assets
        -> Guide Artifact -> Edition -> Working Draft / Revisions
        -> Interactive Demo Artifact -> Edition -> Working Draft / Revisions
          -> revision-backed Published Artifacts
          -> independent multi-version Publish Link manifests
  -> append-only mutation Audit Evidence
  -> append-only protected/public Access Evidence
  -> Owner compliance / Project Admin compliance / Editor activity
```

Runtime ownership is:

- `apps/server`: Fastify REST API, PostgreSQL adapters, audit/access guards,
  authorization, local file storage, fixtures, migrations, and smoke tests;
- `apps/web`: React/Vite setup, portal, workbenches, readers, and embeds;
- `apps/extension`: React/Vite Manifest V3 Chromium Capture client;
- `apps/docs`: repository/contributor/operator documentation hub, not Product
  Documentation;
- `packages/types`: shared public Zod DTO contracts;
- `packages/constants`: shared contract-significant enums/constants;
- domain packages: framework-independent Capture, Guide, Demo, Publish, File,
  and Audit business rules;
- `packages/ui`: shared UI primitives and design tokens.

## Severity Rubric And Disposition Rules

Classify every finding before changing anything:

| Severity    | Definition                                                                                                                                                                                                 | Child `130` disposition                                                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 critical | cross-tenant exposure, authorization bypass, secret/content leakage, irreversible data loss/corruption, invalid Publication content, or an unusable critical workflow with no safe workaround              | Blocks `130` and `131`. Stop broad closeout, preserve evidence, and reopen the owning child or obtain approval for a dedicated repair plan.                                                               |
| S2 high     | repeatable failure of a required foundation invariant or primary setup/Capture/Guide/Demo/publish workflow; broken migration/reset; serious keyboard, modal, responsive, or installed-extension regression | Blocks `130` and `131`. Route to the owning child/accepted repair plan, repair and fully reverify there, then restart the affected closeout matrix.                                                       |
| S3 moderate | material documentation drift, incomplete evidence, misleading state copy, isolated non-critical accessibility/operational defect, or a workflow problem with a safe workaround                             | Documentation/evidence drift is in scope here. Runtime repair requires an explicit plan amendment and owner; otherwise record it as a blocking/non-blocking follow-up based on Documentation-path impact. |
| S4 low      | cosmetic inconsistency, historical-evidence issue, or optional tooling/measurement improvement that does not misstate behavior or impair a required workflow                                               | Record with an owner and rationale. Fix only when it is documentation-only, trivial, and within the exact write set.                                                                                      |

Severity is based on impact and exploitability, not fix size. A blocked secondary
browser or unavailable forced-GC metric is a documented environment limitation,
not automatically a product defect. A known limitation may be non-blocking only
when it does not undermine a child `131` premise and has an explicit owner.

## Scope

### In scope

- acceptance/evidence audit of children `109` through `129`;
- repository-wide documentation truth and terminology audit;
- correction of stale current-state repository docs and `apps/docs` copy/tests;
- route, contract, schema, migration, package, permission, and UI inventory
  comparison against current runtime;
- clean disposable-database creation, migration, reset/reseed, DB integration,
  and smoke verification;
- existing full test/type/lint/build/format/whitespace verification;
- current Chromium portal/public/extension browser regression evidence;
- accessibility, keyboard/focus/modal, reduced-motion, responsive/reflow, and
  targeted production-performance confirmation against child `129`;
- absence checks for premature Product Documentation and Video runtime work;
- a dated closeout report and explicit child `131` grill-entry decision.

### Explicit non-scope

- Product Documentation domain decisions, terminology, schema, routes,
  packages, editor/reader UI, navigation, search, or publication behavior;
- Video tables, routes, recording, transcoding, playback, permissions,
  navigation, or UI;
- new product behavior, API contracts, migrations, dependencies, UI direction,
  browser harnesses, CI workflows, or deployment architecture;
- changing Project Version, Edition, Revision, Publication, Carry-Forward,
  Publish Link, Capture immutability, Asset protection, or access semantics;
- rewriting accepted ADRs, migration history, or historical child evidence to
  hide prior state;
- refreshing historical screenshots merely for visual consistency;
- production database reset, destructive migration rehearsal, production data
  backfill, storage deletion, or retained-evidence deletion;
- claiming Firefox/WebKit/Safari support without actually running those engines;
- introducing Puppeteer/Playwright or another browser library as a repository
  dependency; use the installed `agent-browser` workflow and the already proven
  temporary environment automation for the installed toolbar;
- the deferred overnight runner, analytics, AI, HTML replay, localization,
  custom domains, or other master-plan non-goals.

## Exact File Ownership

### Required closeout files

- `docs/plan/130-pre-documentation-closeout.md`
- `docs/pre-documentation-closeout.md` (new dated command/result, issue, and
  handoff report)
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  (status/checklist/immediate-next-action only after the gate passes)

### Current-state documentation audit and correction set

Inspect every file below. Modify only when a concrete current-truth,
terminology, command, route, security, compatibility, or status mismatch is
recorded in the closeout report:

- `README.md`
- `CONTEXT.md`
- `PRODUCT.md`
- `DESIGN.md`
- `AGENTS.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/product-idea.md`
- `docs/product-naming.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/oss-alpha-summary.md`
- `docs/system-design-pattern.md`
- `docs/backend-route-inventory.md`
- `docs/development-setup.md`
- `docs/self-hosting.md`
- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `docs/v1-dogfood-smoke-suite.md`
- `docs/contributor-guide.md`
- `docs/agent-workflow.md`
- `docs/rename-compatibility-checklist.md`
- `docs/brand/README.md`
- `apps/server/src/db/README.md`
- `apps/web/README.md`
- `apps/extension/README.md`
- `apps/docs/README.md`
- `apps/docs/app/docs-content.ts`
- `apps/docs/app/docs-content.test.ts`

`apps/docs/app/docs-content.ts` is expected to need a truth-band correction: at
expansion it still says Master Plan `005` is implemented only through the
Publication foundation and that UI modernization remains planned. Update its
test with the copy in the same commit. This is repository-documentation copy,
not Product Documentation runtime implementation.

### Decision and predecessor records: read-only verification inputs

- `docs/adr/0001-*.md` through `docs/adr/0026-*.md`
- `docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md`
- `docs/plan/109-agent-skills-and-repository-workflow.md`
- `docs/plan/110-product-umbrella-naming-and-documentation-truth.md`
- `docs/plan/111-project-version-and-artifact-edition-grill.md`
- `docs/plan/112-audit-evidence-core.md`
- `docs/plan/113-existing-mutation-audit-coverage.md`
- `docs/plan/114-access-evidence-and-compliance-timelines.md`
- `docs/plan/115-project-membership-foundation.md`
- `docs/plan/116-project-version-foundation.md`
- `docs/plan/117-capture-source-version-scoping.md`
- `docs/plan/118-guide-demo-edition-working-draft-relational-foundation.md`
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`
- `docs/plan/121-design-system-foundation.md`
- `docs/plan/122-portal-architecture-and-application-shell.md`
- `docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
- `docs/plan/124-project-version-and-library-ui-modernization.md`
- `docs/plan/125-capture-portal-ui-modernization.md`
- `docs/plan/125-01-capture-portal-browser-fixture.md`
- `docs/plan/126-extension-ui-modernization.md`
- `docs/plan/127-guide-authoring-and-reader-ui-modernization.md`
- `docs/plan/128-interactive-demo-authoring-and-viewer-ui-modernization.md`
- `docs/plan/129-accessibility-motion-performance-and-browser-dogfood.md`
- `docs/ui/121-current-ui-inventory.md`
- `docs/ui/122-portal-shell-baseline.md`
- `docs/ui/123-auth-setup-organization-browser-evidence.md`
- `docs/ui/124-project-version-library-browser-evidence.md`
- `docs/ui/125-capture-portal-browser-evidence.md`
- `docs/ui/126-extension-ui-browser-evidence.md`
- `docs/ui/127-guide-authoring-and-reader-ui-browser-evidence.md`
- `docs/ui/128-interactive-demo-authoring-and-viewer-ui-browser-evidence.md`
- `docs/ui/129-accessibility-motion-performance-browser-dogfood.md`

Historical plans, grills, ADRs, and evidence describe decisions or results at a
point in time. Correct an active current-state document instead of retroactively
editing history. Amend a predecessor only if its own claimed final evidence is
factually wrong, and record why.

### Known active-documentation drift to assign

The expansion audit already found the following stale active claims. Treat
these as required review items rather than rediscovering them late:

- `README.md`, `docs/oss-alpha-summary.md`,
  `docs/project-zoomout-status.md`, `docs/roadmap.md`, and
  `apps/extension/README.md` still describe true toolbar-popup validation
  and/or the direct-page Event-ordering repair as pending, although children
  `126` and `129` closed both with a real unpacked toolbar Capture;
- `README.md`, `docs/project-zoomout-status.md`, `docs/roadmap.md`, and
  `apps/docs/app/docs-content.ts` still describe the track as implemented only
  through child `120` or UI children `121`-`129` as planned;
- `docs/product-idea.md`, `docs/system-design-pattern.md`,
  `docs/contributor-guide.md`, and `apps/docs/README.md` still describe the
  completed UI modernization or already-shipped Project Version/Edition/
  Revision/Publication foundation as future-only language;
- `apps/docs/app/docs-content.ts` repeats the obsolete extension limitation in
  `knownLimitations`;
- `apps/web/README.md` is unrelated create-next-app boilerplate even though
  `apps/web` is the React/Vite portal.

Correct these active files and their directly coupled tests. Preserve dated
historical statements inside `docs/v1-dogfood-smoke-suite.md`, predecessor
plans, and browser evidence as historical evidence; if an active summary in a
historical record needs clarification, append a dated supersession note rather
than rewriting the original result. Review screenshot captions and links
independently from whether the image itself is historical.

`CONTEXT.md` may receive only a factual wording correction that follows an
already accepted term or relationship. Any new Documentation term,
relationship, or durable product decision belongs to child `131`, not this
cleanup.

### Workflow, CI, and screenshot audit inputs

The child `109` recheck must also inspect these repository-owned procedural
surfaces without modifying them unless a concrete documentation-only defect is
first added to this plan:

- `.agents/skills/model-ossie-domain/`
- `.agents/skills/build-ossie-slice/`
- `.agents/skills/design-ossie-ui/`
- `.agents/skills/dogfood-ossie/`
- reviewed external skills under `.agents/skills/`
- `.github/workflows/ci.yml`
- `package.json`
- `turbo.json`
- `pnpm-workspace.yaml`

Confirm that skills remain optional, portable, attributable, removable without
breaking the product, and consistent with `AGENTS.md`. Compare the documented
verification sequence with CI, including CI's separate clean-database DB and
smoke cycles.

The master explicitly requires screenshot drift review. Inspect, without
mechanical refresh:

- `docs/assets/alpha/`
- `docs/brand/`
- existing evidence directories `docs/ui/evidence/122/` through
  `docs/ui/evidence/128/`
- child `121` inventory/direction documents and child `129`'s evidence report,
  which did not commit a separate screenshot directory

Check that every active link exists, captions/alt text identify the represented
state truthfully, historical branding is labeled, and no screenshot is used as
proof of behavior superseded by later evidence.

### Optional safe browser evidence

- `docs/ui/evidence/130/` may be created only for selected synthetic screenshots
  that materially prove the final gate or a repaired documentation-app state.
- Temporary profiles, cookies, tokens, videos, HAR files, console dumps, and
  screenshots containing secrets or captured customer data stay outside the
  repository and are deleted after use.

### Runtime and schema files are verification-only

The following areas may be read and exercised but are not writable under this
plan:

- `apps/server/src/**`
- `apps/web/src/**`
- `apps/extension/src/**`
- `packages/**`
- `apps/server/src/db/migrations/001_*.sql` through `024_*.sql`
- root and workspace `package.json` files and `pnpm-lock.yaml`

If a runtime, schema, contract, fixture, or package change is necessary, stop,
add the exact file and owning predecessor to this plan, obtain the appropriate
scope decision, and implement it as a separately attributable repair before
resuming closeout. Do not smuggle product implementation into a documentation
commit.

## Routes And API Contracts

Phase `130` adds, removes, or changes no route or API contract. Audit the
following existing route families against `apps/web/src/lib/routes.ts`,
`apps/web/src/App.tsx`, `apps/server/src/app.ts`, module route files,
`docs/backend-route-inventory.md`, and shared schemas.

### Web route families

- entry: `/login`, `/setup`, `/projects`;
- Organization: `/organization/members`, `/organization/compliance`,
  `/invites/:token`;
- Project: `/projects/:project_id`, `/projects/:project_id/settings`,
  `/projects/:project_id/compliance`, `/projects/:project_id/activity`;
- canonical version context:
  `/projects/:project_id/versions/:version_slug`;
- Carry-Forward:
  `/projects/:project_id/versions/:version_slug/carry-forward`;
- version-scoped Capture:
  `/projects/:project_id/versions/:version_slug/capture-sessions[/...]`;
- version-scoped Guide:
  `/projects/:project_id/versions/:version_slug/guides[/...]`, including
  preview, Revision history, and Revision preview;
- version-scoped Interactive Demo:
  `/projects/:project_id/versions/:version_slug/interactive-demos[/...]`,
  including preview, Revision history, and Revision preview;
- public Guide reader/embed:
  `/p/:slug`, `/p/:slug/embed`,
  `/p/:slug/versions/:version_slug[/embed]`;
- public Demo reader/embed:
  `/d/:slug`, `/d/:slug/embed`,
  `/d/:slug/versions/:version_slug[/embed]`;
- development-only design review: `/__design-system`.

Legacy versionless authenticated Capture/Guide/Demo paths may exist only as
documented compatibility redirects into the Default Project Version. They must
not become a second ownership model or a `/latest` alias.

### API route families

- operational: `GET /healthz`, `GET /readyz`;
- public instance/setup/authentication and Organization member/invite routes;
- `/api/v1/projects*`, Project Membership, Project Activity, and Project/
  Organization compliance routes;
- `/api/v1/projects/:project_id/versions*`, including resolve, order,
  default, archive, and restore;
- Project Version-selected Capture Session/Asset/Event routes;
- Guide and Interactive Demo Edition/Working Draft routes;
- Guide and Interactive Demo Revision/checkpoint/restore routes;
- `POST /api/v1/projects/:project_id/artifact-editions/carry-forward`;
- Guide/Demo Publication and Publish Link routes;
- `/api/v1/public/publish-links/:slug*`, including exact-version resolution,
  viewer session, and immutable Asset streaming.

### Contract invariants

- shared public Zod DTOs remain owned by `packages/types/src/*.ts`;
- shared statuses/enums remain owned by `packages/constants/src/*.ts`;
- route errors retain the accepted domain envelope
  `{ error: { type, message } }`, while Fastify/Zod validation retains its
  documented envelope;
- Project Version-scoped list/read/write requests identify
  `project_version_id`;
- Edition mutations use `expected_edition_version`; Working Draft/child
  mutations use `expected_working_draft_version`; these are Row Versions;
- manual checkpoint and Revision restore use Revision semantics, not Row
  Version semantics;
- Published Artifacts expose `publication_sequence` and an exact immutable
  Revision; they never expose a mutable Working Draft as published content;
- Carry-Forward is actor-scoped, idempotent, bounded, one-source/one-target,
  atomic, and never overwrites an existing target Edition;
- public link routes expose only selected manifest entries and one explicit
  default, with link-wide public/password/restricted policy;
- no customer-authored Product Documentation site/page or Video runtime route
  or DTO is permitted before child `131` and an accepted `132+`
  implementation plan. The development-only Scalar API reference route
  `/documentation` remains legitimate API tooling and must not be mistaken for
  the future product domain.

## Schemas, Types, And Persistence

No schema, migration, shared type, or enum change is expected.

### Verification targets

- migrations `001`-`014`: existing identity, Project, Capture, Guide, Demo, and
  early Publication foundation;
- `015`-`018`: Audit and Access Evidence plus constraints;
- `019`: Project Membership;
- `020`: Project Version and aliases/default;
- `021`: Capture source Project Version scoping;
- `022`: Guide/Demo Artifacts, Editions, and relational Working Drafts;
- `023`: Revisions, Carry-Forward lineage, and protected Assets;
- `024`: revision-backed Published Artifacts and multi-version Publish Links.

Inspect and test:

- `apps/server/src/db/foundation-schema.db.integration.test.ts`;
- `apps/server/src/db/migrator.ts` and its tests;
- `apps/server/src/db/audit-schema-verification.ts` and its tests;
- `packages/types/src/{project,project-membership,project-version,capture,guide,demo,artifact-revision,artifact-carry-forward,publish,compliance,project-activity}.ts`;
- matching `packages/types/src/*.test.ts`;
- `packages/constants/src/{project,project-membership,project-version,capture,artifact-edition,artifact-revision,guide,demo,publish,access}.ts`;
- domain package commands, policies, repositories, and tests relevant to the
  required invariants.

The absence audit must find no customer-authored Product Documentation/Video
table, schema, migration, package, shared DTO, enum, permission, seed,
navigation model, or placeholder domain. `apps/docs`, repository Markdown, the
development Scalar `/documentation` API reference, and ordinary source-code
mentions of third-party documentation are not false positives.

## Behavior Rules

### Documentation truth bands

Every active product document must distinguish:

1. **Available today**: shipped and verified current behavior.
2. **Next platform direction**: Product Documentation, subject to child `131`
   decisions and later `132+` implementation.
3. **Intentionally deferred**: Video and other explicitly excluded capability.

Use “repository docs” or “Docs App” for `apps/docs`; reserve “Product
Documentation” for the future customer-authored artifact family. Do not imply
that a checked plan alone proves runtime behavior.

### Foundation behavior

- new Project creation and initial Project Admin membership/default `Main`
  creation are one transaction;
- Project Version slugs are project-scoped, canonical, and preserve permanent
  former-slug aliases;
- archived Projects/Versions/Editions are effectively read-only without
  silently revoking existing Publications;
- an empty, unstarted Capture Session may change Project Version; started or
  non-empty Capture provenance may not;
- normal saves update the Working Draft and Row Version without creating an
  Artifact Revision;
- checkpoint, Publication, and Carry-Forward create or reuse immutable
  Revisions under their accepted rules;
- Revision Number and Publication Sequence are independently increasing within
  the Edition and never reused;
- Carry-Forward creates independent target relational content and reuses
  protected immutable Asset references without live synchronization;
- archiving a protected Asset does not break existing authored/revision/public
  references; physical purge remains blocked while dependencies exist;
- stable Publish Links never silently change meaning, combine unrelated
  Artifacts, or expose drafts;
- public exact-version selection, password/restricted access, expiry,
  revocation, embed, and immutable Asset streaming remain compatible.

### UI/browser behavior

- Organization, Project, and Project Version context remains visible and
  canonical;
- Project Viewer/read-only/archived states do not expose enabled mutations;
- every async action has truthful pending, success, failure, and conflict
  behavior;
- modal background isolation, Escape, focus trap, opener/fallback focus, and
  post-mutation state remain correct;
- keyboard order, landmarks, names, errors, live regions, contrast, 200% zoom,
  320/390px portal reflow, 360/320/180-CSS-pixel extension popup behavior, and
  reduced motion preserve child `129`;
- direct extension-page automation and true installed-toolbar evidence remain
  separate evidence classes;
- production performance must be compared to the child `129` baseline with the
  same route, fixture, viewport, cache, and three-run median method.

## Security, Permission, Privacy, And Evidence Rules

- Organization Owner has implicit Project Admin access across the Organization.
- non-owner Organization members require active Project Membership:
  `project_admin`, `editor`, or `viewer`.
- Project Admin manages Project Membership, settings, Project Versions, and safe
  Asset purge, and inherits Editor capability.
- Project Editor may capture, author, checkpoint, Carry Forward, publish, and
  manage Publish Links but may not manage Project structure/membership/purge.
- Project Viewer is read-only and may see ordinary Revision/Publication history,
  not raw compliance evidence.
- Owner may view Organization compliance; Project Admin may view Project-scoped
  compliance; Editor receives curated Project Activity; Viewer does not receive
  raw Audit Change Items or Access Events.
- every successfully committed mutation has one logical Audit Event and typed
  Audit Change Items in the same transaction;
- meaningful protected/public access appends Access Evidence under the accepted
  fail-closed rules;
- viewing compliance itself creates Access Evidence;
- runtime database credentials cannot update, delete, truncate, or bypass
  Audit/Access Evidence guards;
- public reads resolve only Assets reachable from the selected immutable
  Published Artifact/Revision;
- archived state never bypasses authorization;
- extension session tokens, cookies, passwords, invite tokens, captured input,
  raw HTML, filesystem paths, and customer content must not enter committed
  reports, screenshots, logs, or fixtures;
- use privacy-safe deterministic fixtures and retain existing screenshot-first,
  redaction, and raw-input omission behavior.

## Migration, Reset, Reseed, And Backwards Compatibility

Use only the repository's configured disposable testing database. Validate the
database name/host/profile before any drop. Never point destructive commands at
production, a shared developer database, or an unresolved environment value.

Required clean-schema rehearsal:

```bash
pnpm --filter server test:db:drop
pnpm --filter server test:setup
```

`test:db:drop` is authorized only for the verified disposable test profile.
Record the resolved non-secret database name and refusal protections, never its
password. Before running it, inspect `apps/server/src/db/drop-db.ts` and confirm
`DEV_TYPE`/`NODE_ENV` identifies testing and `DB_NAME` uses its guarded
`*_test`, `test-*`, or `test_*` shape. The repository has no focused
`drop-db` test at expansion; do not claim one passed. Do not print the complete
`.env-cmdrc`.

Required migration rehearsal:

1. confirm migrations `001` through `024` are applied and status is clean;
2. while the newly migrated database is still empty of business records, read
   migration `024`'s DOWN guard and exercise the repository-supported latest
   migration down/up path with the testing maintenance profile:

   ```bash
   cd apps/server
   pnpm exec env-cmd -f .env-cmdrc -e testing_maintenance -- \
     tsx src/db/migrate.ts down
   pnpm run test:migrate
   pnpm exec env-cmd -f .env-cmdrc -e testing_maintenance -- \
     tsx src/db/migrate.ts status
   ```

3. from the repository root, run the selected DB integration suite on the final
   UP state:

   ```bash
   pnpm --filter server test:db
   ```

4. reset and run smoke as a separate clean-schema cycle matching CI:

   ```bash
   pnpm --filter server test:db:drop
   pnpm --filter server test:setup
   pnpm --filter server test:smoke
   ```

5. seed the three browser fixtures only after the final schema state is
   established:

   ```bash
   pnpm --filter server seed:capture-portal-browser-fixture
   pnpm --filter server seed:guide-browser-fixture
   pnpm --filter server seed:interactive-demo-browser-fixture
   ```

6. rerun migration status after fixture/browser work without attempting DOWN
   against populated immutable Publication or retained Audit/Access Evidence;
7. record migration safety guards from integration coverage. If an exploratory
   populated DOWN is attempted and intentionally refuses, preserve the refusal
   as the expected result and recreate the disposable database; never delete
   retained rows merely to force rollback.

The DB integration and smoke cycles are intentionally separate because CI
resets between them. Do not run `test:db` and then infer the smoke result from
the same mutated schema.

Do not rewrite or squash migration history. The repository is pre-live and may
reset/reseed disposable data, but accepted public routes, immutable
Publication semantics, slug aliases, extension-to-portal handoff, and current
in-repo clients remain compatibility requirements. A mixed old/new writer fleet
is not supported for the guarded migrations; retain the documented maintenance
window and runtime/maintenance role separation.

Rollback for documentation-only changes is the normal Git revert of the
specific documentation commit. Database test cleanup means dropping only the
verified disposable test database and recreating it through `test:setup`; no
product data migration is introduced by this phase.

## Implementation Strategy

### Slice 1: Establish the audit ledger

1. record starting commit, branch divergence, worktree ownership, environment,
   Node/pnpm/PostgreSQL/Chromium/agent-browser versions, and known tool limits;
2. create `docs/pre-documentation-closeout.md`;
3. add one row per child `109`-`129` with acceptance source, evidence source,
   actual current-state check, finding IDs, and Pass/Blocked/Accepted Exception;
4. apply the severity rubric before edits.

### Slice 2: Reconcile decisions, code, and active docs

1. compare `CONTEXT.md`, accepted ADRs, master/child results, routes, packages,
   migrations, shared contracts, and role policies;
2. run exact searches for ambiguous `version`, `version_number`, “snapshot,”
   “latest,” “artifact version,” Documentation, and Video terminology;
3. distinguish valid internal Row Version columns from misleading public copy;
4. update only active docs and `apps/docs` current-state copy/tests;
5. run focused tests for executable documentation copy after each correction.

### Slice 3: Prove schema and workflow from empty state

1. validate the disposable test target;
2. drop/create/provision/migrate from an empty schema;
3. exercise the latest safe migration down/up contract before business data is
   seeded;
4. run DB integration, then reset and run the separate V1 smoke cycle;
5. seed browser fixtures only after the final UP schema is established;
6. record schema objects, migration status, expected safety refusals, and final
   clean state.

### Slice 4: Re-run automated repository gates

Run focused docs-app tests first, then all workspace tests, types, lint,
format/whitespace, and production builds. Investigate any delta from child
`129`; classify rather than broadening scope automatically.

### Slice 5: Run connected browser closeout

Seed deterministic fixtures, start server/web production-like surfaces, use
`agent-browser` for the web/public/direct-extension matrix, and use the proven
temporary headless Chromium extension-loading path for a true toolbar Capture.
Measure the targeted child `129` performance surfaces, inspect console/network
failures, and record only synthetic evidence.

### Slice 6: Repeat until clean and close

1. re-run the focused owner suite after every accepted documentation/routine
   correction;
2. re-run any broad/browser category affected by a finding;
3. confirm no S1/S2 remains and every S3/S4 has a disposition;
4. update the report, this plan's status/checklists/log/verification/leftovers,
   and only then the completed Phase `130` items in the master;
5. name child `131` as next only if every child `131` grill-entry gate passes;
   do not mark the separate Documentation implementation gate passed.

## Focused Verification Plan

### Documentation and terminology

```bash
pnpm --filter docs test
pnpm --filter docs check-types
pnpm --filter docs lint
pnpm --filter docs build
git diff --check
pnpm exec prettier --check \
  docs/plan/130-pre-documentation-closeout.md \
  docs/pre-documentation-closeout.md
```

Add every corrected Markdown/TS file to the final Prettier command.

Searches must cover:

```bash
rg -n "version_number|artifact version|save a version|latest version|snapshot_json"
rg -n "Documentation|documentation|Video|video"
rg -n 'through child `120`|UI modernization.*planned|true toolbar.*pending'
rg -n "/latest|documentation|video" apps packages
rg --files apps packages | rg "(documentation|video)"
```

Review matches manually; these terms have legitimate historical, repository
docs, HTML media, API-reference, and plan uses. In particular,
`apps/server/src/app.ts` legitimately registers the development Scalar API
reference at `/documentation`. The gate is absence of ambiguous current product
claims or premature customer-authored Product Documentation/Video ownership,
not zero textual matches.

The repository asks contributors to prefix commands with `rtk`, but `rtk` was
not available in the expansion environment. At implementation start, record
`command -v rtk`. Use `rtk pnpm ...` when available; otherwise run the exact
`pnpm ...` commands shown here and record that tool limitation. Do not install
or make `rtk` a repository/runtime dependency as part of Phase `130`.

### Broad repository gates

```bash
pnpm --filter web test
pnpm --filter extension test
pnpm --filter server test
pnpm --filter @repo/types test
pnpm --filter @repo/constants test
pnpm --filter @repo/ui test
pnpm --recursive test
pnpm check-types
pnpm lint
pnpm build
git diff --check
```

Run the selected DB and smoke commands from the migration section after the
clean-schema setup. Record exact file/test/task counts rather than only exit
codes.

## Agent-Browser Validation Requirements

This phase includes frontend/browser behavior and must use the installed
`agent-browser` skill. Browser evidence is regression validation, not permission
to redesign.

### Environment and session rules

- use Chromium available on the headless server;
- record exact browser and agent-browser versions;
- use production builds/previews for final size/vitals measurements;
- use dev servers only for debugging;
- use separate Owner, Project Admin, Editor, Viewer, unauthenticated, public,
  and extension sessions as required;
- keep auth profiles and secrets outside the repository;
- close sessions and stop all services when complete;
- record Firefox/WebKit/Safari as Blocked if still unavailable; do not emulate a
  support claim.

Use `agent-browser` for portal, public, direct-extension-page, and Docs App
validation. For the genuinely installed extension action, follow the temporary
Puppeteer `25.4.0` outside-repository method recorded in
`docs/ui/126-extension-ui-browser-evidence.md` and reaffirmed by child `129`.
Do not install Puppeteer in the monorepo, commit the temporary automation
script/profile, hard-code the prior extension ID, or treat a directly opened
`chrome-extension://` page as toolbar-action evidence.

### Required connected journeys

1. fresh self-hosted setup -> login -> create Project -> transactional `Main`;
2. Owner Organization members/invites and compliance;
3. Project Admin membership, Version lifecycle/default/alias, and Project
   compliance;
4. Editor Project Version workspace -> Capture -> Guide -> checkpoint ->
   publication -> public reader/embed;
5. Editor Capture -> Interactive Demo -> hotspot/transition -> checkpoint ->
   publication -> public viewer/embed;
6. Carry-Forward into another Project Version with conflict/no-overwrite and
   independent subsequent editing;
7. Viewer/read-only and archived Project/Version/Edition behavior;
8. password/restricted/expired/revoked Publish Link behavior and exact-version
   selector;
9. protected Asset archive/resolution and Admin-only purge protection;
10. direct extension-page state checks plus a separate unpacked installed
    toolbar Capture with redaction, suppression, pause/resume, service-worker
    restart, finish, clear, and canonical portal handoff.
11. the repository Docs App after current-state copy correction at `1440x900`
    and `390px`, confirming its links work and its Available Today / next
    direction / deferred language does not imply Product Documentation or Video
    runtime exists.

### Required interaction and viewport checks

- keyboard-only primary journeys;
- visible focus, modal isolation, Escape, trap, opener restore, and stable
  post-mutation fallback;
- axe scans on representative entry, portal, Capture, Guide, Demo, public, and
  extension surfaces;
- manual review of axe incomplete layered Textarea contrast;
- desktop and `1440x900` editor checks;
- `390px` mobile and `640` CSS-pixel/200% zoom reflow;
- direct extension at `360px`, `320px`, and `180` CSS pixels;
- normal and `prefers-reduced-motion: reduce`;
- loading, empty, error, permission, conflict, archived, broken-media,
  destructive, and retry states where deterministic fixtures support them;
- browser console, runtime, failed-request, duplicate-submit, and stale-response
  review.

### Performance preservation

Repeat the child `129` three-run production-vitals protocol for:

- Project Version workspace;
- Guide editor;
- public Guide reader;
- Interactive Demo editor;
- public Demo viewer;
- public Demo embed;
- direct extension popup.

Record FCP, LCP, TTFB, CLS, cache state, viewport, request anomalies, and medians.
Record final web and extension build sizes. Any material regression from the
child `129` baseline requires investigation and disposition; do not invent a
new budget after observing the result. Repeat the Guide/Demo long-session
workloads and state the forced-GC/listener/timer limitation if it remains.

## Closeout Report Contract

`docs/pre-documentation-closeout.md` must contain:

- date, start/final commits, branch/worktree state, OS, PostgreSQL, Node, pnpm,
  browser, agent-browser, and relevant tool versions;
- one acceptance/evidence row for each child `109` through `129`;
- canonical decision and terminology audit;
- active documentation drift register with file, old claim, corrected truth,
  commit, and verification;
- route/API/schema/type/package/permission/absence audit;
- numbered issue register with severity, reproduction, owner, disposition,
  repair commit or follow-up, and blocking decision;
- exact clean database/reset/reseed/migration commands and results;
- exact focused, DB, smoke, full workspace, type, lint, build, format, and
  whitespace results with counts;
- browser route/role/state/viewport matrix;
- accessibility, focus/modal, reduced-motion, responsive/reflow, console,
  network, build-size, vitals, long-session, direct-extension, and installed-
  toolbar results;
- safe evidence paths and confirmation that all committed data is synthetic;
- secondary-browser and tooling limitations;
- explicit checks for no Documentation/Video runtime surface;
- every remaining limitation with owner and child `131` blocking decision;
- a final child `131` grill-entry Pass/Fail result and handoff questions, kept
  distinct from the post-grill Documentation implementation entry gate;

## Acceptance Checklist

### Planning/readiness

- [x] Re-read child `129`, Master Plan `005`, `CONTEXT.md`, accepted ADR
      summaries, repository guidance, and current route/package/migration
      ownership.
- [x] Replace the reserved skeleton with exact scope, files, contracts,
      behavior, permission, migration, compatibility, verification, browser,
      handoff, and non-scope rules.
- [x] Record the child `129` actual completion baseline and known limitations.
- [x] Record the implementation starting commit and worktree ownership.

### Closeout execution

- [x] Create the dated closeout report and child-by-child ledger.
- [x] Recheck children `109` through `129` against actual acceptance evidence.
- [x] Complete the terminology, docs, routes, contracts, schemas, packages,
      permissions, and absence audit.
- [x] Correct only recorded active-documentation drift.
- [x] Prove the clean disposable database, migrations, fixtures, DB integration,
      and V1 smoke flow.
- [x] Pass focused and broad automated verification.
- [x] Pass the required agent-browser and installed-toolbar matrix.
- [x] Preserve or explicitly disposition the child `129` accessibility,
      responsive, motion, build, and performance baseline.
- [x] Classify and disposition every finding; no S1/S2 remains.

### Closure

- [x] Update this file with final status, implementation log, verification
      record, commits, limitations, and child `131` handoff.
- [x] Update Master Plan `005` only for completed Phase `130` items.
- [x] Confirm no user/agent changes or unrelated files entered the commits.
- [x] Confirm the final worktree is clean except for explicitly preserved
      pre-existing changes.
- [x] Mark child `131` ready only if every child `131` grill-entry gate passes,
      without marking the Documentation implementation gate complete.

## Commit Strategy

Commit only the implementing agent's changes in small logical commits:

1. `docs(closeout): establish phase 130 audit ledger`
2. `docs: synchronize shipped foundation status`
3. `docs(closeout): record phase 130 verification`
4. `docs(plan): close child 130` (child/master status and handoff only)

Combine commits when a change is too small to stand alone; do not split copy and
its `apps/docs` test. Runtime repair, if separately approved, must use its own
focused commit(s) before the final closeout and must name the owning behavior.
Stage explicit paths and inspect `git diff --cached` before each commit.

## Critical Decisions And Stop Conditions

Stop and request direction when:

- an accepted ADR and implemented behavior materially contradict;
- a finding needs new Product Documentation or Video semantics;
- a migration must be rewritten, retained evidence deleted, or non-disposable
  data reset;
- an S1/S2 runtime issue requires repair outside this child's write set;
- route/API compatibility or public-link meaning would change;
- another contributor's overlapping changes cannot be preserved safely;
- child `129` evidence cannot be reproduced enough to judge a material
  regression.

Do not stop for routine current-state copy corrections, safe synthetic fixture
execution, known unavailable secondary engines, or an expected migration safety
refusal that is already documented and does not invalidate the gate.

## Implementation Log

Implementation completed on 2026-07-29 from starting commit
`bc28f4d065c970f2b082c6acba7f5c196310f605`:

1. `201c153` (`docs(closeout): establish phase 130 audit ledger`) created
   `docs/pre-documentation-closeout.md` with the starting-state record,
   child-by-child acceptance ledger, severity model, inventories, and
   verification matrix.
2. `684f76c` (`docs: synchronize shipped foundation status`) corrected the four
   recorded DOC-01 through DOC-04 active-documentation drift groups. This
   synchronized root/app READMEs, roadmap/status/product/architecture/
   contributor/smoke documents, and the Docs App truth bands and tests.
3. `228292c` (`docs(closeout): record phase 130 verification`) recorded the
   completed database, automated, browser, accessibility, responsive, motion,
   performance, link, screenshot, and absence evidence and marked the
   child `131` grill-entry gate Passed. The post-grill Documentation
   implementation entry gate remains pending.
4. `4388522` (`docs(plan): close child 130`) synchronizes this child and Master
   Plan `005` with the passed result and child `131` handoff.

The initial four findings were documentation-only S3/S4 drift: obsolete
UI-track status, obsolete installed-extension limitations, future-tense
descriptions of already shipped foundation behavior, and unrelated
create-next-app boilerplate in `apps/web/README.md`. The final prompt-pack
closure audit added two documentation-only findings: `DOC-05` separated the
passed child `131` grill-entry gate from the still-pending Documentation
implementation gate, and `DOC-06` added explicit checked acceptance lists to
the otherwise complete children `111`, `121`, and `125-01`.

No runtime repair was required. There were no runtime/API/schema/type/migration/
permission/dependency changes, no Product Documentation or Video
implementation, and no Git-history synchronization.

## Verification Record

The dated command-by-command evidence, exact tool versions, result counts,
browser matrix, vitals, issue register, and limitation dispositions are in
`docs/pre-documentation-closeout.md`.

- all children `109` through `129`, accepted ADRs, canonical terminology,
  routes, APIs, schemas/types, packages, permissions, migrations, current-state
  docs, screenshots, and Product Documentation/Video absence checks passed;
- the final structural ledger confirmed that every completed prompt-pack child,
  including `125-01`, has a complete status, checked acceptance list,
  verification notes, and explicit leftovers/handoff;
- the final code/plan inventory confirmed `23` complete records with zero
  unchecked items, only children `109` through `130` checked in the master,
  migrations still ending at `024`, no Product Documentation/Video runtime,
  and no `apps`/`packages` diff after the recorded browser-verified source;
- local Markdown links passed (`198` files, `45` local links, zero missing),
  Docs App external links returned HTTP `200`, and all `76` PNG evidence files
  decoded successfully;
- a disposable `ossie_test` database applied migrations `001` through `024`,
  rehearsed migration `024` down/up on an empty schema, finished with clean
  migration status, passed all `20` DB integration files / `67` tests, and
  passed the separately reset V1 smoke test (`1`/`1`);
- web passed `52` files / `345` tests, extension `19` / `140`, server unit
  `99` / `406`, types `16` / `61`, constants `1` / `5`, and UI `3` / `7`;
  recursive tests passed all `15` selected workspaces, check-types `12`/`12`,
  lint `13`/`13`, and production builds `12`/`12`;
- Chromium browser validation passed authenticated roles, canonical Version
  routing, Capture, Guide, Demo, carry-forward conflict/no-overwrite,
  archive/read-only, Publication access states, protected Assets, Docs App,
  responsive/reflow, reduced-motion, keyboard/focus/modal, direct extension,
  and real installed-toolbar Capture/restart/finish/handoff journeys;
- representative axe scans reported zero violations. Layered Guide/Demo
  Textarea contrast remained an axe indeterminate result with a manual pass;
- all seven required three-run production-vitals surfaces remained within or
  better than child `129`, Guide/Demo long-session checks passed, and build
  sizes matched the accepted baseline;
- Firefox, Firefox ESR, WebKit, Safari, and SafariDriver were unavailable on
  this headless host. Comparable forced-GC heap and listener/timer metrics
  remain unavailable. These are recorded non-blocking environment/tooling
  limitations, not support claims;
- all browser sessions and local services were stopped, temporary external
  Puppeteer material was not added to the repository, and the final scoped
  diff passed formatting and whitespace checks.
- final-closure Prettier and whitespace checks passed; Docs App passed `4`
  files / `12` tests, type-check, and lint. Browser dogfood was not repeated
  because the final closure changed only plan/report records and the runtime/
  browser-visible tree remained identical to the recorded Phase `130` pass.

## Leftovers And Handoff

Child `131` is the next executable work and receives:

- the dated closeout report and final commit;
- the verified current route/schema/permission/publication model;
- accepted terminology and documentation truth bands;
- current accessibility, motion, responsive, build, performance, and browser
  baselines;
- all non-blocking limitations and environment constraints;
- explicit questions that belong to Documentation domain design rather than
  hidden foundation repair.

The following non-blocking constraints carry forward:

- Chromium is the only browser engine verified on this host; do not imply
  Firefox/WebKit/Safari support without running those engines;
- retain manual contrast review for the layered Guide/Demo Textarea until the
  automation can resolve it deterministically;
- fixture families reset shared Capture data and therefore must be reseeded for
  the browser family that owns each scenario;
- forced-GC heap and listener/timer comparisons remain unavailable in the
  current browser tooling;
- local `main` and `origin/main` remain intentionally diverged as recorded in
  the closeout report; no pull, merge, rebase, or history rewrite was part of
  this phase.

Child `131` must remain a planning/grill phase. It may decide Documentation
terms and update canonical decision documents, but it must not add runtime
Documentation code, tables, routes, packages, or navigation. Runtime
implementation begins only in an accepted child sequence starting at `132`.
