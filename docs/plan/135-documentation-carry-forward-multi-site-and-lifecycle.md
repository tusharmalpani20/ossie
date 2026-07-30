# Child Plan 135: Documentation Carry-Forward, Multi-Site, And Lifecycle

Date reserved: 2026-07-30

Status: Reserved. This child is not implementation-ready. Expand and recheck it
against the completed child `134` result before any runtime work.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/134-documentation-import-export-and-package-portability.md`

Next child:

- `docs/plan/136-documentation-review-and-approval-workflow.md`

## Sequence Gate

Child `134` must be implemented, closed, documented, and committed. The
expansion must use its actual portable structure coverage and the actual
Documentation schema rather than treating import/export packages as the
Carry-Forward authority.

## Reserved Goal

Make Documentation correctly version-aware and manageable across Project
Versions while preserving stable Site identity, Edition independence,
immutable history, and retained public output.

## Reserved Scope

- multiple Documentation Sites in one Project;
- enforce at most one Site Edition per Site and Project Version;
- whole-Site Carry-Forward from one exact immutable Site Revision;
- explicit source/target selection;
- independently copied Pages, navigation, snippets, settings, OpenAPI state,
  and other Edition-owned structures;
- safe protected File reuse;
- atomic, idempotent, no-overwrite Carry-Forward with immediate-source
  provenance;
- Site, Edition, Page, OpenAPI, and asset archive/restore;
- canonical alias, redirect, and `gone` lifecycle;
- effective read-only behavior for archived Projects and Project Versions;
- retained Publication and Publish Link behavior;
- lifecycle-aware library, selector, and search behavior.

## Reserved Security And Compatibility Boundary

- source and target must be authorized and belong to the same tenant and
  Project;
- archived or immutable source data never becomes mutable;
- retries do not duplicate targets and failures leave no partial Edition;
- protected File reuse must remain authorized and reference-accounted;
- archive/restore never destroys immutable Publication output or evidence;
- no governed permanent deletion is introduced.

## Explicit Non-Scope

- formal review/approval;
- API Try It;
- translation workflows, custom domains, external reviewers, public feedback,
  realtime collaboration, Git authority, or permanent deletion.

## Required Expansion Work

The implementation-ready rewrite must:

- reconcile the completed child `134` schema/contracts/routes and list exact
  affected/read-only files;
- define Carry-Forward request/provenance/idempotency schemas, constraints,
  transactions, routes, statuses, errors, and audit/access evidence;
- enumerate every copied, reused, reset, or deliberately excluded structure;
- define lifecycle state machines, effective read-only rules, restore
  collisions, link behavior, search visibility, and retained history;
- define role/capability checks, tenant isolation, protected references,
  Row Versions, concurrent requests, migration compatibility, and rollback;
- define TDD order, focused unit/route/DB/smoke/web tests, and agent-browser
  cross-Version, archive/restore, and failure-path validation.

## Reserved Exit Gate

- cross-Version browser and database journeys pass;
- source and target edits remain independent;
- retry produces no duplicate and failure produces no partial target;
- archived immutable output stays exact and reachable under accepted policy;
- child `136` receives stable Edition and Revision review targets.

## Checklist

- [x] Sequence position reserved.
- [x] Master-defined goal, scope, security, non-scope, and exit gate recorded.
- [ ] Actual child `134` result inspected.
- [ ] Implementation-ready expansion completed and rechecked.
- [ ] Plan checkpoint committed before runtime implementation.
- [ ] Runtime implemented, verified, documented, and closed.

## Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no runtime change was made.

## Verification Record

The reservation's sequence, scope, and exit gate match Master Plan `006`.
Carry-Forward implementation details intentionally remain unresolved until
child `134` supplies the real structures.

## Leftovers And Handoff

Expansion must explicitly classify every Edition-owned structure. Any request
for cross-Project copy, overwrite, or permanent deletion requires separate
accepted scope.
