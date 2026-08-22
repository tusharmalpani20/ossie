import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-[var(--ossie-control-height-standard)] w-full rounded-[var(--ossie-radius-control)] border border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] px-3 py-2 text-sm text-[var(--ossie-color-text)] transition-colors placeholder:text-[var(--ossie-color-text-muted)] focus-visible:outline-none focus-visible:ring-[var(--ossie-focus-ring-width)] focus-visible:ring-[var(--ossie-color-focus)] focus-visible:ring-offset-[var(--ossie-focus-ring-offset)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--ossie-color-danger)]",
        className,
      )}
      type={type}
      {...props}
    />
  ),
);

Input.displayName = "Input";
