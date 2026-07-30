# Child Plan 132: Documentation Site First Vertical Slice

Date reserved: 2026-07-30

Date expanded: 2026-07-30

Date rechecked: 2026-07-30

Status: Implementation-ready after recheck on 2026-07-30. Product Documentation
runtime remains unimplemented and must not begin until this scoped plan
checkpoint is committed. The mandatory dependency/adapter proof in Stage 1 may
select the documented Ossie-native fallback; it may not change domain
authority, routes, persistence, permissions, or public semantics.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Decision baseline:

- `docs/plan/131-documentation-domain-grill.md`
- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/documentation-domain-decisions.md`
- `CONTEXT.md`
- ADRs `0027` through `0030`

Predecessor:

- `docs/plan/131-documentation-domain-grill.md`

Next child:

- `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`

## 1. Sequence Gate And Planning Checkpoint

Child `131` is complete. It accepted all 32 Documentation answers, corrected
the circular entry gate, added the durable Documentation decisions to
`CONTEXT.md` and ADRs, and explicitly left Documentation runtime unimplemented.
Master Plan `006` is accepted and committed at planning checkpoint `6be45d7`.

At expansion time:

- local `main` is at `6be45d7`;
- migrations end at `024_revision_backed_publication_and_publish_link_manifests.sql`;
- Product Documentation has no tables, domain package, shared contracts, API
  routes, portal routes, editor/reader dependencies, search projection, public
  route, fixture, or current-state runtime claim;
- the repository already has Project Membership, Project Versions, protected
  Files, relational Guide/Demo drafts, immutable revisions/publications,
  multi-version Publish Links, audit/access evidence, local portal routing, and
  browser fixtures that child `132` must extend without regression;
- root `package.json` supports Node `>=18`, CI uses Node 22, and the planning
  host uses Node 24; dependency adoption must not silently raise the repository
  engine or make development depend on one host-only version;
- `apps/web` is React 19 + Vite 7 with an Ossie-owned route registry. It does
  not use React Router, MDX, or a filesystem content authority;
- current Publish Link persistence is artifact-specific. Documentation must
  reuse the common access policy while retaining a type-specific
  `site_publication`; it must not become a `published_artifact`.

Before implementation, rerun and record:

```bash
git status --short --branch
git rev-parse HEAD
git log --oneline --decorate -12
find apps/server/src/db/migrations -maxdepth 1 -type f | sort | tail
node --version
pnpm --version
```

If the worktree or migration sequence changed after this plan, reconcile it
before writing. Do not overwrite or absorb unrelated user/agent changes. If
another migration now owns `025`, use the next available number and update this
plan before implementation.

## 2. Goal

Prove the accepted Documentation model end to end with the least irreversible
complexity:

- stable Project-owned Documentation Site;
- one Site Edition for one Project Version;
- independent relational Page authoring with optimistic concurrency;
- relational navigation, canonical paths, permanent aliases, redirects, and
  `gone` behavior;
- private Page comments;
- a validated self-contained OpenAPI source and read-only reference;
- complete draft preview;
- whole-Edition immutable Site Revision;
- exact immutable Site Publication;
- stable multi-version Publish Link access;
- exact public reader/search/metadata;
- unchanged old Publication after later draft edits;
- a second Publication and atomic rollback to the first.

The slice is complete only when the same synthetic Site passes database, API,
web, public, and real-browser evidence. A partial authoring-only or
reader-only implementation does not complete child `132`.

## 3. Required 15-Step Journey

The fixture and browser evidence must perform, in order:

1. Create one Documentation Site in an authorized Project.
2. Create its Site Edition for one selected Project Version with a primary
   standard language tag.
3. Create two Pages with stable Page identities and the accepted safe blocks.
4. Build navigation, assign canonical slugs, change one slug to create a
   permanent alias, add one internal Page link, add a redirect and an
   intentional `gone` rule, and prove canonical/redirect-cycle validation.
5. Upload and inspect one bounded self-contained OpenAPI JSON or YAML File.
6. Apply it as the Edition's OpenAPI Source and add one read-only API Reference
   block with stable operation destinations.
7. Autosave the two Pages independently and prove stale Row Version conflict
   recovery preserves unsaved local work.
8. Add a private anchored Page comment with an authorized mention, reply,
   resolve it, and prove it can be reopened.
9. Preview the complete latest server-saved Site Working Draft and distinguish
   any unsaved local edit.
10. Create immutable Site Revision `1`.
11. Create an exact Site Publication and a stable Publish Link entry.
12. Read the selected exact public Publication with navigation, Page links,
    public search, direct OpenAPI operation links, canonical metadata, sitemap,
    robots policy, and social metadata.
13. Mutate the Working Draft and prove Publication `1` and its derived output
    remain byte/semantically unchanged.
14. Create Site Revision/Publication `2` and switch the same Publish Link
    entry to it.
15. Roll that entry back to Publication `1` without creating, rebuilding,
    updating, or deleting either immutable Publication.

Evidence must also show that failed Publication preparation leaves the live
entry on its prior exact Publication.

## 4. Accepted Scope

### 4.1 Domain And Persistence

- new `@repo/documentation-domain` package;
- shared Documentation constants and Zod request/response contracts;
- additive migration `025_documentation_site_first_vertical_slice.sql` unless
  preflight finds that number occupied;
- Project-owned Site, Site Edition, Working Draft, Pages, typed blocks,
  navigation, routes, OpenAPI, comments, immutable Site Revisions, exact Site
  Publications, Publish Link integration, and search projections;
- database tenant constraints, Row Versions, immutable guards, protected File
  references, runtime-role grants, and reset/down behavior.

### 4.2 API And Server

- authenticated Site/Page/navigation/routing/comment/OpenAPI/preview/revision/
  publication/Publish Link/internal-search APIs;
- public Publish Link resolution, exact-Publication Page/navigation/search/
  OpenAPI-operation/metadata/sitemap/robots and protected-asset APIs;
- service/repository separation;
- Project authorization before content loading or search;
- transactional audit events and privacy-preserving access evidence;
- bounded fixture and V1 smoke coverage.

### 4.3 Portal And Public UI

- Documentation entry in the version-scoped portal;
- Site library/create surface;
- Page/navigation editor with autosave, conflict recovery, comments, OpenAPI
  inspection/reference, draft preview, Revision history, publication, and
  rollback;
- public responsive reader with navigation, Page/operation destinations,
  version selector, search, canonical/redirect/gone behavior, access states,
  and metadata;
- keyboard, screen-reader, reflow, reduced-motion, loading, empty, error,
  permission, conflict, busy, and failed-publication states;
- a deterministic real-browser fixture and recorded browser evidence.

## 5. Explicit Non-Scope

Do not implement in child `132`:

- reusable snippet authoring or the remaining rich V1 block catalog;
- Guide or Interactive Demo Publication reference blocks;
- a complete Documentation Asset library or cross-Capture asset picker beyond
  the minimum protected image/media reference needed to prove the first-slice
  block contract;
- Markdown import/export or whole-Site ZIP packages;
- Carry-Forward, multi-Site management depth, or complete archive/restore
  lifecycle;
- formal Review Requests, approvals, notification delivery, or approval gates;
- API request execution, Try It, credentials, proxies, SDK generation, or mock
  servers;
- translations/localization workflow, custom domains, analytics, public
  feedback/comments, external reviewers, realtime collaboration, presence,
  offline merge, Git/GitHub authority, or permanent deletion;
- raw HTML, MDX, JavaScript, React components, arbitrary iframes, remote
  server-side fetches, or executable customer content;
- a moving `/latest` route or permanent public historical Publication URL;
- Page-level ACLs, public draft preview tokens, or a second access-policy model;
- changes to `apps/extension` or the current Capture/Guide/Demo editor/reader
  behavior.

## 6. Source Of Truth And Terminology

Use the accepted terms exactly:

- **Documentation Site**: stable Project-owned product identity.
- **Site Edition**: the Site's independently editable instance for one Project
  Version; at most one per Site/Project Version.
- **Site Working Draft**: mutable Edition workspace.
- **Documentation Page**: stable Page identity inside one Edition.
- **Site Revision**: immutable complete snapshot of one Edition.
- **Site Publication**: immutable public-ready output of one exact Site
  Revision.
- **Publish Link**: stable, globally unique, never-reused outside-access
  identity selecting at most one Site Publication per Project Version.
- **private Page comment**: authoring workspace state excluded from Revision,
  Publication, export, search, and public output.

Authoritative state is relational PostgreSQL plus protected File storage.
Tiptap/Fumadocs state, HTML, search documents, caches, metadata, and sitemaps
are derived and rebuildable. Never name a Documentation Site or Site
Publication as an Artifact or `published_artifact`.

## 7. Exact Affected Files

The implementation is expected to own the following exact files. If codebase
changes make an item unnecessary or require a different file, update this plan
with the reason before changing scope.

### 7.1 New domain package

- `packages/documentation-domain/package.json`
- `packages/documentation-domain/tsconfig.json`
- `packages/documentation-domain/eslint.config.js`
- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/policies/documentation-site-policy.ts`
- `packages/documentation-domain/src/policies/documentation-site-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-content-policy.ts`
- `packages/documentation-domain/src/policies/documentation-content-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-navigation-policy.ts`
- `packages/documentation-domain/src/policies/documentation-navigation-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-routing-policy.ts`
- `packages/documentation-domain/src/policies/documentation-routing-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-comment-policy.ts`
- `packages/documentation-domain/src/policies/documentation-comment-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-openapi-policy.ts`
- `packages/documentation-domain/src/policies/documentation-openapi-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-revision-policy.ts`
- `packages/documentation-domain/src/policies/documentation-revision-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-publication-policy.ts`
- `packages/documentation-domain/src/policies/documentation-publication-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-search-policy.ts`
- `packages/documentation-domain/src/policies/documentation-search-policy.test.ts`

### 7.2 Shared constants, types, publication, and authorization

