# Ossie Context

Ossie captures real software workflows and turns those captures into shareable
Guides and Interactive Demos. It also ships the first complete vertical slice
of version-aware Product Documentation Sites. Remaining Documentation V1 work
is sequenced separately; Video remains later.

This context owns canonical product language. It contains both implemented alpha concepts and accepted target terms from Master Plan `005`; inclusion here does not mean a target capability has shipped. `docs/project-zoomout-status.md` and `docs/roadmap.md` own the current-versus-planned implementation boundary.

## Language

**Capture**:
Source material recorded from a real software workflow.
_Avoid_: Recording as a synonym for the final guide or demo

**Capture Session**:
One source recording run that groups captured events and assets inside one Project Version. Its Project Version becomes immutable when capture starts or the first Capture Event/Asset is created.
_Avoid_: Guide, demo

**Capture Event**:
One recorded action or moment inside a capture session.
_Avoid_: Step, scene

**Manual Capture**:
A user-triggered capture event that forces a screenshot or step-worthy moment.
_Avoid_: Automatic event

**Redaction**:
The removal or visual hiding of sensitive captured information.
_Avoid_: Deleting original capture

**Suggestion**:
Optional future assistive content proposed by automation or AI for user review.
_Avoid_: Source of truth

**Capture Asset**:
A reusable screenshot, HTML snapshot, or related media file produced by capture.
_Avoid_: Guide screenshot, demo page

**Derived Asset**:
A processed variant of a capture asset, such as a thumbnail or redacted image.
_Avoid_: Edited original

**Protected Shared Asset**:
A Capture Asset referenced by authored working state, an Artifact Revision, or a Published Artifact. Archiving hides it from new selection, but existing references remain resolvable and its File cannot be physically purged while protected.
_Avoid_: Independent binary copy, safely deletable archived asset

**File**:
A stored binary or text object with physical storage metadata.
_Avoid_: Capture asset

**Screenshot Capture**:
A capture asset that stores the visual screen state as an image.
_Avoid_: HTML replay

**HTML Snapshot**:
A capture asset that stores serialized page structure for future replay or inspection.
_Avoid_: Screenshot

**Instance**:
A hosted Ossie deployment that the extension and apps connect to. Technical configuration may retain the former name for compatibility.
_Avoid_: Workspace, organization

**Extension Session**:
An extension-scoped authenticated session for one Ossie instance.
_Avoid_: Web session

**Guide**:
A Scribe-style document artifact made for reading and following a process.
_Avoid_: How-to demo, doc demo

**Guide Block**:
One ordered visible unit inside a guide.
_Avoid_: Widget

**Guide Step**:
A guide block that instructs the reader to perform or understand one workflow action.
_Avoid_: Capture event, demo scene

**Guide Annotation**:
A visual mark or callout attached to guide content.
_Avoid_: Hotspot

**Interactive Demo**:
A Storylane-style walkthrough artifact made for guided interaction.
_Avoid_: Guide, walkthrough doc

**Artifact**:
The stable identity of one authored output, such as a Guide or Interactive Demo, across Project Versions. It is identity-only in V1: it has no user-facing lifecycle, and title, description, and lifecycle belong to Artifact Editions.
_Avoid_: Artifact edition, artifact revision, published artifact

**Artifact Edition**:
The one authored representation of an Artifact for one Project Version. It owns mutable, non-unique title and description. An Artifact has at most one Artifact Edition for each Project Version. An Edition is `draft` while editable and `archived` while read-only; Publication is tracked separately.
_Avoid_: Parallel audience variant, revision, publication

**Artifact Revision**:
An immutable authoring checkpoint inside one Artifact Edition, created by a manual checkpoint, Publication, or Carry-Forward. An unchanged latest Revision may be reused rather than duplicated.
_Avoid_: Project version, mutable row version, published artifact

**Artifact Revision Number**:
The user-visible sequence of immutable Artifact Revisions within one Artifact Edition.
_Avoid_: Row version, publication sequence, project version

**Row Version**:
An internal optimistic-concurrency counter for mutable records. It is not user-facing authoring or publishing history.
_Avoid_: Artifact revision number, publication sequence, project version

**Working Draft**:
The one mutable authored state inside an Artifact Edition. Normal saves and autosaves update the Working Draft with Row Version conflict protection without creating Artifact Revisions.
_Avoid_: Artifact revision, published artifact

