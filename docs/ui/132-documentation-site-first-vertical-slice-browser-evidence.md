# Child 132 Browser Evidence

Date: 2026-07-30

Status: Complete for child `132`. The first vertical slice passed its
authenticated authoring, public-reader, access, failure, accessibility,
responsive, and accepted upper-bound checks in the available headless Chrome
environment. Environment limitations and later-child work are recorded below.

## Environment

- Original full matrix exercised through runtime commit `6ddf72a`; closure
  recheck exercised commits `a0f8de7` and `50552ec`.
- API: Fastify on `http://127.0.0.1:3002`, testing configuration, disposable
  `ossie_test`.
- Web: Vite on `http://127.0.0.1:3000`.
- Agent Browser CLI: `0.33.1`.
- Browser: Chrome for Testing `151.0.7922.47`, headless Linux.
- Fixture: `pnpm --filter server seed:documentation-browser-fixture`.
- Synthetic users only: `plan125-admin@example.test` and
  `plan125-viewer@example.test`. During the disposable closure pass, the Viewer
  membership was temporarily promoted to Project Editor through the real
  membership API, then the database was discarded.
- Screenshots were written under `/tmp/ossie-plan132-browser/screenshots` and
  deliberately not committed.

## Authenticated Authoring And Permissions

- Admin authenticated and opened the version-scoped Documentation library and
  Site workbench.
- The workbench rendered stable Pages and the saved-draft checkpoint.
- Page content autosaved through the real `PUT .../content` route and announced
  `Saved`.
- Every accepted first-slice safe block was authored through portal controls:
  paragraph, heading, ordered list, unordered list, code, internal Page link,
  divider, read-only API reference, and protected image with required
  alternative text.
- Blocks were reordered and deleted through the editor controls. A 2,000-block
  accepted-upper-bound draft was also saved and loaded.
- Page title and canonical path were edited with Row Version protection and the
  permanent-alias consequence was presented before save.
- Structure controls created a Page, created and reordered a navigation group,
  assigned a Page parent, saved navigation, added a permanent redirect, and
  marked a retired path `gone`.
- OpenAPI JSON was selected through the file control, inspected, and applied.
  The resulting reference rendered `GET /browser-check`.
- A private Page comment was added through the portal and announced
  `Private comment added.` Private comments did not appear in public content or
  public search.
- Two independent Chrome sessions loaded the same Page. The first saved a
  change; the second received the conflict response, announced
  `Conflict — local work is preserved`, and retained the exact local textarea
  value.
- Viewer opened the same Site and Page. Revision/mutation controls and editable
  fields were absent while saved Page content remained readable.
- Admin/Editor/Viewer capability and tenant/nested-resource swaps were covered
  by the focused route and database matrix. The closure browser pass additionally
  exercised a real Project Editor: Site creation stayed absent, authoring and
  `Create revision` were present, checkpoint reuse succeeded, and publishing
  Revision 2 to the existing link moved the live pointer to Publication 2.

## Preview, Revision, Publication, And Rollback

- Saved-draft preview rendered the complete latest server-saved Site and
  labelled its exact Working Draft version.
- Revision 1 and Publication 1 were created and exposed through the stable
  Documentation link.
- After Working Draft mutation, Revision 2 and Publication 2 were created.
  Publication 1 remained unchanged.
- Pointer-only rollback restored Publication 1 content without rebuilding or
  mutating either Publication.
- An aborted publication request produced
  `Publication failed. The live link was not changed.` The injected preparation
  failure unit test and database rollback test separately cover failures after
  the request reaches the server.

## Public Reader, Routing, Search, And Assets

- Publication 1 rendered frozen navigation, internal Page links, safe blocks,
  the read-only OpenAPI operation destination, canonical metadata, and no
  private comment.
- Public search returned the frozen install Page for `install` and no result
  for private/comment-only text. Responses did not expose persisted search
  projection internals.
- Alias `install` and redirect rule `setup` both resolved to
  `/docs/plan132-public/install-guide`.
