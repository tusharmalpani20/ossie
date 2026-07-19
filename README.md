# Ossie

<p align="center">
  <img src="docs/brand/ossie-horizontal-lockup.png" alt="Ossie purple octopus mascot and wordmark" width="720" />
</p>

Ossie is an alpha-stage, self-hosted open-source tool for turning browser workflows into two currently implemented outputs: Scribe-style step-by-step Guides and Storylane-style Interactive Demos. Projects now have explicit Project Membership, Audit/Access Evidence, and Project Version release contexts beginning with a real default `Main` record. Capture and authored-content persistence remains Project-scoped until the next foundation phases; Documentation and Video are not shipped.

> Alpha status: the core capture-to-guide and capture-to-demo paths exist, but the project still needs more dogfooding, packaging, editor polish, and extension reliability work before it should be treated as production-ready.

## What Works Today

| Area              | Current alpha capability                                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Setup and auth    | Web first-run setup, password login, cookie-backed portal sessions, and organization-scoped users.                                                                                                                                                                                                           |
| Projects          | Project creation, Project Membership, explicit Project Versions with a transactional default `Main`, canonical Version workspaces, lifecycle management, and project settings/archive controls. Existing Capture/Guide/Demo records remain default-only and Project-scoped until their dedicated migrations. |
| Capture           | Manual portal capture sessions, screenshot upload, ordered capture events, and event editing; Chrome extension automatic-click capture now has screenshot-backed browser evidence, with true toolbar-popup manual validation still pending.                                                                  |
| Extension         | Instance URL setup, login, project selection, manual screenshot fallback, automatic click capture MVP, and finish/open-active portal flow exist in code/tests; 2026-07-07 dogfood closed the split-origin portal link path and refreshed captured-workflow evidence.                                         |
| Guides            | Generate guides from capture sessions, edit blocks and steps, manage screenshots, annotate screenshots, preview, publish, password-protect, embed, export Markdown, and export HTML ZIP.                                                                                                                     |
| Interactive demos | Generate demos from capture sessions, edit scenes, add hotspots, publish, password-protect, embed, and view public demos.                                                                                                                                                                                    |
| Sharing           | Immutable publish snapshots for guides and demos with public/restricted access controls.                                                                                                                                                                                                                     |
| Team basics       | Organization invite creation, invite acceptance, and member access to shared projects.                                                                                                                                                                                                                       |
| Operations        | Local PostgreSQL, local file storage, health/readiness endpoints, CORS/cookie hardening, rate limits, and documented backup/restore expectations.                                                                                                                                                            |

The DB-backed v1 smoke workflow now proves the main backend path from first-run setup to published guide/demo and accepted teammate invite. See [V1 dogfood smoke suite](docs/v1-dogfood-smoke-suite.md).

## Alpha Screenshots

These screenshots use safe synthetic data. They are pre-rename alpha evidence and may still display the former Demo Composer name until the relevant UI modernization child refreshes them. Portal/editor screenshots come from the [2026-06-22 portal dogfood smoke](docs/v1-dogfood-smoke-suite.md). The public guide, public demo, and extension setup screenshots were refreshed on 2026-06-30 during the modern UI browser QA pass with local fixture data. Extension captured-workflow screenshots were refreshed on 2026-07-07 from an automatic-click browser validation run.

| Project and capture                                                                                                                     | Guide authoring                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Project workspace showing capture, guide, and interactive demo entry points](docs/assets/alpha/alpha-project-workspace.png)           | ![Guide editor showing a generated department setup guide with screenshot annotation and publishing controls](docs/assets/alpha/alpha-guide-editor.png) |
| ![Capture session detail with ordered screenshot-backed events and captured assets](docs/assets/alpha/alpha-capture-session-detail.png) | ![Published public guide reader for the department setup guide](docs/assets/alpha/alpha-public-guide-reader.png)                                        |

| Interactive demo editor                                                                                                    | Public demo viewer                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ![Interactive demo editor with scenes, hotspot controls, and publishing controls](docs/assets/alpha/alpha-demo-editor.png) | ![Published public interactive demo viewer with a highlighted hotspot](docs/assets/alpha/alpha-public-demo-viewer.png) |

| Chrome extension setup                                                                           | Extension active capture                                                                                             |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| ![Chrome extension popup connect instance screen](docs/assets/alpha/alpha-extension-connect.png) | ![Chrome extension active capture state with capture controls](docs/assets/alpha/alpha-extension-active-capture.png) |

| Extension capture detail                                                                                                                                    | Extension-generated guide                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ![Portal capture session detail showing extension-created click events and screenshot assets](docs/assets/alpha/alpha-extension-capture-session-detail.png) | ![Guide editor generated from extension-created capture source material](docs/assets/alpha/alpha-extension-guide-source.png) |

| Extension-generated interactive demo                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------- |
| ![Interactive demo editor generated from extension-created capture source material](docs/assets/alpha/alpha-extension-demo-source.png) |

## Current Alpha Flow

```text
browser workflow
  -> screenshots and capture events
  -> reusable capture session
  -> editable guide
  -> editable interactive demo
  -> public/private published links
```

