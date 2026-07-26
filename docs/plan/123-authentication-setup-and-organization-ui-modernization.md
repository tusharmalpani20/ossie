# Child Plan 123: Authentication, Setup, And Organization UI Modernization

Date reserved: 2026-07-12

Date expanded: 2026-07-26

Status: Expanded and rechecked. Implementation is blocked until child `122` is
actually implemented, accepted, and closed.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Preceding plan:

- `docs/plan/122-portal-architecture-and-application-shell.md`

Starting baseline for this expansion:

- Starting commit: `9a6b6d6`.
- Worktree ownership: clean at expansion time.
- Actual child `122` result: not implemented. The repository contains an
  expanded `122` plan only. No reusable `PortalAppShell`,
  `portalRouteMetadata`, `portalNavigation`, or `docs/ui/122-portal-shell-baseline.md`
  exists yet.
- Master plan `005` still records children `121`, `122`, and `123` as not
  closed.
- `PRODUCT.md` and `DESIGN.md` exist from child `121`, but earlier closeout
  notes say explicit acceptance is still required before broad UI modernization.

## Sequence Gate

Prerequisite:

- Child `121` must be accepted and closed.
- Child `122` must be implemented, accepted, closed, and recorded in master plan
  `005`.
- The reusable shell from child `122` must exist before this child replaces
  local auth/setup/organization shells.

Next child:

- `124` Project, Version, And Library UI Modernization, only after setup,
  login, logout, invite, organization-management, responsive, accessibility, and
  browser journeys pass.

This child is allowed to be planned before child `122` closes. It must not be
implemented until the sequence gate above is satisfied.

## Goal

Modernize the entry, identity, setup, and organization-management workflows on
the accepted shell and design foundation.

The result should make first-run setup, sign-in, sign-out, expired-session
recovery, organization members, and organization invite acceptance clear,
keyboard-operable, responsive, and safe without changing authentication,
organization role, invite, or tenant semantics.

## Current Runtime Facts

The implementation must start from these observed facts:

- `apps/web` is a React/Vite app with custom routing in
  `apps/web/src/lib/routes.ts` and route selection in `apps/web/src/App.tsx`.
- `apps/web/src/App.tsx` renders `/login`, `/setup`, `/invites/:token`,
  organization member routes, setup-gated authenticated routes, public routes,
  and the dev-only design-system route.
- `apps/web/src/App.test.tsx` is already over the 1000-line limit. Do not add
  new tests there unless a behavior-preserving split happens first.
- `apps/web/src/lib/api.ts` and `apps/web/src/lib/api.test.ts` are already over
  the 1000-line limit. This child should not add API helpers there unless a
  behavior-preserving split happens first.
- Current login UI is `apps/web/src/features/auth/LoginPage.tsx`.
- Current first-run setup UI is
  `apps/web/src/features/setup/FirstRunSetupPage.tsx`.
- Current organization member/invite management UI is
  `apps/web/src/features/organization/OrganizationMembersPage.tsx`.
- Current invite acceptance UI is
  `apps/web/src/features/organization/InviteAcceptPage.tsx`.
- Current auth/setup/invite pages use their own local brand/topbar/shell
  wrappers, not a shared Portal App shell.
- `OrganizationMembersPage` uses `PortalTopbar`, local page CSS, and page-local
  loading/error state.
- Current login tests cover fields, trimmed email, exact password preservation,
  safe `next` handling, invalid credentials, and generic errors.
- Current setup tests cover setup-required, setup-complete, hosted-signup
  unavailable state, field trimming, unsafe password message, and already-setup
  conflict.
- Current organization member tests cover member/invite list, create invite,
  copy invite link, required invite email, duplicate invite, revoke invite, and
  unauthenticated sign-in link.
- Current invite tests cover loading details, new-user accept, password
  requirement, existing-user sign-in prompt, current-session accept, and missing
  invite state.
- Auth responses and request schemas live in `packages/types/src/auth.ts`.
- Setup request/response schemas live in `packages/types/src/setup.ts`.
- Organization member/invite schemas live in `packages/types/src/organization.ts`.
- Public instance status schema lives in `packages/types/src/instance.ts`.
- Server routes already exist for login, logout, current session, first-run
  setup, public instance status, organization members, organization invites, and
  invite acceptance.
