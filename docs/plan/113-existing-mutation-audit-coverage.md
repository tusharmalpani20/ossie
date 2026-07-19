# Child Plan 113: Existing Mutation Audit Coverage

Date reserved: 2026-07-12

Last reviewed: 2026-07-19

Status: Complete. Implementation and close-previous recheck passed on
2026-07-19.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Goal

Apply the Audit Evidence foundation from child `112` to every current runtime
product mutation. When this child closes, every successful logical state change
made with the runtime database role must create exactly one append-only Audit
Event containing typed Audit Change Items for every affected record, and every
runtime-writable product table/operation must be protected by the database
mutation-context and deferred-evidence guards.

This child covers the alpha model that exists now. It does not introduce Project
Membership, Project Versions, Artifact Editions/Revisions, the accepted future
Publication model, Access Events, Audit query APIs, or activity UI.

## Sequence Gate

Prerequisite:

- Child `112` is complete, including its 2026-07-19 close-previous recheck.
  Migration `015`, `@repo/audit-domain`, the same-client transaction runner,
  typed repository, credential split, append-only controls, operational schema
  verifier, Project-create integration, and representative DB evidence are all
  implemented and green at baseline commit
  `66f4061706237418d17c9042d2c29d617725e170`.

Next child:

- `114` Access Evidence And Compliance Timelines, only after this child proves
  exhaustive current mutation coverage and activates all runtime guards.

## Canonical Decisions To Preserve

- One successfully committed logical state-changing operation creates one Audit
  Event. Multi-row and multi-table commands do not create an event per SQL
  statement.
- The business mutation and its Audit Event/items use one PostgreSQL client and
  commit or roll back together.
- Failed, denied, rolled-back, and true no-op commands create no successful
  Audit Event.
- Audit Change Items are typed scalar or explicit relational record changes.
  They never contain JSON/JSONB, serialized rows, request bodies, content
  payloads, credentials, raw tokens, raw URLs containing secrets, raw typed
  capture values, or storage-private values.
- Evidence is Organization-owned and optionally Project-scoped. Actor and root
  ownership are derived by the server and database, never selected by request
  bodies or untrusted path/query values alone.
- Organization-owned mutations use the authenticated/newly-created Org User as
  actor. Anonymous public viewer-session maintenance uses the `system` actor
  with a fixed safe label; it is not misrepresented as an authenticated User.
- **Row Version** is optimistic-concurrency metadata. Only the Audit Event
  envelope carries the applicable root record's before/after Row Version; it is
  not duplicated as an ordinary field item.
- Runtime credentials may perform only the current command-required table
  operations and append validated evidence. They cannot update/delete/truncate
  evidence, execute DDL, join the maintenance role, or bypass guards.
- Existing soft-delete commands remain soft deletes. Audit uses operation
  `delete` for a live-to-deleted transition without claiming physical erasure.
- Current manual-capture edit/reorder and existing soft-delete route behavior is
  recorded as a current runtime fact without redefining accepted original
  Capture source as mutable. This child does not widen editable fields/source
  types, physically rewrite/delete captured payload or file bytes, weaken
  Capture privacy/source-type gates/raw-input denial, or claim that these alpha
  commands settle the later version-aware Capture model.
- Authentication outcomes, authorization denials, protected reads, public
  views/downloads, and extension access remain Access Events in child `114`.
  Audit Events added here for session-row creation/revocation/activity describe
  the committed session state mutation only; they do not claim to be Access
  Evidence.
- Evidence remains application/database-runtime enforced append-only history,
  not WORM, cryptographically anchored, or compliance-certified storage.

## Preflight And Current Runtime Facts

Planning baseline:

- Starting commit:
  `66f4061706237418d17c9042d2c29d617725e170`.
- The working tree was clean at expansion; no user/agent-owned uncommitted work
  was present.
- `rtk pnpm --filter @repo/audit-domain test`: passed, 5 files/19 tests.
- `rtk pnpm --filter server test`: passed, 55 files/292 tests.
- `rtk pnpm --filter server check-types`: passed.
- Child `112` most recently proved migrations `001` through `015`, 12 DB files/
  54 tests, the DB-backed smoke flow, runtime/maintenance separation, and
  `audit_schema.status = ready` on a disposable `ossie_test` database.

Current implementation facts discovered during expansion:

- The schema has 19 current product tables plus two Audit tables. All 19 product
  tables are inserted by current runtime commands. Fifteen are updated. No
  runtime repository issues physical `DELETE`; runtime has no business-table
  `DELETE` grant.
- Project INSERT/`project.create` is the only converted command and the only
  guarded product operation. The current coverage registry assumes a one-to-one
  command/table-operation mapping, which is insufficient: many commands update
  the same table and several commands write multiple tables.
- Authentication validation updates `auth_session.last_active_at` and
  `updated_at` before every successfully authenticated route. The inherited
  child `112` handoff called this `last_seen_at`; the implemented column and
  command are `last_active_at`/`touch_session`.
- Public password-protected reads update
  `public_publish_viewer_session.last_used_at`. Link revoke/password commands
  can also revoke many viewer sessions.
- First-run setup writes User, Organization, owner Org User, and Auth Session in
  one transaction before returning the session cookie.
- Invite acceptance may create User and Org User rows, always creates an Auth
  Session, and updates the Invite in one transaction. Invite tokens, passwords,
  password hashes, and token hashes must never enter evidence.
- Capture Asset creation writes File and Capture Asset together. Upload writes
  local storage before the DB transaction and already performs best-effort
  storage cleanup when DB persistence fails.
- Guide screenshot upload currently performs Capture Asset/File creation and
  Guide Block selection as two DB transactions. It is one HTTP command and must
  become one audited DB transaction/event; stored-file cleanup must also cover
  Audit/commit failure.
- Guide child commands update one or more Guide Block/Step rows and touch the
  root Guide Row Version. Reorders use temporary index offsets; evidence must
  describe only logical before/final order, never intermediate offset values.
- Interactive Demo scene/hotspot reorder repositories own nested manual
  transactions. Those transactions must move to the shared outer Audit
  transaction so no repository can commit before evidence.
- Publish creates one immutable current `published_artifact` row and inserts or
  repoints one `publish_link`. Link revoke/password commands currently update
  viewer sessions outside the link transaction and must become atomic.
- Current persistent JSON fields include generic `metadata`, Guide Block
  `content`/annotations, and Published Artifact `snapshot_json`. They remain
  current product state until later schema children, but only explicit
  redacted/presence markers may describe them in Audit Evidence.
- There are no current background workers or import-only endpoints. Extension
  mutations use the same authentication/capture routes with
  `x-ossie-client: extension`, and Capture Session `source_type` also identifies
  `manual`, `extension`, or `import` provenance.
- Migrations `001` through `015` contain no data-changing business migration
  needing a historical event. The migration ledger is operational state and is
  not a product mutation table.

## Decisions Selected During Expansion

These choices are reversible, follow child `112` and existing repository
patterns, and do not require a new ADR or grill.

### Coverage Registry Becomes Command-Centric

Replace the one-row-per-table-operation registry contract with:

```ts
type AuditSqlOperation = "INSERT" | "UPDATE" | "DELETE";

type AuditCoveredWrite = {
  table: `${string}.${string}`;
  sql_operation: AuditSqlOperation;
  evidence_operations: readonly ("create" | "update" | "delete")[];
  entity_type: string;
};

type AuditCommandCoverage = {
  command: string;
  action: string;
  routes: readonly string[];
  source_types: readonly AuditSourceType[];
  actor_types: readonly AuditActorType[];
  writes: readonly AuditCoveredWrite[];
};
```

Rules:

- `command` is unique; many commands may share a table/SQL operation.
- One command may declare multiple table/SQL operations and alternative writes.
- `routes` is empty only for shared internal hooks or migration/system entry
  points; a comment/description in the registry must name that entry point.
