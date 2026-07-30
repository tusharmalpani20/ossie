# ADR 0027: Documentation Sites Use Edition-Wide Revisions And Publications

Date: 2026-07-30

Status: Accepted

## Context

Documentation needs stable identity across Project Versions, independently
editable Pages, atomic public output, and compatibility with the Project
Version/Edition/Revision/Publication model accepted in ADRs `0021`, `0022`, and
`0026`. Per-Page publication would allow readers to observe internally
inconsistent navigation, links, API references, and search state.

## Decision

A Project owns many Documentation Sites. A Site has at most one Site Edition per
Project Version. Each Edition owns one mutable Site Working Draft containing its
Pages and other Site structure.

Pages use Row Versions for mutable concurrency, but immutable history is created
only as a complete Site Revision. A Site Publication references one exact Site
Revision and freezes the complete reader-visible Site. Publication preparation
finishes before a stable Publish Link entry is atomically switched. Rollback
repoints that entry to an older immutable Site Publication.

Documentation Carry-Forward copies a selected whole Site from an exact Site
Revision into a missing target Site Edition. It is atomic, idempotent, does not
overwrite, and creates independent target working state.

## Consequences

- Navigation, Pages, redirects, assets, OpenAPI, settings, and search state are
  consistent within each Publication.
- Page autosaves do not create noisy immutable history.
- Publication and Carry-Forward need complete manifests and transactional
  safeguards.
- Guide, Interactive Demo, and Documentation content stay type-specific while
  sharing version and publication semantics.
