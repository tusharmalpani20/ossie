# Contributing

Ossie is an alpha-stage open-source project for screenshot-first browser workflow capture, Scribe-style Guide publishing, and Storylane-style Interactive Demos. Master Plan `005` accepts a broader version-aware knowledge-platform direction, but contributors must not describe planned behavior as shipped.

## Workflow

- Start with a plan in `docs/plan/` for meaningful feature, architecture, or hardening work.
- Use focused commits that keep the repository buildable.
- Keep docs updated when behavior, setup, security posture, or product scope changes.
- Use ADRs in `docs/adr/` for durable architecture decisions.
- Prefer changes that fit the existing domain-module style before adding new abstractions.

Start consequential work with `AGENTS.md`, then read `CONTEXT.md`, relevant
accepted ADRs, and the active plan. Optional agent guidance and provenance are
documented in `docs/agent-workflow.md`; agent tooling is never a contributor or
runtime prerequisite.

## Development

Install dependencies:

```bash
pnpm install
```

Use the setup guide for database, environment, and storage details:

```text
docs/development-setup.md
```

More contributor context lives in:

```text
docs/contributor-guide.md
```

## Testing

Feature work should follow a TDD loop where practical: add a failing behavior test, implement the smallest change, then refactor while green.

Before opening a pull request, run the checks relevant to your change:

```bash
rtk pnpm --filter server test
rtk pnpm --filter web test
rtk pnpm --filter extension test
rtk pnpm check-types
rtk pnpm build
rtk pnpm lint
rtk git diff --check
```

For backend persistence changes, also run:

```bash
rtk pnpm --filter server test:db
```

For cross-domain v1 workflow confidence, run:

```bash
rtk pnpm --filter server test:smoke
```

## Pull Requests

Include:

- what changed
- why it changed
- tests/checks run
- docs updated, if applicable
- known limitations or follow-ups

Avoid unrelated refactors in feature PRs.

## Scope Notes

Built at MVP/alpha level:

- screenshot-first capture sessions
- guide authoring, preview, publish, password access, embed, Markdown export, and HTML ZIP export
- interactive demo generation, scene editing, hotspots, publish, password access, embed, and public viewer
- Chrome extension capture with automatic click capture MVP and manual screenshot fallback
- organization invite/member basics

Deferred:

- AI/BYO-key authoring
- analytics, lead capture, sales tracking, and branding
- HTML replay
- Chrome Web Store packaging
- one-command production deployment packaging
- advanced editor/demo polish
- Product Documentation V1 and the bounded post-V1 experience are shipped; Plan 147 owns the current UI-quality work
- Loom-style Video recording and library behavior

The accepted and shipped product foundation also includes Audit/Access Evidence,
Project Membership, Project Versions, and version-aware Guide/Demo Editions,
Revisions, Publications, and Documentation Sites. Preserve their accepted
contracts while working on Plan 147. Do not start Video runtime work outside an
accepted child.
