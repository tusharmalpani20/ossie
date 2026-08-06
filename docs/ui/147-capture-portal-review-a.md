# Plan 147 — capture-portal blind review A

Candidate: `f4a6010` (`fix(web): compose Capture portal surfaces`)

Review lens: Capture Session identity, list-row hierarchy, status/source badges,
create affordance, metadata density, detail metrics, upload/events/assets
framing, and narrow composition.

## Verdict

`accept`

## Findings

- The Capture Sessions list now has a clear Project Version-scoped heading,
  one named workspace region, a grouped create action, and card rows that
  separate session identity, lifecycle/source status, target URL, timestamps,
  and browser metadata.
- The detail route gives the session identity, lifecycle state, metrics, and
  upload/events/assets sections distinct visual groups. Empty event and asset
  states remain explicit instead of looking like missing content.
- At 390px the list cards, context identity, create form, metrics, and detail
  sections stack without target-content overflow. The narrow create form keeps
  its first text field focused after opening.
- Canceled and capturing synthetic states retain their existing distinctions.
  The browser fixture does not expose populated Event or Asset records, so
  those populated visual states were not fabricated; component tests remain
  the evidence for those records.

## Evidence reviewed

- `docs/ui/147-capture-portal-before-list-desktop.png`
- `docs/ui/147-capture-portal-before-list-narrow.png`
- `docs/ui/147-capture-portal-before-detail-desktop.png`
- `docs/ui/147-capture-portal-before-detail-populated-desktop.png`
- `docs/ui/147-capture-portal-after-list-desktop.png`
- `docs/ui/147-capture-portal-after-list-narrow.png`
- `docs/ui/147-capture-portal-after-create-form-narrow.png`
- `docs/ui/147-capture-portal-after-detail-desktop.png`
- `docs/ui/147-capture-portal-after-detail-populated-desktop.png`
- `docs/ui/147-capture-portal-after-detail-narrow.png`
- Authenticated owner list/create/detail routes at 1440px and 390px.

The shared portal navigation remains a separate shell-family concern. No
blocking visual or interaction finding remains for this bounded surface.
