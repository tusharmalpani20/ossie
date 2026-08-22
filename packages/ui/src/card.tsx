import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, role, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--ossie-radius-card)] border border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)]",
        className,
      )}
      role={
        role ??
        (props["aria-label"] || props["aria-labelledby"] ? "region" : undefined)
      }
      {...props}
    />
  ),
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid gap-[var(--ossie-space-1)] p-[var(--ossie-space-5)]",
      className,
    )}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-6 tracking-normal",
      className,
    )}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-6 text-[var(--ossie-color-text-muted)]",
      className,
    )}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-[var(--ossie-space-5)] pt-0", className)}
    {...props}
  />
));

CardContent.displayName = "CardContent";
