# Child Plan 138: Documentation V1 Operational Hardening

**Parent:** `docs/plan/master/006-documentation-platform-v1-master-plan.md`

**Predecessor:** `docs/plan/137-documentation-api-try-it-and-example-experience.md`

**Next:** `docs/plan/139-documentation-v1-final-closeout.md`

**Expanded:** 2026-07-31

**Status:** Completed, independently close-rechecked, and verified on 2026-07-31

## 1. Sequence Gate

- Child `137` is implemented, independently close-rechecked, documented, and
  committed.
- Master Plan `006`, child `131`, the accepted Documentation decision ledger,
  `CONTEXT.md`, and ADRs `0027` through `0033` remain authoritative.
- Migrations currently end at
  `030_documentation_api_try_it.sql`.
- The worktree was clean when this plan was expanded.
- This plan is a planning artifact only. Expansion must not create migration
  `031`, runtime code, generated output, dependency changes, browser evidence,
  or implementation commits.
- Before implementation, reread this plan and inspect the current worktree,
  migration head, package lock, and all files listed in section 18. If the
  implementation has moved, update this plan rather than coding against stale
  assumptions.
- Child `139` cannot start until this child is implemented, rechecked, fully
  verified, documented, and committed.

## 2. Actual Baseline After Child 137

### 2.1 Shipped Documentation model

The current runtime already provides:

- Organization/Project/Project Version-scoped Documentation Sites and
  independently mutable Site Editions;
- relational Working Draft Pages, blocks, Snippets, Assets, navigation,
  routing, private comments, and self-contained OpenAPI sources;
- immutable whole-Site Revisions and Site Publications;
- stable Publish Links with exact version-entry selection, public/restricted
  access, rollback, and revocation;
- persisted draft and exact-Publication search documents;
- import inspection/apply, deterministic exports, Carry-Forward, archive and
  restore, review and approval, and browser-direct API Try It;
- Project Membership authorization, Organization-owner elevation, Audit
  Evidence, Access Evidence, Row Versions, idempotency, and PostgreSQL advisory
  locks;
- exact protected File references and immutable Publication retention.

### 2.2 Current operational implementation

- Hard Documentation constants are compiled into
  `packages/constants/src/documentation.ts`.
- Site/Page/Snippet/Asset/comment/OpenAPI/import/Carry-Forward/review/Try-It
  safety ceilings are enforced in their owning domain/server paths.
- Publication is synchronous and transaction-bound. It creates or reuses an
  exact Revision, prepares a persisted search projection, creates an immutable
  Publication, and switches the selected link entry only after preparation.
- Same-Edition publication correctness uses a PostgreSQL advisory transaction
  lock. There is no product-level scheduled publishing and no durable
  background job queue.
- The server has generic `/healthz` and `/readyz` endpoints. Readiness proves
  database availability but does not yet report Documentation projection or
  storage configuration.
- `production-env-report` reports generic request limits, in-memory rate-limit
  limitations, and the Documentation Try-It origin count/digest.
- `documentation_import_cleanup` performs bounded expiration/cleanup work for
  import inspections. Review rows, Revisions, Publications, and protected Files
  are retained.
- There is no application-level Documentation response cache. PostgreSQL is the
  live source for draft and immutable Publication reads. Persisted draft/public
  search rows are rebuildable projections.
- Public JSON routes expose exact Publication content, Page/search/operation
  views, assets, sitemap, and robots output.
- The React public reader injects canonical and description metadata only after
  JavaScript loads. Static Vite `index.html` therefore cannot by itself prove
  route-specific initial HTML, status, canonical, social, robots, or crawler
  behavior.
- The web app eagerly imports all Documentation authoring, reader, review,
  import/export, and Try-It surfaces from `App.tsx`.
- The last verified production web bundle is a single JavaScript chunk of
  approximately `739.99 kB` raw (`197.97 kB` gzip), with Vite's `500 kB`
  advisory.

### 2.3 Verified predecessor boundary

Child `137` closed with:

- server `120` files / `527` tests;
- web `81` files / `434` tests;
- extension `19` files / `140` tests;
- constants `1` file / `9` tests;
- strict types `18` files / `93` tests;
- Documentation domain `17` files / `45` tests;
- database `23` files / `83` tests;
- V1 smoke `1` file / `2` tests;
- workspace type check and production build passing.

Child `138` must not silently weaken any of that behavior.

### 2.4 Carry-forward risks owned here

This child owns the following non-feature hardening work:

- Organization-owned Documentation quota settings and usage visibility;
- operator-configured, non-bypassable publication/admission ceilings;
- safe publication busy/timeout behavior;
- exact draft and Publication search projection rebuild;
- public cache validators and exact cache policy;
- canonical/sitemap/robots/social metadata correctness;
- crawler-visible, route-specific initial HTML and HTTP status proof in the
  split Vite/Fastify deployment;
- public access-policy and archive/retention consistency checks;
- migration, reset/reseed, upgrade, backup, and restore proof;
- redacted health/readiness/operator diagnostics;
- dependency/version/license review;
- WCAG/manual accessibility, responsive/reduced-motion, browser, failure, and
  performance evidence;
- closure of applicable active threat-model rows;
- measured code splitting for Documentation and the Try-It experience.

## 3. Goal

Make the shipped Documentation V1 safe and truthful to operate under bounded
load, recoverable from projection loss, crawler-correct at its deployed public
routes, measurable without content leakage, and verified across accessibility,
performance, migration, security, and representative browser failure cases.

This is a hardening phase. It must not add a new authoring capability, new
publication semantics, a commercial billing system, or post-V1 product scope.

## 4. Fixed Decisions

### 4.1 Source of truth

- PostgreSQL relational Working Draft, Revision, Publication, Publish Link, and
  access-policy rows remain authoritative.
- File storage remains authoritative for protected bytes.
- Search rows, response validators, initial HTML, sitemap, robots, and social
  metadata are derived projections.
- A rebuild must derive from the same exact Revision/Publication and must not
  create, mutate, replace, or repoint a Publication.
- No Redis, CDN, search service, queue, analytics service, or second content
  store is introduced.

### 4.2 Product quota versus operator ceiling

These are different contracts:

1. **Organization product quota**
   - owned by the Organization;
   - nullable;
   - `null` means no Organization product quota;
   - enforced across all Projects and Project Versions in that Organization;
   - changed only by an active Organization Owner;
   - lowering below usage never deletes or rewrites data and only blocks
     quota-increasing commands.
2. **Operator safety ceiling**
   - process/deployment configuration;
   - non-bypassable by product settings;
   - protects memory, CPU, parser, database, storage, and availability;
   - positive and bounded; never interpreted as a commercial quota;
   - reported without secrets or customer content.
3. **Correctness serialization**
   - one active Publication preparation for one Site Edition;
   - cannot be disabled;
   - independent of both product quotas and process-wide admission.

### 4.3 V1 configurable quota dimensions

Implement only dimensions with complete measurement and enforcement paths:

- `active_sites_limit`
  - usage is the number of stable Documentation Sites with at least one active
    Site Edition in the Organization;
  - creating a new stable Site or restoring the first active Edition can grow
    usage;
  - adding an Edition to a Site that already has another active Edition does
    not grow this usage;
- `active_pages_limit`
  - usage is the number of active Pages whose owning Site Edition is active
    across the Organization;
  - Page create/import/Carry-Forward/restore can grow usage;

“Active” here uses stored Documentation Edition/Page lifecycle, not inherited
effective read-only state from an archived Project or Project Version. Parent
archive does not rewrite children and therefore does not silently free product
quota. Restoring an Edition checks both the active-Site delta and every
stored-active Page that becomes active with it.

Do not add Project allocations, monetary plans, per-user quotas, concurrent-job
product quotas, or quotas for every existing hard constant.

`retained_file_bytes` remains required usage/health information but is not a
configurable V1 product quota. V1 deliberately has no governed permanent-delete
path, and archiving must retain bytes protected by Revisions/Publications.
Adding a byte quota that an Organization cannot safely reduce would violate the
accepted “corrective work remains possible” rule. Operator storage monitoring
and existing upload/job ceilings protect the host until a later governed
deletion decision can define a remediable byte quota.

### 4.4 Publication admission

- Publication remains an explicit synchronous command; “scheduling” here means
  bounded admission and execution, not future-date publishing.
- Keep the existing idempotency contract.
- Replace indefinite same-Edition lock waiting with a typed busy result.
- Add process-local total and per-class bounded admission for expensive
  Publication preparation and projection rebuild work.
- Apply a transaction-local PostgreSQL statement timeout for Publication
  preparation.
- A timeout, admission refusal, validation failure, or preparation failure
  leaves the live Publish Link entry unchanged.
- An unrelated Site may publish concurrently up to the operator ceiling.
- A process-local ceiling is honestly reported as per-process and not
  multi-instance global.
- Do not build a durable job table or polling UI in V1.

### 4.5 Cache and rebuild

- Do not add an in-process content cache merely to satisfy the word “cache.”
- Public access is resolved before any body/validator is returned.
- Restricted/password-gated responses use `private, no-store`.
- Mutable default/version link routes must be revalidated and must not be
  treated as immutable solely because their selected Publication currently is.
- Exact Publication-derived representations use an ETag based on
  Publication/output digest plus representation key. A matching
  `If-None-Match` may return `304` only after current link/access resolution.
- Vary on the minimum access-relevant headers/cookies. Never share a restricted
  representation as public cache content.
- Rebuild covers persisted draft search rows and a new versioned exact
  Publication search generation. It validates exact output digest, writes a
  complete immutable generation, and atomically switches only the derived
  projection selector.
- Rebuild never moves a Publish Link, creates a Revision/Publication, alters
  content, or changes publication sequence.

### 4.6 Search

- Keep PostgreSQL full-text search and the current `simple` configuration.
- Preserve exact Project/Version/Site scope for draft search and exact selected
  Publication scope for public search.
- Ranking order is deterministic:
  1. title exact/prefix match;
  2. heading/title weighted match;
  3. description/body match;
  4. canonical path and stable Page ID tie-break.
- exact/prefix comparisons are parameterized and escape SQL wildcard
  characters; ranking never concatenates raw query text into SQL;
- Raw queries, search documents, excerpts, slugs, and Page bodies do not enter
  Audit/Access Evidence or operational logs.
- Rebuild uses the same safe text extraction as normal save/publication.
- No Organization-wide, cross-artifact, external, semantic, vector, or
  analytics search is added.

### 4.7 Public discovery and canonical ownership

The accepted Question `26` boundary is not satisfied by making every
unrestricted Publish Link self-canonical. Add one explicit discovery policy per
Documentation Publish Link:

- `indexing_enabled` is an administrative search-engine guidance setting, not
  access control;
- `is_primary_canonical` identifies at most one Publish Link for one stable
  Documentation Site;
- only active, unexpired, unrestricted links may be indexable or primary;
- restricted, revoked, expired, and historical surfaces are always `noindex`
  regardless of stored policy;
- a non-primary link is `noindex`;
- when a non-primary link exposes the same exact Publication/version as the
  primary link, its canonical URL points to the matching primary-link route;
- when no matching primary route exists, it remains self-canonical but
  `noindex`; it never points to different/newer content;
- sitemap output exists only for the currently effective primary/indexable
  link;
- changing access to restricted or revoking/expiring the primary fails closed
  to `noindex`; it does not silently promote another link;
- selecting a new primary is an explicit Project Admin/Organization Owner
  mutation with expected Row Version and Audit Evidence;
