# Plan 147 global-fallback review A

Candidate: `de37b5e`  
Surface: unsupported route `/unknown`  
Reviewer: A — visual and interaction quality  
Verdict: `accept`

## Review scope

Reviewed the anonymous unsupported-route state at 1440×900 and 390×900 with
reduced motion enabled. The candidate is intentionally small: it clarifies the
Page-not-found hierarchy, gives the main landmark a name, removes the fallback
page gradient, and provides two stable recovery links.

## Findings and scores

- “Page not found” is now the one clear level-one title rather than the generic
  “Ossie portal” label.
- “Open Projects” is the primary recovery action; “Sign in” is a quiet
  secondary route for an unauthenticated visitor.
- The message stays truthful for an unsupported route and does not invent a
  route registry or expose internal identifiers.
- The centered card remains calm and bounded on desktop and narrow widths.

| Dimension | Score |
| --- | ---: |
| Hierarchy | 4/5 |
| Recovery clarity | 5/5 |
| Density | 4/5 |
| Typography | 4/5 |
| Spacing | 4/5 |
| Responsive composition | 4/5 |
| Cross-product consistency | 4/5 |

## Evidence and disposition

Before: `147-global-fallback-before-desktop.png` and
`147-global-fallback-before-narrow.png`. After:
`147-global-fallback-after-desktop.png` and
`147-global-fallback-after-narrow.png`.

Before had no heading, one brand link, and one main at both widths. After has a
Page-not-found h1, named main, three links, 900px document height, no page
overflow, and axe 0 violations / 0 incomplete at both widths. Keyboard reached
Ossie, Open Projects, and Sign in in that order.

Accept pending human review. Documentation lazy-route failure remains covered
by its existing Retry Documentation boundary and is not changed by this
unsupported-route candidate.
