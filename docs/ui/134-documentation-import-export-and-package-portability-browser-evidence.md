# Child 134 Browser Evidence

Date: 2026-07-30

Scope:
`docs/plan/134-documentation-import-export-and-package-portability.md`

## Environment

- Repository: `/home/ubuntu/ossie`
- API: `http://127.0.0.1:3002`, disposable `ossie_test` data
- Portal: `http://127.0.0.1:3000`
- Fixture: synthetic Documentation Admin and Viewer
- Browser automation: `agent-browser 0.33.1`
- Browser: Headless Chrome `151.0.0.0` on Linux
- Admin workbench:
  `/projects/01K12500000000000000000002/versions/summer-release/documentation/01KYT691D6A3YZ33D3XR9F0BXJ`

Generated screenshots, audit JSON, and downloads remained transient under
`/tmp/ossie-134-browser`.

## Passed journeys

- Admin workbench exposed the Import and export landmark, saved-draft ZIP
  download, labelled Site ZIP and Markdown File inputs, Inspect actions, and
  exact OpenAPI export.
- The saved-draft download was a real ZIP. Independent archive inspection
  found the manifest, Site metadata, two typed/readable Pages, one Snippet,
  protected PNG Asset, and exact JSON OpenAPI source.
- Admin uploaded that ZIP through the real portal, received the safe Import
  review and enabled confirmation only after inspection, then cancelled it.
  The review disappeared without mutating the source Site.
- Viewer workbench retained saved-draft ZIP and exact OpenAPI export links and
  exposed no Site-package/Markdown File input, Inspect, Apply, Cancel, upload,
  save, checkpoint, or publish mutation controls.
- Viewer Page exposed readable Markdown export and no Markdown import or Page
  save action.
- At 320 CSS pixels the Admin workbench reported
  `scrollWidth === clientWidth === 320`.
- Admin workbench axe audit reported zero violations and one honest incomplete
  color-contrast sample. Viewer workbench axe audit reported zero violations.
- Browser error events were empty. Console output contained only Vite and
  React development messages.

## Automated boundaries

Database/API tests own the deterministic export→Inspect→Apply round trip,
source digest/fingerprint replay, fresh identity mapping, exact protected
OpenAPI/media import, empty-target enforcement, actor binding, authorization,
Audit/Access coverage, cancellation/expiry cleanup, archive malicious corpus,
duplicate JSON, traversal and expansion ceilings, and transaction rollback.

This browser pass did not duplicate every parser/security case, create a
second custom browser harness, or claim Firefox/WebKit evidence. Those browsers
remain capability-dependent child `138` work.
