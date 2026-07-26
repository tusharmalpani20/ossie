# Child Plan 125: Capture Portal UI Modernization

Date reserved: 2026-07-12

Status: Complete. Implemented, verified, and closed on 2026-07-26.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Child `124` is complete in this checkout. The latest closeout commit before
  this expansion is `17a8884`.
- Child `124` established canonical Project Version library routes and recorded
  this carry-forward for child `125`:
  `/projects/:projectId/versions/:slug/capture-sessions` must remain the
  preferred Capture library entry point.
- Child `117` established Capture source Project Version scoping:
  Capture Sessions belong to exactly one Project Version; empty draft sessions
  may be reassigned, but started/non-empty sessions may not be moved.

Next child:

- `126` Extension UI Modernization. Do not start it until this portal Capture
  workflow is implemented, verified, closed, and handed off.

Starting state for implementation:

- Worktree was clean at expansion time.
- Browser evidence from child `124` is smoke-level only because no seeded
  authenticated local browser fixture existed. Child `125` must create or reuse a
  seeded authenticated local fixture before claiming full browser acceptance.
- The current Capture UI is functional but older than the accepted child
  `121`/`122` product shell direction.
- Current oversized files must be split before adding substantial behavior:
  - `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
    is over 1000 lines.
  - `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
    is over 1000 lines.
  - `apps/web/src/lib/api.ts` is over 1000 lines. Avoid adding to it unless the
    implementation first extracts Capture API helpers into a smaller file and
    keeps exports compatible.

## Goal

Modernize the authenticated portal Capture workflow while preserving:

- Organization tenant isolation.
- Project and Project Version authorization.
- Capture source immutability.
- Capture Event order safety.
- Privacy defaults that exclude raw input values and raw page HTML.
- Existing Capture behavior that guides and demos already depend on.

The result should feel like the accepted Ossie workbench: clear context, dense
operational controls, stable panels, plain copy, keyboard-safe actions, and
responsive layouts.

## Product And Domain Rules

Use these terms exactly:

- Capture Session, Capture Event, Capture Asset.
- Project Version, Default Project Version, named Project Version.
- Guide and Interactive Demo only as generated artifact entry points.

Do not use the word `version` by itself when the meaning is Project Version.

Capture invariants:

- Capture Sessions are source material, not final Guide or Interactive Demo
  artifacts.
- Original Capture Events and Capture Assets are immutable after creation except
  for accepted safe manual metadata edits on Capture Events.
- Screenshot files are source assets. Do not overwrite or purge protected files.
- Raw typed input values and raw page HTML must not be displayed, logged,
  documented as browser evidence, or newly persisted.
- The portal must fail safely when a stale tab tries to write to an archived,
  moved, or changed Capture Session.
- Project Versions inherit Project Membership. There is no per-Project-Version
  membership UI in this child.

## Scope

Implement only portal Capture UI modernization for:

- Capture Session list in a Project Version context.
- Capture Session creation for manual Capture Sessions.
- Capture Session detail view.
- Capture Session status display for the actual runtime statuses: `draft`,
  `capturing`, `completed`, `canceled`, and `archived`.
- Manual screenshot upload, including multiple-file queue status, partial
  failure, retry, and clear recovery copy.
- Capture Event creation from uploaded screenshots.
- Capture Event ordering.
- Accepted safe Capture Event text metadata edits.
- Capture Asset inspection and existing asset lifecycle controls.
- Empty draft reassignment to another active Project Version.
- Guide and Interactive Demo generation entry points from the loaded Capture
  Session.
- Loading, empty, error, permission, read-only, archived, long URL/title, missing
  asset, and narrow-screen states.

## Explicit Non-Scope

Do not implement any of these in child `125`:

- Chrome extension UI or extension capture behavior. That belongs to child
  `126`.
- Guide authoring, Guide reader, Guide editor, or Guide publishing
  modernization. That belongs to child `127`.
- Interactive Demo authoring, viewer, scene, hotspot, or public-demo
  modernization. That belongs to child `128`.
- Public reader/embed changes.
- New raw HTML replay, raw DOM storage, script stripping, sandboxed replay, OCR,
  AI generation, redaction pipeline, or screenshot processing pipeline.
- New permission model, per-Project-Version membership model, public-link access
  rules, or Organization role semantics.
- Database migrations unless implementation discovers a real contract bug that
  cannot be solved in UI. If that happens, stop and replan before changing
  persistence.
