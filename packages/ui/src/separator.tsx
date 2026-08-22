import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-[var(--ossie-color-border)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      role="separator"
      {...props}
    />
  ),
);

Separator.displayName = "Separator";
