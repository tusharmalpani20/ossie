# ADR 0031: Documentation Import And Export Is Inspected Portability, Not Authority

Status: Accepted and implemented
Date: 2026-07-30

## Context

Customer-authored Documentation needs a safe way to move one Page or one
complete Site between Ossie instances. A ZIP, Markdown file, or OpenAPI source
is untrusted input and cannot become a second live content store. Database IDs,
storage coordinates, private comments, access policy, Audit evidence, and
Publication history must not cross this boundary.

## Decision

Ossie keeps relational Documentation rows and protected Files authoritative.
Portable content uses:

- a versioned, deterministic Site ZIP with typed JSON as the lossless contract;
- readable Markdown companions that are not authoritative in a round-trip ZIP;
- standalone Markdown as intentionally lossy, create-only Page interchange;
- package-local handles, with fresh ULIDs allocated during Apply;
- embedded bounded image and self-contained OpenAPI source bytes;
- explicit rebinding of Guide and Interactive Demo Publications.

Every import is split into actor-bound `Inspect` and `Apply`. Inspect streams,
hashes, parses, and records a safe bounded report without changing a Working
Draft. Apply rereads the exact source, verifies its digest and fingerprint,
reauthorizes the target and bindings, checks Row Versions, then performs one
idempotent transaction and one Working Draft bump. Whole-Site Apply can create
a Site or target an explicitly empty Site; it never merges into populated
content and never checkpoints or publishes.

ZIP parsing rejects traversal, links/devices, duplicate or case-colliding
paths, encryption, unsupported compression, excessive expansion, and
undeclared or mismatched entries. Markdown accepts a closed CommonMark subset
without HTML, MDX, directives, remote media, or executable content. OpenAPI
continues to reject remote references. Git, remote URL import, and live sync
are outside V1.

## Consequences

- Exported packages are snapshots and imported packages are mutation inputs,
  never authority or lineage.
- Package V1 is a compatibility contract and must evolve by explicit version.
- Standalone Markdown cannot replace a Page and does not preserve all typed
  relationships or media.
- External Publication display metadata is review-only; the importing user
  selects an exact authorized Published Artifact.
- Temporary inspection sources expire and are purged; successfully imported
  Files follow normal protected retention.
- Existing Site, Page, OpenAPI, Revision, Publication, and public-reader
  contracts remain additive and compatible.

## Reversibility

The import/export routes and migration can be disabled without changing the
authority of existing Documentation. Permanent Import Application rows remain
safe provenance. Removing package V1 support later requires an explicit
compatibility decision; existing relational content remains usable.
