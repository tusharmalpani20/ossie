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
| Browser tooling | `agent-browser 0.33.1` available; fresh Chromium authenticated and anonymous sessions completed; native Chrome Page zoom 200% verified with `devicePixelRatio=2` | verified |
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

For this run, the runner API was started from the disposable testing profile
with `SERVER_PORT=3022 pnpm exec env-cmd -f .env-cmdrc -e testing
--no-override -- tsx watch ... src/index.ts`; the package's development
profile was not used for fixture verification. No base-worktree service was
stopped or modified.

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
| Existing UI evidence classified | inventory/classification recorded in the surface registry and evidence rows | complete |
| External reference ledger revalidated | references recorded from Plan 147 and existing bounded adapter | complete |
| Baseline visual scores and issue IDs recorded | P1-001 through P1-006 and P2 entries recorded; all qualifying surface reviews have baseline/after scores or explicit limitations | complete |

## Surface ledger

Statuses use the Plan 147 vocabulary. A surface cannot become
`agent_accepted_pending_human` until it has an immutable candidate, both blind
review reports, final clean verification, and all required evidence.

| Surface ID | Family / archetype | Exact routes, roles, and states | Starting commit | Candidate commit | Cycles | Reviewer A | Reviewer B | Verification | Status | Residual risk |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| `entry-onboarding` | Entry form | setup/login/invite; owner, existing member, invalid, unavailable, error | `85363ea` | `f27714b` | 0 | `accept` — review A | `accept` — review B | focused entry 22/22; full web 495/495 serial; web check-types/lint/build; login/setup/unavailable-invite browser matrix at desktop/narrow; axe 0/0; keyboard and reduced-motion checks | `agent_accepted_pending_human` | setup-ready and loaded-invite browser states remain component-test coverage because no safe seeded fixture exists; browser zoom controls remain environment-limited; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `organization-admin` | Administration/list | organization members/invites/compliance/Documentation operations; owner/admin/editor/viewer | `f125272` | `c4141a1` | 0 | `accept` — review A | `accept` — review B | focused organization-admin 13/13; full web 492/492 serial; web typecheck/lint/build/diff; authenticated owner/viewer members/compliance browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; no pre-change compliance desktop screenshot; one incomplete contrast-background probe over partially sampled metric values |
| `projects-workspace` | Dense library/workspace | project library/workspace/create/archive/unauthenticated denied; owner/admin/editor/viewer | `c6ee819` | `e94d6a9` | 3 | `accept` — prior cycles; `incomplete` — workspace state follow-up | `accept` — prior cycles; `needs_human_surface` — workspace state follow-up | Prior ProjectListPage/App/shell evidence remains valid; workspace component 9/9; adjacent Project list/shell 21/21; actual `/projects/project_1` route is owned by `LegacyProjectRedirect` and renders the existing 401 fallback with axe 1 missing-h1 violation; no candidate runtime browser evidence | `needs_human_surface` | final-cycle component semantics are clearer but `ProjectWorkspacePage` is not mounted by the normal App route; route ownership must be decided before runtime acceptance or further implementation; browser zoom, P2-001, and broader 26.6 matrix remain separate; prior `aa6f892`/`3a8fad4` evidence remains linked |
| `project-versions` | Context/admin/timeline | Project Version context/settings/create/reorder/default/archive/restore/activity/Carry Forward | `d34eafe` | `c93ca11` | 0 | `accept` — review A | `accept` — review B | focused Project Version 12/12; full web 493/493 serial; web typecheck/lint/build; authenticated owner/viewer active/non-default/archived browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; existing settings textarea probe; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `capture-portal` | Library/workbench | Capture library/create/detail/assets/events/upload/retry/final/read-only | `e37df02` | `f4a6010` | 0 | `accept` — review A | `accept` — review B | focused Capture portal 58/58; full web 494/494 serial; web check-types/lint/build; authenticated owner/viewer list/create/detail browser matrix; desktop/narrow axe 0 violations; no new post-restart browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; populated Event/Asset browser records unavailable in disposable fixture and remain component-test coverage; create-form textarea has one incomplete contrast-background probe; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `internal-library-state-semantics` | Library transient states | Capture Sessions, Guides, Interactive Demos, and Documentation Sites; loading, denied/not-found, error/retry, authenticated synthetic route; 1440px and 390px | `ab99b5a` | `ce1d373` + `b159eed` | 0 | `accept` — review A | `accept` — review B | focused list 34/34; App 20/20; full web 95 files / 507 tests; web typecheck/lint/build; CSS-token check 130/123; authenticated error-state browser screenshots for all four routes; 1440px axe 0/0; Documentation 390px reduced-motion/keyboard axe 0/0 | `agent_accepted_pending_human` | loading and unauthenticated/not-found browser screenshots were not claimed because the runner cannot safely delay responses and the browser pass used authenticated synthetic routes; actual 200% zoom, P2-001, workspace route ownership, and broader 26.6 matrix remain separate |
| `guides-internal` | Library/workbench/reader | Guide library/editor/preview/Revisions/publishing; admin/editor/viewer/public | `0dc73d0` | `ae217d0` | 0 | `accept` — review A | `accept` — review B | focused Guide/Revision 19/19; full web 495/495 serial; web check-types/lint/build; authenticated owner/editor/viewer list/editor/preview/Revision browser matrix; desktop/narrow axe 0 violations except existing editor incomplete probes; no new post-restart browser errors; active fixture media limitation recorded | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; active fixture media requests blocked by existing dev CSP/API-origin setup; editor incomplete contrast probes; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `guides-public` | Reader/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | `953a7fa` | 0 | `accept` — review A | `accept` — review B | focused Guide/public-route 7/7; full web 488/488 serial; web typecheck/lint/build; anonymous reader/embed/access browser matrix; axe 0 violations / 0 incomplete; no browser errors or failed local requests | `agent_accepted_pending_human` | no seeded public empty-link route; empty/missing/broken media are component-tested; browser zoom controls are environment-limited |
| `demos-internal` | Library/direct-manipulation workbench | Demo library/editor/scenes/hotspots/preview/Revisions/publishing | `d638112` | `e97647e` | 0 | `accept` — review A | `accept` — review B | focused Interactive Demo 39/39; full web 485/485 serial; web typecheck/lint/build/Prettier; authenticated active/empty/archived/viewer/preview/Revisions browser matrix; pointer/keyboard/zoom/reduced-motion; axe 0 violations | `agent_accepted_pending_human` | one existing incomplete textarea contrast probe on active/empty editor; shared shell/public access remain separate |
| `demos-public` | Viewer/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | `fff22eb` | 0 | `accept` — review A | `accept` — review B | focused renderer/public 10/10; full web 486/486 serial; web typecheck/lint/build; anonymous reader/embed/version/access browser matrix; axe 0 violations / 0 incomplete; no browser errors or failed local requests | `agent_accepted_pending_human` | browser zoom controls are environment-limited; missing/broken media remains covered by renderer tests and internal synthetic routes |
| `documentation-admin` | Library/workbench/admin | Site library/operations/review/assets/snippets/OpenAPI/portability/publishing | `57226fa` | `0d11790` | 0 | `accept` — review A | `accept` — review B | focused Documentation operations 3/3; full web 490/490 serial; web typecheck/lint/build; authenticated owner/viewer usage and limit browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; broader Site library/editor surfaces remain separate |
| `documentation-authoring` | Authoring workbench | Site/Page draft authoring, comments, conflict, read-only, archived, validation | `d638112` | `8055143` | 0 | `accept` — review A | `accept` — review B | Site 4/4; Page 6/6 isolated; App-focused pass; web typecheck/lint/build; serial web 482/483 with unrelated Guide failure; authenticated desktop+narrow/keyboard/zoom/reduced-motion; axe 0 violations | `agent_accepted_pending_human` | viewer/archived browser session unavailable on isolated runner; component tests cover guards; unrelated Guide suite failure remains out of scope |
| `documentation-previews` | Reader/admin | draft, exact Site Revision, exact Site Publication preview; internal roles | `d638112` | `001df10` | 0 | `accept` — review A | `accept` — review B | web 482/482; UI 7/7; web typecheck/lint/build; browser desktop+narrow+anonymous; axe 0 violations | `agent_accepted_pending_human` | P2 reader-chrome and shared-shell polish remain outside this correctness candidate |
| `documentation-public` | Reader/API reference | Publication reader/search/TOC/operation/Try It/access challenge; anonymous/member | `d638112` | `0ea64b9` | 0 | `accept` — review A | `accept` — review B | focused reader/request/OpenAPI 20/20; full web 483/483 serial; web typecheck/lint/build/Prettier; anonymous desktop+narrow/keyboard/search/zoom/reduced-motion/route-variant/operation evidence; axe 0 violations and 0 incomplete | `agent_accepted_pending_human` | no deterministic seeded public-password route for browser screenshot; existing component tests cover challenge/retry; embed and shared access family remain separate |
| `public-access` | Shared access challenge | public/restricted/password/expired/revoked/version selection; anonymous | `85deae4` | `8e38ee4` | 0 | `accept` — review A | `accept` — review B | focused public-access/readers 16/16; full web 496/496 serial; web check-types/lint/build; anonymous valid Guide and unavailable Demo browser matrix at desktop/narrow; axe 0/0; reduced-motion and responsive selector checks | `agent_accepted_pending_human` | multi-entry browser fixture unavailable and remains component-test coverage; Demo/Documentation disposable slugs currently render truthful unavailable states; browser zoom controls remain environment-limited; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `token-foundation` | Shared pattern / design system | web `/__design-system`, authenticated portal shell, auth entry, Demo workbench/editor, Documentation library, extension popup; default/hover/focus/disabled/selected/error/read-only/reduced-motion | `105fc5b` | `59fd07f` | 1 | `accept` — follow-up review A | `accept` — follow-up review B | follow-up token test 4/4; full UI 8/8; `pnpm check-css-tokens` 127 definitions / 122 consumers; extension 140/140; affected typecheck/lint/build; browser desktop/narrow axe 0/0 | `agent_accepted_pending_human` | installed extension-toolbar capability remains `blocked_local_for_run`; original token candidate and visual evidence remain linked in the review ledger |
| `shared-foundation` | Shared primitives / pattern gallery | `@repo/ui` Button/Card/Alert/Badge/Label/Input/Select/Textarea/Separator; local `/__design-system` command/state/list/workbench/drawer/reader/access/compact-extension specimens; proven dead-CSS audit | `24b2395` | `9e53e20` | 1 | `accept` — review A | `accept` — review B | UI 11/11; focused web 45/45; full web 94 files / 497 tests; extension 19 files / 140 tests; web/extension typecheck/lint/build; `pnpm check-css-tokens` 130 definitions / 123 consumers; desktop/narrow axe 0/0, no overflow, reduced-motion, keyboard focus | `agent_accepted_pending_human` | gallery is synthetic/local-only; installed toolbar remains `blocked_local_for_run`; 200% zoom and broader raw CSS review remain separate |
| `shared-shell-mobile` | Shared portal shell | `PortalAppShell` navigation on portal routes; unauthenticated `/projects` browser state plus project-admin/viewer component contexts; 1440px, 390px, 320px | `a83f2ae` | `8b45a4b` | 0 | `accept` — review A | `accept` — review B | focused shell 6/6; full web 95 files / 498 tests; web typecheck/lint/build; token check 130/123; desktop/narrow/320px nav width equals client width; focused nav axe 0/0; keyboard/reduced-motion | `agent_accepted_pending_human` | full `/projects` retains a pre-existing missing-h1 axe finding; browser zoom control and authenticated browser fixture remain unavailable; no route/domain/API changes |
| `extension-installation` | Setup utility | extension check/auth/error/ready/download/update/remove | `7893091` | `1058dbd` | 0 | `accept` — review A | `accept` — review B | focused extension installation 22/22; full web 496/496 serial; web check-types/lint/build; authenticated ready-state browser matrix at desktop/narrow; axe 0/0; keyboard and reduced-motion checks; no target overflow | `agent_accepted_pending_human` | unpacked extension load and pin-to-toolbar details are now separately evidenced; actual toolbar-icon popup activation remains unclaimed; native 200% evidence now covers the direct extension popup, while the rest of this family remains unverified at that zoom; shared portal-shell clipping remains separate from resolved P2-010 |
| `extension-capture` | Focused task utility | unconfigured/signed out/in/selection/recording/recovery/completion/error | `537b3d5` | `106705c` | 0 | `accept` — review A | `accept` — review B | focused extension 140/140; extension typecheck/lint/build; direct synthetic popup active/selection 360px and 180px proxy; fresh unpacked MV3 load/pin, direct extension-origin connect/sign-in/project selection, start/complete Capture, portal detail, native 200% Connect/Ready states, axe 0/0, and final-path request proof; screenshots `147-continuation-extension-pinned.png`, `147-continuation-extension-connect.png`, `147-continuation-extension-ready.png`, `147-continuation-extension-capture-portal.png`, `147-continuation-extension-connect-zoom-200.png`, `147-continuation-extension-ready-zoom-200.png` | `blocked_local_for_run` | Chromium loaded and enabled the unpacked build and showed the pin-to-toolbar control; the CLI still cannot invoke the browser toolbar icon itself, so direct extension-origin popup evidence is not claimed as toolbar-popup evidence; 180px retains one incomplete contrast-background probe over overlapping long labels; native 200% evidence is limited to direct extension-origin states; the final disposable database was reseeded with Documentation fixture |
| `design-system-gallery` | Pattern gallery | `/__design-system`; patterns and state matrix; authenticated/local | `3adc9db` | `7cf7057` | 0 | `accept` — review A | `accept` — review B | focused gallery/App 21/21; web check-types/lint/build; local desktop/narrow browser matrix; axe 0/0; keyboard/reduced-motion checks; no page or section overflow | `agent_accepted_pending_human` | synthetic/local-only gallery; browser zoom controls remain environment-limited; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `global-fallback` | Shell/error state | unsupported route/not found/shell failure/recovery; anonymous/authenticated | `7cf7057` | `de37b5e` | 0 | `accept` — review A | `accept` — review B | focused unsupported route 1/1; web check-types/lint/build; anonymous `/unknown` desktop/narrow browser matrix; axe 0/0; keyboard/reduced-motion checks; no page overflow | `agent_accepted_pending_human` | forced Documentation lazy-load failure remains existing boundary coverage; browser zoom controls remain environment-limited; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `contributor-docs` | Separate documentation site | `apps/docs` landing/content; public | `de37b5e` | `ae37ba6` | 0 | `accept` — review A | `accept` — review B | focused docs page/content 10/10; docs check-types/lint/build; local desktop/narrow browser matrix; all four local images loaded; axe 0/0; keyboard/reduced-motion checks; no page overflow | `agent_accepted_pending_human` | external source links were not followed; browser zoom controls remain environment-limited; customer Product Documentation remains a separate app/web surface |

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
| `P1-002` | P1 | token system | Demo/auth/Documentation live CSS | Plan audit; undefined token inventory; current CSS consumer/definition inventory | implementer | 1 | accepted_pending_human | `59fd07f` | `check-css-tokens` passes with 127 definitions / 122 consumers; focused token/UI/extension tests and builds pass; browser token/a11y evidence and follow-up reviews accept | no undefined token names remain; installed extension-toolbar capability remains blocked locally and is separate |
| `P1-003` | P1 | composition / architecture | Documentation authoring 390px | Plan audit; authenticated baseline measured at 6,845 CSS px and 136 interactive controls | implementer | 0 | accepted_pending_human | `8055143` | Site task boundaries, status persistence, focused state guards, browser/a11y evidence, and both reviews pass | viewer/archived browser session unavailable on isolated runner; unrelated Guide test failure remains separate |
| `P1-004` | P1 | reader composition | public Documentation reader 390px | Plan audit; anonymous Publication reader baseline measured and operation route verified | implementer | 0 | accepted_pending_human | `0ea64b9` | focused reader/request/OpenAPI 20/20; full web 483/483; typecheck/lint/build/Prettier; browser reader matrix and both reviews pass | deterministic password-route browser proof unavailable; no public snapshot, access, Try It, or URL contract changes |
| `P1-005` | P1 | workbench hierarchy / interaction | Interactive Demo editor | Plan audit; active synthetic fixture measured at 2,823px desktop / 4,683px narrow with permanent controls competing with the stage | implementer | 0 | accepted_pending_human | `e97647e` | focused Interactive Demo 39/39; full web 485/485; typecheck/lint/build/Prettier; active/empty/archived/viewer/preview/Revisions browser evidence; pointer/keyboard/zoom/reduced-motion; both reviews accept | one existing incomplete textarea contrast probe remains; no server/API/domain/public-link/immutability changes |
| `P1-006` | P1 | current truth | repository status/docs | Plan section 8 scan | coordinator | 0 | accepted_pending_human | `c139780` | current-truth reconciliation, focused `apps/docs` content tests 5/5, and narrowed stale-state scan pass | future/static-export language remains explicitly accepted-later; no shipped-state contradiction found in the audited sources |
| `P2-003` | P2 | public viewer composition | `demos-public` valid reader/embed, 1440px and 390px | surface preflight; baseline showed weak published context and ungrouped playback frame | implementer | 0 | accepted_pending_human | `fff22eb` | public shell, Version selection, Scene playback, access states, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | browser zoom control is environment-limited; shared public-access family remains separate |
| `P2-005` | P2 | public reader composition | `guides-public` valid reader/embed, 1440px and 390px | surface preflight; baseline showed sparse chrome, weak content measure, and unframed Guide block | implementer | 0 | accepted_pending_human | `953a7fa` | public shell, immutable block frame, media fallback, access states, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | no seeded public empty-link route; shared public-access family remains separate |
| `P2-006` | P2 | workspace composition | `projects-workspace` active/archived/create/unauthenticated denied, 1440px and 390px | surface preflight; baseline showed a sparse desktop field, weak filter grouping, loose card hierarchy, denied state without a level-one heading, and transient loading/error states without page/status semantics | implementer | 3 | needs_human_surface | `e94d6a9` | ProjectWorkspacePage 9/9; adjacent Project list/shell 21/21; actual `/projects/project_1` browser route reaches `LegacyProjectRedirect`, not the candidate component; browser axe reports the existing fallback missing-h1 violation; both final-cycle reviews record incomplete/needs-human | route ownership is unresolved and no truthful runtime evidence exists for the candidate branches; do not wire the component without human direction; browser zoom and broader 26.6 matrix remain separate |
| `P2-007` | P2 | administration composition | `documentation-admin` usage/limits, owner and viewer, 1440px and 390px | surface preflight; baseline had a nested main landmark, ungrouped metrics, and an oversized policy form | implementer | 0 | accepted_pending_human | `0d11790` | single shell-owned main, named usage/limits regions, owner-only controls, responsive policy form, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | shared portal navigation clipping and browser zoom limitation remain separate; Site library/editor family is not included |
| `P2-008` | P2 | compact utility composition | `extension-capture` selection/active, 360px and 180px proxy | surface preflight; baseline showed action competition and no named capture-action group | implementer | 0 | blocked_local_for_run | `106705c` | named action group, compact wrapping, direct popup axe/reflow/motion evidence, extension 140/140, typecheck/lint/build, and both reviews pass | installed toolbar/permission path unavailable; 180px contrast probe incomplete; no installed-toolbar claim |
| `P2-009` | P2 | administration composition | `organization-admin` members/invites/compliance, owner and viewer, 1440px and 390px | surface preflight; baseline showed weak page grouping, loose member/invite cards, and an unbounded compliance evidence stream | implementer | 0 | accepted_pending_human | `c4141a1` | named members workspace, responsive invite/member/pending-invite cards, bounded compliance timeline, headed denial state, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | shared portal navigation clipping, browser zoom limitation, missing pre-change compliance desktop screenshot, and one incomplete metric contrast-background probe remain recorded |
| `P2-010` | P2 | token consistency | existing Documentation reader/editor CSS fallback consumers surfaced during Project Version verification | `pnpm check-css-tokens` initially reported four undefined names; follow-up test and alias mapping recorded in `59fd07f` | coordinator | 1 | accepted_pending_human | `59fd07f` | token source contract 4/4; full UI 8/8; `pnpm check-css-tokens` passes with 127 definitions / 122 consumers; web/extension checks and browser axe evidence pass; both follow-up reviews accept | no undefined token names remain; broader raw CSS cleanup is separate from this defect fix |
| `P2-011` | P2 | Capture composition | Capture list/create/detail, owner/viewer, 1440px and 390px | surface preflight; baseline showed raw Project ID presentation, weak list grouping, and loose detail hierarchy | implementer | 0 | accepted_pending_human | `f4a6010` | named list/detail workspace regions, responsive list/detail/create composition, owner/viewer browser matrix, axe, reduced-motion, no-overflow, focused 58/58, full web 494/494, check-types/lint/build, and both reviews pass | populated Event/Asset browser records remain unavailable in the disposable fixture; shared shell, zoom, and existing form probe remain separate |
| `P2-012` | P2 | Guide family composition / accessibility | Guide list/editor/preview/Revision history/Revision preview, owner/editor/viewer, 1440px and 390px | surface preflight; editor baseline measured 110 controls and 5,217px at 390px; preview had one primary-link contrast violation | implementer | 0 | accepted_pending_human | `ae217d0` | named Guide/Revision workspace regions, responsive library/editor/preview/history composition, preview contrast correction, owner/viewer browser matrix, axe, reduced-motion, no-overflow, focused 19/19, full web 495/495, check-types/lint/build, and both reviews pass | active fixture media requests are blocked by existing dev CSP/API-origin setup; editor retains two existing incomplete contrast-background probes; shared shell and browser zoom remain separate |
| `P2-013` | P2 | entry composition / accessibility | Login, First-run Setup, and organization Invite entry; public states at 1440px and 390px | surface preflight; shared shell had no named main, entry CSS used raw spacing, and Invite’s standard card could span the desktop viewport | implementer | 0 | accepted_pending_human | `f27714b` | named `Entry workspace`, readable responsive shell, constrained standard Invite card, browser login/setup/unavailable-invite matrix, axe 0/0, keyboard/reduced-motion, focused 22/22, full web 495/495, check-types/lint/build, and both reviews pass | setup-ready and loaded-invite browser states remain component-test coverage; browser zoom controls remain environment-limited; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `P2-014` | P2 | public access composition / accessibility | Shared public Project Version selector across Guide, Demo, and Documentation readers; anonymous, desktop/narrow | surface preflight; single-entry context was loose muted text and multi-entry select had generic Version naming/raw control values | implementer | 0 | accepted_pending_human | `8e38ee4` | Project Version chip, named multi-entry combobox, responsive tokenized control, valid Guide/unavailable Demo browser matrix, axe 0/0, reduced-motion, focused 16/16, full web 496/496, check-types/lint/build, and both reviews pass | multi-entry browser fixture unavailable; Demo/Documentation valid populated slugs unavailable in current disposable seed; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `P2-015` | P2 | extension installation composition / accessibility | Authenticated `/extension` ready state; desktop 1440px and narrow 390px | surface preflight; baseline had a Capture-tools contrast violation and an incomplete gradient-background probe over the download card | implementer | 0 | accepted_pending_human | `1058dbd` | named installation workspace, tokenized hierarchy and cards, authenticated desktop/narrow browser evidence, axe 0/0, keyboard/reduced-motion, focused 22/22, full web 496/496, check-types/lint/build, and both reviews pass | installed toolbar/permission path is unavailable in this runner; shared shell clipping and browser zoom remain separate from resolved P2-010 |
| `P2-016` | P2 | design-system gallery composition / accessibility | Local `/__design-system`; desktop 1440px and narrow 390px | surface preflight; historical gallery had no state matrix, no named main, and a narrow table widened its section and triggered a scrollable-region violation | implementer | 0 | accepted_pending_human | `7cf7057` | shared loading/empty/error/read-only/validation matrix, named workspace, focusable labeled table region, responsive long-label table, axe 0/0, keyboard/reduced-motion, focused 21/21, web check-types/lint/build, and both reviews pass | gallery remains synthetic/local-only; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup and browser zoom remain separate |
| `P2-017` | P2 | global fallback composition / accessibility | Anonymous unsupported `/unknown`; desktop 1440px and narrow 390px | surface preflight; fallback had no level-one heading, generic portal copy, and no recovery action hierarchy | implementer | 0 | accepted_pending_human | `de37b5e` | Page-not-found h1, named main, Projects/sign-in recovery links, solid fallback background, axe 0/0, keyboard/reduced-motion, focused 1/1, web check-types/lint/build, and both reviews pass | forced Documentation lazy-load failure remains existing boundary coverage; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate |
| `P2-018` | P2 | contributor documentation composition / accessibility | Public `apps/docs` landing; desktop 1440px and narrow 390px | surface preflight; hero evidence used an invalid ARIA label on a plain div | implementer | 0 | accepted_pending_human | `ae37ba6` | semantic hero figure/caption, local evidence assets loaded, axe 0/0, keyboard/reduced-motion, focused docs 10/10, docs check-types/lint/build, and both reviews pass | external source links were not followed; docs app remains separate from customer Product Documentation |
| `P2-001` | P2 | visual consistency | cross-product libraries/readers | plan issue register and scope preflight below | coordinator | 0 | needs_human_surface | — | no implementation candidate; exact route/state/viewport ownership is not defined | the strongest concrete finding is the Documentation Publication preview versus public reader navigation/TOC boundary; choosing a shared chrome or preserving the bounded preview is a product/design decision; do not start a broad cross-product rewrite without that direction |
| `P2-002` | P2 | mobile composition | shared authenticated portal shell / 1440px, 390px, and 320px | shared-shell-mobile preflight; PortalAppShell navigation measured 837px wide inside a 390px viewport | implementer | 0 | accepted_pending_human | `8b45a4b` | focused shell 6/6; full web 95/498; web typecheck/lint/build; 1440px/390px/320px browser evidence; focused navigation axe 0/0; keyboard and reduced-motion checks; both reviews accept | actual browser zoom control unavailable; unauthenticated `/projects` is the truthful browser state and authenticated role contexts remain component-test coverage; P2-001 and the broader matrix remain separate |

## Review ledger

