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
| `organization-admin` | Administration/list | organization members/invites/compliance/Documentation operations; owner/admin/editor/viewer | `f125272` | `c4141a1` | 0 | `accept` — review A | `accept` — review B | focused organization-admin 13/13; full web 492/492 serial; web typecheck/lint/build/diff; authenticated owner/viewer members/compliance browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; no pre-change compliance desktop screenshot; one incomplete contrast-background probe over partially sampled metric values |
| `projects-workspace` | Dense library/workspace | project library/workspace/create/archive; owner/admin/editor/viewer | `c6ee819` | `aefb9dd` | 0 | `accept` — review A | `accept` — review B | focused Project 17/17; full web 489/489 serial; web typecheck/lint/build; authenticated admin/viewer active/archived/create browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; one existing incomplete create-form textarea contrast probe |
| `project-versions` | Context/admin/timeline | Project Version context/settings/create/reorder/default/archive/restore/activity/Carry Forward | `d34eafe` | `c93ca11` | 0 | `accept` — review A | `accept` — review B | focused Project Version 12/12; full web 493/493 serial; web typecheck/lint/build; authenticated owner/viewer active/non-default/archived browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; existing settings textarea probe; pre-existing repository CSS-token check failure is queued as P2-010 |
| `capture-portal` | Library/workbench | Capture library/create/detail/assets/events/upload/retry/final/read-only | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `guides-internal` | Library/workbench/reader | Guide library/editor/preview/Revisions/publishing; admin/editor/viewer/public | `d638112` | — | 0 | — | — | — | `queued` | route/state expansion pending |
| `guides-public` | Reader/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | `953a7fa` | 0 | `accept` — review A | `accept` — review B | focused Guide/public-route 7/7; full web 488/488 serial; web typecheck/lint/build; anonymous reader/embed/access browser matrix; axe 0 violations / 0 incomplete; no browser errors or failed local requests | `agent_accepted_pending_human` | no seeded public empty-link route; empty/missing/broken media are component-tested; browser zoom controls are environment-limited |
| `demos-internal` | Library/direct-manipulation workbench | Demo library/editor/scenes/hotspots/preview/Revisions/publishing | `d638112` | `e97647e` | 0 | `accept` — review A | `accept` — review B | focused Interactive Demo 39/39; full web 485/485 serial; web typecheck/lint/build/Prettier; authenticated active/empty/archived/viewer/preview/Revisions browser matrix; pointer/keyboard/zoom/reduced-motion; axe 0 violations | `agent_accepted_pending_human` | one existing incomplete textarea contrast probe on active/empty editor; shared shell/public access remain separate |
| `demos-public` | Viewer/embed | valid/password/restricted/revoked/expired/unknown/embed; anonymous | `d638112` | `fff22eb` | 0 | `accept` — review A | `accept` — review B | focused renderer/public 10/10; full web 486/486 serial; web typecheck/lint/build; anonymous reader/embed/version/access browser matrix; axe 0 violations / 0 incomplete; no browser errors or failed local requests | `agent_accepted_pending_human` | browser zoom controls are environment-limited; missing/broken media remains covered by renderer tests and internal synthetic routes |
| `documentation-admin` | Library/workbench/admin | Site library/operations/review/assets/snippets/OpenAPI/portability/publishing | `57226fa` | `0d11790` | 0 | `accept` — review A | `accept` — review B | focused Documentation operations 3/3; full web 490/490 serial; web typecheck/lint/build; authenticated owner/viewer usage and limit browser matrix; axe 0 violations; no browser errors or failed local requests | `agent_accepted_pending_human` | shared portal navigation clipping remains out of scope; browser zoom controls are environment-limited; broader Site library/editor surfaces remain separate |
| `documentation-authoring` | Authoring workbench | Site/Page draft authoring, comments, conflict, read-only, archived, validation | `d638112` | `8055143` | 0 | `accept` — review A | `accept` — review B | Site 4/4; Page 6/6 isolated; App-focused pass; web typecheck/lint/build; serial web 482/483 with unrelated Guide failure; authenticated desktop+narrow/keyboard/zoom/reduced-motion; axe 0 violations | `agent_accepted_pending_human` | viewer/archived browser session unavailable on isolated runner; component tests cover guards; unrelated Guide suite failure remains out of scope |
| `documentation-previews` | Reader/admin | draft, exact Site Revision, exact Site Publication preview; internal roles | `d638112` | `001df10` | 0 | `accept` — review A | `accept` — review B | web 482/482; UI 7/7; web typecheck/lint/build; browser desktop+narrow+anonymous; axe 0 violations | `agent_accepted_pending_human` | P2 reader-chrome and shared-shell polish remain outside this correctness candidate |
| `documentation-public` | Reader/API reference | Publication reader/search/TOC/operation/Try It/access challenge; anonymous/member | `d638112` | `0ea64b9` | 0 | `accept` — review A | `accept` — review B | focused reader/request/OpenAPI 20/20; full web 483/483 serial; web typecheck/lint/build/Prettier; anonymous desktop+narrow/keyboard/search/zoom/reduced-motion/route-variant/operation evidence; axe 0 violations and 0 incomplete | `agent_accepted_pending_human` | no deterministic seeded public-password route for browser screenshot; existing component tests cover challenge/retry; embed and shared access family remain separate |
| `public-access` | Shared access challenge | public/restricted/password/expired/revoked/version selection; anonymous | `d638112` | — | 0 | — | — | — | `queued` | shared contract audit pending |
| `token-foundation` | Shared pattern / design system | web `/__design-system`, authenticated portal shell, auth entry, Demo workbench/editor, Documentation library, extension popup; default/hover/focus/disabled/selected/error/read-only/reduced-motion | `d638112` | `105fc5b` | 0 | `accept` — review A | `accept` — review B | token check; web 8/8 focused; extension 140/140; UI 7/7; affected typecheck/lint/build; browser desktop+narrow+popup; axe 0 violations | `agent_accepted_pending_human` | installed extension-toolbar capability is `blocked_local_for_run`; narrow axe has one incomplete probe over intentional table scroll |
| `extension-installation` | Setup utility | extension check/auth/error/ready/download/update/remove | `d638112` | — | 0 | — | — | — | `queued` | extension browser capability pending |
| `extension-capture` | Focused task utility | unconfigured/signed out/in/selection/recording/recovery/completion/error | `537b3d5` | `106705c` | 0 | `accept` — review A | `accept` — review B | focused extension 140/140; extension typecheck/lint/build; direct synthetic popup active/selection 360px and 180px proxy; axe 0 violations; no direct-popup browser errors | `blocked_local_for_run` | installed toolbar action/permission path unavailable in this runner; 180px has one incomplete contrast-background probe over overlapping long labels; Child 126 installed evidence remains prior evidence only |
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
| `P2-003` | P2 | public viewer composition | `demos-public` valid reader/embed, 1440px and 390px | surface preflight; baseline showed weak published context and ungrouped playback frame | implementer | 0 | accepted_pending_human | `fff22eb` | public shell, Version selection, Scene playback, access states, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | browser zoom control is environment-limited; shared public-access family remains separate |
| `P2-005` | P2 | public reader composition | `guides-public` valid reader/embed, 1440px and 390px | surface preflight; baseline showed sparse chrome, weak content measure, and unframed Guide block | implementer | 0 | accepted_pending_human | `953a7fa` | public shell, immutable block frame, media fallback, access states, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | no seeded public empty-link route; shared public-access family remains separate |
| `P2-006` | P2 | workspace composition | `projects-workspace` active/archived/create, 1440px and 390px | surface preflight; baseline showed a sparse desktop field, weak filter grouping, and loose card hierarchy | implementer | 0 | accepted_pending_human | `aefb9dd` | Project library landmark, active/archived/empty/create states, axe, keyboard focus, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | shared portal navigation clipping and one existing incomplete create-form textarea contrast probe remain separate; browser zoom controls are environment-limited |
| `P2-007` | P2 | administration composition | `documentation-admin` usage/limits, owner and viewer, 1440px and 390px | surface preflight; baseline had a nested main landmark, ungrouped metrics, and an oversized policy form | implementer | 0 | accepted_pending_human | `0d11790` | single shell-owned main, named usage/limits regions, owner-only controls, responsive policy form, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | shared portal navigation clipping and browser zoom limitation remain separate; Site library/editor family is not included |
| `P2-008` | P2 | compact utility composition | `extension-capture` selection/active, 360px and 180px proxy | surface preflight; baseline showed action competition and no named capture-action group | implementer | 0 | blocked_local_for_run | `106705c` | named action group, compact wrapping, direct popup axe/reflow/motion evidence, extension 140/140, typecheck/lint/build, and both reviews pass | installed toolbar/permission path unavailable; 180px contrast probe incomplete; no installed-toolbar claim |
| `P2-009` | P2 | administration composition | `organization-admin` members/invites/compliance, owner and viewer, 1440px and 390px | surface preflight; baseline showed weak page grouping, loose member/invite cards, and an unbounded compliance evidence stream | implementer | 0 | accepted_pending_human | `c4141a1` | named members workspace, responsive invite/member/pending-invite cards, bounded compliance timeline, headed denial state, axe, reduced-motion, no-overflow, typecheck/lint/build, full web suite, and both reviews pass | shared portal navigation clipping, browser zoom limitation, missing pre-change compliance desktop screenshot, and one incomplete metric contrast-background probe remain recorded |
| `P2-010` | P2 | token consistency | existing Documentation reader/editor CSS fallback consumers surfaced during Project Version verification | `pnpm check-css-tokens` on 2026-08-06; names are outside Project Version CSS | coordinator | 0 | queued | — | Project Version CSS introduces no undefined token names; focused tests, typecheck, lint, and build pass | pre-existing `--ossie-color-link`, `--ossie-font-family-sans`, `--ossie-font-size-sm`, and `--ossie-radius-md` consumers remain for token-family follow-up |
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
| `fff22eb` | `demos-public` | A — visual/interaction | `accept` | `docs/ui/147-interactive-demo-public-review-a.md` | none | embed restraint and shared public-access family remain separate | published context, stage dominance, narrow composition, Version selection, Scene playback, and no overflow pass | accepted pending human |
| `fff22eb` | `demos-public` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-interactive-demo-public-review-b.md` | none | browser zoom control limitation recorded; missing/broken media remains renderer coverage | access/error states, no authoring leakage, immutable/public-link boundary, axe 0/0, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `953a7fa` | `guides-public` | A — visual/interaction | `accept` | `docs/ui/147-guide-public-review-a.md` | none | empty-link fixture and shared public-access family remain separate | published context, block measure, media framing, empty state, embed restraint, narrow composition, and no overflow pass | accepted pending human |
| `953a7fa` | `guides-public` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-guide-public-review-b.md` | none | no seeded public empty-link route; component media fallback coverage retained | Publication/Revision/access/embed boundary, no authoring leakage, media fallback, axe 0/0, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `aefb9dd` | `projects-workspace` | A — visual/interaction | `accept` | `docs/ui/147-projects-workspace-review-a.md` | none | shared portal navigation clipping retained for shell-family work | Project identity/meta hierarchy, filter grouping, create-form prominence, narrow reflow, no overflow, and card action continuity pass | accepted pending human |
| `aefb9dd` | `projects-workspace` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-projects-workspace-review-b.md` | none | browser zoom limitation and existing textarea contrast probe retained; no domain/API changes | role/tenant/link/mutation boundary, active/archived/create/error states, keyboard focus, axe 0 violations, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `0d11790` | `documentation-admin` | A — visual/interaction | `accept` | `docs/ui/147-documentation-admin-review-a.md` | none | shared portal navigation clipping retained for shell-family work | administration hierarchy, metric grouping, policy form density, alert prominence, narrow reflow, and no overflow pass | accepted pending human |
| `0d11790` | `documentation-admin` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-documentation-admin-review-b.md` | none | browser zoom limitation and broader Site library/editor family remain separate | owner-only mutation boundary, over-limit truth, viewer guard, single main, axe 0, reduced motion, tests, typecheck/lint/build pass | accepted pending human |
| `106705c` | `extension-capture` | A — visual/interaction | `accept` | `docs/ui/147-extension-capture-review-a.md` | none | installed toolbar action blocked for this run | compact context/action hierarchy, Project Version identity, recovery restraint, 360px/180px wrapping, and popup scope pass | blocked local for run |
| `106705c` | `extension-capture` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-extension-capture-review-b.md` | none | installed toolbar/permission path `blocked_local_for_run`; 180px contrast probe incomplete | Capture contracts, permission/privacy boundary, local recovery, named actions, axe 0 violations, reduced motion, tests/typecheck/lint/build pass | blocked local for run |
| `c4141a1` | `organization-admin` | A — visual/interaction | `accept` | `docs/ui/147-organization-admin-review-a.md` | none | shared shell remains separate; no pre-change compliance desktop screenshot | administration hierarchy, invite/member/pending-invite framing, bounded compliance evidence, narrow composition, and no blocking visual finding | accepted pending human |
| `c4141a1` | `organization-admin` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-organization-admin-review-b.md` | none | browser zoom control limitation; one incomplete metric contrast-background probe; no pre-change compliance desktop screenshot | owner-only mutation boundary, viewer denial, retained evidence/privacy boundary, axe 0 violations, reduced motion, focused 13/13, full 492/492, typecheck/lint/build/diff pass | accepted pending human |
| `c93ca11` | `project-versions` | A — visual/interaction | `accept` | `docs/ui/147-project-versions-review-a.md` | none | shared shell remains separate | Project Version identity, lifecycle grouping, management density, workspace metadata/cards, active/non-default/archived states, narrow context wrapping, and no blocking visual finding | accepted pending human |
| `c93ca11` | `project-versions` | B — product/a11y/adversarial QA | `accept` | `docs/ui/147-project-versions-review-b.md` | none | browser zoom limitation; existing settings textarea probe; repository-wide pre-existing CSS-token check failure remains queued | owner/viewer boundary, Default/archive invariants, former-slug/Carry Forward semantics, axe 0 violations, reduced motion, focused 12/12, full 493/493, typecheck/lint/build pass | accepted pending human |


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
| `demos-public` | anonymous valid reader / desktop 1440×900 | synthetic Plan 128 public Publish Link; active published Demo, two Scenes, safe fixture asset | agent-browser / Chromium; runner API 3022/web 3020 | plain shell, 1,372px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-before-desktop.png` | published context header, visible Version control, framed stage/playback region; 1,644px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-after-desktop.png` | no | axe 0 violations / 0 incomplete / 35 passes; valid reload and Scene playback | browser errors empty; document/API/asset requests returned 200; no target requests | public shell owns title while immutable renderer owns Scene playback; Capture asset and public URL contracts unchanged | `fff22eb` / 2026-08-06 |
| `demos-public` | anonymous valid reader / narrow 390×844 | same synthetic public Publish Link | agent-browser / Chromium; runner API 3022/web 3020 | plain shell, 844px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-before-narrow.png` | stacked published context/version control, framed stage, readable controls; 844px document height, 4 interactive controls; `docs/ui/147-interactive-demo-public-after-narrow.png` | no | axe 0 violations / 0 incomplete / 35 passes; page/body widths both 390px; reduced-motion enabled | browser errors empty; no page overflow | Version control moves below the identity block at narrow width; stage remains the dominant reader region | `fff22eb` / 2026-08-06 |
| `demos-public` | anonymous embed / narrow 390×844 | same synthetic public Publish Link `/embed` | agent-browser / Chromium; runner API 3022/web 3020 | same public contract before candidate | restrained outer padding, one top-level `main`, 4 interactive controls, no authoring/admin controls | no | axe 0 violations / 0 incomplete; main count 1; reduced-motion enabled | browser errors empty; no failed local requests observed | embed stays a public playback frame and does not change access or canonical-link behavior | `fff22eb` / 2026-08-06 |
| `demos-public` | anonymous Version and Scene playback | active public Publish Link; explicit `main` Version plus Start→Finish Scene transition and Previous Scene | agent-browser / Chromium; runner API 3022/web 3020 | existing selector/playback behavior | Version selection reached `/d/plan128-public/versions/main`; Continue, Previous Scene, and Restart retained native keyboard/button semantics | no | route axe 0/0; snapshot shows one h1 and Scene h2; reduced-motion compatible | no browser errors; no mutation requests | exact public Version/Revision identity and immutable playback remain unchanged | `fff22eb` / 2026-08-06 |
| `demos-public` | password/access/unavailable states | synthetic password, restricted, expired, revoked, and unknown public links | agent-browser / Chromium; runner API 3022/web 3020 | existing truthful state contracts | Password required + invalid-password alert; restricted/expired/unavailable messages remain non-revealing and omit retry where not retryable | no | all checked states axe 0 violations / 0 incomplete; password form axe 0/0 | browser errors empty; no private metadata or target requests | no password, cookie, access, or public-link values recorded; revoked/unknown remain generic unavailable | `fff22eb` / 2026-08-06 |
| `guides-public` | anonymous valid reader / desktop 1440×900 | synthetic Plan 127 public Guide Publish Link; immutable Guide Revision with typed Step and safe fixture asset | agent-browser / Chromium; runner API 3022/web 3020 | sparse shell, 900px document height, 0 interactive controls; `docs/ui/147-guide-public-before-desktop.png` | published context, bounded block column, framed media and hierarchy; 1,142px document height, 0 interactive controls; `docs/ui/147-guide-public-after-desktop.png` | no | axe 0 violations / 0 incomplete / 27 passes; one top-level main; reduced-motion enabled | browser errors empty; public API and asset requests returned 200; no target requests | Guide Revision content and public Version context remain unchanged; shell owns identity and block frame | `953a7fa` / 2026-08-06 |
| `guides-public` | anonymous valid reader / narrow 390×844 | same synthetic public Guide Publish Link | agent-browser / Chromium; runner API 3022/web 3020 | sparse shell, 844px document height, 0 interactive controls; `docs/ui/147-guide-public-before-narrow.png` | stacked published context, bounded block frame, readable media; 844px document height, 0 interactive controls; `docs/ui/147-guide-public-after-narrow.png` | no | axe 0 violations / 0 incomplete / 27 passes; page/body widths both 390px; reduced-motion enabled | browser errors empty; no page overflow | public reader reflows vertically without changing content or access behavior | `953a7fa` / 2026-08-06 |
| `guides-public` | anonymous embed / narrow 390×844 | same synthetic public Guide Publish Link `/embed` | agent-browser / Chromium; runner API 3022/web 3020 | same public contract before candidate | restrained outer padding, one top-level main with `Embedded published guide` name, no authoring controls | no | axe 0 violations / 0 incomplete; main count 1; reduced-motion enabled | browser errors empty; no failed local requests observed | embed accessible name and public-link behavior remain compatible with existing route tests | `953a7fa` / 2026-08-06 |
| `guides-public` | password/access/unavailable states | synthetic password, restricted, expired, revoked, and unknown public links | agent-browser / Chromium; runner API 3022/web 3020 | existing truthful state contracts | Password required + invalid-password alert; restricted/expired/unavailable messages remain non-revealing | no | all checked states axe 0 violations / 0 incomplete; password form axe 0/0 | browser errors empty; no private metadata or target requests | no password, cookie, access, or public-link values recorded; revoked/unknown remain generic unavailable | `953a7fa` / 2026-08-06 |
| `guides-public` | empty and broken/missing media component states | focused `PublicGuideReaderPage` fixtures; empty blocks and failed Capture asset | Vitest / Testing Library; synthetic response objects | existing markup had no explicit empty frame or media fallback | empty frame remains explicit; failed/missing Capture asset renders `Captured screenshot is unavailable.` and removes broken image | no | focused Guide reader suite 4/4; public-route assertions 3/3 | component failure path exercised; no browser fixture route exposes empty public Publication | no public-link or asset policy change; browser empty-link limitation remains recorded | `953a7fa` / 2026-08-06 |
| `project-versions` | authenticated owner settings / desktop 1440×900 | synthetic Plan 125 project with Main, Summer release, and Archived release Project Versions | agent-browser / Chromium; runner API 3022/web 3020 | 2,235px document height, 55 controls, one main, 0 axe violations / 1 existing textarea incomplete; `docs/ui/147-project-versions-before-settings-desktop.png` | 2,384px document height, 55 controls, one main, target content no overflow, 0 axe violations / 1 same existing textarea incomplete; `docs/ui/147-project-versions-after-settings-desktop.png` and scrolled management view `docs/ui/147-project-versions-after-settings-versions-desktop.png` | no | reduced-motion enabled; management region exposes Active and Archived headings | local Project/Version requests returned 200; browser errors empty | existing project Details/Membership surfaces and shared portal shell remain outside the candidate | `c93ca11` / 2026-08-06 |
| `project-versions` | authenticated owner settings / narrow 390×900 | same synthetic Project Version fixtures | agent-browser / Chromium; runner API 3022/web 3020 | 3,755px document height, 55 controls, one main, 0 axe violations / 1 existing textarea incomplete; `docs/ui/147-project-versions-before-settings-narrow.png` | 3,889px document height, 55 controls, one main, target content overflow 0, 0 axe violations / 1 same existing textarea incomplete; `docs/ui/147-project-versions-after-settings-narrow.png` | no | reduced-motion enabled; form/list controls remain reachable; browser zoom control is environment-limited | browser errors empty; no failed local requests observed | portal navigation remains a shared-shell scroll surface | `c93ca11` / 2026-08-06 |
| `project-versions` | authenticated owner Project Version workspace / desktop 1440×900 | Main default Project Version | agent-browser / Chromium; runner API 3022/web 3020 | 900px document height, 23 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-before-workspace-desktop.png` | 900px document height, 23 controls, one main, named workspace region, target overflow 0, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-after-workspace-desktop.png` | no | reduced-motion enabled; metadata and destination cards retain keyboard links | browser errors empty; Project/Version requests returned 200 | four destination cards remain links into existing Capture, Guide, Demo, and Carry Forward contracts | `c93ca11` / 2026-08-06 |
| `project-versions` | authenticated owner Project Version workspace / narrow 390×900 | Main default Project Version | agent-browser / Chromium; runner API 3022/web 3020 | 1,088px document height, 23 controls, one main, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-before-workspace-narrow.png` | 1,520px document height, 23 controls, one main, named workspace region, target overflow 0, 0 axe violations / 0 incomplete; `docs/ui/147-project-versions-after-workspace-narrow.png` | no | reduced-motion enabled; context identity stacks without splitting the Version name; selection control remains labeled | browser errors empty; selection and archived routes returned 200 | shared navigation still scrolls horizontally; Project Version content reflows vertically | `c93ca11` / 2026-08-06 |
| `project-versions` | active/non-default, archived, and viewer state checks / narrow 390×900 | Summer release, Archived release, and synthetic viewer session | agent-browser / Chromium; runner API 3022/web 3020 | existing route/state contracts | Summer release selection canonicalizes to `/versions/summer-release` and retains Carry Forward for owner; Archived release shows read-only status; viewer has no settings management or Carry Forward | no | each checked workspace route axe 0 violations / 0 incomplete; viewer settings axe 0/0 | browser errors empty; no unintended mutation requests | Default/archive, viewer, and former-slug semantics remain API-owned and unchanged | `c93ca11` / 2026-08-06 |

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
