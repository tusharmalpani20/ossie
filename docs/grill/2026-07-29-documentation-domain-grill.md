# Documentation Domain Grill Session

Date started: 2026-07-29

Status: All 32 workshop answers are provisionally accepted. On 2026-07-30 the
user accepted basic private comments in the first slice, resolving the reopened
Questions `23`/`31` boundary and the conditional comment proof in Question
`32`. Child `130` is complete; child `131` remains Not started until every
provisional answer is rechecked against that merged result and the required
canonical outputs are completed.

## Sequence Boundary

This record captures Documentation-domain discussion while children `129` and
`130` are being completed in another environment.

Until child `130` passes its closeout gate:

- answers in this record are provisional;
- child `131` is not marked In progress;
- `CONTEXT.md` is not changed for Documentation decisions;
- Documentation ADRs are not created;
- no Documentation runtime code, tables, routes, packages, or navigation are
  added;
- every provisional answer must be rechecked against the merged child `129` and
  `130` result before acceptance.

## Scope

The workshop covers the 32 questions reserved by
`docs/plan/131-documentation-domain-grill.md`, including:

- Documentation terms, ownership, and Project Version relationships;
- Pages, navigation, Working Drafts, Revisions, and Publications;
- OpenAPI import, rendering, API calls, code examples, and generated reference;
- authoring format and source of truth;
- permissions, search, URLs, carry-forward, assets, retention, and rollback;
- Mintlify as a product benchmark;
- Fumadocs and Scalar as possible rendering or API-reference tools;
- security, accessibility, performance, self-hosting, and phased delivery.

## Starting Evidence

- `CONTEXT.md`
- `PRODUCT.md`
- `DESIGN.md`
- `docs/adr/0021-project-versions-are-release-contexts.md`
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`
- `docs/adr/0023-carry-forward-copies-working-content-and-reuses-protected-assets.md`
- `docs/adr/0024-project-membership-governs-project-access.md`
- `docs/adr/0025-core-domain-persistence-is-explicitly-relational.md`
- `docs/adr/0026-audit-and-access-evidence-is-append-only.md`
- `docs/plan/master/005-knowledge-platform-and-ui-foundation-master-plan.md`
- child plans `109` through `131`
- current Guide, Interactive Demo, Publication, Publish Link, portal, docs-app,
  OpenAPI, and Scalar code
- current primary-source Mintlify, Fumadocs, Scalar, OpenAPI, GitHub, security,
  accessibility, and performance research

Repository checkpoint at workshop start:

- commit `5e78723`
- worktree clean
- child `129` Ready for implementation in this checkout
- child `130` Not started in this checkout
- the user reports children `129` and `130` are being built remotely

## Session Rules

- Resolve one consequential question at a time.
- Give a recommended answer before asking for the user's decision.
- Use concrete examples to test boundaries.
- Inspect the repository instead of asking for discoverable runtime facts.
- Record alternatives, tradeoffs, reversibility, affected scope, and outcome.
- Keep decisions provisional until the child `130` gate is verified.
- After that gate, recheck every answer and update `CONTEXT.md` as terms become
  accepted.
- Create ADRs only for important, difficult-to-reverse tradeoffs.
- Do not implement Documentation during the grill.

## Questions

### Q1. What should the primary Documentation artifact be called?

Recommended answer:

Use **Documentation Site** as the canonical term.

A Documentation Site is the stable, Project-owned identity for one organized
documentation experience. It can contain normal Pages, API reference generated
from OpenAPI, navigation, assets, and links or embeds to exact Guide and
Interactive Demo Publications.

Example:

```text
Project: Acme Platform
Documentation Sites:
- Developer Documentation
- Internal Operations Manual

Developer Documentation
  -> Main Site Edition
  -> 2.0 Site Edition
```

Why this term fits:

- `Site` clearly implies Pages, navigation, search, and a published reader.
- It is broad enough for developer documentation, API reference, product help,
  and internal manuals.
- `Documentation` remains the artifact family name already used by Master Plan
  `005`.
- It does not imply that all content is public.
- It leaves room for more than one Site in a Project if Q3 accepts that.

Alternatives:

- **Knowledge Base** suggests support or internal articles and is less natural
  for API reference.
- **Manual** suggests one long ordered document.
- **API Portal** is too narrow because the accepted direction also includes
  normal Pages, Guides, and Interactive Demos.
- **Docs** is useful informal UI copy but too vague as the canonical domain
  term and conflicts with the repository's `apps/docs` application.

Boundary example:

`Developer Documentation` can be a Documentation Site containing an API
reference. The OpenAPI file is not itself the Site, and each endpoint is not an
independently published Site.

Tradeoff:

The word `Site` may sound public, so UI copy must make its access mode explicit:
internal, restricted, password-protected, or public.

Reversibility:

Renaming this after persistence, APIs, routes, and UI ship would be expensive.
It should become accepted only after the child `130` gate and final
confirmation.

Affected scope:

- `CONTEXT.md`
- Documentation database and API names
- portal navigation and authoring language
- public reader language and URLs
- child plans beginning at `132`

Status:

Provisionally accepted. The canonical term is **Documentation Site**, subject
to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q2. Is a Documentation Page independently revised and published?

Recommended answer:

No. A Documentation Page should be edited as an individual part of a Site
Edition, but immutable revision and publication history should belong to the
whole Documentation Site Edition.

Proposed behavior:

```text
Documentation Site
  -> Site Edition for Main
       -> Working Draft
            -> Page: Authentication
            -> Page: API keys
            -> Navigation
            -> OpenAPI source
       -> Site Revision 1
       -> Site Revision 2
            -> Site Publication 1
```

Normal Page saves update the Site Edition's Working Draft. Each mutable Page can
have its own Row Version so two stale edits cannot silently overwrite one
another. A manual checkpoint or Publication creates or reuses one immutable
Site Revision containing the complete Page, navigation, OpenAPI, and embedded
artifact state.

Why this is recommended:

- Readers receive one internally consistent Documentation Site.
- Navigation cannot publish before its target Page or after that Page is
  removed.
- OpenAPI-generated reference and the written explanation describing it cannot
  silently come from different publication states.
- Publishing and rollback remain understandable: select one exact Site
  Revision rather than reconstructing a Site from many Page histories.
- It follows Ossie's existing Working Draft, Revision, and Publication
  language without forcing Guide and Interactive Demo content into the
  Documentation model.

Concrete scenario:

An Editor changes `Authentication`, adds a new `API keys` Page, and adds that
Page to navigation. Independent Page publishing could expose the navigation
before the new Page is public. Atomic Site Revision and Publication prevents
that broken state.

Alternative:

Give every Page its own Revisions and Publications, then publish a Site manifest
that selects one Publication for every Page.

Why not initially:

- considerably more concurrency and rollback rules;
- easier to create a mixed or broken Site;
- more difficult link, search, preview, and cache invalidation;
- little first-release benefit because readers experience the Site as one
  product.

Important boundary:

This answer does not decide whether a Page has a stable identity across Site
Editions. It decides only that Page content is not independently checkpointed
or published. Stable Page identity and cross-Project-Version behavior remain
for Q4 and Q13.

Reversibility:

Independent Page history could be added later if real editorial needs justify
it. Moving from independent Publications back to atomic Site Publications would
be much harder.

Affected scope:

- Documentation ownership and persistence
- checkpoint, preview, Publication, and rollback behavior
- Page editing concurrency
- navigation and internal-link validation
- search and cache invalidation

Status:

Provisionally accepted. Documentation Pages are saved individually inside the
Working Draft, with Row Version conflict protection, but immutable Revisions,
Publications, and rollback apply to the complete Documentation Site Edition.
This remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q3. Can one Project have multiple Documentation Sites?

Recommended answer:

Yes. A Project may own multiple stable Documentation Sites, and each
Documentation Site may have at most one Site Edition for each Project Version.

Example:

```text
Project: Acme Platform
  -> Documentation Site: Developer Documentation
       -> Main Site Edition
       -> 2.0 Site Edition
  -> Documentation Site: Internal Operations Manual
       -> Main Site Edition
       -> 2.0 Site Edition
```

Why this is recommended:

- Developer documentation and an internal operations manual can require
  different navigation, access, search, branding, and publication timing.
- One large Site with hidden sections makes permission checks, search results,
  URLs, and reader expectations harder to understand.
- A Site remains a stable identity across Project Versions, matching Ossie's
  accepted Artifact and Edition distinction without requiring Documentation to
  use Guide or Interactive Demo content tables.
- Teams that need only one Site still receive one simple default workflow.

Rules:

- Every Documentation Site belongs to exactly one Project.
- A Site does not belong to one Project Version directly.
- A Site Edition belongs to exactly one Documentation Site and one Project
  Version.
- A Site has at most one Site Edition for each Project Version.
- Project Membership governs internal Site access.
- Published access is configured separately for each Site's Publish Links or
  accepted Documentation publication route.
- A Site Edition may exist in some Project Versions and not others.
- Creating a Project Version does not automatically create empty Site Editions.

Concrete scenario:

The Developer Documentation is public and contains OpenAPI reference. The
Internal Operations Manual contains private deployment and recovery procedures.
Putting both into one Site would require Page-level access rules throughout
navigation, search, preview, and publication. Separate Sites preserve a clear
security boundary.

Alternative:

Allow exactly one Documentation Site per Project and represent different bodies
of knowledge as top-level sections or tabs.

Why not:

- it creates pressure for Page-level access and publication rules;
- unrelated documentation must share one lifecycle and one public identity;
- splitting a large Site later would break URLs and publication history.

First-slice boundary:

The persistence model and APIs should permit multiple Sites. The first
implementation slice may keep Site creation and management intentionally
simple; it does not need cross-Site search, bulk publication, or shared
navigation.

Reversibility:

Supporting multiple Sites in the ownership model is cheap to preserve.
Migrating from a one-Site assumption after customers have published content
would be disruptive.

Affected scope:

- Documentation Site and Site Edition ownership
- Project libraries and routes
- access, search, and publishing boundaries
- Site creation and selection UI
- child plans beginning at `132`

Status:

Provisionally accepted. A Project may own multiple Documentation Sites. Each
Site may have at most one Site Edition for each Project Version. This remains
subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q4. How do Site, Site Edition, Working Draft, Page, Navigation Tree,
Revision, and Publication relate?

Recommended answer:

Use the Documentation Site Edition as the ownership and history boundary.

```text
Project
  -> Documentation Site
       -> Site Edition for one Project Version
            -> one mutable Site Working Draft
                 -> Documentation Pages
                 -> Navigation Tree
                 -> OpenAPI Sources
                 -> exact Guide/Demo Publication references
            -> immutable Site Revisions
                 -> immutable Site Publications
```

Definitions:

- **Documentation Site**: stable, Project-owned identity across Project
  Versions. Identity only; it is not editable content.
- **Documentation Site Edition**: the representation of one Documentation Site
  for exactly one Project Version. It owns title, description, lifecycle, and
  other Edition-level presentation settings.
- **Site Working Draft**: the one mutable authored state of one Site Edition.
  Normal Page, navigation, and API-reference saves change only this Working
  Draft.
- **Documentation Page**: one authored Page inside one Site Working Draft. It
  owns its title, slug, description, body, and Page-specific settings.
- **Navigation Tree**: an ordered Edition-owned structure of groups, links, and
  Page references. It organizes Pages but does not own their content.
- **Documentation Site Revision**: one immutable checkpoint of the complete
  Working Draft, including Pages, navigation, selected OpenAPI source state,
  assets, and exact embedded Publications.
- **Documentation Site Publication**: one immutable published result that
  identifies one exact Site Revision, Site Edition, and Project Version and has
  an Edition-scoped Publication Sequence.

Page identity recommendation:

In V1, a Documentation Page is owned by one Site Working Draft rather than
being another stable artifact with its own Editions. Carry-Forward copies Pages
into the target Site Edition with new record identities, keeps their slugs where
possible, and records immediate source-Page lineage. There is no hidden live
coupling between source and target Pages.

This means a Page is stable while its Site Edition is being edited, but it is
not an independently versioned artifact spanning every Project Version.

Version-switch behavior can normally match the same Page slug after
Carry-Forward. If no matching Page exists in the selected Project Version, the
reader should go to that Site Edition's home Page rather than expose content
from another Edition.

Core relationship rules:

- A Documentation Site belongs to exactly one Project.
- A Site may have many Site Editions.
- A Site Edition belongs to one Site and one Project Version.
- A Site has at most one Site Edition per Project Version.
- Every Site Edition has exactly one mutable Site Working Draft.
- A Working Draft may contain many Pages and one Navigation Tree.
- A Navigation Tree may reference Pages in the same Working Draft and approved
  external links; it cannot point to another Site's draft content.
- A Site Revision belongs to one Site Edition and freezes the whole Working
  Draft.
- A Site Publication identifies one exact Site Revision and never points to a
  live Working Draft.
- Site Revision Numbers and Publication Sequences increase independently within
  one Site Edition.

Concrete scenario:

`Developer Documentation` has a `Main` Site Edition and a `2.0` Site Edition.
Both may contain `/authentication`, but they are independent Pages. Editing
`Main` never changes `2.0`. Publishing `2.0` freezes its Pages, navigation,
OpenAPI state, assets, and embedded Guide/Demo Publications together.

Alternative:

Make every Page a stable Project-owned artifact with its own Page Editions,
Working Draft, Revisions, and Publications.

Why not:

- it recreates a full artifact lifecycle for every Page;
- a Site Publication would need to assemble and validate many independent Page
  Publications;
- moving, deleting, carrying forward, searching, previewing, and rolling back a
  Site becomes much more complicated;
- Q2 already accepts the whole Site Edition as the publication boundary.

Tradeoff:

Edition-owned Pages make independent cross-version Page history less direct.
Immediate Carry-Forward lineage, preserved slugs, Site Revisions, and Audit
history provide adequate traceability without creating a second publication
model.

Reversibility:

A stable cross-Edition Page identity could be introduced later if strong
cross-version authoring needs appear. Removing a Page-level
Edition/Revision/Publication model after shipping would be far harder.

Affected scope:

- Documentation vocabulary and relationships
- relational persistence and immutable history
- Page and navigation APIs
- Carry-Forward and Project Version selector behavior
- preview, Publication, rollback, search, and asset protection

Status:

Provisionally accepted. The Documentation Site is the stable Project-owned
identity. Each Site Edition belongs to one Project Version and owns one mutable
Working Draft containing Pages, navigation, OpenAPI source state, and exact
Guide/Demo Publication references. Site Revisions and Site Publications freeze
that complete state. Pages remain Edition-owned children rather than
independently versioned artifacts. This remains subject to recheck and final
acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q5. What exactly does a Documentation Site Publication freeze?

Recommended answer:

A Documentation Site Publication should identify one exact immutable
Documentation Site Revision. That Site Revision freezes the entire Site
Edition's authored state atomically.

The immutable Revision includes:

- every included Documentation Page and its exact content;
- the complete Navigation Tree and ordering;
- the exact OpenAPI source files and generated-operation selection;
- exact referenced Assets;
- exact Guide and Interactive Demo Publications;
- Site Edition presentation settings required by the reader;
- redirect and internal-link state accepted for that Revision.

The Publication adds publishing information such as its Publication Sequence,
creation evidence, and public-access relationship. It does not copy the Site
into a generic JSON snapshot and does not point to the mutable Working Draft.

```text
Site Working Draft
  -> checkpoint or publish
  -> immutable Site Revision 4
  -> immutable Site Publication 2
```

If the Working Draft is unchanged, Publication may reuse the latest equivalent
Site Revision rather than create a duplicate Revision. It still creates a new
immutable Site Publication with the next Publication Sequence when the user
chooses to publish again.

Rollback:

Rollback changes which existing Site Publication a Publish Link exposes. It
does not edit or delete any Site Revision or Site Publication.

Why this is recommended:

- one exact object explains what readers receive;
- Pages, navigation, OpenAPI, assets, and embedded artifacts cannot drift apart;
- rollback is a safe pointer change rather than content reconstruction;
- it matches Ossie's shipped Guide and Interactive Demo rule that a Published
  Artifact identifies an exact immutable Revision;
- it preserves explicit relational content instead of introducing a generic
  JSON snapshot.

Alternative:

Publish a manifest that independently selects a separate snapshot for every
Page, navigation item, and OpenAPI section.

Why not:

- it permits mixed states that were never reviewed together;
- rollback and link validation become harder;
- the Site would need to reconstruct one reader state from many histories;
- it contradicts the Site-level Revision boundary accepted in Q2 and Q4.

Affected scope:

- Revision and Publication persistence
- checkpoint and publish transactions
- Publication Sequence and rollback
- public reader rendering and caching
- internal-link, OpenAPI, embed, and protected-Asset validation

Status:

Provisionally accepted. A Site Publication identifies one exact immutable Site
Revision that freezes all included Pages, navigation, OpenAPI state, Assets,
embedded Publications, redirects, and reader settings. Rollback selects an
older immutable Publication without changing history. This remains subject to
recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- a Documentation Publication ADR if the final tradeoff still meets the ADR
  threshold
- this grill record

### Q6. Can Pages or reusable text be shared live across Sites or Project
Versions?

Recommended answer:

No mutable Page or text snippet should be shared live in the first slice or V1.
Reuse should mean an explicit copy or an exact immutable reference, never a
hidden connection that changes several Working Drafts or Publications at once.

Rules:

- A Documentation Page belongs to one Site Working Draft.
- Carry-Forward copies Pages into the target Site Edition with new identities
  and immediate source lineage.
- A copied Page changes independently after the copy.
- Editors may duplicate a Page or selected content into another Site, but later
  edits do not synchronize automatically.
- Shared protected Assets may be referenced under Ossie's existing
  reference-protection rules.
- Guides and Interactive Demos are reused only by selecting exact immutable
  Publications.
- A future reusable-snippet feature may exist only with an explicit stable
  identity and immutable snippet Revision pinned by every Site Revision. It is
  deferred from V1.

Concrete scenario:

The sentence `Contact support@example.com` appears in twenty Pages. If all
twenty Pages read one live mutable snippet, editing that snippet could change a
published Site without a new Site Revision or review. That violates immutable
Publication behavior.

In V1, the editor copies the text. A later, deliberately modeled snippet feature
could let a Site Working Draft choose a newer immutable snippet Revision and
then create a new Site Revision and Publication.

Why this is recommended:

- Publications never change behind the reader's back.
- Carry-Forward remains independent and understandable.
- deleting or archiving one Site cannot silently break another;
- permissions and search do not need to follow hidden draft dependencies;
- the first slice avoids creating another full revisioned artifact family.

Alternative:

Allow live Pages or snippets shared across Sites and Project Versions.

Why not:

- one edit creates unreviewed changes in many places;
- permissions and tenant-safe access become difficult;
- Revision, Publication, rollback, deletion, and cache rules become ambiguous;
- authors cannot easily see the full effect of a small edit.

Tradeoff:

Explicit copying creates some repeated text. That is safer than invisible
coupling. Evidence from real customer use can justify a separately modeled
immutable snippet feature later.

Affected scope:

- Page and content ownership
- Carry-Forward and duplication
- protected Assets and embedded Publications
- Revision immutability and dependency validation
- V1 feature exclusions

Discussion and revised recommendation:

The user challenged the copying-only recommendation with a concrete case: if
the same support information appears on twenty Pages, requiring an Editor to
update twenty copies is wasteful and likely to leave inconsistent content.
That challenge is accepted.

The revised recommendation supersedes the copying-only recommendation above:

- V1 should support a **Reusable Documentation Snippet** inside one Site
  Edition's Working Draft.
- Many Pages in that Working Draft may reference the same Snippet.
- Editing the Snippet once updates every draft Page that references it.
- The editor must show where the Snippet is used before it is changed or
  removed.
- A Site Revision freezes the exact Snippet content used at checkpoint time.
- An existing Site Publication never changes when the mutable Snippet changes.
- Publishing the updated Site creates or reuses a new Site Revision and creates
  a new Site Publication.
- Carry-Forward copies the Snippet and its Page references into the target Site
  Edition as independent content.
- The same mutable Snippet is not shared across different Sites or Site
  Editions in V1. Cross-Site or cross-Project-Version reuse requires a later
  explicit model rather than hidden coupling.

Example:

```text
Reusable Documentation Snippet: Support contact
  -> used by 20 Pages in the Main Site Edition Working Draft
  -> edit once
  -> all 20 draft Pages show the new contact
  -> current Publication stays unchanged
  -> next Site Publication includes the new contact everywhere
