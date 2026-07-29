# Child Plan 129: Accessibility, Motion, Performance, And Browser Dogfood

Date reserved: 2026-07-12

Expanded: 2026-07-29

Rechecked: 2026-07-29

Status: Complete on 2026-07-29. Accessibility, motion, reflow, performance,
long-session, direct-extension, installed-toolbar, DB, smoke, and workspace
verification passed with only documented environment/tooling blocks.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Predecessor:

- `docs/plan/128-interactive-demo-authoring-and-viewer-ui-modernization.md`

## Sequence Gate And Starting Checkpoint

Children `121` through `128` are Complete. Child `128` passed its
close-previous audit at repository commit `4cd4b52`. The worktree was clean
when this plan was expanded.

The accepted starting product now has:

- the shared Quiet Versioned Workbench design tokens and five surface
  archetypes from child `121`;
- the authenticated portal shell, route metadata, breadcrumbs, Organization,
  Project, and Project Version context from child `122`;
- modernized setup/authentication, Organization, Project/Version/library,
  Capture, extension, Guide, and Interactive Demo workflows from children
  `123` through `128`;
- deterministic, guarded Capture, Guide, and Interactive Demo browser fixtures;
- a verified installed Manifest V3 toolbar-popup path using Chrome for Testing
  and temporary Puppeteer automation outside the repository;
- public Guide and Interactive Demo readers/embeds with immutable Publication
  and multi-Project-Version Publish Link behavior;
- a web production baseline of:
  - JS `466.56 kB` raw / `129.85 kB` gzip;
  - CSS `73.19 kB` raw / `14.17 kB` gzip;
- an extension close-previous baseline of:
  - popup JS `256.13 kB` raw / `78.20 kB` gzip;
  - popup CSS `16.20 kB` raw / `4.24 kB` gzip;
  - background entry `10.10 kB` raw / `2.92 kB` gzip;
  - shared capture-command chunk `9.81 kB` raw / `2.44 kB` gzip;
  - content script `3.12 kB` raw / `1.33 kB` gzip.

The available headless environment currently has `agent-browser` `0.33.1` and
Chrome for Testing `151.0.7922.47`. No Firefox, WebKit, or Safari engine is
currently installed. Chromium is therefore the required complete browser
journey. Secondary-engine checks are required only where a supported engine is
actually available; unavailable engines must be recorded as blocked, never
reported as passing.

Next child:

- `130` Pre-Documentation Closeout, only after this child fixes all scoped
  critical/high-impact findings, records all accepted exceptions or blocked
  capabilities, and closes with current evidence.

## Goal

Audit the modernized product as one connected operational experience and repair
cross-screen accessibility, motion, responsive, performance, and real-browser
defects without reopening the accepted domain-specific designs.

This child is a verification-and-hardening phase, not another visual redesign.
It must:

1. prove the connected workflows work for the accepted roles, lifecycle states,
   Project Versions, readers, embeds, and extension path;
2. close defects that repeat across surfaces or materially block an accepted
   journey;
3. measure current performance and investigate the web/extension growth already
   recorded by children `126` and `128`;
4. leave reusable accessibility, motion, responsive, browser, and performance
   guidance for child `130` and the later Documentation work.

## Completion Criteria

Child `129` is Complete only when:

1. every required journey has a dated Pass, Fixed, Blocked, or Accepted
   Exception result with reproducible evidence;
2. no scoped critical or high-impact accessibility defect remains open;
3. all required operations are keyboard-operable, focus-visible, and correctly
   announced where the underlying browser interaction permits it;
4. dialogs, destructive actions, errors, async status, read-only state, and
   permission denial are understandable without relying on color alone;
5. reduced motion preserves the same information, focus movement, and commands;
6. desktop, `390 × 844`, `320`-pixel extension popup, 200% zoom/reflow, and wide
   editor checks have no hidden critical controls, incoherent overlap, text
   clipping, dead navigation/control, blank required media/canvas, or
   unexplained horizontal document overflow;
7. public readers/embeds remain isolated from authenticated shell/session
   behavior and preserve the full public access-state matrix;
8. the real installed extension toolbar path is revalidated separately from
   direct popup-page automation;
9. current bundle/runtime metrics are recorded, material regressions are
   explained or fixed, and no performance optimization changes behavior;
10. focused tests, full web/extension checks, DB integration, V1 smoke,
    workspace types/lint/tests, builds, formatting, and `git diff --check` pass;
11. this plan, the child `129` evidence document, `DESIGN.md` only where rules
    were clarified, and master `005` are updated accurately at closeout.

## Canonical Constraints

The following accepted behavior is invariant:

- Organization tenant isolation and explicit Organization/Project authorization;
- Project Membership role gates and Organization Owner overrides;
- exact Project Version scoping and canonical Project-Version-qualified routes;
- immutable Capture source records and privacy-preserving capture defaults;
- separate Guide Block/Step/Annotation and Demo Scene/Hotspot/Transition models;
- mutable Edition/Working Draft Row Version conflict behavior;
- immutable Revisions and Publications;
- independently mutable Publish Link access and multi-Project-Version manifests;
- protected shared Assets and strict public allowlist projections;
- setup/login/invite/session privacy;
- extension instance/API/portal separation, no token in URLs, and current
  browser permissions;
- explicit save semantics and no automatic retry/merge of ambiguous mutations.

Use the accepted domain language from `CONTEXT.md` and ADRs `0002`, `0003`,
`0005`, `0006`, `0011`, `0012`, `0018`, and `0021` through `0026`. Do not use
accessibility or performance work as a reason to change product semantics.

## Review Guidance Hierarchy

Before implementation, use the repository procedures named by `AGENTS.md`:

- `design-ossie-ui` for cross-product composition and design review;
- `dogfood-ossie` for browser evidence;
- the reviewed Impeccable critique/audit/polish/harden/adapt passes as
  applicable;
- the reviewed accessibility guidance for WCAG/keyboard/focus review;
- `review-animations` for every transition added or changed;
- React best-practices guidance only for a measured rendering/state problem.

These are optional development tools, never application dependencies. If the
active harness does not expose a reviewed skill, apply its checked-in
repository guidance manually and record the limitation. `CONTEXT.md`, ADRs,
`DESIGN.md`, this plan, and current product behavior outrank generic advice. Do
not invoke the rejected unpinned web-design-guidelines workflow.

## Current Cross-Product Runtime Map

The connected flow and ownership direction is:

```text
shared UI tokens/primitives
  -> entry/setup/authentication
  -> PortalAppShell + Organization/Project/Project Version context
  -> Project libraries
  -> Capture source authoring
     -> extension Capture path
     -> Guide generation/editor/preview/Revision/Publication/public reader/embed
     -> Demo generation/editor/preview/Revision/Publication/public reader/embed
  -> Activity/Compliance evidence
```

Shared behavior crosses these boundaries:

- `PortalAppShell`, `PortalTopbar`, route metadata, navigation, breadcrumbs, and
  Project Version context own global wayfinding and reflow.
- `@repo/ui` Button/Input/Select/Textarea/Label/Alert/Badge primitives own much
  of the shared focus, contrast, disabled, and control-height behavior.
