# ADR 0029: Documentation Reader Is An Authorized Publication Adapter

Date: 2026-07-30

Status: Accepted

## Context

Fumadocs offers useful React reader, search, and OpenAPI primitives, but Ossie
must preserve its tenant, Project Membership, Publish Link, immutable
Publication, audit/access, URL, and rollback rules. A framework-owned content
model or permission check could leak drafts or couple persisted state to one
renderer.

## Decision

Fumadocs Core and selected UI/OpenAPI pieces are the preferred replaceable
reader toolkit after a focused proof. Ossie authorizes and loads one exact
immutable Site Publication before invoking the adapter. Ossie owns the domain
model, URLs, canonical/redirect behavior, access policy, search scope, cache
identity, publication switching, rollback, and evidence.

Public search and caches are scoped by exact Site Publication and access
context. Publication material is prepared before an atomic stable-link switch;
failure leaves live output unchanged. OpenAPI is uploaded, bounded,
self-contained, and read-only in the first slice. No server-side arbitrary API
proxy or stored customer credential is allowed.

## Consequences

- Fumadocs may be upgraded or replaced without changing durable Documentation
  identities.
- Authorization must precede content loading, indexing, caching, and rendering.
- Adapter, sanitization, CSP, OpenAPI, search-leakage, and rollback tests are
  required before adoption.
- Future browser-direct Try It requires a separate security proof.
