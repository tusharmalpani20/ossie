# Operations Guide

Date: 2026-06-15

This guide covers the operational basics for a self-hosted Ossie alpha instance. It does not cover one-command packaging, Kubernetes, Terraform, managed object storage, or external observability stacks.

## Health Checks

- `GET /healthz` is a liveness check. It does not touch PostgreSQL.
- `GET /readyz` is a readiness check. It returns `200` only when the API can reach PostgreSQL.
- Use `/healthz` for process liveness and `/readyz` before sending traffic to the API.

## Production Environment Report

Before starting a production API process, operators can run a read-only environment report from the server app:

```bash
cd apps/server
rtk pnpm env:report
```

Run the command with the same environment variables that the production API process will use. The command reuses server startup validation and exits non-zero if required production configuration is missing or malformed.

The report prints JSON with non-secret summaries only:

- runtime and deployment modes
- whether database host/user/name/password settings are configured
- cookie and CORS summary
- API and browser-facing portal origins
- local storage provider and storage path classification
- upload/body-size limits
- in-memory rate-limit settings
- known alpha operational limitations

It does not print `COOKIE_SECRET`, `DB_PASSWORD`, maintenance database
credentials, raw cookies, bearer tokens, invite tokens, or the local storage
root path. The API process needs only `DB_USER`/`DB_PASSWORD`; do not place
`DB_MAINTENANCE_USER` or `DB_MAINTENANCE_PASSWORD` in its runtime environment.
Treat the report as a preflight aid, not a replacement for `/readyz`, reverse
proxy testing, backup rehearsal, or a full production readiness review.

## Database Roles

- `DB_USER`/`DB_PASSWORD` identify the least-privilege API runtime role.
- `DB_MAINTENANCE_USER`/`DB_MAINTENANCE_PASSWORD` identify the administrative
  role used by database create/drop, migrations, test reset, and restore work.
- The roles must be distinct, and the runtime role must not inherit or belong to
  the maintenance role.
- Runtime credentials may append validated rows to `audit_schema`, but cannot
  update, delete, truncate, or bypass its evidence guards.
- Migration `016` guards every current runtime-granted product INSERT/UPDATE.
  A write without its registered command context and same-transaction typed
  evidence is rejected at commit.

For disposable local and test databases only, run
`rtk pnpm --filter server db:provision-runtime-role` before migrations. The
helper refuses production. Provision both production roles with operator-owned
PostgreSQL tooling and give the API service only the runtime credentials.
Keep maintenance variables in the administrative command environment only; the
local `.env-cmdrc` must define separate `development`/`testing` runtime profiles
and `development_maintenance`/`testing_maintenance` administrative profiles for
this reason.

## Backups

Back up both durable stores together:

- PostgreSQL database
- `OSSIE_LOCAL_STORAGE_ROOT`

Before relying on a backup, rehearse restore into an isolated database and storage directory. Do not rehearse against the live production database or storage path.

Example PostgreSQL backup:

```bash
pg_dump --format=custom --file=ossie.dump "$DATABASE_URL"
```

Use a maintenance-capable connection for the dump and confirm that it includes
`audit_schema`, its triggers, constraints, privileges, and rows. Audit and Access
Evidence are retained for the lifetime of their Organization; there is no
supported cleanup or row-deletion command.

Monitor physical evidence growth with operator credentials. Track the three
evidence relations separately so table and index growth are both visible:

```sql
SELECT relation,
  pg_size_pretty(pg_relation_size(relation)) AS table_size,
  pg_size_pretty(pg_indexes_size(relation)) AS indexes_size,
  pg_size_pretty(pg_total_relation_size(relation)) AS total_size
FROM unnest(ARRAY[
  'audit_schema.audit_event'::regclass,
  'audit_schema.audit_change_item'::regclass,
  'audit_schema.access_event'::regclass
]) AS relation
ORDER BY pg_total_relation_size(relation) DESC;
```

Compare physical size with logical retained-evidence counts:

```sql
SELECT evidence_kind, retained_rows
FROM (
  SELECT 'audit_event' AS evidence_kind, COUNT(*) AS retained_rows
    FROM audit_schema.audit_event
  UNION ALL
  SELECT 'audit_change_item', COUNT(*)
    FROM audit_schema.audit_change_item
  UNION ALL
  SELECT 'access_event', COUNT(*)
    FROM audit_schema.access_event
) AS evidence_counts
ORDER BY evidence_kind;
```

Growth is a capacity-planning and alerting signal. It is not an instruction to
delete retained evidence, and neither these queries nor the portal totals are a
compliance-certification check.

Example local storage backup:

```bash
tar -czf ossie_storage.tgz /var/lib/ossie/storage
```

Take the database dump and storage archive close together in time. If you restore only one side, captures and published assets can point at files that do not exist.

## Restore

Restore into a clean database and storage directory:

```bash
createdb ossie_restore
pg_restore --dbname=ossie_restore ossie.dump
mkdir -p /var/lib/ossie/storage
tar -xzf ossie_storage.tgz -C /
```

After restore:

- restore or pre-provision the distinct maintenance and runtime roles before
  applying ownership and grants
- run migrations for the target application version
- confirm `audit_schema.audit_event`, `audit_schema.audit_change_item`, and
  `audit_schema.access_event` exist with append-only controls and generalized
  product-mutation guard triggers
- confirm the runtime role is not a maintenance-role member and cannot update,
  delete, or truncate Audit Evidence
