# Child Plan 124: Project, Version, And Library UI Modernization

Date reserved: 2026-07-12

Date expanded: 2026-07-26

Status: Complete. Implemented, verified, browser-dogfooded, and closed on
2026-07-26.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Preceding plan:

- `docs/plan/123-authentication-setup-and-organization-ui-modernization.md`

Starting baseline for this expansion:

- Starting commit: `cdabfc4`.
- Worktree ownership: clean at expansion time.
- Actual child `123` result in this checkout: complete after close-previous
  audit at `cdabfc4`. Runtime implementation commit is `779c245`; closeout and
  browser evidence are recorded in
  `docs/plan/123-authentication-setup-and-organization-ui-modernization.md` and
  `docs/ui/123-auth-setup-organization-browser-evidence.md`.
- Actual child `122` dependency is complete. The reusable `PortalAppShell`,
  `portalRouteMetadata`, `portalNavigation`, and Project Version route shell
  ownership fixes exist in current code.
- Master plan `005` records children `109` through `123` as complete and child
  `124` as next.
- Project Version, Artifact Edition, Artifact Revision, Publication, Project
  Membership, Audit, and Access foundations from children `111` through `120`
  are present in code and contracts, but the UI-modernization sequence has not
  closed past child `123`.

## Sequence Gate

Prerequisite:

- Child `121` must be accepted and closed.
- Child `122` is complete in this checkout and provides the accepted Portal App
  shell and navigation helpers.
- Child `123` is complete in this checkout and provides the accepted
  auth/setup/invite/organization UI closeout and browser evidence.
- Before implementation, re-confirm the above gates are still true at the then
  current `HEAD`.

Next child:

- `125` Capture Portal UI Modernization, only after Project, Project Version,
  library, lifecycle, permission, responsive, accessibility, deep-link, and
  browser acceptance pass.

The sequence gate is satisfied at expansion time. Implementation must still
begin with the normal recheck because other agents may change the worktree.

## Goal

Modernize Project and Project Version management and provide a coherent library
for the artifact families that actually exist today: Captures, Guides, and
Interactive Demos.

The result should make `/projects`, Project workspace, Project settings, Project
Version selection/management, and library entry points feel like one operational
workspace without changing Project Version, Project Membership, Artifact
Edition, Artifact Revision, Publication, Capture source, or public-link
semantics.

## Current Runtime Facts

Implementation must start from these observed facts and recheck them again
before coding:

- `apps/web` is a React/Vite app with custom route parsing in
  `apps/web/src/lib/routes.ts`; it does not use React Router.
- `apps/web/src/App.tsx` currently owns route selection, setup gating, legacy
  Project-route redirects to the Default Project Version, Project Version route
  boundaries, and public reader routing.
- `apps/web/src/App.tsx` is 768 lines. Keep it under the repository 1000-line
  limit by extracting pure helpers instead of adding more route logic there.
- `apps/web/src/App.test.tsx` is already over the 1000-line limit at 1045 lines.
  Do not add tests there unless a behavior-preserving split happens first.
- `apps/web/src/lib/api.ts` is already over the 1000-line limit at 1627 lines.
  Do not add API helpers there unless a behavior-preserving split happens first.
- `apps/web/src/lib/api.test.ts` is already over the 1000-line limit at 2968
  lines. Do not add tests there unless a behavior-preserving split happens first.
- Current Project pages are:
  - `apps/web/src/features/project/ProjectListPage.tsx`;
  - `apps/web/src/features/project/ProjectWorkspacePage.tsx`;
  - `apps/web/src/features/project/ProjectSettingsPage.tsx`;
  - `apps/web/src/features/project/ProjectMembershipSection.tsx`.
- Current Project Version pages/components are:
  - `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`;
  - `apps/web/src/features/project-version/ProjectVersionContextBar.tsx`;
  - `apps/web/src/features/project-version/ProjectVersionManagementSection.tsx`.
- Current library entry pages are:
  - `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`;
  - `apps/web/src/features/guide/ProjectGuideListPage.tsx`;
  - `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`.
- `ProjectCaptureSessionListPage.tsx` is 547 lines and its test file is 634
  lines. Keep any 124 edits narrow; broad Capture workflow modernization belongs
  to child `125`.
- Current Project pages render through `PortalAppShell`, but their local
  `PortalShell` wrapper functions still need cleanup, context consistency, and
  source comments where touched.
- `ProjectWorkspacePage` still links legacy routes such as
  `/projects/:projectId/capture-sessions`, `/guides`, and `/interactive-demos`.
  Existing `App.tsx` redirects those legacy routes to the Default Project
  Version. Child `124` should prefer canonical Project Version URLs where the
  selected/default Project Version is already known, while preserving legacy
  links and redirects.
- `ProjectVersionRouteBoundary` currently resolves Project Version slugs,
  canonicalizes aliases while preserving search/hash, loads Project and Project
  Version lists, and renders a basic Project Version workspace.
- `ProjectVersionContextBar` currently suppresses extra ceremony when only
  `Main` exists by showing `Main context`; it shows a selector only when multiple
  active or archived Project Versions exist.
- `ProjectVersionManagementSection` currently supports create, edit, slug
  change, reorder, archive, restore, and set Default Project Version. It is terse
  and uses `window.confirm` for slug/default/archive confirmation. It currently
  displays Row Version in normal UI; keep Row Version hidden unless needed for
  conflict recovery copy.
- Child `122` added shared helpers in `apps/web/src/lib/portalNavigation.ts`,
  `apps/web/src/lib/portalRouteMetadata.ts`, and their tests. Prefer these
  helpers before adding a child-specific navigation helper.
- Child `123` added `EntryPageShell` for public entry flows. Do not wrap login,
  setup, or public invite acceptance in Project/library shell work.
