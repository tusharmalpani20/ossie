# Ossie System Design Pattern

Last reviewed: 2026-07-10

## Purpose

This document records the architecture that exists today and the accepted
direction for Master Plan `005`. It does not propose restarting the repository,
and it does not present target domains as shipped packages or tables.

ORCA remains historical engineering inspiration for explicit boundaries,
append-only evidence, typed relational state, and disciplined tests. Ossie does
not depend on ORCA code or inherit its procurement, approval, communication, or
agent domains.

## Current Architecture

The repository is a pnpm/Turborepo monorepo:

```text
apps/server     Fastify REST API, PostgreSQL, local file storage
apps/web        React/Vite portal and public Guide/Demo readers
apps/extension  React/Vite Chrome extension popup and capture worker
apps/docs       Next.js repository documentation hub
packages/types  selected shared Zod API contracts
packages/ui     low-level shared React primitives
packages/*-domain  reusable policies for active product domains
```

Current domain packages are `capture-domain`, `guide-domain`, `demo-domain`,
`publish-domain`, and `file-domain`. Their presence does not mean every rule has
already been extracted from server modules. App-local contracts remain local
until another active consumer or public API contract passes the reuse gate.

The active request path is:

```text
Fastify route
  -> application service
  -> repository or shared domain policy
  -> PostgreSQL / file-storage adapter
```

The portal currently uses a small pathname parser and page-local request/state
management. React Query, TanStack Router, React Router, and other data/routing
libraries are not installed or accepted architectural requirements. Child `122`
must decide those choices from actual workflow and migration evidence.

## Current Product Boundaries

- Capture Sessions, Events, and Assets are reusable source material.
- Guides use Blocks, first-class Steps, and Annotations.
- Interactive Demos use Scenes, Hotspots, and Transitions.
- Guides and Interactive Demos may reuse Capture Assets but never share a vague
  universal content model.
- Current publishing creates immutable snapshots and resolves access through
  stable Publish Links.
- Screenshot capture is implemented; HTML replay is deferred.
- `apps/docs` documents the repository. It is not Product Documentation.

## Accepted Target Architecture

Master Plan `005` adds foundations in this order:

```text
Organization tenant boundary
  -> relational Audit Event / Audit Change Item
  -> relational Access Event
  -> Project Membership authorization
  -> Project Version
    -> Capture Session source ownership
  -> Project-owned Artifact identity
    -> Project Version-scoped Artifact Edition
      -> mutable Working Draft
      -> immutable Artifact Revision
        -> immutable Published Artifact
  -> Artifact-scoped multi-version Publish Link manifest
```

This is an ownership model, not a current folder tree. Documentation is not
inserted into it until child `131` accepts the Documentation domain. Video has no
accepted model in this track.

### Project And Version Ownership

- Organization is the tenant boundary.
- Project Membership controls non-owner Project access.
- Project Versions are release contexts and inherit Project authorization.
- Every Project begins with a real `Main` Project Version after the version
  foundation ships.
- Captures belong to one Project Version; creating or changing the default does
  not move existing source or authored content.
- Stable Guide/Demo Artifact identity remains Project-owned.
- An Artifact has at most one Edition per Project Version.

### Authoring And Publishing

- One mutable Working Draft belongs to each Artifact Edition.
- Row Version is internal optimistic concurrency, not authored history.
- Artifact Revisions are immutable relational checkpoints.
- Published Artifacts identify one exact Revision and add Publication Sequence
  and access/audit evidence.
- Publish Links expose an explicitly selected set of immutable Publications for
  one Artifact and have one link-wide policy plus an explicit default.
- Carry-Forward creates independent target draft content, reuses protected
  immutable assets, and never overwrites or synchronizes an existing Edition.

### Audit, Access, And Authorization

- Audit Event and typed Audit Change Item rows commit atomically with successful
  state changes.
- Access Events capture meaningful logical-resource access or attempted access
  in explicit relational columns without storing credentials, raw URLs, request
  bodies, content, or a generic metadata payload.
- Protected reads append Access Evidence before returning content; evidence
  failure replaces the protected response with a stable unavailable response.
- Organization Owners can query a tenant-scoped combined Audit/Access timeline;
  current Organization Members cannot query raw compliance evidence.
- Database and application controls enforce append-only evidence.
- Project Admin, Editor, and Viewer permissions are accepted future direction;
  they are not shipped by the current Organization-role authorization boundary.
- Organization Owners retain organization-wide governance visibility.

### Assets

- File owns physical storage metadata.
- Capture Asset owns reusable source-media meaning.
- Derived Asset is a processed variant; the source is not rewritten.
- An asset referenced by a Working Draft, Artifact Revision, or Publication is
  protected. Archiving hides it from new selection, while physical purge is
  blocked until no protected reference remains.

