# Child Plan 115: Project Membership Foundation

Date reserved: 2026-07-12

Expanded: 2026-07-19

Last rechecked: 2026-07-19

Status: Implementation-ready. Planning only; no runtime, schema, API, UI, or
extension implementation from this child has started.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Starting baseline:

- commit `46c44c9` (`docs(plan): close access evidence recheck`);
- the worktree was clean when this expansion began;
- child `114` is complete and migrations currently end at
  `018_access_evidence_constraint_hardening.sql`.

## Goal

Replace Organization-wide implicit Project access with an explicit,
tenant-safe Project Membership boundary before Project Versions or the new
Revision/Publication model ship. Organization Owners remain implicit Project
Admins. Active Organization Members receive access only through an active
Project Membership with role `project_admin`, `editor`, or `viewer`.

The same policy must govern Project discovery, private Project reads and
mutations, authoring and export paths, the browser extension, and Project-scoped
evidence views. Membership mutations must use the completed Audit foundation,
and every meaningful read or denial must preserve child `114` Access Evidence
semantics.

## Sequence Gate And Current Runtime Facts

The predecessor gate is satisfied:

- child `112` provides append-only typed Audit Events and Change Items;
- child `113` covers all current mutation commands and guards their tables;
- child `114` provides append-only Access Events, exact route coverage,
  successful resolved-root validation, fail-closed protected reads, and the
  Owner-only Organization compliance timeline;
- the next child is `116-project-version-foundation.md`, and it must not begin
  until this child's schema, policy, route matrix, portal, extension, evidence,
  migration, and browser acceptance checks pass.

Current code facts that this plan changes:

- `organization_schema.org_user` and authentication know only the supported
  Organization roles `owner | member`; the old foundation CHECK still contains
  an unused `admin` literal, but application contracts do not emit it.
- `project_schema.project` is Organization-owned and soft deleted. Every active
  authenticated Organization Member can currently list, discover, read, update,
  and delete every Project in that Organization.
- Project-scoped capture, Guide, Interactive Demo, export, and private Publish
  handlers currently authenticate and tenant-scope their repository query, but
  have no Project role decision.
- Project creation is one audited transaction. Its creator is recorded in
  `created_by_id`, but no membership row exists.
- Access Evidence currently accepts only Organization `owner | member` roles.
  Project-role literals must not be emitted before the database and domain
  validators are migrated together.
- the Owner compliance endpoint accepts an optional `project_id` filter, but
  query input is not an authorization boundary and cannot be reused directly by
  a Project Admin.
- the portal uses a custom pathname parser and page-local data fetching. Current
  Project settings and authoring pages assume every authenticated user may
  mutate.
- the extension loads the ordinary Project list and presents every returned
  Project as a capture target.
- the accepted relational Project Version, Edition, Revision, and Publication
  models do not exist yet. Current Guides, Interactive Demos, and
  `published_artifact` snapshots must not be renamed or presented as those
  future domain objects.

## Canonical Decisions Applied

This plan applies, without reopening:

- `CONTEXT.md`: Project Membership joins one active Organization Member to one
  Project; Project roles are Project Admin, Editor, and Viewer; Project Versions
  inherit the Project boundary; public Publish Link access is independent.
- ADR `0015`: authenticated tenant-owned actor references use `org_user.id`.
- ADR `0023`: current authorization is evaluated at query time, historical
  evidence is retained, and Activity is a curated projection rather than a
  second event store.
- ADR `0024`: Organization Owners are implicit Project Admins without duplicate
  rows; new non-owner creators become explicit Project Admins; other
  Organization Members receive no automatic access; Project Admins may assign
  only existing Organization Members and may not invite people.
- ADR `0025`: Project Membership is explicit relational persistence, not JSON,
  generic metadata, or a capability map stored on the row.
- the accepted capability matrix from child `111`: Admin includes Editor
  behavior; Editor can capture, author, restore/carry forward when those models
  exist, and manage publication links; Viewer is read-only and may see archived
  content; only Admin manages membership, settings, Project Versions, and safe
  asset purge.

No new grill is required. The schema shape, stable-row reactivation, optimistic
concurrency field, route split, and UI composition below are reversible,
locally testable implementation details within accepted semantics.

### Sequencing clarification: Viewer history

The accepted target gives Viewer ordinary Revision/Publication-only history,
but the original master ownership placed a concrete projection before its
source models. This recheck repairs that stale sequencing assumption:
relational Editions, Revisions, and Publications are introduced by children
`118` through `120`, and the current `published_artifact` snapshot is not the
accepted Publication model. This child therefore:

- establishes and tests the Viewer read-only authorization seam;
- keeps current private Guide, Interactive Demo, Capture, export, and publish
  status reads available to a Viewer;
- denies Viewer access to raw compliance evidence and curated Editor Activity;
- does not add a temporary Viewer history route or relabel current snapshots;
- hands the Viewer Revision and Publication history projection to children
  `118` through `120`, where its authoritative relational source exists.

This is implementation sequencing, not a change to the accepted permission
model.

## Scope

### In scope

- relational Project Membership persistence, indexes, tenant constraints,
  lifecycle, grants, clean greenfield migration/reset gate, and guarded audited
  writes;
- shared Project role, membership, Project access, Activity, and API contracts;
- a central server-side Project capability policy and current-role evaluator;
- creator membership in the existing `project.create` transaction;
- Admin membership list/assignment/role-change/removal APIs and portal UI;
- membership-aware Project list/detail and all current private Project routes;
- Owner/Project Admin Project-scoped raw compliance routes;
- Admin/Editor curated Project Activity over current safe Audit actions;
- Access Evidence Project-role context and membership/activity/compliance route
  coverage;
- portal role display and read-only or hidden controls appropriate to the
  current Admin/Editor/Viewer matrix;
- extension capture-target filtering and server enforcement;
- migration, unit, route, app, database, smoke, portal, extension, and real
  browser verification;
- closeout updates to this child and only completed `115` items in the parent.

### Explicit non-scope

- Organization invitation or Organization role-management changes. Invites
  remain Owner-only, and a Project Admin cannot create an Organization Member.
- A general Organization Member directory for non-owners. The Project
  membership list exposes only active assignment candidates plus
  disabled-but-assigned members needed to explain/revoke Project access.
- Project Version, Default Project Version, Artifact, Edition, Working Draft,
  Revision, Publication, checkpoint, restore, Carry Forward, or asset-purge
  implementation. The policy names their accepted future capability boundaries
  for reuse, but no route or UI claims they exist.
- Viewer Revision/Publication history until children `118` through `120` provide
  its accepted source model.
- Audit/Access export, retention changes, selective deletion, SIEM/webhooks,
  alerts, analytics, or certification claims.
- bulk membership operations, groups/teams, custom roles, per-resource ACLs,
  temporary access, invitations by Project role, or ownership transfer.
- changing Capture immutability, shared-asset protection, Publication/public
  link immutability, password rules, public URLs, or public viewer sessions.
- replacing the portal router, adding a query/state/form/table library, or
  requiring agent skills/browser tooling at application runtime.
- solving the child `114` browser-harness limits for an injected failing Access
  writer or a real unpacked extension toolbar. Preserve those as honest
  environment capability notes.

## Exact Affected Files

The names below are the implementation boundary. If current-code drift requires
another file, record why in the implementation log before editing it. Do not
modify unrelated public reader/embed rendering or storage internals.

### Create

