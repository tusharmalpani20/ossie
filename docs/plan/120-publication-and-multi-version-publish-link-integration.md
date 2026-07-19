# Child Plan 120: Publication And Multi-Version Publish Link Integration

Date reserved: 2026-07-12

Date expanded: 2026-07-19

Date rechecked: 2026-07-20

Status: Expanded, rechecked, and implementation-ready against `HEAD`
`b4cb335`. Implementation has not started.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Sequence Gate And Baseline

Prerequisite:

- Child `119` is complete at `b4cb335`. Its fresh migration/rollback, complete
  DB/smoke suite, protected storage, broad workspace tests, and authenticated
  Admin/Editor/Viewer browser closeout passed.
- Child `119` supplies immutable type-specific Guide and Interactive Demo
  Revision graphs, Edition-scoped Revision Numbers, semantic latest-Revision
  reuse, immediate Carry-Forward lineage, and the complete protected-Asset
  dependency boundary.
- The worktree was clean when this plan was expanded. The 2026-07-20 recheck
  found only this attributable plan edit against `HEAD` `b4cb335`. Recheck
  `HEAD` and `git status --short` again before implementation and preserve later
  user/agent work.

Next child:

- `121` Design-System Foundation, only after child `120` clean-schema,
  Publication, Publish Link, public-reader/embed, protected-media, and browser
  acceptance gates pass and both child/master records are closed.

Canonical inputs:

- `AGENTS.md` and `CONTEXT.md`;
- ADRs `0006`, `0009`, `0014`, and `0020` through `0026`;
- the accepted Project Version and Artifact Edition grill, especially questions
  `15`, `16`, and `25` through `31`;
- master plan `005`;
- child `119` closeout and the implemented migration `023`, Revision,
  Carry-Forward, Publish compatibility, Audit/Access, Asset protection, portal,
  public reader, embed, and smoke code.

No new grill or ADR is required. The accepted sources already settle the
identity, immutability, relational-persistence, access, URL, explicit-rollout,
rollback, and retention semantics. The table layout, endpoint grouping,
pagination bounds, and component placement below are reversible implementation
choices inside those decisions.

## Goal

Replace the single-link JSON-snapshot compatibility implementation with clean,
Revision-backed immutable Publications and independently managed multi-version
Publish Link manifests for Guide and Interactive Demo Artifacts.

Each Published Artifact must identify one exact Artifact Revision, Artifact
Edition, and Project Version. Each Publish Link must belong to one stable
Artifact, contain an ordered non-empty set of exact Published Artifact entries,
have exactly one default entry, own one link-wide access policy, and remain
independent from every other link for the Artifact.

## Current Runtime Facts

Child `119` and the earlier alpha publish implementation currently provide:

- `publish_schema.published_artifact` with generic `artifact_type`/
  `artifact_id`, Artifact-wide `version_number`, duplicated `title`, and
  authoritative `snapshot_json`;
- `publish_schema.publish_link` with one `published_artifact_id` pointer and a
  partial unique index allowing only one active link per Artifact;
- public/restricted, expiry, password, active/revoked, viewer-session, `/p/*`,
  `/d/*`, and embed behavior;
- type-specific Guide and Demo JSON snapshot builders/readers;
- a temporary `published_artifact_capture_asset` projection maintained from the
  real snapshot shapes `blocks[].source_asset.id` and
  `scenes[].background_asset.id`;
- publish routes that require `project_version_id` but intentionally reject every
  non-Default Project Version through `PublicationVersionNotReadyError`;
- one publish action that always creates a JSON snapshot and automatically
  creates or repoints the Artifact's only active Publish Link;
- Editor/Admin `publication.manage`, Viewer `publication.read`, Audit mutation
  coverage, public Access Evidence, and curated Project activity actions;
- portal publishing controls embedded separately in the Guide and Demo editors,
  plus public Guide/Demo readers that parse `PublishedSnapshotSchema`;
- public Asset authorization by inspecting the selected snapshot JSON;
- migration `023` Revision triggers that already reserve `publication`, but the
  TypeScript Revision writer only exposes manual-checkpoint and Carry-Forward
  paths today.

These are temporary compatibility facts, not the accepted target:

- `version_number`, `published_version`, and `snapshot_json` are ambiguous or
  duplicated sources of truth;
- Publication Sequence is incorrectly Artifact-wide rather than Edition-scoped;
- a Published Artifact does not identify an exact Revision/Edition/Project
  Version relationally;
- the one-active-link constraint prevents multiple audience-specific links;
- public links cannot select or order multiple Project Versions;
- publishing silently repoints the only link instead of requiring explicit
  per-link rollout;
- rollback, unlinked Publication history, manifest management, canonical public
  version paths, and a viewer version selector do not exist.

## Accepted Domain And Behavior Rules

### Identity and numbering

1. A Published Artifact is immutable, non-deletable V1 history for exactly one
   Artifact Revision inside exactly one Artifact Edition and Project Version.
2. `publication_sequence` starts at `1`, increases independently within one
   Artifact Edition, is never reused, and is unrelated to Project Version,
   Artifact Revision Number, or Row Version.
3. Publishing creates or reuses the semantically identical latest Artifact
   Revision using trigger `publication`, then always creates a new Published
   Artifact and next Publication Sequence. Revision reuse does not mean
   Publication reuse.
4. A Published Artifact never owns copied authored content. Public rendering
   reads the exact immutable type-specific Revision graph.
5. Published Artifact title/description are read from the immutable Revision;
   they are not duplicated mutable or authoritative columns.

### Publish Link manifest

1. A Publish Link belongs to exactly one stable Guide or Interactive Demo
   Artifact and has an internal management name, globally unique immutable slug,
   link-wide visibility/password/expiry policy, and `active | revoked` status.
2. One Artifact may have many active or revoked Publish Links. Names need not be
   globally unique; slugs remain globally unique and are never reassigned.
