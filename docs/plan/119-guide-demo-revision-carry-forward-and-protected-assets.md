# Child Plan 119: Guide And Demo Revision, Carry-Forward, And Protected Assets

Date reserved: 2026-07-12

Date expanded: 2026-07-19

Date rechecked: 2026-07-19

Status: Implementation-ready after current-code recheck. Planning is complete;
runtime implementation has not started.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate And Baseline

Prerequisite:

- Child `118` is implemented and closed at commit `38de033`
  (`docs(plan): close child 118 implementation recheck`).
- Its relational Guide/Demo Artifact, Edition, Working Draft, and typed-child
  ownership is the shipped starting point. Child `119` must extend it rather
  than replace it.
- The expansion started from a clean worktree at `38de033`. Recheck `HEAD` and
  `git status` before implementation because later agents may have changed the
  files below.

Next child:

- `120` Publication And Multi-Version Publish Link Integration, only after the
  Revision, Carry-Forward, lineage, asset-protection, database, and browser gates
  in this plan are closed or have precise capability blockers.

Canonical inputs:

- `CONTEXT.md`;
- accepted ADRs `0002` through `0006`, `0009`, and `0020` through `0026`;
- `docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md`;
- master plan `005`;
- child `118` closeout and its current implementation;
- current Guide, Interactive Demo, Capture Asset, File, Publish, Audit, Access,
  Project Membership, Project Version, portal, migration, DB, and smoke code.

No new grill or ADR is required. The accepted records already decide the
security- and lifecycle-sensitive semantics. The table layout, route grouping,
canonical digest, pagination, batch limit, and module placement below are
reversible implementation choices inside those decisions.

## Goal

Add immutable, explicitly relational Guide and Interactive Demo Artifact
Revisions; manual checkpoint/history/restore behavior; atomic and idempotent
multi-Artifact Carry-Forward between two Project Versions in one Project; and a
reference-safe Capture Asset archive/purge boundary that preserves Working
Drafts, Revisions, exports, and current Published Artifacts.

Child `119` must leave child `120` a stable exact Revision relationship and no
remaining ambiguity about which media references prevent purge.

## Current Runtime Facts And Gaps

Implemented by child `118`:

- stable Guide and Interactive Demo Artifact roots are identity-only;
- each Artifact has at most one Edition per Project Version;
- each Edition has exactly one mutable relational Working Draft;
- Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions are typed
  relational records with aggregate Working Draft Row Version concurrency;
- retained Annotation and Transition identities update in place;
- Project Admins and Editors already have the accepted
  `revision.checkpoint_restore` and `revision.carry_forward` capabilities;
- Project Viewers have read-only Artifact access;
- exact Project Version IDs are mandatory at the Guide/Demo web API boundary;
- the current Default-Edition publication compatibility path still writes
  `published_artifact.snapshot_json` and is intentionally removed by child
  `120`, not this child.

Missing or unsafe today:

- no Revision tables, contracts, routes, history, checkpoint, or restore exist;
- no Edition lineage or Carry-Forward operation/result persistence exists;
- the current Capture Asset `DELETE` route is authorized as `capture.write` and
  soft-deletes both the Capture Asset and File, which can break authored,
  exported, or published references;
- current Working Draft asset selection is Version-local except for the planned
  Carry-Forward exception;
- current Published Artifact asset dependencies exist only inside snapshot JSON
  and therefore cannot participate in a relational purge graph;
- the Project Version workspace still hides Guide/Demo links for named Versions
  and displays stale “arrives in child 118” copy, even though named-Version
  ownership is shipped. Child `119` must correct this prerequisite so its target
  Version workflow is reachable;
- the child-118 closeout could not freshly run DB tests because the local
  `testing_maintenance` environment is missing, and browser entry currently
  stops when `/api/v1/public/instance` returns `500`. Recheck these capabilities;
  do not inherit historical evidence as a new pass.

## Accepted Semantics And Reconciliations

1. An Artifact Revision is an immutable authoring checkpoint inside one
   Edition. It is not a Project Version, Working Draft Row Version, Published
   Artifact, or JSON snapshot.
2. Manual checkpoint, Publication, and Carry-Forward are the only allowed
   Revision triggers. This child implements manual checkpoint and the
   Carry-Forward source trigger. It reserves `publication` in the schema and
   internal service contract; child `120` wires Publication to it.
3. A Revision snapshots Edition title/description and the complete active typed
   Working Draft graph. It excludes internal Row Versions, actor/timestamp
   metadata, tombstoned children, and storage-provider data from semantic
   equality.
4. Revision Numbers start at `1`, increase within one Edition, are never reused,
   and are unrelated to mutable Row Versions or Publication Sequence.
5. If the current authored state is semantically identical to the latest
   Revision, checkpoint or Carry-Forward reuses that Revision. It does not create
   an Audit Event for a no-op checkpoint.
6. Normal checkpoint and restore require an active Project, active Project
   Version, draft Edition, current `expected_edition_version`, and current
   `expected_working_draft_version`.
7. Archived Project Versions and archived Editions remain valid readable
   Carry-Forward sources. Carry-Forward is the narrow exception allowed to
   create/reuse the exact immutable source Revision for an archived source; it
   does not mutate the source Edition or Working Draft. Manual checkpoint,
   restore, and Publication remain blocked there.
8. Restore replaces Edition title/description and the active Working Draft graph
   from one immutable Revision. It increments Edition and Working Draft Row
   Versions once, creates new mutable child IDs with child Row Version `1`,
   tombstones the displaced active children, and never mutates the Revision.
9. Restore verifies both expected Row Versions before no-op detection. If the
   current authored state already equals the Revision, it returns the
   authoritative current aggregate with `restored: false` and creates no Audit
   Event.
10. One Carry-Forward operation has one source and one target Project Version in
    the same Project, the Versions differ, the target is active, and the source
    may be active or archived.
11. A Carry-Forward request selects `1..50` distinct stable Artifacts and may mix
    Guides and Interactive Demos. Fifty is the documented V1 transaction bound.
12. The batch validates completely, then succeeds in one transaction or creates
    nothing. Existing target Editions are conflicts and are never overwritten.
