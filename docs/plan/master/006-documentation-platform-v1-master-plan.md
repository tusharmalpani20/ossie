# Master Plan 006: Documentation Platform V1

Date: 2026-07-30

Status: Active after child `135` implementation and verification on 2026-07-30.
The first vertical slice, constrained V1 content, Edition-owned Snippets,
protected Documentation/Capture Assets, exact artifact references, immutable
snapshots, and inspected portability are implemented, independently
close-rechecked, and verified. Cross-Version Carry-Forward, multi-Site
selection, and recoverable lifecycle are also implemented and verified. Child
`136` is the next bounded reservation; children `136` through `140` must be
re-expanded after their actual
predecessors.

Master plan number: 006.

Predecessor:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Canonical decision baseline:

- `CONTEXT.md`
- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/documentation-domain-decisions.md`
- `docs/plan/130-pre-documentation-closeout.md`
- `docs/plan/131-documentation-domain-grill.md`
- ADRs `0021` through `0030`

Child sequence:

- `docs/plan/132-documentation-site-first-vertical-slice.md`
- `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`
- `docs/plan/134-documentation-import-export-and-package-portability.md`
- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`
- `docs/plan/136-documentation-review-and-approval-workflow.md`
- `docs/plan/137-documentation-api-try-it-and-example-experience.md`
- `docs/plan/138-documentation-v1-operational-hardening.md`
- `docs/plan/139-documentation-v1-final-closeout.md`
- `docs/plan/140-post-v1-documentation-decision-gate.md`

## 1. Purpose

Master Plan `005` established the Project Version, Project Membership,
relational Working Draft, immutable Revision/Publication, protected File,
Publish Link, Audit/Access, design-system, application-shell, and browser-tested
foundation required before Product Documentation could be modeled. Child `131`
then accepted the Documentation domain without adding runtime code.

This master owns the implementation of Product Documentation V1 from that
accepted model through a final V1 closeout and a post-V1 decision gate.

The intended product outcome is:

```text
Organization
  -> Project
    -> Project Version
      -> Documentation Site Edition
        -> mutable Site Working Draft
          -> Documentation Pages
          -> Navigation Tree
          -> Documentation Assets
          -> OpenAPI Sources
          -> private Page comments
        -> immutable Site Revisions
          -> immutable Site Publications
            -> stable multi-version Publish Link
              -> exact-publication public reader and search
```

The master must deliver a coherent Documentation product, not a disconnected
editor demo or an isolated public renderer. The first implementation child is
therefore the complete end-to-end vertical slice accepted in Question `32`.
Later children deepen that working path without replacing its identities or
publication semantics.

This master does not reopen the accepted Documentation model. A child may
refine implementation mechanics, exact route syntax, table layout, adapter
interfaces, and validation limits. It may not silently change identity,
ownership, access, privacy, publication atomicity, immutable history, retention,
or executable-content decisions.

## 2. Planning Truth Bands

Every child, implementation log, user-facing copy update, and final handoff must
distinguish these bands.

### 2.1 Current Runtime

After child `133` completion:

- Ossie implements Organizations, Org Users, Projects, Project Membership,
  Project Versions, Captures, Guides, Interactive Demos, relational
  Guide/Interactive Demo Working Drafts, immutable Revisions, immutable
  Publications, multi-version Publish Links, protected shared Files, and
  append-only Audit/Access Evidence.
- `apps/server` is a Fastify REST API backed by PostgreSQL and local File
  storage.
- `apps/web` is a React/Vite portal with authenticated authoring and public
  Guide/Interactive Demo readers.
- `apps/extension` is a Manifest V3 browser-capture client.
- `apps/docs` is repository contributor/operator documentation and is not
  Product Documentation.
- Migrations end at
  `026_documentation_content_snippets_and_asset_workflows.sql`.
- Product Documentation now has a domain package, relational mutable Site/
  Edition/Page/navigation/routing/comment/OpenAPI/search state, immutable
  Revision and type-specific Publication snapshots, protected image assets,
  version-scoped authenticated APIs and portal routes, stable Documentation
  Publish Links, and exact public reader/search/metadata routes.
- Child `132` is complete. Restricted/password/revoked/expired viewer sessions,
  complete first-slice Audit/Access coverage, nested tenant scope,
  immutable-table runtime/maintenance guards, all first-slice authoring
  controls, and the accepted Chrome access/upper-bound evidence pass.
- Child `133` is complete. The constrained V1 block set, Edition-owned reusable
  Snippets, Documentation Asset archive/restore, same-Project Capture Asset
  reuse, exact Guide/Demo Publication cards, complete immutable expansion,
  Snippet-aware search, Capture purge protection, and Admin/Viewer/public
  Chrome evidence pass.
- Tiptap and Fumadocs are not application dependencies.

### 2.2 Accepted Target

The following remain accepted targets across the active and later children;
some are now partially or fully implemented as recorded in the child logs:

- stable Project-owned Documentation Sites;
- at most one Site Edition for each Site and Project Version;
- relational Site Working Draft content with resource-level Row Versions;
- stable Documentation Pages, navigation, slugs, permanent aliases, redirects,
  reusable snippets, assets, and OpenAPI Sources;
- one primary Site language identified by a standard language tag;
- complete immutable Site Revisions and exact Site Publications;
- private Project-member Page comments excluded from Revisions/Publications;
- a replaceable Tiptap authoring adapter;
- a replaceable Fumadocs reader/search/OpenAPI adapter;
- stable Publish Links selecting exact Site Publications;
- Project/Version-scoped internal search and exact-Publication public search;
- atomic publication preparation/switch and rollback by pointer;
- safe import/export, Carry-Forward, review workflow, browser-direct Try It
  after proof, V1 hardening, and final closure.

### 2.3 Unresolved Implementation Mechanics

The following are deliberately owned by expanded child plans:

- exact Tiptap/Fumadocs compatible package versions at implementation time;
- search implementation and storage technology, provided it remains a derived,
  permission-filtered projection;
- publication preparation execution strategy for the initial self-hosted
  deployment;
- exact browser-direct Try It origin/credential UX after the required proof.

These mechanics must be decided and documented before their owning child is
implemented. They do not require a new grill unless they reveal a genuinely new
irreversible product decision.

### 2.4 Rejected Or Deferred

The following must never be described as current or silently pulled into V1:

- Git or GitHub as a second Documentation authority;
- bidirectional repository synchronization;
- arbitrary MDX, JavaScript, React, raw HTML, or arbitrary iframes;
- live remote OpenAPI as publication authority;
- server-side arbitrary API proxying;
- storage of customer API credentials;
- Page-level ACLs;
- public comments;
- live snippets shared across Sites/Editions;
- per-Page publication;
- moving `/latest` semantics;
- realtime collaborative editing;
- offline-first automatic merge;
- translation workflow and locale fallback;
- custom domains;
- public feedback and product analytics;
- governed permanent deletion;
- automatic implementation of post-V1 proposals;
- Video runtime.

## 3. Canonical Decision Precedence

Implementation and documentation disagreements are resolved in this order:

1. repository/system instructions and `AGENTS.md`;
2. accepted ADRs;
3. canonical terminology and relationships in `CONTEXT.md`;
4. the final acceptance ledger in
   `docs/grill/2026-07-29-documentation-domain-grill.md`;
5. `docs/documentation-domain-decisions.md`;
6. this master;
7. the active expanded child;
8. implementation-era notes and historical provisional workshop text.

Historical `Provisionally accepted` paragraphs in the grill are workshop
chronology. The final ledger supersedes them.

This master refines implementation sequencing only. It does not amend ADRs
`0027` through `0030`.

## 4. Executive Decisions

1. Product Documentation V1 is governed by a new master rather than reopening
   completed Master Plan `005`.
2. The implementation sequence contains nine children, `132` through `140`.
3. Child `132` remains the complete Question `32` end-to-end first slice.
4. Child `132` may use internal work stages and small commits, but it may not be
   declared complete after only a horizontal persistence, editor, or reader
   layer.
5. The original child `133` scope is split into content/assets and
   import/export children because portability introduces a distinct untrusted
   archive and compatibility boundary.
6. The original V1 hardening/closeout scope is split so the final closure child
   audits completed behavior instead of implementing material features while
   trying to certify them.
7. Documentation receives a type-specific domain package and relational schema;
   it does not reuse Guide/Demo content tables or create a universal content
   document.
8. Shared Project Version, File, Audit/Access, Project Membership, and Publish
   Link concepts are reused through explicit type-specific adapters and
   constraints.
9. The database and protected File storage remain authoritative.
10. Tiptap and Fumadocs remain replaceable adapters whose adoption is gated by
    focused evidence.
11. Publication is always whole-Site, exact-Revision, immutable, prepared before
    the live-link switch, and rollbackable by repointing.
12. Private comments ship in the first vertical slice but never enter a Site
    Revision, Site Publication, public cache, public search index, or public
    export.
13. The first slice includes read-only OpenAPI reference; API execution is a
    later child with its own threat proof.
14. The master closes V1 before child `140` reassesses deferred work.
15. Child `140` is a decision gate, not blanket permission to implement every
    deferred feature.

### 4.1 Dependency Research Snapshot

Child `131` recorded the following package-registry snapshot on 2026-07-30:

- `fumadocs-core` `16.13.0`, MIT;
- `fumadocs-ui` `16.13.0`, MIT;
- `fumadocs-openapi` `11.2.2`, MIT;
- Tiptap packages `3.29.2`, MIT.

These values are research evidence, not accepted pins. The current repository
does not depend on them. Child `132` must recheck current package versions,
licenses, compatibility, transitive dependencies, bundle behavior, and official
integration guidance before changing manifests or the lockfile.

Master recheck on 2026-07-30 confirmed the same registry versions and licenses
with `npm view`. It also confirmed:

- official Fumadocs guidance supports custom/low-level content sources and
  React Router integration, but the portal currently has neither React Router
  nor an MDX authority;
- current Fumadocs Vite guidance documents explicit bundler handling;
- `fumadocs-openapi` peers include Scalar API-client packages even though the
  accepted first slice is read-only;
- official Tiptap React guidance supports the repository's React/Vite stack and
  places toolbar/menu accessibility on the integrating application;
- the repository declares Node `>=18`, CI uses Node `22`, and the recheck host
  uses Node `24`, while current Fumadocs quick-start guidance states a Node `22`
  minimum for its standard installation path.

Child `132` therefore must:

- use a custom/low-level authorized content adapter, not MDX/file-system
  authority;
- preserve the tested local route registry unless a separate accepted decision
  authorizes a router migration;
- prove any required Vite `noExternal`/pre-bundling configuration;
- prove that the read-only OpenAPI bundle exposes no request client or Try It
  behavior;
- avoid silently raising the repository's supported Node engine. If selected
  packages require Node `22`, the child must either choose a compatible
  supported boundary/fallback or stop for an explicit compatibility decision
  covering local development, CI, self-hosting, and operator documentation.

Primary evidence:

- `https://www.fumadocs.dev/docs`
- `https://www.fumadocs.dev/docs/manual-installation/react-router`
- `https://www.fumadocs.dev/docs/integrations/content/custom`
- `https://www.fumadocs.dev/docs/headless`
- `https://tiptap.dev/docs/editor/getting-started/install/react`
- `https://tiptap.dev/docs/guides/accessibility`

## 5. Sequence Reconciliation From Child 131

Child `131` recorded a seven-item implementation handoff. This master preserves
every accepted capability while refining the delivery units:

