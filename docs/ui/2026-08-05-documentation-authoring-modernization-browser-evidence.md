# Child 142 Documentation Authoring Modernization Browser Evidence

Date: 2026-08-05

Scope: production Page and reusable Snippet authoring on the existing
Documentation routes. The selected Tiptap adapter owns only prose text in
paragraph, heading, quote, callout, and ordered/unordered list-item fields;
the Ossie block editor remains authoritative for block identity, structure,
references, assets, comments, save state, and Row-Version recovery.

The browser used the disposable fixture from
`pnpm --filter server seed:documentation-browser-fixture`; no customer data,
credentials, cookies, tokens, HARs, or screenshots were committed.

## Environment

- Web: Vite at `http://localhost:3000`
- API: Fastify at `http://localhost:3002`, `testing_maintenance` profile
- Fixture Organization: `01K12500000000000000000001`
- Fixture Project: `01K12500000000000000000002`
- Final fixture reseed route: `/projects/01K12500000000000000000002/versions/summer-release/documentation/01KZ9T39Z23D40RSJ0J1Y8SFB0/pages/01KZ9T39Z2E2QG6KFXJWXDGP57`
- Browser automation: agent-browser `0.33.1`
- Browser engine: Headless Chrome `151.0.7922.47`
- Firefox/WebKit: unavailable in this environment; no result claimed

## Browser journeys

- The admin Page route mounted one production Tiptap prose field with
  `contenteditable="true"` and the existing named structural controls.
  `aria-label="Paragraph text"` was present, and a synthetic prose edit
  remained after reload with the existing `Saved` state.
- The Site route mounted one production Tiptap field in the reusable Snippet
  editor with `aria-label="Callout text"`; the existing `Save Snippet`
  authority and block controls remained present.
- Aborting `**/DocumentationTiptapProseField.tsx*` produced the native
  controlled textarea fallback (`contenteditable` count `0`) on the same
  loaded Page. Removing the abort and reloading restored the Tiptap field
  (`contenteditable` count `1`). No current console or page errors remained
  after recovery.
- The Project Viewer loaded the same Page without mutation controls and with
  a saved rendered-content region; `contenteditable` count was `0`.
- The adapter does not add a public or persistence route and does not change
  the existing preview, export, comment, asset, reference, or Publication
  paths.

## Accessibility, responsive, and failure checks

- Chromium accessibility-tree snapshots exposed named Page blocks, prose
  fields, structural buttons, status text, comments, and navigation.
- Axe `4.12.1` reported zero WCAG A/AA violations on the Page and Snippet
  routes. Axe reported only existing color-contrast `incomplete` checks for
  partially obscured file/textarea controls; these were not violations and
  are recorded rather than promoted to a false pass.
- At a 320px CSS viewport, `document.documentElement.scrollWidth` equaled
  `window.innerWidth` (`320`), and at the equivalent 200% reflow viewport of
  160px it also equaled the viewport (`160`).
- Reduced-motion emulation returned true for
  `prefers-reduced-motion: reduce` at both reflow checks without a page or
  console error.
- The fixture was reseeded after the intentional prose edit and remains in
  its original synthetic state.

## Production cost

`pnpm --filter web build` passed. The selected production field is lazy and
the final emitted chunk measured:

- `DocumentationTiptapProseField`: 5.64 kB raw / 2.20 kB gzip

The adapter imports a small client-side controlled-inline parser rather than
the full server documentation policy module. Server normalization and save
validation remain authoritative. The native fallback remains available for
chunk failure and rollback.

## Evidence limits

- Evidence is Chromium-only; Firefox and WebKit binaries were unavailable.
- No installed screen reader was available. The evidence covers the
  accessibility tree, semantic labels/statuses, axe, keyboard-reachable
  controls, reflow, and reduced motion, but does not claim an actual
  screen-reader pass.