- `ArtifactPublishingPanel`, Revision history, Carry-Forward, and public Project
  Version selectors are shared by Guide and Interactive Demo.
- Guide and Demo retain type-specific authoring/rendering composition even when
  their accessibility rules are compared.
- the extension is a separate constrained Chromium surface with popup lifetime,
  service-worker, content-script, and browser-action boundaries.

Known inherited observations that must be retested rather than assumed fixed:

- child `128` axe runs had zero violations but three indeterminate layered
  Textarea contrast checks;
- the web JS gzip baseline has grown `7.78 kB` (`6.4%`) from child `121`'s
  `122.07 kB` design-review baseline;
- child `128` added `12.75 kB` raw / `4.55 kB` gzip JS and `7.03 kB` raw /
  `1.13 kB` gzip CSS over child `127`;
- extension direct popup and installed toolbar evidence passed, but their
  evidence classes must remain distinct;
- `apps/web/src/index.css` suppresses horizontal overflow globally, so reflow
  acceptance must compare `scrollWidth`, bounding boxes, and critical-control
  reachability instead of trusting the absence of a visible scrollbar;
- custom modal behavior exists in the Guide screenshot viewer and Publication
  rollback UI and requires explicit focus/escape/background-inert review;
- several legacy admin/activity CSS modules still contain app-local color and
  layout values. Change them only when the audit proves a contrast, reflow,
  focus, or cross-product coherence defect.

## Scope

### In scope

- connected critique, accessibility audit, motion review, responsive
  adaptation, performance measurement, and browser dogfood across all completed
  web and extension workflows;
- focused fixes for reproducible defects found by that audit;
- shared primitive/token fixes when the same defect affects multiple surfaces;
- local component fixes when the defect is isolated;
- semantic landmarks, heading order, accessible names/descriptions, form
  errors, live regions, focus order/return/visibility, keyboard operation,
  dialog behavior, contrast, state communication, and touch target review;
- loading, empty, error, not-found, unauthenticated, permission-denied,
  read-only, archived, destructive, conflict, broken-media, and retry states;
- reduced-motion and animation-token enforcement;
- narrow mobile, wide editor, popup width, and 200% zoom/reflow hardening;
- duplicate-submit, stale-response, layout-shift, broken-image, failed-request,
  console-error, and long-session checks;
- bundle-size, Web Vitals, navigation, editor-interaction, image-loading, and
  layout-stability measurement;
- deterministic fixture corrections only when required to make an accepted
  existing state reproducible;
- behavior-parity comparison against the accepted children `123` through `128`
  closeout/evidence records, using current deterministic fixtures rather than
  treating a visual refresh as permission to change workflow semantics;
- safe evidence and cross-product design-rule clarification.

### Explicit non-scope

- a new visual direction, new information architecture, or wholesale CSS
  rewrite;
- dark mode;
- Documentation or Video navigation/domain implementation;
- changing Project Version, Edition, Revision, Publication, Publication
  Sequence, or Publish Link semantics;
- changing Guide or Demo persistence/composition;
- changing public URLs, access modes, password/session policy, or cookies;
- changing Capture immutability, data retention, privacy defaults, or raw input/
  HTML exclusions;
- adding analytics, telemetry, remote performance reporting, screenshot
  comparison services, or customer-data fixtures;
- adopting React Router, TanStack Query, Radix, a generic accessibility
  framework, a repository-owned browser harness, or another major dependency;
- adding Puppeteer/Playwright as an application or repository dependency. The
  already-proven installed-extension path may reuse temporary environment
  automation outside the repository;
- browser support claims for an unavailable engine;
- fixing unrelated server/domain defects discovered during dogfood;
- changing migrations or reseeding production/development data;
- committing cookies, session tokens, fixture passwords, browser profiles,
  HARs containing credentials, raw captured pages, or unsafe screenshots;
- refreshing all historical screenshots. Commit only safe, useful child `129`
  evidence after the repaired state is accepted.

## Exact File Ownership

This is a findings-driven hardening child. Files listed below are the complete
permitted repair set. Do not touch every file mechanically; change a file only
when a failing test or reproducible browser finding identifies its ownership.
Any runtime file outside this set requires a plan amendment before editing.

### Required planning/evidence files

- `docs/plan/129-accessibility-motion-performance-and-browser-dogfood.md`
- `docs/ui/129-accessibility-motion-performance-browser-dogfood.md` (new)
- `docs/ui/evidence/129/` (new only for accepted synthetic screenshots)
- `DESIGN.md` (only for clarified reusable rules or measured baselines)
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  (closeout only)

### Shared web foundation permitted when evidence is cross-cutting

- `apps/web/src/index.css`
- `apps/web/index.html` (only if a document-language/title defect cannot be
  fixed through route metadata)
- `apps/web/src/App.tsx`
- `apps/web/src/App.module.css`
- `apps/web/src/App.test.tsx`
- `apps/web/src/AppCaptureRoutes.test.tsx`
- `apps/web/src/AppPublicRoutes.test.tsx`
- `apps/web/src/index-document.test.ts`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`
- `apps/web/src/features/portal/PortalAppShell.tsx`
- `apps/web/src/features/portal/PortalAppShell.module.css`
- `apps/web/src/features/portal/PortalAppShell.test.tsx`
- `apps/web/src/features/portal/PortalTopbar.tsx`
- `apps/web/src/features/portal/PortalTopbar.module.css`
- `apps/web/src/features/portal/PortalTopbar.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.tsx`
- `apps/web/src/features/project-version/ProjectVersionContextBar.module.css`
- `apps/web/src/features/project-version/ProjectVersionContextBar.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.module.css`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/design-system/DesignSystemReviewPage.tsx`
- `apps/web/src/features/design-system/DesignSystemReviewPage.module.css`
- `apps/web/src/features/design-system/DesignSystemReviewPage.test.tsx`

Route/parser files may change only for accessibility/performance internals that
preserve every current route. Child `129` owns no new production route.
Design-review files may change only if measurement justifies excluding their
development-only code from the production bundle or a shared-token example must
track a repaired primitive.

### Shared UI package permitted when the defect repeats

- `packages/ui/src/button.tsx`
- `packages/ui/src/button.test.tsx`
- `packages/ui/src/card.tsx`
- `packages/ui/src/input.tsx`
- `packages/ui/src/select.tsx`
- `packages/ui/src/separator.tsx`
- `packages/ui/src/textarea.tsx`
- `packages/ui/src/label.tsx`
- `packages/ui/src/alert.tsx`
- `packages/ui/src/badge.tsx`
- `packages/ui/src/primitives.test.tsx`
- `packages/ui/src/tokens.tsx`
- `packages/ui/src/tokens.test.tsx`

Do not move a one-surface fix into `@repo/ui`. Use the shared package only when
at least two real callers need the same semantic/focus/contrast behavior.

### Entry, Organization, settings, activity, and compliance surfaces

