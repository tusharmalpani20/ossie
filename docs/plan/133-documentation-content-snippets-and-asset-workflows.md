# Child Plan 133: Documentation Content, Snippets, And Asset Workflows

Date reserved: 2026-07-30

Status: Reserved. This file preserves the accepted place and boundary of child
`133`; it is not yet implementation-ready. Expand and recheck it only after
child `132` is implemented, closed, documented, and committed.

Parent plan:

- `docs/plan/master/006-documentation-platform-v1-master-plan.md`

Predecessor:

- `docs/plan/132-documentation-site-first-vertical-slice.md`

Next child:

- `docs/plan/134-documentation-import-export-and-package-portability.md`

## Sequence Gate

Do not implement this child until child `132` has passed its full 15-step
database/browser journey and its close-previous audit. The expansion must use
the actual child `132` schema, contracts, adapters, routes, protected-reference
model, dependency pins, and recorded leftovers rather than assumptions in this
reservation.

## Reserved Goal

Deepen the proven Documentation editor without changing the accepted authority
model: PostgreSQL plus protected File storage remains authoritative, Tiptap is
a replaceable authoring adapter, Fumadocs is a replaceable reader adapter, and
immutable Site Revisions and Site Publications remain complete snapshots.

## Reserved Scope

- complete the accepted V1 constrained Page block set;
- add Edition-owned reusable snippets and define insert/reference/update
  behavior without live cross-Site or cross-Edition sharing;
- add exact authorized Guide Publication and Interactive Demo Publication
  reference blocks;
- add Documentation Asset library/upload/select/archive workflows;
- allow authorized same-Project Capture/Derived Asset reuse;
- extend protected-reference accounting and archive/purge prevention;
- require media accessibility metadata and safe authoring validation;
- apply content-size and asset-count product limits;
- extend Revision and Publication snapshots to every accepted content,
  snippet, and asset structure.

## Reserved Security Boundary

- No executable blocks, raw HTML, MDX, JavaScript, or arbitrary iframe content.
- URLs, protocols, MIME types, media dimensions, and File ownership are
  validated before persistence and again before public rendering.
- Guide/Demo references use immutable authorized publication identities, never
  mutable draft state or title/slug guesses.
- Cross-Project File or artifact identifiers fail without leaking existence.
- Protected File delivery and immutable Publication references cannot be
  bypassed by archive, replacement, or purge.

## Explicit Non-Scope

- ZIP/package import or export;
- Carry-Forward and lifecycle completion;
- formal review/approval;
- API Try It or credential handling;
- translation, custom domains, public feedback, realtime collaboration, Git
  authority, or permanent deletion.

## Required Expansion Work

Before implementation, replace this reservation with a plan that:

- inventories the completed child `132` files and lists exact affected and
  read-only files;
- defines every new/changed schema, index, constraint, grant, trigger, shared
  type, Zod contract, API route, status, and error;
- defines snippet copy/reference semantics and immutable snapshot behavior;
- defines Guide/Demo publication authorization, archive behavior, and public
  rendering failure rules;
- defines asset ownership, upload/selection, protected references, File
  authorization, retention, and quota behavior;
- defines tenant/Project/role checks, audit actions, access evidence, redacted
  fields, Row Version rules, transactions, and idempotency;
- defines TDD order, migration/upgrade compatibility, rollback strategy,
  current-truth documentation updates, and logical commit boundaries;
- names focused unit, route, database, smoke, web, accessibility, and
  agent-browser validation cases.

## Reserved Exit Gate

- snippets and assets round-trip through Working Draft, Site Revision, and Site
  Publication;
- different Editions remain independent;
- protected-reference archive/purge behavior is proven;
- media accessibility and browser behavior are verified;
- child `134` receives stable, versioned, packageable content contracts.

## Checklist

- [x] Sequence position reserved.
- [x] Master-defined goal, scope, security, non-scope, and exit gate recorded.
- [ ] Actual child `132` result inspected.
- [ ] Implementation-ready expansion completed and rechecked.
- [ ] Plan checkpoint committed before runtime implementation.
- [ ] Runtime implemented, verified, documented, and closed.

## Planning Log

- 2026-07-30: Reserved from accepted Master Plan `006`. No runtime, schema,
  dependency, or active product-documentation change was made.

## Verification Record

Planning reservation only. Filename, predecessor, successor, goal, scope, and
exit gate were checked against Master Plan `006`. Runtime verification is not
applicable and must not be inferred from this record.

## Leftovers And Handoff

The expansion owner must reconcile all child `132` leftovers and stop for an
explicit decision if completing the V1 block set would introduce executable
customer content or weaken immutable publication/protected-reference rules.
