# Child 132 Browser Evidence

Date: 2026-07-30

Status: Partial closure evidence. The implemented authoring/public core passed
the checks below; the child remains active because the open items listed at the
end are still owned by child 132.

## Environment

- Repository commits exercised before documentation closeout: the Plan 132
  implementation through `1ed44c1`, followed by the DB contract regression in
  `dd2f980`.
- API: Fastify on `http://127.0.0.1:3002`, testing configuration,
  disposable `ossie_test`.
- Web: Vite on `http://127.0.0.1:3000`.
- Agent Browser CLI: `0.33.1`.
- Browser: Chrome for Testing `151.0.7922.47`, headless Linux.
- Fixture: `pnpm --filter server seed:documentation-browser-fixture`.
- Synthetic users only: `plan125-admin@example.test` and
  `plan125-viewer@example.test`.
- Screenshots were written under `/tmp/ossie-plan132-browser/screenshots` and
  were deliberately not committed.

## Passed Browser Evidence

- Admin authenticated and opened the version-scoped Documentation library and
  Site workbench.
- The workbench rendered both stable Pages and the saved-draft checkpoint.
- Page content autosaved through the real `PUT .../content` route and announced
  `Saved`.
- A Page was created through the Structure panel, flat Page navigation was
  saved, and a retired path was persisted through the routing control. The
  final routing mutation returned HTTP `200` through the documented
  `{ routing }` contract.
- A protected PNG was uploaded with required alternative text, attached to the
  Page, and saved through the editor. The fixture's independently frozen PNG
  rendered from the exact Publication-specific protected-asset URL with its
  natural dimensions and alt text intact.
- Two independent Chrome sessions loaded the same Page. The first saved a
  change; the second received the conflict response, announced
  `Conflict — local work is preserved`, and retained the exact local textarea
  value.
- Viewer opened the same Site and Page. Revision/mutation controls and the
  editable textarea were absent; saved Page content remained readable.
- Saved-draft preview rendered the complete latest server-saved Site and
  labelled its exact Working Draft version.
- Public Publication 1 rendered frozen navigation, internal Page links, a
  read-only OpenAPI operation destination, safe blocks, search, canonical
  metadata, and no private comment.
- Public search returned the frozen install Page for `install` and no result
  for private/comment-only text. The browser response did not expose the
  persisted search-document collection.
- Alias `install` and redirect rule `setup` both replaced the browser URL with
  `/docs/plan132-public/install-guide`.
- The operation deep link rendered `GET /widgets`.
- The intentional `gone` route rendered a non-revealing unavailable state.
- Direct API checks returned `308` for alias/redirect, `410` for gone, `404`
  for missing, `200 application/xml` for sitemap, and `200 text/plain` for
  robots.
- The shared resolver
  `?resource_family=documentation_site` returned the Documentation Site family.
- After Working Draft mutation, Revision/Publication 2, and pointer-only
  rollback, the public reader contained Publication 1 text and did not contain
  Publication 2 text.
- Desktop public reader axe `4.12.1` reported zero WCAG A/AA violations and
  zero incomplete checks. The portal editor reported zero violations and one
  indeterminate contrast check caused by an obscured textarea.
- At 320 CSS px, `scrollWidth` and `clientWidth` were both `320`.
- Reduced-motion emulation reported
  `matchMedia("(prefers-reduced-motion: reduce)").matches === true`.
- Local public-reader lab sample: TTFB `9.2 ms`, FCP/LCP `440 ms`, CLS `0`.
  This is local fixture evidence, not a production p75 claim.

The initial public-reader run exposed a blank surface because the SPA expected
top-level Site metadata while the server correctly froze it on the Revision.
The adapter was fixed and the browser pass repeated. A second pass exposed
opaque Fetch redirect handling; canonical resolution was moved to the frozen
Site snapshot while Fastify remains authoritative for direct HTTP `308`/`410`.
A third pass exposed hidden Viewer content; the read-only renderer was added
and rechecked. Mutation dogfood then exposed a missing `Idempotency-Key` CORS
allowlist entry, UUID-sized browser IDs against ULID-width columns, and a raw
routing response where the shared client expected `{ routing }`. All three
received focused regressions; the final routing request returned `200` with no
page error.

## Open Child-Owned Browser Matrix

The following required child-132 passes are not complete and must not be
inferred from the evidence above:

- exercise comments, OpenAPI inspect/apply, every accepted safe block, alias,
  redirect, navigation reorder/group, and injected preparation-failure behavior
  through portal controls rather than fixture/API setup;
- restricted/password/revoked/expired Documentation links and viewer sessions;
- complete Admin/Editor/Viewer and cross-tenant/IDOR browser matrix;
- accepted upper-bound fixture measurements and production bundle delta;
- Firefox/WebKit evidence (no supported executable was exercised).