- point `OSSIE_LOCAL_STORAGE_ROOT` at the restored storage path
- set `API_URL` to the API origin used for the rehearsal environment
- start the API
- check `/readyz`
- open the Owner-only `/organization/compliance` timeline and confirm retained
  Audit and Access rows are readable
- open a project
- open a capture session and at least one capture asset
- open a guide preview
- open a published guide link
- open a published interactive demo if the instance has demos

Record the backup timestamp, database dump name, storage archive name, restore target, application version, and verification result. If any capture asset or published asset is missing after restore, treat the backup pair as incomplete.

## Storage Permissions

The API process must be able to read and write `OSSIE_LOCAL_STORAGE_ROOT`.

Recommended production defaults:

- directory owned by the API service user
- no direct public web server access to the storage directory
- backups readable only by trusted operators
- filesystem snapshots or backup jobs scheduled before upgrades

## Retention And Cleanup

Ossie does not yet include automated retention cleanup. Treat storage growth as an operator responsibility for the alpha.

Before deleting local files manually:

- confirm whether the file is referenced by capture assets, guide blocks, published snapshots, or interactive demo scenes
- take a backup
- prefer archiving whole old projects only after the product has built explicit deletion workflows

Do not delete individual files from `OSSIE_LOCAL_STORAGE_ROOT` unless you have verified they are unreferenced and have a restorable backup. A dry-run storage inventory command is still deferred.

## Migrations And Upgrades

Migration `015_audit_evidence_core.sql` is a clean, pre-live schema transition.
It deliberately refuses to run when User or Organization rows already exist. If an
evaluation database predates this transition, reset and reseed that disposable
database; there is no production-row backfill or compatibility conversion.
Never use the destructive test reset commands against a production database.

Migration `016_existing_mutation_audit_coverage.sql` activates exhaustive
current mutation guards without backfilling historical rows. It is not safe to
run a mixed fleet of old and converted writers. Use a maintenance window: stop
API writers, run `016`, deploy the converted server, require
`audit_schema.status = ready`, and only then reopen writes. To roll back, stop
writers first, run `016` DOWN, deploy the prior server, and then reopen traffic;
DOWN restores the child-112 Project-only guard and retains Audit Evidence.

Migration `017_access_evidence_and_compliance_timelines.sql` additively creates
Access Evidence and does not backfill historical reads. Deploy the migrated
server and web together so protected responses can fail closed when Access
Evidence is unavailable and the Owner timeline consumes the matching contracts.
Its DOWN refuses a populated `audit_schema.access_event`; there is no supported
automatic deletion of retained Access Evidence.

Migration `018_access_evidence_constraint_hardening.sql` additively requires a
resolved logical root for every successful Access Event. It rewrites neither
`017` nor retained rows; migration will stop safely if an older writer inserted
an invalid successful row. Resolve that data inconsistency through an explicit
operator-reviewed maintenance process before retrying. DOWN removes only the
named scoped-success CHECK and does not remove evidence.

Migration `019_project_membership_foundation.sql` is the final clean pre-live
authorization transition before Project Version work. It refuses any existing
Project row or unsupported legacy Organization `admin` row rather than inventing
unaudited access history. Reset and reseed disposable pre-`019` databases. The
migration adds guarded relational Project Membership and Project-role Access
Evidence validation; deploy the migrated server, portal, and extension
together. DOWN refuses retained Project Membership rows or `project_role`
Access Evidence and never deletes either history kind automatically.

Before upgrading:

1. Stop all API/background writers; do not use a rolling mixed-writer deploy.
2. Back up PostgreSQL and local storage.
3. Build the new server and web artifacts.
4. Run `rtk pnpm --filter server migrate:up` with maintenance credentials.
5. Run `rtk pnpm --filter server migrate:status` and require
   `audit_schema.status` to be `ready`.
6. Start the API with runtime credentials only.
7. Check `/readyz`.
8. Run a smoke test through sign-in, membership-aware Project discovery,
   Project role assignment/revocation, Guide preview, public Guide, and
   Interactive Demo viewer.

## Reverse Proxy And HTTPS

Production deployments should terminate HTTPS before traffic reaches browsers.

Configure the reverse proxy to:

- forward the external API origin consistently
- allow the deployed portal origin in `OSSIE_CORS_ALLOWED_ORIGINS`
- add the Chrome extension origin when extension capture is used
- set body-size limits that are no larger than the configured API limits
- send liveness checks to `/healthz`
- send readiness checks to `/readyz`

For split API/web deployments:

- set server `API_URL` to the externally reachable API origin
- set server `OSSIE_PUBLIC_WEB_URL` to the browser-facing portal origin, without a path, query, or hash
- set the portal build `VITE_OSSIE_API_URL` to that API origin when the portal is not same-origin proxied
- configure the extension instance URL as the API origin
- configure the extension portal URL as the browser-facing portal origin

Server startup validates the API-side production settings and the configured public web origin format. It cannot validate the deployed portal build, reverse proxy, TLS certificate, backup jobs, or extension origin until those are exercised in the target environment.

## Secret And Token Rotation

`COOKIE_SECRET` signs web session cookies. Rotating it invalidates existing web sessions. Plan a maintenance window or communicate that users must sign in again.

Extension bearer sessions are ordinary authenticated sessions. To force rotation for v1, revoke/expire sessions operationally or ask users to sign out and sign in again after the server-side session cleanup path exists.

Never log submitted passwords, invite tokens, public viewer passwords, cookie values, or bearer tokens.

## Dependency Review

Run a dependency review before production upgrades:

```bash
rtk pnpm audit
```

If an advisory cannot be fixed immediately, record:

- package name and advisory
- affected runtime surface
- mitigation
- planned follow-up
