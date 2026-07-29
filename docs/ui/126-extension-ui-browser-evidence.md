# Child 126 Extension UI Browser Evidence

Date: 2026-07-29

Implementation commit under test: `c62c7e7`

Environment:

- OS: Linux x86_64;
- browser: Chrome 151.0.0.0 through `agent-browser`;
- API base URL: synthetic `https://api.synthetic.test/base` in the direct-page
  fixture only;
- portal base URL: synthetic `https://portal.synthetic.test/base` in the
  direct-page fixture only;
- production extension build: `apps/extension/dist`;
- unpacked extension id for this disposable browser profile:
  `ejihcjfabibbmmefnpfakhjahhmppcmi`.

All screenshots contain synthetic data only. No customer URL, token, cookie,
input value, or captured customer page is present.

## Build And Validation Commands

`rtk` was not installed in this environment, so the documented direct `pnpm`
fallback was used:

```text
pnpm --filter extension test
pnpm --filter extension check-types
pnpm --filter extension lint
pnpm --filter extension build
pnpm check-types
pnpm lint

python3 -m http.server 4174 -d apps/extension/dist
agent-browser ... open http://127.0.0.1:4174
agent-browser ... set viewport 360 600
agent-browser ... set viewport 320 600
agent-browser ... set viewport 180 600
agent-browser ... set media light reduced-motion
agent-browser ... snapshot -i
agent-browser ... a11y --tags wcag2a,wcag2aa
agent-browser ... errors
agent-browser ... console
agent-browser ... network requests
```

The direct authenticated states used the synthetic init script at
`docs/ui/evidence/126/direct-popup-fixture.js`. It mocks extension storage and
the API boundary only for browser-visible layout and interaction validation. It
does not count as installed-extension capture/API evidence.

## A. Direct Popup-Page Automation

| Check                                               | Result                                                                          | Evidence                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Connect state at 360px                              | Pass                                                                            | `evidence/126/direct-connect-360.png`                  |
| Invalid credential-bearing URL and alert semantics  | Pass                                                                            | `evidence/126/direct-connect-error-360.png`            |
| 320px Connect reflow                                | Pass; document and body scroll width both 320px                                 | `evidence/126/direct-connect-error-320.png`            |
| Signed-out state                                    | Pass                                                                            | `evidence/126/direct-sign-in-360.png`                  |
| Authenticated Project and Project Version selectors | Pass                                                                            | `evidence/126/direct-selection-360.png`                |
| Long-label 320px reflow                             | Pass; no horizontal overflow and controls remain reachable by vertical scroll   | `evidence/126/direct-selection-320.png`                |
| Active paused state and server-confirmed step       | Pass                                                                            | `evidence/126/direct-active-paused-360.png`            |
| Portal-only settings and invalid-URL alert          | Pass; save closes the panel without changing active Capture context             | refreshed interactive run                              |
| Server-confirmed Event count and Session status     | Pass; displayed `7 captured steps` and `Capturing`                              | refreshed interactive run                              |
| Two-step local clear and accurate server copy       | Pass                                                                            | `evidence/126/direct-local-clear-confirmation-360.png` |
| Cancel returns focus to local-clear trigger         | Pass; active element text was `Clear local capture state`                       | same interactive run                                   |
| One popup `h1` per state                            | Pass in Connect, selection, and active states                                   | DOM assertions and snapshots                           |
| Reduced motion                                      | Pass; media query matched and button transition duration resolved to `0.00001s` | runtime style check                                    |
| Reflow equivalent to a 360px popup at 200% zoom     | Pass at 180 CSS px; document/body scroll width both 180px                       | `evidence/126/direct-active-180-css-px.png`            |
| Automated accessibility                             | Pass with zero violations at 320/360px; 180px leaves contrast for manual review | Connect: 17 passes; active: 19-21 passes               |
| Console/runtime errors                              | Pass; none reported                                                             | `agent-browser errors` and `console`                   |
| Network                                             | Pass; built HTML, JS, CSS, and icon requests returned 200/304                   | request log                                            |

The active accessibility run had one manual-review/incomplete contrast item for
the `Ossie` brand span because axe could not determine its background while the
node was partially obscured. It reported zero violations; visual inspection
shows the same dark text on the light popup background as the Connect state,
whose audit had zero incomplete items.