- `packages/constants/src/documentation.ts`
- `packages/constants/src/index.ts`
- `packages/constants/src/constants.test.ts`
- `packages/constants/src/publish.ts`
- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`
- `packages/types/src/index.ts`
- `packages/types/src/publish.ts`
- `packages/types/src/publish.test.ts`
- `packages/publish-domain/src/types/publish-domain.ts`
- `packages/publish-domain/src/policies/publish-link-policy.ts`
- `packages/publish-domain/src/policies/publish-link-policy.test.ts`
- `packages/publish-domain/src/index.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`

### 7.3 Protected File policy

- `packages/file-domain/src/errors/file-domain-error.ts`
- `packages/file-domain/src/index.ts`
- `packages/file-domain/src/types/documentation-file.ts`
- `packages/file-domain/src/policies/documentation-upload-policy.ts`
- `packages/file-domain/src/policies/documentation-upload-policy.test.ts`

The existing generic Audit/Access domain types and sensitive-field rejection
already accept bounded action/resource strings and reject `content`, `payload`,
`search_text`, secrets, tokens, and credentials. Reuse them without a package
change unless a failing test proves an additional generic policy is required;
if so, update this plan before touching `packages/audit-domain`.

### 7.4 Migration and database verification

- `apps/server/src/db/migrations/025_documentation_site_first_vertical_slice.sql`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/provision-runtime-role.ts`
- `apps/server/src/db/provision-runtime-role.test.ts`
- `apps/server/src/db/README.md`

### 7.5 Server module

- `apps/server/package.json`
- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/config/production-hardening.config.ts`
- `apps/server/src/config/production-hardening.config.test.ts`
- `apps/server/src/config/public-web-url.config.ts`
- `apps/server/src/config/runtime.config.ts`
- `apps/server/src/config/runtime.config.test.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
- `apps/server/src/modules/documentation/documentation.audit.ts`
- `apps/server/src/modules/documentation/documentation.audit.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/documentation/documentation.app.integration.test.ts`
- `apps/server/src/modules/documentation/documentation-comments.repository.ts`
- `apps/server/src/modules/documentation/documentation-comments.repository.test.ts`
- `apps/server/src/modules/documentation/documentation-comments.service.ts`
- `apps/server/src/modules/documentation/documentation-comments.service.test.ts`
- `apps/server/src/modules/documentation/documentation-openapi.ts`
- `apps/server/src/modules/documentation/documentation-openapi.test.ts`
- `apps/server/src/modules/documentation/documentation-assets.ts`
- `apps/server/src/modules/documentation/documentation-assets.test.ts`
- `apps/server/src/modules/documentation/documentation-publication.repository.ts`
- `apps/server/src/modules/documentation/documentation-publication.repository.test.ts`
- `apps/server/src/modules/documentation/documentation-publication.service.ts`
- `apps/server/src/modules/documentation/documentation-publication.service.test.ts`
- `apps/server/src/modules/documentation/documentation-public.routes.ts`
- `apps/server/src/modules/documentation/documentation-public.routes.test.ts`
- `apps/server/src/modules/documentation/documentation-search.repository.ts`
- `apps/server/src/modules/documentation/documentation-search.repository.test.ts`
- `apps/server/src/modules/documentation/documentation-search.service.ts`
- `apps/server/src/modules/documentation/documentation-search.service.test.ts`
- `apps/server/src/modules/publish/publish.repository.ts`
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/publish/publish.service.ts`
- `apps/server/src/modules/publish/publish.service.test.ts`
- `apps/server/src/modules/publish/publish.routes.ts`
- `apps/server/src/modules/publish/publish.routes.test.ts`
- `apps/server/src/modules/publish/publish.audit.ts`
- `apps/server/src/modules/publish/publish.audit.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`

### 7.6 Fixture and smoke coverage

- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.cli.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
- `apps/server/package.json`

### 7.7 Portal and public reader

- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/vite.config.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/AppPublicRoutes.test.tsx`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/lib/apiClient.ts`
- `apps/web/src/lib/apiClient.test.ts`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`
- `apps/web/src/index.css`
- `apps/web/src/features/project/ProjectWorkspacePage.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.test.tsx`
- `apps/web/src/features/publish/PublicVersionSelector.tsx`
- `apps/web/src/features/publish/PublicVersionSelector.test.tsx`
- `apps/web/src/features/documentation/types.ts`
- `apps/web/src/features/documentation/documentationEditorAdapter.ts`
- `apps/web/src/features/documentation/documentationEditorAdapter.test.ts`
- `apps/web/src/features/documentation/documentationReaderAdapter.tsx`
- `apps/web/src/features/documentation/documentationReaderAdapter.test.tsx`
- `apps/web/src/features/documentation/documentationPublicMetadata.ts`
- `apps/web/src/features/documentation/documentationPublicMetadata.test.ts`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.test.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.module.css`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.module.css`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.test.tsx`
- `apps/web/src/features/documentation/DocumentationNavigationEditor.tsx`
- `apps/web/src/features/documentation/DocumentationNavigationEditor.test.tsx`
- `apps/web/src/features/documentation/DocumentationCommentsPanel.tsx`
- `apps/web/src/features/documentation/DocumentationCommentsPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationMediaUpload.tsx`
- `apps/web/src/features/documentation/DocumentationMediaUpload.test.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublicationPage.tsx`
- `apps/web/src/features/documentation/DocumentationPublicationPage.test.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.test.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.module.css`
- `apps/web/src/features/documentation/DocumentationSearch.tsx`
- `apps/web/src/features/documentation/DocumentationSearch.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.test.tsx`

### 7.8 Dependency and truth/evidence files

- `pnpm-lock.yaml`
- `README.md`
- `CONTEXT.md`
- `apps/web/README.md`
- `docs/development-setup.md`
- `docs/v1-dogfood-smoke-suite.md`
- `docs/ui/132-documentation-site-first-vertical-slice-browser-evidence.md`
- `docs/plan/132-documentation-site-first-vertical-slice.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

### 7.9 Read-only compatibility surfaces

Inspect but do not change unless a directly caused regression makes a scoped
change unavoidable and the plan is updated first:

- migrations `001` through `024`;
- `apps/extension/**`;
- `apps/docs/**`;
- Capture/Guide/Interactive Demo domain, server, fixture, and UI files not
  listed above;
- completed child plans `109` through `131`;
- ADRs `0027` through `0030`;
- the completed grill record and decision consolidation.

Generated `dist`, `.turbo`, coverage, screenshots outside the accepted evidence
directory, local storage, and browser profiles must not be committed.

`apps/web/src/lib/api.ts` is already about `1,646` lines at expansion. Do not
append the Documentation client to it. Extract its generic request/error/base
URL primitive without changing existing exports into `apiClient.ts`, keep
backward-compatible re-exports, and put all Documentation calls in
`documentationApi.ts`. Tests must prove existing callers retain the same error,
credential, multipart, and base-URL behavior.

## 8. Dependency And Adapter Proof Gate

Stage 1 begins with tests/prototypes behind the adapters named above. Before
editing the lockfile:

1. query exact current package versions, engines, peer dependencies, licenses,
   and published integrity;
2. prove compatibility with Node 22 CI, the existing Node `>=18` declaration,
   React 19, Vite 7, TypeScript 5.9, Vitest, and the local route registry;
3. measure the production bundle delta and record transitive packages;
4. prove that neither adapter assumes filesystem/MDX/Git authority or bypasses
   Ossie authorization;
5. select a maintained bounded YAML parser for OpenAPI `3.0.x`/`3.1.x`, prove
   alias/depth/node/string limits and no remote resolution, and reject the
   candidate if safe bounded parsing cannot be demonstrated;
6. record selected exact versions in this plan and use exact dependency pins
   for every new runtime package, including the YAML parser.

Planning candidates, not pre-approved pins:

- Tiptap `3.29.2` family;
- `fumadocs-core`/`fumadocs-ui` `16.13.0` family;
- `fumadocs-openapi` `11.2.2`.

The proof must include:

- Tiptap controlled schema, paste sanitization, deterministic conversion to and
  from relational commands, safe links/media, keyboard/screen-reader behavior,
  comment anchor stability, reload/unmount, bounded large Page, reduced motion,
  and no persisted ProseMirror JSON authority;
- Fumadocs headless/custom source integration, authorized exact-Publication
  input, Vite SSR/bundling requirements such as `noExternal`, OpenAPI deep
  links, safe rendering, cache identity, reflow/accessibility, and no React
  Router/MDX/filesystem authority;
- explicit review of Scalar-related transitive peers in `fumadocs-openapi`;
  no request execution surface may ship in child `132`.

Fallbacks are accepted and do not alter domain/API contracts:

- if Tiptap fails, implement the same constrained typed-block commands through
  an Ossie-native accessible block form/editor;
- if Fumadocs fails, implement the same authorized reader/navigation/search/
  OpenAPI adapter through Ossie-native React components.

Record the failed proof and remove unused dependencies. Do not raise the Node
engine, replace the route registry, adopt MDX/filesystem authority, or defer the
15-step journey merely to force a dependency. If both candidate and fallback
cannot satisfy the fixed contracts, stop before runtime expansion and request a
new decision.

## 9. Shared Constants And Contract Rules

### 9.1 Constants

`packages/constants/src/documentation.ts` owns:

- statuses: first-slice Site/Edition/Page state is `active`; lifecycle values
  not implemented here are not exposed as working commands;
- block kinds: `paragraph`, `heading`, `ordered_list`, `unordered_list`,
  `code`, `link`, `image`, `divider`, `api_reference`;
- navigation kinds: `group`, `page`;
- routing outcomes: `redirect`, `gone`;
- OpenAPI inspection/source states;
- comment states: `open`, `resolved`;
- primary-language, slug/path, title, description, comment, block, Page,
  navigation, OpenAPI upload, result-count, and Publication limits;
- Documentation capability/action names where shared.

Limits must be product constants with stricter hard server ceilings where
needed. Do not rely only on client validation.

`packages/constants/src/publish.ts` adds a discriminant such as
`PUBLISH_RESOURCE_FAMILIES = ["artifact", "documentation_site"]` while
preserving `PUBLISH_ARTIFACT_TYPES = ["guide", "interactive_demo"]`. Existing
Guide/Demo callers keep their current contract.

