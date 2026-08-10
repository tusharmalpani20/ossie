# Plan 147 — Exhaustive route audit A

Date: 2026-08-08

Scope: authenticated/internal routes and nested sections. This is an
independent audit of the exhaustive inventory, not human approval.

## Verdict

Revise. No P0 finding.

## Findings

### P1 — Compliance pagination can overwrite a newly selected filter

`ComplianceTimelinePage` previously let a pending `loadMore()` response append
to the state captured before the Evidence-kind filter changed. The filter could
therefore display stale evidence. The coordinator added a request-sequence
guard and a red/green test covering pagination followed by a filter change.

Verification: focused Compliance suite 3/3 after the fix.

### P1 — Project Workspace route evidence must match the current owner

The current App branch mounts `ProjectWorkspacePage`, while older ledger and
browser evidence describe the historical `LegacyProjectRedirect` behavior. The
inventory keeps this row open until fresh browser evidence proves the current
owner at desktop, 390px, keyboard, archived, denied, not-found, and retry
states.

### P1/P2 — Activity, project compliance, invite, internal library, and nested

Documentation sections remain under-evidenced in the browser

Component tests exist, but route-specific browser proof is incomplete for:

- `/projects/:projectId/activity` and `/projects/:projectId/compliance`;
- valid loaded/accept-success invite flows;
- loading and denied/not-found states for Capture, Guides, Demos, and
  Documentation libraries;
- populated Capture Event/Asset and Guide media fixtures; and
- Site-editor Assets, Snippets, OpenAPI, Portability, Comments, Publishing,
  and lifecycle failure states at narrow/native 200% widths.

The local API runner was unavailable during this audit, so no populated browser
evidence was fabricated.

## Confirmed baseline

- Web: 95 files / 548 tests passed before the new focused additions.
- The current route inventory explicitly distinguishes grouped evidence from
  route-specific proof.
- No authorization, tenant-isolation, immutability, or domain behavior was
  changed by this audit.
