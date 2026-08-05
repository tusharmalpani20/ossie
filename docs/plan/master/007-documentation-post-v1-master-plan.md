# Master Plan 007: Documentation Post-V1 Experience

Date: 2026-07-31

Last full sequence re-audit: 2026-08-05

Status: Complete — independently close-reconciled on 2026-08-05. Children
`141`–`145` implemented and verified the accepted post-V1 branches; Child `146`
completed the final audit and records-only closeout.

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

Ordered child sequence:

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
- Descriptor version `1` permanently selects the frozen
  `documentation-request-example-v1` contract and its exact initial five-
  language registry; descriptor version `0` is unsupported. Existing immutable
  Revision/Publication descriptors therefore reproduce the same output without
  new stored rendered code or metadata. Future semantic/language-set changes
  require a new accepted version; a current registry default may never silently
  change old Publication output.
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
- Child `144` uses the accepted permanent descriptor-version mapping:
  descriptor `1` selects `documentation-request-example-v1`; descriptor `0` is
  unsupported. No migration or backfill is planned. A future change must add a
  separately accepted version rather than route historical descriptors to the
  latest generator.
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

Closed 2026-08-05: Tiptap `partial-adopt` for bounded prose fields only;
Fumadocs `partial-adopt` for the named page-tree, breadcrumb, and TOC
headless primitives over an authorized Publication projection. Exact pins,
browser evidence, lazy chunk cost, rollback/fallback behavior, and successor
ownership are recorded in Child `141` and
`docs/ui/2026-08-05-documentation-adapter-proof.md`.

### 17.2 Child 142 — Authoring modernization

Implements the selected authoring path, or native fallback, under existing
content/concurrency/comment/permission/publication contracts.

Closed 2026-08-05: implemented the selected Tiptap prose-only path for
paragraph, heading, quote, callout, and ordered/unordered list-item text.
Structural/reference/media/API semantics remain native; Page/Snippet save,
comments, assets, Row-Version conflict recovery, and permissions remain on
existing Ossie clients. The lazy field is 5.64 kB raw / 2.20 kB gzip and its
native fallback/recovery, viewer, narrow/reflow, reduced-motion, axe, console,
and fixture-reset evidence is recorded in
`docs/ui/2026-08-05-documentation-authoring-modernization-browser-evidence.md`.

### 17.3 Child 143 — Reader modernization

Implements the selected reader path, or native fallback, under exact
Publication/access/URL/search/SEO/CSP/Try-It contracts.

Closed 2026-08-05: adopted Fumadocs page-tree, breadcrumb, and heading TOC
primitives in a lazy public exact-Publication reader chrome over the existing
authorized Ossie projection. Draft and Revision previews remain native and
resource-distinct; the disposable reader proof query/UI was removed. Native
fallback, public/default and explicit-version routes, search/API/assets,
responsive/reduced-motion/axe, and chunk-failure recovery are recorded in
`docs/ui/2026-08-05-documentation-reader-modernization-browser-evidence.md`.

### 17.4 Child 144 — Multi-language request examples

Closed 2026-08-05: implemented ADR `0034` as the pure, permanent V1 registry
over accepted DocumentationTryItRequestDescriptor data. curl, Browser Fetch,
Node.js Fetch, Python urllib, and Go net/http are deterministic inert
projections with visible placeholders and no target/configuration/network
authority. Bounded documented examples/defaults are admitted and redacted in
the existing descriptor derivation policy. Public Publication, immutable
Revision, and draft/OpenAPI surfaces use a lazy, accessible copy/download
panel outside the mutable Try-It builder. Unsupported required-body cases are
shown fail-closed. The synthetic supported/unsupported fixture journeys,
focused/full tests, browser evidence, bundle cost, and truthful audit/tool
limitations are recorded in
`docs/ui/2026-08-05-documentation-request-examples-browser-evidence.md` and
Child `144`.

### 17.5 Child 145 — Combined hardening

Closes browser, accessibility, motion, performance, security, dependency, and
compatibility evidence for the integrated experience.