- Every command has one stable past-tense `action` and at least one write.
- Every command declares the only allowed actor/source combinations. Normal
  authenticated, setup, login, and invite-accept commands require `org_user`;
  public Viewer Session maintenance requires `system` + `system`; future
  registered data migrations require `system` + `migration`.
- Every declared runtime table/operation must have both context and deferred
  guards; every discovered runtime repository write must map to at least one
  command.
- Coverage validation rejects duplicate commands, empty writes, malformed
  identifiers, unsupported source/operation values, and update registrations
  with no allowed evidence operation.

### Request And Actor Context

- Add one server-owned request helper returning `{ request_id, source_type }`.
  `request.id` is the only request identifier. No cookie, bearer token, invite
  token, public slug, password, or request body is used as correlation or
  idempotency data.
- Authenticated actor ID/label come from the resolved Auth Context. Use the
  normalized non-empty display name already returned by authentication; do not
  trust an actor label from the request. Add a server-owned safe-label helper:
  use the display name only when it satisfies child `112`'s 200-character/control
  limits, otherwise use fixed label `organization-member`. The durable actor ID
  remains authoritative, and an unexpectedly long pre-existing display name
  must neither leak nor make an otherwise valid mutation unauditable.
- HTTP defaults to source `web`. The existing extension header may select
  `extension` only as descriptive source context and never changes permission.
  Capture commands prefer the validated Capture Session/input source:
  `extension` and `import` remain distinguishable from manual web capture.
- Existing routes have no idempotency-key contract. Keep
  `idempotency_key_hash`, `correlation_id`, and `reason` null rather than
  inventing public header semantics.
- First-run setup and invite acceptance build the actor from the owner/Org User
  created or resolved in the same transaction. Public viewer-session mutations
  use actor type `system`, null Org User ID, and fixed label
  `public-viewer-session`.
- Pass the selected `AuditCommandCoverage` entry into the transaction runner;
  do not pass unrelated raw `command`/`action` strings independently. The runner
  derives and validates the action plus allowed actor/source policy before
  acquiring a client. This makes a newly added command a compile/test-visible
  registry change even when it writes a table/operation already used elsewhere.

Actor/source ownership is explicit:

- setup and public Invite acceptance: resulting/resolved Org User + `web`;
- authenticated Organization, Project, Guide, Interactive Demo, and Publish
  commands: resolved Org User + `web`, `api`, or `extension` according to the
  already-supported cookie/bearer/extension request transport; source never
  changes authorization;
- Auth Session create/touch/revoke: resolved Org User + `web`, `api`, or
  `extension`; login may derive the actor only after credentials validate;
- Capture Session/Event/Asset commands: resolved Org User; persisted/validated
  Capture Session provenance overrides transport so `extension` and `import`
  are not mislabeled as web/API work;
- Public Viewer Session create/touch: system actor + `system` source;
- future registered data migrations: system actor + `migration` source.

No current command uses source `system` outside public Viewer Session state or
source `migration` outside the future data-migration contract. An unrecognized
transport falls back to `web`; it must not accept an arbitrary source string from
headers or bodies.

### Transaction Ownership And True No-Ops

- Extend `run_audited_mutation` so `build_event` may return `null`. A null event
  is valid only when `execute` made no guarded write; a write followed by null
  evidence is rejected by the deferred DB guard at commit.
- Export client-bound repository builders. Repository methods must not issue
  `BEGIN`, `COMMIT`, or `ROLLBACK` when used by an audited command.
- Read and lock the affected current rows with tenant filters (`FOR UPDATE`) when
  before-values or order are required. Build evidence from persisted before and
  returned after rows, not the request body.
- A same-value scalar update and an already-equal reorder are true no-ops: return
  the existing public response, do not increment Row Version/`updated_at`, and
  do not write evidence.
- Retry loops, including publish-slug retry, use a fresh event ID/transaction per
  attempt. Failed attempts leave neither business rows nor evidence.
- Multi-row reorder evidence contains one `index` item per row whose logical
  position changed. Temporary offset writes are never represented.
- The current HTTP save/batch request is the logical autosave boundary: one
  committed PATCH/PUT produces at most one mutation event regardless of SQL row
  count. This backend child does not add keystroke events or client-side save
  collapsing.
- When only a root Row Version/audit timestamp changes because child rows
  changed, the root guard may be satisfied by matching event root identity and
  exact `OLD.version`/`NEW.version` envelope values; Row Version does not become
  a scalar item. Tables without a Row Version and non-root child rows always need
  a matching item.
- Add a dedicated `create_redacted_change` helper for a known changed sensitive
  field. It may produce `redacted -> redacted` only for Audit operation `update`
  after the adapter established from persisted values that a real change
  occurred. Keep the generic scalar builder's equal-state rejection. This is
  required for changed JSON/content/password-hash fields without retaining
  their values and must never be used as a no-op escape hatch.
- Compare JSONB/content fields with PostgreSQL `IS DISTINCT FROM` (or equivalent
  persisted-value comparison), not request-object serialization order, before
  creating a redacted update item.
- External file storage cannot join the PostgreSQL transaction. Keep upload
  bytes staged before DB work, wrap the entire audited DB operation, and call
  `delete_best_effort` after any business/evidence/commit failure. Never delete
  a successfully committed file because response serialization later fails.

### Database Guard Rollout

- Add migration `016_existing_mutation_audit_coverage.sql`; never edit or rename
  migrations `001` through `015`.
- Replace the Project-only guard functions/triggers through migration `016`
  with generalized context and deferred-evidence functions while preserving the
  child `112` maintenance-bypass rule.
- Install a deterministic BEFORE context trigger and DEFERRABLE INITIALLY
  DEFERRED AFTER evidence trigger for every runtime-writable table/operation.
  Trigger names use compact deterministic table/operation names and must remain
  below PostgreSQL's 63-byte identifier limit.
- At expansion the required SQL operation set is 19 INSERT operations and 15
  UPDATE operations. There are no runtime DELETE operations. The source of truth
  is the command registry plus catalog/source-scanning tests, not a hand-maintained
  count alone.
- Context guards require event ID, Organization, action, and command, and reject
  a command not allowlisted for the affected table/operation.
- Deferred guards require the same-Organization committed event and matching
  affected entity. INSERT requires `create`; a false-to-true `is_deleted`
  transition requires `delete`; other UPDATEs require `update`. A root-only Row
  Version touch may use the event envelope rule above.
- Deferred guards also require the event action, actor type, and source type
  allowed by the selected command. Normal commands cannot be satisfied by a
  forged system actor, and public Viewer Session commands cannot claim an Org
  User actor.
- Tenant verification uses the row's `organization_id` where present;
  Organization INSERT uses `NEW.id`; User INSERT uses the transaction context;
  public viewer sessions resolve Organization/Project through Publish Link.
- Keep the runtime business grants in migration `015` unless catalog/source
  evidence proves an operation is missing. Do not add physical DELETE or broad
  table-wide grants.
- Revoke generalized guard-function execution from PUBLIC and grant only the
  exact required function execution to the runtime role. Preserve the
  maintenance schema ownership and bypass checks from child `112`.
- Extend `verify_audit_schema` to compare registry-derived table operations,
  expected trigger functions/triggers, runtime grants, role separation, Audit
  privileges, and no-JSON evidence against PostgreSQL catalogs. Trigger checks
  must verify the attached schema/table, operation, timing, row level,
  constraint/deferred mode, function identity, and command/action arguments—not
  merely the existence of a trigger name. `migrate:up` and `migrate:status` must
  fail if coverage is incomplete.
- Migration DOWN removes generalized child `113` triggers/functions and restores
  child `112`'s Project INSERT guards. It never deletes Audit rows.
