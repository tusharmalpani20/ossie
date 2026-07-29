# Child 129 Accessibility, Motion, Performance, And Browser Dogfood

Date: 2026-07-29

Status: Passed

Starting commit: `5e78723`

Runtime repair commits:

- `c46e316` — shared semantics, route titles, bypass navigation, and motion;
- `f23ff13` — audited contrast and Demo target sizing;
- `4d039d0` — stable route-title effect dependency;
- `133274e` — rollback-dialog focus lifecycle;
- `fa15378` — native rollback modality, background isolation, successful-refresh
  focus fallback, and truthful refresh-failure status.

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
| Web JS                    |    466.56 kB |     129.85 kB | 468.99 kB |  130.54 kB |
| Web CSS                   |     73.19 kB |      14.17 kB |  73.94 kB |   14.29 kB |
| Extension popup JS        |    256.13 kB |      78.20 kB | 256.13 kB |   78.20 kB |
| Extension popup CSS       |     16.20 kB |       4.24 kB |  16.20 kB |    4.24 kB |
| Extension background      |     10.10 kB |       2.92 kB |  10.10 kB |    2.92 kB |
| Extension capture command |      9.81 kB |       2.44 kB |   9.81 kB |    2.44 kB |
| Extension content script  |      3.12 kB |       1.33 kB |   3.12 kB |    1.33 kB |

The final web number above is the standard production build. The final browser
build with the explicit testing API origin was 469.01 kB raw / 130.55 kB gzip.
Child 129 added 0.69 kB gzip JS and 0.12 kB gzip CSS for exhaustive route
titles, shared Card semantics, bypass navigation, native modal/background
isolation, and dialog focus management. This remains below the plan's two
percent explanation gate.

The prior web growth is already attributable to the accepted Guide and Demo
authoring/viewer work recorded by children `127` and `128`. Production vitals
were healthy and Child 129 introduced no material regression, so speculative
route splitting was rejected. No runtime dependency or browser permission was
added.

## Issue Register

Each browser issue was reproduced twice before repair.

| ID      | Severity | Finding                                                                             | Owner              | Resolution and verification                                                                                                                                                                            |
| ------- | -------- | ----------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 129-001 | High     | Every web route exposed only the generic `Ossie` title                              | route metadata/App | Fixed by exhaustive, identifier-free route titles; helper/App tests and login, Project, Capture, Guide, Demo, reader, and embed browser titles passed                                                  |
| 129-002 | High     | Authenticated shell had no bypass link before repeated navigation                   | `PortalAppShell`   | Fixed with a focus-visible skip link and stable focusable main target; component test and first-Tab browser check passed                                                                               |
| 129-003 | High     | 12px `Portal home`/legacy eyebrow text measured 4.48:1                              | affected page CSS  | Fixed by the accepted muted-text token; repeated Project and Organization axe scans passed                                                                                                             |
| 129-004 | Medium   | Named Card `div` elements used prohibited ARIA without a role                       | shared Card        | Fixed once in `@repo/ui`: explicitly named Cards infer `role="region"` while unnamed Cards remain neutral; primitive/Login tests and Organization browser scan passed                                  |
| 129-005 | Medium   | Guide block insertion container had `aria-label` on a roleless `div`                | Guide workbench    | Fixed with a named control `group`; Guide axe rerun removed the ARIA incomplete result                                                                                                                 |
| 129-006 | High     | Demo Hotspot resize control was 16×16 CSS pixels                                    | Demo canvas        | Fixed to 24×24; browser bounding-box check and axe WCAG 2.2 target-size rerun passed                                                                                                                   |
| 129-007 | High     | Web controls retained 150ms transitions under reduced motion                        | web foundation     | Fixed with the same global reduced-motion suppression used by the extension; computed duration changed from `0.15s` to `0.00001s`                                                                      |
| 129-008 | High     | Cancel/Escape from Publication rollback dropped focus to `body`                     | publishing panel   | Fixed with initial dialog focus, Tab wrapping, Escape handling, and exact trigger focus return; focused tests and live keyboard rerun passed                                                           |
| 129-009 | High     | Publication rollback left background page links pointer-operable                    | publishing panel   | Reproduced twice in close-previous review; fixed with a native modal dialog/backdrop. The accessibility tree exposed only the dialog and raw pointer clicks were blocked in development and production |
| 129-010 | High     | Successful rollback refresh dropped focus to `body`                                 | publishing panel   | Reproduced twice when the refreshed link removed its opener; focused regression and production browser rerun passed with focus on the stable named Publishing region                                   |
| 129-011 | Medium   | A committed rollback followed by refresh failure was reported as a rollback failure | publishing panel   | Focused RED test proved the stale message; mutation and refresh failure paths are now distinct, truthful, and preserve focus                                                                           |