Closed 2026-08-05: fixed the public operation-route adapter console error by
selecting the existing native fallback before mounting the Fumadocs chrome, and
made narrow generated-code overflow keyboard-focusable with deterministic code
surface styling. The required Chromium matrix, 320px/200% reflow, reduced
motion, axe/tree/manual checks, request-example isolation, draft/Revision
coverage, existing-product smoke, bundle measurements, dependency/license
review, migration head, and truthful optional-engine/AT limitations are
recorded in `docs/ui/2026-08-05-documentation-post-v1-hardening.md`. Exact
fixes are `37e4bc8` and `72b8943`; the scoped plan/evidence closeout is
`886a396`.

### 17.6 Child 146 — Final closeout

Independently reconciles the implementation against this master, all children,
accepted decisions/ADRs, current code, migrations, tests, docs, and leftovers.

Closed 2026-08-05: the final ledger maps every Master `007` requirement to
actual runtime files, tests, browser evidence, migration/dependency facts, and
owned limitations. The current-truth docs now describe the actual Tiptap and
Fumadocs partial-adopt branches and the permanent inert five-language request
example contract. Final Chromium rechecks passed for supported/unsupported
operations, draft, and immutable Revision; no unresolved in-scope S1/S2,
contract drift, migration, authority, or worktree issue remains. The closure
records are committed in `85866ab`.

## 18. Standard Prompt Chain

For every child:

1. gather the predecessor/master/current-code/worktree baseline;
2. rewrite/expand the reservation into an implementation-ready plan;
3. independently recheck and commit the plan/docs-only result;
4. implement under the approved plan, verify, document, and commit scoped work;
5. independently close-recheck, fix gaps, verify, and commit;
6. carry only explicit leftovers into the next child.

No reservation below is authorization to skip a stage.

## 18.1 Autonomous Goal Execution Contract

The intended execution environment is one long-running, high-reasoning goal.
That goal may advance through children only in numeric order. It must treat
each child as a separately closable unit and must not batch an unfinished child
with its successor merely to keep moving.

For every child, the goal performs this complete loop:

1. **Predecessor intake.** Read the predecessor's final status, implementation
   log, verification, limitations, leftovers, and handoff. Confirm the
   predecessor is complete and independently close-rechecked. Move only the
   explicitly assigned leftovers into the active child; do not silently absorb
   unrelated defects.
2. **Current-state preflight.** Read `AGENTS.md`, `CONTEXT.md`, accepted ADRs,
   this master, the active child, current manifests/lockfile, affected code and
   tests, and `git status`. Record code drift and preserve overlapping user or
   agent work. Do not rely on file names, dependency versions, bundle sizes, or
   route facts merely because this plan recorded them on 2026-08-05.
3. **Plan review and expansion refresh.** Reconcile the child's baseline with
   the predecessor result and current code. Fill any newly discovered exact
   caller, test, dependency, or verification detail. The conditional branches
   already accepted by this master are agent-decidable; they do not require a
   new product grill.
4. **Independent plan recheck.** Review the refreshed child against the master,
   predecessor, ADRs, contracts, authorization, tenant isolation, migration,
   compatibility, explicit non-scope, and dirty worktree. Fix planning gaps and
   commit only the docs-only plan change before implementation when the run's
   commit policy permits it.
5. **Test-first implementation.** Establish a focused failing test or other
   reproducible failing evidence, implement the smallest in-scope behavior,
   and refactor only with focused tests green. Keep adapter state derived and
   replaceable. Never weaken a gate to make an external package pass.
6. **Focused verification.** Run the active child's type, unit, route, domain,
   integration, build, dependency, accessibility, and browser checks in the
   order defined by that child. Use the existing synthetic Documentation
   fixture and real routes. Record unavailable tooling as a limitation, never
   as passing evidence.
7. **Implementation close-recheck.** Re-read the child and master against the
   actual diff and runtime. Fix gaps, rerun affected checks, and repeat until no
   in-scope S1/S2 defect or unmet acceptance criterion remains.