- `apps/web/src/features/auth/EntryPageShell.tsx`
- `apps/web/src/features/auth/EntryPageShell.module.css`
- `apps/web/src/features/auth/EntryPageShell.test.tsx`
- `apps/web/src/features/auth/LoginPage.tsx`
- `apps/web/src/features/auth/LoginPage.module.css`
- `apps/web/src/features/auth/LoginPage.test.tsx`
- `apps/web/src/features/auth/navigation.ts`
- `apps/web/src/features/auth/types.ts`
- `apps/web/src/features/setup/FirstRunSetupPage.tsx`
- `apps/web/src/features/setup/FirstRunSetupPage.module.css`
- `apps/web/src/features/setup/FirstRunSetupPage.test.tsx`
- `apps/web/src/features/setup/types.ts`
- `apps/web/src/features/organization/InviteAcceptPage.tsx`
- `apps/web/src/features/organization/InviteAcceptPage.module.css`
- `apps/web/src/features/organization/InviteAcceptPage.test.tsx`
- `apps/web/src/features/organization/OrganizationMembersPage.tsx`
- `apps/web/src/features/organization/OrganizationMembersPage.module.css`
- `apps/web/src/features/organization/OrganizationMembersPage.test.tsx`
- `apps/web/src/features/organization/types.ts`
- `apps/web/src/features/project/ProjectMembershipSection.tsx`
- `apps/web/src/features/project/ProjectMembershipSection.module.css`
- `apps/web/src/features/project/ProjectMembershipSection.test.tsx`
- `apps/web/src/features/project/types.ts`
- `apps/web/src/features/project/useProjectAccess.ts`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.tsx`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.module.css`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.test.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.module.css`
- `apps/web/src/features/compliance/ComplianceTimelinePage.test.tsx`

### Project, Project Version, and library surfaces

- `apps/web/src/features/project/ProjectListPage.tsx`
- `apps/web/src/features/project/ProjectListPage.module.css`
- `apps/web/src/features/project/ProjectListPage.test.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.module.css`
- `apps/web/src/features/project/ProjectWorkspacePage.test.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.module.css`
- `apps/web/src/features/project/ProjectSettingsPage.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.tsx`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.module.css`
- `apps/web/src/features/project-version/ProjectVersionManagementSection.test.tsx`

### Capture surfaces

- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.module.css`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailGeneration.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailHelpers.ts`
- `apps/web/src/features/capture-session/CaptureSessionDetailSections.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailShell.tsx`
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.tsx`
- `apps/web/src/features/capture-session/CaptureAssetLifecycleControls.test.tsx`
- `apps/web/src/features/capture-session/types.ts`

### Shared Artifact, Guide, and publication surfaces

- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.tsx`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.module.css`
- `apps/web/src/features/artifact-carry-forward/ProjectCarryForwardPage.test.tsx`
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.tsx`
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.module.css`
- `apps/web/src/features/artifact-revision/ArtifactRevisionHistoryPage.test.tsx`
- `apps/web/src/features/artifact-revision/ArtifactRevisionPreview.module.css`
- `apps/web/src/features/artifact-revision/GuideRevisionPreviewPage.tsx`
- `apps/web/src/features/artifact-revision/GuideRevisionPreviewPage.test.tsx`
- `apps/web/src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.tsx`
- `apps/web/src/features/artifact-revision/InteractiveDemoRevisionPreviewPage.test.tsx`
- `apps/web/src/features/publish/ArtifactPublishingPanel.tsx`
- `apps/web/src/features/publish/ArtifactPublishingPanel.module.css`
- `apps/web/src/features/publish/ArtifactPublishingPanel.test.tsx`
- `apps/web/src/features/publish/PublicVersionSelector.tsx`
- `apps/web/src/features/publish/PublicVersionSelector.module.css`
- `apps/web/src/features/publish/PublicVersionSelector.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.module.css`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.module.css`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorWorkbench.tsx`
- `apps/web/src/features/guide/guideEditorHelpers.ts`
- `apps/web/src/features/guide/guideEditorHelpers.test.ts`
- `apps/web/src/features/guide/GuideAnnotationEditor.tsx`
- `apps/web/src/features/guide/GuideAnnotationEditor.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.module.css`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/guide/GuideScreenshotViewer.tsx`
- `apps/web/src/features/guide/GuideScreenshotViewer.module.css`
- `apps/web/src/features/guide/GuideScreenshotViewer.test.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.module.css`
- `apps/web/src/features/guide/PublicGuideReaderPage.test.tsx`
- `apps/web/src/features/guide/types.ts`

### Interactive Demo surfaces

- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.module.css`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorLoadBoundary.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorShell.tsx`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorContracts.ts`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.ts`
- `apps/web/src/features/interactive-demo/interactiveDemoEditorHelpers.test.ts`
- `apps/web/src/features/interactive-demo/interactiveDemoLoadState.ts`
- `apps/web/src/features/interactive-demo/InteractiveDemoWorkbench.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoWorkbench.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoSceneEditor.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoSceneEditor.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoSceneEditor.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoCanvas.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoCanvas.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoCanvas.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoRenderer.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoRenderer.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoRenderer.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoPreviewPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoPreviewPage.module.css`
- `apps/web/src/features/interactive-demo/InteractiveDemoPreviewPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoReadOnlyPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoReadOnlyPage.module.css`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.module.css`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx`
- `apps/web/src/features/interactive-demo/types.ts`

The repaired child `128` editor is 995 lines. Other near-limit controllers are
`CaptureSessionDetailPage.tsx` at 989 lines, extension `App.tsx` at 977 lines,
and `GuideEditorPage.tsx` at 901 lines at this checkpoint. Child `129` must not
push a source file past 1,000 lines or make an already-over-limit file larger.
Place a local fix in an existing extracted component/helper where ownership is
clear; if a new extraction is actually required, add its exact path to this plan
before creating it. Do not fold cross-product audit logic back into a route
controller.

### Extension surfaces

- `apps/extension/src/App.tsx`
- `apps/extension/src/App.test.tsx`
- `apps/extension/index.html` (only for a demonstrated popup
  language/title defect)
- `apps/extension/src/index.css`
- `apps/extension/src/popup/PopupShell.tsx`
- `apps/extension/src/popup/ConnectInstancePanel.tsx`
- `apps/extension/src/popup/ConnectInstancePanel.test.tsx`
- `apps/extension/src/popup/SignInPanel.tsx`
- `apps/extension/src/popup/SignInPanel.test.tsx`
- `apps/extension/src/popup/CaptureContextPanel.tsx`
- `apps/extension/src/popup/CaptureStatusPanel.tsx`
- `apps/extension/src/popup/CaptureWorkspace.tsx`
- `apps/extension/src/popup/CaptureWorkspace.accessibility.test.tsx`
- `apps/extension/src/popup/CaptureWorkspace.active.test.tsx`
- `apps/extension/src/popup/CaptureWorkspace.recovery.test.tsx`
- `apps/extension/src/popup/CaptureWorkspace.selection.test.tsx`
- `apps/extension/src/popup/LocalCaptureRecovery.tsx`
- `apps/extension/src/popup/PortalSettingsPanel.tsx`
- `apps/extension/src/popup/helpers.ts`
- `apps/extension/src/popup/helpers.test.ts`
- `apps/extension/src/popup/test-helpers.tsx`

Background/content-script/capture-controller files are verification targets but
not expected UI repair files. Change them only if the installed-toolbar dogfood
proves a critical/high-impact functional or performance defect and amend the
plan first.