```

This gives Editors the useful one-change-many-Pages workflow while preserving
independent Project Versions and immutable Publications.

Status:

Provisionally accepted with the revised recommendation. V1 supports Reusable
Documentation Snippets inside one Site Edition Working Draft. Many Pages may
reference one Snippet, and one edit updates all draft uses. Site Revisions
freeze exact Snippet content, Publications never change silently, and
Carry-Forward creates an independent target copy. Mutable Snippets are not
shared across Sites or Site Editions in V1. This remains subject to recheck and
final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q7. What authoring format should Documentation use?

Recommended answer:

Use a deliberately constrained combination:

1. safe Markdown for normal writing;
2. typed Ossie blocks for richer behavior;
3. a visual editor as the normal authoring experience;
4. no arbitrary MDX, JavaScript, React components, or raw HTML.

Normal writing includes:

- headings;
- paragraphs;
- lists;
- links;
- quotes;
- tables;
- inline and fenced code;
- emphasis.

Typed Ossie blocks include:

- callout;
- tabs;
- image;
- code example;
- OpenAPI operation or schema;
- Reusable Documentation Snippet;
- exact Guide Publication;
- exact Interactive Demo Publication.

The author normally uses a friendly visual editor and command menu. Ossie
stores the result in a controlled format that can be validated, searched,
rendered safely, and exported as useful Markdown. An optional source view may
be added for experienced authors, but it must obey the same safe rules.

Why this is recommended:

- Markdown is portable, readable, searchable, and suitable for later export or
  Git workflows.
- Typed blocks give Ossie safe, first-class API, Guide, Demo, and Snippet
  behavior that plain Markdown cannot express reliably.
- A visual editor serves authors who do not want to write markup.
- Rejecting arbitrary MDX and raw HTML prevents customer content from running
  code inside Ossie or a published reader.
- It fits the accepted rule that Documentation must have its own explicit
  content model rather than a vague universal JSON document.

Persistence direction:

- standard prose is stored as controlled Markdown text;
- block order and identity are explicit;
- blocks with product meaning use type-specific relational fields or child
  records;
- OpenAPI, Asset, Guide Publication, Demo Publication, and Snippet references
  use real identifiers and ownership checks;
- Site Revisions copy the exact relational content required for immutable
  rendering;
- no generic MDX program or JSON blob controls ownership, permissions,
  lifecycle, ordering, or asset protection.

Concrete examples:

```text
Heading: Create an API key
Paragraph: Explain why the key is needed.
Callout: Never commit a key to source control.
OpenAPI operation: POST /api-keys
Interactive Demo Publication: Create your first API key
```

Alternatives:

**Plain Markdown only**

- simple and portable;
- too limited for safe product embeds, rich API content, and a polished visual
  editor without inventing custom syntax throughout the document.

**Arbitrary MDX**

- very flexible;
- permits JavaScript and component execution;
- makes security, export, self-hosting, and long-term compatibility harder;
- lets implementation details leak into customer content.

**Rich text stored as one editor JSON document**

- convenient for some editor libraries;
- conflicts with Ossie's explicit persistence boundary if that JSON becomes
  the source of truth;
- makes durable validation and type-specific relationships less clear.

Tradeoff:

The controlled combination supports fewer custom components than unrestricted
MDX. That is intentional. New block types can be added deliberately when a real
product need is accepted.

Affected scope:

- authoring editor and preview
- Documentation persistence and Revision copying
- safe rendering and content security rules
- Fumadocs boundary
- Markdown/ZIP/Git import and export
- search and accessibility

Research pause:

The user asked to evaluate current React editors from npm before deciding the
authoring approach. Primary documentation, package metadata, React compatibility,
license, storage format, custom-block support, Markdown behavior, accessibility,
server use, and collaboration direction were checked on 2026-07-29.

Current shortlist:

| Editor | Checked version | License | Ossie fit |
| --- | ---: | --- | --- |
| Tiptap | `3.29.2` | MIT core | Best overall fit |
| Lexical | `0.48.0` | MIT | Strong low-level alternative |
| Plate | `53.2.4` | MIT | Strong but broad and fast-moving |
| MDXEditor | `4.1.1` | MIT | Best Markdown-first alternative |
| Milkdown | `7.21.3` | MIT | Good Markdown editor, more integration work |
| BlockNote | `0.52.1` | MPL-2.0 core | Polished, but its storage model conflicts |
| CKEditor | `48.3.1` | GPL/commercial terms | Poor licensing/product fit |
| TinyMCE | `8.8.2` | GPL/commercial terms | HTML-first and poor product fit |
| Quill | `2.0.3` | BSD-3-Clause | Too limited for Ossie's typed blocks |

Evidence and findings:

**Tiptap**

- React `19` is supported by the current React package.
- The core editor and standard extension system are MIT licensed.
- It is headless, so Ossie can own the toolbar, menus, block controls, focus
  behavior, and Quiet Versioned Workbench styling.
- React Node Views can represent OpenAPI operations, Snippets, callouts, Assets,
  Guide Publications, and Interactive Demo Publications.
- Its schema restricts which nodes and marks are accepted.
- Tiptap publishes clear keyboard and screen-reader guidance, but the
  application remains responsible for making its toolbar and menus accessible.
- The current bidirectional Markdown extension is marked beta and has documented
  limitations. Markdown round-trip behavior must therefore pass a proof before
  it becomes Ossie's persistence or import/export boundary.
- Tiptap sells optional Pro and cloud features. Ossie should use only the
  accepted MIT packages and must not depend on a paid service or private npm
  registry.

**Lexical**

- React `19` and MIT licensing fit Ossie.
- It has the strongest explicit accessibility position in the shortlist and
  supports custom React Decorator Nodes.
- It is intentionally low-level and does not provide the complete Documentation
  editor UI. Ossie would need to build more toolbar, menu, Markdown, and
  block-authoring behavior itself.
- Its natural editor serialization is JSON. That JSON may be an in-memory
  adapter but should not become Ossie's persistent source of truth.

**Plate**

- React `19`, MIT licensing, plugin-based custom React components, server-safe
  processing, and two-way Markdown conversion are attractive.
- Its copied UI component approach could be styled to match Ossie.
- Its custom Markdown elements use MDX-like syntax. Ossie would still need a
  strict allowlist and must never execute customer JSX or JavaScript.
- The package family is broad and moves quickly, increasing upgrade and
  dependency review work.

**MDXEditor**

- React `19`, MIT licensing, Markdown as the external value, source/diff mode,
  and custom Markdown directives align well with portable content.
- It can represent controlled blocks through directives without enabling JSX.
- It is client-only and has its own editor UI and Gurx extension layer.
- Its optional JSX and HTML features must remain disabled because JSX
  expressions and raw HTML violate the accepted security direction.
- It is the best fallback if Tiptap's Markdown proof fails.

**Milkdown**

- It is MIT, headless, Markdown-first, React-compatible, and built on ProseMirror
  and Remark.
- It supports plugins and future Yjs collaboration.
- Its out-of-box product-block and React UI story is less direct than Tiptap's,
  so more of the editor experience would still be custom.

**BlockNote**

- It provides the strongest Notion-like experience out of the box and supports
  custom React blocks and collaboration.
- Its core is MPL-2.0 rather than MIT, and optional XL packages use GPL-3.0 or a
  commercial license.
- Its documentation recommends BlockNote JSON for lossless storage and labels
  Markdown export as lossy. That conflicts with Ossie's requirement not to make
  a third-party generic JSON document the persistent source of truth.
- Its large supplied UI would also require more work to match Ossie's accepted
  design system.

Revised recommended editor boundary:

Use **Tiptap as the authoring engine**, subject to a focused proof before the
implementation dependency is accepted.

The boundary is:

- Tiptap owns cursor movement, text selection, undo/redo, keyboard editing, and
  the temporary in-browser editor tree.
- Ossie owns the toolbar, menus, visual design, allowed schema, block picker,
  validation, autosave, conflicts, permissions, and every product command.
- Tiptap custom React Node Views display typed Ossie blocks.
- Tiptap JSON is never the database or Publication source of truth.
- Saves translate the editor state into Ossie's controlled prose and explicit
  relational block records.
- The published reader renders Ossie's immutable Revision data and does not
  load the editor runtime.
- The editor route is loaded separately so its dependency cost does not increase
  public Guide, Demo, or Documentation reader bundles.
- Only MIT Tiptap packages are allowed initially. Tiptap Cloud, paid Pro
  extensions, AI, comments, tracked changes, and real-time collaboration remain
  outside this decision.

Required proof before implementation acceptance:

1. React `19` and Vite integration.
2. Keyboard and screen-reader operation for editor, toolbar, slash menu, and
   custom blocks.
3. Controlled Markdown import/export round trip for the accepted prose subset.
4. Custom OpenAPI, Snippet, Guide, and Demo Node Views using safe identifiers.
5. Translation to and from Ossie's explicit relational block model without
   persisted Tiptap JSON.
6. Paste sanitization and rejection of raw HTML, script, unsafe URLs, and
   unsupported nodes.
7. Lazy-loaded editor bundle measurement.
8. Read-only and conflict-recovery behavior without loading editor code in the
   public reader.

Fallback:

Use MDXEditor with only safe Markdown and allowlisted directives if Tiptap fails
the Markdown round-trip or relational-adapter proof. Do not enable MDX JSX,
imports, expressions, or raw HTML.

Primary sources:

- `https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react`
- `https://tiptap.dev/docs/editor/markdown`
- `https://tiptap.dev/docs/guides/accessibility`
- `https://github.com/ueberdosis/tiptap`
- `https://lexical.dev/`
- `https://lexical.dev/docs/concepts/nodes`
- `https://lexical.dev/docs/serialization/`
- `https://platejs.org/docs/markdown`
- `https://platejs.org/docs/installation/node`
- `https://mdxeditor.dev/editor/docs/custom-directive-editors`
- `https://mdxeditor.dev/editor/docs/getting-started`
- `https://mdxeditor.dev/editor/docs/jsx`
- `https://milkdown.dev/docs`
- `https://www.blocknotejs.org/docs/features/blocks/custom`
- `https://www.blocknotejs.org/docs/features/export/markdown`
- `https://github.com/TypeCellOS/BlockNote`
- current npm registry metadata for the package versions recorded above

Status:

Provisionally accepted. Tiptap `3.29.2` is the preferred authoring engine under
the boundary and proof requirements above. Only accepted MIT packages may be
used. Tiptap does not own persistent content, Publications, product commands,
permissions, or visual design. MDXEditor is the fallback if Tiptap fails the
Markdown round-trip or relational-adapter proof. This major dependency decision
remains subject to the focused proof, child `130` recheck, and final acceptance.

Decision records after the sequence gate:

- `CONTEXT.md` for the authoring format, not the implementation library
- a Documentation authoring/security ADR if the final tradeoff still meets the
  ADR threshold
- this grill record for the package evidence and proof gate

### Q8. What is the Documentation source of truth?

Recommended answer:

Use **database-first** ownership. Ossie's database and protected File storage
are the authoritative source for Documentation Working Drafts, Revisions,
Publications, permissions, and history.

Database-first means:

- the browser editor saves through Ossie APIs;
- Site, Site Edition, Page, Navigation, Snippet, block, Asset, OpenAPI, Revision,
  and Publication ownership is enforced by Ossie;
- Row Version conflict protection applies at the accepted mutable boundaries;
- every successful mutation and meaningful access uses Ossie's Audit and Access
  Evidence rules;
- Project Membership takes effect immediately;
- Site Revisions are created transactionally from one controlled Working Draft;
- Publications identify exact immutable Site Revisions;
- self-hosted Ossie works without GitHub, GitLab, or another hosted service.

Git is not an equal source of truth in the first slice or V1.

Initial Git-related behavior:

- manual Markdown, ZIP, and OpenAPI import may create or update a Working Draft
  only through validated Ossie commands;
- export may produce a portable Markdown folder or ZIP;
- imports never change an existing Publication automatically;
- imported content receives normal authorization, validation, Row Version,
  Audit, and Revision treatment.

Later Git integration:

- may connect one repository and branch to one Documentation Site under an
  explicitly accepted synchronization mode;
- incoming Git changes become validated proposed Working Draft changes rather
  than silently replacing immutable history;
- outgoing export or commits represent explicit Ossie actions;
- Git commit history does not replace Site Revisions, Publications, Audit
  Evidence, or access control;
- bidirectional synchronization is not accepted by this question and remains
  subject to Q9.

Why this is recommended:

- Ossie's browser authoring, Project Membership, Audit/Access Evidence, Row
  Version conflicts, atomic Site Revisions, protected Assets, and Publications
  already assume one transactional authority.
- Database-first behavior works for non-technical authors without requiring a
  Git account.
- It preserves self-hosting and keeps customer content under the same tenant
  and permission model as Guides and Interactive Demos.
- Git cannot transactionally coordinate Page edits, navigation, OpenAPI Files,
  Assets, embedded Publications, permissions, and Publish Links.
- Two equal authorities create ambiguous conflicts and can bypass Ossie's audit
  or Publication rules.

Concrete scenario:

An Editor changes a Page in Ossie while a developer changes the same Markdown
file in Git. If both are authoritative, neither side can safely decide which
content, navigation, Snippet, OpenAPI reference, and Row Version is correct.

Under database-first ownership, the Git change is imported as a proposed change
against a known Working Draft Row Version. Ossie either applies it safely or
shows a conflict. The existing Publication remains unchanged.

Alternatives:

**Git-first**

- familiar for engineering teams;
- poor fit for browser autosave, non-technical authors, Project Membership,
  transactionally consistent Site state, and Ossie-owned Audit Evidence;
- would make the editor a Git client rather than a native Ossie authoring
  workflow.

**Equal bidirectional ownership**

- appears flexible;
- creates two competing histories and unclear conflict, deletion, rename,
  permission, and force-push behavior;
- is the most difficult option to make safe and understandable.

Tradeoff:

Database-first does not immediately provide a docs-as-code workflow. Portable
export and validated import preserve escape paths while real Git needs are
learned.

Reversibility:

Adding controlled Git synchronization to a database-first model is possible.
Recovering one trustworthy history after shipping two equal sources of truth is
far harder.

Affected scope:

- persistence and File ownership
- autosave, concurrency, and conflict recovery
- import/export and future Git integration
- Audit/Access Evidence and Project Membership
- Revision, Publication, rollback, and self-hosting

Status:

Provisionally accepted. Ossie's database and protected File storage are the
Documentation source of truth. Git is not an equal authority. Imports update
only a Working Draft through validated Ossie commands, exports remain portable,
and immutable Revisions and Publications stay Ossie-owned. This remains subject
to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- a Documentation source-of-truth ADR if the final tradeoff still meets the ADR
  threshold
- this grill record

### Q9. If Git integration is added later, how should it work safely?

Recommended answer:

Defer Git integration from the first slice and V1. When real demand justifies
it, add a controlled GitHub bridge with two explicit workflows rather than
automatic equal-authority synchronization:

1. **Import proposal**: a repository change creates a reviewable proposal
   against one known Site Working Draft.
2. **Export pull request**: an Editor explicitly exports the current Working
   Draft or Site Revision to a new branch and pull request.

Connection boundary:

- first support GitHub only; evaluate GitLab separately later;
- use a GitHub App, not long-lived personal access tokens;
- connect one Documentation Site to one allowed repository, base branch, and
  directory;
- request only the repository permissions required for content, pull requests,
  and verified webhooks;
- use short-lived installation access tokens;
- keep GitHub App secrets in the instance's secret store or deployment
  configuration, never in Documentation content or Audit Change Items;
- record non-secret connection identity and state relationally.

Incoming change behavior:

- verify every webhook signature before processing;
- deduplicate webhook deliveries and reject replay;
- confirm the installation, Organization, repository, branch, and directory
  match the connection;
- fetch from the exact received commit;
- validate paths, file counts, file sizes, Markdown, OpenAPI, media references,
  and safe URLs;
- present added, changed, renamed, and deleted content as one import proposal;
- compare both the last imported Git commit and current Working Draft Row
  Version;
- require an Editor to review and apply the proposal through one normal audited
  Ossie mutation;
- never alter a Site Revision, Publication, Publish Link, or public reader
  directly from a webhook.

Conflict behavior:

- if only Git changed, show a clean proposal;
- if only Ossie changed, allow an explicit export pull request;
- if both changed since the last shared checkpoint, show a conflict and require
  a human choice for each affected Page, Snippet, navigation item, or OpenAPI
  source;
- do not silently pick Git, silently pick Ossie, or attempt an invisible
  automatic merge;
- applying a resolved proposal increments the applicable Row Versions and
  records Audit Evidence.

Deletion and rename behavior:

- an incoming Git deletion proposes removal from the Working Draft only;
- it cannot delete immutable Revisions, Publications, protected Assets, or
  historical Audit/Access Evidence;
- a rename proposes a Page slug change plus redirect handling rather than
  delete-and-recreate when identity can be proven;
- ambiguous rename detection is shown as delete plus add and requires review;
- outgoing deletes and renames appear in the export pull request for normal
  repository review.

Force-push behavior:

- store the last accepted Git commit as the connection checkpoint;
- if the configured branch no longer contains that checkpoint, pause imports
  and mark the connection as diverged;
- require an authorized Project Admin to choose a new base and create a fresh
  proposal;
- never rewrite Ossie history to match rewritten Git history.

Branch and Project Version rule:

A Git branch is not a Project Version. The connected base branch is only the
transport location for one Documentation Site. Any mapping between Git content
and a specific Site Edition must be explicit in the import/export command.

Why this is recommended:

- short-lived GitHub App tokens and narrow repository permissions reduce secret
  exposure;
- pull requests preserve familiar engineering review without making Git the
  product authority;
- proposals protect browser edits and prevent webhook events from bypassing
  authorization, validation, Audit Evidence, or immutable Publication rules;
- paused divergence is safer than guessing after a force-push;
- a GitHub-only first integration keeps the security and conflict model
  testable before adding another provider.

Alternative:

Automatically pull and push the configured branch, resolve non-overlapping
changes automatically, and treat every merged commit as live Documentation.

Why not:

- webhook delivery, repository history, and Ossie writes cannot share one
  transaction;
- force-pushes, branch deletion, path moves, and concurrent browser edits can
  lose content;
- Git credentials and provider outages become part of the core authoring path;
- a repository event could bypass Publication review.

Affected scope:

- future GitHub App and webhook security
- import/export proposal and conflict UI
- Row Version and Audit Evidence
- Page delete, rename, redirect, and protected-Asset rules
- self-hosted configuration and operations

Status:

Provisionally accepted. Git integration is deferred from the first slice and
V1. A later GitHub App may provide reviewed import proposals and explicit export
pull requests under the connection, credential, webhook, conflict, deletion,
force-push, Audit, and Project Version boundaries above. Git never becomes an
equal authority or changes immutable Publications directly. This remains
subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for the source-of-truth boundary
- the future Git integration child plan and security record
- a Git integration ADR only when the provider and final workflow are accepted
- this grill record

### Q10. What may Fumadocs own, and what must remain Ossie-owned?

Recommended answer:

Use **Fumadocs Core and selected Fumadocs UI reader components** after a focused
proof. Do not build the complete public Documentation reader from scratch.

This replaces the earlier Core-only recommendation after a deeper check. It
does not recommend turning Ossie into a standard file-based Fumadocs
application. Fumadocs should be a replaceable presentation layer over content
that Ossie has already authorized and published.

Checked package evidence on 2026-07-29:

- `fumadocs-core` `16.13.0`, MIT;
- `fumadocs-ui` `16.13.0`, MIT;
- `fumadocs-openapi` `11.2.2`, MIT;
- the project officially supports Next.js and Vite-based React Router, TanStack
  Start, and Waku applications;
- its React Router setup uses React, Tailwind CSS 4, `fumadocs-core`, and
  `fumadocs-ui`, which fits Ossie's React `19.2`, Vite `7`, and Tailwind CSS 4
  base in principle;
- Fumadocs supports custom and dynamic content sources, so it does not require
  Markdown files to be the source of truth;
- its packaged UI supplies a responsive Documentation layout, sidebar, mobile
  navigation, table of contents, search dialog, breadcrumbs, code presentation,
  and other reader behavior;
- the UI can be changed through supported properties and replacement slots;
- its command-line tool can copy components into a product for deeper changes,
  but copied components stop receiving normal upstream UI updates;
- its Page Tree is sent to the browser and therefore cannot contain secret or
  unauthorized entries;
- Fumadocs access-control guidance requires filtering content before it enters
  the Page Tree and leaves custom route and search protection to the
  application;
- the current UI package has 22 direct dependencies and changes frequently, so
  Ossie must pin and review upgrades instead of following latest releases
  automatically.

Why the recommendation changed:

The Core-only choice gives Ossie Page Tree and search helpers, but still makes
Ossie build and maintain almost every hard reader detail: desktop and mobile
navigation, table of contents, active-page behavior, keyboard behavior, search
dialog, code presentation, responsive layout, and reader states. Those are not
Ossie's special value. Fumadocs UI already solves that class of work and is
designed to be customized.

| Choice | Main benefit | Main cost | Decision |
| --- | --- | --- | --- |
| Full file-based Fumadocs product | Fastest standard docs site | Conflicts with Ossie's database, permissions, Revisions, Publications, and product identity | Reject |
| Fumadocs Core only | Small dependency and full visual control | Ossie still rebuilds most of a mature docs reader | Reject as the default |
| Core plus selected UI reader pieces | Mature reader behavior while Ossie keeps its product model | Theme work, dependency review, and a clear adapter are required | Recommend after proof |
| Entirely Ossie-built reader | Complete control | Repeats years of docs-reader work and creates permanent maintenance | Reject unless the proof fails |

Fumadocs may own inside the **published reader layer**:

- rendering the already-authorized Page Tree;
- responsive sidebar and mobile navigation behavior;
- table of contents, breadcrumbs, and previous/next traversal;
- code-block and other safe presentation components;
- the search dialog and result presentation;
- reader-only layout behavior that creates no product state.

Fumadocs Core may convert one already-authorized immutable Site Revision into
the temporary reader data needed by those components.

Fumadocs must not own:

- Documentation Site, Site Edition, Working Draft, Page, Snippet, Navigation,
  Revision, Publication, or Publish Link identity;
- relational persistence or File storage;
- Project Membership, access modes, tenant isolation, or public-link policy;
- Audit or Access Evidence;
- Row Version conflicts, autosave, checkpoint, Carry-Forward, or rollback;
- canonical URLs, aliases, redirects, lifecycle, retention, or deletion;
- the authoritative Navigation Tree;
- the authoritative search index or permission filters;
- OpenAPI source ownership, validation status, credentials, or API proxy
  security;
- Ossie's editor or authoring data;
- Ossie's accepted design system or product identity.

UI decision:

Use packaged Fumadocs UI components first through their supported options and
replacement slots. Apply Ossie's colors, spacing, typography, controls, access
states, and Project Version selector so the result still feels like Ossie.

Do not copy the whole Fumadocs UI into the repository at the start. Copy a
specific component only if the packaged component blocks an accepted Ossie
experience and no supported slot can solve it. This avoids owning a large copy
that no longer receives upstream fixes.

The authoring experience remains in Ossie's portal and uses the provisionally
accepted Tiptap boundary. Fumadocs is not used as the editor.

Application boundary:

Ossie's current `apps/web` uses a small custom route parser, not React Router.
Fumadocs officially supports React Router but does not directly fit that current
router. The proof must compare:

1. an isolated Documentation reader boundary using a supported Fumadocs
   framework adapter; and
2. selected framework-neutral Fumadocs components inside the existing public
   web application.

Do not choose a new application or routing framework during this question.
Public SEO, custom domains, rendering, and caching questions `26` and `27` must
decide that later. `apps/docs` remains the repository's own contributor docs
site and must not become customer Documentation.

OpenAPI boundary:

Do not adopt `fumadocs-openapi` automatically merely because the reader uses
Fumadocs UI. It requires Fumadocs UI and uses Scalar client packages for parts
of its API experience.

The first implementation proof should compare:

1. Fumadocs OpenAPI inside the accepted reader and security boundary; and
2. Scalar embedded directly inside the same reader.

Choose one OpenAPI renderer after measuring accessibility, bundle size,
customization, safe API-call behavior, and compatibility. Do not ship both
unless each has a distinct proven job.

Search boundary:

Ossie selects the Site Revision, access scope, Project Version, included Pages,
and allowed OpenAPI operations before any Fumadocs search code sees them.
Fumadocs UI may show a search dialog. Ossie's server owns the
permission-filtered search data and result set. A static browser index is
allowed only for fully public Site Publications and must contain no private or
hidden content.

Concrete scenario:

A password-protected Site and a public Site belong to the same Project.
Fumadocs may build a Page Tree for either one only after Ossie resolves the
Publish Link and access session. It must never build one combined tree and hide
private nodes only in the browser.

Required proof before adoption:

1. Render a synthetic database-backed immutable Site Revision through a custom
   or dynamic source without making MDX files authoritative.
2. Prove public, password-protected, and private content is removed before Page
   Tree and search data reach the browser.
3. Prove Ossie controls exact URLs, redirects, missing pages, and Project
   Version switching.
4. Match Ossie's design without fragile CSS that depends on private Fumadocs
   markup.
5. Render safe custom blocks for Snippets, Guides, Demos, and one OpenAPI
   candidate.
6. Pass keyboard, screen-reader, narrow-mobile, reduced-motion, and 200% zoom
   checks.
7. Measure reader JavaScript, page speed, caching, and self-hosted operation.
8. Prove an upgrade can be reviewed and pinned without silently changing public
   behavior.
9. Keep editor code, private content, credentials, internal IDs, and unpublished
   content out of the public reader.
10. Keep one small Ossie adapter so Fumadocs can be replaced without changing
    stored content, Publications, URLs, or permission rules.

If this proof fails on security, exact URL control, accessibility, design,
performance, or self-hosting, fall back to Fumadocs Core plus Ossie-owned UI.
Build the complete reader ourselves only if both the selected UI and Core
helpers fail the proof.

Reversibility:

This is reversible because Fumadocs receives only temporary,
already-authorized reader data. Stored Pages, Navigation, Revisions,
Publications, URLs, access, and search authority remain independent. Replacing
the presentation layer would be work, but it would not require migrating
customer content or changing public product rules.

Affected scope:

- published reader and preview architecture
- page tree, table of contents, links, and search
- OpenAPI renderer choice
- application dependencies and bundle budgets
- design system and self-hosting

Primary sources:

- `https://www.fumadocs.dev/docs/headless/source-api/source`
- `https://www.fumadocs.dev/docs/headless/source-api`
- `https://www.fumadocs.dev/docs/headless/page-tree`
- `https://www.fumadocs.dev/docs/search`
- `https://www.fumadocs.dev/docs/guides/access-control`
- `https://www.fumadocs.dev/docs/guides/customize-ui`
- `https://www.fumadocs.dev/docs/manual-installation/react-router`
- `https://www.fumadocs.dev/docs/ui`
- `https://www.fumadocs.dev/docs/integrations/openapi`
- `https://github.com/fuma-nama/fumadocs`
- current npm registry metadata for the checked versions

Status:

Provisionally accepted after the user requested and reviewed a deeper
build-versus-adopt analysis. Ossie will use Fumadocs Core plus selected packaged
Fumadocs UI reader components after the required proof passes. Fumadocs remains
a replaceable presentation layer and does not own Ossie's Documentation data,
permissions, publishing, URLs, search authority, editor, or product identity.
This remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for the Fumadocs product boundary;
- the future reader child plan for the proof and fallback gates;
- a dependency ADR only after the proof passes;
- this grill record.

### Q11. How should unsafe authored content be handled?

Recommended answer:

Treat all text, imports, OpenAPI descriptions, links, media references, and
custom-block settings as untrusted input, including content written by an
Organization member.

Use a strict allowlist:

- safe Markdown for normal text;
- Ossie-defined typed blocks with validated fields;
- no MDX execution;
- no JavaScript expressions, imports, exports, or React component names;
- no raw HTML;
- no inline event handlers, scripts, styles, SVG markup, or arbitrary iframes.

