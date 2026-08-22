---
name: Ossie
description: Quiet Versioned Workbench for governed product knowledge.
colors:
  background: "#f8f7fb"
  surface: "#ffffff"
  surface-subtle: "#f3f1f8"
  surface-elevated: "#ffffff"
  border: "#ded9e8"
  border-strong: "#918a9d"
  text: "#17151f"
  text-muted: "#5f5a69"
  brand-ink: "#23164c"
  accent: "#6d46d9"
  accent-hover: "#5c36c4"
  accent-active: "#4b2aa6"
  accent-subtle: "#f3f0ff"
  accent-border: "#d9d1fa"
  success: "#0f766e"
  warning: "#92400e"
  danger: "#b42318"
  focus: "#7548eb"
rounded:
  control: "6px"
  card: "8px"
  popover: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  section: "48px"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
---

# Design System: Ossie

## 1. Overview

Creative North Star: "Quiet Versioned Workbench"

Ossie is an operational product UI. It should feel like a reliable workbench for
teams preserving product knowledge, not a campaign page. The product pattern is
persistent Organization -> Project -> Project Version context, compact
navigation, content-first work areas, progressive disclosure, and explicit
lifecycle/status language.

Design should preserve density and scan speed. Use restrained surfaces, stable
dimensions, clear type, and state-specific color. Purple is Ossie's signature,
not its wallpaper. Motion is sparse and explains state, hierarchy, or
continuity.

Key characteristics:

- visible but compact version context;
- dense lists and tables for operational library surfaces;
- full workbench layouts for authoring surfaces;
- content-first public readers/viewers;
- focused entry and split first-run onboarding surfaces;
- restrained forms and tables for settings/admin;
- grouped timelines for activity/compliance.

## 2. Colors

The palette is restrained and state-rich. Neutral surfaces carry most of the
interface. Accent color is reserved for primary action, selection, focus, and
interactive emphasis.

### Brand and primary action

- Brand ink `#23164c`: committed brand regions, inverted brand copy, and rare
  high-emphasis identity moments.
- Accent `#6d46d9`: primary actions, current selection, links, and active
  affordances.
- Accent hover `#5c36c4` and active `#4b2aa6`: interaction states for the
  accent.
- Accent subtle `#f3f0ff` and accent border `#d9d1fa`: selected rows, quiet
  highlights, and restrained brand framing.
- Focus `#7548eb`: visible keyboard focus ring.

White text on the accepted accent has a measured contrast ratio of about
5.95:1. Primary and muted text also meet WCAG 2.2 AA against the accepted light
surfaces. Recheck contrast whenever a token changes.

### State

- Success `#0f766e`: completed, safe, or published state.
- Warning `#92400e`: pending, archived, or caution state.
- Danger `#b42318`: destructive or failed state.

### Neutral

- Text `#17151f`: primary ink and high-emphasis neutral content.
- Background `#f8f7fb`: app chrome and workbench page background.
- Surface `#ffffff`: primary content surface.
- Surface subtle `#f3f1f8`: secondary panels, rails, and subtle groups.
- Surface elevated `#ffffff`: menus, dialogs, and floating content when
  elevation is also behaviorally justified.
- Border `#ded9e8`: default separation.
- Border strong `#918a9d`: control boundaries and higher-emphasis separation.
- Muted text `#5f5a69`: secondary labels and helper copy.

Color must not be the only signal. Pair state colors with text, icon, shape, or
placement.

Operational surfaces use the restrained color strategy: saturated purple
normally occupies roughly 5–12% of a screen. A focused brand surface such as
first-run setup may use one committed deep-purple region. Status colors remain
semantic; do not recolor success, warning, danger, archived, or permission
states purple. Do not use purple-to-blue gradients, glows, or decorative blobs.

## 3. Typography

Use one system-sans stack for product UI. Do not use viewport-scaled text.

- Body: 14px, line-height 1.5.
- Small labels: 12px, line-height 1.35.
- Page/workbench headings: 20px to 24px, line-height 1.25.
- Section headings: 16px to 18px, line-height 1.3.
- Data cells and compact controls may use 13px where density is required.

Headings use normal letter spacing. Use `text-wrap: balance` for headings and
`text-wrap: pretty` for prose where supported.

## 4. Spacing, Density, And Control Size

Use the accepted 4px-based spacing values: `4`, `8`, `12`, `16`, `24`, `32`,
`48`, and `64` pixels. Prefer those values over arbitrary local spacing.

