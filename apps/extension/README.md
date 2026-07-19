# Ossie Extension

Chrome extension popup for connecting a browser to a hosted or self-hosted Ossie instance.

## Product Positioning

This extension is currently an alpha automatic click capture tool with manual screenshot capture as a fallback.

Manual dogfood on 2026-06-22 showed that these flows existed in code/tests but were not yet reliable in a real browser run: automatic clicks produced no events/files, manual fallback produced no upload/event, and portal links opened the API origin in a split API/web local setup. Follow-up validation on 2026-07-07 closed the automatic click upload/event path, refreshed captured-workflow screenshots from a safe synthetic browser run, and closed the split-origin portal URL path. Direct extension-page manual fallback has bounded passing evidence from plan 101, but true toolbar-popup manual validation remains pending; plan 103 also found a direct extension-page duplicate event-index follow-up when manual capture was attempted after automatic clicks.

The current workflow is:

```text
start capture
  -> click through the target browser workflow
  -> extension records one screenshot-backed click event per supported click
  -> optionally click Capture screenshot for pages where automatic capture is unavailable
  -> finish capture
  -> open the capture session in the portal
  -> create/edit a guide from the ordered screenshots and click metadata
```

## Current Scope

This app currently supports in code and focused tests:

- configuring an Ossie instance URL
- signing in against that instance
- storing the extension session token in extension storage
- checking current auth
- listing accessible projects
- selecting the project and active Project Version that future captures should
  use
- starting a capture session with the exact selected Project Version ID
- storing active capture session id, immutable owning Version context, capture
  mode, pause state, and local event index
- restoring active capture state and authoritatively repairing its owning
  Version context when the popup is reopened
- automatically recording safe click metadata from http/https pages while automatic capture is active
- uploading a visible-tab screenshot for each supported click
- recording a linked `click` event after each successful automatic screenshot upload
- pausing and resuming automatic click capture
- capturing the visible active tab as a PNG screenshot
- uploading that screenshot to the active capture session with safe tab metadata
- recording a linked `capture` event after each successful screenshot upload
- persisting the local event index for the active capture session
- finishing the active capture session and opening the portal capture detail page
- opening the active capture session in the portal without finishing it
- discarding local active capture state if needed

It does not capture raw DOM HTML, input values, navigation events, full-page stitched screenshots, or HTML snapshots yet.
Discarding local active capture state does not cancel or complete the backend capture session. Use `Finish capture` to complete the backend capture session.

## Development

From the repo root:

```bash
rtk pnpm --filter extension test
rtk pnpm --filter extension check-types
rtk pnpm --filter extension lint
rtk pnpm --filter extension build
```

For local browser development:

```bash
rtk pnpm --filter extension dev
```

For a loadable Chrome extension build:

```bash
rtk pnpm --filter extension build
```

Then load `apps/extension/dist` in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `apps/extension/dist`.

For local self-host testing, configure the extension instance URL as the API origin:

```text
http://localhost:3002
```

If the API and web portal run on different origins, also set the optional portal URL. For the default local Vite portal this is:

```text
http://localhost:3000
```

API calls still use the instance URL. `Open in portal` and `Finish capture` use the portal URL when it is configured.

## Auth Transport

The extension asks for an instance URL first. Login calls:

```text
POST {instance_url}/api/v1/authentication/login
```

with:

```text
x-ossie-client: extension
```

The server keeps normal portal cookie behavior unchanged and additionally returns `session_token` for extension-marked login requests. Extension API calls then send:

```text
Authorization: Bearer <session_token>
```

The password is never stored. Changing the instance clears the stored token,
selected Project and Version, and active capture state.

## Capture Session Start

Starting capture calls:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions
```

with:

```text
Authorization: Bearer <session_token>
x-ossie-client: extension
```

The extension sends `source_type: "extension"`, the exact selected
`project_version_id`, `start_immediately: true`, and safe current-tab metadata
when available. Current-tab metadata is limited to the active tab URL/title and
only stores `http://` or `https://` URLs.

The new session starts in automatic click capture mode. Automatic mode can be paused and resumed from the popup. The manual `Capture screenshot` button remains available while automatic capture is active.

## Automatic Click Capture