- Child `122` has not shipped. Any reference to `PortalAppShell` in this plan is
  a dependency on the future completed result of child `122`, not current code.

## Product And Design Rules

Use accepted source order:

1. `CONTEXT.md` and accepted ADRs for domain truth.
2. Master plan `005`.
3. Completed child `121` and child `122` closeouts once accepted.
4. `PRODUCT.md` and `DESIGN.md` only after accepted by the user.
5. Current code and tests for runtime facts.

Rules:

- Use `Web First-Run Setup`, `First-Run Setup`, `Deployment Mode`,
  `Organization`, `Organization Member`, `Owner`, `User`, `Org User`, and
  `Portal App` according to `CONTEXT.md`.
- Do not use “signup” for self-hosted First-Run Setup.
- Do not add hosted signup/billing.
- Do not change Organization roles or Project Membership semantics.
- Do not expose whether an email has an account except where the current invite
  contract already returns `requires_login`.
- Setup/login/invite screens must feel operational and quiet, not like marketing
  landing pages.
- Keep forms compact, labeled, keyboard-operable, and usable at narrow mobile
  width and 200% zoom.
- Use child `121` tokens and `@repo/ui` primitives where touching UI.
- Use the child `122` shell for authenticated organization-management surfaces
  after it exists.
- Login, setup, and invite acceptance must not be wrapped in the authenticated
  shell because they are entry/public flows.

## Exact Affected Files

Implementation is allowed to create or edit only these files unless the
pre-implementation recheck discovers directly related current-code drift and
records it in this plan before coding.

### Required plan and docs