3. An active link contains `1..50` entries. Each entry identifies one Artifact
   Edition/Project Version and one exact Published Artifact from that Edition.
4. A link cannot contain two entries for the same Project Version/Edition,
   cannot mix Artifacts or artifact types, and cannot reference a Working Draft.
5. Exactly one entry is default. Normalize the default to position `1`; remaining
   entries keep explicit dense positions `2..N`. Never infer ordering from
   Project Version name, date, slug, or internal Project Version position.
6. Changing the Project's Default Project Version or reordering Project Versions
   never changes an existing Publish Link manifest.
7. Archived Project Versions and archived Editions may remain or be explicitly
   added when an authorized user selects an existing Published Artifact. Public
   viewers see the version name without internal archive controls.
8. A revoked link cannot be restored or mutated. Revocation immediately revokes
   its active public viewer sessions but never deletes entries or Publications.
9. Removing/replacing an entry is an audited manifest mutation, not deletion of
   the Edition, Revision, Published Artifact, or protected Asset.

### Publishing and explicit rollout

1. Publishing requires an active Project, active Project Version, draft Edition,
   Project Editor/Admin capability, and exact current Edition and Working Draft
   Row Versions.
2. The publish request may select zero or more existing active Publish Links.
   Each selection carries the Link Row Version shown to the user; no link is
   preselected automatically. Zero selections creates an intentionally unlinked
   Published Artifact.
3. For each selected link, atomically update the current Edition's existing entry
   to the new Published Artifact or append a missing Edition entry at the end.
   Never change that link's default, existing ordering, name, slug, access,
   password, or expiry as a side effect.
4. The request may explicitly create one new Publish Link. Its current Edition
   entry is position `1` and default. This preserves a coherent first-publish
   path without silently creating a link.
5. Revision creation/reuse, Published Artifact insert, optional new-link insert,
   and every selected entry add/update commit in one transaction or all roll
   back. Lock every selected Link, compare its expected Link Row Version, and
   increment that Link once after its entry change. Cross-tenant, cross-Project,
   cross-Artifact, revoked, duplicate, stale, or over-limit input creates no
   partial Publication or link change.
6. Double-submit protection is UI pending-state plus Row Version/link-version
   conflict handling. This child does not invent Publication idempotency or reuse;
   every successfully committed publish is a truthful new Publication Sequence.

### Link management and rollback

1. Project Viewers may read Publication history and safe link/manifest state.
   Only Project Editors/Admins may create or manage links.
2. Link management is stable-Artifact access configuration. It is allowed from
   an archived Edition/Project Version while the Project itself remains active;
   new Publication remains blocked there. An archived Project keeps the existing
   effective read-only behavior and blocks all link mutations.
3. Manifest replacement is atomic and requires the current Publish Link Row
   Version. It may add, remove, reorder, or change default entries using existing
   Published Artifacts, but it must leave `1..50` valid entries.
4. Link setting changes require the current Publish Link Row Version. Changing
   visibility, expiry, or password revokes all active viewer sessions so stale
   access cannot become valid again after a later policy relaxation.
5. Rollback targets one entry and one older or newer Published Artifact from the
   same Artifact Edition. It changes only that entry pointer, increments aggregate
   Link and entry Row Versions, creates no Revision/Publication, and preserves
   name, slug, access, order, and default.
6. Rollback confirmation presents current/target Publication Sequences,
   timestamps, and publisher labels. An optional trimmed reason is limited to
   `500` characters and is recorded only in the Audit Event `reason`; it is not
   persistent product metadata and is never public.

### Public reader, embed, and URLs

Preserve the accepted base families and add the accepted canonical paths:

```text
/p/:publishLinkSlug
/p/:publishLinkSlug/embed
/p/:publishLinkSlug/versions/:projectVersionSlug
/p/:publishLinkSlug/versions/:projectVersionSlug/embed

/d/:publishLinkSlug
/d/:publishLinkSlug/embed
/d/:publishLinkSlug/versions/:projectVersionSlug
/d/:publishLinkSlug/versions/:projectVersionSlug/embed
```

Rules:

1. The base reader/embed route resolves the link's explicit default entry.
2. A version-specific route resolves only an entry included in that link and
   renders that entry's exact Published Artifact/Revision. Missing, removed,
   wrong-Artifact-type, or revoked entry/link paths return non-revealing `404`.
3. Current Project Version slugs form canonical URLs. Permanent Project Version
   aliases resolve only when they identify an included entry; the portal replaces
   the browser location with the returned canonical path without adding history.
4. Show a selector only for multiple entries. For one entry, show a compact
   version label. The default appears first; all other entries follow link-owned
   position. Only included versions are returned to the client.
5. Selecting a version updates the browser to its directly shareable canonical
   URL and reloads the exact immutable Publication without losing link-wide
   password access. Back/forward and direct reload must resolve correctly.
6. Embed routes use the same manifest, selection, access, canonicalization, and
   protected-Asset rules with compact embed chrome.
7. `restricted` retains current semantics: anonymous public resolution is `403`;
   a password does not override restricted visibility. Expired is `410`, password
   required is `401`, wrong password is `400`, and revoked/unknown is `404`.
8. Public responses never include internal link name, actor IDs/labels, password
   fields, storage keys, private URLs, source metadata, non-included versions, or
   other Publications from an Edition.

### Protected media

1. Public Revision composition returns only media referenced by the selected
   immutable Revision graph: Guide
   `selected_capture_asset_id ?? source_capture_asset_id` when visible, and Demo
   `background_capture_asset_id`.
2. Public media URLs include both Publish Link slug and canonical Project Version
   slug:

   ```text
   GET /api/v1/public/publish-links/:slug/versions/:version_slug/assets/:capture_asset_id/file?artifact_type=<artifact_type>
   ```

3. The Asset stream re-resolves the same active link, access policy, selected
   entry, Published Artifact, and Revision reference before returning bytes.
   Guessing an Asset used by another entry/Revision/Project returns `404`.