This applies in the editor, preview, Revision, Publication, public reader,
search extraction, import, and export paths.

Why:

- MDX combines Markdown with JSX and JavaScript expressions;
- Fumadocs explicitly warns that its remote MDX compiler requires trusted
  content because code execution is enabled by default;
- Organization membership is permission to author content, not permission to
  run code in another reader's browser or on the Ossie server;
- a Publication must remain safe even if its original author later loses
  access.

Rendering boundary:

- Ossie parses the constrained content into safe nodes before Fumadocs renders
  it;
- do not send customer-authored content through `@fumadocs/mdx-remote`;
- render text and code as text, not as HTML;
- do not use `dangerouslySetInnerHTML` for Documentation content;
- if a future library produces unavoidable HTML, sanitize it with a maintained
  allowlist sanitizer and test the complete path, but this is a fallback rather
  than the V1 content model;
- security headers and browser Content Security Policy are extra protection,
  not permission to accept unsafe content.

Typed component boundary:

Authors may choose only components registered by Ossie, such as:

- callout;
- tabs;
- code sample;
- Reusable Documentation Snippet;
- exact Guide Publication;
- exact Interactive Demo Publication;
- approved OpenAPI operation.

Each component has an Ossie-owned type and field validator. Authors cannot enter
a package name, component name, JavaScript expression, CSS, or executable
component body. Unknown or retired component types fail safely with a clear
editor or reader state instead of executing or disappearing silently.

Link rules:

- allow relative Site links, fragment links, `https:`, and `http:`;
- allow `mailto:` and `tel:` only for ordinary links;
- reject control characters, misleadingly encoded protocols, credentials in
  URLs, protocol-relative URLs, and `javascript:`, `data:`, `vbscript:`,
  `file:`, `blob:`, and other unapproved schemes;
- links opened in a new tab use safe opener/referrer behavior and show that they
  are external;
- internal links are resolved against the exact Site Edition and checked again
  before a Revision or Publication is created.

Remote media:

Do not hotlink remote images, audio, video, scripts, styles, fonts, or frames in
the first slice. Remote media can change after Publication, track readers,
expose reader network information, disappear, or return unsafe content.

Authors instead upload a File or select an allowed Ossie Asset. A later
remote-import feature may download a copy through a separately designed,
size-limited and network-safe server process. It must never leave a live remote
media dependency inside an immutable Publication.

Embeds:

- no arbitrary iframe or pasted embed HTML;
- Guide and Interactive Demo embeds use exact, authorized Publications through
  Ossie-owned typed blocks;
- any future outside provider requires a separately accepted provider allowlist,
  privacy review, sandbox settings, and failure state.

Code samples:

- code samples are escaped display text and are never executed;
- copying is allowed;
- syntax highlighting must not execute customer code;
- secrets, cookies, credentials, or tokens must never be supplied by Ossie or
  taken from a reader session;
- any later OpenAPI “try it” request belongs to the separately controlled
  OpenAPI boundary in Question `24`, not to a generic code block.

Validation timing:

1. Validate and normalize at every create, edit, paste, and import command.
2. Show a precise authoring error for rejected content.
3. Validate the complete Working Draft again before creating a Site Revision.
4. Validate the immutable Revision again before Publication as protection
   against old or migrated data.
5. Keep the public renderer fail-closed if invalid content somehow reaches it.
6. Record rejected publish attempts through the accepted Audit boundary without
   storing the unsafe raw value in logs.

Concrete scenario:

An author imports:

```md
Click <Widget onLoad={() => sendCookies()} />
```

Ossie treats the angle-bracket content as unsupported input and blocks the
import or asks the author to keep it as a visible code sample. It never compiles
or runs the component. Fumadocs never receives executable MDX.

Alternative:

Allow trusted Organization members to write MDX and register their own React
components.

Why not:

- it turns content editing into code deployment;
- one compromised member account could attack every reader;
- server-side compilation could harm the Ossie host;
- it breaks portable export and makes old Publications depend on application
  code that may later change;
- “trusted author” does not make imported files or copied content safe.

Tradeoff:

The allowlist supports fewer one-off embeds and custom widgets than Mintlify or
a developer-controlled Git docs site. Ossie gains predictable security,
immutable Publications, portable content, and a consistent editor. A real new
component can be added deliberately to the Ossie registry later.

Reversibility:

Adding another reviewed typed component or URL scheme later is straightforward.
Safely removing arbitrary code execution after customers depend on it would be
difficult. Start closed and open only proven cases.

Affected scope:

- authoring schema and import/export
- Tiptap node registry
- server validation and publish checks
- Fumadocs adapter and public rendering
- links, media, embeds, OpenAPI, and search extraction
- Content Security Policy and security tests
- Audit redaction

Primary sources:

- `https://www.fumadocs.dev/docs/integrations/content/mdx-remote`
- `https://mdxjs.com/docs/what-is-mdx/`
- `https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html`
- `https://github.com/cure53/DOMPurify`

Status:

Provisionally accepted. Documentation accepts safe Markdown and Ossie-owned
typed blocks only. It does not execute customer-authored MDX, JavaScript, React
components, raw HTML, arbitrary iframes, or generic code samples. Links, media,
embeds, imports, Revisions, and Publications follow the allowlist, validation,
fail-closed, and Audit-redaction boundaries above. This remains subject to
recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for the safe authored-content boundary;
- the Documentation content and threat-model ADR;
- the future authoring, Revision, Publication, and reader child plans;
- this grill record.

### Q12. How should navigation, slugs, redirects, and broken links work?

Recommended answer:

Keep the **Navigation Tree** and Page addresses separate.

- The Navigation Tree controls where items appear in the sidebar.
- A Page's slug path controls its address.
- Moving a Page between Navigation Groups does not change its slug.
- Changing a Page title does not silently change its slug.

This lets a team reorganize its Documentation without breaking saved links.

Navigation model:

One Site Edition Working Draft owns one authoritative Navigation Tree. Fumadocs
receives a safe derived Page Tree but does not own or save navigation.

The first model supports three node types:

1. **Page Item** — points to one Page in the same Site Edition;
2. **Navigation Group** — a named container for child nodes;
3. **External Link Item** — a safe, validated ordinary link.

Use **Navigation Group** as the product term. A folder found during Markdown or
Git import becomes a Navigation Group; it does not become a storage folder or
change a Page's identity.

Rules:

- every node has a stable ID;
- every node belongs to exactly one Site Edition Working Draft;
- each node has at most one parent;
- positions are explicit within each parent;
- order is not inferred from title, slug, creation time, or alphabet;
- a Page may appear at most once in the primary Navigation Tree;
- a Group is not a Page and has no Page URL;
- a Group may point to a separate landing Page only through an explicit Page
  Item;
- Navigation cannot reference a Page from another Site Edition;
- reordering or moving nodes uses the Working Draft Row Version and one
  transaction.

Cycles:

Ossie rejects:

- a node as its own parent;
- moving a Group under one of its descendants;
- parent chains that leave the Site Edition;
- missing parents;
- duplicate Page Items;
- duplicate or invalid sibling positions.

The server checks this during every navigation command. Revision creation and
Publication validate the full tree again. The public reader fails closed if an
invalid tree somehow reaches it.

Page slug model:

- each non-home Page owns one lower-case, URL-safe slug path inside its Site
  Edition, such as `getting-started/install`;
- one Page is explicitly the Site Edition Home Page and resolves at the Site
  root;
- slug paths are unique without regard to letter case inside one Site Edition;
- repeated, leading, and trailing slashes are rejected;
- `.` and `..`, encoded slash tricks, control characters, empty segments, and
  reserved Ossie route words are rejected;
- Page titles may repeat because the slug path owns addressability;
- the same useful slug path may exist independently in another Site Edition.

Renaming:

Changing a title leaves the slug unchanged. Changing a slug is a separate,
deliberate action that warns the author and records the former slug as a
permanent **Page Alias** for that Page inside the Site Edition.

Canonical Page slugs and Page Aliases share one case-insensitive namespace.
Former slugs cannot be deleted, reassigned, or reused. Multiple renames keep all
former aliases and resolve them to the current canonical slug. This follows the
accepted permanent Project Version Alias rule.

Because Working Drafts may change while Publications stay immutable:

- a slug change affects only the Working Draft;
- the next Site Revision freezes the current canonical slugs and aliases;
- the next Site Publication exposes that frozen set;
- an older Site Publication keeps its older canonical paths and alias behavior;
- Carry-Forward copies the accepted paths and aliases into the new Site Edition,
  after which they evolve independently.

Redirect model:

Use two kinds of internal redirect:

1. a system-created permanent Page Alias after a slug change;
2. an explicit **Redirect Rule** from a retired local path to a target Page in
   the same Site Edition.

V1 Redirect Rules cannot point to arbitrary outside websites. That prevents
Ossie public URLs from becoming misleading outside redirects.

Redirect sources share the canonical Page slug and Page Alias namespace.
Publication is blocked for duplicate sources, missing targets, self-redirects,
redirect chains, or redirect cycles. Ossie resolves every accepted redirect
directly to its final canonical Page when the Revision is created.

Broken links:

Drafts may temporarily contain broken links while authors work. The editor
shows them clearly but does not prevent saving.

A Site Revision may be created for review with a recorded broken-link warning.
A Site Publication is blocked when it contains:

- a link to a missing internal Page;
- a link to a missing heading on an included Page;
- an invalid Page Alias or Redirect Rule;
- a Navigation Item whose Page is missing;
- a Guide, Demo, Snippet, Asset, or OpenAPI block whose exact required target is
  missing or unauthorized;
- a disallowed URL from Question `11`.

Outside links are checked for safe syntax but are not contacted during
Publication. A temporary outside-site outage must not block publishing, and the
Ossie server must not fetch arbitrary author-supplied URLs merely to test them.

Unlisted Pages:

A Page may remain outside the Navigation Tree while being drafted. It can be
previewed by an authorized author. Before Publication, every included Page must
either:

- appear exactly once in Navigation; or
- be deliberately marked **Unlisted**.

An Unlisted Page remains directly linkable and searchable within the same
Publication access boundary. The status is explicit so forgotten orphan Pages
do not publish silently.

Concrete scenario:

The Page `setup/install` appears under the “Getting started” Group. An author
moves it under “Administration.” Its address stays `setup/install`.

Later, the author deliberately changes its slug to `admin/installation`. Ossie
records `setup/install` as a permanent Page Alias. The next Publication sends
old links to the new canonical Page, while the previous Publication remains
unchanged.

Alternative:

Derive Page paths directly from Navigation Groups and titles.

Why not:

- moving or renaming a Group would break many links at once;
- translated or edited titles would change addresses;
- Navigation would accidentally become Page identity;
- imports and carry-forward would be harder to compare;
- readers' bookmarks and outside links would be fragile.

Tradeoff:

Authors must deliberately edit a slug when they want an address change, and
permanent aliases use a little more storage. In return, Documentation can be
reorganized safely and old links remain dependable.

Reversibility:

More Navigation node types or outside redirect providers can be added later.
Recovering broken addresses after title-based or folder-based automatic URL
changes would be much harder, so stable independent slugs should be accepted
from the start.

Affected scope:

- Navigation and Page persistence
- Working Draft Row Version commands
- Page and Navigation editor
- Revision and Publication validation
- Fumadocs Page Tree adapter
- internal links, aliases, redirects, preview, and public reader
- Carry-Forward and import/export
- Audit records

Local evidence:

- `CONTEXT.md` permanent Project Version Alias rules;
- `docs/adr/0021-project-versions-are-release-contexts.md`;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/116-project-version-foundation.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`.

Status:

Provisionally accepted. Navigation order and Page addresses are independent.
The authoritative Site Edition Navigation Tree uses stable nodes, explicit
order, cycle protection, deliberate Unlisted Pages, and derived Fumadocs Page
Trees. Page slug changes are explicit and preserve permanent Page Aliases.
Internal Redirect Rules are same-Edition and resolve directly without chains or
cycles. Drafts may contain visible broken-link warnings, but Publication blocks
invalid internal links and required references. This remains subject to recheck
and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Navigation Group, Page Alias, Redirect Rule, and stable Page
  address terms;
- the Documentation domain ADR;
- the future navigation, Revision, Publication, reader, and Carry-Forward child
  plans;
- this grill record.

### Q13. How should Documentation Carry-Forward work?

Recommended answer:

Carry Forward one or more complete **Documentation Site Editions** from one
source Project Version to one target Project Version. Do not carry individual
Pages, Navigation Groups, or Snippets separately in V1.

The user selects Documentation Sites. For every selected Site, Ossie creates the
missing target Site Edition as a complete independent Working Draft.

Why the whole Site Edition is the unit:

- Pages depend on Navigation, Snippets, links, aliases, redirects, Assets, and
  typed blocks;
- selecting only a few Pages could silently omit required content;
- partial copies would make source history unclear;
- teams normally need the previous release's complete Documentation as the
  starting point and then edit only what changed;
- this matches the accepted Guide and Demo rule that Carry-Forward creates a
  complete independent target Edition.

Source and target:

- one Carry-Forward operation has exactly one source Project Version and one
  target Project Version;
- both Project Versions belong to the same Project and Organization;
- the source may be active or archived;
- the target must be active and writable;
- the actor must have the accepted Carry-Forward permission;
- the source and target cannot be the same Project Version;
- Carry-Forward is never started automatically when a Project Version is
  created, renamed, reordered, or made Default.

What happens first:

For each selected Site Edition, Ossie creates or reuses an identical immutable
Site Revision from its current Working Draft. Carry-Forward copies from that
exact Revision, never from rows that may change during the operation.

What is copied:

- Site Edition title, description, and editable reader settings;
- the explicit Home Page;
- all Pages and their constrained content;
- all Reusable Documentation Snippets, including valid draft snippets not
  currently shown in Navigation;
- the complete Navigation Tree and explicit order;
- Page slugs, Page Aliases, Unlisted status, and Redirect Rules;
- safe internal Page and heading links;
- typed block settings;
- OpenAPI source records and their accepted immutable File references;
- exact Guide and Interactive Demo Publication references;
- allowed protected Asset and File references.

What receives new identity:

- the target Site Edition;
- its Working Draft;
- every Page;
- every Snippet;
- every Navigation node;
- every Redirect Rule and edition-owned OpenAPI source row;
- Row Versions, creation times, update times, and actor attribution.

All copied relationships are remapped to the new target rows. A copied Page
reference points to the new target Page, and a copied Snippet use points to the
new target Snippet. No mutable child row remains connected to the source
Working Draft.

What may be reused:

Immutable protected Assets and Files may keep the same underlying Asset or File
identity when the accepted protection rules allow it. The bytes are not copied
merely to create another Edition. Both Editions protect the shared reference
until neither needs it.

What is not copied:

- Site Revisions or Site Publications;
- Publish Links, passwords, preview tokens, access sessions, or rollout state;
- custom-domain ownership or verification;
- search indexes, caches, publication builds, or analytics;
- comments, approvals, feedback, or review state;
- credentials, secrets, OpenAPI authorization values, cookies, or tokens;
- Row Versions, audit timestamps, or author IDs from the source rows;
- a live connection that synchronizes later edits.

Reference behavior:

Carry-Forward preserves exact Guide, Demo, Asset, File, and OpenAPI source
references. It does not guess that a different target-Project-Version item is
equivalent.

The target editor clearly marks a valid reference that still points to content
from the source Project Version. The author may deliberately replace it with an
exact target-version Publication. Carry-Forward never silently retargets an
embed by matching a title or slug.

Independence:

After success:

- changing a source Page does not change the target Page;
- changing a target Snippet does not change the source Snippet;
- reordering one Navigation Tree does not reorder the other;
- a new source Revision or Publication does not update the target;
- source Page slug changes do not alter the target's copied slug or aliases.

The target Site Edition records one immediate source Site Edition and the exact
source Site Revision. Child Pages and Snippets do not become independently
versioned artifacts and do not receive separate Carry-Forward histories.

Existing targets:

If the selected Documentation Site already has a Site Edition in the target
Project Version, Carry-Forward does not overwrite, merge, or patch it. It
returns a conflict before creating anything.

V1 has no “copy these Pages into my existing target Site” action. A later
explicit Page import may be designed with preview, conflict handling, link
repair, and provenance, but it is not Carry-Forward.

Atomicity and retries:

- the request is idempotent, so retrying the same completed request does not
  create duplicates;
- all selected Sites and other accepted selected Artifacts succeed in one
  transaction or none are created;
- Ossie validates permissions, Project lifecycle, source Revisions, target
  absence, internal relationships, and protected Files before copying;
- a concurrent edit, Carry-Forward, or target creation returns a clear conflict
  rather than a partial copy.

Target state:

The new Site Edition begins as an independent draft. Carry-Forward does not
create a target Revision or Publication. The author reviews the copied Site,
updates release-specific content, fixes any warnings, and then checkpoints or
publishes normally.

Concrete scenario:

Project Version `1.0` has a Site containing 20 Pages, 4 Snippets, Navigation,
and a Guide Publication embed. The team creates Project Version `2.0`.

One Carry-Forward action creates the full `2.0` Site Edition. The team changes
the three Pages affected by the release and edits one shared Snippet once. The
other Pages need no manual copying. Later edits to the `1.0` Site do not alter
`2.0`.

Alternative:

Let users select individual Pages and Snippets during Carry-Forward.

Why not:

- selected Pages may rely on omitted Snippets or Navigation;
- links and Redirect Rules may point to missing Pages;
- the target could become a confusing mixture of multiple source states;
- failure handling and history would become much harder;
- users would spend time deciding which of many dependent pieces to copy.

Tradeoff:

Copying the complete relational Site creates more rows than copying a few
Pages. The content rows are comparatively small, immutable File bytes are
reused, and the result is complete and understandable.

Reversibility:

A separate reviewed Page-import feature can be added later. Repairing partial,
mixed-source Carry-Forward history after it has been allowed would be much
harder.

Affected scope:

- Carry-Forward operation and selection UI
- Site Edition and Revision lineage
- relational copy and ID remapping
- Navigation, Page, Snippet, links, OpenAPI, and typed blocks
- protected Asset and File references
- Audit, idempotency, locking, and conflict behavior
- future Project Version comparison and reader switching

Local evidence:

- `CONTEXT.md` accepted Carry-Forward definition;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`;
- `docs/grill/2026-07-10-project-version-and-artifact-edition-grill.md`.

Status:

Provisionally accepted. Carry-Forward selects complete Documentation Sites and
copies each exact source Site Revision into one independent target Site Edition
Working Draft. It does not carry individual Pages, Navigation nodes, or
Snippets separately, overwrite or merge an existing target Edition, copy
Publication/access state, retarget exact references silently, or synchronize
later edits. The existing one-source, one-target, atomic, idempotent, lineage,
authorization, and protected-File rules apply. This remains subject to recheck
and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation Carry-Forward and Site Edition lineage;
- the Documentation domain and Carry-Forward ADR updates;
- the future Site Revision and Carry-Forward child plans;
- this grill record.

### Q14. What creates a Site Revision, and how do preview, review, and
Publication snapshots work?

Recommended answer:

Use the same three Revision triggers already accepted for Guides and
Interactive Demos:

1. **Manual Checkpoint**;
2. **Publication**;
3. **Carry-Forward**.

Normal typing, autosave, Page creation, Navigation changes, imports, and preview
do not create Site Revisions.

Revision meaning:

A **Site Revision** is one immutable relational checkpoint of the complete Site
Edition at one moment. It freezes:

- Site Edition title, description, and included reader settings;
- Home Page, all included Pages, Unlisted state, and safe content;
- Reusable Documentation Snippets and exact Page uses;
- Navigation Tree and order;
- Page slugs, Page Aliases, and Redirect Rules;
- internal link and heading targets;
- OpenAPI sources and exact immutable File references;
- exact Guide and Interactive Demo Publication references;
- required protected Asset and File references.

It excludes mutable Row Versions, cache entries, search indexes, build output,
viewer sessions, raw credentials, provider storage details, and routine
actor/timestamp fields from content equality.

Numbering and reuse:

- Revision Number starts at `1` inside each Site Edition;
- it increases only inside that Edition and is unrelated to Project Version,
  Row Version, and Publication Sequence;
- Revision Numbers are never reused;
- if the complete Working Draft is identical to the latest Site Revision,
  checkpoint, Carry-Forward, or Publication reuses that Revision;
- a no-change manual checkpoint creates no misleading Revision or Audit event;
- Revision identity is server-created and cannot be supplied by the author.

Manual Checkpoint:

An Editor may deliberately create a named checkpoint with an optional short
reason such as “ready for review.” The command requires the current Site Edition
and Working Draft Row Versions. It validates the whole Site and records warnings
such as draft broken links, but warnings allowed by Question `12` do not prevent
the checkpoint.

The checkpoint is immutable. Renaming its optional display note later is not
allowed; a correction creates a new checkpoint from the edited Working Draft.

Draft preview:

- renders the current mutable Working Draft;
- is available only through normal authenticated Project access;
- changes as autosave succeeds;
- clearly says **Draft preview**;
- is not a Site Revision and has no Revision Number;
- cannot be used by a public Publish Link;
- does not promise a stable review target.

Draft preview may use the same safe reader components as Publication, but its
data comes through the authenticated draft boundary and never through public
reader caching.

Revision preview and simple review:

- renders one exact immutable Site Revision;
- uses a stable authenticated portal URL;
- shows Site, Project Version, Revision Number, creator, trigger, and time;
- remains unchanged while the Working Draft continues;
- is readable by authorized Project members under existing roles;
- uses protected authorized Asset routes;
- never falls forward to the latest draft or another Revision.

For the first release, “review” means sharing this exact Revision preview and
then editing the Working Draft based on feedback outside a formal approval
system. A formal review request, comments, required approvers, and approval
state are decided in Question `23`; they must not be invented implicitly here.

Any later outside-review token must point to one exact Site Revision and receive
its own expiry, revocation, and access decision under Question `16`. It can
never expose a live Working Draft.

Carry-Forward:

Carry-Forward creates or reuses the exact source Site Revision first, then copies
from that immutable graph as accepted in Question `13`. It does not create a
target Site Revision. The target begins as an independent Working Draft.

Publication:

Publishing requires the current Site Edition and Working Draft Row Versions.
Inside one transaction Ossie:

1. validates the complete Working Draft with stricter Publication rules;
2. creates or reuses the identical latest Site Revision with trigger
   `publication`;
3. creates a new immutable **Site Publication** pointing to that exact Site
   Revision;
4. optionally updates only the explicitly selected Publish Links;
5. commits all actions or none.

Every successful publish creates a new Edition-scoped Publication Sequence even
when it reuses an unchanged Site Revision. This truthfully records a new publish
action and rollout decision. It does not duplicate the relational Site content.

Publishing does not silently create a public link or update every existing
link. Link rollout remains explicit, matching the accepted Publication model.

Published rendering:

- reads the exact Site Revision referenced by the Site Publication;
- never reads the Working Draft;
- does not treat a generated HTML bundle, Fumadocs Page Tree, search index, or
  cache as the authoritative snapshot;
- may rebuild disposable reader output from the same immutable Revision;
- stays unchanged when the Working Draft, a later Revision, or Fumadocs changes;
- fails closed if required immutable content or protected Files cannot be
  resolved.

Restore:

Restoring a Site Revision replaces the mutable Site Edition metadata and full
Working Draft graph with new mutable rows copied from that Revision. It never
changes the old Revision or any Publication.

Restore itself does not create another Revision immediately. A later manual
checkpoint or Publication records the restored state as a new Revision when it
differs from the latest Revision.

Concrete scenario:

1. An author edits 20 Pages and autosave runs many times. No Revision is created.
2. The author chooses “Create checkpoint” and gets Revision `4`.
3. A teammate opens Revision `4` for review while the author continues editing
   the draft. The teammate still sees exactly Revision `4`.
4. The author fixes two Pages and publishes.
5. Ossie creates Revision `5` and Site Publication `3`.
6. Later draft edits do not change Publication `3`.

Alternative:

Create a Site Revision on every autosave or Page save.

Why not:

- normal typing would produce noisy, meaningless history;
- a multi-Page Site would create Revisions at accidental partial states;
- Revision Numbers would grow rapidly without representing deliberate
  checkpoints;
