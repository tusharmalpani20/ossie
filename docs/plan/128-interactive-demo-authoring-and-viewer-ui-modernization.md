# Child Plan 128: Interactive Demo Authoring And Viewer UI Modernization

Date reserved: 2026-07-12

Expanded: 2026-07-29

Status: Complete.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Predecessor:

- `docs/plan/127-guide-authoring-and-reader-ui-modernization.md`

## Sequence Gate And Starting State

Child `127` is Complete at repository commit `a7f6e23`. Its final audit records:

- strict public-only Guide and Interactive Demo Revision projections;
- stable Guide and Interactive Demo Edition/Working Draft `409` responses;
- guarded synthetic Guide browser data and complete DB/smoke/browser evidence;
- shared `ArtifactPublishingPanel`, `ArtifactRevisionHistoryPage`,
  `ProjectCarryForwardPage`, and `PublicVersionSelector` behavior;
- an optional aggregate Publication mutation lease that the Guide editor uses
  and the current Interactive Demo editor does not yet use;
- a single shared portal shell and established reader/embed layout patterns.

The worktree was clean when this plan was expanded. This expansion changes only
this document and does not begin runtime implementation.

Next child:

- `129` Accessibility, Motion, Performance, And Browser Dogfood, only after this
  child passes its complete Interactive Demo editor/viewer regression matrix and
  is marked Complete.

## Goal

Modernize the complete Interactive Demo workflow without changing its accepted
Scene/Hotspot/Transition domain model:

- make generation, library, authoring, preview, Revision, Carry-Forward,
  archive, Publication, Publish Link, reader, and embed behavior coherent;
- provide a stable Scene navigator, captured-screen canvas, Hotspot overlay,
  inspector, and command bar;
- make unsaved work, Row Version conflicts, missing Assets/targets, permissions,
  and failed commands explicit and recoverable;
- preserve immutable Publications, public URLs, tenant isolation, protected
  Assets, and the exact Project Version context.

## Completion Criteria

This child is Complete only when:

1. Admin and Editor can generate and safely author a Demo in the exact Capture
   Session Project Version.
2. Viewer and lifecycle-read-only contexts can inspect Working Draft,
   Revisions, Publication history, and allowed public state without authoring
   controls.
3. Scene create/select/reorder/delete/background operations and Hotspot
   create/select/move/resize/reorder/delete/target operations work through one
   coordinated Working Draft mutation boundary.
4. metadata and content dirty state, pending state, failures, and real stale
   Edition/Working Draft conflicts preserve reviewable local input and never
   retry automatically.
5. editor, Working Draft preview, immutable Revision preview, reader, and embed
   use the same normalized Hotspot projection over the same image bounds.
6. public, restricted, password, invalid-password, expired, revoked/unknown,
   missing-version, missing-media, and transient-failure states are distinct and
   safe.
7. transition feedback is purposeful, interruptible, focus-aware, and has a
   no-motion reduced-motion equivalent.
8. focused web/server/contracts, DB integration, V1 smoke, broad workspace, and
   real-browser checks pass with dated evidence.
9. this plan and master `005` are updated only after the completed behavior is
   evidenced.

## Canonical Domain And Language

- An Interactive Demo Artifact is the stable identity across Project Versions.
- An Artifact Edition is the Demo in one Project Version.
- Each Edition owns one mutable Working Draft with relational Scenes, Hotspots,
  and Transitions.
- A Scene owns ordered Hotspots and may reference one Project-Version-compatible
  screenshot as its background.
- A Hotspot is `click`, `info`, or `next`; its rectangle is normalized to the
  underlying image (`0..1`) and it may own one Transition to another Scene in
  the same Working Draft.
- A Revision is an immutable relational snapshot. A Publication points to one
  Revision and has a user-visible Publication Sequence.
- A Publish Link is independently mutable access/manifest configuration. It is
  not a Publication and is not a “version.”
- A Row Version is optimistic concurrency data. Never display it as authored
  history.
- Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions remain
  separate. Shared shell, publishing, history, selector, and coordinate
  projection code must not introduce a generic persisted content abstraction.

## Current Runtime Map And Known Gaps

The accepted persistence and HTTP model already exists in migrations `022`,
`023`, and `024`, `@repo/types`, `@repo/demo-domain`, and the server modules.
No schema redesign is required.

Current portal composition:

- `ProjectInteractiveDemoListPage.tsx` lists Project-Version-scoped Editions.
- Capture detail calls `createInteractiveDemoFromCaptureSession`.
- `InteractiveDemoEditorPage.tsx` loads the Edition, Working Draft, Scenes, then
  Hotspots per Scene.
- shared Revision history, Carry-Forward, and publishing pages already accept
  `artifactType: "interactive_demo"`.
- `InteractiveDemoRevisionPreviewPage.tsx` renders immutable content.
- `PublicInteractiveDemoViewerPage.tsx` renders public reader/embed content.

Current implementation gaps this child owns:

- `InteractiveDemoEditorPage.tsx` is 1,490 lines and combines route loading,
  mutation coordination, every Scene form, every Hotspot form, canvas, archive,
  and publishing.
- every Scene and Hotspot editor renders simultaneously; selection and canvas
  inspection are not stable.
- the server has Scene creation, but `apps/web/src/lib/api.ts` has no matching
  portal client and the editor exposes no Add Scene control.
- Project screenshot listing exists, but Demo authoring exposes no background
  Asset picker and derives the image URL only from a Scene source Capture
  Session. A manually selected compatible Asset therefore becomes
  unresolvable after reload: `DemoScene` has its background Asset ID but not that
  Asset's Capture Session or authenticated `file_url`. The Scene-list contract
  needs a narrow referenced-background Asset projection, including protected
  archived Assets, rather than a fabricated source-session URL.
- normalized Hotspots can be edited numerically, but cannot be selected,
  pointer-moved, or resized on the canvas.
- local drafts have no aggregate dirty/conflict coordinator or unload warning;
  successful structural commands can replace unrelated local drafts.
- Demo publishing does not acquire the optional aggregate mutation lease.
- there is no canonical Working Draft preview route/page.
- the public viewer renders Hotspots as an unpositioned button list rather than
  overlay geometry, has no info-Hotspot presentation or navigation history, and
  collapses several public failures into “not found.”