**Audit Event**:
Application- and database-enforced append-only evidence of one successfully committed state-changing operation. It records the organization/project scope, root subject, action, actor or source, request context, and occurrence time, and commits atomically with the operation.
_Avoid_: Application log, artifact revision, failed attempt

**Audit Change Item**:
One explicit entity, child-record, or field change within an Audit Event. It records the operation and typed before/after scalar values without becoming product state or storing a JSON document.
_Avoid_: Working draft, generic metadata, mutable history row

**Access Event**:
Append-only evidence that an actor or anonymous public consumer accessed or attempted to access a logical product resource. It records the resource, route/action, outcome, and available tenant/Project/access context without storing credentials or content.
_Avoid_: Audit change item, static asset request, application log

**Carry-Forward**:
An atomic, idempotent operation that creates missing Artifact Editions in one target Project Version from selected Artifact Editions in one source Project Version. It copies Edition-owned editable structures into independent draft records, reuses Protected Shared Assets, records one immediate source Edition, never overwrites an existing target Edition, never partially succeeds, and never synchronizes later changes automatically.
_Avoid_: Merge, synchronization, multi-source batch, overwrite

**Demo Scene**:
One interactive screen state inside an interactive demo.
_Avoid_: Guide block, page

**Demo Hotspot**:
An interactive target inside a demo scene.
_Avoid_: Guide annotation, widget

**Demo Transition**:
A navigation rule from one demo scene to another.
_Avoid_: Step order

**Project**:
A workspace grouping related captures, guides, and interactive demos for a product or workflow area.
_Avoid_: Folder, software

**Archived Project**:
A Project-level effective read-only state that preserves all child lifecycle states. It blocks new authoring but does not automatically revoke existing Published Artifacts or Publish Links.
_Avoid_: Cascaded child archive, publication revocation, permanent purge

**Project Version**:
A release context representing one meaningful product state or maintained release line inside a Project. It has a free-form user-facing name, optional description/release date, a canonical URL-safe slug with permanent former-slug aliases, an explicit manual position, and an `active` or `archived` lifecycle; semantic-version formatting and inferred ordering are not required.
_Avoid_: Audience, permission group, deployment environment, arbitrary content folder, API version, artifact revision

**Project Version Alias**:
A permanent former slug for one Project Version that redirects to its current canonical slug. It remains project-scoped and cannot be reassigned.
_Avoid_: Reusable slug, second Project Version identity

**Default Project Version**:
The one active Project Version used as a Project's initial version context. New Projects initially use a real Project Version named `Main`; it is neither a moving alias to the newest release nor a Git branch.
_Avoid_: Latest-version alias, versionless fallback

**Organization**:
A team or company that owns users, projects, captures, guides, and interactive demos.
_Avoid_: Company when referring to the tenant

**User**:
A login-capable person using Ossie.
_Avoid_: Organization user when referring to authentication identity

**Organization Member**:
A user's membership and role inside an organization.
_Avoid_: User when referring to organization-specific membership

**Org User**:
The canonical implementation name for an organization member.
_Avoid_: Organization member in code/table names

**Owner**:
An organization member with full control over one organization.
_Avoid_: Administrator when referring to an organization-scoped role

**Owner Bootstrap**:
The explicit setup command that creates the first user, default organization, and owner org user for a self-hosted instance.
_Avoid_: Public signup, public bootstrap endpoint

**Deployment Mode**:
Whether an instance is operated as self-hosted or hosted.
_Avoid_: Environment when referring to product setup behavior

**First-Run Setup**:
The self-hosted onboarding flow that creates the first owner, user, and organization for an uninitialized instance.
_Avoid_: Signup

**Web First-Run Setup**:
The browser-based first-run setup screen for self-hosted instances.
_Avoid_: Hosted signup page

**Portal App**:
The React web application used by authenticated Ossie users.
_Avoid_: Backend static pages

**API Server**:
The Fastify application that owns HTTP APIs, auth cookies, and backend adapters.
_Avoid_: Portal host when referring to frontend serving

**Signup Onboarding**:
The hosted onboarding flow where a new user registers and creates or joins an organization.
_Avoid_: Owner bootstrap

**Project Inbox**:
A default project-like workspace used only if quick capture needs a place to land before the user organizes it.
_Avoid_: Orphan captures

**Project Workspace**:
The portal surface where a project's captures, guides, and interactive demos are managed.
_Avoid_: Project detail page when referring to the full operational workspace

