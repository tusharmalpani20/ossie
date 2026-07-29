# Child 128 Interactive Demo Browser Evidence

Date: 2026-07-29

Status: Passed

## Environment

- Repository checkpoint before documentation closeout: `44ab9f3`
- Web: Vite development server at `http://127.0.0.1:3000`
- API: testing profile at `http://127.0.0.1:3002`
- Database: disposable `ossie_test`, reset by the guarded
  `seed:interactive-demo-browser-fixture` command
- Browser: headless Chromium through the installed `agent-browser` skill
- Data: synthetic fixture users, screenshots, Revisions, Publications, and
  Publish Links only

The fixture supplied Project Admin, Editor, and Viewer roles; a separate
archived Project; Default, named active, and archived Project Versions; empty,
active, and archived Demo Editions; twelve authored Scenes; all three Hotspot
types and transition directions; active, archived-protected, and intentionally
broken media; three immutable Revisions and Publications; a two-Version public
manifest; and public, password, restricted, expired, and revoked Links.

## Authenticated Results

- Capture detail kept Guide and Interactive Demo generation distinct.
  Interactive Demo generation from the completed synthetic Capture navigated
  to the exact named Project Version's canonical editor and generated its
  initial Scene/background.
- The Editor workbench rendered one selected Scene, one selected Hotspot
  inspector, a stable twelve-Scene rail, active/broken/archived-protected
  background choices, Publication history, and independent Link controls.
- The empty Demo flow created and selected a Scene, saved a selected screenshot,
  created and automatically selected its first Hotspot, and persisted edited
  type/copy without a reload gap.
- Canvas keyboard movement changed normalized Hotspot coordinates by `0.01`;
  save/reload preserved the updated `0.11 / 0.21` position. Pointer move/resize,
  clamping, aspect-ratio projection, and no-request-before-save behavior also
  passed focused component tests.
- Two independent Editor sessions produced a real stale Working Draft
  conflict. The losing session retained its unsaved description, showed the
  conflict state, and froze unsafe controls without retrying.
- Working Draft preview traversed the shared renderer from Scene 1 to Scene 2.
  Immutable Revision preview continued to show Revision content after later
  Working Draft edits.
- Checkpoint created Revision 3. Publishing with no selected Links created
  Publication 3 from the reused Revision 3 and reported that zero Links were
  updated.
- Carry-Forward reported the existing target Edition by title without exposing
  an internal Artifact ID. Its target-conflict path and page passed axe.
- Viewer received a read-only workbench with content, Revision history, and
  Publication history but no authoring mutations. Archived Project, archived
  Project Version, and archived Edition surfaces showed truthful read-only or
  restore behavior.

## Public Results

- Public reader and embed used the same normalized overlay renderer as Working
  Draft and immutable Revision previews.
- A transitioned Hotspot moved focus/content to the immutable target Scene;
  Previous and Restart supplied in-view recovery.
- The two-Version selector showed the default named Version and Main. Selecting
  Main canonicalized to the exact `/versions/main` reader route and rendered
  the Main Revision without changing reader/embed mode.
- Password unlock succeeded; a wrong password retained a usable error form.
  Restricted, expired, revoked/unknown, and unavailable-Version routes rendered
  distinct safe states. A transient request failure rendered a retry action.
- Raw public JSON contained two manifest entries and no
  `created_by`, `updated_by`, Edition/Revision IDs, Working Draft state,
  storage keys, or source-Capture provenance.

## Responsive, Keyboard, Motion, And Accessibility Results

- Desktop authoring and reader passes used the headless server viewport.
- Narrow embed: `390 × 844`, with document width equal to viewport width.
- 200% reflow equivalent: `640` CSS pixels, with document width equal to
  viewport width.
- Chromium reduced-motion emulation was active during the reflow pass; Scene
  navigation retained the same status/focus semantics without motion.
- Scene rail, reorder controls, canvas Hotspots, resize handles, numeric
  geometry, inspector fields, Publication/Link controls, and public navigation
  remained keyboard reachable.
- Axe reported zero violations for public reader/embed, Revision history,
  Carry-Forward conflict, and the final authoring surface. The authoring scan
  retained three indeterminate textarea contrast checks because axe could not
  resolve their partially obscured background; manual inspection found the
  shared white field/slate text treatment unchanged.

## Evidence Files

- `evidence/128/editor-publication.png`
- `evidence/128/public-multi-version.png`
- `evidence/128/carry-forward-conflict.png`

All committed screenshots contain only fixed synthetic fixture content. No
password, session token, cookie, browser profile, storage key, or customer data
is recorded.

## Result

The Child 128 browser gate passed. No migration, public URL/access semantic,
persistence redesign, or production browser dependency was introduced.