The content script listens for trusted primary click events on `http://` and `https://` pages. It first checks local extension storage to confirm automatic capture is active and unpaused. It skips form fields, text areas, selects, and editable content. For supported active-capture clicks it sends safe metadata to the background service worker:

- page URL/title
- safe trimmed target text
- explicit or inferred role
- `data-testid`/`data-test-id` when present
- best-effort selector
- click coordinates
- viewport dimensions
- device pixel ratio
- target bounding box

The background service worker checks local active capture state again before doing any upload work. If automatic capture is active and not paused, it captures the visible tab, uploads the screenshot asset, creates a linked `click` event, then advances the local event index. A simple in-flight guard prevents duplicate ordered events while a previous automatic click capture is still being processed.

The latest automatic capture outcome is stored in extension storage and shown when the popup is opened during an active capture. Screenshot, upload, event-recording, and content-script message-delivery failures are shown as actionable popup errors while preserving the active capture state and manual screenshot fallback. Successful automatic clicks show the recorded step number.

The extension never stores raw input values or page HTML. It sends `input_value_redacted: true` for automatic click events.

## Manual Screenshot Upload

When an active capture session exists, the popup can capture the visible active tab:

```text
chrome.tabs.captureVisibleTab({ format: "png" })
```

The returned PNG data URL is converted to a `Blob`, decoded for width/height when available, and uploaded as multipart form data:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload
```

with:

```text
Authorization: Bearer <session_token>
x-ossie-client: extension
```

The upload includes the screenshot file, captured timestamp, visible image dimensions when available, device pixel ratio when available, and safe current-tab URL/title metadata. The extension does not inspect page DOM or read form field values.

After upload succeeds, the extension creates a linked capture event:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/events
```

with:

```text
Authorization: Bearer <session_token>
x-ossie-client: extension
```

The event uses `event_type: "capture"`, links to the uploaded screenshot asset, and uses the next locally stored event index for the active capture session. The extension sends `input_value_redacted: true` and does not send raw input fields. Screenshot pixel dimensions remain on the asset record; the event does not pretend those pixels are CSS viewport dimensions.

Each manual screenshot creates one ordered capture event. In the current MVP, treat one automatic click or one manual screenshot as the source for one guide step.

The latest manual screenshot outcome is stored separately from automatic capture diagnostics and shown when the popup is opened during an active capture. Screenshot capture, upload, and event-recording failures are shown as retryable popup errors while preserving active capture state and event ordering. Manual diagnostics store only status, optional message, optional event index, and timestamp.

## Open Active Capture

Opening an active capture in the portal uses:

```text
{portal_url_or_instance_url}/projects/:project_id/versions/:owning_version_slug/capture-sessions/:capture_session_id
```

This action uses the active Capture Session's immutable owning Project Version,
recovered authoritatively from the API when the popup is reopened. It does not
follow a later Default change, does not complete the backend Capture Session,
and does not clear local active Capture state. Missing, unauthorized, or
archived ownership blocks mutations rather than silently switching Versions.

## Capture Finish

Finishing an active capture session calls:

```text
POST {instance_url}/api/v1/projects/:project_id/capture-sessions/:capture_session_id/complete
```

with:

```text
Authorization: Bearer <session_token>
x-ossie-client: extension
```

After backend completion succeeds, the extension clears only the local active capture fields and preserves the selected project. It then opens the portal capture session detail page on the configured portal URL when present, using the backend's relative redirect path when safe, or a locally constructed project/capture-session route as fallback. Session tokens are never included in the portal URL.

## Permissions

The extension currently requests:

- `storage` for instance, session, selected project, active capture state, and the latest automatic capture diagnostic
- `tabs` for active tab URL/title metadata and opening the portal capture detail page after finishing
- `activeTab` for user-invoked extension action compatibility around visible-tab screenshot capture
- `host_permissions` for `<all_urls>` because Chrome requires persistent all-URLs host access for `chrome.tabs.captureVisibleTab` when automatic capture runs from the background worker outside a fresh extension-action invocation

Content script injection is still scoped to `http://*/*` and `https://*/*` pages. The broader host permission is for visible-tab screenshot capture, not for collecting DOM HTML or raw input values.

It does not request `scripting` and does not run on browser-restricted pages such as `chrome://` URLs.