An exploratory `document.body.style.zoom = 2` diagnostic was not used as zoom
acceptance because CSS `zoom` doubles the fixed popup canvas rather than
emulating browser zoom. The 180-CSS-pixel viewport is the recorded 200% reflow
proxy. `direct-active-200-percent-zoom.png` is retained only as that rejected
diagnostic.

## B. Installed Unpacked Extension

The production build loaded as an enabled unpacked Manifest V3 extension in a
headed Chrome session. `chrome://extensions` showed:

- name `Ossie`;
- enabled state;
- unpacked-extension marker;
- the background service-worker target
  `assets/background.js`.

Opening the installed extension page directly proved that the real extension
origin exposes `chrome.runtime.id`, `chrome.storage.local`, and
`chrome.action.openPopup`. See
`evidence/126/installed-extension-page-360.png`.

True toolbar-popup interaction is **automation-blocked in this environment**.
During the refreshed close-previous run, the installed action created a real
popup target, but Chrome exposed it at only 25 CSS pixels wide and
`chrome.action.openPopup()` reported that no active browser window could be
found. The browser-chrome toolbar exposed by agent-browser contained no
attachable extension action control, so enlarging a direct extension page would
not constitute toolbar validation. Therefore this evidence does not claim:

- toolbar action-grant behavior;
- popup close/reopen lifetime;
- real content-script/background screenshot integration;
- automatic/manual Asset and Event counts from a live server;
- sensitive-target suppression in a live installed run;
- service-worker restart recovery;
- installed-flow portal handoff.

Those behaviors remain covered by focused extension/controller/API tests and
existing server contract tests, but a manual or toolbar-capable automation run
is still required for true installed end-to-end acceptance.
`true-toolbar-popup.png` is the retained blank attachment attempt and is not
acceptance evidence.

## Build Size Comparison

Expansion baseline:

```text
popup JS: 246.23 kB raw / 75.92 kB gzip
popup CSS: 14.41 kB raw / 3.86 kB gzip
background: 2.79 kB raw / 1.09 kB gzip
content script: 3.12 kB raw / 1.33 kB gzip
```

Child 126 build:

```text
popup JS: 250.52 kB raw / 77.04 kB gzip
popup CSS: 16.20 kB raw / 4.24 kB gzip
background entry: 8.46 kB raw / 2.69 kB gzip
shared capture-command chunk: 9.76 kB raw / 2.41 kB gzip
content script: 3.12 kB raw / 1.33 kB gzip
```

Close-previous audited build:

```text
popup JS: 256.13 kB raw / 78.20 kB gzip
popup CSS: 16.20 kB raw / 4.24 kB gzip
background entry: 10.10 kB raw / 2.92 kB gzip
shared capture-command chunk: 9.81 kB raw / 2.44 kB gzip
content script: 3.12 kB raw / 1.33 kB gzip
```

Popup growth is 4.29 kB raw / 1.12 kB gzip and CSS growth is 1.79 kB raw /
0.38 kB gzip. The background growth is intentional: it contains the shared
manual/automatic capture controller, Event-list reconciliation, sender-window
validation, and lifecycle quiescing. No new runtime dependency or permission
was added.

The close-previous popup growth over the first implementation build is 5.61 kB
raw / 1.16 kB gzip. It contains extracted authenticated bootstrap recovery,
portal-only settings, fail-closed reconciliation, and explicit transition/local
persistence recovery; it adds no dependency or browser permission. The
background entry grew 1.64 kB raw / 0.23 kB gzip for the reconciliation block
and acknowledgement boundary.

## Server Contract Verification

The six existing server contract files required by the plan passed: 6 files,
51 tests. These prove the relied-on auth, Project/Project Version authorization,
Capture Session, Capture Event, and Capture Asset contracts. They do not replace
the blocked installed-toolbar/API evidence described above.

Repository-wide verification also passed: `pnpm check-types` completed 12 tasks
and `pnpm lint` completed 13 tasks.

The close-previous extension suite passed 19 files and 140 tests. The refreshed
direct-page run passed Connect, selection, active paused, portal-only settings,
invalid portal URL alert behavior, exact Start/Finish labels, server-confirmed
Event count/status, reduced motion, console/runtime checks, and 360/320/180
CSS-pixel reflow with no horizontal document overflow. At 180 CSS pixels, axe
reported no violation and four contrast checks requiring manual review because
the extremely narrow viewport clipped its background sampling.
