# Child 137 Browser And Privacy Evidence

Date: 2026-07-31

Environment: disposable `testing` database, API `http://localhost:4021`,
production Vite preview `http://localhost:3000`, synthetic public target
`https://api.github.com`, Chromium through the installed `agent-browser`
skill.

## Passed journeys

- Project Admin loaded the Site workbench and saw the exact approved origin,
  base path, bearer/API-key modes, selected operation, and independently enabled
  Publish Link policy.
- Project Viewer loaded the same Site, saw policy controls as read-only, and
  opened the descriptor-v1 draft request builder through the authenticated
  internal configuration route.
- The public exact-Publication operation loaded without authentication. Opening
  the builder fetched authority on demand; it made no target request before
  confirmation.
- GET displayed a focused confirmation dialog. Confirming produced exactly one
  browser-to-target request and one content-free attempt report. The synthetic
  target returned inert JSON `404`; the report returned `204`.
- A synthetic bearer marker appeared only in the password control and target
  request construction. It was absent from visible DOM text, URL, cookies,
  localStorage, sessionStorage, examples, rendered error text, and screenshots.
  Close and refresh removed it from the input and serialized DOM.
- Generated curl, Fetch, and Python examples contained only credential
  placeholders.
- The production preview returned a strict CSP with exact `connect-src` entries
  for the Ossie API and configured target. Development alone permits Vite's
  inline React-refresh bootstrap; production `script-src` remains `'self'`.
- Public and Viewer operation surfaces each returned zero axe WCAG 2 A/AA
  violations. The Admin workbench returned zero violations and two
  indeterminate contrast checks on pre-existing partially obscured textareas;
  visual review found no Child 137 contrast regression.
- At 320 CSS pixels there was no page-level horizontal overflow. A 200% zoom
  simulation at a 640-pixel viewport also had no page-level overflow.
  `prefers-reduced-motion: reduce` was honored.
- No JavaScript console errors were present in the final Admin, Viewer, or
  public journeys.

## Independent closure recheck

The 2026-07-31 close-previous audit reran the real fixture after repairing the
exact immutable Revision route and stricter response/request lifecycle:

- exact Revision `2` loaded as a read-only snapshot, resolved its immutable
  Access Evidence root, and fetched both configuration and report authority with
  `source=revision&revision_number=2`;
- confirmation received focus, trapped Tab, and restored focus to Send on
  Escape;
- one confirmed Revision request reached `https://api.github.com/widgets`; the
  target returned inert JSON `404` and Ossie received one content-free `204`
  report;
- bearer input remained confined to its password control and target request;
  all three examples used `<BEARER_TOKEN>`, and close removed the value from
  controls and serialized DOM;
- Admin policy save displayed the exact origin/operation-count confirmation;
- exact Revision and public operation layouts had no page-level overflow at
  320 CSS pixels, reduced-motion emulation was active, and consoles were clean;
- axe WCAG 2 A/AA reported zero violations for Admin, exact Revision, and public
  operation surfaces. Public code-example contrast was indeterminate and
  manually reviewed; the example regions no longer produce prohibited-ARIA
  findings.

## Evidence images

- [Admin policy and link state](137-documentation-api-try-it-and-example-experience-admin.png)
- [Viewer internal draft builder](137-documentation-api-try-it-and-example-experience-viewer.png)
- [Public request and inert response](137-documentation-api-try-it-and-example-experience-public.png)
- [Per-request confirmation](137-documentation-api-try-it-and-example-experience-confirmation.png)
- [Reflow and zoom check](137-documentation-api-try-it-and-example-experience-reflow.png)
- [Exact immutable Revision request builder](137-documentation-api-try-it-and-example-experience-revision.png)

## Automated failure-state coverage

Focused unit/integration tests cover digest/origin mismatch, disallowed/private
DNS answers, descriptor-v0 refusal, permission denial, stale policy and
optimistic conflicts, invalid/oversized request data, redirect refusal,
timeout/Abort, CORS/network failure classification, active/binary/oversized/
unreadable responses, malformed JSON blocked from display, secret reflection
redaction, short-secret refusal, idempotent policy writes, immutable Revision
freezing, strict public projection, and content-free Access Evidence.

No custom browser harness was introduced.