| Candidate | Surface | Reviewer | Verdict | Review artifact | P0/P1 findings | P2 dispositions | Gates / scores | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `001df10` | `documentation-previews` | A — visual/interaction | `accept` | `docs/ui/147-documentation-publication-preview-review-a.md` | none | `A-P2-001` accepted as later reader-family decision | scores 3–5; responsive score 3 because shared shell remains dense at 390px | accepted pending human |
| `001df10` | `documentation-previews` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-publication-preview-review-b.md` | none | `B-P2-001` accepted within existing immutable contract | all gates pass; axe 0 violations at desktop and 390px | accepted pending human |
| `105fc5b` | `token-foundation` | A — visual/interaction | `accept` | `docs/ui/147-token-foundation-review-a.md` | none | `A-P2-002` accepted as intentional table pattern | scores 3–5; responsive score 3 because narrow table scroll is intentional | accepted pending human |
| `105fc5b` | `token-foundation` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-token-foundation-review-b.md` | none | `B-P2-002` accepted with narrow axe limitation; toolbar block isolated | all gates pass for shared token candidate; extension toolbar `blocked_local_for_run` | accepted pending human |
| `59fd07f` | `token-foundation` | A — follow-up visual/interaction | `accept` | `docs/ui/147-token-foundation-followup-review-a.md` | none | no visual difference; extension toolbar remains separate | four semantic aliases preserve existing link/font/size/radius values; browser desktop/narrow parity and axe 0/0 pass | accepted pending human |
| `59fd07f` | `token-foundation` | B — follow-up product/a11y/engineering QA | `accept` | `docs/ui/147-token-foundation-followup-review-b.md` | none | raw CSS cleanup and installed toolbar remain separate | token test 4/4, UI 8/8, extension 140/140, check-css-tokens pass, browser axe 0/0, typecheck/lint/build pass | accepted pending human |
| `9e53e20` | `shared-foundation` | A — visual/interaction | `accept` | `docs/ui/147-shared-foundation-review-a.md` | none | no blocking finding; synthetic gallery and installed toolbar remain separate | parent/candidate desktop+narrow screenshots; command hierarchy and responsive patterns; axe 0/0; no overflow; reduced motion and keyboard focus pass | accepted pending human |
| `9e53e20` | `shared-foundation` | B — product/a11y/engineering QA | `accept` | `docs/ui/147-shared-foundation-review-b.md` | none | 200% zoom and broader raw CSS remain separate; installed toolbar remains blocked | UI 11/11; focused web 45/45; full web 94/497; extension 140/140; typecheck/lint/build; token check 130/123; axe 0/0 | accepted pending human |
| `8b45a4b` | `shared-shell-mobile` | A — visual/interaction | `accept` | `docs/ui/147-shared-shell-mobile-review-a.md` | none | no blocking finding; taller narrow grid is intentional; browser zoom remains separate | desktop unchanged; 390px two-column and 320px one-column navigation; no overflow; focused nav axe 0/0; keyboard path pass | accepted pending human |
| `8b45a4b` | `shared-shell-mobile` | B — product/a11y/engineering QA | `accept` | `docs/ui/147-shared-shell-mobile-review-b.md` | none | pre-existing `/projects` missing-h1 finding and unauthenticated browser fixture recorded; zoom remains blocked | shell 6/6; full web 95/498; typecheck/lint/build; focused nav axe 0/0; reduced-motion and network/console checks | accepted pending human |
| `8055143` | `documentation-authoring` | A — visual/interaction | `accept` | `docs/ui/147-documentation-authoring-review-a.md` | none | `A-P2-003` retained for deeper Content/Publish drawers; `A-P2-004` shared shell | scores 4–5; active route 1,269px desktop / 2,613px narrow; task boundaries and no page overflow | accepted pending human |
| `8055143` | `documentation-authoring` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-authoring-review-b.md` | none | `B-P2-003` viewer browser limitation; `B-P2-004` unrelated Guide failure | Site 4/4, Page 6/6 isolated, App-focused; axe 0 violations desktop+narrow; keyboard/zoom/reduced-motion pass | accepted pending human |
| `0ea64b9` | `documentation-public` | A — visual/interaction | `accept` | `docs/ui/147-documentation-public-review-a.md` | none | shared shell/search polish retained for later family work | scores 4–5; 1440px/390px composition, drawer, operation grouping, bounded code/table content, and zoom evidence pass | accepted pending human |
| `0ea64b9` | `documentation-public` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-public-review-b.md` | none | no deterministic password route; embed/shared access family remain separate | exact route variants, no metadata/credential leakage, inert examples, unavailable Try It, keyboard, axe, reduced-motion, and no target request pass | accepted pending human |
| `e97647e` | `demos-internal` | A — visual/interaction | `accept` | `docs/ui/147-interactive-demo-review-a.md` | none | shared portal shell and broader family polish remain separate | scores 4–5; stage dominance, bounded 12-scene navigator, contextual inspector, pointer/keyboard geometry, narrow/reflow, and disclosure pass | accepted pending human |
| `e97647e` | `demos-internal` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-interactive-demo-review-b.md` | none | existing textarea contrast probe and broader shared/public-access review remain separate | Edition/Working Draft and permission guards, asset credential boundary, archived landmark, route matrix, axe, reduced motion, and no unintended mutation pass | accepted pending human |
| `fff22eb` | `demos-public` | A — visual/interaction | `accept` | `docs/ui/147-interactive-demo-public-review-a.md` | none | embed restraint and shared public-access family remain separate | published context, stage dominance, narrow composition, Version selection, Scene playback, and no overflow pass | accepted pending human |
| `fff22eb` | `demos-public` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-interactive-demo-public-review-b.md` | none | browser zoom control limitation recorded; missing/broken media remains renderer coverage | access/error states, no authoring leakage, immutable/public-link boundary, axe 0/0, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `953a7fa` | `guides-public` | A — visual/interaction | `accept` | `docs/ui/147-guide-public-review-a.md` | none | empty-link fixture and shared public-access family remain separate | published context, block measure, media framing, empty state, embed restraint, narrow composition, and no overflow pass | accepted pending human |
| `953a7fa` | `guides-public` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-guide-public-review-b.md` | none | no seeded public empty-link route; component media fallback coverage retained | Publication/Revision/access/embed boundary, no authoring leakage, media fallback, axe 0/0, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `aefb9dd` | `projects-workspace` | A — visual/interaction | `accept` | `docs/ui/147-projects-workspace-review-a.md` | none | shared portal navigation clipping retained for shell-family work | Project identity/meta hierarchy, filter grouping, create-form prominence, narrow reflow, no overflow, and card action continuity pass | accepted pending human |
| `aefb9dd` | `projects-workspace` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-projects-workspace-review-b.md` | none | browser zoom limitation and existing textarea contrast probe retained; no domain/API changes | role/tenant/link/mutation boundary, active/archived/create/error states, keyboard focus, axe 0 violations, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `3a8fad4` | `projects-workspace` | A — follow-up visual/interaction | `accept` | `docs/ui/147-projects-denied-review-a.md` | none | no blocking finding; browser zoom remains separate | denied-state h1 and recovery hierarchy; desktop/narrow screenshots; axe 0/0; no overflow | accepted pending human |
| `3a8fad4` | `projects-workspace` | B — follow-up product/a11y/engineering QA | `accept` | `docs/ui/147-projects-denied-review-b.md` | none | authenticated browser fixtures and zoom remain separate; no API/domain changes | denied-state test; Project list + shell 20/20; full web 95/498; typecheck/lint/build; axe 0/0; safe next URL preserved | accepted pending human |
| `aa6f892` | `projects-workspace` | A — state-semantics follow-up visual/interaction | `accept` | `docs/ui/147-projects-state-semantics-review-a.md` | none | loading browser screenshot unavailable; zoom remains separate | ProjectListPage 17/17; desktop/narrow error screenshots; axe 0/0; no overflow; Retry hierarchy and loaded-state parity reviewed | accepted pending human |
| `aa6f892` | `projects-workspace` | B — state-semantics follow-up product/a11y/engineering QA | `accept` | `docs/ui/147-projects-state-semantics-review-b.md` | none | authenticated fixtures, loading browser delay, zoom, P2-001, and broader matrix remain separate; no API/domain changes | ProjectListPage 17/17; App 20/20; shell 4/4; full web 95/498; typecheck/lint/build; token check 130/123; status/alert semantics; desktop/narrow axe 0/0 | accepted pending human |
| `ce1d373` + `b159eed` | `internal-library-state-semantics` | A — visual/interaction | `accept` | `docs/ui/147-internal-library-state-semantics-review-a.md` | none | loading and denied/not-found browser captures remain component-test evidence; zoom, P2-001, workspace route ownership, and broader matrix remain separate | four list owners 34/34; full web 95/507; authenticated 1440px error screenshots; Documentation 390px reduced-motion/keyboard; axe 0/0; typecheck/lint/build/token check/diff pass | accepted pending human |
| `ce1d373` + `b159eed` | `internal-library-state-semantics` | B — product/a11y/engineering QA | `accept` | `docs/ui/147-internal-library-state-semantics-review-b.md` | none | no API/domain/permission/tenant/immutability/public-link changes; loading-delay and route-family limitations remain explicit | TDD red/green; App 20/20; full web 95/507; exact route error injection; axe 0/0; narrow reduced-motion Tab/overflow check; typecheck/lint/build/token check/diff pass | accepted pending human |
| `e94d6a9` | `projects-workspace` | A — workspace state follow-up visual/interaction | `incomplete` | `docs/ui/147-project-workspace-state-semantics-review-a.md` | route mismatch: `/projects/:projectId` is still owned by `LegacyProjectRedirect`; no runtime candidate screenshot or axe result is claimed | component state hierarchy and focused 9/9 pass; actual route measured 1440px with no overflow but rendered the legacy fallback and axe 1 missing-h1 violation | needs human surface |
| `e94d6a9` | `projects-workspace` | B — workspace state follow-up product/a11y/engineering QA | `needs_human_surface` | `docs/ui/147-project-workspace-state-semantics-review-b.md` | route ownership is a product/navigation decision outside this final bounded cycle | component 9/9 and adjacent 21/21; no API/domain/permission/tenant/immutability changes; no truthful runtime candidate evidence | needs human surface |
| `0d11790` | `documentation-admin` | A — visual/interaction | `accept` | `docs/ui/147-documentation-admin-review-a.md` | none | shared portal navigation clipping retained for shell-family work | administration hierarchy, metric grouping, policy form density, alert prominence, narrow reflow, and no overflow pass | accepted pending human |
| `0d11790` | `documentation-admin` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-admin-review-b.md` | none | browser zoom limitation and broader Site library/editor family remain separate | owner-only mutation boundary, over-limit truth, viewer guard, single main, axe 0, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `106705c` | `extension-capture` | A — visual/interaction | `accept` | `docs/ui/147-extension-capture-review-a.md` | none | installed toolbar action blocked for this run | compact context/action hierarchy, Project Version identity, recovery restraint, 360px/180px wrapping, and popup scope pass | blocked local for run |
| `106705c` | `extension-capture` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-extension-capture-review-b.md` | none | installed toolbar/permission path `blocked_local_for_run`; 180px contrast probe incomplete | Capture contracts, permission/privacy boundary, local recovery, named actions, axe 0 violations, reduced motion, tests/typecheck/lint/build pass | blocked local for run |
| `c4141a1` | `organization-admin` | A — visual/interaction | `accept` | `docs/ui/147-organization-admin-review-a.md` | none | shared shell remains separate; no pre-change compliance desktop screenshot | administration hierarchy, invite/member/pending-invite framing, bounded compliance evidence, narrow composition, and no blocking visual finding | accepted pending human |
| `c4141a1` | `organization-admin` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-organization-admin-review-b.md` | none | browser zoom control limitation; one incomplete metric contrast-background probe; no pre-change compliance desktop screenshot | owner-only mutation boundary, viewer denial, retained evidence/privacy boundary, axe 0 violations, reduced motion, focused 13/13, full 492/492, typecheck/lint/build/diff pass | accepted pending human |
| `c93ca11` | `project-versions` | A — visual/interaction | `accept` | `docs/ui/147-project-versions-review-a.md` | none | shared shell remains separate | Project Version identity, lifecycle grouping, management density, workspace metadata/cards, active/non-default/archived states, narrow context wrapping, and no blocking visual finding | accepted pending human |
| `c93ca11` | `project-versions` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-project-versions-review-b.md` | none | browser zoom limitation; existing settings textarea probe; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | owner/viewer boundary, Default/archive invariants, former-slug/Carry Forward semantics, axe 0 violations, reduced motion, focused 12/12, full 493/493, typecheck/lint/build pass | accepted pending human |
| `f4a6010` | `capture-portal` | A — visual/interaction | `accept` | `docs/ui/147-capture-portal-review-a.md` | none | shared shell remains separate; populated Event/Asset browser records unavailable and were not fabricated | Capture Session/list/detail hierarchy, status/source framing, create form, empty states, narrow reflow, target no-overflow, and no blocking visual finding | accepted pending human |
| `f4a6010` | `capture-portal` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-capture-portal-review-b.md` | none | browser zoom limitation; one incomplete open-create-form contrast-background probe; pre-restart Vite HMR error history resolved by dedicated web-runner restart; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | owner/viewer controls, Capture/Event/Asset and immutability boundary, named regions, axe 0 violations, reduced motion, focused 58/58, full 494/494, lint/build pass | accepted pending human |
| `ae217d0` | `guides-internal` | A — visual/interaction | `accept` | `docs/ui/147-guides-internal-review-a.md` | none | shared shell remains separate; browser media limitation retained for synthetic asset requests | Guide library/editor/preview hierarchy, 390px editor density, preview readability, Revision history framing, no-overflow, and no blocking visual finding | accepted pending human |
| `ae217d0` | `guides-internal` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-guides-internal-review-b.md` | none | active fixture media blocked by existing dev CSP/API-origin setup; two editor incomplete contrast probes; browser zoom limitation; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | owner/viewer/editor boundary, draft/archive/immutable Revision semantics, preview contrast, named regions, axe, reduced motion, focused 19/19, full 495/495, check-types/lint/build pass | accepted pending human |
| `f27714b` | `entry-onboarding` | A — visual/interaction | `accept` | `docs/ui/147-entry-onboarding-review-a.md` | none | browser zoom controls remain environment-limited; setup-ready and loaded-invite states are component-test coverage | entry hierarchy, login form, setup/invite state framing, 680px standard card, 390px reflow, and no blocking visual finding | accepted pending human |
| `f27714b` | `entry-onboarding` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-entry-onboarding-review-b.md` | none | setup-ready and loaded-invite browser fixtures unavailable without additional local state; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | public-entry truth, no auth/setup/invite contract changes, keyboard, reduced motion, axe 0/0, focused 22/22, full 495/495, check-types/lint/build pass | accepted pending human |
| `8e38ee4` | `public-access` | A — visual/interaction | `accept` | `docs/ui/147-public-access-review-a.md` | none | multi-entry browser fixture unavailable; Demo/Documentation valid populated slugs unavailable in current seed | Project Version context chip, multi-entry selector hierarchy, narrow reflow, cross-reader consistency, and no blocking visual finding | accepted pending human |
| `8e38ee4` | `public-access` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-public-access-review-b.md` | none | multi-entry browser fixture and populated Demo/Documentation routes unavailable; browser zoom limitation; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | Project Version/public-link semantics, access boundary, selector keyboard naming, axe 0/0, reduced motion, focused 16/16, full 496/496, check-types/lint/build pass | accepted pending human |
| `1058dbd` | `extension-installation` | A — visual/interaction | `accept` | `docs/ui/147-extension-installation-review-a.md` | none | installed toolbar/permission path unavailable; shared portal shell and browser zoom remain separate | installation workspace hierarchy, download prominence, install/connect/update grouping, narrow reflow, target no-overflow, and no blocking visual finding | accepted pending human |
| `1058dbd` | `extension-installation` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-extension-installation-review-b.md` | none | installed toolbar/permission path unavailable and remains blocked under extension-capture; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | auth/download contract, no browser mutation, named workspace, keyboard, reduced motion, axe 0/0, focused 22/22, full 496/496, check-types/lint/build pass | accepted pending human |
| `7cf7057` | `design-system-gallery` | A — visual/interaction | `accept` | `docs/ui/147-design-system-gallery-review-a.md` | none | synthetic/local-only gallery; browser zoom and P2-010 remain separate | shared state matrix, library/workbench/reader hierarchy, responsive table, long-label wrapping, no overflow, and no blocking visual finding | accepted pending human |
| `7cf7057` | `design-system-gallery` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-design-system-gallery-review-b.md` | none | no production route/API/domain changes; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | synthetic truth, named main/regions, focusable table, axe 0/0, reduced motion, focused 21/21, web check-types/lint/build pass | accepted pending human |
| `de37b5e` | `global-fallback` | A — visual/interaction | `accept` | `docs/ui/147-global-fallback-review-a.md` | none | forced lazy-load shell failure remains separate; browser zoom remains separate | Page-not-found hierarchy, recovery action clarity, narrow composition, no overflow, and no blocking visual finding | accepted pending human |
| `de37b5e` | `global-fallback` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-global-fallback-review-b.md` | none | Documentation failure boundary remains existing coverage; P2-010 is resolved in `59fd07f`; broader raw CSS cleanup remains separate | route truth, safe recovery links, level-one heading, named main, axe 0/0, reduced motion, focused 1/1, web check-types/lint/build pass | accepted pending human |
| `ae37ba6` | `contributor-docs` | A — visual/interaction | `accept` | `docs/ui/147-contributor-docs-review-a.md` | none | external source links not followed; browser zoom remains separate | contributor landing hierarchy, evidence figure clarity, narrow stacking, image loading, no overflow, and no blocking visual finding | accepted pending human |
| `ae37ba6` | `contributor-docs` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-contributor-docs-review-b.md` | none | docs app remains separate from customer Documentation; external links not followed | source-of-truth boundary, semantic figure, axe 0/0, reduced motion, focused 10/10, docs typecheck/lint/build pass | accepted pending human |


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

Current capability reconciliation: several historical candidate rows below
retain the browser-zoom limitation that was true when those runs occurred.
The runner now supports native Chrome Page zoom through
`chrome://settings/appearance`; the 2026-08-07 `native-zoom-hardening` rows are
the authoritative current proof. They cover the Documentation reader,
Documentation operation, Interactive Demo reader/embed/access states, and
direct extension popup only; they do not rewrite older candidate evidence or
close the complete cross-product matrix.

