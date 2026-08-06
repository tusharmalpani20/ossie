# Plan 147 — guides-public blind review A

Candidate: `953a7fa` (`fix(web): compose public guide reader`)

Review lens: reader hierarchy, content measure, block framing, media
presentation, empty state, embed restraint, and narrow composition.

## Verdict

`accept`

## Findings

- The public Guide shell now makes the published identity and immutable
  Project Version context legible at a glance, with a deliberate title scale
  and a calm header boundary.
- Guide blocks have a bounded article measure, clear heading hierarchy, and a
  consistent surface frame. The ordered block semantics remain intact even as
  list-marker presentation becomes quieter.
- Screenshot media stays inside the block frame, while the explicit unavailable
  fallback prevents a broken image from becoming unexplained noise.
- At 390px the title, Version context, and block content recompose vertically
  without page overflow. Embed mode keeps the same public reader hierarchy with
  reduced outer padding and no authoring controls.
- The empty guide state is visually intentional and remains concise.

## Evidence reviewed

- `docs/ui/147-guide-public-before-desktop.png`
- `docs/ui/147-guide-public-before-narrow.png`
- `docs/ui/147-guide-public-after-desktop.png`
- `docs/ui/147-guide-public-after-narrow.png`
- Anonymous valid reader and `/embed` at 1440px and 390px.
- Password, restricted, expired, revoked, and unknown-link states.
- No page console errors; valid local API and Capture-asset requests returned
  successfully.

No blocking visual or interaction finding remains for this bounded surface.