- `docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during closeout, after this child passes and is accepted.
- `docs/ui/123-auth-setup-organization-browser-evidence.md` must be added for
  before/after browser evidence or honest blocked evidence.

### App route orchestration

- `apps/web/src/App.tsx`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- Child `122` route/shell helpers may be touched only if the completed `122`
  implementation requires small metadata updates for login/setup/invite/org
  route classification.

### Auth and setup UI

- `apps/web/src/features/auth/LoginPage.tsx`
- `apps/web/src/features/auth/LoginPage.module.css`
- `apps/web/src/features/auth/LoginPage.test.tsx`
- `apps/web/src/features/auth/navigation.ts`
- `apps/web/src/features/auth/types.ts`
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

These files are expected to exist after child `122`. Touch them only for small
auth/setup/organization integration points:

- `apps/web/src/features/portal/PortalAppShell.tsx`
- `apps/web/src/features/portal/PortalAppShell.module.css`
- `apps/web/src/features/portal/PortalAppShell.test.tsx`
- `apps/web/src/features/portal/PortalTopbar.tsx`
- `apps/web/src/features/portal/PortalTopbar.module.css`
- `apps/web/src/features/portal/PortalTopbar.test.tsx`
- any route metadata/navigation helper created by child `122`.

If these files do not exist, stop. That means child `122` is not complete.

### API client and shared types

Read-only unless the pre-implementation recheck proves a directly related
compatibility bug:

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `packages/types/src/auth.ts`
- `packages/types/src/setup.ts`
- `packages/types/src/organization.ts`
- `packages/types/src/instance.ts`

### Server/API read-only boundary

Do not edit server files in this child unless the pre-implementation recheck
finds an existing bug in a current contract and stops for scope confirmation:

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

Existing touched files that lack `@fileoverview` must receive one as part of the
same edit.

## Explicit Non-Scope

Do not implement any of the following in child `123`:

- Child `122` shell implementation. If shell files are missing, stop.
- Hosted signup, billing, plan selection, teams beyond one current Organization,
  OAuth, SSO, magic links, email delivery, password reset, MFA, remember-device,
  session-management UI, user profile settings, or account settings.
- New Organization roles or role semantics.
- Project, Project Version, capture, Guide, Interactive Demo, publication,
  activity, compliance, extension, Documentation, or Video workflow redesign.
- Server authentication protocol changes.
- Cookie, CORS, deployment-mode, environment-variable, database, migration,
  storage, audit/access, or public-link behavior changes.
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
- public Guide/Interactive Demo routes from child `122` unchanged.

Route behavior:

- `/login` renders login without authenticated shell.
- `/setup` renders First-Run Setup without authenticated shell.
- `/invites/:token` renders public invite acceptance without authenticated
  shell.
- `/organization/members` uses the authenticated Portal App shell from child
  `122` after it exists.
- Unauthenticated organization member access must link to
  `/login?next=%2Forganization%2Fmembers` or the current safe path.
- Unsafe `next` paths must still fall back to `/projects`.
- Setup-gated redirects from `App.tsx` must not loop between `/setup` and
  guarded routes.
- Public invite routes must not disclose token internals or private organization
  data beyond the public invite contract.

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

Rules:

- Keep `credentials: "include"` for authenticated web API requests.
- Preserve `VITE_OSSIE_API_URL` behavior.
- Preserve current error envelopes and `ApiClientError` mapping.
- Do not add caching for auth/session/org data.
- Do not persist auth, invite, or setup state in localStorage/sessionStorage.
- Do not log passwords, invite tokens, cookies, session IDs, or raw error bodies
  in UI or docs.

## Schemas And Types

No database schema, Zod API schema, shared DTO, OpenAPI contract, or domain
package type should change.

Allowed type work:

- Local React prop types.
- Local form-state types.
- Local display-state helpers for safe UI mapping.

Do not edit `packages/types/**` unless a focused recheck proves the current UI
and current server contract already disagree. If that happens, stop and record
the exact mismatch before changing shared types.

## Security, Permission, And Privacy Rules

This child touches sensitive entry flows. Preserve these rules:

- Organization tenant isolation remains server-owned.
- Only current authorized owners can manage organization invites according to
  existing server rules.
- Do not change Organization roles.
- Do not expose whether an arbitrary email has an account in login errors.
- Login invalid credentials must remain generic: “Email or password is
  incorrect.”
- Invite `requires_login` may drive existing-user invite UI because it is already
  part of the public invite contract.
- Expired, revoked, missing, and already-accepted invites must use safe
  unavailable messaging that does not expose token details.
- First-Run Setup must remain unavailable outside configured first-run setup
  mode and after setup is complete.
- Password values must never be trimmed for login; preserve exact user-entered
  password. First-Run Setup and invite password behavior must match current
  tested behavior unless a security bug is found and accepted.
- Duplicate submissions must be blocked while a form is submitting.
- Sign-out must call the existing logout endpoint and navigate only after
  success.
- Failed sign-out must remain visible and must not navigate away.
- Screenshots/evidence must use synthetic emails, organizations, and invite
  tokens only.

## Migration And Backwards Compatibility

Database migration:

- None.

Runtime compatibility:

- Existing login, setup, invite, organization member, and compliance URLs must
  keep resolving.
- Existing safe return-path behavior must remain.
- Existing public invite token URLs must remain compatible.
- Existing split API/web origin behavior must remain.
- Existing server validation remains authoritative.
- Existing smoke tests for first-run setup, invite creation, invite acceptance,
  and teammate project access must remain valid.

Styling compatibility:

- Adopt the child `122` shell only for authenticated organization-management
  surfaces.
- Login/setup/invite acceptance remain entry/public flows with a quiet
  brand-only shell.
- Use child `121` tokens where editing CSS.
- Do not restyle unrelated project/capture/guide/demo workflows.

Rollback:

- Rollback should be a normal source revert of UI, tests, and docs.
- No persistence rollback is required because no schema/data migration is
  allowed.

## Behavior Rules

### Login

- Email is trimmed before submit.
- Password is submitted exactly as typed.
- Submit button is disabled while submitting.
- Successful login navigates to `safeNextPath(nextPath, "/projects")`.
- Invalid credentials show the generic invalid-credentials message.
- Network/unknown failures show a generic sign-in failure.
- Do not add account-existence hints.
- Focus, labels, autocomplete, and keyboard submit must remain correct.

### First-Run Setup

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
- Do not call this “signup”.

### Organization members and invites

- Load members and pending invites together.
- Unauthenticated load links to sign in with the current safe path.
- Load failure offers retry.
- Invite email is trimmed and required.
- Role options must use existing `ORGANIZATION_ROLES`; do not invent roles.
- One-time invite URL is shown only after create response and should be copyable.
- Clipboard failure must be visible without losing the invite URL.
- Duplicate invite error maps to a safe user-facing duplicate message.
- Revoke invite disables only the affected invite row while in progress.
- Empty pending invites state remains visible.
- Permission denial must show a safe access-denied message if encountered; do
  not disguise it as a generic load failure after this modernization.

### Invite acceptance

- Load public invite by token.
- Loading, unavailable, and generic error states must be distinct.
- Expired, revoked, missing, and already-accepted invites show safe unavailable
  copy.
- New-user invite requires a password before submit.
- Existing-user invite shows sign-in link with `next=/invites/:token` and an
  “accept with current session” path.
- Accept success navigates to `/projects`.
- Accept failure for unauthenticated current session shows sign-in guidance.
- Do not expose raw token, server stack, or internal reason details.

### Shell and navigation

- Login/setup/invite acceptance do not use authenticated shell.
- Organization members use child `122` shell if available.
- Brand link points to `/projects`.
- No fake account settings, search, Documentation, or Video links.
- Mobile layout must not hide form submit, invite copy, or revoke actions.

## Implementation Order

Use TDD for source behavior changes.

1. Confirm gates and baseline.
   - Run `rtk git status --short`.
   - Record current `HEAD`.
   - Confirm children `121` and `122` are complete in master plan `005`.
   - Confirm child `122` shell files exist. If not, stop before coding.
   - Re-read this plan, child `122` closeout, master `005`, `CONTEXT.md`, ADRs
     `0015` through `0019`, `0023`, `0024`, `PRODUCT.md`, `DESIGN.md`, and
     current touched code.
2. Capture browser baseline.
   - Add `docs/ui/123-auth-setup-organization-browser-evidence.md`.
   - Record current safe baseline or exact blocked reason for login, setup,
     organization members, invite creation, invite acceptance, and sign-out.
3. Add/extend login tests first.
   - Cover safe `next`, duplicate submit prevention, generic errors, focus/labels
     where testable, and no account-existence leaks.
4. Modernize `LoginPage`.
   - Use tokens and entry-flow shell styling.
   - Do not use authenticated Portal App shell.
5. Add/extend First-Run Setup tests first.
   - Cover setup unavailable, complete, load failure, duplicate submit, unsafe
     password, already completed, and keyboard-visible labels.
6. Modernize `FirstRunSetupPage`.
   - Preserve server-authoritative validation and deployment-mode behavior.
7. Add/extend organization member/invite tests first.
   - Cover shell adoption, permission denial, retry, invite create/copy/revoke,
     duplicate invite, and unauthenticated sign-in path.
8. Modernize `OrganizationMembersPage`.
   - Use child `122` shell.
   - Preserve current invite and member behavior.
9. Add/extend invite acceptance tests first.
   - Cover expired/revoked/accepted/missing states, existing-user sign-in path,
     current-session accept unauthenticated error, new-user password validation,
     and duplicate submit prevention.
10. Modernize `InviteAcceptPage`.
    - Preserve public entry-flow shell, token handling, and safe error copy.
11. Recheck `App.tsx` route behavior.
    - Preserve login/setup/invite route order.
    - Preserve setup gate and safe redirect behavior.
    - Avoid adding tests to over-limit `App.test.tsx`; use smaller helpers if
      route behavior needs new tests.
12. Run focused verification.
13. Run broad verification.
14. Run agent-browser validation.
15. Update this plan with status, checklist, implementation log, verification
    notes, leftovers, and handoff.
16. Update master plan `005` only after acceptance passes.

## Test Plan

Focused web tests:

```bash
rtk pnpm --filter web test -- src/features/auth/LoginPage.test.tsx src/features/setup/FirstRunSetupPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx src/features/organization/InviteAcceptPage.test.tsx
rtk pnpm --filter web test -- src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx
rtk pnpm --filter web test -- src/lib/routes.test.ts src/appRouteGuards.test.ts
rtk pnpm --filter web check-types
```

Focused server/API contract tests if UI behavior depends on confirming current
contracts:

```bash
rtk pnpm --filter server test -- src/modules/authentication/session.routes.test.ts src/modules/setup/first-run-setup.routes.test.ts src/modules/organization/organization-invites.routes.test.ts src/modules/public-instance/public-instance.integration.test.ts
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
- Validate 200% zoom/reflow for forms and organization tables/lists.
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
- `/login?next=https://evil.example/path` unsafe return path fallback, using
  mocked or safe local validation where possible.
- `/setup` in setup-required, already-set-up, and unavailable modes where safe
  fixtures can produce them.
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

- Children `121` and `122` are accepted, closed, and recorded in master `005`.
- Login, First-Run Setup, organization member management, invite creation,
  invite revocation, invite acceptance, and logout behavior remain compatible.
- Login/setup/invite routes are not wrapped in authenticated shell.
- Organization members route uses the accepted child `122` shell.
- Sensitive errors do not disclose account existence, token details, cookies,
  session IDs, or private organization data.
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
- Master plan `005` is updated only after this child is accepted and closed.

## Critical Decision Triggers

Stop and ask before continuing if implementation requires any of these:

- implementing before child `122` is complete and accepted;
- changing auth protocol, cookies, CORS, session duration, password policy, or
  deployment/onboarding mode semantics;
- changing Organization roles, permissions, invite lifecycle, token format,
  invite URL shape, or acceptance rules;
- adding hosted signup, OAuth, SSO, password reset, MFA, billing, account
  settings, or profile settings;
- changing server API contracts, schemas, database migrations, or shared DTOs;
- adding a major dependency;
- exposing private data in docs/screenshots;
- adding fake navigation to unimplemented product areas;
- touching Project, Capture, Guide, Interactive Demo, extension, public-link, or
  Documentation behavior.

## Implementation Checklist

- [ ] Confirm children `121` and `122` are accepted/closed.
- [ ] Confirm child `122` shell files exist.
- [ ] Capture or honestly block browser baseline evidence.
- [ ] Add/extend login tests.
- [ ] Modernize login UI.
- [ ] Add/extend First-Run Setup tests.
- [ ] Modernize First-Run Setup UI.
- [ ] Add/extend organization member/invite tests.
- [ ] Modernize organization member/invite management UI on the child `122`
      shell.
- [ ] Add/extend invite acceptance tests.
- [ ] Modernize invite acceptance UI.
- [ ] Preserve route/API/security behavior.
- [ ] Run focused tests.
- [ ] Run broad checks.
- [ ] Run required agent-browser validation or record exact blocked evidence.
- [ ] Update implementation log, verification record, leftovers, and handoff.
- [ ] Update master plan `005` only after acceptance.

## Implementation Log

Not implemented.

Expansion log:

- Expanded on 2026-07-26 from starting commit `9a6b6d6`.
- Rechecked against master plan `005`, expanded child `122`, `CONTEXT.md`, ADRs
  `0015` through `0019`, `0023`, `0024`, `PRODUCT.md`, `DESIGN.md`, auth/setup
  and organization web UI, shared types, server route contracts, and development
  browser setup docs.
- Recorded that child `122` is not actually implemented yet; child `123`
  implementation must stop until child `122` closes.
- Rechecked again on 2026-07-26 before commit against current `HEAD` `9a6b6d6`.
  Repository evidence still shows no child `122` runtime implementation files or
  `docs/ui/122-portal-shell-baseline.md`; the master still records children
  `121`, `122`, and `123` as not closed. No runtime work is safe for child `123`
  until that gate is resolved.

## Verification Record

Planning verification only:

- `rtk pnpm exec prettier --check docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
  passed after expansion.
- `rtk git diff --check` passed after expansion.
- Plan length after current recheck: 710 lines.

Current recheck verification:

- `rtk pnpm exec prettier --write docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
  completed with no formatting changes.
- `rtk git diff --check` passed.

Runtime verification:

- Not run. No runtime implementation has happened in this expansion.

## Leftovers And Handoff

Current handoff:

- Do not implement child `123` until children `121` and `122` are accepted,
  closed, and recorded in master `005`.
- The first implementation action is to verify the child `122` shell exists and
  capture safe browser baselines for login, setup, organization members, invite
  creation, invite acceptance, and sign-out.
- Keep changes UI-focused. Server/API/schema changes are out of scope unless a
  current contract mismatch is proven and accepted.
- Carry into child `124`: project, Project Version, and library modernization.
  Do not fold those workflows into child `123`.
