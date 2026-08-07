# Plan 147: Ossie UI Quality Program

Date: 2026-08-06

Last full planning audit: 2026-08-06

Status: Autonomous-run milestone reached — human review pending. Mandatory
program preflight, bounded surface candidates, two-reviewer closeout records,
and broad verification are recorded in the dedicated runner worktree. The
canonical mutable ledger is `docs/ui/147-ossie-ui-quality-program-ledger.md`.

Plan number: 147.

Predecessor:

- `docs/plan/146-documentation-post-v1-experience-final-closeout.md`

Parent:

- None. The user explicitly requested one long executable UI-quality plan
  rather than a new master plan with separately numbered child plans.

Starting repository state:

- audited commit: `6af6385`;
- worktree: clean at audit start;
- Master `007` and Child `146`: complete on 2026-08-06;
- browser evidence used only synthetic local fixtures and safe local URLs;
- this plan does not treat any external reference application as product or
  domain authority.

## 1. Objective

Raise the visual and interaction quality of every shipped Ossie user journey,
from first-run setup through the latest shipped Documentation experience, while
preserving Ossie's accepted Organization, Project, Project Version, Artifact,
Edition, Working Draft, Revision, Publication, access, audit, and public-link
semantics.

The program establishes one coherent visual system, reusable product-level
patterns, a repeatable browser and screenshot evidence system, and a bounded
multi-agent review loop. It then improves one surface family at a time until
the surface meets explicit visual, behavioral, accessibility, responsive, and
engineering criteria or reaches a documented stop condition.

This is not permission to:

- redesign domain behavior;
- weaken authorization, tenant isolation, immutable Capture source material,
  immutable Revisions or Publications, or public-link rules;
- add product scope such as Video, AI, analytics, custom branding, hosted
  signup, translations, or custom domains;
- copy another product's visual identity;
- add a collection of fashionable UI dependencies without a demonstrated
  workflow need;
- push, merge, deploy, publish, update approved screenshot baselines, or delete
  user-owned work without explicit authority.

## 2. Program Outcome

Plan `147` has two distinct milestones.

The **autonomous-run milestone** is reached only when:

1. Every shipped browser-visible route belongs to an audited surface family.
2. Current-truth documentation no longer describes completed Documentation
   work as planned or active.
3. The missing Documentation Publication preview render path and all confirmed
   live undefined-token defects are resolved before aesthetic expansion.
4. Shared tokens and product patterns govern related Ossie surfaces.
5. Each surface family has before evidence, an immutable review candidate, two
   independent reviews, resolution evidence, and an after bundle.
6. No unresolved P0 or P1 visual, functional, accessibility, security, or
   responsive issue remains in the in-scope route/state matrix.
7. Representative visual-review scores meet the thresholds in section 20.
8. Focused and broad repository checks required by this plan pass.
9. Every intentional screenshot difference is explained; no baseline is
   silently laundered into approval.
10. Every qualifying surface is labeled **agent-accepted, pending human
    review** and blocked/incomplete surfaces retain their truthful status.

The autonomous-run milestone does not make Plan `147` complete. Final Plan
completion requires:

1. the user to review the final bundle;
2. every human finding to receive a severity and disposition;
3. accepted findings to go through a bounded implementation, two-reviewer, and
   final-verification loop;
4. rejected/deferred findings to have a rationale, owner, and residual risk;
5. the broad closeout checks to pass; and
6. this plan's status, implementation log, evidence, leftovers, and handoff to
   be reconciled to actual final truth.

Do not mark Plan `147` complete while a required human review or accepted human
finding remains outstanding.

Passing tests, an empty axe report, no horizontal overflow, a successful build,
or good performance measurements is necessary where applicable, but none of
those facts alone is visual acceptance.

## 3. Governing Authority And Precedence

Use the smallest relevant sources in this order:

1. repository `AGENTS.md`;
2. `CONTEXT.md` after the current-truth reconciliation in section 8;
3. accepted ADRs under `docs/adr/`, especially ADRs `0021`–`0034`;
4. this Plan `147` and completed predecessor plans;
5. current code, contracts, migrations, tests, and reproducible browser facts;
6. `PRODUCT.md` and `DESIGN.md` after current-truth reconciliation;
7. repository-local `design-ossie-ui`, `model-ossie-domain`, and
   `dogfood-ossie` guidance;
8. approved Ossie product-pattern examples and evidence;
9. named external references for the exact surface and pattern under review;
10. generic design, React, motion, and accessibility guidance.

External references never override Ossie permissions, lifecycle, Project
Version context, Revision/Publication immutability, public URLs, access
challenges, audit behavior, security, privacy, or accepted terminology.

When sources disagree:

- current shipped code and accepted decisions determine runtime truth;
- accepted ADRs determine durable semantics;
- `DESIGN.md` determines the accepted visual direction;
- this plan determines work order, review mechanics, and acceptance evidence;
- a material product, security, major-dependency, licensing, or design-direction
  decision stops for the user as required by `AGENTS.md`.

## 4. Accepted Product And Visual Direction

The governing direction remains the **Quiet Versioned Workbench** described by
`DESIGN.md` and `design-ossie-ui`.

For Ossie, modern means:

- calm, precise, dependable, and operational;
- dense enough for repeated work while easy to scan;
- a clear page title, context, status, and primary action;
- stable navigator, canvas/content, inspector, and status regions where an
  authoring task needs them;
- restrained surfaces with consistent borders, radii, spacing, typography,
  elevation, and state color;
- content-first readers with deliberate typography and navigation;
- fast, restrained, reversible feedback;
- full loading, empty, error, denied, read-only, archived, conflict,
  destructive, and long-content states;
- responsive recomposition, not merely the absence of overflow.

Modern does not mean:

- gradients, decorative orbs, glassmorphism, or marketing-page composition;
- oversized dashboard cards or nested panels for every grouping;
- excessive rounding or shadows;
- a generic one-hue SaaS palette;
- making every command equally prominent;
- hiding critical status or behavior behind animation;
- exposing internal identifiers as default user-facing hierarchy;
- adopting another product's brand, copy, iconography, or feature set.

The established baseline constraints remain:

- one restrained type family unless a later accepted design decision changes
  it;
- approximately 14px operational body text where current accessibility and
  readability evidence supports it;
- controls near the accepted 6px radius and panels no more than the accepted
  8px radius by default;
- semantic state colors rather than decorative color;
- reduced-motion behavior for all non-essential movement.

## 5. Audit Method

The 2026-08-06 planning audit combined:

- repository truth and plan-sequence review;
- accepted ADR and domain-language review;
- dependency and shared-component inventory;
- route, component, CSS, and test scans;
- inspection of committed `docs/ui/` reports and screenshots;
- a real local Chromium walkthrough using synthetic fixtures;
- desktop and 390px Documentation checks;
- accessibility-tree, overflow, console, and responsive observations;
- current official documentation for named external reference products;
- three independent read-only agent audits:
  - plan/current-truth and numbering audit;
  - external-reference and unattended-runner audit;
  - route, component, state, and UI-surface audit.

Audit limitations:

- it was not a complete assistive-technology screen-reader study;
- committed screenshots do not cover every latest Documentation state;
- external authenticated product interfaces can change or differ by account;
- the audit did not approve a new brand direction;
- the audit did not modify or implement any UI;
- visual scores are a prioritization tool, not a substitute for the final human
  review requested by the user.

## 6. Current Stack And Architecture Inventory

### 6.1 Declared foundation

| Area                      | Current implementation                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| Monorepo                  | pnpm workspaces, Turborepo, TypeScript, Zod                              |
| Main portal               | React 19.2, Vite 7.3, Tailwind CSS 4.3, CSS Modules, Lucide              |
| Extension                 | React 19.2, Vite, Tailwind CSS, shared `@repo/ui`                        |
| Contributor/operator docs | Next.js 16.2 and React 19 under `apps/docs`                              |
| Shared UI                 | React primitives, CVA, `clsx`, `tailwind-merge`, Lucide                  |
| Documentation authoring   | bounded Tiptap 3.29.2 prose-field adoption                               |
| Documentation reader      | bounded Fumadocs Core 16.14 headless primitives                          |
| Component tests           | Vitest, React Testing Library, jsdom                                     |
| Browser validation        | agent-driven browser evidence; no committed application Playwright suite |

`apps/docs` is the contributor/operator documentation application. It is not
the customer-facing Product Documentation experience in `apps/web`. The plan
audits it as a separate, lower-priority surface and must not migrate customer
Documentation into it.

### 6.2 Libraries not currently declared directly

The application does not currently declare Radix, TanStack Query, TanStack
Table, React Hook Form, dnd-kit, resizable-panel primitives, React Router, a
committed Playwright application suite, or a committed axe browser suite.

Their absence is not the primary cause of the observed defects. Plan `147`
begins with the current stack. A new runtime or substantial development
dependency requires the evidence and decision gate in section 23.

### 6.3 Shared UI condition

`packages/ui` currently provides mostly primitives:

- Alert;
- Badge;
- Button;
- Card;
- Code;
- Input;
- Label;
- Select;
- Separator;
- Textarea;
- token and utility helpers.

It does not yet provide a reusable cross-product set of:

- page and context headers;
- command/action hierarchy;
- dense operational lists or tables;
- filters and bulk-action framing;
- complete loading/empty/error/permission/read-only/archived states;
- workbench navigator/canvas/inspector regions;
- details, Revision, Publication, or activity drawers;
- reader and access-challenge layouts.

The portal already has useful app-local composites such as its shell and
Project Version context bar. The implementation must generalize proven
patterns rather than replace working structures indiscriminately.

### 6.4 Complexity and repetition indicators

The audited UI includes several large feature-local orchestration components:

| Component                                       | Approximate lines at audit |
| ----------------------------------------------- | -------------------------: |
| `apps/web/src/App.tsx`                          |                       1166 |
| `InteractiveDemoEditorPage.tsx`                 |                        995 |
| `DocumentationBlockEditor.tsx`                  |                        993 |
| `CaptureSessionDetailPage.tsx`                  |                        989 |
| `GuideEditorWorkbench.tsx`                      |                        982 |
| `apps/extension/src/App.tsx`                    |                        977 |
| `DocumentationApiOperationExperience.tsx`       |                        873 |
| `DocumentationPublishingPanel.tsx`              |                        805 |
| `ArtifactPublishingPanel.tsx`                   |                        787 |
| `apps/extension/src/popup/CaptureWorkspace.tsx` |                        735 |
| `apps/web/src/lib/routes.ts`                    |                        705 |

File length alone is not a defect. Here it correlates with visible repetition:
each feature locally decides layout, state presentation, actions, data loading,
and administration hierarchy.

## 7. Audit Verdict And Health Score

### 7.1 Honest verdict

The earlier assessment is directionally correct. Ossie has a modern technical
foundation and unusually strong functional, domain, accessibility, and browser
evidence. It does not have a shortage of generic UI knowledge or packages.

Its central visual problem is fragmentation:

1. `DESIGN.md` describes one system.
2. global CSS variables describe a partial second system.
3. shared Tailwind primitives and page-local raw CSS implement several more.

The result is functional software that frequently looks like independent forms
and cards instead of one finished operational product.

### 7.2 Planning score

| Dimension                             |     Score | Evidence summary                                                                                                            |
| ------------------------------------- | --------: | --------------------------------------------------------------------------------------------------------------------------- |
| Accessibility                         |       3/4 | Strong automated, keyboard, focus, zoom, and reduced-motion work; manual AT and several direct-manipulation details remain  |
| Performance                           |       3/4 | Strong prior measurements and route checks; large components and growing presentation complexity require continued controls |
| Responsive composition                |       2/4 | Overflow is often controlled, but several mobile experiences become extremely long linear control stacks                    |
| Theming and visual-system consistency |       1/4 | Semantic tokens exist but are bypassed, duplicated, or undefined in live styles                                             |
| Visual/product anti-pattern control   |       2/4 | Strong written direction, but sparse cards, equal-weight commands, raw forms, and limited readers remain common             |
| **Total**                             | **11/20** | **Acceptable functional foundation; significant visual-system and composition work required**                               |

This score does not claim WCAG failure. It separates the strong behavioral
foundation from the weaker visual and product-pattern layer.

### 7.3 Strengths to preserve

- clear domain and lifecycle contracts;
- strong Organization and Project authorization boundaries;
- explicit immutable Revision and Publication behavior;
- broad loading, empty, error, permission, read-only, archived, conflict, and
  destructive-state handling;
- extensive component and domain tests;
- real-browser accessibility, keyboard, zoom, responsive, performance,
  console, and network evidence;
- reduced-motion and focus foundations;
- synthetic fixture discipline;
- existing shell and Project Version context;
- accepted library, workbench, and reader archetypes.

## 8. Pre-Implementation Current-Truth Reconciliation

The runner must verify and repair these stale statements before relying on the
documents for UI implementation:

| Source                           | Audited stale statement                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `CONTEXT.md`                     | describes Master `007` as planned next and post-V1 terms as not runtime |
| `PRODUCT.md`                     | describes Child `146` as active and post-V1 work as planned             |
| `docs/project-zoomout-status.md` | describes Master `007` as planning and Child `141` as next              |
| `docs/roadmap.md`                | describes Child `146` as active                                         |
| `README.md`                      | describes Master `007` as reserved and Child `146` as active            |
| `apps/docs/app/docs-content.ts`  | describes Master `007` as planning-only and Child `141` as next         |
| `CONTRIBUTING.md`                | describes shipped Documentation/foundation work as unimplemented        |

These are current-truth and terminology repairs, not permission to alter
product behavior. The reconciliation must:

- preserve the exact completed outcomes in Master `007` and Child `146`;
- distinguish shipped partial Tiptap/Fumadocs adoption from future scope;
- distinguish Product Documentation from `apps/docs`;
- update dates/status only where evidence supports them;
- run a repository text scan for equivalent stale statements;
- record exact changed statements in this plan's implementation log;
- stop if a contradiction requires a new product decision rather than a truth
  repair.

