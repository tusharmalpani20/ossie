# Child Plan 122: Portal Architecture And Application Shell

Date reserved: 2026-07-12

Date expanded: 2026-07-26

Status: Complete after close-previous audit on 2026-07-26.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Preceding plan:

- `docs/plan/121-design-system-foundation.md`

Starting baseline for this expansion:

- Starting expansion commit: `bd73b08`.
- Starting implementation commit: `ab02f6d`.
- Worktree ownership: clean at expansion time and implementation start.
- Child `121` source work is complete and explicitly accepted by the user.
- Child `121` carryover: full authenticated workflow screenshot baselines for
  children `122` through `128` were not captured. Child `122` must capture those
  baselines before broad shell/workflow visual rewrites, or record the exact
  blocked environment/tooling reason.

## Sequence Gate

Prerequisite:

- Child `121` must be explicitly accepted before implementing this child.
- Master plan `005` must record child `121` as complete before child `122`
  runtime work begins.

Next child:

- `123` Authentication, Setup, And Organization UI Modernization, only after
  shell navigation, accessibility, responsive, and browser acceptance pass.

This child is allowed to be planned before `121` acceptance. It must not be
implemented until the gate above is satisfied.

## Goal

Create a scalable, responsive Portal App shell and route/data architecture
around Organization, Project, and Project Version context.

The result should make the first viewport a usable product workspace, not a
landing page. It must give later children a stable frame for authentication,
setup, organization, project, capture, Guide, Interactive Demo, settings, and
activity surfaces without changing domain behavior.

## Current Runtime Facts

The implementation must start from these observed facts:

- `apps/web` is a React/Vite app. It does not use React Router.
- Route parsing is custom and lives in `apps/web/src/lib/routes.ts`.
- `apps/web/src/App.tsx` currently owns most route selection, setup gating,
  default Project Version redirects, public route branching, and unsupported
  route fallback.
- `apps/web/src/App.tsx` is 739 lines. It is under the repository 1000-line
  limit, but child `122` must avoid turning it into a larger routing dump.
- `apps/web/src/App.test.tsx` is already over the 1000-line limit at 1045 lines.
  Do not add tests to this file. Move new route/shell behavior into smaller
  focused modules and tests.
- `apps/web/src/lib/api.ts` is already over the 1000-line limit at 1627 lines.
  Do not add new API helpers here unless a behavior-preserving split happens
  first. This child should not need new server API calls.
- `apps/web/src/lib/api.test.ts` is already over the 1000-line limit at 2968
  lines. Do not add tests there unless a behavior-preserving split happens
  first.
- `PortalTopbar` currently lives in
  `apps/web/src/features/portal/PortalTopbar.tsx`. It renders the brand link,
  one context string, and sign-out behavior.
- Many feature pages define their own local `PortalShell` wrappers around
  `PortalTopbar`.
- Guide editor, capture-session detail, and Interactive Demo editor files are
  already over the 1000-line limit. Child `122` must not add code to those files
  merely to force shell adoption. If shell adoption on those routes is necessary
  in this child, first extract a small behavior-preserving shell adapter or page
  section into a new file with focused tests.
- `ProjectVersionRouteBoundary` currently loads project detail, resolves the
  Project Version slug, lists Project Versions, canonicalizes aliases with
  `window.history.replaceState`, renders `PortalTopbar`, renders
  `ProjectVersionContextBar`, and provides Project Version context to
  version-owned content.
- Existing public Guide/Interactive Demo reader and embed routes are rendered
  before authenticated portal routes in `App.tsx`.
- The dev-only `/__design-system` route from child `121` is parsed in
  `routes.ts` and guarded by `shouldRenderDesignSystemReview`.
- `apps/web/package.json` has no React Router, TanStack Query, Radix, Sonner, or
  React Hook Form dependency.
- The current API client uses `VITE_OSSIE_API_URL` when set, otherwise same-origin
  `/api`, and always includes credentials for API requests.
- API error mapping exists through `ApiClientError` with `unauthenticated`,
  `forbidden`, `not_found`, `validation`, and `unknown` kinds.
- Child `121` added shared semantic UI tokens in `packages/ui/src/tokens.tsx`
  and CSS variables in `apps/web/src/index.css`.
- `PRODUCT.md` and `DESIGN.md` exist from child `121`, but are not yet accepted.

## Product And Design Rules

Use the implemented child `121` design direction as the working UI guide, but do
not treat it as accepted until the user explicitly accepts it.

Rules:

- Keep Organization, Project, and Project Version context visible.
- Suppress extra Project Version ceremony when only `Main` exists.
- Use the term `Project Version`, never unqualified `version`.
- Keep desktop density and scan speed.
- Use compact, stable navigation. Avoid marketing-like layouts.
- Do not add Documentation or Video to active navigation.
- A roadmap mention is allowed only outside operational navigation and only if
  clearly labeled as future.