8. **Record closure.** In the same child, update status, checklist,
   implementation log, exact commands/results, browser evidence, dependency
   disposition, limitations, leftovers, and handoff. Update this master only
   for genuinely completed stage boxes.
9. **Leftover routing.** Classify every leftover as successor-owned,
   accepted-later, separately owned maintenance/operations, or blocked by a
   named new product decision. The successor receives only its explicit items.
10. **Commit integrity.** Inspect the staged diff and commit only the active
    child's scoped work in small, single-purpose, independently reviewable
    commits. Commit after each coherent test-green slice instead of accumulating
    the whole child into one large commit. Keep planning, contracts/tests,
    implementation surfaces, verification fixes, and closeout records separate
    when they can be reviewed or reverted independently. Split any suggested
    commit further when its diff becomes broad or mixes concerns. Do not include
    unrelated worktree changes. Record every commit ID in the child before
    advancing.

The goal is complete only after Child `146` independently closes this master.
Completing an implementation commit without its recheck and records is not a
completed child.

## 18.2 Decision And Blocker Policy

The following outcomes are already authorized and must not pause for user
input:

- `adopt`, `partial-adopt`, or `reject` for each proof candidate when Child
  `141`'s mandatory gates and scorecard determine the result;
- choosing the newest mutually compatible exact package versions whose
  license, official compatibility, frozen install, audit, tests, and build all
  pass; a package's `latest` tag alone is not authority;
- rejecting/removing an adapter when official research is unavailable after
  bounded retries, packages cannot be installed reproducibly, React/Vite
  compatibility fails, or the adapter exceeds accepted risk/cost thresholds;
- using the Ossie-native fallback in children `142` or `143` after rejection;
- reversible component composition, CSS, copy, test-fixture, lazy-loading, and
  pure-adapter details inside the accepted contracts;
- preserving descriptor-version `1` as the permanent selector for request-
  example contract `documentation-request-example-v1` in Child `144`, with
  descriptor version `0` unsupported and future semantic changes requiring a
  new accepted version rather than silently changing historical output;
- repairing in-scope accessibility, security, compatibility, or performance
  defects found by children `145` or `146` when the repair preserves accepted
  behavior.

The following are genuine stop conditions requiring explicit user/product
authority before proceeding:

- changing tenant, Project Membership, public-link, review, publication, Try
  It, or credential authority;
- changing public URL/canonical identity, immutable Revision/Publication
  meaning, archive/retention/deletion semantics, or source of truth;
- accepting executable/custom content, a target-request proxy, stored target
  credentials, SDK packages, MDX/customer code authority, collaboration/cloud,
  or any accepted-later feature;
- adding a new persistence model or migration because the implementation can no
  longer satisfy the accepted zero-migration adapter boundary;
- adopting a major dependency with an incompatible license, unresolved known
  high/critical advisory in the shipped path, or a required hosted/commercial
  service;
- changing child ordering or broadening Master `007` beyond the Q17 decision.

Operational friction is handled without inventing product decisions:

- transient network/registry failures receive bounded retries; if package
  provenance still cannot be verified, reject the package and continue native;
- an unavailable optional Firefox/WebKit/real-AT engine is recorded with the
  exact attempted setup and owner, while required Chromium evidence must pass
  before a browser-visible child closes;
- unrelated dirty-worktree changes are preserved and excluded; overlap blocks
  only the affected file until it can be reconciled without discarding work;
- a database or fixture failure is diagnosed and repaired in scope; it is not
  bypassed with mocked browser evidence.

## 18.3 Planning-Time Research Snapshot

This snapshot explains the implementation boundaries but is not a future
package pin. Child `141` must refresh it from primary sources on its execution
date.

- On 2026-08-05, the official Tiptap React guide documents the Vite/React
  packages `@tiptap/react`, `@tiptap/pm`, and `@tiptap/starter-kit`; the npm
  registry showed staggered `3.29.x` publications. Install one exact version
  available for every selected Tiptap package rather than mixing independently
  tagged latest patches.
