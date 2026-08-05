# Child Plan 143: Documentation Reader Experience Modernization

Date reserved: 2026-07-31

Last implementation-readiness audit: 2026-08-05

Status: Conditionally implementation-ready. Execute only after Child `142`
is complete and independently close-rechecked. Child `141` determines the
Fumadocs headless/full-selected, named partial, or native branch.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessors:

- `docs/plan/141-documentation-editor-reader-adapter-proof-and-adoption-gate.md`
  for reader disposition
- `docs/plan/142-documentation-authoring-experience-modernization.md` for the
  current shared renderer and bundle baseline

Authority:

- ADR `0027`: exact Edition-wide Revisions and Publications
- ADR `0028`: database-authoritative constrained content
- ADR `0029`: authorized public reader adapter
- ADR `0033`: browser-direct origin-governed Try It
- Master `007`, current routes, and the final Child `141` reader disposition

## 1. Objective

Modernize public exact-Publication reading and the related authorized draft and
Revision preview presentation using exactly the Child `141` branch:

- selected Fumadocs headless page-tree/breadcrumb/TOC primitives;
- a named partial subset of those primitives; or
- an Ossie-native reader modernization.

Preserve access, immutable resource selection, canonical URLs, search, assets,
redirect/gone behavior, initial crawler HTML, SEO metadata, CSP, caching,
version selection, and Try-It authority.

## 2. Preflight And Branch Lock

Before implementation:

1. read and copy Child `141`'s final Fumadocs disposition, exact retained
   imports/packages, scorecard, limitations, and evidence into this plan;
2. read Child `142`'s renderer changes, leftovers, build measurements, and
   close-recheck;
3. inspect current route parser/App composition, public API clients, initial
   document reader, public component, draft/Revision previews, block renderer,
   server public routes/HTML bootstrap/CSP/cache behavior, fixtures, and tests;
4. verify current worktree and preserve unrelated changes;
5. confirm no proof-only query selector/UI remains unless this child removes it;
6. refresh exact file plan and independently recheck.

Replace the placeholder:

`Selected branch: fumadocs-headless(<exact imports>) | native`.

A production-only failure of retained Fumadocs code selects the native fallback
without a user decision. Do not add a router/provider/source system to rescue
the package.

## 3. Three Resource Classes Must Stay Distinct

### 3.1 Public exact Publication

Input is the exact authorized Publication selected by a Publish Link entry and,
when present, Project Version slug. It may be public, password-protected, or
internal. It has immutable Pages/navigation/assets/snippets/OpenAPI operations
and public caching/SEO behavior.

Fumadocs/native presentation cannot select another Revision/Publication, merge
current draft state, or infer access.

### 3.2 Authenticated mutable draft preview

Input comes only from the existing authenticated preview API and represents the
latest server-saved draft. It is not public, not crawler content, and excludes
local unsaved editor changes. It must use no public cache or metadata behavior.

### 3.3 Authenticated exact Revision preview

Input is one immutable Revision resolved by Project/Site/revision number under
membership authorization. It is not a public Publication and cannot inherit a
Publish Link or public viewer session.

Shared presentation helpers must require the resource class explicitly. A
function that accepts an ambiguous `version` or generic unverified snapshot is
not acceptable.

## 4. Reader Behavior Rules

### 4.1 Public access states

Preserve:

- unauthenticated public access;
- password challenge, wrong password, successful memory/cookie-backed viewer
  session under existing server contract;
- internal-only denial without content bootstrap;
- revoked, expired, archived, unavailable, unknown slug/version, and unknown
  Page behavior;
- no enumeration of private Publication or Page details in errors;
- retry without discarding a successful authorized snapshot.

### 4.2 URLs and navigation

Existing URL shapes remain:

- `/docs/:slug/:pagePath?`
- `/docs/:slug/versions/:versionSlug/:pagePath?`
- existing operation routes under those bases.

Rules:

- Ossie generates canonical/public URLs;
- explicit versions remain explicit;
- aliases redirect to the current canonical target as currently defined;
- retired paths preserve redirect or gone behavior;
- Page and stable block anchors remain linkable;
- selected Fumadocs page-tree/breadcrumb primitives receive prebuilt Ossie
  URLs and cannot rewrite them;
