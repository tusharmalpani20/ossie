# Agent Workflow

This document defines the optional repository agent workflow, skill registry,
and decision policy. It does not make Codex or any skill a prerequisite for
building, testing, running, or contributing to Ossie.

## Instruction Precedence

Apply instructions from strongest to weakest:

1. Platform, system, developer, and current user instructions.
2. The closest applicable `AGENTS.md`.
3. `CONTEXT.md` for canonical product and domain language.
4. Accepted ADRs in `docs/adr/`.
5. The active master plan and child plan.
6. Current implementation and tests for discoverable runtime facts.
7. Repository-local procedural skills.
8. Reviewed external skills and general engineering or design advice.

External guidance must not override accepted terminology, authorization,
retention, immutable-source, protected-asset, Publication, migration, or scope
boundaries.

## Availability Classes

| Class                      | Location                                                                                                                                                  | Contract                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Repository-local           | `.agents/skills/model-ossie-domain`, `build-ossie-slice`, `design-ossie-ui`, and `dogfood-ossie`                                                          | Repository-owned procedures. Validate after changes.                                                 |
| Repository-installed       | Other named directories under `.agents/skills/`                                                                                                           | Pinned third-party guidance. Optional, reviewed, and removable.                                      |
| Agent-environment provided | Discovered by the active agent environment, such as `skill-creator`, `skill-installer`, `agent-browser`, `test-driven-development`, and `grill-with-docs` | Useful when present, but not guaranteed on contributor machines and not copied into this repository. |

If a capability is unavailable, follow the repository docs and ordinary toolchain,
or mark the affected optional validation blocked. Never pretend a missing tool
ran successfully.

## Repository-Local Skills

| Skill                | Use it for                                                                         | Canonical truth remains in                                                                    |
| -------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `model-ossie-domain` | Terminology, lifecycle, ownership, persistence meaning, and ADR decisions          | `CONTEXT.md`, current code/tests, and `docs/adr/`                                             |
| `build-ossie-slice`  | Child-plan expansion, delivery, verification, and closeout                         | Active master/child plans and implementation                                                  |
| `design-ossie-ui`    | Operational UI architecture, interaction, motion, accessibility, and design review | Current UI, accepted `PRODUCT.md` and `DESIGN.md`, active Plan `147`, and `docs/ui/README.md` |
| `dogfood-ossie`      | Browser and extension workflow evidence                                            | Setup, smoke, operations, and extension docs                                                  |

The skills contain procedure, not copies of the product glossary or ADR text.

## External Skill Registry

Source state was resolved and reviewed on 2026-07-10. A commit is a content pin;
package and network metadata are recorded separately where they exist.