- Tiptap core is MIT, but the official Tiptap UI Components guide still says
  those prebuilt components work best with React 18 while React 19 support is
  being completed. Master `007` therefore evaluates editor core only and does
  not install `@tiptap/ui-components`, templates, Pro, Cloud, AI, or
  Collaboration.
- The official Fumadocs documentation identifies `fumadocs-core` as MIT and
  headless, but its Loader API is server-side and not browser-compatible. The
  current Ossie product is a Vite SPA with a custom `App.tsx` route parser, not
  a supported Fumadocs React Router/Next/Waku content application. The proof is
  consequently limited to client-safe `fumadocs-core` primitives such as page-
  tree types, breadcrumb, and TOC over already authorized Ossie snapshots. It
  excludes Loader, MDX, search server/client replacement, `fumadocs-ui`,
  framework providers, and route ownership.
- Official references to refresh are the Tiptap React installation and React
  performance/compatibility pages, Tiptap repository license/changelog,
  Fumadocs headless introduction/page-tree/breadcrumb/TOC/source pages,
  Fumadocs repository license/releases, and exact npm registry metadata.

## 19. Master Checklist

### Planning baseline

- [x] Master `006` and child `140` finally accepted the next objective.
- [x] Source-of-truth, adapter, security, compatibility, and non-scope
      boundaries are recorded.
- [x] Children `141`–`146` are dependency ordered and bounded.
- [x] Accepted-later/deferred/separate work is outside the checklist.
- [x] Master and child reservations were independently re-audited against the
      current code/dependency graph on 2026-07-31.
- [x] Re-audit Master `007` and children `141`–`146` against shipped code,
      final Plan `140`, ADRs, current packages, and official adapter guidance.
- [x] Expand all six children into detailed ordered-execution baselines.
- [x] Resolve routine conditional branches and historical example selection so
      they do not become avoidable user-input blockers.

### Child 141 lifecycle

- [x] Review predecessor closure and all Plan `140` handoff items.
- [x] Refresh/recheck Child `141` against current dependencies and code.
- [x] Implement the isolated proof test-first on the existing fixture.
- [x] Run scorecard, security, dependency, browser, accessibility, and bundle
      evidence; record Tiptap and Fumadocs dispositions.
- [x] Independently close-recheck Child `141` and clean rejected proof code.
- [x] Route exact selected seams and leftovers to Child `142`/`143`.

### Child 142 lifecycle

- [x] Review Child `141` authoring disposition and leftover intake.
- [x] Refresh/recheck Child `142` and lock its selected/native branch.
- [x] Implement authoring modernization test-first.
- [x] Verify Page/snippet identity, save/conflict/permission/publication and
      browser behavior.
- [x] Independently close-recheck Child `142`.
- [x] Route only reader-relevant leftovers to Child `143`.

### Child 143 lifecycle

- [x] Review Child `142` closure and Child `141` reader disposition.
- [x] Refresh/recheck Child `143` and lock its selected/native branch.
- [x] Implement reader modernization test-first.
- [x] Verify public/draft/Revision authority, URL/SEO/access/CSP/Try-It and
      browser behavior.
- [x] Independently close-recheck Child `143`.
- [x] Freeze the stable reader seam and route example work to Child `144`.

### Child 144 lifecycle

- [x] Review Child `143` closure and ADR `0034` inputs.
- [x] Refresh/recheck Child `144`, including the permanent descriptor-to-
      generator contract mapping.
- [x] Implement the pure five-language registry test-first.
- [x] Verify determinism, placeholders, unsupported cases, historical output,
      Try-It isolation, UI copy, and browser behavior.
- [x] Independently close-recheck Child `144`.
- [x] Route only integrated hardening leftovers to Child `145`.

### Child 145 lifecycle

- [x] Review all explicit leftovers from children `141`–`144`.
- [x] Refresh/recheck the integrated hardening matrix.
- [x] Establish failing evidence and fix only proven in-scope defects.
- [x] Complete accessibility, Chromium, supported cross-browser, security,
      dependency, bundle, performance, and compatibility evidence.