13. Carry-Forward creates/reuses the source Revision first and copies from that
    immutable relational graph, not from a second unlocked Working Draft read.
    It does not create a target Revision automatically; the target begins as an
    independent draft and receives its first Revision only through a later
    trigger.
14. A target Edition keeps the stable Artifact ID, copies title/description,
    clears its Edition-level `source_capture_session_id`, receives status
    `draft`, one new Working Draft, new mutable child IDs, Row Version `1`, and
    actor/current timestamps. Later source/target edits never synchronize.
15. Target Guide Steps clear `source_capture_session_id`,
    `source_capture_event_id`, and `source_capture_asset_id`, while
    `selected_capture_asset_id` receives the source's effective selected/source
    image. Target Demo Scenes clear the equivalent source provenance and keep
    the effective image in `background_capture_asset_id`.
16. Carry-Forward reuses Capture Asset and File IDs within the same Project. It
    never duplicates bytes and never permits cross-Project or cross-Organization
    media reuse.
17. Every target Edition records exactly one immediate source Edition and source
    Revision. Lineage is immutable and is not transitive synchronization.
18. `Idempotency-Key` is required for Carry-Forward. Only its lowercase SHA-256
    digest is persisted/audited. The raw header must never enter logs, errors,
    Audit Change Items, screenshots, or responses.
19. An exact authorized retry returns the original committed result with
    `replayed: true`; reuse of the key with another normalized request returns a
    conflict. A retry never creates duplicate Editions, Revisions, or Audit
    Events. Idempotency is scoped to the current Organization, Project, and
    actor Org User so one Editor cannot reserve or replay another Editor's key.
20. Capture Asset archive and physical purge are separate. Archive hides an Asset
    from new selection but keeps existing authenticated/public references,
    exports, and revision previews resolvable.
21. Project Admins and Editors may archive/restore Capture Assets. Only Project
    Admins and implicit Organization Owners may request/retry physical purge.
22. Purge is allowed only for an archived Asset with no references from any
    active Working Draft field, Artifact Revision field, or current Published
    Artifact projection, and only when no other non-purged Capture Asset shares
    the same File. Actionable dependency counts and safe IDs are returned on
    conflict.
23. Database rows remain as audited tombstones. “Physical purge” removes File
    bytes and makes File/Asset reads unavailable; it does not erase Audit/Access
    evidence or rewrite immutable source history.
24. File storage is not transactional. Purge therefore uses a persisted retryable
    operation: commit a protected `pending` request, perform exact idempotent
    storage deletion, then commit `completed`; on a storage failure commit
    `failed` with a safe code and permit retry. Never call the current
    best-effort upload-cleanup method and claim purge succeeded.
25. A pending or failed purge operation keeps the Asset unavailable for restore
    or new references until an Admin completes the retry. If the process stops
    after byte deletion but before database completion, retry treats missing
    bytes as success and completes the tombstone/audit transition.
26. A completed purge retry returns the original completed result without
    requiring the now-stale pre-purge Asset Row Version and creates no new Audit
    Event. Current Project authorization and tenant/Asset scope are still checked
    before returning that result.

## Scope

In scope:

- type-specific immutable Revision roots and relational children;
- checkpoint, list, immutable detail/preview, and restore for Guide/Demo;
- Edition-scoped Revision numbering and semantic latest-Revision reuse;
- immutable immediate source Edition/source Revision lineage;
- mixed Guide/Demo atomic/idempotent Carry-Forward;
- asset archive/restore, dependency inspection, retryable Project Admin purge,
  and archived-reference resolution;
- a temporary relational current-Published-Artifact-to-Capture-Asset projection
  maintained by the existing publish compatibility writer;
- Audit/Access/Project Activity integration;
- minimal portal UI needed to checkpoint, inspect/restore history, carry forward,
  and safely manage asset lifecycle;
- migration/reset/reseed, tests, smoke, operations, and browser evidence.

## Explicit Non-Scope

- child-`120` revision-backed Published Artifact persistence, removal of
  `snapshot_json`, Publication Sequence, multi-version Publish Link manifests,
  canonical version-specific public URLs, link selection, or rollback;
- creating a Publication-triggered Revision from the current publish route;
- copying Published Artifacts, Publish Links, passwords, viewer sessions,
  analytics, Capture Sessions, Capture Events, or source provenance;
- overwrite, merge, synchronization, branching, multi-source, multi-target,
  cross-Project, or cross-Organization Carry-Forward;
- automatic Carry-Forward when a Project Version is created or made default;
- target Revision creation during Carry-Forward;
- permanent Artifact, Edition, Revision, Project, Organization, Audit, or Access
  evidence deletion;
- governed/legal purge, compliance export, retention expiry, background cleanup
  scheduling, object-storage lifecycle policy, or new storage provider;
- Derived Asset/reference modeling that does not exist in the current runtime;
- editor/reader visual modernization owned by children `121` through `129`;
- extension changes, Documentation runtime, Video, AI, comments, review, or
  approval workflows;
- changes to `CONTEXT.md`, accepted ADRs, or migrations `001` through `022`
  unless a genuinely new critical decision is discovered.

## Exact Affected Files

The implementation stays inside this inventory. If current drift requires
another file, record why in the implementation log before editing it.

### Plan and operational records

- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  (completed items only during closeout)
- `docs/backend-route-inventory.md`
- `docs/development-setup.md`
- `docs/operations.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/v1-dogfood-smoke-suite.md`

### Shared constants, contracts, and domain policies