- immutable Revision preview and public viewer duplicate projection logic.
- current Demo page tests are primarily smoke/contract tests and do not cover
  authoring recovery, geometry parity, permissions, or the public state matrix.
- there is no dedicated guarded Interactive Demo browser fixture.

Stable behavior already supplied by child `127` must not be reimplemented:

- strict public allowlist projection in `packages/types/src/publish.ts` and
  `apps/server/src/modules/publish/publish.repository.ts`;
- route-level Demo Edition and Working Draft `409` envelopes;
- shared Publication/Publish Link, Revision history, Carry-Forward, public
  Project Version selector, and portal shell primitives.

## Scope

### In scope

- Demo list and Capture generation handoff.
- canonical Project-Version-qualified Demo detail and new Working Draft preview.
- route/controller extraction and a Demo-specific workbench.
- Edition metadata, archive/restore, dirty state, and conflict recovery.
- Scene create/select/reorder/delete, title/description, and background picker.
- Hotspot create/select/reorder/delete, type/copy, normalized move/resize,
  target selection, and Transition feedback.
- Working Draft preview, immutable Revision preview/restore/checkpoint,
  Carry-Forward, and source/target independence.
- Publication and Publish Link composition using the shared panel.
- public reader/embed rendering and the full safe access/error matrix.
- a guarded repeatable Interactive Demo browser fixture and dated
  `agent-browser` evidence.
- narrow server/type/test changes only where a demonstrated contract or fixture
  gap requires them.

### Explicit non-scope

- changing the Scene/Hotspot/Transition persistence model or adding JSON/JSONB;
- new Hotspot types, branching rules, analytics, comments, narration, audio,
  video, autoplay tours, drag-and-drop ordering, or collaborative live editing;
- Guide behavior or Guide-specific UI composition;
- Documentation or Video domain work;
- capture/extension redesign, image editing, screenshot annotation, OCR, or
  automatic target inference;
- public URL, slug, cookie, password-policy, access-policy, protected-media,
  Publication immutability, or manifest-semantic changes;
- autosave, offline queues, automatic conflict merge/retry, or a new shortcut
  scheme;
- deleting temporary Demo type aliases without a separate compatibility audit;
- editing migrations `022`, `023`, or `024`;
- adding Puppeteer or another browser harness to the repository;
- the cross-product audit owned by child `129`, except the Demo-specific
  acceptance required here.

## Exact File Ownership

### Existing web files expected to change

- `apps/web/src/App.tsx`
  - compose the Working Draft preview route and preserve role/lifecycle gates.
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
  - add and verify the canonical Demo `/preview` route; preserve legacy Default
    Project Version redirects and public reader/embed routes.
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
  - add the missing Scene-create adapter and verify every Demo mutation carries
    `project_version_id` and current Row Version.
- `apps/web/src/features/interactive-demo/types.ts`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.ts`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.test.ts`
  - expose existing shared types, dirty comparisons, stable selection helpers,
    target validation, and normalized coordinate projection.
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.module.css`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.module.css`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx`
- `apps/web/src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.tsx`
- `apps/web/src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.test.tsx`
- `apps/web/src/features/publish/ArtifactPublishingPanel.test.tsx`
  - prove Demo lease integration without regressing the optional/default API.
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx`
  - add only Demo-specific outcome/source-independence presentation coverage.

### New web files expected

- `apps/web/src/features/interactive-demo/InteractiveDemoWorkbench.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoWorkbench.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoWorkbench.test.tsx`
  - Scene rail, command bar, selected canvas, and inspector composition.
- `apps/web/src/features/interactive-demo/InteractiveDemoCanvas.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoCanvas.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoCanvas.test.tsx`
  - shared image box, normalized overlays, selection, keyboard controls, and
    pointer move/resize projection.
- `apps/web/src/features/interactive-demo/InteractiveDemoRenderer.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoRenderer.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoRenderer.test.tsx`
  - read-only Scene/Hotspot rendering shared by preview, Revision, reader, and
    embed without importing authoring controls.
- `apps/web/src/features/interactive-demo/InteractiveDemoPreviewPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoPreviewPage.test.tsx`
  - authenticated read-only Working Draft preview.

If extraction reveals a clearer ownership split, names may change, but record
the final map in this plan before implementation proceeds. Keep
`InteractiveDemoEditorPage.tsx` and every new/extracted Demo runtime/test file
below 1,000 lines. Do not force unrelated existing server/DB test files under
that limit.

### Server/shared files expected only for fixture or demonstrated contract gaps

- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.ts`
- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.cli.ts`
- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.db.integration.test.ts`
- `apps/server/package.json`
  - add a guarded `seed:interactive-demo-browser-fixture` command and include
    its DB integration test in the configured DB gate.
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.repository.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.ts`
  - return the narrow referenced-background Asset projection with Scene lists
    and cover active, archived-protected, missing-file, tenant, Project, and
    Project Version boundaries; do not add a new public or file route.
- `apps/server/src/modules/artifact-revision/artifact-revision-carry-forward.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
  - extend existing relational Demo acceptance without duplicating fixtures.
- `packages/types/src/demo.ts`
- `packages/types/src/demo.test.ts`
- `packages/types/src/publish.test.ts`
- `packages/demo-domain/src/policies/demo-hotspot-policy.test.ts`
- `packages/demo-domain/src/policies/demo-scene-policy.test.ts`
  - change only when a strict schema/domain test exposes a real accepted
    contract gap. Do not invent UI-only persisted fields.

### Documentation expected after implementation

- `docs/plan/128-interactive-demo-authoring-and-viewer-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  - mark only completed child `128` items.
- `docs/ui/128-interactive-demo-authoring-and-viewer-ui-browser-evidence.md`
- `docs/ui/evidence/128/`
  - synthetic screenshots/evidence only.
- `docs/v1-dogfood-smoke-suite.md`
  - update only if the accepted smoke workflow or command changes.

### Read/verify, do not change by default

