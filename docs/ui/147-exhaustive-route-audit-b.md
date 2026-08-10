# Plan 147 — Exhaustive route audit B

Date: 2026-08-08

Scope: public readers/embeds, extension, design-system gallery, unsupported and
lazy-load fallback, and contributor docs. This is an independent audit of the
exhaustive inventory, not human approval.

## Verdict

Revise. No P0 finding.

## Findings and reconciliation

### Documentation has no separate embed mode

The current parser exposes `public_documentation_reader`; `/docs/:slug/embed`
is parsed as that same reader with `pagePath="embed"`. There is no separate
Documentation embed mode or additional surface to invent. Verify the reader's
path handling and content behavior for this page path, and do not introduce a
new mode without an accepted product decision.

### Documentation password UX needed accessibility hardening

The public Documentation password input lacked `autocomplete="current-password"`
and had only successful-unlock coverage. The coordinator added the attribute,
invalid-password retry coverage, and a focused test. Documentation route/state
browser evidence remains limited by unavailable populated fixtures.

### Guide reader needed a skip target

The public Guide reader had no skip-to-content path for keyboard/native-200%
review. The coordinator added a visible-on-focus `Skip to guide content` link,
an explicit focus target, and a focused test.

### Remaining public/extension evidence gaps

Exact route-specific browser proof remains incomplete for bare/versioned
Documentation routes and their unavailable/revoked/expired/unknown/password-
invalid states. Forced lazy-load rejection is component/boundary coverage, not
fresh browser evidence. Extension toolbar-icon activation and permission-popup
behavior remain `blocked_local_for_run`; direct extension-origin lifecycle
evidence does not claim toolbar-popup proof. One known native-200% Documentation
reader contrast-background probe remains incomplete.

## Confirmed baseline

- Guide public reader focused suite: 8 tests passed after the skip-link change.
- Documentation public reader focused suite: 9 tests passed after the password
  form change.
- Design-system, fallback, contributor docs, Guide, and Demo bounded evidence
  remains linked from the ledger and dashboard.
