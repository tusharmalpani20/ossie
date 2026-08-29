import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-[var(--ossie-radius-control)] border border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] px-3 py-2 text-sm font-normal text-[var(--ossie-color-text)] transition-colors placeholder:text-[var(--ossie-color-text-muted)] focus-visible:outline-none focus-visible:ring-[var(--ossie-focus-ring-width)] focus-visible:ring-[var(--ossie-color-focus)] focus-visible:ring-offset-[var(--ossie-focus-ring-offset)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
