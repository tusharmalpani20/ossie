# Child Plan 117: Capture Source Version Scoping

Date reserved: 2026-07-12

Date expanded: 2026-07-19

Date rechecked: 2026-07-19

Status: Expanded, rechecked, and implementation-ready. Runtime implementation
has not started.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Starting baseline:

- `812b40a` (`docs(plan): close project version foundation`)
- the worktree was clean when this expansion began;
- child `116` is complete, including migration `020`, Project Version APIs,
  Project Membership authorization, Audit/Access Evidence, canonical portal
  routes, and the temporary Default-only compatibility seam.

## Sequence Gate

Prerequisite:

- [x] Child `116` is complete and its implementation/recheck is recorded.
- [x] Every new Project transactionally receives an active Default Project
      Version and Project Version IDs are stable, tenant-scoped identities.
- [x] Project Version list/detail/resolve APIs, aliases, lifecycle, manual order,
      canonical portal URLs, Project Membership, and Audit/Access foundations
      are shipped.
- [x] Child `116` handed this child the common Project advisory-lock key and the
      temporary legacy-content guard explicitly.

Next child:

- `118` Guide And Demo Edition And Working Draft Relational Foundation, only
  after the acceptance and closeout gates in this plan pass.

## Goal

Make every Capture Session belong to exactly one explicit Project Version while
preserving Capture source provenance, ordered Capture Events/Assets, tenant
isolation, extension recovery, and the shipped Project Version lifecycle.

Portal and extension creation must submit the selected immutable Project
Version ID. Reads must remain directly addressable in archived Versions; writes
must fail when the owning Project or Project Version is archived. An empty,
unstarted Capture Session draft may be reassigned within the same Project, but
starting capture or creating the first Capture Event or Capture Asset locks that
ownership permanently.

## Canonical Decisions And Current Runtime Facts

### Accepted decisions

- `CONTEXT.md`: a Capture Session groups source Events and Assets inside one
  Project Version; its Project Version becomes immutable at capture start or
  the first Event/Asset.
- ADR `0002`: Capture Sessions are source material, not Guides or Interactive
  Demos.
- ADR `0003`: original Capture source facts and original files are not rewritten
  to author final output. Existing dedicated manual Event text/order and soft-
  archive operations remain presentation/audit mutations; none may change the
  Capture Session's Project Version provenance.
- ADR `0012`: extension and portal capture remain privacy-preserving. Version
  scoping must not add captured URLs, typed values, selectors, storage keys, or
  private metadata to selection state, Audit values, logs, or screenshots.
- ADR `0021`: changing the Default Project Version never moves existing
  Captures; archived Project Versions remain directly addressable and read-only.
- ADR `0023`: every committed mutation has one atomic Audit Event; meaningful
  protected reads and denials have Access Evidence.
- ADR `0024`: Project Versions inherit Project Membership. Project Admins and
  Editors have `capture.write`; Viewers have `capture.read` only. Organization
  Owners retain implicit Project Admin capability.
- ADR `0025`: Project Version ownership and scope enforcement are relational,
  not metadata JSON.

### Shipped seams this child must use

- `project_schema.project_version` has the unique scope key
  `(id, project_id, organization_id)` and lifecycle `active | archived`.
- `project_schema.project.default_project_version_id` is a real scoped foreign
  key. It is initial context only; it is not ownership inference for new
  Captures after this child.
- `project_schema.lock_project_version_scope(project_id)` obtains the common
  transaction-scoped advisory lock used by Project Version lifecycle/default
  operations.
- migration `020` currently:
  - locks every legacy Capture/Guide/Demo root insert with that advisory lock;
  - refuses a Default change while any unscoped Capture, Guide, or Interactive
    Demo root exists.
- portal Project Version routes already resolve aliases and expose
  `{ project, selected, versions }`, but child content currently renders only
  for the active Default Version.
- extension storage currently remembers only a Project and active Capture
  Session. Its displayed/opened Version is inferred from the Project's current
  Default and is therefore not safe after explicit Capture ownership ships.
- Capture HTTP routes are Project-nested and currently omit Project Version
  context. Capture Session responses contain `project_id` but no
  `project_version_id` or Project Version summary.
- Capture Event and Capture Asset rows repeat Organization/Project/Capture IDs,
  but their current foreign keys point only to the Capture Session/Asset ID.
- Guide and Interactive Demo roots are still Project-scoped. Child `118`, not
  this child, owns their Artifact/Edition Project Version persistence.

### Locally decided implementation details

These details are reversible and stay within accepted semantics; they do not
require a new ADR or grill:

1. Retain `capture_session.project_id` and `organization_id`. They support the
   existing Project-nested API, tenant indexes, scoped foreign keys, and evidence
   roots. They are not competing ownership because a composite foreign key makes
   `project_version_id` belong to that exact Project and Organization.
2. Do not duplicate `project_version_id` onto Capture Event or Capture Asset.
   Their Version is derived through their mandatory Capture Session. Strengthen
   their composite foreign keys so they cannot point at a Session in another
   Project/Organization.
3. Keep existing Project-nested Capture route paths. Make Project Version
   explicit in create bodies and collection queries, and return ownership on
   every Capture Session. Nested Event/Asset routes derive the immutable Version
   from the Capture Session ID and must not accept a second caller-supplied
   Version ID.
4. Add a dedicated reassignment command rather than overloading general PATCH.
   This gives the provenance transition a strict body, optimistic Row Version,
   independent Audit action, and unambiguous database command guard.
5. Extension start creates the Session as already started in the same audited
   transaction using `start_immediately: true`. Portal manual creation defaults
   to an unstarted draft. This removes the create/start crash window for the
   extension while retaining the accepted empty-draft reassignment case.
6. Until child `118` can persist Guide/Demo Edition ownership, generation from a
   Capture is allowed only when that Capture's Project Version is the Project's
   current Default. A non-default Capture returns a clear `409`; it is never
   silently emitted into the Default Version. If the Default later changes, the
   comparison uses the Capture's stored ID, not its original/default status.
7. No pre-live HTTP fallback infers omitted `project_version_id`. Missing context
   is a `400` schema error. Legacy authenticated portal URLs remain usable by
   canonical redirection; this is URL compatibility, not ownership inference on
   a write.

## Scope

### Included

- migration `021` with mandatory Capture Session Project Version ownership;
- same-Organization/same-Project relational constraints for Capture root,
  Event, and Asset scope;
- database-enforced provenance lock and concurrency-safe lock ordering;
- explicit create/list/reassignment contracts and version-aware responses;
- active/archived Project Version read/write rules across Session, Event, Asset,
  upload, completion, archive, and generation routes;
- atomic Audit coverage for reassignment and Project Version Change Items;
- Access coverage/root resolution updates required by the changed contract;
- portal list/create/detail/reassignment and canonical routing for Default,
  named active, and archived Project Versions;