| Child 131 handoff                             | Master 006 child                              | Reconciliation                                                                            |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `132` Documentation Site First Vertical Slice | `132`                                         | Unchanged.                                                                                |
| `133` Portability, Snippets, And Assets       | `133` Content, Snippets, And Asset Workflows  | Content/asset behavior stays together.                                                    |
| `133` Portability, Snippets, And Assets       | `134` Import, Export, And Package Portability | Untrusted archives and package compatibility become a dedicated security-sensitive child. |
| `134` Version Carry-Forward And Lifecycle     | `135`                                         | Renumbered; semantics unchanged.                                                          |
| `135` Review Workflow                         | `136`                                         | Renumbered; semantics unchanged.                                                          |
| `136` API Experience                          | `137`                                         | Renumbered; semantics unchanged.                                                          |
| `137` V1 Hardening And Closeout               | `138` V1 Operational Hardening                | Material hardening remains implementation work.                                           |
| `137` V1 Hardening And Closeout               | `139` V1 Final Closeout                       | Certification and drift repair become a clean audit child.                                |
| `138` Post-V1 Decision Gate                   | `140`                                         | Renumbered; remains decision-only.                                                        |

This refinement does not add V1 product scope. It creates clearer security,
implementation, verification, and closure ownership.

This recheck updates child `131`, `docs/documentation-domain-decisions.md`,
Master Plan `005`, and active direction docs to the refined sequence. Runtime
work must not begin while active sequence documents contradict one another.

### 5.1 Master Delivery Matrix

| First vertical slice (`132`)                          | Remaining V1 (`133`–`138`)                                        | Post-V1 decision candidates (`140`)          | Rejected/non-goals                       |
| ----------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| One Site and one Project Version-scoped Site Edition  | Complete constrained content and authoring depth                  | GitHub App proposal/import/export automation | Git/bidirectional sync as V1 authority   |
| Two stable Pages, Navigation, slugs, aliases, link    | Edition-owned reusable snippets                                   | Translation workflow and locale fallback     | Arbitrary MDX/JS/React/raw HTML/iframes  |
| Tiptap adapter proof and relational round trip        | Documentation and same-Project shared Asset workflows             | Custom domains                               | Page-level ACLs                          |
| Independent Row-Version autosave/conflict             | Safe Markdown and versioned ZIP import/export                     | Public feedback/analytics                    | Public comments in V1                    |
| Private comment thread/reply/mention/resolve/reopen   | Whole-Site Carry-Forward and multi-Site lifecycle                 | Realtime collaboration/offline merge         | Mandatory approval gate in first slice   |
| Self-contained OpenAPI and read-only reference        | Review Requests, approvals, notifications, optional gate/override | Governed permanent deletion                  | Server-side API proxy/stored credentials |
| Authenticated preview and immutable Site Revision     | Browser-direct Try It after security proof                        | Cross-artifact/Organization search           | Per-Page publication                     |
| Exact Site Publication and stable Publish Link        | Quotas, cache/search/SEO/access/operator hardening                | Advanced publication distribution            | Moving `/latest`                         |
| Exact public reader/navigation/search/operation links | Complete accessibility/performance/security/browser closure       | External reviewer access                     | Live cross-Site snippets                 |
| Second Publication, immutability proof, rollback      | Final V1 audit and current-truth documentation                    | Rich interactive components/SDK proposal     | Remote OpenAPI as live authority         |

Child `139` certifies the combined First Slice and Remaining V1 columns. Child
`140` may accept, defer, or reject candidates; it does not implement them.

## 6. Current Repository Baseline

Baseline reviewed: 2026-07-30.

### 6.1 Repository Shape

- pnpm/Turborepo monorepo.
- TypeScript application and package code.
- PostgreSQL relational persistence.
- Fastify/Zod REST boundary.
- React 19 portal and public viewers.
- Tailwind CSS 4 plus shared UI primitives and CSS Modules.
- Vitest unit/integration tests.
- PostgreSQL DB integration and V1 smoke tests.
- Agent-browser and Puppeteer-capable Chromium evidence paths established by
  children `126`, `129`, and `130`.

### 6.2 Existing Packages

Relevant active packages:

- `@repo/constants`
- `@repo/types`
- `@repo/ui`
- `@repo/audit-domain`
- `@repo/file-domain`
- `@repo/capture-domain`
- `@repo/guide-domain`
- `@repo/demo-domain`
- `@repo/publish-domain`

There is no `@repo/documentation-domain`.

### 6.3 Existing Server Boundaries

Relevant modules:

- `apps/server/src/modules/project`
- `apps/server/src/modules/project-version`
- `apps/server/src/modules/project-membership`
- `apps/server/src/modules/capture-asset`
- `apps/server/src/modules/file-storage`
- `apps/server/src/modules/artifact-revision`
- `apps/server/src/modules/artifact-carry-forward`
- `apps/server/src/modules/publish`
- `apps/server/src/modules/audit`
- `apps/server/src/modules/access`
- `apps/server/src/modules/project-activity`
- `apps/server/src/modules/compliance`

`apps/server/src/app.ts` currently composes the route/service/repository
dependencies and explicit Project capability mappings.

### 6.4 Existing Portal Boundaries

Relevant files and areas:

- `apps/web/src/App.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/features/portal`
- `apps/web/src/features/project-version`
- `apps/web/src/features/project`
- `apps/web/src/features/artifact-revision`
- `apps/web/src/features/publish`
- current Guide and Interactive Demo editors/readers as interaction patterns

The portal uses a tested local route registry/path parser rather than React
Router. A Documentation child must not replace the whole router merely to adopt
Fumadocs.

### 6.5 Persistence Baseline

- Migrations `001` through `024` are immutable historical migration inputs.
- Current authored core state is explicitly relational.
- Runtime credentials are constrained by schema grants and append-only guards.
- Mutation audit evidence commits with business state.
- Published Artifact records are immutable and non-deletable.
- Publish Link entries point to exact immutable Publications.
- Protected Files cannot be purged while referenced.

Documentation migration work starts at `025`.

### 6.6 Compatibility Baseline

The product is pre-live, but compatibility still matters:

- existing Guide/Demo API and portal behavior must remain green;
- existing public and embed routes must retain exact behavior;
- existing migrations must remain replayable;
- existing dev fixtures and V1 smoke paths must remain usable;
- no Documentation implementation may weaken tenant constraints, Project
  authorization, Audit/Access coverage, protected asset behavior, or
  Publication immutability;
- repository docs must distinguish Product Documentation from `apps/docs`.

## 7. Accepted Documentation Domain Map

### 7.1 Identity And Ownership

```text
Organization
  owns Project
    owns Documentation Site
      has at most one Site Edition per Project Version
        owns one mutable Site Working Draft
          owns Documentation Pages
          owns Navigation Tree and Navigation Groups
          owns Page slug state, aliases, and redirect/gone rules
          owns edition-local Reusable Documentation Snippets
          owns/references Documentation Assets
          owns uploaded OpenAPI Sources
          owns private Page Comment Threads
        has many immutable Site Revisions
          referenced by immutable Site Publications
            selected by stable Documentation Publish Links
```

The Project Version is release context. It does not own the Site identity and
does not become an authoring Revision.

The first-slice schema must support many Documentation Sites per Project even
though child `132` exercises only one. Child `135` adds the complete multi-Site
management experience; it must not have to replace a one-Site persistence
assumption.

### 7.2 Mutability

- Site identity: stable; type-specific identity fields may be immutable.
- Site Edition: mutable lifecycle and metadata while active.
- Site Working Draft: mutable aggregate.
- Page and other mutable child resources: Row Version protected.
- Comment/reply/resolution state: mutable private authoring state with explicit
  Row Version protection.
- Site Revision: immutable and non-deletable in V1.
- Site Publication: immutable and non-deletable in V1.
- Publish Link: stable mutable pointer/policy object with guarded lifecycle.
- Publish Link selected entry: mutable pointer to an immutable Site Publication.

### 7.3 Revision Triggers

Only these create or reuse a Site Revision in V1:

- manual checkpoint;
- Publication;
- Carry-Forward.

Normal save/autosave, preview, comment mutation, search indexing, cache rebuild,
and export do not create a Site Revision.

Site Revision Numbers and Site Publication Sequences:

- are positive, server-owned, user-visible counters;
- are each scoped to one Site Edition;
- increase independently;
- are never reused;
- are not Row Versions or Project Versions;
- may diverge because more than one Publication may reference the same unchanged
  latest Site Revision;
- remain stable in authenticated exact-history URLs.

### 7.4 Publication Atomicity

A Site Publication freezes:

- Page identities and selected Page content;
- Page titles/descriptions/keywords and primary language;
- the selected Home Page;
- Navigation Tree and Navigation Groups;
- canonical slugs and aliases;
- redirect and `gone` rules;
- reusable snippet content actually referenced by the Revision;
- OpenAPI Sources and operation destinations;
- Documentation Asset references;
- Site settings and public metadata;
- search-relevant content and labels;
- all state required to rebuild the exact public reader.

Private comments, review tasks, notifications, mutable draft Row Versions, and
operational job state are excluded.

### 7.5 Carry-Forward

Carry-Forward:

- selects complete Documentation Sites;
- reads one exact source Site Revision;
- targets one Project Version in the same Project;
- creates only missing target Site Editions;
- copies mutable Page/navigation/snippet/settings structures into independent
  records;
- reuses protected Files where authorized;
- records immediate source provenance;
- is atomic and idempotent;
- never overwrites;
- creates no live synchronization.

## 8. Target Architecture Map

The map below defines ownership. Exact files are confirmed in each child.

### 8.1 `@repo/documentation-domain`

A new domain package is expected to own type-specific Documentation policy:

- Site/Edition lifecycle transitions;
- Page/block validation;
- navigation ordering and acyclic-tree validation;
- slug, alias, redirect, and `gone` policy;
- constrained content/block policy;
- snippet ownership/reference policy;
- OpenAPI source acceptance policy;
- checkpoint/revision completeness policy;
- comment anchoring and resolution policy;
- import/package semantic validation;
- Carry-Forward semantic policy;
- search-document safe-field policy;
- Documentation-specific typed errors.

It must not own:

- PostgreSQL queries;
- Fastify request/reply objects;
- React components;
- Tiptap or Fumadocs framework objects;
- Project Membership resolution;
- Audit/Access persistence;
- physical File storage;
- link password hashing/session cookies;
- generic Publish Link policy already owned by `@repo/publish-domain`.

The package should be created only when child `132` has real policy and tests to
place in it. Do not create empty architectural folders.

### 8.2 `@repo/constants`

Expected Documentation constants may include:

- lifecycle values;
- supported block kinds;
- comment status values;
- import/export format versions;
- supported OpenAPI media/version values;
- search field names only where cross-boundary stability is required;
- bounded public protocol allowlists;
- stable error or action names only when already shared.

Constants must pass the existing reuse/public-contract/drift-risk gate. Database
table names and UI display copy remain local by default.

### 8.3 `@repo/types`

Expected shared Zod contracts:

- Site/Edition list/detail/mutation contracts;
- Page/navigation/block mutation contracts;
- Row Version mutation envelopes and conflict responses;
- comment/thread/reply contracts;
- OpenAPI inspection/upload/reference contracts;
- checkpoint/Revision/Publication contracts;
- Publish Link Documentation-family contracts;
- public reader/navigation/search contracts;
- import inspection/apply and export manifest contracts;
- Carry-Forward/lifecycle contracts;
- review/approval contracts;
- browser-direct Try It configuration contracts.

Route-only persistence types and internal database records remain server-local.
React props remain web-local.

### 8.4 `@repo/publish-domain`

Expected extensions:

- recognize Documentation Site as another publishable family without collapsing
  type-specific Revision content;
- validate Documentation Publish Link manifest entries;
- preserve link-wide access, default entry, ordering, rollback, revocation, and
  password-session rules;
- keep public resolution fail closed;
- share common preparation/switch invariants while delegating Site Revision
  materialization to Documentation-specific code.

The existing Guide/Demo policies and tests must remain green.

### 8.5 `@repo/file-domain`

Expected reuse/extension:

- Documentation Asset metadata and allowlists;
- Markdown/ZIP/OpenAPI upload limits;
- protected-reference policy hooks;
- safe filename/media/protocol rules;
- no assumption that a public URL is authoritative storage.

Physical storage remains an `apps/server` adapter concern.

### 8.6 `@repo/audit-domain`

Expected reuse/extension:

- typed Documentation entity/action coverage;
- sensitive-field rules that exclude comment bodies, raw Page bodies, raw
  search queries, credentials, and uploaded source content from evidence;
- allowed typed before/after scalar summaries;
- Access Evidence resource/action/outcome coverage.

### 8.7 `apps/server`

Anticipated modules:

- `documentation-site`
- `documentation-page`
- `documentation-comment`
- `documentation-openapi`
- `documentation-revision`
- `documentation-publication` or a deliberate Documentation adapter inside
  `publish`
- `documentation-search`
- `documentation-import-export`
- `documentation-carry-forward`
- `documentation-review`

Children may combine modules where cohesion is stronger, but they must preserve
route/service/repository/audit separation and avoid a single untestable
Documentation mega-service.

Server responsibilities:

- authentication and request validation;
- Organization/Project/Project Version resolution;
- Project Membership authorization;
- transaction and locking boundaries;
- relational repositories;
- File storage;
- Tiptap/Fumadocs-independent serialized contracts;
- bounded Markdown/ZIP/OpenAPI parsing;
- search projection construction;
- Revision and Publication preparation;
- link switching/rollback;
- audit/access evidence;
- error-to-HTTP mapping;
- idempotency and retry behavior;
- operational limits.

### 8.8 `apps/web`

Anticipated feature boundaries:

- Documentation Site library/list;
- Site workbench;
- Page editor and Navigation editor;
- private comment surface;
- OpenAPI source/reference surface;
- authenticated draft preview;
- Site Revision history/preview;
- Publication/Publish Link management;
- exact-publication public reader;
- public and internal search;
- import/export;
- Carry-Forward/lifecycle;
- review/approval;
- browser-direct Try It.

The portal owns interaction and rendering, not domain authority. Client checks
improve UX but never replace server authorization or validation.

### 8.9 `apps/docs`

`apps/docs` remains contributor/operator documentation. It may document:

- deployment and configuration;
- Documentation limits and security posture;
- import/export format;
- public URL/operator behavior;
- troubleshooting and backup/restore implications.

It must not become the customer-authored Documentation reader or share customer
content state.

### 8.10 `apps/extension`

The browser extension is outside Documentation V1 implementation unless a child
proves a narrow link or capture-asset handoff is required. It must not gain
Documentation authoring, comments, or publication responsibilities by default.

### 8.11 Portal Information Architecture And Design

Child `132` introduces Documentation to operational navigation only when its
authorized list/workbench route exists. No placeholder or dead navigation item
may ship earlier.

Expected hierarchy:

```text
Project Workspace
  -> selected Project Version
    -> Documentation
      -> Site library
        -> Site workbench
          -> Navigation/Page tree
          -> active Page editor
          -> contextual inspector/comments
          -> preview/history/publish controls
```

Rules:

- preserve the Quiet Versioned Workbench direction established by children
  `121` through `129`;
- keep Project and Project Version context visible;
- distinguish Site identity from Site Edition context;
- use shared `@repo/ui` primitives and semantic tokens before adding local
  primitives;
- CSS Modules remain allowed for feature layout;
- do not hide required actions behind hover-only affordances;
- provide keyboard alternatives for drag/reorder;
- provide truthful save/conflict/publish/review status;
- keep comments private and visually separate from public Page content;
- make draft, Revision, and Publication contexts unmistakable;
- public reader removes authoring chrome but retains accessible version and
  canonical navigation;
- no framework adoption may force a product-wide route or design-system rewrite;
- responsive layouts must preserve authoring controls at narrow widths rather
  than silently removing them.

Representative desktop Site workbench:

```text
+-------------------------------------------------------------+
| Project / Version / Documentation Site          Preview ... |
+--------------------+-----------------------------+-----------+
| Navigation/Pages   | Active Page editor          | Context   |
|                    |                             | comments  |
| groups/pages       | constrained content         | settings  |
| add/reorder        | autosave/conflict state     | outline   |
+--------------------+-----------------------------+-----------+
```

At narrow widths, these regions become explicit navigable modes/drawers with
focus return and no loss of functionality.

## 9. Persistence And Schema Strategy

### 9.1 Schema Ownership

The target expects a new `documentation_schema` for Documentation-owned state.

Expected families:

- Documentation Site;
- Site Edition;
- Site Working Draft;
- Documentation Page;
- Page block/content relationships;
- Navigation node/group;
- Page slug alias;
- redirect/`gone` rule;
- Documentation Asset reference;
- OpenAPI Source metadata/reference;
- private comment thread/reply/mention/anchor;
- Site Revision and immutable Revision-owned snapshots;
- import/export inspection/application records where durable state is required;
- Carry-Forward provenance;
- review workflow state;
- derived search projection metadata where relational persistence is chosen.

`publish_schema` continues to own:

- a type-specific immutable `site_publication` family referencing one exact
  `documentation_schema.site_revision`;
- stable Publish Links;
- selected version entries;
- public password sessions;
- publication switching and rollback constraints.

Child `132` owns exact column/index/constraint names, but it must not represent a
Site Publication as a Guide/Demo `published_artifact`. Existing Publish Link and
entry tables may be extended for the Documentation Site family only with
explicit type-specific Site/Edition/Publication columns, mutually exclusive
family checks, same-Project/Organization/Project Version foreign keys, and
unchanged Guide/Demo constraints. A separate type-specific link-entry table is
also acceptable if it preserves one common Publish Link policy and public
resolution contract without nullable-family ambiguity. This is a physical
layout choice, not permission to change the accepted Publish Link semantics.

### 9.2 Relational Requirement

Core Documentation state must not be persisted as:

- a Tiptap/ProseMirror JSON document;
- Fumadocs configuration JSON;
- MDX source;
- an opaque Markdown blob as the only domain state;
- a generic Page metadata JSONB field;
- a generic Site snapshot JSONB manifest;
- an untyped audit payload.

JSON may be used only where already allowed for configuration/interchange or
transient parser representation, never to hide core state that requires
relational ownership, constraints, authorization, diffing, or migration.

### 9.3 Tenant And Parent Scope

Every Documentation-owned record must carry or be constrained through:

- Organization;
- Project;
- Site or Site Edition parent;
- Project Version where Edition/snapshot semantics require it.

Foreign keys and unique constraints must prevent:

- cross-Organization references;
- cross-Project references;
- Site Edition/Project Version mismatches;
- cross-Edition Page/navigation/snippet references;
- cross-Site Publication/Publish Link entries;
- unauthorized Capture/Derived Asset reuse;
- comment mentions of non-members;
- Revision references to mutable rows without immutable snapshot ownership.

Application checks supplement database constraints; they do not replace them.

### 9.4 Row Versions

Mutable root and child records must use explicit optimistic concurrency:

- server-owned positive Row Version;
- expected Row Version in mutation requests;
- atomic compare-and-increment;
- no last-write-wins fallback;
- conflict response containing enough latest safe server state to recover;
- local unsaved content preserved by the client;
- audit evidence records before/after Row Version without copying sensitive
  content.

### 9.5 Immutable Guards

Site Revision and Site Publication tables require:

- `UPDATE` rejection;
- `DELETE` rejection;
- `TRUNCATE` rejection;
- controlled maintenance bypass consistent with existing audit architecture;
- runtime-role grants that cannot bypass guards;
- database integration tests proving immutability;
- protected File reference enforcement.

### 9.6 Search Projections

Search state is derived and rebuildable. If stored relationally, it must:

- identify exact Site Revision/Site Publication;
- never mix draft and public projections;
- include explicit Organization/Project/Site/Edition/Publication scope;
- exclude comments and private review state;
- use safe extracted text fields;
- support deterministic rebuild;
- be removable/rebuildable without changing Publication identity;
- never become the authoritative Page representation.

## 10. Migration Policy

### 10.1 Sequence

- Documentation migrations begin at `025`.
- Do not edit migrations `001` through `024`.
- Every child owning schema change receives a new forward/down migration.
- Child plans must name expected migration numbers after inspecting the current
  migration directory; they must not reserve filenames blindly if another
  scoped migration has landed.

### 10.2 Upgrade And Clean Install

Every migration child must prove:

- clean application from `001` through the new latest migration;
- upgrade from the current predecessor;
- focused down/up rehearsal where the migrator supports it;
- clean status after verification;
- runtime-role grant behavior;
- audit/immutable guards;
- reset/reseed behavior;
- V1 smoke compatibility.

### 10.3 Existing Data

There is no legacy Product Documentation data to backfill.

Existing Guide/Demo/Publish Link data must not be reset merely to simplify
Documentation implementation unless the child explicitly proves the
repository's accepted pre-live reset policy still permits it and documents the
impact. Prefer additive, compatibility-preserving migrations.

### 10.4 Rollback

Migration rollback is not the same as publication rollback.

- migration rollback restores schema compatibility during development;
- publication rollback repoints a stable link to an older immutable Site
  Publication;
- rollback never mutates a Site Revision or Site Publication;
- failed publication preparation never requires a database migration rollback.

## 11. API And Route Invariants

Exact syntax belongs to child `132`, but these semantics are fixed.

### 11.1 Authenticated API

Authenticated route families must make Project Version and Site/Edition context
unambiguous for:

- Site list/create/detail;
- Site Edition detail/settings/lifecycle;
- Page CRUD/order/content;
- Navigation Tree mutations;
- alias/redirect validation;
- comments/replies/mentions/resolve/reopen;
- OpenAPI inspect/upload/reference;
- preview;
- manual checkpoint and Revision history;
- Publication and Publish Link management;
- internal search;
- import/export;
- Carry-Forward;
- review workflow;
- Try It configuration.

Candidate convention:

```text
/api/v1/projects/:project_id/versions/:version_slug/documentation-sites
/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id
```

Children may use stable Edition IDs in subordinate routes, but version context
must remain visible or mechanically enforced. No ambiguous versionless
authoring fallback may become the canonical route.

### 11.2 Public API

Public resolution continues through Publish Link identity:

```text
/api/v1/public/publish-links/:slug
/api/v1/public/publish-links/:slug/versions/:version_slug
```

Documentation-specific subordinate routes may provide:

- exact-publication Page/navigation data;
- public search;
- authorized protected assets;
- API operation destinations;
- sitemap/robots/social metadata.

Every response must be derived from the exact configured Site Publication.
Public routes must never resolve a Site Working Draft or silently choose the
newest Site Publication.

### 11.3 Portal URLs

Candidate canonical authenticated family:

```text
/projects/:project_id/versions/:version_slug/documentation
/projects/:project_id/versions/:version_slug/documentation/:site_id
/projects/:project_id/versions/:version_slug/documentation/:site_id/pages/:page_id
/projects/:project_id/versions/:version_slug/documentation/:site_id/preview
/projects/:project_id/versions/:version_slug/documentation/:site_id/revisions/:revision_number
/projects/:project_id/versions/:version_slug/documentation/:site_id/publications/:publication_sequence
```

The local route registry, guards, metadata, breadcrumbs, navigation, and legacy
redirect behavior must be updated together.

### 11.4 Public Browser URLs

The public reader must provide:

- stable Publish Link entry;
- explicit Project Version path;
- canonical Page path;
- exact immutable Publication resolution;
- permanent former-slug redirects;
- intentional `gone` outcome;
- direct OpenAPI operation destinations;
- canonical metadata and sitemap entries;
- no moving `/latest`.

Candidate accepted public family:

```text
/docs/:publish_link_slug
/docs/:publish_link_slug/:page_path
/docs/:publish_link_slug/versions/:project_version_slug
/docs/:publish_link_slug/versions/:project_version_slug/:page_path
```