**Project Membership**:
An Organization Member's access relationship to one Project, carrying a Project Role of Project Admin, Editor, or Viewer.
_Avoid_: Organization membership, Project Version membership

**Project Admin**:
A Project Member who manages Project Membership, Project settings, Project Versions, default/archive lifecycle, and safe asset purge, and also has all Project Editor capabilities.
_Avoid_: Organization Owner

**Project Editor**:
A Project Member who can capture, author, checkpoint, Carry Forward, and publish Project content without managing Project structure or membership.
_Avoid_: Project Admin, Project Viewer

**Project Viewer**:
A Project Member with read-only access to Project content.
_Avoid_: Public Publish Link visitor

**Guide Editor**:
The editor for Scribe-style guide documents.
_Avoid_: Demo editor

**Interactive Demo Editor**:
The editor for Storylane-style interactive demos.
_Avoid_: Guide editor

**Published Artifact**:
An immutable, non-deletable V1 publication record for one exact Artifact Revision. It remains authorized Project publication history even when no active Publish Link references it.
_Avoid_: Draft, live artifact

**Publication Sequence**:
The user-visible sequence of immutable Published Artifacts within one Artifact Edition.
_Avoid_: Artifact revision number, row version, project version

**Publish Link**:
A stable shareable access route for one authored output. The implemented Guide/Interactive Demo form belongs to one Artifact and exposes explicitly selected Artifact Editions through immutable Published Artifact entries. The accepted Documentation form belongs to one Documentation Site and exposes explicitly selected Site Editions through immutable Site Publication entries. Each link has one explicit default version and one link-wide access policy.
_Avoid_: Draft link

## Documentation Language: Shipped Through Child 133 And Accepted V1

Documentation Site, Site Edition, Site Working Draft, Documentation Page,
Navigation Tree, redirect/alias rules, OpenAPI Source, Documentation Asset,
private comments, Site Revision, Site Publication, and Documentation Publish
Link were implemented by child `132`. Child `133` adds Edition-owned reusable
snippets, the complete constrained V1 content block set, exact Guide and
Interactive Demo Publication reference cards, a Documentation Asset library,
and authorized same-Project Capture Asset reuse. Carry-Forward and later
review/lifecycle extensions below remain accepted V1 target language and must
not be described as shipped yet.

The terms below are accepted by child `131` for implementation beginning at
`132`. They describe the target domain and do not claim shipped tables, routes,
packages, editor, reader, search, or navigation.

**Documentation Site**:
The stable Project-owned identity of one customer-authored documentation site or
knowledge base across Project Versions. A Project may own multiple Documentation
Sites.
_Avoid_: `apps/docs`, guide, folder, Site Edition

**Site Edition**:
The one authored representation of a Documentation Site for one Project Version.
A Site has at most one Site Edition for each Project Version.
_Avoid_: Translation, audience variant, Site Revision

**Site Working Draft**:
The one mutable aggregate inside a Site Edition. It contains the edition-owned
Pages, Navigation Tree, reusable snippets, settings, redirects, OpenAPI Sources,
and Documentation Asset references, with resource-level Row Version protection.
_Avoid_: Site Revision, Site Publication, Tiptap document

**Documentation Page**:
A stable edition-owned authoring identity for one page. Its mutable content and
metadata are saved with Row Version protection and become public only through a
whole-Site Revision and Publication.
_Avoid_: Independently published artifact, Guide block

**Navigation Tree**:
The authoritative ordered, acyclic, edition-owned structure of Documentation
Pages and Navigation Groups.
_Avoid_: Derived Fumadocs tree, folder filesystem

**Navigation Group**:
A stable non-Page grouping node in a Navigation Tree.
_Avoid_: Documentation Page, Project

**Reusable Documentation Snippet**:
Edition-owned constrained content reusable by Pages in one Site Edition Working
Draft. It is copied, not live-linked, by Carry-Forward and is not shared live
across Sites or Editions.
_Avoid_: Cross-site component, executable MDX

**Documentation Asset**:
An Edition-owned protected File referenced by Documentation working state,
Revisions, or Publications. Documentation content may alternatively reference
an authorized same-Project Capture Asset without copying the binary. A
Derived/Redacted Asset source remains conditional future scope because no
owning runtime domain exists.
_Avoid_: Public URL, safely purgeable archived file