- `AGENTS.md`, `CONTEXT.md`, `PRODUCT.md`, `DESIGN.md`;
- ADRs `0005`, `0021`, `0022`, `0023`, `0024`, `0025`, and `0026`;
- migrations `022`, `023`, and `024`;
- `apps/server/src/modules/interactive-demo/interactive-demo.audit.ts`;
- `apps/server/src/modules/audit/audit-coverage-registry.ts`;
- `apps/server/src/modules/access/access-coverage-registry.ts`;
- `apps/server/src/modules/capture-asset/capture-asset.repository.ts`;
- `apps/server/src/modules/capture-asset/capture-asset.service.ts`;
- shared Guide runtime and Guide fixture;
- extension code and dependencies.

Stop and amend this plan before changing a read/verify file for product
semantics, persistence, permission, public access, or a new dependency.

## Browser Routes

Preserve:

- `/projects/:project_id/versions/:version_slug/interactive-demos`
- `/projects/:project_id/versions/:version_slug/interactive-demos/:demo_id`
- `/projects/:project_id/versions/:version_slug/interactive-demos/:demo_id/revisions`
- `/projects/:project_id/versions/:version_slug/interactive-demos/:demo_id/revisions/:revision_number`
- `/projects/:project_id/versions/:version_slug/carry-forward`
- `/p/:slug`
- `/p/:slug/embed`
- `/p/:slug/versions/:version_slug`
- `/p/:slug/versions/:version_slug/embed`

Add:

- `/projects/:project_id/versions/:version_slug/interactive-demos/:demo_id/preview`

Versionless legacy list/detail/preview requests must redirect to the current
Default Project Version with query/hash intent preserved where the current
route boundary supports it. Project Version aliases canonicalize through
`replaceState`; reader/embed mode must not change during canonicalization.

## Existing HTTP Contracts To Preserve

All internal routes are under `/api/v1/projects/:project_id`.

### Generation, Edition, and lifecycle

- `POST /capture-sessions/:capture_session_id/interactive-demos`
  - body: optional `title`, optional nullable `description`;
  - the Capture Session supplies the exact Project Version;
  - response: Artifact + Edition + Working Draft + generated Scenes +
    canonical `redirect_path`.
- `POST /interactive-demos`
  - body: `project_version_id`, `title`, optional nullable `description`.
- `GET /interactive-demos?project_version_id=:id`
- `GET /interactive-demos/:demo_id?project_version_id=:id`
- `PATCH /interactive-demos/:demo_id?project_version_id=:id`
  - body includes `expected_edition_version`.
- `POST /interactive-demos/:demo_id/archive|restore?project_version_id=:id`
  - body includes `expected_edition_version`.

### Scene contracts

- `POST /interactive-demos/:demo_id/scenes?project_version_id=:id`
  - `CreateDemoSceneRequestSchema`: optional nullable trimmed `title`,
    `description`, and `background_capture_asset_id`, plus required
    `expected_working_draft_version`;
  - response: `demo_scene` and authoritative `working_draft`.
- `GET /interactive-demos/:demo_id/scenes?project_version_id=:id`
  - response adds `background_capture_assets`, a strict authenticated array of
    referenced `CaptureAssetWithFileUrl` records for the returned active Scenes;
  - it includes an archived Asset only when an existing Scene protects and
    references it, does not turn archived Assets into picker choices, and omits
    unrelated Project/Project Version Assets;
  - if a referenced database Asset/File cannot be projected, omit that entry so
    the UI can render a stable unavailable-background state; if the database
    rows exist but disposable/local physical storage is missing, retain the
    projection and let the existing authenticated file request fail safely.
- `PATCH /interactive-demos/:demo_id/scenes/:scene_id?project_version_id=:id`
  - same mutable fields and current Working Draft Row Version.
- `PUT /interactive-demos/:demo_id/scenes/order?project_version_id=:id`
  - complete non-empty unique `scene_ids` array and current Working Draft Row
    Version.
- `DELETE /interactive-demos/:demo_id/scenes/:scene_id`
  - query carries `project_version_id` and
    `expected_working_draft_version`.
- `GET /capture-assets?project_version_id=:id&asset_type=screenshot`
  - supplies active compatible screenshot metadata and `file_url` for new
    background selection;
  - source provenance stays immutable and inspectable but is not user-editable;
  - after selection/reload, render from the Scene-list
    `background_capture_assets` projection rather than inferring a Capture
    Session route.

### Hotspot and Transition contracts

- `POST /interactive-demos/:demo_id/scenes/:scene_id/hotspots?project_version_id=:id`
- `GET /interactive-demos/:demo_id/scenes/:scene_id/hotspots?project_version_id=:id`
- `PATCH /interactive-demos/:demo_id/scenes/:scene_id/hotspots/:hotspot_id?project_version_id=:id`
- `PUT /interactive-demos/:demo_id/scenes/:scene_id/hotspots/order?project_version_id=:id`
- `DELETE /interactive-demos/:demo_id/scenes/:scene_id/hotspots/:hotspot_id`
  - delete query also carries current Working Draft Row Version.

Create requires `hotspot_type`, `x`, `y`, `width`, `height`, and current Working
Draft Row Version. Update accepts any mutable subset plus the current Row
Version. Optional `label`/`content` are nullable. Optional `transition` is
`{ target_scene_id }` or `null`.

### Revision, Carry-Forward, Publication, and public access

Reuse the existing artifact-type-discriminated contracts:

- Revision list/detail/checkpoint/restore for `interactive-demos`;
- Project Version Carry-Forward with `artifact_type: "interactive_demo"`;
- Publication history/create and Publish Link create/update/manifest/rollback/
  revoke for `artifact_type: "interactive_demo"`;
- public base/exact-version reader/embed, viewer session, and protected Asset
  routes.

Display `Publication N · Revision M`. Do not rename or duplicate these APIs.

## Schemas And Types

Preserve strict `@repo/types` shapes:

- `InteractiveDemoArtifact`, `InteractiveDemoEdition`,
  `InteractiveDemoWorkingDraft`;
- `DemoScene`, `DemoHotspot`, `DemoTransition`;
- Scene/Hotspot create/update/reorder/delete request and mutation responses;
- `InteractiveDemoSceneListResponse` gains
  `background_capture_assets: CaptureAssetWithFileUrl[]`; this reuses the
  existing authenticated Capture Asset contract and is not added to
  `DemoScene`, persisted rows, mutation inputs, or the public DTO;
