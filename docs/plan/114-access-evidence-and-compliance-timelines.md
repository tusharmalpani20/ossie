# Child Plan 114: Access Evidence And Compliance Timelines

Date reserved: 2026-07-12

Date expanded: 2026-07-19

Last rechecked: 2026-07-19

Status: Complete after close-previous audit on 2026-07-19. Implementation,
focused/database/smoke/broad verification, and the available real-browser matrix
passed; unavailable extension and injected-writer browser capabilities are
recorded explicitly below.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Predecessor:

- `docs/plan/113-existing-mutation-audit-coverage.md`

Starting implementation baseline:

- Git commit `27d257972ade99833652a65dfbec72cc09909810`
  (`docs(plan): close mutation audit coverage`).
- The working tree was clean when this plan was expanded.
- Recheck the commit and worktree immediately before implementation. Preserve
  any later user or agent changes and update plan-era file assumptions before
  coding.

## Goal

Record meaningful logical-resource access separately from mutation Audit
Evidence, fail closed before protected content leaves the API when Access
Evidence cannot be appended, and provide the first Organization Owner-only
combined Audit/Access compliance timeline.

This child establishes the evidence model and current Owner authorization
boundary. It does not implement Project Membership or expose raw evidence to
current non-owner Organization Members.

## Sequence Gate And Current Facts

The predecessor gate is satisfied:

- Child `112` created `audit_schema.audit_event` and
  `audit_schema.audit_change_item`, typed `@repo/audit-domain` contracts, the
  shared audited-transaction runner, append-only triggers/grants, distinct
  runtime and maintenance roles, catalog verification, and the clean pre-live
  migration boundary.
- Child `113` converted all 53 current logical mutation commands, populated
  `AUDIT_COVERAGE_REGISTRY`, enabled repository-wide INSERT/UPDATE guards in
  migration `016`, and closed with focused, database, smoke, type, lint, build,
  and diff verification.
- Current migrations end at
  `016_existing_mutation_audit_coverage.sql`.
- Current request source detection maps exact `X-Ossie-Client: extension` to
  `extension` and all other browser requests to `web`; it never trusts an
  arbitrary caller-supplied source value. The exact header is still a normalized
  client claim, not cryptographic extension attestation; evidence and UI must not
  present it as unspoofable provenance.
- Current authorization has only Organization `owner | member`. There is no
  Project Membership table or Project role evaluator yet. Existing Organization
  Members still have broad Project access until child `115` changes it.
- There is no Audit query API, Access Event persistence, compliance API, or
  compliance UI today.
- `app.ts` currently constructs the default authentication service once for the
  authentication routes and a second time for downstream route auth when no
  service is injected. Access context must not depend on which instance handled
  the request; child `114` should construct/wrap one default instance and reuse
  it consistently without changing session behavior.
- The portal uses a custom pathname parser and page-local request state; no
  router, query library, table library, or new UI dependency is justified here.

Next child:

- `115-project-membership-foundation.md`, only after the schema, meaningful-path
  coverage, Owner timeline boundary, fail-closed tests, and browser validation
  in this child pass.

## Canonical Decisions Applied

This plan applies, without reopening:

- `CONTEXT.md`: an Access Event is a logical access or attempted access record,
  separate from an Audit Event; Organization Owners may inspect Organization-wide
  evidence; future Project roles receive narrower visibility.
- ADR `0015`: Organization-owned evidence uses `org_user.id` for an authenticated
  actor and preserves the Organization tenant boundary.
- ADR `0023`: meaningful protected reads, public-link views, downloads,
  authentication outcomes, authorization denials, and extension API access are
  append-only evidence; transport noise is not; mutations and their evidence are
  atomic, while protected reads persist evidence before content is returned.
- ADR `0024`: do not invent Project Admin, Editor, or Viewer behavior before
  child `115`; leave one explicit extension boundary for it.
- ADR `0025`: core evidence persistence is explicit relational data. Access
  Evidence must contain no JSON/JSONB or generic metadata column.

No new domain grill is required. The choices below are reversible implementation
details inside the accepted boundary.

## Scope

### Included

- One relational `audit_schema.access_event` table and one validated writer.
- Request-local, server-derived access context for source, route template,
  authenticated actor, resolved tenant/resource, and safe public surface.
- An exhaustive route classification/coverage registry that classifies every
  current API operation as meaningful, conditional, or excluded.
- Access Events for:
  - successful authenticated protected GETs;
  - public Publish Link reader and embed views;
  - authenticated and public file/export downloads;
  - login, logout, first-run setup, invite acceptance, and public-link password
    session outcomes;
  - safely Organization-attributed 401/403 authorization outcomes and accepted
    404/410/error outcomes on classified domain routes;
  - successful extension reads and successful extension mutation API access.
- Atomic Access Evidence for successful state-changing authentication/onboarding
  outcomes and successful extension mutations, reusing the existing audited
  transaction.
- Pre-response Access Evidence for successful protected/public reads and safely
  Organization-attributed standalone failed attempts.
- An Organization Owner-only, tenant-scoped, cursor-pageable combined Audit and
  Access Evidence API.
- An Organization compliance timeline page with totals, kind filtering,
  expandable typed Audit changes, access context, and Load More pagination.
- Operational backup/restore and storage-growth guidance for both evidence
  kinds.
- Tested seams for child `115` to add a Project authorization scope without
  weakening the current Owner boundary.

### Explicit non-scope

- Project Membership persistence, Project Admin/Editor/Viewer permissions, or
  current Project discovery changes; child `115` owns them.
- The curated Editor Activity Timeline or Viewer Revision/Publication history;
  child `115` owns their permission/read-model additions after Project roles
  exist.
- Project Version, Artifact Edition, Revision, Publication, Documentation, or
  Video implementation.
- Timeline export, CSV, bulk download, external SIEM/webhook delivery, scheduled
  reports, alerting, search, saved filters, or analytics dashboards.
- Automatic expiry, retention windows, selective deletion, legal purge, tenant
  self-service evidence deletion, or an application cleanup command.
- Cryptographic anchoring, external signatures, WORM storage, superuser-proof
  claims, or any compliance certification claim.
- Capturing IP addresses, user agents, referrers, raw URLs, query strings, search
  text, request/response bodies, cookies, bearer tokens, invite tokens, Publish
  Link slugs, viewer tokens, passwords, content, capture input, storage keys, or
  file bytes.
- Range-request reconstruction. Current file routes do not implement range
  delivery; if range support appears concurrently, do not emit one event per
  range chunk. Stop and reconcile a single logical-download boundary.
- Replacing the custom portal router, introducing a data-fetching library,
  redesigning the application shell, or broad visual-system work reserved for
  children `121` and `122`.
- Rewriting migrations `001`-`016`, backfilling historical read events, or
  fabricating evidence for activity before migration `017`.

## Access Event Domain Contract

Add a distinct Access contract under `@repo/audit-domain`. Reuse this package
because Audit and Access share one evidence boundary, safe label rules,
append-only persistence, and compliance read model. Put the stable Access literal
sets in `@repo/constants` because both the domain validator and public Zod
contracts consume them; this avoids copying enums or making the lower-level
`@repo/types` package depend on a domain package. Add the existing workspace
`@repo/constants` dependency to `@repo/audit-domain`. Creating a new workspace
package would add release surface without an independent domain boundary. Do not
rename `@repo/audit-domain` in this child.

### Literal sets

Define and export these exact literals from `@repo/constants/access` and re-export
their types from the package root. `@repo/audit-domain` uses them in
`AccessEvent`; `@repo/types/compliance` uses them in Zod enums:

```ts
export const ACCESS_ACTOR_TYPES = ["org_user", "anonymous", "system"] as const;
export const ACCESS_SOURCE_TYPES = [
  "web",
  "extension",
  "api",
  "system",
] as const;
export const ACCESS_OUTCOMES = [
  "succeeded",
  "denied",
  "not_found",
  "failed",
] as const;
export const ACCESS_SURFACES = [
  "portal",
  "extension",
  "api",
  "public_reader",
  "public_embed",
  "download",
  "authentication",
  "compliance",
] as const;
export const ACCESS_AUTHORIZATION_TYPES = [
  "organization_role",
  "public_link",
  "public_link_password",
  "public_secret",
  "authentication",
  "system",
] as const;
export const ACCESS_REASON_CODES = [
  "unauthenticated",
  "invalid_credentials",
  "forbidden",
  "not_found",
  "gone",
  "invalid_request",
  "conflict",
  "internal_error",
] as const;
```

`ACCESS_SOURCE_TYPES` is deliberately narrower than Audit sources. Import and
migration are mutation sources, not interactive access sources. `web` versus
`extension` remains server-derived from the exact existing client header;
`api` and `system` are reserved typed seams and must not be accepted from an
arbitrary request header.