- review and Publication history would become difficult to understand;
- Row Version already protects concurrent draft writes.

Tradeoff:

Autosave history is not a permanent user-visible Revision history. It protects
current work through the concurrency and recovery decision in Question `15`,
while deliberate Site Revisions remain understandable and durable.

Reversibility:

More deliberate Revision triggers, such as a future formal review request, can
be added later. Removing millions of autosave-generated Revisions or explaining
which ones were meaningful would be much harder.

Affected scope:

- Site Revision relational persistence and equality
- checkpoint, history, immutable preview, and restore
- Carry-Forward source creation
- Publication transaction and sequence
- protected Assets and Files
- Audit and Access Evidence
- Fumadocs adapter, cache, and reader boundaries
- future review and preview-token work

Local evidence:

- `CONTEXT.md` Working Draft, Artifact Revision, Published Artifact, and
  Carry-Forward definitions;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`.

Status:

Provisionally accepted. Manual Checkpoint, Publication, and Carry-Forward are
the only Site Revision triggers. Autosave and preview do not create Revisions.
Draft preview follows the mutable authenticated Working Draft; Revision preview
follows one exact immutable Revision; Publication follows one exact Site
Revision and never the draft. Publishing creates a new Publication Sequence
even when it reuses an unchanged latest Revision. Formal review workflow remains
open for Question `23`. This remains subject to recheck and final acceptance
after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Site Revision, Revision trigger, Draft Preview, and Site
  Publication terms;
- the Documentation domain and Revision/Publication ADRs;
- the future Site Revision, preview, restore, Carry-Forward, and Publication
  child plans;
- this grill record.

### Q15. How should autosave, concurrent editing, conflicts, and unsaved
recovery work before real-time collaboration?

Recommended answer:

Use small-resource autosave with optimistic Row Versions. Do not add real-time
collaboration, presence, live cursors, automatic merging, or exclusive editing
locks in the first release.

Concurrency boundary:

- each Page has its own Row Version;
- each Reusable Documentation Snippet has its own Row Version;
- Site metadata and reader settings use the Site Edition or Working Draft Row
  Version accepted for that command;
- the Navigation Tree has one Navigation Row Version because moving one node can
  affect several sibling positions;
- Redirect Rules and OpenAPI source settings use their own Row Versions where
  they are independently edited;
- every successful child change also advances one server-owned Working Draft
  change number used to protect whole-Site checkpoint, restore, Carry-Forward,
  and Publication.

A Page save compares the expected Page Row Version, not the Row Version of every
other Page. Therefore:

- two people editing different Pages can save successfully;
- two people editing the same Page receive a conflict;
- editing a Page does not block a separate Snippet edit;
- two competing Navigation changes conflict because they affect one ordered
  tree;
- the same user editing in two browser tabs follows the same rules as two
  different users.

The Working Draft change number is not a reason to reject unrelated Page
autosaves. It protects commands that must see the entire Site as one consistent
state.

Autosave behavior:

1. The editor marks the current resource **Unsaved** immediately after a local
   change.
2. After a short idle delay, it sends one normalized save with the expected Row
   Version.
3. Only one save for that resource is in flight at once.
4. New keystrokes during a save remain locally dirty and are sent in the next
   save; an older response can never erase newer local text.
5. Successful saves update the Row Version and show **Saved**.
6. Blur, Page change, preview, checkpoint, and publish attempt to flush pending
   changes first.
7. The interface never says **Saved** until the server confirms the write.

Autosave is per resource, not one full-Site payload. Moving between Pages does
not repeatedly send all 20 Pages.

Save states:

The author can always see one truthful state:

- **Saved**
- **Unsaved**
- **Saving**
- **Offline — changes kept in this tab**
- **Save failed — retry**
- **Conflict — review both copies**
- **Read-only — changes cannot be submitted**

Do not communicate these states through color alone.

Conflict response:

When the expected Row Version is stale, the server returns a conflict with:

- the latest safe server copy;
- its current Row Version;
- the identity and time of the latest committed change when the actor may see
  that information;
- no hidden tenant, credential, or raw Audit data.

Ossie never silently applies last-write-wins.

Conflict recovery:

The editor preserves the author's complete local copy and offers:

1. **Review differences** — show “Your changes” beside “Latest saved”;
2. **Merge into latest** — start from the latest server copy and let the author
   deliberately bring across wanted changes;
3. **Use latest saved** — discard the local copy only after confirmation;
4. **Copy or download my changes** — provide a safe escape before discarding.

Saving the merged result uses the newest server Row Version. “Use my copy”
cannot bypass the version check; if it is offered as an explicit replacement,
it is a confirmed audited write against the latest Row Version and may conflict
again.

Do not attempt automatic text or tree merging in V1. Safe automatic merging of
rich Page structures, links, typed blocks, and Snippets requires separate proof.

Unsaved recovery:

- keep the current unsaved resource in memory;
- keep a size-limited recovery copy in browser session storage so an accidental
  refresh in the same tab can recover it;
- scope the recovery key to the signed-in user, Organization, Project, Site
  Edition, and resource;
- never place credentials, cookies, access tokens, or raw private URLs in the
  recovery record;
- remove the recovery copy after the exact content saves successfully;
- clear all Documentation recovery data on logout or account/Organization
  change;
- show the user before restoring a recovery copy over a newer server copy;
- do not claim persistent offline authoring across browser restarts in V1.

Before closing, refreshing, signing out, or leaving with an Unsaved, Offline,
failed, or conflicting resource, Ossie gives the strongest browser-supported
warning and an in-product choice to stay, retry, copy changes, or deliberately
discard. Browser shutdown can never be guaranteed, so the interface must not
promise that every unsaved keystroke survives a crash.

Network loss:

The author may continue working on the currently open resource while the
connection is temporarily unavailable. The editor clearly says the changes are
local to this tab and retries when the connection returns.

V1 does not provide a full offline Site:

- do not navigate through uncached Pages as though they are available offline;
- do not checkpoint, restore, Carry Forward, or publish offline;
- do not queue permission or Navigation operations indefinitely;
- reconnect and recheck Row Version, permission, Project lifecycle, and target
  existence before saving.

Permission or lifecycle changes:

If access is removed, the Project or Project Version is archived, or the
resource becomes read-only while an author is editing:

- the server rejects the save;
- Ossie does not overwrite or reveal the new server state;
- the editor keeps the local recovery copy long enough to let the author copy or
  download their own text;
- the UI becomes read-only and explains that the changes were not saved;
- retry never bypasses current authorization.

Whole-Site commands:

Checkpoint, restore, Carry-Forward, and Publication require the exact current
Site Edition and Working Draft change numbers shown to the user. Inside one
transaction the server locks or verifies the complete required graph.

If any Page, Snippet, Navigation, Redirect Rule, OpenAPI source, or Site setting
changed after the command began, the whole-Site command stops with a conflict
and asks the user to review the latest Site. It never creates a Revision from a
mixture of before-and-after states.

Audit:

- every committed autosave batch records the accepted Audit Evidence;
- rapid saves may be visually grouped in Activity, but the underlying committed
  changes remain attributable;
- failed, offline, and unsubmitted local edits are not recorded as successful
  server mutations;
- conflict errors and recovery storage never copy unsafe raw content into logs.

Concrete scenario:

Amara edits Page A while Lee edits Page B. Both saves succeed because the Pages
have separate Row Versions.

Amara also has Page A open in another tab. The first tab saves Row Version `8`.
The second tab tries to save using Row Version `7`. Ossie keeps the second tab's
text, returns the latest saved Page, and asks Amara to review both copies. It
does not silently replace either one.

Alternative:

Use one Row Version and one lock for the entire Documentation Site.

Why not:

- unrelated edits on different Pages would repeatedly conflict;
- a large Site would feel single-user even without real-time collaboration;
- one slow or abandoned editor could block a whole team;
- autosave would send or coordinate much more content than necessary.

Alternative:

Allow last-write-wins autosave.

Why not:

- a successful save could silently erase another person's work;
- users would see **Saved** even though their teammate's content was lost;
- Audit history would record the overwrite but would not prevent the harm.

Tradeoff:

Authors editing the same Page must resolve a visible conflict manually until
real-time collaboration exists. In return, there is no hidden data loss and
people can safely work on different Pages at the same time.

Reversibility:

Presence, live cursors, structured merging, or a collaboration engine can be
added later behind the same Page and Snippet boundaries. Recovering silently
overwritten work after last-write-wins would not be reversible.

Affected scope:

- Page, Snippet, Navigation, Redirect Rule, OpenAPI, and Site Row Versions
- Working Draft aggregate change number
- Tiptap autosave adapter and status UI
- route-leave, refresh, logout, offline, and recovery behavior
- conflict API and comparison UI
- checkpoint, restore, Carry-Forward, and Publication transactions
- authorization, lifecycle, Audit, and Activity
- browser storage privacy and size limits

Local evidence:

- `CONTEXT.md` Row Version, Working Draft, Revision, and Audit terms;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/118-guide-demo-edition-working-draft-relational-foundation.md`;
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`;
- repository `AGENTS.md` tenant, authorization, and immutable-Publication
  invariants.

Status:

Provisionally accepted. Documentation uses resource-level optimistic Row
Versions, truthful autosave states, conflict-preserving recovery, same-tab
size-limited session recovery, and a whole-Working-Draft change number for
atomic checkpoint, restore, Carry-Forward, and Publication. Different Pages or
Snippets may save concurrently; same-resource and Navigation conflicts require
deliberate recovery. V1 has no silent last-write-wins, automatic rich-content
merge, exclusive lock, persistent offline Site, or real-time collaboration.
This remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation autosave and conflict boundaries;
- the Documentation concurrency ADR;
- the future authoring, conflict recovery, checkpoint, and Publication child
  plans;
- this grill record.

### Q16. Which Documentation access modes should exist?

Recommended answer:

Reuse Ossie's two existing access boundaries:

1. **Project Membership** for private authoring, preview, Revision, and
   Publication management;
2. **Publish Link policy** for outside readers.

Do not add Site-specific member lists, per-Page permissions, Organization-wide
implicit access, selected groups, or preview tokens in the first release.

Where access belongs:

- a Documentation Site, Site Edition, Page, Snippet, and Site Revision do not
  own an independent audience list;
- Project Version access continues to inherit Project Membership;
- outside-reader access belongs to each Publish Link, not to the Site Edition or
  Site Publication;
- one Site Publication may therefore be included in several Publish Links with
  different link-wide access settings;
- changing one link's access does not change another link or the immutable
  Publication.

Internal Project access:

**Project Viewer**

- may discover and read Documentation Sites in Projects where they have active
  Project Membership;
- may read the current Working Draft, Draft Preview, Site Revision history,
  immutable Revision previews, Site Publication history, and safe Publish Link
  summaries;
- cannot edit, checkpoint, restore, Carry Forward, publish, or manage links.

**Project Editor**

- has Viewer read access;
- may create and edit Sites, Pages, Snippets, Navigation, Redirect Rules, and
  OpenAPI sources;
- may checkpoint, restore, Carry Forward, publish, and manage Publish Links
  when lifecycle rules permit.

**Project Admin**

- has all Editor capabilities;
- continues to manage Project Membership, Project Versions, Project settings,
  and protected-Asset purge under the accepted Project rules.

**Organization Owner**

- retains implicit Project Admin capability across the Organization without
  duplicate Project Membership rows.

An Organization Member without Project Membership cannot discover or read the
Site. Documentation does not weaken the accepted hidden `404` boundary.

Publish Link access modes:

Keep the accepted link-wide states:

1. **Public** — anyone who can reach the URL may read the selected Site
   Publications;
2. **Public with password** — the reader must establish the accepted
   password-authorized viewer session;
3. **Restricted** — anonymous public resolution is denied; a password does not
   override this;
4. **Expired** — access stops after the accepted expiry;
5. **Revoked** — access is permanently stopped and existing viewer sessions are
   revoked.

Password, expiry, and status are settings on the whole Publish Link. They apply
to every Project Version entry in that link and to reader, search, and protected
File requests.

There is no separate “anyone with the secret link” security mode. An opaque
Publish Link slug is an address, not proof of permission. A public link without
a password must be treated as public even if it is difficult to guess.

Link behavior:

- only Editors, Admins, and implicit Owners may create or manage links;
- Project Viewers may inspect safe link state but not secret password values or
  public session data;
- Publish Link creation and rollout remain explicit during Publication;
- changing visibility, expiry, or password revokes existing viewer sessions;
- a revoked link cannot be restored or reused;
- a password never grants access to a Restricted, Expired, or Revoked link;
- reader and embed routes use the same policy;
- protected Files use the same exact link, version-entry, Publication, and
  viewer-session decision as the Page;
- public responses never reveal internal link names, actor identity, hidden
  Project Versions, private URLs, credentials, or other Publications.

Keep the accepted non-revealing outcomes:

- unknown, revoked, or hidden resource: `404`;
- Restricted anonymous access: `403`;
- password required: `401`;
- wrong password: safe retryable validation response;
- expired link: `410`.

Search:

- authenticated search checks current Project Membership and Project role
  before returning Documentation results;
- a fully public, non-password Site Publication may have a public static search
  index containing only its allowed published content;
- password-protected results are returned only after the viewer session is
  accepted and are not placed in a public shared browser index;
- Restricted, Expired, Revoked, draft, Revision-preview, and unauthorized
  content never appears in public search;
- Fumadocs may show the search interface but never decides authorization.

Deferred access modes:

**Organization-only**

Deferred. Project Membership is the accepted narrower boundary. Granting every
Organization Member access would weaken Project isolation and create a second
overlapping permission model.

**Selected groups or teams**

Deferred until Ossie has an accepted Group/Team domain, membership lifecycle,
Audit behavior, and removal rules. Do not store an informal list of user IDs or
group names inside Site settings.

**Selected individuals outside Project Membership**

Deferred for the same reason. Add Project Membership for an internal teammate
in V1.

**External Revision preview token**

Deferred until Question `23` accepts a formal outside-review need. If later
added, it must point to one exact immutable Site Revision, expire, revoke, use a
hashed token, have no draft access, and receive complete Access Evidence. It
must not be a weaker hidden Publish Link.

**Per-Site or per-Page access**

Rejected for V1. It would make Navigation, links, search, Snippets, Revision
atomicity, Publication, and reader caching much harder to reason about.
Different audiences should use separate Publish Links or, when the content
itself differs, separate Documentation Sites.

Concrete scenarios:

**Internal**

Lee is an Organization Member but has no Membership in Project A. Lee cannot
find its Documentation. After a Project Admin adds Lee as Project Viewer, Lee
can read the Working Draft and Revision history but cannot edit or publish.

**Outside**

One Site Publication is placed in:

- a public link for customers; and
- a password-protected link for a launch partner.

Both links point to the same immutable content but keep independent access,
expiry, version selection, and revocation state.

Alternative:

Give every Documentation Site its own members, groups, and Page-level rules.

Why not:

- it duplicates Project Membership;
- one Page could appear in Navigation or search while its Snippet or Asset is
  hidden;
- whole-Site Revision and Publication would no longer have one understandable
  access boundary;
- permissions would be difficult to inspect, audit, cache, and explain;
- it is unnecessary for the first release.

Tradeoff:

Teams needing a special internal audience must use Project Membership or a
separate Project/Site rather than a quick Site-level allowlist. In return,
private content remains predictable and the existing authorization model stays
consistent.

Reversibility:

An accepted Organization audience, Team domain, or exact Revision preview token
can be added later with relational grants. Removing scattered per-Page or
informal JSON permissions after adoption would be much harder.

Affected scope:

- Project authorization and role capability map
- Site, Working Draft, Revision, and Publication reads
- Publish Link management and viewer sessions
- public reader, embed, search, and protected Files
- Audit and Access Evidence
- caching and public indexes
- future Group/Team and review-token work

Local evidence:

- `CONTEXT.md` Project Membership and Project role definitions;
- `docs/adr/0024-project-membership-governs-project-access.md`;
- `docs/plan/114-access-evidence-and-compliance-timelines.md`;
- `docs/plan/115-project-membership-foundation.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`.

Status:

Provisionally accepted. Private Documentation access inherits Project
Membership and existing Admin/Editor/Viewer capabilities. Outside reader access
belongs only to independent Publish Links using the accepted
public/password/restricted/expiry/revocation and viewer-session rules. An opaque
URL is not authorization. V1 adds no Organization-wide, Group/Team, individual,
per-Site, per-Page, or external Revision-token access model. Search, embeds, and
protected Files enforce the same boundary as their reader. This remains subject
to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation access ownership;
- the Documentation authorization and threat-model ADRs;
- the future internal reads, Publication, Publish Link, public reader, search,
  and protected-File child plans;
- this grill record.

### Q17. How should stable, Project Version, Revision, and Publication URLs
work?

Recommended answer:

Use separate URL families for:

1. the authenticated mutable Working Draft;
2. one immutable Site Revision;
3. one immutable Site Publication;
4. a stable public Publish Link;
5. an exact Project Version entry inside that Publish Link.

Never use a `/latest` route. “Latest” is ambiguous after rollback, staged
rollout, or an explicit decision to keep an older Project Version as default.

Authenticated portal URLs:

Use the current canonical Project Version context:

```text
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId
```

This route identifies the one Site Edition for that stable Documentation Site
and Project Version.

Recommended child routes:

```text
# Site overview and Working Draft
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId

# Page editor; stable Page ID avoids breaking the editor route after a slug edit
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/pages/:pageId

# Mutable authenticated draft preview
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/preview
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/preview/pages/:pagePath

# Exact immutable Site Revision
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/revisions/:revisionNumber
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/revisions/:revisionNumber/preview/pages/:pagePath

# Exact immutable Site Publication
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/publications/:publicationSequence
/projects/:projectId/versions/:projectVersionSlug/documentation/:siteId/publications/:publicationSequence/preview/pages/:pagePath
```

The Site ID and Page ID are immutable internal identities. Revision Number and
Publication Sequence are scoped to the resolved Site Edition. Routes never
accept a bare number without Site and Project Version context.

There is no separate canonical raw Site Edition ID route in the portal. The
Site plus explicit Project Version determines the Edition, while APIs and
persistence may continue to use exact IDs internally.

Portal canonicalization:

- `/projects/:projectId` keeps its accepted redirect to the Project's current
  Default Project Version;
- once inside Documentation, every canonical portal route contains an explicit
  Project Version slug;
- a permanent Project Version Alias replaces only that URL segment with the
  current canonical slug;
- alias and case-only canonicalization preserve the remaining safe path, query,
  and fragment;
- changing the Project Default never moves an already explicit Documentation
  URL;
- archived Project Versions remain directly addressable and read-only under
  their canonical or permanent alias paths.

Public Publish Link URLs:

Reserve this Ossie-hosted family for Documentation:

```text
# Stable link default: Home Page
/docs/:publishLinkSlug

# Stable link default: one Page
/docs/:publishLinkSlug/:pagePath

# Exact included Project Version: Home Page
/docs/:publishLinkSlug/versions/:projectVersionSlug

# Exact included Project Version: one Page
/docs/:publishLinkSlug/versions/:projectVersionSlug/:pagePath
```

`versions` and other required system words are reserved from the first Page
slug segment so routing is never ambiguous.

The Publish Link slug is globally unique, immutable, opaque, and never reused.
Page paths remain readable and come from the exact frozen Site Publication.

Stable link meaning:

`/docs/:publishLinkSlug` does not mean the newest Site Publication or the
Project's Default Project Version. It means:

> Render the exact Site Publication selected by this Publish Link's explicit
> default entry.

Changing the Project Default, creating a newer Project Version, creating a Site
Revision, or publishing does not silently move that URL. Only an explicit
Publish Link manifest change, rollout, or rollback changes what the stable link
shows.

The browser may remain on the stable base URL while showing its current default
entry. Selecting a named Project Version moves to the directly shareable exact
Project Version URL.

Project Version path behavior:

- the exact path resolves only a Project Version entry included in that Publish
  Link;
- a permanent Project Version Alias canonicalizes only when its Edition is
  included in the link;
- the response exposes only safe included Project Version labels and paths;
- a missing, excluded, removed, cross-Site, or unauthorized Project Version
  returns the accepted non-revealing state;
- changing Publish Link order or default does not change exact Project Version
  URLs.

Page path and alias behavior:

- canonical Page paths and permanent Page Aliases come from the exact Site
  Revision behind the selected Site Publication;
- an alias redirects to the canonical Page path inside the same selected
  Publication;
- explicit Redirect Rules resolve inside that same Publication;
- canonicalization never consults the current Working Draft or a newer
  Publication;
- path redirects preserve safe query and fragment values;
- redirect targets are generated from trusted stored identities, never from a
  user-provided outside redirect URL.

Version switching from a Page:

When a reader switches Project Versions:

1. try the same canonical Page path in the selected target entry;
2. then try that target Publication's frozen Page Aliases;
3. if no Page matches, open the target Edition Home Page and clearly say that
   the previous Page is not available in the selected Project Version.

This Home Page fallback applies only to an explicit version-switch action. A
direct request for a missing Page returns a normal non-revealing not-found
state; it does not silently hide a broken link by showing the Home Page.

Immutable Revision and Publication URLs:

Authenticated Revision and Publication routes always resolve the exact immutable
record named in the URL. They never fall forward to a newer Revision,
Publication, Working Draft, or Publish Link entry.

V1 does not expose a permanent public historical Publication URL merely because
one Publish Link currently points to that Publication. Access belongs to the
mutable Publish Link manifest:

- rolling a link forward must not accidentally leave an older Publication
  publicly reachable;
- rolling back must not accidentally expose a newer unselected Publication;
- Project Members can still inspect every immutable Publication through the
  authenticated exact Publication route;
- a future public historical-release feature would require an explicit retained
  link entry and access decision, not a guess based on Publication ownership.

This distinguishes an **immutable target** from **permanent public access**. A
Publication never changes, but the product does not promise that every
Publication is publicly reachable forever.

Embeds and Files:

Documentation embeds use the same Publish Link and exact Project Version path,
with an explicit compact route suffix chosen during reader implementation. They
do not receive weaker access or version behavior.

Protected File URLs include enough trusted link, Project Version, Publication,
and Asset identity to prove the File belongs to the exact selected Site
Publication. They do not read from the Working Draft or accept a Page path as
authorization.

Custom domains:

Question `26` decides whether custom domains are in V1. If accepted, a verified
custom domain may present the same resolver as:

```text
/
/:pagePath
/versions/:projectVersionSlug
/versions/:projectVersionSlug/:pagePath
```

The underlying Publish Link, access policy, Site Publication, Project Version,
Page Alias, and Redirect Rule meanings remain identical. Adding a custom domain
must not create a second content or permission model.

Concrete scenario:

A Publish Link has:

- Project Version `1.0` pointing to Site Publication `4`;
- Project Version `2.0` pointing to Site Publication `2`;
- `2.0` selected as the link default.

Then:

```text
/docs/abc123
```

shows `2.0` Publication `2`.

```text
/docs/abc123/versions/1-0/getting-started
```

shows the exact Page from `1.0` Publication `4`.

Publishing `2.0` Publication `3` changes neither URL. The stable link moves to
Publication `3` only when an Editor explicitly rolls that link entry forward.

Alternative:

Use one `/latest` URL and derive the Project Version from the Project Default or
newest Publication.

Why not:

- changing Project Default would unexpectedly move public Documentation;
- “newest” does not represent staged rollout or rollback;
- shared links could show different release content without an explicit link
  decision;
- it would conflict with the accepted link-owned default and ordering model.

Tradeoff:

Exact Project Version routes are longer, and public historical Publications are
not automatically addressable forever. In return, every URL has one clear
meaning and no unreviewed Publication becomes public.

Reversibility:

Verified custom-domain aliases and explicitly retained public historical
releases can be added later. Repairing ambiguous `/latest` links or publicly
leaked unselected Publications would be much harder.

Affected scope:

- portal route parser and canonicalization
- Site, Page, Revision, and Publication routes
- Publish Link manifest and public reader
- Project Version and Page aliases
- Redirect Rules and version selector
- embed and protected-File URLs
- SEO, canonical metadata, custom domains, caching, and rollback
- Audit/Access URL redaction

Local evidence:

- `CONTEXT.md` Default Project Version, permanent Project Version Alias,
  Revision, Publication, and Publish Link terms;
- `docs/adr/0021-project-versions-are-release-contexts.md`;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/116-project-version-foundation.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`.

