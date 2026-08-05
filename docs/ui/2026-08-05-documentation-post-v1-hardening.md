# Child 145 Documentation Post-V1 Hardening Evidence

Date: 2026-08-05

Scope: integrated Documentation authoring, public reader, draft/Revision
preview, inert request examples, existing-product regression smoke, and the
accepted Tiptap/Fumadocs partial-adopt boundaries. All browser data came from
the disposable synthetic fixture; no customer content, credentials, cookies,
tokens, HARs, private origins, or raw captured input were committed.

## Environment and fixture

- Browser automation: agent-browser `0.33.1`.
- Required browser: Headless Chrome for Testing `151.0.7922.47`.
- Web: Vite at `http://localhost:3000`; API: local Fastify at
  `http://localhost:3002`.
- Fixture Organization: `01K12500000000000000000001`.
- Fixture Project: `01K12500000000000000000002`.
- Fixture Documentation Site: `01KZ9WFP8TDXBHNEJ9A93ZGGKC`.
- Required browser doctor: 10 pass / 0 warn / 0 fail.
- Reduced motion was enabled for the final interaction checks.

Final Documentation routes:

- public supported operation:
  `/docs/plan132-public/operations/get-widgets-listwidgets`;
- public unsupported operation:
  `/docs/plan132-public/operations/post-widgets-createwidget`;
- public Page:
  `/docs/plan132-public/install-guide`;
- saved draft:
  `/projects/01K12500000000000000000002/versions/summer-release/documentation/01KZ9WFP8TDXBHNEJ9A93ZGGKC`;
- immutable Revision 2:
  `/projects/01K12500000000000000000002/versions/summer-release/documentation/01KZ9WFP8TDXBHNEJ9A93ZGGKC/revisions/2`.

## Integrated fixes

Two defects were reproduced before implementation and fixed with focused
tests:

- `37e4bc8` — an operation endpoint has an exact operation snapshot but no
  navigable Page. The public reader now selects its existing native fallback
  before mounting the Fumadocs chrome in that state, avoiding a caught React
  error in the console. The focused Public reader suite is 4/4.
- `72b8943` — generated code that overflowed at narrow widths was not itself
  keyboard-focusable. The example `<pre>` now has `tabIndex=0` and an explicit
  surface background/border/color. The focused examples suite is 4/4.

The latter fix leaves code locally scrollable while keeping page-level width
bounded. The examples remain inert, text-only, and separate from mutable Try-It
authority.

## Chromium browser matrix

### Documentation surfaces

- Public supported operation, desktop 1280px: axe 4.12.1, 26 passes, 0
  violations, 0 incomplete; no page errors. The five fixed-order language
  tabs, ArrowRight/Home/End keyboard behavior, copy failure announcement,
  download, and no-target-request behavior were exercised.
- Public supported operation, 320px: axe 4.12.1, 27 passes, 0 violations, 0
  incomplete. `scrollWidth=320`, `clientWidth=320`; code regions were locally
  scrollable and had `tabIndex=0`.
- Public supported operation, equivalent 200% reflow at 160px:
  `scrollWidth=160`, `clientWidth=160`; the code region remained locally
  scrollable (`tabIndex=0`).
- Public unsupported operation: the bounded unsupported message rendered with
  no Copy or Download actions; axe 4.12.1 reported 26 passes, 0 violations,
  0 incomplete.
- Public Page with accepted Fumadocs chrome: axe 4.12.1 reported 28 passes, 0
  violations, 0 incomplete; the selected chrome mounted and no page error was
  recorded.
- Saved draft editor: after asynchronous content settled, the selected
  production Tiptap prose field had one `contenteditable` element and the
  existing native structural controls remained present. Axe reported 26
  passes, 0 violations, and one existing incomplete color-contrast check for
  two partially obscured native textareas; it was not a violation.
- Immutable Revision 2: the frozen request-example panel rendered independently
  of draft state. Axe reported 28 passes, 0 violations, 0 incomplete.
- Operation routes now finish with only expected Vite/React development logs;
  the final page-error scans were empty. Browser resource review observed no
  request to `api.example.com` while loading, switching, copying, or
  downloading examples.

Screenshots from the synthetic public supported route:

- [desktop 1280px](2026-08-05-documentation-post-v1-hardening-public-desktop.png)
- [narrow 320px](2026-08-05-documentation-post-v1-hardening-public-320.png)

### Existing-product smoke

Real Chromium routes loaded without page errors for:

- Capture Sessions list, including synthetic active/empty/canceled states;
- Organization Members;
- Browser Extension installation page;
- empty Project Guide list and empty Interactive Demo list;
- missing public and embed Guide states;
- missing public and embed Interactive Demo states.

The existing Extension route exposed one unrelated axe contrast violation on
the “Capture tools” eyebrow (`#64748b` on `#f7f8fb`, measured 4.48:1) and two
gradient-background incomplete checks. This is outside the Child 145
Documentation write set, was not introduced by these commits, and is routed
to maintenance/QA with trigger: any future Extension visual/a11y work or the
next workspace WCAG sweep. It is not claimed as a clean pass.

