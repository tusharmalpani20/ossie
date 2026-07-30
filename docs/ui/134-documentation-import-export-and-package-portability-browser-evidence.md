# Child 134 Browser Evidence

Date: 2026-07-30

Scope:
`docs/plan/134-documentation-import-export-and-package-portability.md`

## Environment

- Repository: `/home/ubuntu/ossie`
- API: `http://127.0.0.1:3002`, disposable `ossie_test` data
- Portal: `http://127.0.0.1:3000`
- Fixture: synthetic Documentation Admin and Viewer
- Browser automation: `agent-browser 0.33.1`
- Browser: Headless Chrome `151.0.0.0` on Linux
- Close-recheck browser commits: `7743001` through `17ce124`; later
  server-only one-pass Asset validation did not change browser behavior.
- Admin workbench:
  `/projects/01K12500000000000000000002/versions/summer-release/documentation/01KYT986J81N9ZEF7QX1VEKPT2`
- First-Site import list:
  `/projects/01K12500000000000000000002/versions/main/documentation`
- Archived state:
  `/projects/01K12500000000000000000002/versions/archived-release/documentation`

Generated packages and downloads remained transient under
`/tmp/ossie-134-close`. No generated archive or browser profile was committed.

## Passed Journeys

- Admin workbench exposed the Import and export landmark, saved-draft ZIP
  download, labelled Site ZIP and Markdown File inputs, Inspect actions, and
  exact OpenAPI export.
- The saved-draft response was a real ZIP. Independent inspection and the real
  import path found the manifest, Site metadata, typed/readable Pages, one
  Snippet, protected PNG Asset, and exact JSON OpenAPI source.
- Admin uploaded the ZIP, received the safe review only after Inspect, then
  cancelled. The review disappeared without mutating the source Site.
- Admin imported one real Markdown File into a populated Site, activated Apply
  from keyboard focus, received success, and the workbench refreshed to show
  the new Page without retaining the consumed review.
- Admin downloaded the updated package, inspected it from an active
  Project-Version Site list, activated Apply from keyboard focus, navigated to
  the newly created Site, and previewed its imported Pages and protected
  content state.
- Exact Guide/Demo Publication rebinding is covered by server portability and
  portal selector tests: database identities do not enter packages; options
  are labelled with title, Project Version, Revision, and Publication; Apply
  remains disabled until an exact selection exists. The deterministic browser
  fixture package had no external binding, so this selector is not falsely
  claimed as a real-browser branch.
- Admin uploaded an integrity-valid package with one unresolved Navigation
  Page. The real API retained a safe blocking inspection; the portal focused
  and announced the blocking summary, exposed its safe issue location, and
  kept Apply disabled. Server Apply independently rejects retained blocking
  reports.
- The archived Project Version explained that Documentation import and Site
  creation were unavailable and exposed no mutation controls.
- Viewer workbench retained saved-draft ZIP and exact OpenAPI export links and
  exposed no Site-package/Markdown File input, Inspect, Apply, Cancel, upload,
  save, checkpoint, or publish mutation controls.
- Viewer Page exposed readable Markdown export and no Markdown import or Page
  save action.
- At 320 CSS pixels and reduced motion,
  `scrollWidth === clientWidth === 320` and the reduced-motion media query
  matched.
- The close-recheck fixed duplicate/nested main landmarks and skipped heading
  levels on the Site list. The repeated axe audit reported zero violations;
  only the native File input contrast check remained honestly incomplete.
- Browser error events were empty. Console output contained only Vite and
  React development messages.

## Required-Matrix Reconciliation

The original evidence covered journeys 1, 2, 6, 10, 11, and 12 but overstated
the complete matrix. The independent close-recheck added real journeys 3
(first-Site Apply, without a fixture binding), 4 (imported protected-content
preview), 5 (populated-Site Page Apply), 7 (archived explanation), 8
(keyboard Apply), and 9 (real blocking focus and Apply prevention).

Exact labelled binding selection and truncated hidden-blocker behavior remain
deterministic component/server contracts rather than invented browser
evidence. Truncation is governed by authoritative server
`has_blocking_issues` and issue counts, not by the displayed issue slice.

## Automated Boundaries

Database/API tests own deterministic export→Inspect→Apply, state-aware replay,
fresh identity mapping, exact protected OpenAPI/media import, empty-target
enforcement, actor binding, parser/rate/ready admission, authorization,
Audit/Access coverage, cancellation/expiry cleanup, malicious archives,
duplicate JSON, traversal and expansion ceilings, transaction rollback, exact
Publication rebinding, and transient export cleanup.

The browser pass did not duplicate every parser/security case, create a custom
browser harness, or claim Firefox/WebKit evidence. Those browsers remain
capability-dependent child `138` work.