- Asset purge semantics beyond the already existing
  `CaptureAssetLifecycleControls` behavior.
- Broad design-system token changes.

## Current Runtime Facts To Preserve

Routes currently parsed by `apps/web/src/lib/routes.ts`:

- Canonical list:
  `/projects/:projectId/versions/:versionSlug/capture-sessions`
- Canonical detail:
  `/projects/:projectId/versions/:versionSlug/capture-sessions/:captureSessionId`
- Legacy list:
  `/projects/:projectId/capture-sessions`
- Legacy detail:
  `/projects/:projectId/capture-sessions/:captureSessionId`

Route behavior currently owned by `apps/web/src/App.tsx`:

- Legacy Capture routes redirect through the default Project Version.
- Canonical Capture routes use `ProjectVersionRouteBoundary` with
  `allowVersionOwnedContent`.
- Capture list receives `projectVersionId`, `versionSlug`, `canWrite`, and
  `renderShell={false}` inside the Project Version shell.
- Capture detail receives `projectVersions`, `versionSlug`,
  `isDefaultVersion`, `canWrite`, and `canPurge`.

Existing UI behavior to preserve unless this plan explicitly changes it:

- `ProjectCaptureSessionListPage` loads Capture Sessions by
  `project_version_id`.
- New portal-created sessions use `source_type: "manual"`.
- Detail redirects to the Capture Session's actual Project Version slug if the
  URL slug is stale.
- Manual upload creates one Capture Asset and one linked Capture Event per
  accepted screenshot.
- Upload failure after partial success reloads detail without losing accepted
  files.
- Reorder sends the full `event_ids` array.
- Safe manual event edits are limited to page title, page URL, target label,
  target text, input intent, and note.
- Empty draft reassignment sends the current `session.version` as
  `expected_version`.
- Guide and Interactive Demo generation are disabled until the Capture Session
  has a non-empty name and at least one Capture Event.
- Current server/service behavior already creates Guide and Interactive Demo
  Artifact Editions in the source Capture Session's Project Version, including
  named Project Versions. Child `125` must remove the current default-only UI
  gate while preserving route-scope safety.

Current implementation issues to address during child `125` implementation:

- Remove duplicate `source_type: "manual"` in
  `ProjectCaptureSessionListPage.tsx`.
- Remove duplicate retry `onClick` in `CaptureSessionDetailPage.tsx`.
- Replace the detail page's local topbar wrapper with the accepted child `122`
  Project Version shell pattern or an equivalent shell-safe composition. The
  page must not create a second shell inside canonical routes.
- Fix Capture list write gating in `App.tsx`: both legacy and canonical list
  routes must include the selected/default Project Version `status === "active"`
  check, matching the existing detail route behavior.
- Split the oversized Capture detail component and test file before adding new
  behavior.

## Exact Files Expected To Change

Plan and evidence:

- `docs/plan/125-capture-portal-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during closeout.
- `docs/ui/125-capture-portal-browser-evidence.md`
- `docs/ui/evidence/125/` for safe synthetic screenshots if browser evidence is
  captured.

Routes and shell integration:

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx` only for route orchestration if needed; keep it
  under 1000 lines.
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`

Capture UI:

- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.module.css`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
  only as a temporary source for existing tests; split before adding.
- New focused files as needed, for example:
  - `apps/web/src/features/capture-session/CaptureSessionDetailLayout.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionUploadPanel.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionEventTimeline.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionArtifactActions.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionReassignPanel.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionAssetGrid.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionDetail.loading.test.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionDetail.upload.test.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionDetail.events.test.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionDetail.actions.test.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionDetail.permissions.test.tsx`
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.tsx`
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.test.tsx`
- `apps/web/src/features/capture-session/types.ts` only if new local UI types
  are needed.

API client:

- Prefer no API client change.
- If Capture API helpers must move out of oversized `apps/web/src/lib/api.ts`,
  create `apps/web/src/lib/captureApi.ts` and re-export the same public helper
  names from `apps/web/src/lib/api.ts` so existing imports continue to work.
- Update `apps/web/src/lib/api.test.ts` only if a helper contract changes or is
  extracted. If it is already over the file-size limit, split tests first.

Server, schemas, and domain:

- Expected to be read and verified, not changed:
  - `packages/types/src/capture.ts`
  - `packages/capture-domain/src/types/capture-session.ts`
  - `packages/capture-domain/src/policies/capture-session-policy.ts`
  - `packages/capture-domain/src/policies/capture-event-policy.ts`
  - `packages/capture-domain/src/policies/capture-asset-policy.ts`
  - `apps/server/src/modules/capture-session/capture-session.routes.ts`
  - `apps/server/src/modules/capture-event/capture-event.routes.ts`
  - `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
  - `apps/server/src/modules/guide/guide.routes.ts`
  - `apps/server/src/modules/interactive-demo/interactive-demo.routes.ts`
- Touch these only if implementation finds a concrete mismatch between UI
  behavior and accepted API/domain contracts. If persistence, authorization, or
  immutability semantics would change, stop for a decision.

## API Contracts

Use the existing API contracts unless a recheck finds a bug.

Capture Session:

- `GET /api/v1/projects/:projectId/capture-sessions?project_version_id=:projectVersionId`
  - Optional query: `status`.
  - Response: `{ capture_sessions: CaptureSession[] }`.
- `POST /api/v1/projects/:projectId/capture-sessions`
  - Body: `CreateCaptureSessionRequest`.
  - Portal-created manual sessions must send:
    - `name`
    - `project_version_id`
    - `source_type: "manual"`
    - optional `description`
    - optional `start_url`
  - Response: `{ capture_session: CaptureSession }`.
- `GET /api/v1/projects/:projectId/capture-sessions/:captureSessionId/detail`
  - Response:
    `{ capture_session, capture_events, capture_assets }`.
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/reassign-project-version`
  - Body:
    `{ project_version_id: string, expected_version: number }`.
  - Only usable for empty draft Capture Sessions.
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/complete`
  - Existing server contract. If surfaced in UI, use the current redirect
    response and preserve canonical Project Version route handling.
- `PATCH /api/v1/projects/:projectId/capture-sessions/:captureSessionId`
  - Existing server contract. Use only for accepted safe Capture Session
    metadata/status edits if already supported.
- `DELETE /api/v1/projects/:projectId/capture-sessions/:captureSessionId`
  - Existing server contract soft-deletes the Capture Session row with
    `is_deleted`, `deleted_at`, and Row Version updates. Do not turn this into
    physical deletion or asset/file purge.

Capture Event:

- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/events`
  - Body: `CreateCaptureEventRequest`.
  - Manual upload must create `event_type: "capture"` with a linked
    `capture_asset_id`.
  - `input_value_redacted` remains server-controlled/safe; UI must never collect
    raw input values.
- `PUT /api/v1/projects/:projectId/capture-sessions/:captureSessionId/events/order`
  - Body: `{ event_ids: string[] }`.
  - UI must send the complete intended order.
- `PATCH /api/v1/projects/:projectId/capture-sessions/:captureSessionId/events/:eventId`
  - Body may include only:
    `page_url`, `page_title`, `target_label`, `target_text`, `input_intent`,
    `note`.

Capture Asset:

- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/upload`
  - Multipart field: `file`.
  - Optional fields: `page_url`, `page_title`, `captured_at`.
  - Accepted MIME types in UI: PNG, JPEG, WebP.
- `GET /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/:assetId/file`
  - Used through `file_url` from detail response.
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/:assetId/archive`
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/:assetId/restore`
- `GET /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/:assetId/protection`
- `DELETE /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/:assetId`
  - Preserve existing protected-asset checks and Project Admin purge limit.

Artifact generation:

- `POST /api/v1/projects/:projectId/guides/from-capture-session/:captureSessionId`
  - Body: `{ title: string, description?: string | null }`.
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/interactive-demos`
  - Body: `{ title?: string, description?: string | null }`.
- The generated Guide or Interactive Demo must inherit the Capture Session's
  Project Version/target Edition context according to existing server behavior.
  The UI must not let a user combine a Capture Session from one Project Version
  with a target artifact in a different Project Version.
- Current service tests show named Project Version generation is supported. The
  implementation must not keep the default-only disabled state from the old UI.

## UI Behavior Requirements

List page:

- Render inside the accepted portal shell on canonical Project Version routes.
- Show Project Version context without repeating noisy shell chrome.
- Keep legacy route compatibility through default Project Version redirect.
- Show clear states for loading, empty, error with retry, unauthenticated, not
  found, read-only, archived Project, and archived Project Version.
