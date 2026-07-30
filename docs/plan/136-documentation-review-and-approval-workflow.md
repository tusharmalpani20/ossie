# Child Plan 136: Documentation Review And Approval Workflow

Date reserved: 2026-07-30

Status: Reserved; sequence gate satisfied. This file records future scope only
and must now be expanded and rechecked against the independently closed child
`135` result before implementation.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`

Next child:

- `docs/plan/137-documentation-api-try-it-and-example-experience.md`

## Sequence Gate

Review work cannot start until child `135` establishes stable Edition,
Revision, lifecycle, and archived-parent behavior. Private Page comments from
child `132` remain a separate authoring concern and must not be silently
reclassified as approvals.

Child `135` now satisfies this gate. Expansion must use its final separate
`carry_forward` operation plus ordered `items` response, exact selector
Working Draft/Revision identities, typed target blocker, inherited
Project/Version read-only state, and stable concurrent Carry-Forward
semantics. Archived Page comments remain authorized read-only history: new
threads, replies, resolve, and reopen mutations are blocked.

## Reserved Goal

Add a formal internal review and approval workflow over exact Documentation
review targets while preserving optional publication policy, private comments,
tenant authorization, and immutable output.

## Reserved Scope

- Review Request identity and lifecycle;
- maintainer/reviewer assignment;
- approval and rejection;
- deterministic invalidation of stale approvals;
- notification and delivery state using capabilities actually present in the
  repository;
- optional approval-before-Publication Site policy;
- authorized, audited override with a required reason;
- change summary/history UI;
- review filters/inbox;
- accessibility, privacy, and retention.

## Decisions Deferred To Expansion

Within the accepted boundary, the expanded plan must decide:

- exact role/capability matrix;
- approval count and any maintainer rule;
- which draft/revision changes make an approval stale;
- supported notification transport;
- override visibility;
- archive and cancellation behavior.

The expansion must stop for user direction if it proposes mandatory approval by
default or external reviewers.

## Explicit Non-Scope

- changing private Page comments into public or formal approval records;
- mandatory approval by default;
- external reviewers without Project Membership;
- API Try It;
- translation, custom domains, public feedback, realtime collaboration, Git
  authority, or permanent deletion.

## Required Expansion Work

The implementation-ready rewrite must:

- inspect child `135` and list exact affected/read-only files;
- define Review Request, assignment, decision, notification, policy, override,
  and history schemas, constraints, retention, routes, types, and errors;
- define exact review target identity and stale-approval algorithm;
- define publication gate ordering, authorization, tenant isolation,
  idempotency, Row Versions, transactions, and concurrent decision behavior;
- define audit/access actions and prohibit private content in notification,
  logging, and evidence payloads;
- define upgrade/backward compatibility, rollback, TDD order, documentation,
  and logical commits;
- name unit, route, database, smoke, web, accessibility, privacy, and
  agent-browser review/publication journeys.

## Reserved Exit Gate

- comments remain private and separate;
- publication policy is optional and deterministic;
- stale approval cannot authorize changed content;
- every override is authorized, reasoned, and audited;
- notifications leak no private content;
- child `137` receives stable public-policy configuration.

## Checklist

- [x] Sequence position reserved.
- [x] Master-defined goal, scope, decision boundary, non-scope, and exit gate
      recorded.
- [x] Actual independently closed child `135` result inspected for handoff.
- [ ] Deferred in-boundary decisions resolved during expansion.
- [ ] Implementation-ready expansion completed and rechecked.
- [ ] Plan checkpoint committed before runtime implementation.
- [ ] Runtime implemented, verified, documented, and closed.

## Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no review runtime was added.
- 2026-07-30: Child `135` close-recheck handoff recorded. No review runtime,
  schema, route, or policy decision was added.

## Verification Record

The reservation matches Master Plan `006` and preserves the accepted separation
between comments and formal review. No role or notification capability is
invented here.

## Leftovers And Handoff

The expansion must inventory the repository's real notification capabilities
and request a user decision if mandatory approval or non-member review is
proposed.