| Installed skill               | Source and upstream path                                                                                                          | Exact source                                                                                                                                                                                            | License                                                                                  | Install disposition                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `impeccable`                  | `https://github.com/pbakaus/impeccable`, source `skill/`, generated `dist/agents/.agents/skills/impeccable`                       | commit `da99645a58400ed7acb201e6904f9413efd89c6e`; skill `3.9.1`; reviewed npm CLI `3.2.1`, integrity `sha512-Lnh8BeLNj493iYuKRijVLP5nvdeKvReYtqGeov6tfsqECiKDSHBY5JfkxzfsC912AASMreCwzha0ZY3PC2pw+g==` | Apache-2.0, Copyright 2025 Paul Bakaus                                                   | Built from the pinned checkout with `bun install --frozen-lockfile --ignore-scripts` and `bun run build:skills`; copied only the generated Codex repository skill; no hook manifest installed; moved the generated unsupported top-level `version` into `metadata.upstream-version`; force-disabled the context script's network/home-cache update check in repository invocation guidance. |
| `emil-design-eng`             | `https://github.com/emilkowalski/skills`, `skills/emil-design-eng`                                                                | commit `f76beceb7d3fc8c43309cefad5a095a206103a4e`                                                                                                                                                       | MIT, Copyright 2026 Emil Kowalski                                                        | Installed with the generic skill installer at the exact commit.                                                                                                                                                                                                                                                                                                                             |
| `review-animations`           | Same repository, `skills/review-animations`                                                                                       | same commit                                                                                                                                                                                             | MIT, Copyright 2026 Emil Kowalski                                                        | Installed with its `STANDARDS.md`; removed the unsupported provider-specific `disable-model-invocation` frontmatter key so Codex validation passes.                                                                                                                                                                                                                                         |
| `animation-vocabulary`        | Same repository, `skills/animation-vocabulary`                                                                                    | same commit                                                                                                                                                                                             | MIT, Copyright 2026 Emil Kowalski                                                        | Installed as documentation-only guidance.                                                                                                                                                                                                                                                                                                                                                   |
| `apple-design`                | Same repository, `skills/apple-design`                                                                                            | same commit                                                                                                                                                                                             | MIT, Copyright 2026 Emil Kowalski                                                        | Installed as optional Apple-platform guidance; it does not redefine this web product.                                                                                                                                                                                                                                                                                                       |
| `vercel-react-best-practices` | `https://github.com/vercel-labs/agent-skills`, installed directory `react-best-practices`, upstream `skills/react-best-practices` | commit `f8a72b9603728bb92a217a879b7e62e43ad76c81`; upstream skill `1.0.0`                                                                                                                               | Upstream README and skill declare MIT; no standalone license file at the reviewed commit | Installed with its upstream discovery name, static rules, and compiled `AGENTS.md`. Corrected three compiled relative links to point into the installed `rules/` directory. Repository instructions take precedence over framework-general advice.                                                                                                                                          |
| `accessibility`               | `https://github.com/addyosmani/web-quality-skills`, `skills/accessibility`                                                        | commit `95d6e255afe1596b557d7a8498517884438f5b3a`; upstream skill `1.1`                                                                                                                                 | MIT, Copyright 2026 Addy Osmani                                                          | Installed with its WCAG and pattern references. Replaced one missing sibling-skill link with an exact-commit upstream link; the broader audit skill remains uninstalled.                                                                                                                                                                                                                    |

License texts and source attributions are preserved in
`THIRD_PARTY_NOTICES.md`.

### Reviewed But Rejected

`web-design-guidelines` from `vercel-labs/agent-skills` was not installed. Its
pinned `SKILL.md` instructs the agent to fetch
`vercel-labs/web-interface-guidelines/main/command.md` before every review. The
actual rules therefore remain mutable and are not reproducible from the pinned
commit. The installed Impeccable, accessibility, and repository-local design
skills cover the required review boundary without that unpinned fetch.

No overlapping generic design bundle was installed.

## Installer And Runtime Review

The generic `skill-installer` helper performs network retrieval and copies the
requested GitHub paths into a selected destination. It does not add application
dependencies, but it aborts when a destination already exists.

The Impeccable npm CLI was inspected but not used for installation. Its project
installer downloads a provider bundle from `impeccable.style` and can install a
`.codex/hooks.json` manifest. The reviewed exact package requires Node
`>=22.12.0`; that requirement is not added to this monorepo. The pinned source
build was used instead, and hooks remain disabled.

The vendored Impeccable skill contains optional Node scripts for context,
detectors, local live-browser sessions, file editing, and subprocess-backed
asset/copy workflows. Some scripts write `.impeccable/` state, access local
servers, contain an upstream update-check path, or use separately configured
agent credentials. They never run automatically in this repository. The
mandatory context invocation sets `IMPECCABLE_NO_UPDATE_CHECK=1`, so it neither
contacts `impeccable.style` for updates nor writes the user-home update cache.
Use scripts only for an explicit matching task, review the command first, keep
credentials outside the repository, and do not enable `hook-admin`, run
`impeccable update`, or install a hook manifest under this foundation.

The Emil, Vercel React, and Addy skills add Markdown/reference content only and
have no install-time or automatic executable behavior.

## Installation, Update, And Removal

For a new or updated third-party source:

1. Start from a clean worktree and record the current commit.
2. Resolve the remote HEAD and choose an exact accepted commit.
3. Read the complete target skill, adjacent references/scripts, repository
   license, package metadata, and installer behavior.
4. Install into a disposable staging destination first. When the environment
   provides `skill-installer`, use its `install-skill-from-github.py` helper with
   `--ref <exact-commit>` and `--dest <staging-directory>`.
5. Compare staged content with the repository copy. Reject hooks, credentials,
   shell startup changes, global config, application package/lock changes, and
   unrelated skills.