- Avoid nested cards and every-section-as-card composition.
- Do not add dark mode.
- Do not add decorative gradient/orb backgrounds.
- Use child `121` tokens and existing `@repo/ui` primitives before adding any
  new component abstraction.
- Keep motion sparse and respect reduced motion.

## Exact Affected Files

Implementation is allowed to create or edit only the files below unless the
pre-implementation recheck discovers directly related current-code drift and
records it in this plan before coding.

### Required plan and docs

- `docs/plan/122-portal-architecture-and-application-shell.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during closeout, after this child passes and is accepted.
- `docs/ui/122-portal-shell-baseline.md` must be added to record the inherited
  child `121` browser-baseline carryover and this child’s before/after shell
  evidence.

### Route and app orchestration

- `apps/web/src/App.tsx`
- `apps/web/src/App.module.css`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts` may be added for route family,
  public/authenticated/dev classification, labels, and shell needs.
- `apps/web/src/lib/portalRouteMetadata.test.ts` must be added if
  `portalRouteMetadata.ts` is added.
- `apps/web/src/lib/portalNavigation.ts` may be added for URL builders,
  breadcrumbs, active nav item selection, and route-safe labels.
- `apps/web/src/lib/portalNavigation.test.ts` must be added if
  `portalNavigation.ts` is added.

### Portal shell components

- `apps/web/src/features/portal/PortalTopbar.tsx`
- `apps/web/src/features/portal/PortalTopbar.module.css`
- `apps/web/src/features/portal/PortalTopbar.test.tsx`
- `apps/web/src/features/portal/PortalAppShell.tsx` must be added.
- `apps/web/src/features/portal/PortalAppShell.module.css` must be added.
- `apps/web/src/features/portal/PortalAppShell.test.tsx` must be added.
- `apps/web/src/features/portal/PortalNavigation.tsx` may be added if keeping
  navigation markup separate keeps files simpler.
- `apps/web/src/features/portal/PortalNavigation.module.css` may be added with
  `PortalNavigation.tsx`.
- `apps/web/src/features/portal/PortalNavigation.test.tsx` must be added if
  `PortalNavigation.tsx` is added.
- `apps/web/src/features/portal/PortalBreadcrumbs.tsx` may be added if the
  breadcrumb logic becomes too large for `PortalAppShell.tsx`.
- `apps/web/src/features/portal/PortalBreadcrumbs.module.css` may be added with
  `PortalBreadcrumbs.tsx`.
- `apps/web/src/features/portal/PortalBreadcrumbs.test.tsx` must be added if
  `PortalBreadcrumbs.tsx` is added.

### Project Version shell context

- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.module.css`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.module.css`
- `apps/web/src/features/project-version/ProjectVersionContextBar.test.tsx`

### Page shell adoption

These pages may be touched only to replace their local topbar/shell wrapper with
the shared shell, pass already-known context, and preserve existing behavior:

- `apps/web/src/features/project/ProjectListPage.tsx`
- `apps/web/src/features/project/ProjectListPage.module.css`
- `apps/web/src/features/project/ProjectListPage.test.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.module.css`
- `apps/web/src/features/project/ProjectWorkspacePage.test.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.module.css`
- `apps/web/src/features/project/ProjectSettingsPage.test.tsx`
- `apps/web/src/features/organization/OrganizationMembersPage.tsx`
- `apps/web/src/features/organization/OrganizationMembersPage.module.css`
- `apps/web/src/features/organization/OrganizationMembersPage.test.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.module.css`
- `apps/web/src/features/compliance/ComplianceTimelinePage.test.tsx`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.tsx`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.module.css`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.test.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.module.css`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.module.css`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.module.css`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`

### Editor/detail compatibility boundary

These pages must remain route-compatible and visually safe in browser evidence,
but should not receive direct new shell code unless a prior split keeps the
over-1000-line rule intact:

- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.module.css`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.module.css`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`

If these routes keep their existing local shell in child `122`, record that as a
deliberate compatibility boundary and hand the direct editor/detail layout work
to children `125`, `127`, and `128`.

### Read-only unless a focused split is required

These files are in scope for inspection, but should not receive new behavior in
child `122`:

- `apps/web/src/App.test.tsx` because it is already over 1000 lines.
- `apps/web/src/lib/api.ts` because it is already over 1000 lines.
- `apps/web/src/lib/api.test.ts` because it is already over 1000 lines.
- `packages/types/**`
- `apps/server/src/**`
- `apps/extension/**`

### Source comment requirement

Every new or touched source file in `apps/web/src` must include:

- a terse `@fileoverview` JSDoc comment at the top;
- terse comments for exported components, helpers, and functions.

Existing touched files that lack `@fileoverview` must receive one as part of the
same edit.

## Explicit Non-Scope

Do not implement any of the following in child `122`:

- Authentication, setup, invite, or organization-management UI modernization.
  Those belong to child `123`.
- Project settings/version-management workflow modernization. That belongs to
  child `124`.
- Capture workflow modernization. That belongs to child `125`.
- Extension popup modernization. That belongs to child `126`.
- Guide editor/list/reader modernization beyond adopting the shared shell on
  allowed list-level surfaces or performing a required behavior-preserving shell
  extraction. That belongs to child `127`.
- Interactive Demo editor/list/viewer modernization beyond adopting the shared
  shell on allowed list-level surfaces or performing a required
  behavior-preserving shell extraction. That belongs to child `128`.
- Accessibility/motion/performance final audit for the full modernized product.
  That belongs to child `129`.
- Documentation-domain modeling or runtime UI. That begins only after child
  `131`.
- Video, search implementation, notifications, approvals, comments, analytics,
  or recording library features.
- Server routes, API response schemas, database schema, migrations, seeds,
  storage, cookies, CORS, deployment config, or environment-variable semantics.
- Public Guide/Interactive Demo reader or embed redesign.
- Public route shape changes for `/p/*`, `/d/*`, or embed URLs.
- Auth redirect semantics beyond preserving existing login/setup behavior.
- Adding React Router, TanStack Query, Radix, Sonner, React Hook Form, or another
  major dependency unless implementation recheck proves a concrete missing
  behavior and stops for explicit acceptance first.
- Dark mode.
- Technical identifier renames, package renames, route prefix renames, or
  product-name changes.

## Dependency Decision

Default decision for implementation: do not add a new runtime dependency.

Rationale:

- The current app has a custom parser and link-based navigation that are already
  tested.
- Child `122` can create a stable shell, route metadata, breadcrumbs, and
  navigation helpers without React Router.
- Child `122` can preserve page-local fetching while documenting a later query
  strategy. Replacing all fetching with TanStack Query would exceed this child
  and create unnecessary migration risk.
- No route-level modal, combobox, popover, or focus-trap behavior is required in
  this shell slice, so a headless primitive dependency is not justified here.

Stop for user acceptance before adding a major dependency. If a dependency is
proposed, record:

- exact package and version;
- license;
- bundle impact;
- security/update posture;
- affected files;
- migration boundary;
- exit cost;
- why current code cannot meet the accepted behavior safely.

## Routes And API Contracts

### Web route behavior

No user-facing route shape should change.

Must preserve:

- `/login`
- `/setup`
- `/projects`
- `/projects/:projectId`
- `/projects/:projectId/settings`
- `/projects/:projectId/compliance`
- `/projects/:projectId/activity`
- `/projects/:projectId/capture-sessions`
- `/projects/:projectId/capture-sessions/:captureSessionId`
- `/projects/:projectId/guides`
- `/projects/:projectId/guides/:guideId`
- `/projects/:projectId/guides/:guideId/preview`
- `/projects/:projectId/interactive-demos`
- `/projects/:projectId/interactive-demos/:interactiveDemoId`
- `/projects/:projectId/versions/:versionSlug`
- `/projects/:projectId/versions/:versionSlug/carry-forward`
- `/projects/:projectId/versions/:versionSlug/capture-sessions`
- `/projects/:projectId/versions/:versionSlug/capture-sessions/:captureSessionId`
- `/projects/:projectId/versions/:versionSlug/guides`
- `/projects/:projectId/versions/:versionSlug/guides/:guideId`
- `/projects/:projectId/versions/:versionSlug/guides/:guideId/preview`
- `/projects/:projectId/versions/:versionSlug/guides/:guideId/revisions`
- `/projects/:projectId/versions/:versionSlug/guides/:guideId/revisions/:revisionNumber`
- `/projects/:projectId/versions/:versionSlug/interactive-demos`
- `/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId`
- `/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId/revisions`
- `/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId/revisions/:revisionNumber`
- `/organization/members`
- `/organization/compliance`
- `/invites/:token`
- `/p/:slug`
- `/p/:slug/embed`
- `/p/:slug/versions/:versionSlug`
- `/p/:slug/versions/:versionSlug/embed`
- `/d/:slug`
- `/d/:slug/embed`
- `/d/:slug/versions/:versionSlug`
- `/d/:slug/versions/:versionSlug/embed`
- dev-only `/__design-system`, still unavailable in production behavior.

Route parser rules:

- Existing route parsing and decoding behavior must remain compatible.
- Public routes must remain classified as public and must not receive
  authenticated shell state.
- Setup/login/invite routes must not be wrapped in the authenticated Portal App
  shell.
- Unsupported routes should show a useful not-found state without exposing
  private data.
- Legacy Project routes without `/versions/:versionSlug` must continue to
  canonicalize to the Default Project Version where current code already does
  that.
- Project Version alias canonicalization must keep query string and hash.

### App shell behavior

Authenticated portal shell must provide:

- brand link to `/projects`;
- primary navigation for current shipped internal areas only:
  - Projects;
  - Organization members;
  - Organization compliance;
  - project workspace when a project is known;
  - capture sessions when a project and Project Version are known;
  - Guides when a project and Project Version are known;
  - Interactive demos when a project and Project Version are known;
  - Project activity when a project is known and role allows it;
  - Project settings when role is Project Admin or Organization Owner access is
    exposed as Project Admin by the API;
- no active Documentation or Video nav item;
- no search input or search placeholder unless it performs a real current
  action; a fake search box is out of scope;
- no account/settings route link unless a current route exists; sign-out remains
  the current account action;
- compact Organization/Project/Project Version context;
- breadcrumbs or equivalent wayfinding;
- sign-out behavior matching the current `PortalTopbar`;
- route-level loading, not-found, unauthenticated, forbidden, and recoverable
  error states where the route already exposes enough information;
- expired-session behavior must use the same unauthenticated handling as current
  API failures, including sign-in links that preserve the current path where the
  page already does so;
- mobile navigation that does not cover content permanently or trap keyboard
  focus;
- visible focus on links, buttons, nav controls, and sign-out.

The shell must not grant actions. It only shows links and context based on data
already returned to the current user by existing APIs.

### Query ownership

Child `122` must not replace page-local fetching with a global query/cache
layer. Query ownership remains:

- setup gate status in `App.tsx` or a small extracted setup-gate helper;
- project and Project Version resolution in `ProjectVersionRouteBoundary` or a
  small extracted boundary helper;
- page-specific lists, editors, activity, compliance, and publish data inside
  their current feature pages;
- public Publish Link reads inside public reader/viewer pages.

If implementation extracts any shared loading helper, it must stay fetch-neutral:
no cache keys, invalidation policy, optimistic writes, or stale-response
behavior beyond the existing mounted-component cancellation pattern.

If implementation decides to replace page-local fetching, stop first. That would
require the dependency and migration decision the master calls out.

### API contracts

No server API contracts should change in this child.

Existing API calls may continue:

- `GET /api/v1/public/instance`
- `POST /api/v1/authentication/logout`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:projectId`
- `GET /api/v1/projects/:projectId/versions`
- `GET /api/v1/projects/:projectId/versions/resolve/:versionSlug`
- existing page-local API calls under capture, Guide, Interactive Demo,
  compliance, project activity, and publish routes.

Rules:

- Continue using credentials with API requests.
- Preserve `VITE_OSSIE_API_URL` behavior.
- Do not mix public reader/embed cache or assumptions with authenticated portal
  state.
- Do not introduce global caching for protected data in this child.
- If an API call fails with `unauthenticated`, existing sign-in links and route
  behavior must remain correct.
- If an API call fails with `forbidden`, show a permission-denied state where the
  page already receives that error. Do not hide a forbidden response as not
  found unless current behavior already does so.

## Schemas And Types

No database schema, Zod API schema, shared DTO, domain package type, migration,
or OpenAPI contract should change.

Allowed type work:

- Local route metadata types in `apps/web/src/lib/portalRouteMetadata.ts`.
- Local navigation item, breadcrumb, and shell context types in
  `apps/web/src/lib/portalNavigation.ts` or portal components.
- Local React prop types for new portal shell components.

Do not move domain terms or API DTOs into `packages/ui`.

## Security, Permission, And Privacy Rules

This child must preserve all security boundaries:

- Organization tenant isolation remains server-owned and explicit.
- Project Membership remains the source of internal Project access.
- Project Versions inherit Project access and do not create per-version
  permissions.
- Public Publish Link access remains independent from authenticated Project
  Membership.
- Public reader/embed routes must not render authenticated portal shell,
  account, organization, or project navigation.
- Shell links must not reveal project names, Project Version names, organization
  data, member data, activity, compliance evidence, private URLs, storage keys,
  actor IDs, cookies, tokens, or credentials unless returned through an
  authorized API call for the current user.
- Do not add localStorage/sessionStorage persistence for protected navigation
  context.
- Do not store private screenshots or raw captured input in docs.
- Do not weaken audit/access behavior or claim new audit/access UI exists.
- Sign-out must still call the existing logout endpoint and navigate to `/login`
  only after success.
- Failed sign-out must remain visible and must not navigate away.

## Migration And Backwards Compatibility

Database migration:

- None.

Runtime compatibility:

- Existing deep links must keep resolving.
- Existing browser refresh behavior must keep working.
- Browser back/forward must not strand the user in stale route state.
- Existing public reader/embed behavior must remain unchanged.
- Existing setup/login/invite behavior must remain unchanged.
- Existing default Project Version redirects must preserve search and hash.
- Existing split API/web origin behavior through `VITE_OSSIE_API_URL` must remain
  unchanged.
- Existing page-local fetching may remain; do not invent a global query layer
  unless accepted separately.
- Existing mounted-component cancellation guards must remain where present so
  stale responses do not update unmounted pages.

Styling compatibility:

- Use child `121` CSS variables and token values where touching shell CSS.
- Existing page CSS modules may remain.
- Do not attempt to restyle every workflow in this child.
- Remove duplicated page-local shell/topbar styling only for pages touched by
  this child.

Rollback:

- Rollback should be a normal source revert of shell, route metadata, tests, and
  documentation files.
- No persistence rollback path is required because no schema/data migration is
  allowed.

## Behavior Rules

### Navigation and context

- Brand link always points to `/projects`.
- Project-aware routes should show Project context from authorized project data,
  not raw route IDs, once loaded.
- Project Version-aware routes should show selected Project Version name and
  status, with default/archived labels when applicable.
- Long Organization, Project, and Project Version names must wrap or truncate
  without hiding primary actions.
- Mobile shell must keep navigation reachable and content readable at about
  390px width.
- Desktop shell must keep primary navigation persistent without crowding the
  page header.
- Links must use existing URL shapes and `encodeURIComponent` where composing
  IDs/slugs.

### Loading, empty, and errors

- Setup-gated routes keep the existing “checking setup” behavior.
- Shell loading states must reserve stable space and not create layout jumps.
- Recoverable load errors must offer retry where current pages already support
  retry.
- Not-found states must not include private IDs beyond what is already in the
  URL.
- Permission-denied states must explain that access is unavailable without
  suggesting the user has a role they do not have.

### Unsaved editor work

- Do not implement a full navigation blocker in this child unless the current
  editor pages already expose a reliable dirty-state contract.
- Do not route shell links through a custom SPA navigation function that bypasses
  existing browser prompts or page unload behavior.
- If implementation discovers existing unsaved-work behavior that shell
  navigation would break, stop and record the exact editor/file/route impact.

### Public/authenticated separation

- Public Guide and Interactive Demo routes render before authenticated shell
  logic.
- Public routes must not call `/api/v1/authentication/me`, project list, project
  detail, member, or compliance endpoints because of the shell.
- Dev-only `/__design-system` must remain dev-only and synthetic.

## Implementation Order

Use TDD for source behavior changes. Documentation-only work can be written
before tests, but must be formatted and checked.

1. Confirm gates and baseline.
   - Run `rtk git status --short`.
   - Record current `HEAD`.
   - Confirm child `121` is explicitly accepted. If not, stop before coding.
   - Re-read this plan, child `121`, master plan `005`, `CONTEXT.md`, ADRs
     `0019` through `0026`, `PRODUCT.md`, `DESIGN.md`, and current touched code.
2. Capture inherited browser baseline carryover.
   - Add `docs/ui/122-portal-shell-baseline.md`.
   - Start from the child `121` missing screenshot matrix.
   - Capture or honestly block safe baseline evidence before shell visual
     rewrites.
3. Add route metadata tests first.
   - Add `apps/web/src/lib/portalRouteMetadata.test.ts`.
   - Test public vs authenticated vs setup/login/invite/dev route families.
   - Test whether a route should receive the authenticated Portal App shell.
4. Add route metadata helper.
   - Add `apps/web/src/lib/portalRouteMetadata.ts`.
   - Keep it pure and small.
   - Do not change route parsing output unless tests require a compatibility
     fix.
5. Add navigation helper tests first.
   - Add `apps/web/src/lib/portalNavigation.test.ts`.
   - Test URL builders, breadcrumb labels, active item selection, and long-name
     safe labels.
6. Add navigation helpers.
   - Add `apps/web/src/lib/portalNavigation.ts`.
   - Use `encodeURIComponent` for IDs/slugs.
   - Do not include Documentation or Video nav items.
7. Add Portal App shell tests first.
   - Add `apps/web/src/features/portal/PortalAppShell.test.tsx`.
   - Test brand link, primary nav labels, active item, breadcrumbs/context,
     sign-out success/failure, permission-aware project settings link, mobile
     menu button if used, and no future-product nav.
8. Add Portal App shell components.
   - Add `PortalAppShell.tsx` and CSS.
   - Split `PortalNavigation` or `PortalBreadcrumbs` only if it keeps files
     clearer.
   - Preserve `PortalTopbar` public API where current pages still import it.
9. Update `PortalTopbar` only as needed.
   - Add `@fileoverview`.
   - Keep existing sign-out behavior.
   - Prefer making `PortalTopbar` a small internal part of `PortalAppShell`
     rather than a competing shell.
10. Adopt shell on allowed pages.
    - Start with `ProjectListPage`, `ProjectWorkspacePage`, and
      `ProjectVersionRouteBoundary`.
    - Then update list-level pages allowed in this plan.
    - Do not modernize editors/readers beyond shell adoption.
    - Do not add code to files already over 1000 lines.
    - If editor/detail routes keep a legacy local shell due file-size pressure,
      record that compatibility boundary in this plan and hand it to the owning
      later child.
11. Keep `App.tsx` small.
    - Move pure route classification or shell decisions into helper modules.
    - Preserve existing public/setup/login/dev route ordering.
    - Preserve default Project Version redirects.
12. Run focused verification.
13. Run broad verification.
14. Use agent-browser for desktop, mobile, keyboard, zoom/reflow, console, and
    network validation.
15. Update this plan with implementation log, verification notes, leftovers, and
    handoff.
16. Update master plan `005` only after acceptance passes.

## Test Plan

Focused tests:

```bash
rtk pnpm --filter web test -- src/lib/routes.test.ts src/appRouteGuards.test.ts src/lib/portalRouteMetadata.test.ts src/lib/portalNavigation.test.ts src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx src/features/project-version/ProjectVersionContextBar.test.tsx
rtk pnpm --filter web test -- src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx
rtk pnpm --filter web test -- src/features/organization/OrganizationMembersPage.test.tsx src/features/compliance/ComplianceTimelinePage.test.tsx src/features/project-activity/ProjectActivityTimelinePage.test.tsx
rtk pnpm --filter web test -- src/features/capture-session/ProjectCaptureSessionListPage.test.tsx src/features/guide/ProjectGuideListPage.test.tsx src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx
rtk pnpm --filter web check-types
```

If implementation touches a page not listed in the focused commands, add that
page’s focused test command before coding.

Broad non-database checks:

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

Database checks:

- No database behavior changes are expected.
- Run DB/smoke only if the shell implementation needs real authenticated
  browser fixtures or if implementation accidentally touches server/API
  behavior:

```bash
rtk pnpm --filter server run test:db
rtk pnpm --filter server test:smoke
```

Documentation checks:

```bash
rtk pnpm exec prettier --check docs/plan/122-portal-architecture-and-application-shell.md docs/ui/122-portal-shell-baseline.md
```

## Agent-Browser Validation Requirements

Use the `dogfood-ossie` procedure with `agent-browser` when available.

Required browser evidence:

- Start only the local apps needed for the selected evidence.
- Use safe synthetic fixtures only.
- Validate before broad shell visual rewrites:
  - authenticated project list/library;
  - authenticated Project Version workspace;
  - capture session list;
  - Guide list;
  - Interactive Demo list;
  - organization members or organization compliance;
  - project activity or project compliance;
  - public Guide reader;
  - public Interactive Demo viewer.
- Validate after implementation:
  - `/projects`;
  - a canonical Project Version workspace route;
  - a legacy `/projects/:projectId` route that redirects to Default Project
    Version;
  - `/organization/members`;
  - one capture list route;
  - one capture detail route, even if it keeps a legacy local shell;
  - one Guide list route;
  - one Guide editor or preview route, even if it keeps a legacy local shell;
  - one Interactive Demo list route;
  - one Interactive Demo editor route, even if it keeps a legacy local shell;
  - one public Guide route;
  - one public Interactive Demo route;
  - production preview behavior for `/__design-system`.
- Cover:
  - desktop viewport;
  - narrow mobile viewport near `390x844`;
  - keyboard-only navigation through shell links, mobile nav, and sign-out;
  - visible focus;
  - 200% zoom/reflow;
  - loading state;
  - unauthenticated state;
  - not-found state;
  - permission-denied state when a safe fixture can produce it;
  - console errors;
  - failed network requests;
  - public routes making no shell-triggered authenticated API requests.
- Record screenshot paths only if screenshots are safe and useful. Prefer
  temporary screenshots and written evidence over committed images.
- Keep public and authenticated browser sessions separate.
- Close browser sessions and stop local services started for validation.

If a seeded authenticated local runtime cannot be established, record the exact
blocked reason in `docs/ui/122-portal-shell-baseline.md` and this plan. Do not
claim the browser matrix passed.

## Acceptance Criteria

This child can close only when all of the following are true:

- Child `121` is explicitly accepted and master plan `005` records it complete.
- `docs/ui/122-portal-shell-baseline.md` records the inherited baseline
  carryover, before/after shell evidence, or honest blocked evidence.
- Current authenticated and public routes remain reachable and tested.
- Public reader/embed routes remain isolated from authenticated shell behavior.
- Setup, login, invite, and dev-only design-review routes preserve their current
  routing behavior.
- Legacy Project routes still canonicalize to Default Project Version where
  current behavior does so.
- Project Version alias canonicalization still preserves query and hash.
- Desktop and mobile shell layouts show no clipping, overlap, dead controls, or
  misleading navigation.
- Keyboard and focus behavior work through the shell.
- Organization, Project, and Project Version context is visible where available.
- Documentation and Video are not active nav items.
- No fake search box, fake account route, or link to unimplemented behavior was
  added.
- No new major dependency was added without explicit acceptance.
- No server, API, schema, migration, permission, audit/access, public-link, or
  protected-asset behavior changed.
- No already-over-1000-line file received new code without a prior split.
- Focused tests, type checks, lint, build, and required browser checks pass or
  are recorded with precise pre-existing/environment failures.
- This plan has status, checklist, implementation log, verification notes,
  leftovers, and handoff updated.
- Master plan `005` is updated only after this child is accepted and closed.

## Critical Decision Triggers

Stop and ask before continuing if implementation requires any of these:

- implementing before child `121` is explicitly accepted;
- changing the accepted product display name or design direction;
- adding React Router, TanStack Query, Radix, Sonner, React Hook Form, or another
  major dependency;
- changing route shapes or public URL behavior;
- changing setup/login/auth redirect behavior;
- changing server/API contracts;
- changing database schema, migrations, seed data, or persistence;
- changing Organization tenant isolation, Project Membership, Project Version,
  Artifact Edition, Revision, Publication, Publish Link, Audit, Access, or
  protected-asset behavior;
- adding Documentation or Video as active product navigation;
- persisting protected navigation context in browser storage;
- committing screenshots that may reveal private data;
- touching extension behavior;
- changing child order.

## Implementation Checklist

- [x] Confirm child `121` acceptance and record starting commit.
- [x] Capture or honestly block inherited full-workflow screenshot baseline.
- [x] Add route metadata tests.
- [x] Add route metadata helper.
- [x] Add navigation helper tests.
- [x] Add navigation helper.
- [x] Add Portal App shell tests.
- [x] Add Portal App shell component and CSS.
- [x] Update `PortalTopbar` while preserving sign-out behavior.
- [x] Adopt shell on allowed project, organization, compliance, activity, and
      list-level workflow pages.
- [x] Record whether editor/detail routes adopted the shell through safe
      extraction or intentionally stayed on the legacy local shell for later
      child ownership.
- [x] Preserve public/setup/login/invite/dev route behavior.
- [x] Preserve legacy and Project Version alias canonicalization.
- [x] Run focused tests.
- [x] Run broad checks.
- [x] Run required agent-browser validation or record exact blocked evidence.
- [x] Update implementation log, verification record, leftovers, and handoff.
- [x] Update master plan `005` for completed phase items.

## Implementation Log

Implemented on 2026-07-26 from starting commit `ab02f6d`.

Implementation changes:

- Added route metadata helper and tests in
  `apps/web/src/lib/portalRouteMetadata.ts` and
  `apps/web/src/lib/portalRouteMetadata.test.ts`.
- Added shared portal navigation and breadcrumb helper and tests in
  `apps/web/src/lib/portalNavigation.ts` and
  `apps/web/src/lib/portalNavigation.test.ts`.
- Added shared authenticated shell component and CSS in
  `apps/web/src/features/portal/PortalAppShell.tsx` and
  `apps/web/src/features/portal/PortalAppShell.module.css`.
- Added `PortalAppShell` tests and preserved `PortalTopbar` sign-out tests.
- Adopted the shared shell on project list, project workspace, project settings,
  organization members, compliance timeline, project activity, guide list,
  interactive demo list, capture session list, and Project Version workspace
  boundary states.
- Preserved public/setup/login/invite/dev route behavior and did not introduce
  React Router, TanStack Query, or any new runtime dependency.
- Preserved Project Version alias canonicalization in
  `ProjectVersionRouteBoundary`.
- Kept editor/detail routes on their legacy local shells for later child
  ownership. They still pass through the existing Project Version route boundary
  where applicable.
- Added `docs/ui/122-portal-shell-baseline.md` and safe synthetic browser
  screenshots under `docs/ui/evidence/122/`.

Close-previous audit:

- Rechecked the implementation against this plan and master plan `005` on
  2026-07-26 from commit `6ddc6d5`.
- Found and fixed one route-composition defect: Project Version-owned list
  routes could render a list-page shell inside the Project Version route
  boundary shell, producing duplicate shell structure or an incorrect active
  navigation state.
- Added `renderShell={false}` content-only behavior for capture-session, guide,
  and interactive-demo list pages when they are rendered inside
  `ProjectVersionRouteBoundary`.
- Added active shell section/label props to `ProjectVersionRouteBoundary` and
  wired Project Version list routes to `capture_sessions`, `guides`, and
  `interactive_demos`.
- Kept standalone list pages backward compatible; they still render their own
  shared shell by default.

Expansion log:

- Expanded on 2026-07-26 from starting commit `bd73b08`.
- Rechecked against child `121`, master plan `005`, `CONTEXT.md`, ADRs `0019`
  through `0026`, `PRODUCT.md`, `DESIGN.md`, current route parser, current app
  entry point, API client, portal topbar, Project Version boundary, package
  dependencies, and development/browser setup docs.
- Chose no new major dependency by default.
- Recorded inherited child `121` browser-baseline carryover as a child `122`
  first step.
- Rechecked on 2026-07-26 against master `005`, implemented child `121`
  closeout, and current app structure. Tightened editor/detail ownership,
  no-fake-search/account behavior, query ownership, expired-session handling,
  and browser evidence requirements.

## Verification Record

Planning verification:

- `rtk pnpm exec prettier --check docs/plan/122-portal-architecture-and-application-shell.md`
  passed after expansion.
- `rtk git diff --check` passed after expansion.

Runtime verification:

- `rtk pnpm --filter web test -- src/lib/portalRouteMetadata.test.ts src/lib/portalNavigation.test.ts src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx src/features/project-version/ProjectVersionContextBar.test.tsx`
  passed.
- `rtk pnpm --filter web test -- src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx src/features/compliance/ComplianceTimelinePage.test.tsx src/features/project-activity/ProjectActivityTimelinePage.test.tsx src/features/guide/ProjectGuideListPage.test.tsx src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
  passed.
- `rtk pnpm --filter web exec tsc --noEmit` passed.
- `rtk pnpm --filter web run build` passed.
- Agent-browser opened the built preview at `http://localhost:3000/projects`
  with safe mocked read-only API responses and confirmed desktop shell,
  `390x844` mobile shell, keyboard focus reachability, and no page errors.
- Browser screenshots:
  - `docs/ui/evidence/122/projects-desktop-shell.png`
  - `docs/ui/evidence/122/projects-mobile-shell.png`

Close-previous verification:

- `rtk pnpm --filter web test -- src/lib/routes.test.ts src/appRouteGuards.test.ts src/lib/portalRouteMetadata.test.ts src/lib/portalNavigation.test.ts src/features/portal/PortalTopbar.test.tsx src/features/portal/PortalAppShell.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx src/features/project-version/ProjectVersionContextBar.test.tsx`
  passed.
- `rtk pnpm --filter web test -- src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx src/features/organization/OrganizationMembersPage.test.tsx src/features/compliance/ComplianceTimelinePage.test.tsx src/features/project-activity/ProjectActivityTimelinePage.test.tsx src/features/guide/ProjectGuideListPage.test.tsx src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
  passed.
- `rtk pnpm --filter web exec tsc --noEmit` passed.
- `rtk pnpm --filter web run lint` passed.
- `rtk pnpm --filter web run build` passed.
- `rtk git diff --check` passed.
- Agent-browser opened
  `http://localhost:3000/projects/project_1/versions/main/guides` with safe
  mocked read-only API responses and confirmed one topbar, one portal nav,
  `Guides` active, empty guide state visible, no retry state, and no page errors
  on desktop and `390x844` mobile.
- Additional browser screenshots:
  - `docs/ui/evidence/122/project-version-guides-desktop-shell.png`
  - `docs/ui/evidence/122/project-version-guides-mobile-shell.png`

## Leftovers And Handoff

Current handoff:

- Child `122` is complete after close-previous audit.
- The full authenticated workflow screenshot matrix remains blocked until a
  local backend, seeded database, and authenticated session are available.
- Browser evidence in this child uses safe synthetic mocked data for the
  `/projects` shell only; do not treat it as full authenticated workflow
  evidence.
- Do not add React Router, TanStack Query, or a headless primitive dependency
  without a new explicit acceptance decision.
- Keep public reader/embed routes isolated from authenticated shell behavior.
- Do not add code to `App.test.tsx`, `lib/api.ts`, or `lib/api.test.ts` unless a
  behavior-preserving split happens first.
- Carry into child `123`: recheck setup/login/organization shell behavior
  against this shared shell, preserve auth/setup semantics, and replace
  synthetic browser evidence with real authenticated screenshots if the local
  backend/session is available.
