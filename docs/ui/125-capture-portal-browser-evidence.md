# Child 125 Browser Evidence: Capture Portal UI

Date: 2026-07-29

Result: Passed against the disposable local testing environment.

## Environment

- PostgreSQL 18.4 with the configured `testing` and `testing_maintenance`
  profiles.
- Live server on `127.0.0.1:3002` and Vite web portal on
  `127.0.0.1:3000`.
- `agent-browser` 0.33.1 using headless Chromium 151.
- Safe synthetic fixture from
  `docs/plan/125-01-capture-portal-browser-fixture.md`.
- Separate authenticated Organization Owner/Project Admin and Viewer browser
  sessions, plus a clean signed-out session.

## Passed Workflows

- Default, named active, and archived Project Version Capture lists loaded with
  draft, capturing, completed, canceled, and archived states.
- The admin created a manual Capture Session, uploaded a valid PNG, retained
  selected files and fields across an injected upload failure, retried
  successfully, reordered Events, and edited safe Event metadata by keyboard.
- An empty draft moved from `Main` to `Summer release`; focused tests also prove
  `expected_version` is sent and a stale conflict reloads current data.
- Archived Project Version and Viewer routes remained read-only with mutation
  controls absent.
- Named-version Guide and Interactive Demo generation both landed on canonical
  slug routes. The audit fixed the Demo path that previously reused an API
  redirect containing a Project Version ID.
- Aborted asset-file requests did not break Capture detail or remove accessible
  asset metadata/actions.
- A clean signed-out session received a sign-in state, not a generic retry or
  authenticated shell controls.
- Desktop, 390 CSS-pixel mobile, and 720 CSS-pixel reflow layouts had no
  horizontal document overflow. The 720-pixel check represents a 1440-wide
  desktop viewport at 200% browser zoom.
- Reduced-motion preference was enabled during the responsive pass.
- Axe 4.12.1 reported zero violations and zero incomplete checks for admin
  detail, Viewer detail, and signed-out states after the closeout fixes.

## Failure And Recovery Evidence

The upload endpoint was aborted locally for one request. The page displayed
`Could not upload screenshot.`, kept the file and metadata, marked the queue
item failed, and succeeded after the route was restored and the same form was
retried. This was local failure injection against synthetic data; no production
service was changed.

The browser pass also exposed and verified fixes for:

- PostgreSQL 18 fixture parameter typing and role provisioning;
- invalid mnemonic fixture IDs rejected by fail-closed audit validation;
- concurrent authentication-session touches producing stale/equal audit
  transitions;
- named-version Demo redirects using an ID instead of the canonical slug;
- upload-region semantics, selected-file announcements, text contrast, and
  named-version landmark containment;
- unauthenticated Project Version boundaries showing a generic retry.

## Screenshots

- [Admin default Capture list](evidence/125/admin-main-capture-list-desktop.png)
- [Admin manual upload detail](evidence/125/admin-manual-upload-detail-desktop.png)
- [Injected upload failure before successful retry](evidence/125/admin-upload-failure-retry.png)
- [Archived Project Version read-only list](evidence/125/admin-archived-version-read-only.png)
- [Admin named-version detail](evidence/125/admin-named-version-detail-desktop.png)
- [Viewer read-only detail](evidence/125/viewer-detail-read-only.png)
- [Admin mobile Capture list](evidence/125/admin-capture-list-mobile.png)
- [Admin mobile selected-file queue](evidence/125/admin-detail-upload-queue-mobile.png)
- [Admin 200% equivalent reflow](evidence/125/admin-detail-200-percent-reflow.png)

All images contain only the safe synthetic fixture and were visually inspected
before closeout.

## Automated Corroboration

```bash
pnpm --filter web test -- ProjectVersionRouteBoundary.test.tsx PortalAppShell.test.tsx CaptureSessionDetailPage.test.tsx CaptureSessionDetailGeneration.test.tsx AppCaptureRoutes.test.tsx
pnpm -r --if-present test
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm --filter server test:setup
pnpm check-types
pnpm lint
pnpm build
git diff --check
```

`rtk` was unavailable in this environment, so the repository commands were run
directly with equivalent arguments.

## Carry Forward

Child `126` must keep the selected Project Version stable after Capture starts,
derive open-portal destinations from canonical loaded scope, preserve the same
privacy and immutable-source rules, and expose explicit recovery for signed-out,
stale, archived, deleted, or unauthorized selection state.