### `AccessEvent`

```ts
type AccessEvent = {
  id: string;
  organization_id: string;
  project_id: string | null;
  root_resource_type: string;
  root_resource_id: string | null;
  action: string;
  source_type: AccessSourceType;
  actor_type: AccessActorType;
  actor_org_user_id: string | null;
  actor_label: string;
  request_id: string | null;
  http_method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | null;
  route_template: string | null;
  access_surface: AccessSurface;
  authorization_type: AccessAuthorizationType;
  authorization_role: "owner" | "member" | null;
  outcome: AccessOutcome;
  reason_code: AccessReasonCode | null;
  response_bytes: number | null;
  occurred_at: string;
};
```

Rules:

- `organization_id` is required. Access Evidence is Organization-owned and uses
  the accepted Organization-lifetime retention/query boundary. Never invent a
  tenant by retaining, hashing, or globally resolving raw email, slug, invite
  token, path ID, or another secret-bearing/untrusted input.
- When login finds an active identity but password verification fails, the
  resolved Organization may be retained, but the actor remains `anonymous`,
  `actor_org_user_id` remains null, and no email/User/Org User identifier is
  stored. The Organization Owner can therefore see an attributed denied login
  attempt without learning the attempted credential value.
- An unknown login identity, missing/invalid session, unresolved invite token or
  Publish Link slug, pre-Organization setup/rate-limit rejection, and anonymous
  compliance request have no safe Organization owner and therefore create no
  Access Event. They remain outside this product evidence model; existing
  operational logging/rate limiting is not expanded here and no raw input from
  it may be copied into Access Evidence. This is an explicit meaningful-access
  exclusion, not a fabricated tenant event. Once an internal identity, link,
  invite, session, or authenticated caller safely establishes an Organization,
  accepted success/denial/not-found outcomes are Access Evidence.
- `project_id` requires `organization_id`; store it only after a service or
  audited mutation has proved the Project belongs to that Organization.
- `root_resource_id` is nullable for unresolved attempts. Never copy an
  unvalidated path parameter into evidence after a 401/404/410 outcome. A
  successful service result or trusted Audit Event may populate it.
- `actor_type = org_user` requires both tenant scope and
  `actor_org_user_id`. `anonymous` and `system` require a null actor ID.
- Actor labels are historical display evidence. Use the existing safe label
  normalization for an authenticated display name, fixed `anonymous` for an
  anonymous caller, and an allowlisted technical label for `system`; do not
  store email addresses.
- HTTP events require `request_id`, `http_method`, and the Fastify route template.
  Store `/api/v1/public/publish-links/:slug`, never the resolved URL or slug.
- `reason_code` is one of `ACCESS_REASON_CODES`, not an exception message. Do not
  persist arbitrary error `message`, stack, SQL detail, or response payload.
  `access_evidence_unavailable` is an HTTP error type only: when persistence is
  unavailable there is, by definition, no Access row in which to store it.
- `authorization_type` records the policy basis used for the decision, not merely
  the transport. Current protected access uses `organization_role` with the
  server-resolved current `owner | member` in `authorization_role`; public link,
  password-authorized public link, invite-token, login/setup, and system access
  use the corresponding type with a null role. A denied
  public-link attempt may still use `public_link` or `public_link_password` after
  trusted link resolution. Unresolved anonymous attempts are not persisted.
- `authorization_role` is historical decision context, never an authorization
  input. Child `115` must add Project-role literals and constraints through a
  migration when Project Membership ships; child `114` must not persist future
  Project Admin/Editor/Viewer roles early.
- `response_bytes` is a non-negative integer only for successful logical
  downloads when the service already knows the complete size. It is null for
  JSON reads, errors, and unknown sizes.
- No generic context map is permitted. Future context requires a named typed
  column and migration.

### Validation and failure type

Add `validate_access_event` and `AccessDomainError`, following existing Audit
validation/error patterns. Validation must reject:

- unknown literals; the app-local writer separately rejects actions not present
  in the app-local access registry so the domain package does not depend on a
  server module;
- control characters, blank/oversized strings, and malformed IDs/timestamps;
- inconsistent actor/tenant/project/resource combinations;
- inconsistent authorization type/role/outcome combinations;
- raw paths or route templates containing `?`, `#`, or credentials; the
  app-local writer additionally requires exact equality with the matched
  registry template so a concrete path value cannot be substituted;
- non-download byte counts and negative/non-safe integer byte counts;
- missing Organization ownership;
- suspicious field names or any extra generic payload.

Map persistence/validation failure to one stable internal
`access_evidence_unavailable` error. Do not expose database details.

## Relational Persistence And Migration `017`

Create:

- `apps/server/src/db/migrations/017_access_evidence_and_compliance_timelines.sql`

The UP migration adds `audit_schema.access_event` owned by the maintenance role.
Use explicit columns matching `AccessEvent`; no JSON/JSONB, array, hstore, or
generic metadata column.

Required database behavior:

- `id VARCHAR(26)` primary key and ULID generated by the application.
- Non-null `organization_id`; nullable `project_id`, `root_resource_id`, actor
  ID, request transport fields, reason, and response bytes exactly as allowed by
  the domain rules above.
- Composite restrictive Project and Org User foreign keys reuse the unique
  `(id, organization_id)` keys established by migration `015`.
- The Organization FK is `ON DELETE RESTRICT`; Project and Org User composite
  FKs are also restrictive. No evidence FK may cascade.
- Named CHECK constraints mirror actor, source, outcome, surface, authorization
  type/role, transport, scoped-success, string, and response-byte rules.
  Application validation and DB constraints are both required.
- Add a unique `(id, organization_id)` key only if required by a future inbound
  evidence relation; do not add an inbound relation in this child.
- Add indexes:
  - `(organization_id, occurred_at DESC, id DESC)` for the Owner cursor;
  - `(organization_id, project_id, occurred_at DESC, id DESC)` for child `115`;
  - `(organization_id, actor_org_user_id, occurred_at DESC, id DESC)`;
  - `(organization_id, root_resource_type, root_resource_id, occurred_at DESC, id DESC)`;
  - `(request_id)` with a partial predicate for non-null values.
- Reuse `audit_schema.reject_audit_mutation()` and
  `audit_schema.reject_audit_truncate()` for append-only UPDATE/DELETE/TRUNCATE
  triggers on `access_event`. The names may remain Audit-prefixed because they
  already protect the shared evidence schema; do not duplicate equivalent
  bypass functions.
- Runtime role: `USAGE` on `audit_schema`, `SELECT, INSERT` on
  `access_event`, and no UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER privilege.
  Maintenance role remains owner. Runtime must not inherit maintenance.
- Preserve all three real installed-schema states. Keep
  `verify_audit_core_schema` valid for migration `015` only and
  `verify_audit_schema` valid for comprehensive Audit migration `016`. Add
  `verify_evidence_schema`, which first requires the `016` verifier and then
  requires the `017` Access table, columns, constraints, indexes, triggers,
  ownership, grants, and absence of JSON/JSONB anywhere in `audit_schema`.
  Update `migrate.ts` to select the verifier from the executed migration ledger:
  `015 -> core`, `016 -> comprehensive Audit`, and `017 -> full evidence`.
  Retain the existing `audit_schema` status key for CLI compatibility; after
  `017`, `ready` means the complete shared Audit/Access schema passed.

Migration and rollback rules:

- `017` is additive and does not require the empty-schema refusal used by `015`.
  Existing development data can migrate; historical reads remain absent and
  must not be synthesized.
- Do not rewrite `015` or `016`.
- UP is transactional through the existing migrator.
- DOWN must refuse while `access_event` contains rows, then remove only the
  Access table/triggers and its additions to schema verification. It must not
  drop `audit_schema`, Audit rows, mutation guards, or accepted unique keys.
- After an empty disposable `017` DOWN, migration status must select and pass the
  unchanged `016` comprehensive Audit verifier. After the existing `016` DOWN,
  the `015` core verifier must still pass. This preserves the rollback-readiness
  contract inherited from child `113`.
- Because V1 has no evidence deletion command, a populated real instance is not
  expected to roll back destructively. Disposable development/test databases
  may reset/reseed; an operator must back up and make any exceptional maintenance
  decision outside application runtime.

Closeout recheck found that the planned scoped-success database invariant was
missing after `017` had already shipped. It is corrected compatibly by additive
`018_access_evidence_constraint_hardening.sql`, which requires a resolved
`root_resource_id` for every successful Access Event. `018` does not rewrite
`017`, change retained rows, or add a destructive rollback path; its DOWN drops
only that named CHECK.