**OpenAPI Source**:
An uploaded, bounded, self-contained OpenAPI JSON or YAML File plus relational
validation metadata. It is never a live remote authority.
_Avoid_: Remote specification URL, API credential, executable API client

**API Reference Block**:
An Ossie-owned typed Page block that renders an authorized OpenAPI Source. It is
read-only in the first slice.
_Avoid_: Arbitrary widget, server-side API proxy

**Page Slug Alias**:
A permanent former Page slug within one Site Edition. It redirects to the Page's
current canonical slug and cannot be reassigned.
_Avoid_: Moving latest alias, reusable slug

**Documentation Redirect Rule**:
An explicit edition-owned redirect or intentional `gone` outcome included in a
Site Revision and validated against cycles and canonical Page routes.
_Avoid_: Implicit broken-link fallback

**Site Revision**:
A complete immutable checkpoint of one Site Edition. It freezes included Pages
and content, navigation, aliases, redirects, snippets, OpenAPI Sources,
Documentation Asset references, Site settings, and search-relevant state.
_Avoid_: Page Row Version, mutable draft, Publication

**Site Revision Number**:
The user-visible sequence of immutable Site Revisions within one Site Edition.
_Avoid_: Row Version, publication sequence, Project Version

**Site Publication**:
An immutable publication record for one exact Site Revision. A stable Publish
Link may expose it only after all reader, search, and metadata material is ready.
_Avoid_: Mutable deployment, draft preview

**Site Publication Sequence**:
The user-visible sequence of immutable Site Publications within one Site
Edition.
_Avoid_: Site Revision number, Row Version, Project Version

**Documentation Comment Thread**:
A private Project-member authoring discussion attached to one Documentation Page
and, when possible, a stable block anchor. Threads, replies, mentions, resolve,
and reopen state are excluded from Site Revisions and Site Publications.
_Avoid_: Public feedback, published annotation, approval gate

**Documentation Draft Preview**:
An authenticated view of current mutable Site Working Draft state. It is not an
immutable Revision or a public Publication.
_Avoid_: Publish Link, Site Publication

## Relationships

- A **Project** contains many **Captures**
- A **Project** can contain many **Project Versions**
- Every **Project Version** belongs to exactly one **Project**
- A **Project Version** can have many permanent **Project Version Aliases**
- Every **Project Version Alias** belongs to exactly one Project Version and cannot be reassigned within the Project
- Every **Project** has exactly one active **Default Project Version**
- Changing the **Default Project Version** does not move existing Captures or artifact Editions between Project Versions
- Creating another **Project Version** does not freeze existing Project Versions; every non-archived Project Version remains editable according to permissions
- An **Archived Project** makes its child content effectively read-only without changing the children's stored lifecycle states
- Restoring an **Archived Project** restores its prior child behavior, while its existing Published Artifacts and Publish Links remain accessible throughout