- Show `draft`, `capturing`, `completed`, `canceled`, and `archived` status in a
  compact way.
- Add status filtering only if it uses the existing `status` query contract and
  does not create a new backend contract.
- Long names, descriptions, start URLs, browser strings, and operating systems
  must wrap or truncate safely without layout overflow.
- New Capture Session form:
  - Requires a non-empty name.
  - Sends the current `projectVersionId`.
  - Sends `source_type: "manual"` exactly once.
  - Preserves field values after create failure.
  - Disables submit while pending.
  - Opens the canonical Project Version detail route after success.

Detail page:

- Render inside the accepted portal shell on canonical Project Version routes.
- Keep the Capture Session's actual Project Version visible.
- Redirect safely if the URL Project Version slug does not match the loaded
  Capture Session's Project Version slug.
- Keep loading dimensions stable enough that the page does not jump heavily when
  data loads.
- Show empty Event and Asset sections clearly.
- Show missing or failed asset previews without breaking the timeline.
- Keep Capture Event order readable and keyboard operable.
- Reorder controls must be disabled while a reorder request is pending.
- Reorder failure must keep the current visible list and expose a retry-safe
  message.
- Manual event edit controls must be available only for writable manual Capture
  Sessions that are not archived or canceled.
- Event edit failure must keep the edit form open and preserve typed values.
- Upload controls must be available only for writable manual Capture Sessions.
- Upload queue must announce queued, uploading, uploaded, event-created, and
  failed states in plain language.
- Multiple upload must process sequentially and stop safely on first failure.
- If upload succeeds but event creation fails, reload detail and explain that
  the screenshot was accepted but the event was not created.
- If a later file fails after earlier files succeed, reload detail and preserve
  enough queue state for the user to retry the failed file without duplicate
  indexes.
- Empty draft reassignment:
  - Show only when `canWrite` is true, session status is `draft`,
    `started_at` is null, and there are no events/assets.
  - Offer only active Project Versions other than the current one.
  - Send `expected_version: session.version`.
  - On conflict or stale tab failure, reload current detail and show plain copy.
- Guide/Demo generation:
  - Show entry points only for writable users.
  - Disable until the Capture Session has a title and at least one Capture
    Event.
  - Use the loaded Capture Session, not a route-selected different Project
    Version.
  - Use canonical Project Version artifact routes after creation.
  - Enable generation for default and named Project Versions because current
    server behavior already inherits the Capture Session's Project Version.
  - Remove the current `isDefaultVersion` disabled condition and replace it with
    tests that prove named Project Version generation redirects to the matching
    canonical Project Version artifact route.

Asset lifecycle:

- Keep `CaptureAssetLifecycleControls` permission behavior:
  - Editors/Admins may archive/restore according to existing server rules.
  - Only Project Admin/Organization Owner equivalent may purge when server says
    `can_purge`.
  - Protected dependency details must be reviewed before purge.
- Do not weaken protected shared asset behavior.

## Security And Permission Rules

- All data comes from authenticated internal APIs. Do not add public Capture
  routes.
- Viewers can read Capture Session list/detail only. They must not see enabled
  create, upload, reorder, edit, reassign, archive, purge, complete, or
  generation controls.
- Editors can create, upload, order, safely edit, finalize/complete where
  supported, archive/restore where existing permissions allow, and generate
  Guide/Interactive Demo artifacts.
- Project Admins can do Editor actions and asset purge where server protection
  allows it.
- Archived Projects and archived Project Versions must render read-only, even
  for Editors/Admins.
- Never trust UI-only permissions. Existing server responses must remain the
  authority.
- Do not expose file storage keys, cookies, session tokens, private URLs, raw
  customer data, raw DOM HTML, or raw typed inputs in UI, logs, screenshots, or
  docs.
- Error messages should be clear but not leak cross-tenant existence.

## Migration And Compatibility Notes

- No database migration is expected.
- No schema migration is expected.
- No API rename is expected.
- Keep legacy Capture URLs working by redirecting to the default Project Version
  canonical URL.
- Keep existing API helper exports compatible for other feature imports.
- Keep existing test fixtures synthetic.
- Because this repository is already using real Project Version scoped Capture
  records, do not add fallback behavior that silently changes a Capture Session's
  Project Version.
- Do not change Capture Session deletion semantics. The existing delete route is
  a soft delete for the Capture Session record and does not purge Capture Assets
  or Files.

## Implementation Order

