import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";
import {
  controlShapeClasses,
  controlSurfaceClasses,
  disabledClasses,
  focusVisibleClasses,
} from "./primitive-classes";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        `flex h-[var(--ossie-control-height)] w-full ${controlShapeClasses} ${controlSurfaceClasses} px-[var(--ossie-space-3)] py-[var(--ossie-space-2)] placeholder:text-[var(--ossie-color-muted)] ${focusVisibleClasses} ${disabledClasses}`,
        className
      )}
      type={type}
      {...props}
    />
  )
);

Input.displayName = "Input";