- A **Capture Session** contains many **Capture Events**
- A **Capture Session** contains many **Capture Assets**
- A **Capture Asset** can have many **Derived Assets**
- A **Capture Asset** references one **File**
- A **Protected Shared Asset** remains resolvable by existing references after it is archived
- A **File** cannot be physically purged while its Capture Asset is protected by authored working state, an Artifact Revision, or a Published Artifact
- A **Project** contains many **Guides**
- A **Project** contains many **Interactive Demos**
- Every **Capture** belongs to exactly one **Project**
- Every **Capture Session** belongs to exactly one **Project**
- Every **Capture Session** belongs to exactly one **Project Version** inside its Project
- An empty, unstarted **Capture Session** draft may change Project Version; a started or non-empty Capture Session may not
- Every **Guide** belongs to exactly one **Project**
- Every **Interactive Demo** belongs to exactly one **Project**
- An **Organization** contains many **Projects**
- An **Organization Member** can have **Project Memberships** in many Projects
- Every **Project Membership** belongs to exactly one Organization Member and one Project in the same Organization
- A **Project Membership** has one Project Role: Project Admin, Project Editor, or Project Viewer
- An **Organization Owner** has implicit Project Admin access to every Project
- **Project Versions** inherit Project Membership permissions and do not have separate memberships in V1
- Project Admins manage Project structure and membership; Project Editors own content authoring and Publication; Project Viewers have read-only Project access
- A **User** can be an **Organization Member** of many **Organizations**
- An **Organization Member** belongs to exactly one **Organization**
- An **Org User** is the implementation record for an **Organization Member**
- An **Owner** is an **Org User** with full organization control
- **Owner Bootstrap** creates the first **User**, **Organization**, and owner **Org User**
- **Deployment Mode** determines whether an instance defaults to **Web First-Run Setup** or **Signup Onboarding**
- The **Portal App** calls the **API Server**; the API Server does not own portal static hosting by default
- Organization-owned records are audited by **Org User**, not directly by **User**
- Every successfully committed state-changing operation creates exactly one logical **Audit Event** with one or more explicit **Audit Change Items**
- An **Audit Event** and its business mutation commit or roll back together
- Every committed Working Draft autosave batch is auditable without creating an Artifact Revision
- Audit Events and Audit Change Items are append-only and are not mutable product state
- Meaningful authenticated reads, public Publish Link views, downloads, authentication outcomes, authorization denials, and extension API access create append-only **Access Events**
- **Access Events** remain separate from mutation Audit Events but may appear together in an authorized activity view
- Organization Owners can inspect organization-wide audit/access evidence; Project Admins can inspect evidence scoped to their Projects
- Project Editors receive a curated Project activity timeline rather than the raw compliance trail
- Project Viewers see ordinary Revision and Publication history but cannot query Audit Change Items or Access Events
- Viewing audit/access history creates an Access Event
- Audit Events, Audit Change Items, and Access Events are retained indefinitely while their Organization exists; Project/member/content archive, removal, or revocation never deletes them
- Runtime application credentials can append and perform authorized reads of audit/access evidence but cannot update, delete, or truncate it
- A **Capture Asset** can be reused by many **Guides**
- A **Capture Asset** can be reused by many **Interactive Demos**
- A **Guide** contains many **Guide Blocks**
- A **Guide Block** may have exactly one **Guide Step** when its block type is `step`
- A **Guide Step** may reference one **Capture Asset**
- A **Guide Step** may reference one **Capture Event**
- A **Guide Step** may have many **Guide Annotations**
- A **Guide** and an **Interactive Demo** are separate artifact types
- A **Guide** or **Interactive Demo** has a stable **Artifact** identity across Project Versions
- An **Artifact** can have many **Artifact Editions**
- Every **Artifact Edition** belongs to exactly one **Artifact** and exactly one **Project Version**
- An **Artifact** has at most one **Artifact Edition** for each **Project Version**
- Stable **Artifact** identity has no lifecycle state; each Artifact Edition owns its independent lifecycle
- An **Artifact Edition** can have many immutable **Artifact Revisions**
- Every **Artifact Edition** has one mutable **Working Draft**
- Manual checkpoint, Publication, and Carry-Forward create or reuse an immutable **Artifact Revision** from the Working Draft
- **Artifact Revision Numbers** increase within one Artifact Edition
- **Publication Sequences** increase independently within one Artifact Edition
- A **Published Artifact** identifies the exact **Artifact Revision** it published
- One **Carry-Forward** operation has exactly one source Project Version and one target Project Version
- A **Carry-Forward** can create Editions for many selected Artifacts
- Every carried-forward **Artifact Edition** records exactly one immediate source Edition
- Editing a source or target **Artifact Edition** after **Carry-Forward** never changes the other Edition automatically
- A multi-Artifact **Carry-Forward** succeeds atomically or creates no target Editions
- An archived **Project Version** is read-only without rewriting its child Editions' own lifecycle states
- An archived **Artifact Edition** is read-only, while its existing Published Artifacts remain accessible
- Archived **Project Versions** remain directly linkable and valid Carry-Forward sources but are excluded from default selectors, libraries, and search
- Project Version selectors show the Default Project Version first, then active versions in explicit manual order, with archived versions separated
- An **Interactive Demo** contains many **Demo Scenes**
- A **Demo Scene** may reference one **Capture Asset**
- A **Demo Scene** can have many **Demo Hotspots**
- A **Demo Hotspot** may trigger one **Demo Transition**
- A **Demo Transition** connects one **Demo Scene** to another **Demo Scene**
- A **Guide** can produce many **Published Artifacts**
- An **Interactive Demo** can produce many **Published Artifacts**
- Published Artifact sequence numbers are never reused, and unlinking/archive/revocation do not delete Publication history
- A **Publish Link** belongs to exactly one stable **Artifact**
- An **Artifact** can have many independently configured **Publish Links**
- A **Publish Link** contains one or more selected version entries and exactly one default entry
- Every Publish Link version entry identifies one Artifact Edition and one exact immutable **Published Artifact**
- A **Publish Link** never combines unrelated Artifacts and never exposes a Working Draft
- Publishing updates only the Publish Link entries explicitly selected by the Project Editor/Admin; unselected links remain pinned until manually changed
- A Publish Link version entry may be explicitly rolled back to an older Published Artifact from the same Artifact Edition without creating or mutating Publication history
- A multi-version **Publish Link** viewer provides a version selector and canonical version-specific paths; selection renders the exact configured Published Artifact entry
- Each **Publish Link** owns its selected version-entry order independently of internal Project Version ordering
- Authenticated Working Draft and Artifact Revision routes include explicit **Project Version** context
- Artifact Revision routes resolve immutable authoring checkpoints, while Publish Links remain stable access pointers to immutable Published Artifacts
- An **Extension Session** belongs to one **Instance**
- An **Extension Session** authenticates a **User** for capture APIs on that **Instance**
- A **Capture Session** is started inside exactly one **Project**