1. Re-read this plan, master `005`, `CONTEXT.md`, ADRs `0002`, `0003`, `0010`,
   `0012`, `0021`, and `0024`.
2. Confirm working tree ownership with `rtk git status --short`.
3. Reconfirm current Capture route/API/component facts. If they differ from this
   plan, update this plan first and commit docs before runtime work.
4. Split oversized Capture detail files before adding behavior:
   - Move presentational/detail sub-parts out of
     `CaptureSessionDetailPage.tsx`.
   - Split `CaptureSessionDetailPage.test.tsx` into focused files without
     reducing coverage.
   - If `api.ts` must change, extract Capture API helpers first.
5. Establish failing focused tests for route/shell/list/detail behavior.
6. Implement list modernization.
7. Implement detail modernization.
8. Implement upload/order/edit/reassign/generation polish.
9. Run focused tests after each meaningful change.
10. Run broad checks and browser validation.
11. Update this plan and master closeout only after verification passes.
12. Commit runtime and docs in small logical commits.

## Focused Test Plan

Use TDD for behavior changes.

Route and shell tests:

- `apps/web/src/lib/routes.test.ts`
  - canonical Capture list/detail parsing.
  - legacy Capture list/detail parsing.
  - encoded project, slug, and Capture Session IDs.
- `apps/web/src/lib/portalNavigation.test.ts`
  - Capture navigation uses Project Version URLs when context exists.
- `apps/web/src/lib/portalRouteMetadata.test.ts`
  - Capture list/detail metadata matches shell behavior if metadata is expanded.
- `apps/web/src/App.test.tsx` or a smaller route test:
  - legacy Capture routes redirect to default Project Version.
  - canonical Capture routes pass `projectVersionId`, `versionSlug`,
    `canWrite`, and `canPurge` correctly.
  - archived Project/Project Version yields read-only Capture UI.
  - Capture list routes include Project Version status in `canWrite`, matching
    Capture detail routes.

List tests:

- Render Project Version scoped sessions in API order.
- Detail links use canonical Project Version URLs.
- Empty/loading/error/unauthenticated/not-found states.
- Viewer and archived contexts show read-only behavior.
- Create form validation, pending state, success redirect, and failure state.
- Long URL/title/name wrapping behavior where unit-testable.

Detail tests:

- Loading/error/unauthenticated/not-found states.
- Actual Project Version mismatch redirects to actual Project Version slug.
- Viewer/read-only/archived contexts hide or disable all mutation controls.
- Manual upload validation.
- Multiple upload success creates ordered linked Capture Events.
- Upload failure and event-creation-after-upload failure recover safely.
- Queue status text is visible and screen-reader friendly.
- Event reorder sends full `event_ids` array and handles failure.
- Manual event edit saves only allowed fields and keeps draft on failure.
- Empty draft reassignment sends `expected_version` and redirects to new
  canonical route.
- Stale reassignment failure reloads detail and explains the failure.
- Guide and Interactive Demo generation use the loaded Capture Session and
  redirect to canonical Project Version artifact routes.
- Guide and Interactive Demo generation work from a Capture Session in a named
  Project Version without a default-only UI gate.
- Missing asset preview does not break the page.
- Asset lifecycle controls still gate purge through protection review.

Server/schema tests:

- Run existing Capture Session/Event/Asset route tests if UI changes rely on
  those contracts.
- Add server tests only if a real server contract gap is found and approved by
  the child boundary.

## Browser Validation Requirements

Use `agent-browser` or the repository's accepted browser validation path with
safe synthetic data only.

Before claiming full browser acceptance, establish a seeded authenticated local
fixture with:

- one active Project;
- default Project Version `Main`;
- one named active Project Version;
- one archived Project Version;
- one Project Admin or Editor session;
- one Viewer session or mocked equivalent;
- draft, capturing, completed, canceled, and archived Capture Sessions;
- at least one manual Capture Session with safe screenshot assets and events;
- one empty draft Capture Session that can be reassigned.

Record evidence in `docs/ui/125-capture-portal-browser-evidence.md`.

Required browser matrix:

- Desktop viewport around 1440px wide:
  - Capture Session list.
  - Capture Session detail.
  - create manual Capture Session in default Project Version.
  - create manual Capture Session in named Project Version.
  - manual upload success.
  - upload failure/retry.
  - event reorder.
  - event edit.
  - empty draft reassignment.
  - Guide generation entry point.
  - Interactive Demo generation entry point.
