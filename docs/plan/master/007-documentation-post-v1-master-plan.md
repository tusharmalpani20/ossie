# Master Plan 007: Documentation Post-V1 Experience

Date: 2026-07-31

Status: Planned and accepted. No child is implementation-ready. Child `141`
must be rewritten/expanded and independently rechecked before any prototype,
dependency, or runtime change.

Independent reservation re-audit: completed 2026-07-31 against Master `006`,
child `140`, ADRs `0027`–`0034`, the current caller graph, current package
manifests, and all children `141`–`146`. The re-audit tightened ownership,
proof mechanics, adapter boundaries, historical example reproducibility, and
cross-browser evidence without authorizing implementation.

Master plan number: 007.

Predecessor:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Accepted authority:

- `docs/grill/2026-07-31-post-v1-documentation-decision-gate.md`
- `docs/plan/140-post-v1-documentation-decision-gate.md`
- `docs/documentation-domain-decisions.md`, section 11
- `CONTEXT.md`
- ADRs `0027` through `0034`

Reserved child sequence:

- `docs/plan/141-documentation-editor-reader-adapter-proof-and-adoption-gate.md`
- `docs/plan/142-documentation-authoring-experience-modernization.md`
- `docs/plan/143-documentation-reader-experience-modernization.md`
- `docs/plan/144-documentation-generated-api-request-examples.md`
- `docs/plan/145-documentation-experience-accessibility-browser-and-performance-hardening.md`
- `docs/plan/146-documentation-post-v1-experience-final-closeout.md`

## 1. Objective

Modernize Product Documentation authoring and reading through evidence-gated
Tiptap and Fumadocs adapters, then add deterministic multi-language API request
examples, without changing Ossie's authoritative content, permission,
publication, access, or URL models.

The master succeeds only if the resulting experience is demonstrably better
than the shipped native V1 behavior and all existing contracts remain valid.
Tool adoption is not an objective by itself. If a candidate adapter fails its
gate, the corresponding implementation child improves the native UI instead.

## 2. Shipped Baseline

Master `006` and children `132`–`139` shipped and independently close-rechecked:

- Project-owned Documentation Sites with one Site Edition per Project Version;
- relational mutable Pages, navigation, snippets, redirects, settings, assets,
  OpenAPI Sources, comments, review, and operational state;
- Row-Version concurrency and explicit conflict recovery;
- immutable whole-Site Revisions and Site Publications;
- stable multi-version Publish Links with public/password/internal access;
- exact-Publication reader, search, assets, API references, canonical URLs,
  redirects/gone, sitemap, robots, and social metadata;
- inspected import/export/package portability and Carry-Forward;
- browser-direct origin-governed Try It with memory-only credentials;
- Audit and Access Evidence, protected Files, quotas, lifecycle, health, and
  recovery controls;
- Ossie-native React authoring and reader adapters;
- additive migrations through `031`.

Master `007` begins from that state. It is not a continuation of unfinished V1
work and may not relabel an accepted limitation as a defect merely to justify a
framework migration.

## 3. Truth Bands

### 3.1 Implemented now

Everything listed in section 2 is shipped. Tiptap and Fumadocs are not runtime
dependencies. Generated examples currently remain the bounded placeholder
examples shipped with child `137`, not the accepted multi-language registry.

### 3.2 Selected next

- bounded Tiptap authoring adapter proof;
- bounded Fumadocs reader adapter proof;
- evidence-gated authoring modernization;
- evidence-gated reader modernization;
- deterministic curl, browser Fetch, Node.js, Python, and Go request examples;
- extensible versioned language registry;
- combined accessibility, browser, motion, performance, security, dependency,
  and compatibility hardening;
- independent final closeout.

### 3.3 Accepted later, outside this master

- one-way Ossie-to-GitHub proposal export;
- human-first translations;
- verified custom domains;
- structured Helpful/Not helpful feedback;
- privacy-minimized aggregate analytics;
- exact-Revision external review invitations;
- ephemeral author presence;
- offline read-only snapshots;
- one typed disclosure component;
- deterministic static-site export for public Publications;
- permission-filtered Organization metadata discovery under a future Knowledge
  Platform owner.

### 3.4 Deferred or separately owned

- bidirectional Git synchronization;
- simultaneous collaborative editing;
- offline mutation and merge;
- permanent deletion;
- full SDK package generation/publication;
- direct cloud/CDN deployment and deploy hooks;
- production telemetry, distributed admission/rate limiting, durable jobs, and
  non-local File storage as cross-product operations;