Public and authenticated Publish Link schemas form a strict union:

- legacy/current Artifact branch: `resource_family` absent or `artifact` and
  the existing required `artifact_type`;
- Documentation branch: `resource_family: "documentation_site"` and
  `artifact_type` forbidden.

Never infer Documentation from a missing `artifact_type`, and never accept both
an Artifact identity and a Documentation Site identity.

### 9.2 Shared Zod contracts

`packages/types/src/documentation.ts` owns strict schemas and inferred types
for:

- Site/Edition/Working Draft/Page/block/navigation/routing summaries and
  details;
- create/update/autosave/navigation/routing commands;
- draft state token/ETag and latest-safe conflict payload;
- comment thread/reply/mention commands and results;
- OpenAPI inspection/source/operation summaries;
- preview and exact Revision summaries/details;
- Site Publication summaries/details;
- Documentation Publish Link discriminated responses;
- internal/public search queries/results;
- public reader Page/navigation/operation/metadata/sitemap/robots responses.

IDs use existing ULID schemas. Dates use existing ISO schemas. Language tags
are trimmed, normalized BCP 47 tags validated by an explicit policy rather than
free text. Slugs/paths are normalized once on the server, contain only safe
segments, reject dot segments and encoded separators, and reserve `versions`
and all other system roots.

### 9.3 Block command

The Page autosave body is a strict discriminated union. Every block carries a
stable client/server ULID and position. Kind-specific fields are:

- paragraph: plain UTF-8 text;
- heading: level `2`–`4` plus text;
- ordered/unordered list: ordered stable items with plain text;
- code: optional allowlisted language label plus escaped code;
- link: label plus normalized `https:`, `http:`, `mailto:`, or internal Page
  identity; unsafe protocols fail;
- image: same-Edition Documentation Asset identity plus required non-empty alt
  text and optional caption; decorative images are not introduced in this
  slice;
- divider: no payload;
- API reference: applied OpenAPI Source identity and optional operation
  selection.

No opaque editor JSON, raw HTML, style attribute, event handler, arbitrary
iframe, JavaScript URL, data URL, or remote File URL is accepted.

### 9.4 First-slice hard safety ceilings

These are non-bypassable server ceilings, including for an Organization whose
later product quota is unlimited. Child `138` may add operator configuration
and lower Organization-owned product quotas; it may not silently weaken these
ceilings without a new security/performance review.

- Site/Page title: `200` Unicode code points; description: `1,000`;
- Page keywords: `20`, each `80` normalized Unicode code points;
- canonical path: `240` UTF-8 bytes, at most `8` segments, `80` bytes/segment;
- Pages per Edition: `1,000`;
- blocks per Page: `2,000`; list items per block: `500`;
- saved safe text per Page: `4 MiB`; code block: `1 MiB`;
- navigation nodes: `2,000`, maximum depth `16`;
- redirect/`gone` rules: `2,000` per Edition;
- comment/reply body: `10,000` code points; `1,000` threads/Page;
  `500` replies/thread; `50` mentions/message;
- OpenAPI upload: `10 MiB`; YAML alias count `0`; parsed structural depth
  `100`; scalar length `1 MiB`; total parsed nodes `250,000`; operations
  `20,000`;
- raster upload: `10 MiB`, maximum `16,384 × 16,384`, maximum `40` million
  decoded pixels;
- search query: `200` code points; result page: `50`;
- Publish Link entries: retain existing `50`;
- one active Publication preparation per Edition; hard timeout `120 s`;
- idempotency key: `200` visible ASCII characters and server retention at least
  `24 h` for this slice's retriable commands.

The OpenAPI implementation may reject a document below these hard ceilings
when safe parser/validation work cannot be bounded. It must never accept one
above them. Limit errors name the applicable safe limit without echoing source
content.

## 10. Persistence And Migration Contract

### 10.1 Migration shape

Migration `025_documentation_site_first_vertical_slice.sql` is additive and
contains its supported down path. It creates `documentation_schema` and the
tables below, then extends `publish_schema` through explicit family checks.
Migrations `001`–`024` remain byte-for-byte unchanged.

All ULID primary keys use the repository's accepted `VARCHAR(26)` pattern.
Tenant-scoped roots include `(id, project_id, organization_id)` unique keys.
Composite foreign keys carry Organization/Project/Site/Edition/Project Version
scope so the database rejects cross-tenant and cross-parent identities.

### 10.2 Mutable authoring tables

Create:

- `documentation_schema.documentation_site`
  - stable Site identity, Organization, Project, name, optional description,
    positive `version`, creator/updater, timestamps;
- `documentation_schema.site_edition`
  - Site, Project Version, primary language tag, positive `version`,
    creator/updater, timestamps;
  - unique `(site_id, project_version_id)`;
- `documentation_schema.site_working_draft`
  - one row per Edition, nullable Home Page until checkpoint, positive
    structural `version`, timestamps;
- `documentation_schema.documentation_page`
  - stable Page identity, Edition/Working Draft, title, optional description,
    canonical path, positive Page aggregate `version`, timestamps;
  - canonical path unique inside one Working Draft;
- `documentation_schema.documentation_page_keyword`
  - stable Page-owned ordered normalized keyword, positive `version`;
- `documentation_schema.documentation_page_block`
  - stable block, Page, kind, deterministic position, only kind-appropriate
    scalar fields, Asset/OpenAPI references, positive `version`, timestamps;
- `documentation_schema.documentation_list_item`
  - stable item, list block, deterministic position, plain text, positive
    `version`;
- `documentation_schema.documentation_path_claim`
  - authoritative unique normalized path namespace per Edition, discriminated
    as canonical Page, permanent alias, or routing rule and scoped to the exact
    owning row;
- `documentation_schema.navigation_tree`
  - one versioned root per Working Draft;
- `documentation_schema.navigation_node`
  - stable group/Page node, nullable parent, deterministic sibling position,
    group label or same-Edition Page reference, positive `version`;
- `documentation_schema.page_slug_alias`
  - permanent never-reassigned former path mapped to stable same-Edition Page;
- `documentation_schema.documentation_routing_set`
  - one positive-version aggregate root per Working Draft for user-managed
    redirect/`gone` rules;
- `documentation_schema.documentation_redirect_rule`
  - routing-set-owned same-Edition source path with exactly one outcome:
    same-Edition target Page (`redirect`) or no target (`gone`), positive
    `version`;
- `documentation_schema.documentation_asset_reference`
  - draft Page/block to same-Edition Documentation Asset with
    Organization/Project scope; enough metadata to enforce protected File use;
- `documentation_schema.documentation_asset`
  - minimal first-slice protected raster-media identity over one File with
    Organization/Project/Site/Edition scope, sniffed MIME type, byte size,
    dimensions, checksum, creator, and timestamps;
- `documentation_schema.openapi_inspection`
  - actor/tenant/Project/Site/Edition-bound temporary File inspection, digest,
    parser/version/status/safe summary/expiry, no source body in JSON/audit;
- `documentation_schema.openapi_source`
  - applied self-contained File/digest/version/title safe metadata, Edition,
    positive `version`, creator/updater;
- `documentation_schema.openapi_operation`
  - stable source-owned operation identity, normalized method/path/operationId,
    safe summary/tags, unique stable destination key, positive `version`;
- `documentation_schema.comment_thread`
  - Page, optional stable block anchor, author, plain body, state, positive
    `version`, timestamps;
- `documentation_schema.comment_reply`
  - thread, author, plain body, positive `version`, timestamps;
- `documentation_schema.comment_mention`
  - thread or reply, mentioned active Project Member/Org User, creator,
    uniqueness and same-Project constraint.
- `documentation_schema.documentation_command_receipt`
  - actor/tenant/Project/command/parent-scoped SHA-256 idempotency-key hash,
    normalized request digest, safe result resource type/ID, creation and expiry;
  - unique command scope plus key hash; never stores the raw key or response
    body.

Content replacement is atomic at the Page aggregate. The Page `version`
protects Page metadata and ordered blocks/list items together; child rows are
never mutated independently by a public route. Navigation and routing use
their own aggregate Row Versions so unrelated Page saves do not conflict.
Working Draft version covers Home Page, primary source association, and
Edition-wide settings only; it is not incremented as a global lock for every
Page keystroke.

Every retained/updated/deleted mutable child supplied to an aggregate command
carries its current expected child `version`; new client-generated child IDs
omit it and start at `1`. The server locks and checks the aggregate root and
child versions before compare-and-increment/replacement. Aggregate ownership
does not become an excuse for last-write-wins child rows.

The unique `(site_edition_id, normalized_path)` claim prevents collisions
across current canonical paths, permanent aliases, redirects, and `gone`
rules—not merely within each individual table. Canonical path change converts
the old canonical claim to a permanent alias and creates the new canonical
claim in one transaction. Database checks/deferrable scoped foreign keys plus
domain validation enforce the claim discriminant.

### 10.3 Revision snapshot tables

Create:

- `documentation_schema.site_revision`;
- `documentation_schema.site_revision_page`;
- `documentation_schema.site_revision_page_keyword`;
- `documentation_schema.site_revision_page_block`;
- `documentation_schema.site_revision_list_item`;
- `documentation_schema.site_revision_navigation_node`;
- `documentation_schema.site_revision_page_alias`;
- `documentation_schema.site_revision_redirect_rule`;
- `documentation_schema.site_revision_asset_reference`;
- `documentation_schema.site_revision_openapi_source`;
- `documentation_schema.site_revision_openapi_operation`;
- `documentation_schema.site_revision_search_document`.

`site_revision` carries Organization, Project, Site, Edition, Project Version,
positive Edition-scoped `revision_number`, primary language, exact Home Page,
safe settings, content digest, creator, and timestamps. Snapshot rows are
Revision-owned copies, not foreign keys back to mutable Page/content state.
The snapshot freezes all Pages, Page descriptions/keywords, typed blocks/list
items, navigation, aliases, redirect/gone rules, referenced protected Files,
OpenAPI safe metadata/operations, search text, and Site reader/public metadata
settings.