### Documentation Relationships: Shipped First Slice And Accepted V1

- A **Project** may own many **Documentation Sites**
- Every **Documentation Site** belongs to exactly one Project
- A **Documentation Site** has at most one **Site Edition** for each Project Version
- Every **Site Edition** belongs to exactly one Documentation Site and one Project Version in the same Project
- Every **Site Edition** owns exactly one **Site Working Draft**
- A **Site Working Draft** owns many Documentation Pages, Navigation Groups,
  reusable snippets, redirect rules, OpenAPI Sources, and Edition-owned
  Documentation Assets
- A **Reusable Documentation Snippet** belongs to exactly one Site Edition,
  may be referenced by many Pages in that Edition, cannot nest another
  Snippet, and is frozen into each Site Revision
- Documentation image uses reference either an Edition-owned Documentation
  Asset or an authorized same-Project Capture Asset; archive prevents new
  selection but preserves existing mutable and immutable references
- Every **Documentation Page** belongs to exactly one Site Edition and appears at most once in its authoritative Navigation Tree; unlisted Pages are allowed
- Page slugs and **Page Slug Aliases** are unique within one Site Edition, and aliases cannot be reassigned
- Every **Site Revision** belongs to exactly one Site Edition and freezes the complete reader-visible Site state
- Every **Site Publication** belongs to exactly one Site Edition and references exactly one Site Revision from that Edition
- A Documentation **Publish Link** belongs to one Documentation Site and exposes explicitly selected immutable Site Publications using one link-wide access policy
- A **Documentation Comment Thread** belongs to one Documentation Page, remains private authoring state, and is never included in a Site Revision or Site Publication
- A **Documentation Package** is a versioned deterministic snapshot of one
  Working Draft, Site Revision, or Site Publication; it is portability input,
  not database authority or publication lineage
- An **Import Inspection** belongs to its creating Organization Member and
  Project Version, retains one bounded untrusted source temporarily, and never
  mutates a Site Working Draft
- An **Import Application** permanently records one successful atomic import
  into one Documentation Site after the exact inspection source, fingerprint,
  target versions, permissions, and external bindings are revalidated
- A **package-local handle** identifies relationships only inside one
  Documentation Package; import always allocates fresh database identities
- Standalone Documentation Markdown is readable, create-only Page interchange;
  it does not overwrite a Page or preserve the complete typed Site graph
- Accepted V1 Documentation Carry-Forward will copy one selected whole
  Documentation Site from an exact Site Revision into an independent missing
  target Site Edition; it does not live-link later edits and is not shipped by
  child `132`

## Example Dialogue

> **Dev:** "When the Chrome extension records a workflow, do we immediately create a demo?"
> **Domain expert:** "No. We create a **Capture Session** first. The user can later use its **Capture Assets** to create either a **Guide** or an **Interactive Demo**."

## Flagged Ambiguities

