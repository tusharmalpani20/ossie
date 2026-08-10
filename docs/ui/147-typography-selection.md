# Plan 147 typography selection

Status: selected for the whole-app continuation; human review remains
deferred until the end of the pass.

## Candidates evaluated

| Candidate | Fit for Ossie | Cost / risk | Decision |
| --- | --- | --- | --- |
| Inter with system fallbacks | Excellent compact UI legibility, readable numerals, and a calm workbench tone | It is not bundled, so the result varies when it is not installed; adding a remote font would add privacy, performance, and dependency cost | Selected as the preferred optional face |
| Geist | Strong technical/editorial tone and already bundled by `apps/docs` | It is scoped to the Documentation app today; extending it to the portal would duplicate ownership and add an asset to the web bundle | Not selected for the whole product |
| System UI stack | Fast, native, resilient, and accessible across platforms | Metrics vary more by operating system and the portal loses the tighter Inter rhythm when Inter is available | Required fallback |

## Selection

Ossie keeps one product stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif
```

Inter is the preferred face when an organization or device already provides
it. The stack has no remote font request and no new product dependency. The
system fallbacks are the actual expected rendering on environments where Inter
is unavailable; the current synthetic runner resolves all candidates to
DejaVu Sans.

This fits the accepted “Quiet Versioned Workbench” direction: compact controls
and dense lists stay legible, public readers remain content-first, and the
product does not acquire a marketing-display typeface or a second typography
system. Page headings use the shared 20–24px range, body text remains 14px at
1.5 line height, and headings use normal tracking with balanced wrapping.

## Implementation boundary

The canonical choice lives in `packages/ui/src/tokens.css` as
`--ossie-font-sans` and is consumed by the web entry shell and public
Documentation reader. Page-local typography cleanup should migrate raw sizes
to the existing shared size and line-height tokens when each surface is
refined; it must not introduce a second font family.

No remote font loading, signup/branding change, or major dependency is part of
this choice.