## Request Context, Coverage Registry, And Write Timing

### Request-local context

Add a separate mutable request-local Access context rather than overloading the
immutable Audit mutation context. It contains only:

```ts
type AccessRequestContext = {
  request_id: string;
  source_type: "web" | "extension";
  route: AccessRouteRegistration | null;
  auth: {
    organization_id: string;
    org_user_id: string;
    actor_label: string;
    organization_role: "owner" | "member";
    auth_session_id: string;
  } | null;
  resolved_resource: {
    organization_id: string;
    project_id: string | null;
    root_resource_type: string;
    root_resource_id: string;
  } | null;
  public_surface: "public_reader" | "public_embed" | null;
  atomic_access_event_id: string | null;
};
```

Register the access coverage lookup before requests are accepted. The first
Fastify `onRequest` hook—before the existing rate-limit hook—creates the context
and resolves the registration from Fastify's already-matched `routeOptions`, not
from the raw URL. Do not defer registration to `preHandler`: schema validation
and rate-limit responses can complete before `preHandler` and still require an
explicit classified event-or-no-event decision. Service callbacks may only add
trusted auth/resource facts; they never receive or retain raw secrets.

Extend the authentication service builder with optional callbacks:

- `on_auth_context_resolved(auth)` after a valid current session is resolved;
- `on_login_identity_resolved(identity)` after a known login identity is found,
  before password comparison.

In `app.ts`, construct the default authentication service once with these
callbacks and reuse it for `/authentication/*` plus every downstream auth
dependency. When tests inject an `authentication_session_service`, wrap its
successful `get_current_auth_context`/`login` results to populate Access context;
an injected denial with no resolved identity remains intentionally
unattributable. Do not make route tests implement Access-only methods or perform
duplicate session touches.

Extend the public Organization invite and Publish service builders with optional
callbacks invoked after a token/slug has resolved to an internal row. These
callbacks populate trusted Organization/Project/root facts. They must not change
the existing public DTOs or put internal IDs into public responses.

The current Publish repository's active-link lookup makes a revoked link
indistinguishable from an unknown slug. Add a minimal internal access-context
lookup (or safely widen the internal row lookup with an explicit active-status
guard) so an existing revoked link supplies only Organization, Project, Publish
Link ID, status/visibility/password policy, and no snapshot/content. Preserve the
current public revoked/not-found response exactly. Record the resolved revoked
attempt as `denied`/`gone`; a truly unknown slug still creates no Access Event.
Never persist the lookup slug or expose this internal distinction to the public
caller.

### Safe reader/embed marker

Reader and embed pages currently call the same public API route. Add the exact
request header:

```http
X-Ossie-Access-Surface: public_reader | public_embed
```

Rules:

- Only the two exact values are accepted, only as a display-surface hint on
  public Publish Link reads. Unknown values fall back to the registry default
  `api`; they never cause a validation error or become arbitrary evidence data.
- Add `X-Ossie-Access-Surface` to the existing CORS allowlist. OPTIONS remains
  excluded evidence.
- The web reader passes `public_reader`; embed mode passes `public_embed`.
- Existing API clients that omit the header remain compatible and are recorded
  as `api`.

### Route coverage registry

Create an `ACCESS_ROUTE_COVERAGE_REGISTRY` with typed fields for method, route
template, logical action, root resolver, success policy, denial policy, surface,
and whether a successful mutation must append Access Evidence atomically.

Do not duplicate the 53 mutation route strings manually. Compose only the
POST/PUT/PATCH/DELETE route entries from `AUDIT_COVERAGE_REGISTRY`, then apply
explicit overrides for setup/authentication/invite/public-viewer outcomes. Do
not derive top-level Access entries from the route-less
`authentication.session.touch` command or the GET routes on
`publish.viewer_session.touch`; those are internal side-effect commands and the
public GET routes are classified independently below. A coverage test must
compare the composed registry to every OpenAPI operation and require each to be
one of:

- `meaningful_read`: append on successful response before content;
- `authentication_outcome`: append every safely Organization-attributed accepted
  outcome, atomically with a successful mutation when one occurs; leave an
  unknown identity/missing session as operational telemetry;
- `public_access`: append resolved success and accepted denial/not-found/gone;
- `extension_conditional`: append successful mutation API access only when the
  normalized source claim is `extension`, atomically with the mutation;
- `denial_only`: no successful web Access Event because Audit already explains
  the mutation, but append classified 401/403 and obscured 404 attempts;
- `excluded_transport`: intentionally no Access Event.

All current successful protected GET routes below are `meaningful_read`:

| Route                                                                                               | Logical action                           | Root                  | Surface          |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------- | ---------------- |
| `GET /api/v1/authentication/me`                                                                     | `authentication.session.viewed`          | resolved auth session | `authentication` |
| `GET /api/v1/projects`                                                                              | `project.list_viewed`                    | Organization          | portal/extension |
| `GET /api/v1/projects/:id`                                                                          | `project.viewed`                         | Project               | portal/extension |
| `GET /api/v1/organization/members`                                                                  | `organization.members_viewed`            | Organization          | `portal`         |
| `GET /api/v1/organization/invites`                                                                  | `organization.invites_viewed`            | Organization          | `portal`         |
| `GET /api/v1/projects/:project_id/capture-sessions`                                                 | `capture_session.list_viewed`            | Project               | portal/extension |
| `GET /api/v1/projects/:project_id/capture-sessions/:id`                                             | `capture_session.viewed`                 | Capture Session       | portal/extension |
| `GET /api/v1/projects/:project_id/capture-sessions/:id/detail`                                      | `capture_session.detail_viewed`          | Capture Session       | portal/extension |
| `GET /api/v1/projects/:project_id/capture-assets`                                                   | `capture_asset.project_list_viewed`      | Project               | portal/extension |
| `GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets`                      | `capture_asset.list_viewed`              | Capture Session       | portal/extension |
| `GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id`                  | `capture_asset.viewed`                   | Capture Asset         | portal/extension |
| `GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file`             | `capture_asset.downloaded`               | Capture Asset         | `download`       |
| `GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events`                      | `capture_event.list_viewed`              | Capture Session       | portal/extension |
| `GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id`                  | `capture_event.viewed`                   | Capture Event         | portal/extension |
| `GET /api/v1/projects/:project_id/guides`                                                           | `guide.list_viewed`                      | Project               | `portal`         |
| `GET /api/v1/projects/:project_id/guides/:guide_id`                                                 | `guide.viewed`                           | Guide                 | `portal`         |
| `GET /api/v1/projects/:project_id/guides/:guide_id/export/markdown`                                 | `guide.markdown_exported`                | Guide                 | `download`       |
| `GET /api/v1/projects/:project_id/guides/:guide_id/export/html.zip`                                 | `guide.html_exported`                    | Guide                 | `download`       |
| `GET /api/v1/projects/:project_id/interactive-demos`                                                | `interactive_demo.list_viewed`           | Project               | `portal`         |
| `GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id`                           | `interactive_demo.viewed`                | Interactive Demo      | `portal`         |
| `GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes`                    | `demo_scene.list_viewed`                 | Interactive Demo      | `portal`         |
| `GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots` | `demo_hotspot.list_viewed`               | Demo Scene            | `portal`         |
| `GET /api/v1/projects/:project_id/guides/:guide_id/publish`                                         | `guide.publish_status_viewed`            | Guide                 | `portal`         |
| `GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish`                   | `interactive_demo.publish_status_viewed` | Interactive Demo      | `portal`         |

Public/authentication classifications:

| Route                                                                  | Outcome/action contract                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/setup/first-run`                                         | `setup.first_run_completed`; success is atomic with setup Audit/mutation and scoped to the new Organization. Rejections before an Organization exists are operational telemetry, not Access Evidence.                                                                                           |
| `POST /api/v1/authentication/login`                                    | `authentication.login_succeeded` or `authentication.login_denied`; success is atomic with session creation; a known identity's denied password outcome is Organization-scoped and retains no email/password, while an unknown identity is unattributable telemetry and creates no Access Event. |
| `POST /api/v1/authentication/logout`                                   | `authentication.logout_succeeded` is atomic when an active session is revoked. The existing idempotent 204 for a missing/invalid/already-revoked token remains unchanged externally and creates no Access Event because no current Organization/actor can be established safely.                |
| `GET /api/v1/public/invites/:token`                                    | `organization.invite_viewed`; resolved success/denial uses the invite Organization/root ID; an unresolved token creates no Access Event.                                                                                                                                                        |
| `POST /api/v1/public/invites/:token/accept`                            | `organization.invite_accepted`; success is atomic with the existing Audit transaction/session creation; resolved rejected outcomes retain no token or email, while an unresolved token creates no Access Event.                                                                                 |
| `GET /api/v1/public/publish-links/:slug`                               | `publish_link.viewed`; resolved success or restricted/expired/revoked/password denial records reader/embed/API surface, link policy outcome, Organization, Project, and Publish Link root without slug/content. A truly unknown slug creates no Access Event.                                   |
| `POST /api/v1/public/publish-links/:slug/viewer-sessions`              | `publish_link.password_access_succeeded` or `publish_link.password_access_denied`; successful session creation is atomic with its Audit event.                                                                                                                                                  |
| `GET /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file` | `published_asset.downloaded`; resolved success or restricted/expired/revoked/password denial records Publish Link root and known complete bytes on success, never slug, storage key, or file path. A truly unknown slug creates no Access Event.                                                |

New compliance-route classifications:

| Route                                                              | Outcome/action contract                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/organization/compliance/events`                       | `compliance.timeline_viewed`; Owner success uses the Organization root and `compliance` surface. An authenticated member denial is Organization-scoped evidence; a missing/invalid session has no safe Organization and creates no Access row. |
| `GET /api/v1/organization/compliance/audit-events/:audit_event_id` | `compliance.audit_event_viewed`; Owner success uses the resolved Audit Event root. Missing/cross-tenant IDs return the same safe 404; the request event remains Organization-scoped but does not copy an unvalidated Audit Event ID.           |

Explicit exclusions:

- `GET /healthz`, `GET /readyz`;
- `GET /api/v1/public/instance` setup/status probe;
- `/documentation` and generated OpenAPI UI assets;
- frontend/extension static assets, browser navigation, favicon, and source maps;
- OPTIONS/CORS preflight;
- repository/internal SQL reads, session-touch internals, readiness queries, and
  mutation-guard/catalog checks;
- any future heartbeat/poll that is explicitly registered as transport noise;
- individual range chunks.

### Outcome and write-timing rules

1. The existing `run_audited_mutation` remains the sole transaction boundary for
   current mutations. Extend it once so a classified authentication/onboarding
   success or normalized extension-source mutation builds and writes its Access Event
   before COMMIT. The atomic decision must match both the normalized top-level
   route and the current `AuditCommandCoverage.command` against that route's
   explicit `atomic_commands`; HTTP method alone is insufficient. Mark the
   request-local atomic event ID only after the Access write succeeds; clear it
   on rollback. The later response hook must not duplicate it.
   Constrain the runner's current generic event to the already universal
   `AuditEvent` shape and call one Access companion helper after
   `write_audit_event`; do not add Access callbacks to all 53 adapters or open a
   second client/transaction.
2. Every authenticated route first performs the audited
   `authentication.session.touch`, including POST/PUT/PATCH/DELETE requests.
   That internal command has no top-level route and must never satisfy another
   route's `atomic_commands`. Public password reads similarly perform
   `publish.viewer_session.touch` inside GET routes. Add regression tests proving
   neither touch transaction emits or claims the route's Access Event; the real
   top-level command or later read response owns it.
3. Build atomic Access scope from the validated Audit Event and resolved request
   context, but do not blindly copy Audit actor semantics. In particular,
   `publish.viewer_session.create` correctly uses a `system` Audit actor for row
   maintenance while its password-attempt Access actor is `anonymous`. Login,
   setup, invite acceptance, logout, and extension commands may reuse the Audit
   Org User only where that person is the logical access actor.
4. A successful classified command that is a true no-op has no successful Audit
   Event and no business state to couple. It still represents extension or
   authentication API access: append one standalone Access Event in the response
   boundary before returning success. Do not fabricate an Audit Event merely to
   supply Access context.
5. For successful GET/public reads, obtain the domain result/stream first, then
   append the Access Event in Fastify `onSend` before serialized JSON or stream
   bytes are returned. The read query and event insert are separate transactions;
   evidence describes the completed authorization/read decision, not a mutation.
6. For classified, safely Organization-attributed failures, append a standalone
   event before returning the safe error. Do not copy the error payload. 401 ->
   `denied`, 403 -> `denied`, 404 -> `not_found`, 410 -> `denied` with `gone`,
   and accepted internal read failure -> `failed`. A 400/409 is evidence only
   when a classified authentication/onboarding/public-secret flow has already
   established trusted Organization/resource context (for example a resolved
   invite that is already accepted), using `invalid_request` or `conflict`.
   Validation-before-handler, ordinary business validation/conflict, rate-limit,
   missing-session, unknown-identity, and unresolved-secret responses create no
   Access Event.
7. If the Access insert fails, replace the pending response with HTTP `503` and
   `{ "error": { "type": "access_evidence_unavailable", "message": "Access evidence is temporarily unavailable" } }`.
   Do not return the protected JSON, export, or byte stream. If a stream has been
   opened, destroy/close it where supported. Guard against `onSend` recursion and
   do not claim an Access Event exists for the failed append.
8. A mutation whose atomic Access write fails rolls back both mutation Audit and
   business state through `run_audited_mutation`; it returns the same stable 503.
   Add a narrow global error-handler mapping for `AccessDomainError` so an atomic
   writer failure cannot fall through to the existing generic 500 shape. This
   mapping must not expose the original database/validation error and must be
   covered through `app.test.ts`.
9. Normal validation/conflict failures that are neither authentication nor
   authorization outcomes are not Access Events. Their successful mutations
   remain covered by Audit only.
10. One logical HTTP request creates at most one Access Event for the classified
    route. Public HTML/JSON view and each distinct full asset download are
    separate logical requests/events. Never emit an event per SQL query, React
    render, stream chunk, or retry internal to one request.

## Compliance API Contract

Add a combined cursor route and one bounded Audit detail route:

```http
GET /api/v1/organization/compliance/events
  ?limit=25
  &cursor=<opaque-base64url-cursor>
  &kind=all|audit|access
  &project_id=<optional-id>

GET /api/v1/organization/compliance/audit-events/:audit_event_id
```

Query rules:

- Authentication is required.
- Current `auth.org_user.role` must equal `owner`; current `member` receives
  `403 compliance_permission_denied`. Its safe message is “Only organization
  owners can view compliance evidence.” Anonymous receives the existing stable 401.
- The repository receives `organization_id` only from current auth, never from
  query input. Every Audit Event, Access Event, and Change Item join includes
  that Organization predicate.
- `limit` defaults to 25, minimum 1, maximum 50. Cursor input is limited to 2048
  characters before decoding. Invalid values, malformed IDs, malformed/oversized
  cursors, or cursor/filter mismatch return 400 without a data query.
- `kind` defaults to `all`. `project_id` is an optional narrowing filter for an
  Owner and a tested repository extension point for child `115`; it is not an
  authorization input. A cross-tenant/nonexistent ID simply yields no matching
  rows and is never copied into Access Evidence.
- Sort by `occurred_at DESC`, then `id DESC`, then evidence kind as a stable final
  tie breaker. Query `limit + 1` to determine `has_more`.
- Cursor payload version 1 contains the last visible `(occurred_at, id, kind)`
  plus the normalized `kind`/`project_id` filter fingerprint. Base64url is
  opaque transport, not authority or secrecy. Tampering cannot cross the
  server-enforced Organization/filter predicates.
- The cursor query returns an Audit `change_item_count`, not inline Change Items.
  Compute counts in the tenant/project-filtered SQL without an N+1 query.
- The response snapshot is queried before its own `compliance.timeline_viewed`
  Access Event is appended in `onSend`. Therefore that self-access appears on a
  later refresh, not recursively in the response that caused it. Cursor
  continuation remains stable because newly inserted events are newer than the
  last-item boundary.

Cursor response contract:

```ts
type ComplianceEventsResponse = {
  events: (ComplianceAuditEventSummary | ComplianceAccessEvent)[];
  page: {
    next_cursor: string | null;
    has_more: boolean;
  };
  totals: {
    audit_events: number;
    audit_change_items: number;
    access_events: number;
    oldest_occurred_at: string | null;
    newest_occurred_at: string | null;
  };
};
```

Common event fields:

```ts
type ComplianceEventCommon = {
  id: string;
  evidence_kind: "audit" | "access";
  organization_id: string;
  project_id: string | null;
  root_resource_type: string;
  root_resource_id: string | null;
  action: string;
  source_type: "web" | "extension" | "api" | "system" | "import" | "migration";
  actor_type: "org_user" | "anonymous" | "system";
  actor_org_user_id: string | null;
  actor_label: string;
  request_id: string | null;
  outcome: "committed" | AccessOutcome;
  occurred_at: string;
};
```