4. Archived Capture Assets remain resolvable; purged/deleted Files do not. Local
   storage remains the only implemented provider and unsupported providers retain
   the stable `501` behavior.
5. Remove the temporary Published Artifact Asset projection. The immutable
   Revision graph is the source of protection; the Capture Asset dependency
   report derives Published Artifact dependencies by joining Published Artifacts
   to referenced Revision child rows, while Revision dependencies continue to
   block purge independently.

## Clean Relational Schema

Create migration:

- `apps/server/src/db/migrations/024_revision_backed_publication_and_publish_link_manifests.sql`

### `publish_schema.published_artifact`

Recreate this empty pre-live table with:

- common columns: `id`, `organization_id`, `project_id`, `artifact_type`,
  `project_version_id`, `publication_sequence`, `created_by_id`, `published_at`,
  `created_at`;
- Guide family, all nullable as a group:
  `guide_id`, `guide_edition_id`, `guide_revision_id`;
- Demo family, all nullable as a group:
  `interactive_demo_id`, `interactive_demo_edition_id`,
  `interactive_demo_revision_id`.

Constraints:

- exactly one complete type family is populated and agrees with `artifact_type`;
- scoped composite FKs to the matching immutable Revision root, which also prove
  Edition, Artifact, Project Version, Project, and Organization ownership;
- positive `publication_sequence`;
- unique partial indexes on
  `(guide_edition_id, publication_sequence)` and
  `(interactive_demo_edition_id, publication_sequence)`;
- scoped unique keys required by Publish Link entry FKs and public queries;
- indexes for Edition history ordered by Publication Sequence descending and
  Artifact/Project discovery;
- runtime immutable UPDATE/DELETE/TRUNCATE guards;
- runtime grants limited to `SELECT, INSERT`; no Published Artifact UPDATE or
  DELETE grant.

Remove without aliases:

- `artifact_id`;
- `version_number`;
- duplicated `title`;
- `snapshot_json`;
- `published_artifact_capture_asset`.

### `publish_schema.publish_link`

Recreate with:

- `id`, tenant/Project scope, `artifact_type`, `name`, immutable `slug`;
- nullable Guide family `guide_id` or Demo family `interactive_demo_id`, exactly
  one matching `artifact_type`;
- `visibility`, `expires_at`, password hash/salt/timestamps, `status`;
- positive aggregate `version` Row Version;
- creator/revoker IDs and `revoked_at`, `created_at`, `updated_at`.

Constraints:

- type-specific scoped Artifact FK;
- non-empty trimmed `name` (`1..120`) and slug (`1..80`);
- existing visibility/password/lifecycle checks;
- global unique slug, active-public lookup index, Artifact link-list index;
- no one-active-link-per-Artifact index;
- immutable tenant/Project/Artifact/slug columns after insert;
- only `active -> revoked`, with actor/timestamp consistency.

### `publish_schema.publish_link_entry`

Add:

- `id`, tenant/Project scope, `publish_link_id`, `published_artifact_id`,
  `project_version_id`, `position`, `is_default`, positive entry `version`;
- nullable Guide family `guide_id`, `guide_edition_id` or Demo family
  `interactive_demo_id`, `interactive_demo_edition_id`;
- creator/updater IDs and timestamps.

Constraints and deferred guards:

- scoped link FK and matching scoped Published Artifact FK prove the same tenant,
  Project, stable Artifact, type, Edition, and Project Version;
- unique `(publish_link_id, project_version_id)` and deferrable unique
  `(publish_link_id, position)`;
- partial unique index for one default per link;
- positive position/version and type-family check;
- deferred constraint trigger requires every active link to have `1..50` entries,
  exactly one default at position `1`, and dense positions `1..N` at commit;
- writes against revoked links are rejected at the database boundary.

### Viewer sessions, evidence, and protection

- Recreate `public_publish_viewer_session` against the new Link table with its
  current token-hash, expiry, touch, and revocation semantics.
- Replace Audit mutation-policy rows/triggers for the new Published Artifact,
  Link, Link Entry, and viewer-session operations. Extend mutation-evidence row
  identity extraction and command/entity allowlists for Link Entry inserts,
  updates, and physical manifest-removal deletes. Publication commands may
  insert a Revision root and typed child graph only when no identical latest
  Revision exists; the same logical publish Audit Event must evidence that
  optional graph together with the Published Artifact and selected Link changes.
- Replace the Capture Asset purge guard/protection query so Published Artifact
  dependency rows are derived through the exact Revision FK rather than the
  removed projection.
- Reapply explicit runtime/maintenance grants after every replacement function
  or table. Static and live verification must prove runtime cannot mutate/delete
  immutable Publications or bypass Audit evidence.

## Migration, Reset, And Compatibility

1. Migration `024` is a coordinated breaking greenfield transition. Its `UP`
   must refuse with SQLSTATE `55000` if any Published Artifact, Publish Link,
   viewer session, or projection row exists. Development/test environments reset
   and reseed; there is no snapshot backfill, dual write, or legacy alias.
2. Do not rewrite migrations `001` through `023`. Migration `024` removes and
   recreates the empty compatibility tables, restores all required comments,
   constraints, triggers, evidence policy, and grants, and leaves migration
   history truthful.
3. `DOWN` must refuse populated target Publication/Link/Entry/session tables,
   then restore the immediately prior empty compatibility schema, temporary
   projection, purge guard, Audit policy, and grants so `024 down` then `up`
   passes on a disposable empty database.
4. Update `reset_test_database` dependency order for Link Entries and remove the
   projection table. Update every seed/fixture/smoke path in the same change.
5. Remove `version_number`, `published_version`, `snapshot_json`, and old singular
   publish DTO/API aliases from all in-repo runtime clients. Historical plans,
   grill records, ADRs, and old migrations remain historical and are not edited.