- `InteractiveDemoRevisionDetail`;
- dedicated public-only Demo Revision Scene/Hotspot/Transition and protected
  Asset projections from `publish.ts`.

Rules:

- `scene_index` and `hotspot_index` stay positive and server-authoritative.
- normalized `x`, `y`, `width`, `height` are finite; each value is within
  `0..1`; width/height are positive; right/bottom edges do not exceed `1`.
- a Transition target must resolve to an active Scene in the same Working Draft.
- a background Asset must belong to the same Organization/Project and exact
  Project Version under existing relational guards.
- browser-local selection, dirty, error, pending, focus, and transition-motion
  state remains app-local and is not added to shared schemas.
- do not loosen `.strict()` public schemas or restore actor/source-authoring/
  storage metadata removed by child `127`.

## Authorization, Security, And Lifecycle

| Capability                    | Owner/Admin | Editor | Viewer |
| ----------------------------- | ----------: | -----: | -----: |
| `artifact.read`               |         yes |    yes |    yes |
| `artifact.write`              |         yes |    yes |     no |
| `revision.checkpoint_restore` |         yes |    yes |     no |
| `revision.carry_forward`      |         yes |    yes |     no |
| `publication.read`            |         yes |    yes |    yes |
| `publication.create`          |         yes |    yes |     no |
| `publish_link.manage`         |         yes |    yes |     no |

- Use the existing authorization wrappers in `apps/server/src/app.ts`; do not
  add route-local roles.
- Organization/project/project-version/artifact scope is verified server-side;
  IDs and disabled UI are never authorization.
- unauthenticated internal requests show sign-in with encoded return path.
- not-found and denied content use the established non-disclosing surface.
- Viewer sees read-only content/history and no mutation controls; direct write
  requests still fail.
- archived Project: all internal mutations blocked.
- archived Project Version: authored mutations, new Publication, restore, and
  Carry-Forward target blocked.
- archived Edition: authoring and new Publication blocked; authorized restore
  remains available while Project/Project Version are active.
- existing immutable Publications and allowed Link management remain available
  under the accepted lifecycle rules.
- public JSON must contain only immutable rendering/access data. Never expose
  actor IDs, Edition/Revision IDs, Working Draft Row Versions, source Capture
  provenance, internal Link names, storage facts, or authorization detail.
- passwords, viewer cookies, sessions, tokens, private routes, and customer-like
  captured data must not appear in logs, docs, screenshots, or fixtures.
- Existing audited repositories remain the only runtime mutation path. Every
  successful Scene/Hotspot/Transition/Edition/Revision/Publication/Link command
  retains one atomic Audit Event with relational child changes; failed and no-op
  commands must not claim successful evidence.
- Authenticated Demo/Revision reads, public Publish Link views, and protected
  background delivery retain the accepted Access Event boundary. Protected
  content must not be returned if required Access evidence cannot commit.
- The new authenticated background projection must not expose storage keys or
  bypass the existing session-scoped file route, authorization, or access
  recording.

## UI And Behavior Rules

### Library and generation

- Keep Project Version visible in page context.
- Empty state sends writers to Capture Sessions; Viewer receives informative
  read-only copy.
- Each row shows title, description when present, lifecycle, authored update,
  and qualified open action. Do not expose raw source IDs as primary metadata.
- Source Capture navigation from an Edition uses the exact known Project
  Version route when available; it may rely on the Capture detail's existing
  canonical correction only as a legacy fallback.
- generation validates title/usable screenshot events, disables duplicate
  submission, preserves Capture on failure, and navigates only to the response
  canonical route.

### Workbench and mutation coordination

- Desktop: compact command bar; ordered Scene rail; stable captured-screen
  canvas; selected Scene/Hotspot inspector.
- Narrow/reflow: preserve the same workflow in a linear order with an explicit
  Scene/Inspector switch where needed; no horizontal page overflow.
- Keep one selected Scene and optional selected Hotspot by stable ID. After
  deletion select the nearest surviving item; never select by stale array index.
- Use one aggregate Working Draft mutation lease for Scene, Hotspot, restore,
  and Publication commands. Link-only commands retain per-Link ownership.
- Track authoritative Edition/Working Draft baselines separately from local
  drafts. A successful response replaces the appropriate Row Version and only
  reconciles fields/items confirmed by that response.
- Do not erase unrelated Scene/Hotspot drafts after reorder/create/delete.
- expose `Unsaved`, `Saving`, `Saved`, `Save failed`, and `Conflict` states.
- register `beforeunload` only for real unsaved changes and remove it after save
  or intentional discard.
- no automatic conflict retry. Preserve local input, freeze unsafe mutations,
  and offer explicit reload/review/discard actions.

### Scene behavior

- Empty Demo presents Add Scene.
- Add Scene uses the current Working Draft Row Version and selects the returned
  Scene.
- reorder uses accessible up/down controls and announces the resulting position;
  drag-and-drop is not required.
- delete requires confirmation and explains that its Hotspots and inbound
  Transitions will be removed by the existing transaction. Cancel is a no-op.
- background picker lists exact-Project-Version screenshots with loading,
  empty, failure/retry, selected, archived-protected, and broken-media states.
- selecting/removing a background is explicit and saves with the current
  Working Draft Row Version. Failed selection leaves the prior background
  displayed.
- missing/broken media reserves canvas dimensions, shows a stable error, and
  disables pointer geometry without deleting stored Hotspots.
- active picker results and referenced-background results have different
  purposes: archived protected Assets remain renderable but cannot be selected
  for a new Scene/background.

### Hotspot and Transition behavior

- only `click`, `info`, and `next` are presented. They remain authored
  classifications; this child must not invent type-specific navigation,
  popover, or branching semantics that are absent from ADR `0005` and the
  current domain policy.
- create a default valid box locally with `transition: null`, then issue one
  create request; the author explicitly chooses a target. Do not infer a target
  from Scene order and do not send on every pointer movement.
- selected Hotspot can be moved/resized on the canvas and edited with labeled
  keyboard-operable numeric controls. Pointer editing supplements, never
  replaces, numeric controls.