## 9. Blocking Correctness And Foundation Findings

These findings precede aesthetic redesign.

### P1-001: Documentation Publication preview is parsed but not rendered

Evidence:

- `apps/web/src/lib/routes.ts` parses
  `documentation_publication_preview`;
- `apps/web/src/lib/portalRouteMetadata.ts` supplies metadata;
- `apps/web/src/App.tsx` setup-guards the route;
- `apps/web/src/App.tsx` renders draft and Revision previews but has no
  Publication preview branch;
- the route reaches the generic fallback.

Required outcome:

- establish a failing route/render test;
- render the exact immutable Site Publication preview through the accepted
  existing contract;
- preserve internal/public route and access distinctions;
- verify the route in a real browser before visual work treats the route matrix
  as complete.

### P1-002: Live CSS uses undefined Ossie variables

Confirmed names include:

```text
--ossie-space-2
--ossie-space-3
--ossie-space-4
--ossie-space-5
--ossie-space-6
--ossie-radius-sm
--ossie-radius-lg
--ossie-color-text-muted
--ossie-color-surface-subtle
--ossie-color-focus-ring
--ossie-font-size-xs
--color-text-muted
--color-border-strong
--color-border
```

Confirmed consumers include Interactive Demo workbench/scene/editor CSS,
authentication entry-shell CSS, and Documentation Site library CSS.

Required outcome:

- inventory defined and consumed custom properties across web, extension, and
  shared UI;
- distinguish live CSS from dead selectors before modifying it;
- select one semantic Ossie token source and map every accepted consumer;
- reject new undefined variables in a repository check;
- do not silently invent values that contradict `DESIGN.md`;
- browser-verify focus, spacing, subtle surfaces, typography, and radii after
  repair.

### P1-003: Documentation Site authoring is a mega-form

The current Site route exposes page navigation, Site lifecycle, Page lifecycle,
review, structure, snippets, assets, import/export, Revisions, Publications,
OpenAPI, Try It, and publishing in one continuous surface. The audited 390px
route was approximately 6,843 CSS pixels tall and exposed roughly 150
interactive elements.

Required outcome:

- separate recurring authoring from administrative, portability, history, and
  publishing tasks;
- establish navigator, content/canvas, contextual inspector, and drawer or
  dedicated-view ownership;
- preserve every current capability and permission state;
- prevent progressive disclosure from hiding blocking validation or status.

### P1-004: Public Documentation is behaviorally capable but visually unfinished

The current reader has authorized navigation, breadcrumb, content, TOC,
previous/next behavior, search, and API-operation behavior, but much of the
chrome is plain semantic markup with little product styling. At 390px it passes
the audited overflow and automated accessibility checks, yet it looks closer to
an unstyled prototype than an intentionally calm reader.

Required outcome:

- provide deliberate reader composition, navigation hierarchy, typography,
  content width, search, TOC, metadata, API examples, Try It, access challenge,
  and previous/next presentation;
- retain Fumadocs as bounded headless behavior, not authority;
- keep exact Publication, URL, access, SEO, search, and API security contracts.

### P1-005: Demo editor hierarchy and controls compete with the stage

Scene creation/navigation, stage interaction, geometry, hotspot behavior,
metadata, Revision history, Publication history, Publish Links, preview,
archive, and destructive actions compete continuously. Keyboard position
movement exists, but an equivalent keyboard resize path was not confirmed.

Required outcome:

- make the stage the dominant work region;
- establish scene navigator and contextual inspector ownership;
- move history/publication administration out of the permanent primary plane;
- validate keyboard resizing or provide an equivalent explicit control path;
- preserve pointer, keyboard, zoom, reduced-motion, read-only, and archived
  behavior.

## 10. Prioritized Issue Register

No P0 issue was found during the planning audit. P0 remains reserved for data
loss, tenant/access boundary failure, credential exposure, unsafe destructive
behavior, or an unusable critical path.

### P1 — must resolve before family acceptance

- P1-001 missing Documentation Publication preview render path;
- P1-002 undefined live CSS variables and fragmented token authority;
- P1-003 Documentation authoring mega-form architecture;
- P1-004 unfinished public Documentation reader composition;
- P1-005 Demo editor stage/navigator/inspector/action hierarchy;
- P1-006 stale current-truth sources that could misdirect an autonomous runner.

### P2 — significant quality or consistency issue

- sparse Project and Project Version layouts with low-value unused space;
- generic card grids where dense lists, tables, timelines, or workbenches fit;
- Guide editor commands with similar weight and permanently competing
  publication/history controls;
- duplicated local loading, empty, error, permission, and action patterns;
- internal Project, Capture Session, and source IDs in prominent UI;
- Documentation library creation/load/review failure presentation gaps;
- Guide library per-row Publish Link request fan-out and flicker;
- extension account/instance/setup controls competing with capture;
- historic `/__design-system` route lacking shipped patterns and states;
- no committed deterministic visual-regression harness;
- large UI components coupling orchestration and presentation;
- gradients and raw color/radius values that contradict the accepted direction;
- public Guide and Demo surfaces that are sparse rather than deliberately calm.

### P3 — polish or maintainability issue

- inconsistent labels, help text, metadata hierarchy, and status placement;
- missing or uneven press, hover, focus, loading, success, and error feedback;
- repetitive block-insertion controls in Guide authoring;
- inconsistent list row actions and overflow placement;
- uneven long-label and narrow-width handling;
- obsolete screenshot labels and historical evidence ambiguity;
- contributor docs visual alignment after product surfaces are stable.

Every implementation finding must receive an ID, severity, owner, route/state,
evidence link, disposition, fix commit, verification result, and residual risk.

## 11. Complete Shipped Journey And Surface Registry

The runner must maintain this registry and expand it with exact routes, roles,
fixtures, and evidence before implementation.

| Order | Surface family            | Shipped journeys and states                                                                                                                     | Archetype                                    |
| ----: | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
|     1 | Entry and onboarding      | first-run setup, setup complete/unavailable/error, login, invite acceptance for existing/new accounts                                           | Entry form                                   |
|     2 | Organization              | members, invitations, compliance, Documentation operations                                                                                      | Administration/list                          |
|     3 | Projects                  | active/archived library, creation, Project workspace, Project-scoped Project Membership                                                         | Dense library/workspace                      |
|     4 | Project Versions          | context, settings, create/reorder/default/archive/restore, activity/compliance, Carry Forward                                                   | Context/admin/timeline                       |
|     5 | Capture                   | library, creation, detail, assets/events, upload/retry/recovery/final/read-only                                                                 | Library/workbench                            |
|     6 | Guides                    | library, editor, preview, Revision history/preview, publishing, public reader/embed                                                             | Library/workbench/reader                     |
|     7 | Interactive Demos         | library, editor, scenes/hotspots, preview, Revision history/preview, publishing, public viewer/embed                                            | Library/direct-manipulation workbench/viewer |
|     8 | Product Documentation     | Site library, Site/Page authoring, review inbox, draft/Revision/Publication previews, import/export, assets/snippets/OpenAPI/Try It, publishing | Library/workbench/admin/reader               |
|     9 | Extension installation    | check/auth/error/ready/download/update/remove                                                                                                   | Setup utility                                |
|    10 | Extension capture         | unconfigured, signed out/in, selection, recording, pause/resume, reconciliation, recovery, completion, error, narrow width                      | Focused task utility                         |
|    11 | Development gallery       | `/__design-system` product patterns and state matrix                                                                                            | Pattern gallery                              |
|    12 | Global shell/fallback     | unsupported route, Page not found, shell-level failure and recovery                                                                             | Shell/error state                            |
|    13 | Contributor/operator docs | `apps/docs` landing/documentation content                                                                                                       | Separate documentation site                  |

For every applicable internal route, cover:

- loading;
- empty;
- populated;
- error and retry;
- unauthenticated;
- permission denied;
- read-only;
- archived/final/frozen;
- unsaved and saving;
- validation failure;
- concurrency conflict;
- destructive confirmation and failure;
- long content and long localized-style labels;
- slow or failed request;
- narrow/reflow;
- keyboard focus;
- reduced motion.

For every applicable public route, additionally cover:

- exact valid link;
- password challenge and incorrect password;
- internal-only/unavailable/revoked/expired/unknown behavior;
- default and explicit Publication selection;
- canonical URL/redirect/gone behavior;
- embed;
- version selection;
- empty/long content;
- asset, search, and API-operation failure boundaries.

## 12. External Reference Register

### 12.1 Reference rules

- Use one primary and no more than one secondary reference for a surface.
- Study an exact workflow or pattern, not a product's general brand.
- Record the URL, source type, retrieval date, viewport/account context,
  borrow list, reject list, Ossie constraints, and last revalidation date.
- Revalidate before implementation when a reference is older than 90 days,
  redirects, returns an error, or materially changes.
- Prefer current official product documentation over marketing screenshots.
- A supplied dated screenshot may clarify a hidden authenticated interface.
- Do not commit third-party screenshots as Ossie assets without permission.
- External reference drift never automatically changes an accepted Ossie
  pattern or screenshot baseline.
- If the reference conflicts with Ossie, reject the conflicting pattern and
  record why.

### 12.2 Audited reference matrix

The seed matrix was verified on 2026-08-06. The two official Scribe URLs
returned bot-protection `403` responses to an automated `curl` check but were
verified as the intended official help-center targets; the runner must use a
normal browser or dated supplied evidence when revalidating them.

