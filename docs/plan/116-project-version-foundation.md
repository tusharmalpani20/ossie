# Child Plan 116: Project Version Foundation

Date reserved: 2026-07-12

Expanded: 2026-07-19

Last rechecked: 2026-07-19

Status: Expanded and rechecked as an implementation-ready planning checkpoint.
Runtime implementation has not started. Reinspect the implementation baseline
before coding in case the worktree changes after this commit.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Starting baseline:

- commit `360b6ca` (`docs(plan): close project membership recheck`);
- the worktree was clean when this expansion began;
- children `112` through `115` are complete;
- migrations currently end at
  `019_project_membership_foundation.sql`;
- no Project Version table, route, contract, or runtime behavior exists yet.

## Goal

Add the first shipped Project Version aggregate as the explicit release-context
boundary inside a Project. Every newly created Project must transactionally own
one real active Default Project Version named `Main` with canonical slug `main`.
Authorized users must be able to discover and navigate Project Versions, while
Project Admins can create, edit, reorder, archive, restore, rename slugs, and
change the default according to the accepted lifecycle and alias rules.

The implementation must reuse child `115` Project Membership and
`project_version.manage` authorization, children `112`/`113` transactional Audit
Evidence, and child `114` fail-closed Access Evidence. It must not introduce
per-version membership, reinterpret Row Version counters, weaken archived
Project behavior, or pull Capture/Edition persistence forward from children
`117` and `118`.

## Sequence Gate And Current Runtime Facts

The predecessor gate is satisfied:

- child `115` ships explicit Project Membership, Owner implicit Project Admin
  access, one central Project capability policy, membership-aware discovery,
  Project Admin compliance, Editor Activity, and immediate query-time
  revocation;
- `project_version.manage` already exists in the central capability matrix and
  is allowed only for Project Admins and Organization Owners;
- child `115`'s close-previous recheck made assignment eligibility atomic and
  left no known implementation blocker for this child;
- child `117` remains the owner of Capture Session `project_version_id`, capture
  provenance locking, and portal/extension version selection for capture;
- child `118` remains the owner of stable Artifact identity, Project
  Version-scoped Editions, and relational Working Drafts.

Current code facts this child changes:

- `project_schema.project` has no Default Project Version foreign key. Project
  creation currently inserts a Project and, for a non-Owner creator, an initial
  Project Membership in one audited transaction.
- the current Project response contains Project identity, lifecycle, Row
  Version, and effective access, but no Project Version context;
- current authenticated portal URLs are Project-scoped, for example
  `/projects/{projectId}/guides/{guideId}`. The custom pathname parser has no
  Project Version segment or canonical redirect layer;
- current Project, Capture, Guide, and Interactive Demo aggregate roots have no
  `project_version_id`. Existing private APIs therefore cannot safely pretend
  to filter non-default version content during this child;
- the extension stores only a selected Project ID and active Capture Session
  context. It must display the Default Project Version delivered with the
  Project response, but child `117` owns stored version selection and versioned
  Capture creation;
- Project list/create/get/update code is split across shared Zod contracts,
  repository/service/routes, the audited Project writer, central app
  composition, portal API helpers/pages, and extension shared-contract
  consumption;
- Audit mutation coverage is exhaustive and database-guarded. Any new mutable
  table or mutation command must be added to the registry, transaction writer,
  database command policy, mutation-context/evidence triggers, schema verifier,
  and tests together;
- Access route coverage is exhaustive. Successful protected reads fail closed
  if Access Evidence cannot be appended, and successful Project Version reads
  must resolve the root to the immutable Project Version ID rather than retain
  an untrusted slug;
- Project Activity is an allowlisted projection. Version lifecycle actions must
  be added deliberately to its `project` category;
- current migrations and the child `115` operations guide use the accepted
  pre-live reset/reseed boundary. There is no production-row backfill or mixed
  old/new client requirement.

## Canonical Decisions Applied

This plan applies without reopening:

- `CONTEXT.md`: a Project Version is a Project-owned release context with
  immutable ID, free-form name, canonical slug, permanent aliases, explicit
  position, optional description/release date, and `active | archived`
  lifecycle;
- ADR `0021`: every Project transactionally creates one real active `Main`
  Default Project Version; older active versions remain editable; changing the
  default never moves content;
- ADR `0022`: Row Version remains concurrency metadata and must not become an
  Artifact Revision or Project Version number;
- ADR `0024`: Project Versions inherit Project Membership. Project Admins and
  Organization Owners manage Project Versions; Editors and Viewers may read
  them but may not mutate them;
- child `111`, questions 2 through 4 and 10 through 20: names are free-form,
  semantic versioning is not required, canonical slugs are project-scoped,
  former slugs are permanent and non-reusable, Default must remain active,
  archived versions stay directly linkable/read-only, explicit order is not
  inferred from names, and `/latest` is not introduced;
- child `115`: current membership is evaluated at request time and the central
  capability policy, not route-local role literals, owns authorization;
- children `112` through `114`: successful mutations and meaningful reads use
  the shipped Audit/Access evidence model and retention rules.

No new grill or ADR is required. Field limits, endpoint composition, a
deferrable Project-to-default foreign key, deterministic reorder payload, and
the temporary Default-only compatibility guard below are reversible,
locally-testable implementation details inside accepted semantics.

## Sequencing Clarification: What Child 116 Does Not Yet Scope

The reserved skeleton inherited two statements that are too broad for the
accepted child order: it asks this child to put explicit Project Version context
on every Capture/Artifact flow and says no Capture or Artifact Edition may be
created without it. Children `117` and `118` explicitly own those aggregate
foreign keys and clean persistence transitions.

This child therefore establishes:

- a valid Default Project Version for every newly created Project;
- Project Version persistence, lifecycle, aliases, ordering, APIs, Audit/Access
  coverage, portal navigation, management UI, and Default context in Project
  responses;
- canonical Project Version workspace URLs and redirects;
- a safe Default-only compatibility seam for current Capture/Guide/Demo roots;
- explicit handoff contracts that children `117` and `118` must make mandatory.

Until those next children land:

- existing Project-scoped Capture/Guide/Demo APIs are treated as current
  Default Project Version workflows only; they do not accept a version ID or
  claim persisted version ownership;
- the portal may render current Capture/Guide/Demo pages only for the selected
  Default Project Version. A non-default or archived Project Version workspace
  remains navigable but does not query or display unscoped content as though it
  belonged there;
- the extension displays and uses the Project's current Default Project Version
  context but does not persist a selected Project Version ID or send one in
  Capture requests until child `117`;
- changing the Default Project Version is refused once any current Capture
  Session, Guide, or Interactive Demo root exists, including archived or
  soft-deleted roots. This temporary guard prevents unscoped content from being
  silently reinterpreted. Children `117` and `118` remove the guard only after
  their roots have mandatory Project Version ownership;
- authenticated Guide/Demo Edition and Revision URL shapes remain owned by
  children `118` and `119`. This child adds the canonical Project Version route
  prefix and legacy redirects but does not claim Edition/Revision routes exist.

This clarification preserves the accepted product target and makes the
repository safe at every sequential checkpoint.

## Scope

### In scope

- additive migration `020_project_version_foundation.sql`;
- explicit Project Version and immutable alias tables;
- an exact Project-to-Default-Project-Version relationship;
- transactional `Main` creation with Project and creator membership;
- shared constants, schemas, request/response contracts, and runtime parsing;
- create/list/get/slug-resolve/update/reorder/archive/restore/set-default APIs;
- permanent former-slug aliases and portal canonicalization;
- one Project Admin authorization boundary for every mutation and Project-read
  authorization for every read;
