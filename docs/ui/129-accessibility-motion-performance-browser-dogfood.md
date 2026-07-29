# Child 129 Accessibility, Motion, Performance, And Browser Dogfood

Date: 2026-07-29

Status: Passed

Starting commit: `5e78723`

Runtime repair commits:

- `c46e316` — shared semantics, route titles, bypass navigation, and motion;
- `f23ff13` — audited contrast and Demo target sizing;
- `4d039d0` — stable route-title effect dependency;
- `133274e` — rollback-dialog focus lifecycle.

## Environment And Safety Boundary

- Workspace: `/home/ubuntu/ossie`
- Data: disposable `ossie_test` database and guarded synthetic fixtures only
- Browser automation: `agent-browser` `0.33.1`
- Primary browser: Chrome for Testing `151.0.7922.47`
- Installed-extension automation: temporary Puppeteer `25.4.0` outside the
  repository
- `rtk`: unavailable; the documented direct `pnpm` fallback was used

No credentials, cookies, bearer tokens, invite URLs, browser profiles, private
HARs, raw captured pages, or customer data are committed. Temporary browser
artifacts were kept under `/tmp` and are not evidence dependencies.

Firefox, Firefox ESR, system Chromium, Google Chrome, WebKit, and Safari were
not installed. Secondary-engine validation is therefore Blocked by capability,
not reported as passing. Chromium is the complete primary-engine result.

## Baseline And Build Results

The immutable baseline was captured before runtime edits:

| Artifact                  | Baseline raw | Baseline gzip | Final raw | Final gzip |
| ------------------------- | -----------: | ------------: | --------: | ---------: |
| Web JS                    |    466.56 kB |     129.85 kB | 468.52 kB |  130.37 kB |
| Web CSS                   |     73.19 kB |      14.17 kB |  73.89 kB |   14.28 kB |
| Extension popup JS        |    256.13 kB |      78.20 kB | 256.13 kB |   78.20 kB |
| Extension popup CSS       |     16.20 kB |       4.24 kB |  16.20 kB |    4.24 kB |
| Extension background      |     10.10 kB |       2.92 kB |  10.10 kB |    2.92 kB |
| Extension capture command |      9.81 kB |       2.44 kB |   9.81 kB |    2.44 kB |
| Extension content script  |      3.12 kB |       1.33 kB |   3.12 kB |    1.33 kB |

The final web number above is the standard production build. The browser build
with the explicit testing API origin was 468.54 kB raw / 130.39 kB gzip. Child
129 added 0.52 kB gzip JS and 0.11 kB gzip CSS for exhaustive route titles,
shared Card semantics, bypass navigation, and dialog focus management.

The prior web growth is already attributable to the accepted Guide and Demo
authoring/viewer work recorded by children `127` and `128`. Production vitals
were healthy and Child 129 introduced no material regression, so speculative
route splitting was rejected. No runtime dependency or browser permission was
added.

## Issue Register

Each browser issue was reproduced twice before repair.

| ID      | Severity | Finding                                                              | Owner              | Resolution and verification                                                                                                                                           |
| ------- | -------- | -------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 129-001 | High     | Every web route exposed only the generic `Ossie` title               | route metadata/App | Fixed by exhaustive, identifier-free route titles; helper/App tests and login, Project, Capture, Guide, Demo, reader, and embed browser titles passed                 |
| 129-002 | High     | Authenticated shell had no bypass link before repeated navigation    | `PortalAppShell`   | Fixed with a focus-visible skip link and stable focusable main target; component test and first-Tab browser check passed                                              |
| 129-003 | High     | 12px `Portal home`/legacy eyebrow text measured 4.48:1               | affected page CSS  | Fixed by the accepted muted-text token; repeated Project and Organization axe scans passed                                                                            |
| 129-004 | Medium   | Named Card `div` elements used prohibited ARIA without a role        | shared Card        | Fixed once in `@repo/ui`: explicitly named Cards infer `role="region"` while unnamed Cards remain neutral; primitive/Login tests and Organization browser scan passed |
| 129-005 | Medium   | Guide block insertion container had `aria-label` on a roleless `div` | Guide workbench    | Fixed with a named control `group`; Guide axe rerun removed the ARIA incomplete result                                                                                |
| 129-006 | High     | Demo Hotspot resize control was 16×16 CSS pixels                     | Demo canvas        | Fixed to 24×24; browser bounding-box check and axe WCAG 2.2 target-size rerun passed                                                                                  |
| 129-007 | High     | Web controls retained 150ms transitions under reduced motion         | web foundation     | Fixed with the same global reduced-motion suppression used by the extension; computed duration changed from `0.15s` to `0.00001s`                                     |
| 129-008 | High     | Cancel/Escape from Publication rollback dropped focus to `body`      | publishing panel   | Fixed with initial dialog focus, Tab wrapping, Escape handling, and exact trigger focus return; focused tests and live keyboard rerun passed                          |

