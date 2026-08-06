# Plan 147 — extension-capture blind review B

Candidate: `106705c` (`fix(extension): group capture actions`)

Review lens: Capture Session/Event/Asset semantics, Project and Project
Version permissions, local/server recovery boundary, privacy, keyboard and
accessibility behavior, zoom and motion handling, and exact diff scope.

## Verdict

`accept` for the local popup candidate; mark the installed-toolbar capability
`blocked_local_for_run`.

## Findings

- The candidate changes only popup action grouping, compact CSS, and one
  accessibility test. Capture Session/Event/Asset APIs, background commands,
  Project Version context, permission guards, privacy redaction, and local
  recovery semantics remain unchanged.
- The selection and active states expose a named `Capture actions` group. The
  existing tests continue to cover start, manual/automatic capture, pause,
  finish, recovery, local clear, access loss, archived Version guards, and
  error retention.
- Direct popup checks at 360px report zero axe violations and zero incomplete
  items. The 180px proxy keeps equal document and popup widths and zero axe
  violations; one incomplete contrast-background probe remains because the
  extreme viewport overlaps long button labels during sampling. Reduced motion
  was enabled and no direct-popup browser errors were observed.
- The extension suite passed 19 files and 140 tests; extension typecheck, lint,
  production build, and diff checks passed. The installed browser-toolbar
  action and permissions could not be exercised in this runner; existing Child
  126 evidence remains historical/prior evidence and is not substituted for a
  fresh claim.

No blocking product, permission, privacy, accessibility, mutation, or scope
finding remains for the local popup candidate. The installed-toolbar capability
is explicitly blocked rather than inferred.
