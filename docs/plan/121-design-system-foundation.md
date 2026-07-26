# Child Plan 121: Design-System Foundation

Date reserved: 2026-07-12

Date expanded: 2026-07-26

Status: Implemented pending explicit user acceptance. Source implementation,
product/design docs, dev-only review-route browser evidence, and broad
verification are complete. Full authenticated workflow screenshot baselines are
recorded as a child `122` carryover because no seeded authenticated local
runtime was established during this closeout pass. Child closeout and master
checklist update remain blocked until the user accepts `PRODUCT.md`,
`DESIGN.md`, and the representative UI directions.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Starting baseline for this expansion:

- Starting commit: `765fa0d`.
- Worktree ownership: clean at expansion time; no uncommitted user or agent work
  was present.
- Predecessor gate: child `120` is complete and the master records children
  `109` through `120` as complete.
- `PRODUCT.md` and `DESIGN.md` do not exist yet. They are outputs of this child.
- Current UI stack already uses Tailwind CSS 4 in `apps/web` and
  `apps/extension`, Lucide in web/shared UI, and CVA/class utilities in
  `packages/ui`.
- Child `109` installed reviewed external design guidance as optional
  repository tooling. It is supporting input only; it must not become an
  application dependency or runtime prerequisite.

## Sequence Gate

Prerequisite:

- Completed child `120`, stable product/naming truth from child `110`, and the
  current workflow baselines required by the master.

Next child:

- `122` Portal Architecture And Application Shell, only after explicit user
  acceptance of `PRODUCT.md`, `DESIGN.md`, and representative library,
  authoring-workbench, and reader/viewer UI directions.

This child can be implemented without more user input until the acceptance gate
at the end. Stop earlier only for a critical decision listed in this plan or in
`AGENTS.md`.

## Goal

Establish the product brief, design principles, tokens, accessible primitive
rules, motion rules, baseline evidence, and representative UI direction required
for the `122` through `130` UI modernization sequence.

The output must make later UI work mostly compositional. Later children should
not need to invent one-off colors, spacing, surfaces, controls, loading states,
or layout rules screen by screen.

## Current Runtime Facts

The implementation must start from these observed facts:

- `apps/web` is a React/Vite portal and public reader/viewer app. It uses a
  custom pathname parser in `apps/web/src/lib/routes.ts` and route selection in
  `apps/web/src/App.tsx`.
- `apps/extension` is a React/Vite Manifest V3 popup. Its main UI lives in
  `apps/extension/src/App.tsx` with global popup styles in
  `apps/extension/src/index.css`.
- `packages/ui` exports source files by subpath through `"./*": "./src/*.tsx"`.
  New shared UI modules must therefore be `.tsx` files unless the package export
  map is deliberately changed.
- Existing shared primitives are:
  - `packages/ui/src/alert.tsx`
  - `packages/ui/src/badge.tsx`
  - `packages/ui/src/button.tsx`
  - `packages/ui/src/card.tsx`
  - `packages/ui/src/code.tsx`
  - `packages/ui/src/input.tsx`
  - `packages/ui/src/label.tsx`
  - `packages/ui/src/select.tsx`
  - `packages/ui/src/separator.tsx`
  - `packages/ui/src/textarea.tsx`
  - `packages/ui/src/utils.ts`
- Existing web screens still use many CSS modules, hard-coded slate/hex values,
  repeated control styling, and page-local state.
- Existing files already over the repository 1000-line rule include:
  - `apps/web/src/features/guide/GuideEditorPage.tsx`
  - `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
  - `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
  - `apps/extension/src/App.tsx`
- Do not add code to those over-limit files. If a later implementation step must
  touch one, split the needed change into a smaller helper/module first.
- Current migrations end at
  `apps/server/src/db/migrations/024_revision_backed_publication_and_publish_link_manifests.sql`.
  This child should not add a migration.
- `docs/agent-workflow.md` records reviewed external skill provenance and must
  be consulted before using Impeccable or any other external design guidance.

## Exact Affected Files

The implementation is allowed to create or edit only these files unless the
recheck finds a directly related current-code drift and records it before
implementation.

### Required new documentation

