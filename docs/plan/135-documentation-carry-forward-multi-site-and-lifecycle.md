# Child Plan 135: Documentation Carry-Forward, Multi-Site, And Lifecycle

Date reserved: 2026-07-30

Date expanded: 2026-07-30

Date independently rechecked: 2026-07-30

Status: Expanded, independently rechecked, and implementation-ready. No runtime
work from this child has started.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/134-documentation-import-export-and-package-portability.md`

Next child:

- `docs/plan/136-documentation-review-and-approval-workflow.md`

Decision sources:

- `docs/grill/2026-07-29-documentation-domain-grill.md`;
- `docs/documentation-domain-decisions.md`;
- `CONTEXT.md`;
- ADR `0009` for protected File ownership;
- ADRs `0027`–`0031`.

## 1. Sequence Gate And Actual Baseline

Child `134` is complete and independently close-rechecked. The implementation
baseline for this child is the current relational Documentation platform
through migration `027`, including:

- stable Project-owned Documentation Site identity and the database constraint
  allowing at most one Site Edition per Site and Project Version;
- one mutable Working Draft per Edition;
- relational Pages, keywords, typed blocks, list/table/tab descendants,
  Navigation, routing, Snippets, Documentation Assets, Capture Asset
  references, OpenAPI Source/operations, comments, search projections,
  Revisions, Publications, and Publish Link entries;
- immutable relational Revision projections for Page, Navigation, routing,
  Snippet, Asset, OpenAPI, and exact Guide/Interactive Demo Publication state;
- exact OpenAPI source File snapshots added by migration `027`;
- safe package/Markdown interchange and fresh-ID import graph conversion;
- protected File integrity checks, purge guards, and exact immutable output;
- Project Membership authorization, transaction-bound Audit Events, Access
  Evidence, idempotent command receipts, and portal route boundaries;
- one consolidated server Documentation module and portal workbench;
- no legacy Documentation product data requiring backfill.

Child `134` hands off reusable graph concepts, but its ZIP schema is
interchange only. Carry-Forward must load the exact relational Site Revision
and write relational target rows directly. It must not:

- export and re-import a ZIP;
- create or consume an Import Inspection;
- apply package compatibility rules to internal persistence;
- invent an external-binding remap step for already exact same-Project
  Published Artifact references;
- copy mutable source Working Draft state that was not frozen in the selected
  Revision.

Before implementation, the implementing agent must:

1. reread this plan, Master `006`, completed child `134`, its browser evidence,
   the decision consolidation, Context, and ADRs `0009` and `0027`–`0031`;
2. record `git status --short`, current commit, migration head, and unrelated
   user/agent changes;
3. inspect every file in section 9 and account for changes after this
   expansion;
4. independently recheck this plan against the current code and Master `006`;
5. commit the rechecked plan checkpoint before runtime implementation;
6. implement behavior test-first.

Do not begin child `136` review/approval behavior to simplify lifecycle work.

## 2. Mission

Make Documentation usable across Project Versions without weakening stable
identity or immutable history:

1. show and manage multiple Documentation Sites in one Project Version;
2. carry selected Sites from exact immutable Revisions into missing Editions
   of another Version in the same Project;
3. make Edition, Page, OpenAPI Source, Snippet, and Asset lifecycle
   explicit and recoverable;
4. enforce effective read-only behavior from Project, Project Version,
   Edition, and child-resource state;
5. preserve existing Revisions, Publications, Publish Link entries, protected
   Files, Audit Events, and Access Evidence exactly.

The stable Documentation Site continues across Project Versions. Carry-Forward
creates a new Edition under that same Site; it does not clone or rename the
Site identity.

## 3. Required End-To-End Journeys

### 3.1 Multiple Sites

An authorized Project Admin can create more than one Site in the same Project
Version. The Site library:

- shows each Edition once;
- distinguishes active and archived effective state;
- uses stable Site IDs in links;
- does not silently choose a Site when more than one exists;
- preserves the existing empty-state package import;
- remains read-only for a Viewer;
- never exposes a Site belonging to another Project or Organization.

Creating a new Site retains the existing Admin-only `documentation.site.manage`
policy. Creating a Site with the same display name is allowed; identity is the
ULID, not the name.

### 3.2 Cross-Version Carry-Forward

An Editor or Project Admin:

1. opens Carry-Forward from the target Project Version Documentation library;
2. selects a different source Project Version in the same Project;
3. sees authorized source Site Editions, their current saved-draft state, and
   the latest exact immutable Revision when one exists;
4. selects one or more whole Sites and submits the displayed source Edition and
   Working Draft Row Versions;
5. sees blockers before submission when the target already has an Edition,
   the target is read-only, the source changed, or an exact protected
   reference is unavailable;
6. submits one bounded operation with an idempotency key;
7. receives fresh target Edition and Working Draft IDs for every selection;
8. can open each target workbench immediately;
9. can edit source and target independently;
10. can retry the identical request and receive the original result with
    `replayed: true`;
11. receives a typed conflict, without partial target state, when any selected
    Site cannot be carried.

Inside the same transaction, Carry-Forward creates or reuses an exact complete
Site Revision from each selected source Working Draft, then copies only from
that immutable graph. It does not require a separate manual checkpoint and
does not create a target Revision.

### 3.3 Archive And Restore

Authorized users can:

- archive/restore a Site Edition as Project Admin;
- archive/restore a Page, Snippet, Documentation Asset, or OpenAPI Source as
  Editor or Project Admin;
- inspect archived resources on explicit lifecycle/history surfaces;
- understand why inherited Project/Version/Edition state makes a resource
  read-only;
- restore only when current parent state and uniqueness constraints permit it.

Archiving never deletes or rewrites a Revision, Publication, Publish Link
entry, protected File, Audit Event, Access Evidence, alias, or import
provenance.

### 3.4 Retained Public Output

After a mutable source is archived:

- an existing active Publish Link entry continues resolving its exact Site
  Publication;
- exact Page paths, aliases, redirects, `gone` results, search, OpenAPI
  operation destinations, and protected assets stay frozen;
- no public resolver consults current mutable lifecycle state after resolving
  the selected Publication;
- archive does not revoke, unpublish, switch, or remove a Publish Link;
- an authorized user must use the existing explicit Publish Link revoke
  operation when public access should stop.

## 4. Accepted Carry-Forward Contract

### 4.1 Unit And Bounds

One operation has:

- one Organization and Project from authenticated scope;
- one explicit source Project Version;
- one explicit, different target Project Version;
- between `1` and `10` distinct Site selections;
- one concurrency-protected source Edition/Working Draft per selected Site;
- one exact source Revision created or reused transactionally per selected
  Site;
- one actor and idempotency key.

Add shared hard ceilings:

- `DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS = 10`;
- aggregate Pages `5_000`;
- aggregate Snippets `5_000`;
- aggregate relational content nodes `250_000`;
- aggregate distinct protected references `10_000`;
- aggregate saved text `256 MiB`.

The server calculates aggregate counts from the exact candidate snapshots
before mutation and returns the typed limit error when any ceiling is exceeded.
Per-Edition child `132`/`133` limits still apply independently. Child `138` may
make operational quotas configurable but may not raise these hard safety
ceilings without a separate recheck. Add only cross-boundary limits to
`@repo/constants`; do not add database names or display copy.

Selections are all-or-nothing. Partial success and per-item skipping are not
accepted.

### 4.2 Source Requirements

For every item, the server must prove after authorization and under the
operation transaction that:

- Site, source Edition, Working Draft, source Version, Project, and Organization
  form one constrained chain;
- submitted source Edition and Working Draft Row Versions still match;
- source and target Versions differ;
- the Project is active and the actor may read the source and mutate the
  target;
- the complete source Working Draft passes Carry-Forward Revision validation;
- all exact referenced protected Files and same-Project Capture/Published
  Artifact references remain available and authorized.

The source Project Version and source Site Edition may be active or archived.
Archived source is a narrow accepted exception that permits constructing or
reusing immutable Carry-Forward source history without making the Working Draft
editable or restoring any parent. This matches the Guide/Demo precedent.

Revision reuse is allowed only when the existing immutable projection is
complete for the current snapshot schema. A pre-`027` Revision missing a
required exact OpenAPI source projection cannot be reused. Migration `028`
must version Revision projections/content equality so the command can create a
current complete Revision rather than consulting mutable state to fill an old
Revision or colliding with the old digest.

### 4.3 Target Requirements

For every item:

- target Project Version belongs to the same Project and Organization;
- Project and target Project Version are active;
- no target Edition exists for that Site and target Version, regardless of
  target Edition lifecycle state;
- the operation never overwrites, merges, restores, or replaces an Edition;
- no target IDs are accepted from the client;
- target limits are revalidated against current server constants.

The existing unique constraint
`uq_site_edition_site_project_version(documentation_site_id,
project_version_id)` remains the final race guard.

### 4.4 Request And Response Schemas

Add strict shared Zod contracts in `packages/types/src/documentation.ts`:

```ts
DocumentationCarryForwardSelectionSchema = {
  site_id: IdSchema;
  expected_source_edition_version: PositiveIntSchema;
  expected_source_draft_version: PositiveIntSchema;
}

