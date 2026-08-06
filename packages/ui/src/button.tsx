import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import {
  disabledClasses,
  focusVisibleClasses,
} from "./primitive-classes";

export const buttonVariants = cva(
  `inline-flex items-center justify-center gap-[var(--ossie-space-2)] whitespace-nowrap rounded-[var(--ossie-radius-control)] [font-size:var(--ossie-font-size-sm)] font-semibold transition-colors ${focusVisibleClasses} ${disabledClasses}`,
  {
    variants: {
      variant: {
        primary:
          "border border-[var(--ossie-color-action-primary)] bg-[var(--ossie-color-action-primary)] text-[var(--ossie-color-inverted)] hover:border-[var(--ossie-color-action-primary-hover)] hover:bg-[var(--ossie-color-action-primary-hover)]",
        secondary:
          "border border-[var(--ossie-color-border)] bg-[var(--ossie-color-action-secondary)] text-[var(--ossie-color-text)] hover:bg-[var(--ossie-color-action-secondary-hover)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--ossie-color-muted)] hover:bg-[var(--ossie-color-action-ghost-hover)] hover:text-[var(--ossie-color-text)]",
        destructive:
          "border border-[var(--ossie-color-action-destructive)] bg-[var(--ossie-color-action-destructive)] text-[var(--ossie-color-inverted)] hover:border-[var(--ossie-color-action-destructive-hover)] hover:bg-[var(--ossie-color-action-destructive-hover)]",
      },
      size: {
        sm: "h-[var(--ossie-control-height-compact)] px-[var(--ossie-space-3)]",
        md: "h-[var(--ossie-control-height)] px-[var(--ossie-space-4)]",
        lg: "h-[var(--ossie-control-height-tall)] px-[var(--ossie-space-5)]",
        icon: "h-[var(--ossie-control-height-icon)] w-[var(--ossie-control-height-icon)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
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
  )
);

Button.displayName = "Button";
