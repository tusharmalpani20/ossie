# Child 122 Portal Shell Baseline

Date: 2026-07-26

Starting commit: `ab02f6d`

## Scope

This record covers child `122`, Portal Architecture And Application Shell.
It uses only safe synthetic browser data and local routes.

## Inherited Child 121 Carryover

Child `121` recorded that the full authenticated workflow screenshot matrix for
children `122` through `128` was not captured before visual shell work began.
For this child, the local backend/session was unavailable during browser
validation, so a full authenticated matrix remains a carryover for the next
workflow children.

This child did capture safe shell evidence for the production web bundle using
browser-level mocked read-only responses for:

- `GET /api/v1/public/instance`
- `GET /api/v1/projects?status=active`

The mock data used synthetic IDs, names, and dates only.

## Evidence Captured

- `docs/ui/evidence/122/projects-desktop-shell.png`
- `docs/ui/evidence/122/projects-mobile-shell.png`
- `docs/ui/evidence/122/project-version-guides-desktop-shell.png`
- `docs/ui/evidence/122/project-version-guides-mobile-shell.png`

## Browser Checks

- Opened `http://localhost:3000/projects` against the built Vite preview.
- Confirmed the topbar, sign-out control, portal navigation, breadcrumb area,
  project list heading, create action, project status filter, and synthetic
  project row render.
- Confirmed narrow mobile viewport `390x844` keeps the shell navigation and
  main content reachable.
- Confirmed keyboard `Tab` can move focus into the visible portal controls.
- Checked browser page errors after validation; none were reported for the
  mocked shell run.
- During close-previous audit, opened
  `http://localhost:3000/projects/project_1/versions/main/guides` against the
  built Vite preview with safe mocked read-only Project, Project Version, and
  guide-list responses.
- Confirmed the Project Version guide-list route has one topbar, one portal
  navigation landmark, `Guides` as the active nav item, the empty guide state
  visible, and no retry state.
- Confirmed the same Project Version guide-list route at `390x844` mobile keeps
  one shell and the correct active nav item.

## Blocked Matrix

The full authenticated workflow matrix remains blocked because no local backend,
seeded database, or authenticated session was available in this implementation
turn. Do not use this file as evidence that real authenticated organization,
project, capture, guide, demo, editor, or permission-denied workflows were
fully browser-validated.

## Carry Into Child 123

Child `123` should start by confirming the shell still wraps setup/login,
organization members, and organization compliance behavior without changing
authentication semantics. If a seeded local backend is available, it should
replace this synthetic shell evidence with real authenticated screenshots.