6. Preserve the user-facing `/p/*`, `/d/*`, and base embed paths. Existing local
   database rows are intentionally not preserved; the route family is product
   design, not a data-migration compatibility promise.

## Shared Contracts And Domain Policies

### `@repo/constants`

Update `packages/constants/src/publish.ts` and its existing aggregate tests to
retain Artifact types, visibility, and link status, and add bounds/constants for
link entries and management-name length. Do not introduce `latest` or semantic
Project Version parsing.

### `@repo/types`

Rewrite `packages/types/src/publish.ts` and `publish.test.ts` with strict Zod
contracts. Required public DTOs:

- `PublishedArtifact`: computed `artifact_id`, exact `edition_id`,
  `project_version_id`, `revision_id`, `revision_number`,
  `publication_sequence`, safe authenticated publisher `{ id, display_name }`,
  and timestamps;
- `PublishLinkEntry`: IDs, safe Project Version `{ id, name, slug, status }`,
  position/default, entry Row Version, and selected Published Artifact summary;
- authenticated `PublishLink`: safe Artifact ID/type, internal name, slug,
  visibility/status/expiry/password boolean, Link Row Version, entries, base and
  canonical default URLs;
- cursor/sequence-paginated Publication history and link-list responses;
- strict publish, create-link, update-settings, replace-manifest, rollback, and
  revoke request/response schemas described in the API section;
- public manifest entry summary containing only Project Version name/canonical
  slug/default/position/canonical URL and selected Publication Sequence;
- discriminated relational Guide and Demo public content responses composed from
  immutable Revision DTOs, never `snapshot: unknown`.

Keep raw password input write-only. Do not expose password hashes/salts, internal
link names, Audit reasons, storage facts, actor labels, or non-selected content.

### `@repo/publish-domain`

Update:

- `types/publish-domain.ts`;
- `errors/publish-domain-error.ts`;
- `policies/publish-link-policy.ts` and tests;
- `policies/publish-access-policy.ts` and tests;
- `index.ts`.

Delete the obsolete JSON builders:

- `policies/publish-snapshot-policy.ts`;
- `policies/publish-snapshot-policy.test.ts`.

Add `policies/publication-policy.ts` and tests for publishability, strict bounds,
explicit link selections, dense/default manifest normalization, same-Edition
rollback, and safe public selection. Domain code remains framework/storage/DB
independent.

Stable new errors must cover at least:

- `artifact_not_publishable` (`409`);
- `artifact_has_no_publishable_content` (`400`);
- `publication_row_version_conflict` (`409`);
- `publish_link_not_found` (`404`);
- `publish_link_conflict` (`409`);
- `publish_link_manifest_invalid` (`400`);
- `publish_link_entry_not_found` (`404`);
- `publish_link_rollback_invalid` (`409`);
- existing public not-found/restricted/expired/password/Asset errors.

Cross-tenant and cross-Artifact mismatches map to non-revealing `404`; stale Row
Versions and same-scope state conflicts map to `409` with no secret details.

## Exact Authenticated API Contracts

The following routes preserve the repository's type-specific parameter names:
`guides/:guide_id` and `interactive-demos/:interactive_demo_id`. Every route
requires an authenticated session, Project scope, and `project_version_id` query
context; the context identifies the Edition from which the panel was opened but
does not silently constrain a Link's multi-Edition manifest.

```text
GET  /api/v1/projects/:project_id/guides/:guide_id/publications
POST /api/v1/projects/:project_id/guides/:guide_id/publications

GET  /api/v1/projects/:project_id/guides/:guide_id/publish-links
POST /api/v1/projects/:project_id/guides/:guide_id/publish-links
PATCH /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id
PUT   /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/entries
POST  /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/entries/:entry_id/rollback
POST  /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/revoke
```

Demo routes replace `guides/:guide_id` with
`interactive-demos/:interactive_demo_id`.

Remove the old singular routes without compatibility wrappers:

- `GET|POST|DELETE .../:artifact_id/publish`;
- `PATCH .../:artifact_id/publish/access`;
- `PATCH .../:artifact_id/publish/password`.

### Publication history

`GET .../publications` query:

```ts
{
  project_version_id: string;
  limit?: number;                       // default 50, max 100
  before_publication_sequence?: number; // exclusive
}
```

Return only the selected Edition's history, newest first:

```ts
{
  publications: PublishedArtifact[];
  next_before_publication_sequence: number | null;
}
```

### Publish

`POST .../publications?project_version_id=...` body:

```ts
{
  expected_edition_version: number;
  expected_working_draft_version: number;
  update_publish_links: Array<{
    publish_link_id: string;
    expected_link_version: number;
  }>; // unique link IDs, 0..50, none implicit
  create_publish_link?: {
    name: string;
    visibility: "public" | "restricted";
    expires_at: string | null;
    password: string | null;
  };
}
```

Return `201`:

```ts
{
  revision: ArtifactRevisionSummary;
  revision_reused: boolean;
  published_artifact: PublishedArtifact;
  updated_publish_links: PublishLink[];
  created_publish_link: PublishLink | null;
}
```

### Link listing and creation

`GET .../publish-links` accepts `status=active|revoked|all` (default `active`),
`limit` default `50`/max `100`, and optional paired
`before_created_at=<ISO timestamp>&before_id=<ULID>` values. Reject a half cursor.
Return stable `created_at DESC, id DESC` ordering, safe full manifests, and the
next paired cursor or `null`.

`POST .../publish-links` body:

```ts
{
  name: string;
  visibility: "public" | "restricted";
  expires_at: string | null;
  password: string | null;
  published_artifact_ids: string[]; // ordered, unique Editions, 1..50
  default_published_artifact_id: string;
}
```

The server generates and collision-retries an opaque global slug as today.
Return `201 { publish_link }`.

### Settings, manifest, rollback, and revoke

