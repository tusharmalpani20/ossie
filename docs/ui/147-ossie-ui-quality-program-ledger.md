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
| `demos-internal` | Library/direct-manipulation workbench | Demo library/editor/scenes/hotspots/preview/Revisions/publishing | `d638112` | `e97647e` | 0 | `accept` — review A | `accept` — review B | focused Interactive Demo 39/39; full web 485/485 serial; web typecheck/lint/build/Prettier; authenticated active/empty/archived/viewer/preview/Revisions browser matrix; pointer/keyboard/zoom/reduced-motion; axe 0 violations | `agent_accepted_pending_human` | one existing incomplete textarea contrast probe on active/empty editor; shared shell/public access remain separate |
| `demos-public` | Viewer/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `documentation-admin` | Library/workbench/admin | Site library/operations/review/assets/snippets/OpenAPI/portability/publishing | `d638112` | — | 0 | — | — | — | `queued` | P1-003 pending |
| `documentation-authoring` | Authoring workbench | Site/Page draft authoring, comments, conflict, read-only, archived, validation | `d638112` | `8055143` | 0 | `accept` — review A | `accept` — review B | Site 4/4; Page 6/6 isolated; App-focused pass; web typecheck/lint/build; serial web 482/483 with unrelated Guide failure; authenticated desktop+narrow/keyboard/zoom/reduced-motion; axe 0 violations | `agent_accepted_pending_human` | viewer/archived browser session unavailable on isolated runner; component tests cover guards; unrelated Guide suite failure remains out of scope |
| `documentation-previews` | Reader/admin | draft, exact Site Revision, exact Site Publication preview; internal roles | `d638112` | `001df10` | 0 | `accept` — review A | `accept` — review B | web 482/482; UI 7/7; web typecheck/lint/build; browser desktop+narrow+anonymous; axe 0 violations | `agent_accepted_pending_human` | P2 reader-chrome and shared-shell polish remain outside this correctness candidate |
| `documentation-public` | Reader/API reference | Publication reader/search/TOC/operation/Try It/access challenge; anonymous/member | `d638112` | `0ea64b9` | 0 | `accept` — review A | `accept` — review B | focused reader/request/OpenAPI 20/20; full web 483/483 serial; web typecheck/lint/build/Prettier; anonymous desktop+narrow/keyboard/search/zoom/reduced-motion/route-variant/operation evidence; axe 0 violations and 0 incomplete | `agent_accepted_pending_human` | no deterministic seeded public-password route for browser screenshot; existing component tests cover challenge/retry; embed and shared access family remain separate |
| `public-access` | Shared access challenge | public/restricted/password/expired/revoked/version selection; anonymous | `d638112` | — | 0 | — | — | — | `queued` | shared contract audit pending |
| `token-foundation` | Shared pattern / design system | web `/__design-system`, authenticated portal shell, auth entry, Demo workbench/editor, Documentation library, extension popup; default/hover/focus/disabled/selected/error/read-only/reduced-motion | `d638112` | `105fc5b` | 0 | `accept` — review A | `accept` — review B | token check; web 8/8 focused; extension 140/140; UI 7/7; affected typecheck/lint/build; browser desktop+narrow+popup; axe 0 violations | `agent_accepted_pending_human` | installed extension-toolbar capability is `blocked_local_for_run`; narrow axe has one incomplete probe over intentional table scroll |
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
| `P1-002` | P1 | token system | Demo/auth/Documentation live CSS | Plan audit; undefined token inventory; current CSS consumer/definition inventory | implementer | 0 | accepted_pending_human | `105fc5b` | `check-css-tokens` passes; affected tests/builds and browser token/a11y evidence pass; both reviews accept | narrow gallery axe has one incomplete contrast check caused by partially obscured horizontal table text; no violations |
| `P1-003` | P1 | composition / architecture | Documentation authoring 390px | Plan audit; authenticated baseline measured at 6,845 CSS px and 136 interactive controls | implementer | 0 | accepted_pending_human | `8055143` | Site task boundaries, status persistence, focused state guards, browser/a11y evidence, and both reviews pass | viewer/archived browser session unavailable on isolated runner; unrelated Guide test failure remains separate |
| `P1-004` | P1 | reader composition | public Documentation reader 390px | Plan audit; anonymous Publication reader baseline measured and operation route verified | implementer | 0 | accepted_pending_human | `0ea64b9` | focused reader/request/OpenAPI 20/20; full web 483/483; typecheck/lint/build/Prettier; browser reader matrix and both reviews pass | deterministic password-route browser proof unavailable; no public snapshot, access, Try It, or URL contract changes |
| `P1-005` | P1 | workbench hierarchy / interaction | Interactive Demo editor | Plan audit; active synthetic fixture measured at 2,823px desktop / 4,683px narrow with permanent controls competing with the stage | implementer | 0 | accepted_pending_human | `e97647e` | focused Interactive Demo 39/39; full web 485/485; typecheck/lint/build/Prettier; active/empty/archived/viewer/preview/Revisions browser evidence; pointer/keyboard/zoom/reduced-motion; both reviews accept | one existing incomplete textarea contrast probe remains; no server/API/domain/public-link/immutability changes |
| `P1-006` | P1 | current truth | repository status/docs | Plan section 8 scan | coordinator | 0 | accepted_pending_human | `c139780` | current-truth reconciliation, focused `apps/docs` content tests 5/5, and narrowed stale-state scan pass | future/static-export language remains explicitly accepted-later; no shipped-state contradiction found in the audited sources |
| `P2-001` | P2 | visual consistency | cross-product libraries/readers | plan issue register | implementer | 0 | queued | — | family review | exact route ownership pending |
| `P2-002` | P2 | mobile composition | dense/authoring surfaces | plan issue register | implementer | 0 | queued | — | 390px/200% evidence | exact candidates pending |