Typical relationships:

- icon to label: 8px;
- label to control: 8px;
- related controls: 16px;
- form groups: 24px to 32px;
- standard panel padding: 24px;
- wide page sections: 32px to 48px;
- narrow viewport page padding: 20px to 24px.

Use only these control heights unless a proven surface needs otherwise:

- compact: 32px for dense toolbars and extension utilities;
- standard: 40px for normal product controls;
- comfortable: 44px for form-heavy entry, onboarding, and touch-priority
  surfaces;
- large: 48px only for rare high-emphasis entry actions.

Compact density is appropriate for repeated operational work. Comfortable
density is appropriate for entry and setup. Related surfaces must not choose
their density independently.

## 5. Elevation

Ossie uses structural layering before decorative shadow. Prefer borders, spacing,
and tonal surfaces. Shadows are allowed only when they clarify popovers, menus,
dialogs, toasts, or overlays.

Radii:

- Controls: 6px.
- Cards and panels: 8px maximum.
- Popovers/dialogs: 8px.
- Pills: only for badges, compact labels, or avatars.

Avoid wide ghost-card shadows paired with borders. Avoid nested cards.

## 6. Components

Shared primitives live in `packages/ui`. Tailwind CSS 4, Lucide, CVA-style
variants, `clsx`, and `tailwind-merge` remain the foundation.

Every interactive primitive must define default, hover, active, focus-visible,
disabled, and busy behavior where applicable. Form primitives also define
invalid, error, and success behavior without relying on color alone.

Core primitive expectations:

- Button: default, hover, focus, active, disabled, loading-safe sizing, and
  icon-label support.
- Badge: default, success, warning, and destructive states with text labels.
- Alert: status and error communication without color-only meaning.
- Card: restrained container only when a surface boundary is needed. An
  explicitly named Card is a region; an unnamed Card remains a neutral
  container.
- Input, Select, Textarea, Label: visible labels, disabled state, error/helper
  placement, and stable height.
- Separator: semantic section or control grouping, not decoration.

Form rules:

- every field has a persistent visible label;
- help and error text has a stable location associated with its control;
- invalid submission focuses the first invalid field;
- input types, names, and autocomplete values match the requested data;
- password fields support password managers, paste, and an accessible
  show/hide action;
- submission prevents duplicates while retaining the action label beside any
  loading indicator;
- server failures preserve safe entered values and provide a recovery path;
- placeholder text is optional guidance, never the label, and must meet the
  same 4.5:1 contrast requirement as other readable text.

## 7. Approved Page Patterns

Choose the simplest approved pattern that fits the user's task. An agent may
choose among these patterns, but it must not invent a new page shell without an
explicit design decision.

| User task                                                      | Approved pattern           | Composition rule                                                                                            |
| -------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Sign in, accept an invite, or complete one short isolated form | Focused entry              | One quiet column, normally 400–440px, with no application navigation                                        |
| Initialize a self-hosted instance                              | Split first-run onboarding | Committed brand region plus a 460–480px form region on wide screens; compact brand header on narrow screens |
| Find or manage repeated records                                | Library/operations         | Page/context header, filters when useful, dense list or table, stable row actions                           |
| Author structured content or media                             | Authoring workbench        | Navigator, primary canvas/document, inspector, compact command/status regions                               |
| Read a draft, Revision, or Publication                         | Reader/viewer              | Content first, readable measure, minimal chrome, access/version controls only when applicable               |
| Manage settings or permissions                                 | Settings/admin             | Restrained navigation and grouped forms/tables with permission-aware actions                                |
| Inspect activity or compliance                                 | Activity/compliance        | Chronological groups, explicit actor/source/status, filters that preserve context                           |
| Capture from the browser extension                             | Compact extension utility  | One dominant current task, compact recovery, no portal-sized composition                                    |

Pattern-selection workflow:

1. State the user's goal and the one primary action.
2. Choose one approved pattern and explain why it fits.
3. Reuse production primitives and existing accepted composites.
4. List the applicable loading, empty, error, permission, read-only, archived,
   conflict, destructive, success, and busy states.
5. Describe the deliberate narrow-screen composition before coding.
6. Render the real route and compare it with the approved references indexed in
   `docs/ui/README.md`.

### Split first-run onboarding

The self-hosted `/setup` route uses the accepted split first-run onboarding
pattern.