- `packages/constants/src/artifact-revision.ts` (new)
- `packages/constants/src/capture.ts`
- `packages/constants/src/constants.test.ts`
- `packages/constants/src/index.ts`
- `packages/types/src/artifact-carry-forward.ts` (new)
- `packages/types/src/artifact-carry-forward.test.ts` (new)
- `packages/types/src/artifact-revision.ts` (new)
- `packages/types/src/artifact-revision.test.ts` (new)
- `packages/types/src/capture.ts`
- `packages/types/src/capture.test.ts`
- `packages/types/src/guide.ts`
- `packages/types/src/guide.test.ts`
- `packages/types/src/demo.ts`
- `packages/types/src/demo.test.ts`
- `packages/types/src/index.ts`
- `packages/capture-domain/src/types/capture-asset.ts`
- `packages/capture-domain/src/policies/capture-asset-policy.ts`
- `packages/capture-domain/src/policies/capture-asset-policy.test.ts`
- `packages/capture-domain/src/errors/capture-domain-error.ts`
- `packages/capture-domain/src/index.ts`
- `packages/guide-domain/src/policies/guide-revision-policy.ts` (new)
- `packages/guide-domain/src/policies/guide-revision-policy.test.ts` (new)
- `packages/guide-domain/src/errors/guide-domain-error.ts`
- `packages/guide-domain/src/index.ts`
- `packages/demo-domain/src/policies/demo-revision-policy.ts` (new)
- `packages/demo-domain/src/policies/demo-revision-policy.test.ts` (new)
- `packages/demo-domain/src/errors/demo-domain-error.ts`
- `packages/demo-domain/src/index.ts`

Do not create a universal Artifact content package. Shared DTOs cover trigger,
history, and mixed selection/result envelopes; Guide and Demo graph validation
remains type-specific.

The capture-domain package owns normalized Asset lifecycle transitions and typed
invalid-transition errors. The server module owns authorization, scoped
reference queries, persisted purge orchestration, storage I/O, and Audit/Access
composition; it must not duplicate lifecycle policy in route handlers.

### Database, composition, evidence, and smoke

- `apps/server/package.json`
- `apps/server/src/db/migrations/023_guide_demo_revision_carry_forward_protected_assets.sql`
  (new)
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/migrate.ts`
- `apps/server/src/test-support/database.ts`
- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
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

### Revision server module

- `apps/server/src/modules/artifact-revision/artifact-revision-content.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision-content.test.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.repository.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.service.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.service.test.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.audit.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.audit.test.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.routes.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.routes.test.ts` (new)
- `apps/server/src/modules/artifact-revision/artifact-revision.db.integration.test.ts` (new)

### Carry-Forward server module

- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.repository.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.service.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.service.test.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.audit.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.audit.test.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.routes.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.routes.test.ts` (new)
- `apps/server/src/modules/artifact-carry-forward/artifact-carry-forward.db.integration.test.ts` (new)

### Protected Asset and publish-compatibility server files

- `apps/server/src/modules/capture-asset/capture-asset.repository.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.audit.ts`
- `apps/server/src/modules/capture-asset/capture-asset.audit.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.app.integration.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts`
- `apps/server/src/modules/file-storage/local-file-storage.provider.ts`
- `apps/server/src/modules/file-storage/local-file-storage.provider.test.ts`
- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.repository.ts`
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/publish/publish.audit.ts`
- `apps/server/src/modules/publish/publish.audit.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`

The Publish edits only maintain the typed Capture Asset dependency projection
for the temporary child-118 snapshot writer. They must not redesign publication
or claim the child-120 target.

### Portal API, routing, and UI

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.module.css`
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.tsx` (new)
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.test.tsx` (new)
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.module.css` (new)
- `apps/web/src/features/artifact-revision/GuideRevisionPreviewPage.tsx` (new)
- `apps/web/src/features/artifact-revision/GuideRevisionPreviewPage.test.tsx` (new)
- `apps/web/src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.tsx` (new)
- `apps/web/src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.test.tsx` (new)
- `apps/web/src/features/artifact-revision/ArtifactRevisionPreview.module.css` (new)
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.tsx` (new)
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx` (new)
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.module.css` (new)
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.tsx` (new)
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.test.tsx` (new)
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`

## Relational Schema Contract

Migration `023` adds the following; no core Revision or lineage content uses
JSON/JSONB.

### Shared Revision fields

Both `guide_revision` and `interactive_demo_revision` contain:

- `id VARCHAR(26) PRIMARY KEY`
- `organization_id`, `project_id`, and type-specific `*_edition_id`
- `revision_number INTEGER NOT NULL`
- `trigger VARCHAR(50) NOT NULL` in
  `manual_checkpoint | publication | carry_forward`
- immutable snapshot `title VARCHAR(255) NOT NULL` and nullable `description`
- `source_working_draft_version INTEGER NOT NULL`
- `content_sha256 CHAR(64) NOT NULL`
- `created_by_id` and `created_at`
- unique `(edition_id, revision_number)` and scoped unique keys required by
  composite child/lineage FKs
- positive-number, nonblank-title, digest, trigger, tenant, Project, Edition,
  and actor constraints.

Revision roots and children have runtime `SELECT, INSERT` only. Database guards
reject `UPDATE`, `DELETE`, and `TRUNCATE`; maintenance rollback is separately
guarded. Immutable rows do not have mutable Row Version columns.

### Guide Revision graph

- `guide_schema.guide_revision`
- `guide_schema.guide_revision_block`: revision FK, block type, title/body, and
  dense positive `block_index`
- `guide_schema.guide_revision_step`: revision/block FKs, source Session/Event/
  Asset IDs, selected Asset ID, `screenshot_hidden`, title, and body
- `guide_schema.guide_revision_annotation`: revision/step FKs, type, dense
  `annotation_index`, and normalized geometry.

The constraints mirror the active child-118 Guide graph, including exactly one
Step for a `step` block and no Step for non-step blocks.

### Interactive Demo Revision graph

- `interactive_demo_schema.interactive_demo_revision`
- `interactive_demo_schema.demo_revision_scene`: revision FK, dense positive
  scene index, title/description, source provenance, and background Asset
- `interactive_demo_schema.demo_revision_hotspot`: revision/scene FKs, type,
  label/content, normalized geometry, and dense per-scene index
- `interactive_demo_schema.demo_revision_transition`: revision/hotspot and
  same-revision target-scene FKs, with at most one transition per hotspot.

### Edition lineage

Add nullable paired lineage columns to each Edition:

- Guide: `source_guide_edition_id`, `source_guide_revision_id`
- Demo: `source_interactive_demo_edition_id`,
  `source_interactive_demo_revision_id`