| Surface | Route/state/viewport | Fixture | Browser/environment | Before | Candidate | Approved baseline | A11y | Keyboard/zoom/motion | Console/network | Intentional differences | Commit/date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `documentation-previews` | authenticated Publication 1 / desktop 1280px | synthetic Plan 125 fixture; Publication 1 → Revision 1 | agent-browser / Chromium; runner API 3022/web 3020 | route previously fell to generic portal fallback | implementation renders exact Publication/Revision identity and frozen pages; `docs/ui/147-publication-preview-after.png` | no | keyboard Tab reached Projects; reduced-motion media set; narrow overflow check `scrollWidth=clientWidth` | browser errors empty; authenticated calls succeeded; no failed requests observed | internal preview stays authenticated and does not use public link URL | `001df10` / 2026-08-06 |
| `documentation-previews` | authenticated Publication 1 / narrow 390×844 | synthetic Plan 125 fixture; Publication 1 → Revision 1 | agent-browser / Chromium | route previously fell to generic portal fallback | content and identity remain present at narrow width; `docs/ui/147-publication-preview-narrow.png`; page scroll width equals viewport width | no | reduced-motion media set; keyboard path exercised | no browser errors recorded | portal navigation remains a shared shell concern outside P1-001 | `001df10` / 2026-08-06 |
| `documentation-previews` | anonymous internal Publication 1 | same synthetic local route | separate agent-browser session | no internal route branch | explicit `Sign in to view this Project Version.` gate | no | not applicable | no browser errors recorded | internal route did not leak Publication metadata to anonymous user | `001df10` / 2026-08-06 |
| `token-foundation` | authenticated `/__design-system` / desktop 1280px | synthetic design-system gallery; no auth data or customer content | agent-browser / Chromium; runner web 3020 | partial duplicated tokens and undefined consumers | shared computed tokens resolve (`space2=8px`, `background=#f7f8fb`, border alias resolves); axe 0 violations / 36 passes; `docs/ui/147-token-foundation-desktop.png` | no | keyboard reached New capture; reduced-motion enabled for final pass | browser errors empty; console only Vite/React development notices and a transient runner reconnect during HMR | no visual baseline approved; gallery remains a synthetic pattern surface | `105fc5b` / 2026-08-06 |
| `token-foundation` | authenticated `/__design-system` / narrow 390×844 | same synthetic design-system gallery | agent-browser / Chromium | long copy clipped in narrow gallery and one h5 heading skipped level | heading is h4; descriptive copy intrinsic width is 354px; document width equals viewport; axe 0 violations / 37 passes; `docs/ui/147-token-foundation-narrow.png` | no | reduced-motion enabled; keyboard path exercised; axe incomplete contrast check is limited to text partially obscured by intentional horizontal table scroll | browser errors empty; no failed requests after runner restart | table remains an intentional horizontal-scroll pattern at narrow width | `105fc5b` / 2026-08-06 |
| `token-foundation` | extension popup root / 360px normal | deterministic unconfigured extension state; no credentials | agent-browser / Chromium served by local extension Vite 3030 | browser toolbar install unavailable in this environment | Connect instance state renders with shared token CSS; axe 0 violations / 27 passes; `docs/ui/147-token-extension.png` | no | semantic form labels; actual browser toolbar path unavailable and not claimed | browser errors empty | local Vite popup preview is evidence of app rendering, not installed-extension toolbar evidence | `105fc5b` / 2026-08-06 |
| `token-foundation` | follow-up `/__design-system` / desktop 1440×900 | same synthetic gallery; alias values verified in computed root style | agent-browser / Chromium; runner web 3020 | existing token-foundation candidate evidence | aliases resolve to link `#1d4ed8`, font size `14px`, radius `8px`; 1,373px body, one main, no overflow, axe 0/0; `docs/ui/147-token-foundation-followup-desktop.png` | no | reduced-motion enabled; no visual difference from prior candidate | no browser errors or failed requests recorded | aliases only close fallback consumers; no rendered style change intended | `59fd07f` / 2026-08-06 |
| `token-foundation` | follow-up `/__design-system` / narrow 390×900 | same synthetic gallery; alias values verified in computed root style | agent-browser / Chromium; runner web 3020 | existing token-foundation candidate evidence | 2,955px body, one main, five regions, no page overflow, axe 0/0; `docs/ui/147-token-foundation-followup-narrow.png` | no | reduced-motion enabled; no visual difference from prior candidate | no browser errors or failed requests recorded | narrow table behavior belongs to the already accepted gallery candidate; token follow-up adds no layout change | `59fd07f` / 2026-08-06 |
| `token-foundation` | repository token contract / local verification | live Documentation reader/editor consumers and canonical `packages/ui/src/tokens.css` | Vitest / Node; local CSS checker | four undefined aliases reported by P2-010 | token contract 4/4; `pnpm check-css-tokens` passes with 127 definitions / 122 consumers | no | extension 140/140; UI 8/8; extension typecheck/lint/build pass | no browser/network state involved | fallback values are preserved through semantic aliases rather than consumer rewrites | `59fd07f` / 2026-08-06 |
| `shared-foundation` | local `/__design-system` / desktop 1440×900 | synthetic gallery; no auth state, customer data, private API calls, or extension credentials | agent-browser / Chromium; runner web 3020 | parent commit `24b2395` baseline: five regions, seven controls | candidate `9e53e20`: ten regions, sixteen controls; no overflow; `docs/ui/147-shared-primitives-candidate-desktop.png` | no | axe 0 violations / 0 incomplete; reduced-motion enabled; keyboard reached the table region and primary action | browser errors empty; console only Vite/React development notices; local requests succeeded | gallery additions are synthetic pattern specimens; no production route or product semantics changed | `9e53e20` / 2026-08-06 |
| `shared-foundation` | local `/__design-system` / narrow 390×900 | same synthetic gallery | agent-browser / Chromium; runner web 3020 | parent commit `24b2395` baseline: five regions, seven controls | candidate `9e53e20`: ten regions, sixteen controls; body width equals viewport; `docs/ui/147-shared-primitives-candidate-narrow.png` | no | axe 0 violations / 0 incomplete; reduced-motion enabled; long labels wrap and workbench recomposes | browser errors empty; no failed local requests recorded | narrow composition is a gallery specimen; installed toolbar and 200% browser zoom remain separate limitations | `9e53e20` / 2026-08-06 |
| `shared-foundation` | shared primitives / repository contract | `@repo/ui` tests and five-module dead-CSS audit | Vitest / Node; local type/lint/build/check scripts | generic primitive classes and five orphan declaration pairs identified by focused failing tests/audit | UI 11/11; focused web 45/45; full web 94/497; extension 19/140; web/extension typecheck/lint/build; `pnpm check-css-tokens` 130/123; diff check pass | no | semantic token mappings and typed warning Alert verified; no API/domain/permission/tenant/immutability/public-link changes | no browser/network state involved | only proven orphan `.page`/`.main` rules were removed; remaining raw CSS is out of scope | `9e53e20` / 2026-08-06 |
| `shared-shell-mobile` | `/projects` portal shell / desktop 1440×900 | truthful local unauthenticated route; no customer data or private credentials | agent-browser / Chromium; runner web 3020 | portal nav 199px, body/document 1440px, no overflow; `docs/ui/147-shared-shell-before-desktop.png` | portal nav 199px, body/document 1440px, no overflow; `docs/ui/147-shared-shell-after-desktop.png` | no | focused portal-nav axe 0/0; reduced-motion enabled; keyboard path unchanged | local requests returned 200/304; console only Vite/React development notices; full page retains pre-existing missing-h1 axe finding | desktop two-column shell intentionally unchanged | `8b45a4b` / 2026-08-06 |
| `shared-shell-mobile` | `/projects` portal shell / narrow 390×900 | same truthful local route | agent-browser / Chromium; runner web 3020 | portal nav 837px inside 390px body and visible label clipping; `docs/ui/147-shared-shell-before-narrow.png` | portal nav 362px with scroll width 362px, all labels visible in two columns, body/document 390px; `docs/ui/147-shared-shell-after-narrow.png` | no | focused portal-nav axe 0/0; reduced-motion enabled; Tab reached nav links; no page overflow | no failed candidate requests or page errors recorded; console only development notices | nav height increases intentionally to preserve labels; actual browser zoom unavailable | `8b45a4b` / 2026-08-06 |
| `shared-shell-mobile` | `/projects` portal shell / stress narrow 320×900 | same truthful local route | agent-browser / Chromium; runner web 3020 | prior narrow rail pattern was expected to clip labels | portal nav 292px with scroll width 292px, one-column labels, body/document 320px; `docs/ui/147-shared-shell-after-320.png` | no | focused portal-nav axe 0/0; reduced-motion enabled; all five destinations visible and keyboard reachable | no failed candidate requests or page errors recorded | one-column layout is the intentional 320px recomposition; no 200% browser claim | `8b45a4b` / 2026-08-06 |
| `projects-workspace` | unauthenticated `/projects` denied state / desktop 1440×900 | truthful local unauthenticated response; no Project data or credentials | agent-browser / Chromium; runner web 3020 | body/document 1440px, nine controls, no h1, full-page axe 1 moderate `page-has-heading-one`; `docs/ui/147-projects-denied-before-desktop.png` | body/document 1440px, nine controls, level-one `Projects` heading, full-page axe 0/0; `docs/ui/147-projects-denied-after-desktop.png` | no | reduced-motion enabled; existing sign-in link remains keyboard reachable; no failed candidate requests | console only Vite/React development notices; sign-in target not followed | denied state gains semantic hierarchy without changing recovery copy or URL | `3a8fad4` / 2026-08-06 |
| `projects-workspace` | unauthenticated `/projects` denied state / narrow 390×900 | same truthful local response | agent-browser / Chromium; runner web 3020 | body/document 390px, nine controls, no h1, full-page axe 1 moderate `page-has-heading-one`; `docs/ui/147-projects-denied-before-narrow.png` | body/document 390px, nine controls, level-one `Projects` heading, full-page axe 0/0; `docs/ui/147-projects-denied-after-narrow.png` | no | reduced-motion enabled; shell nav and sign-in link remain reachable; no page overflow | no failed candidate requests or page errors recorded | heading remains bounded inside the existing recovery card; authenticated fixture/zoom remain separate | `3a8fad4` / 2026-08-06 |
| `projects-workspace` | recoverable error `/projects` / desktop 1440×1000 | truthful local response with only a locally aborted Project request; no Project data or credentials | agent-browser / Chromium; runner web 3020/API 3022 | existing error branch was text plus Retry without a level-one heading or alert role; no before screenshot captured | one `Projects` h1, alert message, visible Retry, body/document 1440px; axe 0/0; `docs/ui/147-projects-state-error-after-desktop.png` | no | reduced-motion enabled; Retry receives focus; no page overflow | induced local API abort intentionally produced the error state; console only Vite/React development notices; route removed after evidence | error copy, retry behavior, and API boundary remain unchanged | `aa6f892` / 2026-08-06 |
| `projects-workspace` | recoverable error `/projects` / narrow 390×900 | same truthful local response | agent-browser / Chromium; runner web 3020/API 3022 | existing error branch was text plus Retry without a level-one heading or alert role; no before screenshot captured | one `Projects` h1, alert message, visible Retry, body/document 390px; axe 0/0; `docs/ui/147-projects-state-error-after-narrow.png` | no | reduced-motion enabled; Retry receives focus; no page overflow | induced local API abort intentionally produced the error state; no candidate page errors recorded; route removed after evidence | narrow composition reflows inside the viewport without changing error/retry semantics | `aa6f892` / 2026-08-06 |
| `projects-workspace` | loading and recoverable-error component contracts | deterministic ProjectListPage tests with synthetic loader promises/rejections | Vitest / Testing Library; local synthetic responses | loading was text-only; recoverable error lacked a named heading and alert semantics | loading has `Projects` h1 + `role=status`; error has `Projects` h1 + `role=alert` + existing Retry; ProjectListPage 17/17 | no | focused loading/error assertions pass; browser delay unavailable in this runner and no loading screenshot is claimed | no browser/network state involved | only render semantics changed; loader, retry, auth, tenant, and Project contracts remain unchanged | `aa6f892` / 2026-08-06 |
| `projects-workspace` | workspace transient-state component contracts | synthetic `ProjectWorkspacePage` loader/rejection fixtures; loading, unauthenticated, not-found, generic error | Vitest / Testing Library; local synthetic responses | branches had no page-level `Projects` h1; loading/error had no status/alert semantics | `ProjectWorkspacePage` 9/9; loading has `Projects` h1 + `role=status`; error has `Projects` h1 + `role=alert`; existing sign-in and Retry contracts remain | no | component-only evidence; no browser delay or candidate screenshot is claimed | no browser/network state involved | candidate is source/test-reachable but not mounted by the normal App route; no API/domain/permission/tenant/immutability changes | `e94d6a9` / 2026-08-07 |
| `projects-workspace` | actual `/projects/:projectId` route ownership / desktop 1440×1000 | local unauthenticated `project_1`; no Project data or credentials | agent-browser / Chromium; runner API 3022/web 3020 | route is owned by `LegacyProjectRedirect`; API returned 401 and fallback rendered plain `Project was not found.` with no h1 | candidate `ProjectWorkspacePage` was not rendered; document/body width 1440px, no overflow; axe 1 moderate `page-has-heading-one` violation on the existing fallback | no | route request returned 200; Project API returned 401; console only Vite/React development notices | no candidate browser evidence; no screenshot committed | replacing or wrapping the legacy route is a human route-ownership decision and remains outside this final state-semantics cycle | `e94d6a9` / 2026-08-07 |
| `documentation-authoring` | authenticated Site / desktop 1440×900 | synthetic Plan 125 admin; active Edition, 2 Pages, Working Draft v13 | agent-browser / Chromium; runner API 3022/web 3020 | 4,743px high, 136 interactive controls, all panels continuous; `docs/ui/147-documentation-authoring-before.png` | Author task default with navigator/canvas/inspector/status; 1,269px high, 50 visible interactive controls; `docs/ui/147-documentation-authoring-after-desktop.png` | no | axe 0 violations / 0 incomplete; reduced-motion and keyboard path rechecked | browser errors empty; task child requests succeeded; no failed candidate requests | all existing capabilities moved behind named task tabs; Page blocks remain on the dedicated Page route | `8055143` / 2026-08-06 |
| `documentation-authoring` | authenticated Site / narrow 390×844 | same synthetic admin fixture | agent-browser / Chromium | 6,845px high, 136 interactive controls, page width 390; `docs/ui/147-documentation-authoring-before-narrow.png` | Author task 2,613px high, 50 visible interactive controls, page width 390; `docs/ui/147-documentation-authoring-after-narrow.png` | no | axe 0 violations / 0 incomplete; ArrowRight/Enter switches tasks; reduced-motion enabled | browser errors empty; no failed candidate requests | task row has intentional bounded horizontal scroll; no page overflow | `8055143` / 2026-08-06 |
| `documentation-authoring` | authenticated Site / 200% zoom/reflow probe | same synthetic admin fixture | agent-browser / Chromium | continuous route had no bounded task ownership | `documentElement.style.zoom=2` probe retained `scrollWidth=390`, `bodyScrollWidth=390`, and no page overflow; `docs/ui/147-documentation-authoring-zoom.png` | no | keyboard/selected task state retained before probe | no browser errors recorded | probe is supplemental reflow evidence; browser zoom control itself is environment-limited | `8055143` / 2026-08-06 |
| `documentation-authoring` | dedicated Page canvas smoke / narrow 390×844 | synthetic Page `Install`; active editor with comments and typed blocks | agent-browser / Chromium | route unchanged | Page editor rendered title, metadata, blocks, assets, comments, Save Page, and dedicated Page status; axe 0 violations with 1 existing incomplete textarea contrast probe | no | Page smoke only; no Page editor code changed | browser errors empty; no failed candidate requests | Page route remains the content canvas and retains existing incomplete-probe limitation | `8055143` / 2026-08-06 |
| `documentation-public` | anonymous valid Publication / desktop 1440×900 | synthetic Plan 125 public Publication; Install page, typed blocks, safe fixture asset | agent-browser / Chromium; runner API 3022/web 3020 | baseline exact reader, 12 interactive controls; `docs/ui/147-documentation-public-before-desktop.png` | public shell, navigation rail, search, breadcrumb, article measure, typed content, adjacent navigation; 1,123px document height, 13 interactive controls; `docs/ui/147-documentation-public-after-desktop.png` | no | axe 0 violations / 0 incomplete / 48 passes; reduced-motion set; valid route reload pass | browser errors empty; no failed target requests | Publication content, public identity, and link semantics remain unchanged; CSS/semantic reader composition only | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous valid Publication / narrow 390×844 | same synthetic public Publication | agent-browser / Chromium; runner API 3022/web 3020 | baseline exact reader, 12 interactive controls; `docs/ui/147-documentation-public-before-narrow.png` | drawer control replaces rail, article remains readable; 1,192px document height, 13 interactive controls; `docs/ui/147-documentation-public-after-narrow.png` | no | axe 0 violations / 0 incomplete / 48 passes; click and Enter drawer open/close; reduced-motion set | browser errors empty; page and body scroll widths 390px | navigation is intentionally a controlled drawer at narrow width | `0ea64b9` / 2026-08-06 |
| `documentation-public` | second clean unavailable-state pass / tablet 1024×768 and mobile 390×844 CSS zoom probe | local `/docs/plan132-public/install-guide`; current disposable fixture truthfully has no resolved public Documentation snapshot | agent-browser / Chromium; runner API 3022/web 3020 | prior candidate valid-reader evidence | tablet screenshot shows `Documentation unavailable`; tablet and mobile body/document widths equal viewport; `docs/ui/147-hardening-documentation-unavailable-tablet-1024.png` | no | axe 0/0 at tablet and mobile; reduced-motion enabled; CSS zoom probe retained 390px width; no browser errors | unavailable state remained non-revealing and asset/search requests were not fabricated | no valid-reader claim is made on this current runner pass; prior candidate valid-route evidence remains authoritative | `3397152` / 2026-08-07 |
| `documentation-public` | anonymous valid Publication / 200% reflow | same synthetic public Publication | agent-browser / Chromium | no bounded reader composition | `documentElement.scrollWidth=390` during zoom probe; reset restored body width 390px; `docs/ui/147-documentation-public-zoom.png` | no | focused keyboard/zoom path retained; reduced-motion media matched | no browser errors recorded | CSS zoom is a supplemental reflow probe; browser zoom controls are environment-limited | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous API operation / narrow 390×844 | synthetic GET and unsupported POST operation descriptors | agent-browser / Chromium; runner API 3022/web 3020 | inert request examples, Copy/Download, and unavailable Try It baseline | h1→h2→h3 example hierarchy; operation bounded to 390px; unavailable Try It message remained truthful; `docs/ui/147-documentation-public-operation-after.png` | no | axe 0 violations / 0 incomplete; no `api.example.com` target request executed | browser errors empty; target request count 0 | examples remain placeholders; action never changes credential or target-request policy | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous search and route variants | synthetic public Publication; alias, redirect, gone, unsupported operation | agent-browser / Chromium; runner API 3022/web 3020 | alias/redirect/gone and search contracts unchanged | `API` search returned 2 results; alias canonicalized, setup redirected, obsolete stayed generic unavailable; unsupported POST remained inert | no | valid/operation axe 0 violations; keyboard drawer/search exercised | browser errors empty; no failed requests observed | no internal IDs, credentials, or private metadata exposed | `0ea64b9` / 2026-08-06 |
| `demos-internal` | authenticated active editor / desktop 1440×900 | synthetic Plan 128 admin; 12 Scenes, Capture assets, Working Draft | agent-browser / Chromium; runner API 3022/web 3020 | 2,823px document height, 101 controls, permanent metadata/Publishing stack; `docs/ui/147-interactive-demo-before-desktop.png` | 2,141px document height, 101 controls, wider Stage, bounded Scene grid, collapsed Publishing & history; `docs/ui/147-interactive-demo-after-desktop.png` | no | axe 0 violations / 1 incomplete existing textarea contrast probe; image natural width 1 after authenticated hydration | pointer/keyboard geometry exercised; reduced-motion and active reload pass; no horizontal overflow | API requests all 200 including authenticated asset fetch; browser errors empty | Edition/Working Draft, Publication, and mutation contracts unchanged | `e97647e` / 2026-08-06 |
| `demos-internal` | authenticated active editor / narrow 390×844 | same synthetic Plan 128 admin fixture | agent-browser / Chromium | 4,683px document height, 101 controls, clipped horizontal Scene rail; `docs/ui/147-interactive-demo-before-narrow.png` | 3,011px document height, 101 controls, Scene rail client/scroll width 354px; `docs/ui/147-interactive-demo-after-narrow.png` | no | axe 0 violations / 1 incomplete existing textarea contrast probe; page and body scroll widths 390px | 200% CSS zoom retained no horizontal overflow; reduced-motion matched; disclosure collapsed by default | no browser errors or failed candidate requests observed | rail is an intentionally bounded local scroll region; page remains width-safe | `e97647e` / 2026-08-06 |
| `demos-internal` | empty, archived, viewer, protected/broken asset states | same synthetic Plan 128 fixture; admin and viewer sessions | agent-browser / Chromium; runner API 3022/web 3020 | empty/archived/viewer states remained existing behavior | empty shows `No scenes yet.`; archived/read-only has one top-level `main` and disabled publication mutation; viewer has no editor mutations; protected asset stays disabled; broken asset shows truthful fallback and hides controls | no | empty active axe 0/1 incomplete; archived/viewer axe 0/0; archived `mainCount=1`; focused tests cover guards | viewer, archived, broken/protected route checks completed; reload restored fixture state | no browser errors; no mutations persisted | shared permission/public-link semantics remain outside candidate | `e97647e` / 2026-08-06 |
| `demos-internal` | preview and Revision history | same synthetic Plan 128 fixture; Working Draft preview and immutable Revisions | agent-browser / Chromium; runner API 3022/web 3020 | routes were present but not composition-reviewed | preview renders hydrated Stage/Hotspot playback; Revision history shows immutable Revision entries and preview links | no | preview axe 0/0; Revision history axe 0/0 | keyboard route navigation and reduced-motion-compatible playback controls present | browser errors empty; no failed requests observed | no Publication/Revision identity or immutability changes | `e97647e` / 2026-08-06 |
| `demos-public` | anonymous valid reader / desktop 1440×900 | synthetic Plan 128 public Publish Link; active published Demo, two Scenes, safe fixture asset | agent-browser / Chromium; runner API 3022/web 3020 | plain shell, 1,372px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-before-desktop.png` | published context header, visible Version control, framed stage/playback region; 1,644px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-after-desktop.png` | no | axe 0 violations / 0 incomplete / 35 passes; valid reload and Scene playback | browser errors empty; document/API/asset requests returned 200; no target requests | public shell owns title while immutable renderer owns Scene playback; Capture asset and public URL contracts unchanged | `fff22eb` / 2026-08-06 |
| `demos-public` | anonymous valid reader / narrow 390×844 | same synthetic public Publish Link | agent-browser / Chromium; runner API 3022/web 3020 | plain shell, 844px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-before-narrow.png` | stacked published context/version control, framed stage, readable controls; 844px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-after-narrow.png` | no | axe 0 violations / 0 incomplete / 35 passes; page/body widths both 390px; reduced-motion enabled | browser errors empty; no page overflow | Version control moves below the identity block at narrow width; stage remains the dominant reader region | `fff22eb` / 2026-08-06 |
| `demos-public` | second clean unavailable-state pass / tablet 1024×768 and mobile 390×844 CSS zoom probe | local `plan128-public` route; current disposable fixture truthfully has no published Demo | agent-browser / Chromium; runner API 3022/web 3020 | prior candidate valid-reader evidence | tablet screenshot shows `Published demo was not found.`; tablet and mobile body/document widths equal viewport; `docs/ui/147-hardening-demo-unavailable-tablet-1024.png` | no | axe 0/0 at tablet and mobile; reduced-motion enabled; CSS zoom probe retained 390px width; no browser errors | unavailable state remained non-revealing; no asset or private metadata request | no populated Demo claim is made; valid-reader coverage remains in prior candidate evidence | `3397152` / 2026-08-07 |
| `demos-public` | anonymous embed / narrow 390×844 | same synthetic public Publish Link `/embed` | agent-browser / Chromium; runner API 3022/web 3020 | same public contract before candidate | restrained outer padding, one top-level `main`, 4 interactive controls, no authoring/admin controls | no | axe 0 violations / 0 incomplete; main count 1; reduced-motion enabled | browser errors empty; no failed local requests observed | embed stays a public playback frame and does not change access or canonical-link behavior | `fff22eb` / 2026-08-06 |
| `demos-public` | anonymous Version and Scene playback | active public Publish Link; explicit `main` Version plus Start→Finish Scene transition and Previous Scene | agent-browser / Chromium; runner API 3022/web 3020 | existing selector/playback behavior | Version selection reached `/d/plan128-public/versions/main`; Continue, Previous Scene, and Restart retained native keyboard/button semantics | no | route axe 0/0; snapshot shows one h1 and Scene h2; reduced-motion compatible | no browser errors; no mutation requests | exact public Version/Revision identity and immutable playback remain unchanged | `fff22eb` / 2026-08-06 |
| `demos-public` | password/access/unavailable states | synthetic password, restricted, expired, revoked, and unknown public links | agent-browser / Chromium; runner API 3022/web 3020 | existing truthful state contracts | Password required + invalid-password alert; restricted/expired/unavailable messages remain non-revealing and omit retry where not retryable | no | all checked states axe 0 violations / 0 incomplete; password form axe 0/0 | browser errors empty; no private metadata or target requests | no password, cookie, access, or public-link values recorded; revoked/unknown remain generic unavailable | `fff22eb` / 2026-08-06 |
| `guides-public` | anonymous valid reader / desktop 1440×900 | synthetic Plan 127 public Guide Publish Link; immutable Guide Revision with typed Step and safe fixture asset | agent-browser / Chromium; runner API 3022/web 3020 | sparse shell, 900px document height, 0 interactive controls; `docs/ui/147-guide-public-before-desktop.png` | published context, bounded block column, framed media and hierarchy; 1,142px document height, 0 interactive controls; `docs/ui/147-guide-public-after-desktop.png` | no | axe 0 violations / 0 incomplete / 27 passes; one top-level main; reduced-motion enabled | browser errors empty; public API and asset requests returned 200; no target requests | Guide Revision content and public Version context remain unchanged; shell owns identity and block frame | `953a7fa` / 2026-08-06 |
| `guides-public` | anonymous valid reader / narrow 390×844 | same synthetic public Guide Publish Link | agent-browser / Chromium; runner API 3022/web 3020 | sparse shell, 844px document height, 0 interactive controls; `docs/ui/147-guide-public-before-narrow.png` | stacked published context, bounded block frame, readable media; 844px document height, 0 interactive controls; `docs/ui/147-guide-public-after-narrow.png` | no | axe 0 violations / 0 incomplete / 27 passes; page/body widths both 390px; reduced-motion enabled | browser errors empty; no page overflow | public reader reflows vertically without changing content or access behavior | `953a7fa` / 2026-08-06 |
| `guides-public` | second clean reader pass / tablet 1024×768 | synthetic Plan 127 public Guide Publish Link; safe immutable fixture | agent-browser / Chromium; runner API 3022/web 3020 | prior candidate evidence | valid Guide rendered `Plan 127 active Guide`, one main, body/document width 1024px, 1,136px body height; `docs/ui/147-hardening-guide-tablet-1024.png` | no | reduced-motion enabled; axe 0 violations / 0 incomplete / 27 passes; no page overflow or browser errors | public API returned the valid synthetic Guide; no mutation or target request | tablet evidence supplements the existing desktop/narrow candidate; no content/access/Revision change | `3397152` / 2026-08-07 |
| `guides-public` | second clean reader pass / mobile 390×844 with CSS zoom probe | same synthetic Guide fixture | agent-browser / Chromium; runner API 3022/web 3020 | prior candidate evidence | body/document width 390px before and during `document.documentElement.style.zoom=2`; `docs/ui/147-hardening-guide-mobile-390.png` | no | axe 0 violations / 0 incomplete / 28 passes; reduced-motion enabled; no browser errors | CSS zoom is a supplemental reflow probe, not a real browser zoom claim | content remains bounded at the tested narrow viewport; real browser zoom control remains unavailable | `3397152` / 2026-08-07 |
| `guides-public` | anonymous embed / narrow 390×844 | same synthetic public Guide Publish Link `/embed` | agent-browser / Chromium; runner API 3022/web 3020 | same public contract before candidate | restrained outer padding, one top-level main with `Embedded published guide` name, no authoring controls | no | axe 0 violations / 0 incomplete; main count 1; reduced-motion enabled | browser errors empty; no failed local requests observed | embed accessible name and public-link behavior remain compatible with existing route tests | `953a7fa` / 2026-08-06 |
| `guides-public` | password/access/unavailable states | synthetic password, restricted, expired, revoked, and unknown public links | agent-browser / Chromium; runner API 3022/web 3020 | existing truthful state contracts | Password required + invalid-password alert; restricted/expired/unavailable messages remain non-revealing | no | all checked states axe 0 violations / 0 incomplete; password form axe 0/0 | browser errors empty; no private metadata or target requests | no password, cookie, access, or public-link values recorded; revoked/unknown remain generic unavailable | `953a7fa` / 2026-08-06 |
| `guides-public` | empty and broken/missing media component states | focused `PublicGuideReaderPage` fixtures; empty blocks and failed Capture asset | Vitest / Testing Library; synthetic response objects | existing markup had no explicit empty frame or media fallback | empty frame remains explicit; failed/missing Capture asset renders `Captured screenshot is unavailable.` and removes broken image | no | focused Guide reader suite 4/4; public-route assertions 3/3 | component failure path exercised; no browser fixture route exposes empty public Publication | no public-link or asset policy change; browser empty-link limitation remains recorded | `953a7fa` / 2026-08-06 |
| `project-versions` | authenticated owner settings / desktop 1440×900 | synthetic Plan 125 project with Main, Summer release, and Archived release Project Versions | agent-browser / Chromium; runner API 3022/web 3020 | 2,235px document height, 55 controls, one main, 0 axe violations / 1 existing textarea incomplete; `docs/ui/147-project-versions-before-settings-desktop.png` | 2,384px document height, 55 controls, one main, target content no overflow, 0 axe violations / 1 same existing textarea incomplete; `docs/ui/147-project-versions-after-settings-desktop.png` and scrolled management view `docs/ui/147-project-versions-after-settings-versions-desktop.png` | no | reduced-motion enabled; management region exposes Active and Archived headings | local Project/Version requests returned 200; browser errors empty | existing project Details/Membership surfaces and shared portal shell remain outside the candidate | `c93ca11` / 2026-08-06 |
| `project-versions` | authenticated owner settings / narrow 390×900 | same synthetic Project Version fixtures | agent-browser / Chromium; runner API 3022/web 3020 | 3,755px document height, 55 controls, one main, 0 axe violations / 1 existing textarea incomplete; `docs/ui/147-project-versions-before-settings-narrow.png` | 3,889px document height, 55 controls, one main, target content overflow 0, 0 axe violations / 1 same existing textarea incomplete; `docs/ui/147-project-versions-after-settings-narrow.png` | no | reduced-motion enabled; form/list controls remain reachable; browser zoom control is environment-limited | browser errors empty; no failed local requests observed | portal navigation remains a shared-shell scroll surface | `c93ca11` / 2026-08-06 |
| `project-versions` | authenticated owner Project Version workspace / desktop 1440×900 | Main default Project Version | agent-browser / Chromium; runner API 3022/web 3020 | 900px document height, 23 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-before-workspace-desktop.png` | 900px document height, 23 controls, one main, named workspace region, target overflow 0, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-after-workspace-desktop.png` | no | reduced-motion enabled; metadata and destination cards retain keyboard links | browser errors empty; Project/Version requests returned 200 | four destination cards remain links into existing Capture, Guide, Demo, and Carry Forward contracts | `c93ca11` / 2026-08-06 |
| `project-versions` | authenticated owner Project Version workspace / narrow 390×900 | Main default Project Version | agent-browser / Chromium; runner API 3022/web 3020 | 1,088px document height, 23 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-before-workspace-narrow.png` | 1,520px document height, 23 controls, one main, named workspace region, target overflow 0, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-after-workspace-narrow.png` | no | reduced-motion enabled; context identity stacks without splitting the Version name; selection control remains labeled | browser errors empty; selection and archived routes returned 200 | shared navigation still scrolls horizontally; Project Version content reflows vertically | `c93ca11` / 2026-08-06 |
| `project-versions` | active/non-default, archived, and viewer state checks / narrow 390×900 | Summer release, Archived release, and synthetic viewer session | agent-browser / Chromium; runner API 3022/web 3020 | existing route/state contracts | Summer release selection canonicalizes to `/versions/summer-release` and retains Carry Forward for owner; Archived release shows read-only status; viewer has no settings management or Carry Forward | no | each checked workspace route axe 0 violations / 0 incomplete; viewer settings axe 0/0 | browser errors empty; no unintended mutation requests | Default/archive, viewer, and former-slug semantics remain API-owned and unchanged | `c93ca11` / 2026-08-06 |
| `capture-portal` | authenticated owner Capture list / desktop 1440×900 | synthetic Plan 125 Capture Session list with canceled, capturing, and draft sessions | agent-browser / Chromium; runner API 3022/web 3020 | 900px document height, 23 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-capture-portal-before-list-desktop.png` | Project Version-scoped heading, named Capture sessions region, grouped create action, status/source badges, and separated metadata; 900px document height, 24 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-capture-portal-after-list-desktop.png` | no | reduced-motion enabled; owner list route and create affordance keyboard-reachable | post-restart local Project/Version/Capture requests returned 200; no new browser errors | removes raw Project ID copy from the heading while preserving existing Project Version context and capture routes | `f4a6010` / 2026-08-06 |
| `capture-portal` | authenticated owner Capture list / narrow 390×900 | same synthetic Capture Session list | agent-browser / Chromium; runner API 3022/web 3020 | 1,676px document height, 23 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-capture-portal-before-list-narrow.png` | stacked context/list cards, 1,676px document height, 24 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-capture-portal-after-list-narrow.png` | no | reduced-motion enabled; card links and create action remain reachable; shared-shell navigation is separate | no failed post-restart local requests | long fixture labels and metadata reflow vertically without changing list contents | `f4a6010` / 2026-08-06 |
| `capture-portal` | authenticated owner create form / narrow 390×900 | same synthetic owner; form opened without submission | agent-browser / Chromium; runner API 3022/web 3020 | existing create affordance/state | `Create capture session` region, first text input focused, form preserved, 2,047px document height, target overflow 0; `docs/ui/147-capture-portal-after-create-form-narrow.png` | no | axe 0 violations / 1 incomplete contrast-background probe over partially obscured textarea; keyboard opening/focus check passed | no mutation submitted; no failed local requests | only existing form presentation is changed; no Capture creation was performed for evidence | `f4a6010` / 2026-08-06 |
| `capture-portal` | authenticated owner canceled/capturing detail / desktop 1440×900 | synthetic canceled and capturing sessions; disposable fixture has no Event/Asset rows | agent-browser / Chromium; runner API 3022/web 3020 | 1,006px document height, 25 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-capture-portal-before-detail-desktop.png` and `docs/ui/147-capture-portal-before-detail-populated-desktop.png` | named Capture session workspace, identity/status header, metric grid, upload grouping, explicit empty Event/Asset states; 1,025px document height, 26 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-capture-portal-after-detail-desktop.png` and `docs/ui/147-capture-portal-after-detail-populated-desktop.png` | no | reduced-motion enabled; existing owner controls remain present; populated record visuals are not claimed | post-restart detail requests returned 200; no new browser errors | Events and Assets remain API/component-test-owned; no fake populated records were seeded | `f4a6010` / 2026-08-06 |
| `capture-portal` | authenticated owner canceled detail / narrow 390×900 | synthetic canceled Capture Session | agent-browser / Chromium; runner API 3022/web 3020 | existing detail contract | 2,021px document height, 26 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-capture-portal-after-detail-narrow.png` | no | reduced-motion enabled; detail controls and empty states reflow vertically | no failed post-restart local requests | Upload remains an owner affordance; no screenshot upload was performed | `f4a6010` / 2026-08-06 |
| `capture-portal` | authenticated viewer list/detail / desktop and narrow 390×900 | synthetic Plan 125 viewer session; read-only role | agent-browser / Chromium; runner API 3022/web 3020 | existing viewer state contract | list shows Read only and no New Capture Session; detail shows Read only and no Upload Screenshot/Create guide/Create interactive demo; list axe 0/0, detail axe 0/0, no target overflow | no | viewer list/detail each expose one named Capture workspace region and one main landmark | viewer Project/Version/Capture requests returned 200; no failed post-restart local requests | role guard and Capture read-only semantics remain unchanged | `f4a6010` / 2026-08-06 |
| `guides-internal` | authenticated owner Guide list / desktop 1440×900 | synthetic Plan 127 active, empty, archived Guide Editions in Summer release | agent-browser / Chromium; runner API 3022/web 3020 | 1,403px document height, 28 controls, one main, axe 0 violations / 1 incomplete fixture-description probe; `docs/ui/147-guides-internal-before-list-desktop.png` | Project Version-scoped heading, named Guides workspace, library count, grouped rows/actions; 1,090px document height, 28 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-guides-internal-after-list-desktop.png` | no | reduced-motion enabled in final keyboard pass; list links remain reachable | Guide list/publish-status requests returned 200; no new post-restart browser errors | removes raw Project ID copy while preserving Project Version context and exact Guide routes | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated owner Guide list / narrow 390×900 | same synthetic Guide Editions | agent-browser / Chromium; runner API 3022/web 3020 | 1,812px document height, 28 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-guides-internal-before-list-narrow.png` | 1,976px document height, 28 controls, one main, named Guides workspace, target overflow 0, axe 0/0; `docs/ui/147-guides-internal-after-list-narrow.png` | no | reduced-motion and Tab path checked; long row actions wrap within target content | no failed post-restart local requests | shared portal navigation remains a separate narrow shell concern | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated owner active Guide editor / desktop 1440×900 | synthetic active draft with 20 Guide blocks, source screenshot/annotation fixture, Revision/Publish Link states | agent-browser / Chromium; runner API 3022/web 3020 | 3,165px document height, 110 controls, one main, axe 0 violations / 1 incomplete with three contrast-background probes; `docs/ui/147-guides-internal-before-editor-desktop.png` | named Guide editor workspace, stronger outline/canvas/inspector framing; 3,098px, 110 controls, one main, target overflow 0, axe 0 violations / 1 same incomplete probe; `docs/ui/147-guides-internal-after-editor-desktop.png` | no | reduced-motion checked; existing block selection/save/upload/annotation/lifecycle controls remain reachable | owner requests returned 200; active fixture image source is blocked by existing dev CSP/API-origin setup, with component coverage retained | no Guide/Revision/Publication mutation was performed during evidence | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated owner active Guide editor / narrow 390×900 | same active Guide editor fixture | agent-browser / Chromium; runner API 3022/web 3020 | 5,217px document height, 110 controls, one main, target overflow 0, axe 0 violations / 1 incomplete with two textarea probes; `docs/ui/147-guides-internal-before-editor-narrow.png` | 5,091px, 110 controls, one main, named Guide editor workspace, target overflow 0, axe 0 violations / 1 same incomplete textarea probe; `docs/ui/147-guides-internal-after-editor-narrow.png` | no | reduced-motion enabled; Tab path reached portal controls; browser zoom controls are environment-limited | no failed post-restart API requests; fixture media limitation remains explicit | editor keeps the same selected block and inspector contract while stacking layout | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated owner Guide preview / desktop and narrow 1440×900, 390×900 | active draft preview with typed blocks and synthetic source asset | agent-browser / Chromium; runner API 3022/web 3020 | 2,582px desktop / 3,241px narrow, 29 controls, one main, one primary-link contrast violation, no overflow; `docs/ui/147-guides-internal-before-preview-desktop.png` and `docs/ui/147-guides-internal-before-preview-narrow.png` | named Guide preview workspace, bounded reading measure, framed callouts/media, corrected primary action contrast; 2,432px desktop / 3,042px narrow, 29 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-guides-internal-after-preview-desktop.png` and `docs/ui/147-guides-internal-after-preview-narrow.png` | no | reduced-motion enabled; no authoring mutation controls shown in preview | preview/detail and asset requests returned 200 where allowed; image source remains blocked by existing dev CSP/API-origin setup | exact Guide block order/content and Preview/Edit route semantics unchanged | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated owner/viewer immutable Revision history / desktop and narrow | two synthetic immutable Guide Revisions; owner and viewer role sessions | agent-browser / Chromium; runner API 3022/web 3020 | 900px desktop / 1,026px narrow, 27 controls, one main, axe 0/0; `docs/ui/147-guides-internal-before-revisions-desktop.png` and `docs/ui/147-guides-internal-before-revisions-narrow.png` | named Guide Revision history region, lifecycle-separated cards, 900px desktop / 1,138px narrow, 27 controls, target overflow 0, axe 0/0; `docs/ui/147-guides-internal-after-revisions-desktop.png` and `docs/ui/147-guides-internal-after-revisions-narrow.png` | no | owner Create checkpoint/Restore remain; viewer has neither; keyboard/reduced-motion checked | Revision/detail calls returned 200; no mutation submitted | immutable history and viewer read-only boundary remain API-owned | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated owner immutable Revision preview / desktop and narrow | synthetic Revision 1 with immutable Guide content | agent-browser / Chromium; runner API 3022/web 3020 | 900px desktop / narrow baseline not captured; 22 controls, one main, axe 0/0; `docs/ui/147-guides-internal-before-revision-preview-desktop.png` | named Guide Revision preview region, immutable notice/content, 900px desktop / 980px narrow, 22 controls, target overflow 0, axe 0/0; `docs/ui/147-guides-internal-after-revision-preview-desktop.png` and `docs/ui/147-guides-internal-after-revision-preview-narrow.png` | no | reduced-motion enabled; Back to Revision history remains reachable | Revision and asset requests returned 200 where allowed; no mutation requests | immutable content, Revision number, and history route remain unchanged | `ae217d0` / 2026-08-06 |
| `guides-internal` | authenticated viewer active Guide / narrow 390×900 | synthetic viewer role with active Guide and Revision history | agent-browser / Chromium; runner API 3022/web 3020 | existing viewer route contract | Guide detail renders preview with Read only and no Edit/Publish mutation; Revision history has no Create checkpoint or Restore; axe 0/0, target overflow 0, named preview/history regions | no | reduced-motion and viewer route checks passed | viewer Guide/Revision calls returned 200; no mutation requests | viewer role remains read-only and never exposes authoring controls | `ae217d0` / 2026-08-06 |
| `entry-onboarding` | public login / desktop 1440×900 and narrow 390×900 | local synthetic instance; no credentials recorded | agent-browser / Chromium; runner web 3020 | 900px body, one main, 4 controls, no overflow, axe 0/0 at both viewports; `docs/ui/147-entry-onboarding-before-login-desktop.png` and `docs/ui/147-entry-onboarding-before-login-narrow.png` | named `Entry workspace`, same 900px body/4 controls, target overflow 0, axe 0/0; `docs/ui/147-entry-onboarding-after-login-desktop.png` and `docs/ui/147-entry-onboarding-after-login-narrow.png` | no | reduced-motion matched; Tab reached brand, email, password, submit, then body | no new post-change browser errors reported; no form submitted | shell gains an accessible main name and tokenized spacing; login/API/navigation behavior unchanged | `f27714b` / 2026-08-06 |
| `entry-onboarding` | public setup / desktop 1440×900 and narrow 390×900 | local synthetic instance reports setup already complete | agent-browser / Chromium; runner API 3022/web 3020 | 900px body, one main, 2 controls, no overflow, axe 0/0 at both viewports; `docs/ui/147-entry-onboarding-before-setup-desktop.png` and `docs/ui/147-entry-onboarding-before-setup-narrow.png` | named `Entry workspace`, same 900px body/2 controls, target overflow 0, axe 0/0; `docs/ui/147-entry-onboarding-after-setup-desktop.png` and `docs/ui/147-entry-onboarding-after-setup-narrow.png` | no | reduced-motion matched; sign-in link remains keyboard-reachable | setup status request rendered the truthful complete state; no setup mutation or new browser errors | ready/completion/error branches remain test coverage; no instance state was changed for evidence | `f27714b` / 2026-08-06 |
| `entry-onboarding` | invalid organization invite / desktop 1440×900 and narrow 390×900 | safe local invalid token `plan147-invalid`; no live invite created | agent-browser / Chromium; runner API 3022/web 3020 | 900px body, one main, 1 control, no overflow, axe 0/0 at both viewports; `docs/ui/147-entry-onboarding-before-invite-desktop.png` and `docs/ui/147-entry-onboarding-before-invite-narrow.png` | named `Entry workspace`, centered standard card 680px desktop / 358px narrow, target overflow 0, axe 0/0; `docs/ui/147-entry-onboarding-after-invite-desktop.png` and `docs/ui/147-entry-onboarding-after-invite-narrow.png` | no | reduced-motion matched; Ossie brand link remains keyboard-reachable | unavailable invite request remained truthful; no acceptance mutation or new browser errors | loaded new-user/existing-user and acceptance branches remain component-test coverage; standard width no longer becomes a desktop-wide banner | `f27714b` / 2026-08-06 |
| `public-access` | anonymous valid Guide / desktop 1440×900 and narrow 390×900 | synthetic Plan 127 public Guide Publish Link; one included Project Version | agent-browser / Chromium; runner API 3022/web 3020 | 1,142px desktop / 900px narrow, 0 controls, one main, target overflow 0, axe 0/0; `docs/ui/147-public-access-before-guide-desktop.png` and `docs/ui/147-public-access-before-guide-narrow.png` | same document/control/a11y metrics; single entry is a visible `Project Version: Summer release` chip; `docs/ui/147-public-access-after-guide-desktop.png` and `docs/ui/147-public-access-after-guide-narrow.png` | no | reduced-motion matched; no selector keyboard interaction for the single-entry chip; focused test covers multi-entry combobox naming | public Guide request/asset requests rendered without new browser errors; no mutation requests | selector copy and styling now explicitly use Project Version and the chip has bounded surface treatment; Guide content/access/Revision semantics unchanged | `8e38ee4` / 2026-08-06 |
| `public-access` | anonymous unavailable Demo / desktop 1440×900 and narrow 390×900 | local `plan128-public` currently returns published-demo unavailable in disposable seed | agent-browser / Chromium; runner API 3022/web 3020 | 900px body, one main, 0 controls, target overflow 0, axe 0/0; `docs/ui/147-public-access-before-demo-desktop.png` and `docs/ui/147-public-access-before-demo-narrow.png` | same truthful unavailable state, one main, target overflow 0, axe 0/0; `docs/ui/147-public-access-after-demo-desktop.png` and `docs/ui/147-public-access-after-demo-narrow.png` | no | reduced-motion matched; no selector present in unavailable state | unavailable request remained truthful; no new browser errors | no populated Demo claim; this route proves shared candidate does not disturb unavailable access messaging | `8e38ee4` / 2026-08-06 |
| `design-system-gallery` | local synthetic pattern gallery / desktop 1440×900 | historical Child 121 gallery at `/__design-system`; no authenticated or private state | agent-browser / Chromium; web runner 3034 baseline and 3020 candidate | 1,066px body, one main, three regions, five controls, no desktop overflow, axe 0 violations / 0 incomplete; `docs/ui/147-design-system-gallery-before-desktop.png` | 1,373px body, one named main, five regions, seven controls, no page/section overflow, axe 0/0; `docs/ui/147-design-system-gallery-after-desktop.png` | no | reduced-motion enabled; synthetic state matrix and labeled artifact table visible | no API requests; no browser errors recorded | desktop workbench remains three-column; state matrix and table focus affordance are review-only examples | `7cf7057` / 2026-08-06 |
| `design-system-gallery` | local synthetic pattern gallery / narrow 390×900 | same gallery; long Project Version table label | agent-browser / Chromium; web runner 3034 baseline and 3020 candidate | 1,680px body, one main, three regions, five controls, section overflow true from 720px table, axe 0 violations / 1 incomplete contrast-background probe; `docs/ui/147-design-system-gallery-before-narrow.png` | 2,955px body, one named main, five regions, seven controls, page/section overflow false, axe 0/0; `docs/ui/147-design-system-gallery-after-narrow.png` | no | reduced-motion enabled; Tab reached Retry state, New capture, and labeled artifact table; long labels wrap | no API requests; no browser errors recorded | narrow table now wraps within the viewport rather than creating hidden horizontal overflow | `7cf7057` / 2026-08-06 |
| `global-fallback` | anonymous unsupported route / desktop 1440×900 | local `/unknown`; existing parser returns unsupported | agent-browser / Chromium; runner web 3020 | 900px body, one unlabeled main, no h1, one Ossie link, axe 1 violation / 1 incomplete; `docs/ui/147-global-fallback-before-desktop.png` | 900px body, named main, Page-not-found h1, three links, axe 0/0; `docs/ui/147-global-fallback-after-desktop.png` | no | reduced-motion enabled; no recovery link followed | no failed requests or browser errors after candidate | generic portal card becomes explicit Page-not-found recovery state; route parser and auth remain unchanged | `de37b5e` / 2026-08-06 |
| `global-fallback` | anonymous unsupported route / narrow 390×900 | local `/unknown`; existing parser returns unsupported | agent-browser / Chromium; runner web 3032 baseline and 3020 candidate | 900px body, one unlabeled main, no h1, one Ossie link, axe 1 violation / 1 incomplete; `docs/ui/147-global-fallback-before-narrow.png` | 900px body, named main, Page-not-found h1, three links, axe 0/0; `docs/ui/147-global-fallback-after-narrow.png` | no | reduced-motion enabled; Tab reached Ossie, Open Projects, Sign in; no page overflow | no failed requests or browser errors after candidate | card remains bounded and links retain native keyboard semantics at 390px | `de37b5e` / 2026-08-06 |
| `contributor-docs` | public docs landing / desktop 1440×900 | local `apps/docs` Next app; committed synthetic alpha image assets | agent-browser / Chromium; docs runner 3033 | 2,789px body, one main, six headings, nine links, no page overflow, all four images loaded, axe 0 violations / 1 incomplete invalid ARIA label; `docs/ui/147-contributor-docs-before-desktop.png` | same body/heading/link/image metrics, axe 0/0; `docs/ui/147-contributor-docs-after-desktop.png` | no | reduced-motion enabled; README and self-hosting links first in Tab path | no external links followed; local images loaded; no browser errors recorded | hero evidence is now a semantic figure with caption; docs/source-of-truth content unchanged | `ae37ba6` / 2026-08-06 |
| `contributor-docs` | public docs landing / narrow 390×900 | same local `apps/docs` app and assets | agent-browser / Chromium; docs runner 3033 | 5,132px body, one main, six headings, nine links, no page overflow, all four images loaded, axe 0 violations / 1 incomplete invalid ARIA label; `docs/ui/147-contributor-docs-before-narrow.png` | same body/heading/link/image metrics, axe 0/0; `docs/ui/147-contributor-docs-after-narrow.png` | no | reduced-motion enabled; no page overflow; image assets loaded | no external links followed; no browser errors recorded | responsive stacking remains unchanged; only hero evidence semantics changed | `ae37ba6` / 2026-08-06 |

