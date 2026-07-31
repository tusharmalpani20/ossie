# Child 138 Browser, Accessibility, and Performance Evidence

Date: 2026-07-31

Status: Passed on the disposable local testing stack. This is representative
local evidence, not production p75 telemetry.

## Environment

- Chromium 151 through `agent-browser`, headless
- Vite web application at `http://127.0.0.1:3000`
- Fastify public initial-document server at `http://127.0.0.1:3002`
- PostgreSQL disposable `ossie_test` database at migration head `031`
- synthetic Plan 125/132–138 browser fixture only

No customer content, credentials, target API secrets, or response bodies were
recorded.

## Authenticated matrix

### Organization operations

- The authorized Organization Owner surface loaded exact usage and nullable
  active-Site/active-Page limits.
- Updating the active-Site limit to `2` returned `200` and announced
  `Documentation product limits were saved.`
- A Viewer saw usage but no limit inputs or save action.
- The publishing workbench exposes explicit draft and immutable-Publication
  search-rebuild actions only when its Organization Owner permission is true.
  The Owner component flow was exercised by the focused browser-component test;
  the non-Owner headless session did not render the recovery region.
- Rebuild actions require browser confirmation, announce progress/result, and
  explain that the prior valid projection remains selected after failure.

### Accessibility

Automated WCAG A/AA checks reported zero violations on:

- Organization Documentation operations as Owner;
- Organization Documentation operations as Viewer;
- public Page reader;
- public API reference;
- public operation experience.

Manual keyboard/semantic inspection confirmed:

- skip links and one route-level `h1`;
- labelled operations limit fields;
- live status text for save/rebuild state;
- named Documentation navigation and search;
- named tabs, table headers, links, and request-builder control;
- no edit/rebuild controls on the non-Owner surface.

## Public reader and crawler matrix

Validated:

- canonical Page `200`;
- former alias `308` to the canonical Page;
- retired path `410`;
- unknown Page/operation `404`;
- public `robots.txt` allow and sitemap entries only for the eligible primary
  discovery link;
- route-specific title, description, canonical, Open Graph, Twitter, language,
  and safe initial body content before React hydration;
- content escaping for metadata/body text;
- strict CSP, `Vary: Cookie`, public revalidation policy, and an
  output-digest/representation-key ETag;
- matching `If-None-Match` returns `304`;
- page JSON loads two bounded Page summaries, the selected Page's nine blocks,
  one referenced Snippet, two referenced Assets, and one referenced operation;
- search for `widgets` returns the ranked API-reference result through the
  bounded PostgreSQL query;
- public operation route renders `GET /widgets` and lazy-loads the request
  builder;
- no browser console errors.

The direct Fastify initial document was `9,417` bytes for the representative
fixture.

## Bundle evidence

Production Vite build measurements:

| Chunk                                      | Raw       | Gzip      |
| ------------------------------------------ | --------- | --------- |
| application entry                          | 482.06 kB | 133.99 kB |
| public Documentation reader                | 5.58 kB   | 2.21 kB   |
| API operation experience                   | 19.16 kB  | 6.81 kB   |
| lazy request-builder dependency wrapper    | 130.55 kB | 32.70 kB  |
| Documentation Site editor                  | 49.82 kB  | 13.22 kB  |
| Organization Documentation operations page | 4.20 kB   | 1.66 kB   |
| Documentation API client                   | 13.56 kB  | 2.74 kB   |
| application CSS                            | 74.27 kB  | 14.36 kB  |

The operations page, public reader, Site editor, and API request builder are
route/interaction lazy boundaries. These measurements are build artifacts, not
production Core Web Vitals.

## Failure and privacy checks

- publication busy/capacity/timeout paths preserve the selected live link;
- quota conflicts are distinct from process-safety admission failures;
- unsafe or mismatched rebuilds fail before selector replacement;
- draft and immutable-Publication rebuilds are Organization/Site scoped;
- restricted/public access is resolved before cache/ETag reuse;
- Viewer and unrelated-tenant identifiers do not reveal protected resources;
- diagnostics report counts, digests, modes, and readiness only—never approved
  origins, cookies, Authorization values, API keys, or content.

## Capability limitations

- Firefox and WebKit were not installed in this headless environment.
- Production p75 Core Web Vitals require deployment telemetry and are not
  inferred from this local run.
- Per-process publication/rebuild admission is intentional V1 behavior; no
  distributed queue or cache was added.