- atomic Audit Events/Change Items and registered Access Events;
- Project Activity summaries for version lifecycle actions;
- Project response inclusion of Default Project Version summary;
- portal Default redirect, version workspace/context selector, quiet single-
  version behavior, Project Settings management, archived/read-only states, and
  legacy content-route redirects;
- extension display/deep-link use of the returned Default Project Version,
  without version-aware Capture persistence;
- clean migration/reset/reseed, database schema verification, DB integration,
  smoke, portal/extension tests, and real-browser evidence;
- current-truth documentation and closeout updates.

### Explicit non-scope

- `project_version_id` on Capture Session, Capture Event, Capture Asset, Guide,
  Interactive Demo, Artifact, Edition, Revision, Publication, or Publish Link;
- Capture Session reassignment/locking, extension version selection/storage, or
  version-aware Capture requests; child `117` owns these;
- stable Artifact identity, Artifact Editions, Working Drafts, Edition archive,
  title/description ownership migration, or authenticated Edition routes;
  child `118` owns these;
- Artifact Revisions, checkpoint/restore, Carry-Forward, protected shared-asset
  enforcement, or revision preview URLs; child `119` owns these;
- Publication persistence rewrite, multi-version Publish Links, public version
  selectors, or changing `/p/*` and `/d/*`; child `120` owns these;
- per-version membership, role overrides, audiences, environments, variants,
  branches, semantic-version parsing, release channels, automatic newest/latest
  selection, or a `/latest` route;
- version deletion, alias deletion/reassignment, permanent Project deletion,
  bulk import/export, evidence export, or retention changes;
- automatic content migration/copying when a Project Version is created;
- automatically archiving an older Project Version when a newer one is created;
- moving current content when Default changes;
- large navigation/design-system modernization owned by children `121` through
  `130`;
- new framework, router, query-cache, drag-and-drop, or slugification dependency;
- overnight tooling, Documentation runtime, or Video runtime.

## Exact Affected Files

The implementation must remain inside this manifest. If a current-code change
forces another runtime file, update and recheck this plan before editing it.

### Create

Shared contracts:

- `packages/constants/src/project-version.ts`
- `packages/types/src/project-version.ts`
- `packages/types/src/project-version.test.ts`

Persistence and server module:

- `apps/server/src/db/migrations/020_project_version_foundation.sql`
- `apps/server/src/modules/project-version/project-version.repository.ts`
- `apps/server/src/modules/project-version/project-version.repository.test.ts`
- `apps/server/src/modules/project-version/project-version.service.ts`
- `apps/server/src/modules/project-version/project-version.service.test.ts`
- `apps/server/src/modules/project-version/project-version.audit.ts`
- `apps/server/src/modules/project-version/project-version.audit.test.ts`
- `apps/server/src/modules/project-version/project-version.routes.ts`
- `apps/server/src/modules/project-version/project-version.routes.test.ts`
- `apps/server/src/modules/project-version/project-version.app.integration.test.ts`
- `apps/server/src/modules/project-version/project-version.db.integration.test.ts`

Portal:

- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.module.css`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.module.css`
- `apps/web/src/features/project-version/ProjectVersionContextBar.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.tsx`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.module.css`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.test.tsx`

### Modify: shared contracts

- `packages/constants/src/index.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/index.ts`
- `packages/types/src/project.ts`
- `packages/types/src/project.test.ts`

### Modify: migration, schema verification, evidence, and composition

- `apps/server/package.json`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/migrate.ts`
- `apps/server/src/test-support/database.ts`
- `apps/server/src/test-support/database.test.ts`
- `apps/server/src/modules/audit/audit.db.integration.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/modules/project-membership/project-membership.db.integration.test.ts`
- `apps/server/src/modules/capture-session/capture-session.db.integration.test.ts`
- `apps/server/src/app.ts`

### Modify: Project creation and response composition

- `apps/server/src/modules/project/project.service.ts`
- `apps/server/src/modules/project/project.service.test.ts`
- `apps/server/src/modules/project/project.repository.ts`
- `apps/server/src/modules/project/project.db.integration.test.ts`
- `apps/server/src/modules/project/project.audit.ts`
- `apps/server/src/modules/project/project.audit.test.ts`
- `apps/server/src/modules/project/project.routes.ts`
- `apps/server/src/modules/project/project.routes.test.ts`
- `apps/server/src/modules/project/project.app.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

### Modify: portal routing, API, and Project surfaces

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/features/project/ProjectListPage.tsx`
- `apps/web/src/features/project/ProjectListPage.test.tsx`
- `apps/web/src/features/project/ProjectListPage.module.css`
- `apps/web/src/features/project/ProjectWorkspacePage.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.test.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.module.css`
- `apps/web/src/features/project/ProjectSettingsPage.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.test.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.module.css`
- `apps/web/src/features/project/types.ts`
- `apps/web/src/features/project/useProjectAccess.ts`

### Modify: portal legacy content-path canonicalization

These files change only their portal URL builders/props/tests so current content
routes live under the selected canonical Default Project Version path. Their API
requests and persistence semantics do not become version-scoped in this child.

- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`

Project-wide Settings, Membership, Activity, and Compliance routes remain
Project-scoped. Their links may continue through `/projects/{projectId}` because
that entry route resolves the current Default Project Version.

### Modify: extension Default context and deep links

- `apps/extension/src/App.tsx`
- `apps/extension/src/App.test.tsx`
- `apps/extension/src/index.css`
- `apps/extension/src/lib/api.test.ts`
- `apps/extension/src/lib/navigation.test.ts`
- `apps/extension/src/popup/helpers.ts`
- `apps/extension/src/popup/helpers.test.ts`
- `apps/extension/README.md`

Do not modify extension storage keys/settings in this child. Child `117` owns
`selectedProjectVersionId` and active-capture Project Version persistence.

### Modify: current-truth and operational documentation

- `README.md`
- `apps/docs/app/docs-content.ts`
- `apps/docs/app/docs-content.test.ts`
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/v1-dogfood-smoke-suite.md`

### Modify only during closeout

- `docs/plan/116-project-version-foundation.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Persistence And Migration Contract

### Migration strategy

Add `020_project_version_foundation.sql`; do not edit or rebaseline migrations
`001` through `019`.

The `UP` preflight must refuse with SQLSTATE `55000` if any
`project_schema.project` row exists, including archived/soft-deleted rows. The
clean target needs a non-null circular Default relationship and no truthful
backfill can infer release context for current roots. Operators reset/reseed
development and test data through migration `020`.

The migration must preserve the runtime/maintenance role split and pass the
extended schema verifier before the app starts.

Add `verify_project_version_schema`, make migration/status selection prefer it
when `020` is executed, and have it call `verify_project_membership_schema`
before checking the new tables, Default column/FK, cross-table slug guard,
lifecycle/default/content bridge triggers, audit guards, indexes, ownership,
and exact runtime privileges.

Extend the synthetic database fixture helper so tests that need a raw Project
create a valid Project/Main pair under maintenance mode. Replace the direct
Project-only inserts in foundation, Audit, Project Membership, Capture Session,
and Project database integration fixtures; do not weaken the production
non-null Default invariant for test convenience. Add the new Project Version DB
suite to `apps/server/package.json`'s explicit `test:db` file list.

### `project_schema.project_version`

Required columns:

```text
id                  varchar(26) primary key
organization_id     varchar(26) not null
project_id          varchar(26) not null
name                varchar(255) not null
description         text null
slug                varchar(100) not null
release_date        date null
position            integer not null
status              varchar(50) not null default 'active'
version             integer not null default 1       -- Row Version
created_by_id       varchar(26) not null
updated_by_id       varchar(26) not null
created_at          timestamptz not null default current_timestamp
updated_at          timestamptz not null default current_timestamp
```

Required constraints/indexes:

- `(id, project_id, organization_id)` unique for exact Default and alias FKs;
- `(project_id, position)` unique and `DEFERRABLE INITIALLY DEFERRED`, allowing
  an atomic reorder without a temporary collision;
- same-Organization Project FK `(project_id, organization_id)` to
  `project(id, organization_id)` with `ON DELETE RESTRICT`;
- same-Organization `created_by_id` and `updated_by_id` FKs with
  `ON DELETE RESTRICT`;
- `status IN ('active', 'archived')`;
- `version > 0`, `position > 0`, trimmed non-empty identifiers/name/slug;
- `char_length(name) <= 255`, `char_length(slug) <= 100`;
- canonical slug matches lowercase
  `[a-z0-9]+(?:-[a-z0-9]+)*`;
- indexes supporting `(organization_id, project_id, status, position, id)` and
  case-insensitive canonical slug resolution.

Project Version names are trimmed but not unique. Duplicate free-form display
names are allowed; IDs and slugs own identity. No semantic-version parsing or
name-derived ordering is permitted.

### `project_schema.project_version_alias`

Required columns:

```text
id                  varchar(26) primary key
organization_id     varchar(26) not null
project_id          varchar(26) not null
project_version_id  varchar(26) not null
slug                varchar(100) not null
created_by_id       varchar(26) not null
created_at          timestamptz not null default current_timestamp
```

Required rules:

- exact same-Organization/Project/Project-Version composite FK;
- same-Organization creator FK;
- case-insensitive project-scoped unique alias index;
- the same canonical slug grammar/length as Project Version;
- no `updated_*`, lifecycle, deletion, or Row Version fields;
- runtime role receives `SELECT, INSERT` only—never `UPDATE`, `DELETE`, or
  `TRUNCATE`;
- no product route deletes or reassigns an alias.

### Canonical and alias uniqueness under concurrency

Canonical slugs and aliases must share one case-insensitive namespace inside a
Project. Separate unique indexes cannot enforce cross-table uniqueness alone.
Migration `020` must add a trigger/helper that:

1. obtains a transaction-scoped advisory lock derived only from the immutable
   Project ID;
2. checks the canonical and alias tables case-insensitively;
3. excludes the same Project Version row when changing its canonical slug;
4. rejects canonical/canonical, canonical/alias, and alias/alias collisions with
   a named constraint/error;
5. runs for Project Version insert/canonical-slug update and alias insert.

Slug change order inside one audited transaction is:

1. lock and read the Project Version;
2. update the canonical slug using expected Row Version;
3. insert the former canonical slug as a permanent alias;
4. append one Audit Event covering both changes;
5. commit or roll back all steps together.

The old slug can never be reused by the same or another Project Version. A
later rename adds another alias; all aliases resolve to the Version's current
canonical slug.

### Canonical mutation lock order

All Project Version mutations for an existing Project must use one lock order
so slug, position, lifecycle, Default, and temporary legacy-root races cannot
deadlock or observe different serialization boundaries:

1. acquire the transaction-scoped advisory lock through one migration-owned
   helper derived from the immutable Project ID;
2. lock the owning Project row `FOR UPDATE` after confirming its Organization
   scope;
3. lock the target Project Version row, or all affected Project Version rows in
   ascending immutable ID order for reorder/whole-set validation;
4. perform canonical/alias namespace checks and alias inserts; and
5. write product state and Audit Evidence before committing the same
   transaction.

Repositories must not take those locks in another order. The database slug and
legacy-root bridge triggers call the same advisory-lock helper, so a trigger
cannot introduce a competing key or order. Project creation is exempt because
its Project ID is new and invisible until commit; it still creates Project,
`Main`, creator membership, and evidence in one transaction. Current
Capture/Guide/Demo root inserts acquire the advisory lock before their insert,
without locking a Project Version row, until children `117`/`118` replace the
bridge with mandatory ownership.

DB concurrency tests must run create/create, rename/rename, rename/create,
reorder/archive, set-default/archive, and set-default/current-root-insert races.
Each race must finish without a deadlock, preserve exact scope/default/order
invariants, and return either one committed winner plus a stable conflict or two
serially valid results where the operations are compatible.

### Exact Default Project Version relationship

Migration `020` must add:

```text
project_schema.project.default_project_version_id varchar(26) not null
```

and a composite foreign key:

```text
(default_project_version_id, id, organization_id)
  -> project_version(id, project_id, organization_id)
  DEFERRABLE INITIALLY DEFERRED
  ON DELETE RESTRICT
```

Because the migration requires an empty Project table, the column can be
non-null immediately. Project creation pre-generates both IDs, inserts the
Project referencing the future `Main` row, inserts `Main`, optionally inserts
the creator Project Membership, and appends one Project-created Audit Event in
the same transaction. The deferred FK validates at commit.

A database guard must reject changing a Project's default to an archived,
foreign-Project, or foreign-Organization Project Version. A second guard must
reject archiving the row referenced by `default_project_version_id`.

There is no `is_default` persistence column on Project Version. API `is_default`
is derived from the Project's exact foreign key, preventing two simultaneous
defaults.

### Explicit ordering

- positions are unique positive integers and may contain gaps when archived
  Versions retain their historical slot;
- `Main` begins at position `1`;
- create locks the owning Project row and appends at `max(position) + 1`, so
  concurrent creates cannot choose the same position;
- reorder accepts every active Project Version exactly once with each expected
  Row Version, locks all Project Version rows, takes the sorted set of current
  active position slots, and assigns those slots in request order; archived rows
  and positions never change while archived;
- list order is Default first, then other active versions by position/ID, then
  archived versions by position/ID;
- archive/restore preserves position;
- no order is inferred from name, slug, release date, creation time, or semantic
  version syntax.

### Temporary Default-only legacy-content guard

Until children `117` and `118` persist Project Version ownership, changing
`default_project_version_id` must fail if any row exists for that Project in:

- `capture_schema.capture_session`;
- `guide_schema.guide`;
- `interactive_demo_schema.interactive_demo`.

The check includes archived and soft-deleted rows. It must be concurrency-safe:

- Project Default change and inserts into each current root table obtain the
  same transaction-scoped per-Project advisory lock;
- a Default change rechecks all three tables after acquiring the lock;
- the guard returns a stable application error rather than a generic database
  failure;
- the migration comments identify this as a sequential bridge removed only
  after the affected roots have mandatory `project_version_id`.

Do not add version IDs to those roots in this migration.

### Runtime grants and database guards

The runtime role receives:

- `SELECT, INSERT, UPDATE` on `project_version`;
- `SELECT, INSERT` on `project_version_alias`;
- existing required Project-table access for Default updates.

It receives no `DELETE`/`TRUNCATE`, no alias update, no trigger privilege, and no
ownership. Maintenance owns the tables/functions.

Add mutation-context and deferred mutation-evidence triggers:

- Project Version insert: `project.create,project_version.create`;
- Project Version update:
  `project_version.update,project_version.reorder,project_version.archive,project_version.restore`;
- alias insert: `project_version.update`;
- Project Default update: extend the existing Project update guard to accept
  `project_version.set_default` without weakening existing Project commands.

Audit context is necessary but is not, by itself, a field-level authorization
boundary because the runtime role has table-wide `UPDATE` privilege. Migration
`020` must also install `project_schema.enforce_project_version_mutation_command`
as a `BEFORE INSERT OR UPDATE` trigger with these exact command semantics:

- every insert is active at Row Version `1`, has matching created/updated actor
  fields equal to the current Audit Event's actor Org User, and is permitted only for `project.create` or
  `project_version.create`;
- `id`, `organization_id`, `project_id`, `created_by_id`, and `created_at` are
  immutable after insert;
