# Child Plan 126: Extension UI Modernization

Date reserved: 2026-07-12

Expanded and rechecked: 2026-07-29

Status: Implemented. Direct browser and contract verification pass; true
installed toolbar-popup end-to-end acceptance is blocked by the available
automation surface and remains open.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate

Prerequisite:

- Child `125` is complete in this checkout. Its final closeout commit is
  `623fccb`.
- Child `125` established and browser-verified canonical Capture portal routes:
  `/projects/:projectId/versions/:versionSlug/capture-sessions/:captureSessionId`.
- Child `125` established that the loaded Capture Session's Project Version is
  authoritative. Extension portal links must use that loaded canonical Project
  Version slug and must not infer current scope from a changed Default Project
  Version or a stale stored selection.
- Child `125-01` provides disposable, dev/test-only portal fixtures that may be
  reused for authenticated portal handoff validation.

Next child:

- `127` Guide Authoring And Reader UI Modernization. Do not begin it until this
  extension phase is implemented, verified, closed, and handed off.

Starting state:

- The worktree was clean at expansion time.
- The starting extension baseline passes:
  - 11 Vitest files and 99 tests;
  - TypeScript check;
  - ESLint;
  - production extension build.
- Expansion-time production build baseline:
  - popup `index.js`: 246.23 kB raw / 75.92 kB gzip;
  - popup `index.css`: 14.41 kB raw / 3.86 kB gzip;
  - background service worker: 2.79 kB raw / 1.09 kB gzip;
  - content script: 3.12 kB raw / 1.33 kB gzip.
- `rtk` is not installed in this environment. Expansion-time commands were run
  directly with `pnpm`; implementation should use `rtk` when it is available
  and otherwise record the same direct-command fallback.
- `apps/extension/src/App.tsx` is 1,550 lines and
  `apps/extension/src/App.test.tsx` is 1,869 lines. Both must be split before
  substantial UI behavior is added.
- No runtime implementation is included in this planning checkpoint.

## Goal

Modernize the constrained Chrome extension experience so setup, authentication,
Project and Project Version selection, capture operation, recovery, completion,
and portal handoff are clear in a stable popup without weakening:

- Organization tenant isolation;
- Project-role authorization;
- Capture Session Project Version immutability;
- Capture Event ordering;
- split API/portal base-URL support;
- extension-only token handling;
- automatic-capture reliability;
- manual screenshot fallback;
- privacy defaults.

The popup should feel like a compact Ossie workbench: one clear context, one
clear primary action, concise status, predictable focus, and explicit recovery.
It is not a miniature copy of the full portal.

## Acceptance Summary

This child is complete only when:

- connect, login, current-session verification, Project selection, Project
  Version selection, start, pause, resume, automatic capture, manual capture,
  finish, open portal, sign out, and local recovery remain covered;
- Project Version context never changes silently after capture starts;
- stale, archived, deleted, unauthorized, and unavailable stored contexts fail
  safely with explicit recovery;
- manual and automatic capture cannot allocate a Capture Event index from
  competing stale popup/background state;
- a stale local event index is reconciled from the existing Capture Event list
  after restoration or an index conflict, without automatically repeating an
  ambiguous upload;
- finish, local clear, logout, and instance changes cannot race an accepted
  in-flight background capture command;
- popup dimensions remain stable and all critical controls remain reachable;
- keyboard, focus, status announcement, truncation, zoom/reflow, console, and
  network checks pass;
- browser-automation evidence is explicitly separated from a real installed
  extension toolbar-popup run;
- no new extension permission, database migration, API rename, or privacy
  expansion is introduced.
- no new major dependency is introduced, and material bundle growth is measured
  and justified.

## Product And Domain Rules

Use these terms exactly:

- Organization;
- Project;
- Project Version;
- Default Project Version;
- Capture Session;
- Capture Event;
- Capture Asset;
- automatic capture;
- manual screenshot.

Do not:

- call a Project Version merely a “version” where the meaning is ambiguous;
- call an active Capture Session a recording;
- describe local-state discard as canceling or deleting the server Capture
  Session;
- call screenshot capture video, replay, or session recording;
- imply that changing the current Default Project Version moves an existing
  Capture Session.

Capture rules:

- Each extension Capture Session belongs to exactly one Project Version.
- The chosen Project Version becomes immutable for extension UI purposes as
  soon as session creation succeeds.
- A loaded Capture Session and its `project_version` summary are authoritative
  for restoration and portal handoff.
- Capture Event indexes are ordered server data, not a decorative client
  counter.
- The extension may collect safe click metadata and screenshots, but never raw
  typed input values or raw page HTML.
- Original Capture Assets and Capture Events remain subject to existing server
  lifecycle and immutability rules.

## Actual Runtime Baseline To Preserve

### Extension shape

- Manifest V3 action popup: `index.html`.
- Background service worker: `assets/background.js`.
- Content script: `assets/content-script.js` on `http://*/*` and
  `https://*/*`.
- Existing permissions:
  - `activeTab`;
  - `storage`;
  - `tabs`;
  - host permission `<all_urls>`.
- No `scripting`, `tabCapture`, `desktopCapture`, camera, microphone, audio, or
  video permission exists.

### Popup states

`App.tsx` currently resolves:

- initial loading;
- unconfigured instance;
- configured but signed out;
- authenticated capture workspace;
- fatal/retryable load error.

The authenticated workspace currently supports:

- active, capture-capable Project loading;
- active Project Version loading;
- remembered Project/Project Version selection;
- automatic selection of the Default Project Version only when no stored
  Project Version selection exists;
- extension Capture Session creation;
- active Capture Session restoration from storage plus a server read;
- manual and automatic modes;
- pause/resume;
- manual screenshot fallback;
- automatic-click diagnostics;
- finish and portal open;
- local active-state discard;
- logout and instance reset.

### Stored extension settings

`chrome.storage.local` currently stores these compatible keys:

- `instanceUrl`;
- `portalUrl`;
- `sessionToken`;
- `selectedProjectId`;
- `selectedProjectVersionId`;
- `selectedProjectVersionSlug`;
- `selectedProjectVersionName`;
- `activeCaptureSessionId`;
- `activeCaptureProjectId`;
- `activeCaptureProjectVersionId`;
- `activeCaptureProjectVersionSlug`;
- `activeCaptureProjectVersionName`;
- `activeCaptureEventIndex`;
- `activeCaptureMode`;
- `activeCapturePaused`;
- `automaticCaptureDiagnostic`;
- `manualCaptureDiagnostic`.

Changing `instanceUrl` clears portal, auth, selection, capture, and diagnostics.
Changing only `portalUrl` preserves auth and active capture. Passwords are not
stored. Signing out clears the token and active local capture state.

### Current Project Version recovery

- If no remembered Project Version exists, the active Default Project Version is
  selected.
- If a remembered Project Version still exists and is active, it remains
  selected even if the Project's Default Project Version changed.
- If a remembered Project Version is no longer in the active list, the extension
  does not silently replace it.
- If an active Capture Session exists, the extension loads it from the server
  and repairs stored Project Version id/slug/name from the returned
  `capture_session.project_version`.
- The current popup does not retain the loaded Capture Session status or
  reconcile its stored event index from server Capture Events. Child `126` must
  do both so an externally completed/canceled/archived session is read-only and
  a stale local counter can recover.
- A restored Capture Session in an archived Project Version stays visible but
  must be read-only.
- An active Capture Session can still be readable after its Project disappears
  from `purpose=capture` results, for example after Project archival or a role
  downgrade to Viewer. In that case the current UI lacks an explicit capability
  signal and must not infer write access from the stored Project id.
- `403` or `404` while restoring an active Capture Session makes the stored
  context unavailable; it must not reveal whether a cross-tenant resource
  exists.

### Capture behavior

- New sessions currently send `source_type: "extension"`, the exact
  `project_version_id`, and safe current-tab/browser metadata.