- creation of the first eligible unrestricted link for a Site creates a
  primary/indexable policy in the same publication transaction; later or
  restricted links default non-primary/noindex;
- social metadata remains safe on an unrestricted non-indexed link, but it
  cannot imply that link is the canonical indexed authority.

For upgrade compatibility, migration `031` deterministically selects the
oldest active, unexpired, unrestricted Documentation Publish Link per stable
Site as the initial primary/indexable link. Other existing links become
non-primary/noindex. If no eligible link exists, the Site has no primary.

### 4.8 Public initial HTML and deployment ownership

The canonical public path remains:

```text
/docs/:publish_link_slug
/docs/:publish_link_slug/:page_path
/docs/:publish_link_slug/versions/:version_slug
/docs/:publish_link_slug/versions/:version_slug/:page_path
/docs/:publish_link_slug/operations/:operation_key
/docs/:publish_link_slug/versions/:version_slug/operations/:operation_key
```

Fastify must become the initial-document owner for these `/docs/**` GET/HEAD
requests in both local validation and the documented production reverse-proxy
contract. It must:

- resolve access and exact Publication before rendering content;
- return route-correct `200`, canonical `308`, intentional `410`, password
  challenge `401`, or non-enumerating unavailable `404`;
- emit a meaningful, escaped initial document for public content;
- emit route-specific title, description, canonical, Open Graph, and Twitter
  metadata from the exact Publication;
- emit `<html lang>` from the exact Revision primary language;
- emit the same restrictive production CSP contract as the reviewed Vite
  build, including the exact Try-It `connect-src` ceiling and no executable
  inline script;
- include a stable app mount and the reviewed Vite entry assets so the existing
  React reader can enhance the document;
- avoid embedding private draft/review/Try-It policy, credentials, internal
  IDs, raw search documents, or hidden content;
- never render restricted Page content before the viewer session is valid;
- use the exact same route resolution and safe public projection as the JSON
  API;
- preserve CSP and the browser-direct Try-It origin digest contract.

The implementation must generate/read a Vite manifest for production entry
assets and use the Vite development entry in development. Production assets
remain same-origin with `PUBLIC_WEB_URL`; an external asset/CDN origin is not
introduced in V1. It must fail startup in production when the manifest/asset
base required for public initial HTML is invalid, rather than serving an HTML
shell without working assets.

Parse and freeze the manifest at startup. Accept only the expected app entry,
relative normalized hashed asset paths under the configured same-origin base,
and reviewed CSS/import relationships. Reject absolute URLs, traversal,
unexpected protocols, missing entry assets, and manifest changes that require
process reload; never read a caller-selected manifest path during a request.

The deployment documentation must require `/docs/**` to reach Fastify while
web static assets and other portal routes remain on the Vite/static web host.
This is a deployment-boundary adjustment, not a router replacement, custom
domain feature, or general server-side rendering framework.

### 4.9 Retention

- Immutable Revisions, Publications, review evidence, and protected Files
  remain retained.
- Archive remains the product lifecycle action.
- Import inspection expiry cleanup remains bounded.
- No automatic permanent deletion or customer-content TTL is added.
- Usage reports distinguish active counts from retained counts/bytes.
- draft-search rebuild excludes archived Sites/Editions/Pages and may
  transactionally replace the draft projection with zero rows for an archived
  Edition;
- exact Publication rebuild remains available for retained immutable
  Publications even when the source Edition/Page/Asset is archived;
- an archived source never makes a currently selected Publication disappear;
- Backups must include database and File storage from one consistent recovery
  point; database-only restore is not called complete.

## 5. Domain Language and Invariants

Add the following plan-local terms to implementation comments/types only where
they improve clarity. Do not change `CONTEXT.md` unless implementation reveals a
durable glossary gap.

- **Documentation Limits:** Organization-owned nullable product limits.
- **Documentation Usage:** content-free counts/bytes computed for one
  Organization.
- **Publication Admission:** process-local capacity check before opening
  expensive preparation.
- **Projection Rebuild:** deterministic recreation of disposable search/public
  representation rows from authoritative state.
- **Public Initial Document:** route-specific HTML returned before the React
  application executes.

Required invariants:

- usage and limits are always scoped by server-resolved Organization;
- every quota-increasing command locks the Organization quota namespace,
  remeasures authoritative usage in the mutation transaction, and fails before
  authoritative database writes if the effective limit would be exceeded;
- non-authoritative staged File bytes created before an import/apply quota check
  are cleaned on denial, abort, and rollback; locks never span File-storage I/O;
- archive/export/read/rebuild/corrective actions remain possible while usage is
  over a lowered limit;
- enforcement is per dimension: a command with zero delta for an over-limit
  dimension is not blocked by that dimension, while every positive delta is
  checked against its own limit;
- restoring or importing is quota-increasing and must be checked;
- quota errors and safety-ceiling errors are distinct typed outcomes;
- mutable limit updates use expected Row Version and atomic Audit Evidence;
- operational measurements contain no customer content or identifiers that are
  unnecessary for aggregation;
- rebuild output for an unchanged Publication is byte/digest stable;
- immutable Publication search-document rows are never updated or deleted;
  recovery creates a new immutable generation and atomically switches a
  derived selector;
- a failed rebuild leaves the prior valid projection available;
- public link/access resolution precedes HTML, JSON, search, asset, ETag, and
  `304` decisions;
- no Publication failure changes the live link;
- no server log or metric contains Try-It credentials/request/response bodies,
  Page bodies, comments, review reasons, raw search queries, protected URLs,
  passwords, IP profiles, user agents, or referrers.

## 6. Shared Constants and Schemas

### 6.1 Constants

Extend `packages/constants/src/documentation.ts` with:

- quota dimension names:
  `active_sites`, `active_pages`, `retained_file_bytes`;
- operator-bound min/max/default constants for:
  - Publication concurrency per process;
  - Publication timeout milliseconds;
  - rebuild batch/page ceiling;
  - initial HTML serialized-byte ceiling;
  - public metadata title/description lengths;
- operational outcome names:
  `within_limit`, `at_limit`, `over_limit`;
- projection kinds:
  `draft_search`, `publication_search`;
- rebuild outcomes:
  `rebuilt`, `unchanged`.

Defaults must preserve current accepted content ceilings. They must be
conservative enough for the deterministic upper-bound fixture and configurable
within reviewed hard min/max values.

Do not make existing content safety constants environment-dependent in this
child. Operator settings may only tighten/limit expensive admission and
execution; they must not silently reinterpret persisted valid content.

### 6.2 Strict shared types

Extend `packages/types/src/documentation.ts` and
`packages/types/src/documentation.test.ts` with strict Zod contracts:

```ts
DocumentationOrganizationLimitsSchema = {
  active_sites_limit: positiveInt.nullable(),
  active_pages_limit: positiveInt.nullable(),
  version: nonNegativeInt, // 0 is the virtual no-row version
  updated_at: isoTimestamp.nullable()
}

DocumentationOrganizationUsageSchema = {
  active_sites: nonNegativeInt,
  active_pages: nonNegativeInt,
  retained_file_bytes: nonNegativeSafeInt,
  retained_revisions: nonNegativeInt,
  retained_publications: nonNegativeInt,
  active_import_inspections: nonNegativeInt,
  open_review_requests: nonNegativeInt
}

DocumentationLimitStateSchema = {
  dimension: enum,
  usage: nonNegativeSafeInt,
  limit: positiveSafeInt.nullable(),
  state: "within_limit" | "at_limit" | "over_limit"
}

DocumentationOperationsSummarySchema = {
  limits: DocumentationOrganizationLimitsSchema,
  usage: DocumentationOrganizationUsageSchema,
  states: DocumentationLimitStateSchema[],
  permissions: {
    can_manage_limits: boolean
  },
  generated_at: isoTimestamp
}

UpdateDocumentationOrganizationLimitsRequestSchema = {
  expected_version: nonNegativeInt,
  active_sites_limit: positiveInt.nullable(),
  active_pages_limit: positiveInt.nullable()
}

DocumentationProjectionRebuildRequestSchema = {
  projection: "draft_search" | "publication_search",
  publication_id?: id,
  expected_output_digest?: sha256
}

DocumentationProjectionRebuildReceiptSchema = {
  projection: enum,
  site_id: id,
  publication_id: id.nullable(),
  output_digest: sha256.nullable(),
  documents: nonNegativeInt,
  outcome: "rebuilt" | "unchanged"
}

DocumentationDiscoveryPolicySchema = {
  publish_link_id: id,
  indexing_enabled: boolean,
  is_primary_canonical: boolean,
  effective_indexing: boolean,
  effective_reason:
    "enabled" | "disabled" | "not_primary" | "restricted" |
    "revoked" | "expired",
  version: positiveInt
}

UpdateDocumentationDiscoveryPolicyRequestSchema = {
  expected_version: positiveInt,
  indexing_enabled: boolean,
  is_primary_canonical: boolean
}
```

Responses must reject unknown fields. File-byte values must remain safe
JavaScript integers. Do not serialize raw File keys, Page/search text, customer
slugs, Try-It origins, credentials, or review content.

### 6.3 Domain policy

Create:

- `packages/documentation-domain/src/policies/documentation-operational-policy.ts`
- `packages/documentation-domain/src/policies/documentation-operational-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-csp-policy.ts`
- `packages/documentation-domain/src/policies/documentation-csp-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-csp-policy.ts`
- `packages/documentation-domain/src/policies/documentation-csp-policy.test.ts`

Export it from `packages/documentation-domain/src/index.ts`.

It owns pure functions for:

- nullable limit validation;
- limit-state calculation;
- quota-increase checks, including current over-limit behavior;
- exact distinction between product quota and hard safety ceiling errors;
- publication timeout/concurrency configuration bounds;
- deterministic ETag representation-key construction;
- metadata truncation without invalid Unicode.

The shared CSP policy owns deterministic parsing/digesting of the operator
origin set and construction of the common production directives. The web Vite
adapter and Fastify initial-document renderer must consume that one pure policy;
they must not maintain two handwritten `connect-src` implementations.

Extend
`packages/documentation-domain/src/errors/documentation-domain-error.ts` with
typed codes:

- `documentation_organization_quota_exceeded`;
- `documentation_publication_capacity_exceeded`;
- `documentation_publication_timed_out`;
- `documentation_rebuild_capacity_exceeded`;
- `documentation_projection_rebuild_invalid`;
- `documentation_projection_rebuild_failed`;
- `documentation_discovery_policy_invalid`.

Do not expose current usage for a resource the caller cannot authorize.

## 7. Persistence and Migration 031

Create:

`apps/server/src/db/migrations/031_documentation_v1_operational_hardening.sql`

### 7.1 Organization limits table

Add `documentation_schema.organization_documentation_limits`:

| Column                      | Contract                                        |
| --------------------------- | ----------------------------------------------- |
| `organization_id`           | `VARCHAR(26)` primary key, same-Organization FK |
| `active_sites_limit`        | nullable positive integer                       |
| `active_pages_limit`        | nullable positive integer                       |
| `version`                   | positive persisted Row Version, default `1`     |
| `created_by_id`             | same-Organization actor FK                      |
| `updated_by_id`             | same-Organization actor FK                      |
| `created_at` / `updated_at` | timestamps                                      |

Rules:

- one row per Organization;
- absence reads as all-null limits with virtual version `0`;
- first update requires `expected_version: 0` and inserts version `1`; later
  updates require the current positive Row Version and increment it;
