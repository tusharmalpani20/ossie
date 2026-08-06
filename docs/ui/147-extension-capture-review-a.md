# Plan 147 — extension-capture blind review A

Candidate: `106705c` (`fix(extension): group capture actions`)

Review lens: compact utility hierarchy, Capture context, Project Version
identity, action grouping, recovery affordance, narrow wrapping, and popup
restraint.

## Verdict

`accept` for the local popup candidate; installed-toolbar verification remains
blocked for this run.

## Findings

- The active popup keeps Capture state as the dominant task, with account and
  instance controls remaining secondary. The action cluster now has a named
  `Capture actions` group and a light divider that makes the transition from
  status to command controls clear.
- Project and Project Version context remain visible in both selection and
  active states, including deliberately long synthetic labels. The local clear
  action remains visually secondary to capture and completion.
- At 360px the active and selection states retain the compact utility rhythm;
  at the 180px reflow proxy, action labels wrap inside the popup instead of
  forcing horizontal overflow.
- The direct popup remains appropriately restrained for an extension surface;
  no portal or browser-page chrome was introduced.

## Evidence reviewed

- `docs/ui/147-extension-capture-before-active.png`
- `docs/ui/147-extension-capture-before-active-scrolled.png`
- `docs/ui/147-extension-capture-after-active.png`
- `docs/ui/147-extension-capture-after-selection.png`
- `docs/ui/147-extension-capture-after-180.png`
- Repository-approved synthetic direct-popup fixture at 360px and 180px.

No blocking visual or interaction finding remains for the local popup scope.
The installed toolbar action could not be opened by this runner.