On wide desktop screens:

- remove the normal application header and navigation;
- use approximately 35–40% of the width for a deep brand-ink region;
- limit that region to the Ossie mark, one concise heading, and factual setup
  guidance; do not invent claims, statistics, or testimonials;
- use the remaining white region for a 460–480px form without wrapping that
  form in an unnecessarily small floating card;
- group Owner details separately from Organization details;
- place first and last name in one row when space allows;
- use comfortable 44px controls and the purple accent for the primary action
  and focus state.

On narrow screens, replace the full brand region with a compact branded header,
use 20–24px horizontal padding, keep content near the top, and stack all fields.
Business behavior, self-hosted setup guards, validation, and security remain
unchanged.

### Other archetypes

Archetype rules:

- Library/operations: dense, filterable lists or tables with clear status,
  owner, Project Version, and row actions.
- Authoring workbench: navigator/outline, primary document or canvas, inspector,
  and compact command bar. Do not compose it from nested cards.
- Reader/viewer: authored content or media first; minimal chrome; Publish
  Link-scoped Project Version selector only when applicable.
- Settings/admin: restrained forms, tables, and confirmations with
  permission-aware actions.
- Activity/compliance: chronological grouped timelines with actor/source labels,
  typed diffs, and role-appropriate visibility.

Do not use a card merely to center or contain a page. A card is appropriate only
when it represents a meaningful interactive or informational region.

## 8. Motion, Accessibility, And Visual Verification

Motion:

- Fast transitions: 150ms.
- Normal transitions: 220ms.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Reduced motion: instant state changes.

Accessibility:

- Every route has a descriptive, privacy-safe document title. Do not place
  opaque IDs, invite tokens, public slugs, or other URL secrets in titles.
- Authenticated shells expose a focus-visible bypass link to the primary
  content before repeated navigation.
- Custom modal dialogs move focus inside, contain Tab navigation, close with
  Escape when safe, and restore focus to the exact trigger.
- Pointer targets are at least 24 by 24 CSS pixels or have equivalent clear
  spacing.
- The web and extension reduced-motion media rules suppress nonessential
  transition/animation duration globally while preserving content and commands.

Validation matrix:

- Primary browser evidence uses Chromium-based browser automation.
- Required viewport checks are desktop, narrow mobile near 390px width, and
  200% zoom/reflow.
- Later browser work must record console errors, failed requests, keyboard
  focus, loading, empty, error, permission, destructive, read-only, archived, and
  reduced-motion states when those states exist on the surface.

Performance budgets:

- Child `121` review-route production build baseline is web JS gzip `122.07 kB`.
  Later children must measure and justify material increases.
- Navigation and common command feedback should feel immediate; defer expensive
  work rather than blocking visible state changes.
- Editor and media layouts must reserve stable space so images, previews, and
  inspectors do not cause avoidable layout shift.
- Dev-only review code must stay unreachable in production behavior.

Visual acceptance:

- rendered purpose, hierarchy, scanability, density, typography,
  spacing/alignment, primary action, state clarity, consistency, and responsive
  behavior must each score at least 4/5 under Plan `147`;
- existing screenshots are not automatically approved visual references;
- a candidate becomes an approved visual reference only after the required
  engineering checks and explicit human acceptance;
- during the current page-by-page quality program, stop after each completed
  surface so the user can inspect it before work begins on the next surface.

## 9. Do's and Don'ts

Do:

- keep Organization, Project, and Project Version context visible;
- suppress unnecessary version-management ceremony when only `Main` exists;
- use progressive disclosure for infrequent or destructive operations;
- keep frequent commands directly reachable;
- use purple consistently for primary action, focus, selection, and deliberate
  brand moments;
- preserve desktop density and adapt mobile by task priority;
- record loading, empty, error, permission, read-only, archived, destructive,
  keyboard, focus, 200% zoom, and reduced-motion states.

Don't:

- claim Documentation or Video behavior exists before implementation;
- use `version` without a qualifier;
- create decorative gradient/orb backgrounds;
- turn purple into a one-hue wallpaper or recolor semantic status states;
- use dark mode unless it is explicitly accepted and complete;
- add Radix, React Router, TanStack Query, Sonner, React Hook Form, or another
  major dependency without a concrete accepted need;
- weaken public-link, access, audit, protected-asset, or tenant rules for visual
  convenience.
