# Project Zoom-Out Status

Last reviewed: 2026-07-30

## Product Intent

Ossie is a self-hosted open-source product for capturing browser workflows and
turning them into polished walkthrough artifacts. Its implemented foundation is
a project-organized, Project Version-aware internal knowledge platform for the
current Guide and Interactive Demo artifact families. Product Documentation now
has an accepted target model but no runtime; Video remains later and unmodeled.

The current alpha has two authored output families:

- Scribe-style Guides: vertical process documentation with ordered steps, screenshots, instructions, tips, alerts, headers, paragraphs, dividers, and screenshot annotations.
- Storylane-style interactive demos: screen-by-screen walkthroughs with scenes, screenshots, hotspots, publishable links, and embeddable public viewers.

The current direction remains:

- internal documentation and enablement first
- screenshot-first capture before HTML replay
- Chrome extension capture before desktop capture
- capture sessions as reusable source material
- guides and interactive demos as separate authored outputs
- AI deferred from the day-one product path
- analytics and sales-heavy features deferred

## Current Alpha Status

Ossie can now complete the first usable alpha workflow:

```text
self-hosted first-run setup
  -> project
  -> capture session
  -> screenshots and capture events
  -> guide and interactive demo
  -> publishable public/restricted links
  -> teammate invite
```

The automated DB-backed smoke test for that workflow lives in `apps/server/src/smoke/v1-workflows.db.integration.test.ts` and runs with:

```bash
rtk pnpm --filter server test:smoke
```

Manual portal dogfood smoke completed with non-blocking limitations on
2026-06-22 and is preserved in `docs/v1-dogfood-smoke-suite.md`. Portal alpha
screenshots from safe synthetic data are committed under `docs/assets/alpha/`
and linked from `README.md`. Children `123` through `129` later completed
fixture-backed Chromium validation for the modernized entry, Organization,
Project, Capture, Guide, Interactive Demo, public, responsive, accessibility,
motion, and performance surfaces. Children `126` and `129` also passed a real
unpacked toolbar Capture; direct extension-page automation remains recorded as
a distinct evidence class.

## Built So Far

### Documentation And Decisions

- Product concept in `docs/product-idea.md`.
- System writing pattern in `docs/system-design-pattern.md`.
- Grill sessions in `docs/grill/`.
- ADRs for major design decisions in `docs/adr/`.
- Compact `apps/docs` alpha docs hub plus development, self-hosting, operations, production readiness, route inventory, roadmap, contributor guide, OSS summary, and smoke suite docs.
- AGPL-3.0-only license, security policy, contribution guide, CI workflow, PR template, and GitHub issue templates.

### Backend

- Fastify REST API under `/api/v1`.
- PostgreSQL migrations as the source of truth.
- Cookie-backed auth sessions.
- Deployment-aware public instance status and first-run setup.
- Organization users, members, invites, invite lookup, and invite acceptance.
- Projects with create/list/get/update/archive behavior, explicit Project
  Membership, and Project Version create/read/update/order/default/alias/
  archive/restore behavior.
- Project Version-owned Capture sessions with explicit create/list/get/detail,
  empty-draft reassignment, finalize, archive, and active/archived lifecycle
  enforcement.
- Capture assets with metadata creation, local multipart screenshot upload, file streaming, and archive behavior.
- Capture events with create/list/get/edit/reorder/archive behavior and raw input-value protection.
- Guide creation from capture sessions, guide editing, guide blocks, guide steps, screenshot selection, direct step screenshot upload, annotations, Markdown export, HTML ZIP export, and guide detail read models.
- Interactive demo creation from capture sessions, demo metadata, scenes, ordering, hotspots, and archive behavior.
- Revision-backed immutable Publications and independent multi-Project-Version Publish Link manifests for guides and interactive demos, with stable slugs, public/restricted access, expiry, password protection, viewer sessions, embeds, and exact-Revision Asset streaming.
- Health and readiness endpoints.
- Production config hardening around CORS, cookie secrets, body/upload limits, and sensitive route rate limits.
- Unit, route, app integration, DB integration, and v1 smoke coverage.