The `versions` system segment and other reserved first segments cannot be
assigned as conflicting Page roots.

The Publish Link slug is globally unique, immutable, opaque, and never reused.
Canonical Page paths, Page aliases, and redirect rules come only from the exact
Site Publication selected by the link entry. Canonicalization never consults a
newer Site Publication or the Site Working Draft. Redirects preserve only safe
query/fragment values and target trusted internal identities, never arbitrary
outside URLs.

When a user explicitly switches Project Versions from a Page:

1. try the same canonical Page path in the selected target entry;
2. try the target Site Publication's frozen Page aliases;
3. otherwise open that target Edition's frozen Home Page and announce that the
   prior Page is unavailable in the selected Project Version.

A direct request for a missing Page returns the normal non-revealing not-found
state; it does not silently use the Home Page fallback.

Immutable Site Publications do not automatically receive permanent public
historical URLs. Public access exists only through an active Publish Link entry.
Authenticated Project Members may inspect exact Site Publication history.

Documentation embeds and protected File routes use the same Publish Link,
Project Version, exact Site Publication, and access policy. They never receive a
weaker or versionless authorization path.

Exact public path syntax must preserve existing Guide/Demo public and embed
behavior.

### 11.5 Error Contract

Every child must define typed, testable errors for applicable cases:

- not found without tenant/resource disclosure;
- unauthenticated;
- forbidden;
- archived/read-only;
- Row Version conflict;
- duplicate slug/alias;
- invalid navigation cycle/order;
- broken internal link;
- invalid redirect cycle;
- unsafe content/protocol;
- invalid/oversized OpenAPI;
- invalid/oversized ZIP;
- quota exceeded;
- publication busy;
- publication preparation failed;
- invalid rollback target;
- protected asset purge;
- unsupported import/package version;
- review/approval stale state;
- Try It disallowed origin/credential/response.

Error copy must be actionable for authorized users and non-enumerating for
unauthorized consumers.

## 12. Authorization And Permission Model

### 12.1 Internal Access

Product Documentation inherits Project Membership:

- Organization Owner: implicit Project Admin.
- Project Admin: Site/Edition structure, lifecycle, membership-adjacent
  configuration, quotas where delegated, authoring, comments, review, publish.
- Project Editor: author Pages/navigation/comments, checkpoint, Carry-Forward,
  and publish, except administrative controls reserved by a child.
- Project Viewer: read authorized internal Site state, Revision history, and
  previews as accepted; no mutation.

Child `132` must settle exact comment mutation capability within these accepted
roles without inventing Page-level ACLs.

### 12.2 Public Access

- outside access uses stable Publish Link policy;
- one policy applies across all selected Site Publications in the link;
- public/password/restricted behavior must reuse the accepted existing policy
  family;
- revoked/expired/restricted links fail closed;
- password/session behavior remains link-wide;
- no public draft preview token is introduced in the first slice;
- comments and review state are never public.

### 12.3 Authorization Order

Authorization occurs before:

- resource detail return;
- Page body load;
- comment/thread load;
- OpenAPI source return;
- File delivery;
- cache lookup that could cross access context;
- search indexing;
- search result return;
- Revision/Publication content return;
- import inspection result reuse;
- export generation;
- Carry-Forward;
- Try It configuration return.

## 13. Audit And Access Evidence

### 13.1 Audit Coverage

Every committed state change produces one logical Audit Event in the same
transaction with explicit Change Items.

Expected actions include:

- Site create/update/archive/restore;
- Edition create/update/archive/restore;
- Page create/update/reorder/archive/restore;
- Page slug/alias/redirect changes;
- Navigation changes;
- snippet changes;
- asset attach/detach/archive/purge attempt;
- OpenAPI inspect/apply/update/archive;
- comment/thread/reply/mention/resolve/reopen;
- checkpoint/Revision creation or reuse;
- Publication preparation/success;
- Publish Link create/update/entry switch/rollback/revoke;
- import apply;
- Carry-Forward;
- review request/approval/rejection/override;
- quota/configuration changes.

Failed attempts do not create mutation Audit Events. They may produce Access
Evidence or operational logs according to existing policy.

### 13.2 Sensitive Data

Audit/Access Evidence must not contain:

- Page or snippet body;
- comment/reply body;
- uploaded Markdown/ZIP/OpenAPI contents;
- raw search query;
- API request/response body from Try It;
- API credentials or authorization headers;
- password;
- public viewer token;
- protected File content;
- private external URL.

Use typed scalar summaries such as entity IDs, action, block kind, counts,
status, Row Version, reason, and safe label where policy permits.

### 13.3 Access Coverage

Meaningful reads/attempts include:

- authenticated draft/preview/Revision access;
- public Page and Site Publication access;
- public/internal search;
- protected File download;
- export;
- import inspection;
- review history;
- comment thread view where policy requires;
- OpenAPI reference access;
- Try It attempt outcome without request secrets/content.

Static subresource noise must not overwhelm evidence.

## 14. Source Of Truth And Adapter Boundaries

### 14.1 Authority

Authoritative:

- PostgreSQL relational state;
- protected File storage;
- immutable Site Revision records;
- immutable Site Publication records;
- stable Publish Link selection state;
- Project Membership and access policy;
- Audit/Access Evidence.

Derived:

- Tiptap editor state;
- Fumadocs page tree;
- rendered reader output;
- search indexes;
- caches;
- sitemap/robots/social metadata;
- code examples;
- export archives.

Interchange:

- safe Markdown;
- validated versioned Site ZIP;
- self-contained OpenAPI JSON/YAML.

### 14.2 Tiptap

Tiptap may own:

- transient in-browser editing interactions;
- selection/focus/input mechanics;
- accessible command integration;
- mapping between editor state and Ossie commands.

Ossie owns:

- allowed block types;
- relational content;
- validation;
- serialization;
- sanitization;
- Row Version;
- comments and stable anchors;
- permissions;
- checkpoint/publication.

Child `132` dependency proof must cover:

- exact compatible versions and licenses;
- bundle/build compatibility;
- controlled block schema;
- deterministic relational round trip;
- safe Markdown round trip for supported content;
- paste sanitization;
- link/media protocol filtering;
- keyboard-only authoring;
- screen-reader names/status;
- focus recovery;
- comments/anchor stability;
- unmount/remount and draft reload;
- large bounded Page behavior;
- reduced motion;
- no persistent framework JSON authority.

### 14.3 Fumadocs

Fumadocs may own selected:

- reader UI primitives;
- navigation rendering;
- already-authorized search presentation/index helpers;
- read-only OpenAPI reference presentation.

Ossie owns:

- authorized exact-Publication loading;
- URLs and canonical/redirect behavior;
- access;
- search scope;
- public File access;
- cache identity;
- publication preparation/switch/rollback;
- audit/access;
- SEO policy;
- adapter interfaces.

Child `132` proof must cover:

- React/Vite and local route-registry integration;
- exact compatible versions/licenses/transitives;
- headless/custom source adapter behavior;
- no assumption that files/Git/MDX are authoritative;
- no server/client authorization bypass;
- exact-Publication cache keying;
- safe content rendering;
- OpenAPI deep links;
- keyboard/screen-reader/reflow behavior;
- bundle/performance effect;
- clean fallback if adoption fails.

## 15. Content And Authoring Rules

### 15.1 First-Slice Block Set

At minimum:

- paragraph;
- heading;
- ordered/unordered list;
- code block;
- safe link;
- image/media reference;
- divider or comparable simple structure;
- read-only API Reference block.

Child `133` completed the remaining V1 constrained content, including
Ossie-owned typed blocks that reference exact authorized Guide/Interactive
Demo Publications. They never resolve a mutable artifact draft, title/slug
guess, or arbitrary iframe.

Child `132` may narrow decorative options. It may not introduce executable
customer components.

### 15.2 Content Safety

- sanitize paste/import;
- allowlist link and media protocols;
- reject script/event-handler content;
- no raw HTML persistence/rendering;
- no arbitrary iframe;
- no remote server-side content fetch in V1;
- prevent dangerous URL normalization bypass;
- apply restrictive public CSP;
- escape code and OpenAPI examples;
- preserve accessible text semantics.

### 15.3 Navigation

- authoritative relational ordered tree;
- stable Page and Group IDs;
- no cycles;
- Pages appear at most once in the tree;
- unlisted Pages allowed;
- deterministic sibling position;
- Page identity separate from slug;
- a Working Draft may be incomplete while authoring, but checkpoint/publication
  requires one valid, included Home Page;
- publication validation detects broken links and redirect cycles;
- former slugs become permanent non-reassignable aliases;
- canonical route remains explicit.

### 15.4 Autosave

- save states are truthful;
- typing continues during save;
- stale response cannot overwrite newer local state;
- conflict preserves local work;
- same-tab competing saves are coordinated;
- retry does not duplicate child rows;
- offline/error is not shown as saved;
- preview distinguishes last server state from unsaved local state.

## 16. Comments And Review Boundary

### 16.1 First Slice

Child `132` includes:

- private Page comment threads;
- replies;
- mentions limited to authorized Project Members;
- resolve/reopen;
- stable block anchor where possible;
- Page fallback if an anchor disappears;
- authorization;
- Row Version/conflict behavior;
- audit without bodies;
- accessible keyboard/screen-reader UI;
- exclusion from Revision/Publication/search/export/public output.

Publishing does not require comment resolution in child `132`.

### 16.2 Later V1

Child `136` adds:

- Review Requests;
- maintainers/reviewers;
- approval/rejection;
- stale approval invalidation;
- notifications/delivery state;
- optional approval gate;
- authorized audited override;
- richer change summaries/history.

The child must define who may request, review, approve, override, cancel, and
publish. It must not make approval mandatory merely because the UI supports it.

### 16.3 Later

- public feedback;
- public comments;
- analytics;
- external reviewer tokens;
- realtime collaboration;
- presence/cursors;
- offline merge.

## 17. OpenAPI And API Experience

### 17.1 First Slice

- upload JSON or YAML File;
- enforce size and parser limits;
- self-contained references only;
- reject arbitrary remote references;
- validate supported OpenAPI versions;
- record relational safe metadata;
- provide inspect/apply behavior where relevant;
- render read-only reference;
- create stable operation destinations;
- include operation destinations in navigation/search/public links;
- never execute an API request.

### 17.2 Portability

Child `134` includes OpenAPI source and safe metadata in the versioned Site
package. Import must not fetch external references.

### 17.3 Browser-Direct Try It

Child `137` may add browser-direct requests only after proving:

- explicit approved origins;
- no Ossie server proxy;
- no persistent credential storage;
- credentials remain ephemeral in browser memory;
- explicit confirmation before sending;
- restricted methods/headers/body/size/time;
- CORS behavior explained accurately;
- CSP/connect-src compatibility;
- safe response size/type/rendering;
- abort and timeout;
- no request/response/credential content in Audit/Access/logs;
- accessible request builder and response state;
- public-link policy controls;
- rate/safety ceilings.

OAuth, credential vault, SDK generation, mock server, and arbitrary interactive
widgets remain out of V1.

## 18. Search Model

### 18.1 Internal Search

- authorized Project-scoped;
- narrowed to the selected Project Version in the first release;
- Documentation only in first Documentation release;
- no Organization-wide/cross-artifact promise;
- indexes the latest server-saved authorized Site Working Draft Page state for
  active Site Editions in that Project Version;
- does not index immutable Revision history by default;
- archived Site/Editions/Pages are excluded from ordinary results and remain
  reachable only through explicit lifecycle/history surfaces;
- never includes private comments in searchable body.

### 18.2 Public Search

- exact Site Publication selected by current Publish Link entry;
- link policy checked first;
- no draft/historical/other-link leakage;
- stable result links use canonical public paths;
- redirect/gone state respected;
- search cache/index keyed by exact Publication and access context.