- extension Project Version selection, stale-selection recovery, active Capture
  restoration, exact-version deep links, and automatic/manual capture behavior;
- temporary Guide/Demo generation guard and context-safe redirects;
- focused unit/route/app/DB tests, broad regression, smoke, and real-browser
  validation with synthetic data;
- closeout updates to this child, the completed items in master `005`, and
  current-state docs.

### Explicit non-scope

- Guide/Interactive Demo Artifact identity, Edition, Working Draft, or
  `project_version_id` persistence; child `118` owns it;
- allowing non-default Capture-to-Guide/Demo generation before child `118`;
- Carry-Forward, Revisions, Publications, or multi-Version Publish Links;
- Project Version creation, slug/alias/default/order/lifecycle redesign;
- per-Version membership or any permission model beyond inherited Project
  Membership;
- Project Inbox, quick-capture fallback, automatic Version creation, semantic
  version parsing, or a moving `latest` alias;
- copying/moving a started or non-empty Capture between Versions;
- adding Project Version IDs to Capture Events, Capture Assets, or Files;
- rewriting, duplicating, or deleting original Capture files/events/assets as a
  consequence of reassignment;
- redesigning existing manual Capture Event correction, ordering, or archive
  workflows; they remain locked to the source Session's Version;
- extension sync storage, cross-device selection sync, background polling, or a
  new extension service worker architecture;
- public routes, public Publish Links, anonymous access, analytics, export,
  retention, legal purge, or compliance certification;
- overnight-runner/checkpoint tooling, which the user explicitly deferred;
- customer/private URLs, credentials, tokens, raw captured input, or private
  screenshots in fixtures or evidence.

## Exact Affected Files

The implementation agent must re-run `rtk git status --short` and re-run the
search manifest before editing. Files added by concurrent work are not silently
absorbed.

### Plan and current-state documentation

- `docs/plan/117-capture-source-version-scoping.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`

`CONTEXT.md` and accepted ADRs already contain the required durable semantics.
Change them only if implementation discovers a genuinely new critical decision;
do not edit them merely to report completion.

### Shared contracts and Capture domain

- `packages/types/src/capture.ts`
- `packages/types/src/capture.test.ts`
- `packages/capture-domain/src/types/capture-session.ts`
- `packages/capture-domain/src/policies/capture-session-policy.ts`
- `packages/capture-domain/src/policies/capture-session-policy.test.ts`
- `packages/capture-domain/src/errors/capture-domain-error.ts`
- `packages/capture-domain/src/index.ts` only if a newly exported error/type is
  not already covered by its directory exports

Do not add a new constants package value: statuses and source types are
unchanged.

### Database and server foundation

- new `apps/server/src/db/migrations/021_capture_source_version_scoping.sql`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/audit-schema-verification.ts` and
  `apps/server/src/db/audit-schema-verification.test.ts` only if migration `021`
  introduces a guarded database function that the existing verifier requires
  explicitly
- `apps/server/src/test-support/database.ts`
- `apps/server/package.json` only if the explicit DB suite file list needs a new
  test file; prefer extending the existing Capture/Project Version suites

Do not rewrite migrations `002`-`020`. Migration history is append-only.

### Capture Session server

- `apps/server/src/modules/capture-session/capture-session.routes.ts`
- `apps/server/src/modules/capture-session/capture-session.routes.test.ts`
- `apps/server/src/modules/capture-session/capture-session.service.ts`
- `apps/server/src/modules/capture-session/capture-session.service.test.ts`
- `apps/server/src/modules/capture-session/capture-session.repository.ts`
- `apps/server/src/modules/capture-session/capture-session.audit.ts`
- `apps/server/src/modules/capture-session/capture-session.audit.test.ts`
- `apps/server/src/modules/capture-session/capture-session.app.integration.test.ts`
- `apps/server/src/modules/capture-session/capture-session.db.integration.test.ts`

If repeated scoped joins cannot be kept readable in the existing repository,
add exactly
`apps/server/src/modules/capture-session/capture-session-scope.repository.ts`
and its focused test. It may expose database lookup/lock helpers only; it must
not become a second authorization service or move shared HTTP contracts into the
server app.

### Capture Event and Asset server

- `apps/server/src/modules/capture-event/capture-event.routes.ts`
- `apps/server/src/modules/capture-event/capture-event.routes.test.ts`
- `apps/server/src/modules/capture-event/capture-event.service.ts`
- `apps/server/src/modules/capture-event/capture-event.service.test.ts`
- `apps/server/src/modules/capture-event/capture-event.repository.ts`
- `apps/server/src/modules/capture-event/capture-event.audit.ts`
- `apps/server/src/modules/capture-event/capture-event.audit.test.ts`
- `apps/server/src/modules/capture-event/capture-event.app.integration.test.ts`
- `apps/server/src/modules/capture-event/capture-event.db.integration.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.repository.ts`
- `apps/server/src/modules/capture-asset/capture-asset.audit.ts`
- `apps/server/src/modules/capture-asset/capture-asset.audit.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.app.integration.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts`

Audit builders change only where they need the owning Version for safe evidence
or the new lock path; Event/Asset Audit actions themselves remain unchanged.

### Evidence, authorization, and generation boundary

- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-response-hook.test.ts` only if resolved
  root assertions change
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/modules/project-version/project-version.db.integration.test.ts`
- `apps/server/src/modules/guide/guide.service.ts`
- `apps/server/src/modules/guide/guide.service.test.ts`
- `apps/server/src/modules/guide/guide.repository.ts`
- `apps/server/src/modules/guide/guide.routes.ts`
- `apps/server/src/modules/guide/guide.routes.test.ts`
- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.repository.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

`apps/server/src/app.ts` is not expected to change: current services are already
wrapped with central Project authorization. Touch it only if an existing
dependency type requires wiring, and record why in the implementation log.

### Portal

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.tsx`
- `apps/web/src/features/project-version/ProjectVersionRouteBoundary.test.tsx`
- `apps/web/src/features/capture-session/types.ts`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.module.css`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`

The Guide editor is listed only because its Project-wide Capture Asset picker
must submit a Version filter. Guide/Demo information architecture and editor
redesign remain outside this child.

### Extension

- `apps/extension/src/lib/api.ts`
- `apps/extension/src/lib/api.test.ts`
- `apps/extension/src/lib/settings.ts`
- `apps/extension/src/lib/settings.test.ts`
- `apps/extension/src/lib/url.ts`
- `apps/extension/src/lib/url.test.ts`
- `apps/extension/src/lib/automatic-capture.ts`
- `apps/extension/src/lib/automatic-capture.test.ts`
- `apps/extension/src/popup/helpers.ts`
- `apps/extension/src/popup/helpers.test.ts`
- `apps/extension/src/App.tsx`
- `apps/extension/src/App.test.tsx`
- `apps/extension/src/index.css` only for the Version selector/stale-state layout

