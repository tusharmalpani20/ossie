# Child 121 Representative UI Directions

Date: 2026-07-26

Commit: `dcfb6ab`

## Status

Accepted by the user and closed with Child `121` on 2026-07-26. This is a
historical structural reference, not a complete visual-pattern catalogue.
Current authority lives in `DESIGN.md`, Plan `147`, and `docs/ui/README.md`.

## Review Route

Development-only route:

```text
/__design-system
```

Rules:

- synthetic data only;
- no authenticated state;
- no private API calls;
- unsupported in production behavior;
- not a product navigation destination.

## Direction 1: Library/Operations

The library direction uses compact table/list structure with explicit Artifact
kind, status, Project Version, and row-readable text. State is not color-only.

Use this direction for:

- project list;
- project/version library;
- capture session list;
- Guide list;
- Interactive Demo list;
- publish link/history lists.

## Direction 2: Authoring Workbench

The authoring direction uses stable regions:

- navigator or outline;
- primary canvas/document;
- contextual inspector;
- compact command bar.

This direction avoids nested cards. Rails and canvas areas use structural
boundaries, stable dimensions, and state messages that do not shift controls.

Use this direction for:

- Guide editor;
- Interactive Demo editor;
- capture detail review and conversion surfaces.

## Direction 3: Reader/Viewer

The reader/viewer direction puts published content first. Chrome is minimal.
Publish Link-scoped Project Version context appears only when the link includes
multiple entries.

Use this direction for:

- public Guide reader;
- public Guide embed;
- public Interactive Demo viewer;
- public Interactive Demo embed;
- immutable Revision preview surfaces where applicable.

## Shared Rules

- Keep Project Version context visible.
- Use text-backed badges for state.
- Keep controls stable during loading and validation.
- Use restrained color.
- Use reduced-motion instant state changes.
- Preserve semantic HTML and keyboard order.

## Acceptance Record

Child `121` recorded explicit user acceptance of:

- `PRODUCT.md`;
- `DESIGN.md`;
- the three representative directions above.

Later completed work added entry/onboarding, settings/admin,
activity/compliance, and compact extension needs. Plan `147` now owns their
production pattern candidates and page-by-page visual acceptance. Existing
Child `121` screenshots remain functional or historical evidence unless they
are explicitly reclassified under that plan.