- `PRODUCT.md`
- `DESIGN.md`
- `docs/ui/121-current-ui-inventory.md`
- `docs/ui/121-browser-baseline.md`
- `docs/ui/121-representative-directions.md`
- `docs/agent-workflow.md` is read-only input for this child unless external
  guidance provenance or usage instructions have drifted. Do not edit it for
  normal design output.

### Required plan and closeout records

- `docs/plan/121-design-system-foundation.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during closeout, after this child passes and is accepted.

### Shared UI foundation

- `packages/ui/src/alert.tsx`
- `packages/ui/src/badge.tsx`
- `packages/ui/src/button.tsx`
- `packages/ui/src/card.tsx`
- `packages/ui/src/code.tsx`
- `packages/ui/src/input.tsx`
- `packages/ui/src/label.tsx`
- `packages/ui/src/select.tsx`
- `packages/ui/src/separator.tsx`
- `packages/ui/src/textarea.tsx`
- `packages/ui/src/utils.ts`
- `packages/ui/src/tokens.tsx` must be added for source-owned token names and
  documentation-friendly constants.
- `packages/ui/src/surface.tsx` may be added for repeated non-card layout
  surfaces if the tests prove real repetition.
- `packages/ui/src/primitive-contracts.tsx` may be added for small documented
  wrappers or types used by the dev-only review surface. Do not use it as a
  placeholder dumping ground.
- `packages/ui/src/button.test.tsx`
- `packages/ui/src/primitives.test.tsx`
- `packages/ui/src/tokens.test.tsx` must be added if `tokens.tsx` is added.

### Web token application and dev-only review surface

- `apps/web/src/index.css`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/features/design-system/DesignSystemReviewPage.tsx` must be
  added.
- `apps/web/src/features/design-system/DesignSystemReviewPage.module.css` must
  be added only if local CSS is smaller and clearer than Tailwind classes for
  the preview surface.
- `apps/web/src/features/design-system/DesignSystemReviewPage.test.tsx` must be
  added.

### Extension token application

- `apps/extension/src/index.css`
- `apps/extension/src/App.test.tsx`

Only touch `apps/extension/src/App.tsx` if a behavior-preserving extraction is
needed first to respect the 1000-line rule. Do not add more UI code directly to
that file.

### Source comment requirement

Every new or touched source file in `packages/ui`, `apps/web/src`, and
`apps/extension/src` must include terse JSDoc comments following the repository
rules:

- a `@fileoverview` comment at the top of the file;
- short component/function comments for exported functions, components, helpers,
  and token groups;
- no long explanatory comments that duplicate `PRODUCT.md` or `DESIGN.md`.

### Browser evidence and generated assets

- Screenshots must not be committed unless the implementation plan records why a
  stable synthetic screenshot is useful. Prefer documenting temporary screenshot
  paths in `docs/ui/121-browser-baseline.md`.
- If committed evidence becomes necessary, store only safe synthetic artifacts
  under `docs/ui/evidence/121/`.

## Explicit Non-Scope

Do not implement any of the following in child `121`:

- Broad portal shell redesign. That belongs to child `122`.
- Authentication, setup, organization, project, capture, extension, Guide, or
  Interactive Demo workflow modernization. Those belong to children `123`
  through `128`.
- Documentation artifact modeling or UI. That begins only after child `131`.
- Video, recording library, transcript, comments, search, analytics, approvals,
  or notification features.
- Runtime server API behavior changes.
- Database schema changes, migrations, seed changes, or data backfills.
- Permission, tenant isolation, public-link, protected-asset, Publication,
  Revision, Edition, Project Version, Audit, or Access semantics changes.
- Product technical identifier renames, package renames, environment-variable
  prefix changes, cookie changes, route prefix changes, storage changes, or
  persistent identifier changes.
- Dark mode, unless the user explicitly accepts complete dark-mode scope before
  implementation.
- A bulk component library install. A headless primitive dependency may be
  proposed only if a specific missing behavior cannot be implemented safely with
  current dependencies.
- Decorative gradient/orb backgrounds, marketing hero layouts, nested-card
  page composition, or every-section-as-card composition.

## Product And Design Rules

