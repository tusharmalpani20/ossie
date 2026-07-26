# Child Plan 123: Authentication, Setup, And Organization UI Modernization

Date reserved: 2026-07-12

Date expanded: 2026-07-26

Status: Complete after close-previous audit on 2026-07-26.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Preceding plan:

- `docs/plan/122-portal-architecture-and-application-shell.md`

Starting baseline for this expansion:

- Starting commit: `dfe7b73`.
- Worktree ownership: clean at expansion time.
- Child `121` is complete and recorded in master plan `005`.
- Child `122` is complete and recorded in master plan `005`.
- Child `122` added the shared `PortalAppShell`, route metadata helpers,
  portal navigation helpers, and shell browser evidence.
- Child `122` closeout fixed duplicate shell ownership for Project
  Version-owned list routes.
- Child `122` left full real authenticated browser workflow screenshots as a
  carryover because no seeded local backend/session was available.

## Sequence Gate

Prerequisites before implementation:

- Child `121` must remain closed in master plan `005`.
- Child `122` must remain closed in master plan `005`.
- The current worktree must be checked for other user/agent changes before
  coding.
- If child `122` shell files are missing or have been materially rewritten,
  recheck this plan before implementation.

Next child:

- `124` Project, Version, And Library UI Modernization, only after setup, login,
  logout, invite, organization-management, responsive, accessibility, and
  browser checks are complete or honestly blocked.

No user product decision is required for this child as written. Stop only if the
implementation needs to change auth, setup, invite, role, permission, tenant, or
API semantics.

## Goal

Modernize the entry, identity, setup, and organization-management workflows on
the completed design-system and Portal App shell foundation.

The result should make Web First-Run Setup, sign-in, sign-out, expired-session
recovery, Organization Members, and organization invite acceptance clear,
keyboard-operable, responsive, and safe without changing authentication,
organization role, invite, or tenant semantics.

## Current Runtime Facts

These facts were observed from the current code at expansion time:

- `apps/web` is a React/Vite app with custom route parsing in
  `apps/web/src/lib/routes.ts`.
- `apps/web/src/App.tsx` owns route selection, setup gating, public route
  branching, legacy Project redirects, and unsupported route fallback.
- `apps/web/src/App.tsx` is 768 lines. Keep it below the repository 1000-line
  limit.
- `apps/web/src/App.test.tsx` is already 1045 lines. Do not add tests there.
- `apps/web/src/lib/api.ts` is already 1627 lines and
  `apps/web/src/lib/api.test.ts` is already 2968 lines. Do not grow either file
  unless a behavior-preserving split happens first.
- `/login`, `/setup`, and `/invites/:token` render public entry flows without
  the authenticated `PortalAppShell`.
- `/organization/members` renders `OrganizationMembersPage` inside
  `PortalAppShell` with `activeSection="organization_members"` and
  `currentLabel="Organization members"`.
- `/organization/compliance` also uses the child `122` shell and must not be
  redesigned in this child.
- `App.tsx` checks `GET /api/v1/public/instance` before setup-gated private
  routes. It redirects to `/setup` when `setup_required` is true.
- `App.tsx` allows `/login` to render even when the setup-status background
  check fails.
- `App.tsx` shows a setup-status error page for private setup-gated routes when
  the public instance status check fails.
- `LoginPage` trims email, preserves password exactly, submits through
  `login`, and navigates to `safeNextPath(nextPath, "/projects")`.
- `safeNextPath` accepts only single-slash app paths and rejects empty,
  external, and protocol-relative values.
- `FirstRunSetupPage` loads public instance status before showing the setup
  form.
- `FirstRunSetupPage` shows unavailable state when
  `onboarding_mode !== "first_run_setup"`.
- `FirstRunSetupPage` shows already-set-up state when `setup_required` is
  false.
- `FirstRunSetupPage` trims owner email, organization name, and optional names;
  optional names submit as trimmed string or `null`.
- `InviteAcceptPage` loads public invite data by token and supports new-user,
  existing-user, and current-session acceptance paths.
- `InviteAcceptPage` encodes the invite token in the sign-in return path and
  treats missing, expired, revoked, and accepted invites as unavailable.