- `project_version.update` may change only `name`, `description`, `slug`, and
  `release_date`, plus the required `updated_by_id`, `updated_at`, and one-step
  Row Version increment; it cannot change status or position;
- `project_version.reorder` may change only `position` plus the required update
  metadata and one-step Row Version increment, and both `OLD.status` and
  `NEW.status` must be active;
- `project_version.archive` permits only `active -> archived`, and
  `project_version.restore` permits only `archived -> active`, with position,
  identity, canonical metadata, and release metadata unchanged and the normal
  one-step update metadata/Row Version change;
- no other transition from an archived row is allowed; and
- a command/field mismatch raises SQLSTATE `23514` with named constraint
  `project_version_mutation_command_guard` before evidence can commit.

Alias provenance needs its own database enforcement. Install
`project_schema.enforce_project_version_alias_insert` as a `BEFORE INSERT`
trigger and `project_schema.verify_project_version_slug_alias` as a deferred
constraint trigger on canonical-slug updates:

- an alias insert is permitted only under `project_version.update`, its
  `created_by_id` equals the Audit Event actor, and the same Audit Event has a
  typed Project Version `slug` Change Item whose before value equals the alias
  slug and whose after value equals the referenced Version's current canonical
  slug;
- when a canonical slug changes, commit is refused unless the old canonical
  slug now exists as an alias of that exact immutable Project Version; and
- an unrelated alias insert, a rename without its old-slug alias, or an alias
  attached to another Version fails with SQLSTATE `23514` and named constraint
  `project_version_alias_provenance_guard`.

These checks operate within the one transaction/Audit Event described above,
so repeated renames remain valid while aliases cannot become a second
user-authored URL surface.

Migration `020` must likewise install
`project_schema.enforce_project_default_mutation_command` on Project updates.
When `default_project_version_id` changes, the command must be exactly
`project_version.set_default`, the only other Project changes may be
`updated_by_id`, `updated_at`, and a one-step Project Row Version increment, and
the target must pass the active/exact-scope/legacy-content checks. Under every
other Project command, the Default ID must remain unchanged. This is separate
from merely adding `project_version.set_default` to the generic Audit guard and
prevents a `project.update` context from changing release ownership.

`verify_project_version_schema` must assert these function/trigger identities,
the non-deferrable command guards, the deferred alias-provenance check, and
their executable-owner/runtime privilege posture in addition to the generic
Audit triggers. DB tests must attempt each command with both an allowed and a
disallowed field set and prove that direct runtime SQL cannot relabel,
reparent, manufacture an alias, omit the former-slug alias, archive, restore,
reorder, or change the Default under the wrong valid Audit command.

No direct unaudited runtime write may commit.

### DOWN and rollback

`DOWN` must refuse with SQLSTATE `55000` if any of these exist:

- Project or Project Version/Alias rows;
- retained Audit Events for Project Version commands/actions;
- retained Audit Change Items identifying Project Version/Alias state;
- retained Access Events whose root resource is a Project Version.

On a clean database, `DOWN` removes the Default FK/column, triggers, functions,
indexes, tables, verifier/policy wrapper, and grants in dependency-safe order,
then restores the child `115` mutation command policy exactly. Rollback never
deletes evidence or aliases to make itself succeed.

## Shared Constants, Schemas, And Types

### Constants

`@repo/constants` adds and exports:

```ts
PROJECT_VERSION_STATUSES = ["active", "archived"] as const;
PROJECT_VERSION_RESOLUTION_KINDS = ["canonical", "alias"] as const;
```

Types:

```ts
type ProjectVersionStatus = "active" | "archived";
type ProjectVersionResolutionKind = "canonical" | "alias";
```

Do not add `latest`, `released`, `published`, `superseded`, `deprecated`, or
semantic-version constants.

### Project Version response

`ProjectVersionSchema` is strict and exposes:

```ts
{
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  description: string | null;
  slug: string;
  release_date: string | null; // YYYY-MM-DD
  position: number;
  status: "active" | "archived";
  is_default: boolean; // derived, never separately persisted
  version: number; // Row Version
  created_by_id: string;
  updated_by_id: string;
  created_at: string;
  updated_at: string;
}
```

`ProjectVersionAliasSchema` is strict:

```ts
{
  id: string;
  project_version_id: string;
  slug: string;
  created_by_id: string;
  created_at: string;
}
```

`ProjectVersionDetailSchema` extends the response with `aliases`, ordered by
`created_at, id`. The list response need not repeat aliases.

`ProjectVersionSummarySchema`, embedded in each Project response, contains:

```ts
{
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived";
  position: number;
}
```

Project responses add required `default_project_version`. It is never null and
is always active. Do not expose only a naked ID to clients that need canonical
navigation.

`ProjectSchema` remains the single client-visible authorized Project shape and
adds this required summary beside its existing `access` field. Project
list/create/detail/update response aliases continue to reference that schema;
the server must compose effective access plus Default summary before parsing or
returning a response. Persistence-only Project rows remain an internal type and
must not be passed through `ProjectSchema` before those two authorization/navigation
fields are attached. This keeps create and list contracts honest instead of
relying on an undocumented structural extension.

### Request schemas

Define reusable strict schemas:

- `CreateProjectVersionRequestSchema`
  - `name`: trimmed `1..255`;
  - `description`: trimmed nullable, max `4000`, optional;
  - `slug`: lowercase canonical slug `1..100`, optional;
  - `release_date`: validated `YYYY-MM-DD`, nullable/optional;
- `UpdateProjectVersionRequestSchema`
  - required positive `expected_version`;
  - one or more of name/description/slug/release_date;
  - unknown keys rejected;
- `ProjectVersionExpectedVersionRequestSchema`
  - positive `expected_version` for archive/restore;
- `SetDefaultProjectVersionRequestSchema`
  - positive target `expected_version`;
  - positive `expected_project_row_version`;
- `ReorderProjectVersionsRequestSchema`
  - non-empty `project_versions: [{ id, expected_version }]`;
  - trimmed IDs, positive versions, no duplicate IDs;
- `ProjectVersionListQuerySchema`
  - optional `status: active | archived`; absent returns all groups;
- ID and slug parameter schemas.

Slug normalization is deterministic and dependency-free:

- explicit slug input is trimmed/lowercased and must already satisfy the
  canonical grammar after normalization;
- omitted slug is generated from the name using Unicode normalization,
  diacritic removal where possible, lowercase ASCII alphanumerics, and collapsed
  hyphens;
- if generation produces an empty slug, return validation asking for an
  explicit slug;
- never silently append a numeric suffix. A collision returns `409` so the user
  reviews the canonical URL.

The shared-package reuse gate is satisfied: server, portal, and extension all
consume Project/Default Version contracts. No new domain package is warranted;
rules remain in the server Project Version service and persistence adapter.

## HTTP API Contract

All routes are under `/api/v1/projects/:project_id/versions` and require current
authentication plus current Project access.

### Routes

| Method  | Route                                                                   | Capability               | Success                                     |
| ------- | ----------------------------------------------------------------------- | ------------------------ | ------------------------------------------- |
| `GET`   | `/api/v1/projects/:project_id/versions`                                 | `project.read`           | `200 { project_versions }`                  |
| `POST`  | `/api/v1/projects/:project_id/versions`                                 | `project_version.manage` | `201 { project_version }`                   |
| `GET`   | `/api/v1/projects/:project_id/versions/resolve/:slug`                   | `project.read`           | `200 { project_version, resolution }`       |
| `GET`   | `/api/v1/projects/:project_id/versions/:project_version_id`             | `project.read`           | `200 { project_version }` including aliases |
| `PATCH` | `/api/v1/projects/:project_id/versions/:project_version_id`             | `project_version.manage` | `200 { project_version }`                   |
| `PUT`   | `/api/v1/projects/:project_id/versions/order`                           | `project_version.manage` | `200 { project_versions }`                  |
| `POST`  | `/api/v1/projects/:project_id/versions/:project_version_id/archive`     | `project_version.manage` | `200 { project_version }`                   |
| `POST`  | `/api/v1/projects/:project_id/versions/:project_version_id/restore`     | `project_version.manage` | `200 { project_version }`                   |
| `POST`  | `/api/v1/projects/:project_id/versions/:project_version_id/set-default` | `project_version.manage` | `200 { project, project_version }`          |