### Fixture files permitted only for a proven evidence gap

- `apps/server/src/dev-fixtures/capture-portal-browser-fixture.ts`
- `apps/server/src/dev-fixtures/capture-portal-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/capture-portal-browser-fixture.db.integration.test.ts`
- `apps/server/src/dev-fixtures/guide-browser-fixture.ts`
- `apps/server/src/dev-fixtures/guide-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/guide-browser-fixture.db.integration.test.ts`
- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.ts`
- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/interactive-demo-browser-fixture.db.integration.test.ts`

Do not create a new all-product fixture merely for convenience. The existing
seeders reset the guarded test database and must be run as separate Capture,
Guide, and Demo evidence phases.

## Routes And API Contracts

### Web routes

No new production route is expected. Preserve and validate:

```text
/
/setup
/login
/invites/:token
/projects
/projects/:projectId
/projects/:projectId/settings
/projects/:projectId/activity
/projects/:projectId/compliance
/organization/members
/organization/compliance

/projects/:projectId/versions/:versionSlug
/projects/:projectId/versions/:versionSlug/capture-sessions
/projects/:projectId/versions/:versionSlug/capture-sessions/:captureSessionId
/projects/:projectId/versions/:versionSlug/guides
/projects/:projectId/versions/:versionSlug/guides/:guideId
/projects/:projectId/versions/:versionSlug/guides/:guideId/preview
/projects/:projectId/versions/:versionSlug/guides/:guideId/revisions
/projects/:projectId/versions/:versionSlug/guides/:guideId/revisions/:revisionNumber
/projects/:projectId/versions/:versionSlug/interactive-demos
/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId
/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId/preview
/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId/revisions
/projects/:projectId/versions/:versionSlug/interactive-demos/:interactiveDemoId/revisions/:revisionNumber
/projects/:projectId/versions/:versionSlug/carry-forward

/p/:slug
/p/:slug/embed
/p/:slug/versions/:versionSlug
/p/:slug/versions/:versionSlug/embed
/d/:slug
/d/:slug/embed
/d/:slug/versions/:versionSlug
/d/:slug/versions/:versionSlug/embed
```

`/` remains the Project-list alias. Preserve these legacy non-Project-Version
routes and their current Default Project Version redirect/compatibility
behavior:

```text
/projects/:projectId/capture-sessions
/projects/:projectId/capture-sessions/:captureSessionId
/projects/:projectId/guides
/projects/:projectId/guides/:guideId
/projects/:projectId/guides/:guideId/preview
/projects/:projectId/interactive-demos
/projects/:projectId/interactive-demos/:interactiveDemoId
/projects/:projectId/interactive-demos/:interactiveDemoId/preview
```

`/__design-system` remains development-only and unreachable in production.

Accessibility/performance fixes must not change route identity, encoded path
segments, redirect targets, browser back/forward behavior, auth return paths,
public reader/embed mode, or canonical Project Version selection.

### API contracts

This child should exercise, not redesign, the existing API families:

- `/api/v1/public/instance`, `/api/v1/setup/first-run`;
- `/api/v1/authentication/login|me|logout`;
- `/api/v1/organization/members`, `/api/v1/organization/invites`,
  `/api/v1/public/invites/:token`;
- `/api/v1/projects`, Project Memberships, and Project Versions;
- Project Capture Sessions, Assets, Events, ordering, completion, lifecycle,
  and Project Version reassignment;
- Guide and Interactive Demo Edition/Working Draft mutations;
- Revision, Carry-Forward, Publication, and Publish Link routes;
- `/api/v1/public/publish-links/:slug` and viewer-session unlock routes;
- Organization/Project compliance and Project activity routes.

Rules:

- request methods, bodies, response DTOs, error envelopes, Row Version fields,
  pagination, cookies, bearer handling, and public query parameters are frozen;
- duplicate-submit fixes must disable/coalesce only the UI command and must not
  invent idempotency or automatic retries;
- performance work must not cache authenticated responses into public routes or
  share user-specific state across Organizations, Projects, or Project Versions;
- client-side lazy loading may be considered only if route behavior, loading/
  error recovery, and production reachability remain tested;
- a required API/schema/permission change is a critical scope expansion: stop,
  document the evidence, and amend/recheck before implementation.

## Schemas And Types

No database, shared DTO, or domain-policy type change is expected.

Reuse without modification unless a proven defect requires a separately
approved expansion:

- `PortalRoute`, `PortalNavigationItem`, `PortalBreadcrumb`, and route metadata;
- auth/setup/invite/member contracts from `@repo/types`;
- Project, Project Membership, and Project Version contracts;
- Capture Session/Event/Asset contracts and constants;
- Guide/Demo Edition, Working Draft, Block/Step/Annotation,
  Scene/Hotspot/Transition, Revision, Publication, and Publish Link contracts;
- extension settings/capture command adapter types;
- shared semantic UI tokens and existing primitive props.

Permitted local type changes are limited to view-only props/state needed for:

- accessible name/description relationships;
- focus return/initial focus;
- status announcement severity or politeness;
- reduced-motion presentation;
- stable loading/media dimensions;
- a test-only/browser-fixture state that contains no production data.

Do not copy shared API types into web or extension components. Do not add a
generic Guide/Demo content type.

## Accessibility Behavior Rules

Target WCAG 2.2 AA for the scoped web and extension journeys.

### Structure and names

- Each rendered page/popup state has one useful `h1`; headings descend without
  skipping solely for styling.
- The HTML language remains correct, and each route/state has a concise,
  descriptive document title. Route title updates must not leak inaccessible
  Organization, Project, Artifact, invite, or public-link details.
- Authenticated pages have one coherent banner/navigation/main structure;
  public readers/embeds do not inherit portal landmarks.
- Repeated authenticated navigation has a keyboard-operable bypass path to the
  page `main` region; the destination is focusable without introducing a
  second tab stop during ordinary navigation.
- Every form control has a persistent visible label except a conventional
  icon-only control with an accurate accessible name and, where useful, a
  tooltip.
- Repeated controls include object/position context in their accessible name.
- Status, badges, and lifecycle state do not rely on color alone.
- Long Organization, Project, Project Version, Artifact, Scene, and file names
  wrap or truncate without hiding their full accessible name.

### Keyboard and focus

- All accepted commands are reachable and operable without a pointer.
- Focus order follows visual/task order and never enters hidden/disabled UI.
- `:focus-visible` is never clipped or fully obscured by overflow containers,
  sticky UI, dialogs, or transient notices.
- Route changes and major Scene/reader transitions place focus at the accepted
  destination without unexpected scroll jumps.
- Custom dialogs trap focus, set appropriate initial focus, close with Escape
  when cancellation is safe, make background content non-interactive, and
  return focus to the opener.
- Native `window.confirm` behavior may remain where already accepted; do not
  replace every confirmation solely for consistency.
- Hotspot pointer move/resize retains the existing keyboard alternative.

### Errors and async state

- Validation errors identify the field/command and use `role="alert"` only when
  interruption is warranted.
- Background refreshes and successful saves use non-duplicative polite status
  announcements.