- `OrganizationMembersPage` loads members and pending invites together, creates
  one-time invite links, copies the returned `invite_url`, revokes pending
  invites, and links unauthenticated users to sign in with the current path.
- Current server invite-create duplicate errors use `duplicate_active_invite`,
  while the current web page checks the older `active_invite_exists` string.
  Child `123` should fix that UI compatibility gap without changing the server
  contract.
- Existing feature tests cover the important behavior for login, setup,
  organization member management, and invite acceptance. This child should
  extend those focused tests rather than adding to oversized app/API tests.
- Auth responses and request schemas live in `packages/types/src/auth.ts`.
- Setup request/response schemas live in `packages/types/src/setup.ts`.
- Organization member/invite schemas live in
  `packages/types/src/organization.ts`.
- Public instance status schema lives in `packages/types/src/instance.ts`.
- Server routes already exist for login, logout, current session, Web
  First-Run Setup, public instance status, Organization Members, organization
  invites, and invite acceptance.

## Product And Design Rules

Use accepted source order:

1. `CONTEXT.md` and accepted ADRs for domain truth.
2. Master plan `005`.
3. Completed children `121` and `122`.
4. Current code and tests for runtime facts.

Rules:

- Use `Web First-Run Setup`, `First-Run Setup`, `Deployment Mode`,
  `Organization`, `Organization Member`, `Owner`, `User`, `Org User`, and
  `Portal App` according to `CONTEXT.md`.
- Do not call self-hosted Web First-Run Setup “signup”.
- Do not add hosted signup or billing.
- Do not change Organization roles, Project Membership, or invite lifecycle
  meaning.
- Do not expose whether an arbitrary email has an account except where the
  current public invite contract already returns `requires_login`.
- Entry screens must feel operational and quiet, not like marketing pages.
- Keep forms compact, labeled, keyboard-operable, and usable at narrow mobile
  width and 200% zoom.
- Use child `121` CSS tokens and existing `@repo/ui` primitives where touching
  UI.
- Use the child `122` shell only for authenticated organization-management
  surfaces.
- Keep login, setup, and invite acceptance outside the authenticated shell.
- Keep motion minimal and respect reduced-motion behavior if motion is touched.

## Exact Affected Files

Implementation may create or edit only these files unless the
pre-implementation recheck discovers directly related current-code drift and
records it in this plan before coding.

### Required plan and docs