## Persistence Rules

SQL migrations are architecture documents and the database source of truth.
Core state uses explicit tables, typed columns, foreign keys, constraints, and
type-specific relational child records.

Do not use generic JSON/JSONB documents for:

- tenant or Project ownership;
- authorization or membership;
- lifecycle and ordering;
- Project Version, Edition, Revision, Publication, or Carry-Forward lineage;
- protected-asset references; or
- Audit/Access before-and-after evidence.

Guide Blocks/Steps/Annotations and Demo Scenes/Hotspots/Transitions remain
separate in Working Draft and immutable history. A Published Artifact points to
one immutable Revision; it does not duplicate a generic `snapshot_json` document.

JSON remains appropriate for HTTP payloads, extension messages, manifests,
configuration, and narrowly accepted non-authoritative data. A future persistent
JSON exception requires an explicit architecture decision.

Never rewrite migration history for naming or model cleanup. Early-stage
breaking changes may use forward migrations and coordinated in-repository client
updates when an accepted child plan explicitly allows them.

## Application Ownership

### `apps/server`

Owns Fastify setup, authentication context, CORS/cookies/multipart, OpenAPI,
route registration, application adapters, SQL repositories, transaction
coordination, storage adapters, and domain-error mapping.

Routes validate transport data and call services. Services apply actor/context
and coordinate domain behavior. Repositories use parameterized SQL and accept a
transaction client for atomic writes. Business decisions do not belong in raw
route handlers or SQL helpers.

### `apps/web`

Owns authenticated portal workflows, editors, public readers, embeds, and
browser-facing state. Product-specific components stay with their feature until
they are truly reusable. Shared primitives belong in `packages/ui`.

Child `121` owns design tokens and primitives. Child `122` owns routing/data
architecture. Later UI children modernize workflows without weakening server
authorization or inventing client-only domain truth.

### `apps/extension`

Owns instance connection, extension authentication transport, Project and later
Project Version selection, screenshot/event capture, safe browser metadata, and
capture-state recovery. It does not author final Guide/Demo structures or own
publishing rules.

Raw input values, credentials, private page content beyond the accepted capture
contract, and customer evidence must not enter tests or documentation.

### `apps/docs`

Owns a compact public navigation surface for repository setup, operations,
status, roadmap, contribution, and safe alpha evidence. Markdown under the root
and `docs/` remains the deep source of truth. Product Documentation will have a
separate domain and runtime owner after its grill.

### Shared Packages

- `packages/types` owns runtime Zod contracts reused by active consumers or
  deliberately public APIs.
- `packages/constants` owns stable shared values that pass the reuse gate.
- `packages/ui` owns low-level reusable UI primitives.
- domain packages own framework-agnostic policies and behaviors that have real
  reuse or complexity.
- app-local HTTP, database, storage, and component types stay with their owner.

Do not create a new package merely because a target noun exists in `CONTEXT.md`.

## Command, Query, And Transaction Rules

Commands own writes. A command that changes product state and its Audit Evidence
must use the same database transaction. Multi-row operations such as
Carry-Forward either commit completely or do not change state.

Queries own reads and apply Organization/Project scoping. They return explicit
read models without mutating state. Public-link reads enforce the link policy and
exact immutable Publication selection.

Repositories remain deliberately boring: parameterized SQL, explicit fields,
no hidden authorization assumptions, and no business branching that belongs in
a command/policy.

## Testing And Verification

Behavior changes use red-green-refactor. Preferred evidence includes:

- domain tests for pure policies and invariants;
- Fastify route/application integration tests;
- PostgreSQL integration tests for constraints, transactions, tenant isolation,
  append-only evidence, and concurrency;
- Testing Library tests for portal behavior;
- extension tests for message, storage, capture, and recovery contracts; and
- real-browser validation for browser-visible changes.

Tests should assert public behavior, authorization, error semantics, immutable
history, and cross-tenant rejection. Avoid tests that only mirror implementation
details or prove that a mock was called.

## Deferred Architecture

Do not create speculative packages, routes, or tables for Product Documentation,
Video, desktop capture, HTML replay, AI, analytics, lead capture, background
workers, object storage, comments, branching demos, or extra exports. Each needs
an accepted product boundary and implementation plan first.

## Short Version

Ossie is an existing domain-oriented monorepo, not a proposed restart. Preserve
its active Fastify/REST/Zod/SQL architecture, make core state explicitly
relational, establish append-only evidence and Project authorization before
version-domain mutations, keep Capture source reusable, and keep every artifact
family's authored content distinct.