`background.ts`, `content-script.ts`, capture privacy logic, and the manifest are
not expected to change. Automatic capture continues to derive its immutable
root from stored active-Capture state.

### Fixture-only updates discovered by compilation/search

Mandatory create input and schema constraints will require mechanical fixture
updates in existing DB suites that insert Capture Sessions directly, especially:

- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

Only add the Project's actual Default/named Project Version ID to those fixtures.
Do not broaden their behavior or rewrite unrelated assertions. After the first
compile/DB run, use `rtk rg` to find every remaining direct Capture insert or
create request; record any additional fixture-only file in the implementation
log before editing it.

## Persistence And Migration Contract

### Migration `021`

Migration `021_capture_source_version_scoping.sql` must:

1. fail with SQLSTATE `55000` if any Capture Session exists, with reset/reseed
   instructions. This pre-live repository deliberately does not guess ownership
   for 116-era rows or silently backfill them to whatever is Default at migration
   time;
2. add `capture_schema.capture_session.project_version_id VARCHAR(26) NOT NULL`;
3. add a composite foreign key
   `(project_version_id, project_id, organization_id)` referencing
   `project_schema.project_version(id, project_id, organization_id)` with
   `ON DELETE RESTRICT`;
4. retain the direct `project_id`/`organization_id` columns and current Project
   relationship;
5. add a unique constraint on Capture Session
   `(id, project_id, organization_id)` for child scope references;
6. replace the single-column Capture Session foreign keys on Capture Asset and
   Capture Event with composite
   `(capture_session_id, project_id, organization_id)` foreign keys;
7. add a unique scope key on Capture Asset
   `(id, capture_session_id, project_id, organization_id)` and replace the Event
   `capture_asset_id` foreign key with
   `(capture_asset_id, capture_session_id, project_id, organization_id)` so a
   non-null Event asset cannot belong to another Session/Project/Organization;
8. add an index serving Version-scoped Session list/status/order, at minimum
   `(organization_id, project_id, project_version_id, status, created_at DESC,
id DESC)` for non-deleted rows;
9. update comments to state exact Project Version ownership and derivation of
   Event/Asset Version through the Session;
10. replace the Capture legacy-root trigger from migration `020` with the new
    scope/provenance guard, while retaining the Guide and Interactive Demo legacy
    root triggers for child `118`;
11. replace `project_schema.enforce_project_default_mutation_command()` so its
    legacy-content check considers Guide and Interactive Demo roots only.
    Capture roots no longer block Default changes because changing Default does
    not move their explicit ownership;
12. extend the database Audit command policy and Capture Session update context/
    evidence trigger allowlists for
    `capture_session.reassign_project_version` /
    `capture_session.project_version_reassigned`;
13. revoke public execution and grant only the shipped runtime role the minimum
    execution privileges for any new guard functions;
14. provide a DOWN section that first refuses non-empty Capture data with
    SQLSTATE `55000`, then restores migration `020` guards/command policy and
    drops the new constraints/column in dependency-safe order. A down migration
    must never discard ownership silently.

### Database provenance guard

The database is the final authority even for direct runtime-role SQL:

- every Capture root insert obtains
  `lock_project_version_scope(project_id)` and verifies the referenced Version
  is active and in the exact Organization/Project;
- `capture_session.create` may insert either:
  - `draft` with `started_at IS NULL`, or
  - `capturing` with server-generated non-null `started_at` when
    `start_immediately` was requested;
- `project_version_id`, `project_id`, and `organization_id` are immutable under
  every command except the dedicated reassignment command;
- reassignment obtains the Project advisory lock before row locks and succeeds
  only when the Session:
  - is active (not soft-deleted),
  - has the expected Row Version,
  - has `status = 'draft'`,
  - has `started_at IS NULL`,
  - has no Capture Event row and no Capture Asset row, including soft-deleted
    rows, because the first source record permanently locked provenance;
- the target Version must be active and in the exact same Organization/Project;
- changing to the existing Project Version is rejected as unchanged;
- starting a Session, inserting the first Event, inserting the first Asset, and
  reassigning all use the same lock order:
  1. Project advisory lock;
  2. Capture Session row lock where a Session already exists;
  3. target Project Version/child rows as required;
- Event/Asset insert guards validate the owning Project Version is still active
  after locks are held. This serializes create/reassign/start/archive/default
  races and prevents a check-then-write gap;
- Capture Session UPDATE/soft-delete, Capture Event
  INSERT/UPDATE/reorder/soft-delete, and Capture Asset
  INSERT/UPDATE/soft-delete each resolve the owning Session after taking the
  Project advisory lock and reject an archived owning Project Version at the
  database boundary. Application service checks provide typed errors, but they
  are not the only enforcement;
- File soft-delete performed by Capture Asset deletion remains inside the same
  transaction and is rolled back if the owning Version guard rejects the Asset
  mutation;
- Event/Asset rows never receive their own Project Version mutation path.

Do not represent the lock with a mutable boolean. The authoritative fact is the
server-controlled lifecycle plus retained existence of any Event/Asset. A
deleted Event/Asset still proves source material once existed.

### Reset, reseed, and backwards compatibility

- A database with rows rejected by migration `021` must be reset and reseeded;
  no production data migration is promised in this pre-live phase.
- Empty migration from `001` through `021`, reset, and seed must pass.
- Existing Project IDs, Project Version IDs/slugs/aliases, Capture IDs, Event
  order, Asset/File relationships, Audit IDs, and public routes are unchanged.
- Existing HTTP clients that omit required Version context receive `400`; the
  portal and extension update atomically in this child.
- Extension local-storage parsing remains tolerant of unknown/missing keys.
  However, an old active Capture record without an exact stored Version must not
  be assigned the current Default. Attempt exact Session recovery from the
  server; if it cannot be recovered, retain a blocked state with an explicit
  discard-local-state action.
- No Project Version delete route exists in child `116`. “Deleted” extension
  recovery is still handled as a not-found/stale selection so a future removal
  or reset cannot cause silent fallback.

## Shared Schemas And Types

### Capture Session response

Extend `CaptureSessionSchema` and the server `CaptureSession` model with:

```ts
project_version_id: IdSchema;
project_version: ProjectVersionSummarySchema;
```

The nested summary is response/read-model data, not a second persistence source.
It contains the shipped summary fields `id`, `name`, `slug`, `status`, and
`position`. Its `id` must always equal `project_version_id`.

All Session create/get/list/detail/update/reassign/complete responses use this
shape. Completion redirects are canonical and use the stored summary slug:

```ts
{
  capture_session,
  redirect: {
    path: `/projects/${project_id}/versions/${project_version.slug}/capture-sessions/${id}`,
    reason: "capture_session_completed"
  }
}
```

URL builders must percent-encode every dynamic segment.

### Create and list

`CreateCaptureSessionRequestSchema` adds:

```ts
project_version_id: TrimmedIdParamSchema;
start_immediately?: boolean; // default false; extension sends true
```

`project_version_id` is required. The route picker must copy it; it must not be
dropped before normalization. `start_immediately` is a command input only and is
not persisted as metadata.

`CaptureSessionListQuerySchema` becomes strict for recognized fields and
requires:

```ts
project_version_id: TrimmedIdParamSchema;
status?: CaptureSessionStatus;
```

The list returns only rows matching Organization, Project, and that immutable
Project Version ID, ordered by `created_at DESC, id DESC` as today.

`ProjectCaptureAssetListQuerySchema` (the Project-wide screenshot/source picker)
must likewise require `project_version_id` in addition to its existing asset
type filter, and the repository must join through Capture Session ownership.

### Reassignment

Add strict shared schemas/types:

```ts
ReassignCaptureSessionProjectVersionRequestSchema = z
  .object({
    project_version_id: TrimmedIdParamSchema,
    expected_version: PositiveIntSchema,
  })
  .strict();

ReassignCaptureSessionProjectVersionResponseSchema =
  CaptureSessionResponseSchema;
```

Do not add `project_version_id` to `UpdateCaptureSessionRequestSchema`. General
PATCH cannot move provenance.

### Domain errors and HTTP mapping

Use typed errors and stable response types:

- missing/foreign-Organization/foreign-Project Version:
  `404 project_version_not_found`;
- archived target or mutation against an archived owning Version:
  `409 project_version_conflict` with read-only copy;
- same target or otherwise empty reassignment request:
  `400 capture_session_project_version_unchanged`;
- stale expected Capture Row Version:
  `409 capture_session_conflict`;
- started, non-draft, or ever-non-empty Session:
  `409 capture_session_project_version_locked`;
- Guide/Demo generation where Capture Version is not current Default:
  `409 capture_artifact_version_not_ready`;
- existing unauthenticated, Project not-found, permission, Session not-found,
  validation, completion, upload, and privacy errors retain their current codes.

Do not reveal that a foreign-tenant Version or Capture exists. Cross-scope IDs
collapse to the same not-found response as a random ID after Project access is
authorized.

## HTTP API Contracts

All routes retain `/api/v1` and Project nesting.

### Changed Capture Session routes

```text
POST   /api/v1/projects/:project_id/capture-sessions
GET    /api/v1/projects/:project_id/capture-sessions
GET    /api/v1/projects/:project_id/capture-sessions/:id
GET    /api/v1/projects/:project_id/capture-sessions/:id/detail
PATCH  /api/v1/projects/:project_id/capture-sessions/:id
POST   /api/v1/projects/:project_id/capture-sessions/:id/complete
DELETE /api/v1/projects/:project_id/capture-sessions/:id
POST   /api/v1/projects/:project_id/capture-sessions/:id/reassign-project-version
```

- POST create requires the body contract above and returns `201`.
- GET collection requires `?project_version_id=...`; `status` remains optional.
- GET item/detail derive Version from the immutable Session and include it in
  response; callers do not submit a redundant query Version.
- PATCH/update, complete, and delete derive ownership from the Session and reject
  archived owning Versions.
- reassignment uses its strict body, returns `200`, and is registered before a
  conflicting parameter route if Fastify route matching requires it.
- Access resolved resource for item/detail/mutations is the actual Capture
  Session ID after the tenant/project lookup, never the body Version ID.

### Changed Capture Asset collection route

```text
GET /api/v1/projects/:project_id/capture-assets?project_version_id=:id&asset_type=...
```

The Version filter is required. Session-nested Asset/Event routes do not add a
Version parameter; they resolve through the Session and enforce its lifecycle.
Reads/downloads from archived Versions remain allowed. Creates/uploads/updates/
reorders/soft-deletes fail when the owning Version is archived.

### Extension request classification

Extension calls continue to send `x-ossie-client: extension`, including Project
Version list/detail recovery requests. Capture writes retain `source_type =
extension`.

For Capture Session creation, request classification is explicit:

- `x-ossie-client: extension` stores `source_type = extension`; an omitted or
  matching body value is accepted and a contradictory body value returns
  `400 invalid_capture_session`;
- a non-extension request cannot claim `source_type = extension`;
- `manual` remains the portal/default source and the existing authenticated
  `import` value remains an explicit API choice with the real Org User actor
  retained in evidence;
- `start_immediately` is lifecycle intent, not proof of client identity. It may
  be used by an authorized API caller, while the in-repository extension always
  sends it as `true` and the portal sends/defaults it to `false`.

### Temporary Guide/Demo generation boundary

The existing routes remain:

```text
POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id
POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos
```

In the same audited transaction, first obtain
`lock_project_version_scope(project_id)`, then lock and resolve the Project,
Capture Session, and owning Project Version, verify exact Organization/Project
scope and active lifecycle, then require:

```text
capture_session.project_version_id = project.default_project_version_id
```

If false, return `409 capture_artifact_version_not_ready` before any Guide,
Demo, Block, Step, Scene, File, Audit, or other target row is inserted. If true,
the existing generation behavior remains and portal redirects use the Capture's
canonical Version slug. Child `118` replaces this temporary equality guard with
real Edition ownership. The advisory lock must be acquired before any existing
Guide/Demo repository row lock so generation cannot deadlock with Default
change, Version archive, Capture reassignment, or the legacy Guide/Demo insert
trigger.

## Service, Repository, And Behavior Rules

### Create

1. Central Project authorization runs first (`capture.write`).
2. Resolve the submitted Version by immutable ID inside the authenticated
   Organization and URL Project.
3. Return not-found for a random/cross-Project/cross-Organization ID.
4. Reject archived Project Versions.
5. Obtain the Project advisory lock and re-read lifecycle under the lock.
6. Insert Session plus Audit Event atomically with explicit Version ownership.
7. Portal manual create uses `start_immediately = false`, producing
   `status = draft`, `started_at = null`.
8. Extension create uses `start_immediately = true`, producing
   `status = capturing` and a server timestamp in the same transaction.
9. Never infer Default in the server. Defaulting is a deliberate client
   selection before request submission.

### Read and list

- Project Members with `capture.read` can read Capture Sessions in active or
  archived Project Versions and archived Projects.
- Collection queries require a Version ID and never mix rows across Versions.
- Detail/Event/Asset reads derive Version from the Session and remain stable if
  Default changes.
- A Project Version alias is a portal URL concern. APIs accept immutable IDs,
  not slugs/aliases, for selection filters and writes.
- Existing Event ordering and Asset ordering remain unchanged.

### Reassignment

- Only Project Admins/Editors (or Organization Owners) with `capture.write` may
  reassign.
- Project and both source/target Versions must be active.
- The Session must satisfy every database lock condition. A hidden,
  soft-deleted Event/Asset still locks it.
- Reassignment changes only `project_version_id`, `updated_by_id`,
  `updated_at`, and increments Row Version once.
