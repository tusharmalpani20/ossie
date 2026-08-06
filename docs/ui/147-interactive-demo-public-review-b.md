# Plan 147 — demos-public blind review B

Candidate: `fff22eb` (`fix(web): compose public interactive demo viewer`)

Review lens: product truth, public-link and Revision semantics, accessibility,
keyboard/reflow/reduced-motion behavior, error states, asset safety, and diff
boundary.

## Verdict

`accept`

## Findings

- The candidate changes only public viewer composition, renderer title
  ownership, tokenized CSS, focused tests, and evidence. It does not change
  Publish Link, Publication, Revision, access, canonical URL, password,
  tenant, or server behavior.
- Public valid, password, invalid-password, restricted, expired, revoked, and
  unavailable states remain truthful. The password field retains its value
  only for the failed attempt and exposes the failure through a live alert.
- The public shell contains no authoring/admin actions. Version selection still
  resolves to the canonical public URL and immutable playback remains
  keyboard-operable through native buttons and the existing hotspot controls.
- Anonymous valid reader, embed, access-error, and unknown-link checks returned
  zero axe violations and zero incomplete items. The valid 390px route had
  equal document/body widths; reduced-motion was enabled during the route
  check.
- Broken/missing Capture media continues to use the renderer's explicit
  unavailable state and hides Hotspots after media failure. Cross-origin
  Capture hydration remains credentialed to the existing API asset endpoint
  and does not introduce target navigation or metadata requests.
- Focused renderer/public tests passed 10/10; the serial web suite passed
  486/486; typecheck, lint, and production build passed.

No blocking product, access, accessibility, security, or scope finding remains
for this bounded surface.