## Review ledger

| Candidate | Surface | Reviewer | Verdict | Review artifact | P0/P1 findings | P2 dispositions | Gates / scores | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `001df10` | `documentation-previews` | A — visual/interaction | `accept` | `docs/ui/147-documentation-publication-preview-review-a.md` | none | `A-P2-001` accepted as later reader-family decision | scores 3–5; responsive score 3 because shared shell remains dense at 390px | accepted pending human |
| `001df10` | `documentation-previews` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-publication-preview-review-b.md` | none | `B-P2-001` accepted within existing immutable contract | all gates pass; axe 0 violations at desktop and 390px | accepted pending human |
| `105fc5b` | `token-foundation` | A — visual/interaction | `accept` | `docs/ui/147-token-foundation-review-a.md` | none | `A-P2-002` accepted as intentional table pattern | scores 3–5; responsive score 3 because narrow table scroll is intentional | accepted pending human |
| `105fc5b` | `token-foundation` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-token-foundation-review-b.md` | none | `B-P2-002` accepted with narrow axe limitation; toolbar block isolated | all gates pass for shared token candidate; extension toolbar `blocked_local_for_run` | accepted pending human |
| `8055143` | `documentation-authoring` | A — visual/interaction | `accept` | `docs/ui/147-documentation-authoring-review-a.md` | none | `A-P2-003` retained for deeper Content/Publish drawers; `A-P2-004` shared shell | scores 4–5; active route 1,269px desktop / 2,613px narrow; task boundaries and no page overflow | accepted pending human |
| `8055143` | `documentation-authoring` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-authoring-review-b.md` | none | `B-P2-003` viewer browser limitation; `B-P2-004` unrelated Guide failure | Site 4/4, Page 6/6 isolated, App-focused; axe 0 violations desktop+narrow; keyboard/zoom/reduced-motion pass | accepted pending human |
| `0ea64b9` | `documentation-public` | A — visual/interaction | `accept` | `docs/ui/147-documentation-public-review-a.md` | none | shared shell/search polish retained for later family work | scores 4–5; 1440px/390px composition, drawer, operation grouping, bounded code/table content, and zoom evidence pass | accepted pending human |
| `0ea64b9` | `documentation-public` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-public-review-b.md` | none | no deterministic password route; embed/shared access family remain separate | exact route variants, no metadata/credential leakage, inert examples, unavailable Try It, keyboard, axe, reduced-motion, and no target request pass | accepted pending human |
| `e97647e` | `demos-internal` | A — visual/interaction | `accept` | `docs/ui/147-interactive-demo-review-a.md` | none | shared portal shell and broader family polish remain separate | scores 4–5; stage dominance, bounded 12-scene navigator, contextual inspector, pointer/keyboard geometry, narrow/reflow, and disclosure pass | accepted pending human |
| `e97647e` | `demos-internal` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-interactive-demo-review-b.md` | none | existing textarea contrast probe and broader shared/public-access review remain separate | Edition/Working Draft and permission guards, asset credential boundary, archived landmark, route matrix, axe, reduced motion, and no unintended mutation pass | accepted pending human |

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
| `documentation-previews` | authenticated Publication 1 / desktop 1280px | synthetic Plan 125 fixture; Publication 1 → Revision 1 | agent-browser / Chromium; runner API 3022/web 3020 | route previously fell to generic portal fallback | implementation renders exact Publication/Revision identity and frozen pages; `docs/ui/147-publication-preview-after.png` | no | keyboard Tab reached Projects; reduced-motion media set; narrow overflow check `scrollWidth=clientWidth` | browser errors empty; authenticated calls succeeded; no failed requests observed | internal preview stays authenticated and does not use public link URL | `001df10` / 2026-08-06 |
| `documentation-previews` | authenticated Publication 1 / narrow 390×844 | synthetic Plan 125 fixture; Publication 1 → Revision 1 | agent-browser / Chromium | route previously fell to generic portal fallback | content and identity remain present at narrow width; `docs/ui/147-publication-preview-narrow.png`; page scroll width equals viewport width | no | reduced-motion media set; keyboard path exercised | no browser errors recorded | portal navigation remains a shared shell concern outside P1-001 | `001df10` / 2026-08-06 |
| `documentation-previews` | anonymous internal Publication 1 | same synthetic local route | separate agent-browser session | no internal route branch | explicit `Sign in to view this Project Version.` gate | no | not applicable | no browser errors recorded | internal route did not leak Publication metadata to anonymous user | `001df10` / 2026-08-06 |
| `token-foundation` | authenticated `/__design-system` / desktop 1280px | synthetic design-system gallery; no auth data or customer content | agent-browser / Chromium; runner web 3020 | partial duplicated tokens and undefined consumers | shared computed tokens resolve (`space2=8px`, `background=#f7f8fb`, border alias resolves); axe 0 violations / 36 passes; `docs/ui/147-token-foundation-desktop.png` | no | keyboard reached New capture; reduced-motion enabled for final pass | browser errors empty; console only Vite/React development notices and a transient runner reconnect during HMR | no visual baseline approved; gallery remains a synthetic pattern surface | `105fc5b` / 2026-08-06 |
| `token-foundation` | authenticated `/__design-system` / narrow 390×844 | same synthetic design-system gallery | agent-browser / Chromium | long copy clipped in narrow gallery and one h5 heading skipped level | heading is h4; descriptive copy intrinsic width is 354px; document width equals viewport; axe 0 violations / 37 passes; `docs/ui/147-token-foundation-narrow.png` | no | reduced-motion enabled; keyboard path exercised; axe incomplete contrast check is limited to text partially obscured by intentional horizontal table scroll | browser errors empty; no failed requests after runner restart | table remains an intentional horizontal-scroll pattern at narrow width | `105fc5b` / 2026-08-06 |
| `token-foundation` | extension popup root / 360px normal | deterministic unconfigured extension state; no credentials | agent-browser / Chromium served by local extension Vite 3030 | browser toolbar install unavailable in this environment | Connect instance state renders with shared token CSS; axe 0 violations / 27 passes; `docs/ui/147-token-extension.png` | no | semantic form labels; actual browser toolbar path unavailable and not claimed | browser errors empty | local Vite popup preview is evidence of app rendering, not installed-extension toolbar evidence | `105fc5b` / 2026-08-06 |
| `documentation-authoring` | authenticated Site / desktop 1440×900 | synthetic Plan 125 admin; active Edition, 2 Pages, Working Draft v13 | agent-browser / Chromium; runner API 3022/web 3020 | 4,743px high, 136 interactive controls, all panels continuous; `docs/ui/147-documentation-authoring-before.png` | Author task default with navigator/canvas/inspector/status; 1,269px high, 50 visible interactive controls; `docs/ui/147-documentation-authoring-after-desktop.png` | no | axe 0 violations / 0 incomplete; reduced-motion and keyboard path rechecked | browser errors empty; task child requests succeeded; no failed candidate requests | all existing capabilities moved behind named task tabs; Page blocks remain on the dedicated Page route | `8055143` / 2026-08-06 |
| `documentation-authoring` | authenticated Site / narrow 390×844 | same synthetic admin fixture | agent-browser / Chromium | 6,845px high, 136 interactive controls, page width 390; `docs/ui/147-documentation-authoring-before-narrow.png` | Author task 2,613px high, 50 visible interactive controls, page width 390; `docs/ui/147-documentation-authoring-after-narrow.png` | no | axe 0 violations / 0 incomplete; ArrowRight/Enter switches tasks; reduced-motion enabled | browser errors empty; no failed candidate requests | task row has intentional bounded horizontal scroll; no page overflow | `8055143` / 2026-08-06 |
| `documentation-authoring` | authenticated Site / 200% zoom/reflow probe | same synthetic admin fixture | agent-browser / Chromium | continuous route had no bounded task ownership | `documentElement.style.zoom=2` probe retained `scrollWidth=390`, `bodyScrollWidth=390`, and no page overflow; `docs/ui/147-documentation-authoring-zoom.png` | no | keyboard/selected task state retained before probe | no browser errors recorded | probe is supplemental reflow evidence; browser zoom control itself is environment-limited | `8055143` / 2026-08-06 |
| `documentation-authoring` | dedicated Page canvas smoke / narrow 390×844 | synthetic Page `Install`; active editor with comments and typed blocks | agent-browser / Chromium | route unchanged | Page editor rendered title, metadata, blocks, assets, comments, Save Page, and dedicated Page status; axe 0 violations with 1 existing incomplete textarea contrast probe | no | Page smoke only; no Page editor code changed | browser errors empty; no failed candidate requests | Page route remains the content canvas and retains existing incomplete-probe limitation | `8055143` / 2026-08-06 |
| `documentation-public` | anonymous valid Publication / desktop 1440×900 | synthetic Plan 125 public Publication; Install page, typed blocks, safe fixture asset | agent-browser / Chromium; runner API 3022/web 3020 | baseline exact reader, 12 interactive controls; `docs/ui/147-documentation-public-before-desktop.png` | public shell, navigation rail, search, breadcrumb, article measure, typed content, adjacent navigation; 1,123px document height, 13 interactive controls; `docs/ui/147-documentation-public-after-desktop.png` | no | axe 0 violations / 0 incomplete / 48 passes; reduced-motion set; valid route reload pass | browser errors empty; no failed target requests | Publication content, public identity, and link semantics remain unchanged; CSS/semantic reader composition only | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous valid Publication / narrow 390×844 | same synthetic public Publication | agent-browser / Chromium; runner API 3022/web 3020 | baseline exact reader, 12 interactive controls; `docs/ui/147-documentation-public-before-narrow.png` | drawer control replaces rail, article remains readable; 1,192px document height, 13 interactive controls; `docs/ui/147-documentation-public-after-narrow.png` | no | axe 0 violations / 0 incomplete / 48 passes; click and Enter drawer open/close; reduced-motion set | browser errors empty; page and body scroll widths 390px | navigation is intentionally a controlled drawer at narrow width | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous valid Publication / 200% reflow | same synthetic public Publication | agent-browser / Chromium | no bounded reader composition | `documentElement.scrollWidth=390` during zoom probe; reset restored body width 390px; `docs/ui/147-documentation-public-zoom.png` | no | focused keyboard/zoom path retained; reduced-motion media matched | no browser errors recorded | CSS zoom is a supplemental reflow probe; browser zoom controls are environment-limited | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous API operation / narrow 390×844 | synthetic GET and unsupported POST operation descriptors | agent-browser / Chromium; runner API 3022/web 3020 | inert request examples, Copy/Download, and unavailable Try It baseline | h1→h2→h3 example hierarchy; operation bounded to 390px; unavailable Try It message remained truthful; `docs/ui/147-documentation-public-operation-after.png` | no | axe 0 violations / 0 incomplete; no `api.example.com` target request executed | browser errors empty; target request count 0 | examples remain placeholders; action never changes credential or target-request policy | `0ea64b9` / 2026-08-06 |
| `documentation-public` | anonymous search and route variants | synthetic public Publication; alias, redirect, gone, unsupported operation | agent-browser / Chromium; runner API 3022/web 3020 | alias/redirect/gone and search contracts unchanged | `API` search returned 2 results; alias canonicalized, setup redirected, obsolete stayed generic unavailable; unsupported POST remained inert | no | valid/operation axe 0 violations; keyboard drawer/search exercised | browser errors empty; no failed requests observed | no internal IDs, credentials, or private metadata exposed | `0ea64b9` / 2026-08-06 |
| `demos-internal` | authenticated active editor / desktop 1440×900 | synthetic Plan 128 admin; 12 Scenes, Capture assets, Working Draft | agent-browser / Chromium; runner API 3022/web 3020 | 2,823px document height, 101 controls, permanent metadata/Publishing stack; `docs/ui/147-interactive-demo-before-desktop.png` | 2,141px document height, 101 controls, wider Stage, bounded Scene grid, collapsed Publishing & history; `docs/ui/147-interactive-demo-after-desktop.png` | no | axe 0 violations / 1 incomplete existing textarea contrast probe; image natural width 1 after authenticated hydration | pointer/keyboard geometry exercised; reduced-motion and active reload pass; no horizontal overflow | API requests all 200 including authenticated asset fetch; browser errors empty | Edition/Working Draft, Publication, and mutation contracts unchanged | `e97647e` / 2026-08-06 |
| `demos-internal` | authenticated active editor / narrow 390×844 | same synthetic Plan 128 admin fixture | agent-browser / Chromium | 4,683px document height, 101 controls, clipped horizontal Scene rail; `docs/ui/147-interactive-demo-before-narrow.png` | 3,011px document height, 101 controls, Scene rail client/scroll width 354px; `docs/ui/147-interactive-demo-after-narrow.png` | no | axe 0 violations / 1 incomplete existing textarea contrast probe; page and body scroll widths 390px | 200% CSS zoom retained no horizontal overflow; reduced-motion matched; disclosure collapsed by default | no browser errors or failed candidate requests observed | rail is an intentionally bounded local scroll region; page remains width-safe | `e97647e` / 2026-08-06 |
| `demos-internal` | empty, archived, viewer, protected/broken asset states | same synthetic Plan 128 fixture; admin and viewer sessions | agent-browser / Chromium; runner API 3022/web 3020 | empty/archived/viewer states remained existing behavior | empty shows `No scenes yet.`; archived/read-only has one top-level `main` and disabled publication mutation; viewer has no editor mutations; protected asset stays disabled; broken asset shows truthful fallback and hides controls | no | empty active axe 0/1 incomplete; archived/viewer axe 0/0; archived `mainCount=1`; focused tests cover guards | viewer, archived, broken/protected route checks completed; reload restored fixture state | no browser errors; no mutations persisted | shared permission/public-link semantics remain outside candidate | `e97647e` / 2026-08-06 |
| `demos-internal` | preview and Revision history | same synthetic Plan 128 fixture; Working Draft preview and immutable Revisions | agent-browser / Chromium; runner API 3022/web 3020 | routes were present but not composition-reviewed | preview renders hydrated Stage/Hotspot playback; Revision history shows immutable Revision entries and preview links | no | preview axe 0/0; Revision history axe 0/0 | keyboard route navigation and reduced-motion-compatible playback controls present | browser errors empty; no failed requests observed | no Publication/Revision identity or immutability changes | `e97647e` / 2026-08-06 |

## Decision ledger

| Decision | Recommendation / rationale | Alternatives | Scope | Status |
| --- | --- | --- | --- | --- |
| Browser evidence tooling | Continue with repository-approved `agent-browser`; do not add Playwright/axe without the Plan 147 dependency gate and user approval | dependency decision packet later | evidence only | accepted within plan |
| Token authority | Designate `packages/ui/src/tokens.css` as the canonical semantic Ossie token source; web and extension import it, while legacy generic names become explicit aliases | duplicate app-local definitions or silent raw values | shared styling | accepted within Plan 147 scope; implementation pending |
| Database | Reset only local `ossie_test` via guarded testing commands and seed existing deterministic fixtures | a new Plan 147 namespace if existing fixture coverage is insufficient | local verification | pending command evidence |

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
