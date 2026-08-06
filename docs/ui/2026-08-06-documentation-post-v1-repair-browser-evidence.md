# Documentation Post-V1 Repair Browser Evidence

Date: 2026-08-06

Scope: the repaired public exact-Publication reader, grouped navigation and
adjacent links, public search failure/retry state, the public generated-example
boundary, and the authenticated Tiptap Page editor mount.

The browser used the disposable synthetic fixture seeded by
`pnpm --filter server seed:documentation-browser-fixture`:

- Organization `01K12500000000000000000001`;
- Project `01K12500000000000000000002`;
- public route `/docs/plan132-public/install-guide`;
- authenticated Page editor route under the same synthetic Project Version.

No customer data, credentials, cookies, tokens, HARs, or private screenshots
were committed.

## Environment

- agent-browser `0.33.1`;
- headless Chrome for Testing `151.0.7922.47`;
- Web `http://127.0.0.1:3000` and API `http://127.0.0.1:3002`;
- axe-core `4.12.1`.

## Reader and search evidence

- The real fixture rendered the nested `Guides` group with `Install` and
  `API reference` descendants. The breadcrumb included `Guides` and `Install`.
- The selected `Install` Page rendered `Next: API reference` with a canonical
  `/docs/plan132-public/reference` URL.
- A keyboard `Enter` submission returned `1 result` for `install`.
- Aborting the local search request rendered `Search is unavailable. Try
again.` without a page error or unhandled browser error. Removing the abort
  and retrying returned `0 results`.
- Axe reported zero violations and zero incomplete checks at 1280px, 320px,
  and the 160px equivalent reflow viewport. `scrollWidth` equaled the viewport
  at 320px and 160px; reduced-motion emulation was enabled for the narrow
  checks.
- `agent-browser errors` was empty. Console output contained only Vite/React
  development informational messages.

## Authoring and boundary evidence

- The authenticated synthetic Page editor mounted the Tiptap prose field with
  `contenteditable="true"` and `aria-label="Paragraph text"`.
- The metadata-only selection-preservation behavior is covered by a focused
  unit regression (2 files/12 tests); this record does not claim a browser
  caret measurement.
- The editor axe run reported zero violations, with one existing serious
  contrast check incomplete on the new-block/comment text inputs; this is
  recorded as a manual-review limitation, not claimed as a clean full pass.
- Server OpenAPI parser tests and the database-backed Documentation route test
  traced sensitive example names through inspection, persisted operation
  descriptors, Revision/Publication creation, and public output. The sentinel
  values did not appear in applied or public responses.

## Evidence limits

Firefox, WebKit, and an installed screen reader were unavailable. Go/gofmt was
also unavailable, so no Go parser result is claimed. These limitations do not
cover the focused TypeScript/domain/server tests or the Chromium checks above.
