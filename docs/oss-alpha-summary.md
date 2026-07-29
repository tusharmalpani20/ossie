# OSS Alpha Summary

Ossie is a self-hosted open-source tool for creating product walkthrough artifacts from browser workflows.

## Short Description

Self-hosted screenshot-first workflow capture for Scribe-style guides and Storylane-style interactive demos.

## What It Does

Ossie lets a team capture browser workflow source material, reuse that source as a Capture Session, and create two separate outputs:

- step-by-step guides for internal documentation, onboarding, support, and enablement
- interactive demos with scenes and hotspots for walkthrough-style sharing

Both Guides and Interactive Demos can be published from exact immutable
Artifact Revisions through public/restricted Publish Links, password gates, and
embeds.

## Next Platform Direction

Master Plan `005` has added relational Audit and Access Evidence, Project
Membership, Project Versions, version-scoped Capture source, Guide/Demo
Editions, Working Drafts, Revisions, Publications, protected Assets,
multi-version Publish Links, and a modernized current-product UI. These are
implemented alpha foundations.

Product Documentation is the next artifact family to grill after the foundation. It is distinct from Guides and from `apps/docs`, the repository documentation hub. Loom-style Video is later and does not yet have an accepted runtime model.

## Why Open Source Matters

Workflow captures often contain internal product screens, operational processes, or customer-adjacent context. A self-hosted OSS option lets teams own their storage, review the capture/publish code paths, and avoid forcing sensitive internal documentation into a closed SaaS product.

## Implemented In Alpha

- first-run setup, auth, projects, and org membership basics
- screenshot-first capture sessions
- Chrome extension Capture with automatic/manual screenshot paths, direct-page
  evidence, and real unpacked toolbar evidence for ordered Events, privacy
  suppression, restart recovery, and split-origin portal handoff
- manual portal capture and screenshot upload
- guide generation, editing, preview, publishing, password access, embeds, Markdown export, and HTML ZIP export
- interactive demo generation, editing, hotspots, publishing, password access, embeds, and public viewer
- README screenshots from safe synthetic dogfood and modern UI browser-fixture data
- compact `apps/docs` alpha docs hub linking to source markdown docs and safe screenshot evidence
- organization invites
- production config hardening basics
- DB-backed v1 smoke workflow

## Known Limits

- alpha quality
- Chrome Web Store packaging remains pending; verified extension evidence uses
  an unpacked Manifest V3 build
- no HTML replay
- no analytics or lead capture
- no custom branding
- no hosted SaaS signup flow
- no one-command production deployment packaging
- local file storage only
- in-memory rate limiting only
- manual storage cleanup and backup responsibility
- no Product Documentation authoring or Loom-style Video implementation

## Help Wanted

- extension reliability dogfooding
- guide/editor usability polish
- interactive demo editor polish
- docs and setup clarity
- tests around important user workflows
- security review of auth, uploads, storage, public links, embeds, and extension flows
