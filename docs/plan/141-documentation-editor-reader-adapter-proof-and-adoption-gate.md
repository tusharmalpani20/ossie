# Child Plan 141: Documentation Editor/Reader Adapter Proof And Adoption Gate

Date reserved: 2026-07-31

Last implementation-readiness audit: 2026-08-05

Status: Implementation-ready planning baseline. Runtime execution has not
started. The executing goal must complete Stage 0 and the independent plan
recheck before installing packages or creating proof code.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/140-post-v1-documentation-decision-gate.md`

Accepted authority:

- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`, section 11
- ADRs `0027`–`0034`
- the final Q16/Q17 answers in
  `docs/grill/2026-07-31-post-v1-documentation-decision-gate.md`

## 1. Objective

Produce isolated, removable, non-production comparisons between:

1. the shipped native Page/snippet editor and a bounded Tiptap editor-core
   adapter; and
2. the shipped native exact-Publication reader and bounded client-safe
   Fumadocs headless primitives.

Close with an evidence-derived `adopt`, `partial-adopt`, or `reject`
disposition for each candidate. This child proves and decides adapter use; it
does not modernize the production authoring or reader routes.

## 2. Completion Meaning

This child is complete only when:

- package versions, licenses, peer constraints, advisories, transitive
  footprint, and official compatibility guidance have been refreshed;
- native baseline measurements and representative fixtures are recorded before
  candidate code changes;
- pure conversion and failure tests precede candidate implementation;
- the candidate and native implementations are exercised with the same
  authorized fixture data on existing real routes;
- every mandatory gate passes for an adopted surface;
- each candidate has one final disposition and exact rationale;
- rejected packages and disposable proof UI are removed;
- any retained dependency or seam has a named Child `142` or `143` owner;
- this plan contains final status, checklist, implementation log, verification,
  limitations, leftovers, handoff, and commit IDs;
- the implementation is independently close-rechecked.

A more modern appearance or a larger feature list is not completion evidence.

## 3. Stage 0 — Required Preflight

Before any package operation:

1. read `AGENTS.md`, `CONTEXT.md`, ADRs `0027`–`0034`, Master `007`,
   child `140`, its grill, and this child;
2. confirm child `140` and Master `006` remain complete;
3. inspect `git status --short`, recent commits, and overlapping changes;
4. inspect current versions in `package.json`, `apps/web/package.json`, and
   `pnpm-lock.yaml`;
5. inspect current Documentation editor, renderer, preview, public reader,
   initial-document bootstrap, route parser, server initial HTML, and fixture
   tests listed below;
6. seed and smoke the existing Documentation browser fixture before changing
   it;
7. record the current production build manifest and native route chunk sizes;
8. refresh official Tiptap/Fumadocs package data and record retrieval date,
   exact versions, license, peer dependencies, engines, release status,
   advisories, and unpacked/transitive footprint;
9. update this plan if code or package facts changed, then independently
   recheck it before continuing.

Routine code drift is agent-decidable. Any drift that changes authority,
immutable output, public URL, persistence, or permission meaning is a critical
decision and uses the Master `007` stop policy.

## 4. Current Shipped Baseline

Planning inspection on 2026-08-05 found:

- `apps/web` is a React 19.2 Vite 7 SPA with Ossie's custom route parser;
- Tiptap and Fumadocs are absent from manifests and lockfile;
- `DocumentationBlockEditor.tsx` edits the shared relational block graph;
- `DocumentationPageEditor.tsx` owns Page load, Row-Version save, 800 ms
  autosave, conflict/error states, assets, references, comments, and preview;
- `DocumentationSnippetPanel.tsx` reuses `DocumentationBlockEditor`;
- `DocumentationBlockRenderer.tsx` renders constrained shared blocks;
- public reads bootstrap from server-authorized exact-Publication JSON through
  `documentationInitialDocument.ts`;
- draft and Revision previews have different authority/cache semantics from
  public Publication reads;
- Try It is independently lazy-loaded and governed under ADR `0033`;
- the existing synthetic browser fixture includes Page blocks, snippets,
  OpenAPI operations, assets, comments, review, and public links;
- migrations end at `031`; this proof expects no migration.

These are planning facts to refresh, not permission to change the contracts.

## 5. Official Dependency Boundary

### 5.1 Tiptap candidate

