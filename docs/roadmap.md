# Roadmap

Last reviewed: 2026-07-31

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
- Automatic and manual extension Capture with direct-page and real unpacked
  toolbar evidence, ordered exactly-once redacted Assets/Events, pause/resume,
  restart recovery, and canonical portal handoff.
- Scribe-style Guide generation, Version-scoped relational authoring,
  Revisions, Carry-Forward, annotations, preview, immutable publishing,
  multi-version Publish Links, password access, embeds, Markdown export, and
  HTML ZIP export.
- Storylane-style Interactive Demo generation, Version-scoped relational
  authoring, Revisions, Carry-Forward, scene/hotspot editing, immutable
  publishing, multi-version Publish Links, password access, embeds, and public
  viewing.
- Product Documentation Sites with version-scoped relational authoring,
  constrained content/snippets/assets/OpenAPI, comments and review, inspected
  portability, Carry-Forward, immutable Revisions/Publications, public/password
  readers and search, and governed browser-direct Try It.
- Local PostgreSQL/file storage operations, health/readiness endpoints,
  production configuration validation, and DB-backed alpha smoke coverage.
- A compact `apps/docs` repository documentation hub with safe historical alpha
  screenshots.

## Completed Platform Foundation

Master Plan `005` has completed these implemented foundation tracks:

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
   Completed in child `119` with PostgreSQL and authenticated browser closeout.
9. Revision-backed Publications and multi-version Publish Links. Completed in
   child `120`; the 2026-07-20 closure repair reverified the full DB/smoke suite
   and authenticated/public browser flow.
10. Design-system and workflow-by-workflow portal, extension, authoring, reader,
    accessibility, motion, performance, and browser modernization. Completed in
    children `121` through `129`.
11. Cross-workflow pre-Documentation closeout. Completed in child `130`.

Items 1 through 11 are verified current behavior or repository foundation.
See `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
for gates and exact child ordering.

## Documentation Next

Master Plan `006` and children `132`–`140` are complete. Children `132`–`139`
shipped and independently close-rechecked Product Documentation V1; child `140`
then reviewed every post-V1 candidate and accepted one next experience
objective.

Master Plan `007` reserves children `141`–`146` to test Tiptap authoring and
Fumadocs reading behind non-authoritative adapter gates, modernize the selected
authoring/reader paths, add deterministic curl/Fetch/Node.js/Python/Go request
examples, harden the integrated browser/accessibility/performance experience,
and perform final closeout. Child `141` must be expanded and rechecked before
any prototype or dependency change.

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
- Human-first Documentation translations, verified custom domains, structured
  public feedback, privacy-minimized aggregate analytics, exact-Revision
  external review, ephemeral presence, offline read-only snapshots, a typed
  disclosure component, and public static-site export remain accepted later
  rather than scheduled in Master `007`.
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