Status:

Provisionally accepted. Authenticated Working Draft, immutable Revision,
immutable Publication, stable Publish Link, and exact included Project Version
routes have separate meanings. No `/latest` route exists. The stable public
root follows only the link's explicitly selected default entry; publishing and
Project Default changes do not move it. Page and Project Version aliases resolve
inside the exact selected Publication. Public historical Publication access is
not implied after link rollout, while Project Members retain exact immutable
Publication history routes. This remains subject to recheck and final acceptance
after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation URL meanings and the absence of `/latest`;
- the Documentation URL and Publication ADRs;
- the future portal routing, public reader, Publish Link, protected-File, SEO,
  and custom-domain child plans;
- this grill record.

### Q18. What happens to redirects, search, links, previews, and Publications
when a Project Version, Site, or Page is archived or removed?

Recommended answer:

Use reversible archive behavior for normal product actions. Do not hard-delete
Project Versions, Documentation Sites, Site Editions, Pages, Revisions,
Publications, aliases, or redirect history in V1.

The central rule is:

> Archiving stops or hides future authoring. It never rewrites an immutable Site
> Revision or Site Publication, and it never silently revokes a Publish Link.

Project Version archive:

Keep the accepted Project Version behavior:

- the Project Version remains directly addressable;
- its permanent aliases continue to resolve;
- its Site Editions become effectively read-only without rewriting their stored
  lifecycle;
- Draft and Revision previews remain readable to authorized Project Members;
- it remains a valid Carry-Forward source;
- it is excluded from ordinary active selectors, authoring creation choices,
  and default authenticated search;
- an explicit “include archived” view may show it;
- existing Site Publications remain immutable;
- existing Publish Link entries and public readers continue working;
- public search continues to include an archived Project Version only when an
  active Publish Link still deliberately includes its Publication.

Archiving a Project Version does not change the Project Default automatically.
The accepted Project rule must first ensure another active Default exists.

There is no Project Version delete route. Its canonical slug and permanent
aliases remain reserved.

Documentation Site and Site Edition lifecycle:

The stable **Documentation Site** remains identity across Project Versions,
matching the accepted stable Artifact pattern. Normal lifecycle belongs to each
**Site Edition**.

Archiving a Site Edition:

- makes its Working Draft read-only;
- removes it from normal active authoring lists and authenticated current-content
  search;
- preserves its Pages, Snippets, Navigation, aliases, Redirect Rules, OpenAPI
  sources, and protected references;
- preserves Revision and Publication history;
- keeps immutable Revision and Publication previews readable to authorized
  Project Members;
- permits Carry-Forward as an archived source;
- blocks Page edits, autosave, Navigation changes, checkpoint, restore, and new
  Publication;
- allows existing Publish Links to be inspected and, while the Project is
  active, managed or rolled back under the accepted link rules;
- does not remove its Publication from a Publish Link.

Restoring the Site Edition makes the Working Draft editable again when the
Project and Project Version are also active. Stored child lifecycle and Row
Versions change only through their own accepted commands.

V1 does not add a global “delete this Documentation Site across every Project
Version” action. A team archives the applicable Site Editions. The stable Site
identity remains so lineage, links, Audit history, and future restoration are
unambiguous.

Page lifecycle:

Give each Working Draft Page an `active | archived` lifecycle. **Unlisted** is
not archive:

- an Unlisted Page is active, editable, linkable, and may be published;
- an archived Page is excluded from active Navigation, ordinary current-content
  search, and the next Site Revision/Publication content set.

Archiving a Page:

- requires its current Page Row Version;
- removes its Page Item from active Navigation in the same transaction;
- keeps its canonical slug and permanent aliases reserved;
- keeps the archived draft content for authorized history and possible restore;
- does not change any existing Site Revision or Site Publication;
- does not immediately remove it from a public reader that still points to an
  older Site Publication containing it.

Published Page retirement:

If the Page has appeared in any Site Publication, the author must deliberately
choose what future Publications should do with its old paths:

1. create an internal Redirect Rule to an active Page in the same Site Edition;
   or
2. create an explicit **Gone Rule** for the retired path.

A Gone Rule is frozen into the Site Revision and returns the accepted
unavailable response for that exact published path. Its final public status and
SEO presentation are confirmed with Question `26`, but it never falls through
to another Page.

Do not redirect an archived Page to the Home Page automatically. That would hide
broken links and confuse readers.

If a Page has never appeared in a Site Publication, it may be archived without
a redirect or Gone Rule. Its slug remains reserved in V1 so restore is safe and
history does not become ambiguous.

Restoring a Page:

- requires an active writable Site Edition and current Row Version;
- returns the same Page identity to active draft state;
- does not insert it into Navigation automatically;
- requires the author to place it deliberately or mark it Unlisted;
- requires removal or correction of a conflicting Gone/Redirect Rule before the
  next Publication;
- never changes older Revisions or Publications.

Links and Publication validation:

- internal links to an archived Page become visible draft warnings;
- a new Publication accepts the old path only when the frozen Redirect Rule
  resolves safely or the Gone Rule deliberately retires it;
- links that are expected to lead to live content remain Publication-blocking
  when no active target exists;
- old Site Publications keep the Page and links exactly as their Site Revision
  recorded them;
- Page Alias and Redirect Rule resolution never reads the current Working Draft
  when serving an older Publication.

Search behavior:

Maintain separate indexes by lifecycle and access:

- active Working Draft search excludes archived Pages and Site Editions by
  default;
- authorized history views may find Revision and Publication records without
  mixing their old Page bodies into ordinary current-content results;
- a new public index is built only from the exact Site Publication selected by
  an active link entry;
- rolling a link forward or backward switches to the selected Publication index
  atomically;
- removing an entry, restricting, expiring, or revoking a link removes or denies
  its public search access with the reader;
- an old Publication index is disposable and never the source of truth.

Publish Link behavior:

- archiving a Page, Site Edition, or Project Version does not silently edit a
  Link manifest;
- explicitly removing a Project Version entry makes its exact public URL
  unavailable;
- changing the default requires another included entry in the same atomic link
  update;
- revoking the link remains the explicit way to stop all its public access;
- rollback may continue to select an older immutable Publication when existing
  lifecycle and authorization rules allow it.

Physical deletion and Files:

Normal archive does not physically delete content or File bytes.

- Revisions and Publications remain immutable and non-deletable in V1;
- permanent Project Version and Page aliases are not deleted or reassigned;
- protected Assets and Files remain while any Working Draft, Revision, or
  Publication references them;
- a future maintenance purge must prove no protected reference, required
  history, retention hold, or public access remains;
- Organization/Project retention and true purge are decided fully in Question
  `29`, not hidden inside Page archive.

Concrete scenario:

Publication `5` contains `/legacy-install`. An author archives that Page in the
Working Draft and points its old path to `/installation`.

- Publication `5` still serves `/legacy-install` exactly as before.
- The next Revision excludes the archived Page and freezes the redirect.
- The next Publication redirects `/legacy-install` to `/installation`.
- A Publish Link continues showing Publication `5` until an Editor explicitly
  rolls that link forward.

Alternative:

Immediately remove archived content from every preview, Publication, public
link, search index, and File reference.

Why not:

- it mutates published history;
- shared public links would break without an explicit access action;
- rollback could no longer reproduce the older Site;
- Files might be deleted while immutable content still needs them;
- archive would secretly behave like destructive purge.

Tradeoff:

Archived rows and protected Files continue using storage, and public content may
remain reachable through an older selected Publication until a link is changed.
That is intentional: history and public access remain truthful and independently
controlled.

Reversibility:

Retention-based maintenance purge can be added later with proof of no
references. Recovering deleted Revision graphs, aliases, redirects, or Files
after an eager cascade would not be possible.

Affected scope:

- Project Version and Site Edition lifecycle
- Page archive/restore and Navigation
- Page Alias, Redirect Rule, and Gone Rule
- Working Draft, Revision, Publication, and preview reads
- authenticated and public search indexes
- Publish Link rollout, removal, rollback, and revocation
- protected Assets and Files
- Audit, Access Evidence, retention, and maintenance purge

Local evidence:

- `CONTEXT.md` Archived Project, Project Version, Artifact Edition, Revision,
  Publication, and protected-Asset rules;
- `docs/adr/0021-project-versions-are-release-contexts.md`;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/116-project-version-foundation.md`;
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`.

Status:

Provisionally accepted. Normal product actions archive rather than hard-delete.
Archiving makes future authoring read-only or excluded without changing immutable
Revisions, Publications, existing Publish Link access, or protected references.
Site identity remains stable while Site Edition owns lifecycle. Pages use
active/archive lifecycle distinct from Unlisted state; previously published
Page retirement requires an internal Redirect Rule or explicit Gone Rule for a
future Publication. Physical purge remains open for Question `29`. This remains
subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Site Edition and Page archive, Unlisted, and Gone Rule terms;
- the Documentation lifecycle and retention ADRs;
- the future lifecycle, Navigation, search, Publication, redirect, and
  protected-File child plans;
- this grill record.

### Q19. What should Documentation search cover in the first release?

Recommended answer:

Provide two deliberately separate search experiences:

1. **Portal Documentation Search** — searches current Documentation across the
   current Project and explicitly selected Project Version;
2. **Published Site Search** — searches only the exact Site Publication and
   Project Version currently selected in one Publish Link.

Do not add Organization-wide search or cross-artifact Guide/Demo search in the
first release.

Portal Documentation Search:

Default scope:

```text
one authorized Project
  + one explicitly selected Project Version
  + all active Documentation Site Editions in that context
  + their current active Working Draft Pages
```

This means a user does not have to open each Documentation Site separately to
find a Page, but results never silently mix Project Versions.

Rules:

- Project Membership is checked before search results are selected;
- Viewer, Editor, Admin, and implicit Owner see only the Projects allowed by the
  accepted role boundary;
- lack of Project Membership follows the hidden not-found behavior;
- active Site Editions and active Pages are searched by default;
- Unlisted Pages are included because Unlisted affects Navigation, not access or
  findability;
- archived Project Versions, Site Editions, and Pages are excluded by default;
- an authorized user may deliberately select an archived Project Version or
  “include archived” history filter;
- current Working Draft content appears once and is not duplicated by every
  Revision or Publication that contains similar text;
- Revision and Publication history remains searchable inside its dedicated
  history view, not mixed into ordinary current-content results.

Portal results identify enough context to avoid confusion:

- Documentation Site;
- Page title;
- safe matching heading or excerpt;
- Navigation breadcrumb;
- Project Version label;
- Page lifecycle or Unlisted state when relevant;
- direct authenticated Page or preview destination.

Published Site Search:

Default scope:

```text
one active Publish Link
  + one selected included Project Version entry
  + one exact Site Publication
  + Pages allowed by that Publication
```

Rules:

- stable base URLs search only the link's explicit default entry;
- exact Project Version URLs search only that included entry;
- search never mixes results from another included Project Version unless the
  reader explicitly switches version;
- a result always opens the exact same selected Site Publication;
- Navigation-listed and Unlisted Pages are both searchable when published;
- archived Working Draft state is irrelevant because the immutable Publication
  is the source;
- Page Aliases and Redirect Rules may help resolve a result URL but do not
  create duplicate results;
- removed, Restricted, Expired, Revoked, unauthorized, or non-included content
  is not returned.

Password-protected search:

- the same accepted viewer session is required for search and Page/File reads;
- no password-protected content is placed in a public shared browser index;
- the server returns results only after resolving the exact active link,
  selected Project Version, viewer session, and Site Publication;
- changing password, visibility, expiry, selected entry, or revocation
  invalidates the related searchable access with the reader.

Fully public search:

A fully public, non-password Site Publication may use a disposable static search
index for speed. That index:

- contains only the exact allowed published content;
- is identified by immutable Site Publication;
- contains no internal IDs, draft text, hidden Project Versions, credentials,
  private URLs, or storage details;
- is replaced or made unreachable when a link entry rolls to another
  Publication;
- is never the authoritative source of content or access.

Search ownership:

Ossie's server owns:

- scope selection;
- Project and Publish Link authorization;
- the permission-safe index or query input;
- result fields and URLs;
- invalidation after save, archive, Publication, rollout, password change,
  expiry, removal, and revocation.

Fumadocs may own only:

- the search button and dialog;
- keyboard interaction;
- loading, empty, error, and result presentation;
- sending a safe query to the Ossie endpoint.

Fumadocs, Orama, or another helper does not decide which content is allowed.

First implementation:

Use PostgreSQL-backed search for private portal and protected public queries.
Do not require Elasticsearch, Algolia, or another hosted service in the first
release. This preserves self-hosting and keeps private content inside Ossie's
existing server and database boundary.

A small fully public static index may be added only when Question `27` proves
its build, caching, and invalidation behavior. Search correctness must not
depend on it.

Indexing and freshness:

- committed autosaves update or queue the affected Page search document;
- Snippet edits update every current Page search document that uses the
  Snippet;
- Navigation changes update breadcrumb text without rewriting Page content;
- Revision creation does not change ordinary portal search by itself;
- Publication creates an index from the exact immutable Site Revision;
- rollout switches a public link entry to the selected Publication index
  atomically from the reader's perspective;
- failed indexing does not claim fresh results and never blocks saving the
  Working Draft;
- Publication may be blocked or remain unavailable until its required public
  index is ready if the accepted reader design requires that index.

Question `27` decides whether indexing is inside the Publication transaction or
a recoverable publication-build step. Either way, the UI must show truthful
ready, indexing, failed, and retry states.

Reusable content:

Readers search Pages, not standalone Snippet records. The searchable Page text
includes the exact Snippet content used by that Working Draft or Site
Publication. Search results open the Page where the text is used.

The authoring Snippet picker may have its own small name/content filter. That is
an editor tool, not a separate reader search result type.

OpenAPI:

When accepted in Question `24`, an OpenAPI operation may contribute its safe
title, method, path, summary, and description to the Page containing it. Search
opens that Page or operation heading. Credentials, example secrets, server
tokens, and unsafe extensions are never indexed.

Deferred search:

**Organization-wide search**

Deferred. It requires safe fan-out across many Projects, hidden Project
Membership boundaries, ranking, pagination, archived behavior, and stronger
operational limits.

**Cross-artifact search**

Deferred. Guides, Interactive Demos, Documentation, and later Video have
different content shapes and destinations. First prove Documentation Page
search, then add a common safe result contract without forcing one shared
content schema.

**Search across all Project Versions at once**

Deferred as a default. Users select one Project Version so results do not mix
release instructions. A later comparison search may explicitly show several
versions with clear labels.

Concrete scenario:

A Project has two Documentation Sites in Project Version `2.0`: “Developer API”
and “Operations.”

Portal search for “rotate key” returns matching current Pages from both Sites,
each labeled `2.0`.

A public reader on the “Developer API” Site Publication searches the same words
and receives results only from that exact published Site and selected Project
Version. It cannot discover the private “Operations” Site.

Alternative:

Launch one Organization-wide search across Documentation, Guides, Demos, every
Project, and every Project Version.

Why not:

- permission mistakes would have a much larger effect;
- results from several releases could contradict one another;
- ranking unlike content types requires product work;
- indexing and invalidation would become a large separate platform before the
  basic Documentation reader is proven.

Tradeoff:

Users cannot search the entire Organization or all artifact types from one box
in the first release. They gain clear release context, safer permissions, and a
search experience that can ship and be verified.

Reversibility:

Project-wide, Organization-wide, and cross-artifact result sources can be added
later behind a shared permission-safe result contract. Removing leaked or
misleading broad indexes after launch would be much harder.

Affected scope:

- portal Documentation search and result routes
- Project/Project Version authorization
- Working Draft Page and Snippet indexing
- public reader search and viewer sessions
- Publication build, rollout, rollback, and invalidation
- Fumadocs search UI adapter
- PostgreSQL indexes and operational limits
- future cross-artifact discovery

Local evidence:

- `CONTEXT.md` Project Membership, Project Version, Revision, Publication, and
  Publish Link definitions;
- `docs/adr/0024-project-membership-governs-project-access.md`;
- `docs/plan/114-access-evidence-and-compliance-timelines.md`;
- `docs/plan/115-project-membership-foundation.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`;
- Question `10` Fumadocs boundary and Question `16` access decision in this
  record.

Status:

Provisionally accepted. The first release separates Project/Project
Version-scoped portal Documentation search from exact Site Publication and
selected-entry public search. Portal search may span active Documentation Sites
inside one authorized Project Version; public search never spans another Site
or selected version implicitly. Ossie owns authorization, index input, result
projection, and invalidation, while Fumadocs may present the search interface.
Organization-wide, all-version, and cross-artifact search are deferred. This
remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for portal and Published Site search scopes;
- the Documentation search and authorization ADR;
- the future indexing, portal search, Publication build, public search, and
  Fumadocs adapter child plans;
- this grill record.

### Q20. Which fields should search index, rank, return, and permission-filter?

Recommended answer:

Build one safe **Page Search Document** for each current Working Draft Page and
one separate immutable Page Search Document for each Page included in a Site
Publication.

Index content the reader can meaningfully see. Keep permission, storage,
credentials, raw editor state, and internal operational data out.

Searchable Page fields:

Index these fields:

1. **Page title** — strongest field;
2. **Headings** — strong field with exact heading destination;
3. **Page description** — strong summary field;
4. **canonical Page slug and frozen Page Aliases** — useful for exact technical
   name and old-address lookup;
5. **Navigation breadcrumb labels** — useful context with lower weight;
6. **visible body text** — normal paragraphs, lists, tables, callouts, and
   visible tab content;
7. **expanded Snippet text** — the exact Snippet content used on that Page;
8. **inline code and code-sample text** — lower weight so function names and
   commands can be found without overwhelming normal results;
9. **image alternative text and visible caption** — searchable when it is part
   of the Page meaning;
10. **safe typed-block labels and visible text**;
11. **safe OpenAPI operation fields** when accepted in Question `24`: method,
    path, operation title, summary, and description.

Do not create standalone reader results for Navigation Groups or Reusable
Snippets. Their useful text leads to the Page where it appears.

Guide and Demo blocks contribute only their safe displayed title and short
description. They do not copy the full Guide or Demo body into Documentation
search. Cross-artifact search remains deferred.

Ranking:

Use a simple explainable order:

```text
exact Page title
  > title words
  > heading
  > description
  > exact slug or alias
  > breadcrumb
  > visible body and Snippet text
  > code and secondary typed-block text
```

Prefer a Page with a strong title or heading match over one that repeats a word
many times in body text.

Return one Page result with its best matching section by default. More matches
on the same Page may appear as clearly grouped heading destinations rather than
many repeated full Page results.

Search normalization:

- normalize Unicode safely;
- compare ordinary text without letter-case sensitivity;
- collapse repeated whitespace;
- preserve code symbols, paths, HTTP methods, and version-looking text where
  useful;
- do not run HTML or MDX while extracting text;
- do not invent language-specific stemming before localization is accepted;
- keep original display text for results even when normalized text is indexed.

Keywords:

Do not add a hidden free-form SEO/search keyword field in the first release.
Titles, descriptions, headings, slugs, breadcrumbs, and visible content provide
an understandable search model.

A later limited **Search Synonyms** feature may be added when real failed-search
evidence shows a need. It should be explicit, bounded, visible to authors, and
not an invisible ranking trick.

Project Version labels:

Project Version ID, name, canonical slug, lifecycle, and selected/default state
are structured result context and filters. They are not copied into every Page
body for ranking.

This lets the UI label a result `2.0` or filter to `Main` without causing every
Page in that version to match a search for common words in the Version name.

Locale:

Question `25` decides localization. Until then, the first search index has one
accepted Site language context and no fake locale variants or fallback.

If localization is later accepted, locale becomes a required structured index
partition and result label. Search must select the requested locale before
ranking and must never silently merge translations as duplicate Page results.

Index identity and scope fields:

The server-side index stores only the trusted identity needed to enforce scope
and open a result:

- Organization, Project, and Project Version identity;
- stable Documentation Site and exact Site Edition identity;
- Working Draft Page identity for portal search;
- exact Site Revision and Site Publication identity for published search;
- canonical Page path and heading anchor;
- lifecycle and Unlisted state needed by accepted filters;
- index generation/change number for freshness.

These fields are server-side enforcement data. Public result responses expose
only the safe labels and URLs required by the reader.

Never index or return from Ossie-owned secret or operational fields:

- passwords, hashes, salts, viewer-session tokens, cookies, bearer tokens, API
  keys, secrets, or OpenAPI authorization values;
- storage keys, local file paths, provider metadata, internal private URLs, or
  source credentials;
- raw Tiptap JSON, raw relational row dumps, raw imported files, MDX, HTML, or
  unsupported block settings;
- Row Versions, internal Audit Change Items, Access Events, idempotency keys, or
  actor IDs;
- comments, review notes, unpublished feedback, or analytics;
- archived or unauthorized content outside an explicit authorized history
  scope;
- Pages from another tenant, Project, Project Version, Site, Revision, or
  Publication;
- content hidden only after retrieval in the browser.

Search cannot reliably decide whether an author accidentally typed a real secret
into visible prose or a visible code sample. That text follows the same access
boundary as the Page because it is already reader content. Publication should
warn or block on proven secret-detection rules when those are added, but search
must never obtain credentials from Ossie's own secret fields or runtime
sessions.

Permission filtering:

Authorization happens before search candidates are returned, not after a broad
result set reaches the browser.

Portal query order:

1. authenticate the user;
2. resolve Organization and Project;
3. enforce Project Membership and current role;
4. resolve the explicit Project Version and lifecycle filter;
5. select allowed Documentation Site Editions and Pages;
6. run ranking only inside that allowed set;
7. return the safe result projection.

Public query order:

1. resolve the opaque Publish Link without revealing unknown links;
2. enforce active/restricted/expiry/password viewer-session policy;
3. resolve the exact included Project Version entry;
4. resolve its exact Site Publication and immutable search partition;
5. search only that partition;
6. return public-safe labels, excerpts, and canonical paths.

Do not create one Organization index and send it to the browser with client-side
filters. Fumadocs receives only already-authorized result rows.

Search excerpts:

- generate excerpts from the safe indexed plain text;
- escape all content before highlighting;
- use a short bounded amount of surrounding text;
- never return raw HTML from the author;
- do not reveal text before or after an unauthorized block;
- if an exact heading matched, link directly to its frozen heading anchor.

Draft and Publication separation:

- portal Working Draft search indexes only server-confirmed saved content;
- Unsaved, failed, offline, or conflicting browser text is not indexed;
- a Snippet save updates every current Page document that uses it;
- a Navigation change updates affected breadcrumb fields;
- a Site Publication creates or identifies a separate immutable search
  partition from the exact Site Revision;
- later Working Draft saves never update a Publication index;
- a damaged disposable Publication index can be rebuilt from the immutable Site
  Revision without changing search meaning.

Search queries and privacy:

Treat the user's query as potentially sensitive:

- do not place raw query text in Audit Events, Access Evidence, server error
  logs, URLs, screenshots, or analytics by default;
- keep query length bounded;
- record only safe operational facts such as success/failure, duration, result
  count, and scope category when needed;
- any future search analytics or failed-query reporting requires the Question
  `23` analytics/privacy decision.

Concrete scenario:

A Page titled “Rotate an API key” contains the heading “Update environment
variables” and uses a shared Snippet containing the command `ossie keys rotate`.

- searching `Rotate an API key` ranks the Page first by title;
- searching `environment variables` opens the exact heading;
- searching `ossie keys rotate` finds the Page through its expanded Snippet
  text;
- the result may show `Developer API · 2.0`, but private Site IDs and Snippet
  row IDs never reach the public reader.

Alternative:

Index every database field and hide unwanted results in the search interface.

Why not:

- private content already reached the client before hiding;
- internal IDs and operational data would become searchable;
- ranking would be noisy and difficult to explain;
- one filter bug could expose another Project or Publication;
- raw authored formats could introduce unsafe result rendering.

Tradeoff:

There is no hidden keyword stuffing, full cross-artifact body search, or raw
Revision-history search in the first release. Results remain understandable,
permission-safe, and tied to Pages readers can open.

