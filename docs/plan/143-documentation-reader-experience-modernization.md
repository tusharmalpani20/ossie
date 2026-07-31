# Child Plan 143: Documentation Reader Experience Modernization

Date reserved: 2026-07-31

Status: Reserved. Not implementation-ready and not authorized for execution.

Parent:

- `docs/plan/master/007-documentation-post-v1-master-plan.md`

Predecessor:

- `docs/plan/142-documentation-authoring-experience-modernization.md`

## Objective

Implement the child-`141` selected reader route: bounded Fumadocs adoption,
partial UI/core primitive adoption, or native-reader modernization.

## Required expansion scope

- exact reader/preview/renderer/navigation/search/API-reference files, including
  `documentationInitialDocument.ts`, custom `App.tsx` routing, and conditional
  server initial-HTML/CSP/representation owners;
- separate adapter contracts for public exact Publications, authenticated
  mutable draft previews, and exact immutable Revision previews;
- public, password, internal, revoked, expired, unknown, redirect, gone,
  canonical, version-selection, asset, search, and operation behavior;
- initial crawler HTML, metadata, sitemap, robots, CSP, cache, and Try-It
  compatibility;
- loading/empty/error/denied and responsive navigation states;
- package/license/advisory/bundle result from child `141`;
- prove the chosen Fumadocs package subset operates within current React 19,
  Vite, Tailwind, and custom route composition; do not assume the documented
  React Router setup or use the server-only Loader API in browser code;
- native fallback and zero authoritative-content migration;
- unit/integration/route/agent-browser/accessibility/performance evidence.

## Hard boundaries

- Ossie authorizes and loads the exact resource class before adapter rendering;
  public reads are exact Publications, while draft and Revision previews retain
  their existing distinct authority and cache behavior.
- Product Documentation remains in `apps/web`; `apps/docs`, React Router, and
  Next.js are not migration targets for this child.
- Fumadocs/MDX cannot become content, routing, search, access, or publication
  authority.
- No new public URL shape without separate compatible acceptance.
- No static export, custom domain, analytics, or feedback scope.
- Use agent-browser on the existing fixture.

## Exit gate

Reader presentation is measurably improved, all exact-Publication/access/URL/
SEO/security behavior remains compatible, fallback is proven, and the child is
independently close-rechecked before child `144` begins.
