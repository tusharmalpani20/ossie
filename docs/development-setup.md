# Development Setup

Date: 2026-06-13

## Tooling

Required:

- Node.js `>=22` recommended; the repo currently supports `>=18`
- pnpm `9.x`
- PostgreSQL for server DB-backed development and integration tests

Install dependencies from the repository root:

```bash
pnpm install
```

For the open-source/self-host quickstart path, see [self-hosting.md](self-hosting.md).

## Environment Files

The server uses `env-cmd` with `.env-cmdrc`.

Expected environments:

```text
development
development_maintenance
testing
testing_maintenance
```

Do not commit real secrets. Keep local database credentials, cookie secrets, and deployment-specific URLs in `.env-cmdrc` or an ignored environment file.
The runtime profiles contain `DB_USER`/`DB_PASSWORD`; the maintenance profiles
also contain `DB_MAINTENANCE_USER`/`DB_MAINTENANCE_PASSWORD` and are used only by
database create, role-provisioning, migration, reset, DB-test, and smoke commands.
Never copy maintenance credentials into a running API environment.

Common server variables:

```text
NODE_ENV
DEV_TYPE
TZ
SERVER_PORT
COOKIE_SECRET
COOKIE_DOMAIN
OSSIE_CORS_ALLOWED_ORIGINS
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
DB_MAX_POOL
OSSIE_DEPLOYMENT_MODE
OSSIE_ONBOARDING_MODE
OSSIE_LOCAL_STORAGE_ROOT
OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES
API_URL
OSSIE_PUBLIC_WEB_URL
```

`OSSIE_CORS_ALLOWED_ORIGINS` is required in production and accepts comma-separated browser origins, including Chrome extension origins when needed:

```text
https://portal.example.com,chrome-extension://<extension-id>
```

Development and test mode remain permissive for local browser/extension work, but keeping local origins in `.env-cmdrc` makes production parity easier.

`API_URL` is the externally reachable API origin used for API-facing generated URLs. `OSSIE_PUBLIC_WEB_URL` is the browser-facing portal origin used for generated portal links such as organization invite URLs; set it to an origin only, without a path, query, or hash. In same-origin deployments it can be omitted; in split API/web development it should usually be `http://localhost:3000`.

Common web variable:

```text
VITE_OSSIE_API_URL
```

The web dev server listens on `http://localhost:3000`. When `VITE_OSSIE_API_URL` is not set, it proxies `/api` requests to `http://localhost:3002`, matching the server example port.

## Database

You can use an existing PostgreSQL server or start the local helper container:

```bash
rtk docker compose up -d postgres
```

Development database:

```bash
rtk pnpm --filter server run db:create
rtk pnpm --filter server run migrate:up
```

Testing database:

```bash
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Reset the testing database:

```bash
rtk pnpm --filter server run test:db:drop
rtk pnpm --filter server run test:db:create
rtk pnpm --filter server run test:migrate
```

Run DB integration tests:

```bash
rtk pnpm --filter server run test:db
```

DB tests use the `.env-cmdrc` `testing_maintenance` environment and a disposable
real PostgreSQL database. Application connections inside the suite still use the
runtime `DB_USER`; maintenance credentials are limited to setup/reset fixtures.

Migration `022` deliberately refuses retained legacy Guide, Interactive Demo,
or publication rows. For a disposable local database created before this
transition, use the reset sequence above and reseed it. Do not point those reset
commands at retained or production data. The migrated portal/server pair uses
explicit Project Version-scoped Guide/Demo Editions and relational Working
Draft content, so mixed old/new clients are unsupported.

## Running Apps

Server:

```bash
rtk pnpm --filter server dev
```

Web portal:

```bash
rtk pnpm --filter web dev
```

Chrome extension:

```bash
rtk pnpm --filter extension dev
rtk pnpm --filter extension build
```

For self-hosted extension use, build the extension, load `apps/extension/dist` as an unpacked Chrome extension, and configure the extension with the server URL for the instance it should talk to.

## Storage

Local screenshot/file storage defaults to:

```text
./storage
```

Override with:

```text
OSSIE_LOCAL_STORAGE_ROOT
```

Limit screenshot upload size with:

```text
OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES
```

Do not treat local storage as durable production backup by itself.

## Verification

Non-DB checks:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB checks:

```bash
rtk pnpm --filter server run test:db
```

## Common Failures

- `test:db` fails before connecting: confirm `.env-cmdrc` defines
  `testing_maintenance`, including both runtime and maintenance DB variables,
  and make sure PostgreSQL is running.
- migrations fail because the database is already in a bad state: reset the testing DB with `test:db:drop`, `test:db:create`, and `test:migrate`.
- public guide images fail locally: check `OSSIE_LOCAL_STORAGE_ROOT` and make sure the server can read files written during upload.
- extension cannot authenticate: confirm the extension instance URL points to the running server and that cookies/credentials are accepted by the backend.
