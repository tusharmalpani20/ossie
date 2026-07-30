# Master Plan 005: Knowledge Platform And UI Foundation

Date: 2026-07-10

Status: Complete on 2026-07-30. Children `109` through `131`, including the
accepted Documentation Domain Grill and the implementation-ready sequence
beginning at `132`, are complete. Product Documentation runtime remains outside
this master plan and is not implemented.

Master plan number: 005.

## 1. Purpose

Ossie has proved its first alpha workflow: a team can create a project, capture a browser workflow, turn the capture into a Guide or Interactive Demo, and publish an immutable snapshot. The next track should not immediately add another isolated artifact type. It should first establish the product model, repository guidance, version foundation, and application experience needed for a broader internal knowledge platform.

The intended umbrella is:

```text
Organization
  -> Project
    -> Project Version
      -> Captures
      -> Guides
      -> Interactive Demos
      -> Documentation
      -> Videos (later)
```

That diagram expresses product navigation, not a final database schema. Child `111` accepted stable Project-owned Guide and Interactive Demo Artifact identities, with one Edition for each applicable Project Version; Captures belong to exactly one Project Version. Documentation ownership remains unresolved until child `131`, and Video remains unmodeled. These concepts must be named and modeled separately instead of overloading the word `version`.

This master plan covers the work from the current alpha baseline through an accepted Documentation-domain grilling session. Documentation implementation begins only after this plan's final gate. Loom-style recording and video-library implementation remain deliberately deferred.

## 2. Executive Decisions

This track starts from the following decisions:

1. The product should evolve from a Guide/Interactive Demo creator into a project-organized internal product knowledge platform.
2. Documentation is the next artifact family to investigate and build.
3. Loom-style video is strategically compatible with the platform, but it is not the next implementation target.
4. Project Version semantics must be resolved and implemented before Documentation is modeled.
5. Existing Guides, Interactive Demos, Captures, and Publications must become version-aware before a new artifact family is added.
6. The current portal needs a coherent application shell, information architecture, design system, and workflow-by-workflow modernization before the Documentation UI is built.
7. Planning docs may describe future direction, but current-state docs must
   distinguish the shipped Version/Edition/Revision/Publication foundation from
   unimplemented Documentation, Video, and UI-modernization work.
8. Repository-local agent guidance and repeatable skills should be established before this multi-phase track begins.
9. A product-name decision should be made before brand-level UI modernization, but the runtime architecture must not depend on a rename.
10. Documentation implementation must be preceded by a dedicated grill that settles its content model, source of truth, publication model, access model, version behavior, and Fumadocs boundary.
11. A comprehensive append-only Audit Foundation must precede Project Membership, Project Version, Artifact Edition, Revision, and Publication implementation.

## 3. Current Baseline

Baseline reviewed on 2026-07-10 and reconciled through child `130` on
2026-07-29:

- The repository is an AGPL-3.0-only pnpm/Turborepo monorepo.
- `apps/server` is a Fastify REST API backed by PostgreSQL and local file storage.
- `apps/web` is a React/Vite portal plus public Guide and Interactive Demo readers.
- `apps/extension` is a React/Vite Manifest V3 Chrome extension for screenshot-first browser capture.
- `apps/docs` is a compact Next.js documentation hub for the open-source project; it is not the proposed customer-authored Documentation artifact.
- Shared constants, Zod contracts, UI primitives, and domain packages exist under `packages/*`.
- The current domain model includes Organization, User, Org User, Project,
  Project Version and permanent Project Version Alias, Capture Session, Capture
  Event, Capture Asset, Guide, Interactive Demo, Published Artifact, and Publish
  Link.
- Capture source records and original source assets are immutable by existing ADR decision.
- Guide and Interactive Demo authoring uses stable Artifact identities,
  Project Version-scoped Editions, relational Working Draft content, and
  immutable relational Revisions.
- Mutable Edition, Working Draft, and authored child rows use `version` as an
  optimistic-concurrency **Row Version**, not an authored Revision or Project
  Version.
- `publish_schema.published_artifact.publication_sequence` is Edition-scoped;
  each Published Artifact identifies one exact Revision, Edition, and Project
  Version without copied `snapshot_json` content.
- Publish Links are independently managed ordered multi-version manifests with
  explicit rollout, one default entry, stable slugs, link-wide access policy,
  exact-version public routes, rollback to older Publications, and revocation.
- Children `112` through `114` provide typed, append-only Audit Event/Audit Change
  Item persistence, separate runtime and maintenance database credentials,
  exhaustive current mutation command/table/route coverage, and active
  same-transaction database guards. Child `114` adds explicit relational Access
  Evidence, fail-closed protected reads, and the Owner-only combined compliance
  timeline. Child `115` adds explicit Project Membership, centralized
  Project-role authorization, Project Admin compliance scope, and Editor
  Activity visibility. Child `116` adds the explicit Project Version aggregate,
  transactional Default `Main`, permanent aliases, canonical Version portal
  context, and temporary Default-only compatibility for current Project-scoped
  content. Child `117` adds mandatory Capture Session Project Version ownership,
  version-scoped portal/extension Capture behavior, and the temporary guarded
  current-Default seam for Guide/Demo generation until child `118`.
- Current migrations end at
  `024_revision_backed_publication_and_publish_link_manifests.sql`.
  Migration `015` implements the
  accepted clean pre-live transition and refuses populated User or Organization
  data; no production-row backfill exists.
- The repository is pre-live. There are no production records, external API clients, or deployed public links requiring data-preserving compatibility; development/test databases may be reset and reseeded for the clean target model.
- Child `122` retained the lightweight custom pathname parser behind a tested
  route registry and application shell. Request/state ownership remains
  deliberately local where appropriate; no router or query dependency was
  introduced merely for framework parity.
- `apps/web` and `apps/extension` use Tailwind CSS 4, and `packages/ui` owns
  semantic tokens plus source-level Alert, Badge, Button, Card, Code, Input,
  Label, Select, Separator, and Textarea primitives using CVA-style variants
  and shared class utilities.
- Lucide is already the shared icon dependency. The repository does not currently depend on Radix, React Router, TanStack Query, Sonner, or React Hook Form; child plans must justify any of them against a concrete workflow need.
- CSS Modules remain a supported application styling boundary alongside shared
  tokens/primitives. Children `121` through `129` consolidated the product
  shell and current workflows without forcing an unrelated framework rewrite.
- Child `109` installed the accepted external design guidance as pinned, optional repository tooling and documented provenance, compatibility changes, update/removal procedure, and rejected sources in `docs/agent-workflow.md`. It remains outside application dependencies and runtime behavior.
- The current setup, authentication, Organization, Project/Version, Capture,
  extension, Guide, Demo, public-reader, and embed surfaces have completed the
  accepted Quiet Versioned Workbench modernization and child `129`
  accessibility, motion, responsive, and performance dogfood.
- Master plans `001` through `004` are complete. Children `109` through `130`
  are complete. Child `130` rechecked every child from `109` onward and passed
  clean migrations, full DB/smoke/workspace verification, documentation and
  absence audits, authenticated/public/direct-extension/installed-toolbar
  Chromium validation, and the child `129` accessibility, responsive, motion,
  build, and performance baselines on 2026-07-29. The
  optional overnight-runner tooling checkpoint was deferred on 2026-07-19 and
  is not a gate for sequential child execution.
- Historical direct-page and installed-toolbar extension limitations from
  master plan `004` were closed by children `126` and `129`. Remaining
  production-readiness and environment limitations are enumerated in
  `docs/pre-documentation-closeout.md`.

Each implementation child must re-run and record the applicable non-database baseline. The broad workspace test command is recursive because this Turbo graph has no root `test` task:

```bash
rtk git status --short
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

Database-backed tests require a configured PostgreSQL test database and must be run and reported separately with the server's `test:db` and `test:smoke` scripts.

## 4. Product North Star

The product should help an organization preserve, maintain, find, and share knowledge about its projects across releases.

The primary internal workflow should eventually feel like:

```text
select organization
  -> select project
  -> select Main or another named project version
  -> capture or author knowledge
  -> maintain Guide, Interactive Demo, Documentation, and later Video artifacts
  -> review a stable revision
  -> publish an immutable internal or external snapshot
  -> find the right artifact for the right project version
```

The durable advantage is not the number of artifact types. It is the shared context around them:

- one organization and permission model;
- one project and project-version taxonomy;
- reusable capture assets;
- consistent authoring and publishing concepts;
- stable links and immutable publications;
- internal discovery and navigation;
- clear ownership and lifecycle state;
- future cross-artifact search without collapsing distinct editing models.

Each artifact family must retain a model suited to its medium:

- **Guide**: ordered reading/following experience built from Guide Blocks and Guide Steps.
- **Interactive Demo**: scene/hotspot/transition experience built for guided interaction.
- **Documentation**: structured sites or knowledge bases built from pages, navigation, reusable assets, and version-aware publication.
- **Video**: recorded media with transcript, captions, chapters, comments, and playback metadata; deferred until after Documentation.

The system must not introduce a vague universal content JSON model merely to make these artifact families appear uniform.

The starting relational hypothesis is more precise than the navigation umbrella:

```text
Organization
  -> Project
    -> Project Versions
    -> Capture Sessions
         -> exactly one Project Version
    -> Guide identities
         -> Guide Editions
              -> exactly one Project Version
              -> mutable authoring state
              -> authored Revisions
                   -> immutable Publications
    -> Interactive Demo identities
         -> Interactive Demo Editions
              -> exactly one Project Version
              -> mutable authoring state
              -> authored Revisions
                   -> immutable Publications
    -> Documentation identities (after the Documentation grill)
         -> Documentation Editions/Revisions/Publications as accepted later
    -> Video identities (deferred; not modeled in this track)