- Project and Project Version contracts already exist in:
  - `packages/types/src/project.ts`;
  - `packages/types/src/project-version.ts`;
  - `packages/types/src/artifact-carry-forward.ts`.
- Server routes already exist for Project CRUD, Project Version CRUD/lifecycle,
  Project Version resolution, Project Version order/default, and Carry-Forward.
- Existing Project Version rules include:
  - every Project has a real Default `Main` Project Version;
  - Default Project Version cannot be archived;
  - archived Project Versions are directly addressable and read-only;
  - permanent former slugs must not be reused;
  - Project Versions inherit Project access from Project Membership;
  - Carry-Forward creates independent target Edition drafts and never keeps them
    synchronized with the source.
- No Documentation or Video runtime artifact family exists.
- Child `123` is shipped in this checkout. Preserve its sign-in, setup,
  invite-acceptance, organization-members, and expired-session behavior.

## Product And Design Rules

Use accepted source order:

1. `CONTEXT.md` and accepted ADRs for domain truth.
2. Master plan `005`.
3. Completed child `121`, `122`, and `123` closeouts once accepted.
4. `PRODUCT.md` and `DESIGN.md` only after accepted by the user.
5. Current code and tests for runtime facts.

Rules:

- Use `Project Version`, `Default Project Version`, `Project Version Alias`,
  `Artifact`, `Artifact Edition`, `Artifact Revision`, `Publication`,
  `Publication Sequence`, `Working Draft`, and `Row Version` according to
  `CONTEXT.md`.
- Do not use unqualified “version” in user-facing copy, plan updates, or new
  docs where it could mean Project Version, Row Version, Artifact Revision, or
  Publication Sequence.
- Do not label optimistic `version` fields as Project Versions. In UI, prefer
  hiding Row Version unless needed for conflict recovery. If exposed for
  advanced conflict recovery, label it `Row Version`.
- Do not label `publication_sequence` as a Project Version or Artifact Revision.
  Use `Publication Sequence` only where publication history is already in scope.
- Keep `Main` low-friction when it is the only Project Version. Avoid forcing
  users through release-management ceremony for simple teams.
- Make named Project Versions discoverable when more than one exists.
- Keep the library focused on current artifact families: Captures, Guides, and
  Interactive Demos.
- Do not add Documentation or Video cards, filters, creation commands,
  navigation items, empty-state prompts, or roadmap-like fake destinations.
- Do not turn Project pages into marketing hero layouts. Keep them dense,
  quiet, and scan-friendly.
- Use child `121` tokens and `@repo/ui` primitives where touching UI.
- Use the accepted child `122` shell for authenticated Project, Project Version,
  and library surfaces.
- Preserve the accepted child `123` sign-in/expired-session behavior.
- Lifecycle and destructive copy must state real effects:
  - Project archive hides the Project from active lists and makes Project-owned
    authoring read-only, but does not delete content.
  - Project restore returns it to active workflows.
  - Project Version archive makes that Project Version read-only and directly
    addressable, but does not delete content.
  - Default Project Version cannot be archived.
  - Changing Default Project Version never moves existing content.
  - Changing a Project Version slug creates a permanent former-slug alias.
  - Carry-Forward creates independent target drafts from selected source
    Editions and does not synchronize later edits.

## Exact Affected Files

Implementation is allowed to create or edit only these files unless the
pre-implementation recheck discovers directly related current-code drift and
records it in this plan before coding.

### Required plan and docs

- `docs/plan/124-project-version-and-library-ui-modernization.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only during closeout, after this child passes and is accepted.
- `docs/ui/124-project-version-library-browser-evidence.md` must be added for
  before/after browser evidence or honest blocked evidence.

### Route and app orchestration

- `apps/web/src/App.tsx`
- `apps/web/src/App.module.css`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`

Touch `App.tsx` only for required route orchestration that cannot live in a
pure helper. Do not add tests to `apps/web/src/App.test.tsx` unless it is first
split under a behavior-preserving refactor. Prefer focused helper tests.

### Project UI

- `apps/web/src/features/project/ProjectListPage.tsx`
- `apps/web/src/features/project/ProjectListPage.module.css`
- `apps/web/src/features/project/ProjectListPage.test.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.module.css`
- `apps/web/src/features/project/ProjectWorkspacePage.test.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.module.css`
- `apps/web/src/features/project/ProjectSettingsPage.test.tsx`
- `apps/web/src/features/project/ProjectMembershipSection.tsx` only for layout
  integration inside Project settings.
- `apps/web/src/features/project/ProjectMembershipSection.module.css` only for
  layout integration inside Project settings.
- `apps/web/src/features/project/ProjectMembershipSection.test.tsx` only if
  layout integration changes behavior.
- `apps/web/src/features/project/types.ts`
- `apps/web/src/features/project/useProjectAccess.ts`

### Project Version UI

- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.module.css`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.module.css`
- `apps/web/src/features/project-version/ProjectVersionContextBar.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.tsx`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.module.css`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.test.tsx`
- `apps/web/src/features/project-version/projectVersionNavigation.ts` may be
  added only if existing `portalNavigation.ts` and route helpers are not enough
  for same-family Project Version switching.
- `apps/web/src/features/project-version/projectVersionNavigation.test.ts` must
  be added if `projectVersionNavigation.ts` is added.

### Library entry surfaces

These files may be touched only for library composition, canonical Project
Version links, empty/loading/error/permission states, and shared shell/context
integration. Do not modernize the full Capture, Guide, or Interactive Demo
workflows in this child.

- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.module.css`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.module.css`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.module.css`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.tsx`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.module.css`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx`

### Portal shell dependency

These files are expected to exist after child `122`. Touch them only for small
Project, Project Version, and library integration points:

- `apps/web/src/features/portal/PortalAppShell.tsx`
- `apps/web/src/features/portal/PortalAppShell.module.css`
- `apps/web/src/features/portal/PortalAppShell.test.tsx`
- `apps/web/src/features/portal/PortalTopbar.tsx`
- `apps/web/src/features/portal/PortalTopbar.module.css`
- `apps/web/src/features/portal/PortalTopbar.test.tsx`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`

If these files do not exist at implementation time, stop. That means the
predecessor gate regressed.

### API client and shared types

Read-only unless the pre-implementation recheck proves a directly related
compatibility bug and the scope is confirmed:

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `packages/types/src/project.ts`
- `packages/types/src/project-version.ts`
- `packages/types/src/artifact-carry-forward.ts`
- `packages/types/src/capture.ts`
- `packages/types/src/guide.ts`
- `packages/types/src/demo.ts`
- `packages/types/src/artifact-revision.ts`
- `packages/types/src/publish.ts`

Do not add API helpers to over-limit `api.ts` unless a behavior-preserving split
happens first. This child should normally use existing helper functions.

### Server/API read-only boundary

Do not edit server files in this child unless the pre-implementation recheck
finds an existing contract bug and stops for scope confirmation:

- `apps/server/src/modules/project/**`
- `apps/server/src/modules/project-version/**`
- `apps/server/src/modules/project-membership/**`
- `apps/server/src/modules/capture-session/**`
- `apps/server/src/modules/guide/**`
- `apps/server/src/modules/interactive-demo/**`
- `apps/server/src/modules/artifact-carry-forward/**`
- `apps/server/src/modules/artifact-revision/**`
- `apps/server/src/modules/publish/**`
- `apps/server/src/config/**`
- `apps/server/src/db/**`

### Source comment requirement

Every new or touched TypeScript/TSX source file in `apps/web/src` must include:

- a terse `@fileoverview` JSDoc comment at the top;
- terse comments for exported components, helpers, and functions.

Existing touched TypeScript/TSX source files that lack `@fileoverview` must
receive one as part of the same edit.

## Explicit Non-Scope

Do not implement any of the following in child `124`:

- Child `122` shell implementation.
- Child `123` authentication, setup, invite, or organization-management
  modernization.
- Capture detail/editor workflow modernization, capture upload redesign,
  capture event editing, capture asset lifecycle redesign, or capture privacy
  changes. Those belong to child `125` unless this child only updates a
  list-level library entry point.
- Extension UI modernization. That belongs to child `126`.
- Guide editor, Guide reader, Guide publication controls, Guide revision
  preview, or Guide authoring modernization beyond list-level library entry
  integration. Those belong to child `127`.
- Interactive Demo editor, viewer, scene/hotspot/transition, publication, or
  revision modernization beyond list-level library entry integration. Those
  belong to child `128`.
- Full accessibility/motion/performance audit for all modernized workflows.
  That belongs to child `129`.
- Documentation-domain modeling or runtime UI. That begins only after child
  `131`.
- Video, search implementation, notifications, comments, approvals, analytics,
  importers, recording library, or AI suggestions.
- New Project Version permission model. Project Versions inherit Project
  Membership.
- New Organization roles or Project roles.
- Server auth, cookie, CORS, deployment, database, migration, audit/access,
  storage, public-link, or schema behavior.
- Changing public reader/embed route shapes.
- Changing Project, Project Version, Artifact Edition, Artifact Revision,
  Publication, Carry-Forward, or protected-asset semantics.
- Adding React Router, TanStack Query, Radix, Sonner, React Hook Form, or another
  major dependency.
- Dark mode.
- Marketing hero layouts, decorative gradient/orb backgrounds, fake
  Documentation/Video cards, fake filters, fake search, or links to unimplemented
  behavior.

## Routes And API Contracts

### Web routes

No route shape should change.

Must preserve:

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

Compatibility route rules:

- Legacy Project routes without `/versions/:versionSlug` must continue to
  resolve by redirecting/canonicalizing to the Default Project Version where
  current code already does that.
- Default Project Version redirects must preserve search and hash.
- Project Version Alias canonicalization must preserve search and hash and must
  not accept external redirects.
- Project-aware links should use `encodeURIComponent` for project IDs.
- Project Version-aware links should use `encodeURIComponent` for slugs.
- The Project workspace may prefer canonical Project Version URLs after the
  Default Project Version is known.
- Public Guide/Interactive Demo reader/embed routes must remain untouched except
  for verifying they are not affected by Project-library shell changes.

### Existing API contracts

No server API contract should change.

Continue using existing Project APIs:

- `GET /api/v1/projects`
- `GET /api/v1/projects?status=active`
- `GET /api/v1/projects?status=archived`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:projectId`
- `PATCH /api/v1/projects/:projectId`

Project archive/restore must continue through the existing Project update
contract by setting `status` to `archived` or `active`. Do not add permanent
Project delete UI in child `124`.

Continue using existing Project Version APIs:

- `GET /api/v1/projects/:projectId/versions`
- `POST /api/v1/projects/:projectId/versions`
- `GET /api/v1/projects/:projectId/versions/:projectVersionId`
- `PATCH /api/v1/projects/:projectId/versions/:projectVersionId`
- `GET /api/v1/projects/:projectId/versions/resolve/:slug`
- `PUT /api/v1/projects/:projectId/versions/order`
- `POST /api/v1/projects/:projectId/versions/:projectVersionId/archive`
- `POST /api/v1/projects/:projectId/versions/:projectVersionId/restore`
- `POST /api/v1/projects/:projectId/versions/:projectVersionId/set-default`

Continue using existing library APIs:

- `GET /api/v1/projects/:projectId/capture-sessions?project_version_id=:id`
- current Capture Session list creation/finalization APIs already used by the
  list page;
- `GET /api/v1/projects/:projectId/guides?project_version_id=:id`
- current Guide list creation-from-capture APIs already used by the list page;
- `GET /api/v1/projects/:projectId/interactive-demos?project_version_id=:id`
- current Interactive Demo list creation-from-capture APIs already used by the
  list page;
- `POST /api/v1/projects/:projectId/artifact-editions/carry-forward`.

Rules:

- Keep `credentials: "include"` for authenticated web API requests.
- Preserve `VITE_OSSIE_API_URL` behavior.
- Preserve current error envelopes and `ApiClientError` mapping.
- Do not add global caching for protected Project or library data.
- Do not persist Project, Project Version, or private library context in
  localStorage/sessionStorage.
- Do not log private IDs, storage keys, cookies, session IDs, invite tokens, or
  raw server errors in UI or docs.

## Schemas And Types

No database schema, Zod API schema, shared DTO, OpenAPI contract, domain package
type, or migration should change.

Allowed type work:

- Local React prop types.
- Local form-state types for Project and Project Version UI.
- Local display-state helpers for Project Version lifecycle, selector labels,
  library counts, empty states, or safe URL building.
- Local navigation types in child `122` helper files if they already exist.

Do not edit `packages/types/**` unless a focused recheck proves current UI and
current server contracts already disagree. If that happens, stop and record the
exact mismatch before changing shared types.

## Security, Permission, And Privacy Rules

Preserve these rules:

- Organization tenant isolation remains server-owned.
- Project Membership remains the source of internal Project access.
- Organization Owners have implicit Project Admin capability across Projects
  according to existing server contracts.
- Project Versions inherit Project access and do not create per-version
  permissions.
- Viewers can read authorized Project and Project Version library surfaces but
  cannot create, edit, archive, restore, set default, reorder, carry forward,
  publish, or mutate content.
- Editors can author and carry forward where current APIs allow, but cannot
  manage Project settings or Project Membership unless current server contracts
  allow it.
- Project Admins can manage Project settings, Project Versions, Project
  Membership, and safe asset purge where current APIs allow.
- Archived Projects must be treated as read-only in UI.
- Archived Project Versions must be treated as read-only in UI, but remain
  directly addressable and usable as Carry-Forward sources.
- Default Project Version archive must remain blocked and clearly explained.
- Setting a new Default Project Version must not imply content moves.
- Changing a Project Version slug must clearly state the previous slug becomes a
  permanent former slug alias and cannot be reused.
- Carry-Forward must state that target drafts are independent and later edits do
  not synchronize.
- Switching Project Version context must not show or mutate artifacts from
  another Project or Project Version.
- Public Publish Link access remains independent from internal Project
  Membership.
- Public reader/embed routes must not render authenticated Project shell,
  Project navigation, organization data, member data, or compliance/activity
  state.
- Do not weaken audit/access behavior or claim new audit/access UI exists.
- Evidence must use synthetic Projects, Project Versions, Captures, Guides,
  Interactive Demos, users, and organizations only.

## Migration And Backwards Compatibility

Database migration:

- None.

Runtime compatibility:

- Existing Project and Project Version deep links must keep resolving.
- Existing legacy Project links must continue to redirect/canonicalize to the
  Default Project Version where current code supports that.
- Existing public Guide and Interactive Demo links must remain unchanged.
- Existing Project Version Alias redirects must preserve query string and hash.
- Existing split API/web origin behavior must remain unchanged.
- Existing page-local fetching may remain.
- Existing mounted-component cancellation guards must remain where present so
  stale responses do not update unmounted pages.
- Existing server validation remains authoritative.
- Existing DB/smoke tests for Project Version creation, aliasing, lifecycle,
  default behavior, carry-forward, Project Membership, publication, and public
  link access must remain valid.

Styling compatibility:

- Continue using the accepted child `122` shell.
- Use child `121` tokens where editing CSS.
- Avoid a second permanent design system.
- Keep page CSS modules if that is the smallest safe change.
- Do not restyle capture details, Guide editors/readers, Interactive Demo
  editors/viewers, or public readers in this child.

Rollback:

- Rollback should be a normal source revert of UI, tests, and docs.
- No persistence rollback is required because no schema/data migration is
  allowed.

## Behavior Rules

### Project list

- Load active Projects by default.
- Allow viewing archived Projects if current API supports `status=archived`.
- Project cards/rows must show Project name, description where present,
  lifecycle, role, Default Project Version name, updated time, and open action.
- Do not expose organization IDs, actor IDs, raw color/icon fields, or Row
  Version in normal list UI.
- New Project form must trim name, slug, and description according to existing
  contract behavior.
- Empty Project list must explain the next real action without fake sample data.
- Creation errors must keep form values and map known conflicts safely.
- Duplicate create submission must be blocked while submitting.
- Successful create must navigate to the new Project's Default Project Version
  workspace.
- Archived Project open action must still deep-link safely; write actions inside
  the Project must be disabled according to server state.

### Project workspace and library

- The first Project workspace viewport should provide a usable library summary,
  not a landing-page hero.
- Show current Project, Project lifecycle, current/default Project Version, role,
  and real library entry points.
- Use only real artifact families:
  - Capture Sessions;
  - Guides;
  - Interactive Demos.
- Do not show Documentation or Video as active cards, filters, nav, or create
  actions.
- Prefer canonical Project Version links for library entry points when the
  selected/default Project Version is known.
- Keep legacy links compatible through existing redirects.
- Preserve useful density for large libraries and long names.
- Library filters must operate on real data only. Do not add fake filters.
- Library counts may be shown only if available from current API responses or
  already fetched page data. Do not add new aggregate APIs in this child.
- Permission states must separate unauthenticated, forbidden, not found, and
  recoverable load failure where current API errors allow.
- Project workspace and library entry links must use canonical Project Version
  URLs when the Default Project Version slug is already loaded. Legacy route
  redirects remain compatibility paths, not preferred new links.

### Project settings

- Project Admin-only settings behavior must remain.
- Non-admin users must see a safe settings-unavailable state.
- Project details form must preserve existing normalization and conflict
  messages.
- Project archive/restore must clearly state effects before or during action.
- Do not add permanent delete UI unless current server and plan explicitly
  support it; current child scope is archive/restore, not destructive deletion.
- Project Membership section may stay functionally unchanged except for layout
  integration.

### Project Version selector and context

- Suppress the selector when only active Default `Main` exists and no archived
  Project Versions exist.
- Show a Project Version selector when there are multiple active Project
  Versions or any archived Project Versions.
- Group active and archived Project Versions clearly.
- Label Default and archived states textually, not color alone.
- Long Project and Project Version names must not hide the selector or primary
  actions.
- Changing selection must navigate to the same family of canonical route where
  the current route has a safe equivalent:
  - workspace to workspace;
  - capture list to capture list;
  - Guide list to Guide list;
  - Interactive Demo list to Interactive Demo list.
- For detail/editor/revision routes, only preserve same-route switching if the
  current code can prove the target Artifact/Capture exists in that Project
  Version. Otherwise navigate to the target Project Version workspace or list.
- Never switch Project Version by mutating only local state while leaving route
  and API context stale.

### Project Version management

- Project Version create form must trim name, optional slug, optional
  description, and optional release date according to current shared schema.
- Project Version slug input must use the accepted slug format and let the server
  remain authoritative.
- Metadata save must include `expected_version` and handle conflicts.
- Reorder must include each active Project Version ID and its `expected_version`.
- Set Default must include Project Version `expected_version` and Project
  `expected_project_row_version`.
- Archive/restore must include `expected_version`.
- Default Project Version archive must be blocked in UI and safely handled if the
  server returns a conflict.
- Archived Project Version edit controls must be disabled or hidden.
- Archived Project edit controls must be disabled or hidden.
- Known error types must map to safe, specific messages:
  - `project_version_slug_conflict`;
  - `project_version_conflict`;
  - `default_project_version_archive_forbidden`;
  - `project_version_legacy_content_blocks_default_change`;
  - validation errors.
- Confirmation copy must explain real effects without overstating deletion,
  movement, synchronization, or publication changes.

### Carry-Forward entry point

- Keep Carry-Forward available only when the target Project and target Project
  Version are active and the current role can write.
- Carry-Forward target must be the currently selected Project Version.
- Source Project Version selection and artifact choices belong to the existing
  Carry-Forward page behavior. This child may polish its entry/context only.
- Do not change idempotency-key behavior or batch semantics.
- Do not imply Carry-Forward merges or keeps content synchronized.
- Use `Carry Forward` copy consistently. Do not shorten it to migration, clone,
  merge, sync, or duplicate.

### Loading, empty, errors, and concurrency

- Loading states should reserve stable space and avoid layout jumps.
- Empty states should name the current Project Version and real next action.
- Retry must be offered for recoverable load failures where current pages support
  retry.
- `unauthenticated` must preserve the current safe path through the accepted
  child `123` sign-in behavior.
- `forbidden` must show safe permission-denied copy where current errors expose
  it.
- `not_found` must not reveal private project/member/storage data.
- Conflict states must ask the user to reload or retry after refresh, not silently
  overwrite.
- Do not store form or Project Version state in browser storage.

## Implementation Order

Use TDD for source behavior changes.

1. Confirm gates and baseline.
   - Run `rtk git status --short`.
   - Record current `HEAD`.
   - Confirm children `121`, `122`, and `123` are complete in master plan `005`.
   - Confirm child `122` shell files exist.
   - Confirm child `123` closeout and browser evidence exist.
   - If any gate has regressed since this expansion, stop before coding.
   - Re-read this plan, child `123` closeout, master `005`, `CONTEXT.md`, ADRs
     `0021`, `0022`, `0024`, `0025`, `0026`, `PRODUCT.md`, `DESIGN.md`, and
     current touched code.
2. Capture safe browser baseline.
   - Add `docs/ui/124-project-version-library-browser-evidence.md`.
   - Record current or honestly blocked baseline for Project list, Project
     workspace, Project settings, Project Version selector/management, Carry
     Forward entry, Capture list, Guide list, and Interactive Demo list.
3. Add or extend Project Version navigation/helper tests first.
   - Prefer extending `portalNavigation.test.ts` and
     `portalRouteMetadata.test.ts`.
   - Add `projectVersionNavigation.test.ts` only if a helper is added.
   - Cover URL builders, current-family switching rules, default `Main`
     suppression, active/archived grouping labels, and safe fallback.
4. Add Project Version navigation/helper implementation.
   - Keep it pure and small.
   - Use `encodeURIComponent`.
   - Prefer existing `portalNavigation.ts` helpers before adding another helper.
   - Do not change route parser output unless a compatibility bug is proven.
5. Add/extend Project list tests first.
   - Cover active/archived filter, long names, create duplicate-submit blocking,
     conflict messages, empty state, safe open links, and no private IDs.
6. Modernize Project list.
   - Use accepted shell/tokens.
   - Preserve current Project creation behavior.
7. Add/extend Project workspace tests first.
   - Cover canonical library links, role/lifecycle states, no Documentation/Video
     entries, and legacy link compatibility where relevant.
8. Modernize Project workspace/library summary.
   - Prefer canonical Project Version library links.
   - Keep library focused on existing artifact families.
9. Add/extend Project settings tests first.
   - Cover admin/non-admin states, archive/restore copy, conflict messages,
     details save, and child Project Version section integration.
10. Modernize Project settings layout.
    - Preserve Project Membership behavior.
11. Add/extend Project Version context and management tests first.
    - Cover selector visibility, active/archived groups, alias canonicalization,
      create/edit/reorder/archive/restore/default conflicts, and read-only
      states.
12. Modernize Project Version context and management.
    - Keep server contracts unchanged.
    - Replace unsafe or unclear copy with accepted terminology.
13. Add/extend library list entry tests only where touched.
    - Capture Session list, Guide list, Interactive Demo list.
    - Cover selected Project Version context, empty states, permission/read-only
      states, and canonical links.
14. Modernize only list-level library entry surfaces.
15. Recheck route behavior.
    - Preserve public/setup/login/invite route ordering from prior children.
    - Preserve legacy Project route redirects and alias canonicalization.
    - Avoid adding tests to over-limit `App.test.tsx`.
16. Run focused verification.
17. Run broad verification.
18. Run agent-browser validation.
19. Update this plan with status, checklist, implementation log, verification
    notes, leftovers, and handoff.
20. Update master plan `005` only after acceptance passes.

## Test Plan

Focused web tests:

```bash
rtk pnpm --filter web test -- src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx src/features/project/ProjectMembershipSection.test.tsx
rtk pnpm --filter web test -- src/features/project-version/ProjectVersionContextBar.test.tsx src/features/project-version/ProjectVersionManagementSection.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx
rtk pnpm --filter web test -- src/features/capture-session/ProjectCaptureSessionListPage.test.tsx src/features/guide/ProjectGuideListPage.test.tsx src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx
rtk pnpm --filter web test -- src/lib/routes.test.ts src/appRouteGuards.test.ts
rtk pnpm --filter web check-types
```

If `projectVersionNavigation.ts` is added:

```bash
rtk pnpm --filter web test -- src/features/project-version/projectVersionNavigation.test.ts
```

Focused server/API contract tests if UI behavior depends on confirming current
contracts or if any server/shared contract drift is found:

```bash
rtk pnpm --filter server test -- src/modules/project/project.routes.test.ts src/modules/project-version/project-version.routes.test.ts src/modules/artifact-carry-forward/artifact-carry-forward.routes.test.ts
rtk pnpm --filter types test -- src/project.test.ts src/project-version.test.ts src/artifact-carry-forward.test.ts
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
- Run DB/smoke if browser validation uses a real seeded Project Version,
  Carry-Forward, Project Membership, publication, or public-link fixture, or if
  any server/API file changes:

```bash
rtk pnpm --filter server run test:db
rtk pnpm --filter server test:smoke
```

Documentation checks:

```bash
rtk pnpm exec prettier --check docs/plan/124-project-version-and-library-ui-modernization.md docs/ui/124-project-version-library-browser-evidence.md
```

## Agent-Browser Validation Requirements

Use the `dogfood-ossie` procedure with `agent-browser` when available.

Required browser evidence:

- Use safe synthetic data only.
- Keep public and authenticated browser contexts separate.
- Validate desktop and narrow mobile near `390x844`.
- Validate 200% zoom/reflow for Project list, Project workspace, Project
  settings, Project Version selector, Project Version management, and library
  list pages.
- Validate keyboard-only operation:
  - Project list filter, Project create open/cancel/submit;
  - Project workspace library links;
  - Project settings form save and archive/restore action;
  - Project Version selector;
  - Project Version create/edit/reorder/archive/restore/set Default actions;
  - Carry-Forward entry point;
  - Capture/Guide/Interactive Demo list navigation;
  - shell navigation and sign-out inherited from children `122`/`123`.
- Validate visible focus.
- Validate console errors and failed network requests.
- Validate no private data appears in screenshots.

Minimum browser journeys:

- `/projects` active Project list.
- `/projects` archived Project filter.
- Project creation success and conflict/error where safe fixtures allow.
- Legacy `/projects/:projectId` route redirecting to Default Project Version.
- Canonical `/projects/:projectId/versions/:versionSlug` workspace.
- Project Version selector with one `Main` only.
- Project Version selector with multiple active and archived Project Versions.
- Alias route canonicalization preserving query and hash.
- Project Version create, edit, reorder, set Default, archive, restore, and
  conflict handling where safe fixtures allow.
- Project settings admin and non-admin states.
- Archived Project read-only state.
- Archived Project Version read-only state.
- Carry-Forward entry visible for writer on active target and hidden for Viewer
  or archived target.
- Capture Session list for selected Project Version.
- Guide list for selected Project Version.
- Interactive Demo list for selected Project Version.
- Public Guide route and public Interactive Demo route still render without
  authenticated shell or protected API calls.

If a seeded authenticated local runtime or Project Version fixture cannot be
established, record the exact blocked reason in
`docs/ui/124-project-version-library-browser-evidence.md` and this plan. Do not
claim the browser matrix passed.

## Acceptance Criteria

This child can close only when all of the following are true:

- Children `121`, `122`, and `123` are accepted, closed, and recorded in master
  `005`.
- Project list, Project creation, Project workspace, Project settings, Project
  archive/restore, Project Version selection, Project Version creation,
  Project Version edit, reorder, archive/restore, set Default, Carry-Forward
  entry, and library entry behavior remain compatible.
- Project and Project Version surfaces use the accepted child `122` shell.
- Accepted child `123` sign-in/expired-session behavior is preserved.
- Switching Project Version context cannot show or mutate artifacts from another
  Project or Project Version.
- `Main` remains low-friction when it is the only Project Version.
- Named and archived Project Versions remain discoverable when present.
- Documentation and Video are not shown as active runtime library families.
- Row Version, Project Version, Artifact Revision, and Publication Sequence copy
  is correct and unambiguous.
- Lifecycle/destructive copy accurately states effects on drafts, Publications,
  aliases, and content movement.
- Permission states and write controls match Project Membership and lifecycle
  rules.
- No server/API/schema/migration/auth/cookie/CORS/public-link behavior changes
  were made without an explicit stop-and-accept decision.
- Focused tests and broad checks pass or pre-existing/environment failures are
  recorded with evidence.
- Required browser checks pass or are honestly blocked with exact reasons.
- `docs/ui/124-project-version-library-browser-evidence.md` records browser
  evidence or blocked evidence.
- This plan has status, checklist, implementation log, verification notes,
  leftovers, and handoff updated.
- Master plan `005` is updated only after this child is accepted and closed.

## Critical Decision Triggers

Stop and ask before continuing if implementation requires any of these:

- implementing before children `121`, `122`, and `123` are complete and
  accepted;
- changing Project Version, Project Version Alias, Default Project Version,
  Artifact, Artifact Edition, Working Draft, Artifact Revision, Publication,
  Publication Sequence, Carry-Forward, Project Membership, protected asset,
  audit/access, public-link, or Capture source semantics;
- changing route shapes or breaking legacy Project deep links;
- changing server API contracts, schemas, database migrations, or shared DTOs;
- adding Project Version-specific permissions;
- adding Documentation, Video, search, comments, approvals, notifications,
  account settings, or fake navigation;
- adding a major dependency;
- exposing private data in docs/screenshots;
- touching Capture detail, Guide editor/reader, Interactive Demo editor/viewer,
  extension, or public-link behavior beyond list-level/library integration.

## Implementation Checklist

- [x] Confirm children `121`, `122`, and `123` are accepted/closed.
- [x] Confirm child `122` shell files exist.
- [x] Confirm child `123` browser evidence and closeout exist.
- [x] Capture or honestly block browser baseline evidence.
- [x] Add/extend Project Version navigation/helper tests.
- [x] Add Project Version navigation/helper only if needed.
- [x] Add/extend Project list tests.
- [x] Modernize Project list.
- [x] Add/extend Project workspace tests.
- [x] Modernize Project workspace and real library summary.
- [x] Add/extend Project settings tests.
- [x] Modernize Project settings layout.
- [x] Add/extend Project Version context/management tests.
- [x] Modernize Project Version context and management.
- [x] Add/extend touched library list tests.
- [x] Modernize only list-level library entry surfaces.
- [x] Preserve route/API/security/domain behavior.
- [x] Run focused tests.
- [x] Run broad checks.
- [x] Run required agent-browser validation or record exact blocked evidence.
- [x] Update implementation log, verification record, leftovers, and handoff.
- [x] Update master plan `005` only after acceptance.

## Implementation Log

Expansion log:

- Re-expanded on 2026-07-26 from starting commit `cdabfc4` after child `123`
  completed and was audited.
- Rechecked against master plan `005`, completed child `123`, completed child
  `122` shell/navigation helpers, `CONTEXT.md`, ADRs `0021`, `0022`, `0024`,
  `0025`, and `0026`, `PRODUCT.md`, `DESIGN.md`, current route helpers,
  Project/Project Version UI, library list entry pages, shared Project Version
  contracts, Carry-Forward contracts, and server Project/Project Version route
  surfaces.
- Removed stale predecessor-blocking language from the earlier expansion. The
  gate is satisfied at this commit, but implementation must recheck the gate at
  its current `HEAD`.
- Recorded that no server/schema/API migration is expected for this child.
- Kept implementation limited to UI, routing helpers, focused tests, docs, and
  browser evidence.
- Rechecked on 2026-07-26 against master plan `005`, completed child `123`, and
  current code. Fixed local `PortalShell` wrapper wording, clarified the
  source-comment rule for TypeScript/TSX files, and made Project
  archive/restore ownership explicit.

Runtime implementation:

- Implemented in `567359a` (`feat(web): modernize project version library UI`).
- Project list and App route smoke tests now expect the active Project empty
  state copy that explains the next action without fake artifact families.
- Project list cards keep the canonical Default Project Version workspace link.
- Project workspace library cards now use canonical Project Version URLs for
  Capture sessions, Guides, and Interactive demos.
- Project workspace now shows the Default Project Version name when the Project
  data is loaded.
- Project settings lifecycle copy now says `Restore project` / `Project
restored.` for archived Projects while preserving the existing `status:
"active"` API contract.
- Project Version context switching reuses `portalNavigation` and preserves the
  selected route family for Capture sessions, Guides, and Interactive demos.
- Project Version management hides Row Version from normal UI, keeps Default
  Project Version archive disabled, and explains `Default Project Version
cannot be archived.`
- No server API, database schema, migration, auth, permission, public-link,
  Capture source, Publication, Artifact Edition, or Artifact Revision behavior
  changed.

Close-previous audit:

- Rechecked on 2026-07-26 at `0e2937b` against this child plan, master plan
  `005`, `CONTEXT.md`, ADRs `0021`, `0022`, `0024`, `0025`, and `0026`,
  `PRODUCT.md`, `DESIGN.md`, and the implemented runtime files.
- Found and fixed one plan/process gap: `App.test.tsx` had been touched while
  still exceeding the 1000-line rule. The public reader/embed smoke tests were
  split into `apps/web/src/AppPublicRoutes.test.tsx`, reducing
  `App.test.tsx` to 893 lines without changing behavior.
- Found and fixed one evidence wording gap: browser evidence was a mocked smoke
  run, not the full child-plan browser matrix. The evidence now records the
  exact blocked matrix items instead of overstating coverage.
- Found no runtime behavior mismatch, server/API/schema/migration/security
  change, out-of-scope implementation file, Documentation/Video runtime UI, or
  Project Version/domain terminology issue requiring a product decision.

## Verification Record

Planning verification:

- `rtk pnpm exec prettier --write docs/plan/124-project-version-and-library-ui-modernization.md`
  completed with no formatting changes.
- `rtk git diff --check` passed after expansion and recheck.
- `rtk git status --short` was clean before the 2026-07-26 re-expansion.
- `rtk git rev-parse --short HEAD` returned `cdabfc4`.
- `rtk rg --files` and `rtk wc -l` confirmed current Project, Project Version,
  library, portal, route, and API helper files. `App.test.tsx`, `api.ts`, and
  `api.test.ts` are already over the repository 1000-line rule, so
  implementation should avoid adding to them unless a behavior-preserving split
  happens first.
- Recheck on 2026-07-26 found no contradiction with master plan `005` or the
  implemented child `123` closeout after the plan fixes above.

Runtime verification:

- RED tests failed before implementation for the new canonical Project Version
  workspace links, same-family Project Version switching, hidden Row Version
  copy, active Project empty-state copy, Project settings restore copy, and
  Default Project Version archive explanation.
- `rtk pnpm --filter web test -- src/features/project/ProjectListPage.test.tsx src/features/project/ProjectSettingsPage.test.tsx`
  passed after implementation.
- `rtk pnpm --filter web test -- src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx src/features/project/ProjectMembershipSection.test.tsx src/features/project-version/ProjectVersionContextBar.test.tsx src/features/project-version/ProjectVersionManagementSection.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx src/features/capture-session/ProjectCaptureSessionListPage.test.tsx src/features/guide/ProjectGuideListPage.test.tsx src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx src/lib/routes.test.ts src/appRouteGuards.test.ts src/lib/portalNavigation.test.ts src/lib/portalRouteMetadata.test.ts`
  passed with 97 tests.
- `rtk pnpm --filter web exec prettier --check ...` passed for touched source
  and test files.
- `rtk pnpm --filter web check-types` passed.
- `rtk pnpm --filter web lint` passed.
- `rtk pnpm --filter web build` passed.
- `rtk pnpm --filter web test` passed with 294 tests.
- `rtk pnpm check-types` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm test` is not available because the root package has no `test`
  script. The master-plan recursive test command remains the correct broad
  test shape when needed across packages.
- `rtk git diff --check` passed before the implementation commit.
- Close-previous focused recheck after the App test split:
  `rtk pnpm --filter web test -- src/App.test.tsx src/AppPublicRoutes.test.tsx src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx src/features/project-version/ProjectVersionContextBar.test.tsx src/features/project-version/ProjectVersionManagementSection.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
  passed with 64 tests.
- Close-previous phase-focused suite after the App test split:
  `rtk pnpm --filter web test -- src/App.test.tsx src/AppPublicRoutes.test.tsx src/features/project/ProjectListPage.test.tsx src/features/project/ProjectWorkspacePage.test.tsx src/features/project/ProjectSettingsPage.test.tsx src/features/project/ProjectMembershipSection.test.tsx src/features/project-version/ProjectVersionContextBar.test.tsx src/features/project-version/ProjectVersionManagementSection.test.tsx src/features/project-version/ProjectVersionRouteBoundary.test.tsx src/features/capture-session/ProjectCaptureSessionListPage.test.tsx src/features/guide/ProjectGuideListPage.test.tsx src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx src/lib/routes.test.ts src/appRouteGuards.test.ts src/lib/portalNavigation.test.ts src/lib/portalRouteMetadata.test.ts`
  passed with 117 tests.
- Close-previous broad checks passed:
  - `rtk pnpm --filter web test` passed with 294 tests.
  - `rtk pnpm --filter web check-types` passed.
  - `rtk pnpm --filter web lint` passed.
  - `rtk pnpm --filter web build` passed.
  - `rtk pnpm -r --if-present test` passed.
  - `rtk pnpm check-types` passed.
  - `rtk pnpm lint` passed.
  - `rtk pnpm build` passed.

Browser verification:

- Added `docs/ui/124-project-version-library-browser-evidence.md`.
- Captured screenshots under `docs/ui/evidence/124/`.
- Used `agent-browser` against a production web build served locally with Vite
  preview and safe mocked responses.
- Verified desktop and narrow mobile Project list and Project Version
  management pages as browser smoke coverage.
- Verified canonical Default Project Version Project-card link,
  `/projects/project_1/versions/main` workspace, q3 Project Version switching,
  Guides route-family preservation while switching back to Main, and the
  disabled Default Project Version archive rule.
- Final checked browser sessions had no console messages, no page errors, and
  all checked API requests returned HTTP 200.
- Full child-plan browser matrix was not completed because no seeded
  authenticated local API/runtime fixture was established. Exact blocked items
  are recorded in `docs/ui/124-project-version-library-browser-evidence.md`.

## Leftovers And Handoff

Current handoff:

- Child `124` is complete in this checkout.
- Carry into child `125`: modernize Capture portal detail/editor flows only
  after rechecking the canonical Project Version route context added here.
- Keep using canonical Project Version URLs for Capture library entry points:
  `/projects/:projectId/versions/:slug/capture-sessions`.
- Keep the Project Version context selector route-family behavior when Capture
  detail/editor routes are modernized.
- Do not fold Guide authoring/reader modernization into child `125`; that
  belongs to child `127`.
- Do not fold Interactive Demo authoring/viewer modernization into child `125`;
  that belongs to child `128`.
- No runtime blocking leftovers remain for child `125`.
- Browser carry-forward for child `125`: if child `125` needs to claim full
  browser acceptance, establish a seeded authenticated local fixture instead of
  relying only on URL-level mocked responses. Include keyboard-only and 200%
  zoom/reflow checks for Capture list/detail/editor paths.