### 18.3 Search Fields

Allowed safe fields:

- Page title;
- description;
- headings;
- safe body text;
- keywords;
- breadcrumbs;
- primary language;
- Project Version label;
- OpenAPI operation safe metadata.
- safe fallback labels/text for exact embedded Guide/Interactive Demo
  Publications.

Raw query text is not Audit/Access Evidence.

## 19. Publication, Caching, Failure, And Rollback

### 19.1 Publication State Machine

1. Author requests Publication with expected mutable state.
2. Server authorizes Project and Site Edition.
3. Server serializes Publication work for the Site Edition.
4. Complete Working Draft validation runs.
5. Server creates or reuses an exact immutable Site Revision.
6. Reader/search/metadata material is prepared.
7. Immutable Site Publication is created.
8. Only after preparation succeeds, selected Publish Link entry is atomically
   switched.
9. Audit evidence commits with the successful mutation.
10. Derived caches may be populated/rebuilt from exact Publication identity.

### 19.2 Failure

- validation failure creates no Revision unless an explicit manual checkpoint
  already succeeded independently;
- preparation failure leaves the currently live link entry untouched;
- retry is idempotent;
- partial Files/projections are cleaned or safely orphaned for bounded cleanup;
- errors are actionable without leaking private content;
- failed public reads do not fall back to a draft or different Publication.

### 19.3 Rollback

- target must be an older immutable Site Publication for the same Site Edition
  and permitted link entry;
- rollback atomically repoints;
- it creates no new Site Revision/Publication;
- it mutates neither old nor current Publication;
- it records Audit Evidence;
- cache/search selection follows the repointed exact identity.

### 19.4 Caching

Cache keys include:

- Publish Link identity;
- selected version entry;
- exact Site Publication;
- canonical Page/operation identity;
- access-policy context where applicable;
- response representation/language where applicable.

No public cache may be keyed only by Site or Page ID.

Public metadata rules:

- canonical URL identifies the current exact public route;
- public links may produce sitemap, robots, and social metadata;
- restricted/password content is not exposed through an unauthenticated sitemap
  or indexable robots policy;
- aliases redirect to the canonical route;
- intentional `gone` routes do not redirect to unrelated or newest content;
- metadata is derived from exact Site Publication state.

## 20. Import, Export, And Package Portability

Owned by child `134`.

### 20.1 Supported V1 Formats

- one safe Markdown Page;
- one complete versioned Site ZIP package;
- one self-contained OpenAPI JSON/YAML File.

### 20.2 Inspect Then Apply

Import has separate phases:

1. accept bounded upload;
2. inspect without mutation;
3. validate paths, counts, sizes, formats, manifests, relationships, content,
   links, assets, OpenAPI, and package version;
4. return a safe inspection summary;
5. require authorized explicit apply;
6. atomically apply only to a new or empty authorized Working Draft;
7. audit the applied mutation;
8. clean temporary content.

Inspection tokens/results are tenant- and actor-bound, expire, and cannot be
replayed across Projects.

### 20.3 Archive Security

Reject:

- absolute paths;
- `..` traversal;
- symlink/hardlink/device entries;
- duplicate/case-colliding paths;
- decompression bombs;
- excessive file count/depth/expanded bytes;
- unsupported encodings/types;
- manifest/content mismatch;
- unsafe Markdown/HTML/MDX;
- remote OpenAPI references;
- cross-Site identity injection.

### 20.4 Export

- explicit immutable snapshot or clearly labeled current-draft export;
- package schema/version;
- deterministic safe paths;
- manifest with Site/Edition/Revision context;
- no comments/review/private membership/audit/access/credentials;
- protected asset inclusion or reference behavior documented;
- export never changes authority.

## 21. Assets And Protected References

### 21.1 Asset Sources

Documentation may:

- upload edition-owned Documentation Assets;
- reference authorized same-Project Capture Assets;
- reference authorized same-Project Derived/Redacted Assets after the owning
  child proves the selection contract;
- freeze exact File references into Site Revisions.

### 21.2 Protection

A File cannot be physically purged while referenced by:

- Site Working Draft;
- Site Revision;
- Site Publication;
- reusable snippet;
- OpenAPI Source;
- comment attachment if introduced;
- retained import/export state where required;
- existing Guide/Demo protection;
- retained evidence where applicable.

### 21.3 Public Delivery

- exact Publication authorization first;
- safe content type and disposition;
- no filesystem path disclosure;
- cache key scoped to exact Publication/link;
- archived source asset remains resolvable for retained immutable Publication;
- remote media never becomes authoritative publication content.

## 22. Lifecycle And Retention

### 22.1 Archive First

Normal product actions archive rather than permanently delete:

- Site;
- Site Edition;
- Page;
- snippet;
- Documentation Asset;
- OpenAPI Source;
- comment thread where product behavior requires hiding.

### 22.2 Effective Read-Only

- archived Project or Project Version applies existing effective read-only
  semantics;
- archived Site/Edition blocks authoring;
- stored child lifecycle does not need destructive cascading rewrites;
- existing immutable Publications and active Publish Links remain unless
  explicitly revoked;
- restore returns prior behavior where permitted.

### 22.3 Page Archive

- removed from new navigation/search/publication by default;
- existing immutable Publications remain exact;
- new checkpoint/publication requires explicit redirect or `gone` handling for
  former canonical paths where applicable;
- aliases are not reassigned.

### 22.4 Retention

- immutable Revisions/Publications retained;
- Audit/Access retained under existing policy;
- protected Files retained;
- export is separate from deletion;
- automatic cleanup/permanent deletion is outside V1;
- Organization/Project governed deletion requires a future dedicated decision.

## 23. Operational Limits And Quotas

### 23.1 Product Quotas

- owned by Organization;
- nullable means unlimited product quota;
- no Project-specific quota in V1;
- updates require authorized administrative action and Audit Evidence;
- usage/limit errors are actionable.

Potential dimensions:

- Sites;
- Pages per Site/Edition;
- blocks per Page;
- Page text bytes;
- snippets;
- assets/files/bytes;
- OpenAPI sources/bytes/operations;
- import archive compressed/expanded bytes/files/depth;
- comments/replies;
- search query length/results;
- simultaneous publication work;
- publication duration/material size.

### 23.2 Hard Safety Ceilings

Even unlimited Organizations remain bounded by operator-configured,
non-bypassable ceilings protecting memory, CPU, storage, parser time, and
availability.

Child `132` defines first-slice ceilings. Child `138` completes operator
configuration, health reporting, and usage visibility.

## 24. Accessibility, Motion, Responsive, And Performance

### 24.1 Accessibility

Authoring and reader target WCAG 2.2 AA:

- keyboard-only workflows;
- visible and unobscured focus;
- correct names/descriptions/status announcements;
- semantic headings/landmarks;
- accessible navigation tree;
- accessible editor commands;
- comment/review semantics;
- code/table/OpenAPI semantics;
- non-color-only state;
- pointer target sizing;
- alternatives to dragging;
- 200% zoom and 320 CSS-pixel reflow;
- accessible password/restricted-link flows;
- author guidance for headings, links, alt text, and tables.

Automated checks supplement, not replace, manual keyboard and screen-reader
evidence.

### 24.2 Motion

- reduced-motion preference respected;
- no essential information conveyed only by animation;
- transitions do not delay authoring;
- no forced smooth scrolling;
- focus movement remains deterministic.

### 24.3 Performance

Public reader target at p75:

- LCP ≤ 2.5 seconds;
- INP ≤ 200 milliseconds;
- CLS ≤ 0.1.

Authoring:

- typing/common commands remain immediately responsive;
- save does not block continued editing;
- bounded/virtualized navigation and OpenAPI where measurement requires it;
- Publication shows truthful progress;
- representative small and upper-bound fixtures;
- no hidden all-content rendering merely for search/navigation.

### 24.4 Browser Evidence

Applicable children use agent-browser with synthetic fixtures and safe local
URLs. Evidence covers:

- desktop;
- narrow mobile;
- keyboard;
- zoom/reflow;
- reduced motion;
- loading/empty/error/permission/conflict states;
- failed requests;
- console errors;
- exact public and authenticated access;
- publication failure/rollback;
- comment privacy;
- OpenAPI deep links;
- Try It safety when implemented.

## 25. Security And Threat Model

Master-wide required controls:

| Threat                          | Required control                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Cross-tenant ID substitution    | Server-side Organization/Project parent resolution, scoped foreign keys, authorization before load, fail-closed errors. |
| Stored XSS                      | No executable content; constrained blocks; sanitization; protocol allowlist; restrictive CSP; escaping tests.           |
| SSRF                            | No arbitrary server-side remote import/proxy; self-contained uploaded OpenAPI; constrained remote media.                |
| ZIP traversal/bomb              | Inspect before apply; reject unsafe entries; size/count/depth/expansion ceilings; atomic apply.                         |
| Malicious OpenAPI               | Bounded parsing; no unresolved remote references; cycle/depth/size checks; read-only first slice.                       |
| Draft/comment leakage           | Separate private/public projections; authorize before load/cache/index; comments excluded from immutable/public state.  |
| Search leakage                  | Permission filtering before indexing and results; exact Publication scope; access-context cache keys.                   |
| Partial publication             | Prepare before atomic switch; idempotent retry; live pointer unchanged on failure.                                      |
| Asset purge breakage            | Reference protection across mutable and immutable state.                                                                |
| Credential exposure             | No stored Try It/Git credentials; redact headers/tokens; no proxy.                                                      |
| Dependency lock-in/supply chain | Exact reviewed pins; license/transitive review; adapters; lockfile; upgrade tests.                                      |
| Denial of service               | Quotas plus hard ceilings; serialized publication; bounded parsers/search/results.                                      |
| Cache confusion                 | Exact Publication/link/policy keys and explicit invalidation.                                                           |
| Comment mention abuse           | Authorized member validation, limits, privacy, safe notification payloads.                                              |
| Stale approval                  | Approval tied to exact Revision/draft state; invalidate on relevant changes.                                            |
| Public route enumeration        | Non-enumerating errors, rate limits, Access Evidence, stable opaque IDs/slugs.                                          |

Each child must select the applicable rows, add focused tests, and document any
new threat introduced by its scope.

## 26. Concurrency, Idempotency, And Transactions

### 26.1 Mutable Commands

- expected Row Version;
- single transaction;
- parent/lifecycle lock as needed;
- atomic audit;
- typed conflict;
- idempotency key for retriable multi-record operations;
- no partial child updates.

### 26.2 Multi-Record Operations

Atomic:

- Navigation reorder/tree changes;
- import apply;
- checkpoint Revision construction;
- Publication record and link switch where preparation permits;
- Publish Link manifest replacement;
- Carry-Forward;
- review decision and publication override.

### 26.3 Publication Concurrency

- serialize per Site Edition;
- concurrent duplicate request is idempotent or returns a typed busy/conflict
  outcome;
- sequence numbers never reused;
- unrelated Sites may publish independently within operational limits.

### 26.4 Client Recovery

- preserve local Page content;
- show latest safe server state;
- allow deliberate reload/copy/retry;
- never silently merge;
- comments and Navigation conflicts handled separately from Page body;
- cross-tab/realtime collaboration remains deferred.

## 27. Testing Strategy

### 27.1 TDD

Behavior changes follow red-green-refactor:

1. focused domain/contract test fails;
2. smallest policy/implementation passes;
3. refactor with focused tests green;
4. add repository/route/UI integration proof;
5. run child regression matrix.

### 27.2 Package Tests

Expected:

- Documentation policies/errors;
- shared Zod schemas;
- publish-family policy compatibility;
- file/upload/import safety;
- audit sensitive-field policy;
- deterministic serialization.

### 27.3 Server Unit And Route Tests

Expected:

- auth/permission matrix;
- validation and typed errors;
- Row Version conflicts;
- idempotency;
- transaction rollback;
- audit/access coverage registration;
- parser/limit failures;
- public fail-closed behavior;
- exact Publication resolution;
- cache/search scope.

### 27.4 DB Integration

Expected:

- migration constraints;
- tenant isolation;
- same-Project parent constraints;
- uniqueness/order constraints;
- Row Version updates;
- atomic audit;
- immutable guards;
- protected File guards;
- checkpoint completeness;
- Publication sequence/link switch/rollback;
- Carry-Forward;
- archive behavior;
- search projection isolation.

### 27.5 Web Component Tests

Expected:

- route parsing/guards/metadata/navigation;
- permission-driven controls;
- loading/empty/error/conflict;
- editor serialization and autosave;
- comments/anchors;
- Navigation keyboard behavior;
- OpenAPI reference;
- public exact Publication;
- search;
- publishing/rollback;
- import inspection;
- review;
- Try It.

### 27.6 Smoke Tests

The V1 smoke flow must eventually include:

1. create Organization owner/project/default Project Version;
2. create Documentation Site/Edition;
3. author two Pages/navigation/internal link;
4. add/resolve private comment;
5. add self-contained OpenAPI/reference block;
6. checkpoint/publish;
7. resolve public exact Publication/search;
8. mutate draft and prove first Publication unchanged;
9. publish second;
10. rollback;
11. verify Guide/Demo workflows still pass.

### 27.7 Broad Verification

Every implementation child records applicable:

```bash
pnpm -r --if-present test
pnpm check-types
pnpm lint
pnpm build
git diff --check
```

Database tests run separately with configured PostgreSQL:

```bash
pnpm --filter server test:db
pnpm --filter server test:smoke
```

Commands are examples. Expanded children must use current package scripts and
record unavailable capability honestly.

## 28. Child Plan Sequence And Dependencies

Execution is sequential. A child starts only after its predecessor is
implemented, rechecked, documented, and committed.

```text
131 accepted Documentation decisions
  -> Master 006 accepted
    -> 132 first vertical slice
      -> 133 content/snippets/assets
        -> 134 import/export/portability
          -> 135 Carry-Forward/multi-Site/lifecycle
            -> 136 review/approval
              -> 137 API Try It/examples
                -> 138 V1 operational hardening
                  -> 139 V1 final closeout
                    -> 140 post-V1 decision gate
```

No parallel child implementation is assumed. Later children may be planned
early for visibility but must be re-expanded against the actual predecessor
result.

## 29. Child 132: Documentation Site First Vertical Slice

### Goal

Prove the accepted model end to end with the least irreversible complexity.

### Required user journey

1. Create one Documentation Site in one Project.
2. Create its Site Edition for one Project Version with one primary standard
   language tag.
3. Author two safe Pages with stable identities.
4. Add Navigation, stable slugs, one permanent alias/redirect or equivalent
   canonical-route proof, one internal Page link, and required `gone` validation
   behavior.
5. Upload/inspect/validate one self-contained OpenAPI File.
6. Add one read-only API Reference block and operation destinations.
7. Autosave Pages independently with Row Version conflict protection.
8. Add and resolve one private Page comment.
9. Preview the complete Site Working Draft.
10. Create one immutable Site Revision.
11. Publish through the accepted stable Publish Link model.
12. Read the exact public Site Publication with Navigation, search, Page links,
    direct API operation links, canonical metadata, sitemap, robots policy, and
    social metadata.
13. Mutate the Working Draft and prove Publication one remains unchanged.
14. Create/expose Publication two.
15. Roll the link entry back to Publication one without rebuilding or mutating
    either Publication.

### Required foundations

- additive migration beginning at current next number;
- `@repo/documentation-domain`;
- shared constants/contracts after reuse gate;
- Tiptap proof;
- Fumadocs proof;
- server modules/repositories/routes/audit/access;
- portal routes/navigation/library/editor/comments/preview;
- public reader/search/metadata;
- publication/link integration;
- synthetic browser fixture;
- DB/smoke/browser evidence.

### Strict non-scope

- reusable snippet authoring beyond any minimum proof helper;
- full ZIP import/export;
- Carry-Forward;
- formal review/approval;
- API request execution;
- translation/custom domain/public feedback;
- permanent deletion;
- realtime collaboration.

### Internal implementation stages

Child `132` may organize work and commits as:

1. contracts/domain/dependency proofs;
2. relational schema and authorized API;
3. Site/Page/navigation editor and comments;
4. OpenAPI and preview;
5. Revision/Publication/Publish Link;
6. public reader/search/SEO;
7. failure/immutability/rollback;
8. accessibility/performance/browser/DB/smoke closure.

The child remains incomplete until the full journey passes.

### Exit gate

- all 15 steps pass with database and browser evidence;
- tenant isolation and role matrix pass;
- immutable and protected-reference guards pass;
- public search/content contains no comments/drafts;
- failed publish preserves live Publication;
- existing Guide/Demo/public/embed tests remain green;
- plan status/log/checklist/evidence/leftovers/handoff complete.

## 30. Child 133: Documentation Content, Snippets, And Asset Workflows

### Goal

Deepen the proven editor without changing the first-slice authority model.

### Scope

- complete V1 constrained Page block set;
- edition-owned reusable snippets;
- snippet insertion/reference/update semantics;
- no live cross-Site/Edition sharing;
- exact authorized Guide/Interactive Demo Publication reference blocks;
- Documentation Asset library/upload/select/archive;
- authorized same-Project Capture Asset reuse and an explicit unsupported seam
  for a future owning Derived/Redacted Asset domain;
- protected reference accounting;
- media accessibility metadata;
- authoring validation and ergonomics;
- content-size/asset-count product limits;
- expanded revision snapshot coverage.

### Security

- safe media/protocol/type checks;
- no executable blocks;
- no mutable or title/slug-guessed Guide/Demo embed target;
- protected File delivery;
- no cross-Project asset IDs;
- no reference removal that breaks immutable output.

### Exit gate

- snippets/assets round-trip through draft/checkpoint/publication;
- independent Edition behavior proven;
- purge/archive protection proven;
- accessibility/browser evidence;
- child `134` receives stable packageable content contracts.

## 31. Child 134: Documentation Import, Export, And Package Portability

### Goal

Provide safe, deterministic interchange without creating a second authority.

### Scope

- safe single-Page Markdown import/export;
- versioned whole-Site ZIP package;
- self-contained OpenAPI JSON/YAML import/export;
- inspect/apply API and UI;
- package schema/version/migrations;
- deterministic export;
- new/empty Working Draft apply restriction;
- atomic apply/idempotency;
- temporary File cleanup;
- quotas/hard archive ceilings;
- documentation for format and compatibility.

### Security

- traversal/link/bomb/duplicate/case collision defenses;
- parser bounds;
- content sanitization;
- tenant/actor-bound inspection;
- no remote fetch;
- no existing populated Site merge;
- no automatic publish/checkpoint.

### Exit gate

- malicious archives rejected without mutation;
- valid package round trip passes;
- export excludes private/evidence/credential state;
- old supported package version behavior documented;
- child `135` can carry forward every portable owned structure.

## 32. Child 135: Documentation Carry-Forward, Multi-Site, And Lifecycle

### Goal

Make Documentation correctly version-aware and manageable across Project
Versions.

### Scope

- multiple Sites in one Project;
- one Edition per Site/Project Version constraint;
- whole-Site Carry-Forward from exact Revision;
- source/target selection;
- independent copied Pages/navigation/snippets/settings;
- protected File reuse;
- atomic/idempotent/no-overwrite behavior;
- immediate source provenance;
- Site/Edition/Page/OpenAPI/asset archive/restore;
- canonical alias/redirect/`gone` lifecycle;
- archived Project/Project Version effective read-only;
- retained Publication/Publish Link behavior;
- library/selector/search lifecycle behavior.

### Exit gate

- cross-Version end-to-end browser/DB proof;
- later source/target edits independent;
- retry creates no duplicates;
- failure creates no partial target;
- archived immutable output remains exact;
- child `136` receives stable Edition/Revision review targets.

## 33. Child 136: Documentation Review And Approval Workflow

### Goal

Build formal internal review on the stable private comments foundation.

### Scope

- Review Request identity/lifecycle;
- maintainer/reviewer assignment;
- approval/rejection;
- stale approval invalidation;
- notifications/delivery state;
- optional approval-before-Publication Site policy;
- authorized audited override with reason;
- change summary/history UI;
- review filters/inbox;
- accessibility/privacy/retention.

### Decisions child must make within accepted boundary

- exact role/capability matrix;
- approval count/maintainer rule if any;
- which draft changes stale approval;
- notification transport available in current repository;
- override visibility;
- archive/cancel behavior.

The child must stop for user decision if it proposes mandatory approval by
default or external reviewers.

### Exit gate

- comments remain private and separate;
- Publication gate is optional and deterministic;
- stale approval cannot authorize changed content;
- override is authorized/audited;
- no notification leaks content;
- child `137` receives stable public policy configuration.

## 34. Child 137: Documentation API Try-It And Example Experience

### Goal

Add safe browser-direct API exploration without turning Ossie into a proxy or
credential store.

### Scope

- approved-origin configuration;
- browser-memory credential input;
- request builder for accepted methods/content;
- explicit send confirmation;
- CORS/preflight guidance;
- abort/timeout;
- response size/type/render safety;
- safe code/example expansion;
- public-link policy control;
- CSP/connect-src;
- quotas/rate/safety limits;
- audit/access privacy;
- accessibility/browser proof.

### Non-scope

- server proxy;
- stored credentials;
- OAuth broker;
- SDK generation;
- arbitrary JavaScript;
- mock server;
- backend secret injection.

### Exit gate

- requests go browser-to-approved-origin only;
- secrets absent from server/evidence/logs;
- disallowed origin/method/header/response fails safely;
- no impact on read-only reference when Try It disabled;
- child `138` receives operational metrics/limits.

## 35. Child 138: Documentation V1 Operational Hardening

### Goal

Complete material V1 reliability, security, accessibility, performance, search,
SEO, and operator behavior before certification.

### Scope

- Organization quota settings and usage;
- hard operator safety ceilings;
- publication scheduling/concurrency/timeouts;
- cache/invalidation/rebuild;
- search rebuild/isolation/ranking;
- metadata/canonical/sitemap/robots/social output;
- access policy hardening;
- archive/retention consistency;
- migration/upgrade/reset/reseed;
- backup/restore operator implications;
- health/readiness/reporting;
- dependency/version/license recheck;
- WCAG/manual accessibility;
- Core Web Vitals/editor performance;
- browser matrices and failure injection;
- active security threat-model closure.

### Exit gate

- no open S1/S2 Documentation issue;
- representative upper-bound fixtures pass or limits fail safely;
- exact Publication recovery/rebuild works;
- no cross-tenant/search/cache leak;
- performance/accessibility targets recorded;
- operator docs truthful;
- child `139` receives a stable implementation, not unfinished features.

## 36. Child 139: Documentation V1 Final Closeout

### Goal

Audit the whole Documentation implementation and existing product before
declaring V1 complete.

### Review baseline

- child `131` grill and final ledger;
- `CONTEXT.md`;
- ADRs `0021` through `0030` plus any accepted implementation ADR;
- Master Plan `006`;
- children `132` through `138`;
- current code/schema/contracts/routes/tests/docs;
- Guide/Demo/Capture/extension/public compatibility.

### Required closure

- behavior-to-plan audit;
- schema/type/API/UI/docs coverage;
- security/permission/migration/backward-compatibility audit;
- status/checklist/log/evidence/leftover completeness for every child;
- full clean migration/DB/smoke/workspace/build matrix;
- authenticated/public/browser/accessibility/responsive/motion/performance
  dogfood;