Register static `resolve`/`order` routes before the ID route.

### List and resolution behavior

- unfiltered list returns Default first, remaining active versions in explicit
  order, then archived versions in explicit order;
- `status` filters to that stored lifecycle while retaining explicit order; if
  `active`, Default remains first;
- authorized archived Projects and archived Project Versions remain readable;
- canonical resolution is case-insensitive;
- resolution returns `resolution: "canonical" | "alias"` and always returns
  the current canonical slug in `project_version.slug`;
- alias and case-only portal URLs are canonicalized by the portal; the API does
  not return an external/open redirect;
- missing, cross-Organization, cross-Project, unauthorized Project, Version,
  and alias lookups use the existing hidden `404` boundary.

### Mutation behavior

- all mutations authorize `project_version.manage` before repository writes;
- mutation service/repository queries include Organization ID, Project ID, and
  Project Version ID; IDs from URL/body are never trusted independently;
- Project archive blocks every Project Version mutation with existing
  `409 project_archived` behavior;
- create always makes an active, non-default Project Version appended to the
  explicit order;
- changing `name` does not implicitly change `slug`;
- changing `slug` permanently records the old canonical slug as an alias;
- update and lifecycle operations require the current Row Version and increment
  it exactly once on an effective change;
- no-op update, same slug, archive-already-archived,
  restore-already-active, and set-current-default do not emit Audit Events;
- archived versions can be renamed/reordered only after restore. Reads and alias
  resolution remain allowed while archived;
- the Default Project Version cannot be archived;
- restore returns an archived version to active without changing its default,
  slug, aliases, position, or child state;
- set-default requires an active target, a current target Row Version, a current
  Project Row Version, and the temporary no-legacy-content rule;
- set-default changes no existing content ownership or position;
- reorder must contain every active Version exactly once; foreign, archived,
  missing, duplicate, partial, and stale payloads are rejected atomically;
- Project Versions and aliases have no delete route.

### Stable error contract

Use `{ error: { type, message } }` with:

| Status | Type                                                   | Meaning                                                      |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| `400`  | `empty_project_version_update`                         | no mutable field supplied                                    |
| `400`  | `project_version_unchanged`                            | normalized request has no effective change                   |
| `400`  | `invalid_project_version_order`                        | duplicate/partial/foreign order payload                      |
| `400`  | `project_version_slug_required`                        | name cannot generate a usable slug                           |
| `401`  | existing unauthenticated error                         | no valid session/token                                       |
| `403`  | `project_permission_denied`                            | authenticated Project role lacks manage capability           |
| `404`  | `project_not_found`                                    | Project hidden/missing/cross-tenant                          |
| `404`  | `project_version_not_found`                            | Version/alias hidden or missing within an authorized Project |
| `409`  | `project_archived`                                     | structural mutation attempted on archived Project            |
| `409`  | `project_version_conflict`                             | stale Row Version or concurrent reorder/default change       |
| `409`  | `project_version_slug_conflict`                        | canonical or alias namespace collision                       |
| `409`  | `default_project_version_archive_forbidden`            | target is current Default                                    |
| `409`  | `project_version_legacy_content_blocks_default_change` | temporary child-116 guard                                    |

Schema validation failures remain Fastify/Zod validation responses. Do not leak
whether a hidden foreign Project/Version/alias exists.

## Project Creation Contract

Every Project creation transaction must:

1. authenticate the active Org User;
2. normalize Project input;
3. pre-generate Project ID and Main Project Version ID;
4. insert Project with `default_project_version_id = main_id`;
5. insert Project Version `{ name: "Main", slug: "main", position: 1,
status: "active" }`;
6. if the creator is a non-Owner Member, insert its explicit
   `project_admin` membership using child `115`'s atomic eligibility rule;
7. append one `project.created` Audit Event with typed Project, Default Project
   Version, and optional Membership Change Items;
8. commit all rows/evidence or roll back all of them.

The returned Project includes effective access and `default_project_version`.
No second Project Version Audit Event is emitted for the implicit `Main`
creation; it is one logical Project-create command. Direct Project Version
creation uses its own command/event.

Tests must prove rollback if Main insert, creator membership, Audit append, or
deferred Default FK verification fails.

## Authorization, Lifecycle, And Compatibility Rules

### Role matrix

| Behavior                           | Owner / Project Admin | Editor | Viewer | No membership |
| ---------------------------------- | --------------------: | -----: | -----: | ------------: |
| list/get/resolve active versions   |                   yes |    yes |    yes |  hidden `404` |
| view archived version/direct alias |                   yes |    yes |    yes |  hidden `404` |
| create/update/reorder              |                   yes |     no |     no |  hidden `404` |
| archive/restore/set default        |                   yes |     no |     no |  hidden `404` |
| inspect aliases in detail          |                   yes |    yes |    yes |  hidden `404` |

Organization Owners continue to resolve as implicit Project Admins without a
Project Membership row. Membership revocation or Org User disablement takes
effect on the next request. No result is authorized from a Project Version row
alone.

### Archived Project and Version behavior

- archived Project: Version list/get/resolve stays readable for authorized
  roles; all Version mutations are blocked; Default assignment and stored
  Version states remain unchanged;
- archived Version: directly linkable and readable, aliases resolve, displayed
  in a separate Archived selector section, unavailable as a legacy content
  creation target, and non-default by invariant;
- restoring a Project restores Version behavior from their stored states;
- restoring a Version does not restore or alter any Project/content state;
- creating a newer Version does not archive or freeze any active Version;
- existing public Publish Links remain independent and unchanged.

Update the central archived-mutation classifier so
`project_version.manage` is blocked when the Project is archived. Do not put
role or archive conditionals only in routes/UI.

Update `project_route_capability` in the same policy module so every registered
`/api/v1/projects/:project_id/versions...` template maps `GET` to
`project.read` and every `POST`/`PATCH`/`PUT` template to
`project_version.manage`. The coverage test must enumerate the exact Fastify
templates and fail if a future Version route is unclassified. Route handlers
still call the composed authorization service; this classifier is the shared
inventory/archived-Project boundary, not a replacement for scoped repository
queries.

### Backwards compatibility

- pre-live development/test databases reset and reseed; no Project row backfill
  or dual-write is supported;
- all in-repo server, portal, extension, fixture, smoke, docs, and shared
  contracts move together;
- Project response addition is required, not nullable or optional;
- `/projects/{projectId}` remains a supported portal entry and redirects to the
  canonical Default Project Version route;
- legacy authenticated content portal URLs redirect to the Default Version
  equivalent while preserving the remaining safe path and query string;
- old private API routes remain unchanged through this child and mean the
  Default workflow only. They receive explicit version IDs in children
  `117`/`118`, not an optional fallback field here;
- public `/p/*`, `/d/*`, embed, and asset URLs remain unchanged;
- project slugs and Project Version slugs are separate namespaces;
- existing Project `version` and all current mutable entity `version` fields
  remain Row Versions.

## Audit, Access, Activity, And Observability

### Audit command registry

Add:

```text
project_version.create       -> project_version.created
project_version.update       -> project_version.updated
project_version.reorder      -> project_version.reordered
project_version.archive      -> project_version.archived
project_version.restore      -> project_version.restored
project_version.set_default  -> project_version.default_set
```

All six commands require `actor_type = org_user` and permit only
`source_type = web | api`. The extension does not manage Project Versions in
this child, and `extension`, `import`, and `system` sources are rejected by the
database command policy rather than merely omitted from current routes.

Every successful mutation creates exactly one Audit Event in the same
transaction. Failed, denied, stale, validation, conflict, and no-op requests
create no successful mutation event.

Audit Event root:

- direct Version commands: `root_resource_type = project_version`,
  `root_resource_id = project_version.id`, and owning `project_id`;
- `project.create`: root remains Project while including child Version changes;
- set-default: root is the newly selected Project Version and Change Items
  include Project `default_project_version_id` and Project Row Version effects.

Allowlisted Change Items include:

- Project Version row create plus name, description, slug, release_date,
  position, status;
- scalar updates for changed fields only;
- alias row create and alias slug when canonical slug changes;
- one position change per affected Version during reorder;
- Project `default_project_version_id` change on set-default.

Do not store arbitrary request payloads, raw URLs, query strings, or JSON.

### Access coverage

Register every route. Reads use meaningful-read Access Evidence; mutations use
the audit registry's atomic command mapping and denial coverage.

On successful list, root may remain Project. On successful detail/resolve and
mutation responses, set the resolved root to immutable Project Version ID,
Organization ID, and Project ID before the Access response hook commits
evidence. A slug is never persisted as `root_resource_id`.

If Access Evidence append fails on a protected successful read, fail closed and
do not return the Project Version payload. Denials retain only safe available
scope and never reveal a hidden Version.

### Project Activity and compliance

- add all six Version actions to the curated Project Activity `project`
  category with clear summaries;
- Project Admin raw compliance automatically includes the new Audit/Access
  evidence through existing Project scoping;
- Editors see curated Version lifecycle summaries but not raw Change Items or
  security context;
- Viewers do not receive Activity/raw evidence; ordinary version metadata is a
  normal Project read;
- viewing Project Version history/list/detail produces Access Evidence but not
  an Audit mutation.

### Diagnostics

Structured server errors/log context may include safe Organization, Project,
Project Version, command, and constraint identifiers. Never log request
credentials, cookies, tokens, content, raw captured input, or private URLs.

## Portal Routes And Browser Behavior

### Canonical portal routes

Add/recognize:

```text
/projects/{projectId}/versions/{versionSlug}
/projects/{projectId}/versions/{versionSlug}/capture-sessions
/projects/{projectId}/versions/{versionSlug}/capture-sessions/{captureSessionId}
/projects/{projectId}/versions/{versionSlug}/guides
/projects/{projectId}/versions/{versionSlug}/guides/{guideId}
/projects/{projectId}/versions/{versionSlug}/guides/{guideId}/preview
/projects/{projectId}/versions/{versionSlug}/interactive-demos
/projects/{projectId}/versions/{versionSlug}/interactive-demos/{demoId}
```

Only the selected Default active Version may render current unscoped legacy
Capture/Guide/Demo pages during child `116`. Non-default and archived Version
content routes render a safe Version workspace/empty boundary and must not call
legacy Project-wide list/detail APIs.

Project-wide routes remain:

```text
/projects/{projectId}/settings
/projects/{projectId}/activity
/projects/{projectId}/compliance
```

### Redirect and alias rules

- `/projects/{projectId}` loads the authorized Project response and replaces the
  location with its Default canonical Version workspace;
- legacy content paths replace to the equivalent Default canonical Version
  path; preserve safe query string/hash, percent-encode every segment, and never
  accept a server-provided absolute redirect;
- a Version route calls the resolve API; alias or case-only matches replace only
  the Version slug segment with the returned canonical slug while preserving
  the remaining path/query/hash;
- unknown/unauthorized routes render the existing not-found boundary without
  revealing canonical/alias existence;
- direct archived canonical and alias links resolve to the read-only Version
  workspace;
- do not add `/latest`.

### Project list and creation

- Project cards link directly to
  `/projects/{id}/versions/{default_project_version.slug}`;
- after Project creation, navigate to the returned Default canonical route;
- display Default name compactly where it helps disambiguate, without a large
  management panel;
- existing Active/Archived Project filtering and membership behavior remain.

### Project Version context bar

- always display `Project name / Project Version name` on versioned workspace
  and current content pages;
- with one active Version, show compact `Main` context and a settings/manage
  affordance only for Project Admins;
- with multiple active Versions, expose a labeled native/select-style control
  ordered Default first then other active Versions;
- put archived Versions in a distinct opt-in `Archived` group/section;
- selecting another Version navigates to its canonical workspace and never
  moves content;
- show Default and Archived labels textually, not by color alone;
- long names/slugs wrap/truncate accessibly and retain full accessible text;
- loading, error, hidden/not-found, no archived results, and retry states are
  explicit.

### Version workspace

- show name, description, release date, slug, lifecycle, Default state, and
  updated time;
- Default active Version shows current Capture/Guide/Demo entry cards and
  versioned portal links;
- non-default active Version shows an honest empty version workspace and no
  unscoped legacy content counts/data;
- archived Version shows a persistent read-only banner and no create/edit
  actions;
- Project archive shows the Project archived/read-only boundary in addition to
  stored Version lifecycle;
- Editor/Viewer can navigate and read metadata but see no management actions.

### Project Settings management

Add a Project Version section below existing Project settings/membership
content:

- list Default first, active next, archived separately;
- create form with name, optional description, optional reviewed slug, and
  optional release date;
- edit name/description/release date with current Row Version;
- slug-change action separated from ordinary edit, showing that the former slug
  becomes a permanent redirect and cannot be reused;
- accessible Move up/Move down controls backed by the complete reorder payload;
  do not require drag-and-drop;
- Set Default action for active non-default Versions with confirmation;
- Archive confirmation that explains read-only behavior and refuses Default;
- Restore action for archived Versions;
- display permanent former aliases in detail/settings;
- disable the initiating control while pending, prevent duplicate submission,
  show success, map stable API errors, and retain user input after recoverable
  failures;
- after slug/default changes, replace affected local canonical links from the
  server response;
- hide mutation controls for Editor/Viewer and while Project is archived; server
  enforcement remains authoritative.

No generic modal/menu/drag dependency is added. Reuse current Button, Card,
Input, Label, Select, Alert, and native date input patterns.

## Extension Behavior

Child `116` changes presentation and deep links only:

- the extension's shared `ProjectListResponse` type consumption and synthetic
  API fixtures include required `default_project_version`; the current
  extension client does not perform runtime Zod parsing, so this child must not
  falsely claim a new parser boundary;
- each Project choice and selected/active capture summary displays
  `Project / Default Version` so `Main` remains visible;
- start Capture requests remain current Project-scoped requests and are
  understood as Default-only during this checkpoint;
- portal links use the canonical Default Version prefix returned with the
  Project, for example
  `/projects/{projectId}/versions/{slug}/capture-sessions/{captureSessionId}`;
- if an active capture's Project disappears from the refreshed list, preserve
  child `115`'s unresolved active-capture behavior and do not invent a Version;
- changing selected/active Version, storing Version IDs, version archive
  recovery, and passing `project_version_id` are deferred to child `117`.

Real unpacked-toolbar popup validation remains subject to the known browser
capability limitation. Component/API/navigation tests and a production build
must still pass; do not claim toolbar evidence if only an extension page was
automated.

## TDD Implementation Order

1. Add failing constants/types tests for statuses, DTOs, strict request schemas,
   slug/date validation, order uniqueness, and required Project Default summary.
