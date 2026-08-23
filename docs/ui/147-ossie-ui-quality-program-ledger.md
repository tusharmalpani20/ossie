# Plan 147 UI Quality Program Ledger

Status: `in_preflight`

Last reviewed: 2026-08-23

## Execution record

- Worktree: `/tmp/ossie-plan147-setup`
- Branch: `codex/setup-onboarding`
- Starting commit: `989051cb587f36e21e2fa21cc7eb5eec38f38b4f43`
- Starting worktree: clean
- Implementer: Codex, sole writer for this candidate cycle
- Tools: `rtk`, `pnpm`, Vitest, TypeScript, ESLint, Vite build
- Services: none started for this turn
- Fixtures: existing repository tests only; no customer data or credentials
- Browser visual verification: explicitly not run at the user's request; visual inspection is user-owned for this candidate

## Surface ledger

| Surface id              | Exact route | Role/access                                         | Current state                                                                           | Pattern                    | Status         |
| ----------------------- | ----------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------- | -------------- |
| `entry.setup.first-run` | `/setup`    | Public self-hosted first-run setup, unauthenticated | Ready, plus loading, submitting, complete, unavailable, error, validation, and conflict | Split first-run onboarding | `in_implementation` |

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
  brand panel, numbered setup guidance, Organization-first form hierarchy, an
  icon-only accessible password visibility control, a compact form column, and
  restrained supporting visual detail.

## Intended write set

- Plan 147 ledger and the remaining current-truth contributor-doc string.
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
| P1-001 | P1       | Documentation Publication preview route was parsed and setup-guarded without a render branch. | Rechecked on `989051c`: `apps/web/src/App.tsx` lazy-loads and renders `DocumentationPublicationPreviewPage`; focused route coverage is present from `fddbe55`. | Fixed before this candidate; no `/setup` change required. |
| P1-002 | P1       | Live CSS consumed undefined Ossie custom properties and used fragmented color authority. | Rechecked on `989051c`: `packages/ui/src/tokens.css` is imported by both `apps/web/src/index.css` and `apps/extension/src/index.css`; current Ossie consumers resolve against that source. | Fixed before this candidate; no `/setup` change required. |

## `/setup` candidate preflight

- User goal: initialize a self-hosted Ossie instance by creating its first
  Organization and Owner account.
- Primary action: `Complete setup`.
- Secondary actions: password visibility toggle and the Ossie home link.
- Exact route/state: `/setup`, public self-hosted `first_run_setup`,
  `setup_required: true`.
- Pattern: Split first-run onboarding. The pattern matches a one-time setup
  task because it separates factual deployment context from a focused form.
- Existing components: `OssieBrand`, `Input`, `Label`, `Button`, `Alert`, and
  Lucide `Eye`/`EyeOff`/`ShieldCheck`.
- Intended write set: `apps/web/src/features/setup/FirstRunSetupPage.tsx`,
  `FirstRunSetupPage.module.css`, focused tests, this ledger,
  `apps/docs/app/docs-content.ts`, and the Plan 147 implementation log.
- Behavior unchanged: Organization-first field order, setup guards, API
  payload, validation/error states, duplicate-submit protection, password
  visibility, and navigation to `/projects`.
- Explicit visual scope: narrow the form column, rebalance desktop spacing,
  add a meaningful Organization affordance, add a quiet completion arrow, and
  add restrained brand-panel texture using accepted tokens only.
- Narrow-screen composition: compact branded header, top-aligned white form,
  stacked fields, 20–24px horizontal padding, and 44px controls.
- Accessibility risks: icon-only controls must retain accessible names and
  focus visibility; the Organization affordance must remain decorative to
  assistive technology; labels and field order remain explicit.
- Performance/dependency declaration: existing CSS, Lucide, and shared UI only;
  no dependency or bundle change.
- Schema/API declaration: none.
- Browser evidence: user-owned; no visual test or screenshot capture will be
  run by this implementation cycle.

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