- It does not rewrite `project_id`, `organization_id`, source metadata, Session
  lifecycle timestamps, Events, Assets, Files, Guide/Demo provenance, or
  existing evidence.
- It commits one Audit Event or nothing. A denied/conflicting request creates no
  mutation Audit Event, while applicable denial Access Evidence remains.
- On success, the portal replaces the canonical URL with the target Version slug
  and reloads authoritative detail.

### Start and first source material

- Transitioning to `capturing` sets `started_at` server-side once and locks
  Project Version provenance.
- Extension `start_immediately` performs that transition as part of create.
- Inserting any Capture Event or Capture Asset locks provenance even if Session
  status is still `draft` (manual upload behavior).
- Event/Asset insertion must reject archived owning Versions and must not
  auto-move to Default or the extension's currently selected Version.
- Completion/cancel/archive/delete do not unlock provenance.
- Soft-deleting every Event/Asset does not unlock provenance.

### Project and Project Version lifecycle

- archived Project: existing central wrapper keeps all content writes blocked;
  reads remain available according to Project Membership;
- archived Project Version: all Capture writes beneath it are blocked; reads and
  direct canonical URLs remain available;
- Default change: succeeds even when Capture Sessions exist, because each keeps
  its stored Version; it still fails while legacy Guide/Demo roots exist until
  child `118`;
- Version archive racing a Capture write is serialized. Whichever obtains the
  advisory lock first determines the valid outcome; no write may commit after
  archived state is visible under lock;
- restoring a Version restores normal Capture write eligibility but never
  changes ownership.

### Authorization and tenant isolation

- Use central `with_project_authorization` capability mapping; do not add route-
  local role comparisons.
- `viewer`: list/detail/Event/Asset/file reads only.
- `editor`, `project_admin`, implicit Organization Owner: Capture create/update/
  complete/reassign/Event/Asset writes while Project and Version are active.
- Project Version management remains Project Admin/Owner only; this child does
  not let Editors archive/restore Versions.
- Always validate Organization + Project + Version/Session together. Never
  authorize a supplied Version ID independently or return payload before the
  scoped lookup.
- Membership revocation and role changes apply on the next request. Stored
  extension selections confer no authority.
- Public Publish Links and anonymous readers receive no Capture access.

## Audit And Access Evidence

### Audit

Add registry entry:

```text
command: capture_session.reassign_project_version
action:  capture_session.project_version_reassigned
route:   POST /api/v1/projects/:project_id/capture-sessions/:id/reassign-project-version
write:   UPDATE capture_schema.capture_session (entity capture_session, operation update)
sources: web | api | extension | import
actor:   org_user
```

The successful event:

- roots at the Capture Session ID and Project ID;
- records before/after Row Version;
- contains a typed `identifier` Change Item for `project_version_id`;
- does not include Version name/slug snapshots, URLs, captured content, storage
  paths, session tokens, or request bodies;
- uses the existing safe actor label/request correlation behavior;
- commits atomically with the reassignment.

Add `project_version_id` as a safe identifier Change Item on
`capture_session.created`. Existing update/completion actions include it only if
changed; ordinary commands must never be able to change it. Event/Asset Audit
roots and actions remain unchanged because their Version derives from the
Capture root.

The database context/evidence guard must reject an unaudited direct reassignment,
a wrong command/action/source pair, a missing Change Item, or a command that
tries to change Version with other forbidden fields.

### Access

- register the reassignment route through the existing mutation/Audit registry
  integration;
- existing list read remains rooted at Project; selected Version ID may be safe
  structured context only after same-scope resolution and need not become the
  root;
- item/detail/Event/Asset/download reads root at the actual resolved Session/
  Event/Asset as today;
- extension Project Version discovery and Capture reads/writes retain surface
  `extension` through `x-ossie-client`;
- successful protected reads fail closed if Access Evidence cannot be appended;
  successful atomic writes remain covered by the mutation transaction;
- denials include only safe available Project/root IDs and error type. Do not
  preserve a foreign supplied Version ID as a trusted root.

Add the new reassignment action to the explicit Project Activity Capture
allowlist and verify its `capture` category/summary in the repository test. Do
not redesign the timeline or expose Audit Change Item values there.

## Portal Behavior

### Route boundary and canonical URLs

- Extend `ProjectVersionRouteBoundary` with an explicit content mode such as
  `capture-version` versus the existing default `legacy-default`.
- Capture routes render for any resolved Project Version, including archived
  Versions in read-only mode.
- Guide/Demo routes retain the Default-only compatibility behavior until `118`.
- Version workspace cards show Capture Sessions for active named Versions and
  archived direct workspaces. Guide/Demo cards remain Default-only.
- Canonical Capture URLs remain:

```text
/projects/:projectId/versions/:versionSlug/capture-sessions
/projects/:projectId/versions/:versionSlug/capture-sessions/:captureSessionId
```

- alias slugs replace to the canonical Version slug without losing suffix,
  query, or hash;
- legacy collection URL redirects to the current Default Version collection;
- legacy detail URL first resolves the Session, then redirects to the Session's
  stored canonical Version slug. It must not assume current Default;
- if a canonical detail URL names a different Version from the resolved Session,
  replace it with the owning Version URL after authorized detail resolution.
  Project Membership applies uniformly, so this does not cross a permission
  boundary;
- loading, not-found, generic error, and retry states remain explicit during
  both Version and Session resolution.

### List and create

- use the resolved `selected.id` for the required list query and create body;
- do not derive the ID from slug client-side;
- heading/context visibly identifies Project and Project Version;
- active Project + active Version + write role shows manual creation;
- archived Project, archived Version, or Viewer shows read-only state and no
  create action;
- empty/loading/error/permission states refer to the selected Version and never
  display another Version's Capture count;
- a stale tab submits its originally resolved immutable Version ID. If the
  Version was archived before submit, server `409` is shown and the form remains
  recoverable; it must not retry against current Default.

### Detail and reassignment

- display the owning Project Version summary from the Session response;
- all Event/Asset actions use Session-derived scope and are disabled for an
  archived Project/Version or Viewer;
- show reassignment only when the loaded Session appears draft, unstarted, and
  empty and the user can write. The server remains authoritative because a
  concurrent first Event/Asset can lock it;
- target selector lists active Versions in shipped order (Default first, then
  manual position) and excludes the current Version and archived Versions;
- submit `{ project_version_id, expected_version: session.version }`;
- while pending, disable duplicate actions; on `409` reload and show the stable
  conflict/locked message; on success replace URL with target canonical slug;
- no destructive confirmation is required because an eligible empty draft has
  no source material, but copy must explain that Version cannot change after
  capture begins;
- Guide/Demo generation controls remain available only when the Session's
  Version is current Default. For named non-default Captures, render the
  temporary child-`118` explanation and do not submit a doomed request.

