# Documentation Domain Decisions

Date accepted: 2026-07-30

Status: Accepted target model, implemented and V1-closeout verified through
child `139`, with post-V1 priorities finally accepted in child `140` on
2026-07-31.

Sources:

- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/plan/130-pre-documentation-closeout.md`
- `docs/plan/131-documentation-domain-grill.md`
- `docs/grill/2026-07-31-post-v1-documentation-decision-gate.md`
- `docs/plan/140-post-v1-documentation-decision-gate.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
- `CONTEXT.md`
- ADRs `0021` through `0034`

This document consolidates the final answers from the 32-question Documentation
domain grill. It remains the decision authority for the Documentation runtime
implemented through child `139`. Section 11 records the accepted post-V1
planning result. Later child plans must preserve or explicitly supersede these
accepted boundaries.

## 1. Accepted Domain Model

- A **Documentation Site** is a stable Project-owned identity. A Project may own
  multiple Sites.
- A **Site Edition** is the Site's one authored representation for one Project
  Version. A Site has at most one Edition per Project Version.
- A **Site Working Draft** is the mutable, edition-owned aggregate containing
  Documentation Pages, the Navigation Tree, edition-owned snippets, Site
  settings, redirects, OpenAPI Sources, and Documentation Asset references.
- A **Documentation Page** has a stable identity inside one Site Edition and a
  mutable Row Version. A normal save does not create immutable history.
- A **Site Revision** is a complete immutable checkpoint of one Site Edition.
  It freezes every included Page and its content, navigation, slugs and aliases,
  redirects, OpenAPI Sources, asset references, settings, and search-relevant
  state. Manual checkpoint, Publication, and Carry-Forward are the only V1
  Revision triggers. An unchanged latest Revision may be reused.
- A **Site Publication** points to one exact Site Revision. It is immutable and
  is switched into a stable Publish Link only after the complete publication
  material is ready.
- A **Documentation Comment Thread** is private authoring workspace attached to
  a Page and, when possible, a stable block anchor. It is not part of a Site
  Revision or Site Publication.

These identities reuse the existing Project Version, Row Version, immutable
Revision, immutable Publication, protected File, Audit Event, Access Event, and
Publish Link semantics. They do not force Documentation content into the Guide
or Interactive Demo schemas.

## 2. Source Of Truth And Ownership

| Concern                                                               | Authority                                                                        | Derived or interchange forms         |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| Site and Edition identity/lifecycle                                   | Relational database                                                              | None                                 |
| Pages, navigation, snippets, redirects, settings, block relationships | Explicit relational records                                                      | Tiptap editor state, Markdown export |
| Immutable Site Revision manifest and contents                         | Relational immutable records                                                     | Render/search inputs                 |
| Assets and OpenAPI source files                                       | Protected File storage plus relational metadata/references                       | Validated parser representation      |
| Publication and stable-link selection                                 | Relational database                                                              | Reader cache, search index, sitemap  |
| Permissions and membership                                            | Existing Org User and Project Membership records                                 | Request-local authorization result   |
| Comments, replies, mentions, resolution state                         | Relational private authoring records                                             | Notification deliveries later        |
| Audit and access evidence                                             | Existing append-only relational evidence                                         | Operational reporting                |
| Browser-direct API request authority                                  | Operator origin ceiling, mutable Site/Link policy, and immutable Revision policy | Short-lived private configuration    |
| Target request, credential, and response                              | Reader browser memory and target API                                             | Content-free attempt outcome only    |

The database and protected File storage are authoritative. Search indexes,
Fumadocs page trees, rendered output, caches, sitemaps, and social metadata are
rebuildable projections keyed by exact Site Publication identity. Tiptap is an
editor adapter, not a persistence format. Core Documentation state must follow
ADR `0025` and may not be hidden in JSON/JSONB documents.

Imports are inspected, validated mutations into Ossie-owned state. Exports are
point-in-time snapshots and never become a second authority. Git/GitHub is not a
V1 source of truth and no repository credential, webhook, branch, pull request,
or force-push contract is implied.

Ownership is Project-scoped:

- the Project owns Sites, Editions, Pages, comments, assets, and publications;
- the Project Version provides release context, not content storage;
- a Site Edition owns its Page/navigation/snippet working state;
- a Site Revision owns immutable snapshots, not mutable Page rows;
- a Site Publication owns the public snapshot reference, not the draft;
- a Publish Link owns its link-wide access policy and selected immutable
  publication entries.

## 3. Authoring And Reader Boundaries

### Tiptap

Tiptap was evaluated as a replaceable authoring adapter but was not adopted in
V1. Child `132` selected Ossie's typed React controls because the first-slice
proof did not justify adding another runtime or persistence boundary. Any later
adoption remains optional and must preserve these boundaries:

- Ossie owns commands, allowed block types, validation, relational persistence,
  autosave, Row Version conflicts, comments, permissions, and publication.
- Tiptap may own in-browser editing interactions and a transient editor model.
- Safe Markdown is an interchange form. Customer-authored MDX, JavaScript,
  React components, raw HTML, and arbitrary iframes are not accepted.
- Only Ossie-owned typed blocks may add richer behavior. The first slice
  includes prose, headings, lists, links, code, media references, and a
  read-only API Reference block.

### Fumadocs

Fumadocs Core/UI/OpenAPI were evaluated as replaceable reader adapters but were
not adopted in V1. The shipped reader, search, initial-document, and OpenAPI
experience are Ossie-owned React/Fastify/PostgreSQL adapters. Any later
Fumadocs proof cannot make it the domain model, database, permission service,
editor, or publication authority.

Ossie owns authorized loading of one exact Site Publication, URL construction,
canonical and redirect behavior, access policy, security filtering, search
scope, cache identity, publication switching, rollback, audit/access evidence,
and the adapter contract. Fumadocs may turn already-authorized immutable content
into reader UI, navigation primitives, search documents, and read-only OpenAPI
views.

On 2026-07-30, package-registry verification recorded `fumadocs-core` and
`fumadocs-ui` `16.13.0`, `fumadocs-openapi` `11.2.2`, and Tiptap packages
`3.29.2`, all under MIT licenses. These remain historical research snapshots,
not dependency pins. The V1 production dependency graph contains neither
toolkit.

## 4. URL, Access, Search, And Publication Decisions

### URLs

- Authoring, preview, exact Revision, and exact Publication routes use explicit
  Site, Project Version or Edition, and immutable snapshot identities.
- Stable public routes are Publish Link routes whose selected entries point to
  exact Site Publications.
- Public version selection is explicit. There is no moving `/latest` semantic.
- Page slugs are unique within a Site Edition. Former slugs become permanent,
  non-reassignable aliases.
- Canonical URLs, redirects, and intentional `gone` outcomes are explicit.
  Redirect cycles, navigation cycles, duplicate slugs, and broken internal
  links block checkpoint/publication where they would create invalid output.

Exact HTTP path shapes are owned by child `132`; the semantic rules above are
not open for reinterpretation.

### Access

- Drafts, previews, Revisions, comments, and internal search require an
  authenticated Project Member.
- Project Admins and Editors may author; Viewers may read internal content.
  Comment mutation requires Project membership and follows the resource-level
  authoring policy defined in child `132`.
- Public/outside access uses the existing Publish Link policy family, including
  public and protected modes already supported by the product. One link-wide
  policy applies to all of that link's selected entries.
- Authorization is checked before content loading, index inclusion, search
  results, cache reuse, comments, and asset delivery. Ambiguity fails closed.
- Page-level ACLs and public comments are not part of V1.

### Search

- Authenticated portal search is limited to authorized content in one Project
  and, when selected, one Project Version.
- Public search is limited to the exact Site Publication selected by the
  current Publish Link entry. It cannot leak drafts, other Publications,
  Projects, Organizations, or other artifact families.
- Search documents may contain safe Page title, description, headings, body
  text, keywords, breadcrumbs, primary language, and Project Version labels.
- Permission filtering occurs before indexing or returning results. Raw queries
  and document bodies are not copied into Audit or Access Evidence.

### Publication, Failure, And Rollback

1. Validate a complete Site Working Draft and create or reuse an exact immutable
   Site Revision.
2. Prepare all publication material, authorized search data, metadata, and
   derived caches without changing the live link.
