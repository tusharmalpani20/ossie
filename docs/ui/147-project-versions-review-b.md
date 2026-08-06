# Plan 147 — project-versions blind review B

Candidate: `c93ca11` (`fix(web): compose Project Version surfaces`)

Review lens: Project Version ownership and permissions, Default and archive
invariants, permanent former-slug privacy/link semantics, Carry Forward
boundary, error/retry behavior, keyboard/axe/zoom/motion, and exact diff scope.

## Verdict

`accept`

## Findings

- The candidate changes only Project Version composition, CSS, one focused
  workspace landmark test, and evidence. Existing API calls and behavior for
  create, update, reorder, Default, archive/restore, canonical slug aliases,
  Carry Forward, and optimistic concurrency remain unchanged.
- Owner browser checks show the Default Version cannot be archived, the active
  non-default Version retains Set Default/Archive actions, and the archived
  Version shows metadata-only read-only context. Selecting Summer release
  changes only the existing canonical Project Version route; it does not move
  content or change public links.
- The viewer settings route exposes a headed denial state with no Project
  Version management region, Create Project Version control, or mutation
  action. The viewer workspace has no Manage Versions or Carry Forward link.
- Owner/viewer workspace checks report one main landmark, zero axe violations,
  no browser errors, no failed local requests, reduced motion enabled, and no
  content-area overflow at 390px. The settings route retains one existing
  incomplete contrast-background probe on the unrelated project Description
  textarea; it is not a violation and is unchanged by this candidate. Browser
  zoom controls did not provide reliable 200% evidence in this runner.
- Focused final Project Version tests pass 12/12; the serial web suite passes
  493/493; web typecheck, lint, and production build pass. The repository-wide
  `check-css-tokens` command remains red on pre-existing Documentation reader
  fallback consumers (`--ossie-color-link`, `--ossie-font-family-sans`,
  `--ossie-font-size-sm`, and `--ossie-radius-md`); no Project Version CSS
  consumer introduces those names.

No blocking product, authorization, tenant-isolation, privacy, immutable
content, public-link, accessibility, mutation, or scope finding remains for
this bounded surface.