- Pending commands expose truthful busy/disabled state and block duplicate
  submission.
- Failure retains reviewable local input and provides a safe retry/reload path.
- Permission/read-only state removes or disables mutation commands and explains
  why; it never reveals inaccessible resource existence.
- Broken media has stable dimensions, alternative text/state, and disables
  geometry interactions that depend on the media.

### Contrast and targets

- Text, icons, borders needed to identify controls, focus rings, selected state,
  disabled state, and Hotspot outlines meet the accepted AA/non-text contrast
  rules.
- Manually resolve the layered Textarea checks that axe cannot determine;
  record computed foreground/background and visual state rather than marking
  an indeterminate check as an automatic pass.
- Pointer targets meet WCAG 2.2 AA's `24 × 24` CSS-pixel minimum or a documented
  spacing/equivalent-control exception. Frequent controls retain the accepted
  shared 40px control height where layout permits. Tiny geometry handles must
  retain a larger operable hit area and keyboard alternative.

Technically justified exceptions must include the rule, exact node/surface,
reason, user impact, compensating behavior, owner, and follow-up. A critical or
high-impact exception blocks child closeout.

## Motion Rules

Inventory every real CSS/DOM transition before changing motion.

- fast feedback uses the accepted `150ms` token;
- normal spatial/state transition uses `220ms`;
- easing is `cubic-bezier(0.16, 1, 0.3, 1)`;
- no decorative looping, parallax, autoplay, or attention-seeking motion;
- animation must use transform/opacity where possible and avoid layout
  thrashing;
- every transition is interruptible and resolves to the latest state;
- focus and live-region feedback cannot wait for animation completion;
- reduced motion uses instant state change while preserving content, focus,
  history, and status semantics;
- extension and web reduced-motion behavior must be consistent even though
  their CSS is separate;
- do not add motion merely to satisfy this audit.

Run the reviewed animation checklist for any transition added or changed:
purpose, duration, easing, continuity, interruption, compositor safety, focus,
and reduced-motion equivalent. If the repository skill is unavailable in the
active agent environment, apply these recorded checks manually and state that
fact; do not fabricate a skill result.

## Responsive And Reflow Rules

Required widths/states:

- standard desktop (record exact viewport used);
- wide authoring workbench, at least `1440 × 900`;
- narrow web/mobile near `390 × 844`;
- extension direct page at `360 × 600` and `320 × 600`;
- 200% zoom/reflow proxy at `640` CSS pixels for web and `180` CSS pixels for
  the fixed-width extension popup;
- long-name/dense-content fixtures;
- reader and embed checked separately.

Acceptance:

- no critical control is hidden behind horizontal overflow;
- global `overflow-x: hidden` does not count as success—compare document/body
  `scrollWidth` with `clientWidth`, inspect clipped bounding boxes, and prove
  controls remain reachable;
- editor rails/inspectors may scroll locally when necessary but the document
  must not become an unusable two-dimensional canvas;
- media/canvas dimensions remain stable before load and after failure;
- no text clipping loses essential state or command meaning;
- mobile navigation, dialogs, date controls, Publication/Link controls, Scene/
  Block rails, and public Project Version selectors remain usable;
- 200% reflow does not require horizontal scrolling for ordinary reading and
  operations, except a documented essential two-dimensional media surface with
  an equivalent accessible control path.

## Performance Rules And Decision Gate

### Build budgets

Record production build output before the first runtime change and after each
logical repair group.

- Web starting baseline: JS `466.56/129.85 kB` raw/gzip; CSS
  `73.19/14.17 kB`.
- Extension starting baselines are recorded in the starting checkpoint above.
- Any final increase greater than `2%` gzip in a web or extension entry/chunk
  requires an itemized explanation and explicit acceptance in this plan.
- Do not optimize solely to recover child `121`'s smaller review-route bundle;
  first establish which production code is used by representative routes.

### Runtime measurements

Use the same local production preview, synthetic fixture, browser version,
viewport, and warm/cold conditions for before/after comparisons. Record at
least three runs and use the median for:

- public Guide reader;
- public Interactive Demo reader and embed;
- Project Version workspace/library;
- Guide editor;
- Interactive Demo editor;
- extension direct popup page.

Record:

- LCP, CLS, FCP, TTFB, and available INP/interaction timing from
  `agent-browser vitals --json`;
- navigation/load duration and failed requests;
- route JS/CSS/network transfer;
- image load/failure behavior;
- click-to-visible-pending feedback for save/publish/capture commands;
- long editor session responsiveness after repeated Scene/Block selection and
  modal open/close;
- listener/timer/request and JS-heap trends during the defined long-session
  workload where the browser exposes reliable metrics;
- React render diagnostics only when a reproducible rerender problem exists,
  using a separate `agent-browser --enable react-devtools` session.

The long-session workload must be reproducible: after a warm load, perform at
least 30 Scene/Block selection cycles, 20 open/close cycles for an available
dialog or inspector, and 10 save/preview navigation cycles without a reload.
Record starting/final interaction timing, duplicate requests, console errors,
and listener/timer counts. Record JS heap at the start, midpoint, and end only
where the browser exposes a comparable metric. Heap collection unavailable in
the current browser/tooling is a dated blocked metric, not a pass; progressive
interaction slowdown, duplicated listeners/requests, or retained UI behavior
still requires investigation.

Decision rules:

- CLS above `0.1`, LCP above `2.5s`, or interaction latency above `200ms` in the
  controlled local production run is an investigation trigger, not an automatic
  product failure; explain fixture/server effects and fix avoidable client work;
- a median regression greater than `10%` from this child's own starting run is
  material and must be fixed or explicitly justified;
- duplicate network requests, repeated large media fetches, growing listener/
  timer counts, or progressively slower editor actions are defects even if a
  single Web Vital remains below a threshold;
- noisy heap growth alone is an investigation signal, not proof of a leak.
  Reproduce a retained-growth trend under the same workload before changing
  ownership or memoization;
- route-level dynamic imports/code splitting are allowed only after measurement
  identifies a real route cost. Add loading/error tests, preserve deep links and
  auth/public isolation, and do not introduce a routing dependency;
- specifically measure whether the development-only Design System review page
  contributes materially to production output before changing its import
  boundary; it must remain unreachable in production either way;
- no memoization, cache, lazy loading, or preload should be added without a
  measured caller and a focused regression test where behavior can change.

## Security, Permission, And Privacy Rules

- Use only the disposable `ossie_test` database, testing runtime, localhost
  services, and synthetic fixture media.
- Derive browser session names per worktree/role. Keep Admin, Editor, Viewer,
  signed-out, and public sessions isolated.
- Never print or commit session tokens/passwords. Set synthetic cookies through
  the browser context or use existing safe login flows.
- Do not capture evidence while a one-time invite URL, password field contents,
  viewer-session secret, or authentication material is visible. Redaction after
  capture is a fallback, not the default workflow.
- Public pages must not make shell-triggered authenticated calls or reveal
  Organization, actor, source Capture, storage key, Edition/Working Draft, or
  internal ID metadata excluded by the accepted public DTO.
- Viewer/read-only/archived contexts must never expose enabled mutation
  commands.