Before drafting product/design output, inspect `docs/agent-workflow.md` and run
or apply the reviewed Impeccable initialization/documentation workflow only to
the extent it is already accepted by child `109`.

Rules for external design guidance:

- keep optional hooks disabled unless child `109` separately accepted them;
- do not persist new external-tool state unless this plan is updated with the
  exact files and reason before implementation;
- do not let external guidance override `AGENTS.md`, `CONTEXT.md`, accepted ADRs,
  or master plan `005`;
- do not let external guidance create runtime dependencies.

`PRODUCT.md` must be concise and design-facing. It must:

- describe Ossie as the accepted product display name;
- explain that Ossie is a project-organized internal product knowledge platform;
- link back to `CONTEXT.md`, ADRs, and master plan `005` for domain truth;
- clearly separate available behavior from direction and deferred behavior;
- avoid claiming Documentation or Video behavior exists today;
- avoid using `version` without a qualifier;
- preserve the accepted language: Organization, Project, Project Version,
  Capture, Artifact, Guide, Interactive Demo, Artifact Edition, Working Draft,
  Revision, Publication, Publish Link, Publication Sequence, Row Version.

`DESIGN.md` must become the source of truth for product UI design. It must
define:

- the Quiet Versioned Workbench pattern;
- the five surface archetypes:
  - library/operations;
  - authoring workbench;
  - reader/viewer;
  - settings/admin;
  - activity/compliance;
- semantic color roles for background, surface, elevated surface, border,
  strong border, text, muted text, accent, success, warning, danger, focus,
  overlay, selected, disabled, and code;
- typography roles for dense operational software;
- spacing, radius, shadow, focus, toolbar, navigation, editor rail, media,
  thumbnail, form, table/list, dialog/popover, toast, and canvas dimensions;
- icon usage rules for Lucide, including accessible names/tooltips for icon-only
  controls;
- component and state rules for loading, empty, error, disabled, read-only,
  archived, permission denied, destructive confirmation, password/restricted
  public access, and failed media;
- motion tokens and reduced-motion behavior;
- responsive behavior for wide desktop, standard laptop, narrow mobile, and
  200% zoom/reflow;
- performance budgets for bundle impact, navigation, editor interaction, image
  loading, and layout shift;
- migration rules so old CSS modules and new tokens do not become a permanent
  uncontrolled dual system.

## Routes And API Contracts

### Web routes

The only route change allowed in this child is a development-only review route:

```text
/__design-system
```

Rules:

- The route must render only when `import.meta.env.DEV` is true.
- The route parser may recognize the path as `design_system_review`, but
  `apps/web/src/App.tsx` must treat that route as unsupported unless
  `import.meta.env.DEV` is true.
- Production builds must not include a reachable design review surface. If the
  component remains in the production bundle because of simple static imports,
  that is acceptable only when there is no reachable production route and the
  bundle impact is measured in this child's performance notes.
- The route must use synthetic local state only. It must not call private APIs,
  read real user/project data, or require authentication.
- The route must render representative, behaviorally real examples for:
  - one library/operations surface;
  - one authoring workbench surface;
  - one reader/viewer surface.
- The examples must include realistic loading, empty, error, disabled,
  permission/read-only, long-name, dense-data, and reduced-motion states where
  applicable.
- The examples must not add navigation to unimplemented features.

Required local route type changes:

- Add a `design_system_review` route type in `apps/web/src/lib/routes.ts`.
- Update route tests in `apps/web/src/lib/routes.test.ts`.
- Render the page from `apps/web/src/App.tsx` only behind the dev guard.
- Add app-level tests proving the route renders in dev mode and falls through to
  unsupported behavior when `import.meta.env.DEV` is false. If the current test
  setup cannot simulate `import.meta.env.DEV`, extract a small pure helper such
  as `shouldRenderDesignSystemReview(route, isDev)` and test that helper plus
  the page component directly.

### Server/API contracts

No server route, request, response, authorization, audit, access, or persistence
contract should change in this child.

Existing APIs may be exercised by browser baseline validation only. Do not edit:

- `apps/server/src/app.ts`
- `apps/server/src/modules/**`
- `apps/server/src/db/**`
- `packages/types/**`
- `packages/*-domain/**`

