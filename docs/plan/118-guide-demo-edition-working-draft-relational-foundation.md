# Child Plan 118: Guide And Demo Edition And Working Draft Relational Foundation

Date reserved: 2026-07-12

Date expanded: 2026-07-19

Date rechecked: 2026-07-19

Date implemented and closed: 2026-07-19

Status: Complete. Relational Guide/Demo Artifact, Edition, Working Draft, and
typed child ownership is implemented. Mandatory browser dogfood is recorded
with one precise pre-existing authentication Audit blocker.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate And Planning Baseline

Prerequisite:

- Child `117` is implemented and closed at commit `e79ed97`
  (`docs(plan): close capture version recheck`).
- Children `112` through `116` are complete and provide Audit/Access Evidence,
  Project Membership, and Project Version foundations.
- The worktree was clean when this expansion began. Recheck `git status` and the
  current `HEAD` immediately before implementation because later agents may have
  changed these files.

Next child:

- `119` Guide And Demo Revision, Carry-Forward, And Protected Assets, only after
  this child's relational ownership, lifecycle, concurrency, migration, and
  browser acceptance checks pass.

Canonical inputs reread for this expansion:

- `CONTEXT.md`;
- accepted ADRs `0002`, `0003`, `0004`, `0005`, `0006`, and `0021` through
  `0026`;
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`;
- the implemented closeout and code from
  `docs/plan/117-capture-source-version-scoping.md`;
- the current Guide, Interactive Demo, Publish, Audit, Access, Project Version,
  shared-contract, portal-route, and test implementations.

No additional grill is required. Child `111` and the accepted ADRs already
decide the semantics needed here. The concrete schema and API details below are
reversible implementation choices inside those accepted boundaries.

## Goal

Replace the alpha Guide and Interactive Demo roots, which currently combine
stable identity, editable metadata, lifecycle, and Working Draft state, with:

1. one immutable, Project-owned, type-specific stable Artifact identity;
2. at most one Artifact Edition for each Artifact and Project Version;
3. exactly one mutable Working Draft for every Edition;
4. type-specific relational authored content with no Working Draft JSON/JSONB;
5. explicit Row Version conflict protection for Edition metadata/lifecycle and
   Working Draft mutation batches.

Guide and Interactive Demo behavior must remain separate. This child must leave
the database and repository ready for child `119` to checkpoint and copy the
relational Working Draft without another ownership rewrite.

## Current Implemented Baseline

The implementation agent must treat these as current facts, not future claims:

- Migration `021` makes `capture_schema.capture_session.project_version_id`
  mandatory and immutable after capture begins. Capture Event and Capture Asset
  scope derives from their Session.
- Guide generation and Interactive Demo generation currently work only when the
  Capture Session belongs to the current Default Project Version. Both paths
  already take the Project advisory lock and reject the temporary mismatch with
  `capture_artifact_version_not_ready`.
- `guide_schema.guide` and
  `interactive_demo_schema.interactive_demo` currently combine Project-owned
  identity, Capture provenance, title, description, `draft | archived`, soft
  deletion, and a `version` counter.
- Guide Blocks and Guide Steps are relational, but `guide_block.content` is
  JSONB and stores block text plus Guide Annotations. Guide Annotation has no
  table.
- Demo Scenes and Demo Hotspots are relational, but a Demo Transition is
  represented by `demo_hotspot.target_scene_id` rather than its own record.
- Existing repositories increment root and child `version` columns but the
  Guide/Demo HTTP mutation contracts do not require caller-supplied Row
  Versions. This child must make the concurrency contract real rather than
  merely incrementing counters.
- Authenticated portal URLs already use
  `/projects/:projectId/versions/:versionSlug/...`, but the Project Version route
  boundary renders Guide/Demo content only for the active Default Version.
- Guide/Demo APIs remain Project-nested and currently omit explicit Project
  Version scope.
- Project authorization is centralized. Project Admins and Editors have
  `artifact.write`; Viewers have `artifact.read`. Archived Projects are already
  effective read-only wrappers.
- Publishing still stores immutable JSON snapshots in
  `publish_schema.published_artifact.snapshot_json` and public `/p/*`, `/d/*`,
  and embed readers consume those snapshots.
- Audit mutation guards and route/table coverage are repository-wide. Any new
  mutable table or command must be registered in the same change set.

## Fixed Decisions For This Child

1. Retain the existing type-specific root table names
   `guide_schema.guide` and
   `interactive_demo_schema.interactive_demo`, but make those rows immutable
   identity-only records. Do not introduce a universal Artifact table.
2. Add type-specific Edition and Working Draft tables. Do not use a generic
   content table, entity-attribute-value model, discriminated JSON payload, or
   shared Guide/Demo child table.
3. Stable identity owns only tenant/Project identity and creation provenance.
   It owns no title, description, lifecycle, soft-delete flag, mutable
   `updated_*` fields, or Row Version.
4. Edition owns title, description, `draft | archived`, Project Version,
   optional immediate Capture provenance, audit fields, and its own Row Version.
5. Working Draft owns a separate aggregate Row Version. Every committed content
   mutation transaction increments it exactly once. Child-row `version` values
   remain internal Row Versions for typed Audit Change Items; they are not
   Artifact Revision Numbers.
6. Every Edition is created transactionally with exactly one Working Draft.
   There is no endpoint that creates a bare Artifact, bare Edition, or second
   Working Draft.
7. Generation from Capture derives the Edition Project Version from the
   immutable Capture Session. It never accepts a caller-selected target Version
   and no longer compares the Session to the current Default.
8. Existing Project-nested API paths remain stable. Explicit
   `project_version_id` is required in collection/detail/export/publish query
   contracts and in direct-create bodies. Nested Working Draft mutations require
   it in their query contract. There is no omitted-value Default fallback.
9. Authenticated portal URLs continue to use the accepted Project Version slug
   routes. Legacy Project-only URLs continue to redirect to the current Default
   Version URL; no `/latest` route is introduced.
10. Edition archive and restore are explicit commands. Stable Artifacts cannot
    be archived or deleted in this child. The existing Interactive Demo root
    DELETE route is removed rather than reinterpreted as global deletion.
11. Guide block text becomes explicit nullable `title` and `body` columns with
    type constraints. Guide Annotations become ordered relational children of a
    Guide Step. `guide_block.content` is removed.
12. Demo Transition becomes a separate optional one-to-one relational child of
    Demo Hotspot. `demo_hotspot.target_scene_id` is removed.
13. Working Draft child deletion remains a soft/tombstone mutation so current
    audited delete behavior and stable child IDs remain intact. These tombstones
    are internal authoring state, not Edition lifecycle, immutable history, or
    an Artifact Revision.
14. Child `118` deploys independently. Existing immutable publication snapshots
    remain the staged legacy JSON boundary that master `005` explicitly assigns
    to child `120`; this is not a new accepted persistence exception and the
    clean ADR `0025` target must not be claimed complete before child `120`.
    No JSON is written for Working Draft state.
15. Until child `120`, creating a new immutable Publication is allowed only from
    the Edition in the Project's current Default Version. Status, revoke,
    visibility, expiry, and password management for an already-existing stable
    Artifact Publish Link remain available from any authorized Edition route for
    that Artifact, including after the Project Default changes. A non-Default
    Edition with no existing link shows a clear deferred-publishing notice and
    does not issue a publish request. Existing public readers, embeds, link
    access rules, immutable snapshot behavior, and asset delivery remain
    unchanged.
16. The transition is pre-live and intentionally breaking. Migration `022`
    refuses retained Guide, Demo, or related Publication data; disposable
    databases are reset and reseeded. There is no backfill, legacy view,
    dual-write, API alias, or mixed-schema mode.

## Scope

### In scope

- clean Guide and Interactive Demo identity/Edition/Working Draft persistence;
- Edition metadata, lifecycle, and Row Version behavior;
- aggregate Working Draft Row Version behavior;
- relational Guide Block/Step/Annotation persistence;
- relational Demo Scene/Hotspot/Transition persistence;
- same-Version immediate Capture provenance and new Capture Asset selection,
  while retaining same-Project Protected Shared Asset references needed by
  child `119` Carry-Forward;
- create, generate, list, read, edit, archive, restore, block/scene/hotspot
  mutation, preview, and export contracts;
- named and archived Project Version read behavior;
- active named Project Version authoring;
- temporary Default-Version-only authenticated publishing compatibility;
- Audit/Access coverage, typed change items, activity labels, and migration
  guards for all changed commands/tables;
- coordinated shared contracts, server, portal, fixtures, tests, operational
  notes, and route inventory;
- real-browser validation for the changed portal workflows.

### Explicit non-scope

- Artifact Revisions, manual checkpoints, Working Draft restore, Revision
  numbering, or immutable relational history;
- Carry-Forward, source-Edition lineage, multi-Artifact batch copy, branching,
  merging, or synchronization;
- Protected Shared Asset reference counting or physical purge protection; child
  `119` owns the complete Working Draft/Revision/Publication graph and purge
  workflow. Child `118` must nevertheless use restrictive authored-reference
  foreign keys and must not make current referenced-asset behavior weaker.
- publication-sequence renaming, relational Published Artifact content,
  multi-version Publish Link entries, link rollback, viewer version selectors,
  or canonical public version paths; child `120` owns these;
- changing public visibility/password/expiry/revocation semantics;
- global Artifact purge or deletion;
- Guide-to-Demo or Demo-to-Guide conversion;
- Documentation, Video, search, analytics, AI generation, collaboration, or
  editor visual modernization;
- extension protocol or capture-write changes;
- a generic Artifact service/package/table or universal authored-content model;
- new JSON/JSONB, generic metadata, or serialized relational content;
- user/customer data migration.

## Exact Affected Files

The implementation must remain inside this inventory. If current-code drift
requires another file, document the reason in the implementation log before
editing it.

### Plan and operational records

- `docs/plan/118-guide-demo-edition-working-draft-relational-foundation.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  (closeout only)
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/development-setup.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`

`CONTEXT.md` and accepted ADRs already contain the target semantics and should
not change unless implementation uncovers a genuinely new critical decision.

### Shared constants and contracts

- `packages/constants/src/artifact-edition.ts` (new)
- `packages/constants/src/constants.test.ts`
- `packages/constants/src/index.ts`
- `packages/constants/src/guide.ts`
- `packages/constants/src/demo.ts`
- `packages/types/src/guide.ts`
- `packages/types/src/guide.test.ts`
- `packages/types/src/demo.ts`
- `packages/types/src/demo.test.ts`
- `packages/types/src/publish.ts`
- `packages/types/src/publish.test.ts`
- `packages/capture-domain/src/errors/capture-domain-error.ts`

Use a shared `ARTIFACT_EDITION_STATUSES = ["draft", "archived"]` lifecycle
constant because lifecycle semantics are shared. Guide/Demo content contracts
remain type-specific. Remove the misleading root-owned `GUIDE_STATUSES` and
`INTERACTIVE_DEMO_STATUSES` usages in the coordinated break.

### Guide and Demo domain packages

- `packages/guide-domain/src/types/guide-domain.ts`
- `packages/guide-domain/src/policies/guide-generation-policy.ts`
- `packages/guide-domain/src/policies/guide-generation-policy.test.ts`
- `packages/guide-domain/src/policies/guide-update-policy.ts`
- `packages/guide-domain/src/policies/guide-update-policy.test.ts`
- `packages/guide-domain/src/policies/guide-block-policy.ts`
- `packages/guide-domain/src/policies/guide-block-policy.test.ts`
- `packages/guide-domain/src/policies/guide-export-policy.ts`
- `packages/guide-domain/src/policies/guide-export-policy.test.ts`
- `packages/guide-domain/src/errors/guide-domain-error.ts`
- `packages/demo-domain/src/types/demo-domain.ts`
- `packages/demo-domain/src/policies/demo-input-policy.ts`
- `packages/demo-domain/src/policies/demo-input-policy.test.ts`
- `packages/demo-domain/src/policies/demo-generation-policy.ts`
- `packages/demo-domain/src/policies/demo-generation-policy.test.ts`
- `packages/demo-domain/src/policies/demo-scene-policy.ts`
- `packages/demo-domain/src/policies/demo-scene-policy.test.ts`
- `packages/demo-domain/src/policies/demo-hotspot-policy.ts`
- `packages/demo-domain/src/policies/demo-hotspot-policy.test.ts`
- `packages/demo-domain/src/errors/demo-domain-error.ts`
- `packages/publish-domain/src/errors/publish-domain-error.ts`
- `packages/publish-domain/src/types/publish-domain.ts`
- `packages/publish-domain/src/policies/publish-snapshot-policy.ts`
- `packages/publish-domain/src/policies/publish-snapshot-policy.test.ts`

Publish-domain changes are compatibility projections only: build the existing
immutable snapshot DTO from the selected Default Edition's relational Working
Draft. Do not redesign publication persistence here.

### Database and composition

- `apps/server/src/db/migrations/022_guide_demo_edition_working_draft_relational_foundation.sql`
  (new)
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/migrate.ts`
- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/modules/project-version/project-version.db.integration.test.ts`
- `apps/server/src/modules/capture-session/capture-session.db.integration.test.ts`

Do not edit migrations `001` through `021`; migration `022` must transform the
empty legacy schema and update guards/functions explicitly.

### Guide server module

- `apps/server/src/modules/guide/guide.repository.ts`
- `apps/server/src/modules/guide/guide.service.ts`
- `apps/server/src/modules/guide/guide.routes.ts`
- `apps/server/src/modules/guide/guide.audit.ts`
- `apps/server/src/modules/guide/guide-screenshot-upload.audit.ts`
- `apps/server/src/modules/guide/guide.service.test.ts`
- `apps/server/src/modules/guide/guide.routes.test.ts`
- `apps/server/src/modules/guide/guide.audit.test.ts`
- `apps/server/src/modules/guide/guide.app.integration.test.ts`
- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/modules/guide/guide-html-export.ts`
- `apps/server/src/modules/guide/guide-html-export.test.ts`
- `apps/server/src/modules/guide/guide-zip-export.ts`
- `apps/server/src/modules/guide/guide-zip-export.test.ts`

### Interactive Demo server module

- `apps/server/src/modules/interactive-demo/interactive-demo.repository.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.audit.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.app.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts`

### Publish compatibility, evidence, and smoke

- `apps/server/src/modules/publish/publish.repository.ts`
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/publish/publish.service.ts`
- `apps/server/src/modules/publish/publish.service.test.ts`
- `apps/server/src/modules/publish/publish.routes.ts`
- `apps/server/src/modules/publish/publish.routes.test.ts`
- `apps/server/src/modules/publish/publish.app.integration.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.audit.ts`
- `apps/server/src/modules/publish/publish.audit.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/audit/audit.db.integration.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/access/access.db.integration.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

### Portal API, routing, and Guide UI

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/guide/types.ts`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.module.css`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.module.css`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/guide/GuideScreenshotViewer.tsx`
- `apps/web/src/features/guide/GuideScreenshotViewer.test.tsx`
- `apps/web/src/features/guide/guideEditorHelpers.ts`
- `apps/web/src/features/guide/guideEditorHelpers.test.ts`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`

### Interactive Demo UI

- `apps/web/src/features/interactive-demo/types.ts`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.module.css`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.ts`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.test.ts`

Public reader/viewer components and their CSS are verification-only and should
not require product changes:

- `apps/web/src/features/guide/PublicGuideReaderPage.test.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx`

The extension is explicit non-scope. No file under `apps/extension` should
change.

## Migration `022` And Relational Schema

### Refusal and transaction boundary

Migration `022` must run in one transaction and fail with SQLSTATE `55000` and a
clear reset/reseed message when any of these exist:

- a Guide, Guide Block, or Guide Step row;
- an Interactive Demo, Demo Scene, or Demo Hotspot row;
- a `published_artifact` or `publish_link` for `guide` or `interactive_demo`.

Check all tables rather than relying only on roots because current soft deletion
and polymorphic Publication relationships can leave logically related rows. The
migration must not truncate or silently discard retained records.

### Guide identity

Transform `guide_schema.guide` into:

```text
id                 varchar(26) primary key
organization_id    varchar(26) not null
project_id         varchar(26) not null
created_by_id      varchar(26) not null
created_at         timestamptz not null
```

Requirements:

- composite unique key `(id, project_id, organization_id)`;
- Organization and Project foreign keys retain tenant isolation;
- core ownership and authored-reference foreign keys introduced by `022` use
  `ON DELETE RESTRICT`, not cascades. Reset/rollback drops empty tables with
  maintenance credentials; runtime deletion must never erase an Edition,
  Working Draft, child content, or evidence transitively;
- remove Capture source, title, description, status, deletion, update, and
  `version` columns;
- runtime INSERT only through first-Edition creation; no UPDATE/DELETE command;
- comment identifies this as immutable stable Guide Artifact identity.

### Guide Edition

Create `guide_schema.guide_edition`:

```text
id                         varchar(26) primary key
organization_id            varchar(26) not null
project_id                 varchar(26) not null
guide_id                   varchar(26) not null
project_version_id         varchar(26) not null
source_capture_session_id  varchar(26) null
title                      varchar(255) not null
description                text null
status                     varchar(50) not null default 'draft'
version                    integer not null default 1
created_by_id              varchar(26) not null
updated_by_id              varchar(26) not null
created_at                 timestamptz not null
updated_at                 timestamptz not null
```

Constraints and indexes:

- scoped `ON DELETE RESTRICT` FKs to Guide identity and Project Version;
- unique `(guide_id, project_version_id)`;
- scoped unique `(id, guide_id, project_version_id, project_id,
organization_id)` for downstream relational ownership;
- optional immediate source Session uses a scoped `ON DELETE RESTRICT` FK and
  must match the same Organization, Project, and Project Version;
- nonblank title, status only `draft | archived`, positive Row Version;
- list index `(organization_id, project_id, project_version_id, status,
created_at desc, id desc)`;
- no uniqueness constraint on title or description.

Add the scoped Capture Session key needed by the Edition/source FK without
duplicating Version onto Capture Event/Asset.

### Guide Working Draft and content

Create `guide_schema.guide_working_draft`:

```text
id                varchar(26) primary key
organization_id   varchar(26) not null
project_id        varchar(26) not null
guide_edition_id  varchar(26) not null unique
version           integer not null default 1
created_by_id     varchar(26) not null
updated_by_id     varchar(26) not null
created_at        timestamptz not null
updated_at        timestamptz not null
```

Use a deferred constraint trigger to prove every inserted Edition has exactly
one Working Draft at transaction commit. Runtime grants/guards must prohibit
standalone Working Draft deletion.

Rebuild the empty `guide_block` and `guide_step` tables around
`guide_working_draft_id`; remove redundant `guide_id` and JSON `content`.

`guide_block` retains ordering, block type, tombstone/audit fields, and its Row
Version, and adds explicit nullable `title` and `body` columns. Enforce:

- `header`: nonblank `title`, null `body`;
- `paragraph`: null `title`, nonblank `body`;
- `tip | alert`: at least one nonblank `title` or `body`;
- `divider | step | capture | gif`: both null;
- one active block per positive `block_index` in a Working Draft.

`guide_step` is the one-to-one child for an active `step` block. It owns title,
body, immediate source Capture Session/Event/Asset provenance, selected Capture
Asset, `screenshot_hidden`, tombstone/audit fields, and its Row Version. Enforce
one active Step per step block and prohibit a Step for any other block type.

Create `guide_schema.guide_annotation`:

```text
id                       varchar(26) primary key
organization_id          varchar(26) not null
project_id               varchar(26) not null
guide_working_draft_id   varchar(26) not null
guide_step_id            varchar(26) not null
annotation_type          varchar(50) not null
annotation_index         integer not null
x, y, width, height      numeric(8,6) not null
is_deleted               boolean not null default false
deleted_at               timestamptz null
deleted_by_id            varchar(26) null
version                  integer not null default 1
created_by_id            varchar(26) not null
updated_by_id            varchar(26) not null
created_at               timestamptz not null
updated_at               timestamptz not null
```

Enforce `highlight`, normalized boxes inside `[0,1]`, positive ordering, no more
than ten active annotations per Step, and unique active annotation order.
Annotation scope must match the Step and Working Draft.

Immediate source Session/Event/source-Asset combinations created by generation
must belong to the Edition's exact Project Version. A new user-selected or
uploaded screenshot must also come from the Edition's Version in this child.
Persisted selected/display Asset references are scoped with restrictive
Organization + Project foreign keys, not a permanent same-Version FK: child
`119` must be able to clear copied source Session/Event provenance and reuse an
immutable Protected Shared Asset from the source Version without rewriting the
Asset or this ownership model. Cross-Organization/Project Assets always fail.
Preserve original Capture rows; Guide edits only change Guide-owned references
or create the existing derived upload Asset.

### Interactive Demo identity, Edition, and Working Draft

Transform `interactive_demo_schema.interactive_demo` to the same immutable
identity column set as Guide, with composite tenant/Project uniqueness.

Create `interactive_demo_schema.interactive_demo_edition` with the same
ownership, metadata, lifecycle, provenance, restrictive FK, Row Version, unique
Artifact/Project-Version, and list-index rules as Guide Edition.

Create `interactive_demo_schema.interactive_demo_working_draft` with the same
one-to-one, deferred exactly-one, audit, and Row Version rules as Guide Working
Draft.

### Demo Scene, Hotspot, and Transition

Rebuild empty `demo_scene` around `interactive_demo_working_draft_id`. Retain
explicit title, description, immediate source Capture provenance, background
Capture Asset, positive order, tombstone/audit fields, and Row Version. Enforce
one active scene per index in a Working Draft. Generation provenance and new
user background selection must match the Edition Version; the persisted
background Asset FK is permanently Organization/Project-scoped so child `119`
can reuse the same Protected Shared Asset after clearing copied Session/Event
provenance during Carry-Forward.

Rebuild `demo_hotspot` around `interactive_demo_working_draft_id` and
`demo_scene_id`. Retain type, label, content, normalized rectangle, positive
order, tombstone/audit fields, and Row Version. Remove `target_scene_id`.

Create `interactive_demo_schema.demo_transition`:

```text
id                                varchar(26) primary key
organization_id                   varchar(26) not null
project_id                        varchar(26) not null
interactive_demo_working_draft_id varchar(26) not null
demo_hotspot_id                   varchar(26) not null
target_scene_id                   varchar(26) not null
is_deleted                        boolean not null default false
deleted_at                        timestamptz null
deleted_by_id                     varchar(26) null
version                           integer not null default 1
created_by_id                     varchar(26) not null
updated_by_id                     varchar(26) not null
created_at                        timestamptz not null
updated_at                        timestamptz not null
```

Allow at most one active Transition per Hotspot. Source Hotspot and target Scene
must be active children of the same Working Draft, Project, and Organization.
The existing trigger from migration `013` must be replaced, not left pointing at
the removed Hotspot column.

### Lifecycle and database mutation guards

Replace the legacy Default-Version Guide/Demo insertion triggers from migrations
`020`/`021` with Edition-aware guards:

- take `project_schema.lock_project_version_scope(project_id)` before Artifact,
  Edition, Working Draft, or authored-child mutation;
- Artifact/first-Edition creation requires an active Project and active target
  Project Version;
- Edition metadata/content writes require active Project, active Project
  Version, and Edition `draft`;
- Edition archive requires current `draft`; restore requires current `archived`;
- archived Project Version/Edition records remain readable;
- changing the Project Default must no longer be blocked merely because scoped
  Guide/Demo Editions exist;
- identity scope, Edition Project Version, and Working Draft ownership are
  immutable after insert;
- current child-`118` generation, picker, upload, Step, and Scene commands must
  validate selected/background Assets against the Edition Version under the
  Project lock even though the durable Asset FK is only Organization/Project
  scoped. Child `119` may add only its audited Carry-Forward command as the
  explicit cross-Version reuse path, and that command must clear copied source
  Session/Event provenance;
- maintenance bypass remains restricted to the accepted maintenance role.

Update Audit mutation policy functions, table/command coverage records, entity
type constraints, and runtime grants. Add a chained
`verify_artifact_edition_schema` export in `audit-schema-verification.ts`; it
must call `verify_project_version_schema` first and then verify every post-`022`
table, column, constraint, trigger, mutation-coverage row, and runtime grant.
Both applied-migration branches in `migrate.ts` must select it at migration
`022`, with a focused source-selection regression in
`audit-schema-verification.test.ts`. Fresh `001` through `022`, status
verification, refusal, DOWN refusal with data, empty DOWN/UP, and runtime-role
behavior must all be tested.

## Shared Types And DTO Contracts

### Common lifecycle

Add:

```ts
type ArtifactEditionStatus = "draft" | "archived";
```

All persisted/output `version` fields in this child are documented as Row
Versions. Do not add `revision`, `revision_number`, `publication_sequence`, or
ambiguous user-visible “version number” aliases.

### Guide contracts

Define type-specific schemas:

```ts
GuideArtifactSchema = {
  id,
  organization_id,
  project_id,
  created_by_id,
  created_at,
};

GuideEditionSchema = {
  id,
  organization_id,
  project_id,
  guide_id,
  project_version_id,
  source_capture_session_id,
  title,
  description,
  status,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at,
};

GuideWorkingDraftSchema = {
  id,
  organization_id,
  project_id,
  guide_edition_id,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at,
};
```

`GuideBlockSchema` exposes explicit `title` and `body`, no `content`. A Step owns
`annotations: GuideAnnotation[]`; each Annotation exposes its Step/Draft IDs,
type, order, coordinates, and Row Version. `display_capture_asset_id` remains a
read-only derived DTO value.

```ts
GuideSummarySchema = {
  artifact: GuideArtifact,
  edition: GuideEdition,
  authored_updated_at: IsoDateTimeString
}
GuideDetailSchema = {
  artifact: GuideArtifact,
  edition: GuideEdition,
  working_draft: GuideWorkingDraft,
  authored_updated_at: IsoDateTimeString,
  guide_blocks: GuideBlock[],
  source_capture_assets: GuideSourceCaptureAsset[]
}
```

`authored_updated_at` is a derived read-model value equal to the later of
Edition `updated_at` and Working Draft `updated_at`; it is not persisted domain
state. Publish freshness UI must use it because stable identity has no mutable
timestamp and metadata-only edits do not change the Working Draft.

List response becomes `{ guide_editions: GuideSummary[] }`. Mutation responses
return the changed Edition or child plus the latest `working_draft` whenever
content changed, so the client can send the next expected Row Version.

### Interactive Demo contracts

Define `InteractiveDemoArtifact`, `InteractiveDemoEdition`, and
`InteractiveDemoWorkingDraft` schemas parallel to Guide, but keep Scene,
Hotspot, and Transition schemas type-specific.

`DemoHotspotSchema` removes `target_scene_id` and adds
`transition: DemoTransition | null`. Create/update hotspot input uses:

```ts
transition?: { target_scene_id: string } | null;
```

Omitted transition preserves it; `null` removes it; an object creates or updates
it. Responses that mutate Scene/Hotspot content include the latest
`working_draft`.

List response becomes
`{ interactive_demo_editions: InteractiveDemoSummary[] }`. Detail response
contains `{ artifact, edition, working_draft, authored_updated_at }` with the
same derived timestamp rule; the existing Scene and Hotspot collection routes
remain separate.

### Required concurrency fields

- Edition metadata PATCH: `expected_edition_version`.
- Edition archive/restore: `expected_edition_version`.
- Every Guide block/step/screenshot/annotation/reorder/delete mutation:
  `expected_working_draft_version`.
- Every Demo scene/hotspot/transition/reorder/delete mutation:
  `expected_working_draft_version`.
- Screenshot upload carries `expected_working_draft_version` as a validated
  multipart field.

Use one aggregate CAS in the same transaction as child writes. A stale expected
value returns `409`; it must not write a child row, file/Asset, Audit Event, or
increment any Row Version. Valid no-op requests return current state without an
Audit Event or Row Version increment.

All changed mutation/query schemas are strict for recognized fields. Legacy
root `status`, `content`, omitted Project Version, unknown ownership IDs, and
unknown concurrency aliases return `400` instead of being silently accepted or
dropped by `.passthrough()` parsing.

## HTTP API Contracts

All paths retain `/api/v1` and current Project nesting. All
`project_version_id` query values are required, trimmed IDs.

### Guide

```text
GET   /api/v1/projects/:project_id/guides?project_version_id=:id
GET   /api/v1/projects/:project_id/guides/:guide_id?project_version_id=:id
GET   /api/v1/projects/:project_id/guides/:guide_id/export/markdown?project_version_id=:id
GET   /api/v1/projects/:project_id/guides/:guide_id/export/html.zip?project_version_id=:id
PATCH /api/v1/projects/:project_id/guides/:guide_id?project_version_id=:id
POST  /api/v1/projects/:project_id/guides/:guide_id/archive?project_version_id=:id
POST  /api/v1/projects/:project_id/guides/:guide_id/restore?project_version_id=:id
```

The PATCH body contains only title/description changes plus
`expected_edition_version`; lifecycle is not patched generically.

Generation path remains:

```text
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
```

It derives the Edition Version from Capture and returns `201` with Guide detail
plus canonical `redirect_path` using the resolved current Version slug.

Existing nested block/step routes remain. Add required
`project_version_id` query and `expected_working_draft_version` body/multipart
fields. DELETE block carries both values in its query. Do not accept lifecycle,
Edition ID, or Project Version changes through child-content bodies.

### Interactive Demo

```text
POST  /api/v1/projects/:project_id/interactive-demos
GET   /api/v1/projects/:project_id/interactive-demos?project_version_id=:id
GET   /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id?project_version_id=:id
PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id?project_version_id=:id
POST  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/archive?project_version_id=:id
POST  /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/restore?project_version_id=:id
```

Direct POST requires `project_version_id`, title, and optional description in
the body and creates identity + first Edition + empty Working Draft atomically.
Remove root DELETE.

Generation path remains:

```text
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
```

It derives Version and returns the identity, Edition, Working Draft, generated
Scenes, and canonical redirect path.

Scene/Hotspot routes retain their paths. Add required `project_version_id` and
expected Working Draft Row Version to mutation contracts. DELETE uses query
values. Hotspot transition state is nested as defined above.

### Temporary publish compatibility routes

Keep existing Guide/Demo publish route paths, but require
`project_version_id` on every authenticated status/mutation request. The server
must resolve the requested Edition and stable Artifact before consulting the
artifact-wide legacy Publish Link.

- creating/republishing a snapshot from a non-Default Edition:
  `409 publication_version_not_ready`;
- status for any scoped Edition may return the Artifact's existing legacy link;
  if none exists, it returns the normal unpublished response even when the
  Edition is non-Default;
- revoke/access/password operations may mutate an existing link from any scoped
  Edition of that same stable Artifact, including after a Default change; they
  never read or publish Working Draft content;
- revoke/access/password with no active matching link retain their existing
  not-found/no-active-link behavior;
- mismatched Project/Organization/Artifact/Version: `404`;
- archived Edition may retain/read an existing publish status, but publishing a
  new snapshot from it is `409 artifact_edition_not_editable`;
- public `/api/v1/public/publish-links/*`, `/p/*`, `/d/*`, and embed contracts do
  not gain Project Version inputs.

Creating a compatibility Publication takes the Project advisory lock, locks the
scoped Default Edition and Working Draft before child reads, and builds one
transactionally consistent snapshot without incrementing Edition or Working
Draft Row Versions. The snapshot builder maps relational Guide annotations and
Demo transitions back into the existing immutable snapshot wire shape. This
staged legacy write is the only remaining Guide/Demo JSON persistence and is
removed by child `120`; it must not be described as the ADR `0025` clean target.

### Error contract

Map consistently:

- unauthenticated: `401` existing response;
- missing Project/Artifact/Edition/Working Draft/child or cross-tenant/version
  mismatch: `404` without revealing which scope failed;
- malformed/missing scope or expected Row Version: `400` Zod response;
- `guide_edition_conflict` / `interactive_demo_edition_conflict`: `409` stale
  Edition Row Version;
- `guide_working_draft_conflict` /
  `interactive_demo_working_draft_conflict`: `409` stale aggregate Row Version;
- `project_version_read_only` or `artifact_edition_not_editable`: `409`;
- `publication_version_not_ready`: `409` temporary child-120 boundary;
- existing invalid block/order/asset/hotspot/coordinate errors retain their
  current `400` meanings.

Retire `capture_artifact_version_not_ready` from Guide/Demo generation after
the Default seam is removed. Do not reuse it for an Edition error.
`publication_version_not_ready` is a typed `PublishDomainError` owned by
`packages/publish-domain/src/errors/publish-domain-error.ts`, not an ad hoc
route or service response.

## Behavior Rules

### Create and generation

- Acquire Project advisory lock first, then lock Project Version/Capture/Edition
  rows in stable order.
- Verify Organization, Project, Project Version, capability, and active lifecycle
  before inserting.
- Create Artifact identity, first Edition, exactly one Working Draft, generated
  children, and one Audit Event atomically.
- Guide/Demo generated from Capture inherits the Session Version exactly.
- Capture Sessions, Events, original Assets, order, and captured metadata remain
  unchanged.
- A generated Step/Scene may record immediate source provenance only from that
  inherited Version. New picker/upload choices also use that Version. Persisted
  selected/background Asset ownership remains same-Organization/same-Project so
  child `119` can reuse protected media across Versions without copying it.
- Direct Demo creation in an active named Version is allowed and creates an
  empty relational Working Draft.

### Reads and lists

- Resolve by Organization + Project + stable Artifact + requested Project
  Version; never pick “latest,” current Default, or an arbitrary Edition.
- Lists return only Editions for the requested Version, including `draft` and
  `archived`, in current created-desc order with deterministic ID tie-break.
- Active and archived Project Versions are readable to authorized members.
- A stable Artifact with no Edition in the requested Version is absent from the
  list and detail returns `404`.
- Source Asset URLs continue to use protected authenticated file routes.
- List/detail `authored_updated_at` is the maximum Edition/Working Draft update
  timestamp and is the only authoring-freshness value used against a temporary
  Published Artifact timestamp.

### Metadata and lifecycle

- Title/description updates affect one Edition only.
- Duplicate titles are allowed across and within Project Versions.
- Archive/restore affects one Edition only and increments only Edition Row
  Version.
- Archive is idempotent only as a no-op response when expected version matches;
  it produces no duplicate Audit Event. Restore follows the same rule.
- Archiving a Project or Project Version does not rewrite Edition status.
- Changing Default never moves Capture Sessions or Editions.

### Working Draft mutations

- Every logical autosave/action is one transaction and one Audit Event.
- Lock and compare Working Draft Row Version before touching child rows.
- One successful action increments the Working Draft exactly once even if it
  reorders/inserts/updates/tombstones several rows.
- Annotation bulk replacement diffs by ID, rejects unknown/duplicate IDs,
  preserves retained IDs, assigns deterministic order, and tombstones removed
  rows.
- Hotspot transition create/update/remove is part of the Hotspot action and
  cannot partially commit.
- Reorder requests must contain every active sibling exactly once and no
  tombstoned/cross-Draft IDs.
- Child mutation responses return the new Working Draft Row Version; the web
  client replaces its local expected value after every success.
- On `409`, the editor must not blindly retry. It displays a conflict message and
  offers reload of server state; unsaved local text remains visible until the
  user chooses reload.

## Security, Permission, And Evidence Rules

### Authorization and tenant isolation

- Reuse `with_project_authorization`; do not invent route-local roles.
- Project Admin/Editor: create and mutate active-version draft Editions.
- Viewer: list/detail/preview/export read only.
- Publication capability remains `publication.read/manage`. The temporary
  Default-Version rule constrains only snapshot creation/republishing; an
  authorized user may still inspect or manage an existing Artifact-wide link
  from any correctly scoped Edition.
- Organization Owner implicit Project Admin behavior remains unchanged.
- Every repository predicate and FK includes Organization and Project scope.
- Cross-tenant, cross-Project, cross-Version Edition/Working-Draft/child IDs and
  cross-Version Asset IDs supplied to current generation/picker/upload commands
  are rejected without existence disclosure. The future audited child-`119`
  Carry-Forward command is the sole planned same-Project cross-Version Asset
  reuse path.
- Database guards are defense in depth; services must still perform explicit
  authorization and lifecycle checks.

### Audit and Access Evidence

- Stable root resource type/ID remains `guide` or `interactive_demo` plus stable
  Artifact ID.
- Audit Events for Edition actions include `project_version_id` as a safe typed
  identifier Change Item and use Edition before/after Row Versions.
- Creation events remain rooted at the stable Artifact ID but use the new
  Edition Row Version for the Audit Event `before_row_version = null` /
  `after_row_version = 1`; the Working Draft and generated children appear as
  relational Change Items. Content commands use the Working Draft before/after
  Row Versions. Stable identity never receives a synthetic Row Version.
- Working Draft actions include one Working Draft Row Version change plus every
  changed Block/Step/Annotation or Scene/Hotspot/Transition record as typed
  relational Change Items. Never copy content bodies, JSON, credentials, URLs,
  or screenshots into evidence.
- Add entity types `guide_edition`, `guide_working_draft`, `guide_annotation`,
  `interactive_demo_edition`, `interactive_demo_working_draft`, and
  `demo_transition` to the allowlisted evidence schema.
- Replace generic root update actions with explicit Edition actions where
  needed: `guide.edition.updated|archived|restored` and
  `interactive_demo.edition.updated|archived|restored`. Existing child action
  names may remain when their meaning is still exact.
- Generation remains one logical `guide.created` or
  `interactive_demo.created` event covering identity, Edition, Working Draft,
  and generated children.
- No-op, rejected, stale, rolled-back, and permission-denied mutations produce
  no committed mutation Audit Event. Existing Access Evidence records the
  logical denial/failure outcome according to child `114` policy.
- Update Audit and Access route coverage for archive/restore and removed Demo
  DELETE. Coverage tests must fail for every unregistered new mutable table,
  operation, or command.
- Project activity remains curated and must label Edition archive/restore
  accurately without exposing raw change values.

## Portal Behavior

- Pass resolved `projectVersionId` as well as canonical slug into Guide/Demo
  lists, details, preview, editor, export, generation navigation, and temporary
  publish client calls.
- Set `allowVersionOwnedContent` for Guide/Demo routes. Project Version workspace
  links appear for every resolved Version; archived Project/Version routes render
  their content read-only.
- Lists consume Edition summaries, show Edition lifecycle, and link through the
  current canonical Version slug.
- Editors use Edition metadata and Working Draft content. Read-only state is
  effective when Project archived, Project Version archived, or Edition
  archived. An archived Edition still exposes its explicit Restore Edition
  command to an authorized Editor/Admin only while the owning Project and
  Project Version are active; all authored-content controls remain disabled.
- Active named Version Editions are fully editable. When no Artifact link
  exists, publish creation is replaced by a concise notice that multi-version
  publishing arrives in child `120`; do not make a doomed request.
- Current Default Edition publish creation keeps its present behavior. Existing
  artifact-wide link status/revoke/access/password controls remain available in
  any scoped Edition, so changing Default can never strand an active public link
  without an authorized management path.
- Archive/restore controls describe the Edition, not the global Artifact, and
  use non-destructive copy. Do not label archive as delete.
- Guide block rendering reads explicit title/body and Step annotations.
- Demo editor/view helpers read nested Transition state.
- Loading, empty, not-found, permission, read-only, conflict, failed-request,
  archive, and restore states remain stable and accessible.
- Public readers and embeds render the same immutable snapshots with no
  authenticated Working Draft fetch and no visual regression required by this
  data-model child.

## Migration, Backwards Compatibility, And Rollback

- There are no production records, external API consumers, or deployed links
  requiring data preservation. This plan intentionally updates every in-repo
  consumer in one coordinated deployment.
- Before migration, operators must back up any disposable data needed for
  reference, then reset/reseed databases rejected by `022` using the documented
  maintenance credentials. Never run test drop/reset commands against a
  production database.
- Deploy migration, server, and portal together. Old server/new schema and new
  server/old schema are unsupported; do not use rolling mixed-version writers.
- `migrate:status` must select the post-`022` verifier and fail readiness for an
  incomplete relational schema, missing grants/guards, JSON Working Draft
  column, or stale mutation coverage.
- DOWN must refuse with SQLSTATE `55000` if any identity, Edition, Working Draft,
  authored child, or related Publication rows exist. On an empty schema it may
  restore the legacy table layout and the `020`/`021` temporary Default guards.
- The existing immutable publication `snapshot_json` is the staged legacy
  boundary explicitly retained by master `005` until child `120`, not a new
  architecture exception or proof that the ADR `0025` clean publication target
  is complete. Child `120` removes it. No other core Guide/Demo JSON/JSONB
  column may remain after `022`.
- Existing public route shapes and immutable snapshot response shapes remain
  backwards compatible through this child.

## TDD Implementation Order

1. Add failing shared constants/types tests for identity, Edition, Working Draft,
   explicit Guide content/annotations, Demo Transition, scope queries, and
   expected Row Versions.
2. Add failing migration text/catalog tests for refusal, table ownership,
   constraints, indexes, no `guide_block.content`, no Hotspot target column,
   grants, triggers, and post-`022` verification.
3. Implement migration `022` and verifier updates; prove fresh, refusal, empty
   DOWN/UP, and runtime-role behavior before repository work.
4. Add failing Guide/Demo domain tests for the new normalized relational inputs,
   lifecycle, annotation/transition constraints, and Capture Version scope.
5. Refactor Guide repository/service/audit behind failing unit and DB tests;
   implement creation, reads, metadata/lifecycle, aggregate CAS, relational
   children, generation, export, and upload.
6. Refactor Interactive Demo repository/service/audit the same way.
7. Update Audit/Access registries and DB guard coverage before enabling any new
   writer.
8. Add failing Publish compatibility tests; project relational Default Edition
   state into the unchanged immutable snapshot contract and reject named-version
   authenticated publishing.
9. Update routes and route tests for explicit Version scope, archive/restore,
   removed Demo DELETE, exact errors, and response contracts.
10. Update web API tests, then App/route boundary/list/editor/preview tests. Keep
    every changed API call explicit about Project Version and expected Row
    Version.
11. Update DB integration, app integration, and smoke workflows for two active
    Project Versions and one archived Version.
12. Run focused checks, broad checks, reset DB suites serially, then use
    `dogfood-ossie`/`agent-browser` for real-browser evidence.
13. Reinspect the diff for unrelated files and stale JSON/root-owned lifecycle
    assumptions. Only then update child/master closeout records and commit small
    logical changes.

## Test And Verification Plan

All repository commands must be prefixed with `rtk`.

### Focused shared/domain/server/web checks

```text
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/types test -- src/guide.test.ts src/demo.test.ts src/publish.test.ts
rtk pnpm --filter @repo/guide-domain test
rtk pnpm --filter @repo/demo-domain test
rtk pnpm --filter @repo/publish-domain test
rtk pnpm --filter server test -- src/db/foundation-schema.test.ts src/db/audit-schema-verification.test.ts
rtk pnpm --filter server test -- src/modules/guide src/modules/interactive-demo src/modules/publish
rtk pnpm --filter server test -- src/modules/audit/audit-coverage-registry.test.ts src/modules/audit/audit-route-coverage.test.ts src/modules/access/access-coverage-registry.test.ts src/modules/project-activity/project-activity.repository.test.ts
rtk pnpm --filter web test -- src/lib/api.test.ts src/lib/routes.test.ts src/App.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx src/features/guide src/features/interactive-demo src/features/capture-session/CaptureSessionDetailPage.test.tsx
```

Focused assertions must cover:

- identity rows have no metadata/lifecycle/Row Version;
- one Edition per Artifact/Project Version and exactly one Draft per Edition;
- first creation is atomic;
- no Working Draft JSON/JSONB and relational Annotation/Transition constraints;
- missing/cross-tenant/cross-Project/cross-Version IDs are rejected;
- active named Version create/edit succeeds; archived Version/Edition writes
  fail but reads work;
- Default changes do not move content and no longer fail due to scoped Editions;
- generation inherits Capture Version and never mutates Capture;
- generated provenance/new selection rejects another Version, while restrictive
  same-Project Asset ownership remains compatible with child-`119` protected
  media reuse after copied source provenance is cleared;
- stale Edition/Draft CAS fails atomically; successful/no-op Row Version rules;
- annotation and transition diffs, order, max count, coordinates, target scope;
- archive/restore affects one Edition only;
- Viewer read and Editor/Admin write permissions;
- existing exports and Default publication snapshots contain exact relational
  content; named-version publication creation is blocked, while an existing
  artifact-wide link remains manageable after a Default change;
- public reader/embed/access behavior remains unchanged;
- Audit Evidence has typed Edition/Draft/child changes and no content values;
- Access and route/table/command registries are exhaustive.

### Database verification

Use only the configured disposable testing database and run DB suites serially:

```text
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:setup
rtk pnpm --filter server run migrate:status
rtk pnpm --filter server run test:db
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:setup
rtk pnpm --filter server run test:smoke
```

Record applied migration count, refusal evidence on a synthetic retained legacy
row, empty DOWN/UP result, runtime-grant rejection, Audit verifier result, DB
suite result, and smoke result. Do not run DB integration and smoke concurrently.

Smoke must create two active Project Versions, create/generate both artifact
types in each, edit relational content independently, archive one Edition,
change Default without moving Editions, verify same-Version asset enforcement,
including rejection by every current selection command while retaining the
future same-Project Carry-Forward FK boundary, publish/read the current Default
compatibility snapshot, manage that existing
link after changing Default, and prove the other Artifact/Edition remains
unchanged. Because second Editions for one stable Artifact arrive with
Carry-Forward in child `119`, child-`118` smoke proves that an Artifact ID with
no Edition in the selected Version returns `404`; it must not fabricate a second
Edition fixture through maintenance SQL.

### Broad checks

```text
rtk pnpm -r --if-present test
rtk pnpm lint
rtk pnpm check-types
rtk pnpm build
rtk git diff --check
```

If root scripts differ at implementation time, record the exact equivalent
commands rather than silently skipping a category.

### Agent-browser validation requirements

This child changes browser-visible routing, lifecycle, conflict, and authoring
behavior. Real-browser validation is mandatory using synthetic local fixtures.
Use the repository `dogfood-ossie` procedure and `agent-browser`; do not use
private URLs, credentials, customer data, or private screenshots.

Validate at minimum:

1. Desktop Default Version: list, open, edit metadata/content, annotation or
   transition, preview, export, archive, restore, publish, and public read for
   both artifact types as applicable.
2. Desktop named active Version: create/generate from a same-Version Capture,
   list/open/edit, correct canonical URL/context, and visible publishing-deferred
   notice.
3. Archived Project Version and archived Edition: direct links/read work;
   controls are read-only and mutation requests are not sent.
4. Version isolation: an Artifact ID with no Edition in the selected Version
   returns `404`; cross-Version child and new-selection attempts fail without
   leaked data. Do not fake child-`119` multi-Edition behavior in browser
   fixtures.
5. Concurrency: force a stale Working Draft or Edition Row Version, confirm the
   `409` recovery UI preserves local input, then reload and continue.
6. Narrow mobile viewport, keyboard-only operation, focus order/visibility, and
   200% zoom/reflow for list, editor header/lifecycle controls, conflict alert,
   and deferred-publishing notice.
7. Loading, empty, not-found, permission, failed request, archive/restore, and
   destructive child-delete confirmation states where currently applicable.
8. Browser console has no unexpected errors and network inspection shows every
   authenticated Guide/Demo request carries the selected Version and every
   mutation carries the expected Row Version.
9. Change Default after publishing, manage/revoke the existing artifact-wide
   link from its scoped non-Default Edition, and confirm no public link becomes
   administratively stranded.
10. Public Guide reader, public Demo viewer, and embeds still load immutable
    published content without an authenticated Working Draft request.

Record exact local URLs, roles, viewport sizes, browser commands, console/network
results, and safe screenshot paths in the closeout. If a required capability is
unavailable, mark only that capability blocked; do not fabricate evidence.

## Acceptance Criteria

- [x] Guide and Interactive Demo roots are immutable identity-only records.
- [x] Metadata and `draft | archived` belong only to Project Version-scoped
      Editions, with at most one Edition per Artifact/Version.
- [x] Every Edition has exactly one mutable Working Draft.
- [x] Edition and Working Draft mutations have enforced caller-visible Row
      Version conflict behavior.
- [x] Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions are
      separate relational records.
- [x] No Guide/Demo Working Draft content or generic metadata uses JSON/JSONB.
- [x] Capture generation inherits exact immutable source Version and works in an
      active named Version.
- [x] Cross-tenant, Project, Version, Draft, and child mismatches fail safely;
      immediate provenance/new Asset selection is Version-scoped without
      preventing child-`119` same-Project Protected Shared Asset reuse.
- [x] Archived Project/Version/Edition read-only semantics and Default-change
      non-movement semantics pass.
- [x] Audit/Access evidence and command/table/route coverage pass for every new
      writer and mutable table.
- [x] Existing Default publication/public-reader behavior passes through the
      temporary compatibility boundary; named-version publication creation is
      deferred, and existing link management remains reachable after a Default
      change.
- [x] Fresh migration, retained-data refusal, reset/reseed, runtime grants,
      empty DOWN/UP, DB integration, and smoke pass.
- [x] Focused, broad, and mandatory browser checks pass or have precise honest
      capability blockers.
- [x] Child `119` can snapshot and carry forward relational Working Drafts
      without changing Artifact/Edition/Draft ownership again.

## Delivery And Closeout Checklist

### Expansion completed on 2026-07-19

- [x] Predecessor closeouts, canonical domain language, accepted ADRs, master,
      current code, tests, and clean starting worktree inspected.
- [x] Exact ownership, schema, API, lifecycle, concurrency, permission,
      migration, Audit/Access, compatibility, UI, and browser contracts defined.
- [x] Temporary publication boundary made explicit and independently deployable.
- [x] Exact affected and explicit non-scope files recorded.
- [x] TDD order, focused/broad/DB/smoke/browser verification defined.
- [x] Recheck resolved Carry-Forward asset reuse, legacy Publish Link
      manageability, Audit Row Version ownership, authoring freshness, strict
      input, FK deletion, verification-command, and file-manifest gaps.
- [x] No unresolved critical product/domain decision remains.

### Implementation completed on 2026-07-19

- [x] Recheck this expanded plan against current `HEAD`, master `005`, and the
      implemented child `117` result before coding.
- [x] Establish failing tests before each behavior change.
- [x] Implement only this child boundary and preserve unrelated worktree changes.
- [x] Run and record all required verification.
- [x] Update this file's status, checklist, implementation log, verification
      notes, leftovers, and handoff.
- [x] Update master `005` only for completed child `118` items.
- [x] Commit only attributable changes in small logical commits.

## Implementation Log

Implementation completed on 2026-07-19:

- added migration `022_guide_demo_edition_working_draft_relational_foundation.sql`
  with identity-only Artifact roots, unique Project Version-scoped Editions,
  exactly-one Working Draft ownership, typed relational Guide/Demo children,
  restrictive scope FKs, runtime grants, writer guards, and pre-live retained
  Guide/Demo/Publication refusal;
- replaced the former dual-purpose Guide/Demo persistence with transactional
  Artifact + Edition + Working Draft creation, exact Version scoping, aggregate
  Working Draft optimistic concurrency, Edition archive/restore concurrency,
  relational annotations/transitions, and source-Version-aware generation;
- updated shared constants, contracts, domain policies, repositories, services,
  routes, Audit snapshots/coverage, publish compatibility adapters, smoke data,
  and database schema verification together;
- retained Default-Edition legacy snapshot publication/public reading as the
  deliberate child-120 compatibility seam, rejected new named-Version
  publication, and kept artifact-wide existing-link management reachable after
  a Default change;
- updated portal routing and all Guide/Demo API calls to use the selected Project
  Version, refreshed returned Working Draft Row Versions after writes, exposed
  archive/restore, and rendered the named-Version deferred-publishing state;
- expanded the shared database reset helper to truncate the new restrictive-FK
  tables; this test-support file was the only justified addition beyond the
  rechecked inventory and prevents stale relational fixtures between DB tests;
- the final fresh-PostgreSQL closeout caught and fixed an ambiguous joined Draft
  select, Demo creation Audit action drift, concurrent queries on one transaction
  client, archive-transition guard logic, overlong annotation IDs, annotation
  clearing on screenshot replacement, dense Block ordering after deletion,
  archived Demo write translation, Version-aware generated editor redirects,
  and stale predecessor DB assertions; each fix was rerun at its owning seam;
- updated current-state route, operations, setup, zoom-out, and roadmap docs
  without claiming child-119 Revisions/assets or child-120 publishing work.

## Verification Record

Verification completed on 2026-07-19:

- focused constants/types/domain, server Guide/Demo/Publish/Audit, and web
  Guide/Demo/App suites pass;
- the complete recursive repository suite passes (`15` packages; server `357`
  tests and web `264` tests included);
- fresh disposable PostgreSQL migration through `022`, named schema
  verification, runtime-grant/guard coverage, reset/reseed, the full server DB
  integration suite, and focused relational Guide/Demo/Publish plus V1 smoke
  (`10` tests) pass using separated maintenance
  and runtime roles; retained-row refusal and guarded DOWN behavior are covered
  by migration/schema tests;
- `rtk pnpm lint`, `rtk pnpm check-types`, `rtk pnpm build`, and
  `rtk git diff --check` pass;
- agent-browser session `child118` at `http://localhost:3000` with synthetic
  local fixtures verified login, Project discovery, and Default Version
  workspace selection at desktop width; console output contained only Vite/
  React development messages;
- remaining browser matrix was blocked when the authenticated
  `/projects/.../versions/main/guides` navigation caused the pre-existing
  authentication session-touch writer to fail `invalid_audit_transition` in
  `authentication/session.audit.ts`. The route returned `500` before Guide/Demo
  handling, so no child-118 browser behavior is blamed or fabricated. Safe
  blocker screenshot: `/tmp/ossie-child118-auth-session-audit-blocker.png`.
  Unit, integration, DB, and smoke coverage exercise the blocked child-118
  states; a later unrelated authentication-audit repair must repeat the desktop,
  mobile, keyboard, zoom/reflow, network, public reader/viewer, and embed matrix.

## Leftovers And Handoff To Child 119

Child `119` must build on, not replace, these child-118 foundations:

- stable type-specific Artifact identity and one Edition per Project Version;
- exactly one relational Working Draft per Edition;
- relational Guide Annotation and Demo Transition structures;
- aggregate Working Draft Row Version and typed Audit Change Items;
- exact generation provenance/new-selection Version scope plus same-Project
  protected Asset references that Carry-Forward may reuse.

Child `119` owns:

- immutable type-specific relational Revision roots/children;
- checkpoint creation/reuse and Working Draft restore;
- Edition-scoped Revision Numbers;
- atomic/idempotent multi-Artifact Carry-Forward and immediate source-Edition
  lineage;
- new IDs/Row Versions/audit state for copied mutable structures;
- clearing copied Capture Session/Event provenance while reusing selected or
  background Protected Shared Asset IDs from the source Version;
- the complete Protected Shared Asset reference graph, archived-reference
  resolution, and purge blocking across Working Draft, Revision, and current
  Published Artifact references.

Unrelated carry-forward: repair the authenticated session-touch Audit
transition and rerun the blocked browser matrix. Do not fold that authentication
defect into child `119`'s domain scope.

Child `120` still owns removal of the temporary publication snapshot JSON,
revision-backed Published Artifacts, Publication Sequence naming, multi-version
Publish Link manifests, canonical version-specific public routes, selection,
and rollback.