3. Create the immutable Site Publication.
4. Atomically switch the selected Publish Link entry after preparation succeeds.
5. If preparation fails, leave the current live entry untouched.
6. Rollback atomically repoints the entry to an older immutable Site
   Publication; it does not rebuild or mutate it.

Publication for the same Site Edition is serialized and idempotent. Cache and
search keys include exact Publication identity and access context. Public
metadata includes canonical URLs, sitemap, robots policy, and social metadata.
Custom domains are deferred.

## 5. Concurrency, Lifecycle, Retention, And Migration

### Concurrency

- Mutable resources use explicit Row Versions.
- Autosave exposes `saving`, `saved`, `offline/error`, and `conflict` truthfully.
- A stale mutation returns a conflict with the latest server state and preserves
  the user's local work for deliberate recovery; it never silently overwrites
  or merges.
- Same-tab coordination prevents competing local autosaves.
- Realtime collaboration, offline-first editing, and automatic merge are later
  work.

### Lifecycle and retention

- Sites, Editions, Pages, comments, and assets use archive-first lifecycle.
- Archiving blocks new authoring where applicable but does not mutate immutable
  Revisions/Publications or silently revoke Publish Links.
- Archived Pages disappear from new navigation/search output unless an explicit
  redirect or `gone` rule applies. Existing immutable Publications continue to
  resolve.
- Protected assets and OpenAPI files cannot be physically purged while any
  draft, Revision, Publication, or retained evidence references them.
- Audit and Access Evidence remain subject to their existing append-only
  retention rules.
- Export is not deletion. Governed permanent tenant/project/content deletion is
  deferred until a separate retention and compliance decision.

### Carry-Forward

Carry-Forward copies selected whole Documentation Sites from an exact source
Site Revision into missing target Site Editions for one target Project Version.
It copies Page/navigation/snippet/settings state into independent editable
records, reuses protected assets, is atomic and idempotent, never overwrites an
existing target Edition, and creates no live synchronization.

### Migration

The historical pre-Documentation baseline ended at migration `024`.
Documentation V1 is now implemented by additive migrations `025` through `031`;
the current head is
`031_documentation_v1_operational_hardening.sql`. Migrations `001` through
`031` remain immutable history.

- Clean install and verified `024 -> 031` and `030 -> 031` upgrades are
  supported.
- There was no legacy Documentation state to backfill.
- Migration `031` refuses populated rollback because removing operational
  guards/projections would weaken shipped state.
- Empty/historical migration status and upgrade verification tolerate
  not-yet-installed current guard definitions while head verification remains
  strict.
- Guide, Demo, Capture, shared Publish Link, Audit/Access, and protected File
  compatibility remains covered by database, smoke, and workspace suites.

## 6. Security And Threat Model

| Threat / trust boundary                            | Required control                                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cross-tenant or cross-Project ID substitution      | Resolve Organization and Project scope server-side; authorize every parent and referenced resource; fail closed before reads and writes.                                             |
| Stored XSS or code execution                       | No customer MDX/JS/React/raw HTML; parse constrained blocks; sanitize output; allowlist URL/media protocols and block types; use restrictive CSP; never execute OpenAPI examples.    |
| SSRF and external-content drift                    | No server-side arbitrary remote import or proxy in V1; OpenAPI is uploaded and self-contained; remote media is allowlisted/constrained and never publication authority.              |
| ZIP path traversal, archive bombs, oversized input | Inspect before apply; reject absolute/parent paths, links, duplicate entries, excessive counts/sizes/depth/expansion, and unsupported files; commit atomically.                      |
| Malicious or cyclic OpenAPI                        | Parse with bounded resources; reject unresolved remote references, cycles that exceed limits, unsupported schemes, and oversized documents; render read-only.                        |
| Draft/comment/search leakage                       | Authorize before load, cache, index, and return; keep public and private projections separate; never include comments in Publications.                                               |
| Comment privacy and mention abuse                  | Project-members only; validate mentions against authorized members; audit state changes without copying comment bodies into evidence; rate/size limits.                              |
| Partial or stale publication                       | Prepare before atomic switch; serialize and idempotently retry; exact Publication cache keys; failed build leaves live output unchanged.                                             |
| Asset purge breaks immutable output                | Reference protection across working state, Revisions, Publications, comments where applicable, and retained evidence.                                                                |
| Credential exposure                                | No V1 Git credentials, API proxy, or stored Try-It credentials; component-memory password controls, placeholder examples, exact-value response redaction, and content-free evidence. |
| Browser request to an unsafe target                | Exact HTTPS origin under operator and Project Admin control, all-address public DNS validation, immutable Revision freeze, link opt-in, matching CSP digest, and no redirects.       |
| Dependency or adapter lock-in                      | Pin reviewed compatible versions; isolate Tiptap/Fumadocs adapters; test safe serialization and authorization outside framework internals.                                           |
| Denial of service                                  | Organization-owned quotas plus non-bypassable safety ceilings for Pages, blocks, Sites, assets, imports, OpenAPI, searches, and publication duration/concurrency.                    |
| Cache/access-policy confusion                      | Key by exact Publication and policy context; invalidate on explicit link-policy or selected-entry changes; never serve draft caches publicly.                                        |

