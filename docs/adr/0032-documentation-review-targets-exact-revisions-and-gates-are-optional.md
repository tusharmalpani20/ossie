# ADR 0032: Documentation Review Targets Exact Revisions And Gates Are Optional

Date: 2026-07-30

Status: Accepted and implemented by child `136`

## Context

Documentation needs internal review without turning comments into approvals,
making review mandatory for every Site, or allowing approval of mutable content
to authorize a different Publication. Project Membership remains the authority
for access and capabilities. Existing Sites must remain publishable after the
additive migration.

## Decision

- One independently mutable Review Policy belongs to each Site Edition.
- The default mode is `optional`; an Admin may opt an Edition into
  `approval_required`.
- A Review Request targets one exact immutable Site Revision and freezes its
  approval threshold, maintainer requirement, and assigned internal reviewers.
- Only the newest request for that exact Revision governs Publication. Creating
  a newer Revision supersedes open requests for older content.
- Decisions are immutable. Decision and Publication evaluation revalidate the
  reviewer's current active Project access and eligible role.
- Approval is evidence for a Publication gate, never a grant of access or
  Publication capability.
- Publication and rollback evaluate policy, exact Revision, current request,
  current reviewer eligibility, and link mutation in one serialized
  transaction.
- A Project Admin may override an unsatisfied gate only with a normalized
  reason. Every successful post-migration link switch records immutable
  Publication Review Evidence atomically; override reasons are Admin-only.
- Notifications are private, content-free, in-product records with
  recipient-owned read state. External delivery is outside V1.
- Comments remain separate private Page-authoring state and are never review
  decisions or public output.

## Consequences

Existing Editions receive an optional policy, preserving pre-child-`136`
publication behavior. Existing Publications and links remain immutable and
readable; historical pre-migration switches legitimately have no review
evidence. Approval cannot be borrowed by a changed Revision, a revoked
reviewer, a different Site/Edition, or another tenant. Review history and
evidence are retained indefinitely in V1; governed cleanup and reporting belong
to operational hardening.

This ADR does not introduce external reviewers, email/webhook delivery,
mandatory review by default, public review metadata, or review-based
authorization.