Both are null for created/generated Editions and both are non-null for a carried
Edition. Composite FKs require the source to be the same stable Artifact,
Project, and Organization; a trigger requires a different Project Version and
prevents later lineage mutation.

### Carry-Forward operation and items

`project_schema.artifact_carry_forward` stores:

- ID, Organization, Project, source/target Project Version IDs;
- `idempotency_key_hash CHAR(64)`;
- normalized `request_fingerprint_sha256 CHAR(64)`;
- `selection_count`, creator, and timestamp;
- unique `(organization_id, project_id, created_by_id,
idempotency_key_hash)`;
- same-Project scoped FKs and `source <> target`/batch-size checks.

`project_schema.artifact_carry_forward_item` stores one globally ordered typed
selection/result root per requested Artifact:

- ID, Organization, Project, operation ID, `item_index`, `artifact_type`, and the
  type-specific stable Artifact ID used for duplicate detection;
- unique `(operation_id, item_index)` and
  `(operation_id, artifact_type, artifact_id)`;
- a deferred exactly-one-detail guard so every root owns the matching Guide or
  Demo detail and never both.

Type-safe immutable detail tables provide the actual scoped Artifact FKs:

- `guide_schema.guide_carry_forward_item`
- `interactive_demo_schema.interactive_demo_carry_forward_item`

Each stores its carry-forward item root, stable Artifact, source Edition, source
Revision, target Edition, and target Working Draft IDs with restrictive scoped
FKs. The root plus detail arrangement enforces request order and duplicate
selection across mixed types without making a polymorphic ID the ownership
authority. Runtime grants are `SELECT, INSERT`; rows are immutable.

### Protected Asset lifecycle and dependency graph

- add `status active | archived` to `capture_schema.capture_asset`; existing
  supported rows become `active`;
- keep `is_deleted` exclusively as the final purged tombstone, not archive;
- add `capture_schema.capture_asset_purge_operation` with one operation per
  Asset, status `pending | failed | completed`, safe nullable `failure_code`,
  attempt count, requester/completer, and timestamps;
- add `publish_schema.published_artifact_capture_asset` with restrictive scoped
  FKs and unique `(published_artifact_id, capture_asset_id)`.

Purge dependency queries cover all Guide Step source/selected fields, Demo Scene
source/background fields, their Revision equivalents, every current-schema
Published Artifact projection row whether or not a Publish Link still points to
that immutable history row, and every other non-purged Capture Asset sharing the
same File. Tombstoned Working Draft children do not protect an Asset; immutable
Revision and Published Artifact references always do.

Database guards enforce:

- archive/restore Row Version increments and command transitions;
- no new ordinary authored selection of an archived Asset;
- no new Asset reference while its purge operation is pending or failed;
- existing archived references remain legal and resolvable;
- same-Project cross-Version Asset insertion only under
  `artifact.carry_forward` and only while copying an existing protected source
  Revision reference;
- purge request only for archived, unreferenced Assets;
- File/Asset purge tombstones only after a matching purge operation and exact
  storage-deletion success;
- every new mutable or insert-only table is registered with Audit mutation
  context/evidence coverage.

Every Working Draft, Revision, Published projection, and shared-File reference
writer locks referenced Capture Asset/File rows in deterministic ID order before
its final lifecycle check. Purge request locks the same Asset/File rows before
checking the complete reference graph and inserting `pending`. This shared lock
protocol is mandatory: a concurrent reference either commits first and blocks
purge, or waits and then observes pending/failed/purged state; there is no
check-then-delete window.

## Semantic Equality And Concurrency

`artifact-revision-content.ts` builds a deterministic in-memory canonical form
from relational rows and hashes it with Node SHA-256. JSON serialization may be
used transiently for hashing but is never persisted.

The canonical form:

- includes artifact type, Edition title/description, ordered active content,
  all content scalar fields, nullable provenance/Asset IDs, annotations, hotspot
  geometry, and transition targets;
- excludes database IDs, Row Versions, creator/updater/deleter fields,
  timestamps, and tombstoned children;
- represents Demo transition targets by canonical scene position rather than
  mutable/revision row ID so a restore with new IDs remains semantically equal;
- normalizes nullable text and decimal geometry consistently;
- rejects duplicate/gapped order or cross-graph targets before hashing.

Checkpoint/restore lock the Edition and Working Draft, validate both expected
Row Versions, and serialize Revision numbering by Edition. Carry-Forward locks
the Project, source/target Project Versions, stable Artifact roots, and source
Editions in deterministic type/ID order before validation. These locks plus the
existing unique Edition constraint prevent concurrent overwrite and lock
inversion. Carry-Forward and purge also follow the shared Capture Asset/File
locking protocol above before creating any new media reference or beginning
storage deletion.

## Shared Types And API Contracts

### Shared contracts

`@repo/constants` exports:

- `ARTIFACT_REVISION_TRIGGERS`
- `ARTIFACT_CARRY_FORWARD_MAX_SELECTIONS = 50`
- `CAPTURE_ASSET_STATUSES = ["active", "archived"]`
- purge operation statuses.

`@repo/types` exports strict Zod schemas/types for:

- Revision trigger, summary, list query/response, checkpoint request/response,
  restore request, and common Revision params;
- type-specific Guide/Demo Revision detail graphs and restore responses;
- Carry-Forward selection, request, operation, result item, response, and typed
  conflict details;
- Capture Asset session-list archived-inclusion query, archive/restore,
  protection report, purge request/result, and updated Capture Asset status.

All object schemas are strict. ULIDs, positive Revision/Row Versions, SHA-256
digests, batch size, duplicate selections, source/target difference, and
`Idempotency-Key` length (`16..200` visible ASCII characters before hashing) are
validated. Clients never send a Revision trigger, Revision Number, lineage ID,
content digest, actor, tenant, or audit field.

### Revision routes

For Guides:

```text
GET  /api/v1/projects/:project_id/guides/:guide_id/revisions?project_version_id=:id&limit=:n&before_revision_number=:n
POST /api/v1/projects/:project_id/guides/:guide_id/revisions/checkpoint?project_version_id=:id
GET  /api/v1/projects/:project_id/guides/:guide_id/revisions/:revision_number?project_version_id=:id
POST /api/v1/projects/:project_id/guides/:guide_id/revisions/:revision_number/restore?project_version_id=:id
```