| `extension-installation` | authenticated ready state / desktop 1440×900 | synthetic local owner session at `/extension`; bundle was not downloaded | agent-browser / Chromium; runner API 3022/web 3020 | 900px body, one main, 10 controls, four card-region headings, target overflow 0, axe 1 violation / 1 incomplete; `docs/ui/147-extension-installation-before-desktop.png` | 932px body, one main, 10 controls, named `Extension installation workspace`, target overflow 0, axe 0/0; `docs/ui/147-extension-installation-after-desktop.png` | no | reduced-motion enabled; download button remained unsubmitted | browser errors and failed local requests empty after candidate route; no bundle mutation | Capture-tools contrast and gradient probe were removed by tokenized muted text and a solid elevated card; installation instructions and runtime URL values remain unchanged | `1058dbd` / 2026-08-06 |
| `extension-installation` | authenticated ready state / narrow 390×900 | same synthetic local owner session at `/extension`; bundle was not downloaded | agent-browser / Chromium; runner API 3022/web 3020 | 1,857px body, one main, 10 controls, target overflow 0, axe 1 violation / 1 incomplete; `docs/ui/147-extension-installation-before-narrow.png` | 1,923px body, one main, 10 controls, named `Extension installation workspace`, target overflow 0, axe 0/0; `docs/ui/147-extension-installation-after-narrow.png` | no | reduced-motion enabled; Tab path reached portal controls; no target content overflow | browser errors and failed local requests empty after candidate route; no bundle mutation | two-column install/connect cards stack at the narrow breakpoint; installed toolbar/permission path remains unavailable and is not claimed | `1058dbd` / 2026-08-06 |

| `extension-capture` | unpacked extension install/pin and direct popup / Chromium | synthetic local MV3 build from `apps/extension/dist`; no credentials retained | fresh `agent-browser` Chromium session with `--extension`; extension details page | browser toolbar capability had not been verified in this runner | Chromium loaded Ossie as an enabled unpacked extension and exposed the `Pin to toolbar` control; screenshots `docs/ui/147-continuation-extension-pinned.png`, `docs/ui/147-continuation-extension-connect.png`, `docs/ui/147-continuation-extension-ready.png` | no | direct extension-origin popup axe 0/0; semantic Connect and Ready states; storage was cleared after the run | final direct-popup path completed without page errors; two earlier safe 401 login probes occurred before switching the server to the disposable testing profile and are not candidate failures | this proves unpacked loading, enabled state, pin configuration, and popup rendering; it does not claim toolbar-icon activation because the CLI cannot click browser chrome | `106705c` / 2026-08-07 |
| `extension-capture` | synthetic signed-in selection → Capture completion → portal detail | disposable Plan 128/125 fixtures seeded separately; synthetic editor; no captured input, credentials, or tokens recorded | fresh Chromium session with loaded extension; testing API 3002 and web 3000 | signed-in extension lifecycle had not been verified through a loaded unpacked build in this runner | connect instance, sign in, Project/Project Version selection, Ready to capture, Start capture, Finish and open portal; portal `Capture from Ossie` detail rendered completed extension Capture with axe 0/0; `docs/ui/147-continuation-extension-capture-portal.png` | no | extension Ready state axe 0/0; portal detail axe 0/0; keyboard/accessible controls were exercised through native roles | final successful request path returned login 200, project/version reads 200, Capture Session create 201, complete 200; no final-path failed requests or page errors | Capture was created only in the disposable database and the final database was reseeded with Documentation fixture; no toolbar-popup claim, target-page capture claim, or product-contract change | `106705c` / 2026-08-07 |

| `internal-library-state-semantics` | authenticated Capture Sessions error/retry / desktop 1440×900 | synthetic Plan 125 admin fixture; list request locally aborted; no mutation | agent-browser / Chromium; runner API 3022/web 3020 | existing state was text-only without a page heading or alert role | one `Capture sessions` h1, existing error copy as alert, visible Retry; `docs/ui/147-internal-library-state-error-capture-sessions-desktop.png` | no | axe 0/0; document width 1440px; no page errors | only the Capture list request was aborted; browser console contained development notices only | loader, auth, not-found, and Capture contracts remain component-tested; no API or permission change | `ce1d373` / 2026-08-07 |
| `internal-library-state-semantics` | authenticated Guides error/retry / desktop 1440×900 | synthetic Plan 125 admin fixture; list request locally aborted; no mutation | agent-browser / Chromium; runner API 3022/web 3020 | existing state was text-only without a page heading or alert role | one `Guides` h1, existing error copy as alert, visible Retry; `docs/ui/147-internal-library-state-error-guides-desktop.png` | no | axe 0/0; document width 1440px; no page errors | only the Guide list request was aborted; browser console contained development notices only | loader, auth, not-found, and Guide contracts remain component-tested; no API or permission change | `ce1d373` / 2026-08-07 |
| `internal-library-state-semantics` | authenticated Interactive Demos error/retry / desktop 1440×900 | synthetic Plan 125 admin fixture; list request locally aborted; no mutation | agent-browser / Chromium; runner API 3022/web 3020 | existing state was text-only without a page heading or alert role | one `Interactive demos` h1, existing error copy as alert, visible Retry; `docs/ui/147-internal-library-state-error-interactive-demos-desktop.png` | no | axe 0/0; document width 1440px; no page errors | only the Demo list request was aborted; browser console contained development notices only | loader, auth, not-found, and Demo contracts remain component-tested; no API or permission change | `ce1d373` / 2026-08-07 |
| `internal-library-state-semantics` | authenticated Documentation Sites error/retry / desktop 1440×900 and reduced-motion mobile 390×844 | synthetic Plan 125 admin fixture; Documentation Sites request locally aborted; no mutation | agent-browser / Chromium; runner API 3022/web 3020 | existing state was text-only without a page heading or alert role | one `Documentation Sites` h1, existing error copy as alert; desktop `docs/ui/147-internal-library-state-error-documentation-sites-desktop.png`, narrow `docs/ui/147-internal-library-state-error-documentation-sites-mobile-390.png` | no | axe 0/0 at both widths; 390px document width equals viewport; Tab reaches Skip link; reduced motion enabled; no page errors | only the Documentation Sites list request was aborted; review-inbox background failure remained non-blocking | loading and loaded/empty behavior remain component-tested; no Documentation API/domain/public reader change | `ce1d373` / 2026-08-07 |
| `internal-library-state-semantics` | transient-state component contracts | synthetic loader promises/rejections for all four list owners | Vitest / Testing Library; local synthetic responses | Capture/Guide/Demo loading and error branches lacked page-heading/status/alert semantics; Documentation loading/error lacked a page heading | loading, denied/not-found, and generic-error assertions pass with existing copy and retry/sign-in behavior; 4 files / 34 tests | no | TDD red run recorded 11 expected failures before implementation; green focused suite 34/34 | no browser/network state involved | loaded cards, empty copy, Project Version boundary, and mutation behavior remain out of scope | `ce1d373` / 2026-08-07 |
| `second-clean-browser-pass` | authenticated portal representative routes / desktop 1440×900 | synthetic Plan 125 admin fixture; no mutations | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | normal authenticated entry and exact library routes were not part of one clean final pass | `/projects`, Capture Sessions, Guides, Interactive Demos, and Documentation Sites each rendered one expected h1 and one main; screenshots: `docs/ui/147-second-pass-projects-desktop.png`, `docs/ui/147-second-pass-capture-desktop.png`, `docs/ui/147-second-pass-guides-desktop.png`, `docs/ui/147-second-pass-demos-desktop.png`, `docs/ui/147-second-pass-documentation-desktop.png` | no | axe 0 violations / 0 incomplete on all five routes; console contained only Vite/React development notices; no page errors | reduced-motion enabled; direct route opens used existing normal app URLs; no write controls submitted | this representative pass supplements, but does not replace, the broader required state matrix | `221517a` / 2026-08-07 |
| `second-clean-browser-pass` | authenticated Documentation Sites / tablet 1024×768 and Guides / mobile 390×844 | same synthetic admin fixture; no mutations | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | final clean tablet/mobile samples were not previously grouped in one pass | Documentation Sites tablet screenshot `docs/ui/147-second-pass-documentation-tablet-1024.png`; Guides mobile screenshot `docs/ui/147-second-pass-guides-mobile-390.png`; both retain one main, expected h1, and document width equal to viewport | no | axe 0/0 at both viewports; mobile Tab focused `Skip to main content`; no page errors; mobile CSS zoom proxy at `zoom=2` retained `scrollWidth=390` and is linked as `docs/ui/147-second-pass-guides-mobile-css-zoom-2.png` | reduced-motion enabled; CSS `zoom` is only a proxy and is not claimed as actual browser zoom | real 200% browser zoom remains environment-limited; direct manipulation and loading states remain separately evidenced or component-tested | `221517a` / 2026-08-07 |
| `second-clean-browser-pass` | anonymous public Guide / desktop 1440×900 and embed | synthetic Plan 127 public Guide; fresh session without the authenticated cookie; no mutations | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | public valid and embed routes were not part of one final clean pass | valid Guide and `/embed` both rendered one h1 and one main; screenshots `docs/ui/147-second-pass-public-guide-desktop.png` and `docs/ui/147-second-pass-public-guide-embed.png` | no | axe 0/0 on both routes; document width 1440px; no page errors | anonymous session preserved the public-link boundary; no private metadata or mutation request observed | this proves the seeded Guide boundary only; it does not imply a valid published Documentation or Demo fixture | `221517a` / 2026-08-07 |
| `second-clean-browser-pass` | anonymous public Documentation and Demo unavailable states / desktop 1440×900 | disposable fixture active during that pass had no valid public Documentation or Demo publication at these slugs; no private data | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | valid populated fixtures were unavailable in that fixture state | Documentation rendered `Documentation unavailable`; Demo rendered `Published demo was not found.`; screenshots `docs/ui/147-second-pass-public-documentation-unavailable.png` and `docs/ui/147-second-pass-public-demo-unavailable.png` | no | axe 0/0 on both truthful unavailable routes; one main; document width 1440px; no page errors | anonymous session and unavailable responses were preserved; no mutation request observed | unavailable-state evidence is intentionally not populated-reader evidence; later dedicated seeders provide separate valid-reader evidence | `221517a` / 2026-08-07 |
| `repository-broad-verification` | all active workspaces / local verification | repository synthetic/local test fixtures; no browser state | pnpm recursive test, Turbo check-types/lint/build, local CSS-token checker, `git diff --check` | no final aggregate record was previously attached to the closeout checkpoint | latest recursive workspace tests passed; server 127/553 and web 95/507; `pnpm check-types` 13/13 tasks; `pnpm lint` 14/14 tasks with 89 existing server warnings and zero errors; `pnpm build` 13/13 tasks; CSS-token check 130/123; `git diff --check` passed | no | no browser/axe state applicable | no network or mutation state involved | existing server lint warnings and the existing web large-chunk build warning remain recorded without unrelated cleanup | `7982142` / 2026-08-07 |