- duplicate URLs or unresolved navigation nodes fail closed to the native
  navigation representation.

### 4.3 Reader composition

Provide a clear responsive shell with:

- skip link and one main landmark;
- Site/Project Version context;
- current Page title/description;
- mobile-accessible navigation;
- breadcrumbs when the selected branch supports them;
- on-page heading TOC only when headings exist;
- search with loading, results, empty, error, and keyboard behavior;
- constrained block content;
- previous/next navigation derived from authorized navigation;
- API reference/Try-It experience only for operations present in the exact
  snapshot.

Native modernization must deliver the same product outcomes without imitating
Fumadocs-specific APIs.

### 4.4 Search

Use only existing Ossie search endpoints and exact Publication/draft scope.
Fumadocs/Orama search is prohibited. Preserve query bounds, result links,
permission filtering, empty/error states, and no unpublished body leakage.

### 4.5 Initial document and hydration

- public server HTML continues to authorize first;
- bootstrap JSON contains only the selected public representation and remains
  safely serialized;
- client consumes a matching slug/version/path once;
- hydration may not flash a different Page or unauthorized navigation;
- failed/mismatched bootstrap falls back to existing authorized fetch behavior;
- crawler-visible title/description/canonical/content remain present as defined
  by current server routes;
- no Fumadocs Loader/source is initialized in the browser.

### 4.6 SEO, cache, and security headers

Preserve current canonical, description/social metadata, sitemap, robots,
ETag/304, cache-control, CSP, referrer, and representation behavior. Any server
edit requires focused initial-HTML/header tests and must not broaden CSP to
unsafe script/eval for an adapter.

### 4.7 Assets and embedded references

- assets use existing authorized file routes;
- alt text and captions remain visible/semantic;
- snippet expansion remains constrained;
- Guide/Demo Publication references remain exact frozen references;
- external links retain safe rel/referrer behavior;
- arbitrary iframe/HTML/React/MDX remains prohibited.

### 4.8 Try It and generated examples boundary

This child preserves the current lazy Try-It experience and does not implement
ADR `0034`. Fumadocs/native chrome may position the existing API operation
component, but cannot prefetch private configuration, send a request, alter
origin authority, or merge credentials into content. Child `144` owns inert
multi-language examples after this reader seam stabilizes.

## 5. Fumadocs Selected-Primitive Contract

If retained by Child `141`:

- map authorized navigation to a privacy-minimized page tree in a pure adapter;
- use `useBreadcrumb` only with current Ossie pathname and page tree;
- derive TOC entries from constrained heading blocks and stable Ossie anchor
  IDs;
- lazy-import runtime primitives on Documentation reader/preview chunks;
- wrap candidate failure with native breadcrumb/TOC/navigation fallback;
- import no `fumadocs-core/source*`, search, framework provider, link wrapper
  that changes routing, or server-only module;
- keep all styling in Ossie tokens/CSS.

If no primitive adds measurable value, the native branch implements breadcrumb,
TOC, navigation, and responsive polish directly.

## 6. Routes And APIs

No new route or endpoint is planned.

Public server/API owners include:

- `GET /docs/:slug`
- `GET /docs/:slug/*`
- `GET /docs/:slug/versions/:version_slug`
- `GET /docs/:slug/versions/:version_slug/*`
- existing public Documentation JSON/Page/search/asset/operation routes under
  `/api/v1/public/publish-links/.../documentation`
- existing authenticated preview and Revision routes.

Do not alter public templates, response schemas, cookies, access sessions, or
cache semantics. If UI needs more data, first derive it from the existing
authorized snapshot. A new public field/endpoint is a critical plan amendment.

## 7. Exact File Plan

### 7.1 Expected web files

- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.tsx`
- `apps/web/src/features/documentation/LazyDocumentationApiOperationExperience.tsx`
  only for composition/fallback
- retained reader adapter/projection from Child `141`
- new focused reader shell/navigation/TOC components under
  `apps/web/src/features/documentation/` if decomposition is warranted
- `DocumentationContentWorkflows.module.css` or a focused reader CSS module
- `apps/web/src/lib/documentationInitialDocument.ts`
- `apps/web/src/lib/documentationApi.ts` only for client typing over unchanged
  responses
- `apps/web/src/App.tsx` and `apps/web/src/lib/routes.ts` only when route
  composition, not URL semantics, requires it
- `apps/web/package.json`/`pnpm-lock.yaml` only for Child `141` retained
  Fumadocs package.

### 7.2 Expected tests

- public reader, draft preview, Revision preview, block renderer, lazy API
  operation, initial document, API client, App/routes tests corresponding to
  touched files;
- retained reader adapter projection/privacy tests;
- current server route tests for initial HTML, CSP, access, redirect/gone,
  search, asset, operation, sitemap/robots, ETag/304.

### 7.3 Conditional server files

Only if a proven existing bug blocks parity:

- `apps/server/src/modules/documentation/documentation.routes.ts`
- focused route tests;
- `apps/server/src/app.ts` only for existing bootstrap composition.

No repository/service/migration change is expected. Fumadocs may not enter
server persistence or routing.

### 7.4 Forbidden ownership

- `apps/docs`;
- new router/framework/content source/search index;
- authoring behavior not required for renderer compatibility;
- generated examples (Child `144`);
- accepted-later static export/domains/feedback/analytics/localization.

## 8. Schema, Migration, Compatibility, And Rollback

- Migration: none.
- Persisted type/schema: none.
- API response: unchanged unless a separately rechecked pre-existing omission
  is proven.
- Existing URLs/bookmarks/anchors/embeds: unchanged.
- Existing public/password/internal links: unchanged.
- Existing Publications: no regeneration.
- Rollback: select native presentation and remove retained Fumadocs imports;
  authorized snapshots and URLs need no conversion.
- Import/export/Carry-Forward: unaffected because reader state is derived.

## 9. Security And Permission Verification

Prove negative cases:

- no initial HTML/bootstrap for unauthorized internal/password content;
- wrong Organization/Project/Revision cannot be read through preview routes;
- revoked/expired/unknown returns existing safe behavior;
- page tree/breadcrumb/TOC contains only allowlisted public labels/URLs;
- comments/reviewers/draft data/redirect internals/Try-It policy/credentials are
  absent;
- adapter cannot fetch a URL or operation not supplied by Ossie;
- CSP is not weakened;
- link and bootstrap serialization remain injection-safe;
- public reader never imports authoring dependency chunks;
- Fumadocs source/search/server modules are absent from browser bundles.

## 10. Test-Driven Implementation Order

1. failing resource-class separation/projection privacy tests;
2. failing URL/navigation/breadcrumb/TOC tests;
3. public shell, responsive navigation, and search states;
4. draft and Revision preview parity;
5. initial-document/hydration and lazy failure fallback;
6. SEO/cache/CSP/redirect/gone/asset/operation regression;
7. accessibility/responsive/motion polish;
8. browser and bundle comparison;
9. close-recheck and record updates.

## 11. Verification Matrix

Run focused current commands for:

- reader/preview/renderer/adapter components;
- initial-document/API/routes;
- server public Documentation routes and initial HTML;
- shared Documentation types/domain policies when touched;
- web type-check, lint, production build;
- server type-check/tests when server files or route contracts are touched;
- frozen install/audit/license review if Fumadocs remains;
- DB/smoke only if shared/server persistence unexpectedly changes;
- `git diff --check`, route string scan, bundle manifest scan, scoped diff.

Compare public reader and related lazy chunks to the Child `141`/Child `142`
baseline; unrelated initial routes must not receive reader dependency bytes.

## 12. Agent-Browser Matrix

Use the existing seeded fixture and real routes:

- public default-version and explicit-version Page;
- public home, nested Page, search result, API operation;
- password prompt/wrong/correct;
- internal denial, revoked/unavailable, unknown, redirect, gone;
- authenticated draft preview;
- authenticated exact Revision preview;
- desktop and 320px;
- 200% zoom and reduced motion;
- keyboard skip link, navigation open/close, breadcrumb/TOC, search, result,
  content links, copy, and Try-It open/close without sending credentials;
- loading/empty/error/chunk-failure recovery;
- axe A/AA, accessibility tree, console/network failures;
- initial HTML/canonical/metadata and ETag/304 evidence through safe local URLs.

Chromium is required. Optional Firefox/WebKit limits are recorded honestly. Do
not capture passwords, sessions, tokens, customer URLs, or private content.

## 13. Accessibility And Performance Requirements

- logical landmarks/headings and one Page `h1`;
- current navigation state programmatically exposed;
- mobile navigation has focus containment/restoration and Escape;
- TOC indicates current heading without relying on color;
- targets at least WCAG 2.2 AA 24 CSS px minimum;
- no page-level two-dimensional scroll at 320px/200%;
- code/tables may use labeled local overflow;
- reduced motion disables nonessential transitions;
- no serious/critical axe issue or keyboard trap;
- selected reader dependency remains route-lazy;
- no new >100 ms representative navigation/search task and no material
  regression against baseline.

## 14. Acceptance Criteria

- branch matches Child `141` disposition;
- all three resource classes remain explicit and authorized;
- exact Publication/URL/access/search/SEO/CSP/cache behavior passes;
- reader/navigation/search is measurably clearer on recorded tasks;
- initial crawler HTML remains correct;
- no new schema, migration, router, source, or search authority;
- native fallback and dependency removal are proven;
- browser/accessibility/build/security/dependency checks pass;
- no unresolved in-scope S1/S2 issue.

## 15. Explicit Non-Scope

- authoring redesign;
- generated examples or SDKs;
- search engine replacement;
- MDX/Fumadocs UI/framework migration;
- static export, custom domains, feedback, analytics, translation;
- access/review/publication changes;
- arbitrary executable content;
- unrelated portal redesign.

## 16. Commit Strategy

Suggested commits:

- `refactor(documentation): establish authorized reader projection`
- `feat(documentation): modernize publication reader experience`
- `test(documentation): verify reader access url and seo contracts`
- `docs(documentation): close reader modernization`

## 17. Checklist

### Intake and plan

- [ ] Children `141` and `142` complete/close-rechecked.
- [ ] Selected reader branch/imports copied here.
- [ ] Shared renderer/bundle/leftover intake recorded.
- [ ] Current public/preview/server routes inspected.
- [ ] Plan refreshed and independently rechecked.

### Implementation

- [ ] Resource-class projection tests first.
- [ ] Public reader shell/navigation/breadcrumb/TOC modernized.
- [ ] Search/loading/empty/error states complete.
- [ ] Draft and Revision previews remain distinct.
- [ ] Initial document/hydration/fallback complete.
- [ ] URL/access/redirect/gone/asset/operation behavior preserved.
- [ ] Responsive/accessibility/motion work complete.
- [ ] Native fallback complete.

### Verification and closure

- [ ] Focused tests/types/lint/build pass.
- [ ] Server route/header tests pass.
- [ ] Dependency/frozen/audit checks pass if applicable.
- [ ] Agent-browser matrix passes.
- [ ] Bundle/performance evidence passes.
- [ ] Independent close-recheck clean.
- [ ] Status/log/evidence/limitations/leftovers/handoff/commits updated.
- [ ] Master Child `143` lifecycle updated.

## 18. Implementation Log

Not started. Append dated facts and the selected branch.

## 19. Verification Record

Not started. Record exact commands, routes, response/header checks, fixture
identity, measurements, and results.

## 20. Leftovers And Handoff

At planning time no user-input blocker remains. Child `144` receives:

- the stable component location where inert examples render;
- exact authorized descriptor shapes available in draft/Revision/Publication;
- selected reader lazy-loading and CSS constraints;
- accessibility/bundle limitations that affect example selection/copy;
- confirmation that mutable Try-It configuration remains separate.

Close reader defects here; do not disguise them as example work.
