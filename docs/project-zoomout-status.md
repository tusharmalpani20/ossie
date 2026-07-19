# Project Zoom-Out Status

Last reviewed: 2026-07-19

## Product Intent

Ossie is a self-hosted open-source product for capturing browser workflows and turning them into polished walkthrough artifacts. Its accepted direction is a project-organized internal knowledge platform, but that broader foundation is not yet runtime behavior.

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

Manual portal dogfood smoke completed with non-blocking limitations on 2026-06-22 and is recorded in `docs/v1-dogfood-smoke-suite.md`. Portal alpha screenshots from safe synthetic data are committed under `docs/assets/alpha/` and linked from `README.md`. Public guide/demo screenshots and the extension setup popup screenshot were refreshed on 2026-06-30 during the modern UI browser QA pass. Plan 103 browser validation on 2026-07-07 proved the automatic-click extension path can create screenshot-backed server assets/events and produce non-empty guide/demo source material; captured-workflow extension screenshots are now committed. True toolbar-popup manual validation remains pending.

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
- Publishing for guides and interactive demos through immutable snapshots, stable slugs, public/restricted access, expiry, password protection, viewer sessions, embeds, and asset streaming constrained to referenced published assets.
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
- Manual screenshot fallback exists in code/tests and produced a screenshot-backed `capture` event from direct extension-page automation in plan 101 browser validation on 2026-07-07; true toolbar-popup manual validation remains pending, and plan 103 found a direct extension-page duplicate event-index follow-up after automatic clicks.
- Pause/resume and finish behavior; finish completed the backend session in dogfood.
- Finish-to-portal and open-active portal flows use the configured portal origin in the tested split API/web path; plan 102 formally closed this on 2026-07-07 with browser validation against API `http://localhost:4021` and portal `http://localhost:3000`.
- Focused popup/content/background tests.

## Known Gaps

- Manual portal dogfood found non-blocking guide editor and local dev URL friction that should feed the next hardening phases.
- Chrome extension dogfood is no longer blocked at upload/event creation for the validated automatic click path; true toolbar-popup manual validation is still pending.
- Direct extension-page manual fallback after automatic clicks needs a focused duplicate event-index follow-up before it should be treated as fully closed.
- HTML capture/replay is deferred.
- AI/BYO-key authoring is deferred.
- Analytics, lead capture, sales tracking, and custom branding are deferred.
- Chrome Web Store packaging is not done.
- One-command production deployment packaging is deferred.
- Local file storage is the only storage provider.
- Automated retention cleanup is not built.
- Rate limiting is in-memory and should be replaced before multi-instance production deployments.
- Advanced editor/demo polish remains a V1 hardening area.

## Recommended Next Direction

Master Plan `005` is the accepted next track:

1. Completed: naming/documentation truth, Audit and Access Evidence, Project
   Membership, Project Versions, and Project Version-owned Capture source
   through child `117`.
2. Completed in child `118`: Project-owned Guide/Demo Artifact identities,
   Project Version-scoped Editions, and relational mutable Working Drafts.
3. Implemented in child `119`: immutable Guide/Demo Revisions, Carry-Forward,
   and protected Capture Asset archive/purge boundaries. PostgreSQL and
   authenticated browser closeout remain environment-blocked.
4. Next: revision-backed Publications and multi-version Publish Links.
5. Establish the design system and modernize each existing workflow with browser, accessibility, motion, and responsive evidence.
6. Close the foundation at child `130`, then conduct the mandatory Product Documentation domain grill at child `131`.

The accepted Project Version and Artifact Edition decisions are recorded in `CONTEXT.md`, ADRs `0021` through `0026`, the completed grill record, and `docs/plan/111-project-version-and-artifact-edition-grill.md`. Project Versions, Capture ownership, Guide/Demo Artifact identities, Editions, and relational Working Drafts are closed. Revisions, Carry-Forward, and protected Asset lifecycle are implemented but await child-`119` PostgreSQL/browser closeout. Revision-backed Publication follows only after that gate.

Product Documentation implementation begins only after child `131` and new `132+` plans. Loom-style Video remains a later direction with no accepted runtime model.
