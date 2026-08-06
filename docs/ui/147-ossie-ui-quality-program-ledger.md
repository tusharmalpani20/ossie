# Plan 147 UI Quality Program Ledger

Date opened: 2026-08-06
Plan: `docs/plan/147-ossie-ui-quality-program.md`
Status: `agent_accepted_pending_human`

This is the canonical mutable surface, issue, reference, decision, and
evidence ledger for Plan 147. It contains only synthetic fixture identifiers,
safe local route classes, and reproducible commands. It never records
passwords, cookies, session tokens, private URLs, customer data, or raw Capture
material.

## Program setup and truth

| Field | Recorded value | Status |
| --- | --- | --- |
| Execution worktree | `/home/ubuntu/ossie-plan147` | complete |
| Branch | `agent/plan-147-ui-quality` | complete |
| Starting commit | `d63811269eb59aebcba9bb43c4581314463439ae` | complete |
| Original worktree | `/home/ubuntu/ossie`, `main`, clean at creation | complete |
| Repository wrapper | `rtk` unavailable; direct command fallbacks are recorded | limitation |
| Node / pnpm | Node `v24.18.0`, pnpm `9.0.0` | complete |
| Database tooling | PostgreSQL `18.4` client, local server accepting on `127.0.0.1:5432`; Docker available | verified |
| Browser tooling | `agent-browser 0.33.1` available; Chromium session setup pending | verified |
| Dependency install | `pnpm install --frozen-lockfile` | complete, warning: Node URL parser deprecation |
| Runtime environment file | ignored local `apps/server/.env-cmdrc` linked into runner worktree; values not recorded here | complete |
| Disposable database | `ossie_test` under `testing_maintenance`, local PostgreSQL only | reset, migrated, seeded |
| Database proof | test runtime, `_test` database name, localhost endpoint, repository drop guard; explicit drop/create/migrate commands completed | verified |
| Required services | API `http://localhost:3022`, web `http://localhost:3020`, PostgreSQL `127.0.0.1:5432` | healthy; base-worktree ports remain untouched |
| Synthetic fixture namespace | Existing deterministic Plan 125 Documentation browser fixture with synthetic Capture and Documentation lifecycle states | seeded |
| Credential source | repository-approved synthetic admin fixture; no values recorded | browser login verified |

### Reproducible setup commands

Commands resolved from current repository files:

```text
ln -s /home/ubuntu/ossie/apps/server/.env-cmdrc /home/ubuntu/ossie-plan147/apps/server/.env-cmdrc
pnpm install --frozen-lockfile
pnpm --filter server run test:db:drop
pnpm --filter server run test:db:create
pnpm --filter server run test:db:provision-runtime-role
pnpm --filter server run test:migrate
pnpm --filter server seed:documentation-browser-fixture
pnpm --filter server dev # runner overrides: SERVER_PORT=3022, API_URL=http://localhost:3022
pnpm --filter web dev # runner overrides: Vite port 3020, VITE_OSSIE_API_URL=http://localhost:3022
curl --fail http://localhost:3022/healthz
curl --fail http://localhost:3022/readyz
curl --fail http://localhost:3020/
```

The database reset is restricted to the explicitly identified local
`ossie_test` database by the repository's testing-runtime and test-name guards.
The seed uses the existing deterministic synthetic Capture and Documentation
fixture builders; it must be run only after reset/migration and its CLI output
must be reduced to fixture identifiers before entering this ledger.

### Preflight proof (synthetic, local only)

- API health: `http://localhost:3022/healthz` returned `{"status":"ok","service":"ossie-api"}`.
- API readiness: `http://localhost:3022/readyz` returned database `ok`.
- Web: Vite served the runner app at `http://localhost:3020/`; the browser used
  the same `localhost` host for web and API so the local auth cookie remained
  same-site.
- Fixture organization: `01K12500000000000000000001`.
- Fixture project: `01K12500000000000000000002`, `Plan 125 Capture Browser Project`.
- Synthetic users: `plan125-admin@example.test` (`project_admin`) and
  `plan125-viewer@example.test` (`viewer`). Passwords and cookies are not
  recorded.
- Seeded route classes: authenticated Documentation site list, review inbox,
  editor/page editor, draft preview, public reader, public alias redirect,
  public gone, public operation, unsupported operation, and lifecycle cases for
  conflict, private comments, OpenAPI references, Publication immutability,
  rollback, snippet conflict, asset protection, expanded content, review
  request/inbox/evidence, browser-direct Try It, and inert request examples.
- Browser auth: the synthetic admin reached the authenticated Projects route
  and rendered the seeded project after explicit sign-out/login in a fresh
  local session.

