# Child 121 Browser Baseline

Date: 2026-07-26

Commit validated: `dcfb6ab`

## Status

Dev-only design review route validation completed with agent-browser. The
broader authenticated workflow screenshot matrix for children `122` through
`128` was not completed in this child because no seeded authenticated local
runtime was established for those journeys during the closeout pass.

This is an explicit handoff item for child `122`: before the first broad visual
rewrite, establish safe synthetic fixtures and capture the workflow screenshot
matrix or record the exact blocked environment/tooling reason.

## Required Evidence Matrix

The implementation must validate:

- `/__design-system` at desktop viewport;
- `/__design-system` at narrow mobile viewport;
- `/__design-system` at 200% zoom/reflow;
- keyboard-only navigation and visible focus;
- console errors;
- failed network requests;
- reduced-motion preference where observable;
- no private/authenticated API calls from the review page.

## Baseline Workflow Notes

Representative surfaces to capture before modernizing children `122` through
`128`:

- project list/library;
- project/version workspace;
- capture session list and detail;
- Guide list, editor, preview, and public reader;
- Interactive Demo list, editor, and public viewer;
- setup/login/organization management;
- project activity and compliance timelines;
- extension popup capture flow when a real loaded extension environment is
  available.

## Current Evidence

Agent-browser session: `ossie-121`

Dev server:

- command: `rtk pnpm --filter web dev --host 127.0.0.1`
- URL: `http://127.0.0.1:3000/__design-system`
- desktop snapshot: pass; page exposes `Design system review` with
  `Library operations direction`, `Authoring workbench direction`, and
  `Reader viewer direction` regions.
- narrow mobile viewport `390x844`: pass; same regions and interactive controls
  are reachable.
- 200% zoom/reflow simulation: pass; same regions remain present after setting
  document zoom to `2`.
- keyboard smoke: pass; Tab reaches interactive controls in the review surface.
- console: no errors; only Vite connection messages and React DevTools
  development info.
- network: no `/api` requests; only Vite modules and the public Ossie app icon
  loaded.

Production preview:

- command: `rtk pnpm --filter web build`
- result: pass; production bundle reported
  `dist/assets/index-CSVoYZNT.js` at `443.87 kB` and gzip `122.07 kB`.
- command: `rtk pnpm --filter web start --host 127.0.0.1`
- URL: `http://127.0.0.1:3001/__design-system`
- result: pass; production preview renders the existing unsupported `Ossie
portal` route state, not the design review surface.
- network: document, production JS/CSS, and public app icon only.

Screenshots were not committed. The accessibility-tree snapshots above were
sufficient for this synthetic review route evidence and avoid storing visual
artifacts that may later become stale.

## Blocked/Carryover Evidence

The following full-workflow screenshots were not captured in child `121` and
must be captured at the start of child `122` before broad shell/workflow visual
changes begin, unless the environment is still unavailable and the blocked
reason is recorded:

- authenticated project list/library;
- authenticated project/version workspace;
- capture session list and detail;
- Guide list, editor, preview, and public reader;
- Interactive Demo list, editor, and public viewer;
- setup/login/organization management;
- project activity and compliance timelines.

## Extension Evidence Boundary

Normal browser page automation is not real toolbar-popup evidence. If a loaded
unpacked extension and toolbar popup cannot be validated, record that portion as
blocked rather than claiming it passed.

Child `121` did not implement extension popup workflow changes. Real loaded
toolbar-popup validation is therefore blocked/not applicable for this child and
must be performed by child `126` when extension UI modernization changes the
popup workflow.
