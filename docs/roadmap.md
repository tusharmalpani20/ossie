# Roadmap

Last reviewed: 2026-07-20

Ossie is alpha software. This roadmap separates shipped behavior from accepted
direction and intentionally deferred work; it does not promise dates.

## Available Today

- Self-hosted first-run setup, password authentication, and Organization member
  and invite basics.
- Project Membership plus explicit Project Version release contexts, beginning
  with a transactional default `Main` record, canonical routes, aliases,
  ordering, and active/archived lifecycle management.
- Screenshot-first portal and Chrome extension Capture Sessions with mandatory,
  immutable Project Version ownership and exact owning-Version deep links.
- Automatic-click extension capture with screenshot-backed browser evidence;
  true toolbar-popup manual validation and one direct-page ordering follow-up
  remain open.
- Scribe-style Guide generation, editing, annotations, preview, immutable
  current publishing, password access, embeds, Markdown export, and HTML ZIP
  export.
- Storylane-style Interactive Demo generation, scene/hotspot editing, immutable
  current publishing, password access, embeds, and public viewing.
- Local PostgreSQL/file storage operations, health/readiness endpoints,
  production configuration validation, and DB-backed alpha smoke coverage.
- A compact `apps/docs` repository documentation hub with safe historical alpha
  screenshots.

## Next Platform Foundation

Master Plan `005` is the accepted implementation track:

1. Repository workflow and the Ossie display-name/documentation truth foundation.
2. Relational append-only Audit Events, Audit Change Items, and Access Events.
3. Comprehensive evidence coverage for existing mutations and meaningful access.
4. Project Membership with Project Admin, Editor, and Viewer authorization.
5. Project Versions, beginning with a real default `Main` record. Completed in
   child `116`.
6. Project Version-scoped Capture Sessions across portal and extension.
   Completed in child `117`.
7. Project-owned Guide/Demo Artifacts with version-scoped Editions and Working
   Drafts. Completed in child `118`.
8. Immutable Guide/Demo Revisions, Carry-Forward, and protected shared assets.
   Implemented in child `119`; PostgreSQL and authenticated browser closeout are
   still environment-blocked.
9. Revision-backed Publications and multi-version Publish Links. Implemented in
   child `120`; PostgreSQL and authenticated/public browser closeout are still
   environment-blocked.
10. Design-system and workflow-by-workflow portal, extension, authoring, reader,
    accessibility, motion, and browser modernization.
11. Cross-workflow closeout before new artifact-family design.

Items 1 through 8 are verified current runtime behavior. Item 9 is a committed
runtime implementation awaiting its recorded environment-blocked closeout
evidence. Later UI modernization remains accepted target behavior rather than
shipped behavior.
See `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
for gates and exact child ordering.

## Documentation Next

Product Documentation is the next artifact family. Child `131` will grill its
identity, hierarchy, navigation, authoring, rendering, Project Version,
Publication, access, and site-configuration semantics after the foundation
closes. Implementation planning begins at `132+` only after that grill is
accepted.

Product Documentation is not another name for Guides and is not `apps/docs`,
which remains repository documentation for contributors and operators.

## Later

- Loom-style Video recording/library behavior.
- Desktop recording.
- HTML capture/replay.
- Optional AI/BYO-key authoring and search assistance.
- Analytics, view tracking, lead capture, sales workflows, and custom branding.
- Additional export destinations such as PDF, DOCX, Confluence, Notion, or
  GitHub.
- Object storage, shared multi-instance rate limiting, and one-command
  production packaging.
- Chrome Web Store distribution.

Video is compatible with the umbrella but has no accepted recorder, upload,
storage, playback, transcript, comment, permission, retention, or version model.

## Intentionally Not Required

- Hosted SaaS billing for the current foundation.
- AI as a required runtime dependency.
- Automatic access to private/customer systems for examples or screenshots.
- Product Documentation or Video implementation inside Master Plan `005`.