### Current-truth reconciliation

The Plan 147 preflight updated the repository's current-truth references to
state that Master 007 and Children 141–146 are shipped and close-rechecked,
that the Tiptap and Fumadocs integrations are bounded/partial adapters, that
static export remains accepted-later, and that Plan 147 is the active UI
quality program. Focused `apps/docs` content tests pass (5/5). No credentials,
cookies, private URLs, or raw captured input are included here.

## Preflight checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Dedicated worktree and starting commit | `git worktree list`, worktree branch, commit above | complete |
| Re-audit repository instructions and accepted decisions | `AGENTS.md`, `CONTEXT.md`, ADRs `0021`–`0034`, Plan `147`, Child `146` | complete |
| Current worktree ownership | clean at runner creation; no pre-existing diff | complete |
| Disposable database positively identified | local `ossie_test`, testing env, guarded drop path | complete |
| Startup / seed / health / login commands resolved | development setup, package scripts, fixture CLI; isolated runner ports 3022/3020 | complete |
| Local services healthy | `/healthz` ok, `/readyz` database ok, Vite root served; base services preserved | complete |
| Deterministic synthetic role/content/lifecycle states seeded | fixture CLI summary recorded below; admin/viewer and published/redirect/gone/password cases available | complete |
| Current-truth drift reconciled | CONTEXT/PRODUCT/README/roadmap/project status/docs content updated; stale scan narrowed to no known shipped-state claims | complete |
| Route/surface/state ledger expanded | surface registry below; route audit identified P1-001 exact gap | complete |
| Existing UI evidence classified | inventory/classification remains to be completed in evidence work package | in_progress |
| External reference ledger revalidated | references recorded from Plan 147 and existing bounded adapter | in_progress |
| Baseline visual scores and issue IDs recorded | P1-001 through P1-006 and P2 entries recorded; visual scoring remains queued per surface | in_progress |

## Surface ledger

Statuses use the Plan 147 vocabulary. A surface cannot become
`agent_accepted_pending_human` until it has an immutable candidate, both blind
review reports, final clean verification, and all required evidence.

| Surface ID | Family / archetype | Exact routes, roles, and states | Starting commit | Candidate commit | Cycles | Reviewer A | Reviewer B | Verification | Status | Residual risk |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| `entry-onboarding` | Entry form | setup/login/invite; owner, existing member, invalid, unavailable, error | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `organization-admin` | Administration/list | organization members/invites/compliance/Documentation operations; owner/admin/editor/viewer | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `projects-workspace` | Dense library/workspace | project library/workspace/create/archive; owner/admin/editor/viewer | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `project-versions` | Context/admin/timeline | Project Version context/settings/create/reorder/default/archive/restore/activity/Carry Forward | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `capture-portal` | Library/workbench | Capture library/create/detail/assets/events/upload/retry/final/read-only | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `guides-internal` | Library/workbench/reader | Guide library/editor/preview/Revisions/publishing; admin/editor/viewer/public | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `guides-public` | Reader/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `demos-internal` | Library/direct-manipulation workbench | Demo library/editor/scenes/hotspots/preview/Revisions/publishing | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `demos-public` | Viewer/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `documentation-admin` | Library/workbench/admin | Site library/operations/review/assets/snippets/OpenAPI/portability/publishing | `d638112` | — | 0 | — | — | — | `queued` | P1-003 pending |
| `documentation-authoring` | Authoring workbench | Site/Page draft authoring, comments, conflict, read-only, archived, validation | `d638112` | — | 0 | — | — | — | `queued` | P1-003 pending |
| `documentation-previews` | Reader/admin | draft, exact Site Revision, exact Site Publication preview; internal roles | `d638112` | `001df10` | 0 | `accept` — review A | `accept` — review B | web 482/482; UI 7/7; web typecheck/lint/build; browser desktop+narrow+anonymous; axe 0 violations | `agent_accepted_pending_human` | P2 reader-chrome and shared-shell polish remain outside this correctness candidate |
| `documentation-public` | Reader/API reference | Publication reader/search/TOC/operation/Try It/access challenge; anonymous/member | `d638112` | — | 0 | — | — | — | `queued` | P1-004 pending |
| `public-access` | Shared access challenge | public/restricted/password/expired/revoked/version selection; anonymous | `d638112` | — | 0 | — | — | — | `queued` | shared contract audit pending |
| `extension-installation` | Setup utility | extension check/auth/error/ready/download/update/remove | `d638112` | — | 0 | — | — | — | `queued` | extension browser capability pending |
| `extension-capture` | Focused task utility | unconfigured/signed out/in/selection/recording/recovery/completion/error | `d638112` | — | 0 | — | — | — | `queued` | real toolbar evidence pending |
| `design-system-gallery` | Pattern gallery | `/__design-system`; patterns and state matrix; authenticated/local | `d638112` | — | 0 | — | — | — | `queued` | current route audit pending |
| `global-fallback` | Shell/error state | unsupported route/not found/shell failure/recovery; anonymous/authenticated | `d638112` | — | 0 | — | — | — | `queued` | route audit pending |
| `contributor-docs` | Separate documentation site | `apps/docs` landing/content; public | `d638112` | — | 0 | — | — | — | `queued` | lower-priority family |