`ComplianceAuditEventSummary` additionally exposes `correlation_id`,
`idempotency_key_hash`, `before_row_version`, `after_row_version`, safe `reason`,
and `change_item_count`. The hash is the existing fixed lowercase SHA-256 digest,
never the raw idempotency key; exposing it only inside the Owner raw-evidence
boundary makes retry correlation inspectable without retaining the original
input.

The Audit detail route returns:

```ts
type ComplianceAuditEventDetailResponse = {
  event: ComplianceAuditEventSummary & {
    change_items: ComplianceAuditChangeItem[];
  };
};
```

Detail rules:

- Apply current authentication, current Owner role, and
  `organization_id = auth.organization.id` before returning the event or items.
- Return the existing stable 404 style for a missing/cross-Organization Audit
  Event; do not reveal whether another Organization owns the ID.
- Fetch all items for that one event in persisted order using both event ID and
  Organization scope. Verify the result count matches `change_item_count`; a
  mismatch is an internal evidence-integrity failure, never a partial response.
- Record `compliance.audit_event_viewed` before the detail response is returned.
  Like the list-view event, it appears only on a later cursor refresh.

Each compliance Change Item exposes only `id`, entity/parent/logical identity,
`operation`, nullable `field_name`/`value_type`, and typed `before`/`after`.
Define the value union exactly:

```ts
type ComplianceAuditState =
  | { state: "absent" | "null" | "redacted" | "present" }
  | {
      state: "value";
      value_type:
        | "text"
        | "identifier"
        | "decimal"
        | "date"
        | "timestamp"
        | "enum";
      value: string;
    }
  | { state: "value"; value_type: "integer"; value: number }
  | { state: "value"; value_type: "boolean"; value: boolean };
```

The repository reconstructs this union from the one matching typed SQL column
and rejects impossible/multiple-value-column rows as internal corruption. An
integer must remain a JavaScript safe integer; decimal remains the canonical
string already enforced by `@repo/audit-domain`. Row-only Change Items have null
field/value type and non-`value` states. Never return the sparse persistence
columns themselves or coerce redacted/present into a value.

`ComplianceAccessEvent` additionally exposes `http_method`, `route_template`,
`access_surface`, `authorization_type`, `authorization_role`, safe `reason_code`,
and `response_bytes`.

Use discriminated Zod schemas in `@repo/types/compliance`. The server must parse
database values into these DTOs; the web must consume the shared contract rather
than create a parallel page-local evidence shape.

Totals are Organization/project/kind-filter-scoped counts and min/max timestamps;
the Audit Change Item count joins through the already scoped Audit Event set and
never counts another tenant's items. They are logical evidence-volume metrics,
not physical PostgreSQL byte counts. Operator documentation separately supplies
physical table/index size queries.

The cursor remains bounded regardless of batch Change Item volume. Owners can
still inspect complete safe evidence through the detail route, while Access
Events require no second route because their complete safe context is already
bounded in the cursor item.

## Compliance UI Behavior

Add `/organization/compliance` to the custom route parser and setup guard. The
page uses existing primitives and CSS Modules.

Required behavior:

- Page title `Compliance timeline`, Organization context, a link back to
  Organization members, and an Organization members -> Compliance timeline link
  so the current owner workflow is discoverable without broad shell redesign.
- Kind filter: `All evidence`, `Audit`, `Access`. Changing it clears events and
  cursor, then reloads the first page.
- Totals for Audit Events, Audit Change Items, and Access Events; phrase them as
  retained evidence counts, not compliance/certification status.
- Reverse-chronological card/list rows with kind and outcome badges, action,
  actor label/type, source, time, root type/ID, optional Project ID, and request
  ID. IDs may be shown to Owners because this is the raw evidence boundary, but
  no content, token, URL, credential, storage key, or hidden payload exists in
  the DTO.
- Audit rows use accessible native disclosure (`details/summary`). On first open,
  fetch the one Audit detail route; cache the successful detail by event ID for
  the page lifetime and do not refetch on close/reopen. Show an in-row loading
  state and a scoped Retry on detail failure without collapsing/removing the
  summary. Render row versions, optional correlation/idempotency hashes, and
  ordered change items. Render `absent`, `null`, `redacted`, and `present` as
  states; render only typed `value` data. React escaping remains mandatory;
  never use raw HTML.
- Access rows disclose route template, surface, authorization basis/current role
  when present, safe reason code, and formatted byte count when present.
- Load More appends the next page, preserves existing rows while loading, and
  prevents duplicate clicks. End-of-list removes/disables the control.
- Initial loading, empty, initial error with Retry, incremental-load error with
  Retry, unauthenticated sign-in, and forbidden Owner-required states are
  distinct. A 403 must render no event/totals data.
- Extend `ApiClientErrorKind` with `forbidden`; do not treat 403 as generic or
  redirect it as unauthenticated.
- Dates use the existing local `Intl.DateTimeFormat` pattern and retain a machine
  readable `dateTime` value.
- Desktop and narrow layouts must reflow without a forced horizontal page
  scrollbar. Long action/ID/route values wrap safely. The filter, disclosure,
  Retry, Load More, links, and sign-out remain keyboard operable with visible
  focus.
- Do not add destructive controls; evidence has no delete/export action.

## Security, Permission, Privacy, And Tenant Rules

- The compliance service performs the current Owner check before any evidence
  query. Repository scoping is a second boundary, not a substitute.
- Current non-owner Organization Members have zero raw compliance API/UI access,
  even though they still broadly access Projects before child `115`.
- Public/anonymous consumers never receive a compliance route or evidence DTO.
  Anonymous actors exist only for resolved Organization-owned public/login
  evidence; there is no unscoped evidence store or operator/global query API.
- Historical actor IDs/labels remain evidence even if the current Org User later
  becomes inactive. Authorization for viewing always uses the caller's current
  role/session, not historical event role.
- Every FK that could delete scoped evidence is restrictive. Organization,
  Project, Org User, Publish Link, asset, or session deletion must never cascade
  evidence. Access stores root IDs as evidence identifiers rather than adding
  fragile FKs to every root table; Organization/Project/actor FKs enforce tenant
  safety.
- Route parameters are evidence only after trusted resolution. Denials must not
  confirm whether a cross-tenant resource exists.
- Public success context comes from internal repository rows before public DTO
  stripping. Never reparse a slug/token from a URL into evidence.
- The reader/embed header is a display hint, not an authorization decision.
- The Access writer accepts constructed typed events only; route bodies,
  arbitrary headers, client actor labels, client source types, and exception
  messages never reach persistence.
- Timeline API serialization must prove forbidden audit/access internals are
  absent, including raw idempotency keys, token hashes, password data, storage
  keys, raw page URLs, raw capture input, and JSON content. The existing
  `idempotency_key_hash` is allowed only in the Owner Audit DTO.
- Database superusers and infrastructure owners remain outside the runtime
  append-only guarantee. Documentation must not call this tamper-proof.

## Retention, Backup, And Growth

- Audit and Access Evidence is retained for the Organization lifetime;
  current restrictive FKs effectively prevent Organization deletion while
  evidence exists. No automatic or selective deletion is added.
- Extend `docs/operations.md` with:
  - backup/restore checks for `audit_schema.access_event`, triggers, constraints,
    grants, and rows;
  - runtime append-only verification for both evidence kinds;
  - an operator-only physical-growth query using
    `pg_total_relation_size`/`pg_indexes_size` for the three evidence tables and
    logical row-count query by evidence kind;
  - a warning that counts/bytes are capacity signals, not a retention cleanup
    authorization or certification statement;
  - migration `017` deploy/rollback behavior.
- Extend the production readiness checklist with Access Evidence backup,
  restore, growth baseline/alert ownership, fail-closed smoke, and Owner/non-owner
  checks.
- Keep future time partitioning possible by using immutable ULIDs, explicit
  `occurred_at`, no inbound Access Event FKs, and cursor semantics independent of
  physical partitions. Do not partition in V1. A future partition migration must
  preserve indefinite retention and cross-partition cursor order.

## Exact Affected Files

The implementation should create or modify only the files below unless current
code changes after this expansion require a directly related adjustment. Record
any deviation in the implementation log before committing it.

### Shared evidence and API contracts

Create:

- `packages/constants/src/access.ts`
- `packages/audit-domain/src/types/access-evidence.ts`
- `packages/audit-domain/src/policies/access-event-policy.ts`
- `packages/audit-domain/src/policies/access-event-policy.test.ts`
- `packages/types/src/compliance.ts`
- `packages/types/src/compliance.test.ts`

Modify:

- `packages/constants/src/index.ts`
- `packages/constants/src/constants.test.ts`
- `packages/audit-domain/package.json`
- `packages/audit-domain/src/index.ts`
- `packages/types/src/index.ts`
- `pnpm-lock.yaml` for the workspace-only dependency edge; no registry package
  version should change.

