# Plan 147 UI Quality Program Ledger

Status: `candidate_ready_for_human_inspection`

Last reviewed: 2026-08-23

## Execution record

- Worktree: `/home/tm/Desktop/work/ossie`
- Branch: `main`
- Starting commit: `ebc55ef13895a7068257459bb5843cbcd8e38ffe`
- Starting worktree: clean
- Implementer: Codex, sole writer for this candidate cycle
- Tools: `rtk`, `pnpm`, Vitest, TypeScript, ESLint, Vite build
- Services: none started for this turn
- Fixtures: existing repository tests only; no customer data or credentials
- Browser visual verification: explicitly not run at the user's request; visual inspection is user-owned for this candidate

## Surface ledger

| Surface id              | Exact route | Role/access                                         | Current state                                                                           | Pattern                    | Status         |
| ----------------------- | ----------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------- | -------------- |
| `entry.setup.first-run` | `/setup`    | Public self-hosted first-run setup, unauthenticated | Ready, plus loading, submitting, complete, unavailable, error, validation, and conflict | Split first-run onboarding | `candidate_ready_for_human_inspection` |

Normal entry points are direct `/setup` navigation and setup guards from login
or setup-protected portal routes. The current request changes field order and
presentation only; deployment guards, API contracts, authorization, and setup
completion behavior remain out of scope.

## Current implementation graph

- Route registry: `apps/web/src/lib/routes.ts`, `apps/web/src/App.tsx`
- Page: `apps/web/src/features/setup/FirstRunSetupPage.tsx`
- Page styles: `apps/web/src/features/setup/FirstRunSetupPage.module.css`
- Entry shell: `apps/web/src/features/auth/EntryPageShell.tsx` and its CSS
- Shared primitives: `packages/ui/src/{button,input,label,card,alert}.tsx`
- Runtime token consumers: `apps/web/src/index.css` and
  `apps/extension/src/index.css`
- Focused behavior tests: `apps/web/src/features/setup/FirstRunSetupPage.test.tsx`,
  `apps/web/src/features/auth/EntryPageShell.test.tsx`, and `apps/web/src/App.test.tsx`
- Candidate direction: user-selected Option 1 split setup, with a narrower
  brand panel, numbered setup guidance, Organization-first form hierarchy, and
  an icon-only accessible password visibility control.

## Intended write set

- Plan 147 ledger and current-truth contributor-doc string.
- Shared semantic runtime tokens and the affected shared primitive state
  contracts.
- The missing Documentation Publication preview route/render contract required
  by Plan 147 preflight.
- `/setup` page markup, styles, and focused tests.
- No approved screenshot baseline updates and no unrelated surface redesign.

## Explicitly out of scope

- Login and invitation visual redesign.
- Authenticated portal, Documentation, extension, or other page redesign.
- Product semantics, setup API/schema/migration changes, permissions, tenant
  boundaries, or deployment/onboarding guards.
- New dependencies, browser automation, screenshots, image diffs, or visual
  test execution in this turn.

## Evidence classification

- Existing screenshots and reports under `docs/ui/` predate Plan 147 and remain
  functional or historical-only evidence unless individually approved in this
  ledger.
- `docs/ui/evidence/123/setup-desktop.png` and `setup-mobile.png`: functional
  evidence for the previous setup workflow, not a visual reference.
- User-supplied `/tmp/codex-clipboard-tH3biK.png`: current known-problem evidence
  for review only; not copied into the repository and not an approved reference.
- User-supplied Option 1 images `/tmp/codex-clipboard-x3kXOT.png` and
  `/tmp/codex-clipboard-kZX9jP.png`: visual direction for this candidate only;
  not copied into the repository and not approved baselines.
- Candidate screenshots: not captured in this turn because browser visual
  verification was explicitly deferred to the user.

## Findings rechecked

| ID     | Severity | Finding                                                                                                                 | Current evidence                                                                                                                                                              | Disposition                    |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| P1-001 | P1       | Documentation Publication preview route is parsed and setup-guarded but has no render branch in `apps/web/src/App.tsx`. | Current route and App inspection on `ebc55ef`; focused failing coverage will be added before repair.                                                                          | In scope for preflight repair. |
| P1-002 | P1       | Live CSS consumes undefined Ossie custom properties and portal/extension still duplicate the old blue token set.        | Current consumer scan found `--ossie-space-*`, `--ossie-radius-*`, `--ossie-color-*`, `--ossie-font-size-xs`, and `--color-*` consumers without one shared runtime authority. | In scope for preflight repair. |

## Surface acceptance checkpoint

- Focused tests: setup, App route, Publication preview, shared primitive, and
  the isolated unrelated DocumentationPortabilityPanel test pass. The serial
  workspace suite had one unrelated timing-sensitive failure in that panel
  while the publication list was still settling; the isolated rerun passed.
- Non-visual engineering checks: type checks, lint, build, CSS-token check, and
  `git diff --check` pass.
- Browser/visual verification: blocked by explicit user instruction
- Independent Reviewer A: unavailable until an immutable candidate and review
  capability are available
- Independent Reviewer B: unavailable until an immutable candidate and review
  capability are available
- Human visual inspection: pending user review

## Candidate evidence bundle

- Route/state: `/setup`, self-hosted `first_run_setup`, `setup_required: true`.
- Synthetic fixture: existing deterministic test fixtures only; no browser
  session, customer data, credentials, or captured private material.
- Candidate behavior: Organization name, first name, last name, owner email,
  and password in that DOM order; password visibility uses an accessible icon
  button; setup submission still calls the existing API and navigates to
  `/projects` on success.
- Visual before/evidence classification: known-problem and user direction;
  no candidate screenshot captured.
- Visual browser results: intentionally not collected; 1440, 1024, 390, and
  200% zoom inspection remain for the user.