- The shared create contract and extension README require
  `start_immediately: true`, but the current extension-local input type and
  request omit it. This is a concrete contract gap in the starting code: child
  `126` must add the literal field and a request test so extension sessions
  reliably begin in `capturing`, rather than depending on fixture/mock state.
- Automatic capture:
  - only runs in automatic, unpaused mode;
  - accepts trusted primary clicks;
  - skips `input`, `textarea`, `select`, and editable targets;
  - truncates safe target text;
  - captures a visible-tab PNG;
  - uploads one Capture Asset;
  - creates one linked `click` Capture Event;
  - sends `input_value_redacted: true`;
  - persists the server-returned event index and a diagnostic;
  - keeps active state after failure so manual fallback remains available.
- Manual capture:
  - captures a visible-tab PNG;
  - uploads one Capture Asset;
  - creates one linked `capture` Capture Event;
  - sends `input_value_redacted: true`;
  - persists a manual diagnostic and the event index.
- The background has an in-memory automatic-capture in-flight guard. Manual
  capture currently runs in the popup, outside that guard.

### Portal handoff

- Portal base URL is `portalUrl` when configured, otherwise `instanceUrl`.
- Unsafe absolute or protocol-relative server redirect paths are rejected.
- The safe fallback route is:
  `/projects/:projectId/versions/:versionSlug/capture-sessions/:captureSessionId`.
- Child `125` proved named Project Version canonical routing. The loaded active
  Capture Session slug is the source of truth, not the selected Project Version,
  current default, or an arbitrary redirect containing a Project Version id.

## Concrete Reliability Gaps Included In This Child

The popup holds `activeCaptureEventIndex` in React state while automatic capture
updates the same index in `chrome.storage.local` from the background. The popup
does not subscribe to storage changes, and manual capture allocates
`currentIndex + 1` in the popup. Therefore a background automatic event can make
the open popup stale and allow a manual attempt to reuse an index.

This child must close that boundary as part of preserving capture reliability:

- screenshot-backed Capture Event allocation for both automatic and manual
  capture must pass through one background capture-command controller;
- that controller must read current stored settings immediately before
  allocation;
- it must serialize or reject overlapping commands before either allocates an
  index;
- a rejected busy command must create actionable status rather than silently
  pretending a Capture Event was saved;
- the server-returned `capture_event.event_index`, not the requested value, must
  be persisted;
- accepted commands must persist a `saving` diagnostic before screenshot/upload
  work so the popup has a real uploading/saving state rather than only success
  and failure;
- the popup must observe relevant storage changes so background diagnostics and
  indexes update while it remains open;
- no client-side retry may automatically repeat an upload/event pair after an
  ambiguous failure because the asset may already have been accepted.

The mutex alone is insufficient after interruption: an Event may commit before
the service worker receives the response or saves the returned index. A later
command would reuse the stale local index. Use the existing authenticated Event
list contract to reconcile:

- on active Capture Session restoration, list its Capture Events and persist the
  highest returned `event_index`, or `0` for an empty list;
- if Event creation returns `capture_event_index_conflict`, list Events, persist
  the highest index, and return an explicit reconciled/retry result;
- never retry the original upload/Event pair automatically because its Asset or
  Event outcome may be ambiguous;
- if reconciliation itself fails, retain active context, show a safe error, and
  block further capture commands until retry/reopen succeeds.
- if an Event index conflict occurs after Asset upload, acknowledge that the
  screenshot may remain as an unlinked Capture Asset; do not automatically
  delete it or create another Event under this child.

Capture-affecting lifecycle transitions also cross popup/background contexts.
Finish, local clear, logout, and instance change must first use the same
background controller to quiesce capture:

- reject the transition with “capture is still saving” while a command is in
  flight; do not clear or complete;
- when idle, atomically persist paused state before acknowledging the quiesce so
  a new automatic click cannot start in the handoff window;
- keep pause/resume writes behind the controller for the same ordering reason;
- after a failed transition, preserve or restore the prior active state unless
  the server result is already known to have succeeded.

Use one explicit in-flight controller and retryable busy recovery unless a
failing test demonstrates that a bounded queue is safer. Do not add a broad job
queue, server idempotency contract, or database change under this UI child.

Automatic click messages also carry Chrome sender context that the current
background listener discards, while the screenshot adapter captures the
currently visible tab. This can pair click metadata from one tab with a
screenshot from another if focus changes. Child `126` must:

- pass the `chrome.runtime.MessageSender` tab context into the controller for
  automatic commands;
- require the sender tab to still be active and to have a valid window id;
- call `captureVisibleTab` for that sender window;
- reject a stale/inactive sender before upload or Event creation with safe
  retry copy;
- keep manual capture targeted to the active tab resolved for the user-invoked
  popup action;
- never put tab/window ids into server metadata merely to implement this check.

## Scope

Implement only:

- popup composition and visual hierarchy;
- instance and optional portal base-URL connection;
- extension login, session verification, logout, and retry states;
- Project and Project Version selection;
- stored selection and active-capture restoration;
- active Capture Session context, mode, pause/resume, diagnostics, and actions;
- background coordination needed to prevent automatic/manual event-index and
  lifecycle-transition races;
- authoritative Capture Event index reconciliation through the existing Event
  list route;
- manual screenshot fallback;
- finish and canonical portal handoff;
- local-state discard confirmation and copy;
- stable narrow-popup layout;
- keyboard, focus, status announcements, reduced motion, truncation, and
  reflow;
- extension README and browser-evidence updates;
- focused extension tests and only the server contract checks needed to prove
  existing behavior.

## Explicit Non-Scope

Do not implement:

- portal Capture UI changes from child `125`;
- Guide authoring/reader work from child `127`;
- Interactive Demo authoring/viewer work from child `128`;
- new Project, Project Version, membership, or Organization management UI;
- per-Project-Version membership;
- Capture Session reassignment, event editing/reordering, asset lifecycle, or
  generation controls in the extension;
- cancel/delete/archive/purge server actions;
- raw DOM/HTML capture, form-value capture, OCR, redaction processing, script
  replay, or page reconstruction;
- video, audio, webcam, microphone, tab recording, desktop recording, or
  Loom-style behavior;
- new browser permissions or expanded match patterns;
- a side panel, options page, full-page extension app, or browser devtools panel;
- a persistent client-side capture queue or offline upload system;
- server API renames, new public routes, new auth mechanisms, refresh tokens, or
  token-in-URL behavior;
- database migrations, reseeding requirements, or persistent schema changes;
- broad `@repo/ui` token/primitives redesign;
- extension distribution, store publication, signing, or version bump;
- unrelated web/server cleanup.

## Exact Files Expected To Change

### Plan, docs, and evidence