Interactive Demo routes use the same suffix under
`/:interactive_demo_id/revisions`.

Checkpoint body:

```json
{
  "expected_edition_version": 4,
  "expected_working_draft_version": 12
}
```

Checkpoint returns `201` for a new Revision and `200` with `reused: true` for an
identical latest Revision. History is newest-first, default `50`, maximum `100`,
and uses exclusive `before_revision_number`; responses include
`next_before_revision_number` or null.

Restore uses the same expected-version body and returns `200` with the
authoritative type-specific Edition/Working Draft aggregate, selected Revision,
and `restored: boolean`. Revision detail is immutable and remains readable for
archived Projects/Versions/Editions when the caller retains Project access.

### Carry-Forward route

```text
POST /api/v1/projects/:project_id/artifact-editions/carry-forward
Idempotency-Key: <opaque client-generated value>
```

Body:

```json
{
  "source_project_version_id": "01...",
  "target_project_version_id": "01...",
  "artifacts": [
    { "artifact_type": "guide", "artifact_id": "01..." },
    { "artifact_type": "interactive_demo", "artifact_id": "01..." }
  ]
}
```

Response is `201` for the first commit or `200` for an exact retry:

```json
{
  "carry_forward": {
    "id": "01...",
    "source_project_version_id": "01...",
    "target_project_version_id": "01...",
    "created_by_id": "01...",
    "created_at": "..."
  },
  "items": [
    {
      "artifact_type": "guide",
      "artifact_id": "01...",
      "source_edition_id": "01...",
      "source_revision_id": "01...",
      "source_revision_number": 3,
      "target_edition_id": "01...",
      "target_working_draft_id": "01..."
    }
  ],
  "replayed": false
}
```

Item order matches the request. The server computes the idempotency digest and a
fingerprint over Project/source/target and the ordered typed selections.
After current authentication, Project authorization, and tenant/Asset scope
checks, the service looks up the actor-scoped idempotency record before
revalidating target lifecycle or target-Edition conflicts. An exact completed
retry therefore returns the stored result even if the target changed after the
original commit; a changed fingerprint returns `409 idempotency_key_reused`.
Only a first-time request continues through current lifecycle, conflict, lock,
and write validation.

### Capture Asset lifecycle routes

```text
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets?asset_type=:type&include_archived=true
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/archive
POST   /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/restore
GET    /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/protection
DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id
```

The session Asset list defaults `include_archived` to `false`; only the exact
boolean `true` includes active and archived Assets, never purged tombstones.
Capture-session detail requests `include_archived=true` so existing references
can be managed. The Project-level authoring picker route remains active-only and
does not accept an archived-inclusion override. Exact Asset metadata/file routes
resolve active or archived Assets for authorized existing references, but never
purged Assets.

Archive/restore/purge bodies require `expected_asset_version`. Archive/restore
return `{ capture_asset }`. Protection returns lifecycle, purge-operation state,
`can_purge`, total counts, and bounded typed dependencies containing only safe
Project-owned IDs and Revision/Publication numbers. `DELETE` means physical
purge in the clean pre-live contract and returns `200` with purge status; a
failed exact storage deletion returns retryable `503` and a later identical
authorized request resumes the persisted operation. The completed-retry rule in
accepted semantic 26 is the only case that does not require the supplied Row
Version to remain current.

Extend the storage provider with a distinct exact idempotent purge operation:
missing bytes/`ENOENT` are success, while every other I/O failure is surfaced to
the purge workflow. Retain `delete_best_effort` only for upload compensation.
The service commits `pending` before storage I/O, performs exact deletion outside
the transaction, then commits `completed` or `failed`; it never marks the Asset
or File purged based on a swallowed storage error.

### Stable error contract

Keep `{ error: { type, message, details? } }`. Use:

- `400 invalid_revision_request`, `invalid_carry_forward_request`,
  `carry_forward_batch_limit`, `invalid_idempotency_key`;
- tenant-safe `404 project_not_found`, `project_version_not_found`,
  `artifact_edition_not_found`, `artifact_revision_not_found`,
  `capture_asset_not_found`;
- `409 edition_conflict`, `working_draft_conflict`,
  `artifact_edition_not_editable`, `project_version_read_only`,
  `carry_forward_target_conflict`, `idempotency_key_reused`,
  `capture_asset_lifecycle_conflict`, `capture_asset_protected`;
- `403 project_access_denied` through the existing authorization wrapper;
- `503 capture_asset_purge_failed` with safe retry guidance and no storage key.

Carry conflict details identify every selected blocker before writes. Cross-
tenant/Project IDs must collapse to not-found/denied behavior and never appear in
details.

## Authorization And Security

- All routes require the current authenticated Organization context and current
  Project Membership/implicit Owner resolution.
- Revision list/detail: `artifact.read` for Admin, Editor, Viewer.
- Checkpoint/restore: `revision.checkpoint_restore` for Admin/Editor.
- Carry-Forward: `revision.carry_forward` for Admin/Editor.
- Asset archive/restore: `capture.write` for Admin/Editor.
- Protection report/purge/retry: `asset.purge` for Project Admin/Owner only.
- The app composition maps methods explicitly; do not rely only on route-name
  inference. Add tests proving Viewers cannot checkpoint, restore, carry, archive,
  restore Assets, or purge, and Editors cannot purge.
- Every repository query includes Organization and Project scope. Project Version
  IDs, Edition IDs, Revision Numbers, Capture Asset IDs, and idempotency rows are
  never trusted independently.
- Archived Project blocks all new operations. Archived source Version/Edition is
  readable and usable only inside authorized Carry-Forward to another active
  Version in the same active Project.
- Raw idempotency keys, file storage keys, page URLs, captured input, passwords,
  content bodies, and screenshot bytes must not enter logs, errors, or Audit
  summaries.
- Revision preview Asset URLs use existing authorized Project Asset-file routes;
  public access remains only through current Publish Link rules.

## Audit, Access, And Activity

Register every new writer/table/route with the existing database mutation guard,
deferred evidence guard, source coverage, route coverage, and runtime grants.

