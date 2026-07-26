/**
 * @fileoverview Shared semantic design tokens for Ossie UI foundations.
 */

export const semanticColorTokens = {
  background: "#f7f8fb",
  surface: "#ffffff",
  surfaceElevated: "#f9fafb",
  border: "#d9e0e7",
  borderStrong: "#aab4c0",
  text: "#111827",
  textMuted: "#4d5968",
  accent: "#2563eb",
  success: "#0f766e",
  warning: "#92400e",
  danger: "#b42318",
  focus: "#1d4ed8",
  overlay: "rgba(17, 24, 39, 0.58)",
  selected: "#eff6ff",
  disabled: "#e5e7eb",
  code: "#1f2937",
} as const;

export const radiusTokens = {
  control: "6px",
  card: "8px",
  popover: "8px",
  pill: "999px",
} as const;

export const typographyTokens = {
  body: {
    family:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    size: "14px",
    lineHeight: "1.5",
  },
  heading: {
    family:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    size: "20px",
    lineHeight: "1.25",
    letterSpacing: "normal",
  },
  label: {
    size: "12px",
    lineHeight: "1.35",
    letterSpacing: "normal",
  },
} as const;

export const motionTokens = {
  fast: {
    durationMs: 150,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  normal: {
    durationMs: 220,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  reduced: {
    durationMs: 0,
    easing: "linear",
  },
} as const;