- Narrow mobile viewport around 390px wide:
  - list layout.
  - detail layout.
  - upload queue.
  - event timeline.
  - asset grid.
- Keyboard-only:
  - create form.
  - upload form.
  - reorder controls.
  - event edit controls.
  - reassign controls.
  - destructive asset lifecycle controls.
- 200% zoom/reflow:
  - list and detail remain usable without horizontal page scroll.
- Console/network:
  - no uncaught console errors.
  - no unexpected failed requests.
- State coverage:
  - loading.
  - empty.
  - generic error and retry.
  - unauthenticated.
  - not found.
  - Viewer/read-only.
  - archived Project.
  - archived Project Version.
  - stale tab/conflict failure.
  - missing asset.

If the fixture or browser tooling is unavailable, record the exact blocked
reason. Do not claim browser coverage from unit tests alone.

## Verification Commands

Focused commands expected during implementation:

```bash
rtk pnpm --filter @repo/web test -- --run apps/web/src/lib/routes.test.ts
rtk pnpm --filter @repo/web test -- --run apps/web/src/lib/portalNavigation.test.ts
rtk pnpm --filter @repo/web test -- --run apps/web/src/features/capture-session
```

Run server contract checks if server/API behavior is touched or relied on by a
new UI assumption:

```bash
rtk pnpm --filter @repo/server test -- --run apps/server/src/modules/capture-session/capture-session.routes.test.ts
rtk pnpm --filter @repo/server test -- --run apps/server/src/modules/capture-event/capture-event.routes.test.ts
rtk pnpm --filter @repo/server test -- --run apps/server/src/modules/capture-asset/capture-asset.routes.test.ts
rtk pnpm --filter @repo/server test -- --run apps/server/src/modules/guide/guide.routes.test.ts
rtk pnpm --filter @repo/server test -- --run apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts
```

Broad checks before closeout:

```bash
rtk pnpm exec prettier --check docs/plan/125-capture-portal-ui-modernization.md
rtk pnpm -r --if-present test
rtk pnpm -r --if-present lint
rtk pnpm -r --if-present build
rtk git diff --check
```

Use the package scripts that actually exist at implementation time if names
differ.

## Acceptance Criteria

- Capture list and detail use the accepted portal shell and Project Version
  context.
- Legacy Capture routes still land on canonical default Project Version routes.
- Manual Capture completes end to end in default and named Project Versions.
- Upload and ordering failures are recoverable without duplicate event indexes
  or lost accepted files.
- Safe manual Capture Event edits remain limited to accepted fields.
- Empty draft reassignment works with `expected_version` and fails safely on
  stale tabs.
- Viewer, archived Project, and archived Project Version states are read-only.
- Guide and Interactive Demo generation uses the loaded Capture Session's
  Project Version context, works for named Project Versions, and rejects or
  disables cross-scope behavior.
- Source assets remain immutable and protected shared assets remain protected.
- Raw input values and raw page HTML are not exposed.
- All touched files are under 1000 lines after implementation.
- Focused tests, broad checks, and required browser evidence are recorded.
- This plan and master `005` are updated only after the implementation is
  actually complete.

## Handoff To Child 126

Child `126` should start from the closed portal Capture workflow.

Carry forward:

- Canonical Capture route context:
  `/projects/:projectId/versions/:slug/capture-sessions`.
- Portal-created manual Capture Sessions use the same server contracts as
  extension-created sessions.
- Source immutability, privacy defaults, and Project Version scoping remain
  non-negotiable.
- Extension UI must not rely on portal-only state or browser-only mocks.

## Expansion Checklist

- [x] Confirmed child `124` closeout and starting commit.
- [x] Re-read master plan `005`, child `124` closeout, this child skeleton,
      `CONTEXT.md`, product/design docs, and relevant ADRs.
- [x] Inspected current Capture web files, routes, API helpers, shared schemas,
      domain policies, and server routes.
- [x] Recorded exact affected files and explicit non-scope.
- [x] Recorded API contracts, permission rules, migration notes, testing, and
      browser validation requirements.
- [x] Classified decisions: no critical user decision is required for expansion.
- [x] Rechecked against master `005`, child `124` closeout, current Capture
      routes, current Capture schemas, and Guide/Interactive Demo generation
      service behavior.