| `public-documentation-hardening` | anonymous valid Documentation reader / desktop 1440×900 | fresh `seed:documentation-browser-fixture`; synthetic Plan 132 Site Publication; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | the previous clean pass had truthfully rendered this slug unavailable before a fresh Documentation fixture seed | `Install` h1, one main, Documentation reader/navigation/search chrome; `docs/ui/147-continuation-public-documentation-desktop.png` | no | axe 0/0; document width 1440px; no page errors | reduced motion enabled; public reader remained immutable and no authoring controls were exposed | console contained only Vite/React development notices; public requests completed without new errors | fresh Documentation fixture is separate from the Demo fixture; no private source metadata or mutation request | `806205b` / 2026-08-07 |
| `public-documentation-hardening` | anonymous valid Documentation reader / mobile 390×844 | same fresh synthetic Plan 132 Site Publication; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | valid reader mobile evidence was not part of the latest clean pass | `Install` h1, one main, document width 390px; `docs/ui/147-continuation-public-documentation-mobile-390.png` | no | axe 0/0; no overflow; Tab focused `Skip to content` | reduced motion enabled; no private metadata or authoring controls exposed | no page errors; console contained only development notices | actual browser zoom remains environment-limited; CSS zoom proxy is not claimed here | `806205b` / 2026-08-07 |
| `public-documentation-hardening` | anonymous API operation reader / mobile 390×844 | same fresh Documentation fixture; `GET /widgets` operation with inert public examples; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | operation route had not been included in the final clean representative pass | `GET /widgets` h1, `Request examples` and `Request` headings, one main; `docs/ui/147-continuation-public-documentation-operation-mobile-390.png` | no | axe 0/0; document width 390px; no page errors | reduced motion enabled; inert examples remained non-executable and no private origin/credential data appeared | public operation/assets requests completed; console contained only development notices | operation reader remains a public immutable projection; no Try-It mutation or credential was submitted | `806205b` / 2026-08-07 |
| `public-documentation-hardening` | anonymous public route variants / mobile 390×844 | same fresh Documentation fixture; alias `/install`, redirect `/setup`, gone `/obsolete` | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | route-variant evidence existed in prior candidate records but was rechecked after fresh seed | `/install` and `/setup` canonicalized to `/install-guide`; `/obsolete` remained truthful `Documentation unavailable`; all routes kept one main and no page errors | no | canonical checks were axe-clean through the valid reader; unavailable state axe 0/0 and width 390px | reduced motion enabled; no private metadata or mutation requests | no page errors; console contained only development notices | no valid Documentation embed route was claimed: `/install-guide/embed` remained unavailable and is recorded as a separate limitation | `806205b` / 2026-08-07 |
| `native-zoom-hardening` | anonymous Documentation reader / native Chrome Page zoom 200% | fresh synthetic Plan 132 Documentation Publication; Chrome Settings Page zoom explicitly set to 200%; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | prior final pass had only a CSS zoom proxy | `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`, one expected h1 and main; Skip to content received focus; screenshot `docs/ui/147-continuation-public-documentation-zoom-200.png` | no | axe 0 violations / 1 incomplete contrast-background probe over the existing overlapped eyebrow; no page errors; no visible horizontal overflow | native Page zoom was selected through `chrome://settings/appearance` (proof `docs/ui/147-continuation-native-zoom-settings-200.png`); final reader requests completed successfully | the one incomplete check is recorded rather than presented as axe 0/0; this is a bounded reader proof, not full-product 200% matrix closure | `106705c` / 2026-08-07 |
| `native-zoom-hardening` | anonymous Documentation API operation / native Chrome Page zoom 200% | same fresh synthetic Plan 132 Publication; inert request examples; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | operation route had only prior 390px evidence | `GET /widgets` h1, Request examples and Request regions; `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`; screenshot `docs/ui/147-continuation-public-documentation-operation-zoom-200.png` | no | axe 0 violations / 0 incomplete; no page errors or failed final requests | native Page zoom; request examples remained inert and no credential or Try-It request was submitted | operation route proves a second Documentation composition at native 200%; it does not close other product-family states | `106705c` / 2026-08-07 |
| `native-zoom-hardening` | anonymous Interactive Demo reader / native Chrome Page zoom 200% | fresh synthetic Plan 128 public Publication; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | prior Demo evidence was desktop/narrow only | valid reader rendered `Plan 128 active Interactive Demo` with `Published start`; `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`; Tab reached Continue and Enter advanced to `Published finish`; axe 0/0; screenshots `docs/ui/147-continuation-public-demo-zoom-200-start.png`, `docs/ui/147-continuation-public-demo-zoom-200-finish.png` | no | no visible overflow; reduced motion enabled; keyboard-only scene transition; no page errors | public reader remained immutable and no authoring/mutation request was submitted | native 200% Demo reader proof is bounded to the valid synthetic Publication and does not close other product-family states | `106705c` / 2026-08-07 |
| `native-zoom-hardening` | anonymous Interactive Demo embed / native Chrome Page zoom 200% | same fresh synthetic Plan 128 public Publication; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | valid embed had only prior desktop evidence | embed rendered the same immutable playback frame with `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`, axe 0/0; screenshot `docs/ui/147-continuation-public-demo-embed-zoom-200.png` | no | no visible overflow; reduced motion enabled; no page errors or final-path request failures | embed preserved public-link and immutable-playback boundaries | no private source metadata or authoring controls exposed; this is supplemental embed evidence | `106705c` / 2026-08-07 |
| `native-zoom-hardening` | anonymous Interactive Demo password/access boundaries / native Chrome Page zoom 200% | fresh synthetic Plan 128 password, restricted, expired, and revoked Publish Links; safe invalid-password probe; no secret recorded | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | access-state evidence had only prior desktop/narrow coverage | password gate and invalid retry remained bounded at `devicePixelRatio=2`; restricted/expired/revoked retained truthful h1 states; all client/scroll widths were ≤ 525px and axe 0/0; invalid retry screenshot `docs/ui/147-continuation-public-demo-password-zoom-200-invalid.png` | no | no page errors; expected public-link response statuses remained non-revealing; no secret recorded | only a safe invalid password was submitted; no successful password or link mutation was attempted | native 200% access evidence supplements, but does not replace, the full public/auth/embed matrix | `106705c` / 2026-08-07 |
| `native-zoom-auth-boundary` | authenticated owner Projects / native Chrome Page zoom 200% | fresh synthetic Plan 125 admin; same-origin real `/login`; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | authenticated Projects evidence had prior desktop/narrow coverage | real login landed on `/projects`; `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`, one main and `Projects` h1; screenshot `docs/ui/147-continuation-auth-projects-zoom-200.png` | no | axe 0/0; reduced motion true; no visible horizontal overflow | login and Project reads completed; no mutation submitted; console contained only expected development notices | proves a same-origin authenticated entry and library shell at native 200%; it does not close the loaded Project workspace route-ownership gap | `2a3bd18` / 2026-08-07 |
| `native-zoom-auth-boundary` | authenticated owner Documentation Operations / native Chrome Page zoom 200% | same fresh synthetic Plan 125 admin; two active Sites and retained Documentation records; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | Documentation Operations evidence had prior desktop/narrow coverage | Owner-only usage and Product limits rendered with `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`; screenshot `docs/ui/147-continuation-auth-documentation-operations-zoom-200.png` | no | axe 0 violations / 1 known incomplete metric-number/overlapped-background contrast probe; no visible horizontal overflow; reduced motion true | owner login and reads completed; Save limits was visible but not submitted; no page errors | the known incomplete probe is recorded rather than presented as axe 0/0; this is a bounded admin composition sample | `2a3bd18` / 2026-08-07 |
| `native-zoom-auth-boundary` | authenticated viewer Documentation Operations / native Chrome Page zoom 200% | same synthetic Plan 125 viewer; no mutation | headed `agent-browser` Chromium; runner API 3022/web 3020; reduced motion | viewer Documentation Operations evidence had prior desktop/narrow coverage | read-only usage rendered with `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`; Owner-only Save limits control was absent; screenshot `docs/ui/147-continuation-viewer-documentation-operations-zoom-200.png` | no | axe 0 violations / 1 same known incomplete metric-number/overlapped-background contrast probe; no visible horizontal overflow; reduced motion true | viewer login and reads completed; no mutation submitted | UI absence is supplemental evidence only; server authorization tests remain authoritative | `2a3bd18` / 2026-08-07 |
| `native-zoom-auth-boundary` | anonymous Documentation reader / isolated fresh context at native Chrome Page zoom 200% | fresh synthetic Plan 125 public Publication; no authenticated storage; no mutation | separate headed `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | earlier native reader evidence was not explicitly tied to this isolated context | public reader rendered `Install` with no portal chrome, `devicePixelRatio=2`, CSS viewport `525px`, document client/scroll width `517px`; axe 0/0; Tab focused Skip to content; screenshot `docs/ui/147-continuation-anonymous-documentation-zoom-200.png` | no | no visible horizontal overflow; reduced motion true; no page errors | fresh anonymous context was kept separate from authenticated sessions; no private metadata or mutation request | strengthens the public/auth boundary sample without claiming full public matrix closure | `2a3bd18` / 2026-08-07 |
| `public-demo-hardening` | anonymous valid Interactive Demo reader / desktop 1440×900 | fresh `seed:interactive-demo-browser-fixture`; synthetic Plan 128 Publication; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | previous clean pass saw this slug unavailable because the Documentation fixture was active | `Plan 128 active Interactive Demo` h1, `Published start` h2, one main; `docs/ui/147-continuation-public-demo-desktop.png` | no | axe 0/0; document width 1440px; no page errors | reduced motion enabled; immutable Scene playback and Project Version context remained visible | console contained only Vite/React development notices; no failed page requests | fresh Demo fixture is mutually exclusive with the Documentation fixture; no authoring or mutation controls exposed | `806205b` / 2026-08-07 |
| `public-demo-hardening` | anonymous valid Interactive Demo embed / desktop 1440×900 | same fresh synthetic Plan 128 Publication; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | valid embed evidence was not part of the final clean pass | same immutable playback frame in `/embed`; one main, `Plan 128 active Interactive Demo` h1; `docs/ui/147-continuation-public-demo-embed.png` | no | axe 0/0; document width 1440px; no page errors | reduced motion enabled; embed remained a public playback frame without authoring controls | no page errors or failed requests; console contained only development notices | embed route preserves the public-link boundary and does not expose private source metadata | `806205b` / 2026-08-07 |
| `public-demo-hardening` | anonymous valid Interactive Demo reader / mobile 390×844 and keyboard Scene transition | same fresh synthetic Plan 128 Publication; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | mobile direct-manipulation evidence was not part of the final clean pass | mobile reader width matched viewport; Tab reached the Project Version control and Continue; Enter advanced to `Published finish`; `docs/ui/147-continuation-public-demo-mobile-390.png`, finish state `docs/ui/147-continuation-public-demo-finish.png` | no | axe 0/0 before and after transition; no overflow; reduced motion enabled | keyboard-only transition and Previous Scene path exercised; live transition status remained visible | no page errors; console contained only development notices | Scene navigation remained immutable playback; no persistence or authoring mutation occurred | `806205b` / 2026-08-07 |
| `public-demo-hardening` | anonymous password access / desktop 1440×900 | fresh synthetic Plan 128 password Publish Link; safe wrong-password probe; no secret recorded | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | password and invalid-password browser screenshots were not part of the final clean pass | `Password required` h1 and named password textbox; invalid probe preserves gate and exposes `Password is invalid.` alert; `docs/ui/147-continuation-public-demo-password.png`, `docs/ui/147-continuation-public-demo-password-invalid.png` | no | axe 0/0 before and after invalid submission; one main; no page errors | no password value was recorded; retry control remained reachable | only the synthetic invalid attempt was submitted; no private/public-link metadata leak observed | safe fixture password remains unrecorded; no successful password submission is claimed | `806205b` / 2026-08-07 |
| `public-demo-hardening` | anonymous restricted/expired/revoked access states / desktop 1440×900 | fresh synthetic Plan 128 public-link access cases; no mutation | fresh `agent-browser` Chromium session; runner API 3022/web 3020; reduced motion | access-state browser verification was not part of the final clean pass | restricted rendered `This Publish Link is restricted.`; expired rendered `This Publish Link has expired.`; revoked rendered `Published demo was not found.`; each one main | no | axe 0/0 for all three; no page errors; document width 1440px | reduced motion enabled; no reader controls or private metadata exposed in denied states | no failed requests or browser errors; console contained only development notices | access outcomes remain public-link-owned and no link was changed or revoked by evidence | `806205b` / 2026-08-07 |
| `repository-db-verification` | server smoke and disposable DB integration suite / local verification | guarded local `ossie_test`; synthetic fixture builders only; no production/shared data | pnpm/Vitest; services stopped during DB suite | initial DB run exposed a stale Documentation fixture count (`operations: 1` vs received `2`) | test-only expectation reconciliation in `7982142`; focused fixture test 1/1; `pnpm --filter server run test:smoke`: 1 file / 2 tests; rerun `pnpm --filter server run test:db`: 24 of 24 files, 88 of 88 tests | no | no browser/axe state applicable | no network/browser state; test database was disposable and reseeded with Documentation fixture afterward | no runtime/server/domain/UI files changed; `d638112..HEAD` had no server-file diff before the test-only repair; the initial mismatch and its resolution remain traceable | test contract now matches the fixture’s two declared OpenAPI operations; no product semantics changed | `7982142` / 2026-08-07 |

## Decision ledger

| Decision | Recommendation / rationale | Alternatives | Scope | Status |
| --- | --- | --- | --- | --- |
| Browser evidence tooling | Continue with repository-approved `agent-browser`; do not add Playwright/axe without the Plan 147 dependency gate and user approval | dependency decision packet later | evidence only | accepted within plan |
| Token authority | Designate `packages/ui/src/tokens.css` as the canonical semantic Ossie token source; web and extension import it, while legacy generic names become explicit aliases | duplicate app-local definitions or silent raw values | shared styling | accepted within Plan 147 scope; implementation complete in `105fc5b` and `59fd07f` |
| Database | Reset only local `ossie_test` via guarded testing commands and seed existing deterministic fixtures | a new Plan 147 namespace if existing fixture coverage is insufficient | local verification | smoke passed; DB suite has one pre-existing Documentation fixture count mismatch recorded below |

### P1-002 exact surface preflight

- Actual HEAD/worktree: `c0d4577` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree clean before this surface.
- Surface and normal entries: `/__design-system`, authenticated portal/auth
  shell, Interactive Demo workbench/editor, Documentation Site library, and
  the extension popup. Roles/states include anonymous entry, authenticated
  member roles, default/hover/focus/disabled/selected/error/read-only, and
  reduced motion.
- Current graph: `apps/web/src/index.css` and `apps/extension/src/index.css`
  define partial duplicated Ossie tokens; 58 CSS files consume them. Confirmed
  undefined live names are the Plan 147 P1-002 list (`ossie-space-*`, missing
  radii/colors/font size, and generic border/background aliases).
- Intended write set: `packages/ui/src/tokens.css`, its package export, web and
  extension root CSS imports/removal of duplicated definitions, confirmed
  generic-consumer aliases, repository token-check script and package command,
  focused token-check test, and token evidence/review records. A bounded
  design-system heading-level and narrow intrinsic-width repair was added after
  browser evidence exposed an existing gallery-only accessibility/reflow issue.
- Explicitly out of scope: visual redesign, changing domain/permission/tenant
  behavior, server/schema/API/migrations, dependency installation, broad raw
  color cleanup, docs contributor-app tokens, and any change to extension
  permissions or popup behavior.
- Accepted constraints: Quiet Versioned Workbench tokens from `PRODUCT.md` and
  `DESIGN.md`; focus/contrast/reduced-motion behavior must remain intact; no
  undefined fallback is allowed to become a new semantic value without an
  explicit design mapping.
- Focused failing command: `node scripts/check-css-tokens.mjs`; expected to
  fail on the confirmed P1-002 names before token mapping.
- Browser evidence: authenticated `/__design-system` and representative
  portal/Demo/Documentation routes at 1440×900, 390×844, keyboard focus, and
  reduced-motion; extension normal popup route where the local capability is
  available. No new dependency or schema/API gate is required.
- Reviewer A brief: inspect token-driven hierarchy, focus visibility, spacing,
  radii, contrast, density, responsive composition, and whether the mapping
  preserves Quiet Versioned Workbench intent.
- Reviewer B brief: inspect CSS scope, token definition/consumer completeness,
  browser states, accessibility audit, extension/portal parity, no permission
  or public-link regression, and exact diff boundary.
- Rollback boundary: revert the token candidate commit; preserve c0d4577 and
  the accepted Publication preview candidate.

### P1-003 exact surface preflight

- Actual HEAD/worktree: `70e1a25` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; the only current untracked files are the two
  synthetic baseline screenshots named in the evidence ledger below.
- Surface and normal entries: authenticated Site route
  `/projects/:projectId/versions/:versionSlug/documentation/:siteId`, with
  dedicated Page entry links at `/pages/:pageId`. Roles are project admin,
  editor, and viewer; required states are populated, no Pages, loading,
  load/retry failure, active, archived/read-only, saving/status, review,
  conflict/validation, and long-content/narrow reflow.
- Current request/component graph: `App.tsx` resolves project and Project
  Version permissions; `DocumentationSiteEditorPage` loads the saved draft plus
  Revision/Publication summaries; it currently mounts lifecycle, Page lifecycle,
  review, structure, snippets, assets, portability, checkpoint, OpenAPI, and
  publishing panels in one document. Existing child panels own their current
  API calls, permission props, mutation guards, and status messages. The Page
  route separately owns block editing, autosave conflict preservation,
  comments, assets, metadata, and bounded prose/typed graph adapters.
- Baseline browser proof: synthetic Plan 125 admin at 1440×900 measured
  `scrollHeight=4743`, `scrollWidth=1440`, and 136 interactive controls; at
  390×844 measured `scrollHeight=6845`, `scrollWidth=390`, and 136 interactive
  controls. Narrow axe 4.12.1 reported 0 violations, 45 passes, and one
  incomplete color-contrast probe on the existing block textarea because it was
  partially obscured during the audit. Baseline screenshots are
  `docs/ui/147-documentation-authoring-before.png` and
  `docs/ui/147-documentation-authoring-before-narrow.png`; browser errors were
  empty after the testing API was restored on the disposable database.
- Intended write set: a Site workbench shell and CSS module; explicit Author,
  Site settings, Review, Content, Import/export, and Publish task ownership;
  accessible tab/task navigation with a persistent status bar; focused
  component tests; browser evidence and blind review records. Existing child
  panels remain the implementation authority for all operations and are moved
  behind intentional task boundaries without changing their request contracts.
- Explicitly out of scope: server/schema/API/migrations, relational
  Documentation graph changes, Tiptap/Fumadocs authority, permissions or tenant
  checks, public URLs/access challenges, immutable Revision/Publication output,
  block IDs/comments/assets/references, Try It origin/credential policy,
  dependency installation, and redesign of the separate Page editor route.
- Accepted constraints: preserve Site Edition/Working Draft/Revision/Publication
  language and immutability; viewer and archived states must not expose mutation
  controls; status/error/validation blockers remain visible in the active task
  and persistent workbench status bar; dedicated Page editing remains the normal
  content canvas for Page blocks.
- Focused failing test to add first: the Site workbench must expose the
  Author task by default, keep Page navigation available, move lifecycle and
  publishing controls behind named task tabs, and retain the saved-draft status
  bar while switching tasks. The existing Site component tests will be updated
  only where their assertions depended on all panels being simultaneously
  mounted.
- Browser verification: authenticated admin and viewer routes at 1440×900 and
  390×844; active, no Pages, archived/read-only, and a failed-load injection;
  keyboard Tab/Enter task switching; 200% zoom/reflow; reduced motion; axe;
  console and failed-request review; Page editor smoke path to preserve the
  dedicated canvas. Anonymous internal access remains a separate gate and is
  not changed by this candidate.
- Reviewer A brief: inspect hierarchy, task naming, navigator/canvas/inspector
  ownership, density, responsive task navigation, focus/selected states,
  persistent status treatment, and whether recurring authoring is visibly
  distinct from administration and publication.
- Reviewer B brief: inspect every previously mounted capability and permission
  state, active/archived/viewer guards, loading/error/status visibility,
  keyboard/axe/zoom/reduced-motion behavior, exact diff boundary, and absence of
  API/domain/public-link/immutability regressions.
- Rollback boundary: revert only the P1-003 candidate and its evidence/review
  records; preserve `70e1a25`, the semantic-token candidate, the Publication
  preview candidate, and the current-truth reconciliation.

### P1-004 exact surface preflight

- Actual HEAD/worktree: `b93715c` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree clean before this surface.
- Surface and normal entries: anonymous public Documentation Publish Link
  `/docs/plan132-public/install-guide`, its permanent alias/redirect/gone
  variants, and the API operation route
  `/docs/plan132-public/operations/get-widgets-listwidgets`. Required states
  include valid Publication, search results/empty/error, long content/code,
  operation examples, browser-direct Try It available/unavailable, password
  challenge/invalid password, revoked/expired/unavailable, canonical redirect,
  embed, 320/390px, keyboard, 200% reflow, and reduced motion.
- Current request/component graph: `App.tsx` resolves the public route and
  mounts `PublicDocumentationReaderPage`; the page loads the public
  Publish-Link snapshot, owns password session/retry/search state and metadata,
  renders typed Blocks/operation examples/Try It, and mounts the lazy
  `DocumentationPublicationReaderChrome` when the bounded Fumadocs adapter can
  build its authorized tree. The Chrome owns breadcrumb, navigation, adjacent
  links, and TOC; native fallback owns equivalent semantic navigation.
- Baseline browser proof: anonymous synthetic `install-guide` at 1440×900 and
  390×844 rendered the exact Site/Page content, navigation, breadcrumb, search,
  safe assets, tabs, table, previous/next, and no internal IDs. Both viewports
  measured `scrollWidth=viewport width`, 0 axe violations, 0 incomplete items,
  and 12 interactive controls. The operation route rendered inert examples,
  copy/download controls, and truthful unavailable Try It messaging without
  executing a target request. Baseline screenshots are
  `docs/ui/147-documentation-public-before-desktop.png` and
  `docs/ui/147-documentation-public-before-narrow.png`; browser errors were
  empty.
- Intended write set: public reader composition CSS and semantic wrappers;
  deliberate title/metadata, search/header, navigation drawer/overlay,
  breadcrumb, readable article measure, code/table overflow, TOC, API example
  and Try It grouping, access/unavailable card styling, adjacent navigation,
  reduced-motion rules, focused reader tests, browser evidence, and blind
  review records. No public snapshot contract changes are intended.
- Explicitly out of scope: server/schema/API/migrations, public URL/redirect/
  canonical/access/password/expiry/revocation semantics, Publication identity
  or immutable content, Fumadocs becoming route/content authority, Try It target
  requests or credential policy, arbitrary HTML/MDX, new dependencies, and
  internal authoring/admin UI.
- Accepted constraints: public reader must not expose administration language,
  internal IDs, private metadata, or credentials; native fallback and bounded
  authorized bootstrap stay behaviorally equivalent; navigation becomes a
  controlled narrow-screen drawer/overlay; code overflow is contained; visual
  styling uses the accepted Ossie token authority and preserves focus,
  contrast, keyboard, and reduced-motion behavior.
- Focused failing test to add first: the valid reader exposes explicit reader
  shell landmarks, an accessible navigation-drawer control, and an article
  content region while keeping the existing exact content/search contract.
- Browser verification: anonymous valid, operation, alias/redirect/gone, and
  unavailable routes at 1440×900 and 390×844; keyboard drawer open/close and
  search; 200% zoom/reflow; reduced motion; axe; console/network; no target API
  execution. Password challenge remains verified through existing component
  tests unless a deterministic seeded public password route is present.
- Reviewer A brief: inspect reader hierarchy, calm chrome, measure/typography,
  navigation drawer, search, breadcrumb, TOC, API/example separation, adjacent
  links, and narrow/zoom composition.
- Reviewer B brief: inspect exact public route/redirect/access/canonical
  behavior, no metadata/credential leakage, safe assets and inert examples,
  Try It availability messaging, keyboard/axe/reduced-motion/error states,
  native fallback parity, and diff boundary.
- Rollback boundary: revert only the P1-004 candidate and its evidence/review
  records; preserve `8055143`/`b93715c`, the semantic-token candidate, the
  Publication preview candidate, and all prior ledger truth.

### P1-005 exact surface preflight

- Actual HEAD/worktree: `0028eca` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree clean before this surface.
- Surface and normal entries: authenticated project-admin/editor Interactive
  Demo editor
  `/projects/01K12500000000000000000002/versions/summer-release/interactive-demos/01K12802000000000000000001`,
  plus the seeded empty and archived Edition routes, preview, and Revision
  history links. Required states include active/empty/archived/read-only,
  viewer/editor permission, loading/error/retry, unsaved/saving/failure,
  Working Draft conflict, 12-scene/Hotspot navigation, protected/broken/missing
  assets, pointer movement/resizing, keyboard movement/resizing, narrow/reflow,
  zoom, and reduced motion.
- Current request/component graph: `App.tsx` resolves the internal route and
  mounts `InteractiveDemoEditorPage`; the page loads the immutable Edition
  identity plus mutable Working Draft, Scenes, Hotspots, and optional Capture
  assets. `InteractiveDemoWorkbench` owns metadata, lifecycle, publication
  controls, and the scene-stage shell; `InteractiveDemoSceneEditor` owns the
  selected Scene's contextual inspector; `InteractiveDemoCanvas` owns pointer
  movement, pointer resize, Hotspot selection, and keyboard movement. Read-only
  and archived guards route through `InteractiveDemoReadOnlyPage`.
- Baseline browser proof: seeded synthetic Plan 128 active Demo at 1440x900
  measured `scrollWidth=1440`, `bodyScrollWidth=1440`, 2,823px document height,
  and 101 interactive controls. At 390x844 it measured
  `scrollWidth=390`, `bodyScrollWidth=390`, 4,683px document height, and 101
  interactive controls. Both had 0 axe violations, 1 incomplete contrast probe
  over three existing textareas, and no page overflow. The browser screenshot
  showed the permanent metadata/Publishing sidebar, a clipped horizontal
  12-scene rail, and the Stage below a competing action stack. Baseline files
  are `docs/ui/147-interactive-demo-before-desktop.png` and
  `docs/ui/147-interactive-demo-before-narrow.png`.
- Intended write set: Demo workbench composition and semantic ownership;
  contextual publication/history disclosure; Scene navigator/stage/inspector
  hierarchy; explicit keyboard resize behavior for the existing resize handle;
  bounded narrow layout, focus, token, and reduced-motion rules; authenticated
  Capture-asset hydration for editor and read-only playback; the archived-shell
  landmark correction; focused Canvas/Renderer/workbench tests; browser
  evidence; and blind review records. No server, schema, API, Publication,
  Revision, Project Version, authorization, tenant, Capture-source, or mutation
  contract changes are intended.
- Explicitly out of scope: database/migrations, API routes or payloads,
  lifecycle/permission/public-link semantics, immutable Revision/Publication
  content, Fumadocs/public readers, new dependencies, broad portal-shell
  redesign, or silent mutation/error handling changes.
- Accepted constraints: Stage remains the dominant working region; Scene
  navigation is a named owned control; Inspector controls remain contextual to
  the selected Scene/Hotspot; publication/history administration is available
  through an explicit disclosure; pointer behavior remains intact; keyboard
  movement and resize both have visible/focusable alternatives; empty,
  protected, broken, archived, read-only, conflict, and destructive states
  remain truthful and guarded.
- Focused failing tests to add first: the existing Canvas resize handle accepts
  Arrow-key geometry changes with the same normalized clamp contract as pointer
  resize; the workbench exposes a named publication/history disclosure; the
  authenticated renderer hydrates cross-origin Capture assets; and the
  read-only shell contributes no nested `main` landmark.
- Browser verification: authenticated active/empty/archived/read-only routes
  at desktop and 390px; stage/navigator/inspector keyboard path; pointer and
  keyboard move/resize; publication/history disclosure; loading/error/conflict
  and protected/broken asset states through fixture/components; preview and
  Revision history; 200% reflow; reduced motion; axe; console/network; and no
  unintended mutation outside explicitly exercised local fixture controls.
- Reviewer A brief: inspect stage dominance, scene navigator legibility,
  inspector context, action hierarchy, geometry feedback, pointer/keyboard
  interaction, narrow composition, and zoom/reflow.
- Reviewer B brief: inspect Edition/Working Draft identity, active/archived/
  viewer guards, publication/history disclosure, conflict/destructive copy,
  protected assets, tenant/permission/mutation boundaries, keyboard/axe/
  reduced-motion/error behavior, exact diff boundary, and asset credential
  handling.
- Rollback boundary: revert only the P1-005 candidate and its evidence/review
  records; preserve `0ea64b9`/`0028eca`, `8055143`/`b93715c`, the token
  candidate, the Publication preview candidate, and all prior ledger truth.

### demos-public exact surface preflight

- Actual HEAD/worktree: `aa3de94` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; no implementation diff was present before this
  surface baseline. New files are limited to synthetic before screenshots.
- Surface and normal entries: anonymous valid public viewer
  `/d/plan128-public`, its `/embed` form, explicit `summer-release` and `main`
  Project Version selections, plus seeded password, restricted, expired, and
  revoked Publish Link states. Required states include loading, valid playback,
  multi-version selection, Scene transition/history, missing/broken media,
  password/invalid-password, restricted/expired/revoked/unavailable, embed,
  320/390px, keyboard, 200% reflow, and reduced motion.
- Current request/component graph: `App.tsx` resolves public reader/embed
  routes and mounts `PublicInteractiveDemoViewerPage`; the page owns the
  Publish Link load/password/retry state and Project Version selector, while
  `InteractiveDemoRenderer` owns immutable Revision Scene playback, keyboard
  progression, missing-media fallback, and authenticated Capture-asset
  hydration.
- Baseline browser proof: anonymous synthetic `plan128-public` at 1440x900
  measured `scrollWidth=1440`, `bodyScrollWidth=1440`, 1,372px document height,
  and 4 interactive controls. At 390x844 it measured
  `scrollWidth=390`, `bodyScrollWidth=390`, 844px document height, and 4
  interactive controls. Both had 0 axe violations and 0 incomplete items; the
  visual baseline showed a plain full-width stage, weak published context, and
  ungrouped playback controls. Baseline files are
  `docs/ui/147-interactive-demo-public-before-desktop.png` and
  `docs/ui/147-interactive-demo-public-before-narrow.png`.
- Intended write set: public viewer context/header and reader-frame
  composition; version selector hierarchy; public loading/password/error states;
  token-driven responsive/reduced-motion CSS; the immutable renderer's optional
  title ownership; focused viewer/renderer tests; browser evidence; and blind
  review records. No Publish Link, Publication, Revision, access, canonical
  URL, password, embed, tenant, or public snapshot contract changes are
  intended.
- Explicitly out of scope: server/schema/API/migrations, public-link semantics,
  access/session policy, immutable Revision content, editor/admin workbench,
  new dependencies, public Documentation reader authority, and unrelated
  portal-shell redesign.
- Accepted constraints: public viewers must not expose authoring or admin
  vocabulary; exact Publication/Revision identity and Version selection remain
  visible; stage remains the dominant reader region; playback controls remain
  keyboard-operable; missing/broken/password/access states stay truthful; and
  no target network or credential policy is introduced.
- Focused failing test to add first: the public viewer owns the published Demo
  title in one level-one heading while the renderer can omit its duplicate
  title for that shell, preserving the existing immutable playback tests.
- Browser verification: valid reader/embed, Version selection, Scene transition
  and Previous/Restart, password invalid retry, restricted/expired/revoked and
  unavailable states, missing/broken media, desktop/390px/200% reflow,
  keyboard, reduced motion, axe, console/network, and no public metadata or
  target-request leakage.
- Reviewer A brief: inspect public context, title/version hierarchy, stage
  dominance, progress/control quietness, asset framing, narrow composition,
  embed restraint, and playback feedback.
- Reviewer B brief: inspect exact Publish Link/Publication/Revision/access/
  embed behavior, no authoring leakage, password/error guards, asset and target
  request safety, keyboard/axe/zoom/reduced-motion behavior, and diff boundary.
- Rollback boundary: revert only the demos-public candidate and its evidence/
  review records; preserve `e97647e`/`4008ec7`, `aa3de94`, and all prior ledger
  truth.

### guides-public exact surface preflight

- Actual HEAD/worktree: `b4d8400` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree was clean before this surface. New
  files at baseline are limited to synthetic before screenshots.
- Surface and normal entries: anonymous valid Guide reader `/p/plan127-public`,
  its `/embed` form, seeded password/restricted/expired/revoked states, and an
  unknown slug. Required states include loading, valid immutable blocks,
  empty-guide content, password/invalid-password, access errors, missing or
  broken Capture media, embed, 320/390px, keyboard, 200% reflow, and reduced
  motion.
- Current request/component graph: `App.tsx` resolves public Guide reader and
  embed routes and mounts `PublicGuideReaderPage`; the page owns Publish Link
  loading/password state, public Version context, immutable Guide Revision
  block projection, and Capture-asset image presentation. `PublicVersionSelector`
  owns the one-entry label or exact public Version navigation.
- Baseline browser proof: after seeding the repository's synthetic Guide
  fixture, anonymous `plan127-public` at 1440x900 measured
  `scrollWidth=1440`, `bodyScrollWidth=1440`, 900px document height, and 0
  interactive controls; at 390x844 it measured `scrollWidth=390`,
  `bodyScrollWidth=390`, 844px document height, and 0 interactive controls.
  Both had 0 axe violations and 0 incomplete items. The visual baseline showed
  sparse unstyled reader chrome, a weak content measure, and an unframed Guide
  block. Baseline files are `docs/ui/147-guide-public-before-desktop.png` and
  `docs/ui/147-guide-public-before-narrow.png`.
- Intended write set: public Guide title/version context and reader-frame
  composition; token-driven responsive/reduced-motion CSS; empty and
  missing/broken Capture-media presentation; focused reader tests; browser
  evidence; and blind review records. No Guide Publication, Revision, block,
  access, canonical URL, password, embed, tenant, or public snapshot contract
  changes are intended.
- Explicitly out of scope: server/schema/API/migrations, public-link semantics,
  access/session policy, immutable Guide Revision content, editor/admin work,
  new dependencies, shared Version-selector redesign, and unrelated reader or
  portal-shell surfaces.
- Accepted constraints: public readers must retain exact Guide Revision identity,
  visible Project Version context, typed block semantics, truthful empty/access/
  media-failure states, keyboard-native content, and no authoring vocabulary or
  metadata leakage.
- Focused failing test to add first: the public Guide shell owns the single
  level-one title and labels the main reader by that title while preserving a
  level-two block heading; the media-failure fallback is covered in the same
  bounded reader test file.
- Browser verification: valid reader/embed, Version context, empty guide,
  password invalid retry, restricted/expired/revoked/unknown, missing/broken
  media, desktop/390px/200% reflow, keyboard, reduced motion, axe, console/
  network, and no private metadata or target-request leakage.
- Reviewer A brief: inspect published context, reader measure, block hierarchy,
  media framing, empty state, embed restraint, narrow composition, and calm
  visual hierarchy.
- Reviewer B brief: inspect exact Guide Publication/Revision/access/embed
  behavior, no authoring leakage, password/error guards, media fallback,
  keyboard/axe/zoom/reduced-motion behavior, and diff boundary.
- Rollback boundary: revert only the guides-public candidate and its evidence/
  review records; preserve `fff22eb`/`b4d8400`, all prior ledger truth, and the
  seeded disposable fixture.

### projects-workspace exact surface preflight

- Actual HEAD/worktree: `c6ee819` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree was clean before this surface. New
  files at baseline are limited to synthetic before screenshots.
- Surface and normal entries: authenticated `/projects` and root `/` Project
  list routes; owner/admin/editor/viewer permissions; active and archived
  filters; populated, empty, loading, retry/error, unauthenticated, create,
  validation, conflict, saving, keyboard, narrow/reflow, and reduced-motion
  states. Project workspace navigation remains an existing link contract.
- Current request/component graph: `App.tsx` resolves the root and Projects
  routes; `ProjectListPage` owns list loading/filtering, create-form state and
  error mapping; `PortalAppShell` owns shared navigation, authentication, and
  the outer main landmark; `ProjectCard` owns the summary metadata and default
  Project Version link. `listProjects` and `createProject` remain the only
  project API calls in scope.
- Baseline browser proof: authenticated synthetic Plan 125 admin at 1440x900
  measured `scrollWidth=1440`, `bodyScrollWidth=1440`, 900px document height,
  and 11 interactive controls; at 390x844 it measured `scrollWidth=390`,
  `bodyScrollWidth=390`, 905px document height, and 11 interactive controls.
  Both had 0 axe violations and 0 incomplete items. The visual baseline showed
  a low-information desktop field, a loosely grouped status filter, and a
  narrow card that inherited the shared portal navigation's horizontal
  clipping. Baseline files are `docs/ui/147-projects-before-desktop.png` and
  `docs/ui/147-projects-before-narrow.png`.
- Intended write set: Project page header/list/filter/card/empty/create-form
  composition, explicit Project library landmark, token-driven styling,
  responsive/reduced-motion CSS, focused Project tests, browser evidence, and
  blind review records. No Project, Project Version, membership, tenant,
  authorization, create, archive, restore, or workspace URL contracts are
  intended to change.
- Explicitly out of scope: PortalAppShell/navigation redesign, server/schema/
  API/migrations, Project settings/workspace, shared UI dependency changes,
  new dependencies, and unrelated Project Version or Capture surfaces.
- Accepted constraints: Project and Project Version are rendered with their
  accepted domain terms; organization/project isolation and role-derived
  actions remain unchanged; project metadata stays non-sensitive and direct
  workspace links remain available for archived Projects.
- Focused failing test to add first: the Project collection exposes a distinct
  `Project library` region while preserving the existing Project status filter
  and response-order/link tests.
- Browser verification: active/archived/empty filters, create/validation/
  conflict/retry states, unauthenticated guard, desktop/390px/200% reflow,
  keyboard focus, reduced motion, axe, console/network, and no accidental
  mutation beyond the existing synthetic create path.
- Reviewer A brief: inspect workspace density, Project identity/meta hierarchy,
  filter grouping, create-form prominence, card actions, narrow layout, and
  shared-shell boundary.
- Reviewer B brief: inspect role/tenant/Project Version and archived-link
  semantics, create/error/empty/loading states, keyboard/axe/zoom/motion,
  mutation scope, and exact diff boundary.
- Rollback boundary: revert only the projects-workspace candidate and its
  evidence/review records; preserve `c6ee819`, all prior public candidates,
  ledger truth, and the seeded disposable fixture.

### documentation-admin exact surface preflight

- Actual HEAD/worktree: `57226fa` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree was clean before this surface. New
  files at baseline are limited to synthetic before screenshots.
- Surface and normal entries: authenticated `/organization/documentation`;
  Organization owner, admin, editor, and viewer sessions; loading, populated,
  over-limit, save, row-version conflict, save failure, read-only, keyboard,
  narrow/reflow, and reduced-motion states. Only an owner receives the
  `can_manage_limits` mutation permission from the existing API contract.
- Current request/component graph: `App.tsx` resolves the route and its
  Documentation suspense boundary; `PortalAppShell` owns the shared portal
  main landmark, navigation, authentication, and breadcrumb; this page owns
  the usage summary, limit draft, status messages, and conflict handling;
  `getDocumentationOperations` and `updateDocumentationLimits` remain the
  only API calls in scope.
- Baseline browser proof: authenticated synthetic Plan 125 admin at 1440x900
  measured `scrollWidth=1440`, `bodyScrollWidth=1440`, 900px document height,
  and 12 interactive controls; at 390x844 it measured `scrollWidth=390`,
  `bodyScrollWidth=390`, 1,315px document height, and 12 interactive
  controls. Both had three axe violations from the page's nested main
  landmark. The visual baseline showed an ungrouped metric field, oversized
  policy form, and shared portal navigation clipping at narrow width.
  Baseline files are `docs/ui/147-documentation-admin-before-desktop.png` and
  `docs/ui/147-documentation-admin-before-narrow.png`.
- Intended write set: Documentation operations page landmark/composition,
  usage and limits grouping, token-driven responsive/reduced-motion CSS,
  focused tests, browser evidence, and blind review records. No limits,
  version-conflict, permission, Organization, Documentation, or API contract
  is intended to change.
- Explicitly out of scope: `PortalAppShell`/navigation redesign, server/schema/
  API/migrations, shared UI dependency changes, new dependencies, and
  project-level Documentation Site/editor/reader surfaces.
- Accepted constraints: Organization product limits retain their existing
  owner-only mutation boundary; over-limit content remains retained and only
  new growth is blocked; no private usage or Organization metadata is added.
- Focused failing test to add first: the usage summary and owner-only product
  limit controls expose distinct named administration regions.
- Browser verification: populated and over-limit usage, save/conflict/failure
  behavior, viewer read-only rendering, 1440px/390px/200% reflow, keyboard,
  reduced motion, axe, console/network, and no unintended limit mutation.
- Reviewer A brief: inspect administration hierarchy, metric grouping, policy
  form density, alert prominence, narrow composition, and shared-shell
  boundary.
- Reviewer B brief: inspect owner-only mutation semantics, over-limit truth,
  conflict/error behavior, Organization boundary, keyboard/axe/zoom/motion,
  and exact diff scope.
- Rollback boundary: revert only the documentation-admin candidate and its
  evidence/review records; preserve `57226fa`, all prior candidates, ledger
  truth, and the seeded disposable fixture.

### extension-capture exact surface preflight

- Actual HEAD/worktree: `537b3d5` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree was clean before this surface. The
  direct-popup fixture is repository-approved synthetic evidence and the
  installed toolbar remains a separate capability check.
- Surface and normal entries: the extension popup root with configured,
  signed-out, signed-in Project/Project Version selection, active automatic or
  manual Capture, paused, recovery, completion, error, and local-clear states;
  extension owner/editor Project access and archived/unavailable contexts.
  The normal installed entry is the browser toolbar action, with local Vite
  popup preview as the reproducible fallback.
- Current request/component graph: `App` owns extension bootstrap, auth,
  Project/Project Version loading, Capture Session lifecycle, background
  commands, and local recovery persistence; `CaptureWorkspace` owns the popup
  capture hierarchy and action state; `PopupShell`, `CaptureContextPanel`,
  `CaptureStatusPanel`, and `LocalCaptureRecovery` own the popup composition;
  server Capture Session/Event/Asset contracts and extension permissions remain
  unchanged.
- Baseline browser proof: repository-approved direct popup fixture at 360x600
  active Capture measured viewport/body width 360px, popup scroll height 795px,
  and 8 interactive controls; axe reported 0 violations and 0 incomplete
  items, with no browser errors. Baseline file is
  `docs/ui/147-extension-capture-before-active.png`. Existing Child 126
  evidence covers signed-out, selection, active, 320px, and 180px direct-popup
  states; no installed toolbar proof is claimed for this run.
- Intended write set: capture action-group semantics, compact action-group
  wrapping, responsive/reduced-motion popup CSS, focused accessibility test,
  direct-popup evidence, and blind review records. No Capture Session/Event/
  Asset, Project Version, permission, privacy, extension manifest, API, or
  background-command contract is intended to change.
- Explicitly out of scope: installed toolbar/permission automation unavailable
  in this runner, server/schema/API changes, new dependencies, target-page
  capture fixtures, and portal Capture detail composition.
- Accepted constraints: Capture remains source-material creation governed by
  existing Project Version and Project access; local clear explicitly does not
  cancel or delete the server Capture Session; no customer URL, token, cookie,
  or captured input may enter evidence.
- Focused failing test to add first: the selection and active popup expose a
  named `Capture actions` group containing the current Start/Capture/Finish
  controls.
- Browser verification: configured selection and active states, 360px,
  320px, 180px 200%-proxy reflow, keyboard focus, reduced motion, axe,
  console/network, local-clear confirmation, and installed-toolbar capability
  status.
- Reviewer A brief: inspect compact utility hierarchy, Capture context,
  Project Version identity, action grouping, recovery affordance, narrow
  wrapping, and popup restraint.
- Reviewer B brief: inspect Capture Session/Event/Asset semantics, Project and
  Project Version permissions, local/server recovery boundary, privacy,
  keyboard/axe/zoom/motion behavior, and exact diff scope.
- Rollback boundary: revert only the extension-capture candidate and its
  evidence/review records; preserve `537b3d5`, prior token evidence, all
  portal candidates, ledger truth, and the synthetic direct-popup fixture.

### organization-admin exact surface preflight

- Actual HEAD/worktree: `f125272` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; worktree was clean before this surface. The
  baseline evidence covers authenticated synthetic owner administration and
  only synthetic fixture members/compliance records.
- Surface and normal entries: authenticated `/organization/members` and
  `/organization/compliance`; owner/admin/editor/viewer role guards; populated,
  empty, loading, forbidden, unauthenticated, error/retry, invite validation,
  duplicate/revoke/copy failure, evidence filter/detail/retry/load-more,
  keyboard, narrow/reflow, and reduced-motion states.
- Current request/component graph: `App.tsx` resolves both routes;
  `PortalAppShell` owns shared navigation, authentication, breadcrumb, and the
  outer main landmark; `OrganizationMembersPage` owns member/invite loading,
  one-time invite display, copy/revoke/error states; `ComplianceTimelinePage`
  owns retained evidence filtering, pagination, detail disclosure, and error
  states; existing `api.ts` organization/compliance adapters remain the only
  request boundary in scope.
- Baseline browser proof: authenticated synthetic owner at
  `/organization/members` measured 1440px/body1440px, 900px document height,
  13 interactive controls, and 0 axe violations / 0 incomplete items; at
  390px it measured 390px/body390px, 1,128px document height, 13 controls,
  and 0/0 axe. The visual baseline showed weak page grouping, dead page-level
  CSS, and low-information member/invite cards. Baseline files are
  `docs/ui/147-organization-admin-before-members-desktop.png` and
  `docs/ui/147-organization-admin-before-members-narrow.png`.
- The existing compliance baseline was captured at 390px before this candidate:
  390px/body390px, 12,098px document height, 12 controls, and 0 axe
  violations / 0 incomplete items. Its visual baseline showed an unbounded
  evidence stream and weak card framing. Baseline file is
  `docs/ui/147-organization-admin-before-compliance-narrow.png`; a separate
  pre-change compliance desktop screenshot was not captured in this runner.
- Intended write set: members workspace region/page measure and tokenized
  cards/forms, compliance page measure and tokenized evidence cards, focused
  member test, browser evidence, and blind review records. No organization
  membership, invite token, compliance evidence, authorization, tenant, or
  API contract is intended to change.
- Explicitly out of scope: `PortalAppShell`/navigation redesign, server/schema/
  API/migrations, shared UI dependency changes, new dependencies, project
  compliance, invite-accept flow, and Documentation operations.
- Accepted constraints: only organization owners can mutate member/invite
  administration or view organization compliance; invite tokens are shown
  once and remain synthetic; retained evidence remains immutable/read-only;
  no private customer data may enter screenshots or review records.
- Focused failing test to add first: the members route exposes one named
  `Organization members` administration region while preserving the existing
  member/invite/API contract tests.
- Browser verification: members/compliance populated/empty/denied/error,
  invite validation and copy/revoke guards, evidence filter/detail/retry,
  1440px/390px/200% reflow, keyboard focus, reduced motion, axe,
  console/network, and no unintended mutation.
- Reviewer A brief: inspect admin hierarchy, invite form density, member and
  pending-invite row framing, compliance timeline measure, retained-evidence
  cards, narrow composition, and shared-shell boundary.
- Reviewer B brief: inspect owner-only invite/compliance semantics, one-time
  token/privacy boundary, immutable retained evidence, error/retry/filter
  behavior, keyboard/axe/zoom/motion, and exact diff scope.
- Rollback boundary: revert only the organization-admin candidate and its
  evidence/review records; preserve `f125272`, prior candidates, ledger truth,
  synthetic database state, and the existing compliance/member contracts.

### project-versions exact surface preflight

- Actual HEAD/worktree: `d34eafe` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; the worktree was clean before this surface. The
  baseline uses only the deterministic synthetic Plan 125 project and its
  active/default, active/non-default, and archived Project Version fixtures.
- Scope: authenticated owner `/projects/01K12500000000000000000002/settings`
  Project Versions management and
  `/projects/01K12500000000000000000002/versions/main` Project Version
  workspace. Existing create, update, reorder, Default, archive/restore,
  canonical-slug, Carry Forward, and Project Version context contracts remain
  in scope for verification; no lifecycle or permission semantics are being
  redefined.
- Baseline browser proof at 1440px: settings measured 1,440px body width,
  2,235px document height, 55 interactive controls, one main landmark, and 0
  axe violations with one existing incomplete textarea contrast-background
  probe. The workspace measured 1,440px body width, 900px document height, 23
  interactive controls, one main landmark, and 0 axe violations / 0 incomplete
  items. Baseline files are
  `docs/ui/147-project-versions-before-settings-desktop.png` and
  `docs/ui/147-project-versions-before-workspace-desktop.png`.
- Baseline browser proof at 390px: settings measured 390px body width,
  3,755px document height, 55 controls, one main landmark, and 0 axe
  violations with the same one incomplete textarea probe. The workspace
  measured 390px body width, 1,088px document height, 23 controls, one main
  landmark, and 0 axe violations / 0 incomplete items. Existing portal
  navigation items extend beyond the viewport as a shared-shell scroll
  behavior; the Project Version content itself is the bounded target.
  Baseline files are
  `docs/ui/147-project-versions-before-settings-narrow.png` and
  `docs/ui/147-project-versions-before-workspace-narrow.png`.
- Intended write set: Project Version management hierarchy and responsive
  form/list/card styling, workspace hierarchy and responsive cards/context,
  focused landmark/state tests, browser evidence, and blind review records.
  No Project, Project Version, Capture, Edition, Revision, Publication,
  organization authorization, tenant-isolation, immutable-content, or public
  URL behavior changes are authorized by this slice.
- Reviewer A brief: inspect Project Version identity, lifecycle hierarchy,
  create/edit density, active/archived grouping, workspace navigation cards,
  narrow composition, and shared-shell boundary.
- Reviewer B brief: inspect Project Version ownership and permissions, Default
  and archive invariants, permanent former-slug privacy/link semantics,
  Carry Forward boundary, error/retry behavior, keyboard/axe/zoom/motion, and
  exact diff scope.
- Rollback boundary: revert only the Project Version candidate and its
  evidence/review records; preserve `d34eafe`, prior candidates, ledger truth,
  synthetic database state, and the existing Project Version API contracts.

### capture-portal exact surface preflight

- Actual HEAD/worktree: `e37df02` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; the worktree was clean before this surface. The
  browser baseline uses only synthetic Plan 125 Capture Session fixtures and
  records no raw captured input or private URLs.
- Scope: authenticated owner `/projects/01K12500000000000000000002/versions/main/capture-sessions`
  list/create and Capture Session detail for synthetic canceled/capturing
  sessions. Existing event, asset, upload, reorder, edit, artifact creation,
  Project Version reassignment, read-only, and failure contracts remain API
  and component-test authority; this slice is composition only.
- Baseline browser proof at 1440px: the list measured 1,440px body width,
  900px document height, 23 interactive controls, one main landmark, and 0
  axe violations / 0 incomplete items. The populated list baseline showed
  weak header grouping, raw Project ID copy, long action labels, and loose
  metadata rows. Baseline file is
  `docs/ui/147-capture-portal-before-list-desktop.png`.
- Baseline browser proof at 390px: the list measured 390px body width,
  1,676px document height, 23 controls, one main landmark, and 0 axe
  violations / 0 incomplete items; the target content had no horizontal
  overflow while the shared portal navigation remained scrollable. Baseline
  file is `docs/ui/147-capture-portal-before-list-narrow.png`.
- Baseline detail proof at 1440px: synthetic canceled and capturing routes
  both rendered one main landmark, 25 controls, 1,006px document height, and
  0 axe violations / 0 incomplete items. The disposable browser fixture has
  no populated event/asset records, so populated timeline/asset visual proof
  remains component-test coverage rather than fabricated browser evidence.
  Baseline files are
  `docs/ui/147-capture-portal-before-detail-desktop.png` and
  `docs/ui/147-capture-portal-before-detail-populated-desktop.png`.
- Intended write set: Capture list/detail hierarchy and tokenized responsive
  CSS, removal of raw Project ID presentation where the existing Project
  Version context already identifies the scope, focused landmark/state tests,
  browser evidence, and blind review records. No Capture Session/Event/Asset,
  upload, artifact, Project Version, organization authorization, tenant,
  immutable-content, or public URL behavior changes are authorized.
- Reviewer A brief: inspect Capture Session identity, list row hierarchy,
  status/source badges, create affordance, metadata density, detail metrics,
  upload/events/assets framing, and narrow composition.
- Reviewer B brief: inspect Capture source immutability, asset protection,
  event/order/edit contracts, artifact creation and Project Version
  permission boundaries, read-only states, error/retry behavior,
  keyboard/axe/zoom/motion, and exact diff scope.
- Rollback boundary: revert only the Capture portal candidate and its
  evidence/review records; preserve `e37df02`, prior candidates, ledger truth,
  synthetic database state, and existing Capture API/component contracts.

### guides-internal exact surface preflight

- Actual HEAD/worktree: `0dc73d0` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; the worktree was clean before this surface. The
  browser baseline uses only the synthetic Plan 127 Guide fixture, including
  active, empty, archived, published-link, and immutable Revision records.
- Scope: authenticated owner/editor/viewer Guide library at
  `/projects/01K12500000000000000000002/versions/summer-release/guides`, active,
  empty, and archived Guide editor/preview routes, immutable Revision history,
  and immutable Revision preview. Existing Guide Edition/Working Draft,
  Capture-source, Publication/Publish Link, Project Version, role, and
  archive/restore contracts remain authoritative.
- Baseline browser proof at 1440px: list measured 1,403px document height and
  28 controls with one incomplete fixture-description contrast probe; editor
  measured 3,165px and 110 controls with three incomplete textarea/overlap
  probes; preview measured 2,582px and 29 controls with one real primary-link
  contrast violation; Revision history measured 900px and 27 controls with
  axe 0/0; Revision preview measured 900px and 22 controls with axe 0/0.
  Baseline files are `docs/ui/147-guides-internal-before-list-desktop.png`,
  `docs/ui/147-guides-internal-before-editor-desktop.png`,
  `docs/ui/147-guides-internal-before-preview-desktop.png`,
  `docs/ui/147-guides-internal-before-revisions-desktop.png`, and
  `docs/ui/147-guides-internal-before-revision-preview-desktop.png`.
- Baseline browser proof at 390px: list measured 1,812px and 28 controls with
  target overflow 0; editor measured 5,217px and 110 controls with two
  incomplete textarea probes; preview measured 3,241px and 29 controls with
  the same primary-link contrast violation; Revision history measured 1,026px
  and 27 controls with axe 0/0. The narrow Revision preview baseline was not
  captured before this candidate; the after route remains covered by the
  candidate evidence and component test.
- Intended write set: Guide library/editor/preview composition and responsive
  CSS, Revision history landmark/card hierarchy, named workspace tests, one
  preview action contrast correction, browser evidence, and blind review
  records. No Guide Edition/Working Draft, Capture source, asset, Publication,
  Publish Link, Project Version, permission, tenant, immutable Revision, or
  public URL behavior changes are authorized.
- Reviewer A brief: inspect library row hierarchy, Edition status, editor
  outline/canvas/inspector balance, screenshot/annotation framing, preview
  reading measure, Revision history, and 390px composition.
- Reviewer B brief: inspect Project Version and role boundaries, draft/archive
  semantics, immutable Revision/Publication behavior, Capture-source and asset
  protection, preview action contrast, error/retry/conflict behavior,
  keyboard/axe/zoom/motion, media limitation, and exact diff scope.
- Rollback boundary: revert only the Guide internal candidate and its
  evidence/review records; preserve `0dc73d0`, prior Guide public candidate,
  Demo/Documentation candidates, ledger truth, synthetic database state, and
  all Guide/Revision/Publication contracts.

### entry-onboarding exact surface preflight

- Actual HEAD/worktree before implementation: `85363ea` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The candidate is `f27714b` and the source diff is limited to the
  shared entry shell, entry CSS, invite card width, and one shell test.
- Surface and normal entries: public `/login`, `/setup`, and
  `/invites/:token`; login, first-run setup, and organization invite loading,
  ready/complete/unavailable/error, new-user, and existing-user states. The
  actual local instance reports `setup_required=false`, so the browser setup
  route is the truthful already-complete state. No safe loaded-invite token was
  seeded for browser evidence.
- Current component/request graph: `EntryPageShell` owns the brand-only header
  and public main wrapper; `LoginPage` owns login form state and safe next-path
  navigation; `FirstRunSetupPage` owns public instance-status and setup form
  state; `InviteAcceptPage` owns invite loading, acceptance, existing-user
  sign-in, and new-user form state. Existing API helpers and route contracts
  remain the authority.
- Baseline browser proof: login, setup, and invalid invite each rendered one
  main with no overflow and axe 0/0 at 1440×900 and 390×900. Login had four
  controls; setup had two; unavailable invite had one. Baseline files are the
  six `docs/ui/147-entry-onboarding-before-*.png` files.
- Intended write set: named `Entry workspace` main landmark, tokenized shell
  spacing and responsive min-height, login/setup/invite typography and form
  spacing, standard Invite card width, the focused shell test, browser
  evidence, and blind review records. No auth, setup, invite, cookie,
  organization membership, tenant, API, schema, migration, or public URL
  behavior changes are authorized.
- Explicitly out of scope: setup-ready or loaded-invite browser fixture
  creation, shared authenticated portal shell redesign, browser zoom tooling,
  global token-family repair tracked as P2-010, and new dependencies.
- Accepted constraints: brand-only public entry remains separate from portal
  navigation; setup and invite state truth remains API-owned; component tests
  cover branches unavailable in the safe local browser fixture; readable
  standard entry content remains centered and bounded at desktop and reflows
  at 390px.
- Focused failing test added first: `EntryPageShell.test.tsx` requires the
  shared main landmark to be named `Entry workspace`; it failed before the
  shell change and passes in the candidate.
- Browser verification: login, setup-complete, and invalid-invite routes at
  1440×900 and 390×900; keyboard Tab path; reduced-motion media; axe; console
  and page-error checks; no form or invite/setup mutation submitted. Ready,
  loaded-invite, and acceptance branches remain component-test verification.
- Reviewer A brief: inspect brand-only entry hierarchy, login form rhythm,
  setup/invite state framing, readable desktop measure, and 390px reflow.
- Reviewer B brief: inspect public-entry truth, auth/setup/invite boundaries,
  no credential or tenant leakage, loading/error/read-only/acceptance branch
  coverage, keyboard/axe/reduced-motion behavior, evidence safety, and exact
  diff scope.
- Rollback boundary: revert only `f27714b` and the entry evidence/review
  records; preserve `85363ea`, all prior accepted-pending-human candidates,
  ledger truth, synthetic database state, and existing auth/setup/invite
  contracts.

### public-access exact surface preflight

- Actual HEAD/worktree before implementation: `85deae4` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The candidate is `8e38ee4` and changes only the shared public
  Project Version selector and its focused test.
- Surface and normal entries: anonymous Guide `/p/plan127-public`, Demo
  `/d/plan128-public`, Documentation `/docs/:slug`, their version forms and
  embed variants, plus shared password/restricted/expired/revoked/unavailable
  state branches already owned by each reader. Browser content currently
  exposes one Guide Project Version; the Demo and Documentation slugs in this
  disposable seed render truthful unavailable states.
- Current component/request graph: `PublicVersionSelector` receives the
  immutable `PublicPublishLinkResponse`, renders a single-entry Project Version
  context or a multi-entry native select, and preserves the existing
  `public_url` plus optional `/embed` navigation. Guide, Demo, and
  Documentation reader pages own access/password/session state and remain
  unchanged.
- Baseline browser proof: valid Guide rendered one main, no target overflow,
  axe 0/0, and a loose `Version: Summer release` label at 1440×900 and 390×900.
  The available Demo slug rendered one-main truthful unavailable state with
  axe 0/0 at both widths. Baseline files are the four
  `docs/ui/147-public-access-before-*.png` files.
- Intended write set: Project Version label copy, accessible multi-entry
  combobox name, tokenized selector/chip CSS, focused selector tests, browser
  evidence, and blind review records. No Publish Link, access, password,
  viewer-session, Publication, Revision, Version-selection URL, tenant, API,
  schema, migration, or dependency behavior changes are authorized.
- Explicitly out of scope: creating a multi-entry or valid Demo/Documentation
  browser fixture, changing reader access branches, browser zoom tooling,
  global fallback repair tracked as P2-010, and redesigning the public readers
  already accepted under their own surface candidates.
- Accepted constraints: Project Version remains the domain term; native
  select behavior remains the keyboard/accessibility authority; a one-entry
  public link does not become an unnecessary interactive control; public
  content and access state remain immutable/API-owned.
- Focused failing tests added first: the single-entry selector names the
  Project Version explicitly, and the multi-entry selector exposes the
  `Public Project Version` combobox name; both failed before the candidate.
- Browser verification: valid Guide and truthful unavailable Demo at
  1440×900 and 390×900; reduced-motion media; axe; target no-overflow; console
  and page-error checks. Multi-entry behavior remains component-test evidence
  because the safe browser fixture has no multi-entry public link.
- Reviewer A brief: inspect Project Version context chip, selector hierarchy,
  native control styling, narrow reflow, and cross-reader quietness.
- Reviewer B brief: inspect exact public-link/Version selection behavior,
  access/password boundaries, no metadata or credential leakage, native
  keyboard/axe/reduced-motion behavior, fixture integrity, and exact diff.
- Rollback boundary: revert only `8e38ee4` and the public-access
  evidence/review records; preserve `85deae4`, accepted Guide/Demo/Documentation
  candidates, ledger truth, synthetic database state, and all public-link,
  Publication, Revision, and Version-selection contracts.

### extension-installation exact surface preflight

- Actual HEAD/worktree before implementation: `7893091` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The candidate is `1058dbd` and changes only the authenticated
  browser-extension installation page, its CSS module, and the App/page test
  seam.
- Surface and normal entries: authenticated `/extension` checking,
  unauthenticated, access-error, ready/download, and download-error states.
  The candidate proof covers the ready state; existing component tests cover
  the remaining branches.
- Current component/request graph: `BrowserExtensionPage` owns the auth check,
  authenticated bundle download, file-save callback, and installation guidance;
  `PortalAppShell` owns shared authenticated navigation. Existing API helpers,
  browser-extension bundle endpoint, and capture contracts remain authoritative.
- Baseline browser proof: original ready state rendered one main and ten
  controls at 1440×900 and 390×900 with no target overflow, but axe reported
  one real Capture-tools contrast violation and one incomplete gradient
  background probe over the download card. Baseline files are the two
  `docs/ui/147-extension-installation-before-*.png` files.
- Intended write set: named installation workspace region, tokenized header,
  download card, instruction grid, URL/code blocks, responsive stack, reduced
  motion rule, focused test, browser evidence, and blind review records. No
  auth, bundle, download, browser permission, capture, tenant, API, schema,
  migration, or dependency behavior changes are authorized.
- Explicitly out of scope: actually installing the browser toolbar extension,
  permission prompts, popup capture, shared portal-shell clipping, browser zoom
  tooling, and P2-010 global token-family repair.
- Accepted constraints: the portal remains an authenticated setup utility;
  the existing download button remains the only mutation; installation,
  connection, update, removal, and privacy guidance must remain truthful and
  domain-neutral.
- Focused failing test added first: `App.test.tsx` requires the ready page to
  expose an `Extension installation workspace` region; it failed before the
  candidate and passes with the wrapper.
- Browser verification: authenticated ready state at 1440×900 and 390×900;
  reduced-motion media; axe; target no-overflow; console, page-error, and
  failed-request checks; keyboard Tab path; no download submitted. Auth/error
  and download-failure branches remain component-test verification.
- Reviewer A brief: inspect installation hierarchy, download prominence,
  numbered-step scanability, code/value wrapping, desktop density, and narrow
  reflow.
- Reviewer B brief: inspect auth/download contract, no mutation or credential
  leakage, error-state coverage, named landmarks, keyboard/axe/reduced-motion
  behavior, evidence safety, and exact diff scope.
- Rollback boundary: revert only `1058dbd` and the extension-installation
  evidence/review records; preserve `7893091`, all prior accepted-pending-human
  candidates, ledger truth, synthetic database state, and extension bundle,
  auth, and capture contracts.

### design-system-gallery exact surface preflight

- Actual HEAD/worktree before implementation: `3adc9db` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The candidate is `7cf7057` and changes only the local
  `/__design-system` gallery, its CSS module, and the focused gallery test.
- Surface and normal entries: local development `/__design-system` with
  synthetic library, authoring workbench, reader, long-label, and shared state
  examples. It is not authenticated and makes no API calls.
- Current component graph: `DesignSystemReviewPage` composes existing
  `@repo/ui` Badge, Button, Card, Alert, Input, Label, Select, and Separator
  primitives. It owns only synthetic markup and CSS; no production route state
  is consumed.
- Baseline browser proof: desktop was 1,066px with one main, three regions,
  five controls, and no section overflow; narrow was 1,680px with one main,
  three regions, five controls, and section overflow from the table's 720px
  minimum. Baseline axe was 0 violations / 0 incomplete desktop and 0
  violations / 1 incomplete narrow contrast-background probe. Files are the
  four `docs/ui/147-design-system-gallery-before-*.png` files.
- Intended write set: named main, shared state matrix, focusable labeled table
  region, responsive long-label table, tokenized gallery spacing, focused test,
  browser evidence, and blind review records. No API, domain, permission,
  tenant, persistence, or dependency behavior changes are authorized.
- Explicitly out of scope: replacing `@repo/ui`, adding a component library,
  authenticated product fixtures, browser zoom tooling, and global P2-010
  token-family repair.
- Accepted constraints: this remains a local review gallery; every state is
  visibly synthetic; a narrow table may wrap rather than scroll when the
  specimen's long-label state can remain readable.
- Focused failing test added first: the gallery test requires a named main,
  shared state matrix, and Retry state action; it failed before the candidate.
- Browser verification: 1440×900 and 390×900, reduced motion, axe, keyboard Tab
  path, no page/section overflow, console/request checks, and synthetic-only
  content.
- Reviewer A brief: inspect pattern hierarchy, state matrix usefulness,
  desktop workbench density, long-label handling, and narrow recomposition.
- Reviewer B brief: inspect synthetic truth, semantic regions/table focus,
  state coverage, keyboard/axe/reduced-motion behavior, dependency boundary,
  and exact diff scope.
- Rollback boundary: revert only `7cf7057` and gallery evidence/review
  records; preserve `3adc9db`, all accepted candidates, and the existing UI
  primitives/token foundation.

### global-fallback exact surface preflight

- Actual HEAD/worktree before implementation: `7cf7057` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The candidate is `de37b5e` and changes only the final unsupported
  App fallback, its CSS, and the route test.
- Surface and normal entries: anonymous or authenticated unsupported paths such
  as `/unknown`, with Page-not-found copy and recovery to existing Projects or
  sign-in routes. Documentation lazy-load failure is an existing adjacent
  boundary and remains separate.
- Current component graph: `parsePortalRoute` returns `{ type: "unsupported" }`;
  `App` owns the final fallback card, `OssieBrand` owns the portal identity,
  and `portalDocumentTitle` already supplies `Page not found | Ossie`.
- Baseline browser proof: desktop and narrow each had 900px body height, one
  unlabeled main, no level-one heading, one brand link, axe one level-one
  heading violation plus one gradient-background incomplete probe. Baseline
  files are the four `docs/ui/147-global-fallback-before-*.png` files.
- Intended write set: level-one heading, named main, truthful recovery copy,
  existing Projects/sign-in links, solid fallback background, focused route
  test, browser evidence, and blind review records. Route parsing, auth,
  tenant, API, schema, public URL, and dependency behavior remain unchanged.
- Explicitly out of scope: forced lazy-load failure injection, Documentation
  route boundary redesign, browser zoom tooling, and P2-010 global token work.
- Accepted constraints: unsupported routes must remain generic and non-leaky;
  recovery actions must point only to existing safe entry routes.
- Focused failing test added first: unsupported-route test requires the named
  `Page not found workspace` main; it failed before the candidate.
- Browser verification: `/unknown` at 1440×900 and 390×900, reduced motion,
  axe, keyboard Tab path, no overflow, and console/request checks; no recovery
  link followed.
- Reviewer A brief: inspect heading/recovery hierarchy, bounded card density,
  narrow behavior, and action prominence.
- Reviewer B brief: inspect generic error truth, no metadata leakage, existing
  route/auth boundaries, heading/landmark/keyboard/axe/reduced-motion behavior,
  and exact diff scope.
- Rollback boundary: revert only `de37b5e` and fallback evidence/review
  records; preserve `7cf7057`, prior candidates, parser/title contracts, and
  existing Documentation error boundary.

### contributor-docs exact surface preflight

- Actual HEAD/worktree before implementation: `de37b5e` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The candidate is `ae37ba6` and changes only the public `apps/docs`
  hero evidence markup, CSS, and page test.
- Surface and normal entries: local Next.js `apps/docs` landing page with
  repository links, alpha capabilities, accepted target direction, committed
  safe alpha screenshots, and limitations. It is contributor/operator docs,
  not customer Product Documentation.
- Current component graph: `apps/docs/app/page.tsx` owns the landing composition;
  `docs-content.ts` owns source-link and capability copy; Next Image serves the
  committed local brand and evidence assets available under the runner's docs
  content path.
- Baseline browser proof: desktop was 2,789px and narrow 5,132px, one main,
  six headings, nine links, no page overflow, all four images loaded, axe 0
  violations with one incomplete invalid ARIA-label-on-div probe. Baseline
  files are the four `docs/ui/147-contributor-docs-before-*.png` files.
- Intended write set: semantic hero figure/caption, visually hidden caption
  style, focused page test, browser evidence, and blind review records. No
  Product Documentation route, source-of-truth content, external-link target,
  dependency, or product domain behavior changes are authorized.
- Explicitly out of scope: following external GitHub links, migrating docs into
  the customer Documentation app, new screenshots, browser zoom tooling, and
  unrelated docs content refresh.
- Accepted constraints: local evidence assets remain synthetic and safe; the
  compact contributor hub continues to point to Markdown source docs.
- Focused failing test added first: page test requires a semantic hero figure
  and visually hidden caption; it failed before the candidate.
- Browser verification: local docs app at 1440×900 and 390×900, reduced motion,
  axe, keyboard Tab path, image completion, no page overflow, and no external
  link navigation.
- Reviewer A brief: inspect first-viewport hierarchy, evidence figure clarity,
  source-link scanability, and narrow stacking.
- Reviewer B brief: inspect contributor-docs boundary, semantic image caption,
  local asset safety, keyboard/axe/reduced-motion behavior, and exact diff.
- Rollback boundary: revert only `ae37ba6` and contributor-docs evidence/review
  records; preserve `de37b5e`, current docs content, local assets, and the
  separation from customer Product Documentation.

### token-foundation follow-up exact surface preflight

- Actual HEAD/worktree before implementation: `105fc5b` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The follow-up candidate is `59fd07f` and changes only the
  canonical token source plus its focused source-contract test.
- Surface and normal consumers: live Documentation reader/editor fallbacks for
  link color, sans family, small text size, and medium radius; the shared web,
  extension, and UI token consumers remain the runtime graph.
- Current graph: `packages/ui/src/tokens.css` is imported by web and extension;
  the four consumers are in `PublicDocumentationReaderPage.module.css` and
  `DocumentationSiteEditorPage.module.css`. Existing fallbacks are link
  `#1d4ed8`, sans `--ossie-font-sans`, 14px, and 8px.
