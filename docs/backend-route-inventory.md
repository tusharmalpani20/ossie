# Backend Route Inventory

Date: 2026-07-19

## Purpose

This document records the current backend route surface so future work lands in the active Ossie modules instead of removed legacy ORCA-style paths.

## Current Runtime Path

The active Fastify app is built in:

```text
apps/server/src/app.ts
```

The active backend modules live under:

```text
apps/server/src/modules/*
```

## Top-Level Operational Routes

| Route          | Purpose                                      |
| -------------- | -------------------------------------------- |
| `GET /healthz` | Liveness check; does not touch PostgreSQL.   |
| `GET /readyz`  | Readiness check; verifies PostgreSQL access. |

## API Route Groups

| Area                         | Prefix / routes                                                                                                                                                                                                                  | Source                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| public instance status       | `GET /api/v1/public/instance`                                                                                                                                                                                                    | `modules/public-instance`        |
| first-run setup              | `POST /api/v1/setup/first-run`                                                                                                                                                                                                   | `modules/setup`                  |
| authentication               | `/api/v1/authentication/*`                                                                                                                                                                                                       | `modules/authentication`         |
| organization members/invites | `/api/v1/organization/members`, `/api/v1/organization/invites*`, `/api/v1/public/invites*`                                                                                                                                       | `modules/organization`           |
| projects                     | `/api/v1/projects*`                                                                                                                                                                                                              | `modules/project`                |
| project versions             | `/api/v1/projects/:project_id/versions*`                                                                                                                                                                                         | `modules/project-version`        |
| capture sessions             | `/api/v1/projects/:project_id/capture-sessions*`                                                                                                                                                                                 | `modules/capture-session`        |
| capture assets               | `/api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets*`                                                                                                                                                      | `modules/capture-asset`          |
| capture events               | `/api/v1/projects/:project_id/capture-sessions/:capture_session_id/events*`                                                                                                                                                      | `modules/capture-event`          |
| guides                       | `/api/v1/projects/:project_id/guides*` (selected `project_version_id`; Edition archive/restore and Working Draft child routes)                                                                                                   | `modules/guide`                  |
| interactive demos            | `/api/v1/projects/:project_id/interactive-demos*`, `/api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos` (selected `project_version_id`; Edition archive/restore and Working Draft child routes) | `modules/interactive-demo`       |
| artifact revisions           | `/api/v1/projects/:project_id/guides/:guide_id/revisions*`, `/api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/revisions*`                                                                                     | `modules/artifact-revision`      |
| edition carry-forward        | `POST /api/v1/projects/:project_id/artifact-editions/carry-forward`                                                                                                                                                              | `modules/artifact-carry-forward` |
| guide publishing             | `/api/v1/projects/:project_id/guides/:guide_id/publish*`                                                                                                                                                                         | `modules/publish`                |
| interactive demo publishing  | `/api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish*`                                                                                                                                                   | `modules/publish`                |
| public published artifacts   | `/api/v1/public/publish-links/:slug*`                                                                                                                                                                                            | `modules/publish`                |

The current authentication model is cookie-backed session auth through the `ossie_session` cookie. Project, capture, guide, interactive demo, organization, and authenticated publish routes derive organization scope from the current session.

Authenticated Guide and Interactive Demo list/read/write requests require the
selected `project_version_id`. Edition metadata/archive/restore mutations carry
`expected_edition_version`; Working Draft and relational child mutations carry
the aggregate `expected_working_draft_version`. Guide archive/restore routes are
`POST .../guides/:guide_id/archive|restore`; Interactive Demo equivalents are
`POST .../interactive-demos/:interactive_demo_id/archive|restore`.

Revision history/detail requires `artifact.read`; manual checkpoint and restore
require `revision.checkpoint_restore`. Carry-Forward requires
`revision.carry_forward`, one source/target Project Version, a bounded selection,
and an actor-scoped `Idempotency-Key`. Capture Asset archive/restore uses the
existing Asset route with `/archive|restore`; `GET .../protection` and physical
`DELETE` purge are Project Admin/Owner-only. Archive preserves existing
references, while purge is allowed only after the relational dependency report
is empty.

All current state-changing routes retain these public contracts while their
product writes use one registered Audit command and one same-transaction Audit
Event. Protected reads append Access Evidence and the authenticated compliance,
Project Activity, and Project Membership surfaces use the shipped central
authorization policy. Public viewer-session row maintenance uses the fixed
system actor.

## Rate-Limited Route Groups

The app applies in-memory rate limiting to sensitive routes:

- `POST /api/v1/authentication/login`
- `POST /api/v1/setup/first-run`
- `POST /api/v1/public/publish-links/:slug/viewer-sessions`
- `POST /api/v1/public/invites/:token/accept`

This is sufficient for single-process alpha deployments. Multi-instance production deployments should replace this with shared rate-limit state.

## Removed Legacy Runtime Wiring

The old ORCA-style runtime paths are removed from active source and should not be reintroduced:

```text
apps/server/src/root_router/*
apps/server/src/module/*
apps/server/src/config/passport.config.ts
```

Removed surfaces included old authentication signup/signin routes, OTP routes, user asset routes, organization role routes, and contact routes. They are not part of the current Ossie product path.

## Current Backend Boundary

New backend work should follow this shape:

```text
apps/server/src/modules/<domain>/<domain>.routes.ts
apps/server/src/modules/<domain>/<domain>.service.ts
apps/server/src/modules/<domain>/<domain>.repository.ts
apps/server/src/modules/<domain>/<domain>.*.test.ts
```

Do not add new code under removed legacy module or router paths.
