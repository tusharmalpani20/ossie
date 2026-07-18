# Child Plan 112: Audit Evidence Core

Date reserved: 2026-07-12

Last reviewed: 2026-07-19

Status: Implementation-ready; runtime implementation has not started.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Goal

Establish the one typed, relational, transactional, and database-protected Audit
Evidence contract that all mutable Ossie workflows must adopt. Prove the
contract by converting Project creation end to end without claiming that all
existing mutations are covered.

This child creates the foundation only. Child `113` remains responsible for
converting every other existing mutation and activating repository-wide guard
coverage. Child `114` remains responsible for Access Events and compliance
timeline APIs/UI.

## Sequence Gate

Prerequisites:

- Child `109` is complete and the repository-local workflow is available.
- Child `110` is complete and Ossie identity/documentation truth is stable.
- Child `111` is complete; its Audit/Access, relational-persistence, retention,
  and database-runtime decisions are accepted in `CONTEXT.md` and ADRs `0023`
  and `0025`.
- The optional overnight-runner tooling checkpoint was deferred on 2026-07-19
  and is not a prerequisite for sequential execution.

Next child:

- `113` Existing Mutation Audit Coverage, only after this child passes every
  acceptance criterion and closes with explicit partial-coverage evidence.

## Canonical Decisions To Preserve

- An **Audit Event** is append-only evidence of one successfully committed
  logical state-changing operation. It is not an application log, failed
  attempt, Artifact Revision, or mutable history row.
- An **Audit Change Item** describes one explicit aggregate, child-record, or
  field change with typed scalar before/after values. It is not product state
  and must not store a JSON document.
- One logical mutation creates exactly one Audit Event containing one or more
  Audit Change Items. The business mutation and its evidence commit or roll
  back together.
- Failed, rolled-back, and true no-op operations do not create successful Audit
  Events.
- Evidence is Organization-owned, optionally Project-scoped, retained for the
  Organization lifetime, and protected against runtime update, delete,
  truncate, and destructive cascade.
- Runtime controls provide application- and database-runtime-enforced
  append-only evidence. They do not claim protection from a PostgreSQL
  superuser/infrastructure owner, WORM storage, cryptographic anchoring, or
  compliance certification.
- Audit persistence uses typed columns, foreign keys, constraints, and explicit
  relational items. Audit JSON/JSONB, generic metadata, serialized payloads,
  and entity-attribute-value substitutes are prohibited.
- **Row Version** means the existing optimistic-concurrency counter. Audit
  fields must use `before_row_version` and `after_row_version`; unqualified
  `version` language is prohibited in new audit contracts.
- Access attempts, failed authorization, authentication outcomes, meaningful
  reads, public views, downloads, and compliance timelines remain child `114`.

## Preflight And Current Runtime Facts

Baseline commit:

- `5bf83dd9ab959997895f11377ae59b0f07e56a85`

Known working-tree ownership at expansion:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  contains the accepted runner-deferral update from the current user/agent
  session.
- This child file contains the matching runner-deferral update and this
  implementation-ready expansion.
- No unrelated or unknown agent-owned changes were present.

Verified runtime facts:

- Umzug discovers 14 ordered SQL migrations under
  `apps/server/src/db/migrations/` and records them in
  `db_migration.schema_migrations`.
- The current schema contains 19 product tables and no Audit Event, Audit Change
  Item, Access Event, mutation-context guard, or mutation-coverage registry.
- The same `DB_USER`/`DB_PASSWORD` pool is currently used by the API, migration
  tooling, database create/drop commands, fixtures, and DB integration tests.
- No application migration currently creates roles, grants/revokes table
  privileges, or installs append-only triggers.
- Transaction handling is repeated inside individual repositories using manual
  `BEGIN`/`COMMIT`/`ROLLBACK`; Project persistence has no transaction wrapper.
- Fastify provides `request.id` and authenticated User/Organization/Org User
  context, but routes do not yet pass an explicit mutation source, safe actor
  label, correlation context, or idempotency digest to services.
- Current business foreign keys frequently use `ON DELETE CASCADE`; Audit
  Evidence must use restrictive references so ordinary deletion cannot erase
  history.
- DB tests truncate tables with the application pool. Runtime-role enforcement
  therefore requires a separate maintenance pool and a shared maintenance-only
  test reset helper.
- Ten repository modules currently write product state. This child converts
  only `project.create`; child `113` owns the exhaustive command/table rollout.
- Current Project inputs permit arbitrary `metadata`; the Project response does
  not expose it. The representative audit adapter must record only that metadata
  was present/changed through a redacted marker, never its JSON value.
- Authentication currently updates `auth_session.last_seen_at` before route
  execution. That adjacent write is outside the Project transaction and remains
  unaudited until child `113`; child `112` proves atomicity for the Project row
  and its evidence, not for every write performed while authenticating the HTTP
  request.

Baseline verification completed before expansion:

- `rtk pnpm --filter server test`: 44 files and 263 tests passed.
- `rtk pnpm --filter server check-types`: passed.
- `rtk pnpm --filter server test:db`: 11 files and 46 tests passed.
- `rtk git diff --check`: passed.

## Decisions Selected During Expansion

These are reversible implementation choices inside the accepted decisions and
do not require a new ADR or user grill.

### Schema Transition

- Add `015_audit_evidence_core.sql`; do not rewrite migrations `001` through
  `014`.