- Normal migrations execute with maintenance credentials but without
  `ossie.maintenance_mode = 'on'`. Explicitly set maintenance mode off in the
  migrator. A future data-changing business migration must set Audit context,
  use source `migration`, insert typed evidence in the same migration
  transaction, and register its command. The bypass remains limited to explicit
  reset/synthetic fixture tooling.
- Give generalized Audit guards one identifiable database error contract (for
  example SQLSTATE `23514` plus an `ossie_audit_guard_*` constraint identifier).
  The transaction adapter maps only that contract to `audit_guard_failed`.
  Unrelated deferred FK/unique/check failures at COMMIT must retain their
  existing domain/conflict mapping rather than being mislabeled as Audit guard
  failures.

## Exhaustive Current Command Contract

The implementation registry must contain the following commands. `UPDATE`
soft-delete writes emit Audit operation `delete`; optional writes occur only when
the command actually changed that row.

| Command / action                                                                                   | Current route or entry point                                                                                                           | Required product writes                                                                                |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `setup.complete_first_run` / `setup.owner_bootstrapped`                                            | `POST /api/v1/setup/first-run`                                                                                                         | INSERT User, Organization, Org User, Auth Session                                                      |
| `authentication.session.create` / `authentication.session.created`                                 | `POST /api/v1/authentication/login`                                                                                                    | INSERT Auth Session                                                                                    |
| `authentication.session.touch` / `authentication.session.activity_recorded`                        | shared successful authentication validation for protected routes                                                                       | UPDATE Auth Session                                                                                    |
| `authentication.session.revoke` / `authentication.session.revoked`                                 | `POST /api/v1/authentication/logout`                                                                                                   | UPDATE Auth Session when active                                                                        |
| `organization.invite.create` / `organization.invite.created`                                       | `POST /api/v1/organization/invites`                                                                                                    | INSERT Org Invite                                                                                      |
| `organization.invite.revoke` / `organization.invite.revoked`                                       | `DELETE /api/v1/organization/invites/:invite_id`                                                                                       | UPDATE Org Invite                                                                                      |
| `organization.invite.accept` / `organization.invite.accepted`                                      | `POST /api/v1/public/invites/:token/accept`                                                                                            | optional INSERT User, optional INSERT Org User, INSERT Auth Session, UPDATE Org Invite                 |
| `project.create` / `project.created`                                                               | `POST /api/v1/projects`                                                                                                                | INSERT Project                                                                                         |
| `project.update` / `project.updated`                                                               | `PATCH /api/v1/projects/:id`                                                                                                           | UPDATE Project                                                                                         |
| `project.delete` / `project.deleted`                                                               | `DELETE /api/v1/projects/:id`                                                                                                          | UPDATE Project as soft delete                                                                          |
| `capture_session.create` / `capture_session.created`                                               | `POST /api/v1/projects/:project_id/capture-sessions`                                                                                   | INSERT Capture Session                                                                                 |
| `capture_session.update` / `capture_session.updated`                                               | `PATCH /api/v1/projects/:project_id/capture-sessions/:id`                                                                              | UPDATE Capture Session                                                                                 |
| `capture_session.complete` / `capture_session.completed`                                           | `POST /api/v1/projects/:project_id/capture-sessions/:id/complete`                                                                      | UPDATE Capture Session                                                                                 |
| `capture_session.delete` / `capture_session.deleted`                                               | `DELETE /api/v1/projects/:project_id/capture-sessions/:id`                                                                             | UPDATE Capture Session as soft delete                                                                  |
| `capture_asset.create` / `capture_asset.created`                                                   | `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets`                                                        | INSERT File and Capture Asset                                                                          |
| `capture_asset.upload` / `capture_asset.uploaded`                                                  | `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload`                                                 | INSERT File and Capture Asset                                                                          |
| `capture_asset.delete` / `capture_asset.deleted`                                                   | `DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id`                                                  | UPDATE Capture Asset and File as soft deletes                                                          |
| `capture_event.create` / `capture_event.created`                                                   | `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events`                                                        | INSERT Capture Event                                                                                   |
| `capture_event.update` / `capture_event.updated`                                                   | `PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id`                                                   | UPDATE Capture Event                                                                                   |
| `capture_event.reorder` / `capture_event.reordered`                                                | `PUT /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order`                                                   | UPDATE changed Capture Events                                                                          |
| `capture_event.delete` / `capture_event.deleted`                                                   | `DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id`                                                  | UPDATE Capture Event as soft delete                                                                    |
| `guide.create_from_capture` / `guide.created`                                                      | `POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id`                                                    | INSERT Guide, Guide Blocks, and applicable Guide Steps                                                 |
| `guide.update` / `guide.updated`                                                                   | `PATCH /api/v1/projects/:project_id/guides/:guide_id`                                                                                  | UPDATE Guide                                                                                           |
| `guide.step.update` / `guide.step.updated`                                                         | `PATCH /api/v1/projects/:project_id/guides/:guide_id/steps/:guide_step_id`                                                             | UPDATE Guide Step and touch Guide root                                                                 |
| `guide.blocks.reorder` / `guide.blocks.reordered`                                                  | `PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder`                                                                   | UPDATE changed Guide Blocks and touch Guide root                                                       |
| `guide.block.create` / `guide.block.created`                                                       | `POST /api/v1/projects/:project_id/guides/:guide_id/blocks`                                                                            | optional UPDATE shifted Guide Blocks, INSERT Guide Block, optional INSERT Guide Step, touch Guide root |
| `guide.block.update` / `guide.block.updated`                                                       | `PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id`                                                           | UPDATE Guide Block and applicable Guide Step, touch Guide root                                         |
| `guide.block.screenshot.update` / `guide.block.screenshot_updated`                                 | `PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot`                                                | UPDATE Guide Block and touch Guide root                                                                |
| `guide.block.annotations.update` / `guide.block.annotations_updated`                               | `PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations`                                               | UPDATE Guide Block and touch Guide root                                                                |
| `guide.block.screenshot_upload` / `guide.block.screenshot_uploaded`                                | `POST /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload`                                          | INSERT File, INSERT Capture Asset, UPDATE Guide Block, touch Guide root in one DB transaction          |
| `guide.block.delete` / `guide.block.deleted`                                                       | `DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id`                                                          | UPDATE Guide Block/Step as soft deletes, UPDATE reindexed Guide Blocks, touch Guide root               |
| `interactive_demo.create_from_capture` / `interactive_demo.created`                                | `POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos`                                             | INSERT Interactive Demo and generated Demo Scenes                                                      |
| `interactive_demo.create` / `interactive_demo.created`                                             | `POST /api/v1/projects/:project_id/interactive-demos`                                                                                  | INSERT Interactive Demo                                                                                |
| `interactive_demo.update` / `interactive_demo.updated`                                             | `PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id`                                                            | UPDATE Interactive Demo                                                                                |
| `interactive_demo.delete` / `interactive_demo.deleted`                                             | `DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id`                                                           | UPDATE Interactive Demo as soft delete                                                                 |
| `interactive_demo.scene.create` / `interactive_demo.scene.created`                                 | `POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes`                                                      | INSERT Demo Scene                                                                                      |
| `interactive_demo.scene.update` / `interactive_demo.scene.updated`                                 | `PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id`                                           | UPDATE Demo Scene                                                                                      |
| `interactive_demo.scenes.reorder` / `interactive_demo.scenes.reordered`                            | `PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/order`                                                 | UPDATE changed Demo Scenes                                                                             |
| `interactive_demo.scene.delete` / `interactive_demo.scene.deleted`                                 | `DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id`                                          | UPDATE Demo Scene as soft delete                                                                       |
| `interactive_demo.hotspot.create` / `interactive_demo.hotspot.created`                             | `POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots`                                   | INSERT Demo Hotspot                                                                                    |
| `interactive_demo.hotspot.update` / `interactive_demo.hotspot.updated`                             | `PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id`                      | UPDATE Demo Hotspot                                                                                    |
| `interactive_demo.hotspots.reorder` / `interactive_demo.hotspots.reordered`                        | `PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order`                              | UPDATE changed Demo Hotspots                                                                           |
| `interactive_demo.hotspot.delete` / `interactive_demo.hotspot.deleted`                             | `DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id`                     | UPDATE Demo Hotspot as soft delete                                                                     |
| `publish.guide` / `guide.published`                                                                | `POST /api/v1/projects/:project_id/guides/:guide_id/publish`                                                                           | INSERT Published Artifact; INSERT or UPDATE Publish Link                                               |
| `publish.interactive_demo` / `interactive_demo.published`                                          | `POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish`                                                     | INSERT Published Artifact; INSERT or UPDATE Publish Link                                               |
| `publish.guide_link.revoke` / `guide.publish_link.revoked`                                         | `DELETE /api/v1/projects/:project_id/guides/:guide_id/publish`                                                                         | UPDATE Publish Link and active Viewer Sessions atomically                                              |
| `publish.interactive_demo_link.revoke` / `interactive_demo.publish_link.revoked`                   | `DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish`                                                   | UPDATE Publish Link and active Viewer Sessions atomically                                              |
| `publish.guide_link.access_update` / `guide.publish_link.access_updated`                           | `PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/access`                                                                   | UPDATE Publish Link                                                                                    |
| `publish.interactive_demo_link.access_update` / `interactive_demo.publish_link.access_updated`     | `PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access`                                             | UPDATE Publish Link                                                                                    |
| `publish.guide_link.password_update` / `guide.publish_link.password_updated`                       | `PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/password`                                                                 | UPDATE Publish Link and active Viewer Sessions atomically                                              |
| `publish.interactive_demo_link.password_update` / `interactive_demo.publish_link.password_updated` | `PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password`                                           | UPDATE Publish Link and active Viewer Sessions atomically                                              |
| `publish.viewer_session.create` / `publish.viewer_session.created`                                 | `POST /api/v1/public/publish-links/:slug/viewer-sessions` when password protection creates a session                                   | INSERT Public Publish Viewer Session                                                                   |
| `publish.viewer_session.touch` / `publish.viewer_session.activity_recorded`                        | password-protected `GET /api/v1/public/publish-links/:slug` and `GET /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file` | UPDATE Public Publish Viewer Session                                                                   |

