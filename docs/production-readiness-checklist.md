# Production Readiness Checklist

Date: 2026-06-13

Use this before deploying a self-hosted Ossie instance.

Start with [self-hosting.md](self-hosting.md), then use this checklist before exposing the instance beyond local development.

## Environment

These settings are validated at server startup in production:

- [ ] Set `NODE_ENV=production`.
- [ ] Set `DEV_TYPE=production`.
- [ ] Set `TZ`.
- [ ] Set `SERVER_PORT`.
- [ ] Set `COOKIE_SECRET` to a strong secret with at least 20 characters.
- [ ] Set `OSSIE_CORS_ALLOWED_ORIGINS` to comma-separated allowed browser origins.
- [ ] Set API PostgreSQL variables: `DB_HOST`, `DB_PORT`, `DB_USER`,
      `DB_PASSWORD`, `DB_NAME`, `DB_MAX_POOL`; use the runtime role only.
- [ ] Keep `DB_MAINTENANCE_USER` and `DB_MAINTENANCE_PASSWORD` out of the API
      process environment.
- [ ] Set `OSSIE_DEPLOYMENT_MODE` to `self_hosted` or `hosted`.
- [ ] Set `OSSIE_ONBOARDING_MODE` to `first_run_setup` or `signup`.
- [ ] Set `OSSIE_LOCAL_STORAGE_ROOT` to an absolute durable storage path.
- [ ] Set `OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES`.
- [ ] Set `OSSIE_JSON_BODY_LIMIT_BYTES`.
- [ ] Set `OSSIE_RATE_LIMIT_MAX_ATTEMPTS`.
- [ ] Set `OSSIE_RATE_LIMIT_WINDOW_MS`.
- [ ] Set `API_URL` to the externally reachable API origin.
- [ ] Set `OSSIE_PUBLIC_WEB_URL` to the browser-facing portal origin when the API and portal origins differ.

These settings still require operator verification:

- [ ] Run `rtk pnpm --filter server env:report` with the production API environment and confirm it exits successfully without printing secrets.
- [ ] Set `COOKIE_DOMAIN` for the deployed portal domain if your cookie scope needs it.
- [ ] Set `VITE_OSSIE_API_URL` for the portal build.
- [ ] For split API/web deployments, confirm the extension instance URL is the API origin and the extension portal URL is the browser-facing portal origin.
- [ ] For split API/web deployments, create a teammate invite and confirm the copied invite link uses the browser-facing portal origin.
- [ ] Confirm `OSSIE_LOCAL_STORAGE_ROOT` is on durable storage with backup coverage.

## Database

- [ ] Create the production database.
- [ ] Pre-provision distinct runtime and maintenance PostgreSQL roles; do not use
      the local/test runtime-role provisioning helper in production.
- [ ] Confirm the runtime role is not a member of the maintenance role.
- [ ] Run migrations:

```bash
rtk pnpm --filter server run migrate:up
```

- [ ] For migration `016`, stop every old API/background writer before
      migrating; do not run a mixed pre/post-`016` fleet.

- [ ] Run `rtk pnpm --filter server migrate:status` with maintenance
      credentials and confirm `audit_schema.status` is `ready`.
- [ ] Confirm migration `018_access_evidence_constraint_hardening.sql` is
      executed and `chk_access_event_scoped_success` is present.
- [ ] Start the API with runtime credentials only; do not reuse the migration
      process environment.
- [ ] Before reopening writes, confirm catalog verification covers all current
      product INSERT/UPDATE guards and perform a synthetic audited mutation.

- [ ] Confirm backups exist before allowing real usage.
- [ ] Confirm database backups include `audit_schema`, its constraints,
      triggers, privileges, and retained evidence rows.
- [ ] Test restore on a separate database before relying on backups.
- [ ] During restore rehearsal, confirm role ownership/grants are restored and
      runtime credentials cannot update, delete, or truncate Audit or Access
      Evidence.
- [ ] Confirm `audit_schema.access_event` is present, append-only, included in
      backups, and visible only through the authenticated Owner compliance API.
- [ ] Open `/organization/compliance` as an Organization Owner and verify a
      synthetic protected read appears; verify a current Member receives 403.
- [ ] Record and monitor physical `audit_schema` table/index growth; portal
      totals are evidence counts and not storage metrics.
- [ ] During restore rehearsal, verify project access, a capture asset, a guide preview, a published guide, and an interactive demo if demos exist.

## Build

- [ ] Build the repo:

```bash
rtk pnpm build
```

- [ ] Start the server from `apps/server/dist`.
- [ ] Serve the web portal build from `apps/web/dist`.
- [ ] Package/load the extension build from `apps/extension/dist` if browser capture is needed.

## Security And Access

- [ ] Confirm CORS allows the deployed portal origin and rejects unconfigured browser origins.
- [ ] If the Chrome extension is used, confirm its `chrome-extension://...` origin is configured in `OSSIE_CORS_ALLOWED_ORIGINS`.
- [ ] Confirm cookies are secure on HTTPS.
- [ ] Confirm `/healthz` returns `200` without a database dependency.
- [ ] Confirm `/readyz` returns `200` only when the database is reachable.
- [ ] Confirm reverse proxy body size limits are at least as strict as `OSSIE_JSON_BODY_LIMIT_BYTES` and `OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES`.
- [ ] Confirm login, first-run setup, public password unlock, and invite acceptance return `429` after repeated failed submissions.
- [ ] Confirm first-run setup is disabled after owner creation.
- [ ] If running in hosted/signup mode, confirm `/api/v1/setup/first-run` is blocked.
- [ ] Confirm local storage path is not publicly served except through API routes.
- [ ] Confirm local storage cleanup remains manual; do not delete individual files without a restorable backup and reference check.
- [ ] Confirm published guide asset reads only work for assets referenced by accessible published snapshots.
- [ ] Confirm `COOKIE_SECRET` rotation is understood: existing web sessions become invalid.
- [ ] Confirm extension bearer token/session rotation is handled by logging users out and asking them to sign in again.
- [ ] Run dependency review, for example `rtk pnpm audit`, and record accepted risks.
- [ ] If running more than one API process, document that rate limiting is still in-memory and must be replaced before relying on it for multi-instance abuse protection.

## Smoke Test

- [ ] Open the portal.
- [ ] Complete first-run setup or sign in.
- [ ] Create a project.
- [ ] Create a manual capture session.
- [ ] Upload one or more screenshots.
- [ ] Reorder capture events if needed.
- [ ] Create a guide from the capture session.
- [ ] Edit guide steps.
- [ ] Publish the guide.
- [ ] Open the public guide URL.
- [ ] Disable public access and confirm the public URL no longer opens.
- [ ] Re-enable public access or clear the test publish link.