- Baseline proof: `pnpm check-css-tokens` reported exactly four undefined names;
  no rendered visual regression was present in the accepted token candidate.
- Intended write set: four semantic aliases, focused source-contract test,
  follow-up browser screenshots, review records, and ledger/plan reconciliation.
  No consumer rewrite, API, domain, permission, tenant, Publication,
  public-link, extension-permission, or dependency behavior changes are
  authorized.
- Explicitly out of scope: broad raw CSS migration, dead-code cleanup,
  contributor-app token migration, installed-toolbar capability, and visual
  redesign.
- Accepted constraints: each alias must preserve the existing consumer
  fallback exactly while resolving through the canonical token authority.
- Focused failing test added first: `packages/ui/src/tokens.test.ts` requires
  all four aliases and failed before the token implementation.
- Browser and repository verification: token test, full UI tests, extension
  tests/typecheck/lint/build, `pnpm check-css-tokens`, web broad suite, and
  `/__design-system` desktop/narrow axe/no-overflow/reduced-motion evidence.
- Reviewer A brief: inspect semantic mapping and confirm no rendered spacing,
  typography, radius, or color drift.
- Reviewer B brief: inspect definition/consumer completeness, fallback parity,
  dependency and product boundaries, browser/a11y evidence, and exact diff.