### Project-wide Capture Asset picker

Pass the current resolved Project Version ID into the Guide editor's existing
Capture Asset picker request. While Guides are still Default-only this is the
Default ID; the contract is ready for child `118` without exposing assets from
another Version.

## Extension Behavior

### Storage contract

Add nullable, parsed storage keys tied to the selected Project:

```ts
selectedProjectVersionId;
selectedProjectVersionSlug;
selectedProjectVersionName;
```

Add immutable active-Capture snapshot keys:

```ts
activeCaptureProjectVersionId;
activeCaptureProjectVersionSlug;
activeCaptureProjectVersionName;
```

- `saveSelectedProject...` writes Project and Version selection coherently;
- selecting another Project seeds that Project's returned Default Version as an
  explicit pre-capture choice, then persists it;
- selecting a named Version replaces all selected Version snapshot fields;
- `saveActiveCapture` persists Session, Project, exact Version ID/slug/name,
  Event index, mode, and paused state together;
- changing selected Project/Version after capture starts must not change active
  keys;
- clearing active capture/signing out/changing instance clears all active
  Version keys with the existing active state;
- changing instance or clearing settings clears selected Version keys;
- never store URLs, capture payloads, access tokens beyond the existing session
  token, or Project Version descriptions in these keys.

### Project Version discovery and selection

- add authenticated extension API calls for shipped Project Version list and
  exact Session recovery; send `x-ossie-client: extension`;
- show Project selection first, then an accessible Project Version selector;
- selector ordering is the server order: Default first, then active manual
  positions. Archived Versions are not valid new-capture targets;
- no stored Version: seed the selected Project's current Default and persist it
  before enabling Start;
- stored Version still active and authorized in the selected Project: retain it,
  even if the Project Default changed;
- if that retained Version was renamed, refresh its stored name/canonical slug
  from the immutable-ID list result without changing the selection; permanent
  aliases keep an already-open old URL safe during the refresh;
- stored Version archived, missing/deleted, foreign to the selected Project, or
  no longer authorized: do not silently select another Version. Show a stale
  selection state and require explicit selection of an active Version;
- if the same stored Version is later restored, successful immutable-ID
  validation may re-enable Start without changing the selection;
- explicit Project change may seed that newly selected Project's Default because
  the user is choosing a new capture context and no capture is active;
- Start remains disabled until exact Project + active Version validation passes.

### Start, restore, capture, finish, and deep links

- create body includes selected `project_version_id` and
  `start_immediately: true`;
- after success, trust the returned Session ownership, verify it matches the
  submitted Version, then persist active Version snapshot from the response;
- an active Capture always displays `Project / stored Capture Version`, not the
  Project's current Default;
- automatic/background and manual screenshot paths continue using stored
  Project + Session IDs. They never consult selected/default Version for a
  running Capture;
- popup restoration validates stored active state against exact Session when
  available. If Version is archived, Project is unauthorized/missing, Session is
  missing, or state is incomplete, retain the exact blocked context and allow
  opening (when readable) or discarding local state; never start submitting to a
  different Version;
- an authorized Session response is authoritative when old/incomplete/corrupt
  local active Version snapshot fields disagree: repair only the local snapshot
  to the Session's stored `project_version_id` and current name/slug. This is
  recovery of the same Capture root, not reassignment or Default fallback;
- a Project Version rename during active capture refreshes display/deep-link
  metadata by immutable ID or the next Session response. Writes remain rooted
  at Project + Session IDs, and a stored old slug remains alias-safe;
- Version archived during an active Capture: writes/finish surface server
  conflict, remain associated with the same Version, and require restore or
  discard; no fallback;
- Default changed during active Capture: no behavior change;
- finish response path and fallback URL use the active Capture Version slug;
- “Open in portal” also uses active Version slug, not selected/default context;
- clear local active state only after successful completion. If opening the
  portal fails after completion, retain enough returned URL/context for a retry
  or follow the existing explicitly documented behavior; never reopen under a
  different Version.

## TDD Implementation Order

Follow red-green-refactor for each boundary:

1. Add failing shared contract/domain tests for required create/list Version
   IDs, response summary, `start_immediately`, reassignment, redirect, and typed
   errors.
2. Add migration/DB red tests for mandatory scope, composite foreign keys,
   empty-draft reassignment, permanent lock after start/first Event/Asset,
   archived lifecycle, direct runtime-role bypass, and lock races.
3. Implement migration `021` and the smallest repository mapping/queries needed
   for those tests.
4. Add failing Capture Session service/route/Audit tests; implement explicit
   create/list/read/reassign/complete behavior and evidence.
5. Add failing Event/Asset service/DB tests for derived Version lifecycle and
   composite scope; implement without adding child Version columns.
6. Add failing Guide/Demo generation tests for same-Default success and named/
   changed-Default refusal; implement the temporary transaction guard.
7. Update Access/Audit registries and route/source/database coverage tests.
8. Add portal API/App/boundary/list/detail red tests, then implement canonical
   Version list/create/reassignment/read-only behavior.
9. Add extension API/settings/helper/App/automatic-capture red tests, then
   implement explicit selection, stale recovery, active snapshot, and deep
   links.
10. Update fixture-only callers surfaced by typecheck/DB tests; do not preemptively
    refactor unrelated tests.
11. Run focused suites, then database, smoke, builds/lint/format checks, and real
    browser validation.
12. Recheck this plan against the diff, close only passing checklist items, and
    update master `005` only for completed child-`117` facts.

## Verification Plan

### Shared/unit/route tests

At minimum verify:

- create rejects omitted/blank Version ID and preserves no server Default
  fallback;
- extension request classification forces `source_type = extension`, rejects a
  non-extension claim to that source, and preserves explicit authenticated
  import evidence;
- portal draft create and extension immediate-start create normalize correctly;
- list requires and forwards exact Version ID;
- response and completion redirect contain matching immutable ownership;
- reassignment body is strict, general PATCH cannot change Version, and stable
  error codes map correctly;
- cross-Organization/cross-Project/random/archived target denial;
- Viewer write denial and Editor/Admin/Owner success;
- archived owning Version blocks every Session/Event/Asset mutation but permits
  reads/downloads;
- database guards, not only service mocks, reject direct runtime-role Session,
  Event, and Asset updates/deletes beneath an archived Version;
- Access/Audit registries cover the new route and extension source;
- Audit creation/reassignment Change Items contain safe Version IDs only;
- Guide/Demo generation is allowed only for current-Default Capture Version;
- portal Version mismatch canonicalization, named/archived list states,
  stale-tab `409`, reassignment pending/conflict/success, and disabled generation;
- extension no-selection default seed, explicit named selection, changed Default,
  Version rename, archived/restored/missing/unauthorized stale selection,
  corrupt-snapshot repair from the exact Session, exact active restore,
  automatic and manual capture, finish/open URLs, sign-out/instance clearing,
  and no silent active fallback.