Read-only routes remain out of the command registry except where successful
authentication/public-session validation performs one of the two explicit
session activity mutations above.

## Evidence Shape And Field Policy

### Event Roots And Parents

- Setup root: Organization; Project scope null.
- Authentication root: Auth Session; Project scope null.
- Invite root: Org Invite; Project scope null.
- Project root: Project; Project scope is that Project.
- Capture Session operations root at Capture Session. Capture Event/Asset/File
  operations also root at Capture Session and parent child items through Capture
  Session/Capture Asset as applicable.
- Guide operations root at Guide. Block/Step/File/Capture Asset items use explicit
  parent identities.
- Interactive Demo operations root at Interactive Demo. Scene and Hotspot items
  identify their immediate parent.
- Publishing roots at the Guide or Interactive Demo being published/configured;
  Public Viewer Session maintenance roots at Publish Link with `system` actor.

Immediate parent identities are fixed as follows:

- Org User, Org Invite -> Organization; Auth Session -> Org User;
- Capture Event and Capture Asset -> Capture Session; File -> Capture Asset;
- Guide Block -> Guide; Guide Step -> Guide Block;
- Demo Scene -> Interactive Demo; Demo Hotspot -> Demo Scene;
- current Published Artifact and Publish Link -> the current Guide or Interactive
  Demo root identified by `artifact_type`/`artifact_id`;
- Public Publish Viewer Session -> Publish Link.

User has no false Organization parent because the current User identity may join
multiple Organizations. Its event remains attributed to the setup/invite target
Organization, but the item itself has no invented ownership relationship.

### Required Item Rules

- INSERT: one row-create item plus safe scalar or explicit redacted-state items
  for every persisted business field whose state is part of the command result.
  Password/token/content fields may expose only the field name and redacted
  state, never their value. Technical timestamps and actor bookkeeping remain
  excluded as defined below.
- UPDATE: items only for logically changed fields/relationships. Soft deletion
  includes a row-delete item and does not serialize deletion bookkeeping.
- Child create/delete: one row item per child plus field items for safe changed
  fields. Child field updates use `create_scalar_change` with explicit parent
  identity; never serialize the child record.
- Batch reorder: one integer `index` update item for each changed child. Indexes
  are one-based persisted values.
- Root Row Version uses the event envelope. `created_at`, `updated_at`, actor
  bookkeeping IDs, `deleted_at`, and raw `version` columns are not ordinary
  field items.
- An event must contain every row needed by the deferred guard. It may contain
  additional approved field items, but must not use a generic catch-all item.
- A changed sensitive field uses the dedicated redacted-change helper. A
  redacted-to-redacted item means “the persisted sensitive value changed,” not
  “the before and after values were equal”; adapters must prove that distinction
  before constructing the item.

### Scalar And Redacted Allowlist

- Safe scalar categories include stable IDs/relationships, names/titles,
  descriptions already treated as safe by child `112`, enums/statuses, booleans,
  order indexes, dimensions/coordinates, sizes, MIME type, dates/timestamps, and
  public-link expiry/visibility state.
- Always redacted/presence-only: every `metadata` JSON value, Guide Block
  `content`/annotations, Guide Step body, Demo Hotspot content, Published
  Artifact `snapshot_json`, Capture page/start URLs, target selector/text/note,
  user agent/environment details, original file name, storage key, checksum, IP
  address, and any future field explicitly classified as content or private
  context.
- Never retain values for passwords, password hashes/salts,
  session/invite/viewer tokens or hashes, cookies, authorization headers,
  request bodies, uploaded bytes, raw typed values, or private filesystem paths.
  A persisted secret/hash field may have an explicitly allowlisted redacted
  state item so the affected field is explainable. Password configuration is
  additionally expressed as a boolean `password_protected` transition.
- Update the sensitive-field policy so an explicitly redacted allowlist may use
  the real field name, while forbidden names can never be classified as scalar
  and a redacted state can never carry a typed value.
- Values exceeding child `112` limits fail and roll back the mutation; do not
  truncate evidence.

## Authorization, Tenant, And Security Rules

- Preserve every current route/service authorization rule and response. Invite
  management remains Owner-only. Other current commands remain scoped by the
  authenticated Organization/Project checks already implemented; this child
  does not invent Project roles before child `115`.
- Audit is not an authorization substitute. Authorization and scope checks occur
  before guarded writes. The transaction repeats/locks ownership checks where
  needed to prevent time-of-check/time-of-use scope changes.
- Organization ID, Project ID, actor ID, actor label, event ID, action, command,
  and source are internal inputs. Request bodies cannot override them.
- Org User actor FK and optional Project FK must match the event Organization.
  User INSERT during setup/invite is attributed to the target Organization event
  without adding false Organization ownership to the User table.
- Public viewer-session evidence obtains Organization/Project/Publish Link from
  a tenant-scoped DB join. Public slug and viewer token are never evidence.
- A failed audited Auth Session activity touch stops the protected route before
  its handler runs. A failed Public Viewer Session touch stops the protected
  public response/file before content is returned. These are mutation atomicity
  requirements here; child `114` separately adds Access Event-before-return
  guarantees.
- Maintenance bypass still requires both the configured maintenance login and
  transaction-local maintenance mode. Runtime attempts to set the GUC continue
  to fail the ownership/login check.
- Guard/audit errors remain stable internal server errors with no raw SQL,
  rejected values, tokens, content, or credentials in logs. Log only stable
  code, command/action, request ID, and safe entity identifiers already allowed
  by child `112`.