If implementation discovers a required server/API change, stop and report the
exact need. That would be outside the accepted child `121` boundary.

## Schemas And Types

No database schema, Zod API schema, shared DTO, or domain package type should be
added or changed.

Allowed type work:

- Local React prop types for the design-system review page.
- Token name/value types in `packages/ui/src/tokens.tsx`.
- Local route union update in `apps/web/src/lib/routes.ts`.

Shared-package reuse gate:

- Keep design tokens in `packages/ui` only when they are actually reused by web,
  extension, docs, or future app surfaces.
- Do not move app-local page state or API DTOs into `packages/ui`.
- Do not put domain terms into `packages/ui` unless they are UI labels or
  examples. Domain truth remains in `CONTEXT.md` and ADRs.

## Security, Permission, And Privacy Rules

This child is mostly UI and documentation, but it must preserve all existing
security boundaries:

- Do not weaken Organization tenant isolation.
- Do not weaken Project Membership rules.
- Do not change Project Version inheritance of Project access.
- Do not change public Publish Link access, password, restricted, expiry,
  revoked, version-specific, or embed behavior.
- Do not expose storage keys, private URLs, actor IDs, cookies, tokens,
  credentials, source metadata, or non-included Publications in screenshots,
  docs, review pages, or tests.
- Use only synthetic fixture names and images for browser evidence.
- The dev-only review route must not read real session state or become a hidden
  admin/debug surface.
- Accessibility fixes may add labels, roles, focus styles, and disabled/read-only
  affordances, but must not grant actions to unauthorized users.

## Migration And Backwards Compatibility

Database migration:

- None.

Runtime compatibility:

- Existing URLs must keep resolving the same way.
- Existing public reader/viewer behavior must remain unchanged.
- Existing portal workflow behavior must remain unchanged, except for CSS/token
  normalization that preserves meaning.
- Existing extension behavior must remain unchanged.
- Existing `@repo/ui/*` subpath imports must keep working.
- Do not change `packages/ui/package.json` exports unless the implementation
  proves it is necessary and records why.

Styling compatibility:

- Token work should be additive first.
- Existing CSS modules may continue to exist after this child. This child should
  define the migration path, not rewrite every screen.
- New token names must be semantic, not one-off screen names.
- Avoid breaking currently tested class merging behavior in `@repo/ui`.

Rollback:

- Because no persistence changes are allowed, rollback should be a normal source
  revert of docs, token files, review route files, and shared primitive edits.
- If any new dependency is proposed, stop before adding it and record rollback,
  license, bundle, accessibility, and maintenance impact.

## Implementation Order

Use TDD for source behavior changes. Documentation-only work can be written
before tests, but it must be checked against current code and browser evidence.

1. Reconfirm baseline.
   - Run `rtk git status --short`.
   - Record current `HEAD`.
   - Re-open this plan, `CONTEXT.md`, master plan `005`, and ADRs `0019`
     through `0026`.
   - Re-open `docs/agent-workflow.md` before using external design guidance.
2. Create the UI inventory.
   - Add `docs/ui/121-current-ui-inventory.md`.
   - Inventory routes, CSS modules, shared primitives, current hard-coded color
     patterns, current loading/error/empty states, current responsive patterns,
     and known over-1000-line files.
3. Add token tests first.
   - Add `packages/ui/src/tokens.test.tsx`.
   - Test semantic token names, radius limits, focus token presence, and stable
     exported groups.
4. Add the token source.
   - Add `packages/ui/src/tokens.tsx`.
   - Keep values simple and semantic. Do not invent a large theme engine.
5. Update shared primitive tests.
   - Extend `packages/ui/src/button.test.tsx` and
     `packages/ui/src/primitives.test.tsx` for semantic classes, accessible
     disabled/focus behavior, and caller class merging.
6. Update shared primitives only as needed.
   - Keep changes small.
   - Add JSDoc file overview and terse function/component comments where files
     are touched.
   - Preserve existing import paths.
7. Apply global token CSS.
   - Update `apps/web/src/index.css`.
   - Update `apps/extension/src/index.css`.
   - Keep current app behavior intact.