- `docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during closeout after this child passes.
- `docs/ui/123-auth-setup-organization-browser-evidence.md` must be added for
  browser evidence or exact blocked evidence.
- `docs/ui/evidence/123/**` may be added for safe screenshots.

### App route orchestration

- `apps/web/src/App.tsx`
- `apps/web/src/App.module.css`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`

Use these only for route ownership, setup-gate, public/private route
classification, and metadata gaps directly needed by this child. Do not add new
tests to `apps/web/src/App.test.tsx`.

### Auth and entry UI

- `apps/web/src/features/auth/LoginPage.tsx`
- `apps/web/src/features/auth/LoginPage.module.css`
- `apps/web/src/features/auth/LoginPage.test.tsx`
- `apps/web/src/features/auth/navigation.ts`
- `apps/web/src/features/auth/types.ts`
- `apps/web/src/features/auth/EntryPageShell.tsx` may be added if a shared
  public-entry wrapper keeps login/setup/invite code simpler.
- `apps/web/src/features/auth/EntryPageShell.module.css` may be added with
  `EntryPageShell.tsx`.
- `apps/web/src/features/auth/EntryPageShell.test.tsx` must be added if
  `EntryPageShell.tsx` is added.

### Setup UI

- `apps/web/src/features/setup/FirstRunSetupPage.tsx`
- `apps/web/src/features/setup/FirstRunSetupPage.module.css`
- `apps/web/src/features/setup/FirstRunSetupPage.test.tsx`
- `apps/web/src/features/setup/types.ts`

### Organization UI

- `apps/web/src/features/organization/OrganizationMembersPage.tsx`
- `apps/web/src/features/organization/OrganizationMembersPage.module.css`
- `apps/web/src/features/organization/OrganizationMembersPage.test.tsx`
- `apps/web/src/features/organization/InviteAcceptPage.tsx`
- `apps/web/src/features/organization/InviteAcceptPage.module.css`
- `apps/web/src/features/organization/InviteAcceptPage.test.tsx`
- `apps/web/src/features/organization/types.ts`

### Portal shell dependency

These files exist from child `122`. Touch them only for small
auth/organization integration points:

- `apps/web/src/features/portal/PortalAppShell.tsx`
- `apps/web/src/features/portal/PortalAppShell.module.css`
- `apps/web/src/features/portal/PortalAppShell.test.tsx`
- `apps/web/src/features/portal/PortalTopbar.tsx`
- `apps/web/src/features/portal/PortalTopbar.module.css`
- `apps/web/src/features/portal/PortalTopbar.test.tsx`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`

### API client and shared types

Read-only unless a focused recheck proves the current UI and current server
contract already disagree:

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `packages/types/src/auth.ts`
- `packages/types/src/setup.ts`
- `packages/types/src/organization.ts`
- `packages/types/src/instance.ts`

### Server/API boundary

Do not edit server files in this child unless a current contract mismatch is
proven and the scope is explicitly accepted:

- `apps/server/src/modules/authentication/**`
- `apps/server/src/modules/setup/**`
- `apps/server/src/modules/public-instance/**`
- `apps/server/src/modules/organization/**`
- `apps/server/src/config/**`
- `apps/server/src/db/**`

### Source comment requirement

Every new or touched source file in `apps/web/src` must include:

- a terse `@fileoverview` JSDoc comment at the top;
- terse comments for exported components, helpers, and functions.

Existing touched files that lack `@fileoverview` must receive one in the same
edit.

## Explicit Non-Scope

Do not implement any of the following in child `123`:

- Hosted signup, billing, plan selection, OAuth, SSO, magic links, email
  delivery, password reset, MFA, remember-device, session-management UI, user
  profile settings, or account settings.
- New Organization roles or role semantics.
- Project, Project Version, Capture, Guide, Interactive Demo, Publication,
  Activity, Compliance, extension, Documentation, or Video workflow redesign.
- Server authentication protocol changes.
- Cookie, CORS, deployment-mode, environment-variable, database, migration,
  storage, audit/access, public-link, or invite-token behavior changes.
- Changing invite token format, invite expiry duration, or invite URL shape.
- Changing login/setup/invite route shapes.
- Adding React Router, TanStack Query, Radix, Sonner, React Hook Form, or another
  major dependency.
- Dark mode.
- Marketing hero layouts, decorative gradients/orbs, fake account routes, fake
  search, or links to unimplemented behavior.

## Routes And API Contracts

### Web routes

No route shape should change.

Must preserve:

- `/login`
- `/login?next=<safe-path>`
- `/setup`
- `/organization/members`
- `/organization/compliance`
- `/invites/:token`
- `/projects`
- public Guide and Interactive Demo reader/embed routes from child `122`
  unchanged

Route behavior:

- `/login` renders login without authenticated shell.
- `/setup` renders Web First-Run Setup without authenticated shell.
- `/invites/:token` renders public invite acceptance without authenticated
  shell.
- `/organization/members` renders inside `PortalAppShell`.
- `/organization/compliance` remains owned by the existing compliance page and
  shell behavior from child `122`.
- Unauthenticated organization member access links to
  `/login?next=<safe-current-path>`.
- Unsafe `next` paths fall back to `/projects`.
- Setup-gated redirects from `App.tsx` must not loop between `/setup` and
  guarded routes.
- Public invite routes must not disclose token internals or private
  Organization data beyond the public invite contract.

### Existing API contracts

No server API contract should change.

Continue using:

- `GET /api/v1/public/instance`
- `POST /api/v1/setup/first-run`
- `GET /api/v1/authentication/me`
- `POST /api/v1/authentication/login`
- `POST /api/v1/authentication/logout`
- `GET /api/v1/organization/members`
- `GET /api/v1/organization/invites`
- `POST /api/v1/organization/invites`
- `DELETE /api/v1/organization/invites/:invite_id`
- `GET /api/v1/public/invites/:token`
- `POST /api/v1/public/invites/:token/accept`

Required request/response shapes:

- `PublicInstanceStatus`:
  - `deployment_mode: "self_hosted" | "hosted"`
  - `onboarding_mode: "first_run_setup" | "signup"`
  - `setup_required: boolean`
  - `signup_enabled: boolean`
- `FirstRunSetupRequest`:
  - `owner.email: string`
  - `owner.password: string`
  - `owner.first_name?: string | null`
  - `owner.last_name?: string | null`
  - `organization.name: string`
- `LoginRequest`:
  - `email: string`
  - `password: string`
- `AuthResponse`:
  - `auth.user`
  - `auth.organization`
  - `auth.org_user`
  - `auth.session`
- `CreateOrganizationInviteRequest`:
  - `email: string`
  - `role?: OrganizationRole`
- `OrganizationInviteCreateResponse`:
  - `invite`
  - `invite_token`
  - `invite_url`
- `PublicOrganizationInvite`:
  - `id`
  - `organization_name`
  - `email`
  - `role`
  - `status`
  - `expires_at`
  - `requires_login`
- `AcceptOrganizationInviteRequest`:
  - `password?: string`
  - `display_name?: string | null`

API rules:

- Keep `credentials: "include"` for web API requests.
- Preserve `VITE_OSSIE_API_URL` behavior.
- Preserve current `ApiClientError` mapping.
- Do not add caching for auth/session/org data.
- Do not persist auth, setup, or invite state in localStorage/sessionStorage.
- Do not log passwords, invite tokens, cookies, session IDs, or raw error bodies
  in UI, tests, docs, or screenshots.

## Schemas And Types

No database schema, Zod API schema, shared DTO, or domain package type should
change.

Allowed type work:

- Local React prop types.
- Local form-state types.
- Local display-state helpers for safe UI mapping.
- Local component types for an optional `EntryPageShell`.

Do not edit `packages/types/**` unless focused recheck proves the current UI and
current server contract already disagree. If that happens, stop and record the
exact mismatch before changing shared types.

## Security, Permission, And Privacy Rules

This child touches sensitive entry flows. Preserve these rules:

- Organization tenant isolation remains server-owned.
- The server remains authoritative for auth, session state, onboarding mode,
  setup availability, password safety, Organization role checks, and invite
  lifecycle.
- Only current Organization Owners may manage organization invites according to
  existing server rules.
- Do not change Organization roles.
- Do not expose whether an arbitrary email has an account in login errors.
- Login invalid credentials stay generic: “Email or password is incorrect.”
- Invite `requires_login` may drive existing-user invite UI because it is already
  part of the public invite contract.
- Expired, revoked, missing, and already-accepted invites use safe unavailable
  copy that does not expose token details.
- Web First-Run Setup remains unavailable outside configured first-run setup
  mode and after setup is complete.
- Password values must never be trimmed for login.
- First-Run Setup and invite password behavior must match current tested
  behavior unless a security bug is found and accepted.
- Duplicate submissions must be blocked while a form is submitting.
- Sign-out must call the existing logout endpoint and navigate only after
  success.
- Failed sign-out must remain visible and must not navigate away.
- Screenshots and evidence must use synthetic emails, organizations, invite
  tokens, and local URLs only.

## Migration And Backwards Compatibility

Database migration:

- None.

Runtime compatibility:

- Existing login, setup, invite, organization member, and compliance URLs keep
  resolving.
- Existing safe return-path behavior remains.
- Existing public invite token URLs remain compatible.
- Existing split API/web origin behavior remains.
- Existing server validation remains authoritative.
- Existing smoke tests for First-Run Setup, invite creation, invite acceptance,
  and teammate project access remain valid.

Styling compatibility:

- Use `PortalAppShell` only for authenticated organization-management surfaces.
- Login, setup, and invite acceptance remain entry/public flows with a quiet
  brand-only shell.
- Use child `121` tokens where editing CSS.
- Do not restyle unrelated project, capture, guide, or demo workflows.

Rollback:

- Rollback is a normal source revert of UI, tests, and docs.
- No persistence rollback is required because no schema/data migration is
  allowed.

## Behavior Rules

### Login

- Email is trimmed before submit.
- Password is submitted exactly as typed.
- Submit button is disabled while submitting.
- Successful login navigates to `safeNextPath(nextPath, "/projects")`.
- Invalid credentials show the generic invalid-credentials message.
- Network and unknown failures show generic sign-in failure.
- No account-existence hints.
- Labels, autocomplete, keyboard submit, visible focus, and responsive layout
  must remain correct.

### Web First-Run Setup

- Load public instance status before showing the form.
- `onboarding_mode !== "first_run_setup"` shows unavailable state.
- `setup_required === false` shows already-set-up state and a sign-in link.
- Setup-status load failure shows recoverable setup-unavailable state.
- Owner email and organization name are trimmed before submit.
- Optional first/last names submit as trimmed string or `null`.
- Submit button is disabled while submitting.
- Server unsafe-password message may be shown because it is validation feedback,
  not account disclosure.
- Already-completed conflict switches to already-set-up state.
- Do not call this flow “signup”.

### Organization members and invites

- Load members and pending invites together.
- Unauthenticated load links to sign in with the current safe path.
- Load failure offers retry.
- Permission denial shows safe owner-only access-denied copy if encountered.
- Invite email is trimmed and required.
- Role options use existing `ORGANIZATION_ROLES`; do not invent roles.
- One-time invite URL is shown only after the create response and remains
  visible after clipboard failure.
- Clipboard failure is visible without losing the invite URL.
- Duplicate invite errors from current `duplicate_active_invite` responses map
  to a safe user-facing duplicate message. Keep the older
  `active_invite_exists` mapping only as a backwards-compatible UI fallback if
  it already exists.
- Revoke invite disables only the affected invite row while in progress.
- Empty pending invites state remains visible.
- Mobile layout must not hide create, copy, or revoke actions.

### Invite acceptance

- Load public invite by token.
- Loading, unavailable, and generic error states stay distinct.
- Expired, revoked, missing, and already-accepted invites show safe unavailable
  copy.
- New-user invite requires a password before submit.
- Existing-user invite shows sign-in link with `next=/invites/:token` and an
  “accept with current session” path.
- Accept success navigates to `/projects`.
- Accept failure for unauthenticated current session shows sign-in guidance.
- Do not expose raw token, server stack, or internal reason details.

### Shell and navigation

- Login, setup, and invite acceptance do not use authenticated shell.
- Organization members use `PortalAppShell`.
- Brand links point to `/projects`.
- No fake account settings, search, Documentation, or Video links.
- Topbar sign-out behavior remains owned by the existing portal shell/topbar.

## Implementation Order

Use test-driven development for source behavior changes.

1. Confirm baseline.
   - Run `rtk git status --short`.
   - Record current `HEAD`.
   - Re-read this plan, child `122` closeout, master plan `005`, `CONTEXT.md`,
     ADRs `0017`, `0018`, and `0023`, and current touched code.
   - Confirm no other user/agent changes overlap this phase.
2. Capture or record baseline browser evidence.
   - Add `docs/ui/123-auth-setup-organization-browser-evidence.md`.
   - Use real local flows if backend/session fixtures are available.
   - If not available, record exact blocked reason and validate what can be
     safely validated with synthetic/mocked responses.
3. Add/extend login tests first.
   - Cover safe `next`, duplicate-submit prevention, generic errors, labels,
     and absence of account-existence leaks.
4. Modernize `LoginPage`.
   - Use tokens and entry-flow styling.
   - Do not use authenticated `PortalAppShell`.
5. Add/extend First-Run Setup tests first.
   - Cover unavailable, complete, load failure, duplicate submit, unsafe
     password, already-completed conflict, and visible labels.
6. Modernize `FirstRunSetupPage`.
   - Preserve server-authoritative validation and Deployment Mode behavior.
7. Add/extend organization member/invite tests first.
   - Cover shell use, unauthenticated sign-in path, permission denial, retry,
     invite create/copy/revoke, current `duplicate_active_invite` mapping,
     legacy `active_invite_exists` fallback if retained, empty invites, and
     clipboard failure.
8. Modernize `OrganizationMembersPage`.
   - Keep it inside child `122` shell.
   - Preserve current invite/member behavior.
9. Add/extend invite acceptance tests first.
   - Cover expired/revoked/accepted/missing states, existing-user sign-in path,
     current-session unauthenticated error, new-user password validation, and
     duplicate-submit prevention.
10. Modernize `InviteAcceptPage`.
    - Preserve public entry-flow shell, token handling, and safe error copy.
11. Recheck route behavior.
    - Preserve login/setup/invite route order.
    - Preserve setup gate and safe redirect behavior.
    - Avoid adding tests to over-limit `App.test.tsx`; move new route behavior
      into smaller helpers if needed.
12. Run focused verification.
13. Run broad verification.
14. Run agent-browser validation or record exact blocked evidence.
15. Update this plan with status, checklist, implementation log, verification
    notes, leftovers, and handoff.
16. Update master plan `005` only after this child passes.

## Test And Verification Plan

Focused web tests:

```bash
rtk pnpm --filter web test -- src/features/auth/LoginPage.test.tsx src/features/setup/FirstRunSetupPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx src/features/organization/InviteAcceptPage.test.tsx
rtk pnpm --filter web test -- src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx
rtk pnpm --filter web test -- src/lib/routes.test.ts src/lib/portalRouteMetadata.test.ts src/appRouteGuards.test.ts
rtk pnpm --filter web check-types
```

If `EntryPageShell` is added, include:

```bash
rtk pnpm --filter web test -- src/features/auth/EntryPageShell.test.tsx
```

Focused server/API contract tests only if UI behavior depends on confirming
current contracts:

```bash
rtk pnpm --filter server test -- src/modules/authentication/session.routes.test.ts src/modules/setup/first-run-setup.routes.test.ts src/modules/public-instance/public-instance.integration.test.ts src/modules/organization/organization-invites.routes.test.ts
```

Broad checks:

```bash
rtk pnpm --filter web test
rtk pnpm --filter web check-types
rtk pnpm --filter web lint
rtk pnpm --filter web build
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

DB/smoke checks:

- No DB changes are expected.
- Run smoke if browser validation uses a real seeded auth/setup/invite flow, or
  if any server/API file changes:

```bash
rtk pnpm --filter server test:smoke
```

Documentation checks:

```bash
rtk pnpm exec prettier --check docs/plan/123-authentication-setup-and-organization-ui-modernization.md docs/ui/123-auth-setup-organization-browser-evidence.md
```

## Agent-Browser Validation Requirements

Use `dogfood-ossie` procedure with `agent-browser` when available.

Required browser evidence:

- Use safe synthetic data only.
- Keep public invite acceptance and authenticated organization sessions
  separate where possible.
- Validate desktop and narrow mobile near `390x844`.
- Validate 200% zoom/reflow for forms and organization member/invite lists.
- Validate keyboard-only operation:
  - login email/password/submit;
  - setup fields/submit;
  - invite creation/copy/revoke;
  - invite acceptance new-user and existing-user flows;
  - sign-out.
- Validate visible focus.
- Validate console errors and failed network requests.
- Validate no private data appears in screenshots.

Minimum browser journeys:

- `/login` default sign-in form.
- `/login?next=/organization/members` safe return path.
- `/login?next=https://evil.example/path` unsafe return path fallback with safe
  local/mocked validation.
- `/setup` in setup-required, already-set-up, setup-status-load-failed, and
  unavailable modes where safe fixtures can produce them.
- `/organization/members` authenticated load, invite creation, invite copy,
  invite revoke, empty invites, and load retry/error where practical.
- `/organization/members` unauthenticated expired-session state.
- `/invites/:token` loading/details/new-user accept path.
- `/invites/:token` existing-user sign-in prompt and current-session accept path.
- `/invites/:token` expired/revoked/missing unavailable state.
- Sign-out from an authenticated shell surface.

If a seeded authenticated local runtime or invite fixture cannot be established,
record the exact blocked reason in
`docs/ui/123-auth-setup-organization-browser-evidence.md` and this plan. Do not
claim the browser matrix passed.

## Acceptance Criteria

This child can close only when all of the following are true:

- Login, Web First-Run Setup, organization member management, invite creation,
  invite revocation, invite acceptance, and logout behavior remain compatible.
- Login/setup/invite routes are not wrapped in authenticated shell.
- Organization members route uses the accepted child `122` shell.
- Sensitive errors do not disclose account existence, token details, cookies,
  session IDs, or private Organization data.
- Forms are keyboard and screen-reader operable at desktop, narrow mobile, and
  200% zoom/reflow.
- Duplicate submissions are blocked.
- Expired session and failed setup checks recover without redirect loops or lost
  safe return paths.
- Permission-denied organization invite/member states are safe and visible.
- No server/API/schema/migration/cookie/CORS/auth protocol changes were made
  without an explicit stop-and-accept decision.
- Focused tests and broad checks pass or pre-existing/environment failures are
  recorded with evidence.
- Required browser checks pass or are honestly blocked with exact reasons.
- `docs/ui/123-auth-setup-organization-browser-evidence.md` records browser
  evidence or blocked evidence.
- This plan has status, checklist, implementation log, verification notes,
  leftovers, and handoff updated.
- Master plan `005` is updated only after this child passes.

## Critical Decision Triggers

Stop and ask before continuing if implementation requires any of these:

- changing auth protocol, cookies, CORS, session duration, password policy, or
  Deployment Mode/onboarding semantics;
- changing Organization roles, permissions, invite lifecycle, token format,
  invite URL shape, or acceptance rules;
- adding hosted signup, OAuth, SSO, password reset, MFA, billing, account
  settings, or profile settings;
- changing server API contracts, schemas, database migrations, or shared DTOs;
- adding a major dependency;
- exposing private data in docs or screenshots;
- adding fake navigation to unimplemented product areas;
- touching Project, Project Version, Capture, Guide, Interactive Demo,
  extension, public-link, Documentation, or Video behavior.

## Implementation Checklist

- [x] Confirm current baseline and worktree ownership.
- [x] Capture or honestly block browser baseline evidence.
- [x] Add/extend login tests.
- [x] Modernize login UI.
- [x] Add/extend Web First-Run Setup tests.
- [x] Modernize Web First-Run Setup UI.
- [x] Add/extend organization member/invite tests.
- [x] Modernize organization member/invite management UI on the child `122`
      shell.
- [x] Add/extend invite acceptance tests.
- [x] Modernize invite acceptance UI.
- [x] Preserve route/API/security behavior.
- [x] Run focused tests.
- [x] Run broad checks.
- [x] Run required agent-browser validation or record exact blocked evidence.
- [x] Update implementation log, verification record, leftovers, and handoff.
- [x] Update master plan `005` only after implementation passes.

## Implementation Log

Implemented.

Implementation commit:

- `779c245 feat(web): modernize auth setup organization UI`

Runtime changes:

- Added shared public entry shell files:
  - `apps/web/src/features/auth/EntryPageShell.tsx`
  - `apps/web/src/features/auth/EntryPageShell.module.css`
  - `apps/web/src/features/auth/EntryPageShell.test.tsx`
- Moved login, Web First-Run Setup, and invite acceptance onto the shared
  brand-only entry shell without wrapping them in authenticated `PortalAppShell`.
- Preserved `OrganizationMembersPage` ownership by the child `122`
  `PortalAppShell`.
- Fixed organization duplicate-invite UI mapping for the current server
  `duplicate_active_invite` error while retaining the older
  `active_invite_exists` fallback.
- Added owner-only permission-denied UI for organization member/invite load
  failures.
- Added focused tests for duplicate submit blocking, clipboard failure preserving
  invite URL visibility, duplicate invite mapping, owner-only permission denial,
  and the public-entry shell.
- Added safe browser evidence in
  `docs/ui/123-auth-setup-organization-browser-evidence.md` and
  `docs/ui/evidence/123/`.
- Close-previous audit on 2026-07-26 found the implemented runtime work matched
  this plan and master plan `005`; no runtime changes were required.

Expansion log:

- Re-expanded on 2026-07-26 from starting commit `dfe7b73`.
- Rechecked against `CONTEXT.md`, ADRs `0017`, `0018`, and `0023`, master plan
  `005`, completed child `122`, current auth/setup/organization web UI,
  current route helpers, current API helpers, and shared types.
- Removed stale assumptions that child `122` was missing. Child `122` is now
  complete and provides `PortalAppShell`, `portalRouteMetadata`,
  `portalNavigation`, and `docs/ui/122-portal-shell-baseline.md`.
- Recorded the actual current contracts for public instance status, login,
  setup, organization invites, and public invite acceptance.
- Rechecked on 2026-07-26 against implemented child `122`, master plan `005`,
  current server invite permission behavior, and current web duplicate-invite
  handling. Tightened the plan to require Owner-only invite-management copy and
  current `duplicate_active_invite` UI handling.

## Verification Record

Planning verification only:

- `rtk git status --short` showed a clean worktree before editing.
- Current baseline commit: `dfe7b73`.
- `rtk pnpm exec prettier --check docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
  passed after expansion.
- `rtk rg` search found no remaining stale “child 122 missing” gate language.
- `rtk git diff --check` passed after expansion.
- Runtime verification was not run because this prompt is planning-only and
  explicitly says not to implement.

Implementation verification:

- `rtk pnpm --filter web test -- src/features/organization/OrganizationMembersPage.test.tsx`
  failed before implementation for current `duplicate_active_invite` handling
  and owner-only permission-denied copy, then passed after implementation.
- `rtk pnpm --filter web test -- src/features/auth/EntryPageShell.test.tsx`
  failed before implementation because the shared shell did not exist, then
  passed after implementation.
- `rtk pnpm --filter web test -- src/features/auth/EntryPageShell.test.tsx src/features/auth/LoginPage.test.tsx src/features/setup/FirstRunSetupPage.test.tsx src/features/organization/InviteAcceptPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx`
  passed: 5 files, 31 tests.
- `rtk pnpm --filter web test -- src/features/auth/EntryPageShell.test.tsx src/features/auth/LoginPage.test.tsx src/features/setup/FirstRunSetupPage.test.tsx src/features/organization/InviteAcceptPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx src/lib/routes.test.ts src/lib/portalRouteMetadata.test.ts src/appRouteGuards.test.ts`
  passed: 10 files, 62 tests.
- `rtk pnpm --filter web test` passed: 44 files, 290 tests.
- `rtk pnpm --filter web check-types` passed.
- `rtk pnpm --filter web lint` passed.
- `rtk pnpm --filter web build` passed.
- `rtk pnpm --filter server test -- src/modules/authentication/session.routes.test.ts src/modules/setup/first-run-setup.routes.test.ts src/modules/public-instance/public-instance.integration.test.ts src/modules/organization/organization-invites.routes.test.ts`
  passed: 4 files, 23 tests.
- `rtk pnpm check-types` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm -r --if-present test` passed across workspace packages, including
  `apps/server` non-DB tests and `apps/web`.
- `rtk git diff --check` passed before the source commit.
- `agent-browser` validated safe mocked login, setup, invite acceptance, and
  organization members routes in the built preview. Evidence and limitations are
  recorded in `docs/ui/123-auth-setup-organization-browser-evidence.md`.
- Close-previous audit on 2026-07-26 reran the focused child `123` and shell
  guard test set:
  `rtk pnpm --filter web test -- src/features/auth/EntryPageShell.test.tsx src/features/auth/LoginPage.test.tsx src/features/setup/FirstRunSetupPage.test.tsx src/features/organization/InviteAcceptPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx src/lib/routes.test.ts src/lib/portalRouteMetadata.test.ts src/appRouteGuards.test.ts`;
  passed: 10 files, 62 tests.
- Close-previous audit on 2026-07-26 reran
  `rtk pnpm --filter web check-types`; passed.
- Close-previous audit on 2026-07-26 reran `rtk git diff --check`; passed.

## Leftovers And Handoff

Implementation handoff:

- Full real authenticated backend/session/invite browser evidence remains a
  carryover because this implementation used safe local browser mocks rather
  than a seeded backend session.
- If a later operator has a seeded local backend, rerun the browser matrix
  without URL mocks and replace the blocked portions of
  `docs/ui/123-auth-setup-organization-browser-evidence.md`.
- Child `124` can assume login, setup, invite acceptance, and organization
  members now use the shared child `121`/`122` UI foundations while preserving
  route/API/auth semantics.
- Carry into child `124`: project, Project Version, and library UI
  modernization should reuse the established entry-shell contrast, portal shell,
  design primitives, duplicate-action protection, and honest browser-evidence
  pattern from child `123`. Do not fold Project, Project Version, or library
  work back into child `123`.
