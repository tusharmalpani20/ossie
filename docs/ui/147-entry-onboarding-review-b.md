# Plan 147 — entry-onboarding blind review B

Candidate: `f27714b` (`fix(web): compose entry onboarding surfaces`)

Review lens: public-entry state truth, auth/setup/invite boundaries, keyboard,
axe, reduced motion, fixture integrity, and exact diff scope.

## Verdict

`accept`

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Product/domain truth | pass | Existing login, first-run setup, and invite branches retain their current API and navigation contracts. |
| Permissions/security | pass | No auth, invite acceptance, setup completion, tenant, cookie, or credential behavior changed. |
| State coverage | pass | Focused tests cover loading, ready, complete, unavailable, error, new-user, existing-user, and invite failure branches; browser proof covers the truthful local complete/unavailable states. |
| Accessibility | pass | 22/22 focused tests; axe reported 0 violations and 0 incomplete items on all six browser routes; the main landmark is named `Entry workspace`. |
| Browser behavior | pass | 1440px and 390px routes have no target horizontal overflow; Tab reaches brand, email, password, submit, then exits to body; reduced-motion media is matched. Browser zoom controls remain environment-limited. |
| Engineering verification | pass | Full web suite 495/495; web check-types, lint, and production build pass. |
| Evidence safety | pass | Screenshots use only local synthetic routes and contain no credentials, cookies, customer data, or raw captured input. |
| Regression scope | pass | Candidate changes are limited to the shared entry shell, entry CSS, invite width constraint, and one shell accessibility test. |

## Findings and limitations

- The disposable local instance is already configured, so the real `/setup`
  route truthfully renders `This instance is already set up.` Browser evidence
  does not claim the setup-ready form or completion mutation; those branches
  remain covered by `FirstRunSetupPage.test.tsx`.
- No seeded loaded organization-invite token was available without creating
  additional local state. Browser evidence uses the truthful invalid invite
  state; loaded new-user, existing-user, and acceptance behavior remains
  covered by `InviteAcceptPage.test.tsx`.
- The repository CSS-token checker remains red on the pre-existing global
  fallback consumers `--ossie-color-link`, `--ossie-font-family-sans`,
  `--ossie-font-size-sm`, and `--ossie-radius-md`; this candidate introduces no
  undefined token names. The issue remains queued as P2-010.

No blocking product, authorization, privacy, accessibility, mutation, or
scope finding remains for this bounded surface.