- A clean test/development database is created by drop/create/migrate. There is
  no production-row backfill, legacy audit mapping, or dual write.
- Existing migration filenames and history remain unchanged.
- `db_migration.schema_migrations` is the operational record that the empty
  pre-live schema gained the Audit foundation. Do not fabricate an
  Organization-owned Audit Event before an Organization exists.
- Treat the Master Plan's "Audit foundation initialization" wording as schema
  initialization, not a synthetic tenant event. Migration `015` must refuse the
  accepted pre-live path if Organization or business rows already exist;
  disposable environments are reset/reseeded instead of silently treating
  populated rows as audited history.
- The `015` DOWN section may remove the new schema only when both Audit tables
  are empty. Populated evidence requires dropping a disposable test/development
  database through the guarded test command; ordinary rollback must not erase
  evidence.

### Representative Mutation

- Convert authenticated `POST /api/v1/projects` (`project.create`) as the only
  guarded business command in this child.
- Project creation is a small Organization-scoped aggregate with an Org User
  actor, a Project root, a starting Row Version, existing route/service/DB
  coverage, and no child collection.
- Do not convert Project update/archive/soft-delete in this child. Installing
  only an INSERT guard on `project_schema.project` keeps those paths operating
  until child `113` converts and guards them.
- Preserve the existing HTTP request/response behavior. Audit Evidence is an
  internal side effect and is not returned from the route.

### Package And Adapter Boundary

- Create `@repo/audit-domain` for framework-independent Audit types, scalar
  validation, sensitive-field policy, typed diff helpers, and the coverage
  registration contract.
- Keep PostgreSQL clients, SQL, transactions, Fastify request handling, database
  roles, and migration logic under `apps/server`.
- Do not copy Orca's PostgreSQL-coupled domain repository or its JSONB
  before/after/metadata persistence. Orca remains an architectural reference
  for event/item composition, allowlists, redaction, and transaction discipline
  only.
- Do not add Audit DTOs to `@repo/types`: child `112` exposes no public/shared
  Audit API. Do not add values to `@repo/constants` unless implementation proves
  a current non-audit-package consumer; the audit-domain package owns its
  internal literal unions initially.

### Database Credential Boundary

- Keep `DB_USER` and `DB_PASSWORD` as API runtime credentials.
- Add `DB_MAINTENANCE_USER` and `DB_MAINTENANCE_PASSWORD` for database
  create/drop, role provisioning, migrations, schema verification, test fixture
  reset, and explicit maintenance operations.
- The production API constructs only the runtime pool. Maintenance credentials
  must not be required by or available to the running API process.
- Local/test setup may use a guarded role-provisioning command to create/update
  the configured runtime login. In production that command must refuse to
  mutate credentials; operators provision the two logins explicitly and run
  migrations with maintenance credentials.
- Migration SQL receives the validated runtime and maintenance role identifiers
  through the exact `__OSSIE_RUNTIME_DB_ROLE__` and
  `__OSSIE_MAINTENANCE_DB_ROLE__` identifier-only placeholders rendered with
  `quote_database_identifier`. Rendering must reject unknown or unreplaced
  placeholders. No free-form SQL interpolation or password interpolation is
  allowed.

## Exact Affected Files

The implementation agent must recheck names immediately before editing. The
expected boundary is:

### New Audit Domain Package

- `packages/audit-domain/package.json`
- `packages/audit-domain/tsconfig.json`
- `packages/audit-domain/eslint.config.js`
- `packages/audit-domain/src/index.ts`
- `packages/audit-domain/src/types/audit-evidence.ts`
- `packages/audit-domain/src/errors/audit-domain-error.ts`
- `packages/audit-domain/src/policies/audit-value-policy.ts`
- `packages/audit-domain/src/policies/audit-value-policy.test.ts`
- `packages/audit-domain/src/policies/audit-sensitive-field-policy.ts`
- `packages/audit-domain/src/policies/audit-sensitive-field-policy.test.ts`
- `packages/audit-domain/src/diff/audit-scalar-diff.ts`
- `packages/audit-domain/src/diff/audit-scalar-diff.test.ts`
- `packages/audit-domain/src/diff/audit-child-diff.ts`
- `packages/audit-domain/src/diff/audit-child-diff.test.ts`
- `packages/audit-domain/src/coverage/audit-coverage.ts`
- `packages/audit-domain/src/coverage/audit-coverage.test.ts`

### Database And Configuration

- `apps/server/src/db/migrations/015_audit_evidence_core.sql`
- `apps/server/src/db/migrator.ts`
- `apps/server/src/db/migrator.test.ts` (new)
- `apps/server/src/db/migrate.ts`
- `apps/server/src/db/create-db.ts`
- `apps/server/src/db/drop-db.ts`
- `apps/server/src/db/provision-runtime-role.ts` (new; development/test only)
- `apps/server/src/db/identifier.ts`
- `apps/server/src/db/identifier.test.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/config/database.config.ts`
- `apps/server/src/config/database.config.test.ts` (new)
- `apps/server/src/config/maintenance-database.config.ts` (new;
  administrative imports only)
- `apps/server/src/config/maintenance-database.config.test.ts` (new)
- `apps/server/src/config/startup.config.ts`
- `apps/server/src/config/startup.config.test.ts`
- `apps/server/src/config/production-env-report.ts`
- `apps/server/src/config/production-env-report.test.ts`
- `apps/server/.env-cmdrc.example`
- `apps/server/package.json`
- `turbo.json`
- `.github/workflows/ci.yml`
- `docker-compose.yml`

