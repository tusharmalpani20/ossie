# Plan 147 — guides-internal blind review B

Candidate: `ae217d0` (`fix(web): compose Guide internal surfaces`)

Review lens: Project Version and role boundaries, draft/archive semantics,
immutable Revision/Publication behavior, Capture-source and asset protection,
preview action contrast, error/retry/conflict behavior, keyboard/axe/zoom/
motion, media limitation, and exact diff scope.

## Verdict

`accept`

## Findings

- The candidate is composition-only. It adds named Guide and Revision
  workspace regions, replaces raw CSS values with existing Ossie tokens,
  improves responsive layout, and corrects the preview primary-link contrast.
  It does not alter Guide Edition/Working Draft persistence, Capture-source
  identity, asset protection, Publication/Publish Link behavior, Project
  Version selection, permissions, tenant isolation, immutable Revisions, or
  public URLs.
- Owner/editor routes retain the existing save, block selection/reorder,
  screenshot selection/upload, annotation, publication, archive/restore,
  checkpoint, and restore controls. Viewer detail renders Preview with Read
  only and no Edit or publishing mutation; viewer Revision history has no
  Create checkpoint or Restore controls.
- List, preview, Revision history, and Revision preview routes report zero axe
  violations, one main landmark, named target regions, and no content-area
  overflow at desktop/narrow widths. The editor retains the two existing
  incomplete contrast-background probes over live textareas/controls; those
  are not violations and are unchanged in semantics. Reduced motion and Tab
  navigation were checked. Browser zoom controls remain environment-limited.
- The active synthetic asset's direct image request is blocked by the existing
  local development CSP/API-origin setup. Component tests continue to cover
  media, annotations, broken/missing asset states, and immutable Revision
  responses; browser evidence makes no populated-media claim.
- Final verification passes: focused Guide/Revision tests 19/19, serial web
  suite 495/495, web check-types, lint, and production build. The repository
  `check-css-tokens` command remains red on pre-existing Documentation
  fallback consumers (`--ossie-color-link`, `--ossie-font-family-sans`,
  `--ossie-font-size-sm`, and `--ossie-radius-md`), tracked as P2-010. The
  Guide candidate introduces no undefined token names. Post-restart route
  checks produced no new browser errors; persistent session history retains
  the earlier Vite HMR export messages recorded during the Capture runner
  incident.

No blocking product, authorization, tenant-isolation, privacy, immutable
content, public-link, accessibility, mutation, or scope finding remains for
this bounded surface.
