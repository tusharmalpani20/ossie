---
name: Ossie
description: Quiet Versioned Workbench for governed product knowledge.
colors:
  background: "#f7f8fb"
  surface: "#ffffff"
  surface-elevated: "#f9fafb"
  border: "#d9e0e7"
  border-strong: "#aab4c0"
  text: "#111827"
  text-muted: "#4d5968"
  accent: "#2563eb"
  success: "#0f766e"
  warning: "#92400e"
  danger: "#b42318"
  focus: "#1d4ed8"
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
    backgroundColor: "{colors.text}"
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
dimensions, clear type, and state-specific color. Motion is sparse and explains
state, hierarchy, or continuity.

Key characteristics:

- visible but compact version context;
- dense lists and tables for operational library surfaces;
- full workbench layouts for authoring surfaces;
- content-first public readers/viewers;
- restrained forms and tables for settings/admin;
- grouped timelines for activity/compliance.

## 2. Colors

The palette is restrained and state-rich. Neutral surfaces carry most of the
interface. Accent color is reserved for primary action, selection, focus, and
meaningful state.

### Primary

- Text `#111827`: primary ink and high-emphasis controls.
- Accent `#2563eb`: current selection, primary affordance, and link/action
  emphasis.
- Focus `#1d4ed8`: visible keyboard focus ring.

### State

- Success `#0f766e`: completed, safe, or published state.
- Warning `#92400e`: pending, archived, or caution state.
- Danger `#b42318`: destructive or failed state.

### Neutral

- Background `#f7f8fb`: app chrome and workbench page background.
- Surface `#ffffff`: primary content surface.
- Surface elevated `#f9fafb`: secondary panels, rails, and subtle groups.
- Border `#d9e0e7`: default separation.
- Muted text `#4d5968`: secondary labels and helper copy.

Color must not be the only signal. Pair state colors with text, icon, shape, or
placement.

## 3. Typography

Use one system-sans stack for product UI. Do not use viewport-scaled text.

- Body: 14px, line-height 1.5.
- Small labels: 12px, line-height 1.35.
- Page/workbench headings: 20px to 24px, line-height 1.25.
- Section headings: 16px to 18px, line-height 1.3.
- Data cells and compact controls may use 13px where density is required.

Headings use normal letter spacing. Use `text-wrap: balance` for headings and
`text-wrap: pretty` for prose where supported.

## 4. Elevation

Ossie uses structural layering before decorative shadow. Prefer borders, spacing,
and tonal surfaces. Shadows are allowed only when they clarify popovers, menus,
dialogs, toasts, or overlays.

Radii:

- Controls: 6px.
- Cards and panels: 8px maximum.
- Popovers/dialogs: 8px.
- Pills: only for badges, compact labels, or avatars.

Avoid wide ghost-card shadows paired with borders. Avoid nested cards.

## 5. Components

Shared primitives live in `packages/ui`. Tailwind CSS 4, Lucide, CVA-style
variants, `clsx`, and `tailwind-merge` remain the foundation.

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

## 6. Do's and Don'ts

Do:

- keep Organization, Project, and Project Version context visible;
- suppress unnecessary version-management ceremony when only `Main` exists;
- use progressive disclosure for infrequent or destructive operations;
- keep frequent commands directly reachable;
- preserve desktop density and adapt mobile by task priority;
- record loading, empty, error, permission, read-only, archived, destructive,
  keyboard, focus, 200% zoom, and reduced-motion states.

Don't:

- claim Documentation or Video behavior exists before implementation;
- use `version` without a qualifier;
- create decorative gradient/orb backgrounds;
- use dark mode unless it is explicitly accepted and complete;
- add Radix, React Router, TanStack Query, Sonner, React Hook Form, or another
  major dependency without a concrete accepted need;
- weaken public-link, access, audit, protected-asset, or tenant rules for visual
  convenience.