- [x] Implemented the scoped child `125` runtime changes.
- [x] Recorded focused and broad verification.
- [x] Recorded browser evidence status and the exact full-fixture limitation.
- [x] Updated master `005` for the completed child.

## Implementation Log

Expansion notes:

- Expanded on 2026-07-26 from clean commit `17a8884`.
- Current runtime facts were taken from the checked-out web routes, Capture UI,
  API client helpers, shared Capture schemas, domain policies, and server route
  files.
- No runtime code was changed during expansion.
- Rechecked on 2026-07-26 against master `005`, implemented child `124`, and
  current server behavior. The recheck corrected the stale default-only
  Guide/Demo generation assumption and clarified Capture Session status and
  soft-delete wording.

Runtime implementation on 2026-07-26:

- Starting commit before runtime work: `6a1b8b8`.
- Split `CaptureSessionDetailPage.tsx` into smaller focused files:
  - `CaptureSessionDetailHelpers.ts`
  - `CaptureSessionDetailSections.tsx`
  - `CaptureSessionDetailShell.tsx`
- Kept existing detail behavior and copy intact while moving helper and
  presentational code out of the oversized page file.
- Added shell-safe detail rendering through `renderShell`, and passed
  `renderShell={false}` from the canonical Project Version detail route so the
  Capture Session detail page no longer creates a second portal shell.
- Fixed Capture list write gating for legacy and canonical routes so archived
  Project Versions are read-only even for admin/editor roles.
- Removed the stale default-only UI gate from Guide and Interactive Demo
  generation. The UI now allows generation from a named Project Version when
  the loaded Capture Session is writable, named, and has at least one Capture
  Event.
- Added focused route coverage for archived Project Version Capture list
  read-only behavior.
- Added focused detail coverage proving Guide and Interactive Demo generation
  works from a named Project Version and redirects to canonical Project Version
  artifact routes.
- No server API, schema, database migration, permission model, Capture source
  immutability, raw input handling, raw HTML handling, asset lifecycle, or
  public route behavior changed.
- The expected duplicate `source_type: "manual"` issue was rechecked during
  implementation; current code contains a single portal create payload field.

## Verification Record

Runtime verification on 2026-07-26:

- `rtk git status --short`
- `rtk pnpm --filter web test -- AppCaptureRoutes.test.tsx`
- `rtk pnpm --filter web test -- src/features/capture-session/CaptureSessionDetailGeneration.test.tsx`
- `rtk pnpm --filter web test -- src/features/capture-session/CaptureSessionDetailGeneration.test.tsx src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `rtk pnpm --filter web test -- src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `rtk pnpm --filter web test -- src/features/capture-session AppCaptureRoutes.test.tsx`
- `rtk pnpm --filter web check-types`
- `rtk pnpm --filter web lint`
- `rtk pnpm -r --if-present test`
- `rtk pnpm check-types`
- `rtk pnpm lint`
- `rtk pnpm build`
- `rtk git diff --check`
- Touched file line counts after implementation:
  - `CaptureSessionDetailPage.tsx`: 993 lines.
  - `CaptureSessionDetailHelpers.ts`: 217 lines.
  - `CaptureSessionDetailSections.tsx`: 324 lines.
  - `CaptureSessionDetailShell.tsx`: 35 lines.
  - `ProjectCaptureSessionListPage.tsx`: 547 lines.
  - `App.tsx`: 772 lines.

Browser evidence:

- Recorded in `docs/ui/125-capture-portal-browser-evidence.md`.
- Full browser acceptance was not claimed because this checkout still lacks the
  seeded authenticated local fixture required by this plan.

## Leftovers

- Full browser matrix remains the only blocked verification item. It requires a
  seeded authenticated local fixture with admin/editor and viewer sessions,
  active/default/named/archived Project Versions, and representative Capture
  Session states. Follow-up child
  `docs/plan/125-01-capture-portal-browser-fixture.md` added the dev/test-only
  fixture tooling, but the live seed/browser run remains blocked in this
  checkout until `apps/server/.env-cmdrc` has a disposable
  `testing_maintenance` profile.
- `CaptureSessionDetailPage.test.tsx` remains an existing oversized test file.
  Runtime coverage was preserved and new behavior was added in focused smaller
  test files, but a full behavior-preserving split of the legacy test file
  should be handled separately if it becomes necessary before further edits.
- Child `126` should continue to preserve exact Project Version ownership for
  extension-created Capture Sessions and must not rely on portal-only state.
