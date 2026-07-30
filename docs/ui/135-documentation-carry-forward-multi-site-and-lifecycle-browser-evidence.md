# Child 135 Browser Evidence

Date: 2026-07-30

Environment:

- `agent-browser` against headless Chromium;
- portal `http://127.0.0.1:3000`;
- API `http://127.0.0.1:3002`;
- disposable `ossie_test` PostgreSQL database at migration `028`;
- deterministic `documentation-browser-fixture` data.

## Carry-Forward

The Admin opened the target `Main` Version Carry-Forward route and explicitly
selected `Summer release`. The selector rendered two distinct Sites:

- `Plan 132 Product Documentation`, saved draft version `13`, latest Revision
  `2`;
- `Plan 135 Operations Documentation`, saved draft version `2`, with no
  pre-existing Revision.

Both Sites were selected through keyboard-operable checkboxes and the explicit
independent-copy confirmation. The single operation succeeded atomically and
announced `2 Sites carried forward.` Results identified:

- Product Documentation: Revision `2` reused;
- Operations Documentation: Revision `1` created.

Both result links targeted the `Main` Version workbenches. Repeating the
identical operation returned `2 Sites carried forward (replayed safely).`,
preserved the original per-item created/reused classification, and created no
duplicate Editions. Reloading options after success disabled both Sites and
explained `Already present in the target Version.` The archived target Version
route exposed the inherited read-only explanation and disabled submission.

The Product Documentation target workbench contained independently remapped
Pages, Navigation, Snippet, protected image reference, and OpenAPI operation.
Its Documentation Asset retained the frozen source name instead of receiving a
generated carry name.

## Lifecycle And Retained Output

The Admin:

- opened Edition archive confirmation;
- acknowledged that archive does not delete or unpublish retained output;
- archived the target Edition and observed all ordinary authoring controls
  disappear while `Restore Edition` remained;
- restored the Edition and observed authoring controls return;
- archived and restored the OpenAPI Source;
- archived a Snippet and observed rename, block editing, and save controls
  disappear while `Restore Snippet` remained;
- restored the Snippet.

An invalid unpublished-Page retirement choice remained on screen for recovery
and produced the typed lifecycle-conflict path after the closure fix. Page
archive/restore, Home replacement, routing outcomes, and role enforcement are
also covered by the focused domain, route, and database suites recorded in the
child plan.

The source Edition was archived while the already selected public Publication
remained available at:

```text
/docs/plan132-public/install-guide
```

The immutable reader continued to render Navigation, exact Page content,
Snippet content, OpenAPI destination, Documentation image, and Capture image;
all exercised public API and image requests returned `200`. The source Edition
was then restored. This browser pass also exposed and fixed the public adapter's
relational `{ nodes }` Navigation normalization.

The Viewer opened the target workbench and could inspect Edition and Page
lifecycle state and archived/all filters, but saw no Archive, Restore, create,
rename, save, checkpoint, OpenAPI mutation, or Edition-management controls.
Editor/Admin/Viewer capability edges remain enforced by the server and focused
permission tests; Edition management is Admin-only.

## Accessibility, Responsive, Motion, And Diagnostics

At a `320 × 800` viewport:

```json
{ "innerWidth": 320, "scrollWidth": 320, "overflow": false }
```

With reduced motion emulated:

```json
{ "reduced": true, "transition": "1e-05s" }
```

Agent-browser axe results:

- authenticated Documentation workbench: `0` violations, `25` passes;
- immutable public reader: `0` violations, `28` passes.

A fresh browser session on the repaired public reader reported no page errors;
the console contained only Vite connection and React development notices.
Carry-Forward, public snapshot, Documentation Asset, and Capture Asset requests
used ordinary IDs/paths and returned successful responses; no secret-bearing
URL was observed.

Screenshots were not used as the authority. Evidence came from accessibility
snapshots, visible status/focus state, request logs, console/error inspection,
axe, viewport measurements, reduced-motion media emulation, and database
integration assertions.