### Server Audit Adapter And Test Support

- `apps/server/src/modules/audit/audit-context.ts` (new)
- `apps/server/src/modules/audit/audit-context.test.ts` (new)
- `apps/server/src/modules/audit/audit.repository.ts` (new)
- `apps/server/src/modules/audit/audit-transaction.ts` (new)
- `apps/server/src/modules/audit/audit-transaction.test.ts` (new)
- `apps/server/src/modules/audit/audit-coverage-registry.ts` (new)
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts` (new)
- `apps/server/src/modules/audit/audit.repository.test.ts` (new)
- `apps/server/src/modules/audit/audit.db.integration.test.ts` (new)
- `apps/server/src/test-support/database.ts` (new maintenance-only reset/fixture
  helper)
- `apps/server/src/modules/setup/first-run-setup.db.integration.test.ts`
- `apps/server/src/modules/authentication/session.db.integration.test.ts`
- `apps/server/src/modules/project/project.db.integration.test.ts`
- `apps/server/src/modules/capture-session/capture-session.db.integration.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.db.integration.test.ts`
- `apps/server/src/modules/capture-event/capture-event.db.integration.test.ts`
- `apps/server/src/modules/guide/guide.db.integration.test.ts`
- `apps/server/src/modules/publish/publish.db.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.db.integration.test.ts`
- `apps/server/src/modules/organization/organization-invites.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

The existing DB suites above change only to replace their duplicate
`TRUNCATE ... CASCADE` helpers with the shared maintenance helper. The ignored
local `apps/server/.env-cmdrc` also needs operator-local runtime/maintenance
values, but it must never be committed or printed.

### Representative Project Integration

