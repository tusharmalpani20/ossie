# Child Plan 134: Documentation Import, Export, And Package Portability

Date reserved: 2026-07-30

Date expanded: 2026-07-30

Status: Implementation-ready and independently rechecked against completed
child `133`, Master `006`, accepted decisions, and the current codebase at
baseline `2fec4e7`. Planning checkpoint complete; no runtime implementation is
claimed.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/133-documentation-content-snippets-and-asset-workflows.md`

Next child:

- `docs/plan/135-documentation-carry-forward-multi-site-and-lifecycle.md`

Decision sources:

- `docs/grill/2026-07-29-documentation-domain-grill.md`, accepted Question `22`;
- `docs/documentation-domain-decisions.md`;
- `CONTEXT.md`;
- ADR `0009` for File-domain ownership;
- ADRs `0027`–`0030`.

## 1. Sequence Gate And Baseline

Child `133` is complete and close-rechecked. Its authoritative baseline
includes:

- migrations `025` and `026`;
- PostgreSQL-authoritative Site, Edition, Working Draft, Page, Navigation,
  routing, Snippet, Documentation Asset, OpenAPI, Revision, Publication, and
  Publish Link state;
- the complete constrained V1 typed-block set and controlled Markdown scalar
  grammar version `1`;
- Edition-owned Snippets with no nesting or live cross-Edition use;
- exact same-Project Guide and Interactive Demo Published Artifact references;
- Edition-owned Documentation Assets and authorized same-Project Capture Asset
  reuse;
- server-authoritative relational reference checks, retained archived-reference
  semantics, protected File byte inspection, and verified Revision digests;
- immutable relational Site Revision projections and exact public adapters;
- hard Page, Snippet, Asset, OpenAPI, Revision, and reader safety ceilings;
- one consolidated Fastify Documentation module and one portal workbench;
- complete Audit/Access registry coverage for the shipped Documentation
  commands and reads;
- deterministic Documentation fixtures, smoke coverage, and headless-browser
  evidence.

This child may serialize and import those contracts. It must not reinterpret
Markdown, ZIP entries, an upload, or a parser AST as durable authority.

Before implementation, the implementing agent must:

1. reread this plan, Master `006`, completed child `133`, Question `22`, the
   decision consolidation, Context, ADR `0009`, ADRs `0027`–`0030`, and child
   `133` browser evidence;
2. record `git status --short`, current commit, migration head, dependency
   state, and unrelated user/agent changes;
3. inspect every affected file in section 8 and reconcile any changes made
   after baseline `2fec4e7`;
4. recheck the dependency choices in section 9 against the current registry,
   Node `22`, licenses, peer dependencies, and lockfile;
5. independently recheck this plan against the actual code and Master `006`;
6. commit the rechecked plan checkpoint before runtime code;
7. use test-driven development for runtime work.

Do not begin child `135` Carry-Forward or lifecycle work to make package apply
easier.

## 2. Mission

Deliver the three accepted V1 portability paths without creating a second
source of truth:

1. safe single-Page CommonMark import/export;
2. a deterministic, versioned, self-contained whole-Site ZIP package;
3. exact self-contained OpenAPI JSON/YAML export paired with the existing
   inspect/apply import flow.

All imports follow Inspect then Apply. Inspect may persist bounded temporary
upload/projection state, but it does not mutate a Site Working Draft. Apply
performs one authorized, concurrency-checked logical mutation. After Apply,
relational Working Draft rows and protected File storage are authoritative.

All exports read one explicitly selected consistent state and never alter a
draft, create history, publish, or change a Publish Link.

## 3. Required End-To-End Journeys

### 3.1 Single-Page Markdown

The implemented child must prove:

1. an Editor chooses one UTF-8 `.md` File;
2. the server authorizes the active writable Project Version before retaining
   the upload; the exact target Site is selected and reauthorized at Apply;
3. Inspect parses only the accepted CommonMark subset and returns a safe
   proposed title/path, block counts, warnings, and blocking issues;
4. Inspect creates no Page, Snippet, Asset, OpenAPI Source, Revision,
   Publication, or Publish Link;
5. the Editor resolves title/path conflicts explicitly;
6. Apply supplies the inspection fingerprint, target Site, expected Working
   Draft version, explicit proposed metadata, and an idempotency key;
7. Apply creates one new Page and its relational children atomically;
8. retry returns the same result and never creates a second Page;
9. stale draft/path state fails without partial mutation;
10. the new Page uses the normal editor, preview, checkpoint, and publication
    paths;
11. exporting that Page from the saved draft produces deterministic readable
    Markdown without IDs, private URLs, comments, credentials, or File bytes.

Single-Page Markdown import is a create-only convenience. It may add one Page
to a populated writable Site, but never overwrites or merges into an existing
Page. Full-Site package Apply retains the stricter empty-draft rule.

### 3.2 Whole-Site Package

The implemented child must prove:

1. a Viewer, Editor, or Admin selects saved draft, exact Revision, or exact Site
   Publication as the export source;
2. export authorizes that exact source and every required protected File before
   reading;
3. export emits the canonical package layout and deterministic manifest;
4. repeated export of the same exact state produces byte-identical ZIP output;
5. referenced Documentation/Capture Asset bytes appear once under generated
   safe package paths with exact size/MIME/dimensions/SHA-256;
6. Capture-backed images become package-local media, not Capture IDs;
7. Snippet/Page/navigation/routing/OpenAPI relations use package-local handles;
8. exact Guide/Demo relationships become safe unresolved external bindings
   without database IDs, link slugs, or private URLs;
9. a second authorized user uploads that package for Inspect;
10. Inspect rejects malicious archive forms before content mutation and returns
    the complete safe proposed graph, required external bindings, warnings, and
    conflicts;
11. the user explicitly maps every external binding to an authorized,
    type-correct same-Project Published Artifact;
12. Apply targets either a newly created Site or an explicitly empty writable
    Site Working Draft;
13. one transaction creates/remaps the complete Site-owned graph and permanent
    provenance, while protected File writes use bounded compensation;
14. retry is idempotent and a stale/failed Apply leaves no partial draft,
    false Revision, Publication, Publish Link, or orphaned active File record;
15. the imported Site can be edited, checkpointed, published, searched, and
    exported again through ordinary child `133` paths;
16. a normalized semantic round trip is equal after replacing database IDs and
    Row Versions with package-local handles.

### 3.3 OpenAPI Portability

The implemented child must prove:

1. existing JSON/YAML upload Inspect/Apply behavior remains compatible;
2. an authorized internal user may export the exact current-draft,
   post-`027` Revision, or Site Publication OpenAPI source File in its original
   supported format;
3. export is protected by `documentation.read`, creates Access Evidence, and
   never exposes storage/provider data;
4. a whole-Site package includes one self-contained OpenAPI source exactly
   once when the selected source contains it;
5. import runs the same bounded OpenAPI parser and policy used by the existing
   direct upload;
6. external `$ref` or any network/file/data resolution remains rejected;
7. no imported `servers`, callback, example, extension, or security scheme is
   executed or treated as a credential.

## 4. Supported V1 Formats

| Path                                                   | Import                     | Export                                | Authority after import                            |
| ------------------------------------------------------ | -------------------------- | ------------------------------------- | ------------------------------------------------- |
| One UTF-8 `.md` Page                                   | Yes, create-only           | Yes, draft/Revision/Publication Page  | Relational new Page                               |
| Canonical Ossie Site ZIP                               | Yes, new/empty target only | Yes, draft/Revision/Publication Site  | Relational Site Working Draft and protected Files |
| One self-contained OpenAPI `.json`, `.yaml`, or `.yml` | Existing Inspect/Apply     | Exact draft/Revision/Publication File | Relational OpenAPI Source and protected File      |

Rejected in this child:

- arbitrary HTML, MDX, JSX, JavaScript, React, directives, plugins, iframes, or
  executable examples;
- remote media, remote OpenAPI URLs, external `$ref`, filesystem paths, or
  server-folder import;
- Git/GitHub authority or synchronization;
- Word, PDF, Notion, Confluence, or third-party adapters;
- nested ZIP/archive formats;
- encrypted/signed package semantics;
- browser folder picker. It remains an optional later adapter over the exact
  ZIP contract and is not required for child `134`.

## 5. Source-Of-Truth And Ownership Rules

### 5.1 Authoritative state

Authoritative after Apply:

- existing relational Working Draft tables;
- protected `file_schema.file` rows and bytes;
- ordinary Row Versions and Working Draft version;
- permanent safe import-application provenance;
- ordinary Audit and Access Evidence.

Temporary/non-authoritative:

- uploaded Markdown/ZIP File;
- parser AST;
- normalized inspection JSON;
- inspection preview and issue list;
- package-local handles;
- derived Markdown fallback;
- generated ZIP bytes.

No import writes Site Revision, Site Publication, Published Artifact, Publish
Link, Audit history, public search, or public cache records directly.

### 5.2 Ownership

- an Import Inspection belongs to one Organization, Project, Project Version,
  actor, source File, kind, digest, and expiry;
- only its creating actor may read, Apply, or cancel it;
- an Import Application belongs permanently to the target Site Edition and
  records safe source format/version/digest/counts;
- package-local handles have meaning only inside one inspected package;
- imported media becomes new Edition-owned Documentation Assets even when the
  exported source was a Capture Asset;
- external Guide/Demo bindings remain exact same-Project Published Artifact
  references selected explicitly during Apply;
- a package never establishes live Snippet, Asset, OpenAPI, Page, or external
  relationship synchronization.

### 5.3 Adapter boundary

Child `134` neither adopts nor persists Tiptap/Fumadocs state. Import/export
converters operate on the child `133` shared schemas and relational
projections:

- no Tiptap JSON appears in a package, inspection, Working Draft, or receipt;
- no Fumadocs filesystem/content-source loader parses a package or becomes
  export authority;
- the existing Ossie-native editor/reader remains the fallback and rendering
  behavior is unchanged;
- a future approved Tiptap/Fumadocs adapter must consume the same relational
  result and cannot alter package compatibility.

## 6. Exact Portable Contracts

### 6.1 Package identity and version

V1 constants:

```ts
DOCUMENTATION_PACKAGE_FORMAT = "ossie.documentation-site";
DOCUMENTATION_PACKAGE_FORMAT_VERSION = 1;
DOCUMENTATION_PACKAGE_PROFILE = "roundtrip" | "markdown-folder";
```

Version `1` is the first supported version. There is no fictional legacy
version. The implementation must:

- accept exact integer version `1`;
- reject missing, zero, negative, fractional, string, or future versions with
  `documentation_import_unsupported_version`;
- freeze at least one valid V1 golden package fixture;
- promise that when V2 is introduced, V1 import support is not removed without
  an explicit compatibility decision and migration fixture;
- ignore no unknown fields in V1: package schemas are strict.

Profile ownership:

- `roundtrip` is the canonical exporter output and the only lossless typed
  whole-Site profile;
- `markdown-folder` is a versioned, manifest-bearing import adapter for teams
  authoring the accepted CommonMark subset. It is not an arbitrary ZIP
  heuristic and does not infer a Site from an unversioned folder;
- both profiles use `ossie-docs.json` and `site.json`, so archive validation,
  Site metadata, Page paths, Navigation, aliases, routes, media, and OpenAPI
  remain explicit;
- the V1 exporter always emits `roundtrip`. Its required `pages/*.md` files are
  the accepted readable Markdown-folder export. There is no second lossy
  export route or silent typed-block downgrade;
- the optional browser folder picker remains deferred because it would need to
  construct this exact package client-side. Direct host-folder/server-folder
  access remains forbidden.

For `markdown-folder`, `typed_path` is null for every Page; Page JSON entries
are forbidden; Snippet JSON is allowed only for independent active Snippets
listed by `site.json`, because Markdown Pages cannot encode a
`snippet_reference`; and typed Page-only relationships (`api_reference`,
Guide/Demo Publication cards, callouts, tabs, tables, and images outside the
declared Markdown image form) are blocking issues rather than guessed
fallbacks. OpenAPI may still be declared and imported as owned Site source
state even when no Page references it.

### 6.2 Canonical ZIP layout

```text
ossie-docs.json
README.md
site.json
pages/
  page-0001.json
  page-0001.md
snippets/
  snippet-0001.json
assets/
  asset-0001.png
openapi/
  source.json
```

Rules:

- `ossie-docs.json`, `README.md`, and `site.json` are required;
- `pages/*.md` are required for every Page;
- `pages/*.json` are required for `roundtrip` profile Pages and absent for a
  Markdown-only Page in `markdown-folder`;
- `snippets/*.json` are allowed only when referenced by `site.json`;
- `assets/*` and `openapi/source.*` are allowed only when declared;
- no unrecognized root or nested entry is silently ignored;
- directory entries are optional and carry no meaning;
- every meaningful entry appears exactly once in the manifest with exact path,
  role, byte length, MIME, and lowercase SHA-256;
- `ossie-docs.json` does not hash itself;
- package paths are generated ASCII paths, independent of customer titles and
  original filenames.

`README.md` is generated from a fixed V1 explanatory template on export. Import
checks only its path/hash/UTF-8/size and never renders, parses into content, or
stores it as Documentation.

### 6.3 `ossie-docs.json`

Add a strict shared `DocumentationPackageManifestV1Schema` with:

```ts
{
  format: "ossie.documentation-site";
  format_version: 1;
  profile: "roundtrip" | "markdown-folder";
  source: {
    kind: "working_draft" | "site_revision" | "site_publication";
    project_version_label: string;
    revision_number: number | null;
    publication_sequence: number | null;
  }
  content_fingerprint: string; // lowercase sha256
  site_path: "site.json";
  readme_path: "README.md";
  entries: Array<{
    path: string;
    role:
      | "readme"
      | "site"
      | "page_typed"
      | "page_markdown"
      | "snippet"
      | "asset"
      | "openapi";
    mime_type: string;
    size_bytes: number;
    sha256: string;
  }>;
}
```

`content_fingerprint` hashes the canonical validated portable graph plus the
sorted entry descriptors, excluding ZIP metadata and the fingerprint field
itself. It is not a signature or authorization token.
Inspect independently recomputes every entry digest/descriptor and this
fingerprint from observed bytes; any mismatch is
`archive_integrity_mismatch` and no ready inspection is created. The whole
uploaded ZIP SHA-256 remains the separate `source_digest`.

Do not include export time, actor, Organization, Project ID, Site ID, Edition
ID, database row IDs, Row Versions, File IDs, storage keys, Publish Link state,
or access policy.

### 6.4 `site.json`

Add a strict `DocumentationPortableSiteV1Schema`:

```ts
{
  schema_version: 1;
  site: {
    name: string;
    description: string | null;
    primary_language: string;
  };
  home_page_handle: string | null;
  pages: Array<{
    handle: string;
    title: string;
    description: string | null;
    canonical_path: string;
    keywords: string[];
    typed_path: string | null;
    markdown_path: string;
  }>;
  snippets: Array<{
    handle: string;
    path: string;
  }>;
  assets: Array<{
    handle: string;
    path: string;
    name: string;
    status: "active" | "archived";
    mime_type: "image/png" | "image/jpeg" | "image/webp";
    size_bytes: number;
    width: number;
    height: number;
    sha256: string;
  }>;
  navigation: Array<PortableNavigationNode>;
  aliases: Array<{
    page_handle: string;
    former_path: string;
  }>;
  routes: Array<{
    source_path: string;
    outcome: "redirect" | "gone";
    target_page_handle: string | null;
  }>;
  openapi: {
    path: string;
    original_format: "json" | "yaml";
    sha256: string;
  } | null;
  external_bindings: Array<PortableExternalBinding>;
}
```

Portable navigation nodes use handles and parent handles:

```ts
{
  handle: string;
  parent_handle: string | null;
  kind: "group" | "page";
  label: string | null;
  page_handle: string | null;
  position: number;
}
```

Portable external bindings:

```ts
{
  handle: string;
  kind: "guide_publication" | "interactive_demo_publication";
  display: {
    title: string;
    description: string | null;
    project_version_label: string;
    revision_number: number;
    publication_sequence: number;
  }
}
```

The display object is a review hint only. Apply requires a caller-supplied
database identity and server-side authorization/type validation. Never resolve
by title, slug, sequence, or display fields.

Source inclusion:

- draft: every current Page, active Snippet plus referenced archived Snippet,
  Navigation node, alias, route, current OpenAPI Source, active Documentation
  Asset plus referenced archived Documentation Asset, referenced Capture
  Asset, and used external binding;
- Revision/Publication: exactly the Page/Snippet/navigation/alias/route/Asset/
  OpenAPI/external relationship graph frozen in that immutable source;
- comments/replies/mentions, draft search rows, unused archived mutable
  resources, Revision/Publication history, and Publish Link state are never
  included.

The Page index in `site.json` is authoritative package metadata. In
`roundtrip`, each Page JSON file must repeat the exact same
title/description/canonical path/keywords so a mismatch is rejected rather
than resolved by precedence. In `markdown-folder`, the Page index supplies
those fields and the Markdown file supplies blocks. An optional leading H1
must equal the indexed title after the ordinary title normalization or
inspection blocks Apply.

`home_page_handle=null` is valid only for a current Working Draft that has no
Home Page. Revision/Publication packages always have a non-null Home Page.
When non-null, the package Home Page, navigation Page handles, aliases, routes,
internal links, and content relationships must all resolve within the selected
source. A null Home Page does not permit a dangling Navigation/route target and
does not make an incomplete draft publishable.

“Unlisted” remains derived from a Page's absence from Navigation; V1 packages
do not add a second boolean. The implemented Navigation kinds are `group` and
`page`; child `134` must not invent the grill's provisional external-navigation
item as a portability-only runtime type.

Whole-graph validation must also reject, before Apply:

- duplicate Page canonical paths and every Page/alias/redirect/gone namespace
  collision under the existing normalized path policy;
- duplicate active Snippet names or duplicate active Documentation Asset names
  under the existing case-insensitive Edition indexes;
- duplicate keywords, non-contiguous positions, Navigation cycles/depth
  excess, duplicate Page placement, dangling handles, and invalid Home Page;
- an archived Snippet/Asset that is not required by any retained content;
- a `markdown-folder` Page that declares typed JSON or a typed relationship it
  cannot encode;
- any graph that would violate current post-Apply Page/Snippet/Asset/OpenAPI,
  saved-text, or Revision aggregate ceilings.

### 6.5 Page and Snippet typed files

`DocumentationPortablePageV1Schema`:

```ts
{
  schema_version: 1;
  handle: string;
  title: string;
  description: string | null;
  canonical_path: string;
  keywords: string[];
  blocks: PortableDocumentationBlockV1[];
}
```

`DocumentationPortableSnippetV1Schema`:

```ts
{
  schema_version: 1;
  handle: string;
  name: string;
  status: "active" | "archived";
  blocks: PortableDocumentationSnippetBlockV1[];
}
```

Portable blocks mirror the child `133` discriminants and safe scalar fields,
but replace identities:

- internal Page/heading links use `page_handle` and `block_handle`;
- `snippet_reference` uses `snippet_handle`;
- image uses `asset_handle`;
- OpenAPI references use an operation `destination_key`, never Source/operation
  database IDs;
- Guide/Demo reference uses `external_binding_handle`;
- every block/list item/table row/table cell/tab has a package-local handle;
- positions are explicit positive integers and must be contiguous;
- no `expected_version`, database ID, timestamps, actor, File identity, storage
  data, or frozen private URL appears.

The converter is exhaustive over this V1 matrix:

| Current block kind                | Portable fields beyond `handle`, `kind`, `position`                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `paragraph`                       | `text`                                                                                                      |
| `heading`                         | `level`, `text`                                                                                             |
| `ordered_list` / `unordered_list` | ordered child items with `handle`, `position`, `text`                                                       |
| `code`                            | `code`, nullable `language`                                                                                 |
| `link`                            | `label` and exactly one safe `url` or `page_handle`; nullable `target_block_handle` only with a Page handle |
| `image`                           | `asset_handle`, `alt_text`, nullable `caption`                                                              |
| `divider`                         | no additional fields                                                                                        |
| `api_reference`                   | nullable `operation_destination_key`; null retains the current whole-source overview semantics              |
| `quote`                           | `text`, nullable `attribution`                                                                              |
| `table`                           | nullable `caption`; ordered rows/cells with handles, positions, `is_header`, and `text`                     |
| `code_example`                    | `code`, nullable `language`, nullable `title`                                                               |
| `callout`                         | `tone`, nullable `title`, `text`                                                                            |
| `tabs`                            | ordered items with `handle`, `position`, `label`, and `body`                                                |
| `snippet_reference` (Page only)   | `snippet_handle`                                                                                            |
| `guide_publication`               | `external_binding_handle` whose binding kind is `guide_publication`                                         |
| `interactive_demo_publication`    | `external_binding_handle` whose binding kind is `interactive_demo_publication`                              |

Portable Snippet blocks use the same matrix except
`snippet_reference`, which remains forbidden. Every controlled-Markdown
scalar retains `DOCUMENTATION_CONTROLLED_MARKDOWN_VERSION=1` behavior and is
revalidated by the existing child `133` policy on Inspect and Apply. The
portable schemas do not carry the legacy `asset_id` compatibility alias; image
authority is always one `asset_handle`.

The shared schema and domain converter must cover every current
`DOCUMENTATION_BLOCK_KINDS` member. An unknown/retired kind is a blocking
inspection issue, not a paragraph fallback.

### 6.6 Package-local handles

- grammar: `^[a-z][a-z0-9-]{0,63}$`;
- unique within the applicable collection and, for child handles, within the
  owner;
- export assigns deterministic handles from canonical sorted order:
  `page-0001`, `snippet-0001`, `asset-0001`, and typed child equivalents;
- sorting ties may use source database IDs internally, but those IDs never
  appear in output;
- import never reuses a handle as a database ID;
- Apply allocates fresh ULIDs and builds complete handle maps before relational
  insertion;
- case-folded or Unicode-normalized duplicates are rejected.

### 6.7 Deterministic JSON and ZIP

Canonical JSON:

- UTF-8 without BOM;
- customer-authored scalar values are preserved byte-for-byte at the Unicode
  code-point level after the existing child `133` validation; the canonical
  serializer must not silently NFC/NFKC-normalize Page, Snippet, title,
  description, label, code, or controlled-Markdown content;
- package handles, entry paths, canonical Page paths, and other identifier
  fields must already satisfy their explicit normalization policy before
  serialization;
- object keys recursively sorted lexicographically;
- arrays remain in contract-defined deterministic order;
- two-space indentation and one final LF;
- no non-finite numbers;
- no locale-dependent formatting.

Canonical ZIP export:

- entries in lexicographic path order;
- generated paths only;
- fixed UTC timestamp `1980-01-01T00:00:00Z`;
- DEFLATE at fixed level `9`; use STORE for an entry when its deterministic
  DEFLATE result would exceed the accepted `100:1` ratio, so Ossie never emits
  an entry its own preflight must reject;
- no archive/entry comments or platform-specific extras;
- regular files mode `0644`, directories `0755`;
- identical source graph and protected bytes must yield identical ZIP bytes on
  the supported runtime and under different process locale/time-zone settings.

ZIP timestamps are DOS-local fields. The generator must prove the exact encoded
date/time bits rather than assume that passing a JavaScript `Date` to JSZip is
UTC-stable. If JSZip cannot pass the cross-`TZ` golden test using public APIs,
choose a reviewed deterministic writer instead of patching private fields.

Binary ZIP determinism is tested with a SHA-256 golden fixture. Semantic
determinism is also tested independently so a future reviewed ZIP-library
change can be evaluated explicitly.

### 6.8 Inspection/result support types

Add strict shared schemas for:

```ts
type ImportIssue = {
  severity: "blocking" | "warning";
  code: string; // closed child-134 issue-code enum, not arbitrary parser text
  location: string | null; // normalized package-local path only
  line: number | null;
  column: number | null;
  message: string; // Ossie-owned non-sensitive message
};

type ImportCounts = {
  pages: number;
  snippets: number;
  assets: number;
  openapi_sources: number; // 0 | 1
  external_bindings: number;
  navigation_nodes: number;
  aliases: number;
  routes: number;
  blocks: number;
};

type RequiredBinding = {
  handle: string;
  kind: "guide_publication" | "interactive_demo_publication";
  display: PortableExternalBinding["display"];
};
```

The initial closed issue-code enum is:

```ts
[
  "archive_entry_unsafe",
  "archive_limit_exceeded",
  "archive_integrity_mismatch",
  "manifest_invalid",
  "package_version_unsupported",
  "package_profile_invalid",
  "content_unsupported",
  "markdown_invalid",
  "openapi_invalid",
  "media_invalid",
  "identity_duplicate",
  "relationship_unresolved",
] as const;
```

Preflight-only codes use the same internal diagnostic enum for test/log
classification but map to the typed HTTP error and are never persisted as a
ready `ImportIssue`. Only diagnostics produced after a structurally safe parse
may enter `safe_report`.

Parser/library exception strings, stack traces, ZIP raw names, storage keys,
database IDs, and source excerpts never populate these types. Unknown internal
failures map to one generic issue/error at the service boundary and remain
available only in redacted operational logs.

## 7. Markdown Contract

### 7.1 Parser boundary

Single-Page and `markdown-folder` parsing accepts UTF-8 CommonMark with:

- one optional leading H1 used as a title proposal and not saved as a content
  block;
- H2–H4 headings;
- paragraphs;
- flat ordered and unordered lists whose items each contain exactly one
  paragraph; ordered lists must start at `1` because the relational block does
  not store a custom start number;
- fenced code blocks with an optional safe language token;
- block quotes without nesting;
- thematic breaks;
- inline text, `**strong**`, `*emphasis*`, backtick code, and line breaks;
- a safe external link using the existing `http`, `https`, `mailto`, and `tel`
  policy only when the link is the sole inline child of its paragraph, so it
  maps exactly to the current block-level `link` contract;
- a package-relative link to another declared Markdown Page only when it is
  the sole inline child of its paragraph; an optional fragment must resolve to
  one unambiguous imported heading target;
- package-relative image syntax only inside a Site package, only as the sole
  inline child of its paragraph, with non-empty alt text and a target that
  resolves exactly to one declared package Asset. Its optional CommonMark
  image title maps to the current nullable image caption and must satisfy the
  existing caption bound;

Reject or report as blocking:

- raw/escaped HTML nodes;
- MDX/JSX/import/export;
- mixed prose plus inline link/image nodes, because the shipped relational
  scalar contract cannot preserve them losslessly;
- images in standalone Markdown, or package images that target undeclared,
  remote, absolute, data, or ambiguous media;
- embedded data/file/blob URLs;
- autoloaded remote media;
- directives, footnotes, task-list semantics, definition lists, math, Mermaid,
  plugins, and unknown extensions;
- nested lists/quotes beyond the accepted mapping;
- loose/multi-paragraph list items, ordered-list starts other than `1`, and
  fenced-code info strings containing anything beyond one accepted language
  token;
- H1 after content, H5/H6, tables, or content that cannot map losslessly to the
  supported Page block subset;
- duplicate heading-generated targets where a referenced target would be
  ambiguous;
- invalid UTF-8, NUL/control characters, bidi controls, or text/AST ceilings.

Unsupported input remains visible in the inspection issue list with path,
line/column when safely available, issue code, and non-sensitive message.
Apply is disabled while any blocking issue remains.

The exporter chooses a fence longer than the longest backtick run in code
content (minimum three) and emits deterministic line endings, so exported code
cannot terminate its own fence. Soft/hard line-break normalization and heading
destination generation must be specified once in
`documentation-markdown-policy.ts` and covered by golden tests; neither may
depend on browser/locale behavior.

All structural text inserted by the exporter (Page title, labels, captions,
attribution, fallback text, and link/image destinations) uses a
context-specific CommonMark escaper. It must not concatenate customer strings
into headings, links, image titles, or fences without escaping. Golden tests
cover brackets, parentheses, quotes, backslashes, backticks, newlines, and
the existing controlled-scalar policy. Roundtrip typed JSON preserves valid
child `133` scalar code points exactly; stricter Markdown-import checks do not
silently rewrite already-authoritative content during export.

### 7.2 Single-Page metadata

Do not introduce YAML front matter as a second metadata/parser contract.

Inspect proposes:

- title from the optional leading H1, otherwise sanitized filename stem;
- canonical path from sanitized filename stem;
- description `null`;
- `set_as_home=false`.

Apply requires the caller to submit final title/canonical path explicitly and
may set `set_as_home=true` only when the target draft currently has no Home
Page. Existing path/alias/routing namespace checks remain authoritative.

### 7.3 Markdown export

Single-Page export is readable CommonMark, not the lossless Site package.
It begins with exactly one `# <Page title>` and one blank line. Standalone
Markdown intentionally omits Page description and keywords because V1 rejects
front matter and has no safe round-trippable metadata envelope; the download
UI labels this limitation and points users to Site package export for complete
portability. Package Markdown uses the same H1 while `site.json` retains the
complete Page metadata.

Direct mappings:

- paragraph/heading/list/code/divider/quote → corresponding CommonMark;
- callout → labelled block quote;
- code example → title paragraph plus fenced code;
- table → deterministic HTML-free pipe-free plain-text rows in a fenced
  `text` block, preceded by its caption;
- tabs → one heading per tab plus body;
- Snippet reference → expanded visible Snippet content with an “Expanded
  snippet” label;
- image → visible omission note containing safe alt/caption only;
- API reference → safe method/path/summary fallback;
- Guide/Demo Publication → safe frozen title/type/version fallback;
- internal Page link → visible label plus “internal Page link omitted”;
- external safe link → ordinary Markdown link.

The output contains no internal/database ID, File/path URL, Publish Link,
private route, comment, audit/access data, credential, or binary Asset.

Standalone Markdown export never sanitizes or drops customer content silently.
If a valid existing child `133` Page contains a scalar that cannot be emitted
under the stricter Markdown-interchange safety grammar, return
`documentation_export_content_unsupported` and direct the user to the lossless
roundtrip package. The package's typed JSON remains authoritative; its readable
Markdown fallback is never reparsed as authority for `roundtrip`.

`roundtrip` ZIP import uses typed JSON as the lossless contract and validates
the paired Markdown path/hash as a readable fallback. It never merges edits
from both representations. `markdown-folder` uses Markdown as the Page source
and cannot represent typed relationships that the grammar excludes.

Within a ZIP, the readable Markdown fallback renders image blocks with
package-relative generated Asset paths and internal links with generated
relative Page paths. Standalone Page export uses the omission forms above
because it deliberately carries neither target Pages nor binary Files.

## 8. Exact Affected Files

The implementation must reconcile this list with the current tree during the
pre-code recheck.

### 8.1 Shared constants, schemas, and policies

Modify:

- `packages/constants/src/documentation.ts`
- `packages/constants/src/constants.test.ts`
- `packages/types/src/documentation.ts`
- `packages/types/src/documentation.test.ts`
- `packages/types/src/index.ts` only if its current barrel requires an export;
- `packages/documentation-domain/src/index.ts`
- `packages/documentation-domain/src/errors/documentation-domain-error.ts`
- `packages/documentation-domain/src/types/documentation-domain.ts`
- `packages/documentation-domain/src/policies/documentation-openapi-policy.ts`
- `packages/documentation-domain/src/policies/documentation-openapi-policy.test.ts`

Add:

- `packages/documentation-domain/src/policies/documentation-package-policy.ts`
- `packages/documentation-domain/src/policies/documentation-package-policy.test.ts`
- `packages/documentation-domain/src/policies/documentation-markdown-policy.ts`
- `packages/documentation-domain/src/policies/documentation-markdown-policy.test.ts`

Responsibilities:

- package/version/handle/path/hash/entry/inspection schemas;
- portable block schemas and converters;
- canonical JSON/fingerprint policy;
- Markdown AST allowlist and conversion policy;
- package semantic validation and complete relationship resolution;
- empty-target rules and issue codes;
- no database/storage/network behavior in the domain package.

### 8.2 Database and server

Add:

- `apps/server/src/db/migrations/027_documentation_import_export_portability.sql`
- `apps/server/src/modules/documentation/documentation-package.ts`
- `apps/server/src/modules/documentation/documentation-package.test.ts`
- `apps/server/src/modules/documentation/documentation-archive.ts`
- `apps/server/src/modules/documentation/documentation-archive.test.ts`
- `apps/server/src/modules/documentation/documentation-markdown.ts`
- `apps/server/src/modules/documentation/documentation-markdown.test.ts`
- `apps/server/src/modules/documentation/documentation-import-cleanup.ts`
- `apps/server/src/modules/documentation/documentation-import-cleanup.test.ts`

Modify:

- `apps/server/package.json`
- `pnpm-lock.yaml`
- `apps/server/src/app.ts`
- `apps/server/src/app.test.ts`
- `apps/server/src/modules/documentation/documentation.routes.ts`
- `apps/server/src/modules/documentation/documentation.routes.test.ts`
- `apps/server/src/modules/documentation/documentation.service.ts`
- `apps/server/src/modules/documentation/documentation.service.test.ts`
- `apps/server/src/modules/documentation/documentation.repository.ts`
- `apps/server/src/modules/documentation/documentation.repository.test.ts`
- `apps/server/src/modules/documentation/documentation.db.integration.test.ts`
- `apps/server/src/modules/documentation/documentation-openapi.ts`
- `apps/server/src/modules/documentation/documentation-openapi.test.ts`
- `apps/server/src/modules/documentation/documentation-asset-integrity.ts`
- `apps/server/src/modules/documentation/documentation-asset-integrity.test.ts`
- `apps/server/src/modules/file-storage/local-file-storage.provider.ts`
- `apps/server/src/modules/file-storage/local-file-storage.provider.test.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.ts`
- `apps/server/src/modules/audit/audit-coverage-registry.test.ts`
- `apps/server/src/modules/audit/audit-source-coverage.test.ts`
- `apps/server/src/modules/access/access-coverage-registry.ts`
- `apps/server/src/modules/access/access-coverage-registry.test.ts`
- `apps/server/src/modules/access/access-response-hook.test.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.ts`
- `apps/server/src/modules/project-activity/project-activity.repository.test.ts`
- `apps/server/src/db/foundation-schema.test.ts`
- `apps/server/src/db/foundation-schema.db.integration.test.ts`

Do not create a parallel Documentation server module. Routes remain in the
existing consolidated Documentation registration. Parser/archive helpers may
be separate pure modules.

### 8.3 Portal

Add:

- `apps/web/src/features/documentation/DocumentationPortabilityPanel.tsx`
- `apps/web/src/features/documentation/DocumentationPortabilityPanel.test.tsx`
- `apps/web/src/features/documentation/DocumentationImportReview.tsx`
- `apps/web/src/features/documentation/DocumentationImportReview.test.tsx`

Modify:

- `apps/web/src/features/documentation/DocumentationSiteEditorPage.tsx`
- `apps/web/src/features/documentation/DocumentationSiteEditorPage.test.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.tsx`
- `apps/web/src/features/documentation/ProjectDocumentationSiteListPage.test.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.tsx`
- `apps/web/src/features/documentation/DocumentationPageEditor.test.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.tsx`
- `apps/web/src/features/documentation/DocumentationOpenApiPanel.test.tsx`
- `apps/web/src/lib/documentationApi.ts`
- `apps/web/src/lib/documentationApi.test.ts`
- `apps/web/src/features/documentation/DocumentationContentWorkflows.module.css`
- `apps/web/src/App.tsx`, `apps/web/src/lib/routes.ts`,
  `apps/web/src/lib/portalRouteMetadata.ts`, and their tests only if a dedicated
  import-review route is needed after inspecting the current router.

Prefer an accessible Site-workbench panel with a dedicated review route only
when the issue/mapping UI cannot remain understandable inline.

### 8.4 Fixtures, smoke, and current truth

Modify:

- `apps/server/src/dev-fixtures/documentation-browser-fixture.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.test.ts`
- `apps/server/src/dev-fixtures/documentation-browser-fixture.db.integration.test.ts`
- `apps/server/src/smoke/v1-workflows.db.integration.test.ts`
- `CONTEXT.md`
- `docs/documentation-domain-decisions.md`
- `docs/plan/master/006-documentation-platform-v1-master-plan.md` only for
  child `134` items actually completed;
- this child plan.

Add:

- `apps/server/src/modules/documentation/fixtures/package-v1-valid.zip` only if
  the repository accepts a reviewed small binary golden fixture; otherwise
  generate it deterministically in the test and store the expected digest;
- `apps/server/src/modules/documentation/fixtures/package-v1-manifest.json`
- `docs/adr/0031-documentation-import-export-is-inspected-portability-not-authority.md`
- `docs/documentation-portability-format.md`
- `docs/ui/134-documentation-import-export-and-package-portability-browser-evidence.md`

Never commit generated export archives, uploaded test storage, screenshots,
coverage, `dist`, or `.turbo`.

### 8.5 Read-only contracts to inspect, not casually modify

- migrations `001`–`026`;
- ADRs `0027`–`0030`;
- child `133` plan and browser evidence;
- `apps/server/src/modules/publish/**`;
- Guide/Demo Revision and Published Artifact schemas/services;
- Capture Asset purge/protection code;
- public Documentation reader/search routes and components;
- `apps/docs/**`.

Touch one only if implementation proves a direct child `134` contract gap, and
record the reason in this plan before changing it.

## 9. Dependency Boundary

Existing:

- `jszip` is already present and may generate deterministic ZIP output only
  after fixed metadata/order golden proof;
- `yaml@2.9.0` remains the exact safe data-only OpenAPI YAML parser;
- `sharp` remains the bounded raster decoder;
- Node `crypto`, streams, and existing File storage remain the digest/byte
  boundary.

Add after current registry/license/Node recheck:

- a lazy-entry, streaming ZIP reader with public compressed/uncompressed size,
  encryption, path, and Unix mode metadata APIs; `yauzl` is the planned choice;
- `@types/yauzl` if required by the selected version;
- `mdast-util-from-markdown` for a CommonMark AST.

Planning recheck on 2026-07-30 found `yauzl@3.4.0`,
`@types/yauzl@3.4.0`, and `mdast-util-from-markdown@2.0.3`, all MIT; `yauzl`
declares Node `>=12`. The repository declares Node `>=18`, CI uses Node `22`,
and this planning host uses Node `24`. Treat these as reviewed candidates, not
an instruction to float versions: implementation must repeat the registry,
license, API, lockfile, and Node `18`/`22` compatibility check and pin the
accepted exact versions.

Use an Ossie-owned deterministic Markdown exporter over the accepted block set;
do not add a general renderer/plugin system for export.

Requirements:

- production dependencies belong only in `apps/server/package.json`;
- MIT/BSD-compatible licenses only;
- no Markdown plugins, HTML parser, MDX, network resolver, executable
  extension, native archive binary, or shell command;
- no dependence on ZIP-library private fields;
- package JSON must pass a bounded duplicate-key-aware tokenization step before
  ordinary JSON/Zod construction. Prefer a small reviewed streaming tokenizer;
  do not write a regex preflight. If an additional parser dependency is
  required, record its exact version/license/API proof in the planning
  implementation log before parser code;
- archive import must be streaming/lazy and fail before unbounded inflation;
- record exact selected versions, licenses, Node compatibility, and lockfile
  change in the implementation log.

If the selected ZIP reader cannot reliably expose encryption, entry type,
declared expanded size, compression method, header/range integrity, and lazy
streaming, stop and revise the plan rather than using `JSZip.loadAsync` for
untrusted imports.

## 10. Migration `027`

Migration filename:

`027_documentation_import_export_portability.sql`

Migrations `001`–`026` remain byte-for-byte unchanged.

### 10.1 `documentation_import_inspection`

Columns:

- `id`;
- `organization_id`, `project_id`, `project_version_id`;
- `created_by_id`;
- `kind`: `page_markdown | site_package`;
- `status`: `ready | consumed | cancelled | expired`;
- `source_file_id`;
- `source_digest`;
- `source_size_bytes`;
- `format_version` nullable for Markdown, `1` for package;
- `content_fingerprint`;
- `safe_report JSONB` nullable after terminal cleanup;
- `expires_at`, `consumed_at`, `cancelled_at`, `created_at`, `updated_at`;
- positive `version`.

Constraints/indexes:

- scoped unique `(id, project_version_id, project_id, organization_id)`;
- unique active source digest per actor/kind/project-version is not required;
  idempotency receipts own retry behavior;
- indexes for actor/status/expiry and cleanup;
- File/Project Version/actor scoped foreign keys;
- database transition guard permits only
  `ready -> consumed|cancelled|expired`; terminal states never return to ready,
  terminal timestamps/status must agree, and the same transition clears
  `safe_report` and marks the temporary source File deleted; byte purge remains
  best-effort compensation;
- `safe_report` is capped at 4 MiB and contains only response-safe counts,
  proposals, normalized package-local locations, warnings, and issues. It
  contains no Page/Snippet body, parser AST, File/storage key, raw manifest,
  credential, actor data, private URL, or comments.

### 10.2 `documentation_import_application`

Permanent safe provenance:

- `id`;
- `organization_id`, `project_id`, `project_version_id`;
- `documentation_site_id`, `site_edition_id`;
- `inspection_id`;
- `kind`, `format_version`, `source_digest`, `content_fingerprint`;
- one bounded column per `ImportCounts` field: Pages, Snippets, Assets, OpenAPI
  sources, external bindings, Navigation nodes, aliases, routes, and blocks;
- `created_by_id`, `created_at`.

Constraints:

- one successful application per inspection;
- scoped target foreign keys;
- immutable UPDATE/DELETE/TRUNCATE guards with controlled maintenance bypass;
- no source filename, original path, body, raw manifest, storage key, external
  display metadata, or database mapping JSON.

This is provenance, not Revision/Publication lineage and not a live sync link.

### 10.3 Existing-table interaction

Apply uses existing authoritative tables and constraints. Do not add import-only
content columns or bypass:

- Edition path/alias/routing namespace serialization;
- Page/Snippet/Asset limits;
- block/domain validation;
- same-Edition relational foreign keys;
- exact external Published Artifact foreign keys;
- Working Draft bump/version rules;
- Audit context/evidence guards;
- protected File ownership.

Add only the minimum scoped unique/index constraints required for inspection
and provenance.

### 10.4 Immutable OpenAPI source protection

Migration `027` adds
`documentation_schema.site_revision_openapi_source` because migrations
`025`/`026` freeze operation metadata but do not preserve the exact uploaded
OpenAPI File used by a Revision.

Columns:

- scoped Site Revision/Edition/Project/Organization identities;
- source OpenAPI Source ID;
- exact protected `file_id`, digest, MIME/original format, OpenAPI version, and
  safe title;
- created timestamp inherited from Revision creation semantics.

Rules:

- at most one source per Site Revision;
- immutable UPDATE/DELETE/TRUNCATE guards with controlled maintenance bypass;
- exact File/scope foreign keys;
- Revision creation after migration `027` validates and freezes the exact
  source File whenever the draft has an OpenAPI Source;
- Revision `content_digest` includes the verified exact OpenAPI source digest,
  format, and supported OpenAPI version. Replacing a source with
  operation-equivalent but byte-different content therefore creates/reuses the
  correct new Revision rather than matching a pre-`027` Revision that has no
  source snapshot. When the Working Draft has no OpenAPI Source, preserve the
  existing digest shape so source-free pre-`027` Revisions may still be reused;
- source File protection reporting includes this immutable reference;
- whole-package Revision/Publication export reads this row, never the current
  mutable OpenAPI Source;
- pre-`027` Revisions remain valid/readable but cannot claim a complete
  round-trip package when exact OpenAPI source bytes are required. That export
  fails clearly with `documentation_export_source_unavailable`;
- Page Markdown fallback may still use the already frozen safe operation
  metadata from an older Revision because it does not claim source-File
  round-trip fidelity.

Add this table to existing immutable-table tests and Revision digest/protection
coverage. Do not backfill it from current mutable OpenAPI state.

### 10.5 Grants, audit guards, reset, and rollback

Migration `027` must:

- grant the runtime role only the required table/sequence operations;
- include inspection/application tables in schema/reset tests;
- add Audit context/evidence guards for durable mutations;
- extend existing Documentation mutation-command guards for the exact
  `documentation.import.*`, Page-import Apply, and package-import Apply
  commands across every table they write; update the Audit coverage registry
  with the complete File/Site/Edition/draft/Page/child/Snippet/Asset/OpenAPI/
  inspection/application write set rather than bypassing a guard or pretending
  thousands of imported rows are one unrelated `site.create`;
- make DOWN fail when any `027`-owned inspection/application row or immutable
  `site_revision_openapi_source` row exists unless the existing controlled
  maintenance bypass is active;
- DOWN removes only child `134` objects and restores no earlier migration text;
- pass clean `001`–`027`, upgrade `026`→`027`, guarded `027` down/up, and
  runtime-role tests.

No legacy backfill exists. Existing Documentation rows remain unchanged.

### 10.6 Existing OpenAPI inspection hardening

Child `133` already has `documentation_schema.openapi_inspection`; do not
create a second OpenAPI-only inspection authority. Migration `027` and the
existing OpenAPI repository path must:

- preserve the existing inspect/apply route shapes and successful response
  schemas;
- require `created_by_id` to match the applying actor, closing the current
  cross-Editor inspection-ID replay gap without changing normal creator
  behavior;
- make `parsed_document` nullable after terminal cleanup;
- clear parsed content after successful Apply and after expiry;
- purge expired, unconsumed source bytes/File state through the same bounded
  cleanup mechanism as new imports;
- retain the successfully applied source File because it becomes the
  authoritative current OpenAPI Source, while removing only its temporary
  inspection payload;
- never backfill an old Revision's exact source from the current mutable
  OpenAPI Source;
- provide an upgrade cleanup path for pre-`027` expired/consumed inspections
  without performing unbounded physical storage work inside the migration.

The direct OpenAPI Inspect route currently buffers before authorization and has
no inspect idempotency header. Child `134` must move authorization before body
consumption and use bounded streaming/staging. To preserve its shipped API,
`Idempotency-Key` remains optional only for this existing Inspect route; when
present it receives normal first-`201`, replay-`200`, and conflict behavior.
Without it, first-success behavior remains `201`. Its existing Apply route
continues to require `Idempotency-Key`. The new Markdown/Site-package Inspect,
Apply, and Cancel mutations require the header.

## 11. Archive And Parser Safety Ceilings

Add named constants and tests. These are hard deployment safety ceilings, not
Organization product quotas:

| Boundary                                     |                     V1 ceiling |
| -------------------------------------------- | -----------------------------: |
| Markdown upload bytes                        |                          4 MiB |
| ZIP compressed upload bytes                  |                         32 MiB |
| ZIP total declared/observed expanded bytes   |                        128 MiB |
| ZIP entries                                  |                         10,000 |
| One non-media entry                          |                         10 MiB |
| One media entry                              |    existing 10 MiB image limit |
| Manifest bytes                               |                          2 MiB |
| Persisted safe inspection report             |                          4 MiB |
| Package path UTF-8 bytes                     |                            240 |
| Path segments                                |                              8 |
| One segment UTF-8 bytes                      |                             80 |
| Entry compression ratio                      | 100:1, with zero-byte handling |
| JSON/YAML/Markdown nesting                   |                            100 |
| Markdown AST nodes per Page                  |                         50,000 |
| Import issues returned                       |        500 plus truncated flag |
| Unique external bindings per package         |                          1,000 |
| Ready inspections per actor/project-version  |                             10 |
| Concurrent import parsers per server process |                              2 |
| Concurrent import parser per actor           |                              1 |
| Inspect attempts per actor/project-version   |              20 per 10 minutes |
| Inspection lifetime                          |                         1 hour |

Existing business ceilings remain authoritative:

- 1,000 Pages/Edition;
- 2,000 blocks/Page;
- 4 MiB saved Page text;
- 1,000 Snippets/Edition;
- 1,000 blocks/Snippet;
- 1 MiB saved Snippet text;
- 2,000 Documentation Assets/Edition;
- 20,000 OpenAPI operations;
- table/tab/control scalar and aggregate Revision limits from child `133`.

Inspect must calculate the proposed post-Apply totals, not only the uploaded
package counts.

The parser semaphore and authenticated actor/Project-Version rate bucket cover
new Markdown/package Inspect and existing direct OpenAPI Inspect. Acquire them
after authorization and before reading the multipart body; return `429` with a
bounded `Retry-After` and do not retain bytes when unavailable. State is
process-local hardening, bounded/pruned, and not represented as a product quota
or cross-node guarantee. Child `138` may make these operator-configurable
without weakening the hard upper bounds.

Export applies the same semantic graph, entry, expanded-byte, and final
compressed-byte ceilings so an emitted V1 package is accepted by the V1
importer. A larger otherwise valid Working Draft remains editable, but package
export fails with an actionable safety-limit error; the exporter never emits a
package its own importer must reject. Immutable Revisions/Publications should
already satisfy checkpoint ceilings, but export still verifies rather than
assumes.

Reject before or while streaming:

- encrypted entries;
- multi-disk, ZIP64, overlapping-entry, central/local-header mismatch, and
  unsupported compression-method forms; V1 ceilings do not require them;
- symbolic/hard links, sockets, devices, executables, or unsupported Unix mode;
- absolute/UNC/drive-letter paths;
- empty paths, `.`/`..`, backslashes, NUL/control/bidi characters;
- percent-decoded traversal or separator ambiguity;
- non-NFC, case-folded, or normalized duplicate paths;
- excess path/segment/depth length;
- unsupported or duplicate manifest/entry roles;
- nested archives;
- declared/observed size mismatch;
- ratio/count/expanded-size excess;
- CRC/read failure;
- MIME extension/signature mismatch;
- invalid UTF-8/BOM where disallowed;
- manifest size/hash/path mismatch.
- duplicate object keys at any depth in manifest/site/Page/Snippet JSON; plain
  `JSON.parse` is insufficient because it silently keeps one value;

Original entry names never become storage keys. All storage paths are generated
from ULIDs and the Import Inspection identity.

### 11.1 Storage layout and streaming

Extend the local File provider with explicit, non-overlapping generated
purposes:

```text
organizations/{org}/projects/{project}/documentation-import-inspections/{inspection}/source.{ext}
organizations/{org}/projects/{project}/documentation-sites/{site}/{file}.{ext}
organizations/{org}/projects/{project}/documentation-exports/{export}/package.zip
```

Rules:

- generate inspection/export IDs before writing;
- never interpolate an uploaded filename or ZIP entry path;
- use generated non-customer `file_schema.file.original_name` values
  (`page-import.md`, `site-package.zip`, or `openapi-source.<ext>`) for
  temporary/imported sources; retain the browser filename neither as authority
  nor durable provenance;
- stream multipart upload directly through size/hash accounting to protected
  storage; do not first concatenate a 32 MiB ZIP in route memory;
- replace the local provider's current `Buffer[]`/`Buffer.concat` write path
  with a bounded stream to a generated sibling partial file followed by atomic
  rename; size/hash failure removes the partial file and never exposes a
  completed storage key;
- keep the just-uploaded object as generated staging storage until parsing
  succeeds; create the protected File row and ready Inspection together in one
  audited transaction. Invalid input therefore leaves no temporary File row;
- package media staged for Apply uses the final generated target Site/File path
  and is retained only after the database transaction succeeds;
- failed Apply deletes every staged target File best effort;
- temporary source/export keys have dedicated exact-key purge operations;
- add a bounded provider enumeration for generated Documentation transient
  keys older than a cutoff. The cleanup service cross-checks candidate source
  keys against live `file_schema.file` rows and current inspection state before
  exact-key purge; it never recursively deletes an unresolved prefix, follows
  links, or trusts a customer path;
- successful import cleanup purges the source ZIP/Markdown only, never target
  Documentation Asset/OpenAPI bytes;
- ZIP export is fully prepared into a bounded temporary File before HTTP
  success headers are committed, then streamed to the response and deleted
  best effort on response completion;
- archive entry inflation and export generation remain sequential or use a
  small explicit concurrency bound; never buffer the full expanded package in
  memory.

## 12. Inspect And Apply State Machine

```text
bounded upload
  -> authorize writable Project Version
  -> stage exact temporary source bytes under a generated key
  -> stream/parse/normalize
  -> protected source File + READY inspection + safe report in one transaction
  -> user reviews and resolves choices
  -> authorize exact target and references
  -> re-read exact source File and fingerprint
  -> lock/recheck target and emptiness
  -> stage protected media
  -> one database transaction
  -> CONSUMED + permanent provenance
  -> best-effort source/staging cleanup
```

Terminal alternatives:

- invalid upload: no ready inspection; remove staged bytes, and compensate a
  File row only if the ready-inspection transaction itself failed after
  creating one;
- Inspect idempotency replay/conflict is resolved after the candidate upload
  digest is known; delete the duplicate candidate staging object before
  returning the stored response or conflict;
- user cancel: `cancelled`, clear the safe report, mark the temp File deleted,
  and purge bytes best effort;
- expiry: `expired`, same cleanup;
- failed Apply before transaction: inspection stays `ready` when retry is safe;
- failed Apply after staging but before commit: delete staged bytes best effort,
  no active File/content rows;
- successful Apply: inspection cannot be applied again except idempotent receipt
  replay returning the original application result.

Apply re-reads the stored source and recomputes digest/fingerprint. The
database safe report is a review cache, not authority over changed/missing
bytes.

Cleanup runs:

- before accepting another inspection for the same actor/project-version;
- before Get/Apply/Cancel inspection;
- through a bounded startup/operational cleanup entry point;
- without a long-running untracked timer in tests.

Cleanup clears `safe_report`, marks temporary File rows deleted, and purges
bytes best effort. Terminal status/digest/count provenance may remain; raw
content and detailed customer titles/paths do not.

The bounded cleanup also reconciles crash-orphaned `.part`, finalized
pre-transaction source, and export objects under the dedicated generated
prefixes. A candidate must be older than the safety cutoff, pass storage-key
validation, and have no live DB/File/inspection ownership before exact purge.
Tests create lookalike/symlink/out-of-prefix/live keys and prove they are never
removed.

## 13. Empty Target And Concurrency Rules

### 13.1 Full package

Target modes:

```ts
{
  mode: "create_site";
  name: string | null;
}
```

or:

```ts
{
  mode: "empty_site";
  site_id: string;
  expected_draft_version: number;
  expected_site_version: number;
}
```

`create_site` requires `documentation.site.manage` and creates Site, Edition,
Working Draft, nullable package Home Page, and all children atomically.
`name=null` accepts the package Site name; a non-null value is an explicit safe
override. Package description and primary language remain part of the new Site
proposal.

`empty_site` requires `documentation.write`. “Empty” means:

- no Revision, Site Publication, or Publish Link entry for the Edition;
- zero Pages, or exactly one placeholder Home Page with no keywords/blocks and
  no aliases;
- no Snippets, Documentation Assets, OpenAPI Source, comments, custom routes,
  or non-placeholder Navigation;
- no other import application;
- the exact expected Site/Working Draft versions still match.

For an existing empty Site:

- stable Site name/description remain unchanged;
- package primary language may replace the empty Edition language only when
  explicitly confirmed in Apply;
- the placeholder Page is removed/replaced inside the same transaction rather
  than retained as an extra imported Page;
- the package's nullable Home Page becomes the Working Draft Home Page. A
  package with no Home Page remains an incomplete draft and cannot be
  checkpointed/published until ordinary authoring assigns one;
- ignored package Site name/description values are shown as warnings during
  Inspect because stable metadata on the existing Site remains unchanged.

Any ambiguity returns `documentation_import_target_not_empty`. There is no
force, overwrite, merge, or “best effort.”

Migration `027` may grant the runtime role the minimum Page/placeholder child
`DELETE` operations needed for this one command only if a database mutation
guard requires the package-Apply command and proves the row is the locked,
childless placeholder of an otherwise empty target. No route/repository method
for general Page deletion is added. Imported Pages still receive fresh IDs;
the placeholder ID is never repurposed as imported authority.

### 13.2 Single Page

Page Markdown Apply requires:

- exact target Site and Project Version;
- `documentation.write`;
- active writable Project/Version;
- expected Working Draft version;
- explicit title/path;
- path namespace lock and authoritative recheck;
- no existing Page overwrite;
- optional Home Page assignment only when current Home Page is null.

It uses one transaction and one Working Draft bump.

### 13.3 Locks and idempotency

Lock order:

1. command receipt namespace;
2. Project Version and target Site/Edition;
3. Working Draft;
4. Edition path namespace advisory lock;
5. inspection row;
6. external Published Artifacts in stable ID order;
7. File/Asset rows in stable order;
8. mutable parents/children in deterministic order.

Every new child `134` Inspect, Apply, and Cancel mutation requires
`Idempotency-Key`. The shipped direct OpenAPI Inspect compatibility exception
is defined in section 10.6; direct OpenAPI Apply remains required.

- Inspect request digest includes kind, exact upload SHA-256, and Project
  Version scope.
- Apply digest includes inspection ID/fingerprint, complete target selection,
  choices/bindings, and expected versions.
- same key/different digest returns the existing idempotency conflict;
- same key/same digest returns the stored safe response;
- concurrent Apply serializes and creates at most one application.

An Inspect receipt is state-aware: it may replay the stored ready response only
while the referenced inspection is still ready and unexpired. Cancelled,
expired, or consumed inspection receipts return that safe terminal outcome;
they never resurrect a cleared report. Re-inspection requires a new
`Idempotency-Key`.

The Inspect command receipt stores only inspection identity, kind, digest, and
response status—not the report/proposal/issues. Replay reloads the
actor-authorized current inspection row. This prevents
`documentation_command_receipt.response_body` from becoming an unbounded
second retention copy after `safe_report` is cleared. Apply receipts may store
the bounded safe application result; Cancel receipts store no content body.

For Inspect, authorize and acquire the bounded rate/concurrency slot, stage and
hash the bounded upload, then check the command receipt before parsing. On a
non-replay, take an actor/Project-Version advisory lock, expire eligible rows,
and recheck the ten-ready-inspection ceiling before parser work. Replay,
conflict, ceiling, and parser failure all delete the candidate staging object;
only a successful new Inspect creates its File/inspection rows.

## 14. External Relationship Rebinding

Whole-Site packages cannot carry database IDs as authority.

Inspect returns:

```ts
required_bindings: Array<{
  handle: string;
  kind: "guide_publication" | "interactive_demo_publication";
  display: PortableExternalBinding["display"];
}>;
```

Apply supplies:

```ts
external_bindings: Array<{
  handle: string;
  published_artifact_id: string;
}>;
```

Server rules:

- every required handle appears exactly once;
- no unknown mapping appears;
- resolve Organization/Project from authorized route context;
- require exact same-Project Published Artifact and matching artifact type;
- do not resolve by title, slug, Project Version label, revision number, or
  publication sequence;
- no cross-tenant existence disclosure;
- mapping remains part of relational blocks, not permanent package JSON;
- missing/unauthorized/type-mismatched mapping blocks the complete Apply.

An intentionally unresolved portable external binding is a required Apply
choice, not a malformed-source `ImportIssue`, and therefore does not set
`has_blocking_issues` by itself. The portal still disables Apply until every
required selector has one value. A dangling/unknown binding handle inside the
portable graph is `relationship_unresolved` and is a blocking source issue.

The UI uses the existing labelled Guide/Demo Publication selector and never
asks users to type an ID.

## 15. Asset And OpenAPI Rules

### 15.1 Export

- resolve every image to the exact protected File/digest frozen by the selected
  source;
- draft export invokes the same child `133` byte-integrity checks;
- extend the existing integrity helper so the exact bounded bytes that pass
  size/digest/signature/dimension validation are the bytes staged into the
  archive; do not validate one storage read and package a second potentially
  changed read;
- missing/mismatched protected bytes fail the entire export;
- deduplicate identical source/digest pairs;
- package Capture Asset bytes as ordinary portable media without Capture ID,
  session, URL, or provenance that reveals private scope;
- draft export retains safe name/status for Documentation Assets and uses
  generated safe fallback names for Capture media;
- Revision/Publication export consults no current mutable Asset library
  metadata: it generates deterministic safe names from the frozen reference and
  imports those portable entries as active because name/lifecycle was not
  frozen by child `133`;
- validate raster signature, MIME, size, dimensions, pixel count, and SHA-256;
- never include archived unused Assets unless required by portable content;
- no `derived_asset` until an owning domain exists.

### 15.2 Import

- declared package media must be PNG/JPEG/WebP;
- stream and validate through the existing Documentation image policy;
- exact manifest path/size/digest/dimensions must match observed bytes;
- each imported media File becomes one new Documentation Asset;
- duplicate package references reuse the same imported Documentation Asset;
- imported archived Assets are inserted safely and archived only after all
  retained references exist in the transaction;
- package Assets never become Capture Assets.

Draft package export includes all active Edition-owned Documentation Assets
plus archived Assets retained by content, and every referenced Capture Asset.
It excludes unused archived Documentation Assets. Revision/Publication export
includes only Asset references frozen into the selected immutable source.
Duplicate uses reuse one package Asset entry.

### 15.3 OpenAPI

- direct OpenAPI upload retains existing routes and schemas;
- direct upload receives section 10.6 authorization, actor-binding, streaming,
  idempotency-compatibility, and terminal-cleanup hardening;
- exact-source export returns stored bytes only after protected File/digest
  validation;
- package import parses the included source through
  `parse_documentation_openapi`;
- V1 supports OpenAPI `3.0.x` and `3.1.x` exactly as child `133`;
- Swagger `2.0`, `3.2.x`, unknown future versions, external references,
  aliases/cycles beyond limits, and unsafe structures fail closed;
- source operations are rebuilt relationally with fresh IDs;
- Page/Snippet API blocks resolve by package operation destination key;
- missing/ambiguous operation keys block Apply.

Draft export includes the current OpenAPI Source even when no Page currently
references it because it is owned Working Draft state. Revision/Publication
export includes only the exact source protected by
`site_revision_openapi_source`. A source-free selected state emits no OpenAPI
entry.

### 15.4 Export preparation

- build canonical entry descriptors and validate every dependency first;
- stream deterministic ZIP generation to the dedicated temporary export path;
- enforce observed output bytes and abort/delete on excess;
- reopen the completed File to obtain exact size and stream;
- do not send `200`, attachment headers, or partial archive bytes before
  preparation succeeds;
- delete the temporary archive after response completion/disconnect;
- if cleanup fails, leave only a generated transient export key eligible for
  the bounded cleanup path, never a `file_schema.file` content record.

## 16. API Contracts

All routes live under:

`/api/v1/projects/:project_id/versions/:version_slug`

### 16.1 Import inspections

#### Inspect

`POST /documentation-import-inspections?kind=page_markdown|site_package`

- authenticated;
- active Project/Project Version;
- Editor/Admin/implicit Owner;
- `Idempotency-Key` required;
- multipart with exactly one `file` and no form fields;
- Markdown MIME: `text/markdown` or `text/plain` plus `.md`;
- package MIME: `application/zip` plus `.zip`;
- route-level compressed upload ceiling enforced before parser;
- response `201`:

```ts
{
  inspection: {
    id: string;
    kind: "page_markdown" | "site_package";
    status: "ready";
    format_version: 1 | null;
    source_digest: string;
    content_fingerprint: string;
    expires_at: string;
    summary: {
      pages: number;
      snippets: number;
      assets: number;
      openapi_sources: number;
      external_bindings: number;
      expanded_bytes: number;
    }
    proposal: {
      package_profile: "roundtrip" | "markdown-folder" | null;
      claimed_source_kind:
        | "working_draft"
        | "site_revision"
        | "site_publication"
        | null;
      title: string | null;
      canonical_path: string | null;
      site_name: string | null;
      site_description: string | null;
      primary_language: string | null;
      home_page_handle: string | null;
      pages: Array<{ handle: string; title: string; canonical_path: string }>;
      required_bindings: Array<RequiredBinding>;
    }
    issues: Array<ImportIssue>;
    issue_counts: {
      blocking: number;
      warnings: number;
    }
    has_blocking_issues: boolean;
    issues_truncated: boolean;
  }
}
```

No raw body, manifest, File ID, storage key, actor ID, private URL, or original
source filename is returned. A normalized package-local entry location may be
returned only to identify an issue to the same inspection creator.
`claimed_source_kind` is explicitly labelled package-provided context; it does
not create Revision/Publication provenance or authorize anything.
`has_blocking_issues` and the complete category counts are computed before the
500-item response cap; the UI must not infer Apply eligibility only from the
truncated `issues` array. Apply independently rejects a source whose fresh
validation has any blocking issue.

#### Get

`GET /documentation-import-inspections/:inspection_id`

- creator only;
- `documentation.read` plus creator binding;
- expired/cancelled/consumed state returned safely without normalized payload;
- ready report response matches Inspect.

#### Cancel

`DELETE /documentation-import-inspections/:inspection_id`

- creator only;
- `Idempotency-Key` required;
- ready inspection only;
- returns `204`;
- same-key replay or an already-cancelled inspection returns `204`;
- consumed returns `409 documentation_import_consumed`;
- expired returns `410 documentation_import_expired` after safe cleanup;
- cleans temporary bytes best effort;
- does not mutate a Site or create a content Audit Event.

#### Apply

`POST /documentation-import-inspections/:inspection_id/apply`

- creator only;
- `Idempotency-Key` required;
- body uses strict discriminated union:

```ts
{
  content_fingerprint: string;
  target:
    | {
        mode: "page";
        site_id: string;
        expected_draft_version: number;
        title: string;
        canonical_path: string;
        set_as_home: boolean;
      }
    | {
        mode: "create_site";
        name: string | null;
      }
    | {
        mode: "empty_site";
        site_id: string;
        expected_site_version: number;
        expected_draft_version: number;
        apply_primary_language: boolean;
      };
  external_bindings: Array<{
    handle: string;
    published_artifact_id: string;
  }>;
  confirm: true;
}
```

Mode must match inspection kind:

- Markdown → `page`;
- package → `create_site | empty_site`.
- Markdown requires `external_bindings=[]`; package requires exactly the
  reported binding handles.

Response `201` first apply or `200` replay:

```ts
{
  application: {
    id: string;
    inspection_id: string;
    target_site_id: string;
    target_edition_id: string;
    created_page_id: string | null;
    counts: ImportCounts;
    idempotent_replay: boolean;
  }
}
```

### 16.2 Package export

`GET /documentation-sites/:site_id/export/package.zip`

Strict query union:

```ts
{
  source: "draft";
  expected_site_version: number;
  expected_draft_version: number;
}
| { source: "revision"; revision_number: number }
| { source: "publication"; site_publication_id: string }
```

Response:

- `200 application/zip`;
- safe generated filename
  `<site-name>-<version-slug>-documentation-v1.zip`;
- `Content-Disposition: attachment`;
- `Cache-Control: private, no-store`;
- `X-Content-Type-Options: nosniff`;
- exact `Content-Length` when known;
- no public route.

### 16.3 Page Markdown export

`GET /documentation-sites/:site_id/pages/:page_id/export/markdown`

Strict query union:

```ts
{
  source: "draft";
  expected_page_version: number;
  expected_draft_version: number;
}
| { source: "revision"; revision_number: number }
| { source: "publication"; site_publication_id: string }
```

The draft aggregate version is required because Markdown fallback may expand a
Snippet or read OpenAPI relationship state that can change without bumping the
Page Row Version. Both versions are rechecked in one consistent source loader.

Response:

- `200 text/markdown; charset=utf-8`;
- safe filename from canonical path plus `.md`;
- private/no-store/nosniff headers.

### 16.4 OpenAPI source export

`GET /documentation-sites/:site_id/openapi/source/export`

Strict query union:

```ts
{ source: "draft"; expected_source_version: number }
| { source: "revision"; revision_number: number }
| { source: "publication"; site_publication_id: string }
```

Response:

- exact authorized stored bytes;
- generated non-customer filename `openapi-source.json` or
  `openapi-source.yaml`;
- recorded MIME with nosniff/private/no-store;
- `404`-shaped response for missing/unauthorized source;
- `409 documentation_row_version_conflict` if the selected mutable draft
  Source changed;
- `409 documentation_export_source_unavailable` for a pre-`027`
  Revision/Publication whose operations exist but whose exact source File was
  never frozen;
- no normalized export in V1.

### 16.5 Error mapping

Add typed codes:

- `documentation_import_invalid` → `400`;
- `documentation_import_unsupported_version` → `400`;
- `documentation_import_binding_required` → `409`;
- `documentation_import_conflict` → `409`;
- `documentation_import_target_not_empty` → `409`;
- `documentation_import_consumed` → `409`;
- `documentation_import_expired` → `410`;
- `documentation_import_limit_exceeded` → `413`;
- `documentation_import_media_unsupported` → `415`;
- `documentation_import_busy` → `429` with bounded `Retry-After`;
- `documentation_export_content_unsupported` → `409`;
- `documentation_export_source_unavailable` → `409`;
- existing Row Version/idempotency/path/asset/OpenAPI errors retain their
  current mappings.

Unauthorized responses follow existing non-enumerating Project behavior.
Operational logs may contain request/inspection correlation IDs and codes, not
paths, bodies, source filenames, manifests, mappings, or File keys.

## 17. Authorization, Audit, And Access Evidence

### 17.1 Permissions

| Operation                                       | Viewer                                | Editor | Project Admin / implicit Owner |
| ----------------------------------------------- | ------------------------------------- | ------ | ------------------------------ |
| Draft/Revision/Publication Page Markdown export | Yes, if source is readable            | Yes    | Yes                            |
| Site package export                             | Yes, if source and Files are readable | Yes    | Yes                            |
| OpenAPI source export                           | Yes, if source is readable            | Yes    | Yes                            |
| Create own inspection                           | No                                    | Yes    | Yes                            |
| Get/Cancel own inspection                       | Yes, after creator and read checks    | Yes    | Yes                            |
| Apply Page into writable Site                   | No                                    | Yes    | Yes                            |
| Apply package to existing empty Site            | No                                    | Yes    | Yes                            |
| Apply package by creating new Site              | No                                    | No     | Yes                            |
| Read another actor's inspection                 | No                                    | No     | No                             |

Archived Project/Project Version remains readable/exportable where existing
policy permits but blocks new Inspect and Apply. An existing inspection creator
who remains an authorized Project reader may inspect or cancel their own
temporary result after a role/archive change, but cannot Apply it. Public
Publish Link readers receive no Markdown, ZIP, or source OpenAPI export.

Authorization occurs before:

- upload retention;
- inspection/result lookup;
- target/source row body load;
- protected File read;
- ZIP/Markdown generation;
- external binding detail;
- cleanup state change;
- idempotency replay body return.

### 17.2 Audit

Use exact command/action pairs:

| Mutation                 | Command                                    | Audit action                                 |
| ------------------------ | ------------------------------------------ | -------------------------------------------- |
| Markdown/package Inspect | `documentation.import.inspect`             | `documentation.import.inspected`             |
| Markdown Page Apply      | `documentation.page_markdown_import.apply` | `documentation.page_markdown_import_applied` |
| Site package Apply       | `documentation.site_package_import.apply`  | `documentation.site_package_import_applied`  |
| Creator cancellation     | `documentation.import.cancel`              | `documentation.import.cancelled`             |
| Bounded expiry cleanup   | `documentation.import.expire`              | `documentation.import.expired`               |

Expiry uses the existing system actor/source semantics. The existing direct
OpenAPI command/action pairs remain unchanged.

Because a new inspection intentionally has no target Site, Inspect,
Cancel, and expiry use the scoped Project Version as Audit root and parent the
temporary File/inspection changes to that root. Apply uses the exact target
Documentation Site as root (including the Site created by `create_site`) and
parents the application plus imported child summaries to it. Never invent a
placeholder Site identity during Inspect.

Audit Change Items include safe identities, format/version, counts, target,
before/after Row Versions, and application ID. They exclude bodies, Markdown,
manifest, filenames, package paths, external display/mapping details, File
keys, credentials, comments, and raw issues.

Cancel/expiry creates no Site content history. Its narrowly scoped event records
only inspection/File identity, status/version, expiry reason, and deletion
state required by existing Audit guards. Successful Apply includes the source
inspection/File terminal transition in the same logical Apply event.

### 17.3 Access Evidence

Register:

- inspection report viewed;
- Markdown exported;
- package exported;
- OpenAPI source exported;
- import Apply attempt outcome where existing policy records meaningful denied
  attempts.

Evidence uses source/target entity identity, format, outcome, and download
classification only. Never record content, source filename/path, query
metadata, package manifest, or external binding display.

Update both registries and their completeness tests in the same commit as route
registration.

### 17.4 Project Activity

Add the two successful Apply actions to the existing curated `content`
Project Activity mapping:

- `documentation.page_markdown_import_applied`;
- `documentation.site_package_import_applied`.

Inspect, Cancel, expiry, export, and failed attempts do not create ordinary
Project Activity cards. The existing activity adapter derives a concise safe
summary from the action and Audit actor/time; it must not load/import Page
titles, paths, filenames, manifests, issue text, or external-binding details.

## 18. Portal Behavior

### 18.1 Project Version Site list

Admin/implicit Owner receives “Import Site package” from the existing
Project-Version Documentation Site list, including its empty state. This entry
performs Inspect and supports only `create_site`, so an Organization can import
its first Site without navigating through an existing Site. Editor/Viewer do
not see this create-Site entry.

The same portability/review components are reused with an explicit mode; do not
fork a second importer or package contract. After Apply, navigate to the
created Site workbench.

### 18.2 Site workbench

Add a “Import and export” section containing:

- Export saved draft ZIP;
- Export exact Revision/Publication ZIP selectors using existing histories;
- Export exact draft/Revision/Publication OpenAPI source when present, with
  the pre-`027` unavailable state explained rather than silently normalized;
- Upload Site ZIP;
- Import one Markdown Page into this Site, including when it currently has no
  Page, with optional Home Page assignment only when the draft has none;
- upload/inspection progress;
- safe summary counts;
- warnings and blocking issues grouped by File/Page;
- target choice: create Site (Admin only) or current empty Site;
- explicit external-binding selectors;
- confirmation summary;
- Apply and Cancel.

The UI never exposes IDs, package paths as trusted filesystem paths, storage
keys, raw normalized payload, or unsupported force/merge controls.

### 18.3 Page editor

Add:

- Export current Page Markdown;
- explain that Page Markdown is readable/create-only interchange and omits
  description, keywords, binary media, and typed relationship fidelity;
- Import Markdown as a new Page;
- inspect preview with proposed title/path;
- editable final title/path fields;
- conflict/status messaging;
- explicit Apply confirmation.

Do not add “replace current Page.”

### 18.4 States and accessibility

Required states:

- idle, selecting, uploading, inspecting, ready, blocking issues, applying,
  applied, cancelled, expired, stale, failed;
- progress text uses `role="status"`/`aria-live`;
- blocking summary receives focus after Inspect/Apply failure;
- issue groups use headings/lists and do not rely on color;
- File inputs have persistent labels and accepted extensions;
- all binding selectors are labelled;
- Apply explains why disabled;
- source-content blockers explain that the File/package must be corrected and
  inspected again; only target metadata and external-binding choices are
  resolvable in the current review;
- Cancel remains available while ready;
- downloads use actual links/buttons with clear format/source names;
- keyboard-only use and 200% zoom do not hide issue/actions;
- reduced motion is respected;
- Viewer sees export controls and no import mutation controls;
- Editor does not see create-new-Site target;
- archived/read-only state explains why import is unavailable.

No drag-only drop zone. Drag/drop may supplement, never replace, the labelled
File input.

## 19. Behavior And Failure Rules

### 19.1 Inspect

- Parse/validate the entire accepted source; never stop after manifest only.
- Unsafe archive structure, encryption/header/range ambiguity, integrity/hash/
  fingerprint failure, invalid encoding, unsupported package version/profile,
  hard ceiling, and unsupported upload media fail the request and retain no
  ready inspection/File. Safely parsed sources with content/relationship
  problems may create a ready inspection with blocking issues so the user can
  review what must be fixed before re-upload.
- Return at most 500 issues and `issues_truncated=true`.
- Compute complete blocking/warning counts before truncation and return
  `has_blocking_issues`; truncation can never make Apply appear eligible.
- Any security, format, integrity, unknown-kind, missing relationship, or hard
  limit issue is blocking.
- Safe portability loss may be a warning only when the contract explicitly
  defines the fallback.
- Inspect cannot validate final path conflicts/external mapping permanently;
  Apply repeats all authoritative checks.
- Inspection is actor-bound and cannot be transferred by ID.

### 19.2 Apply

- Requires exact unexpired fingerprint and source bytes.
- Revalidates parser/domain/relationship rules.
- Refuses Apply whenever fresh validation contains any blocking issue even if
  that issue was beyond the response preview cap.
- Recomputes post-Apply counts and hard limits.
- Uses fresh IDs for every imported entity.
- Builds all handle maps before writes.
- Inserts in dependency order and applies archived status last.
- Rebuilds the ordinary affected draft-search projections from the imported
  relational graph inside the same logical transaction; it never imports
  search rows or creates public search state.
- Bumps Working Draft once for the logical Apply.
- Creates one permanent application record and one logical Audit Event.
- Does not checkpoint, publish, create a link, rebuild immutable history, or
  claim source lineage.
- Existing public output remains unchanged.

### 19.3 Export

- Reads one source in a repeatable-read/consistent transaction.
- Draft Site export requires expected Site and Working Draft versions; draft
  Page export requires expected Page and Working Draft versions; draft OpenAPI
  export requires expected Source version. Any mismatch fails stale.
- Revision/Publication export reads only immutable selected state.
- Export does not mutate or lock longer than needed to establish source facts.
- Required File failure fails the complete response before headers/body commit.
- No partial ZIP or Markdown success.
- Download filename sanitization is independent of package entry paths.
- Same state plus bytes produces the same content and ZIP.

### 19.4 Cleanup and compensation

- bounded source upload is deleted best effort when Inspect fails;
- staged Apply bytes are deleted best effort when transaction fails;
- database rows never point to deliberately deleted bytes after successful
  Apply;
- failed best-effort deletion is logged by safe storage key hash/correlation,
  not raw key;
- a bounded cleanup retry discovers expired/cancelled/consumed temporary Files;
- permanent imported Asset/OpenAPI Files follow ordinary protected retention,
  not inspection TTL.

## 20. Backwards Compatibility

- migrations `001`–`026` unchanged;
- existing Site/Page/Snippet/Asset/OpenAPI/Revision/Publication routes and
  response contracts unchanged;
- existing direct OpenAPI Inspect/Apply remains the import API for one source;
- direct OpenAPI successful request/response behavior remains compatible;
  authorization-before-upload, creator binding, streaming, terminal payload
  clearing, and optional Inspect idempotency are security hardening rather than
  a second route;
- existing child `133` block and controlled-Markdown schemas remain canonical;
- existing database IDs and Row Versions are never exposed as package
  authority;
- existing Publications and Publish Links are not rebuilt or switched;
- existing public readers receive no new download surface;
- Guide/Demo behavior is unchanged; only exact authorized Published Artifact
  rebinding is added;
- Capture Asset purge protection remains unchanged; export is a read, import
  creates Documentation Assets;
- package V1 is additive and frozen by golden fixtures;
- an unsupported package never partially imports;
- old exact OpenAPI source files remain exportable without normalization.

If implementation discovers that child `133` cannot load a complete consistent
draft/Revision/Publication portable projection, extend the existing repository
with one authorized export loader. Do not read tables from the route or build a
second JSON authority.

## 21. Security And Threat Model

| Threat                                  | Required control                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ZIP traversal/overwrite                 | Generated extraction keys; normalized allowlisted paths; reject absolute, parent, backslash, encoded, duplicate, and case-fold collisions |
| Archive bomb/memory exhaustion          | Compressed request ceiling, declared size/ratio precheck, lazy streaming, observed aggregate counters, abort on first excess              |
| Link/device/executable entries          | Inspect public entry attributes; accept regular file/directory only; never invoke shell/native archive tools                              |
| Stored XSS/code execution               | CommonMark AST allowlist; no HTML/MDX/JS/directives; existing controlled scalar and renderer policies                                     |
| SSRF/local file read                    | No remote fetch, URL import, external OpenAPI `$ref`, file/data/blob resolution, or server-folder path                                    |
| Cross-tenant/Project ID injection       | Package-local handles only; route-derived scope; explicit authorized external rebinding; non-enumerating errors                           |
| Stale/swap after review                 | Actor-bound inspection, exact File SHA-256/fingerprint, re-read/revalidate on Apply, expected draft/site versions                         |
| Partial mutation                        | Stage bounded bytes, one DB transaction, command receipt, compensation, no automatic checkpoint/publication                               |
| Protected File drift                    | Existing byte/digest/image checks on export and import; exact manifest verification                                                       |
| Malicious JSON/YAML/Markdown complexity | byte/node/depth/scalar/count limits, data-only parser, strict schemas, no custom constructors/plugins                                     |
| Package ambiguity                       | strict one manifest/version/profile, exact entry roles/hashes, no unknown entries, one representation mode per Page                       |
| External binding confusion              | explicit mapping by handle to authorized exact same-Project Published Artifact; no title/slug guessing                                    |
| Data leakage in export                  | explicit portable allowlist; no comments/audit/access/membership/credentials/storage/private URLs/Publish Link policy                     |
| Temporary data retention                | one-hour TTL, actor scope, payload clearing, File deletion/purge retry                                                                    |
| DoS through repeated inspections        | active-inspection ceiling, request rate policy, idempotency, bounded cleanup                                                              |
| CSV/formula or browser execution        | no CSV; downloads use nosniff/attachment; rendered preview uses existing safe components                                                  |
| Supply-chain/parser regression          | pinned reviewed dependencies, golden malicious corpus, no private APIs, documented upgrade gate                                           |

## 22. Test-Driven Implementation Order

### Stage 0: Reconcile and checkpoint

1. reread sources and inspect worktree;
2. recheck package/parser dependencies;
3. update this plan for actual drift;
4. commit plan/docs only.

### Stage 1: Constants, schemas, and domain policies

Write failing tests first for:

- strict manifest/site/Page/Snippet/portable block schemas;
- exact `roundtrip` versus `markdown-folder` profile rules and indexed Page
  metadata agreement;
- every child `133` block mapping;
- canonical JSON/fingerprints without customer-text Unicode normalization;
- handles/path normalization/collisions;
- Markdown accepted/rejected grammar;
- issue truncation;
- full semantic graph validation;
- unsupported version behavior.

Commit:

`feat(documentation): define portability contracts`

### Stage 2: Migration and persistence

Write failing migration/repository tests for:

- inspection/provenance scope;
- actor binding/expiry/state transitions;
- existing direct OpenAPI inspection creator binding, nullable terminal
  payload cleanup, and source-File retention;
- command receipts;
- empty target detection;
- one-transaction Page/package Apply;
- fresh ID remapping;
- external binding authorization/type;
- Audit guards and safe fields;
- immutable OpenAPI source snapshot, Revision digest/reuse, protection, and
  pre-`027` behavior;
- clean/up/down/runtime-role behavior.

Commit:

`feat(documentation): persist inspected imports`

### Stage 3: Safe parsers and protected Files

Write malicious/valid corpus tests before implementation:

- ZIP path/type/encryption/count/size/ratio/hash/MIME/signature cases;
- CommonMark AST cases;
- sole-link/image, mixed-inline rejection, list-start/item shape, and safe code
  fence cases;
- exact OpenAPI inclusion;
- temp storage, compensation, and cleanup;
- crash-orphan reconciliation preserves live/lookalike/symlink/out-of-prefix
  keys and purges only eligible exact generated keys;
- duplicate Inspect replay/conflict staging cleanup;
- legacy null checksum/protected byte behavior.

Commit:

`feat(documentation): inspect portable documentation files`

### Stage 4: Export

Write failing tests for:

- draft/Revision/Publication loaders;
- Page draft aggregate-version and OpenAPI source-version conflicts;
- deterministic JSON/Markdown/ZIP;
- byte-identical repeat;
- exact Asset/OpenAPI inclusion and deduplication;
- external binding redaction;
- missing File all-or-nothing;
- safe headers/filenames and Viewer access.

Commit:

`feat(documentation): export portable documentation`

### Stage 5: Routes, evidence, and application service

Write failing route/app tests for:

- multipart/idempotency;
- auth order and role matrix;
- parser semaphore/rate-bucket acquisition, pruning, `Retry-After`, and
  no-byte-retention failure;
- safe report/error shapes;
- issue truncation with authoritative blocking counts;
- fingerprint/expiry/stale/not-empty;
- Apply success/replay/rollback;
- access and audit registry completeness.
- successful Apply appears once in curated Project Activity while
  inspect/cancel/expiry/export do not.

Commit:

`feat(documentation): add import apply APIs`

### Stage 6: Portal

Write component/API tests first for:

- role/read-only states;
- Project-Version Site-list empty/non-empty create-Site import entry;
- upload/inspect/review/apply/cancel;
- issue and binding controls;
- Page Markdown create-only path;
- draft/Revision/Publication download selection;
- focus/status/error/reflow/reduced-motion behavior.

Commit:

`feat(web): add documentation portability workflows`

### Stage 7: Fixture, smoke, docs, and closure

- extend the deterministic fixture;
- run complete round trip and negative cases;
- perform agent-browser validation;
- add ADR/current-truth/format/evidence docs;
- update child/master only for passing behavior;
- commit scoped closure docs.

## 23. Automated Verification Matrix

### 23.1 Domain/shared

- package v1 schemas accept golden and reject unknown fields/versions;
- profile-specific Page metadata/source rules and nullable draft Home Page;
- portable converters cover all discriminants;
- controlled Markdown scalar behavior unchanged;
- CommonMark mapping round trips accepted direct forms;
- mixed prose/link/image, non-one list starts, loose items, and unsafe fence
  metadata fail without reinterpretation;
- unsupported typed/Markdown nodes surface exact issues;
- canonical JSON/fingerprint stable across insertion order/locale while
  preserving decomposed/precomposed customer strings exactly;
- path/handle normalization and collisions;
- archive/product ceilings;
- no database IDs in serialized fixtures.

### 23.2 Archive/parser malicious corpus

Include:

- `../`, absolute, UNC, drive, backslash, percent-encoded traversal;
- NUL/control/bidi/non-NFC;
- duplicate/case-fold/normalization collision;
- encrypted entry;
- symlink/hardlink/device/socket/executable mode;
- nested ZIP;
- multi-disk/ZIP64, overlapping entry ranges, central/local-header mismatch,
  and unsupported compression methods;
- too many/deep/long entries;
- false declared size, high ratio, CRC failure, expanded limit;
- duplicate/missing/oversized/unknown manifest entries;
- duplicate JSON object keys at root and nested depths;
- manifest hash/size/MIME mismatch;
- polyglot/wrong-signature image;
- invalid UTF-8/BOM;
- raw HTML, script, MDX, import/export, unsafe URL, image, deep AST;
- external/cyclic/oversized OpenAPI;
- unknown/retired block and dangling handles.

Every case must fail without durable content mutation.

### 23.3 Repository/database

- cross-tenant/Project/Project Version/actor inspection isolation;
- existing direct OpenAPI inspection cannot be applied by a second Editor;
- active/archived role behavior;
- ready/consumed/cancelled/expired state;
- consumed/expired Cancel semantics and idempotent cancelled replay;
- lazy cleanup;
- safe report blocking/warning counts remain complete when issue details
  truncate;
- create-site and empty-site Apply;
- strict empty-target matrix;
- guarded placeholder deletion succeeds only inside package Apply and exposes
  no general Page-delete path;
- Page create-only import into populated Site;
- stale Site/draft/path/idempotency conflicts;
- duplicate multipart staging object cleanup on idempotent replay/conflict;
- Inspect receipts retain only a pointer and cannot replay a cleared report;
- all handle remapping and dependency order;
- Snippet non-nesting;
- Asset reuse/status/digest;
- OpenAPI operation resolution;
- immutable OpenAPI source changes Revision digest/reuse; pre-`027` Revisions
  never receive a guessed source;
- external binding exact type/scope;
- counts/ceilings;
- one Working Draft bump;
- ordinary draft search rebuilt with no imported/public search rows;
- one provenance row;
- Audit safe fields and no body leakage;
- no Revision/Publication/Publish Link created;
- rollback and compensation;
- clean `001`–`027`, `026`→`027`, guarded down/up, grants/reset.

### 23.4 Route/service

- auth before detail/File/parser work;
- direct OpenAPI auth-before-body, bounded streaming, creator binding,
  terminal parsed-payload cleanup, and optional Inspect idempotency;
- multipart one-file enforcement;
- content type/extension/size;
- idempotency same/different digest;
- safe issue/error responses;
- creator-only inspection;
- export role/source matrix;
- draft Page export rejects a stale aggregate even when the Page Row Version is
  unchanged; direct OpenAPI export rejects a stale Source version;
- private/no-store/nosniff/download headers;
- streaming response failure does not claim success;
- no public export routes;
- existing OpenAPI routes remain green.

### 23.5 Web

- API adapters for binary downloads and multipart inspection;
- Admin/Editor/Viewer control matrix;
- Site and Page workflows;
- blocking warnings and disabled Apply;
- labelled binding selectors;
- expiry/stale/retry/cancel;
- keyboard focus/status;
- 320 CSS-pixel/200% zoom;
- reduced motion;
- axe zero violations, with honest incomplete review.

### 23.6 Regression

Run:

- Documentation domain/shared types/constants full suites;
- server unit full suite;
- server DB full suite;
- V1 smoke;
- web full suite sequentially if the known `document.title` test isolation
  requires it;
- extension full suite;
- repository lint, type checks, and builds;
- Prettier and `git diff --check`;
- local Markdown link/heading/status scans.

Existing Guide/Demo/Capture/public Documentation tests must remain green.

## 24. Agent-Browser Validation

Frontend behavior makes agent-browser mandatory.

Use the real API, portal, synthetic fixture, and headless Chrome. Record browser
and agent-browser versions, commit, URLs, roles, data, console/errors, axe, and
transient evidence paths.

Required journeys:

1. Admin exports saved draft ZIP and verifies a real download response.
2. Admin uploads the ZIP, sees counts/issues/bindings, cancels, and proves the
   source Site is unchanged.
3. From a Project Version whose Site list can be empty, Admin repeats Inspect,
   maps exact Guide/Demo bindings through labelled selectors, creates a new
   Site, and opens the imported Page.
4. Imported draft preview shows Snippet, media, OpenAPI, navigation, routing,
   and external cards correctly.
5. Editor imports one Markdown Page into an existing populated writable Site
   as a new Page and cannot overwrite an existing Page.
6. Viewer exports exact OpenAPI bytes and authorized Page Markdown, then sees
   no import/apply/cancel
   mutation controls.
7. Archived/read-only Project Version explains import unavailability.
8. Keyboard-only File selection/review/binding/Apply/Cancel is operable.
9. Blocking issue summary receives focus and is announced; a truncated issue
   list with hidden blocking issues still keeps Apply disabled.
10. 320 CSS-pixel viewport at 200% zoom has no page-level overflow.
11. Reduced-motion and axe checks pass.
12. Browser error events are empty; console has no product warnings/errors.

Automated API/DB tests, not browser duplication, own traversal bombs,
cross-tenant swaps, race conditions, exact ZIP bytes, cleanup crashes, and the
full malicious corpus.

Firefox/WebKit remain capability-dependent child `138` evidence unless
available without expanding this child.

## 25. Documentation And ADR Deliverables

`CONTEXT.md` must add accepted/shipped terms after runtime proof:

- Documentation Package;
- Import Inspection;
- Import Application;
- package-local handle;
- portability is snapshot/mutation, not authority.

ADR `0031` must record:

- why Inspect/Apply is separate;
- why relational state remains authority;
- why full package uses typed JSON plus readable Markdown;
- why standalone Markdown is intentionally lossy/create-only;
- why external relations require explicit rebinding;
- why ZIP import is streaming/bounded and no Git/remote fetch enters V1;
- compatibility/reversibility consequences.

`docs/documentation-portability-format.md` must document:

- exact V1 layout and schemas;
- supported Markdown grammar;
- deterministic serialization;
- security limits;
- Inspect/Apply examples;
- external binding review;
- compatibility policy;
- rejected formats;
- no IDs/secrets/private paths.

Current-truth docs must distinguish implemented behavior from later child
`135` lifecycle and child `138` operational configuration.

## 26. Explicit Non-Scope

- Git/GitHub repository sync, credentials, webhooks, branches, conflicts, pull
  requests, or scheduled exports;
- merge/overwrite into a populated Site for full package Apply;
- overwrite or merge into an existing Page;
- selective package merge;
- Carry-Forward or source lineage;
- multi-Site management/lifecycle polish;
- Page/Site/Edition/OpenAPI archive/restore beyond child `133`;
- review/approval;
- API Try It or credentials;
- Organization quota configuration/reporting;
- background job framework;
- public package/OpenAPI downloads;
- browser folder picker;
- external-link Navigation items that are not present in the child `133`
  runtime;
- arbitrary HTML/MDX/JS/React/plugins/directives;
- remote media/OpenAPI/external `$ref`;
- OpenAPI `3.2.x`;
- Derived/Redacted Asset domain;
- video;
- signatures/encryption/package trust;
- package diff/patch;
- translation/localization workflows;
- custom domains, analytics, public feedback, realtime collaboration;
- permanent product-content deletion;
- migration of external systems not explicitly accepted above.

## 27. Completion Checklist

### Planning

- [x] Actual completed child `133` and close-recheck handoff inspected.
- [x] Master `006`, Question `22`, decision consolidation, Context, and ADR
      boundaries reconciled.
- [x] Current schemas/routes/repository/storage/UI/audit/access/fixture mapped.
- [x] Exact affected and read-only files listed.
- [x] Format, schema, route, permission, migration, compatibility, security,
      test, browser, docs, handoff, and non-scope contracts specified.
- [x] Independent plan recheck against current code and Master `006` complete.
- [x] Planning checkpoint committed.

### Runtime

- [ ] Shared portability schemas/policies pass.
- [ ] Migration `027` clean/upgrade/down-up/runtime-role tests pass.
- [ ] Markdown Inspect/Apply/export passes.
- [ ] Package Inspect/Apply/export and deterministic round trip pass.
- [ ] Exact OpenAPI export and package inclusion pass.
- [ ] Protected File/cleanup/compensation pass.
- [ ] Authorization, Audit, Access, idempotency, and concurrency pass.
- [ ] Portal component/API tests pass.
- [ ] Full fixtures, DB, smoke, regression, lint, type, and build pass.
- [ ] Agent-browser and accessibility evidence passes.
- [ ] ADR/Context/format/evidence/plan/Master are current.
- [ ] Scoped logical commits complete.

## 28. Planning Log

- 2026-07-30: Reserved from Master Plan `006`; no runtime or active
  current-truth documentation changed.
- 2026-07-30: Expanded after child `133` completed and was independently
  close-rechecked at baseline `2fec4e7`.
- 2026-07-30: Reconciled accepted Question `22` with the actual child `133`
  relational typed-block graph, Edition-owned Snippets, exact artifact
  Publications, Documentation/Capture Asset workflows, protected-byte/digest
  boundary, OpenAPI parser/source storage, immutable projections, consolidated
  routes/repository, portal workbench, Audit/Access registries, and hard
  ceilings.
- 2026-07-30: Fixed the reservation's ambiguity by separating Page create-only
  Markdown import, empty-target full-package Apply, and the existing OpenAPI
  import path.
- 2026-07-30: Selected one canonical package contract with package-local
  handles, lossless typed JSON plus readable Markdown, embedded protected media,
  explicit external Published Artifact rebinding, deterministic ZIP output,
  actor-bound Inspect/Apply, additive migration `027`, and no automatic
  checkpoint/publication.
- 2026-07-30: Independently rechecked the expansion against Master `006`,
  completed/close-rechecked child `133`, Question `22`, the decision
  consolidation, Context, ADR `0009`, ADRs `0027`–`0030`, migrations
  `025`/`026`, and the actual consolidated server/storage/portal callers.
- 2026-07-30: Closed unsafe ambiguity around manifest-bearing
  `markdown-folder` ownership, complete indexed Page metadata, nullable draft
  Home Pages, exhaustive portable block fields, mixed-inline Markdown limits,
  Unicode preservation, duplicate JSON keys, ZIP header/range/time-zone
  determinism, and semantic name/path collisions.
- 2026-07-30: Closed concurrency/retention gaps with Site/draft/Page/OpenAPI
  expected versions, authoritative truncated-issue counts, state-aware minimal
  receipts, actor-bound direct OpenAPI inspections, parsed-payload cleanup,
  bounded parser admission, streamed staging, and crash-orphan reconciliation.
- 2026-07-30: Closed ownership/UI gaps with immutable exact OpenAPI source
  digest/reuse rules, guarded placeholder removal, explicit Audit roots and
  command/action pairs, curated Project Activity, one-pass protected-byte
  export, first-Site import from the Project Version Site list, and first-Page
  import from an empty Site workbench.

## 29. Planning Verification Record

Expansion and independent recheck inspection completed:

- clean worktree at baseline `2fec4e7`;
- child `133` status/checklist/log/verification/handoff;
- Master `006` portability, authority, permission, audit/access, security,
  limits, sequence, and child `134` sections;
- final Question `22` format/package/Inspect-Apply/OpenAPI decisions;
- Context, ADR `0009`, and ADRs `0027`–`0030`;
- migrations `025`/`026`;
- shared Documentation constants, Zod contracts, domain policies/errors;
- server Documentation app/routes/service/repository/OpenAPI/image/File paths;
- current Audit/Access coverage registries;
- current Project Activity action adapter;
- portal router/workbench/Page/API/permission paths;
- deterministic fixture, DB, smoke, and browser-evidence boundaries;
- existing `jszip@3.10.1`, `yaml@2.9.0`, `sharp@0.33.5`, Node, and File-storage
  dependencies;
- 2026-07-30 registry candidates `yauzl@3.4.0`,
  `@types/yauzl@3.4.0`, and `mdast-util-from-markdown@2.0.3`, including
  license/engine metadata;
- plan-only formatting, local-link, heading/status/stale-term, referenced-path,
  diff-check, and scoped-worktree verification.

No runtime, migration, package, dependency, schema, route, UI, ADR, or
current-truth change is claimed by this expansion/recheck.

## 30. Leftovers And Handoff To Child 135

Child `135` receives:

- exact package V1 schemas and frozen compatibility fixtures;
- safe Markdown conversion policy;
- complete portable Page/Snippet/navigation/routing/OpenAPI graph;
- deterministic fresh-ID remapping;
- embedded imported Documentation Asset/File ownership;
- explicit external binding semantics;
- actor-bound inspection and permanent safe import provenance;
- new/empty target and no-overwrite rules;
- exact protected byte/digest and archive retention behavior;
- consistent source export loaders for draft/Revision/Publication;
- no live import synchronization.

Child `135` may reuse the portable graph/converters to implement whole-Site
Carry-Forward only when its accepted exact-Revision, same-Project,
missing-target, protected-File-reuse, provenance, and idempotency rules are
preserved. Carry-Forward must not round-trip through a ZIP, create an Import
Inspection, or treat package format as internal persistence.

Non-blocking future work remains:

- child `136`: review/approval;
- child `137`: browser-direct Try It;
- child `138`: configurable quotas, operational cleanup/reporting,
  performance/profiling, production observability, and capability-dependent
  browsers;
- child `139`: final Documentation V1 closeout;
- child `140`: post-V1 decisions including Git and third-party import adapters.