Suggested focused commands (adapt file lists to the final diff):

```text
rtk pnpm --filter @repo/types test -- capture.test.ts
rtk pnpm --filter @repo/capture-domain test -- capture-session-policy.test.ts
rtk pnpm --filter @repo/server test -- \
  src/modules/capture-session/capture-session.service.test.ts \
  src/modules/capture-session/capture-session.routes.test.ts \
  src/modules/capture-session/capture-session.audit.test.ts \
  src/modules/capture-event/capture-event.service.test.ts \
  src/modules/capture-asset/capture-asset.service.test.ts \
  src/modules/guide/guide.service.test.ts \
  src/modules/interactive-demo/interactive-demo.service.test.ts \
  src/modules/audit/audit-coverage-registry.test.ts \
  src/modules/access/access-coverage-registry.test.ts
rtk pnpm --filter @repo/web test -- \
  src/App.test.tsx \
  src/features/project-version/ProjectVersionRouteBoundary.test.tsx \
  src/features/capture-session/ProjectCaptureSessionListPage.test.tsx \
  src/features/capture-session/CaptureSessionDetailPage.test.tsx
rtk pnpm --filter @repo/extension test -- \
  src/lib/api.test.ts src/lib/settings.test.ts src/lib/url.test.ts \
  src/lib/automatic-capture.test.ts src/popup/helpers.test.ts src/App.test.tsx
```

### Database and concurrency verification

Against a clean synthetic test database:

- migrate/reset/reseed through `021`;
- migration refuses non-empty pre-`021` Capture data and DOWN refuses non-empty
  post-`021` data;
- no Capture Session can be inserted without Version or with a foreign
  Organization/Project Version;
- no Event/Asset can reference a Session/Asset across tenant/project/session;
- create in Default and named active Versions; reject archived Version;
- Default change leaves existing Capture ownership/listing unchanged and remains
  blocked only by legacy Guide/Demo roots;
- successful empty-draft reassignment increments Row Version and writes exactly
  one Audit Event/Change Item;
- start, completed/canceled/archived lifecycle, first Event, first Asset, and
  soft-deleted first source row each prevent reassignment;
- concurrent reassignment versus first Event, first Asset, start, target archive,
  and Default change yields one valid serialization with no deadlock, partial
  row, or ownership drift;
- concurrent Guide/Demo generation versus Default change/Version archive uses
  the same advisory-first order and either commits wholly in the matching
  Default seam or fails with no target rows;
- valid Audit context cannot be used to update/delete a Session, Event, or Asset
  beneath an archived Version;
- runtime role cannot disable triggers, mutate Version directly, bypass Audit,
  update/delete evidence, or truncate protected tables;
- protected read and extension denial Access Evidence uses safe resolved roots.

Run:

```text
rtk pnpm --filter @repo/server test:setup
rtk pnpm --filter @repo/server test:db
rtk pnpm --filter @repo/server test:smoke
```

If PostgreSQL is unavailable, record DB/concurrency/smoke evidence as blocked;
unit mocks are not a substitute and the child cannot be marked complete.

### Full smoke scenario

Use only synthetic names/URLs:

1. bootstrap Owner and create a Project with Main;
2. create named active Project Version `2.0`;
3. create an empty portal draft in Main and reassign it to `2.0`;
4. start or add the first Event/Asset and prove reassignment now fails;
5. create/record/complete an extension Capture directly in `2.0`;
6. change Default and prove both Captures remain in `2.0` and deep links remain
   canonical;
7. list Main and `2.0` independently with no cross-Version rows;
8. prove non-default Guide/Demo generation returns the temporary `409` with no
   partial writes;
9. make `2.0` Default only when legacy Guide/Demo guard permits, then prove
   generation succeeds in the temporary Default seam;
10. archive `2.0`, prove reads work and writes fail; restore it and prove writes
    resume;
11. verify Audit/Access timelines show safe create/reassign/read/denial evidence.

### Broad repository checks

```text
rtk pnpm test
rtk pnpm lint
rtk pnpm build
rtk pnpm exec prettier --check \
  docs/plan/117-capture-source-version-scoping.md \
  docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md
rtk git diff --check
```

Use the repository's actual Prettier invocation if `prettier --check` requires a
different filter. Do not run the write-format command across unrelated files.

## Agent-Browser Validation Requirements

This child changes browser-visible portal and extension behavior, so unit tests
alone are insufficient. Use the repository `dogfood-ossie` procedure and
`agent-browser` with a local synthetic database. Do not use the generic web
browsing tool for local product validation.

### Portal matrix

Validate at desktop (approximately `1440x900`), narrow mobile (approximately
`390x844`), keyboard-only, and 200% zoom/reflow:

- Default and named active Version Capture collections are disjoint;
- manual create submits the route's immutable Version and lands on its canonical
  detail URL;
- empty state, populated state, loading, retryable failure, not-found, Viewer,
  archived Project, and archived Version states;
- empty draft reassignment selector order, focus/labels, pending disabled state,
  success canonical replacement, and stale locked conflict;
- first upload/Event removes or disables reassignment and refresh proves it;
- alias URL canonicalization preserves Capture suffix/query/hash;
- legacy detail resolves to the Capture's owning Version rather than Default;
- changed Default does not move list/detail or stale-tab submission;
- non-default Guide/Demo controls explain the child-`118` boundary and cause no
  request; server-forced request returns `409` with no partial output;
- keyboard focus remains visible, selector/control accessible names are useful,
  no horizontal overflow occurs, and alerts are announced/readable;
- browser console has no uncaught errors and network inspection shows explicit
  Version IDs with no duplicate/failed request loop.

### Extension matrix

If an unpacked extension can be loaded safely, validate:

- Project then Version selection with Main and a named active Version;
- remembered active named Version survives popup reopen and a Default change;
- archived/missing/unauthorized remembered selection blocks Start and never
  changes silently;
- automatic-click and manual screenshot capture store/use exact active Version;
- popup close/reopen restores active Session Version independently of current
  selection/default;
- archive during active capture blocks further writes/finish without switching;
- “Open in portal” and finish open the owning canonical Version URL;
- keyboard operation, focus, compact popup overflow, error/retry copy, console,
  and failed requests.

If real toolbar/unpacked-extension automation remains unavailable, record that
capability as blocked with the exact tool limitation. Do not manufacture
screenshots. Extension component/API/storage/production-build tests still run,
but they do not satisfy or replace the blocked real-toolbar claim.

Store evidence only in the repository's ignored safe evidence location. Never
commit cookies, tokens, local instance secrets, private URLs, raw captured input,
or screenshots containing non-synthetic data.

## Delivery Checklist

### Expansion/recheck

- [x] Predecessor and starting commit confirmed.
- [x] Canonical context, relevant ADRs, master `005`, child `116` closeout, and
      current Capture/Project Version code inspected.
