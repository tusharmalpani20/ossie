# Child 144 Documentation Request Examples Browser Evidence

Date: 2026-08-05

Scope: the inert, versioned request-example projection over accepted
DocumentationTryItRequestDescriptor V1 operations. The examples panel is
separate from the mutable browser-direct Try-It builder and is rendered on
public Publication, immutable Revision, and draft/OpenAPI surfaces.

The browser used the disposable fixture from
pnpm --filter server seed:documentation-browser-fixture; no customer data,
credentials, cookies, tokens, HARs, private URLs, or screenshots were
committed.

## Environment

- Web: Vite at http://localhost:3000
- API: Fastify at http://localhost:3002, testing_maintenance profile
- Fixture Organization: 01K12500000000000000000001
- Fixture Project: 01K12500000000000000000002
- Fixture Documentation Site: 01KZ9WFP8TDXBHNEJ9A93ZGGKC
- Browser automation: agent-browser 0.33.1
- Browser engine: Headless Chrome 151.0.7922.47
- Firefox/WebKit: unavailable in this environment; no result claimed

Routes exercised:

- public supported: /docs/plan132-public/operations/get-widgets-listwidgets;
- public unsupported: /docs/plan132-public/operations/post-widgets-createwidget;
- draft/OpenAPI: /projects/01K12500000000000000000002/versions/summer-release/documentation/01KZ9WFP8TDXBHNEJ9A93ZGGKC;
- immutable Revision: /projects/01K12500000000000000000002/versions/summer-release/documentation/01KZ9WFP8TDXBHNEJ9A93ZGGKC/revisions/2.

The synthetic fixture's POST operation has a required JSON body with no
documented example, exercising the explicit unsupported state without
changing product data or enabling a second Try-It allowance.

## Browser journeys

- The public supported operation rendered exactly five tabs in fixed order:
  curl, Browser Fetch, Node.js Fetch, Python, and Go. The default was curl.
  ArrowRight moved focus/selection to Browser Fetch, and the accessibility
  tree exposed the selected tab and named tabpanel.
- Public Copy and Download controls were present only for generated output.
  The unsupported public POST showed the bounded message
  “This operation cannot produce a safe request example.” and no request-
  example copy/download controls.
- The draft surface rendered one examples panel independently of Try-It
  configuration. Selecting the fixture POST operation showed the same
  unsupported state while its separate Try-It builder remained available.
- The immutable Revision rendered the same five-language panel from its
  frozen descriptor. Selecting its POST operation showed the same unsupported
  result; no draft or Try-It state entered the Revision projection.
- Browser resource entries contained zero requests to api.example.com while
  examples loaded, tabs changed, and the generated code was displayed. The
  only network activity was the existing local application/API loading path.
- The current mutable helper is labeled “Current Try-It request preview” and
  remains inside the explicit builder. The generated panel receives no
  approved origin, base path, form values, credential, attempt token,
  response, or Try-It configuration.

## Accessibility, responsive, and failure checks

- Axe 4.12.1 on the public supported route: 26 passes, 0 violations, 0
  incomplete.
- Axe on the immutable Revision: 28 passes, 0 violations, 0 incomplete.
- Axe on the draft editor: 30 passes, 0 violations, 1 incomplete for an
  existing partially obscured color-contrast check on the native new-block
  textarea; it was not a violation and is recorded rather than reported as a
  false clean result.
- The public supported route exposed five tabs, a named Request examples
  region, selected-state semantics, keyboard-reachable Copy/Download controls,
  a focusable code panel, and a polite status region.
- At a 320px CSS viewport, document and code-region widths remained bounded:
  scrollWidth=320, clientWidth=320, and the code region remained locally
  scrollable. Reduced-motion emulation returned true without a page error.
- Clipboard success/failure, download URL creation/revocation, keyboard
  selection, unsupported output, text-only code rendering, and no-fetch
  behavior are covered by the focused component tests.
- Current console output contained only expected Vite/React development
  messages; the final browser error scan was empty.

## Verification and production cost

Focused and workspace results:

- documentation domain: 20 files / 55 tests;
- web: 91 files / 468 tests;
- server documentation/fixture routes: 6 files / 40 tests;
- workspace lint and type-check: passed;
- domain build, web build, and frozen install: passed;
- generated snippet parsing: Bash -n, Node --check, and Python 3
  compilation passed for the representative fixture. gofmt was unavailable
  and no Go parse result is claimed.

The final web build emitted:

- DocumentationRequestExamples: 10.15 kB raw / 4.13 kB gzip;
- LazyDocumentationRequestExamples: 131.39 kB raw / 32.82 kB gzip,
  with the examples UI itself remaining dynamically loaded;
- existing DocumentationApiOperationExperience: 19.22 kB raw / 6.83 kB
  gzip in the current Vite graph;
- PublicDocumentationReaderPage: 6.82 kB raw / 2.67 kB gzip.

pnpm licenses list --filter web passed. pnpm audit --prod remains non-zero
for three known workspace findings: the existing fast-uri high finding, and
PostCSS moderate plus Babel low transitive paths through the existing
Fumadocs/Next graph. Child 144 adds no runtime dependency and no new
high/critical finding.

## Evidence limits and handoff

- Evidence is Chromium-only; Firefox and WebKit binaries were unavailable.
- No installed screen reader was available. The evidence covers the
  accessibility tree, axe, keyboard behavior, focusable controls, status
  semantics, reflow, and reduced motion, but does not claim an actual
  screen-reader pass.
- Go tooling was unavailable. The generated Go contract remains covered by
  deterministic policy tests and the source-level standard-library contract;
  local Go parsing is a Child 145 environment follow-up if the tool becomes
  available.
- No S1/S2 implementation defect remains. Child 145 owns only integrated
  hardening and cross-surface follow-up, not security, determinism, or
  credential-isolation defects.
