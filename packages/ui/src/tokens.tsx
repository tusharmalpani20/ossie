/**
 * @fileoverview Shared semantic design tokens for Ossie UI foundations.
 */

export const semanticColorTokens = {
  background: "#f8f7fb",
  surface: "#ffffff",
  surfaceSubtle: "#f3f1f8",
  surfaceElevated: "#ffffff",
  border: "#ded9e8",
  borderStrong: "#918a9d",
  brandInk: "#23164c",
  text: "#17151f",
  textMuted: "#5f5a69",
  muted: "#5f5a69",
  accent: "#6d46d9",
  accentHover: "#5c36c4",
  accentActive: "#4b2aa6",
  accentSubtle: "#f3f0ff",
  accentBorder: "#d9d1fa",
  primary: "#6d46d9",
  primaryHover: "#5c36c4",
  primaryActive: "#4b2aa6",
  link: "#5c36c4",
  inverted: "#ffffff",
  success: "#0f766e",
  warning: "#92400e",
  danger: "#b42318",
  focus: "#7548eb",
  overlay: "rgba(23, 21, 31, 0.58)",
  selected: "#f3f0ff",
  disabled: "#e5e7eb",
  code: "#1f2937",
} as const;

export const spacingTokens = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "24px",
  6: "32px",
  7: "48px",
  8: "64px",
} as const;

export const radiusTokens = {
  sm: "6px",
  control: "6px",
  card: "8px",
  popover: "8px",
  pill: "999px",
} as const;

export const controlHeightTokens = {
  compact: "32px",
  standard: "40px",
  comfortable: "44px",
  large: "48px",
  icon: "36px",
} as const;

export const focusTokens = {
  width: "2px",
  offset: "2px",
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
