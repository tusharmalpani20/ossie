# Plan 147 — public-access blind review A

Candidate: `8e38ee4` (`fix(web): clarify public version selection`)

Review lens: public Project Version context, single-entry chip hierarchy,
multi-entry selector clarity, narrow reflow, and consistency across public
readers.

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

- The single-entry state now reads as a compact `Project Version: ...` chip,
  which gives the published context a visible bounded unit instead of loose
  muted text.
- The multi-entry state presents `Project Version` as the visible field label
  and names the combobox `Public Project Version` for assistive technology.
  The control has enough height and border contrast to read as an intentional
  public-reader control while staying quiet beside the article/stage.
- The selector reflows to a full-width control at narrow widths without
  changing the existing public URL selection behavior.
- The candidate is deliberately shared and small: it changes selector copy,
  semantics, and CSS only. Guide, Demo, Documentation, Publish Link,
  Publication, Revision, access, and Version contracts remain untouched.

## Evidence reviewed

- `docs/ui/147-public-access-before-guide-desktop.png`
- `docs/ui/147-public-access-before-guide-narrow.png`
- `docs/ui/147-public-access-after-guide-desktop.png`
- `docs/ui/147-public-access-after-guide-narrow.png`
- `docs/ui/147-public-access-before-demo-desktop.png`
- `docs/ui/147-public-access-before-demo-narrow.png`
- `docs/ui/147-public-access-after-demo-desktop.png`
- `docs/ui/147-public-access-after-demo-narrow.png`
- Anonymous local `/p/plan127-public` at 1440px and 390px.
- `PublicVersionSelector.test.tsx` multi-entry component evidence.

The local Demo and Documentation slugs render truthful unavailable states in
this disposable seed and are not treated as populated reader evidence. No
blocking visual finding remains for this bounded surface.