- "demo" can mean the whole product category or the interactive artifact. Resolution: use **Interactive Demo** for the Storylane-style artifact.
- "ad-hoc capture" should not mean an ownerless capture. Resolution: quick captures may use a **Project Inbox**, but still belong to a **Project**.
- "step" should not describe raw extension events. Resolution: raw actions are **Capture Events**; edited guide units are guide steps.
- "edit capture" should not mean overwriting source capture data. Resolution: source **Capture Events** and original **Capture Assets** are immutable; edits create artifact records or **Derived Assets**.
- "delete asset" should distinguish archive from physical purge. Resolution: archiving hides a **Capture Asset** from new selection; a **Protected Shared Asset** remains resolvable and cannot be physically purged until protected references are removed or revoked.
- "file" and "capture asset" are distinct. Resolution: **File** stores physical storage facts; **Capture Asset** gives that file product meaning.
- "HTML capture" is not part of the MVP replay path. Resolution: MVP uses **Screenshot Capture**; **HTML Snapshot** remains a deferred capture asset type.
- "login to extension" requires an **Instance** first. Resolution: the extension stores the target **Instance** URL before creating an **Extension Session**.
- "quick capture" still needs project context. Resolution: the extension remembers the last **Project** or uses a **Project Inbox**.
- "capture everything" is not the default. Resolution: capture records meaningful workflow events and **Manual Capture** moments, not raw telemetry noise.
- "input capture" should not mean storing raw typed values. Resolution: input values are omitted or redacted by default, and visual **Redaction** creates derived assets.
- "finish capture" should not mean creating a guide or demo. Resolution: finishing capture completes the **Capture Session** and opens the **Project** workspace for explicit artifact creation.
- "move capture to another version" is allowed only before capture begins. Resolution: once a **Capture Session** starts or has a Capture Event/Asset, its Project Version is immutable provenance.
- "project page" should mean the **Project Workspace** when discussing the MVP portal surface.
- "project version" should describe a release state or maintained release line only. Resolution: audiences, permissions, deployment environments, API versions, and artifact revisions are separate concepts.
- "version number" should not imply that a **Project Version** must use semantic versioning. Resolution: Project Versions use free-form names and stable project-scoped slugs.
- "sort versions" should not imply parsing their names. Resolution: Project Versions and Publish Link entries use explicit manual positions, with their explicit default shown first.
- "change version slug" should not mean breaking or reassigning the old URL. Resolution: the old slug becomes a permanent **Project Version Alias** that redirects to the current canonical slug.
- "main" should not imply a Git branch or moving latest-version alias. Resolution: `Main` is the initial real **Default Project Version**; default status may later move explicitly without moving existing content.
- "hide versioning" should not mean hiding ownership context. Resolution: always show compact **Project Version** context; make selection and management prominent only when multiple versions exist.
- "old version" should not imply read-only. Resolution: creating a newer **Project Version** does not freeze another; explicit archive state controls whether authoring is allowed.
- "archive project" should not mean cascading child archive or revoking shared links. Resolution: an **Archived Project** is an effective read-only wrapper that preserves child states and existing Publications.
- "editor" is ambiguous. Resolution: use **Guide Editor** or **Interactive Demo Editor** unless referring to shared low-level editor utilities.
- "AI-generated" content is not part of MVP. Resolution: MVP uses deterministic placeholders; future **Suggestions** may assist users but do not own artifact state.
- "widget" should not describe guide content. Resolution: use **Guide Block** for ordered document units and **Guide Step** for step-specific behavior.
- "page" should not describe an interactive demo screen. Resolution: use **Demo Scene** for the interactive artifact and **Capture Asset** for the source screenshot/HTML.
- "hotspot" should not describe a guide highlight. Resolution: use **Demo Hotspot** for interactive targets and **Guide Annotation** for document visuals.
- "artifact version" is ambiguous. Resolution: use **Artifact Edition** for one Project Version's authored representation and **Artifact Revision** for an immutable authoring checkpoint inside that Edition.
- "save a version" should not describe normal autosave. Resolution: saves update the mutable **Working Draft**; only manual checkpoint, Publication, and Carry-Forward create or reuse an immutable **Artifact Revision**.
- "version counter" is ambiguous. Resolution: use **Row Version** for internal concurrency, **Artifact Revision Number** for Edition authoring history, and **Publication Sequence** for Edition publishing history.
- "published Edition" should not be an Edition lifecycle state. Resolution: an **Artifact Edition** remains `draft` or `archived`; immutable publication state belongs to **Published Artifact** records.
- "archived version" should not mean inaccessible or deleted. Resolution: an archived **Project Version** is read-only history available through direct links and explicit archived filters while existing Publications remain accessible.
- "artifact title" is convenient UI language but not identity ownership. Resolution: title and description belong to the selected **Artifact Edition**, may differ across Project Versions, and may duplicate another Edition's title.
- "Documentation" should not mean this repository's contributor/operator docs. Resolution: use **Documentation Site** for the accepted customer-authored product artifact and `apps/docs` or repository docs for contributor/operator material.
- "page version" is ambiguous. Resolution: mutable **Documentation Pages** use **Row Versions**, while complete immutable history uses **Site Revisions**.
- "published Page" should not imply independent Page publication. Resolution: a **Site Publication** freezes one complete Site Revision, including every selected Page and its navigation/search context.
- "archive artifact" should identify the affected Edition. Resolution: stable **Artifact** identity has no archive state; archive applies to one or more explicitly selected **Artifact Editions**.
- "carry forward versions" should not mean merging multiple source versions. Resolution: one **Carry-Forward** operation uses one source Project Version, one target Project Version, and any number of selected Artifacts without overwriting existing target Editions.
- "copy everything" should not describe **Carry-Forward**. Resolution: copy Edition-owned editable structures into independent draft records, reuse Protected Shared Assets, and do not copy Publications, access state, Capture Sessions, or Capture Events.
- "partially carried forward" is not a valid V1 outcome. Resolution: a **Carry-Forward** batch is atomic, idempotent, and returns explicit conflicts without creating a subset.
- "publish link" should not mean a live pointer to draft rows or a single forced version. Resolution: a **Publish Link** exposes explicitly selected immutable Published Artifacts for one stable Artifact, with one default version and one link-wide access policy.
- "delete publication" is not a V1 content action. Resolution: Published Artifacts remain immutable Project history; remove link entries or revoke links to stop consumer access.
- "the artifact link" should not imply one global link. Resolution: an **Artifact** may have many Publish Links for different audiences, each with independent version selection, access, expiry, and revocation.
- "switch published version" should not mean selecting a live Edition. Resolution: the viewer dropdown selects among immutable Published Artifact entries explicitly included in the Publish Link and updates to a canonical shareable version path.
- "republish everywhere" is never implicit. Resolution: the publish workflow offers explicit per-link update options; unselected Publish Links stay pinned and can be changed later.
- "rollback publication" should not create or rewrite history. Resolution: rollback atomically repoints one Publish Link version entry to an older Published Artifact from the same Edition and records an audit event.
- "snapshot" should not imply a JSON document or live draft copy. Resolution: a Published Artifact identifies one exact immutable Artifact Revision, whose type-specific content remains explicit and independently addressable.
- "audit everything" should not mean application debug logs or duplicated domain state. Resolution: every committed mutation produces one append-only **Audit Event** with typed **Audit Change Items**; failed/denied attempts and read access are separate concerns.
- "access history" should not mean logging every transport request. Resolution: **Access Events** record logical product access and security outcomes, while health probes, static frontend files, preflight, range chunks, heartbeats, and internal queries remain operational noise.
- "activity timeline" should not mean unrestricted compliance access or imply export. Resolution: Editors receive a curated Project activity read model, raw Audit Change Items, Access Events, and security context are restricted to the Organization Owner and applicable Project Admins, and timeline export is deferred.
- "retain as long as possible" should not mean best-effort sampling. Resolution: audit/access evidence has no automatic expiry, truncation, or storage-pressure deletion while the Organization exists; future legal or Organization purge requires an explicit governed workflow.
- "append-only" should not imply cryptographic tamper-proofing. Resolution: application and database runtime controls reject mutation/deletion, while externally anchored cryptographic or WORM guarantees remain deferred and must not be claimed in V1.
- "latest URL" should not hide version semantics. Resolution: authenticated Artifact routes include explicit Project Version context; the Project entry route redirects to the Default Project Version without introducing a `/latest` route.
- "user" and "organization member" are distinct. Resolution: **User** is authentication identity; **Organization Member** is organization-scoped membership and role.
- "organization member" is domain language; **Org User** is the canonical code/table term.
- "organization member" should not imply access to every Project. Resolution: non-owner members require **Project Membership**; Organization Owners retain implicit Project Admin access.
- "editor" should not imply Project-management authority. Resolution: a **Project Editor** can author and publish content, while Project Membership, Project Version lifecycle, Project settings, and purge require **Project Admin**.
- "administrator" should not describe the organization-scoped first user role. Resolution: use **Owner** for the first organization role and **Owner Bootstrap** for first-run setup.
- "setup" and "signup" are different onboarding paths. Resolution: **Web First-Run Setup** is for self-hosted initialization; **Signup Onboarding** is for hosted registration/invites.