Required states for each applicable internal surface: loading, empty,
populated, error/retry, denied, read-only, archived/final/frozen, unsaved,
saving, validation failure, conflict, destructive confirmation/failure, long
content/labels, slow/failed request, narrow/reflow, keyboard focus, and reduced
motion. Public surfaces additionally require exact link, password challenge,
incorrect password, internal-only/unavailable/revoked/expired/unknown,
canonical/redirect/gone, embed, and private-metadata leakage checks.

## Issue ledger

| Finding ID | Severity | Category | Surface / route / state / viewport | Evidence | Owner | Cycle | Disposition | Fix commit | Verification | Residual risk |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `P1-001` | P1 | correctness / route | Documentation Publication preview | Plan audit; `routes.ts`, `portalRouteMetadata.ts`, `App.tsx`; existing authenticated `GET .../publications` plus immutable `GET .../revisions/:revision_number` contract | implementer | 0 | accepted_pending_human | `001df10` | route + component tests green; authenticated and anonymous browser paths verified; both reviews accept | no new server/public route; exact Publication identity and its named Revision remain coupled |
| `P1-002` | P1 | token system | Demo/auth/Documentation live CSS | Plan audit; undefined token inventory | implementer | 0 | open | — | definition/consumer inventory required | token blast radius unverified |
| `P1-003` | P1 | composition / architecture | Documentation authoring 390px | Plan audit; mega-form evidence | implementer | 0 | open | — | browser route/state evidence required | capability ownership unverified |
| `P1-004` | P1 | reader composition | public Documentation reader 390px | Plan audit; committed reader evidence | implementer | 0 | open | — | browser reader matrix required | public UX remains unfinished |
| `P1-005` | P1 | workbench hierarchy / interaction | Interactive Demo editor | Plan audit; stage/navigator/inspector evidence | implementer | 0 | open | — | keyboard/direct-manipulation evidence required | resize alternative unverified |
| `P1-006` | P1 | current truth | repository status/docs | Plan section 8 scan | coordinator | 0 | open | — | text scan and doc diff | stale guidance may misdirect execution |
| `P2-001` | P2 | visual consistency | cross-product libraries/readers | plan issue register | implementer | 0 | queued | — | family review | exact route ownership pending |
| `P2-002` | P2 | mobile composition | dense/authoring surfaces | plan issue register | implementer | 0 | queued | — | 390px/200% evidence | exact candidates pending |

## Review ledger

| Candidate | Surface | Reviewer | Verdict | Review artifact | P0/P1 findings | P2 dispositions | Gates / scores | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `001df10` | `documentation-previews` | A — visual/interaction | `accept` | `docs/ui/147-documentation-publication-preview-review-a.md` | none | `A-P2-001` accepted as later reader-family decision | scores 3–5; responsive score 3 because shared shell remains dense at 390px | accepted pending human |
| `001df10` | `documentation-previews` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-publication-preview-review-b.md` | none | `B-P2-001` accepted within existing immutable contract | all gates pass; axe 0 violations at desktop and 390px | accepted pending human |

## Reference ledger

External references are pattern inputs only. They do not provide product,
domain, permission, lifecycle, publication, or URL authority.

| Surface | Reference product | Exact URL | Retrieved | Primary/secondary | Borrow | Reject | Ossie constraints | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Guide reader/editor | Scribe | Plan-approved official Scribe reader/editor references | 2026-08-06 planning audit | primary | calm content-first reader and compact authoring hierarchy | branding, copy, identity, feature semantics | Guide/Artifact/Edition/Revision/Publication rules remain Ossie-owned | revalidate before surface |
| Demo editor/viewer | Storylane | Plan-approved official Storylane editor/viewer references | 2026-08-06 planning audit | primary | stage-dominant walkthrough composition and contextual controls | branding, copy, identity, product behavior | Demo Scene/Hotspot/Transition and immutable Publication rules remain Ossie-owned | revalidate before surface |
| Documentation authoring | GitBook | `https://gitbook.com/docs/resources` | 2026-08-06 planning audit | primary | full-surface editing, navigation organization, contextual controls | hosted authority, Git/space semantics, exact identity | Site Edition/Working Draft/Revision/Publication and Project Membership remain Ossie-owned | revalidate before surface |
| Documentation review | GitBook | `https://gitbook.com/docs/collaboration/change-requests` | 2026-08-06 planning audit | secondary | focused review decision area and separation from editing | hosted approval semantics where Ossie differs | exact Site Revision targets, optional policy, private comments/review evidence | revalidate before surface |
| Documentation reader | Fumadocs | repository-pinned `fumadocs-core` behavior and existing evidence | 2026-08-06 planning audit | existing adapter | bounded tree/breadcrumb/TOC presentation | router/content authority, search/access ownership | ADR `0029`; exact Publication and public access remain Ossie-owned | revalidate before surface |

