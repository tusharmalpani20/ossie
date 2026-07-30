# Ossie Web Portal

React/Vite portal for self-hosted setup, authenticated Ossie workspaces,
authoring, public readers, and embeds.

## Runtime Boundary

`apps/web` is a separate browser application that calls the Fastify API in
`apps/server`. The server does not serve the portal build by default.

The portal owns:

- first-run setup, login, logout, and invite acceptance;
- Organization members and compliance;
- Project, Project Membership, settings, activity, and compliance;
- canonical Project Version workspaces and lifecycle management;
- Capture Session lists/details and manual Capture;
- Guide and Interactive Demo libraries, editors, previews, Revisions,
  Carry-Forward, Publications, and Publish Links;
- public Guide/Interactive Demo readers and embeds.
- version-scoped Product Documentation Site/Page authoring, navigation,
  comments, OpenAPI references, protected images, draft preview, immutable
  Revisions/Publications, Publish Links, rollback, and public readers/search.

The shipped Product Documentation surface is the child `132` first vertical
slice. Remaining V1 Documentation workflows belong to children `133`–`140`.
Video is not implemented.

## Development

From the repository root:

```bash
pnpm --filter web dev
```

The Vite development server uses port `3000`. By default it proxies `/api` to
`http://localhost:3002`. Set `VITE_OSSIE_API_URL` when the API uses another
origin:

```bash
VITE_OSSIE_API_URL=http://localhost:3002 pnpm --filter web dev
```

For production-like local verification:

```bash
pnpm --filter web build
pnpm --filter web start
```

Configure trusted API CORS/cookie origins as described in
`../../docs/development-setup.md` and `../../docs/self-hosting.md`.

## Checks

```bash
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

DB-backed workflows, deterministic browser fixtures, and full smoke commands
are owned by `apps/server`; see `../../docs/development-setup.md` and
`../../docs/v1-dogfood-smoke-suite.md`.

## Architecture Rules

- Keep Organization, Project, and Project Version context explicit.
- Preserve authenticated/public route isolation and canonical deep links.
- Treat `version` fields used for concurrency as Row Versions, not Artifact
  Revisions or Project Versions.
- Do not implement authorization only in the client; the API remains
  authoritative.
- Preserve Capture source immutability, protected shared Assets, immutable
  Publications, and Publish Link access behavior.
- Reuse `@repo/types`, `@repo/constants`, and `@repo/ui` only through their
  existing ownership boundaries.
- Follow `../../PRODUCT.md`, `../../DESIGN.md`, `../../CONTEXT.md`, and accepted
  ADRs for product, design, and domain truth.