- an all-null request against virtual version `0` is an idempotent no-op and
  does not create/audit a meaningless row;
- the Organization advisory lock encloses the absence check/insert so two
  concurrent first updates cannot both succeed;
- actor FKs must belong to the same Organization;
- values are `NULL` or greater than zero;
- no Project ID exists in this table;
- no quota usage counters are persisted.

Add runtime-role grants consistent with prior Documentation migrations and an
Audit trigger/guard so limit mutations cannot commit without the expected
Audit Evidence.

### 7.2 Projection metadata and immutable generations

Add:

- `source_digest` to
  `documentation_schema.documentation_draft_search_document`;
- `heading_text` and `body_text` safe projection fields to both draft and
  Publication search documents; neither includes comments, review state, raw
  OpenAPI source, credentials, or operational fields;
- `ranking_vector`, generated with title weight `A`, heading/description weight
  `B`, and body weight `C`, to the draft search table;
- `publish_schema.site_publication_search_generation` with:
  - generated ID;
  - Organization, Project, and exact Site Publication scope;
  - monotonically increasing generation number per Publication;
  - exact Publication output digest;
  - nullable aggregate projection digest;
  - document count;
  - `ready | requires_rebuild` status;
  - maintenance-only `legacy_compatible` marker;
  - `org_user | system` creation actor type, nullable same-Organization
    `created_by_id` required only for `org_user`, and timestamp;
- `publish_schema.site_publication_search_selection` with one row per exact Site
  Publication selecting one complete generation;
- `search_generation_id` on
  `publish_schema.site_publication_search_document`;
- the same weighted generated `ranking_vector` on Publication search
  documents;
- uniqueness of `(search_generation_id, source_page_id)`;
- scoped FKs ensure the selection and every document belong to the same
  Organization/Project/Publication generation;
- a deferred constraint trigger verifies document count and permits selection
  of either a complete `ready` generation with a non-null aggregate projection
  digest or the migration-created generation `1` marked
  `requires_rebuild + legacy_compatible`;
- runtime SQL cannot create `legacy_compatible` generations and may switch a
  selector only to `ready`;
- indexes required to rebuild/select by Organization/Site/Publication without
  scanning another tenant;
- checks that digests are lowercase SHA-256 values.

Migration `031` creates maintenance-only legacy-compatible generation `1` for
each existing Publication, attaches its existing immutable search rows to that
generation, marks it `requires_rebuild`, and selects it so coordinated upgrade
reads remain available. The migration may temporarily replace the existing
immutable search trigger only inside the maintenance migration transaction;
runtime never receives UPDATE/DELETE permission for immutable search documents.
The upgrade task computes a new aggregate projection digest through the
application serializer and switches to a complete `ready` generation. Do not
invent a SQL digest that falsely claims application parity.

Publication creation writes generation `1`, all search documents, and the
selector before the live link switch. Rebuild writes generation `n+1` and all
documents, validates count/digest, then switches only
`site_publication_search_selection` in the same transaction. Prior generations
remain immutable recovery evidence; repeated rebuild with identical selected
digest/rows returns `unchanged` and creates no generation.

### 7.3 Publish Link discovery policy

Add `publish_schema.documentation_discovery_policy`:

| Column                                                     | Contract                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| `publish_link_id`                                          | primary key and same-scope Documentation Publish Link FK    |
| `organization_id` / `project_id` / `documentation_site_id` | redundant scoped FKs used for tenant and primary uniqueness |
| `indexing_enabled`                                         | explicit boolean                                            |
| `is_primary_canonical`                                     | explicit boolean                                            |
| `version`                                                  | positive Row Version                                        |
| `created_by_id` / `updated_by_id`                          | same-Organization actor FKs                                 |
| timestamps                                                 | created/updated                                             |

Add:

- a partial unique index allowing only one `is_primary_canonical=TRUE` row per
  `(organization_id, documentation_site_id)`;
- constraints that the referenced Publish Link has
  `resource_family='documentation_site'` and the same
  Site/Project/Organization;
- runtime grants and Audit guards for insert/update;
- migration-owned initial rows using the deterministic upgrade rule in section
  4.7 and the existing Publish Link creator as migration provenance.

Stored booleans never override current Publish Link visibility, status, expiry,
or entry selection. Effective discovery is computed at read time and fails
closed.

### 7.4 Migration behavior

- Migration is additive.
- Existing Organizations behave as unlimited because no row means all `null`.
- Existing Documentation remains valid.
- Existing search output remains readable during the coordinated upgrade.
- No synthetic limits are backfilled. Discovery rows are an explicit
  compatibility backfill, not product quota state.
- No legacy Documentation content is rewritten.
- Down migration must refuse when any Organization limits row exists, any
  discovery policy differs from its migration-created compatibility value, any
  Publication has a generation newer than the migration-created generation
  `1`, or any post-up projection metadata cannot be safely collapsed under the
  repository's guarded rollback policy.
- Update:
  - `apps/server/src/db/foundation-schema.test.ts`;
  - `apps/server/src/db/foundation-schema.db.integration.test.ts`;
  - `apps/server/src/db/audit-schema-verification.ts`;
  - `apps/server/src/db/audit-schema-verification.test.ts`;
  - `apps/server/src/db/provision-runtime-role.test.ts`;
  - migration/reset/reseed expectations that enumerate accepted schema objects.

## 8. Server Configuration and Admission

Create:

- `apps/server/src/config/documentation-operations.config.ts`
- `apps/server/src/config/documentation-operations.config.test.ts`
- `apps/server/src/modules/documentation/documentation-work-admission.ts`
- `apps/server/src/modules/documentation/documentation-work-admission.test.ts`

Supported environment variables:

```text
OSSIE_DOCUMENTATION_HEAVY_WORK_CONCURRENCY
OSSIE_DOCUMENTATION_PUBLICATION_CONCURRENCY
OSSIE_DOCUMENTATION_REBUILD_CONCURRENCY
OSSIE_DOCUMENTATION_PUBLICATION_TIMEOUT_MS
OSSIE_DOCUMENTATION_REBUILD_BATCH_SIZE
OSSIE_DOCUMENTATION_INITIAL_HTML_MAX_BYTES
OSSIE_DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MS
OSSIE_DOCUMENTATION_TRY_IT_WEB_ORIGIN_SET_DIGEST
OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH
OSSIE_DOCUMENTATION_WEB_ASSET_BASE
```

Accepted defaults and compiled bounds:

| Setting                      |     Default |    Minimum |         Compiled maximum |
| ---------------------------- | ----------: | ---------: | -----------------------: |
| total heavy-work concurrency |         `2` |        `1` |                     `16` |
| Publication concurrency      |         `2` |        `1` | `16` and not above total |
| rebuild concurrency          |         `1` |        `1` |  `4` and not above total |
| Publication timeout          | `300000 ms` | `10000 ms` |             `1800000 ms` |
| rebuild batch size           |       `100` |        `1` |                    `500` |
| initial HTML bytes           |    `16 MiB` |    `1 MiB` |                 `32 MiB` |
| Try-It DNS timeout           |   `2000 ms` |   `250 ms` |               `10000 ms` |

The representative upper-bound fixture must pass with defaults. If measurement
proves a default unsafe or insufficient before runtime ships, update this plan
and the recorded rationale rather than silently choosing a different value.

Rules:

- parse positive integers once through startup validation;
- enforce reviewed min/max bounds;
- never accept zero, negative, NaN, fractional, or effectively unlimited
  values;
- production requires an absolute readable Vite manifest path and an asset base
  that resolves to the same configured public-web origin; a relative
  same-origin asset base is preferred;
- development may use the Vite source entry;
- total/per-class admission is process-local, non-waiting, abort-aware, and has
  no waiter queue; per-class values cannot exceed the total;
- admission refusal returns `503` with bounded `Retry-After`;
- same-Edition busy returns `409`;
- only PostgreSQL statement cancellation caused by this command's configured
  timeout maps to the typed timeout response; client aborts and unrelated
  database errors keep distinct safe outcomes and all roll back;
- admission slots release on success, error, timeout, abort, and disconnect.

The existing shared Documentation Page/block/import/OpenAPI/Try-It constants
remain compiled absolute safety maxima because the web and server validate the
same contract. Child `138` must inventory and report them, not make them
deployment-dependent or silently accept persisted shapes one side rejects.
Operator-configurable values are limited to work/admission concerns that do not
change persisted schema meaning: Publication concurrency/timeout, rebuild batch,
initial-document bytes, DNS-validation timeout, and the existing generic
request/upload settings. Defaults preserve current behavior; every configurable
value has a non-bypassable compiled maximum.

Update:

- `apps/server/src/config/startup.config.ts`;
- `apps/server/src/config/startup.config.test.ts`;
- `apps/server/src/config/production-env-report.ts`;
- `apps/server/src/config/production-env-report.test.ts`.

The environment report may expose numeric ceilings, manifest-configured
boolean, asset-base same-origin validity, Try-It origin count/digest, and the
fact that publication admission is per-process. It must not expose filesystem
paths, Try-It origin values, credentials, private URLs, or customer content.
The pre-existing operator-only CORS origin report is not broadened or copied
into health/public responses.

## 9. Operations Repository, Service, and API

Create:

- `apps/server/src/modules/documentation-operations/documentation-operations.repository.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.repository.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.service.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.service.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.routes.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.routes.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.db.integration.test.ts`
- `apps/server/src/operations/documentation-projection-rebuild.cli.ts`
- `apps/server/src/operations/documentation-projection-rebuild.cli.test.ts`

Register the module in `apps/server/src/app.ts` and update `apps/server/src/app.test.ts`.

### 9.1 Organization operations routes

#### `GET /api/v1/organization/documentation/operations`

- active Organization members may read safe aggregate usage and limit state;
- Organization Owners see the same payload; there is no secret/operator-only
  field in this response;
- response: `DocumentationOperationsSummarySchema`;
- `Cache-Control: private, no-store`;
- no Project/page/file/link identifiers;
- logical success/denial is Access Evidence; aggregate values are not copied
  into evidence.

#### `PUT /api/v1/organization/documentation/limits`

- active Organization Owner only;
- body: `UpdateDocumentationOrganizationLimitsRequestSchema`;
- response: `{ limits, usage, states }`;
- expected-version conflict returns `409
documentation_row_version_conflict` with the latest safe limits;
- lowering below usage succeeds and produces `over_limit`;
- all-null limits are valid and mean unlimited;
- mutation and Audit Evidence commit in one transaction;
- Audit diff contains dimension names and old/new numeric/null values only;
- `Cache-Control: private, no-store`.

#### `POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/projections/rebuild`

- active Organization Owner only;
- body: `DocumentationProjectionRebuildRequestSchema`;
- server resolves Organization, Project Version, Site Edition, and Publication
  through the authenticated route hierarchy;
- rebuild one explicit Site draft or one explicit immutable Publication;
- expected digest mismatch fails `409` before replacement;
- transactional stage/validate/swap; no empty/partial window;
- response: `DocumentationProjectionRebuildReceiptSchema`;
- repeated identical rebuild is deterministic and returns `unchanged` when
  rows already match;
- Audit records projection kind, root IDs, result count, and digest only;
- no search/body text enters Audit, Access Evidence, or logs.

Bulk Organization rebuild, Organization-wide Site enumeration, scheduled
recurring rebuild, and arbitrary SQL repair are not API scope. Operator docs
may show a bounded loop over already-authorized explicit resources only.