The product intentionally keeps guides and interactive demos separate. A capture session is source material; guides and demos are authored outputs created from that source.

## Next Platform Direction

Master Plan `005` accepts the following target. Project Versions now provide the shipped navigation/release-context foundation; the nested Capture and Artifact ownership shown below remains planned work:

```text
Organization
  -> Projects
    -> Project Version context (Main first)
      -> Capture Sessions
      -> Guide Editions
      -> Interactive Demo Editions
      -> Product Documentation (after its domain grill)
      -> Video (later and not yet modeled)
```

This diagram is navigation context, not the current database ownership tree. Project Version identity, lifecycle, aliases, ordering, permissions, and Audit/Access Evidence are implemented. Stable Guide and Interactive Demo Artifact identities, Project Version-scoped Editions, Working Drafts, Revisions, and revised Publications are accepted future phases. See [the canonical glossary](CONTEXT.md) and [Master Plan 005](docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md).

Product Documentation means future customer-authored documentation sites and knowledge bases. It is different from `apps/docs`, which is this repository's contributor/operator documentation hub. The Documentation model will be decided by child `131` only after the platform foundation closes.

## Intentionally Deferred

- HTML capture/replay is not built; v1 is screenshot-first.
- AI/BYO-key authoring is deferred.
- Analytics, lead capture, sales tracking, and custom branding are not built.
- Hosted SaaS signup is not built; the current path is self-hosted first-run setup.
- Chrome Web Store packaging is not done; the extension is loaded unpacked.
- One-command production deployment packaging is deferred.
- Automated retention cleanup is not built.
- Local file storage is the only storage provider.
- Rate limiting is in-memory and should be replaced before multi-instance production deployments.
- Operators are responsible for database and local file storage backup/restore.
- True Chrome toolbar-popup manual screenshot validation is still pending; automatic-click extension captured-workflow screenshots are current as of the 2026-07-07 evidence pass.
- Product Documentation authoring is not implemented; its domain grill occurs after the current foundation track.
- Loom-style Video recording, storage, playback, transcription, and collaboration are later work and have no accepted runtime model yet.

## Quick Local Path

Install dependencies:

```bash
pnpm install
```

Start local PostgreSQL if you want the provided development database:

```bash
docker compose up -d postgres
```

Configure `apps/server/.env-cmdrc` from `apps/server/.env-cmdrc.example`, then create and migrate the database:

```bash
rtk pnpm --filter server db:create
rtk pnpm --filter server migrate:up
```

Run the API and web portal:

```bash
rtk pnpm --filter server dev
rtk pnpm --filter web dev
```

Open the portal, complete first-run setup, create a project, then create a capture session.

More detail: [development setup](docs/development-setup.md) and [self-hosting quickstart](docs/self-hosting.md).

## Chrome Extension

Build and load the extension:

```bash
rtk pnpm --filter extension build
```

Load `apps/extension/dist` as an unpacked extension from `chrome://extensions`.

Extension details: [apps/extension/README.md](apps/extension/README.md).

## Verification

Common checks:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

DB-backed checks:

```bash
rtk pnpm --filter server test:db
rtk pnpm --filter server test:smoke
```

DB checks require a real PostgreSQL testing database configured through `apps/server/.env-cmdrc`.

## Architecture At A Glance

```text
apps/server     Fastify REST API, PostgreSQL, local file storage
apps/web        React/Vite portal plus public guide/demo readers
apps/extension  React/Vite Chrome extension popup and capture worker
apps/docs       Compact repository docs hub for overview, source-doc links, and alpha evidence
packages/*      Shared constants, Zod API contracts, domain policies, UI primitives, and repo tooling
```

The backend is organized as domain modules under `apps/server/src/modules/*` with routes, services, repositories, and focused tests. Those modules adapt HTTP, persistence, auth context, and local storage to shared `@repo/types` contracts and framework-agnostic domain packages where those boundaries already exist. App-local types still stay near their owners when they do not pass the shared-package reuse gate. The portal uses a lightweight custom route parser for now.

## Documentation

- [Docs app overview](apps/docs/README.md)
- [Project status](docs/project-zoomout-status.md)
- [Roadmap](docs/roadmap.md)
- [Self-hosting](docs/self-hosting.md)
- [Operations](docs/operations.md)
- [Production readiness checklist](docs/production-readiness-checklist.md)
- [Backend route inventory](docs/backend-route-inventory.md)
- [V1 dogfood smoke suite](docs/v1-dogfood-smoke-suite.md)
- [Contributor guide](docs/contributor-guide.md)
- [Security policy](SECURITY.md)
- [OSS alpha summary](docs/oss-alpha-summary.md)

## Contributing And Security

Start with [CONTRIBUTING.md](CONTRIBUTING.md), then use [docs/contributor-guide.md](docs/contributor-guide.md) for repo layout, test commands, planning flow, and good first areas.

Security reports should follow [SECURITY.md](SECURITY.md).

## License

Ossie is licensed under the GNU Affero General Public License v3.0 only. See [LICENSE](LICENSE). The existing license attribution remains unchanged as legal/historical text pending separate review.