`PATCH .../publish-links/:link_id` is strict, requires
`expected_link_version`, and accepts at least one of `name`, `visibility`,
`expires_at`, or `password` (`null` clears password). Return
`200 { publish_link }`.

`PUT .../:link_id/entries` body:

```ts
{
  expected_link_version: number;
  published_artifact_ids: string[]; // desired order, 1..50
  default_published_artifact_id: string;
}
```

It replaces the manifest atomically and returns `200 { publish_link }`.

`POST .../:link_id/entries/:entry_id/rollback` body:

```ts
{
  expected_link_version: number;
  target_published_artifact_id: string;
  reason?: string; // trimmed, max 500
}
```

Return `200 { publish_link, entry, previous_published_artifact }`.

`POST .../:link_id/revoke` body is
`{ expected_link_version: number }`; return `200 { publish_link }`. Repeating a
successful revoke returns non-revealing `404`, not a fabricated success.

## Exact Public API Contracts

All public API calls below require `artifact_type` with exactly one of `guide`
or `interactive_demo` as a strict query value derived from the
browser route family. The server validates it before returning content or
creating a password session, so a Demo slug used under `/p/*` and a Guide slug
used under `/d/*` receive the same non-revealing `404` as an unknown link.

Keep link-wide viewer-session creation:

```text
POST /api/v1/public/publish-links/:slug/viewer-sessions?artifact_type=<artifact_type>
```

Resolve default or explicit entry:

```text
GET /api/v1/public/publish-links/:slug?artifact_type=<artifact_type>
GET /api/v1/public/publish-links/:slug/versions/:version_slug?artifact_type=<artifact_type>
```

Return:

```ts
{
  publish_link: {
    slug: string;
    artifact_type: "guide" | "interactive_demo";
    visibility: "public" | "restricted";
    status: "active";
    expires_at: string | null;
    password_protected: boolean;
    entries: PublicPublishLinkEntry[];
  };
  selected_entry: PublicPublishLinkEntry;
  published_artifact: PublicGuidePublication | PublicInteractiveDemoPublication;
  canonical_public_url: string;
}
```

The base response selects default. A version alias may resolve, but response
`canonical_public_url` always uses the current Project Version slug.

Protected bytes:

```text
GET /api/v1/public/publish-links/:slug/versions/:version_slug/assets/:capture_asset_id/file?artifact_type=<artifact_type>
```

Remove the old versionless Asset endpoint after all in-repo readers compose
canonical version-specific file URLs.

## Authorization, Lifecycle, And Evidence

### Capabilities

- `publication.read`: Project Viewer, Editor, Admin, and implicit Owner; history
  and safe link manifests only.
- `publication.create`: Editor/Admin/Owner; active Project + active Project
  Version + draft Edition required.
- `publish_link.manage`: Editor/Admin/Owner; active Project required. The route's
  Edition/Project Version may be archived because link configuration does not
  mutate authored or Publication history.
- anonymous public access is independent from Project Membership and always
  enforces link-wide visibility, expiry, password session, status, and selected
  entry.

Replace `publication.manage` rather than retaining it as an alias. Update the
centralized Project access policy, wrappers, and tests with exact route mapping:
authenticated `GET .../publications|publish-links` uses `publication.read`,
`POST .../publications` uses `publication.create`, and every non-GET
`.../publish-links` route uses `publish_link.manage`. Both write capabilities
are Project content mutations for archived-Project enforcement. Do not rely on
the current broad `route_template.includes("/publish")` rule, and do not use UI
visibility as authorization.

### Audit Events

Every committed write produces one logical Audit Event in the business
transaction. Extend registry, database mutation policy, audited repository, DB
verification, and Project activity for:

- `guide.published` / `interactive_demo.published`: optional Revision graph,
  Published Artifact, optional new Link, and selected Link Entry changes;
- `guide.publish_link.created` / Demo equivalent;
- `guide.publish_link.settings_updated` / Demo equivalent;
- `guide.publish_link.manifest_updated` / Demo equivalent;
- `guide.publish_link.entry_rolled_back` / Demo equivalent, including safe
  previous/target Published Artifact IDs and optional Audit reason;
- `guide.publish_link.revoked` / Demo equivalent plus viewer-session revocations.

Audit fields use `publication_sequence`, `revision_id`, `edition_id`,
`project_version_id`, link/entry Row Versions, position/default, visibility,
status, and timestamp scalars. Slugs and passwords/hashes/salts are redacted;
authored content and storage facts are never copied into Audit Change Items.

### Access Events

Update registrations/tests for base and version-specific reader/embed/API
surfaces and the new version-specific Asset route. Resolved allowed and denied
outcomes remain rooted at Publish Link and may record selected Published Artifact
as safe resource context, but never slug, Project Version slug, password/token,
content, private URL, or storage path. Truly unknown slugs create no fabricated
tenant evidence. JSON and file reads remain fail-closed when Access Event append
fails.

## Server Implementation Shape

Extend `artifact-revision.repository.ts` with internal transaction-client helpers
`create_or_reuse_guide_revision_for_publication` and
`create_or_reuse_demo_revision_for_publication`. They must reuse child `119`'s
canonical content digest/insertion logic, accept exact expected Edition/Working
Draft Row Versions, enforce publish lifecycle, and write trigger `publication`.
Do not round-trip through HTTP or create a second Revision implementation.

Refactor the publish module around one type-discriminated service/repository
boundary while keeping Guide and Demo content readers type-specific. Public
composition joins Published Artifact -> exact Revision -> typed Revision
children -> referenced Assets. It must never load the mutable Working Draft.

Transactions that allocate Publication Sequence lock the scoped Edition before
reading `MAX(publication_sequence)`; the partial unique index remains the final
race guard. Manifest replacement locks the Link and current entries, validates
the complete desired state, writes it, increments Link Row Version once, and
returns the normalized committed manifest.

## Portal And Public UI Requirements

Create a small shared publishing feature rather than expanding two independent
copies:

- `ArtifactPublishingPanel` owns Publication history, explicit per-link rollout,
  first-link creation, link settings, manifest editing, revoke, and rollback;
- `PublicVersionSelector` owns safe link-entry labels/navigation for reader and
  embed modes;
- Guide/Demo editors provide type, Artifact/Edition/Working Draft identity, Row
  Versions, lifecycle, and existing content layout; they do not duplicate policy.

Authenticated behavior:

- Viewer: Publication history and safe manifests, no write controls;
- Editor/Admin: publish when active/editable; link management when Project is
  active, including from an archived Edition context;
- keep the editor integration compact: show current Edition Publication state,
  one primary publish action, and a scannable Link list; edit only one selected
  Link/manifest at a time through progressive disclosure rather than stacking
  every audience policy and 50-entry manifest in nested cards;
- publish dialog/checklist starts with every existing link unchecked, labels
  add versus update for the current Edition, shows its currently pinned
  Publication Sequence, and permits intentional unlinked publication;
- after publish, show Revision Number/reused status, new Publication Sequence,
  and exactly which links changed;
- link editor supports create, name/access/expiry/password changes, ordered
  version selection, default radio, move controls, entry removal, and explicit
  save with stale-conflict reload;
- rollback confirmation shows current/target Publication Sequence, timestamp,
  publisher, optional reason, and no misleading new-publication copy;
- revoke and removal/default validation are explicit destructive/error states;
- loading, empty, permission, archived, stale, failed, and success states are
  accessible and retain current draft edits.

Public behavior:

- base routes open default; exact routes open the selected entry;
- selector appears only for multiple entries and default is first;
- keep reader/viewer chrome minimal and content-first; the version label/selector
  must not become a second Project-management navigation system;
- changing selection navigates to the canonical shareable path; back/forward,
  deep link, reload, and Project Version alias canonicalization work;
- Guide and Demo render directly from typed Revision-backed response contracts;
- reader and embed preserve password prompts, restricted/expired/revoked/not-found
  states and use version-specific protected-media URLs;
- do not perform child `121` visual redesign. Reuse current UI primitives,
  typography, reader layouts, focus styles, and CSS-module conventions.

## Exact Affected Files

If implementation discovers another required file, record why in the child
implementation log before editing it.

### Plan and current-capability docs

- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  (completed child items only at closeout)
- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/v1-dogfood-smoke-suite.md`

### Shared constants, DTOs, and policies

- `packages/constants/src/publish.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/publish.ts`
- `packages/types/src/publish.test.ts`
- `packages/publish-domain/src/index.ts`
- `packages/publish-domain/src/types/publish-domain.ts`
- `packages/publish-domain/src/errors/publish-domain-error.ts`
- `packages/publish-domain/src/policies/publish-link-policy.ts`
- `packages/publish-domain/src/policies/publish-link-policy.test.ts`
- `packages/publish-domain/src/policies/publish-access-policy.ts`
- `packages/publish-domain/src/policies/publish-access-policy.test.ts`
- `packages/publish-domain/src/policies/publication-policy.ts` (new)
- `packages/publish-domain/src/policies/publication-policy.test.ts` (new)
- `packages/publish-domain/src/policies/publish-snapshot-policy.ts` (delete)
- `packages/publish-domain/src/policies/publish-snapshot-policy.test.ts` (delete)

### Database, evidence, authorization, and smoke

- `apps/server/src/db/migrations/024_revision_backed_publication_and_publish_link_manifests.sql` (new)
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/test-support/database.ts`
- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/entity-audit.ts`
- `apps/server/src/modules/audit/entity-audit.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/audit/audit.db.integration.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-request-context.test.ts`
- `apps/server/src/modules/access/access.db.integration.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.repository.ts`
- `apps/server/src/modules/capture-asset/capture-asset.repository.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

### Revision and publish server modules

- `apps/server/src/modules/artifact-revision/artifact-revision.repository.ts`
- `apps/server/src/modules/artifact-revision/artifact-revision.repository.test.ts`
- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.repository.ts`
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/publish/publish.service.ts`
- `apps/server/src/modules/publish/publish.service.test.ts`
- `apps/server/src/modules/publish/publish.routes.ts`
- `apps/server/src/modules/publish/publish.routes.test.ts`
- `apps/server/src/modules/publish/publish.audit.ts`
- `apps/server/src/modules/publish/publish.audit.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.app.integration.test.ts`