- clamp during local interaction, then validate the exact box before save.
- canvas projection uses the rendered image content box, not viewport pixels or
  a container distorted by `object-fit`.
- ordering remains explicit up/down; visual stacking and accessible names
  follow `hotspot_index`.
- target options exclude deleted/missing Scenes and identify the current Scene.
  A self-target may remain selectable only if the existing server/domain accepts
  it; do not invent a prohibition in UI.
- a missing stored target renders an invalid-target warning and blocks save/
  preview traversal until the user clears or replaces it; other content stays
  usable.
- any Hotspot with a valid Transition follows that Transition under the existing
  uniform model. A Hotspot without a Transition exposes its label/content and a
  clear terminal/non-navigating state rather than silently failing.

### Preview, Revision, Carry-Forward, and lifecycle

- Working Draft preview is labeled and cannot be mistaken for a Publication.
- Preview shares the read-only renderer and supports Scene traversal without
  authoring controls.
- Revision history shows immutable Revision Number, trigger, and timestamp;
  never display raw `created_by_id` as an actor name.
- checkpoint reports new versus reused Revision.
- restore confirms that Working Draft content will be replaced while Artifact
  identity and Publication history stay unchanged; send current Edition and
  Working Draft Row Versions.
- Carry-Forward identifies source/target Project Versions, conflict/idempotent
  outcome, and canonical target Edition. Never overwrite an existing target or
  imply synchronization.
- editing the carried-forward target must not mutate source Working Draft,
  Revision, protected Assets, or Publication history.

### Publication and Publish Links

- Reuse `ArtifactPublishingPanel`; do not fork it.
- Demo Publication acquires the aggregate mutation lease. Existing link-only
  operations retain their per-Link pending/Row Version behavior.
- Publication may be created with zero selected Links. Existing Links begin
  unselected for rollout.
- keep Publication history separate from Link access/manifest management.
- confirm password rotation/clear, manifest removal/default/order, rollback, and
  revoke. Never show an existing password.
- one panel failure must not erase loaded authoring content.

### Reader, embed, and transition motion

- Reader is content-first; embed removes nonessential chrome but retains Demo
  semantics, password gate, Project Version selector, and safe errors.
- initial Scene is the lowest `scene_index`; navigation resolves immutable
  Revision Scene IDs, not mutable Working Draft IDs.
- overlay Hotspots use the same normalized projection as editor/preview/
  Revision. Controls remain operable when responsive scaling changes.
- keep Scene title/description and Hotspot label/content accessible without
  obscuring the primary captured screen.
- transition feedback explains the target/focus change, can be interrupted by
  another command, does not trap focus, and moves focus to the new Scene heading
  or equivalent stable target.
- under `prefers-reduced-motion: reduce`, Scene changes are immediate while
  focus/status semantics remain equivalent.
- browser Back is not required to mutate the public URL for every Scene; provide
  an in-view Previous/Restart path where the accepted flow needs recovery.
- distinguish loading, ready, password required, invalid password, restricted,
  expired, revoked/unknown, missing manifest entry, missing protected media,
  empty Demo, invalid target, and retryable network failure.

## Error And Recovery Matrix

| Condition                            | Required behavior                                     |
| ------------------------------------ | ----------------------------------------------------- |
| unauthenticated internal request     | sign-in action with return path                       |
| Project/Demo absent or denied        | non-disclosing unavailable state                      |
| Viewer                               | read-only preview/history, no writes                  |
| archived Project/Version/Edition     | accurate read-only controls per lifecycle             |
| Edition conflict                     | preserve metadata; explicit reload/review             |
| Working Draft conflict               | preserve Scene/Hotspot drafts; freeze unsafe commands |
| Publication/Link conflict            | reload relevant state; never automatic retry          |
| generation failure                   | Capture unchanged; retry                              |
| screenshot list failure              | current referenced background remains; retry picker   |
| background save failure              | no false replacement; retain choice for review        |
| missing/broken background            | reserved stable canvas; numeric data readable         |
| missing Transition target            | warn, block traversal/save until cleared/replaced     |
| Scene/Hotspot delete failure         | item remains; selection/drafts retained               |
| pointer interrupted/cancelled        | revert to last local committed box                    |
| permission/lifecycle change mid-edit | reload read-only; preserve safe review                |
| wrong public password                | form stays usable with alert                          |
| expired/restricted/revoked           | accepted safe state without tenant leakage            |
| transient public failure             | retryable state distinct from not found               |

## Dev/Test Browser Fixture

Add a dedicated fixture; do not extend the Guide fixture.

Required synthetic identities:

- Owner/Admin, Editor, and Viewer with documented local synthetic login/session
  setup;
- no real email, credential, token, URL, or captured content.

Required state:

- active Project with Default and named active Project Versions;
- archived Project Version and separate archived Project;
- empty Demo; active Demo with at least 12 Scenes; archived Edition;
- long titles/descriptions;
- ordinary and boundary Hotspot boxes of all three types;
- forward, backward, self (if accepted), terminal, and info Hotspots;
- valid backgrounds, archived-protected background, and a valid Asset/File row
  whose disposable local file is intentionally missing;
- two immutable Revisions, checkpoint/restore case, and source/target
  Carry-Forward with explicit conflict;
- deterministic Row Versions usable by two browser sessions for a real stale
  mutation;
- multiple Publications and public, password, restricted, expired, revoked,
  rollback, and multi-version Publish Links.

Safety:

- reuse `reset_test_database()`/`with_maintenance_client()` or current guarded
  equivalents and fail closed outside recognized disposable testing state;
- write generated images only beneath the configured test storage root;
- make IDs/routes deterministic where practical;
- pure builder test plus live DB relationship test;
- idempotent clean reseed command;
- never run from production startup or normal application paths;
- never commit DB dumps, generated storage, profiles, cookies, or secrets.

## Migration And Backwards Compatibility

- No migration is expected.
- Existing relational rows, IDs, Row Versions, Revision Numbers, Publication
  Sequences, Link slugs/manifests, cookies, public bookmarks, embeds, aliases,
  and protected-media routes remain valid.