- `docs/plan/126-extension-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during verified closeout and only for child `126` completion items.
- `docs/ui/126-extension-ui-browser-evidence.md`
- `docs/ui/evidence/126/` for safe synthetic screenshots.
- `apps/extension/README.md`

### Popup entry and styling

- `apps/extension/src/App.tsx`
  - retain top-level load/orchestration compatibility;
  - reduce below 1,000 lines by extracting the panels below.
- `apps/extension/src/index.css`
  - implement stable dimensions, scrolling, focus, truncation, responsive
    action layout, status styles, and reduced-motion behavior;
  - replace the undefined `--ossie-color-code` selected border reference with
    an accepted existing token.
- `apps/extension/src/popup/helpers.ts`
- `apps/extension/src/popup/helpers.test.ts`
- New:
  - `apps/extension/src/popup/PopupShell.tsx`
  - `apps/extension/src/popup/ConnectInstancePanel.tsx`
  - `apps/extension/src/popup/SignInPanel.tsx`
  - `apps/extension/src/popup/CaptureWorkspace.tsx`
  - `apps/extension/src/popup/CaptureContextPanel.tsx`
  - `apps/extension/src/popup/CaptureStatusPanel.tsx`
  - `apps/extension/src/popup/LocalCaptureRecovery.tsx`

Keep these components presentational where possible. `App.tsx` remains the
owner of initial orchestration and dependency injection; background capture
commands remain outside React.

### Popup tests

- `apps/extension/src/App.test.tsx`
  - treat as the source for existing coverage, then split it below 1,000 lines;
  - keep only top-level state orchestration coverage in this file.
- New:
  - `apps/extension/src/popup/ConnectInstancePanel.test.tsx`
  - `apps/extension/src/popup/SignInPanel.test.tsx`
  - `apps/extension/src/popup/CaptureWorkspace.selection.test.tsx`
  - `apps/extension/src/popup/CaptureWorkspace.active.test.tsx`
  - `apps/extension/src/popup/CaptureWorkspace.recovery.test.tsx`
  - `apps/extension/src/popup/CaptureWorkspace.accessibility.test.tsx`

Move existing tests; do not delete behavior coverage merely to meet the file
limit.

### Capture coordination and storage

- `apps/extension/src/background.ts`
- `apps/extension/src/lib/automatic-capture.ts`
- `apps/extension/src/lib/automatic-capture.test.ts`
- `apps/extension/src/lib/settings.ts`
- `apps/extension/src/lib/settings.test.ts`
- `apps/extension/src/lib/screenshot.ts`
- `apps/extension/src/lib/screenshot.test.ts`
- New:
  - `apps/extension/src/lib/capture-command.ts`
    - owns serializable manual-capture, pause/resume, and quiesce
      message/result types plus the popup `chrome.runtime.sendMessage` adapter;
    - must not contain React types.
  - `apps/extension/src/lib/capture-command.test.ts`
  - `apps/extension/src/lib/capture-controller.ts`
    - owns the one background in-flight boundary for automatic/manual
      screenshot commands and capture-affecting lifecycle transitions;
    - reuses the current screenshot/upload/event primitives.
  - `apps/extension/src/lib/capture-controller.test.ts`

Keep `apps/extension/src/lib/content-click-capture.ts` and its test compatible.
Touch them only to surface an existing `automatic_capture_busy` response as a
diagnostic; do not expand collected click data.

### API and canonical navigation

- `apps/extension/src/lib/api.ts`
- `apps/extension/src/lib/api.test.ts`
  - add the existing Capture Event list read needed for authoritative index
    reconciliation;
  - otherwise limit changes to applying the extension client header
    consistently and preserving current route/payload contracts.
- `apps/extension/src/lib/url.ts`
- `apps/extension/src/lib/url.test.ts`
  - retain canonical loaded Project Version slug fallback and unsafe redirect
    rejection.
- `apps/extension/src/lib/navigation.ts`
- `apps/extension/src/lib/navigation.test.ts`
  - only if retryable completed-portal handoff requires a focused adapter test.

### Manifest/build assertions

- `apps/extension/src/manifest.test.ts`
  - add/preserve a negative assertion that this child did not add recording,
    media, or scripting permissions.
- `apps/extension/public/manifest.json`
  - read and verify;
  - no content change is expected.
- `apps/extension/package.json`
  - read and verify;
  - no dependency or script change is expected.
- `pnpm-lock.yaml`
  - explicit non-scope because no dependency change is expected.

## Files To Read And Verify, Not Change

- `packages/types/src/auth.ts`
- `packages/types/src/project.ts`
- `packages/types/src/project-version.ts`
- `packages/types/src/capture.ts`
- `packages/constants/src/capture.ts`
- `packages/constants/src/project-membership.ts`
- `apps/server/src/modules/authentication/session.routes.ts`
- `apps/server/src/modules/authentication/request-session-token.ts`
- `apps/server/src/modules/project/project.routes.ts`
- `apps/server/src/modules/project/project.repository.ts`
- `apps/server/src/modules/project-version/project-version.routes.ts`
- `apps/server/src/modules/project-version/project-version.service.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/capture-session/capture-session.routes.ts`
- `apps/server/src/modules/capture-session/capture-session.service.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
- `apps/server/src/modules/capture-event/capture-event.routes.ts`
- `apps/web/src/lib/routes.ts`

Do not touch server, shared-schema, migration, portal, or lockfile files unless a
focused failing contract test proves the current implementation differs from
this plan. If authorization, persistence, tenant isolation, Capture immutability,
or a shared API schema would change, stop and amend the plan before proceeding.

Generated `apps/extension/dist/` output may be used for installed-extension
validation. It is not source and must not be committed.

## Ownership Boundaries

- `App.tsx` owns bootstrap sequencing, authenticated view-model state, injected
  dependencies, and recovery state whose server result must survive a local
  adapter failure during the current popup lifetime.
- `popup/*.tsx` owns rendering, local form state, focus, confirmation, and
  invoking typed callbacks. It must not call `fetch`, Chrome storage, or Capture
  mutation APIs directly.
- `lib/settings.ts` owns storage keys, sanitization, atomic setting writers, and
  the storage-change subscription adapter. It does not decide server
  authorization.
- `background.ts` plus `lib/capture-controller.ts` owns ordering for screenshot
  commands, pause/resume, quiesce, and automatic sender-tab validation. No
  popup component allocates an Event index.
- `lib/capture-command.ts` owns the serializable runtime protocol and popup
  messaging adapter; it contains no server credentials in messages.
- `lib/automatic-capture.ts` owns safe automatic screenshot/upload/Event work,
  not cross-command locking.
- `lib/screenshot.ts` owns `captureVisibleTab`, including the validated
  automatic sender window when supplied.
- `content-click-capture.ts` owns trusted-click filtering and safe page metadata
  only. It does not read tokens into messages, allocate indexes, upload, or
  decide authorization.
- `lib/api.ts` owns HTTP transport, exact headers, path encoding, and typed
  response shapes. It does not own popup recovery policy.
- `lib/url.ts` and `lib/navigation.ts` own safe URL construction and browser-tab
  opening respectively.
- The API Server remains authoritative for authentication, tenant isolation,
  Project capability, Project/Project Version lifecycle, and Capture mutation
  acceptance.

## Routes And API Contracts

All extension-origin authenticated calls must send:

```http
Authorization: Bearer <extension session token>
x-ossie-client: extension
Accept: application/json
```

Login must send `x-ossie-client: extension` without an existing bearer token.
Use `credentials: "include"` only as current fetch compatibility; the extension
must use the returned bearer token and must not depend on the portal session
cookie.

Apply the extension client header consistently to `login`, `me`, `logout`,
Project, Project Version, Capture Session, Capture Asset, and Capture Event
requests so Access Evidence identifies the extension surface. Do not rename the
accepted `x-ossie-client` header or revive the historical
`x-demo-composer-client` name.

### Authentication

- `POST /api/v1/authentication/login`
  - Request: `LoginRequest`.
  - Response: `ExtensionLoginResponse`.
  - Extension response must contain `session_token`.
  - Invalid credentials stay generic.
- `GET /api/v1/authentication/me`
  - Response: `AuthResponse`.
  - Used on popup load to verify the stored token.
  - `401` clears the unusable local token and moves to signed out.
- `POST /api/v1/authentication/logout`
  - Bearer token required.
  - Local token and local active state must still be cleared if the server says
    the session is already invalid; a transient network failure must be shown
    rather than falsely claiming remote revocation.

### Project and Project Version selection

- `GET /api/v1/projects?status=active&purpose=capture`
  - Response: `ProjectListResponse`.
  - Server returns only active Projects the actor may capture into.
  - Organization Owners map to Project Admin access.
  - Project Admins and Editors are eligible.
  - Viewers are excluded by `purpose=capture`; the extension must not invent a
    client-side Viewer write path.
- `GET /api/v1/projects/:projectId/versions?status=active`
  - Response: `ProjectVersionListResponse`.
  - Project read authorization and Organization scoping remain server-owned.
  - The selection list contains only active Project Versions.
  - An archived owning Project Version may still arrive through the active
    Capture Session response and is displayed read-only, not inserted into the
    new-session selection list.

### Capture Session