Commands/actions:

- `guide.revision.checkpoint` -> `guide.revision.created`
- `guide.revision.restore` -> `guide.revision.restored`
- `interactive_demo.revision.checkpoint` ->
  `interactive_demo.revision.created`
- `interactive_demo.revision.restore` ->
  `interactive_demo.revision.restored`
- `artifact.carry_forward` -> `artifact.editions.carried_forward`
- `capture_asset.archive` -> `capture_asset.archived`
- `capture_asset.restore` -> `capture_asset.restored`
- `capture_asset.purge.request` -> `capture_asset.purge_requested`
- `capture_asset.purge.fail` -> `capture_asset.purge_failed`
- `capture_asset.purge.complete` -> `capture_asset.purged`

One successful Carry-Forward transaction creates one Audit Event with typed
Change Items for newly created source Revision rows, operation/items, target
Editions/Drafts/children, lineage, asset references, and Row Version state. A
reused source Revision is identified by the carry item/source Revision ID; it
must not receive a fabricated create/update Change Item. A replayed request
creates no new event. A failed or rolled-back batch creates no committed
mutation event.

Restore records displaced/new child rows and Edition/Draft version changes in
one event. Purge request/failure/completion are separate truthful committed
states because storage I/O cannot share the PostgreSQL transaction. No event may
say `purged` until exact byte deletion succeeded.

Revision list/detail/protection reads receive Access Events through the existing
coverage policy. Denials use the appropriate Project/Artifact/Asset access-denied
actions. Project Activity shows concise checkpoint, restore, Carry-Forward,
archive/restore, protected-purge rejection only as denial evidence for Admins,
and completed purge labels without exposing digests or raw dependency data.
Viewers see ordinary Revision history, not raw Audit Change Items.

## Portal Behavior

- Remove the stale Default-only Guide/Demo workspace gating and child-118 copy;
  every directly selected Project Version shows Guide and Interactive Demo links.
- Add `Carry forward artifacts` to an active target Version workspace for Admins
  and Editors only. The page chooses one other source Version, clearly separates
  archived sources, loads Guide/Demo Editions, permits `1..50` selections, shows
  target conflicts before submit when known, generates a fresh idempotency key
  per intended batch, and retains that key for retry until a definitive result.
- Carry success links each new target Edition. A replay is labeled as the same
  completed operation, not as a second copy. Conflicts list all blockers and do
  not imply partial creation.
- Guide and Demo editors/previews link to `Revision history`. The history page
  shows Revision Number, trigger, creator, timestamp, and immutable preview.
  Admin/Editor users on an active editable Edition may create a checkpoint and
  restore with confirmation; Viewers and archived contexts see history only.
- Revision preview routes are the accepted canonical portal shapes:
  `/projects/:projectId/versions/:versionSlug/guides/:artifactId/revisions/:revisionNumber`
  and the Interactive Demo equivalent. They render immutable content and never
  mount editable controls.
- Checkpoint/restore/carry controls show pending, success, no-op/reused,
  conflict, permission, and failed-request states and disable duplicate submit.
- Capture Asset cards show Active/Archived. Admins/Editors may archive/restore;
  only Admins see `Review purge`. Purge uses an explicit destructive confirmation
  step, loads the protection report, lists dependency counts, disables confirm
  while protected, and exposes retry when storage deletion failed.
- Archived referenced Assets remain visible in existing Guide/Demo Working Draft
  and Revision views but remain absent from new-asset pickers. Revision detail
  DTOs compose safe archived-Asset metadata and authorized file URLs from the
  immutable graph; they never expose a storage key or Capture page URL.
- Do not add child-120 public version selectors or redesign the editors.

## Migration, Reset, Compatibility, And Rollback

- Add migration `023`; never edit `001` through `022`.
- The repository is pre-live. Existing relational authored rows may remain and
  receive no Revisions until triggered. Existing supported Capture Assets become
  `active`.
- Refuse `UP` when preexisting Published Artifacts exist without the typed asset
  projection, or when legacy deleted Capture Asset/File rows cannot be classified
  safely. The error must instruct development/test reset and reseed through
  `023`; do not parse snapshot JSON into authoritative dependency rows.
- Current publish creation must transactionally insert the typed Asset projection
  beside each new snapshot and include those rows in the same Audit Event. The
  projection contains every Capture Asset ID in the immutable current-schema
  Published Artifact snapshot, including authored references hidden from the
  current UI renderer. Projection rows are immutable history and remain after a
  Publish Link is revoked, repointed, or removed.
- Existing public route shapes and snapshot rendering remain unchanged. Archived
  Asset resolution must pass for Working Draft export and current public reader/
  viewer/file streaming.
- Update reset support to truncate new restrictive-FK tables in dependency order.
- Extend `migrate.ts`/schema verification to select the `023` catalog and verify
  tables, constraints, indexes, triggers, grants, immutable runtime privileges,
  command policy, and audit/access coverage.
- `DOWN` refuses while any Revision, Carry-Forward, lineage, purge operation,
  non-active Asset lifecycle, or Published Asset projection exists. Empty
  `DOWN` restores migration-022 guards/grants exactly; fresh `DOWN`/`UP` must
  pass.
- No old/new API dual-write or aliases are required. The existing in-repo
  Capture Asset DELETE consumer set is empty; move all in-repo callers to the
  clean archive/purge contract together.
- Child `120` may reuse Revision and asset-reference tables, then remove the
  temporary snapshot/projection seam atomically. Child `119` must not leave two
  competing Revision sources.

## TDD Implementation Order

1. Recheck `HEAD`, worktree ownership, child `118`, master `005`, migration
   `022`, and the current DB/browser blockers.
2. Add failing shared constant/contract and Guide/Demo Revision-policy tests.
3. Add failing migration static/catalog/runtime-role/empty-DOWN-UP/reset tests,
   then implement migration `023` and schema verification.
4. Add failing canonical-content tests for ID/Row-Version-insensitive equality,
   ordering, decimal/null normalization, and Demo transition target mapping.
5. Add failing Revision service/repository/audit/route tests, then implement
   checkpoint, list/detail, reuse, restore, lifecycle, tenant, and concurrency.
