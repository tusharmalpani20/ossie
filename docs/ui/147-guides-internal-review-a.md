# Plan 147 — guides-internal blind review A

Candidate: `ae217d0` (`fix(web): compose Guide internal surfaces`)

Review lens: Guide library row hierarchy, Edition status, editor
outline/canvas/inspector balance, screenshot and annotation framing, preview
reading measure, Revision history, and 390px composition.

## Verdict

`accept`

## Findings

- The Guide library now presents Project Version context, a clear library
  heading/count, and three readable Edition rows. Status and publish state are
  distinct from metadata, while preview/open/public actions stay together on
  each row. The raw Project ID no longer competes with the Guide heading.
- The editor gives the outline, selected block canvas, publishing panel, and
  Guide metadata distinct visual jobs. The full block outline remains
  available, while the selected-block interaction and all existing controls
  remain intact. At 390px the editor stacks in a stable order without target
  content overflow.
- Preview has a calmer content measure, stronger step/callout framing, and a
  readable action cluster. The dark Edit guide action now has a contrasting
  label. Revision history reads as a small immutable-history task with clear
  owner actions and a clean viewer state.
- The synthetic active Guide media request does not render in this local
  browser because the existing development CSP/API-origin setup blocks the
  direct asset origin. That limitation is visible in evidence and is not
  presented as a fabricated populated-media result.

## Evidence reviewed

- `docs/ui/147-guides-internal-before-list-desktop.png`
- `docs/ui/147-guides-internal-before-list-narrow.png`
- `docs/ui/147-guides-internal-before-editor-desktop.png`
- `docs/ui/147-guides-internal-before-editor-narrow.png`
- `docs/ui/147-guides-internal-before-preview-desktop.png`
- `docs/ui/147-guides-internal-before-preview-narrow.png`
- `docs/ui/147-guides-internal-before-revisions-desktop.png`
- `docs/ui/147-guides-internal-before-revisions-narrow.png`
- `docs/ui/147-guides-internal-before-revision-preview-desktop.png`
- `docs/ui/147-guides-internal-after-list-desktop.png`
- `docs/ui/147-guides-internal-after-list-narrow.png`
- `docs/ui/147-guides-internal-after-editor-desktop.png`
- `docs/ui/147-guides-internal-after-editor-narrow.png`
- `docs/ui/147-guides-internal-after-preview-desktop.png`
- `docs/ui/147-guides-internal-after-preview-narrow.png`
- `docs/ui/147-guides-internal-after-revisions-desktop.png`
- `docs/ui/147-guides-internal-after-revisions-narrow.png`
- `docs/ui/147-guides-internal-after-revision-preview-desktop.png`
- `docs/ui/147-guides-internal-after-revision-preview-narrow.png`
- Authenticated owner/editor/viewer Guide and Revision routes at 1440px and
  390px.

The shared portal navigation, browser zoom limitation, and direct asset-origin
media limitation remain separate follow-ups. No blocking visual finding
remains for this bounded surface.
