# Plan 147 — public-access blind review B

Candidate: `8e38ee4` (`fix(web): clarify public version selection`)

Review lens: public-link and Project Version semantics, access boundaries,
keyboard/axe/reduced-motion behavior, URL mutation scope, fixture integrity,
and regression coverage.

## Verdict

`accept`

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Product/domain truth | pass | Copy uses the accepted Project Version term; selected-entry routing and `embed` suffix behavior are unchanged. |
| Permissions/security | pass | No Publish Link, password, viewer-session, Publication, Revision, tenant, or credential behavior changed. |
| State coverage | pass | Guide/Demo/Documentation public-reader tests retain password, invalid-password, restricted, expired, unavailable, and ready branches; selector tests cover single and multi-entry states. |
| Accessibility | pass | Focused public-access/readers 16/16; browser axe reported 0 violations and 0 incomplete items on the valid Guide and truthful unavailable Demo routes at desktop/narrow. |
| Browser behavior | pass | Valid Guide has no target overflow at 1440px or 390px; selector styling is responsive; reduced-motion media was matched. Browser zoom controls remain environment-limited. |
| Engineering verification | pass | Full web suite 496/496; web check-types, lint, and production build pass. |
| Evidence safety | pass | Local synthetic routes only; no passwords, cookies, session tokens, customer data, or raw captured input recorded. |
| Regression scope | pass | Candidate changes are limited to `PublicVersionSelector` markup/CSS and its focused test. |

## Findings and limitations

- The Guide fixture exposes one Project Version in the browser, so the visual
  chip is direct route evidence. The multi-entry combobox is verified through
  the focused component test; no multi-entry browser fixture was fabricated.
- The available local Demo and Documentation slugs currently render their
  generic unavailable states. Their before/after screenshots prove that the
  shared selector change does not disturb unavailable access messaging, not
  that populated content is present.
- `pnpm check-css-tokens` remains red on the pre-existing global fallback
  consumers `--ossie-color-link`, `--ossie-font-family-sans`,
  `--ossie-font-size-sm`, and `--ossie-radius-md`; the selector candidate uses
  only defined Ossie tokens. This remains queued as P2-010.

No blocking product, public-link, authorization, privacy, accessibility,
mutation, or scope finding remains for this bounded surface.