Research the newest exact mutually available version of:

- `@tiptap/react`
- `@tiptap/pm`
- `@tiptap/starter-kit`

All selected Tiptap packages must use one coherent exact version. Do not mix
independently staggered `latest` patches.

Explicitly excluded:

- `@tiptap/ui-components` and templates while official React 19 compatibility
  remains incomplete;
- Pro extensions, private registries, conversion services, Cloud, AI,
  Collaboration, Hocuspocus, and Yjs;
- arbitrary third-party extensions;
- HTML as persisted or trusted intermediary.

### 5.2 Fumadocs candidate

Research the smallest exact `fumadocs-core` package that exposes client-safe:

- page-tree types;
- `useBreadcrumb`;
- TOC `AnchorProvider`, `ScrollProvider`, and `TOCItem`.

Explicitly excluded:

- `fumadocs-ui`, `@fumadocs/base-ui`, themes, layouts, and framework root
  providers;
- Loader/Dynamic Loader in browser code;
- Fumadocs MDX, content collections, file-system sources, Remark/Rehype
  customer-content parsing, and generated `.source`;
- Fumadocs search replacement, hosted search, or a second search index;
- React Router, TanStack Router, Next.js, Waku, Astro, or a second app/server.

Fumadocs receives an already authorized, privacy-minimized projection. Page
trees must contain only IDs, titles/labels, and existing public URLs—never
passwords, access state, private redirects, comments, reviewer data, Try-It
configuration, unpublished content, or asset internals.

### 5.3 Primary research references

Refresh these primary sources and exact registry records on the execution date:

- [Tiptap React installation](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Tiptap UI Components compatibility](https://tiptap.dev/docs/ui-components/getting-started/overview)
- [Tiptap React changelog](https://tiptap.dev/docs/resources/changelog/react)
- [Tiptap repository license](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md)
- [@tiptap/react registry record](https://www.npmjs.com/package/%40tiptap/react)
- [Fumadocs headless introduction](https://www.fumadocs.dev/docs/headless)
- [Fumadocs Loader API](https://www.fumadocs.dev/docs/headless/source-api)
- [Fumadocs page tree](https://www.fumadocs.dev/docs/headless/page-tree)
- [Fumadocs breadcrumb](https://www.fumadocs.dev/docs/headless/components/breadcrumb)
- [Fumadocs TOC](https://www.fumadocs.dev/docs/headless/components/toc)
- [Fumadocs repository and license](https://github.com/fuma-nama/fumadocs)
- [fumadocs-core registry record](https://www.npmjs.com/package/fumadocs-core)

Record retrieval timestamp and distinguish official compatibility statements
from agent inference. Do not use search-result snippets as the final version pin.

### 5.4 Required supply-chain checks

Before adoption:

- install through pnpm with exact versions and update only the intended web
  manifest/lockfile;
- run a frozen install after the lockfile change;
- run production audit and inspect high/critical findings in the reachable
  shipped graph;
- inspect licenses of direct and relevant transitive packages;
- build with sourcemaps/manifest as locally permitted and inspect chunk
  inclusion;
- verify rejected proof dependencies disappear from manifest, lockfile, and
  build output.

If official provenance cannot be refreshed after bounded retries, or an
incompatible license/required hosted service/unresolved reachable
high-or-critical advisory remains, reject that candidate and continue native.
No user decision is needed for that rejection.

## 6. Proof Architecture

### 6.1 Shared adapter contracts

Create proof contracts under:

- `apps/web/src/features/documentation/adapters/documentationEditorAdapter.ts`
- `apps/web/src/features/documentation/adapters/documentationReaderAdapter.ts`

The editor contract accepts shared `DocumentationBlock[]`, read-only/write
mode, and an `onChange(DocumentationBlock[])` callback. It never accepts a
save client, session, authorization object, or server endpoint.

The reader contract accepts one already-authorized projection with:

- resource class: `publication | draft_preview | revision_preview`;
- pages and navigation already present in the existing response;
- selected Page ID/path;
- existing URL builder callbacks;
- headings derived from constrained blocks.

Adapters may return presentation state only. They cannot load data, select a
different Publication, search a wider scope, authorize access, or mutate
content.

### 6.2 Tiptap proofs

Implement two separately scored shapes:

1. **Prose-field proof** — only paragraph, heading, quote, callout text, and
   list-item text use Tiptap. Block/list item IDs, positions,
   `expected_version`, block kind, heading level, callout tone, attribution,
   and list kind stay in Ossie React state. Non-prose blocks stay native.
2. **Whole-graph proof** — represent every currently accepted block kind in a
   constrained Tiptap schema only to prove whether exact lossless round-trip is
   feasible. No opaque JSON blob, HTML fallback, dropped unknown node, or
   regenerated identity is allowed.

Pure converters live in proof-owned files and are tested before UI mounting.
They must reject unsupported nodes/marks and malformed paste/drop input without
mutating the last valid shared block graph.

Tiptap state is ephemeral. Initial content is derived from shared blocks and
every accepted change emits shared blocks immediately; saving still occurs only
through existing Page/snippet clients and Row-Version contracts.

### 6.3 Fumadocs proofs

Build an Ossie projection from the existing authorized public snapshot and
compare only these named primitives:

- page-tree shape for the existing navigation;
- breadcrumb derivation for the current canonical path;
- heading TOC behavior over existing stable block anchor IDs.

Do not use Fumadocs Loader or let it generate canonical routes. Ossie's route
parser, selected Publication, search API, initial HTML, metadata, sitemap,
robots, redirect/gone, CSP, assets, and Try-It remain unchanged.

Also instantiate the projection against draft-preview and exact-Revision
fixtures in unit/component tests to prove that one resource class cannot leak
into another. The browser proof is public exact-Publication only unless the
same client-safe primitive is deliberately compared in the existing authorized
preview route.

### 6.4 Existing-route proof seam

Use a development-only query selector on the existing synthetic fixture:

- Page editor:
  `?__documentation_adapter_proof=tiptap-prose`
- Page editor:
  `?__documentation_adapter_proof=tiptap-graph`
- public exact-Publication reader:
  `?__documentation_adapter_proof=fumadocs-headless`

Requirements:

- selector is honored only when `import.meta.env.DEV`;
- normal production and test routes remain native;
- candidate modules are lazy-loaded after authorization/data loading;
- proof mode uses the same API clients, fixture identities, and route;
- production build tests prove the query has no selectable proof behavior;
- no new public route or standalone browser harness is created;
- the selector and proof comparison panel are removed before closure unless a
  selected seam is intentionally carried forward and named in the handoff.

## 7. Exact File Ownership

### 7.1 Mandatory inspect/read set

- `apps/web/package.json`, root `package.json`, `pnpm-lock.yaml`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/routes.ts` and `routes.test.ts`
- `apps/web/src/features/documentation/DocumentationBlockEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationSnippetPanel.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.tsx`
- `apps/web/src/lib/documentationInitialDocument.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `packages/types/src/documentation.ts`
- `packages/documentation-domain/src/policies/documentation-content-policy.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- corresponding existing tests and Child `139` browser evidence.

### 7.2 Expected proof write set

Names may be adjusted during Stage 0 only to match established patterns:

- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/src/App.tsx` and its focused test if needed for the dev-only seam
- new `apps/web/src/features/documentation/adapters/` contracts/converters
- new `DocumentationAdapterProofPanel.tsx` and focused tests/styles
- existing editor/reader component tests only where injection is necessary
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts` and its
  tests only if representative existing data is missing
- `docs/ui/2026-08-05-documentation-adapter-proof.md` (use actual execution
  date if later)
- this plan and Master `007`.

### 7.3 Forbidden write set

- migrations, repositories, services, production API schemas, public route
  shapes, access policies, audit semantics, or persisted block schemas;
- `apps/docs`, extension, Guide, Demo, Capture, auth, setup, or deployment
  code;
- customer content or private browser evidence.

A discovered need for a forbidden write means the candidate fails this proof;
it is not permission to broaden the child.

## 8. Representative Fixture Matrix

The same exact IDs and data must drive native/candidate comparisons:

- all accepted block kinds, including nested list/table/tab identities;
- snippet references and snippet editing;
- internal Page links with stable block anchors;
- Documentation and Capture assets with required alt text;
- Guide/Demo Publication references;
- one supported and one unsupported OpenAPI operation;
- Page comments anchored to Page and block identities;
- Project Editor write, Project Viewer read-only, unauthenticated public, password public,
  internal-only denial, revoked/expired/unavailable states;
- default and explicit-version public URLs;
- canonical redirect, gone path, search result, and no-result;
- large but in-policy Page/navigation fixture for performance comparison.

Only synthetic values are allowed.

## 9. Mandatory Gates And Scorecard

### 9.1 Non-negotiable gates

Any failure forces `reject` for the affected surface:

- source-of-truth, authorization, URL, publication, and route contracts remain
  unchanged;
- exact shared block and nested identity round-trip is lossless for every
  surface claimed;
- unsupported/malformed input fails closed without data loss;
- no credential/private/unpublished data enters candidate projections;
- existing save/conflict/read-only/public-access negative tests pass;
- React 19/Vite production type-check and build pass;
- no serious/critical axe violation, keyboard trap, focus loss, or two-
  dimensional 320px page overflow is introduced;
- no unhandled console exception or failed request is introduced;
- license/audit/frozen-install checks pass;
- removal/rollback restores native behavior without data conversion.

### 9.2 Comparative measurements

Record native and candidate values from the same build/fixture:

- initial app and route lazy chunk raw/gzip;
- route load and candidate lazy-load timing;
- 20 representative editor changes and navigation interactions, including any
  > 100 ms main-thread task;
- mount/unmount repetition for listener or memory-growth symptoms;
- DOM node count on the representative large fixture;
- task completion and error count for keyboard edit, reorder, search,
  navigation, and copy/link actions.

Adoption requires no material regression. As a planning guardrail:

- candidate code must remain route-lazy and add no candidate bytes to unrelated
  initial routes;
- a Tiptap production authoring chunk increase above 100 kB gzip, or a Fumadocs
  reader chunk increase above 35 kB gzip, defaults to reject unless tree-shaken
  exact evidence reduces it before closure;
- median representative interactions may be no slower than 20% over native and
  may introduce no new >100 ms task;
- any repeated mount listener/heap growth must be understood and fixed.

These are local comparative gates, not production p75 claims.

### 9.3 Final dispositions

**Tiptap:**

- `adopt`: whole-graph proof passes every block/identity/interaction gate and
  is superior to native on at least two recorded usability measures.
- `partial-adopt`: prose-field proof passes; whole graph does not; exact named
  prose kinds move forward while structural/reference/media/API blocks remain
  native.
- `reject`: neither allowed shape passes or cost/maintainability is worse.

**Fumadocs:**

- `adopt`: all selected headless page-tree/breadcrumb/TOC primitives pass and
  materially improve navigation/wayfinding without framework/source authority.
- `partial-adopt`: only named primitives pass; retain only those named imports.
- `reject`: primitives require prohibited providers/routes/sources, regress
  behavior/accessibility/performance, or add no measurable value.

Appearance alone cannot break a tie. A tie selects the smaller native surface.

## 10. Test-First Verification

Write failing tests first for:

- Tiptap prose and whole-graph round-trip;
- preservation of IDs, positions, expected versions, and nested IDs;
- unsupported nodes/marks/paste/drop;
- Page/snippet parity and read-only behavior;
- Fumadocs projection privacy allowlist;
- duplicate/canonical URL and active breadcrumb/TOC behavior;
- separation of Publication, draft, and Revision inputs;
- DEV-only proof selector and production-native behavior;
- candidate lazy-load failure restoring native UI.

Then run, at minimum:

- focused new adapter/component tests;
- existing BlockEditor, PageEditor, SnippetPanel, BlockRenderer, public reader,
  preview, route, initial-document, and API-operation tests;
- `pnpm --filter web check-types`
- `pnpm --filter web lint`
- `pnpm --filter web build`
- relevant server initial-HTML/public-route tests if any server projection is
  inspected or touched;
- frozen install and production audit after package changes;
- `git diff --check` and scoped-path review.

No schema/DB suite is required unless Stage 0 discovers an actual shared-
contract change, which is outside this proof and should reject the candidate.

## 11. Agent-Browser Evidence

Seed the existing fixture and validate real existing routes in headless
Chromium:

- native baseline and each proof selector;
- desktop and 320 CSS-pixel width;
- 200% zoom/reflow;
- keyboard-only edit, insertion, selection, reorder, undo/redo where offered,
  navigation, breadcrumb/TOC, and focus restoration;
- Project Editor and Project Viewer Page editor behavior;
- unauthenticated/public, password, internal denial, revoked/unavailable reader
  states;
- loading, empty, unsupported, candidate-chunk failure, and recovery;
- reduced motion;
- axe WCAG A/AA scan, accessibility tree, console errors, and failed requests.

Record engine/tool versions, exact fixture identity, viewport, zoom method,
screenshots, axe/incomplete results, console/network review, and sanitized
measurements. Firefox/WebKit are attempted if supported; they are optional in
this proof, while Chromium is mandatory. Never record cookies, passwords,
tokens, private URLs, credentials, raw OpenAPI input, or customer data.

## 12. Migration, Compatibility, Security, And Rollback

- Migration: none.
- API/schema: none.
- Persistence: unchanged shared blocks/relational rows.
- Compatibility: existing stored drafts, Revisions, Publications, imports,
  exports, Carry-Forward, search, comments, assets, and URLs must require no
  rewrite.
- Security: adapters receive minimum authorized projections and cannot fetch,
  authorize, execute, evaluate, or persist framework state.
- Rollback: remove dev selector, proof modules, and rejected dependencies; the
  native implementation remains the reference throughout.

## 13. Explicit Non-Scope

- production modernization;
- new block kinds/marks or schema normalization;
- collaboration, presence, offline mutation, AI, cloud services;
- MDX/HTML/React/custom-component authority;
- Fumadocs routing/search/content source/layout migration;
- new endpoint, migration, public route, static export, SDK, or Try-It change;
- accepted-later features or unrelated UI redesign.

## 14. Execution And Commit Stages

1. preflight and plan refresh;
2. docs-only independent plan recheck;
3. native baseline tests/evidence;
4. Tiptap converter proof;
5. Tiptap browser comparison;
6. Fumadocs projection proof;
7. Fumadocs browser comparison;
8. dependency/build/audit scorecard;
9. dispositions and cleanup;
10. close-recheck and records.

Suggested logical commits:

- `test(documentation): establish adapter proof contracts`
- `test(documentation): compare editor and reader adapters`
- `docs(documentation): record adapter adoption gate`
- optional cleanup commit removing rejected proof dependencies/UI.

Do not commit unrelated work.

## 15. Checklist

### Preflight and plan gate

- [ ] Predecessor/master/ADRs/current code/worktree reread.
- [ ] Official version/license/peer/advisory research refreshed.
- [ ] Native fixture and build baseline recorded.
- [ ] Plan refreshed and independently rechecked.

### Tiptap proof

- [ ] Failing conversion/identity/unsupported tests established.
- [ ] Prose-field proof completed.
- [ ] Whole-graph feasibility proof completed.
- [ ] Page/snippet/read-only/save/conflict behavior compared.
- [ ] Browser/accessibility/bundle/performance evidence recorded.
- [ ] Final Tiptap disposition and exact retained/removed packages recorded.

### Fumadocs proof

- [ ] Failing projection/privacy/navigation tests established.
- [ ] Public/draft/Revision resource separation proven.
- [ ] Client-safe page-tree/breadcrumb/TOC proof completed.
- [ ] URL/search/initial-HTML/access authority remains native.
- [ ] Browser/accessibility/bundle/performance evidence recorded.
- [ ] Final Fumadocs disposition and exact retained/removed packages recorded.

### Closure

- [ ] Rejected proof UI/dependencies removed.
- [ ] Production build exposes no proof selector.
- [ ] Focused and broad proportional verification passed.
- [ ] Status/log/evidence/limitations/leftovers/handoff/commits updated.
- [ ] Independent close-recheck clean.
- [ ] Master `007` Child `141` lifecycle updated.

## 16. Implementation Log

Not started. Append dated entries; never rewrite planning expectations as
completed facts.

## 17. Verification Record

Not started. Record exact commands, counts, versions, routes, fixture IDs, and
results during execution.

## 18. Leftovers And Handoff

At planning time, no user-input blocker remains. The final handoff must state:

- Tiptap disposition and exact selected authoring surface for Child `142`;
- Fumadocs disposition and exact selected reader primitives for Child `143`;
- retained packages/exact versions/licenses or confirmation of removal;
- retained adapter contracts and fallback;
- evidence limitations assigned to Child `145`;
- all rejected approaches and why they must not be reopened casually.

Child `142` must implement the recorded branch; it must not rerun the product
decision based on preference.