Preview is an authenticated read of mutable state and is never a Publication.
Errors must not reveal whether an unauthorized resource exists. Access Evidence
records logical access outcomes without content, credentials, comment bodies, or
raw search queries.

## 7. Feature Matrix

| First slice (child `132`)                                                                                                    | Remaining V1                                                                                              | Later                                                  | Rejected / non-goals                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| Create one Site and Edition in a Project Version                                                                             | Multiple-Site management polish and quotas                                                                | GitHub App import proposals and export automation      | Git or bidirectional sync as V1 authority                      |
| Two constrained Pages with stable IDs, slugs, aliases, navigation, and internal links                                        | Edition-owned reusable snippets                                                                           | Translation workflows and locale fallback              | Arbitrary MDX, JavaScript, React, raw HTML, or iframes         |
| Ossie typed-block editor with relational persistence and safe Markdown interchange                                           | Markdown Page and validated ZIP Site import/export                                                        | Optional Tiptap adapter proof                          | Page-level ACLs                                                |
| Row-Version autosave and recoverable conflict                                                                                | Carry-Forward whole Sites from exact Revision                                                             | Public feedback and analytics                          | Public comments in V1                                          |
| Private Page comment thread/reply/mention/resolve/reopen with stable-block fallback                                          | Review requests, approval states, notifications, maintainers, optional approval gate and audited override | Realtime collaborative editing and offline-first merge | Mandatory approval gate in first slice                         |
| Upload and validate one self-contained OpenAPI file; read-only reference block with operation deep links                     | Shipped in child `137`: browser-direct Try It and placeholder examples without stored credentials         | Rich interactive components and SDK generation         | Server-side arbitrary API proxy or stored customer credentials |
| Authenticated preview, manual checkpoint, immutable whole-Site Revision                                                      | Richer change summaries and authoring history UI                                                          | Governed permanent deletion                            | Per-Page publication                                           |
| Stable Publish Link backed by exact immutable Publication; second publish and rollback                                       | Validated archive/restore and export operations                                                           | Cross-artifact/Organization search                     | Moving `/latest` alias                                         |
| Exact-publication public reader, navigation, canonical routes, redirects/gone behavior, metadata, sitemap/robots/social tags | Expanded code-example and API reference ergonomics                                                        | External reviewer tokens                               | Live snippets shared across Sites/Editions                     |
| Project/Version-scoped internal search and exact-Publication public search                                                   | Operational quota controls and reporting                                                                  | Advanced publication build distribution                | Remote OpenAPI URL as live authority                           |
| Project Membership/Publish Link authorization, Audit/Access evidence, protected assets                                       | Primary-language declaration and accessibility/performance hardening                                      | Video domain/runtime                                   | Documentation runtime in child `131`                           |
| Keyboard/screen-reader/mobile/reflow/reduced-motion/browser proof and failure-state proof                                    | Complete V1 browser, migration, security, and compatibility closure                                       |                                                        |                                                                |

The primary language uses a standard language tag in V1. Translation state and
fallback are deliberately later.

## 7.1 Shipped Review And Approval Boundary

Child `136` implements the accepted internal review slice under ADR `0032`.

