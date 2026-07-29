# Child Plan 127: Guide Authoring And Reader UI Modernization

Date reserved: 2026-07-12

Expanded and rechecked: 2026-07-29. Refreshed after child `126` completion at
`361df03`.

Status: Implementation-ready. Child `126` passed its installed-toolbar
acceptance gate on 2026-07-29; runtime implementation may begin after the
required preflight in this plan.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisites:

- Children `118`, `119`, and `120` are complete. Their implemented relational
  Artifact Edition, Working Draft, Artifact Revision, Carry-Forward, Protected
  Shared Asset, Published Artifact, Publication Sequence, and Publish Link
  contracts are inherited and must not be redesigned here.
- Children `121` through `125` are complete. Their design system, portal shell,
  Project/Project Version workspace, and Capture portal patterns are the UI
  baseline for this child.
- Child `126` is Complete after its 2026-07-29 installed toolbar-popup matrix
  proved automatic/manual API persistence, privacy suppression, restart
  restoration, overlap safety, and canonical named-version portal handoff.
- Before the first runtime change for this child, confirm child `126` remains
  Complete and account for any later repository changes.

The predecessor gate is satisfied. If later repository changes reopen child
`126`, stop after preflight and report the blocker without changing runtime
files.

Next child:

- `128` Interactive Demo Authoring And Viewer UI Modernization, only after this
  child is implemented, browser-verified, closed, and handed off.

Starting state for this expansion:

- original expansion commit: `f9abd7d`;
- post-child-`126` readiness-refresh commit: `361df03`;
- `git diff 32a4414..361df03` contains only child `126`/`127` plans, master
  status, browser evidence, and synthetic screenshots; no Guide, Publication,
  route, schema, migration, or runtime file changed after this plan's original
  code inspection;
- worktree: clean;
- `rtk` is not installed, so baseline commands used the documented direct
  `pnpm` fallback;
- `pnpm --filter web test`: 47 files, 301 tests passed;
- `pnpm --filter web check-types`: passed;
- `pnpm --filter web lint`: passed;
- `pnpm --filter web build`: passed;
  - JS: 449.48 kB raw / 123.46 kB gzip;
  - CSS: 64.59 kB raw / 12.76 kB gzip;
- nine focused Guide/Publication/Revision/Carry-Forward server contract files:
  19 tests passed;
- `apps/web/src/features/guide/GuideEditorPage.tsx` is 1,723 lines and must be
  split before adding behavior;
- no runtime, schema, migration, or product behavior change is included in this
  planning checkpoint.

Child `126`'s completed result contributes only a satisfied sequence gate and
the already-verified canonical Capture Session handoff into this child:

- the installed extension completes a Capture Session and opens its canonical
  named Project Version Capture detail route;
- child `125` Capture detail remains the owner of explicit `Create guide` and
  `Create interactive demo` actions;
- no extension storage, token, popup, background worker, content script,
  Puppeteer harness, or extension permission becomes a Guide authoring
  dependency;
- child `127` starts at the portal/API boundary and must not reopen child `126`
  behavior unless a separately demonstrated predecessor regression exists.

## Goal

Modernize the complete Guide workflow into a quiet, version-aware authoring
workbench and content-first reader while preserving the shipped Guide
Block/Step/Annotation domain model and every accepted Edition, Revision,
Publication, public-access, and authorization invariant.

The result must let a Project Editor or Project Admin:

- generate a Guide from a Capture Session;
- find the Guide in the selected Project Version;
- author and reorder Guide Blocks and Steps;
- select or upload screenshots;
- create and edit normalized Guide highlight geometry;
- recover from failed requests, stale Row Versions, permission changes, and
  missing assets without silent data loss;
- preview, export, checkpoint, restore, Carry Forward, publish, and manage
  Publish Links;
- verify the exact immutable Publication in reader and embed modes.

A Project Viewer must receive the same readable content, Revision history,
Publication history, and permitted exports without authoring, checkpoint,
Carry-Forward, Publication, or Publish Link mutation controls.

## Completion Criteria

Child `127` is complete only when all of the following pass:

- Guide generation from Capture retains the Capture Session's exact Project
  Version and canonical editor route;
- list, editor, preview, Revision history/detail, Carry-Forward, Publication,
  Publish Link, public reader, and embed workflows use qualified domain
  language and canonical routes;
- every mutable command sends the current Edition or Working Draft Row Version
  required by the existing contract;
- stale Edition, Working Draft, and Publish Link conflicts are explicit,
  recoverable, and never silently overwrite or discard local text;
- archived Project, archived Project Version, archived Artifact Edition, and
  Viewer contexts are accurately read-only;
- source and target Editions remain independent after Carry-Forward;
- Working Draft changes never leak into an existing Artifact Revision or
  Published Artifact;
- Guide screenshots and annotations render from the correct protected Asset;
- annotation coordinates remain normalized and visually correct in the editor,
  authenticated preview, Revision preview, public reader, and embed at desktop,
  narrow mobile, and 200% reflow;
- Markdown and HTML ZIP export behavior remains exact and failure-safe;
- Publication and Publish Link controls use `Revision`, `Publication`, and
  `Publication Sequence`, never ambiguous `version` or `Published version`;
- public, restricted, password-required, wrong-password, expired, revoked,
  missing-version, missing-asset, reader, and embed states pass;
- raw Guide and Interactive Demo public JSON uses strict public-only
  projections and omits actor/source-authoring metadata prohibited by child
  `120`;
- keyboard, focus, status announcements, dirty-state warnings, reduced motion,
  long content, slow/failed media, console, and network checks pass;
- no new domain persistence, migration, public URL, permission, retention, or
  major dependency is introduced;
- focused tests, relevant DB/smoke verification, broad repository checks, and
  dated `agent-browser` evidence pass.

## Canonical Domain Rules

Use these terms exactly:

- Guide;
- Guide Block;
- Guide Step;
- Guide Annotation;
- Artifact;
- Artifact Edition;
- Working Draft;
- Row Version;
- Artifact Revision;
- Artifact Revision Number;
- Carry-Forward;
- Published Artifact;
- Publication;
- Publication Sequence;
- Publish Link;
- Project Version;
- Protected Shared Asset.

Required distinctions:

- `Guide` is the stable Artifact identity across Project Versions.
- `Artifact Edition` is the authored representation for one Project Version and
  owns title, description, and `draft`/`archived` lifecycle.
- `Working Draft` is the only mutable authored state.
- `Row Version` is optimistic-concurrency metadata and is not user-facing
  history.
- `Artifact Revision` is an immutable checkpoint. Its Revision Number is scoped
  to one Artifact Edition.
- `Published Artifact` identifies one exact Artifact Revision. Its Publication
  Sequence is scoped to one Artifact Edition and is independent of the Revision
  Number.
- `Publish Link` is a stable access route and manifest over explicitly selected
  immutable Publications. It never exposes a Working Draft.
- `Carry-Forward` creates a new independent target Artifact Edition and Working
  Draft. It is not merge or synchronization.
- a Guide Step may reference a Capture Asset/Event, but a Guide Step is not a
  Capture Event;
- a Guide Annotation is not an Interactive Demo Hotspot.

Do not introduce UI labels such as `Guide version`, `Published version`,
`current version`, or unqualified `version history`. Use `Project Version`,
`Revision history`, or `Publication N` as appropriate.

## Current Runtime Map

The implementation agent must preserve this ownership map.

### Browser routing and authorization boundary

- `apps/web/src/App.tsx`
  - parses routes;
  - resolves the selected Project Version through
    `ProjectVersionRouteBoundary`;
  - passes `projectVersionId`, canonical `versionSlug`, and role-derived
    `canWrite`;
  - keeps legacy Project routes as Default Project Version redirects.
- `apps/web/src/lib/routes.ts`
  - owns internal Guide list/editor/preview/Revision route parsing;
  - owns public Guide reader and embed route parsing.
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
  - is the source of the loaded Project, Project Version, archived/read-only
    state, and current Project role.

### Capture-to-Guide handoff

- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
  - owns the current `Create guide` action;
  - posts the Capture Session-derived title/description;
  - navigates to the Guide editor under the Capture Session's canonical Project
    Version slug.
- `apps/server/src/modules/guide/guide.service.ts`
  - generates the Artifact Edition and Working Draft from Capture Events;
  - retains the Capture Session's exact Project Version.

### Guide library and workbench

- `ProjectGuideListPage.tsx` owns Project-Version-scoped Guide Edition listing
  and summarized public-link state.
- `GuideEditorPage.tsx` currently owns too much:
  - bootstrap and mutation orchestration;
  - metadata and Block/Step local drafts;
  - screenshot selection/upload;
  - annotation add/remove;
  - block create/update/delete/reorder;
  - archive/restore;
  - export;
  - Publication and Publish Link composition;
  - screenshot viewer state.
- `GuidePreviewPage.tsx` renders the authenticated Working Draft preview.
- `GuideScreenshotViewer.tsx` owns the modal screenshot viewer and zoom.
- `guideEditorHelpers.ts` owns pure Guide projection and draft helpers.

### Revision and Carry-Forward

- `ArtifactRevisionHistoryPage.tsx` is shared by Guide and Interactive Demo and
  owns list/checkpoint/restore commands.
- `GuideRevisionPreviewPage.tsx` renders one immutable Guide Revision.
- `ProjectCarryForwardPage.tsx` is shared by Guide and Interactive Demo and owns
  multi-Artifact idempotent Carry-Forward.

### Publication and public reading

- `ArtifactPublishingPanel.tsx` is shared by Guide and Interactive Demo and owns
  Publication history, explicit Publish Link rollout, link creation/settings,
  manifest editing, rollback, and revoke.
