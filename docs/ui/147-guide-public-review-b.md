# Plan 147 — guides-public blind review B

Candidate: `953a7fa` (`fix(web): compose public guide reader`)

Review lens: Guide Publication/Revision truth, public-link access, embed
semantics, accessibility, keyboard/reflow/motion behavior, media failure, and
diff boundary.

## Verdict

`accept`

## Findings

- The candidate changes only the public Guide reader shell, reader CSS, media
  failure presentation, focused tests, and evidence. Guide Publication,
  Revision, block, public-link, password, canonical URL, tenant, and server
  contracts remain unchanged.
- The normal reader exposes one title-owned level-one heading and the embed
  preserves its existing `Embedded published guide` accessible name. Block
  content remains typed and immutable; no authoring or administrative actions
  are exposed.
- Valid, password/invalid-password, restricted, expired, revoked, and unknown
  states remain truthful and non-revealing. Empty content is explicit, and a
  missing or failed Capture asset renders `Captured screenshot is unavailable.`
  instead of leaving a broken image in the reader.
- Valid reader, embed, access-error, and unknown-link browser checks returned
  zero axe violations and zero incomplete items. The valid 390px route had
  equal document/body widths, one top-level main, and reduced-motion enabled.
- Focused Guide-reader and public-route tests passed 7/7; the serial web suite
  passed 488/488; typecheck, lint, and production build passed.

No blocking product, access, accessibility, security, or scope finding remains
for this bounded surface.
