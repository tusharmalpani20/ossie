# Child 127 Guide Browser Evidence

Date: 2026-07-29

Status: Passed

## Environment

- Repository checkpoint before evidence closeout: `3253b9e`
- Web: Vite development server at `http://127.0.0.1:3000`
- API: testing profile at `http://127.0.0.1:3002`
- Database: disposable `ossie_test`, reset by the guarded
  `seed:guide-browser-fixture` command
- Browser: Headless Chrome `151.0.0.0` through `agent-browser`
- Data: synthetic fixture users, content, media, Revisions, Publications, and
  Publish Links only

The fixture supplied Project Admin, Editor, and Viewer roles; active, empty,
and archived Guide Editions; twenty mixed Blocks; active, archived, and
intentionally broken protected media; two immutable Revisions; two
Publications; and public, password, restricted, expired, and revoked links.

## Authenticated Results

- Project Admin and Editor opened the canonical named Project Version Guide
  editor and received metadata, Block/Step, screenshot, highlight, lifecycle,
  Revision, export, Publication, and Publish Link mutation controls.
- Viewer opened the same Guide identity through the purposeful read-only
  preview. It exposed permitted exports and Publication/Publish Link history
  without edit, archive, checkpoint, publish, or link mutation controls.
- The editor and Viewer preview each render exactly one shared portal shell and
  one `Sign out` control.
- Capture detail kept `Create guide` separate from
  `Create interactive demo`. Creating a Guide navigated to a new canonical
  `/projects/:projectId/versions/summer-release/guides/:guideId` route and
  retained the Capture Session's Project Version.
- The Guide library showed the generated, active, empty, and archived Editions
  in the selected Project Version, including truthful public-link presence.
- The authoring workbench rendered an outline, one selected Block editor, and
  an inspector. Switching among twenty Blocks did not render twenty editing
  forms at once.
- Empty Guide insertion exposed all supported Block controls. Archived Guide
  state disabled Working Draft saves and new Publication while retaining the
  authorized restore command and readable Publication history.
- Revision history exposed checkpoint/restore actions and immutable Revision
  previews. Carry-Forward identified source and target Project Versions and the
  three selectable Guide Editions without mutating either side during this
  evidence run.
- Broken screenshot media produced an explicit recovery state, disabled the
  screenshot viewer trigger, and removed highlight editing without deleting
  stored annotation data.
- The screenshot viewer opened as a modal dialog, remained usable in the
  reflow viewport, closed with Escape, and restored focus to the originating
  `Open screenshot for step 1` button.

## Public Results

- Public reader and embed rendered the exact immutable Publication content and
  Revision-backed protected image.
- Embed removed nonessential reader chrome while preserving Guide semantics.
- Password link showed a password gate; a wrong password retained a retryable
  form with `Password is invalid.`; the fixture password opened the Guide.
- Restricted returned the safe `This Publish Link is restricted.` state.
- Expired returned the safe `This Publish Link has expired.` state.
- Revoked and unknown-version routes returned the non-enumerating
  `Published guide was not found.` state.
- Raw public JSON was separately inspected and DB/smoke-tested. It omits
  `created_by_id`, `updated_by_id`, `source_capture_session_id`,
  `source_working_draft_version`, Edition identifiers, storage keys, and
  private Capture metadata.
- Browser console/error checks were clean after fresh navigation. Network
  responses matched the expected `200`, `400`, `401`, `403`, `404`, and `410`
  access states; no unexpected request failure was accepted.

## Responsive, Keyboard, And Motion Results

- Desktop: `1280 × 900`.
- Narrow mobile: `390 × 844`.
- 200% reflow equivalent: `640` CSS-pixel viewport, without horizontal
  clipping in the Guide workbench or screenshot dialog.
- Reduced motion: Chromium `prefers-reduced-motion` emulation enabled during
  the reflow pass.
- Native outline buttons, form fields, reorder controls, modal controls,
  password form, and public links remained keyboard reachable.
- One `h1` identified each Guide surface. Outline, document, publishing,
  metadata, Guide content, and highlight controls retained named landmarks.

## Evidence Files

- `evidence/127/capture-to-guide-handoff.png`
- `evidence/127/guide-library.png`
- `evidence/127/editor-desktop.png`
- `evidence/127/editor-narrow.png`
- `evidence/127/editor-reflow-reduced-motion.png`
- `evidence/127/editor-empty.png`
- `evidence/127/editor-archived.png`
- `evidence/127/viewer-preview.png`
- `evidence/127/revision-history.png`
- `evidence/127/revision-preview.png`
- `evidence/127/carry-forward-guide.png`
- `evidence/127/broken-media-recovery.png`
- `evidence/127/screenshot-viewer-reflow.png`
- `evidence/127/public-reader.png`
- `evidence/127/public-embed.png`
- `evidence/127/password-gate.png`

All screenshots contain only the fixed synthetic fixture data. The unused
`carry-forward.png` capture records the empty source-selection state and is
retained as secondary evidence.

## Result

The Child 127 browser gate passed. No schema, migration, public URL, access
semantic, production dependency, or persistent fixture hook changed.