Comments, replies, mentions, inspection state, Audit/Access Evidence, sessions,
and editor-only state are absent from every snapshot.

Unique `(site_edition_id, revision_number)` and exact digest reuse rules apply.
Manual checkpoint of an unchanged valid Working Draft returns the existing
latest Revision with `revision_reused: true`; revision numbers are positive,
monotonic, independently allocated, never reused, and locked per Edition.

### 10.4 Type-specific Site Publication

Create:

- `publish_schema.site_publication`;
- `publish_schema.site_publication_search_document`.

`site_publication` references one exact `site_revision` through scoped
Organization/Project/Site/Edition/Project Version foreign keys. It carries a
positive Edition-scoped `publication_sequence`, publisher, prepared content/
reader/search/metadata digest, preparation version, and timestamps.

It is not inserted into `publish_schema.published_artifact`. Publication
sequence is independent from Revision number. Re-publishing an exact Revision
may reuse an already prepared Site Publication only when the adapter/
preparation version and complete output digest match; otherwise create a new
immutable Publication with the next sequence. The response states reuse
truthfully.

`site_publication_search_document` is exact-Publication scoped and copied/
prepared from the exact Revision. It contains only safe title, description,
heading, body, breadcrumb, language, Project Version, and OpenAPI operation
text. It contains no comments, inspection data, audit data, private File paths,
or unsaved draft data.

### 10.5 Shared Publish Link extension

Alter `publish_schema.publish_link`:

- add `resource_family` with default/backfill `artifact`;
- add nullable `documentation_site_id`;
- permit `artifact_type` to be null only for `documentation_site`;
- replace family checks with an XOR:
  - `artifact` retains exactly the existing Guide/Demo columns and constraints;
  - `documentation_site` has Site identity and null Guide/Demo/artifact type;
- add scoped Site foreign keys/indexes while preserving global immutable slug,
  visibility, expiry, password, status, and version behavior.

Alter `publish_schema.publish_link_entry`:

- make `published_artifact_id` nullable only for Documentation entries;
- add nullable `site_publication_id`, `documentation_site_id`, and
  `site_edition_id`;
- add exact scoped foreign keys to Site, Edition, Project Version,
  Site Publication, and parent Documentation Publish Link;
- enforce artifact-entry versus Documentation-entry XOR;
- preserve one entry per Project Version, position/default, Row Version, and
  actor/timestamp behavior.

Extend `publish_schema.public_publish_viewer_session` only through its existing
Publish Link foreign key; password/session policy stays common and link-wide.
Existing Guide/Demo rows are backfilled as `artifact`, preserve IDs/slugs/
versions/entries, and pass unchanged contract/route tests.

### 10.6 Draft search projection

Create `documentation_schema.site_draft_search_document` keyed to the latest
server-saved Page and its Page Row Version. It is explicitly
Organization/Project/Project Version/Site/Edition/Page scoped, rebuildable, and
excluded for inactive parents. It contains the same safe fields as the public
projection but never comments. Save/rebuild happens transactionally with the
successful Page/OpenAPI/navigation mutation or via an idempotent rebuild from
authoritative relational rows.

### 10.7 Immutability and protected references

Apply UPDATE, DELETE, and TRUNCATE rejection to Site Revision snapshot tables,
Site Publication tables, and permanent aliases. Use the existing maintenance
bypass pattern only for controlled migration/maintenance. Runtime-role grants
cannot disable triggers or mutate immutable rows.

Protected File logic must prevent purge of:

- an OpenAPI File used by mutable or immutable Documentation state;
- an image/media File used by a draft, Revision, or Publication.

Archiving a mutable reference does not remove immutable reference protection.
Public File resolution is authorized by Publish Link + selected version entry +
exact Site Publication + exact frozen asset reference; a raw File ID is never a
public authorization token.

### 10.8 Lifecycle and retention in this slice

- Site, Edition, Page, comment, OpenAPI Source, and Documentation Asset have no
  archive/delete command in child `132`; lifecycle UI belongs to later
  children.
- Existing archived Project/Project Version policy makes the contained
  Documentation state effectively read-only.
- Successful and failed OpenAPI inspections expire after `24 h`. An idempotent
  cleanup removes unreferenced inspection rows and their temporary Files after
  expiry; an applied Source/Revision reference prevents File cleanup. Until
  child `138` adds operator scheduling, run a bounded cleanup batch
  opportunistically after inspection create/apply without delaying the user
  response or scanning another tenant's active result.
- Idempotency outcomes remain available for at least `24 h`; cleanup cannot
  change an already committed domain result. Expired command receipts may be
  removed because the referenced domain result remains authoritative.
- Comments/replies are retained as private authoring history; no hard delete is
  exposed.
- permanent aliases, Site Revisions, Site Publications, frozen search
  documents, and their protected File references are retained indefinitely in
  V1.
- Publish Link/viewer-session retention continues to follow the existing common
  policy. Revocation removes outside access but does not delete immutable
  Publications.

### 10.9 Required keys, checks, and indexes

The migration must name and test, at minimum:

- scoped identity uniques for every tenant-owned root and snapshot;
- `uq_site_edition_site_project_version`;
- one Working Draft, navigation tree, routing set, and active OpenAPI Source per
  Edition;
- `uq_documentation_path_claim_edition_path`;
- unique deterministic positions for Page keywords, Page blocks, list items,
  navigation siblings, Revision snapshots, and link entries, using deferrable
  constraints where an atomic reorder needs temporary collisions;
- `uq_site_revision_edition_number` and
  `uq_site_revision_edition_content_digest`;
- `uq_site_publication_edition_sequence` and an exact
  Revision/preparation-version reuse key;
- one draft/public search document per owning Page/Publication Page and a GIN
  index over a server-built `simple` text-search vector;
- OpenAPI Source digest/Edition, operation destination, inspection
  actor/digest/expiry, Asset File, comment Page/state, reply thread/time, and
  command-receipt actor/key lookup indexes;
- Documentation Publish Link Site/history/public-access indexes alongside the
  unchanged Guide/Demo partial indexes.

Every positive version/position/sequence, bounded status/kind/outcome, family
XOR, Home Page scope, block-kind payload, navigation-kind payload,
redirect-versus-gone target, comment anchor, OpenAPI version, File scope, and
actor scope receives a database CHECK and/or scoped foreign key. Database
constraints enforce structural tenant/parent safety; domain/service validation
still supplies actionable errors.

The runtime role receives only the explicit SELECT/INSERT/UPDATE operations
needed on mutable Documentation tables, DELETE only for controlled aggregate
replacement/expired inspection and receipt cleanup, and SELECT/INSERT on
immutable snapshot/Publication tables. It receives no UPDATE/DELETE/TRUNCATE
ability that can bypass immutable guards and no direct ability to disable
triggers. Public requests continue through server authorization; there is no
anonymous database role.

## 11. Domain Invariants And Behavior Rules

### 11.1 Site, Edition, and Page

- A Site belongs to exactly one Project.
- At most one Edition exists for a Site/Project Version pair.
- Creation in this slice creates the Site, selected Edition, and Working Draft
  atomically; retry with the same idempotency key returns the same result.
- The primary language is a normalized standard language tag and is frozen in
  each Revision.
- Page identity never changes when title or canonical path changes.
- Former canonical paths become permanent aliases and can never be assigned to
  another Page or deleted by a normal runtime command.
- `versions` and other system segments cannot be Page roots.
- Incomplete drafts are allowed; checkpoint/publication require exactly one
  valid Home Page included in navigation.

### 11.2 Navigation and routing

- Navigation is an ordered relational tree with stable node IDs.
- Nodes are either groups or same-Edition Pages.
- A Page appears no more than once; unlisted Pages are allowed.
- Cycles, cross-Edition references, invalid sibling positions, empty groups at
  checkpoint, duplicate canonical paths, alias collisions, and redirect cycles
  fail.
- Redirect targets are stable internal Page identities, never arbitrary URLs.
- A `gone` rule has no target and produces intentional 410 only from the exact
  Publication that freezes it.
- Direct missing public Page returns non-enumerating 404, not Home Page.
- Safe query/fragment preservation occurs only on same-origin canonical
  redirects; authentication/password secrets and unsafe values are dropped.

### 11.3 Comments

- Project Admins and Editors may create threads/replies and resolve/reopen;
  Viewers may read authorized private comments but cannot mutate them.
- Mentions target active authorized Project Members only.
- Comment/reply body is bounded plain text. No raw HTML, attachments, secret
  URL previews, or executable formatting.
- Anchors use stable block ID when it still exists and fall back visibly to the
  Page when it does not; deleting/replacing a block never deletes a thread.
- Resolve/reopen uses expected thread Row Version.
- First slice has no comment/reply edit or delete command.
- Publishing never requires resolution.

### 11.4 OpenAPI

- Accept bounded JSON or YAML uploaded into protected File storage.
- Parse with aliases/depth/node/string limits and supported OpenAPI version
  checks.
- `$ref` must resolve inside the uploaded self-contained document; remote,
  file, protocol-relative, and data references fail.
- Inspection calculates a digest and safe summary without making it active.
- Apply requires the same actor/tenant/Project/Edition, unexpired successful
  inspection, exact File/digest, expected Working Draft version, and
  idempotency key.
- Operations receive deterministic stable destinations from method/path/
  operation identity. Examples are escaped and read-only.
- No network request is executed and no Try It control is rendered.

### 11.5 First-slice media

- Accept only bounded raster images (`image/png`, `image/jpeg`, and
  `image/webp`) through the inline Page editor.
- Verify magic bytes, sniffed MIME type, decoded dimensions, pixel ceiling,
  byte ceiling, and checksum. Reject SVG, HTML, MIME/extension mismatches,
  malformed images, and decompression/dimension abuse.
- Store a protected File and scoped Documentation Asset atomically; remove
  storage best-effort if the database transaction fails.
- Alt text belongs to each block/reference rather than the reusable Asset.
- This child has no asset library, cross-Capture selector, archive, replace, or
  delete command; those workflows belong to child `133`.

