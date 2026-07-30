# Child Plan 137: Documentation API Try-It And Example Experience

Date reserved: 2026-07-30

Status: Reserved. This plan is not implementation-ready. Expand and recheck it
after child `136` is implemented, closed, documented, and committed.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/136-documentation-review-and-approval-workflow.md`

Next child:

- `docs/plan/138-documentation-v1-operational-hardening.md`

## Sequence Gate

The actual child `136` public-policy and publication-gate contracts must be
stable. The read-only OpenAPI reference shipped earlier must continue to work
when Try It is disabled or disallowed.

## Reserved Goal

Add a safe browser-direct API exploration and example experience without making
Ossie a request proxy, OAuth broker, credential store, SDK generator, or
authority for customer endpoints.

## Reserved Scope

- approved-origin configuration;
- browser-memory-only credential input;
- a request builder for explicitly accepted methods and content types;
- explicit confirmation before sending;
- CORS/preflight guidance;
- abort and timeout;
- response size, type, and rendering safety;
- safe code/example expansion;
- Publish Link/public policy controls;
- CSP `connect-src` integration;
- quotas, rate, and safety limits;
- privacy-preserving audit/access behavior;
- accessibility and browser proof.

## Reserved Security Boundary

- requests travel directly from the user's browser to an authorized configured
  origin;
- credentials never enter server APIs, persistence, evidence, logs, URLs,
  history, analytics, or saved content;
- origins, schemes, methods, headers, body types, redirects, response size, and
  rendering are bounded;
- public Try It is off unless explicitly allowed by accepted policy;
- disabling Try It leaves the read-only API reference intact.

## Explicit Non-Scope

- server-side proxy or secret injection;
- stored credentials;
- OAuth broker;
- SDK generation;
- arbitrary JavaScript;
- mock server;
- unrestricted endpoints, schemes, headers, or response rendering;
- translation, custom domains, Git authority, or realtime collaboration.

## Required Expansion Work

The implementation-ready rewrite must:

- inspect child `136` and list exact affected/read-only files;
- define approved-origin/policy schemas, contracts, UI state, CSP behavior,
  request validation, limits, timeout/abort, redirects, and safe response views;
- define role/tenant/public policy checks and prove no secret crosses an Ossie
  server or durable boundary;
- define safe failure/error copy, audit/access evidence without credentials,
  concurrency, accessibility, and browser-memory teardown behavior;
- define migration/backward compatibility if policy persistence changes;
- define TDD order, threat tests, CORS fixtures, docs, and logical commits;
- name unit, route (policy only), web, CSP, browser, accessibility, public-link,
  secret-leakage, and regression verification.

## Reserved Exit Gate

- all requests are browser-to-approved-origin only;
- secrets are absent from server traffic, evidence, logs, URLs, and storage;
- disallowed origins/methods/headers/responses fail safely;
- read-only reference behavior is unchanged when Try It is disabled;
- child `138` receives explicit operational metrics and limits.

## Checklist

- [x] Sequence position reserved.
- [x] Master-defined goal, scope, security, non-scope, and exit gate recorded.
- [ ] Actual child `136` result inspected.
- [ ] Implementation-ready expansion completed and rechecked.
- [ ] Plan checkpoint committed before runtime implementation.
- [ ] Runtime implemented, verified, documented, and closed.

## Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no Try It runtime or credential
  flow was added.

## Verification Record

The reservation was checked against Master Plan `006`. It establishes no
approved origins or credential behavior by itself.

## Leftovers And Handoff

Any proposal for a proxy, stored credential, OAuth broker, backend secret, or
public-by-default request execution requires a separate accepted decision and
must not be smuggled into this child during expansion.
