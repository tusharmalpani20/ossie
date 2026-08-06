# Plan 147 — project-versions blind review A

Candidate: `c93ca11` (`fix(web): compose Project Version surfaces`)

Review lens: Project Version identity, lifecycle hierarchy, create/edit density,
active/archived grouping, workspace navigation cards, narrow composition, and
the shared-shell boundary.

## Verdict

`accept`

## Findings

- The Project Version management panel now separates creation from active and
  archived lifecycle groups. Version identity, Default/Archived badges,
  canonical slug, release date, edit fields, ordering actions, and lifecycle
  actions read as one coherent row rather than one loose control stream.
- The workspace gives the selected Project Version a clear heading, bounded
  metadata cards, and four equally weighted destination cards. Carry Forward
  remains present only for the active non-default owner state.
- At 390px the context bar now stacks the project identity, selected Version,
  selector, and Manage Versions link without breaking the Version name into
  letter fragments. Metadata and destination cards stack with no target-area
  overflow.
- Active/default, active/non-default, and archived states retain their visual
  distinctions. Archived workspace evidence remains read-only and continues to
  explain the lifecycle state.

## Evidence reviewed

- `docs/ui/147-project-versions-before-settings-desktop.png`
- `docs/ui/147-project-versions-before-settings-narrow.png`
- `docs/ui/147-project-versions-before-workspace-desktop.png`
- `docs/ui/147-project-versions-before-workspace-narrow.png`
- `docs/ui/147-project-versions-after-settings-desktop.png`
- `docs/ui/147-project-versions-after-settings-narrow.png`
- `docs/ui/147-project-versions-after-settings-versions-desktop.png`
- `docs/ui/147-project-versions-after-workspace-desktop.png`
- `docs/ui/147-project-versions-after-workspace-narrow.png`
- Authenticated owner settings/workspace routes at 1440px and 390px,
  including Summer release selection and Archived release context.

The shared portal navigation remains horizontally scrollable at narrow widths;
that existing shell behavior is outside this candidate. No blocking visual or
interaction finding remains for this bounded surface.