- Ordinary Project/content/session/link deletion or revocation never deletes
  Audit Events/Change Items. Restrictive evidence FKs continue to block
  Organization/Project/actor cascades that would erase evidence.

## API And Backwards-Compatibility Contract

- Keep all route methods/paths, request Zod schemas, status codes, response
  bodies, cookies, extension session-token behavior, and public reader/embed
  behavior unchanged.
- Audit request/actor metadata is server-internal and must not appear in
  `@repo/types`, OpenAPI responses, portal/extension DTOs, or public payloads.
- Same-value updates/reorders become true no-ops internally but return the same
  successful response shape. This is the only intentional observable timing/Row
  Version difference required by the accepted no-op contract.
- No dual-write or mixed guarded/unguarded runtime mode is supported. Use a
  maintenance window: stop old API writers, run migration `016`, deploy/start the
  converted server, and require readiness/catalog verification before reopening
  writes. A rolling fleet containing pre-`113` and post-`113` writers is unsafe
  because migration `016` intentionally rejects the old unconverted commands.
- Rollback order is also explicit: stop new writers, run migration `016` DOWN to
  restore child `112` Project-only guards, deploy the prior server, then reopen
  traffic. DOWN retains all existing Audit evidence.
- There is no historical backfill. Existing pre-live/dev rows remain without
  fabricated pre-coverage events. Comprehensive coverage begins when migration
  `016` is active.
- A clean reset is not required solely for `016`; it adds guards/functions and
  does not reshape current product rows. Disposable test setup still runs all
  migrations from empty state.
- No Audit query/list/detail/export API is added, so no new shared Audit DTO or
  client compatibility layer is required.

## Exact Affected Files

### Audit Domain And Shared Contracts

- `packages/audit-domain/src/coverage/audit-coverage.ts`
- `packages/audit-domain/src/coverage/audit-coverage.test.ts`
- `packages/audit-domain/src/policies/audit-sensitive-field-policy.ts`
- `packages/audit-domain/src/policies/audit-sensitive-field-policy.test.ts`
- `packages/audit-domain/src/policies/audit-value-policy.ts`
- `packages/audit-domain/src/policies/audit-value-policy.test.ts`
- `packages/audit-domain/src/index.ts` only if a new exported helper/type is
  introduced by the files above.

Do not change `@repo/types` or public constants unless implementation discovers
an unavoidable public-contract defect and the plan is rechecked first.

### Server Audit, Database, And Composition

- `apps/server/src/modules/audit/audit-context.ts`
- `apps/server/src/modules/audit/audit-context.test.ts`
- `apps/server/src/modules/audit/audit-transaction.ts`
- `apps/server/src/modules/audit/audit-transaction.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-request-context.ts` (new)
- `apps/server/src/modules/audit/audit-request-context.test.ts` (new)
- `apps/server/src/modules/audit/audit-source-coverage.test.ts` (new; scans all
  production server TypeScript SQL writes and compares them with the registry,
  with explicit exclusions only for the Audit writer, migration ledger/admin
  tooling, and maintenance test support)
- `apps/server/src/modules/audit/audit.db.integration.test.ts`
- `apps/server/src/db/migrations/016_existing_mutation_audit_coverage.sql` (new)
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/db/migrator.ts`
- `apps/server/src/db/migrator.test.ts`
- `apps/server/src/test-support/database.ts` (add migration `016` objects/tables
  only if reset/catalog fixtures require an explicit update)
- `apps/server/src/app.ts`

### Per-Domain Audit Adapters And Runtime Commands

Add one `<module>.audit.ts` and `<module>.audit.test.ts` beside each current
mutation owner, then modify its existing route/service/repository and focused
tests:

- `apps/server/src/modules/setup/first-run-setup.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/setup/first-run-setup.{audit,service,routes}.test.ts`
- `apps/server/src/modules/setup/first-run-setup.{app,db}.integration.test.ts`
- `apps/server/src/modules/authentication/session.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/authentication/session.{audit,service,routes}.test.ts`
- `apps/server/src/modules/authentication/session.{app,db}.integration.test.ts`
- `apps/server/src/modules/organization/organization-invites.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/organization/organization-invites.{audit,service,routes}.test.ts`
- `apps/server/src/modules/organization/organization-invites.db.integration.test.ts`
- `apps/server/src/modules/project/project.audit.ts`
- `apps/server/src/modules/project/project.audit.test.ts`
- `apps/server/src/modules/project/project.repository.ts`
- `apps/server/src/modules/project/project.service.ts`
- `apps/server/src/modules/project/project.service.test.ts`
- `apps/server/src/modules/project/project.routes.ts`
- `apps/server/src/modules/project/project.routes.test.ts`
- `apps/server/src/modules/project/project.{app,db}.integration.test.ts`
- `apps/server/src/modules/capture-session/capture-session.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/capture-session/capture-session.{audit,service,routes}.test.ts`
- `apps/server/src/modules/capture-session/capture-session.{app,db}.integration.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/capture-asset/capture-asset.{audit,service,routes}.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.{app,db}.integration.test.ts`
- `apps/server/src/modules/capture-event/capture-event.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/capture-event/capture-event.{audit,service,routes}.test.ts`
- `apps/server/src/modules/capture-event/capture-event.{app,db}.integration.test.ts`
- `apps/server/src/modules/guide/guide.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/guide/guide.{audit,service,routes}.test.ts`
- `apps/server/src/modules/guide/guide.{app,db}.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.{audit,service,routes}.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.{app,db}.integration.test.ts`
- `apps/server/src/modules/publish/publish.{audit,repository,service,routes}.ts`
- `apps/server/src/modules/publish/publish.{audit,service,routes}.test.ts`
- `apps/server/src/modules/publish/publish.{app,db}.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

Brace notation above names exact sibling files; each new `.audit.ts` and
`.audit.test.ts` is required, while existing files retain their current names.

### Operator And Status Documentation