No scoped critical or high-impact issue remains open.

## Route, Role, State, And Viewport Results

| Surface/state                                                                | Evidence strategy                                                                  | Result  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| setup, login, safe next path, session and invite states                      | focused suites, V1 smoke, live login/title/axe                                     | Pass    |
| Organization Owner/Project Admin portal and members                          | Capture fixture, desktop/narrow browser, full tests                                | Pass    |
| Editor and Viewer permission/read-only states                                | Guide/Demo fixture contracts and focused suites; accepted child `127`/`128` parity | Pass    |
| active/archived Project and Default/named/archived Project Version           | fixture DB tests, route tests, prior parity evidence                               | Pass    |
| Capture list/detail and canonical named-Version context                      | Capture fixture at 390px/reduced motion                                            | Pass    |
| active/empty/archived Guide Edition and editor/preview/Revision/public paths | Guide fixture, 640px reflow, long-session run, full tests                          | Pass    |
| active/empty/archived Demo Edition and editor/preview/Revision/public paths  | Demo fixture, wide editor, narrow embed, long-session run, full tests              | Pass    |
| public/password/restricted/expired/revoked/not-found/version access matrices | public route suites, DB/V1 smoke, accepted child `127`/`128` parity                | Pass    |
| extension direct Connect/selection state                                     | 320px and 180px direct-page fixture                                                | Pass    |
| real installed toolbar Capture                                               | unpacked production build and real Chrome extension action                         | Pass    |
| Firefox/WebKit/Safari                                                        | executable availability check                                                      | Blocked |

The three reset-on-seed fixture phases remained separate. No Guide/Demo
coexistence assumption was made.

## Accessibility And Keyboard Results

- Representative final axe scans reported zero violations on login, Projects,
  Organization members, Capture detail, Guide editor/public reader, Demo
  editor/public embed, and extension popup.
- Guide and Demo authoring scans retained only the known axe-incomplete
  Textarea background samples. Manual inspection confirmed the shared white
  background, slate-950 text, visible border, and unchanged high-contrast
  treatment. This is an accepted tool indeterminacy, not a failed contrast
  result.
- Every sampled page had one `h1`, named primary regions/navigation, visible
  labels, and a descriptive document title. Titles never interpolate Project
  IDs, Version slugs, Artifact IDs, invite tokens, or public slugs.
- First Tab on an authenticated route focused and revealed
  `Skip to main content`.
- Named Cards now have valid region semantics. Unnamed decorative containers
  did not gain landmark noise.
- Publication rollback focused its reason field, wrapped Shift+Tab from the
  first control to Cancel, closed on Escape, and returned focus to the exact
  rollback trigger.
- The Guide screenshot viewer opened with an internal control focused, closed
  with Escape, and retained the previously accepted trigger-return behavior.
- Demo resize controls measured 24×24 CSS pixels; popup controls and shared
  buttons retained accepted target sizes.

## Motion Review

The source inventory found only shared 150ms color transitions plus the
existing Demo renderer/design-review/extension reduced-motion rules. There are
no keyframe-driven decorative animations.

- Normal mode retains fast color feedback.
- Web reduced-motion now globally disables transition/animation duration and
  smooth scrolling without removing information or commands.
- Extension reduced-motion remained `0.00001s`.
- Demo Scene transitions preserve status and focus semantics in both modes.
- No layout-property animation, autoplay, parallax, or infinite animation was
  introduced.

## Responsive And Reflow Results

- Desktop/wide authoring: 1280×900; one primary editor canvas/document and
  locally scrollable rails remained reachable.
- Web narrow: 390×844 Capture detail and public Demo embed had document/body
  width equal to viewport width.
- 200% proxy: 640 CSS pixels for Guide authoring had document/body width equal
  to viewport width.
- Extension: 320×600 and 180 CSS pixels had document/body width equal to
  viewport width; long Project/Project Version labels remained reachable.
