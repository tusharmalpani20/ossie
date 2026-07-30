# Child Plan 134: Documentation Import, Export, And Package Portability

Date reserved: 2026-07-30

Status: Reserved. This is a sequence and scope reservation, not an
implementation-ready plan. Expand and recheck it only after child `133` is
implemented, closed, documented, and committed.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`

Next child:

- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`

## Sequence Gate

Implementation is blocked until the actual child `133` content, snippet, asset,
protected-reference, and snapshot contracts are stable. Early planning must not
invent a parallel persistence or content authority.

## Reserved Goal

Provide safe and deterministic Documentation interchange while keeping
PostgreSQL plus protected File storage authoritative and treating every import
as an inspected mutation and every export as a point-in-time snapshot.

## Reserved Scope

- safe single-Page Markdown import/export;
- a versioned whole-Site ZIP package;
- self-contained OpenAPI JSON/YAML import/export;
- separate inspect and apply APIs and UI;
- package schema versions and supported package migrations;
- deterministic export;
- apply only to a new or empty Site Working Draft;
- atomic and idempotent apply;
- temporary File cleanup;
- product quotas and hard archive/parser ceilings;
- user/operator documentation for format and compatibility.

## Reserved Security Boundary

- defend against path traversal, links, archive bombs, duplicate paths,
  case-folding collisions, oversized entries, excessive nesting, and parser
  exhaustion;
- validate and sanitize constrained content;
- bind inspection state to tenant, Project, actor, expiry, and the exact
  uploaded File;
- prohibit remote fetches and executable customer content;
- prohibit merging into a populated Working Draft;
- never checkpoint or publish automatically.

## Explicit Non-Scope

- Git or GitHub synchronization and conflict semantics;
- merge import into existing authored content;
- Carry-Forward;
- review/approval or API Try It;
- translation, custom domains, public feedback, realtime collaboration, or
  permanent deletion.

## Required Expansion Work

The implementation-ready rewrite must:

- inspect child `133` and list exact affected/read-only files;
- define package manifest/content/media/OpenAPI schemas, versions, hashes,
  ordering, path rules, compatibility policy, and deterministic serialization;
- define inspection and apply identities, persistence, expiry, cleanup,
  transactions, idempotency, Row Versions, errors, and concurrency behavior;
- define exact routes, multipart/File flow, Zod contracts, statuses, permission
  order, tenant isolation, audit/access evidence, and sensitive-field policy;
- define archive limits at compressed, expanded, entry, path, depth, and parser
  levels;
- define failure cleanup, upgrade/rollback behavior, current-truth docs, TDD
  order, and logical commits;
- name malicious and valid fixture matrices plus unit, route, database, smoke,
  web, accessibility, and agent-browser verification.

## Reserved Exit Gate

- malicious packages fail without durable content mutation;
- a valid package exports and imports deterministically;
- export excludes comments, review/evidence state, credentials, and other
  private/non-portable data;
- supported older package behavior is tested and documented;
- child `135` can carry forward every portable owned structure.

## Checklist

- [x] Sequence position reserved.
- [x] Master-defined goal, scope, security, non-scope, and exit gate recorded.
- [ ] Actual child `133` result inspected.
- [ ] Implementation-ready expansion completed and rechecked.
- [ ] Plan checkpoint committed before runtime implementation.
- [ ] Runtime implemented, verified, documented, and closed.

## Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no runtime or active
  current-truth documentation was changed.

## Verification Record

The reservation was checked against Master Plan `006`. No package format,
dependency, API, or implementation has been selected by this reservation.

## Leftovers And Handoff

The expansion must inherit actual child `133` packageable structures and must
stop for user direction before adding Git authority, populated-draft merging,
or any automatically published import behavior.
