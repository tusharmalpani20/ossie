# Child 124 Browser Evidence: Project Version And Library UI

Date: 2026-07-26

Build under test: production `apps/web` build served with Vite preview at
`http://127.0.0.1:3000`.

Browser tool: `agent-browser` with Chromium.

Data: safe synthetic local/mocked API responses only.

## Result

Passed smoke coverage with safe mocked browser responses:

- `/projects` desktop and narrow mobile render the Project list through the
  portal shell and link the Project card to the canonical Default Project
  Version URL: `/projects/project_1/versions/main`.
- `/projects/project_1/versions/main` desktop renders the Project Version
  workspace, context bar, canonical library links, and Carry Forward entry.
- Switching the Project Version selector from `main` to `q3` changes the
  workspace URL to `/projects/project_1/versions/q3`.
- `/projects/project_1/versions/q3/guides` renders with `Q3 rollout` context.
  Switching the selector back to `Main` preserves the route family and lands on
  `/projects/project_1/versions/main/guides`.
- `/projects/project_1/settings#project-versions` desktop and narrow mobile
  render Project Version management. The Default Project Version archive button
  is disabled and the UI says `Default Project Version cannot be archived.`
- Browser console and page-error checks were clean in the final desktop settings
  session and final mobile session.
- Final request scans showed the mocked API requests used by the checked pages
  returning HTTP 200.

## Blocked Matrix Items

The full child-plan browser matrix was not completed because this closeout did
not establish a seeded authenticated local API/runtime fixture. Browser coverage
therefore used URL-level mocked API responses and should be treated as smoke
evidence, not a full end-to-end mutation run.

Blocked or not independently validated in browser:

- 200% browser zoom/reflow across every required route.
- Keyboard-only operation across Project create, Project archive/restore, every
  Project Version mutation, Carry-Forward entry, all library list navigation,
  shell navigation, and sign-out.
- Project creation success and conflict/error through a real authenticated API.
- Project Version create, edit, reorder, set Default, archive, restore, and
  conflict handling through a real authenticated API.
- Admin and non-admin settings through real authorization fixtures.
- Archived Project and archived Project Version read-only behavior through real
  seeded lifecycle state.
- Public Guide and public Interactive Demo browser routes in the same
  agent-browser run.

Covered instead by focused/unit tests and broad web tests where applicable.
Child `125` should establish a better seeded browser fixture if it needs to
claim the full interaction matrix rather than smoke coverage.

## Screenshots

- `docs/ui/evidence/124/projects-desktop.png`
- `docs/ui/evidence/124/projects-mobile.png`
- `docs/ui/evidence/124/project-version-workspace-desktop.png`
- `docs/ui/evidence/124/project-version-guides-desktop.png`
- `docs/ui/evidence/124/project-settings-version-management-desktop.png`
- `docs/ui/evidence/124/project-settings-version-management-mobile.png`

## Notes

- A first settings attempt used an incorrect mocked response shape for Project
  Membership and caused a browser-only React crash. The mock was corrected to
  return `members`, the browser session was reset, and the final settings runs
  passed with no console or page errors.
- No customer data, private URLs, cookies, tokens, credentials, raw captured
  input, or private screenshots were used.