8. Add the dev-only review route tests.
   - Update `apps/web/src/lib/routes.test.ts`.
   - Update `apps/web/src/App.test.tsx` if the route rendering is tested there.
9. Add the dev-only review route and page.
   - Update `apps/web/src/lib/routes.ts`.
   - Add `apps/web/src/features/design-system/DesignSystemReviewPage.tsx`.
   - Add `apps/web/src/features/design-system/DesignSystemReviewPage.test.tsx`.
   - Update `apps/web/src/App.tsx` with the smallest route branch possible.
10. Draft `PRODUCT.md`, `DESIGN.md`, and representative directions.
    - Run or apply the reviewed Impeccable initialization/documentation workflow
      with optional hooks disabled. If the exact workflow is unavailable or
      unsafe in the current environment, record the blocked step and perform a
      manual review against the same repository rules instead.
    - Add `PRODUCT.md`.
    - Add `DESIGN.md`.
    - Add `docs/ui/121-representative-directions.md`.
11. Capture browser baseline and review evidence.
    - Add `docs/ui/121-browser-baseline.md`.
    - Use agent-browser when available.
12. Run focused and broad verification.
13. Stop for explicit user acceptance of `PRODUCT.md`, `DESIGN.md`, and the
    representative UI direction. Do not start child `122` before acceptance.
14. After acceptance and verification, close this child and update the master
    checklist.

## Test Plan

Focused tests:

```bash
rtk pnpm --filter @repo/ui test
rtk pnpm --filter @repo/ui check-types
rtk pnpm --filter web test -- src/lib/routes.test.ts src/App.test.tsx src/features/design-system/DesignSystemReviewPage.test.tsx
rtk pnpm --filter web check-types
rtk pnpm --filter extension test -- src/App.test.tsx
rtk pnpm --filter extension check-types
```

Broad non-database checks:

```bash
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

Database checks:

- No database behavior changes are expected.
- Do not require DB checks for token/docs/review-route work.
- If implementation accidentally touches server, schema, contract, or
  persistence behavior, stop and reclassify the work before running DB changes.

Documentation checks:

```bash
rtk pnpm format -- docs/plan/121-design-system-foundation.md PRODUCT.md DESIGN.md docs/ui/121-current-ui-inventory.md docs/ui/121-browser-baseline.md docs/ui/121-representative-directions.md
```

If the root `format` script cannot accept explicit files, use the repository's
current Prettier command pattern and record the exact command used.

## Agent-Browser Validation Requirements

Use `dogfood-ossie` procedure with `agent-browser` when available.

Required browser evidence before closeout:

- Start web and server only as needed for the selected baseline workflows.
- Use synthetic data only.
- Validate the dev-only design review route at:
  - desktop viewport;
  - narrow mobile viewport;
  - 200% zoom/reflow;
  - keyboard-only navigation;
  - reduced-motion preference if motion tokens or transitions are visible.
- Capture console and network findings for the review route.
- Confirm the review route uses no authenticated or private API calls.
- Capture baseline notes for representative existing workflows that later
  children will change:
  - project list/library;
  - project/version workspace;
  - capture session list and detail;
  - Guide list, editor, preview, and public reader;
  - Interactive Demo list, editor, and public viewer;
  - setup/login/organization management;
  - project activity and compliance timelines;
  - extension popup capture flow if a real loaded extension environment is
    available.
- For extension evidence, clearly distinguish:
  - normal browser page automation;
  - extension page evidence;
  - real loaded toolbar-popup evidence.
- If real toolbar-popup validation is unavailable, mark it blocked. Do not claim
  toolbar-popup behavior passed from a normal page screenshot.

Record for each evidence item:

- date;
- commit;
- route or surface;
- viewport and zoom;
- authenticated or public context;
- fixture identity;
- screenshot path if captured;
- console errors;
- failed network requests;
- pass/fail/blocked status.

## Acceptance Criteria

This child can close only when all of the following are true:

- `PRODUCT.md` exists, is accepted by the user, and defers to `CONTEXT.md` and
  ADRs for domain truth.
- `DESIGN.md` exists, is accepted by the user, and defines the Quiet Versioned
  Workbench clearly enough for child `122`.
- `docs/ui/121-current-ui-inventory.md` records the current UI baseline and
  exact surfaces to protect during modernization.
- `docs/ui/121-browser-baseline.md` records safe browser evidence or honest
  blocked evidence.
- `docs/ui/121-representative-directions.md` records the accepted library,
  authoring-workbench, and reader/viewer directions.
- Shared UI tokens and any changed primitives are covered by focused tests.
- Existing routes and public behavior remain compatible.
- The dev-only review route is unavailable in production behavior.
- The dev-only review route's production bundle impact is measured or recorded
  as not applicable if it is excluded.
- Accessibility states are defined for keyboard, focus, contrast, errors,
  disabled/read-only, loading, empty, and reduced motion.
- Browser support, viewport coverage, zoom/reflow expectations, and performance
  budgets are recorded.
- No new major dependency was added without an explicit stop-and-accept decision.
- No over-1000-line file was made larger without first being split.
- Focused tests and broad checks pass or any pre-existing/environment failures
  are recorded with evidence.
- Master plan `005` checklist is updated only after this child is accepted and
  closed.

## Critical Decision Triggers

Stop and ask before continuing if implementation requires any of these:

- changing accepted product name or logo direction;
- adding dark mode;
- adding Radix, React Router, TanStack Query, Sonner, React Hook Form, a new CSS
  framework, or any other major UI/runtime dependency;
- changing public URL shape or route behavior outside the dev-only review route;
- changing permissions, tenant isolation, Audit, Access, Project Version,
  Edition, Revision, Publication, Publish Link, or protected-asset behavior;
- committing screenshots that may reveal private data;
- introducing persistent JSON as source of truth;
- renaming packages, runtime config, database objects, or technical identifiers;
- changing child order or starting child `122` before explicit acceptance.

## Implementation Log

Implemented on 2026-07-26.

Commits:

- `f877ce4 docs(plan): expand design system foundation plan`
- `dcfb6ab feat(ui): add design system foundation review surface`
- `f96a68e fix(web): keep design review guard lint-clean`
- `adea86b docs(ui): add design system foundation guidance`

Files changed:

- `PRODUCT.md`
- `DESIGN.md`
- `docs/ui/121-current-ui-inventory.md`
- `docs/ui/121-browser-baseline.md`
- `docs/ui/121-representative-directions.md`
- `packages/ui/src/tokens.tsx`
- `packages/ui/src/tokens.test.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/features/design-system/DesignSystemReviewPage.tsx`
- `apps/web/src/features/design-system/DesignSystemReviewPage.module.css`
- `apps/web/src/features/design-system/DesignSystemReviewPage.test.tsx`
- `apps/web/src/index.css`
- `apps/extension/src/index.css`

Implemented behavior:

- Added source-owned semantic UI tokens in `@repo/ui`.
- Added shared CSS custom properties to web and extension global CSS.
- Added development-only `/__design-system` route parsing and app guard.
- Added synthetic dev-only design review page covering library/operations,
  authoring workbench, and reader/viewer directions.
- Added `PRODUCT.md`, `DESIGN.md`, current UI inventory, browser evidence notes,
  and representative direction notes.

Decisions:

- No new runtime dependency was added.
- No server, API, schema, migration, permission, Audit, Access, public-link,
  protected-asset, Project Version, Edition, Revision, or Publication behavior
  changed.
- `import.meta.env.DEV` remains the Vite mode guard for the review route with a
  local Turbo lint exemption because it is a Vite built-in flag, not a user
  environment variable.
- The master checklist was not updated because explicit user acceptance is still
  pending.
- The broader authenticated workflow screenshot matrix required before broad
  visual rewrites was not captured in child `121`; it is now recorded as the
  first child `122` carryover item.

## Verification Record

Focused RED checks:

- `rtk pnpm --filter @repo/ui test -- src/tokens.test.tsx` failed before
  `packages/ui/src/tokens.tsx` existed.
- `rtk pnpm --filter web test -- src/lib/routes.test.ts src/App.test.tsx src/features/design-system/DesignSystemReviewPage.test.tsx`
  failed before the route, guard, and review page existed.
- `rtk pnpm --filter web test -- src/appRouteGuards.test.ts` failed before
  `apps/web/src/appRouteGuards.ts` existed.

Focused GREEN checks:

- `rtk pnpm --filter @repo/ui test -- src/tokens.test.tsx` passed.
- `rtk pnpm --filter web test -- src/lib/routes.test.ts src/appRouteGuards.test.ts src/features/design-system/DesignSystemReviewPage.test.tsx`
  passed.
- `rtk pnpm --filter @repo/ui check-types` passed.
- `rtk pnpm --filter web check-types` passed.
- `rtk pnpm --filter extension check-types` passed.
- `rtk pnpm --filter extension test -- src/App.test.tsx` passed.

Broad checks:

- `rtk pnpm -r --if-present test` passed.
- `rtk pnpm check-types` passed.
- `rtk pnpm lint` passed after the local Vite `DEV` lint exemption.
- `rtk pnpm build` passed.
- `rtk git diff --check` passed.
- `rtk pnpm exec prettier --check PRODUCT.md DESIGN.md docs/ui/121-current-ui-inventory.md docs/ui/121-browser-baseline.md docs/ui/121-representative-directions.md` passed.

Browser evidence:

- `rtk agent-browser --session ossie-121 open http://127.0.0.1:3000/__design-system`
  passed against the Vite dev server.