- [x] Independently close-recheck Child `145` with no unresolved S1/S2.
- [x] Route closure-only limitations and future work to Child `146`.

### Child 146 lifecycle

- [x] Review every completed child, commit, leftover, and current-truth surface.
- [x] Refresh/recheck Child `146` as a closure plan, not a feature child.
- [x] Run the final independent code/contract/security/compatibility audit.
- [x] Fix and reverify only scoped closure defects until clean.
- [x] Reconcile all child records and this master checklist.
- [x] Classify remaining limitations/future work and close Master `007`.

### Closure

- [x] Every child used small, single-purpose, test-green commits rather than one
      large end-of-child commit; plan, implementation, verification fixes, and
      closeout remain independently attributable.
- [x] Every adopted adapter passed its explicit gate.
- [x] Existing content, permissions, Publications, URLs, and APIs remain
      compatible.
- [x] Request examples satisfy ADR `0034` and no SDK/proxy scope leaked in.
- [x] Full focused/workspace/browser/accessibility/performance evidence passes
      or truthful limitations are recorded.
- [x] Active docs distinguish shipped behavior from later work.
- [x] Leftovers have owners/triggers and no false completion claim remains.

## 20. Immediate Handoff

Children `141` through `146` are closed and independently rechecked. Master
`007` is complete. Its actual Tiptap/Fumadocs partial-adopt dispositions,
five-language `documentation-request-example-v1` contract, native authority
boundaries, migration head `031`, final bundle measurements, audit findings,
optional browser/AT limits, and maintenance-owned Extension contrast finding
are recorded in the child plans, current-truth docs, and `docs/ui/` evidence
index. No next master is created automatically; the next activity requires an
explicit prioritization decision.

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

The 2026-08-05 autonomous-execution re-audit then:

- expanded all six reservations into implementation-ready conditional plans;
- added a repeated predecessor/preflight/plan-recheck/test-first/verification/
  close-recheck/leftover/commit lifecycle for every child;
- separated routine evidence-derived decisions from genuine user stop
  conditions so adapter rejection continues through native fallback;
- excluded Tiptap UI Components under the current React 19 compatibility
  warning and limited Fumadocs to client-safe headless primitives over
  Ossie-authorized projections;
- fixed descriptor version `1` as the permanent
  `documentation-request-example-v1` selector with no migration;
- added bounded documented example/default admission and explicit separation
  from mutable Try-It request previews to Child `144`;
- added complete security, permission, migration, compatibility, browser,
  accessibility, performance, dependency, commit, and handoff matrices;
- corrected stale `PRODUCT.md` wording that claimed shipped Documentation V1
  remained future and restored accepted Project Membership role names.
- completed Child `145` hardening and Child `146` final reconciliation on
  2026-08-05; current-truth docs, evidence, limitations, commit scope, and
  Master closure state now match the shipped runtime.

Planning-environment readiness on 2026-08-05 (refresh at execution):

- Node `24.18.0` and pnpm `9.0.0` are available;
- PostgreSQL client `18.4` is installed and the local server accepts
  connections on `/var/run/postgresql:5432`;
- agent-browser `0.33.1` doctor reported 10 passes, 0 warnings, and 0
  failures, including managed Chrome for Testing `151.0.7922.47` and a
  successful headless launch;
- the server test environment configuration and Documentation browser fixture
  CLI are present;
- PM2 is available but is not a prerequisite for test-owned process startup;
- the repository-requested `rtk` command is absent in this shell. The goal
  should check once, record the limitation, and use the direct underlying
  commands when unavailable; missing `rtk` is not a product blocker.

Verification completed:

- current paths and direct imports/callers inspected with `rg`;
- all master/child/ADR Markdown read and cross-checked;
- current official Tiptap React/Vite, Fumadocs manual/headless/source, and
  Playwright browser guidance reviewed;
- formatting, local-path, whitespace, and scoped-diff checks passed for this
  docs-only re-audit.