## Evidence ledger

| Surface | Route/state/viewport | Fixture | Browser/environment | Before | Candidate | Approved baseline | A11y | Keyboard/zoom/motion | Console/network | Intentional differences | Commit/date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `documentation-previews` | authenticated Publication 1 / desktop 1280px | synthetic Plan 125 fixture; Publication 1 → Revision 1 | agent-browser / Chromium; runner API 3022/web 3020 | route previously fell to generic portal fallback | implementation renders exact Publication/Revision identity and frozen pages; `docs/ui/147-publication-preview-after.png` | no | keyboard Tab reached Projects; reduced-motion media set; narrow overflow check `scrollWidth=clientWidth` | browser errors empty; authenticated calls succeeded; no failed requests observed | internal preview stays authenticated and does not use public link URL | `c139780` → candidate pending / 2026-08-06 |
| `documentation-previews` | authenticated Publication 1 / narrow 390×844 | synthetic Plan 125 fixture; Publication 1 → Revision 1 | agent-browser / Chromium | route previously fell to generic portal fallback | content and identity remain present at narrow width; `docs/ui/147-publication-preview-narrow.png`; page scroll width equals viewport width | no | reduced-motion media set; keyboard path exercised | no browser errors recorded | portal navigation remains a shared shell concern outside P1-001 | `c139780` → candidate pending / 2026-08-06 |
| `documentation-previews` | anonymous internal Publication 1 | same synthetic local route | separate agent-browser session | no internal route branch | explicit `Sign in to view this Project Version.` gate | no | not applicable | no browser errors recorded | internal route did not leak Publication metadata to anonymous user | `c139780` → candidate pending / 2026-08-06 |

## Decision ledger

| Decision | Recommendation / rationale | Alternatives | Scope | Status |
| --- | --- | --- | --- | --- |
| Browser evidence tooling | Continue with repository-approved `agent-browser`; do not add Playwright/axe without the Plan 147 dependency gate and user approval | dependency decision packet later | evidence only | accepted within plan |
| Token authority | Use existing semantic Ossie tokens in shared UI/web/extension and map legacy consumers explicitly | new token system or silent raw values | shared styling | pending implementation preflight |
| Database | Reset only local `ossie_test` via guarded testing commands and seed existing deterministic fixtures | a new Plan 147 namespace if existing fixture coverage is insufficient | local verification | pending command evidence |

## Checkpoints

| Date/time | Commit | Surface/state | Result | Next command |
| --- | --- | --- | --- | --- |
| 2026-08-06 | `d638112` | program setup | dedicated worktree established; runtime tools resolved; ledger opened | reset/migrate `ossie_test`, seed fixture, start API/web, health/login |
| 2026-08-06 | `c139780` | preflight/current truth | disposable DB seeded; runner services healthy; current truth reconciled; Publication route preflight recorded; focused docs test 5/5 | add Publication route implementation and candidate tests |
| 2026-08-06 | `001df10` | `documentation-previews` candidate | Publication route implemented through existing Publication→Revision contract; focused 22/22, full web 482/482, UI 7/7, typecheck/lint/build, browser/a11y evidence; both read-only reviews accept | human review of Plan 147 bundle; continue with next independent surface only after coordinator handoff |

## Final bundle index

To be assembled before autonomous-run milestone handoff:

- executive outcome and remaining decisions;
- complete surface status registry;
- before/after contact sheet grouped by journey;
- route/state/viewport labels;
- both blind reviewer reports for each candidate;
- finding/disposition and intentional-difference registers;
- accessibility, keyboard, zoom, responsive, motion, console, network,
  performance, tests, lint, types, and build summaries;
- commits and rollback map;
- dependency/reference decisions and limitations;
- exact human-review instructions.