6. Add failing Carry-Forward domain/service/repository/audit/route tests, then
   implement idempotency, locks, validation, source Revision creation/reuse,
   atomic mixed copying, lineage, and conflicts.
7. Add failing Capture Asset archive/protection/purge/storage tests, then split
   archive from purge and implement exact retryable storage deletion.
8. Add failing Publish projection and archived-reference tests, then maintain the
   temporary relational dependency seam without redesigning Publication.
9. Update Audit/Access/Project Activity registries and database coverage with
   failing coverage tests first.
10. Add portal API/route tests, then the minimal history, immutable preview,
    Carry-Forward, asset lifecycle, and named-Version workspace UI.
11. Run focused unit/route/component suites, fresh migration/catalog/runtime
    tests, full DB integration, and a two-Version smoke journey.
12. Run broad repository tests, type-check, lint, build, whitespace, then real
    browser dogfood. Update child/master closeout only after evidence is honest.

## Test And Verification Plan

### Focused unit and contract coverage

- strict schemas reject unknown fields, malformed IDs, duplicate selections,
  over-limit batches, invalid counters, and raw/digest confusion;
- semantic equality ignores IDs/versions/timestamps but detects every authored
  scalar/order/reference/transition change;
- Guide/Demo Revision graphs preserve type-specific constraints;
- checkpoint numbering, latest reuse, no-op audit behavior, stale Edition/Draft
  conflict, archive rules, and immutable detail mapping;
- restore full replacement, new mutable IDs, child Row Version reset, aggregate
  version increments, no-op, stale-before-no-op, and immutable source retention;
- Carry-Forward source/target validation, mixed type order, max batch, archived
  source, active target, copied/cleared fields, lineage, source independence,
  target absence, raw-key secrecy, actor-scoped exact retry before changed-target
  validation, mismatched retry, cross-type duplicate rejection, exactly one typed
  detail per ordered item, and all-or-none conflict details;
- capability matrix: Viewer denied writers, Editor denied purge, Admin/Owner
  allowed, removed member and cross-tenant/project/version IDs denied safely;
- asset archive/restore selection/resolution, protection counts, exact storage
  success/ENOENT/failure/retry/crash-state behavior, completed replay without a
  stale Row Version, shared-File protection, and Audit action truth;
- session Asset-list active/archive filtering, active-only authoring pickers, and
  authorized archived exact metadata/file resolution;
- portal loading/empty/reused/no-op/conflict/permission/archived/destructive/
  retry states and canonical route parsing.

### PostgreSQL and migration coverage

- clean `001..023` migration and exact schema catalog;
- retained-data refusal messages, empty `023 DOWN/UP`, reset/reseed, and runtime
  grants;
- immutable Revision roots/children reject update/delete and enforce scoped FKs;
- concurrent checkpoint/Carry-Forward tests prove sequential numbering,
  idempotency, deterministic lock behavior, and no partial target batch;
- concurrent reference-versus-purge tests prove the shared Asset/File locking
  protocol permits exactly one safe outcome and never deletes newly referenced
  bytes;
- same Artifact can have independent Editions/Revisions in two Versions;
- restore creates new mutable identities while Revision rows remain byte-for-byte
  unchanged;
- cross-Organization/Project/Version/Edition/child/Asset mismatch denial;
- archived source allowed only through Carry-Forward; archived target/project and
  ordinary checkpoint/restore writes blocked by application and DB guards;
- protected graph covers Working Draft, Revision, and Published projection; a
  referenced archived Asset resolves and cannot purge, while an unreferenced
  archived Asset completes physical purge;
- Published projection protects every immutable current-schema Published
  Artifact independently of current Publish Link targeting and survives link
  revoke/repoint/removal;
- another non-purged Capture Asset sharing the same File blocks purge, and the
  exact storage provider distinguishes `ENOENT` from other I/O failures;
- audit mutation/evidence guards cover every inserted/updated table and no-op,
  replayed, failed, or rolled-back operations create no misleading event;
- current publish/read/export/embed behavior remains compatible.

Required commands after the environment is configured:

```text
rtk pnpm --filter server run test:setup
rtk pnpm --filter server run test:db
rtk pnpm --filter server run test:smoke
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

Add both new DB integration files to `apps/server/package.json` `test:db`.
Database evidence is mandatory for this persistence child. If
`testing_maintenance` remains unavailable, record DB verification as blocked;
never substitute mocked tests or the previous child's run.

### DB-backed smoke

Using synthetic fixtures in one active Project:

1. create Default source `Main` and active target `2.0`;
2. create/edit one Guide and one Demo in `Main` with shared screenshots;
3. checkpoint both, edit again, and verify new/reused Revision behavior;
4. Carry Forward both in one batch and retry the identical request;
5. prove source/target Edition lineage, independent IDs/edits, cleared Capture
   provenance, shared File IDs, and no duplicate target Editions;
6. checkpoint the target Edition, edit it, restore its older target Revision,
   and verify immutable history is unchanged;
7. make `2.0` Default, archive former Default `Main`, create active target `3.0`,
   and prove archived `Main` remains a valid Carry-Forward source for a different
   Artifact absent from `3.0`;
8. archive a referenced Asset, render/export Working Draft and Revision/current
   publication, and prove purge returns dependencies;
9. archive and purge an unreferenced synthetic Asset, verify File bytes are gone,
   retry is safe, and Audit/Access evidence remains;
10. prove Viewer/Editor/Admin boundaries and cross-tenant denial.

## Agent-Browser Validation Requirements

This child changes browser-visible authoring, immutable history, Version
navigation, Carry-Forward, and destructive asset behavior. Real-browser evidence
is mandatory through `dogfood-ossie` and `agent-browser` with synthetic local
fixtures.

Before testing, recheck the child-118 blockers: a working
`GET /api/v1/public/instance`, authentication session touch, migrated DB through
`023`, and seeded Project roles. Fix only defects caused by/in scope for child
`119`; record unrelated environment failures precisely.

Use named sessions such as `child119-admin`, `child119-editor`,
`child119-viewer`, and a separate public context. Validate:

1. desktop (`1440x900`) and narrow mobile (`390x844`) source/target Version
   navigation, including named and archived sources;
2. Guide and Demo checkpoint, reused checkpoint, history, immutable deep link,
   reload/back-forward, edit-after-checkpoint independence, restore confirmation,
   and restored content;
3. mixed Guide/Demo Carry-Forward, pending state, success links, exact retry,
   target conflict with no partial UI claim, and source/target independent edits;
4. Admin/Editor/Viewer control visibility and direct-route/API denial;
5. Asset archive disappearing from pickers while existing Working Draft,
   Revision, export, public reader/viewer, and file routes remain usable;
6. protected purge dependency presentation, disabled confirmation, unreferenced
   destructive confirmation, success, storage failure/retry where safely
   injectable, and no misleading completion;
7. loading, empty history/source list, not-found, stale conflict, failed request,
   archived/read-only, permission, long title/content, and 50-item boundary;
8. keyboard-only operation, visible focus, logical order, accessible names,
   confirmation escape/cancel, and no keyboard trap;
9. 200% zoom/reflow, overflow/clipping/overlap, and no fixed-layout corruption;
10. console errors, uncaught exceptions, failed/unexpected network requests,
    redirects, duplicate submissions, and authorization leaks.

Record route, role, fixture, viewport, steps, result, console/network status, and
temporary screenshot paths. Never capture raw idempotency headers, cookies,
credentials, storage keys, private URLs, or customer content. Close sessions and
stop services afterward. A blocked browser capability is not a pass.

## Acceptance Criteria

- [ ] Guide and Demo Revisions are immutable, explicitly relational, complete
      authored checkpoints with Edition-scoped Revision Numbers.
- [ ] Manual checkpoint and Carry-Forward create or reuse only the identical
      latest Revision; autosave does not create Revisions.
- [ ] Restore replaces mutable authored state with new child identities and never
      rewrites history.
- [ ] Revision list/detail is readable by Viewers and writers are limited to
      Admin/Editor with lifecycle and Row Version enforcement.
- [ ] Carry-Forward is one-source/one-target, same-Project, mixed-type, bounded,
      atomic, idempotent, conflict-explicit, and lineage-complete.
- [ ] Target Editions are independent drafts with cleared Capture provenance,
      reused protected media, new mutable IDs, and no source/target sync.
- [ ] Archived sources work only through the accepted Carry-Forward exception;
      archived target/project and ordinary authoring writes remain blocked.
- [ ] Asset archive preserves existing Working Draft, Revision, export, and
      current Published Artifact resolution while preventing new selection.
- [ ] Physical purge is Project Admin-only, retryable, storage-truthful, blocked
      by the complete relational reference graph, and does not erase evidence.
- [ ] Current publication compatibility maintains typed Asset references without
      claiming child `120`'s Revision-backed publication target.
- [ ] Audit/Access/database mutation coverage, tenant isolation, runtime grants,
      migration/reset/rollback, focused/broad/DB/smoke checks pass.
- [ ] Required browser journeys pass or have precise current capability blockers
      with no fabricated evidence.
- [ ] Child `120` can point Published Artifacts at exact Revisions and remove the
      temporary snapshot/projection seam without another authoring rewrite.

## Expansion And Recheck Checklist

- [x] Child `118`, canonical language, accepted ADRs/grill, master, current code,
      tests, history, and clean worktree inspected.
- [x] Current Revision absence, asset-delete hazard, publication compatibility,
      authorization primitives, stale named-Version UI, DB blocker, and browser
      blocker recorded.
- [x] Exact schemas, routes, contracts, behavior, concurrency, idempotency,
      security, Audit/Access, migration, compatibility, UI, tests, and non-scope
      defined.
- [x] Archived-source Revision creation reconciled as the narrow accepted
      Carry-Forward exception; no unresolved critical decision remains.
- [x] Exact affected file inventory and child-`120` handoff recorded.
- [x] TDD, DB/smoke, broad verification, and real-browser evidence specified.
- [x] Rechecked against `HEAD` `38de033`, master `005`, implemented child `118`,
      current schemas/routes/tests, and the clean attributable worktree state.
- [x] Planning checkpoint committed separately from runtime implementation.
- [ ] Implementation agent rechecks then-current `HEAD`, worktree ownership, and
      capability blockers before coding.

## Delivery And Closeout Checklist

- [ ] Establish failing tests before each behavior boundary.
- [ ] Implement only this child and preserve unrelated user/agent changes.
- [ ] Keep core Revision, lineage, protection, and operation state relational.
- [ ] Run focused, broad, migration, DB, smoke, storage, and browser verification.
- [ ] Update this file with implementation status, checklist, log, exact evidence,
      blockers, leftovers, and commits.
- [ ] Update master `005` only for genuinely completed child `119` items.
- [ ] Commit attributable implementation and closeout changes in small logical
      commits.

## Implementation Log

Not started.

## Verification Record

Planning verification only: the expanded contract was rechecked against current
code, master `005`, implemented child `118`, accepted domain records, and current
git history; formatting and whitespace checks passed at the planning checkpoint.
No runtime, migration, database, storage, or browser implementation verification
was run. Child-118 DB/browser blockers are baseline facts to recheck, not
child-119 results.

## Handoff To Child 120

Child `120` must build on:

- immutable type-specific Revision roots/graphs and exact Revision IDs;
- Edition-scoped Revision Numbers and semantic latest-Revision reuse;
- current Edition/Working Draft ownership and immutable immediate lineage;
- protected shared-Asset resolution and the complete purge graph;
- the temporary Published Artifact Asset projection maintained here.

Child `120` owns:

- invoking the reserved `publication` Revision trigger;
- replacing `published_artifact.snapshot_json` with exact Revision FKs and typed
  relational rendering;
- Publication Sequence and immutable Published Artifact clean schema;
- multi-version Publish Link manifests, version entry ordering/default,
  canonical version-specific public paths, selector, explicit link updates,
  rollback, and removal of the temporary projection seam.

Do not carry the current snapshot JSON into a second permanent source of truth.
Do not weaken Revision immutability or asset protection to simplify publication.