- No production/development reset, destructive backfill, or data conversion is
  required. Only the explicitly guarded disposable test database may reset.
- Scene deletion/target cleanup and protected Asset behavior remain the existing
  server transaction semantics.
- public projection hardening completed in child `127` is the compatibility
  floor; do not add deprecated duplicate fields or authenticated DTO fallback.
- the new preview route is additive and internal. Existing detail/public URLs
  remain canonical.
- browser-local state needs no old-client transport compatibility.

## TDD Implementation Order

### Slice 1: Characterization, fixture, route, and extraction

1. Add failing pure fixture safety/shape tests, then the guarded Demo fixture and
   DB integration test.
2. Add failing contract/repository/DB tests for referenced active and
   archived-protected Scene background projection, tenant/Project Version
   scoping, and missing File behavior.
3. Add route/client tests for Working Draft preview and Scene creation.
4. Add characterization tests around current editor/list/viewer behavior,
   including uniform Hotspot/Transition semantics.
5. Extract route controller, workbench, canvas, renderer, and helpers without
   changing behavior; enforce the sub-1,000-line boundary.
6. Commit this slice independently.

### Slice 2: Workbench, dirty state, and conflict recovery

1. Add failing selection, dirty/pending/failure/conflict/unload tests.
2. Implement stable Scene rail/canvas/inspector and aggregate mutation lease.
3. Preserve unrelated drafts across authoritative partial responses.
4. Integrate Publication with the lease; keep Link behavior unchanged.
5. Verify Viewer/archive/permission transitions and commit.

### Slice 3: Scene/background and Hotspot authoring

1. Add failing empty/Add Scene/order/delete/background tests.
2. Implement exact-version screenshot picker and broken-media recovery.
3. Add failing shared projection, pointer/keyboard move/resize, box validation,
   ordering, target, and invalid-target tests.
4. Implement canvas editing without per-pointer request.
5. Commit.

### Slice 4: Preview, Revision, Carry-Forward, and lifecycle

1. Add Working Draft preview using the shared renderer.
2. Modernize immutable Revision rendering and restore/checkpoint copy.
3. Verify Carry-Forward outcomes and source/target independence.
4. Verify archive/restore and protected Asset behavior; commit.

### Slice 5: Reader/embed and closure

1. Add failing public state, overlay navigation, Hotspot content, focus, and
   reduced-motion tests.
2. Modernize reader/embed and preserve the strict public contract.
3. Run focused, DB, smoke, broad, and `agent-browser` acceptance.
4. Record evidence, bundle change, leftovers, plan/master closeout; commit docs
   separately.

## Focused Test Plan

### Routing, list, and generation

- canonical qualified list/detail/preview/Revision routes;
- legacy Default Project Version redirects and alias canonicalization;
- public reader/embed version paths;
- exact Capture Session Project Version handoff;
- generation pending/failure/no-usable-event behavior;
- list loading/empty/error/Viewer/archived/long-content states.

### Editor orchestration

- loaded relational Edition/Working Draft/Scenes/Hotspots;
- stable selection by ID after reorder/create/delete;
- dirty/saving/saved/failure/conflict state;
- authoritative Row Version replacement;
- no concurrent aggregate mutations;
- beforeunload only while dirty;
- failed/conflicted mutation retains local input;
- reload/review/discard;
- mid-edit permission/lifecycle transition;
- Demo Publication obtains aggregate lease; Link-only operations do not.

### Scene/background

- Add Scene in empty/non-empty Demo;
- accessible reorder boundaries and announcements;
- delete confirm/cancel, inbound Transition result, failure, conflict;
- screenshot list loading/empty/failure/retry/current;
- wrong-Project-Version Asset rejection;
- active picker Assets versus referenced archived-protected Assets;
- selected/reloaded background uses the referenced Asset projection and existing
  authenticated file route;
- replace/remove success and failure;
- missing/broken/archived-protected background.

### Hotspot geometry and targets

- all Hotspot types and nullable copy;
- valid default creation;
- selection, pointer move/resize, numeric and keyboard adjustment;
- normalized boundary/minimum-positive validation;
- no request on pointer move; one request on save/completed interaction;
- overlay parity at multiple container/image aspect ratios;
- reorder/delete/conflict and preserved unrelated drafts;
- valid/no/self/missing target behavior according to existing domain;
- uniform type semantics, terminal Hotspots, and target navigation focus.

### Revision, Carry-Forward, Publication, and public

- Working Draft label versus Publication;
- Revision history/checkpoint reused/new/immutable preview/restore conflict;
- Carry-Forward conflict/idempotency/target URL/source independence;
- archive/restore and public-history preservation;
- `Publication N · Revision M`, zero-Link publish, selected Link rollout;
- Link settings/password/manifest/default/order/rollback/revoke/stale version;
- reader/embed public state matrix;
- exact-version selector order/default and canonical mode preservation;
- strict public JSON remains free of prohibited internal metadata;
- protected-media access and `X-Ossie-Access-Surface`.

## Server, Database, Smoke, And Broad Verification

Focused:

```bash
pnpm --filter @repo/types test -- src/demo.test.ts src/publish.test.ts
pnpm --filter @repo/demo-domain test
pnpm --filter server test -- \
  src/dev-fixtures/interactive-demo-browser-fixture.test.ts \
  src/modules/interactive-demo/interactive-demo.routes.test.ts \
  src/modules/interactive-demo/interactive-demo.service.test.ts \
  src/modules/artifact-revision/artifact-revision.routes.test.ts \
  src/modules/artifact-carry-forward/artifact-carry-forward.routes.test.ts \
  src/modules/publish/publish.routes.test.ts
```

DB/smoke against only a disposable migrated test database:

```bash
pnpm --filter server test:setup
pnpm --filter server seed:interactive-demo-browser-fixture
pnpm --filter server test:db
pnpm --filter server test:smoke
```

The DB/smoke evidence must prove exact-version generation, relational Scene/
Hotspot/Transition mutation, stale conflict, checkpoint/restore,
Carry-Forward independence, protected background resolution, zero-Link and
linked Publication, strict raw public projection, password/access policy, and
Publication immutability after later Working Draft edits.

Web and workspace:

```bash
pnpm --filter web test -- \
  src/features/interactive-demo \
  src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.test.tsx \
  src/features/publish/ArtifactPublishingPanel.test.tsx \
  src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx \
  src/lib/routes.test.ts src/lib/api.test.ts
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
pnpm check-types
pnpm lint
pnpm -r --if-present test
git diff --check
```

Record the production JS/CSS size and explain material growth from child
`127`'s closeout baseline: JS 453.81 kB raw / 125.30 kB gzip; CSS 66.16 kB raw /
13.04 kB gzip.

## Agent-Browser Validation

This phase is browser-visible. Use the installed `agent-browser` skill as the
primary validator and load its current core/dogfood guidance before running:

```bash
agent-browser skills get core
agent-browser skills get dogfood
```

Do not add Puppeteer to the repository. The global Puppeteer workaround used by
child `126` was specific to an installed Chrome extension toolbar surface and is
not required for portal/public Demo workflows.

Seed first:

```bash
pnpm --filter server test:setup
pnpm --filter server seed:interactive-demo-browser-fixture
```

Required roles/states:

- Admin/Owner, Editor, Viewer;
- active and archived Project/Project Version/Edition;
- empty and 12+ Scene Demos;
- broken/archived backgrounds, invalid/missing target presentation;
- two sessions with a stale Working Draft Row Version;
- every public access state and multi-version manifest.

Required workflows:

1. Generate from Capture and verify exact-version canonical editor.
2. Add/select/edit/reorder/delete Scenes and pick/remove backgrounds.
3. Add/select/edit/reorder/delete all Hotspot types.
4. Pointer- and keyboard-adjust geometry, save, reload, and compare overlay.
5. Exercise valid, terminal, backward, and accepted self transitions for all
   authored Hotspot classifications without inventing type-specific semantics.
6. Create a real two-session conflict and prove no silent overwrite/local loss.
7. Preview Working Draft; checkpoint/open/restore immutable Revision.
8. Carry Forward and prove source/target independence.
9. Publish with zero Links; create/update/rollback/revoke independent Links.
10. Exercise reader/embed base/version routes and the complete public state
    matrix.
11. Inspect raw public Demo JSON/network traffic for prohibited metadata.
12. Verify Viewer read-only UI and direct unauthorized request failure.

Viewport/accessibility matrix:

- desktop `1440x900`;
- narrow approximately `390x844`;
- 200% zoom/reflow equivalent;
- keyboard-only operation, visible focus, modal focus return/Escape;
- reduced motion;
- long/unbroken content;
- slow/broken images with stable layout;
- automated WCAG 2.2 A/AA scan plus manual semantics/contrast/focus review;
- body/document overflow, console errors, failed network requests, and key
  interaction responsiveness.

Save synthetic evidence beneath `docs/ui/evidence/128/` and record exact dated
commands/routes/fixture revision in
`docs/ui/128-interactive-demo-authoring-and-viewer-ui-browser-evidence.md`.
Never record tokens, cookies, passwords, private URLs, or customer data.

## Commit Boundaries

Prefer:

1. `test(server): add interactive demo browser fixture`
2. `refactor(web): extract interactive demo workbench`
3. `feat(web): harden interactive demo authoring recovery`
4. `feat(web): modernize demo scenes and hotspots`
5. `feat(web): add interactive demo draft preview`
6. `feat(web): modernize interactive demo revision and publishing flows`
7. `feat(web): modernize public interactive demo viewer`
8. `docs(demo): record child 128 verification`

Commit only owned files. Never include `dist`, test storage, database state,
browser profiles, cookies, credentials, or unrelated user/agent work.

## Closeout Checklist

### Planning

- [x] child `127` completion and actual handoff rechecked.
- [x] master `005`, domain references, routes, schemas, permissions, migrations,
      current UI, shared surfaces, and tests inspected.
- [x] exact files/contracts/non-scope/migration/verification recorded.
- [x] no unresolved critical domain decision found.

### Implementation

- [x] guarded Demo browser fixture complete.
- [x] editor extracted below the file-size boundary.
- [x] list/generation/workbench/dirty/conflict behavior complete.
- [x] Scene/background and Hotspot/Transition behavior complete.
- [x] preview/Revision/Carry-Forward/archive behavior complete.
- [x] Publication/Publish Link coordination complete.
- [x] reader/embed state, geometry, focus, and motion complete.
- [x] security, permissions, protected Assets, immutable Publications, and
      public projection preserved.
- [x] no migration/public URL/persistence/major dependency change.

### Verification and closeout

- [x] focused web/shared/server tests pass.
- [x] full web types/lint/test/build pass.
- [x] DB integration and V1 smoke pass.
- [x] workspace types/lint/recursive tests pass or unrelated failures recorded.
- [x] `agent-browser` role/workflow/public/viewport matrix passes.
- [x] build-size and accessibility/performance observations recorded.
- [x] status/checklists/implementation log/verification/leftovers updated.
- [x] master `005` updated only for completed child `128` items.

## Expansion Log

- 2026-07-29: Rechecked completed child `127` at `a7f6e23` and confirmed there
  is no uncommitted predecessor runtime work.
- 2026-07-29: Mapped current Demo callers from Capture generation through
  Project-Version library, mutable Edition/Working Draft, relational Scene/
  Hotspot/Transition routes, shared Revision/Carry-Forward/Publication flows,
  and strict public reader/embed projection.
- 2026-07-29: Identified the 1,490-line Demo editor, absent Scene-create client/
  UI, absent background picker, uncoordinated dirty state, and incomplete public
  overlay/state behavior as the primary implementation risks.
- 2026-07-29: Confirmed current server contracts already expose stable Demo Row
  Version conflicts and accepted relational mutations. No migration or general
  server redesign is expected.
- 2026-07-29: Readiness recheck found that a manually selected background cannot
  be resolved after reload from the current Scene DTO. Added a narrow
  authenticated referenced-background projection, archived-protected/missing
  Asset rules, and exact repository/service/type/test ownership.
- 2026-07-29: Removed an unsafe plan assumption that `info`, `click`, and `next`
  have different runtime semantics. ADR `0005` accepts one uniform
  Hotspot-owned Transition model; this child may improve presentation and focus
  without inventing new branching behavior.
