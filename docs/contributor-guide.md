# Contributor Guide

Ossie is organized as a product monorepo. The project is alpha, so clear plans, focused tests, and truthful docs matter more than broad rewrites.

Current runtime behavior includes Project Version-owned screenshot-first
Capture Sessions; stable Guide and Interactive Demo Artifacts with
Version-scoped Editions, relational Working Drafts, immutable Revisions, and
Carry-Forward; revision-backed Publications; independent multi-version Publish
Links; Project Membership; and Audit/Access Evidence. `CONTEXT.md` also contains
accepted future language for UI modernization and Product Documentation; those
future terms are not a claim that their runtime implementation exists.

## Repo Layout

```text
apps/server     Fastify REST API, PostgreSQL migrations, domain modules
apps/web        React/Vite portal and public readers
apps/extension  Chrome extension popup and capture behavior
apps/docs       Compact alpha docs hub; canonical deep-dive docs live under docs/
docs/           product decisions, plans, ADRs, operations, and roadmap
packages/       shared constants, API contracts, domain policies, UI primitives, and tooling config
```

## Planning Flow

- Meaningful work starts in `docs/plan/`.
- Durable architecture decisions go in `docs/adr/`.
- Product/domain stress tests go in `docs/grill/`.
- Update docs when code behavior, setup, security posture, or product scope changes.
- Keep shared package changes behind focused plans and tests; app-local contracts should stay near their owners until they pass the reuse gate.

Optional agent-assisted work starts with the repository-relative guidance in
`AGENTS.md` and the skill/provenance registry in `docs/agent-workflow.md`. Agent
tools are not required for ordinary contribution. `CONTEXT.md` remains the
canonical product glossary, accepted ADRs remain the durable decision record,
and current implementation/tests remain the source for shipped runtime facts.

## Test Commands

Use the narrowest relevant checks while developing:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB tests require a real testing database configured through `apps/server/.env-cmdrc`.

## Backend Pattern

New backend domains should follow the current module style:

```text
apps/server/src/modules/<domain>/<domain>.routes.ts
apps/server/src/modules/<domain>/<domain>.service.ts
apps/server/src/modules/<domain>/<domain>.repository.ts
apps/server/src/modules/<domain>/<domain>.*.test.ts
```

Avoid reintroducing removed legacy ORCA-style routing.

## Good First Areas

- Documentation freshness.
- Missing or clearer tests around existing behavior.
- UI copy and empty/error states.
- Guide editor usability polish.
- Interactive demo editor usability polish.
- Extension error handling and reliability polish.
- Small route inventory or operations doc updates.

Avoid starting with deep auth, publish access, password security, storage, or migration rewrites unless there is a specific plan and test strategy.

Product Documentation runtime is blocked until Master Plan `005` closes and the
child `131` Documentation domain grill is accepted. Loom-style Video is later
and has no accepted model. `apps/docs` remains repository documentation rather
than either artifact family.

## Privacy And Safety

- Do not commit customer screenshots, private URLs, invite tokens, cookies, bearer tokens, or local storage files.
- Use synthetic screenshots and example domains in docs/tests.
- Public snapshots should not expose internal storage keys or private source metadata.
