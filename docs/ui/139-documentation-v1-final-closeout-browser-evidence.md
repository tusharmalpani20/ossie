# Child 139 Documentation V1 Browser Evidence

Date: 2026-07-31

Scope: final representative Chromium dogfood for Product Documentation V1.
This evidence complements, rather than replaces, the complete server, database,
route, permission, component, and failure-injection suites.

## Environment

- Repository: `/home/ubuntu/ossie`
- Browser fixture: existing
  `pnpm --filter server seed:documentation-browser-fixture`
- Database profile: `testing_maintenance`, database `ossie_test`
- API: existing Fastify entry point at `http://localhost:3002`
- Web: existing Vite entry point at `http://localhost:3000`
- agent-browser: `0.33.1`
- Browser: Headless Chrome `151.0.0.0`
- Viewports: default desktop and `320 x 720`
- Reduced motion: Chromium emulation enabled and verified with
  `matchMedia("(prefers-reduced-motion: reduce)")`
- Fixture Organization: `01K12500000000000000000001`
- Fixture Project: `01K12500000000000000000002`
- Accounts: synthetic Project Admin/Organization Owner and Project Viewer
- No credential, cookie, browser profile, trace, HAR, or screenshot was
  committed.

The applications were launched only against the disposable fixture database.
Both processes and all three browser sessions were closed after validation.

## Representative journeys

### Owner/Admin

- Signed in through the real `/login` UI.
- Opened `/organization/documentation` and verified usage, nullable-limit
  controls, and Owner-only mutation controls.
- Opened the seeded Site editor in the `summer-release` Project Version.
- Verified Site/Edition context, lifecycle, Pages, review, navigation,
  Snippets, Assets, import/export, Publication, OpenAPI, browser-direct Try It,
  search-rebuild, rollback, and archive controls were represented.
- Confirmed the production fixture exposed two immutable Revisions, two
  Publications, review evidence, protected assets, and the accepted Try-It
  policy.
- No page or console error occurred. Console output was limited to expected
  Vite connection and React development notices.

### Viewer

- Signed in through the real `/login` UI using the synthetic Viewer.
- Opened the same Site/Edition.
- Verified authorized draft, Revision, Publication, export, review, OpenAPI,
  and request-builder read surfaces.
- Verified authoring, lifecycle mutation, policy mutation, publish, rollback,
  and rebuild controls were absent.
- Server route and database suites remain the authorization proof; hidden
  controls were not treated as authorization.

### Public

- Opened `/docs/plan132-public/install-guide`.
- Verified Site navigation, constrained Page blocks, internal Page link,
  OpenAPI operation deep link, tabs, table, and reusable Snippet.
- Searched for `Install` and received one rendered result.
- Verified no comment, review-request, or credential term appeared in the
  public rendered text.
- Verified server-rendered initial HTML contained the Page title and body
  before client enhancement.
- Verified exact HTTP behavior:
  - initial Page `200`, 9,279 bytes, public revalidation cache policy;
  - matching ETag request `304`;
  - former-slug alias `308`;
  - explicit redirect `308`;
  - retired route `410`;
  - operation deep link `200`.

## Accessibility, responsive behavior, and performance

agent-browser axe-core `4.12.1` results for WCAG A/AA:

| Surface            | Passes | Violations | Incomplete |
| ------------------ | -----: | ---------: | ---------: |
| Owner operations   |     24 |          0 |          0 |
| Owner Site editor  |     27 |          0 |          1 |
| Viewer Site editor |     26 |          0 |          0 |
| Public reader      |     28 |          0 |          0 |

The Owner editor incomplete item was axe's inability to determine the
background behind two partially obscured textareas; it was not reported as a
contrast violation. The repository's focused contrast tests remain green.

At `320` CSS pixels, the public document reported equal `scrollWidth` and
`clientWidth` (`320`), so no horizontal document overflow was present. Reduced
motion evaluated true. Accessibility-tree snapshots exposed named landmarks,
navigation, headings, form controls, tabs, tables, and the skip links.

Local public-reader vitals (headless development server, not production p75):

- TTFB: `3.5 ms`
- FCP: `292 ms`
- LCP: `828 ms`
- CLS: `0.01`
- INP: not produced because the sample contained no qualifying interaction

The production web build retained lazy Documentation chunks. The largest
Documentation-specific lazy chunk was the request-builder experience at
`130.58 kB` raw / `32.73 kB` gzip; the Site editor chunk was `51.26 kB` raw /
`13.66 kB` gzip.

## Capability and coverage boundaries

- Chromium is the locally proven browser. Firefox and WebKit were not
  installed or claimed.
- This headless environment did not expose an installed screen reader. The
  evidence therefore uses accessibility-tree, keyboard-focusable controls,
  semantic names/status, axe, reflow, and reduced-motion checks and does not
  claim an actual screen-reader pass.
- The full stale-conflict, import, Carry-Forward, review invalidation,
  publication admission/failure, rebuild failure, Try-It network/security,
  manifest, readiness, and missing-File matrix is deterministic automated test
  evidence. Repeating destructive failure injection through the UI would not
  add authority over those server/database assertions.
- Browser observations were made in development mode. Production bundle
  measurements came from `pnpm build`.