- PostgreSQL client and server lint debt as maintenance;
- Video and unrelated product scope.

## 4. Source Of Truth And Adapter Ownership

| Concern                                                                                                 | Authority                                                             | Allowed adapter/derived form                                |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Site, Edition, Page, navigation, block, snippet, asset, OpenAPI, comment, review, Revision, Publication | PostgreSQL relational records                                         | Tiptap transient editor state; Fumadocs reader inputs       |
| File bytes                                                                                              | Protected File storage plus relational references                     | Authorized immutable asset response                         |
| Allowed block graph                                                                                     | Shared Zod contracts and Documentation domain policies                | Tiptap schema/nodes mapped losslessly to the accepted graph |
| Authorization                                                                                           | Server-side Organization/Project/Publish Link policy                  | Request-local UI visibility only                            |
| Public output                                                                                           | Exact immutable Site Publication selected by a Publish Link           | Fumadocs/native rendered view, search docs, caches          |
| API operation                                                                                           | Accepted exact OpenAPI descriptor in draft/Revision/Publication scope | Inert generated request text and separately governed Try It |
| URLs/canonical behavior                                                                                 | Existing Ossie route and routing policies                             | Adapter navigation components                               |
| Evidence                                                                                                | Append-only Audit/Access records                                      | Content-free diagnostics and test evidence                  |

Neither Tiptap JSON nor Fumadocs/MDX content may become persistence or
publication authority. The proof may not write a parallel source of truth.

### 4.1 Current module and caller map

Child expansion must begin from the current product graph rather than treating
"the editor" or "the reader" as one component:

- `apps/web/src/App.tsx` owns a custom route parser/switch. The product does not
  currently use React Router, and Product Documentation remains in `apps/web`,
  not the contributor-facing `apps/docs` application.
- `DocumentationPageEditor.tsx` and `DocumentationSnippetPanel.tsx` both call
  `DocumentationBlockEditor.tsx`; authoring conversion and identity tests must
  cover Pages and reusable snippets.
- `DocumentationPageEditor.tsx` also calls `DocumentationBlockRenderer.tsx` for
  preview, while `DocumentationDraftPreviewPage.tsx` renders an authorized
  mutable draft through the renderer.
- `PublicDocumentationReaderPage.tsx` consumes the serialized initial document,
  public snapshot, navigation/search, block renderer, and API-operation
  experience for one exact authorized Publication.
- `DocumentationRevisionPreviewPage.tsx`, `DocumentationOpenApiPanel.tsx`, and
  the public reader call `DocumentationApiOperationExperience.tsx`, which in
  turn calls `apps/web/src/lib/documentationTryItExamples.ts`.
- `apps/server/src/modules/documentation/documentation.routes.ts` owns initial
  crawler HTML, canonical/redirect/gone behavior, CSP, representation headers,
  and public route composition. `apps/web/src/lib/documentationInitialDocument.ts`
  validates and normalizes the browser bootstrap payload.

An expanded child may narrow this graph, but it cannot omit a direct caller
whose behavior or contract changes.

## 5. Experience Adoption Gates

### 5.1 Tiptap gate

Tiptap may be adopted only when the proof demonstrates:

- lossless round-trip for every in-scope current block and mark;
- stable Ossie block identities for comments, selection, reorder, import,
  checkpoint, Revision, Publication, and search;
- no acceptance of raw HTML, executable JavaScript, MDX, React components,
  arbitrary iframe, or unregistered extension nodes;
- paste/drop/input sanitization before authoritative mutation;
- correct Row-Version save/conflict behavior and local-work recovery;
- existing keyboard, screen-reader, focus, reduced-motion, zoom, and narrow
  viewport behavior is preserved or improved;
- acceptable dependency, bundle, render, interaction, and memory cost;
- no data migration is needed merely to adopt the adapter;
- a tested native fallback and rollback path exists.

The proof must compare two bounded shapes instead of presuming that Tiptap owns
the whole Page graph:

1. use Tiptap only inside selected prose-bearing fields while Ossie's ordered,
   typed block graph, IDs, references, and reorder state stay native; and
2. adapt the complete in-scope Page/snippet graph through a lossless transient
   Tiptap document.

`partial-adopt` is preferred when it improves prose editing without duplicating
or weakening typed reference, asset, table, tabs, API, Guide, Demo, or snippet
semantics. A selected scope must enumerate every handled block/mark; unselected
block kinds remain native rather than being coerced into generic rich text.