### 11.6 Autosave and conflict recovery

- Autosave operates on one Page aggregate and expected Page plus existing child
  Row Versions.
- Only one same-tab save is in flight per Page; later local edits queue.
- A stale response never overwrites newer local state.
- A 409 response includes the latest safe server Page/version, never data the
  actor is not authorized to read.
- The UI preserves local content, offers compare/reload/retry, and never labels
  unsaved/error/offline state as saved.
- Different Pages can save concurrently without a global draft conflict.
- Preview is labeled “latest server-saved draft”; unsaved editor changes are
  called out and are not silently injected into the server preview.

### 11.7 Revision, Publication, failure, and rollback

Checkpoint validates the complete saved draft:

- Home Page and navigation;
- blocks and internal links;
- canonical paths, permanent aliases, redirects, and `gone`;
- OpenAPI source/reference and operation destinations;
- protected File references;
- product/hard limits and safe content.

Publication executes:

1. authorize and lock the Edition publication lane;
2. verify expected draft state token;
3. validate complete draft;
4. create/reuse exact immutable Site Revision;
5. prepare reader/search/metadata/sitemap/robots output off the live pointer;
6. create/reuse immutable Site Publication;
7. atomically create/switch selected Publish Link entry with Audit Event;
8. expose caches only under the exact Publication identity.

Preparation failure creates no live switch. It cleans or records bounded
orphaned derived work and returns an actionable redacted error. Retry with the
same idempotency key cannot create duplicate Revision, Publication, link, or
Audit Event.

Rollback requires expected Publish Link and entry Row Versions and an older
Site Publication for the same Site/Edition/Project Version. It only repoints
the entry and records one audit event; it does not create, rebuild, update, or
delete immutable content.

## 12. API Contract

All routes are under Fastify's existing `/api/v1` prefix. Params and bodies are
validated with strict shared Zod schemas. Authenticated routes use the existing
session cookie. Mutation routes require `Idempotency-Key` for create/apply/
checkpoint/publication/link-switch commands and an expected Row Version/state
token as specified.

### 12.1 Authenticated Site and Page routes

```text
GET    /projects/:project_id/versions/:version_slug/documentation-sites
POST   /projects/:project_id/versions/:version_slug/documentation-sites
GET    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id
PATCH  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id
PATCH  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/edition
PATCH  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/working-draft

POST   /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages
GET    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id
PATCH  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id
PUT    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/content

GET    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/navigation
PUT    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/navigation
GET    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/routing
PUT    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/routing
GET    /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/validation
```

Site creation body: name, optional description, primary language tag, and
optional initial Home Page title/path. It atomically returns Site, Edition,
Working Draft, and optional Page. Site PATCH is Admin-only for name/
description. Edition PATCH is Admin-only for primary language and requires the
expected Edition version. Working Draft PATCH changes Home Page under expected
Working Draft version and is available to Admin/Editor. Each command has a
separate strict schema so authorization never depends on selectively ignoring
fields in one mixed body.

Page create returns `201`; GET/list return `200`; PATCH/content return the
updated Page and state token. Page PATCH owns title, description, ordered
keywords, and canonical path under Page/keyword Row Versions. Content `PUT`
replaces the Page's typed blocks atomically under expected Page/block/item
versions. Routing PUT changes user-managed redirect/gone rules; automatic
permanent aliases are returned read-only and cannot be deleted.

Validation is read-only, bound to the latest saved draft, and returns typed
issues with stable codes and authorized entity IDs. It does not checkpoint or
publish.

### 12.2 Comment routes

```text
GET   /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments
POST  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments
POST  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id/replies
PATCH /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id
```

Thread/reply create bodies contain bounded plain text, explicit mentioned
Project Membership IDs, and optional stable block anchor for a thread. PATCH
contains `expected_version` and exactly one transition: `resolve` or `reopen`.
There is no public, edit, or delete route.

### 12.3 OpenAPI routes

```text
POST /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/inspections
POST /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/sources
GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source

POST /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets
GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id/file
```

Inspection is multipart with exactly one JSON/YAML File and returns `201` with
inspection ID, digest, recognized OpenAPI version, safe counts/warnings, and
expiry. It returns `413` before parsing over the upload ceiling. Apply returns
`201` or idempotent `200` with Source and operation summaries. GET never returns
raw protected File content.

Asset POST is the minimum inline upload needed by the image block, not the
child `133` Asset library. It accepts exactly one bounded raster image, sniffs
and decodes it, stores the protected File and scoped Documentation Asset
atomically, and returns safe metadata. Authenticated File GET resolves
Project/Site/Edition/Asset before opening storage. It never accepts a raw File
ID as authority.

### 12.4 Preview, Revision, Publication, and Publish Link routes

```text
GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/preview
GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions
POST /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions
GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions/:revision_number

GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications
POST /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications
GET  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications/:publication_sequence

GET   /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links
POST  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links
PATCH /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id
PUT   /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/entries
POST  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/entries/:entry_id/rollback
POST  /projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/revoke
```

History is cursor/sequence paginated. Exact revision/publication GET is
authenticated and read-only. Publication POST takes expected draft state,
optional existing link selection(s), or an initial link configuration.
Documentation link request/response contracts are discriminated by
`resource_family: "documentation_site"` and contain `site_publication`, never
`published_artifact`.

Link access settings reuse existing name, immutable slug, visibility, expiry,
password, status, version, selected Project Version entries, and link-wide
viewer session behavior. Guide/Demo request/response schemas remain accepted.

### 12.5 Internal search

```text
GET /projects/:project_id/versions/:version_slug/documentation-search
```

Required query: bounded `q`; optional authorized Site ID; bounded cursor/limit.
Authorization and selected Project Version filtering occur before projection
access. Results include Site/Page identity, title, safe excerpt, breadcrumbs,
language, and portal canonical path. Query text is not audit/access evidence.
No comments, archived state, Revision history, or other Project Version appears.

### 12.6 Public APIs

Extend the existing public link policy with a family-discriminated query or
route-local contract while preserving existing Guide/Demo URLs:

```text
GET  /public/publish-links/:slug?resource_family=documentation_site
GET  /public/publish-links/:slug/versions/:version_slug?resource_family=documentation_site
POST /public/publish-links/:slug/viewer-sessions?resource_family=documentation_site

GET /public/publish-links/:slug/documentation/pages/*
GET /public/publish-links/:slug/versions/:version_slug/documentation/pages/*
GET /public/publish-links/:slug/documentation/search
GET /public/publish-links/:slug/versions/:version_slug/documentation/search
GET /public/publish-links/:slug/documentation/operations/:operation_key
GET /public/publish-links/:slug/versions/:version_slug/documentation/operations/:operation_key
GET /public/publish-links/:slug/documentation/assets/:asset_reference_id/file
GET /public/publish-links/:slug/versions/:version_slug/documentation/assets/:asset_reference_id/file
GET /public/publish-links/:slug/documentation/sitemap.xml
GET /public/publish-links/:slug/versions/:version_slug/documentation/sitemap.xml
GET /public/publish-links/:slug/documentation/robots.txt
GET /public/publish-links/:slug/versions/:version_slug/documentation/robots.txt
```

The Page wildcard is parsed by a route-local strict multi-segment path schema;
it is never passed to storage or SQL as an unchecked path. The public root
resolution returns exact selected Site Publication, navigation, Home Page,
version entries, access state, and metadata. Page paths may contain multiple
validated segments and are resolved only against that Publication's frozen
canonical/alias/redirect/gone state. Public search/operation/asset/metadata uses
the same exact selection and policy. Restricted/password content is absent from
unauthenticated sitemaps and receives non-indexing robots policy.

For an alias or redirect, the public Page API emits permanent `308` with a
`Location` built from validated `OSSIE_PUBLIC_WEB_URL` plus the trusted frozen
canonical `/docs/...` path. The web client requests resolution with manual
redirect handling and replaces the browser URL. It never builds a redirect
target from customer text.

### 12.7 Status and error mapping

- `200`: successful read/update/idempotent replay;
- `201`: new Site/Page/thread/reply/inspection/source/Revision/Publication/link;
- `302`/`308`: safe canonical/permanent Page redirects at the browser/HTTP
  presentation boundary;
- `400`: malformed strict contract, invalid language/path/navigation/content/
  redirect/OpenAPI/checkpoint input;
- `401`: missing/invalid authenticated session or required public viewer
  session;
- `403`: authenticated known Project context but insufficient role, following
  existing Project policy;
- `404`: tenant/resource/link/version/Page/operation not found or intentionally
  non-enumerating;
- `409`: Row Version/state conflict, duplicate/retired path, read-only parent,
  publication busy, invalid rollback target, or conflicting link entry;
- `410`: exact frozen `gone` public path;
- `413`: upload/body/response ceiling exceeded;
- `429`: existing rate limiting where configured;
- `500`/`503`: redacted preparation/storage/internal failure, with live link
  provably unchanged.

Typed codes include:

- `documentation_site_not_found`;
- `documentation_page_not_found`;
- `documentation_read_only`;
- `documentation_row_version_conflict`;
- `documentation_path_conflict`;
- `documentation_path_retired`;
- `documentation_navigation_invalid`;
- `documentation_internal_link_broken`;
- `documentation_redirect_cycle`;
- `documentation_content_unsafe`;
- `documentation_openapi_invalid`;
- `documentation_openapi_too_large`;
- `documentation_inspection_expired`;
- `documentation_comment_anchor_missing`;
- `documentation_revision_invalid`;
- `documentation_publication_busy`;
- `documentation_publication_preparation_failed`;
- `documentation_rollback_invalid`;
- `documentation_asset_protected`.

Conflict responses contain the latest authorized safe aggregate and current Row
Version/state token. Other errors do not disclose cross-tenant existence,
comment/OpenAPI/Page bodies, Filesystem paths, SQL, or secrets.

## 13. Portal And Public Browser Routes

Add these canonical authenticated routes to the local parser, guards, metadata,
breadcrumbs, navigation, and App switch together:

```text
/projects/:projectId/versions/:versionSlug/documentation
/projects/:projectId/versions/:versionSlug/documentation/:siteId
/projects/:projectId/versions/:versionSlug/documentation/:siteId/pages/:pageId
/projects/:projectId/versions/:versionSlug/documentation/:siteId/preview
/projects/:projectId/versions/:versionSlug/documentation/:siteId/revisions/:revisionNumber
/projects/:projectId/versions/:versionSlug/documentation/:siteId/publications/:publicationSequence
```

Add public browser routes:

```text
/docs/:publishLinkSlug
/docs/:publishLinkSlug/:pagePath
/docs/:publishLinkSlug/versions/:versionSlug
/docs/:publishLinkSlug/versions/:versionSlug/:pagePath
```

Parser ordering must reserve `versions` before generic Page path capture and
support multi-segment Page paths. No `/latest` route. Publish Link slug is
global, immutable, opaque, and never reused.

On explicit version switch:

1. open the same canonical Page path in the target Publication;
2. otherwise try the target Publication's frozen aliases;
3. otherwise open the target frozen Home Page and announce the fallback.

A direct missing request remains 404. Public historical Publication routes are
not exposed. Authenticated exact history remains in the portal.

### 13.1 Current split-app rendering boundary

`apps/web` is currently a static Vite SPA and Fastify does not serve its build.
Child `132` must not silently replace that deployment architecture, move the
customer reader into `apps/docs`, or claim that client-rendered head tags are
server-rendered crawler output.

For this first slice:

- Fastify is authoritative for exact-Publication resolution, `308` canonical
  redirect decisions, `404`/`410` outcomes, sitemap XML, robots text, and frozen
  canonical/social metadata;
- the SPA applies authorized metadata to `document.head`, handles the API's
  trusted canonical redirect, and renders the reader;
- browser evidence checks the final browser URL/head and direct API
  status/body;
- current-truth docs record that initial `/docs/...` HTML from a static host is
  a generic SPA shell and route-specific social tags require JavaScript.

Child `138` owns the evidence-backed decision/hardening for crawler-visible
route-specific initial HTML/status at the deployment boundary. If acceptance
requires server-rendered Open Graph or browser-route HTTP status in child `132`,
stop for an explicit architecture decision rather than introducing SSR or a
reverse-proxy contract by accident.

## 14. UI Behavior Contract

### 14.1 Site library and creation

- Version-scoped Documentation navigation is visible only after Project/
  Project Version resolution.
- Empty state explains Sites and offers creation only to Project Admin.
- Create dialog collects name, description, primary language, and optional
  initial Home Page; validation is inline and server errors retain input.
- Viewer receives a read-only library and never a hidden write failure.

### 14.2 Editor workbench

- Stable shell: Site/navigation rail, Page work area, contextual comments/
  OpenAPI/publish panels.
- Page selection is URL-addressable and reload-safe.
- Admin/Editor can author Pages; Viewer sees read-only saved state.
- Save status distinguishes `unsaved`, `saving`, `saved at`, `conflict`,
  `offline`, and `error`.
- Navigation edits are keyboard operable without drag-only interaction.
- Every reorder has buttons/keyboard commands and announced result.
- Path changes warn that the former path becomes a permanent alias.
- Routing editor distinguishes redirect from intentional `gone` and explains
  exact-Publication freezing.
- Unsafe paste/link/media content is rejected with actionable focus placement.

### 14.3 Comments

- Threads are reachable from block controls and a Page-level panel.
- Anchor loss is announced and the thread remains reachable at Page level.
- Mention options include authorized Project Members only.
- Resolve/reopen and reply are keyboard operable with live-region outcome.
- Comment bodies never appear in preview/public/search UI.

### 14.4 OpenAPI and preview

- Upload shows size/type requirements, inspection progress, safe warnings,
  errors, recognized version, counts, and apply confirmation.
- No external reference is fetched; no Try It/request button is shown.
- API Reference exposes stable keyboard-focusable operation destinations.
- Draft preview labels its exact server-saved state and warns about unsaved
  local changes.

### 14.5 Revision, publication, and rollback

- Validation issues link to the owning Page/navigation/routing/OpenAPI field.
- Checkpoint shows create versus reuse truthfully.
- Publish preparation has busy/progress/failure state and never implies the
  live link changed before success.
- History distinguishes Revision number from Publication sequence.
- Rollback requires confirmation naming link, Project Version, current
  Publication, and target Publication; success restores focus and announces the
  new selected exact Publication.

### 14.6 Public reader

- Skip link, semantic landmarks, one H1, hierarchical navigation, breadcrumbs,
  visible focus, keyboard search/results, and accessible version selector.
- Mobile navigation is modal/drawer-like with focus containment, Escape,
  opener restoration, and background isolation.
- Search announces count/loading/empty/error and uses canonical result paths.
- Restricted/password/revoked/expired/not-found/gone states do not leak titles,
  paths, operations, or snippets.
- Links and code examples are safe; external links are distinguishable.
- Reduced motion disables non-essential transitions; reflow works at 320 CSS px
  and 400% zoom without two-dimensional content scrolling except code.
- Canonical/social metadata, sitemap, and robots derive from the exact selected
  Publication and access policy.

### 14.7 Performance boundary

- Keep the accepted public targets visible: p75 LCP no more than `2.5 s`, INP
  no more than `200 ms`, and CLS no more than `0.1`.
- A single local fixture is lab evidence, not a p75 claim. Record reproducible
  lab measurements and bundle delta now; child `138` owns representative
  operational percentile closure.
- Common editor typing/commands and autosave scheduling must not block input.
- Navigation/OpenAPI lists use bounded or windowed rendering when the measured
  upper-bound fixture requires it.
- Search/navigation must not render or fetch every Page body invisibly.

## 15. Authorization And Tenant Isolation

Add explicit Project capabilities:

- `documentation.read`: Admin, Editor, Viewer;
- `documentation.write`: Admin, Editor;
- `documentation.site.manage`: Admin only;
- `documentation.comment`: Admin, Editor;
- `documentation.checkpoint`: Admin, Editor;
- reuse `publication.read`: Admin, Editor, Viewer;
- reuse `publication.create`: Admin, Editor;
- reuse `publish_link.manage`: Admin, Editor.

Every Documentation content mutation counts as a Project content mutation and
fails when the Project or selected Project Version is effectively read-only
under existing policy.

Update `project_route_capability` so Documentation Site/search routes are
classified before the current generic `route_template.includes("/versions")`
branch. Otherwise version-scoped Documentation writes would be incorrectly
treated as `project_version.manage` and Editors would be denied. Site and
Edition administrative routes map to `documentation.site.manage`; Page,
navigation, routing, media, OpenAPI, and Working Draft routes map to
`documentation.write`; comments map to `documentation.comment`; checkpoints
map to `documentation.checkpoint`; Publication and link routes retain their
existing publication capabilities.

Authorization order:

1. authenticate where required;
2. resolve Organization;
3. resolve Project and active Project Membership;
4. check capability and parent read-only state;
5. resolve selected Project Version;
6. resolve Site/Edition and exact nested resource within tenant/Project/version;
7. only then load Page body, comments, OpenAPI, Files, search, Revision, or
   Publication content.

Viewer can read Site/Edition/Page/comment/preview/Revision/Publication state but
cannot create/update/checkpoint/publish/link-manage. There are no Page ACLs.
Comments are available only to authenticated authorized Project members.

Public authorization resolves link slug and `resource_family`, then status,
expiry, visibility/password session, requested version entry, exact Site
Publication, and exact frozen subordinate resource. Cache lookup and search
occur only after access context is resolved. Revoked, expired, missing,
restricted, or bad-password access fails closed.

Negative tests must swap every Project, Organization, Project Version, Site,
Edition, Page, comment, OpenAPI File, Revision, Publication, link, and entry ID
independently and prove no existence/content leakage.

## 16. Audit And Access Evidence

### 16.1 Mutation actions

Register one logical transactional Audit Event for:

- `documentation.site_created`;
- `documentation.site_updated`;
- `documentation.edition_updated`;
- `documentation.page_created`;
- `documentation.page_updated`;
- `documentation.page_content_replaced`;
- `documentation.page_path_changed`;
- `documentation.navigation_replaced`;
- `documentation.routing_replaced`;
- `documentation.media_uploaded`;
- `documentation.openapi_inspected`;
- `documentation.openapi_inspection_applied`;
- `documentation.comment_thread_created`;
- `documentation.comment_reply_created`;
- `documentation.comment_resolved`;
- `documentation.comment_reopened`;
- `documentation.revision_created`;
- `documentation.publication_created`;
- common link create/update/manifest switch/rollback/revoke actions extended
  with `resource_family=documentation_site`.

The atomic Site-create command emits one `documentation.site_created` event
whose typed Change Items cover the created Site, Edition, Working Draft, and
optional initial Page; it does not emit four duplicate user-action events.
Likewise, a publish command that creates a Revision and Publication emits one
publication action with typed Revision/Publication/link changes. A separate
manual checkpoint emits `documentation.revision_created`.

Inspection upload/parse failure is not a committed domain mutation Audit Event.
Successful File creation and successful source apply follow existing File/audit
transaction policy without duplicate logical user actions.

Change Items may contain IDs, type, status, safe label, count, digest prefix if
policy allows, Row Version before/after, Revision number, Publication sequence,
and reason. They must not contain Page/block/comment/reply/OpenAPI body, raw
query, protected path/content, password, token, or private URL.

### 16.2 Meaningful access

Register meaningful reads/attempts for:

- authenticated Site/Page/preview/Revision/Publication;
- comment thread view;
- OpenAPI inspection/source/reference;
- internal search without query text;
- public Site/Page/search/operation/protected asset;
- password/revoked/expired/denied public outcomes;
- checkpoint/publication/rollback denials and failures where existing evidence
  policy applies.

Use stable root resource and Project resolution in the access registry. Static
CSS/JS/image subrequest noise is excluded, while protected File delivery is
recorded. Access evidence contains no private content or secret.

