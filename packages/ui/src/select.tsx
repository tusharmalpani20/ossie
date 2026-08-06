import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";
import {
  controlShapeClasses,
  controlSurfaceClasses,
  disabledClasses,
  focusVisibleClasses,
} from "./primitive-classes";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        `flex h-[var(--ossie-control-height)] w-full ${controlShapeClasses} ${controlSurfaceClasses} px-[var(--ossie-space-3)] py-[var(--ossie-space-2)] ${focusVisibleClasses} ${disabledClasses}`,
        className
      )}
      {...props}
    />
  )
);

Select.displayName = "Select";
