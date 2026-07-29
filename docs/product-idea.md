# Ossie Product Idea

Last reviewed: 2026-07-29

## Status And Purpose

This document is the product thesis. It separates current behavior from accepted
direction; it is not a runtime inventory. See `docs/project-zoomout-status.md`
for implementation status, `CONTEXT.md` for canonical terms, and Master Plan
`005` for ordered delivery.

Ossie helps organizations capture, maintain, and share knowledge about software
workflows. The current alpha converts screenshot-first browser Capture Sessions
into Guides and Interactive Demos. The accepted direction organizes that
knowledge by Project and Project Version, adds explicit governance and immutable
history, then expands to Product Documentation. Loom-style Video remains later.

Ossie is not intended to be AI-first. Optional assistance may be added after the
core capture, editing, versioning, access, publishing, and discovery workflows
are dependable.

## Available Today

The alpha implements:

- self-hosted first-run setup, password authentication, and Organization member
  and invite basics;
- Projects with Project Membership and explicit Project Versions beginning with
  a transactional default `Main`;
- Project Version-owned screenshot-first portal and Chrome extension Capture
  Sessions;
- reusable Capture Events and Capture Assets;
- Guide and Interactive Demo Artifacts with Version-scoped Editions, relational
  Working Drafts, immutable Revisions, Carry-Forward, and protected shared
  Assets;
- Guide authoring with Blocks, Steps, Annotations, preview, revision-backed
  publishing, embeds, and exports;
- Interactive Demo authoring with Scenes, Hotspots, linear transitions,
  revision-backed publishing, embeds, and public viewing;
- independent multi-version Publish Links with explicit rollout, canonical
  version URLs, public/restricted/password/expiry controls, rollback, and
  revocation; and
- comprehensive append-only Audit/Access Evidence for the implemented scope.

The current alpha does not implement Product Documentation authoring or Video.
The design-system and current Capture, Guide, Interactive Demo, extension,
accessibility, motion, responsive, and performance modernization in children
`121` through `130` is implemented.

## Next Platform Direction

Master Plan `005` accepts this navigation umbrella:

```text
Organization
  -> Project
    -> Project Version context
      -> Capture Sessions
      -> Guide Editions
      -> Interactive Demo Editions
      -> Product Documentation (after its dedicated grill)
      -> Video (later; no accepted model yet)
```

The diagram is not a literal persistence tree. Stable Guide and Interactive Demo
Artifact identities belong to a Project. An Artifact can have at most one
Artifact Edition in a given Project Version. Each Edition owns one mutable
Working Draft and a sequence of immutable Artifact Revisions. A Publication
identifies one exact Revision, and a Publish Link exposes an explicit set of
published Project Versions for one Artifact. These relationships are implemented
for Guides and Interactive Demos; Product Documentation remains future work.

The foundation is ordered deliberately:

1. Append-only relational Audit and Access Evidence.
2. Project Membership and explicit Project authorization.
3. Project Version records, beginning with a real `Main` record.
4. Project Version-scoped Capture Sessions.
5. Project-owned Artifacts with version-scoped Editions and Working Drafts.
6. Immutable Revisions, Carry-Forward, and protected shared assets.
7. Revision-backed Publications and multi-version Publish Links.
8. Modernized authoring, library, reader, extension, and compliance workflows.
9. Product Documentation domain grill.

Items `1` through `8` are available behavior or repository foundation. Item `9`
is the accepted next design activity; it does not implement Product
Documentation.

## Intentionally Deferred

- Product Documentation runtime before child `131` accepts its model.
- Loom-style Video capture, upload, recording permissions, storage, playback,
  transcription, comments, and library behavior.
- Desktop recording.
- HTML capture/replay.
- Required AI authoring or search.
- Analytics-heavy sales workflows, lead capture, billing, and custom domains.
- Background workers, object storage, and new export destinations without a
  concrete plan.

## Target Users

Internal teams are the first audience. They need to:

- document repeatable operational and software workflows;
- train and onboard teammates;
- maintain knowledge across meaningful product releases;
- prepare Guides and Demos without recapturing every source screen;
- understand who changed or accessed important material; and
- share selected immutable output safely inside or outside the Organization.

Support, customer success, product marketing, and sales teams are compatible
later audiences. Their analytics, branding, and lead-capture needs do not control
the current foundation.

## Product Concepts

### Organization And Project

An Organization is the tenant and ownership boundary. A Project groups related
knowledge for a product, module, or workflow area. Examples include ERP setup,
CRM onboarding, billing operations, and an internal admin portal.