### 5.2 Fumadocs gate

Fumadocs may be adopted only when the proof demonstrates:

- input is an already-authorized exact Ossie Publication snapshot;
- existing public/internal routes, canonical URLs, redirects, gone outcomes,
  version selection, access modes, and initial crawler HTML remain correct;
- comments, drafts, private search terms, review detail, credentials, and
  unauthorized asset/OpenAPI state cannot enter public output;
- Ossie controls cache keys, search scope, CSP, Try-It authority, audit/access,
  and publication switching;
- no MDX or Fumadocs content source becomes authority;
- existing block/API-reference/asset rendering is lossless;
- accessibility, SEO, browser, dependency, bundle, and performance evidence is
  equal or better than the native reader;
- a tested native fallback and rollback path exists.

The proof must validate the exact package subset against the current React 19,
Vite, Tailwind, and custom `App.tsx` routing composition. It may not assume the
official React Router setup, introduce React Router/Next.js merely to satisfy a
framework guide, or move Product Documentation into `apps/docs`. Because the
Fumadocs Loader API is server-side, any source/page-tree use must remain a
derived projection on the correct side of the server/browser boundary; direct
rendering primitives may be evaluated independently.

Public Publication rendering, authenticated mutable-draft preview, and exact
Revision preview are separate input classes. Only the public surface may use an
already-authorized Publication adapter, and no public-reader assumption may
silently broaden draft or Revision access.

### 5.3 Gate outcomes

Each adapter receives exactly one recorded result:

- `adopt`: production child may use the bounded adapter;
- `partial-adopt`: production child may use only named components/primitives;
- `reject`: production child must improve the native implementation.

An adapter failure is a valid successful proof outcome. It does not block this
master and cannot be converted into lowered acceptance criteria.

## 6. Generated Request Example Contract

ADR `0034` governs this feature.

- Initial languages: curl, browser Fetch, Node.js, Python, and Go.
- A versioned registry owns language identity, display name, generator version,
  file extension, syntax label, and deterministic generation function.
- Input is one exact accepted OpenAPI operation plus its authorized immutable or
  mutable scope.
- Output is inert escaped text with credential/environment placeholders.
- Generation never reads entered Try-It values, performs a request, runs code,
  installs dependencies, resolves remote references, or publishes a package.
- Unsupported required input returns a safe explanatory result; the generator
  cannot invent a successful client.
- Additional languages require fixtures for paths, query, headers, supported
  bodies/auth placeholders, escaping, Unicode, and unsupported cases.
- Publication/export behavior must preserve exact output or enough pinned
  generator metadata to reproduce it.
- The child must explicitly choose and test the historical contract: either an
  immutable example-contract/generator version is stored in the existing exact
  Revision/Publication descriptor path, or every historical descriptor version
  remains permanently routed to its original generator. A current registry
  default may never silently change old Publication output.
- Generation uses documented OpenAPI examples/defaults and explicit
  environment/auth placeholders only. It is independent of mutable Try-It form
  values, approved private origins, credentials, browser memory, request/response
  bodies, and operator configuration.
- Full SDK packages remain outside this master.

## 7. Behavior Rules

- Existing save, preview, checkpoint, review, publish, rollback, import/export,
  Carry-Forward, lifecycle, search, and Try-It semantics remain unchanged unless
  an expanded child identifies and separately accepts a compatible refinement.
- UI hiding never replaces server authorization.
- Unauthorized IDs fail without revealing whether the resource exists.
- Exact Publication output never reads mutable draft state.
- Publication preparation finishes before any live pointer switch.
- A failed adapter render or example generation leaves authoritative state and
  the live Publication unchanged.
- Historical Revisions/Publications remain readable without regeneration.
- Existing native authoring/reader paths remain available until their selected
  replacement passes focused and full compatibility verification.
- Loading, empty, error, unsupported, denied, conflict, offline/error,
  destructive, and recovery states remain truthful.

## 8. Permission Rules

No new product role is accepted.

| Action                                         | Required authority                                            |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Run local proof against fixtures               | Developer/test environment only                               |
| Read/edit draft in selected authoring adapter  | Existing Project read/edit role and resource policy           |
| Save/reorder/comment/checkpoint/review/publish | Existing server-side action-specific authority                |
| Read internal preview/Revision/Publication     | Existing Project read authority                               |
| Read public/password Publication               | Existing Publish Link policy/session                          |
| View/copy generated examples                   | Same authority as the exact API operation/reference           |
| Change Try-It policy or send request           | Existing independent Try-It authority; example UI grants none |