No new workspace package or external dependency is expected. The only package
edge is the existing workspace `@repo/audit-domain -> @repo/constants` dependency.

### Database and server evidence infrastructure

Create:

- `apps/server/src/db/migrations/017_access_evidence_and_compliance_timelines.sql`
- `apps/server/src/db/migrations/018_access_evidence_constraint_hardening.sql`
- `apps/server/src/modules/access/access-atomic.ts`
- `apps/server/src/modules/access/access-request-context.ts`
- `apps/server/src/modules/access/access-request-context.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/access/access.repository.ts`
- `apps/server/src/modules/access/access.repository.test.ts`
- `apps/server/src/modules/access/access-response-hook.ts`
- `apps/server/src/modules/access/access-response-hook.test.ts`
- `apps/server/src/modules/access/access.db.integration.test.ts`

Modify:

- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/common/helper_function/error_handler.helper.ts`
- `apps/server/src/db/audit-schema-verification.ts`
- `apps/server/src/db/audit-schema-verification.test.ts`
- `apps/server/src/db/migrate.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`
- `apps/server/src/modules/audit/audit-transaction.ts`
- `apps/server/src/modules/audit/audit-transaction.test.ts`
- `apps/server/src/modules/audit/audit-route-coverage.test.ts`
- `apps/server/src/modules/authentication/session.service.ts`
- `apps/server/src/modules/authentication/session.service.test.ts`
- `apps/server/src/modules/organization/organization-invites.service.ts`
- `apps/server/src/modules/organization/organization-invites.service.test.ts`
- `apps/server/src/modules/publish/publish.service.ts`
- `apps/server/src/modules/publish/publish.service.test.ts`
- `apps/server/src/config/cors.config.ts`
- `apps/server/src/config/cors.config.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
- `apps/server/package.json`

The existing individual protected route files should not need evidence calls;
the registry, auth/public resolution callbacks, audited transaction extension,
and response hook own this cross-cutting behavior. Do not scatter Access inserts
through Project/Capture/Guide/Demo route handlers. If a current route cannot
provide trusted root context through these seams, update only that route/service
and its focused tests, then record why.

### Compliance server module

Create:

- `apps/server/src/modules/compliance/compliance.repository.ts`
- `apps/server/src/modules/compliance/compliance.repository.test.ts`
- `apps/server/src/modules/compliance/compliance.service.ts`
- `apps/server/src/modules/compliance/compliance.service.test.ts`
- `apps/server/src/modules/compliance/compliance.routes.ts`
- `apps/server/src/modules/compliance/compliance.routes.test.ts`
- `apps/server/src/modules/compliance/compliance.db.integration.test.ts`

Modify:

- `apps/server/src/app.ts`
- `apps/server/package.json` to add both new DB integration files to `test:db`.

### Public surface attribution

Modify:

- `apps/server/src/modules/publish/publish.repository.ts`
- `apps/server/src/modules/publish/publish.repository.test.ts`
- `apps/server/src/modules/publish/publish.routes.test.ts` only if the internal
  service return shape fixture requires its trusted context seam.
- `apps/server/src/modules/organization/organization-invites.routes.test.ts`
  only if its internal service fixture requires the trusted context seam.
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/features/guide/PublicGuideReaderPage.tsx`
- `apps/web/src/features/guide/PublicGuideReaderPage.test.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.tsx`
- `apps/web/src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx`

Do not expose internal Organization/Project/Publish Link identifiers in the
existing public response contracts.

### Compliance portal

Create:

- `apps/web/src/features/compliance/ComplianceTimelinePage.tsx`
- `apps/web/src/features/compliance/ComplianceTimelinePage.module.css`
- `apps/web/src/features/compliance/ComplianceTimelinePage.test.tsx`

Modify:

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/src/lib/routes.test.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/features/organization/OrganizationMembersPage.tsx`
- `apps/web/src/features/organization/OrganizationMembersPage.module.css`
- `apps/web/src/features/organization/OrganizationMembersPage.test.tsx`

Do not modify shared UI primitives unless an existing primitive has a proven
accessibility defect that blocks this page; surface that defect rather than
folding a broad primitive redesign into this child.

### Operations and plan closeout

Modify during implementation/closeout:

- `docs/operations.md`
- `docs/production-readiness-checklist.md`
- `docs/system-design-pattern.md` only to describe Access Evidence as shipped,
  without claiming child `115` role behavior exists.
- `docs/plan/114-access-evidence-and-compliance-timelines.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
  only for completed child `114` facts/checklist/status.

Do not update `CONTEXT.md` or ADRs unless implementation uncovers a true durable
semantic contradiction. The expansion found none.

## Implementation Order And TDD Slices

Use red-green-refactor for each behavior boundary:

1. Add failing domain validation tests, then Access literal/types/validation.
2. Add failing migration/schema tests, then migration `017`, triggers, grants,
   indexes, and catalog verification.
3. Add failing writer tests, then the Access repository and stable persistence
   error mapping.
4. Add failing request-context and registry tests, then trusted route/source/auth/
   public-resource context and exhaustive OpenAPI classification.
5. Add failing atomic transaction tests, then extend `run_audited_mutation` for
   successful authentication/onboarding and extension-mutation Access Events.
6. Add failing response-hook tests for success, denial, exclusion, duplicate
   prevention, stream fail-closed, and 503 recursion safety; then wire the hook.
7. Add focused service tests for known/unknown login identity and resolved public
   invite/Publish Link context; then add optional callbacks and the reader/embed
   marker.
8. Add failing shared compliance-contract tests, then the Zod DTOs.
9. Add failing compliance repository/service/route tests for Owner auth, tenant
   isolation, cursor semantics, totals, bounded summaries, Audit detail integrity,
   and self-access timing; then implement and wire both routes.
10. Add failing web API/parser/page tests, then the compliance page, organization
    link, loading/error/permission/pagination behavior, and responsive CSS.
11. Run DB integration and smoke tests, correct only child-scoped defects, then
    perform real-browser validation with synthetic local fixtures.
12. Update operations docs and both plan records only after acceptance passes.

## Test And Verification Plan

### Focused package/unit tests

Run at minimum:

```bash
rtk pnpm --filter @repo/audit-domain test
rtk pnpm --filter @repo/constants test
rtk pnpm --filter @repo/types test
rtk pnpm --filter server test -- \
  src/modules/access/access-request-context.test.ts \
  src/modules/access/access-coverage-registry.test.ts \
  src/modules/access/access.repository.test.ts \
  src/modules/access/access-response-hook.test.ts \
  src/modules/audit/audit-transaction.test.ts \
  src/modules/audit/audit-route-coverage.test.ts \
  src/modules/compliance/compliance.repository.test.ts \
  src/modules/compliance/compliance.service.test.ts \
  src/modules/compliance/compliance.routes.test.ts \
  src/modules/authentication/session.service.test.ts \
  src/modules/organization/organization-invites.service.test.ts \
  src/modules/publish/publish.service.test.ts \
  src/config/cors.config.test.ts \
  src/app.test.ts
rtk pnpm --filter web test -- \
  src/lib/api.test.ts \
  src/lib/routes.test.ts \
  src/features/compliance/ComplianceTimelinePage.test.tsx \
  src/features/organization/OrganizationMembersPage.test.tsx \
  src/features/guide/PublicGuideReaderPage.test.tsx \
  src/features/interactive-demo/PublicInteractiveDemoViewerPage.test.tsx \
  src/App.test.tsx
```

Confirm the actual package name used to filter `@repo/audit-domain`; if pnpm
requires its workspace name from `package.json`, record the exact successful
command rather than claiming the illustrative filter passed.

Focused assertions must include:

- all actor/source/outcome/surface, required Organization ownership, and nullable
  Project/root/actor/transport invariants;
- forbidden/oversized/control-character/raw-route data rejection;
- success/denial/not-found/gone/error mappings plus explicit no-event behavior
  for rate-limited or otherwise unattributable attempts;
- no email/password/token/slug/raw URL/body/user-agent/IP/referrer/search/content
  persistence;
- exhaustive OpenAPI classification and explicit transport exclusions;
- one event per logical request; no session-touch duplicate on either GET or
  authenticated mutation routes; exact top-level route/command matching;
- valid-session logout evidence versus no fabricated event for idempotent
  missing/invalid-session logout;
- public viewer-session Audit `system` actor versus Access `anonymous` actor;
- atomic rollback of business mutation + Audit + Access on Access write failure;
- protected JSON and stream fail-closed with no leaked body/bytes;
- public, restricted, expired, revoked, truly unknown, password-required,
  password-denied, password-accepted, reader, embed, and published-asset paths;
- normalized exact extension claim versus omitted/unknown header behavior, plus
  an explicit assertion that the evidence does not claim header attestation;
- Owner 200, member 403 with no response rows plus one scoped denial event,
  anonymous 401 with no fabricated Access row, current-role recheck, and
  cross-Organization/cross-Project isolation;
- combined ordering where Audit/Access timestamps tie, cursor filter binding,
  malformed cursor, max limit, no duplicate/skip, empty/end page, and events
  inserted between pages;
- bounded list summaries with set-based Change Item counts; Owner-scoped Audit
  detail loading, count-integrity checking, cache/no-refetch, and row-level
  loading/error/retry behavior;
- compliance query's own Access Event absent from its current snapshot and
  present on later refresh;
- UI loading, empty, error, forbidden, unauthenticated, filtering, disclosure,
  redacted states, initial/incremental retry, Load More, and long-value wrapping.

### Database integration

Use the existing disposable testing database workflow and distinct maintenance/
runtime roles:

```bash
rtk pnpm --filter server test:setup
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