- `PublicVersionSelector.tsx` owns Publish Link entry navigation.
- `PublicGuideReaderPage.tsx` owns anonymous/public loading, password session,
  canonicalization, reader, and embed states.
- `apps/server/src/modules/publish/*` resolves immutable Revision-backed public
  content and protected Asset files; it never reads a Working Draft for public
  output.

### Domain and transport

- `packages/types/src/guide.ts` owns strict Guide request/response schemas.
- `packages/types/src/artifact-revision.ts` owns Revision contracts.
- `packages/types/src/artifact-carry-forward.ts` owns Carry-Forward contracts.
- `packages/types/src/publish.ts` owns Publication, Publish Link, public reader,
  and public Asset contracts.
- `packages/guide-domain` owns Guide validation and normalized annotation
  coordinate policy.
- `packages/publish-domain` owns Publication, public access, password, and
  Publish Link policy.
- `apps/web/src/lib/api.ts` owns encoded HTTP paths and browser transport.
- audited server repositories remain authoritative for transactional mutation,
  Row Version checks, immutable Revision/Publication graphs, and protected Asset
  references.

## Scope

Implement only:

- Guide generation handoff copy/state where it appears in Capture detail;
- Guide list and library presentation for the selected Project Version;
- Guide editor workbench layout and component extraction;
- explicit dirty/saving/saved/error/conflict state;
- metadata, Block, Step, screenshot, annotation, order, and delete workflows;
- authenticated Working Draft preview;
- Guide Revision history and immutable Revision preview presentation;
- Guide-specific Carry-Forward presentation inside the shared page;
- archive/restore presentation and read-only behavior;
- Markdown copy/download and HTML ZIP download presentation;
- Guide Publication and Publish Link presentation inside the shared panel;
- public Guide reader, version selector, password gate, and embed presentation;
- narrow shared public-response projection repair so Guide and Interactive Demo
  public APIs no longer reuse authenticated Revision DTOs containing actor or
  source-authoring metadata; this is an inherited child `120` security-contract
  correction, not Interactive Demo UI modernization;
- focused server mapping of existing Guide Edition/Working Draft conflict
  exceptions to stable `409` responses, because current Guide mutation routes
  can otherwise surface repository Row Version conflicts as `500`;
- tests, safe fixtures, documentation, and browser evidence required for those
  behaviors.
- one dev/test-only Guide browser fixture that safely creates the roles,
  lifecycle states, Revisions, Publications, Publish Links, and synthetic media
  needed by this child's mandatory browser matrix.

## Explicit Non-Scope

Do not implement:

- child `126` toolbar acceptance or any extension code;
- Interactive Demo editor/viewer modernization from child `128`;
- cross-product accessibility/motion dogfood owned by child `129`, beyond this
  child's own Guide acceptance;
- Documentation, Video, AI generation, comments, approvals, analytics, search,
  localization, or collaboration presence;
- a new Guide block type, annotation type, rich-text/Markdown editor, template
  system, or Guide-to-Demo conversion;
- background autosave, offline editing, real-time collaboration, server push,
  merge/conflict diff infrastructure, or browser-local persistence of authored
  content;
- new keyboard shortcuts. Existing native keyboard behavior and discoverability
  are required; shortcut design remains deferred;
- drag-and-drop reordering. Keep accessible up/down commands unless a separate
  accepted interaction adds complete keyboard parity;
- image editing, cropping, redaction, OCR, drawing tools, or mutation of Capture
  Assets;
- changing Capture source immutability or selecting a different Project Version
  after an Artifact Edition exists;
- Project membership, Project Version management, Activity/Compliance, or
  Project shell redesign;
- a new public route, changed Publish Link slug, changed cookie, token-in-URL,
  or authenticated draft-sharing route;
- changing public visibility semantics: `restricted` remains non-public rather
  than an authenticated portal reader mode;
- changing public content behavior beyond removing fields that accepted child
  `120` already prohibited; public content identifiers required for media lookup
  or Demo scene transitions remain available through dedicated public DTOs;
- deleting Artifact Revisions, Published Artifacts, or publication history;
- schema/migration changes, reset/reseed requirements, or JSON persistence;
- changing Audit/Access retention or adding client-authored audit payloads;
- new major dependencies, router, query cache, form framework, editor framework,
  toast framework, or component library;
- broad `packages/ui` redesign or unrelated CSS cleanup.

## Exact Files Expected To Change

### Planning, docs, and evidence

- `docs/plan/127-guide-authoring-and-reader-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  - closeout only, and only for completed child `127` items.
- `docs/ui/127-guide-authoring-and-reader-ui-browser-evidence.md` (new)
- `docs/ui/evidence/127/` (new safe synthetic screenshots/evidence)
- `docs/v1-dogfood-smoke-suite.md`
  - update only with a dated Guide run or a precise blocked result.

### Dev/test browser fixture

- `apps/server/package.json`
  - add one explicit local-only Guide browser seed script.
- `apps/server/src/dev-fixtures/guide-browser-fixture.ts` (new)
- `apps/server/src/dev-fixtures/guide-browser-fixture.cli.ts` (new)
- `apps/server/src/dev-fixtures/guide-browser-fixture.test.ts` (new)
- `apps/server/src/dev-fixtures/guide-browser-fixture.db.integration.test.ts`
  (new)

The fixture may compose the existing child `125-01` Capture fixture data, but
must not change that fixture's public contract or make production startup depend
on fixture code. It must use the existing disposable-database maintenance guard,
refuse a non-testing database, use only synthetic content/media, and print no
environment-file secrets.

### Capture-to-Guide handoff

- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css`
  - only the Guide generation action/status and canonical handoff are in scope;
    preserve all child `125` Capture behavior and Interactive Demo behavior.

### Guide library, editor, preview, and reader

- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.module.css`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.module.css`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.module.css`
- `apps/web/src/features/guide/GuideScreenshotViewer.tsx`
- `apps/web/src/features/guide/GuideScreenshotViewer.test.tsx`
- `apps/web/src/features/guide/GuideScreenshotViewer.module.css`
- `apps/web/src/features/guide/PublicGuideReaderPage.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.test.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.module.css`
- `apps/web/src/features/guide/guideEditorHelpers.ts`
- `apps/web/src/features/guide/guideEditorHelpers.test.ts`
- `apps/web/src/features/guide/types.ts`

New editor files:

- `apps/web/src/features/guide/GuideEditorWorkbench.tsx`
- `apps/web/src/features/guide/GuideEditorWorkbench.test.tsx`
- `apps/web/src/features/guide/GuideEditorOutline.tsx`
- `apps/web/src/features/guide/GuideEditorOutline.test.tsx`
- `apps/web/src/features/guide/GuideBlockEditor.tsx`
- `apps/web/src/features/guide/GuideBlockEditor.test.tsx`
- `apps/web/src/features/guide/GuideScreenshotPanel.tsx`
- `apps/web/src/features/guide/GuideScreenshotPanel.test.tsx`
- `apps/web/src/features/guide/GuideAnnotationEditor.tsx`
- `apps/web/src/features/guide/GuideAnnotationEditor.test.tsx`
- `apps/web/src/features/guide/GuideEditorRecovery.tsx`
- `apps/web/src/features/guide/GuideEditorRecovery.test.tsx`

The implementation agent may consolidate a pair of these new presentational
files when the extracted responsibility remains clear and every touched
new/extracted Guide editor runtime/test file stays below 1,000 lines. Do not
keep adding behavior to the 1,723-line page.

### Revision, Carry-Forward, Publication, and public selection

- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.tsx`
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.test.tsx`
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.module.css`
- `apps/web/src/features/artifact-revision/GuideRevisionPreviewPage.tsx`
- `apps/web/src/features/artifact-revision/GuideRevisionPreviewPage.test.tsx`
- `apps/web/src/features/artifact-revision/ArtifactRevisionPreview.module.css`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.tsx`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.module.css`
- `apps/web/src/features/publish/ArtifactPublishingPanel.tsx`
- `apps/web/src/features/publish/ArtifactPublishingPanel.test.tsx`
- `apps/web/src/features/publish/ArtifactPublishingPanel.module.css`
- `apps/web/src/features/publish/PublicVersionSelector.tsx`
- `apps/web/src/features/publish/PublicVersionSelector.test.tsx`
- `apps/web/src/features/publish/PublicVersionSelector.module.css`

Changes to shared Artifact/Demo-capable components must be presentation-safe for
Interactive Demo. Do not modernize Demo-specific editor/viewer behavior early.

The existing server files
`apps/server/src/modules/guide/guide.routes.ts` (1,258 lines) and
`apps/server/src/modules/guide/guide.db.integration.test.ts` (1,345 lines)
already exceed 1,000 lines. Child `127` owns only surgical conflict mapping and
DB assertions there; it must not expand into a server-module split solely to
satisfy the Guide editor extraction rule. If a server extraction becomes
necessary for correctness, amend this plan first and keep it behavior-preserving.

### Shared public contract and server corrections

- `packages/types/src/publish.ts`
- `packages/types/src/publish.test.ts`
  - replace authenticated Revision DTO reuse in public response schemas with
    strict public-only Revision, Guide, and Interactive Demo projections;
  - retain only fields required to render immutable public content;
  - reject actor IDs, Edition/Revision IDs, Working Draft Row Versions, Capture
    source provenance, and other authenticated-only metadata.
- `apps/server/src/modules/publish/publish.repository.ts`
  - construct the public-only projection server-side; frontend filtering is not
    a security boundary.
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
  - add focused and DB-backed assertions that both Guide and Interactive Demo
    public responses omit prohibited fields while their reader/viewer behavior
    and protected-media resolution remain intact.
- `apps/server/src/modules/guide/guide.routes.ts`
- `apps/server/src/modules/guide/guide.routes.test.ts`
  - add stable `409` mapping for existing `GuideEditionConflictError` and
    `GuideWorkingDraftConflictError`;
  - use `edition_conflict` and `working_draft_conflict`, matching Revision
    routes, unless a current shared error contract proves `row_version_conflict`
    is already canonical across callers.