- The operation deep link rendered `GET /widgets`.
- The intentional `gone` route rendered a non-revealing unavailable state.
- Direct API checks returned `308` for alias/redirect, `410` for gone, `404`
  for missing, `200 application/xml` for sitemap, and `200 text/plain` for
  robots.
- Closure recheck confirmed every sitemap `<loc>` is an absolute canonical URL
  rooted at validated `OSSIE_PUBLIC_WEB_URL`.
- The shared resolver with
  `resource_family=documentation_site` returned the Documentation Site family.
- A protected PNG rendered only through its exact Publication-scoped asset URL,
  with its alternative text and natural dimensions intact.

## Restricted Link And Viewer-Session Matrix

- Password link with the wrong password rendered only
  `Password is invalid.`
- The correct password established the protected viewer session and rendered
  the frozen Documentation Site.
- Revoking the link invalidated the already-established viewer session; the
  next read rendered the generic Documentation-unavailable surface.
- Restricted and expired links rendered the same generic unavailable surface
  without revealing whether the Site, entry, or Publication exists.
- Direct restricted-asset access returned `403`; expired-asset access returned
  `410`.
- Public, password, restricted, expired, and revoked outcomes were exercised
  with synthetic links. Server route/database tests provide the authoritative
  tenant and capability matrix.

## Accessibility, Responsive, Motion, And Performance

- Public reader axe `4.12.1` reported zero WCAG A/AA violations and zero
  incomplete checks.
- The 2,000-block portal editor reported zero violations and one indeterminate
  contrast check for partially obscured textareas; inspection found no
  actionable violation.
- At 320 CSS px, public `scrollWidth` and `clientWidth` were both `320`.
- Reduced-motion emulation reported
  `matchMedia("(prefers-reduced-motion: reduce)").matches === true`.
- No page errors or application console errors were observed. Vite debug and
  React development-tool messages were informational.
- Local public-reader lab sample: TTFB `6.3 ms`, FCP `544 ms`, LCP `648 ms`,
  CLS `0`. INP was unavailable because this short synthetic run did not produce
  a meaningful interaction sample.
- The 2,000-block editor loaded 2,001 fieldsets, 6,006 buttons, and 10,153 DOM
  nodes in approximately `330.9 ms` navigation time with approximately
  `29.6 MiB` JavaScript heap. Its save request completed in approximately
  `681.3 ms`.
- Production build comparison against pre-child commit `50d009c`:
  JavaScript changed from `468.99 kB` raw / `130.54 kB` gzip to `516.90 kB`
  raw / `142.18 kB` gzip; CSS changed from `73.94 kB` raw / `14.29 kB` gzip to
  `74.53 kB` raw / `14.40 kB` gzip. The JavaScript delta is `47.91 kB` raw /
  `11.64 kB` gzip and is handed to child `138` for V1 bundle/code-splitting
  hardening.

## Dogfood Defects Closed

Browser dogfood exposed and drove focused regressions for:

- frozen metadata being read from mutable top-level Site state rather than the
  Revision snapshot;
- opaque SPA redirect handling;
- hidden Viewer saved content;
- a missing `Idempotency-Key` CORS allowlist entry;
- UUID-sized browser IDs exceeding persisted ULID-width columns;
- a raw routing response where the shared client required `{ routing }`;
- stale OpenAPI replacement using no expected source version;
- revoked viewer sessions remaining valid;
- nested Revision lookup not binding every parent scope.

All were fixed and the relevant focused, broad, database, smoke, and browser
checks were repeated.

## Honest Environment And Later-Child Limits

- Firefox and WebKit were not installed in the headless host. Chrome is the
  required child `132` browser evidence; cross-engine certification remains a
  capability-dependent later hardening check.
- These are local lab measurements, not production p75 Web Vitals.
- The current Vite application still emits one primary application chunk.
  Bundle splitting, organization-configurable quotas/reporting, and production
  observability belong to child `138`.
- Public routes are rendered through the existing Vite SPA boundary. Deployment
  or crawler-specific server rendering is not introduced by child `132`.
- No child-owned S1/S2 defect remains open.