Adapters receive already-authorized data or call existing authorized APIs. They
cannot broaden scope based on client state.

## 9. Security And Threat Model

| Threat                                        | Required control                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Tiptap/Fumadocs becomes a second authority    | One-way adapters over Ossie contracts; no framework-owned persistence                      |
| Unknown editor nodes or paste execute content | Exhaustive schema, sanitization, protocol allowlists, unsupported-node rejection           |
| Stored/reflected XSS                          | Constrained blocks, escaped rendering, CSP, safe code text, negative fixtures              |
| Public reader leaks draft/private state       | Authorization before load/projection/cache; public adapter receives exact Publication only |
| Route/cache confusion                         | Preserve canonical routes; key by Publication and access-policy context                    |
| Generated example contains credentials        | Placeholder-only generation isolated from Try-It component memory                          |
| Generated example performs work               | No eval, subprocess, network, package install, template hooks, or registry publish         |
| Malicious OpenAPI exhausts generator          | Existing descriptor bounds plus per-language output/time/operation ceilings                |
| Supply-chain compromise                       | Pin exact reviewed dependencies; license/advisory/transitive/build review                  |
| Adapter failure corrupts draft                | Existing Row Versions, validation, atomic mutation, conflict recovery, native rollback     |
| Accessibility regression                      | Automated and manual keyboard/focus/zoom/reflow/motion plus available AT proof             |
| Browser-specific behavior                     | Chromium, Firefox, WebKit matrix where supported; honest capability record                 |

No customer content, generated code, credentials, request bodies, response
bodies, or raw queries enter Audit/Access Evidence.

## 10. Schemas, Types, API, And Migration Strategy

### 10.1 Existing authorities to preserve

- `packages/constants/src/documentation.ts`
- `packages/types/src/documentation.ts`
- `packages/documentation-domain/src/policies/documentation-content-policy.ts`
- `packages/documentation-domain/src/policies/documentation-openapi-policy.ts`
- `packages/documentation-domain/src/policies/documentation-publication-policy.ts`
- `packages/documentation-domain/src/policies/documentation-csp-policy.ts`
- `apps/server/src/modules/documentation/**`
- `apps/server/src/modules/documentation-review/**`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationTryIt*.ts`

### 10.2 Expected new contracts

Exact names are reserved for child expansion, but implementation must prefer:

- adapter-local types for transient editor/reader conversion;
- a shared request-example language identifier and result discriminated union;
- deterministic operation-input and unsupported-reason contracts;
- no persisted Tiptap/Fumadocs document shape;
- no target credential or request/response contract in example generation.

### 10.3 API and routes

The adapter proof adds no production route. Authoring and reader modernization
should reuse existing endpoints and route shapes. Request example generation
defaults to a client/shared pure function over an already-returned accepted
operation. It must not add an endpoint merely to generate text. If an expanded
child proves server ownership unavoidable, the new API needs separate explicit
acceptance before implementation.

Any proposed new endpoint must be versioned, authorized before data load,
bounded, no-store when private, covered by Audit/Access policy, and separately
accepted during child expansion. No server-side target transport is allowed.

### 10.4 Migrations

- Child `141` must require no migration.
- Children `142` and `143` should require no content migration because adapters
  operate over existing schemas.
- Child `144` must make historical reproduction explicit before implementation.
  Prefer the existing immutable descriptor version when it can permanently pin
  generation semantics. Otherwise justify the smallest additive metadata and
  migration, backfill legacy rows safely, and preserve rollback/read
  compatibility. "Use the latest generator" is not an accepted fallback.
- No migration may rewrite immutable Revisions/Publications or convert content
  into Tiptap/Fumadocs-owned blobs.

## 11. Expected File Ownership

Child expansion must narrow this list and protect unrelated changes.

Authoring candidates:

- `apps/web/src/features/documentation/DocumentationBlockEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationSnippetPanel.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationCommentsPanel.tsx` and
  comment-anchor tests when selection/identity behavior changes;
- matching tests and Documentation CSS modules;
- new adapter files under `apps/web/src/features/documentation/` only.

Reader candidates:

- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/DocumentationDraftPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationBlockRenderer.tsx`
- `apps/web/src/features/documentation/DocumentationApiOperationExperience.tsx`
- `apps/web/src/lib/documentationInitialDocument.ts`
- `apps/web/src/App.tsx`, `apps/web/src/main.tsx`, global styles, Tailwind/Vite
  configuration, and matching tests only where the selected package subset
  proves they are necessary;
