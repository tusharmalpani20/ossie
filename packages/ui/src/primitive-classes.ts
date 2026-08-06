/**
 * Semantic class fragments shared by the small Ossie UI primitives.
 *
 * Tailwind still owns composition and caller overrides; these fragments keep
 * the primitive defaults on the canonical token authority.
 */

export const focusVisibleClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ossie-color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ossie-color-background)]";

export const controlSurfaceClasses =
  "border border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)] shadow-[var(--ossie-shadow-control)] transition-colors";

export const controlShapeClasses =
  "rounded-[var(--ossie-radius-control)] [font-size:var(--ossie-font-size-sm)]";

export const disabledClasses =
  "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50";