- Accessibility copy must not distinguish inaccessible from nonexistent private
  resources.
- Do not weaken CSP, CORS, extension host permissions, content-script matching,
  password policy, cookie options, or public viewer sessions.
- HAR/video/screenshot evidence must be inspected for credentials and private
  payloads before any commit. Prefer semantic snapshots and written results.
- Fixture seeders remain guarded by testing-runtime/database-name/storage-root
  checks. Never point them at development or production data.

## Migration And Backwards Compatibility

Expected migration impact: none.

Do not edit:

- `apps/server/src/db/migrations/**`;
- persisted domain schemas;
- shared request/response DTOs;
- public URL or cookie formats;
- extension manifest permissions or storage keys.

Compatibility requirements:

- current deep links, legacy Default Project Version redirects, auth return
  paths, public reader/embed URLs, and extension portal handoff remain valid;
- immutable historical Revisions/Publications render identically apart from
  accessibility/presentation fixes;
- CSS/token changes preserve semantic status distinctions and accepted
  desktop density;
- reduced-motion changes preserve behavior, not merely visual appearance;
- build optimization must not move dev-only review code into a reachable
  production route;
- no test database reset/reseed is required for users. Browser fixture reseeds
  are test-only and repeatable.

If a migration, public contract, permission, privacy, destructive-data,
retention, browser-permission, or major dependency change appears necessary,
stop and request plan amendment.

## Fixture And Evidence Strategy

Use the existing fixtures in separate reset-safe phases:

1. `seed:capture-portal-browser-fixture`
   - Admin/Viewer, active/named/archived Project Versions, Capture lifecycle,
     Project/Version libraries, extension portal handoff, activity/compliance;
2. `seed:guide-browser-fixture`
   - Guide active/empty/archived Editions, media states, Revision/Publication,
     Carry-Forward, and public access matrix;
3. `seed:interactive-demo-browser-fixture`
   - Demo active/empty/archived Editions, twelve Scenes, media/Transition states,
     conflict, Revision/Publication, multi-Version manifest, and public matrix.

The Demo fixture does not contain the Guide fixture, and both compose/reset the
Capture fixture. Never seed Guide and Demo once and assume both coexist.

Before changing behavior, derive a parity checklist from the accepted closeout
and browser-evidence documents for children `123` through `128`. The comparison
is semantic—commands, role gates, states, URLs, local-draft/conflict behavior,
and public results—not pixel identity with the pre-modernization UI.

Setup/login/invite checks:

- use the real setup state only against a separately reset disposable test DB
  or the existing focused setup browser adapter;
- restore/reseed before continuing other journeys;
- create invites only for synthetic `example.test` identities;
- expire/revoke sessions or invites only through existing test-safe APIs/DB
  setup, never production code shortcuts.

Extension:

- direct popup-page automation validates DOM/reflow/keyboard/reduced-motion;
- the installed-toolbar phase builds `apps/extension/dist`, loads it unpacked
  in Chrome for Testing, invokes the real action, and verifies API/portal state;
- reuse the documented child `126` split: `agent-browser` for direct popup and
  portal evidence, temporary Puppeteer automation outside the repository for
  the true toolbar popup when `agent-browser` cannot attach to browser chrome;
- do not add or commit the temporary automation/profile/target page.

## Implementation Strategy And TDD Order

Do not begin with a broad polish patch. Work in evidence-backed slices:

### Slice 1: Establish immutable baseline and issue register

1. Record HEAD, worktree ownership, tool/browser versions, build sizes, and
   production-preview vitals before changes.
2. Create
   `docs/ui/129-accessibility-motion-performance-browser-dogfood.md` with a
   route/state matrix and issue register.
3. Load the current `agent-browser` core and dogfood guidance and the dogfood
   issue taxonomy before browser actions.
4. Run read-only automated axe, keyboard, reflow, console, network, motion, and
   vitals sampling on representative surfaces.
5. Record the accepted behavior-parity checklist and a representative
   after-modernization screenshot baseline in temporary storage using only safe
   synthetic data. Use `agent-browser diff screenshot --baseline` after each
   relevant repair group to detect unintended visual movement; inspect results
   semantically rather than applying an arbitrary pixel threshold.
6. Classify each finding:
   - critical/severity one: security/privacy/data-integrity failure, silent data
     loss, or a core accepted journey unavailable to all affected users; fix
     immediately and block closeout;
   - high/severity two: WCAG AA failure or accepted journey blocked for a role,
     keyboard user, viewport, or public access state without a reasonable
     workaround; fix in this child and block closeout;
   - medium: material degradation with a reasonable workaround; fix when safely
     scoped or explicitly assign with evidence;
   - low/cosmetic: no task/meaning/access loss; record only when useful for
     child `130`;
   - unrelated domain/server issue: record, do not absorb.
7. Reproduce every browser issue twice before creating evidence.

### Slice 2: Shared primitives, shell, and entry/admin fixes

For each confirmed issue:

1. add the smallest failing component/helper test;
2. fix shared primitive only when at least two callers need it;
3. otherwise fix the owning page/component;
4. run focused tests and relevant browser route immediately;
5. record the resolution and evidence in the issue register.

Priority order:

- focus visibility/clipping;
- label/description/error relationships;
- landmark/heading duplication;
- dialog focus and keyboard behavior;
- duplicate status announcements;
- shared contrast/disabled/selected state;
- mobile shell and long-name reflow.

### Slice 3: Capture, Guide, Demo, and shared Artifact fixes

Use separate fixture phases. Prioritize:

- upload/capture progress and duplicate submission;
- media loading/failure/layout stability;
- editor rail/inspector keyboard and reflow;
- Guide screenshot viewer and Publication rollback dialogs;
- dirty/failure/conflict announcements without local loss;
- public reader/embed focus, selector, password/error, and broken-media states;
- normalized Demo Hotspot geometry parity.

Do not redesign Guide or Demo composition.

### Slice 4: Extension direct and installed-toolbar fixes

1. add failing extension component/controller coverage for each finding;
2. fix popup semantics/reflow/motion without changing capture contracts;
3. run direct popup-page browser checks;
4. build and run the true installed toolbar action flow;
5. verify exactly-once Asset/Event effects and canonical portal handoff;
6. record direct-page and toolbar results separately.

### Slice 5: Measured performance repair

1. compare baselines and find the actual route/component/network cost;
2. add a focused behavior/loading test before any lazy loading or render-state
   ownership change;
3. make the smallest measured improvement;
4. rerun three-run medians and builds under the same conditions;
5. revert speculative complexity that does not materially improve evidence.

### Slice 6: Repeat-until-clean closeout

1. rerun the complete matrix after all fixes;
2. inspect source diff for unrelated behavior/API/security changes;
3. repeat axe/manual contrast, keyboard, focus, reflow, reduced-motion, console,
   network, vitals, and installed extension checks;
4. resolve or explicitly classify every issue;
5. update evidence, plan status/checklists/log/leftovers, `DESIGN.md` only where
   reusable rules changed, and master `005` completed items;
6. commit only owned changes in small logical commits.

## Focused Test Plan

Select tests by changed ownership. Minimum focused suites:

```bash
pnpm --filter @repo/ui test
pnpm --filter web test -- \
  src/features/portal \
  src/features/auth \
  src/features/setup \
  src/features/organization \
  src/features/project \
  src/features/project-version \
  src/features/capture-session \
  src/features/artifact-carry-forward \
  src/features/artifact-revision \
  src/features/publish \
  src/features/guide \
  src/features/interactive-demo
pnpm --filter extension test
```

Add focused regression coverage, as applicable, for:

- one `h1`, landmarks, accessible names, `aria-describedby`, and errors;
- visible focus and focus return/trap/Escape in custom dialogs;
- keyboard order/operation and no hidden focus targets;
- polite versus assertive status behavior and no duplicate announcements;
- pending/duplicate-submit blocking;
- reduced-motion class/media behavior;
- stable media/canvas dimensions and broken-image safety;
- responsive class/state ownership where a pure/component assertion is useful;
- route loading/error behavior for any dynamic import;
- preserved auth/public/permission gates.

CSS snapshots alone are insufficient. Prefer behavior and DOM semantics; browser
evidence owns actual layout, contrast, and computed motion.

## Broad Verification Commands

Use `rtk` where installed; the current environment does not have it, so the
same commands may be run directly with that fallback recorded.

```bash
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web build

pnpm --filter extension check-types
pnpm --filter extension lint
pnpm --filter extension test
pnpm --filter extension build

pnpm --filter server test:setup
pnpm --filter server test:db
pnpm --filter server test:smoke

pnpm check-types
pnpm lint
pnpm -r --if-present test
pnpm build
pnpm exec prettier --check \
  DESIGN.md \
  docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md \
  docs/plan/129-accessibility-motion-performance-and-browser-dogfood.md \
  docs/ui/129-accessibility-motion-performance-browser-dogfood.md
git diff --check
```

Run fixture-specific DB tests after any fixture change. No migration command is
required beyond `test:setup`; confirm migration status remains unchanged.

## Agent-Browser Validation Requirements

Use `agent-browser` directly, never `npx agent-browser`. Before commands:

```bash
agent-browser skills get core
agent-browser skills get dogfood
agent-browser doctor --offline --quick
```

Use named, isolated sessions. Re-snapshot after every navigation or DOM-changing
action because element refs become stale. Prefer semantic snapshots/locators,
specific waits, `agent-browser a11y --json`, `errors`, `console`, `network
requests`, and `vitals --json`.

### Authenticated role/state matrix

At minimum:

- signed out and expired/revoked session;
- Organization Owner/Project Admin;
- Project Editor;
- Project Viewer;
- active and archived Project;
- Default, named active, and archived Project Version;
- active, empty, and archived Guide/Demo Edition;
- permission denied/not found without existence disclosure.

### Required connected journeys

1. first-run setup, login, safe return path, logout, and session-expiry recovery;
2. create/revoke/expire/accept Organization invite and inspect member access;
3. create Project, verify Default Project Version, create named Project Version,
   switch context, and verify archived/read-only behavior;
4. manually create/use/finalize a Capture and inspect upload/order/failure state;
5. run true installed extension Capture, reopen popup, capture automatic/manual
   steps, pause/resume, finish, and open canonical named-Version portal detail;
6. generate Guide from Capture, edit, preview, checkpoint, Carry-Forward,
   publish, and inspect immutable Revision;
7. repeat generation/edit/preview/checkpoint/Carry-Forward/publish for Demo;
8. exercise public/restricted/password/wrong-password/expired/revoked/not-found/
   transient-retry/missing-Version Guide reader and embed;
9. repeat the public matrix for Demo reader/embed and traverse a Hotspot;
10. archive/restore and verify Viewer/read-only/permission-denied controls;
11. inspect Project activity and Organization/Project compliance timelines.

### Accessibility/motion/responsive checks per representative surface

- `snapshot -i -c` for interactive order and names;
- keyboard-only traversal and operation with visible focus;
- custom dialog open/tab/shift-tab/Escape/return-focus;
- `a11y --tags wcag2a,wcag2aa,wcag22aa --json`;
- manual contrast for axe-incomplete Textareas and layered states;
- desktop, wide editor, `390 × 844`, and 200% reflow;
- extension `360`, `320`, and `180` CSS-pixel checks;
- normal and reduced-motion media settings;
- document/body width, clipped-control, and local-scroll inspection;
- console/runtime errors and failed network requests;
- loading, empty, error, permission, destructive, read-only, archived,
  conflict, and broken-media states where present.

### Performance checks

- serve production web/extension builds for final measurements;
- run three cold/warm samples and record medians;
- record browser/version, commit, route, fixture, viewport, cache state, build
  sizes, vitals, requests, and anomalies;
- use React diagnostics only for a confirmed render issue;
- do not compare dev-server timings to production-preview baselines.
- run the defined long-session workload for both Guide and Demo editors; record
  blocked heap metrics honestly when the current Chromium/tooling cannot expose
  comparable samples.

### Dogfood evidence protocol

For a confirmed static issue, capture one annotated screenshot. For a confirmed
interactive issue, record a temporary repro video and step screenshots before
fixing. Append the issue to the evidence document immediately. After repair,
record the same steps as passing.

Use accepted children `123` through `128` screenshots as composition/state
references, not pixel-perfect golden files. Refresh or add committed product
screenshots only after the corresponding finding and full acceptance matrix
pass, and only when the image communicates a materially changed accepted state.
Do not mechanically replace historical evidence.

Raw dogfood output, auth state, browser profiles, videos, and HARs remain in a
temporary directory outside the repository. Commit only safe selected
screenshots under `docs/ui/evidence/129/`.

Close every browser session and stop every service started for validation.

## Browser Evidence Document Contract

Create `docs/ui/129-accessibility-motion-performance-browser-dogfood.md` with:

- date, start/final commit, OS, browser/engine/version, tool versions;
- exact fixture/reset/start/build commands;
- role/session strategy without tokens/passwords;
- route/state/viewport matrix with Pass/Fixed/Blocked/Accepted Exception;
- numbered issue register with severity, reproduction, owner, fix commit, tests,
  before/after evidence, and disposition;
- axe violations and incomplete/manual-review results;
- keyboard/focus/dialog/live-region results;
- normal/reduced-motion inventory and review;
- reflow/overflow/touch-target results;
- accepted behavior-parity results and any intentional presentation-only
  differences from children `123` through `128`;
- temporary baseline/final visual-comparison results and the paths of any safe
  final screenshots selected for commit;
- web and extension build-size before/after tables;
- three-run performance samples and medians;
- long-session workload, interaction/listener/request results, and heap result
  or explicit heap-metric block;
- console, runtime error, and failed-request findings;
- direct extension-page versus true installed-toolbar results;
- secondary-engine availability and honest blocked status;
- confirmation that evidence contains synthetic data only;
- leftovers assigned to child `130`.

An empty issue register is acceptable only if the complete matrix genuinely
finds no issue. Do not invent five issues to satisfy a generic dogfood target.

## Acceptance Checklist

### Planning/readiness

- [x] children `121` through `128` and child `128` close-previous result read.
- [x] master `005`, `DESIGN.md`, current routes, shared primitives, workflow
      components, fixtures, tests, build baselines, and browser capability read.
