# Child Plan 125-01: Capture Portal Browser Fixture

Date: 2026-07-26

Status: Complete. Fixture tooling, live PostgreSQL 18 seed, and authenticated
browser execution passed on 2026-07-29.

Parent plan:

- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`

Related child:

- `docs/plan/125-capture-portal-ui-modernization.md`

## Goal

Add a safe local fixture for authenticated Capture portal browser validation so
child `125` can be dogfooded with real Project Version, permission, Capture
Session, Capture Event, and Capture Asset data.

## Scope

- Dev/test-only fixture code under `apps/server`.
- A package script that seeds only the configured disposable testing database.
- Safe synthetic users, sessions, Project, Project Versions, Capture Sessions,
  Capture Events, Capture Assets, and local screenshot bytes.
- Documentation for the exact seed command and browser login/session details.
- Update child `125` evidence and master `005` only after verification.

## Explicit Non-Scope

- Production seed behavior.
- New product APIs.
- New database migrations.
- New permission, tenant, retention, deletion, publication, or public-link
  semantics.
- Real customer data, private URLs, private screenshots, raw typed inputs, or
  raw HTML.

## Safety Rules

- The fixture must use the existing maintenance safety guard and refuse
  non-testing databases.
- The fixture may reset the disposable testing database.
- The fixture must not require maintenance credentials in normal API runtime.
- Browser evidence must identify any remaining limitation honestly.

## Acceptance Criteria

- [x] The fixture builder defines:
  - one active Project;
  - Default Project Version `Main`;
  - one named active Project Version;
  - one archived Project Version;
  - Project Admin or Editor access;
  - Viewer access;
  - draft, capturing, completed, canceled, and archived Capture Sessions;
  - safe synthetic Capture Events and Capture Assets;
  - one empty draft Capture Session that can be reassigned.
- [x] The fixture creates usable local screenshot bytes for seeded Capture Assets.
- [x] The fixture prints local-only browser login/session guidance without printing
      secrets from environment files.
- [x] Tests cover fixture shape and disposable-database safety.
- [x] Focused server checks pass.
- [x] Plan `125`, master `005`, and evidence docs are updated after verification.
- [x] Live DB/browser execution passes with the configured disposable
      `testing_maintenance` environment.

## Verification Plan

```bash
rtk pnpm --filter server test -- src/dev-fixtures/capture-portal-browser-fixture.test.ts
rtk pnpm --filter server test
rtk pnpm --filter server check-types
rtk pnpm --filter server lint
rtk pnpm --filter server build
rtk git diff --check
```

If PostgreSQL is available:

```bash
rtk pnpm --filter server test:setup
rtk pnpm --filter server seed:capture-portal-browser-fixture
```

## Implementation Log

- Created on 2026-07-26 after child `125` closeout exposed the missing seeded
  authenticated fixture as the only browser-validation blocker.
- Added `apps/server/src/dev-fixtures/capture-portal-browser-fixture.ts`.
- Added `apps/server/src/dev-fixtures/capture-portal-browser-fixture.cli.ts`.
- Added `apps/server/src/dev-fixtures/capture-portal-browser-fixture.test.ts`.
- Added server script:
  `rtk pnpm --filter server seed:capture-portal-browser-fixture`.
- The fixture uses `reset_test_database()` and `with_maintenance_client()`, so
  it inherits the existing guard that refuses non-testing databases.
- The fixture writes one safe local PNG for seeded Capture Asset previews.
- The seed command prints synthetic local-only session tokens for the admin and
  viewer browser contexts.
- The 2026-07-29 close-previous audit corrected PostgreSQL 18 parameter typing,
  replaced mnemonic identifiers with valid ULIDs, made the admin an implicit
  Organization Owner, retained explicit Viewer membership, and added
  `capture-portal-browser-fixture.db.integration.test.ts`.
- The fixture DB integration test is part of `pnpm --filter server test:db`.

## Verification Record

Passed:

```bash
pnpm --filter server test -- src/dev-fixtures/capture-portal-browser-fixture.test.ts
pnpm --filter server test:setup
pnpm --filter server seed:capture-portal-browser-fixture
pnpm --filter server test:db
pnpm --filter server test:smoke
pnpm --filter server check-types
pnpm --filter server lint
pnpm --filter server build
```

Live seed result:

- PostgreSQL 18.4 accepted all fixture rows and the seeded PNG.
- Admin and Viewer login contexts were exercised through the live API/web
  runtime with `agent-browser`.
- Browser results and screenshots are recorded in
  `docs/ui/125-capture-portal-browser-evidence.md`.
- `rtk` was not installed in this environment, so equivalent commands were run
  directly.

## Leftovers

- Keep the fixture disposable and synthetic. Re-run the seed after any DB test
  that resets `ossie_test` before starting another browser session.
