import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { controlShapeClasses } from "./primitive-classes";

export const badgeVariants = cva(
  `inline-flex items-center ${controlShapeClasses} border px-[var(--ossie-space-2)] py-0.5 [font-size:var(--ossie-font-size-xs)] font-semibold leading-5`,
  {
    variants: {
      variant: {
        default:
          "border-[var(--ossie-color-neutral-border)] bg-[var(--ossie-color-neutral-subtle)] text-[var(--ossie-color-neutral-text)]",
        success:
          "border-[var(--ossie-color-success-border)] bg-[var(--ossie-color-success-subtle)] text-[var(--ossie-color-success-text)]",
        warning:
          "border-[var(--ossie-color-warning-border)] bg-[var(--ossie-color-warning-subtle)] text-[var(--ossie-color-warning-text)]",
        destructive:
          "border-[var(--ossie-color-danger-border)] bg-[var(--ossie-color-danger-subtle)] text-[var(--ossie-color-danger-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
