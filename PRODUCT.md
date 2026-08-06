# Product

## Register

product

## Platform

web

## Users

Ossie is for teams that need to capture, maintain, and share operational product
knowledge across projects and release contexts.

Primary users are Organization Owners, Project Admins, Project Editors, and
Project Viewers working inside the portal. Public readers use published
Guides, Interactive Demos, and Documentation through Publish Links,
but they do not manage the internal workspace.

## Product Purpose

Ossie currently captures real software workflows and turns those Captures into
shareable Guides and Interactive Demos, alongside governed Product
Documentation Sites. Its accepted direction is a
project-organized internal knowledge platform with explicit Project Version,
Artifact Edition, Revision, Publication, Publish Link, Audit, Access, and
Project Membership foundations.

The current product must help a team:

- select the right Organization, Project, and Project Version context;
- capture source material safely;
- author and maintain Guides, Interactive Demos, and Documentation Sites;
- preserve immutable Revisions and Publications;
- publish exact immutable material through controlled Publish Links;
- read activity and compliance evidence without weakening permissions.

Product Documentation V1 is shipped. The post-V1 Documentation experience work
in Master Plan `007` Children `141`–`146` is implemented and independently
close-rechecked: Tiptap is partial-adopted for bounded prose fields, Fumadocs
is partial-adopted for named public Publication navigation/TOC primitives, and
generated request examples are inert five-language V1 projections. Whole-graph
adapter migration and static export remain accepted-later and are not shipped.
Video remains an accepted future direction and is not shipped.

## Positioning

Ossie is the quiet, version-aware workbench for turning real product workflows
into governed internal knowledge and exact published artifacts.

## Brand Personality

Ossie should feel calm, precise, and dependable. It is approachable because it
reduces operational confusion, not because it uses playful decoration.

The accepted display name is Ossie, with an original octopus character direction
for brand surfaces. Runtime package names, routes, storage, cookies, database
objects, and historical identifiers are not part of this design phase.

## Anti-references

Ossie should not look like:

- a marketing landing page inside the product;
- a nested-card dashboard;
- a decorative gradient or orb interface;
- a one-hue blue SaaS template;
- an AI-heavy, glassy, over-rounded, or animated-for-animation interface;
- a generic documentation template that ignores Ossie's accepted
  Documentation domain and product shell.

## Design Principles

1. Keep context visible. Organization, Project, and Project Version should be
   clear without adding ceremony when only `Main` exists.
2. Optimize for repeated work. Dense lists, stable workbench regions, compact
   command bars, and predictable states matter more than dramatic composition.
3. Preserve product truth. UI language must use the accepted terms in
   `CONTEXT.md`, distinguish shipped Documentation V1 from planned post-V1
   work, and must not say future Video behavior exists.
4. Make status readable. State must use text, shape, icon, and placement, not
   color alone.
5. Prefer composable foundations. Later children should build screens from
   tokens, primitives, and archetypes instead of inventing one-off styling.

## Accessibility & Inclusion

Target WCAG 2.2 AA behavior for product surfaces. Keyboard navigation, visible
focus, contrast, labels, errors, disabled/read-only states, zoom/reflow, and
reduced motion are design-system requirements, not final polish.

Use synthetic examples and safe local data in design review and browser evidence.
Never expose credentials, cookies, private URLs, storage keys, customer material,
raw captured input, actor IDs, or non-included Publications in screenshots or
docs.