- Rollback boundary: revert only `59fd07f` and follow-up token evidence/review
  records; preserve `105fc5b`, the original token candidate, and all surface
  implementations.

### shared-foundation exact surface preflight

- Actual HEAD/worktree before implementation: `24b2395` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. The first candidate is `adef71a`; the final bounded follow-up is
  `9e53e20` and changes shared UI primitives, their focused tests, the local
  design-system gallery, its CSS, the dead-CSS audit test, and five proven
  orphaned declaration pairs.
- Surface and normal consumers: `@repo/ui` Button, Card, Alert, Badge, Label,
  Input, Select, Textarea, and Separator; live web and extension consumers
  continue to use the existing package exports and canonical token source.
- Gallery states: command hierarchy, shared loading/empty/error/read-only/
  validation, list/workbench, history/details drawer direction, reader code
  and missing media, access challenge, and compact extension ready/error/retry.
  All gallery data is synthetic and local-only.
- Intended write set: semantic token aliases and primitive class fragments,
  focused primitive/token/gallery tests, development-only gallery specimens and
  CSS, focused dead-CSS audit test, proven orphan CSS removal, browser evidence,
  blind reviews, and ledger/plan/bundle reconciliation. No API, persistence,
  domain, permission, tenant, immutable Capture/Revision/Publication,
  public-link, extension-permission, or dependency behavior changes are
  authorized.
- Focused failing tests were added before implementation for semantic tokens,
  primitive classes, gallery patterns, the typed warning Alert, and the
  orphaned-CSS audit. The initial candidate required one follow-up cycle to
  correct the code-region ARIA structure and complete the dead-CSS audit.
- Browser evidence: exact parent commit `24b2395` and candidate `9e53e20` at
  1440×900 and 390×900; axe 0/0, no overflow, reduced-motion, keyboard focus,
  local request/error checks. Installed extension-toolbar verification remains
  `blocked_local_for_run`; 200% browser zoom and broader raw CSS remain
  section 26.6 work.
- Reviewer A brief: inspect command hierarchy, responsive composition, shared
  primitive quietness, long content, missing media, access challenge, and
  compact extension states. Reviewer B brief: inspect product boundaries,
  semantic token completeness, ARIA/keyboard/axe/reduced-motion behavior,
  dead-CSS proof, and exact diff. Both accepted pending human review.
- Rollback boundary: revert `9e53e20` and `adef71a` plus their evidence/review
  records; preserve `24b2395`, the token-foundation follow-up, and all prior
  surface implementations.

### shared-shell-mobile exact surface preflight

- Actual HEAD/worktree before implementation: `a83f2ae` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. This bounded follow-up targets the shared `PortalAppShell`
  responsive navigation and will preserve all prior candidate commits.
- Surface and normal entries: `PortalAppShell` on portal routes, with the safe
  local `/projects` entry used for browser evidence and the existing component
  fixture carrying Project Version/project-admin and viewer contexts. The
  affected normal shell states are navigation, breadcrumbs, sign-out, denied
  content, and narrow reflow; route labels and active-link semantics remain
  unchanged.
- Current graph: `PortalAppShell.tsx` builds links through
  `buildPortalNavigation`, renders `PortalTopbar`, and owns the portal main
  landmark; `PortalAppShell.module.css` changes from a desktop grid to a
  horizontally scrollable `width: max-content` nav at `max-width: 860px`.
  All portal pages import this shell; no child page or API adapter is in the
  write set.
- Baseline browser proof: local `/projects` at 1440×900 has body/document
  width 1440 and a 199px portal nav; at 390×900 body/document width is 390 but
  the portal nav is 837px wide, visibly truncating labels. Baseline screenshots
  are `docs/ui/147-shared-shell-before-desktop.png` and
  `docs/ui/147-shared-shell-before-narrow.png`. The truthful unauthenticated
  `/projects` state has one pre-existing moderate axe heading violation; this
  candidate does not change the route content or claim that unrelated issue is
  fixed.
- Intended write set: `PortalAppShell.module.css`, one focused responsive CSS
  contract test, candidate desktop/narrow/320px browser evidence, blind review
  reports, and Plan/ledger/bundle reconciliation. No navigation labels, route
  ownership, authentication, permissions, Project Version, API, persistence,
  tenant, public-link, or domain semantics may change.
- Explicitly out of scope: PortalTopbar redesign, adding/removing portal
  destinations, authenticated fixture seeding, installed extension-toolbar
  verification, actual browser-zoom tooling, and unrelated page composition.
- Accepted constraints: desktop keeps the existing two-column shell; narrow
  navigation must wrap within the viewport with no horizontal scroll region,
  preserve visible focus and accessible names, and remain usable at 320px. A
  viewport/CSS zoom proxy is supplemental only because this environment does
  not expose a browser zoom control.
- Focused failing test to add first: a source-level responsive contract must
  require the narrow navigation to use an intrinsic-width-safe wrapping layout
  and must reject the current `width: max-content` overflow contract.
- Reviewer A brief: inspect mobile navigation hierarchy, label wrapping,
  desktop preservation, focus visibility, 320px composition, and screenshot
  difference. Reviewer B brief: inspect route/auth/permission boundary,
  accessible navigation semantics, keyboard order, axe/console/network truth,
  exact CSS scope, and no changes to product destinations.
- Rollback boundary: revert only the shared-shell candidate and its focused
  test/evidence/review records; preserve `a83f2ae`, all prior accepted-pending-
  human candidates, and the queued P2-002 status until final acceptance.

### projects-denied exact surface preflight

- Actual HEAD/worktree before implementation: `b5b7924` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean before the new baseline screenshots. This is cycle 1 for the
  previously accepted-pending-human `projects-workspace` candidate and is
  limited to its unauthenticated denied state.
- Surface and normal entry: `/projects` through the existing Project list
  loader, where an `unauthenticated` API result renders the shared portal shell
  and a sign-in recovery link. The route, `next` query, shell destinations,
  authorization response, and Project data contracts remain unchanged.
- Current graph: `ProjectListPage` maps `ApiClientError.kind ===
  "unauthenticated"` to a state card containing sign-in copy and
  `signInUrl(currentPath)`; `PortalAppShell` owns the page main landmark. The
  denied branch has no heading, which produces the full-page axe
  `page-has-heading-one` violation. Existing `ProjectListPage.test.tsx` owns
  the denied-state contract.
- Baseline browser proof at 1440×900 and 390×900: body/document width equals
  the viewport, nine controls, and no h1/h2/h3 headings. Baseline files are
  `docs/ui/147-projects-denied-before-desktop.png` and
  `docs/ui/147-projects-denied-before-narrow.png`. The shared shell mobile
  navigation is already the accepted `8b45a4b` candidate and is not being
  changed in this slice.
- Intended write set: denied-state heading/semantic wrapper, one focused
  Project list test assertion, after browser evidence, blind reviews, and
  Plan/ledger/bundle reconciliation. No API, auth, permission, tenant,
  Project, Project Version, public-link, or navigation behavior may change.
- Explicitly out of scope: populated/empty/create Project list composition,
  shared PortalAppShell CSS, sign-in implementation, setup/invite behavior,
  browser zoom tooling, and unrelated page text or lifecycle semantics.
