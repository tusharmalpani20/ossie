import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ossie-radius-control)] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[var(--ossie-focus-ring-width)] focus-visible:ring-[var(--ossie-color-focus)] focus-visible:ring-offset-[var(--ossie-focus-ring-offset)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border border-[var(--ossie-color-accent)] bg-[var(--ossie-color-accent)] text-[var(--ossie-color-inverted)] hover:bg-[var(--ossie-color-accent-hover)] active:bg-[var(--ossie-color-accent-active)]",
        secondary:
          "border border-[var(--ossie-color-border)] bg-[var(--ossie-color-surface)] text-[var(--ossie-color-text)] hover:bg-[var(--ossie-color-surface-subtle)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--ossie-color-text-muted)] hover:bg-[var(--ossie-color-surface-subtle)] hover:text-[var(--ossie-color-text)]",
        destructive:
          "border border-[var(--ossie-color-danger)] bg-[var(--ossie-color-danger)] text-[var(--ossie-color-inverted)] hover:opacity-90",
      },
      size: {
        sm: "h-[var(--ossie-control-height-compact)] px-3",
        md: "h-[var(--ossie-control-height-standard)] px-4",
        lg: "h-[var(--ossie-control-height-comfortable)] px-5",
        icon: "h-[var(--ossie-control-height-icon)] w-[var(--ossie-control-height-icon)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  ),
);

Button.displayName = "Button";