### Web Portal

- First-run setup page.
- Login and logout.
- Project list/home, canonical Project Version workspaces, Version management,
  and project settings/archive controls.
- Organization members and invite acceptance screens.
- Project Version-scoped Capture session list/detail/create routes, canonical
  ownership links, and eligible empty-draft reassignment.
- Manual screenshot upload, bulk upload status, event creation, event ordering, and safe event editing.
- Guide list, guide editor, guide preview, screenshot viewer, screenshot selection, direct screenshot upload, rectangle annotations, block insertion/editing/reorder/delete, Markdown export, HTML ZIP export, publish controls, password controls, embed-copy controls, and public-link status labels.
- Public guide reader and guide embed route.
- Interactive demo list, interactive demo editor, scene management, hotspot management, publish controls, password controls, public demo viewer, and demo embed route.
- Focused page, route, API, and app tests.

### Chrome Extension

- Vite/React extension popup.
- Instance URL configuration for hosted or self-hosted API origin.
- Login and local session persistence.
- Current auth verification.
- Project and active Project Version discovery/selection persistence.
- Capture session creation with the exact selected Version and active-tab
  metadata.
- Authoritative active Capture restoration with its immutable owning Version.
- Visible-tab screenshot upload.
- Automatic click capture MVP exists in code/tests and produced two screenshot-backed `click` events from safe synthetic data in plan 103 browser validation on 2026-07-07.
- Manual screenshot fallback and automatic Capture pass code/tests, direct-page
  automation, and a separate real unpacked toolbar workflow. Shared in-flight
  coordination and server reconciliation preserve unique ordered Event indexes.
- Pause/resume and finish behavior; finish completed the backend session in dogfood.
- Finish-to-portal and open-active portal flows use the configured portal origin in the tested split API/web path; plan 102 formally closed this on 2026-07-07 with browser validation against API `http://localhost:4021` and portal `http://localhost:3000`.
- Focused popup/content/background tests.

## Known Gaps

- Firefox/WebKit/Safari verification remains unavailable on the current
  headless environment; Chromium is the fully validated browser engine.
- Comparable forced-GC heap and listener/timer metrics are unavailable through
  the current browser tool surface; observable Guide/Demo long-session checks
  pass.
- HTML capture/replay is deferred.
- AI/BYO-key authoring is deferred.
- Analytics, lead capture, sales tracking, and custom branding are deferred.
- One-command production deployment packaging is deferred.
- Local file storage is the only storage provider.
- Automated retention cleanup is not built.
- Rate limiting is in-memory and should be replaced before multi-instance production deployments.
- Chrome Web Store packaging remains future work; the validated extension is an
  unpacked Manifest V3 build.

## Recommended Next Direction

Master Plan `005` has completed children `109` through `131`: repository
workflow, naming/documentation truth, Audit and Access Evidence, Project
Membership, Project Versions, Version-owned Captures, Guide/Demo
Artifacts/Editions/Working Drafts/Revisions, Carry-Forward, protected Assets,
revision-backed Publications, multi-version Publish Links, the design system,
current workflow modernization, cross-product browser closeout, and the
Documentation domain grill.

Child `132`, the complete Documentation Site first vertical slice, is expanded
and rechecked. The next activity after its scoped plan checkpoint is runtime
implementation under that plan's exact migration, contract, permission,
threat, verification, and agent-browser requirements.

The accepted Project Version and Artifact Edition decisions are recorded in
`CONTEXT.md`, ADRs `0021` through `0030`, the completed grill records,
`docs/documentation-domain-decisions.md`, and their child plans. The existing
foundation and modernized current product are implemented and verified.

Product Documentation runtime is not yet implemented. Its accepted plan sequence
is `132` through `140`; Loom-style Video remains a later direction with no
accepted runtime model.