### Conditional routing and transport files

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
  - preserve current routes; change only if component extraction requires
    helper consolidation or a failing canonicalization test.
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
  - preserve current API paths and schemas; change only for typed error handling
    or a focused failing request-contract test.

These six web files are not expected to change merely because components are
extracted. Move one into the implementation diff only when a failing focused
test demonstrates that route canonicalization or typed error transport needs a
correction. Otherwise verify it and leave it untouched.

## Files To Read And Verify, Not Change

- `CONTEXT.md`
- `PRODUCT.md`
- `DESIGN.md`
- `docs/adr/0004-guide-blocks-with-first-class-steps.md`
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`
- `docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md`
- `docs/adr/0024-project-membership-governs-project-access.md`
- `docs/adr/0025-core-domain-persistence-is-explicitly-relational.md`
- `packages/constants/src/guide.ts`
- `packages/constants/src/artifact-edition.ts`
- `packages/constants/src/artifact-revision.ts`
- `packages/constants/src/publish.ts`
- `packages/types/src/guide.ts`
- `packages/types/src/guide.test.ts`
- `packages/types/src/artifact-revision.ts`
- `packages/types/src/artifact-revision.test.ts`
- `packages/types/src/artifact-carry-forward.ts`
- `packages/types/src/artifact-carry-forward.test.ts`
- `packages/guide-domain/**`
- `packages/publish-domain/**`
- `apps/server/src/modules/guide/guide.service.ts`
- `apps/server/src/modules/guide/guide.repository.ts`
- `apps/server/src/modules/guide/guide.audit.ts`
- `apps/server/src/modules/guide/guide-screenshot-upload.audit.ts`
- `apps/server/src/modules/artifact-revision/**`
- `apps/server/src/modules/artifact-carry-forward/**`
- `apps/server/src/modules/publish/publish.routes.ts`
- `apps/server/src/modules/publish/publish.service.ts`
- `apps/server/src/modules/publish/publish.audit.ts`
- all other `apps/server/src/modules/publish/**` files not explicitly listed in
  the affected-file section;
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/db/migrations/022_guide_demo_edition_working_draft_relational_foundation.sql`
- `apps/server/src/db/migrations/023_guide_demo_revision_carry_forward_protected_assets.sql`
- `apps/server/src/db/migrations/024_revision_backed_publication_and_publish_link_manifests.sql`
- `packages/ui/src/**`
- `pnpm-lock.yaml`

Do not change these files merely to restate UI behavior. If a focused failing
test proves a current server/schema/domain contract is unsafe or inconsistent,
amend this plan before expanding beyond the two corrections explicitly owned
here: the public-response allowlist and Guide route conflict mapping.

The new Guide browser fixture is test support rather than product persistence.
It may reset/reseed only the configured disposable testing database. It must not
add a production route, migration, runtime registration, startup hook, or
deployable dependency.

## Browser Routes

Preserve these canonical internal routes:

```text
/projects/:projectId/versions/:versionSlug/guides
/projects/:projectId/versions/:versionSlug/guides/:guideId
/projects/:projectId/versions/:versionSlug/guides/:guideId/preview
/projects/:projectId/versions/:versionSlug/guides/:guideId/revisions
/projects/:projectId/versions/:versionSlug/guides/:guideId/revisions/:revisionNumber
/projects/:projectId/versions/:versionSlug/carry-forward
```

Legacy versionless Guide routes continue redirecting through the Project's
Default Project Version. New Guide links must always emit canonical
Project-Version-qualified routes.

Preserve these public routes:

```text
/p/:publishLinkSlug
/p/:publishLinkSlug/embed
/p/:publishLinkSlug/versions/:versionSlug
/p/:publishLinkSlug/versions/:versionSlug/embed
```

Rules:

- the base route resolves the Publish Link's explicit default entry;
- the version route resolves only an entry included in that Publish Link;
- aliases canonicalize to the current Project Version slug;
- reader/embed mode is preserved during canonicalization and version changes;
- query strings, fragments, or guessed internal identifiers must not bypass
  public access policy;
- internal Guide, Edition, Revision, Publication, or actor IDs must not appear
  in top-level reader/embed navigation URLs or visible copy. The accepted
  protected-media subresource route retains its scoped Capture Asset identifier;
  do not reuse that exception for navigation or expose storage identifiers.

## Existing API Contracts To Preserve

Every authenticated Guide route remains Project-nested and cookie-authenticated.
Every Edition/Working Draft/Revision/Publication request includes exact
`project_version_id` context where the existing contract requires it.

### Guide generation and reads

```text
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
GET  /api/v1/projects/:project_id/guides?project_version_id=:id
GET  /api/v1/projects/:project_id/guides/:guide_id?project_version_id=:id
GET  /api/v1/projects/:project_id/capture-assets?project_version_id=:id&asset_type=screenshot
```

Generation request:

```ts
{
  title: string;
  description?: string | null;
  selected_capture_event_ids?: string[];
}
```

The current portal generation action continues to use all eligible Capture
Events unless a separately accepted product change enables selection. The
server remains authoritative for Capture/Project/Project Version scope.

### Working Draft mutations

```text
PATCH  /api/v1/projects/:project_id/guides/:guide_id?project_version_id=:id
POST   /api/v1/projects/:project_id/guides/:guide_id/archive?project_version_id=:id
POST   /api/v1/projects/:project_id/guides/:guide_id/restore?project_version_id=:id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/steps/:guide_step_id?project_version_id=:id
POST   /api/v1/projects/:project_id/guides/:guide_id/blocks?project_version_id=:id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id?project_version_id=:id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder?project_version_id=:id
DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id?project_version_id=:id&expected_working_draft_version=:row_version
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot?project_version_id=:id
POST   /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload?project_version_id=:id
PATCH  /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations?project_version_id=:id
```

Rules:

- metadata and lifecycle mutations send `expected_edition_version`;
- Block, Step, screenshot, annotation, reorder, and delete mutations send
  `expected_working_draft_version`;
- successful mutation responses replace the in-memory authoritative Row Version;
- no two unsafe mutations are sent concurrently against one Working Draft;
- a `409` conflict is never automatically retried;
- multipart upload keeps `file` and `expected_working_draft_version`; supported
  image types and size limits remain server-owned;
- annotation arrays contain at most ten highlights with normalized coordinates:
  `x >= 0`, `y >= 0`, `width > 0`, `height > 0`,
  `x + width <= 1`, and `y + height <= 1`.

Request ownership remains:

| Command                  | Request fields                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| metadata                 | optional `title`, optional nullable `description`, `expected_edition_version`               |
| archive/restore          | `expected_edition_version`                                                                  |
| Step content             | optional `title`, optional nullable `body`, `expected_working_draft_version`                |
| create Block             | `block_type`, optional insertion `position`, type-appropriate content, draft Row Version    |
| update non-Step Block    | optional nullable `title`/`body`, `expected_working_draft_version`                          |
| reorder                  | complete ordered `block_ids`, `expected_working_draft_version`                              |
| delete                   | `project_version_id` and `expected_working_draft_version` in the strict query               |
| select/remove screenshot | nullable `capture_asset_id`, `expected_working_draft_version`                               |
| upload screenshot        | multipart `file`, draft Row Version, and only the existing optional capture metadata fields |
| replace annotations      | complete ordered `annotations` array, `expected_working_draft_version`                      |

Do not send UI-only selection, dirty, pending, or recovery state through these
contracts.

### Export

```text
GET /api/v1/projects/:project_id/guides/:guide_id/export/markdown?project_version_id=:id
GET /api/v1/projects/:project_id/guides/:guide_id/export/html.zip?project_version_id=:id
```

Exports remain authenticated `artifact.read` operations over the selected
Working Draft. Preserve filename, content type, ZIP image inclusion, missing
file, and unsupported storage-provider behavior.

### Artifact Revisions and Carry-Forward

```text
GET  /api/v1/projects/:project_id/guides/:guide_id/revisions?project_version_id=:id
POST /api/v1/projects/:project_id/guides/:guide_id/revisions/checkpoint?project_version_id=:id
GET  /api/v1/projects/:project_id/guides/:guide_id/revisions/:revision_number?project_version_id=:id
POST /api/v1/projects/:project_id/guides/:guide_id/revisions/:revision_number/restore?project_version_id=:id
POST /api/v1/projects/:project_id/artifact-editions/carry-forward
```

Checkpoint/restore send both `expected_edition_version` and
`expected_working_draft_version`. Carry-Forward keeps its `Idempotency-Key`,
source/target Project Version IDs, selected Artifact identities, atomic
all-or-nothing behavior, and target-conflict blocker list.

### Publication and Publish Links

```text
GET  /api/v1/projects/:project_id/guides/:guide_id/publications?project_version_id=:id
POST /api/v1/projects/:project_id/guides/:guide_id/publications?project_version_id=:id
GET  /api/v1/projects/:project_id/guides/:guide_id/publish-links?project_version_id=:id&status=all
POST /api/v1/projects/:project_id/guides/:guide_id/publish-links?project_version_id=:id
PATCH /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id?project_version_id=:id
PUT   /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/entries?project_version_id=:id
POST  /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/entries/:entry_id/rollback?project_version_id=:id
POST  /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/revoke?project_version_id=:id
```

Preserve:

- `expected_edition_version`, `expected_working_draft_version`, and each
  selected Publish Link's `expected_link_version`;
- Publication with zero selected links;
- explicit new-link creation;
- no implicit link selection or rollout;
- independent link manifests;
- one explicit default entry;
- `1..50` selected entries;
- link-wide public/restricted, expiry, and password policy;
- same-Edition rollback only to an older Publication;
- immutable Publication history after revoke or manifest changes;
- write-only raw passwords and non-return of password hashes/salts.

### Public Guide and protected media

```text
GET  /api/v1/public/publish-links/:slug?artifact_type=guide
GET  /api/v1/public/publish-links/:slug/versions/:version_slug?artifact_type=guide
POST /api/v1/public/publish-links/:slug/viewer-sessions?artifact_type=guide
GET  /api/v1/public/publish-links/:slug/versions/:version_slug/assets/:capture_asset_id/file?artifact_type=guide
```

The browser continues sending:

```text
X-Ossie-Access-Surface: public_reader
X-Ossie-Access-Surface: public_embed
```

The password viewer session remains an HttpOnly link-wide cookie with the
existing 12-hour policy. Do not store passwords or viewer tokens in web storage
or URLs.

The current implementation incorrectly spreads authenticated
`ArtifactRevisionSummary`, `GuideRevisionBlock`, and
`InteractiveDemoRevisionDetail` shapes into this public response. That exposes
fields accepted child `120` explicitly prohibited, including `created_by_id`,
`edition_id`, Revision IDs, Working Draft Row Version provenance, and Capture
source provenance. Repair the projection at the server repository boundary and
make the public Zod contract strict enough to reject those fields. Do not rely
on React to hide them.

## Schemas And Types

Reuse the authenticated contracts unchanged:

- `GuideArtifact`, `GuideEdition`, `GuideWorkingDraft`, `GuideBlock`,
  `GuideStep`, `GuideAnnotation`, `GuideDetail`, `GuideSummary`;
- `UpdateGuideInput`, `UpdateGuideStepInput`, `CreateGuideBlockInput`,
  `UpdateGuideBlockInput`, `UpdateGuideBlockScreenshotInput`,
  `UpdateGuideBlockAnnotationsInput`;
- `ArtifactRevisionSummary`, `GuideRevisionDetail`,
  `ArtifactRevisionWriteRequest`;
- `ArtifactCarryForwardRequest` and response;
- `PublishedArtifact`, `PublishLink`, `PublishLinkEntry`,
  `PublicationHistoryResponse`, and `PublishArtifactRequest`.

Add public-only strict schemas in `packages/types/src/publish.ts`. Names may
follow the repository's naming pattern, but responsibilities and allowed fields
must be exact:

```ts
type PublicArtifactRevision = {
  revision_number: number;
  title: string;
  description: string | null;
  created_at: string;
};

type PublicGuideRevisionAnnotation = {
  annotation_type: "highlight";
  annotation_index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PublicGuideRevisionStep = {
  display_capture_asset_id: string | null;
  screenshot_hidden: boolean;
  title: string;
  body: string | null;
  annotations: PublicGuideRevisionAnnotation[];
};

type PublicGuideRevisionBlock = {
  id: string; // stable render key within this immutable public response
  block_type: GuideBlockType;
  title: string | null;
  body: string | null;
  block_index: number;
  step: PublicGuideRevisionStep | null;
};

type PublicInteractiveDemoRevisionTransition = {
  target_demo_revision_scene_id: string;
};

type PublicInteractiveDemoRevisionHotspot = {
  id: string; // immutable viewer navigation key
  hotspot_type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  hotspot_index: number;
  transition: PublicInteractiveDemoRevisionTransition | null;
};

type PublicInteractiveDemoRevisionScene = {
  id: string; // immutable viewer navigation key
  background_capture_asset_id: string | null;
  scene_index: number;
  title: string | null;
  description: string | null;
  hotspots: PublicInteractiveDemoRevisionHotspot[];
};

type PublicRevisionCaptureAsset = {
  id: string; // required by the protected-media route
  status: "active" | "archived";
  file_url: string;
  mime_type: string;
  width: number | null;
  height: number | null;
};
```

These are contract responsibilities, not permission to rename existing
`@repo/constants` types. Import the current `DemoHotspotType` directly.

The Interactive Demo public projection retains only the scene/hotspot/
transition identifiers and fields above that the existing immutable viewer
needs, including `background_capture_asset_id`; it omits Capture
Session/Event/source Asset provenance. Public capture-asset entries retain only
the Asset ID required by the accepted protected-media route plus safe file URL,
MIME type, dimensions, and archive status. They must not expose storage
provider/key or Capture source metadata.

`PublicGuidePublication`, `PublicInteractiveDemoPublication`, and
`PublicPublishLinkResponse` must compose these public-only schemas rather than
authenticated Revision detail schemas. All in-repository consumers move
together; authenticated Revision, Publication history, and editor DTOs do not
change.

UI-local state may add discriminated unions such as:

```ts
type SaveState =
  | { status: "idle" }
  | { status: "dirty" }
  | { status: "saving"; command: string }
  | { status: "saved"; at: string }
  | { status: "conflict"; command: string; message: string }
  | { status: "error"; command: string; message: string };
```

Keep these UI-local. Do not add them to shared API schemas.

## Authorization, Security, And Privacy

The server remains authoritative. The UI must reflect but never substitute for
these capabilities:

| Capability                    | Project Admin | Editor | Viewer |
| ----------------------------- | ------------- | ------ | ------ |
| `artifact.read`               | yes           | yes    | yes    |
| `artifact.write`              | yes           | yes    | no     |
| `revision.checkpoint_restore` | yes           | yes    | no     |
| `revision.carry_forward`      | yes           | yes    | no     |
| `publication.read`            | yes           | yes    | yes    |
| `publication.create`          | yes           | yes    | no     |
| `publish_link.manage`         | yes           | yes    | no     |

Rules:

- Organization Owner retains implicit Project Admin access.
- Project Membership is inherited by Project Versions; do not add per-version
  permissions.
- cross-Organization, wrong-Project, wrong-Artifact, wrong-Edition, and
  wrong-Project-Version identifiers must remain non-disclosing.
- direct unauthorized mutation requests must still fail even when controls are
  hidden.
- Viewer and archived states must not render disabled mutation-heavy interfaces
  as if access might be gained locally; render a purposeful read-only view.
- Project archive and Project Version archive make authored content effectively
  read-only without changing the stored Artifact Edition lifecycle.
- archiving an Artifact Edition does not revoke existing Publications or Publish
  Links.
- public readers render only immutable Revision-backed Published Artifact data.
- public response DTOs are server-projected allowlists. They must not reuse
  authenticated Revision detail objects or expose actor IDs/labels, Edition or
  Revision IDs, Working Draft Row Versions, Capture Session/Event provenance,
  source Asset provenance, internal link names, or storage facts.
- raw Capture page URLs, internal IDs, file storage keys, actor IDs, passwords,
  hashes, tokens, and private errors must not appear in public copy or committed
  evidence.
- uploaded screenshots remain subject to existing MIME/size validation and
  protected Asset rules.
- no raw HTML from authored fields is injected. Continue React text rendering
  and existing escaped export behavior.
- mutation Audit Events and meaningful read/download/public Access Events remain
  server-owned and atomic. Do not add duplicate client writes.

## UI And Behavior Rules

### Guide generation and library

- Keep `Create guide` separate from `Create interactive demo`.
- Disable generation while Capture has no title or no Capture Events and keep
  the reason associated with the control.
- One click creates at most one request while pending.
- Success navigates to the Artifact identity under the Capture Session's
  canonical Project Version slug.
- Failure leaves the Capture Session intact and offers an explicit retry.
- The Guide list shows Artifact Edition title, status, updated time, selected
  Project Version context, and truthful Publication/Publish Link state.
- Empty state explains that Guides are generated from Capture Sessions and links
  to the current Project Version's Capture list.
- Archived Editions remain directly readable but are not presented as editable.
- Slow/failing per-row publication status must not blank the entire list.

### Editor workbench structure

Use the accepted authoring archetype:

```text
compact command bar
  -> Guide identity / Project Version / lifecycle / save state

outline rail
  -> ordered Block/Step navigation and insert controls

primary document canvas
  -> selected Block/Step content and media at stable dimensions

inspector
  -> metadata, screenshot, annotation, lifecycle, Revision, export,
     Publication, and Publish Link controls through progressive disclosure
```

Rules:

- do not build nested cards around every Block;
- keep frequent save/preview commands visible;
- group infrequent export, Revision, lifecycle, and Publication commands;
- desktop may use rails; narrow mobile collapses them into ordered sections or
  drawers without hiding the primary save/status controls;
- long titles and labels wrap or truncate with accessible full names;
- media reserves aspect-ratio space to avoid layout shift;
- one `h1` identifies the Guide workbench;
- use `@repo/ui` Button, Badge, Alert, Input, Label, Select, Separator, and
  Textarea before page-local equivalents;
- use Lucide icons only with accessible labels;
- no decorative gradients, oversized hero areas, or marketing copy.

Target ownership after extraction:

- `App.tsx` preserves the current route composition:
  - active Project + active Project Version + Project Admin/Editor uses
    `GuideEditorPage`;
  - Viewer, archived Project, or archived Project Version uses
    `GuidePreviewPage` as the purposeful read-only detail surface;
  - an archived Artifact Edition in an otherwise writable context remains in
    `GuideEditorPage`, read-only except for authorized restore and allowed Link
    management;
  - do not route a Viewer through a mutation-heavy disabled editor.
- `GuideEditorPage` remains the writable route-level controller. It owns bootstrap,
  authoritative `GuideDetail`, authorization/read-only state, selected Block,
  mutation coordination, local-draft reconciliation, and navigation.
- `GuidePreviewPage` owns effective Project/Project Version/Viewer read-only
  composition and must keep Revision/Publication history reachable without
  exposing mutation controls.
- `GuideEditorWorkbench` owns responsive composition and receives state and
  commands; it does not fetch or keep a second authoritative Guide copy.
- `GuideEditorOutline` owns presentation of ordered selection/insert/move
  controls only.
- `GuideBlockEditor`, `GuideScreenshotPanel`, and `GuideAnnotationEditor` own
  form/pointer presentation and ephemeral field state for their selected
  entity. They report dirty values upward and never call transport directly.
- `GuideEditorRecovery` renders command-scoped failure/conflict recovery and
  confirmation. It does not decide whether a retry is safe.
- Revision history and Carry-Forward remain separate route controllers and
  fetch current authoritative state before their commands.
- `ArtifactPublishingPanel` retains Publication/Publish Link transport ownership
  but accepts a Guide-page aggregate-command lease for Publication commands and
  an external-pending signal. Link-only commands keep their own Link Row Version
  locks. Preserve the current default integration for Interactive Demo until
  child `128`; do not require Demo UI modernization here.
- Implement that boundary with optional presentation-local props equivalent to:

  ```ts
  type RunAggregateMutation = <Result>(
    command: "publication",
    operation: () => Promise<Result>,
  ) => Promise<Result>;

  type ArtifactPublishingCoordination = {
    aggregateMutationPending: boolean;
    runAggregateMutation?: RunAggregateMutation;
  };
  ```

  Guide supplies both values from its one route-level coordinator. The current
  default behavior remains valid when Interactive Demo does not supply the
  optional lease. This is a React ownership contract only; do not add it to
  shared API schemas.

- Replace the panel's single global `busy` boolean with command scope precise
  enough to keep unrelated Link rows readable while preventing a second command
  against the same Link Row Version. Publication still blocks every aggregate
  Guide mutation and every selected Link until it settles.
- one stable Block ID keys local drafts. Changing selection must not discard an
  unsaved draft, and a successful response for another Block must not replace
  it.

### Dirty, save, and conflict behavior

- Metadata, selected Block/Step content, and annotation geometry expose whether
  local values differ from the last server response.
- Explicit saves remain the persistence model. Do not introduce background
  autosave in this child.
- Use one route-level aggregate mutation coordinator for every command that
  reads or updates the Edition or Working Draft Row Version: metadata,
  lifecycle, Block/Step/media/annotation structure, checkpoint, restore, and
  Publication. Do not allow overlapping commands to reuse either Row Version.
- Link-only mutations may use a separate pending key per Publish Link because
  they use Link Row Version only. A Publication that updates selected links
  participates in both the aggregate gate and those selected-link gates.
- On success:
  - replace authoritative Edition/Working Draft Row Version;
  - update local baseline;
  - announce saved state without moving focus.
- On network/server failure:
  - preserve local input;
  - show retryable error beside the affected command;
  - never claim saved.
- On `edition_conflict`, `working_draft_conflict`, or
  `row_version_conflict`:
  - do not retry automatically;
  - preserve the attempted local text in memory;
  - identify the conflicted command;
  - offer `Reload latest`;
  - warn before discarding local changes;
  - after reload, allow the user to review/reapply text only when the same
    Block/Step still exists;
  - structural reorder/create/delete and screenshot/annotation conflicts require
    a fresh authoritative reload before another mutation.
- Register `beforeunload` only while unsaved local changes exist. Do not trap
  normal navigation after save and do not persist authored text to localStorage.
- If permission or lifecycle changes during editing, reload into read-only mode
  while retaining a safe copy/review opportunity for unsaved text. A lost
  Project write capability must return through the route boundary into
  `GuidePreviewPage`; an archived Artifact Edition may remain in
  `GuideEditorPage` under its narrower restore/link-management rules.
- Reconcile successful server responses by stable Block ID. Preserve unrelated
  dirty local drafts instead of replacing the entire local form map.
- Before delete, archive, restore-from-Revision, or navigation would discard
  dirty local state, name the affected scope and require explicit confirmation.
  After deleting the selected Block, select the next Block, otherwise the
  previous Block, otherwise the empty state; never leave a dangling selection.
- If a refreshed server response no longer contains a locally dirty Block,
  preserve its text for copy/review but do not offer an automatic reapply to a
  different Block.

### Block and Step authoring

- Supported creatable types remain `step`, `header`, `paragraph`, `tip`,
  `alert`, and `divider`.
- Existing `capture` and `gif` values remain readable for compatibility but are
  not newly creatable.
- Insert controls work for the empty Guide and after any existing Block.
- Preserve `block_index` ordering and Step numbering based only on Step Blocks.
- Up/down reorder commands are keyboard-operable and announce the new position.
- Delete uses inline/two-stage confirmation that names the Block/Step and states
  that it changes only the Working Draft.
- Delete failure or conflict preserves the Block.
- Empty titles/bodies follow existing domain validation; do not silently trim
  or coerce differently in the browser.
- Close the existing smoke-suite leftover where structural add-block controls
  were visible but did not create header, paragraph, or divider Blocks.

### Screenshot selection and upload

- The screenshot picker lists only active, authorized screenshot Assets in the
  current Project Version.
- Existing selected/source screenshot fallback remains:
  `selected_capture_asset_id ?? source_capture_asset_id`, unless hidden.
- Archived protected Assets referenced by the Working Draft, Revision, or
  Publication remain renderable even if they are not available for new
  selection.
- The picker has loading, empty, error, retry, selected, slow-image, and broken
  thumbnail states.
- Upload shows selected filename, type/size validation feedback, an
  indeterminate pending state, retry, and authoritative result. Do not invent a
  percentage when the current fetch transport exposes no upload-progress
  signal.
- Failed upload must not change the displayed screenshot or Row Version.
- Replacing/removing a screenshot removes incompatible annotations through the
  existing server transaction; UI copy must warn when highlights will be
  cleared.
- Screenshot viewer restores focus to its trigger, traps focus while open,
  supports Escape, and keeps zoom/navigation controls reachable at 200% reflow.

### Guide Annotation editing

- Only `highlight` is supported.
- Annotation controls exist only for a Step Block with a resolvable displayed
  screenshot and are unavailable when `screenshot_hidden` is true. Non-Step
  Blocks never acquire Step/Annotation state.
- Geometry remains normalized to the underlying image, never viewport pixels.
- The editor must allow selecting, moving, and resizing a highlight while
  preserving `0..1` bounds.
- Provide keyboard-operable numeric/stepper controls for `x`, `y`, `width`, and
  `height`; pointer manipulation may supplement but cannot replace them.
- Clamp only during local interaction. The exact valid normalized values sent to
  the server must still satisfy domain validation.
- Keep at most ten highlights and preserve their array order as
  `annotation_index`.
- Annotation changes save as one complete replacement array with the current
  Working Draft Row Version.
- Do not save on every pointer movement; commit on explicit save or completed
  interaction.
- Coordinate rendering uses the same shared projection in editor, Working Draft
  preview, Revision preview, public reader, and embed.
- Original natural image dimensions and CSS object-fit behavior must not skew
  overlays.
- Broken/missing media makes annotation editing unavailable without deleting
  stored annotations.

### Preview, Revision, archive, and Carry-Forward

- Working Draft preview is clearly labeled and never described as a Publication.
- Revision history displays immutable Revision Number, trigger, and timestamp.
  The current summary contract exposes only `created_by_id`; do not render that
  raw internal ID as an actor label. Adding a human-readable actor summary is
  outside this child unless a separately approved contract change supplies it.
- Manual checkpoint reports whether the latest matching Revision was reused.
- Revision preview is read-only and uses frozen Revision content and protected
  Assets.
- Restore clearly states that it replaces the current Working Draft, not the
  Artifact Edition identity or Publication history.
- Restore requires confirmation and current Edition/Working Draft Row Versions.
- Archive makes the Artifact Edition read-only; restore is available only to an
  authorized writer while Project and Project Version are active.
- Existing Publications/links remain readable throughout Edition archive.
- Carry-Forward identifies source and target Project Versions, every selected
  Guide, target conflicts, pending/idempotent result, and the canonical target
  Edition link.
- Never overwrite an existing target Edition or imply ongoing synchronization.

### Export

- `Copy Markdown`, `Download Markdown`, and `Download HTML ZIP` remain distinct.
- Pending state prevents duplicate action.
- Clipboard/download failure is explicit and retryable.
- Success copy identifies the completed export without claiming Publication.
- HTML ZIP retains all referenced images and exact content disposition.
- Viewer may export under `artifact.read`; public reader does not receive
  authenticated Working Draft exports.

### Publication and Publish Link management

- Display `Publication N · Revision M`.
- Publication history and Publish Link management are separate concepts.
- New Publication may be created without selecting a Publish Link.
- Existing Publish Links start unselected for rollout.
- Link creation, access settings, password rotation/clear, manifest order,
  default, entry removal, rollback, and revoke use explicit confirmations and
  current Link Row Version.
- Do not expose raw existing passwords.
- Archived Edition blocks new Publication but does not block authorized link
  management while the Project remains active.
- Archived Project Version likewise blocks new Publication and authored
  mutations but remains valid in an existing manifest; authorized Link
  management remains available while the Project itself is active.
- Viewer sees Publication history and link state but no mutation controls.
- Partial loading or failure in one panel does not erase loaded Guide content.

### Public reader and embed

- Reader is content-first with minimal Ossie chrome.
- Embed removes nonessential reader chrome but preserves content semantics,
  password gate, Project Version selector when multiple entries exist, and
  accessible error states.
- Render every supported Guide Block type with correct Step numbering.
- Render normalized highlights over Revision-backed screenshots.
- The Project Version selector exposes only entries in the Publish Link
  manifest, in link-defined order, with default identified.
- Password input remains retryable after an invalid password and never echoes
  the password.
- Distinguish safe user-facing states:
  - loading;
  - public ready;
  - password required;
  - invalid password;
  - restricted;
  - expired;
  - revoked/not found without leaking which;
  - missing Project Version entry;
  - missing protected media;
  - transient request failure with retry.
- Canonicalization uses `replaceState` and preserves reader/embed mode.
- Public copy must not reveal internal IDs, storage facts, non-selected Project
  Versions, or authorization details.

## Dev/Test Browser Fixture Contract

The mandatory browser matrix must not depend on hand-edited database rows or
customer-like data. Add one repeatable Guide fixture that uses the same
maintenance safety boundary as child `125-01`.

Required synthetic identities:

- one Organization Owner or Project Admin;
- one Project Editor;
- one Project Viewer;
- active authenticated sessions or documented local login credentials for all
  three roles;
- no real email address, password, token, URL, or captured content.

Required Project and Project Version state:

- one active Project with Default Project Version `Main`;
- one named active Project Version;
- one archived Project Version;
- one separate archived Project with a directly addressable Guide Edition, so
  its effective read-only state does not make the active workflows unreachable.

Required Guide state:

- one empty draft Guide Edition;
- one active draft Edition with at least 20 mixed Blocks;
- Step Blocks with active and archived-protected synthetic screenshots;
- a broken-media case created through a valid Asset/File row whose disposable
  local test file is intentionally unavailable, plus missing-media requests
  against an unrecognized synthetic Asset ID; do not violate authored-reference
  foreign keys or protection constraints to manufacture either state;
- normalized highlight annotations at boundary and ordinary positions;
- one archived Artifact Edition;
- at least two immutable Artifact Revisions, including a checkpoint that can be
  restored;
- a second Project Version suitable for Carry-Forward plus an explicit
  target-conflict case;
- enough deterministic Row Versions for a second browser context to create a
  real stale-write conflict.

Required Publication and public-access state:

- immutable Guide Publications with distinct Publication Sequences and Revision
  Numbers;
- one active public multi-version Publish Link;
- one password-protected public link with a documented synthetic password;
- one restricted link;
- one expired link;
- one revoked link;
- one link suitable for rollback and manifest/default/order changes;
- safe public Guide media plus the minimum Interactive Demo Publication fixture
  needed to inspect the shared hardened public DTO without modernizing the Demo
  UI.

Fixture safety and lifecycle:

- reuse `reset_test_database()`/`with_maintenance_client()` or their current
  guarded equivalents;
- fail closed unless the configured database is explicitly recognized as
  disposable testing state;
- write small generated/synthetic local image files only beneath the configured
  testing storage root;
- make fixture IDs and expected routes deterministic where practical, while
  allowing mutation-created IDs to be recorded by the browser run;
- expose fixture shape through a pure builder test and prove the live database
  relationships through a DB integration test;
- seed through one package script and record only synthetic browser guidance;
- rerun the seed after DB suites that reset the test database;
- never commit emitted tokens, cookies, browser profiles, database dumps, or
  generated storage files.

## Migration And Backwards Compatibility

- No new migration is expected.
- Do not edit migrations `022`, `023`, or `024`.
- No production/development database reset, data backfill, or destructive
  operation is required. Browser validation may reset and reseed only the
  explicitly guarded disposable testing database through the fixture above.
- Existing relational Working Draft, Revision, Publication, and Publish Link
  rows remain valid.
- Existing Artifact/Edition/Revision/Publication IDs and Row Versions retain
  meaning.
- Existing canonical internal and public URLs remain unchanged.
- Existing public bookmarks, embeds, Publish Link slugs, password viewer
  sessions, aliases, and protected media routes remain compatible.
- Existing `capture` and `gif` Guide Blocks remain readable even though this
  child does not add creation controls.
- Public response hardening removes authenticated-only metadata that accepted
  child `120` already prohibited. This is an intentional pre-live API correction:
  update strict schemas, server projection, Guide reader, Interactive Demo
  viewer, fixtures, and tests atomically. Do not retain deprecated duplicate
  fields or a query flag that returns the unsafe shape.
- Public rendering semantics, Project Version entries, publication selection,
  content identifiers required for immutable rendering, canonical URLs, viewer
  cookies, and protected-media routes remain unchanged by that correction.
- The narrow server change from uncaught Guide Row Version conflicts to stable
  `409` error envelopes is a backwards-compatible correction; successful
  response contracts do not change.
- Do not remove current temporary type aliases in `packages/types/src/guide.ts`
  unless a separately scoped compatibility audit proves no caller remains.
- No old-client fallback is required for new UI-local state because it is not
  persisted or transported.

## Error And Recovery Matrix

| Condition                             | Required behavior                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| unauthenticated internal request      | sign-in action with encoded return path                                                                                                      |
| Project/Guide not found or denied     | non-disclosing unavailable state                                                                                                             |
| Viewer role                           | readable preview/history; no mutation controls                                                                                               |
| archived Project                      | all internal mutations blocked; existing public access unchanged                                                                             |
| archived Project Version              | Edition readable; authoring/checkpoint/publish/Carry-Forward target blocked; existing-link management remains available while Project active |
| archived Artifact Edition             | Working Draft readable; restore/link management rules shown accurately                                                                       |
| Edition Row Version conflict          | preserve local metadata; explicit reload/review                                                                                              |
| Working Draft Row Version conflict    | preserve local text; freeze unsafe mutations; explicit reload/review                                                                         |
| Publish Link Row Version conflict     | reload link state; no automatic repeat                                                                                                       |
| generation failure                    | Capture remains intact; retry                                                                                                                |
| screenshot list failure               | existing screenshot remains; retry picker                                                                                                    |
| upload/storage failure                | no local screenshot replacement; retry                                                                                                       |
| missing protected Asset               | stable placeholder/error; other content remains readable                                                                                     |
| export failure                        | no false download/copy success; retry                                                                                                        |
| public password failure               | password form remains usable with alert                                                                                                      |
| public restricted/expired/revoked     | safe specific/non-disclosing state per current API contract                                                                                  |
| transient public reader failure       | distinct retryable state, not permanent not-found copy                                                                                       |
| permission/lifecycle changes mid-edit | reload read-only; retain safe unsaved-text review                                                                                            |

## Implementation Order

Use TDD for every behavior change.

### Slice 1: Security/route contracts and editor extraction

1. Recheck child `126` completion gate and stop if still open.
2. Add failing public-contract and DB tests proving actor/source-authoring
   metadata is absent from both Guide and Interactive Demo public responses.
3. Add strict public-only schemas and a server-side allowlist projection; keep
   existing reader/viewer and protected-media behavior green.
4. Add failing Guide route tests for Edition and Working Draft conflicts.
5. Map both existing exceptions to stable `409` envelopes.
6. Add failing pure-shape and disposable-database safety tests for the Guide
   browser fixture, then implement the guarded fixture and DB integration test.
7. Add characterization tests around current editor behavior.
8. Extract workbench, Block editor, and helper responsibilities until
   `GuideEditorPage.tsx` and every new/extracted Guide editor runtime/test file
   are below 1,000 lines.
9. Keep editor behavior unchanged and commit this slice.

### Slice 2: Workbench and safe save state

1. Add failing tests for dirty/saving/saved/error/conflict state.
2. Implement stable command bar, outline, document, inspector, and narrow layout.
3. Add beforeunload only for real unsaved changes.
4. Add conflict reload/review without automatic retry or local data loss.
5. Verify Viewer/archive/permission transitions.
6. Commit this slice.

### Slice 3: Blocks, Steps, screenshot, and annotations

1. Add failing structural insert/reorder/delete tests, including empty Guide.
2. Close the known add-block smoke leftover.
3. Add screenshot picker/upload/replacement recovery states.
4. Add normalized annotation selection/move/resize and keyboard controls.
5. Reuse one coordinate projection across editor and renderers.
6. Commit this slice.

### Slice 4: Preview, Revision, Carry-Forward, export, and archive

1. Modernize Working Draft preview and screenshot viewer.
2. Modernize Guide Revision history/detail/checkpoint/restore states.
3. Modernize Guide-specific Carry-Forward rows and outcomes without changing
   Demo behavior.
4. Modernize export actions and archive/restore confirmations.
5. Commit this slice.

### Slice 5: Publication, reader, embed, and browser closure

1. Modernize Guide composition around the shared publishing panel.
2. Replace any ambiguous publication language.
3. Modernize reader/embed and complete the full public state matrix.
4. Run focused, DB, smoke, broad, and `agent-browser` verification.
5. Record build-size changes and accessibility/performance observations.
6. Update this child, browser evidence, smoke record, and master only for
   completed child `127` items.
7. Commit documentation closeout separately.

## Focused Test Plan

### Routing and top-level composition

- canonical Project-Version-qualified list/editor/preview/Revision routes;
- versionless legacy redirect uses current Default Project Version;
- canonical public reader/embed base and version paths;
- Project Version alias canonicalization;
- setup/auth gates remain intact;
- role-derived `canWrite` is passed correctly;
- Interactive Demo routes remain unchanged.

### Shared public response security

- strict public schemas reject `created_by_id`, actor labels, `edition_id`,
  Revision IDs, `source_working_draft_version`, Capture Session/Event
  provenance, source Asset provenance, internal link names, and storage facts;
- server response bodies omit those keys rather than depending on frontend
  filtering;
- Guide reader still receives title/description, ordered Blocks, Step display
  Asset references, annotations, and safe protected-media entries;
- Interactive Demo viewer still receives scene/hotspot/transition identities
  required for navigation, background Asset references, and safe protected-media
  entries;
- authenticated Revision detail/history and Publication management responses
  retain their existing contracts;
- base, exact Project Version, alias, reader, embed, password-session, and
  protected-media behavior remains unchanged.

### Dev/test browser fixture

- pure fixture shape includes every required role, lifecycle, Guide, Revision,
  Carry-Forward, Publication, Publish Link, and media case;
- the maintenance guard rejects a non-testing database before reset/write;
- live seed creates valid relational foreign keys, protected Asset references,
  deterministic canonical routes, and usable local synthetic media;
- repeated seed produces the documented clean baseline without accumulating
  conflicting rows;
- CLI guidance contains only explicitly synthetic credentials/session material
  and never echoes environment-file values;
- production server startup and normal tests never invoke the fixture.

### Generation and list

- title/no-event disable reasons;
- one request while pending;
- exact Capture Session Project Version handoff;
- generation failure retry;
- empty list;
- active/archived Edition rows;
- partial publish-status failure;
- Viewer list behavior;
- long names and dates.

### Editor orchestration

- loading, unauthenticated, unavailable, error, loaded;
- metadata/Working Draft local baselines;
- dirty/saving/saved states;
- no concurrent stale Working Draft commands;
- success replaces authoritative Row Version;
- network failure retains input;
- Edition and Working Draft conflict retains input and does not retry;
- reload/review and discard confirmation;
- Publication command acquires the Guide aggregate lease; concurrent editor
  mutation is blocked without issuing a request;
- ArtifactPublishingPanel's optional coordination props preserve its current
  Interactive Demo behavior when absent;
- beforeunload registration/cleanup;
- mid-edit permission/archive transition;
- component extraction preserves current behavior.

### Blocks and media

- every creatable Block type in empty and non-empty Guide;
- capture/gif readable but not creatable;
- Step-only numbering;
- up/down boundaries and announcement;
- delete confirmation/cancel/failure/conflict;
- screenshot list loading/empty/error/retry/current;
- wrong-Project-Version Asset rejection;
- upload type/size/storage failure;
- replace/remove clears annotations only after confirmed server success;
- missing/broken/archived protected Asset behavior;
- screenshot viewer focus, Escape, navigation, zoom, and reflow.

### Annotations

- initial relational projection;
- add/select/remove;
- pointer move/resize;
- keyboard/numeric geometry editing;
- normalized bounds and minimum positive size;
- ten-item limit;
- one array replacement request with current Working Draft Row Version;
- no per-pointer-move request;
- conflict preserves geometry and reloads before retry;
- correct overlay at multiple container aspect ratios;
- editor, Working Draft preview, Revision preview, reader, and embed parity.

### Revision, Carry-Forward, export, and lifecycle

- Revision history pagination;
- checkpoint new/reused;
- immutable Revision rendering;
- restore confirmation/current Row Versions/conflict;
- archive/restore and Project/Project Version read-only rules;
- Carry-Forward source/target/conflict/idempotent replay/target link;
- source Edition unchanged after target edit;
- Markdown copy/download and HTML ZIP success/failure;
- Viewer export/read behavior.

### Publication and public access

- qualified Publication/Revision copy;
- zero-link Publication;
- explicit selected-link rollout;
- create/link settings/password clear/manifest/default/order/remove;
- rollback only older same-Edition Publication;
- revoke confirmation/failure;
- stale Link Row Version reload;
- Link-only commands use per-link pending state while Publication uses the Guide
  aggregate lease and selected-link locks;
- archived Edition publication versus link-management rules;
- Viewer history without mutations;
- reader/embed block rendering and annotations;
- selected manifest Project Versions only;
- public/restricted/password/wrong-password/accepted-password/expired/revoked/
  unknown/missing-version/missing-media/transient failure;
- no authenticated-only identity/provenance or mutable Working Draft leakage;
- no actor/source-authoring metadata in raw public JSON for Guide or Interactive
  Demo;
- `X-Ossie-Access-Surface` reader/embed headers.

## Server, Database, And Smoke Verification

The implementation is UI-first, but existing contracts must be verified.

Focused non-DB tests:

```bash
pnpm --filter @repo/types test -- src/publish.test.ts
pnpm --filter server test -- \
  src/dev-fixtures/guide-browser-fixture.test.ts \
  src/modules/guide/guide.routes.test.ts \
  src/modules/guide/guide.service.test.ts \
  src/modules/publish/publish.repository.test.ts \
  src/modules/publish/publish.routes.test.ts \
  src/modules/publish/publish.service.test.ts \
  src/modules/artifact-revision/artifact-revision.routes.test.ts \
  src/modules/artifact-revision/artifact-revision.service.test.ts \
  src/modules/artifact-carry-forward/artifact-carry-forward.routes.test.ts \
  src/modules/artifact-carry-forward/artifact-carry-forward.service.test.ts
```

DB-backed verification must run against a disposable migrated test database:

```bash
pnpm --filter server test:setup
pnpm --filter server seed:guide-browser-fixture
pnpm --filter server test:db
pnpm --filter server test:smoke
```

At minimum, record the Guide, Revision/Carry-Forward, Publication, foundation
schema, Guide browser fixture DB integration, and V1 smoke outcomes. Add the
fixture DB integration file to the existing `test:db` command so the normal
configured DB gate exercises it. The Publication/Guide DB evidence must assert
the raw public JSON allowlist for both Artifact families, not only rendered
copy. Do not drop or reset a non-disposable database.

Smoke data must prove:

- Guide generated from Capture into the exact Project Version;
- relational Block/Step/Annotation edits;
- Row Version conflict rejection;
- checkpoint and restore;
- Carry-Forward independence;
- Protected Shared Asset resolution;
- Markdown and HTML ZIP export;
- zero-link and linked Publication;
- exact public reader/embed version;
- Guide and Interactive Demo public JSON omits actor/source-authoring metadata
  while retaining immutable rendering and protected-media fields;
- password and access-policy behavior;
- existing Publication unchanged by later Working Draft edits.

## Agent-Browser Validation Requirements

This phase includes browser-visible behavior. The implementation agent must use
the installed `agent-browser` skill and first run:

```bash
agent-browser skills get core
agent-browser skills get dogfood
```

Child `126` used globally installed Puppeteer only because a Chrome extension
toolbar action was outside agent-browser's attachable surface. Child `127` is a
normal portal/public-web workflow: use agent-browser as the primary validator.
Do not add Puppeteer to the repository or create a second browser harness unless
agent-browser is demonstrably incapable of a required accepted check and the
plan is amended with that exact limitation.

Use a freshly migrated disposable database, safe local URLs, and synthetic data.
Do not commit credentials, cookies, tokens, private URLs, customer content, or
raw captured input.

Required authenticated roles:

- Project Admin or Organization Owner;
- Project Editor;
- Project Viewer.

Seed them with:

```bash
pnpm --filter server test:setup
pnpm --filter server seed:guide-browser-fixture
```

Start the API with the repository's testing environment and the portal against
that API. The browser evidence record must name the synthetic fixture revision
and routes used, but must not copy its session tokens or cookies.

Required Project/Edition states:

- active Project + active Project Version + draft Edition;
- active Project + archived Project Version;
- active Project + active Project Version + archived Edition;
- archived Project;
- long title/description and at least 20 mixed Blocks;
- empty Guide;
- missing/broken and archived protected screenshots;
- stale Row Version from two browser sessions.

Required workflows:

1. Generate Guide from Capture and verify canonical Project Version editor URL.
2. Create each supported Block type, edit metadata/Steps, reorder, and delete.
3. Select/upload/replace/remove screenshots with loading/error recovery.
4. Create, move, resize, keyboard-adjust, save, and reload highlights.
5. Trigger a stale Working Draft conflict in two sessions and prove no silent
   overwrite or local text loss.
6. Preview the Working Draft and use the screenshot viewer.
7. Checkpoint, open immutable Revision, restore with confirmation, and verify
   Publication history remains unchanged.
8. Carry Forward to another Project Version and prove source/target independence.
9. Export Markdown and HTML ZIP.
10. Publish without a link, create/update two independent links, roll one entry
    back, and revoke one link.
11. Open base/version reader and embed routes; exercise public, restricted,
    password, wrong password, expiry, revoke, missing version, and missing media.
12. Inspect Guide and Interactive Demo public JSON/network responses and prove
    prohibited actor/source-authoring metadata is absent.
13. Verify Viewer read-only behavior and direct unauthorized request failure.

Viewport and accessibility matrix:

- desktop: `1440x900`;
- narrow mobile: approximately `390x844`;
- 200% zoom/reflow, using an equivalent CSS viewport when browser zoom cannot
  be controlled;
- keyboard-only traversal and visible focus;
- modal focus containment/return and Escape;
- reduced motion;
- long unbroken labels and prose;
- slow/broken screenshots with reserved layout;
- automated WCAG 2.2 A/AA audit plus manual semantics/contrast/focus review;
- document/body horizontal overflow checks;
- console errors;
- failed network requests;
- bundle and key interaction responsiveness.

Save evidence under `docs/ui/evidence/127/` and record exact commands and fixture
identities in `docs/ui/127-guide-authoring-and-reader-ui-browser-evidence.md`.
Screenshots must contain synthetic data only.

## Verification Commands

Use `rtk` when available. If it remains unavailable, run the same commands
directly and record the fallback.

Focused web tests during implementation:

```bash
pnpm --filter web test -- src/features/guide/GuideEditorPage.test.tsx
pnpm --filter web test -- src/features/guide/GuideBlockEditor.test.tsx
pnpm --filter web test -- src/features/guide/GuideAnnotationEditor.test.tsx
pnpm --filter web test -- src/features/guide/GuidePreviewPage.test.tsx
pnpm --filter web test -- src/features/guide/PublicGuideReaderPage.test.tsx
pnpm --filter web test -- src/features/publish/ArtifactPublishingPanel.test.tsx
pnpm --filter web test -- src/features/artifact-revision/ArtifactRevisionHistoryPage.test.tsx
pnpm --filter web test -- src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx
pnpm --filter web test -- src/lib/routes.test.ts src/lib/api.test.ts
```

Package and repository gates:

```bash
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
pnpm check-types
pnpm lint
pnpm -r --if-present test
git diff --check
pnpm exec prettier --check \
  docs/plan/127-guide-authoring-and-reader-ui-modernization.md \
  docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md \
  docs/ui/127-guide-authoring-and-reader-ui-browser-evidence.md
```

Record the production JS/CSS size and explain material growth from the 449.48 kB
raw / 123.46 kB gzip JS and 64.59 kB raw / 12.76 kB gzip CSS expansion baseline.

## Commit Boundaries

Prefer small logical commits:

1. `fix(publish): restrict public revision projections`
2. `fix(server): expose guide row version conflicts`
3. `test(server): add guide browser fixture`
4. `refactor(web): extract guide editor workbench`
5. `feat(web): harden guide authoring recovery`
6. `feat(web): modernize guide media and annotations`
7. `feat(web): modernize guide revision and publication flows`
8. `feat(web): modernize public guide reader`
9. `docs(guide): record child 127 verification`

Commit only files owned by the slice. Do not include generated `dist`, local
storage, browser profiles, fixture databases, credentials, or unrelated user/
agent work.

## Closeout Checklist

### Planning and gate

- [x] Children `118` through `125` completion rechecked.
- [x] Actual implemented child `126` result and completed gate rechecked.
- [x] Current Guide/Revision/Carry-Forward/Publication/public-reader code,
      schemas, routes, permissions, tests, and migrations inspected.
- [x] Exact affected files, contracts, non-scope, baseline, and verification
      recorded.
- [x] No unresolved critical product/domain decision identified.
- [x] Child `126` marked Complete before runtime implementation.

### Implementation

- [ ] Guide conflict errors mapped to stable `409` responses.
- [ ] Public Guide/Demo DTOs use strict server-side allowlist projections and
      omit accepted child `120` prohibited metadata.
- [ ] Guarded Guide browser fixture and DB integration coverage complete.
- [ ] Oversized Guide editor split; `GuideEditorPage.tsx` and every
      new/extracted Guide editor runtime/test file below 1,000 lines.
- [ ] Guide generation/list/editor workbench modernized.
- [ ] Dirty/save/error/conflict/read-only recovery complete.
- [ ] Blocks/Steps/screenshots/annotations/order/delete complete.
- [ ] Preview/Revision/Carry-Forward/archive/export complete.
- [ ] Publication/Publish Link Guide composition complete.
- [ ] Public reader/embed state matrix complete.
- [ ] Security, permission, immutable Publication, and protected Asset rules
      preserved.
- [ ] No migration, public URL, dependency, or unsupported schema change added.

### Verification

- [ ] Focused web and server tests pass.
- [ ] Full web tests, types, lint, and build pass.
- [ ] Relevant DB integration and V1 smoke pass.
- [ ] Repository-wide types, lint, and recursive tests pass or unrelated
      pre-existing failures are recorded.
- [ ] `agent-browser` authenticated role/state/workflow matrix passes.
- [ ] Reader/embed public access matrix passes.
- [ ] Desktop, narrow, keyboard, 200% reflow, reduced motion, accessibility,
      console, network, and media stability evidence recorded.
- [ ] Build-size comparison recorded.

### Closeout

- [ ] Status changed to Complete only after every required acceptance item.
- [ ] Implementation log lists exact commits/files/behavior.
- [ ] Verification record contains dated commands and outcomes.
- [ ] Browser evidence contains synthetic data only.
- [ ] Master `005` updated only for completed child `127` items.
- [ ] Leftovers are assigned explicitly to child `128`, child `129`, or a
      separately approved reliability child.

## Expansion Log

- 2026-07-29: Rechecked child `126` at `f9abd7d`. Its implementation and direct
  browser/contracts are clean, but its true installed toolbar-popup acceptance
  remains open. Child `127` planning may be recorded; implementation remains
  sequence-blocked.
- 2026-07-29: Child `126` subsequently passed its true installed
  toolbar/API/handoff acceptance matrix. The predecessor gate is satisfied; no
  child `127` runtime implementation was performed during that closeout.
- 2026-07-29: Refreshed at `361df03` after child `126` closeout. Repository
  history confirms there were no intervening Guide, Publication, route, schema,
  migration, or runtime changes after the original child `127` inspection.
- 2026-07-29: The refresh found one implementation-safety gap in the plan
  rather than runtime code: the mandatory multi-role/state browser matrix had no
  owned repeatable Guide fixture. Added exact dev-fixture files, safety rules,
  required relational/public states, tests, seed command, and commit boundary.
- 2026-07-29: Confirmed child `126`'s global Puppeteer installation is not a
  child `127` dependency. Portal/public Guide validation remains agent-browser
  owned.
- 2026-07-29: Final readiness audit preserved the current route split:
  Admin/Editor authoring uses `GuideEditorPage`, while Viewer or effective
  Project/Project Version read-only contexts use `GuidePreviewPage`; archived
  Edition restore/link behavior remains in the writable-context editor.
- 2026-07-29: Corrected the editor file-size rule so it does not force unrelated
  refactors of the already-oversized Guide route and DB integration files.
- 2026-07-29: Made shared publishing coordination explicit through an optional
  Guide aggregate-mutation lease that preserves the current Interactive Demo
  integration, and required per-Link Row Version pending ownership.
- 2026-07-29: Clarified that upload feedback is indeterminate unless transport
  exposes real progress and that missing/broken browser media must be exercised
  without violating relational/protected-Asset constraints.
- 2026-07-29: Mapped current Guide callers from Capture generation through the
  Project-Version-scoped library, mutable Working Draft editor, immutable
  Revision/Carry-Forward workflows, Publication/Publish Link controls, and
  public reader/embed.
- 2026-07-29: Confirmed migrations `022` through `024`, shared Zod contracts,
  domain policies, and authorization already implement the required model. No
  new schema or migration is expected.
- 2026-07-29: Identified the required narrow server correction: existing Guide
  repository Edition/Working Draft conflicts need stable route-level `409`
  mapping for safe UI recovery.
- 2026-07-29: Identified the 1,723-line Guide editor as the primary ownership
  risk and required extraction before behavior changes.
- 2026-07-29: Carried forward the existing smoke leftover that visible Guide
  add-block controls did not create header, paragraph, or divider Blocks in a
  real run.
- 2026-07-29: Recorded green expansion baseline: web 47 files/301 tests, types,
  lint, build, and nine focused server files/19 tests. The same baseline passed
  again after child `126` completion.
- 2026-07-29: Readiness recheck corrected every authenticated Guide mutation
  and Publication/Publish Link path to show its required
  `project_version_id`; delete also records its query-carried Working Draft Row
  Version.
- 2026-07-29: Readiness recheck found that public publication contracts reuse
  authenticated Revision shapes and can expose actor IDs, Edition/Revision IDs,
  Working Draft Row Version provenance, and Capture source provenance despite
  child `120` explicitly prohibiting those fields. Added a narrow shared
  public-only schema/server projection repair with Guide and Interactive Demo
  regression coverage.
- 2026-07-29: Clarified post-extraction ownership, one aggregate mutation
  coordinator, per-link concurrency, dirty-draft reconciliation, and
  selection/discard behavior.
- 2026-07-29: No runtime implementation performed.

## Implementation Log

Not started. This document is an implementation-readiness checkpoint only.

## Verification Record

Expansion-only baseline on 2026-07-29:

```text
pnpm --filter web test
  PASS: 47 files, 301 tests

pnpm --filter web check-types
  PASS

pnpm --filter web lint
  PASS

pnpm --filter web build
  PASS
  JS: 449.48 kB raw / 123.46 kB gzip
  CSS: 64.59 kB raw / 12.76 kB gzip

pnpm --filter server test -- [nine focused Guide/Publication/Revision/Carry-Forward files]
  PASS: 9 files, 19 tests
```

This baseline does not claim child `127` implementation, DB acceptance, smoke
acceptance, accessibility acceptance, or browser evidence.

Final readiness recheck on 2026-07-29:

```text
pnpm --filter web test
  PASS: 47 files, 301 tests

pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
  PASS

pnpm --filter server test -- [nine focused Guide/Publication/Revision/Carry-Forward files]
  PASS: 9 files, 19 tests

pnpm exec prettier --check docs/plan/127-guide-authoring-and-reader-ui-modernization.md
git diff --check
  PASS
```

Only this plan changed during the readiness recheck; no runtime, schema,
migration, route, dependency, or product behavior was implemented.

## Critical Decisions

No unresolved critical decision was found.

This plan deliberately:

- preserves explicit saves rather than introducing autosave;
- preserves accessible up/down ordering rather than adding drag-and-drop;
- adds no keyboard shortcut scheme;
- preserves every existing internal/public route and accepted domain semantics;
- repairs the accepted child `120` public-response allowlist without changing
  public rendering, access, URL, or immutable Publication semantics;
- treats the Guide Row Version `409` mapping as a narrow correctness fix, not a
  new concurrency model.

If implementation evidence requires changing persistence, public URL/access,
permission, retention, immutable Publication behavior, or a major dependency,
stop and amend the plan before coding that change.

## Leftovers And Handoff

Before implementation:

- child `126` is Complete; retain its evidence as the accepted predecessor
  baseline;
- recheck this plan against any intervening Guide code changes.

After child `127`:

- hand child `128` the shared ArtifactPublishingPanel,
  ArtifactRevisionHistoryPage, ProjectCarryForwardPage, public selector, and
  reader/viewer layout patterns without forcing Guide composition onto
  Interactive Demo;
- hand child `129` only cross-product accessibility/motion/dogfood leftovers,
  not unverified Guide acceptance;
- do not begin child `128` until this child's complete Guide editor/public-reader
  matrix passes and the child is marked Complete.
