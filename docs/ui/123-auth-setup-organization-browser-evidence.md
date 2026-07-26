# Child 123 Browser Evidence

Date: 2026-07-26

Commit under validation:

- `779c245 feat(web): modernize auth setup organization UI`

Environment:

- Built web preview: `http://localhost:3000`
- Browser tool: `agent-browser` with Chromium
- Data: safe synthetic local/mocked API responses only

## Evidence Summary

Passed with safe mocked browser responses:

- `/login` renders a brand-only public entry shell, not the authenticated portal
  shell.
- `/login?next=https://evil.example/path` navigates to `/projects` after mocked
  successful login, preserving unsafe-return fallback behavior.
- `/setup` renders Web First-Run Setup as a brand-only public entry flow with
  required fields.
- `/invites/plain-token` renders public invite acceptance with synthetic invite
  details, password field, and no portal navigation.
- `/organization/members` renders inside `PortalAppShell` with portal
  navigation, breadcrumbs, member list, invite form, empty pending-invites state,
  and no setup redirect when `setup_required=false`.
- Desktop and narrow mobile screenshots show no obvious clipping or overlap in
  the validated states.
- Browser page errors and console checks returned no findings in the checked
  sessions.

Blocked or limited:

- A real seeded local backend/session/invite fixture was not available in this
  implementation turn, so this is not full real authenticated end-to-end
  evidence.
- `agent-browser` URL-only network mocking could not independently return
  different bodies for `GET /api/v1/organization/invites` and
  `POST /api/v1/organization/invites` on the same URL. The create-invite success
  message was browser-observed, while invite URL/copy preservation is covered by
  focused React tests.
- The Vite preview server logged expected `ECONNREFUSED` proxy errors during
  early unmatched API attempts because no local API server was running. The
  final checked browser sessions used explicit mocked responses.
- 200% zoom/reflow and full keyboard traversal were covered by focused
  component tests and screenshot inspection only, not a complete real browser
  keyboard matrix.

## Screenshots

- `docs/ui/evidence/123/login-desktop.png`
- `docs/ui/evidence/123/login-mobile.png`
- `docs/ui/evidence/123/setup-desktop.png`
- `docs/ui/evidence/123/setup-mobile.png`
- `docs/ui/evidence/123/invite-desktop.png`
- `docs/ui/evidence/123/org-members-desktop.png`
- `docs/ui/evidence/123/org-members-mobile.png`

## Commands

Representative browser commands:

```bash
rtk pnpm --filter web build
rtk pnpm --filter web start -- --host 127.0.0.1 --port 3000
rtk agent-browser --session ossie-123-login open http://localhost:3000/login
rtk agent-browser --session ossie-123-setup open http://localhost:3000/setup
rtk agent-browser --session ossie-123b open http://localhost:3000/organization/members
rtk agent-browser --session ossie-123b errors
rtk agent-browser --session ossie-123b console
```

Focused automated coverage for behavior not fully proven by URL-only browser
mocks:

```bash
rtk pnpm --filter web test -- src/features/auth/EntryPageShell.test.tsx src/features/auth/LoginPage.test.tsx src/features/setup/FirstRunSetupPage.test.tsx src/features/organization/InviteAcceptPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx
```