No scoped critical or high-impact issue remains open after the close-previous
repeat pass.

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
  first control to Cancel, blocked background keyboard/pointer interaction,
  closed on Escape, and returned focus to the exact rollback trigger. A
  successful refresh that removes the trigger focuses the stable named
  Publishing region instead.
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

- Desktop/wide authoring: 1440×900; one primary editor canvas/document and
  locally scrollable rails remained reachable. Document/body width remained
  exactly 1440 CSS pixels with one page `h1`.
- Web narrow: 390×844 Capture detail and public Demo embed had document/body
  width equal to viewport width.
- 200% proxy: 640 CSS pixels for Guide authoring had document/body width equal
  to viewport width.
- Extension: 360×600, 320×600, and 180 CSS pixels had document/body width
  equal to viewport width; long Project/Project Version labels remained
  reachable.
- Reduced motion was enabled during the narrow/reflow checks.
- No tested surface had hidden critical controls, unexplained document
  overflow, blank required media/canvas, overlap, or text clipping.

## Production Vitals

The close-previous pass found that the first closeout had only recorded two of
the seven routes required by the plan. Three final production-preview samples
were therefore taken for every required route in the same local Chrome/testing
fixture environment:

| Route                     | FCP samples        | LCP samples        | TTFB samples        | CLS samples     | Median                              |
| ------------------------- | ------------------ | ------------------ | ------------------- | --------------- | ----------------------------------- |
| Project Version workspace | 168 / 108 / 128 ms | 208 / 156 / 160 ms | 0.8 / 2.5 / 1.3 ms  | 0 / 0 / 0       | FCP 128; LCP 160; TTFB 1.3; CLS 0   |
| Guide editor              | 112 / 140 / 100 ms | 196 / 232 / 172 ms | 2.5 / 1.7 / 1.3 ms  | .05 / .05 / .05 | FCP 112; LCP 196; TTFB 1.7; CLS .05 |
| Public Guide reader       | 68 / 72 / 56 ms    | 96 / 72 / 80 ms    | 1.2 / 1.9 / 2.4 ms  | .06 / .06 / .06 | FCP 68; LCP 80; TTFB 1.9; CLS .06   |
| Demo editor               | 140 / 120 / 116 ms | 488 / 380 / 336 ms | 7.0 / 1.3 / 2.3 ms  | .04 / .04 / .04 | FCP 120; LCP 380; TTFB 2.3; CLS .04 |
| Public Demo reader        | 96 / 76 / 72 ms    | 120 / 104 / 108 ms | 3.1 / 0.8 / 8.4 ms  | .09 / .09 / .09 | FCP 76; LCP 108; TTFB 3.1; CLS .09  |
| Public Demo embed         | 124 / 68 / 68 ms   | 124 / 108 / 96 ms  | 2.5 / 3.9 / 2.5 ms  | 0 / .09 / .09   | FCP 68; LCP 108; TTFB 2.5; CLS .09  |
| Direct extension popup    | 80 / 52 / 152 ms   | 96 / 72 / 212 ms   | 8.7 / 3.6 / 14.3 ms | 0 / 0 / 0       | FCP 80; LCP 96; TTFB 8.7; CLS 0     |

All time values in the table are milliseconds. All medians remain well below
the investigation triggers.

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

- production popup at 360px, 320px, and 180 CSS pixels;
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
pnpm --filter web test                 # 52 files / 345 tests
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
pnpm -r --if-present test               # includes web 345, extension 140, server 406
pnpm build                              # 12 build tasks
```

The focused publishing suite passed 17 tests after adding successful-refresh
focus and truthful refresh-failure regressions. Production Chromium then passed
native dialog accessibility-tree isolation, blocked-background pointer
behavior, Tab/Shift+Tab containment, Cancel/Escape opener return, and the
successful-mutation Publishing-region fallback. Repeated Organization/Project
compliance and Project activity axe scans reported zero violations.

`ffmpeg` `4.4.2` was installed after the first repro-video attempt exposed the
missing host package. A 6.9-second fixed-state video and step screenshots were
validated under `/tmp`; they contain synthetic data and are intentionally not
committed. Final formatting and `git diff --check` are part of the documentation
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
- Child `130` should preserve the final build/vitals baseline, retain native
  modal background isolation and post-mutation focus fallback in its
  cross-child checks, and repeat the normal documentation closeout checks. It
  does not inherit an open runtime repair.
