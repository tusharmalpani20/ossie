# Child 141 Documentation Adapter Proof Evidence

Date: 2026-08-05

Scope: isolated, development-only adapter comparisons on the existing
Documentation Page editor, reusable Snippet editor, and exact public
Publication reader. The proof used the disposable `ossie_test` fixture seeded
by `pnpm --filter server seed:documentation-browser-fixture`; no customer data,
credentials, cookies, tokens, HARs, or screenshots were committed.

## Environment

- Web: Vite at `http://localhost:3000`
- API: Fastify at `http://localhost:3002`, `testing_maintenance` profile
- Fixture Organization: `01K12500000000000000000001`
- Fixture Project: `01K12500000000000000000002`
- Browser automation: agent-browser `0.33.1`
- Browser engine: Headless Chrome `151.0.7922.47`
- Native/candidate comparison: same existing routes and synthetic fixture
- Firefox/WebKit: unavailable in this environment; no result claimed

## Browser journeys

The native public reader loaded the exact Publication route and retained its
existing navigation, constrained block renderer, API operation link, asset
responses, search, metadata, and public URL behavior.

The following development-only selectors loaded through the existing route
parsers after normal authorization/data loading:

- Page editor: `tiptap-prose` rendered the Tiptap prose-field proof and
  accepted a synthetic text edit through the existing `onChange`/autosave path.
- Page editor: `tiptap-graph` rendered the typed whole-graph proof without a
  save client or persistence control.
- Snippet editor: `tiptap-graph` rendered the same proof seam for the selected
  reusable Snippet while retaining the existing Save Snippet control.
- Public reader: `fumadocs-headless` rendered Fumadocs page-tree,
  breadcrumb, and TOC primitives from an allowlisted exact-Publication
  projection. It did not load Fumadocs Loader, a content source, or a new
  route.

Project Viewer loaded the Page editor proof read-only: the contenteditable
  node reported `contenteditable="false"`, Page mutation controls were absent,
  and the existing Saved Page content region remained present.

## Failure and recovery

Aborting the lazy reader proof module produced the existing
`Retry Documentation` route error state. Removing the local abort rule and
activating Retry restored the Fumadocs proof on the same URL. The earlier
server-only import issue was fixed by splitting reader/editor proof chunks and
using the browser-safe controlled-markdown policy subpath; no client
`node:crypto` error remained after the fix.

## Accessibility and responsive checks

The candidate-scoped axe-core `4.12.1` results were:

| Surface | Passes | Violations | Incomplete |
| --- | ---: | ---: | ---: |
| Public Fumadocs proof | 19 | 0 | 0 |
| Page Tiptap prose proof | 15 | 0 | 0 |
| Page Tiptap whole-graph proof | 14 | 0 | 0 |
| Snippet Tiptap whole-graph proof | 14 | 0 | 0 |

The public native reader scan passed 28 rules with zero violations and zero
incomplete items. Console error scans were empty for every successful
candidate route. Accessibility snapshots exposed named headings, regions,
navigation, links, form controls, and proof status text.

At a 320px CSS viewport, `document.documentElement.scrollWidth` equaled
`window.innerWidth` (`320`), with no horizontal overflow. A 160px CSS viewport
was used as the equivalent reflow check for 200% zoom at a 320px physical
width; it also reported equal layout and viewport widths (`160`). Keyboard
focus reached the existing Skip to content link and portal navigation. Reduced
motion emulation reported `matchMedia("(prefers-reduced-motion: reduce)")` as
true without a candidate error.

## Build and cost evidence

`pnpm --filter web build` passed. Native route chunks remained present, while
the development-only proof modules were lazy emitted:

- `DocumentationReaderAdapterProofPanel`: 10.34 kB raw / 4.30 kB gzip
- `DocumentationAdapterProofPanel`: 397.67 kB raw / 127.23 kB gzip

The Tiptap chunk is above the Child 141 planning guardrail for a production
authoring chunk, so the disposition is limited to named prose fields and the
whole-graph converter remains feasibility evidence only. Child 142 must keep
Tiptap route-lazy, measure its production authoring surface again, and retain
the native fallback. The Fumadocs chunk is below its 35 kB gzip reader guardrail
and is limited to the named headless primitives.

## Evidence limits

- Browser evidence is Chromium-only; Firefox and WebKit were not installed.
- No installed screen reader was available. The evidence covers the
  accessibility tree, keyboard focus, semantic names/statuses, axe, reflow,
  and reduced motion, but does not claim an actual screen-reader pass.
- The browser proof ran in development mode. Production cost evidence came
  from the Vite production build.
- The fixture was reseeded after the intentional local prose edit so the
  disposable database was left in its original synthetic state.