- `apps/server/src/db/migrations/019_project_membership_foundation.sql`
- `packages/constants/src/project-membership.ts`
- `packages/types/src/project-membership.ts`
- `packages/types/src/project-membership.test.ts`
- `packages/types/src/project-activity.ts`
- `packages/types/src/project-activity.test.ts`
- `apps/server/src/modules/project-membership/project-membership.repository.ts`
- `apps/server/src/modules/project-membership/project-membership.repository.test.ts`
- `apps/server/src/modules/project-membership/project-membership.service.ts`
- `apps/server/src/modules/project-membership/project-membership.service.test.ts`
- `apps/server/src/modules/project-membership/project-membership.routes.ts`
- `apps/server/src/modules/project-membership/project-membership.routes.test.ts`
- `apps/server/src/modules/project-membership/project-membership.audit.ts`
- `apps/server/src/modules/project-membership/project-membership.audit.test.ts`
- `apps/server/src/modules/project-membership/project-membership.db.integration.test.ts`
- `apps/server/src/modules/project-membership/project-membership.app.integration.test.ts`
- `apps/server/src/modules/project-membership/project-access.policy.ts`
- `apps/server/src/modules/project-membership/project-access.policy.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/modules/project-activity/project-activity.service.ts`
- `apps/server/src/modules/project-activity/project-activity.service.test.ts`
- `apps/server/src/modules/project-activity/project-activity.routes.ts`
- `apps/server/src/modules/project-activity/project-activity.routes.test.ts`
- `apps/server/src/modules/project-activity/project-activity.db.integration.test.ts`
- `apps/server/src/modules/guide/guide-screenshot-upload.audit.test.ts`
- `apps/web/src/features/project/useProjectAccess.ts`
- `apps/web/src/features/project/ProjectMembershipSection.tsx`
- `apps/web/src/features/project/ProjectMembershipSection.module.css`
- `apps/web/src/features/project/ProjectMembershipSection.test.tsx`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.tsx`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.module.css`
- `apps/web/src/features/project-activity/ProjectActivityTimelinePage.test.tsx`

### Modify: shared contracts and evidence domain

- `packages/constants/src/access.ts`
- `packages/constants/src/index.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/project.ts`
- `packages/types/src/project.test.ts`
- `packages/types/src/compliance.ts`
- `packages/types/src/compliance.test.ts`
- `packages/types/src/index.ts`
- `packages/audit-domain/src/types/access-evidence.ts`
- `packages/audit-domain/src/policies/access-event-policy.ts`
- `packages/audit-domain/src/policies/access-event-policy.test.ts`

### Modify: server composition, persistence, policy, and evidence

- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/migrate.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/package.json`
- `apps/server/src/test-support/database.ts`
- `apps/server/src/test-support/database.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/access/access-request-context.ts`
- `apps/server/src/modules/access/access-request-context.test.ts`
- `apps/server/src/modules/access/access-response-hook.ts`
- `apps/server/src/modules/access/access-response-hook.test.ts`
- `apps/server/src/modules/access/access-atomic.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/access/access.repository.test.ts`
- `apps/server/src/modules/access/access.db.integration.test.ts`
- `apps/server/src/modules/compliance/compliance.repository.ts`
- `apps/server/src/modules/compliance/compliance.repository.test.ts`
- `apps/server/src/modules/compliance/compliance.service.ts`
- `apps/server/src/modules/compliance/compliance.service.test.ts`
- `apps/server/src/modules/compliance/compliance.routes.ts`
- `apps/server/src/modules/compliance/compliance.routes.test.ts`
- `apps/server/src/modules/compliance/compliance.db.integration.test.ts`
- `apps/server/src/modules/project/project.repository.ts`
- `apps/server/src/modules/project/project.service.ts`
- `apps/server/src/modules/project/project.service.test.ts`
- `apps/server/src/modules/project/project.routes.ts`
- `apps/server/src/modules/project/project.routes.test.ts`
- `apps/server/src/modules/project/project.audit.ts`
- `apps/server/src/modules/project/project.audit.test.ts`
- `apps/server/src/modules/project/project.db.integration.test.ts`
- `apps/server/src/modules/project/project.app.integration.test.ts`

Each current private Project feature must invoke the same authorizer at its
service boundary and map its common Project errors at the route boundary:

- `apps/server/src/modules/capture-session/capture-session.service.ts`
- `apps/server/src/modules/capture-session/capture-session.service.test.ts`
- `apps/server/src/modules/capture-session/capture-session.routes.ts`
- `apps/server/src/modules/capture-session/capture-session.routes.test.ts`
- `apps/server/src/modules/capture-session/capture-session.app.integration.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.ts`
- `apps/server/src/modules/capture-asset/capture-asset.service.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.ts`
- `apps/server/src/modules/capture-asset/capture-asset.routes.test.ts`
- `apps/server/src/modules/capture-asset/capture-asset.app.integration.test.ts`
- `apps/server/src/modules/capture-event/capture-event.service.ts`
- `apps/server/src/modules/capture-event/capture-event.service.test.ts`
- `apps/server/src/modules/capture-event/capture-event.routes.ts`
- `apps/server/src/modules/capture-event/capture-event.routes.test.ts`
- `apps/server/src/modules/capture-event/capture-event.app.integration.test.ts`
- `apps/server/src/modules/guide/guide.service.ts`
- `apps/server/src/modules/guide/guide.service.test.ts`
- `apps/server/src/modules/guide/guide.routes.ts`
- `apps/server/src/modules/guide/guide.routes.test.ts`
- `apps/server/src/modules/guide/guide-screenshot-upload.audit.ts`
- `apps/server/src/modules/guide/guide.app.integration.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.service.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.routes.test.ts`
- `apps/server/src/modules/interactive-demo/interactive-demo.app.integration.test.ts`
- `apps/server/src/modules/publish/publish.service.ts`
- `apps/server/src/modules/publish/publish.service.test.ts`
- `apps/server/src/modules/publish/publish.routes.ts`
- `apps/server/src/modules/publish/publish.routes.test.ts`
- `apps/server/src/modules/publish/publish.app.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`

The existing repository modules for capture, Guide, Interactive Demo, and
Publish remain tenant/project scoped and should not be mechanically rewritten.
Change one only if a focused test proves it cannot consume the central service
decision without duplicating policy.

`guide-screenshot-upload.audit.ts` is a separate mutation service rather than a
method on `guide.service.ts`; it must receive/enforce `artifact.write` before
opening its audited upload transaction. Route-only protection is insufficient.

### Modify: portal and extension

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/features/project/types.ts`
- `apps/web/src/features/project/ProjectListPage.tsx`
- `apps/web/src/features/project/ProjectListPage.module.css`
- `apps/web/src/features/project/ProjectListPage.test.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.tsx`
- `apps/web/src/features/project/ProjectWorkspacePage.module.css`
- `apps/web/src/features/project/ProjectWorkspacePage.test.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.tsx`
- `apps/web/src/features/project/ProjectSettingsPage.module.css`
- `apps/web/src/features/project/ProjectSettingsPage.test.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.test.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.tsx`
- `apps/web/src/features/capture-session/ProjectCaptureSessionListPage.test.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.tsx`
- `apps/web/src/features/capture-session/CaptureSessionDetailPage.test.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.tsx`
- `apps/web/src/features/guide/ProjectGuideListPage.test.tsx`
- `apps/web/src/features/guide/GuideEditorPage.tsx`
- `apps/web/src/features/guide/GuideEditorPage.test.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.tsx`
- `apps/web/src/features/guide/GuidePreviewPage.test.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.tsx`
- `apps/web/src/features/interactive-demo/ProjectInteractiveDemoListPage.test.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.tsx`
- `apps/web/src/features/interactive-demo/InteractiveDemoEditorPage.test.tsx`
- `apps/extension/src/lib/api.ts`
- `apps/extension/src/lib/api.test.ts`
- `apps/extension/src/App.tsx`
- `apps/extension/src/App.test.tsx`
- `apps/extension/src/popup/helpers.ts`
- `apps/extension/src/popup/helpers.test.ts`

