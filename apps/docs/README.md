# Ossie Docs App

`apps/docs` is the compact repository documentation hub for Ossie.

It is not the future customer-authored Product Documentation artifact family. The markdown files under the repo root and `docs/` remain the source of truth for setup, operations, roadmap, dogfood evidence, and contribution flow.

The rendered site separates `What Works Today` from the accepted `Next Platform
Direction`. Project Versions, Editions, Revisions, Publications, and the
modernized current-product UI are shipped alpha foundations. Future-direction
copy must never imply that customer-authored Product Documentation or Video is
already implemented.

## Run Locally

```bash
rtk pnpm --filter docs dev
```

The app runs on port `3001`.

## Checks

```bash
rtk pnpm --filter docs test
rtk pnpm --filter docs check-types
rtk pnpm --filter docs lint
rtk pnpm --filter docs build
```

## Content Rules

- Keep alpha limitations visible.
- Link to source markdown docs instead of copying every doc into the app.
- Use only safe synthetic screenshots from `docs/assets/alpha/`.
- Do not position Ossie as hosted SaaS.
- Keep Product Documentation distinct from Guides and from this Docs App.
- Keep Loom-style Video visibly deferred and unmodeled.