DocumentationCarryForwardRequestSchema = {
  source_project_version_id: IdSchema;
  target_project_version_id: IdSchema;
  selections: DocumentationCarryForwardSelectionSchema[1..10];
}

DocumentationCarryForwardOperationSchema = {
  id: IdSchema;
  source_project_version_id: IdSchema;
  target_project_version_id: IdSchema;
  created_by_id: IdSchema;
  created_at: IsoDateTimeStringSchema;
}

DocumentationCarryForwardResultItemSchema = {
  site_id: IdSchema;
  source_edition_id: IdSchema;
  source_revision_id: IdSchema;
  source_revision_number: PositiveIntSchema;
  source_revision_reused: boolean;
  target_edition_id: IdSchema;
  target_working_draft_id: IdSchema;
}

DocumentationCarryForwardResponseSchema = {
  carry_forward: DocumentationCarryForwardOperationSchema;
  items: DocumentationCarryForwardResultItemSchema[1..10];
  replayed: boolean;
}
```

The request rejects identical Version IDs, duplicate Site selections, unknown
fields, and over-limit arrays.
`Idempotency-Key` uses the existing shared schema and header.

Add a strict option response containing only safe selector data:

- source Version `id`, `slug`, `name`, and status;
- source Site `id`;
- source Edition `id`, title, description, language, stored/effective status,
  and Row Version;
- source Working Draft ID and Row Version;
- latest exact Revision `id`, number, creation trigger, and creation time when
  one exists;
- `target_has_edition`;
- one typed safe blocker code, not private row details.

The selector is advisory. POST reauthorizes and revalidates everything.

Add `DOCUMENTATION_REVISION_TRIGGERS = ["manual_checkpoint", "publication",
"carry_forward"]` and its shared strict schema because history and
Carry-Forward responses cross package/API boundaries. `creation_trigger` never
changes when an identical Revision is reused; the Carry-Forward result's
`source_revision_reused` reports the action-specific outcome.

### 4.5 Routes

Add these authenticated routes:

```text
GET  /api/v1/projects/:project_id/versions/:target_version_slug/documentation-sites/carry-forward-options
POST /api/v1/projects/:project_id/versions/:target_version_slug/documentation-sites/carry-forward
```

GET query:

```text
source_project_version_id=<ULID>
```

POST body uses the contract above and requires `Idempotency-Key`.

The route resolves the target Version and requires it to equal the body
`target_project_version_id`; the query/body identifies the source Version.
There is no versionless fallback or inferred "latest." The portal URL is:

```text
/projects/:project_id/versions/:target_version_slug/documentation/carry-forward
```

The route boundary supplies the target Version selected by the URL, resolves
its ID, and rejects a response/request mismatch. Existing Documentation
authoring and public URLs remain unchanged.

### 4.6 Persistence And Provenance

Migration `028_documentation_carry_forward_multi_site_lifecycle.sql` is the
expected next migration after rechecking the directory. Add:

`documentation_schema.documentation_carry_forward`

- `id`, Organization, Project;
- source and target Project Version IDs;
- actor;
- SHA-256 idempotency-key hash;
- SHA-256 canonical request fingerprint;
- selection count;
- created time;
- unique `(organization_id, project_id, created_by_id,
idempotency_key_hash)`;
- source/target same-scope foreign keys;
- source and target must differ;
- selection count `1..10`;
- immutable/no-delete/no-truncate guards.

`documentation_schema.documentation_carry_forward_item`

- operation ID and positive stable item position;
- stable Site ID;
- immediate source Edition and exact source Revision IDs;
- created target Edition and Working Draft IDs;
- Organization/Project scope;
- unique operation position and unique operation/Site;
- same-Site, same-Project, source-Version, target-Version, and parent-scope
  foreign keys;
- immutable/no-delete/no-truncate guards.

Provenance records only the immediate source. If Edition C is carried from the
Working Draft of Edition B that originally came from A, C points to B and the
exact B Revision created/reused by this operation. Historical lineage is
obtained by following immutable item rows; do
not flatten or rewrite it.

Do not store full request/response JSON, Page content, File bytes, comments,
credentials, package manifests, or copied graph payloads in provenance.

### 4.7 Transaction, Locking, And Idempotency

Protected File integrity preparation must reuse child `134`'s bounded exact
File readers. Do not hold Site/Edition transaction locks during storage I/O:
authorize and resolve candidate File identities first, read/verify the bounded
bytes outside the final transaction, then revalidate immutable File IDs,
digests, lifecycle/purge guards, and candidate snapshot Row Versions inside the
final transaction. No content bytes enter Audit, logs, request contracts, or
provenance.

The final operation transaction must:

1. authorize the actor and resolve both Versions before loading content;
2. hash the raw idempotency key and a deterministic canonical request;
3. lock/replay an existing actor/Project/key operation;
4. reject reuse with a different fingerprint;
5. lock the Project Versions in stable ID order;
6. lock selected Sites, Editions, and Working Drafts in stable ID order;
7. compare every submitted source Row Version;
8. validate each complete draft and create/reuse a current exact Revision with
   Carry-Forward trigger/projection semantics;
9. check every target/reference blocker before the first target mutation;
10. insert operation/provenance and every target graph in one transaction;
11. write one logical Audit Event in that transaction;
12. commit only when all selections succeed.

The operation may reuse existing File rows; it performs no physical File copy,
network fetch, ZIP parsing, or external storage write, so database rollback is
sufficient for mutation cleanup. A failed preflight creates no product row or
temporary File.

Concurrent different keys for the same Site/target serialize on the Site and
one succeeds. The loser returns target conflict. Identical-key retries return
the original ordered result with HTTP `200`; first success returns `201`.

### 4.8 Ownership Boundaries

- `@repo/documentation-domain` owns eligibility, aggregate completeness,
  lifecycle transition, Page retirement, and graph-remap policy without SQL or
  Fastify objects.
- `@repo/types` owns only cross-boundary strict request/response schemas.
- `apps/server` owns Project Membership authorization, archived-source
  exception scoping, protected File preparation, locks, transaction,
  persistence, idempotency, Audit, and Access Evidence.
- `file_schema.file` plus the existing File adapter remain authoritative for
  bytes/digests; Documentation creates references, not storage copies.
- PostgreSQL constraints remain the final tenant, parent, uniqueness,
  immutability, and no-partial-state boundary.
- `apps/web` owns selection, confirmation, focus, and recovery UX, never source
  Revision identity or authorization.
- child `134` package/Markdown converters remain interchange helpers and do not
  own Carry-Forward persistence.

## 5. Exact Copy, Reuse, Reset, And Exclusion Matrix

| Source Revision structure                           | Target behavior                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| stable Documentation Site                           | Reuse same Site ID; do not copy identity                                     |
| frozen Edition title/description/language/settings  | Copy to fresh Edition fields                                                 |
| frozen Home Page identity                           | Remap to fresh target Page ID                                                |
| active Revision Pages and keywords                  | Copy with fresh IDs and Row Version `1`                                      |
| active Unlisted Page (no Navigation node)           | Copy as active and keep Unlisted                                             |
| Page blocks/list/table/tab descendants              | Copy with fresh IDs and remap internal references                            |
| internal Page/heading links                         | Remap to fresh target IDs                                                    |
| frozen Navigation nodes/groups/order                | Copy with fresh IDs and remap parent/Page IDs                                |
| frozen aliases                                      | Copy as fresh immutable alias rows preserving paths                          |
| frozen redirect/`gone` rules                        | Copy with fresh IDs and remap target Page IDs                                |
| all Snippets frozen in the Revision and descendants | Copy with fresh IDs/status; remap block references                           |
| frozen Documentation Asset references               | Create fresh active target Asset rows that reuse the exact protected File    |
| frozen Capture Asset references                     | Reuse exact same-Project Capture Asset IDs                                   |
| frozen OpenAPI source snapshot                      | Create fresh target Source/operation rows and reuse its exact protected File |
| frozen Guide/Demo Publication references            | Reuse exact same-Project immutable Publication IDs                           |
| Row Versions                                        | Reset all new mutable roots/children to `1`                                  |
| created/updated actor and timestamps                | Set to Carry-Forward actor/current time                                      |
| Working Draft/search projection                     | Create fresh draft; rebuild search deterministically                         |
| Revision content digest/number                      | Do not copy as target history                                                |
| Site Revision rows                                  | Exclude; target starts with no Revision                                      |
| Site Publication/Publish Link entries               | Exclude                                                                      |
| comments/replies/mentions                           | Exclude                                                                      |
| archived unreferenced Snippets and unused Assets    | Exclude because absent from the exact Revision                               |
| import inspections/applications                     | Exclude                                                                      |
| command receipts, Audit/Access evidence             | Exclude                                                                      |
| parser/cache/export temporary state                 | Exclude                                                                      |

The copied graph must pass the ordinary domain validators and current count,
text, navigation, routing, reference, OpenAPI, protected-byte, and Revision
completeness ceilings. Child `134` portable converters may be factored for
pure ID remapping only if doing so does not make package handles or package
schemas an internal authority.

Source and target share immutable protected File bytes where the File domain
permits reference reuse. They never share mutable Page, Snippet, Asset,
OpenAPI, Navigation, routing, draft, or search rows.

## 6. Lifecycle Model

### 6.1 Stored State

Add shared `active | archived` lifecycle constants and strict contracts for:

- Site Edition;
- Documentation Page;
- OpenAPI Source.

Name the shared request contracts
`DocumentationEditionLifecycleRequestSchema`,
`DocumentationPageLifecycleRequestSchema`, and
`DocumentationOpenApiLifecycleRequestSchema`. Each uses a resource-specific
expected Row Version field so callers cannot confuse parent versions. Add
`DocumentationEditionUpdateRequestSchema` with expected Edition Row Version,
title, description, and primary language. Add strict
Site-list/Edition/Page/OpenAPI summary schemas, or extend the existing strict
response schemas, with:

- stored `status`;
- `effective_status: "active" | "read_only" | "archived"`;
- a bounded nullable `read_only_reason`;
- current positive Row Version;
- `archived_at` where the caller is authorized.

Snippet and Documentation Asset already use this state and existing lifecycle
routes. Every newly lifecycle-enabled Edition/Page/OpenAPI record gains:

- `status VARCHAR(...) NOT NULL DEFAULT 'active'`;
- `archived_at TIMESTAMPTZ NULL`;
- `archived_by_id VARCHAR(26) NULL` with scoped actor foreign key;
- a check requiring both archive fields exactly when archived;
- existing positive `version` as optimistic Row Version.

Migration `028` backfills existing rows as active without changing their Row
Version. The stable Documentation Site remains identity-only and receives no
lifecycle column. Master `006` references to Site archive are implemented as
Site-library controls over the selected Site Edition; V1 deliberately has no
global archive-all-Editions Site command. Do not add lifecycle columns to
immutable Revisions/Publications, aliases, Audit Events, Access Evidence, or
carry-forward provenance.

Migration `028` must also move user-facing mutable Site metadata to its
accepted Edition owner:

- add Edition `title` and `description`, backfilled from the current Site
  `name`/`description`;
- add/freeze corresponding Edition metadata in new Revision projections;
- make create/list/detail/update paths read and write Edition metadata;
- retain legacy Site columns during this additive migration only for response
  compatibility, but stop treating them as cross-Version authoring authority;
- document later physical column cleanup as deferred migration work.

Because Edition metadata now participates in Revision equality, tighten
`DocumentationCreateRevisionRequestSchema` and every in-repository checkpoint
caller to require both `expected_edition_version` and
`expected_draft_version`. Revision construction locks/compares both before
snapshotting. This prevents a concurrent title/language update from entering an
unexpected immutable checkpoint.

Extend the shared Revision summary/history response with immutable
`creation_trigger`; keep `snapshot_schema_version` server-internal. An existing
Revision retains its original creation trigger when later Publication or
Carry-Forward reuses it.

### 6.2 Effective State

A mutable Documentation resource is writable only when all are active:

```text
Organization access
  + Project
  + selected Project Version
  + Edition
  + resource stored state