Teach the access registry's root parser to recognize
`documentation-sites/:site_id`, Page/comment/OpenAPI/Revision/Publication
subresources, and `version_slug` routes before its generic Project fallback.
Successful nested reads root at the resolved Documentation Site (or Publish
Link for public access) while retaining `project_id`; denied pre-resolution
attempts use the safest already-resolved parent and never invent a resource ID.

Coverage registry tests must fail if a new mutation route lacks an atomic audit
command or a meaningful route lacks an explicit access policy.

## 17. Concurrency, Transactions, And Idempotency

- Create Site/Page/thread/reply/inspection apply/checkpoint/publication/
  Publish Link/rollback accepts a bounded `Idempotency-Key` scoped to actor,
  tenant, route, parent, and normalized request digest.
- Reusing a key with different input returns conflict.
- Site creation is one transaction for Site + Edition + Working Draft + optional
  Page + audit.
- Page content replacement locks/compares only that Page aggregate and replaces
  blocks/items/references/search projection atomically.
- Navigation/routing/OpenAPI/comment transitions lock their own aggregate.
- Checkpoint locks the Edition revision allocator and revalidates a complete
  consistent saved state in one repeatable transaction.
- Publication uses an Edition-scoped advisory/row lock so concurrent prepares
  return `documentation_publication_busy` or serialize deterministically.
- Revision and Publication sequences use locked `MAX+1` or a dedicated scoped
  allocator with unique constraints; retry never consumes/reuses visible
  sequence inconsistently.
- Link entry switch and Audit Event commit atomically only after preparation.
- Failed transactions leave no partial domain rows, Audit Event, live switch,
  or accessible projection.

The draft state token used by checkpoint/publication is a deterministic digest
over current Edition/Working Draft/Page/navigation/routing/OpenAPI Row Versions
and identities. The server computes and returns it; the client cannot invent
it. A mismatch returns 409 with the latest safe token and changed aggregate
summaries.

## 18. Search, Metadata, Cache, And Public Exactness

Internal search:

- selected Project Version only;
- active Documentation Sites/Editions/Pages only;
- latest server-saved Page state;
- tenant authorization before index/retrieval;
- no comments, immutable history, other artifact types, or Organization-wide
  promise.

Public search:

- exact selected Site Publication only;
- Publish Link access checked first;
- canonical Page/operation result URLs;
- exact frozen alias/redirect/gone behavior;
- no draft, later Publication, historical Publication, comment, or other link.

All public cache keys include:

- Publish Link ID and Row Version/policy context;
- selected entry ID and version;
- exact Site Publication ID/preparation version;
- Page/operation/asset identity;
- representation and language where relevant.

No public cache is keyed only by Site/Page/path. Link switch/rollback changes
selection atomically; old immutable caches may remain safely addressable only
by old exact identities but are not selected by the live entry.

Metadata:

- canonical URL matches current canonical public Page path;
- alias is permanent redirect to canonical;
- public link may be indexed and included in sitemap;
- restricted/password content is noindex and absent from unauthenticated
  sitemap;
- `gone` is excluded;
- social title/description/image, robots, and sitemap are derived from the exact
  Publication only.

## 19. Migration And Backwards Compatibility

- No legacy Documentation backfill exists.
- Existing Guide/Demo `published_artifact`, Publish Link IDs, slugs, entries,
  passwords/sessions, routes, APIs, and public/embed behavior remain compatible.
- Existing serialized publish responses remain accepted; new family
  discriminants must be additive or introduced through a union that parses old
  Guide/Demo shapes exactly as before.
- Clean install applies migrations `001` through `025`.
- Upgrade applies `025` over representative existing Guide/Demo links and
  proves every existing row backfills to `resource_family=artifact`.
- Supported down/up rehearsal restores the old artifact-only schema only after
  Documentation test data is removed through the migration's controlled down
  path; never pretend a production downgrade can preserve unsupported new
  Product data.
- Runtime-role grants, immutable triggers, maintenance bypass, reset/reseed,
  and audit schema verification are updated.
- Public paths `/g`, `/d`, existing embed paths, and existing
  `/api/v1/public/publish-links` artifact queries remain unchanged.
- No root Node engine increase is allowed by dependency adoption in this child.

Publication rollback is a product command and is unrelated to migration down.

## 20. TDD And Implementation Order

Runtime work follows red-green-refactor. Do not build UI against guessed server
shapes.

### Stage 0: Reconcile and protect

1. record checkpoint/worktree/migration/dependency state;
2. identify unrelated changes and exclude them;
3. update this plan if physical facts changed;
4. commit the accepted plan checkpoint before runtime.

### Stage 1: Dependency/adapters and domain contracts

1. write adapter proof tests and tiny prototypes;
2. select exact pins or documented Ossie-native fallback;
3. write failing Documentation domain policy tests;
4. add constants/types failing contract tests;
5. implement the domain package and adapters until focused tests pass;
6. record license, engine, bundle, and fallback findings.

Suggested commit: `feat(documentation): add domain contracts and adapter boundary`.

### Stage 2: Schema and authorized mutable API

1. write failing schema/unit/DB tests for tenant keys, Row Versions, aliases,
   comments, OpenAPI, immutable guards, runtime grants, and compatibility;
2. add migration `025`;
3. write repository/service/route/audit/access tests for Site/Page/navigation/
   routing/comments/OpenAPI/search;
4. implement repository, service, routes, authorization, audit, and access;
5. run clean/upgrade/down-up database tests.

Suggested commit: `feat(documentation): add relational authoring foundation`.

### Stage 3: Authoring portal

1. add failing route parser/guard/navigation/API/component tests;
2. implement Site library and typed Page/navigation/routing editor;
3. implement independent autosave/conflict preservation and private comments;
4. implement OpenAPI inspect/apply/reference and saved-draft preview;
5. verify keyboard/reflow/error/permission paths in components.

Suggested commit: `feat(web): add documentation authoring workbench`.

### Stage 4: Revision, Publication, link, and public reader

1. write failing revision/publication/immutability/failure/rollback DB/service/
   route tests;
2. extend Publish Link family without changing Guide/Demo behavior;
3. implement exact public API, reader/search/operation/asset/metadata routes;
4. implement Revision/Publication/publishing/rollback portal;
5. prove Publication `1` unchanged after draft and Publication `2`.

Suggested commit: `feat(documentation): publish exact site revisions`.

### Stage 5: Fixture, browser, smoke, and closeout

1. add deterministic Documentation fixture and CLI;
2. extend DB and V1 smoke commands;
3. execute the full 15-step real-browser matrix with agent-browser;
4. fix scoped findings and rerun until clean;
5. update current truth, evidence, this child, and Master `006` only for passed
   items;
6. audit staged files and commit scoped docs/evidence.

Suggested commits:

- `test(documentation): add vertical-slice browser fixture`
- `docs(documentation): close child 132 vertical slice`

Commit grouping follows cohesion; do not manufacture empty or partial commits.

## 21. Test And Verification Plan

### 21.1 Domain/package tests

- block union accepts every first-slice kind and rejects mixed/unsafe fields;
- slug/path/language/protocol normalization and reserved roots;
- navigation cycle, duplicate Page, positions, Home Page, internal links;
- permanent alias/no-reassignment and redirect/gone/cycle rules;
- OpenAPI version/self-contained/limit/operation-key policy;
- comment mention/anchor/body/transition policy;
- Revision digest/reuse/sequence and complete snapshot input;
- Publication preparation/reuse/sequence/link/rollback policy;
- search safe-field extraction excludes comments/private content.

### 21.2 Shared contract tests

- strict request/response parsing and unknown-key rejection;
- Page conflict/latest-safe response;
- discriminated block and Publish Link family unions;
- Guide/Demo publish contract regression;
- pagination/cursor/idempotency/language/path bounds;
- public Page/search/operation/metadata shapes contain no private fields.

### 21.3 Server unit and route tests

- every route status/error mapping;
- Admin/Editor/Viewer capability matrix;
- archived Project/Version read-only;
- tenant/Project/version/Site/Edition/nested-ID swaps;
- independent Page saves and same-Page conflict;
- idempotent create/apply/checkpoint/publication/rollback;
- comment anchor fallback and mentions;
- OpenAPI oversize/invalid/remote ref/expired/cross-actor inspection;
- media MIME spoof/malformed image/dimension or byte ceiling/cleanup/
  cross-tenant read/raw File-ID access;
- validation/checkpoint failure;
- preparation failure preserves live link;
- concurrent publication busy/serialization;
- public/restricted/password/revoked/expired/not-found/gone behavior;
- exact selected Publication only;
- safe protected asset delivery;
- internal/public search isolation;
- audit/access coverage and redaction.

### 21.4 Database integration

- clean `001`–`025` migration and upgrade from `024`;
- representative Guide/Demo rows survive backfill and APIs;
- every composite FK rejects cross-Organization/Project/version/Edition
  references;
- one Edition per Site/Project Version;
- Page/navigation/routing/alias/OpenAPI/comment constraints;
- Page aggregate compare-and-increment and independent Page concurrency;
- permanent aliases, Revision snapshots, Publications reject UPDATE/DELETE/
  TRUNCATE under runtime role;
- maintenance bypass works only through accepted controlled path;
- comments absent from snapshots/search/publication;
- protected File purge blocked for draft/Revision/Publication references;
- Revision and Publication sequences are independent, positive, monotonic, and
  unique under concurrency;
- failed prepare leaves link entry unchanged and no partial visible output;
- rollback only repoints and audit is atomic;
- search projection rebuild does not change immutable identity;
- migrate down/up rehearsal and reset/reseed.

Add the Documentation DB file and fixture DB file to `apps/server` `test:db`.

### 21.5 Web component tests

- route parsing/generation including multi-segment public paths and reserved
  `versions`;
- guard, breadcrumb, metadata, and portal navigation;
- role-specific controls;
- create/loading/empty/error/permission states;
- typed block commands and unsafe paste/link rejection;
- save queue, stale response, conflict preservation, offline/error truth;
- keyboard navigation editing and comment workflow;
- OpenAPI inspect/apply/no-Try-It/reference deep links;
- saved-draft preview warning;
- checkpoint/publication/failure/rollback focus/status;
- public reader version fallback only on explicit switch;
- missing versus alias versus redirect versus gone;
- search/access/password/revoked/expired and metadata states;
- accessible names, landmarks, focus restoration, and reduced motion hooks.