- `apps/server/src/app.ts`
- `apps/server/src/modules/project/project.routes.ts`
- `apps/server/src/modules/project/project.routes.test.ts`
- `apps/server/src/modules/project/project.service.ts`
- `apps/server/src/modules/project/project.service.test.ts`
- `apps/server/src/modules/project/project.repository.ts`
- `apps/server/src/modules/project/project.audit.ts` (new)
- `apps/server/src/modules/project/project.audit.test.ts` (new)
- `apps/server/src/modules/project/project.db.integration.test.ts`
- `apps/server/src/modules/project/project.app.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

### Workspace And Operations

- `pnpm-lock.yaml`
- `docs/self-hosting.md`
- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- this child plan and the completed-item portions of Master Plan `005` during
  closeout only

### Explicitly Out Of Scope Files

- `apps/web/**`, `apps/extension/**`, `apps/docs/**`, and `packages/ui/**`
- `packages/types/**` and existing public API schemas, unless a compile-time
  break proves that preserving the current Project route contract requires a
  narrow correction
- migrations `001` through `014`
- the unused `pgpPool` cleanup/refactor in `database.config.ts`; leave it
  behaviorally unchanged unless the credential split requires only its runtime
  credential source to remain explicit
- Guide, Interactive Demo, Capture, Publish, authentication, invite, and setup
  runtime repositories except test reset imports required by credential
  separation
- screenshots, browser fixtures, and customer-facing UI documentation

## Audit Domain Contract

### Actor And Source Types

Define closed literal unions with runtime validators:

- `actor_type`: `org_user | system`
- `source_type`: `web | extension | api | system | import | migration`
- `outcome`: `committed` only in child `112`
- change `operation`: `create | update | delete`
- scalar `value_type`: `text | identifier | integer | decimal | boolean | date | timestamp | enum`
- value state: `absent | null | value | redacted | present`; `present` is valid
  only for row-level markers

`actor_org_user_id` is present only for an authenticated Organization Member and
must refer to an Org User in the same Organization. System/import/migration
actors have no actor ID and require a safe label. Do not persist an auth-session
ID or add a generic actor/source ID: session lifecycle must not become evidence
retention, and later API-client, extension-session, or job identities receive
dedicated typed columns only after backing tables and lifecycle rules exist.
Never overload a User ID as an Org User ID.

### Audit Event Input

The domain input must require:

- `id` generated before the guarded business write;
- `organization_id`;
- optional `project_id`;
- `root_resource_type` and `root_resource_id`;
- stable action such as `project.created`;
- actor/source types and optional typed actor identifiers;
- a safe `actor_label` snapshot suitable for future historical display;
- optional `request_id` and `correlation_id` after length/control-character
  validation;
- optional `idempotency_key_hash`, never a raw idempotency key;
- optional `before_row_version` and `after_row_version`;
- `outcome = committed`;
- optional bounded `reason`;
- `occurred_at` supplied by the server or defaulted once by persistence;
- at least one validated Audit Change Item.

### Audit Change Item Input

Each item must carry:

- `id`, `organization_id`, and `audit_event_id`;
- `entity_type` and optional `entity_id`;
- optional `parent_entity_type`/`parent_entity_id`;
- optional bounded `logical_key`;
- `operation`;
- optional `field_name` for scalar changes;
- nullable `value_type` for row-level create/delete markers;
- explicit before/after states;
- typed before/after scalar values in exactly one matching column per side when
  the state is `value`;
- no before/after payload columns for `absent`, `null`, `redacted`, or `present`
  states.

Creation/deletion of an aggregate or child record uses one row-level item with
`absent -> present` or `present -> absent`, plus individual allowlisted scalar
items. Scalar items may not use `present`. A row must never be serialized into
one payload. Updates emit only changed allowlisted scalar fields. Relational
child changes use separate items with parent identity rather than nested values.

At the TypeScript boundary, `decimal` is a canonical base-10 string (never a
JavaScript floating-point number), `date` is `YYYY-MM-DD`, and `timestamp` is a
UTC ISO-8601 string or a `Date` normalized once to that form. PostgreSQL stores
them as `NUMERIC`, `DATE`, and `TIMESTAMPTZ` respectively; round-trip tests must
prove type fidelity.

### Diff And No-Op Rules

- Normalize `undefined` as `absent`, preserve explicit `null`, and compare Date,
  identifier, enum, text, integer, decimal, and boolean values using their
  declared scalar type.
- Ignore storage/audit mechanics such as `created_at`, `updated_at`, actor stamp
  columns, soft-delete mechanics, and Row Version in ordinary field diffing;
  Row Version belongs on the Audit Event envelope.
- Return no Audit Event input when a command produced no row/field/child change.
- A guarded writer must reject an empty item collection. It must not insert an
  empty or misleading event.
- Do not change existing same-value Project update behavior in this child;
  Project update is not the representative converted command.

### Sensitive And Oversized Values

- Use per-command positive field allowlists plus a global case-insensitive
  denylist for password, password hash, secret, token, cookie, authorization,
  API key, session material, invite material, raw typed capture values, raw
  search text, and content payloads.
- A forbidden field name causes domain validation to fail and the business
  transaction to roll back; it is never silently persisted.
- Explicitly approved opaque fields may produce a `redacted` state that records
  presence/change without content. Project `metadata` uses this rule.
- Bound type/action/field names, labels, request context, logical keys, reason,
  and text scalar lengths in both domain validation and SQL checks. Oversized
  non-content values fail the mutation rather than truncating evidence.
- Never log rejected raw values in thrown errors or structured server logs.

## Relational Schema Contract

### `audit_schema.audit_event`

Required columns:

- `id VARCHAR(26) PRIMARY KEY`
- `organization_id VARCHAR(26) NOT NULL`
- `project_id VARCHAR(26) NULL`
- `root_resource_type VARCHAR(80) NOT NULL`
- `root_resource_id VARCHAR(26) NOT NULL`
- `action VARCHAR(120) NOT NULL`
- `source_type VARCHAR(32) NOT NULL`
- `actor_type VARCHAR(32) NOT NULL`
- `actor_org_user_id VARCHAR(26) NULL`
- `actor_label VARCHAR(200) NOT NULL`
- `request_id VARCHAR(255) NULL`
- `correlation_id VARCHAR(255) NULL`
- `idempotency_key_hash CHAR(64) NULL`
- `before_row_version INTEGER NULL`
- `after_row_version INTEGER NULL`
- `outcome VARCHAR(24) NOT NULL DEFAULT 'committed'`
- `reason VARCHAR(500) NULL`
- `occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`

Constraints and indexes:

- composite uniqueness on `(id, organization_id)` for same-tenant item FKs;
- migration `015` adds prerequisite unique constraints on
  `project_schema.project (id, organization_id)`,
  and `organization_schema.org_user (id, organization_id)` without changing
  their existing primary keys;
- restrictive composite Project and Org User foreign keys bind each optional
  identity to `audit_event.organization_id`; the Organization FK is also
  restrictive;
- actor-type/actor-ID consistency checks: `org_user` requires
  `actor_org_user_id`, `system` forbids it, and source values never imply or
  overload actor identity;
- Row Version non-negative/order checks where both sides exist;
- source, outcome, length, and digest-format checks;
- indexes for Organization/date cursor, Project/date cursor, root resource/date,
  actor/date, request context, and idempotency digest;
- no update/delete product API and no mutable timestamp columns.

### `audit_schema.audit_change_item`

Required identity/context columns:

- `id VARCHAR(26) PRIMARY KEY`
- `organization_id VARCHAR(26) NOT NULL`
- `audit_event_id VARCHAR(26) NOT NULL`
- `entity_type VARCHAR(80) NOT NULL`
- `entity_id VARCHAR(26) NULL`
- `parent_entity_type VARCHAR(80) NULL`
- `parent_entity_id VARCHAR(26) NULL`
- `logical_key VARCHAR(255) NULL`
- `operation VARCHAR(24) NOT NULL`
- `field_name VARCHAR(160) NULL`
- `value_type VARCHAR(24) NULL`
- `before_state VARCHAR(16) NOT NULL`
- `after_state VARCHAR(16) NOT NULL`
- `before_text_value VARCHAR(4000) NULL` and matching `after_text_value`
- `before_identifier_value VARCHAR(255) NULL` and matching
  `after_identifier_value`
- `before_integer_value BIGINT NULL` and matching `after_integer_value`
- `before_decimal_value NUMERIC NULL` and matching `after_decimal_value`
- `before_boolean_value BOOLEAN NULL` and matching `after_boolean_value`
- `before_date_value DATE NULL` and matching `after_date_value`
- `before_timestamp_value TIMESTAMPTZ NULL` and matching
  `after_timestamp_value`
- `before_enum_value VARCHAR(160) NULL` and matching `after_enum_value`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`

Constraints and indexes:

- `(audit_event_id, organization_id)` references the matching Audit Event with
  `ON DELETE RESTRICT`;
- exactly one typed column is populated per side when state is `value`, and its
  column matches `value_type`;
- no typed column is populated for `absent`, `null`, `redacted`, or `present`;
- row-level items require `field_name IS NULL`, `value_type IS NULL`, and only
  `absent/present` state transitions matching their create/delete operation;
- scalar items require a field name and value type, may not use `present`, and
  use state transitions consistent with create/update/delete;
- parent type and ID appear together;
- an index on event ID preserves deterministic `created_at, id` item ordering;
- entity/root lookup indexes support child `114` without exposing a query API
  in this child.

Neither table may contain JSON, JSONB, arrays of product state, generic metadata,
or serialized request/content payloads.

## Append-Only And Mutation Guard Contract

### Evidence Guards

- Revoke `UPDATE`, `DELETE`, and `TRUNCATE` on Audit tables from PUBLIC and the
  runtime role.
- Grant the runtime role only schema usage plus the exact `SELECT`/`INSERT`
  privileges required by the internal repository. No route exposes reads yet.
- Install database triggers rejecting Audit Event/Change Item UPDATE, DELETE,
  and TRUNCATE even if application code later receives an accidental grant.
- Allow maintenance bypass only when both conditions hold:
  - the current database login is the configured maintenance role; and
  - transaction-local `ossie.maintenance_mode = 'on'` is explicitly set.
- Runtime users cannot gain bypass merely by setting a custom GUC.

### Business Mutation Context

The audit transaction coordinator must:

1. acquire one runtime `PoolClient`;
2. begin a transaction;
3. generate/validate the Audit Event ID before the business write;
4. set transaction-local, scalar GUCs for event ID, Organization, action, and
   command identity using parameterized `set_config` calls;
5. execute the business mutation through a repository bound to that client;
6. build and validate typed change items from the persisted-intent result;
7. insert the Audit Event, then its items, through the same client;
8. commit only when the business write, evidence write, and deferred guard all
   pass;
9. roll back and rethrow on any failure; and
10. release the client in `finally`.

Project creation receives:

- an INSERT-only context guard on `project_schema.project` requiring the
  transaction-local event/Organization/action/command values;
- a deferred constraint trigger that verifies before commit that the referenced
  same-Organization Audit Event exists and contains a `project` create item for
  the inserted Project ID;
- maintenance-role bypass for direct synthetic fixture setup only.

Do not install UPDATE/DELETE Project guards or guards on any other business
table in child `112`.

For `project.created`, domain and database checks require
`project_id = root_resource_id`, `root_resource_type = 'project'`, and the
row-level item's `entity_id` to equal that same ID. Context GUC Organization,
action, command, and pre-generated event ID must match both the inserted Project
and evidence; a stale or reused context fails at commit.

### Coverage Registry

`audit-coverage-registry.ts` initially registers exactly:

- table: `project_schema.project`
- SQL operation: `INSERT`
- logical command: `project.create`
- route: `POST /api/v1/projects`
- expected context-guard and deferred-trigger names

The audit-domain coverage validator rejects duplicate table/operation or command
registrations. DB tests compare this registration with PostgreSQL trigger
catalogs. The registry and docs must state that all other mutable commands are
uncovered until child `113`; no repository-wide completeness assertion is added
in this child.

## Representative Project Contract

### Route And Request Context

`POST /api/v1/projects` keeps its current URL, body schema, `201` response, and
error envelopes.

The route adds internal mutation context:

- `request_id` from Fastify `request.id` after validation;
- `correlation_id` only from an explicitly accepted safe request identifier if
  already configured; otherwise `null` rather than a new header contract;
- `source_type = web`;
- `actor_type = org_user`;
- `actor_org_user_id` from authenticated Org User context;
- `actor_label` from the authenticated User display name;
- no raw cookie, session token, authorization header, email, IP address, or user
  agent;
- `idempotency_key_hash = null` because Project creation has no accepted
  idempotency header contract yet.

### Event And Items

Successful Project creation writes:

- root type/id: `project` and the new Project ID;
- Project scope: the new Project ID;
- action: `project.created`;
- before Row Version: `null`;
- after Row Version: `1` or the actual returned Row Version;
- one Project row-level `create` item;
- allowlisted scalar items for `name`, `description`, `slug`, `color`, `icon`,
  and `status`;
- one redacted `metadata` item only when metadata is non-null/present.

Unknown passthrough request fields are neither persisted by the Project
repository nor audited. Audit construction uses the returned persisted Project
for scalar values plus a single `metadata_was_present` boolean derived from the
normalized command input. Raw metadata is never passed into the audit builder,
repository, error, or log.

### Atomic Behavior

- If Project insertion fails, no Audit Event or item persists.
- If audit validation, insertion, or the deferred guard fails, Project creation
  rolls back and the existing server error boundary returns a non-sensitive
  failure.
- Duplicate Project conflicts preserve the current `409` response and create no
  evidence.
- Cross-Organization actor/Project scope mismatch fails before commit.
- The response is sent only after transaction commit.
- The pre-route authentication session touch is not part of this transaction.
  A later Project/audit failure can therefore leave only `last_seen_at` updated;
  this is truthful partial coverage and must be carried into child `113`, not
  hidden by the Project atomicity claim.

## Authorization, Tenant Isolation, And Retention

- Only the already-authenticated Organization context may create a Project; no
  request body may select Organization or actor identity.
- Every Audit Event and Change Item is bound to exactly one Organization.
- Optional Project scope must belong to that Organization through database
  constraints.
- Org User actor identity must belong to the same Organization at write time.
- Safe actor label is a historical presentation snapshot and must not be updated
  when the User later changes their display name.
- Evidence has no soft-delete flag, update timestamp, archive state, or deletion
  API.
- Business Project archive/delete operations never cascade into Audit Evidence.
- Physical Organization deletion remains blocked by restrictive Audit foreign
  keys until a future governed purge design exists.
- Backups include `audit_schema`; storage pressure produces operator guidance,
  never cleanup code.

## Migration, Reset, Rollback, And Compatibility

### Forward Migration

- Use migration `015` after the current `014_org_member_invites.sql`.
- Validate that the separately provisioned role identifiers exist; then create
  grants, prerequisite composite unique constraints, schema, tables, functions,
  checks, indexes, Audit append-only triggers, the Project INSERT guard, and its
  deferred verification trigger in dependency-safe order. Migration SQL never
  creates a login or changes a password.
- Run the SQL body and `db_migration.schema_migrations` write through one
  maintenance client and one transaction. A failed render, statement, or log
  write must leave neither partial schema objects nor a false migration record.
- Revoke PUBLIC privileges explicitly before granting the runtime minimum.
- Grant the runtime role only required schema usage, current business-table DML,
  and Audit `SELECT`/`INSERT`; it receives no DDL, role membership, ownership,
  `TRUNCATE`, Audit mutation, or maintenance-role membership. Existing API
  behavior must be exercised under this restricted role.
- Verify a fresh empty database and a reset disposable test database.
- Do not populate historical Audit Events for existing alpha rows. The accepted
  execution path resets disposable development/test databases before use.

### Credential Provisioning

- `test:setup` becomes: create test DB with maintenance credentials, provision
  the test runtime login, migrate with maintenance credentials, then run tests
  with the runtime pool.
- Add explicit scripts for role provisioning and clean test reset; retain the
  existing safety checks that refuse non-test database drops.
- The role-provisioning helper validates identifiers, never prints passwords,
  and refuses credential mutation in production mode.
- Production docs require operators to provision separate logins before running
  migration `015`; maintenance credentials are supplied only to administrative
  commands, never the API process.
- CI and local Docker defaults provision distinct maintenance and runtime
  logins. The API/test process receives runtime variables; setup/migration/reset
  steps receive maintenance variables explicitly.

### Test Fixture Reset

- Replace duplicate per-suite truncation with a shared helper using the
  maintenance pool.
- The helper verifies test runtime and test database naming, starts a
  transaction, sets maintenance mode locally, truncates Audit tables before
  business roots in an explicit list, commits, and never accepts an arbitrary
  database name.
- Synthetic fixture inserts use the maintenance pool only where they
  intentionally bypass converted runtime commands. Application/repository paths
  under test continue using runtime credentials.

### Backwards Compatibility

- Preserve current Project HTTP request/response schemas and status codes.
- No old/new Audit API compatibility is needed because no Audit API exists.
- No production data or public client requires migration/backfill.
- Do not rename existing schemas, tables, columns, packages, cookies, routes, or
  migration history as part of Audit Foundation work.
- Existing unconverted mutations remain usable and explicitly unaudited until
  child `113`; only Project INSERT receives a business-table guard here.

### Rollback

- Migration DOWN succeeds only while Audit tables are empty and removes grants,
  business guards, evidence triggers/functions, tables, schema, and the
  `015`-owned composite unique constraints in reverse dependency order.
- Once evidence exists, rollback reports an actionable refusal. Disposable
  environments reset by dropping/recreating the test/development database.
- Never disable append-only triggers or delete evidence as an automatic
  application rollback strategy.

## Error And Observability Contract

- Audit domain errors use stable internal codes and contain no rejected values.
- Existing Project conflict/not-found HTTP mappings remain unchanged.
- Audit persistence/guard failures are server failures; they must roll back the
  business mutation and log only the stable error code, action, request ID, and
  safe identifiers.
- Never log typed before/after values, metadata, credentials, session material,
  raw request bodies, or database passwords.
- Startup/schema verification reports missing roles, grants, triggers,
  constraints, or indexes without printing credentials.
- The API `env:report` reports only whether runtime database settings are
  configured, never their values. Migration/provisioning commands validate
  maintenance settings separately; the API report and process must not require
  or read maintenance secrets.

## API, UI, Browser, And Accessibility Boundary

- No Audit query/list/detail/export route is added.
- No Project response gains Audit fields or links.
- No Portal, extension, Docs App, component, navigation, timeline, or settings
  UI changes in this child.
- No browser-visible behavior is expected; `agent-browser`, screenshots,
  responsive, keyboard, zoom/reflow, and visual evidence are therefore not
  required.
- Route-level Fastify injection and DB-backed smoke evidence are required for
  Project creation atomicity.

## Test-Driven Implementation Order

Each behavior change follows red-green-refactor. Do not write production code
before observing the focused test fail for the intended missing behavior.

### Phase 1: Audit Domain Types And Policies

1. Add failing tests for literal unions, identifier/length validation, typed
   scalar state/value consistency, forbidden fields, redacted markers,
   oversized values, and safe errors.
2. Implement the smallest audit-domain types/errors/policies that pass.
3. Add failing scalar and child-record diff tests covering create/update/delete,
   explicit null, absence, redaction, stable identity, ignored mechanical
   fields, and true no-op output.
4. Implement diff helpers without JSON serialization or database imports.
5. Add coverage-registry validation tests and implement the reusable contract.

### Phase 2: Credential And Migration Foundation

1. Add failing configuration tests proving the API uses runtime credentials and
   administrative commands use maintenance credentials.
2. Add identifier-placeholder and production-refusal tests before implementing
   role provisioning/migration rendering.
3. Add static migration tests for the exact schema, columns, absence of
   JSON/JSONB, checks, indexes, restrictive FKs, grants, triggers, and guarded
   DOWN behavior.
4. Add a failing migrator atomicity test proving a failed SQL/log write leaves
   neither schema objects nor a migration-history row.
5. Implement migration/config/tooling changes minimally.
6. Recreate the disposable test database and prove migration from empty state.

### Phase 3: Audit Repository And Transaction Coordinator

1. Add failing unit tests for event/item parameter mapping, same-Organization
   validation, empty-item rejection, and safe error handling.
2. Implement the server persistence adapter using one supplied `PoolClient`.
3. Add DB tests for successful typed persistence and every constraint.
4. Add failing atomic rollback tests for business failure, evidence failure,
   thrown callback, and deferred-guard failure.
5. Implement the transaction coordinator and transaction-local mutation
   context.

### Phase 4: Runtime Append-Only And Guard Evidence

1. Add runtime-role DB tests proving Audit UPDATE, DELETE, TRUNCATE, malformed
   inserts, and destructive Organization/Project/Org User cascades fail.
2. Add maintenance-mode tests proving runtime cannot spoof bypass and the
   guarded test helper can reset only a disposable test DB.
3. Add registry/catalog tests proving only Project INSERT is guarded in this
   child and every registered trigger exists.
4. Add request/idempotency/Row Version tests, including raw-key absence.

### Phase 5: Representative Project Creation

1. Add failing service/route tests for internal mutation-context propagation
   while preserving the public response.
2. Add a failing DB-backed test proving Project and one Audit Event/items commit
   atomically.
3. Convert Project creation to the audit transaction coordinator; leave other
   Project commands unchanged.
4. Add duplicate-conflict, cross-tenant, audit-write-failure, redacted metadata,
   and rollback tests.
5. Extend the existing smoke flow to assert Project creation emits exactly one
   event without exposing Audit data over HTTP.

### Phase 6: Operations, Broad Verification, And Closeout

1. Update self-hosting, operations, production-readiness, backup, credential,
   migration, and reset instructions truthfully.
2. Run focused and broad verification.
3. Record exact commands/outcomes, migration/reset evidence, changed files,
   commits, limitations, and child `113` handoff.
4. Mark this child complete and update Master `005` only after every acceptance
   item passes.

## Focused Verification

Expected commands, adjusted only if package scripts require an equivalent form:

```bash
rtk pnpm --filter @repo/audit-domain test
rtk pnpm --filter @repo/audit-domain check-types
rtk pnpm --filter @repo/audit-domain lint
rtk pnpm --filter @repo/audit-domain build
rtk pnpm --filter server test -- src/config/database.config.test.ts
rtk pnpm --filter server test -- src/db/migrator.test.ts
rtk pnpm --filter server test -- src/db/foundation-schema.test.ts
rtk pnpm --filter server test -- src/modules/audit/audit.repository.test.ts
rtk pnpm --filter server test -- src/modules/project/project.service.test.ts
rtk pnpm --filter server test -- src/modules/project/project.routes.test.ts
rtk pnpm --filter server test:db:drop
rtk pnpm --filter server test:setup
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

The implementation record must state that test DB drop/create/reset commands are
destructive only to the explicitly validated disposable test database.

## Broad Verification

```bash
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
rtk git status --short
```

Also record:

- fresh migration list/status;
- runtime versus maintenance `current_user` evidence without credentials;
- Audit table privileges and trigger names;
- restrictive FK delete/cascade failures;
- exact partial coverage registry contents;
- confirmation that no Audit/Access browser routes or UI were added;
- confirmation that Audit tables contain no JSON/JSONB columns.
- confirmation that `apps/server/package.json` includes the new Audit DB suite
  in `test:db` and CI runs setup/migration/reset with explicit maintenance
  credentials before exercising the API with runtime credentials.

## Acceptance Criteria

- `015_audit_evidence_core.sql` builds the clean typed relational Audit schema
  after migrations `001` through `014` without changing migration history.
- Audit Event and Change Item persistence contains no JSON/JSONB, generic
  metadata, serialized rows, request bodies, content payloads, raw idempotency
  keys, or credentials.
- Typed scalar/state constraints reject mismatched or multiple value columns.
- Project creation and its one Audit Event/items commit or roll back together.
- Duplicate, failed, rolled-back, and guard-rejected Project creation leaves no
  misleading evidence or partial Project row.
- Runtime credentials can insert validated evidence and perform internal reads
  but cannot update, delete, truncate, bypass guards, or cascade-delete it.
- Runtime credentials retain the minimum business-table privileges necessary
  for current API behavior and are not a member of the maintenance role.
- Maintenance credentials are separate from the API runtime and used only by
  explicit administrative/test tooling.
- Organization, Project, and actor scope are enforced in both domain validation
  and database constraints.
- Sensitive/forbidden/oversized values cannot enter evidence; Project metadata
  is represented only by a redacted state.
- The coverage registry and PostgreSQL catalogs agree that only
  `project.create`/Project INSERT is converted and guarded.
- All other existing mutations remain functional and are truthfully documented
  as pending child `113`.
- Backup/restore and production instructions include Audit Evidence and the
  runtime/maintenance credential boundary.
- Focused domain/server/DB/smoke tests and broad workspace checks pass.
- No Audit query API, Access Event, timeline/export UI, browser-visible behavior,
  unrelated refactor, or future version-domain mutation is added.

## Expansion And Recheck Checklist

- [x] Predecessor children and child `111` acceptance verified.
- [x] Starting commit and known working-tree ownership recorded.
- [x] Current migrations, schema, database configuration, roles, transaction
      seams, Project route/service/repository, tests, and operations docs
      reinspected.
- [x] Current runtime facts separated from accepted target behavior.
- [x] Exact expected affected and explicitly out-of-scope files listed.
- [x] Domain, schema, typed-value, transaction, guard, coverage, authorization,
      tenant, retention, error, migration, reset, rollback, compatibility, and
      operations contracts defined.
- [x] Shared-package reuse gate applied: audit domain logic is reusable;
      PostgreSQL/Fastify behavior remains server-owned; no public DTO is added.
- [x] Representative mutation selected without broadening into child `113`.
- [x] TDD order, focused tests, DB/smoke coverage, broad checks, and browser
      non-applicability defined.
- [x] Decisions classified as reversible implementation choices inside accepted
      ADRs; no critical product decision or new grill is required.
- [x] Keep the requested attributable planning checkpoint limited to this child
      and the matching Master `005` status/sequence update; no runtime files.

## Delivery Checklist

- [ ] Establish every behavior boundary with a failing focused test before
      production code.
- [ ] Add and verify the audit-domain package without framework/database imports.
- [ ] Add migration `015`, runtime/maintenance credential separation, schema
      checks, grants, append-only triggers, and guarded test reset.
- [ ] Add the server Audit repository, transaction coordinator, mutation context,
      and partial coverage registry.
- [ ] Convert only authenticated Project creation end to end.
- [ ] Prove atomicity, tenant isolation, typed persistence, redaction,
      append-only behavior, restrictive deletion, role separation, and partial
      guard coverage with real PostgreSQL tests.
- [ ] Update operator documentation and backup/restore expectations.
- [ ] Run focused, DB-backed, smoke, and broad verification and record exact
      outcomes.
- [ ] Update this child status, implementation log, evidence, leftovers, and
      handoff together with Master `005` only after acceptance passes.

## Commit Strategy

If commits are requested, keep them scoped and attributable:

1. planning checkpoint for this implementation-ready expansion;
2. audit-domain types/policies/diffs and tests;
3. migration, credential split, grants/guards, and DB tests;
4. server transaction/repository/coverage foundation;
5. Project creation integration and smoke evidence;
6. operations documentation and child/master closeout.

Do not mix unrelated cleanup, existing transaction refactors for unconverted
commands, or child `113` coverage into these commits.

## Implementation Log

Runtime implementation has not started.

Planning baseline:

- Baseline commit: `5bf83dd9ab959997895f11377ae59b0f07e56a85`.
- Expansion completed on 2026-07-19 against the current 14-migration schema,
  server repository patterns, accepted Orca reference, `CONTEXT.md`, ADRs
  `0020`, `0023`, and `0025`, and Master Plan `005`.
- Recheck completed on 2026-07-19 against Master `005` and current code. It
  resolved the row-marker state contradiction, named exact typed columns and
  test files, added composite tenant FKs and their prerequisite constraints,
  removed generic/session actor identifiers, made migration-history atomicity
  explicit, separated API and maintenance configuration/reporting, accounted
  for direct DB fixtures and CI/Docker credentials, and documented the existing
  pre-route auth-session touch as child `113` partial coverage.
- No runtime, schema, API, UI, package, or operational behavior was changed by
  this planning step.

## Verification Record

Planning baseline only:

- `rtk pnpm --filter server test`: passed, 44 files/263 tests.
- `rtk pnpm --filter server check-types`: passed.
- `rtk pnpm --filter server test:db`: passed, 11 files/46 tests.
- `rtk git diff --check`: passed before this expansion.
- `rtk pnpm exec prettier --check docs/plan/112-audit-evidence-core.md
docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`:
  passed after recheck.
- `rtk git diff --check`: passed after recheck.

Implementation verification has not run and must not be inferred from these
baseline results.

Browser evidence:

- Not applicable to child `112`; no browser-visible surface is in scope.

## Leftovers And Handoff

Required child `113` handoff after successful closeout:

- inventory every remaining mutable table, SQL operation, repository/service
  command, background/system path, extension path, import, and data-changing
  migration;
- convert every remaining command to the same Audit transaction/context/writer;
- add temporary explicit adapters for current JSON-backed business fields that
  emit known typed/redacted items without copying JSON into evidence;
- extend database guards operation by operation only after each command is
  converted;
- populate the coverage registry exhaustively and activate the repository-wide
  schema/command completeness check only when no current mutation is left
  uncovered;
- preserve the credential, maintenance-reset, append-only, restrictive-FK,
  redaction, and no-op contracts established here;
- keep Access Events and compliance queries/UI deferred to child `114`.

Child `112` must not be described as comprehensive mutation coverage. Its stable
outcome is one proven foundation plus one guarded representative command.