- tenant isolation and public leakage audit;
- dependency/license/lockfile audit;
- active documentation truth update;
- unrelated-diff/commit ownership audit;
- leftover classification.

### Rule

Fix scoped gaps and repeat until clean. Do not use closeout to add a new feature.

### Exit gate

- Documentation V1 truthfully marked implemented;
- all children closed;
- master completion criteria through V1 passed;
- known limitations documented;
- child `140` may begin as a decision-only gate.

## 37. Child 140: Post-V1 Documentation Decision Gate

### Goal

Use evidence from the shipped Documentation V1 to decide the next scope without
automatically implementing it.

### Candidate questions

- GitHub App import proposals/export automation;
- Git/Git conflict/PR/branch/deletion/force-push model;
- translation identity/fallback/workflow;
- custom domain ownership/TLS/canonical behavior;
- public feedback/analytics/privacy/retention;
- external reviewer access;
- realtime collaboration/presence/conflict authority;
- offline editing;
- governed permanent deletion;
- cross-artifact/Organization search;
- richer interactive components/SDK generation;
- advanced publication distribution.

### Required outputs

- evidence-backed accept/defer/reject for each opened question;
- security/privacy/retention implications;
- feature matrix update;
- new ADRs only for durable accepted decisions;
- next master/child sequence if implementation is approved;
- no runtime unless separately planned and authorized.

### Exit gate

- V1 remains stable;
- no deferred item is falsely claimed;
- next scope is explicit or deliberately left deferred;
- Master `006` may close.

## 38. Child Plan Expansion Contract

Before any child implementation:

- reread this master;
- reread child `131`, the grill final ledger, decision consolidation, Context,
  and ADRs;
- inspect predecessor implementation and commits;
- inspect current worktree ownership;
- replace master-era path/dependency assumptions with actual facts;
- list exact files to change and read-only files;
- list explicit non-scope;
- define schemas/tables/indexes/constraints/migration/grants;
- define shared and route-local Zod contracts;
- define routes/status/errors;
- define permissions and tenant isolation;
- define audit/access actions and sensitive fields;
- define Row Version/idempotency/transaction behavior;
- define lifecycle/retention/protected references;
- define dependency pins/licenses/adapters where applicable;
- define TDD order;
- define unit/route/DB/smoke/web/browser evidence;
- define rollback and compatibility;
- define docs/current-truth updates;
- recheck against code changes since plan creation;
- commit the plan checkpoint before runtime when the expansion materially
  changes durable plan content.

Each child file must contain:

- status;
- sequence gate;
- current baseline;
- goal;
- exact scope/non-scope;
- domain/contracts;
- persistence/migration;
- API;
- UI;
- security/permissions;
- audit/access;
- concurrency/errors;
- implementation order;
- tests/verification;
- browser requirements;
- checklist;
- implementation log;
- verification record;
- leftovers;
- handoff.

## 39. Implementation And Commit Discipline

- Protect existing user/agent changes.
- Do not mix unrelated repair.
- Use small logical commits.
- Prefer domain/contracts and tests before adapters/UI.
- Do not commit generated build output.
- Lockfile changes accompany reviewed dependency changes.
- Schema and migration tests accompany migrations.
- Public/permission behavior changes include negative tests.
- Browser-visible behavior receives real-browser evidence.
- A child is not complete because code compiles.
- A child closes only after its plan record and parent checklist are current.
- Close-previous audit occurs before planning the next child from stale
  assumptions.

Recommended commit grouping where applicable:

1. domain/contracts/policies/tests;
2. migration/repository/service/routes/audit/access;
3. portal/editor/reader UI;
4. fixtures/browser evidence;
5. docs/plan closeout.

Exact grouping follows cohesive changes and must not manufacture artificial
commits.

## 40. Master-Wide Non-Scope

Not implemented by this master:

- Video;
- arbitrary executable Documentation content;
- Git/GitHub authority or sync;
- live remote OpenAPI authority;
- Ossie API proxy;
- stored customer API credentials;
- full SDK generation;
- Page-level ACL;
- public comments/feedback/analytics;
- translation workflow/fallback;
- custom domains;
- realtime collaboration;
- offline-first merge;
- permanent deletion/automated retention cleanup;
- cross-artifact/Organization search;
- replacing the portal router/application architecture without a separate
  accepted decision;
- replacing PostgreSQL or File storage;
- replacing existing Guide/Demo domain models with Documentation abstractions;
- renaming `apps/docs` into Product Documentation;
- browser-extension Documentation authoring.

Child `140` may reconsider selected items but does not implement them.

## 41. Risk Register

### Risk: child 132 becomes too broad to close

Mitigation:

- hold strict first-slice non-scope;
- use internal stages and small commits;
- require one thin implementation per accepted capability;
- do not add later-V1 polish;
- keep the child open until the complete journey passes.

### Risk: Tiptap becomes persistence authority

Mitigation:

- explicit relational model;
- adapter round-trip tests;
- no core ProseMirror JSON storage;
- domain commands independent of editor framework.

### Risk: Fumadocs dictates routes/source/auth

Mitigation:

- authorized exact-Publication adapter;
- local route registry remains authoritative;
- custom source proof;
- permission/cache tests outside Fumadocs.

### Risk: universal Artifact schema becomes nullable and unsafe

Mitigation:

- type-specific Documentation tables/contracts;
- explicit publish-family constraints;
- no universal content payload;
- DB constraint tests for every family.

### Risk: private content leaks through search/cache/publication

Mitigation:

- separate projections;
- auth before index/cache/load;
- exact Publication keys;
- comments excluded by schema/serializer tests;
- negative tenant/public tests.

### Risk: publication leaves mixed output

Mitigation:

- complete Revision;
- prepare before switch;
- serialized/idempotent execution;
- rollback by pointer;
- failure injection.

### Risk: import is a code execution or storage attack

Mitigation:

- dedicated child `134`;
- inspect/apply;
- archive/path/parser ceilings;
- no MDX/HTML/remote fetch;
- atomic apply/cleanup.

### Risk: API Try It exposes credentials

Mitigation:

- dedicated child `137`;
- browser memory only;
- no proxy;
- redaction;
- approved origins;
- explicit send;
- no content in evidence/logs.

### Risk: closeout hides unfinished implementation

Mitigation:

- separate hardening `138` from closure `139`;
- no feature additions in `139`;
- repeat audit until clean;
- master marks only genuinely completed items.

### Risk: current docs claim target behavior too early

Mitigation:

- truth bands;
- update current-state copy only when corresponding runtime ships;
- `apps/docs` boundary remains explicit;
- final documentation drift audits.

## 42. Master Verification Matrix

By child `139`, the combined verification must include:

| Area          | Required evidence                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Domain        | Focused policy/contract tests for Site/Edition/Page/navigation/comments/OpenAPI/Revision/Publication/import/Carry-Forward/review. |
| Database      | Clean migrations, upgrade, constraints, grants, audit guards, immutability, protection, transaction rollback.                     |
| API           | Authenticated/public route tests, typed errors, tenant/permission matrix, rate/limit behavior.                                    |
| Portal        | Routes, navigation, editor, preview, comments, history, publishing, import, lifecycle, review, Try It.                            |
| Public reader | Exact Publication, access modes, versions, redirects/gone, assets, search, OpenAPI deep links, SEO.                               |
| Security      | XSS/SSRF/archive/OpenAPI/search/cache/credential/DoS/IDOR controls and negative tests.                                            |
| Concurrency   | Row Version, same-tab/autosave, publication serialization, idempotency, Carry-Forward/import atomicity.                           |
| Audit/Access  | Coverage registries, same-transaction evidence, sensitive-field exclusion, logical read outcomes.                                 |
| Compatibility | Existing Capture/Guide/Demo/extension/public/embed tests and smoke workflows.                                                     |
| Accessibility | Automated plus manual keyboard/screen-reader/focus/zoom/reflow/reduced-motion evidence.                                           |
| Performance   | Core Web Vitals and representative editor/search/OpenAPI/publication fixtures.                                                    |
| Operations    | Quotas, hard ceilings, health, cache rebuild, backup/restore notes, self-hosting docs.                                            |
| Browser       | Authenticated/public desktop/mobile/failure/permission/conflict/publish/rollback journeys using agent-browser.                    |
| Documentation | Context/ADR/master/children/README/roadmap/docs-app/current-truth consistency.                                                    |

## 43. Master Checklist

### Planning

- [x] Master Plan `005` is complete.
- [x] Child `131` and all 32 Documentation grill answers are accepted.
- [x] Accepted Documentation terms exist in `CONTEXT.md`.
- [x] ADRs `0027` through `0030` exist.
- [x] Source-of-truth, threat, tooling, access, URL, search, publication,
      concurrency, retention, migration, and feature decisions are consolidated.
- [x] Planning baseline confirmed there was no Product Documentation runtime
      before child `132`.
- [x] Refined nine-child sequence is defined without adding product scope.
- [x] Recheck this master against child `131`, current code, and current
      dependency research.
- [x] Reconcile active `132`–`138` sequence summaries to `132`–`140`.
- [x] Commit the accepted master/docs-only sequence update.

### Implementation

- [x] Create, expand, recheck, implement, verify, and close child `132`.
- [x] Create, expand, recheck, implement, verify, and close child `133`.
- [x] Create, expand, recheck, implement, verify, and close child `134`.
- [x] Create, expand, recheck, implement, verify, and close child `135`.
- [ ] Create, expand, recheck, implement, verify, and close child `136`.
- [ ] Create, expand, recheck, implement, verify, and close child `137`.
- [ ] Create, expand, recheck, implement, verify, and close child `138`.
- [ ] Create, expand, recheck, verify, and close child `139`.
- [ ] Create, conduct, document, accept, and close child `140`.

### Final Closure

- [ ] All V1 first-slice and remaining-V1 matrix entries are implemented or
      explicitly documented as an accepted leftover.
- [ ] No rejected/deferred item is falsely claimed.
- [ ] Full migration/DB/smoke/workspace/build matrix passes.
- [ ] Full authenticated/public/browser/accessibility/performance dogfood passes
      or capability limitations are truthfully recorded.
- [ ] Tenant isolation, authorization, Audit/Access, protected Files, immutable
      Publications, search/cache isolation, and retention pass final audit.
- [ ] Existing Capture/Guide/Demo/extension/public/embed behavior remains green.
- [ ] Every child has complete status/checklist/log/verification/leftovers/
      handoff.
- [ ] Active documentation reflects shipped V1 accurately.
- [ ] Commits contain only scoped work.
- [ ] Post-V1 decisions are accepted/deferred/rejected without accidental
      runtime expansion.

## 44. Master Completion Criteria

Master Plan `006` is complete only when:

- child `132` proves the complete first vertical slice;
- children `133` through `138` complete remaining Documentation V1 scope and
  hardening;
- child `139` closes the implementation and all cross-product regressions;
- child `140` records the post-V1 decision result;
- Product Documentation current-state docs are truthful;
- all migrations and DB/smoke/workspace/build checks pass;
- all required browser/accessibility/performance evidence is recorded;
- no unresolved S1/S2 issue remains;
- security/privacy/tenant/publication invariants pass;
- existing artifact families remain compatible;
- deferred/rejected scope remains excluded;
- all plans, ADRs, Context, feature matrix, and implementation agree;
- repository worktree/commits contain only owned scoped changes.

Completion of the first slice is not completion of this master. Completion of
V1 implementation at child `139` is not permission to implement child `140`
proposals without another accepted plan.

## 45. Immediate Next Action

Product Documentation is implemented and independently close-rechecked through
child `134`. The next activity is to rewrite/expand
`docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`
against the actual closed child `134` contracts and current code, then recheck
that plan before implementation.

Children `135` through `140` remain sequential reservations. Each later child
follows the same close-predecessor rule.

## 46. Planning And Recheck Log