### 9.2 Publish Link discovery routes

These routes stay in the existing Documentation module:

#### `GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/discovery-policy`

- authorized Project Member read after exact Organization/Project/Version/Site/
  Link resolution;
- response: `DocumentationDiscoveryPolicySchema`;
- includes stored and effective state/reason, never another link's private
  settings;
- `Cache-Control: private, no-store`.

#### `PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/discovery-policy`

- Project Admin or Organization Owner only;
- body: `UpdateDocumentationDiscoveryPolicyRequestSchema`;
- setting primary locks the stable Site discovery namespace and atomically
  clears both `is_primary_canonical` and `indexing_enabled` on the prior primary
  before selecting this link;
- link must currently be active, unexpired, unrestricted, and have a selected
  Documentation Publication entry before it can become primary/indexable;
- setting `indexing_enabled=true` without primary is rejected rather than
  creating an ineffective ambiguous setting;
- stale Row Version returns the latest safe policy;
- mutation and Audit Evidence commit atomically;
- no Publication, Publish Link entry, or content is changed.

### 9.3 Maintenance projection command

Create a non-HTTP maintenance command for coordinated upgrade and recovery:

```text
pnpm --filter server maintenance:documentation-projections -- --dry-run
pnpm --filter server maintenance:documentation-projections -- --all-legacy
pnpm --filter server maintenance:documentation-projections -- --publication-id <id>
```

- uses maintenance database credentials and the existing technical/system Audit
  actor boundary; runtime API credentials cannot invoke it;
- `--dry-run` is the default unless one explicit mutation flag is present;
- `--all-legacy` processes active draft projections and migration-created
  legacy Publication generations in stable bounded batches;
- an opaque resume cursor/checkpoint may be printed, but never customer text,
  slugs, paths, or credentials;
- one failure stops the command non-zero after preserving all prior complete
  per-root transactions; rerun is idempotent;
- each successful root rebuild records system Audit Evidence with IDs/digests/
  counts only;
- it cannot move Publish Links, create content Revisions/Publications, change
  discovery policy, or bypass projection validation.

### 9.4 Error/status contract

| Condition                         |                     Status | Type                                                                              |
| --------------------------------- | -------------------------: | --------------------------------------------------------------------------------- |
| unauthenticated                   |                        401 | existing auth error                                                               |
| non-member/non-owner              | 403 or non-enumerating 404 | existing scoped policy                                                            |
| stale limits version/digest       |                        409 | `documentation_row_version_conflict` / `documentation_projection_rebuild_invalid` |
| Organization quota exceeded       |                        422 | `documentation_organization_quota_exceeded`                                       |
| same-Edition Publication busy     |                        409 | `documentation_publication_busy`                                                  |
| process Publication capacity full |                        503 | `documentation_publication_capacity_exceeded`                                     |
| process rebuild capacity full     |                        503 | `documentation_rebuild_capacity_exceeded`                                         |
| Publication statement timeout     |                        503 | `documentation_publication_timed_out`                                             |
| unsafe/invalid rebuild            |                        422 | `documentation_projection_rebuild_invalid`                                        |
| rebuild execution failed          |                        500 | `documentation_projection_rebuild_failed`                                         |
| invalid discovery policy          |                        422 | `documentation_discovery_policy_invalid`                                          |

Messages must be actionable but content-free. Capacity and timeout responses
must not disclose other tenants or job identities.

## 10. Quota Enforcement in Existing Commands

Update:

