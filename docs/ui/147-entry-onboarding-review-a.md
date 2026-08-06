# Plan 147 — entry-onboarding blind review A

Candidate: `f27714b` (`fix(web): compose entry onboarding surfaces`)

Review lens: brand-only entry shell, login form hierarchy, setup and invite
state framing, readable standard-width invite composition, and 390px reflow.

## Verdict

`accept`

## Scores

| Dimension | Score |
| --- | ---: |
| Hierarchy | 4/5 |
| Scanability | 4/5 |
| Density | 4/5 |
| Typography | 4/5 |
| Spacing/alignment | 4/5 |
| Primary-action clarity | 4/5 |
| State clarity | 4/5 |
| Cross-product consistency | 4/5 |
| Responsive composition | 4/5 |

## Findings

- The brand-only header stays quiet and consistent across login, setup, and
  invite entry. The main content now has one explicit `Entry workspace`
  landmark, which gives the shell a clear structural boundary without adding
  portal navigation or distracting utility chrome.
- Login retains a compact, direct form while gaining more deliberate spacing
  and a stable centered card at desktop. At 390px the card and copy reflow
  without clipping or horizontal overflow.
- Setup and invite states share the same entry rhythm. The unavailable invite
  state is a readable 680px card on desktop and a 358px card at 390px rather
  than a full-width banner.
- The candidate is intentionally composition-only. Login, first-run setup,
  invite loading/error/loaded branches, existing-session behavior, and
  navigation contracts remain unchanged.

## Evidence reviewed

- `docs/ui/147-entry-onboarding-before-login-desktop.png`
- `docs/ui/147-entry-onboarding-before-login-narrow.png`
- `docs/ui/147-entry-onboarding-before-setup-desktop.png`
- `docs/ui/147-entry-onboarding-before-setup-narrow.png`
- `docs/ui/147-entry-onboarding-before-invite-desktop.png`
- `docs/ui/147-entry-onboarding-before-invite-narrow.png`
- `docs/ui/147-entry-onboarding-after-login-desktop.png`
- `docs/ui/147-entry-onboarding-after-login-narrow.png`
- `docs/ui/147-entry-onboarding-after-setup-desktop.png`
- `docs/ui/147-entry-onboarding-after-setup-narrow.png`
- `docs/ui/147-entry-onboarding-after-invite-desktop.png`
- `docs/ui/147-entry-onboarding-after-invite-narrow.png`
- Local `/login`, `/setup`, and invalid-invite routes at 1440px and 390px.

No blocking visual finding remains for this bounded surface. Browser zoom
controls remain environment-limited and are recorded as a shared follow-up.
