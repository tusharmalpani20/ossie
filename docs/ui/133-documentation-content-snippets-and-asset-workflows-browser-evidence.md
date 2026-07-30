# Child 133 Browser Evidence

Date: 2026-07-30

Scope: `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`

## Environment

- Repository: `/home/ubuntu/ossie`
- Final browser runtime checkpoints inspected: `d775611` and `f0b7e9b`
- API: `http://127.0.0.1:3002`, `testing` runtime role
- Portal: `http://127.0.0.1:3000`
- Data: disposable synthetic Documentation browser fixture in `ossie_test`
- Browser automation: `agent-browser 0.33.1`
- Browser: Headless Chrome `151.0.0.0` on Linux
- Public route:
  `/docs/plan132-public/install-guide`
- Authenticated fixture roles: Project Admin and Project Viewer

All screenshots remained transient under `/tmp/ossie-133-browser`; no generated
browser artifact was committed.

## Passed journeys

### Public reader

- Rendered the expanded immutable Publication with a reusable Snippet, quote,
  table, callout, tabs, code example, Documentation-backed image,
  Capture-backed image, and frozen exact artifact Publication cards.
- Confirmed both protected image routes decoded successfully and retained their
  distinct source routes.
- Confirmed a query whose matching term existed only in expanded Snippet
  content returned the owning Page. This found and fixed an initial public
  search omission; the repeated browser query and DB smoke assertion passed.
- Confirmed safe reader output without authoring controls or private comments.
- Confirmed the skip link is keyboard reachable.
- Confirmed tabs support Arrow Left/Right and Home/End with selection and focus
  moving together.
- Confirmed code blocks expose keyboard-operable copy feedback.
- At a 320 CSS-pixel viewport with browser zoom at 200%, the document reported
  no page-level horizontal overflow; intentionally wide table/code content
  remained locally bounded.
- Confirmed `prefers-reduced-motion: reduce` was active in the narrow run.
- Axe reported zero violations on the public reader.
- Browser errors were empty. Console output contained only Vite/React
  development messages.

### Authenticated authoring and permissions

- Project Admin opened the Site workbench, created a reusable Snippet, added
  paragraph content, saved it, archived it, and restored it. Each network
  mutation succeeded.
- The workbench exposed source-labelled Documentation and Capture Assets. Only
  the Edition-owned Documentation Asset exposed archive control.
- The Page editor exposed every accepted V1 block kind and used labelled
  selectors for Snippets, Assets, and exact Guide/Demo Publications rather than
  requiring raw identifiers.
- The close-previous pass confirmed labelled same-Edition Page and OpenAPI
  operation selectors, editable callout fields, and working Snippet and
  Documentation Asset rename controls without exposing raw relational IDs.
- Project Viewer opened the same Site and Page and could read Snippets, Assets,
  saved Page content, preview, and private comments without create, save,
  archive, restore, publication, upload, or comment mutation controls.
- Axe reported zero violations on the Admin workbench and Viewer Page. The
  Admin audit retained one axe `incomplete` contrast review because a textarea
  was partially obscured during automated color sampling; it was not a
  violation. The Viewer audit had no incomplete result.
- Authenticated browser errors were empty.

## Stored transient evidence

- `/tmp/ossie-133-browser/public-desktop.png`
- `/tmp/ossie-133-browser/public-320-zoom200-reduced.png`
- `/tmp/ossie-133-browser/public-snippet-search.png`
- `/tmp/ossie-133-browser/admin-editor.png`
- `/tmp/ossie-133-browser/admin-snippet-lifecycle.png`
- `/tmp/ossie-133-browser/viewer-readonly.png`
- `/tmp/ossie-133-browser/admin-a11y.json`
- `/tmp/ossie-133-browser/viewer-a11y.json`

## Coverage boundaries

- Cross-tenant identity swaps, stale Row Version conflicts, archive/purge
  dependency variants, immutable P1/P2 comparison, rollback, missing media,
  restricted access, and migration behavior are deterministic automated
  database/API coverage; the browser run did not duplicate every negative
  assertion through UI controls.
- Firefox and WebKit were not available in this run and remain
  capability-dependent child `138` evidence.
- The later protected-byte integrity repair (`1d05d02`) changes server
  validation rather than browser behavior; its exact-byte/digest, DB, smoke,
  type, lint, and full server-unit proof is recorded in the child plan rather
  than represented as another browser run.
- The run used local synthetic one-pixel raster files. It validates protected
  routing and browser decoding, not production object-storage behavior or
  production latency.