CSS modules for feature pages not named above should change only if their page
requires a new read-only/permission state and existing primitives cannot express
it. Public Guide and Interactive Demo reader/embed files are explicitly outside
this child.

### Modify only during closeout

- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `docs/plan/115-project-membership-foundation.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

## Persistence And Migration Contract

### `project_schema.project_membership`

Migration `019_project_membership_foundation.sql` creates:

| Column            | Type          | Rules                                        |
| ----------------- | ------------- | -------------------------------------------- |
| `id`              | `VARCHAR(26)` | primary key; application-generated ULID      |
| `organization_id` | `VARCHAR(26)` | not null                                     |
| `project_id`      | `VARCHAR(26)` | not null                                     |
| `org_user_id`     | `VARCHAR(26)` | not null                                     |
| `role`            | `VARCHAR(50)` | one of `project_admin`, `editor`, `viewer`   |
| `status`          | `VARCHAR(50)` | one of `active`, `revoked`; default `active` |
| `version`         | `INTEGER`     | not null, default `1`, greater than zero     |
| `created_by_id`   | `VARCHAR(26)` | not null Organization actor                  |
| `updated_by_id`   | `VARCHAR(26)` | not null Organization actor                  |
| `revoked_by_id`   | `VARCHAR(26)` | null while active, actor when revoked        |
| `revoked_at`      | `TIMESTAMPTZ` | null while active, non-null when revoked     |
| `created_at`      | `TIMESTAMPTZ` | not null, current timestamp                  |
| `updated_at`      | `TIMESTAMPTZ` | not null, current timestamp                  |

Do not add JSON/JSONB, metadata, capability arrays, `is_deleted`, or cascading
actor FKs.

Constraints and indexes:

- reuse the unique `(id, organization_id)` keys on Project and Org User already
  supplied by migration `015`; do not add duplicates;
- restrictive composite FK `(project_id, organization_id)` to
  `project_schema.project(id, organization_id)`;
- restrictive composite FK `(org_user_id, organization_id)` and every actor FK
  `(actor_id, organization_id)` to
  `organization_schema.org_user(id, organization_id)`;
- one unique row per `(project_id, org_user_id)`. Removal revokes that stable row;
  a later assignment reactivates it instead of creating history ambiguity;
- CHECK role, status, positive version, nonblank/length-safe identifiers, and
  exact lifecycle shape: active means both revocation fields are null; revoked
  means both are non-null;
- index `(organization_id, org_user_id, status, project_id)` for discovery and
  `(organization_id, project_id, status, role, org_user_id)` for authorization
  and administration.

An Organization Owner must never have an _active_ Project Membership row. A
normal CHECK cannot safely read another table, so enforce activation with the
transactional repository under a locked current Org User row and a database
trigger that rejects an active owner target. Add the complementary
`org_user` role-transition trigger that rejects promotion to `owner` while any
active Project Membership exists; a later Organization-role workflow must
revoke those memberships first. Organization role management itself remains
non-scope. A revoked historical row may remain for evidence/stable identity but
is ignored and suppressed from the Owner's effective-access DTO. These triggers
are tenant invariants, not the authorization implementation.

### Greenfield migration and reset/reseed boundary

Master `005` accepted a coordinated greenfield reset/reseed and explicitly has
no production-row backfill requirement. Migration `019` therefore must not
invent historical membership or silently reinterpret former broad access:

1. Refuse UP with a named, actionable error when any row exists in
   `project_schema.project`, including a soft-deleted row. The operator must use
   the accepted backup/reset/reseed workflow before applying `019`.
2. Refuse if any actual `organization_schema.org_user.role = 'admin'` row exists.
   Current application contracts support only `owner | member`; do not silently
   map a legacy literal.
3. Preserve existing User/Organization/Org User rows when no Project exists;
   there is no reason to destroy identity/setup state solely to add the table.
4. Create no Project Membership, Audit Event, or Change Item during migration.
   Schema installation and the migration-ledger row are not fabricated product
   membership mutations.

If implementation discovers a real requirement to retain existing Project
rows, stop: that expands the accepted migration strategy. Any approved data
backfill must use `actor_type = system`, `source_type = migration`, typed Change
Items, one logical Audit Event per operation, and the existing transaction/
guard contract. An unaudited maintenance backfill is prohibited by ADR `0023`.

### Audit guards and grants

- extend `audit_schema.mutation_command_policy_is_valid` and the generated
  mutation-guard registration through migration `019`; do not edit applied
  migrations `015` through `018`;
- cover Project Membership `INSERT` for `project.create` and
  `project.membership.assign`, and `UPDATE` for assign/reactivate,
  role-change, and removal commands;
- grant runtime `SELECT, INSERT, UPDATE` only; revoke `DELETE` and `TRUNCATE`;
- add `verify_project_membership_schema`, which first calls shipped
  `verify_evidence_schema` and then verifies the membership table, columns,
  constraints, indexes, triggers, ownership, grants, active-owner guard, and the
  still-exact Access authorization/scoped-success constraints;
- update `migrate.ts` so executed `019` selects that verifier for UP/status,
  while an empty `019` DOWN returns to shipped `verify_evidence_schema` for
  `017`/`018`; preserve the existing `audit_schema` status key for CLI
  compatibility;
- update audit coverage synchronization tests to compare the effective guard
  policy across immutable migration `016` plus additive migration `019`; never
  rewrite `016` merely to make the registry text match;
- DOWN must refuse while any membership row or retained Access Event with
  `authorization_type = 'project_role'` exists, restore the prior Access
  authorization CHECK/function policy, remove only `019` guards/table/verifier
  expectations, and never delete Audit/Access evidence to make a rollback
  succeed.

## Shared Schemas And Types

### Constants

`packages/constants/src/project-membership.ts` defines exact readonly tuples:

```ts
PROJECT_ROLES = ["project_admin", "editor", "viewer"];
PROJECT_MEMBERSHIP_STATUSES = ["active", "revoked"];
PROJECT_ACCESS_SOURCES = ["organization_owner", "project_membership"];
PROJECT_LIST_PURPOSES = ["capture"];
PROJECT_ACTIVITY_CATEGORIES = ["project", "capture", "content", "publication"];
```

Use `ProjectRole`, `ProjectMembershipStatus`, `ProjectAccessSource`,
`ProjectListPurpose`, and `ProjectActivityCategory` derived from those tuples.
Do not use display labels as stored/API values.

Extend Access constants:

- `ACCESS_AUTHORIZATION_TYPES`: add `project_role`;
- Access authorization roles: create one shared union of Organization and
  Project role literals instead of repeating a handwritten union;
- do not add a new Access surface for Activity. It is a portal read; raw Project
  evidence remains surface `compliance`.

### Project access

Add to every `ProjectSchema` result:

```ts
access: {
  role: "project_admin" | "editor" | "viewer";
  source: "organization_owner" | "project_membership";
}
```

For an Owner, role is `project_admin` and source is `organization_owner`. For an
explicit active row, role is its stored value and source is
`project_membership`. Never return revoked membership state on a Project DTO.

Extend `ProjectListQuerySchema` with optional `purpose: "capture"`. It is a
server-side narrowing hint, never an authorization claim:

- omitted: all Projects the actor may read;
- `capture`: only Projects where the actor currently has `capture.write`.

Existing clients that omit it remain contract-compatible, except that Project
visibility is intentionally narrowed by membership.

### Membership API schemas

`ProjectMembershipSchema` is the explicit stored membership DTO:

```ts
type ProjectMembership = {
  id: Id;
  organization_id: Id;
  project_id: Id;
  org_user_id: Id;
  role: ProjectRole;
  status: ProjectMembershipStatus;
  version: number;
  created_by_id: Id;
  updated_by_id: Id;
  revoked_by_id: Id | null;
  revoked_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
};
```

The administration list returns active, non-deleted Organization Members plus
disabled, non-deleted Members who already have a row for this Project. This lets
a Project Admin assign active people and explain/revoke disabled access without
acquiring Owner-only invitation/directory authority:

```ts
ProjectAccessMember = {
  org_user_id: Id;
  email: string;
  display_name: string;
  organization_role: "owner" | "member";
  organization_status: "active" | "disabled";
  access_source: "organization_owner" | "project_membership" | null;
  membership: ProjectMembership | null;
  effective_project_role: ProjectRole | null;
}

