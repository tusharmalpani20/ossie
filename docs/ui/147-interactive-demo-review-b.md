# Plan 147 P1-005 review B — Interactive Demo workbench

Candidate reviewed: `e97647e` (`fix(web): compose interactive demo workbench`)

Reviewer B performed a blind read-only product, accessibility, and adversarial
QA review using only the synthetic disposable fixture and local runner.

## Verdict

`accept`

No P0/P1 product, access, privacy, or accessibility finding was identified.

## Product and security checks

- Edition, Working Draft, Scene, Hotspot, Publication, and Revision identity
  remain owned by the existing routes and request contracts. The candidate
  changes only web composition, client asset hydration, and the archived-shell
  landmark boundary.
- The Publishing & history panel is collapsed by default but still exposes the
  existing Publish this draft, Publication history, and Publish Link controls
  after explicit disclosure. No publication or link mutation was exercised.
- The viewer session rendered the active demo as read-only: Save, Add Scene,
  Archive, Restore, and Hotspot editor controls were absent. The archived route
  retained Restore only for an authorized admin and had one top-level `main`.
- Protected Capture media remained visible but disabled in the selector; the
  broken Capture asset rendered the truthful “Captured screen is unavailable.”
  state and hid direct-manipulation controls.
- Cross-origin Capture assets are fetched with `credentials: "include"` only
  through the existing local API asset URL, converted to a blob URL, and
  revoked on cleanup. No external target request, public URL, tenant, access,
  immutable content, or server contract changed.

## Accessibility and resilience checks

- Active editor axe: 0 violations at desktop and 390px, with one incomplete
  pre-existing contrast probe over three existing textareas. Empty editor axe:
  0 violations with the same fixture textarea probe. Archived, viewer,
  preview, and Revision history routes each reported 0 violations and 0
  incomplete items.
- Desktop and narrow active routes had no horizontal overflow. The 200% CSS
  zoom probe retained `documentElement.scrollWidth <= innerWidth` and
  `bodyScrollWidth <= innerWidth`; reduced-motion media matched and the final
  axe pass remained violation-free.
- Pointer movement changed Scene 2 x from 0.10 to approximately 0.1321 and
  pointer resize changed width from 0.25 to approximately 0.2821. Keyboard
  resize changed width from 0.25 to 0.26. Reload restored the seeded state.
- Preview rendered the Working Draft with the authenticated renderer; Revision
  history exposed immutable Revision entries and links. Empty, archived,
  protected, broken, viewer, and loading/error guard behavior remains covered
  by focused tests and route evidence.
- Final active route requests to API port 3022 all returned 200, including the
  authenticated asset fetch; browser error output was empty. No credentials,
  internal IDs, or private metadata appeared in visible route content.

## P2 disposition

- The axe incomplete contrast probe belongs to existing textarea surfaces and
  could not determine a background because of partial obstruction; it is not a
  candidate violation and remains recorded as residual risk.
- Broader shared-shell, public-access, and extension-toolbar review remains
  outside this candidate.