- 2026-07-29: Made preservation of existing Audit Event and Access Event
  boundaries explicit.
- 2026-07-29: Assigned a dedicated guarded Demo fixture rather than coupling
  Scene/Hotspot browser data to the Guide fixture.
- 2026-07-29: The planning-only statement above records the expansion
  checkpoint; runtime implementation and closeout subsequently completed in
  the commits and verification record below.

## Implementation Log

- `d78604c` added the strict authenticated referenced-background Asset
  projection and preserved active, archived-protected, missing-file, tenant,
  Project, and exact Project Version boundaries.
- `7999859` added the canonical Working Draft preview route, shared normalized
  canvas primitives, and the Scene-create client.
- `a4a7b1b` extracted the workbench, editor shell/contracts/helpers, Scene
  editor, canvas, and renderer. The final route controller is 988 lines and
  every new/extracted Demo runtime/test file remains below 1,000 lines.
- `878adc8` coordinated Edition/Working Draft baselines, local metadata/Scene/
  Hotspot drafts, unload protection, aggregate mutation ownership, stable
  selection, explicit save states, and conflict recovery.
- `cd7edfc` unified Working Draft, immutable Revision, authenticated read-only,
  public reader, and embed rendering with normalized overlays, history/focus,
  terminal states, and reduced-motion behavior.
- `6c4f47e` added the guarded, repeatable Interactive Demo browser fixture,
  seed CLI, pure safety test, and live relationship test.
- `f023b25`, `ee87aa2`, and `50246e3` closed browser and broad-suite findings:
  single-shell composition, lifecycle write gates, landmark/contrast fixes,
  first-Hotspot selection, strict App test fixtures, and lint cleanup.
- `e39e364`, `5ac6b26`, and `44ab9f3` redacted seed output and completed the
  fixture with a real two-Project-Version manifest and a separate archived
  Project.
- `f86c254` and `ce25b79` removed raw actor/Artifact identifiers from Revision
  history and Carry-Forward conflict presentation.
- No migration, persisted Scene/Hotspot/Transition redesign, public URL/access
  change, or new production dependency was introduced.

## Verification Record

Completed 2026-07-29.

Focused:

- `pnpm --filter @repo/types test -- src/demo.test.ts src/publish.test.ts`:
  2 files, 12 tests passed.
- `pnpm --filter @repo/demo-domain test`: 5 files, 15 tests passed.
- declared focused server command: 6 files, 17 tests passed.
- declared focused web command: 13 files, 124 tests passed.
- Demo fixture pure tests: 2 tests passed; dedicated fixture/Interactive Demo
  DB reruns passed after contract hardening.

Database and broad:

- `pnpm --filter server test:setup`
- `pnpm --filter server seed:interactive-demo-browser-fixture`
- `pnpm --filter server test:db`: 20 files, 67 tests passed.
- `pnpm --filter server test:smoke`: 1 file, 1 workflow passed.
- `pnpm --filter web test`: 52 files, 328 tests passed.
- `pnpm --filter web check-types`, `pnpm --filter web lint`, and
  `pnpm --filter web build`: passed.
- `pnpm check-types`, `pnpm lint`, `pnpm -r --if-present test`, and
  `git diff --check`: passed. The recursive gate included 19 Extension files /
  140 tests, 52 web files / 328 tests, and 99 server files / 406 tests, plus all
  shared packages.

Production build:

- JS: 463.79 kB raw / 128.81 kB gzip, versus child `127`'s 453.81 / 125.30
  baseline (`+9.98` raw, `+3.51` gzip).
- CSS: 73.19 kB raw / 14.17 kB gzip, versus 66.16 / 13.04 (`+7.03` raw,
  `+1.13` gzip).
- Growth is attributable to the selected-Scene workbench, pointer/keyboard
  canvas, shared overlay renderer, preview route, and explicit public states;
  no new runtime dependency was added.

Browser:

- loaded current `agent-browser` core/dogfood guidance and used headless
  Chromium against the disposable testing API/database.
- Admin/Editor/Viewer, active/archived Project, active/archived Project
  Version, active/empty/archived Edition, twelve-Scene authoring, generation,
  background states, Hotspot geometry, stale two-session conflict, Working
  Draft/Revision preview, checkpoint, Carry-Forward conflict, zero-Link
  Publication, multi-Version selector, password/restricted/expired/revoked,
  reader, and embed states passed.
- exact-Version generation navigated canonically; keyboard geometry persisted
  after reload; Revision 3 checkpoint and Publication 3 were created; raw public
  JSON contained two manifest entries and no prohibited metadata.
- `390 × 844` embed and `640` CSS-pixel/reduced-motion reflow had no document
  overflow. Final public, Revision, Carry-Forward, and authoring axe passes had
  zero violations; the authoring pass retained only three indeterminate
  textarea contrast checks.
- dated details and synthetic screenshots are in
  `docs/ui/128-interactive-demo-authoring-and-viewer-ui-browser-evidence.md`.

## Critical Decisions

No unresolved critical decision or child `128` blocker remains.

This plan preserves explicit save semantics, accessible up/down ordering,
existing Hotspot types, normalized relational geometry, and accepted internal/
public routes. If implementation evidence requires persistence changes, new
Hotspot semantics, public access/URL changes, permission changes, destructive
data handling, or a major dependency, stop and amend/recheck this plan first.

## Leftovers And Handoff

Child `129` inherits only cross-product closeout work:

- compare the modernized Capture, Guide, Demo, and Extension experiences as one
  keyboard/reflow/motion system rather than redesigning Demo composition;
- decide whether the measured JS/CSS growth warrants route-level splitting or
  other cross-product performance work;
- repeat manual contrast inspection for layered shared textarea styles that
  axe marked indeterminate, while preserving the zero-violation Demo scans;
- review broader browser responsiveness and performance budgets across the
  connected product.

Child `129` must preserve the Demo-specific normalized geometry, explicit save/
conflict model, strict public projection, immutable Publication semantics,
exact Project Version routes, and shared renderer accepted here. There is no
deferred child `128` migration, security fix, permission change, or browser
acceptance blocker.
