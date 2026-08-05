# Child 143 Documentation Reader Modernization Browser Evidence

Date: 2026-08-05

Scope: the production public exact-Publication Documentation reader. Fumadocs
is adopted only for page-tree, breadcrumb, and heading TOC primitives over an
already authorized Ossie Publication projection. Ossie retains route, access,
search, block rendering, assets, API operations, Try-It, metadata, cache, and
CSP authority. Draft and Revision previews remain native and distinct.

The browser used the disposable fixture from
`pnpm --filter server seed:documentation-browser-fixture`; no customer data,
credentials, cookies, tokens, HARs, or screenshots were committed.

## Environment

- Web: Vite at `http://localhost:3000`
- API: Fastify at `http://localhost:3002`, `testing_maintenance` profile
- Fixture Organization: `01K12500000000000000000001`
- Fixture Project: `01K12500000000000000000002`
- Public routes exercised: `/docs/plan132-public/install-guide`,
  `/docs/plan132-public/versions/summer-release/install-guide`, and
  `/docs/plan132-public/reference`
- Browser automation: agent-browser `0.33.1`
- Browser engine: Headless Chrome `151.0.7922.47`
- Firefox/WebKit: unavailable in this environment; no result claimed

## Production journeys

- The default and explicit Project Version Publication routes rendered the
  existing content, API operation link, asset, navigation, skip link, and
  search controls through the production reader.
- The production Fumadocs chrome mounted one authorized page tree, the
  `Documentation breadcrumb` navigation, and the existing Ossie content under
  one main landmark. Search returned two authorized synthetic results and
  retained the existing Ossie URLs. The fixture pages contain no heading block
  on the exercised Page, so the on-page TOC was correctly omitted; the
  component unit contract covers a heading-derived TOC.
- The selected reader chunk was aborted on the real Publication route. The
  Fumadocs chrome count changed from `1` to `0`, while the native
  `Documentation navigation`, page content, and heading remained available.
  Removing the abort and reloading restored the chrome count to `1`.
- Adding the historical
  `?__documentation_adapter_proof=fumadocs-headless` query rendered the normal
  production chrome and zero proof panel instances, confirming the disposable
  Child 141 reader proof UI/query seam is gone.
- The reader never initializes Fumadocs Loader, MDX, Fumadocs search, or a
  second route system. Draft and Revision preview tests continue to use their
  explicit existing server-saved/immutable inputs.

## Accessibility, responsive, and failure checks

- Axe `4.12.1` reported **28 passes, 0 violations, 0 incomplete** on the
  public Install route after the production chrome mounted.
- At a 320px CSS viewport, `document.documentElement.scrollWidth` equaled
  `window.innerWidth` (`320`); at the equivalent 200% reflow viewport of
  160px it also equaled the viewport (`160`). Reduced-motion emulation was
  true at both widths without a page or console error.
- The accessibility tree exposed the skip link, named search, Documentation
  navigation, breadcrumb, main heading, content links, and API operation.
- Console and page-error scans were empty after successful and recovered
  routes.

## Production cost and dependency evidence

`pnpm --filter web build` passed. The final emitted chunks were:

- `DocumentationPublicationReaderChrome`: 10.02 kB raw / 4.17 kB gzip,
  including the selected Fumadocs headless primitive and projection;
- `PublicDocumentationReaderPage`: 6.67 kB raw / 2.64 kB gzip;
- existing `DocumentationTiptapProseField`: 5.64 kB raw / 2.20 kB gzip;
- existing native `DocumentationSiteEditorPage`: 51.44 kB raw / 13.76 kB gzip;
- existing API experience: 130.58 kB raw / 32.73 kB gzip.

The Fumadocs component remains lazy and is absent from the public reader’s
initial component chunk. `fumadocs-core@16.14.0` is MIT and the frozen install
and web license review passed. `pnpm audit --prod` still exits non-zero for
the workspace’s known `fast-uri` high finding and now reports the package’s
existing transitive PostCSS moderate and Babel low paths through Fumadocs;
no high/critical finding is introduced by the selected Fumadocs path. These
are recorded limitations/maintenance follow-ups, not silently reported as a
clean audit.

## Evidence limits

- Evidence is Chromium-only; Firefox and WebKit binaries were unavailable.
- No installed screen reader was available. The evidence covers the
  accessibility tree, semantic labels/statuses, axe, keyboard-reachable
  controls, reflow, and reduced motion, but does not claim an actual
  screen-reader pass.
- Initial crawler HTML, canonical, CSP, ETag, redirect/gone, and access
  contracts were not changed; existing server route/header tests were rerun.