- 2026-07-30: created Master Plan `006` from the finally accepted child `131`
  grill, Documentation decision consolidation, Context, ADRs, Master Plan `005`,
  and the current code/migration/package/route architecture.
- 2026-07-30: refined the seven-item child `131` handoff into nine children
  without adding product scope: portability received a dedicated security
  child, and operational hardening was separated from final certification.
- 2026-07-30: rechecked every accepted Question `1`–`32` outcome against the
  master sections and child ownership.
- 2026-07-30: confirmed no Documentation runtime/package/schema/route/navigation
  exists and that migrations still end at `024`.
- 2026-07-30: rechecked official Fumadocs/Tiptap guidance and current registry
  metadata. Added explicit custom-source, local-router, Vite, read-only
  OpenAPI-client, accessibility, Node-engine, license, and fallback gates.
- 2026-07-30: removed ambiguity around comments by requiring Row Version
  protection rather than an unspecified concurrency mechanism.
- 2026-07-30: removed ambiguity around internal search by making current
  authorized Site Working Draft Pages in the selected Project Version the first
  release authority; Revision history is not indexed by default.
- 2026-07-30: removed ambiguity around Publication persistence by requiring a
  type-specific immutable Site Publication family rather than reusing
  Guide/Demo Published Artifact rows.
- 2026-07-30: reconciled the canonical implementation handoff and active
  direction docs to children `132` through `140`.
- 2026-07-30: created bounded child reservations `133` through `140` so the
  accepted sequence and ownership are durable without prematurely fixing
  predecessor-dependent implementation details.
- 2026-07-30: expanded and rechecked child `132` against current migration,
  package, server-module, Publish Link, access/audit, Vite route, fixture, and
  smoke architecture. The plan now fixes the first-slice schema/API/UI/security/
  verification contracts while leaving runtime unimplemented.
- 2026-07-30: implemented the child `132` core: Documentation domain/contracts,
  additive migration `025`, version-scoped authoring APIs and portal, immutable
  Revision/type-specific Publication, stable Publish Link integration, exact
  public reader/search/metadata, fixture, protected image flow, and rollback.
- 2026-07-30: completed the deterministic Documentation V1 smoke path and full
  DB suite, and used headless Chrome dogfood to repair frozen metadata,
  redirect handling, Viewer rendering, CORS idempotency, persisted browser ID,
  and routing response-contract defects.
- 2026-07-30: retained child `132` as active because its own restricted-link,
  complete atomic Audit/Access, exhaustive tenant/maintenance, remaining
  authoring-control, and browser upper-bound/access gates are not yet complete.
- 2026-07-30: closed the remaining child `132` gates: protected viewer sessions
  and revocation, complete first-slice mutation audit/access coverage, nested
  Revision scope binding, immutable `TRUNCATE`/controlled-maintenance checks,
  all first-slice block/structure/routing/OpenAPI controls, and the Chrome
  access/failure/2,000-block upper-bound matrix.
- 2026-07-30: repeated full web/server/extension/database/smoke/workspace/build
  verification, recorded the production bundle delta and environment limits,
  marked child `132` complete, and moved the active handoff to child `133`.
- 2026-07-30: close-previous audit repaired child `132` Editor publication
  authorization/UI, numeric Revision-history addressing, absolute sitemap
  locations, the accepted hard safety ceilings, decoded image validation, and
  serialized cross-table path-namespace mutation. Current-truth/evidence docs
  were reconciled and real Chrome proved an Editor checkpoint and existing-link
  publication.
- 2026-07-30: expanded, independently rechecked, implemented, and closed child
  `133`. Added migration `026`, the complete constrained relational content
  graph, Edition-owned Snippets, Documentation/Capture Asset workflows, exact
  Guide/Demo Publication references, complete immutable projections,
  Snippet-aware search, Capture purge protection, and authoring/reader UI.
- 2026-07-30: passed domain/contracts/server/web/DB/smoke/migration/workspace
  verification and headless Chrome public/Admin/Viewer/accessibility evidence;
  browser QA repaired Snippet-only public indexing and duplicate authenticated
  main landmarks. The active handoff moved to child `134`.
- 2026-07-30: independently close-rechecked child `133` against its accepted
  contracts and this master. The repair commits enforce server-authoritative
  safe content/reference validation, scoped relational and immutable-history
  constraints, hard aggregate limits, lifecycle-aware asset selection,
  complete accessible authoring/rendering controls, and exact protected-byte
  verification in Revision digests (`d775611`, `f0b7e9b`, `1d05d02`).
- 2026-07-30: implemented and verified child `134` through its implementation
  checkpoint. Added inspected Markdown/package portability, migration `027`,
  deterministic package V1, exact OpenAPI and frozen exports, atomic fresh-ID
  Apply, protected-media round trips, portal workflows, ADR `0031`, and format
  documentation. The aggregate child checkbox remains open until the requested
  independent close-previous recheck.
- 2026-07-30: independently close-rechecked and closed child `134`. Repairs
  made Inspect replay receipts state-aware, enforced parser/rate/ready
  admission, implemented `markdown-folder` parsing, staged and streamed
  transient ZIP exports, preserved one-pass validated Asset bytes, retained
  safe blocking inspections, and corrected portal refresh/read-only/focus/
  landmark behavior. The actual portability result now hands off to child
  `135`.

## 47. Master Planning Verification Record

Verification date: 2026-07-30.

Required final results:

- Prettier check over every scoped Markdown/TypeScript file: passed.
- `git diff --check`: passed.
- local Markdown link validation over scoped Markdown: passed.
- master heading sequence and child `132`–`140` coverage: passed.
- all 32 final grill outcomes mapped to master contracts/children: passed.
- accepted ADR/Context terminology scan: passed.
- stale active `132`–`138` sequence scan: passed after reconciliation.
- current dependency registry/license/peer recheck: passed and recorded.
- master-creation code/package/migration absence assertion: passed at the
  planning checkpoint; superseded by the child `132` runtime evidence above.
- scoped diff assertion: passed; documentation/plan files only.
- child file assertion: exactly one correctly named plan exists for each child
  `132` through `140`; `132` through `134` are complete and `135`–`140`
  identify themselves as reservations.

Child `132` runtime evidence includes:

- full web suite: 62 files, 374 tests;
- full server unit suite: 105 files, 441 tests;
- full server DB suite: 22 files, 71 tests;
- V1 smoke suite: 1 file, 2 tests;
- full extension suite: 19 files, 140 tests;
- sequential repository lint, type check, and build: 14, 13, and 13 successful
  tasks respectively;
- headless Chrome complete first-slice authoring, access/failure, public-reader,
  exactness, protected image, search, 2,000-block upper-bound, reflow,
  reduced-motion, axe, and local Web Vitals evidence in
  `docs/ui/132-documentation-site-first-vertical-slice-browser-evidence.md`.
- close-previous focused additions: Documentation domain 8 files / 11 tests,
  shared Documentation contracts 2 files / 13 tests, Documentation DB lifecycle
  1 file / 2 tests, portal permission/site/publishing 3 files / 8 tests, and
  workspace type check.
- production web bundle delta against pre-child `50d009c`: `47.91 kB`
  JavaScript raw / `11.64 kB` gzip and `0.59 kB` CSS raw / `0.11 kB` gzip.

Child `133` runtime evidence includes:

- additive migration `026`, complete relational Page/Snippet child graphs,
  Edition-owned Asset lifecycle, exact Guide/Demo Publication references, and
  immutable Site Revision projections;
- Documentation domain 11 files / 22 tests, shared contracts 18 files / 78
  tests, server unit 106 files / 448 tests, web unit 68 files / 390 tests,
  server DB 22 files / 72 tests, and V1 smoke 1 file / 2 tests;
- clean `001`–`026` migration plus guarded `026` down/up, and workspace lint,
  type check, and build;
- headless Chrome public expanded reader/search/media, responsive 200%-zoom
  reflow, reduced motion, Admin Snippet lifecycle, Viewer read-only
  permissions, and zero-violation axe evidence in
  `docs/ui/133-documentation-content-snippets-and-asset-workflows-browser-evidence.md`.
- close-previous browser proof additionally covered tabs keyboard behavior,
  code-copy feedback, labelled Page/OpenAPI selectors, editable expanded block
  controls, and Snippet/Asset rename; protected-byte focused tests,
  Documentation DB, and V1 smoke all passed after the final integrity repair.

Child `134` implementation and close-recheck evidence includes:

- server unit 112 files / 480 tests, web unit 70 files / 399 tests, server DB
  22 files / 75 tests, V1 smoke 1 file / 2 tests, and extension 19 files / 140
  tests;
- clean migration `001`–`027`, populated rollback refusal, clean guarded `027`
  down/up, protected Documentation/Capture media export, exact OpenAPI sources,
  and package create-Site/empty-Site round trips;
- server/web lint, type checks, and production builds;
- headless Chrome `151` with agent-browser `0.33.1` Admin/Viewer package
  download, inspection, upload/cancel/Apply, Page Apply, first-Site import,
  archived/read-only explanation, safe blocking focus/Apply prevention,
  keyboard activation, reflow, reduced motion, console/error, and
  zero-violation axe evidence in
  `docs/ui/134-documentation-import-export-and-package-portability-browser-evidence.md`.

Child `135` implementation evidence includes:

- additive migration `028`, Edition-owned metadata, lifecycle state,
  projection-schema versioning, immutable Carry-Forward provenance, and
  guarded clean down/up rehearsal;
- atomic two-Site Carry-Forward with one exact Revision reused and one created,
  stable replay results, fresh mutable graph IDs, protected File reuse,
  no-overwrite target blockers, and Access/Audit coverage;
- Edition, Page, OpenAPI, Snippet, and Asset lifecycle enforcement with
  inherited read-only state and retained immutable Publication output;
- server unit 112 files / 485 tests, web unit 72 files / 405 tests, server DB
  22 files / 77 tests, V1 smoke 1 file / 2 tests, and extension 19 files / 140
  tests;
- workspace type check, lint, and production build completed successfully;
- headless Chromium two-Site creation/reuse Carry-Forward, exact replay,
  target blockers, Edition/OpenAPI/Snippet archive/restore, Viewer read-only,
  retained public output, 320-pixel reflow, reduced motion, request/console
  review, and zero-violation axe evidence in
  `docs/ui/135-documentation-carry-forward-multi-site-and-lifecycle-browser-evidence.md`.

## 48. Planning Leftovers And Handoff

- Product Documentation children `132` through `135` are complete and
  verified. Child `136` is next.
- Child `132` established the first vertical slice. Child `133` extended it
  with the complete constrained V1 block graph, Edition-owned Snippets,
  Documentation/Capture Asset sources, exact artifact Publication references,
  and matching immutable/public/search contracts.
- The child `132` compatibility proof selected the replaceable Ossie-native
  editor/reader fallback and exact `yaml@2.9.0`; no Tiptap/Fumadocs runtime was
  added.
- Child `132` now fixes first-slice hard safety ceilings. Organization-owned
  configurable quota defaults and operational reporting remain child `138`
  scope; nullable still means unlimited product quota below hard ceilings.
- Git/GitHub, translation, custom domains, public feedback/analytics, realtime
  collaboration, permanent deletion, cross-artifact search, server proxy,
  stored credentials, SDK generation, and Video remain deferred/rejected as
  recorded.
- The next work is to expand child `136` against the closed child `135`
  result, then recheck that implementation-ready plan before runtime work.
- The measured single-chunk bundle growth, organization-configurable
  quotas/reporting, production observability, and capability-dependent
  Firefox/WebKit or production-p75 evidence remain child `138` work.
- Child `135` preserves the child `133` hard ceilings, exact immutable
  references, source discriminants, protected-byte/digest checks, retained
  archived-reference rules, and Edition path-namespace serialization.
  Child `138` must measure and, where needed, split public immutable snapshot
  loading by Page/search/metadata access shape.