- `apps/server/src/modules/documentation/documentation.routes.ts` and focused
  initial-HTML/public-route tests when reader output or bootstrap changes.

Example candidates:

- `apps/web/src/lib/documentationTryItExamples.ts`
- `apps/web/src/lib/documentationTryItExamples.test.ts`
- `apps/web/src/features/documentation/DocumentationApiOperationExperience.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.tsx`
- public-reader/API-operation tests proving typed Try-It values and private
  configuration cannot affect generated output;
- shared constants/types/domain policy only when cross-adapter contracts truly
  require them.

Server, migrations, package manifests, lockfile, docs, and browser evidence
enter a child write set only after its implementation-ready expansion proves
the need.

## 12. Dependency Boundaries

- Child `141` owns fresh official-version/license/advisory/transitive/bundle
  research for exact Tiptap and Fumadocs packages.
- Proof dependencies must be isolated and removable.
- Child `141` must record the disposition of every proof dependency. Rejected
  packages are removed from manifests and lockfile before closure; adopted or
  partially adopted packages remain only when the proof plan explicitly
  justifies their test/dev placement or the next production child needs the
  exact pin immediately.
- Do not adopt Fumadocs MDX as customer content authority.
- Do not adopt Tiptap Collaboration/Cloud, Fumadocs hosted services, AI, or
  unrelated extension bundles.
- Prefer the smallest package subset. Record exact versions and licenses at
  implementation time; the 2026-07-31 research is not a dependency pin.
- Frozen install, production audit, notices, type-check, build, and existing
  package-boundary checks must pass before adoption.

## 13. Accessibility, Browser, Motion, And Performance

Every frontend child requires agent-browser validation on the existing
Documentation fixture; no parallel product/browser harness may be created.
Child `141` may expose the proof only through a test/development-only adapter
seam attached to that fixture. It must be excluded from production routing and
removed at closure unless deliberately carried into the selected production
child. Unit/jsdom fixtures alone are insufficient for a browser-visible gate.

Required combined coverage:

- desktop and 320px viewport;
- keyboard-only authoring/reader/example selection and copy;
- visible focus, correct restoration, landmarks/headings, labels, live status,
  and logical reading order;
- 200% zoom/reflow and target sizing;
- reduced-motion preference;
- loading, empty, unsupported, error, denied, conflict, offline/error, and
  recovery paths;
- Chromium agent-browser evidence is required. Firefox and WebKit use the
  existing repository browser tooling when installed/supported; missing engine
  binaries are installed in the headless environment when feasible, and any
  genuine platform/tooling limit is recorded instead of reported as a pass;
- automated axe plus available accessibility-tree and real assistive-
  technology evidence; never relabel unavailable AT evidence as passed;
- console/network failure review and no sensitive evidence capture;
- bundle deltas and representative editor/reader interaction measurements;
- local vitals labeled as lab data, never production p75.

## 14. Verification Matrix

Each child selects focused commands from the actual workspace. Across the
master, require:

- adapter conversion and unsupported-node unit tests;
- existing Documentation domain/type/server/web tests;
- exact Publication and permission/negative route tests;
- Try-It and generated-example fixtures;
- import/export/checkpoint/publication compatibility;
- workspace lint, type-check, build, frozen install, and production audit at
  adoption/closeout boundaries;
- database/smoke suites only when shared contracts, server, or migrations
  change;
- agent-browser evidence for every browser-visible child;
- final diff/path/license/current-truth verification.

No child may use snapshot quantity as proof of semantic fidelity. Fixtures must
assert exact blocks, identities, permissions, placeholders, and unsupported
outcomes.

## 15. Rollout, Backwards Compatibility, And Recovery

- Adapter adoption must be incrementally switchable and retain the native
  fallback through its verification window.
- Existing stored content and immutable outputs require zero operator rewrite.
- Existing URLs, bookmarks, embeds, search links, canonical tags, public access
  sessions, exports, and API clients remain compatible.
- A rollback removes or disables the adapter without data conversion.
- Historical generated examples remain readable; generator upgrades are
  versioned and cannot silently rewrite old Publications.
- Failure never changes a live Publish Link or discards local author work.

## 16. Explicit Non-Scope

This master does not implement any accepted-later, deferred, rejected, or
separately owned item from section 3. It specifically excludes:

- arbitrary executable/custom content;
- Tiptap/Fumadocs as persistence or authorization;
- realtime collaboration/offline mutation;
- API proxying or credentials;
- full SDK archives/packages;
- static export or cloud deployment;
- Git, localization, domains, feedback, analytics, external review, presence,
  deletion, Organization discovery, shared infrastructure, or Video;
- unrelated portal/application redesign.

## 17. Ordered Child Gates

### 17.1 Child 141 — Adapter proof and adoption gate

Decision/proof child. No production route or authoritative migration. Its final
record selects adopt/partial-adopt/reject independently for Tiptap and
Fumadocs.

### 17.2 Child 142 — Authoring modernization

Implements the selected authoring path, or native fallback, under existing
content/concurrency/comment/permission/publication contracts.

### 17.3 Child 143 — Reader modernization

Implements the selected reader path, or native fallback, under exact
Publication/access/URL/search/SEO/CSP/Try-It contracts.

### 17.4 Child 144 — Multi-language request examples

Implements ADR `0034` after the reader surface is stable.

### 17.5 Child 145 — Combined hardening

Closes browser, accessibility, motion, performance, security, dependency, and
compatibility evidence for the integrated experience.

### 17.6 Child 146 — Final closeout

Independently reconciles the implementation against this master, all children,
accepted decisions/ADRs, current code, migrations, tests, docs, and leftovers.

## 18. Standard Prompt Chain

For every child:

1. gather the predecessor/master/current-code/worktree baseline;
2. rewrite/expand the reservation into an implementation-ready plan;
3. independently recheck and commit the plan/docs-only result;
4. implement under the approved plan, verify, document, and commit scoped work;
5. independently close-recheck, fix gaps, verify, and commit;
6. carry only explicit leftovers into the next child.

No reservation below is authorization to skip a stage.

## 19. Master Checklist

### Planning

- [x] Master `006` and child `140` finally accepted the next objective.
- [x] Source-of-truth, adapter, security, compatibility, and non-scope
      boundaries are recorded.
- [x] Children `141`–`146` are dependency ordered and bounded.
- [x] Accepted-later/deferred/separate work is outside the checklist.
- [x] Master and child reservations were independently re-audited against the
      current code/dependency graph on 2026-07-31.
- [ ] Expand and independently recheck child `141`.

### Implementation

- [ ] Complete and close-recheck child `141`.
- [ ] Complete and close-recheck child `142`.
- [ ] Complete and close-recheck child `143`.
- [ ] Complete and close-recheck child `144`.
- [ ] Complete and close-recheck child `145`.
- [ ] Complete and independently close child `146`.

### Closure

- [ ] Every adopted adapter passed its explicit gate.
- [ ] Existing content, permissions, Publications, URLs, and APIs remain
      compatible.
- [ ] Request examples satisfy ADR `0034` and no SDK/proxy scope leaked in.
- [ ] Full focused/workspace/browser/accessibility/performance evidence passes
      or truthful limitations are recorded.
- [ ] Active docs distinguish shipped behavior from later work.
- [ ] Leftovers have owners/triggers and no false completion claim remains.

## 20. Immediate Handoff

Rewrite/expand child `141` against this master, the complete child-`140` grill,
Master `006`, ADRs `0027`–`0034`, current dependencies, current Documentation
code, and any uncommitted work. Do not install Tiptap/Fumadocs or implement a
prototype until that expanded plan is independently rechecked and authorized.

## 21. Planning Re-Audit Record

The 2026-07-31 re-audit checked all six reservations, accepted ADRs, the current
web/server/type ownership graph, and current official integration guidance. It
fixed these planning defects without changing runtime scope:

- included the snippet editor and stable comment/block identities in authoring;
- separated prose-only Tiptap adoption from unsafe whole-graph assumptions;
- made the custom Vite route composition, initial crawler HTML, and
  server/browser Fumadocs boundary explicit;
- separated public Publication, draft, and Revision reader inputs;
- prohibited generated examples from inheriting mutable Try-It values or
  private approved origins and required reproducible historical generators;
- reconciled browser-visible proof with the no-production-route/no-new-harness
  boundary and clarified proof dependency cleanup;
- made Chromium versus Firefox/WebKit evidence ownership truthful.

Verification completed:

- current paths and direct imports/callers inspected with `rg`;
- all master/child/ADR Markdown read and cross-checked;
- current official Tiptap React/Vite, Fumadocs manual/headless/source, and
  Playwright browser guidance reviewed;
- formatting, local-path, whitespace, and scoped-diff checks passed for this
  docs-only re-audit.