- `apps/server/src/modules/documentation/documentation.repository.ts`;
- `apps/server/src/modules/documentation/documentation.repository.test.ts`;
- `apps/server/src/modules/documentation/documentation.service.ts`;
- `apps/server/src/modules/documentation/documentation.service.test.ts`;
- `apps/server/src/modules/documentation/documentation.routes.ts`;
- `apps/server/src/modules/documentation/documentation.routes.test.ts`;
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`.

Before any quota-increasing write:

1. resolve Organization from the authenticated server context;
2. acquire an Organization-scoped advisory transaction lock distinct from the
   Edition path/publication locks;
3. read current limits;
4. calculate current authoritative usage;
5. calculate the command delta without trusting client counts;
6. reject if `usage + positive_delta > limit`;
7. perform the existing mutation and Audit behavior.

Global lock order is Organization quota namespace first, then stable
Site/Edition/path/publication locks, then row locks. Every affected command and
concurrency test must use that order; no existing helper may acquire an Edition
lock and then call back into quota acquisition.

Cover all growth paths:

- Site create, checking both the new active Site and generated Home Page;
- Site import apply that creates a Site, checking the complete applied Page
  graph;
- Carry-Forward that creates the first active Edition of an otherwise inactive
  stable Site;
- Edition restore where it changes active-Site usage;
- Edition restore for all active Pages reactivated with that Edition;
- Page create;
- Page restore;
- Page/site package import apply;
- Carry-Forward Page creation.

Upload, OpenAPI, and embedded-Asset paths do not consume a configurable byte
quota in V1, but they do contribute to `retained_file_bytes` usage and remain
subject to operator/request and compiled absolute safety ceilings. If a package
or upload stages File bytes before a Site/Page quota transaction, those bytes
are non-authoritative staging only; a quota rejection must remove them through
the existing failure-cleanup path. Do not hold a database advisory lock across
File-storage I/O.

Do not block:

- reads/search/export;
- archive/revoke;
- comment resolution;
- review cancellation;
- projection rebuild;
- rollback to a retained Publication;
- import inspection/cancellation before apply;
- failed commands with no persisted growth.

Deduplicate File IDs when measuring retained bytes. The authoritative union is:

- current Documentation-owned Asset Files;
- current OpenAPI Source Files;
- immutable Revision Asset references whose source kind is
  `documentation_asset`;
- immutable frozen OpenAPI Source Files.

Capture-owned Files and transient import inspection/export Files are excluded.
Never infer freed bytes from archiving. Transient Files follow their existing
cleanup policy and do not count as authoritative usage.

## 11. Publication and Projection Hardening

### 11.1 Publication admission and creation

Update existing publication flow in the Documentation repository/service:

- acquire total plus Publication-class process admission before opening the
  expensive transaction;
- use a non-blocking PostgreSQL advisory correctness lock for the Site Edition;
- set a transaction-local statement timeout from validated operator config;
- preserve current idempotency replay;
- prepare Revision validation and search rows before link switch;
- compute draft-document source digests and one deterministic aggregate
  Publication projection digest;
- compare rebuilt rows/digest before replacement;
- release admission on all exits;
- report only outcome category and duration bucket through the existing logger
  seam; do not add customer identifiers or content.

Failure-injection tests must prove:

- capacity full makes no database write;
- same-Edition busy makes no Revision/Publication/link mutation;
- timeout rolls back new Revision/Publication/search rows/Audit;
- search-row insertion failure leaves the live link untouched;
- Audit failure rolls back the mutation;
- retry with the same idempotency key is stable;
- unrelated Sites may proceed;
- rebuild failure preserves existing valid rows;
- rollback never rebuilds or mutates the selected old Publication.

### 11.2 Public read-model decomposition

The current `resolve_public_site` path loads a complete Revision snapshot and
all Publication search documents before Page, search, operation, metadata, or
Asset handlers narrow it. Child `138` must remove that upper-bound over-fetch:

- resolve link/access/current entry/exact Publication/Revision/discovery policy
  first through one small selection query;
- load a Page route as Site/Edition metadata, safe navigation labels, the one
  selected Page, only Snippets expanded by that Page, and only referenced
  public Asset/OpenAPI data;
- load an operation route as exact operation/descriptor plus the minimal Site
  and navigation context needed by the operation reader;
- execute public search directly against the selected active search generation
  and return only bounded strict results;
- build sitemap/robots/canonical metadata from safe Page/routing headers, not
  Page blocks or all search text;
- resolve an Asset by exact selected Publication reference without loading the
  Site graph;
- keep root/Home, Page, operation, search, metadata, and Asset loaders behind
  route-specific repository methods even if they share one internal selection
  helper;
- preserve existing strict public response schemas and non-enumerating access
  outcomes;
- add query-count and payload-size assertions so a one-Page request does not
  regress to all-Page/all-operation loading.

The authorized selector must be passed as one exact server-owned value. A later
loader may not re-resolve a client-provided Publication ID or skip access
policy.

### 11.3 Projection rebuild

Projection rebuild uses the same route-specific safe text extraction and
generation contracts defined in sections 4.5, 4.6, and 7.2. It must never call
the public whole-Site response serializer as an accidental source of truth.
HTTP and maintenance-command rebuilds acquire total plus rebuild-class
admission before loading authoritative graphs; capacity denial performs no
mutation. The maintenance command processes one admitted root at a time unless
the configured per-class/total bounds explicitly permit more.

## 12. Public HTTP, SEO, and Initial HTML

Create:

- `apps/server/src/modules/documentation/documentation-public-html.ts`;
- `apps/server/src/modules/documentation/documentation-public-html.test.ts`;
- `apps/server/src/modules/documentation/documentation-web-assets.ts`;
- `apps/server/src/modules/documentation/documentation-web-assets.test.ts`.

Update:

- `apps/server/src/modules/documentation/documentation.routes.ts`;
- `apps/server/src/modules/documentation/documentation.routes.test.ts`;
- `apps/web/vite.config.ts`;
- `apps/web/vite.config.test.ts`;
- `apps/web/index.html` only if the production manifest/entry contract requires
  a stable mount marker;
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`;
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.test.tsx`;
- `apps/web/src/AppPublicRoutes.test.tsx`.

### 12.1 Safe HTML rendering

- use an explicit HTML escape function with tests for text, attributes, URLs,
  Unicode, and closing-tag payloads;
- render only the safe public projection already returned by strict public
  route normalization;
- do not interpolate serialized arbitrary JSON into executable script;
- if hydration/bootstrap data is embedded, use a non-executable JSON script
  node with `<`, `>`, `&`, U+2028, and U+2029 escaped and parse it through the
  existing strict schema;
- for an ordinary within-ceiling Page, embed only its strict safe public Page
  projection and let the React reader consume it once when its
  slug/version/path/output-digest identity matches;
- an over-ceiling minimal shell embeds identity/digest only, deliberately
  forcing the existing bounded authorized JSON request after JavaScript loads;
- a missing, stale, malformed, or mismatched bootstrap is ignored and falls
  back to the existing authorized JSON request;
- first client render from a valid bootstrap must not replace the meaningful
  Page with a loading flash or duplicate head metadata;
- when full selected-Page HTML exceeds the operator ceiling, return a
  route-specific `200` minimal shell containing safe title/description/
  navigation, a clear “content loads in the application” status, valid
  bootstrap identity, and `noindex`; never emit a truncated Page body or claim
  the shell is complete;
- ordinary content within the ceiling renders the complete selected Page in the
  initial document;
- password/restricted initial documents contain only the access form/general
  unavailable copy;
- canonical URLs come from `PUBLIC_WEB_URL`, never untrusted Host headers;
- canonical resolution follows the effective discovery policy in section 4.7
  and never points to a different exact Publication;
- sitemap `<loc>` values use the public web origin, XML escaping, canonical
  versioned paths, and only the primary/indexable public link;
- sitemap returns `200` only for the effective primary/indexable link; disabled,
  non-primary, restricted, revoked, or expired links return the same
  non-enumerating `404` contract as unavailable public content;
- robots returns the same content-free `User-agent: *` / `Disallow: /` response
  for disabled, non-primary, restricted, revoked, expired, and unknown links so
  status/body cannot enumerate which case exists;
- robots/meta output emits `noindex` for non-primary, disabled, restricted,
  revoked, expired, gone, denied, and historical surfaces;
- Open Graph/Twitter fields contain only safe title/description/canonical data;
- aliases use `308` to the canonical Page;
- `gone` uses `410` and never redirects to Home/latest;
- HEAD mirrors GET status/headers without a body.

### 12.2 HTTP validators and policy

- ETag includes exact Publication output digest and representation key
  (`html`, `json-root`, `json-page`, `operation`, `search`, `sitemap`,
  `robots`);
- evaluate current Publish Link entry/access before honoring `If-None-Match`;
- public mutable link routes use explicit revalidation (`public, no-cache`) and
  `must-revalidate`;
- current public Asset URLs are Publish-Link based and mutable, so they must
  resolve current access/link selection and revalidate; no current Asset route
  qualifies for long-lived `immutable` caching;
- a future identity-bearing immutable Asset URL may use long-lived immutable
  caching only after a separate compatible route contract exists;
- restricted/password responses use `private, no-store`;
- redirects/gone/error responses have explicit conservative cache policy;
- sitemap/robots never reveal a restricted link;
- include correct `Vary` for cookie/access context without varying on raw
  passwords or secrets.

### 12.3 Vite/Fastify boundary

- enable Vite manifest output;
- keep hashed web assets served by the existing web/static deployment;
- configure dev Vite so `/docs/**` reaches Fastify for initial-document proof
  while Vite assets and HMR still work;
- document production reverse-proxy routing for `/docs/**`;
- keep `/api/**` behavior unchanged;
- keep portal routes on the existing local React router;
- avoid a Fumadocs/Next/SSR framework adoption.

## 13. Web Operations UI and Code Splitting

Create:

- `apps/web/src/features/documentation/OrganizationDocumentationOperationsPage.tsx`;
- `apps/web/src/features/documentation/OrganizationDocumentationOperationsPage.test.tsx`;
- `apps/web/src/features/documentation/OrganizationDocumentationOperationsPage.module.css`;
- `apps/web/src/features/documentation/LazyDocumentationApiOperationExperience.tsx`;
- `apps/web/src/features/documentation/LazyDocumentationApiOperationExperience.test.tsx`;
- `apps/web/src/lib/documentationInitialDocument.ts`;
- `apps/web/src/lib/documentationInitialDocument.test.ts`.

Update:

- `apps/web/src/lib/documentationApi.ts`;
- `apps/web/src/lib/documentationApi.test.ts`;
- `apps/web/src/lib/routes.ts`;
- `apps/web/src/lib/routes.test.ts`;
- `apps/web/src/lib/portalRouteMetadata.ts`;
- `apps/web/src/lib/portalRouteMetadata.test.ts`;
- `apps/web/src/lib/portalNavigation.ts`;
- `apps/web/src/lib/portalNavigation.test.ts`;
- `apps/web/src/App.tsx`;
- `apps/web/src/App.test.tsx`;
- `apps/web/src/features/portal/PortalAppShell.test.tsx`;
- the three current consumers of
  `DocumentationApiOperationExperience`:
  `DocumentationOpenApiPanel.tsx`,
  `DocumentationRevisionPreviewPage.tsx`,
  and `PublicDocumentationReaderPage.tsx`, plus their tests.

### 13.1 Route and permissions

Add:

```text
/organization/documentation
```

- active Organization members may see usage and limit state;
- only Organization Owners see/edit limit inputs;
- non-owners do not receive disabled mutation controls that imply authority;
- stale update shows latest values and preserves the user's unsaved proposed
  limits for deliberate retry;
- nullable fields use an explicit “Unlimited product quota” choice, not blank
  ambiguity;
- over-limit state explains that existing content is retained and only growth
  is blocked;
- projection rebuild lives in the existing Site publishing workbench, where the
  route already supplies Project Version/Site scope and the authorized
  Publication list supplies safe labels;
- only an Organization Owner sees the rebuild control there; Project Admin
  alone is insufficient;
- rebuild requires an explicit draft/Publication target and confirmation;
- neither operations surface asks for raw internal IDs;
- the existing publishing panel shows the selected link's stored/effective
  discovery policy, primary status, and why indexing is disabled;
- Project Admin/Organization Owner may deliberately make one eligible link the
  primary indexable link with a clear duplicate-URL warning;
- restricted/revoked/expired links cannot present an enabled indexing control;
- changing the primary requires confirmation and refreshes the affected link
  lists without changing Publication selection;
- loading, empty, error, permission, conflict, success, and rebuild-failure
  states are accessible and truthful.

### 13.2 Lazy loading

- route-level lazy-load Documentation portal surfaces rather than importing all
  of them into the base app chunk;
- lazy-load the Try-It/request experience only when an operation experience is
  rendered;
- use accessible Suspense fallbacks with stable layout;
- a chunk failure produces a retryable error, not a blank Page;
- public reader content and metadata render without waiting for the Try-It
  chunk;
- disabling Try It does not fetch its client chunk;
- no credentials or request state cross the lazy boundary through global
  storage.

Record before/after:

- base app chunk raw/gzip;
- public Documentation reader chunk raw/gzip;
- Try-It chunk raw/gzip;
- authenticated Documentation workbench chunks;
- route request counts for Home, public Page, Revision operation, and draft
  operation journeys.

Do not claim an arbitrary bundle budget passed. Use measured evidence and fix a
regression when a route downloads unrelated authoring/import/review code.

## 14. Health, Readiness, Diagnostics, and Metrics

### 14.1 Health/readiness

Update `apps/server/src/app.ts` and tests:

- `/healthz` remains liveness-only and does not query customer content;
- `/readyz` continues to fail on database unavailability;
- production readiness additionally verifies:
  - migration/audit schema at expected head;
  - configured File storage root is usable;
  - public web asset manifest/base is valid when Documentation public HTML is
    enabled;
- readiness does not depend on customer Try-It origins, remote APIs, DNS
  results, individual Publications, or cache warmness;
- response reports component names and `ok|unavailable|invalid`, never paths,
  credentials, tenant IDs, content, or origin lists.

### 14.2 Content-free operational measurements

Use the existing structured logger/metrics seam if one exists at implementation
time. Do not add a third-party telemetry dependency.

Allowed aggregate measurements:

- Documentation route class and status family;
- duration bucket;
- publication admitted/busy/timed-out/succeeded/failed;
- projection rebuild succeeded/failed and document-count bucket;
- quota denial dimension;
- public ETag hit/miss;
- initial HTML size bucket;
- Try-It configuration/attempt/report outcome category already allowed by child
  `137`;
- import cleanup count and failure category.

Forbidden labels/payload:

- Organization/Project/Site/Page/Revision/Publication/Link IDs or slugs;
- Page/search/comment/review/import/OpenAPI text;
- public/private URLs;
- request or response headers/bodies;
- credentials/passwords/tokens;
- Try-It origins or DNS addresses;
- IP, user agent, referrer, or cross-request reader identity.

If the current logger cannot enforce this boundary, add a small typed
Documentation operational-event adapter and unit tests. Do not create product
analytics.

### 14.3 Try-It deployment diagnostics

Extend the existing safe env report with:

- server allowed-origin count/digest;
- web-build origin-set digest supplied by deployment;
- `match | mismatch | unavailable`;
- reload-required note because config is process/build bound;
- DNS validation mode `uncached_on_policy_and_configuration` and its bounded
  timeout.

Do not expose origin values. Do not add private-network support. A mismatch is
an operator diagnostic and must not cause the server to authorize an origin the
web CSP did not include.

Do not introduce a positive DNS cache in V1. Re-run all-address public-DNS
validation both when a Project Admin changes policy and immediately before
issuing each short-lived Try-It configuration. Bound lookup time with
`OSSIE_DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MS`; timeout, empty, mixed, private, or
resolution failure disables Send for that configuration without breaking the
read-only operation reference. DNS is not a readiness dependency. This closes
the child `137` TTL review without pretending a cached answer prevents rebinding
or matches the browser resolver indefinitely.

## 15. Security and Permission Model

### 15.1 Permission matrix

| Action                         | Organization Owner       | Organization non-owner member | Project Admin                        | Editor                               | Viewer                               | Public      |
| ------------------------------ | ------------------------ | ----------------------------- | ------------------------------------ | ------------------------------------ | ------------------------------------ | ----------- |
| Read Organization usage/limits | yes                      | yes                           | only through Organization membership | only through Organization membership | only through Organization membership | no          |
| Change Organization limits     | yes                      | no                            | no unless also Organization Owner    | no                                   | no                                   | no          |
| Rebuild explicit projection    | yes                      | no                            | no unless also Organization Owner    | no                                   | no                                   | no          |
| Manage discovery/primary link  | yes                      | no                            | yes                                  | no                                   | no                                   | no          |
| Existing authoring/publication | unchanged Project policy | unchanged                     | unchanged                            | unchanged                            | unchanged                            | no          |
| Read public initial document   | link policy              | link policy                   | link policy                          | link policy                          | link policy                          | link policy |

Organization role must come from the authenticated session/database, never a
request body.

### 15.2 Threat closure

Required negative proof:

| Threat                                     | Proof                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Cross-tenant quota/rebuild ID substitution | server-resolved Organization, scoped joins/FKs, non-enumerating errors              |
| Quota race                                 | Organization advisory transaction lock plus concurrent DB test                      |
| Publication DoS                            | bounded process admission, timeout, same-Edition try-lock, upper-bound fixture      |
| Partial publication                        | injected failure leaves live pointer and old search projection intact               |
| Search leak                                | exact tenant/Site/Publication filters before result and rebuild                     |
| Cache confusion                            | access/link resolution before ETag/304; restricted responses never public-cacheable |
| Stored/reflected XSS in initial HTML       | explicit escaping, safe projection, CSP, malicious fixture/browser test             |
| SEO leakage/duplicate authority            | restricted/revoked content absent; one explicit primary; all other links noindex    |
| Credential leakage                         | Try-It credentials remain component-memory only and absent from logs/HTML/metrics   |
| Path/host injection                        | canonical from configured public origin; encoded routes; no Host authority          |
| Dependency/supply chain                    | reviewed pins, licenses, lockfile integrity, no unnecessary runtime package         |
| Restore inconsistency                      | DB+Files recovery rehearsal and protected-reference validation                      |

### 15.3 Audit and Access coverage

Update:

- `apps/server/src/modules/audit/audit-coverage-registry.ts`;
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`;
- `apps/server/src/modules/access/access-coverage-registry.ts`;
- `apps/server/src/modules/access/access-coverage-registry.test.ts`;
- `packages/constants/src/audit.ts` and/or `packages/constants/src/access.ts`
  only if new registered actions are required;
- their existing tests.

New Audit actions:

- Organization Documentation limits updated;
- draft search projection rebuilt;
- Publication search projection rebuilt;
- Documentation Publish Link discovery policy created/updated.

Access actions:

- Organization Documentation operations read allowed/denied;
- projection rebuild target resolved/denied;
- discovery policy read allowed/denied.

Do not record health probes, readiness probes, ETag `304`, static assets,
internal projection queries, or routine public transport requests as new
logical Access Evidence. Existing public logical read outcomes remain
authoritative. A successful `/docs/**` initial document uses the same logical
public Page/operation outcome as its JSON equivalent; valid bootstrap prevents
an immediate duplicate JSON read/evidence event.

## 16. Accessibility, Motion, Responsive, and Performance

### 16.1 Automated accessibility

Component tests plus axe browser scans must cover:

- Organization operations page;
- public Page initial document and enhanced reader;
- restricted password state;
- canonical redirect/gone/unavailable states;
- public API operation with Try It disabled/enabled;
- Revision operation;
- upper-bound navigation/search;
- chunk-loading and chunk-failure states.

Target WCAG 2.2 AA. Zero automated A/AA violations is required; incomplete
contrast results require manual disposition rather than being mislabeled as a
pass.

### 16.2 Manual evidence

Record:

- keyboard-only navigation and visible focus;
- skip link and landmark/heading order before and after enhancement;
- screen-reader names/status announcements for limits, over-limit, rebuild,
  timeout, and search;
- focus restoration after confirmation/error;
- 200% zoom;
- 320 CSS-pixel reflow without two-dimensional page scrolling;
- reduced motion;
- target size/non-color-only state;
- password form autocomplete and error association;
- no focus loss across a lazy chunk boundary.

### 16.3 Performance

Use representative fixtures:

- small Site;
- upper-bound practical Site with enough Pages/blocks/search rows/OpenAPI
  operations to expose over-fetching without exceeding accepted ceilings;
- restricted Site;
- Site with Try It enabled;
- retained multi-Publication Site.

Measure:

- public initial HTML TTFB/bytes;
- LCP, CLS, and INP where the environment can produce a meaningful value;
- public Page API payload bytes and query count;
- search latency and result count;
- Publication duration and memory/CPU proxy available locally;
- projection rebuild duration;
- editor initial load and typing interaction;
- bundle/chunk sizes.

Local lab results are not production p75. Record that limitation honestly.
Targets remain Master `006`: LCP `<=2.5s`, INP `<=200ms`, CLS `<=0.1` at p75.
If production p75 evidence is unavailable, provide reproducible lab evidence,
budgets/alert recommendations, and leave production collection as a named
operator limitation rather than claiming compliance.

## 17. Dependency, Version, and License Review

Before implementation closes:

- inspect root/workspace package manifests and `pnpm-lock.yaml`;
- run the repository's dependency/license checks or a documented equivalent;
- verify official registry/repository data for direct dependencies touched by
  Documentation, especially React/Vite, Fastify, Zod, PostgreSQL client, YAML,
  Sharp, JSZip/yauzl, Markdown parser, agent-browser, axe, and Puppeteer/Chrome
  test tooling;
- record installed version, latest compatible version, license, engine/runtime
  constraints, known relevant advisories, and disposition;
- do not automatically upgrade unrelated dependencies;
- do not add an SSR framework, metrics SDK, cache client, queue, or search
  dependency;
- if a security upgrade is required, keep it in a separate scoped commit with
  lockfile and focused regression proof;
- update `THIRD_PARTY_NOTICES.md` only when the reviewed dependency graph
  actually changes.

## 18. Exact File Ownership

### 18.1 Planned new files

- `apps/server/src/db/migrations/031_documentation_v1_operational_hardening.sql`
- `apps/server/src/config/documentation-operations.config.ts`
- `apps/server/src/config/documentation-operations.config.test.ts`
- `apps/server/src/modules/documentation/documentation-work-admission.ts`
- `apps/server/src/modules/documentation/documentation-work-admission.test.ts`
- `apps/server/src/modules/documentation/documentation-public-html.ts`
- `apps/server/src/modules/documentation/documentation-public-html.test.ts`
- `apps/server/src/modules/documentation/documentation-web-assets.ts`
- `apps/server/src/modules/documentation/documentation-web-assets.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.repository.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.repository.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.service.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.service.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.routes.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.routes.test.ts`
- `apps/server/src/modules/documentation-operations/documentation-operations.db.integration.test.ts`
- `packages/documentation-domain/src/policies/documentation-operational-policy.ts`
- `packages/documentation-domain/src/policies/documentation-operational-policy.test.ts`
- `apps/web/src/features/documentation/OrganizationDocumentationOperationsPage.tsx`
- `apps/web/src/features/documentation/OrganizationDocumentationOperationsPage.test.tsx`
- `apps/web/src/features/documentation/OrganizationDocumentationOperationsPage.module.css`
- `apps/web/src/features/documentation/LazyDocumentationApiOperationExperience.tsx`
- `apps/web/src/features/documentation/LazyDocumentationApiOperationExperience.test.tsx`
- `apps/web/src/lib/documentationInitialDocument.ts`
- `apps/web/src/lib/documentationInitialDocument.test.ts`
- `docs/ui/138-documentation-v1-operational-hardening-browser-evidence.md`

Screenshots/traces may be added under `docs/ui/` only when they are stable,
redacted, useful evidence and not disposable tool output.

### 18.2 Planned modified runtime/test files

- `packages/constants/src/documentation.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`
- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/package.json`
- `apps/server/src/config/startup.config.ts`
- `apps/server/src/config/startup.config.test.ts`
- `apps/server/src/config/production-env-report.ts`
- `apps/server/src/config/production-env-report.test.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/provision-runtime-role.test.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
- `apps/server/src/modules/documentation/documentation-try-it.origin.ts`
- `apps/server/src/modules/documentation/documentation-try-it.origin.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
- `apps/web/vite.config.ts`
- `apps/web/vite.config.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/AppPublicRoutes.test.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`
- `apps/web/src/lib/portalNavigation.ts`
- `apps/web/src/lib/portalNavigation.test.ts`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/lib/documentationCsp.ts`
- `apps/web/src/lib/documentationCsp.test.ts`
- `apps/web/src/features/portal/PortalAppShell.test.tsx`
- `apps/web/src/features/documentation/DocumentationApiOperationExperience.tsx`
- `apps/web/src/features/documentation/DocumentationApiOperationExperience.test.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.tsx`
- `apps/web/src/features/documentation/DocumentationRevisionPreviewPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.tsx`
- `apps/web/src/features/documentation/DocumentationPublishingPanel.test.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.tsx`
- `apps/web/src/features/documentation/PublicDocumentationReaderPage.test.tsx`

Only modify `packages/constants/src/audit.ts`,
`packages/constants/src/access.ts`, their tests, `apps/web/index.html`,
`apps/web/package.json`, `pnpm-lock.yaml`, or `THIRD_PARTY_NOTICES.md` if the
implementation proves the stated conditional need. Record why in the
implementation log.

### 18.3 Planned documentation files

- this plan;
- `docs/plan/master/006-documentation-platform-v1-master-plan.md` only for
  genuinely completed child `138` items;
- `docs/operations.md`;
- `docs/self-hosting.md`;
- `docs/development-setup.md`;
- `docs/v1-dogfood-smoke-suite.md`;
- `.env.example` and/or the repository's authoritative environment example
  files actually present at implementation time;
- `README.md` only if its current-state deployment wording becomes false;
- `docs/status.md` or equivalent current-truth status file only if present and
  affected;
- `docs/ui/138-documentation-v1-operational-hardening-browser-evidence.md`.

No new ADR is expected. Add one only if implementation must reverse or add a
durable, surprising architecture decision not already covered by ADRs
`0027`–`0033` and Master `006`.

### 18.4 Read-only references

- `docs/plan/131-documentation-domain-grill.md`
- `docs/grill/2026-07-29-documentation-domain-grill.md`
- `docs/documentation-domain-decisions.md`
- `CONTEXT.md`
- ADRs `0027`–`0033`
- children `132`–`137`
- `docs/plan/139-documentation-v1-final-closeout.md`
- existing Capture/Guide/Demo/extension/public contracts and migrations

Do not edit read-only references merely to make this implementation easier.

## 19. Migration, Upgrade, Reset, Backup, and Compatibility

### 19.1 Upgrade order

Document and verify:

1. back up database and File storage at a consistent point;
2. stop old write-capable server processes;
3. deploy migration-capable maintenance role plus the new server command
   artifact without starting the runtime server;
4. run migration `031` and migration/audit status;
5. run the maintenance projection command in `--dry-run`, then
   `--all-legacy` bounded mode;
6. deploy/start the new server and matching Vite assets/manifest/CSP settings;
7. route `/docs/**` to Fastify;
8. verify readiness, projection status, and public initial HTML;
9. reopen writes;
10. retain the forward-fix/restore procedure.

A rolling mixed-version deployment is unsupported if old servers cannot write
the generation/discovery contracts. Once a new ready projection generation or
user-edited discovery/limit row exists, migration `031` down is deliberately
refused; recovery is restore or forward-fix, not destructive schema rollback.

### 19.2 Clean install/reset/reseed

- clean migrations `001` through `031` must pass;
- guarded `031` down/up must pass on an empty/disposable database;
- populated rollback refusal must pass;
- deterministic Documentation browser fixture must be idempotently reseedable;
- destructive reset commands remain test/development only;
- fixture includes owner/non-owner, small/upper-bound, public/restricted,
  over-limit, rebuild, publication busy/timeout injection seams, and malicious
  metadata strings without real secrets.

### 19.3 Backup/restore

Rehearse against a disposable environment:

- backup PostgreSQL;
- backup local File storage;
- restore both;
- run migrations/status/readiness;
- verify protected assets/OpenAPI Files;
- verify exact old and current Publications;
- rebuild draft and Publication search projections;
- prove output digest and public canonical routes unchanged;
- prove missing File bytes fail closed and are reported without path leakage.

Do not claim application-consistent online backup if the procedure cannot
guarantee database/File consistency.

### 19.4 Backwards compatibility

- existing API routes and response fields remain compatible;
- new response fields are additive and strict clients are updated together;
- all-null/no-row Organization limits preserve unlimited behavior;
- current hard ceilings remain effective;
- existing Publications/links/URLs remain valid;
- discovery-policy backfill changes only canonical/indexing guidance: the
  deterministic primary stays indexable, other links remain accessible but
  become noindex;
- public JSON routes remain available for the React reader;
- browser-direct Try It, exact origin policy, CSP digest, memory-only
  credentials, no redirect, link opt-in, and content-free reports remain
  unchanged;
- Guide/Demo/Capture/extension/public/embed behavior remains green;
- no compatibility Site columns are removed;
- no Tiptap/Fumadocs runtime is introduced.

## 20. TDD Implementation Order

Use red-green-refactor. Do not implement the whole server and add tests later.

1. Add failing constants/type/domain tests for limits, usage, discovery, errors,
   config, shared CSP, ETag keys, and metadata truncation.
2. Implement the smallest shared contracts/policies.
3. Add failing migration/foundation/grant/audit-guard tests.
4. Add migration `031` and make schema tests pass.
5. Add failing operations/documentation repository/service tests for usage,
   limit update, discovery, authorization, Row Version, and rebuild.
6. Implement operations repository/service/routes and Audit/Access coverage.
7. Add concurrent DB tests for quota locks and every quota-increasing path.
8. Integrate quota checks into existing mutations.
9. Add failing publication admission/busy/timeout/failure-injection tests.
10. Implement bounded admission and transaction timeout.
11. Add failing rebuild parity/isolation/atomicity tests.
12. Implement exact projection rebuild and deterministic ranking.
13. Add failing public HTML/escaping/status/primary-canonical/robots/ETag/access
    tests.
14. Implement Fastify initial-document and Vite manifest boundary.
15. Add failing web route/permission/conflict/lazy-loading tests.
16. Implement Organization operations UI, publishing discovery controls, and
    chunk boundaries.
17. Extend fixture and smoke proof.
18. Update operator/deployment/backup/upgrade docs.
19. Run focused package/server/web/DB/migration verification.
20. Run real agent-browser matrices and performance/accessibility evidence.
21. Run full regression/build/lint/type/migration/smoke matrix.
22. Recheck implementation against this plan and Master `006`; repair until
    clean.
23. Update this plan/master logs and commit only scoped changes.

## 21. Focused Test and Verification Plan

### 21.1 Package tests

- constants/type schemas accept nullable limits and virtual expected Row
  Version `0`, while rejecting zero limits, negative/unsafe integers, and
  unknown fields;
- domain state around below/at/above/lowered limits;
- discovery stored/effective/primary transitions and shared CSP parity;
- quota versus safety errors;
- config min/max/default parsing;
- ETag representation separation;
- metadata Unicode/XSS truncation.

### 21.2 Server unit/route tests

- Organization permission matrix;
- limit Row Version conflict;
- no-row unlimited default;
- safe usage response;
- typed quota/capacity/busy/timeout errors;
- `Retry-After`;
- projection rebuild ownership/digest/idempotency/failure;
- discovery permission, eligibility, single-primary, stale conflict, and
  effective fail-closed state;
- Audit/Access coverage and sensitive-field exclusion;
- initial HTML status/metadata/escaping/CSP/assets;
- `If-None-Match` only after authorization;
- restricted/public cache policy;
- primary/non-primary sitemap/robots/canonical/social isolation;
- route-specific public loaders and upper-bound query/payload shape;
- Try-It DNS revalidation timeout/mixed/private/failure behavior;
- readiness/env-report redaction.

### 21.3 Database integration

- migration constraints/FKs/grants/audit guard;
- same-Organization actor constraint;
- quota race allows only the valid final mutation;
- tenant substitution denied;
- limits first-write `expected_version: 0` race permits one winner and one
  conflict;
- active-site and active-Page archive/restore counts;
- retained distinct File-byte usage reporting, including current and immutable
  protected Documentation-owned Asset/OpenAPI File references while excluding
  Capture-owned and transient import/export Files;
- Site/Page/import/Carry-Forward/Asset/OpenAPI enforcement;
- publication try-lock/admission/timeout rollback;
- exact projection rebuild from Revision;
- failed rebuild preserves prior rows;
- digest/ranking deterministic;
- one primary discovery policy per stable Site, same-scope FKs, compatibility
  backfill, and atomic primary replacement;
- old Publication and rollback unchanged;
- clean migration and guarded down/up.

### 21.4 Web tests

- `/organization/documentation` parsing/metadata/nav;
- member read versus Owner edit;
- unlimited/at/over limit;
- stale conflict local-value preservation;
- rebuild selection/confirmation/status/failure;
- discovery policy permission, effective noindex reason, primary confirmation,
  stale conflict, and refresh;
- lazy reader/workbench/Try-It chunks;
- no Try-It chunk when absent/disabled;
- chunk failure retry;
- initial server HTML enhanced without duplicate metadata or focus loss;
- valid bootstrap avoids a loading flash and malformed/mismatched bootstrap
  falls back safely;
- loading/empty/error/permission states.

### 21.5 Smoke

Extend the V1 smoke journey:

1. read unlimited Organization operations summary;
2. set a limit as Owner;
3. prove non-owner mutation denial;
4. hit Page/Site growth limits without partial writes and verify retained
   File-byte reporting;
5. lower below usage and prove archive/export/rebuild still work;
6. rebuild draft and exact Publication search;
7. publish two exact Publications and rollback;
8. inject failed preparation and prove live pointer unchanged;
9. select one primary discovery link and prove a second link remains noindex;
10. fetch public initial HTML/canonical/sitemap/robots;
11. prove restricted/non-primary content absent from discovery output;
12. verify prior Guide/Demo/Capture/extension paths remain valid.

### 21.6 Commands

Use the current scripts at implementation time. Expected matrix includes:

```bash
pnpm --filter @repo/constants test
pnpm --filter @repo/types test
pnpm --filter @repo/documentation-domain test
pnpm --filter server test
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm --filter web test
pnpm --filter extension test
pnpm check-types
pnpm lint
pnpm build
pnpm -r --if-present test
git diff --check
```

Also run:

- clean migration `001`–`031`;
- guarded `031` down/up;
- populated down refusal;
- dependency/license/lockfile checks;
- bundle analyzer or Vite manifest size report;
- focused backup/restore rehearsal;
- local Markdown link and formatting checks for changed docs.

Record exact commands, file/test counts, warnings, limitations, and failures.
Do not hide pre-existing warnings; distinguish them from scoped regressions.

## 22. Agent-Browser Validation Requirements

Use the installed `agent-browser` skill and supported headless Chromium. Do not
replace it with a custom harness. Puppeteer/Chrome tooling may support metrics
or failure injection, but agent-browser remains the user-journey evidence tool.

### 22.1 Authenticated matrix

Organization Owner:

- open `/organization/documentation`;
- inspect unlimited usage;
- set finite limits;
- lower below usage and see retained/blocked explanation;
- trigger a stale conflict and recover without losing proposed values;
- select and rebuild draft/Publication search;
- inspect and change an eligible Publish Link discovery policy from its Site
  publishing panel;
- observe success/failure announcements;
- keyboard, zoom, reflow, reduced-motion, console, network, axe.

Organization non-owner/Viewer:

- read usage;
- no edit/rebuild controls;
- direct mutation attempts denied;
- no leaked target existence.

Project Admin/Editor:

- existing Documentation creation/publish paths;
- clear quota, busy, capacity, and timeout outcomes;
- safe corrective archive/export.

### 22.2 Public matrix

- default and explicit version public Page;
- canonical alias `308`;
- intentional `410`;
- unavailable/revoked/expired `404`;
- restricted password `401` then authorized Page;
- operation route with Try It disabled/enabled;
- sitemap and robots;
- primary versus non-primary canonical/noindex behavior;
- route-specific initial HTML inspected before JavaScript;
- title/description/canonical/social/lang correctness;
- ETag `200 -> 304`, then link switch/rollback invalidation;
- malicious metadata escaped;
- no private/review/search/Try-It policy content;
- desktop, narrow mobile, 200% zoom, 320px reflow, reduced motion;
- keyboard skip/focus;
- clean console/page errors;
- axe A/AA scan.

### 22.3 Failure injection

Use deterministic server seams, not timing guesses:

- Publication admission full;
- same-Edition lock busy;
- Publication timeout;
- search projection rebuild failure;
- missing Vite manifest/startup refusal;
- lazy chunk network failure and retry;
- database readiness unavailable;
- missing protected File after disposable restore.

Never inject against a shared/non-disposable environment.

### 22.4 Browser capability honesty

- Chromium is required.
- Run Firefox/WebKit only if installed and supported by the available tooling.
- If unavailable, record the capability boundary and do not claim coverage.
- Record browser/agent-browser versions, fixture identity, viewport, reduced
  motion, zoom method, network/console review, axe results, and screenshots.
- Do not put passwords, tokens, private origins, customer content, or raw
  requests/responses in evidence.

## 23. Explicit Non-Scope

- future-date/scheduled publishing;
- durable background job queues or worker fleet;
- Redis/CDN/application content cache;
- external search, semantic/vector search, Organization/cross-artifact search;
- product analytics, page-view/search-query dashboards, third-party telemetry;
- billing, plans, metering, Project/user quota allocation;
- automatic permanent deletion or retention TTL;
- Git/GitHub sync/import/export automation;
- translations/locales beyond existing primary-language behavior;
- custom domains/TLS ownership;
- public comments/feedback;
- external reviewer tokens or notification transport;
- realtime collaboration/offline merge;
- server-side Try-It proxy, OAuth, stored environments/credentials;
- private-network Try-It targets, redirects, streaming/file request bodies;
- SDK generation;
- Video;
- arbitrary MDX/HTML/JS/React/iframes;
- replacing Vite/local routing with Next.js or another SSR framework;
- adding Fumadocs/Tiptap runtime;
- replacing PostgreSQL/File storage;
- purging old Revisions/Publications/review evidence/protected Files;
- removing compatibility columns;
- production p75 collection service.

## 24. Commit Plan

Use small cohesive commits, adjusted to actual implementation:

1. `feat(documentation): define operational limits contracts`
2. `feat(documentation): add organization limits and usage persistence`
3. `fix(documentation): harden publication admission and projections`
4. `feat(documentation): serve crawler-safe public documents`
5. `feat(web): add documentation operations and lazy loading`
6. `test(documentation): add operational dogfood evidence`
7. `docs(documentation): close child 138 operational hardening`

Do not manufacture empty/artificial commits. A required security dependency
upgrade gets its own commit. Commit only owned scoped files and never generated
build output or disposable browser artifacts.

## 25. Exit Gate

Child `138` is complete only when:

- Organization nullable limits and safe usage are shipped and race-safe;
- quota and operator-safety errors are distinct;
- all quota-increasing paths are covered;
- Publication busy/capacity/timeout/failure cannot move a live link;
- exact draft/Publication search rebuild is deterministic, isolated, and
  atomic;
- public Page/search/operation/metadata/Asset requests use bounded
  route-specific loaders rather than the complete Publication graph;
- exactly one eligible primary discovery link per Site can be indexable and
  every other/private/ineligible surface fails closed to noindex;
- public ETag/cache behavior resolves access first;
- public initial HTML has route-specific status, content, canonical, social,
  language, sitemap, and robots proof;
- split Vite/Fastify deployment routing and asset-manifest startup are proven;
- no cross-tenant/search/cache/SEO/private-content leak exists;
- migration/upgrade/reset/reseed/down/backup/restore proof is recorded;
- health/readiness/env diagnostics are truthful and redacted;
- dependency/license review is complete;
- accessibility/manual/browser/failure evidence is recorded;
- representative performance/bundle evidence is recorded honestly;
- existing Capture/Guide/Demo/extension/public/embed/Try-It behavior remains
  green;
- no open S1/S2 Documentation defect remains;
- no deferred feature entered scope;
- this plan and Master `006` reflect only completed work;
- child `139` receives a stable implementation and an explicit leftover list.

## 26. Implementation Checklist

### Planning

- [x] Child `137` actual result and handoff inspected.
- [x] Master `006` hardening, threat, performance, verification, and child
      sequence inspected.
- [x] Accepted quota/publication/search/cache/retention decisions inspected.
- [x] Current migration, repository, route, web, config, health, and evidence
      seams mapped.
- [x] Exact scope, non-scope, files, contracts, routes, permissions, migration,
      tests, browser proof, and handoff defined.
- [x] Recheck this expanded plan against current code immediately before
      implementation.

### Runtime

- [x] Shared constants/types/domain policy implemented test-first.
- [x] Migration `031`, constraints, grants, audit guard, and rollback implemented.
- [x] Organization limits/usage/rebuild routes implemented.
- [x] Quota checks cover every growth path and race.
- [x] Publication admission/busy/timeout/failure behavior hardened.
- [x] Search ranking/digests/rebuild implemented.
- [x] Route-specific public read models remove whole-Publication over-fetch.
- [x] Discovery policy and single-primary canonical behavior implemented.
- [x] Public ETag/cache/access policy hardened.
- [x] Fastify initial document and Vite manifest boundary implemented.
- [x] Organization operations UI implemented.
- [x] Documentation/Try-It code splitting implemented from measurement.
- [x] Health/readiness/env diagnostics implemented without sensitive fields.
- [x] Try-It DNS revalidation and deployment digest diagnostics implemented.
- [x] Fixture/smoke/failure injection updated.
- [x] Operator/deployment/backup/upgrade docs updated.

### Verification and closure

- [x] Focused package/server/web tests pass.
- [x] DB/migration/reset/reseed/rollback tests pass.
- [x] Backup/restore rehearsal passes.
- [x] Full workspace/extension/smoke/build matrix passes.
- [x] Dependency/version/license review complete.
- [x] Agent-browser authenticated/public/failure/accessibility matrix passes.
- [x] Performance and bundle evidence recorded.
- [x] Threat-model rows closed.
- [x] No unrelated worktree changes included.
- [x] Implementation log, verification record, leftovers, and handoff completed.
- [x] Master `006` updated only for genuinely completed child `138` items.
- [x] Scoped logical commits created.

## 27. Implementation Log

Implementation completed from clean migration head `030`, while preserving
pre-existing worktree content.

- `b823a30` added shared Documentation operational constants, nullable limit,
  usage, rebuild, discovery, and production-diagnostic contracts test-first.
- `31cc302` added migration `031`, race-safe Organization quota enforcement,
  immutable publication search generations/selectors, deterministic draft and
  Publication rebuilds, weighted search, discovery rules, heavy-work admission,
  publication timeout/failure protection, initial HTML/CSP/ETag behavior,
  truthful readiness/reporting, and the bounded maintenance command.
- `814c958` added the Organization operations UI and measured lazy boundaries
  for Documentation routes and the request-builder experience.
- `5878370` extended the DB smoke workflow through Owner limit mutation,
  Viewer denial, draft rebuild, initial HTML, and conditional ETag behavior;
  that proof found and fixed a PostgreSQL text/varchar parameter ambiguity.
- `c6ccae0` closed the final implementation audit gaps: Page/search/operation/
  metadata initial-document reads now select bounded representations and the
  existing publishing workbench exposes confirmation-gated Owner-only draft
  and exact-Publication recovery.
- `3cec21b` upgraded Next.js, Fastify, JWT, cookie/CORS/websocket, Umzug, and
  their lockfile graph after the production audit exposed one critical and
  multiple high advisories. The repeated production audit is clean.
- Operator, self-hosting, readiness, fixture, top-level status, browser
  evidence, this child, and Master `006` were updated in the closure docs
  commit.
- Independent close-recheck commit `d1db672` removed the split Vite/Fastify
  Try-It origin parser and made both surfaces consume the same exact-public-
  HTTPS origin policy and CSP builder without weakening localhost/private/
  reserved-host rejection.
- Independent close-recheck commit `5b0b884` repaired five runtime gaps found
  by plan-to-code traceability: truthful server/web digest comparison,
  bounded noindex HTML fallback instead of an empty `500`, exact/prefix and
  literal-safe search including canonical path/Page ID, stable keyset
  pagination for every `--all-legacy` batch, and matching operator guidance.
- Independent close-recheck commit `845e1a6` stopped inferring Organization
  Owner authority from project-access provenance. The publishing workbench now
  resolves the existing Organization operations permission and still keeps
  recovery absent for non-Owners.

No runtime cache, queue, customer-content purge, analytics, rate-limit redesign,
or deferred Documentation product feature was introduced.

## 28. Verification Record

Planning expansion verification:

- inspected the completed child `137` implementation/close-recheck record and
  its child `138` handoff;
- inspected children `132`–`136` operational leftovers;
- inspected Master `006` search, publication/cache/failure, lifecycle,
  operational-limit, accessibility/performance, security, concurrency,
  testing, hardening, risk, verification, checklist, and handoff sections;
- inspected accepted Q26 discovery/canonical, Q27 publication/rendering/cache,
  and Q28 quota/safety/concurrency decisions;
- mapped current hard constants, PostgreSQL search projections, synchronous
  Publication flow, advisory locks, public routes, client-only metadata, Vite
  CSP, eager imports, health/readiness, environment report, migrations, and
  fixture/smoke seams;
- confirmed there is no current application Documentation cache, durable
  publication job queue, Organization Documentation settings table, or
  crawler-correct server initial document;
- confirmed this expansion changes only this child-plan document.

Independent implementation-readiness recheck on 2026-07-31:

- corrected the virtual no-row limits Row Version from `1` to `0` so concurrent
  first updates have one winner and one stale conflict;
- removed a speculative retained-File-byte product quota because V1 has no
  governed deletion path that could remediate it; retained bytes remain exact
  usage/health information;
- defined stored lifecycle counting, Edition-restore Page deltas, global lock
  order, staged-File cleanup, and the exact retained File usage union;
- replaced unsafe mutable Publication search replacement with immutable
  generation rows, an atomic derived selector, a migration-only legacy
  generation, and a bounded audited maintenance rebuild command;
- added route-specific public read models so Page/search/operation/metadata/
  Asset requests cannot load the complete Publication graph by default;
- closed the accepted Q26 gap with explicit per-link discovery policy, one
  stable-Site primary canonical link, deterministic upgrade compatibility, and
  fail-closed sitemap/robots/noindex rules;
- scoped projection rebuild to an existing Project Version/Site workbench
  instead of inventing an Organization-wide Site inventory API;
- defined total/per-class heavy-work admission, exact defaults/bounds, timeout
  error classification, and an operator/runtime safety distinction that keeps
  shared persisted content contracts deterministic;
- defined uncached bounded DNS revalidation at Try-It policy mutation and
  configuration issuance, plus digest/reload diagnostics without origin
  disclosure;
- closed initial-document manifest traversal, same-origin asset, shared CSP,
  over-ceiling shell, bootstrap, ETag, mutable Asset-cache, and Access Evidence
  edge cases;
- reconciled exact affected files, tests, migration/down refusal, upgrade
  order, browser proof, and child `139` handoff.

Implementation verification on 2026-07-31:

- migration `031` clean up/status/down/up/reset/reseed passed; focused migration
  tests cover the unsafe derived-generation rollback guard;
- Documentation and operations DB suites passed (`17` focused tests), the full
  DB matrix passed, and smoke passed (`2` tests);
- server unit suite passed (`126` files, `543` tests);
- web suite passed (`83` files, `441` tests after the Owner recovery test);
- audit-domain passed (`6` files, `49` tests); all remaining workspace package,
  docs, and extension tests passed through `pnpm -r test`;
- workspace typecheck, lint, and production build passed; changed-file lint is
  clean;
- Fastify route tests prove Page/metadata representation selection; DB smoke
  proves the bounded Page representation still contains only referenced
  Snippets/Assets/operations and renders correctly;
- a PostgreSQL custom-format dump restored into isolated
  `ossie_test_restore_138`; two Documentation Sites were read from the restored
  database before that temporary database was dropped;
- `pnpm audit --prod --audit-level high` initially found one critical and
  multiple high advisories, drove the scoped dependency upgrade, then passed
  with no reported advisory;
- production license inventory contains permissive licenses, dual-license
  `jszip` (MIT selected), `caniuse-lite` attribution, and dynamically linked
  Sharp/libvips LGPL artifacts; no incompatible new license was introduced;
- headless Chromium Owner/Viewer/public/operation/accessibility/failure proof
  and exact bundle measurements are recorded in
  `docs/ui/138-documentation-v1-operational-hardening-browser-evidence.md`;
- public Page JSON selected two Page summaries, nine current blocks, one
  referenced Snippet, two referenced Assets, and one referenced operation;
  weighted search returned the expected API reference with its `50` result
  ceiling;
- direct initial HTML returned route-specific content, strict CSP,
  `Vary: Cookie`, public revalidation, stable digest/representation ETag, and
  `304`; alias `308`, gone `410`, unknown `404`, robots, and sitemap passed;
- no S1/S2 Documentation defect remained after the close-implementation audit.

Independent implemented-work close-recheck on 2026-07-31:

- started from clean `d123d82`, mapped the plan/master exit criteria through
  callers, repositories, routes, UI, tests, operator docs, and the child `139`
  handoff, and confirmed every resulting edit was child-`138` scoped;
- wrote failing regression tests before each repair for web-build digest
  diagnostics, oversized initial HTML, all-legacy pagination, Organization
  Owner recovery permission, shared Vite CSP parity, and literal/identifier
  search behavior;
- production diagnostics now report the server digest, supplied web-build
  digest, `match | mismatch | unavailable`, reload requirement, uncached
  policy/configuration DNS mode, and timeout without exposing an origin;
- over-ceiling initial documents return a bounded `200` noindex shell with
  truncated safe metadata, a content-loading status, exact route identity and
  Publication digest; JSON bootstrap escaping covers `&`, `<`, `>`, U+2028,
  and U+2029;
- public and draft search now preserve exact/prefix title priority, weighted
  title/heading/description/body rank, canonical-path/Page-ID fallback, stable
  ties, the 50-result ceiling, and literal `%`/`_` semantics;
- the maintenance command's real PostgreSQL dry-run selected two draft
  candidates in one bounded page, while unit proof traversed three keyset
  pages; mutation mode processes each page before reading the next and stops
  immediately on rebuild failure;
- focused server regression passed `36` tests plus the 29-route suite; the
  final complete server unit suite passed `126` files / `546` tests, web passed
  `83` / `442`, and Documentation domain passed `19` / `50`;
- PostgreSQL V1 smoke passed `2` tests, including literal wildcard,
  canonical-path, and Page-ID searches; server/web/domain type checks and
  production builds passed; scoped lint has no errors (the repository file
  retains pre-existing explicit-`any` warnings outside the changed lines);
- headless Chromium proved the actual Owner-only draft rebuild (`200`, two
  documents verified), Viewer control absence, public canonical-path search,
  320-pixel reflow without overflow, reduced-motion media, clean page errors,
  and zero WCAG A/AA axe violations on public and Viewer surfaces. The Owner
  authoring surface also had zero violations, with two explicitly incomplete
  contrast checks where axe could not determine obscured textarea backgrounds;
- reconciled the implemented asset environment names to
  `OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH` and
  `OSSIE_DOCUMENTATION_WEB_ASSET_BASE`; no schema, migration, public API, or
  backward-compatibility change was required by the close-recheck.

## 29. Leftovers and Handoff to Child 139

Accepted non-blocking limitations handed to child `139`:

- production p75 telemetry may remain operator-owned; local lab evidence must
  not be labeled production p75;
- Firefox/WebKit evidence remains capability-dependent;
- rate limiting and publication admission remain per-process unless a later
  multi-instance design is accepted;
- no customer-content retention purge exists;
- no product analytics exists;
- no external cache/search/queue exists;
- no custom-domain/Git/translation/public-feedback/realtime scope exists;
- no automatic whole-Organization projection rebuild scheduler exists.

Child `139` receives:

- migration `031` result and rollback boundary;
- exact limits/usage/enforcement matrix;
- publication admission/timeout/failure proof;
- projection rebuild and ETag/cache proof;
- public initial HTML/deployment proof;
- migration/backup/restore evidence;
- dependency/license disposition;
- accessibility/performance/browser evidence;
- complete regression counts above;
- known non-S1/S2 limitations;
- scoped commit list above plus the final closure-doc commit.
- the independent close-recheck commits and evidence above, including the
  bounded-shell, search-identifier, keyset-maintenance, shared-CSP, and
  permission-resolution regressions that final closeout must retain.

Child `139` is final closeout, not a place to finish missing child `138`
features. Any closure-blocking defect found here must be fixed and reverified
before handoff.