6. Preserve required license notices, update this registry, run structural and
   behavior checks, then commit one attributable source at a time.

Pinned external skill directories are listed in `.prettierignore`. Do not pass
vendored Markdown/scripts through repository formatters; keep upstream content
exact except for compatibility changes recorded in this registry and
`THIRD_PARTY_NOTICES.md`.

For Impeccable, build the reviewed checkout with lifecycle scripts disabled and
copy `dist/agents/.agents/skills/impeccable`. Never use an unpinned `npx
impeccable@latest`, and keep hooks disabled unless a later explicit plan accepts
them.

To remove a third-party skill, delete only its directory under `.agents/skills/`,
remove its notice if no other installed content uses that notice, and update
this registry. Removing all repository skills and `AGENTS.md` must not affect
pnpm dependency resolution or application build inputs.

## Child-Plan Lifecycle

Use this sequence for each implementation child:

```text
preflight and ownership check
  -> expand/recheck the child against current code
    -> classify unresolved decisions
      -> record an accepted plan/docs checkpoint
        -> red, green, refactor implementation
          -> focused then broad verification
            -> close the same child and hand off
```

Closeout includes the child status, implementation log, exact verification,
leftovers, parent-master checklist, commits, unresolved decisions, and next
executable child. Do not mark completion because the implementation merely
started or because a partial test passed.

## Decision Policy

### Agent-Decidable

Choose, document, and continue when a choice stays inside accepted plans and
ADRs, follows repository patterns, is reversible and locally testable, preserves
user-facing semantics and safety, and adds no major dependency, external service,
license issue, or destructive operation.

Typical examples are internal file placement, helper boundaries, test layout,
synthetic fixtures, accepted-query indexes, and small in-scope refactors.

### Critical Decision

Stop and ask only when a choice contradicts canonical decisions; changes Project
Version, Artifact, Edition, Revision, Publication, permission, audit, access, or
public URL semantics; affects tenant isolation, authentication, credentials,
privacy, retention, physical deletion, or protected assets; introduces major
framework/service/license lock-in; materially changes child scope/order; performs
destructive Git/deployment/infrastructure work; or requires naming/design
acceptance.

Provide one concise question with a recommendation, alternatives, evidence,
reversibility, and affected scope. Do not escalate routine implementation details.

## Verification And Evidence

- Develop with the narrowest relevant test and run the active child's broad
  checks before closeout.
- Use a real browser for visible workflows and isolate authenticated from public
  sessions.
- Cover desktop, narrow mobile, 200% zoom/reflow, keyboard/focus, console,
  network failures, loading, empty, error, permission, and destructive states
  when applicable.
- Treat extension page automation and an installed toolbar-popup run as different
  evidence. Do not claim popup coverage from a normal tab.
- Use synthetic fixtures and redact private URLs, cookies, tokens, captured input,
  customer screenshots, and local storage.
- Name browser sessions, close them, and stop local services after verification.
- Record unavailable browser, extension, database, or environment capabilities as
  blocked rather than inferring a pass.

## Troubleshooting

- **Skill not discovered:** confirm the registered directory exists and
  `SKILL.md` has the intended discovery name. The registry may document an
  intentional directory/discovery-name difference. Validate frontmatter, inspect
  `agents/openai.yaml` when present, then start a fresh agent session. Newly
  installed skills are not guaranteed to appear mid-session.
- **Environment skill missing:** follow repository docs manually. Do not copy a
  user-wide skill or absolute home path into this repository.
- **Impeccable asks for `PRODUCT.md`:** before child `121`, use current code,
  `CONTEXT.md`, Master Plan `005`, and current product/status docs for scoped
  reviews. Do not generate `PRODUCT.md` or `DESIGN.md` early.
- **Browser unavailable:** run non-browser checks and report the browser portion
  blocked with the missing capability.
- **External advice conflicts:** follow the precedence order and record the
  rejected recommendation when it affects implementation evidence.

## Overnight Runner Boundary

This workflow defines stable stop/continue semantics but does not implement a
queue, scheduler, retry process, SDK wrapper, or overnight runner. That separate
tooling is designed only after child `110` closes. It must consume these rules,
not bypass critical decisions or child acceptance gates.