- `docs/backend-route-inventory.md`
- `docs/operations.md`
- `docs/self-hosting.md`
- `docs/production-readiness-checklist.md`
- `docs/project-zoomout-status.md`
- `docs/roadmap.md`
- `docs/plan/113-existing-mutation-audit-coverage.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Update the parent only during closeout for genuinely completed child items.

## Explicit Non-Scope And Files Not To Touch

- No Audit/Access query API, timeline, export, deletion, retention, search, or UI.
- No Access Event table/writer/guard; child `114` owns reads, auth outcomes,
  denials, public views/downloads, compliance queries, and authorized timelines.
- No Project Membership/role redesign (`115`) or Project Version schema/routes
  (`116` onward).
- No Artifact Edition, Working Draft, Revision, Carry-Forward, relational
  publication replacement, or JSON cleanup (`118` through `120`).
- No change to current Capture route semantics, source immutability policy,
  protected-asset purge rules, published snapshot immutability, or public-link
  access rules beyond transactionally auditing their existing mutations.
- No new public API route, request field, response field, status code, cookie,
  header contract, or OpenAPI Audit schema.
- No portal/extension/docs-app component, style, navigation, or design change.
  In particular, do not modify `apps/web/**`, `apps/extension/**`,
  `apps/docs/**`, or `packages/ui/**` for this child.
- No major dependency, queue, outbox, event bus, ORM, audit SaaS, WORM store,
  cryptographic chain, or overnight-runner tooling.
- Do not rewrite migrations `001` through `015`, migration history, existing ADRs,
  or `CONTEXT.md` unless implementation uncovers a genuine accepted-language
  contradiction requiring a separate decision.
- Do not physically delete product rows/files or add runtime DELETE grants.

## TDD Implementation Order

### Phase 1: Coverage Model And Shared Transaction Contract

1. Add failing audit-domain coverage tests for command uniqueness, repeated
   table/operation use, multi-table commands, malformed routes/actions, empty
   writes, actor/source combinations, and evidence-operation validation.
2. Add failing redaction-policy tests proving explicitly redacted content names
   are allowed only as redacted states and forbidden scalar secrets remain
   rejected.
3. Add failing value-policy tests for the dedicated changed-sensitive-field
   builder: update redacted-to-redacted succeeds only through that builder,
   create/delete transitions remain valid, and generic equal scalar states still
   fail.
4. Add failing transaction tests for registry-entry-derived command/action,
   actor/source policy, null-event true no-op, guarded-write/null commit failure,
   stable rollback errors, unrelated deferred constraint classification, and
   retries using independent IDs.
5. Implement the command-centric registry contract, request-context helper, and
   no-op-capable transaction runner.
6. Populate the complete registry before adding new DB guards; keep the registry
   test readable enough to review command/action/route/write ownership.

### Phase 2: Migration, Guards, And Automated Completeness

1. Add failing static/catalog tests for all runtime-writable tables/operations,
   generalized trigger pairs, allowed-command enforcement, migration-mode off,
   no runtime DELETE, and DOWN restoration of child `112` Project guards.
2. Add failing source-coverage tests that scan all production server TypeScript,
   not only `*.repository.ts`, and report an unregistered product table/operation
   with file/line context. Explicitly assert the small operational exclusion list
   so a new raw write cannot hide in a service/helper.
3. Add route/entry-point coverage tests proving every state-changing Fastify
   route and the two shared session-activity hooks select a registered command.
   The transaction runner accepts a registry entry/typed command name, so a new
   semantic command cannot silently reuse arbitrary raw action strings.
4. Implement migration `016`, generalized functions/triggers, and registry-aware
   operational verification.
5. On a fresh disposable DB, prove a direct unaudited write to every registered
   operation class fails and a wrong command/action/Organization cannot satisfy
   a guard.
6. Do not activate the complete migration against a non-converted server during
   development except inside tests that immediately exercise converted paths.

### Phase 3: Setup, Authentication, And Organization Commands

1. Convert first-run setup as one event covering User, Organization, owner Org
   User, and Auth Session; prove newly created actor/tenant FKs validate at
   deferred commit.
2. Convert login/session creation, successful authentication activity touch, and
   logout/revocation. Missing/invalid/already-revoked logout is a no-op with no
   event. Resolve/lock the active Auth Context and update `last_active_at` on the
   same client used for that touch event; do not authenticate on one connection
   and perform the guarded touch on another. No token/password/IP/user-agent
   value enters evidence.
3. Convert Invite create, revoke, and accept. Acceptance is one event across all
   optional/required rows and returns the unchanged session cookie/response.
4. Prove Owner authorization and public invite validation still precede writes,
   and cross-tenant invite/actor combinations roll back.

### Phase 4: Project And Capture Commands

1. Preserve Project create evidence while converting Project update and soft
   delete; add same-value no-op and before/after Row Version tests.
2. Convert Capture Session create/update/complete/soft delete with dynamic
   manual/extension/import source and redacted environment fields.
3. Convert Capture Asset create/upload/soft delete as multi-table events. Prove
   File/Capture Asset rollback and stored-file cleanup on Audit failure.
4. Convert Capture Event create/update/reorder/soft delete. Preserve raw-input
   denial, manual-only edit/reorder rules, tenant scope, and privacy redaction.
5. Add extension-header/source DB smoke evidence without changing extension
   client code.

### Phase 5: Guide And Interactive Demo Commands

1. Refactor client-bound repositories so nested repository transactions cannot
   commit independently of the Audit runner.
2. Convert Guide generation, root update, Step update, reorder, Block
   create/update/screenshot/annotations/delete, and screenshot upload.
3. Make screenshot upload one DB transaction/event across File, Capture Asset,
   Guide Block, and Guide root; retain best-effort stored-file compensation.
4. Convert Interactive Demo create/from-capture/root, Scene, and Hotspot
   commands, including logical final-order evidence for reorders.
5. Prove child parent identity, root Row Version handling, generated multi-row
   counts, no-op order behavior, redacted content, and rollback across every
   affected row.

### Phase 6: Publish And Public Viewer Session Commands

1. Convert Guide/Demo publish with one event for Published Artifact plus
   inserted/repointed Publish Link. Record `snapshot_json` only as redacted;
   preserve immutable snapshot bytes and current response terminology.
2. Convert link revoke/access/password commands. Link and Viewer Session
   revocations must share one transaction/event.
3. Convert public Viewer Session create/touch using system actor and tenant scope
   resolved through Publish Link. Never store slug, password, viewer token, or
   token hash in evidence.
4. Prove publish slug retry rollback, immutable Published Artifact behavior,
   password boolean evidence, public access behavior, and exact event/item
   counts.

### Phase 7: Exhaustive Guard Activation And Operations

1. Run the source scanner, command registry validation, DB catalog verifier, and
   every module DB suite. No runtime-writable product operation may remain
   unregistered or unguarded.
2. Prove maintenance-only synthetic fixture/reset paths remain usable, while
   normal migration/runtime sessions cannot inherit bypass.
3. Update route/operations/self-hosting/readiness/current-status docs to state
   comprehensive mutation coverage truthfully while keeping Access/query/UI
   work pending.
4. Run broad regression, DB smoke, and browser/extension-source validation.
5. Close this child and update Master `005` only after all acceptance items pass.

## Focused Verification Plan

Run focused unit tests throughout red-green implementation, then at minimum:

```bash
rtk pnpm --filter @repo/audit-domain test
rtk pnpm --filter @repo/audit-domain check-types
rtk pnpm --filter @repo/audit-domain lint
rtk pnpm --filter @repo/audit-domain build
rtk pnpm --filter server test -- src/modules/audit
rtk pnpm --filter server test -- src/modules/setup
rtk pnpm --filter server test -- src/modules/authentication
rtk pnpm --filter server test -- src/modules/organization
rtk pnpm --filter server test -- src/modules/project
rtk pnpm --filter server test -- src/modules/capture-session
rtk pnpm --filter server test -- src/modules/capture-asset
rtk pnpm --filter server test -- src/modules/capture-event
rtk pnpm --filter server test -- src/modules/guide
rtk pnpm --filter server test -- src/modules/interactive-demo
rtk pnpm --filter server test -- src/modules/publish
rtk pnpm --filter server check-types
```

Database verification uses only the explicitly validated disposable test DB:

```bash
rtk pnpm --filter server test:db:drop
rtk pnpm --filter server test:setup
rtk pnpm --filter server migrate:status
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

Required DB evidence:

- fresh migrations `001` through `016` and `audit_schema.status = ready`;
- exact registry/catalog/source-scan agreement for every current command and
  runtime-writable table/operation;
- the expected context/deferred trigger pair on every registered operation;
- runtime has required SELECT/INSERT/UPDATE only and no business DELETE;
- direct unaudited, wrong-command, wrong-action, wrong-Organization, missing-item,
  partial-batch, and forged system-actor writes roll back;
- maintenance-mode spoofing fails for runtime; explicit test reset succeeds only
  under the validated maintenance login/database;
- exactly one event per logical single/multi-row command, complete entity/parent
  items, and no event for failure/rollback/no-op;
- no Audit JSON/JSONB and no forbidden/token/password/content value appears in
  any typed Audit value column;
- restrictive deletion/cascade behavior remains intact;
- upload Audit failure leaves no DB row and performs best-effort local-file
  cleanup;
- publish/invite/setup multi-table failures leave no partial product/evidence
  state.

Broad verification:

```bash
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
rtk git status --short
```

## Agent-Browser And Client Validation

No frontend source or visual behavior is in scope, but these audited API commands
back browser-visible workflows. After DB/smoke tests pass, use `agent-browser`
against synthetic local data to prove unchanged client behavior:

- desktop portal: first-run or login, create/update a Project, create/complete a
  Capture Session, generate/edit/reorder a Guide, create/edit/reorder an
  Interactive Demo, publish, change link access/password, and revoke the link;
- narrow mobile: repeat representative Project and Guide/Demo mutation controls
  to ensure no unexpected API failure state appears;
- public reader: unlock a password-protected synthetic link, reload it to touch
  the Viewer Session, load one published asset, and confirm revoke blocks access;
- inspect console and network for unexpected 5xx/failed requests, and query the
  synthetic DB afterward to match visible logical actions to Audit Event counts;
- verify keyboard operation only for the controls exercised; no visual,
  animation, zoom/reflow, or accessibility redesign is claimed by this backend
  child.

For extension provenance, prefer an available agent-browser unpacked-extension
harness. If unavailable, record that capability as blocked and use the real
extension HTTP header/session path in app/DB integration plus existing extension
tests; never manufacture browser evidence. Portal/public-reader browser evidence
is required because those clients are locally available.

Use only synthetic local records and URLs. Do not record or commit cookies,
tokens, passwords, private URLs, captured customer content, or sensitive
screenshots.

## Acceptance Criteria

- Every command in the exhaustive contract is implemented through the shared
  same-client Audit transaction contract and emits one event for one successful
  logical mutation.
- All 19 current product tables and every runtime-granted INSERT/UPDATE operation
  are declared, guarded, and catalog/source-verified; runtime has no physical
  business DELETE.
- Coverage automation fails with an actionable table/operation/command error
  when a new production SQL write, state-changing route/internal entry point, or
  runtime grant lacks registry/guard coverage.
- Every affected row in multi-table/batch commands has typed relational evidence
  or the accepted root Row Version envelope; no intermediate reorder values or
  generic serialized payloads are stored.
- Failed, denied, retried-and-rolled-back, partial, and true no-op commands create
  no misleading successful evidence.
- Setup, Invite acceptance, upload/screenshot upload, publish, link revoke, and
  password changes are atomic across all current product rows and evidence;
  upload compensation covers Audit/commit failure.
- Organization/Project/actor scope is server-derived and DB-enforced for
  authenticated, newly-created actor, import/extension, and public system paths.
- Command-specific actor/source policy is enforced by the runner and deferred
  guard; normal business events cannot claim a system actor and public Viewer
  Session events cannot claim an Org User.
- Secrets, credentials, tokens/hashes, private storage values, raw capture input,
  content/JSON payloads, and oversized scalar values cannot enter evidence.
- Current route/request/response/cookie/public-reader/extension contracts and
  authorization behavior remain compatible.
- Migration `016` upgrades a current `015` schema without historical backfill,
  verifies as ready, and has a tested DOWN path restoring child `112` Project
  guards without deleting evidence.
- Maintenance-window deployment/rollback order is documented and verified; no
  mixed old/new writer fleet is claimed safe.
- Operator/current-status docs describe comprehensive mutation Audit coverage
  without claiming Access Events, Audit query APIs, timelines, export, WORM, or
  compliance certification.
- Focused domain/server, fresh-schema DB, full DB, smoke, broad workspace, and
  required portal/public-reader agent-browser validation pass with recorded
  evidence.
- Child `114` can add Access Events and authorized timelines without reopening
  mutation transaction, command registry, guard, actor/source, redaction, or
  credential decisions.

## Expansion And Recheck Checklist

- [x] Predecessor child `112`, its close-previous recheck, and Master `005`
      sequence gate verified.
- [x] Starting commit, clean working-tree ownership, and baseline tests recorded.
- [x] Current migrations, all 19 product tables, runtime grants, repository SQL,
      routes, services, transaction seams, tests, extension/header path, file
      storage, and operator docs inspected.
- [x] Project-only one-to-one coverage-registry assumption replaced with an
      implementation-ready command-centric contract.
- [x] Every current logical mutation, route/entry point, and affected table
      operation inventoried explicitly.
- [x] Actor/source, tenant, field/redaction, Row Version, no-op, retry, batch,
      upload compensation, migration, guard, rollback, API compatibility, and
      security contracts defined.
- [x] Shared-package reuse gate applied: reusable evidence/coverage validation
      remains in `@repo/audit-domain`; SQL/Fastify/request/repository behavior
      remains server-owned; no public DTO is added.
- [x] Exact expected files, explicit non-scope, TDD order, DB/smoke/broad checks,
      and agent-browser requirements defined.
- [x] Current-versus-accepted terminology checked against `CONTEXT.md` and ADRs
      `0003`, `0015`, `0020`, `0023`, and `0025` without describing future
      Project Version/Edition/Revision/Publication behavior as shipped.
- [x] Decisions classified as reversible implementation choices inside accepted
      boundaries. No critical product decision or grill is required.
- [x] Rechecked against implemented child `112` and Master `005`; corrected
      changed-sensitive-field representation, actor/source enforcement,
      semantic command completeness, trigger catalog depth, Audit-specific
      error classification, and mixed-writer deployment/rollback safety.

## Delivery Checklist

- [x] Establish failing focused evidence before behavior changes. New shared,
      Guide, Publish, request-context, route-completeness, transaction-adapter,
      database-fixture, and rollback-readiness boundaries were exercised
      red/green; existing focused suites supplied the regression boundary for
      unchanged repository behavior.
- [x] Replace the partial registry with exhaustive command/table/route coverage
      and automated source/catalog comparison.
- [x] Add migration `016` and activate context/deferred guards for every current
      runtime-writable product operation.
- [x] Convert setup, authentication/session, Organization Invite, Project,
      Capture, File/Asset, Guide, Interactive Demo, Publish Link/Publication, and
      Public Viewer Session mutations.
- [x] Prove atomicity, no-op, retry, batch, tenant, actor/source, redaction,
      append-only, role/grant, bypass, cascade, upload-compensation, and migration
      behavior with real PostgreSQL.
- [x] Preserve all public API/client behavior and run portal/public-reader plus
      extension-source validation.
- [x] Run focused, DB, smoke, broad workspace, format, and whitespace checks and
      record exact outcomes.
- [x] Update this child status/checklist/log/evidence/leftovers and Master `005`
      completed items only after every acceptance criterion passes.

## Commit Strategy

If commits are requested during implementation, keep them small and attributable:

1. implementation-ready child `113` planning checkpoint;
2. coverage model, request context, transaction/no-op contract;
3. migration `016`, generalized guards, catalog/source completeness;
4. setup/authentication/Organization Invite coverage;
5. Project and Capture/File coverage;
6. Guide and Interactive Demo coverage;
7. Publish/Public Viewer Session coverage;
8. operations/browser evidence and child/master closeout.

Do not mix child `114` Access work, Project Membership/Version work, UI cleanup,
or unrelated repository refactors into these commits.

## Implementation Log

Implementation completed on 2026-07-19 and was closed after the same-day
close-previous recheck:

- `631d6f0` replaced the Project-only coverage model with the exhaustive 53
  semantic-command contract, actor/source policy, request context, nullable
  no-op transaction result, and all 19 current product-table registrations.
- `55bb461` covered Auth Session create/touch/revoke and Project
  create/update/soft-delete through same-client Audit transactions.
- `31a860b` covered first-run setup, Invite create/revoke/accept, Capture
  Session/Event, and File/Capture Asset commands, including upload compensation.
- `ff07dd4` covered Interactive Demo root, Scene, Hotspot, and logical reorder
  commands and removed nested transaction ownership.
- `f839dda` covered Guide generation/edit/reorder/delete and introduced the
  atomic screenshot upload command spanning File, Capture Asset, Guide Block,
  Guide root, and one Audit Event.
- `d74662d` covered immutable current publication, Publish Link changes, atomic
  viewer-session revocation, and system-owned public Viewer Session create/touch.
- `6beaec0` propagated request ID and supported extension source through
  async request context and prevented reorder shuffles from updating logically
  unchanged rows.
- `5abbf03` added migration `016`, generalized immediate-context and deferred-
  evidence guards, exhaustive production-SQL source coverage, deep catalog
  readiness verification, and maintenance-migration safety.
- Public route paths, payloads, responses, cookies, and shared DTOs were not
  changed. No Access Event/query/timeline/UI work was added.
- Close-previous recheck added route-to-registry and production-adapter coverage,
  bound every registered command to its action/actor/source policy in PostgreSQL,
  synchronized trigger arguments with the registry, and made the schema verifier
  validate both comprehensive `016` and restored core `015` migration states.
- Close-previous recheck corrected null redaction state, persisted `import`
  source handling, update semantics for session/invite/link revocation, atomic
  Publish Link/viewer-session revocation, and atomic Guide screenshot route
  dependency ownership.
- Fresh DB verification exposed and fixed transaction-client adapter defects in
  Organization Invite, Guide, Capture Event, and Interactive Demo repositories;
  disabled authentication now returns the existing unauthenticated behavior
  without attempting an audited session touch.
- Disposable-database fixtures now use an explicit maintenance transaction and
  transaction-local bypass. Runtime-role tests continue to prove that application
  credentials cannot enable maintenance bypass.

Planning expansion completed on 2026-07-19:

- Expanded from baseline commit
  `66f4061706237418d17c9042d2c29d617725e170` with a clean worktree.
- Read `CONTEXT.md`, accepted ADRs, Master `005`, completed/rechecked child `112`,
  current migrations/grants/guards, every production repository SQL write,
  every mutation route/service, relevant tests, extension request behavior,
  local-file compensation, and operator/status documentation.
- Corrected the inherited `last_seen_at` assumption to the implemented Auth
  Session field `last_active_at`.
- Identified the one-to-many/many-to-one registry requirement, 19 product tables,
  19 runtime INSERT and 15 runtime UPDATE operation classes, nested transaction
  seams, cross-transaction screenshot upload/link session revocation, and public
  viewer activity mutations.
- Selected a command-centric registry, generalized DB guards, explicit
  redaction adapters, one outer transaction owner, and source/catalog completeness
  tests. No runtime/schema/API/UI behavior was changed by this planning step.

Implementation-readiness recheck completed on 2026-07-19:

- Re-read Master `005`, implemented/rechecked child `112`, the expanded plan,
  current Audit types/validation/SQL guards, runtime grants, mutation routes,
  transaction seams, and source/privacy decisions.
- Corrected an unsafe redaction assumption: child `112` intentionally rejects
  equal scalar states, so changed sensitive fields now require a dedicated,
  persisted-difference-proven redacted update helper rather than the generic
  scalar builder.
- Added command-specific actor/source policy to the registry/runner/deferred
  guard, plus exact immediate parent ownership rules.
- Strengthened completeness from repository table-operation scanning alone to
  all production server SQL scanning, typed registry-entry execution, and
  state-changing route/internal-entry-point coverage.
- Required deep trigger catalog verification, exact root Row Version matching,
  generalized-function EXECUTE privilege checks, and Audit-specific database
  error identification so unrelated deferred constraints are not mislabeled.
- Added explicit maintenance-window deployment and rollback ordering because old
  unconverted writers cannot safely run behind migration `016` guards.
- Clarified that current manual Capture edits/reorders and soft-delete markers
  are audited runtime facts, not a weakening or reinterpretation of accepted
  original Capture source immutability.
- No unresolved critical decision, ADR, or grill is required. No runtime/schema/
  API/UI behavior was changed by expansion or recheck.

## Verification Record

Implementation verification on 2026-07-19:

- `rtk pnpm --filter @repo/audit-domain test`: passed, 5 files/33 tests.
- `rtk pnpm --filter server test`: passed, 68 files/335 tests.
- Fresh disposable PostgreSQL create/provision/migrate from `001` through `016`
  passed; migration status reported no pending migrations and Audit schema
  `ready`.
- Full DB integration passed, 12 files/56 tests. This includes guard/catalog,
  append-only, runtime-role denial, atomic rollback, no-op, actor/source,
  tenant, redaction, batch/reorder, upload, Publish, Invite, and fixture checks.
- DB-backed V1 smoke passed, 1 file/1 test.
- Migration `016` DOWN restored the child `112` Project-only guards; migration
  status reported `016` pending and core Audit schema `ready`. Reapplying `016`
  then reported no pending migrations and comprehensive Audit schema `ready`.
- `rtk pnpm --filter server check-types`: passed.
- `rtk pnpm -r --if-present test`: passed across all test-bearing workspace
  packages, including web 26 files/307 tests, extension 11 files/93 tests, and
  server 68 files/335 tests.
- `rtk pnpm check-types`: passed, 12 tasks.
- `rtk pnpm lint`: passed, 13 tasks with no warnings.
- `rtk pnpm build`: passed across the Turbo build graph.
- `rtk git diff --check`: passed.
- Agent-browser passed a synthetic portal workflow at desktop and 390 px:
  first-run setup, Project create/update, Capture Session create, screenshot
  upload, Capture Event create, Guide generation, publish, authenticated logout,
  and the public Guide reader. Keyboard traversal/submission worked, both portal
  and public reader reflowed without horizontal overflow, requests returned the
  expected 201/200/204 statuses, and browser console/page errors were empty.
- Browser-created mutations correlated to typed Audit Events for setup, session
  create/activity/revoke, Project create/update, Capture Session/Asset/Event
  creation, Guide creation, and publication; zero Audit Events lacked change
  items. Only synthetic local records, an OSSie-owned icon, and `example.test`
  URLs were used; no screenshots, cookies, tokens, or credentials were saved.
- An unpacked-extension browser harness was unavailable. The accepted fallback
  passed extension tests (11 files/93 tests), server extension/import source
  policy tests, route/source completeness, and DB actor/source enforcement; no
  extension browser evidence is claimed.

Planning verification on 2026-07-19:

- `rtk pnpm --filter @repo/audit-domain test`: passed, 5 files/19 tests.
- `rtk pnpm --filter server test`: passed, 55 files/292 tests.
- `rtk pnpm --filter server check-types`: passed.
- Runtime DB/migration/browser verification was not rerun because this request is
  planning-only. Child `112`'s fresh DB evidence remains the predecessor baseline;
  implementation must run the expanded verification above.
- No browser evidence is claimed by planning.
- `rtk pnpm exec prettier --check
docs/plan/113-existing-mutation-audit-coverage.md`: passed after recheck.
- `rtk git diff --check`: passed after recheck.

## Leftovers And Handoff

Child `113` is complete and child `114` is now executable. There is no remaining
mutation-coverage implementation work to carry forward.

Non-blocking operational leftovers:

- Local contributors must define separate `development_maintenance` and
  `testing_maintenance` profiles for DB administration; runtime profiles must
  not receive maintenance credentials. The setup/smoke/operations docs now state
  this contract explicitly.
- When an unpacked-extension browser harness is available, repeat the synthetic
  extension capture provenance workflow. Until then, keep the tested HTTP
  header/session, source-policy, DB enforcement, and extension-suite fallback.
- The migration verifier intentionally understands both installed states:
  migration `015` Project-only core coverage and migration `016` comprehensive
  coverage. Future migrations must extend the comprehensive verifier without
  breaking rollback readiness for the actually installed migration set.

Child `114` inherits comprehensive mutation Audit coverage and owns Access
Events, protected-read-before-return guarantees, compliance query authorization,
Owner-only raw evidence at the current pre-membership boundary, storage metrics,
and browser UI. It must keep meaningful access separate from mutation Audit
Events, reuse the established actor/source and tenant derivation where valid,
and leave Project-role visibility extension points for child `115` without
inventing Project Admin/Editor/Viewer authorization early.