Database assertions:

- clean migration through `018` and schema verification ready;
- exact columns/types, no JSON/JSONB, named checks/FKs/indexes/triggers;
- runtime SELECT/INSERT allowed and UPDATE/DELETE/TRUNCATE/trigger bypass denied;
- maintenance ownership and runtime non-membership;
- Organization/Project/Org User cascade/destructive attempts blocked;
- populated DOWN refusal and empty disposable DOWN preserving Audit/mutation
  schema;
- successful protected read event written before response;
- evidence insert failure returns 503 and no protected bytes;
- successful login/setup/invite/password session and extension mutation Access
  rows share the business/Audit transaction outcome;
- known-identity/public-resource denials are Organization-scoped and contain no
  input; unknown-login/invalid-public-secret/rate-limit attempts create no row;
- Organization-lifetime retention and indexes support the planned queries;
- totals and physical/logical storage queries return sensible non-negative data.

Smoke should cover at least: login, Project list/read, extension Project discovery
and capture mutation, Capture asset download, Guide preview/export, public Guide
reader and embed, password denial/success, public asset download, Interactive
Demo public view, Owner compliance timeline, member denial, and a later refresh
showing the prior timeline-view event. Open one Audit disclosure and verify the
later refresh also shows its `compliance.audit_event_viewed` event.

### Broad repository checks

After focused and DB checks:

```bash
rtk pnpm -r --if-present test
rtk pnpm check-types
rtk pnpm lint
rtk pnpm build
rtk git diff --check
rtk git status --short
```

Report DB/tool/environment failures as blocked evidence. Do not substitute unit
fixtures for required database or browser claims.

## Agent-Browser Validation Requirements

This child is browser-visible. Use the repository `dogfood-ossie` procedure and
`agent-browser` against safe local URLs and synthetic fixtures after server/web
tests pass. Synthetic local credentials, passwords, links, and screenshots may
be used for the test workflow, but never use production/customer data, real
private links, real credentials, cookies/tokens in evidence, or unrelated
personal browser state.

Required evidence:

1. Owner desktop, approximately 1440x900:
   - sign in with a synthetic Owner;
   - open Organization members -> Compliance timeline;
   - verify totals, mixed Audit/Access ordering, disclosures, kind filters, and
     Load More;
   - refresh and verify the previous compliance view appears without recursion.
2. Public evidence paths:
   - view a synthetic public Guide/Interactive Demo in reader and embed modes;
   - exercise restricted/expired/revoked/password-required/password-denied/
     password-accepted states and one public asset download;
   - return as Owner and verify safe surface/outcome rows with no slug, token,
     URL, password, content, or storage path.
3. Permission boundaries:
   - direct navigation as a synthetic current Organization Member shows the
     Owner-required state and no timeline data;
   - anonymous direct navigation shows the sign-in state;
   - verify API network responses are 403/401 respectively and contain no rows.
4. Extension source attribution:
   - when the local browser can load the unpacked synthetic extension, perform
     Project discovery plus one safe capture mutation and verify the Owner
     timeline records one normalized `extension` Access Event alongside the one
     mutation Audit Event, with no duplicate Access row;
   - if the unpacked-extension harness remains unavailable, record browser
     evidence as blocked and retain the focused header/session, registry,
     transaction, DB, and extension-suite fallback inherited from child `113`.
     Do not claim a real extension browser pass.
5. Fail-closed path:
   - use an app-builder dependency-injected failing writer available only to the
     local validation process, never a production runtime flag or destructive
     database tampering, to make the Access writer fail;
   - verify a protected JSON read and a file/export read return the stable 503,
     no protected response body/bytes, and no retry loop.
6. Narrow viewport, approximately 390x844, plus 200% browser zoom/reflow:
   - no horizontal page scroll caused by cards, IDs, routes, or change values;
   - filters, disclosure, Retry, Load More, navigation, and sign-out remain usable.
7. Keyboard-only pass:
   - logical focus order, visible focus, operable filter/disclosures/retries/load
     more/links, and no focus trap.
8. Inspect console and network for every pass:
   - no uncaught exceptions, React warnings, failed requests beyond intentional
     denial/failure cases, duplicate page fetches, leaked secret-bearing URLs,
     or unexpected OPTIONS Access Events.

Record the child/commit/date, named browser session, fixture identity, local
route class, viewport, zoom, input mode, auth/public context, exact steps,
expected/actual result, and pass/fail/blocked status. Any screenshots must contain
only synthetic material and safe local URLs, remain temporary unless explicitly
accepted as a repository asset, and have their paths recorded. Close named
browser sessions, stop services started for validation, clean temporary
artifacts where supported, and confirm no browser profile, secret, or screenshot
is staged.

Loading and empty states may be proven in component tests when the real local
dataset cannot naturally pause or become empty after setup. Record that limit;
do not manufacture a browser screenshot and call it real runtime evidence.

## Acceptance Criteria

This child is complete only when all are true:

- Every current API operation is classified by automated Access coverage as
  meaningful, conditional, denial-only, or explicitly excluded.
- Every accepted meaningful access path produces one typed Access Event in the
  normal operating case without retaining protected input or content.
- Successful classified mutations commit business state, Audit Event, and Access
  Event atomically; failed Access append rolls them all back.
- Protected/public reads append before response; Access failure returns the
  stable 503 and leaks no JSON/export/file bytes.
- Runtime credentials can append/select Access rows but cannot update, delete,
  truncate, cascade-delete, or bypass them.
- Organization Owners can cursor through complete safe Organization Audit and
  Access evidence; current members and anonymous callers receive no raw rows.
- Timeline access records itself using current authorization and appears only on
  a later snapshot.
- Cursor pagination, totals, retention/backup/growth documentation, tenant
  isolation, public policies, extension attribution, and transport exclusions
  pass focused and DB tests.
- The portal passes unit and required agent-browser desktop/mobile/zoom/keyboard/
  console/network/permission/fail-closed validation.
- The plan and master are updated with real commands/results, implementation
  commits, leftovers, and child `115` handoff; no future role behavior is claimed
  shipped.

## Commit Strategy

Commit only this child's owned files, in small logical commits after each group
is green. Recommended boundaries:

1. `feat(server): add append-only access evidence`
2. `feat(server): record meaningful access paths`
3. `feat(compliance): add owner evidence timeline api`
4. `feat(web): add compliance timeline`
5. `docs(plan): close access evidence timeline phase`

Before each commit, inspect `git status --short` and stage explicit paths. Do not
include unrelated user/agent changes. Do not amend another agent's commit.

## Delivery Checklist

Planning/recheck:

- [x] Confirmed children `112` and `113` are complete and recorded baseline commit/worktree.
- [x] Re-read `CONTEXT.md`, ADRs `0015`, `0023`, `0024`, `0025`, parent `005`, child `113`, and current code/tests.
- [x] Inventoried current GET/public/authentication/download/extension routes and explicit exclusions.
- [x] Defined exact schema/types, route coverage, write timing, fail-closed behavior, API/UI contracts, permissions, privacy, retention, migration, tests, browser evidence, file ownership, non-scope, and child `115` seam.
- [x] Applied the shared-package reuse gate.
- [x] Found no unresolved critical product decision requiring a grill.
- [x] Commit this planning checkpoint before implementation.

Implementation/closeout:

- [x] Access domain validation and shared compliance contracts implemented.
- [x] Migration `017`, append-only controls, indexes, grants, and schema verifier implemented.
- [x] Request context, exhaustive route registry, writer, atomic mutation integration, and response hook implemented.
- [x] Meaningful protected/public/authentication/download/extension paths and exclusions verified.
- [x] Owner compliance API, tenant isolation, cursor, totals, and self-access behavior implemented.
- [x] Compliance portal and reader/embed attribution implemented.
- [x] Focused, DB, smoke, broad, and agent-browser verification passed or honestly recorded blocked.
- [x] Operations/backup/growth documentation updated.
- [x] Child/master status, implementation log, verification, leftovers, and handoff updated together.