- Each Site Edition owns one Review Policy. Existing and newly created
  Editions default to `optional`; only an authorized Project Admin may change
  policy, approval threshold, maintainer requirement, or maintainers.
- Review Requests target exact immutable Site Revisions. The request freezes
  its threshold and assignments, while decision and Publication evaluation
  still require current active Project access and role eligibility.
- Assigned active internal Viewers, Editors, and Admins may decide. A requester
  cannot approve their own request. Organization Owner status supplies ordinary
  implicit Project Admin access but does not bypass exact-target or
  self-review rules.
- The newest request for an exact Revision governs. A newer Revision
  supersedes older open requests; later mutable draft edits cannot change the
  already frozen target.
- Rejection makes the request terminal. Cancellation is explicit and reasoned.
  Decisions, evidence, and historical requests are immutable.
- Publication and rollback remain ordinary authorized commands. When policy is
  required they must prove the current exact Revision has enough currently
  valid approvals, including a valid maintainer approval when configured.
- Project Admin override is explicit, reasoned, serialized with the link
  switch, and represented by immutable Publication Review Evidence. Summary
  evidence is available to Project members; the override reason detail remains
  Admin-only.
- In-product notifications contain identifiers and safe display context only.
  Comment bodies, decision reasons, override reasons, draft content, secrets,
  and public review metadata are excluded.
- Existing pre-migration Publications remain readable and existing Editions
  remain publishable because their backfilled policy is optional. Historical
  pre-migration link switches have no fabricated evidence.

Review is Documentation-only. It does not establish external reviewers,
email/webhook delivery, Page-level approval, a general cross-artifact workflow,
or authorization by approval.

## 7.2 Shipped Browser-Direct API Experience

Child `137` implements the accepted API request slice under ADR `0033`.

- Existing descriptor-v0 references remain readable and never become
  executable. Descriptor-v1 data is relationally derived from a bounded,
  self-contained OpenAPI Source and frozen into an exact Site Revision.
- The deployment operator owns the exact HTTPS-origin ceiling. A Project Admin
  owns mutable Site and Publish Link opt-in policy. Review approval remains
  unrelated and cannot grant target authority.
- Internal draft configuration follows Project read access; policy writes
  require Project Admin. Public configuration follows the exact authorized
  Publish Link entry and immutable Publication.
- Target transport is browser-direct with omitted ambient credentials,
  forbidden redirects, explicit confirmation, mutation acknowledgement,
  request/response ceilings, Abort/timeout, local rate limits, inert response
  rendering, and placeholder-only generated examples.
- Credential values live only in the open request component and target request.
  They are absent from Ossie APIs, persistence, Audit, Access Evidence, URLs,
  search, examples, storage, and screenshots.
- Attempt evidence records only an allowlisted outcome under a signed,
  short-lived, scope-bound token. It cannot reconstruct target URL, headers,
  body, credential, response, or status.
- CSP is a deployment defense in depth. The server/web origin-set digest must
  match before Send; target CORS and network policy remain authoritative.

Stored environments, proxying, OAuth, arbitrary requests, target cookies,
private-network origins, mock servers, and SDK generation remain outside V1.

## Shipped portability boundary

Child `134` ships deterministic Documentation Package V1 and standalone
Markdown Page interchange under ADR `0031`.

- Relational Documentation and protected Files remain authoritative.
- Import is actor-bound Inspect then atomic Apply; inspection alone cannot
  mutate a Working Draft.
- Whole-Site Apply creates a Site or targets an explicitly empty Site. It does
  not merge, overwrite, checkpoint, publish, or claim source lineage.
- Package-local handles replace database identities and resolve to fresh IDs.
- Exact protected image and self-contained OpenAPI bytes are included and
  revalidated; comments, access policy, Audit evidence, and private storage
  facts are excluded.
- Guide/Demo Publication relationships require explicit authorized rebinding.
- Standalone Markdown is intentionally lossy and create-only. Typed JSON is
  authoritative inside a round-trip package.
- Git, remote URL import, live synchronization, signatures, encryption, and
  package patches remain outside V1.

## 8. Accessibility, Performance, And Operational Targets

- Authoring and reader surfaces target WCAG 2.2 AA and retain visible focus,
  semantic headings/landmarks, keyboard-only operation, screen-reader labels and
  announcements, 200% zoom/reflow, touch targets, and reduced-motion behavior.