- [x] exact permitted files, contracts, security, compatibility, non-scope,
      TDD order, evidence, and handoff defined.
- [x] no critical product/domain decision is required before implementation.

### Implementation

- [x] baseline/evidence document and issue register created before runtime edits.
- [x] all scoped critical/high-impact findings fixed test-first.
- [x] shared fixes placed at the narrowest correct ownership boundary.
- [x] no unrelated redesign/domain/API/migration/dependency change.
- [x] motion inventory and changed-transition review complete.
- [x] performance decision gate applied with before/after evidence.
- [x] web and extension file-size/bundle constraints preserved or justified.

### Verification/closeout

- [x] focused and full web/extension tests pass.
- [x] server DB integration and V1 smoke pass.
- [x] workspace types/lint/recursive tests/builds/format/diff checks pass.
- [x] required agent-browser role/journey/state matrix passes.
- [x] WCAG 2.2 AA automated/manual review is clean or has only accepted
      non-blocking exceptions.
- [x] desktop/mobile/wide-editor/200%-reflow/popup checks pass.
- [x] normal/reduced-motion behavior passes.
- [x] deterministic visual comparisons show no unintended state, hierarchy,
      clipping, or layout regression.
- [x] performance/build findings are fixed or explicitly justified.
- [x] direct extension-page and true toolbar-popup evidence are distinct.
- [x] unavailable secondary engines are recorded as blocked, not passed.
- [x] plan status, implementation log, verification record, evidence, leftovers,
      handoff, `DESIGN.md` if needed, and master completed items are current.

## Commit Strategy

Commit only owned files in small logical groups. Suggested sequence:

1. `docs(ui): establish child 129 audit baseline`
2. `fix(ui): harden shared accessibility and focus behavior`
3. `fix(web): close responsive and motion findings`
4. `fix(web): close reader and editor dogfood findings`
5. `fix(extension): close popup accessibility and reflow findings`
6. `perf(web): address measured route or render regression` (only if justified)
7. `docs(ui): record child 129 verification and handoff`

Do not commit build outputs, database state, storage-test files, browser
profiles, cookies, tokens, passwords, raw HARs, temporary videos, or unrelated
user/agent changes.

## Critical Decisions And Stop Conditions

No unresolved critical decision is known at expansion.

Stop and amend/recheck before proceeding if a fix requires:

- new product semantics or information architecture;
- permission, tenant, privacy, retention, deletion, or public access changes;
- a migration or shared API/DTO change;
- a public URL/cookie/password/session change;
- extension manifest permission expansion;
- a major runtime/browser/testing dependency;
- replacing the accepted Guide/Demo composition;
- dropping an accepted browser/viewport/accessibility requirement.

Routine CSS, semantic markup, focus ownership, live-region, local component,
test, and measured reversible performance fixes inside this plan are
agent-decidable.

## Rollback

No database rollback or data migration is expected. Runtime repairs must remain
reversible as normal source commits, grouped by the commit strategy above:

- revert a local surface fix independently from shared primitive changes;
- revert measured lazy-loading/render changes together with their loading/error
  tests;
- rebuild the extension after an extension-source revert; do not commit
  generated `dist` output;
- restore the disposable test database by rerunning the relevant guarded
  fixture or `test:setup`, never by editing migration history;
- retain the evidence record of a reverted experiment and mark it rejected so
  later agents do not repeat an unhelpful optimization.

## Implementation Log

Implemented on 2026-07-29 from starting checkpoint `5e78723`.

1. Created the child evidence record before runtime edits and captured exact
   web/extension production baselines, browser/tool versions, capability
   limits, and the accepted behavior-parity sources.
2. Reproduced and fixed privacy-safe document titles, authenticated-shell
   bypass navigation, legacy eyebrow contrast, and invalid named-Card
   semantics. Named Card behavior was repaired once in `@repo/ui`; unnamed
   Cards remain neutral containers.
3. Fixed the Guide block-insertion control-group semantics, raised the Demo
   Hotspot resize target from 16 to 24 CSS pixels, and added global web
   reduced-motion suppression aligned with the extension.
4. The long-session dialog pass found a further focus-loss defect. Publication
   rollback now focuses the reason field, traps Tab/Shift+Tab, closes on Escape,
   and restores focus to the exact trigger.
5. Repeated Chromium axe, keyboard, reflow, reduced-motion, console, network,
   build, vitals, Guide/Demo long-session, direct extension, and true installed
   toolbar checks after repair.
6. Updated `DESIGN.md` only with reusable title, bypass, named-Card, modal
   focus, target-size, and reduced-motion rules. No schema, DTO, route, API,
   domain, migration, public access, extension permission, or dependency
   change was made.

Runtime commits:

- `c46e316` `fix(ui): harden shared accessibility behavior`
- `f23ff13` `fix(ui): close audited contrast and target gaps`
- `4d039d0` `fix(web): stabilize route title updates`
- `133274e` `fix(publish): preserve rollback dialog focus`

## Verification Record

Passed on 2026-07-29:

- focused web/shared UI tests, including 15 publishing-panel tests after the
  final dialog repair;
- full web suite: 52 files / 343 tests;
- full extension suite: 19 files / 140 tests;
- full server non-DB suite through recursive workspace tests: 99 files / 406
  tests;
- all 20 selected DB integration files / 67 tests;
- V1 smoke: 1 workflow;
- web, extension, shared UI, and workspace type/lint gates;
- workspace recursive tests and all 12 build tasks;
- agent-browser final axe scans with zero violations on representative entry,
  portal, Capture, Guide, Demo, public, and extension surfaces;
- desktop, 390px, 640-CSS-pixel reflow, 320px popup, and 180-CSS-pixel popup
  checks with no unexplained document overflow;
- normal/reduced-motion computed behavior;
- three-run production vitals for Demo editor and public embed;
- Guide/Demo selection, dialog, and save/preview long-session workloads;
- direct extension page and a separate real unpacked toolbar-action Capture,
  including exactly-once ordered redacted Asset/Event effects, suppression,
  pause/resume, service-worker restart, finish, clear, and canonical portal
  handoff.

Final standard web build:

- JS `468.52 kB` raw / `130.37 kB` gzip;
- CSS `73.89 kB` raw / `14.28 kB` gzip.

The extension build remains exactly at the child `126` closeout baseline. The
complete dated command/result record is
`docs/ui/129-accessibility-motion-performance-browser-dogfood.md`.

## Leftovers And Handoff

Child `130` inherits no runtime repair.

The only recorded blocks/exceptions are:

- Firefox/WebKit/Safari validation is blocked because no supported executable
  is installed;
- axe cannot resolve the layered Guide/Demo Textarea background, while manual
  contrast inspection passed;
- comparable forced-GC heap and listener/timer metrics are unavailable in the
  current tool surface; observable long-session behavior passed.

Child `130` should preserve the recorded build/vitals baseline, reuse the
clarified `DESIGN.md` rules for later Documentation surfaces, and perform the
planned pre-Documentation consistency/closure work. No critical/high-impact
accessibility, motion, reflow, browser, extension, security, privacy,
permission, or material performance regression carries forward.