Optional engine/AT limits:

- `agent-browser --engine firefox ...` and
  `agent-browser --engine webkit ...` were attempted; agent-browser `0.33.1`
  supports only `chrome` and `lightpanda` in this environment, and no Firefox,
  Firefox ESR, or WebKit binary was installed.
- `command -v orca`, `espeak`, and `speech-dispatcher` found no installed
  screen-reader stack. Accessibility-tree, axe, keyboard, focus, target-size,
  reflow, and reduced-motion results are recorded; no real screen-reader pass
  is claimed.

## Performance, bundle, and security checks

The final `pnpm --filter web build` emitted:

| surface                                                  |       raw |     gzip |
| -------------------------------------------------------- | --------: | -------: |
| `DocumentationTiptapProseField`                          |   5.64 kB |  2.20 kB |
| `DocumentationPublicationReaderChrome`                   |  10.02 kB |  4.17 kB |
| `DocumentationRequestExamples`                           |  10.16 kB |  4.13 kB |
| `LazyDocumentationRequestExamples` boundary/shared graph | 131.39 kB | 32.82 kB |
| `DocumentationApiOperationExperience`                    |  19.22 kB |  6.83 kB |
| `PublicDocumentationReaderPage`                          |   6.88 kB |  2.69 kB |
| `DocumentationSiteEditorPage`                            |  51.52 kB | 13.77 kB |

The request-example UI remains dynamically loaded. The production manifest
contains no Tiptap module in the public reader chunk, and no Fumadocs reader
module in the authoring field chunk. The development-only adapter proof seam
remains lazy and non-selectable outside Vite development, as explicitly handed
off by Child 141/142/143; the production `dist` scan contained no selectable
`__documentation_adapter_proof` query behavior.

Twenty-one local browser actions covered tab switching, keyboard Home/End,
copy/download, search submission, focus, scroll, and request-builder loading.
The public route recorded no PerformanceObserver long tasks and a DOM count of
125 in the final local session. `vitals --json` recorded FCP 380 ms and LCP
1048 ms in this development lab; no p75 or production claim is made. The
route had `scrollWidth=clientWidth=1280` at desktop.

Security and boundary checks confirmed:

- generated output uses only the placeholder `https://api.example.com` and
  bounded placeholders; no credential value or private origin appears;
- sensitive body/parameter examples are redacted before descriptor admission;
- Copy and Download use bounded text and safe filenames; generated examples
  never issue a target request;
- public operation fallback does not grant navigation or Try-It authority;
- no new endpoint, response field, cookie, migration, schema, persistence
  field, proxy, SDK, package archive, or hosted call was added;
- migration inventory remains at head `031`;
- `pnpm licenses list --filter web` passed. Retained direct packages remain
  exact MIT pins: Tiptap `3.29.2` packages and `fumadocs-core 16.14.0`;
- `pnpm audit --prod` remains non-zero for existing workspace findings:
  `fast-uri` high in the server graph, PostCSS moderate, and Babel low through
  the existing Fumadocs/Next graph. No new dependency or advisory was added;
- frozen install passed; no rejected Tiptap UI/Pro/Cloud/AI/Collaboration or
  Fumadocs UI/MDX/Loader package was found in the web manifest/source graph.

## Automated verification

- `pnpm --filter @repo/documentation-domain test`: 20 files / 55 tests passed.
- Documentation server focused tests: 5 files / 39 tests passed.
- `pnpm --filter web test -- --reporter=verbose`: 91 files / 469 tests passed.
- Web and Documentation-domain type-checks and lint passed.
- Documentation-domain build passed.
- `pnpm --filter web build` passed with the final chunk table above.
- Root `pnpm check-types`: 13 successful tasks.
- Root `pnpm lint`: 14 successful tasks, 0 errors, and 89 pre-existing server
  warnings; no new warning was introduced by this child.
- `pnpm install --frozen-lockfile --ignore-scripts`: passed.
- `git diff --check`: passed.

## Limitations and ownership

- Firefox/WebKit and real screen-reader coverage are maintenance/QA gaps with
  the bounded attempts recorded above.
- Go/gofmt remains unavailable in this environment; Child 144’s deterministic
  Go generator contract and source-level tests remain the available proof.
- The existing native textarea contrast incomplete check on the draft editor
  is retained with manual-review evidence; no axe violation was found.
- The unrelated Extension contrast violation is maintenance/QA-owned as
  described above.
- Known workspace audit findings are separately owned dependency maintenance;
  changing unrelated packages is outside this child.

No in-scope S1 or S2 defect remains. Child 146 receives the exact fix commits
`37e4bc8` and `72b8943`, this evidence file and screenshots, the final build
numbers, migration head `031`, dependency/audit limitations, and the optional
engine/AT ownership record.