2. Add failing migration/schema-verifier tests for tables, exact Default FK,
   actor/tenant FKs, constraints, grants, generic Audit guards, field-level
   mutation-command triggers, indexes, no JSON, and clean DOWN refusal.
3. Add failing Project Version repository/service tests for normalization,
   create/list/detail/resolve, alias namespace, canonical lock ordering, Row
   Version conflicts, lifecycle/default/order rules, and the temporary
   legacy-content guard.
4. Add failing Audit builder/registry/database-guard tests for all commands,
   project-create Main Change Items, alias creation, reorder, and set-default.
5. Implement the migration and repository/audited transaction layer until the
   real PostgreSQL tests pass.
6. Extend Project creation through failing transaction tests, then return the
   required Default summary on create/list/get/update responses.
7. Add route/app/access-policy/coverage tests, then compose the Project Version
   service once in `app.ts` using central Project authorization.
8. Add Project Activity action tests and fail-closed Access Evidence integration
   coverage.
9. Add failing portal API/path/boundary tests, then implement Default and alias
   canonicalization without a new router dependency.
10. Add failing workspace/context/management component tests, then implement the
    quiet single-Version UI and complete lifecycle states.
11. Update legacy content portal path builders and prove non-default routes do
    not call unscoped APIs.
12. Add extension contract/display/deep-link tests, then implement the Default
    context without changing storage/request payloads.
13. Extend the DB-backed smoke workflow and current-truth docs.
14. Run focused, database, broad, build, and real-browser verification; fix and
    repeat until clean.
15. Close child/master records and commit only attributable changes in small
    logical commits.

## Verification Plan

### Focused shared/server tests

Run at minimum:

```bash
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/types test
rtk pnpm --filter server exec vitest run \
  src/db/foundation-schema.test.ts \
  src/db/audit-schema-verification.test.ts \
  src/modules/audit/audit-coverage-registry.test.ts \
  src/modules/access/access-coverage-registry.test.ts \
  src/modules/project-membership/project-access.policy.test.ts \
  src/modules/project/project.service.test.ts \
  src/modules/project/project.audit.test.ts \
  src/modules/project/project.routes.test.ts \
  src/modules/project-version/project-version.repository.test.ts \
  src/modules/project-version/project-version.service.test.ts \
  src/modules/project-version/project-version.audit.test.ts \
  src/modules/project-version/project-version.routes.test.ts \
  src/modules/project-version/project-version.app.integration.test.ts \
  src/modules/project-activity/project-activity.repository.test.ts
```

Required assertions include:

- duplicate names allowed; invalid/empty names and slugs rejected;
- canonical/alias conflicts are case-insensitive and stable under concurrent
  requests;
- every existing-Project mutation follows advisory lock -> Project row ->
  stable-ID Project Version row(s) -> alias namespace order and finishes
  without deadlock under the specified races;
- old aliases remain after multiple slug changes and cannot be reassigned;
- a canonical rename cannot commit without the exact former-slug alias, and an
  arbitrary alias cannot be inserted under an otherwise-valid update command;
- cross-Organization and cross-Project IDs/aliases are hidden;
- create order is serialized; active reorder is complete, preserves archived
  slots, is atomic, and is optimistic;
- Default is exact, active, same-Project, and cannot be archived;
- stale update/archive/restore/default/reorder requests are conflicts;
- Project archive blocks Version mutations but not reads;
- Admin/Owner mutation and Editor/Viewer read-only matrix;
- Project creation returns and atomically audits `Main`;
- failed/no-op/denied operations emit no successful Audit Event;
- Activity includes curated Version actions;
- successful reads resolve Access root to immutable Version ID and fail closed
  when evidence append fails;
- temporary Default change guard includes archived/deleted legacy roots and is
  serialized against root creation.
- valid-but-wrong Audit commands cannot change immutable identity/ownership,
  metadata, lifecycle, position, or Project Default fields;
- Project Version commands reject `extension`, `import`, and `system` Audit
  sources while accepting authenticated `web | api` sources.

### Real PostgreSQL and migration checks

From a disposable configured test database:

```bash
rtk pnpm --filter server test:setup
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

Explicitly verify:

- clean `001..020` UP and schema verifier;
- migration `020` refuses a populated Project database;
- runtime grants allow intended writes and reject alias update/delete,
  Project Version delete/truncate, unaudited direct writes, and trigger bypass;
- same-Organization and same-Project composite FKs;
- circular deferred Project/Main creation commits atomically and a partial
  Project cannot commit;
- canonical-lock-order concurrency for create/slug/reorder/archive/default and
  content-root bridge races, with no deadlocks;
- field-level mutation-command triggers reject wrong-command relabel,
  reparenting, alias manufacture/omission, lifecycle, ordering, and Default
  writes even when otherwise-valid Audit context/evidence is supplied;
- populated/evidence-retaining DOWN refuses without deleting data;
- clean DOWN to `019` and UP to `020` passes;
- smoke creates Project/Main, creates a named Version, changes its slug, resolves
  the former alias, verifies role denial, and completes the existing workflow
  through the Default Version.

If `.env-cmdrc` lacks the required `testing_maintenance` profile or PostgreSQL
is unavailable, record DB verification as blocked; do not replace it with unit
claims. An explicit disposable local configuration may be used without
committing or printing credentials.

### Portal and extension component tests

```bash
rtk pnpm --filter web exec vitest run \
  src/lib/api.test.ts \
  src/lib/routes.test.ts \
  src/features/project/ProjectListPage.test.tsx \
  src/features/project/ProjectWorkspacePage.test.tsx \
  src/features/project/ProjectSettingsPage.test.tsx \
  src/features/project-version/ProjectVersionRouteBoundary.test.tsx \
  src/features/project-version/ProjectVersionContextBar.test.tsx \
  src/features/project-version/ProjectVersionManagementSection.test.tsx