Reversibility:

More reviewed visible fields, locale partitions, synonyms, or artifact result
types can be added later. Removing leaked secrets or private content from
downloaded and cached indexes would not be reliably reversible.

Affected scope:

- Working Draft and Site Publication search documents
- text extraction from Markdown, Snippets, code, media, and typed blocks
- ranking and excerpt generation
- Project Version and locale filters
- portal and public authorization
- Fumadocs result adapter
- index invalidation and rebuild
- logging, Audit, Access Evidence, and future analytics

Local evidence:

- `CONTEXT.md` tenant, Project Membership, Project Version, Revision,
  Publication, and Publish Link boundaries;
- `docs/adr/0024-project-membership-governs-project-access.md`;
- `docs/plan/114-access-evidence-and-compliance-timelines.md`;
- Questions `11`, `16`, and `19` in this record.

Status:

Provisionally accepted. Search uses safe Page-centered documents with
explainable field ranking, heading destinations, expanded visible Snippet text,
structured Project Version context, and strict Working Draft/Publication
separation. Authorization limits candidates before ranking or client delivery.
Ossie-owned secrets, raw editor or database state, internal evidence, and
unauthorized content never enter results. Hidden free-form keywords and raw
query logging are excluded from V1. This remains subject to recheck and final
acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Page Search Document and searchable-content boundaries;
- the Documentation search/privacy ADR;
- the future text extraction, indexing, ranking, portal search, Publication
  build, and public search child plans;
- this grill record.

### Q21. Can Documentation reuse Capture, Derived, Redacted, and uploaded
Assets, and how are they protected?

Recommended answer:

Yes. Documentation may reference an exact same-Project Capture Asset directly.
It may reference an exact Derived or Redacted Asset after that domain exists in
the runtime. Direct Documentation uploads use a separate **Documentation
Asset** identity rather than pretending to be browser Capture Assets.

Every reference is relational, tenant-scoped, Project-scoped, immutable inside a
Site Revision, and included in the complete protected-reference graph.

Current-state boundary:

- Capture Assets, Files, archive/restore, protected references, and retryable
  purge exist in the current accepted product foundation;
- `CONTEXT.md` defines Derived Asset and redaction direction;
- current runtime plans explicitly state that Derived Asset/reference modeling
  is not implemented;
- therefore the first Documentation implementation may reuse real Capture
  Assets but must not claim that users can already create or select a real
  Derived/Redacted Asset;
- Derived/Redacted selection starts only after a dedicated child implements and
  verifies that domain.

Asset types:

**Capture Asset**

An immutable source Asset created by a Capture Session. Documentation may reuse
its exact Asset and File without copying bytes.

**Derived Asset**

A future immutable processed Asset with its own File and explicit source Asset
relationship, such as a cropped, resized, thumbnail, annotated, or redacted
image. It never overwrites the original Capture Asset.

**Redacted Asset**

A Derived Asset whose purpose is to hide selected visual information. Redacted
is provenance and intent, not a guarantee that no sensitive information remains.
The author must still preview the exact image before Publication.

**Documentation Asset**

An image or other accepted media File uploaded for one Site Edition Working
Draft rather than captured from a browser. It:

- belongs to one Organization, Project, Documentation Site, and Site Edition;
- may be reused by many Pages and Snippets in that Site Edition;
- has its own product identity and safe display metadata;
- references one File for storage facts;
- is copied to a new target Documentation Asset identity during Carry-Forward
  while reusing the same protected File bytes when allowed;
- is not silently shared as mutable content across Site Editions or Sites.

Reference model:

A Page or Snippet media block points to exactly one allowed Asset identity.
Implementation may use type-specific relational references, but must enforce:

- exactly one Asset type per reference;
- same Organization and Project;
- a valid Site Edition Working Draft owner;
- accepted Asset lifecycle;
- no raw File ID supplied as product meaning;
- no cross-Project or cross-Organization reference;
- no URL, JSON metadata, or storage key used as the relationship.

Presentation fields such as alternative text, caption, crop display, and
reader-specific label belong to the Page/Snippet media use, not globally to the
Capture Asset. The same image may need different alternative text in different
contexts.

Selection:

- the normal picker shows active Assets from the current Project Version and
  Documentation Assets from the current Site Edition;
- an explicitly expanded picker may show allowed same-Project Assets from
  another Project Version with a clear source-Version label;
- Carry-Forward preserves valid exact same-Project references even when the
  Capture Asset originated in the source Project Version;
- archived referenced Assets remain visible as “Archived — already in use” but
  cannot be selected for a new unrelated media use;
- purged or foreign Assets never appear;
- if a redacted Derived Asset later exists for an original, the picker should
  recommend the redacted choice and require a clear confirmation before using
  the original.

Documentation never chooses “the newest derivative.” It references one exact
Asset so a Revision and Publication cannot change when another crop or
redaction is created later.

Editing and redaction:

- Documentation never modifies a Capture Asset or its original File;
- crop, annotation, resizing, thumbnailing, or redaction that changes bytes
  creates a new Derived Asset and File after that domain is implemented;
- display-only positioning that does not change bytes may remain Page-owned
  presentation data;
- replacing an image updates only the mutable Working Draft reference;
- existing Site Revisions and Site Publications keep their exact old Asset
  reference.

Protected-reference graph:

An Asset and its File are protected when referenced by:

- an active Documentation Working Draft Page or Snippet;
- an immutable Site Revision;
- a Site Publication through its exact Site Revision;
- an existing Guide or Interactive Demo Working Draft, Revision, or accepted
  Publication dependency;
- another non-purged Asset that shares the same File;
- a pending or failed purge operation that has not truthfully completed.

Documentation must extend the existing dependency report, purge guard, database
constraints, transaction locking, and current-Publication projection where
needed. It must not create a second weaker deletion system.

Tombstoned or archived mutable Page content that is not part of the active
Working Draft does not create a new draft protection by itself. Any immutable
Site Revision or Publication that previously captured the reference continues
to protect it.

Archive:

- Editors and Admins may archive/restore Assets under the accepted capability
  rules;
- archive hides the Asset from normal new selection;
- existing Working Draft, Revision, Publication, export, preview, reader, and
  Carry-Forward references continue resolving;
- archive does not delete File bytes or rewrite media blocks;
- restoring an archived Asset makes it selectable again when no purge is
  pending, failed, or complete.

Physical purge:

Keep the accepted two-stage rule:

1. archive the Asset;
2. a Project Admin or implicit Owner reviews protection and requests physical
   purge only when no protected reference remains.

Before purge, Ossie:

- checks every Documentation, Guide, Demo, Asset, File, Revision, Publication,
  and active Working Draft dependency;
- returns safe actionable dependency counts and allowed IDs without content,
  storage keys, private URLs, or secrets;
- locks the Asset/File and competing reference writers in the accepted
  deterministic order;
- rejects a concurrent new reference or purge race without partial success;
- blocks File deletion while another non-purged Asset shares the File.

Purge uses the existing persisted, idempotent, retryable storage operation.
Ossie says **purged** only after the exact bytes are confirmed removed. Pending
or failed purge remains unavailable for new references and can be retried
safely.

Database and Audit tombstones remain as accepted evidence. Purge does not erase
Audit/Access history or claim legal erasure.

Publication and public File serving:

- Publication validation blocks a missing, purged, foreign, or unresolved Asset
  reference;
- a Site Revision freezes the exact Asset identities and safe media-use fields;
- public Page HTML never contains storage keys or direct private storage paths;
- File requests resolve through the exact Publish Link, selected Project
  Version entry, Site Publication, and protected Asset allowlist;
- password, restriction, expiry, removal, and revocation apply to Files exactly
  as they apply to the Page;
- public responses expose only safe media bytes and allowlisted presentation
  metadata, never Capture Session URLs, Capture Event metadata, actor IDs, raw
  browser metadata, or File-provider details.

If storage unexpectedly cannot supply a protected File:

- draft and Revision previews show a clear authorized missing-media state;
- Publication blocks before rollout when the failure is known;
- an already-published reader shows a stable safe failure state;
- Ossie never substitutes a live remote URL, a different derivative, or the
  current Working Draft Asset.

Remote media:

Question `11` remains controlling: V1 does not hotlink remote media. An outside
image must be uploaded as a Documentation Asset or later imported into an
immutable File through a separately accepted safe downloader.

Carry-Forward:

- creates new Documentation Asset and edition-owned reference identities;
- preserves exact Capture/Derived Asset identity where allowed;
- reuses protected File bytes rather than copying them;
- remaps Page and Snippet references to the new target rows;
- copies no credentials, storage paths, Publish Links, or public access state;
- never creates mutable sharing between source and target Editions.

Retention:

An immutable Site Revision protects every referenced Asset even if no current
Publish Link exposes that Revision. A Site Publication remains immutable
non-deletable V1 history. Therefore normal product purge may remain blocked for
a long time.

Question `29` decides future Organization/Project retention and governed
permanent purge. This question does not weaken the existing rule merely to
reclaim storage.

Concrete scenario:

A Capture screenshot contains a customer email address. Later, a real Redacted
Asset is created with that area covered.

- the original Capture Asset remains immutable;
- the Documentation Page explicitly selects the Redacted Asset;
- Site Revision `3` freezes that exact redacted File;
- creating a newer redaction does not change Revision `3`;
- archiving the redacted Asset does not break Revision `3` or its Publication;
- physical purge is blocked while Revision `3` references it.

Alternative:

Copy every image File into each Page, Site Revision, and Project Version.

Why not:

- identical bytes would be stored many times;
- cleanup and retention would be harder to understand;
- Carry-Forward would become expensive;
- copies could lose source/redaction provenance;
- one copied File might be deleted while another hidden copy remains.

Alternative:

Reference raw File IDs or remote URLs directly.

Why not:

- File has storage meaning, not complete product ownership and lifecycle;
- raw IDs make tenant and Project validation easier to bypass;
- remote content can change, track readers, disappear, or become unsafe;
- neither approach provides the accepted protection report and purge graph.

Tradeoff:

Immutable Revision references can keep File bytes for a long time, and derived
redaction requires a separate real implementation before Documentation can use
it. In return, old Publications remain reproducible and private Asset access is
consistent with the rest of Ossie.

Reversibility:

New derived media types and storage providers can be added behind the same
Asset/File and protection boundaries. Recovering overwritten source images or
purged Publication media would not be possible.

Affected scope:

- Documentation Asset persistence and upload
- Capture and future Derived Asset pickers
- Page/Snippet media references and presentation fields
- Working Draft, Revision, Publication, and Carry-Forward graphs
- protected dependency report and purge locks
- authenticated preview and public File routes
- Audit, Access Evidence, retention, and storage operations
- future redaction/derived-media child

Local evidence:

- `CONTEXT.md` Capture Asset, Derived Asset, Protected Shared Asset, File, and
  Redaction definitions;
- `docs/adr/0009-file-domain-owns-storage-metadata.md`;
- `docs/adr/0012-privacy-preserving-capture-defaults.md`;
- `docs/adr/0022-artifacts-use-editions-revisions-and-publications.md`;
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`;
- `docs/plan/120-publication-and-multi-version-publish-link-integration.md`.

Status:

Provisionally accepted. Documentation may reference exact same-Project Capture
Assets and edition-owned Documentation Assets under the existing Asset/File
protection graph. Future Derived/Redacted Assets may be referenced only after
that currently unimplemented domain ships; source media is never overwritten.
Carry-Forward reuses protected bytes, archive preserves existing reads, and
Project Admin/Owner purge remains blocked by any Working Draft, Revision,
Publication, shared-File, or purge-operation dependency. Public media enforces
the exact reader access boundary. This remains subject to recheck and final
acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation Asset and Documentation media-reference terms;
- the Documentation Asset/File/protection ADR;
- the future upload, picker, Revision, Publication, Carry-Forward, public File,
  and Derived/Redacted Asset child plans;
- this grill record.

### Q22. Which import and export formats should V1 support?

Recommended answer:

Support three portable V1 paths:

1. **single safe Markdown Page import/export**;
2. **complete Documentation Site ZIP import/export** containing Markdown,
   media, and a versioned Ossie manifest;
3. **uploaded OpenAPI JSON or YAML File import/export**.

Keep Git synchronization, arbitrary MDX/HTML, live remote OpenAPI URLs, and
direct server-folder access out of V1.

Format matrix:

| Format | Import | Export | V1 decision |
| --- | --- | --- | --- |
| Single `.md` Page | Yes | Yes | Accept |
| Markdown folder through validated ZIP | Yes | Yes | Accept |
| Browser folder picker | Optional convenience over the same ZIP/package rules | Not a separate format | Accept only if reliable |
| Ossie Site ZIP | Yes | Yes | Canonical full-Site portable format |
| OpenAPI `.json` / `.yaml` | Yes | Yes | Accept after parser/renderer proof |
| Git repository | No | No automatic sync | Deferred by Question `9` |
| Remote OpenAPI URL | No | No | Deferred; no live network authority |
| MDX / JSX / JavaScript | No | No | Reject |
| Raw HTML site | No | No | Reject |
| Word, PDF, Notion, Confluence | No | No | Later import adapters |

Source-of-truth rule:

Import is an explicit mutation of one authorized Working Draft. It never:

- becomes a second authority;
- writes directly into Site Revision or Publication tables;
- creates or rewrites Audit history;
- creates a Publish Link;
- publishes automatically;
- keeps a live connection to the imported folder, ZIP, or OpenAPI location.

After successful import, Ossie's relational Working Draft and protected Files
are authoritative. The original imported package or OpenAPI File may be retained
as an immutable protected source File for provenance, but later editing occurs
through normal Ossie commands.

Single Markdown Page import:

- accepts one UTF-8 `.md` file under the Question `7` constrained Markdown
  grammar;
- rejects MDX, raw HTML, scripts, unsupported directives, and unsafe URLs under
  Question `11`;
- creates a new Page in the selected writable Site Edition;
- never overwrites an existing Page;
- proposes title and slug from explicit safe metadata or filename, then requires
  conflict resolution before commit;
- imports local media only when supplied through the Site ZIP package;
- turns unsupported typed content into a visible import issue, not executable
  code;
- commits the Page and accepted media references atomically or creates nothing.

Single Markdown Page export:

- exports the selected current Working Draft Page or one exact Revision/
  Publication Page chosen by the user;
- produces readable CommonMark-compatible Markdown;
- converts safe Ossie typed blocks to documented visible fallback text where a
  single Page file cannot preserve the complete relationship;
- includes no private Asset bytes unless the user selects the full Site ZIP
  export;
- labels unresolved Guide, Demo, OpenAPI, or Snippet relationships clearly
  rather than emitting private URLs or internal IDs.

Full Site ZIP:

Use one versioned package layout such as:

```text
ossie-docs.json
pages/
  index.md
  getting-started.md
assets/
openapi/
README.md
```

`ossie-docs.json` is a data manifest, not executable configuration. Its exact
schema is owned and versioned by Ossie.

The manifest may contain portable forms of:

- package schema version;
- Site title and description;
- exported source kind: Working Draft, exact Site Revision, or exact Site
  Publication;
- safe Project Version display label;
- Home Page;
- Page paths and package-local handles;
- Navigation Groups, Page Items, External Link Items, and order;
- Unlisted Page state;
- Page Aliases, Redirect Rules, and Gone Rules;
- Reusable Snippets and Page uses;
- safe typed-block data;
- relative media paths, media-use alternative text/captions, and checksums;
- OpenAPI file paths and safe source labels;
- unresolved external Ossie relationships that require review after import.

The package does not contain:

- database IDs used as authority;
- Organization, Project, actor, session, or Audit identities;
- Row Versions;
- passwords, hashes, tokens, cookies, API credentials, or viewer sessions;
- storage keys, provider paths, private server URLs, or local filesystem paths;
- Publish Link slugs or access state;
- comments, analytics, approvals, or hidden evidence;
- executable MDX, JavaScript, React components, raw HTML, or arbitrary plugins.

Package-local handles may connect Pages, Snippets, Navigation, and media inside
the ZIP. They have meaning only inside that package and never become trusted
database IDs.

Full Site export:

- the user selects the current saved Working Draft, one exact Site Revision, or
  one exact Site Publication;
- export reads one consistent source and labels it truthfully;
- it exports one selected state, not the entire Revision/Publication/Audit
  history;
- referenced allowed Documentation/Capture/Derived Asset bytes are included
  once under safe generated filenames when the actor may read them;
- duplicate references reuse one packaged file and checksum;
- exact imported OpenAPI source Files are included when allowed;
- typed blocks retain a safe round-trippable manifest form plus readable
  Markdown fallback;
- failure to read a required protected File fails the export with a clear
  report instead of silently producing a misleading complete package.

Full Site import:

- imports only into a newly created Site Edition or an explicitly empty writable
  Site Edition in V1;
- validates and previews the whole proposed Site before commit;
- shows Page, Navigation, Snippet, media, OpenAPI, alias, redirect, and
  unsupported-block issues;
- lets the user cancel without mutations;
- creates all accepted relational rows and Files in one logical import
  operation or rolls back database changes;
- storage upload cleanup follows the accepted best-effort compensation rule if
  the database transaction fails;
- creates no source Revisions, Publications, Publish Links, or false historical
  lineage;
- records import provenance and safe counts without storing raw content in
  Audit Changes.

Import into an existing non-empty Site and selective Page merging are deferred.
They require the same conflict, link repair, Navigation, and provenance design
described after Question `13`; they must not be smuggled in as “overwrite.”

Browser folder picker:

A browser may offer “Choose folder” as a convenience when reliable. Ossie
normalizes the selected folder into the same validated package model before
upload. It is not a second import contract and never gives the server access to
an arbitrary host filesystem path.

ZIP safety:

Before extraction, reject or bound:

- encrypted archives;
- symbolic links, hard links, devices, and executable entries;
- absolute paths, drive letters, `..`, encoded traversal, and duplicate
  case-conflicting paths;
- excessive compressed or expanded size;
- excessive file count, nesting depth, filename length, and compression ratio;
- unsupported media types and mismatched file signatures;
- duplicate manifest keys, unsupported manifest versions, and invalid UTF-8;
- nested archives unless a future format explicitly needs them.

Extraction occurs in an isolated temporary area with generated storage names.
Original filenames are display hints only and never storage paths. Question
`28` sets exact limits.

OpenAPI import:

Accept an uploaded self-contained JSON or YAML OpenAPI document as an immutable
protected File.

On 2026-07-29, the published OpenAPI families include `3.0`, `3.1`, and `3.2`,
with current published versions including `3.0.4`, `3.1.2`, and `3.2.0`.

V1 support rule:

- support the latest accepted patch documents in `3.0.x` and `3.1.x` after the
  chosen validator and renderer proof;
- support `3.2.x` only when the same proof demonstrates complete enough parsing,
  safe rendering, and understood unsupported fields;
- reject Swagger/OpenAPI `2.0`, unknown future versions, and partially parsed
  documents in V1;
- report the detected specification version and validation issues clearly;
- never silently reinterpret one OpenAPI version as another.

The proof and supported version constants are pinned in the implementation
plan. Adding a new OpenAPI version is a reviewed compatibility change, not an
automatic consequence of a dependency update.

OpenAPI safety:

- use a safe data-only YAML parser with custom object construction disabled;
- bound document size, node count, nesting, schema complexity, and reference
  depth;
- detect reference cycles;
- allow only internal references inside the uploaded self-contained document in
  the first release;
- do not fetch HTTP, HTTPS, file, data, or other external `$ref`,
  `externalValue`, schema, example, or documentation resources;
- sanitize all CommonMark description fields through Question `11`;
- treat specification extensions as untrusted data and ignore unsupported
  extensions safely;
- do not execute examples, callbacks, webhooks, links, or server URLs during
  import;
- store security-scheme descriptions but never obtain or store live
  credentials from the imported document.

The OpenAPI specification itself warns that documents can reference untrusted
external resources, contain reference cycles, and contain Markdown/HTML that
tooling must sanitize. Ossie's importer therefore remains offline and
fail-closed.

OpenAPI export:

- exports the exact authorized source File selected by the user;
- may also offer a documented normalized copy only when it is clearly labeled
  and round-trip tested;
- never injects API credentials, “try it” session values, environment secrets,
  proxy configuration, or private Ossie URLs;
- preserves the original supported format where practical;
- is included in a full Site ZIP when referenced and authorized.

Import preview and errors:

Every importer uses two phases:

1. **Inspect** — parse in isolation and return a safe report with counts,
   proposed Pages/Navigation, warnings, conflicts, unsupported features, and
   required choices;
2. **Apply** — require the report's exact fingerprint, current Working Draft Row
   Version, and explicit user confirmation.

If the source changes between Inspect and Apply, the import stops and must be
inspected again. Apply never imports a different file than the one the user
reviewed.

Permissions and evidence:

- Project Viewer may export content and Files they are already allowed to read;
- Project Editor/Admin/implicit Owner may import into an active writable Site
  Edition;
- public Publish Link readers do not receive full ZIP or source OpenAPI export
  automatically; a future public download is a separate explicit feature;
- import mutations produce accepted Audit Evidence with safe format, counts,
  source kind, and result identity, not raw content or filenames;
- export produces the accepted read/Access Evidence without recording exported
  body text, paths, link slugs, query text, or credentials.

Concrete scenario:

A team has a folder with 20 Markdown Pages, images, and `openapi.yaml`.

They ZIP the folder and import it. Ossie first shows:

- 20 proposed Pages;
- the proposed Home Page and Navigation;
- 8 media Files;
- one OpenAPI `3.1.2` source;
- two broken internal links;
- one unsupported MDX component.

Nothing is written yet. The team fixes or rejects the issues. Only the confirmed
safe package is then applied to an empty Site Edition.

Alternative:

Make Git the V1 import/export authority.

Why not:

- Question `9` already defers Git synchronization;
- repository credentials, webhooks, force-pushes, conflicts, and provider
  availability would enter the first authoring path;
- portable ZIP and Markdown work for self-hosted users without a Git provider;
- Git can later consume and produce the same package contract.

Alternative:

Accept arbitrary MDX, HTML, remote OpenAPI URLs, and external references for
maximum compatibility.

Why not:

- imported content could execute code or fetch internal/private network
  resources;
- immutable Publications would depend on mutable remote content;
- ZIP and reference expansion could exhaust storage or memory;
- export would not be portable or reproducible.

Tradeoff:

Some existing developer docs require bundling into safe Markdown and a
self-contained OpenAPI file before import. In return, import is portable,
reviewable, self-hostable, and does not create a code-execution or network-fetch
boundary.

Reversibility:

Git adapters, more OpenAPI versions, multi-file local OpenAPI packages, and
third-party importers can be added later behind the same Inspect/Apply and
package contract. Removing unsafe remote or executable imports after customers
depend on them would be much harder.

Affected scope:

- Markdown parser and exporter
- Site package manifest and schema versions
- ZIP inspection, extraction, and limits
- import preview/apply and Working Draft concurrency
- Documentation Asset and protected File handling
- typed block and relationship portability
- OpenAPI validation, storage, renderer proof, and export
- permissions, Audit, Access Evidence, and temporary-file cleanup
- future Git and third-party import adapters

Primary and local sources:

- `https://spec.commonmark.org/`
- `https://spec.openapis.org/oas/`
- `https://spec.openapis.org/oas/v3.2.0.html`
- `https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html`
- Questions `7`, `8`, `9`, `11`, `13`, and `21` in this record;
- `docs/adr/0009-file-domain-owns-storage-metadata.md`;
- `docs/plan/119-guide-demo-revision-carry-forward-and-protected-assets.md`.

Status:

Provisionally accepted. V1 supports single safe Markdown Page import/export,
complete versioned Site ZIP import/export, and self-contained OpenAPI JSON/YAML
File import/export through Inspect then Apply. Imports affect only a new or
empty authorized Working Draft and never overwrite, publish, create history, or
become another authority. Git, executable formats, remote OpenAPI sources,
external references, existing-Site merges, and unsupported OpenAPI versions are
deferred or rejected as stated. This remains subject to recheck and final
acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation package and import/export authority terms;
- the Documentation portability/import security ADR;
- the future Markdown, ZIP package, import Inspect/Apply, OpenAPI proof, and
  export child plans;
- this grill record.

