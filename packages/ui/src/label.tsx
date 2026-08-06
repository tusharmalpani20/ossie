import { type LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "[font-size:var(--ossie-font-size-sm)] font-semibold leading-none text-[var(--ossie-color-text)]",
        className,
      )}
      {...props}
    />
  )
);

Label.displayName = "Label";