- `POST /api/v1/projects/:projectId/capture-sessions`
  - Request shape compatible with `CreateCaptureSessionRequest`.
  - Required extension fields:
    - `name`;
    - exact `project_version_id`;
    - `source_type: "extension"`;
    - `start_immediately: true`.
  - Optional safe fields:
    - `start_url`;
    - browser name/version;
    - operating system;
    - viewport width/height;
    - device pixel ratio;
    - user agent;
    - safe metadata.
  - Response: `CaptureSessionResponse`.
  - Server verifies extension source from `x-ossie-client`; the UI header and
    body must agree.
- `GET /api/v1/projects/:projectId/capture-sessions/:captureSessionId`
  - Response: `CaptureSessionResponse`.
  - Restoration source of truth for Project, status, and
    `capture_session.project_version`.
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/complete`
  - Empty body.
  - Response: `CompleteCaptureSessionResponse` containing the completed Capture
    Session and redirect data.
  - The extension must still validate/fallback from the redirect path.

Do not use the list, detail, update, delete, archive, or reassignment contracts
to add extension behavior in this child.

### Capture Asset

- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/assets/upload`
  - Multipart field `file`.
  - Current optional fields:
    - `width`;
    - `height`;
    - `device_pixel_ratio`;
    - `page_url`;
    - `page_title`;
    - `captured_at`;
    - JSON-safe metadata.
  - Extension screenshots remain PNG.
  - Response: `CaptureAssetResponse`.

### Capture Event

- `GET /api/v1/projects/:projectId/capture-sessions/:captureSessionId/events`
  - Response: `CaptureEventListResponse`.
  - Used only to reconcile the highest existing `event_index`.
  - Do not reorder, edit, or delete extension Events.
- `POST /api/v1/projects/:projectId/capture-sessions/:captureSessionId/events`
  - Response: `CaptureEventResponse`.
  - Automatic commands send:
    - `event_type: "click"`;
    - allocated `event_index`;
    - uploaded `capture_asset_id`;
    - safe click/page/viewport metadata;
    - `input_value_redacted: true`.
  - Manual commands send:
    - `event_type: "capture"`;
    - allocated `event_index`;
    - uploaded `capture_asset_id`;
    - safe page/viewport metadata;
    - `input_value_redacted: true`.
- Never send raw input values, cookies, authorization values, raw HTML, or
  arbitrary DOM attributes.
- `409` with `error.type: "capture_event_index_conflict"` triggers a read-only
  Event-list reconciliation and explicit retry state; it does not automatically
  repeat upload or Event creation.

### Portal route contract

Canonical handoff:

```text
{portalUrl ?? instanceUrl}
/projects/{projectId}
/versions/{canonicalLoadedProjectVersionSlug}
/capture-sessions/{captureSessionId}
```

Rules:

- encode every path segment;
- treat `instanceUrl` and `portalUrl` as HTTP(S) base URLs. Preserve a valid
  configured path prefix for backwards compatibility; do not silently coerce
  either value to `URL.origin`;
- reject embedded username/password credentials, query strings, and fragments
  because appending API/portal paths to those values is ambiguous and unsafe;
- accept only a single-leading-slash relative server redirect;
- reject absolute, protocol-relative, and scheme-bearing redirects;
- use a redirect only when its pathname exactly matches the canonical encoded
  Project id, loaded Project Version slug, and Capture Session id, with no query
  or fragment;
- otherwise build the canonical path from the loaded Capture Session;
- never place the session token in a URL;
- never use a changed Default Project Version or current picker selection for an
  already active Capture Session.

## Schemas And Types

### Shared contracts to reuse

Use existing exports:

- `LoginRequest`, `ExtensionLoginResponse`, `AuthResponse` from
  `@repo/types/auth`;
- `Project`, `ProjectListResponse` from `@repo/types/project`;
- `ProjectVersionDetail`, `ProjectVersionListResponse` from
  `@repo/types/project-version`;
- `CaptureSession`, `CaptureSessionResponse`, `CaptureAssetResponse`,
  `CaptureEventResponse`, `CaptureEventListResponse`,
  `CompleteCaptureSessionResponse` from `@repo/types/capture`;
- capture mode/source/event constants from `@repo/constants` where the exact
  shared type already exists.

Do not copy shared Project Version or Capture response shapes into popup files.

### Extension-local contracts

Keep these app-local because they adapt Chrome/runtime or multipart data:

- `ExtensionSettings`;
- `AutomaticCaptureDiagnostic`;
- `ManualCaptureDiagnostic`;
- `CreateCaptureSessionInput`;
- `UploadCaptureAssetInput`;
- `CreateCaptureEventInput`;
- `ScreenshotCapture`;
- `CurrentTabSnapshot`;
- `PageClickCaptureMessage` and safe payload;
- capture-command runtime messages/results;
- storage/runtime adapter types.

`CreateCaptureSessionInput` must gain
`start_immediately: true` (or be safely narrowed from the shared request type),
and `buildCaptureSessionInput` must return that literal. This closes the
documented request drift without changing the shared server schema.

Extend the two existing diagnostic status unions additively from
`"success" | "failed"` to `"saving" | "success" | "failed"`. A `saving`
diagnostic has `eventIndex: null` and safe progress copy. On popup restoration,
an old stored `saving` state is treated as interrupted until Capture Event index
reconciliation completes; it must not display an indefinite live upload.

The new runtime command union must be discriminated and serializable:

```ts
type CaptureRuntimeMessage =
  | PageClickCaptureMessage
  | {
      type: "ossie:manual_capture";
      payload: {
        page_url: string | null;
        page_title: string | null;
      };
    }
  | {
      type: "ossie:set_capture_paused";
      payload: { paused: boolean };
    }
  | {
      type: "ossie:quiesce_capture";
      payload: {
        reason: "finish" | "clear_local" | "logout" | "change_instance";
      };
    };

type CaptureCommandResult =
  | { ok: true; event_index: number }
  | { ok: true; state: "paused" | "resumed" | "quiesced" }
  | {
      ok: false;
      reason:
        | "capture_inactive"
        | "capture_paused"
        | "capture_busy"
        | "capture_context_unavailable"
        | "capture_index_reconciled"
        | "capture_index_reconciliation_failed"
        | "capture_failed";
      message?: string;
    };
```

Names may be adjusted before the planning checkpoint only if tests and docs are
updated together. Do not include token, instance URL, Project id, Capture
Session id, or event index in the popup message; the background must reread
authoritative storage immediately before acting. Quiesce is a local
coordination command, not a server Capture Session status change.

### Storage compatibility

- Keep every existing storage key and meaning.
- New stored keys are not expected.
- Any added field must be optional, sanitized during `getSettings`, and safe for
  old installations where it is absent or malformed.
- Do not store transient passwords, form values, raw errors containing secrets,
  page HTML, or click target input values.
- Continue persisting diagnostics as `{ status, message, eventIndex,
occurredAt }`.
- Add a typed storage subscription that updates popup state for:
  - active event index;
  - automatic/manual diagnostics;
  - active mode/paused state;
  - active context clearing.
- Subscription cleanup must run on popup unmount.

No runtime Zod parsing expansion is required in this child. If API response
validation is proposed, treat it as a separate shared-client decision rather
than applying it to only one response ad hoc.

## UI Structure And Behavior

### Stable popup shell

- Keep a fixed 360px target width.
- Use a stable minimum height around the current 420px baseline.
- Set an explicit usable maximum height and scroll the content region rather
  than allowing controls to clip below Chrome's popup boundary.
- Keep brand/context/status placement stable across loading and loaded states.
- Avoid large layout jumps between Project selection and active capture.
- Do not use hover-only disclosure.
- Long Organization, user, instance, Project, Project Version, page, and Capture
  identifiers must truncate or wrap without horizontal overflow; full values
  should remain available through accessible title/description where useful.
- Use existing `@repo/ui` `Button`, `Input`, `Label`, `Select`, `Alert`,
  `AlertTitle`, `AlertDescription`, `Badge`, `Card`, and `Separator` primitives
  where they fit. Do not add a component library.