### Q23. Which comments, review, approval, feedback, analytics, ownership, and
history features are required now?

Recommended answer:

Require trustworthy **Revision, Publication, Activity, Audit, and Access
history** in the first release.

Defer formal review requests, comments, required approvals, public feedback,
product analytics, and Page ownership.

Feature matrix:

| Capability | First release | Reason |
| --- | --- | --- |
| Site Revision history | Yes | Required immutable authoring history |
| Exact Revision preview | Yes | Gives teammates one stable review target |
| Optional checkpoint reason | Yes | Explains deliberate checkpoints |
| Site Publication history | Yes | Required rollout and rollback truth |
| Safe Project Activity summaries | Yes | Shows important team actions |
| Full accepted Audit/Access Evidence | Yes | Security and accountability invariant |
| Basic Revision change summary | Yes | Makes history understandable |
| Formal review request/status | No | Later workflow layer |
| Inline or Page comments | No | Requires threading, permissions, retention, notifications |
| Required approvers | No | Would block publishing before governance need is proven |
| Public “helpful” feedback | No | Requires abuse and privacy design |
| Page views/search analytics | No | Requires consent, retention, privacy, and operations design |
| Page owner/maintainer | No | Project roles already own responsibility in V1 |
| External Revision review token | No | Deferred with formal review |
| Notifications/email/mentions | No | Depends on accepted review and delivery model |

Required Site Revision history:

Every authorized Project Member may view a safe history list containing:

- Revision Number;
- trigger: manual checkpoint, Publication, or Carry-Forward;
- creator's safe display label when allowed;
- creation time;
- optional manual checkpoint reason;
- whether the Revision was reused during a later publish/Carry-Forward action;
- exact immutable preview;
- lifecycle context needed to understand archived/read-only state.

Project Viewers may read this ordinary history but cannot see raw Audit Change
Items or security evidence.

Basic change summary:

For each Revision after the first, Ossie computes a safe structural summary
against the previous Revision in the same Site Edition:

- Pages added, changed, archived, restored, or renamed;
- Page slug/alias changes;
- Navigation changes;
- Snippets added, changed, or removed from use;
- Redirect/Gone Rule changes;
- media references changed;
- OpenAPI source changed;
- Site metadata or reader settings changed.

The first release does not require a perfect word-by-word rich-text diff. A Page
marked **Changed** links to both exact Revision previews so a teammate can
inspect it.

The summary is derived from immutable relational Revisions. It is not authored
free text and is not a replacement for Audit Evidence.

Required Publication history:

Authorized Project Members may see:

- Publication Sequence;
- exact Site Revision Number;
- publisher's safe display label;
- publish time;
- which explicitly selected Publish Links were updated or left unchanged;
- current/unlinked/older status;
- rollback target and safe reason when a rollback occurred.

Publication history never exposes passwords, link slugs in Audit evidence,
viewer sessions, credentials, private URLs, or public-reader identity.

Required Project Activity:

Extend the accepted curated Editor Activity model with concise Documentation
events such as:

- Site/Page/Snippet creation or archive/restore;
- grouped committed autosaves;
- checkpoint and restore;
- Carry-Forward;
- import;
- Publication;
- Publish Link create/update/rollout/rollback/revoke;
- Asset archive and purge outcomes.

Activity groups rapid compatible autosaves for readability but does not erase
their underlying Audit attribution. Project Viewers retain ordinary
Revision/Publication history but do not gain Editor Activity if the accepted
role boundary excludes it.

Required Audit and Access Evidence:

Documentation extends the accepted append-only evidence system for every
committed mutation and protected read that the coverage registry requires.

Evidence must:

- be written in the same business transaction where already required;
- preserve actor, source, command, resource, allowed safe changes, and outcome;
- exclude Page body, Snippet body, search query, comment text, password, token,
  public slug, private URL, storage key, raw import content, and exported bytes;
- use allowlisted safe identifiers and bounded scalar values;
- record denials only under the accepted non-revealing rules.

Audit and Access Evidence are security/accountability records. They are not
product analytics and cannot be queried to build hidden view counts, reader
profiles, search reports, or marketing dashboards.

Simple review in the first release:

Use the Question `14` model:

1. an Editor creates a manual checkpoint with an optional reason;
2. they share the exact authenticated Revision preview with another Project
   Member;
3. the teammate reviews that fixed Revision;
4. feedback happens through the team's existing communication channel;
5. the Editor updates the Working Draft and creates a later Revision.

Ossie does not claim the Revision is “approved,” “changes requested,” or
“pending” because no formal state exists yet.

Formal review later:

When real demand is proven, add a relational **Review Request** tied to one exact
Site Revision. A later design must settle:

- requester and reviewer eligibility;
- one or many required approvals;
- comments and threads;
- resolved/outdated comment behavior;
- what happens when a newer Revision is created;
- approval invalidation;
- publish blocking or override authority;
- external reviewer tokens;
- notifications;
- retention, export, deletion, and Audit.

Do not store review status as a loose field on the mutable Working Draft or
Publication.

Comments later:

Comments are deferred because they require durable anchors into changing rich
content, edit/delete policy, mentions, notifications, permission loss, archived
Pages, Revision context, moderation, export, and retention.

When added, a comment must point to an exact Review Request/Revision and a
stable supported Page/block anchor. It must not float ambiguously on “the latest
Page.”

Public feedback later:

Do not add “Was this helpful?”, free-text feedback, ratings, or issue forms in
the first release.

A later public-feedback design must cover:

- anonymous abuse and rate limits;
- spam and unsafe text;
- privacy notice and retention;
- Publish Link/Publication/Page attribution;
- whether password-protected readers may respond;
- who may view or export feedback;
- IP, user-agent, and referrer minimization;
- deletion and moderation;
- no weakening of public reader performance or access.

Analytics later:

Do not add third-party analytics scripts, cookies, fingerprints, reader
profiles, Page view counters, search-query dashboards, or cross-Site tracking in
the first release.

Allow only minimal operational measurements needed to run the service, such as:

- request duration;
- error and retry counts;
- build/index duration;
- cache hit/miss count;
- bounded aggregate resource use.

Operational measurements contain no Page body, raw search query, public slug,
password/token, private URL, IP/user-agent/referrer profile, or cross-request
reader identity beyond the already accepted security boundary.

A later product-analytics feature must be self-hosting-friendly, documented,
configurable, privacy-reviewed, retention-bounded, and clearly separated from
Audit/Access Evidence.

Page ownership later:

Do not add one required Page owner in V1.

- Project Membership already controls who can view and edit;
- one owner can become stale when a teammate leaves;
- Page ownership must not become hidden authorization;
- Site/Revision Audit already shows who changed content.

A later **Maintainers** feature may assign several active Project Members to a
Page or Site for responsibility, review routing, and reminders. It remains
descriptive workflow metadata and never grants access by itself.

Concrete scenario:

Amara creates Revision `6` with reason “Ready for the 2.0 launch review.” Lee
opens the exact Revision preview and sends feedback in the team's current chat.
Amara edits two Pages and creates Revision `7`.

Ossie shows:

- Revision `6` and `7`;
- the creator, time, and reason;
- that two Pages changed;
- exact previews for both;
- any later Publication using Revision `7`.

Ossie does not falsely label Revision `6` approved or store Lee's chat message.

Alternative:

Build comments, approvals, notifications, feedback, analytics, and Page owners
before the basic Documentation workflow ships.

Why not:

- they multiply permission, privacy, retention, and UI states;
- comments need stable rich-content anchors that the editor must first prove;
- required approval can block publishing and changes product authority;
- analytics and public feedback add tracking and abuse surfaces;
- the core value—author, checkpoint, publish, read, search, and carry
  forward—does not require them.

Tradeoff:

Teams use their current chat or issue tracker for feedback during the first
release, and there is no built-in approval gate or readership dashboard. They
still receive complete immutable history and accountable actions.

Reversibility:

Relational review, comments, maintainers, feedback, and analytics can be added
later against stable Site Revision and Publication identities. Removing hidden
tracking, unclear approval state, or comments attached to moving drafts would be
much harder.

Affected scope:

- Site Revision and Publication history UI
- safe change-summary computation
- Project Activity
- Audit and Access coverage/redaction
- future Review Request, comments, notifications, and preview tokens
- future public feedback and analytics privacy model
- future Page/Site maintainer model

Local evidence:

- `CONTEXT.md` Revision, Publication, Audit Event, Access Event, Project
  Activity, and Project role definitions;
- `docs/adr/0023-comprehensive-audit-and-access-evidence-from-day-one.md`;
- `docs/adr/0024-project-membership-governs-project-access.md`;
- `docs/plan/112-audit-evidence-core.md`;
- `docs/plan/114-access-evidence-and-compliance-timelines.md`;
- `docs/plan/115-project-membership-foundation.md`;
- Questions `14`, `16`, and `20` in this record.

Status:

Provisionally accepted, reopened in part, and resolved on 2026-07-30. Immutable
Site Revision and Publication history, exact previews, optional checkpoint
reasons, safe structural change summaries, curated Project Activity, and
complete accepted Audit/Access Evidence remain accepted. Basic private comments
are included in the first slice under Question `31`; fuller internal review
remains later in V1, and public feedback/product analytics remain later.
Audit/Access records remain security evidence and cannot be repurposed as hidden
analytics. All answers remain subject to the post-`130` recheck and final child
`131` acceptance.

Decision records after the sequence gate:

- `CONTEXT.md` for Documentation history and simple-review boundaries;
- the Documentation history/Audit ADR;
- the future Revision history, change summary, Activity, and evidence child
  plans;
- later separate review, feedback, analytics, and maintainer plans only after
  accepted demand;
- this grill record.

### Q24. Which API reference, playground, SDK, and interactive features belong
in the first slice, V1, or later?

Recommended answer:

Make safe read-only OpenAPI reference a first-slice capability because it is
central to Ossie's Documentation value.

Add a tightly controlled browser-direct **Try it** playground later in V1 after
the read-only renderer, access, origin-approval, and security proof passes.

Generate copyable request examples in V1. Defer complete downloadable SDK
generation, server-side API proxying, stored API environments/credentials,
OAuth login flows, mocks, and arbitrary interactive components.

Feature matrix:

| Capability | First slice | V1 after proof | Later/rejected |
| --- | --- | --- | --- |
| Upload self-contained OpenAPI File | Yes | Yes | — |
| Validate and show import issues | Yes | Yes | — |
| Read-only API reference | Yes | Yes | — |
| Operation search and deep links | Yes | Yes | — |
| Safe code examples | Basic | Expanded languages | — |
| Manual Page with one API Operation block | Yes | Yes | — |
| Exact Guide/Demo Publication blocks | Yes when available in the slice | Yes | — |
| Browser-direct “Try it” | No | Yes, disabled by default | — |
| Ossie server request proxy | No | No | Later only after separate threat model |
| Stored bearer/API credentials | No | No | Reject for V1 |
| OAuth/OpenID browser login flow | No | No | Later |
| Query/cookie API-key injection | No | No | Later only if safely proven |
| File upload/streaming playground | No | No | Later |
| Mock server | No | No | Later |
| Generated copyable request snippets | Basic | Yes | — |
| Full generated downloadable SDKs | No | No | Later |
| Arbitrary React/MDX widgets | No | No | Reject |
| Ossie-owned typed interactive blocks | Yes | Yes | Reviewed registry only |

First-slice OpenAPI goal:

A Project Editor can:

1. upload one self-contained supported OpenAPI JSON/YAML File;
2. inspect validation and safety issues;
3. attach the accepted source to a Documentation Page;
4. render a beautiful read-only API reference in Draft Preview;
5. create a Site Revision;
6. publish the same exact reference;
7. search and deep-link to an operation;
8. see that later Working Draft source changes do not alter the Publication.

The first slice does not send an API request.

OpenAPI domain model:

One Site Edition may own several **OpenAPI Sources**. Each source has:

- stable Working Draft identity;
- safe display name;
- exact immutable protected source File;
- detected supported OpenAPI version;
- content digest;
- validation status and bounded safe issue report;
- Row Version;
- accepted render settings;
- source replacement history through Site Revisions, not mutable File
  overwrite.

Replacing a source:

- uploads a new immutable File;
- validates it before changing the Working Draft;
- compares operations added, changed, and removed;
- reports broken Page/API Operation references;
- requires the current OpenAPI Source and Working Draft Row Versions;
- never mutates the old File or a Site Revision;
- does not change an existing Site Publication until a new Revision is
  published.

API Reference Page:

Use an Ossie-owned typed **API Reference** block on a normal Documentation Page.
It points to:

- one exact Working Draft OpenAPI Source;
- a selected safe group: whole source, tag, or operation set;
- accepted ordering and visibility settings;
- no credentials or executable renderer configuration.

The Page is the authored identity and Navigation destination. Operation views
under it are safe derived destinations from the exact OpenAPI Source, not
hundreds of independently editable Page rows.

For example:

```text
/api-reference
/api-reference/users/get-user
/api-reference/users/create-user
```

The exact public prefix follows the owning Page's frozen canonical path.
Operation identity uses normalized HTTP method plus path inside the exact source.
`operationId` may help display and linking but is not trusted as the only
identity.

Fumadocs may derive the reader operation tree and view from the safe source.
That derived tree is not authoritative Navigation or persistence. Do not
generate executable MDX files or make generated file paths into Ossie Page
identity.

Safe descriptions and examples:

- render OpenAPI title, summary, description, tags, methods, paths, parameters,
  request bodies, responses, schemas, examples, deprecation, and security-scheme
  descriptions as supported;
- sanitize every CommonMark description through Question `11`;
- ignore raw HTML and unsupported extensions safely;
- show examples as escaped data or code, never execute them;
- bound schema depth, example size, recursive references, and displayed
  variants;
- unknown or unsupported fields produce a visible safe limitation rather than
  disappearing silently or crashing the reader.

Renderer decision:

The Question `10` proof compares:

1. `fumadocs-openapi` inside the accepted Fumadocs reader; and
2. direct Scalar API Reference inside the same Ossie adapter.

Use one renderer, not both.

Start the proof with Fumadocs OpenAPI because it shares the accepted reader
layout and already supports endpoint content, code usages, request/response
schemas, TypeScript definitions, and a playground. Use direct Scalar if it is
materially better for accessibility, OpenAPI compatibility, customization,
bundle size, performance, or safe request control.

Whichever wins:

- pin its exact version;
- keep it behind an Ossie-owned API Reference adapter;
- feed it only already-validated immutable source data;
- disable remote source loading and default public proxies;
- prove React, browser, keyboard, mobile, zoom, CSP, and self-hosting behavior;
- replacing it must not migrate stored content, URLs, Revisions, or
  Publications.

Generated request examples:

First slice may show a small safe set such as:

- cURL;
- JavaScript `fetch`;

V1 may add other proven generators such as Python, Go, or Java when they are
correctly tested.

Rules:

- examples are generated from the exact frozen operation;
- user-entered request values may update the displayed example in memory;
- authentication values are replaced with clear placeholders;
- copy is allowed;
- examples never execute automatically;
- unsupported serialization displays a limitation instead of generating wrong
  code;
- vendor-provided code samples are escaped display text and never trusted as
  executable content.

Generated request examples are not generated SDKs.

V1 browser-direct playground:

The playground sends requests from the reader's browser directly to an approved
API server. It does not pass request or response bodies through Ossie's server.

Why:

- a server proxy creates a serious server-side request-forgery boundary;
- Fumadocs warns that its proxy can forward HTTP-only cookies and Authorization
  headers;
- a generic proxy could reach private infrastructure or become an open relay;
- browser-direct calls leave API authorization with the target API and make
  CORS requirements truthful.

The playground is **disabled by default**.

Origin approval:

- an imported OpenAPI `servers` entry is documentation, not automatic approval
  to send requests;
- a Project Admin or implicit Owner explicitly approves an exact HTTPS API
  origin for the Site;
- a Publish Link separately opts into playground access and may use only an
  origin approved for the exact frozen Site Publication;
- relative, protocol-relative, HTTP, localhost, loopback, link-local, private-
  network, reserved, credential-bearing, wildcard, and unapproved origins are
  blocked in public V1;
- redirects may not escape the exact approved origin;
- DNS/origin validation is repeated under the accepted security design;
- Content Security Policy `connect-src` is narrowed to accepted exact origins
  where deployment permits.

Self-hosted development HTTP/private-network support is deferred to an explicit
instance-admin policy. It must never become the public default.

Reader consent:

Nothing runs on page load.

Before sending, show:

- exact HTTP method;
- exact approved origin and path;
- query, headers, and body with secrets visually redacted;
- whether the operation may change or delete data;
- a clear **Send request** action.

`POST`, `PUT`, `PATCH`, and `DELETE` receive a stronger confirmation. OpenAPI
metadata cannot prove an operation is harmless, so the UI does not label it
safe merely because the description says so.

Credential boundary:

V1 may support manually entered:

- bearer value in the Authorization header;
- API key in an approved custom header.

Credentials:

- live only in memory in the current tab;
- are never sent to Ossie APIs;
- are never stored in the database, browser storage, URL, logs, Audit, Access
  Evidence, analytics, error reports, clipboard examples, or screenshots;
- are cleared on reload, tab close, logout, Site/Link change, and explicit clear;
- are never taken from Ossie cookies or viewer sessions;
- are redacted from request previews and response/error reporting.

Do not support cookie authentication, automatic browser credentials, query
API-key injection, OAuth/OpenID redirects, client secrets, mutual TLS, or
persistent environments in V1.

Request boundary:

- use `credentials: "omit"` so Ossie/browser cookies are not attached;
- allow only operations present in the exact frozen OpenAPI Source and enabled
  by the reader settings;
- validate path/query/header/body values against bounded supported schemas;
- block forbidden browser headers and unsafe URL construction;
- use an explicit timeout and response-size limit;
- do not follow a redirect to another origin;
- render response headers and bodies as escaped text/JSON, never active HTML;
- do not execute returned scripts, download returned executable content, or
  render response SVG/HTML in the Documentation origin;
- keep request and response values out of search, history, Audit, Access
  Evidence, analytics, and server logs;
- rate-limit UI sends locally and rely on the target API for its actual
  authorization and rate policy.

If the target API does not allow the Documentation origin through CORS, Ossie
shows clear setup guidance. V1 does not silently route through a public Scalar
proxy or an Ossie proxy to bypass CORS.

Publish Link and access behavior:

- playground enablement is link-specific because the same Site Publication may
  be public on one link and read-only on another;
- Restricted, Expired, Revoked, missing, removed-version, and password-denied
  readers cannot use it;
- enabling or disabling playground access revokes affected viewer runtime state
  as needed but does not mutate the Site Publication;
- a Page reader never gains target-API permission from Ossie; the target API
  still validates any manually supplied API credential.

SDK generation:

Defer complete SDK generation and hosting.

Full SDKs require:

- selected languages and generator versions;
- sandboxed code generation;
- dependency and template supply-chain review;
- reproducible builds;
- package naming/versioning;
- vulnerability updates;
- artifact storage and checksums;
- licenses and notices;
- signing, publishing, retention, and rollback;
- support expectations for generated code.

V1 may display author-supplied or generated request examples and safe
installation text. It does not claim those snippets are a maintained SDK.

Interactive Documentation components:

Accept only the Ossie-owned registry from Question `11`, including:

- callout;
- tabs;
- code sample;
- media;
- Reusable Documentation Snippet;
- exact Guide Publication;
- exact Interactive Demo Publication;
- read-only API Reference;
- one API Operation reference;
- V1 playground only inside the approved API components.

Guide and Demo blocks let a Documentation Page explain an API workflow and show
an exact existing tutorial without copying it. The Publication freezes the
exact referenced Guide/Demo Publication.

No arbitrary React component, iframe, script, package, MDX import, raw HTML
widget, or user-provided renderer enters the registry.

Concrete delivery:

**First slice**

```text
upload OpenAPI
  -> inspect/validate
  -> add API Reference block
  -> read-only draft preview
  -> checkpoint
  -> publish
  -> public read/search/deep link
```

**Later V1 child**

```text
Project Admin approves HTTPS API origin
  -> link explicitly enables playground
  -> reader enters temporary bearer/header key
  -> reviews exact request
  -> browser sends directly
  -> response renders as escaped data
```

Alternative:

Ship a server proxy and fully interactive playground in the first slice.

Why not:

- the proxy may forward authorization and cookies;
- server-side requests create private-network and open-relay risks;
- request credentials, destructive actions, CORS, redirects, response limits,
  and public access require their own proof;
- a failure would endanger the Documentation host, not just the target API.

Alternative:

Defer all OpenAPI support until after plain Documentation ships.

Why not:

- OpenAPI is central to the user's accepted Ossie vision;
- it is the strongest reason to use Fumadocs/Scalar rather than a generic rich
  text editor alone;
- a read-only reference can be proven safely without taking on API execution;
- delaying it risks proving the wrong content and reader architecture.

Tradeoff:

The first slice cannot call an API, and V1 browser-direct calls work only when
the target API allows the Documentation origin and the Project Admin approves
it. This is less convenient than a universal proxy but far safer and more
truthful.

Reversibility:

A narrowly allowlisted proxy, OAuth flow, stored non-secret environment, mock
server, SDK generator, or new typed block can be added later behind separate
security and lifecycle decisions. Removing leaked credentials or an abused
generic proxy would not be reversible.

Affected scope:

- OpenAPI Source and replacement/diff model
- API Reference and Operation typed blocks
- Fumadocs OpenAPI versus Scalar proof
- derived operation routes, Navigation, and search
- Site Revision and Publication snapshots
- approved origins and Publish Link playground settings
- browser request builder, credential memory, CORS, CSP, and response rendering
- rate/size/time limits and security tests
- future SDK, proxy, OAuth, mock, and component work

Primary and local sources:

- `https://www.fumadocs.dev/docs/integrations/openapi`
- `https://www.fumadocs.dev/docs/integrations/openapi/api-page`
- `https://www.fumadocs.dev/docs/integrations/openapi/server`
- `https://github.com/scalar/scalar`
- `https://spec.openapis.org/oas/v3.2.0.html`
- Questions `7`, `10`, `11`, `16`, `20`, and `22` in this record.

Status:

Provisionally accepted. The first Documentation slice includes safe, read-only
OpenAPI reference. Browser-direct API calls may follow later in V1 behind the
approved-origin, Publish Link, credential, confirmation, and response-safety
boundaries above. Ossie will not provide an API-call proxy or full SDK
generation in V1. This remains subject to recheck and final acceptance after
child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

## Pause Handoff

The workshop paused after the user provisionally accepted Question `24`.

- Completed: Questions `1` through `24`
- Remaining: Questions `25` through `32`
- Next question: Question `25`
- Sequence gate: all answers remain provisional until child `130` is merged,
  verified, and accepted
- Runtime work: none; this workshop changed only this grill record

## Batch Response Checkpoint

On 2026-07-30 the user asked to answer the remaining questions together.

Provisionally accepted:

- Question `25`: one primary Site language now; translated variants and fallback
  later
- Question `26`: correct public search/social metadata now; custom domains later
- Question `27`: prepare Publications before switching a live Publish Link;
  failed preparation leaves the current Publication untouched; rollback points
  back to an older immutable Publication
- Question `29`: archive first, preserve referenced immutable history and files,
  keep Audit/Access separate, and defer governed permanent deletion
- Question `30`: WCAG 2.2 AA for authoring and reading, plus measurable public
  reader performance targets
- Question `32`: the proposed small end-to-end Documentation vertical slice

Resolved on 2026-07-30:

- Questions `23` and `31`: the user accepted basic private comments in the
  first slice. Formal Review Requests, approval states and optional
  approval-before-Publication rules remain later in V1; approval does not block
  Publication in the first slice.

### Q25. Are localization and locale fallback part of the model now or
explicitly deferred?

Recommended answer:

Give every Documentation Site one required primary language using a standard
language tag such as `en`, `en-GB`, or `fr`. In the first release, every Page,
Navigation label, generated API reference label, search record, and public
reader surface inside that Site uses the primary language.

The primary language:

- supplies the public document language for browsers and assistive technology;
- is frozen into each Site Revision and Publication;
- may be changed in the Working Draft with a clear warning that the change
  applies to the whole Site;
- does not appear in Page identity, database IDs, or required first-release
  public URL paths.

