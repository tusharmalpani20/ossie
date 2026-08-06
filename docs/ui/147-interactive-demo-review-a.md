# Plan 147 P1-005 review A — Interactive Demo workbench

Candidate reviewed: `e97647e` (`fix(web): compose interactive demo workbench`)

Reviewer A performed a blind visual and interaction review against the frozen
candidate using the synthetic Plan 128 fixture and the local Chromium runner.

## Verdict

`accept`

No P0/P1 visual or interaction finding was identified.

## What was reviewed

- The active workbench now gives the Stage the dominant region. Metadata remains
  available in a compact contextual rail, while Publishing & history is a
  named, collapsed disclosure rather than a permanent competing action stack.
- The 12-scene navigator is a bounded grid with readable scene labels. At
  390px it remains within its own 354px content width and does not create page
  overflow.
- The selected Scene and Hotspot inspector remain contextual. The captured
  screen is visible in the stage, with the existing pointer affordances and a
  focusable resize handle.
- The resize handle now has an explicit keyboard alternative. Pointer movement
  and pointer resize also remain discoverable and update the inspector values
  immediately without requiring a save to prove the local interaction.
- Empty, protected, broken, archived, read-only, preview, and Revision history
  states retain distinct hierarchy and truthful action availability.

## Evidence

- Desktop before/after: `docs/ui/147-interactive-demo-before-desktop.png` and
  `docs/ui/147-interactive-demo-after-desktop.png` at 1440×900.
- Narrow before/after: `docs/ui/147-interactive-demo-before-narrow.png` and
  `docs/ui/147-interactive-demo-after-narrow.png` at 390×844.
- The candidate measured 2,141px document height at desktop and 3,011px at
  390px, with both document and body scroll widths equal to the viewport.
- The candidate retained 101 interactive controls, 12 scene buttons, and a
  collapsed publication/history disclosure by default.
- Browser interaction moved Scene 2 by pointer and resized it by pointer; the
  keyboard resize alternative changed width from 0.25 to 0.26. Reloading
  restored the seeded values, confirming the review did not persist a fixture
  mutation.

## P2 disposition

- Shared portal navigation remains a dense product-wide surface and is outside
  this bounded workbench candidate.
- The 200% probe used CSS zoom because browser zoom controls are environment
  limited; it retained the viewport boundary with no horizontal overflow.