### Loading and fatal recovery

- Loading renders a stable shell and announces “Loading extension”.
- A transient initialization error shows the safe message and a retry action.
- Retry reruns settings/auth/Project/context loading without requiring an
  extension reload.
- A `401` is an authentication state, not a fatal generic error.
- `403`/`404` active-context errors collapse to the same unavailable recovery
  copy.
- Do not expose response bodies, resource ids from another tenant, or stack
  traces.

### Connect instance

- Require a valid `http://` or `https://` API instance base URL.
- Keep the portal base URL optional and clearly label it as the browser portal
  address used after capture.
- Preserve valid path prefixes, but reject embedded credentials, query strings,
  and fragments for both base URLs.
- Normalize trailing slashes with the existing URL helper.
- Preserve input after validation/network failure.
- Disable submit while saving.
- Explain that changing the API instance signs out and clears local capture
  context.
- Require explicit confirmation when changing an already configured instance
  while local active capture state exists.
- Portal-only changes must not sign out or clear active capture.

### Sign in and session verification

- Email and password require labels and browser-safe autocomplete attributes.
- Password is never copied into settings or diagnostics.
- Disable submit while pending and prevent double submit.
- Invalid credentials use safe inline copy.
- After login, use the returned extension token and load current auth/Projects.
- Stored token verification happens on each popup initialization.
- Show current Organization and user identity compactly.
- Logout revokes the server session when reachable, then clears local auth and
  capture state.
- If remote logout fails because the token is already invalid, clear local
  state; for an ambiguous network failure, show retry/clear-local choices and
  do not claim remote logout succeeded.

### Project and Project Version selection

- Use compact labeled native selects, not a tall list of Project cards.
- Show an explicit empty state when the actor has no capture-capable Projects.
- On Project change:
  - load that Project's active Project Versions;
  - select its active Default Project Version only when there is no valid stored
    selection for that Project;
  - store Project id plus Project Version id/slug/name together.
- On Project Version change, store id/slug/name together.
- If a remembered Project no longer appears and no active Capture Session
  exists, clear the stale selection and ask for a new choice.
- If a remembered Project Version is missing/archived/deleted/unauthorized:
  - do not replace it silently;
  - show that the saved Project Version is unavailable;
  - require explicit Project Version selection before Start is enabled.
- A changed Default Project Version must not override an existing valid stored
  named Project Version.
- Project and Project Version selectors are locked while a Capture Session is
  active.
- Start is available only with a currently loaded active Project and active
  Project Version.

### Start Capture Session

- The primary pre-capture action is “Start capture”.
- Prevent double submission.
- Build a safe name from current tab title, then Project name, then the current
  fallback.
- Send the exact selected Project Version id.
- After success:
  - store Capture Session, Project, authoritative returned Project Version,
    event index `0`, automatic mode, and unpaused state;
  - render active state without relying on a Project list refetch.
- If server creation succeeds but saving local active state fails:
  - do not submit another create request automatically;
  - keep the returned Capture Session and canonical portal URL in memory;
  - show “Capture Session started, but local recovery could not be saved”;
  - offer retry-local-save and open-in-portal actions;
  - block another Start action for the current popup lifetime.
- If the current tab is unsupported/restricted, explain the limitation before
  or after the safe failed action; do not request broader permissions.
- A server conflict/archived/stale error reloads the selection context and
  requires an explicit retry.

### Active Capture Session

- Keep Project / Project Version context prominent.
- Retain the loaded `capture_session.status` in popup state. `completed`,
  `canceled`, and `archived` restoration states are read-only. Preserve
  backwards compatibility for a stored extension-created `draft` session from
  before the `start_immediately` repair: it may continue the same tested
  capture/complete workflow, but the UI must identify its actual status and
  must not silently create a replacement session.
- Show a compact status badge:
  - Capturing automatically;
  - Manual mode;
  - Paused;
  - Project Version archived;
  - Context unavailable.
- Keep the current step count visible as server-confirmed Capture Events, not an
  optimistic count.
- Automatic mode copy must explain safe clickable targets and sensitive-field
  skipping.
- Manual mode must keep “Capture screenshot” as the primary action.
- Pause disables automatic click capture but preserves the current manual
  screenshot fallback. The popup copy and focused tests must state that
  distinction clearly.
- All capture/mode/finish actions disable during their own pending state.
- One pending operation must not allow another operation to allocate an event
  index.
- If the loaded Capture Session's Project is absent from the capture-capable
  Project list, treat it as read-only for extension mutations even when the
  Capture Session read succeeds. This covers Project archival and role
  downgrade without trying to distinguish them client-side.
- Diagnostics distinguish:
  - screenshot/upload/Event saving in progress;
  - saved step number;
  - capture busy and safe retry;
  - screenshot unavailable on restricted/internal pages;
  - upload accepted but Capture Event result ambiguous;
  - authentication expired;
  - owning Project Version archived;
  - generic network/server failure.
- Never automatically retry an ambiguous screenshot upload or event create.
- Background storage changes must update the open popup without closing and
  reopening it.
- Event-index reconciliation must finish successfully before enabling another
  manual or automatic capture command.

### Archived or unavailable active context

- A loaded Capture Session whose owning Project Version is archived remains
  visible with its stored/canonical Project Version name.
- A restored Capture Session that was completed, canceled, or archived
  elsewhere is no longer mutable. Show its actual status, allow canonical portal
  navigation and explicit local-state clearing, and do not try to resume,
  capture, or complete it again.
- Disable mode changes, screenshot capture, and finish when the server contract
  says the context is read-only.
- Keep “Open in portal” available when a canonical loaded slug exists.
- If restoration returns `403` or `404`:
  - show a single safe “Capture context is no longer available” state;
  - do not offer mutation;
  - allow sign in again when authentication may have changed;
  - allow explicit local-state discard;
  - do not silently start a replacement Capture Session.

### Local-state discard

- Label the action “Clear local capture state”, not “Delete” or “Cancel”.
- Use an inline two-step confirmation appropriate to a popup; avoid a
  browser-native modal that can obscure context.
- Explain that the server Capture Session is not completed, canceled, or
  deleted and may remain visible in the portal.
- Quiesce background capture before clearing. If a screenshot is still saving,
  keep local state and ask the user to retry.
- On clear failure, retain the active UI and show the error.
- After success, return to Project/Project Version selection.

### Finish and portal handoff

- “Finish and open portal” is the primary completion action.
- Quiesce background capture before calling complete. If a screenshot is still
  saving, do not call complete and ask the user to retry.
- Complete the server Capture Session first.
- Derive canonical context from the loaded/returned Capture Session.
- Validate or replace the server redirect using the canonical route rules above.
- Clear local active state only after server completion succeeds.
- As soon as server completion succeeds, retain the completed response and safe
  canonical URL in memory. If local clearing fails, offer retry-local-clear and
  portal-open recovery without calling complete again.
- Do not claim the extension is ready for a new Capture Session until local
  clearing succeeds.
- If server completion and local clear succeed but tab opening fails:
  - show an in-memory “Capture completed” state;
  - retain the safe canonical URL for an explicit “Try opening portal again”
    action during the current popup lifetime;
  - do not call complete again;
  - explain that the completed Capture Session remains in the portal library.
- `Open in portal` during an active session uses the same canonical loaded
  Project Version slug.

## Security, Permission, Privacy, And Evidence Rules

### Authorization

- The server remains authoritative for Organization and Project access.
- `purpose=capture` is required when listing Projects for new capture.
- Only Organization Owners, Project Admins, and Editors may receive
  capture-capable Projects.
- The extension must not infer authorization merely because an id is in
  storage.
- Every Capture read/mutation remains scoped by Organization, Project, and
  Capture Session server checks.
- Treat `403` and tenant-scoped `404` uniformly in recovery copy.
- Archived Project Versions are read-only even for an Editor/Admin.
- UI disablement is defense in depth, not authorization.

### Token and base-URL handling