- Accepted constraints: use a truthful level-one `Projects` heading in the
  denied state; preserve the existing sign-in sentence and link target. The
  route remains anonymous/unauthenticated browser evidence, and actual browser
  zoom remains unavailable in this environment.
- Focused failing test to add first: the existing unauthenticated Project list
  test must require a level-one `Projects` heading before the implementation.
- Reviewer A brief: inspect denied-state hierarchy, recovery-link prominence,
  desktop/narrow visual difference, and shell preservation. Reviewer B brief:
  inspect unauthorized truth, safe `next` URL, heading/landmark/keyboard/axe
  behavior, no data leakage, exact diff, and no API/domain changes.
- Rollback boundary: revert only the denied-state candidate and its focused
  test/evidence/review records; preserve `b5b7924`, `8b45a4b`, and all prior
  accepted-pending-human candidates.

### projects-state-semantics exact surface preflight

- Actual HEAD/worktree before implementation: `e67d392` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. This is cycle 2 for `projects-workspace`, limited to loading and
  recoverable-error state semantics after the denied-state cycle 1.
- Surface and normal entry: `/projects` through the existing Project list
  loader. The `loading` branch currently renders only `Loading projects...`,
  and the recoverable `error` branch renders only `Could not load projects.`
  plus the existing Retry button. Loaded, empty, denied, and create behavior
  remain outside this write set.
- Current graph: `ProjectListPage` owns `LoadState`, `listProjects`, retry via
  `reloadKey`, and the shared `PortalAppShell`; the existing tests already
  exercise loading, generic failure, retry, and eventual loaded content. No
  server/API adapter, route guard, permission, or data contract is changing.
- Baseline truth: loading and error component states have no level-one heading;
  the prior `/projects` browser route evidence proves the same shell and
  viewport-safe navigation. Browser network routing can safely hold the local
  projects request for loading and abort it for error without submitting a
  mutation or using customer data.
- Intended write set: loading/error semantic wrappers and status text, focused
  Project list assertions, safe local loading/error browser evidence, blind
  reviews, and Plan/ledger/bundle reconciliation. No API, auth, permission,
  tenant, Project, Project Version, public-link, or navigation semantics may
  change.
- Explicitly out of scope: loaded/empty/create/denied state content, shared
  shell CSS, retry implementation, server behavior, browser zoom tooling, and
  unrelated Documentation or extension states.
- Accepted constraints: loading uses a named `Projects` h1 plus a status
  message; recoverable error uses the same h1, an alert message, and the
  existing Retry action. The message remains truthful and the browser remains
  local/synthetic only.
- Focused failing tests to add first: the existing loading and generic-error
  Project list tests must require a level-one `Projects` heading before the
  implementation.
- Reviewer A brief: inspect state hierarchy, loading/error readability, retry
  prominence, desktop/narrow composition, and no visual drift in loaded states.
  Reviewer B brief: inspect status/alert semantics, retry continuity, API/auth
  boundary, keyboard/axe/network evidence, and exact diff.
- Rollback boundary: revert only this cycle-2 state-semantics candidate and its
  focused test/evidence/review records; preserve `e67d392`, the denied-state
  cycle-1 candidate, the shared-shell candidate, and all prior records.

### projects-workspace-state-semantics exact surface preflight

- Actual HEAD/worktree before implementation: `00628d1` in
  `/home/ubuntu/ossie-plan147`, branch `agent/plan-147-ui-quality`; worktree
  was clean. This is cycle 3, the final allowed cycle for `projects-workspace`,
  limited to its loading, unauthenticated, not-found, and recoverable-error
  branches after the Project list state-semantics cycle.
- Surface and normal entry: `/projects/:projectId` through the existing Project
  workspace route. `ProjectWorkspacePage` owns `LoadState`, `getProject`, and
  retry via `reloadKey`; `PortalAppShell` owns the shared shell and main
  landmark. Loaded workspace links, Project Version context, settings,
  membership, tenant, and permission semantics remain outside the write set.
- Baseline truth: loading, unauthenticated, not-found, and recoverable-error
  branches use generic state containers without a page-level `Projects` h1.
  The existing Retry action and safe sign-in `next` URL are already covered by
  component tests. Browser evidence will use only the truthful local 401 route
  and an intentionally aborted local Project request for error state.
- Intended write set: state-branch semantic wrappers and status/error text,
  focused workspace assertions, safe local browser evidence, two blind reviews,
  and Plan/ledger/bundle reconciliation. No API, auth, role, tenant, Project,
  Project Version, public-link, immutability, or navigation contract may change.
- Explicitly out of scope: loaded workspace composition and links, settings,
  membership, activity/compliance, shared-shell CSS, retry implementation,
  server/database behavior, browser zoom tooling, and unrelated feature states.
- Accepted constraints: each transient workspace branch keeps one `Projects`
  h1; loading uses `role=status`; recoverable error uses `role=alert`; denied
  and not-found copy remains truthful and retains its existing recovery or
  terminal behavior. This is a reversible accessibility/state-composition
  correction, not a new Project semantic.
- Focused failing tests to add first: loading, unauthenticated, not-found, and
  generic-error workspace tests must require a level-one `Projects` heading;
  loading/error tests must require their status/alert semantics.
- Reviewer A brief: inspect state hierarchy, recovery clarity, desktop/narrow
  composition, loaded-state visual parity, and whether the final cycle stays
  inside the workspace state boundary.
- Reviewer B brief: inspect auth/not-found/error truthfulness, retry continuity,
  keyboard/axe/network evidence, exact diff, and absence of Project/Project
  Version/tenant/permission changes.
- Post-implementation route recheck: `App.tsx` maps `project_workspace` to
  `LegacyProjectRedirect`; `ProjectWorkspacePage` is not mounted by the normal
  `/projects/:projectId` route. The local unauthenticated browser check
  returned API 401 and rendered the existing plain-text fallback, so the
  candidate's browser evidence is intentionally incomplete. Replacing or
  wrapping that route requires human direction on route ownership.
- Rollback boundary: revert only this cycle-3 workspace state candidate and its
  focused test/evidence/review records; preserve `aa6f892`, `3a8fad4`,
  `8b45a4b`, and all prior accepted-pending-human records.

### P2-001 cross-product consistency scope preflight

- Actual HEAD/worktree: `9468dcf` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; the worktree was clean before this audit.
- Current registry truth: the shipped library and reader families have
  independent route/state records and accepted-pending-human candidates;
  P2-001 is the only remaining queued issue. Its canonical row names only
  “cross-product libraries/readers” and does not identify exact routes, roles,
  states, viewport evidence, or an owning component.
- Concrete source finding: Reviewer A’s accepted Publication-preview review
  identifies a later decision about whether the bounded
  `DocumentationPublicationPreviewPage` should share navigation/TOC treatment
  with the public `PublicDocumentationReaderPage`. The preview’s current
  bounded composition is an intentional route-repair constraint, not a proven
  defect. Other family reviews record consistency as a score/residual, not a
  single implementation owner.
- Safe alternatives: (1) retain the bounded preview and close P2-001 as a
  documented intentional difference; (2) explicitly authorize a paired
  preview/public-reader chrome study with exact routes and states; or (3)
  define a different, narrower cross-product surface before implementation.
  Options (2) and (3) change accepted route composition and require human
  direction. No code, screenshot baseline, API, domain, permission, public-link,
  or immutable-content behavior was changed in this preflight.
- Disposition: `needs_human_surface`; preserve the queued family candidates,
  the existing Publication-preview review finding, and the final bundle. Do not
  manufacture an immutable candidate for an undefined cross-product scope.

### internal-library-state-semantics exact surface preflight

- Actual HEAD/worktree: `66b2a4f` in `/home/ubuntu/ossie-plan147`, branch
  `agent/plan-147-ui-quality`; the worktree was clean before this preflight.
- Exact route/component owners:
  - `/projects/:projectId/versions/:versionSlug/capture-sessions` → existing
    `ProjectVersionRouteBoundary` → `ProjectCaptureSessionListPage`.
  - `/projects/:projectId/versions/:versionSlug/guides` → existing
    `ProjectVersionRouteBoundary` → `ProjectGuideListPage`.
  - `/projects/:projectId/versions/:versionSlug/interactive-demos` → existing
    `ProjectVersionRouteBoundary` → `ProjectInteractiveDemoListPage`.
  - `/projects/:projectId/versions/:versionSlug/documentation` → existing
    Documentation route → `ProjectDocumentationSiteListPage`.
- Current state graph: Capture, Guide, and Interactive Demo list pages each
  own loading, unauthenticated, not-found, generic-error, retry, and loaded
  branches. Documentation Sites owns loading, error, and loaded/empty branches;
  its outer route owns authentication and Project Version access.
- Intended write set: focused tests and local CSS/JSX state wrappers in these
  four list components, browser evidence, two blind reviews, and ledger/plan/
  bundle reconciliation. No API calls, persistence, server/schema, Project or
  Project Version data, membership, tenant, permission, public-link,
  Publication/Revision/Capture immutability, mutation handler, or route parser
  changes are authorized.
- Accepted state rule: each transient branch receives one page-level h1 naming
  its library; loading remains the existing copy with `role=status`; generic
  errors remain the existing copy with `role=alert`; sign-in, not-found, and
  Retry copy/behavior remain unchanged. Documentation Sites retains its
  existing loading/error copy and only gains the same page heading semantics.
- Explicitly out of scope: loaded list/card composition, empty-state copy,
  create/import/publish controls, Project Version context, shared-shell CSS,
  public readers, the unresolved P2-001 route choice, browser zoom tooling, and
  all domain/permission behavior.
- Focused failing tests to add first: loading and recoverable-error assertions
  for all four list owners, plus the unauthenticated/not-found headings for
  Capture, Guide, and Interactive Demo.
- Browser verification: exact authenticated synthetic Project Version routes
  at desktop and narrow widths where the fixture/login remains available;
  otherwise component evidence must be labeled as such. Check axe, no
  overflow, reduced motion, keyboard Retry/sign-in reachability, console, and
  local request failures without submitting mutations.
- Reviewer A brief: inspect state hierarchy, transient-message prominence,
  narrow composition, and parity across the four library families.
- Reviewer B brief: inspect auth/not-found/error truthfulness, retry continuity,
  role/tenant/Project Version boundaries, axe/keyboard/motion behavior, and the
  exact diff for absence of API/domain changes.
- Rollback boundary: revert only this library-state candidate and its focused
  evidence/review records; preserve all prior candidates, P2-001’s
  `needs_human_surface` status, and the seeded disposable fixture.

## Checkpoints

| Date/time | Commit | Surface/state | Result | Next command |
| --- | --- | --- | --- | --- |
| 2026-08-06 | `d638112` | program setup | dedicated worktree established; runtime tools resolved; ledger opened | reset/migrate `ossie_test`, seed fixture, start API/web, health/login |
| 2026-08-06 | `c139780` | preflight/current truth | disposable DB seeded; runner services healthy; current truth reconciled; Publication route preflight recorded; focused docs test 5/5 | add Publication route implementation and candidate tests |
| 2026-08-06 | `001df10` | `documentation-previews` candidate | Publication route implemented through existing Publication→Revision contract; focused 22/22, full web 482/482, UI 7/7, typecheck/lint/build, browser/a11y evidence; both read-only reviews accept | human review of Plan 147 bundle; continue with next independent surface only after coordinator handoff |
| 2026-08-06 | `105fc5b` | `token-foundation` candidate | shared token source and repository check implemented; affected web/extension/UI checks, builds, browser/a11y evidence; both read-only reviews accept; extension toolbar remains locally unavailable | human review of Plan 147 bundle; continue with independent surface while retaining toolbar limitation |
| 2026-08-06 | `8055143` | `documentation-authoring` candidate | Site workbench separates Author, Site settings, Review, Content, Import/export, and Publish; focused Site 4/4, Page 6/6 isolated, App-focused pass, web typecheck/lint/build; browser desktop+narrow/keyboard/zoom/reduced-motion/axe evidence; both read-only reviews accept; serial web 482/483 with unrelated Guide failure | human review of Plan 147 bundle; continue with next independent surface while retaining viewer-browser and Guide-suite limitations |
| 2026-08-06 | `0ea64b9` | `documentation-public` candidate | public reader composition implemented through existing Publication snapshot and Fumadocs/native adapters; focused reader/request/OpenAPI 20/20, full web 483/483 serial, typecheck/lint/build/Prettier, browser route matrix and axe evidence pass; both read-only reviews accept | human review of Plan 147 bundle; continue with next independent surface while retaining password-route and shared-access limitations |
| 2026-08-06 | `e97647e` | `demos-internal` candidate | workbench hierarchy and Stage dominance corrected; authenticated editor/read-only asset hydration, keyboard resize, archived landmark, empty/archived/viewer/protected/broken/preview/Revisions evidence; focused 39/39, full web 485/485 serial, web typecheck/lint/build/Prettier; both read-only reviews accept | human review of Plan 147 bundle; retain existing textarea contrast probe and separate shared/public-access follow-up |
| 2026-08-06 | `fff22eb` | `demos-public` candidate | public shell, Version selection, immutable Scene playback, embed, password/access/unavailable states, tokenized responsive frame; focused 10/10, full web 486/486 serial, typecheck/lint/build, anonymous browser/a11y/network evidence; both read-only reviews accept | human review of Plan 147 bundle; retain browser zoom limitation, renderer media-failure coverage, and remaining queued families |
| 2026-08-06 | `953a7fa` | `guides-public` candidate | public Guide reader shell, bounded immutable block frame, empty/missing/broken media fallback, embed and access-state verification; focused/public-route 7/7, full web 488/488 serial, typecheck/lint/build, anonymous browser/a11y/network evidence; both read-only reviews accept | human review of Plan 147 bundle; retain no-public-empty-link fixture limitation, browser zoom limitation, and remaining queued families |
| 2026-08-06 | `aefb9dd` | `projects-workspace` candidate | Projects library composition, explicit landmark, responsive filter/card layout, archived empty state, and create-form hierarchy; focused 17/17, full web 489/489 serial, typecheck/lint/build, authenticated admin/viewer browser/a11y evidence; both read-only reviews accept | human review of Plan 147 bundle; retain shared-shell clipping, textarea probe, browser zoom limitation, and remaining queued families |
| 2026-08-06 | `0d11790` | `documentation-admin` candidate | Documentation operations header, usage grouping, owner-only limits policy, single shell-owned main, responsive/reduced-motion form, and viewer guard; focused 3/3, full web 490/490 serial, typecheck/lint/build, authenticated owner/viewer browser/a11y evidence; both read-only reviews accept | human review of Plan 147 bundle; retain shared-shell clipping, browser zoom limitation, and broader Documentation family work |
| 2026-08-06 | `106705c` | `extension-capture` candidate | local popup Capture action group, compact button wrapping, Project Version/selection context, and 180px reflow correction; extension 140/140, typecheck/lint/build, direct-popup browser/a11y evidence, both read-only reviews accept; installed toolbar remains blocked | preserve `blocked_local_for_run`; human review local popup evidence and rerun installed-toolbar path in a capable environment before treating the compact-utility pilot as complete |
| 2026-08-06 | `c4141a1` | `organization-admin` candidate | members/invites workspace and compliance timeline composition, owner/viewer denial and headed states, responsive/reduced-motion cards; focused organization-admin 13/13, full web 492/492 serial, typecheck/lint/build/diff, authenticated browser/a11y evidence, both read-only reviews accept | human review Plan 147 bundle; retain shared-shell clipping, browser zoom limitation, missing pre-change compliance desktop screenshot, and incomplete metric contrast-background probe; continue with remaining queued families |
| 2026-08-06 | `c93ca11` | `project-versions` candidate | Project Version management grouping, responsive create/edit/lifecycle cards, named workspace region, stacked narrow context identity; focused 12/12, full web 493/493 serial, web typecheck/lint/build, authenticated owner/viewer/active/archived browser and axe evidence, both read-only reviews accept | human review Plan 147 bundle; retain shared-shell clipping, browser zoom limitation, existing settings textarea probe, pre-existing repository CSS-token check failure, and remaining queued families |
| 2026-08-06 | `f4a6010` | `capture-portal` candidate | Capture list/create/detail hierarchy, named workspace regions, tokenized responsive cards/metrics/upload framing, owner/viewer browser and axe evidence; focused 58/58, full web 494/494 serial, web lint/build, both read-only reviews accept; populated Event/Asset browser records unavailable and not fabricated | human review Plan 147 bundle; retain shared-shell clipping, browser zoom limitation, existing create-form contrast probe, pre-restart HMR runner incident, resolved P2-010 token repair, and remaining queued families |
| 2026-08-06 | `ae217d0` | `guides-internal` candidate | Guide list/editor/preview and immutable Revision composition, named workspace regions, responsive hierarchy, preview contrast correction, owner/viewer browser and axe evidence; focused 19/19, full web 495/495 serial, web check-types/lint/build, both read-only reviews accept; fixture media limitation recorded | human review Plan 147 bundle; retain shared-shell clipping, browser zoom limitation, editor incomplete contrast probes, existing dev CSP/API-origin media limitation, resolved P2-010 token repair, and remaining queued families |
| 2026-08-06 | `f27714b` | `entry-onboarding` candidate | Entry shell, login/setup/invite composition, named main landmark, responsive standard width, keyboard/reduced-motion and truthful local browser evidence; focused 22/22, full web 495/495 serial, web check-types/lint/build, both read-only reviews accept | human review Plan 147 bundle; retain setup-ready and loaded-invite component-test limitation, browser zoom limitation, resolved P2-010 token repair, and remaining queued families |
| 2026-08-06 | `8e38ee4` | `public-access` candidate | Shared Project Version selector copy/semantics and tokenized responsive control; valid Guide/unavailable Demo browser and axe evidence; focused 16/16, full web 496/496 serial, web check-types/lint/build, both read-only reviews accept; multi-entry fixture remains component-test coverage | human review Plan 147 bundle; retain multi-entry and populated Demo/Documentation fixture limitations, browser zoom limitation, resolved P2-010 token repair, and remaining queued families |
| 2026-08-06 | `1058dbd` | `extension-installation` candidate | authenticated installation workspace hierarchy, named region, tokenized download/instruction cards, desktop/narrow browser and axe evidence; focused 22/22, full web 496/496 serial, web check-types/lint/build, both read-only reviews accept; installed toolbar remains unavailable and unclaimed | human review Plan 147 bundle; retain installed-toolbar/permission block under extension-capture, shared-shell clipping, browser zoom limitation, resolved P2-010 token repair, and remaining queued families |
| 2026-08-06 | `7cf7057` | `design-system-gallery` candidate | expanded local gallery with shared state matrix, named workspace, focusable table region, responsive long-label table, desktop/narrow axe and keyboard evidence; focused 21/21, web check-types/lint/build, both read-only reviews accept | human review Plan 147 bundle; retain synthetic/local-only boundary, browser zoom limitation, resolved P2-010 token repair, and final human review |
| 2026-08-06 | `de37b5e` | `global-fallback` candidate | unsupported route now has Page-not-found h1, named main, Projects/sign-in recovery, solid background, desktop/narrow axe and keyboard evidence; focused 1/1, web check-types/lint/build, both read-only reviews accept | human review Plan 147 bundle; retain forced Documentation failure boundary limitation, browser zoom limitation, resolved P2-010 token repair, and final human review |
| 2026-08-06 | `ae37ba6` | `contributor-docs` candidate | docs hero evidence is a semantic figure with caption; local desktop/narrow image, axe, keyboard and reduced-motion evidence; focused docs 10/10, docs check-types/lint/build, both read-only reviews accept | human review Plan 147 bundle; retain external-link non-navigation, separate customer Documentation boundary, browser zoom limitation, and final human review |
| 2026-08-06 | `59fd07f` | `token-foundation` follow-up candidate | four live semantic aliases added to canonical token source; token test 4/4, UI 8/8, extension 140/140, extension typecheck/lint/build, `pnpm check-css-tokens` 127/122, desktop/narrow browser axe 0/0, and both follow-up reviews accept | human review Plan 147 bundle; P2-010 resolved, retain installed-toolbar block and broader raw CSS cleanup as separate residuals |
| 2026-08-06 | `9e53e20` | `shared-foundation` candidate | semantic shared primitives and pattern gallery implemented; five proven orphan CSS pairs removed; UI 11/11, focused web 45/45, full web 94/497, extension 140/140, web/extension typecheck/lint/build, `pnpm check-css-tokens` 130/123, parent/candidate desktop+narrow axe 0/0 and no-overflow evidence, both blind reviews accept | human review Plan 147 bundle; retain installed-toolbar block, 200% zoom/raw CSS follow-ups, queued P2 dispositions, and human closeout |
| 2026-08-06 | `8b45a4b` | `shared-shell-mobile` candidate | PortalAppShell narrow navigation changed from a clipped horizontal rail to a wrapping grid; focused shell 6/6, full web 95/498, web typecheck/lint/build, desktop/390px/320px evidence, focused nav axe 0/0, keyboard/reduced-motion checks, both blind reviews accept | human review Plan 147 bundle; retain actual browser-zoom limitation, unauthenticated browser fixture limitation, P2-001, remaining cross-product matrix, and human closeout |
| 2026-08-06 | `3a8fad4` | `projects-denied` follow-up candidate | unauthenticated Project list state now has a semantic Projects h1; red/green focused test, Project list + shell 20/20, full web 95/498, web typecheck/lint/build, desktop/narrow axe 0/0 and no-overflow evidence, both blind reviews accept | human review Plan 147 bundle; retain authenticated fixture and browser-zoom limitations, existing Project create-form probe, P2-001, remaining cross-product matrix, and human closeout |
| 2026-08-06 | `aa6f892` | `projects-state-semantics` cycle-2 candidate | loading/error Project states now expose a semantic Projects h1, status/alert messaging, and the existing Retry action; ProjectListPage 17/17, App 20/20, shell 4/4, full web 95/498, web typecheck/lint/build, token check 130/123, desktop/narrow error axe 0/0 and no-overflow evidence, both blind reviews accept | human review Plan 147 bundle; retain loading browser-delay limitation, authenticated fixture and browser-zoom limitations, existing Project create-form probe, P2-001, remaining cross-product matrix, and human closeout |
| 2026-08-07 | `e94d6a9` | `projects-workspace` cycle-3 workspace-state candidate | component state semantics implemented and focused 9/9 plus adjacent 21/21 pass; route recheck found `/projects/:projectId` is still `LegacyProjectRedirect`, so the browser rendered the existing 401 fallback rather than `ProjectWorkspacePage`; final reviews record incomplete/needs-human | preserve `needs_human_surface`; do not change route ownership without human direction; retain the reversible candidate, route evidence, authenticated-fixture/zoom limitations, P2-001, and broader 26.6 matrix |
| 2026-08-07 | `3397152` | P2-001 scope preflight and public hardening evidence | P2-001 has no exact route/state owner and is now `needs_human_surface`; second clean public pass added 1024px Guide evidence, 390px CSS-zoom probes, and truthful unavailable Documentation/Demo evidence with axe 0/0 and no browser errors | human decision on P2-001 route scope; retain the four synthetic evidence screenshots and do not claim valid Documentation/Demo populated fixtures |
| 2026-08-07 | `ce1d373` + `b159eed` | `internal-library-state-semantics` candidate | TDD red run exposed 11 expected missing-heading/status/alert contracts; four list owners now have bounded transient-state headings and existing message semantics; focused list 34/34, App 20/20, full web 95/507, web typecheck/lint/build, CSS-token check 130/123, and diff check pass; authenticated 1440px error evidence for all four routes plus Documentation 390px reduced-motion/keyboard axe 0/0; both blind reviews accept | human review of Plan 147 bundle; loading and unauthenticated/not-found browser screenshots remain explicitly unclaimed; retain P2-001, workspace route ownership, extension toolbar, browser zoom, and broader 26.6 limitations |
| 2026-08-07 | `221517a` → `6c26074` | final engineering gates and second clean browser pass | recursive workspace tests, check-types 14/14, lint 13/13 with 89 existing warnings and zero errors, build 13/13, and diff check pass; fresh authenticated desktop/tablet/mobile samples and fresh anonymous Guide/embed/unavailable public samples all axe-clean with no page errors; closeout docs and screenshots committed | hand off `agent_accepted_pending_human`; retain actual 200% zoom, installed toolbar, broader state matrix, P2-001, and workspace route-ownership decisions for human review |
| 2026-08-07 | `106705c` → current evidence closeout | loaded extension and Capture lifecycle recheck | Chromium loaded the unpacked MV3 build, showed it enabled and pinnable, rendered the direct extension-origin Connect/Ready states with axe 0/0, completed a synthetic sign-in → Project/Project Version selection → Capture → portal-detail flow, and recorded final-path login/read/create/complete responses; extension storage was cleared and the dedicated services were stopped; the disposable database was reseeded with Documentation fixture | retain `blocked_local_for_run` for the unexercised toolbar-icon click; direct extension-origin evidence is supplemental, human review remains required, and no Plan 147 completion is inferred |
| 2026-08-07 | `106705c` → current evidence closeout | native 200% browser-zoom hardening | Chrome Page zoom was explicitly set to 200%; Documentation reader/operation and direct extension Connect/Ready states were exercised at `devicePixelRatio=2`; reader had one existing incomplete contrast-background probe, operation and extension were axe 0/0; no overflow or final-path request failures; zoom restored to 100%, storage cleared, services stopped | retain the unchecked broader 26.6 matrix and `blocked_local_for_run` toolbar-icon status; native 200% is now proven for these bounded samples only |
| 2026-08-07 | `106705c` → current evidence closeout | native 200% Interactive Demo hardening | Chrome Page zoom was explicitly set to 200%; valid reader, embed, keyboard Start→Finish transition, password invalid retry, and restricted/expired/revoked boundaries were exercised at `devicePixelRatio=2`; sampled widths stayed within 525px, axe was 0/0, no successful password submission or mutation was attempted; zoom restored to 100%, services stopped, and Documentation fixture was reseeded | retain the unchecked broader 26.6 matrix and `blocked_local_for_run` toolbar-icon status; this is bounded Demo evidence only and does not infer Plan 147 completion |
| 2026-08-07 | `2a3bd18` | native 200% authenticated/public boundary continuation | same-origin synthetic admin login reached Projects and Documentation Operations at native Page zoom 200%; separate viewer state lacked Owner-only limits controls; isolated anonymous Documentation reader had no portal chrome, axe 0/0, and Skip-to-content focus; sampled documents stayed within 517px; known Documentation metric contrast probe remained incomplete; zoom restored to 100%, storage cleared, services stopped | retain the unchecked broader 26.6 matrix, route-ownership/P2-001 human decisions, and `blocked_local_for_run` toolbar-icon status; these are bounded boundary samples only |

## Final bundle index

Assembled in [`docs/ui/147-plan-147-human-review-bundle.md`](./147-plan-147-human-review-bundle.md)
for autonomous-run milestone handoff:

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