- Published reader pages target good Core Web Vitals at the 75th percentile for
  representative self-hosted production conditions: LCP at or below 2.5
  seconds, INP at or below 200 milliseconds, and CLS at or below 0.1. Child
  `132` must record its measurement environment and revisit these thresholds if
  the governing web-vitals standard changes before implementation.
- The editor must remain responsive under the documented first-slice Page/block
  limits; virtualization or chunking decisions require measurement.
- Limits are Organization-owned, nullable for unlimited product policy, and
  always bounded by hard self-hosting safety ceilings. Failures are actionable
  and do not partially mutate state.

## 9. Ordered Child-Plan Sequence

The first-slice boundary is intentionally end to end. Do not split child `132`
into disconnected schema/editor/reader horizontal phases.

Master Plan `006` rechecked and refined the original seven-item child `131`
handoff into nine safer delivery units without changing accepted product scope.
It separates untrusted import/export from content/assets and separates
operational hardening from final certification.

1. **132 — Documentation Site First Vertical Slice.** Implement the complete
   Question 32 flow: Site/Edition, two Pages and navigation, constrained
   authoring, private Page comments, self-contained OpenAPI read-only reference,
   Row-Version autosave, authenticated preview, immutable Site Revision and
   Site Publication, stable Publish Link, exact-publication public reader and
   search, second publication, immutability proof, and rollback. Include additive
   migrations, API contracts, permissions, audit/access, threat controls,
   accessibility/performance tests, and agent-browser evidence.
2. **133 — Documentation Content, Snippets, And Asset Workflows.** Complete the
   constrained content set, edition-owned reusable snippets, Documentation and
   authorized shared Asset workflows, reference protection, authoring limits,
   and snapshot coverage.
3. **134 — Documentation Import, Export, And Package Portability.** Add safe
   Markdown Page and validated versioned ZIP Site import/export, self-contained
   OpenAPI portability, atomic inspect/apply, package compatibility, and
   archive/parser threat controls.
4. **135 — Documentation Carry-Forward, Multi-Site, And Lifecycle.** Add whole-Site
   Carry-Forward from an exact Revision, multi-Site/Project-Version management,
   archive/restore, redirects/gone behavior, and retained Publication proofs.
5. **136 — Documentation Review And Approval Workflow.** Add review requests, approvals,
   maintainers, notifications, optional publication gate, audited authorized
   override, and richer change/history UI while preserving first-slice comments.
6. **137 — Documentation API Try-It And Example Experience.** Add browser-direct OpenAPI Try It
   only after CORS/auth/threat proof, plus expanded safe examples. Do not add an
   Ossie API proxy, credential vault, or SDK generator.
7. **138 — Documentation V1 Operational Hardening.** Close V1 search, SEO,
   access, quotas, accessibility, performance, migration, compatibility,
   self-hosting, dependency, browser dogfood, and operator behavior.
8. **139 — Documentation V1 Final Closeout.** Audit the completed V1 against
   child `131`, Master Plan `006`, current code/schema/contracts/docs, the full
   verification matrix, and existing product compatibility; fix scoped gaps
   without adding features.
9. **140 — Post-V1 Documentation Decision Gate.** Reassess Git/GitHub,
   localization, custom domains, public feedback/analytics, permanent deletion,
   and collaboration as separate evidence-backed proposals; do not inherit them
   automatically into V1.

Children `132` through `140` are complete. Children `132` through `139`
implemented and verified Product Documentation V1; child `140` was a
documentation-only post-V1 decision gate. The implementation
uses additive migrations `025`–`031`, Ossie-owned typed authoring and reader
adapters, PostgreSQL search projections, exact immutable Publications, and the
accepted permission/evidence boundaries. Child `140` remains a decision-only
gate and does not inherit implementation authority from this closure.

## 10. Handoff Invariants

- Child `131` closes decisions only; no runtime or package change belongs to it.
- Master Plan `006` owns the completed V1 sequence `132` through `140`.
- Shipped adapters may not reopen these semantics without a new ADR and
  explicit user decision.
- The accepted Question 31 private Page comments boundary is shipped and
  remains outside immutable/public output.