- Store only the extension session token, never the password.
- Never log, render, document, or include the token in a URL.
- Never send a token to `portalUrl`; it is used only to construct a browser
  navigation URL.
- A changed API instance clears the token and all instance-bound state.
- Keep API and portal base-URL fields visibly distinct.
- Only `http://` and `https://` are accepted.
- Preserve valid path-prefix deployments; reject credentials, queries, and
  fragments.
- Keep unsafe redirect rejection.

### Capture privacy

- Do not capture trusted clicks from editable/form controls.
- Keep target text truncated and safe.
- Do not add raw input value, keystroke, clipboard, cookie, authorization,
  local-storage, full DOM, raw HTML, or arbitrary attribute collection.
- Keep `input_value_redacted: true` on every extension-created Capture Event.
- Browser screenshots and evidence must use synthetic test pages/data only.
- Sanitize evidence so it contains no token, password, private customer URL,
  storage key, or real customer content.

### Extension permissions

- Preserve the current manifest permissions and match patterns.
- Do not add `scripting`, `tabCapture`, `desktopCapture`, media, clipboard, web
  request, downloads, notifications, or recording permissions.
- Do not broaden content scripts beyond current HTTP/HTTPS matches.
- Keep a manifest regression test for these negative requirements.

### Audit and Access Evidence

- Send `x-ossie-client: extension` consistently so authentication, access, and
  mutations are attributed to the extension surface.
- Do not add client-authored audit payloads or duplicate server audit writes.
- Existing server Audit/Access writers remain authoritative.

## Migration, Rollback, And Backwards Compatibility

- No database migration.
- No schema migration.
- No server reset or reseed requirement.
- No API route rename.
- No change to Capture Session source immutability.
- No extension manifest permission migration.
- No extension version bump in this child.
- Existing `chrome.storage.local` keys remain readable and retain their meaning.
- Missing optional Project Version and diagnostic keys from older installs
  continue to sanitize to `null`.
- The additive diagnostic `saving` value is safe to roll back: older builds
  sanitize an unrecognized diagnostic to `null`; new builds reconcile an
  interrupted `saving` value before enabling capture.
- Malformed stored values fail closed and do not crash the popup.
- Existing active Capture Sessions restore through the server and repair
  canonical Project Version context.
- Existing configured same-base installs continue using `instanceUrl` when
  `portalUrl` is absent.
- Existing split-origin or split-base installs retain `portalUrl`.
- Historical technical identifiers and server headers remain compatible; do not
  rename cookies, environment variables, packages, or API paths.
- Popup component extraction must preserve the `App` dependency-injection seam
  used by tests.
- If rollback is required, UI component extraction can be reverted without
  changing stored data. Do not ship a storage writer that older builds cannot
  safely ignore.

## Shared-Package Reuse Gate

- Reuse `@repo/ui` primitives already exported.
- Reuse `@repo/types` API response/request contracts where shapes match.
- Keep Chrome runtime, storage, Blob/multipart adapter, screenshot, and popup
  view-model types extension-local.
- Do not move a type into a shared package solely to reduce one file.
- Do not change `@repo/ui` tokens for a popup-only need; use accepted tokens and
  local composition.

## Implementation Order

### Slice 0: Recheck and planning checkpoint

1. Re-read this child, master `005`, child `125`, child `125-01`,
   `CONTEXT.md`, `PRODUCT.md`, `DESIGN.md`, ADRs `0002`, `0011`, `0012`,
   `0014`, `0019`, `0021`, `0023`, `0024`, and `0025`.
2. Confirm worktree ownership and starting commit.
3. Re-run the extension baseline.
4. If current code contradicts this plan, update and checkpoint the plan before
   runtime work.

### Slice 1: Behavior-preserving file split

1. Move popup shell, connection, sign-in, workspace, context, status, and
   recovery JSX into the exact popup files listed above.
2. Split `App.test.tsx` into focused suites without changing behavior.
3. Keep `App.tsx` orchestration and injected dependencies compatible.
4. Run all extension tests, types, and lint before styling or behavior changes.
5. Commit the refactor separately.

### Slice 2: Capture-command coordination and reconciliation

1. Add failing tests that reproduce a manual command arriving while automatic
   capture is in flight, a popup whose index is stale after a background
   success, a committed Event whose returned index was not persisted, and a
   finish/clear transition attempted during capture.
2. Add the discriminated runtime command/result contract.
3. Put automatic and manual screenshot-backed commands behind one background
   in-flight controller.
4. Validate automatic sender-tab activity and capture its window explicitly.
5. Make the background reread storage before allocation.
6. Add Event-list reconciliation on restoration and index conflict.
7. Put pause/resume and quiesce transitions behind the same controller.
8. Surface busy/failure/reconciled results without optimistic index increments.
9. Subscribe the popup to relevant settings changes.
10. Preserve sensitive-target filtering and all current payload privacy.
11. Commit this reliability slice separately.

### Slice 3: Setup/auth/selection modernization

1. Add focused failing UI tests for stable states, selects, pending controls,
   validation, stale selection, and recovery.
2. Modernize Connect and Sign In.
3. Modernize Project and Project Version selection.
4. Add `start_immediately: true` to the narrowed extension create contract.
5. Add server-success/local-save recovery for Start.
6. Apply the extension client header consistently.
7. Preserve instance reset and split-base semantics.
8. Commit this coherent UI slice.

### Slice 4: Active capture and handoff modernization

1. Add focused failing tests for mode/status/actions, archived/unavailable
   context, explicit local clear, completion, and portal retry.
2. Modernize the active context/status panels.
3. Implement inline local-clear confirmation.
4. Preserve canonical loaded Project Version handoff.
5. Add in-memory server-success/local-clear/open-failure recovery without
   duplicate completion.
6. Commit this coherent UI slice.

### Slice 5: Accessibility, layout, docs, and browser evidence

1. Add stable max-height scrolling, focus, status announcement, truncation, and
   reduced-motion behavior.
2. Fix the undefined selected-border token.
3. Run focused and broad verification.
4. Build, compare popup/background/content bundle sizes to the recorded
   baseline, and load the unpacked extension.
5. Run browser automation and true toolbar-popup validation separately.
6. Record dated evidence and limitations.
7. Update README, this child, and only completed master items.

Use TDD for every behavior change: failing focused test, smallest passing
implementation, then refactor while green.

## Focused Test Plan

### App orchestration

- loading to unconfigured, signed-out, signed-in, and error transitions;
- stored-token verification;
- `401` to signed-out recovery;
- transient error retry;
- Project and Project Version load order;
- active Capture Session restoration;
- authoritative Project Version context repair;
- authoritative Event-index reconciliation;
- `403`/`404` safe unavailable state;
- archived owning Project Version read-only state;
- completed/canceled/archived Capture Session restoration is read-only;
- legacy extension-created `draft` Capture Session restoration remains
  compatible;
- readable active Capture Session whose Project is absent from capture-capable
  results is read-only;
- storage subscription cleanup;
- no behavior loss after test/component split.

### Connect and authentication

- API URL validation and normalization;
- optional portal URL validation;
- valid base-path preservation and credentials/query/fragment rejection;
- absent-portal-URL fallback to the API base URL;
- portal-only change preserves token/capture;
- instance change clears instance-bound state;
- active-state instance-change confirmation;
- pending/double-submit prevention;
- password never reaches settings;
- login/me/logout header contracts;
- invalid token and ambiguous logout failure behavior;
- labeled controls and focus placement.

### Project and Project Version selection

- only active capture-capable Projects are requested;
- empty Project state;
- Default Project Version selection with no stored selection;
- valid named stored selection survives Default Project Version change;
- stale stored Project Version is not silently replaced;
- missing Project clears selection only when no active Capture Session exists;
- changing Project reloads Project Versions;
- start disabled until Project and active Project Version are loaded;
- selectors locked during active capture;
- long labels remain accessible.

### Capture command/controller