### Portal and public reader

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/publish/ArtifactPublishingPanel.tsx` (new)
- `apps/web/src/features/publish/ArtifactPublishingPanel.test.tsx` (new)
- `apps/web/src/features/publish/ArtifactPublishingPanel.module.css` (new)
- `apps/web/src/features/publish/PublicVersionSelector.tsx` (new)
- `apps/web/src/features/publish/PublicVersionSelector.test.tsx` (new)
- `apps/web/src/features/publish/PublicVersionSelector.module.css` (new)
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.module.css`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.module.css`
- `apps/web/src/features/guide/PublicGuideReaderPage.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.test.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.module.css`
- `apps/web/src/features/guide/publishLinks.ts`
- `apps/web/src/features/guide/publishLinks.test.ts`
- `apps/web/src/features/guide/types.ts`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.module.css`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.module.css`
- `apps/web/src/features/interactive-demo/types.ts`

## Explicit Non-Scope

- live-draft public pointers, automatic `latest`, or implicit rollout to links;
- editing, deleting, overwriting, compacting, or legally purging Publications;
- Publication approval/review workflows, scheduled publishing, release/EOL
  states, channels, environments, or semantic-version parsing;
- Organization-wide/mixed-Artifact links, custom domains, user-chosen slug
  editing, QR codes, social previews, lead capture, or analytics dashboards;
- link reactivation, cloning, transfer, bulk rollout, or Carry-Forward of links;
- persistent JSON/EAV publication content or compatibility aliases for
  `version_number`, `published_version`, or `snapshot_json`;
- new storage providers, Derived Asset modeling, storage lifecycle jobs, or
  permanent Capture Asset purge semantics beyond replacing the temporary
  Publication projection join;
- changes to Capture source immutability, Revision immutability, Edition lineage,
  Project Version meaning, or public-link access rules;
- child `121` design-system foundations or children `122` through `129` editor,
  reader, shell, activity, responsive, accessibility, motion, and polish tracks;
- extension behavior, Documentation, Video, AI, comments, or collaboration;
- editing accepted ADRs, grill history, `CONTEXT.md`, or migrations `001` through
  `023` unless recheck discovers a genuine contradiction requiring user input.

## TDD And Implementation Order

1. Add failing shared contract/domain tests for `publication_sequence`, strict
   requests, manifest default/order/bounds, public response unions, and rollback.
2. Add failing static/live schema tests, then implement migration `024`, reset,
   grants, immutability, deferred manifest, evidence, rollback, and purge-join
   changes. Prove fresh `up`, empty `down`, and `up` before server behavior.
3. Add failing Revision repository tests for publication-trigger create/reuse and
   exact Row Version/lifecycle enforcement; implement by reusing child `119`
   canonical revision code.
4. Add failing publish repository/service DB tests for sequence allocation,
   unlinked publish, explicit selected-link updates, new-link creation, atomic
   conflict rollback, multiple independent links, manifest replacement, and
   same-Edition rollback.
5. Add failing Audit/Access/authorization tests and implement new commands,
   capabilities, database evidence guards, Project activity, and public route
   registrations.
6. Add failing route/API client tests, replace authenticated and public endpoints,
   and remove old snapshot/singular publish contracts.
7. Add failing portal component/editor tests for history, explicit rollout, link
   management, permission/lifecycle, conflicts, revoke, and rollback.
8. Add failing router/public reader/embed tests for default/exact/alias paths,
   selector ordering, password/access states, typed Revision rendering, and
   version-specific protected media.
9. Extend the full two-Project-Version smoke workflow, then run focused, broad,
   DB, migration/rollback, storage, and browser verification.

## Test And Verification Plan

### Focused shared/server tests

- strict Zod rejection of unknown/legacy fields and malformed/default/duplicate/
  over-limit manifests;
- Revision create versus semantic reuse with trigger `publication`;
- Edition-scoped sequences for two Editions of one Artifact, independent Guide/
  Demo behavior, and concurrency-safe allocation;
- zero-link Publication, selected link add/update, unselected pinned link, new
  link, multiple active links, stale expected selected-Link version,
  revoked-link conflict, and complete transaction rollback;
- link create/settings/manifest/reorder/default/removal/revoke and stale Link Row
  Version handling;
- rollback same Edition success and cross-Edition/Artifact/tenant/Project denial;
- Published Artifact/Revision/Link/Entry immutability and runtime grant denial;
- active/archived Project, Project Version, Edition, Owner/Admin/Editor/Viewer,
  unauthenticated, and direct-route authorization;
- Audit command/table/route coverage, typed changes, redaction, optional rollback
  reason, viewer-session revocation, and evidence rollback on failure;
- Access allow/deny outcomes for base/exact reader, embed, password, restricted,
  expired, revoked, alias, missing entry, wrong browser-route Artifact type, and
  Asset streams;
- public composition proves it reads exact Revision rows after the Working Draft
  changes and never exposes a non-included Publication/Version/Asset;
- Capture Asset protection reports Revision and Publication dependencies without
  the removed projection and still blocks purge.

### Database and broad gates

Run and record:

```bash
rtk git status --short
rtk pnpm -r --if-present test
rtk pnpm typecheck
rtk pnpm lint
rtk pnpm build
rtk git diff --check
```

Against disposable PostgreSQL with separate maintenance/runtime credentials:

- fresh create/provision/migrate through `024`;
- migration status;
- empty `024 down` then `024 up`;
- populated `024 down` refusal;
- full `test:db`, not only the publish file;
- full `test:smoke` with safe local synthetic storage;
- runtime attempts to update/delete/truncate Publications and bypass manifest,
  Audit, tenant, or Asset guards;
- unsupported storage and storage-read failure behavior with no false Access
  success or partial bytes.

The smoke must create one Artifact with Editions in two Project Versions,
checkpoint/carry forward, publish both Editions, create two independent links,
update only one selected link on republish, open base/exact versions, roll one
entry back, verify the other link remains pinned, and resolve Guide/Demo media.

## Agent-Browser Validation Requirements

Use `dogfood-ossie` and `agent-browser` against a freshly migrated local API and
portal. Use synthetic data only, separate authenticated/public sessions, and
close services/sessions afterward. Record role, route, fixture, viewport, steps,
result, console/network state, and temporary screenshot path when a screenshot is
needed. Never record passwords, cookies, tokens, slugs, private URLs, storage
keys, or customer content in committed evidence.

Validate at minimum:

1. As Project Editor/Admin, publish Guide and Demo Editions in two Project
   Versions; prove links start unchecked, an unlinked Publication succeeds, a
   new link can be explicitly created, and only selected links move.
2. Create two links for one Artifact with different manifests/access policies;
   reorder entries, change default, remove/add an archived-version Publication,
   reload/deep-link, and prove the links remain independent.
3. Roll one entry back with confirmation/reason, verify sequence/timestamp/
   publisher copy and immediate public rendering, then move it forward again.
4. Viewer sees history but no mutation controls; Editor/Admin direct actions
   succeed; unauthorized/direct requests fail; archived Edition blocks publish
   while active-Project link management remains available; archived Project
   blocks mutation without revoking existing public access.
5. Public Guide and Demo base routes open explicit defaults; selectors contain
   only included versions in default-first link order; selection updates to the
   exact canonical URL; direct reload, back/forward, alias canonicalization, and
   removed/missing version `404` work.
6. Repeat reader behavior in both base and version-specific embed routes.
7. Exercise public, restricted, expired, revoked, password-required, wrong
   password, accepted password, session invalidation after policy/password
   change, and unknown-link states without authorization leakage.
8. Verify exact Revision-backed Guide annotations and Demo hotspots/transitions,
   archived protected Assets, version-specific Asset requests, guessed
   non-selected Asset `404`, and no mutable Working Draft change leaking before a
   new Publication/link update.
9. Exercise loading, empty history/link list, validation, stale conflict, failed
   request, partial-network failure, destructive confirmation cancel/escape,
   duplicate-submit prevention, long names/version labels, and 50-entry boundary.
10. Cover desktop `1440x900`, narrow mobile near `390x844`, keyboard-only focus
    order/visible focus/selector/dialog operation, 200% zoom/reflow, overflow and
    clipping, reader/embed layout, console errors, uncaught exceptions, failed or
    unexpected requests, redirects, and authorization leaks.

Browser capability absence is a blocker, not a pass. Do not substitute component
tests or a final-route screenshot for real end-to-end evidence.

## Acceptance Criteria

- [ ] Published Artifacts are immutable, non-deletable, explicitly relational,
      exact Revision/Edition/Project Version records with Edition-scoped
      `publication_sequence` and no `snapshot_json`.
- [ ] Publishing creates/reuses the correct Publication-triggered Revision,
      always creates one truthful new Publication, and enforces lifecycle and Row
      Version concurrency.
- [ ] Selected link updates/new-link creation are explicit and atomic with
      Publication; unselected links remain pinned and unlinked Publications work.
- [ ] One Artifact supports many independent active/revoked Publish Links with
      safe names, immutable slugs, link-wide policy, `1..50` ordered entries, and
      exactly one default.
- [ ] Manifest management and same-Edition rollback are audited, conflict-safe,
      preserve immutable history, and never change unrelated link properties.
- [ ] Base/exact Guide, Demo, and embed paths render the configured immutable
      Publication, canonicalize included Project Version aliases, and expose only
      the link's default-first selected versions.
- [ ] Public/restricted/password/expiry/revoke/session behavior and Project
      Membership boundaries remain fail-closed and tenant-safe.
- [ ] Public media authorization is exact-Revision and exact-entry scoped;
      protected Assets remain resolvable and unreferenced/unauthorized Assets do
      not leak.
- [ ] Temporary projection, legacy sequence/snapshot contracts, singular publish
      endpoints, and duplicated JSON readers/builders are removed from current
      runtime code without false compatibility aliases.
- [ ] Audit/Access/database guards, runtime grants, migration/reset/rollback,
      focused/broad/DB/smoke/storage checks, and authenticated/public browser
      validation pass with recorded evidence.
- [ ] Child `121` receives stable Publication/Publish Link contracts and can
      modernize visual primitives without reopening domain, persistence, access,
      or public URL semantics.

## Expansion And Recheck Checklist

- [x] Child `119`, master `005`, canonical language, accepted ADRs/grill, current
      publish/revision/schema/routes/contracts/tests/UI/docs, recent history, and
      clean worktree inspected.
- [x] Current JSON snapshot, Artifact-wide sequence, one-link, Default-only,
      projection, authorization, Audit/Access, public reader/embed, and protected
      media compatibility seams recorded.
- [x] Exact clean schema, APIs, DTOs, behavior, security, lifecycle, evidence,
      migration/reset/rollback, UI, test, browser, and non-scope defined.
- [x] Canonical base and version-specific public URL shapes reconciled from the
      accepted grill; no unresolved critical product decision remains.
- [x] Exact affected file inventory, TDD order, acceptance, and child `121`
      handoff recorded.
- [x] Rechecked on 2026-07-20 against `HEAD` `b4cb335`, master `005`, implemented
      child `119`, current code/tests, and the attributable worktree; stale
      route-parameter, selected-Link concurrency, public Artifact-type,
      mutation-evidence, capability-routing, and UI type-file assumptions were
      corrected before the separate planning checkpoint commit.

## Delivery And Closeout Checklist

- [ ] Establish failing tests before every behavior boundary.
- [ ] Implement only child `120` and preserve unrelated user/agent changes.
- [ ] Keep Publication and manifest state relational and type-safe.
- [ ] Run every focused, broad, migration, DB, smoke, storage, and browser gate.
- [ ] Update this file with status, completed checklists, implementation log,
      exact verification evidence, blockers, leftovers, and commits.
- [ ] Update master `005` only for genuinely completed child `120` items.
- [ ] Commit attributable implementation and closeout in small logical commits.

## Implementation Log

Not started.

## Verification Record

Planning-only recheck on 2026-07-20:

- inspected `HEAD`/worktree ownership, master `005`, completed child `119`,
  accepted ADRs/grill decisions, current publish/revision schema, contracts,
  route parameters, capability routing, Audit evidence seams, UI consumers, and
  tests;
- `rtk git diff --check` and a docs-only staged diff/status check are required
  immediately before the planning checkpoint commit.

No runtime tests were run because this change is documentation only. It does not
claim runtime, database, migration, browser, accessibility, performance, or
storage evidence.

## Leftovers And Handoff To Child 121

At expansion time, all work in this plan remains to be implemented.

Child `121` must inherit, not redesign:

- exact Revision-backed Published Artifact identity and Publication Sequence;
- stable type-specific authenticated Publication and Publish Link APIs;
- many independent manifests per Artifact, Link/Entry Row Version behavior,
  explicit rollout, default/order, rollback, revoke, and access semantics;
- canonical `/p/*`, `/d/*`, version-specific, and embed paths;
- typed public Guide/Demo response and version-specific protected-media rules;
- complete Audit/Access/permission/tenant/immutability boundaries.

Child `121` owns design-system foundations and visual primitives only. It must
not reopen the Publication source of truth, Publish Link manifest model, public
URL semantics, permissions, or retention rules merely to simplify UI work.
