# ADR 0030: Documentation Comments Are Private Authoring Workspace

Date: 2026-07-30

Status: Accepted

## Context

The Documentation first slice needs lightweight collaboration, but full review
gates, public feedback, and realtime editing would expand the initial security
and workflow surface. Comments must not alter or leak through immutable public
content.

## Decision

The first Documentation slice includes authenticated, Project-member-only Page
comment threads with replies, authorized mentions, resolve, and reopen. A thread
uses a stable block anchor when possible and falls back to the Page when its
anchor no longer exists.

Comments remain mutable private authoring records. They are excluded from Site
Revisions, Site Publications, public search, public caches, and exports unless a
future explicit export contract says otherwise. State changes are audited
without copying comment bodies into Audit or Access Evidence.

Review requests, approval states, notifications, maintainers, and an optional
publication gate are remaining V1 work. Public feedback/analytics and realtime
collaboration are later.

## Consequences

- Child `132` must implement comment authorization, tenant isolation, anchor
  fallback, conflict, privacy, and browser-accessibility tests.
- Publishing never waits on comments in the first slice.
- An approval gate cannot become mandatory without a later accepted decision and
  an authorized audited override.