- manual and automatic commands use the same in-flight boundary;
- automatic command rejects missing/inactive/stale sender tabs before
  screenshot/upload/Event creation;
- automatic screenshot uses the validated sender window id;
- sender tab/window ids are not added to server metadata;
- background rereads storage for each accepted command;
- accepted command persists `saving` before screenshot/upload/Event work;
- overlapping command returns explicit busy without upload/event creation;
- finish, clear, logout, and instance change cannot cross an in-flight capture;
- accepted quiesce persists paused state before it responds;
- pause/resume is ordered through the same controller;
- busy automatic result persists or surfaces a diagnostic;
- manual popup shows retryable busy copy;
- one successful command persists the server-returned index;
- restoration lists Events and reconciles the highest index;
- index conflict lists Events, persists the highest index, and requires a new
  user action rather than retrying the ambiguous command;
- failed reconciliation blocks capture but preserves recovery context;
- popup observes the updated index/diagnostic;
- interrupted stored `saving` state reconciles on restoration and does not stay
  indefinitely in progress;
- screenshot failure creates no upload/event;
- upload failure creates no event and retains active state;
- event failure does not automatically retry or increment local index;
- diagnostic persistence failure does not hide a successful server event;
- inactive, paused, missing-auth, missing-context, archived/unavailable paths
  fail closed;
- sensitive/editable clicks remain skipped;
- `input_value_redacted: true` remains present;
- no raw input/HTML field is added.

### Active UI

- automatic/manual/paused/archived/unavailable labels;
- correct primary action per state;
- pending actions mutually disable unsafe overlap;
- background diagnostic update is rendered live;
- manual success displays server-confirmed step;
- actionable restricted-page, busy, network, auth, and stale-context errors;
- local clear requires two steps and accurately describes server state;
- local clear quiesces first and leaves state intact while capture is busy;
- local-clear failure retains active context;
- server create success/local active-state persistence failure cannot create a
  duplicate Capture Session on retry;
- finish uses loaded/returned Project Version slug;
- unsafe redirect falls back to canonical path;
- safe-looking redirect with a different Project, Project Version slug, Capture
  Session id, query, or fragment falls back to the loaded canonical path;
- changed picker/default cannot alter active portal route;
- completion failure retains active state;
- finish does not call complete while background capture is busy;
- completion success plus local-clear failure never calls complete twice and
  exposes retry-local-clear/open recovery;
- portal-open failure does not re-complete and offers retry;
- active `Open in portal` uses the configured portal base URL when present.

### Accessibility/layout assertions

- one `h1` per popup state;
- every input/select has a persistent label;
- errors use alert semantics;
- success/status updates use polite status semantics;
- saving/uploading state is announced once without a rapidly repeating live
  region;
- destructive confirmation receives focus and is keyboard operable;
- focus returns to the triggering control after cancellation where feasible;
- disabled controls expose the reason in visible copy;
- no positive `tabindex`;
- no critical information is color-only;
- selected state uses a defined token;
- reduced-motion media query disables nonessential transitions;
- no horizontal overflow at the target popup width.

### API, URL, settings, and manifest

- exact routes and encoded ids;
- extension client and bearer headers;
- multipart field names;
- capture session source and exact Project Version id;
- click/capture event types and privacy flag;
- storage sanitization/backwards compatibility;
- diagnostic `saving` persistence, interruption recovery, and rollback
  compatibility;
- instance/portal reset differences;
- safe canonical portal URL and unsafe redirect rejection;
- manifest permission allowlist and recording/media permission denylist.
- production build sizes are recorded and any material growth is explained.

## Existing Server Contract Verification

Run existing server tests only where the extension relies on the contract:

- authentication extension token/header behavior;
- Project `purpose=capture` authorization;
- Project Version active list/read authorization;
- extension Capture Session source enforcement;
- active/archived Project Version Capture mutation behavior;
- Capture Asset upload;
- Capture Event index/privacy behavior;
- complete response canonical named Project Version path;
- cross-Organization non-disclosure.

Do not add server tests solely to restate UI implementation details.

## Browser And Agent-Browser Validation Requirements

Use the installed `agent-browser` skill for browser-visible validation. Keep two
evidence classes separate.

### A. Direct popup-page automation

This may serve the built popup page directly or open its
`chrome-extension://.../index.html` URL. It validates DOM/UI behavior but does
not prove toolbar action grants, service-worker/content-script integration, or
real popup lifetime.

Required direct checks:

- unconfigured Connect state;
- signed-out state;
- invalid and pending sign-in behavior;
- authenticated Project/Project Version selection;
- stale stored selection recovery;
- active automatic/manual/paused/archived/unavailable states;
- long labels/URLs/identifiers;
- local-clear confirmation;
- completion/open failure recovery when safely mockable;
- keyboard order and visible focus;
- 200% zoom/reflow;
- reduced-motion setting;
- target 360px width and a narrower 320px diagnostic viewport;
- no horizontal overflow or clipped critical controls;
- accessibility snapshot;
- console and network review.

### B. True installed toolbar-popup validation

Build `apps/extension/dist`, load it as an unpacked Manifest V3 extension in a
Chrome-compatible browser, and invoke the toolbar action. This is required to
claim end-to-end extension acceptance.

Use only synthetic local target pages and the disposable child `125-01`
database/portal fixture. Required flows:

- connect an API base URL and separate portal base URL;
- login and popup close/reopen token restoration;
- choose an active Project and named active Project Version;
- start Capture Session and verify returned source Project Version;
- close/reopen popup and restore the same active Capture Session;
- automatic click creates one screenshot Asset and one linked `click` Event;
- switching away before an automatic screenshot fails safely rather than
  pairing the old click metadata with the new active tab screenshot;
- manual screenshot creates one screenshot Asset and one linked `capture`
  Event;
- automatic success while popup is open updates step/status without reopen;
- overlapping automatic/manual attempt never creates a duplicate event index;
- force or simulate an index conflict and prove Event-list reconciliation
  enables a later new action without repeating the ambiguous action;
- attempt Finish/local clear while a capture is saving and prove the transition
  waits or fails safely without losing the Event;
- sensitive form/editable click creates no Capture Event;
- pause/resume behavior;
- restricted/internal page failure gives actionable manual/recovery copy without
  permission expansion;
- service-worker restart followed by active-state restoration;
- finish completes once, clears local state, and opens:
  `/projects/:projectId/versions/:canonicalSlug/capture-sessions/:id`;
- configured portal base URL, not API base URL, is used;
- named Project Version slug, not id or current Default Project Version, is
  present in the portal URL;
- opened portal renders the child `125` canonical Capture Session detail;
- local-state discard does not cancel/delete the server Capture Session;
- sign out and invalid-token recovery.

After each automatic/manual flow, verify through authenticated API or the portal:

- exactly one new Capture Asset;
- exactly one linked Capture Event;
- unique increasing event indexes;
- expected `click` or `capture` event type;
- `input_value_redacted: true`;
- no raw input value or page HTML.

### Evidence record

Create `docs/ui/126-extension-ui-browser-evidence.md` with:

- date, commit, browser/version, OS, API base URL, portal base URL;
- exact build/start/fixture commands;
- whether evidence is direct page or true toolbar popup;
- matrix result and screenshots;
- extension popup, background service-worker, target-page, portal console, and
  network findings;
- server/API verification counts, including the reconciled highest Event index;
- any restricted-page or automation limitation;
- confirmation that screenshots contain synthetic data only.

If agent-browser cannot control the installed toolbar popup, use it for the
direct page and portal handoff, then perform the installed-popup matrix with the
repository's available Chrome automation/manual path. Record the precise split.
Do not claim true toolbar-popup coverage from direct page automation.

## Verification Commands