```

Parent archive does not rewrite child stored status. API responses expose both
`status` and an `effective_status`/safe `read_only_reason` so the portal can
distinguish a directly archived resource from inherited read-only state.
Server authorization remains authoritative.

Archived Project/Project Version behavior reuses the existing
`project_read_only` policy. An archived Edition produces typed Documentation
read-only errors. Import, checkpoint, publication, comments, and ordinary
authoring have no exception. Carry-Forward has only the explicit
archived-source snapshot exception; its target remains active and writable.

### 6.3 Lifecycle Commands

Add:

```text
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/edition
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/edition/lifecycle
GET   /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages?status=active|archived|all
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/lifecycle
PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/lifecycle
```

Each strict body contains its applicable `expected_*_version` and
`transition: "archive" | "restore"`. Page archive additionally requires
current Working Draft, Navigation Tree, and routing-set Row Versions because it
mutates those roots atomically; Page restore requires current Page and Working
Draft Row Versions and leaves Navigation/routing unchanged. Existing
Snippet/Asset lifecycle bodies remain backward compatible.

Edition update is Admin-only under the current `documentation.site.manage`
boundary. The existing create request's `name` and `description` become the
initial Edition title/description. Existing response `site.name` and
`site.description` fields remain temporary aliases of selected Edition
metadata during the compatibility window; new contracts and UI use explicit
Edition fields.

Extend the existing Site list with the same optional
`status=active|archived|all` query, where status filters the selected Version's
Site Edition rather than stable Site identity. Omitted status means active.
The new Page list is metadata-only and never returns Page bodies; Page detail
remains the authorized body route. Archived OpenAPI is returned by its existing
exact source route only when explicitly requested from the lifecycle
workbench.

Rules:

- archive from active and restore from archived only;
- stale expected version returns typed `409`;
- successful transition increments Row Version once;
- repeating a transition after state changed is a typed invalid-transition
  conflict, not a silent write;
- Edition commands require `documentation.site.manage`;
- Page/OpenAPI/Snippet/Asset commands require `documentation.write`;
- restoring a child requires active Project, Version, and Edition;
- restoring an Edition does not restore children;
- no global Site archive/restore route is introduced;
- archive/restore is never DELETE.

### 6.4 Page And Routing Lifecycle

Archiving a Page:

- removes its Page Navigation node in the same transaction and renumbers
  affected siblings deterministically;
- removes it from ordinary draft lists, draft search, and the next
  checkpoint/publication candidate;
- does not delete its saved content;
- preserves private comment threads/replies for authorized history but blocks
  new comment mutation while the Page is archived;
- leaves existing immutable Revisions/Publications exact;
- keeps its canonical path and aliases reserved.

Before mutation, the server determines whether the Page appeared in any Site
Publication. The archive request is a strict discriminated contract:

- never-published Page: `retirement: { mode: "none" }` is allowed;
- previously published Page: the actor must choose
  `retirement: { mode: "redirect", target_page_id }` or
  `retirement: { mode: "gone" }`;
- redirect target must be a different active Page in the same Edition;
- archiving the current Home Page additionally requires an explicit different
  active `replacement_home_page_id`; the Working Draft Home Page changes in
  the same transaction;
- the archive transaction creates or replaces the exact routing rule, removes
  the Navigation node, archives the Page, increments affected Row Versions,
  and writes one Audit Event atomically.

There is no automatic Home Page redirect. Publication validation still reports
internal links to archived Pages and rejects unresolved live-content links.

Restore requires a non-conflicting reserved canonical identity and active
parent scope. It does not add the Page back to Navigation and does not silently
remove the retirement redirect/`gone` rule. The portal explains that the author
must place or leave the Page Unlisted and remove/correct any conflicting
retirement rule before the next Publication. Aliases remain immutable and
non-reassignable in every lifecycle state.

### 6.5 OpenAPI, Snippet, And Asset Lifecycle

Archived OpenAPI Sources, Snippets, and Assets:

- disappear from ordinary new-reference selectors;
- remain visible under an explicit archived/all filter;
- are read-only;
- remain resolvable by already saved draft references and retained immutable
  output under the accepted child `133` retained-reference policy;
- retain protected File references and block physical purge;
- are copied by Carry-Forward only when frozen into the selected exact Revision.

Restore rechecks active-name uniqueness for Snippets/Assets, protected File
availability/integrity, and parent activity. The existing
one-OpenAPI-Source-per-Edition identity remains reserved while archived;
archiving does not permit a replacement Source. No restore may replace another
active object.

### 6.6 List, Search, Preview, And Public Behavior

- Edition/Page/Snippet/Asset/OpenAPI ordinary lists default to active/effectively
  active records.
- Explicit `status=active|archived|all` filters are authenticated and
  permission-scoped.
- internal draft search excludes archived Editions and Pages;
  projections may remain stored but must be filtered and deterministically
  rebuildable;
- ordinary draft preview excludes archived Pages and validates active Home
  Page/navigation;
- exact Revision/history views remain available to authorized Viewers;
- an archived Edition blocks new Publication but, while the Project is active,
  existing Publish Links may still be inspected, rolled back, switched among
  already valid immutable Publications, or revoked under the existing
  link-management capability;
- existing public exact-Publication resolution ignores mutable lifecycle after
  authorization and selection;
- archive never changes sitemap/robots/social metadata for an already selected
  immutable Publication.

## 7. Security, Permissions, Audit, And Evidence

### 7.1 Capability Matrix

Add `documentation.carry_forward` to Project capabilities for Admin and Editor,
not Viewer. It is a content mutation and must be rejected when the target
Project or Version is archived.

Authorization resolves the route's target Version under
`documentation.carry_forward` and requires ordinary `documentation.read` for
the source Edition/Working Draft. An archived source Version remains readable;
the generic read-only guard must allow only the internal immutable Revision
insert/reuse performed by the authorized Carry-Forward transaction. It must not
open a general checkpoint, edit, import, publish, or lifecycle bypass on the
source.

| Action                                                  | Admin       | Editor      | Viewer      |
| ------------------------------------------------------- | ----------- | ----------- | ----------- |
| list/detail/history, including explicit archived filter | yes         | yes         | yes         |
| Carry-Forward whole Site Edition                        | yes         | yes         | no          |
| Site Edition archive or restore                         | yes         | no          | no          |
| Page/OpenAPI/Snippet/Asset archive or restore           | yes         | yes         | no          |
| immutable public output through active link             | link policy | link policy | link policy |

Authorize before selector details, Revision graph loads, Page bodies, protected
File metadata/bytes, target-existence disclosure, or response replay.
Unauthorized/not-in-scope resources return the normal non-enumerating result.

### 7.2 Threat Model

Tests and implementation must address:

- cross-Organization/Project Site, Version, Edition, Revision, File, Capture
  Asset, or Published Artifact injection;
- source Working Draft or Edition changed after selector rendering;
- target Version/body/portal URL mismatch;
- archived parent mutation bypass;
- idempotency key cross-actor or altered-payload reuse;
- concurrent duplicate target Edition creation;
- deadlocks from multiple selections;
- graph references escaping the source Revision;
- protected File reuse without File-domain authorization;
- partial target graph or provenance on failure;
- mutable source/target row sharing;
- archive used as delete/unpublish/purge;
- archived draft/search leakage;
- public output incorrectly consulting mutable lifecycle.

### 7.3 Audit And Access Evidence

Register commands/actions:

- `documentation.carry_forward` /
  `documentation.editions_carried_forward`;
- `documentation.edition.archive|restore`;
- `documentation.page.archive|restore`;
- `documentation.openapi.archive|restore`.

Existing Snippet/Asset actions remain. Carry-Forward writes one logical root
Audit Event containing safe item counts and IDs; it does not emit one event per
copied row. Audit changes may include IDs, status, Row Versions, source/target
Version IDs, source Revision IDs/numbers, and counts. They must exclude Page,
Snippet, OpenAPI, File, comment, request, and credential content.

When Carry-Forward creates a source Revision, its insert belongs to that same
logical Carry-Forward Audit Event and records creation trigger
`carry_forward`. Reuse does not mutate the Revision or create a second Revision
event; the immutable carry-forward item records that the action used it.

Add Access Evidence for:

- viewing Carry-Forward options;
- viewing archived lifecycle/history collections when not already covered by
  ordinary authorized list/detail evidence.

Do not emit mutation Audit Events for failed attempts or replay. Curate the
successful Carry-Forward and lifecycle actions into Project Activity only if
their safe labels match existing activity policy.

## 8. Errors And HTTP Behavior

Use typed errors with safe messages:

| Condition                            | HTTP | Stable code                                  |
| ------------------------------------ | ---: | -------------------------------------------- |
| invalid schema/header/query          |  400 | `invalid_documentation_request`              |
| unauthenticated                      |  401 | `unauthenticated`                            |
| lacks capability                     |  403 | existing forbidden contract                  |
| hidden source/target/Edition         |  404 | `documentation_resource_not_found`           |
| reused key, different request        |  409 | `documentation_idempotency_conflict`         |
| target Edition exists                |  409 | `documentation_carry_forward_target_exists`  |
| source/target same or mismatched     |  409 | `documentation_carry_forward_scope_conflict` |
| stale lifecycle Row Version          |  409 | `documentation_row_version_conflict`         |
| target/effectively read-only         |  409 | `documentation_read_only`                    |
| invalid transition/restore collision |  409 | `documentation_lifecycle_conflict`           |
| protected reference unavailable      |  409 | `documentation_reference_unavailable`        |
| accepted graph exceeds current limit |  422 | `documentation_carry_forward_limit_exceeded` |

Conflict details contain only authorized safe IDs, blocker codes, and latest
Row Versions/status. Never return bodies, storage keys, file paths, digests to
unauthorized callers, membership information, or evidence payloads.

## 9. Exact File Plan

Paths must be revalidated immediately before implementation.

### 9.1 New Files

- `apps/server/src/db/migrations/028_documentation_carry_forward_multi_site_lifecycle.sql`
- `packages/documentation-domain/src/policies/documentation-carry-forward-policy.ts`
- `packages/documentation-domain/src/policies/documentation-carry-forward-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-lifecycle-policy.ts`
- `packages/documentation-domain/src/policies/documentation-lifecycle-policy.test.ts`
- `apps/web/src/features/documentation/DocumentationCarryForwardPage.tsx`
- `apps/web/src/features/documentation/DocumentationCarryForwardPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationCarryForwardPage.module.css`
- `apps/web/src/features/documentation/DocumentationLifecycleControls.tsx`
- `apps/web/src/features/documentation/DocumentationLifecycleControls.test.tsx`
- `docs/ui/135-documentation-carry-forward-multi-site-and-lifecycle-browser-evidence.md`

Keep the consolidated server Documentation module. Do not create a second
Fastify plugin unless implementation proves the existing dependency surface
cannot stay cohesive; repository helpers may be extracted to
`documentation-carry-forward.repository.ts` only with an explicit recheck and
without duplicating authorization/audit policy.

### 9.2 Existing Runtime Files Expected To Change

- `packages/constants/src/documentation.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/policies/documentation-revision-policy.ts`
- `packages/documentation-domain/src/policies/documentation-revision-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-navigation-policy.ts`
- `packages/documentation-domain/src/policies/documentation-navigation-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-routing-policy.ts`
- `packages/documentation-domain/src/policies/documentation-routing-policy.test.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/provision-runtime-role.test.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/test-support/database.ts`
- `apps/server/src/app.ts`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/portalRouteMetadata.ts`
- `apps/web/src/lib/portalRouteMetadata.test.ts`
- `apps/web/src/appRouteGuards.ts`
- `apps/web/src/appRouteGuards.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/documentation/documentationPermissions.ts`
- `apps/web/src/features/documentation/documentationPermissions.test.ts`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.test.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.module.css`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.test.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationStructurePanel.tsx`
- `apps/web/src/features/documentation/DocumentationStructurePanel.test.tsx`