Project Membership governs non-owner access through Project Admin, Editor,
and Viewer roles. Project Versions inherit Project permissions; they are not
separate permission groups.

### Project Version

A Project Version is a meaningful product state or maintained release line. It
is not an API version, Git branch, audience, or row-concurrency counter. New
Projects begin with a real default Project Version named `Main`.

### Capture Source

A Capture Session is one recording run and reusable source material, not a final
artifact. It contains ordered Capture Events and Capture Assets. Every Capture
Session belongs to one Project Version.

Original captured source remains immutable. Redaction and other processing
produce Derived Assets rather than rewriting originals. A shared asset becomes
protected while a Working Draft, Artifact Revision, or Publication references
it: archiving can hide it, but physical purge is blocked while protected.

Screenshot capture is the active path. HTML snapshots remain deferred because
replay introduces sanitization, authenticated-resource, iframe, Shadow DOM,
font, script, and long-term rendering concerns.

### Guide

A Guide is a reading-oriented, Scribe-style artifact. It uses ordered Guide
Blocks, first-class Guide Steps, and Guide Annotations. It is optimized for
process documentation, internal training, onboarding, support, and export.

Guide content must not be flattened into a generic widget model. Steps,
paragraphs, tips, alerts, headings, dividers, captures, and annotations have
type-specific relational meaning.

### Interactive Demo

An Interactive Demo is an interaction-oriented, Storylane-style artifact. It
uses Demo Scenes, Demo Hotspots, and Demo Transitions. A Scene is experienced,
while a Guide Step is read; they may reuse Capture Assets but remain different
content models.

Branching, simulated forms, analytics, lead capture, and sales-specific features
remain later work.

### Artifact, Edition, Revision, And Publication

An Artifact is the stable identity of one Guide or Interactive Demo across
Project Versions. An Artifact Edition is that Artifact's one authored
representation in one Project Version.

Normal saves update the Edition's Working Draft with Row Version conflict
protection. They do not create authored history. Manual checkpoints,
Publication, and Carry-Forward create or reuse immutable Artifact Revisions.
Each immutable Publication identifies one exact Revision and has its own
Publication Sequence.

Carry-Forward copies selected source Editions into one target Project Version as
independent draft records. It reuses protected immutable assets, never overwrites
an existing target Edition, never synchronizes later changes, and succeeds or
fails atomically.

### Product Documentation

Product Documentation means customer-authored documentation sites and knowledge
bases comparable in purpose to modern documentation platforms. It is not another
name for a Guide and is not `apps/docs`.

`apps/docs` is repository documentation for Ossie contributors and operators.
Product Documentation may reuse shared Project Version, Publication, access,
audit, and asset vocabulary only after child `131` decides its own identity,
structure, navigation, editing, rendering, publishing, and site-configuration
model.

### Video

Video is a later artifact-family direction inspired by asynchronous screen
recording and sharing. No Video tables, upload pipeline, recorder, transcript,
comment, playback, permission, retention, or version model is accepted in this
foundation. The umbrella preserves room for Video without pretending that its
domain is already understood.

## Primary Workflows

### Current Alpha

```text
sign in
  -> create/select Project
  -> capture browser workflow
  -> review Capture Session
  -> create Guide or Interactive Demo
  -> edit
  -> publish immutable current snapshot
```

### Accepted Target

```text
select Project and Project Version
  -> capture or choose version-scoped source
  -> create/edit an Artifact Edition Working Draft
  -> checkpoint an immutable Revision
  -> publish that exact Revision
  -> expose selected published Project Versions through a Publish Link
  -> inspect authorized Audit/Access timeline evidence
```

## Ownership And Persistence Guardrails

- Organization tenant isolation and explicit authorization are mandatory.
- Core ownership, lifecycle, ordering, lineage, access, audit, Revision, and
  Publication state uses typed relational columns and child tables.
- Working Draft, Revision, and Publication content remains type-specific and is
  not stored as a generic JSON snapshot.
- JSON remains appropriate at transport, manifest, extension-message, and
  configuration boundaries; it does not control core persistent semantics.
- Published material is immutable.
- Public links expose only explicitly authorized immutable material.
- Audit and Access Evidence is append-only and must not store credentials or
  captured content.

## Product Definition

Ossie is a self-hosted, project-organized knowledge platform for capturing real
software workflows and maintaining shareable Guides, Interactive Demos, and
future artifact families across meaningful product releases.