```

This separates two kinds of history the original umbrella requires:

- the Edition that says which product release/context the artifact describes;
- the Revisions that record how that Edition changed while it was authored.

Child plan `111` accepted this distinction and made its ownership/lifecycle boundaries explicit.

## 5. Accepted Versioning Language

Child plan `111` accepted the following vocabulary. `CONTEXT.md` remains the canonical glossary.

### Project Version

A release context inside one Project, such as `Main`, `1.4`, `2026 Q3`, or `Cloud`. It groups the knowledge that applies to one product state or release line.

Accepted first behavior:

- Every Project has a default `Main` Project Version.
- Teams that do not need explicit release versioning can continue working without extra ceremony.
- A Project Version has a stable internal ID, user-facing name, URL-safe slug, lifecycle state, optional release metadata, and audit fields.

### Artifact

The stable identity of a Guide or Interactive Demo across Project Versions. Documentation identity is resolved only by child plan `131`; Video remains deferred.

Example: `Configure single sign-on` remains the same conceptual Guide even if its content changes between Project Versions.

### Artifact Edition

The one authored representation of one Artifact for one Project Version. An Artifact has at most one Edition for each Project Version.

### Revision

An immutable authoring checkpoint within one Artifact Edition. Manual checkpoint, Publication, and Carry-Forward create or reuse a Revision; normal saves and autosaves update only the Working Draft.

### Row Version

An implementation-level optimistic-concurrency counter on a mutable database row. Existing Guide and Interactive Demo records already use `version` this way. A Row Version detects stale updates; it is not a user-visible authored Revision and must not be presented as one.

### Publication Sequence

The monotonically increasing number for successive immutable Publications
within one Artifact Edition. Current database, API, domain, and UI contracts use
`publication_sequence` directly.

### Publication

An immutable externally or internally shared Published Artifact that identifies one exact Artifact Revision, Artifact Edition, and Project Version without becoming a live pointer to draft state.

### Terminology Guardrails

- Do not use `version` without a qualifier in domain docs, API names, database comments, or UI copy.
- Do not call a Project Version an Artifact Revision.
- Do not call an immutable Publication a draft Revision.
- Do not call an optimistic-concurrency Row Version an authored Revision.
- Do not treat `published_artifact.version_number` as a Project Version or Artifact Revision.
- Do not use API version (`/api/v1`) as product-version terminology.
- Do not call carry-forward a merge until merge semantics actually exist.
- Do not call a copied Edition inherited content if later edits are independent.

### Relational Persistence Boundary

- Core persistent product state uses typed columns, foreign keys, constraints, and type-specific relational child tables.
- Working Drafts, Artifact Revisions, and Published Artifact content are relational; immutable history is not stored in `snapshot_json`.
- A Published Artifact identifies one exact immutable Artifact Revision and adds Publication Sequence and audit/access history.
- Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions remain distinct relational models in both working and revision history.
- Generic domain `metadata` JSONB columns are not carried into the clean schema without a separately accepted, narrow, non-authoritative requirement.
- JSON remains appropriate for HTTP transport, extension messages, manifests, configuration, and other non-persistence boundaries.
- Future persistent JSON exceptions require a separate accepted architecture decision and cannot control core authorization, ownership, lifecycle, ordering, lineage, or asset-protection behavior.
- Audit evidence uses typed relational before/after scalar columns and explicit child-record changes rather than JSONB values or generic metadata.

## 6. Documentation Truth Bands

Every repository document touched by this track must make one of these truth bands explicit:

### Available Today

Behavior implemented, tested, and usable in the current repository. Audit and
Access Evidence, Project Membership, Project Versions, Version-owned Captures,
Guide and Interactive Demo Artifacts/Editions/Working Drafts/Revisions,
Carry-Forward, protected shared Assets, revision-backed Publications, and
multi-version Publish Links belong here.

### Next Platform Direction

Accepted direction with planned implementation. The UI foundation and
workflow-modernization children `121` through `130`, followed by the
Documentation-domain grill, belong here until implemented. Customer-authored
Documentation runtime begins only after this master closes and a subsequent
plan is accepted.

### Intentionally Deferred

Strategically compatible work that is not part of the next implementation track. Loom-style video recording/library behavior, HTML replay, AI-first authoring, advanced analytics, and other non-committed work belong here.

Rules:

- Current route inventories, operations guides, self-hosting instructions, API docs, and screenshots must describe only real behavior.
- Roadmaps and product-thesis documents may describe planned behavior when clearly labeled.
- Existing accepted ADRs are historical decision records and must not be rewritten to pretend they decided new questions.
- `apps/docs` must not advertise product Documentation authoring until that functionality exists.
- Product Documentation and the repository's developer/operator documentation must remain distinguishable in language and code ownership.

## 7. Source Documents And Decisions To Preserve

This track must preserve and build on:

- `README.md`
- `CONTEXT.md`
- `docs/product-idea.md`
- `docs/system-design-pattern.md`
- `docs/roadmap.md`
- `docs/project-zoomout-status.md`
- `docs/oss-alpha-summary.md`
- `docs/contributor-guide.md`
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `apps/docs/app/docs-content.ts`
- `apps/extension/README.md`
- master plans `001` through `004`
- child plans `001` through `108`
- ADRs `0001` through `0026`

Decisions that remain binding unless superseded by a new accepted ADR:

- The repository represents one product context with multiple domain packages.
- Capture Sessions are reusable source material, not final artifacts.
- Capture Events and original Capture Assets are immutable.
- Guides and Interactive Demos are separate artifact types.
- Guides use Blocks, Steps, and Annotations.
- Interactive Demos use Scenes, Hotspots, and Transitions.
- Publish Links resolve to immutable revision-backed Published Artifacts.
- Screenshot-first capture remains the active path; HTML replay is deferred.
- Capture remains privacy-preserving and omits raw input values.
- AI remains optional and deferred from the core path.
- REST, Fastify, Zod, OpenAPI, SQL migrations, and shared-domain-package conventions remain the architecture style.
- Web and server remain separately deployable apps.
- Instance-first extension login and deployment-aware onboarding remain intact.
- Project Versions are release contexts with a real initial default `Main` record.
- Artifacts span Project Versions through Editions, Working Drafts, immutable Revisions, and immutable Published Artifacts.
- Project Membership governs non-owner Project access.
- Core domain, audit, access, Revision, and Publication persistence is explicitly relational.
- Comprehensive append-only mutation and meaningful-access evidence begins before new version-domain mutations.
- Publish Links are independently configured multi-version manifests for one stable Artifact.

## 8. Hard Scope Boundaries

In scope for this master plan:

- Agent workflow and repository-local skills needed for this track.
- Comprehensive Audit Event, Audit Change Item, Access Event, retention, authorization, timeline, and append-only foundations.
- Truthful product, architecture, roadmap, status, contributor, and docs-hub updates.
- A product naming brief, availability/due-diligence process, and explicit keep/rename decision.
- A detailed Project Version and Artifact Edition grilling session.
- ADRs for accepted versioning decisions.
- Project-scoped membership with Project Admin, Editor, and Viewer roles as a prerequisite authorization boundary; Project Versions inherit Project permissions.
- Project Version persistence, API, permissions, migration, and portal context.
- Clean Project Version scoping for new Captures, with coordinated updates to all in-repo clients and tests.
- Edition/revision/publication integration for existing Guides and Interactive Demos.
- Design principles, information architecture, tokens, primitives, application shell, and responsive behavior.
- Modernization of existing portal, editor, reader, and extension workflows where explicitly scoped.
- Accessibility, reduced-motion, performance, visual-regression, and real-browser validation.
- A pre-Documentation closeout.
- A detailed Documentation-domain grilling session and implementation-ready handoff.

Out of scope for this master plan:

- Documentation runtime, persistence, editor, reader, search, or publication implementation.
- Loom-style recording, transcoding, upload, playback, transcript, comment, or video-library implementation.
- Desktop recording.
- HTML capture/replay.
- AI authoring or AI search as a required dependency.
- A universal artifact-content table or universal editor model.
- Production-data-preserving migration, legacy compatibility aliases, dual writes, or backfills for the greenfield schema transition.
- Changing the accepted `/p/*`, `/d/*`, embed, or version-aware route shapes without an explicit product decision.
- Hosted billing, sales analytics, lead capture, or marketing automation.
- A cosmetic-only recolor that leaves navigation and workflows structurally weak.
- Branding or navigation for unimplemented Documentation and Video screens.
- Repository-wide technical-identifier churn solely to make code match a new display name.
- Semantic-version automation; environment, audience, channel, or deployment-target version semantics; release/EOL states; Git-tag-driven Project Versions.
- Branching, merging, automatic inheritance/synchronization, multi-source/multi-target Carry-Forward, or cross-Project Artifact reuse.
- Multiple Editions of one Artifact in the same Project Version or per-Project-Version memberships.
- Real-time/offline collaboration, review/approval workflows, comments/mentions, localization, or dedicated side-by-side content-diff UI.
- Scheduled or approval-gated publishing, automatic rollout to every Publish Link, custom domains, or Publication deletion.
- Audit/access export, automatic expiry, selective deletion, legal erasure/purge, permanent Organization deletion, cold storage, cryptographic external anchoring, WORM, or compliance certification.
- Cross-Organization sharing, generic JSON metadata, or AI-owned source-of-truth content.

Master Plan 005 delivers, in dependency order:

1. Repository guidance and skills.
2. Audit and Access foundation.
3. Project Membership.
4. Project Versions.
5. Capture version scoping.
6. Guide/Demo Editions, Working Drafts, Revisions, and Publications.
7. Modernized UI workflows.
8. Cross-workflow verification and closeout.
9. Documentation-domain grill.

Everything else listed above is a future phase or explicit non-goal. Recording a future candidate does not commit its implementation.

## 9. Execution Rules

Every child plan must follow this lifecycle:

1. Re-read this master plan, `CONTEXT.md`, relevant ADRs, previous child-plan handoff notes, and current code.
2. Expand the child plan into an implementation-ready document before editing runtime code.
3. Recheck assumptions against the repository and record deviations.
4. For a grill, ask one consequential question at a time, recommend an answer with reasoning, challenge contradictions, and update source docs as decisions settle.
5. For implementation, use test-driven development for behavior changes: establish failing coverage, implement the smallest coherent change, then refactor.
6. Preserve tenant isolation, audit ownership, immutable sources, and immutable publications.
7. Run focused tests first, then the broader verification appropriate to the blast radius.
8. Use real browser validation for UI, routing, extension, reader, and responsive behavior.
9. Review animation with reduced-motion behavior and accessibility checks before accepting it.
10. Update the child plan with status, decisions, implementation log, verification evidence, leftovers, and next-plan handoff.
11. Update this master plan only for genuinely completed items.
12. Commit scoped work in small logical commits if commits are requested; never mix unrelated cleanup into a child plan.
13. Split a child plan before implementation if code inspection shows that it spans more than one independently releasable workflow or cannot be verified coherently.
14. For this pre-live schema transition, state the development/test database reset and reseed procedure and update all in-repo apps/contracts/tests together; do not add legacy compatibility layers without a real consumer.
15. Prefer clean breaking schema, API, and in-repo client changes over ambiguous legacy columns, indefinite dual writes, or JSON/JSONB storage for core persistent domain state.

Every expanded child plan must specify:

- exact files and ownership boundaries;
- current behavior and desired behavior;
- domain terms and unresolved questions;
- APIs, shared schemas, constants, and database changes;
- authorization and tenant-isolation rules;
- schema transition, reset/reseed, rollback, and fresh-database behavior;
- UI states, loading, empty, error, success, destructive, and responsive behavior;
- accessibility and reduced-motion requirements;
- focused and broad verification commands;
- browser test matrix and screenshot policy where applicable;
- explicit non-scope;
- release/rollout implications;
- completion evidence and handoff notes.

## 10. Skills And Agent Workflow Strategy

Child plan `109` completed installation and repository setup on 2026-07-10. No third-party skill should be trusted or updated before reading its instructions, license, generated files, and update behavior.

Child `109` classified each capability as **repository-installed**, **agent-environment provided**, or **repository-local**. `agent-browser`, `test-driven-development`, `grill-with-docs`, and `skill-creator` remain environment capabilities rather than repository/runtime dependencies. Root `AGENTS.md` and `docs/agent-workflow.md` define fallbacks, precedence, and the application boundary.

### External Skills Reviewed And Installed

Historical candidate installer shapes reviewed by child `109` are shown below for provenance only. Do not execute them; the outcome table and `docs/agent-workflow.md` are authoritative:

```bash
npx impeccable install
npx skills add emilkowalski/skills@emil-design-eng
npx skills add emilkowalski/skills@review-animations
npx skills add emilkowalski/skills@animation-vocabulary
npx skills add emilkowalski/skills@apple-design
npx skills add vercel-labs/agent-skills@react-best-practices
npx skills add vercel-labs/agent-skills@web-design-guidelines
npx skills add addyosmani/web-quality-skills@accessibility
```

Do not execute an unpinned installer merely because it appears in this master plan. Child plan `109` must first resolve the source revision, inspect install scripts and generated changes, and record whether the tool writes outside the repository. Installation must be reproducible enough that another contributor can identify the same skill content later.

Verification snapshot on 2026-07-10, to be re-resolved by child `109` rather than treated as a permanent pin:

| Source                          | Reviewed HEAD                              | Repository/license posture                                                                      | Plan decision                                                                                                                                        |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pbakaus/impeccable`            | `da99645a58400ed7acb201e6904f9413efd89c6e` | Apache-2.0; reviewed npm CLI `3.2.1` requires Node `>=22.12.0` and can install hooks            | Installed a pinned source-built Codex skill without hooks or runtime dependencies; repository invocation disables the update network/home-cache path |
| `emilkowalski/skills`           | `f76beceb7d3fc8c43309cefad5a095a206103a4e` | MIT; exact focused skills requested by the project; no release tag was available during review  | Installed the four named skills from the reviewed commit and recorded one Codex frontmatter compatibility change                                     |
| `vercel-labs/agent-skills`      | `f8a72b9603728bb92a217a879b7e62e43ad76c81` | Upstream declares MIT; static React guidance plus a web-design skill that fetches mutable rules | Installed only `vercel-react-best-practices`; rejected `web-design-guidelines` because its runtime rules are not pinned by this commit               |
| `addyosmani/web-quality-skills` | `95d6e255afe1596b557d7a8498517884438f5b3a` | MIT; dedicated accessibility/performance/web-quality guidance                                   | Installed only accessibility; other focused skills remain deferred until a later plan owns their verification                                        |

The current developer machine runs Node 26, so it can execute the reviewed Impeccable CLI. That convenience remains a tooling boundary: the optional reviewed CLI requires Node `>=22.12.0`, while the monorepo application/runtime contract remains `node >=18`. No generic overlapping UI/UX bundle was installed; add one only when an expanded child plan identifies a concrete gap that the reviewed set does not cover.

Expected roles:

- **Impeccable**: primary product-design workflow for shaping, critiquing, auditing, polishing, hardening, adapting, and validating the UI.
- **emil-design-eng**: interaction-level design engineering, restraint, hierarchy, feedback, and motion craft.
- **review-animations**: strict final review of timing, easing, interruption, continuity, performance, and reduced-motion behavior.
- **animation-vocabulary**: shared terminology for discussing motion; it does not make product decisions.
- **apple-design**: reference for direct manipulation, gestures, springs, wayfinding, and accessibility; it must not turn the portal into an imitation of consumer Apple surfaces.
- **Vercel React best practices**: React rendering, state ownership, bundle, data-flow, and component-quality review.
- **Vercel web-design-guidelines (rejected)**: do not invoke it because its effective rules are fetched from an unpinned branch; repository-local UI guidance, Impeccable, and accessibility review cover the accepted need.
- **Accessibility skill**: semantic structure, keyboard behavior, focus, labels, contrast, reduced motion, and screen-reader review.
- **agent-browser**: real-browser dogfood, screenshots, responsive validation, keyboard flows, and regression investigation.
- **test-driven-development**: red/green/refactor discipline for versioning and workflow behavior.
- **grill-with-docs**: one-question-at-a-time stress testing of versioning and Documentation decisions with inline documentation updates.
- **skill-creator**: repository-local skill authoring and validation.

### Repository-Local Skills To Create

Create portable skills under `.agents/skills/`:

1. `model-demo-composer-domain`
   - Re-read `CONTEXT.md`, ADRs, schema ownership, and relevant domain packages.
   - Detect overloaded terms such as version, page, demo, publication, and recording.
   - Require accepted decisions to update source documentation.

2. `build-demo-composer-slice`
   - Encode the repo's plan-to-TDD-to-verification workflow.
   - Include shared-contract reuse gates, migration discipline, tenant-isolation checks, and child-plan closeout.

3. `design-demo-composer-ui`
   - Point to the accepted `PRODUCT.md`, `DESIGN.md`, product UI pattern, and design system.
   - Require information hierarchy, complete states, responsive constraints, accessibility, motion restraint, and existing primitive reuse.
   - Prohibit dead navigation, nested cards, decorative gradients/orbs, and marketing-page composition inside the operational portal.

4. `dogfood-demo-composer`
   - Define server/web startup, fixture setup, agent-browser flows, responsive viewports, console/network checks, screenshot handling, and evidence cleanup.
   - Separate automated browser evidence from true Chrome toolbar-popup validation.

Create a repository-root `AGENTS.md` that points agents to canonical docs and skills without personal absolute paths. Skills should encode repeatable procedure and link to domain truth; they must not duplicate `CONTEXT.md` or ADR content as a second source of truth.

The local skill directory names use the stable repository identity. A display-brand decision in child `110` does not force immediate skill/package/config renames; any such rename must follow the accepted rename layers rather than creating churn during child `109`.

### Product UI Pattern To Codify

The product-specific design pattern is a **Quiet Versioned Workbench**: an operational workspace with persistent Organization -> Project -> Project Version context, compact navigation, content-first work areas, progressive disclosure, and explicit lifecycle/status language. It is a repository design decision, not a third-party theme.

Child `121` must turn this pattern into `PRODUCT.md`, `DESIGN.md`, tokens, components, and examples for five surface archetypes:

1. **Library/operations surfaces** use dense, filterable lists or tables with clear bulk/row actions, status, ownership, and version context.
2. **Authoring surfaces** use a stable workbench layout: navigator/outline, primary document or canvas, contextual inspector, and compact command bar. They are full workspace compositions, not nested cards.
3. **Reader/viewer surfaces** put authored content or media first, use minimal chrome, and provide a clear Publish Link-scoped Project Version selector where applicable.
4. **Settings/admin surfaces** use restrained forms, tables, confirmation dialogs, and permission-aware actions instead of decorative dashboards.
5. **Activity/compliance surfaces** use chronological grouped timelines with filters, actor/source labels, typed diffs, and visibility appropriate to the viewer's role.

Shared interaction rules:

- Keep Organization, Project, and Project Version context visible but compact; suppress unnecessary version-management ceremony when only `Main` exists.
- Use progressive disclosure for infrequent or destructive operations and keep frequent commands directly reachable.
- Communicate status with text/icon/shape as well as color, and reserve color accents for state and emphasis rather than covering the interface in one hue.
- Keep toolbar, navigation, editor rail, media, and control dimensions stable so loading, hover, labels, and validation do not shift the workspace.
- Make frequent interactions immediate; use sparse, interruptible motion only to explain spatial change, feedback, or continuity, with complete reduced-motion behavior.
- Preserve operational density on desktop and adapt by task priority on mobile rather than shrinking a desktop dashboard.
- Target WCAG 2.2 AA behavior for semantics, keyboard navigation, focus, contrast, reflow/zoom, labels, errors, and motion.

External skills support this pattern but do not choose it: Impeccable supplies the end-to-end design workflow; Emil's skills sharpen interaction and animation craft; Vercel and Addy Osmani provide engineering/accessibility review; `agent-browser` supplies real-workflow evidence. The repository-local `design-demo-composer-ui` skill binds all of them to this product's domain and prevents generic output.

## 11. Product Naming Decision

### Accepted Outcome

On 2026-07-10, the user accepted **Ossie** as the product display name and an
original octopus with all eight arms visible as the character direction.

Reasons:

- `Demo` makes one artifact family sound like the whole product.
- `Composer` suggests creation but not capture, maintenance, version context, discovery, governance, or internal knowledge.
- The intended platform must comfortably contain Guides, Interactive Demos, Documentation, and future Videos without one feeling secondary.
- A broader name will reduce explanation cost when positioning the product to organizations.

Child `110` applied Layer 1 display branding. On 2026-07-11, the user renamed the
GitHub repository to `tusharmalpani20/ossie` and authorized updating Git `origin`
and active source/raw links. The local repository directory, package names,
runtime configuration, cookies, headers, service identifiers, storage, routes,
database objects, migration history, legal attribution, historical records, and
repository-local skill names remain stable. `docs/rename-compatibility-checklist.md`
inventories those boundaries.

Preliminary research found a material collision with active Apache Ossie in the
semantic-metadata software space. The user accepted the name with that risk
visible. This is not legal clearance; professional trademark and logo review is
required before commercial launch.

### Naming Criteria

The selected name should:

- fit a versioned product/workflow knowledge platform rather than one media type;
- be short, pronounceable, searchable, and easy to spell;
- work for both internal enablement and externally published knowledge;
- avoid implying that AI, video, analytics, or sales enablement is the whole product;
- support a credible product display name, repository slug, package scope, CLI/config prefix, and hosted domain;
- avoid collision with active software products, major trademarks, npm packages, GitHub organizations/repositories, and reasonable domain options;
- remain usable if the product later adds search, comments, approvals, and video.

### Naming Territories Explored

The naming exercise should explore concepts rather than jumping to unverified names:

- captured workflow becoming maintained knowledge;
- a source of truth for product operations;
- project/version-aware enablement;
- paths, traces, flows, manuals, knowledge, and release context;
- an open, self-hostable knowledge workspace.

### Rename Layers

A rename must distinguish:

1. **Display brand**: headings, app title, metadata, UI copy, screenshots, and product narrative.
2. **Repository identity**: GitHub repository name, clone URLs, badges, issue links, and deployment docs.
3. **Package/distribution identity**: root package name, package scopes, imports, lockfile entries, container/image names, and technical extension distribution identifiers. Human-facing extension manifest names/titles belong to Layer 1.
4. **Runtime configuration**: environment-variable prefixes, cookie names, storage directories, telemetry labels, and deployment secrets.
5. **Persistent identifiers**: database schemas/tables, migration history, published URL shapes, API paths, and stored external references.

These layers do not have to change simultaneously. The preferred approach is display brand first, repository identity second, package/config identifiers only when beneficial, and persistent identifiers only with a concrete compatibility reason. Existing database migration history must never be rewritten for branding.

### Naming Gate

Before child plan `121` establishes final design tokens and brand surfaces, child plan `110` must record one of:

- keep `Demo Composer` intentionally;
- adopt a new display name while retaining compatible technical identifiers temporarily;
- adopt a new name and approve a separate staged technical migration plan.

Name availability and trademark research is risk reduction, not legal clearance. Any final commercial trademark decision requires appropriate legal review.

## 12. Ordered Delivery Sequence

```text
109 skills and agent workflow
  -> 110 product umbrella, naming, and documentation truth
    -> 111 Project Version and Artifact Edition grill
      -> 112 Audit Evidence core
        -> 113 existing-mutation Audit coverage
          -> 114 Access Evidence and compliance timelines
            -> 115 Project Membership foundation
              -> 116 Project Version foundation
                -> 117 Capture source version scoping
                  -> 118 Guide/Demo Edition and Working Draft relational foundation
                    -> 119 Guide/Demo Revision, Carry-Forward, and protected assets
                      -> 120 Publication and multi-version Publish Link integration
                        -> 121 design-system foundation
                          -> 122 portal architecture and application shell
                            -> 123 authentication, setup, and organization UI
                              -> 124 project, version, and library UI
                                -> 125 capture portal UI
                                  -> 126 extension UI
                                    -> 127 Guide authoring and reader UI
                                      -> 128 Interactive Demo authoring and viewer UI
                                        -> 129 accessibility, motion, and browser dogfood
                                          -> 130 pre-Documentation closeout
                                            -> 131 Documentation-domain grill
                                              -> Documentation implementation begins in 132+
```

Hard gates:

- `109` must complete before repository-local skills are relied upon.
- `110` must separate current truth from product direction and resolve the display-name direction before brand finalization.
- `111` must complete before Audit/Access, membership, or versioning runtime code begins.
- `112` must establish the typed, append-only Audit Evidence schema, writer, transaction contract, and database guard before mutation coverage expands.
- `113` must cover every existing mutable command before new Project Membership, Project Version, Edition, Revision, or Publication mutations ship.
- `114` must establish meaningful Access Evidence and Owner compliance timelines before Project-role visibility is added.
- `115` must establish Project authorization before Project Version routes ship.
- `116` through `120` must complete before Documentation data modeling.
- `121` must establish the accepted design context, tokens, primitives, and workbench patterns before broad screen redesign.
- `122` must establish Project/Project Version navigation before workflow pages are modernized.
- `123` through `128` must modernize one coherent workflow family at a time and preserve all current behavior before visual closeout.
- `129` must provide browser, accessibility, motion, and performance evidence before UI work is called stable.
- `130` must close regressions and documentation drift before the Documentation grill.
- `131` must be accepted before any Documentation implementation child plan begins.

Decision-session policy:

- The completed child `111` grill is sufficient to begin Audit/Access, membership, Project Version, Capture scoping, and Guide/Demo lifecycle implementation. Do not repeat it merely because implementation starts.
- Child `109` requires a provenance/install diff review, not a product-domain grill.
- Child `110` requires an explicit naming decision and user acceptance, not a broad architecture grill.
- Child `121` requires a focused design-context workshop and explicit acceptance of `PRODUCT.md`, `DESIGN.md`, and representative library/workbench/viewer directions before broad UI work; this is a design gate, not a Documentation-domain grill.
- Child `131` was the mandatory full Documentation domain grill after the
  pre-Documentation closeout. It is complete; accepted semantics stay closed
  unless implementation discovers a genuinely new irreversible decision.
- Every child still begins with implementation-ready expansion and code reinspection. If that work uncovers a material contradiction or a new irreversible product choice not settled by child `111`, pause only that topic for a focused mini-grill and update the canonical docs; do not reopen accepted decisions by default.

## 13. Child Plan Index

### 109: Agent Skills And Repository Workflow

Status: Complete on 2026-07-10.

Planned file:

- `docs/plan/109-agent-skills-and-repository-workflow.md`

Goal:

- Establish a reviewable, portable agent workflow for the multi-phase versioning and UI track.

Scope:

- Re-read each external skill before installation.
- Resolve and record the exact source revision/version, license, files installed, install-script behavior, invocation rules, and update procedure.
- Review installer output in the working tree before accepting it and reject unexpected global, credential, hook, executable, or package/lockfile changes.
- Install only the skills that add clear value and do not conflict with repository instructions.
- Create root `AGENTS.md` with relative repository guidance.
- Create the four repository-local skills from section 10 using `skill-creator` guidance.
- Bootstrap `design-demo-composer-ui` against current canonical product/UI docs without pretending `PRODUCT.md` or `DESIGN.md` already exists; child `121` must update and revalidate the skill after those accepted files are created.
- Validate each local skill against one representative dry run.
- Define precedence: repository instructions, canonical domain docs, accepted ADRs, master/child plan, then external design guidance.
- Ensure generated skill files do not include machine-specific paths, secrets, or copied domain truth.

Expected affected areas:

- `AGENTS.md`
- `.agents/skills/model-demo-composer-domain/`
- `.agents/skills/build-demo-composer-slice/`
- `.agents/skills/design-demo-composer-ui/`
- `.agents/skills/dogfood-demo-composer/`
- contributor documentation where agent workflow is documented
- package/lock files only when an installer genuinely requires repository dependencies

Acceptance:

- A new contributor or agent can find the canonical product language, decisions, planning workflow, verification commands, and UI workflow from the repository root.
- Skills are procedural, small, testable, and free of duplicated product truth.
- Every installed external skill has recorded provenance and license.
- Removing a skill would not break the application build or runtime.

Completed outcome:

- Root `AGENTS.md`, `docs/agent-workflow.md`, four repository-local skills, pinned external skills, and `THIRD_PARTY_NOTICES.md` are installed and validated.
- Impeccable hooks and self-update behavior remain disabled; no application dependency or runtime surface changed.
- `web-design-guidelines` was rejected because its effective rules are fetched from an unpinned default branch at invocation time.
- Exact commits, compatibility changes, forward-test evidence, verification, and leftovers are recorded in child plan `109`.

### 110: Product Umbrella, Naming, And Documentation Truth

Status: Complete. Reopened Phase 6 closed on 2026-07-11.

Closure record:

- `docs/plan/110-product-umbrella-naming-and-documentation-truth.md`
- `docs/product-naming.md`
- `docs/rename-compatibility-checklist.md`

Accepted outcome:

- Display brand: `Ossie`.
- Character direction: original octopus with all eight arms visible. A selected
  GPT-generated Calm & Premium raster set was integrated post-closeout on
  2026-07-11 as the working identity; child `121` still owns review, refinement
  or replacement, and final logo/design/accessibility acceptance.
- Applied now: Layer 1 human-facing documentation, portal, extension, Docs App,
  issue-template, package-prose, and OpenAPI metadata.
- Applied after closeout on 2026-07-11: GitHub repository slug, Git `origin`, and
  active source/raw repository links.
- Reopened scope: active Layer 2 through Layer 4 technical identifiers now move
  to Ossie through the clean-break Phase 6 contract in child `110`; historical
  evidence and migration history remain preserved, while legal attribution and
  the physical local-directory move retain explicit gates.
- Product, architecture, roadmap, status, contributor, operator, and Docs App
  truth bands now distinguish current alpha, accepted foundation, Product
  Documentation next, and Video later.
- Focused and broad tests, types, lint, builds, desktop/mobile browser evidence,
  reflow, console/network checks, and residual-name classification passed.

Planned file:

- `docs/plan/110-product-umbrella-naming-and-documentation-truth.md`

Goal:

- Update product documentation to describe the intended knowledge-platform direction honestly and settle the name direction before brand-level UI work.

Scope:

- Add `Available Today`, `Next Platform Direction`, and `Intentionally Deferred` distinctions where appropriate.
- Present Organization -> Project -> Project Version context -> artifact families as navigation, while preserving the accepted Project-owned Artifact and Project Version-scoped Edition/Capture ownership model.
- Explain that Guides, Interactive Demos, Documentation, and Videos are distinct artifact families with shared project context.
- Document Documentation as next and Video as later.
- Use the accepted child `111` vocabulary in direction/architecture docs while keeping current-state docs explicit that the runtime implementation has not shipped.
- Update architecture diagrams without inventing runtime packages or routes.
- Create a naming brief from section 11.
- Research shortlisted names across active products, trademarks at a preliminary level, domains, GitHub, npm, package scopes, and obvious search collisions.
- Record a keep/rename decision and the approved rename layers.
- The original display phase created a compatibility checklist before applying
  Layer 1. On 2026-07-11 the user explicitly reopened child `110` and chose it,
  rather than a separate plan, to migrate active Layer 2 through Layer 4
  technical identity using the clean-break Phase 6 contract.

Expected affected areas:

- `README.md`
- `CONTEXT.md`
- `CONTRIBUTING.md`
- `docs/product-idea.md`
- `docs/system-design-pattern.md`
- `docs/roadmap.md`
- `docs/project-zoomout-status.md`
- `docs/oss-alpha-summary.md`
- `docs/contributor-guide.md`
- `docs/product-naming.md`
- `apps/docs/README.md`
- `apps/docs/app/docs-content.ts`
- `apps/docs/app/docs-content.test.ts`
- `apps/docs/app/page.tsx`
- `apps/docs/app/page.test.ts`
- human-facing docs/app/extension/OpenAPI display surfaces and `docs/rename-compatibility-checklist.md` only when a new Layer 1 display name is accepted
- reopened Phase 6 package/configuration, cookie, header, extension protocol,
  Docker/database/storage/service, repository-local skill, active documentation,
  test, and CI surfaces enumerated by child `110`

Original truth-phase exclusions, retained as Phase 6 protections where noted:

- `docs/backend-route-inventory.md`
- OpenAPI operation/route descriptions solely to describe future direction; only accepted Layer 1 title/summary metadata may change
- self-hosting/runtime commands merely to describe future product direction;
  Phase 6 must update active commands whose technical names change
- database migrations or schema identifiers
- current screenshots and captions, except to keep current product naming truthful after an accepted display rename

Acceptance:

- A reader can distinguish the working alpha from the intended platform without ambiguity.
- Product Documentation is not confused with `apps/docs`.
- Video is visible as a deferred direction but is not presented as committed implementation.
- Canonical `CONTEXT.md` contains only current or grill-accepted terms, not speculative versioning definitions.
- The name decision, evidence, risks, and migration boundary are recorded.
- Original Stages A/B changed only Layer 1. Reopened Phase 6 migrates approved
  active Layer 2 through Layer 4 identifiers; Layer 5 migration history and
  historically accurate evidence remain preserved.
- Every current-name occurrence and retained old-name result is classified, and a new display name always produces a compatibility checklist before Layer 1 changes.
- The rendered Docs App direction band and any renamed browser-visible surfaces have focused real-browser evidence.
- No existing ADR is rewritten to manufacture a new decision.

### 111: Project Version And Artifact Edition Grill

Status: Complete on 2026-07-10. Questions 1 through 21 and 23 through 40 were accepted; question 22 was withdrawn as inapplicable after the greenfield delivery decision.

Closure record:

- `docs/plan/111-project-version-and-artifact-edition-grill.md`

Completed grill record:

- `docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md`

Goal:

- Resolve the meaning, lifecycle, permissions, URLs, migration behavior, and authoring semantics of Project Versions, Artifacts, Editions, Revisions, and Publications before implementation.
- Resolve the audit foundation required to make every accepted mutation explainable from day one.

Method:

- Use `grill-with-docs`.
- Ask one consequential question at a time.
- Provide the recommended answer, reasons, tradeoffs, and affected existing behavior.
- Inspect code/docs for discoverable facts instead of asking the user to recall them.
- Update `CONTEXT.md` as terms settle.
- Create ADRs only for consequential, accepted, durable decisions.

Resolved decision themes:

- Project Version meaning, identity, metadata, default `Main`, ordering, lifecycle, aliases, navigation, and URLs.
- Project archive and archived Project Version behavior.
- Project Membership roles, capabilities, discovery, and tenant boundaries.
- Capture Project Version ownership and the narrow pre-start reassignment rule.
- Artifact identity, Edition title/lifecycle ownership, Working Draft, Revision, Row Version, Publication Sequence, and Published Artifact behavior.
- Carry-Forward copy/reference semantics, atomicity, idempotency, lineage, and protected shared assets.
- Multi-version/multi-link Publish Link manifests, viewer selection, explicit republishing, retention, and rollback.
- Greenfield reset/reseed delivery with coordinated breaking schema/API/client changes and no legacy mapping requirement.
- Explicit relational persistence without domain JSON/JSONB, including Revisions, Publications, audit values, and access context.
- Comprehensive mutation audit, meaningful access evidence, visibility, retention, no-export boundary, and runtime append-only protection.
- Master Plan 005 delivery tracks and later-phase/non-goal boundary.

Accepted decisions/ADRs:

- `docs/adr/0021-project-versions-are-release-contexts.md`
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`
- `docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md`
- `docs/adr/0024-project-membership-governs-project-access.md`
- `docs/adr/0025-core-domain-persistence-is-explicitly-relational.md`
- `docs/adr/0026-publish-links-are-multi-version-artifact-manifests.md`

Acceptance:

- `CONTEXT.md` has unambiguous accepted terms and relationships.
- Row Version, Project Version, Artifact Edition, Revision, Publication, and Publication Sequence cannot be confused in domain or UI language.
- The greenfield schema/reset/reseed strategy is decision-complete.
- Permission and lifecycle tables are explicit.
- Comprehensive mutation-audit semantics, persistence boundaries, and coverage enforcement are explicit.
- Meaningful reads, downloads, public views, authentication outcomes, and denied access have a separate explicit Access Event boundary.
- Compliance visibility and the curated product Activity Timeline have explicit role and Project-scope boundaries.
- Audit and Access evidence has an explicit indefinite Organization-lifetime retention boundary without automatic or selective deletion.
- Audit/Access timeline export is explicitly deferred from V1.
- Audit/Access append-only behavior is enforced at application and database-runtime boundaries without claiming cryptographic tamper-proofing.
- Master Plan 005's nine delivery tracks and its later-phase/non-goal boundary are explicit.
- Accepted URL shapes and Publication behavior are explicit without unnecessary legacy field aliases.
- The final child-plan sequence places Audit Foundation and Project Membership before Project Version implementation without reopening foundational terminology.

Applied sequencing impact:

- Child plans `112` through `114` establish Audit and Access Evidence in three independently verifiable increments.
- Child plan `115` is Project Membership Foundation.
- Project Version implementation begins at child plan `116`.
- Guide/Demo lifecycle work is separated into relational authoring (`118`), revision/carry-forward/assets (`119`), and publication/link integration (`120`).
- Documentation Domain Grill is child plan `131`, and Documentation implementation planning begins at `132`.

### 112: Audit Evidence Core

Status: Complete on 2026-07-19.

Close-previous implementation recheck passed on 2026-07-19. It strengthened
runtime validation, least-privilege database grants, runtime/maintenance role
separation, reset and pre-live migration safety, stable persistence errors, and
operational Audit schema verification without expanding mutation coverage past
the representative Project-create command.

Planned file:

- `docs/plan/112-audit-evidence-core.md`

Goal:

- Establish the typed relational, transactional, and database-protected Audit Evidence contract that every mutable workflow must use.

Expected scope:

- Choose and document the clean schema-transition mechanism after inspecting migration/test tooling; development/test database reset/reseed is allowed, no production-row backfill is required, and later schema children must follow the same mechanism.
- Add explicit relational Audit Event and Audit Change Item persistence without JSON/JSONB values or metadata.
- Add typed actor/source, request/idempotency, organization/Project/root-resource, Row Version, outcome, optional reason, and safe actor-label columns.
- Implement one repository/service writer that records one Audit Event per successfully committed logical mutation and typed change items for changed aggregates, child records, and fields.
- Implement allowlisted scalar value types, child-record diff helpers, and explicit sensitive-field denial/redaction rules; never retain credentials, tokens, raw typed capture values, raw search text, or content payloads.
- Commit business mutation and evidence in the same transaction; failed, rolled-back, and no-op operations must not produce misleading success evidence.
- Add a mutation-context database guard and a schema/command coverage registry interface that child `113` can exhaustively populate. During this foundation child, enforce the guard only for explicitly converted/registered write paths; child `113` must activate repository-wide coverage before the audit foundation is described as comprehensive.
- Enforce append-only runtime grants/guards, restrictive foreign keys, separate runtime versus maintenance credentials, and backup inclusion.
- Have the foundation record its own initialization only after its tables and guard exist; do not fabricate pre-foundation history for the empty/pre-live database.
- Integrate one representative current aggregate end to end to prove the contract without attempting the repository-wide rollout in this child.
- Keep the partial rollout explicit in runtime/docs and avoid any state where an enabled global guard breaks an unconverted current workflow.

Verification requirements:

- clean-schema, constraint, index, grant, restrictive-foreign-key, and reset/reseed tests;
- runtime-role tests proving update/delete/truncate/cascade attempts fail;
- atomic commit/rollback, no-op, idempotency-context, and Row Version tests;
- typed before/after scalar and relational child-record diff tests;
- forbidden-field, secret, redaction, and oversized-value tests;
- one DB-backed representative mutation smoke path.

Acceptance:

- The repository has one tested Audit Event/Change Item model and write contract with no audit JSON/JSONB.
- Runtime application credentials can append authorized evidence but cannot rewrite or delete it.
- Later mutable commands cannot ship without using the same transaction context and registering coverage.

### 113: Existing Mutation Audit Coverage

Status: Complete. Implementation and close-previous verification passed on
2026-07-19.

Planned file:

- `docs/plan/113-existing-mutation-audit-coverage.md`

Goal:

- Apply child `112` to every existing committed mutation before new version-domain mutations are introduced.

Expected scope:

- Inventory every current mutable table, repository command, route, background/system path, and data-changing migration.
- Cover user, Organization, authentication/session, Project, Capture, file/asset, Guide, Interactive Demo, Publish Link, extension, import, migration, and system mutations.
- Emit one logical event for a transaction even when multiple aggregates or child rows change; include every affected record and field as typed relational change items.
- Cover Working Draft-equivalent autosaves and bounded batch operations without creating per-keystroke or per-SQL-statement noise.
- Ensure later data-changing migrations use the accepted `migration` source context.
- Populate the coverage registry and add automated schema/command checks that fail when a mutable table or command has no declared audit path.
- Where current JSON-backed alpha content must be described temporarily, use explicit type-specific adapters that emit known relational change items; do not copy JSON into Audit Evidence. Child `118` removes the underlying core content JSON.
- Preserve current behavior and API contracts; Access Evidence and product timeline UI remain child `114`.

Verification requirements:

- mutation-coverage tests for every mutable table and command category;
- representative field, child-record, batch, autosave, file, extension, import, migration, and system tests;
- atomic rollback, no-op, retry/idempotency, actor/source, tenant-scope, and redaction tests;
- DB-backed smoke coverage across portal, extension, publishing, and administrative mutations.

Acceptance:

- Every existing committed logical mutation is explainable through immutable Audit Event/Change Items.
- Coverage automation fails when a new mutable table or command lacks an explicit audit path.
- The repository-wide mutation-context guard is active only after the coverage inventory passes; there is no silent partial-compliance claim.
- New Project Membership and version-domain mutations can reuse one proven integration contract.

### 114: Access Evidence And Compliance Timelines

Status: Complete after close-previous audit on 2026-07-19. Implementation and
focused/DB/smoke/broad checks passed; the available real-browser matrix passed,
with unpacked-toolbar and injected-writer browser capabilities honestly blocked
in child `114`.

Planned file:

- `docs/plan/114-access-evidence-and-compliance-timelines.md`

Goal:

- Record meaningful access separately from mutation evidence and provide the first authorized compliance timeline.

Expected scope:

- Add explicit relational Access Event persistence with typed actor/source, organization/Project/root-resource, request, outcome, and safe context columns; do not store JSON/JSONB, content, credentials, secret-bearing URLs, or raw search text.
- Record meaningful authenticated protected reads, public Publish Link views, downloads, authentication outcomes, authorization denials, and extension API access.
- Exclude health/readiness probes, frontend static assets, CORS preflight, internal queries, range chunks, and non-domain heartbeats.
- Persist protected-resource Access Events before returning content and define fail-closed behavior when evidence cannot be written.
- Add Organization Owner organization-wide cursor-pageable compliance queries; do not expose raw evidence to non-owners before Project Membership exists.
- Record access to the compliance timeline itself and use current authorization at query time.
- Retain Audit and Access Evidence for the Organization lifetime, block destructive cascades, include it in backups, measure growth, and keep future partitioning possible without weakening retention.
- Keep export, automatic expiry, selective deletion, legal purge, cryptographic anchoring, WORM, and compliance-certification claims out of V1.
- Define the authorization/read-model extension points that child `115` will use for Project Admin, Editor, and Viewer timeline scope.

Verification requirements:

- clean-schema, typed-context, constraint, index, grant, and runtime append-only tests;
- protected-read fail-closed and public/restricted/password/embed access tests;
- authentication, denial, download, extension, timeline-view, and transport-noise exclusion tests;
- Owner/non-owner/anonymous authorization and tenant-isolation tests;
- cursor pagination, retention, storage-metric, and backup-documentation checks.

Acceptance:

- Every accepted meaningful access path produces an Access Event without leaking protected data.
- Organization Owners can inspect complete organization-scoped evidence, while other roles receive no premature raw-evidence access.
- Child `115` has an explicit, tested boundary for adding Project-role timeline visibility.

### 115: Project Membership Foundation

Status: Complete. Implemented, verified, browser-dogfooded, closed, and
close-previous rechecked clean on 2026-07-19.

Planned file:

- `docs/plan/115-project-membership-foundation.md`

Goal:

- Add Project-scoped authorization with Project Admin, Project Editor, and Project Viewer roles before Project Version APIs and UI ship.

Expected scope:

- Add explicit relational Project Membership persistence with same-Organization constraints and active membership lifecycle.
- Keep Organization Owners as implicit Project Admins without duplicate Project Membership rows.
- Make a new Project's creator its initial Project Admin; do not grant other Organization Members automatic Project access.
- Allow Project Admins to assign/change/remove Project roles only for existing Organization Members; keep Organization invitation Owner-only.
- Centralize the accepted capability matrix for Project settings/version lifecycle, authoring, capture, checkpoint/restore, carry-forward, publication/link management, asset purge, and read-only access.
- Enforce Project Membership on discovery, list, read, mutation, audit/access timeline, extension, and artifact-generation paths.
- Extend child `114` queries/read models with the accepted Project Admin
  compliance scope and Project Editor curated Activity Timeline. Establish and
  test the Project Viewer history authorization/read-model seam here; materialize
  ordinary Revision/Publication-only history in children `118` through `120`
  when those authoritative relational models exist, rather than introducing a
  temporary history source.
- Keep public Publish Link access independent from Project Membership.
- Audit every membership and authorization mutation through children `112` and `113`, and record accepted Access Events through child `114`.
- Update shared contracts, route authorization, fixtures, portal state, extension Project discovery, and tests together.

Verification requirements:

- clean-schema and same-Organization constraint tests;
- Owner implicit-access and creator-admin tests;
- no-auto-access tests for other Organization Members;
- complete Admin/Editor/Viewer capability-matrix route and domain tests;
- revoked/disabled membership and hidden-Project discovery tests;
- cross-Organization/cross-Project denial tests;
- audit/access evidence tests for membership changes and denials;
- portal and extension Project-list/selection behavior tests.

Acceptance:

- No non-owner can discover or access a Project without active Project Membership.
- Project Admin, Editor, and Viewer behavior matches the accepted matrix without route-local role invention.
- Removing membership revokes Project and compliance-timeline access immediately while preserving historical actor evidence.
- Project Version implementation can rely on one tested Project authorization boundary.

### 116: Project Version Foundation

Status: Complete on 2026-07-19. Project Version persistence, permissions,
Audit/Access coverage, lifecycle/alias APIs, canonical portal context, Default
extension context, migration `020`, and closeout verification shipped. Capture
ownership remains explicitly assigned to child `117`.

Planned file:

- `docs/plan/116-project-version-foundation.md`

Goal:

- Implement Project Versions as an organization/project-scoped release context, following the decisions accepted in child plan `111`.

Expected scope:

- Follow the clean schema-transition and reset/reseed mechanism accepted by child plan `112`; no production-row backfill or legacy compatibility path is required.
- Add Project Version persistence, repository/domain behavior, shared constants/contracts, routes, service adapters, and tests.
- Create exactly one active default `Main` Project Version transactionally with every new Project.
- Enforce organization and project ownership in every query and mutation.
- Enforce the accepted name/slug/state/default uniqueness rules under concurrency.
- Support explicit canonical slug changes through permanent, case-insensitively unique, non-reusable Project Version aliases and canonical redirects.
- Add create/list/get/update/archive/restore/set-default operations only where accepted.
- Use `active | archived` for Project Version lifecycle; the Default Project Version must remain active, and archiving makes the version's content effectively read-only without rewriting every child status.
- Preserve Project archive as an effective read-only wrapper: keep child states/default assignment intact, block new authoring, restore exact prior behavior, and leave existing Publications accessible unless explicitly revoked.
- Add explicit Project Version selection to every in-repo client and keep the Project entry route as a deliberate redirect to the Default Project Version.
- Preserve existing project URLs or provide explicit redirects.
- Use explicit Project Version context in authenticated Artifact/Revision routes, redirect Project entry routes to the Default Project Version, preserve Project Version alias redirects, and do not add a `/latest` route.
- Preserve optimistic-concurrency Row Version behavior; do not repurpose existing `version` columns as authored Revisions.
- Keep teams on `Main` from facing unnecessary version-management UI.
- Keep archived Project Versions directly linkable and available as read-only Carry-Forward sources, separate them in selectors, exclude them from default library/search results, and preserve existing Publications.
- Store explicit Project Version order, show the Default Project Version first, separate archived versions, and never infer order from free-form names.
- Hand mandatory Capture root ownership to child `117` and Artifact Edition
  ownership to child `118`; child `116` does not falsely assign current
  Project-scoped content to non-default Versions.

Expected affected areas:

- `apps/server/src/db/migrations/`
- project/version server modules and persistence adapters
- relevant domain package(s)
- `packages/constants`
- `packages/types`
- `apps/web/src/lib/api.ts` or its accepted replacement modules
- project workspace/version management UI
- route, unit, DB integration, migration, web, and smoke tests

Verification requirements:

- clean schema creation/reset/reseed from an empty development/test database;
- deterministic Project creation plus unique/default constraints;
- cross-organization and cross-project denial tests;
- concurrency tests for slug/default creation where practical;
- slug-change, alias-conflict, non-reuse, and canonical-redirect tests;
- API contract and route tests;
- web tests for selector, empty/error/loading, archive, and permission states;
- browser validation on desktop and mobile;
- accepted Project entry/version alias URL behavior;
- full DB-backed smoke and repository checks.

Acceptance:

- Every newly created Project has a usable default `Main` Project Version in the same transaction.
- Explicit version management works according to accepted roles and lifecycle rules.
- Existing users can continue the current workflow through `Main`.
- Current Guide and Interactive Demo content remains available only through the
  active Default Project Version compatibility seam until child `118` adds
  mandatory Artifact and Edition ownership. Capture ownership is complete in
  child `117`.

### 117: Capture Source Version Scoping

Status: Complete after implementation closeout recheck (2026-07-19).

Planned file:

- `docs/plan/117-capture-source-version-scoping.md`

Goal:

- Make every Capture Session belong to exactly one Project Version while preserving immutable capture-source rules and extension compatibility.

Expected scope:

- Require `project_version_id` on every new Capture Session.
- Decide whether direct `project_id` remains for indexing/constraint clarity or becomes derivable; do not duplicate ownership accidentally.
- Update portal capture creation, manual capture, extension project/version selection, active capture restoration, and capture listing/filtering.
- Define behavior when an extension's remembered Project Version is archived, deleted, unauthorized, or no longer the Project default; never silently submit to a different version after capture has begun.
- Preserve ordered Capture Events and Capture Assets.
- Permit Project Version reassignment only for empty, unstarted Capture Session drafts in the same Project; lock version provenance at capture start or the first Event/Asset.
- Ensure Guide/Demo creation from Capture inherits the correct Project Version context.
- Update portal and extension contracts together; no old-client fallback is required in the pre-live repository.

Verification requirements:

- clean-schema tests for Capture creation in active/default/named Project Versions;
- tenant, project, and version mismatch denial tests;
- coordinated extension API contract tests;
- portal/manual/extension creation tests;
- active-capture restoration tests;
- Guide/Demo generation context tests;
- automatic-click and manual-capture browser dogfood where technically available;
- full smoke path through a non-default named Project Version.

Acceptance:

- No Capture Session exists without a valid Project Version.
- Original capture records remain immutable.
- Portal and extension flows select or safely default the version context.
- Artifact generation cannot cross project/version ownership accidentally.

### 118: Guide And Demo Edition And Working Draft Relational Foundation

Status: Complete after implementation closeout recheck on 2026-07-19. The
relational Artifact/Edition/Working Draft foundation, exact Project Version
contracts, lifecycle permissions, stable typed-child updates, and authoritative
mutation responses are implemented. Focused and broad non-DB gates pass. Fresh
DB and browser reruns are precisely blocked by the missing
`testing_maintenance` profile and a local public-instance `500`; child `118`
does not claim those blocked checks as new passing evidence.

Planned file:

- `docs/plan/118-guide-demo-edition-working-draft-relational-foundation.md`

Goal:

- Establish clean type-specific Artifact identity, Project Version-scoped Editions, and relational Working Drafts for existing Guides and Interactive Demos.

Expected scope:

- Implement clean type-specific stable Guide and Interactive Demo identity tables/aggregates.
- Keep stable Artifact identities free of user-facing title/description; store mutable non-unique metadata on Project Version-scoped Editions and create each new Artifact with its first Edition transactionally.
- Give stable Artifact identity no lifecycle state; keep `draft | archived` exclusively on Editions and defer permanent/global Artifact purge behavior.
- Add Project Version-scoped Editions using the exact model accepted in child plan `111`.
- Preserve `draft | archived` as Artifact Edition lifecycle and keep immutable Publication state separate.
- Maintain exactly one mutable Working Draft per Edition and preserve optimistic-concurrency Row Version semantics.
- Preserve Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions as separate aggregates.
- Replace JSONB-backed working content with explicit Guide/Demo typed columns and relational child records, including relational Guide Annotations.
- Remove generic domain `metadata` JSONB columns from the clean target unless a later separately accepted decision defines a narrow non-authoritative boundary.
- Replace current dual-purpose Guide/Demo rows with the clean identity/Edition ownership model; no production-row backfill or legacy dual-write is required.
- Update Guide/Demo create, list, read, edit, archive/restore, generation-from-Capture, shared contracts, fixtures, and tests together.
- Preserve the current publish/read paths until child `120` replaces their persistence atomically; the expanded plan must define the temporary boundary and may combine schema deployment with `119`/`120` if the database cannot remain valid between children.

Non-goals:

- universal artifact content tables;
- cross-type conversion between Guide and Interactive Demo;
- branching or merging unless explicitly accepted for V1;
- Documentation tables or routes;
- Revision, Carry-Forward, Publication, Publish Link, or viewer redesign beyond the compatibility boundary required for the relational authoring transition;
- persistent JSON/JSONB content, generic metadata, or entity-attribute-value substitutes for explicit domain records.

Verification requirements:

- clean-schema tests for Artifact identity, Edition ownership, Working Drafts, relational content, and reset/reseed behavior;
- contract tests proving `version` remains Row Version where used;
- Guide and Demo domain tests;
- authorization and cross-version mismatch tests;
- create/edit/archive/generate-from-Capture regression tests;
- temporary publish/read compatibility tests;
- smoke coverage for creating and editing both artifact types in two Project Versions.

Acceptance:

- Existing Guides and Interactive Demos use explicit Artifact identity, Edition, and Working Draft ownership and remain behaviorally distinct.
- Core authored content no longer depends on generic JSON/JSONB persistence.
- Child `119` can checkpoint and carry forward the relational content without another ownership rewrite.

### 119: Guide And Demo Revision, Carry-Forward, And Protected Assets

Status: Complete after implementation closeout recheck on 2026-07-19. Runtime
implementation is at `f130d45` and `b7fc3af`; safety/workflow corrections are
at `a3e8398` and `4b4195c`. Fresh migration/rollback, the full DB suite, smoke,
storage, broad workspace checks, and authenticated Admin/Editor/Viewer browser
validation passed.

Planned file:

- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`

Goal:

- Add immutable type-specific Revisions, restore/checkpoint behavior, accepted Carry-Forward semantics, and reference-safe shared asset retention.

Expected scope:

- Store immutable Guide and Interactive Demo Revision roots and type-specific relational child records rather than JSON/JSONB snapshots.
- Create or reuse immutable Revisions only for manual checkpoints, Publication, and Carry-Forward; scope Revision numbers to one Edition and keep Row Versions concurrency-only.
- Implement checkpoint and audited restore-to-Working-Draft behavior without mutating historical Revisions.
- Implement one-source/one-target Project Version Carry-Forward for a selected bounded set of Artifacts as one atomic, idempotent transaction with database uniqueness and explicit conflict details.
- Preserve one immediate source Edition per result, never overwrite an existing target Edition, and never synchronize later source/target edits.
- Copy editable relational structures with new IDs, reset Row Versions, and new audit state while reusing protected immutable media and preserving lineage.
- Keep archived referenced assets resolvable and block physical purge while any Working Draft, Revision, or current Published Artifact reference remains.
- Preserve Guide and Demo content-model boundaries throughout.

Verification requirements:

- relational Revision immutability and numbering tests;
- manual checkpoint, restore, no-op, and concurrency tests;
- multi-Artifact Carry-Forward atomicity, idempotency, conflict, authorization, and lineage tests;
- cross-Organization/Project/Version mismatch tests;
- archive-versus-purge and shared-asset reference-graph tests;
- portal/browser and DB-backed smoke coverage across two Project Versions.

Acceptance:

- Revisions are immutable relational checkpoints and Working Draft restore never rewrites history.
- Carry-Forward creates independent target Editions without duplicating immutable media or mutating sources.
- Referenced assets cannot be physically removed while authored or historical state depends on them.

### 120: Publication And Multi-Version Publish Link Integration

Status: Complete on 2026-07-20. The original runtime commits `76cb8bd`,
`142ec8b`, and `5532682`, final closure corrections `dca1d1b` and `7520d46`,
and post-closure repairs `a1e346f`, `facce07`, and `e9e1ff5` pass fresh
migration, the full DB/smoke suite, broad workspace checks, and real-browser
verification.

Planned file:

- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`

Goal:

- Complete revision-backed immutable publishing and independently configured multi-version Publish Link manifests for Guides and Interactive Demos.

Expected scope:

- Make each Published Artifact identify one exact immutable Artifact Revision, Edition, and Project Version without duplicating content into `snapshot_json`.
- Replace ambiguous `published_artifact.version_number`/`published_version` target language with Edition-scoped `publication_sequence` across database, domain, contracts, API, UI, fixtures, and tests.
- Create or reuse the correct immutable Revision when publishing; keep Revision Number, Publication Sequence, and Row Version independent.
- Model each Publish Link as one stable Artifact's ordered selection of one or more Edition/Published Artifact entries, with exactly one default, one link-wide access policy, and no Working Draft exposure.
- Allow many independently configured Publish Links per Artifact with separate version selections, defaults, access policies, expiry, and revocation.
- Preserve `/p/*`, `/d/*`, and embed route families; add canonical version-specific paths and a viewer selector containing only entries allowed by that link.
- Make version selection update the directly shareable URL and render the exact immutable Publication.
- Present explicit per-link add/update choices during publish; update selected entries atomically and leave unselected links pinned for later manual update.
- Allow audited atomic entry rollback to an older Published Artifact from the same Edition without creating a Revision or Publication.
- Retain Published Artifacts as immutable, non-deletable V1 history; unlink/revoke controls access, while permanent/legal purge remains deferred.
- Complete protected-asset streaming authorization across draft, Revision, Publication, restricted/password, embed, and revoked-link paths.

Non-goals:

- live-draft public pointers;
- automatic rollout to every Publish Link;
- Publication deletion, custom domains, scheduled publishing, or approval workflows;
- Documentation routes or content.

Verification requirements:

- clean-schema and contract tests for Published Artifact, `publication_sequence`, and Publish Link manifests;
- publish transaction, explicit link-update, unselected-link pinning, rollback, expiry, revoke, password, and authorization tests;
- public/restricted/password/embed and canonical-version URL browser tests;
- viewer selector ordering/default/deep-link tests;
- immutable Publication and protected-asset regression tests;
- smoke coverage for create, checkpoint, carry forward, publish, select, update, rollback, and read across two Project Versions.

Acceptance:

- Existing Guide and Interactive Demo publishing is revision-backed, relational, immutable, and version-aware.
- One link can safely expose an explicit selected set of Project Versions, while multiple links for the same Artifact remain independently configurable.
- Public URLs and embeds preserve accepted behavior without exposing Working Drafts or unauthorized assets.

### 121: Design-System Foundation

Status: Complete on 2026-07-26 after explicit user acceptance.

Planned file:

- `docs/plan/121-design-system-foundation.md`

Goal:

- Establish the product brief, design principles, tokens, accessible primitives, and motion rules required for a coherent operational UI.

Scope:

- Run the reviewed Impeccable initialization/documentation workflow after product and naming truth is stable, with optional hooks disabled unless child `109` separately reviewed and accepted them.
- Create repository-root `PRODUCT.md` as a concise design-facing brief that references canonical product/domain docs rather than duplicating or overriding them.
- Create repository-root `DESIGN.md` as the source of truth for visual language, Quiet Versioned Workbench archetypes, interaction rules, tokens, components, motion, responsive behavior, and accessibility expectations.
- Audit and evolve the existing Tailwind CSS 4, Lucide, CVA/class utility, and `packages/ui` foundation; do not reinstall Tailwind, replace Lucide, or regenerate source-owned primitives blindly.
- Capture deterministic, safe baseline screenshots and browser-flow notes for every workflow that child plans `122` through `128` will change before the first visual rewrite.
- Inventory all current colors, type styles, spacing, radii, shadows, icons, form controls, overlays, tables/lists, editors, readers, loading states, and responsive breakpoints.
- Map every current and planned UI to the five accepted surface archetypes: library/operations, authoring workbench, reader/viewer, settings/admin, and activity/compliance.
- Define semantic tokens for background, surface, border, text, accent, success, warning, danger, focus, overlay, and selected states.
- Define typography roles appropriate for dense operational software; do not use viewport-scaled text.
- Define stable dimensions for navigation, toolbars, controls, asset thumbnails, editor rails, and fixed-format interactive surfaces.
- Select or confirm accessible primitives for dialog, menu, tooltip, tabs, select/combobox, toast, popover, and disclosure behavior. Add a headless primitive dependency only for a specific missing behavior, not as a bulk component rewrite.
- Retain Lucide unless evidence establishes a concrete accessibility or product gap.
- Define motion tokens, reduced-motion fallbacks, focus behavior, and performance limits.
- Define the supported browser/viewport/zoom matrix and measurable bundle, navigation, editor-interaction, image-loading, and layout-shift budgets from current baselines.
- Define an incremental token/component migration strategy so old and new styling do not create an uncontrolled permanent dual design system.
- Build a development-only component/state review surface if it materially improves repeatable QA.
- Produce representative, behaviorally real designs for one library, one authoring workbench, and one reader/viewer surface and obtain explicit user acceptance of the direction before child `122` begins broad shell/workflow modernization.

Design constraints:

- Operational, quiet, scan-friendly, and efficient rather than marketing-like.
- No nested cards or every-section-as-card composition.
- No decorative gradient/orb backgrounds.
- Cards use restrained radii of 8px or less unless an accepted primitive requires otherwise.
- Familiar commands use icons with accessible names/tooltips where appropriate.
- Color must communicate state without producing a one-hue interface.
- Dark mode is not automatic scope; support it only if explicitly accepted and complete.
- Motion explains continuity, hierarchy, feedback, and spatial change; it is not decoration.

Acceptance:

- `PRODUCT.md` and `DESIGN.md` are accepted and defer to `CONTEXT.md`/ADRs for domain truth.
- The Quiet Versioned Workbench and its five surface archetypes are concrete enough to compose real screens consistently.
- Tokens and primitives cover real current workflows, not a disconnected showcase.
- Keyboard, focus, contrast, error, disabled, loading, and reduced-motion states are defined.
- Safe dev-only review-route browser evidence, browser support, viewport coverage, zoom/reflow expectations, and performance budgets are recorded.
- The full authenticated workflow screenshot matrix is recorded as child `122` carryover before broad shell/workflow visual rewrites.
- The chosen product display name and brand direction are reflected without forcing technical identifier churn.
- Later screens can be modernized mostly by composition rather than inventing new one-off styling.

### 122: Portal Architecture And Application Shell

Status: Complete after close-previous audit on 2026-07-26.

Planned file:

- `docs/plan/122-portal-architecture-and-application-shell.md`
- `docs/ui/122-portal-shell-baseline.md`

Goal:

- Create a scalable, responsive application shell and routing/data architecture around Organization, Project, and Project Version context.

Scope:

- Inventory the custom route parser, API client, authentication/session state, page-local fetching, error handling, and navigation behavior.
- Decide with evidence whether to adopt React Router, TanStack Query, accessible headless primitives, or smaller existing-compatible alternatives.
- Record dependency licenses, security/update posture, bundle impact, migration boundaries, and exit cost; do not introduce a library merely because it is common.
- Define query ownership, cache keys, invalidation, cancellation, optimistic-update rollback, duplicate-submission prevention, and stale-response behavior before replacing page-local fetching.
- Define navigation blocking/recovery for unsaved editor work before route infrastructure changes.
- Establish persistent desktop navigation and an ergonomic mobile adaptation.
- Provide organization, project, and project-version context with breadcrumbs or equivalent wayfinding.
- Provide clear primary creation actions, current library access, search entry point placeholder only if it performs a real current action, and account/settings access.
- Preserve deep links, browser back/forward behavior, public routes, auth redirects, and split API/web origins.
- Keep authenticated portal state and public reader/embed state isolated so cache or auth assumptions cannot leak across route families.
- Add route-level loading, not-found, unauthorized, and recoverable error states.
- Keep Documentation and Video out of active navigation until their routes exist. A clearly labeled roadmap surface may mention them outside the operational nav.

Expected outcome:

- The first viewport is the usable product workspace, not a landing page.
- Project Version context is visible without consuming excessive space.
- Navigation remains usable with long organization/project/version names.
- No mobile/desktop overlap or layout shift occurs as content loads.
- The shell provides a stable frame for all existing and future artifact families.

Acceptance:

- Current authenticated and public routes remain reachable and tested.
- Refresh, deep link, back/forward, expired session, and permission-denied behavior are correct.
- Desktop and mobile browser screenshots show no clipping, overlap, dead controls, or misleading nav.
- Architectural dependencies are justified and covered by a migration/test plan.

Implementation notes:

- Added shared route metadata, portal navigation, breadcrumbs, and
  `PortalAppShell`.
- Adopted the shared shell on the allowed project, organization, compliance,
  activity, Project Version workspace, and list-level workflow pages.
- Preserved public/setup/login/invite/dev route behavior and did not add new
  runtime dependencies.
- Full real authenticated browser workflow screenshots remain blocked by missing
  local backend/session and are recorded as carryover in
  `docs/ui/122-portal-shell-baseline.md`.
- Close-previous audit fixed nested shell ownership for Project Version-owned
  list routes and verified the Project Version guide-list shell with synthetic
  browser evidence.

### 123: Authentication, Setup, And Organization UI Modernization

Status: Complete after close-previous audit on 2026-07-26.

Planned file:

- `docs/plan/123-authentication-setup-and-organization-ui-modernization.md`
- `docs/ui/123-auth-setup-organization-browser-evidence.md`

Goal:

- Modernize the entry, identity, and organization-management workflows on the accepted shell and design foundation.

Scope:

- Web First-Run Setup, login, logout, session-expiry recovery, and deployment-mode states.
- Organization member list, invite creation, invite lookup/acceptance, role display, expired/revoked invite behavior, and permission-denied states.
- Form validation, password/error privacy, loading, duplicate submission, success, retry, and destructive states.
- Responsive behavior for narrow mobile through desktop without turning setup/login into a marketing landing page.
- Focus management and safe return navigation across auth redirects and invitation flows.

Non-goals:

- hosted signup/billing;
- new organization-role semantics;
- Project, Capture, Guide, or Interactive Demo workflow redesign;
- broad authentication-protocol changes.

Acceptance:

- Current setup, login, logout, invite, and member-management behavior passes focused tests and browser journeys.
- Sensitive errors do not disclose account, token, or instance details improperly.
- Forms remain keyboard and screen-reader operable at supported viewports.
- Session expiry and failed setup checks recover without redirect loops or lost return paths.

Implementation notes:

- Added a shared brand-only entry shell for login, Web First-Run Setup, and
  public invite acceptance.
- Preserved authenticated organization member management inside the child `122`
  `PortalAppShell`.
- Fixed current `duplicate_active_invite` UI handling and added owner-only
  permission-denied copy for Organization invite/member management.
- Added focused tests for entry shell behavior, duplicate-submit blocking,
  duplicate invite errors, owner-only permission denial, and clipboard failure.
- Browser evidence used safe local mocks; the full real authenticated backend
  matrix remains recorded as a carryover until a seeded local backend/session is
  available.
- Close-previous audit on 2026-07-26 found no runtime gaps, no out-of-scope
  file changes, and no missing child `123` plan/master closeout fields. Focused
  web tests, web type-check, and `git diff --check` passed.

### 124: Project, Version, And Library UI Modernization

Status: Complete after full DB/browser close-previous audit on 2026-07-29.

Planned file:

- `docs/plan/124-project-version-and-library-ui-modernization.md`

Goal:

- Modernize Project and Project Version management and provide a coherent library for the artifact families that actually exist.

Scope:

- Project list, creation, workspace, settings, archive, and restore.
- Project Version selection, creation, lifecycle actions, default behavior, archive/restore, and accepted carry-forward entry points.
- Project workspace/library views for Captures, Guides, and Interactive Demos.
- Edition/Revision/Publication status language accepted in child plan `111`.
- Long organization/project/version names, dense lists, filters that operate on real data, empty states, pagination where already needed, and permission states.
- Stable URLs, breadcrumbs, deep links, back/forward behavior, and quiet `Main` behavior for teams with one Project Version.

Rules:

- Do not add Documentation or Video cards, creation commands, filters, or navigation before implementation.
- Do not label optimistic Row Versions or Publication Sequences as Project Versions.
- Do not replace useful operational density with oversized headings or decorative cards.
- Destructive and lifecycle actions must state their effect on drafts and Publications accurately.

Acceptance:

- Project and Project Version workflows complete end to end on desktop and mobile.
- Switching version context cannot show or mutate an artifact from another Project or Project Version.
- `Main` remains low-friction while other named versions remain discoverable.
- Existing Project deep links remain compatible or redirect according to the accepted URL decision.

Implementation notes:

- Runtime commit: `567359a` (`feat(web): modernize project version library UI`).
- Project cards and Project workspace library cards now prefer canonical Default
  Project Version URLs for Capture sessions, Guides, and Interactive demos.
- Project Version context switching preserves same-family routes for Capture
  sessions, Guides, and Interactive demos.
- Project settings uses restore wording for archived Projects and keeps Project
  Version management under the accepted portal shell.
- Default Project Version archive remains disabled with visible explanatory
  copy.
- No server API, schema, migration, auth, permission, public-link, Capture
  source, Publication, Artifact Edition, or Artifact Revision behavior changed.
- Browser evidence is recorded in
  `docs/ui/124-project-version-library-browser-evidence.md`.
- Close-previous audit split public App route smoke tests out of the over-limit
  `App.test.tsx` and recorded that child `124` browser evidence is smoke
  coverage with blocked full-matrix items due to no seeded authenticated local
  runtime fixture.

### 125: Capture Portal UI Modernization

Status: Complete on 2026-07-26.

Planned file:

- `docs/plan/125-capture-portal-ui-modernization.md`

Goal:

- Modernize the portal Capture workflow while preserving source immutability, ordering, privacy, and Project Version scope.

Scope:

- Capture Session list, creation, active/completed/archived states, detail, finalization, and archive behavior.
- Manual screenshot upload, bulk upload progress/failure/retry, Capture Event creation, ordering, safe editing, and asset inspection.
- Project Version context and the accepted rules for reassignment before source material exists.
- Generation entry points for Guide and Interactive Demo with explicit target Edition context.
- Stable loading dimensions, progress announcements, upload cancellation/failure recovery where supported, long URLs/titles, missing assets, and empty/error/permission states.

Rules:

- Original Capture Events and Assets remain immutable except for the already accepted safe metadata/edit behavior.
- Raw input values and page HTML remain excluded.
- A stale portal tab must fail safely instead of posting to a newly selected or archived Project Version.
- Browser evidence must use safe synthetic screenshots and data.

Implementation notes:

- Runtime implementation split the oversized Capture Session detail page into
  focused helper, section, and shell files while preserving existing behavior
  and copy.
- Canonical Project Version Capture Session detail routes now render without a
  nested local portal shell.
- Capture Session list routes now include Project Version active-status gating
  before exposing write controls.
- Guide and Interactive Demo generation no longer has the stale Default Project
  Version-only UI gate; named Project Version generation is covered by focused
  tests and redirects to canonical Project Version artifact routes.
- No server API, schema, migration, permission, Capture source immutability,
  raw input, raw HTML, asset lifecycle, or public route behavior changed.
- Browser evidence is recorded in
  `docs/ui/125-capture-portal-browser-evidence.md`. The full fixture-backed
  admin/viewer/signed-out desktop, mobile, reflow, failure-recovery, and
  accessibility matrix passed on 2026-07-29.
- Follow-up `docs/plan/125-01-capture-portal-browser-fixture.md` added
  dev/test-only fixture tooling, a DB integration test, and a live seed command
  verified against PostgreSQL 18.4.
- Close-previous fixes covered PostgreSQL 18 delegated-role provisioning,
  canonical fixture ULIDs/ownership, concurrent authentication-session
  touches, canonical named-version artifact redirects, empty-draft
  reassignment coverage, upload/status accessibility, and signed-out Project
  Version recovery.

Acceptance:

- Manual Capture completes end to end in default and named Project Versions.
- Upload and ordering failures are recoverable without duplicate indexes or lost accepted files.
- Guide/Demo generation inherits the correct Project Version and rejects cross-scope IDs.
- Portal browser tests cover narrow mobile and desktop detail/list workflows.

### 126: Extension UI Modernization

Status: Complete after installed toolbar-popup acceptance and closeout recheck
on 2026-07-29.

Planned file:

- `docs/plan/126-extension-ui-modernization.md`

Goal:

- Modernize the constrained Chrome extension experience without weakening capture reliability, instance separation, or privacy.

Scope:

- Instance connection, login, current-session verification, Project and Project Version selection, and stored-selection recovery.
- Start, active, paused, uploading, failure, retry, finish, and open-portal states within stable popup dimensions.
- Explicit handling for stale, archived, deleted, unauthorized, or changed default Project Versions.
- Split API/web origin behavior and current portal-link settings.
- Automatic-click status, manual screenshot fallback, actionable errors, and active-capture restoration.
- Keyboard/focus behavior, concise labels, readable truncation, and controls appropriate to the popup's narrow viewport.

Rules:

- Preserve instance-first login and extension-only token handling.
- Preserve privacy defaults: no raw input values and no page HTML.
- Never silently switch Project Version after a Capture Session starts.
- Keep browser automation evidence distinct from true installed toolbar-popup validation.
- Do not introduce recording/video permissions for future Loom-style work.

Acceptance:

- Setup/login/select/start/pause/resume/capture/finish/open-portal flows remain covered by focused tests.
- Stale version context fails safely and offers an explicit recovery path.
- Automatic and manual capture evidence is dated, and any true toolbar-popup limitation remains explicit.
- Popup content does not resize incoherently, clip controls, or hide critical capture status.

### 127: Guide Authoring And Reader UI Modernization

Status: Complete after close-previous audit on 2026-07-29.

Planned file:

- `docs/plan/127-guide-authoring-and-reader-ui-modernization.md`

Goal:

- Modernize the complete Guide workflow without changing its Block/Step/Annotation domain model.

Scope:

- Guide list, creation/generation, Edition context, carry-forward, accepted Revision checkpoint behavior, and archive states.
- Guide Block/Step authoring, screenshot selection/upload, annotations, ordering, preview, Markdown export, HTML ZIP export, publication, password, link, and embed controls.
- Replace ambiguous “Published version” UI language and contracts with the accepted Publication Sequence terminology.
- Public, restricted, password, expired/revoked, and embed reader states.
- Responsive authoring with stable rails/toolbars/media dimensions and correct annotation coordinates.
- Long content, missing/stale assets, stale Row Version conflicts, unsaved changes, failed saves, and permission changes.

Rules:

- Guide content remains separate from Interactive Demo and future Documentation content.
- Captured media remains inspectable and is not hidden by decorative treatments.
- Existing immutable Publications and public URLs retain their exact content/access behavior.
- Keyboard shortcuts are added only with complete conflict, focus, and discoverability behavior.

Acceptance:

- Edit, preview, annotate, reorder, export, publish, password, link, embed, and public-read behavior passes focused and browser regression coverage.
- Carry-forward cannot mutate the source Edition.
- Stale-write conflicts are recoverable without silently discarding work.
- Annotation coordinates remain correct at tested viewport sizes.

Completed outcome:

- Capture-to-Guide generation retains the named Project Version and opens the
  canonical Guide identity; Guide library, active/empty/archived Editions,
  Admin/Editor workbench, Viewer preview, Revisions, Carry-Forward, exports,
  Publication/Publish Link state, public reader, password, and embed passed the
  guarded synthetic browser matrix.
- Guide conflict routes return stable `409` envelopes, strict Guide/Demo public
  allowlists omit actor/source-authoring metadata, and DB/smoke coverage proves
  the immutable public graph.
- The oversized editor is split into a route controller and selected-Block
  outline/document/inspector workbench below the child file-size gate.
  Dirty drafts survive failed/conflicted commands and unrelated inserts;
  broken media disables highlight editing without deleting annotations.
- Full web/server/unit/DB/smoke/workspace checks and dated Headless Chrome
  Admin/Editor/Viewer/public evidence are recorded in child plan `127` and
  `docs/ui/127-guide-authoring-and-reader-ui-browser-evidence.md`.
- No migration, public URL/access change, persistence redesign, or production
  dependency was introduced.

### 128: Interactive Demo Authoring And Viewer UI Modernization

Status: Complete.

Planned file:

- `docs/plan/128-interactive-demo-authoring-and-viewer-ui-modernization.md`

Goal:

- Modernize the complete Interactive Demo workflow without changing its Scene/Hotspot/Transition domain model.

Scope:

- Interactive Demo list, generation, Edition context, carry-forward, accepted Revision behavior, and archive states.
- Scene creation/order, source/background asset selection, Hotspot creation/editing, target validation, transitions, preview, publication, password, link, and embed controls.
- Replace ambiguous publication-version copy and contracts with the accepted Publication Sequence language.
- Public, restricted, password, expired/revoked, and embed viewer states.
- Stable editor rails/toolbars/canvas dimensions and correct scaled Hotspot geometry across supported viewports.
- Missing assets/targets, stale Row Version conflicts, unsaved changes, failed saves, and permission changes.

Rules:

- Interactive Demo content remains separate from Guide and future Documentation content.
- Primary captured screens must remain clearly inspectable.
- Viewer motion must explain transition and focus, remain interruptible, and have a reduced-motion equivalent.
- Existing immutable Publications and public URLs retain their content/access behavior.

Acceptance:

- Scene, Hotspot, transition, preview, publish, password, link, embed, and public-view behavior passes focused and browser regression coverage.
- Carry-forward cannot mutate the source Edition.
- Stale-write conflicts are recoverable without silently discarding work.
- [x] Close-previous audit repaired draft reconciliation/unload coverage,
      aggregate mutation/conflict freezing, background-picker and broken-media
      recovery, pointer cancellation, and invalid-target behavior without a
      migration, permission, public contract, or dependency change.
- Hotspot geometry remains correct across tested viewport and media aspect ratios.

Completed result:

- The route controller is below the child file-size gate and composes a
  selected-Scene workbench, exact-Version screenshot picker, normalized
  pointer/keyboard canvas, stable Scene/Hotspot selection, explicit dirty/save/
  conflict recovery, and aggregate Publication mutation ownership.
- Working Draft, immutable Revision, authenticated read-only, public reader,
  and embed surfaces share one normalized renderer with history/focus,
  reduced-motion, terminal, protected-media, and safe public-access states.
- The strict referenced-background Asset projection preserves archived
  protected media without loosening public DTOs or adding a file route.
- A guarded synthetic fixture covers roles, lifecycle, twelve Scenes, media,
  real stale conflict, Revisions/Publications, a two-Version manifest, and the
  public state matrix.
- Focused, full web, DB, V1 smoke, workspace, build, and dated headless-browser
  verification passed. No migration, public URL/access change, persistence
  redesign, or production dependency was introduced.

### 129: Accessibility, Motion, Performance, And Browser Dogfood

Status: Complete on 2026-07-29.

Planned file:

- `docs/plan/129-accessibility-motion-performance-and-browser-dogfood.md`

Goal:

- Audit the modernized product as a connected experience and close cross-screen accessibility, motion, responsive, performance, and browser defects.

Scope:

- Run Impeccable critique/audit/polish/harden/adapt passes as applicable.
- Audit against an explicit WCAG 2.2 AA target for scoped web and extension workflows, documenting any technically justified exception.
- Review semantic landmarks, heading structure, labels, descriptions, focus order/visibility, modal focus, keyboard operation, contrast, status announcements, touch targets, zoom/reflow, and reduced motion.
- Run `review-animations` on every added transition and interaction.
- Execute the browser-support matrix accepted in child plan `121`; use the primary Chromium path for complete journeys and representative secondary-engine checks for public/authenticated web surfaces where supported.
- Use deterministic safe fixtures to compare accepted pre-redesign behavior with the modernized product.
- Check console errors, failed requests, broken images, layout shift, overflow, text clipping, dead controls, memory leaks from long editor sessions, and duplicate submissions.
- Measure representative bundle/page/render performance against the budgets accepted in `121`/`122` and investigate material regressions.
- Validate public readers and embeds separately from authenticated portal routes.
- Run the documented extension path and preserve the distinction between automated extension-page evidence and true toolbar-popup validation.
- Refresh committed product screenshots only after acceptance and only with safe synthetic data.

Minimum browser journeys:

- first-run setup/login/logout/session expiry;
- organization invite and member access;
- create Project and default/named Project Versions;
- create Capture manually and through the supported extension path;
- generate, carry forward, edit, preview, and publish a Guide;
- generate, carry forward, edit, preview, and publish an Interactive Demo;
- open public, restricted, password, expired/revoked, and embed routes;
- archive/restore and permission-denied behavior;
- narrow mobile navigation, 200% zoom/reflow, and wide editor layouts.

Acceptance:

- No critical accessibility violation remains in scoped flows, and all high-impact findings are fixed or explicitly block closeout.
- All functionality is keyboard-operable where the underlying interaction permits it.
- Reduced motion preserves comprehension and functionality.
- No incoherent overlap, clipping, blank media/canvas, dead navigation, or material uninvestigated performance regression remains at tested viewports.
- Known browser/extension limitations are dated and documented instead of being silently treated as passing.

Completed result:

- Eleven confirmed cross-product issues were repaired: privacy-safe route
  titles, authenticated bypass navigation, legacy small-text contrast, named
  Card semantics, Guide insertion-group semantics, Demo resize target size,
  global web reduced motion, Publication rollback focus containment/return,
  native modal background isolation, stable post-mutation focus fallback, and
  truthful committed-mutation/failed-refresh status.
- Final representative Chromium axe scans had zero violations. Layered
  Textarea contrast remained an accepted axe indeterminacy after manual review;
  Firefox/WebKit/Safari were honestly blocked because no supported executable
  was installed.
- 1440×900 wide editor, desktop, 390px, 640-CSS-pixel reflow, 360/320px popup,
  and 180-CSS-pixel popup checks passed without unexplained document overflow
  or hidden critical controls.
- Three-run production vitals for all seven required web/extension surfaces,
  Guide/Demo long-session workloads, full direct popup checks, and a separate
  real installed-toolbar Capture passed. The installed path proved ordered
  exactly-once redacted effects, suppression, pause/resume, restart recovery,
  finish-once behavior, and canonical named-Version handoff.
- Web closed at JS `468.99 kB` raw / `130.54 kB` gzip and CSS `73.94 kB` raw /
  `14.29 kB` gzip. Extension sizes remained unchanged. No speculative
  performance split, runtime dependency, permission, API, schema, migration,
  or product-semantic change was introduced.
- Full web/extension/server/workspace tests, all 20 DB integration files, V1
  smoke, types, lint, builds, formatting, and diff checks passed. Dated details
  are in
  `docs/ui/129-accessibility-motion-performance-browser-dogfood.md`.

### 130: Pre-Documentation Closeout

Status: Complete on 2026-07-29.

Planned file:

- `docs/plan/130-pre-documentation-closeout.md`

Goal:

- Prove that the version foundation and modernized current product are stable enough to begin Documentation-domain decisions.

Scope:

- Recheck child plans `109` through `129` against their acceptance criteria.
- Audit `CONTEXT.md`, ADRs, README, roadmap, status, architecture, contributor docs, route inventory, operations docs, app docs, and screenshots for drift.
- Confirm current-vs-planned language after versioning ships.
- Re-run non-DB, DB integration, smoke, type, lint, build, formatting/whitespace, migration, browser, accessibility, motion, and targeted performance checks.
- Confirm no Documentation or Video dead routes, nav items, schemas, packages, or placeholder tables were added.
- Record remaining known limitations and decide whether each blocks the Documentation grill.
- Exercise the documented clean database reset/reseed and full workflow from an empty schema.
- Verify that `version`, `version_number`, and Revision/Project Version language have not drifted back into ambiguity.

Required gate:

- Every new Project receives its active Default Project Version transactionally.
- Captures are Project Version-scoped.
- Guides and Interactive Demos follow accepted Edition/Revision/Publication semantics.
- Row Version concurrency and canonical Publication Sequence behavior remain correct.
- Existing published links retain their content and access behavior.
- The portal shell and existing workflows are stable across the accepted browser/viewport matrix.
- Design, accessibility, motion, and performance rules are documented and reusable.
- Current documentation describes real behavior accurately.
- No unresolved severity-one or severity-two regression remains in the path needed to model Documentation, using a severity rubric defined in child plan `130`.

Acceptance:

- A dated closeout report lists commands, results, browser evidence, migrations exercised, known limitations, and handoff questions.
- The repository is ready for a domain grill without mixing unresolved foundation bugs into Documentation design.

Completed result:

- `docs/pre-documentation-closeout.md` records the starting/final state,
  acceptance ledger for children `109` through `129`, terminology and ownership
  audits, issue register, exact commands/counts, browser matrix, limitations,
  and a Passed child `131` grill-entry gate. The separate Documentation
  implementation entry gate below remains pending until child `131` is
  accepted.
- Four S3/S4 active-documentation drift groups were corrected. No S1/S2
  regression or runtime repair was found, and no API, schema, type, migration,
  permission, dependency, Product Documentation, or Video runtime change was
  introduced.
- Final prompt-pack closure added explicit checked acceptance lists to the
  otherwise complete children `111`, `121`, and `125-01`, and distinguished the
  passed child `131` grill-entry gate from the still-pending Documentation
  implementation gate.
- A disposable test database applied migrations `001` through `024`, rehearsed
  migration `024` down/up on an empty schema, passed all `20` DB integration
  files / `67` tests and the separately reset V1 smoke test, and ended with
  clean migration status.
- Web, extension, server, shared-package, recursive workspace, type, lint, and
  production-build verification passed. Local/external documentation links and
  all committed PNG evidence also passed.
- Chromium regression dogfood passed connected role/workflow, public access,
  accessibility, keyboard/focus/modal, responsive/reflow, reduced-motion,
  direct-extension, and real installed-toolbar restart/finish/handoff checks.
  All seven production-vitals surfaces remained within or better than child
  `129`.
- Firefox/WebKit/Safari availability, axe-indeterminate layered Textarea
  contrast, and unavailable forced-GC/listener/timer measurement remain
  explicitly recorded non-blocking limitations. Child `131` may proceed as a
  planning/grill phase.

### 131: Documentation Domain Grill

Status: Complete on 2026-07-30.

Planned file:

- `docs/plan/131-documentation-domain-grill.md`

Goal:

- Produce an accepted, implementation-ready Documentation-domain model and phased scope without writing Documentation runtime code.

Method:

- Use `grill-with-docs` one question at a time.
- Compare decisions against the actual Audit/Access, Project Membership, Project Version, Edition, Revision, Publication, permission, file, and portal models built in `112` through `130`.
- Use Mintlify as a product/workflow benchmark and Fumadocs as a possible rendering/tooling boundary, not as an unquestioned product data model.
- Verify the current Mintlify/Fumadocs behavior, licensing, extension points, and security assumptions from primary sources during this child plan rather than relying on stale research.
- Update `CONTEXT.md` inline only as decisions settle.
- Add ADRs only for accepted durable decisions.
- End with an implementation-ready child-plan sequence beginning at `132`.

Questions that must be resolved:

1. Is the primary artifact a Documentation Site, Knowledge Base, Manual, or another term?
2. Is a Documentation Page independently versioned, or only versioned through its containing Site Edition?
3. Can a Project Version have multiple Documentation Sites?
4. What is the relationship among Site, Page, Navigation Tree, Edition, Revision, and Publication?
5. Is a Publication an atomic snapshot of the entire Site, a set of page snapshots, or another manifest model?
6. Can Pages or reusable snippets be shared across Sites/Project Versions without creating hidden live coupling?
7. Is authoring Markdown, MDX, structured blocks, rich text, or a deliberately constrained combination?
8. Is the source of truth database-first, Git-first, or bidirectional? What is deferred?
9. If Git synchronization exists, how are repository credentials, webhooks, branches/PRs, conflicts, deletions, and force-pushes handled?
10. If Fumadocs is used, which rendering/search/OpenAPI concerns may it own and which product-domain concerns must remain ours?
11. How are unsafe MDX, embedded HTML, script execution, remote media, URL protocols, code samples, and user-authored components handled?
12. How are navigation, ordering, folders/groups, cycles, slugs, aliases, redirects, and broken internal links modeled and validated?
13. How does carry-forward work across Project Versions at Site, navigation, Page, and reusable-content granularity?
14. What creates a Documentation Revision, and how are preview/review/publication snapshots produced?
15. How do autosave, optimistic locking, concurrent edits, conflict recovery, and unsaved local changes work before real-time collaboration exists?
16. Which access modes exist: organization-only, project members, selected groups, link-restricted, password, preview token, or public?
17. How do stable latest URLs, project-version URLs, edition URLs, revision previews, and immutable publication URLs behave?
18. What happens to redirects, search, links, previews, and Publications when a Project Version, Site, or Page is archived/deleted?
19. Is search Site-scoped, Project-scoped, Organization-scoped, version-aware, or cross-artifact in the first release?
20. How are title, description, headings, body, keywords, breadcrumbs, locale, and version labels indexed and permission-filtered?
21. Can Documentation reuse Capture Assets and Derived/Redacted Assets directly, and how are deletion/retention/reference rules enforced?
22. What import/export formats are in V1: Markdown folder, Git repository, ZIP, OpenAPI, or none?
23. Are comments, review, approvals, feedback, analytics, page ownership, and change history required now or deferred?
24. Are API reference, OpenAPI playground, generated SDK content, and interactive components in the first slice or later?
25. Are localization and locale fallback part of the model now or explicitly deferred?
26. What public-site SEO, canonical URL, sitemap, robots, social metadata, and custom-domain behavior is required or deferred?
27. What caching, rendering, invalidation, publication-build, failure-recovery, and rollback model is viable for self-hosting?
28. What operational limits are needed for page size, site size, build duration, asset size, and concurrent publication?
29. How are audit history, soft deletion, retention, export, and organization/project deletion applied to Documentation content?
30. What accessibility and performance targets apply to the authoring and published-reader surfaces?
31. What are the strict MVP exclusions?
32. Which vertical slice proves the model with the least irreversible complexity?

Required outputs:

- accepted Documentation terms and relationships in `CONTEXT.md`;
- a feature matrix split into first slice, V1, later, and rejected/non-goals;
- data ownership and source-of-truth decision;
- security/threat model for authored content, Git integration if any, previews, and public rendering;
- Fumadocs adoption/boundary decision with version/license evidence;
- URL, versioning, concurrency, access, search, publication, rollback, retention, and migration decisions;
- authoring and public-reader accessibility/performance targets;
- justified Documentation ADRs;
- an ordered child-plan sequence beginning at `132` with the first vertical slice fully bounded.

Acceptance:

- No foundational Documentation question is hidden behind “decide during implementation.”
- The model fits existing Project Version and publication semantics without forcing all artifact types into one content schema.
- Publication atomicity, authoring concurrency, security, and failure recovery are explicit.
- The first Documentation slice is small enough to implement and complete, but structurally valid for the accepted V1 direction.
- No Documentation runtime code, tables, routes, packages, or navigation are added during the grill.

Completed result:

- All 32 answers were finally accepted after recheck against completed children
  `129`/`130` and the current codebase.
- `CONTEXT.md` now contains accepted target terms and relationships without
  claiming runtime implementation.
- `docs/documentation-domain-decisions.md` consolidates the feature matrix,
  source-of-truth/ownership model, threat model, Fumadocs/Tiptap boundaries,
  URL/access/search/publication/concurrency/retention/migration decisions, and
  the implementation handoff subsequently refined by Master Plan `006` to
  children `132` through `140`.
- ADRs `0027` through `0030` record the durable Site publication, constrained
  content, authorized reader adapter, and private-comments decisions.
- The first implementation child is the complete end-to-end Documentation Site
  vertical slice in `132`, including the accepted Question `31` comments proof.
- No Documentation runtime code, table, route, package, or navigation was added.

## 14. Cross-Cutting Requirements

### Auditability

- Every successfully committed state-changing transaction creates one append-only Audit Event containing all affected Audit Change Items.
- Business mutations and their audit evidence commit or roll back atomically.
- Coverage includes user, extension, system, API-client, import, and migration sources, including every committed Working Draft autosave batch.
- Audit Event fields explicitly record organization/project/root scope, action, source/actor, request and idempotency context, before/after Row Version where applicable, optional reason, and occurrence time.
- Audit Change Items use explicit entity/parent identity, operation, field name, value type, and typed before/after scalar columns; audit persistence does not use JSON/JSONB.
- Relational child-record changes produce separate Audit Change Items rather than nested payloads.
- Sensitive fields are allowlisted/denied explicitly; secrets, credentials, tokens, and raw typed capture values are never retained.
- Failed, rolled-back, and no-op operations do not create misleading successful mutation events.
- Audit history is tenant-scoped, append-only, cursor-pageable, and unavailable through update/delete product APIs.
- A database mutation-context guard plus schema and command coverage tests must prevent unaudited mutable domain writes.
- The runtime database role may append and perform authorized reads but cannot update, delete, or truncate audit/access evidence; database guards and restrictive foreign keys enforce the boundary.
- Runtime and migration/maintenance credentials are separate, and startup/schema plus runtime-role integration tests verify grants, guards, indexes, and cascade resistance.
- Meaningful authenticated reads, public Publish Link views, downloads/exports, authentication outcomes, authorization denials, and extension API access create append-only Access Events.
- Access Events use typed relational context and never retain credentials, raw URLs with secrets, raw search text, or resource content.
- Protected content is not returned unless its Access Event is persisted successfully.
- Health/readiness probes, frontend static assets, CORS preflight, internal queries, range chunks, and non-domain heartbeats remain operational telemetry rather than Access Events.
- Access Events remain separate from mutation Audit Events but may be combined in authorized activity views.
- Organization Owners can query organization-wide evidence; Project Admins can query complete evidence only for their current Projects.
- Project Editors receive a curated Project Activity Timeline without raw security/access context; Project Viewers receive only ordinary Revision/Publication history; public consumers receive no internal evidence.
- Query authorization uses current membership, and each audit/access-history view creates an Access Event.
- Audit Events, Audit Change Items, and Access Events are retained indefinitely while the Organization exists; no automatic expiry, sampling, truncation, storage-pressure cleanup, or selective product deletion is allowed.
- Project/content archive, member removal, session or link revocation, and other ordinary lifecycle operations never delete evidence or erase historical actor attribution.
- Database relationships block accidental cascade deletion; backups include evidence, storage volume is measured, operators receive actionable warnings, and future partitioning cannot weaken retention.
- Permanent Organization deletion, legal erasure, governed retention schedules, and cold storage require a future explicit administrative design; destructive cascade remains blocked until then.
- V1 has no audit/access export button, route, job, generated file, format, or download flow; interactive authorized timelines are the only product surface.
- Permanent Organization/legal purge remains blocked until a future design settles export opportunity and governed deletion explicitly.
- V1 does not claim tamper-proof, WORM, or compliance-certified storage; cryptographic signatures/chains require an external key and independently retained checkpoint or WORM boundary and remain deferred.

### Authorization And Tenant Isolation

- Every new record must be reachable through the owning Organization and Project.
- Project Version IDs cannot be trusted without verifying Project/Organization ownership.
- Existing organization roles must be reused or deliberately extended; route-local role invention is prohibited.
- Public Publications must expose only assets reachable from the exact immutable Artifact Revision identified by the Published Artifact.
- Archived status must never bypass authorization.

### Data And Migration Safety

- SQL migrations remain the persistence source of truth.
- This track is pre-live and may reset/reseed development and test databases for the clean target model; there is no production-row backfill requirement.
- Breaking schema and API changes are acceptable when all in-repo consumers move together and the result is a cleaner explicit model.
- The implementation child plan must choose explicitly between rebaselining development migrations and adding a post-`014` clean transition after inspecting tooling and CI behavior.
- All in-repo apps, contracts, fixtures, tests, docs, and smoke paths move together; do not retain ambiguous legacy fields without an active consumer.
- Core persistent domain state, including Working Drafts, Artifact Revisions, and Published Artifacts, uses typed columns, foreign keys, constraints, and type-specific relational records rather than JSON/JSONB.
- The clean schema removes generic domain metadata JSONB and `published_artifact.snapshot_json`; JSON remains a transport and configuration format only.
- Accepted public route shapes and immutable Publication behavior remain product requirements even though no persisted public records require migration.
- Rollback limitations must be explicit where irreversible published data exists.
- Database migration history is never renamed for branding.

### API And Shared Contracts

- Public/shared Zod schemas belong in `@repo/types` only when they pass the established reuse gate.
- Canonical statuses and enum values belong in `@repo/constants` only when shared or contract-significant.
- Domain decisions belong in domain packages; HTTP and SQL remain adapters.
- API routes should remain REST/Fastify/Zod/OpenAPI-aligned.
- Portal and extension contracts are updated in the same implementation track; no mixed old/new client support is required before the first live release.

### UI Quality

- The portal is an operational application, not a marketing site.
- Every user-triggered async action requires clear pending, success, and failure behavior.
- Every list/editor needs empty, loading, error, permission, archived, and long-content states as applicable.
- Text and controls must not overlap or resize fixed-format layouts unexpectedly.
- Mobile and desktop workflows must both be complete, not merely visually compressed.
- Icons, menus, tabs, segmented controls, toggles, steppers, and tooltips should match the action type.
- Motion must be interruptible, performant, purposeful, and replaceable under reduced-motion preferences.

### Observability And Operations

- New migration and API failure modes must produce actionable logs without leaking secrets or captured data.
- Version/Edition/Publication identifiers should be available in structured server diagnostics.
- Storage growth implications of copy/carry-forward/revisions must be documented.
- Local-file storage, cleanup, rate-limit, and backup limitations remain visible until separately solved.

### Testing

- Domain rules receive unit coverage.
- Routes receive authorization, validation, and response-contract coverage.
- Persistence receives real PostgreSQL integration and migration coverage.
- Shared contracts receive runtime-schema tests.
- Web/extension behavior receives component/page tests.
- Critical journeys receive DB-backed smoke and real-browser validation.
- Public publication compatibility receives snapshot/reader/embed tests.

## 15. Principal Risks And Mitigations

### Risk: `version` remains overloaded

Mitigation: child plan `111` is a hard gate; it inventories existing optimistic Row Versions and replaces ambiguous publication-version terminology in the clean target schema/contracts/UI.

### Risk: a universal artifact abstraction erases real behavior

Mitigation: share identity/version/publication concepts only; keep Guide, Interactive Demo, Documentation, and Video content models separate.

### Risk: versioning creates ceremony for small teams

Mitigation: create `Main` transactionally with every Project and keep explicit version controls quiet until a team creates additional Project Versions.

### Risk: carry-forward creates storage duplication or confusing drift

Mitigation: grill copy/reference/inheritance semantics, measure asset/content duplication, and make source/new Edition independence visible.

### Risk: immutable Revision history grows without bounds

Mitigation: decide Revision creation triggers before implementation, avoid per-keystroke immutable snapshots, measure content/asset deduplication, and document retention/export requirements without deleting referenced Publications.

### Risk: comprehensive audit history grows rapidly or misses a write path

Mitigation: record one event per committed logical transaction, retain field/child changes as typed relational items, allow UI-only autosave collapsing, enforce mutation audit context at the database boundary, and test every mutable table and command for coverage.

### Risk: published links change meaning

Mitigation: preserve immutable revision-backed Published Artifacts and add Project Version metadata without repointing existing links silently.

### Risk: archiving a shared asset breaks drafts or Publications

Mitigation: distinguish archive from purge, keep archived referenced assets resolvable, block physical file purge while protected references exist, and test Guide/Demo/export/public streaming against the full reference graph.

### Risk: a broad UI rewrite breaks working alpha behavior

Mitigation: establish primitives first, modernize complete workflows incrementally, use TDD and browser dogfood, and preserve route/API behavior.

### Risk: external design skills produce inconsistent or generic output

Mitigation: canonical product/domain docs outrank external advice; use Impeccable as the primary workflow and Emil skills for focused interaction/motion review.

### Risk: rename churn consumes the product track

Mitigation: separate display brand, repository identity, packages/config, and persistent identifiers; rename only approved layers and never rewrite migration history.

### Risk: future Documentation is confused with repository docs

Mitigation: use qualified product terms, keep `apps/docs` ownership explicit, and prohibit Documentation runtime work before child plan `131` acceptance.

### Risk: Loom-style scope arrives early through shared UI or schema

Mitigation: document Video as deferred and do not create Video nav, tables, packages, upload pipelines, or recording permissions in this track.

## 16. Master Plan Checklist

- [x] Create master plan `005`.
- [x] Create, expand, recheck, implement, and close child plan `109`.
- [x] Reopen, implement, verify, and close child plan `110` technical identity
      migration. Original naming/documentation work completed on 2026-07-10.
- [x] Create, conduct, document, and accept the versioning grill in child plan `111`.
- [x] Create, expand, recheck, implement, and close child plan `112`.
- [x] Create, expand, recheck, implement, and close child plan `113`.
- [x] Create, expand, recheck, implement, and close child plan `114`.
- [x] Create, expand, recheck, implement, and close child plan `115`.
- [x] Create, expand, recheck, implement, and close child plan `116`.
- [x] Create, expand, recheck, implement, and close child plan `117`.
- [x] Create, expand, recheck, implement, and close child plan `118`.
- [x] Create, expand, recheck, implement, and close child plan `119`.
- [x] Create, expand, recheck, implement, and close child plan `120`.
- [x] Create, expand, recheck, implement, and close child plan `121`.
- [x] Create, expand, recheck, implement, and close child plan `122`.
- [x] Create, expand, recheck, implement, and close child plan `123`.
- [x] Create, expand, recheck, implement, and close child plan `124`.
- [x] Create, expand, recheck, implement, and close child plan `125`.
- [x] Create, expand, recheck, implement, and close child plan `126`.
- [x] Create, expand, recheck, implement, and close child plan `127`.
- [x] Create, expand, recheck, implement, and close child plan `128`.
- [x] Create, expand, recheck, implement, and close child plan `129`.
- [x] Create, expand, recheck, implement, and close child plan `130`.
- [x] Create, conduct, document, and accept the Documentation grill in child plan `131`.
- [x] Produce an implementation-ready Documentation child-plan sequence beginning at `132`.
- [x] Run final closure against this master plan.

## 17. Documentation Implementation Entry Gate

Documentation implementation may start only when all of the following are true:

- Child plans `109` through `130` are complete and audited.
- Child plan `131` is accepted and its documentation/ADR updates are committed or otherwise finalized.
- Project Version, Artifact Edition, Revision, Row Version, Publication, and Publication Sequence have accepted definitions.
- Existing Captures, Guides, and Interactive Demos use the accepted version context.
- Accepted public-link and embed route behavior remains covered.
- Portal information architecture has a real location for Documentation without dead navigation.
- Design primitives and accessibility/motion requirements are reusable by the Documentation editor and reader.
- The Documentation source of truth, content format, renderer boundary, security model, access model, URL model, search scope, and MVP exclusions are decided.
- The first implementation child plan starts with a vertical slice and explicit test/migration/browser criteria.

Gate result on 2026-07-30:

- The foundation and domain-decision portions are passed.
- Child `132` is now expanded and rechecked with exact migration, schema, API,
  UI, permission, audit/access, test, rollback, dependency-proof, and
  agent-browser contracts against the current codebase. Product Documentation
  runtime remains unimplemented and begins only from the committed child `132`
  plan checkpoint.

## 18. Completion Criteria

This master plan is complete when:

- Repository-local agent workflows and skills are installed, documented, and validated.
- Product docs accurately describe current capability, next direction, and deferred work.
- The product-name direction is explicitly accepted, with any rename staged by compatibility layer.
- Versioning vocabulary and durable decisions are recorded in `CONTEXT.md` and accepted ADRs.
- Comprehensive Audit/Access and Project Membership foundations are implemented before new version-domain mutations ship.
- Project Versions are implemented and every newly created Project receives a valid Default Project Version transactionally.
- Captures, Guides, Interactive Demos, Editions/Revisions, and Publications follow the accepted model.
- Existing workflows and published outputs remain compatible.
- The design system, application shell, core workflows, editors, and readers meet the accepted UI, accessibility, motion, and responsive bar.
- Browser dogfood and full verification evidence are current and dated.
- The pre-Documentation closeout has no unresolved blocking regressions.
- The Documentation grill produces accepted domain decisions and an implementation-ready plan beginning at `132`.
- No Documentation or Video implementation is falsely claimed as part of this completed foundation track.

## 19. Immediate Next Action

Master Plan `005` is closed. Child `132`, Documentation Site First Vertical
Slice, is expanded and rechecked against the current codebase,
`docs/documentation-domain-decisions.md`, and accepted Master Plan `006`. The
next executable activity after its scoped plan checkpoint is runtime
implementation of that complete Question `32` flow—including the private Page
comment proof—under its migration, contract, permission, audit/access,
dependency-proof, rollback, verification, and agent-browser gates.

The separate overnight-runner tooling checkpoint was deferred by user decision
on 2026-07-19 because it was taking disproportionate time to build; it is
optional future workflow tooling and does not block the Documentation sequence.

Children `109`, `110`, the deliberately early `111` grill, Audit Evidence Core
child `112`, comprehensive existing-mutation coverage child `113`, Access
Evidence/Owner compliance timeline child `114`, Project Membership Foundation
child `115`, Project Version Foundation child `116`, Capture Source Version
Scoping child `117`, Guide/Demo Edition And Working Draft Relational Foundation
child `118`, Guide/Demo Revision, Carry-Forward, And Protected Assets child
`119`, Publication And Multi-Version Publish Link Integration child `120`, and
Design-System Foundation child `121`, Portal Architecture And Application Shell
child `122`, Authentication, Setup, And Organization UI Modernization child
`123`, Project/Version/Library child `124`, Capture Portal child `125`,
Extension UI child `126`, Guide Authoring/Reader child `127`, and Interactive
Demo Authoring/Viewer child `128` are complete.
The final prompt-pack closure audit confirmed
that every completed child from `112` through `120` records status, checklist,
implementation, verification, leftovers, and handoff evidence; child `121`
records source implementation, verification, explicit user acceptance,
leftovers, and handoff evidence; child `122` records implementation,
close-previous verification, browser evidence, leftovers, and handoff evidence;
child `123` records source implementation, verification, browser evidence,
leftovers, and handoff evidence; child `124` records its implementation and
closeout; and child `125` records implementation, PostgreSQL 18 fixture/DB
verification, full browser evidence, leftovers, and extension handoff.
Child `126` records installed-toolbar evidence, child `127` records its Guide
implementation and Interactive Demo handoff, and child `128` records its Demo
implementation, DB/smoke/workspace/build verification, synthetic browser
evidence, leftovers, and cross-product handoff.
Child `129` records the final accessibility/motion/performance/browser dogfood,
child `130` records the complete foundation closeout and child `131` grill-entry
result, and child `131` records all finally accepted Documentation decisions,
canonical outputs, and the implementation handoff. Master Plan `006` subsequently
refined that handoff to children `132` through `140` without changing the
accepted semantics. The reserved skeletons did not advance gates by their
existence; their completed records do. Sequential planning continues with child
`132`, while Product Documentation runtime remains unimplemented.