ProjectMembershipListResponse = {
  members: ProjectAccessMember[];
}
```

An active Owner row has source `organization_owner`, effective role
`project_admin`, and null membership. An unassigned active Member has null
source, membership, and effective role. Revoked rows are returned for an active
Member so the UI can reactivate the stable record. A disabled assigned Member
is returned with its stored membership for explanation/removal but null
effective role/source; it cannot be assigned, reactivated, or role-changed until
Organization status is active. Deleted Members and unassigned disabled Members
are omitted.

Mutation schemas:

```ts
AssignProjectMembershipRequest = { org_user_id: Id; role: ProjectRole }
ChangeProjectMembershipRoleRequest = {
  role: ProjectRole;
  expected_version: positiveInteger;
}
RemoveProjectMembershipQuery = { expected_version: positiveInteger }
ProjectMembershipResponse = { membership: ProjectMembership }
```

Use strict picking before the service as existing routes do; passthrough input
compatibility must not let unknown fields affect persistence or Audit evidence.

### Curated Activity schemas

`ProjectActivityEventSchema` exposes only:

```ts
{
  id: Id;
  project_id: Id;
  category: "project" | "capture" | "content" | "publication";
  action: string;
  summary: string;
  actor_type: "org_user" | "system";
  actor_label: string;
  source_type: ComplianceAuditEventSummary["source_type"];
  occurred_at: IsoDateTime;
  grouped_event_count: positiveInteger;
}
```

Response:

```ts
{
  events: ProjectActivityEvent[];
  page: { next_cursor: string | null; has_more: boolean };
}
```

Do not expose Audit Change Items, Access Events, request/correlation IDs,
idempotency hashes, row versions, authorization context, raw values, denied
attempts, security/authentication events, public viewer sessions, or generic
unregistered action text. `grouped_event_count` is `1` for current explicit
writes; later editor autosave work may group compatible events without changing
the envelope.

`@repo/types/project-activity` must reuse the source union/schema already
carried by `ComplianceAuditEventSummarySchema`; it must not import
`@repo/audit-domain` or add a reverse package dependency. No new workspace or
registry dependency is justified.

### Access Evidence validation

Extend `AccessEvent.authorization_role` to
`owner | member | project_admin | editor | viewer | null` and replace the named
database CHECK additively:

- `organization_role` requires `owner | member`;
- `project_role` requires a Project role for success and permits null only for a
  denied/not-found/failed decision where no active membership resolved;
- all other authorization types require null;
- preserve `chk_access_event_scoped_success` exactly.

`AccessRequestContext` gains a server-only resolved authorization decision:

```ts
{
  authorization_type: "organization_role" | "project_role";
  authorization_role: "owner" | "member" | ProjectRole | null;
}
```

The central Project authorizer sets it. An implicit Owner decision records
`organization_role/owner`; an explicit membership decision records
`project_role/<role>`; a no-membership denial records `project_role/null`.
Route registration is classification metadata only. Neither headers, params,
request bodies, nor stored historical Access roles are authorization input.

## Central Project Authorization Contract

### Policy module

`project-access.policy.ts` owns one exhaustive capability matrix. Current and
accepted future capabilities are named server-internally so later children reuse
the boundary rather than invent route checks:

| Capability                    | Project Admin | Editor | Viewer |
| ----------------------------- | ------------: | -----: | -----: |
| `project.read`                |           yes |    yes |    yes |
| `project.settings.manage`     |           yes |     no |     no |
| `project.membership.manage`   |           yes |     no |     no |
| `project.compliance.read`     |           yes |     no |     no |
| `project.activity.read`       |           yes |    yes |     no |
| `capture.read`                |           yes |    yes |    yes |
| `capture.write`               |           yes |    yes |     no |
| `artifact.read`               |           yes |    yes |    yes |
| `artifact.write`              |           yes |    yes |     no |
| `publication.read`            |           yes |    yes |    yes |
| `publication.manage`          |           yes |    yes |     no |
| `project_version.manage`      |           yes |     no |     no |
| `revision.checkpoint_restore` |           yes |    yes |     no |
| `revision.carry_forward`      |           yes |    yes |     no |
| `asset.purge`                 |           yes |     no |     no |

Only current capabilities are wired to routes in this child. Future names are
tested policy seams, not shipped behavior or public capability flags.

### Resolution algorithm

Every private Project service operation passes full current auth
`organization_id`, `actor_org_user_id`, and `organization_role`, plus
`project_id` and required capability, to the central authorizer before content
is read or mutated.

In one tenant-scoped query/transaction:

1. revalidate that the actor Org User is active, non-deleted, same Organization,
   and currently `owner | member`; never rely solely on the session snapshot;
2. resolve a non-deleted Project by both `id` and `organization_id`;
3. if the actor is Owner, return effective `project_admin` with source
   `organization_owner` and no membership row;
4. otherwise resolve the unique active Project Membership for that Project and
   actor;
5. absent/revoked membership yields hidden Project semantics;
6. an active role lacking the requested capability yields permission denied;
7. after authorization, reject child-content mutation capabilities on an
   archived Project with `409 project_archived`; keep Project/membership
   administration, Project compliance/Activity reads, and Project restoration
   available to Admin/Owner, and keep all accepted read capabilities available;
8. on success, return effective access and set resolved Project resource and
   authorization context for Access Evidence.

Errors:

- missing/cross-tenant Project, inactive actor, or no active membership:
  `404 project_not_found`; this prevents Project discovery;
- known active membership but insufficient capability:
  `403 project_permission_denied`;
- authorized content mutation against an archived Project:
  `409 project_archived`, with no mutation or Audit Event;
- unauthenticated: existing `401 unauthenticated` envelope.

For a same-Organization Project that resolves before a role denial, Access
Evidence may retain its Project/root ID for Owner compliance. A nonexistent or
cross-tenant parameter must not be resolved into an event. No denial returns
Project data.

Services, not React controls or route-local role strings, own enforcement.
Routes may select the named capability for their operation and map the shared
errors. Repositories retain Organization and Project predicates as defense in
depth.

### Discovery and revocation

- Owner list: all matching Organization Projects.
- Non-owner list: only Projects with an active membership for the current active
  Org User.
- `purpose=capture`: further require effective Admin or Editor.
- list results contain effective access and preserve current status filtering;
  archived Projects remain readable when explicitly requested or opened;
- Project archive is an effective read-only wrapper for child capture/artifact/
  publication state. It blocks `capture.write`, `artifact.write`,
  `publication.manage`, and the future checkpoint/Carry-Forward/purge mutation
  capabilities regardless of role, while existing public Publish Links remain
  available. Project Admin may still manage membership/settings and restore the
  Project.
- membership removal, role change, Organization Member disable/delete, or
  Organization role change takes effect on the next request. Do not cache the
  result across requests.
- a request authorized before a concurrent removal may finish its already
  opened transaction; all subsequent requests see revocation. Mutation
  transactions must resolve/lock authorization before writing.

## Membership Lifecycle And Behavior

### Project creation

- Any active authenticated Organization `owner | member` may create a Project,
  as today.
- The existing `project.create` audited transaction locks/revalidates the
  creator Org User.
- Owner creator: insert Project only; implicit Admin access, no membership row.
- Member creator: insert Project and active `project_admin` membership in the
  same transaction.
- The single `project.created` Audit Event includes the Project row changes and,
  for a non-owner, a child `project_membership` row-create Change Item. Do not
  emit a second membership event for creator bootstrap.
- Any Project or membership failure rolls back both data and evidence.

### Assignment

- only current implicit Owner or active Project Admin may assign;
- target must be an active, non-deleted, same-Organization Org User;
- an Owner target returns `409 project_membership_not_required`;
- an active existing row returns `409 project_membership_exists`;
- a revoked stable row is reactivated with the requested role, cleared
  revocation fields, incremented version, and updated actor/time;
- missing/cross-tenant/inactive/deleted target returns
  `404 organization_member_not_found` without revealing another tenant;
- assignment does not invite, email, create an Org User, or change Organization
  role.

### Role change and removal

- role change requires a different valid role and matching `expected_version`;
  same-role input is `400 project_membership_unchanged` with no write/evidence;
- removal soft-revokes, sets both revocation fields, increments version, and
  returns `204`;
- stale version returns `409 project_membership_conflict` with no write;
- missing, cross-Project, cross-tenant, or already revoked row returns
  `404 project_membership_not_found`;
- a disabled target's existing active membership may be removed, but it cannot
  be role-changed until the Organization Member is active; PATCH returns
  `409 organization_member_inactive` with no write/evidence. Assignment or
  reactivation POST resolves only an active target and therefore returns the
  non-disclosing `404 organization_member_not_found` for a disabled target;
- self-demotion and self-removal are allowed and take effect immediately after
  commit. The response may complete, but the next Admin-only request is denied;
- no “last explicit Admin” rule is needed because every Organization has an
  implicit Owner recovery path. Prove that Owner path in tests rather than
  inserting an Owner row.

### Audit events

Register exact commands/actions:

| Command                          | Action                            | Membership SQL               |
| -------------------------------- | --------------------------------- | ---------------------------- |
| `project.membership.assign`      | `project.membership.assigned`     | insert or revoked-row update |
| `project.membership.role_change` | `project.membership.role_changed` | update                       |
| `project.membership.remove`      | `project.membership.removed`      | update                       |

Each committed event is rooted/scoped to the Project, uses the current actor,
and includes typed membership row/field changes for role, status, version, and
revocation fields. Do not include email, display name, content, credentials, or
generic metadata in Change Items. Denials and validation failures write no
Audit Event; accepted child `114` Access Evidence records the route denial.

## HTTP API Contract

All routes are under `/api/v1`, use existing error envelopes and session
transport, and are registered in `ACCESS_ROUTE_COVERAGE_REGISTRY` before they
ship.

### Project list/detail changes

- `GET /projects?status=active|archived&purpose=capture`
  - `purpose` optional; response Projects include `access`;
  - no membership is represented by absence from the list, never a redacted row.
- `GET /projects/:id`
  - Admin/Editor/Viewer/Owner `200` with effective access;
  - no membership/cross tenant `404`.
- `POST /projects`
  - unchanged request/`201` envelope; response includes creator access.
- `PATCH /projects/:id`, `DELETE /projects/:id`
  - `project.settings.manage`; Admin/Owner only;
  - Editor/Viewer `403`, no membership `404`.

### Membership administration

- `GET /projects/:project_id/memberships`
  - `project.membership.manage`; `200 ProjectMembershipListResponse`.
- `POST /projects/:project_id/memberships`
  - strict picked assignment body; `201 ProjectMembershipResponse` for new or
    reactivated stable row.
- `PATCH /projects/:project_id/memberships/:membership_id`
  - role and expected version; `200 ProjectMembershipResponse`.
- `DELETE /projects/:project_id/memberships/:membership_id?expected_version=N`
  - `204`, no response body.

All four use `404 project_not_found` for hidden Project access and `403
project_permission_denied` for a known Editor/Viewer. Target/membership and
conflict errors use the stable types defined in lifecycle rules.

### Access route classification and action ownership

Preserve child `114`'s exact method/template/outcome action validation and
one-event completion marker. Extend the registry deliberately:

- `GET /projects` and `POST /projects` remain Organization-rooted and use
  `organization_role/<owner|member>` because list/create authorization begins at
  active Organization membership. A list may contain Projects with different
  roles; do not choose one Project role or store per-result roles in its single
  Access Event. Membership filtering still occurs in SQL.
- direct Project, capture, Guide, Interactive Demo, private publish,
  membership, Project compliance, and Activity routes are classified as
  `project_role` by default. The resolved decision overrides that default to
  `organization_role/owner` for an implicit Owner and to
  `project_role/<role>` for an explicit membership.
- a same-Organization no-membership 404 uses `project_role/null`; a known
  Editor/Viewer 403 retains the resolved Project role; a nonexistent or
  cross-tenant parameter retains Organization ownership but no untrusted
  Project/root ID.
- membership GET success action is `project.membership_list_viewed`; membership
  mutation success actions remain their exact Audit actions; their failure
  action is `project.membership_access_denied` without copying target member or
  membership IDs until trusted resolution.
- Project Activity uses `project.activity_viewed` /
  `project.activity_access_denied`; Project compliance reuses
  `compliance.timeline_viewed` and `compliance.audit_event_viewed` with the
  existing corresponding denial actions and `compliance` surface.

Ordinary validation/no-op/version/archived conflicts remain governed by child
`114`: they create no successful Audit Event and are not reclassified as an
authorization Access Event. Successful web membership mutations are represented
by Audit Evidence; successful extension mutations would also use child `114`'s
atomic Access rule, though no membership extension UI is added here.

### Project-scoped raw compliance

Keep existing Owner Organization routes unchanged:

- `GET /organization/compliance/events`
- `GET /organization/compliance/audit-events/:audit_event_id`

Add:

- `GET /projects/:project_id/compliance/events?limit&cursor&kind`
- `GET /projects/:project_id/compliance/audit-events/:audit_event_id`

Rules:

- implicit Owner or active Project Admin only;
- force `organization_id` and `project_id` from current authorization/path into
  the repository. Do not accept a Project query parameter as authority;
- detail query must predicate both Organization and Project, so an Audit Event
  from another Project is `404 audit_event_not_found`;
- after a detail row resolves, replace the request's root resource with that
  trusted `audit_event` ID while retaining the authorized Project ID. A missing
  or cross-Project detail must never copy its unvalidated path ID into Access
  Evidence;
- response and cursor contracts remain the child `114` compliance contracts;
  the Project filter is part of the cursor fingerprint;
- Editor/Viewer gets `403 project_permission_denied`; absent membership gets
  hidden `404 project_not_found`;
- viewing these routes records `compliance.timeline_viewed` or
  `compliance.audit_event_viewed` with resolved Project authorization.

### Curated Activity

- `GET /projects/:project_id/activity?limit=1..50&cursor=<opaque>`
- Admin, Owner, and Editor: `200 ProjectActivityResponse`;
- Viewer: `403 project_permission_denied`;
- absent membership/cross tenant: `404 project_not_found`.
- malformed, oversized, wrong-version, or Project/fingerprint-mismatched cursor:
  `400 invalid_project_activity_cursor` before an evidence query. Limit defaults
  to 25 and is bounded to 1..50 using the same coercion/validation convention as
  compliance.

The repository always predicates Organization and Project. It reads Audit
Evidence only and uses this exact current-action allowlist, with each action
mapped to its category and a fixed server-authored safe summary:

```ts
project = ["project.created", "project.updated", "project.deleted"];
capture = [
  "capture_session.created",
  "capture_session.updated",
  "capture_session.completed",
  "capture_session.deleted",
  "capture_asset.created",
  "capture_asset.uploaded",
  "capture_asset.deleted",
  "capture_event.created",
  "capture_event.updated",
  "capture_event.reordered",
  "capture_event.deleted",
];
content = [
  "guide.created",
  "guide.updated",
  "guide.step.updated",
  "guide.blocks.reordered",
  "guide.block.created",
  "guide.block.updated",
  "guide.block.screenshot_updated",
  "guide.block.annotations_updated",
  "guide.block.screenshot_uploaded",
  "guide.block.deleted",
  "interactive_demo.created",
  "interactive_demo.updated",
  "interactive_demo.deleted",
  "interactive_demo.scene.created",
  "interactive_demo.scene.updated",
  "interactive_demo.scenes.reordered",
  "interactive_demo.scene.deleted",
  "interactive_demo.hotspot.created",
  "interactive_demo.hotspot.updated",
  "interactive_demo.hotspots.reordered",
  "interactive_demo.hotspot.deleted",
];
publication = [
  "guide.published",
  "interactive_demo.published",
  "guide.publish_link.revoked",
  "interactive_demo.publish_link.revoked",
  "guide.publish_link.access_updated",
  "interactive_demo.publish_link.access_updated",
  "guide.publish_link.password_updated",
  "interactive_demo.publish_link.password_updated",
];
```

Exclude setup, authentication/session, Organization invites/members,
membership administration, raw Access Events/denials, public link views,
viewer-session activity, unknown actions, and any later action until explicitly
registered. Cursor ordering is `(occurred_at DESC, id DESC)` and its fingerprint
includes Project plus the Activity registry version. Viewing Activity records a
portal Access Event `project.activity_viewed`; because Activity reads Audit only,
that Access Event cannot recursively appear in Activity.

## Current Route Capability Matrix

Apply these named capabilities at the service boundary:

| Current route family                                   | GET/read                    | Mutation                  |
| ------------------------------------------------------ | --------------------------- | ------------------------- |
| `/projects/:id`                                        | `project.read`              | `project.settings.manage` |
| Project membership                                     | `project.membership.manage` | same                      |
| Project compliance                                     | `project.compliance.read`   | none                      |
| Project Activity                                       | `project.activity.read`     | none                      |
| capture sessions/assets/events including file download | `capture.read`              | `capture.write`           |
| Guides including markdown/HTML export                  | `artifact.read`             | `artifact.write`          |
| Interactive Demos/scenes/hotspots                      | `artifact.read`             | `artifact.write`          |
| private Guide/Demo publish status                      | `publication.read`          | `publication.manage`      |

Consequences:

- Admin/Owner can use every current private route;
- Editor can read/write capture and artifacts, export, publish/republish, update
  link access/password, revoke links, and view Activity; Editor cannot update or
  delete Project settings, manage memberships, or read raw compliance;
- Viewer can use every private GET in the capture/artifact/publish-status rows,
  including archived Project content and exports, but no mutation, settings,
  Activity, or raw evidence route;
- public `/public/publish-links/...` routes, public asset downloads, readers,
  embeds, passwords, and viewer sessions remain governed solely by the existing
  Publish Link policy. Never require Project Membership for them.

## Portal Behavior

### Shared access state

`useProjectAccess(project_id)` loads the Project DTO and exposes loading,
unauthenticated, hidden/not-found, error, and loaded effective role/source
states. Private Project pages use this shared state for presentation only;
server authorization remains authoritative. Avoid a global role cache and
refresh after membership self-change.

Every Project card/workspace header shows a human label `Project admin`,
`Editor`, or `Viewer`; implicit Owner access may add `Organization owner` helper
text. Do not expose internal capability arrays.

### Project list and workspace

- list only server-returned Projects; never merge a stale client cache;
- add an accessible Active/Archived list filter backed by the existing `status`
  query so every role can discover its authorized archived Projects; changing
  the filter replaces the list and preserves loading/empty/error behavior;
- Project creation remains available to every active Organization Member;
- Workspace shows Settings (which owns Membership) and Compliance links only
  for Admin/Owner; do not invent a separate Members route;
- Activity link is visible for Admin/Owner/Editor;
- Viewer sees content destinations and a clear read-only role, with no authoring
  CTA.

### Settings and membership administration

- Editor/Viewer direct Settings navigation renders a stable permission state,
  not an editable form; hidden Projects remain not found;
- Admin/Owner sees existing details/lifecycle settings plus the Membership
  section;
- Membership section includes loading, active roster, no-unassigned-members,
  revoked/reactivatable, fetch error/retry, mutation pending, validation,
  version-conflict/reload, permission-loss, and destructive confirmation states;
- show Owners as immutable implicit Admins with no role select/remove button;
- show Organization active/disabled status plus active/revoked Project state and
  Project role for returned Members;
- assignment selects only active unassigned/revoked Organization Members and a
  role; it does not contain an email invite form;
- disabled assigned Members remain visible and removable, with role/reactivate
  controls disabled and explanatory copy;
- role change is explicit and disabled while saving;
- removal requires a named-person confirmation dialog/action, restores focus on
  cancel, and announces success/failure. Do not optimistically remove before
  the server commits;
- after self-demotion/removal, refresh Project access and leave the Admin UI for
  Workspace/permission state.

### Read-only content behavior

For Viewer, and for every role while the Project itself is archived:

- Capture list/detail keeps readable source/event/asset content and downloads,
  but hides create, complete, update, delete, Guide-generation, and Demo-
  generation controls;
- Guide list/detail/preview and exports remain readable; editor fields,
  reorder/add/delete, screenshot upload/selection, annotation, and publish/link
  controls are hidden or rendered non-interactive;
- Interactive Demo list/detail remains readable; create, scene/hotspot mutation,
  reorder/delete, and publish/link controls are hidden or non-interactive;
- direct mutation attempts still receive server `403`; UI gating never replaces
  that test. An authorized Admin/Editor attempt against archived child content
  receives `409 project_archived` instead; UI must present the Project as
  read-only rather than invite a doomed mutation.

Permission states must not suggest that Viewer Revision/Publication history
already exists. The current publish-status read may be shown using its existing
language only.

### Compliance and Activity pages

- reuse `ComplianceTimelinePage` with an explicit Organization or Project mode;
  Project mode calls only path-scoped Project endpoints and labels the scope;
- route paths are `/projects/:projectId/compliance` and
  `/projects/:projectId/activity`;
- Activity displays category, safe summary, actor, source, time, and grouped
  count only; no expandable raw changes or authorization details;
- both pages preserve loading, empty, pagination, retry, unauthenticated,
  forbidden, hidden, and role-loss states.

## Extension Behavior

- extension `listProjects` calls
  `GET /api/v1/projects?status=active&purpose=capture` with its existing Bearer
  session and `X-Ossie-Client: extension` attribution;
- only Owner/Admin/Editor Projects may be selected or restored from saved local
  selection; Viewer-only, revoked, archived, removed, and cross-tenant Projects
  are absent;
- if a saved Project disappears, clear the selection and show the ordinary
  choose-Project state;
- if membership is removed during an active capture, the next upload/event/
  completion fails closed with the server's permission/not-found message; keep
  already captured local diagnostic state recoverable, stop automatic writes,
  and require a new authorized Project selection;
- never trust client filtering: every capture mutation is authorized on the
  server and receives Project-role Access Evidence;
- do not broaden extension host permissions, store role/capability secrets, or
  claim cryptographic extension attestation.

## Security, Privacy, And Permission Rules

- Every repository query includes Organization tenant predicates; every nested
  resource query also proves the supplied Project relation.
- No active membership means no Project discovery. Return the same 404 for
  nonexistent, another-tenant, and inaccessible Projects.
- A 403 is used only after same-tenant Project plus active membership is known
  and the role lacks the capability.
- Current Organization and membership state is authoritative on every request;
  historical Audit/Access roles are never inputs.
- Membership list exposes active assignment candidates and disabled assigned
  Member ID, display name, email, Organization role/status, and Project
  membership state only to Admin/Owner of that Project. It excludes deleted and
  unassigned disabled Members and exposes no invite token, session, password,
  or unrelated evidence.
- Organization Member disable/delete implicitly removes usable Project access
  even if the membership row remains active; re-enabling restores it only when
  the explicit membership is still active.
- Owner implicit access never creates an active membership row and cannot be
  revoked by a Project Admin. A revoked historical row is never treated or
  displayed as Owner authorization.
- Project Membership FKs and runtime writes are restrictive; do not cascade
  evidence, membership history, or actor identity.
- Membership API does not accept Organization ID, actor ID, status, audit
  fields, or timestamps from the client.
- Protected reads preserve child `114` pre-response fail-closed behavior. If
  Access Evidence append fails, no membership roster, content, Activity, or
  compliance payload leaves the server.
- Mutations and Audit Evidence remain one transaction. Access Evidence for
  extension mutation success remains atomic with the Audit event where child
  `114` already requires it.
- Public Publish Link access remains independent and does not disclose Project
  membership or effective role.

## Backwards Compatibility And Deployment

- Migration is additive; never rewrite applied migration files.
- Existing Project response parsers receive an additive `access` field. All
  in-repo web/extension types update in the same release.
- Existing Project list clients may omit `purpose` and continue to parse the
  same envelope. The intentional behavior break is narrower visibility for
  ordinary Organization Members.
- There is no existing-Project backfill. Migration `019` refuses any Project
  rows, following the accepted pre-live greenfield reset/reseed strategy. Back
  up any disposable data needed for reference, reset/reseed through `019`, and
  recreate only synthetic/development Projects through the audited API so
  creator membership is correct.
- Deploy the reset/migration, server, web, and extension as one coordinated
  release. A mixed fleet with old broad-access server code or pre-`019` Project
  rows is unsupported.
- No content row, Capture source, current published snapshot/link, slug, public
  URL, cookie, or file layout changes.
- Existing Organization Owner compliance routes and cursors remain compatible.
  New Project cursors are scope-bound and cannot be exchanged with Organization
  cursors.
- Do not drop the old `org_user` `admin` CHECK literal silently. Migration
  preflight blocks actual unsupported rows; cleanup of the permissive schema
  literal may occur only with an explicit compatible migration decision.
- Record the reset/reseed and `019` refusal/rollback procedure in
  `docs/operations.md` and the coordinated-deploy/schema verification gate in
  `docs/production-readiness-checklist.md`. Do not describe a production-row
  compatibility path that this greenfield plan does not provide.

## TDD Implementation Order

Follow red-green-refactor for each boundary. Keep the smallest failing test
visible before implementation.

1. Shared constants/types and Access validation tests for exact role/status/
   lifecycle/request/response shapes.
2. Clean migration DB tests for table, FKs, active-owner rejection,
   same-Organization constraints, grants, indexes, CHECKs, existing-Project and
   unsupported legacy-role refusal, verifier selection/fallback, and populated
   DOWN refusal.
3. Pure capability-policy tests covering every role/capability cell and future
   seam name.
4. Authorization repository/service tests for Owner implicit access, active
   membership, hidden no/revoked/disabled/cross-tenant access, 403 vs 404,
   archived read plus archived child-mutation conflict, and no cross-request
   caching.
5. Project creation transaction tests: Owner no row, Member creator Admin row,
   no other Member, one Audit Event, membership child Change Item, and rollback.
6. Membership lifecycle service/audit/route/app/DB tests including target rules,
   disabled-assigned visibility/removal, reactivation, version conflicts,
   self-change, no-op, audit atomicity, Access denials, and immediate
   next-request revocation.
7. Project list/detail/settings tests and then each route family in the current
   capability matrix. Establish failing Viewer mutation and no-membership read
   tests before changing the service.
8. Access context/validator/DB CHECK tests for implicit Owner, three Project
   roles, null denied role, exact route action, resolved root, and unchanged
   fail-closed behavior.
9. Project compliance and Activity repository/service/route tests for scope,
   cursor binding, allowlist/redaction, unknown-action exclusion, role matrix,
   detail cross-Project 404, and Activity non-recursion.
10. Portal component/API/router tests for role labels, Admin controls, Editor
    Activity, Viewer read-only content, membership states, permission loss, and
    scope-correct compliance calls.
11. Extension tests for `purpose=capture`, Viewer exclusion, stale selection,
    mid-capture revocation, and retained error diagnostics.
12. DB smoke and real-browser validation; refactor only with the full focused
    set green.

## Verification Plan

### Focused automated checks

Run focused tests during development, including:

```sh
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/types test
rtk pnpm --filter @repo/audit-domain test
rtk pnpm --filter server test -- project-membership project-access project-activity project compliance access audit
rtk pnpm --filter web test -- ProjectMembershipSection ProjectActivityTimelinePage ComplianceTimelinePage ProjectListPage ProjectWorkspacePage ProjectSettingsPage ProjectCaptureSessionListPage CaptureSessionDetailPage ProjectGuideListPage GuideEditorPage GuidePreviewPage ProjectInteractiveDemoListPage InteractiveDemoEditorPage routes api App
rtk pnpm --filter extension test -- api helpers App
```

Use the repository's supported DB integration invocation/environment for:

- `foundation-schema.db.integration.test.ts`;
- `project-membership.db.integration.test.ts`;
- every changed Project/capture/Guide/Demo/Publish app integration test;
- `compliance.db.integration.test.ts`, `access.db.integration.test.ts`;
- `smoke/v1-workflows.db.integration.test.ts`.

Required DB scenarios:

- clean apply through `019`, verifier selection, empty DOWN fallback to the
  shipped evidence verifier, and clean synthetic rollback;
- named refusal for any existing Project row and unsupported Organization
  `admin` row, with no partial membership/evidence/schema-ledger state;
- cross-Organization Project/member/actor FK rejection;
- direct runtime insert/update/delete without correct Audit context rejected;
- active Owner membership rejected while revoked historical state remains
  non-authorizing;
- exact Access authorization CHECK and preserved scoped-success CHECK;
- runtime role has intended membership privileges and no destructive privilege;
- DOWN refuses both populated membership state and retained `project_role`
  Access Evidence without deleting either evidence kind;
- Audit and Access rows survive membership role change/removal and retain the
  historical actor/role context;
- concurrent version change produces one commit and one conflict.

### Broad checks

After focused tests and DB integration pass:

```sh
rtk pnpm lint
rtk pnpm check-types
rtk pnpm build
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
```

Run formatting on touched files only, then verify `git diff --check`. Do not
format unrelated user changes.

### Real browser and agent-browser validation

This child is browser-visible. Use the `dogfood-ossie` procedure and
`agent-browser` against local server/web processes with synthetic fixtures only.
Name and close the session, stop started services, and do not commit browser
profiles, cookies, tokens, private URLs, or screenshots.

Fixture matrix:

- Organization Owner;
- non-owner Project Admin;
- Editor;
- Viewer;
- active Organization Member with no membership;
- revoked membership;
- disabled Organization Member with a stored membership;
- second-Organization Project/member;
- at least one archived Project and enough Audit rows for pagination.

Required evidence:

1. Owner creates a Project and appears as immutable implicit Admin without a
   membership row.
2. Non-owner creates a Project and is explicit Admin; another Member cannot see
   it.
3. Admin loads membership roster, assigns Editor/Viewer, changes a role,
   cancels and confirms removal, handles a synthetic stale-version conflict,
   sees/removes a disabled assigned Member without being able to reactivate or
   change that role, and sees immediate permission loss after
   self-demotion/removal.
4. Editor can capture/author/publish and open Activity, but direct Settings,
   Membership, and raw compliance requests are 403.
5. Viewer can navigate and read Capture/Guide/Demo content, downloads, archived
   content, and current publish status; no mutation controls are keyboard-
   reachable, direct mutation is 403, and Activity/compliance are forbidden.
   Admin/Editor can also read an archived Project, but archived child-content
   controls are absent and a direct mutation produces `409 project_archived`.
6. No-membership/revoked/cross-tenant users receive the same Project-not-found
   UI/API behavior and cannot infer names or roster data.
7. Project Admin raw compliance contains only that Project and cannot fetch a
   detail from another Project; Owner Organization timeline still works.
8. Activity shows only curated fields/actions, handles empty/load-more/error,
   and never shows raw Access or membership/security evidence.
9. Access Evidence writer behavior is observed through real successful and
   denied requests; console has no uncaught errors and network has no unexpected
   failed requests.
10. Desktop and approximately `390x844` narrow viewport; 200% zoom/reflow;
    keyboard-only navigation, visible focus, labels, announcements, membership
    dialog focus return, and no horizontal page overflow.
11. Loading, empty, API error/retry, forbidden, hidden/not-found, conflict,
    revoked role, and destructive confirmation states.
12. Extension unit/build evidence is mandatory. If the environment supports a
    real unpacked extension, validate Admin/Editor-only Project selection and
    mid-capture revocation. If agent-browser cannot control the toolbar, record
    that capability as blocked and do not substitute a normal web page or claim
    a real extension pass.

The child `114` injected-failing-writer browser scenario may remain blocked by
the same harness limitation, but server/app tests for zero-byte fail-closed
protected responses must remain green.

## Acceptance Criteria

- No non-owner can discover or access a Project without an active membership.
- Owner implicit access and Member creator Admin bootstrap are transactional and
  do not create Owner membership rows or broad grants.
- Every current private route matches the central Admin/Editor/Viewer matrix,
  with consistent hidden 404 and known-member 403 behavior.
- Membership lifecycle is same-Organization, optimistic-concurrency safe,
  audited atomically, and immediately effective on subsequent requests.
- Project-role Access Evidence passes domain/database validation without
  weakening child `114` exact route, resolved-root, or fail-closed guarantees.
- Project Admin can inspect Project-only raw compliance; Editor receives curated
  Activity only; Viewer receives neither raw evidence nor Activity.
- Viewer current content is genuinely readable without mutation affordances;
  no UI falsely claims future Revision/Publication history exists.
- Archived Project child content is effectively read-only for every role while
  Project administration/restoration and existing public links retain their
  accepted behavior.
- Public Publish Links behave exactly as before and never require membership.
- Portal and extension lists contain only authorized/capture-capable Projects as
  applicable, and server enforcement is independently tested.
- clean migration, focused, DB, smoke, broad, and required real-browser checks
  pass or an unavailable environment capability is recorded honestly.
- child `116` can reuse one tested Project authorization interface without
  adding route-local role checks.

## Commit Strategy

After each slice is green, use explicit-path staging and keep these logical
boundaries separate where practical:

1. `feat(server): add project membership persistence`
2. `feat(server): enforce project role authorization`
3. `feat(compliance): add project evidence views`
4. `feat(portal): add project membership experiences`
5. `feat(extension): filter capture projects by access`
6. `docs(plan): close project membership foundation`

Do not amend the planning checkpoint or another agent's commit. Reinspect
`git status --short` before every commit and exclude unrelated work.

## Delivery Checklist

Planning:

- [x] Confirmed children `112` through `114` and the starting baseline.
- [x] Re-read canonical domain decisions, master `005`, child `114`, current
      migrations, evidence seams, route families, portal, and extension state.
- [x] Defined exact schema/types, route contracts, behavior, security,
      permission, greenfield migration/reset, compatibility, test, browser,
      non-scope, and handoff boundaries.
- [x] Resolved Viewer history as a later relational-model handoff without
      changing accepted semantics.
- [x] Rechecked against shipped child `114` and corrected migration evidence,
      verifier selection, archived Project, disabled-member, route-classification,
      and malformed schema/table assumptions.
- [x] Confirmed no critical domain decision or grill is required before
      implementation.

Implementation and closeout:

- [ ] Record implementation start commit and worktree ownership.
- [ ] Add shared contracts and additive migration through TDD.
- [ ] Implement central Project authorization and membership lifecycle.
- [ ] Enforce all current private Project routes and evidence paths.
- [ ] Implement Project compliance, curated Activity, portal, and extension
      behavior.
- [ ] Pass focused, DB, smoke, broad, and real-browser verification.
- [ ] Recheck implementation against this plan and master `005` until clean.
- [ ] Update status, implementation log, verification record, leftovers, and
      parent completed items together.
- [ ] Commit only attributable changes in small logical commits.

## Implementation Log

Not started. This expansion changes documentation only.

## Verification Record

Planning verification only:

- inspected the clean `46c44c9` baseline, current migrations through `018`,
  Project/auth/Organization schemas and contracts, Audit/Access registries and
  validators, compliance query/API/UI, all current private Project route
  families, portal routing/pages, and extension Project selection;
- reconciled the plan with `CONTEXT.md`, ADRs `0015`, `0023`, `0024`, and
  `0025`, child `111` accepted capability/timeline decisions, completed child
  `114`, and master `005`;
- implementation-readiness recheck removed an unsafe existing-Project backfill
  that contradicted master `005`'s greenfield reset/reseed boundary and would
  have violated ADR `0023` if left unaudited; it now uses an explicit non-empty
  Project refusal and requires any future approved data migration to use system/
  migration Audit Evidence;
- recheck also aligned `019` with shipped `verify_evidence_schema`/`migrate.ts`,
  preserved exact Access route/action context, added the archived-Project
  read-only wrapper, made disabled assigned Members explainable/removable, and
  repaired malformed schema/table examples;
- no runtime tests, database migration, build, or browser validation is claimed
  by this planning-only update.

## Leftovers And Handoff

Implementation starts from migration `019` and must preserve all completed
child `114` invariants. Reinspect the baseline and uncommitted work before the
first code change.

On successful closeout, hand child `116`:

- the stable `ProjectAccess` DTO and central authorization interface;
- the tested future `project_version.manage` policy cell without a shipped
  Project Version route;
- creator/Owner behavior and membership-aware Project fixtures;
- same-Organization relational FK and audit/access registration patterns;
- immediate query-time revocation semantics;
- Project Admin raw compliance and Editor Activity scope;
- the explicit reminder that Project Versions inherit Project Membership and do
  not create per-version membership rows.

Hand children `118` through `120` the deferred Viewer Revision/Publication
history requirement. They must implement it from the accepted relational
Edition/Revision/Publication models, reuse `artifact.read`/
`publication.read`, and keep raw Audit/Access and Editor Activity unavailable to
Viewer.

Do not advance master `005` or mark child `115` complete merely because this
plan is implementation-ready.