- Reduced motion was enabled during the narrow/reflow checks.
- No tested surface had hidden critical controls, unexplained document
  overflow, blank required media/canvas, overlap, or text clipping.

## Production Vitals

Three production-preview samples were taken per route in the same local
Chrome/testing-fixture environment:

| Route             | FCP samples       | LCP samples        | TTFB samples       | CLS       | Median                              |
| ----------------- | ----------------- | ------------------ | ------------------ | --------- | ----------------------------------- |
| Demo editor       | 112 / 112 / 84 ms | 508 / 372 / 348 ms | 3.8 / 4.1 / 2.1 ms | 0.03 each | FCP 112 ms; LCP 372 ms; TTFB 3.8 ms |
| Public Demo embed | 156 / 56 / 60 ms  | 212 / 88 / 84 ms   | 4.1 / 8.9 / 5.6 ms | 0.02 each | FCP 60 ms; LCP 88 ms; TTFB 5.6 ms   |

INP was unavailable because the sampling command did not receive a qualifying
interaction. No route-loading blank state or material layout shift was found.

## Long-Session Results

- Guide: 30 real Block selections across the 20-Block outline completed in
  913ms; 20 screenshot-viewer open/close cycles completed in 821ms; 10
  save/preview/back cycles returned to the same editor with no error.
- Demo: 30 real Scene selections across the 12-Scene rail completed in 949ms;
  20 rollback-confirmation open/cancel cycles completed in 821ms; 10
  save/preview/back cycles returned to the same editor with the truthful
  `Demo saved.` status and no request failure.
- Console/runtime error checks were empty after the workloads.
- Network inspection showed expected `200`/`304` document, asset, and API
  responses; no unexpected failed request was accepted.
- Chromium exposed only point-in-time `performance.memory` samples. Guide and
  Demo selection passes increased approximately 1.09 MB and 1.52 MB while
  rendering newly selected controls. Without forced GC or comparable heap
  snapshots this cannot support a leak claim, so heap-leak measurement is
  recorded as Blocked. Listener/timer internals were likewise unavailable.

## Extension Results

Direct popup-page automation and installed-toolbar validation remained
separate.

Direct-page result:

- production popup at 320px and 180 CSS pixels;
- zero axe violations;
- one `h1`;
- no horizontal overflow or runtime/console error;
- reduced-motion transition duration `0.00001s`.

Installed-toolbar result:

- production `apps/extension/dist` loaded as an enabled unpacked MV3 extension;
- Chrome's real extension action opened
  `chrome-extension://…/index.html`;
- distinct local API/portal bases and synthetic login passed;
- named `Summer release` Capture started and restored after popup close;
- one automatic click and one manual screenshot each created exactly one
  ordered redacted Asset/Event;
- password/contenteditable suppression, pause/resume, rapid-overlap uniqueness,
  service-worker restart recovery, finish-once behavior, local clear, and the
  canonical named-Version portal handoff all passed;
- temporary screenshots were redirected to `/tmp` and were not committed.

The extension manifest, permissions, API contracts, capture privacy rules, and
bundle sizes are unchanged.

## Verification

Passed:

```text
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web test                 # 52 files / 343 tests
pnpm --filter @repo/ui test            # 3 files / 7 tests
pnpm --filter extension check-types
pnpm --filter extension lint
pnpm --filter extension test           # 19 files / 140 tests
pnpm --filter extension build
pnpm --filter server test:setup
pnpm --filter server test:db           # 20 files / 67 tests
pnpm --filter server test:smoke        # 1 V1 workflow
pnpm check-types                        # 12 tasks
pnpm lint                               # 13 tasks
pnpm -r --if-present test               # includes web 342, extension 140, server 406
pnpm build                              # 12 build tasks
```

The focused publishing suite passed 15 tests after adding the final dialog
focus regression. The final recursive workspace run includes that regression.
Final formatting and `git diff --check` are part of the documentation
closeout.

## Accepted Exceptions And Handoff

- Secondary engines are Blocked because no supported executable is installed.
- Axe cannot resolve layered Textarea backgrounds; manual contrast review
  passed.
- Comparable forced-GC heap/listener/timer metrics are Blocked by the current
  browser/tool surface. Observable long-session behavior, requests, and errors
  passed.
- No critical/high accessibility, motion, reflow, performance, privacy,
  permission, or installed-extension issue carries into child `130`.
- Child `130` should preserve the final build/vitals baseline and repeat the
  normal documentation closeout checks; it does not inherit a runtime repair.