- [x] Direct Project ID ownership decision resolved without duplicating Version
      ownership.
- [x] Exact API, schema, lifecycle, permission, evidence, migration, portal,
      extension, browser, and handoff contracts defined.
- [x] Guide/Demo pre-Edition boundary made explicit and safe.
- [x] No critical unresolved decision remains for implementation.

### Implementation

- [ ] Shared red tests establish explicit ownership contracts.
- [ ] Migration `021` and reset/reseed behavior pass.
- [ ] Composite tenant/project/session constraints pass.
- [ ] Provenance lock and concurrency serialization pass.
- [ ] Capture Session create/list/read/reassign/complete contracts pass.
- [ ] Event/Asset derived Version lifecycle enforcement passes.
- [ ] Audit/Access registry and database evidence guards pass.
- [ ] Portal named/archived Version Capture workflows pass.
- [ ] Extension selection/recovery/active Capture semantics pass.
- [ ] Temporary Guide/Demo generation guard passes with no partial writes.
- [ ] Focused, DB, smoke, broad build/lint/format checks pass.
- [ ] Required browser evidence passes or is honestly recorded blocked where the
      environment cannot provide the capability.
- [ ] This child and master `005` are closed together only after every acceptance
      criterion is satisfied.

## Acceptance Criteria

- Every Capture Session has a non-null Project Version in its exact
  Organization/Project; no runtime-role path can bypass it.
- Portal, API, and extension create flows submit an explicit immutable Version
  ID. The server never infers Default for a write.
- Default and named active Versions can each create/list/read Captures without
  cross-Version leakage.
- Archived Version Captures remain readable and directly linkable while every
  mutation is rejected.
- Empty, unstarted, never-non-empty drafts alone can be reassigned; start or the
  first retained Event/Asset permanently locks provenance under concurrent
  writes.
- Changing Default never moves a Capture or changes its extension/portal deep
  link.
- Extension stale selection and active restoration never silently switch
  Version; automatic and manual capture use the stored active root.
- Original Capture source relationships, privacy redaction, Event ordering,
  Asset/File identity, and protected/public boundaries remain intact.
- Capture reassignment and reads have complete atomic Audit/Access Evidence with
  safe values and correct roots.
- Guide/Demo generation cannot cross Project Version ownership: it succeeds only
  through the temporary current-Default seam and otherwise fails before any
  target write until child `118`.
- Clean database, focused tests, full DB suite, smoke, builds, and required
  browser evidence pass without unrelated regressions.

## Commit And Closeout Strategy

Implementation commits should remain small and attributable, for example:

1. `feat(types): add capture project version contracts`
2. `feat(server): scope captures to project versions`
3. `feat(server): enforce capture provenance locking`
4. `feat(web): add version-scoped capture workflows`
5. `feat(extension): persist capture version context`
6. `docs(plan): close capture source version scoping`

Before each commit, stage only this child's files and inspect
`rtk git diff --cached --stat` plus `rtk git diff --cached`. Do not include
pre-existing or concurrent changes. This recheck request authorizes one
docs-only planning checkpoint commit; it does not authorize runtime
implementation.

## Implementation Log

Planning expansion only on 2026-07-19:

- confirmed clean baseline `812b40a`;
- reconciled the reserved skeleton with shipped migration `020`, current Capture
  contracts/repositories/evidence, portal Project Version boundary, and extension
  storage/deep-link behavior;
- retained Project nesting/direct IDs with composite ownership rather than
  deriving or duplicating scope ambiguously;
- selected explicit create/list IDs, dedicated audited reassignment, derived
  Event/Asset Version scope, and transaction-safe provenance locking;
- resolved the Guide/Demo sequencing edge by blocking non-default generation
  until child `118` can persist Edition ownership;
- no runtime code, schema, UI, test, or parent-plan completion state was changed.

Implementation-readiness recheck on 2026-07-19:

- clarified that archived-Version enforcement covers direct Session, Event, and
  Asset updates/deletes at the database boundary, not only inserts or service
  checks;
- put temporary Guide/Demo generation on the shipped advisory-first lock order
  so it cannot race Default change or Version archive;
- defined extension request-source classification, Version rename/restore
  refresh, and authoritative same-Session recovery from corrupt local snapshots;
- corrected the planning checkpoint authorization for the requested docs-only
  commit;
- found no unresolved critical product/domain decision and made no runtime or
  parent completion change.

## Verification Record

Planning verification only:

- repository instructions and both applicable repository-local skills read;
- `CONTEXT.md`, ADRs `0002`, `0003`, `0012`, `0021`, `0023`, `0024`, `0025`,
  master child-`117` boundary, and child-`116` closeout inspected;
- current Capture Session/Event/Asset types, schema, repositories, services,
  routes, Audit/Access registries, Project Version guards, portal routing/API/UI,
  Guide/Demo generation, extension API/storage/automatic capture/deep links, and
  test manifests inspected;
- recheck compared the complete expanded plan with master `005`, child `116`'s
  shipped commits/closeout, migration `020` lock/default guards, central Project
  authorization, and the explicit Project Activity allowlist; database
  lifecycle, generation concurrency, request-source, and extension recovery
  gaps were corrected in the plan;
- `rtk pnpm exec prettier --check
docs/plan/117-capture-source-version-scoping.md` and
  `rtk git diff --check` passed after the recheck;
- working tree was clean before this plan edit;
- implementation tests, database verification, smoke, builds, and browser
  validation were not run because the user explicitly requested planning only.

## Leftovers And Handoff

Implementation agent:

- begin at the current HEAD/worktree, not the historical planning baseline, and
  repeat the preflight for concurrent changes;
- implement tests first and preserve the lock order exactly; the existing
  audited Capture Session wrapper currently locks the Session before database
  triggers acquire the Project advisory lock and must be corrected to avoid the
  inverse order described above;
- do not remove Guide/Demo legacy Default guards in migration `021`;
- do not infer Default in any server write or from incomplete active extension
  state;
- treat the database/concurrency and real-browser gates as completion gates, not
  optional polish;
- update this file's status, checklist, implementation log, verification record,
  and leftovers plus only completed master `005` items at closeout.

Hand child `118`:

- mandatory `capture_session.project_version_id` and composite tenant scope;
- canonical Capture Version summary/deep links and named/archived portal seams;
- temporary rule that Capture-to-Guide/Demo generation requires Capture Version
  equal current Default;
- remaining Guide/Interactive Demo legacy-root/default-change guards;
- exact requirement to replace that temporary equality rule with Artifact +
  Edition ownership and inherit the source Capture's immutable Project Version;
- Version-scoped Capture Asset picker contract;
- no permission redesign: Edition access continues to inherit Project
  Membership.

Known evidence limitation from child `116` remains possible: real unpacked
extension toolbar automation may be unavailable. It is an evidence limitation,
not permission to weaken extension tests or claim browser validation that did
not occur.
