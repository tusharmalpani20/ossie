# Plan 147 — demos-public blind review A

Candidate: `fff22eb` (`fix(web): compose public interactive demo viewer`)

Review lens: visual hierarchy, interaction clarity, responsive composition,
embed restraint, stage framing, and playback feedback.

## Verdict

`accept`

## Findings

- The public shell now establishes a clear published-demo identity with one
  level-one heading, a concise description, and a visible Version control.
- The captured-screen stage remains the dominant region while the Scene
  heading, progress indicator, and Previous/Restart controls form a quiet
  playback frame around it.
- The narrow 390px composition stacks the shell controls without horizontal
  overflow; the stage remains readable and the hotspot label stays attached to
  its target.
- The embed mode keeps the same public identity and immutable playback
  affordances while reducing outer padding; it does not expose authoring or
  administrative controls.
- Scene transition, Previous Scene, and Restart provide clear, predictable
  feedback and preserve the existing immutable playback contract.

## Evidence reviewed

- `docs/ui/147-interactive-demo-public-before-desktop.png`
- `docs/ui/147-interactive-demo-public-before-narrow.png`
- `docs/ui/147-interactive-demo-public-after-desktop.png`
- `docs/ui/147-interactive-demo-public-after-narrow.png`
- Anonymous valid reader and `/embed` at 1440px and 390px.
- Version selection to the explicit `main` public URL.
- Scene transition and Previous Scene interaction.
- No page console errors; local document, API, and Capture-asset requests
  returned 200 during valid playback.

No blocking visual or interaction finding remains for this bounded surface.