### 21.6 Smoke and broad verification

Focused commands, adjusted only to actual package scripts:

```bash
pnpm --filter @repo/documentation-domain test
pnpm --filter @repo/documentation-domain check-types
pnpm --filter @repo/types test -- documentation
pnpm --filter server test -- documentation
pnpm --filter web test -- documentation
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm lint
pnpm check-types
pnpm build
git diff --check
git status --short
```

If the new domain package follows existing package scripts without `test`, add
and document the exact script rather than claiming the command passed.

The V1 smoke flow must include the 15-step journey and retain existing setup,
auth, Project/version, Capture, Guide, Demo, carry-forward, publication,
password, public/embed, audit/access, and protected-File workflows.

## 22. Agent-Browser Validation Requirements

Use the installed `agent-browser` skill and real Chromium against running web/
server/database processes. Component/jsdom tests do not replace this evidence.
Use the deterministic Documentation fixture; do not create a second ad-hoc test
harness.

Record environment, commit, viewport, browser executable/version, fixture IDs,
commands, screenshots/evidence paths, console/network findings, and unsupported
browser limitations in
`docs/ui/132-documentation-site-first-vertical-slice-browser-evidence.md`.

Required browser passes:

1. Admin: create Site/Edition and two Pages.
2. Editor: author every safe block, navigation, alias/redirect/gone/internal
   link, OpenAPI reference, comments, preview, checkpoint, publish, mutate,
   republish, rollback.
3. Viewer: read internal state/history/preview/comments and prove mutation
   controls/routes fail.
4. Conflict: two browser contexts edit the same Page; local work survives and
   recovery is actionable; a different Page saves concurrently.
5. Public: public and explicit-version routes, canonical/alias/redirect/gone,
   navigation, internal links, operation deep links, search, sitemap/robots/
   social metadata, version switch fallback, missing 404.
6. Access: restricted/password success/failure, revoked, expired, direct asset,
   cross-link/cross-version attempts, no private content leakage.
7. Failure: injected publication preparation failure leaves the currently live
   exact Publication visible.
8. Immutability: Publication `1` remains unchanged after draft edit and
   Publication `2`; rollback returns exact Publication `1`.
9. Performance: measure small and accepted upper-bound fixtures, production
   bundle delta, public LCP/interaction/layout-shift lab signals, editor input/
   autosave responsiveness, and hidden over-fetch/rendering. Record that lab
   results do not establish production p75.

At desktop and 320 CSS px/reflow:

- keyboard-only complete critical authoring and reader journeys;
- visible focus, skip link, headings/landmarks, dialog/drawer containment,
  Escape, opener restoration, mutation focus fallback;
- accessible names/live regions and no serious axe issue;
- reduced-motion emulation;
- no unexpected horizontal overflow except bounded code;
- no uncaught console error, unhandled rejection, failed required request,
  mixed content, CSP violation, or secret in URL/storage/network logs.

Run Firefox/WebKit only if a supported executable/tool is genuinely available.
Record unavailable environments honestly; do not claim them.

## 23. Security And Threat Verification

Explicitly test:

- IDOR and tenant swaps across every nested identity;
- path traversal, encoded separators, Unicode normalization/case collisions,
  reserved roots, open redirects, redirect loops, unsafe query preservation;
- stored/reflected XSS through blocks, comments, OpenAPI, paths, metadata,
  search excerpts, code/examples, File names, and errors;
- dangerous protocols and remote OpenAPI `$ref`;
- YAML aliases/depth/node/CPU exhaustion and oversized input;
- raw File ID access and protected File purge;
- comment/search/publication/audit/access leakage;
- cache poisoning and cross-link/cross-version selection;
- password/session fixation/reuse across links;
- publication races, stale Row Versions, idempotency mismatch, partial
  transaction, and rollback to foreign Publication;
- immutable-row trigger bypass with runtime role;
- dependency license/engine/transitive and supply-chain review;
- restrictive CSP with no Try It network allowance added.

No log, Audit Event, Access Evidence, URL, browser storage, screenshot, or test
fixture committed to the repository may contain a real credential or private
customer content.

## 24. Documentation And Handoff

After runtime passes:

- update `CONTEXT.md` from accepted target to actual implementation only for
  behavior now shipped;
- update README/development/database/web/smoke docs with exact setup, routes,
  dependencies/fallback, limits, and verification;
- record the exact migration, package versions/licenses, adapter selection,
  public access/search/publication behavior, and known limitations;
- update Master `006` only for criteria genuinely passed;
- mark this child Complete with status, checklist, implementation log,
  verification commands/results, browser evidence, leftovers, and commits;
- hand child `133` the actual content/block/asset/snapshot contracts, adapter
  limits, protected-reference behavior, performance baseline, and unresolved
  non-blocking findings.

Do not rewrite child `133` as implemented. Its reservation must be re-expanded
against the actual child `132` result.

## 25. Completion Checklist

### Planning

- [x] Child `131`, grill, decision consolidation, Context, ADRs, Master `006`,
      and current codebase inspected.
- [x] Current runtime versus accepted target separated.
- [x] Exact planned files and read-only compatibility surfaces listed.
- [x] Domain, schema, migration, API, route, UI, security, permission,
      evidence, concurrency, compatibility, tests, browser, non-scope, and handoff
      specified.
- [x] Type-specific Site Publication retained; Documentation is not modeled as
      a Guide/Demo `published_artifact`.
- [x] Dependency proof and contract-preserving fallback defined.
- [x] Independent plan recheck against Master `006` and child `131` clean.
- [ ] Plan checkpoint committed before runtime.

### Implementation

- [ ] Adapter proof completed and exact pins/fallback recorded.
- [ ] Domain/constants/types implemented test-first.
- [ ] Migration/schema/runtime grants/immutable/protected-reference rules pass.
- [ ] Authorized mutable API and independent Page concurrency pass.
- [ ] Portal editor/comments/OpenAPI/preview pass.
- [ ] Revision/Publication/Publish Link/public reader/search/metadata pass.
- [ ] Failed preparation and atomic rollback pass.
- [ ] Existing Guide/Demo/Capture/extension behavior remains green.
- [ ] Deterministic Documentation fixture and V1 smoke pass.
- [ ] Real-browser/accessibility/reflow/motion/console/security evidence passes.
- [ ] Current truth and Master `006` updated only for shipped behavior.
- [ ] Scoped logical commits contain no unrelated/generated/secret material.

### Exit

- [ ] All 15 journey steps pass through API/database and real browser.
- [ ] Tenant/role/IDOR matrix passes.
- [ ] Comments/drafts/private data absent from Revision, Publication, public
      search/output, cache, audit, and access evidence.
- [ ] Publication `1` remains exact after later edits and Publication `2`.
- [ ] Rollback repoints without immutable mutation/rebuild.
- [ ] No open child-owned S1/S2 defect.
- [ ] Implementation log, verification record, leftovers, and child `133`
      handoff complete.

## 26. Planning And Implementation Log

- 2026-07-30: Expanded child `132` from the finally accepted child `131`
  decisions and Master Plan `006`.
- 2026-07-30: Rechecked the current repository: migration sequence ends at
  `024`; no Documentation runtime/dependency exists; portal routing is local;
  Publish Links are currently Guide/Demo-specific.
- 2026-07-30: Selected a type-specific `site_publication` plus an explicitly
  discriminated extension of the common Publish Link/link-entry policy. This
  preserves existing Guide/Demo `published_artifact` semantics and avoids a
  nullable universal publication table.
- 2026-07-30: Added a mandatory Tiptap/Fumadocs compatibility proof with
  contract-preserving Ossie-native fallbacks. Candidate research versions are
  deliberately not recorded as installed pins.
- 2026-07-30: Rechecked against Master `006`, all final child `131` decisions,
  and the actual repository. Closed gaps in minimum media upload, File-domain
  policy ownership, cross-table path uniqueness, child Row Versions,
  idempotency receipts/retention, hard safety ceilings, route-capability
  precedence, exact public metadata/redirect handling, and the static-SPA
  crawler boundary.
- Runtime implementation: not started.

## 27. Verification Record

Planning verification completed so far:

- confirmed every decision source exists;
- confirmed migrations currently end at `024`;
- confirmed there is no Documentation package/module/route/feature;
- confirmed existing Project capability, audit/access registry, Publish Link,
  fixture, smoke, Vite/local-route, and protected File patterns;
- confirmed reservations `133` through `140` use the accepted sequential
  filenames and boundaries.
- independently mapped the complete 15-step journey, child expansion contract,
  security/threat rows, persistence/publication rules, and child `133` handoff
  back to child `131` and Master `006`;
- local Markdown link validation across all scoped planning/current-direction
  docs: passed;
- Prettier check across all scoped Markdown: passed;
- child `132`–`140` filename/status/required-section assertions: passed;
- stale “expand child 132” active-direction scan: passed after synchronization;
- `git diff --check`: passed;
- scoped status: documentation/plan/current-direction files only; no runtime,
  migration, dependency, generated output, or browser artifact changed.

Not yet run:

- runtime unit/route/database/smoke/build/browser verification.

No runtime result may be inferred from this planning record.

## 28. Planning Leftovers And Handoff

Before the plan checkpoint, inspect the final scoped diff and commit only these
planning/current-direction files. At implementation preflight, decide exact
current dependency pins only through the Stage 1 proof, adjust migration number
only if another scoped migration has landed, and re-confirm the common Publish
Link migration design against every existing Guide/Demo constraint and
serialized response.

After child `132` closes, carry only these accepted later concerns into child
`133`: the remaining V1 typed blocks, Edition-owned snippets, exact Guide/Demo
Publication reference blocks, full Documentation Asset workflows, content/
asset product limits, and expanded immutable snapshot coverage. All other
future features remain with their reserved children.