| Ossie surface                 | Primary reference                                                                                                                      | Secondary                                                                                                                                        | Borrow                                                             | Reject                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Setup/login                   | [Linear Start Guide](https://linear.app/docs/start-guide)                                                                              | `docs/ui/evidence/123/setup-desktop.png`                                                                                                         | Focus, concise setup sequence, restrained help                     | Linear brand, hosted signup assumptions, unshipped SSO       |
| Members/invites               | [Linear invites](https://linear.app/docs/invite-members)                                                                               | [GitBook member management](https://gitbook.com/docs/account-management/member-management)                                                       | Dense membership status, contextual invite actions                 | Their roles, billing, workspace semantics                    |
| Project workspace             | [Linear project overview](https://linear.app/docs/project-overview)                                                                    | [GitBook resource anatomy](https://gitbook.com/docs/resources)                                                                                   | Compact context, status hierarchy, task-oriented navigation        | Issue-tracker or GitBook domain concepts                     |
| Operational libraries         | [Linear display options](https://linear.app/docs/display-options)                                                                      | [Linear select issues](https://linear.app/docs/select-issues)                                                                                    | Scan density, column priority, selection, contextual actions       | Dark palette, copied keyboard model without Ossie evidence   |
| Capture flow                  | [Scribe extension capture](https://support.scribehow.com/hc/en-us/articles/13546388647453-How-to-capture-a-Scribe-using-the-extension) | [Loom extension](https://support.atlassian.com/loom/docs/get-started-with-the-loom-chrome-extension/)                                            | Dominant capture action, obvious state, compact setup              | Video scope, AI, account-heavy chrome, hosted assumptions    |
| Guide editor                  | [Scribe editing](https://support.scribehow.com/hc/en-us/articles/9008043510813-Basics-Editing-a-Scribe)                                | [GitBook resource anatomy](https://gitbook.com/docs/resources)                                                                                   | Screenshot-first steps, focused edit flow, hierarchy               | Exact block model, AI features, their publication model      |
| Demo editor                   | [Arcade hotspots and callouts](https://docs.arcade.software/kb/build/interactive-demo/edit/hotspots-and-callouts)                      | [Scribe editing](https://support.scribehow.com/hc/en-us/articles/9008043510813-Basics-Editing-a-Scribe)                                          | Dominant stage, left scenes, contextual hotspot inspector          | Marketing gradients, analytics, sales/AI scope               |
| Documentation authoring       | [GitBook resources](https://gitbook.com/docs/resources)                                                                                | `docs/ui/2026-08-05-documentation-authoring-modernization-browser-evidence.md`                                                                   | Full-surface editing, navigation organization, contextual controls | Git/space semantics, hosted authority, exact visual identity |
| Documentation review          | [GitBook change requests](https://gitbook.com/docs/collaboration/change-requests)                                                      | [Change-request screen](https://gitbook.com/docs/collaboration/change-requests/change-requests-screen)                                           | Review status, focused decision area, separation from editing      | GitBook approval semantics where Ossie differs               |
| Revision/Publication history  | [GitBook version control](https://gitbook.com/docs/creating-content/version-control)                                                   | [Collaborative workflow](https://gitbook.com/docs/guides/best-practices/make-your-documentation-process-more-collaborative-with-change-requests) | Scannable history and contextual comparison                        | Mutable history or vocabulary conflicting with Ossie         |
| Public Documentation          | [Fumadocs headless](https://www.fumadocs.dev/docs/headless)                                                                            | [Mintlify navigation](https://mintlify.com/docs/navigation)                                                                                      | Navigation, readable measure, TOC, search composition              | Router/content authority, hosted features, copied theme      |
| API reference                 | [Mintlify pages](https://mintlify.com/docs/pages)                                                                                      | [Fumadocs headless](https://www.fumadocs.dev/docs/headless)                                                                                      | Operation hierarchy, code/example scanability                      | SDK generation, network authority, unsupported languages     |
| Organization/admin            | [GitBook organization settings](https://gitbook.com/docs/organizations/organization-management)                                        | [Linear workspaces](https://linear.app/docs/workspaces)                                                                                          | Information grouping and administrative hierarchy                  | Billing/enterprise features outside Ossie                    |
| Activity/compliance           | [Linear audit log](https://linear.app/docs/audit-log)                                                                                  | [GitBook version control](https://gitbook.com/docs/creating-content/version-control)                                                             | Dense filters, timestamp/actor/action hierarchy                    | Their event model, retention, export assumptions             |
| Project Version/Carry Forward | [Linear project overview](https://linear.app/docs/project-overview)                                                                    | `docs/ui/evidence/127/carry-forward.png`                                                                                                         | Stable release context and bounded move/copy task                  | Linear roadmap semantics or ambiguous generic “version”      |
| Public Guide                  | [Scribe editing](https://support.scribehow.com/hc/en-us/articles/9008043510813-Basics-Editing-a-Scribe)                                | `docs/ui/evidence/127/public-reader.png`                                                                                                         | Step rhythm, screenshot emphasis, restrained reader controls       | Scribe brand, hosted sharing model, AI features              |
| Public Interactive Demo       | [Arcade hotspots and callouts](https://docs.arcade.software/kb/build/interactive-demo/edit/hotspots-and-callouts)                      | `docs/ui/evidence/128/public-multi-version.png`                                                                                                  | Stage dominance, callout hierarchy, clear progression              | Analytics, lead capture, marketing treatment                 |
| Extension installation        | [Loom extension](https://support.atlassian.com/loom/docs/get-started-with-the-loom-chrome-extension/)                                  | `docs/ui/126-extension-ui-browser-evidence.md`                                                                                                   | One installation/connection task and compact recovery              | Video scope, hosted accounts, Loom branding                  |
| Contributor/operator docs     | Ossie-only — no external product reference accepted                                                                                    | `apps/docs/app/docs-content.ts`                                                                                                                  | Current-truth clarity and alignment with accepted Ossie tokens     | Customer Product Documentation patterns as runtime authority |
| Global shell/fallback         | Ossie-only — no external product reference accepted                                                                                    | `apps/web/src/lib/portalRouteMetadata.ts`                                                                                                        | Clear recovery, stable shell context, truthful unsupported state   | Decorative error pages or invented recovery behavior         |

Each surface brief must state which exact ideas were used, which were rejected,
and how the result remains recognizably Ossie.

## 13. Product-Pattern Foundation

### 13.1 One token authority

Create or designate one semantic token source covering:

- canvas, surface, subtle surface, elevated surface, borders, strong borders;
- primary, secondary, muted, inverted, link, success, warning, danger, and
  focus colors;
- type family, size, weight, line height, and tracking;
- spacing scale;
- control and panel radii;
- border width and restrained elevation;
- motion duration/easing and reduced-motion fallbacks;
- focus-ring width, offset, and color;
- control heights and touch-target minimums;
- content widths, rails, inspector widths, and responsive breakpoints.

Requirements:

- Tailwind utilities and CSS Modules consume semantic values;
- shared primitives stop hard-coding generic `slate-*`, `white`, arbitrary
  radius, and page-specific shadow values where a semantic token exists;
- raw hexadecimal colors outside approved token, media, syntax, or exceptional
  integration files are inventoried and justified;
- dead CSS is identified before mechanical replacement;
- extension and portal use the same accepted semantics while retaining
  context-appropriate density;
- contrast and focus evidence accompanies token changes.

### 13.2 Shared primitives and behaviors

Repair current primitives before adding new ones. Required state matrices:

- default, hover, active, focus-visible, disabled, busy, error, success;
- compact and standard density where accepted;
- destructive styling that is unambiguous but not visually dominant until
  relevant;
- native semantics by default;
- keyboard/focus behavior tested;
- long-label and narrow-container behavior.

Use native controls for simple choices. Do not introduce a custom Select or
combobox merely for appearance.

### 13.3 Shared composite patterns

Build only after two or more real callers confirm the API. Candidate patterns:

```text
ApplicationShell
PageHeader
Breadcrumbs
VersionContextBar
CommandBar
OverflowActions
FilterBar
DataList
DataTable
StatusCell
LoadingState
EmptyState
ErrorState
PermissionState
ReadOnlyBanner
FormField
FieldError
DetailsDrawer
HistoryDrawer
PublicationStatus
WorkbenchShell
NavigatorPanel
CanvasPanel
InspectorPanel
WorkbenchStatusBar
ReaderLayout
AccessChallenge
ProseContent
```

Names are provisional implementation details. The accepted requirements are:

- one identifiable primary action per context;
- secondary actions remain visible only when frequent and relevant;
- infrequent and destructive actions move to an overflow, drawer, or dedicated
  administration area;
- status and Project Version context remain visible without crowding;
- internal IDs live in details/troubleshooting affordances unless necessary;
- shared states have consistent hierarchy, retry behavior, and focus return;
- mobile uses deliberate recomposition, drawers, or sequential task modes.

### 13.4 Product-pattern gallery

Evolve `/__design-system` from the historical Child `121` specimen into a
development-only gallery of actual production components and states.

It must include:

- entry forms;
- dense library/list/table;
- page/context/command headers;
- loading, empty, error, permission, read-only, archived, conflict, saving,
  success, and destructive states;
- workbench navigator/canvas/inspector at desktop and narrow sizes;
- history, details, and publication disclosure;
- reader and access challenge;
- long text, long code, missing image, and extreme-count fixtures;
- extension compact states;
- focus-visible, reduced-motion, and contrast examples.

The gallery supplements real-route evidence; it does not replace it.

## 14. Detailed Surface Work Packages

These work packages execute sequentially inside this single plan. They do not
create separately numbered child plans.

### 14.1 Work Package A — truth, route, token, and evidence foundation

User outcome:

- the autonomous runner begins from accurate product truth and a complete route
  and state registry.

Scope:

- section 8 current-truth reconciliation;
- P1-001 Publication preview route repair;
- P1-002 token-definition repair;
- screenshot/evidence classification;
- reference register creation;
- issue and surface ledgers;
- current-stack pattern gallery foundation.

Acceptance:

- current-truth scans find no known stale Master `007`/Child `146` language;
- route tests and browser evidence cover Documentation Publication preview;
- no confirmed live CSS declaration refers to an undefined Ossie token;
- existing focus/contrast/motion behavior does not regress;
- every committed screenshot is classified as approved reference, functional
  evidence, known-problem evidence, or historical-only evidence;
- baseline updates remain manual and explicit.

### 14.2 Work Package B — representative pattern pilots

Pilot exactly one surface for each major archetype before broad rollout:

| Archetype                     | Pilot                         |
| ----------------------------- | ----------------------------- |
| Library                       | Projects                      |
| Workbench/direct manipulation | Interactive Demo editor       |
| Reader                        | public Product Documentation  |
| Administration                | Documentation Site operations |
| Compact utility               | active extension Capture      |

Each pilot must:

- capture current desktop, 1024px, narrow, and relevant state evidence;
- use the reference matrix without copying brand;
- implement shared patterns before duplicated page-local CSS;
- retain all current behavior and domain language;
- complete the two-reviewer loop;
- prove its pattern in the gallery and its real route;
- remain isolated enough to revert independently.

Do not expand a pilot pattern to all callers until its candidate is accepted by
both reviewers.

### 14.3 Work Package C — entry and onboarding

Primary tasks:

- initialize a self-hosted instance;
- sign in;
- accept an invitation as an existing or new account;
- understand unavailable, completed, or failed setup.

Target composition:

- one restrained entry shell;
- one concise title and purpose statement;
- a linear form with explicit validation and submission state;
- secondary deployment/help information visually quiet;
- shared alert, retry, and return-focus behavior.

Required states:

- setup loading, ready, submitting, complete, unavailable, and error;
- login idle, submitting, and credential/server error;
- invite loading, invalid/unavailable, existing-account, new-account, success,
  and failure;
- narrow, 200% zoom, keyboard-only, autofill, long labels, and reduced motion.

Acceptance:

- no shipped capability is described as future;
- one primary action is obvious;
- errors are associated and announced;
- password/credential values never enter screenshots or logs;
- entry flows remain self-hosted and do not imply hosted signup.

### 14.4 Work Package D — Organization, Projects, and Project Versions

Primary tasks:

- find/create/archive/restore a Project;
- understand and enter a Project Version;
- manage Project Version lifecycle and Project-scoped Project Membership;
- manage Organization members/invites;
- inspect activity, compliance, and Documentation operations.

Project Membership remains scoped to the Project and governs its Project
Versions. This work package must not invent Project Version-level membership.

Target composition:

- dense operational lists rather than generic card grids;
- compact filters, status, updated time/actor, and contextual actions;
- Project Version context as a stable bar, not a competing card;
- details and infrequent administration progressively disclosed;
- a shared timeline/filter pattern for activity and compliance;
- responsive column priority rather than horizontal compression.

Suggested library fields where supported by the current read model:

```text
Name
Type
Project Version
Status
Publication
Last updated
Updated by
Actions
```

Do not fabricate data or add N+1 calls merely to fill a column.

Required states:

- active/archived, empty, loading, load error/retry, create failure;
- member/invite empty, pending, copied, revoked, forbidden, failure;
- Version create/reorder/default/archive/restore and confirmation failure;
- read-only, denied, long names, many rows, 200% zoom, keyboard selection.

Acceptance:

- raw IDs are absent from default hierarchy;
- destructive actions are contextual and confirmed;
- every list row remains operable without hover;
- focused rows, and selected rows where selection already exists or is
  separately accepted, are visually and semantically distinct;
- no domain or permission change is introduced.

### 14.5 Work Package E — Capture portal

Primary tasks:

- find or start a Capture Session;
- inspect source events and assets;
- upload, retry, recover, finish, or use a read-only/final Capture;
- understand immutable source-material boundaries.

Target composition:

- dense Capture library with consistent status and action placement;
- detail workbench that separates session context, event/asset content, and
  contextual editing/recovery controls;
- queue and failure status near the affected item;
- technical IDs available in details/troubleshooting, not top-level chrome.

Required states:

- library loading, empty, error, create, read-only;
- detail auth/not-found/error;
- upload pending/in progress/success/failure/retry;
- final, archived, inaccessible, reconciliation, and recovery;
- long event streams, broken media, slow request, narrow, and keyboard.

Acceptance:

- immutable Capture source rules remain intact;
- retry and recovery are explicit and safe;
- no raw captured private content enters committed evidence;
- hierarchy remains usable with large event/asset counts.

### 14.6 Work Package F — Guide family

Primary tasks:

- scan Guide status;
- edit metadata and ordered content;
- preview;
- create and inspect a Revision;
- publish/manage links;
- read or embed an exact public Guide.

Target editor:

```text
Breadcrumb and Project Version context    Preview  Publish  More
----------------------------------------------------------------
Outline/navigation | Guide content/canvas | Contextual inspector
----------------------------------------------------------------
Save, validation, conflict, read-only, and Publication status
```

The exact column count may adapt to the current Guide model. The hierarchy is
required: outline/content/properties, with history and Publication operations
in a drawer or dedicated view rather than permanently competing.

Specific work:

- consolidate six repeated insertion actions into a compact accessible insert
  model without hiding block types;
- make Preview and Publish roles clear;
- move Archive, alternate exports, link administration, and infrequent commands
  to contextual disclosure;
- eliminate prominent Project/source Capture IDs;
- assess the Guide library Publish Link N+1 request pattern before visualizing
  row publication state; fix only within accepted API/read-model boundaries.

Reader target:

- deliberate title/metadata block;
- readable measure and heading rhythm;
- media emphasis;
- optional navigation for long content where current data supports it;
- clear previous/next behavior where applicable;
- shared access challenge;
- no administration language or technical IDs.

Required states include editor saving/conflict/read-only/archived, empty Guide,
long Guide, Revision/Publication failure, password challenge, unavailable link,
embed, explicit Publication, missing media, narrow, and keyboard.

### 14.7 Work Package G — Interactive Demo family

Primary tasks:

- scan Demo status;
- order scenes;
- place, move, resize, and configure hotspots/callouts;
- preview;
- create/inspect a Revision;
- publish/manage links;
- play or embed an exact public Demo.

Target desktop editor:

```text
Breadcrumb / Project Version context         Preview  Publish  More
-------------------------------------------------------------------
Scenes             Demo stage                Inspector
                   dominant                  Scene / hotspot / action
-------------------------------------------------------------------
Autosave / validation / selection / read-only / Publication status
```

Target narrow editor:

- stage remains primary;
- scenes and inspector become explicit drawers or task modes;
- controls do not overlay or shrink the stage into unusability;
- direct manipulation always has labeled non-pointer alternatives.

Specific work:

- separate scene navigation from creation and publication administration;
- keep Revision/Publication history outside the permanent canvas plane;
- make geometry fields and stage selection synchronized and understandable;
- validate keyboard position and resize paths;
- ensure zoom/reflow does not make handles or controls unreachable;
- retain reduced-motion and interruption behavior;
- apply `apple-design` only to genuine drag/resize/touch interaction finishing;
- run `review-animations` only if motion code changes.

Viewer target:

- stage and current callout dominate;
- navigation/progress controls are clear but quiet;
- password/version/embed/error states share public-reader foundations;
- no editor/admin vocabulary leaks to viewers.

### 14.8 Work Package H — Product Documentation operations and library

Primary tasks:

- find/create a Documentation Site;
- see Site Edition and review status;
- import or carry forward through explicit operations;
- enter authoring, review, or Publication tasks;
- inspect Organization-wide Documentation operations.

Target composition:

- dense Site list with status, Edition/Project Version context, review signal,
  Publication state, update metadata, and contextual actions where the current
  read model supports them;
- creation in a focused flow, not a permanently competing form;
- import, Carry Forward, limits, and destructive administration in dedicated
  tasks or drawers;
- clear retry/failure for Site load, create, and review-inbox requests.

Acceptance:

- creation rejection is caught and presented;
- load error has retry;
- review failure is not silently discarded;
- no import, review, or Publication semantics change;
- many Sites, long names, zero Sites, denied, and archived states remain clear.

### 14.9 Work Package I — Product Documentation authoring and review

Primary tasks:

- organize Site navigation;
- author a Page;
- manage metadata, blocks, snippets, and assets;
- configure OpenAPI content and safe Try It;
- review an exact Revision;
- import/export within accepted portability rules;
- create Revisions and Publications.

Target architecture:

```text
Site/Page navigator | Document canvas | Contextual Page inspector
---------------------------------------------------------------
Review / Revision / Publication / portability / administration drawers
```

Required ownership:

- navigator: Site tree, Page selection, add/reorder, compact lifecycle status;
- canvas: Page content and the current writing/editing task;
- inspector: metadata and selected-block/Page properties;
- status bar: save, conflict, validation, review, read-only, and connectivity;
- dedicated/drawer tasks: Site lifecycle, assets, snippets, OpenAPI sources,
  import/export, history, review, Publication, destructive administration.

Constraints:

- do not replace the relational Documentation graph with Tiptap JSON;
- Tiptap remains bounded to accepted prose fields;
- Fumadocs does not become authoring, route, access, or persistence authority;
- preserve Row-Version conflict behavior, block IDs, comments, assets,
  references, review targets, exact Revision/Publication output, and rollback;
- Try It remains browser-direct, origin-governed, and separate from inert request
  examples;
- do not introduce arbitrary HTML, MDX, executable content, or hosted services.

Required states:

- no Pages, many Pages, deeply nested navigation, long Page;
- saved, saving, unsaved, conflict, validation failure, local recovery;
- read-only, archived, denied;
- asset upload/failure/missing asset;
- snippet reference/edit failure;
- OpenAPI loading/invalid/unsupported/sensitive inputs;
- review empty/pending/approved/changes requested/failure;
- import inspection, reject, conflict, and success;
- Revision/Publication creating, failure, history empty/many;
- desktop, tablet, 390px, 200% reflow, keyboard, reduced motion.

Acceptance:

- normal Page editing does not require traversing unrelated Site
  administration;
- every previously shipped control has an intentional location;
- disclosure does not conceal blockers or failure status;
- Publication preview route works and visually matches immutable preview intent;
- exact domain and access tests remain green.

### 14.10 Work Package J — public reader family

Create a related but content-specific family for:

- public Guide reader and embed;
- public Interactive Demo viewer and embed;
- public Product Documentation reader and API reference;
- shared access challenges and unavailable states.

Shared requirements:

- intentional title/context presentation;
- readable content width and type rhythm;
- calm chrome;
- stable keyboard focus and skip behavior;
- password forms with visible labels and errors;
- explicit Publication/version selection where supported;
- no administration language or internal identifiers;
- safe asset and link behavior;
- 320px/390px and 200% reflow evidence;
- reduced-motion behavior;
- exact public, embed, canonical, and access semantics.

Documentation-specific requirements:

- left navigation, search, breadcrumb, content, TOC, and previous/next hierarchy;
- navigation becomes a controlled drawer/overlay on narrow screens;
- API operations, inert examples, copy, and browser-direct Try It remain
  distinguishable;
- code overflow is contained without forcing page overflow;
- native fallback and authorized bootstrap behavior remain verifiable.

### 14.11 Work Package K — extension and installation portal

Primary tasks:

- install/connect the extension;
- select Project and Project Version context;
- start, pause/resume, recover, and complete Capture;
- understand failure and read-only/inaccessible states.

Target composition:

- after setup, the current Capture task dominates;
- account, instance, installation, and troubleshooting details collapse into a
  settings/details area;
- recording state and primary action are unmistakable;
- status is concise and close to the affected action;
- raw Capture Session ID appears only in troubleshooting/details;
- the portal installation page presents one clear install/update/remove task.

Required states:

- unconfigured, signed out, signing in/checking, connected;
- selection required, active, paused, reconciling, recovered;
- read-only, inaccessible, completed, error and retry;
- extension 360x600 and 180px stress width;
- keyboard-only, long names, lost connection, reduced motion;
- real toolbar popup where the environment supports it.

Acceptance:

- extension permissions and connection behavior do not change;
- the main task is visually dominant in every post-setup state;
- recovery remains truthful and safe;
- portal and extension share tokens without forcing identical layouts.

### 14.12 Work Package L — contributor/operator docs

Audit `apps/docs` only after customer-facing Product Documentation and shared
patterns stabilize.

Scope:

- correct stale current-truth content;
- align entry typography, navigation, code, and status styles with the accepted
  Ossie system where appropriate;
- retain Next.js app ownership and contributor/operator purpose;
- do not move Product Documentation into this app;
- do not make it a prerequisite for Ossie runtime or agent skills.

## 15. Multi-Agent Execution Model

The unattended loop uses four logical roles. Roles may run in separate agent
contexts, but only one role writes to the active implementation worktree.

### 15.1 Coordinator

Owns:

- current work package and exact route/state boundary;
- starting commit and immutable candidate commit;
- surface, issue, evidence, reference, and decision ledgers;
- review prompts and reviewer independence;
- consolidation of conflicting findings;
- acceptance, revision, block, and advancement decisions;
- durable checkpoints and final handoff.

The coordinator does not waive a finding merely because a reviewer is
inconvenient or a time window is ending.

### 15.2 Implementer

Owns:

- one bounded surface or shared-pattern change at a time;
- test-first behavior fixes;
- minimal, reusable implementation;
- focused verification;
- an attributable, cohesive, reversible candidate commit;
- a change summary and evidence manifest.

The implementer is the sole writer during a candidate cycle. It may not update
approved visual baselines.

### 15.3 Reviewer A — visual and interaction critic

Uses `design-ossie-ui` and the Impeccable critique/layout/typeset/clarify/
harden/polish sequence as applicable.

Reviews:

- hierarchy;
- scanability;
- density;
- typography;
- spacing and alignment;
- primary-action clarity;
- surface and state consistency;
- reference use and rejected imitation;
- responsive recomposition;
- interaction feedback and motion restraint.

Reviewer A is read-only and reviews the immutable candidate without seeing
Reviewer B's findings.

### 15.4 Reviewer B — product, accessibility, and adversarial QA

Uses repository domain guidance, `dogfood-ossie`, accessibility guidance, and
applicable React engineering review.

Reviews:

- product/domain truth;
- permissions and tenant boundaries;
- loading/empty/error/denied/read-only/archived/destructive states;
- keyboard/focus/zoom/reflow/reduced motion;
- console and network behavior;
- public/authenticated/embed separation;
- performance and rerender risks;
- safe fixtures and evidence integrity;
- regression scope and test sufficiency.

Reviewer B is read-only and reviews the same immutable candidate without seeing
Reviewer A's findings.

### 15.5 Review contract

Both reviewers return the common envelope:

```text
candidate commit
verdict: accept | changes_requested | block
findings:
  id
  severity: P0 | P1 | P2 | P3
  category
  exact route/state/viewport
  evidence
  expected outcome
  recommended correction
unverified items
residual risks
```

Reviewer A additionally returns 1–5 scores for hierarchy, scanability, density,
typography, spacing/alignment, primary-action clarity, state clarity,
cross-product consistency, and responsive composition.

Reviewer B additionally returns `pass | fail | blocked` gates for product/domain
truth, permissions/security, state coverage, accessibility, browser behavior,
engineering verification, evidence safety, and regression scope. Accessibility
is a gate, not an aesthetic score.

The coordinator records and reconciles the two outputs but does not rescore
aesthetics, override a failed Reviewer B gate, or manufacture consensus.

Reviewers must distinguish direct evidence from inference. They may not edit
the candidate, hide failed checks, or approve because the implementation looks
different from the baseline.

## 16. Per-Surface Improvement Loop

Each surface moves through this state machine:

```text
queued
  -> preflight
  -> baseline captured
  -> bounded implementation
  -> focused verification
  -> immutable candidate commit
  -> Reviewer A and Reviewer B blind reviews
  -> findings consolidated
  -> revision required
       -> bounded implementation (next cycle)
     OR final clean verification
       -> both reviewers confirm final accept verdicts
       -> agent-accepted, pending human review
     OR blocked_local_for_run
       -> next demonstrably independent eligible surface
     OR needs_human_surface
       -> next demonstrably independent eligible surface
     OR paused_global_critical
       -> stop the program
     OR incomplete_checkpoint
       -> persist state and end this run
  -> next surface after acceptance
```

Rules:

1. Reviewers receive the same commit, requirements, route/state matrix,
   reference brief, and evidence bundle.
2. Reviewers do not review an uncommitted moving target.
3. The coordinator waits for both reviews before exposing either review to the
   implementer.
4. Duplicate findings are merged without losing evidence.
5. Conflicts are resolved against repository authority and reproducible facts.
6. Every accepted/rejected/deferred finding receives a written disposition.
7. P0/P1 findings require another candidate and both reviews.
8. A P2 may remain only when both reviewers accept, it does not impair a
   required workflow or acceptance gate, and its rationale, owner, trigger,
   planned disposition, and residual risk are recorded. A P3 may remain as
   documented polish debt with an owner and rationale. Neither rule permits a
   disguised P0/P1 or a score below the accepted threshold.
9. A surface gets at most three implementation/review cycles in one run.
10. Final verification must run against the exact candidate that reviewers
    inspected. If verification changes code, create a new candidate and repeat
    both reviews.
11. Reviewers receive the completed final-verification bundle and confirm their
    final verdicts before the coordinator records agent acceptance.

## 17. Stagnation, Disagreement, And Stop Conditions

### 17.1 Program-wide critical pause

Stop the entire program, preserve evidence, set
`paused_global_critical`, and request user authority when:

- a P0 is discovered;
- a cross-cutting security, privacy, tenant, authorization, data-loss, or unsafe
  shared-foundation failure is discovered;
- the work requires a new product semantic, permission, retention, deletion,
  immutable behavior, public URL, major dependency/license, naming, or accepted
  design-direction decision;
- user or other-agent changes make the shared worktree unsafe;
- the runner cannot establish the required isolated worktree;
- continuing could invalidate already accepted surfaces.

Do not advance to another surface while a program-wide critical pause exists.

### 17.2 Surface needs human direction

Stop work on that surface, set `needs_human_surface`, preserve evidence, and
continue only to an independent surface when safe if:

- the same P1 survives two attempted fixes;
- two cycles show no score increase and no meaningful reduction in findings;
- visual changes oscillate between two arrangements without a governing rule;
- reviewers give materially incompatible direction in two cycles;
- the third cycle still has a P1;
- an approved screenshot baseline would have to be silently replaced;
- the source reference is unavailable and the intended pattern cannot be
  established from approved Ossie evidence.

### 17.3 Local run block or incomplete checkpoint

Set `blocked_local_for_run` and continue only to a demonstrably independent
surface when a surface-specific browser, fixture, database, extension, or test
capability is unavailable. If the capability is required across the program,
pause globally instead.

Set `incomplete_checkpoint`, not a blocker, when time, token, service lifetime,
or a recoverable environment interruption ends otherwise valid work. The
checkpoint must record the exact current diff/commit, next command, route,
state, and unresolved findings.

Do not continue work that leaves the active Plan `147` boundary. Record the
out-of-scope finding and proceed only if the current surface remains safely
independent.

Time or token limits are not acceptance conditions. When the execution window
is ending:

- do not start another surface;
- finish or revert only runner-owned incomplete work where safely possible;
- leave a durable checkpoint;
- mark unfinished work as incomplete, not blocked unless a real blocker meets
  the conditions above;
- record exact next command, route, state, candidate, and unresolved findings.

## 18. Persistent Program Ledgers

The implementation must use
`docs/ui/147-ossie-ui-quality-program-ledger.md` as the one canonical mutable
surface, issue, reference, decision, and evidence ledger. Create it during
section 26.1 preflight and link it from this plan. Do not create competing
status records in ad hoc chat messages or multiple evidence files.

### 18.1 Surface ledger

```text
surface id
family
routes
roles
required states
baseline evidence
reference brief
starting commit
candidate commit
cycle count
Reviewer A verdict
Reviewer B verdict
consolidated findings
verification result
status
after evidence
residual risk
```

Allowed status values:

```text
queued
in_preflight
in_implementation
in_review
changes_requested
agent_accepted_pending_human
blocked_local_for_run
needs_human_surface
paused_global_critical
incomplete_checkpoint
complete_after_human_review
```

### 18.2 Issue ledger

```text
finding id
severity
category
surface/route/state/viewport
evidence
owner
cycle introduced
disposition
fix commit
verification
residual risk
```

### 18.3 Reference ledger

```text
surface
reference product
exact URL
source type
retrieved date
viewport/account context
primary/secondary
borrow
reject
Ossie constraints
last revalidated date
status
```

### 18.4 Evidence ledger

```text
surface
route/state/viewport
fixture identifier
browser/environment
before screenshot
candidate screenshot
approved baseline, if any
accessibility result
keyboard/zoom/motion result
console/network result
intentional differences
commit
date
```

No ledger entry may include passwords, cookies, tokens, private URLs, customer
data, or raw private Capture material.

## 19. Browser, Viewport, And State Matrix

Use deterministic synthetic fixtures and the normal user entry point.

### 19.1 Required viewports

| Context                   |                                              Viewport/evidence |
| ------------------------- | -------------------------------------------------------------: |
| Desktop application       |                                                     1440 × 900 |
| Smaller desktop/tablet    |                                                     1024 × 768 |
| Mobile application/public |                                                      390 × 844 |
| Reflow proxy              |                          approximately 640 CSS px at 200% zoom |
| Public narrow hardening   | 320 CSS px where the accepted accessibility matrix requires it |
| Extension normal          |                                                      360 × 600 |
| Extension stress          |                                                    180px width |

Use the actual browser zoom control for final 200% evidence where the browser
tool supports it. A width proxy alone is not the final zoom claim.

### 19.2 Required interaction evidence

- normal entry from setup/login/project navigation/public link/extension icon;
- pointer and keyboard-only operation;
- focus entry, order, visibility, modal containment, dismissal, and return;
- long names, labels, code, navigation trees, content, and row counts;
- loading and delayed request;
- empty and populated;
- failed request and retry;
- denied/read-only/archived/frozen;
- saving, conflict, and destructive confirmation;
- reduced motion;
- console errors and warnings attributable to the surface;
- failed or unexpected network requests;
- URL transitions, canonical behavior, and back/forward where relevant.

### 19.3 Accessibility evidence

- automated axe-style scan on representative routes/states;
- semantic accessibility-tree inspection;
- keyboard-only walkthrough;
- visible focus and focus return;
- labels, names, descriptions, status announcements, and error associations;
- heading and landmark structure;
- contrast for token changes;
- target size and non-hover access;
- 200% zoom/reflow;
- reduced motion;
- manual direct-manipulation alternatives;
- manual screen-reader evidence when the environment supports it, otherwise a
  truthful limitation.

Automated scans cannot approve visual quality or complete accessibility.

### 19.4 Local services, synthetic data, and login authority

Plan `147` explicitly authorizes the executor to prepare and use a disposable,
isolated local test environment for browser validation. Within that environment
the executor may:

- start, stop, and restart the repository's local web, API, database, and
  applicable extension development processes;
- use existing repository seed/fixture/setup mechanisms;
- create deterministic synthetic test users, Organizations, Project
  Memberships, Projects, Project Versions, Capture Sessions, Guides,
  Interactive Demos, Documentation Sites/Pages, Revisions, Publications,
  Publish Links, invitations, comments, assets, and lifecycle states required
  by the route/state matrix;
- log in through the real setup, login, invitation, authenticated portal,
  public-link, password-challenge, and extension entry points;
- reset or reseed only a database that the executor created or positively
  identified as a disposable local Plan `147` test database;
- create multiple role-specific synthetic users when permission, denial,
  read-only, review, or ownership states require them.

The synthetic graph must remain tenant-consistent and satisfy the accepted
Project Membership, immutable Capture source, protected-asset, Revision,
Publication, and Publish Link invariants. Prefer real setup, API, domain, and UI
commands for behavior being proven. An existing database-direct fixture may
establish background state only when it obeys current constraints; its insertion
is not evidence that the user-facing workflow works. Create immutable fixture
records at the required lifecycle state rather than mutating an existing
Revision, Publication, or finalized Capture into a different historical state.

Before any seed, reset, or login action, the executor must:

1. resolve and record the exact service startup, seed, reset, and health-check
   commands from the current repository rather than assuming historical
   commands;
2. positively identify the database/environment as local, disposable, and
   Plan `147`-owned;
3. refuse to modify production, staging, customer, shared developer, unknown,
   or ambiguously targeted data;
4. prefer idempotent deterministic seeds or a Plan `147` namespace over
   destructive cleanup;
5. verify the web and API health endpoints and required ports are reachable;
6. verify the synthetic login works before starting a surface audit;
7. verify the expected Organization, Project, Project Version, role, and
   lifecycle context after login;
8. record only fixture identifiers and commands in the canonical ledger.

Test credentials must come from an existing repository-approved synthetic
fixture, a locally created test user, or execution-time environment variables.
Passwords, cookies, session tokens, invitation secrets, Publish Link passwords,
and private URLs must never be committed to this plan, the ledger, screenshots,
console output, shell history intentionally captured as evidence, or reviewer
prompts. The ledger records the credential source category and verification
result, not the secret value.

If safe local services, a disposable database, or working synthetic credentials
cannot be established, set the appropriate section 17 status. Do not bypass
authentication, weaken permissions, or manufacture browser evidence.

## 20. Visual Acceptance Rubric

Reviewer A scores representative screens from 1–5. The coordinator records the
scores without independently replacing them. Reviewer B owns the separate
accessibility/product/engineering gates defined in section 15.5.

| Dimension           | 1                          | 3                            | 5                                                   |
| ------------------- | -------------------------- | ---------------------------- | --------------------------------------------------- |
| Hierarchy           | competing/no clear task    | understandable with friction | task, context, status, and action immediately clear |
| Scanability         | laborious and inconsistent | usable                       | predictable, fast repeated scanning                 |
| Density             | wasteful or cramped        | workable                     | appropriate to task and viewport                    |
| Typography          | default/uneven             | readable                     | deliberate scale, rhythm, and measure               |
| Spacing/alignment   | arbitrary                  | mostly aligned               | systematic and optically resolved                   |
| Primary action      | indistinguishable          | findable                     | immediate and stable                                |
| State clarity       | ambiguous                  | understandable               | explicit, consistent, actionable                    |
| Consistency         | page-local system          | mostly shared                | recognizably one Ossie system                       |
| Responsive behavior | overflow/linear dump       | usable                       | deliberately recomposed                             |

Agent acceptance requires:

- no unresolved P0 or P1;
- every Reviewer A score at least 4/5 on the representative route/state set;
- Reviewer A verdict `accept`;
- Reviewer B verdict `accept` and every required Reviewer B gate `pass`;
- focused behavior tests pass;
- required typecheck, lint, build, and broad tests pass;
- real-browser required states pass;
- no unexplained console or network errors;
- keyboard, 200% zoom, reduced motion, and public/auth separation pass;
- all screenshot differences are intentional and documented;
- no required evidence is fabricated or marked pass when unavailable;
- the diff remains scoped and reversible.

Human acceptance remains separate. Until the user's final review, the surface
status is `agent_accepted_pending_human`.

## 21. Screenshot And Visual-Regression Policy

### 21.1 Evidence classes

Every screenshot must be classified:

- **approved visual reference** — an explicitly accepted Ossie baseline;
- **functional evidence** — proves a workflow/state, not visual approval;
- **known-problem evidence** — deliberately records an issue;
- **historical-only evidence** — obsolete alpha/pre-rename/previous behavior;
- **candidate evidence** — awaits both agent reviews and final human review.

Never treat a functional or historical screenshot as a visual target.

### 21.2 Capture rules

- fixed synthetic fixture and data seed;
- fixed route, state, viewport, browser build, locale, time-zone behavior, and
  motion preference where controllable;
- stable animation/caret/timestamp handling;
- current and candidate captures use the same conditions;
- screenshot name maps to the evidence ledger;
- image diff plus semantic/behavioral review;
- baseline changes require intentional-difference notes;
- approved baselines are never updated automatically.

### 21.3 Committed harness decision

A committed Playwright plus axe browser suite remains a strong recommended
direction for repeatable workflows, screenshots, and visual comparisons.
However, it is a new significant development-tooling dependency and therefore
is not pre-approved by this plan.

Before adoption, produce a dependency ADR/decision packet containing:

- concrete current-tooling gap;
- proposed exact packages and pinned versions;
- license and security review;
- workspace location and ownership;
- deterministic fixture/environment design;
- CI runtime and browser artifact cost;
- initial representative tests;
- baseline review/update policy;
- alternatives, including current agent-browser and Vitest coverage;
- rollback/removal path.

Stop for user approval at that gate. Until approved, use current repository
tests and reproducible agent-browser evidence without claiming committed visual
regression exists.

## 22. Engineering Verification

### 22.1 Mandatory per-surface implementation preflight

No UI or behavior edit may begin until the coordinator records this exact
surface preflight in the canonical ledger:

```text
actual HEAD and dedicated worktree/branch
git status and ownership of every existing change
surface id, exact routes, roles, states, and normal entry points
current component/caller/data/request graph
exact intended write set
explicit out-of-scope files and behavior
accepted domain/ADR constraints
reference inputs and revalidation date
baseline screenshots and current scores
exact focused test commands and expected failing test for behavior fixes
exact browser state/viewport evidence to capture
dependency declaration: none, existing only, or decision gate required
schema/migration/API declaration: none or critical decision required
Reviewer A brief and rubric inputs
Reviewer B brief and required gates
rollback boundary
```

Re-read the actual code and tests during preflight. A file list inferred from
this planning audit is not current runtime truth. If the write set, route graph,
dependency/migration declaration, or acceptance evidence cannot be bounded,
the surface is not implementation-ready.

### 22.2 Per candidate

- establish a failing test for every behavior/correctness fix;
- run focused unit/component/domain/server tests;
- run focused typecheck/lint where available;
- render the pattern gallery state;
- exercise the real route in the browser;
- capture required state/viewport evidence;
- inspect console and network;
- run both independent reviews.

### 22.3 Per accepted surface family

- all family-focused tests;
- web typecheck and lint;
- extension checks when shared tokens/components change;
- `packages/ui` checks;
- affected server/domain checks for read-model or route fixes;
- production build for affected applications;
- bundle/chunk comparison for substantial editor/reader changes;
- second clean browser pass from normal entry points.

### 22.4 Final broad verification

Run the exact broad commands below from the recorded execution worktree:

```text
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

The 2026-08-06 planning environment did not expose `rtk`. At execution, use the
repository-required prefix when available; if it remains unavailable, record
that capability limitation and the exact direct-command fallback rather than
silently omitting verification.

Also run, with exact commands recorded during surface preflight:

- migration/schema check if any accepted non-UI correction unexpectedly
  requires it, after the required decision gate;
- affected database/integration tests when server, persistence, publication,
  access, or read-model code changes;
- affected local service health and browser smoke commands;
- dependency frozen-install/license/audit checks if dependencies were approved;
- complete representative browser route/state matrix;
- public/authenticated/embed separation;
- extension real-toolbar path where available;
- clean worktree and scoped commit audit;
- current-truth documentation scan.

Record exact commands, dates, results, skips, environmental limitations, and
artifact paths. Do not convert a blocked capability into synthetic evidence.

## 23. Dependency Adoption Gates

No new dependency is required for the first token, route, pattern, and pilot
work.

If a workflow proves a concrete need, evaluate only one family at a time:

| Candidate        | Evidence-gated use                                                                       | Not allowed as justification                   |
| ---------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Radix primitives | dialog/menu/popover/tooltip/tabs focus and keyboard behavior                             | visual fashion or bulk component import        |
| TanStack Query   | repeated remote/server-state loading, cache, retry, invalidation, safe mutation behavior | local selection, unsaved text, canvas geometry |
| TanStack Table   | operational lists that require sorting/filtering/selection/pagination/column priority    | tiny static lists                              |
| React Hook Form  | complex multi-section form state and Zod integration                                     | every small native form                        |
| dnd-kit          | accepted reorder interaction with keyboard alternatives                                  | hotspot resizing by default                    |
| resizable panels | desktop navigator/canvas/inspector enhancement with collapse and narrow fallback         | making resizing mandatory                      |
| Playwright + axe | committed repeatable route, viewport, screenshot, and automated accessibility evidence   | replacing manual visual/accessibility review   |

Do not add as part of this program without a separate accepted decision:

- a full styled suite such as MUI, Ant Design, or Chakra;
- bulk copied shadcn components;
- React Router migration;
- a motion library for decoration;
- multiple competing headless component families;
- a Storybook migration before the product-pattern gallery proves insufficient;
- whole-graph Tiptap or router/content-authority Fumadocs adoption;
- mutable remote design rules fetched during every run.

Every proposal must specify problem, callers, alternatives, bundle cost,
license, accessibility behavior, migration, fallback, rollback, and test plan.
Because `AGENTS.md` classifies major dependencies/licenses as critical, the
runner stops for the user before adoption.

## 24. Git, Worktree, And Rollback Discipline

- Use a dedicated runner worktree/branch for every unattended write-heavy run.
  If isolation cannot be established, stop before implementation.
- Create it from the current approved Plan `147` execution commit, then record
  that commit as the runtime starting point. Do not reset to the historical
  audit commit `6af6385`.
- Record the starting commit for every surface.
- Preserve user and other-agent changes.
- Only the implementer writes during a candidate cycle.
- Create one cohesive reversible commit per candidate or accepted surface.
- Reviewers inspect the exact immutable commit.
- Do not use destructive reset/checkout operations.
- Roll back only runner-owned commits and only after resolving exact scope.
- Never push, merge, open/modify a PR, deploy, publish, or message external
  users without explicit authority.
- Keep screenshots and evidence free of secrets and customer data.
- Audit shared token/component blast radius before accepting a family.

Suggested commit categories:

```text
docs(ui): reconcile Plan 147 current truth
fix(web): render Documentation Publication preview
fix(ui): repair semantic token coverage
feat(ui): add accepted product pattern
refactor(web): apply accepted pattern to <surface>
test(ui): add <surface> state and browser evidence
docs(ui): record <surface> review and acceptance
```

Commit wording is illustrative, not a requirement to fragment one cohesive
change artificially.

## 25. Unattended Runtime And Continuation Protocol

Plan `147` can be executed through a long-running Codex Goal, repeated scheduled
task, or a Codex SDK runner. A prompt alone does not make a process literally
infinite: the machine, repository, browser, local services, credentials/fixture,
and execution surface must remain available, and platform limits still apply.

Official execution references, verified 2026-08-06:

- [Long-running work](https://learn.chatgpt.com/docs/long-running-work);
- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents);
- [Scheduled tasks](https://learn.chatgpt.com/docs/automations);
- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk).

Runtime constraints:

- Goal mode does not expand filesystem, network, approval, or external-action
  authority;
- local scheduled tasks require the machine and desktop app to remain running;
- scheduled tasks use unattended permissions, so an action that requires an
  unavailable approval fails rather than becoming authorized;
- SDK threads can be started, continued, and resumed, but durable queue,
  checkpoint, retry, and application-state logic remains owned by the runner;
- Ossie ships no autonomous UI runner as application behavior merely because
  this plan describes one.

For a one-to-two-day heavy-lifting run:

1. establish the mandatory dedicated worktree;
2. start from the current clean approved Plan `147` execution commit and record
   it; do not assume the audit commit remains current;
3. keep the local API/web/extension environments reproducible;
4. checkpoint after every candidate, both reviews, acceptance, and block;
5. resume from the durable surface ledger, never from memory alone;
6. do not start a new surface near the end of an execution window;
7. leave incomplete work clearly labeled with exact resumption instructions;
8. stop on the critical decisions and conditions in section 17;
9. never interpret “keep running” as permission to expand product scope or
   external side effects;
10. assemble one final human review bundle after all agent-accepted surfaces.

The autonomous process may make reversible visual and implementation choices
inside the accepted Quiet Versioned Workbench direction. It must not make a new
brand direction, major dependency, product-semantic, access, privacy, or
security decision for the user.

## 26. Ordered Execution Checklist

### 26.1 Program setup and truth

- [x] Record execution worktree, branch, starting commit, tools, services, and
      synthetic fixtures.
- [x] Re-audit `AGENTS.md`, `CONTEXT.md`, ADRs, Plan `147`, predecessor `146`,
      code, tests, and worktree.
- [x] Positively identify or create the disposable local Plan `147` database;
      record its non-production proof without recording secrets.
- [x] Resolve and record current startup, seed/reseed, health-check, and login
      verification commands.
- [x] Start the required local services, pass web/API health checks, and verify
      the real synthetic login before capturing baselines.
- [x] Seed the deterministic role, content, lifecycle, public-link, and failure
      states required by the first surface without touching existing unknown or
      shared data.
- [x] Create and link the canonical
      `docs/ui/147-ossie-ui-quality-program-ledger.md`.
- [x] Reconcile all section 8 current-truth drift.
- [x] Build the route/surface/state ledger with exact route strings and roles.
- [x] Classify existing `docs/ui/` screenshots and reports.
- [x] Create/revalidate the external reference ledger.
- [x] Record baseline visual scores and issue IDs.

### 26.2 Blocking repairs

- [x] Add failing coverage for Documentation Publication preview routing.
- [x] Implement and browser-verify the accepted immutable Publication preview.
- [x] Inventory all custom-property definitions and live consumers.
- [x] Resolve confirmed undefined live variables through accepted semantic
      tokens.
- [x] Add a repository check for newly undefined Ossie variables.
- [x] Recheck focus, contrast, spacing, radii, and Demo interaction after token
      repair.

### 26.3 Shared foundation

- [x] Establish one semantic token authority.
- [x] Migrate shared primitives from generic/raw values where equivalent tokens
      exist.
- [x] Identify and remove only proven dead CSS.
- [x] Define primary/secondary/overflow/destructive command hierarchy.
- [x] Define shared state, list, workbench, drawer, reader, and access patterns.
- [x] Expand `/__design-system` with production patterns and state matrices.
- [x] Test portal, extension, and shared UI consumers.

### 26.4 Representative pilots

- [x] Projects library pilot completes both reviews.
- [x] Interactive Demo workbench pilot completes both reviews.
- [x] Public Product Documentation reader pilot completes both reviews.
- [x] Documentation administration pilot completes both reviews.
- [x] Active extension Capture pilot completes both reviews; installed-toolbar verification remains blocked locally.
- [x] Consolidate approved pilot patterns before family rollout.

### 26.5 Surface-family rollout

- [x] Entry/setup/login/invite family.
- [x] Organization members/invites/operations/compliance family.
- [ ] Projects/Project workspace family — final workspace transient-state cycle
      is `needs_human_surface` because the normal project route is still owned
      by `LegacyProjectRedirect`; prior Project library/denied/list-state
      candidates remain recorded in the ledger.
- [x] Project Version/settings/activity/Carry Forward family.
- [x] Capture library/detail/recovery family.
- [x] Guide library/editor/preview/history/publishing family.
- [x] Public Guide reader/embed family.
- [x] Demo library/editor/preview/history/publishing family.
- [x] Public Demo viewer/embed family.
- [x] Documentation Site library/operations family.
- [x] Documentation Site/Page authoring family.
- [x] Documentation review/assets/snippets/OpenAPI/portability family.
- [x] Documentation draft/Revision/Publication preview family.
- [x] Public Documentation reader/API-reference family.
- [x] Shared public access challenge/version-selection family.
- [x] Extension installation portal family.
- [x] Extension popup/Capture/recovery/completion family; installed-toolbar
      verification remains `blocked_local_for_run`.
- [x] Global unsupported/Page-not-found/shell-failure family.
- [x] Contributor/operator `apps/docs` family.

### 26.6 Cross-product hardening

- [ ] Complete desktop, tablet, mobile, 200% zoom, and extension matrix.
- [ ] Complete keyboard, focus, reduced-motion, and direct-manipulation checks.
- [ ] Complete loading/empty/error/denied/read-only/archived/destructive matrix.
- [ ] Complete public/authenticated/embed boundary checks.
- [ ] Resolve all P0/P1 issues.
- [ ] Review every remaining P2/P3 disposition and residual risk.
- [x] Run final focused and broad engineering verification.
- [x] Run second clean browser pass.
- [x] Reconcile plan, current-truth docs, evidence, commits, limitations, and
      handoff.
- [x] Assemble final human review bundle.
- [x] Keep final status `agent_accepted_pending_human` until user review.

The second clean pass is recorded in the evidence ledger and bundle. It covers
fresh authenticated desktop entry/library routes, authenticated tablet/mobile
representatives, the seeded anonymous Guide and embed routes, and truthful
anonymous unavailable Documentation/Demo routes. It does not close the
required matrix: native 200% evidence is now separately recorded for the
Documentation reader/operation, Interactive Demo reader/embed/access states,
direct extension popup, and supplemental authenticated Projects/Documentation
states, isolated anonymous Documentation reader, and the Guide reader/embed/
editor/viewer/access samples, plus shared foundation/entry/fallback samples,
the Interactive Demo editor/preview/Revision/viewer/lifecycle samples, and the
authenticated Documentation authoring/Page editor/draft-preview/Review Inbox
states (including the localized Review Inbox landmark repair), while
installed extension-toolbar activation, direct-manipulation breadth, and
unclaimed loading/denied/populated states remain explicitly limited or
separately evidenced. The authenticated Capture portal was also exercised in
separate synthetic owner/viewer sessions at native 200% across active/named/
archived lists, completed/empty/capturing/canceled/archived details, owner
controls, viewer read-only controls, and an aborted-list error with Retry;
these sampled states were axe-clean and stayed within the 525px CSS viewport.
The Project Version family was also rechecked at native 200% for owner and
viewer Main/Summer release/Archived release workspaces, owner settings and
management, empty Carry Forward, controlled versions-load error/Retry, and
viewer denied/read-only boundaries. Those samples also stayed within the
525px CSS viewport; the shared context identity split remains the same
human-held shell limitation.
The Organization administration family was additionally exercised at native
200% for owner members/invites, compliance timeline, Documentation Operations
usage/limits, owner members error/Retry, and viewer denied/read-only states.
These samples stayed within the 525px CSS viewport; the known compliance and
Documentation Operations metric probes remain explicitly incomplete.
The Projects library was also exercised at native 200% for active, empty
archived, create-form, controlled list-error/Retry, and owner/viewer states.
The valid seeded `/projects/:projectId` entry redirected through the existing
`LegacyProjectRedirect` into the Project Version workspace and was axe-clean;
this does not mount or accept the separate `ProjectWorkspacePage` candidate,
so its route-ownership hold remains unchanged.
The authenticated extension-installation portal was additionally exercised at
native 200% for ready, ZIP download, download-error, and forced auth-check-error
states. The auth-check error initially exposed a missing level-one heading;
`fc8071c` added that bounded semantic heading test-first, and the browser
recheck reported axe 0/0 with no overflow. The direct toolbar-icon activation
limitation remains under `extension-capture`.
The public contributor/operator `apps/docs` landing page was also exercised at
native 200% with `devicePixelRatio=2`, a 525px CSS viewport, 4,798px document
height, four loaded image elements, axe 0/0, reduced motion, no horizontal
overflow, and a keyboard path through README and self-hosting links. External
source links were not followed; this remains separate from customer-authored
Product Documentation.
The shared Project Version context header visibly splits its label at this
zoom despite no document overflow, so that shell limitation remains recorded
for human disposition rather than being silently changed in this bounded pass.

### 26.7 Human feedback and final closeout

- [ ] Record every human finding without overwriting the original agent review.
- [ ] Classify each finding as accepted, rejected with rationale, deferred with
      owner/trigger, or blocked by a critical decision.
- [ ] Run accepted findings through bounded implementation, focused
      verification, both reviewers, and final clean verification.
- [ ] Re-run affected surface and broad checks.
- [ ] Update accepted visual baselines only for explicitly approved results.
- [ ] Reconcile current-truth docs, Plan `147` status, implementation log,
      evidence, limitations, leftovers, commits, and handoff.
- [ ] Mark Plan `147` complete only when no required work or accepted human
      finding remains.

## 27. Final Human Review Bundle

The assembled bundle is [`docs/ui/147-plan-147-human-review-bundle.md`](../ui/147-plan-147-human-review-bundle.md).

The final bundle must let the user review the heavy lifting in one sitting:

- executive outcome and remaining decisions;
- complete surface status registry;
- navigable before/after contact sheet grouped by user journey;
- exact route/state/viewport labels;
- representative interaction recordings only where motion/direct manipulation
  materially matters;
- both reviewer reports for each surface;
- consolidated finding/disposition log;
- intentional screenshot-difference register;
- accessibility, keyboard, zoom, responsive, console, network, performance,
  test, lint, typecheck, and build summaries;
- exact commits and rollback map;
- approved/deferred/rejected dependency decisions;
- reference products, exact patterns borrowed/rejected, and validation dates;
- limitations and environmental blocks;
- a short list of decisions that genuinely require the user.

The bundle must not require the user to reconstruct the process from chat
history.

## 28. Risks And Controls

| Risk                                | Control                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| Aesthetic oscillation               | accepted direction, one primary/secondary reference, three-cycle cap |
| Context drift in a long run         | durable surface/issue/evidence ledgers and commit checkpoints        |
| Correlated reviewers                | blind independent reviews of one immutable candidate                 |
| Concurrent write collision          | one implementer writer and dedicated worktree                        |
| Baseline laundering                 | explicit screenshot classes; no automatic approved-baseline update   |
| Reference drift                     | exact URLs, dates, revalidation, Ossie authority                     |
| Copyright/brand copying             | written borrow/reject notes; no unapproved third-party assets        |
| Product-semantic regression         | ADR/domain precedence, Reviewer B, server/domain tests               |
| Shared component blast radius       | gallery plus all-consumer verification before expansion              |
| Privacy leakage                     | synthetic fixtures; no secrets/private Capture evidence              |
| Browser overclaim                   | exact environment, route, state, and limitation records              |
| Dependency sprawl                   | current-stack-first execution and user decision gate                 |
| Time-window truncation              | checkpoint and no new surface near deadline                          |
| Partial run mistaken for completion | explicit status values and final acceptance checklist                |
| Mobile as a linear dump             | responsive composition score and task-mode/drawer evidence           |

## 29. Implementation Log

2026-08-06 — `entry-onboarding` — starting commit `85363ea`; candidate
`f27714b`. Composed the brand-only entry shell, login/setup/invite typography
and responsive spacing, named the shared `Entry workspace` landmark, and
bounded the standard Invite card. Focused entry tests passed 22/22; the full
web suite passed 495/495; web check-types, lint, build, and diff check passed;
desktop/narrow login, setup-complete, invalid-invite, axe, keyboard, and
reduced-motion evidence passed. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; setup-ready and loaded-invite browser states
remain component-test coverage; P2-010 is resolved in `59fd07f`, with broader
raw CSS cleanup tracked separately.

2026-08-06 — `public-access` — starting commit `85deae4`; candidate `8e38ee4`.
Clarified the shared public Project Version selector, named its multi-entry
combobox, and tokenized its responsive chip/control styling. Focused public
reader/selector tests passed 16/16; the full web suite passed 496/496; web
check-types, lint, build, and diff check passed; anonymous valid Guide and
truthful unavailable Demo browser/a11y evidence passed at desktop and narrow
widths. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; multi-entry and populated Demo/Documentation
browser fixtures remain unavailable; P2-010 is resolved in `59fd07f`, with
broader raw CSS cleanup tracked separately.

2026-08-06 — `extension-installation` — starting commit `7893091`; candidate
`1058dbd`. Composed the authenticated extension installation workspace with a
named landmark, tokenized hierarchy, download/instruction cards, responsive
desktop and narrow layout, and a solid-card contrast-safe treatment. Focused
extension installation tests passed 22/22; the full web suite passed 496/496;
web check-types, lint, build, and diff check passed; authenticated ready-state
browser/a11y, keyboard, and reduced-motion evidence passed at desktop and
narrow widths. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; installed-toolbar/permission evidence remains
blocked under `extension-capture`, and shared-shell/zoom limitations plus
P2-010 remain recorded.

2026-08-06 — `design-system-gallery` — starting commit `3adc9db`; candidate
`7cf7057`. Expanded the local `/__design-system` specimen with a shared loading,
empty, error/retry, archived/read-only, and saving/validation matrix, a named
workspace, a keyboard-focusable artifact table region, and responsive long-label
table behavior. Focused gallery/App tests passed 21/21; web check-types, lint,
build, and diff check passed; desktop/narrow browser, axe, keyboard, and
reduced-motion evidence passed. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; the gallery remains synthetic/local-only and
P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate.

2026-08-06 — `global-fallback` — starting commit `7cf7057`; candidate
`de37b5e`. Replaced the generic unsupported-route card with a truthful
Page-not-found h1, named main, bounded recovery actions to Projects and sign-in,
and a solid fallback background. Focused unsupported-route test passed 1/1; web
check-types, lint, build, and diff check passed; anonymous desktop/narrow axe,
keyboard, and reduced-motion evidence passed. Reviewer A and Reviewer B both
accepted. Status: `agent_accepted_pending_human`; forced Documentation lazy-load
failure remains the existing adjacent boundary.

2026-08-06 — `contributor-docs` — starting commit `de37b5e`; candidate
`ae37ba6`. Changed the docs landing hero evidence wrapper from an invalid
ARIA-labeled div to a semantic figure with a visually hidden caption. Focused
docs page/content tests passed 10/10; docs check-types, lint, build, and diff
check passed; local desktop/narrow image, axe, keyboard, and reduced-motion
evidence passed. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; external source links were not followed and
customer Product Documentation remains a separate app/web surface.

2026-08-06 — `token-foundation` follow-up — starting commit `105fc5b`; candidate
`59fd07f`. Completed the four live semantic aliases that remained after the
original token candidate: link color, sans family, small text size, and medium
radius. The focused token contract passed 4/4; full UI tests passed 8/8;
extension tests passed 140/140; extension typecheck, lint, and build passed;
`pnpm check-css-tokens` passed with 127 definitions and 122 consumers; browser
desktop/narrow axe and no-overflow evidence passed; Reviewer A and Reviewer B
both accepted. Status: `agent_accepted_pending_human`; P2-010 is resolved and
installed-toolbar capability remains a separate local block.

2026-08-06 — `shared-foundation` — starting commit `24b2395`; first candidate
`adef71a`; follow-up candidate `9e53e20`. Migrated the shared UI primitives to
semantic Ossie tokens, added typed command/state/list/workbench/drawer/reader/
access/compact-extension specimens to the local design-system gallery, and
removed only five CSS `.page`/`.main` declaration pairs proven orphaned by a
source-consumer audit. TDD focused UI tests passed 11/11; focused web tests
passed 45/45; the final web suite passed 94 files / 497 tests; extension passed
19 files / 140 tests; web and extension typechecks, lint, and builds passed;
`pnpm check-css-tokens` passed with 130 definitions / 123 consumers; diff check
passed. Exact parent/candidate desktop and narrow browser evidence passed with
no overflow, reduced motion, keyboard focus, and axe 0 violations / 0
incomplete. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; the gallery remains synthetic/local-only,
installed-toolbar verification remains `blocked_local_for_run`, and broader
200% zoom/raw CSS review remains in section 26.6.

2026-08-06 — `shared-shell-mobile` — starting commit `a83f2ae`; preflight
commit `b332180`; candidate `8b45a4b`. Replaced the shared PortalAppShell
narrow horizontal navigation rail, which measured 837px inside a 390px
viewport, with an intrinsic-width-safe wrapping grid. Desktop remains the
existing two-column shell; 390px uses two columns and 320px uses one column so
all existing destinations remain visible without page or nav overflow. The
TDD responsive contract and shell tests passed 6/6; the final web suite passed
95 files / 498 tests; web check-types, lint, build, token check 130/123, and
diff check passed. Browser evidence at 1440px, 390px, and 320px passed focused
navigation axe 0/0, keyboard traversal, reduced motion, and local request/
console checks. Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; the truthful unauthenticated `/projects`
browser route retains its pre-existing missing-h1 axe finding, authenticated
role contexts remain component-test coverage, native browser zoom was not part
of this candidate run, and P2-001 plus the broader 26.6 matrix remain open.

2026-08-06 — `projects-denied` — starting commit `b5b7924`; preflight commit
`9612c49`; cycle-1 candidate `3a8fad4` following `aefb9dd`. Added a semantic
level-one `Projects` heading and labeled recovery section to the existing
unauthenticated Project list state while preserving the sign-in sentence and
safe `next` URL. The failing denied-state assertion passed after the change;
Project list + shell focused tests passed 20/20; the clean full web suite passed
95 files / 498 tests; web check-types, lint, build, token check 130/123, and
diff check passed. Desktop/narrow browser evidence passed axe 0/0, no overflow,
keyboard/reduced-motion, and local request/console checks. Reviewer A and
Reviewer B both accepted. Status: `agent_accepted_pending_human`; authenticated
owner/viewer browser fixtures, native browser zoom for this candidate, P2-001,
and the broader 26.6 matrix remain open.

2026-08-06 — `projects-state-semantics` — starting commit `e67d392`; preflight
commit `36d77f6`; cycle-2 candidate `aa6f892`. Added a semantic `Projects`
heading to the loading and recoverable-error Project list states, exposed the
loading message as `role=status` and the error message as `role=alert`, and
preserved the existing Retry action and loader/retry contracts. The new
loading/error assertions were red before implementation and green afterward;
ProjectListPage passed 17/17, App passed 20/20, and the adjacent shell tests
passed 4/4. The clean full web suite passed 95 files / 498 tests; web
typecheck, lint, build, token check 130/123, and diff check passed. Desktop and
narrow error-state browser evidence passed axe 0/0, no overflow, and keyboard
focus for Retry. The browser router could abort or immediately answer the local
request but could not safely delay it, so no loading screenshot is claimed.
Reviewer A and Reviewer B both accepted. Status: `agent_accepted_pending_human`;
authenticated owner/viewer browser fixtures, native browser zoom for this
candidate, P2-001, and the broader 26.6 matrix remain open.

2026-08-07 — `projects-workspace-state-semantics` — starting commit `00628d1`;
preflight commit `c8a7d56`; cycle-3 candidate `e94d6a9` (final allowed cycle).
Added semantic `Projects` headings to `ProjectWorkspacePage` loading,
unauthenticated, not-found, and recoverable-error branches; loading now exposes
`role=status`, and recoverable error exposes `role=alert`, while existing
sign-in, not-found, and Retry behavior remains unchanged. Red tests passed
before implementation; the focused workspace suite passed 9/9 and adjacent
Project list/shell tests passed 21/21. The route recheck found that `App.tsx`
still maps `/projects/:projectId` to `LegacyProjectRedirect`, so the actual
browser route rendered the existing unauthenticated 401 fallback rather than
`ProjectWorkspacePage`; no runtime candidate screenshot or axe result is
claimed. Reviewer A marked the cycle incomplete and Reviewer B marked
`needs_human_surface`. Route ownership must be decided before this candidate
can be accepted or wired into the normal route. Status remains
`agent_accepted_pending_human` for the program; the surface is
`needs_human_surface`.
The post-candidate clean web suite passed 95 files / 498 tests; web check-types,
lint, build, CSS-token check (130 definitions / 123 consumers), and diff check
also passed.

2026-08-07 — `P2-001` scope preflight — starting commit `9468dcf`; no candidate.
The remaining queued issue is defined only as “cross-product libraries/readers”
and has no exact route, role, state, viewport, or owning component. The clearest
concrete finding is the accepted Publication-preview review’s question of
whether the bounded `DocumentationPublicationPreviewPage` should share
navigation/TOC treatment with the public `PublicDocumentationReaderPage`.
Retaining the bounded preview, extending it with reader chrome, and selecting a
different narrower cross-product study are materially different directions.
The issue is therefore recorded as `needs_human_surface`; no code, baseline,
API, domain, permission, public-link, or immutable-content behavior changed.

2026-08-07 — cross-product hardening evidence — documentation commit `37aa532`.
Ran a second clean anonymous public-route pass at 1024px and 390px with
reduced-motion and CSS-zoom reflow probes. The valid synthetic Guide remained
within viewport width with axe 0/0; current Documentation and Demo fixtures
truthfully rendered unavailable states with axe 0/0 and no browser errors.
Tablet/mobile screenshots and limitations are linked from the bundle and
ledger. This is supplemental evidence only, not a new surface candidate or a
claim that missing valid Documentation/Demo fixtures are populated.

2026-08-07 — `internal-library-state-semantics` — starting commit `66b2a4f`;
preflight commit `ab99b5a`; candidate `ce1d373`; route-test synchronization
follow-up `b159eed`. Added one page-level heading to each loading,
unauthenticated/not-found, and generic-error branch owned by the Capture
Sessions, Guide, and Interactive Demo list pages; added the same heading
semantics to Documentation Sites loading/error branches. Existing copy,
sign-in URLs, not-found behavior, Retry behavior, API calls, and route
boundaries remain unchanged. The TDD red run recorded 11 expected failures;
the focused four-owner suite passed 34/34, App route tests passed 20/20, and
the clean full web suite passed 95 files / 507 tests. Web typecheck, lint,
production build, CSS-token check 130/123, and diff check passed. Authenticated
synthetic browser error states were captured for all four exact routes at
1440px with axe 0/0 and no page errors; Documentation also passed at 390px
with reduced motion, no overflow, axe 0/0, and Tab focus on the Skip link.
Reviewer A and Reviewer B both accepted. Status:
`agent_accepted_pending_human`; loading and unauthenticated/not-found browser
screenshots remain explicitly unclaimed because the runner cannot safely delay
responses, while P2-001, `/projects/:projectId` route ownership, broader native
zoom coverage, extension toolbar, and the broader 26.6 matrix remain separate.

2026-08-07 — final engineering gates and second clean browser pass — source
verification commit `221517a`; closeout documentation/screenshots commit
`6c26074`. The exact repository-wide
`pnpm -r --if-present test` run passed across all active workspaces. `pnpm
check-types` passed 14/14 packages; `pnpm lint` passed 13/13 packages with 89
existing server warnings and zero errors; `pnpm build` passed 13/13 packages;
`git diff --check` passed. A fresh authenticated Chromium session covered
`/projects`, Capture Sessions, Guides, Interactive Demos, and Documentation
Sites at 1440px; Documentation Sites at 1024px; and Guides at 390px. Each
sample had one expected h1, one main, axe 0/0, no page errors, reduced motion,
and no tested viewport overflow; the mobile Tab path focused Skip to main
content. A separate fresh anonymous session covered the valid Guide and embed
routes plus truthful unavailable Documentation and Demo routes, all with axe
0/0 and no page errors. A CSS `zoom=2` mobile probe retained a 390px document
width and was recorded only as a proxy for that pass because native browser
zoom was not yet exercised. Screenshots are linked from the evidence ledger
and human bundle.
This is supplemental evidence, not a claim that the broader 26.6 matrix or
the installed extension toolbar is complete. Status remains
`agent_accepted_pending_human` pending human review and the unresolved
workspace-route/P2-001 decisions.

2026-08-07 — supplemental public-boundary and server verification — source
commit `806205b`; evidence-only continuation, no runtime code change. The
disposable Documentation fixture was freshly seeded and its valid public
reader passed at 1440px and 390px with axe 0/0, reduced motion, no overflow,
keyboard skip focus, and a valid `GET /widgets` operation route; alias and
redirect canonicalization plus the truthful gone state were also rechecked.
The disposable Interactive Demo fixture was then freshly seeded and its valid
reader/embed passed at 1440px and 390px with axe 0/0, no overflow, reduced
motion, keyboard Scene transition, password gate/invalid-password retry, and
restricted/expired/revoked boundaries. The two fixture families are mutually
exclusive and the final disposable database was reseeded with the
Documentation fixture. The server smoke suite passed 1 file / 2 tests. The
server DB suite passed 23/24 files and 87/88 tests; its one failure is the
unchanged baseline Documentation fixture assertion expecting one operation
while the fixture currently produces two. Because `d638112..HEAD` contains no
server-file diff, this unrelated test mismatch remains recorded rather than
folded into Plan 147 UI work. Status remains
`agent_accepted_pending_human`; no human-owned route, product, permission,
public-link, or extension-toolbar decision was inferred.

2026-08-07 — server fixture test-contract reconciliation — starting commit
`806205b`; test-only candidate `7982142`. The initial disposable DB run found
the Documentation fixture test expected one operation while the fixture’s two
declared OpenAPI operations produced two. Updated only
`apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
from `operations: 1` to `operations: 2`; no runtime server, API, domain,
permission, or UI file changed. The guarded focused fixture test passed 1/1;
the full server DB suite then passed 24/24 files and 88/88 tests, and the smoke
suite passed 1/1 file and 2/2 tests. This was a reversible verification-contract
repair, not a Plan 147 surface candidate, so no visual candidate or blind review
was created. Status remains `agent_accepted_pending_human`; all human-owned
route/design/extension decisions remain unchanged.

2026-08-07 — post-repair repository gates — source commit `7982142`. The
latest `pnpm -r --if-present test` passed across active workspaces, including
server 127 files / 553 tests and web 95 files / 507 tests. `pnpm check-types`
passed 13/13 tasks; `pnpm lint` passed 14/14 tasks with 89 existing server
warnings and zero errors; `pnpm build` passed 13/13 tasks; CSS-token check
passed 130 definitions / 123 consumers; and `git diff --check` passed. This
replaces the earlier pre-repair counts in the final verification record; no
runtime behavior changed.

2026-08-07 — supplemental unpacked-extension lifecycle verification — source
candidate `106705c`; evidence-only continuation, no runtime code change. A
fresh Chromium launch loaded the built MV3 extension from `apps/extension/dist`,
showed Ossie enabled with the `Pin to toolbar` control, and exercised the direct
extension-origin Connect, synthetic sign-in, Project/Project Version selection,
Capture start, completion, and portal-detail flow. Extension and portal axe
audits were 0/0; the final successful path returned login 200, Project/Project
Version reads 200, Capture Session create 201, and completion 200. Extension
storage was cleared and the disposable database was reseeded with the
Documentation fixture. The browser CLI still cannot activate the browser
toolbar icon itself, so `extension-capture` remains `blocked_local_for_run` for
that exact check; no toolbar-popup claim or human approval was inferred.

2026-08-07 — native 200% zoom hardening evidence — source candidate
`106705c`; evidence-only continuation, no runtime code change. Chromium’s
actual Page zoom control was set through `chrome://settings/appearance` to
200%, producing `devicePixelRatio=2` and a 525px CSS viewport. The synthetic
anonymous Documentation reader and `GET /widgets` operation were exercised at
that zoom with no visible horizontal overflow; the operation route passed axe
0 violations / 0 incomplete, while the reader retained one existing incomplete
overlapped-background contrast probe. Skip-to-content focus, reduced motion,
and successful local requests were verified. The Interactive Demo reader and
embed were also exercised at native 200% with axe 0/0, no overflow, and a
keyboard-only Start→Finish Scene transition; password invalid retry and
restricted/expired/revoked boundaries remained truthful and axe-clean. The
unpacked extension Connect and authenticated Ready states were also exercised
at native 200% with axe 0/0 and no overflow. The browser zoom was restored to
100%, extension storage was cleared, dedicated services were stopped, and no
broader 26.6 checkbox was closed from these bounded samples.

2026-08-07 — supplemental authenticated native 200% boundary evidence — source
candidate `106705c`, evidence-only continuation recorded in `2a3bd18`. A real
same-origin synthetic admin login reached `/projects` and
`/organization/documentation` at native Chrome Page zoom 200%; a separate
synthetic viewer session reached Documentation Operations without Owner-only
limit controls. All sampled documents stayed within a 517px client/scroll
width, and Projects passed axe 0/0. Documentation Operations retained the
known axe incomplete metric-number/overlapped-background contrast probe and no
violations. A fresh anonymous session separately rechecked the public
Documentation reader at native 200%, with no portal chrome, axe 0/0, and Tab
focus on Skip to content. Zoom was restored to 100%, browser storage cleared,
and dedicated services stopped. This supplements but does not close the
broader 26.6 matrix.

2026-08-07 — native 200% Interactive Demo internal hardening evidence — source
candidate `e97647e`; evidence-only continuation recorded in `2354803`.
With the guarded synthetic Plan 128 fixture, a real editor login covered the
active workbench at native Page zoom 200%, including keyboard Scene 1→Scene 2
selection without a mutation, and the immutable Working Draft preview and
Revision history. The editor retained its known three-textarea incomplete
contrast probe; preview and Revisions were axe 0/0. A separate viewer session
covered the active editor without write controls, plus empty and archived
read-only states; all sampled documents stayed within 517px and were axe 0/0.
Zoom was restored to 100%, browser storage cleared, services stopped, and the
final Documentation fixture was reseeded. This supplements but does not close
the broader 26.6 matrix.

2026-08-07 — native 200% Documentation authoring/review continuation and
landmark repair — source candidate `8055143`; implementation/evidence commit
`ab10940`. Separate synthetic owner and viewer sessions covered the Site
workbench Author/Site settings/Review/Content states, Install Page editor,
saved-draft preview, and Review Inbox at native Chrome Page zoom 200% with
`devicePixelRatio=2`, a 525px CSS viewport, and no horizontal overflow. The
owner and viewer preview, Review Inbox, and viewer authoring/Page states were
axe 0/0; Content and Page editor retained only known overlapped-background
textarea probes. The initial Review Inbox audit found three moderate nested,
duplicate, and unnamed `main` landmarks. TDD red/green coverage changed only
the route-owned content to a labeled section, and both role sessions were
rechecked at native 200% with axe 0/0. No mutation was submitted; screenshots
were visually inspected, zoom was restored to 100%, browser storage cleared,
services stopped, and the Documentation fixture remained the final disposable
database state. This is bounded evidence and a localized accessibility repair;
it does not close the broader 26.6 matrix or infer Plan 147 completion.

The repair is a localized continuation of the previously reviewed
`documentation-authoring` candidate; no new blind-review cycle is claimed, and
the prior review artifacts remain the review record for that family.

2026-08-07 — native 200% Guide-family hardening evidence — source candidate
`953a7fa`, evidence-only continuation recorded in `2922665`. With
the guarded synthetic Plan 127 Guide fixture, isolated anonymous Chromium
covered the valid reader and embed, password invalid retry, and
restricted/expired/revoked access states at native Page zoom 200%; all sampled
states were axe-clean and stayed within 517–525px client/scroll widths. A real
same-origin editor login then covered the active Guide editor at `dpr=2` with
the known two-textarea incomplete contrast probe; a separate viewer login
covered the same Guide as `Read only` with no Save/Archive/Publish/Delete
controls and axe 0/0. No mutation was submitted. Zoom was restored to 100%,
browser storage cleared, services stopped, and the final Documentation fixture
was reseeded. This supplements but does not close the broader 26.6 matrix.

2026-08-07 — native 200% shared foundation/entry/fallback evidence — source
candidates `9e53e20`, `f27714b`, and `de37b5e`; evidence-only continuation
recorded in `c84f897`. The local synthetic Design System gallery,
real `/login`, and unsupported-route fallback were exercised at native Chrome
Page zoom 200% with reduced motion. The gallery stayed within a 517px document
width and its artifact table had equal client/scroll widths; axe retained one
known synthetic contrast-background incomplete probe, while Login and Page not
found were axe 0/0. Keyboard reached the gallery Retry action and table region,
then the Login email field. Zoom was restored to 100%, browser storage cleared,
and the dedicated web service stopped. This supplements but does not close the
broader 26.6 matrix.

2026-08-07 — native 200% Capture portal continuation — source candidate
`f4a6010`; evidence-only continuation recorded in `70b4259`. Separate synthetic
owner and viewer sessions covered active, named, and archived Capture lists;
completed, empty, capturing, canceled, and archived details; owner-only create
guide/demo and upload controls; viewer read-only boundaries; and an exact list
API abort followed by the truthful error/Retry state and successful recovery.
The sampled documents stayed within a 525px CSS viewport at
`devicePixelRatio=2`, all audits reported axe 0/0, the owner keyboard path
reached the first Capture link after New Capture Session, and completed-detail
final-path requests returned 200. Screenshots were visually inspected; no
mutation was submitted. The native-200% shared Project Version context header
visibly split its label inside the constrained shell despite no document
overflow, so it remains a human disposition rather than an unscoped shell
change. Zoom was restored to 100%, storage cleared, services stopped, and the
Documentation fixture was reseeded. No new blind-review cycle is claimed for
this evidence-only continuation, and it does not close the broader 26.6 matrix
or infer Plan 147 completion.

2026-08-07 — native 200% Project Version continuation — source candidate
`c93ca11`; evidence-only continuation recorded in `b004e44`. Separate synthetic
owner and viewer sessions covered Main, Summer release, and Archived release
Project Version workspaces; owner Project settings and Project Version
management; empty Carry Forward with active and archived source choices;
controlled Project Version list failure and Retry recovery; viewer read-only
workspace and denied settings; and a keyboard path through the authenticated
workspace. At native Chrome Page zoom 200% (`devicePixelRatio=2`, 525px CSS
viewport), sampled documents had no horizontal overflow; workspace,
Carry Forward, and viewer denied-settings audits were axe 0/0, while settings
retained only the known overlapped-background textarea probe. Final reads
returned 200, and the only state-changing request was synthetic login; no
mutation was submitted. Screenshots were visually inspected, zoom was
restored to 100%, browser storage cleared, services stopped, and the
Documentation fixture was reseeded. The shared Project Version context
identity visibly splits inside the constrained shell at this zoom, so it
remains a human disposition rather than an unscoped shell change. No new
blind-review cycle is claimed for this evidence-only continuation, and it does
not close the broader 26.6 matrix or infer Plan 147 completion.

2026-08-07 — native 200% Organization administration continuation — source
candidate `c4141a1`; evidence-only continuation recorded in `48ac394`. Separate
synthetic owner and viewer sessions covered Organization members/invites,
compliance timeline, Documentation Operations usage/limits, owner members
error/Retry recovery, and viewer denied/read-only boundaries at native Chrome
Page zoom 200% (`devicePixelRatio=2`, 525px CSS viewport). Sampled documents
stayed within 525px with no page errors; owner members, viewer members denied,
and viewer compliance denied were axe 0/0, while compliance and Documentation
Operations retained the known metric contrast/background or short-text
incomplete probes. Screenshots were visually inspected; no mutation was
submitted. Zoom was restored to 100%, browser storage cleared, services
stopped, and the Documentation fixture was reseeded. No new blind-review cycle
is claimed for this evidence-only continuation, and it does not close the
broader 26.6 matrix or infer Plan 147 completion.

2026-08-07 — native 200% Projects library continuation — source candidate
`e94d6a9`; evidence-only continuation recorded in `f167ee5`. Separate
synthetic owner and viewer sessions covered active Projects, the empty
archived filter, owner create-form visibility, controlled Project-list
error/Retry recovery, viewer active/archived states, and a valid seeded
`/projects/:projectId` entry at native Chrome Page zoom 200%
(`devicePixelRatio=2`, 525px CSS viewport). The valid entry followed the
existing `LegacyProjectRedirect` into the Project Version workspace and was
axe 0/0; it is evidence of current shipped routing, not acceptance or mounting
of the separate `ProjectWorkspacePage` candidate. No mutation was submitted;
zoom was restored to 100%, browser storage cleared, services stopped, and the
Documentation fixture was reseeded. The route-ownership hold, broader 26.6
 matrix, and human review remain open. No new blind-review cycle is claimed.

2026-08-07 — native 200% extension-installation and contributor-docs
continuation — source candidate `1058dbd` / `ae37ba6`; the bounded extension
follow-up is `fc8071c`. The authenticated synthetic owner `/extension` route
covered ready, ZIP download, download-error, and forced auth-check-error states
at native Chrome Page zoom 200% (`devicePixelRatio=2`, 525px CSS viewport).
The forced auth-check error initially exposed a missing level-one heading;
TDD red/green added the `Browser extension` heading, and the recheck reported
axe 0/0 with no overflow. ZIP download returned 200; reduced-motion and the
Skip-link keyboard path were exercised. The public `apps/docs` landing page
rendered at native 200% with axe 0/0, 525px CSS width, 4,798px document
height, four loaded images, no overflow, reduced motion, and a keyboard path
through README and self-hosting links; external links were not followed.
Screenshots were visually inspected. No new blind-review cycle is claimed for
this evidence continuation or bounded accessibility follow-up; the broader
26.6 matrix, toolbar-icon limitation, and human closeout remain open.

Record future entries as:

```text
date/time
work package and surface
starting commit
change summary
candidate commit
focused verification
Reviewer A result
Reviewer B result
finding dispositions
status and next action
```

## 30. Audit Evidence At Plan Creation

Repository evidence reviewed:

- `AGENTS.md`;
- `CONTEXT.md`;
- `PRODUCT.md`;
- `DESIGN.md`;
- accepted ADRs under `docs/adr/`;
- completed Master `007` and children `140`–`146`;
- current routes, shell, major feature components, CSS, package manifests, and
  tests;
- `docs/ui/121-*` through current Documentation evidence;
- committed Project, workspace, Capture, Guide, Demo, Documentation, reader,
  and extension screenshots;
- live synthetic local Project, Project Version, Documentation library,
  Documentation Site editor, and public Documentation reader routes.

Planning observations:

- the current Documentation Site authoring route exposed roughly 150
  interactive elements in the browser accessibility snapshot;
- its audited 390px document was approximately 6,843 CSS pixels tall without
  horizontal overflow, demonstrating that no-overflow is not sufficient
  responsive composition;
- the audited public Documentation reader had no observed horizontal overflow
  and passed prior automated accessibility evidence, yet remained visually
  close to unstyled semantic markup;
- prior accessibility, responsive, motion, and performance work is a strong
  foundation but does not establish visual acceptance;
- no repository file was changed during the audit before this plan was added.

## 31. Leftovers And Future Scope

The following remain outside Plan `147` unless separately accepted:

- Video and desktop recording;
- HTML capture/replay;
- AI generation or transformation;
- analytics, lead capture, sales workflows, and custom branding;
- hosted signup;
- new export families;
- custom domains, translations, or static export;
- durable jobs, production telemetry, distributed rate limiting, and non-local
  File storage;
- product migration to `apps/docs`;
- React Router migration;
- whole-graph Tiptap or Fumadocs authority;
- arbitrary design-system or component-library replacement.

## 32. Handoff

The autonomous execution has completed all queued surface families through
`design-system-gallery`, `global-fallback`, `contributor-docs`, and the bounded
`shared-foundation` and `shared-shell-mobile` follow-ups; every qualifying surface is
`agent_accepted_pending_human` unless the ledger explicitly records
`blocked_local_for_run`. The next action is human review of the assembled
bundle, followed by disposition and bounded implementation of any accepted
human findings. Do not treat any accepted surface as human-approved; the
installed-toolbar capability block, forced Documentation failure limitation,
browser-fixture limitations, shared-shell/zoom limitations, and broader raw
CSS review stay recorded in the ledger.

If a long-running execution stops, resume from the next eligible `queued` or
`incomplete_checkpoint` surface after revalidating its preflight. Do not blindly
reopen `needs_human_surface`, `blocked_local_for_run`, or
`paused_global_critical` entries; first resolve their recorded condition. Never
infer completion from a passing build or an after screenshot.

## 33. Short Goal Prompt

```text
Execute docs/plan/147-ossie-ui-quality-program.md beginning with section 26.1
preflight. Preserve and reconcile the then-current worktree, create the required
dedicated worktree from the current approved Plan 147 execution commit, and
record that commit; do not reset to the historical audit commit. Preserve Ossie
domain, permission, immutability, public-link, security, and accepted Quiet
Versioned Workbench rules. Under section 19.4, establish the disposable local
test database, seed deterministic synthetic users and required product states,
start and health-check the local services, and verify real login without
recording secrets. Work on one bounded surface at a time with one implementer,
then send the same immutable candidate to two blind read-only reviewers: one
for visual/interaction quality and one for product/
accessibility/adversarial QA. Consolidate their findings, improve for at most
three cycles, run final clean verification, and move on only when the Plan 147
acceptance criteria pass. Continue past a recorded local block only to a
demonstrably independent surface; halt the entire run on a P0 or global critical
condition. Do not push, merge, deploy, add major dependencies, change product
semantics, or silently update approved visual baselines. Finish with the human
review bundle. Label only qualifying surfaces
agent_accepted_pending_human; preserve blocked, incomplete, needs-human, and
global-pause statuses exactly.
```