rtk pnpm --filter extension test
```

Cover loading, empty/single/multiple, archived, long content, API error/retry,
permission, Project archived, slug warning/conflict, stale conflict, Default
archive denial, temporary default-change denial, reorder pending/failure, alias
redirect, legacy redirect, and non-default no-unscoped-fetch states.

### Broad checks

```bash
rtk pnpm -r --if-present test
rtk pnpm lint
rtk pnpm check-types
rtk pnpm build
rtk git diff --check
```

Reinspect `git status --short` before every commit. No unrelated file or user
change may be staged.

### Agent-browser validation requirements

Use the repository `dogfood-ossie` workflow and `agent-browser` against a clean
synthetic database. Name the session for child `116`, isolate authenticated
contexts, and do not commit cookies, tokens, private URLs, customer content, or
temporary screenshots.

Required Owner/Project Admin journey:

1. sign in and create a Project;
2. verify navigation lands at `/projects/{id}/versions/main` and compact
   `Project / Main` context is visible;
3. verify existing Default Capture/Guide/Demo entry links use the canonical
   Version prefix and current Main workflow remains reachable;
4. create a named Version with long but valid name/description and release date;
5. verify multiple-Version selector order and Default label;
6. edit metadata without changing slug;
7. explicitly change slug, reload the old URL, and verify canonical replacement
   with path/query preserved;
8. reorder Versions with keyboard-operable controls and reload to confirm;
9. open the non-default Version and confirm no unscoped legacy content request
   is made;
10. set it Default in an empty Project, verify Project entry redirect changes,
    and verify no content moved;
11. verify Default archive refusal, switch Default, archive the prior Version,
    direct-link/alias read-only behavior, archived selector separation, restore,
    and prior position/aliases;
12. create legacy content in the Default workflow and verify changing Default is
    blocked with actionable temporary-boundary copy;
13. archive the Project and confirm Version reads remain while every management
    action is unavailable/server-denied; restore Project and confirm prior
    Version states.

Required role/security journey:

- Editor and Viewer can list/select/open active and archived Versions but see no
  management actions;
- direct mutation requests receive `403` without changing state;
- removed membership and disabled Org User lose discovery immediately;
- cross-Project/cross-Organization Version IDs and aliases remain hidden;
- Project Admin Activity contains curated Version summaries; Viewer cannot open
  Activity/raw compliance.

Required responsive/accessibility evidence:

- desktop viewport such as `1440x900` and narrow mobile `390x844`;
- keyboard-only traversal of selector, forms, confirmations, reorder, archive,
  restore, and retry controls with visible focus and logical order;
- native labels, accessible names, Default/Archived text, dialog/confirmation
  focus behavior, and Escape/cancel where applicable;
- 200% zoom/reflow with long names/slugs/descriptions and no horizontal page
  overflow, overlap, clipped actions, or inaccessible content;
- loading, empty, validation, conflict, permission, Project archived, Version
  archived, and destructive confirmation states;
- console errors/unhandled rejections and network responses, including absence
  of legacy content requests on non-default Versions;
- reload/deep-link behavior for canonical, alias, case-only, archived, legacy,
  missing, and unauthorized routes.

Extension evidence:

- component/build evidence must verify `Project / Default Version` display and
  canonical Default-prefixed portal links;
- attempt real unpacked toolbar validation only if the environment can genuinely
  load/control it. Otherwise record that surface blocked exactly as child `115`
  did; do not claim an extension page as toolbar-popup evidence.

Close named sessions, stop services started for evidence, and remove temporary
safe fixtures/screenshots after the run.

## Acceptance Criteria

- every newly created Project commits with exactly one active `Main` Default
  Project Version and no partial Project can commit;
- every Project response contains a usable canonical Default summary;
- Version names/slugs/lifecycle/order/default and permanent aliases follow the
  accepted rules under concurrency;
- Organization/Project ownership is enforced in every query and mutation;
- all current Project roles match the accepted read/manage matrix through one
  central authorization boundary;
- archived Projects/Versions preserve state and read access while blocking the
  correct mutations;
- Project Version mutations and reads have complete Audit/Access coverage with
  correct root identity and no misleading events;
- Project entry and former-slug routes canonicalize without `/latest`, open
  redirects, or broken query/path suffixes;
- one-Version teams see compact `Main` context and retain the current workflow;
- current unscoped content is never shown as belonging to a non-default Version,
  and Default cannot change after legacy roots exist;
- extension and portal consume the required Default contract together without
  falsely claiming Capture version persistence;
- migration UP/DOWN/refusal, schema verification, DB, smoke, focused, broad,
  build, and required browser checks pass or a real unavailable capability is
  recorded honestly;
- child `117` can add mandatory Capture Session ownership without changing
  Project Version identity, authorization, slug, default, or URL semantics.

## Commit Strategy

Keep logical boundaries separate where practical and stage explicit paths:

1. `feat(types): add project version contracts`
2. `feat(server): add project version persistence`
3. `feat(server): add project version lifecycle APIs`
4. `feat(portal): add project version navigation`
5. `feat(portal): add project version management`
6. `feat(extension): show default project version context`
7. `docs(plan): close project version foundation`

Do not amend child `115` commits or mix unrelated cleanup into this child.

## Expansion And Recheck Checklist

- [x] Confirmed children `112` through `115` and clean starting baseline
      `360b6ca`.
- [x] Re-read `CONTEXT.md`, ADRs `0021`, `0022`, and `0024`, child `111`, the
      detailed grill decisions, master `005`, child `115` closeout, and child
      `117`/`118` ownership boundaries.
- [x] Inspected current migrations, Project creation, Project Membership policy,
      Audit/Access registries and guards, Project Activity, app composition,
      shared contracts, portal parser/pages, extension contracts/deep links,
      smoke tests, and operational documentation.
- [x] Defined exact schema, constraints, API contracts, errors, behavior,
      authorization, evidence, migration/reset, compatibility, UI, extension,
      tests, browser evidence, non-scope, and handoff.
- [x] Resolved the stale Capture/Artifact acceptance wording without moving
      child `117`/`118` persistence into this child.
- [x] Classified all remaining choices as reversible implementation details;
      no critical decision, mini-grill, new ADR, or user input is required.
- [x] Rechecked the expanded plan against master `005`, implemented child
      `115`, and current code; tightened field-level database mutation guards,
      canonical lock ordering, route classification, source policy, and the
      authorized Project response contract.
- [x] Format, whitespace-check, and commit only this plan/docs checkpoint.

## Delivery Checklist

- [ ] Record implementation start commit and worktree ownership.
- [ ] Establish failing tests before each behavior slice.
- [ ] Add shared contracts and migration `020`.
- [ ] Implement audited persistence, exact Default, aliases, concurrency, and
      temporary legacy-content guard.
- [ ] Implement authorized APIs, Access coverage, Activity, and app composition.
- [ ] Update Project creation and all Project responses transactionally.
- [ ] Implement portal canonical routes, context, lifecycle management, and
      legacy redirects.
- [ ] Update extension Default context without pulling child `117` forward.
- [ ] Update current-truth/operations docs.
- [ ] Pass focused, DB, smoke, broad, build, and real-browser verification.
- [ ] Recheck the completed implementation against this plan/master until clean.
- [ ] Update status, implementation log, verification record, leftovers, and
      parent completed items together.
- [ ] Commit only attributable changes in small logical commits.

## Implementation Log

Not started. This expansion and readiness recheck changed planning
documentation only. The recheck found that generic Audit mutation context did
not by itself prevent a valid command from changing the wrong Project Version
fields, and that per-operation locking had no single stated order. The plan now
requires field-level database command triggers, a canonical advisory/row/alias
lock order, exact Project Version route classification, explicit `web | api`
source policy, and composition of the required Default summary into every
authorized Project response.

## Verification Record

Planning verification only:

- predecessor child `115` is closed and the starting worktree was clean;
- relevant current source, routes, schema, contracts, tests, client paths, and
  accepted decisions were inspected on 2026-07-19;
- the readiness recheck compared master `005`, child `115`'s implemented
  handoff, migration `019`, current Audit/database guards, central Project
  capability classification, Project contracts/repository, and children
  `117`/`118` ownership boundaries;
- `rtk pnpm exec prettier --check
docs/plan/116-project-version-foundation.md` and `rtk git diff --check` passed
  after the recheck edits;
- implementation, migration, database, API, portal, extension, and browser
  verification have not run and are not claimed by this planning checkpoint.

## Leftovers And Handoff

Implementation has not started. On successful closeout, hand child `117`:

- mandatory Project Version IDs and exact same-Project/Organization FK pattern;
- canonical/default summaries and active/archived selection ordering;
- central Project read/manage authorization and archived-Project mutation rule;
- the advisory-lock key used to serialize Default changes and current root
  creation;
- the temporary Default-only guard, to remove only when Capture Sessions have
  mandatory version ownership and the remaining Guide/Demo guard stays safe for
  child `118`;
- portal/extension canonical Default context and the explicit requirement to
  persist selected/active Capture Project Version rather than infer it later;
- the rule that an empty unstarted Capture may change Version, while capture
  start/first Event/Asset locks provenance.

Hand child `118` the remaining Guide/Demo side of the temporary Default-change
guard and canonical version route prefix. Hand children `119`/`120` alias-safe
authenticated Revision routes and unchanged public Publish Link boundaries.

Known environment limitations inherited from child `115` remain evidence
limitations, not implementation scope:

- real unpacked-extension toolbar automation may be blocked;
- child `114`'s injected failing-Access-writer browser harness may be blocked;
- neither limitation permits manufacturing browser evidence.