Focused extension commands:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
```

When `rtk` is unavailable, run the same commands without the prefix and record
that fallback.

Run targeted tests during slices, for example:

```bash
pnpm --filter extension test -- src/lib/capture-controller.test.ts
pnpm --filter extension test -- src/lib/capture-command.test.ts
pnpm --filter extension test -- src/popup/CaptureWorkspace.active.test.tsx
pnpm --filter extension test -- src/lib/url.test.ts
pnpm --filter extension test -- src/manifest.test.ts
```

Server contract checks, using current exact filenames after recheck:

```bash
pnpm --filter server test -- \
  src/modules/authentication/session.routes.test.ts \
  src/modules/project/project.service.test.ts \
  src/modules/project-version/project-version.routes.test.ts \
  src/modules/capture-session/capture-session.routes.test.ts \
  src/modules/capture-event/capture-event.routes.test.ts \
  src/modules/capture-asset/capture-asset.routes.test.ts
```

Run the repository-wide checks required by `AGENTS.md` before closeout when
practical. Record pre-existing unrelated failures separately; do not modify
unrelated files to make this child appear green.

## Closeout Checklist

### Planning and ownership

- [x] Child `125` completion and canonical Project Version handoff rechecked.
- [x] Current extension code, tests, storage, manifest, APIs, schemas, and server
      authorization inspected.
- [x] Exact expected files and conditional boundaries recorded.
- [x] Expansion baseline recorded.
- [x] Planning checkpoint committed before runtime implementation.

### Implementation

- [x] Oversized App and test files split without behavior loss.
- [x] Every touched runtime/test source file remains below 1,000 lines after
      extraction.
- [x] Capture command/index/lifecycle races and sender-tab integrity covered
      behind one background boundary.
- [x] Setup/auth/selection UI modernized.
- [x] Active/recovery/handoff UI modernized.
- [x] Storage and API backwards compatibility preserved.
- [x] Privacy and manifest permission invariants preserved.
- [x] README updated.

### Verification

- [x] Focused extension tests pass.
- [x] Extension TypeScript, lint, and build pass.
- [x] Relevant server contract checks pass.
- [x] Direct agent-browser popup-page validation recorded.
- [x] True installed toolbar-popup validation recorded or precisely blocked.
- [ ] Automatic/manual API evidence proves unique indexes and redaction.
- [ ] Portal handoff proves canonical named Project Version routing.
- [x] Console/network/accessibility/reflow evidence recorded.

### Closeout

- [ ] Status changed to Complete only after acceptance.
- [x] Implementation log lists exact commits and behavior.
- [x] Verification record contains dated commands/results.
- [x] Master `005` updated only for completed child `126` items.
- [x] Leftovers are handed to child `127`, child `129`, or a separately approved
      reliability child without silently expanding those phases.

## Implementation Log

Implemented, with installed-toolbar end-to-end acceptance still open.

Implementation commits:

- `1969bd8` (`refactor(extension): extract popup setup panels`) extracted the
  setup shell/panels without behavior loss.
- `41af21a` (`feat(extension): serialize capture commands and reconcile events`)
  added the shared background controller, manual runtime command, sender
  tab/window validation, saving diagnostics, Event-list reconciliation, strict
  URL/API contracts, storage subscription, and focused tests.
- `b5cb163` (`feat(extension): modernize popup workflow and recovery`) split the
  popup and tests below 1,000 lines; added compact selectors, stable/reflowing
  layout, active read-only states, two-step local clear, live status,
  server-success/local-persistence recovery, and no-duplicate-completion
  handoff recovery.

Implementation record:

- 2026-07-29: Added `start_immediately: true`, consistent extension client
  headers, strict credential/query/fragment base-URL rejection, and exact
  canonical redirect matching.
- 2026-07-29: Routed automatic and manual screenshots, pause/resume, Finish,
  local clear, logout, and instance change through one background in-flight
  boundary.
- 2026-07-29: Reconciled the highest server Event index on restoration and
  index conflict without repeating an ambiguous Asset/Event operation.
- 2026-07-29: Added active sender-window screenshot targeting and fail-closed
  stale-tab behavior without adding tab/window ids to server metadata.
- 2026-07-29: Modernized setup, authentication, Project/Project Version
  selection, active capture, diagnostics, accessibility, and local/completion
  recovery while preserving manifest permissions and privacy fields.

Expansion record:

- 2026-07-29: Rechecked completed child `125`, master `005`, current extension
  popup/background/content/storage/API/manifest code, shared schemas, server
  Project/Project Version/Capture authorization, and prior extension reliability
  plans.
- 2026-07-29: Recorded current clean baseline: 11 extension test files and 99
  tests pass; types, lint, and build pass.
- 2026-07-29: Added the actual manual/background event-index concurrency boundary
  to the implementation scope and defined a background-controller resolution.
- 2026-07-29: Readiness recheck added authoritative Event-list reconciliation,
  capture lifecycle quiescing, automatic sender-tab/window validation,
  real saving/uploading status, server-success/local-persistence recovery,
  capability loss handling, strict canonical redirect matching, and safe
  base-URL validation.
- 2026-07-29: Rechecked ownership and non-scope against completed child `125`,
  child `125-01`, master `005`, current product/design context, accepted ADRs,
  and the actual server/extension callers.
- 2026-07-29: No runtime implementation performed.

## Verification Record

Expansion-only baseline on 2026-07-29:

```text
pnpm --filter extension test
  PASS: 11 files, 99 tests

pnpm --filter extension check-types
  PASS

pnpm --filter extension lint
  PASS

pnpm --filter extension build
  PASS

pnpm --filter server test -- \
  src/modules/authentication/session.routes.test.ts \
  src/modules/project/project.service.test.ts \
  src/modules/project-version/project-version.routes.test.ts \
  src/modules/capture-session/capture-session.routes.test.ts \
  src/modules/capture-event/capture-event.routes.test.ts \
  src/modules/capture-asset/capture-asset.routes.test.ts
  PASS: 6 files, 51 tests

pnpm exec prettier --check docs/plan/126-extension-ui-modernization.md
  PASS

git diff --check
  PASS
```

This baseline does not claim UI acceptance, installed-extension validation,
accessibility acceptance, or browser evidence for child `126`.

Implementation verification on 2026-07-29:

```text
pnpm --filter extension test
  PASS: 19 files, 123 tests

pnpm --filter extension check-types
  PASS

pnpm --filter extension lint
  PASS

pnpm --filter extension build
  PASS
  popup JS: 250.52 kB raw / 77.04 kB gzip
  popup CSS: 16.20 kB raw / 4.24 kB gzip
  background entry: 8.46 kB raw / 2.69 kB gzip
  shared capture-command chunk: 9.76 kB raw / 2.41 kB gzip
  content script: 3.12 kB raw / 1.33 kB gzip

pnpm --filter server test -- [six focused contract files]
  PASS: 6 files, 51 tests

pnpm check-types
  PASS: 12 tasks

pnpm lint
  PASS: 13 tasks

agent-browser direct popup-page matrix
  PASS: Connect, signed-out, selection, active paused, long labels,
  two-step local clear, focus return, 360/320/180 CSS-pixel reflow,
  reduced motion, console, network, and automated accessibility checks

installed unpacked extension
  PARTIAL: enabled Manifest V3 build, real extension origin/storage/runtime,
  and background service worker verified
  BLOCKED: agent-browser cannot attach to the browser-chrome toolbar popup
```

Detailed safe synthetic evidence is recorded in
`docs/ui/126-extension-ui-browser-evidence.md`.

## Leftovers And Handoff

- Child `125` portal fixtures and canonical routes are available for extension
  portal-handoff validation.
- Child `126` owns extension UI and the narrow automatic/manual coordination fix
  described here. It must not absorb portal editor or artifact-authoring work.
- Before marking child `126` Complete or beginning child `127`, run the true
  installed toolbar-popup matrix against the disposable child `125-01` fixture.
  Capture authenticated automatic/manual API counts, sensitive-target
  suppression, service-worker restart restoration, race/reconciliation
  behavior, and canonical portal handoff.
- Child `129` still owns the later cross-product accessibility, motion, and
  browser dogfood pass; child `126` must nevertheless meet its own popup-specific
  accessibility and browser acceptance rather than deferring all evidence.
