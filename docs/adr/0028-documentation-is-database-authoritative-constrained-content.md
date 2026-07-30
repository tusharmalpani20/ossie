# ADR 0028: Documentation Is Database-Authoritative Constrained Content

Date: 2026-07-30

Status: Accepted

## Context

Documentation authoring benefits from rich editing and Markdown interchange,
but executable MDX and a second Git authority would complicate security,
concurrency, publication atomicity, and self-hosting. ADR `0025` requires core
product state to remain explicitly relational.

## Decision

Ossie's relational database and protected File storage are the sole
Documentation authority. Pages, navigation, blocks, snippets, aliases,
redirects, comments, and immutable Revision state use explicit relational
records. Imports are validated mutations; exports are snapshots. Git/GitHub
synchronization is deferred.

Tiptap is the preferred replaceable editor adapter after a focused proof. Safe
Markdown is an interchange format. Customer-authored MDX, JavaScript, React,
raw HTML, and arbitrary iframes are rejected. Rich behavior uses a constrained
set of Ossie-owned typed blocks. Tiptap's transient document model is not the
persistent domain model.

## Consequences

- Authorization, audit, optimistic concurrency, revisions, and migrations have
  one authority.
- Import/export and any future Git integration require explicit conflict and
  validation workflows.
- Editor serialization must map safely to relational records and preserve a
  Markdown-compatible subset.
- Executable customer content cannot be used as an extension mechanism.