## Implementation Log

Implemented in four original logical commits plus one closeout-hardening commit:

- `8f9f7e1` (`feat(server): add append-only access evidence`) added the Access
  literal/domain contract, strict validation, registered-action boundary,
  migration `017`, catalog verification, append-only writer, and DB coverage.
- `17b3554` (`feat(server): record meaningful access paths`) added request-local
  trusted context, exhaustive OpenAPI route classification, atomic Access writes,
  the pre-response fail-closed hook, authentication/invite/public-link context,
  reader/embed attribution, and stable failure mapping.
- `5f7ad39` (`feat(compliance): add owner evidence timeline api`) added shared
  discriminated DTOs and Owner-first, tenant-scoped combined timeline/detail
  repository, service, routes, cursor/totals behavior, and application wiring.
- `eb6b6f2` (`feat(web): add compliance timeline`) added the setup-guarded
  `/organization/compliance` page, member-page discovery link, filters, retained
  evidence totals, pagination, typed Audit disclosure, Access context, distinct
  auth/permission/error states, responsive behavior, and public surface headers.
- `e031379` (`fix(compliance): harden access evidence closeout`) corrected
  reader/embed and extension surface attribution, bound every HTTP Access action
  to its exact registered method/template/outcome, prevented `onSend` re-entry
  from duplicating one logical request, strictly rejected malformed compliance
  IDs/cursors before repository access, added successful-root validation and
  additive migration `018`, and expanded DB smoke coverage for public download,
  Owner/Member compliance access, Audit detail, and later-refresh self-access.

Implementation also corrected a discovered compatibility regression: public
Publish Link lookup now resolves trusted tenant context before policy evaluation,
while revoked links and their assets retain their previous public not-found
behavior. No Project Membership or future Project-role behavior was introduced.

Directly related file-list deviations are explicit: `access-atomic.ts` owns the
one shared atomic companion instead of scattering calls through 53 adapters;
existing app-integration harnesses received only the required writer stub;
`audit-source-coverage.test.ts` covers the new runtime insert source; and
additive migration `018` closes the scoped-success CHECK without rewriting the
already-applied `017` history.

## Verification Record

Planning verification is retained above. Implementation verification:

- `rtk pnpm --filter @repo/constants test`: passed, 3 tests.
- `rtk pnpm --filter @repo/audit-domain test`: passed, 43 tests.
- `rtk pnpm --filter @repo/types test`: passed, 39 tests.
- `rtk pnpm --filter server test`: passed, 75 files / 370 tests.
- `rtk pnpm --filter web test`: passed, 27 files / 313 tests.
- Disposable PostgreSQL 16 run with distinct synthetic maintenance/runtime
  roles: migrations `001` through `018` passed; the complete configured DB set
  passed, 14 files / 59 tests; populated `017` DOWN refused with
  `Refusing to remove populated Access Evidence`; after maintenance-only
  truncation, empty DOWN and re-UP/catalog verification passed.
- `src/smoke/v1-workflows.db.integration.test.ts`: passed, 1 end-to-end test,
  against the same disposable migrated database. It now asserts reader/embed
  surface rows, public asset bytes/size, Member 403 evidence, Owner combined
  timeline, Audit detail, and later-refresh timeline/detail self-access. The
  database was dropped and the helper container stopped after verification.
- `rtk pnpm check-types`, `rtk pnpm lint`, `rtk pnpm build`, and
  `rtk git diff --check`: passed. Server and web focused lint checks were clean.
- `agent-browser` 0.27.1 against real local server/web processes and a disposable
  PostgreSQL 16 database: an Owner navigated Organization members -> Compliance
  timeline; mixed evidence, totals, filtering, a keyboard-opened Audit
  disclosure, and later self-access rows rendered. A current Member saw the
  Owner-required state with a real 403/no rows; an anonymous session saw sign-in
  with a real 401/no rows. Reader and embed rendered through real 200 API calls;
  password-required, wrong-password, accepted-password, expired (410),
  restricted (403), and revoked/not-found (404) states rendered, and the Owner
  timeline showed safe outcomes/surfaces without secret input. At 390x844 and
  200% CSS zoom, `scrollWidth === clientWidth`; no compliance-page console or
  uncaught browser errors occurred.
- The browser run exposed and closed two defects: reader/embed headers used
  unrecognized values, and `onSend` re-entry could append twice for one request.
  The latter now has a request-local completion marker and regression test.
- Real unpacked-extension attribution was not repeated: agent-browser cannot
  reliably control the Chrome toolbar popup in this environment. The existing
  normalized-header tests and prior extension evidence remain the bounded
  fallback; no toolbar claim is made.
- A browser-launched server with an injected failing Access writer is not an
  available production startup mode. Protected JSON and stream replacement/no-
  byte behavior passed app/hook tests; this specific browser injection remains
  blocked rather than represented by network interception.

Historical planning verification:

- Confirmed clean starting worktree at commit
  `27d257972ade99833652a65dfbec72cc09909810`.
- Inspected current migration `015`/`016` Audit schema/guards, Audit domain and
  transaction runner, schema verifier, app wiring, authentication, Organization
  invite, Project, Capture, Guide, Interactive Demo, Publish, public reader,
  export/file routes, portal parser/API/pages, CORS, operations docs, tests, and
  scripts.
- Enumerated 28 current GET API routes: 24 authenticated protected reads, three
  public secret/link/file reads, and the intentionally excluded public instance
  probe. Authentication/onboarding POST outcomes and conditional extension
  mutations are specified separately above.
- The implementation-safety recheck compared the complete expansion with Master
  `005`, the implemented child `113` registry/transaction/session-touch behavior,
  the three real migration-verifier states, current public-link filtering, and
  current app/auth wiring. It corrected top-level command matching, prevented
  internal touch transactions from claiming Access, required Organization-owned
  evidence, added typed authorization context, bounded cursor payloads with an
  Owner Audit-detail route, preserved `015`/`016` rollback verification, covered
  revoked-link attribution without public disclosure, and removed extension
  attestation overclaims.
- `rtk pnpm exec prettier --check
docs/plan/114-access-evidence-and-compliance-timelines.md`: passed after
  recheck.
- `rtk git diff --check`: passed after recheck.

No production/customer data, credentials, cookies, private URLs, committed
screenshots, or compliance-certification claim were introduced.

## Leftovers And Handoff To Child 115

Child `115` must reuse rather than bypass:

- `AccessEvent`, its writer, append-only table, safe context rules, and route
  coverage registry for Project-role denials and newly introduced routes;
- the compliance repository's mandatory Organization predicate and optional
  `project_id` filter;
- a centralized authorization input added above the repository, not route-local
  role checks;
- current Owner organization-wide visibility as an immutable upper boundary.

Child `115` then owns:

- adding current Project Membership/role evaluation before Project discovery and
  access;
- granting Project Admin the accepted Project-scoped compliance subset;
- building the separate curated Editor Activity and Viewer Revision/Publication
  history projections;
- filtering events/change items by accepted Project role and event category,
  with revoked membership taking effect immediately while historical evidence
  remains;
- adding Access/Audit coverage for Project Membership mutations and denials.

Do not solve those role semantics in child `114`. Until child `115` completes,
only current Organization Owners may retrieve raw Audit or Access Evidence.

Additional implementation handoff:

- Extend `ACCESS_ROUTE_COVERAGE_REGISTRY` whenever child `115` adds membership
  or authorization routes; the production/OpenAPI coverage test is intended to
  fail until every new operation is classified.
- Migrate the typed `authorization_role` constraint before emitting Project
  Admin/Editor/Viewer context; do not overload the current Organization role.
- Begin child `115` from migration `018_access_evidence_constraint_hardening.sql`.
  Its next migration must preserve `chk_access_event_scoped_success` while
  extending authorization roles deliberately.
- Preserve exact method/template/outcome-to-action validation and the
  request-local response completion marker when new membership routes and
  denial paths are registered.
- The two browser capability blocks above are validation-environment debt, not
  permission semantics for child `115`; do not weaken fail-closed behavior to
  make either harness easier.
- Reuse the compliance service's pre-query authorization gate and repository
  Organization predicate. Add the accepted Project filter above those layers,
  never in the UI alone.
- Access source `extension` remains exact-header-derived evidence, not
  cryptographic attestation. Preserve that wording in future timeline UI.
- There are no child-114 code leftovers blocking child `115`.
