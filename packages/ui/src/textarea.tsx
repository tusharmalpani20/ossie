import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";
import {
  controlShapeClasses,
  controlSurfaceClasses,
  disabledClasses,
  focusVisibleClasses,
} from "./primitive-classes";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        `flex min-h-[var(--ossie-control-min-height-textarea)] w-full ${controlShapeClasses} ${controlSurfaceClasses} px-[var(--ossie-space-3)] py-[var(--ossie-space-2)] placeholder:text-[var(--ossie-color-muted)] ${focusVisibleClasses} ${disabledClasses}`,
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