Defer translated Page variants, translation workflows, automatic translation,
per-locale Navigation, and locale fallback.

When localization is added later:

- a translated Page must be an explicit maintained variant, not a hidden live
  machine translation;
- missing content must be shown clearly;
- Ossie must not silently show an old or different-language Page and imply that
  it is the selected translation;
- locale selection and fallback must be frozen in the Publication;
- search must remain exact-Publication and locale aware.

Alternative:

Build full localization and fallback in the first slice.

Why not:

- it multiplies authoring, Navigation, slug, internal-link, search, preview,
  publication, and staleness rules before the single-language Site is proven;
- automatic fallback can show a technically valid but outdated explanation;
- machine translation introduces privacy, quality, and provider decisions.

Alternative:

Create a separate Documentation Site for every language.

Why not:

- it duplicates Site identity, access, OpenAPI, Navigation, and Publication
  work;
- relationships between translations become informal and difficult to check;
- it makes a later first-class locale model harder.

Tradeoff:

V1 authors who need several languages must operate separate Sites or use an
external translation process. Ossie still records a truthful primary language
and remains structurally open to explicit translated variants later.

Reversibility:

Adding translated variants later is possible because stable Site, Page,
Revision, and Publication identities do not embed a locale. Omitting the
primary language now would weaken accessibility and make later migration less
reliable.

Affected scope:

- Documentation Site settings
- draft, Revision, and Publication snapshots
- public HTML language
- reader and authoring copy
- search metadata
- future translated Page and Navigation model

Status:

Provisionally accepted. Each Documentation Site has one primary language in the
first release. Translated variants and fallback are explicitly deferred. This
remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q26. What public-site search discovery, canonical URL, sitemap, robots,
social metadata, and custom-domain behavior is required or deferred?

Recommended answer:

Ship correct search-engine and social-sharing metadata for unrestricted public
Documentation, while deferring custom domains.

For an unrestricted active Publish Link, Ossie provides:

- a Page title and description;
- one declared canonical URL;
- a sitemap containing only current indexable destinations;
- robots metadata;
- social-sharing title, description, URL, and optional image;
- correct permanent redirects and removed-Page behavior from Question `18`.

Only one public entry for the same published content may be its indexable
canonical entry. If several Publish Links expose the same Site Publication,
one may be selected as primary; the others point search engines to that
canonical entry or remain unindexed. This avoids claiming several duplicate
official URLs.

The following are never indexable:

- Working Draft and Revision previews;
- private Project routes;
- password-protected or restricted links;
- revoked or expired links;
- non-current historical Publication routes;
- error and denied-access pages.

An unrestricted public Publish Link may explicitly disable search indexing.
Disabling indexing is guidance to search engines, not an access control; truly
private content must use a restricted access mode.

Defer custom domains such as `docs.example.com`. They require a later boundary
for domain ownership checks, DNS setup, certificates, host routing, canonical
URL migration, redirects, removal, and recovery.

Alternative:

Defer all search and social metadata.

Why not:

- public Documentation would be difficult to discover and share;
- missing canonical rules create duplicate public results;
- retrofitting URL meaning after indexing is costly.

Alternative:

Include custom domains in the first slice.

Why not:

- they do not prove the Documentation content model;
- certificate and domain lifecycle failures can make a correct Publication
  unavailable;
- the deployment and public-host trust boundary needs its own proof.

Tradeoff:

Early public Sites use Ossie-hosted URLs. Organizations that need a branded
domain must wait for a later child, but their content and Publication identity
do not need to change.

Reversibility:

A custom domain can later point to the same immutable Publication and issue
permanent redirects from the prior canonical entry. Recovering from several
competing canonical URLs would be harder, so canonical ownership is explicit
now.

Affected scope:

- Publish Link settings
- public reader metadata
- sitemap and robots responses
- Page descriptions and social images
- redirects, Gone Rules, and historical routes
- future custom-domain lifecycle

Status:

Provisionally accepted. Correct metadata, canonical selection, sitemap, robots,
and social sharing are required for unrestricted public Documentation. Private
and historical surfaces are not indexable. Custom domains are deferred. This
remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md` for public access meaning where needed
- this grill record

### Q27. What caching, rendering, invalidation, Publication preparation,
failure-recovery, and rollback model is viable for self-hosting?

Recommended answer:

Prepare and validate a complete immutable Site Publication before a Publish
Link may expose it. A failed preparation never replaces the currently live
Publication.

Publication flow:

```text
exact Site Revision
  -> validate complete graph
  -> prepare reader/search manifest
  -> mark preparation ready
  -> create/select immutable Site Publication
  -> atomically point chosen Publish Link entry to it
```

Preparation validates at least:

- Page and Navigation structure;
- slugs, aliases, redirects, and internal links;
- referenced Snippets, assets, Guide Publications, and Demo Publications;
- OpenAPI source and derived operation destinations;
- safe renderer output;
- exact-Publication search records.

If validation or preparation fails:

- the existing live Publish Link entry remains unchanged;
- the failed attempt receives a clear status and safe error summary;
- retry starts from the same exact Site Revision or a newer chosen Revision;
- no partial Page set, Navigation, or search index becomes public.

Rendering and caching:

- the database and protected file storage remain the source of truth;
- the public server renders from the exact immutable Publication manifest;
- self-hosting does not require permanently generating one HTML file for every
  Page;
- caches use immutable Publication identity plus resource identity or digest;
- mutable aliases and Publish Link entry routes resolve to an exact Publication
  before cached content is served;
- switching a link changes the small mutable pointer and does not mutate the
  old cache;
- old immutable cache entries may expire normally without becoming incorrect.

Rollback:

Rollback selects an older authorized immutable Site Publication for the Publish
Link entry. It does not restore content into the Working Draft, create a new
Revision, rebuild the old Publication, or delete the newer Publication.

Alternative:

Move the public link first and finish Page rendering or search afterward.

Why not:

- readers could receive broken Navigation, missing Pages, or search results
  from another state;
- a failed job could replace a healthy live Site;
- rollback would be unclear.

Alternative:

Generate and retain a complete permanent static-file tree for every
Publication.

Why not initially:

- large Sites multiply build duration and stored duplicate output;
- it adds filesystem deployment and cleanup rules without changing the
  immutable content model;
- exact on-demand rendering with immutable caches is sufficient for the first
  self-hosted architecture.

Tradeoff:

Publication takes a preparation step before becoming live, and the first
uncached read may perform server rendering. In return, live switches and
rollback are small, atomic, and safe.

Reversibility:

A later deployment may pre-render static output or place a content-delivery
cache in front of the same immutable Publication contract. A partial-publication
model would be much harder to repair.

Affected scope:

- Publication preparation jobs and status
- validation and safe failure reporting
- exact reader/search manifests
- Publish Link entry switching
- cache keys and invalidation
- rollback UI and authorization
- self-host operations and recovery

Status:

Provisionally accepted. A complete exact Site Revision is prepared before a
Publish Link switches. Failure leaves the current public Site untouched.
Rendering uses immutable Publication data and caches, and rollback repoints the
link to an older immutable Publication without rebuilding it. This remains
subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- a Publication preparation/rollback ADR if the final runtime proof shows that
  the decision remains difficult to reverse and surprising
- this grill record

### Q28. What operational limits are needed for Page size, Site size, build
duration, asset size, and concurrent Publication?

Recommended answer:

Do not impose commercial-style Project or Organization quotas by default in a
self-hosted Ossie installation.

Keep three different concerns separate:

1. Optional Organization quotas control how much Documentation the Organization
   may own or operate.
2. Deployment safety settings protect the self-hosted server from one
   accidentally or deliberately harmful request or job.
3. Correctness locks stop conflicting Publication work for the same Site
   Edition.

Organization quota model:

- quota fields are owned by the Organization;
- every quota is nullable;
- `null` has one exact meaning: **no Organization quota**;
- a positive value is enforced across all Projects in that Organization;
- the Organization receives clear current-usage and configured-limit
  information;
- reducing a limit below current use blocks further growth but does not delete,
  archive, or rewrite existing content;
- an Organization limit change is an authorized settings mutation with Audit
  coverage;
- V1 has no Project-specific quota allocation.

Possible Organization quota fields include:

- Documentation Site count;
- Documentation Page count;
- Documentation-owned file bytes;
- concurrent Documentation Publication jobs.

These fields should not be created speculatively. The implementation plan must
add only limits that have a real enforcement and usage-measurement path.

Effective behavior:

```text
Organization quota is null
  -> no Organization product quota

Organization quota is 100
  -> reject creation of item 101 with a clear limit error

Organization quota is lowered below current usage
  -> keep existing content
  -> reject further quota-increasing work
  -> allow deletion/archive/export and other safe corrective work
```

Project-specific quotas:

Defer them. All Projects initially share the Organization's allowance. A later
feature may let an Organization Owner allocate part of an Organization quota to
individual Projects if real usage proves that this control is needed.

Deployment safety settings:

These are separate from Organization quotas. They cover the maximum size and
complexity of one request or job, such as:

- one request body or uploaded file;
- one OpenAPI document and its parse complexity;
- one Publication job's execution time;
- total simultaneous heavy jobs for one server process.

The self-hosting operator controls these settings and can raise them to suit the
machine. They remain bounded because unlimited request memory, parser work, or
execution time could freeze or crash the host. Hitting one of these settings is
reported as a server safety error, not an Organization quota error.

Correctness lock:

Only one Publication job may actively prepare a given Site Edition at a time.
Another request may wait or receive a clear already-in-progress response. This
is not a paid limit and cannot be disabled by setting an Organization quota to
`null`; it prevents two jobs from racing and producing an unclear live result.

Alternative:

Hard-code the same Page, Site, storage, and Publication quotas for every Ossie
installation.

Why not:

- it conflicts with the self-hosted product model;
- the host knows its own storage and compute capacity;
- fixed numbers would be arbitrary before real Documentation usage is measured;
- changing them would become a compatibility problem.

Alternative:

Make every safety boundary nullable and treat `null` as unlimited work.

Why not:

- one very large request can exhaust server memory before normal validation;
- a deeply complex OpenAPI file can consume excessive parser time;
- unlimited simultaneous Publication work can make the installation
  unavailable;
- these are host-protection boundaries, not product quotas.

Tradeoff:

An Organization with all quota fields set to `null` can grow until the host
runs out of real storage or other capacity. Ossie must therefore report usage
and operational health truthfully even when it does not enforce a product
quota.

Reversibility:

Project allocations and additional Organization quota fields can be added later
without changing the meaning of existing `null` values. Changing `null` from
unlimited to inherited or limited later would be surprising and is rejected.

Affected scope:

- Organization settings and authorization
- usage counting and quota errors
- Documentation creation and upload paths
- Publication job scheduling
- deployment configuration and health reporting
- Audit coverage for limit changes
- future Project quota allocation

Status:

Provisionally accepted. Documentation quotas are Organization-owned, nullable,
and unlimited when `null`. V1 has no Project-specific quota. Separately,
self-hosting operators control bounded per-request and per-job server safety
settings, and a correctness lock prevents concurrent Publication preparation
for the same Site Edition. This remains subject to recheck and final acceptance
after child `130` passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- this grill record

### Q29. How are Audit history, soft deletion, retention, export, and
Organization/Project deletion applied to Documentation content?

Recommended answer:

Use archive-first lifecycle and preserve immutable or referenced history.
Do not build automatic permanent deletion for Documentation in V1.

Lifecycle:

- a Documentation Site, Site Edition, Page, Snippet, or Documentation Asset is
  archived before any future permanent removal;
- archive removes the resource from normal authoring choices but does not
  rewrite a Site Revision or Site Publication;
- an archived Project or Project Version makes its Documentation read-only
  under the already accepted Project rules;
- archive does not silently revoke an active public Publish Link;
- stopping public access requires changing or revoking the Publish Link.

Retention and references:

- Site Revisions and Site Publications are immutable and non-deletable in V1;
- files and exact Guide/Demo Publications remain protected while any Working
  Draft, Revision, or Publication references them;
- an unreferenced mutable upload may become eligible for a future governed
  cleanup process, but V1 does not automatically remove it;
- a database cascade must not erase Documentation history, shared assets, Audit
  Events, or Access Events.

Export:

- the safe Site ZIP from Question `22` may export the selected Documentation
  content and Documentation-owned files;
- reused protected assets are included only through an authorized,
  self-contained export rule;
- exports do not include credentials, private request values, raw editor
  internals, hidden security data, or unrelated Project content;
- Audit and Access Evidence remains a separate security/compliance concern and
  is not inserted into a content ZIP.

Audit and Access:

- accepted Documentation mutations create Audit Events and safe change items;
- meaningful private/public reads create Access Events under the existing
  evidence rules;
- comments or reviews added by Question `31` receive their own safe actions;
- Audit and Access Evidence remains append-only and retained for the
  Organization lifetime;
- it is not selectively deleted when a Page, Site, Project, member, or public
  link is archived, removed, or revoked.

Permanent deletion:

Permanent Organization deletion, legal erasure, retention schedules, and
physical file cleanup require a later governed design. It must resolve public
link revocation, immutable history, shared references, evidence retention,
backup behavior, operator authority, dry-run reporting, and recovery before
deleting anything.

Alternative:

Hard-delete a Page or Site immediately when an author selects Delete.

Why not:

- immutable Publications could lose content or files;
- shared references could break;
- Audit/Access history could be weakened;
- public URLs and rollback would become untruthful;
- recovery would be impossible.

Tradeoff:

Archived and historical content continues to consume storage. Self-hosting
operators receive truthful usage information but no unsafe automatic cleanup
claim in V1.

Reversibility:

A reference-aware governed purge can be added later. Reconstructing deleted
Publication content, evidence, or shared files would not be reliably possible.

Affected scope:

- Documentation archive actions and filters
- Project and Project Version archive behavior
- Revision, Publication, and Publish Link retention
- protected file references
- content ZIP export
- Audit and Access coverage
- future purge, Organization deletion, backup, and cleanup work

Status:

Provisionally accepted. Documentation uses archive-first lifecycle, preserves
immutable and referenced history, keeps content export separate from
Audit/Access Evidence, and does not implement automatic permanent deletion in
V1. This remains subject to recheck and final acceptance after child `130`
passes.

Decision records after the sequence gate:

- `CONTEXT.md`
- the Documentation history/Audit ADR
- this grill record

### Q30. What accessibility and performance targets apply to authoring and the
published reader?

Recommended answer:

Require WCAG 2.2 Level AA for both the Documentation authoring experience and
the public reader. Treat accessibility as an acceptance condition, not optional
polish.

Both surfaces must cover, as applicable:

- complete keyboard operation with visible, unobscured focus;
- logical headings, landmarks, names, descriptions, and status announcements;
- screen-reader access to Navigation, search, editor controls, validation,
  comments/review, code, tables, and API reference;
- sufficient text, control, focus, and non-text contrast;
- no color-only meaning;
- pointer targets and alternatives to dragging;
- zoom, text resizing, and reflow at a narrow 320 CSS-pixel viewport without
  losing required actions or content;
- reduced-motion behavior and no essential meaning conveyed only by motion;
- clear loading, empty, error, conflict, permission, and Publication states;
- accessible authentication and password-link behavior;
- Page-author checks for heading order, link text, image alternative text, and
  table structure without pretending automated checks prove full conformance.

The editor may warn about author-created accessibility problems. Publication
blocks only objectively invalid required structure defined by the
implementation plan; subjective guidance remains a warning with a clear
explanation.

Public-reader performance target:

At the 75th percentile of real supported-device visits, aim for current "good"
Core Web Vitals:

- Largest Contentful Paint at or below 2.5 seconds;
- Interaction to Next Paint at or below 200 milliseconds;
- Cumulative Layout Shift at or below 0.1.

Authoring performance:

- typing and common editor actions remain immediately responsive;
- Page save does not block continued editing;
- large Navigation and OpenAPI views use bounded rendering rather than placing
  every hidden item in the browser at once;
- expensive validation and Publication preparation expose progress and can
  fail safely;
- performance verification uses representative small and upper-bound synthetic
  Sites rather than customer content.

Alternative:

Apply accessibility and measurable performance only to the public reader.

Why not:

- authors with disabilities must be able to create and publish Documentation;
- an inaccessible editor prevents accessible output from being maintained;
- slow authoring encourages unsafe workarounds and lost changes.

Tradeoff:

Some rich editor, OpenAPI, and animation choices may be rejected or simplified
when they cannot meet keyboard, screen-reader, reflow, or response targets.

Reversibility:

Targets and measurements can become stricter later. Shipping inaccessible
authoring structures or a renderer that requires a complete rewrite would be
much more costly.

Affected scope:

- editor and reader component choices
- Tiptap and Fumadocs/Scalar proofs
- keyboard, screen-reader, zoom, reflow, and reduced-motion tests
- author-created content guidance
- rendering, search, Navigation, and API-reference performance
- browser evidence and production measurement

Primary sources:

- `https://www.w3.org/WAI/standards-guidelines/wcag/`
- `https://www.w3.org/TR/WCAG22/`
- `https://web.dev/articles/defining-core-web-vitals-thresholds`
- child `129` accessibility, motion, performance, and browser evidence

Status:

Provisionally accepted. Documentation authoring and reading target WCAG 2.2 AA.
The public reader targets good Core Web Vitals at the 75th percentile, and the
editor must remain responsive under representative bounded content. This
remains subject to recheck and final acceptance after child `130` passes.

Decision records after the sequence gate:

- Documentation acceptance criteria and verification plans
- this grill record

### Q31. What are the strict first-slice and V1 exclusions?

Recommended answer:

Keep the first slice narrow, but include basic internal comments because the
user has identified team discussion as part of the Documentation value.

First-slice collaboration:

- Project Members may create private Page-level comment threads;
- a comment may optionally target a stable authored block identity;
- threads support replies, mentions, resolve, and reopen;
- a deleted or substantially changed target leaves the thread recoverable at
  Page level rather than deleting it;
- comments belong to the mutable review workspace, never to public Page content;
- Site Revisions and Publications do not become mutable when comments change;
- comments never appear to anonymous/public readers;
- comment creation, edit where allowed, resolve, reopen, and removal receive
  authorization and safe Audit coverage;
- notification delivery may be deferred, so a mention must not falsely promise
  that an email or external message was sent.

Later in V1:

- Review Requests;
- reviewer states such as Approved and Changes Requested;
- notifications;
- Page ownership or maintainers;
- review and change-history presentation;
- an optional Site rule requiring approval before Publication;
- a deliberate Admin/Owner override with a required reason and Audit record.

Public visitor feedback and product analytics remain later. They require
separate consent, privacy, spam/abuse, retention, identity, and self-hosting
decisions. Audit and Access Evidence cannot be reused as hidden product
analytics.

Other strict first-slice exclusions:

- simultaneous live multi-person editing;
- offline editing and automatic conflict merge;
- Git or GitHub synchronization;
- translated Page variants and locale fallback;
- custom domains;
- arbitrary MDX, JavaScript, React components, HTML, iframes, or external
  renderers;
- API request execution, API proxying, stored credentials, OAuth, and full SDK
  generation;
- Organization-wide or cross-artifact search;
- merging an import into an existing populated Site;
- automatic public access to historical Publications;
- automatic permanent deletion or retention cleanup.

Alternative:

Defer every collaboration feature until after the whole V1 Documentation
system.

Why not:

- internal discussion is part of the user's stated team workflow;
- proving stable comment anchoring early checks that the structured editor model
  can support review without tying comments to fragile text offsets;
- adding it only after the editor and Page persistence are fixed could force a
  more disruptive change.

Alternative:

Put comments, mandatory approval, public feedback, analytics, notifications,
and live collaboration in the first slice.

Why not:

- these are different permission, privacy, retention, delivery, and concurrency
  problems;
- mandatory approval changes Publication authority and needs explicit bypass
  and stale-approval rules;
- public feedback and analytics collect data from people outside the Project;
- live editing is not required to prove durable comment threads.

Tradeoff:

The first slice supports useful internal discussion but not a complete editorial
workflow. Authors may need to revisit Pages to discover mentions until
notifications ship.

Reversibility:

Review Requests, approval gates, notifications, public feedback, analytics, and
live editing can be layered onto stable comments, Page identities, Revisions,
and Publications. Allowing comments to mutate published content or Audit data
would be difficult to undo and is rejected.

Affected scope:

- Page/block stable identities
- comment thread persistence and authorization
- Project Member roles
- editor comment UI
- Audit actions and privacy
- Revision/Publication immutability
- future review, approval, notification, ownership, feedback, and analytics
  children

Status:

Provisionally accepted on 2026-07-30. Basic private Page comment threads,
replies, mentions, resolve/reopen behavior, stable-block anchoring with Page
fallback, authorization, privacy, and safe Audit coverage are part of the first
slice. Formal Review Requests, approval states, notifications, maintainers, and
optional approval-before-Publication rules remain later in V1. Public feedback,
product analytics, and live collaboration remain later. This outcome remains
subject to the post-`130` recheck and final child `131` acceptance.

Decision records after the sequence gate:

- `CONTEXT.md`
- a collaboration/review ADR only if the final approval authority decision
  meets the ADR threshold
- this grill record

### Q32. Which vertical slice proves the Documentation model with the least
irreversible complexity?

Recommended answer:

Build one small end-to-end Documentation Site that proves the accepted domain,
OpenAPI, Publication, reader, and rollback contracts.

The slice:

1. Create one Documentation Site inside one Project.
2. Create its Site Edition for one Project Version.
3. Author two safe Pages with stable identities.
4. Add Navigation, stable slugs, and one internal Page link.
5. Upload, inspect, and validate one self-contained OpenAPI file.
6. Add one read-only API Reference block and derived operation destinations.
7. Autosave the two Pages independently with Row Version conflict protection.
8. Add and resolve one private Page comment.
9. Preview the complete Working Draft.
10. Create one immutable Site Revision.
11. Publish through the existing Publish Link model.
12. Read the exact public Publication with Navigation, search, Page links, and
    direct API operation links.
13. Change the Working Draft and prove the first Publication did not change.
14. Create and expose a second Publication.
15. Roll the Publish Link entry back to the first Publication without
    rebuilding or mutating either Publication.

The slice must also prove:

- Organization tenant isolation and Project Membership authorization;
- restricted draft/revision access and exact public-link access;
- safe authored content and asset access;
- failed validation leaves the existing live Publication untouched;
- keyboard, screen-reader, mobile/reflow, reduced-motion, console, request
  failure, loading, empty, permission, conflict, and error behavior;
- no Documentation runtime claim is made until real database and browser
  evidence passes.

Explicitly outside this slice are the later-V1 and later items in Question `31`,
including API calls, Git synchronization, translations, custom domains, full
review workflow, public feedback, analytics, and permanent deletion.

Alternative:

Start with only a plain rich-text Page and postpone OpenAPI, public search, and
rollback.

Why not:

- it would not prove the user's central API-documentation vision;
- it could validate an editor while leaving the wrong reader and Publication
  architecture undiscovered;
- it would not test the strongest whole-Site consistency requirements.

Alternative:

Start with every V1 capability.

Why not:

- a failure would not reveal which foundational boundary is wrong;
- several reversible features would obscure the small irreversible domain and
  Publication choices;
- the first child could not be closed with focused evidence.

Tradeoff:

The slice is broader than a single Page editor but deliberately excludes the
riskier request-execution and full collaboration workflows. It produces a
genuinely useful read-only API Documentation path rather than a disconnected
technical proof.

Reversibility:

Later blocks, access choices, import paths, API calls, review workflow, and
custom domains can reuse the proven Site/Edition/Revision/Publication model.
Changing that model after building all V1 features would be much harder.

Affected scope:

- the ordered implementation child sequence beginning at `132`
- Documentation persistence and contracts
- authoring and preview
- OpenAPI validation and rendering
- Navigation, links, and search
- Revision, Publication, Publish Link, failure, and rollback
- authorization, security, accessibility, performance, and browser evidence

Status:

Provisionally accepted for the base slice, including the private comment proof
at step `8`. This remains subject to recheck against the merged child
`129`/`130` result and final child `131` acceptance.

Decision records after the sequence gate:

- `CONTEXT.md`
- the expanded child `131` feature matrix and threat model
- the ordered implementation children beginning at `132`
- this grill record