Only touch the subset actually required by red tests. Do not mechanically edit
every listed file.

### 9.3 Documentation And Plan Files Expected At Close

- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md`, completed
  phase items only;
- `docs/documentation-domain-decisions.md` only if implementation discovers a
  material accepted-contract clarification;
- `CONTEXT.md` only if implemented domain terms change;
- a new ADR only if implementation must reverse or materially extend an
  accepted ADR-level decision.

No new ADR is expected for the plan as written.

### 9.4 Read-Only Compatibility Files

Inspect, but do not change unless a failing compatibility test demonstrates a
scoped need:

- migrations `001`–`027`;
- `docs/documentation-portability-format.md`;
- `apps/server/src/modules/documentation/documentation-portability.ts`;
- `apps/server/src/modules/documentation/documentation-package.ts`;
- `apps/server/src/modules/artifact-carry-forward/*`;
- `packages/types/src/artifact-carry-forward.ts`;
- existing Guide/Demo Revision, Carry-Forward, Publication, Publish Link, and
  public-reader modules;
- `docs/plan/136-documentation-review-and-approval-workflow.md`.

## 10. Migration And Backwards Compatibility

Migration `028` must be additive:

- add active lifecycle columns and indexes to Edition, Page, and OpenAPI
  mutable tables;
- add/backfill Edition-owned title/description and the corresponding immutable
  Revision projection fields;
- add Revision `creation_trigger` and `snapshot_schema_version`, backfill
  existing child `132`/`133` Revisions as `manual_checkpoint` plus projection
  version `1`, and make new complete child `135` projections version `2`;
- replace content-reuse uniqueness with
  `(site_edition_id, snapshot_schema_version, content_digest)` so an old
  incomplete projection cannot block a current complete Revision;
- add Carry-Forward provenance tables and guards;
- preserve existing IDs, Row Versions, aliases, Revisions, Publications,
  Publish Links, import records, File references, and Guide/Demo data;
- preserve the existing one-Edition-per-Site/Version unique constraint;
- grant only required runtime privileges;
- install Audit-context and immutable/no-truncate guards consistently.

There is no pre-child-`132` Documentation product data. Existing child
`132`–`134` rows still require deterministic additive backfills for lifecycle,
Edition metadata, Revision trigger, and projection version. Existing API fields
remain during the compatibility window; Edition-owned fields become
authoritative. The checkpoint body intentionally gains required
`expected_edition_version`; update all in-repository callers and document the
typed `400` returned to stale pre-child-`135` clients rather than weakening
concurrency. Existing list callers that omit status retain active-only behavior.
Existing Snippet/Asset lifecycle routes and request shapes remain stable.

Down migration must refuse while Carry-Forward provenance, any archived new
state, any projection-version-`2` Revision, or Edition metadata that differs
from the legacy Site columns exists. A guarded development rollback is allowed
only when all new state is provably representable by migration `027`. It must
never silently discard provenance/metadata/history or convert archived content
to active. Record and test the refusal behavior.

Prove:

- clean `001`–`028`;
- upgrade from populated `027`;
- guarded `028` down/up rehearsal;
- runtime-role cannot update/delete/truncate provenance or bypass lifecycle
  Audit context;
- old Revision digests cannot cause incomplete-projection reuse;
- Guide/Demo Carry-Forward and all existing Documentation package/publication
  behavior remains green.

## 11. Portal Behavior And Accessibility

The Carry-Forward page must:

- identify source and target Versions in heading/instructions;
- load options only after an explicit source selection;
- display Site Edition metadata, saved-draft state, and latest Revision
  number/time when present;
- explain that success creates or reuses the exact source Revision;
- separate archived source Versions/Editions from ordinary active choices while
  keeping them selectable;
- disable target-present and target-read-only blockers with explanations;
- support multi-select with an announced selected count;
- require explicit confirmation that the target receives independent mutable
  copies;
- preserve selection on recoverable errors;
- focus the blocking summary after failure;
- announce busy, success, replay, and conflict states;
- link successful items to target workbenches;
- never label the operation import, sync, merge, copy latest, or overwrite.

Lifecycle controls must:

- show stored and inherited effective state;
- use Archive/Restore, never Delete;
- disclose the retained-publication consequence before Edition archive;
- hide mutation controls from Viewers and Editors where Admin is required;
- remain keyboard operable with visible focus;
- restore focus to the initiating control or result heading;
- prevent double submission;
- refresh list/workbench/search state after success.

At 320 CSS pixels, controls and tables must not cause page-level horizontal
scroll. Reduced-motion mode must remove nonessential transitions without
hiding status. Empty, loading, error, archived, conflict, and success states
need semantic headings/status or alerts.

## 12. TDD And Verification Plan

### 12.1 Red-Green Order

1. shared lifecycle/carry-forward constants and Zod contract failures;
2. domain copy eligibility, lifecycle transition, effective-state, and restore
   collision policy failures;
3. migration constraint/guard failures;
4. repository atomic copy, ID remap, File reuse, provenance, and lifecycle
   failures;
5. service permission/read-only/idempotency failures;
6. route validation/status/non-enumeration failures;
7. portal API and component failures;
8. full DB, smoke, compatibility, and browser journeys.

### 12.2 Package And Contract Tests

Cover:

- strict request/response/options parsing;
- duplicate/over-limit/same-Version rejection;
- source Edition/Working Draft Row Version requirements;
- every accepted/rejected lifecycle transition;
- inherited effective read-only reasons;
- published/unpublished Page retirement requirements, Navigation removal, and
  restore-without-reinsertion behavior;
- exact copy/reuse/reset/exclusion classification;
- error code stability and sensitive-field exclusion.

### 12.3 Server And Route Tests

Cover:

- Admin/Editor/Viewer matrix;
- GET options authorization before details;
- target URL/body Version agreement;
- first `201`, replay `200`, altered-key-payload `409`;
- same-Project/tenant enforcement;
- target-parent rejection, while an archived source Edition/Version can
  create/reuse an exact immutable Revision without becoming writable;
- old incomplete Revision projection non-reuse;
- all blocker checks before mutation;
- selector staleness revalidated at POST;
- list filters and active-only defaults;
- lifecycle expected-version conflicts;
- retained public resolver behavior;
- Audit/Access registry completeness and sensitive-field rules.

### 12.4 Database Integration

Prove:

- multi-Site same-Version support;
- one Edition per Site/Version constraint;
- complete Page/block/list/table/tab/Snippet/Nav/routing/OpenAPI graph remap;
- internal link, snippet, Home Page, Navigation, asset, and operation
  references target fresh IDs;
- Documentation File rows are reused safely and purge remains blocked;
- Capture Asset and exact Guide/Demo Publication references remain same
  Project;
- source and target edits do not affect each other;
- Carry-Forward creates or reuses a complete source Revision with correct
  trigger/projection semantics under submitted source Row Versions;
- target starts with no Revision/Publication/Publish Link/comment/import state;
- immediate provenance is immutable and chainable;
- retry creates no duplicate;
- injected late failure leaves no operation, item, Edition, draft, or child;
- concurrent keys yield one target and one typed conflict;
- lifecycle archive/restore/version/audit constraints;
- archived mutable state does not alter immutable output;
- migration clean/upgrade/down-up/runtime-role behavior.

### 12.5 Web Tests

Cover:

- route parsing and target Version boundary;
- multiple Site rendering and stable links;
- source Version/Site Edition selection and source Row Version submission;
- blockers and preserved selection;
- Admin/Editor/Viewer controls;
- success/replay/conflict focus and announcements;
- lifecycle inherited reason and restore collision;
- active/archived/all filtering;
- no Delete, merge, sync, latest, or overwrite promise;
- list/workbench refresh after mutation.

### 12.6 Smoke And Regression

Extend the V1 smoke path:

1. create two Sites in Version A;
2. author both and checkpoint only one so Carry-Forward proves both source
   Revision reuse and creation;
3. carry both to Version B;
4. edit a target Page and prove Version A Revision/public output unchanged;
5. retry and prove no duplicate;
6. archive a target Page and Site Edition, inspect retained exact Publication,
   then restore under accepted rules;
7. prove a Viewer cannot mutate and an Editor cannot manage Edition
   lifecycle;
8. rerun Guide/Demo Carry-Forward, Documentation package round trip,
   checkpoint/publication/rollback, public reader/search/assets, and extension
   regression suites.

Run focused tests first, then applicable repository-wide test, type, lint, and
build commands. Record exact commands and counts in this plan at close.

## 13. Agent-Browser Validation Requirements

Frontend/browser behavior is in scope, so real agent-browser validation is
mandatory against the running app and real PostgreSQL data.

Record deterministic evidence for:

1. Admin creates and distinguishes two Sites in one Version;
2. Editor carries two whole Sites to another active Version and the result
   identifies each exact source Revision created/reused;
3. success links open the correct target workbenches;
4. source and target independent edits are visible after reload;
5. identical retry is a replay without duplicate Editions;
6. target-exists and archived-target failures preserve selection and focus the
   error;
7. Admin archives/restores a Site Edition;
8. Editor archives/restores Page/OpenAPI/Snippet/Asset but cannot manage
   Edition lifecycle;
9. Viewer sees read-only lifecycle/history state and no mutation controls;
10. retained public Publication, search, alias/redirect/`gone`, and protected
    asset still resolve while mutable parents are archived;
11. keyboard-only selection, confirmation, archive, restore, and error
    recovery;
12. 320 CSS-pixel reflow;
13. `prefers-reduced-motion: reduce`;
14. no unexpected console errors, failed requests, secret-bearing URLs, or
    axe violations on the exercised pages.

Use the installed agent-browser skill. Browser screenshots are supporting
evidence, not a substitute for DOM, network, console, accessibility, and
database assertions.

## 14. Explicit Non-Scope

- formal review requests, assignments, approvals, rejection, stale approval,
  or approval-before-publication policy;
- API Try It, credentials, proxying, SDK generation, or request execution;
- cross-Project or cross-Organization copy;
- creating a new stable Site identity from Carry-Forward;
- overwrite, merge, live sync, automatic rebase, or conflict merge;
- selecting an arbitrary older historical Revision instead of the current
  concurrency-checked source Working Draft;
- carrying comments, imports, evidence, Publications, or Publish Links;
- permanent deletion, retention expiry, governed Organization/Project erase,
  or File purge;
- translation/localization workflows;
- custom domains;
- public feedback or external reviewers;
- realtime/cross-tab collaboration;
- Git/filesystem/MDX authority;
- cross-artifact or Organization-wide search;
- package format V2 or new import adapters;
- automatic Publish Link revoke on archive.

## 15. Exit Gate

Child `135` is complete only when:

- all exact structures in section 5 are classified and implemented;
- multi-Site and one-Edition-per-Site/Version behavior pass;
- exact-Revision Carry-Forward is authorized, atomic, idempotent,
  no-overwrite, and immediate-provenance preserving;
- protected File reuse and source/target independence pass;
- every lifecycle state and inherited read-only rule passes;
- immutable Publications and active Publish Links remain exact through
  archive/restore;
- focused/full/migration/smoke/regression verification passes;
- agent-browser evidence passes;
- plan status, checklist, implementation log, verification record, leftovers,
  and Master `006` completed items are current;
- child `136` receives stable active Edition and immutable Revision targets.

## 16. Implementation Checklist

- [x] Sequence gate and actual child `134` baseline reconciled.
- [x] Carry-Forward API, copy matrix, provenance, transaction, and errors
      specified.
- [x] Lifecycle state, permissions, routing, search, retention, and restore
      behavior specified.
- [x] Exact affected/read-only files and migration compatibility specified.
- [x] TDD, DB, smoke, browser, accessibility, and handoff gates specified.
- [x] Independent plan recheck completed and plan checkpoint committed.
- [ ] Shared constants/contracts/domain policies implemented.
- [ ] Migration `028` implemented and verified.
- [ ] Server Carry-Forward/lifecycle routes and persistence implemented.
- [ ] Audit/Access/Project Activity coverage implemented.
- [ ] Portal multi-Site/Carry-Forward/lifecycle experience implemented.
- [ ] Focused and full automated verification passed.
- [ ] Agent-browser evidence recorded and passed.
- [ ] Plan and Master closeout updated.
- [ ] Scoped logical runtime/docs commits complete.

## 17. Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no runtime change was made.
- 2026-07-30: Expanded against completed and independently close-rechecked
  child `134`, migrations `025`–`027`, current shared contracts/domain
  policies, consolidated server module, portal Site library/workbench,
  Project Membership capabilities, Audit/Access registries, and existing
  Guide/Demo Carry-Forward precedent.
- 2026-07-30: Fixed the reservation's identity ambiguity: Carry-Forward keeps
  the stable Site and creates only a missing target Edition.
- 2026-07-30: Fixed package-authority ambiguity by requiring direct exact
  relational Revision loading, fresh target IDs, protected File reuse, and no
  Import Inspection or ZIP round trip.
- 2026-07-30: Classified every copied, reused, reset, and excluded structure;
  defined transactionally created/reused exact source Revisions; and defined
  multi-selection atomic idempotency with immediate-source provenance.
- 2026-07-30: Defined archive-first lifecycle, inherited effective read-only,
  explicit Page routing repair, retained immutable public output, role
  boundaries, migration `028`, and child `136` handoff.
- 2026-07-30: Independent implementation-safety recheck corrected stable Site
  ownership, moved mutable title/description to Edition authority, restored
  Carry-Forward source Revision creation/reuse with source Row Versions,
  required atomic published-Page retirement routing, and versioned old
  Revision projections.

## 18. Planning Verification Record

Expansion inspection covered:

- Master `006` domain map, architecture, schema, route, authorization,
  Audit/Access, authority, content, search, publication, assets, lifecycle,
  concurrency, testing, and child `135` sections;
- completed child `134` status, implementation log, verification, and handoff;
- migrations `025`, `026`, and `027`;
- current Documentation constants, Zod contracts, domain policies/errors;
- Documentation routes, service, repository, database integration, and app
  wiring;
- current Site library, workbench, Page/OpenAPI/Snippet/Asset panels,
  permission helpers, and API client;
- current Project Membership, Audit/Access, Project Activity, and database
  reset registries;
- existing Guide/Demo Carry-Forward contracts, provenance, transaction, and
  browser precedent;
- scoped one-file planning worktree and migration head.

The independent recheck also read accepted grill Questions `13`, `14`, and
`18`, the final Documentation decision consolidation, Context lifecycle and
Carry-Forward language, ADRs `0027`/`0031`, actual draft-to-Revision
serialization, post-`027` OpenAPI projection behavior, current capability
mapping, and migration rollback conventions. It found and repaired:

- a stable-Site lifecycle contradiction;
- caller-selected historical Revision behavior that contradicted accepted
  transactionally created/reused source Revisions;
- missing source Edition/Working Draft concurrency;
- incomplete pre-`027` Revision projection reuse risk;
- Site-owned mutable title/description that would couple Versions;
- incomplete Snippet copy classification;
- non-atomic Page Navigation/retirement behavior;
- missing Home Page replacement and restore semantics;
- missing aggregate Carry-Forward ceilings;
- unsafe protected-File I/O inside the proposed lock window;
- missing route/schema/test/fixture ownership.

This planning pass changed only this child-plan document. It did not implement
runtime, schema, route, UI, package, dependency, ADR, Context, Master, or
current-truth changes.

## 19. Leftovers And Handoff To Child 136

Child `136` receives:

- stable Site identity with independently mutable per-Version Editions;
- explicit active/archived and inherited read-only state;
- exact immutable Revisions suitable for review targets;
- deterministic immediate Carry-Forward provenance;
- no copied comments or review state;
- exact retained Publications and Publish Links;
- optimistic Row Versions and transaction/audit boundaries.

Review state must be Edition/Revision scoped. It must not attach approval to a
mutable Working Draft without an exact Revision, inherit approval through
Carry-Forward, or reactivate approval through restore.

Later children retain:

- child `137`: browser-direct Try It;
- child `138`: configurable quotas, cleanup/reporting, profiling,
  observability, and operational hardening;
- child `139`: final Documentation V1 closeout;
- child `140`: Git/third-party adapters and other post-V1 decisions.