- Fumadocs and Tiptap are absent from V1. Child `140` accepts bounded adapter
  proofs next; production adoption remains conditional and cannot rewrite the
  domain model.
- Documentation appears in operational and Project navigation only through its
  authorized shipped routes.
- Video, Git sync, translations, custom domains, public feedback/analytics,
  permanent deletion, realtime collaboration, and arbitrary executable content
  stay outside the first implementation slice.

## 11. Accepted Post-V1 Decision Gate

Child `140` reviewed the shipped V1 and every post-V1 candidate before selecting
new implementation scope. The user finally accepted the complete Q1–Q17 ledger
on 2026-07-31.

### 11.1 Selected next objective

Master `007` owns one Documentation experience objective:

> Evaluate Tiptap for constrained authoring and Fumadocs for exact-Publication
> reading, adopt only evidence-backed improvements, add deterministic
> multi-language API request examples, and close the combined experience with
> browser, accessibility, performance, and compatibility proof.

The ordered reservations are:

1. adapter proof and adoption gate;
2. authoring experience modernization;
3. reader experience modernization;
4. generated curl, browser Fetch, Node.js, Python, and Go request examples via
   an extensible versioned registry;
5. accessibility, cross-browser, motion, performance, security, and
   compatibility hardening;
6. final independent closeout.

The proof compares against the shipped native UI. Tiptap and Fumadocs remain
replaceable adapters. Failure selects the native fallback and cannot weaken an
acceptance gate.

### 11.2 Final feature disposition matrix

| Band                            | Capabilities                                                                                                                                                                                                                                                                                                              | Owner or reopen trigger                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Selected next                   | Tiptap authoring proof; Fumadocs reader proof; evidence-gated UI modernization; deterministic multi-language request examples                                                                                                                                                                                             | Documentation Master `007` and children `141`–`146`                                                                                              |
| Accepted later                  | One-way GitHub proposal export; human-first translation; verified custom domains; structured Helpful/Not helpful feedback; privacy-minimized aggregate analytics; exact-Revision external review; ephemeral author presence; offline read-only snapshots; typed disclosure block; deterministic public static-site export | Separate focused Documentation sequences after explicit prioritization and prerequisites                                                         |
| Accepted later, separate domain | Permission-filtered Organization-wide metadata discovery                                                                                                                                                                                                                                                                  | Future Knowledge Platform master; body/full-text and cross-Organization search remain deferred                                                   |
| Deferred                        | Bidirectional Git sync; simultaneous editing; offline mutation/merge; governed permanent deletion; full SDK packages; direct cloud/CDN deployment and deploy hooks                                                                                                                                                        | Reopen only when each recorded demand, authority, security, lifecycle, and operational evidence gap closes                                       |
| Separate maintenance/operations | Firefox/WebKit and real assistive-technology coverage; PostgreSQL client warning; server lint debt; production telemetry; distributed admission; durable jobs; non-local File storage                                                                                                                                     | QA, dependency/server maintenance, or cross-product operations—not Documentation Master `007` unless a future accepted boundary proves otherwise |
| Rejected boundary               | Arbitrary HTML/JavaScript/MDX/React/iframe/widgets; server API proxy; stored target credentials; automatic registry SDK publication; destructive deletion masquerading as archive                                                                                                                                         | Remains prohibited unless a new explicit grill and superseding ADR changes the trust model                                                       |

### 11.3 Authority and compatibility

- PostgreSQL and protected Files remain authoritative.
- Tiptap state, Fumadocs content sources/page trees, generated request text,
  static exports, Git, and caches are transient adapters or derived forms.
- Existing constrained blocks, URLs, APIs, Project Membership, Publish Link
  access, exact Revisions/Publications, review evidence, Try-It authority,
  sanitization, Audit/Access Evidence, and archive-first lifecycle remain
  compatible.
- Generated request examples are inert exact-operation projections under ADR
  `0034`; they never execute, contain entered credentials, grant target origin
  authority, or constitute a supported SDK.
- Child `140` implemented none of these post-V1 capabilities. Master `007` and
  its reservations are planning artifacts; each runtime child requires the
  standard expand/recheck/implement/recheck chain.