- Desktop snapshot passed with all three representative regions present.
- Narrow mobile viewport `390x844` snapshot passed with all three regions
  present.
- 200% zoom/reflow simulation passed with all three regions present.
- Keyboard Tab smoke passed through review-surface controls.
- Console check showed no application errors; only Vite and React DevTools
  development info appeared.
- Network requests showed no `/api` calls from the review route.
- `rtk pnpm --filter web build` passed and reported production JS gzip
  `122.07 kB`.
- Production preview at `http://127.0.0.1:3001/__design-system` rendered the
  existing unsupported `Ossie portal` state, not the design review surface.

Close-previous recheck on 2026-07-26:

- Rechecked child `121` against master plan `005`, implemented files, and
  closeout notes.
- Found one overclaim: docs said browser evidence was complete without clearly
  separating the completed dev-only review-route evidence from the missing full
  authenticated workflow screenshot matrix.
- Updated `DESIGN.md`, `docs/ui/121-current-ui-inventory.md`,
  `docs/ui/121-browser-baseline.md`, and this plan to record the child `122`
  carryover before broad visual rewrites.
- `rtk pnpm exec prettier --check DESIGN.md docs/ui/121-browser-baseline.md docs/ui/121-current-ui-inventory.md docs/plan/121-design-system-foundation.md`
  passed.
- `rtk git diff --check` passed.
- `rtk pnpm --filter @repo/ui test -- src/tokens.test.tsx` passed.
- `rtk pnpm --filter web test -- src/lib/routes.test.ts src/appRouteGuards.test.ts src/features/design-system/DesignSystemReviewPage.test.tsx`
  passed.
- `rtk pnpm --filter web check-types` passed.
- Browser was not rerun during this close-previous doc fix because no
  browser-visible source changed after the original agent-browser validation.

Database checks:

- Not run. This child did not touch server, API contracts, schemas, migrations,
  persistence, or smoke workflows.

Blocked/not applicable evidence:

- Real loaded extension toolbar-popup browser evidence is not applicable to this
  child because extension popup workflow behavior was not changed. Child `126`
  owns extension UI modernization.

## Leftovers And Handoff

Current handoff:

- Source implementation is complete and verified.
- Explicit user acceptance is still required for:
  - `PRODUCT.md`;
  - `DESIGN.md`;
  - `docs/ui/121-representative-directions.md`.
- Do not start child `122` until the acceptance gate is satisfied.
- Do not update master plan `005` as complete until acceptance is recorded.
- At the start of child `122`, before broad shell/workflow visual rewrites,
  capture the full authenticated workflow screenshot matrix with safe synthetic
  fixtures or record the exact blocked environment/tooling reason.
- If accepted, the closeout step should mark child `121` complete, update master
  checklist item `121`, and hand off to child `122`.
- If not accepted, revise only the product/design/direction outputs needed for
  the decision and rerun affected focused checks.
