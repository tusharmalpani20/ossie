# Child Plan 138: Documentation V1 Operational Hardening

Date reserved: 2026-07-30

Status: Reserved. This child is not implementation-ready. Expand and recheck it
against the completed children `132` through `137`, especially the actual
operational limits and leftovers delivered by child `137`.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/137-documentation-api-try-it-and-example-experience.md`

Next child:

- `docs/plan/139-documentation-v1-final-closeout.md`

## Sequence Gate

Children `132` through `137` must be implemented, closed, documented, and
committed. This child hardens the accepted V1; it does not absorb unfinished
feature scope from predecessors without explicit reclassification.

## Reserved Goal

Close material Documentation V1 reliability, security, accessibility,
performance, search, SEO, migration, and operator gaps before final
certification.

## Reserved Scope

- Organization quota settings and usage reporting;
- hard operator safety ceilings;
- publication scheduling, concurrency, and timeouts;
- cache invalidation and rebuild;
- search rebuild, isolation, and ranking;
- canonical metadata, sitemaps, robots policy, and social output;
- deployment-boundary proof for crawler-visible route-specific initial
  HTML/status in the current split static-Vite/Fastify architecture;
- access policy hardening;
- archive and retention consistency;
- clean migration, upgrade, reset, and reseed paths;
- backup/restore operator implications;
- health, readiness, and failure reporting;
- dependency/version/license recheck;
- WCAG and manual accessibility;
- Core Web Vitals and editor performance;
- browser matrices and failure injection;
- active threat-model closure.

## Explicit Non-Scope

- Do not add a new product feature under the label of hardening.
- Do not implement any child `140` candidate.
- Do not weaken authorization, exact-Publication output, immutable history,
  protected references, private comments, or secret boundaries for performance.
- Do not claim unsupported browsers or unverifiable performance evidence.
- Governed permanent deletion, Git authority, translation, custom domains,
  external reviewers, public feedback, realtime collaboration, and offline
  editing remain outside V1 unless a prior accepted child explicitly changed
  the master.

## Required Expansion Work

The implementation-ready rewrite must:

- inventory the complete child `132`–`137` code/schema/contract/dependency and
  open-risk state;
- assign every finding to an exact affected file and owning subsystem;
- specify concrete product quotas, hard ceilings, performance budgets,
  accessibility targets, browser matrix, cache/search rebuild invariants,
  readiness behavior, crawler/SEO delivery boundary, and failure-injection
  cases;
- define exact schema/API/config/operator-doc changes, permissions, audit/access
  evidence, migration/rollback, compatibility, and security tests;
- define an S1/S2 classification and repeat-until-clean rule;
- define TDD order, full focused/broad verification, agent-browser/manual
  evidence, active current-truth updates, and logical commit boundaries.

## Reserved Exit Gate

- no open S1/S2 Documentation issue;
- representative upper-bound fixtures pass or reject safely at recorded limits;
- exact Publication recovery/rebuild succeeds;
- no cross-tenant leak through search, cache, logs, evidence, or public output;
- performance and accessibility targets have truthful evidence;
- operator documentation matches shipped behavior;
- child `139` receives a stable implementation rather than unfinished
  features.

## Checklist

- [x] Sequence position reserved.
- [x] Master-defined goal, scope, boundary, and exit gate recorded.
- [ ] Actual children `132`–`137` inspected.
- [ ] Implementation-ready hardening plan expanded and rechecked.
- [ ] Plan checkpoint committed before runtime implementation.
- [ ] Runtime/evidence changes completed and rechecked.

## Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no runtime or operator setting
  was changed.

## Verification Record

Reservation content was checked against Master Plan `006`. No browser,
performance, security, or operational verification has yet been performed by
this child.

## Leftovers And Handoff

Expansion must classify predecessor leftovers honestly. Feature work that
cannot be justified as V1 hardening must remain documented future work rather
than becoming an implicit exit blocker or hidden implementation.
